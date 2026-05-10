import type { Treatment } from '../game/types';

export const TREATMENTS: Treatment[] = [
  { id: 'vet-iv-catheter', name: 'Place IV catheter', category: 'procedure' },
  { id: 'vet-iv-fluids', name: 'IV crystalloid fluids', category: 'procedure' },
  { id: 'vet-oxygen', name: 'Oxygen support', category: 'procedure' },
  { id: 'vet-antiemetic', name: 'Antiemetic injection', category: 'medication' },
  { id: 'vet-analgesia', name: 'Opioid analgesia', category: 'medication' },
  { id: 'vet-bronchodilator', name: 'Bronchodilator / respiratory medication', category: 'medication' },
  { id: 'vet-eye-medication', name: 'Topical eye medication', category: 'medication' },
  { id: 'vet-urinary-catheter', name: 'Urethral catheterization', category: 'procedure' },
  { id: 'vet-decontamination', name: 'Toxin decontamination plan', category: 'procedure' },
  { id: 'vet-protective-collar', name: 'Fit protective collar', category: 'procedure' },
  { id: 'vet-activity-restriction', name: 'Activity restriction plan', category: 'disposition' },
  { id: 'vet-surgery-referral', name: 'Surgery / specialist referral', category: 'disposition' },
  { id: 'vet-diet-plan', name: 'Therapeutic diet plan', category: 'disposition' },
  { id: 'vet-bp-management', name: 'Blood pressure management plan', category: 'medication' },
  { id: 'vet-hospitalize', name: 'Hospitalize / transfer to emergency care', category: 'disposition' },
  { id: 'vet-discharge', name: 'Discharge with owner instructions', category: 'disposition' },
  { id: 'vet-recheck', name: 'Schedule veterinary recheck', category: 'disposition' },
];

export const treatmentById = (id: string) => TREATMENTS.find((t) => t.id === id);
