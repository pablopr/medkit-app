import { useEffect } from 'react';
import { useScreen } from '../game/store';

const CLICK_VOLUME = 0.28;
const COMPLETE_VOLUME = 0.35;
const activeSounds = new Set<HTMLAudioElement>();

function play(path: string, volume: number) {
  const a = new Audio(path);
  a.volume = volume;
  activeSounds.add(a);
  const release = () => activeSounds.delete(a);
  a.addEventListener('ended', release, { once: true });
  a.addEventListener('error', release, { once: true });
  a.play().catch(release);
}

export function UiSoundLayer() {
  const screen = useScreen();

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target?.closest('button, [role="button"], .tap')) return;
      play('/assets/audio/ui-click.wav', CLICK_VOLUME);
    };
    window.addEventListener('click', onClick, { capture: true });
    return () => window.removeEventListener('click', onClick, { capture: true });
  }, []);

  useEffect(() => {
    if (screen === 'debrief') play('/assets/audio/case-complete.wav', COMPLETE_VOLUME);
  }, [screen]);

  return null;
}
