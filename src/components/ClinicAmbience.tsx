import { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { useScreen } from '../game/store';

const MUTED_KEY = 'medkit:clinic-ambience-muted';
const VOLUME = 0.1;

function readMuted(): boolean {
  try {
    return typeof window !== 'undefined' && window.localStorage.getItem(MUTED_KEY) === '1';
  } catch {
    return false;
  }
}

function writeMuted(v: boolean) {
  try {
    window.localStorage.setItem(MUTED_KEY, v ? '1' : '0');
  } catch {
    /* private mode — non-fatal */
  }
}

export function ClinicAmbience() {
  const screen = useScreen();
  const [userMuted, setUserMuted] = useState<boolean>(readMuted);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Lobby = anywhere outside an active encounter. Splash plays too because
  // the first user gesture usually arrives before browsers allow playback.
  const inSession = screen === 'encounter';
  const shouldPlay = !userMuted && !inSession;

  useEffect(() => {
    const a = new Audio('/assets/audio/vetkit-clinic-ambience.wav');
    a.loop = true;
    a.volume = VOLUME;
    a.preload = 'auto';
    audioRef.current = a;

    // First user gesture unblocks autoplay on browsers that gate it.
    const tryPlay = () => {
      if (!audioRef.current) return;
      audioRef.current.play().catch(() => {
        /* still gated — wait for the next gesture */
      });
    };

    const onGesture = () => {
      if (shouldPlayRef.current) tryPlay();
    };
    window.addEventListener('pointerdown', onGesture, { once: false });
    window.addEventListener('keydown', onGesture, { once: false });

    tryPlay();

    return () => {
      window.removeEventListener('pointerdown', onGesture);
      window.removeEventListener('keydown', onGesture);
      a.pause();
      a.src = '';
      audioRef.current = null;
    };
  }, []);

  // Mirror `shouldPlay` into a ref so the gesture handler installed once
  // on mount sees the latest value without being torn down on every change.
  const shouldPlayRef = useRef(shouldPlay);
  useEffect(() => {
    shouldPlayRef.current = shouldPlay;
    const a = audioRef.current;
    if (!a) return;
    if (shouldPlay) {
      a.play().catch(() => {
        /* autoplay may be deferred until the first gesture */
      });
    } else {
      a.pause();
    }
  }, [shouldPlay]);

  const toggle = () => {
    const next = !userMuted;
    setUserMuted(next);
    writeMuted(next);
  };

  // Hide the toggle on splash to keep the title hero clean.
  if (screen === 'splash') return null;

  const off = userMuted || inSession;
  return (
    <button
      type="button"
      className="ambience-toggle"
      onClick={toggle}
      title={
        userMuted
          ? 'Clinic ambience muted - click to unmute'
          : inSession
            ? 'Clinic ambience paused during consultation'
            : 'Clinic ambience on - click to mute'
      }
      aria-label={userMuted ? 'Unmute clinic ambience' : 'Mute clinic ambience'}
      style={{
        position: 'fixed',
        top: 18,
        right: 156,
        zIndex: 1000,
        width: 36,
        height: 36,
        borderRadius: 8,
        border: '1px solid #D5D8DA',
        background: off ? 'white' : 'var(--mint)',
        boxShadow: 'var(--plush-tiny)',
        cursor: 'pointer',
        fontFamily: 'inherit',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 0,
        opacity: inSession && !userMuted ? 0.8 : 1,
      }}
    >
      {off ? <VolumeX size={17} aria-hidden /> : <Volume2 size={17} aria-hidden />}
    </button>
  );
}
