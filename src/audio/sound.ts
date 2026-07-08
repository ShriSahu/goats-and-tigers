import { createAudioPlayer } from 'expo-audio';
import { synthTone } from './synth';

export type SoundName = 'place' | 'step' | 'capture' | 'select' | 'tigerWin' | 'goatWin';

const SOUND_URIS: Record<SoundName, string> = {
  select: synthTone([{ freq: 640, duration: 0.03, type: 'sine', gain: 0.25 }]),
  place: synthTone([{ freq: 300, duration: 0.09, type: 'triangle', gain: 0.4 }]),
  step: synthTone([{ freq: 420, duration: 0.06, type: 'sine', gain: 0.32 }]),
  capture: synthTone([
    { freq: 180, duration: 0.07, type: 'square', gain: 0.55 },
    { freq: 90, duration: 0.14, type: 'sine', gain: 0.5 },
  ]),
  tigerWin: synthTone([
    { freq: 130, duration: 0.12, type: 'square', gain: 0.45 },
    { freq: 164, duration: 0.12, type: 'square', gain: 0.45 },
    { freq: 98, duration: 0.28, type: 'square', gain: 0.5 },
  ]),
  goatWin: synthTone([
    { freq: 392, duration: 0.1, type: 'sine', gain: 0.4 },
    { freq: 523, duration: 0.1, type: 'sine', gain: 0.42 },
    { freq: 659, duration: 0.22, type: 'sine', gain: 0.45 },
  ]),
};

let muted = false;

export function setSoundMuted(value: boolean): void {
  muted = value;
}

export function isSoundMuted(): boolean {
  return muted;
}

/** Fires a short, one-shot sound effect. Failures (autoplay policy, etc.) are non-fatal. */
export function playSound(name: SoundName): void {
  if (muted) return;
  try {
    const player = createAudioPlayer(SOUND_URIS[name]);
    player.play();
    setTimeout(() => {
      try {
        player.remove();
      } catch {
        // Player may already be gone; nothing to clean up.
      }
    }, 1500);
  } catch {
    // Sound is a non-critical enhancement; ignore playback errors.
  }
}
