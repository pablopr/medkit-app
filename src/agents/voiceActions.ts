import type {
  ActivePatient,
  ConversationTranscriptMessage,
  VoiceClinicalAction,
} from '../game/types';
import { MEDICATIONS, SPECIALTY_MEDICATION_CATEGORIES } from '../data/medications';
import { POLYCLINIC_DIAGNOSIS_LABELS, getCaseSpecialty } from '../data/polyclinicPatients';
import { TESTS } from '../data/tests';
import { TREATMENTS } from '../data/treatments';

export interface VoiceActionExtractionResult {
  actions: VoiceClinicalAction[];
  model?: string;
}

function normalizeActions(value: unknown): VoiceClinicalAction[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item): VoiceClinicalAction[] => {
    if (!item || typeof item !== 'object') return [];
    const action = item as Partial<VoiceClinicalAction>;
    if (
      action.type !== 'test' &&
      action.type !== 'treatment' &&
      action.type !== 'diagnosis' &&
      action.type !== 'prescription' &&
      action.type !== 'history'
    ) {
      return [];
    }
    const confidence = typeof action.confidence === 'number' ? action.confidence : 0;
    const evidence = typeof action.evidence === 'string' ? action.evidence.trim() : '';
    const label = typeof action.label === 'string' ? action.label.trim() : '';
    if (!evidence || !label) return [];
    return [{
      type: action.type,
      id: typeof action.id === 'string' ? action.id : undefined,
      medicationId: typeof action.medicationId === 'string' ? action.medicationId : undefined,
      label,
      evidence,
      confidence: Math.max(0, Math.min(1, confidence)),
      dose: typeof action.dose === 'string' ? action.dose : undefined,
      duration: typeof action.duration === 'string' ? action.duration : undefined,
      source: 'voice_ai',
    }];
  });
}

export async function extractVoiceClinicalActions(
  patient: ActivePatient,
  conversationMessages: ReadonlyArray<ConversationTranscriptMessage>,
): Promise<VoiceActionExtractionResult> {
  const transcript = conversationMessages
    .filter((message) => message.role === 'user' || message.role === 'assistant')
    .map((message) => ({
      role: message.role,
      content: message.content,
    }));

  if (!transcript.some((message) => message.role === 'user' && message.content.trim())) {
    return { actions: [] };
  }
  const specialty = getCaseSpecialty(patient.case.id);
  const allowedMedicationCategories = specialty ? SPECIALTY_MEDICATION_CATEGORIES[specialty] : null;
  const visibleMedications = MEDICATIONS.filter((medication) => {
    return !allowedMedicationCategories || allowedMedicationCategories.includes(medication.category);
  });

  const response = await fetch('/agent/voice-actions/extract', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      request: {
        case_id: patient.case.id,
        patient: {
          name: patient.case.name,
          species: patient.case.species,
          breed: patient.case.breed,
          weight_kg: patient.case.weightKg,
          presenting_complaint: patient.case.presentingComplaint,
        },
        current_state: {
          ordered_test_ids: patient.orderedTestIds,
          completed_test_ids: patient.completedTestIds,
          given_treatment_ids: patient.givenTreatmentIds,
          submitted_diagnosis_id: patient.submittedDiagnosisId,
          prescription_medication_ids: (patient.prescriptions ?? []).map((rx) => rx.medicationId),
        },
        catalog: {
          historyQuestions: patient.case.anamnesis.map((item) => ({
            id: item.id,
            label: item.question,
          })),
          tests: TESTS.map((test) => ({ id: test.id, label: test.name })),
          treatments: TREATMENTS.map((treatment) => ({ id: treatment.id, label: treatment.name })),
          diagnoses: patient.case.diagnosisOptions.map((id) => ({
            id,
            label: POLYCLINIC_DIAGNOSIS_LABELS[id] ?? id,
          })),
          medications: visibleMedications.map((medication) => ({
            id: medication.id,
            label: medication.name,
            defaultDose: medication.defaultDose,
            defaultDuration: medication.defaultDuration,
          })),
        },
        transcript,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`/agent/voice-actions/extract ${response.status}: ${await response.text().catch(() => '')}`);
  }

  const data = await response.json();
  return {
    actions: normalizeActions(data?.actions),
    model: typeof data?.model === 'string' ? data.model : undefined,
  };
}
