// Phone notifications, in the Android app only. When the game goes to the background the phone is
// told when things on the farm will be ready: fields, pens, workshops, fruit trees, a bite on the
// line, a pet back from its search, and the next day's gift. Only a few: things ready close
// together share one notification, two never come close together, none come at night (they wait
// for the morning), and coming back to the game takes them all away again. Nothing comes from a
// server: the phone keeps the times. They are only sent once the player said yes to them.
import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { ANIMAL, BUILDING } from './data';
import { GRAZE, PET_IDS, PET_SEARCH_MS, dailyReward, petFed, plotProgress, todayKey, treeInfo, type GameState } from './state';
import { t } from './i18n';

export type NotifyKind = 'crops' | 'animals' | 'goods' | 'trees' | 'fish' | 'pet' | 'daily';
export interface FarmEvent { at: number; kind: NotifyKind; name?: string }
export interface Planned { at: number; kinds: NotifyKind[]; names: string[] }

const MIN_LEAD = 5 * 60e3; // nothing sooner than this after leaving the game
const WINDOW = 15 * 60e3; // things ready within this of the first share its notification
const GAP = 45 * 60e3; // two notifications are at least this far apart
const MAX = 4; // and there are no more than this many
// no notifications at night: they wait for the morning, and come with the next day's gift
const QUIET_FROM = 22, QUIET_TO = 9;
const ICON: Record<NotifyKind, string> = { crops: '🌾', animals: '🥚', goods: '🧺', trees: '🍎', fish: '🎣', pet: '🐾', daily: '🎁' };

export const notifyNative = () => Capacitor.isNativePlatform();

// when each thing on the farm that is not ready yet will be (things ready already are not told:
// they were there to see when the game was left)
export function farmEvents(s: GameState, now: number): FarmEvent[] {
  const ev: FarmEvent[] = [];
  for (const o of s.objects) {
    if (o.plot) {
      const pp = plotProgress(o, now);
      if (pp.crop && !pp.ready) ev.push({ at: now + pp.remaining, kind: 'crops' });
    }
    if (o.prod) for (const e of o.prod.queue) if (e.endsAt > now) ev.push({ at: e.endsAt, kind: 'goods' });
    if (o.tree) {
      const ti = treeInfo(o, now);
      if (!ti.ready) ev.push({ at: now + ti.remaining, kind: 'trees' });
    }
    if (o.pen) {
      const an = ANIMAL[BUILDING[o.type]?.animal ?? ''];
      if (!an) continue;
      const time = an.time * 1000, eat = an.id === 'bee' ? GRAZE.beeEatMs : GRAZE.eatMs;
      for (const a of o.pen.animals) {
        if (a.fedAt !== null) { if (a.fedAt + time > now) ev.push({ at: a.fedAt + time, kind: 'animals' }); }
        // out grazing: home and fed after the trip, and ready a full time after that
        else if (a.graze && a.graze.back === undefined) ev.push({ at: a.graze.at + 2 * GRAZE.walkMs + eat + time, kind: 'animals' });
      }
    }
  }
  for (const f of [s.fishing, s.seaFishing]) if (f?.open && f.catchAt !== null && f.catchAt > now) ev.push({ at: f.catchAt, kind: 'fish' });
  // a fed pet back from its search (the same day: a find not brought by midnight is not brought)
  for (const id of PET_IDS) {
    const p = s.pets?.[id];
    if (!p || !petFed(p) || p.giftDay === todayKey()) continue;
    const at = p.fedAt + PET_SEARCH_MS;
    if (at > now && todayKey(new Date(at)) === todayKey(new Date(now))) ev.push({ at, kind: 'pet', name: p.name });
  }
  // tomorrow's gift
  const d = new Date(now); d.setDate(d.getDate() + 1); d.setHours(QUIET_TO, 0, 0, 0);
  ev.push({ at: d.getTime(), kind: 'daily' });
  return ev;
}

// a time moved out of the night, to the morning
export function outOfQuiet(at: number) {
  const d = new Date(at), h = d.getHours();
  if (h >= QUIET_TO && h < QUIET_FROM) return at;
  if (h >= QUIET_FROM) d.setDate(d.getDate() + 1);
  d.setHours(QUIET_TO, 0, 0, 0);
  return d.getTime();
}

// the notifications to leave with the phone: things ready close together share one (told once the
// last of them is ready), and a few at most (the gift kept among them)
export function notifyPlan(s: GameState, now: number): Planned[] {
  const ev = farmEvents(s, now)
    .map((e) => ({ ...e, at: outOfQuiet(Math.max(e.at, now + MIN_LEAD)) }))
    .sort((a, b) => a.at - b.at);
  const out: (Planned & { first: number })[] = [];
  for (const e of ev) {
    const last = out[out.length - 1];
    if (!last || e.at > last.first + WINDOW) {
      const at = last ? outOfQuiet(Math.max(e.at, last.at + GAP)) : e.at;
      out.push({ first: at, at, kinds: [], names: [] });
    }
    const g = out[out.length - 1];
    g.at = Math.max(g.at, e.at);
    if (!g.kinds.includes(e.kind)) g.kinds.push(e.kind);
    if (e.name && !g.names.includes(e.name)) g.names.push(e.name);
  }
  const daily = out.find((g) => g.kinds.includes('daily'));
  const keep = out.slice(0, MAX);
  if (daily && !keep.includes(daily)) keep[MAX - 1] = daily;
  return keep.map(({ at, kinds, names }) => ({ at, kinds, names }));
}

// what a notification says, in the chosen language
export function notifyText(g: Planned, s: GameState): { title: string; body: string } {
  if (g.kinds.length > 1) return { title: t('Lots of things are ready on your farm! 🚜'), body: `${g.kinds.map((k) => ICON[k]).join(' ')} ${t('Come and see what is waiting.')}` };
  switch (g.kinds[0]) {
    case 'crops': return { title: t('Your crops are ready! 🌾'), body: t('Come and harvest your fields.') };
    case 'animals': return { title: t('Your animals have goods for you! 🥚'), body: t('Come and collect from your pens.') };
    case 'goods': return { title: t('Your goods are ready! 🧺'), body: t('Your workshops have finished.') };
    case 'trees': return { title: t('Your fruit trees are full! 🍎'), body: t('Come and pick the fruit.') };
    case 'fish': return { title: t('Something is biting! 🎣'), body: t('Come and reel it in.') };
    case 'pet': return {
      title: g.names.length === 1 ? t('{name} is back with a find! 🐾', { name: g.names[0] }) : t('Your pets are back with their finds! 🐾'),
      body: t('Come and see what they brought.'),
    };
    default: return {
      title: t('Your daily gift is waiting! 🎁'),
      body: s.lastDaily === todayKey() ? t('Day {n} is ready: come back to keep your streak.', { n: dailyReward(s.streak + 1).day }) : t('Come and open it.'),
    };
  }
}

// one call to the phone at a time, in order (leaving and coming back can follow each other fast)
let queue: Promise<unknown> = Promise.resolve();
const run = (f: () => Promise<unknown>) => (queue = queue.then(f).catch(() => undefined));

let channel = false;
async function ensureChannel() {
  if (channel) return;
  await LocalNotifications.createChannel({ id: 'farm', name: t('Farm news'), description: t('When things on your farm are ready'), importance: 3, visibility: 1 });
  channel = true;
}

// back in the game: the notifications still to come, and those shown, are taken away
export function notifyBack() {
  if (!notifyNative()) return;
  run(async () => {
    const p = await LocalNotifications.getPending();
    if (p.notifications.length) await LocalNotifications.cancel({ notifications: p.notifications.map((n) => ({ id: n.id })) });
    await LocalNotifications.removeAllDeliveredNotifications();
  });
}

// leaving the game: the phone is told when things will be ready
export function notifyAway(s: GameState) {
  if (!notifyNative()) return;
  notifyBack();
  if (!s.settings.notify) return;
  const plan = notifyPlan(s, Date.now());
  run(async () => {
    if ((await LocalNotifications.checkPermissions()).display !== 'granted' || !plan.length) return;
    await ensureChannel();
    await LocalNotifications.schedule({
      notifications: plan.map((g, i) => ({
        id: 7101 + i, ...notifyText(g, s),
        schedule: { at: new Date(g.at), allowWhileIdle: true },
        // an alarm to the minute needs a permission from the phone's settings: a farm can wait a little
        isExactNotification: false,
        channelId: 'farm', smallIcon: 'ic_stat_farm', iconColor: '#5cb82e', autoCancel: true,
      })),
    });
  });
}

// the phone's yes or no for notifications (asked for when it was never answered)
export async function askNotify() {
  if (!notifyNative()) return false;
  try {
    let p = await LocalNotifications.checkPermissions();
    if (p.display !== 'granted' && p.display !== 'denied') p = await LocalNotifications.requestPermissions();
    return p.display === 'granted';
  } catch {
    return false;
  }
}

// whether the game asked on this phone yet (the question is asked once, a while into playing)
const ASKED = 'talons-farm-notify-asked';
export const notifyAsked = () => { try { return !!localStorage.getItem(ASKED); } catch { return true; } };
export const setNotifyAsked = () => { try { localStorage.setItem(ASKED, '1'); } catch { /* storage blocked */ } };
