import { useEffect } from 'react';
import { ArrowRight, ShieldCheck, Stethoscope } from 'lucide-react';
import { Wordmark } from './primitives';
import { store } from '../game/store';

export function SplashScreen() {
  // Click anywhere or hit space → onboarding (first run) or home (returning).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        store.beginFromSplash();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div
      className="screen"
      onClick={() => store.beginFromSplash()}
      style={{
        position: 'relative',
        cursor: 'pointer',
        background: '#111417',
        color: 'white',
        overflow: 'hidden',
      }}
    >
      <img
        src="/assets/visuals/vetkit-clinic-hero.svg"
        alt=""
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          opacity: 0.9,
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(90deg, rgba(17,20,23,0.92) 0%, rgba(17,20,23,0.72) 42%, rgba(17,20,23,0.24) 78%), linear-gradient(180deg, rgba(17,20,23,0.12), rgba(17,20,23,0.82))',
        }}
      />

      <div
        style={{
          position: 'absolute',
          inset: '0 auto 0 0',
          width: 'min(760px, 100%)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: 26,
          padding: '72px clamp(24px, 7vw, 104px)',
        }}
      >
        <div style={{ color: 'white' }}>
          <Wordmark size={40} dark />
        </div>

        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
            alignSelf: 'flex-start',
            padding: '8px 12px',
            border: '1px solid rgba(255,255,255,0.18)',
            borderRadius: 8,
            background: 'rgba(255,255,255,0.08)',
            color: 'rgba(255,255,255,0.82)',
            fontSize: 13,
            fontWeight: 700,
          }}
        >
          <ShieldCheck size={16} />
          Small animal clinical simulator
        </div>

        <div>
          <h1 style={{ fontSize: 'clamp(38px, 6vw, 72px)', lineHeight: 1.04, maxWidth: 700 }}>
            Practice veterinary judgement before it counts.
          </h1>
          <p
            style={{
              margin: '22px 0 0',
              maxWidth: 560,
              fontSize: 18,
              lineHeight: 1.55,
              color: 'rgba(255,255,255,0.78)',
              fontWeight: 500,
            }}
          >
            Real-time consultation training for dog and cat cases, with clinical debriefing and Barkibu cost context.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn-plush primary"
            style={{ fontSize: 16, padding: '14px 20px', display: 'inline-flex', alignItems: 'center', gap: 10 }}
            onClick={(e) => {
              e.stopPropagation();
              store.beginFromSplash();
            }}
          >
            Start training <ArrowRight size={18} />
          </button>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 13,
              color: 'rgba(255,255,255,0.72)',
              fontWeight: 600,
            }}
          >
            <Stethoscope size={16} /> Press Enter or Space
          </span>
        </div>
      </div>
    </div>
  );
}
