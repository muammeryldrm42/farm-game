// YouTube Playables: the game inside YouTube. The YouTube build (npm run youtube) loads YouTube's
// SDK before the game; it tells YouTube when the game has its first picture and when it can be
// played, keeps the farm in the player's YouTube account instead of the browser's storage, and
// says when the game must pause (all of it, sound included) and whether sound is on.
// Anywhere else (the web, the Android app) there is no SDK and every call here does nothing.

interface YtGame {
  IN_PLAYABLES_ENV?: boolean;
  game: {
    firstFrameReady(): void;
    gameReady(): void;
    saveData(data: string): Promise<void>;
    loadData(): Promise<string>;
  };
  system: {
    isAudioEnabled(): boolean;
    onAudioEnabledChange(f: (on: boolean) => void): () => void;
    onPause(f: () => void): () => void;
    onResume(f: () => void): () => void;
    getLanguage(): Promise<string>;
  };
  health?: { logError(): void; logWarning(): void };
}

// the YouTube build (its page loads the SDK; it never uses the browser's storage)
export const YT_BUILD = process.env.NEXT_PUBLIC_TARGET === 'youtube';

function sdk(): YtGame | null {
  if (!YT_BUILD || typeof window === 'undefined') return null;
  const y = (window as unknown as { ytgame?: YtGame }).ytgame;
  return y?.IN_PLAYABLES_ENV ? y : null;
}

// running inside YouTube
export const inYouTube = () => sdk() !== null;

// the first picture is up (the loading screen counts), and then the game can be played: each told once
let framed = false, readied = false;
export function ytFirstFrame() {
  if (framed) return;
  const y = sdk();
  if (!y) return;
  framed = true;
  try { y.game.firstFrameReady(); } catch (e) { console.error(e); }
}
export function ytReady() {
  if (readied) return;
  const y = sdk();
  if (!y) return;
  ytFirstFrame();
  readied = true;
  try { y.game.gameReady(); } catch (e) { console.error(e); }
}

// ---------------------------------------------------------------- pause and sound

let paused = false;
let audio = true;
const pauseFns = new Set<(paused: boolean) => void>();
const audioFns = new Set<(on: boolean) => void>();

// YouTube asked the game to pause (the player left it, or something covers it)
export const ytPaused = () => paused;
// YouTube's own sound setting (on outside YouTube)
export const ytAudioOn = () => audio;

export function onYtPause(f: (paused: boolean) => void) {
  pauseFns.add(f);
  return () => { pauseFns.delete(f); };
}
export function onYtAudio(f: (on: boolean) => void) {
  audioFns.add(f);
  return () => { audioFns.delete(f); };
}

// listens to YouTube from the start (once)
let wired = false;
export function ytWire() {
  if (wired) return;
  const y = sdk();
  if (!y) return;
  wired = true;
  const setPaused = (p: boolean) => {
    if (p === paused) return;
    paused = p;
    pauseFns.forEach((f) => f(p));
  };
  try {
    audio = y.system.isAudioEnabled();
    y.system.onAudioEnabledChange((on) => {
      audio = !!on;
      audioFns.forEach((f) => f(audio));
    });
    y.system.onPause(() => setPaused(true));
    y.system.onResume(() => setPaused(false));
  } catch (e) { console.error(e); }
}

// ---------------------------------------------------------------- language and saves

// the player's language on YouTube (a BCP-47 code such as 'en-US'), or null
export async function ytLanguage(): Promise<string | null> {
  const y = sdk();
  if (!y) return null;
  try { return (await y.system.getLanguage()) || null; } catch { return null; }
}

export async function ytLoad(): Promise<string> {
  const y = sdk();
  if (!y) return '';
  return (await y.game.loadData()) ?? '';
}

export async function ytSave(data: string) {
  const y = sdk();
  if (!y) return;
  await y.game.saveData(data);
}

// an error YouTube counts for the game's health report
export function ytError(warning = false) {
  const h = sdk()?.health;
  if (!h) return;
  try { if (warning) h.logWarning(); else h.logError(); } catch { /* nothing to tell */ }
}
