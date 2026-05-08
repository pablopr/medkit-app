import type { ClinicId } from '../game/clinic';
import type { CaseRubric, PatientCase, RubricCriterion } from '../game/types';

const ownerQuestions: RubricCriterion[] = [
  {
    criterion_id: 'ip-01',
    label: 'Build rapport with the pet parent',
    weight: 1,
    framework: 'SEGUE',
    evidence: 'Greets the owner, confirms the animal name, and acknowledges their concern.',
  },
  {
    criterion_id: 'ip-02',
    label: 'Explain plan in owner-friendly language',
    weight: 2,
    framework: 'PLAB2',
    evidence: 'Explains the working problem and plan without unexplained medical jargon.',
  },
  {
    criterion_id: 'ip-03',
    label: 'Check understanding and cost concerns',
    weight: 1,
    framework: 'ICE',
    evidence: 'Checks the owner understands the plan and gives space for worries, expectations, or cost concerns.',
  },
];

function dg(id: string, label: string, evidence: string): RubricCriterion {
  return { criterion_id: id, label, weight: 1, framework: 'RCGP', evidence };
}

function cm(
  id: string,
  label: string,
  evidence: string,
  guideline_ref: string,
  weight = 2,
): RubricCriterion {
  return { criterion_id: id, label, weight, framework: 'PLAB2', guideline_ref, evidence };
}

function rubric(
  data_gathering: RubricCriterion[],
  clinical_management: RubricCriterion[],
  safetyRef: string,
): CaseRubric {
  return {
    data_gathering,
    clinical_management,
    interpersonal: ownerQuestions,
    safety_netting: {
      required_elements: [
        'Gives clear return-now signs for the owner',
        'Names a concrete follow-up or recheck timeframe',
      ],
      weight: 1,
      guideline_ref: safetyRef,
    },
    global_rating: 'borderline-regression',
  };
}

const generalPractice: PatientCase[] = [
  {
    id: 'im-001',
    name: 'Luna',
    age: 3,
    gender: 'F',
    species: 'dog',
    breed: 'Labrador Retriever',
    weightKg: 24.5,
    neuterStatus: 'spayed',
    ownerName: 'Marta',
    severity: 'urgent',
    arrivalBlurb: 'Marta arrives worried with Luna, who is restless and panting after eating dark chocolate.',
    presentingComplaint: 'Ate dark chocolate about an hour ago',
    chiefComplaint: 'Luna got into a bar of dark chocolate. She is panting and cannot settle.',
    vitals: {
      hr: 148,
      rr: 38,
      temp: 39.2,
      mmColor: 'pink',
      crtSec: 1.5,
      hydration: 'mildly dehydrated',
      painScore: 2,
      mentation: 'bright but agitated',
    },
    anamnesis: [
      { id: 'time', question: 'When did Luna eat the chocolate?', answer: 'About an hour ago, maybe a little less.', relevant: true },
      { id: 'amount', question: 'How much chocolate was it and what type?', answer: 'Almost a full 100 g bar of dark chocolate, around 70 percent cocoa.', relevant: true },
      { id: 'vomiting', question: 'Has she vomited?', answer: 'Not yet. She keeps licking her lips but nothing has come up.', relevant: true },
      { id: 'neuro', question: 'Any tremors, seizures, or collapse?', answer: 'No seizures. She is just very restless and twitchy.', relevant: true },
      { id: 'heart', question: 'Any heart disease or medication?', answer: 'No known heart problems and no regular medicines.', relevant: true },
      { id: 'diet', question: 'What does she normally eat?', answer: 'A normal adult dog kibble twice daily.', relevant: false },
    ],
    testResults: [
      { testId: 'vet-physical-exam', result: 'Restless, panting dog. Abdomen soft. No neurologic deficits. Chocolate ingestion risk is dose-dependent.', abnormal: true },
      { testId: 'vet-ecg', result: 'Sinus tachycardia, occasional ventricular premature complexes. No sustained arrhythmia.', abnormal: true },
      { testId: 'vet-electrolytes', result: 'Na 146 mmol/L, K 3.9 mmol/L, Cl 111 mmol/L. No severe electrolyte derangement.', abnormal: false },
      { testId: 'vet-chem', result: 'Mild stress hyperglycemia. Kidney and liver values within reference range.', abnormal: true },
      { testId: 'vet-cbc', result: 'Mild stress leukogram. No anemia or thrombocytopenia.', abnormal: false },
    ],
    correctDiagnosisId: 'theobromine-toxicosis',
    diagnosisOptions: ['theobromine-toxicosis', 'acute-gastroenteritis', 'heat-stress', 'canine-panic-event', 'foreign-body-ingestion'],
    acceptableTreatmentIds: ['vet-decontamination', 'vet-iv-fluids', 'vet-hospitalize'],
    criticalTreatmentIds: ['vet-decontamination'],
    rubric: rubric(
      [
        dg('dg-01', 'Quantify toxin exposure', 'Asks when the chocolate was eaten, the chocolate type, and approximate amount.'),
        dg('dg-02', 'Screen for neurologic/cardiac danger', 'Asks about tremors, seizures, collapse, palpitations, or severe agitation.'),
        dg('dg-03', 'Check comorbidities and medications', 'Asks about heart disease, current medication, or other toxin exposure.'),
      ],
      [
        cm('cm-01', 'Order cardiac and electrolyte assessment', 'Orders ECG and electrolytes or chemistry for a clinically relevant toxin workup.', 'aaha-fluid-therapy-2013:aaha-fluid-assess-hydration'),
        cm('cm-02', 'Choose decontamination/supportive plan', 'Records activated charcoal or an equivalent decontamination/supportive plan when appropriate.', 'aaha-fluid-therapy-2013:aaha-fluid-monitor-response'),
      ],
      'aaha-fluid-therapy-2013:aaha-fluid-monitor-response',
    ),
  },
];

const urology: PatientCase[] = [
  {
    id: 'im-002',
    name: 'Milo',
    age: 5,
    gender: 'M',
    species: 'cat',
    breed: 'Domestic Shorthair',
    weightKg: 5.8,
    neuterStatus: 'neutered',
    ownerName: 'Diego',
    severity: 'critical',
    arrivalBlurb: 'Diego carries Milo in a blanket. Milo is painful, crouched, and vocalizing.',
    presentingComplaint: 'Straining in litter tray with no urine',
    chiefComplaint: 'Milo keeps going to the litter tray but nothing comes out. He is crying now.',
    vitals: {
      hr: 176,
      rr: 44,
      temp: 37.6,
      mmColor: 'pale pink',
      crtSec: 2.5,
      hydration: '5 percent dehydrated',
      painScore: 8,
      mentation: 'quiet, painful, responsive',
    },
    anamnesis: [
      { id: 'urine', question: 'When did Milo last pass urine?', answer: 'I have not seen urine since yesterday morning.', relevant: true },
      { id: 'straining', question: 'Is he straining or crying in the tray?', answer: 'Yes, he keeps squatting and crying.', relevant: true },
      { id: 'vomiting', question: 'Any vomiting or not eating?', answer: 'He vomited once and skipped breakfast.', relevant: true },
      { id: 'history', question: 'Any previous urinary problems?', answer: 'He had cystitis once last year, but he was never blocked.', relevant: true },
      { id: 'diet', question: 'What diet does he eat?', answer: 'Mostly dry food. He does not drink much.', relevant: true },
    ],
    testResults: [
      { testId: 'vet-pocus-bladder', result: 'Large, tense urinary bladder. Findings support urethral obstruction.', abnormal: true },
      { testId: 'vet-electrolytes', result: 'K 6.8 mmol/L, Na 149 mmol/L. Hyperkalemia is clinically important.', abnormal: true },
      { testId: 'vet-chem', result: 'Azotemia: BUN 58 mg/dL, creatinine 3.1 mg/dL. Post-renal obstruction likely.', abnormal: true },
      { testId: 'vet-urinalysis', result: 'Concentrated urine with hematuria and crystalluria after decompression sample.', abnormal: true },
    ],
    correctDiagnosisId: 'feline-urethral-obstruction',
    diagnosisOptions: ['feline-urethral-obstruction', 'feline-idiopathic-cystitis', 'constipation', 'acute-kidney-injury', 'urinary-tract-infection'],
    acceptableTreatmentIds: ['vet-iv-catheter', 'vet-iv-fluids', 'vet-analgesia', 'vet-urinary-catheter', 'vet-hospitalize'],
    criticalTreatmentIds: ['vet-analgesia', 'vet-urinary-catheter'],
    rubric: rubric(
      [
        dg('dg-01', 'Identify anuria timeline', 'Asks when the cat last urinated and whether urine is actually produced.'),
        dg('dg-02', 'Screen systemic compromise', 'Asks about vomiting, appetite, lethargy, collapse, or pain.'),
        dg('dg-03', 'Ask urinary history and diet', 'Asks about prior cystitis, stones, urinary diet, water intake, or stress.'),
      ],
      [
        cm('cm-01', 'Treat as emergency obstruction', 'Recognizes suspected blocked male cat as emergency and orders bladder/electrolyte/renal assessment.', 'isfm-feline-urethral-obstruction-2022:isfm-fuo-recognise-emergency', 3),
        cm('cm-02', 'Provide analgesia and decompression plan', 'Records analgesia and catheterization/decompression or emergency transfer.', 'isfm-feline-urethral-obstruction-2022:isfm-fuo-analgesia-decompression', 3),
      ],
      'isfm-feline-urethral-obstruction-2022:isfm-fuo-recognise-emergency',
    ),
  },
];

const pediatrics: PatientCase[] = [
  {
    id: 'im-003',
    name: 'Toby',
    age: 0.4,
    gender: 'M',
    species: 'dog',
    breed: 'Mixed breed puppy',
    weightKg: 6.2,
    neuterStatus: 'intact',
    ownerName: 'Lucia',
    severity: 'critical',
    arrivalBlurb: 'Lucia brings in a lethargic puppy with foul-smelling diarrhea and tacky gums.',
    presentingComplaint: 'Vomiting and bloody diarrhea',
    chiefComplaint: 'Toby has been vomiting and now has bloody diarrhea. He is just lying there.',
    vitals: {
      hr: 168,
      rr: 42,
      temp: 39.8,
      mmColor: 'tacky pink',
      crtSec: 2.5,
      hydration: '8 percent dehydrated',
      painScore: 5,
      mentation: 'depressed but responsive',
    },
    anamnesis: [
      { id: 'vaccines', question: 'Is Toby fully vaccinated?', answer: 'No, he only had one puppy vaccine so far.', relevant: true },
      { id: 'onset', question: 'When did the vomiting and diarrhea start?', answer: 'Vomiting yesterday, bloody diarrhea this morning.', relevant: true },
      { id: 'exposure', question: 'Any exposure to other puppies or parks?', answer: 'We went to a dog park two days ago.', relevant: true },
      { id: 'appetite', question: 'Is he eating or drinking?', answer: 'He will not eat and barely drinks.', relevant: true },
      { id: 'urine', question: 'Has he urinated today?', answer: 'Only a tiny amount this morning.', relevant: true },
    ],
    testResults: [
      { testId: 'vet-parvo-snap', result: 'Parvovirus antigen SNAP: positive.', abnormal: true },
      { testId: 'vet-cbc', result: 'Marked leukopenia with neutropenia. Mild hemoconcentration.', abnormal: true },
      { testId: 'vet-chem', result: 'Mild hypoglycemia, pre-renal azotemia, low albumin.', abnormal: true },
      { testId: 'vet-electrolytes', result: 'Mild hypokalemia and hyponatremia compatible with GI losses.', abnormal: true },
      { testId: 'vet-fecal', result: 'No ova seen. Heavy hemorrhagic diarrhea noted on sample.', abnormal: true },
    ],
    correctDiagnosisId: 'canine-parvoviral-enteritis',
    diagnosisOptions: ['canine-parvoviral-enteritis', 'acute-gastroenteritis', 'dietary-indiscretion', 'intestinal-parasites', 'foreign-body-ingestion'],
    acceptableTreatmentIds: ['vet-iv-catheter', 'vet-iv-fluids', 'vet-antiemetic', 'vet-hospitalize'],
    criticalTreatmentIds: ['vet-iv-fluids', 'vet-hospitalize'],
    rubric: rubric(
      [
        dg('dg-01', 'Clarify vaccination status', 'Asks about puppy vaccine status and timing.'),
        dg('dg-02', 'Clarify GI losses and hydration', 'Asks onset/frequency of vomiting and diarrhea, appetite, drinking, or urination.'),
        dg('dg-03', 'Ask exposure risk', 'Asks about dog parks, littermates, shelters, or contact with sick dogs.'),
      ],
      [
        cm('cm-01', 'Order parvo and minimum database', 'Orders parvo test plus CBC/chemistry/electrolytes or equivalent dehydration assessment.', 'aaha-fluid-therapy-2013:aaha-fluid-assess-hydration', 3),
        cm('cm-02', 'Stabilize and isolate', 'Records fluids, antiemetic/supportive care, hospitalization or isolation/transfer plan.', 'aaha-fluid-therapy-2013:aaha-fluid-monitor-response', 3),
      ],
      'aaha-fluid-therapy-2013:aaha-fluid-monitor-response',
    ),
  },
];

const dermatology: PatientCase[] = [
  {
    id: 'im-004',
    name: 'Nala',
    age: 4,
    gender: 'F',
    species: 'dog',
    breed: 'French Bulldog',
    weightKg: 11.4,
    neuterStatus: 'spayed',
    ownerName: 'Sara',
    severity: 'stable',
    arrivalBlurb: 'Sara sits with Nala, who is licking her paws and has red skin around both ears.',
    presentingComplaint: 'Itchy skin and ear redness',
    chiefComplaint: 'Nala is chewing her paws all night and her ears smell bad.',
    vitals: {
      hr: 104,
      rr: 26,
      temp: 38.7,
      mmColor: 'pink',
      crtSec: 1.5,
      hydration: 'normal',
      painScore: 3,
      mentation: 'bright, itchy',
    },
    anamnesis: [
      { id: 'itch', question: 'Where is Nala itchy and how severe is it?', answer: 'Paws, belly, and ears. She wakes us at night licking.', relevant: true },
      { id: 'season', question: 'Is the itch seasonal or year-round?', answer: 'Worse in spring but it never fully goes away.', relevant: true },
      { id: 'parasites', question: 'Is she on flea and tick prevention?', answer: 'We missed the last couple of months.', relevant: true },
      { id: 'ears', question: 'Any ear discharge or smell?', answer: 'Yes, both ears smell yeasty and look red.', relevant: true },
      { id: 'diet', question: 'Any diet changes or treats?', answer: 'No big changes, but she gets chicken treats every day.', relevant: true },
    ],
    testResults: [
      { testId: 'vet-flea-comb', result: 'No live fleas seen, but flea prevention lapse increases risk.', abnormal: true },
      { testId: 'vet-skin-cytology', result: 'Malassezia yeast and cocci overgrowth on paw cytology.', abnormal: true },
      { testId: 'vet-ear-cytology', result: 'Yeast otitis externa bilaterally.', abnormal: true },
      { testId: 'vet-physical-exam', result: 'Erythematous interdigital skin, mild otitis, no systemic illness.', abnormal: true },
    ],
    correctDiagnosisId: 'canine-atopic-dermatitis',
    diagnosisOptions: ['canine-atopic-dermatitis', 'flea-allergy-dermatitis', 'sarcoptic-mange', 'food-responsive-enteropathy', 'canine-pyoderma'],
    acceptableTreatmentIds: ['vet-recheck', 'vet-discharge'],
    criticalTreatmentIds: [],
    rubric: rubric(
      [
        dg('dg-01', 'Characterize itch pattern', 'Asks location, severity, sleep disruption, seasonality, and chronicity.'),
        dg('dg-02', 'Check parasite prevention', 'Asks about flea/tick prevention and exposure.'),
        dg('dg-03', 'Ask ear and skin infection clues', 'Asks about odor, discharge, lesions, licking, or secondary infection signs.'),
      ],
      [
        cm('cm-01', 'Rule out parasites and infection', 'Orders flea comb and skin/ear cytology or equivalent rule-out tests.', 'aaha-dermatology-allergy-2023:aaha-derm-rule-out-parasites-infection', 3),
        cm('cm-02', 'Build multimodal itch plan', 'Prescribes antipruritic/parasite control/topical infection care and plans a recheck.', 'aaha-dermatology-allergy-2023:aaha-derm-multimodal-plan', 2),
      ],
      'aaha-dermatology-allergy-2023:aaha-derm-multimodal-plan',
    ),
  },
];

const cardiology: PatientCase[] = [
  {
    id: 'im-005',
    name: 'Rocky',
    age: 10,
    gender: 'M',
    species: 'dog',
    breed: 'Cavalier King Charles Spaniel',
    weightKg: 9.6,
    neuterStatus: 'neutered',
    ownerName: 'Pablo',
    severity: 'urgent',
    arrivalBlurb: 'Pablo reports night coughing. Rocky is calm but tachypneic after walking in.',
    presentingComplaint: 'Coughing at night and tiring quickly',
    chiefComplaint: 'Rocky coughs at night and cannot walk as far as he used to.',
    vitals: {
      hr: 132,
      rr: 44,
      temp: 38.4,
      mmColor: 'pink',
      crtSec: 1.5,
      hydration: 'normal',
      painScore: 1,
      mentation: 'bright but exercise intolerant',
      bp: '148/92',
      spo2: 94,
    },
    anamnesis: [
      { id: 'cough', question: 'When does Rocky cough?', answer: 'Mostly at night and after excitement.', relevant: true },
      { id: 'breathing', question: 'Any fast or difficult breathing at rest?', answer: 'His sleeping breaths were around 44 per minute last night.', relevant: true },
      { id: 'exercise', question: 'Any exercise intolerance or collapse?', answer: 'He gets tired quickly but has not collapsed.', relevant: true },
      { id: 'murmur', question: 'Has anyone mentioned a heart murmur?', answer: 'Yes, our vet heard one last year.', relevant: true },
      { id: 'meds', question: 'Is he on heart medication already?', answer: 'No heart meds yet.', relevant: true },
    ],
    testResults: [
      { testId: 'vet-thoracic-rads', result: 'Cardiomegaly with mild pulmonary venous congestion and early interstitial pulmonary edema.', abnormal: true },
      { testId: 'vet-echo', result: 'Myxomatous mitral valve disease with left atrial enlargement and mitral regurgitation.', abnormal: true },
      { testId: 'vet-bp', result: 'Doppler systolic BP 148 mmHg.', abnormal: true },
      { testId: 'vet-ecg', result: 'Sinus rhythm with occasional supraventricular premature beats.', abnormal: true },
      { testId: 'vet-ntprobnp', result: 'NT-proBNP elevated, supports cardiac stretch.', abnormal: true },
    ],
    correctDiagnosisId: 'congestive-heart-failure',
    diagnosisOptions: ['congestive-heart-failure', 'kennel-cough', 'collapsing-trachea', 'allergic-bronchitis', 'laryngeal-paralysis'],
    acceptableTreatmentIds: ['vet-oxygen', 'vet-hospitalize', 'vet-recheck'],
    criticalTreatmentIds: ['vet-hospitalize'],
    rubric: rubric(
      [
        dg('dg-01', 'Ask cough and breathing pattern', 'Asks about nocturnal cough, resting respiratory rate, dyspnea, or exercise intolerance.'),
        dg('dg-02', 'Ask cardiac history', 'Asks about prior murmur, heart medication, collapse, or breed risk.'),
        dg('dg-03', 'Ask current stability', 'Asks about appetite, gum color, distress, or ability to sleep/rest.'),
      ],
      [
        cm('cm-01', 'Stage suspected cardiac disease', 'Orders thoracic imaging, blood pressure, ECG, echo, or NT-proBNP to stage disease.', 'acvim-myxomatous-mitral-2019:acvim-mmvd-stage-with-imaging', 3),
        cm('cm-02', 'Address CHF risk', 'Prescribes or records diuretic/stabilization plan and urgent follow-up or transfer when pulmonary edema is suspected.', 'acvim-myxomatous-mitral-2019:acvim-mmvd-chf-diuretic', 3),
      ],
      'acvim-myxomatous-mitral-2019:acvim-mmvd-chf-diuretic',
    ),
  },
];

const endocrinology: PatientCase[] = [
  {
    id: 'im-006',
    name: 'Bruno',
    age: 8,
    gender: 'M',
    species: 'dog',
    breed: 'Beagle',
    weightKg: 16.8,
    neuterStatus: 'neutered',
    ownerName: 'Ana',
    severity: 'stable',
    arrivalBlurb: 'Ana brings Bruno for weight loss, big thirst, and accidents in the house.',
    presentingComplaint: 'Drinking more, urinating more, losing weight',
    chiefComplaint: 'Bruno is drinking bowls of water, peeing in the house, and losing weight.',
    vitals: {
      hr: 108,
      rr: 24,
      temp: 38.5,
      mmColor: 'pink',
      crtSec: 1.5,
      hydration: 'normal to mild dehydration',
      painScore: 0,
      mentation: 'bright and hungry',
    },
    anamnesis: [
      { id: 'pupd', question: 'How much is Bruno drinking and urinating?', answer: 'At least twice as much water and he has accidents overnight.', relevant: true },
      { id: 'weight', question: 'Has his weight or appetite changed?', answer: 'He is thinner but constantly hungry.', relevant: true },
      { id: 'vomiting', question: 'Any vomiting, weakness, or collapse?', answer: 'No vomiting or collapse. He is still active.', relevant: true },
      { id: 'diet', question: 'What does he eat and how consistently?', answer: 'Kibble and snacks. Feeding times are not very consistent.', relevant: true },
      { id: 'meds', question: 'Any steroid medication recently?', answer: 'No steroids or regular medication.', relevant: true },
    ],
    testResults: [
      { testId: 'vet-glucose', result: 'Blood glucose 386 mg/dL.', abnormal: true },
      { testId: 'vet-urinalysis', result: 'Marked glucosuria, ketones negative, USG 1.030. No active sediment.', abnormal: true },
      { testId: 'vet-chem', result: 'Mild ALP elevation, cholesterol mildly high. Electrolytes acceptable.', abnormal: true },
      { testId: 'vet-fructosamine', result: 'Fructosamine elevated, compatible with persistent hyperglycemia.', abnormal: true },
      { testId: 'vet-bcs', result: 'BCS 4/9, mild muscle loss.', abnormal: true },
    ],
    correctDiagnosisId: 'canine-diabetes-mellitus',
    diagnosisOptions: ['canine-diabetes-mellitus', 'hyperadrenocorticism', 'chronic-kidney-disease', 'hyperthyroidism', 'urinary-tract-infection'],
    acceptableTreatmentIds: ['vet-recheck', 'vet-discharge'],
    criticalTreatmentIds: [],
    rubric: rubric(
      [
        dg('dg-01', 'Ask PU/PD and weight history', 'Asks about thirst, urination, appetite, and weight change.'),
        dg('dg-02', 'Screen for ketoacidosis signs', 'Asks about vomiting, collapse, anorexia, weakness, or dehydration.'),
        dg('dg-03', 'Ask diet and routine', 'Asks about feeding consistency, snacks, exercise, and owner capacity for injections.'),
      ],
      [
        cm('cm-01', 'Confirm diabetes logically', 'Orders glucose, urinalysis, chemistry, and fructosamine or equivalent persistent hyperglycemia evidence.', 'aaha-diabetes-2018:aaha-dm-diagnose-with-clinical-signs', 3),
        cm('cm-02', 'Educate for home management', 'Prescribes insulin/nutrition plan and explains monitoring, routine, hypoglycemia signs, and recheck.', 'aaha-diabetes-2018:aaha-dm-owner-education-monitoring', 3),
      ],
      'aaha-diabetes-2018:aaha-dm-owner-education-monitoring',
    ),
  },
];

export const POLYCLINIC_DIAGNOSIS_LABELS: Record<string, string> = {
  'theobromine-toxicosis': 'Theobromine toxicosis',
  'acute-gastroenteritis': 'Acute gastroenteritis',
  'heat-stress': 'Heat stress',
  'canine-panic-event': 'Acute panic or excitement event',
  'foreign-body-ingestion': 'Foreign body ingestion',
  'feline-urethral-obstruction': 'Feline urethral obstruction',
  'feline-idiopathic-cystitis': 'Feline idiopathic cystitis',
  constipation: 'Constipation',
  'acute-kidney-injury': 'Acute kidney injury',
  'urinary-tract-infection': 'Urinary tract infection',
  'canine-parvoviral-enteritis': 'Canine parvoviral enteritis',
  'dietary-indiscretion': 'Dietary indiscretion',
  'intestinal-parasites': 'Intestinal parasites',
  'canine-atopic-dermatitis': 'Canine atopic dermatitis',
  'flea-allergy-dermatitis': 'Flea allergy dermatitis',
  'sarcoptic-mange': 'Sarcoptic mange',
  'food-responsive-enteropathy': 'Food-responsive enteropathy',
  'canine-pyoderma': 'Canine pyoderma',
  'congestive-heart-failure': 'Congestive heart failure',
  'kennel-cough': 'Kennel cough',
  'collapsing-trachea': 'Collapsing trachea',
  'allergic-bronchitis': 'Allergic bronchitis',
  'laryngeal-paralysis': 'Laryngeal paralysis',
  'canine-diabetes-mellitus': 'Canine diabetes mellitus',
  hyperadrenocorticism: 'Hyperadrenocorticism',
  'chronic-kidney-disease': 'Chronic kidney disease',
  hyperthyroidism: 'Hyperthyroidism',
};

const empty: PatientCase[] = [];

const _bySpecialty: Record<Exclude<ClinicId, 'all-specialties'>, PatientCase[]> = {
  'internal-medicine': generalPractice,
  cardiology,
  neurology: empty,
  neurosurgery: empty,
  dermatology,
  endocrinology,
  gastroenterology: empty,
  pulmonology: empty,
  nephrology: empty,
  rheumatology: empty,
  hematology: empty,
  oncology: empty,
  'infectious-disease': empty,
  'allergy-immunology': empty,
  psychiatry: empty,
  obgyn: empty,
  urology,
  ophthalmology: empty,
  ent: empty,
  orthopedics: empty,
  pmr: empty,
  pediatrics,
  'general-surgery': empty,
  'cardiothoracic-vascular-surgery': empty,
};

export const POLYCLINIC_CASES: Record<ClinicId, PatientCase[]> = {
  ..._bySpecialty,
  'all-specialties': Object.values(_bySpecialty).flat(),
};

const _caseIdToSpecialty: Map<string, ClinicId> = (() => {
  const map = new Map<string, ClinicId>();
  for (const [specialty, cases] of Object.entries(_bySpecialty)) {
    for (const c of cases) map.set(c.id, specialty as ClinicId);
  }
  return map;
})();

export function getCaseSpecialty(caseId: string): ClinicId | undefined {
  return _caseIdToSpecialty.get(caseId);
}
