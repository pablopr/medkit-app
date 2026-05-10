/**
 * Veterinary prescription catalogue for the training simulator.
 *
 * Doses are deliberately simplified and must not be used as real clinical
 * advice. The goal is to teach species, weight, diagnosis, and owner-safety
 * thinking, not to replace a veterinarian's judgment.
 */

import type { ClinicId } from '../game/clinic';

export type MedicationCategory =
  | 'antibiotic'
  | 'antiparasitic'
  | 'cardiovascular'
  | 'respiratory'
  | 'endocrine'
  | 'analgesic'
  | 'gastrointestinal'
  | 'dermatology'
  | 'urology'
  | 'emergency';

export interface Medication {
  id: string;
  name: string;
  form: 'tablet' | 'capsule' | 'solution' | 'cream' | 'spray' | 'injection' | 'suspension';
  category: MedicationCategory;
  class: string;
  defaultDose: string;
  defaultDuration: string;
  indications: string[];
  contraindications?: string[];
}

export const MEDICATIONS: Medication[] = [
  {
    id: 'maropitant',
    name: 'Maropitant',
    form: 'tablet',
    category: 'gastrointestinal',
    class: 'Antiemetic',
    defaultDose: '2 mg/kg PO once daily',
    defaultDuration: '3 days',
    indications: ['canine-parvoviral-enteritis', 'acute-gastroenteritis', 'theobromine-toxicosis', 'acute-pancreatitis'],
  },
  {
    id: 'activated-charcoal',
    name: 'Activated Charcoal',
    form: 'suspension',
    category: 'emergency',
    class: 'GI decontamination',
    defaultDose: '1 g/kg PO once if appropriate',
    defaultDuration: 'single dose',
    indications: ['theobromine-toxicosis'],
    contraindications: ['feline-urethral-obstruction', 'congestive-heart-failure'],
  },
  {
    id: 'amoxicillin-clavulanate-vet',
    name: 'Amoxicillin/Clavulanate',
    form: 'tablet',
    category: 'antibiotic',
    class: 'Penicillin + beta-lactamase inhibitor',
    defaultDose: '12.5 mg/kg PO twice daily',
    defaultDuration: '7 days',
    indications: ['canine-pyoderma', 'canine-parvoviral-enteritis', 'acute-gastroenteritis'],
  },
  {
    id: 'buprenorphine',
    name: 'Buprenorphine',
    form: 'injection',
    category: 'analgesic',
    class: 'Opioid analgesic',
    defaultDose: '0.02 mg/kg transmucosal or injectable',
    defaultDuration: '24-48 hours',
    indications: ['feline-urethral-obstruction', 'acute-gastroenteritis', 'acute-pancreatitis', 'cranial-cruciate-ligament-injury'],
  },
  {
    id: 'prazosin',
    name: 'Prazosin',
    form: 'capsule',
    category: 'urology',
    class: 'Urethral smooth muscle relaxant',
    defaultDose: '0.25-0.5 mg/cat PO twice daily',
    defaultDuration: '5-7 days',
    indications: ['feline-urethral-obstruction'],
  },
  {
    id: 'oclacitinib',
    name: 'Oclacitinib',
    form: 'tablet',
    category: 'dermatology',
    class: 'JAK inhibitor antipruritic',
    defaultDose: '0.4-0.6 mg/kg PO twice daily initially',
    defaultDuration: '14 days then reassess',
    indications: ['canine-atopic-dermatitis'],
  },
  {
    id: 'selamectin-sarolaner',
    name: 'Selamectin/Sarolaner',
    form: 'solution',
    category: 'antiparasitic',
    class: 'Ectoparasite control',
    defaultDose: 'label dose by weight',
    defaultDuration: 'monthly',
    indications: ['canine-atopic-dermatitis', 'flea-allergy-dermatitis'],
  },
  {
    id: 'chlorhexidine-mousse',
    name: 'Chlorhexidine Mousse',
    form: 'cream',
    category: 'dermatology',
    class: 'Topical antiseptic',
    defaultDose: 'apply thin layer to affected skin',
    defaultDuration: '7-14 days',
    indications: ['canine-atopic-dermatitis', 'canine-pyoderma'],
  },
  {
    id: 'furosemide',
    name: 'Furosemide',
    form: 'tablet',
    category: 'cardiovascular',
    class: 'Loop diuretic',
    defaultDose: '2 mg/kg PO twice daily',
    defaultDuration: 'until recheck',
    indications: ['congestive-heart-failure'],
    contraindications: ['theobromine-toxicosis'],
  },
  {
    id: 'pimobendan',
    name: 'Pimobendan',
    form: 'tablet',
    category: 'cardiovascular',
    class: 'Inodilator',
    defaultDose: '0.25-0.3 mg/kg PO twice daily',
    defaultDuration: 'ongoing with rechecks',
    indications: ['congestive-heart-failure'],
  },
  {
    id: 'insulin-vet',
    name: 'Veterinary Insulin',
    form: 'injection',
    category: 'endocrine',
    class: 'Insulin',
    defaultDose: 'starter dose by weight and species',
    defaultDuration: 'ongoing with glucose curves',
    indications: ['canine-diabetes-mellitus'],
  },
  {
    id: 'diabetic-diet',
    name: 'Diabetic Diet Plan',
    form: 'tablet',
    category: 'endocrine',
    class: 'Nutrition plan',
    defaultDose: 'consistent measured meals',
    defaultDuration: 'ongoing',
    indications: ['canine-diabetes-mellitus'],
  },
  {
    id: 'methimazole',
    name: 'Methimazole',
    form: 'tablet',
    category: 'endocrine',
    class: 'Antithyroid',
    defaultDose: 'starter dose by cat and monitoring plan',
    defaultDuration: 'ongoing with rechecks',
    indications: ['feline-hyperthyroidism'],
  },
  {
    id: 'renal-diet-plan',
    name: 'Renal Diet Plan',
    form: 'tablet',
    category: 'urology',
    class: 'Nutrition plan',
    defaultDose: 'gradual transition with appetite monitoring',
    defaultDuration: 'ongoing',
    indications: ['chronic-kidney-disease'],
  },
  {
    id: 'amlodipine',
    name: 'Amlodipine',
    form: 'tablet',
    category: 'cardiovascular',
    class: 'Antihypertensive',
    defaultDose: 'cat dose by blood pressure response',
    defaultDuration: 'ongoing with BP checks',
    indications: ['chronic-kidney-disease', 'feline-hyperthyroidism'],
  },
  {
    id: 'carprofen-vet',
    name: 'Carprofen',
    form: 'tablet',
    category: 'analgesic',
    class: 'NSAID analgesic',
    defaultDose: 'label dose by weight after screening',
    defaultDuration: 'short course until recheck',
    indications: ['cranial-cruciate-ligament-injury'],
    contraindications: ['chronic-kidney-disease'],
  },
  {
    id: 'prednisolone-vet',
    name: 'Prednisolone',
    form: 'tablet',
    category: 'respiratory',
    class: 'Corticosteroid',
    defaultDose: 'anti-inflammatory dose by cat and response',
    defaultDuration: 'taper with rechecks',
    indications: ['feline-asthma-crisis'],
    contraindications: ['canine-diabetes-mellitus'],
  },
  {
    id: 'albuterol-inhaler',
    name: 'Albuterol Inhaler',
    form: 'spray',
    category: 'respiratory',
    class: 'Bronchodilator',
    defaultDose: 'metered inhaler via feline spacer as directed',
    defaultDuration: 'rescue use with asthma plan',
    indications: ['feline-asthma-crisis'],
  },
  {
    id: 'ofloxacin-eye-drops',
    name: 'Ofloxacin Eye Drops',
    form: 'solution',
    category: 'antibiotic',
    class: 'Ophthalmic antibiotic',
    defaultDose: 'topical drops as directed',
    defaultDuration: 'until ulcer recheck',
    indications: ['corneal-ulcer'],
  },
];

const MED_BY_ID: Record<string, Medication> = Object.fromEntries(
  MEDICATIONS.map((m) => [m.id, m]),
);

export function medicationById(id: string): Medication | undefined {
  return MED_BY_ID[id];
}

export function medicationClasses(): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const m of MEDICATIONS) {
    if (!seen.has(m.class)) {
      seen.add(m.class);
      out.push(m.class);
    }
  }
  return out;
}

export const CATEGORY_LABELS: Record<MedicationCategory, string> = {
  antibiotic: 'Antibiotics',
  antiparasitic: 'Parasite Control',
  cardiovascular: 'Cardiology',
  respiratory: 'Respiratory',
  endocrine: 'Endocrine',
  analgesic: 'Pain Relief',
  gastrointestinal: 'Gastrointestinal',
  dermatology: 'Dermatology',
  urology: 'Urinary',
  emergency: 'Emergency',
};

const ALL_CATEGORIES: MedicationCategory[] = [
  'antibiotic',
  'antiparasitic',
  'cardiovascular',
  'respiratory',
  'endocrine',
  'analgesic',
  'gastrointestinal',
  'dermatology',
  'urology',
  'emergency',
];

export const SPECIALTY_MEDICATION_CATEGORIES: Record<ClinicId, MedicationCategory[]> = {
  'all-specialties': ALL_CATEGORIES,
  'internal-medicine': ALL_CATEGORIES,
  cardiology: ['cardiovascular', 'respiratory', 'analgesic'],
  neurology: ['analgesic', 'emergency'],
  neurosurgery: ['analgesic', 'emergency', 'antibiotic'],
  dermatology: ['dermatology', 'antiparasitic', 'antibiotic'],
  endocrinology: ['endocrine', 'gastrointestinal'],
  gastroenterology: ['gastrointestinal', 'antibiotic', 'analgesic', 'emergency'],
  pulmonology: ['respiratory', 'cardiovascular', 'antibiotic', 'emergency'],
  nephrology: ['urology', 'cardiovascular', 'analgesic', 'emergency'],
  rheumatology: ['analgesic'],
  hematology: ['antibiotic', 'emergency'],
  oncology: ['analgesic', 'gastrointestinal'],
  'infectious-disease': ['antibiotic', 'gastrointestinal', 'emergency'],
  'allergy-immunology': ['dermatology', 'antiparasitic'],
  psychiatry: ['gastrointestinal'],
  obgyn: ['antibiotic', 'analgesic'],
  urology: ['urology', 'analgesic', 'antibiotic'],
  ophthalmology: ['antibiotic', 'analgesic'],
  ent: ['antibiotic', 'dermatology'],
  orthopedics: ['analgesic', 'antibiotic'],
  pmr: ['analgesic'],
  pediatrics: ['gastrointestinal', 'antibiotic', 'emergency', 'antiparasitic'],
  'general-surgery': ['analgesic', 'antibiotic', 'emergency'],
  'cardiothoracic-vascular-surgery': ['cardiovascular', 'analgesic', 'emergency'],
};

export function isCategoryAllowedForSpecialty(
  category: MedicationCategory,
  specialty: ClinicId,
): boolean {
  return SPECIALTY_MEDICATION_CATEGORIES[specialty].includes(category);
}

const CATEGORY_ORDER: MedicationCategory[] = ALL_CATEGORIES;

export function medicationCategories(): MedicationCategory[] {
  const present = new Set<MedicationCategory>(MEDICATIONS.map((m) => m.category));
  return CATEGORY_ORDER.filter((c) => present.has(c));
}

function suggestFor(diagnosisId: string): Medication | undefined {
  const specific = MEDICATIONS.find(
    (m) => m.indications.includes(diagnosisId) && !['Pain Relief', 'Nutrition plan'].includes(m.class),
  );
  if (specific) return specific;
  return MEDICATIONS.find((m) => m.indications.includes(diagnosisId));
}

export interface PrescriptionGrade {
  score: number;
  correct: string[];
  wrong: string[];
  missingSuggestion?: string;
  notes: string[];
}

export function gradePrescription(
  diagnosisId: string,
  prescribedIds: string[],
): PrescriptionGrade {
  const correct: string[] = [];
  const wrong: string[] = [];
  const notes: string[] = [];

  const unique: string[] = [];
  const seen = new Set<string>();
  for (const id of prescribedIds) {
    if (!seen.has(id)) {
      seen.add(id);
      unique.push(id);
    }
  }

  if (unique.length === 0) {
    const suggestion = suggestFor(diagnosisId);
    return {
      score: 0,
      correct: [],
      wrong: [],
      missingSuggestion: suggestion?.id,
      notes: suggestion
        ? [`No prescription issued. Consider ${suggestion.name} for this diagnosis.`]
        : ['No prescription issued. Nothing indicated for this diagnosis either.'],
    };
  }

  let correctCount = 0;
  let contraindicatedCount = 0;
  let unrelatedCount = 0;

  for (const id of unique) {
    const med = medicationById(id);
    if (!med) {
      unrelatedCount += 1;
      wrong.push(id);
      notes.push(`Unknown medication "${id}" - ignored from a therapeutic standpoint.`);
      continue;
    }
    const isContraindicated = med.contraindications?.includes(diagnosisId) ?? false;
    const isIndicated = med.indications.includes(diagnosisId);

    if (isContraindicated) {
      contraindicatedCount += 1;
      wrong.push(id);
      notes.push(`Warning: ${med.name} is contraindicated for this diagnosis. -20`);
    } else if (isIndicated) {
      correctCount += 1;
      correct.push(id);
      notes.push(`${med.name} - appropriate choice. +30`);
    } else {
      unrelatedCount += 1;
      wrong.push(id);
      notes.push(`${med.name} is not indicated for this diagnosis. -5`);
    }
  }

  const score = Math.min(correctCount, 2) * 30 - contraindicatedCount * 20 - unrelatedCount * 5;
  let missingSuggestion: string | undefined;
  if (correctCount === 0) {
    const suggestion = suggestFor(diagnosisId);
    if (suggestion && !unique.includes(suggestion.id)) {
      missingSuggestion = suggestion.id;
      notes.push(`Consider ${suggestion.name} for this diagnosis.`);
    }
  }

  return { score, correct, wrong, missingSuggestion, notes };
}
