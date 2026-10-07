'use client';
import { useEffect, useRef, useState } from 'react';
import { GameStore, loadGame, plotProgress, type FarmObject } from '@/game/state';
import { BUILDING } from '@/game/data';
import { Renderer } from '@/game/render3d';
import { sfx, startMusic, stopMusic } from '@/game/audio';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { StoreCtx, useStore } from './ctx';
import Hud from './Hud';
import Panels from './Panels';
import Flyers from './Flyers';

export default function Game() {
  const [store, setStore] = useState<GameStore | null>(null);

  useEffect(() => {
    const st = new GameStore(loadGame());
    st.sound = (n) => { if (st.s.settings.sound) sfx(n); };
    setStore(st);
    const save = () => st.saveNow();
    const vis = () => { if (document.visibilityState === 'hidden') save(); };
    window.addEventListener('beforeunload', save);
    document.addEventListener('visibilitychange', vis);
    const tick = setInterval(() => st.tick(), 1000);
    // music can only start after a user gesture
    let unlocked = false;
    const syncMusic = () => {
      if (unlocked && st.s.settings.music && document.visibilityState === 'visible') startMusic();
      else stopMusic();
    };
    const unlock = () => { unlocked = true; syncMusic(); };
    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
    document.addEventListener('visibilitychange', syncMusic);
    const unsub = st.subscribe(syncMusic);
    // the Android app: the back button closes whatever is open (and only then leaves the game),
    // and the farm is saved whenever the app goes to the background
    const native: Promise<{ remove: () => Promise<void> }>[] = [];
    if (Capacitor.isNativePlatform()) {
      native.push(App.addListener('backButton', () => {
        const ui = st.ui;
        if (ui.story) { ui.story = null; st.emit(false); }
        else if (ui.levelUp !== null) { ui.levelUp = null; st.emit(false); }
        else if (ui.daily) { ui.daily = false; st.emit(false); }
        else if (ui.napping) st.wake();
        else if (ui.panel || ui.placing || ui.tool || ui.expand || ui.selectedId !== null) st.cancelAll();
        else { save(); App.minimizeApp(); }
      }));
      native.push(App.addListener('pause', save));
    }
    return () => {
      unsub();
      for (const h of native) h.then((x) => x.remove());
      stopMusic();
      document.removeEventListener('visibilitychange', syncMusic);
      window.removeEventListener('beforeunload', save);
      document.removeEventListener('visibilitychange', vis);
      clearInterval(tick);
    };
  }, []);

  if (!store) {
    return (
      <div className="fixed inset-0 grid place-items-center bg-[#3f9fd8] font-game text-white">
        <div className="text-center">
          <div className="emoji animate-bob text-6xl">🌾</div>
          <div className="mt-3 text-2xl font-bold">Talons Farm</div>
        </div>
      </div>
    );
  }

  return (
    <StoreCtx.Provider value={store}>
      <FarmCanvas />
      <Hud />
      <Flyers />
      <Panels />
    </StoreCtx.Provider>
  );
}

type Mode = 'none' | 'pending' | 'pan' | 'harvest' | 'plant' | 'ghost' | 'pinch';

function FarmCanvas() {
  const store = useStore();
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const r = new Renderer(canvas, store);
    (window as unknown as { __farm?: unknown }).__farm = { store, renderer: r };
    store.viewCenter = () => r.gridAt(r.W / 2, r.H / 2);
    store.toScreen = (gx, gy, z) => r.toScreen(gx, gy, z);
    store.focusOn = (x, y) => r.centerOn(x, y);

    let first = true;
    const resize = () => {
      const w = window.innerWidth, h = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, w < 700 ? 1.75 : 2);
      r.resize(w, h, dpr);
      if (first && w < 640) r.cam.zoom = 1;
      first = false;
    };
    resize();
    window.addEventListener('resize', resize);

    let raf = 0;
    // at most 60 frames a second (30 with the battery saver): a 120 Hz phone would otherwise draw
    // twice as often, for twice the heat and battery, with nothing more to see
    let last = 0;
    const loop = (t: number) => {
      raf = requestAnimationFrame(loop);
      const gap = store.s.settings.saver ? 1000 / 30 : 1000 / 60;
      if (t - last < gap - 4) return;
      last = t;
      r.frame(t);
    };
    raf = requestAnimationFrame(loop);

    // ---------------------------------------------- input
    const pts = new Map<number, { x: number; y: number }>();
    let mode: Mode = 'none';
    let sx = 0, sy = 0, pinchD = 1, pinchZ = 1, pinchA = 0;
    let hitObj: FarmObject | null = null;
    let hitSpot: 'fishing' | 'seaFishing' | 'visitor' | null = null;
    let hitPick: ReturnType<typeof r.pick> | null = null;
    let hitTile = { x: 0, y: 0 };
    let ghostOff = { x: 0, y: 0 };
    let lp: ReturnType<typeof setTimeout> | null = null;
    let longFired = false;

    const pos = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    const clearLP = () => { if (lp) { clearTimeout(lp); lp = null; } };
    const dist = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(a.x - b.x, a.y - b.y);

    const onDown = (e: PointerEvent) => {
      canvas.setPointerCapture(e.pointerId);
      const p = pos(e);
      pts.set(e.pointerId, p);
      if (pts.size === 2) {
        clearLP();
        const [a, b] = [...pts.values()];
        pinchD = Math.max(1, dist(a, b));
        pinchZ = r.cam.zoom;
        pinchA = Math.atan2(b.y - a.y, b.x - a.x);
        mode = 'pinch';
        return;
      }
      if (pts.size > 2) return;
      sx = p.x; sy = p.y;
      r.panStart(p.x, p.y);
      longFired = false;
      const hit = r.pick(p.x, p.y);
      hitObj = hit.obj ?? null;
      hitSpot = hit.spot ?? null;
      hitPick = hit;
      hitTile = hit.tile;
      const ui = store.ui;

      if (ui.placing) {
        const pl = ui.placing;
        const d = store.placingFootprint();
        const g = r.gridAt(p.x, p.y);
        if (g.x >= pl.x && g.x < pl.x + d.w && g.y >= pl.y && g.y < pl.y + d.h) {
          mode = 'ghost';
          ghostOff = { x: g.x - pl.x, y: g.y - pl.y };
        } else mode = 'pending';
        return;
      }

      if (hitObj && BUILDING[hitObj.type].kind === 'plot') {
        const pp = plotProgress(hitObj, Date.now());
        if (pp.ready) { store.harvest(hitObj); mode = 'harvest'; return; }
        if (!hitObj.plot?.crop && ui.tool) { store.plant(hitObj, ui.tool.crop); mode = 'plant'; return; }
      }

      mode = 'pending';
      if (hitObj && BUILDING[hitObj.type].kind !== 'obstacle') {
        const target = hitObj;
        lp = setTimeout(() => {
          if (mode === 'pending') {
            longFired = true;
            mode = 'none';
            store.startMove(target.id);
            navigator.vibrate?.(25);
          }
        }, 600);
      }
    };

    const onMove = (e: PointerEvent) => {
      if (!pts.has(e.pointerId)) return;
      const p = pos(e);
      pts.set(e.pointerId, p);
      if (mode === 'pinch') {
        if (pts.size >= 2) {
          const [a, b] = [...pts.values()];
          r.zoomAt((a.x + b.x) / 2, (a.y + b.y) / 2, (pinchZ * dist(a, b)) / pinchD);
          const ang = Math.atan2(b.y - a.y, b.x - a.x);
          let da = ang - pinchA;
          if (da > Math.PI) da -= Math.PI * 2;
          if (da < -Math.PI) da += Math.PI * 2;
          r.rotateBy(-da);
          pinchA = ang;
        }
        return;
      }
      if (mode === 'harvest' || mode === 'plant') {
        const g = r.gridAt(p.x, p.y);
        const o = store.objectAt(g.x, g.y);
        if (o && o.plot) {
          if (mode === 'harvest' && plotProgress(o, Date.now()).ready) store.harvest(o, true);
          else if (mode === 'plant' && !o.plot.crop && store.ui.tool) store.plant(o, store.ui.tool.crop, true);
        }
        return;
      }
      if (mode === 'ghost') {
        const g = r.gridAt(p.x, p.y);
        store.setPlacingPos(g.x - ghostOff.x, g.y - ghostOff.y);
        return;
      }
      if (mode === 'pending' && Math.hypot(p.x - sx, p.y - sy) > 8) { mode = 'pan'; clearLP(); }
      if (mode === 'pan') r.panTo(p.x, p.y);
    };

    const onUp = (e: PointerEvent) => {
      if (!pts.has(e.pointerId)) return;
      const p = pos(e);
      pts.delete(e.pointerId);
      clearLP();
      if (mode === 'pinch') {
        if (pts.size === 1) {
          const [q] = [...pts.values()];
          sx = q.x; sy = q.y;
          r.panStart(q.x, q.y);
          mode = 'pan';
        } else if (pts.size === 0) mode = 'none';
        return;
      }
      if (mode === 'pending' && !longFired) {
        if (store.ui.placing) {
          const d = store.placingFootprint();
          const g = r.gridAt(p.x, p.y);
          store.setPlacingPos(g.x - Math.floor((d.w - 1) / 2), g.y - Math.floor((d.h - 1) / 2));
        } else if (hitPick?.pet) {
          store.tapPet(hitPick.pet);
        } else if (hitPick?.creature) {
          store.spotCreature(hitPick.creature.kind);
          r.startle(hitPick.creature);
        } else if (hitObj) {
          // the farmer walks over to whatever you tap
          store.wake();
          r.walkToObject(hitObj);
          store.tapObject(hitObj);
        }
        else if (hitSpot === 'fishing') store.tapFishing('lake');
        else if (hitSpot === 'seaFishing') store.tapFishing('sea');
        else if (hitSpot === 'visitor') store.tapVisitor();
        else {
          // tapping free farmland sends the farmer (and the dog) walking there
          store.wake();
          r.walkTo(hitTile.x, hitTile.y);
          store.tapTile(hitTile.x, hitTile.y);
        }
      }
      if (pts.size === 0) mode = 'none';
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      r.zoomAt(e.clientX - rect.left, e.clientY - rect.top, r.cam.zoom * Math.exp(-e.deltaY * 0.0015));
    };

    const onKey = (e: KeyboardEvent) => {
      // typing a pet's name, a price or a save code must not turn or zoom the farm
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable)) return;
      if (e.key === 'Escape') store.cancelAll();
      if (e.key === 'Enter' && store.ui.placing) store.confirmPlace();
      if (e.key === '+' || e.key === '=') r.zoomAt(r.W / 2, r.H / 2, r.cam.zoom * 1.15);
      if (e.key === '-') r.zoomAt(r.W / 2, r.H / 2, r.cam.zoom / 1.15);
      if (e.key === 'q' || e.key === 'Q') r.rotate(-1);
      if (e.key === 'e' || e.key === 'E') r.rotate(1);
    };

    const onZoom = (ev: Event) => {
      const dir = (ev as CustomEvent<number>).detail;
      if (dir === 0) r.resetView(window.innerWidth < 640 ? 1 : 1.3);
      else r.zoomAt(r.W / 2, r.H / 2, r.cam.zoom * (dir > 0 ? 1.2 : 1 / 1.2));
    };

    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerup', onUp);
    canvas.addEventListener('pointercancel', onUp);
    canvas.addEventListener('wheel', onWheel, { passive: false });
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    window.addEventListener('keydown', onKey);
    window.addEventListener('farm-zoom', onZoom);
    const onRotate = (ev: Event) => r.rotate((ev as CustomEvent<number>).detail);
    window.addEventListener('farm-rotate', onRotate);

    return () => {
      cancelAnimationFrame(raf);
      clearLP();
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('pointercancel', onUp);
      canvas.removeEventListener('wheel', onWheel);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('farm-zoom', onZoom);
      window.removeEventListener('farm-rotate', onRotate);
      r.dispose();
    };
  }, [store]);

  return <canvas ref={ref} className="fixed inset-0 block h-full w-full touch-none select-none" aria-label="Farm map" />;
}
