/**
 * Tiny dependency-free WAV synthesizer. Generates short procedural tones as
 * base64 data URIs so the game ships sound effects without bundling audio
 * assets or relying on `Buffer` (unavailable in the RN/web runtime).
 */

export type WaveType = 'sine' | 'square' | 'triangle';

export interface Note {
  freq: number;
  duration: number;
  type?: WaveType;
  gain?: number;
}

const SAMPLE_RATE = 8000;
const BASE64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

function base64FromBytes(bytes: Uint8Array): string {
  let result = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const b0 = bytes[i];
    const b1 = i + 1 < bytes.length ? bytes[i + 1] : 0;
    const b2 = i + 2 < bytes.length ? bytes[i + 2] : 0;
    const triplet = (b0 << 16) | (b1 << 8) | b2;
    result += BASE64_CHARS[(triplet >> 18) & 0x3f];
    result += BASE64_CHARS[(triplet >> 12) & 0x3f];
    result += i + 1 < bytes.length ? BASE64_CHARS[(triplet >> 6) & 0x3f] : '=';
    result += i + 2 < bytes.length ? BASE64_CHARS[triplet & 0x3f] : '=';
  }
  return result;
}

function waveSample(type: WaveType, phase: number): number {
  if (type === 'square') return Math.sign(Math.sin(phase)) || 1;
  if (type === 'triangle') return (2 / Math.PI) * Math.asin(Math.sin(phase));
  return Math.sin(phase);
}

function synthesizeSamples(notes: Note[]): Int16Array {
  const noteLengths = notes.map((n) => Math.max(1, Math.floor(n.duration * SAMPLE_RATE)));
  const total = noteLengths.reduce((a, b) => a + b, 0);
  const out = new Int16Array(total);

  let offset = 0;
  notes.forEach((note, idx) => {
    const n = noteLengths[idx];
    const gain = note.gain ?? 0.5;
    const type = note.type ?? 'sine';
    const attack = Math.min(n, Math.floor(SAMPLE_RATE * 0.006));
    for (let i = 0; i < n; i++) {
      const t = i / SAMPLE_RATE;
      const envelope =
        i < attack ? i / attack : Math.pow(1 - (i - attack) / Math.max(1, n - attack), 1.6);
      const sample = waveSample(type, 2 * Math.PI * note.freq * t) * envelope * gain;
      out[offset + i] = Math.max(-32767, Math.min(32767, Math.round(sample * 32767)));
    }
    offset += n;
  });

  return out;
}

function writeString(view: DataView, offset: number, value: string): void {
  for (let i = 0; i < value.length; i++) {
    view.setUint8(offset + i, value.charCodeAt(i));
  }
}

function encodeWav(samples: Int16Array): Uint8Array {
  const blockAlign = 2;
  const byteRate = SAMPLE_RATE * blockAlign;
  const dataSize = samples.length * 2;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, SAMPLE_RATE, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  for (let i = 0; i < samples.length; i++) {
    view.setInt16(44 + i * 2, samples[i], true);
  }

  return new Uint8Array(buffer);
}

/** Synthesizes a short sequence of notes into a playable `data:audio/wav` URI. */
export function synthTone(notes: Note[]): string {
  const wav = encodeWav(synthesizeSamples(notes));
  return `data:audio/wav;base64,${base64FromBytes(wav)}`;
}
