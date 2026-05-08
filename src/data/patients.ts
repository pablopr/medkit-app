import type { PatientCase } from '../game/types';

// The veterinary MVP runs through the polyclinic/small-animal workflow.
// The old ER-human roster is intentionally empty so verification does not mix
// human emergency cases into the veterinary diagnosis and prescription sets.
export const PATIENT_CASES: PatientCase[] = [];

export const DIAGNOSIS_LABELS: Record<string, string> = {};
