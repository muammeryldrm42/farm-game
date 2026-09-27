'use client';
import Ico from './Ico';
import { BUILDING, CROP, ITEMS } from '@/game/data';
import { TUTORIAL, TUTORIAL_DONE, canFulfill, claimableBadges, claimableQuests, fmtNum, fmtTime, waterInfo, xpNeed } from '@/game/state';
import { useNow, useStore, useVersion } from './ctx';

export function Coin({ className = '' }: { className?: string }) {
  return <span className={`coin ${className}`} aria-label="coins" />;
}

function zoom(detail: number) {
  window.dispatchEvent(new CustomEvent('farm-zoom', { detail }));
}

export default function Hud() {
  const store = useStore();
  useVersion();
  const s = store.s;
  const ui = store.ui;
  const now = Date.now();
  const need = xpNeed(s.level);
  const sheetOpen = ui.selectedId !== null || ui.panel !== null || ui.placing !== null || ui.expand !== null || ui.daily || ui.levelUp !== null;
  const deliverable = s.orders.filter((o) => canFulfill(s, o, now)).length;
  const claimable = claimableQuests(s).length + claimableBadges(s).length;
  const tut = s.tutorial < TUTORIAL.length && s.tutorial !== TUTORIAL_DONE ? TUTORIAL[s.tutorial] : null;

  return (
    <div className="pointer-events-none fixed inset-0 z-10 font-game">
      {/* top bar */}
      <div className="flex items-start justify-between gap-1 p-2 sm:p-3">
        <div className="pointer-events-auto flex items-center">
          <div className="relative z-10 grid h-14 w-14 place-items-center">
            <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full drop-shadow-[0_3px_0_#5d3a1f]">
              <path d="M50 4l13 28 30 3-23 20 7 30-27-16-27 16 7-30L7 35l30-3z" fill="#ffd23a" stroke="#5d3a1f" strokeWidth="6" strokeLinejoin="round" />
            </svg>
            <span className="relative text-lg font-bold text-[#5a3a1a]">{s.level}</span>
          </div>
          <div data-fly="xp" className="-ml-4 w-24 rounded-r-full border-[3px] border-l-0 border-[#5d3a1f] bg-[#fff6df] py-0.5 pl-5 pr-2 shadow-[0_3px_0_#5d3a1f] sm:w-40">
            <div className="h-3 overflow-hidden rounded-full bg-[#e2cc9c]">
              <div className="h-full rounded-full bg-gradient-to-r from-[#57c3f0] to-[#2f8fd0] transition-all" style={{ width: `${Math.min(100, (s.xp / need) * 100)}%` }} />
            </div>
            <div className="whitespace-nowrap text-center text-[10px] font-bold leading-4 text-[#5a3a1a] sm:text-[11px]">
              {s.xp} / {need} XP
            </div>
          </div>
        </div>

        <div className="pointer-events-auto flex items-center gap-1.5 text-sm sm:gap-2 sm:text-base">
          <div className="pill" data-fly="coins">
            <Coin className="text-xl sm:text-2xl" />
            <span className="min-w-[2rem] text-right">{fmtNum(s.coins)}</span>
          </div>
          <WaterPill />
          <div className="pill">
            <span className="emoji text-lg sm:text-xl">💎</span>
            <span className="min-w-[1rem] text-right">{fmtNum(s.gems)}</span>
          </div>
          <button className="btn btn-wood h-9 w-9 shrink-0 rounded-full p-0 sm:h-10 sm:w-10" onClick={() => store.openPanel('settings')} aria-label="Settings">
            <span className="emoji text-lg">⚙️</span>
          </button>
        </div>
      </div>

      {/* tutorial coach */}
      {tut && !ui.placing && (
        <div className="absolute inset-x-0 top-16 flex justify-center px-3 sm:top-20">
        <div className="pointer-events-auto flex w-full max-w-md animate-pop items-center gap-3 rounded-2xl border-[3px] border-[#5d3a1f] bg-[#fff6df] px-3 py-2 text-[#5a3a1a] shadow-[0_4px_0_#5d3a1f]">
          <span className="emoji animate-bob text-3xl"><Ico i={tut.icon} /></span>
          <div className="min-w-0 flex-1">
            <div className="text-[10px] font-bold uppercase tracking-wide text-[#a8733f]">
              Step {s.tutorial + 1} of {TUTORIAL.length}
            </div>
            <div className="text-sm font-bold leading-tight">{tut.text}</div>
          </div>
          <button className="shrink-0 text-xs font-bold text-[#a8733f] underline" onClick={() => store.skipTutorial()}>
            Skip
          </button>
        </div>
        </div>
      )}

      {/* toasts */}
      <div className={`absolute left-1/2 flex w-[92%] max-w-sm -translate-x-1/2 flex-col items-center gap-2 ${tut ? "top-36" : "top-20"}`}>
        {store.toasts.map((t) => (
          <div
            key={t.id}
            className={`animate-pop rounded-2xl border-[3px] px-4 py-2 text-center text-sm font-bold shadow-lg ${
              t.tone === 'bad' ? 'border-[#9c3020] bg-[#ffe3dc] text-[#8a2a18]' : t.tone === 'good' ? 'border-[#3a7d1a] bg-[#e6f8d8] text-[#2d5e14]' : 'border-[#5d3a1f] bg-[#fff6df] text-[#5a3a1a]'
            }`}
          >
            {t.text}
          </div>
        ))}
      </div>

      {/* planting tool banner */}
      {ui.tool && !ui.placing && (
        <div className="pointer-events-auto absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-3 rounded-3xl border-4 border-[#8a5a2b] bg-[#fff6df] px-4 py-2 text-[#5a3a1a] shadow-[0_6px_0_#5d3a1f]">
          <span className="emoji text-3xl"><Ico i={ITEMS[ui.tool.crop].icon} /></span>
          <div className="leading-tight">
            <div className="font-bold">Planting {ITEMS[ui.tool.crop].name}</div>
            <div className="flex items-center gap-1 text-xs">
              {(s.inv[ui.tool.crop] ?? 0) > 0 ? (
                <>You have {s.inv[ui.tool.crop]}. Drag over empty fields.</>
              ) : (
                <>
                  Seeds cost {CROP[ui.tool.crop].seedCost} <Coin />
                </>
              )}
            </div>
          </div>
          <button className="btn btn-green" onClick={() => store.setTool(null)}>
            Done
          </button>
        </div>
      )}

      {/* placing banner */}
      {ui.placing && <PlacingBar />}

      {/* zoom controls */}
      {!sheetOpen && !ui.tool && (
        <div className="pointer-events-auto absolute bottom-24 left-3 flex flex-col gap-2 sm:bottom-4">
          <button className="btn btn-ghost h-11 w-11 rounded-full p-0 text-2xl" onClick={() => zoom(1)} aria-label="Zoom in">
            +
          </button>
          <button className="btn btn-ghost h-11 w-11 rounded-full p-0 text-2xl" onClick={() => zoom(-1)} aria-label="Zoom out">
            −
          </button>
          <button className="btn btn-ghost h-11 w-11 rounded-full p-0" onClick={() => window.dispatchEvent(new CustomEvent('farm-rotate', { detail: 1 }))} aria-label="Rotate view">
            <span className="emoji text-lg">🔄</span>
          </button>
          <button className="btn btn-ghost h-11 w-11 rounded-full p-0" onClick={() => zoom(0)} aria-label="Center farm">
            <span className="emoji text-lg">🏡</span>
          </button>
        </div>
      )}

      {/* main buttons */}
      {!sheetOpen && !ui.tool && (
        <div className="pointer-events-auto absolute bottom-4 right-2 flex items-end gap-1.5 sm:right-3 sm:gap-2">
          {store.canDaily() && (
            <HudBtn
              icon="🎁"
              label="Gift"
              onClick={() => {
                store.ui.daily = true;
                store.sound('click');
                store.emit(false);
              }}
              pulse
              badge={1}
            />
          )}
          <HudBtn icon="🏆" label="Goals" onClick={() => store.openPanel('quests')} badge={claimable} />
          <HudBtn icon="📋" label="Orders" onClick={() => store.openPanel('orders')} badge={deliverable} glow={s.tutorial === 2} />
          <HudBtn icon="📦" label="Storage" onClick={() => store.openPanel('storage')} fly="storage" />
          <button
            className={`btn btn-yellow ${s.tutorial === 3 ? 'ring-4 ring-white animate-bob' : ''} h-16 w-16 flex-col sm:h-[4.5rem] sm:w-[4.5rem] rounded-3xl border-[3px] border-[#5d3a1f] p-0`}
            onClick={() => store.openPanel('shop')}
            aria-label="Shop"
            data-fly-shop=""
          >
            <span className="emoji text-3xl">🛒</span>
            <span className="text-xs font-bold">Shop</span>
          </button>
        </div>
      )}
    </div>
  );
}

// the watering can: charges left; tap for when the next one comes
function WaterPill() {
  const store = useStore();
  const now = useNow(1000);
  const wi = waterInfo(store.s, now);
  const tip = wi.n < wi.max ? `Watering can ${wi.n}/${wi.max}, next refill in ${fmtTime(wi.nextIn)}` : 'The watering can is full. Tap a growing field to water it.';
  return (
    <button className="pill" title={tip} aria-label={tip} onClick={() => store.toast(tip)}>
      <span className="emoji text-lg sm:text-xl">💧</span>
      <span className="min-w-[1.5rem] text-right">{wi.n}/{wi.max}</span>
    </button>
  );
}

function HudBtn({ icon, label, onClick, badge = 0, pulse = false, glow = false, fly }: { icon: string; label: string; onClick: () => void; badge?: number; pulse?: boolean; glow?: boolean; fly?: string }) {
  return (
    <button
      data-fly={fly}
      className={`btn btn-ghost relative h-12 w-12 flex-col sm:h-14 sm:w-14 rounded-2xl border-[3px] border-[#5d3a1f] p-0 ${pulse || glow ? 'animate-bob' : ''} ${glow ? 'ring-4 ring-white' : ''}`}
      onClick={onClick}
      aria-label={label}
    >
      <span className="emoji text-xl sm:text-2xl"><Ico i={icon} /></span>
      <span className="text-[9px] sm:text-[10px] font-bold leading-3">{label}</span>
      {badge > 0 && <span className="badge">{badge}</span>}
    </button>
  );
}

function PlacingBar() {
  const store = useStore();
  const p = store.ui.placing!;
  const d = BUILDING[p.type];
  const ok = store.canPlace(p.type, p.x, p.y, p.moveId);
  const moving = p.moveId !== undefined;
  const cost = store.costOf(d);
  return (
    <div className="pointer-events-auto absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-3 rounded-3xl border-4 border-[#8a5a2b] bg-[#fff6df] px-3 py-2 text-[#5a3a1a] shadow-[0_6px_0_#5d3a1f]">
      <button className="btn btn-red h-12 w-12 rounded-full p-0 text-2xl" onClick={() => store.cancelPlace()} aria-label="Cancel">
        ✕
      </button>
      <div className="min-w-[8rem] text-center leading-tight">
        <div className="font-bold">
          {moving ? 'Move' : 'Place'} {d.name}
        </div>
        <div className="flex items-center justify-center gap-1 text-xs">
          {moving ? 'Drag to a free spot' : <>Cost {cost} <Coin /> · drag to move</>}
        </div>
        {!ok && <div className="text-xs font-bold text-[#c0392b]">Spot is blocked</div>}
      </div>
      <button className="btn btn-green h-12 w-12 rounded-full p-0 text-2xl" disabled={!ok} onClick={() => store.confirmPlace()} aria-label="Confirm">
        ✓
      </button>
    </div>
  );
}
