// Graphics quality preference. Stored under its own key so the game save format stays untouched,
// and so every device keeps its own choice when a save code is moved between devices.

export type Quality = 'high' | 'low';

const KEY = 'talons-farm-gfx';

function guess(): Quality {
  if (typeof window === 'undefined') return 'high';
  const small = window.innerWidth < 700;
  const cores = navigator.hardwareConcurrency ?? 4;
  // phones and tablets (and the Android app) start on low: a phone held sideways is wider than
  // 700 px and has eight cores, yet its GPU is far from a desktop's
  const touch = window.matchMedia?.('(pointer: coarse)').matches ?? false;
  const mobile = touch || /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
  return small || mobile || cores <= 4 ? 'low' : 'high';
}

let current: Quality | null = null;
const listeners = new Set<(q: Quality) => void>();

export function getQuality(): Quality {
  if (current) return current;
  let saved: string | null = null;
  try { saved = localStorage.getItem(KEY); } catch { /* storage blocked */ }
  current = saved === 'high' || saved === 'low' ? saved : guess();
  return current;
}

export function setQuality(q: Quality) {
  if (q === getQuality()) return;
  current = q;
  try { localStorage.setItem(KEY, q); } catch { /* storage blocked */ }
  listeners.forEach((f) => f(q));
}

export function onQuality(f: (q: Quality) => void) {
  listeners.add(f);
  return () => { listeners.delete(f); };
}
