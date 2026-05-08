// Polyclinic (outpatient) specialty identifiers.
//
// These IDs key both patient rosters (`POLYCLINIC_CASES`) and UI labels.
// Kept in a separate module so the store, 3D scene, HUD view, and the
// patient-data file (owned by another agent) can all import from a
// single location without a circular dependency.

export type ClinicId =
  | 'all-specialties'
  | 'internal-medicine'
  | 'cardiology'
  | 'neurology'
  | 'neurosurgery'
  | 'dermatology'
  | 'endocrinology'
  | 'gastroenterology'
  | 'pulmonology'
  | 'nephrology'
  | 'rheumatology'
  | 'hematology'
  | 'oncology'
  | 'infectious-disease'
  | 'allergy-immunology'
  | 'psychiatry'
  | 'obgyn'
  | 'urology'
  | 'ophthalmology'
  | 'ent'
  | 'orthopedics'
  | 'pmr'
  | 'pediatrics'
  | 'general-surgery'
  | 'cardiothoracic-vascular-surgery';

/** Display order — also used by the specialty selector UI. The first entry
 *  is the "mixed" option that pulls cases from every specialty, so the
 *  doctor sees a rapid variety of demographics (kids, elderly, men, women)
 *  without having to switch clinics manually. */
export const CLINIC_IDS: ClinicId[] = [
  'all-specialties',
  'internal-medicine',
  'cardiology',
  'neurology',
  'neurosurgery',
  'dermatology',
  'endocrinology',
  'gastroenterology',
  'pulmonology',
  'nephrology',
  'rheumatology',
  'hematology',
  'oncology',
  'infectious-disease',
  'allergy-immunology',
  'psychiatry',
  'obgyn',
  'urology',
  'ophthalmology',
  'ent',
  'orthopedics',
  'pmr',
  'pediatrics',
  'general-surgery',
  'cardiothoracic-vascular-surgery',
];

/** English display labels for each veterinary service. The IDs remain stable
 *  to avoid a broad migration through the 3D scene and existing filters. */
export const CLINIC_LABELS: Record<ClinicId, string> = {
  'all-specialties': 'All Vet Services (mixed)',
  'internal-medicine': 'General Practice',
  cardiology: 'Veterinary Cardiology',
  neurology: 'Veterinary Neurology',
  neurosurgery: 'Referral Neurology',
  dermatology: 'Veterinary Dermatology',
  endocrinology: 'Endocrine & Weight Clinic',
  gastroenterology: 'Gastroenterology',
  pulmonology: 'Respiratory Medicine',
  nephrology: 'Renal & Urinary Medicine',
  rheumatology: 'Mobility & Pain Clinic',
  hematology: 'Hematology',
  oncology: 'Oncology',
  'infectious-disease': 'Infectious Disease',
  'allergy-immunology': 'Allergy & Immunology',
  psychiatry: 'Behavior Medicine',
  obgyn: 'Reproductive Medicine',
  urology: 'Urinary Medicine',
  ophthalmology: 'Ophthalmology',
  ent: 'Ear, Nose & Throat',
  orthopedics: 'Orthopedics',
  pmr: 'Rehab & Mobility',
  pediatrics: 'Puppy & Kitten Clinic',
  'general-surgery': 'Soft Tissue Surgery',
  'cardiothoracic-vascular-surgery': 'Advanced Surgery',
};

export const DEFAULT_CLINIC: ClinicId = 'internal-medicine';
