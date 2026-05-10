// Veterinary practice guideline registry for the vet-attending grading agent.
//
// These recommendations are compact simulator summaries that point to named
// veterinary guideline sources. They are training references only, not a
// substitute for veterinary judgment or local protocols.

export interface GuidelineRecommendation {
  recId: string;
  text: string;
  recClass?: 'I' | 'IIa' | 'IIb' | 'III';
  lev?: 'A' | 'B' | 'C';
  gradeStrength?: 'strong' | 'conditional';
  gradeCertainty?: 'high' | 'moderate' | 'low' | 'very-low';
  topic: string;
  system:
    | 'cardiovascular'
    | 'endocrine'
    | 'respiratory'
    | 'renal'
    | 'gastrointestinal'
    | 'neurological'
    | 'musculoskeletal'
    | 'infectious'
    | 'dermatology'
    | 'toxicology'
    | 'preventive'
    | 'other';
}

export interface Guideline {
  id: string;
  body: 'AAHA' | 'WSAVA' | 'RECOVER' | 'ISFM' | 'ACVIM' | 'AAFP' | 'IRIS' | 'MERCK' | 'CORNELL';
  year: number;
  region: 'US' | 'EU' | 'Global';
  title: string;
  url: string;
  pdfUrl?: string;
  doi?: string;
  pubmedId?: string;
  recommendations: GuidelineRecommendation[];
  verificationStatus: 'auto-fetched' | 'verified' | 'needs-verification';
  lastVerified: string;
  notes?: string;
  supersededBy?: string;
}

export const GUIDELINES: Guideline[] = [
  {
    id: 'aaha-canine-vaccination-2022',
    body: 'AAHA',
    year: 2022,
    region: 'US',
    title: 'AAHA Canine Vaccination Guidelines',
    url: 'https://www.aaha.org/resources/guidelines/canine-vaccination-guidelines/',
    verificationStatus: 'needs-verification',
    lastVerified: '2026-04-30',
    notes: 'Simulator summary. A veterinarian should verify final wording before clinical use.',
    recommendations: [
      {
        recId: 'aaha-vax-risk-based-history',
        text: 'Use signalment, lifestyle, exposure risk, vaccination history, and local disease risk when building a canine preventive plan.',
        topic: 'preventive risk assessment',
        system: 'preventive',
      },
    ],
  },
  {
    id: 'wsava-global-nutrition-2011',
    body: 'WSAVA',
    year: 2011,
    region: 'Global',
    title: 'WSAVA Global Nutrition Guidelines',
    url: 'https://wsava.org/global-guidelines/global-nutrition-guidelines/',
    verificationStatus: 'needs-verification',
    lastVerified: '2026-04-30',
    notes: 'Simulator summary. Used for body weight, diet, and follow-up planning.',
    recommendations: [
      {
        recId: 'wsava-nutrition-assessment',
        text: 'Include diet history, body weight, body condition, and muscle condition as part of routine nutritional assessment.',
        topic: 'nutrition assessment',
        system: 'preventive',
      },
    ],
  },
  {
    id: 'aaha-fluid-therapy-2013',
    body: 'AAHA',
    year: 2013,
    region: 'US',
    title: 'AAHA/AAFP Fluid Therapy Guidelines for Dogs and Cats',
    url: 'https://www.aaha.org/resources/guidelines/fluid-therapy-guidelines/',
    verificationStatus: 'needs-verification',
    lastVerified: '2026-04-30',
    notes: 'Simulator summary. Supports dehydration and emergency stabilization rubrics.',
    recommendations: [
      {
        recId: 'aaha-fluid-assess-hydration',
        text: 'Assess perfusion, hydration, electrolytes, and ongoing losses before choosing a fluid plan.',
        topic: 'fluid assessment',
        system: 'other',
      },
      {
        recId: 'aaha-fluid-monitor-response',
        text: 'Monitor clinical response and laboratory changes during fluid therapy, then adjust the plan.',
        topic: 'fluid monitoring',
        system: 'other',
      },
    ],
  },
  {
    id: 'aaha-diabetes-2018',
    body: 'AAHA',
    year: 2018,
    region: 'US',
    title: 'AAHA Diabetes Management Guidelines for Dogs and Cats',
    url: 'https://www.aaha.org/resources/guidelines/diabetes-management-guidelines/',
    verificationStatus: 'needs-verification',
    lastVerified: '2026-04-30',
    notes: 'Simulator summary for diagnosis, insulin start, monitoring, and owner education.',
    recommendations: [
      {
        recId: 'aaha-dm-diagnose-with-clinical-signs',
        text: 'Diagnose diabetes from compatible clinical signs with persistent hyperglycemia and glucosuria.',
        topic: 'diabetes diagnosis',
        system: 'endocrine',
      },
      {
        recId: 'aaha-dm-owner-education-monitoring',
        text: 'Owner education, home observation, diet consistency, insulin handling, and monitoring plans are core parts of diabetes management.',
        topic: 'diabetes owner education',
        system: 'endocrine',
      },
    ],
  },
  {
    id: 'isfm-feline-urethral-obstruction-2022',
    body: 'ISFM',
    year: 2022,
    region: 'Global',
    title: 'ISFM Consensus Guidelines on the Management of Feline Urethral Obstruction',
    url: 'https://icatcare.org/advice/feline-urethral-obstruction/',
    verificationStatus: 'needs-verification',
    lastVerified: '2026-04-30',
    notes: 'Simulator summary for urgent blocked-cat recognition and stabilization.',
    recommendations: [
      {
        recId: 'isfm-fuo-recognise-emergency',
        text: 'A suspected obstructed male cat is an emergency; assess bladder size, pain, cardiovascular status, electrolytes, and renal parameters promptly.',
        topic: 'blocked cat emergency recognition',
        system: 'renal',
      },
      {
        recId: 'isfm-fuo-analgesia-decompression',
        text: 'Provide analgesia and stabilize before urethral catheterization or decompression according to patient status.',
        topic: 'blocked cat stabilization',
        system: 'renal',
      },
    ],
  },
  {
    id: 'acvim-myxomatous-mitral-2019',
    body: 'ACVIM',
    year: 2019,
    region: 'Global',
    title: 'ACVIM Consensus Guidelines for Myxomatous Mitral Valve Disease in Dogs',
    url: 'https://www.acvim.org/consensus-statements',
    verificationStatus: 'needs-verification',
    lastVerified: '2026-04-30',
    notes: 'Simulator summary for murmur, cough, imaging, and CHF escalation.',
    recommendations: [
      {
        recId: 'acvim-mmvd-stage-with-imaging',
        text: 'Use history, physical examination, thoracic imaging, blood pressure, and echocardiography when staging suspected canine heart disease.',
        topic: 'cardiac staging',
        system: 'cardiovascular',
      },
      {
        recId: 'acvim-mmvd-chf-diuretic',
        text: 'Pulmonary edema or congestive heart failure signs require prompt stabilization and diuretic-based treatment under veterinary supervision.',
        topic: 'heart failure stabilization',
        system: 'cardiovascular',
      },
    ],
  },
  {
    id: 'aaha-dermatology-allergy-2023',
    body: 'AAHA',
    year: 2023,
    region: 'US',
    title: 'AAHA Allergic Skin Disease Guidance',
    url: 'https://www.aaha.org/resources/guidelines/',
    verificationStatus: 'needs-verification',
    lastVerified: '2026-04-30',
    notes: 'Simulator summary for pruritus, ectoparasites, cytology, and multimodal itch control.',
    recommendations: [
      {
        recId: 'aaha-derm-rule-out-parasites-infection',
        text: 'Evaluate pruritic animals for fleas, mites, and secondary bacterial or yeast infection before labeling allergy alone.',
        topic: 'itch workup',
        system: 'dermatology',
      },
      {
        recId: 'aaha-derm-multimodal-plan',
        text: 'Allergic skin disease plans should combine parasite control, infection treatment when present, itch relief, and owner follow-up.',
        topic: 'itch treatment plan',
        system: 'dermatology',
      },
    ],
  },
  {
    id: 'wsava-pancreatitis-2011',
    body: 'WSAVA',
    year: 2011,
    region: 'Global',
    title: 'Diagnosis and Management of Canine Acute Pancreatitis',
    url: 'https://www.ivis.org/library/wsava/wsava-annual-congress-korea-2011/diagnosis-and-management-of-canine-acute',
    verificationStatus: 'needs-verification',
    lastVerified: '2026-05-10',
    notes: 'Simulator summary based on WSAVA congress education material for pancreatitis pattern recognition and supportive care.',
    recommendations: [
      {
        recId: 'wsava-pancreatitis-diagnostic-pattern',
        text: 'Vomiting with cranial abdominal pain and compatible laboratory or imaging findings should prompt a pancreatitis workup while ruling out other gastrointestinal disease.',
        topic: 'pancreatitis workup',
        system: 'gastrointestinal',
      },
      {
        recId: 'wsava-pancreatitis-supportive-care',
        text: 'Acute pancreatitis management centers on hydration, antiemetic support, analgesia, nutrition planning, and monitoring for complications.',
        topic: 'pancreatitis management',
        system: 'gastrointestinal',
      },
    ],
  },
  {
    id: 'iris-ckd-2023',
    body: 'IRIS',
    year: 2023,
    region: 'Global',
    title: 'IRIS Staging and Treatment Recommendations for CKD',
    url: 'https://www.iris-kidney.com/iris-guidelines-1',
    pdfUrl: 'https://www.iris-kidney.com/s/IRIS_CAT_Treatment_Recommendations_2023.pdf',
    verificationStatus: 'needs-verification',
    lastVerified: '2026-05-10',
    notes: 'Simulator summary for CKD staging, substaging, blood pressure, proteinuria, and owner follow-up.',
    recommendations: [
      {
        recId: 'iris-ckd-stage-substage',
        text: 'Stage stable CKD using kidney markers and urine concentration, then substage by proteinuria and systemic blood pressure.',
        topic: 'CKD staging',
        system: 'renal',
      },
      {
        recId: 'iris-ckd-treatment-monitoring',
        text: 'CKD plans should monitor hydration, appetite, body weight, phosphorus, blood pressure, proteinuria, and owner ability to maintain nutrition.',
        topic: 'CKD monitoring',
        system: 'renal',
      },
    ],
  },
  {
    id: 'aaha-pain-management-2022',
    body: 'AAHA',
    year: 2022,
    region: 'US',
    title: '2022 AAHA Pain Management Guidelines for Dogs and Cats',
    url: 'https://www.aaha.org/resources/2022-aaha-pain-management-guidelines-for-dogs-and-cats/',
    verificationStatus: 'needs-verification',
    lastVerified: '2026-05-10',
    notes: 'Simulator summary for pain assessment, multimodal analgesia, owner instructions, and follow-up.',
    recommendations: [
      {
        recId: 'aaha-pain-assess-function',
        text: 'Pain assessment should include patient behavior, function, orthopedic or neurologic findings, and owner-observed mobility changes.',
        topic: 'pain assessment',
        system: 'musculoskeletal',
      },
      {
        recId: 'aaha-pain-multimodal-plan',
        text: 'Pain plans should combine appropriate analgesia, activity guidance, nonpharmacologic care, adverse-effect counseling, and reassessment.',
        topic: 'pain management',
        system: 'musculoskeletal',
      },
    ],
  },
  {
    id: 'merck-feline-asthma-2024',
    body: 'MERCK',
    year: 2024,
    region: 'Global',
    title: 'Feline Bronchial Asthma',
    url: 'https://www.merckvetmanual.com/respiratory-system/respiratory-diseases-of-small-animals/feline-bronchial-asthma',
    verificationStatus: 'needs-verification',
    lastVerified: '2026-05-10',
    notes: 'Simulator summary for feline asthma recognition, rule-outs, oxygen/stabilization, and owner environmental counseling.',
    recommendations: [
      {
        recId: 'merck-asthma-rule-out-distress',
        text: 'Cats with cough, wheeze, tachypnea, or open-mouth breathing require assessment for respiratory distress and rule-outs such as heart disease, infection, parasites, or foreign body.',
        topic: 'feline respiratory distress',
        system: 'respiratory',
      },
      {
        recId: 'merck-asthma-anti-inflammatory-plan',
        text: 'Feline asthma plans commonly include anti-inflammatory treatment, bronchodilator support when indicated, environmental trigger reduction, and follow-up.',
        topic: 'feline asthma management',
        system: 'respiratory',
      },
    ],
  },
  {
    id: 'cornell-corneal-ulcers',
    body: 'CORNELL',
    year: 2026,
    region: 'US',
    title: 'Corneal Ulcers',
    url: 'https://www.vet.cornell.edu/departments-centers-and-institutes/cornell-feline-health-center/health-information/feline-health-topics/corneal-ulcers',
    verificationStatus: 'needs-verification',
    lastVerified: '2026-05-10',
    notes: 'Simulator summary for painful eye triage, fluorescein confirmation, self-trauma prevention, and recheck planning.',
    recommendations: [
      {
        recId: 'cornell-ulcer-fluorescein-confirm',
        text: 'A suspected corneal ulcer should be confirmed with fluorescein staining and assessed for depth, infection risk, and complications.',
        topic: 'corneal ulcer diagnosis',
        system: 'other',
      },
      {
        recId: 'cornell-ulcer-protect-recheck',
        text: 'Corneal ulcer plans should prevent self-trauma, use appropriate topical therapy when indicated, and define a short recheck window.',
        topic: 'corneal ulcer management',
        system: 'other',
      },
    ],
  },
];

export function getGuideline(id: string): Guideline | null {
  return GUIDELINES.find((g) => g.id === id) ?? null;
}

export function getRecommendation(
  ref: string,
): { guideline: Guideline; rec: GuidelineRecommendation } | null {
  const [gid, rid] = ref.split(':');
  if (!gid || !rid) return null;
  const g = getGuideline(gid);
  if (!g) return null;
  const r = g.recommendations.find((x) => x.recId === rid);
  if (!r) return null;
  return { guideline: g, rec: r };
}
