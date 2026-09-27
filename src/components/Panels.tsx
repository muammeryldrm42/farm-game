'use client';
import Ico from './Ico';
import { useEffect, useState, type ReactNode } from 'react';
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
  NAP_MS,
  restBonus,
  type FarmObject,
} from '@/game/state';
import { getQuality, setQuality, type Quality } from '@/game/quality';
import { artStyle, setArtStyle, type ArtStyle } from '@/game/gfx/creatures';
import { Coin } from './Hud';
import { useStore, useVersion } from './ctx';

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
          <button className="btn btn-red absolute right-2 top-1.5 h-9 w-9 rounded-full p-0 text-lg" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        <div className="scroll-soft flex-1 p-3 sm:p-4">{children}</div>
      </div>
    </div>
  );
}

function Sheet({ title, icon, sub, onClose, children }: { title: string; icon: string; sub?: ReactNode; onClose: () => void; children: ReactNode }) {
  return (
    <div className="pointer-events-auto fixed inset-x-0 bottom-0 z-20 flex justify-center p-2 sm:p-3">
      <div className="panel w-full max-w-2xl animate-pop">
        <div className="flex items-center gap-3 border-b-2 border-[#e2cc9c] px-4 py-2">
          <span className="emoji text-3xl"><Ico i={icon} /></span>
          <div className="min-w-0 flex-1 leading-tight">
            <div className="truncate text-lg font-bold">{title}</div>
            {sub && <div className="text-xs text-[#8a6a44]">{sub}</div>}
          </div>
          <button className="btn btn-red h-9 w-9 rounded-full p-0 text-lg" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        <div className="scroll-soft max-h-[46vh] p-3">{children}</div>
      </div>
    </div>
  );
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
      <span className="emoji text-[10px]">🔒</span>Lv {level}
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
      {ui.napping && <SleepOverlay />}
      {ui.expand && <ExpandModal />}
      {ui.daily && ui.levelUp === null && <DailyModal />}
      {ui.levelUp !== null && <LevelUpModal level={ui.levelUp} />}
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
      <Sheet title={it.name} icon={it.icon} sub={pp.ready ? 'Ready to harvest' : 'Growing'} onClose={close}>
        {pp.ready ? (
          <div className="flex flex-col items-center gap-3 py-2">
            <button className="btn btn-green px-8 py-3 text-lg" onClick={() => { store.harvest(o); store.select(null); }}>
              Harvest +2 <Ico i={it.icon} />
            </button>
            <p className="text-center text-xs text-[#8a6a44]">Tip: press and drag across ready fields to harvest many at once.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <Bar p={pp.p} />
              <span className="w-20 shrink-0 text-right font-bold">{fmtTime(pp.remaining)}</span>
            </div>
            <div className="flex justify-center">
              <button className="btn btn-blue" onClick={() => store.speedPlot(o)} disabled={s.gems < gemCost(pp.remaining)}>
                Finish now <Gems n={gemCost(pp.remaining)} />
              </button>
            </div>
          </div>
        )}
      </Sheet>
    );
  }

  return (
    <Sheet title="Empty Field" icon="🟫" sub="Pick a seed, then tap or drag over empty fields" onClose={close}>
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
              <span className="text-xs font-bold">{it.name}</span>
              {locked ? (
                <Lock level={c.level} />
              ) : (
                <span className="text-[11px] text-[#8a6a44]">
                  {have > 0 ? `Have ${have}` : <span className="inline-flex items-center gap-1">{c.seedCost} <Coin /></span>} · {fmtTime(c.time * 1000)}
                </span>
              )}
            </button>
          );
        })}
      </div>
      <div className="mt-3 flex justify-center gap-2">
        <button className="btn btn-wood" onClick={() => store.startMove(o.id)}>
          Move
        </button>
        <button className="btn btn-ghost" onClick={() => store.removeObject(o.id)}>
          Remove field
        </button>
      </div>
    </Sheet>
  );
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
      title={d.name}
      icon={d.icon}
      sub={info.current ? `Making ${ITEMS[info.current.recipe].name}, ${fmtTime(info.current.endsAt - now)} left` : q.length ? 'Goods are ready' : 'Idle. Pick something to make.'}
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
            Collect {info.done.length}
          </button>
        )}
        {info.current && (
          <button className="btn btn-blue" onClick={() => store.speedProd(o)} disabled={s.gems < gemCost(info.current.endsAt - now)}>
            Finish now <Gems n={gemCost(info.current.endsAt - now)} />
          </button>
        )}
        <button className="btn btn-wood ml-auto" onClick={() => store.startMove(o.id)}>
          Move
        </button>
      </div>

      {/* recipes */}
      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {recipes.map((r) => {
          const it = ITEMS[r.id];
          const locked = s.level < r.level;
          const ok = store.hasItems(r.inputs);
          return (
            <button
              key={r.id}
              disabled={locked}
              onClick={() => store.queueRecipe(o, r.id)}
              className={`card flex items-center gap-3 p-2 text-left transition active:scale-[0.98] disabled:opacity-60 ${ok && !locked ? 'ring-2 ring-[#5cb82e]' : ''}`}
            >
              <span className={`emoji text-3xl ${locked ? 'grayscale' : ''}`}><Ico i={it.icon} /></span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 font-bold">
                  {it.name}
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
      title={d.name}
      icon={d.icon}
      sub={`${pi.total}/${cap} ${an.name.toLowerCase()}s · makes ${ITEMS[an.product].name} every ${fmtTime(an.time * 1000)}`}
      onClose={() => store.select(null)}
    >
      {pi.total === 0 ? (
        <p className="py-2 text-center text-sm text-[#8a6a44]">No animals yet. Buy your first {an.name.toLowerCase()} below.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {(o.pen?.animals ?? []).map((a) => {
            const ready = animalReady(a, an.time, now);
            const p = a.fedAt === null ? 0 : Math.min(1, (now - a.fedAt) / (an.time * 1000));
            return (
              <div key={a.id} className="card flex w-16 flex-col items-center gap-1 p-1.5">
                <span className="emoji text-2xl"><Ico i={an.icon} /></span>
                {ready ? (
                  <span className="emoji text-lg"><Ico i={ITEMS[an.product].icon} /></span>
                ) : a.fedAt === null ? (
                  <span className="text-[10px] font-bold text-[#c0392b]">Hungry</span>
                ) : (
                  <Bar p={p} color="#f5b92b" />
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {pi.ready > 0 && (
          <button className="btn btn-green" onClick={() => store.collectPen(o)}>
            Collect {pi.ready} <Ico i={ITEMS[an.product].icon} />
          </button>
        )}
        {pi.hungry > 0 && (
          <button className="btn btn-yellow" onClick={() => store.feedPen(o)} disabled={feedHave === 0}>
            Feed {Math.min(pi.hungry, feedHave) || ''} <span className="emoji"><Ico i={ITEMS[an.feed].icon} /></span>
          </button>
        )}
        {pi.fed > 0 && (
          <button className="btn btn-blue" onClick={() => store.speedPen(o)} disabled={s.gems < gemCost(maxRem)}>
            Finish now <Gems n={gemCost(maxRem)} />
          </button>
        )}
        {pi.total < cap && (
          <button className="btn btn-wood" onClick={() => store.buyAnimal(o)} disabled={locked || s.coins < an.cost}>
            Buy <Ico i={an.icon} /> <Coins n={an.cost} />
          </button>
        )}
        <button className="btn btn-ghost ml-auto" onClick={() => store.startMove(o.id)}>
          Move
        </button>
      </div>
      <p className="mt-2 text-xs text-[#8a6a44]">
        {ITEMS[an.feed].name} in storage: <b>{feedHave}</b>. {feedHint(an.feed)}
      </p>
    </Sheet>
  );
}

function DecoSheet({ o }: { o: FarmObject }) {
  const store = useStore();
  const d = BUILDING[o.type];
  return (
    <Sheet title={d.name} icon={d.icon} sub={d.desc} onClose={() => store.select(null)}>
      <div className="flex flex-wrap justify-center gap-2">
        <button className="btn btn-wood" onClick={() => store.startMove(o.id)}>
          Move
        </button>
        {d.sellable && (
          <button className="btn btn-ghost" onClick={() => store.removeObject(o.id)}>
            Sell for <Coins n={Math.floor(d.cost / 2)} />
          </button>
        )}
      </div>
    </Sheet>
  );
}

function ObstacleSheet({ o }: { o: FarmObject }) {
  const store = useStore();
  const d = BUILDING[o.type];
  const cost = d.clearCost ?? 0;
  return (
    <Sheet title={d.name} icon={d.icon} sub={`${d.desc} Gives ${d.xp} XP and sometimes a gem.`} onClose={() => store.select(null)}>
      <div className="flex justify-center">
        <button className="btn btn-green px-6" onClick={() => store.clearObstacle(o.id)} disabled={store.s.coins < cost}>
          Clear for <Coins n={cost} />
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
    <Sheet title={d.name} icon={d.icon} sub={ti.ready ? `Ready: 2 ${it.name.toLowerCase()}s` : `Growing ${it.name.toLowerCase()}s`} onClose={() => store.select(null)}>
      {ti.ready ? (
        <div className="flex justify-center py-1">
          <button className="btn btn-green px-8 py-3 text-lg" onClick={() => store.collectTree(o)}>
            Pick +2 <Ico i={it.icon} />
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
              Finish now <Gems n={gemCost(ti.remaining)} />
            </button>
          </div>
        </div>
      )}
      <div className="mt-3 flex justify-center gap-2">
        <button className="btn btn-wood" onClick={() => store.startMove(o.id)}>
          Move
        </button>
        <button className="btn btn-ghost" onClick={() => store.removeObject(o.id)}>
          Sell for <Coins n={Math.floor(d.cost / 2)} />
        </button>
      </div>
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
    const wait = ratio <= 1.05 ? 'Sells fast' : ratio <= 1.5 ? 'Sells in a few minutes' : 'Takes a while to sell';
    return (
      <Modal title="List an item" icon="🏪" onClose={() => store.openPanel(null)} wide>
        {owned.length === 0 ? (
          <p className="py-8 text-center text-sm text-[#8a6a44]">Your storage is empty. Harvest or make something to sell first.</p>
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
              <span className="emoji text-2xl"><Ico i={ITEMS[item].icon} /></span> {ITEMS[item].name}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="w-16 text-sm font-bold">Amount</span>
              <button className="btn btn-ghost h-9 w-9 p-0" onClick={() => setQ(qty - 1)}>−</button>
              <span className="w-8 text-center font-bold">{qty}</span>
              <button className="btn btn-ghost h-9 w-9 p-0" onClick={() => setQ(qty + 1)}>+</button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="w-16 text-sm font-bold">Price</span>
              <button className="btn btn-ghost h-9 w-9 p-0" onClick={() => setPrice(Math.max(1, price - Math.max(1, Math.round(base * 0.1))))}>−</button>
              <span className="min-w-[4rem] text-center font-bold"><Coins n={price} /></span>
              <button className="btn btn-ghost h-9 w-9 p-0" onClick={() => setPrice(Math.min(base * 2, price + Math.max(1, Math.round(base * 0.1))))}>+</button>
              <button className="btn btn-yellow px-2 py-1 text-xs" onClick={() => setPrice(base * 2)}>Max</button>
            </div>
            <div className="text-xs text-[#8a6a44]">
              Storage price is {base} coins. You can ask up to {base * 2}. {wait}.
            </div>
            <div className="flex gap-2">
              <button className="btn btn-ghost" onClick={reset}>Back</button>
              <button
                className="btn btn-green flex-1"
                onClick={() => {
                  store.listItem(pick, item, qty, price);
                  reset();
                }}
              >
                Put on stall
              </button>
            </div>
          </div>
        )}
        {!item && (
          <div className="mt-3 flex justify-center">
            <button className="btn btn-ghost" onClick={reset}>Back</button>
          </div>
        )}
      </Modal>
    );
  }

  return (
    <Modal title="Roadside Stall" icon="🏪" onClose={() => store.openPanel(null)} wide>
      <p className="mb-3 text-center text-xs text-[#8a6a44]">Villagers passing by buy what you put out. Higher prices take longer to sell.</p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {s.stall.map((sl, i) => {
          if (!sl.item) {
            return (
              <button key={i} className="card flex min-h-[9rem] flex-col items-center justify-center gap-1 border-dashed p-3 text-[#8a6a44]" onClick={() => { setPick(i); setItem(null); }}>
                <span className="text-3xl leading-none">+</span>
                <span className="text-sm font-bold">Sell something</span>
              </button>
            );
          }
          const sold = sl.soldAt <= now;
          return (
            <div key={i} className={`card flex min-h-[9rem] flex-col items-center gap-1 p-3 ${sold ? 'ring-2 ring-[#5cb82e]' : ''}`}>
              <span className="emoji text-3xl"><Ico i={ITEMS[sl.item].icon} /></span>
              <span className="text-sm font-bold">x{sl.qty} {ITEMS[sl.item].name}</span>
              <span className="text-sm font-bold"><Coins n={sl.price} /></span>
              {sold ? (
                <button className="btn btn-green mt-auto w-full py-1.5" onClick={() => store.collectSale(i)}>Collect</button>
              ) : (
                <>
                  <span className="text-[11px] text-[#8a6a44]">Waiting for a buyer</span>
                  <button className="btn btn-ghost mt-auto w-full py-1 text-xs" onClick={() => store.cancelListing(i)}>Take back</button>
                </>
              )}
            </div>
          );
        })}
      </div>
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
    <Modal title={manor ? 'Manor' : 'Farmhouse'} icon={manor ? '🏰' : '🏡'} onClose={close}>
      <div className="flex flex-col items-center gap-3 py-2 text-center">
        <span className="emoji animate-bob text-5xl">🛏️</span>
        <p className="font-bold">{manor ? 'A grand bedroom with a soft four poster bed.' : 'A cozy bed under the eaves.'}</p>
        <p className="text-sm text-[#8a6a44]">
          {store.canRest()
            ? `Take a nap of ${NAP_MS / 1000} seconds or more to wake up well rested: +${restBonus(s.level)} coins and +10 XP, once a day. You can keep farming while the farmer sleeps.`
            : 'You already woke up well rested today. You can still nap as much as you like.'}
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          <button className="btn btn-blue px-6 py-2" onClick={() => store.sleep()}>Go to sleep</button>
          <button className="btn btn-wood px-6 py-2" onClick={() => store.openPanel('quests')}>Goals</button>
        </div>
      </div>
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
  const left = Math.max(0, Math.ceil((store.ui.napAt + NAP_MS - Date.now()) / 1000));
  const rest = store.canRest();
  return (
    <>
      <div className="pointer-events-none fixed inset-0 z-10 bg-[#0b1a3a]/25" />
      <div className="panel pointer-events-auto fixed left-1/2 top-16 z-20 flex -translate-x-1/2 items-center gap-3 px-4 py-2 text-[#5a3a1a]">
        <span className="emoji animate-bob text-2xl">😴</span>
        <div className="flex flex-col text-left leading-tight">
          <span className="font-bold">Sleeping... z Z z</span>
          {rest && <span className="text-xs">{left > 0 ? `Well rested in ${left}s` : 'Well rested! Wake up for your bonus.'}</span>}
        </div>
        <button className="btn btn-green px-4 py-1 text-sm" onClick={() => store.wake()}>Wake up</button>
      </div>
    </>
  );
}

function FishingModal() {
  const store = useStore();
  const s = store.s;
  const now = Date.now();
  const fi = fishingInfo(s, now);
  const close = () => store.openPanel(null);
  return (
    <Modal title="Fishing Spot" icon="🎣" onClose={close}>
      <div className="flex flex-col items-center gap-3 py-2 text-center">
        <span className="emoji animate-bob text-5xl">{fi.state === 'ready' ? '🐟' : '🌊'}</span>
        {fi.state === 'locked' && (
          <>
            <p className="font-bold">Open a fishing spot off the south shore.</p>
            <p className="text-sm text-[#8a6a44]">Cast a line, wait a little and reel in fish. New catches bite as you level up: salmon, lobster and crab early on, then trout, tuna, shrimp, squid, octopus, swordfish, eel, pufferfish, stingray, marlin, pearl oysters and, at level 195, the golden fish.</p>
            {s.level < FISHING.level ? (
              <Lock level={FISHING.level} />
            ) : (
              <button className="btn btn-green px-8 py-2" disabled={s.coins < FISHING.cost} onClick={() => store.buyFishing()}>
                Open for <Coins n={FISHING.cost} />
              </button>
            )}
          </>
        )}
        {fi.state === 'idle' && (
          <>
            <p className="font-bold">The water is calm. Cast your line!</p>
            <button className="btn btn-blue px-8 py-2" onClick={() => { store.castLine(); close(); }}>Cast line</button>
          </>
        )}
        {fi.state === 'waiting' && (
          <>
            <p className="font-bold">Waiting for a bite...</p>
            <div className="h-3 w-48 overflow-hidden rounded-full bg-[#e6e0d0]">
              <div className="h-full bg-[#2f8fd0]" style={{ width: `${Math.round(fi.p * 100)}%` }} />
            </div>
            <p className="text-sm text-[#8a6a44]">{fmtTime(fi.remaining)} left</p>
          </>
        )}
        {fi.state === 'ready' && (
          <button className="btn btn-green px-8 py-2" onClick={() => { store.reelIn(); close(); }}>Reel in</button>
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
      <Modal title="Boat Dock" icon="⛵" onClose={close}>
        <div className="flex flex-col items-center gap-2 py-4 text-center">
          <span className="emoji animate-bob text-5xl">🌊</span>
          <p className="font-bold">The boat is out at sea.</p>
          {b && <p className="text-sm text-[#8a6a44]">It comes back in {fmtTime(b.returnAt - now)}.</p>}
        </div>
      </Modal>
    );
  }
  const all = b.crates.every((c) => c.filled);
  return (
    <Modal title="Cargo Boat" icon="⛵" onClose={close} wide>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-sm">
        <span className="text-[#8a6a44]">Leaves in <b>{fmtTime(b.leavesAt - now)}</b></span>
        <span className="flex items-center gap-2 font-bold">
          Full boat bonus: <Coins n={b.bonusCoins} /> <Gems n={b.bonusGems} />
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {b.crates.map((c, i) => {
          const have = s.inv[c.item] ?? 0;
          const ok = have >= c.qty;
          return (
            <div key={i} className={`card flex flex-col items-center gap-1 p-3 ${c.filled ? 'bg-[#e6f8d8]' : ok ? 'ring-2 ring-[#5cb82e]' : ''}`}>
              <span className="emoji text-3xl">{c.filled ? '📦' : <Ico i={ITEMS[c.item].icon} />}</span>
              <span className="text-sm font-bold">{ITEMS[c.item].name}</span>
              {c.filled ? (
                <span className="text-sm font-bold text-[#2d5e14]">Packed</span>
              ) : (
                <>
                  <span className={`text-xs font-bold ${ok ? 'text-[#2d5e14]' : 'text-[#c0392b]'}`}>{have}/{c.qty}</span>
                  <span className="flex items-center gap-2 text-xs font-bold">
                    <Coins n={c.coins} /> <span className="text-[#2f8fd0]">+{c.xp} XP</span>
                  </span>
                  <button className="btn btn-green mt-1 w-full py-1.5" disabled={!ok} onClick={() => store.fillCrate(i)}>Fill</button>
                </>
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-4 flex justify-center">
        <button className="btn btn-yellow px-8 py-3 text-lg" disabled={!all} onClick={() => store.sendBoat()}>
          Send boat
        </button>
      </div>
    </Modal>
  );
}

// ------------------------------------------------------------------ shop

type ShopTab = 'farming' | 'buildings' | 'animals' | 'decor';
const SHOP_TABS: { id: ShopTab; label: string; icon: string; filter: (d: BuildingDef) => boolean }[] = [
  { id: 'farming', label: 'Farming', icon: '🌱', filter: (d) => d.kind === 'plot' || d.kind === 'tree' },
  { id: 'buildings', label: 'Buildings', icon: '🏭', filter: (d) => d.kind === 'production' || d.kind === 'stall' || d.kind === 'dock' || (d.kind === 'house' && d.buyable) },
  { id: 'animals', label: 'Animals', icon: '🐔', filter: (d) => d.kind === 'pen' },
  { id: 'decor', label: 'Decor', icon: '🌷', filter: (d) => d.kind === 'deco' },
];

function ShopModal() {
  const store = useStore();
  const s = store.s;
  const [tab, setTab] = useState<ShopTab>('farming');
  const t = SHOP_TABS.find((x) => x.id === tab)!;
  const list = BUILDINGS.filter((d) => d.buyable && t.filter(d)).sort((a, b) => a.level - b.level || a.cost - b.cost);

  return (
    <Modal title="Shop" icon="🛒" onClose={() => store.openPanel(null)} wide>
      <div className="mb-3 flex gap-1.5 overflow-x-auto">
        {SHOP_TABS.map((x) => (
          <button key={x.id} className={`btn shrink-0 ${tab === x.id ? 'btn-yellow' : 'btn-ghost'}`} onClick={() => setTab(x.id)}>
            <span className="emoji"><Ico i={x.icon} /></span> {x.label}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
        {list.map((d) => {
          const locked = s.level < d.level;
          const owned = store.countType(d.id);
          const max = store.maxOf(d);
          const full = owned >= max;
          const cost = store.costOf(d);
          const poor = s.coins < cost;
          return (
            <button
              key={d.id}
              disabled={locked || full}
              onClick={() => store.startBuy(d.id)}
              className="card flex flex-col items-center gap-1 p-3 text-center transition active:scale-95 disabled:opacity-60"
            >
              <span className={`emoji text-4xl ${locked ? 'grayscale' : ''}`}><Ico i={d.icon} /></span>
              <span className="font-bold leading-tight">{d.name}</span>
              <span className="line-clamp-2 min-h-[2rem] text-[11px] leading-4 text-[#8a6a44]">{d.desc}</span>
              {locked ? (
                <Lock level={d.level} />
              ) : (
                <>
                  <span className={`text-sm font-bold ${poor ? 'text-[#c0392b]' : ''}`}>
                    <Coins n={cost} />
                  </span>
                  <span className="text-[11px] text-[#8a6a44]">
                    {full ? 'Max owned' : `Owned ${owned}/${max}`}
                  </span>
                </>
              )}
            </button>
          );
        })}
      </div>
      {tab === 'farming' && (
        <p className="mt-3 text-center text-xs text-[#8a6a44]">You can own more fields as you level up. After placing one, the next is ready to place right away.</p>
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
    <Modal title="Order Board" icon="📋" onClose={() => store.openPanel(null)} wide>
      {bonus > 0 && (
        <p className="mb-2 text-center text-xs font-bold text-[#2d5e14]">
          <span className="emoji">🐎</span> Horse bonus: +{Math.round(bonus * 100)}% coins on every order
        </p>
      )}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
        {s.orders.map((o) => {
          if (o.readyAt > now) {
            return (
              <div key={o.id} className="card flex min-h-[9rem] flex-col items-center justify-center gap-1 p-3 text-center text-[#8a6a44]">
                <span className="emoji animate-bob text-3xl">🚚</span>
                <span className="text-sm font-bold">New order arriving</span>
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
                  Deliver
                </button>
                <button className="btn btn-ghost px-3" onClick={() => store.discardOrder(o.id)} aria-label="Discard order" title="Discard, a new one comes in 45s">
                  <span className="emoji">🗑️</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
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

  return (
    <Modal title={k === 'silo' ? 'Silo' : 'Barn'} icon={k === 'silo' ? '🌾' : '🏚️'} onClose={() => store.openPanel(null)} wide>
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
            {x === 'silo' ? 'Silo (crops)' : 'Barn (goods)'}
          </button>
        ))}
      </div>
      <div className="card mb-3 flex flex-wrap items-center gap-3 p-3">
        <div className="min-w-[10rem] flex-1">
          <div className="mb-1 flex justify-between text-sm font-bold">
            <span>Capacity</span>
            <span className={used >= cap ? 'text-[#c0392b]' : ''}>
              {used}/{cap}
            </span>
          </div>
          <Bar p={used / cap} color={used >= cap ? '#e0533d' : used / cap > 0.8 ? '#f5b92b' : '#5cb82e'} />
        </div>
        <button className="btn btn-wood" onClick={() => store.upgradeStorage(k)} disabled={s.coins < cost}>
          Upgrade +25 <Coins n={cost} />
        </button>
      </div>
      {items.length === 0 ? (
        <p className="py-8 text-center text-sm text-[#8a6a44]">
          {k === 'silo' ? 'Your silo is empty. Harvest crops to fill it.' : 'Your barn is empty. Make goods and collect animal products to fill it.'}
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
          {items.map((i) => {
            const n = s.inv[i.id];
            return (
              <div key={i.id} className="card flex flex-col items-center gap-1 p-2">
                <span className="emoji text-3xl"><Ico i={i.icon} /></span>
                <span className="text-sm font-bold">{i.name}</span>
                <span className="text-xs text-[#8a6a44]">
                  x{n} · <span className="inline-flex items-center gap-0.5">{i.sell} <Coin /></span> each
                </span>
                <div className="flex w-full gap-1">
                  <button className="btn btn-ghost flex-1 px-1 py-1 text-xs" onClick={() => store.sellItem(i.id, 1)}>
                    Sell 1
                  </button>
                  <button className="btn btn-yellow flex-1 px-1 py-1 text-xs" onClick={() => store.sellItem(i.id, n)}>
                    All {fmtNum(i.sell * n)}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Modal>
  );
}

// ------------------------------------------------------------------ quests

function QuestsModal() {
  const store = useStore();
  const s = store.s;
  const [tab, setTab] = useState<'goals' | 'badges'>('goals');
  const badgeCount = claimableBadges(s).length;
  return (
    <Modal title={tab === 'goals' ? 'Farm Goals' : 'Badges'} icon={tab === 'goals' ? '🏆' : '🎖️'} onClose={() => store.openPanel(null)}>
      <div className="mb-3 flex gap-1.5">
        <button className={`btn ${tab === 'goals' ? 'btn-yellow' : 'btn-ghost'}`} onClick={() => setTab('goals')}>
          Goals
        </button>
        <button className={`btn relative ${tab === 'badges' ? 'btn-yellow' : 'btn-ghost'}`} onClick={() => setTab('badges')}>
          Badges
          {badgeCount > 0 && <span className="badge">{badgeCount}</span>}
        </button>
      </div>
      {tab === 'goals' ? <GoalsList /> : <BadgesList />}
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
                {a.name}
                <span className="emoji text-sm">{medal.slice(0, k).join('')}</span>
              </div>
              <div className="my-1">
                <Bar p={p / target} color={done ? '#f5b92b' : '#5cb82e'} />
              </div>
              <div className="text-[11px] text-[#8a6a44]">
                {done ? `All tiers done. ${fmtNum(a.progress(s))} ${a.unit}.` : `${fmtNum(p)}/${fmtNum(target)} ${a.unit}`}
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
        <p className="py-6 text-center text-sm text-[#8a6a44]">You finished every goal. Great farming!</p>
      ) : (
        <div className="flex flex-col gap-2">
          {list.map((q) => {
            const p = Math.min(q.target, q.progress(s));
            const done = p >= q.target;
            return (
              <div key={q.id} className={`card p-3 ${done ? 'ring-2 ring-[#5cb82e]' : ''}`}>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold">{q.text}</span>
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
                    Claim
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
            <div className="text-[11px] text-[#8a6a44]">{l}</div>
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
      <span className="font-bold">{label}</span>
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
      <span className="font-bold">Graphics quality</span>
      <span className="flex gap-1">
        {(['high', 'low'] as const).map((v) => (
          <button key={v} className={`btn px-3 py-1 text-sm ${q === v ? 'btn-green' : 'btn-wood'}`} onClick={() => pick(v)}>
            {v === 'high' ? 'High' : 'Low'}
          </button>
        ))}
      </span>
    </div>
  );
}

// Animal art style. The sculpts are built once per page, so switching saves and reloads.
function StylePicker() {
  const store = useStore();
  const [a] = useState<ArtStyle>(artStyle);
  const pick = (v: ArtStyle) => {
    if (v === a) return;
    store.saveNow();
    setArtStyle(v);
    window.location.reload();
  };
  return (
    <div className="card flex w-full items-center justify-between gap-2 p-3">
      <span className="font-bold">Animal style</span>
      <span className="flex gap-1">
        {(['toon', 'real'] as const).map((v) => (
          <button key={v} className={`btn px-3 py-1 text-sm ${a === v ? 'btn-green' : 'btn-wood'}`} onClick={() => pick(v)}>
            {v === 'toon' ? 'Cartoon' : 'Realistic'}
          </button>
        ))}
      </span>
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
    <Modal title="Settings" icon="⚙️" onClose={() => store.openPanel(null)}>
      <div className="flex flex-col gap-2">
        <Toggle label="Sound effects" on={st.sound} onChange={(v) => set('sound', v)} />
        <Toggle label="Day and night cycle" on={st.dayNight} onChange={(v) => set('dayNight', v)} />
        <Toggle label="Clouds" on={st.clouds} onChange={(v) => set('clouds', v)} />
        <Toggle label="Music" on={st.music} onChange={(v) => set('music', v)} />
        <Toggle label="Weather and seasons" on={st.weather} onChange={(v) => set('weather', v)} />
        <Toggle label="Soft shadows (turn off on slow phones)" on={st.shadows} onChange={(v) => set('shadows', v)} />
        <QualityPicker />
        <StylePicker />
      </div>

      <h3 className="mb-2 mt-4 font-bold">Save data</h3>
      <p className="mb-2 text-xs text-[#8a6a44]">Your farm saves automatically in this browser. Use a save code to move it to another device.</p>
      <div className="flex flex-wrap gap-2">
        <button
          className="btn btn-blue"
          onClick={() => {
            setCode(store.exportSave());
            setMode('export');
            setCopied(false);
          }}
        >
          Export code
        </button>
        <button
          className="btn btn-wood"
          onClick={() => {
            setCode('');
            setMode('import');
          }}
        >
          Import code
        </button>
        <button className="btn btn-red" onClick={() => setMode('reset')}>
          Start over
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
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      )}
      {mode === 'import' && (
        <div className="mt-3">
          <textarea value={code} onChange={(e) => setCode(e.target.value)} placeholder="Paste your save code here" className="h-24 w-full select-text rounded-xl border-2 border-[#e2cc9c] bg-white p-2 font-mono text-[10px]" />
          <button className="btn btn-green mt-1" disabled={!code.trim()} onClick={() => store.importSave(code)}>
            Load farm
          </button>
        </div>
      )}
      {mode === 'reset' && (
        <div className="card mt-3 border-[#e0533d] p-3 text-center">
          <p className="mb-2 text-sm font-bold">This deletes your whole farm. Are you sure?</p>
          <div className="flex justify-center gap-2">
            <button className="btn btn-ghost" onClick={() => setMode('none')}>
              Keep farm
            </button>
            <button className="btn btn-red" onClick={() => store.reset()}>
              Yes, start over
            </button>
          </div>
        </div>
      )}

      <h3 className="mb-1 mt-4 font-bold">How to play</h3>
      <ul className="list-disc space-y-0.5 pl-5 text-xs text-[#8a6a44]">
        <li>Drag to move around, pinch or scroll to zoom. Twist with two fingers, the rotate button or Q and E to turn the camera.</li>
        <li>Press and drag across ready fields to harvest them all.</li>
        <li>Hold anything for a moment to move it.</li>
        <li>Tap the order board for orders, the farmhouse for goals, the barn and silo for storage.</li>
        <li>Tap land with a sign to expand your farm.</li>
        <li>Fruit trees keep giving fruit, no replanting needed.</li>
        <li>Your stall and the cargo boat pay more than selling from storage.</li>
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
    <Modal title="Level Up!" icon="⭐" onClose={close}>
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
            <div className="text-sm font-bold text-[#8a6a44]">New things unlocked</div>
            <div className="flex flex-wrap justify-center gap-2">
              {list.map((x) => (
                <div key={x.name} className="card flex w-20 flex-col items-center p-2">
                  <span className="emoji text-3xl"><Ico i={x.icon} /></span>
                  <span className="text-[11px] font-bold leading-tight">{x.name}</span>
                </div>
              ))}
            </div>
          </>
        )}
        <button className="btn btn-green px-10 py-3 text-lg" onClick={close}>
          Continue
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
    <Modal title="Daily Gift" icon="🎁" onClose={close}>
      <p className="mb-3 text-center text-sm text-[#8a6a44]">Come back every day. Day 7 has the biggest gift.</p>
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
        {Array.from({ length: 7 }).map((_, i) => {
          const r = dailyReward(i + 1);
          const day = i + 1;
          const past = day < today;
          const cur = day === today;
          return (
            <div key={i} className={`card flex flex-col items-center gap-0.5 p-2 text-xs ${cur ? 'ring-2 ring-[#f5b92b]' : ''} ${past ? 'opacity-50' : ''}`}>
              <span className="whitespace-nowrap font-bold">Day {day}</span>
              <span className="emoji text-2xl">{past ? '✅' : day === 7 ? '💰' : '🎁'}</span>
              <Coins n={r.coins} />
              {r.gems > 0 && <Gems n={r.gems} />}
            </div>
          );
        })}
      </div>
      <div className="mt-4 flex justify-center">
        <button className="btn btn-green px-10 py-3 text-lg" disabled={!can} onClick={() => store.claimDaily()}>
          {can ? 'Claim' : 'Come back tomorrow'}
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
    <Modal title="Expand Farm" icon="🪧" onClose={close}>
      <div className="flex flex-col items-center gap-3 text-center">
        <span className="emoji text-5xl">🌳</span>
        <p className="text-sm text-[#8a6a44]">Buy this land to grow your farm. New land may have trees and rocks to clear.</p>
        <div className="flex items-center gap-4 text-lg font-bold">
          <Coins n={info.cost} />
          {s.level < info.level && <Lock level={info.level} />}
        </div>
        <button className="btn btn-green px-10 py-3 text-lg" disabled={!valid || s.level < info.level || s.coins < info.cost} onClick={() => store.expand()}>
          Buy land
        </button>
      </div>
    </Modal>
  );
}

