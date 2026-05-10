import { useMemo, useState } from 'react';
import { ArrowLeft, ChevronDown, ChevronUp, ClipboardList, Dog, FolderOpen, Hospital } from 'lucide-react';
import { TopBar } from './primitives';
import { CASES, getCase } from '../data/cases';
import { CLINIC_IDS, CLINIC_LABELS } from '../game/clinic';
import { store, useGameState } from '../game/store';

export function GPRoomScreen() {
  const state = useGameState();
  const activeClinic = state.polyclinic.clinic;
  const [pickerOpen, setPickerOpen] = useState(false);

  const clinicCases = useMemo(() => {
    if (activeClinic === 'all-specialties') return CASES;
    return CASES.filter((c) => c.clinic === activeClinic);
  }, [activeClinic]);

  const totalAll = CASES.length;
  const queueAhead = clinicCases.length;
  const nextId = store.pickNextCaseId() ?? clinicCases[0]?.id ?? CASES[0]?.id;
  const next = nextId ? getCase(nextId) : null;

  const availableClinics = useMemo(() => {
    return CLINIC_IDS.filter(
      (id) => id === 'all-specialties' || CASES.some((c) => c.clinic === id),
    );
  }, []);

  return (
    <div className="screen" style={{ background: 'var(--cream)', position: 'relative' }}>
      <TopBar here={1} steps={['Polyclinic', 'GP']} />

      <div style={{ padding: '34px 36px 12px', textAlign: 'center' }}>
        <span className="chip sky" style={{ marginBottom: 12 }}>
          <Hospital size={14} /> Small animal clinic
        </span>
        <h1 style={{ fontSize: 42, lineHeight: 1.08, marginTop: 12 }}>Start the next consultation.</h1>
        <div
          style={{
            fontSize: 16,
            color: 'var(--ink-2)',
            fontWeight: 500,
            marginTop: 8,
            maxWidth: 620,
            margin: '8px auto 0',
            lineHeight: 1.5,
          }}
        >
          Accept the next pet parent from the selected service, or browse the complete case folder.
        </div>
      </div>

      <div style={{ maxWidth: 1080, margin: '0 auto', padding: '12px 36px 4px' }}>
        <button
          type="button"
          onClick={() => setPickerOpen((v) => !v)}
          className="btn-plush ghost"
          style={{
            width: '100%',
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 15,
            fontWeight: 700,
            background: 'white',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 11, color: 'var(--ink-soft)', textTransform: 'uppercase', fontWeight: 800 }}>
              Service
            </span>
            <span>{CLINIC_LABELS[activeClinic]}</span>
          </span>
          {pickerOpen ? <ChevronUp size={17} /> : <ChevronDown size={17} />}
        </button>

        {pickerOpen && (
          <div className="plush" style={{ marginTop: 8, padding: 12, background: 'white', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {availableClinics.map((id) => {
              const isActive = activeClinic === id;
              return (
                <span
                  key={id}
                  className={`chip ${isActive ? 'mint' : ''}`}
                  style={{ cursor: 'pointer' }}
                  onClick={() => {
                    store.setPolyclinicClinic(id);
                    setPickerOpen(false);
                  }}
                >
                  {CLINIC_LABELS[id]}
                </span>
              );
            })}
          </div>
        )}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 24,
          padding: '20px 36px 40px',
          maxWidth: 1080,
          margin: '0 auto',
        }}
      >
        <button
          type="button"
          className="tap plush-lg"
          onClick={() => next && store.acceptNextPatient()}
          style={{
            background: 'white',
            padding: 28,
            position: 'relative',
            opacity: next ? 1 : 0.55,
            cursor: next ? 'pointer' : 'not-allowed',
            textAlign: 'left',
            fontFamily: 'inherit',
            color: 'var(--ink)',
          }}
        >
          <div className="chip rose" style={{ marginBottom: 18 }}>01 · Accept</div>
          <div style={{ display: 'flex', gap: 18, alignItems: 'flex-start' }}>
            <div
              style={{
                width: 76,
                height: 76,
                borderRadius: 10,
                background: 'rgba(63,143,114,0.12)',
                color: 'var(--mint-deep)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Dog size={38} strokeWidth={1.7} />
            </div>
            <div>
              <h2 style={{ fontSize: 27, lineHeight: 1.12, marginBottom: 8 }}>Accept the next pet</h2>
              <div style={{ fontSize: 14, color: 'var(--ink-2)', fontWeight: 500, lineHeight: 1.5, minHeight: 42 }}>
                {next
                  ? `${next.name} and their owner walk directly into the consultation.`
                  : `No cases queued for ${CLINIC_LABELS[activeClinic]} yet.`}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 22 }}>
            {next && (
              <>
                <span className="chip">
                  {next.name.split(' ')[0]} · {next.species === 'dog' ? 'dog' : 'cat'} · {next.weightKg} kg
                </span>
                <span className="chip rose">{next.cond}</span>
              </>
            )}
            <span className="chip butter">{queueAhead} in {CLINIC_LABELS[activeClinic]}</span>
          </div>
        </button>

        <button
          type="button"
          className="tap plush-lg"
          onClick={() => store.setScreen('library')}
          style={{
            background: 'white',
            padding: 28,
            position: 'relative',
            textAlign: 'left',
            fontFamily: 'inherit',
            color: 'var(--ink)',
          }}
        >
          <div className="chip butter" style={{ marginBottom: 18 }}>02 · Browse</div>
          <div style={{ display: 'flex', gap: 18, alignItems: 'flex-start' }}>
            <div
              style={{
                width: 76,
                height: 76,
                borderRadius: 10,
                background: 'rgba(85,123,144,0.12)',
                color: 'var(--sky-deep)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <FolderOpen size={38} strokeWidth={1.7} />
            </div>
            <div>
              <h2 style={{ fontSize: 27, lineHeight: 1.12, marginBottom: 8 }}>Pick from the charts</h2>
              <div style={{ fontSize: 14, color: 'var(--ink-2)', fontWeight: 500, lineHeight: 1.5, minHeight: 42 }}>
                Open the case folder, filter by service or red-flag, and resume attempted cases.
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 22 }}>
            <span className="chip"><ClipboardList size={13} /> {totalAll} cases</span>
            <span className="chip butter">filterable</span>
          </div>
        </button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', paddingBottom: 36 }}>
        <button
          type="button"
          className="btn-plush ghost"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
          onClick={() => store.setScreen('mode')}
        >
          <ArrowLeft size={17} /> Back to corridor
        </button>
      </div>
    </div>
  );
}
