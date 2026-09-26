'use client';
import { createContext, useContext, useEffect, useState, useSyncExternalStore } from 'react';
import type { GameStore } from '@/game/state';

export const StoreCtx = createContext<GameStore | null>(null);

export function useStore() {
  const s = useContext(StoreCtx);
  if (!s) throw new Error('GameStore missing');
  return s;
}

export function useVersion() {
  const s = useStore();
  return useSyncExternalStore(s.subscribe, s.getVersion, s.getVersion);
}

export function useNow(ms = 500) {
  const [n, setN] = useState(() => Date.now());
  useEffect(() => {
    const i = setInterval(() => setN(Date.now()), ms);
    return () => clearInterval(i);
  }, [ms]);
  return n;
}
