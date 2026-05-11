import type {
  ActivePatient,
  ConversationTranscriptMessage,
  VoiceActionExtractionSummary,
  VoiceClinicalAction,
} from './types';
import { MEDICATIONS, medicationById } from '../data/medications.ts';
import { TESTS } from '../data/tests.ts';
import { TREATMENTS } from '../data/treatments.ts';

const KNOWN_TEST_IDS = new Set(TESTS.map((test) => test.id));
const KNOWN_TREATMENT_IDS = new Set(TREATMENTS.map((treatment) => treatment.id));
const KNOWN_MEDICATION_IDS = new Set(MEDICATIONS.map((medication) => medication.id));

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

function cloneConversationMessages(
  messages: ReadonlyArray<ConversationTranscriptMessage>,
): ConversationTranscriptMessage[] | undefined {
  const out = messages.flatMap((message) => {
    if (message.role !== 'user' && message.role !== 'assistant') return [];
    const content = message.content.trim();
    return content ? [{ role: message.role, content }] : [];
  });
  return out.length > 0 ? out : undefined;
}

function normalizeConfidence(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, Math.round(value * 100) / 100));
}

function cleanVoiceActions(actions: ReadonlyArray<VoiceClinicalAction>): VoiceClinicalAction[] {
  return actions.flatMap((action) => {
    if (!action || typeof action !== 'object') return [];
    const confidence = normalizeConfidence(action.confidence);
    const evidence = typeof action.evidence === 'string' ? action.evidence.trim() : '';
    const label = typeof action.label === 'string' && action.label.trim()
      ? action.label.trim()
      : action.id ?? action.medicationId ?? action.type;
    if (!evidence) return [];
    return [{
      ...action,
      label,
      evidence,
      confidence,
      source: 'voice_ai' as const,
      applied: false,
    }];
  });
}

export function applyVoiceClinicalActionsToPatient(
  patient: ActivePatient,
  actions: ReadonlyArray<VoiceClinicalAction>,
  extraction: VoiceActionExtractionSummary,
  conversationMessages: ReadonlyArray<ConversationTranscriptMessage> = [],
): ActivePatient {
  const now = Date.now();
  let orderedTestIds = [...patient.orderedTestIds];
  let completedTestIds = [...patient.completedTestIds];
  let testOrderedAt = { ...patient.testOrderedAt };
  let givenTreatmentIds = [...patient.givenTreatmentIds];
  let askedQuestionIds = [...patient.askedQuestionIds];
  let submittedDiagnosisId = patient.submittedDiagnosisId;
  let prescriptions = patient.prescriptions ? [...patient.prescriptions] : [];
  const knownHistoryQuestionIds = new Set(patient.case.anamnesis.map((item) => item.id));

  const normalizedActions = cleanVoiceActions(actions).map((action) => {
    if (action.type === 'history' && action.id) {
      if (!knownHistoryQuestionIds.has(action.id)) {
        return { ...action, reason: 'History question is not available for this case' };
      }
      askedQuestionIds = uniqueInOrder([...askedQuestionIds, action.id]);
      return { ...action, applied: true };
    }

    if (action.type === 'test' && action.id) {
      if (!KNOWN_TEST_IDS.has(action.id)) {
        return { ...action, reason: 'Unknown test id' };
      }
      orderedTestIds = uniqueInOrder([...orderedTestIds, action.id]);
      completedTestIds = uniqueInOrder([...completedTestIds, action.id]);
      if (typeof testOrderedAt[action.id] !== 'number') {
        testOrderedAt = { ...testOrderedAt, [action.id]: now };
      }
      return { ...action, applied: true };
    }

    if (action.type === 'treatment' && action.id) {
      if (!KNOWN_TREATMENT_IDS.has(action.id)) {
        return { ...action, reason: 'Unknown treatment id' };
      }
      givenTreatmentIds = uniqueInOrder([...givenTreatmentIds, action.id]);
      return { ...action, applied: true };
    }

    if (action.type === 'diagnosis' && action.id) {
      if (!patient.case.diagnosisOptions.includes(action.id)) {
        return { ...action, reason: 'Diagnosis is not available for this case' };
      }
      if (submittedDiagnosisId && submittedDiagnosisId !== action.id) {
        return { ...action, reason: 'A different diagnosis was already submitted' };
      }
      submittedDiagnosisId = action.id;
      return { ...action, applied: true };
    }

    if (action.type === 'prescription' && action.medicationId) {
      if (!KNOWN_MEDICATION_IDS.has(action.medicationId)) {
        return { ...action, reason: 'Unknown medication id' };
      }
      const alreadyPrescribed = prescriptions.some((rx) => rx.medicationId === action.medicationId);
      const medication = medicationById(action.medicationId);
      if (!alreadyPrescribed) {
        prescriptions = [
          ...prescriptions,
          {
            medicationId: action.medicationId,
            dose: action.dose?.trim() || medication?.defaultDose || 'as discussed',
            duration: action.duration?.trim() || medication?.defaultDuration || 'as discussed',
            prescribedAt: now,
          },
        ];
      }
      return { ...action, applied: true };
    }

    return { ...action, reason: 'Action shape was incomplete' };
  });

  return {
    ...patient,
    askedQuestionIds,
    orderedTestIds,
    completedTestIds,
    testOrderedAt,
    givenTreatmentIds,
    submittedDiagnosisId,
    prescriptions,
    conversationMessages: cloneConversationMessages(conversationMessages) ?? patient.conversationMessages,
    voiceClinicalActions: normalizedActions,
    voiceActionExtraction: extraction,
  };
}
