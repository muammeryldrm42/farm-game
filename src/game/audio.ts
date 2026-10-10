// Tiny WebAudio synth, no audio files needed
import type { Sfx } from './state';

let ac: AudioContext | null = null;
const lastPlay: Record<string, number> = {};

function ctx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ac) {
    const C = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!C) return null;
    ac = new C();
  }
  if (ac.state === 'suspended') void ac.resume();
  return ac;
}

function tone(f: number, d: number, type: OscillatorType = 'sine', v = 0.12, delay = 0, f2?: number) {
  const a = ctx();
  if (!a) return;
  const t = a.currentTime + delay;
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f, t);
  if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + d);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(v, t + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t + d);
  o.connect(g).connect(a.destination);
  o.start(t);
  o.stop(t + d + 0.03);
}

export function sfx(name: Sfx) {
  const now = performance.now();
  if (now - (lastPlay[name] ?? 0) < 45) return;
  lastPlay[name] = now;
  switch (name) {
    case 'harvest': tone(620 + Math.random() * 120, 0.1, 'triangle', 0.09, 0, 1100); break;
    case 'plant': tone(260, 0.09, 'sine', 0.14, 0, 150); break;
    case 'click': tone(740, 0.05, 'sine', 0.06); break;
    case 'coin': tone(988, 0.08, 'square', 0.04); tone(1319, 0.16, 'square', 0.04, 0.07); break;
    case 'collect': tone(523, 0.08, 'triangle', 0.1); tone(784, 0.12, 'triangle', 0.1, 0.07); break;
    case 'build': tone(140, 0.14, 'triangle', 0.18, 0, 90); tone(220, 0.1, 'sine', 0.1, 0.1); break;
    case 'error': tone(200, 0.16, 'sawtooth', 0.05, 0, 140); break;
    case 'levelup': [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.22, 'triangle', 0.11, i * 0.1)); break;
    // a rare find: a quick bright sparkle up the scale
    case 'rare': [1047, 1319, 1568, 2093].forEach((f, i) => tone(f, 0.16, 'sine', 0.07, i * 0.06)); tone(2637, 0.3, 'sine', 0.05, 0.26); break;
  }
}

// ---------------------------------------------------------------- background music
// A soft generative tune: I V vi IV in C major, plucked arpeggios over a warm bass.

let musicGain: GainNode | null = null;
let musicTimer: ReturnType<typeof setInterval> | null = null;
let nextNote = 0;
let step = 0;

const CHORDS = [
  [261.63, 329.63, 392.0], // C
  [196.0, 246.94, 293.66], // G
  [220.0, 261.63, 329.63], // Am
  [174.61, 220.0, 261.63], // F
];
const PENTA = [523.25, 587.33, 659.25, 783.99, 880.0];

function note(a: AudioContext, out: AudioNode, f: number, t: number, d: number, type: OscillatorType, v: number) {
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f, t);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(v, t + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t + d);
  o.connect(g).connect(out);
  o.start(t);
  o.stop(t + d + 0.05);
}

export function startMusic() {
  const a = ctx();
  if (!a || musicTimer) return;
  musicGain = a.createGain();
  musicGain.gain.setValueAtTime(0.0001, a.currentTime);
  musicGain.gain.exponentialRampToValueAtTime(0.5, a.currentTime + 2);
  musicGain.connect(a.destination);
  const beat = 60 / 88 / 2; // eighth notes at 88 bpm
  nextNote = a.currentTime + 0.1;
  step = 0;
  musicTimer = setInterval(() => {
    if (!musicGain) return;
    if (nextNote < a.currentTime - 0.3) nextNote = a.currentTime + 0.05;
    while (nextNote < a.currentTime + 0.25) {
      const bar = Math.floor(step / 8) % 16;
      const chord = CHORDS[bar % 4];
      const s8 = step % 8;
      if (s8 === 0) note(a, musicGain, chord[0] / 2, nextNote, beat * 7, 'sine', 0.07);
      if (s8 === 4) note(a, musicGain, chord[0] / 2, nextNote, beat * 3, 'sine', 0.045);
      const arp = [0, 1, 2, 1, 0, 2, 1, 2][s8];
      note(a, musicGain, chord[arp], nextNote, beat * 1.8, 'triangle', 0.035);
      // gentle melody, sparse and different every bar
      if (bar >= 4 && (s8 === 0 || s8 === 3 || s8 === 6) && Math.random() < 0.55) {
        note(a, musicGain, PENTA[Math.floor(Math.random() * PENTA.length)], nextNote, beat * 2.5, 'sine', 0.03);
      }
      nextNote += beat;
      step++;
    }
  }, 60);
}

export function stopMusic() {
  if (musicTimer) { clearInterval(musicTimer); musicTimer = null; }
  const a = ac;
  const g = musicGain;
  musicGain = null;
  if (a && g) {
    g.gain.setValueAtTime(Math.max(0.0001, g.gain.value), a.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + 0.6);
    setTimeout(() => g.disconnect(), 800);
  }
}

export const musicPlaying = () => musicTimer !== null;

// The game in the background: the sound output is let go once the music has faded (a running
// context keeps the phone's audio awake, silent or not). The next sound wakes it again.
export function sleepAudio() {
  const a = ac;
  if (!a || a.state !== 'running') return;
  setTimeout(() => { if (document.visibilityState === 'hidden' && !musicTimer && a.state === 'running') void a.suspend(); }, 800);
}
