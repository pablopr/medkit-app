import { AlertTriangle, Bot, CheckCircle2, MousePointerClick } from 'lucide-react';
import type { ActivePatient, VoiceClinicalAction } from '../game/types';

function actionKindLabel(action: VoiceClinicalAction): string {
  if (action.type === 'history') return 'History';
  if (action.type === 'test') return 'Test';
  if (action.type === 'treatment') return 'Treatment';
  if (action.type === 'diagnosis') return 'Diagnosis';
  return 'Prescription';
}

export function VoiceActionReviewCard({
  patient,
  compact = false,
}: {
  patient: ActivePatient;
  compact?: boolean;
}) {
  const extraction = patient.voiceActionExtraction;
  const actions = patient.voiceClinicalActions ?? [];
  if (!extraction && actions.length === 0) return null;
  if (extraction?.status === 'skipped' && actions.length === 0) return null;

  const failed = extraction?.status === 'failed';
  const appliedCount = actions.filter((action) => action.applied).length;
  const bg = failed ? 'var(--rose)' : actions.length > 0 ? 'var(--mint)' : 'var(--cream-2)';

  return (
    <div
      className="plush"
      style={{
        background: bg,
        border: failed ? '1px solid rgba(168,79,67,0.30)' : '1px solid rgba(63,143,114,0.24)',
        padding: compact ? 14 : 16,
        marginBottom: compact ? 16 : 22,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: actions.length > 0 ? 12 : 0 }}>
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 8,
            background: 'white',
            display: 'grid',
            placeItems: 'center',
            color: failed ? '#A84F43' : 'var(--mint-deep)',
            flexShrink: 0,
          }}
        >
          {failed ? <AlertTriangle size={19} /> : <Bot size={19} />}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 900, color: 'var(--ink-2)', textTransform: 'uppercase' }}>
            AI voice actions
          </div>
          <div style={{ fontSize: compact ? 14 : 16, fontWeight: 900, lineHeight: 1.25 }}>
            {failed
              ? 'Voice action matching failed'
              : actions.length > 0
                ? `${appliedCount} clickable action${appliedCount === 1 ? '' : 's'} matched from speech`
                : 'No clickable actions matched from speech'}
          </div>
        </div>
      </div>

      {failed && (
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-2)', lineHeight: 1.45 }}>
          {extraction?.error ?? 'The OpenRouter extractor did not return a usable result.'}
        </div>
      )}

      {actions.length > 0 && (
        <div style={{ display: 'grid', gap: 8 }}>
          {actions.slice(0, compact ? 3 : 8).map((action, index) => (
            <div
              key={`${action.type}-${action.id ?? action.medicationId ?? index}`}
              style={{
                display: 'grid',
                gridTemplateColumns: 'auto 1fr auto',
                gap: 10,
                alignItems: 'center',
                background: 'white',
                border: '1px solid rgba(32,35,38,0.12)',
                borderRadius: 8,
                padding: '8px 10px',
                minWidth: 0,
              }}
            >
              <div style={{ color: action.applied ? 'var(--mint-deep)' : 'var(--ink-2)' }}>
                {action.applied ? <CheckCircle2 size={16} /> : <MousePointerClick size={16} />}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 900 }}>
                  {actionKindLabel(action)} · {action.label}
                </div>
                {!compact && (
                  <div style={{ fontSize: 11, fontWeight: 650, color: 'var(--ink-2)', marginTop: 2, lineHeight: 1.35 }}>
                    "{action.evidence}"{action.reason ? ` · ${action.reason}` : ''}
                  </div>
                )}
              </div>
              <div style={{ fontSize: 11, fontWeight: 900, color: 'var(--ink-2)', whiteSpace: 'nowrap' }}>
                {Math.round(action.confidence * 100)}%
              </div>
            </div>
          ))}
          {compact && actions.length > 3 && (
            <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--ink-2)' }}>
              +{actions.length - 3} more voice-matched action{actions.length - 3 === 1 ? '' : 's'}
            </div>
          )}
        </div>
      )}

      {extraction?.model && !compact && (
        <div style={{ marginTop: 10, fontSize: 11, fontWeight: 800, color: 'var(--ink-2)' }}>
          Model: {extraction.model}
        </div>
      )}
    </div>
  );
}
