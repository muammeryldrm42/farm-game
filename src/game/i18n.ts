// Languages. The English text is the key: t('Sound effects') shows the chosen language's
// translation, or the English when a line has none yet. Translations live in src/locales/<id>.json
// (one file per language, loaded only when chosen) and the choice is kept per device, like the
// graphics quality, so saves are untouched. Inside YouTube the game starts in the player's YouTube
// language, and a language picked in the game holds until it is closed.
import { kvGet, kvSet } from './kv';
import { inYouTube, ytLanguage } from './yt';

export type Lang = 'en' | 'zh' | 'zht' | 'es' | 'ja' | 'ko' | 'de' | 'fr' | 'it' | 'pt' | 'ru' | 'tr' | 'ar' | 'id' | 'th' | 'vi' | 'pl' | 'nl' | 'hi' | 'bn' | 'ur';
// zh: Simplified Chinese, zht: Traditional Chinese
export const LANG_IDS: Lang[] = ['en', 'zh', 'zht', 'es', 'ja', 'ko', 'de', 'fr', 'it', 'pt', 'ru', 'tr', 'ar', 'id', 'th', 'vi', 'pl', 'nl', 'hi', 'bn', 'ur'];

type Dict = Record<string, string>;
const LOADERS: Record<Exclude<Lang, 'en'>, () => Promise<{ default: Dict }>> = {
  zh: () => import('../locales/zh.json'),
  zht: () => import('../locales/zht.json'),
  es: () => import('../locales/es.json'),
  ja: () => import('../locales/ja.json'),
  ko: () => import('../locales/ko.json'),
  de: () => import('../locales/de.json'),
  fr: () => import('../locales/fr.json'),
  it: () => import('../locales/it.json'),
  pt: () => import('../locales/pt.json'),
  ru: () => import('../locales/ru.json'),
  tr: () => import('../locales/tr.json'),
  ar: () => import('../locales/ar.json'),
  id: () => import('../locales/id.json'),
  th: () => import('../locales/th.json'),
  vi: () => import('../locales/vi.json'),
  pl: () => import('../locales/pl.json'),
  nl: () => import('../locales/nl.json'),
  hi: () => import('../locales/hi.json'),
  bn: () => import('../locales/bn.json'),
  ur: () => import('../locales/ur.json'),
};

// English names a count in two forms (1 coin, 2 coins): the lines with a count that can be 1 say
// so here (see plurals below); every other English line is its own key
const coins = (v: string) => `{${v}, plural, one {# coin} other {# coins}}`;
const gems = (v: string) => `{${v}, plural, one {# gem} other {# gems}}`;
const points = (v: string) => `{${v}, plural, one {# point} other {# points}}`;
const EN: Dict = {
  '+{n} coins': `+${coins('n')}`,
  'Chapter {n} complete! +{coins} coins': `Chapter {n} complete! +${coins('coins')}`,
  'Chapter {n} complete! +{coins} coins, +{gems} gems': `Chapter {n} complete! +${coins('coins')}, +${gems('gems')}`,
  'Daily reward: {coins} coins and {gems} gems.': `Daily reward: ${coins('coins')} and ${gems('gems')}.`,
  'Daily reward: {coins} coins.': `Daily reward: ${coins('coins')}.`,
  'Next: {level} at {n} points (+{bonus}% and {gems} gems)': `Next: {level} at ${points('n')} (+{bonus}% and ${gems('gems')})`,
  'Sold {name} for {n} coins.': `Sold {name} for ${coins('n')}.`,
  'Storage price is {base} coins. You can ask up to {max}.': `Storage price is ${coins('base')}. You can ask up to {max}.`,
  'Well rested! +{n} coins, +10 XP': `Well rested! +${coins('n')}, +10 XP`,
  'Your farm is now {level}! Customers pay {n}% more. +{gems} gems': `Your farm is now {level}! Customers pay {n}% more. +${gems('gems')}`,
  '{name} brought another {find}. You sell it for {n} coins.': `{name} brought another {find}. You sell it for ${coins('n')}.`,
  '{name} complete! +{coins} coins, +{gems} gems': `{name} complete! +${coins('coins')}, +${gems('gems')}`,
  '{n} beauty points': '{n, plural, one {# beauty point} other {# beauty points}}',
  '{n} bees full of nectar': '{n, plural, one {# bee full of nectar} other {# bees full of nectar}}',
  '{n} points': points('n'),
  '{n} tasks left': '{n, plural, one {# task left} other {# tasks left}}',
};

const KEY = 'talons-farm-lang';
export const RTL = new Set<Lang>(['ar', 'ur']);
let current: Lang = 'en';
let dict: Dict = {};
const listeners = new Set<() => void>();

// the device's (or YouTube's) language on the first start, English when it is not one of ours
function guess(tag?: string | null): Lang {
  if (!tag && typeof navigator === 'undefined') return 'en';
  const nav = (tag || navigator.language || 'en').toLowerCase().replace(/_/g, '-');
  // Traditional Chinese: Taiwan, Hong Kong, Macau or an explicit Hant script
  if (nav.startsWith('zh') && /hant|tw|hk|mo/.test(nav)) return 'zht';
  // (Indonesian may come as its old code, 'in')
  const base = nav.split('-')[0].replace(/^in$/, 'id');
  return (LANG_IDS as string[]).includes(base) ? (base as Lang) : 'en';
}

export function getLang(): Lang { return current; }

function applyDocument(l: Lang) {
  if (typeof document === 'undefined') return;
  // (as the browser knows the languages: Chinese by its script, which also picks the right shapes
  // of the characters)
  document.documentElement.lang = l === 'zht' ? 'zh-Hant' : l === 'zh' ? 'zh-Hans' : l;
  // The browser's own page translation stays off (layout.tsx) while the game speaks the player's
  // language: it would translate the farm again (say, Turkish taken for English) and leave its
  // numbers frozen as they change. Left to it only for a farm in English on a device in a
  // language the game does not have.
  const dev = typeof navigator === 'undefined' ? 'en' : navigator.language || 'en';
  document.documentElement.translate = l === 'en' && !/^en\b/i.test(dev) && guess() === 'en';
  // Arabic and Urdu read right to left: the panels follow, the 3D farm and the HUD layout stay
  document.documentElement.dataset.rtl = RTL.has(l) ? '1' : '';
}

export async function setLang(l: Lang) {
  dict = l === 'en' ? EN : (await LOADERS[l]()).default;
  current = l;
  if (!inYouTube()) kvSet(KEY, l);
  applyDocument(l);
  listeners.forEach((f) => f());
}

// called once before the game shows: the saved language (or the device's) is loaded
export async function initLang() {
  const yt = await ytLanguage();
  const saved = yt ? null : kvGet(KEY);
  const l = saved && (LANG_IDS as string[]).includes(saved) ? (saved as Lang) : guess(yt);
  try { await setLang(l); } catch { current = 'en'; dict = EN; applyDocument('en'); }
}

export function onLang(f: () => void) {
  listeners.add(f);
  return () => { listeners.delete(f); };
}

// a line in the chosen language; {name} marks are filled from `vars`
export function t(s: string, vars?: Record<string, string | number>) {
  let out = dict[s] ?? s;
  if (!vars) return out;
  if (out.includes(', plural,')) out = plurals(out, vars);
  if (current === 'fr') return out.replace(ELIDE, (m, w: string | undefined, k1: string | undefined, k2: string) => {
    const k = k1 ?? k2;
    if (!(k in vars)) return m;
    const v = String(vars[k]);
    return w && VOWEL.test(v) ? `${w.slice(0, w.length - 1)}'${v}` : (w ? `${w} ` : '') + v;
  });
  return out.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m));
}

// French drops the vowel of de, le, que... before a word starting with one: graines d'Avocat,
// not de Avocat (the h is left alone: it is silent in some words and not in others)
const ELIDE = /(?<!\p{L})(de|De|le|Le|la|La|que|Que|ne|jusque|lorsque|puisque) \{(\w+)\}|\{(\w+)\}/gu;
const VOWEL = /^[aeiouyàâäæéèêëîïôöœùûüÿ]/i;

// A translation may give a word in the forms its language uses for different numbers, as
// {n, plural, one {...} few {...} many {...} other {...}} (# stands for the number): Russian says
// 1 монета, 2 монеты, 5 монет, 21 монета, where one form for all would be wrong for most numbers.
// The language's own rules pick the form (the browser knows them); a number shortened to 12.3K,
// 4M or 2B takes the form for many.
let pluralRules: { lang: Lang; rules: Intl.PluralRules | null } | null = null;
function pluralOf(raw: string): string {
  if (!pluralRules || pluralRules.lang !== current) {
    let rules: Intl.PluralRules | null = null;
    try { rules = new Intl.PluralRules(current === 'zht' ? 'zh-Hant' : current); } catch { /* no rules: the other form */ }
    pluralRules = { lang: current, rules };
  }
  if (/[KMBT]$/.test(raw)) return 'many';
  const n = Number(raw.replace(/,/g, ''));
  return Number.isFinite(n) && pluralRules.rules ? pluralRules.rules.select(n) : 'other';
}
function plurals(out: string, vars: Record<string, string | number>) {
  for (let at = out.indexOf(', plural,'); at >= 0; at = out.indexOf(', plural,')) {
    const open = out.lastIndexOf('{', at);
    const name = out.slice(open + 1, at).trim();
    const cases: Record<string, string> = {};
    let j = at + ', plural,'.length;
    for (;;) {
      while (out[j] === ' ') j++;
      if (j >= out.length || out[j] === '}') break;
      const c0 = j;
      while (j < out.length && out[j] !== ' ' && out[j] !== '{') j++;
      const cat = out.slice(c0, j);
      while (out[j] === ' ') j++;
      // not as expected: the line is left as written
      if (out[j] !== '{') return out;
      let depth = 0, k = j;
      for (; k < out.length; k++) { if (out[k] === '{') depth++; else if (out[k] === '}' && --depth === 0) break; }
      cases[cat] = out.slice(j + 1, k);
      j = k + 1;
    }
    // a case for one exact number (=0) before the language's own forms
    const v = String(vars[name] ?? '');
    const text = (cases['=' + v.replace(/,/g, '')] ?? cases[pluralOf(v)] ?? cases.other ?? '').replace(/#/g, v);
    out = out.slice(0, open) + text + out.slice(j + 1);
  }
  return out;
}
