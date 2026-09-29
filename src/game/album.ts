// The farm album: sets of things to find, each filled in the first time you come across one,
// with a reward for every finished set. Fish are caught at the lake and off the shore, shore
// life is spotted by tapping the creatures on the beach, and the pets bring home the rest.
import { ITEMS, LAKE_CATCHES, SEA_CATCHES } from './data';

export interface AlbumEntry { id: string; name: string; icon: string; model?: string }
export interface AlbumSet {
  id: string; name: string; icon: string; how: string;
  entries: AlbumEntry[];
  reward: { coins: number; gems: number; xp: number };
}

const fish = (ids: string[]) => ids.map((id) => ({ id, name: ITEMS[id].name, icon: ITEMS[id].icon }));

// the pets' finds: album entries only, never stored in the barn
export const CAT_FINDS: AlbumEntry[] = [
  { id: 'find_feather', name: 'Blue Jay Feather', icon: '🪶' },
  { id: 'find_yarn', name: 'Ball of Yarn', icon: '🧶' },
  { id: 'find_spool', name: 'Cotton Spool', icon: '🧵' },
  { id: 'find_ribbon', name: 'Silk Ribbon', icon: '🎀' },
  { id: 'find_bell', name: 'Little Brass Bell', icon: '🔔' },
  { id: 'find_sock', name: 'Odd Sock', icon: '🧦' },
  { id: 'find_glove', name: 'Lost Glove', icon: '🧤' },
];
export const DOG_FINDS: AlbumEntry[] = [
  { id: 'find_bone', name: 'Old Bone', icon: '🦴' },
  { id: 'find_ball', name: 'Tennis Ball', icon: '🎾' },
  { id: 'find_boot', name: 'Muddy Boot', icon: '👢' },
  { id: 'find_coin', name: 'Old Coin', icon: '🪙' },
  { id: 'find_jar', name: 'Clay Jar', icon: '🏺' },
  { id: 'find_compass', name: 'Brass Compass', icon: '🧭' },
  { id: 'find_fossil', name: 'Fossil Bone', icon: '🦕' },
];

// what lives on the shore, by the names the renderer knows them by
export const SHORE_LIFE: AlbumEntry[] = [
  { id: 'rock_crab', name: 'Red Rock Crab', icon: '🦀', model: 'rock_crab' },
  { id: 'blue_crab', name: 'Blue Crab', icon: '🦀', model: 'blue_crab' },
  { id: 'ghost_crab', name: 'Ghost Crab', icon: '🦀', model: 'ghost_crab' },
  { id: 'shore_crab', name: 'Green Shore Crab', icon: '🦀', model: 'shore_crab' },
  { id: 'sally_crab', name: 'Sally Lightfoot', icon: '🦀', model: 'sally_crab' },
  { id: 'fiddler_crab', name: 'Fiddler Crab', icon: '🦀', model: 'fiddler_crab' },
  { id: 'hermit_crab', name: 'Hermit Crab', icon: '🐚', model: 'hermit_crab' },
  { id: 'hermit_moon', name: 'Purple Pincher', icon: '🐚', model: 'hermit_moon' },
  { id: 'horseshoe_crab', name: 'Horseshoe Crab', icon: '🦀', model: 'horseshoe_crab' },
  { id: 'sandpiper', name: 'Sanderling', icon: '🐦', model: 'sandpiper' },
  { id: 'harbor_seal', name: 'Harbour Seal', icon: '🦭', model: 'harbor_seal' },
];

export const ALBUM: AlbumSet[] = [
  {
    id: 'lake_fish', name: 'Lake Fish', icon: '🎣', how: 'Catch them at the lake.',
    entries: fish(LAKE_CATCHES.map(([id]) => id)),
    reward: { coins: 3000, gems: 25, xp: 300 },
  },
  {
    id: 'sea_fish', name: 'Sea Catch', icon: '🌊', how: 'Catch them from the jetty on the shore.',
    entries: fish(SEA_CATCHES.map(([id]) => id).filter((id) => id !== 'fish')),
    reward: { coins: 4000, gems: 30, xp: 400 },
  },
  {
    id: 'shore_life', name: 'Shore Life', icon: '🦀', how: 'Tap the creatures on the beach to spot them.',
    entries: SHORE_LIFE,
    reward: { coins: 2500, gems: 20, xp: 250 },
  },
  {
    id: 'cat_finds', name: "The Cat's Treasures", icon: '🐈', how: 'Feed the cat; it brings you something every day.',
    entries: CAT_FINDS,
    reward: { coins: 2000, gems: 15, xp: 200 },
  },
  {
    id: 'dog_finds', name: "The Dog's Digs", icon: '🐕', how: 'Feed the dog; it digs something up every day.',
    entries: DOG_FINDS,
    reward: { coins: 2000, gems: 15, xp: 200 },
  },
];

export const ALBUM_IDS = new Set(ALBUM.flatMap((a) => a.entries.map((e) => e.id)));
export const albumEntry = (id: string) => ALBUM.flatMap((a) => a.entries).find((e) => e.id === id);
