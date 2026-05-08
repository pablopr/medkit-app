# vetkit

Browser-based small-animal veterinary training simulator. You play the vet: dogs and cats arrive with worried pet parents, you take the history, order tests, diagnose, prescribe, and get graded by a senior veterinary attending.

> Training simulator. Cases, doses, costs, and Barkibu reimbursement estimates are plausible but synthetic. No clinical, insurance, or coverage claims.

---

## About

Vetkit is a voice-first AI consultation simulator for veterinary students, interns, and small-animal clinicians. You speak with the pet parent in real time, work through dog and cat cases, order veterinary diagnostics, prescribe, safety-net, and get a structured debrief. The grader cites a compact veterinary guideline registry (AAHA, WSAVA, ISFM, ACVIM) so it cannot fabricate sources.

The MVP also includes a Barkibu-style cost view at debrief: the actions you took become an educational bill, an 80% reimbursement estimate, and an approximate remaining owner cost.

Originally built in three days for a clinical-simulation hackathon by a medical-doctor-turned-software-engineer ([@bedriyan](https://github.com/bedriyan)).

## Barkibu roadmap

- **MVP: bill + reimbursement estimate** — implemented in the debrief from recorded tests, treatments, and prescriptions. It is educational only, not a coverage promise.
- **Post-MVP: Bai responsible copilot** — a side panel that nudges safe next steps during the consultation without giving final diagnoses or replacing the vet.
- **Post-MVP: continuous health checklist** — after the case, follow-up items for vaccines, parasite prevention, weight, revisits, and warning signs.

---

## What's inside

| Layer | Tech |
|---|---|
| Frontend | React 18 + TypeScript + Vite, Three.js (`@react-three/fiber`, `@react-three/drei`) |
| Voice transport | LiveKit Cloud (WebRTC) via `livekit-client` |
| Voice worker | Python `livekit-agents` — Deepgram Nova-3 STT → OpenRouter LLM → Cartesia Sonic-2 TTS |
| HTTP backend | FastAPI on `127.0.0.1:8787` — OpenRouter agent endpoints + LiveKit JWT mint |
| Attending grader | OpenRouter chat completion returning the `render_case_evaluation` JSON contract |
| State | Single `Store` class with `useSyncExternalStore` (no Redux/Zustand) |

Current MVP flow:
- **Small-animal clinic** — one dog or cat at a time, owner conversation, instant outpatient diagnostics, prescriptions, debrief, and Barkibu-style cost estimate.

---

## Prerequisites

- **Node.js 22+** (TS files are run natively via type-stripping)
- **Python 3.11+**
- A modern browser with mic permission (Chrome/Edge recommended for WebRTC)

---

## API keys you'll need

All keys are server-side only — the browser never sees them. Get one of each:

| Service | What it does | Where to get it | Free tier? |
|---|---|---|---|
| **OpenRouter** | Powers the attending grader, triage classifier, text chat, and patient voice persona | https://openrouter.ai → Keys | Pay-as-you-go, model-dependent |
| **LiveKit Cloud** | Real-time WebRTC transport between browser ↔ voice worker | https://cloud.livekit.io → create project → Settings → Keys (gives `URL`, `API Key`, `API Secret`) | Yes — generous free tier |
| **Deepgram** | Streaming speech-to-text inside the voice worker | https://console.deepgram.com → API Keys | Yes — $200 free credit |
| **Cartesia** | Streaming text-to-speech inside the voice worker | https://play.cartesia.ai → API Keys | Yes — free credit on signup |

---

## Setup

### 1. Frontend

```bash
npm install
```

### 2. Backend (two separate venvs)

The FastAPI server and the LiveKit voice worker have very different dependency trees, so they each get their own venv.

```bash
cd backend

# FastAPI server — small (FastAPI + OpenRouter HTTP calls + livekit-api)
python -m venv .venv
.venv/Scripts/python -m pip install -r requirements.txt

# Voice worker — larger (livekit-agents + Deepgram/Cartesia/Silero plugins)
python -m venv .venv-voice
.venv-voice/Scripts/python -m pip install -r voice_agent_requirements.txt
```

> On macOS/Linux replace `.venv/Scripts/python` with `.venv/bin/python`.

### 3. Configure secrets

```bash
cp backend/.env.example backend/.env.local
```

Fill in `backend/.env.local`:

```env
OPENROUTER_API_KEY=sk-or-...
OPENROUTER_MODEL=openai/gpt-5.2
OPENROUTER_GRADER_MODEL=openai/gpt-5.2
OPENROUTER_TRIAGE_MODEL=openai/gpt-5.2
OPENROUTER_PATIENT_MODEL=openai/gpt-5.2
OPENROUTER_VOICE_MODEL=openai/gpt-5.2
OPENROUTER_SITE_URL=http://localhost:5173
OPENROUTER_APP_NAME=Vetkit

LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=APIxxxx
LIVEKIT_API_SECRET=...
DEEPGRAM_API_KEY=...
CARTESIA_API_KEY=...
```

## Run (three terminals)

```bash
# Terminal 1 — frontend
npm run dev
# Vite serves http://localhost:5173

# Terminal 2 — FastAPI backend
backend/.venv/Scripts/python backend/server.py
# Listens on http://127.0.0.1:8787 (proxied by Vite at /agent/* and /voice/*)

# Terminal 3 — LiveKit voice worker
backend/.venv-voice/Scripts/python backend/voice_agent.py dev
# Logs "registered worker" once connected to LiveKit Cloud
```

All three must be up for voice. The frontend works without the worker — you'll just lose real-time voice (text chat still works).

Open http://localhost:5173 and grant microphone permission when prompted.

---

## Useful scripts

```bash
npm run build      # tsc + vite build
npm run preview    # preview production build
npm run verify     # deterministic invariants over src/data/* — run after editing cases/tests/treatments
npm run test       # custom-tools + loop-commands tests
```

---

## Project layout

```
src/
  game/               # Store, types, single source of truth
  data/               # Patients, tests, treatments, medications, guidelines (pure data)
  components/         # React UI
  components/three/   # Three.js scenes (ER room, polyclinic)
  voice/              # LiveKit conversation + persona builders
  agents/             # OpenRouter debrief hook + custom-tool UI renderer
backend/
  server.py           # FastAPI: OpenRouter endpoints + /voice/token
  voice_agent.py      # LiveKit Agents worker (Deepgram → OpenRouter → Cartesia)
.claude/skills/       # Authoring skills (patient generator, rubric author, guideline curator, ...)
scripts/verify/       # Deterministic data-integrity checks
```

---

## Model routing

| Call | Model | Why |
|---|---|---|
| Patient voice persona | `OPENROUTER_VOICE_MODEL` | Real-time in-character reply |
| Text patient persona | `OPENROUTER_PATIENT_MODEL` | Right-sidebar typed chat |
| `vetkit-attending` grading | `OPENROUTER_GRADER_MODEL` | Veterinary clinical reasoning, structured debrief JSON |
| Triage classifier | `OPENROUTER_TRIAGE_MODEL` | One-shot veterinary urgency classification |

---

## Notes

- **Group policy on Windows:** scripts call `node node_modules/<pkg>/bin/<entry>.js` instead of the `.bin` shims because some corporate machines block `.exe` wrappers under `node_modules/`. Keep this pattern when adding new scripts.
- **Out of scope:** multi-agent handoffs, persistent user accounts, anything claiming clinical accuracy.

---

## License

Private — hackathon submission. Not licensed for redistribution.
