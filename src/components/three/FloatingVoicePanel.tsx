import { useEffect, useRef, useState } from 'react';
import { Html } from '@react-three/drei';
import type { ActivePatient } from '../../game/types';
import type { ConversationStatus, SubtitleEvent } from '../../voice/conversation';
import { getOrCreatePatientConversation } from '../../voice/conversationStore';

interface Props {
  bedPosition: [number, number, number];
  /** Bed rotation around Y (radians). Service-room beds are -PI/2, triage is 0. */
  bedRotationY?: number;
  /** Mouth offset in the bed/anchor LOCAL frame (x along the anchor, y up, z across).
   *  Default: lying-on-bed head position (-0.88, 1.0, 0). Polyclinic passes
   *  a standing-owner offset at the consultation point. */
  headOffset?: [number, number, number];
  patient: ActivePatient;
  onClose: () => void;
}

export function FloatingVoicePanel({
  bedPosition,
  bedRotationY = 0,
  headOffset,
  patient,
}: Props) {
  const [status, setStatus] = useState<ConversationStatus>('uninitialized');
  const [subtitle, setSubtitle] = useState<SubtitleEvent>({ who: 'patient', text: '…' });
  const [error, setError] = useState('');
  const [voiceReady, setVoiceReady] = useState(false);
  const [voiceStarting, setVoiceStarting] = useState(false);
  const [progress, setProgress] = useState('');

  // Stable listener object — built ONCE per mount.
  const listenersRef = useRef<{
    onStatus: (s: ConversationStatus) => void;
    onProgress: (m: string) => void;
    onSubtitle: (sub: SubtitleEvent) => void;
    onError: (e: string) => void;
  } | null>(null);
  if (listenersRef.current === null) {
    listenersRef.current = {
      onStatus: (s) => setStatus(s),
      onProgress: (m) => setProgress(m),
      // Only the patient's voice goes into the speech bubble above their
      // head — the doctor's transcript stays in the chat panel.
      onSubtitle: (sub) => { if (sub.who === 'patient') setSubtitle(sub); },
      onError: (e) => setError(e),
    };
  }
  const listeners = listenersRef.current;

  // Auto-start when the panel mounts. We do NOT dispose on unmount — the
  // panel can be transiently hidden (e.g. when an exam modal opens) without
  // killing the conversation. The parent owns the conversation lifecycle:
  // T-toggle-off and patient-leaves both call disposePatientConversation
  // explicitly.
  //
  // We key on `patient.case.id` (not just bedIndex) so that swapping the
  // active patient — they all share the polyclinic sentinel bedIndex — also
  // re-runs init(): the cached conv has been disposed by the parent before
  // this re-render, so getOrCreatePatientConversation builds a fresh one
  // and we trigger its greeting.
  useEffect(() => {
    let cancelled = false;
    // Reset visible chrome so the previous patient's last-spoken bubble
    // doesn't bleed into the new patient's encounter.
    setStatus('uninitialized');
    setSubtitle({ who: 'patient', text: '…' });
    setVoiceReady(false);
    setVoiceStarting(false);
    setError('');

    const conv = getOrCreatePatientConversation(patient.bedIndex, patient.case, listeners);
    const current = conv.getStatus();
    if (current !== 'uninitialized') {
      setVoiceReady(true);
      setStatus(current);
    } else {
      setVoiceStarting(true);
      conv
        .init()
        .then(() => { if (!cancelled) setVoiceReady(true); })
        .catch(() => { /* onError set */ })
        .finally(() => { if (!cancelled) setVoiceStarting(false); });
    }
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patient.bedIndex, patient.case.id]);

  const firstName = patient.case.name.split(' ')[0];
  const statusLabel =
    status === 'listening' ? 'LISTENING…' :
    status === 'thinking' ? 'THINKING…' :
    status === 'speaking' ? `${firstName.toUpperCase()} SPEAKING` :
    status === 'loading' ? 'CONNECTING…' :
    voiceReady ? 'LIVE' :
    voiceStarting ? 'CONNECTING…' : 'OFFLINE';

  const idleHint =
    status === 'speaking' ? `${firstName} is speaking…` :
    status === 'thinking' ? `${firstName} is thinking…` :
    status === 'listening' ? 'Listening — go ahead.' :
    voiceStarting ? (progress || 'Connecting…') :
    voiceReady ? 'Just talk — real-time. Press T to end.' :
    'Connecting…';

  const live = voiceReady && (status === 'listening' || status === 'speaking' || status === 'thinking' || status === 'ready');
  const statusColor =
    status === 'speaking' ? 'var(--peach-deep)' :
    status === 'listening' ? 'var(--mint-deep)' :
    status === 'thinking' ? 'var(--butter-deep)' :
    live ? 'var(--mint-deep)' : 'var(--ink-soft)';

  const [ox, oy, oz] = headOffset ?? [-0.88, 1.0, 0];
  const cos = Math.cos(bedRotationY);
  const sin = Math.sin(bedRotationY);
  const mouthX = bedPosition[0] + ox * cos + oz * sin;
  const mouthY = oy;
  const mouthZ = bedPosition[2] - ox * sin + oz * cos;

  return (
    <Html
      position={[mouthX, mouthY, mouthZ]}
      zIndexRange={[100, 0]}
      style={{ pointerEvents: 'auto', userSelect: 'none', transform: 'translate(-50%, -110%)' }}
    >
      <div
        style={{
          position: 'relative',
          minWidth: 240,
          maxWidth: 320,
          background: 'white',
          border: '1px solid #D5D8DA',
          borderRadius: 'var(--r-md)',
          boxShadow: 'var(--plush)',
          padding: '10px 14px 12px',
          fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
          color: 'var(--ink)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 8,
            marginBottom: 6,
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 800, letterSpacing: 0 }}>
            {patient.case.name}
            <span style={{ fontSize: 11, color: 'var(--ink-soft)', marginLeft: 6, fontWeight: 700 }}>
              {patient.case.species === 'dog' ? 'dog' : 'cat'} · {patient.case.weightKg} kg · owner {patient.case.ownerName}
            </span>
          </div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              fontSize: 10,
              letterSpacing: '0.12em',
              color: statusColor,
              textTransform: 'uppercase',
              fontWeight: 900,
              whiteSpace: 'nowrap',
              padding: '3px 8px',
              borderRadius: 'var(--r-pill)',
              background: 'var(--cream)',
              border: '1px solid #D5D8DA',
            }}
          >
            <span
              className={live ? 'breathe' : undefined}
              style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: statusColor,
                display: 'inline-block',
              }}
            />
            {statusLabel}
          </div>
        </div>

        <div style={{ fontStyle: 'italic', fontSize: 13, lineHeight: 1.4, color: 'var(--ink)', fontWeight: 600 }}>
          {subtitle.text && subtitle.text !== '…' ? (
            <span>&ldquo;{subtitle.text}&rdquo;</span>
          ) : (
            <span style={{ color: 'var(--ink-soft)', fontStyle: 'normal', fontSize: 12, fontWeight: 700 }}>
              {idleHint}
            </span>
          )}
        </div>

        {error && (
          <div
            style={{
              marginTop: 8,
              padding: '6px 10px',
              background: 'var(--rose)',
              border: '1px solid rgba(168,79,67,0.28)',
              borderRadius: 8,
              boxShadow: 'none',
              fontSize: 11,
              fontWeight: 800,
              color: 'var(--ink)',
            }}
          >
            {error}
          </div>
        )}
      </div>
    </Html>
  );
}
