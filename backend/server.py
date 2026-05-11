"""
FastAPI backend for the Vetkit simulator.

Hosts the OpenRouter-backed vetkit-attending grader, the text patient
stream, and the real-time voice token mint endpoint (`/voice/token`).
Real-time voice itself runs in `voice_agent.py` as a separate LiveKit
Agents worker — this server only issues access tokens and pre-creates
rooms with patient persona metadata.

GET  /health         → backend + agent status report
POST /agent/...      → OpenRouter-backed agent endpoints
POST /voice/token    → mint LiveKit JWT for a patient room
"""

from __future__ import annotations

import os
import threading
from pathlib import Path
from typing import Any, Optional


def _load_env_local() -> None:
    """Minimal .env.local loader — no python-dotenv dependency.

    Reads `backend/.env.local` (next to this file) and sets any KEY=VALUE
    pair into ``os.environ`` without overwriting values already set.
    Silently no-ops if the file is missing."""
    env_path = Path(__file__).resolve().parent / ".env.local"
    if not env_path.exists():
        return
    for raw in env_path.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        # Overwrite if the existing value is empty (subprocesses can inherit
        # declared-but-empty env vars from the parent). Only preserve a
        # non-empty existing value.
        if key and not os.environ.get(key):
            os.environ[key] = value


_load_env_local()

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from slowapi.util import get_remote_address

# Shared secret protects /agent/* and /voice/* against direct curl abuse when
# an external reverse proxy injects it. Same-origin Vercel deployments are
# trusted through VERCEL_URL / PUBLIC_APP_URL because they do not need the old
# Render proxy middleware.
SHARED_SECRET = os.environ.get("BACKEND_SHARED_SECRET", "")


def _origin_from_host(value: str | None) -> str | None:
    if not value:
        return None
    value = value.strip().rstrip("/")
    if not value:
        return None
    if value.startswith(("http://", "https://")):
        return value
    return f"https://{value}"


_runtime_origins = {
    o
    for o in (
        _origin_from_host(os.environ.get("PUBLIC_APP_URL")),
        _origin_from_host(os.environ.get("VERCEL_URL")),
        _origin_from_host(os.environ.get("VERCEL_BRANCH_URL")),
        _origin_from_host(os.environ.get("VERCEL_PROJECT_PRODUCTION_URL")),
    )
    if o
}

ALLOWED_ORIGINS = [
    "https://vetkit.vercel.app",
    "https://medkit.vercel.app",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    *_runtime_origins,
]
DEV_ORIGINS = {
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
}

# Per-IP rate limit caps even authenticated abuse. SSE streams count as one
# request, so 120/min leaves plenty of headroom for legitimate use.
limiter = Limiter(key_func=get_remote_address, default_limits=["120/minute"])

app = FastAPI(title="Vetkit Backend", version="0.2.0")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


# Middleware ORDER (inside-out — last added runs first on inbound):
#   1. Auth          (innermost, added first)
#   2. SlowAPI       (rate limit)
#   3. CORS          (outermost, handles OPTIONS preflight before auth)
@app.middleware("http")
async def require_shared_secret(request: Request, call_next):
    path = request.url.path
    # /health is public for monitoring; CORS preflight runs above this anyway
    # but bypass OPTIONS defensively.
    if path == "/health" or request.method == "OPTIONS":
        return await call_next(request)
    origin = request.headers.get("origin", "")
    if origin in DEV_ORIGINS:
        return await call_next(request)
    if origin and origin in _runtime_origins:
        return await call_next(request)
    # Same-origin GETs (incl. EventSource) don't send Origin per the Fetch
    # spec, but they DO send Referer. Trust dev-origin Referer in lieu of
    # Origin so SSE streams from localhost work without an explicit secret.
    referer = request.headers.get("referer", "")
    if any(referer.startswith(o + "/") for o in DEV_ORIGINS):
        return await call_next(request)
    if any(referer.startswith(o + "/") for o in _runtime_origins):
        return await call_next(request)
    if SHARED_SECRET and request.headers.get("x-medkit-auth") == SHARED_SECRET:
        return await call_next(request)
    return JSONResponse({"detail": "unauthorized"}, status_code=401)


app.add_middleware(SlowAPIMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    """Frontend polls this before showing the attending dock so a missing
    API key surfaces a clearer error than a blank LLM failure."""
    has_key = bool(os.environ.get("OPENROUTER_API_KEY"))
    livekit_ok = bool(
        os.environ.get("LIVEKIT_URL")
        and os.environ.get("LIVEKIT_API_KEY")
        and os.environ.get("LIVEKIT_API_SECRET")
    )
    return {
        "ok": True,
        "voice": {
            "transport": "livekit",
            "livekit_configured": livekit_ok,
            "deepgram_configured": bool(os.environ.get("DEEPGRAM_API_KEY")),
            "cartesia_configured": bool(os.environ.get("CARTESIA_API_KEY")),
        },
        "agent": {
            "provider": "openrouter",
            "api_key_configured": has_key,
            "bootstrapped": has_key,
            "agent_id": "openrouter-direct" if has_key else None,
            "environment_id": "openrouter" if has_key else None,
            "model": GRADER_MODEL,
            "triage_model": TRIAGE_MODEL,
            "patient_model": PATIENT_MODEL,
            "voice_action_model": VOICE_ACTION_MODEL,
            # Kept for older smoke scripts that used this key name.
            "anthropic_sdk_installed": False,
        },
    }


# ───────────────────────────────────────────────────────────────────────────
# OpenRouter agent endpoints
# ───────────────────────────────────────────────────────────────────────────
#
# The browser talks to this server instead of OpenRouter directly so the
# API key stays server-side. OpenRouter exposes an OpenAI-compatible Chat
# Completions API rather than persistent agent sessions, so the
# production debrief path is now a direct backend endpoint that returns the
# same render_case_evaluation JSON contract the UI already knows how to render.
#
# Per-env vars:
#   OPENROUTER_API_KEY       — required. Server-side only; never exposed to
#                              the browser.
#   OPENROUTER_MODEL         — optional default for all OpenRouter calls.
#   OPENROUTER_GRADER_MODEL  — optional model for debrief grading.
#   OPENROUTER_TRIAGE_MODEL  — optional model for triage classification.
#   OPENROUTER_PATIENT_MODEL — optional model for text patient persona.
#   OPENROUTER_SITE_URL      — optional attribution URL for OpenRouter.
#   OPENROUTER_APP_NAME      — optional attribution title for OpenRouter.
#
# Endpoints:
#   POST /agent/debrief/evaluate               — OpenRouter debrief grader.
#   POST /agent/voice-actions/extract          — maps trainee speech to
#                                                existing Examine actions.
#   POST /agent/bootstrap                      — compatibility no-op for
#                                                old session-based clients.
#   POST /agent/sessions                       — compatibility session stub.
#   POST /agent/vault/ehr/lookup               — credential-vault demo:
#                                                attaches EHR_API_TOKEN
#                                                server-side and returns a
#                                                fake record.
#   POST /agent/triage/classify                — one-shot OpenRouter ESI
#                                                classifier for veterinary
#                                                arrivals. Stateless;
#                                                separate from debrief.

import asyncio
import json
import logging
import uuid

import httpx
from fastapi import Request
from fastapi.responses import StreamingResponse

# Structured logger for the agent endpoints. Uvicorn captures stdlib
# logging so these land in the same stream as its own access log.
_agent_log = logging.getLogger("medkit.agent")
_agent_log.setLevel(logging.INFO)
if not _agent_log.handlers:
    _h = logging.StreamHandler()
    _h.setFormatter(logging.Formatter("[medkit.agent] %(levelname)s %(message)s"))
    _agent_log.addHandler(_h)

# Compatibility guard for old /agent/bootstrap callers.
_bootstrap_lock = threading.Lock()

# SSE keepalive. EventSource will silently time out if the connection is
# idle past the browser's threshold (~30s for Chrome, longer elsewhere).
# We emit an SSE comment line every N seconds so the socket stays warm
# and the browser's `onerror` reconnect logic doesn't fire.
SSE_KEEPALIVE_SEC = 15.0


AGENT_NAME = "vetkit-attending"
OPENROUTER_BASE_URL = os.environ.get(
    "OPENROUTER_BASE_URL",
    "https://openrouter.ai/api/v1",
).rstrip("/")
OPENROUTER_DEFAULT_MODEL = os.environ.get("OPENROUTER_MODEL", "openai/gpt-5.2")
GRADER_MODEL = os.environ.get("OPENROUTER_GRADER_MODEL", OPENROUTER_DEFAULT_MODEL)
GRADER_MAX_TOKENS = int(os.environ.get("OPENROUTER_GRADER_MAX_TOKENS", "1800"))

# Direct-inference model for the dedicated triage-reasoning endpoint.
TRIAGE_MODEL = os.environ.get("OPENROUTER_TRIAGE_MODEL", OPENROUTER_DEFAULT_MODEL)
TRIAGE_MAX_TOKENS = 512
PATIENT_MODEL = os.environ.get("OPENROUTER_PATIENT_MODEL", OPENROUTER_DEFAULT_MODEL)
PATIENT_MAX_TOKENS = 256
VOICE_ACTION_MODEL = os.environ.get("OPENROUTER_VOICE_ACTION_MODEL", OPENROUTER_DEFAULT_MODEL)
VOICE_ACTION_MAX_TOKENS = int(os.environ.get("OPENROUTER_VOICE_ACTION_MAX_TOKENS", "1200"))
OPENROUTER_TIMEOUT_SEC = float(os.environ.get("OPENROUTER_TIMEOUT_SEC", "60"))

MEDKIT_ATTENDING_SYSTEM_PROMPT = (
    "You are the attending veterinarian supervising a trainee in a small-animal "
    "veterinary training simulator. Your role is to OBSERVE their decisions and "
    "GRADE the encounter. You are not an assistant, guide, or coach. Silence is "
    "acceptable and often correct.\n\n"

    "The simulator now runs a veterinary polyclinic: one dog or cat case at a "
    "time, with the pet parent giving the history. Events include "
    "[polyclinic arrival], [poly test], [poly diagnosis], [poly rx], and "
    "[disposition]. The animal never speaks for itself.\n\n"

    "Custom-tool usage:\n"
    "  • render_vitals_chart, render_patient_timeline, render_case_evaluation, "
    "flag_critical_finding, and lookup_ehr_history are available.\n"
    "  • Do not emit human ER triage badges or bed maps during polyclinic "
    "events; triage zones and hospital beds are not part of this MVP UI.\n"
    "  • flag_critical_finding is confirm-gated. Reserve it for imminent "
    "animal risk such as blocked cat collapse risk, severe dyspnea, shock, "
    "seizures, or toxin deterioration. Emit at most one flag per encounter.\n\n"

    "What you do:\n"
    "  • On [polyclinic arrival]: stay silent. Do not greet the pet parent or "
    "ask what the trainee wants to do.\n"
    "  • At debrief time: emit exactly one render_case_evaluation after the "
    "trainee has submitted a diagnosis.\n"
    "  • Any text you emit before debrief must be at most one observational "
    "sentence, never a question.\n\n"

    "Debrief mode:\n"
    "When you receive a [debrief request] message, grade the completed "
    "encounter. The JSON contains case_id, species, breed, weight_kg, owner "
    "name, correctDiagnosisId, rubric, registry_slice, and encounter_log. "
    "The log includes owner-history questions asked, tests ordered, treatments, "
    "prescriptions, diagnosis, and transcript if available.\n\n"

    "Process:\n"
    "  1. For every rubric criterion, decide {met, partially-met, missed} using "
    "the criterion evidence field as the match key. Quote the trainee or name "
    "the action actually taken.\n"
    "  2. Compute domain_scores: met = 1.0x weight, partially-met = 0.5x. "
    "Verdict bands: >=0.85 excellent, >=0.70 good, >=0.55 satisfactory, "
    ">=0.40 borderline, otherwise clear-fail.\n"
    "  3. Set safety_breach if the trainee missed urgent escalation, used a "
    "contraindicated drug, ignored weight/species risk, or closed without "
    "safety-netting on a high-risk animal.\n"
    "  4. Pick 1-3 specific highlights and 1-3 priority improvements.\n"
    "  5. Write a concise senior-veterinarian teaching narrative. No generic "
    "encouragement and no advice for real patients.\n"
    "  6. Emit one render_case_evaluation tool use with the full payload. Then stop.\n\n"

    "Hard rules:\n"
    "  • Cite, do not invent. Every clinical_management guideline_ref must "
    "appear in registry_slice. If it does not, drop that criterion.\n"
    "  • Keep the owner/animal distinction clear. The speaker is the pet parent; "
    "the patient is the animal.\n"
    "  • Cases are synthetic and medication doses are simplified. Do not frame "
    "anything as real veterinary advice.\n"
    "  • Barkibu cost estimates are rendered by the frontend only. Do not invent "
    "insurance coverage, policy terms, exclusions, or reimbursement promises."
)

# Custom tool JSON schemas — must match the Zod schemas in
# src/agents/customTools.ts. If you change either side, update both.
MEDKIT_CUSTOM_TOOLS: list[dict] = [
    {
        "type": "custom",
        "name": "render_vitals_chart",
        "description": (
            "Display the animal patient's vitals (HR, RR, temp, mucous membranes, "
            "CRT, hydration, pain, mentation) as a "
            "line chart over the course of the encounter."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "patient_id": {"type": "string"},
            },
            "required": ["patient_id"],
        },
    },
    {
        "type": "custom",
        "name": "render_bed_map",
        "description": (
            "Display the current bed occupancy map across the four ER beds."
        ),
        "input_schema": {
            "type": "object",
            "properties": {},
        },
    },
    {
        "type": "custom",
        "name": "render_triage_badge",
        "description": (
            "Display a triage-priority badge with a one-line rationale."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "zone": {"type": "string", "enum": ["red", "yellow", "green"]},
                "reason": {"type": "string"},
            },
            "required": ["zone", "reason"],
        },
    },
    {
        "type": "custom",
        "name": "render_patient_timeline",
        "description": (
            "Display the tests ordered and treatments given for a patient "
            "in chronological order."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "patient_id": {"type": "string"},
            },
            "required": ["patient_id"],
        },
    },
    {
        # End-of-encounter OSCE debrief. Replaces the older
        # `render_case_grade` (a flat score+notes blob): this one carries
        # a per-criterion verdict, three-domain scores, citations into the
        # guideline registry the frontend ships with the debrief request,
        # and a 1–2 paragraph spoken-aloud narrative. The renderer
        # `<CaseEvaluationCard>` resolves every `guideline_ref` against the
        # registry and shows a verbatim cite-card next to each criterion.
        #
        # The Zod schema in src/agents/customTools.ts must mirror this; if
        # you change one, update the other.
        "type": "custom",
        "name": "render_case_evaluation",
        "description": (
            "End-of-encounter PLAB2-style debrief. Emit exactly once after "
            "the trainee submits their diagnosis (and prescription, in "
            "polyclinic). Score three domains (data_gathering, clinical_"
            "management, interpersonal) against the case rubric provided "
            "in the debrief request. Each criterion verdict (met / "
            "partially-met / missed) must be backed by a transcript quote "
            "or a named action. Every clinical_management criterion's "
            "guideline_ref MUST be a real recommendation id present in the "
            "guideline registry slice that accompanies the debrief request "
            "— if no rec applies, drop the criterion. Never fabricate."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "case_id": {"type": "string"},
                "global_rating": {
                    "type": "string",
                    "enum": [
                        "clear-fail",
                        "borderline",
                        "satisfactory",
                        "good",
                        "excellent",
                    ],
                },
                "domain_scores": {
                    "type": "object",
                    "properties": {
                        "data_gathering": {
                            "type": "object",
                            "properties": {
                                "raw": {"type": "number"},
                                "max": {"type": "number"},
                                "verdict": {
                                    "type": "string",
                                    "enum": [
                                        "clear-fail",
                                        "borderline",
                                        "satisfactory",
                                        "good",
                                        "excellent",
                                    ],
                                },
                            },
                            "required": ["raw", "max", "verdict"],
                        },
                        "clinical_management": {
                            "type": "object",
                            "properties": {
                                "raw": {"type": "number"},
                                "max": {"type": "number"},
                                "verdict": {
                                    "type": "string",
                                    "enum": [
                                        "clear-fail",
                                        "borderline",
                                        "satisfactory",
                                        "good",
                                        "excellent",
                                    ],
                                },
                            },
                            "required": ["raw", "max", "verdict"],
                        },
                        "interpersonal": {
                            "type": "object",
                            "properties": {
                                "raw": {"type": "number"},
                                "max": {"type": "number"},
                                "verdict": {
                                    "type": "string",
                                    "enum": [
                                        "clear-fail",
                                        "borderline",
                                        "satisfactory",
                                        "good",
                                        "excellent",
                                    ],
                                },
                            },
                            "required": ["raw", "max", "verdict"],
                        },
                    },
                    "required": [
                        "data_gathering",
                        "clinical_management",
                        "interpersonal",
                    ],
                },
                "criteria": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "criterion_id": {"type": "string"},
                            "domain": {
                                "type": "string",
                                "enum": [
                                    "data_gathering",
                                    "clinical_management",
                                    "interpersonal",
                                ],
                            },
                            "verdict": {
                                "type": "string",
                                "enum": ["met", "partially-met", "missed"],
                            },
                            "evidence": {"type": "string"},
                            "guideline_ref": {
                                "type": ["string", "null"],
                                "description": (
                                    "Format: '<guideline_id>:<rec_id>'. "
                                    "Required for clinical_management; "
                                    "optional elsewhere; null if not "
                                    "applicable."
                                ),
                            },
                        },
                        "required": [
                            "criterion_id",
                            "domain",
                            "verdict",
                            "evidence",
                        ],
                    },
                },
                "safety_breach": {
                    "type": ["object", "null"],
                    "description": (
                        "Set ONLY when the trainee did something dangerous "
                        "(contraindicated drug, missed red flag, no safety-"
                        "netting on a high-risk dx). The narrative must "
                        "lead with this regardless of total score."
                    ),
                    "properties": {
                        "what": {"type": "string"},
                        "guideline_ref": {"type": ["string", "null"]},
                    },
                },
                "highlights": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "1–3 specific strengths.",
                },
                "improvements": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "1–3 priority improvements.",
                },
                "narrative": {
                    "type": "string",
                    "description": (
                        "1–2 paragraph teaching debrief, written as if "
                        "spoken aloud by a senior clinician. No praise "
                        "sandwiches, no sycophancy."
                    ),
                },
            },
            "required": [
                "case_id",
                "global_rating",
                "domain_scores",
                "criteria",
                "highlights",
                "improvements",
                "narrative",
            ],
        },
    },
    {
        # Write-shaped tool: surfaces a disruptive banner in the trainee
        # UI. Gated by the frontend permission policy — the renderer shows
        # an approve/decline dialog and only acks once the human confirms.
        # Confirm-gated payload retained for legacy renderer flows.
        "type": "custom",
        "name": "flag_critical_finding",
        "description": (
            "Raise a disruptive critical-finding banner on the trainee's "
            "screen. Use ONLY when the patient is in imminent risk (peri-"
            "arrest vitals, stroke window closing, anaphylaxis). Requires "
            "explicit human confirmation before firing; do not expect the "
            "result immediately."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "patient_id": {"type": "string"},
                "severity": {"type": "string", "enum": ["critical", "urgent"]},
                "reason": {"type": "string"},
            },
            "required": ["patient_id", "severity", "reason"],
        },
    },
    {
        # Credential-vault demo tool. When the agent emits this, the
        # browser calls POST /agent/vault/ehr/lookup. The backend attaches
        # the EHR auth token from server-side state (env var) and returns
        # the fake record. The EHR_API_TOKEN never touches model context
        # or the browser.
        "type": "custom",
        "name": "lookup_ehr_history",
        "description": (
            "Retrieve the patient's prior EHR encounters and medication "
            "list from the hospital EHR system. The request is routed "
            "through the credential vault so your context never sees "
            "the EHR auth token."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "patient_id": {"type": "string"},
            },
            "required": ["patient_id"],
        },
    },
]

def _require_openrouter_api_key() -> str:
    key = os.environ.get("OPENROUTER_API_KEY")
    if not key:
        raise HTTPException(
            status_code=500,
            detail="OPENROUTER_API_KEY is not set server-side.",
        )
    return key


def _openrouter_headers() -> dict[str, str]:
    headers = {
        "Authorization": f"Bearer {_require_openrouter_api_key()}",
        "Content-Type": "application/json",
    }
    site_url = (
        os.environ.get("OPENROUTER_SITE_URL")
        or os.environ.get("PUBLIC_APP_URL")
        or os.environ.get("VERCEL_PROJECT_PRODUCTION_URL")
    )
    if site_url:
        headers["HTTP-Referer"] = _origin_from_host(site_url) or site_url
    app_name = os.environ.get("OPENROUTER_APP_NAME", "Vetkit")
    if app_name:
        headers["X-OpenRouter-Title"] = app_name
    return headers


def _strip_json_fence(raw: str) -> str:
    text = raw.strip()
    if text.startswith("```"):
        text = text.strip("`").strip()
        if text.lower().startswith("json"):
            text = text[4:].strip()
    return text


def _parse_json_text(raw: str) -> Any:
    text = _strip_json_fence(raw)
    try:
        return json.loads(text)
    except ValueError:
        decoder = json.JSONDecoder()
        for idx, ch in enumerate(text):
            if ch not in "[{":
                continue
            try:
                parsed, _ = decoder.raw_decode(text[idx:])
                return parsed
            except ValueError:
                continue
        raise


def _chat_completion_content(data: dict[str, Any]) -> str:
    choices = data.get("choices")
    if not isinstance(choices, list) or not choices:
        return ""
    message = choices[0].get("message") if isinstance(choices[0], dict) else None
    if not isinstance(message, dict):
        return ""
    content = message.get("content")
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        parts: list[str] = []
        for block in content:
            if isinstance(block, dict):
                text = block.get("text") or block.get("content")
                if isinstance(text, str):
                    parts.append(text)
        return "".join(parts)
    return ""


def _openrouter_error(resp: httpx.Response) -> str:
    try:
        parsed = resp.json()
    except ValueError:
        return resp.text[:1000]
    if isinstance(parsed, dict):
        err = parsed.get("error")
        if isinstance(err, dict):
            msg = err.get("message") or err.get("detail")
            if msg:
                return str(msg)
    return json.dumps(parsed, ensure_ascii=False)[:1000]


def call_openrouter_chat(
    *,
    model: str,
    messages: list[dict[str, Any]],
    max_tokens: int,
    temperature: float,
    response_format: Optional[dict[str, Any]] = None,
    session_id: Optional[str] = None,
) -> dict[str, Any]:
    payload: dict[str, Any] = {
        "model": model,
        "messages": messages,
        "max_tokens": max_tokens,
        "temperature": temperature,
    }
    if response_format is not None:
        payload["response_format"] = response_format
    if session_id:
        payload["session_id"] = session_id[:256]

    try:
        with httpx.Client(timeout=OPENROUTER_TIMEOUT_SEC) as client:
            resp = client.post(
                f"{OPENROUTER_BASE_URL}/chat/completions",
                headers=_openrouter_headers(),
                json=payload,
            )
    except httpx.RequestError as e:
        raise HTTPException(status_code=502, detail=f"OpenRouter request failed: {e}")
    if resp.status_code >= 400:
        raise HTTPException(
            status_code=502,
            detail=f"OpenRouter {resp.status_code}: {_openrouter_error(resp)}",
        )
    try:
        return resp.json()
    except ValueError as e:
        raise HTTPException(
            status_code=502,
            detail=f"OpenRouter returned invalid JSON: {e}",
        )


async def stream_openrouter_chat(
    *,
    model: str,
    messages: list[dict[str, Any]],
    max_tokens: int,
    temperature: float,
    session_id: Optional[str] = None,
):
    payload: dict[str, Any] = {
        "model": model,
        "messages": messages,
        "max_tokens": max_tokens,
        "temperature": temperature,
        "stream": True,
    }
    if session_id:
        payload["session_id"] = session_id[:256]
    timeout = httpx.Timeout(OPENROUTER_TIMEOUT_SEC, read=None)
    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            async with client.stream(
                "POST",
                f"{OPENROUTER_BASE_URL}/chat/completions",
                headers=_openrouter_headers(),
                json=payload,
            ) as resp:
                if resp.status_code >= 400:
                    body = (await resp.aread()).decode("utf-8", errors="replace")
                    yield {"error": f"OpenRouter {resp.status_code}: {body[:1000]}"}
                    return
                async for line in resp.aiter_lines():
                    if not line.startswith("data:"):
                        continue
                    raw = line.removeprefix("data:").strip()
                    if not raw or raw == "[DONE]":
                        if raw == "[DONE]":
                            break
                        continue
                    try:
                        event = json.loads(raw)
                    except ValueError:
                        continue
                    choices = event.get("choices")
                    if not isinstance(choices, list) or not choices:
                        continue
                    delta = choices[0].get("delta")
                    if not isinstance(delta, dict):
                        continue
                    content = delta.get("content")
                    if isinstance(content, str) and content:
                        yield {"text": content}
    except httpx.RequestError as e:
        yield {"error": f"OpenRouter request failed: {e}"}


def _tool_input_schema(tool_name: str) -> dict[str, Any]:
    for tool in MEDKIT_CUSTOM_TOOLS:
        if tool.get("name") == tool_name:
            schema = tool.get("input_schema")
            if isinstance(schema, dict):
                return schema
    raise RuntimeError(f"missing custom tool schema: {tool_name}")


CASE_EVALUATION_RESPONSE_FORMAT = {
    "type": "json_schema",
    "json_schema": {
        "name": "render_case_evaluation",
        "strict": False,
        "schema": _tool_input_schema("render_case_evaluation"),
    },
}


class BootstrapResponse(BaseModel):
    agent_id: str
    agent_version: int | None
    environment_id: str
    created: bool  # True if we created them this call, False if cached


@app.post("/agent/bootstrap", response_model=BootstrapResponse)
def bootstrap_agent():
    """Compatibility no-op for the former session-based client."""
    with _bootstrap_lock:
        return BootstrapResponse(
            agent_id="openrouter-direct",
            agent_version=None,
            environment_id="openrouter",
            created=False,
        )


class RefreshAgentResponse(BaseModel):
    agent_id: str
    version: int | None


@app.post("/agent/refresh", response_model=RefreshAgentResponse)
def refresh_agent():
    """Compatibility no-op; OpenRouter prompts live in this process."""
    return RefreshAgentResponse(agent_id="openrouter-direct", version=None)


class CreateSessionRequest(BaseModel):
    title: Optional[str] = None


class CreateSessionResponse(BaseModel):
    session_id: str


@app.post("/agent/sessions", response_model=CreateSessionResponse)
def create_session(req: CreateSessionRequest):
    _agent_log.info("compat create_session: %s", req.title or "vetkit training shift")
    return CreateSessionResponse(session_id=f"openrouter-{uuid.uuid4().hex}")


@app.get("/agent/sessions/{session_id}")
async def get_session(session_id: str):
    return {
        "id": session_id,
        "agent_id": "openrouter-direct",
        "provider": "openrouter",
        "status": "compatibility_stub",
    }


@app.post("/agent/sessions/{session_id}/events")
async def send_events(session_id: str, request: Request):
    try:
        body = await request.json()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"invalid JSON body: {e}")
    events = body.get("events") if isinstance(body, dict) else None
    if not isinstance(events, list) or not events:
        raise HTTPException(status_code=400, detail="events must be a non-empty list")
    _agent_log.info(
        "compat send_events ignored session_id=%s event_count=%d",
        session_id, len(events),
    )
    return {"ok": True}


@app.get("/agent/sessions/{session_id}/events")
async def list_events(session_id: str, limit: int = 1000):
    return {"data": []}


@app.get("/agent/sessions/{session_id}/stream")
async def stream_events(session_id: str, request: Request):
    """Compatibility SSE stream for stale clients.

    The current debrief UI uses `/agent/debrief/evaluate`, so this path
    only prevents older tabs from hanging forever.
    """

    async def generator():
        yield ": connected\n\n"
        payload = {
            "id": f"evt-{uuid.uuid4().hex}",
            "type": "session.status_terminated",
            "session_id": session_id,
            "reason": "OpenRouter direct debrief endpoint supersedes sessions.",
        }
        yield f"event: session.status_terminated\ndata: {json.dumps(payload)}\n\n"

    return StreamingResponse(
        generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache, no-transform",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  # disables nginx buffering if behind one
        },
    )


# ───────────────────────────────────────────────────────────────────────────
# Debrief grading — OpenRouter direct structured output
# ───────────────────────────────────────────────────────────────────────────


class DebriefEvaluateRequest(BaseModel):
    request: dict[str, Any]


def _format_debrief_user_message(req: dict[str, Any]) -> str:
    return "\n".join(
        [
            "[debrief request]",
            "The trainee has ended the encounter. Grade against the rubric.",
            "Return STRICT JSON ONLY matching the render_case_evaluation input schema.",
            "Do not wrap the response in a tool call or markdown fence.",
            "Use ONLY recIds from registry_slice.recommendations[].recId.",
            "",
            json.dumps(req, ensure_ascii=False, indent=2),
        ]
    )


def _normalize_case_evaluation(parsed: Any) -> dict[str, Any]:
    if not isinstance(parsed, dict):
        raise HTTPException(
            status_code=502,
            detail="debrief model returned JSON that is not an object",
        )
    # Defensive support for tool-call-shaped outputs if a model ignores the
    # "JSON only" instruction but still tries to emulate the old tool call.
    if parsed.get("name") == "render_case_evaluation" and isinstance(parsed.get("input"), dict):
        parsed = parsed["input"]
    elif isinstance(parsed.get("render_case_evaluation"), dict):
        parsed = parsed["render_case_evaluation"]
    required = [
        "case_id",
        "global_rating",
        "domain_scores",
        "criteria",
        "highlights",
        "improvements",
        "narrative",
    ]
    missing = [k for k in required if k not in parsed]
    if missing:
        raise HTTPException(
            status_code=502,
            detail=f"debrief model response missing fields: {', '.join(missing)}",
        )
    return parsed


def run_debrief_evaluation(req: dict[str, Any]) -> dict[str, Any]:
    data = call_openrouter_chat(
        model=GRADER_MODEL,
        max_tokens=GRADER_MAX_TOKENS,
        temperature=0.2,
        response_format=CASE_EVALUATION_RESPONSE_FORMAT,
        session_id=f"debrief-{req.get('case_id', 'unknown')}",
        messages=[
            {"role": "system", "content": MEDKIT_ATTENDING_SYSTEM_PROMPT},
            {"role": "user", "content": _format_debrief_user_message(req)},
        ],
    )
    raw = _chat_completion_content(data).strip()
    if not raw:
        raise HTTPException(
            status_code=502,
            detail="debrief model returned empty response",
        )
    try:
        parsed = _parse_json_text(raw)
    except ValueError as e:
        _agent_log.warning("debrief: malformed JSON from model: %s", raw[:300])
        raise HTTPException(
            status_code=502,
            detail=f"debrief model returned malformed JSON: {e}",
        )
    evaluation = _normalize_case_evaluation(parsed)
    _agent_log.info(
        "debrief: case=%s rating=%s model=%s",
        evaluation.get("case_id"),
        evaluation.get("global_rating"),
        GRADER_MODEL,
    )
    return evaluation


@app.post("/agent/debrief/evaluate")
def debrief_evaluate(req: DebriefEvaluateRequest):
    return run_debrief_evaluation(req.request)


# ───────────────────────────────────────────────────────────────────────────
# Voice action extraction — OpenRouter maps transcript to UI actions
# ───────────────────────────────────────────────────────────────────────────


VOICE_ACTION_SYSTEM_PROMPT = (
    "You convert a veterinary simulator transcript into structured UI actions. "
    "The trainee is the doctor. The assistant is the pet parent persona. "
    "Map ONLY explicit trainee commitments to actions that exist in the supplied "
    "catalog: history questions, tests, treatments, diagnosis options, and medications. Do not "
    "invent ids, diagnoses, insurance terms, costs, or clinical advice. "
    "Ignore pet-parent requests unless the trainee accepts them. Ignore "
    "negated, deferred, hypothetical, or differential-only statements. "
    "If the trainee asks a history question, match it to catalog.historyQuestions. "
    "If the trainee says they will order, run, give, start, prescribe, diagnose, "
    "or send home with a catalog item, emit the closest matching catalog action. "
    "Return strict JSON only."
)

VOICE_ACTION_RESPONSE_FORMAT = {
    "type": "json_schema",
    "json_schema": {
        "name": "voice_action_extraction",
        "strict": False,
        "schema": {
            "type": "object",
            "properties": {
                "actions": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "type": {
                                "type": "string",
                                "enum": ["history", "test", "treatment", "diagnosis", "prescription"],
                            },
                            "id": {"type": "string"},
                            "medicationId": {"type": "string"},
                            "label": {"type": "string"},
                            "evidence": {"type": "string"},
                            "confidence": {"type": "number"},
                            "dose": {"type": "string"},
                            "duration": {"type": "string"},
                        },
                        "required": ["type", "label", "evidence", "confidence"],
                    },
                },
                "ignored": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "evidence": {"type": "string"},
                            "reason": {"type": "string"},
                        },
                    },
                },
            },
            "required": ["actions"],
        },
    },
}


class VoiceActionExtractRequest(BaseModel):
    request: dict[str, Any]


def _format_voice_action_user_message(req: dict[str, Any]) -> str:
    return "\n".join(
        [
            "[voice action extraction]",
            "Return JSON shaped as { actions: [...] }.",
            "For history/test/treatment/diagnosis actions, set id to an id from the relevant catalog.",
            "For prescription actions, set medicationId to an id from catalog.medications.",
            "Use the exact catalog label when possible. Include a short trainee quote as evidence.",
            "",
            json.dumps(req, ensure_ascii=False, indent=2),
        ]
    )


def _catalog_label_map(req: dict[str, Any], key: str) -> dict[str, str]:
    catalog = req.get("catalog")
    if not isinstance(catalog, dict):
        return {}
    values = catalog.get(key)
    if not isinstance(values, list):
        return {}
    out: dict[str, str] = {}
    for item in values:
        if not isinstance(item, dict):
            continue
        item_id = item.get("id")
        label = item.get("label")
        if isinstance(item_id, str) and isinstance(label, str):
            out[item_id] = label
    return out


def _clean_short_text(value: Any, fallback: str = "", limit: int = 280) -> str:
    if not isinstance(value, str):
        return fallback
    text = " ".join(value.split())
    if len(text) > limit:
        return text[:limit].rstrip() + "..."
    return text


def _clamp_confidence(value: Any) -> float:
    try:
        score = float(value)
    except (TypeError, ValueError):
        return 0.0
    return max(0.0, min(1.0, round(score, 2)))


def _normalize_voice_actions(parsed: Any, req: dict[str, Any]) -> list[dict[str, Any]]:
    if not isinstance(parsed, dict):
        raise HTTPException(
            status_code=502,
            detail="voice action model returned JSON that is not an object",
        )
    raw_actions = parsed.get("actions")
    if not isinstance(raw_actions, list):
        raise HTTPException(
            status_code=502,
            detail="voice action model response missing actions array",
        )

    labels = {
        "history": _catalog_label_map(req, "historyQuestions"),
        "test": _catalog_label_map(req, "tests"),
        "treatment": _catalog_label_map(req, "treatments"),
        "diagnosis": _catalog_label_map(req, "diagnoses"),
        "prescription": _catalog_label_map(req, "medications"),
    }

    actions: list[dict[str, Any]] = []
    seen: set[tuple[str, str]] = set()
    for item in raw_actions:
        if not isinstance(item, dict):
            continue
        action_type = item.get("type")
        if action_type not in {"history", "test", "treatment", "diagnosis", "prescription"}:
            continue

        if action_type == "prescription":
            action_id = item.get("medicationId") or item.get("medication_id") or item.get("id")
        else:
            action_id = item.get("id")
        if not isinstance(action_id, str) or action_id not in labels[action_type]:
            continue

        key = (str(action_type), action_id)
        if key in seen:
            continue
        seen.add(key)

        evidence = _clean_short_text(item.get("evidence"))
        if not evidence:
            continue
        action: dict[str, Any] = {
            "type": action_type,
            "label": labels[action_type][action_id],
            "evidence": evidence,
            "confidence": _clamp_confidence(item.get("confidence")),
            "source": "voice_ai",
        }
        if action_type == "prescription":
            action["medicationId"] = action_id
            dose = _clean_short_text(item.get("dose"), limit=80)
            duration = _clean_short_text(item.get("duration"), limit=80)
            if dose:
                action["dose"] = dose
            if duration:
                action["duration"] = duration
        else:
            action["id"] = action_id
        actions.append(action)
    return actions


def run_voice_action_extraction(req: dict[str, Any]) -> dict[str, Any]:
    data = call_openrouter_chat(
        model=VOICE_ACTION_MODEL,
        max_tokens=VOICE_ACTION_MAX_TOKENS,
        temperature=0.0,
        response_format=VOICE_ACTION_RESPONSE_FORMAT,
        session_id=f"voice-actions-{req.get('case_id', 'unknown')}",
        messages=[
            {"role": "system", "content": VOICE_ACTION_SYSTEM_PROMPT},
            {"role": "user", "content": _format_voice_action_user_message(req)},
        ],
    )
    raw = _chat_completion_content(data).strip()
    if not raw:
        raise HTTPException(
            status_code=502,
            detail="voice action model returned empty response",
        )
    try:
        parsed = _parse_json_text(raw)
    except ValueError as e:
        _agent_log.warning("voice-actions: malformed JSON from model: %s", raw[:300])
        raise HTTPException(
            status_code=502,
            detail=f"voice action model returned malformed JSON: {e}",
        )
    actions = _normalize_voice_actions(parsed, req)
    _agent_log.info(
        "voice-actions: case=%s actions=%d model=%s",
        req.get("case_id"),
        len(actions),
        VOICE_ACTION_MODEL,
    )
    return {"actions": actions, "model": VOICE_ACTION_MODEL}


@app.post("/agent/voice-actions/extract")
def voice_action_extract(req: VoiceActionExtractRequest):
    return run_voice_action_extraction(req.request)


# ───────────────────────────────────────────────────────────────────────────
# Credential vault — hospital EHR stub
# ───────────────────────────────────────────────────────────────────────────
#
# Demo of Michael's "credential vault" pattern: a third-party system
# (fake hospital EHR) needs an auth token to query patient history. The
# token lives ONLY on the backend (EHR_API_TOKEN env var). The agent's
# context window never sees it, the browser never sees it, and it never
# appears in any model-bound event or browser response.
#
# Flow:
#   1. Agent emits agent.custom_tool_use name=lookup_ehr_history.
#   2. Browser receives the event, POSTs to /agent/vault/ehr/lookup.
#   3. This endpoint attaches EHR_API_TOKEN server-side, calls the fake
#      EHR (local dict for the demo; would be an HTTP call in prod),
#      and returns the history JSON.
#   4. Browser posts the JSON back as user.custom_tool_result.
#
# Logging is intentionally token-free — the log line records that the
# vault was used and which patient was queried, but never the token
# value. A grep for the token in logs should return zero hits.

FAKE_EHR_RECORDS: dict[str, dict] = {
    "poly-001": {
        "patient_id": "poly-001",
        "name": "Mehmet Demir",
        "prior_encounters": [
            {"date": "2025-11-14", "reason": "hypertension follow-up", "bp": "148/92"},
            {"date": "2025-07-02", "reason": "annual physical", "bp": "140/88"},
        ],
        "active_medications": [
            {"name": "lisinopril", "dose": "10 mg", "frequency": "daily"},
            {"name": "atorvastatin", "dose": "20 mg", "frequency": "nightly"},
        ],
        "allergies": ["penicillin — hives"],
    },
    "poly-002": {
        "patient_id": "poly-002",
        "name": "Ayşe Kaya",
        "prior_encounters": [
            {"date": "2026-01-22", "reason": "asthma exacerbation", "peak_flow": 320},
        ],
        "active_medications": [
            {"name": "albuterol", "dose": "90 mcg", "frequency": "PRN"},
            {"name": "fluticasone", "dose": "110 mcg", "frequency": "BID"},
        ],
        "allergies": [],
    },
    "er-101": {
        "patient_id": "er-101",
        "name": "John Williams",
        "prior_encounters": [
            {"date": "2024-12-03", "reason": "STEMI, PCI to LAD"},
        ],
        "active_medications": [
            {"name": "aspirin", "dose": "81 mg", "frequency": "daily"},
            {"name": "clopidogrel", "dose": "75 mg", "frequency": "daily"},
            {"name": "metoprolol", "dose": "25 mg", "frequency": "BID"},
        ],
        "allergies": [],
    },
}


class EhrLookupRequest(BaseModel):
    patient_id: str


class EhrLookupResponse(BaseModel):
    patient_id: str
    record: dict
    fetched_via: str  # always "credential-vault"; demo label


def _vault_token_configured() -> bool:
    """Whether the EHR vault is operable. Tests can force a known value
    by setting ``EHR_API_TOKEN`` in the process environment before
    importing ``server``."""
    return bool(os.environ.get("EHR_API_TOKEN"))


@app.post("/agent/vault/ehr/lookup", response_model=EhrLookupResponse)
def vault_ehr_lookup(req: EhrLookupRequest):
    """Look up a patient's EHR record through the credential vault.

    The browser calls this in response to an
    ``agent.custom_tool_use`` for ``lookup_ehr_history``. The auth token
    is read from the server process's environment, attached to the
    downstream call (simulated here by a dict read), and the result is
    returned without the token ever appearing in the response body or
    in any log line.
    """
    patient_id = req.patient_id.strip()
    if not patient_id:
        raise HTTPException(status_code=400, detail="patient_id is required")
    if not _vault_token_configured():
        raise HTTPException(
            status_code=503,
            detail=(
                "EHR_API_TOKEN is not configured server-side. Set it in "
                "backend/.env.local to enable the vault."
            ),
        )
    record = FAKE_EHR_RECORDS.get(patient_id)
    if record is None:
        raise HTTPException(status_code=404, detail=f"patient_id not found: {patient_id}")
    # Token-free log line — demonstrates the vault pattern.
    _agent_log.info("vault: ehr lookup patient=%s", patient_id)
    return EhrLookupResponse(
        patient_id=patient_id,
        record=record,
        fetched_via="credential-vault",
    )


# ───────────────────────────────────────────────────────────────────────────
# Triage-reasoning endpoint (direct OpenRouter inference)
# ───────────────────────────────────────────────────────────────────────────
#
# Separate from the vetkit-attending debrief endpoint. This endpoint is a
# one-shot ESI-style triage classification called at arrival.
#
# Design notes:
#   • Pure function `run_triage_reasoning(request, chat_completion=...)` so
#     unit tests can mock the OpenRouter HTTP boundary without spinning HTTP.
#   • The system prompt inlines the 5 ESI rules we actually apply. It
#     mirrors `.claude/skills/medkit-triage-logic.md` so keep them in sync
#     when either changes.
#   • Model output is constrained to JSON via explicit instruction +
#     assistant prefill; we parse defensively and raise on malformed
#     output so the caller sees a 502 rather than silent garbage.

ESI_TRIAGE_SYSTEM_PROMPT = (
    "You classify small-animal veterinary arrivals on a simplified 3-level "
    "ESI-style scale: 'critical' (needs immediate stabilization), 'urgent' "
    "(same-day veterinary care), or 'stable' (compensated outpatient case).\n\n"

    "Rules you apply, in priority order:\n"
    "1. RED FLAGS force 'critical' regardless of current vitals: blocked male "
    "cat or anuria; severe dyspnea; collapse; seizures; shock or poor "
    "perfusion; toxin ingestion with neurologic/cardiac signs; GDV concern; "
    "active hemorrhage; heatstroke; severe trauma; neonatal/puppy or kitten "
    "dehydration with depression.\n"
    "2. 'critical' also applies if the animal needs life-saving intervention "
    "now: airway/oxygen, hemodynamic support, urgent decompression, seizure "
    "control, or immediate decontamination/stabilization.\n"
    "3. 'urgent' applies to significant morbidity without current collapse: "
    "vomiting/diarrhea with dehydration, suspected CHF but compensated, painful "
    "urinary disease still passing urine, toxin exposure without red flags, "
    "moderate pain, fever with lethargy.\n"
    "4. 'stable' only when red flags and urgent criteria are absent, perfusion "
    "is compensated, and the chief complaint is low-acuity such as mild itch, "
    "routine preventive care, stable chronic follow-up, or mild lameness.\n"
    "5. If uncertain between two levels, choose the higher severity.\n\n"

    "Respond with STRICT JSON ONLY, no prose, matching:\n"
    '{"esi_level": "critical"|"urgent"|"stable", '
    '"rationale": "<one sentence citing specific vitals or red flags>", '
    '"red_flags": [<zero or more of the rule-1 phrases that apply>]}\n'
)


class VitalsSnapshot(BaseModel):
    hr: Optional[int] = None
    bp_systolic: Optional[int] = None
    bp_diastolic: Optional[int] = None
    spo2: Optional[int] = None
    rr: Optional[int] = None
    temp_c: Optional[float] = None


class TriageClassifyRequest(BaseModel):
    patient_id: str
    chief_complaint: str
    vitals: VitalsSnapshot
    ecg_findings: Optional[str] = None
    notes: Optional[str] = None


class TriageClassifyResponse(BaseModel):
    patient_id: str
    esi_level: str  # 'critical' | 'urgent' | 'stable'
    rationale: str
    red_flags: list[str]
    model: str


ALLOWED_ESI_LEVELS = {"critical", "urgent", "stable"}


def _format_triage_user_message(req: TriageClassifyRequest) -> str:
    v = req.vitals
    parts = [f"Patient {req.patient_id} — {req.chief_complaint}."]
    vitals_bits: list[str] = []
    if v.hr is not None:
        vitals_bits.append(f"HR {v.hr}")
    if v.bp_systolic is not None and v.bp_diastolic is not None:
        vitals_bits.append(f"BP {v.bp_systolic}/{v.bp_diastolic}")
    if v.spo2 is not None:
        vitals_bits.append(f"SpO2 {v.spo2}")
    if v.rr is not None:
        vitals_bits.append(f"RR {v.rr}")
    if v.temp_c is not None:
        vitals_bits.append(f"temp {v.temp_c}°C")
    if vitals_bits:
        parts.append("Vitals: " + ", ".join(vitals_bits) + ".")
    if req.ecg_findings:
        parts.append(f"ECG: {req.ecg_findings}.")
    if req.notes:
        parts.append(f"Notes: {req.notes}.")
    parts.append("Classify on the simplified ESI 3-level scale.")
    return " ".join(parts)


def run_triage_reasoning(
    req: TriageClassifyRequest,
    chat_completion=None,
) -> TriageClassifyResponse:
    """Invoke OpenRouter to classify a veterinary arrival."""
    if chat_completion is None:
        chat_completion = call_openrouter_chat
    data = chat_completion(
        model=TRIAGE_MODEL,
        max_tokens=TRIAGE_MAX_TOKENS,
        temperature=0.1,
        response_format={"type": "json_object"},
        session_id=f"triage-{req.patient_id}",
        messages=[
            {"role": "system", "content": ESI_TRIAGE_SYSTEM_PROMPT},
            {"role": "user", "content": _format_triage_user_message(req)},
        ],
    )
    raw = _chat_completion_content(data).strip()
    if not raw:
        raise HTTPException(
            status_code=502,
            detail="triage model returned empty response",
        )
    try:
        parsed = _parse_json_text(raw)
    except ValueError as e:
        _agent_log.warning("triage: malformed JSON from model: %s", raw[:200])
        raise HTTPException(
            status_code=502,
            detail=f"triage model returned malformed JSON: {e}",
        )
    esi = str(parsed.get("esi_level", "")).strip()
    if esi not in ALLOWED_ESI_LEVELS:
        raise HTTPException(
            status_code=502,
            detail=f"triage model returned invalid esi_level: {esi!r}",
        )
    rationale = str(parsed.get("rationale", "")).strip()
    red_flags_raw = parsed.get("red_flags", [])
    red_flags = [str(x) for x in red_flags_raw] if isinstance(red_flags_raw, list) else []
    _agent_log.info(
        "triage: patient=%s esi=%s flags=%d",
        req.patient_id, esi, len(red_flags),
    )
    return TriageClassifyResponse(
        patient_id=req.patient_id,
        esi_level=esi,
        rationale=rationale,
        red_flags=red_flags,
        model=TRIAGE_MODEL,
    )


@app.post("/agent/triage/classify", response_model=TriageClassifyResponse)
def triage_classify(req: TriageClassifyRequest):
    """OpenRouter one-shot ESI classification for veterinary arrivals."""
    return run_triage_reasoning(req)


# ───────────────────────────────────────────────────────────────────────────
# Patient persona streaming — OpenRouter
# ───────────────────────────────────────────────────────────────────────────
#
# The browser routes patient-persona text streaming through the backend so
# the OpenRouter key stays server-side. SSE frames carry `{"text": "..."}`
# deltas, terminated with `{"done": true}`.


class PatientChatMessage(BaseModel):
    role: str  # 'user' | 'assistant'
    content: str


class PatientStreamRequest(BaseModel):
    system: str
    messages: list[PatientChatMessage]


@app.post("/agent/patient/stream")
async def patient_stream(req: PatientStreamRequest):
    async def generator():
        try:
            async for event in stream_openrouter_chat(
                model=PATIENT_MODEL,
                max_tokens=PATIENT_MAX_TOKENS,
                temperature=0.8,
                session_id="patient-text",
                messages=[
                    {"role": "system", "content": req.system},
                    *[
                        {"role": m.role, "content": m.content}
                        for m in req.messages
                    ],
                ],
            ):
                if "error" in event:
                    yield "data: " + json.dumps({"error": event["error"]}) + "\n\n"
                    return
                text = event.get("text")
                if isinstance(text, str) and text:
                    yield "data: " + json.dumps({"text": text}) + "\n\n"
            yield "data: " + json.dumps({"done": True}) + "\n\n"
        except asyncio.CancelledError:
            raise
        except Exception as e:
            _agent_log.exception("patient stream failed")
            yield "data: " + json.dumps({"error": str(e)}) + "\n\n"

    return StreamingResponse(
        generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache, no-transform",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


# ───────────────────────────────────────────────────────────────────────────
# Real-time voice — LiveKit access tokens
# ───────────────────────────────────────────────────────────────────────────
#
# The frontend posts the persona payload here. We create the LiveKit room
# with that payload as room metadata (so the voice agent worker can read it
# at room-join time) and return a JWT the browser uses to connect.
#
# Persona prompt and initial line are produced by `src/voice/patientPersona.ts`
# in TS — Python doesn't duplicate the logic, it just relays.

import json as _json
import secrets as _secrets
import asyncio as _asyncio

from livekit import api as _lkapi


class VoiceTokenRequest(BaseModel):
    caseId: str
    systemPrompt: str
    initialLine: str
    gender: str  # 'M' | 'F' — speaker gender (parent for pediatric)
    voiceId: Optional[str] = None  # explicit override
    identity: Optional[str] = None  # browser-side participant identity


class VoiceTokenResponse(BaseModel):
    token: str
    url: str
    roomName: str


@app.post("/voice/token", response_model=VoiceTokenResponse)
async def voice_token(req: VoiceTokenRequest):
    lk_url = os.environ.get("LIVEKIT_URL")
    lk_key = os.environ.get("LIVEKIT_API_KEY")
    lk_secret = os.environ.get("LIVEKIT_API_SECRET")
    if not (lk_url and lk_key and lk_secret):
        raise HTTPException(
            status_code=500,
            detail="LIVEKIT_URL/LIVEKIT_API_KEY/LIVEKIT_API_SECRET not configured",
        )

    nonce = _secrets.token_urlsafe(8)
    safe_case = "".join(c for c in req.caseId if c.isalnum() or c in "-_")[:32] or "case"
    room_name = f"gr-{safe_case}-{nonce}"
    identity = req.identity or f"doctor-{_secrets.token_hex(4)}"

    metadata = _json.dumps(
        {
            "caseId": req.caseId,
            "systemPrompt": req.systemPrompt,
            "initialLine": req.initialLine,
            "voiceGender": req.gender,
            "voiceId": req.voiceId,
        }
    )

    # Pre-create the room so metadata is set before the agent dispatches in.
    # `agents=[RoomAgentDispatch(agent_name="medkit-voice")]` makes dispatch
    # explicit by name instead of relying on LiveKit's automatic region/cluster
    # matching, which fails when the room-creator (Render Oregon) and the
    # worker (registered in EU/Germany 2) are in different clouds.
    lkapi = _lkapi.LiveKitAPI(lk_url, lk_key, lk_secret)
    try:
        await lkapi.room.create_room(
            _lkapi.CreateRoomRequest(
                name=room_name,
                metadata=metadata,
                empty_timeout=120,
                agents=[
                    _lkapi.RoomAgentDispatch(
                        agent_name="medkit-voice",
                        metadata=metadata,
                    )
                ],
            )
        )
    except Exception as e:
        # If the room already exists (rare race), let it through.
        msg = str(e).lower()
        if "already" not in msg and "exists" not in msg:
            await lkapi.aclose()
            raise HTTPException(status_code=502, detail=f"livekit room create failed: {e}")
    finally:
        try:
            await lkapi.aclose()
        except Exception:
            pass

    token = (
        _lkapi.AccessToken(lk_key, lk_secret)
        .with_identity(identity)
        .with_name(identity)
        .with_grants(
            _lkapi.VideoGrants(
                room_join=True,
                room=room_name,
                can_publish=True,
                can_subscribe=True,
                can_publish_data=True,
            )
        )
        .to_jwt()
    )

    return VoiceTokenResponse(token=token, url=lk_url, roomName=room_name)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="127.0.0.1", port=8787, log_level="info")
