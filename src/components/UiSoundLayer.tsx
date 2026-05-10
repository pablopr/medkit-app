import { useEffect } from 'react';
import { useScreen } from '../game/store';

const CLICK_VOLUME = 0.08;
const COMPLETE_VOLUME = 0.12;

function play(path: string, volume: number) {
  const a = new Audio(path);
  a.volume = volume;
  a.play().catch(() => undefined);
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
