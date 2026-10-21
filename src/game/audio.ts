// Tiny WebAudio synth, no audio files needed
import type { Sfx } from './state';
import { ytAudioOn, ytPaused } from './yt';

let ac: AudioContext | null = null;
const lastPlay: Record<string, number> = {};

function ctx(): AudioContext | null {
  // not a sound while YouTube has the game paused or its sound off
  if (typeof window === 'undefined' || ytPaused() || !ytAudioOn()) return null;
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

// The game in the background (or paused, or muted, by YouTube): the sound output is let go once
// the music has faded (a running context keeps the phone's audio awake, silent or not), or at once
// (`now`: YouTube paused the game). The next sound wakes it again.
const quiet = () => document.visibilityState === 'hidden' || ytPaused() || !ytAudioOn();
export function sleepAudio(now = false) {
  const a = ac;
  if (!a || a.state !== 'running') return;
  if (now) { void a.suspend(); return; }
  setTimeout(() => { if (quiet() && !musicTimer && !amb && a.state === 'running') void a.suspend(); }, 800);
}

// ---------------------------------------------------------------- the farm's own sounds
// Under the music, soft: birds singing by day, crickets and now and then an owl by night, the
// rain while it rains, and always a little wind and the sea on the shore. All made here (filtered
// noise and little sweeps of tone), no audio files. `now()` tells how dark it is (0 day, 1 night)
// and how hard it rains (0 to 1).

interface AmbState { night: number; rain: number }
let amb: { out: GainNode; timer: ReturnType<typeof setInterval>; wind: GainNode; rain: GainNode; sea: GainNode; birdAt: number; crickAt: number; owlAt: number; seaAt: number } | null = null;
let noiseBuf: AudioBuffer | null = null;

function noise(a: AudioContext) {
  if (noiseBuf) return noiseBuf;
  const n = a.sampleRate * 2;
  noiseBuf = a.createBuffer(1, n, a.sampleRate);
  const d = noiseBuf.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
  return noiseBuf;
}

// a looping noise through a filter, into its own level
function bed(a: AudioContext, out: AudioNode, type: BiquadFilterType, f: number, q = 0.7) {
  const src = a.createBufferSource();
  src.buffer = noise(a);
  src.loop = true;
  src.loopStart = Math.random();
  const fl = a.createBiquadFilter();
  fl.type = type; fl.frequency.value = f; fl.Q.value = q;
  const g = a.createGain();
  g.gain.value = 0.0001;
  src.connect(fl).connect(g).connect(out);
  src.start();
  return g;
}

// a short sweep of tone, as a bird's note or a cricket's pulse
function chirp(a: AudioContext, out: AudioNode, t: number, f0: number, f1: number, d: number, v: number) {
  const o = a.createOscillator(), g = a.createGain();
  o.type = 'sine';
  o.frequency.setValueAtTime(f0, t);
  o.frequency.exponentialRampToValueAtTime(f1, t + d);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(v, t + Math.min(0.012, d / 3));
  g.gain.exponentialRampToValueAtTime(0.0001, t + d);
  o.connect(g).connect(out);
  o.start(t);
  o.stop(t + d + 0.02);
}

// a bird's song: one of a few kinds, at a slightly different pitch each time
function song(a: AudioContext, out: AudioNode, t: number) {
  const p = 0.85 + Math.random() * 0.3, kind = Math.floor(Math.random() * 4);
  if (kind === 0) for (let i = 0; i < 4 + Math.floor(Math.random() * 4); i++) chirp(a, out, t + i * 0.09, 3200 * p, 4400 * p, 0.06, 0.018);
  else if (kind === 1) { chirp(a, out, t, 4200 * p, 3600 * p, 0.16, 0.02); chirp(a, out, t + 0.22, 3000 * p, 2500 * p, 0.22, 0.018); }
  else if (kind === 2) for (let i = 0; i < 6; i++) chirp(a, out, t + i * 0.07, (i % 2 ? 2600 : 3400) * p, (i % 2 ? 3100 : 2900) * p, 0.06, 0.014);
  else { chirp(a, out, t, 2200 * p, 3800 * p, 0.12, 0.016); chirp(a, out, t + 0.15, 3800 * p, 3500 * p, 0.08, 0.014); }
}

// a cricket: a few quick pulses at its own pitch
function cricket(a: AudioContext, out: AudioNode, t: number, f: number) {
  for (let i = 0; i < 3; i++) chirp(a, out, t + i * 0.045, f, f * 0.98, 0.022, 0.006);
}

export function startAmbience(now: () => AmbState) {
  const a = ctx();
  if (!a || amb) return;
  const out = a.createGain();
  out.gain.setValueAtTime(0.0001, a.currentTime);
  out.gain.exponentialRampToValueAtTime(1, a.currentTime + 3);
  out.connect(a.destination);
  const t0 = a.currentTime;
  amb = {
    // (the wind and the sea a little brighter than a real one: a phone's speaker hardly plays the low end)
    out, wind: bed(a, out, 'lowpass', 750), rain: bed(a, out, 'bandpass', 2600, 0.4), sea: bed(a, out, 'lowpass', 850),
    birdAt: t0 + 1 + Math.random() * 2, crickAt: t0 + 0.5, owlAt: t0 + 15 + Math.random() * 20, seaAt: t0,
    timer: setInterval(() => {
      const s = amb;
      if (!s) return;
      const t = a.currentTime, st = now(), day = 1 - st.night;
      // the beds: the wind breathes, the rain comes and goes with the shower, the sea swells
      s.wind.gain.setTargetAtTime(0.03 + Math.random() * 0.025 + st.rain * 0.02, t, 1.5);
      s.rain.gain.setTargetAtTime(0.0001 + st.rain * 0.06, t, 0.8);
      if (t >= s.seaAt) { s.sea.gain.setTargetAtTime(0.01 + Math.random() * 0.03, t, 1.8); s.seaAt = t + 3 + Math.random() * 4; }
      // birds by day (fewer in the rain)
      if (t >= s.birdAt) {
        if (day > 0.5 && Math.random() < 1 - st.rain * 0.8) song(a, s.out, t + 0.05);
        s.birdAt = t + 1.5 + Math.random() * 5;
      }
      // crickets by night, two or three of them at their own pitches
      if (t >= s.crickAt) {
        if (st.night > 0.4 && st.rain < 0.5) {
          const n = 1 + Math.floor(Math.random() * 3);
          for (let k = 0; k < n; k++) cricket(a, s.out, t + 0.05 + k * 0.19 + Math.random() * 0.05, 4300 + k * 260);
        }
        s.crickAt = t + 0.55 + Math.random() * 0.5;
      }
      // now and then an owl
      if (t >= s.owlAt) {
        if (st.night > 0.7) { chirp(a, s.out, t + 0.05, 420, 380, 0.32, 0.02); chirp(a, s.out, t + 0.55, 400, 360, 0.5, 0.018); }
        s.owlAt = t + 18 + Math.random() * 25;
      }
    }, 250),
  };
}

export function stopAmbience() {
  const s = amb, a = ac;
  amb = null;
  if (!s || !a) return;
  clearInterval(s.timer);
  s.out.gain.setValueAtTime(Math.max(0.0001, s.out.gain.value), a.currentTime);
  s.out.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + 0.6);
  setTimeout(() => s.out.disconnect(), 800);
}

export const ambiencePlaying = () => amb !== null;

// ---------------------------------------------------------------- the animals' voices
// A tap on a pen and its animals answer: a moo, a baa, a cluck, a quack... each made here like the
// rest (a buzzing tone shaped by a couple of filters, as a voice is), at a slightly different
// pitch each time. The quiet ones (rabbits, squirrels, chinchillas and the like) say nothing.

export type Voice = 'moo' | 'baa' | 'bleat' | 'cluck' | 'quack' | 'honk' | 'neigh' | 'heehaw' | 'gobble' | 'chirp' | 'buzz';
export function voiceOf(animal: string): Voice | null {
  const a = animal;
  if (/cow|buffalo|yak|bison|galloway|zebu|musk_ox|watusi|hereford|angus|charolais|longhorn|guernsey|brown_swiss|dexter/.test(a)) return 'moo';
  if (/sheep|dorper|blacknose|karakul/.test(a)) return 'baa';
  if (/goat/.test(a)) return 'bleat';
  if (/chicken|ayam|orpington|leghorn|rhode_island|wyandotte|marans|guinea_fowl|pheasant/.test(a)) return 'cluck';
  if (/duck|runner|campbell/.test(a)) return 'quack';
  if (/goose|swan/.test(a)) return 'honk';
  if (/horse|pony|appaloosa|clydesdale|palomino|friesian/.test(a)) return 'neigh';
  if (/donkey|mule/.test(a)) return 'heehaw';
  if (/gobbler|turkey/.test(a)) return 'gobble';
  if (/quail|parrot|kiwi|crane|heron|flamingo|peacock|rhea|emu|ostrich|cassowary/.test(a)) return 'chirp';
  if (a === 'bee') return 'buzz';
  return null;
}

// one sound of a voice: a tone from f0 through f1 to f2 (at `mid` of the way), with a wobble of
// its pitch (vib Hz, depth) and of its loudness (trem Hz, depth), through formant filters
function voiced(a: BaseAudioContext, out: AudioNode, t: number, o: { type?: OscillatorType; f0: number; f1: number; f2?: number; mid?: number; d: number; v: number; formants: [number, number][]; vib?: [number, number]; trem?: [number, number]; att?: number }) {
  const osc = a.createOscillator();
  osc.type = o.type ?? 'sawtooth';
  const f2 = o.f2 ?? o.f1, mid = o.mid ?? 0.5;
  osc.frequency.setValueAtTime(o.f0, t);
  osc.frequency.linearRampToValueAtTime(o.f1, t + o.d * mid);
  osc.frequency.linearRampToValueAtTime(f2, t + o.d);
  const stop = t + o.d + 0.05;
  if (o.vib) {
    const l = a.createOscillator(), lg = a.createGain();
    l.frequency.value = o.vib[0]; lg.gain.value = o.vib[1];
    l.connect(lg).connect(osc.frequency); l.start(t); l.stop(stop);
  }
  const env = a.createGain();
  const att = o.att ?? Math.min(0.05, o.d / 4);
  env.gain.setValueAtTime(0.0001, t);
  env.gain.exponentialRampToValueAtTime(o.v, t + att);
  env.gain.setValueAtTime(o.v, t + o.d * 0.7);
  env.gain.exponentialRampToValueAtTime(0.0001, t + o.d);
  let last: AudioNode = env;
  if (o.trem) {
    const tg = a.createGain(), l = a.createOscillator(), lg = a.createGain();
    tg.gain.value = 1 - o.trem[1] / 2;
    l.frequency.value = o.trem[0]; lg.gain.value = o.trem[1] / 2;
    l.connect(lg).connect(tg.gain); l.start(t); l.stop(stop);
    env.connect(tg); last = tg;
  }
  for (const [f, q] of o.formants) {
    const bp = a.createBiquadFilter();
    bp.type = 'bandpass'; bp.frequency.value = f; bp.Q.value = q;
    osc.connect(bp).connect(env);
  }
  last.connect(out);
  osc.start(t); osc.stop(stop);
}

export function speak(a: BaseAudioContext, out: AudioNode, t: number, v: Voice, p = 1) {
  switch (v) {
    case 'moo':
      voiced(a, out, t, { f0: 105 * p, f1: 132 * p, f2: 96 * p, mid: 0.35, d: 1.0, v: 0.5, att: 0.14, vib: [5, 2], formants: [[520, 4], [880, 5]] });
      break;
    case 'baa':
      voiced(a, out, t, { f0: 270 * p, f1: 255 * p, f2: 235 * p, d: 0.65, v: 0.32, trem: [9, 0.7], vib: [7, 8], formants: [[700, 3], [1300, 4], [2500, 5]] });
      break;
    case 'bleat':
      voiced(a, out, t, { f0: 380 * p, f1: 360 * p, f2: 320 * p, d: 0.45, v: 0.28, trem: [11, 0.8], vib: [8, 12], formants: [[800, 3], [1600, 4], [2800, 5]] });
      break;
    case 'cluck':
      for (let i = 0; i < 3; i++) voiced(a, out, t + i * 0.13, { type: 'square', f0: 560 * p, f1: 400 * p, d: 0.07, v: 0.16, att: 0.008, formants: [[1100, 2], [2200, 3]] });
      voiced(a, out, t + 0.42, { type: 'square', f0: 640 * p, f1: 700 * p, f2: 460 * p, mid: 0.3, d: 0.2, v: 0.18, att: 0.01, formants: [[1200, 2], [2400, 3]] });
      break;
    case 'quack':
      for (let i = 0; i < 2; i++) voiced(a, out, t + i * 0.22, { f0: 300 * p, f1: 240 * p, d: 0.15, v: 0.3, att: 0.01, formants: [[950, 2], [1900, 4]] });
      break;
    case 'honk':
      for (let i = 0; i < 2; i++) voiced(a, out, t + i * 0.3, { f0: 430 * p, f1: 400 * p, f2: 370 * p, d: 0.22, v: 0.26, att: 0.015, formants: [[1100, 4], [2200, 5]] });
      break;
    case 'neigh':
      voiced(a, out, t, { f0: 620 * p, f1: 950 * p, f2: 420 * p, mid: 0.6, d: 0.95, v: 0.24, att: 0.04, vib: [11, 70], trem: [12, 0.5], formants: [[1200, 2], [2400, 3]] });
      break;
    case 'heehaw':
      for (let i = 0; i < 2; i++) {
        voiced(a, out, t + i * 0.7, { f0: 680 * p, f1: 720 * p, d: 0.26, v: 0.22, att: 0.02, formants: [[1500, 3], [2600, 4]] });
        voiced(a, out, t + i * 0.7 + 0.3, { f0: 230 * p, f1: 200 * p, d: 0.36, v: 0.32, att: 0.03, formants: [[650, 3], [1100, 4]] });
      }
      break;
    case 'gobble':
      voiced(a, out, t, { f0: 520 * p, f1: 360 * p, d: 0.55, v: 0.24, att: 0.01, trem: [22, 1], formants: [[1000, 2], [2000, 3]] });
      break;
    case 'chirp':
      voiced(a, out, t, { type: 'sine', f0: 1800 * p, f1: 2700 * p, d: 0.12, v: 0.06, att: 0.01, formants: [[2200, 0.5]] });
      voiced(a, out, t + 0.16, { type: 'sine', f0: 2600 * p, f1: 2000 * p, d: 0.16, v: 0.06, att: 0.01, formants: [[2200, 0.5]] });
      break;
    case 'buzz':
      voiced(a, out, t, { f0: 210 * p, f1: 230 * p, f2: 200 * p, d: 0.7, v: 0.08, vib: [7, 6], trem: [3, 0.6], formants: [[700, 1]] });
      break;
  }
}

let lastVoice = 0;
// a pen's animals answer a tap (once a second and a half at most)
export function voice(animal: string) {
  const v = voiceOf(animal);
  const now = performance.now();
  if (!v || now - lastVoice < 1500) return;
  const a = ctx();
  if (!a) return;
  lastVoice = now;
  // (at the level of the other sounds of the game)
  const g = a.createGain();
  g.gain.value = 0.4;
  g.connect(a.destination);
  speak(a, g, a.currentTime + 0.02, v, 0.92 + Math.random() * 0.16);
  setTimeout(() => g.disconnect(), 2500);
}
