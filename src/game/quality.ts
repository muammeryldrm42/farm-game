// Graphics quality preference. Stored under its own key so the game save format stays untouched,
// and so every device keeps its own choice when a save code is moved between devices.

import { kvGet, kvSet } from './kv';

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
  const saved = kvGet(KEY);
  current = saved === 'high' || saved === 'low' ? saved : guess();
  return current;
}

export function setQuality(q: Quality) {
  if (q === getQuality()) return;
  current = q;
  kvSet(KEY, q);
  listeners.forEach((f) => f(q));
}

export function onQuality(f: (q: Quality) => void) {
  listeners.add(f);
  return () => { listeners.delete(f); };
}
