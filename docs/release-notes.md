# Release Notes

## 2026-05-10 — 3D clinic realism and expanded veterinary cases

### Shipped

- Refined the 3D consultation scene with a more anatomical dog model, a clinical guest chair, owner clothing details, and a visible leash connection between dog and owner.
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
