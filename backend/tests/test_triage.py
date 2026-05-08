"""Unit tests for the direct-inference triage classifier.

These tests mock the OpenRouter HTTP boundary so we can validate the code path
without hitting the API (and without needing a real key). Assertions:

    1. The OpenRouter call uses the configured triage model.
    2. The ESI-rules system prompt is passed as a system message.
    3. Well-formed JSON responses parse into a TriageClassifyResponse.
    4. Malformed / fenced JSON is parsed when possible, otherwise 502.
    5. Invalid esi_level values are rejected as 502 rather than silently
       returned to the caller.

Run with:

    backend/.venv/bin/python -m unittest backend.tests.test_triage
"""

from __future__ import annotations

import json
import os
import sys
import unittest
from pathlib import Path
from unittest.mock import MagicMock

os.environ.setdefault("OPENROUTER_API_KEY", "sk-or-test-dummy")
os.environ.setdefault("EHR_API_TOKEN", "test-token-not-relevant-here")

_BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(_BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(_BACKEND_DIR))

from fastapi import HTTPException  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

import server  # noqa: E402


def _fake_chat_completion(text: str) -> dict:
    return {"choices": [{"message": {"role": "assistant", "content": text}}]}


def _fake_client(return_text: str) -> MagicMock:
    return MagicMock(return_value=_fake_chat_completion(return_text))


WELL_FORMED_JSON = json.dumps(
    {
        "esi_level": "critical",
        "rationale": "Collapse with poor perfusion is a critical red flag.",
        "red_flags": ["collapse", "shock or poor perfusion"],
    }
)

SAMPLE_REQUEST = server.TriageClassifyRequest(
    patient_id="vet-101",
    chief_complaint="collapsed dog with pale gums",
    vitals=server.VitalsSnapshot(hr=180, spo2=91, rr=44, temp_c=39.4),
    notes="Pale mucous membranes, prolonged CRT, weak pulses.",
)


class TriageReasoningTests(unittest.TestCase):
    def test_uses_configured_openrouter_model(self) -> None:
        completion = _fake_client(WELL_FORMED_JSON)
        server.run_triage_reasoning(SAMPLE_REQUEST, chat_completion=completion)
        kwargs = completion.call_args.kwargs
        self.assertEqual(kwargs["model"], server.TRIAGE_MODEL)

    def test_system_prompt_contains_esi_rules(self) -> None:
        completion = _fake_client(WELL_FORMED_JSON)
        server.run_triage_reasoning(SAMPLE_REQUEST, chat_completion=completion)
        kwargs = completion.call_args.kwargs
        system = kwargs["messages"][0]["content"]
        self.assertIn("ESI", system)
        self.assertIn("red flag", system.lower())
        self.assertIn("critical", system)
        self.assertIn("urgent", system)
        self.assertIn("stable", system)

    def test_user_message_summarizes_the_patient(self) -> None:
        completion = _fake_client(WELL_FORMED_JSON)
        server.run_triage_reasoning(SAMPLE_REQUEST, chat_completion=completion)
        kwargs = completion.call_args.kwargs
        messages = kwargs["messages"]
        self.assertEqual(len(messages), 2)
        self.assertEqual(messages[1]["role"], "user")
        body = messages[1]["content"]
        self.assertIn("vet-101", body)
        self.assertIn("collapsed dog", body)
        self.assertIn("HR 180", body)
        self.assertIn("RR 44", body)
        self.assertIn("Pale mucous", body)

    def test_well_formed_response_parses(self) -> None:
        completion = _fake_client(WELL_FORMED_JSON)
        result = server.run_triage_reasoning(SAMPLE_REQUEST, chat_completion=completion)
        self.assertEqual(result.patient_id, "vet-101")
        self.assertEqual(result.esi_level, "critical")
        self.assertEqual(result.model, server.TRIAGE_MODEL)
        self.assertIn("critical", result.rationale)
        self.assertEqual(len(result.red_flags), 2)

    def test_json_fence_is_stripped(self) -> None:
        fenced = f"```json\n{WELL_FORMED_JSON}\n```"
        completion = _fake_client(fenced)
        result = server.run_triage_reasoning(SAMPLE_REQUEST, chat_completion=completion)
        self.assertEqual(result.esi_level, "critical")

    def test_bare_fence_is_stripped(self) -> None:
        fenced = f"```\n{WELL_FORMED_JSON}\n```"
        completion = _fake_client(fenced)
        result = server.run_triage_reasoning(SAMPLE_REQUEST, chat_completion=completion)
        self.assertEqual(result.esi_level, "critical")

    def test_malformed_json_raises_502(self) -> None:
        completion = _fake_client("this is not JSON at all, sorry")
        with self.assertRaises(HTTPException) as cm:
            server.run_triage_reasoning(SAMPLE_REQUEST, chat_completion=completion)
        self.assertEqual(cm.exception.status_code, 502)
        self.assertIn("malformed", cm.exception.detail)

    def test_invalid_esi_level_raises_502(self) -> None:
        bogus = json.dumps(
            {"esi_level": "ultra", "rationale": "r", "red_flags": []}
        )
        completion = _fake_client(bogus)
        with self.assertRaises(HTTPException) as cm:
            server.run_triage_reasoning(SAMPLE_REQUEST, chat_completion=completion)
        self.assertEqual(cm.exception.status_code, 502)

    def test_empty_response_raises_502(self) -> None:
        completion = _fake_client("")
        with self.assertRaises(HTTPException) as cm:
            server.run_triage_reasoning(SAMPLE_REQUEST, chat_completion=completion)
        self.assertEqual(cm.exception.status_code, 502)

    def test_missing_red_flags_defaults_to_empty_list(self) -> None:
        partial = json.dumps(
            {"esi_level": "stable", "rationale": "Mild itch, normal vitals."}
        )
        completion = _fake_client(partial)
        result = server.run_triage_reasoning(SAMPLE_REQUEST, chat_completion=completion)
        self.assertEqual(result.esi_level, "stable")
        self.assertEqual(result.red_flags, [])


class TriageEndpointIntegrationTests(unittest.TestCase):
    """HTTP-level smoke of the endpoint, patching the OpenRouter boundary."""

    def setUp(self) -> None:
        self.client = TestClient(server.app)
        self.client.headers.update({"Origin": "http://localhost:5173"})

    def test_endpoint_returns_response_from_mocked_client(self) -> None:
        fake = _fake_client(WELL_FORMED_JSON)
        original = server.call_openrouter_chat
        server.call_openrouter_chat = fake
        try:
            resp = self.client.post(
                "/agent/triage/classify",
                json={
                    "patient_id": "vet-101",
                    "chief_complaint": "collapsed dog",
                    "vitals": {"hr": 180, "spo2": 91, "rr": 44},
                    "notes": "Pale mucous membranes",
                },
            )
        finally:
            server.call_openrouter_chat = original
        self.assertEqual(resp.status_code, 200, resp.text)
        body = resp.json()
        self.assertEqual(body["esi_level"], "critical")
        self.assertEqual(body["model"], server.TRIAGE_MODEL)


if __name__ == "__main__":
    unittest.main()
