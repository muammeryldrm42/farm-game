// Where the game keeps what it saves (the farm, the graphics setting, the clock...): the browser's
// storage on the web and in the Android app, as always. Inside YouTube the browser's storage is not
// to be used: everything is kept in memory and sent to the player's YouTube account as one piece,
// a few seconds after a change and at once when the game pauses or is closed (see yt.ts).
import { inYouTube, ytError, ytLoad, ytSave } from './yt';

// (written out here rather than taken from yt.ts, so the browser's storage is left out of the
// YouTube build entirely)
const YT_BUILD = process.env.NEXT_PUBLIC_TARGET === 'youtube';

const mem = new Map<string, string>();
// the saves are YouTube's
let cloud = false;
// false when YouTube could not give the saves back: the game goes on, but never writes over them
let writable = true;
let dirty = false;
let sending: Promise<void> | null = null;
let pushT: ReturnType<typeof setTimeout> | null = null;
let lastPush = 0;
// at most one send every few seconds while playing
const GAP = 8000;
// what YouTube keeps for a game (3 MiB), with room to spare
const MAX = 2_900_000;
// a piece from YouTube that could not be read: kept as it was, not written over
const UNREADABLE = 'talons-farm-unreadable-cloud';

// before the game loads: the saves from YouTube (nothing to do anywhere else)
export async function kvInit() {
  if (cloud || !inYouTube()) return;
  cloud = true;
  let raw = '';
  for (let i = 0; ; i++) {
    try { raw = await ytLoad(); break; } catch (e) {
      console.error(e);
      if (i < 2) { await new Promise((ok) => setTimeout(ok, 1000 * (i + 1))); continue; }
      writable = false;
      ytError();
      break;
    }
  }
  if (raw) {
    try {
      const d = JSON.parse(raw) as Record<string, unknown>;
      for (const k in d) if (typeof d[k] === 'string') mem.set(k, d[k] as string);
    } catch {
      mem.set(UNREADABLE, raw);
      ytError(true);
    }
  }
}

export function kvGet(k: string): string | null {
  if (YT_BUILD) return mem.get(k) ?? null;
  try { return localStorage.getItem(k); } catch { return null; }
}

export function kvSet(k: string, v: string) {
  if (YT_BUILD) {
    mem.set(k, v);
    dirty = true;
    schedule();
    return;
  }
  try { localStorage.setItem(k, v); } catch { /* storage full or blocked */ }
}

// can the browser's storage be written here? Not where the browser keeps no data for this site
// (blocked in its settings): then the farm cannot be saved, and the game says so. (Inside
// YouTube the saves are YouTube's.)
export function kvWorks(): boolean {
  if (YT_BUILD || cloud) return true;
  try {
    const k = 'talons-farm-probe';
    localStorage.setItem(k, '1');
    const ok = localStorage.getItem(k) === '1';
    localStorage.removeItem(k);
    return ok;
  } catch {
    return false;
  }
}

function schedule() {
  if (!cloud || !writable || pushT || sending) return;
  pushT = setTimeout(send, Math.max(0, lastPush + GAP - Date.now()));
}

function pack() {
  const d = Object.fromEntries(mem);
  let s = JSON.stringify(d);
  // too much for YouTube: what could not be read goes first
  for (const k of Object.keys(d)) {
    if (s.length <= MAX) break;
    if (k === UNREADABLE || k.endsWith('-unreadable')) { delete d[k]; s = JSON.stringify(d); }
  }
  return s;
}

function send(): Promise<void> {
  if (pushT) { clearTimeout(pushT); pushT = null; }
  if (!cloud || !writable || !dirty || sending) return sending ?? Promise.resolve();
  dirty = false;
  lastPush = Date.now();
  sending = ytSave(pack())
    .catch((e) => { console.error(e); dirty = true; ytError(true); })
    .finally(() => { sending = null; schedule(); });
  return sending;
}

// now, not in a few seconds (the game pauses, goes to the background or closes): done once sent
export function kvFlush(): Promise<void> {
  if (!cloud) return Promise.resolve();
  return sending ? sending.then(send) : send();
}
