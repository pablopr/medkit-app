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

const gastroenterology: PatientCase[] = [
  {
    id: 'im-007',
    name: 'Bella',
    age: 7,
    gender: 'F',
    species: 'dog',
    breed: 'Miniature Schnauzer',
    weightKg: 8.9,
    neuterStatus: 'spayed',
    ownerName: 'Irene',
    severity: 'urgent',
    arrivalBlurb: 'Irene brings Bella in after repeated vomiting. Bella stands tucked up and resists abdominal palpation.',
    presentingComplaint: 'Vomiting and painful abdomen',
    chiefComplaint: 'Bella vomited all night and cries when I pick her up under the belly.',
    vitals: {
      hr: 136,
      rr: 34,
      temp: 39.1,
      mmColor: 'pink, tacky',
      crtSec: 2,
      hydration: '5 percent dehydrated',
      painScore: 6,
      mentation: 'quiet but responsive',
    },
    anamnesis: [
      { id: 'vomiting', question: 'How many times has Bella vomited and can she keep water down?', answer: 'Six or seven times since midnight. Water comes back up.', relevant: true },
      { id: 'pain', question: 'Does she seem painful or hunched?', answer: 'Yes, she is praying with her front legs down and yelps if I lift her.', relevant: true },
      { id: 'diet-fat', question: 'Any fatty food, table scraps, or bin access?', answer: 'She ate leftover chorizo and cheese at a family lunch yesterday.', relevant: true },
      { id: 'diarrhea', question: 'Any diarrhea or blood?', answer: 'One loose stool, no obvious blood.', relevant: true },
      { id: 'meds', question: 'Any medication, toxins, or previous episodes?', answer: 'No toxins. She had a milder vomiting episode last year after rich food.', relevant: true },
    ],
    testResults: [
      { testId: 'vet-physical-exam', result: 'Tucked abdomen, cranial abdominal pain, mild dehydration. No palpable foreign body.', abnormal: true },
      { testId: 'vet-cbc', result: 'Mild neutrophilia and hemoconcentration.', abnormal: true },
      { testId: 'vet-chem', result: 'Mild ALT/ALP increase, mild azotemia compatible with dehydration.', abnormal: true },
      { testId: 'vet-electrolytes', result: 'Mild hypokalemia and hypochloremia after vomiting.', abnormal: true },
      { testId: 'vet-pancreatic-lipase', result: 'Pancreatic lipase strongly positive.', abnormal: true },
      { testId: 'vet-abdominal-us', result: 'Hypoechoic pancreas with hyperechoic peripancreatic fat. No obstructive foreign body seen.', abnormal: true },
    ],
    correctDiagnosisId: 'acute-pancreatitis',
    diagnosisOptions: ['acute-pancreatitis', 'acute-gastroenteritis', 'foreign-body-ingestion', 'dietary-indiscretion', 'hypoadrenocorticism'],
    acceptableTreatmentIds: ['vet-iv-catheter', 'vet-iv-fluids', 'vet-antiemetic', 'vet-analgesia', 'vet-hospitalize', 'vet-diet-plan'],
    criticalTreatmentIds: ['vet-iv-fluids', 'vet-analgesia'],
    rubric: rubric(
      [
        dg('dg-01', 'Characterize vomiting and hydration', 'Asks frequency, water tolerance, appetite, diarrhea, and urination.'),
        dg('dg-02', 'Ask pain and rich-food trigger', 'Asks about abdominal pain posture, table scraps, fatty food, bin access, or recurrence.'),
        dg('dg-03', 'Screen surgical mimics', 'Asks about foreign body risk, toxin exposure, medications, collapse, or severe deterioration.'),
      ],
      [
        cm('cm-01', 'Confirm pancreatitis pattern', 'Orders minimum database plus pancreatic lipase or abdominal imaging while considering differentials.', 'wsava-pancreatitis-2011:wsava-pancreatitis-diagnostic-pattern', 3),
        cm('cm-02', 'Stabilize GI pain and losses', 'Records fluids, antiemetic support, analgesia, nutrition advice, and hospitalization or close monitoring.', 'wsava-pancreatitis-2011:wsava-pancreatitis-supportive-care', 3),
      ],
      'wsava-pancreatitis-2011:wsava-pancreatitis-supportive-care',
    ),
  },
];

const pulmonology: PatientCase[] = [
  {
    id: 'im-008',
    name: 'Cleo',
    age: 4,
    gender: 'F',
    species: 'cat',
    breed: 'Siamese',
    weightKg: 4.2,
    neuterStatus: 'spayed',
    ownerName: 'Laura',
    severity: 'critical',
    arrivalBlurb: 'Laura rushes in with Cleo crouched low, neck extended, and breathing fast.',
    presentingComplaint: 'Wheezing and open-mouth breathing',
    chiefComplaint: 'Cleo has coughing fits and today she started breathing with her mouth open.',
    vitals: {
      hr: 188,
      rr: 64,
      temp: 38.9,
      mmColor: 'pink to pale pink',
      crtSec: 2,
      hydration: 'normal',
      painScore: 2,
      mentation: 'anxious, oxygen responsive',
      spo2: 91,
    },
    anamnesis: [
      { id: 'breathing', question: 'Is Cleo breathing with effort or open mouth?', answer: 'Yes, she crouches with her neck out and opened her mouth twice.', relevant: true },
      { id: 'cough', question: 'How long has she been coughing or wheezing?', answer: 'She has had dry coughing fits for months, worse this week.', relevant: true },
      { id: 'triggers', question: 'Any dust, smoke, perfumes, litter changes, or renovations?', answer: 'We changed to a dusty litter and my partner smokes on the balcony.', relevant: true },
      { id: 'heart', question: 'Any heart disease, fainting, or blue gums?', answer: 'No known heart disease or fainting.', relevant: true },
      { id: 'parasites', question: 'Is she on parasite prevention and does she go outside?', answer: 'Indoor only, not on prevention.', relevant: true },
    ],
    testResults: [
      { testId: 'vet-physical-exam', result: 'Expiratory wheezes, prolonged expiratory phase. Stress worsens respiratory effort.', abnormal: true },
      { testId: 'vet-thoracic-rads', result: 'Bronchial pattern with mild hyperinflation. No cardiomegaly or pleural effusion.', abnormal: true },
      { testId: 'vet-cbc', result: 'Mild eosinophilia. No marked neutrophilia.', abnormal: true },
      { testId: 'vet-ntprobnp', result: 'Not elevated; cardiac stretch less likely.', abnormal: false },
    ],
    correctDiagnosisId: 'feline-asthma-crisis',
    diagnosisOptions: ['feline-asthma-crisis', 'congestive-heart-failure', 'pneumonia', 'lungworm-disease', 'foreign-body-airway'],
    acceptableTreatmentIds: ['vet-oxygen', 'vet-bronchodilator', 'vet-hospitalize', 'vet-recheck'],
    criticalTreatmentIds: ['vet-oxygen', 'vet-bronchodilator'],
    rubric: rubric(
      [
        dg('dg-01', 'Prioritize respiratory distress', 'Asks about open-mouth breathing, effort, gum color, collapse, and current stress level.'),
        dg('dg-02', 'Characterize cough and triggers', 'Asks duration, wheeze/cough pattern, smoke, dust, litter, aerosols, and seasonality.'),
        dg('dg-03', 'Screen major rule-outs', 'Asks about heart disease, infection signs, parasite exposure, travel, and foreign body risk.'),
      ],
      [
        cm('cm-01', 'Stabilize before stressful testing', 'Records oxygen/stress minimization and orders thoracic imaging or CBC only when clinically appropriate.', 'merck-feline-asthma-2024:merck-asthma-rule-out-distress', 3),
        cm('cm-02', 'Build asthma control plan', 'Records bronchodilator/anti-inflammatory plan, environmental trigger reduction, and close follow-up.', 'merck-feline-asthma-2024:merck-asthma-anti-inflammatory-plan', 3),
      ],
      'merck-feline-asthma-2024:merck-asthma-rule-out-distress',
    ),
  },
];

const nephrology: PatientCase[] = [
  {
    id: 'im-009',
    name: 'Simba',
    age: 12,
    gender: 'M',
    species: 'cat',
    breed: 'Domestic Longhair',
    weightKg: 4.7,
    neuterStatus: 'neutered',
    ownerName: 'Miguel',
    severity: 'stable',
    arrivalBlurb: 'Miguel brings Simba for progressive weight loss, increased thirst, and a dull coat.',
    presentingComplaint: 'Drinking more and losing weight',
    chiefComplaint: 'Simba drinks a lot, urinates huge clumps, and has lost weight over two months.',
    vitals: {
      hr: 156,
      rr: 30,
      temp: 38.3,
      mmColor: 'pale pink',
      crtSec: 2,
      hydration: 'mildly dehydrated',
      painScore: 1,
      mentation: 'quiet but interactive',
      bp: '172/98',
    },
    anamnesis: [
      { id: 'pupd', question: 'How has thirst and urination changed?', answer: 'He empties the bowl faster and the litter clumps are much bigger.', relevant: true },
      { id: 'weight', question: 'Has appetite, weight, or muscle changed?', answer: 'He eats but is thinner over his back and hips.', relevant: true },
      { id: 'vomit', question: 'Any vomiting, nausea, bad breath, or constipation?', answer: 'He vomits foam once or twice a week and seems nauseous some mornings.', relevant: true },
      { id: 'diet', question: 'What diet does he eat?', answer: 'Mostly senior dry food, and he is picky with wet food.', relevant: true },
      { id: 'meds', question: 'Any medications, toxins, or urinary infection history?', answer: 'No regular medication and no known toxin exposure.', relevant: true },
    ],
    testResults: [
      { testId: 'vet-chem', result: 'Creatinine 2.4 mg/dL, BUN 48 mg/dL, phosphorus mildly increased.', abnormal: true },
      { testId: 'vet-urinalysis', result: 'USG 1.018, inactive sediment. Trace protein.', abnormal: true },
      { testId: 'vet-sdma-upc', result: 'SDMA increased; UPC borderline proteinuric.', abnormal: true },
      { testId: 'vet-bp', result: 'Doppler systolic BP 172 mmHg on repeat quiet measurements.', abnormal: true },
      { testId: 'vet-electrolytes', result: 'Mild hypokalemia. Sodium and chloride within reference range.', abnormal: true },
    ],
    correctDiagnosisId: 'chronic-kidney-disease',
    diagnosisOptions: ['chronic-kidney-disease', 'feline-hyperthyroidism', 'canine-diabetes-mellitus', 'urinary-tract-infection', 'acute-kidney-injury'],
    acceptableTreatmentIds: ['vet-diet-plan', 'vet-bp-management', 'vet-recheck', 'vet-discharge'],
    criticalTreatmentIds: ['vet-recheck'],
    rubric: rubric(
      [
        dg('dg-01', 'Ask PU/PD and weight trajectory', 'Asks about thirst, urine volume, appetite, weight, and muscle loss.'),
        dg('dg-02', 'Ask nausea and hydration clues', 'Asks about vomiting, nausea, constipation, oral odor, hydration, or appetite dips.'),
        dg('dg-03', 'Ask diet and medication context', 'Asks about diet acceptance, toxins, NSAIDs, urinary history, or owner capacity for monitoring.'),
      ],
      [
        cm('cm-01', 'Stage and substage CKD', 'Orders chemistry, urinalysis, SDMA/UPC, and blood pressure or equivalent staging/substaging data.', 'iris-ckd-2023:iris-ckd-stage-substage', 3),
        cm('cm-02', 'Plan monitoring and owner support', 'Records diet/hydration/BP/proteinuria monitoring and concrete recheck plan.', 'iris-ckd-2023:iris-ckd-treatment-monitoring', 3),
      ],
      'iris-ckd-2023:iris-ckd-treatment-monitoring',
    ),
  },
];

const orthopedics: PatientCase[] = [
  {
    id: 'im-010',
    name: 'Kira',
    age: 6,
    gender: 'F',
    species: 'dog',
    breed: 'Staffordshire Bull Terrier',
    weightKg: 19.2,
    neuterStatus: 'spayed',
    ownerName: 'Noa',
    severity: 'urgent',
    arrivalBlurb: 'Noa says Kira yelped while chasing a ball yesterday and now barely uses the right hind limb.',
    presentingComplaint: 'Sudden hindlimb lameness',
    chiefComplaint: 'Kira twisted while running after a ball and now she will not put weight on her back leg.',
    vitals: {
      hr: 118,
      rr: 28,
      temp: 38.6,
      mmColor: 'pink',
      crtSec: 1.5,
      hydration: 'normal',
      painScore: 5,
      mentation: 'bright, painful on gait',
    },
    anamnesis: [
      { id: 'mechanism', question: 'What exactly happened before the limp?', answer: 'She pivoted hard chasing a ball, yelped, and lifted the right back leg.', relevant: true },
      { id: 'weight-bearing', question: 'Can she bear weight at all?', answer: 'Only toe-touching. She hops on three legs outside.', relevant: true },
      { id: 'prior', question: 'Any previous lameness or knee issues?', answer: 'She had mild stiffness after big walks but nothing like this.', relevant: true },
      { id: 'neuro', question: 'Any dragging, knuckling, or back pain?', answer: 'No dragging. It seems like the knee area hurts.', relevant: true },
      { id: 'meds', question: 'Has she had any medication today?', answer: 'No human painkillers. We only rested her overnight.', relevant: true },
    ],
    testResults: [
      { testId: 'vet-physical-exam', result: 'Right stifle effusion, pain on extension, positive cranial drawer/tibial thrust when relaxed.', abnormal: true },
      { testId: 'vet-pain-score', result: 'Pain score 5/10, improves with gentle handling and rest.', abnormal: true },
      { testId: 'vet-orthopedic-rads', result: 'Stifle effusion and early osteophytes. No fracture or luxation seen.', abnormal: true },
    ],
    correctDiagnosisId: 'cranial-cruciate-ligament-injury',
    diagnosisOptions: ['cranial-cruciate-ligament-injury', 'patellar-luxation', 'soft-tissue-strain', 'hip-dysplasia', 'immune-mediated-polyarthritis'],
    acceptableTreatmentIds: ['vet-analgesia', 'vet-activity-restriction', 'vet-surgery-referral', 'vet-recheck', 'vet-discharge'],
    criticalTreatmentIds: ['vet-analgesia', 'vet-recheck'],
    rubric: rubric(
      [
        dg('dg-01', 'Clarify lameness onset', 'Asks about mechanism, acute yelp, weight bearing, duration, and progression.'),
        dg('dg-02', 'Screen neurologic and systemic mimics', 'Asks about dragging, back pain, fever, multiple joints, trauma, or collapse.'),
        dg('dg-03', 'Check medication safety', 'Asks about human NSAIDs, prior medication, appetite, kidney/liver disease, or GI risk.'),
      ],
      [
        cm('cm-01', 'Localize pain and image appropriately', 'Orders orthopedic exam/pain score/radiographs or equivalent stifle localization workup.', 'aaha-pain-management-2022:aaha-pain-assess-function', 3),
        cm('cm-02', 'Protect comfort and function', 'Records analgesia, activity restriction, recheck, and surgical or specialist discussion for likely CCL injury.', 'aaha-pain-management-2022:aaha-pain-multimodal-plan', 3),
      ],
      'aaha-pain-management-2022:aaha-pain-multimodal-plan',
    ),
  },
];

const ophthalmology: PatientCase[] = [
  {
    id: 'im-011',
    name: 'Otto',
    age: 5,
    gender: 'M',
    species: 'dog',
    breed: 'Boxer',
    weightKg: 28.4,
    neuterStatus: 'neutered',
    ownerName: 'Claudia',
    severity: 'urgent',
    arrivalBlurb: 'Claudia arrives with Otto squinting hard and rubbing his right eye after a park walk.',
    presentingComplaint: 'Painful squinting eye',
    chiefComplaint: 'Otto keeps his right eye shut and rubs it after running through bushes.',
    vitals: {
      hr: 104,
      rr: 24,
      temp: 38.4,
      mmColor: 'pink',
      crtSec: 1.5,
      hydration: 'normal',
      painScore: 4,
      mentation: 'bright but photophobic',
    },
    anamnesis: [
      { id: 'trauma', question: 'Was there trauma, scratching, or plant material exposure?', answer: 'He crashed through bushes at the park and started squinting soon after.', relevant: true },
      { id: 'vision', question: 'Can he navigate and does the eye look cloudy?', answer: 'He can walk around, but the surface looks a bit cloudy and watery.', relevant: true },
      { id: 'discharge', question: 'Any discharge or rubbing?', answer: 'Clear tears at first, now a bit mucky. He keeps pawing at it.', relevant: true },
      { id: 'meds', question: 'Have you put any drops or medication in the eye?', answer: 'No drops. We rinsed gently with saline once.', relevant: true },
      { id: 'history', question: 'Any previous eye ulcers or dry eye?', answer: 'No previous ulcers, but he has prominent eyes.', relevant: true },
    ],
    testResults: [
      { testId: 'vet-physical-exam', result: 'Right blepharospasm, epiphora, mild corneal haze. No obvious globe rupture.', abnormal: true },
      { testId: 'vet-fluorescein-stain', result: 'Positive focal fluorescein uptake on central cornea, superficial ulcer pattern.', abnormal: true },
      { testId: 'vet-tonometry', result: 'Intraocular pressure within reference range. Glaucoma less likely.', abnormal: false },
    ],
    correctDiagnosisId: 'corneal-ulcer',
    diagnosisOptions: ['corneal-ulcer', 'conjunctivitis', 'glaucoma', 'uveitis', 'dry-eye'],
    acceptableTreatmentIds: ['vet-eye-medication', 'vet-protective-collar', 'vet-analgesia', 'vet-recheck', 'vet-discharge'],
    criticalTreatmentIds: ['vet-eye-medication', 'vet-protective-collar', 'vet-recheck'],
    rubric: rubric(
      [
        dg('dg-01', 'Clarify trauma and self-trauma', 'Asks about plant exposure, scratches, rubbing, discharge, cloudiness, and onset.'),
        dg('dg-02', 'Screen vision and emergency eye signs', 'Asks about vision, severe cloudiness, color change, globe trauma, or sudden blindness.'),
        dg('dg-03', 'Check medication risks', 'Asks whether steroid drops, human medication, or prior eye disease were present.'),
      ],
      [
        cm('cm-01', 'Confirm ulcer safely', 'Orders fluorescein stain and tonometry or equivalent painful-eye assessment before treatment.', 'cornell-corneal-ulcers:cornell-ulcer-fluorescein-confirm', 3),
        cm('cm-02', 'Protect the eye and recheck quickly', 'Records topical eye medication, protective collar, analgesia, and short recheck or referral instructions.', 'cornell-corneal-ulcers:cornell-ulcer-protect-recheck', 3),
      ],
      'cornell-corneal-ulcers:cornell-ulcer-protect-recheck',
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
  'acute-pancreatitis': 'Acute pancreatitis',
  hypoadrenocorticism: 'Hypoadrenocorticism',
  'feline-asthma-crisis': 'Feline asthma crisis',
  pneumonia: 'Pneumonia',
  'lungworm-disease': 'Lungworm disease',
  'foreign-body-airway': 'Airway foreign body',
  'feline-hyperthyroidism': 'Feline hyperthyroidism',
  'cranial-cruciate-ligament-injury': 'Cranial cruciate ligament injury',
  'patellar-luxation': 'Patellar luxation',
  'soft-tissue-strain': 'Soft tissue strain',
  'hip-dysplasia': 'Hip dysplasia',
  'immune-mediated-polyarthritis': 'Immune-mediated polyarthritis',
  'corneal-ulcer': 'Corneal ulcer',
  conjunctivitis: 'Conjunctivitis',
  glaucoma: 'Glaucoma',
  uveitis: 'Uveitis',
  'dry-eye': 'Dry eye',
};

const empty: PatientCase[] = [];

const _bySpecialty: Record<Exclude<ClinicId, 'all-specialties'>, PatientCase[]> = {
  'internal-medicine': generalPractice,
  cardiology,
  neurology: empty,
  neurosurgery: empty,
  dermatology,
  endocrinology,
  gastroenterology,
  pulmonology,
  nephrology,
  rheumatology: empty,
  hematology: empty,
  oncology: empty,
  'infectious-disease': empty,
  'allergy-immunology': empty,
  psychiatry: empty,
  obgyn: empty,
  urology,
  ophthalmology,
  ent: empty,
  orthopedics,
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
