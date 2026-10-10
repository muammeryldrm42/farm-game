'use client';
import { useEffect, useRef, useState } from 'react';
import { GameStore, TUTORIAL_DONE, fmtTime, loadGame, plotProgress, type FarmObject } from '@/game/state';
import { BUILDING } from '@/game/data';
import { Renderer } from '@/game/render3d';
import { sfx, sleepAudio, startMusic, stopMusic } from '@/game/audio';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { notifyAsked, notifyAway, notifyBack, setNotifyAsked } from '@/game/notify';
import { StoreCtx, useStore } from './ctx';
import { initLang, onLang, t } from '@/game/i18n';
import { clockAhead, clockDrifted, clockOwed, now as clockNow, syncClock } from '@/game/clock';
import Hud from './Hud';
import Panels from './Panels';
import Flyers from './Flyers';

export default function Game() {
  const [store, setStore] = useState<GameStore | null>(null);
  const [drawn, setDrawn] = useState(false);
  // the start up screen lifts by itself if the farm never draws (no 3D on the device, or an error
  // on the way): better the game as it is than a screen that never goes away
  useEffect(() => {
    if (!store) return;
    const tm = setTimeout(() => setDrawn(true), 20000);
    return () => clearTimeout(tm);
  }, [store]);

  // the farm's clock is set from the real time (see clock.ts) and the chosen language loaded, a
  // moment each: then the farm is loaded and shown
  useEffect(() => {
    let alive = true, stop = () => {};
    Promise.all([syncClock(), initLang()]).finally(() => { if (alive) stop = startFarm(setStore); });
    return () => { alive = false; stop(); };
  }, []);

  if (!store) return <Splash />;

  return (
    <StoreCtx.Provider value={store}>
      <FarmCanvas onDrawn={() => setDrawn(true)} />
      <Hud />
      <Flyers />
      <Panels />
      {/* the start up screen stays over the farm until its first picture is drawn */}
      {!drawn && <Splash />}
    </StoreCtx.Provider>
  );
}

// The farm loaded and running: saves, the game's tick, music, the farm's clock, and in the Android
// app the back button and the phone's notifications. Gives back what stops it all.
function startFarm(show: (st: GameStore) => void) {
  const st = new GameStore(loadGame());
  st.sound = (n) => { if (st.s.settings.sound) sfx(n); };
  // the farm redraws when the language changes
  const offLang = onLang(() => st.emit(false));
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
    if (document.visibilityState === 'hidden') sleepAudio();
  };
  const unlock = () => { unlocked = true; syncMusic(); };
  window.addEventListener('pointerdown', unlock, { once: true });
  window.addEventListener('keydown', unlock, { once: true });
  document.addEventListener('visibilitychange', syncMusic);
  const unsub = st.subscribe(syncMusic);
  // the farm's clock is set again from the real time when the game comes back, or when the
  // phone slept or had its clock changed; a farm whose clock ran ahead says it is waiting
  // (said once a minute while it waits)
  let saidAt = 0;
  const ahead = () => {
    const a = clockAhead();
    if (a < 120e3 || Date.now() - saidAt < 60e3) return;
    saidAt = Date.now();
    st.toast(t('The phone clock was set ahead, so the farm waits {time} for the real time to catch up.', { time: fmtTime(a) }), 'bad');
  };
  // and after a restart of the phone with no internet, that the time from before it is still to come
  const owed = () => {
    const o = clockOwed();
    if (o > 10 * 60e3) st.toast(t('No internet: the time from before the phone was restarted is added once you are back online ({time}).', { time: fmtTime(o) }));
  };
  const reclock = () => syncClock().then(() => { ahead(); owed(); st.tick(); st.emit(false); });
  const visClock = () => { if (document.visibilityState === 'visible') reclock(); };
  document.addEventListener('visibilitychange', visClock);
  const drift = setInterval(() => { if (clockDrifted()) reclock(); else ahead(); }, 5000);
  const owedT = setTimeout(owed, 8000);
  // the Android app: the back button closes whatever is open (and only then leaves the game),
  // and the farm is saved whenever the app goes to the background. Leaving, the phone is told
  // when things will be ready (if the player wants notifications); coming back takes them away.
  const native: Promise<{ remove: () => Promise<void> }>[] = [];
  let askT: ReturnType<typeof setInterval> | undefined;
  if (Capacitor.isNativePlatform()) {
    native.push(App.addListener('backButton', () => {
      const ui = st.ui;
      if (ui.notifyAsk) { ui.notifyAsk = false; setNotifyAsked(); st.s.settings = { ...st.s.settings, notify: false }; st.emit(); }
      else if (ui.story) { ui.story = null; st.emit(false); }
      else if (ui.levelUp !== null) { ui.levelUp = null; st.emit(false); }
      else if (ui.daily) { ui.daily = false; st.emit(false); }
      else if (ui.napping) st.wake();
      else if (ui.panel || ui.placing || ui.tool || ui.expand || ui.selectedId !== null) st.cancelAll();
      else { save(); App.minimizeApp(); }
    }));
    native.push(App.addListener('pause', () => { save(); notifyAway(st.s); }));
    native.push(App.addListener('resume', () => { notifyBack(); reclock(); }));
    notifyBack();
    // asked once on this phone, a couple of minutes into playing, once the first steps are
    // done and nothing else is up
    const openedAt = Date.now();
    askT = setInterval(() => {
      const ui = st.ui;
      if (notifyAsked() || st.s.settings.notify !== undefined) { clearInterval(askT); return; }
      if (Date.now() - openedAt < 120e3 || st.s.tutorial < TUTORIAL_DONE || document.visibilityState !== 'visible') return;
      if (ui.panel || ui.placing || ui.tool || ui.expand || ui.story || ui.daily || ui.napping || ui.levelUp !== null) return;
      ui.notifyAsk = true;
      st.emit(false);
      clearInterval(askT);
    }, 5000);
  }
  show(st);
  return () => {
    offLang();
    unsub();
    for (const h of native) h.then((x) => x.remove());
    stopMusic();
    document.removeEventListener('visibilitychange', syncMusic);
    window.removeEventListener('beforeunload', save);
    document.removeEventListener('visibilitychange', vis);
    clearInterval(tick);
    clearInterval(askT);
    clearInterval(drift);
    clearTimeout(owedT);
    document.removeEventListener('visibilitychange', visClock);
  };
}

function Splash() {
  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-[#3f9fd8] font-game text-white">
      <div className="text-center">
        <div className="emoji animate-bob text-6xl">🌾</div>
        <div className="mt-3 text-2xl font-bold">Talons Farm</div>
      </div>
    </div>
  );
}

type Mode = 'none' | 'pending' | 'pan' | 'harvest' | 'plant' | 'ghost' | 'pinch';

function FarmCanvas({ onDrawn }: { onDrawn: () => void }) {
  const store = useStore();
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const r = new Renderer(canvas, store);
    r.onFirstDraw = onDrawn;
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

    // Frames a second, sparing the battery and the phone's warmth: 60 while the farm is being
    // played; 30 once nobody has touched it for a while (the farm goes on at an easy pace, and
    // the first touch brings the 60 back), with the battery saver (the game's or the phone's), on
    // a low battery or a warm phone; 20 on a hot one. The Android app tells how warm the phone is
    // and whether its battery saver is on (see MainActivity).
    const IDLE_MS = 10000;
    let touched = performance.now();
    const touch = () => { touched = performance.now(); };
    const TOUCHES = ['pointerdown', 'pointermove', 'keydown', 'wheel'] as const;
    for (const ev of TOUCHES) window.addEventListener(ev, touch, { capture: true, passive: true });
    const power = { thermal: 0, saver: false, low: false };
    const onPower = () => {
      const p = (window as unknown as { __power?: { thermal: number; saver: boolean } }).__power;
      if (p) { power.thermal = p.thermal; power.saver = p.saver; }
    };
    onPower();
    window.addEventListener('farm-power', onPower);
    type Battery = EventTarget & { level: number; charging: boolean };
    let battery: Battery | null = null;
    const onBattery = () => { if (battery) power.low = !battery.charging && battery.level <= 0.2; };
    (navigator as unknown as { getBattery?: () => Promise<Battery> }).getBattery?.().then((b) => {
      battery = b;
      onBattery();
      b.addEventListener('levelchange', onBattery);
      b.addEventListener('chargingchange', onBattery);
    }).catch(() => { /* no battery to tell */ });
    const fps = () => {
      if (power.thermal >= 3) return 20;
      if (store.s.settings.saver || power.saver || power.low || power.thermal >= 2) return 30;
      return performance.now() - touched > IDLE_MS ? 30 : 60;
    };

    let raf = 0;
    // at most 60 frames a second (fewer to spare the battery, above): a 120 Hz phone would
    // otherwise draw twice as often, for twice the heat and battery, with nothing more to see
    // A screen no faster than the cap draws every frame. A faster one keeps to a fixed beat: on a
    // 90 Hz screen that is two drawn of every three (a steady 60), where simply waiting a frame's
    // time after the last one would draw every other (45). After a slow frame the beat moves on
    // instead of rushing to catch up.
    let last = 0, prev = 0, avg = 1000 / 60;
    const loop = (t: number) => {
      raf = requestAnimationFrame(loop);
      // the screen's own frame time, smoothed
      if (prev) avg += (Math.min(100, t - prev) - avg) * 0.05;
      prev = t;
      const gap = 1000 / fps();
      if (avg < gap - 1.5) {
        if (t - last < gap - 4) return;
        last = Math.max(last + gap, t - gap);
      } else last = t;
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
        const pp = plotProgress(hitObj, clockNow());
        if (pp.ready) { store.harvest(hitObj); mode = 'harvest'; return; }
        if (!hitObj.plot?.crop && ui.tool) { store.plant(hitObj, ui.tool.crop); mode = 'plant'; return; }
      }

      mode = 'pending';
      if (hitObj && BUILDING[hitObj.type].kind !== 'obstacle') {
        const target = hitObj;
        // A press held still picks the thing up to move it. A timer that comes late (a long frame
        // held everything up, a slow phone loading a model) may have the finger's moves of that
        // time still waiting their turn: they are let in first (twice at most), so a drag begun
        // then is not taken for a long press.
        const arm = (due: number, late: number) => {
          lp = setTimeout(() => {
            if (late < 2 && performance.now() - due > 120) { arm(performance.now() + 50, late + 1); return; }
            if (mode === 'pending') {
              longFired = true;
              mode = 'none';
              store.startMove(target.id);
              navigator.vibrate?.(25);
            }
          }, Math.max(0, due - performance.now()));
        };
        arm(performance.now() + 600, 0);
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
          if (mode === 'harvest' && plotProgress(o, clockNow()).ready) store.harvest(o, true);
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
          // tapping a building, pen, field or decoration opens it; the farmer stays where he is.
          // Only a path is ground to walk on.
          if (hitObj.type === 'dirt_path' || hitObj.type === 'stone_path') {
            store.wake();
            r.walkTo(hitObj.x, hitObj.y);
          }
          store.tapObject(hitObj);
        }
        else if (hitSpot === 'fishing') store.tapFishing('lake');
        else if (hitSpot === 'seaFishing') store.tapFishing('sea');
        else if (hitSpot === 'visitor') store.tapVisitor();
        else {
          // tapping empty farmland sends the farmer (and the dog) walking there; land still for
          // sale is no place to walk to
          if (store.isUnlocked(hitTile.x, hitTile.y)) {
            store.wake();
            r.walkTo(hitTile.x, hitTile.y);
          }
          store.tapTile(hitTile.x, hitTile.y);
        }
      }
      if (pts.size === 0) {
        if (mode === 'pan') r.panEnd();
        mode = 'none';
      }
    };

    // the phone took the touch (a back swipe from the screen's edge, the notifications pulled
    // down, a call coming in): it was no tap, so nothing opens and the farmer stays put
    const onCancel = (e: PointerEvent) => {
      if (!pts.has(e.pointerId)) return;
      pts.delete(e.pointerId);
      clearLP();
      if (mode === 'pinch' && pts.size === 1) {
        const [q] = [...pts.values()];
        sx = q.x; sy = q.y;
        r.panStart(q.x, q.y);
        mode = 'pan';
      } else if (pts.size === 0) mode = 'none';
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
    canvas.addEventListener('pointercancel', onCancel);
    canvas.addEventListener('wheel', onWheel, { passive: false });
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    window.addEventListener('keydown', onKey);
    window.addEventListener('farm-zoom', onZoom);
    const onRotate = (ev: Event) => r.rotate((ev as CustomEvent<number>).detail);
    window.addEventListener('farm-rotate', onRotate);
    // off to the background in the middle of a touch: its end may never come, and a finger left
    // behind would make every later touch a pinch
    const onHide = () => {
      if (document.visibilityState !== 'hidden') return;
      pts.clear();
      clearLP();
      mode = 'none';
    };
    document.addEventListener('visibilitychange', onHide);

    return () => {
      cancelAnimationFrame(raf);
      clearLP();
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('pointercancel', onCancel);
      canvas.removeEventListener('wheel', onWheel);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('farm-zoom', onZoom);
      window.removeEventListener('farm-rotate', onRotate);
      document.removeEventListener('visibilitychange', onHide);
      for (const ev of TOUCHES) window.removeEventListener(ev, touch, { capture: true });
      window.removeEventListener('farm-power', onPower);
      battery?.removeEventListener('levelchange', onBattery);
      battery?.removeEventListener('chargingchange', onBattery);
      r.dispose();
    };
  }, [store]);

  return <canvas ref={ref} className="fixed inset-0 block h-full w-full touch-none select-none" aria-label="Farm map" />;
}
