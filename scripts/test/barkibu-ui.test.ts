import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

test('Barkibu estimate appears before and during debrief', () => {
  const endConfirm = readFileSync(join(process.cwd(), 'src', 'components', 'EndConfirmScreen.tsx'), 'utf8');
  const debrief = readFileSync(join(process.cwd(), 'src', 'components', 'DebriefScreen.tsx'), 'utf8');

  assert.match(endConfirm, /BarkibuEstimateCard/);
  assert.match(endConfirm, /estimateBarkibuSupport/);
  assert.match(endConfirm, /state\.polyclinic\.patient \?\? state\.lastEncounter/);
  assert.match(debrief, /BarkibuEstimateCard/);
  assert.match(debrief, /barkibuEstimate && !evaluation/);
  assert.match(debrief, /state\.polyclinic\.patient \?\? state\.lastEncounter/);
});

test('empty debrief state names why no Barkibu bill is available', () => {
  const debrief = readFileSync(join(process.cwd(), 'src', 'components', 'DebriefScreen.tsx'), 'utf8');

  assert.match(debrief, /No completed encounter/);
  assert.match(debrief, /No bill yet/);
});

test('closed encounters keep a chart for debrief and Barkibu costs', () => {
  const store = readFileSync(join(process.cwd(), 'src', 'game', 'store.ts'), 'utf8');

  assert.match(store, /lastEncounter: snapshot \?\? this\.state\.lastEncounter/);
  assert.doesNotMatch(store, /hasEncounterActivity\(snapshot\)/);
});
