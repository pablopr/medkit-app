import test from 'node:test';
import assert from 'node:assert/strict';
import { estimateBarkibuSupport } from '../../src/data/barkibuEstimate.ts';
import type { ActivePatient } from '../../src/game/types.ts';

function encounter(weightKg = 24.5, severity: ActivePatient['case']['severity'] = 'urgent'): ActivePatient {
  const now = Date.now();
  return {
    case: {
      id: 'test-case',
      name: 'Luna',
      age: 3,
      gender: 'F',
      species: 'dog',
      breed: 'Labrador Retriever',
      weightKg,
      neuterStatus: 'spayed',
      ownerName: 'Marta',
      severity,
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
      anamnesis: [],
      testResults: [],
      correctDiagnosisId: 'theobromine-toxicosis',
      acceptableTreatmentIds: [],
      criticalTreatmentIds: [],
      diagnosisOptions: ['theobromine-toxicosis'],
    },
    bedIndex: -10,
    status: 'discharged',
    askedQuestionIds: [],
    orderedTestIds: [],
    testOrderedAt: {},
    completedTestIds: [],
    givenTreatmentIds: [],
    submittedDiagnosisId: 'theobromine-toxicosis',
    arrivedAt: now - 60_000,
    deadlineMs: now + 60_000,
    prescriptions: [],
  };
}

test('Barkibu estimate handles a consultation with no tests or prescriptions', () => {
  const estimate = estimateBarkibuSupport(encounter(11.4, 'stable'));
  assert.equal(estimate.lineItems.length, 1);
  assert.equal(estimate.subtotal, 55);
  assert.equal(estimate.estimatedCoveredAmount, 44);
  assert.equal(estimate.estimatedOwnerCost, 11);
});

test('Barkibu estimate calculates multiple line items and 80 percent reimbursement', () => {
  const p = encounter();
  p.orderedTestIds = ['vet-ecg', 'vet-electrolytes'];
  p.givenTreatmentIds = ['vet-decontamination'];
  p.prescriptions = [
    {
      medicationId: 'maropitant',
      dose: '2 mg/kg PO once daily',
      duration: '3 days',
      prescribedAt: Date.now(),
    },
  ];

  const estimate = estimateBarkibuSupport(p);
  assert.equal(estimate.reimbursementRate, 0.8);
  assert.ok(estimate.subtotal > 55);
  assert.equal(estimate.estimatedCoveredAmount, Math.round(estimate.subtotal * 80) / 100);
  assert.equal(
    estimate.estimatedOwnerCost,
    Math.round((estimate.subtotal - estimate.estimatedCoveredAmount) * 100) / 100,
  );
});

test('Barkibu estimate uses animal weight for mg/kg medication costs', () => {
  const light = encounter(5.8);
  light.prescriptions = [
    { medicationId: 'buprenorphine', dose: '0.02 mg/kg', duration: '24 hours', prescribedAt: Date.now() },
  ];
  const heavy = encounter(24.5);
  heavy.prescriptions = [
    { medicationId: 'buprenorphine', dose: '0.02 mg/kg', duration: '24 hours', prescribedAt: Date.now() },
  ];

  const lightRx = estimateBarkibuSupport(light).lineItems.find((x) => x.id === 'medication:buprenorphine');
  const heavyRx = estimateBarkibuSupport(heavy).lineItems.find((x) => x.id === 'medication:buprenorphine');
  assert.ok(lightRx);
  assert.ok(heavyRx);
  assert.ok(heavyRx.amount > lightRx.amount);
});

test('Barkibu estimate disclaimer avoids policy guarantees', () => {
  const estimate = estimateBarkibuSupport(encounter());
  assert.match(estimate.disclaimer, /Educational simulation only/i);
  assert.match(estimate.disclaimer, /not a policy quote/i);
  assert.match(estimate.disclaimer, /not .*coverage promise/i);
});
