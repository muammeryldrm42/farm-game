// The farm story: one chapter per level. A chapter is told by one of the valley folk in a few
// speech bubbles, and asks for two or three tasks built from what that level unlocks (a new
// crop to grow, a new animal home, a workshop, a recipe, a catch, a tree or a decoration).
// Chapters are plain data made from the game tables, so saves only keep which chapter is on.
import { ANIMALS, BUILDINGS, CATCHES, CROPS, ITEMS, RECIPES, type BuildingDef } from './data';

export const CAST = {
  grandpa: { name: 'Grandpa Walt', icon: '👴', color: '#8a5a2b' },
  bramble: { name: 'Mayor Bramble', icon: '🧔', color: '#6a4a9a' },
  ivy: { name: 'Ivy the Gardener', icon: '👩‍🌾', color: '#3a8a36' },
  maya: { name: 'Doc Maya', icon: '👩‍⚕️', color: '#2f7fc0' },
  rosie: { name: 'Rosie the Baker', icon: '👩‍🍳', color: '#d0507a' },
  marco: { name: 'Chef Marco', icon: '👨‍🍳', color: '#c0602a' },
  finn: { name: 'Captain Finn', icon: '👨‍✈️', color: '#1f6a8a' },
  hazel: { name: 'Professor Hazel', icon: '🧑‍🔬', color: '#4a7a6a' },
} as const;
export type CastId = keyof typeof CAST;

// stat: a counter in the save that must grow by `target` during the chapter; count: owning that
// many of a building; fishing: the fishing spot is open
export interface StoryTask { id: string; icon: string; text: string; target: number; kind: 'stat' | 'count' | 'fishing'; key: string }
export interface Chapter { n: number; title: string; who: CastId; intro: string[]; outro: string; tasks: StoryTask[] }

// a steady pseudo random pick, so a chapter always reads the same
const pick = <T,>(list: readonly T[], n: number, salt = 0) => list[Math.abs(Math.imul(n * 7919 + salt * 104729, 2654435761)) % list.length];
const an = (w: string) => (/^[aeiou]/i.test(w) ? 'an' : 'a');

type Draft = { who: CastId; task: Omit<StoryTask, 'id'>; line: string; title: string };

function drafts(level: number): Draft[] {
  const out: Draft[] = [];
  const add = (d: Draft) => out.push(d);
  const n = level;
  // new homes for animals come first, then workshops, trees, crops, recipes, catches, decorations
  for (const a of ANIMALS) {
    if (a.level !== level) continue;
    const home = BUILDINGS.find((b) => b.id === a.house);
    const prod = ITEMS[a.product];
    const who: CastId = level >= 60 && n % 2 ? 'hazel' : 'maya';
    if (home && home.level === level) {
      add({
        who,
        task: { icon: home.icon, text: `Build ${an(home.name)} ${home.name}`, target: 1, kind: 'count', key: home.id },
        line: pick([
          `${an(a.name) === 'an' ? 'An' : 'A'} ${a.name} family is looking for a new home. Build them ${an(home.name)} ${home.name}?`,
          `I have been caring for some ${a.name} friends, and they need a home. ${an(home.name) === 'an' ? 'An' : 'A'} ${home.name} would be perfect!`,
          `Word is out that your farm is the kindest in the valley. Some ${a.name} friends want to move in!`,
        ], n, 1),
        title: pick([`A Home for the ${a.name}`, `New Neighbors`, `The ${home.name}`], n, 2),
      });
    }
    add({
      who,
      task: { icon: prod.icon, text: `Collect ${prod.name} ×3`, target: 3, kind: 'stat', key: `collect:${a.product}` },
      line: pick([
        `Keep them fed and happy and they will give you lovely ${prod.name}.`,
        `Happy animals give the best ${prod.name}. Bring me a little when you can!`,
      ], n, 3),
      title: `The ${a.name}`,
    });
  }
  for (const b of BUILDINGS) {
    if (b.level !== level || !b.buyable) continue;
    if (b.kind === 'production') {
      add({
        who: b.id === 'bakery' ? 'rosie' : 'marco',
        task: { icon: b.icon, text: `Build ${an(b.name)} ${b.name}`, target: 1, kind: 'count', key: b.id },
        line: pick([
          `Imagine ${an(b.name)} ${b.name} right here on your farm! Build one and I will share my secrets.`,
          `The valley has been waiting for ${an(b.name)} ${b.name}. You are just the farmer to build it.`,
          `With ${an(b.name)} ${b.name}, your harvest turns into something special. Shall we?`,
        ], n, 4),
        title: pick([`The New ${b.name}`, `Grand Opening`, `${b.name} Dreams`], n, 5),
      });
    } else if (b.kind === 'pen' && !ANIMALS.some((a) => a.house === b.id && a.level === level)) {
      add({
        who: 'maya',
        task: { icon: b.icon, text: `Build ${an(b.name)} ${b.name}`, target: 1, kind: 'count', key: b.id },
        line: `A new animal home is ready to build: the ${b.name}!`,
        title: `The ${b.name}`,
      });
    }
  }
  for (const b of BUILDINGS) {
    if (b.level !== level || b.kind !== 'tree') continue;
    const fruit = b.fruit ? ITEMS[b.fruit] : null;
    add({
      who: n % 3 ? 'ivy' : 'grandpa',
      task: { icon: b.icon, text: `Plant ${an(b.name)} ${b.name}`, target: 1, kind: 'count', key: b.id },
      line: pick([
        `When I was young, we had ${an(b.name)} ${b.name} by the old fence. Plant one for me?`,
        `Saplings of ${b.name} just arrived at the nursery. ${fruit ? `The ${fruit.name} is delicious!` : 'They grow so fast!'}`,
        `A farm needs trees, and ${an(b.name)} ${b.name} would look wonderful here.`,
      ], n, 6),
      title: pick([`Roots and Branches`, `The ${b.name}`, `An Orchard Grows`], n, 7),
    });
  }
  for (const c of CROPS) {
    if (c.level !== level) continue;
    const it = ITEMS[c.id];
    add({
      who: n % 4 === 1 ? 'grandpa' : 'ivy',
      task: { icon: it.icon, text: `Harvest ${it.name} ×4`, target: 4, kind: 'stat', key: `harvest:${c.id}` },
      line: pick([
        `Fresh ${it.name} seeds just came in, and this valley soil will love them!`,
        `I saved you a pouch of ${it.name} seeds. Plant them, water them and watch them grow.`,
        `Have you grown ${it.name} yet? The market folks keep asking for it.`,
      ], n, 8),
      title: pick([`Seeds of ${it.name}`, `The ${it.name} Patch`, `Something New to Grow`], n, 9),
    });
  }
  for (const r of RECIPES) {
    if (r.level !== level) continue;
    const it = ITEMS[r.id];
    const at = BUILDINGS.find((b) => b.id === r.building);
    add({
      who: r.building === 'bakery' ? 'rosie' : n % 2 ? 'marco' : 'rosie',
      task: { icon: it.icon, text: `Make ${it.name} ×${2 * r.qty}`, target: 2 * r.qty, kind: 'stat', key: `make:${r.id}` },
      line: pick([
        `I just wrote down a new recipe: ${it.name}! ${at ? `Your ${at.name} can make it.` : ''}`.trim(),
        `Everyone at the market is talking about ${it.name}. Make some and bring me a taste!`,
      ], n, 10),
      title: pick([`${it.name} Day`, `A New Recipe`, `The Secret of ${it.name}`], n, 11),
    });
  }
  for (const [id, lv] of CATCHES) {
    if (lv !== level || id === 'fish') continue;
    const it = ITEMS[id];
    add({
      who: 'finn',
      task: { icon: '🎣', text: 'Catch anything ×3', target: 3, kind: 'stat', key: 'fish' },
      line: pick([
        `The tide is strange today. I spotted ${it.name} near the pier. Cast your line and see what bites!`,
        `Sailors say ${it.name} swims close to shore this season. Lucky you!`,
      ], n, 12),
      title: pick(['Something Is Biting', 'Tales of the Tide'], n, 13),
    });
  }
  for (const b of BUILDINGS) {
    if (b.level !== level || b.kind !== 'deco' || !b.buyable) continue;
    add({
      who: 'bramble',
      task: { icon: b.icon, text: `Place ${an(b.name)} ${b.name}`, target: 1, kind: 'count', key: b.id },
      line: pick([
        `The town council loves your farm. How about ${an(b.name)} ${b.name} to make it shine?`,
        `Visitors keep stopping by! ${an(b.name) === 'an' ? 'An' : 'A'} ${b.name} would give them something to smile about.`,
      ], n, 14),
      title: pick(['A Touch of Charm', `The ${b.name}`], n, 15),
    });
  }
  // the bigger systems
  const sys = (kind: BuildingDef['kind']) => BUILDINGS.find((b) => b.kind === kind && b.level === level);
  const stall = sys('stall');
  if (stall) add({ who: 'bramble', task: { icon: stall.icon, text: `Build the ${stall.name}`, target: 1, kind: 'count', key: stall.id }, line: 'Villagers would love to buy straight from your farm. A roadside stall is just the thing!', title: 'Open for Business' });
  const dock = sys('dock');
  if (dock) add({ who: 'finn', task: { icon: dock.icon, text: `Build the ${dock.name}`, target: 1, kind: 'count', key: dock.id }, line: 'Ahoy! My cargo boat could stop at your farm, if only you had a dock.', title: 'A Boat on the Horizon' });
  if (level === 5) add({ who: 'finn', task: { icon: '🎣', text: 'Open the fishing spot', target: 1, kind: 'fishing', key: '' }, line: 'The lake in the woods has the best fishing in the valley. Open your fishing spot!', title: 'Gone Fishing' });
  return out;
}

// milestone chapters carry the main tale: the farm, the Harvest Fair and the Golden Nest
const MILESTONES: Record<number, { title: string; who: CastId; lines: string[]; outro: string; task?: Omit<StoryTask, 'id'> }> = {
  1: { title: 'A New Beginning', who: 'grandpa', lines: ['There you are! Welcome to Talon Valley. This old farm is yours now.', 'My knees are too old for the fields, but yours are not. Let us wake this place up!'], outro: 'Look at that, the farm is breathing again. I knew you could do it!' },
  2: { title: 'The Order Board', who: 'bramble', lines: ['Welcome, new farmer! I am Mayor Bramble.', 'The town has missed fresh food from this farm. Every order you deliver brings the valley back to life.'], outro: 'Splendid! The townsfolk are already smiling again.', task: { icon: '📋', text: 'Deliver orders ×2', target: 2, kind: 'stat', key: 'orders' } },
  5: { title: 'Gone Fishing', who: 'finn', lines: ['Ahoy there! Captain Finn, at your service.', 'Your grandpa and I used to fish off the lake jetty every morning.'], outro: 'A natural! The lake will be good to you.', task: { icon: '🎣', text: 'Open the fishing spot', target: 1, kind: 'fishing', key: '' } },
  10: { title: 'The Valley Wakes Up', who: 'bramble', lines: ['The whole town is talking about your farm!', 'Shops are opening again and children play in the square. That is your doing.'], outro: 'Talon Valley has not looked this lively in years.' },
  15: { title: 'Old Photographs', who: 'grandpa', lines: ['I found an old photo of this farm, full of animals and flowers.', 'We are getting close to how it used to be. Closer every day.'], outro: 'This old heart is very happy today.' },
  20: { title: 'Market Day', who: 'rosie', lines: ['Guess what? The market is back every Saturday!', 'I told everyone the best goods come from your farm.'], outro: 'Sold out before noon! Your goods are the talk of the market.', task: { icon: '🏪', text: 'Sell at your stall ×3', target: 3, kind: 'stat', key: 'stall' } },
  25: { title: 'The Harvest Fair', who: 'bramble', lines: ['Big news! For the first time in years, we will hold the Harvest Fair.', 'And I want your farm to be its shining star.'], outro: 'What a fair! People came from three valleys away.', task: { icon: '📋', text: 'Deliver orders ×5', target: 5, kind: 'stat', key: 'orders' } },
  30: { title: 'A Letter from the Coast', who: 'finn', lines: ['I brought a letter from the coast towns. They want to trade with you!', 'Your name is starting to travel over the sea.'], outro: 'The coast towns send their thanks, and their coins!' },
  40: { title: 'Doc Maya\'s Clinic', who: 'maya', lines: ['I finally opened my animal clinic in town.', 'Half of my patients are healthy, happy animals from your farm, just in for a check up!'], outro: 'Your animals are the healthiest in the valley.' },
  50: { title: 'Fair Champion', who: 'bramble', lines: ['The judges have decided: your farm is the Harvest Fair champion!', 'Here is a ribbon for the barn door.'], outro: 'Champion farmer of Talon Valley. It has a nice ring to it!' },
  60: { title: 'The Professor Arrives', who: 'hazel', lines: ['Greetings! I am Professor Hazel. I study rare animals.', 'I heard your farm is the perfect place for creatures that need special care.'], outro: 'Remarkable. Truly remarkable. I shall stay a while.' },
  75: { title: 'Ships from Afar', who: 'finn', lines: ['Ships from faraway lands are asking to dock at your farm.', 'They bring seeds and animals the valley has never seen!'], outro: 'Three flags in the harbor today. All here for your goods!' },
  90: { title: 'Grandpa\'s Journal', who: 'grandpa', lines: ['I dug out my old farm journal. Some pages are about a legend...', 'Never mind. Old stories. Let us get back to work!'], outro: 'You remind me of myself at your age. Only better at it.' },
  100: { title: 'A Hundred Seasons', who: 'grandpa', lines: ['Level one hundred! When you came, the fields were empty and the barn was quiet.', 'Now look around. The whole valley is proud of you.'], outro: 'A hundred seasons of hard work. Let us celebrate!' },
  125: { title: 'The Old Map', who: 'grandpa', lines: ['Remember the legend in my journal? The Golden Nest.', 'They say a golden bird once nested in this valley and brought luck to every farm. I found a map!'], outro: 'The map is real. I can hardly believe it.' },
  150: { title: 'Following the Clues', who: 'hazel', lines: ['I studied your grandfather\'s map. The markings match rare feathers I have seen on your farm!', 'The golden bird must be real. It needs a farm full of life to return.'], outro: 'Every clue points here. To your farm!' },
  175: { title: 'The Last Clue', who: 'finn', lines: ['Sailors say they saw a golden glow over the valley at dawn.', 'It is circling your farm, farmer. It is looking for a home.'], outro: 'Keep going. It is almost time.' },
  200: { title: 'The Golden Nest', who: 'grandpa', lines: ['It is here. The golden bird has come back to Talon Valley, to your farm.', 'You did what no farmer has done in a hundred years. I am so proud of you.'], outro: 'The legend is true, and it is yours. Thank you, from all of Talon Valley.' },
};

const GREET: Record<CastId, string[]> = {
  grandpa: ['Good morning, kiddo!', 'Ah, there you are!'],
  bramble: ['Good day, farmer!', 'Ahem! Mayor Bramble here.'],
  ivy: ['Hi neighbor!', 'Hello there, green thumb!'],
  maya: ['Hello, farmer!', 'Doc Maya here!'],
  rosie: ['Yoo hoo, farmer!', 'Hi hi! Rosie here.'],
  marco: ['Buongiorno, my friend!', 'Ciao, farmer!'],
  finn: ['Ahoy, farmer!', 'Ahoy there!'],
  hazel: ['Ah, just the farmer I wanted to see.', 'Greetings, my friend!'],
};

const OUTRO: Record<CastId, string[]> = {
  grandpa: ['That is my grandchild! This farm is in good hands.', 'Just like the old days, only better.'],
  bramble: ['Splendid! Visitors are already talking about your farm.', 'The town council sends its warmest thanks!'],
  ivy: ['Look at those fields! Everything is growing so well.', 'Green fingers, that is what you have.'],
  maya: ['Happy animals, happy valley. Thank you!', 'They settled in beautifully. You are a natural with animals.'],
  rosie: ['Mmm! That goes straight into my recipe book.', 'Delicious! The whole bakery smells wonderful.'],
  marco: ['Magnifico! The whole valley can smell it.', 'Perfect! You cook like a true chef.'],
  finn: ['Now that is a catch! The fish like you.', 'Fair winds, farmer. Good work today.'],
  hazel: ['Fascinating! I must write this down.', 'A wonderful result. Science thanks you!'],
};

// the first chapter follows the tutorial: harvest, plant and build the bakery
const FIRST: Omit<StoryTask, 'id'>[] = [
  { icon: ITEMS.wheat.icon, text: 'Harvest Wheat ×4', target: 4, kind: 'stat', key: 'harvest:wheat' },
  { icon: '🌱', text: 'Plant crops ×2', target: 2, kind: 'stat', key: 'plant' },
  { icon: BUILDINGS.find((b) => b.id === 'bakery')?.icon ?? '🍞', text: 'Build a Bakery', target: 1, kind: 'count', key: 'bakery' },
];

const cache = new Map<number, Chapter>();
export const LAST_CHAPTER = 200;

export function chapterAt(n: number): Chapter {
  const hit = cache.get(n);
  if (hit) return hit;
  const m = MILESTONES[n];
  const list = drafts(n);
  const chosen: Draft[] = [];
  // at most three tasks, one of each kind of thing where possible
  const seen = new Set<string>();
  for (const d of list) {
    const k = d.task.kind + d.task.key.split(':')[0];
    if (chosen.length < 3 && !seen.has(k)) { chosen.push(d); seen.add(k); }
  }
  for (const d of list) if (chosen.length < 3 && !chosen.some((c) => c.task.text === d.task.text)) chosen.push(d);
  // levels that bring little still get a task: orders keep the town fed
  if (chosen.length < 2 && n > 1) {
    const k = 2 + Math.floor(n / 40);
    chosen.push({ who: 'bramble', task: { icon: '📋', text: `Deliver orders ×${k}`, target: k, kind: 'stat', key: 'orders' }, line: 'The order board is full again. The town is counting on you!', title: 'Busy Days' });
  }
  const own = m?.task ? [m.task, ...chosen.map((d) => d.task).filter((t) => t.text !== m.task!.text).slice(0, 2)] : chosen.map((d) => d.task);
  const tasks = (n === 1 ? FIRST : own).map((t, i) => ({ ...t, id: `${n}.${i}` }));
  const who: CastId = m?.who ?? chosen[0]?.who ?? 'grandpa';
  const intro = m ? [...m.lines] : [];
  // the teller explains the first task; other folk chip in for the rest in the chapter panel
  if (n === 1) intro.push('Harvest the wheat, plant some more, and build a bakery. Rosie will teach you to bake!');
  else if (chosen[0]) intro.push(m ? chosen[0].line : `${pick(GREET[who], n, 17)} ${chosen[0].line}`);
  if (!m && chosen[1] && chosen[1].who === who) intro.push(chosen[1].line);
  const ch: Chapter = {
    n,
    title: m?.title ?? chosen[0]?.title ?? 'A Day on the Farm',
    who,
    intro: intro.slice(0, 4),
    outro: m?.outro ?? pick(OUTRO[who], n, 16),
    tasks,
  };
  cache.set(n, ch);
  return ch;
}

// what a chapter's task has reached, counted from the moment the chapter began
export interface StoryState { ch: number; started: number; base: Record<string, number>; seen: number }
export function taskProgress(t: StoryTask, s: { stats: Record<string, number>; objects: { type: string }[]; fishing?: { open: boolean }; story?: StoryState }) {
  if (t.kind === 'count') return s.objects.filter((o) => o.type === t.key).length;
  if (t.kind === 'fishing') return s.fishing?.open ? 1 : 0;
  return Math.max(0, (s.stats[t.key] ?? 0) - (s.story?.base[t.key] ?? 0));
}
