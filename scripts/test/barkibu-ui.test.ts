import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

test('Barkibu estimate appears before and during debrief', () => {
  const endConfirm = readFileSync(join(process.cwd(), 'src', 'components', 'EndConfirmScreen.tsx'), 'utf8');
  const debrief = readFileSync(join(process.cwd(), 'src', 'components', 'DebriefScreen.tsx'), 'utf8');

  assert.match(endConfirm, /BarkibuEstimateCard/);
  assert.match(endConfirm, /estimateBarkibuSupport/);
  assert.match(endConfirm, /state\.lastEncounter \?\? state\.polyclinic\.patient/);
  assert.match(debrief, /BarkibuEstimateCard/);
  assert.match(debrief, /barkibuEstimate && !evaluation/);
  assert.match(debrief, /state\.lastEncounter \?\? state\.polyclinic\.patient/);
});

test('empty debrief state names why no Barkibu bill is available', () => {
  const debrief = readFileSync(join(process.cwd(), 'src', 'components', 'DebriefScreen.tsx'), 'utf8');

  assert.match(debrief, /No completed encounter/);
  assert.match(debrief, /No bill yet/);
});

test('closed encounters keep a chart for debrief and Barkibu costs', () => {
  const store = readFileSync(join(process.cwd(), 'src', 'game', 'store.ts'), 'utf8');

  assert.match(store, /lastEncounter: completed \?\? this\.state\.lastEncounter/);
  assert.match(store, /applyVoiceClinicalActionsToPatient/);
  assert.doesNotMatch(store, /hasEncounterActivity\(snapshot\)/);
});

test('treatments can be recorded and included in Barkibu costs', () => {
  const store = readFileSync(join(process.cwd(), 'src', 'game', 'store.ts'), 'utf8');
  const overlay = readFileSync(join(process.cwd(), 'src', 'components', 'ExamineOverlay.tsx'), 'utf8');

  assert.match(store, /givePolyclinicTreatment/);
  assert.match(overlay, /TreatmentsTab/);
  assert.match(overlay, /store\.givePolyclinicTreatment/);
  assert.match(overlay, /givenTreatmentIds/);
});
