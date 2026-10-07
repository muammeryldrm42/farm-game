// Graphics quality preference. Stored under its own key so the game save format stays untouched,
// and so every device keeps its own choice when a save code is moved between devices.

export type Quality = 'high' | 'low';

const KEY = 'talons-farm-gfx';

// every new player starts on low: the farm runs smoothly everywhere, and a strong computer can
// switch to high in the settings
function guess(): Quality {
  return 'low';
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
