import { ArrowLeft, ArrowRight, Check, ClipboardCheck, MessageSquareText, ShieldCheck } from 'lucide-react';
import { TopBar } from './primitives';
import { getCase } from '../data/cases';
import { store, useStore } from '../game/store';
import type { EndConfirmChecks } from '../game/types';

interface Item {
  id: keyof EndConfirmChecks;
  label: string;
  sub: string;
  icon: typeof ClipboardCheck;
}

const ITEMS: Item[] = [
  { id: 'sum', label: 'Summarised back to the pet parent', sub: 'A concise read-back of the story and working plan.', icon: ClipboardCheck },
  { id: 'safe', label: 'Safety-netted clearly', sub: 'What to watch for, when to return, and what is urgent.', icon: ShieldCheck },
  { id: 'ice', label: 'Addressed ideas and concerns', sub: 'The owner had space to explain expectations and worries.', icon: MessageSquareText },
];

export function EndConfirmScreen() {
  const checked = useStore((s) => s.endConfirm);
  const caseId = useStore((s) => s.selectedCaseId);
  const c = getCase(caseId);

  return (
    <div className="screen" style={{ background: 'var(--cream)', position: 'relative' }}>
      <TopBar here={5} steps={['Polyclinic', 'GP', 'Case', 'Brief', 'Encounter', 'Wrap']} />

      <div
        style={{
          minHeight: 'calc(100vh - 67px)',
          display: 'grid',
          placeItems: 'center',
          padding: 36,
        }}
      >
        <section
          className="plush-lg"
          style={{
            width: 'min(760px, 100%)',
            background: '#FFFFFF',
            padding: 32,
          }}
        >
          <span className="chip sky" style={{ marginBottom: 16 }}>
            <ClipboardCheck size={14} /> Close consultation
          </span>

          <h1 style={{ fontSize: 'clamp(30px, 4vw, 42px)', lineHeight: 1.08, marginBottom: 8 }}>
            Final safety check.
          </h1>
          <div style={{ fontSize: 15, color: 'var(--ink-2)', fontWeight: 500, marginBottom: 22, maxWidth: 560 }}>
            Before debriefing {c.name}, mark only what you actually covered with the owner.
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
            {ITEMS.map((it) => {
              const on = checked[it.id];
              const Icon = it.icon;
              return (
                <button
                  key={it.id}
                  type="button"
                  className="tap"
                  onClick={() => store.toggleEndConfirm(it.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    width: '100%',
                    textAlign: 'left',
                    padding: '13px 14px',
                    background: on ? 'rgba(63,143,114,0.12)' : 'white',
                    border: `1px solid ${on ? 'rgba(63,143,114,0.34)' : '#D5D8DA'}`,
                    borderRadius: 8,
                    boxShadow: 'var(--plush-tiny)',
                    fontFamily: 'inherit',
                    color: 'var(--ink)',
                    cursor: 'pointer',
                  }}
                >
                  <div
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 8,
                      background: on ? 'var(--mint-deep)' : 'var(--cream)',
                      color: on ? 'white' : 'var(--ink-2)',
                      display: 'grid',
                      placeItems: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {on ? <Check size={21} strokeWidth={2.2} /> : <Icon size={21} strokeWidth={1.8} />}
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 15 }}>{it.label}</div>
                    <div style={{ fontWeight: 500, fontSize: 12, color: 'var(--ink-2)', marginTop: 2 }}>{it.sub}</div>
                  </div>
                </button>
              );
            })}
          </div>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn-plush ghost"
              style={{ flex: '1 1 220px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              onClick={() => store.setScreen('encounter')}
            >
              <ArrowLeft size={17} /> Back to room
            </button>
            <button
              type="button"
              className="btn-plush primary"
              style={{ flex: '1.4 1 260px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              onClick={() => store.setScreen('debrief')}
            >
              End consultation <ArrowRight size={17} />
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
