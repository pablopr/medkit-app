"""End-to-end smoke test for the Vetkit backend.

Run this before a demo to confirm the OpenRouter-era backend is alive.
It exercises every endpoint the browser uses, in order, and prints a
concise PASS/FAIL per step so you can spot a regression in seconds.

Usage:

    backend/.venv/Scripts/python.exe backend/smoke_test.py

Exits 0 if every step passes, 1 otherwise. Safe to run repeatedly; it
does not hit the OpenRouter API; it only checks local route wiring.
"""

from __future__ import annotations

import json
import sys
import urllib.error
import urllib.request
from typing import Any, Optional

BASE = "http://127.0.0.1:8787"
TIMEOUT = 20.0


def _request(
    method: str,
    path: str,
    body: Optional[dict] = None,
) -> tuple[int, dict | str]:
    url = f"{BASE}{path}"
    data = None
    headers: dict[str, str] = {}
    if body is not None:
        data = json.dumps(body).encode("utf-8")
        headers["Content-Type"] = "application/json; charset=utf-8"
    req = urllib.request.Request(url, data=data, method=method, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT) as resp:
            payload = resp.read().decode("utf-8", errors="replace")
            status = resp.status
    except urllib.error.HTTPError as e:
        payload = e.read().decode("utf-8", errors="replace")
        status = e.code
    try:
        return status, json.loads(payload)
    except ValueError:
        return status, payload


class Reporter:
    def __init__(self) -> None:
        self.failures: list[str] = []
        self.passed = 0

    def check(self, name: str, condition: bool, detail: Any = "") -> None:
        if condition:
            self.passed += 1
            print(f"PASS  {name}")
            return
        self.failures.append(f"{name} — {detail}")
        print(f"FAIL  {name}  ({detail})")

    def done(self) -> int:
        print(
            f"\n{self.passed} passed, {len(self.failures)} failed."
        )
        return 1 if self.failures else 0


def main() -> int:
    r = Reporter()

    # ─── 1. /health ────────────────────────────────────────────────
    status, body = _request("GET", "/health")
    r.check("GET /health returns 200", status == 200, f"status={status}")
    if isinstance(body, dict):
        agent = body.get("agent") or {}
        r.check(
            "health: provider is OpenRouter",
            agent.get("provider") == "openrouter",
            agent,
        )
        r.check(
            "health: OPENROUTER_API_KEY configured",
            bool(agent.get("api_key_configured")),
            "set OPENROUTER_API_KEY in backend/.env.local",
        )
    else:
        r.check("health body parses as JSON", False, body)
        return r.done()

    # ─── 2. /agent/bootstrap (idempotent) ──────────────────────────
    status, body = _request("POST", "/agent/bootstrap")
    r.check("POST /agent/bootstrap returns 200", status == 200, f"status={status} body={body}")
    if isinstance(body, dict):
        r.check(
            "bootstrap: compatibility no-op",
            body.get("created") is False,
            f"got {body.get('created')!r}",
        )

    # ─── 3. /agent/sessions (create) ───────────────────────────────
    status, body = _request("POST", "/agent/sessions", {"title": "smoke_test"})
    r.check("POST /agent/sessions returns 200", status == 200, f"status={status} body={body}")
    session_id: Optional[str] = None
    if isinstance(body, dict):
        session_id = body.get("session_id")
        r.check("session_id returned", bool(session_id), "no session_id in response")
    if not session_id:
        return r.done()

    # ─── 4. /agent/sessions/{id} (retrieve) ────────────────────────
    status, body = _request("GET", f"/agent/sessions/{session_id}")
    r.check("GET /agent/sessions/{id} returns 200", status == 200, f"status={status}")

    # ─── 5. /agent/sessions/{id}/events (compat send) ──────────────
    status, body = _request(
        "POST",
        f"/agent/sessions/{session_id}/events",
        {
            "events": [
                {
                    "type": "user.message",
                    "content": [
                        {
                            "type": "text",
                            "text": (
                                "[vet arrival] dog severity=urgent. "
                                "HR 144 RR 32 temp 39.2. Emit nothing."
                            ),
                        }
                    ],
                }
            ]
        },
    )
    r.check("POST /events returns 200", status == 200, f"status={status} body={body}")

    # ─── 6. /agent/sessions/{id}/events (list) ─────────────────────
    status, body = _request("GET", f"/agent/sessions/{session_id}/events?limit=50")
    r.check("GET /events (list) returns 200", status == 200, f"status={status}")
    if isinstance(body, dict):
        data = body.get("data") or []
        r.check(
            "list: compatibility history is empty",
            len(data) == 0,
            f"got {len(data)} events",
        )

    # ─── 7. /agent/refresh (no-op schema change) ───────────────────
    status, body = _request("POST", "/agent/refresh")
    r.check("POST /agent/refresh returns 200", status == 200, f"status={status}")

    return r.done()


if __name__ == "__main__":
    sys.exit(main())
