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
  dict = l === 'en' ? {} : (await LOADERS[l]()).default;
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
  try { await setLang(l); } catch { current = 'en'; dict = {}; applyDocument('en'); }
}

export function onLang(f: () => void) {
  listeners.add(f);
  return () => { listeners.delete(f); };
}

// a line in the chosen language; {name} marks are filled from `vars`
export function t(s: string, vars?: Record<string, string | number>) {
  const out = dict[s] ?? s;
  return vars ? out.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m)) : out;
}
