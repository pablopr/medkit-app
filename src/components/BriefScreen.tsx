import { ArrowRight, ClipboardList, Gauge, HeartPulse, ShieldAlert, Thermometer } from 'lucide-react';
import { TopBar } from './primitives';
import { getCase, getPatientCase } from '../data/cases';
import { store, useStore } from '../game/store';

interface VitalCard {
  label: string;
  value: string;
  unit: string;
  color: string;
}

function buildVitals(p?: {
  hr: number;
  rr: number;
  temp: number;
  mmColor: string;
  crtSec: number;
  hydration: string;
  painScore: number;
  mentation: string;
  bp?: string;
  spo2?: number;
}): VitalCard[] {
  return [
    { label: 'HR', value: String(p?.hr ?? 88), unit: 'bpm', color: 'var(--rose)' },
    { label: 'RR', value: String(p?.rr ?? 24), unit: '/min', color: 'var(--sky)' },
    { label: 'Temp', value: (p?.temp ?? 38.5).toFixed(1), unit: 'C', color: 'var(--butter)' },
    { label: 'CRT', value: String(p?.crtSec ?? 1.5), unit: 'sec', color: 'var(--mint)' },
    { label: 'Pain', value: String(p?.painScore ?? 0), unit: '/10', color: 'var(--peach)' },
  ];
}

export function BriefScreen() {
  const caseId = useStore((s) => s.selectedCaseId);
  const c = getCase(caseId);
  const patient = getPatientCase(caseId);
  const vitals = buildVitals(patient?.vitals);
  const chiefComplaint = patient?.chiefComplaint ?? c.complaint;
  const arrivalBlurb = patient?.arrivalBlurb ?? 'Looks well. No acute distress.';
  const animalSummary = patient
    ? `${patient.species === 'dog' ? 'Dog' : 'Cat'} · ${patient.breed ?? 'Mixed breed'} · ${patient.weightKg} kg · ${patient.ownerName}'s pet`
    : `${c.age} y · ${c.sex === 'F' ? 'Female' : 'Male'} · ${c.cond}`;
  const severity =
    patient?.severity === 'critical'
      ? { label: 'Critical', chip: 'rose', icon: ShieldAlert }
      : patient?.severity === 'urgent'
        ? { label: 'Urgent', chip: 'peach', icon: ShieldAlert }
        : { label: 'First presentation', chip: 'mint', icon: ClipboardList };
  const SeverityIcon = severity.icon;

  return (
    <div className="screen paper" style={{ position: 'relative' }}>
      <TopBar here={3} steps={['Polyclinic', 'GP', 'Case', 'Brief']} />

      <div
        style={{
          padding: '28px 36px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 28,
          minHeight: 'calc(100vh - 67px)',
        }}
      >
        <section className="plush-lg" style={{ background: '#FFFFFF', padding: 24, position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <span className="chip sky">
              <ClipboardList size={14} /> Doorway brief
            </span>
            <span className="chip">Case #{c.id.toUpperCase()}</span>
          </div>

          <h1 style={{ fontSize: 34, lineHeight: 1.12, marginBottom: 6 }}>{c.name}</h1>
          <div style={{ fontWeight: 500, fontSize: 14, color: 'var(--ink-2)', marginBottom: 20 }}>
            {animalSummary} · {c.cond}
          </div>

          <div className="plush" style={{ padding: 16, marginBottom: 14, boxShadow: 'none' }}>
            <div style={{ fontWeight: 800, fontSize: 11, color: 'var(--ink-soft)', textTransform: 'uppercase', marginBottom: 8 }}>
              Presenting complaint
            </div>
            <div style={{ fontSize: 18, fontWeight: 650, lineHeight: 1.38 }}>{`"${chiefComplaint}"`}</div>
          </div>

          <div className="plush" style={{ padding: 16, marginBottom: 14, boxShadow: 'none' }}>
            <div style={{ fontWeight: 800, fontSize: 11, color: 'var(--ink-soft)', textTransform: 'uppercase', marginBottom: 8 }}>
              On the bench
            </div>
            <div style={{ fontSize: 14, fontWeight: 500, lineHeight: 1.5 }}>{arrivalBlurb}</div>
          </div>

          <div
            style={{
              background: 'rgba(63,143,114,0.10)',
              border: '1px solid rgba(63,143,114,0.24)',
              borderRadius: 8,
              padding: 16,
            }}
          >
            <div style={{ fontWeight: 800, fontSize: 11, color: 'var(--mint-deep)', textTransform: 'uppercase', marginBottom: 8 }}>
              Clinical objective
            </div>
            <ol style={{ margin: 0, paddingLeft: 18, fontSize: 14, fontWeight: 550, lineHeight: 1.6 }}>
              <li>Take a focused pet-parent history.</li>
              <li>Assess stability and examine when appropriate.</li>
              <li>Agree a safe plan, including follow-up and cost context.</li>
            </ol>
          </div>
        </section>

        <aside style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div className="plush" style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
            <div
              style={{
                width: 54,
                height: 54,
                borderRadius: 8,
                background: 'rgba(233,111,60,0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--peach-deep)',
              }}
            >
              <SeverityIcon size={28} strokeWidth={1.8} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 18 }}>{c.name.split(' ')[0]}</div>
              <div style={{ fontSize: 13, color: 'var(--ink-2)', fontWeight: 500 }}>currently waiting</div>
              <div style={{ marginTop: 8 }} className={`chip ${severity.chip}`}>{severity.label}</div>
            </div>
          </div>

          <div className="plush" style={{ padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800, fontSize: 12, color: 'var(--ink-2)', textTransform: 'uppercase', marginBottom: 12 }}>
              <HeartPulse size={16} /> Triage vitals
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
              {vitals.map((v) => (
                <div
                  key={v.label}
                  style={{
                    background: v.color,
                    border: '1px solid rgba(32,35,38,0.14)',
                    borderRadius: 8,
                    padding: '10px 4px',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontWeight: 800, fontSize: 16, lineHeight: 1 }}>{v.value}</div>
                  <div style={{ fontSize: 10, fontWeight: 650, color: 'var(--ink-2)' }}>
                    {v.label} <span style={{ opacity: 0.7 }}>{v.unit}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="plush" style={{ padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800, fontSize: 12, color: 'var(--ink-2)', textTransform: 'uppercase' }}>
                <Gauge size={16} /> Consultation time
              </div>
              <div style={{ fontSize: 30, fontWeight: 800, color: 'var(--peach-deep)', marginTop: 4 }}>8:00</div>
            </div>
            <Thermometer size={34} color="var(--ink-soft)" strokeWidth={1.5} />
          </div>

          <button
            type="button"
            className="btn-plush primary"
            style={{ fontSize: 16, padding: '15px 18px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}
            onClick={() => store.setScreen('encounter')}
          >
            Enter consultation <ArrowRight size={18} />
          </button>
        </aside>
      </div>
    </div>
  );
}
