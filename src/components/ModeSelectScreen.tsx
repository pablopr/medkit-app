import { ArrowRight, Building2, LockKeyhole, Stethoscope } from 'lucide-react';
import { TopBar } from './primitives';
import { store } from '../game/store';

interface DoorProps {
  label: string;
  sub: string;
  accent: string;
  available?: boolean;
  locked?: boolean;
  tags?: string[];
  onOpen?: () => void;
}

function Door({ label, sub, accent, available, locked, tags = [], onOpen }: DoorProps) {
  return (
    <div
      className={available ? 'tap' : ''}
      onClick={available ? onOpen : undefined}
      style={{ width: 260, position: 'relative', filter: locked ? 'grayscale(0.45) opacity(0.72)' : 'none' }}
    >
      <div
        className="plush-lg"
        style={{
          height: 356,
          padding: 18,
          background: '#FFFFFF',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        <div
          style={{
            height: 136,
            borderRadius: 8,
            border: '1px solid #D5D8DA',
            background: `linear-gradient(135deg, ${accent} 0%, #F7F8F6 78%)`,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 16,
              borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.65)',
              background: 'rgba(255,255,255,0.28)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: 18,
              bottom: 18,
              width: 56,
              height: 56,
              borderRadius: 10,
              background: 'rgba(255,255,255,0.9)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: available ? 'var(--peach-deep)' : 'var(--ink-soft)',
              border: '1px solid rgba(32,35,38,0.12)',
            }}
          >
            {locked ? <LockKeyhole size={28} strokeWidth={1.8} /> : <Stethoscope size={30} strokeWidth={1.8} />}
          </div>
        </div>

        <div>
          <div style={{ fontWeight: 800, fontSize: 22, color: 'var(--ink)', marginBottom: 6 }}>{label}</div>
          <div style={{ fontWeight: 500, fontSize: 14, color: 'var(--ink-2)', lineHeight: 1.4 }}>{sub}</div>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {tags.map((t, i) => (
            <span key={i} className={`chip ${available ? 'mint' : ''}`}>
              {t}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ModeSelectScreen() {
  return (
    <div className="screen" style={{ background: 'var(--cream)' }}>
      <TopBar here={0} showProfile />

      <div style={{ position: 'relative', minHeight: 'calc(100vh - 67px)', overflow: 'hidden' }}>
        <svg
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
          viewBox="0 0 1200 700"
          preserveAspectRatio="none"
        >
          <defs>
            <pattern id="clinicalFloor" x="0" y="0" width="96" height="96" patternUnits="userSpaceOnUse">
              <rect width="96" height="96" fill="#D7DDD9" />
              <path d="M 0 96 L 96 0" stroke="#C1CBC6" strokeWidth="2" opacity=".75" />
            </pattern>
          </defs>
          <rect x="0" y="0" width="1200" height="380" fill="#F5F2EB" />
          <rect x="0" y="370" width="1200" height="10" fill="#D8D2C7" />
          <path d="M 0 700 L 1200 700 L 900 384 L 300 384 Z" fill="url(#clinicalFloor)" stroke="#BFC8C4" strokeWidth="2" />
          <line x1="600" y1="384" x2="0" y2="700" stroke="#B8C0BC" strokeWidth="2" />
          <line x1="600" y1="384" x2="1200" y2="700" stroke="#B8C0BC" strokeWidth="2" />
        </svg>

        <div style={{ position: 'relative', padding: '56px 80px 24px', maxWidth: 1160, margin: '0 auto' }}>
          <div style={{ marginBottom: 34 }}>
            <div style={{ color: 'var(--ink-2)', fontSize: 14, fontWeight: 650, marginBottom: 8 }}>
              Clinical pathway
            </div>
            <h1 style={{ fontSize: 42, lineHeight: 1.08 }}>Choose where the next case starts.</h1>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 32, flexWrap: 'wrap' }}>
            <Door
              label="Vet Clinic"
              sub="Small animal consultations with pet-parent communication."
              accent="#A8D7C2"
              available
              tags={['Open now', 'dogs & cats']}
              onOpen={() => store.setScreen('gpRoom')}
            />
            <Door
              label="Services"
              sub="Imaging, laboratory and pharmacy workflows."
              accent="#D8E3EA"
              locked
              tags={['Coming soon']}
            />
            <Door
              label="Emergency"
              sub="Urgent triage and stabilization pathway."
              accent="#E0B5AE"
              locked
              tags={['Coming soon']}
            />
          </div>
        </div>

        <div style={{ position: 'absolute', bottom: 34, left: 64, color: 'var(--ink-soft)', display: 'flex', alignItems: 'center', gap: 10, fontWeight: 650 }}>
          <Building2 size={20} /> Training environment
        </div>
        <div style={{ position: 'absolute', bottom: 34, right: 80, color: 'var(--ink-soft)', display: 'flex', alignItems: 'center', gap: 10, fontWeight: 650 }}>
          Enter room <ArrowRight size={18} />
        </div>
      </div>
    </div>
  );
}
