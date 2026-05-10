import type { Test } from '../game/types';
import type { ClinicId } from '../game/clinic';

export const TESTS: Test[] = [
  { id: 'vet-physical-exam', name: 'Full Physical Exam', category: 'bedside', turnaroundSec: 10 },
  { id: 'vet-pain-score', name: 'Pain Score + Mentation Check', category: 'bedside', turnaroundSec: 10 },
  { id: 'vet-bcs', name: 'Body Condition Score', category: 'bedside', turnaroundSec: 10 },
  { id: 'vet-bp', name: 'Doppler Blood Pressure', category: 'bedside', turnaroundSec: 20 },
  { id: 'vet-glucose', name: 'Point-of-Care Glucose', category: 'bedside', turnaroundSec: 15 },
  { id: 'vet-ecg', name: 'ECG Rhythm Strip', category: 'bedside', turnaroundSec: 25 },
  { id: 'vet-pocus-bladder', name: 'POCUS Bladder Check', category: 'bedside', turnaroundSec: 25 },
  { id: 'vet-flea-comb', name: 'Flea Comb Exam', category: 'bedside', turnaroundSec: 15 },
  { id: 'vet-ear-cytology', name: 'Ear Cytology', category: 'bedside', turnaroundSec: 25 },
  { id: 'vet-skin-cytology', name: 'Skin Cytology', category: 'bedside', turnaroundSec: 25 },

  { id: 'vet-cbc', name: 'CBC w/ Differential', category: 'lab', turnaroundSec: 30 },
  { id: 'vet-chem', name: 'Serum Chemistry', category: 'lab', turnaroundSec: 35 },
  { id: 'vet-electrolytes', name: 'Electrolytes', category: 'lab', turnaroundSec: 25 },
  { id: 'vet-urinalysis', name: 'Urinalysis + Sediment', category: 'lab', turnaroundSec: 30 },
  { id: 'vet-urine-culture', name: 'Urine Culture', category: 'lab', turnaroundSec: 80 },
  { id: 'vet-fructosamine', name: 'Fructosamine', category: 'lab', turnaroundSec: 60 },
  { id: 'vet-tt4', name: 'Total T4', category: 'lab', turnaroundSec: 45 },
  { id: 'vet-sdma-upc', name: 'SDMA + Urine Protein:Creatinine', category: 'lab', turnaroundSec: 60 },
  { id: 'vet-pancreatic-lipase', name: 'Pancreatic Lipase', category: 'lab', turnaroundSec: 45 },
  { id: 'vet-ntprobnp', name: 'NT-proBNP', category: 'lab', turnaroundSec: 50 },
  { id: 'vet-fecal', name: 'Fecal Parasite Screen', category: 'lab', turnaroundSec: 35 },
  { id: 'vet-parvo-snap', name: 'Parvovirus SNAP Test', category: 'lab', turnaroundSec: 20 },
  { id: 'vet-fluorescein-stain', name: 'Fluorescein Eye Stain', category: 'bedside', turnaroundSec: 15 },
  { id: 'vet-tonometry', name: 'Tonometry', category: 'bedside', turnaroundSec: 20 },

  { id: 'vet-thoracic-rads', name: 'Thoracic Radiographs', category: 'imaging', turnaroundSec: 55 },
  { id: 'vet-abdominal-rads', name: 'Abdominal Radiographs', category: 'imaging', turnaroundSec: 55 },
  { id: 'vet-abdominal-us', name: 'Abdominal Ultrasound', category: 'imaging', turnaroundSec: 75 },
  { id: 'vet-echo', name: 'Echocardiography', category: 'imaging', turnaroundSec: 90 },
  { id: 'vet-orthopedic-rads', name: 'Orthopedic Radiographs', category: 'imaging', turnaroundSec: 55 },
];

export const testById = (id: string) => TESTS.find((t) => t.id === id);

export interface TestPanel {
  id: string;
  label: string;
  description: string;
  testIds: string[];
  clinicIds?: ClinicId[];
}

const SMALL_ANIMAL_MEDICINE: ClinicId[] = [
  'internal-medicine',
  'gastroenterology',
  'nephrology',
  'urology',
  'infectious-disease',
  'pediatrics',
  'endocrinology',
];

export const TEST_PANELS: TestPanel[] = [
  {
    id: 'vet-minimum-database',
    label: 'Minimum Database',
    description: 'Physical exam, CBC, chemistry, urinalysis',
    testIds: ['vet-physical-exam', 'vet-cbc', 'vet-chem', 'vet-urinalysis'],
    clinicIds: SMALL_ANIMAL_MEDICINE,
  },
  {
    id: 'vet-dehydration-gi',
    label: 'Vomiting / Diarrhea Workup',
    description: 'CBC, chemistry, electrolytes, fecal, abdominal imaging',
    testIds: ['vet-cbc', 'vet-chem', 'vet-electrolytes', 'vet-fecal', 'vet-abdominal-rads'],
    clinicIds: ['gastroenterology', 'internal-medicine', 'pediatrics'],
  },
  {
    id: 'vet-blocked-cat',
    label: 'Blocked Cat Workup',
    description: 'Bladder POCUS, electrolytes, chemistry, urinalysis',
    testIds: ['vet-pocus-bladder', 'vet-electrolytes', 'vet-chem', 'vet-urinalysis'],
    clinicIds: ['urology', 'nephrology', 'internal-medicine'],
  },
  {
    id: 'vet-pruritus',
    label: 'Itchy Skin Workup',
    description: 'Flea comb, skin cytology, ear cytology',
    testIds: ['vet-flea-comb', 'vet-skin-cytology', 'vet-ear-cytology'],
    clinicIds: ['dermatology', 'allergy-immunology', 'internal-medicine'],
  },
  {
    id: 'vet-diabetes',
    label: 'Diabetes Workup',
    description: 'Glucose, urinalysis, chemistry, fructosamine',
    testIds: ['vet-glucose', 'vet-urinalysis', 'vet-chem', 'vet-fructosamine'],
    clinicIds: ['endocrinology', 'internal-medicine'],
  },
  {
    id: 'vet-cardiac',
    label: 'Cardiac Workup',
    description: 'Thoracic radiographs, blood pressure, ECG, echo, NT-proBNP',
    testIds: ['vet-thoracic-rads', 'vet-bp', 'vet-ecg', 'vet-echo', 'vet-ntprobnp'],
    clinicIds: ['cardiology', 'internal-medicine'],
  },
  {
    id: 'vet-renal',
    label: 'Renal Workup',
    description: 'Chemistry, urinalysis, blood pressure, SDMA and UPC',
    testIds: ['vet-chem', 'vet-urinalysis', 'vet-bp', 'vet-sdma-upc', 'vet-electrolytes'],
    clinicIds: ['nephrology', 'internal-medicine'],
  },
  {
    id: 'vet-pancreatitis',
    label: 'Pancreatitis Workup',
    description: 'Minimum database, pancreatic lipase, electrolytes, abdominal ultrasound',
    testIds: ['vet-cbc', 'vet-chem', 'vet-electrolytes', 'vet-pancreatic-lipase', 'vet-abdominal-us'],
    clinicIds: ['gastroenterology', 'internal-medicine'],
  },
  {
    id: 'vet-respiratory',
    label: 'Respiratory Distress Workup',
    description: 'Physical exam, oxygen assessment, thoracic imaging, CBC',
    testIds: ['vet-physical-exam', 'vet-thoracic-rads', 'vet-cbc', 'vet-ntprobnp'],
    clinicIds: ['pulmonology', 'cardiology', 'internal-medicine'],
  },
  {
    id: 'vet-orthopedic',
    label: 'Lameness Workup',
    description: 'Orthopedic exam, pain score, radiographs',
    testIds: ['vet-physical-exam', 'vet-pain-score', 'vet-orthopedic-rads'],
    clinicIds: ['orthopedics', 'pmr'],
  },
  {
    id: 'vet-eye',
    label: 'Painful Eye Workup',
    description: 'Ophthalmic exam, fluorescein stain, tonometry',
    testIds: ['vet-physical-exam', 'vet-fluorescein-stain', 'vet-tonometry'],
    clinicIds: ['ophthalmology', 'ent'],
  },
];
