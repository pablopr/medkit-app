import { useMemo, useState } from 'react';
import { AlertTriangle, ArrowLeft, Cat, Dog, Hospital, Shuffle } from 'lucide-react';
import { TopBar } from './primitives';
import { CASES, CONDITION_COLORS, type Case } from '../data/cases';
import { CLINIC_IDS, CLINIC_LABELS, type ClinicId } from '../game/clinic';
import { store } from '../game/store';

interface CaseCardProps {
  c: Case;
}

function CaseCard({ c }: CaseCardProps) {
  const bg = CONDITION_COLORS[c.cond] ?? 'var(--sky)';
  const SpeciesIcon = c.species === 'dog' ? Dog : Cat;
  return (
    <button
      type="button"
      className="tap plush"
      onClick={() => store.selectCase(c.id)}
      style={{
        padding: 0,
        textAlign: 'left',
        border: '1px solid #D5D8DA',
        background: 'white',
        overflow: 'hidden',
        minHeight: 248,
        fontFamily: 'inherit',
        color: 'var(--ink)',
      }}
    >
      <div
        style={{
          padding: 16,
          borderBottom: '1px solid #E3E6E8',
          background: `linear-gradient(135deg, ${bg} 0%, #FFFFFF 88%)`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 12,
        }}
      >
        <div>
          <div style={{ fontWeight: 800, fontSize: 17, lineHeight: 1.2 }}>{c.name}</div>
          <div style={{ marginTop: 4, fontWeight: 600, fontSize: 12, color: 'var(--ink-2)' }}>
            {c.species === 'dog' ? 'Dog' : 'Cat'} · {c.weightKg} kg · owner {c.ownerName}
          </div>
        </div>
        <div
          style={{
            width: 42,
            height: 42,
            borderRadius: 8,
            background: 'rgba(255,255,255,0.84)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid rgba(32,35,38,0.12)',
          }}
        >
          <SpeciesIcon size={24} strokeWidth={1.8} />
        </div>
      </div>

      <div style={{ padding: 16 }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
          <span className="chip peach">{c.cond}</span>
          {c.tags.slice(0, 2).map((t) => (
            <span key={t} className="chip">
              {t}
            </span>
          ))}
          {c.attempted && c.score && <span className="chip mint">{c.score}</span>}
        </div>
        <div style={{ fontSize: 14, color: 'var(--ink)', minHeight: 58, lineHeight: 1.45, fontWeight: 500 }}>
          "{c.complaint}"
        </div>
        <div style={{ marginTop: 14, fontSize: 11, fontWeight: 700, color: 'var(--ink-soft)', textTransform: 'uppercase' }}>
          Guideline · {c.guideline}
        </div>
      </div>
    </button>
  );
}

type ClinicFilter = ClinicId | 'all' | 'red-flag';

export function CaseLibraryScreen() {
  const [filter, setFilter] = useState<ClinicFilter>('all');

  const grouped = useMemo(() => {
    const map = new Map<ClinicId, Case[]>();
    for (const id of CLINIC_IDS) {
      if (id === 'all-specialties') continue;
      map.set(id, []);
    }
    for (const c of CASES) {
      const list = map.get(c.clinic);
      if (list) list.push(c);
    }
    return map;
  }, []);

  const visibleGroups = useMemo<Array<[ClinicId, Case[]]>>(() => {
    if (filter === 'red-flag') {
      const out: Array<[ClinicId, Case[]]> = [];
      for (const [clinic, list] of grouped) {
        const reds = list.filter((c) => c.tags.some((t) => t.toLowerCase().includes('red flag')));
        if (reds.length) out.push([clinic, reds]);
      }
      return out;
    }
    if (filter === 'all') {
      return Array.from(grouped.entries()).filter(([, list]) => list.length > 0);
    }
    const list = grouped.get(filter as ClinicId) ?? [];
    return list.length ? [[filter as ClinicId, list]] : [];
  }, [grouped, filter]);

  const totalVisible = visibleGroups.reduce((n, [, list]) => n + list.length, 0);

  const shuffle = () => {
    const pool = visibleGroups.flatMap(([, list]) => list);
    const fallback = pool.length > 0 ? pool : CASES;
    const pick = fallback[Math.floor(Math.random() * fallback.length)];
    store.selectCase(pick.id);
  };

  const clinicChips: Array<{ id: ClinicFilter; label: string }> = [
    { id: 'all', label: 'All clinics' },
    { id: 'red-flag', label: 'Red-flag only' },
    ...CLINIC_IDS.filter((id) => id !== 'all-specialties' && (grouped.get(id)?.length ?? 0) > 0).map(
      (id) => ({ id: id as ClinicFilter, label: CLINIC_LABELS[id] }),
    ),
  ];

  return (
    <div className="screen" style={{ background: 'var(--cream)' }}>
      <TopBar here={2} steps={['Polyclinic', 'GP', 'Case']} />

      <div
        style={{
          padding: '24px 28px 0',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button
            type="button"
            className="btn-plush ghost"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
            onClick={() => store.setScreen('gpRoom')}
            title="Back to the GP room"
          >
            <ArrowLeft size={17} /> Back
          </button>
          <div>
            <h1 style={{ fontSize: 36, marginBottom: 4 }}>Select a clinical case</h1>
            <div style={{ fontWeight: 500, color: 'var(--ink-2)', fontSize: 14 }}>
              Dog and cat consultations grouped by veterinary service.
            </div>
          </div>
        </div>
        <button
          type="button"
          className="btn-plush mint"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 9, whiteSpace: 'nowrap' }}
          onClick={shuffle}
        >
          <Shuffle size={17} /> Shuffle ({totalVisible})
        </button>
      </div>

      <div style={{ padding: '18px 28px 6px', display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        {clinicChips.map((chip) => (
          <span
            key={chip.id}
            className={`chip ${filter === chip.id ? 'mint' : ''}`}
            style={{ cursor: 'pointer' }}
            onClick={() => setFilter(chip.id)}
          >
            {chip.id === 'red-flag' ? <AlertTriangle size={13} /> : <Hospital size={13} />}
            {chip.label}
          </span>
        ))}
      </div>

      <div style={{ padding: '18px 28px 28px', display: 'flex', flexDirection: 'column', gap: 28 }}>
        {visibleGroups.map(([clinic, list]) => (
          <section key={clinic}>
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: 10,
                marginBottom: 14,
                paddingBottom: 8,
                borderBottom: '1px solid #D5D8DA',
              }}
            >
              <h2 style={{ fontSize: 22, margin: 0 }}>{CLINIC_LABELS[clinic]}</h2>
              <span className="chip" style={{ fontSize: 11, marginLeft: 6 }}>
                {list.length} case{list.length === 1 ? '' : 's'}
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 18 }}>
              {list.map((c) => <CaseCard key={c.id} c={c} />)}
            </div>
          </section>
        ))}

        {visibleGroups.length === 0 && (
          <div className="plush" style={{ padding: 24, textAlign: 'center', color: 'var(--ink-2)', fontWeight: 700 }}>
            No cases match this filter. Try another chip.
          </div>
        )}
      </div>
    </div>
  );
}
