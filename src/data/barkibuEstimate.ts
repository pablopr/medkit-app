import type { ActivePatient } from '../game/types';
import { TESTS } from './tests.ts';
import { TREATMENTS } from './treatments.ts';
import { medicationById } from './medications.ts';

export interface BarkibuEstimateLineItem {
  id: string;
  label: string;
  category: 'consultation' | 'test' | 'treatment' | 'medication';
  amount: number;
}

export interface BarkibuSupportEstimate {
  subtotal: number;
  estimatedCoveredAmount: number;
  estimatedOwnerCost: number;
  reimbursementRate: number;
  lineItems: BarkibuEstimateLineItem[];
  disclaimer: string;
}

const REIMBURSEMENT_RATE = 0.8;

const EDUCATIONAL_DISCLAIMER =
  'Educational simulation only. Amounts and reimbursement are illustrative, not a policy quote, coverage promise, or insurance advice.';

const TEST_COSTS: Record<string, number> = {
  'vet-physical-exam': 45,
  'vet-pain-score': 15,
  'vet-bcs': 15,
  'vet-bp': 28,
  'vet-glucose': 18,
  'vet-ecg': 45,
  'vet-pocus-bladder': 40,
  'vet-flea-comb': 18,
  'vet-ear-cytology': 35,
  'vet-skin-cytology': 35,
  'vet-cbc': 55,
  'vet-chem': 65,
  'vet-electrolytes': 35,
  'vet-urinalysis': 45,
  'vet-urine-culture': 95,
  'vet-fructosamine': 70,
  'vet-tt4': 58,
  'vet-ntprobnp': 95,
  'vet-fecal': 38,
  'vet-parvo-snap': 42,
  'vet-thoracic-rads': 110,
  'vet-abdominal-rads': 110,
  'vet-abdominal-us': 180,
  'vet-echo': 240,
  'vet-orthopedic-rads': 110,
};

const TREATMENT_COSTS: Record<string, number> = {
  'vet-iv-catheter': 45,
  'vet-iv-fluids': 85,
  'vet-oxygen': 65,
  'vet-antiemetic': 38,
  'vet-analgesia': 42,
  'vet-urinary-catheter': 180,
  'vet-decontamination': 95,
  'vet-hospitalize': 260,
  'vet-discharge': 25,
  'vet-recheck': 35,
};

const MEDICATION_COSTS: Record<string, { flat?: number; perKg?: number; dispensing?: number }> = {
  maropitant: { perKg: 1.1, dispensing: 12 },
  'activated-charcoal': { perKg: 0.9, dispensing: 15 },
  'amoxicillin-clavulanate-vet': { perKg: 1.25, dispensing: 12 },
  buprenorphine: { perKg: 1.8, dispensing: 18 },
  prazosin: { flat: 18 },
  oclacitinib: { perKg: 2.4, dispensing: 14 },
  'selamectin-sarolaner': { perKg: 1.9, dispensing: 10 },
  'chlorhexidine-mousse': { flat: 22 },
  furosemide: { perKg: 0.8, dispensing: 10 },
  pimobendan: { perKg: 2.1, dispensing: 14 },
  'insulin-vet': { flat: 78 },
  'diabetic-diet': { flat: 36 },
};

function roundEuro(n: number): number {
  return Math.round(n * 100) / 100;
}

function uniqueInOrder(ids: string[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const id of ids) {
    if (!seen.has(id)) {
      seen.add(id);
      out.push(id);
    }
  }
  return out;
}

function medicationAmount(medicationId: string, doseText: string, weightKg: number): number {
  const cost = MEDICATION_COSTS[medicationId];
  if (!cost) return 20;
  if (typeof cost.flat === 'number') return cost.flat;
  const isWeightBased = /\/\s*kg|mg\/kg|g\/kg/i.test(doseText);
  if (!isWeightBased || typeof cost.perKg !== 'number') return cost.dispensing ?? 20;
  return roundEuro((cost.dispensing ?? 0) + cost.perKg * weightKg);
}

export function estimateBarkibuSupport(patient: ActivePatient): BarkibuSupportEstimate {
  const lineItems: BarkibuEstimateLineItem[] = [
    {
      id: 'consultation',
      label: `Veterinary consultation for ${patient.case.name}`,
      category: 'consultation',
      amount: patient.case.severity === 'critical' ? 95 : 55,
    },
  ];

  const testById = new Map(TESTS.map((t) => [t.id, t]));
  for (const testId of uniqueInOrder(patient.orderedTestIds)) {
    const test = testById.get(testId);
    lineItems.push({
      id: `test:${testId}`,
      label: test?.name ?? testId,
      category: 'test',
      amount: TEST_COSTS[testId] ?? 40,
    });
  }

  const treatmentById = new Map(TREATMENTS.map((t) => [t.id, t]));
  for (const treatmentId of uniqueInOrder(patient.givenTreatmentIds)) {
    const treatment = treatmentById.get(treatmentId);
    lineItems.push({
      id: `treatment:${treatmentId}`,
      label: treatment?.name ?? treatmentId,
      category: 'treatment',
      amount: TREATMENT_COSTS[treatmentId] ?? 50,
    });
  }

  for (const rx of patient.prescriptions ?? []) {
    const med = medicationById(rx.medicationId);
    const doseText = `${rx.dose} ${med?.defaultDose ?? ''}`;
    lineItems.push({
      id: `medication:${rx.medicationId}`,
      label: med
        ? `${med.name} (${rx.dose}, ${rx.duration})`
        : `${rx.medicationId} (${rx.dose}, ${rx.duration})`,
      category: 'medication',
      amount: medicationAmount(rx.medicationId, doseText, patient.case.weightKg),
    });
  }

  const subtotal = roundEuro(lineItems.reduce((sum, item) => sum + item.amount, 0));
  const estimatedCoveredAmount = roundEuro(subtotal * REIMBURSEMENT_RATE);
  const estimatedOwnerCost = roundEuro(subtotal - estimatedCoveredAmount);

  return {
    subtotal,
    estimatedCoveredAmount,
    estimatedOwnerCost,
    reimbursementRate: REIMBURSEMENT_RATE,
    lineItems,
    disclaimer: EDUCATIONAL_DISCLAIMER,
  };
}
