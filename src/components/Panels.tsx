'use client';
import Ico from './Ico';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { BUILDING, BUILDINGS, CROPS, ITEMS, ITEM_LIST, RECIPES, unlocksAt, type BuildingDef } from '@/game/data';
import {
  ACHIEVEMENTS,
  BADGE_GEMS,
  MAX_SLOTS,
  activeQuests,
  boatState,
  FISHING,
  fishingInfo,
  claimableBadges,
  stallValue,
  treeInfo,
  feedHint,
  horseBonus,
  animalReady,
  canFulfill,
  chunkState,
  dailyReward,
  expandInfo,
  fmtNum,
  fmtTime,
  gemCost,
  penInfo,
  plotProgress,
  prodInfo,
  slotCost,
  storageCap,
  storageUsed,
  todayKey,
  upgradeCost,
  upgradeStep,
  NAP_MS,
  restBonus,
  waterInfo,
  grazePhase,
  GRAZE,
  storyReward,
  type FarmObject,
  PET,
  PET_PAT_MS,
  PET_SEARCH_MS,
  petFed,
  petGift,
  petHearts,
  petHelp,
  claimableAlbum,
  albumSetDone,
} from '@/game/state';
import { CAST, LAST_CHAPTER, chapterAt, taskProgress, type Chapter } from '@/game/story';
import { ALBUM } from '@/game/album';
import { getQuality, setQuality, type Quality } from '@/game/quality';
import { Coin } from './Hud';
import { useStore, useVersion } from './ctx';
import { LANG_IDS, getLang, setLang, t, type Lang } from '@/game/i18n';
import LANG_NAMES from '@/locales/names.json';

// ------------------------------------------------------------------ primitives

function Modal({ title, icon, onClose, children, wide = false }: { title: string; icon?: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  return (
    <div className="pointer-events-auto fixed inset-0 z-30 flex items-center justify-center bg-black/40 p-3" onPointerDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`panel flex max-h-[88vh] w-full animate-pop flex-col ${wide ? 'max-w-3xl' : 'max-w-md'}`}>
        <div className="relative flex items-center justify-center rounded-t-[1.2rem] bg-[#a8733f] px-12 py-2.5 text-white">
          {icon && <span className="emoji mr-2 text-2xl"><Ico i={icon} /></span>}
          <h2 className="text-xl font-bold tracking-wide" style={{ textShadow: '0 2px 0 #5d3a1f' }}>
            {title}
          </h2>
          <button className="btn btn-red absolute right-2 top-1.5 h-9 w-9 rounded-full p-0 text-lg" onClick={onClose} aria-label={t('Close')}>
            ✕
          </button>
        </div>
        <div className="scroll-soft flex-1 p-3 sm:p-4">{children}</div>
      </div>
    </div>
  );
}

function Sheet({ title, icon, pic, sub, onClose, children }: { title: string; icon: string; pic?: string; sub?: ReactNode; onClose: () => void; children: ReactNode }) {
  return (
    <div className="pointer-events-auto fixed inset-x-0 bottom-0 z-20 flex justify-center p-2 sm:p-3">
      <div className="panel w-full max-w-2xl animate-pop">
        <div className="flex items-center gap-3 border-b-2 border-[#e2cc9c] px-4 py-2">
          <span className="emoji text-3xl"><Ico i={icon} id={pic} /></span>
          <div className="min-w-0 flex-1 leading-tight">
            <div className="truncate text-lg font-bold">{title}</div>
            {sub && <div className="text-xs text-[#8a6a44]">{sub}</div>}
          </div>
          <button className="btn btn-red h-9 w-9 rounded-full p-0 text-lg" onClick={onClose} aria-label={t('Close')}>
            ✕
          </button>
        </div>
        <div className="scroll-soft max-h-[46vh] p-3">{children}</div>
      </div>
    </div>
  );
}

// Whether a story task is pointing the player at this card (for a minute after the tap), and a
// ref that scrolls the card into view the first time.
function useGuide(id: string) {
  const store = useStore();
  const ref = useRef<HTMLElement | null>(null);
  const g = store.ui.guide;
  const on = !!g && g.id === id && Date.now() - g.at < 60e3;
  useEffect(() => {
    if (on) ref.current?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }, [on]);
  return { on, ref };
}
function RecipeGuide({ id, children }: { id: string; children: (g: ReturnType<typeof useGuide>) => ReactNode }) {
  return <>{children(useGuide(id))}</>;
}
const GUIDE_RING = 'ring-4 ring-[#ff8a1f] shadow-[0_0_0_6px_rgba(255,138,31,0.25)]';
function GuideMark() {
  return <span className="emoji pointer-events-none absolute -top-3 left-1/2 z-10 -translate-x-1/2 animate-bob text-2xl drop-shadow">👇</span>;
}

function Bar({ p, color = '#5cb82e' }: { p: number; color?: string }) {
  return (
    <div className="h-3 w-full overflow-hidden rounded-full bg-[#e2cc9c]">
      <div className="h-full rounded-full transition-all" style={{ width: `${Math.max(0, Math.min(1, p)) * 100}%`, background: color }} />
    </div>
  );
}

function Gems({ n }: { n: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      <span className="emoji">💎</span>
      {n}
    </span>
  );
}

function Coins({ n }: { n: number }) {
  return (
    <span className="inline-flex items-center gap-1">
      <Coin />
      {fmtNum(n)}
    </span>
  );
}

function Lock({ level }: { level: number }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[#5a3a1a] px-2 py-0.5 text-[11px] font-bold text-white">
      <span className="emoji text-[10px]">🔒</span>{t('Lv {n}', { n: level })}
    </span>
  );
}

// ------------------------------------------------------------------ root

export default function Panels() {
  const store = useStore();
  useVersion();
  const ui = store.ui;
  const sel = store.obj(ui.selectedId);

  return (
    <>
      {sel && !ui.panel && !ui.placing && <ObjectSheet o={sel} />}
      {ui.panel === 'shop' && <ShopModal />}
      {ui.panel === 'orders' && <OrdersModal />}
      {ui.panel === 'storage' && <StorageModal />}
      {ui.panel === 'quests' && <QuestsModal />}
      {ui.panel === 'settings' && <SettingsModal />}
      {ui.panel === 'stall' && <StallModal />}
      {ui.panel === 'boat' && <BoatModal />}
      {ui.panel === 'fishing' && <FishingModal />}
      {ui.panel === 'home' && <HomeModal />}
      {ui.panel === 'pet' && <PetModal key={ui.pet} />}
      {ui.napping && <SleepOverlay />}
      {ui.expand && <ExpandModal />}
      {ui.daily && ui.levelUp === null && <DailyModal />}
      {ui.levelUp !== null && <LevelUpModal level={ui.levelUp} />}
      {ui.story && ui.levelUp === null && !ui.daily && <StoryDialog />}
    </>
  );
}

// ------------------------------------------------------------------ object sheets

function ObjectSheet({ o }: { o: FarmObject }) {
  const d = BUILDING[o.type];
  switch (d.kind) {
    case 'plot':
      return <PlotSheet o={o} />;
    case 'production':
      return <ProductionSheet o={o} />;
    case 'pen':
      return <PenSheet o={o} />;
    case 'obstacle':
      return <ObstacleSheet o={o} />;
    case 'tree':
      return <TreeSheet o={o} />;
    default:
      return <DecoSheet o={o} />;
  }
}

function PlotSheet({ o }: { o: FarmObject }) {
  const store = useStore();
  const s = store.s;
  const pp = plotProgress(o, Date.now());
  const close = () => store.select(null);

  if (pp.crop) {
    const it = ITEMS[pp.crop];
    return (
      <Sheet title={t(it.name)} icon={it.icon} sub={pp.ready ? t('Ready to harvest') : t('Growing')} onClose={close}>
        {pp.ready ? (
          <div className="flex flex-col items-center gap-3 py-2">
            <button className="btn btn-green px-8 py-3 text-lg" onClick={() => { store.harvest(o); store.select(null); }}>
              {t('Harvest +2')} <Ico i={it.icon} />
            </button>
            <p className="text-center text-xs text-[#8a6a44]">{t('Tip: press and drag across ready fields to harvest many at once.')}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <Bar p={pp.p} />
              <span className="w-20 shrink-0 text-right font-bold">{fmtTime(pp.remaining)}</span>
            </div>
            <WaterRow o={o} />
            <div className="flex justify-center">
              <button className="btn btn-blue" onClick={() => store.speedPlot(o)} disabled={s.gems < gemCost(pp.remaining)}>
                {t('Finish now')} <Gems n={gemCost(pp.remaining)} />
              </button>
            </div>
          </div>
        )}
      </Sheet>
    );
  }

  return (
    <Sheet title={t('Empty Field')} icon="🟫" sub={t('Pick a seed, then tap or drag over empty fields')} onClose={close}>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
        {CROPS.map((c) => {
          const it = ITEMS[c.id];
          const locked = s.level < c.level;
          const have = s.inv[c.id] ?? 0;
          return (
            <button
              key={c.id}
              disabled={locked}
              className="card relative flex flex-col items-center gap-0.5 p-2 transition active:scale-95 disabled:opacity-60"
              onClick={() => {
                if (store.plant(o, c.id)) {
                  store.ui.selectedId = null;
                  store.setTool({ kind: 'plant', crop: c.id });
                }
              }}
            >
              <span className={`emoji text-3xl ${locked ? 'grayscale' : ''}`}><Ico i={it.icon} /></span>
              <span className="text-xs font-bold">{t(it.name)}</span>
              {locked ? (
                <Lock level={c.level} />
              ) : (
                <span className="text-[11px] text-[#8a6a44]">
                  {have > 0 ? t('Have {n}', { n: have }) : <span className="inline-flex items-center gap-1">{c.seedCost} <Coin /></span>} · {fmtTime(c.time * 1000)}
                </span>
              )}
            </button>
          );
        })}
      </div>
      <ObjectActions o={o} />
    </Sheet>
  );
}

// Move, Turn and Sell for anything on the farm. Selling asks once more before it happens.
function ObjectActions({ o, move = true }: { o: FarmObject; move?: boolean }) {
  const store = useStore();
  const d = BUILDING[o.type];
  const [sure, setSure] = useState(false);
  useEffect(() => {
    if (!sure) return;
    const tm = setTimeout(() => setSure(false), 6000);
    return () => clearTimeout(tm);
  }, [sure]);
  const value = store.sellValue(o);
  const plot = d.kind === 'plot';
  return (
    <div className="mt-3 flex flex-wrap justify-center gap-2">
      {move && (
        <button className="btn btn-wood" onClick={() => store.startMove(o.id)}>
          {t('Move')}
        </button>
      )}
      <button className="btn btn-wood" onClick={() => store.rotateObject(o.id)} title={t('Turn it round')}>
        <span className="emoji">🔄</span> {t('Rotate')}
      </button>
      {d.w !== d.h && (
        <button className="btn btn-wood" onClick={() => store.turnSideways(o.id)} title={t('Stand it the other way: wide becomes long')}>
          <span className="emoji">↔️</span> {t('Sideways')}
        </button>
      )}
      {store.canSell(o) && (
        sure ? (
          <button className="btn btn-red" onClick={() => { setSure(false); store.removeObject(o.id); }}>
            {plot ? t('Yes, remove it') : <>{t('Yes, sell for')} <Coins n={value} /></>}
          </button>
        ) : (
          <button className="btn btn-ghost" onClick={() => setSure(true)}>
            {plot ? t('Remove field') : <>{t('Sell for')} <Coins n={value} /></>}
          </button>
        )
      )}
    </div>
  );
}

// the Move, Rotate and Sell row for the building whose panel is open (silo, barn, home, stall...)
function PanelObjectActions() {
  const store = useStore();
  const id = store.ui.panelObj;
  const o = id !== undefined ? store.obj(id) : undefined;
  if (!o) return null;
  return <ObjectActions o={o} />;
}

function ProductionSheet({ o }: { o: FarmObject }) {
  const store = useStore();
  const s = store.s;
  const d = BUILDING[o.type];
  const now = Date.now();
  const info = prodInfo(o, now);
  const q = o.prod?.queue ?? [];
  const slots = o.prod?.slots ?? 3;
  const recipes = RECIPES.filter((r) => r.building === o.type);

  return (
    <Sheet
      title={t(d.name)}
      icon={d.icon}
      sub={info.current ? t('Making {item}, {time} left', { item: t(ITEMS[info.current.recipe].name), time: fmtTime(info.current.endsAt - now) }) : q.length ? t('Goods are ready') : t('Idle. Pick something to make.')}
      onClose={() => store.select(null)}
    >
      {/* queue */}
      <div className="flex flex-wrap items-center gap-2">
        {Array.from({ length: slots }).map((_, i) => {
          const e = q[i];
          const done = e && e.endsAt <= now;
          const cur = e && info.current === e;
          return (
            <div
              key={i}
              className={`relative grid h-14 w-14 place-items-center rounded-2xl border-2 ${done ? 'border-[#3a7d1a] bg-[#e6f8d8]' : cur ? 'border-[#f5b92b] bg-[#fff1c4]' : 'border-dashed border-[#cdb482] bg-[#fffaf0]'}`}
            >
              {e && <span className="emoji text-2xl"><Ico i={ITEMS[e.recipe].icon} /></span>}
              {done && <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-[#5cb82e] text-xs font-bold text-white">✓</span>}
              {cur && (
                <div className="absolute inset-x-1 bottom-1">
                  <div className="h-1.5 overflow-hidden rounded-full bg-[#e2cc9c]">
                    <div className="h-full bg-[#f5b92b]" style={{ width: `${info.progress * 100}%` }} />
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {slots < MAX_SLOTS && (
          <button className="btn btn-ghost h-14 w-14 flex-col rounded-2xl p-0 text-xs" onClick={() => store.buySlot(o)} disabled={s.gems < slotCost(slots)}>
            <span className="text-xl leading-none">+</span>
            <Gems n={slotCost(slots)} />
          </button>
        )}
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        {info.done.length > 0 && (
          <button className="btn btn-green" onClick={() => store.collectProd(o)}>
            {t('Collect {n}', { n: info.done.length })}
          </button>
        )}
        {info.current && (
          <button className="btn btn-blue" onClick={() => store.speedProd(o)} disabled={s.gems < gemCost(info.current.endsAt - now)}>
            {t('Finish now')} <Gems n={gemCost(info.current.endsAt - now)} />
          </button>
        )}
      </div>
      <ObjectActions o={o} />

      {/* recipes */}
      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {recipes.map((r) => {
          const it = ITEMS[r.id];
          const locked = s.level < r.level;
          const ok = store.hasItems(r.inputs);
          return (
            <RecipeGuide key={r.id} id={r.id}>
            {(guide) => (
            <button
              ref={(el) => { guide.ref.current = el; }}
              disabled={locked}
              onClick={() => store.queueRecipe(o, r.id)}
              className={`card relative flex items-center gap-3 p-2 text-left transition active:scale-[0.98] disabled:opacity-60 ${guide.on ? GUIDE_RING : ok && !locked ? 'ring-2 ring-[#5cb82e]' : ''}`}
            >
              {guide.on && <GuideMark />}
              <span className={`emoji text-3xl ${locked ? 'grayscale' : ''}`}><Ico i={it.icon} /></span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 font-bold">
                  {t(it.name)}
                  {r.qty > 1 && <span className="text-xs text-[#8a6a44]">x{r.qty}</span>}
                  {locked && <Lock level={r.level} />}
                </div>
                <div className="flex flex-wrap gap-x-2 text-xs">
                  {Object.entries(r.inputs).map(([id, n]) => {
                    const have = s.inv[id] ?? 0;
                    return (
                      <span key={id} className={have >= n ? 'text-[#2d5e14]' : 'text-[#c0392b]'}>
                        <span className="emoji"><Ico i={ITEMS[id].icon} /></span> {have}/{n}
                      </span>
                    );
                  })}
                </div>
              </div>
              <div className="shrink-0 text-right text-[11px] text-[#8a6a44]">
                <div>{fmtTime(r.time * 1000)}</div>
                <div>+{r.xp} XP</div>
              </div>
            </button>
            )}
            </RecipeGuide>
          );
        })}
      </div>
    </Sheet>
  );
}

function PenSheet({ o }: { o: FarmObject }) {
  const store = useStore();
  const s = store.s;
  const d = BUILDING[o.type];
  const now = Date.now();
  const pi = penInfo(o, now);
  const an = pi.animal;
  const feedHave = s.inv[an.feed] ?? 0;
  const cap = d.capacity ?? 0;
  const locked = s.level < an.level;
  let maxRem = 0;
  for (const a of o.pen?.animals ?? []) if (a.fedAt !== null && !animalReady(a, an.time, now)) maxRem = Math.max(maxRem, a.fedAt + an.time * 1000 - now);

  return (
    <Sheet
      title={t(d.name)}
      icon={d.icon}
      sub={t('{n}/{cap} {animal} · makes {item} every {time}', { n: pi.total, cap, animal: t(an.name), item: t(ITEMS[an.product].name), time: fmtTime(an.time * 1000) })}
      onClose={() => store.select(null)}
    >
      {pi.total === 0 ? (
        <p className="py-2 text-center text-sm text-[#8a6a44]">{t('No animals yet. Buy your first {animal} below.', { animal: t(an.name) })}</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {(o.pen?.animals ?? []).map((a) => {
            const ready = animalReady(a, an.time, now);
            const p = a.fedAt === null ? 0 : Math.min(1, (now - a.fedAt) / (an.time * 1000));
            return (
              <div key={a.id} className="card flex w-16 flex-col items-center gap-1 p-1.5">
                <span className="emoji text-2xl"><Ico i={an.icon} /></span>
                {a.graze ? (
                  <span className="text-center text-[10px] font-bold leading-3 text-[#2d7a2a]">
                    {(() => {
                      const bee = an.id === 'bee';
                      const ph = grazePhase(a, now, bee).phase;
                      const g = a.graze!;
                      // back home (and full) at: the end of the trip, or a walk after being called
                      const home = g.back !== undefined ? g.back + GRAZE.walkMs : g.at + 2 * GRAZE.walkMs + (bee ? GRAZE.beeEatMs : GRAZE.eatMs);
                      const label = t(ph === 'leaving' ? (bee ? 'Flying out' : 'Heading out') : ph === 'eating' ? (bee ? 'On flowers' : 'Grazing') : 'Coming home');
                      return <>{label}<br /><span className="font-semibold text-[#8a6a44]">{fmtTime(home - now)}</span></>;
                    })()}
                  </span>
                ) : ready ? (
                  <span className="emoji text-lg"><Ico i={ITEMS[an.product].icon} /></span>
                ) : a.fedAt === null ? (
                  <span className="text-[10px] font-bold text-[#c0392b]">{t('Hungry')}</span>
                ) : (
                  <>
                    <Bar p={p} color="#f5b92b" />
                    {/* how long until this one has its product ready */}
                    <span className="text-[10px] font-bold leading-3 text-[#8a6a44]">{fmtTime(a.fedAt + an.time * 1000 - now)}</span>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {pi.ready > 0 && (
          <button className="btn btn-green" onClick={() => store.collectPen(o)}>
            {t('Collect {n}', { n: pi.ready })} <Ico i={ITEMS[an.product].icon} />
          </button>
        )}
        {pi.hungry > 0 && (
          <button className="btn btn-yellow" onClick={() => store.feedPen(o)} disabled={feedHave === 0}>
            {t('Feed')} {Math.min(pi.hungry, feedHave) || ''} <span className="emoji"><Ico i={ITEMS[an.feed].icon} /></span>
          </button>
        )}
        {pi.hungry > 0 && (
          <button className="btn btn-green" onClick={() => store.openGate(o)} title={an.id === 'bee' ? t('Let the bees fly to the flowers') : t('Open the gate: hungry animals walk out to graze and come back full')}>
            <span className="emoji">{an.id === 'bee' ? '🌼' : '🚪'}</span> {an.id === 'bee' ? t('Send to flowers') : t('Open gate')}
          </button>
        )}
        {(o.pen?.animals ?? []).some((a) => { const ph = grazePhase(a, now, an.id === 'bee').phase; return ph === 'leaving' || ph === 'eating'; }) && (
          <button className="btn btn-wood" onClick={() => store.recallPen(o)}>
            <span className="emoji">📣</span> {t('Call back')}
          </button>
        )}
        {pi.fed > 0 && (
          <button className="btn btn-blue" onClick={() => store.speedPen(o)} disabled={s.gems < gemCost(maxRem)}>
            {t('Finish now')} <Gems n={gemCost(maxRem)} />
          </button>
        )}
        {pi.total < cap && (
          <button className="btn btn-wood" onClick={() => store.buyAnimal(o)} disabled={locked || s.coins < an.cost}>
            {t('Buy')} <Ico i={an.icon} /> <Coins n={an.cost} />
          </button>
        )}
      </div>
      <ObjectActions o={o} />
      <p className="mt-2 text-xs text-[#8a6a44]">
        {t('{item} in storage:', { item: t(ITEMS[an.feed].name) })} <b>{feedHave}</b>. {feedHint(an.feed)}{' '}
        {an.id === 'bee' ? t('Or send the bees to the flowers: they come back full of nectar.') : t('Or open the gate: they graze on the grass and walk back full.')}
      </p>
    </Sheet>
  );
}

function DecoSheet({ o }: { o: FarmObject }) {
  const store = useStore();
  const d = BUILDING[o.type];
  return (
    <Sheet title={t(d.name)} icon={d.icon} pic={d.id} sub={t(d.desc)} onClose={() => store.select(null)}>
      <ObjectActions o={o} />
    </Sheet>
  );
}

function ObstacleSheet({ o }: { o: FarmObject }) {
  const store = useStore();
  const d = BUILDING[o.type];
  const cost = d.clearCost ?? 0;
  return (
    <Sheet title={t(d.name)} icon={d.icon} sub={`${t(d.desc)} ${t('Gives {xp} XP and sometimes a gem.', { xp: d.xp })}`} onClose={() => store.select(null)}>
      <div className="flex justify-center">
        <button className="btn btn-green px-6" onClick={() => store.clearObstacle(o.id)} disabled={store.s.coins < cost}>
          {t('Clear for')} <Coins n={cost} />
        </button>
      </div>
    </Sheet>
  );
}


// ------------------------------------------------------------------ fruit trees

function TreeSheet({ o }: { o: FarmObject }) {
  const store = useStore();
  const s = store.s;
  const d = BUILDING[o.type];
  const ti = treeInfo(o, Date.now());
  const it = ITEMS[ti.fruit];
  return (
    <Sheet title={t(d.name)} icon={d.icon} sub={ti.ready ? t('Ready: 2 × {item}', { item: t(it.name) }) : t('Growing: {item}', { item: t(it.name) })} onClose={() => store.select(null)}>
      {ti.ready ? (
        <div className="flex justify-center py-1">
          <button className="btn btn-green px-8 py-3 text-lg" onClick={() => store.collectTree(o)}>
            {t('Pick +2')} <Ico i={it.icon} />
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <Bar p={ti.p} />
            <span className="w-20 shrink-0 text-right font-bold">{fmtTime(ti.remaining)}</span>
          </div>
          <div className="flex justify-center">
            <button className="btn btn-blue" onClick={() => store.speedTree(o)} disabled={s.gems < gemCost(ti.remaining)}>
              {t('Finish now')} <Gems n={gemCost(ti.remaining)} />
            </button>
          </div>
        </div>
      )}
      <ObjectActions o={o} />
    </Sheet>
  );
}

// ------------------------------------------------------------------ roadside stall

function StallModal() {
  const store = useStore();
  const s = store.s;
  const now = Date.now();
  const [pick, setPick] = useState<number | null>(null);
  const [item, setItem] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [price, setPrice] = useState(0);

  const choose = (id: string) => {
    const q = Math.min(s.inv[id] ?? 0, 5);
    setItem(id);
    setQty(q);
    setPrice(Math.round(stallValue(id, q) * 1.3));
  };
  const reset = () => { setPick(null); setItem(null); };
  const owned = ITEM_LIST.filter((i) => (s.inv[i.id] ?? 0) > 0);

  if (pick !== null) {
    const base = item ? stallValue(item, qty) : 0;
    const have = item ? s.inv[item] ?? 0 : 0;
    const setQ = (q: number) => {
      const nq = Math.max(1, Math.min(Math.min(10, have), q));
      setQty(nq);
      if (item) setPrice(Math.round(stallValue(item, nq) * 1.3));
    };
    const ratio = base ? price / base : 1;
    const wait = t(ratio <= 1.05 ? 'Sells fast' : ratio <= 1.5 ? 'Sells in a few minutes' : 'Takes a while to sell');
    return (
      <Modal title={t('List an item')} icon="🏪" onClose={() => store.openPanel(null)} wide>
        {owned.length === 0 ? (
          <p className="py-8 text-center text-sm text-[#8a6a44]">{t('Your storage is empty. Harvest or make something to sell first.')}</p>
        ) : (
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8">
            {owned.map((i) => (
              <button key={i.id} onClick={() => choose(i.id)} className={`card flex flex-col items-center p-1.5 ${item === i.id ? 'ring-2 ring-[#f5b92b]' : ''}`}>
                <span className="emoji text-2xl"><Ico i={i.icon} /></span>
                <span className="text-[11px] font-bold">x{s.inv[i.id]}</span>
              </button>
            ))}
          </div>
        )}
        {item && (
          <div className="card mt-3 flex flex-col gap-3 p-3">
            <div className="flex items-center gap-2 font-bold">
              <span className="emoji text-2xl"><Ico i={ITEMS[item].icon} /></span> {t(ITEMS[item].name)}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="w-16 text-sm font-bold">{t('Amount')}</span>
              <button className="btn btn-ghost h-9 w-9 p-0" onClick={() => setQ(qty - 1)}>−</button>
              <span className="w-8 text-center font-bold">{qty}</span>
              <button className="btn btn-ghost h-9 w-9 p-0" onClick={() => setQ(qty + 1)}>+</button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="w-16 text-sm font-bold">{t('Price')}</span>
              <button className="btn btn-ghost h-9 w-9 p-0" onClick={() => setPrice(Math.max(1, price - Math.max(1, Math.round(base * 0.1))))}>−</button>
              <span className="min-w-[4rem] text-center font-bold"><Coins n={price} /></span>
              <button className="btn btn-ghost h-9 w-9 p-0" onClick={() => setPrice(Math.min(base * 2, price + Math.max(1, Math.round(base * 0.1))))}>+</button>
              <button className="btn btn-yellow px-2 py-1 text-xs" onClick={() => setPrice(base * 2)}>{t('Max')}</button>
            </div>
            <div className="text-xs text-[#8a6a44]">
              {t('Storage price is {base} coins. You can ask up to {max}.', { base, max: base * 2 })} {wait}.
            </div>
            <div className="flex gap-2">
              <button className="btn btn-ghost" onClick={reset}>{t('Back')}</button>
              <button
                className="btn btn-green flex-1"
                onClick={() => {
                  store.listItem(pick, item, qty, price);
                  reset();
                }}
              >
                {t('Put on stall')}
              </button>
            </div>
          </div>
        )}
        {!item && (
          <div className="mt-3 flex justify-center">
            <button className="btn btn-ghost" onClick={reset}>{t('Back')}</button>
          </div>
        )}
      </Modal>
    );
  }

  return (
    <Modal title={t('Roadside Stall')} icon="🏪" onClose={() => store.openPanel(null)} wide>
      <p className="mb-3 text-center text-xs text-[#8a6a44]">{t('Villagers passing by buy what you put out. Higher prices take longer to sell.')}</p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {s.stall.map((sl, i) => {
          if (!sl.item) {
            return (
              <button key={i} className="card flex min-h-[9rem] flex-col items-center justify-center gap-1 border-dashed p-3 text-[#8a6a44]" onClick={() => { setPick(i); setItem(null); }}>
                <span className="text-3xl leading-none">+</span>
                <span className="text-sm font-bold">{t('Sell something')}</span>
              </button>
            );
          }
          const sold = sl.soldAt <= now;
          return (
            <div key={i} className={`card flex min-h-[9rem] flex-col items-center gap-1 p-3 ${sold ? 'ring-2 ring-[#5cb82e]' : ''}`}>
              <span className="emoji text-3xl"><Ico i={ITEMS[sl.item].icon} /></span>
              <span className="text-sm font-bold">x{sl.qty} {t(ITEMS[sl.item].name)}</span>
              <span className="text-sm font-bold"><Coins n={sl.price} /></span>
              {sold ? (
                <button className="btn btn-green mt-auto w-full py-1.5" onClick={() => store.collectSale(i)}>{t('Collect')}</button>
              ) : (
                <>
                  <span className="text-[11px] text-[#8a6a44]">{t('Waiting for a buyer')}</span>
                  <button className="btn btn-ghost mt-auto w-full py-1 text-xs" onClick={() => store.cancelListing(i)}>{t('Take back')}</button>
                </>
              )}
            </div>
          );
        })}
      </div>
      <PanelObjectActions />
    </Modal>
  );
}

// ------------------------------------------------------------------ boat

// The farmer's home: the farmhouse, or the manor once it is built. Rest here, or check goals.
function HomeModal() {
  const store = useStore();
  const s = store.s;
  const manor = s.objects.some((o) => o.type === 'manor');
  const close = () => store.openPanel(null);
  return (
    <Modal title={t(manor ? 'Manor' : 'Farmhouse')} icon={manor ? '🏰' : '🏡'} onClose={close}>
      <div className="flex flex-col items-center gap-3 py-2 text-center">
        <span className="emoji animate-bob text-5xl">🛏️</span>
        <p className="font-bold">{t(manor ? 'A grand bedroom with a soft four poster bed.' : 'A cozy bed under the eaves.')}</p>
        <p className="text-sm text-[#8a6a44]">
          {store.canRest()
            ? t('Take a nap of {s} seconds or more to wake up well rested: +{coins} coins and +10 XP, once a day. You can keep farming while the farmer sleeps.', { s: NAP_MS / 1000, coins: restBonus(s.level) })
            : t('You already woke up well rested today. You can still nap as much as you like.')}
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          <button className="btn btn-blue px-6 py-2" onClick={() => store.sleep()}>{t('Go to sleep')}</button>
          <button className="btn btn-wood px-6 py-2" onClick={() => store.openPanel('quests')}>{t('Goals')}</button>
        </div>
      </div>
      <PanelObjectActions />
    </Modal>
  );
}

// While the farmer sleeps a soft night tint falls over the farm and a small card shows the nap.
// Nothing is blocked: the player keeps farming, and only walking the farmer somewhere wakes him.
function SleepOverlay() {
  const store = useStore();
  const [, tick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 500);
    return () => clearInterval(id);
  }, []);
  const home = store.ui.napAt > 0;
  const left = Math.max(0, Math.ceil((store.ui.napAt + NAP_MS - Date.now()) / 1000));
  const rest = store.canRest();
  return (
    <>
      <div className="pointer-events-none fixed inset-0 z-10 bg-[#0b1a3a]/25" />
      <div className="panel pointer-events-auto fixed left-1/2 top-16 z-20 flex -translate-x-1/2 items-center gap-3 px-4 py-2 text-[#5a3a1a]">
        <span className="emoji animate-bob text-2xl">{home ? '😴' : '🚶'}</span>
        <div className="flex flex-col text-left leading-tight">
          <span className="font-bold">{t(home ? 'Sleeping... z Z z' : 'Walking home to bed...')}</span>
          {rest && home && <span className="text-xs">{left > 0 ? t('Well rested in {n}s', { n: left }) : t('Well rested! Wake up for your bonus.')}</span>}
        </div>
        <button className="btn btn-green px-4 py-1 text-sm" onClick={() => store.wake()}>{t('Wake up')}</button>
      </div>
    </>
  );
}

function FishingModal() {
  const store = useStore();
  const s = store.s;
  const now = Date.now();
  const spot = store.ui.fishSpot ?? 'lake';
  const sea = spot === 'sea';
  const fi = fishingInfo(s, now, spot);
  const close = () => store.openPanel(null);
  return (
    <Modal title={t(sea ? 'Sea Fishing' : 'Lake Fishing')} icon="🎣" onClose={close}>
      <div className="flex flex-col items-center gap-3 py-2 text-center">
        <span className="emoji animate-bob text-5xl">{fi.state === 'ready' ? '🐟' : '🌊'}</span>
        {fi.state === 'locked' && (
          <>
            <p className="font-bold">{t(sea ? 'Open a fishing spot on the jetty off the south shore.' : 'Open a fishing spot on the jetty at the lake.')}</p>
            <p className="text-sm text-[#8a6a44]">
              {t(sea
                ? 'Cast a line into the sea and reel in salt water fish: sardines, mackerel and sea bream early on, then tuna, mahi mahi, clownfish, marlin and anglerfish as you level up.'
                : 'Cast a line into the lake and reel in fresh water fish: bluegill, bass, carp and crayfish early on, then pike, walleye, koi, sturgeon and, at level 195, the golden fish.')}
            </p>
            {s.level < FISHING.level ? (
              <Lock level={FISHING.level} />
            ) : (
              <button className="btn btn-green px-8 py-2" disabled={s.coins < FISHING.cost} onClick={() => store.buyFishing(spot)}>
                {t('Open for')} <Coins n={FISHING.cost} />
              </button>
            )}
          </>
        )}
        {fi.state === 'idle' && (
          <>
            <p className="font-bold">{t('The water is calm. Cast your line!')}</p>
            <button className="btn btn-blue px-8 py-2" onClick={() => { store.castLine(spot); close(); }}>{t('Cast line')}</button>
          </>
        )}
        {fi.state === 'waiting' && (
          <>
            <p className="font-bold">{t('Waiting for a bite...')}</p>
            <div className="h-3 w-48 overflow-hidden rounded-full bg-[#e6e0d0]">
              <div className="h-full bg-[#2f8fd0]" style={{ width: `${Math.round(fi.p * 100)}%` }} />
            </div>
            <p className="text-sm text-[#8a6a44]">{t('{time} left', { time: fmtTime(fi.remaining) })}</p>
          </>
        )}
        {fi.state === 'ready' && (
          <button className="btn btn-green px-8 py-2" onClick={() => { store.reelIn(spot); close(); }}>{t('Reel in')}</button>
        )}
      </div>
    </Modal>
  );
}

function BoatModal() {
  const store = useStore();
  const s = store.s;
  const now = Date.now();
  const state = boatState(s, now);
  const b = s.boat;
  const close = () => store.openPanel(null);

  if (state !== 'docked' || !b) {
    return (
      <Modal title={t('Boat Dock')} icon="⛵" onClose={close}>
        <div className="flex flex-col items-center gap-2 py-4 text-center">
          <span className="emoji animate-bob text-5xl">🌊</span>
          <p className="font-bold">{t('The boat is out at sea.')}</p>
          {b && <p className="text-sm text-[#8a6a44]">{t('It comes back in {time}.', { time: fmtTime(b.returnAt - now) })}</p>}
        </div>
      </Modal>
    );
  }
  const all = b.crates.every((c) => c.filled);
  return (
    <Modal title={t('Cargo Boat')} icon="⛵" onClose={close} wide>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-sm">
        <span className="text-[#8a6a44]">{t('Leaves in')} <b>{fmtTime(b.leavesAt - now)}</b></span>
        <span className="flex items-center gap-2 font-bold">
          {t('Full boat bonus:')} <Coins n={b.bonusCoins} /> <Gems n={b.bonusGems} />
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {b.crates.map((c, i) => {
          const have = s.inv[c.item] ?? 0;
          const ok = have >= c.qty;
          return (
            <div key={i} className={`card flex flex-col items-center gap-1 p-3 ${c.filled ? 'bg-[#e6f8d8]' : ok ? 'ring-2 ring-[#5cb82e]' : ''}`}>
              <span className="emoji text-3xl">{c.filled ? '📦' : <Ico i={ITEMS[c.item].icon} />}</span>
              <span className="text-sm font-bold">{t(ITEMS[c.item].name)}</span>
              {c.filled ? (
                <span className="text-sm font-bold text-[#2d5e14]">{t('Packed')}</span>
              ) : (
                <>
                  <span className={`text-xs font-bold ${ok ? 'text-[#2d5e14]' : 'text-[#c0392b]'}`}>{have}/{c.qty}</span>
                  <span className="flex items-center gap-2 text-xs font-bold">
                    <Coins n={c.coins} /> <span className="text-[#2f8fd0]">+{c.xp} XP</span>
                  </span>
                  <button className="btn btn-green mt-1 w-full py-1.5" disabled={!ok} onClick={() => store.fillCrate(i)}>{t('Fill')}</button>
                </>
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-4 flex justify-center">
        <button className="btn btn-yellow px-8 py-3 text-lg" disabled={!all} onClick={() => store.sendBoat()}>
          {t('Send boat')}
        </button>
      </div>
    </Modal>
  );
}

// watering: a pour from the bucket makes the crop grow 30% faster; the bucket fills at a well
function WaterRow({ o }: { o: FarmObject }) {
  const store = useStore();
  const wi = waterInfo(store.s);
  if (o.plot?.watered) {
    return <p className="text-center text-sm font-bold text-[#2f8fd0]"><span className="emoji">💧</span> {t('Watered: growing 30% faster')}</p>;
  }
  return (
    <div className="flex flex-col items-center gap-1">
      <button className="btn btn-blue flex items-center gap-2 px-6 py-2 text-lg" onClick={() => store.waterPlot(o)} disabled={wi.n <= 0} title={t('Water it')}>
        <span className="emoji text-2xl">🪣</span> {t('Water')}
      </button>
      <span className="text-[11px] text-[#8a6a44]">
        {wi.n > 0 ? t('Bucket: {n}/{max} pours', { n: wi.n, max: wi.max }) : wi.wells ? t('The bucket is empty. Tap a well to fill it.') : t('The bucket is empty. Build a well to fill it.')}
      </span>
    </div>
  );
}

// ------------------------------------------------------------------ shop

type ShopTab = 'crops' | 'trees' | 'animals' | 'production' | 'services' | 'decor';
const SHOP_TABS: { id: ShopTab; label: string; icon: string; filter: (d: BuildingDef) => boolean; hint?: string }[] = [
  { id: 'crops', label: 'Fields & Crops', icon: '🌾', filter: (d) => d.kind === 'plot',
    hint: 'Place fields, then tap one to plant. Seeds come from your harvest; with none left, planting costs the seed price.' },
  { id: 'trees', label: 'Fruit Trees', icon: '🌳', filter: (d) => d.kind === 'tree', hint: 'Trees fruit again and again. Tap a ripe tree to pick it.' },
  { id: 'animals', label: 'Animals', icon: '🐔', filter: (d) => d.kind === 'pen', hint: 'Each pen comes with room for its animals. Feed them to collect their goods.' },
  { id: 'production', label: 'Production', icon: '🏭', filter: (d) => d.kind === 'production' || d.kind === 'silo' || d.kind === 'barn', hint: 'Workshops turn crops and animal goods into products for orders. Extra silos and barns add storage room.' },
  { id: 'services', label: 'Home & Trade', icon: '🏰', filter: (d) => d.kind === 'stall' || d.kind === 'dock' || (d.kind === 'house' && d.buyable) },
  { id: 'decor', label: 'Decor', icon: '🌷', filter: (d) => d.kind === 'deco' },
];

function ShopCard({ d }: { d: BuildingDef }) {
  const store = useStore();
  const s = store.s;
  const locked = s.level < d.level;
  const owned = store.countType(d.id);
  const max = store.maxOf(d);
  const full = owned >= max;
  const cost = store.costOf(d);
  const poor = s.coins < cost;
  const guide = useGuide(d.id);
  return (
    <button
      ref={(el) => { guide.ref.current = el; }}
      disabled={locked || full}
      onClick={() => store.startBuy(d.id)}
      className={`card relative flex flex-col items-center gap-1 p-3 text-center transition active:scale-95 disabled:opacity-60 ${guide.on ? GUIDE_RING : ''}`}
    >
      {guide.on && <GuideMark />}
      <span className={`emoji text-4xl ${locked ? 'grayscale' : ''}`}><Ico i={d.icon} id={d.id} /></span>
      <span className="font-bold leading-tight">{t(d.name)}</span>
      <span className="line-clamp-2 min-h-[2rem] text-[11px] leading-4 text-[#8a6a44]">{t(d.desc)}</span>
      {locked ? (
        <Lock level={d.level} />
      ) : (
        <>
          <span className={`text-sm font-bold ${poor ? 'text-[#c0392b]' : ''}`}>
            <Coins n={cost} />
          </span>
          <span className="text-[11px] text-[#8a6a44]">{full ? t('Max owned') : Number.isFinite(max) ? t('Owned {n}/{max}', { n: owned, max }) : t('Owned {n}', { n: owned })}</span>
        </>
      )}
    </button>
  );
}

// the crops you can plant, with grow time and seed price; planting happens on a field
function CropCard({ id }: { id: string }) {
  const store = useStore();
  const cd = CROPS.find((c) => c.id === id)!;
  const it = ITEMS[id];
  const locked = store.s.level < cd.level;
  const have = store.s.inv[id] ?? 0;
  const guide = useGuide(id);
  return (
    <div ref={(el) => { guide.ref.current = el; }} className={`card relative flex flex-col items-center gap-1 p-3 text-center ${locked ? 'opacity-60' : ''} ${guide.on ? GUIDE_RING : ''}`}>
      {guide.on && <GuideMark />}
      <span className={`emoji text-4xl ${locked ? 'grayscale' : ''}`}><Ico i={it.icon} /></span>
      <span className="font-bold leading-tight">{t(it.name)}</span>
      {locked ? (
        <Lock level={cd.level} />
      ) : (
        <>
          <span className="text-[11px] text-[#8a6a44]">⏱ {fmtTime(cd.time * 1000)} · +{cd.xp} XP</span>
          <span className="text-sm font-bold"><Coins n={cd.seedCost} /> <span className="text-[11px] font-normal text-[#8a6a44]">{t('seed')}</span></span>
          <span className="text-[11px] text-[#8a6a44]">{t('In storage: {n}', { n: have })}</span>
        </>
      )}
    </div>
  );
}

function ShopModal() {
  const store = useStore();
  const [tab, setTab] = useState<ShopTab>(() => {
    // opened by a story task: start on the tab that holds what it points at
    const g = store.ui.guide;
    const d = g && Date.now() - g.at < 60e3 ? BUILDING[g.id] : undefined;
    return (d && SHOP_TABS.find((x) => x.filter(d))?.id) || 'crops';
  });
  const st = SHOP_TABS.find((x) => x.id === tab)!;
  const list = BUILDINGS.filter((d) => d.buyable && st.filter(d)).sort((a, b) => a.level - b.level || a.cost - b.cost);
  const crops = [...CROPS].sort((a, b) => a.level - b.level || a.seedCost - b.seedCost);
  return (
    <Modal title={t('Shop')} icon="🛒" onClose={() => store.openPanel(null)} wide>
      <div className="mb-3 flex gap-1.5 overflow-x-auto pb-1">
        {SHOP_TABS.map((x) => (
          <button key={x.id} className={`btn shrink-0 ${tab === x.id ? 'btn-yellow' : 'btn-ghost'}`} onClick={() => setTab(x.id)}>
            <span className="emoji"><Ico i={x.icon} /></span> {t(x.label)}
          </button>
        ))}
      </div>
      {st.hint && <p className="mb-2 text-center text-xs text-[#8a6a44]">{t(st.hint)}</p>}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
        {list.map((d) => <ShopCard key={d.id} d={d} />)}
      </div>
      {tab === 'crops' && (
        <>
          <h3 className="mb-2 mt-4 text-center font-bold text-[#6b4226]">{t('Crops you can grow')}</h3>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
            {crops.map((c) => <CropCard key={c.id} id={c.id} />)}
          </div>
        </>
      )}
    </Modal>
  );
}

// ------------------------------------------------------------------ orders

function OrdersModal() {
  const store = useStore();
  const s = store.s;
  const now = Date.now();
  const bonus = horseBonus(s);
  return (
    <Modal title={t('Order Board')} icon="📋" onClose={() => store.openPanel(null)} wide>
      {bonus > 0 && (
        <p className="mb-2 text-center text-xs font-bold text-[#2d5e14]">
          <span className="emoji">🐎</span> {t('Horse bonus: +{n}% coins on every order', { n: Math.round(bonus * 100) })}
        </p>
      )}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
        {s.orders.map((o) => {
          if (o.readyAt > now) {
            return (
              <div key={o.id} className="card flex min-h-[9rem] flex-col items-center justify-center gap-1 p-3 text-center text-[#8a6a44]">
                <span className="emoji animate-bob text-3xl">🚚</span>
                <span className="text-sm font-bold">{t('New order arriving')}</span>
                <span className="text-sm">{fmtTime(o.readyAt - now)}</span>
              </div>
            );
          }
          const ok = canFulfill(s, o, now);
          return (
            <div key={o.id} className={`card flex flex-col gap-2 p-3 ${ok ? 'ring-2 ring-[#5cb82e]' : ''}`}>
              <div className="flex flex-wrap gap-2">
                {o.items.map((it) => {
                  const have = s.inv[it.id] ?? 0;
                  return (
                    <div key={it.id} className="flex flex-col items-center rounded-xl bg-[#f4e6c4] px-2 py-1">
                      <span className="emoji text-2xl"><Ico i={ITEMS[it.id].icon} /></span>
                      <span className={`text-xs font-bold ${have >= it.qty ? 'text-[#2d5e14]' : 'text-[#c0392b]'}`}>
                        {have}/{it.qty}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center gap-3 text-sm font-bold">
                <Coins n={Math.round(o.coins * (1 + bonus))} />
                <span className="text-[#2f8fd0]">+{o.xp} XP</span>
                {o.gems > 0 && <Gems n={o.gems} />}
              </div>
              <div className="flex gap-2">
                <button className="btn btn-green flex-1" disabled={!ok} onClick={() => store.fulfillOrder(o.id)}>
                  {t('Deliver')}
                </button>
                <button className="btn btn-ghost px-3" onClick={() => store.discardOrder(o.id)} aria-label={t('Discard order')} title={t('Discard, a new one comes in 45s')}>
                  <span className="emoji">🗑️</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
      <PanelObjectActions />
    </Modal>
  );
}

// ------------------------------------------------------------------ storage

function StorageModal() {
  const store = useStore();
  const s = store.s;
  const k = store.ui.storageTab;
  const used = storageUsed(s, k);
  const cap = storageCap(s, k);
  const lvl = k === 'silo' ? s.siloLevel : s.barnLevel;
  const cost = upgradeCost(lvl);
  const items = ITEM_LIST.filter((i) => i.storage === k && (s.inv[i.id] ?? 0) > 0);
  const [sure, setSure] = useState<{ id: string; all: boolean } | null>(null);

  return (
    <Modal title={t(k === 'silo' ? 'Silo' : 'Barn')} icon={k === 'silo' ? '🌾' : '🏚️'} onClose={() => store.openPanel(null)} wide>
      <div className="mb-3 flex gap-1.5">
        {(['silo', 'barn'] as const).map((x) => (
          <button
            key={x}
            className={`btn ${k === x ? 'btn-yellow' : 'btn-ghost'}`}
            onClick={() => {
              store.ui.storageTab = x;
              store.emit(false);
            }}
          >
            {t(x === 'silo' ? 'Silo (crops)' : 'Barn (goods)')}
          </button>
        ))}
      </div>
      <div className="card mb-3 flex flex-wrap items-center gap-3 p-3">
        <div className="min-w-[10rem] flex-1">
          <div className="mb-1 flex justify-between text-sm font-bold">
            <span>{t('Capacity')}</span>
            <span className={used >= cap ? 'text-[#c0392b]' : ''}>
              {used}/{cap}
            </span>
          </div>
          <Bar p={used / cap} color={used >= cap ? '#e0533d' : used / cap > 0.8 ? '#f5b92b' : '#5cb82e'} />
        </div>
        <button className="btn btn-wood" onClick={() => store.upgradeStorage(k)} disabled={s.coins < cost}>
          {t('Upgrade +{n}', { n: upgradeStep(lvl) })} <Coins n={cost} />
        </button>
      </div>
      {items.length === 0 ? (
        <p className="py-8 text-center text-sm text-[#8a6a44]">
          {t(k === 'silo' ? 'Your silo is empty. Harvest crops to fill it.' : 'Your barn is empty. Make goods and collect animal products to fill it.')}
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
          {items.map((i) => {
            const n = s.inv[i.id];
            // a sale waits for a second tap on the same button to confirm it
            const armed = sure?.id === i.id ? sure.all : null;
            const sell = (all: boolean) => {
              if (armed === all) { setSure(null); store.sellItem(i.id, all ? n : 1); }
              else setSure({ id: i.id, all });
            };
            return (
              <div key={i.id} className="card flex flex-col items-center gap-1 p-2">
                <span className="emoji text-3xl"><Ico i={i.icon} /></span>
                <span className="text-sm font-bold">{t(i.name)}</span>
                <span className="text-xs text-[#8a6a44]">
                  x{n} · <span className="inline-flex items-center gap-0.5">{i.sell} <Coin /></span> {t('each')}
                </span>
                <div className="flex w-full gap-1">
                  <button className={`btn flex-1 px-1 py-1 text-xs ${armed === false ? 'btn-red' : 'btn-ghost'}`} onClick={() => sell(false)}>
                    {armed === false ? t('Sure?') : t('Sell 1')}
                  </button>
                  <button className={`btn flex-1 px-1 py-1 text-xs ${armed === true ? 'btn-red' : 'btn-yellow'}`} onClick={() => sell(true)}>
                    {armed === true ? t('Sell all {n}?', { n: fmtNum(i.sell * n) }) : t('All {n}', { n: fmtNum(i.sell * n) })}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <PanelObjectActions />
    </Modal>
  );
}

// ------------------------------------------------------------------ quests

function QuestsModal() {
  const store = useStore();
  const s = store.s;
  const [tab, setTab] = useState<'story' | 'goals' | 'badges' | 'album'>('story');
  const badgeCount = claimableBadges(s).length;
  const albumCount = claimableAlbum(s).length;
  const title = { story: 'Farm Story', goals: 'Farm Goals', badges: 'Badges', album: 'Farm Album' }[tab];
  const icon = { story: '📖', goals: '🏆', badges: '🎖️', album: '📔' }[tab];
  return (
    <Modal title={t(title)} icon={icon} onClose={() => store.openPanel(null)}>
      <div className="mb-3 flex gap-1.5">
        <button className={`btn relative ${tab === 'story' ? 'btn-yellow' : 'btn-ghost'}`} onClick={() => setTab('story')}>
          {t('Story')}
          {store.chapterReady() && <span className="badge">1</span>}
        </button>
        <button className={`btn ${tab === 'goals' ? 'btn-yellow' : 'btn-ghost'}`} onClick={() => setTab('goals')}>
          {t('Goals')}
        </button>
        <button className={`btn relative ${tab === 'badges' ? 'btn-yellow' : 'btn-ghost'}`} onClick={() => setTab('badges')}>
          {t('Badges')}
          {badgeCount > 0 && <span className="badge">{badgeCount}</span>}
        </button>
        <button className={`btn relative ${tab === 'album' ? 'btn-yellow' : 'btn-ghost'}`} onClick={() => setTab('album')}>
          {t('Album')}
          {albumCount > 0 && <span className="badge">{albumCount}</span>}
        </button>
      </div>
      {tab === 'story' ? <StoryPage /> : tab === 'goals' ? <GoalsList /> : tab === 'badges' ? <BadgesList /> : <AlbumList />}
    </Modal>
  );
}

// The album: every set with what has been found so far (the rest a question mark), and the
// reward for a finished set
function AlbumList() {
  const store = useStore();
  const s = store.s;
  const [open, setOpen] = useState<string | null>(null);
  return (
    <div className="flex flex-col gap-2">
      {ALBUM.map((a) => {
        const got = a.entries.filter((e) => s.album?.[e.id]).length;
        const done = albumSetDone(s, a.id);
        const taken = !!s.albumDone?.includes(a.id);
        return (
          <div key={a.id} className={`card p-3 ${done && !taken ? 'ring-2 ring-[#5cb82e]' : ''}`}>
            <div className="flex items-center gap-2">
              <button className="flex min-w-0 flex-1 items-center gap-2 text-left" onClick={() => setOpen(open === a.id ? null : a.id)} aria-expanded={open === a.id}>
                <span className="emoji text-2xl">{a.icon}</span>
                <span className="min-w-0 flex-1">
                  <span className="block font-bold">{t(a.name)} <span className="text-xs text-[#8a6a44]">{got}/{a.entries.length}</span></span>
                  <span className="block text-[11px] text-[#8a6a44]">{t(a.how)}</span>
                </span>
                <span className="text-xs text-[#8a6a44]">{open === a.id ? '▲' : '▼'}</span>
              </button>
              {taken ? (
                <span className="emoji text-xl" title={t('Reward taken')}>✅</span>
              ) : (
                <button className="btn btn-green shrink-0 py-1.5 text-xs" disabled={!done} onClick={() => store.claimAlbum(a.id)}>
                  <Coins n={a.reward.coins} /> <Gems n={a.reward.gems} />
                </button>
              )}
            </div>
            <div className="my-1.5"><Bar p={got / a.entries.length} color={taken ? '#f5b92b' : '#5cb82e'} /></div>
            {open === a.id && <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-6">
              {a.entries.map((e) => {
                const f = !!s.album?.[e.id];
                return (
                  <div key={e.id} className={`flex flex-col items-center rounded-xl border-2 p-1 text-center ${f ? 'border-[#e0c48f] bg-white' : 'border-dashed border-[#d8c49e] bg-[#f4ead4]'}`} title={f ? t(e.name) : t('Not found yet')}>
                    <span className={`emoji text-2xl ${f ? '' : 'opacity-50'}`}>{f ? <Ico i={e.icon} id={e.model} /> : '❔'}</span>
                    <span className="line-clamp-2 text-[9px] font-bold leading-tight">{f ? t(e.name) : '???'}</span>
                  </div>
                );
              })}
            </div>}
          </div>
        );
      })}
    </div>
  );
}

// The dog or the cat: pat it, feed it once a day, open what it brings back, give it a name
function PetModal() {
  const store = useStore();
  const [, tick] = useState(0);
  useEffect(() => {
    const tm = setInterval(() => tick((n) => n + 1), 1000);
    return () => clearInterval(tm);
  }, []);
  const id = store.ui.pet ?? 'dog';
  const def = PET[id];
  const p = store.pet(id);
  const now = Date.now();
  const [name, setName] = useState(p.name);
  const hearts = petHearts(p);
  const gift = petGift(p, now);
  const food = store.petFood(id);
  const patted = now - p.petAt < PET_PAT_MS;
  const help = Math.round(petHelp({ ...p, fedDay: todayKey() }) * 100);
  return (
    <Modal title={p.name} icon={def.icon} onClose={() => store.openPanel(null)}>
      <div className="flex flex-col items-center gap-2 py-1 text-center">
        <span className="emoji text-6xl"><Ico i={def.icon} id={`animal_${id}`} /></span>
        <div className="flex items-center gap-1.5">
          <input
            className="w-36 rounded-xl border-2 border-[#d8c49e] bg-white px-2 py-1 text-center font-bold"
            value={name}
            maxLength={14}
            aria-label={t('Name')}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => store.renamePet(id, name)}
            onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
          />
          <span className="text-xs text-[#8a6a44]">{t(def.kind === 'Dog' ? 'the dog' : 'the cat')}</span>
        </div>
        <div className="emoji text-xl" aria-label={t('{n} of 5 hearts', { n: hearts })}>{'❤️'.repeat(hearts)}{'🤍'.repeat(5 - hearts)}</div>
        <div className="w-40"><Bar p={hearts >= 5 ? 1 : (p.love % 20) / 20} color="#f06292" /></div>
        <p className="text-sm">
          {p.name} {t(def.job)}.{' '}
          <b>{petFed(p) ? t('Fed today: {n}% chance.', { n: help }) : t('Hungry: feed {name} for {n}% today.', { name: p.name, n: help })}</b>
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          <button className="btn btn-wood" onClick={() => store.patPet(id)}>
            <span className="emoji">💕</span> {t(patted ? 'Pat again' : 'Pat')}
          </button>
          <button className="btn btn-green" disabled={petFed(p)} onClick={() => store.feedPet(id)}>
            {petFed(p) ? t('Fed today') : food ? <>{t('Feed 1')} <Ico i={ITEMS[food].icon} /></> : t('No food')}
          </button>
        </div>
        {!petFed(p) && !food && (
          <p className="text-xs text-[#b0442c]">{t('{name} eats {foods}.', { name: p.name, foods: def.foods.map((f) => t(ITEMS[f].name)).join(' / ') })}</p>
        )}
        <div className="card w-full p-2 text-sm">
          {gift === 'ready' ? (
            <button className="btn btn-yellow w-full" onClick={() => store.openPetGift(id)}>
              <span className="emoji inline-block animate-bob">🎁</span> {t('{name} brought you something!', { name: p.name })}
            </button>
          ) : gift === 'searching' ? (
            <span>{p.name} {t(def.search)}... {t('back in {time}', { time: fmtTime(Math.max(0, PET_SEARCH_MS - (now - p.fedAt))) })}</span>
          ) : gift === 'done' ? (
            <span>{t("Today's find is in. Feed {name} again tomorrow for another.", { name: p.name })}</span>
          ) : (
            <span>{t('Feed {name} and it goes looking for something for your album.', { name: p.name })}</span>
          )}
        </div>
      </div>
    </Modal>
  );
}

function BadgesList() {
  const store = useStore();
  const s = store.s;
  const medal = ['🥉', '🥈', '🥇'];
  return (
    <div className="flex flex-col gap-2">
      {ACHIEVEMENTS.map((a) => {
        const k = s.achievements[a.id] ?? 0;
        const done = k >= a.tiers.length;
        const target = done ? a.tiers[a.tiers.length - 1] : a.tiers[k];
        const p = Math.min(target, a.progress(s));
        const ready = !done && p >= target;
        return (
          <div key={a.id} className={`card flex items-center gap-3 p-3 ${ready ? 'ring-2 ring-[#5cb82e]' : ''}`}>
            <span className="emoji text-3xl"><Ico i={a.icon} /></span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 font-bold">
                {t(a.name)}
                <span className="emoji text-sm">{medal.slice(0, k).join('')}</span>
              </div>
              <div className="my-1">
                <Bar p={p / target} color={done ? '#f5b92b' : '#5cb82e'} />
              </div>
              <div className="text-[11px] text-[#8a6a44]">
                {done ? `${t('All tiers done.')} ${fmtNum(a.progress(s))} ${t(a.unit)}.` : `${fmtNum(p)}/${fmtNum(target)} ${t(a.unit)}`}
              </div>
            </div>
            {!done && (
              <button className="btn btn-green shrink-0 py-1.5" disabled={!ready} onClick={() => store.claimBadge(a.id)}>
                <Gems n={BADGE_GEMS[k]} />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

function GoalsList() {
  const store = useStore();
  const s = store.s;
  const list = activeQuests(s);
  const stats: [string, number][] = [
    ['Crops harvested', s.stats.harvest ?? 0],
    ['Goods made', s.stats.make ?? 0],
    ['Orders delivered', s.stats.orders ?? 0],
    ['Coins earned', s.stats.earned ?? 0],
  ];
  return (
    <>
      {list.length === 0 ? (
        <p className="py-6 text-center text-sm text-[#8a6a44]">{t('You finished every goal. Great farming!')}</p>
      ) : (
        <div className="flex flex-col gap-2">
          {list.map((q) => {
            const p = Math.min(q.target, q.progress(s));
            const done = p >= q.target;
            return (
              <div key={q.id} className={`card p-3 ${done ? 'ring-2 ring-[#5cb82e]' : ''}`}>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold">{t(q.text)}</span>
                  <span className="shrink-0 text-xs font-bold">
                    {fmtNum(p)}/{fmtNum(q.target)}
                  </span>
                </div>
                <div className="my-2">
                  <Bar p={p / q.target} />
                </div>
                <div className="flex items-center gap-3 text-sm font-bold">
                  <Coins n={q.coins} />
                  {q.gems > 0 && <Gems n={q.gems} />}
                  {q.xp > 0 && <span className="text-[#2f8fd0]">+{q.xp} XP</span>}
                  <button className="btn btn-green ml-auto py-1.5" disabled={!done} onClick={() => store.claimQuest(q.id)}>
                    {t('Claim')}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <div className="mt-4 grid grid-cols-2 gap-2">
        {stats.map(([l, v]) => (
          <div key={l} className="rounded-xl bg-[#f4e6c4] px-3 py-2 text-center">
            <div className="text-lg font-bold">{fmtNum(v)}</div>
            <div className="text-[11px] text-[#8a6a44]">{t(l)}</div>
          </div>
        ))}
      </div>
    </>
  );
}

// ------------------------------------------------------------------ settings

function Toggle({ label, on, onChange }: { label: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button className="card flex w-full items-center justify-between p-3" onClick={() => onChange(!on)}>
      <span className="font-bold">{t(label)}</span>
      <span className={`relative h-7 w-12 rounded-full transition ${on ? 'bg-[#5cb82e]' : 'bg-[#cdb482]'}`}>
        <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${on ? 'left-6' : 'left-1'}`} />
      </span>
    </button>
  );
}

function QualityPicker() {
  const [q, setQ] = useState<Quality>(getQuality);
  const pick = (v: Quality) => { setQuality(v); setQ(v); };
  return (
    <div className="card flex w-full items-center justify-between gap-2 p-3">
      <span className="font-bold">{t('Graphics quality')}</span>
      <span className="flex gap-1">
        {(['high', 'low'] as const).map((v) => (
          <button key={v} className={`btn px-3 py-1 text-sm ${q === v ? 'btn-green' : 'btn-wood'}`} onClick={() => pick(v)}>
            {t(v === 'high' ? 'High' : 'Low')}
          </button>
        ))}
      </span>
    </div>
  );
}

// The game's language, 21 of them; the choice is kept on this device
function LanguagePicker() {
  const [l, setL] = useState<Lang>(getLang);
  const names = LANG_NAMES as Record<string, string>;
  return (
    <div className="card w-full p-3">
      <div className="mb-2 font-bold">{t('Language')}</div>
      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
        {LANG_IDS.map((id) => (
          <button key={id} className={`btn px-2 py-1.5 text-sm ${l === id ? 'btn-green' : 'btn-wood'}`} onClick={() => { setL(id); setLang(id); }}>
            {names[id]}
          </button>
        ))}
      </div>
    </div>
  );
}

function SettingsModal() {
  const store = useStore();
  const st = store.s.settings;
  const [code, setCode] = useState('');
  const [mode, setMode] = useState<'none' | 'export' | 'import' | 'reset'>('none');
  const [copied, setCopied] = useState(false);
  const set = (k: keyof typeof st, v: boolean) => {
    store.s.settings = { ...st, [k]: v };
    store.emit();
  };

  return (
    <Modal title={t('Settings')} icon="⚙️" onClose={() => store.openPanel(null)}>
      <div className="flex flex-col gap-2">
        <Toggle label="Sound effects" on={st.sound} onChange={(v) => set('sound', v)} />
        <Toggle label="Day and night cycle" on={st.dayNight} onChange={(v) => set('dayNight', v)} />
        <Toggle label="Clouds" on={st.clouds} onChange={(v) => set('clouds', v)} />
        <Toggle label="Music" on={st.music} onChange={(v) => set('music', v)} />
        <Toggle label="Weather and seasons" on={st.weather} onChange={(v) => set('weather', v)} />
        <Toggle label="Soft shadows (turn off on slow phones)" on={st.shadows} onChange={(v) => set('shadows', v)} />
        <Toggle label="Battery saver (30 FPS, cooler phone)" on={!!st.saver} onChange={(v) => set('saver', v)} />
        <QualityPicker />
        <LanguagePicker />
      </div>

      <h3 className="mb-2 mt-4 font-bold">{t('Save data')}</h3>
      <p className="mb-2 text-xs text-[#8a6a44]">{t('Your farm saves automatically in this browser. Use a save code to move it to another device.')}</p>
      <div className="flex flex-wrap gap-2">
        <button
          className="btn btn-blue"
          onClick={() => {
            setCode(store.exportSave());
            setMode('export');
            setCopied(false);
          }}
        >
          {t('Export code')}
        </button>
        <button
          className="btn btn-wood"
          onClick={() => {
            setCode('');
            setMode('import');
          }}
        >
          {t('Import code')}
        </button>
        <button className="btn btn-red" onClick={() => setMode('reset')}>
          {t('Start over')}
        </button>
      </div>

      {mode === 'export' && (
        <div className="mt-3">
          <textarea readOnly value={code} className="h-24 w-full select-text rounded-xl border-2 border-[#e2cc9c] bg-white p-2 font-mono text-[10px]" onFocus={(e) => e.currentTarget.select()} />
          <button
            className="btn btn-green mt-1"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(code);
                setCopied(true);
              } catch {
                setCopied(false);
              }
            }}
          >
            {t(copied ? 'Copied' : 'Copy')}
          </button>
        </div>
      )}
      {mode === 'import' && (
        <div className="mt-3">
          <textarea value={code} onChange={(e) => setCode(e.target.value)} placeholder={t('Paste your save code here')} className="h-24 w-full select-text rounded-xl border-2 border-[#e2cc9c] bg-white p-2 font-mono text-[10px]" />
          <button className="btn btn-green mt-1" disabled={!code.trim()} onClick={() => store.importSave(code)}>
            {t('Load farm')}
          </button>
        </div>
      )}
      {mode === 'reset' && (
        <div className="card mt-3 border-[#e0533d] p-3 text-center">
          <p className="mb-2 text-sm font-bold">{t('This deletes your whole farm. Are you sure?')}</p>
          <div className="flex justify-center gap-2">
            <button className="btn btn-ghost" onClick={() => setMode('none')}>
              {t('Keep farm')}
            </button>
            <button className="btn btn-red" onClick={() => store.reset()}>
              {t('Yes, start over')}
            </button>
          </div>
        </div>
      )}

      <h3 className="mb-1 mt-4 font-bold">{t('How to play')}</h3>
      <ul className="list-disc space-y-0.5 pl-5 text-xs text-[#8a6a44]">
        {['Drag to move around, pinch or scroll to zoom. Twist with two fingers, the rotate button or Q and E to turn the camera.',
          'Press and drag across ready fields to harvest them all.',
          'Hold anything for a moment to move it.',
          'Tap the order board for orders, the farmhouse for goals, the barn and silo for storage.',
          'Tap land with a sign to expand your farm.',
          'Fruit trees keep giving fruit, no replanting needed.',
          'Your stall pays more than selling from storage.'].map((l) => <li key={l}>{t(l)}</li>)}
      </ul>
      <p className="mt-4 text-center text-[11px] text-[#b09a72]">Talons Farm by Talons Protocol</p>
    </Modal>
  );
}

// ------------------------------------------------------------------ small modals

function LevelUpModal({ level }: { level: number }) {
  const store = useStore();
  const list = unlocksAt(level);
  const close = () => {
    store.ui.levelUp = null;
    store.emit(false);
  };
  return (
    <Modal title={t('Level Up!')} icon="⭐" onClose={close}>
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="relative grid h-24 w-24 place-items-center">
          <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full animate-bob">
            <path d="M50 4l13 28 30 3-23 20 7 30-27-16-27 16 7-30L7 35l30-3z" fill="#ffd23a" stroke="#5d3a1f" strokeWidth="5" strokeLinejoin="round" />
          </svg>
          <span className="relative text-3xl font-bold">{level}</span>
        </div>
        <div className="flex items-center gap-4 text-lg font-bold">
          <Coins n={level * 15} />
          <Gems n={3} />
        </div>
        {list.length > 0 && (
          <>
            <div className="text-sm font-bold text-[#8a6a44]">{t('New things unlocked')}</div>
            <div className="flex flex-wrap justify-center gap-2">
              {list.map((x) => (
                <div key={x.name} className="card flex w-20 flex-col items-center p-2">
                  <span className="emoji text-3xl"><Ico i={x.icon} id={x.id} /></span>
                  <span className="text-[11px] font-bold leading-tight">{t(x.name)}</span>
                </div>
              ))}
            </div>
          </>
        )}
        <button className="btn btn-green px-10 py-3 text-lg" onClick={close}>
          {t('Continue')}
        </button>
      </div>
    </Modal>
  );
}

function DailyModal() {
  const store = useStore();
  const s = store.s;
  const y = new Date();
  y.setDate(y.getDate() - 1);
  const nextStreak = s.lastDaily === todayKey(y) ? s.streak + 1 : 1;
  const today = dailyReward(nextStreak).day;
  const can = store.canDaily();
  const close = () => {
    store.ui.daily = false;
    store.emit(false);
  };
  return (
    <Modal title={t('Daily Gift')} icon="🎁" onClose={close}>
      <p className="mb-3 text-center text-sm text-[#8a6a44]">{t('Come back every day. Day 7 has the biggest gift.')}</p>
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
        {Array.from({ length: 7 }).map((_, i) => {
          const r = dailyReward(i + 1);
          const day = i + 1;
          const past = day < today;
          const cur = day === today;
          return (
            <div key={i} className={`card flex flex-col items-center gap-0.5 p-2 text-xs ${cur ? 'ring-2 ring-[#f5b92b]' : ''} ${past ? 'opacity-50' : ''}`}>
              <span className="whitespace-nowrap font-bold">{t('Day {n}', { n: day })}</span>
              <span className="emoji text-2xl">{past ? '✅' : day === 7 ? '💰' : '🎁'}</span>
              <Coins n={r.coins} />
              {r.gems > 0 && <Gems n={r.gems} />}
            </div>
          );
        })}
      </div>
      <div className="mt-4 flex justify-center">
        <button className="btn btn-green px-10 py-3 text-lg" disabled={!can} onClick={() => store.claimDaily()}>
          {t(can ? 'Claim' : 'Come back tomorrow')}
        </button>
      </div>
    </Modal>
  );
}

function ExpandModal() {
  const store = useStore();
  const s = store.s;
  const e = store.ui.expand!;
  const info = expandInfo(s);
  const valid = chunkState(s, e.cx, e.cy) === 'buyable';
  const close = () => {
    store.ui.expand = null;
    store.emit(false);
  };
  return (
    <Modal title={t('Expand Farm')} icon="🪧" onClose={close}>
      <div className="flex flex-col items-center gap-3 text-center">
        <span className="emoji text-5xl">🌳</span>
        <p className="text-sm text-[#8a6a44]">{t('Buy this land to grow your farm. New land may have trees and rocks to clear.')}</p>
        <div className="flex items-center gap-4 text-lg font-bold">
          <Coins n={info.cost} />
          {s.level < info.level && <Lock level={info.level} />}
        </div>
        <button className="btn btn-green px-10 py-3 text-lg" disabled={!valid || s.level < info.level || s.coins < info.cost} onClick={() => store.expand()}>
          {t('Buy land')}
        </button>
      </div>
    </Modal>
  );
}


// ------------------------------------------------------------------ story

function Portrait({ who, size = 'h-20 w-20 text-5xl' }: { who: keyof typeof CAST; size?: string }) {
  const c = CAST[who];
  return (
    <div className={`emoji grid shrink-0 place-items-center rounded-full border-4 bg-[#fff6df] shadow-[0_4px_0_#5d3a1f] ${size}`} style={{ borderColor: c.color }}>
      {c.icon}
    </div>
  );
}

function TaskRow({ ch, i }: { ch: Chapter; i: number }) {
  const store = useStore();
  const task = ch.tasks[i];
  const p = Math.min(task.target, taskProgress(task, store.s));
  const done = p >= task.target;
  // tap a task to be taken to where it is done
  return (
    <button
      className={`card flex w-full items-center gap-2 p-2 text-left transition active:scale-[0.98] ${done ? 'ring-2 ring-[#5cb82e]' : 'hover:ring-2 hover:ring-[#ff8a1f]'}`}
      disabled={done}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={() => store.guideTask(task)}
      title={t(done ? 'Done' : 'Show me where')}
    >
      <span className="emoji text-2xl"><Ico i={task.icon} id={task.kind === 'count' ? task.key : undefined} /></span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2 text-sm font-bold">
          <span className="truncate">{t(task.text)}</span>
          <span className="shrink-0 text-xs">{done ? '✅' : `${p}/${task.target}`}</span>
        </div>
        <div className="mt-1"><Bar p={p / task.target} /></div>
      </div>
      {!done && <span className="shrink-0 text-lg text-[#ff8a1f]" aria-hidden>➜</span>}
    </button>
  );
}

// A chapter told in speech bubbles: the teller's portrait, their words typed out, and the tasks
// on the last bubble. Tap anywhere to go on.
function StoryDialog() {
  const store = useStore();
  const d = store.ui.story!;
  const ch = chapterAt(d.ch);
  const lines = d.part === 'intro' ? ch.intro : [ch.outro];
  const text = lines[Math.min(d.i, lines.length - 1)] ?? '';
  const last = d.i >= lines.length - 1;
  const who = CAST[ch.who];
  const [shown, setShown] = useState(0);
  useEffect(() => {
    setShown(0);
    const tm = setInterval(() => setShown((n) => (n >= text.length ? n : n + 2)), 22);
    return () => clearInterval(tm);
  }, [text]);
  const typing = shown < text.length;
  const next = () => (typing ? setShown(text.length) : store.storyNext());
  const r = storyReward(ch.n);
  return (
    <div className="pointer-events-auto fixed inset-0 z-40 flex flex-col justify-end bg-black/35 p-3 pb-6 font-game sm:items-center" onPointerDown={next}>
      <div className="w-full max-w-xl animate-pop">
        {d.i === 0 && (
          <div className="mb-2 flex justify-center">
            <span className="rounded-full border-[3px] border-[#5d3a1f] bg-[#ffd23a] px-4 py-1 text-sm font-bold text-[#5a3a1a] shadow-[0_3px_0_#5d3a1f]">
              {d.part === 'intro' ? t('Chapter {n}: {title}', { n: ch.n, title: t(ch.title) }) : t('Chapter {n} complete!', { n: ch.n })}
            </span>
          </div>
        )}
        <div className="flex items-end gap-2">
          <div className="flex flex-col items-center">
            <div className="animate-bob"><Portrait who={ch.who} /></div>
            <span className="mt-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-bold text-white" style={{ background: who.color }}>{t(who.name)}</span>
          </div>
          <div className="relative mb-6 min-w-0 flex-1 rounded-3xl border-[3px] border-[#5d3a1f] bg-white px-4 py-3 text-[#4a2e14] shadow-[0_5px_0_#5d3a1f]">
            {/* the bubble's tail points at the speaker */}
            <span className="absolute -left-[13px] bottom-5 h-5 w-5 rotate-45 border-b-[3px] border-l-[3px] border-[#5d3a1f] bg-white" />
            <p className="relative min-h-[3rem] text-base font-bold leading-snug sm:text-lg">
              {text.slice(0, shown)}
              <span className="opacity-0">{text.slice(shown)}</span>
            </p>
            {last && !typing && d.part === 'intro' && (
              <div className="relative mt-2 flex flex-col gap-1.5">
                {ch.tasks.map((_, i) => <TaskRow key={i} ch={ch} i={i} />)}
              </div>
            )}
            {last && !typing && d.part === 'outro' && (
              <div className="relative mt-2 flex items-center justify-center gap-4 text-base font-bold">
                <Coins n={r.coins} />
                {r.gems > 0 && <Gems n={r.gems} />}
                <span className="text-[#2f8fd0]">+{fmtNum(r.xp)} XP</span>
              </div>
            )}
            <div className="relative mt-2 flex justify-end">
              <span className={`text-xs font-bold text-[#a8733f] ${typing ? 'opacity-0' : 'animate-bob'}`}>
                {last ? (d.part === 'intro' ? t("Let's go!") + ' ▶' : t('Thanks!') + ' ▶') : t('Tap') + ' ▶'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StoryPage() {
  const store = useStore();
  const s = store.s;
  const st = s.story;
  if (!st || st.ch > LAST_CHAPTER) {
    return <p className="py-6 text-center text-sm text-[#8a6a44]">{t('The story of Talon Valley is complete. The Golden Nest is yours!')} 🪺✨</p>;
  }
  const ch = chapterAt(st.ch);
  const who = CAST[ch.who];
  if (s.level < ch.n) {
    return (
      <div className="flex flex-col items-center gap-3 py-4 text-center">
        <Portrait who={ch.who} />
        <p className="text-sm font-bold">{t('{name} has something new for you at level {n}.', { name: t(who.name), n: ch.n })}</p>
        <p className="text-xs text-[#8a6a44]">{t('Keep farming to reach the next chapter.')} {t('Chapters finished: {n} / {total}', { n: st.ch - 1, total: LAST_CHAPTER })}</p>
      </div>
    );
  }
  const ready = store.chapterReady();
  const r = storyReward(ch.n);
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <Portrait who={ch.who} size="h-16 w-16 text-4xl" />
        <div className="min-w-0 flex-1">
          <div className="text-xs font-bold uppercase tracking-wide text-[#a8733f]">{t('Chapter {n} of {total}', { n: ch.n, total: LAST_CHAPTER })}</div>
          <div className="text-lg font-bold leading-tight">{t(ch.title)}</div>
          <div className="text-xs text-[#8a6a44]">{t('told by {name}', { name: t(who.name) })}</div>
        </div>
        <button className="btn btn-ghost shrink-0 px-3 py-1.5 text-sm" onClick={() => store.replayStory()}>
          💬 {t('Replay')}
        </button>
      </div>
      <div className="relative rounded-2xl border-2 border-[#e2cc9c] bg-white px-3 py-2 text-sm italic text-[#5a3a1a]">
        “{ch.intro[ch.intro.length - 1]}”
      </div>
      <div className="flex flex-col gap-1.5">
        {ch.tasks.map((_, i) => <TaskRow key={i} ch={ch} i={i} />)}
      </div>
      <div className="flex items-center gap-3 text-sm font-bold">
        <Coins n={r.coins} />
        {r.gems > 0 && <Gems n={r.gems} />}
        <span className="text-[#2f8fd0]">+{fmtNum(r.xp)} XP</span>
        <button className={`btn btn-green ml-auto ${ready ? 'animate-bob' : ''}`} disabled={!ready} onClick={() => store.finishChapter()}>
          {t('Finish chapter')}
        </button>
      </div>
      <p className="text-center text-xs text-[#8a6a44]">{t('Chapters finished: {n} / {total}', { n: st.ch - 1, total: LAST_CHAPTER })}</p>
    </div>
  );
}
