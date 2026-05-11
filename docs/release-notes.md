# Release Notes

## 2026-05-11 — AI voice actions for Barkibu cost accuracy

### Shipped

- Added an OpenRouter-backed voice action extractor that maps the consultation transcript to existing clickable actions: history questions, diagnostic tests, treatments, diagnosis, and prescriptions.
- Applied extracted voice actions to the same closed encounter snapshot used by the Examine overlay, debrief grader, and Barkibu estimate.
- Added an “AI voice actions” review card in wrap-up and debrief, showing matched actions, evidence quotes, confidence, and whether each action was applied.
- Updated the debrief request payload so the attending grader sees the transcript and voice-matched actions.
- Kept Barkibu as a pure cost calculator: it now benefits from the updated encounter state instead of doing its own language parsing.

### Verification

- `npm test`
- `npm run verify`
- `npm run build`
- `python3 -m py_compile backend/server.py`

## 2026-05-11 — Clinic ambience and 2.5D consultation companions

### Shipped

- Replaced the lobby music loop with a quiet clinic ambience loop: distant reception murmur, room tone, soft collar detail, and occasional dog/cat cues.
- Renamed the playback component from background music to clinic ambience, with matching mute labels and lower default volume.
- Added a premium 2.5D owner and pet presentation inside the 3D clinic: the owner, dog, and cat now render as canvas-textured clinical billboards instead of primitive toy-like meshes.
- Kept the previous procedural 3D characters as a fallback path while the new visual direction is validated.

### Verification

- `npm test`
- `npm run verify`
- `npm run build`
- Browser QA: checked local encounter screenshots for both dog and cat cases; owner, leash, dog, and cat carrier are visible in the 3D consultation room.

## 2026-05-11 — Barkibu cost accuracy and 3D patient polish

### Shipped

- Fixed the Barkibu estimate so wrap/debrief uses the closed encounter snapshot first, avoiding the previous fallback to a fresh empty patient that showed only the 55 EUR consultation line.
- Added a `Treat` tab in the examine overlay so procedures, medication actions, disposition, and follow-up plans can be recorded during the consultation and included in the Barkibu estimate.
- Made the Barkibu estimator more tolerant of completed-test snapshots and malformed older prescription data.
- Aligned pet-owner gender across the 3D model, voice selection, and persona prompt using owner names instead of a case-id hash.
- Refined the 3D owner and dog models with clearer female-owner presentation, breed-aware dog ears/muzzle proportions, collar detail, and less oversized dog scaling.

### Verification

- `npm test`
- `npm run verify`
- `npm run build`
- Browser QA: simulated a Luna encounter with ECG, electrolytes, toxin decontamination, and maropitant. Barkibu estimated bill displayed 268.95 EUR instead of 55 EUR.

## 2026-05-10 — 3D clinic realism and expanded veterinary cases

### Shipped

- Refined the 3D consultation scene with a more anatomical dog model, an open standing consult point, owner clothing details, and a visible leash connection between dog and owner.
- Added five complete veterinary cases: acute pancreatitis, feline asthma crisis, chronic kidney disease, cranial cruciate ligament injury, and corneal ulcer.
- Expanded diagnostic tests, treatments, medications, Barkibu educational costs, guideline references, and data-integrity checks to support the new cases.
- Moved the Barkibu cost card into the wrap/debrief flow so estimated bill, estimated reimbursement, and owner cost are visible even if the AI debrief is unavailable.
- Cleaned up the empty debrief layout: smaller status panel, no overlapping badge, narrower action buttons, and a clear no-bill state.

## 2026-05-10 — Lobby music replacement

### Fixed

- Replaced the lobby background asset that felt like grey noise with an original tonal music loop.
- Renamed the lobby file from `vetkit-lobby-ambient.wav` to `vetkit-lobby-music.wav` so the asset name matches the intended product behavior.
- Added a regression check that the lobby player references the music asset and rejects noise-like audio characteristics.

## 2026-05-10 — Audio playback fix

### Fixed

- Raised generated audio asset gain and playback volumes so lobby ambience, UI clicks, and debrief completion sounds are audible in normal browser playback.
- Kept short UI sound elements alive until playback ends, avoiding clipped or dropped click sounds.
- Added regression tests for WAV amplitude and playback volume constants.

## 2026-05-10 — Clinical premium redesign

### Shipped

- Set the new `clinical` palette as the default visual language.
- Reworked splash, home, pathway, case library, brief, encounter, examine, wrap, and debrief surfaces away from the previous playful look.
- Replaced decorative doodles, emoji controls, thick comic borders, and human cartoon placeholders with clinical cards, lucide icons, professional typography, and restrained animation.
- Added a veterinary clinic hero image, local lobby ambience, UI click sound, and case completion sound.
- Updated the 3D consultation room with cooler clinical lighting, neutral materials, less domestic decoration, and more believable dog/cat patient presentation.
- Kept Barkibu subtle: the product story remains in the debrief cost view and small clinical context, not a full branded skin.

### Verification

- `npm run build`
- `npm test`
- `npm run verify`
- Browser QA: splash, pathway, GP room, encounter 3D, examine overlay, wrap screen, mobile splash/pathway/GP room.

### Notes

- The local dev debrief can show the error fallback if `/agent/evaluate` is not running or lacks server secrets. Production smoke testing should validate the configured backend.
- Vite still reports the existing large bundle warning; this release does not change code-splitting.
