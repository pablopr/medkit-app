import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { estimateBarkibuSupport } from '../../src/data/barkibuEstimate.ts';
import { applyVoiceClinicalActionsToPatient } from '../../src/game/voiceClinicalActions.ts';
import type { ActivePatient, VoiceClinicalAction } from '../../src/game/types.ts';

function encounter(): ActivePatient {
  const now = Date.now();
  return {
    case: {
      id: 'test-case',
      name: 'Luna',
      age: 3,
      gender: 'F',
      species: 'dog',
      breed: 'Labrador Retriever',
      weightKg: 24.5,
      neuterStatus: 'spayed',
      ownerName: 'Marta',
      severity: 'urgent',
      arrivalBlurb: 'Synthetic test case',
      presentingComplaint: 'Synthetic test complaint',
      chiefComplaint: 'Synthetic test complaint',
      vitals: {
        hr: 120,
        rr: 28,
        temp: 38.5,
        mmColor: 'pink',
        crtSec: 1.5,
        hydration: 'normal',
        painScore: 1,
        mentation: 'bright',
      },
      anamnesis: [
        {
          id: 'q-chocolate-amount',
          question: 'How much chocolate did Luna eat?',
          answer: 'About half a dark chocolate bar.',
          relevant: true,
        },
      ],
      testResults: [],
      correctDiagnosisId: 'theobromine-toxicosis',
      acceptableTreatmentIds: [],
      criticalTreatmentIds: [],
      diagnosisOptions: ['theobromine-toxicosis', 'acute-gastroenteritis'],
    },
    bedIndex: -10,
    status: 'discharged',
    askedQuestionIds: [],
    orderedTestIds: [],
    testOrderedAt: {},
    completedTestIds: [],
    givenTreatmentIds: [],
    submittedDiagnosisId: null,
    arrivedAt: now - 60_000,
    deadlineMs: now + 60_000,
    prescriptions: [],
  };
}

const actions: VoiceClinicalAction[] = [
  {
    type: 'history',
    id: 'q-chocolate-amount',
    label: 'How much chocolate did Luna eat?',
    evidence: 'How much chocolate did Luna eat?',
    confidence: 0.95,
    source: 'voice_ai',
  },
  {
    type: 'test',
    id: 'vet-cbc',
    label: 'CBC w/ Differential',
    evidence: 'I will run a CBC.',
    confidence: 0.94,
    source: 'voice_ai',
  },
  {
    type: 'treatment',
    id: 'vet-iv-fluids',
    label: 'IV crystalloid fluids',
    evidence: 'Start IV fluids.',
    confidence: 0.92,
    source: 'voice_ai',
  },
  {
    type: 'diagnosis',
    id: 'theobromine-toxicosis',
    label: 'Theobromine toxicosis',
    evidence: 'This is theobromine toxicosis.',
    confidence: 0.91,
    source: 'voice_ai',
  },
  {
    type: 'prescription',
    medicationId: 'maropitant',
    label: 'Maropitant',
    evidence: 'Send Luna home with maropitant.',
    confidence: 0.88,
    source: 'voice_ai',
  },
];

test('AI voice actions apply to the same state Barkibu uses for costs', () => {
  const p = applyVoiceClinicalActionsToPatient(
    encounter(),
    actions,
    { status: 'applied', model: 'test-model', extractedAt: Date.now() },
    [{ role: 'user', content: 'I will run a CBC, start IV fluids, diagnose theobromine toxicosis, and prescribe maropitant.' }],
  );

  assert.deepEqual(p.askedQuestionIds, ['q-chocolate-amount']);
  assert.deepEqual(p.orderedTestIds, ['vet-cbc']);
  assert.deepEqual(p.completedTestIds, ['vet-cbc']);
  assert.deepEqual(p.givenTreatmentIds, ['vet-iv-fluids']);
  assert.equal(p.submittedDiagnosisId, 'theobromine-toxicosis');
  assert.equal(p.prescriptions?.[0]?.medicationId, 'maropitant');
  assert.equal(p.voiceClinicalActions?.every((action) => action.applied), true);

  const estimate = estimateBarkibuSupport(p);
  assert.equal(estimate.lineItems.some((item) => item.id === 'test:vet-cbc'), true);
  assert.equal(estimate.lineItems.some((item) => item.id === 'treatment:vet-iv-fluids'), true);
  assert.equal(estimate.lineItems.some((item) => item.id === 'medication:maropitant'), true);
  assert.ok(estimate.subtotal > 55);
});

test('AI voice actions do not overwrite a different clicked diagnosis', () => {
  const p = encounter();
  p.submittedDiagnosisId = 'acute-gastroenteritis';
  const updated = applyVoiceClinicalActionsToPatient(
    p,
    [actions[3]],
    { status: 'applied', extractedAt: Date.now() },
  );

  assert.equal(updated.submittedDiagnosisId, 'acute-gastroenteritis');
  assert.equal(updated.voiceClinicalActions?.[0]?.applied, false);
  assert.match(updated.voiceClinicalActions?.[0]?.reason ?? '', /already submitted/i);
});

test('voice action extraction is OpenRouter-backed and visible in UI', () => {
  const backend = readFileSync(join(process.cwd(), 'backend', 'server.py'), 'utf8');
  const client = readFileSync(join(process.cwd(), 'src', 'agents', 'voiceActions.ts'), 'utf8');
  const encounterScreen = readFileSync(join(process.cwd(), 'src', 'components', 'EncounterScreen.tsx'), 'utf8');
  const reviewCard = readFileSync(join(process.cwd(), 'src', 'components', 'VoiceActionReviewCard.tsx'), 'utf8');

  assert.match(backend, /\/agent\/voice-actions\/extract/);
  assert.match(backend, /call_openrouter_chat/);
  assert.match(backend, /historyQuestions/);
  assert.match(client, /fetch\('\/agent\/voice-actions\/extract'/);
  assert.match(client, /historyQuestions/);
  assert.match(encounterScreen, /extractVoiceClinicalActions/);
  assert.match(reviewCard, /AI voice actions/);
  assert.match(reviewCard, /clickable action/);
});
