// The farm's clock. Everything that takes time on the farm (fields, pens, workshops, trees, the
// daily gift...) runs on this clock instead of straight on the phone's, so setting the phone's
// clock forward does not make anything ready sooner, and setting it back undoes nothing.
//
// - While the game is open the clock runs on the browser's steady timer (performance.now), which
//   a change of the phone's clock does not touch.
// - When the game opens, comes back from the background, or the steady timer and the phone's
//   clock part ways (the phone slept, or its clock was changed), the clock is set again from the
//   real time: the time on the internet when it can be had (a second or so of waiting); else, in
//   the Android app, the time the phone has been on (which a clock change does not touch either)
//   counted from the last time it was known on this phone; else the phone's clock.
// - The farm's clock never goes back. If it ran ahead of the real time (the phone's clock was
//   set forward with no internet), the farm waits until the real time catches up.
import { Capacitor, CapacitorHttp } from '@capacitor/core';

const perf = () => performance.now();
// the real time, as best known: `t` at the steady timer's `p`
let anchor = { t: Date.now(), p: perf() };
// the farm's clock is never behind this (its last reading, or the times in the save)
let floor = 0;
// how the real time was last set: from the internet, from the time the phone has been on, or
// from the phone's clock
export type ClockSource = 'net' | 'uptime' | 'device';
let source: ClockSource = 'device';

export const realNow = () => anchor.t + (perf() - anchor.p);

// the farm's time now (ms since 1970, like Date.now)
export function now() {
  const t = Math.floor(realNow());
  if (t > floor) floor = t;
  return floor;
}

// how far the farm's clock runs ahead of the real time (0 when it does not): the farm waits that long
export const clockAhead = () => Math.max(0, floor - realNow());
export const clockSource = () => source;

// a time on the farm's clock as the phone's clock will show it (for the phone's notifications)
export const toDevice = (t: number) => t - (realNow() - Date.now());

// the times in a loaded save: the farm's clock does not go back past them
export function clockFloor(t: number | undefined) {
  if (typeof t === 'number' && Number.isFinite(t) && t > floor) floor = t;
}

// ---------------------------------------------------------------- the Android app's uptime

// The Android app tells the page how long the phone has been on and how many times it has been
// switched on (see MainActivity), when the page loads and whenever the app comes back.
interface Uptime { up: number; boot: number; p: number }
const uptime = (): Uptime | null => {
  const u = (globalThis as { __uptime?: Uptime }).__uptime;
  return u && Number.isFinite(u.up) ? u : null;
};
const upNow = (u: Uptime) => u.up + (perf() - u.p);
// the app tells it as the page finishes loading: the game may be up a moment before that
const uptimeIn = () => new Promise<void>((ok) => {
  if (uptime() || !Capacitor.isNativePlatform()) return ok();
  const tm = setTimeout(ok, 1500);
  addEventListener('farm-clock', () => { clearTimeout(tm); ok(); }, { once: true });
});

// the real time and the uptime at the same moment, kept on this phone, so the real time can be
// counted on from it with no internet (until the phone is switched off)
const KEY = 'talons-farm-clock';
interface Known { real: number; up: number; boot: number }
function readKnown(): Known | null {
  try {
    const k = JSON.parse(localStorage.getItem(KEY) ?? 'null');
    return k && Number.isFinite(k.real) && Number.isFinite(k.up) ? k : null;
  } catch {
    return null;
  }
}
// called with every save
export function keepClock() {
  const u = uptime();
  if (!u) return;
  try { localStorage.setItem(KEY, JSON.stringify({ real: Math.round(realNow()), up: Math.round(upNow(u)), boot: u.boot })); } catch { /* storage full */ }
}

// ---------------------------------------------------------------- the time on the internet

const withTimeout = <T,>(p: Promise<T>, ms: number) => Promise.race([p, new Promise<never>((_, no) => setTimeout(() => no(new Error('timeout')), ms))]);
const header = (h: Record<string, string> | undefined, name: string) => {
  for (const k in h ?? {}) if (k.toLowerCase() === name) return h![k];
  return undefined;
};

// The time from a web server, read in the middle of the round trip. A server's Date header
// counts whole seconds, so half a second is added (the best guess within that second).
async function netTime(): Promise<{ t: number; p: number } | null> {
  const p0 = perf();
  const done = (t: number | undefined) => {
    if (!t || !Number.isFinite(t)) throw new Error('no time');
    return { t, p: (p0 + perf()) / 2 };
  };
  const fromDate = (d: string | null | undefined) => done(d ? Date.parse(d) + 500 : undefined);
  try {
    if (Capacitor.isNativePlatform()) {
      // two well known servers, whichever answers first
      const google = CapacitorHttp.get({ url: 'https://www.google.com/generate_204', connectTimeout: 3000, readTimeout: 3000 }).then((r) => fromDate(header(r.headers, 'date')));
      const cf = CapacitorHttp.get({ url: 'https://cloudflare.com/cdn-cgi/trace', connectTimeout: 3000, readTimeout: 3000 }).then((r) => {
        const m = /(?:^|\n)ts=([\d.]+)/.exec(String(r.data));
        return done(m ? Math.round(parseFloat(m[1]) * 1000) : undefined);
      });
      return await withTimeout(Promise.any([google, cf]), 3500);
    }
    // on the web: the game's own server
    const r = await withTimeout(fetch(`${location.pathname}?clock=${Math.random().toString(36).slice(2)}`, { method: 'HEAD', cache: 'no-store' }), 3500);
    return fromDate(r.headers.get('date'));
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------- setting the clock

let syncing: Promise<void> | null = null;

// sets the real time again (see the top): resolves once it is set
export function syncClock(): Promise<void> {
  if (syncing) return syncing;
  syncing = (async () => {
    const net = await netTime();
    if (net) {
      anchor = net;
      source = 'net';
    } else {
      // no internet: counted on from the last time known on this phone, if it was not switched off since
      await uptimeIn();
      const u = uptime(), k = readKnown();
      if (u && k && k.boot === u.boot && upNow(u) >= k.up) {
        anchor = { t: k.real + (upNow(u) - k.up), p: perf() };
        source = 'uptime';
      } else {
        anchor = { t: Date.now(), p: perf() };
        source = 'device';
      }
    }
    keepClock();
    watch = { d: Date.now(), p: perf() };
  })().finally(() => { syncing = null; });
  return syncing;
}

// The steady timer and the phone's clock are compared now and then: when they part ways by more
// than a few seconds the phone slept (the steady timer stops while it sleeps) or its clock was
// changed, and the real time is set again.
let watch = { d: Date.now(), p: perf() };
export function clockDrifted() {
  const d = Date.now(), p = perf();
  const drift = Math.abs((d - watch.d) - (p - watch.p));
  watch = { d, p };
  return drift > 5000;
}
