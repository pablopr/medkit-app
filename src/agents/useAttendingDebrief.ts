// Hook that drives an end-of-encounter debrief through the vetkit-attending
// OpenRouter backend endpoint.
//
// Lifecycle:
//   1. Caller passes a `DebriefRequest` (built via buildDebriefRequest).
//      The hook does nothing until `request` becomes non-null AND `enabled`
//      is true — that's the trigger.
//   2. POST the request to /agent/debrief/evaluate.
//   3. Validate the returned render_case_evaluation payload.
//   4. Cleanup on unmount via AbortSignal.

import { useEffect, useState } from 'react';
import { caseEvaluationInput, type CaseEvaluationInput } from './customTools';
import { type DebriefRequest } from './debriefRequest';

export type DebriefStatus =
  | 'idle'
  | 'starting'
  | 'streaming'
  | 'got-evaluation'
  | 'error'
  | 'aborted';

export interface UseAttendingDebriefResult {
  status: DebriefStatus;
  evaluation: CaseEvaluationInput | null;
  error: string | null;
  /** Kept for older renderers; OpenRouter debrief currently returns as one JSON response. */
  partialNarration: string;
  /** Reset to allow a re-run with a new request. */
  reset: () => void;
}

interface Options {
  enabled?: boolean;
}

export function useAttendingDebrief(
  request: DebriefRequest | null,
  opts: Options = {},
): UseAttendingDebriefResult {
  const enabled = opts.enabled !== false;
  const [status, setStatus] = useState<DebriefStatus>('idle');
  const [evaluation, setEvaluation] = useState<CaseEvaluationInput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [partialNarration, setPartial] = useState('');
  // Effect deps the request reference directly; useMemo at the call site
  // stabilises it across non-load-bearing re-renders.

  useEffect(() => {
    if (!enabled || !request) return;

    const ctrl = new AbortController();
    let cancelled = false;
    setStatus('starting');
    setError(null);
    setEvaluation(null);
    setPartial('');

    void (async () => {
      try {
        setStatus('streaming');
        const result = await evaluateDebrief(request, ctrl.signal);
        if (cancelled) return;
        setEvaluation(result);
        setStatus('got-evaluation');
      } catch (e) {
        if (cancelled) return;
        if (e instanceof DOMException && e.name === 'AbortError') {
          setStatus('aborted');
          return;
        }
        setStatus('error');
        setError(e instanceof Error ? e.message : String(e));
      }
    })();

    return () => {
      cancelled = true;
      ctrl.abort();
    };
  }, [enabled, request]);

  return {
    status,
    evaluation,
    error,
    partialNarration,
    reset: () => {
      setStatus('idle');
      setEvaluation(null);
      setError(null);
      setPartial('');
    },
  };
}

async function evaluateDebrief(
  request: DebriefRequest,
  signal: AbortSignal,
): Promise<CaseEvaluationInput> {
  const res = await fetch('/agent/debrief/evaluate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ request }),
    signal,
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`debrief evaluation failed: ${res.status} ${detail}`.trim());
  }
  const json = await res.json();
  const parsed = caseEvaluationInput.safeParse(json);
  if (!parsed.success) {
    throw new Error(
      'debrief evaluation returned invalid payload: ' +
      parsed.error.issues.map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`).join('; '),
    );
  }
  return parsed.data;
}
