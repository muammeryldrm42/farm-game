// Talons Farm - real time 3D renderer built on three.js.
// Every model, texture and shader is generated in code, no asset files needed.
import * as THREE from 'three';
import { mergeGeometries, mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { getQuality, onQuality, type Quality } from './quality';
import { fillRich, isDrawn, paintIcon } from './icons';
import { U } from './gfx/shared';
import { Sky } from './gfx/sky';
import { makeWater } from './gfx/water';
import { seasonOf, weatherAt, type Season } from './weather';
import { FLOWER_KIT_MAT, Foliage, flowerKit, windify, type FlowerKind, type Spot } from './gfx/foliage';
import { Post } from './gfx/post';
import { PLANT_MAT, cropGeo } from './gfx/crops';
import { PRODUCE_MAT, produceGeo } from './gfx/produce';
import { ribs, ruffledLeaf } from './gfx/kit';
import { artStyle, creature, hasCreature, personParts } from './gfx/creatures';
import { toonCrown, toonPersonParts } from './gfx/toon';
import { SCULPT_MAT, TOON_MAT, TOON_WOOL, WOOL_MAT } from './gfx/sdf';
import { leafShell, leafTexture, meterBox, meterHip, meterRoof, surface, surfaceMat, type SurfaceKind } from './gfx/textures';
import { ANIMAL, BUILDING, CROP, ITEMS, type BuildingDef, type CropDef } from './data';
import {
  CHUNK, FISH_SPOT, GRID, MAP_OFF, NCH, animalReady, fishingInfo, boatState, canFulfill, chunkState, grazePhase, penInfo, plotProgress, prodInfo, treeInfo,
  type Animal, type FarmObject, type GameStore,
} from './state';

export const ZU = 1 / 40; // converts the old pixel heights used by effects into world units

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export function hash(x: number, y: number, s = 0) {
  let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul(s | 0, 1442695041);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

export function nightFactor(now: number) {
  const CYCLE = 16 * 60 * 1000;
  const p = (now % CYCLE) / CYCLE;
  const c = Math.cos(p * Math.PI * 2);
  const night = clamp((-c - 0.3) / 0.5, 0, 1);
  const dusk = clamp(1 - Math.abs(c + 0.15) / 0.3, 0, 1);
  return { night, dusk };
}

// ------------------------------------------------------------------ shared geometry, materials, textures

const G = {
  box: new THREE.BoxGeometry(1, 1, 1),
  ball: new THREE.SphereGeometry(1, 20, 14),
  smooth: new THREE.SphereGeometry(1, 14, 10),
  dome: new THREE.SphereGeometry(1, 14, 7, 0, Math.PI * 2, 0, Math.PI / 2),
  rock: new THREE.DodecahedronGeometry(1, 0),
  plane: new THREE.PlaneGeometry(1, 1),
};

const cylCache = new Map<string, THREE.CylinderGeometry>();
function cylGeo(rt: number, rb: number, seg: number) {
  const k = `${rt.toFixed(3)}|${rb.toFixed(3)}|${seg}`;
  let g = cylCache.get(k);
  if (!g) { g = new THREE.CylinderGeometry(rt, rb, 1, seg); cylCache.set(k, g); }
  return g;
}

let prism: THREE.BufferGeometry | null = null;
function prismGeo() {
  if (prism) return prism;
  const v = [
    -0.5, 0, 0.5, 0.5, 0, 0.5, 0.5, 1, 0, -0.5, 0, 0.5, 0.5, 1, 0, -0.5, 1, 0,
    0.5, 0, -0.5, -0.5, 0, -0.5, -0.5, 1, 0, 0.5, 0, -0.5, -0.5, 1, 0, 0.5, 1, 0,
    0.5, 0, 0.5, 0.5, 0, -0.5, 0.5, 1, 0,
    -0.5, 0, -0.5, -0.5, 0, 0.5, -0.5, 1, 0,
  ];
  prism = new THREE.BufferGeometry();
  prism.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
  prism.computeVertexNormals();
  return prism;
}

let tri: THREE.BufferGeometry | null = null;
function sailGeo() {
  if (tri) return tri;
  tri = new THREE.BufferGeometry();
  tri.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, 0, 1, 0, 0, 0, 1], 3));
  tri.computeVertexNormals();
  return tri;
}

// Pine silhouette: a lathe with three soft tiers, centered like a unit cone (height 1, base radius 1).
let pine: THREE.BufferGeometry | null = null;
function pineGeo() {
  if (pine) return pine;
  const pts: THREE.Vector2[] = [new THREE.Vector2(0, -0.5)];
  const tiers = 3;
  for (let i = 0; i < tiers; i++) {
    const y0 = -0.5 + (i / tiers) * 0.95, r0 = 1 - i * 0.27;
    pts.push(new THREE.Vector2(r0, y0), new THREE.Vector2(r0 * 0.93, y0 + 0.05), new THREE.Vector2(r0 * 0.5, y0 + 0.3));
  }
  pts.push(new THREE.Vector2(0.08, 0.47), new THREE.Vector2(0, 0.5));
  pine = new THREE.LatheGeometry(pts, 14);
  return pine;
}

// Lumpy foliage ball: a sphere pushed in and out by smooth noise, shaded smoothly.
const blobCache = new Map<number, THREE.BufferGeometry>();
function blobGeo(seed: number, lo = false) {
  const key = lo ? -seed - 1 : seed;
  let g = blobCache.get(key);
  if (g) return g;
  // the forest uses a lighter version, there can be hundreds of those crowns
  const base = lo ? new THREE.SphereGeometry(1, 12, 9) : new THREE.SphereGeometry(1, 28, 20);
  base.deleteAttribute('uv');
  base.deleteAttribute('normal');
  g = mergeVertices(base);
  const pos = g.getAttribute('position') as THREE.BufferAttribute;
  const v = new THREE.Vector3();
  const dirs = [...Array(7)].map((_, i) => new THREE.Vector3(hash(i, seed, 1) - 0.5, hash(i, seed, 2) - 0.5, hash(i, seed, 3) - 0.5).normalize());
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i).normalize();
    let d = 0;
    // bumps where the vertex faces one of a few random directions, like clustered leaf puffs
    for (const k of dirs) d += Math.pow(Math.max(0, v.dot(k)), 6) * 0.22;
    d += Math.sin(v.x * 7 + seed) * Math.sin(v.y * 6) * Math.sin(v.z * 7 - seed) * 0.05;
    v.multiplyScalar(0.9 + d);
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals();
  blobCache.set(key, g);
  return g;
}

const matCache = new Map<string, THREE.Material>();
function M(color: string): THREE.MeshStandardMaterial {
  let m = matCache.get(color) as THREE.MeshStandardMaterial | undefined;
  if (!m) { m = new THREE.MeshStandardMaterial({ color, roughness: 0.78, metalness: 0 }); matCache.set(color, m); }
  return m;
}
// faceted look for rocks and crystals
function MF(color: string): THREE.MeshStandardMaterial {
  const k = `${color}#flat`;
  let m = matCache.get(k) as THREE.MeshStandardMaterial | undefined;
  if (!m) { m = new THREE.MeshStandardMaterial({ color, roughness: 0.9, flatShading: true }); matCache.set(k, m); }
  return m;
}
function MT(color: string, opacity: number): THREE.MeshStandardMaterial {
  const k = `${color}@${opacity}`;
  let m = matCache.get(k) as THREE.MeshStandardMaterial | undefined;
  if (!m) { m = new THREE.MeshStandardMaterial({ color, transparent: true, opacity, roughness: 0.8, depthWrite: false }); matCache.set(k, m); }
  return m;
}

// glowing materials, their emissive strength follows the night
const WIN = new THREE.MeshStandardMaterial({ color: '#a9dcf5', roughness: 0.15, metalness: 0.1, emissive: '#ffc766', emissiveIntensity: 0 });
const LAMP = new THREE.MeshStandardMaterial({ color: '#fff3c4', emissive: '#ffcf6b', emissiveIntensity: 0.2 });
const WATER = makeWater({ shallow: '#6fd6cf', deep: '#2f8fcf', scale: 1.6 });
// additive pool of light under lamps, only visible at night
let glowTex: THREE.Texture | null = null;
const GLOW = new THREE.MeshBasicMaterial({ color: '#ffc870', transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
function glowMat() {
  if (!glowTex) {
    glowTex = canvasTex('glow', 128, 128, (c) => {
      const g = c.createRadialGradient(64, 64, 0, 64, 64, 64);
      g.addColorStop(0, 'rgba(255,255,255,1)');
      g.addColorStop(0.4, 'rgba(255,255,255,0.45)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      c.fillStyle = g; c.fillRect(0, 0, 128, 128);
    });
    GLOW.map = glowTex;
  }
  return GLOW;
}

const texCache = new Map<string, THREE.Texture>();
const EF = '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
function canvasTex(key: string, w: number, h: number, draw: (c: CanvasRenderingContext2D) => void) {
  let t = texCache.get(key);
  if (t) return t;
  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  const c = cv.getContext('2d') as CanvasRenderingContext2D;
  draw(c);
  t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  texCache.set(key, t);
  return t;
}

function emojiTex(icon: string, badge = false) {
  return canvasTex(`e|${icon}|${badge}`, 128, 128, (c) => {
    if (badge) {
      c.fillStyle = '#fff8e6';
      c.beginPath(); c.arc(64, 64, 58, 0, Math.PI * 2); c.fill();
      c.lineWidth = 8; c.strokeStyle = '#8a5a2b'; c.stroke();
    }
    if (isDrawn(icon)) { paintIcon(c, icon, 64, 64, badge ? 76 : 110); return; }
    c.font = `${badge ? 64 : 92}px ${EF}`;
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText(icon, 64, 70);
  });
}

function bubbleTex(icon: string, mode: 'ready' | 'progress' | 'faded', step: number, count: number) {
  return canvasTex(`b|${icon}|${mode}|${step}|${count}`, 128, 160, (c) => {
    c.globalAlpha = mode === 'faded' ? 0.72 : 1;
    c.fillStyle = 'rgba(0,0,0,0.22)';
    c.beginPath(); c.arc(64, 70, 54, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#ffffff';
    c.beginPath(); c.moveTo(48, 110); c.lineTo(80, 110); c.lineTo(64, 152); c.closePath(); c.fill();
    c.beginPath(); c.arc(64, 64, 54, 0, Math.PI * 2); c.fill();
    if (mode === 'progress') {
      c.lineWidth = 9; c.strokeStyle = '#e6e0d0';
      c.beginPath(); c.arc(64, 64, 47, 0, Math.PI * 2); c.stroke();
      c.strokeStyle = '#5cb85c'; c.lineCap = 'round';
      c.beginPath(); c.arc(64, 64, 47, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * step) / 24); c.stroke();
    }
    c.font = `${mode === 'ready' ? 64 : 54}px ${EF}`;
    c.textAlign = 'center'; c.textBaseline = 'middle';
    if (isDrawn(icon)) paintIcon(c, icon, 64, 64, mode === 'ready' ? 76 : 64);
    else c.fillText(icon, 64, 68);
    if (count > 1) {
      c.fillStyle = '#e74c3c';
      c.beginPath(); c.arc(106, 22, 20, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#fff';
      c.font = '900 26px system-ui, sans-serif';
      c.fillText(String(count), 106, 24);
    }
  });
}

// round soft sparkle with a bright core, used by particle bursts
function sparkTex() {
  return canvasTex('spark', 64, 64, (c) => {
    const g = c.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.35, 'rgba(255,255,255,0.9)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = g;
    c.beginPath(); c.arc(32, 32, 32, 0, Math.PI * 2); c.fill();
    c.fillStyle = 'rgba(255,255,255,0.8)';
    c.fillRect(30, 4, 4, 56); c.fillRect(4, 30, 56, 4);
  });
}

function textTex(text: string, color: string) {
  return canvasTex(`t|${text}|${color}`, 512, 96, (c) => {
    c.font = '900 54px ui-rounded, "Trebuchet MS", system-ui, sans-serif';
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.lineWidth = 12; c.strokeStyle = 'rgba(60,35,10,0.9)'; c.lineJoin = 'round';
    c.fillStyle = color;
    fillRich(c, text, 256, 50, 58, true);
  });
}

// ------------------------------------------------------------------ mesh helpers (y is the bottom for boxes and cylinders)

type P = THREE.Object3D;
function mk(p: P, geo: THREE.BufferGeometry, mat: THREE.Material, sx: number, sy: number, sz: number, x: number, y: number, z: number, shadow = true) {
  const m = new THREE.Mesh(geo, mat);
  m.scale.set(sx, sy, sz);
  m.position.set(x, y, z);
  m.castShadow = shadow;
  m.receiveShadow = true;
  p.add(m);
  return m;
}
const bx = (p: P, w: number, h: number, d: number, color: string, x: number, y: number, z: number, shadow = true) => mk(p, G.box, M(color), w, h, d, x, y + h / 2, z, shadow);
const ball = (p: P, r: number, color: string, x: number, y: number, z: number, sx = 1, sy = 1, sz = 1, shadow = true) => mk(p, G.ball, M(color), r * sx, r * sy, r * sz, x, y, z, shadow);
const cyl = (p: P, rt: number, rb: number, h: number, color: string, x: number, y: number, z: number, seg = 8, shadow = true) => mk(p, cylGeo(rt, rb, seg), M(color), 1, h, 1, x, y + h / 2, z, shadow);
const roof = (p: P, w: number, h: number, d: number, color: string, x: number, y: number, z: number, rotY = 0) => {
  const m = mk(p, prismGeo(), M(color), w, h, d, x, y, z);
  m.rotation.y = rotY;
  return m;
};
// textured box with UVs in meters; `sc` is texture repeats per meter
function bxT(p: P, w: number, h: number, d: number, kind: SurfaceKind, color: string, x: number, y: number, z: number, sc = 1, shadow = true) {
  const m = new THREE.Mesh(meterBox(w, h, d), surfaceMat(kind, color, sc));
  m.position.set(x, y + h / 2, z);
  m.castShadow = shadow;
  m.receiveShadow = true;
  p.add(m);
  return m;
}
// tiled gable roof; the gable ends take the wall material
function roofT(p: P, w: number, h: number, d: number, color: string, gable: THREE.Material, x: number, y: number, z: number, inset = 0) {
  const m = new THREE.Mesh(meterRoof(w, h, d, inset), [surfaceMat('roof', color, 1.7, 0.7), gable]);
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  p.add(m);
  return m;
}
function badge(p: P, icon: string, size: number, x: number, y: number, z: number, rotY = 0) {
  const m = new THREE.Mesh(G.plane, new THREE.MeshBasicMaterial({ map: emojiTex(icon, true), transparent: true }));
  m.scale.set(size, size, 1);
  m.position.set(x, y, z);
  m.rotation.y = rotY;
  p.add(m);
  return m;
}
function group(p?: P, x = 0, y = 0, z = 0) {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  p?.add(g);
  return g;
}

// ------------------------------------------------------------------ types

type Update = (o: FarmObject, now: number, t: number, dt: number) => void;
interface Entry {
  id: number;
  type: string;
  root: THREE.Group;
  hit: THREE.Mesh;
  top: number;
  update?: Update;
  bubble?: THREE.Sprite;
  bubbleKey?: string;
  // squash and stretch: time into the animation, and its kind
  bounce?: { t: number; kind: 'spawn' | 'bump' | 'big' | 'work' };
}
function bump(e: Entry, kind: 'bump' | 'big' | 'work' = 'bump') {
  if (!e.bounce || e.bounce.kind !== 'spawn') e.bounce = { t: 0, kind };
}
interface Burst { pts: THREE.Points; vel: Float32Array; life: number }
interface Float { s: THREE.Sprite; life: number }
interface Actor {
  x: number; y: number; heading: number; moving: boolean; g: THREE.Group; phase: number;
  path: { x: number; y: number }[]; goal: { x: number; y: number } | null;
  inside: boolean; sleeping: boolean; goHome: boolean; fade: number;
}
const actor = (x: number, y: number, g: THREE.Group): Actor => ({ x, y, heading: 0, moving: false, g, phase: 0, path: [], goal: null, inside: false, sleeping: false, goHome: false, fade: 1 });

// ------------------------------------------------------------------ short lived animations
// Model update functions start these (harvest pops, falling fruit...). The renderer ticks them.

interface Anim { t: number; dur: number; tick: (k: number, dt: number) => void; done?: () => void }
const ANIMS: Anim[] = [];
const FX_ROOT = new THREE.Group();
function play(dur: number, tick: (k: number, dt: number) => void, done?: () => void) {
  ANIMS.push({ t: 0, dur, tick, done });
}
function tickAnims(dt: number) {
  for (let i = ANIMS.length - 1; i >= 0; i--) {
    const a = ANIMS[i];
    a.t += dt;
    const k = Math.min(1, a.t / a.dur);
    a.tick(k, dt);
    if (k >= 1) { a.done?.(); ANIMS.splice(i, 1); }
  }
}
const easeOutBack = (k: number) => { const c = 1.9; return 1 + (c + 1) * Math.pow(k - 1, 3) + c * Math.pow(k - 1, 2); };
const tmpV = new THREE.Vector3();

// a copy of `src` jumps out of its place, spins and shrinks away (harvest, collecting)
function popOut(src: THREE.Object3D, delay = 0, height = 1.3) {
  src.updateWorldMatrix(true, true);
  const c = src.clone();
  src.getWorldPosition(c.position);
  src.getWorldQuaternion(c.quaternion);
  src.getWorldScale(c.scale);
  const p0 = c.position.clone(), s0 = c.scale.clone();
  const vx = (Math.random() - 0.5) * 0.8, vz = (Math.random() - 0.5) * 0.8, spin = (Math.random() - 0.5) * 12;
  c.visible = false;
  FX_ROOT.add(c);
  const dur = 0.85 + delay;
  play(dur, (k) => {
    const t = k * dur - delay;
    if (t < 0) return;
    c.visible = true;
    const u = t / 0.85;
    c.position.set(p0.x + vx * u, p0.y + height * (2.6 * u - 2.2 * u * u), p0.z + vz * u);
    c.rotation.y += spin * 0.016;
    const sc = u < 0.25 ? 1 + u * 1.2 : 1.3 * (1 - (u - 0.25) / 0.75);
    c.scale.copy(s0).multiplyScalar(Math.max(0.001, sc));
  }, () => FX_ROOT.remove(c));
}

// a copy of `src` falls to the ground, bounces once and fades (fruit dropping from a shaken tree)
function dropDown(src: THREE.Object3D, delay = 0) {
  src.updateWorldMatrix(true, true);
  const c = src.clone();
  src.getWorldPosition(c.position);
  src.getWorldScale(c.scale);
  const p0 = c.position.clone(), s0 = c.scale.clone();
  const vx = (Math.random() - 0.5) * 0.6, vz = (Math.random() - 0.5) * 0.6 + 0.3;
  c.visible = false;
  FX_ROOT.add(c);
  const dur = 1.1 + delay;
  play(dur, (k) => {
    const t = k * dur - delay;
    if (t < 0) return;
    c.visible = true;
    const fall = Math.min(1, t / 0.45);
    let y = p0.y * (1 - fall * fall);
    if (t > 0.45) { const b = (t - 0.45) / 0.3; y = b < 1 ? Math.sin(b * Math.PI) * 0.08 : 0; }
    c.position.set(p0.x + vx * Math.min(t, 0.75), Math.max(0.04, y + 0.04), p0.z + vz * Math.min(t, 0.75));
    const fade = t > 0.8 ? Math.max(0.001, 1 - (t - 0.8) / 0.3) : 1;
    c.scale.copy(s0).multiplyScalar(fade);
  }, () => FX_ROOT.remove(c));
}

const HIT_MAT = new THREE.MeshBasicMaterial({ visible: false });
// middle of the starting farm
const FARM_C = { x: 13.5 + MAP_OFF, y: 11.5 + MAP_OFF };
const FRUIT_COLOR: Record<string, string> = { apple: '#e53935', cherry: '#b0102a', orange: '#ff9800', peach: '#ffa274', lemon: '#ffe03a', coconut: '#7a4a26', pear: '#c8c040', plum: '#5a2070', mango: '#f0902a', avocado: '#2f4a1a', pomegranate: '#c0282a', banana: '#f2d23a', apricot: '#f6a23a', lime: '#6ab82a', fig: '#5a2a4a', olive: '#5a6a1a', walnut: '#5a8a2a', quince: '#e8c83a', almond: '#9ab880', mulberry: '#3a0a2a', grapefruit: '#f2b04a', persimmon: '#f07a1a', date: '#7a3a14', lychee: '#d83a3a', hazelnut: '#8a5a2a', starfruit: '#e8c21a', maple_syrup: '#b8321a', cocoa_pod: '#c0601a', sakura: '#f4b0c8', golden_apple: '#f2c230', tangerine: '#f08a1a', nectarine: '#f0603a', chestnut: '#7a4a22', papaya: '#f0a040', kumquat: '#f8a020', guava: '#b8d060', pistachio: '#b8c860', elderberry: '#2a1a3a', dragon_fruit: '#e8307a', pecan: '#8a5a2a', blood_orange: '#c8301a', jackfruit: '#a8b040', macadamia: '#d8c8a0', yuzu: '#f0d020', passion_fruit: '#6a2a6a', cashew: '#e8b040', white_peach: '#f8d0c0', loquat: '#f0a830', crabapple: '#c02a3a', cinnamon: '#8a4a22', mangosteen: '#5a1a3a', durian: '#b8a840', black_cherry: '#4a0a1a', silver_pear: '#d8d8c8' };
const TREE_LEAF: Record<string, string> = { apple_tree: '#4f9e36', cherry_tree: '#3f8a3a', orange_tree: '#2f7d32', peach_tree: '#5aa53a', lemon_tree: '#3b8f3c', coconut_palm: '#4c9a38', pear_tree: '#58a03a', plum_tree: '#3f7f3a', banana_tree: '#5aa844', mango_tree: '#2f7a32', avocado_tree: '#2a6a2e', pomegranate_tree: '#4a8a36', apricot_tree: '#5aa03a', lime_tree: '#2f7f32', fig_tree: '#4a9a3a', olive_tree: '#8a9a7a', walnut_tree: '#3f7a2e', quince_tree: '#5a9a3a', almond_tree: '#6aa84a', mulberry_tree: '#3f8a34', grapefruit_tree: '#3a8a3a', persimmon_tree: '#6a9a2a', date_palm: '#5a8a3a', lychee_tree: '#2f7a32', hazelnut_tree: '#5a9a34', starfruit_tree: '#3f8f3c', maple_tree: '#d8542a', cocoa_tree: '#2f6a2e', sakura_tree: '#f2a6c4', golden_apple_tree: '#7ab84a', tangerine_tree: '#2a7a2e', nectarine_tree: '#52a036', chestnut_tree: '#3a7a2c', papaya_tree: '#3a8a3a', kumquat_tree: '#2a7a30', guava_tree: '#469636', pistachio_tree: '#6a9a4a', elderberry_tree: '#3a8a36', dragon_fruit_tree: '#4a9a3a', pecan_tree: '#3a762c', blood_orange_tree: '#2a7a2e', jackfruit_tree: '#2a7a30', macadamia_tree: '#3a8a36', yuzu_tree: '#358a36', passion_fruit_tree: '#3a8a36', cashew_tree: '#469636', white_peach_tree: '#52a036', loquat_tree: '#3a7a2e', crabapple_tree: '#4a9a32', cinnamon_tree: '#2f7a32', mangosteen_tree: '#2a6a2e', durian_tree: '#3a7a2c', black_cherry_tree: '#3a7a36', silver_pear_tree: '#8aa890' };
const GRASSY_PEN = new Set(['hereford_ranch', 'suffolk_fold', 'heron_marsh', 'highland_pasture', 'pheasant_run', 'llama_ranch', 'pony_paddock', 'black_sheepfold', 'jersey_pasture', 'merino_fold', 'galloway_pasture', 'jacob_fold', 'deer_park', 'moose_woods', 'squirrel_grove', 'parrot_aviary', 'kiwi_burrow', 'owl_barn', 'silk_house', 'crane_marsh', 'muscovy_pond', 'pasture', 'sheepfold', 'beehive', 'rabbit_hutch', 'alpaca_ranch', 'goose_pen', 'peacock_garden', 'donkey_paddock', 'yak_pasture']);
const PEN_GROUND: Record<string, string> = {
  rabbit_hutch: '#86c24f', alpaca_ranch: '#8fc45a', goose_pen: '#86c24f', gobbler_run: '#c9a46a', quail_coop: '#d9c08a', camel_corral: '#e2cf98', buffalo_wallow: '#8a6a44', ostrich_ranch: '#d8c38e',
  coop: '#d9c08a', pasture: '#86c24f', sheepfold: '#9ccc5a',
  duck_pond: '#8fc45a', goat_yard: '#b8a46c', beehive: '#7fbf4f', stable: '#c9b27a',
  musk_ox_range: '#eef3f6', beaver_pond: '#8fc45a', mandarin_pond: '#8fc45a', black_swan_lake: '#8fc45a',
  guinea_run: '#d9c08a', swan_lake: '#8fc45a', emu_ranch: '#d8c38e', reindeer_lodge: '#eef3f6', bison_range: '#b8a46c', flamingo_lagoon: '#e8d8a8', golden_nest: '#e8d49a',
};

// ------------------------------------------------------------------ renderer

export class Renderer {
  cam = { zoom: 1.3 };
  W = 1;
  H = 1;
  private gl: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(32, 1, 0.5, 400);
  private target = new THREE.Vector3(FARM_C.x, 0, FARM_C.y);
  private az = Math.PI / 4;
  private azGoal = Math.PI / 4;
  private el = 0.86;
  private ray = new THREE.Raycaster();
  private ground = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  private sun = new THREE.DirectionalLight('#fff4e0', 3.2);
  private hemi = new THREE.HemisphereLight('#d6efff', '#5a7a3a', 0.55);
  private world = new THREE.Group();
  private land = new THREE.Group();
  private fxLayer = new THREE.Group();
  private entries = new Map<number, Entry>();
  private syncKey = '';
  private landKey = '';
  private tiles!: THREE.InstancedMesh;
  private sea!: THREE.Mesh;
  private fishing!: ReturnType<typeof buildFishingSpot>;
  private life!: Life;
  private fishBubble: THREE.Sprite | null = null;
  private sky = new Sky();
  private foliage = new Foliage();
  private foliageKey = '';
  private post: Post | null = null;
  private quality: Quality = getQuality();
  private offQuality: () => void;
  private size = { w: 1, h: 1, dpr: 1 };
  private clouds: THREE.Group[] = [];
  private bursts: Burst[] = [];
  private floats: Float[] = [];
  private ghost: { key: string; g: THREE.Group; foot: THREE.Mesh } | null = null;
  private sel: THREE.Group;
  private farmer: Actor;
  private dog: Actor;
  private cat: Actor;
  private catWait = 3;
  private wx: { pts: THREE.Points | null; rain: THREE.LineSegments | null; kind: string; vel: Float32Array | null } = { pts: null, rain: null, kind: 'none', vel: null };
  private season: Season = seasonOf();
  private last = 0;
  private panAnchor: THREE.Vector3 | null = null;
  private bg = new THREE.Color();

  constructor(public canvas: HTMLCanvasElement, public store: GameStore) {
    this.gl = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    this.gl.shadowMap.enabled = true;
    this.gl.shadowMap.type = THREE.PCFShadowMap;
    // neutral tone mapping keeps the bright saturated colors of a cartoon farm, where ACES would dull them
    this.gl.toneMapping = THREE.NeutralToneMapping;
    this.gl.toneMappingExposure = 0.9;
    this.scene.fog = new THREE.Fog('#8fd3f5', 60, 140);
    this.scene.background = this.bg;
    this.scene.add(this.sky.mesh);
    this.buildEnvironment();

    this.sun.position.set(14 + 14, 26, 14 + 8);
    this.sun.target.position.set(14, 0, 14);
    this.sun.castShadow = true;
    const sc = this.sun.shadow.camera;
    sc.left = -24; sc.right = 24; sc.top = 24; sc.bottom = -24; sc.near = 1; sc.far = 90;
    this.sun.shadow.bias = -0.0005;
    this.sun.shadow.normalBias = 0.025;
    this.sun.shadow.autoUpdate = false;
    this.sun.shadow.radius = 3;
    // layer 2 holds shadow only casters (cloud shadows): the sun sees them, the camera does not
    this.sun.shadow.camera.layers.enable(2);
    this.scene.add(this.sun, this.sun.target, this.hemi, this.world, this.land, this.foliage.group, this.fxLayer);
    this.world.add(FX_ROOT);

    this.buildSea();
    this.buildClouds();
    this.fishing = buildFishingSpot();
    this.scene.add(this.fishing.root);
    this.life = new Life(this.scene);
    this.sel = this.buildSelection();
    // start fetching the Blender models right away, so they are usually in before the farm shows
    if (artStyle() === 'toon') {
      loadModel('farmhouse').catch(() => {});
      // the forest and FOR SALE signs on locked land: rebuild the land once their models are in
      for (const name of ['forest_pine', 'forest_round', 'forsale_sign'] as const) {
        loadModel(name).then((m) => { WORLD_MODELS[name] = m; this.landKey = ''; }).catch(() => {});
      }
    }
    this.farmer = actor(FARM_C.x - 0.5, FARM_C.y + 0.5, buildFarmer());
    this.dog = actor(FARM_C.x + 0.5, FARM_C.y + 0.5, buildDog());
    this.cat = actor(FARM_C.x + 1.5, FARM_C.y + 1.5, buildCat());
    // grazing animals borrow the farmer's walk grid; bees look for blossoms
    GRAZE_NAV = {
      path: (sx, sy, tx, ty) => { this.rebuildNav(); return this.findPath(sx, sy, tx, ty); },
      nearest: (x, y) => { this.rebuildNav(); return this.nearestFree(x, y); },
      grass: (x, y) => { this.rebuildNav(); return this.free(x, y) && !pathTiles.has(y * GRID + x); },
      flowers: () => this.flowerSpots(),
    };
    // the farmer and pets start as sculpts and take on their Blender models once loaded
    if (artStyle() === 'toon') {
      loadModel('farmer').then((m) => {
        const fresh = farmerFromModel(m);
        const g = this.farmer.g;
        g.clear();
        for (const c of [...fresh.children]) g.add(c);
        Object.assign(g.userData, fresh.userData);
      }).catch(() => {});
      for (const [kind, pet, make] of [['dog', this.dog, buildDog], ['cat', this.cat, buildCat]] as const) {
        loadModel(`animal_${kind}`).then((m) => {
          animalSrc.set(kind, m);
          const fresh = make();
          pet.g.clear();
          for (const c of [...fresh.children]) pet.g.add(c);
          Object.assign(pet.g.userData, fresh.userData);
        }).catch(() => {});
      }
    }
    this.world.add(this.farmer.g, this.dog.g, this.cat.g);
    this.applyQuality(this.quality);
    this.offQuality = onQuality((q) => this.applyQuality(q));
    this.updateCamera();
  }

  dispose() {
    this.offQuality();
    this.post?.dispose();
    this.gl.dispose();
  }

  // sky light for image based lighting: a blurred copy of a daytime sky with a grassy lower half
  private buildEnvironment() {
    const envSky = new Sky();
    envSky.set(new THREE.Color('#5aa2e6'), new THREE.Color('#d4eefc'), new THREE.Color('#7da35a'),
      new THREE.Vector3(0.5, 0.75, 0.3), new THREE.Color('#fff1d0'), 0);
    const envScene = new THREE.Scene();
    envScene.add(envSky.mesh);
    const pm = new THREE.PMREMGenerator(this.gl);
    this.scene.environment = pm.fromScene(envScene, 0.04).texture;
    this.scene.environmentIntensity = 0.7;
    pm.dispose();
  }

  private applyQuality(q: Quality) {
    this.quality = q;
    const high = q === 'high';
    // the soft fur sheen is a costly extra lobe; low quality keeps plain matte fur
    SCULPT_MAT.sheen = high ? 0.55 : 0;
    WOOL_MAT.sheen = high ? 1 : 0;
    TOON_MAT.sheen = high ? 0.35 : 0;
    TOON_WOOL.sheen = high ? 0.8 : 0;
    const ms = high ? 4096 : 1024;
    if (this.sun.shadow.mapSize.x !== ms) {
      this.sun.shadow.mapSize.set(ms, ms);
      this.sun.shadow.map?.dispose();
      this.sun.shadow.map = null as unknown as THREE.WebGLRenderTarget;
    }
    this.sun.shadow.radius = high ? 2.2 : 1.5;
    if (high && !this.post) this.post = new Post(this.gl, this.scene, this.camera, [this.sky.mesh, this.fxLayer, this.foliage.group]);
    if (!high && this.post) { this.post.dispose(); this.post = null; }
    this.foliageKey = '';
    this.landKey = '';
    this.resize(this.size.w, this.size.h, this.size.dpr);
  }

  // ------------------------------------------------ camera

  resize(w: number, h: number, dpr: number) {
    this.size = { w, h, dpr };
    this.W = w; this.H = h;
    // phones report up to 3x; past 2x the extra pixels cost a lot and show little. The picture
    // is always drawn at full sharpness: no resolution drop, even on slower devices.
    const px = this.quality === 'high' ? Math.min(dpr, 2) : Math.min(dpr, 1.5);
    this.gl.setPixelRatio(px);
    this.gl.setSize(w, h, false);
    this.post?.setSize(w, h, px);
    this.camera.aspect = w / Math.max(1, h);
    this.camera.updateProjectionMatrix();
  }

  private updateCamera() {
    const dist = 34 / this.cam.zoom;
    const ce = Math.cos(this.el);
    this.camera.position.set(
      this.target.x + ce * Math.sin(this.az) * dist,
      this.target.y + Math.sin(this.el) * dist,
      this.target.z + ce * Math.cos(this.az) * dist,
    );
    this.camera.lookAt(this.target);
    this.camera.updateMatrixWorld();
  }

  private rayAt(sx: number, sy: number) {
    this.ray.setFromCamera(new THREE.Vector2((sx / this.W) * 2 - 1, -(sy / this.H) * 2 + 1), this.camera);
    return this.ray;
  }

  private groundAt(sx: number, sy: number) {
    const v = new THREE.Vector3();
    return this.rayAt(sx, sy).ray.intersectPlane(this.ground, v) ? v : null;
  }

  gridAt(sx: number, sy: number) {
    const g = this.groundAt(sx, sy);
    return g ? { x: Math.floor(g.x), y: Math.floor(g.z) } : { x: -99, y: -99 };
  }

  toScreen(gx: number, gy: number, z = 0) {
    const v = new THREE.Vector3(gx, z * ZU, gy).project(this.camera);
    return { x: ((v.x + 1) / 2) * this.W, y: ((1 - v.y) / 2) * this.H };
  }

  clampCam() {
    this.target.x = clamp(this.target.x, -1, GRID + 1);
    this.target.z = clamp(this.target.z, -1, GRID + 1);
  }

  panStart(sx: number, sy: number) {
    this.panAnchor = this.groundAt(sx, sy);
  }

  panTo(sx: number, sy: number) {
    if (!this.panAnchor) return;
    const cur = this.groundAt(sx, sy);
    if (!cur) return;
    this.target.x += this.panAnchor.x - cur.x;
    this.target.z += this.panAnchor.z - cur.z;
    this.clampCam();
    this.updateCamera();
  }

  zoomAt(sx: number, sy: number, zoom: number) {
    const before = this.groundAt(sx, sy);
    this.cam.zoom = clamp(zoom, 0.45, 2.6);
    this.updateCamera();
    const after = this.groundAt(sx, sy);
    if (before && after) {
      this.target.x += before.x - after.x;
      this.target.z += before.z - after.z;
    }
    this.clampCam();
    this.updateCamera();
  }

  rotate(dir: number) {
    this.azGoal += (dir * Math.PI) / 2;
  }

  rotateBy(rad: number) {
    this.az += rad;
    this.azGoal = this.az;
    this.updateCamera();
  }

  resetView(zoom: number) {
    this.centerOn(FARM_C.x, FARM_C.y);
    this.cam.zoom = zoom;
    this.azGoal = Math.round((this.az - Math.PI / 4) / (Math.PI * 2)) * Math.PI * 2 + Math.PI / 4;
  }

  centerOn(gx: number, gy: number) {
    this.target.set(gx, 0, gy);
    this.updateCamera();
  }

  // ------------------------------------------------ picking

  pick(sx: number, sy: number): { obj?: FarmObject; tile: { x: number; y: number }; spot?: 'fishing' } {
    const tile = this.gridAt(sx, sy);
    const moveId = this.store.ui.placing?.moveId;
    const hits: THREE.Object3D[] = [this.fishing.hit];
    for (const e of this.entries.values()) if (e.id !== moveId) hits.push(e.hit);
    const r = this.rayAt(sx, sy).intersectObjects(hits, false);
    if (r.length) {
      if (r[0].object === this.fishing.hit) return { tile, spot: 'fishing' };
      const id = r[0].object.userData.objId as number;
      const obj = this.store.obj(id);
      if (obj) return { obj, tile };
    }
    return { tile };
  }

  // ------------------------------------------------ static world

  private buildSea() {
    // island rectangle including the beach, used for shallow water and surf
    const seaMat = makeWater({ sea: true, rect: [-0.75, -0.75, GRID + 0.75, GRID + 0.75], shallow: '#62d9d2', deep: '#1f78c2' });
    // finely divided near the island so the swell can move the surface, flat far away
    this.sea = new THREE.Mesh(new THREE.PlaneGeometry(GRID + 60, GRID + 60, 180, 180), seaMat);
    this.sea.rotation.x = -Math.PI / 2;
    this.sea.position.set(GRID / 2, -0.55, GRID / 2);
    this.sea.receiveShadow = true;
    this.scene.add(this.sea);
    const far = new THREE.Mesh(new THREE.PlaneGeometry(700, 700, 1, 1), seaMat);
    far.rotation.x = -Math.PI / 2;
    far.position.set(GRID / 2, -0.58, GRID / 2);
    this.scene.add(far);

    // island body: grass top is made of tiles, then soil, then a sandy beach
    const isl = this.land;
    const soil = new THREE.Mesh(meterBox(GRID + 0.1, 1.2, GRID + 0.1), surfaceMat('soil', '#8a5a33', 1));
    soil.position.set(GRID / 2, -1.4 + 0.6, GRID / 2);
    soil.receiveShadow = true;
    isl.add(soil);
    const sand = surfaceMat('sand', '#ecd49a', 1.5, 0.95);
    for (const [w, h, y] of [[GRID + 1.4, 0.34, -0.72], [GRID + 0.9, 0.2, -0.4]] as const) {
      const m = new THREE.Mesh(meterBox(w, h, w), sand);
      m.position.set(GRID / 2, y + h / 2, GRID / 2);
      m.receiveShadow = true;
      isl.add(m);
    }

    this.buildShore();

    const grass = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.95, ...surface('grass') });
    grass.normalScale.set(0.8, 0.8);
    // sample the lawn texture in world space so it flows across tiles without repeating per tile
    grass.onBeforeCompile = (sh) => {
      sh.vertexShader = sh.vertexShader.replace('#include <uv_vertex>', `#include <uv_vertex>
      {
        vec4 tw = vec4(position, 1.0);
        #ifdef USE_INSTANCING
        tw = instanceMatrix * tw;
        #endif
        tw = modelMatrix * tw;
        vMapUv = tw.xz * 0.42;
        vNormalMapUv = tw.xz * 0.42;
        vGW = tw.xz;
      }`).replace('#include <common>', '#include <common>\nvarying vec2 vGW;');
      // large soft patches of lusher and sun-bleached grass so the lawn never looks flat
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
      varying vec2 vGW;
      float gH(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float gN(vec2 p) { vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(mix(gH(i), gH(i + vec2(1, 0)), u.x), mix(gH(i + vec2(0, 1)), gH(i + vec2(1, 1)), u.x), u.y); }`)
        .replace('#include <color_fragment>', `#include <color_fragment>
      {
        float n1 = gN(vGW * 0.16) * 0.65 + gN(vGW * 0.45 + 13.0) * 0.35;
        float n2 = gN(vGW * 1.3 + 41.0);
        vec3 tint = mix(vec3(0.92, 1.03, 0.86), vec3(1.06, 1.03, 0.82), smoothstep(0.35, 0.8, n1));
        diffuseColor.rgb *= tint * (0.96 + n2 * 0.06);
      }`);
    };
    this.tiles = new THREE.InstancedMesh(G.box, grass, GRID * GRID);
    this.tiles.receiveShadow = true;
    const m = new THREE.Matrix4();
    for (let y = 0; y < GRID; y++) for (let x = 0; x < GRID; x++) {
      m.makeScale(1, 0.4, 1);
      m.setPosition(x + 0.5, -0.2, y + 0.5);
      this.tiles.setMatrixAt(y * GRID + x, m);
      this.tiles.setColorAt(y * GRID + x, new THREE.Color('#7cc450'));
    }
    this.land.add(this.tiles);
  }

  // boulders along the beach and in the surf, plus a few starfish on the sand
  private buildShore() {
    const rocks: THREE.Matrix4[] = [];
    const cols: THREE.Color[] = [];
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
    const pv = new THREE.Vector3(), sv = new THREE.Vector3();
    const edge = (i: number, k: number) => {
      // walk the four sides of the island
      const side = i % 4, t = hash(i, 1, 21) * (GRID + 1.2) - 0.6;
      const out = 0.35 + hash(i, 2, 21) * k;
      if (side === 0) return [t, -out];
      if (side === 1) return [t, GRID + out];
      if (side === 2) return [-out, t];
      return [GRID + out, t];
    };
    for (let i = 0; i < 150; i++) {
      const [x, z] = edge(i, 1.1);
      const sc = 0.08 + Math.pow(hash(i, 3, 21), 2) * 0.32;
      e.set(hash(i, 4, 21) * 3, hash(i, 5, 21) * 6, hash(i, 6, 21) * 3);
      m.compose(pv.set(x, -0.42 + sc * 0.35, z), q.setFromEuler(e), sv.set(sc * 1.3, sc * 0.8, sc));
      rocks.push(m.clone());
      cols.push(new THREE.Color('#9da3a8').offsetHSL(0, 0, (hash(i, 7, 21) - 0.5) * 0.18));
    }
    const im = new THREE.InstancedMesh<THREE.BufferGeometry, THREE.Material | THREE.Material[]>(G.rock, MF('#ffffff'), rocks.length);
    rocks.forEach((mm, i) => { im.setMatrixAt(i, mm); im.setColorAt(i, cols[i]); });
    im.castShadow = true; im.receiveShadow = true;
    this.land.add(im);
    if (artStyle() === 'toon') {
      // the Blender boulder (tools/blender/world.py) takes over the shoreline rocks once loaded;
      // its stone is painted already, so the tints only nudge each copy lighter or darker
      loadModel('shore_rock').then((mdl) => {
        const src = firstMesh(mdl);
        if (!src) return;
        im.geometry = src.geometry;
        im.material = src.material;
        cols.forEach((c, i) => im.setColorAt(i, c.setRGB(1, 1, 1).offsetHSL(0, 0, (hash(i, 7, 21) - 0.5) * 0.16)));
        if (im.instanceColor) im.instanceColor.needsUpdate = true;
      }).catch(() => {});
    }
    const star = new THREE.Shape();
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2, r = i % 2 ? 0.4 : 1;
      if (i === 0) star.moveTo(Math.cos(a) * r, Math.sin(a) * r); else star.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    const sg = new THREE.ExtrudeGeometry(star, { depth: 0.25, bevelEnabled: true, bevelSize: 0.15, bevelThickness: 0.15, bevelSegments: 2 });
    sg.rotateX(-Math.PI / 2);
    for (let i = 0; i < 10; i++) {
      const [x, z] = edge(i + 400, 0.08);
      const sm = new THREE.Mesh(sg, M(['#ff8a5c', '#ff6f91', '#ffb347'][i % 3]));
      sm.scale.setScalar(0.06);
      sm.position.set(x, -0.19, z);
      sm.rotation.y = hash(i, 9, 21) * 6;
      sm.receiveShadow = true;
      this.land.add(sm);
    }
  }

  // tiles free of buildings get instanced grass tufts and wild flowers
  private rebuildFoliage() {
    const s = this.store.s;
    // a clean lawn with a few tufts reads better than a dense carpet of blades
    const dens = this.quality === 'high' ? 3 : 1;
    const key = `${dens}|${this.landKey}|${this.store.objVersion}|${s.objects.length}`;
    if (key === this.foliageKey) return;
    this.foliageKey = key;
    const used = new Uint8Array(GRID * GRID);
    for (const o of s.objects) {
      const d = BUILDING[o.type];
      const grassy = GRASSY_PEN.has(o.type);
      for (let j = 0; j < d.h; j++) for (let i = 0; i < d.w; i++) {
        // grassy pens keep grass except under the shelter and the trough
        if (grassy && !(j === 0 && i <= 1) && !(i === d.w - 1 && j === d.h - 1)) continue;
        const x = o.x + i, y = o.y + j;
        if (x >= 0 && y >= 0 && x < GRID && y < GRID) used[y * GRID + x] = 1;
      }
    }
    const spots: Spot[] = [];
    for (let y = 0; y < GRID; y++) for (let x = 0; x < GRID; x++) {
      if (used[y * GRID + x]) continue;
      const cs = chunkState(s, Math.floor(x / CHUNK), Math.floor(y / CHUNK));
      spots.push({ x, z: y, open: cs === 'open' });
    }
    this.foliage.rebuild(spots, dens);
  }

  private dynLand = new THREE.Group();

  private rebuildLand() {
    const s = this.store.s;
    const key = s.chunks.join(';');
    if (key === this.landKey) return;
    this.landKey = key;
    const col = new THREE.Color();
    for (let y = 0; y < GRID; y++) for (let x = 0; x < GRID; x++) {
      const cs = chunkState(s, Math.floor(x / CHUNK), Math.floor(y / CHUNK));
      const h = hash(x, y, 3);
      if (cs === 'open') col.set('#62b92a').offsetHSL((h - 0.5) * 0.01, 0, (h - 0.5) * 0.02);
      else if (cs === 'buyable') col.set('#58a032').offsetHSL(0, 0, (h - 0.5) * 0.05);
      else col.set('#468a2c').offsetHSL(0, 0, (h - 0.5) * 0.05);
      this.tiles.setColorAt(y * GRID + x, col);
    }
    if (this.tiles.instanceColor) this.tiles.instanceColor.needsUpdate = true;

    // locked land: forest and FOR SALE signs
    this.land.remove(this.dynLand);
    this.dynLand.traverse((o) => { if ((o as THREE.InstancedMesh).isInstancedMesh) (o as THREE.InstancedMesh).dispose(); });
    this.dynLand = new THREE.Group();
    this.signs = [];
    const pines: [number, number, number][] = [];
    const rounds: [number, number, number][] = [];
    for (let cy = 0; cy < NCH; cy++) for (let cx = 0; cx < NCH; cx++) {
      const cs = chunkState(s, cx, cy);
      if (cs === 'open') continue;
      if (cs === 'buyable') this.buildSign(this.dynLand, cx, cy);
      for (let j = 0; j < CHUNK; j++) for (let i = 0; i < CHUNK; i++) {
        const x = cx * CHUNK + i, y = cy * CHUNK + j;
        if (cs === 'buyable' && (i === 1 || i === 2) && (j === 1 || j === 2)) continue;
        if (hash(x, y, 7) >= 0.5) continue;
        const k = hash(x, y, 11);
        const jx = (hash(x, y, 13) - 0.5) * 0.5, jy = (hash(x, y, 17) - 0.5) * 0.5;
        (k < 0.55 ? pines : rounds).push([x + 0.5 + jx, y + 0.5 + jy, 0.8 + hash(x, y, 19) * 0.5]);
      }
    }
    const mtx = new THREE.Matrix4(), q = new THREE.Quaternion(), sv = new THREE.Vector3(), pv = new THREE.Vector3();
    const pineSrc = firstMesh(WORLD_MODELS.forest_pine), roundSrc = firstMesh(WORLD_MODELS.forest_round);
    if (artStyle() === 'toon' && pineSrc && roundSrc) {
      // Blender forest: one instanced mesh per kind, each copy turned, sized and tinted a little
      const up = new THREE.Vector3(0, 1, 0);
      for (const [list, src, salt] of [[pines, pineSrc, 5], [rounds, roundSrc, 9]] as const) {
        const im = new THREE.InstancedMesh(src.geometry, src.material, list.length);
        list.forEach(([x, z, sc], i) => {
          q.setFromAxisAngle(up, hash(i, salt, 3) * Math.PI * 2);
          mtx.compose(pv.set(x, 0, z), q, sv.setScalar(sc * 1.05));
          im.setMatrixAt(i, mtx);
          im.setColorAt(i, col.setRGB(1, 1, 1).offsetHSL((hash(i, salt) - 0.5) * 0.03, 0, (hash(i, salt, 7) - 0.5) * 0.14));
        });
        im.castShadow = true;
        im.receiveShadow = true;
        this.dynLand.add(im);
      }
      this.land.add(this.dynLand);
      return;
    }
    const trunks = new THREE.InstancedMesh(cylGeo(0.06, 0.09, 8), surfaceMat('bark', '#7a4a26', 4), pines.length + rounds.length);
    const pineA = new THREE.InstancedMesh(pineGeo(), new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.85 }), pines.length);
    const pineB = new THREE.InstancedMesh(pineGeo(), new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.85 }), pines.length);
    const toon = artStyle() === 'toon';
    const crown = toon
      ? new THREE.InstancedMesh(toonCrown(2, 0.04), new THREE.MeshStandardMaterial({ color: '#ffffff', vertexColors: true, roughness: 0.8 }), rounds.length)
      : new THREE.InstancedMesh(blobGeo(1, true), new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.85 }), rounds.length);
    let ti = 0;
    pines.forEach(([x, z, sc], i) => {
      mtx.compose(pv.set(x, 0.2 * sc, z), q, sv.set(1, 0.4 * sc, 1)); trunks.setMatrixAt(ti++, mtx);
      mtx.compose(pv.set(x, 0.75 * sc, z), q, sv.set(0.42 * sc, 0.9 * sc, 0.42 * sc)); pineA.setMatrixAt(i, mtx);
      mtx.compose(pv.set(x, 1.2 * sc, z), q, sv.set(0.3 * sc, 0.7 * sc, 0.3 * sc)); pineB.setMatrixAt(i, mtx);
      col.set(toon ? '#3d8a30' : '#2f6b2a').offsetHSL(0, 0, (hash(i, 5) - 0.5) * 0.08);
      pineA.setColorAt(i, col); pineB.setColorAt(i, col.offsetHSL(0, 0, 0.04));
    });
    rounds.forEach(([x, z, sc], i) => {
      mtx.compose(pv.set(x, 0.25 * sc, z), q, sv.set(1, 0.5 * sc, 1)); trunks.setMatrixAt(ti++, mtx);
      if (toon) mtx.compose(pv.set(x, 0, z), q, sv.setScalar(0.95 * sc));
      else mtx.compose(pv.set(x, 0.8 * sc, z), q, sv.set(0.42 * sc, 0.4 * sc, 0.42 * sc));
      crown.setMatrixAt(i, mtx);
      col.set(toon ? '#5aa83c' : '#3f7d2e').offsetHSL(0, 0, (hash(i, 9) - 0.5) * 0.1);
      crown.setColorAt(i, col);
    });
    // leafy card shells on the forest crowns only in high quality, they cost a lot of fill rate
    const shell = new THREE.InstancedMesh(leafShell(3, 40), leafMat('#ffffff'), this.quality === 'high' && !toon ? rounds.length : 0);
    for (let i = 0; i < shell.count; i++) {
      crown.getMatrixAt(i, mtx);
      mtx.decompose(pv, q, sv);
      mtx.compose(pv, q, sv.multiplyScalar(1.12));
      shell.setMatrixAt(i, mtx);
      crown.getColorAt(i, col);
      shell.setColorAt(i, col.offsetHSL(0, 0, 0.05));
      crown.setColorAt(i, col.offsetHSL(0, 0, -0.15));
    }
    for (const im of [trunks, pineA, pineB, crown, shell]) { im.castShadow = true; im.receiveShadow = true; this.dynLand.add(im); }
    this.land.add(this.dynLand);
  }

  private signs: THREE.Group[] = [];
  private buildSign(p: P, cx: number, cy: number) {
    const g = group(p, cx * CHUNK + CHUNK / 2, 0, cy * CHUNK + CHUNK / 2);
    if (artStyle() === 'toon' && WORLD_MODELS.forsale_sign) {
      g.add(WORLD_MODELS.forsale_sign.clone());
      g.userData.sign = true;
      this.signs.push(g);
      return;
    }
    cyl(g, 0.05, 0.05, 0.9, '#6b4226', 0, 0, 0, 6);
    const tex = canvasTex('forsale', 256, 128, (c) => {
      c.fillStyle = '#c98a45'; c.fillRect(0, 0, 256, 128);
      c.strokeStyle = '#6b4226'; c.lineWidth = 12; c.strokeRect(6, 6, 244, 116);
      c.fillStyle = '#fff8e6'; c.font = '900 48px ui-rounded, "Trebuchet MS", system-ui, sans-serif';
      c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('FOR SALE', 128, 66);
    });
    const board = new THREE.Mesh(G.box, [M('#a8733f'), M('#a8733f'), M('#a8733f'), M('#a8733f'), new THREE.MeshLambertMaterial({ map: tex }), new THREE.MeshLambertMaterial({ map: tex })]);
    board.scale.set(0.9, 0.45, 0.06);
    board.position.set(0, 0.95, 0);
    board.castShadow = true;
    g.add(board);
    g.userData.sign = true;
    this.signs.push(g);
  }

  // ------------------------------------------------ objects

  private sync() {
    const s = this.store.s;
    const key = `${this.store.objVersion}|${s.objects.length}`;
    if (key === this.syncKey) return;
    this.syncKey = key;
    const first = !this.synced;
    this.synced = true;
    const seen = new Set<number>();
    for (const o of s.objects) {
      seen.add(o.id);
      let e = this.entries.get(o.id);
      if (e && e.type !== o.type) { this.removeEntry(e); e = undefined; }
      if (!e) {
        e = this.makeEntry(o);
        this.entries.set(o.id, e);
        this.world.add(e.root);
        if (!first) e.bounce = { t: 0, kind: 'spawn' };
      } else if (e.root.position.x !== o.x || e.root.position.z !== o.y) {
        bump(e);
      }
      e.root.position.set(o.x, 0, o.y);
    }
    for (const [id, e] of this.entries) if (!seen.has(id)) this.removeEntry(e);
  }

  private synced = false;

  // squash and stretch around the footprint center
  private applyBounce(e: Entry, o: FarmObject, dt: number) {
    const d = BUILDING[o.type];
    const b = e.bounce;
    let sx = 1, sy = 1;
    if (b) {
      b.t += dt;
      const dur = b.kind === 'spawn' ? 0.6 : b.kind === 'big' ? 0.7 : 0.45;
      const k = Math.min(1, b.t / dur);
      if (b.kind === 'spawn') {
        const g = easeOutBack(k);
        sx = g; sy = g * (1 + Math.sin(k * Math.PI) * 0.15);
      } else {
        const amp = b.kind === 'big' ? 0.14 : b.kind === 'work' ? 0.035 : 0.08;
        const w = Math.sin(k * Math.PI * 3) * (1 - k) * amp;
        sy = 1 + w; sx = 1 - w * 0.6;
      }
      if (k >= 1) { e.bounce = undefined; sx = 1; sy = 1; }
    }
    e.root.scale.set(sx, sy, sx);
    e.root.position.set(o.x + (d.w / 2) * (1 - sx), 0, o.y + (d.h / 2) * (1 - sx));
  }

  private removeEntry(e: Entry) {
    this.world.remove(e.root);
    // cleared, sold or replaced: the model shrinks away with a little spin
    const r = e.root;
    r.remove(e.hit);
    FX_ROOT.add(r);
    const d = BUILDING[e.type];
    const p0 = r.position.clone();
    play(0.4, (k) => {
      const s = Math.max(0.001, 1 - easeOutBack(k) * 0.999);
      r.scale.set(s, s * (1 + Math.sin(k * Math.PI) * 0.3), s);
      r.position.set(p0.x + (d.w / 2) * (1 - s), k * 0.2, p0.z + (d.h / 2) * (1 - s));
      r.rotation.y = k * 0.6;
    }, () => FX_ROOT.remove(r));
    if (e.bubble) { this.fxLayer.remove(e.bubble); e.bubble.material.dispose(); }
    this.entries.delete(e.id);
  }

  private makeEntry(o: FarmObject): Entry {
    const d = BUILDING[o.type];
    const root = new THREE.Group();
    const e: Entry = { id: o.id, type: o.type, root, hit: null as unknown as THREE.Mesh, top: 1 };
    buildObject(e, o, d, this.store);
    const hit = new THREE.Mesh(G.box, HIT_MAT);
    const hh = Math.max(0.25, e.top);
    hit.scale.set(d.w * 0.96, hh, d.h * 0.96);
    hit.position.set(d.w / 2, hh / 2, d.h / 2);
    hit.userData.objId = o.id;
    root.add(hit);
    e.hit = hit;
    root.userData.objId = o.id;
    return e;
  }

  // ------------------------------------------------ frame

  private frameNo = 0;
  private projM = new THREE.Matrix4();
  private frustum = new THREE.Frustum();
  private cullSphere = new THREE.Sphere();
  frame(t: number) {
    const rawMs = t - (this.last || t);
    const dt = Math.min(0.05, rawMs / 1000);
    this.last = t;
    const s = this.store.s;
    const ui = this.store.ui;
    const now = Date.now();

    U.time.value = t / 1000;
    this.rebuildLand();
    this.sync();
    this.rebuildFoliage();

    // smooth camera rotation
    if (Math.abs(this.azGoal - this.az) > 0.0005) this.az += (this.azGoal - this.az) * Math.min(1, dt * 8);
    this.updateCamera();

    const moveId = ui.placing?.moveId;
    // objects outside the view only animate now and then; their state is time based, so they
    // look right again the moment they scroll into view
    this.frameNo++;
    resetSculptBudget();
    this.projM.multiplyMatrices(this.camera.projectionMatrix, this.camera.matrixWorldInverse);
    this.frustum.setFromProjectionMatrix(this.projM);
    for (const o of s.objects) {
      const e = this.entries.get(o.id);
      if (!e) continue;
      e.root.visible = o.id !== moveId;
      const d = BUILDING[o.type];
      this.cullSphere.center.set(o.x + d.w / 2, 0.6, o.y + d.h / 2);
      this.cullSphere.radius = Math.max(d.w, d.h) * 0.8 + 1.2;
      const seen = this.frustum.intersectsSphere(this.cullSphere);
      if (seen || (this.frameNo + o.id) % 24 === 0) e.update?.(o, now, t, dt);
      if (e.bounce || e.root.scale.x !== 1) this.applyBounce(e, o, dt);
    }
    tickAnims(dt);
    for (const g of this.signs) {
      // the procedural board bobs on its post; the Blender sign is one piece and just turns
      const board = g.children[1];
      if (board) board.position.y = 0.95 + Math.sin(t / 500 + g.position.x) * 0.03;
      g.rotation.y = this.az;
    }

    this.updateGhost(t);
    this.updateSelection(t);
    this.updateBubbles(t, now);
    this.consumeFx();
    this.updateFx(dt);
    this.updateActors(dt, t, now);
    this.updateCat(dt, t);
    this.updateClouds(dt);
    this.updateFishing(t, now);
    this.life.update(dt, t, this.nightNow(now), this.target);
    this.followSun();
    const wk = this.updateWeather(dt, now);
    this.updateLight(now, t, wk);

    this.sky.mesh.position.copy(this.camera.position);
    if (this.post) this.post.render();
    else this.gl.render(this.scene, this.camera);
  }

  private tmpC = new THREE.Color();
  private skyTop = new THREE.Color();
  private skyHor = new THREE.Color();
  private skyLow = new THREE.Color();
  private sunDir = new THREE.Vector3(14, 26, 8).normalize();

  private updateLight(now: number, _t: number, rainK: number) {
    const s = this.store.s;
    const nf = s.settings.dayNight ? nightFactor(now) : { night: 0, dusk: 0 };
    const n = nf.night, dk = nf.dusk;
    const c = this.tmpC;
    this.sun.castShadow = s.settings.shadows;
    this.sun.intensity = lerp(3.2, 0.45, n) * (1 - 0.45 * rainK);
    this.sun.color.set('#fff2dc').lerp(c.set('#ff9a5a'), dk * 0.7).lerp(c.set('#8fa3ff'), n);
    this.hemi.intensity = lerp(0.55, 0.35, n) * (1 - 0.15 * rainK);
    this.hemi.color.set('#d6efff').lerp(c.set('#6b7cc4'), n);
    this.scene.environmentIntensity = lerp(0.75, 0.16, n) * (1 - 0.2 * rainK);

    // gradient sky: blue by day, warm at dusk, deep navy with stars at night, grey when raining
    const grey = rainK * 0.55 * (1 - n);
    this.skyTop.set('#3f8fe0').lerp(c.set('#6a78c0'), dk * 0.5).lerp(c.set('#050b24'), n).lerp(c.set('#6d7f92'), grey);
    this.skyHor.set('#bfe6fb').lerp(c.set('#ffb27a'), dk * 0.75).lerp(c.set('#1a2a55'), n).lerp(c.set('#9aa8b5'), grey);
    this.skyLow.set('#7cc4ea').lerp(c.set('#e59a70'), dk * 0.5).lerp(c.set('#0d1838'), n).lerp(c.set('#7a8b9c'), grey);
    this.sky.set(this.skyTop, this.skyHor, this.skyLow, this.sunDir, this.sun.color, n * (1 - rainK));
    this.bg.copy(this.skyHor);
    (this.scene.fog as THREE.Fog).color.copy(this.skyHor);

    WIN.emissiveIntensity = n > 0.15 ? n * 2.6 : 0;
    for (const m of MODEL_GLOW) m.emissiveIntensity = WIN.emissiveIntensity * 0.8;
    LAMP.emissiveIntensity = 0.3 + n * 4.5;
    GLOW.opacity = n * 0.55;
    if (this.post) {
      this.post.bloom.strength = 0.12 + n * 0.75;
      // above 1.0 only emissive lights glow; white UI bubbles and sunlit walls stay crisp
      this.post.bloom.threshold = 1.02;
    }
  }

  // ------------------------------------------------ placing ghost and selection

  private updateGhost(t: number) {
    const p = this.store.ui.placing;
    if (!p) {
      if (this.ghost) { this.fxLayer.remove(this.ghost.g); this.ghost = null; }
      return;
    }
    const key = `${p.type}|${p.moveId ?? -1}`;
    if (!this.ghost || this.ghost.key !== key) {
      if (this.ghost) this.fxLayer.remove(this.ghost.g);
      const d = BUILDING[p.type];
      const fake: FarmObject = { id: -1, type: p.type, x: p.x, y: p.y };
      if (d.kind === 'production') fake.prod = { queue: [], slots: 3 };
      if (d.kind === 'pen') fake.pen = { animals: [] };
      if (d.kind === 'plot') fake.plot = { crop: null, plantedAt: 0 };
      if (d.kind === 'tree') fake.tree = { startAt: Date.now() };
      const real = p.moveId !== undefined ? this.store.obj(p.moveId) : undefined;
      const src = real ?? fake;
      const e: Entry = { id: -1, type: p.type, root: new THREE.Group(), hit: null as unknown as THREE.Mesh, top: 1 };
      buildObject(e, src, d, this.store);
      e.update?.(src, Date.now(), t, 0);
      e.root.traverse((m) => {
        const mesh = m as THREE.Mesh;
        if (mesh.isMesh) { mesh.castShadow = false; }
      });
      const foot = new THREE.Mesh(G.plane, new THREE.MeshBasicMaterial({ color: '#5cb82e', transparent: true, opacity: 0.45, depthWrite: false }));
      foot.rotation.x = -Math.PI / 2;
      foot.scale.set(d.w, d.h, 1);
      foot.position.set(d.w / 2, 0.03, d.h / 2);
      e.root.add(foot);
      this.ghost = { key, g: e.root, foot };
      this.fxLayer.add(e.root);
    }
    const ok = this.store.canPlace(p.type, p.x, p.y, p.moveId);
    (this.ghost.foot.material as THREE.MeshBasicMaterial).color.set(ok ? '#5cb82e' : '#e0533d');
    this.ghost.g.position.set(p.x, 0.06 + Math.abs(Math.sin(t / 260)) * 0.06, p.y);
  }

  private buildSelection() {
    const g = new THREE.Group();
    const mat = new THREE.MeshBasicMaterial({ color: '#ffe066', transparent: true, opacity: 0.8, depthWrite: false });
    for (let i = 0; i < 4; i++) { const m = new THREE.Mesh(G.box, mat); g.add(m); }
    g.visible = false;
    this.fxLayer.add(g);
    return g;
  }

  private updateSelection(t: number) {
    const o = this.store.obj(this.store.ui.selectedId);
    if (!o) { this.sel.visible = false; return; }
    const d = BUILDING[o.type];
    this.sel.visible = true;
    this.sel.position.set(o.x, 0.04, o.y);
    const th = 0.07;
    const [a, b, c, e] = this.sel.children as THREE.Mesh[];
    a.scale.set(d.w, 0.04, th); a.position.set(d.w / 2, 0, 0);
    b.scale.set(d.w, 0.04, th); b.position.set(d.w / 2, 0, d.h);
    c.scale.set(th, 0.04, d.h); c.position.set(0, 0, d.h / 2);
    e.scale.set(th, 0.04, d.h); e.position.set(d.w, 0, d.h / 2);
    (a.material as THREE.MeshBasicMaterial).opacity = 0.55 + Math.sin(t / 180) * 0.35;
  }

  // ------------------------------------------------ status bubbles

  private bubbleFor(o: FarmObject, d: BuildingDef, now: number): { icon: string; mode: 'ready' | 'progress' | 'faded'; p: number; count: number } | null {
    const s = this.store.s;
    switch (d.kind) {
      case 'production': {
        const info = prodInfo(o, now);
        if (info.done.length) return { icon: ITEMS[info.done[0].recipe].icon, mode: 'ready', p: 0, count: info.done.length };
        if (info.current) return { icon: ITEMS[info.current.recipe].icon, mode: 'progress', p: info.progress, count: 0 };
        return null;
      }
      case 'pen': {
        const pi = penInfo(o, now);
        if (pi.ready) return { icon: ITEMS[pi.animal.product].icon, mode: 'ready', p: 0, count: pi.ready };
        if (pi.hungry && !pi.fed && pi.total) return { icon: ITEMS[pi.animal.feed].icon, mode: 'faded', p: 0, count: 0 };
        if (pi.fed) return { icon: ITEMS[pi.animal.product].icon, mode: 'progress', p: pi.progress, count: 0 };
        return null;
      }
      case 'board':
        return s.orders.some((x) => canFulfill(s, x, now)) ? { icon: '✅', mode: 'ready', p: 0, count: 0 } : null;
      case 'tree': {
        const ti = treeInfo(o, now);
        return ti.ready ? { icon: ITEMS[ti.fruit].icon, mode: 'ready', p: 0, count: 0 } : null;
      }
      case 'stall': {
        const sold = s.stall.filter((x) => x.item && x.soldAt <= now).length;
        return sold ? { icon: '💰', mode: 'ready', p: 0, count: sold } : null;
      }
      case 'dock': {
        if (boatState(s, now) !== 'docked' || !s.boat) return null;
        const b = s.boat;
        if (b.crates.every((c) => c.filled)) return { icon: '⛵', mode: 'ready', p: 0, count: 0 };
        if (b.crates.some((c) => !c.filled && (s.inv[c.item] ?? 0) >= c.qty)) return { icon: '📦', mode: 'ready', p: 0, count: 0 };
        return null;
      }
      default:
        return null;
    }
  }

  private nightNow(now: number) {
    return this.store.s.settings.dayNight ? nightFactor(now).night : 0;
  }

  // the shadow camera follows the view so shadows stay crisp on the big map
  private followSun() {
    const sc = this.sun.shadow.camera;
    const half = clamp(Math.round(22 / this.cam.zoom), 12, 48);
    if (sc.right !== half) { sc.left = -half; sc.right = half; sc.top = half; sc.bottom = -half; sc.updateProjectionMatrix(); }
    const texel = (half * 2) / this.sun.shadow.mapSize.x;
    const x = Math.round(this.target.x / texel) * texel, z = Math.round(this.target.z / texel) * texel;
    this.sun.target.position.set(x, 0, z);
    this.sun.position.set(x + 14, 26, z + 8);
    this.sun.target.updateMatrixWorld();
    // the shadow map is redrawn every other frame, or at once when the view moves
    const key = x * 1000 + z + half * 1e7;
    if (key !== this.shadowKey || this.frameNo % 2 === 0) this.sun.shadow.needsUpdate = true;
    this.shadowKey = key;
  }
  private shadowKey = 0;

  private updateFishing(t: number, now: number) {
    const fi = fishingInfo(this.store.s, now);
    this.fishing.update(fi.state, fi.p, t);
    if (!this.fishBubble) {
      this.fishBubble = new THREE.Sprite(new THREE.SpriteMaterial({ depthTest: false, transparent: true }));
      this.fishBubble.center.set(0.5, 0);
      this.fishBubble.renderOrder = 10;
      this.fxLayer.add(this.fishBubble);
    }
    const b = this.fishBubble;
    const show = fi.state === 'ready' || fi.state === 'waiting' || fi.state === 'idle';
    b.visible = show;
    if (!show) return;
    const mode = fi.state === 'ready' ? 'ready' : fi.state === 'waiting' ? 'progress' : 'faded';
    const step = Math.round(fi.p * 24);
    const key = `${mode}|${step}`;
    if (b.userData.key !== key) {
      b.material.map = bubbleTex(fi.state === 'idle' ? '🎣' : '🐟', mode, step, 0);
      b.material.needsUpdate = true;
      b.userData.key = key;
    }
    const sc = mode === 'ready' ? 0.62 : 0.5;
    b.scale.set(sc, sc * 1.25, 1);
    b.position.set(FISH_SPOT.x, 1.4 + (mode === 'ready' ? Math.abs(Math.sin(t / 260)) * 0.14 : 0), FISH_SPOT.y);
  }

  private updateBubbles(t: number, now: number) {
    const moveId = this.store.ui.placing?.moveId;
    for (const o of this.store.s.objects) {
      const e = this.entries.get(o.id);
      if (!e) continue;
      const d = BUILDING[o.type];
      const b = o.id === moveId ? null : this.bubbleFor(o, d, now);
      if (!b) {
        if (e.bubble) e.bubble.visible = false;
        continue;
      }
      const step = b.mode === 'progress' ? Math.round(clamp(b.p, 0, 1) * 24) : 0;
      const key = `${b.icon}|${b.mode}|${step}|${b.count}`;
      if (!e.bubble) {
        e.bubble = new THREE.Sprite(new THREE.SpriteMaterial({ depthTest: false, transparent: true }));
        e.bubble.center.set(0.5, 0);
        e.bubble.renderOrder = 10;
        this.fxLayer.add(e.bubble);
      }
      if (e.bubbleKey !== key) {
        e.bubble.material.map = bubbleTex(b.icon, b.mode, step, b.count);
        e.bubble.material.needsUpdate = true;
        e.bubbleKey = key;
      }
      const sc = b.mode === 'ready' ? 0.62 : 0.5;
      e.bubble.scale.set(sc, sc * 1.25, 1);
      const bob = b.mode === 'ready' ? Math.abs(Math.sin(t / 260 + o.id)) * 0.14 : 0;
      e.bubble.position.set(o.x + d.w / 2, e.top + 0.15 + bob, o.y + d.h / 2);
      e.bubble.visible = true;
    }
  }

  // ------------------------------------------------ effects

  private consumeFx() {
    for (const f of this.store.fx) {
      const y = (f.z ?? 30) * ZU;
      if (f.kind === 'float') {
        const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: textTex(f.text ?? '', f.color ?? '#fff'), depthTest: false, transparent: true }));
        sp.scale.set(1.6, 0.3, 1);
        sp.position.set(f.gx, y + 0.4, f.gy);
        sp.renderOrder = 12;
        this.fxLayer.add(sp);
        this.floats.push({ s: sp, life: 1.5 });
      } else {
        const n = 22;
        const pos = new Float32Array(n * 3);
        const vel = new Float32Array(n * 3);
        for (let i = 0; i < n; i++) {
          pos[i * 3] = f.gx; pos[i * 3 + 1] = y; pos[i * 3 + 2] = f.gy;
          const a = Math.random() * Math.PI * 2, sp = 0.8 + Math.random() * 1.6;
          vel[i * 3] = Math.cos(a) * sp; vel[i * 3 + 1] = 2 + Math.random() * 2; vel[i * 3 + 2] = Math.sin(a) * sp;
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        const pts = new THREE.Points(geo, new THREE.PointsMaterial({ color: f.color ?? '#ffffff', size: 0.2, map: sparkTex(), transparent: true, depthWrite: false }));
        this.fxLayer.add(pts);
        this.bursts.push({ pts, vel, life: 0.9 });
      }
    }
    this.store.fx.length = 0;
  }

  private updateFx(dt: number) {
    this.bursts = this.bursts.filter((b) => {
      b.life -= dt;
      const mat = b.pts.material as THREE.PointsMaterial;
      if (b.life <= 0) { this.fxLayer.remove(b.pts); b.pts.geometry.dispose(); mat.dispose(); return false; }
      const a = b.pts.geometry.getAttribute('position') as THREE.BufferAttribute;
      const arr = a.array as Float32Array;
      for (let i = 0; i < arr.length; i += 3) {
        b.vel[i + 1] -= 7 * dt;
        arr[i] += b.vel[i] * dt; arr[i + 1] += b.vel[i + 1] * dt; arr[i + 2] += b.vel[i + 2] * dt;
      }
      a.needsUpdate = true;
      mat.opacity = clamp(b.life / 0.9, 0, 1);
      return true;
    });
    this.floats = this.floats.filter((f) => {
      f.life -= dt;
      if (f.life <= 0) { this.fxLayer.remove(f.s); f.s.material.dispose(); return false; }
      f.s.position.y += 0.7 * dt;
      f.s.material.opacity = clamp(f.life / 0.5, 0, 1);
      return true;
    });
  }

  // ------------------------------------------------ clouds

  private buildClouds() {
    const mat = new THREE.MeshBasicMaterial();
    for (let i = 0; i < 12; i++) {
      const g = new THREE.Group();
      const n = 3 + Math.floor(hash(i, 2) * 3);
      for (let k = 0; k < n; k++) {
        const m = new THREE.Mesh(G.ball, mat);
        const r = 0.9 + hash(i, k, 4) * 0.9;
        m.scale.set(r * 1.3, r * 0.8, r);
        m.position.set((k - n / 2) * 1.2, hash(i, k, 5) * 0.4, (hash(i, k, 6) - 0.5) * 1.2);
        m.castShadow = true;
        m.layers.set(2);
        g.add(m);
      }
      g.position.set(-20 + hash(i, 7) * (GRID + 40), 14 + hash(i, 8) * 4, -6 + hash(i, 9) * (GRID + 12));
      g.userData.speed = 0.35 + hash(i, 10) * 0.35;
      this.scene.add(g);
      this.clouds.push(g);
    }
  }

  private updateClouds(dt: number) {
    const on = this.store.s.settings.clouds;
    for (const g of this.clouds) {
      g.visible = on;
      g.position.x += (g.userData.speed as number) * dt;
      if (g.position.x > GRID + 26) { g.position.x = -26; g.position.z = -6 + Math.random() * (GRID + 12); }
    }
  }

  // ------------------------------------------------ weather

  private updateWeather(dt: number, now: number) {
    const on = this.store.s.settings.weather;
    const w = on ? weatherAt(now, this.season) : { kind: 'clear' as const, k: 0 };
    let kind = 'none';
    let want = 0;
    if (w.kind === 'rain') { kind = 'rain'; want = Math.round(900 * w.k); }
    else if (w.kind === 'snow') { kind = 'snow'; want = Math.round(700 * w.k); }
    else if (on && this.season === 'spring') { kind = 'petal'; want = 60; }
    else if (on && this.season === 'autumn') { kind = 'leaf'; want = 60; }
    else if (on && this.season === 'winter') { kind = 'snow'; want = 120; }
    const W = this.wx;
    const cap = 900;
    if (W.kind !== kind) {
      if (W.pts) { this.scene.remove(W.pts); W.pts.geometry.dispose(); (W.pts.material as THREE.Material).dispose(); W.pts = null; }
      if (W.rain) { this.scene.remove(W.rain); W.rain.geometry.dispose(); (W.rain.material as THREE.Material).dispose(); W.rain = null; }
      W.kind = kind;
      if (kind === 'rain') {
        const pos = new Float32Array(cap * 6);
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        for (let i = 0; i < cap; i++) this.seedDrop(pos, i, true);
        W.rain = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: '#d6e6ff', transparent: true, opacity: 0.55 }));
        W.rain.frustumCulled = false;
        this.scene.add(W.rain);
      } else if (kind !== 'none') {
        const pos = new Float32Array(cap * 3);
        const colA = new Float32Array(cap * 3);
        const cols = kind === 'petal' ? ['#ffc1d9', '#ffe1ec', '#ff9fc4'] : kind === 'leaf' ? ['#e67e22', '#d35400', '#f1c40f', '#a0522d'] : ['#ffffff'];
        const c = new THREE.Color();
        for (let i = 0; i < cap; i++) {
          pos[i * 3] = this.target.x + (Math.random() - 0.5) * 36;
          pos[i * 3 + 1] = Math.random() * 12;
          pos[i * 3 + 2] = this.target.z + (Math.random() - 0.5) * 36;
          c.set(cols[i % cols.length]);
          colA[i * 3] = c.r; colA[i * 3 + 1] = c.g; colA[i * 3 + 2] = c.b;
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        geo.setAttribute('color', new THREE.BufferAttribute(colA, 3));
        W.pts = new THREE.Points(geo, new THREE.PointsMaterial({ size: kind === 'snow' ? 0.12 : 0.16, vertexColors: true, transparent: true, opacity: 0.95 }));
        W.pts.frustumCulled = false;
        this.scene.add(W.pts);
      }
    }
    if (W.rain) {
      W.rain.geometry.setDrawRange(0, want * 2);
      const a = W.rain.geometry.getAttribute('position') as THREE.BufferAttribute;
      const arr = a.array as Float32Array;
      for (let i = 0; i < want; i++) {
        const o = i * 6;
        arr[o + 1] -= 16 * dt; arr[o + 4] -= 16 * dt;
        arr[o] -= 1.5 * dt; arr[o + 3] -= 1.5 * dt;
        if (arr[o + 4] < 0) this.seedDrop(arr, i, false);
      }
      a.needsUpdate = true;
    }
    if (W.pts) {
      W.pts.geometry.setDrawRange(0, want);
      const a = W.pts.geometry.getAttribute('position') as THREE.BufferAttribute;
      const arr = a.array as Float32Array;
      const fall = kind === 'snow' ? 1.1 : 0.9;
      for (let i = 0; i < want; i++) {
        const o = i * 3;
        arr[o + 1] -= fall * dt;
        arr[o] += (0.4 + Math.sin(now / 900 + i) * 0.6) * dt;
        arr[o + 2] += Math.cos(now / 1100 + i * 1.7) * 0.4 * dt;
        if (arr[o + 1] < 0 || Math.abs(arr[o] - this.target.x) > 20 || Math.abs(arr[o + 2] - this.target.z) > 20) {
          arr[o] = this.target.x + (Math.random() - 0.5) * 36;
          arr[o + 1] = 10 + Math.random() * 3;
          arr[o + 2] = this.target.z + (Math.random() - 0.5) * 36;
        }
      }
      a.needsUpdate = true;
    }
    return w.kind === 'rain' ? w.k : 0;
  }

  private seedDrop(arr: Float32Array, i: number, anyHeight: boolean) {
    const o = i * 6;
    const x = this.target.x + (Math.random() - 0.5) * 36, z = this.target.z + (Math.random() - 0.5) * 36;
    const y = anyHeight ? Math.random() * 14 : 12 + Math.random() * 3;
    arr[o] = x; arr[o + 1] = y + 0.45; arr[o + 2] = z;
    arr[o + 3] = x - 0.04; arr[o + 4] = y; arr[o + 5] = z;
  }

  // ------------------------------------------------ farmer and dog
  // Nobody wanders on their own: the farmer walks where the player taps, the dog trots along
  // and sits beside the farmer. At night both head home. Paths come from A* on the tile grid,
  // so neither walks through buildings.

  private nav = new Uint8Array(GRID * GRID); // 1 = blocked
  private navKey = '';
  private marker: THREE.Mesh | null = null;
  private markerT = 0;
  private homeZzz: THREE.Sprite | null = null;
  private nightMode = false;
  private zzz: THREE.Sprite | null = null;

  // blossoms for the bees: flower beds and arches, flowering crops, fruit trees
  private flowerKey = '';
  private flowerList: { x: number; y: number }[] = [];
  private flowerSpots() {
    const s = this.store.s;
    const key = `${this.store.objVersion}|${s.objects.length}`;
    if (key !== this.flowerKey) {
      this.flowerKey = key;
      this.flowerList = [];
      for (const o of s.objects) {
        const d = BUILDING[o.type];
        const bloom = o.type === 'flowers' || o.type === 'flower_arch' || d.kind === 'tree'
          || (d.kind === 'plot' && !!o.plot?.crop && CROP[o.plot.crop]?.shape === 'flower');
        if (bloom) this.flowerList.push({ x: o.x + d.w / 2, y: o.y + d.h / 2 });
      }
    }
    return this.flowerList;
  }

  private rebuildNav() {
    const s = this.store.s;
    const key = `${this.landKey}|${this.store.objVersion}|${s.objects.length}`;
    if (key === this.navKey) return false;
    this.navKey = key;
    this.nav.fill(0);
    for (let y = 0; y < GRID; y++) for (let x = 0; x < GRID; x++) if (!this.store.isUnlocked(x, y)) this.nav[y * GRID + x] = 1;
    pathTiles.clear();
    for (const o of s.objects) {
      const d = BUILDING[o.type];
      // paths are for walking on
      if (WALKABLE.has(o.type)) {
        if (o.type === 'dirt_path') pathTiles.add(o.y * GRID + o.x);
        continue;
      }
      for (let j = 0; j < d.h; j++) for (let i = 0; i < d.w; i++) {
        const x = o.x + i, y = o.y + j;
        if (x >= 0 && y >= 0 && x < GRID && y < GRID) this.nav[y * GRID + x] = 1;
      }
    }
    return true;
  }

  private free(x: number, y: number) {
    return x >= 0 && y >= 0 && x < GRID && y < GRID && !this.nav[y * GRID + x];
  }

  // nearest walkable tile to (x, y), searching outward in rings
  private nearestFree(x: number, y: number, max = 12) {
    for (let r = 0; r <= max; r++) {
      let best: { x: number; y: number } | null = null, bd = 1e9;
      for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== r || !this.free(x + dx, y + dy)) continue;
        const d = dx * dx + dy * dy;
        if (d < bd) { bd = d; best = { x: x + dx, y: y + dy }; }
      }
      if (best) return best;
    }
    return null;
  }

  // A* over tiles with diagonal steps (no corner cutting); returns tile centers to walk through
  private findPath(sx: number, sy: number, tx: number, ty: number) {
    if (!this.free(tx, ty)) return null;
    const N = GRID * GRID, start = sy * GRID + sx, goal = ty * GRID + tx;
    if (start === goal) return [];
    const gs = new Float32Array(N).fill(Infinity), from = new Int32Array(N).fill(-1), closed = new Uint8Array(N);
    const open: number[] = [start];
    const fs = new Float32Array(N).fill(Infinity);
    const hh = (i: number) => { const dx = Math.abs((i % GRID) - tx), dy = Math.abs(Math.floor(i / GRID) - ty); return Math.max(dx, dy) + 0.41 * Math.min(dx, dy); };
    gs[start] = 0; fs[start] = hh(start);
    let guard = 0;
    while (open.length && guard++ < 6000) {
      let bi = 0;
      for (let i = 1; i < open.length; i++) if (fs[open[i]] < fs[open[bi]]) bi = i;
      const cur = open[bi];
      open.splice(bi, 1);
      if (cur === goal) break;
      closed[cur] = 1;
      const cx = cur % GRID, cy = Math.floor(cur / GRID);
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy) continue;
        const nx = cx + dx, ny = cy + dy;
        if (!this.free(nx, ny)) continue;
        if (dx && dy && (!this.free(cx + dx, cy) || !this.free(cx, cy + dy))) continue;
        const ni = ny * GRID + nx;
        if (closed[ni]) continue;
        const ng = gs[cur] + (dx && dy ? 1.414 : 1);
        if (ng < gs[ni]) {
          gs[ni] = ng; fs[ni] = ng + hh(ni); from[ni] = cur;
          if (!open.includes(ni)) open.push(ni);
        }
      }
    }
    if (from[goal] < 0) return null;
    const path: { x: number; y: number }[] = [];
    for (let i = goal; i !== start; i = from[i]) path.push({ x: (i % GRID) + 0.5, y: Math.floor(i / GRID) + 0.5 });
    return path.reverse();
  }

  private send(a: Actor, tx: number, ty: number) {
    const sx = Math.floor(a.x), sy = Math.floor(a.y);
    const p = this.findPath(sx, sy, tx, ty);
    if (!p) return false;
    a.path = p;
    a.goal = { x: tx, y: ty };
    return true;
  }

  // a free tile next to the farmer's goal for the dog to sit on
  private dogSpot(tx: number, ty: number) {
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]]) {
      if (this.free(tx + dx, ty + dy)) return { x: tx + dx, y: ty + dy };
    }
    return null;
  }

  // called when the player taps free farmland
  walkTo(tx: number, ty: number) {
    this.rebuildNav();
    const f = this.farmer, g = this.dog;
    f.inside = false;
    g.sleeping = false;
    if (!this.send(f, tx, ty)) return;
    const ds = this.dogSpot(tx, ty);
    if (ds) this.send(g, ds.x, ds.y);
    this.showMarker(tx + 0.5, ty + 0.5);
  }

  private showMarker(x: number, z: number) {
    if (!this.marker) {
      const tex = canvasTex('ring', 128, 128, (c) => {
        c.strokeStyle = '#ffffff'; c.lineWidth = 10;
        c.beginPath(); c.arc(64, 64, 50, 0, Math.PI * 2); c.stroke();
        c.fillStyle = 'rgba(255,255,255,0.35)';
        c.beginPath(); c.arc(64, 64, 20, 0, Math.PI * 2); c.fill();
      });
      this.marker = new THREE.Mesh(G.plane, new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, color: '#fff3a0' }));
      this.marker.rotation.x = -Math.PI / 2;
      this.fxLayer.add(this.marker);
    }
    this.marker.position.set(x, 0.05, z);
    this.markerT = 1;
  }

  // the farmer's home door: the manor if there is one, else the farmhouse
  private homeDoor() {
    const s = this.store.s;
    const home = s.objects.find((o) => o.type === 'manor') ?? s.objects.find((o) => o.type === 'house');
    if (!home) return null;
    const d = BUILDING[home.type];
    const door = home.type === 'manor' ? { x: home.x + 1, y: home.y + d.h } : { x: home.x, y: home.y + d.h };
    const kennel = home.type === 'manor' ? { x: home.x + 2.62, y: home.y + 2.55, rot: -0.5 } : null;
    // the Blender farmhouse has its entrance in the middle of the front: a last step up to the porch
    const step = home.type === 'house' && artStyle() === 'toon' ? { x: home.x + 1, y: home.y + d.h + 0.08 } : null;
    return { door, kennel, step };
  }

  private updateActors(dt: number, t: number, now: number) {
    const f = this.farmer, g = this.dog;
    this.rebuildNav();
    // placed a building on top of them: hop to the nearest free tile
    for (const a of [f, g]) {
      if (a.inside || a.sleeping) continue;
      const tx = Math.floor(a.x), ty = Math.floor(a.y);
      if (!this.free(tx, ty)) {
        const n = this.nearestFree(tx, ty) ?? this.nearestFree(Math.floor(this.target.x), Math.floor(this.target.z), 30);
        if (n) { a.x = n.x + 0.5; a.y = n.y + 0.5; a.path = []; }
      }
      // the path got blocked by something new: plan again or stop
      if (a.path.length && a.path.some((p) => !this.free(Math.floor(p.x), Math.floor(p.y)))) {
        if (!a.goal || !this.send(a, a.goal.x, a.goal.y)) a.path = [];
      }
    }

    // bedtime and morning
    const nf = this.store.s.settings.dayNight ? nightFactor(now) : { night: 0, dusk: 0 };
    // bedtime comes with the night, or whenever the player sends the farmer to nap
    const nightNow = nf.night > 0.55 || this.store.ui.napping;
    if (nightNow !== this.nightMode) {
      this.nightMode = nightNow;
      const h = this.homeDoor();
      if (nightNow && h) {
        const d = this.free(h.door.x, h.door.y) ? h.door : this.nearestFree(h.door.x, h.door.y, 4);
        const walking = d ? this.send(f, d.x, d.y) : false;
        if (walking && d === h.door && h.step && this.free(Math.floor(h.step.x), Math.floor(h.step.y))) f.path.push(h.step);
        f.goHome = true;
        // no way to the door (fenced in): step straight inside
        if (!walking) f.path = [];
        const ds = h.kennel ? this.nearestFree(Math.floor(h.kennel.x), Math.floor(h.kennel.y + 0.6), 3) : d ? this.dogSpot(d.x, d.y) : null;
        if (ds) { this.send(g, ds.x, ds.y); g.goHome = true; }
      } else if (!nightNow) {
        if (f.inside) { f.inside = false; }
        g.sleeping = false;
        f.goHome = g.goHome = false;
      }
    }

    this.step(f, 1.3, dt);
    this.step(g, 2.0, dt);
    if (f.goHome && !f.path.length) { f.goHome = false; if (this.nightMode) f.inside = true; }
    if (g.goHome && !g.path.length) {
      g.goHome = false;
      if (this.nightMode) {
        g.sleeping = true;
        const h = this.homeDoor();
        if (h?.kennel) { g.heading = h.kennel.rot + Math.PI; }
      }
    }
    // the dog keeps up: if it falls far behind the farmer it catches up by path
    const fd = Math.hypot(g.x - f.x, g.y - f.y);
    if (!g.sleeping && !g.goHome && !g.path.length && fd > 2.5 && !f.inside) {
      const ds = this.dogSpot(Math.floor(f.x), Math.floor(f.y));
      if (ds) this.send(g, ds.x, ds.y);
    }
    // idle: the dog sits facing the farmer
    if (!g.moving && !g.sleeping && fd < 2.6 && fd > 0.1) g.heading = Math.atan2(f.x - g.x, f.y - g.y);

    if (this.marker) {
      this.markerT = Math.max(0, this.markerT - dt * 0.9);
      const k = this.markerT;
      this.marker.visible = k > 0;
      this.marker.scale.setScalar(0.5 + (1 - k) * 0.5);
      (this.marker.material as THREE.MeshBasicMaterial).opacity = k;
    }

    for (const a of [f, g]) {
      a.phase += dt * (a.moving ? (a === g ? 16 : 10) : 0);
      // stepping inside the door: shrink away, and grow back out in the morning
      a.fade = clamp(a.fade + (a.inside ? -dt * 3 : dt * 3), 0, 1);
      a.g.visible = a.fade > 0.01;
      a.g.scale.setScalar(0.3 + a.fade * 0.7);
      a.g.position.set(a.x, a.moving ? Math.abs(Math.sin(a.phase)) * 0.03 : 0, a.y);
      const cur = a.g.rotation.y;
      let diff = a.heading - cur;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      a.g.rotation.y = cur + diff * Math.min(1, dt * 10);
      animateLegs(a.g, a.moving ? Math.sin(a.phase) * 0.7 : 0);
      const head = a.g.userData.head as THREE.Object3D | undefined;
      blink(a.g, t, a === g ? 7 : 3);
      if (a === g) {
        const tail = a.g.userData.tail as THREE.Object3D;
        const legs = a.g.userData.legs as THREE.Object3D[];
        if (a.sleeping) {
          // curled up asleep: legs tucked, body low, slow breathing, eyes shut
          legs.forEach((l, i) => { l.rotation.x = i < 2 ? -1.4 : 1.4; });
          a.g.position.y = -0.1 + Math.sin(t / 900) * 0.004;
          if (head) { head.rotation.x = 0.35; head.rotation.z = 0; }
          if (tail) tail.rotation.z = 0.9;
          for (const e of (head?.userData.eyes as THREE.Object3D[] | undefined) ?? []) e.scale.y = 0.1;
        } else {
          if (tail) tail.rotation.z = Math.sin(t / (a.moving ? 60 : 120)) * 0.6;
          if (head) { head.rotation.z = a.moving ? 0 : Math.sin(t / 1700) * 0.22; head.rotation.x = a.moving ? 0 : Math.max(0, Math.sin(t / 2100) - 0.7) * 1.5; }
        }
      } else {
        const body = a.g.userData.body as THREE.Object3D | undefined;
        // breathing and looking around while standing still
        if (body) body.position.y = a.moving ? 0 : Math.sin(t / 650) * 0.005;
        if (head) head.rotation.y = a.moving ? head.rotation.y * 0.9 : Math.sin(t / 2300) * 0.5;
        const arms = a.g.userData.arms as THREE.Object3D[] | undefined;
        if (arms && a.moving) arms[1].rotation.z = 0.12;
        if (arms && !a.moving) {
          // a friendly wave every few seconds
          const w = Math.max(0, Math.sin(t / 2600) - 0.8) * 5;
          arms[1].rotation.x = -w * 2.4;
          arms[1].rotation.z = 0.12 + w * 0.4 + Math.sin(t / 90) * 0.25 * w;
        }
      }
    }

    // sleepy Z z z above the dog
    if (!this.zzz) {
      this.zzz = new THREE.Sprite(new THREE.SpriteMaterial({ map: textTex('z Z z', '#dfe8ff'), transparent: true, depthWrite: false }));
      this.zzz.scale.set(0.9, 0.17, 1);
      this.fxLayer.add(this.zzz);
    }
    this.zzz.visible = g.sleeping;
    if (g.sleeping) {
      this.zzz.position.set(g.x + 0.15, 0.45 + Math.sin(t / 600) * 0.05, g.y);
      this.zzz.material.opacity = 0.6 + Math.sin(t / 400) * 0.3;
    }
    // and a bigger one drifting up from the roof while the farmer sleeps inside
    if (!this.homeZzz) {
      this.homeZzz = new THREE.Sprite(new THREE.SpriteMaterial({ map: textTex('z Z z', '#eef3ff'), transparent: true, depthWrite: false }));
      this.fxLayer.add(this.homeZzz);
    }
    const home = f.inside ? this.homeDoor() : null;
    this.homeZzz.visible = !!home;
    if (home) {
      const k = (t / 2200) % 1;
      this.homeZzz.position.set(home.door.x + 0.6 + k * 0.3, 2.2 + k * 0.8, home.door.y - 1);
      this.homeZzz.scale.set(1.4 + k * 0.4, 0.27 + k * 0.08, 1);
      this.homeZzz.material.opacity = Math.sin(k * Math.PI) * 0.9;
    }
  }

  // The farm cat does as it pleases: it strolls between the house and wherever the farmer is,
  // sits for a while, and curls up by the door at night or while the farmer naps.
  private updateCat(dt: number, t: number) {
    const c = this.cat;
    const tx = Math.floor(c.x), ty = Math.floor(c.y);
    if (!c.sleeping && !this.free(tx, ty)) {
      const n = this.nearestFree(tx, ty);
      if (n) { c.x = n.x + 0.5; c.y = n.y + 0.5; c.path = []; }
    }
    const home = this.homeDoor();
    if (this.nightMode) {
      if (!c.sleeping && !c.goHome && home) {
        const d = this.nearestFree(home.door.x + 1, home.door.y, 4);
        if (d && this.send(c, d.x, d.y)) c.goHome = true;
        else c.sleeping = true;
      }
      if (c.goHome && !c.path.length) { c.goHome = false; c.sleeping = true; }
    } else {
      c.sleeping = false;
      c.goHome = false;
      this.catWait -= dt;
      if (this.catWait <= 0 && !c.path.length) {
        this.catWait = 4 + Math.random() * 6;
        const f = this.farmer;
        const around = Math.random() < 0.55 && home ? home.door : { x: Math.floor(f.x), y: Math.floor(f.y) };
        const gx = around.x + Math.floor(Math.random() * 7) - 3, gy = around.y + Math.floor(Math.random() * 5) - 1;
        if (this.free(gx, gy)) this.send(c, gx, gy);
      }
    }
    this.step(c, 1.6, dt);
    c.phase += dt * (c.moving ? 14 : 0);
    c.g.position.set(c.x, 0, c.y);
    let diff = c.heading - c.g.rotation.y;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    c.g.rotation.y += diff * Math.min(1, dt * 8);
    const legs = c.g.userData.legs as THREE.Object3D[];
    const head = c.g.userData.head as THREE.Object3D | undefined;
    const tail = c.g.userData.tail as THREE.Object3D | undefined;
    if (c.sleeping) {
      // curled up: legs tucked, body low, tail wrapped round
      legs.forEach((l, i) => { l.rotation.x = i < 2 ? -1.4 : 1.4; });
      c.g.position.y = -0.07 + Math.sin(t / 900) * 0.003;
      if (head) { head.rotation.x = 0.4; head.rotation.y = 0.5; }
      if (tail) tail.rotation.z = 1.1;
      for (const e of (head?.userData.eyes as THREE.Object3D[] | undefined) ?? []) e.scale.y = 0.1;
    } else {
      animateLegs(c.g, c.moving ? Math.sin(c.phase) * 0.6 : 0);
      blink(c.g, t, 11);
      if (head) { head.rotation.x = 0; head.rotation.y = c.moving ? 0 : Math.sin(t / 1900) * 0.6; }
      if (tail) tail.rotation.z = Math.sin(t / (c.moving ? 180 : 700)) * 0.45;
    }
  }

  // follow the path; returns true when standing still
  private step(a: Actor, speed: number, dt: number) {
    if (a.inside || a.sleeping || !a.path.length) { a.moving = false; return true; }
    const p = a.path[0];
    const dx = p.x - a.x, dy = p.y - a.y, d = Math.hypot(dx, dy);
    const mv = speed * dt;
    a.moving = true;
    a.heading = Math.atan2(dx, dy);
    if (d <= mv) { a.x = p.x; a.y = p.y; a.path.shift(); if (!a.path.length) a.moving = false; }
    else { a.x += (dx / d) * mv; a.y += (dy / d) * mv; }
    return !a.moving;
  }
}

// ------------------------------------------------------------------ model builders

function shade(hex: string, p: number) {
  return '#' + new THREE.Color(hex).offsetHSL(0, 0, p).getHexString();
}

const capsCache = new Map<string, THREE.CapsuleGeometry>();
function capsGeo(r: number, len: number) {
  const k = `${r.toFixed(3)}|${len.toFixed(3)}`;
  let g = capsCache.get(k);
  if (!g) { g = new THREE.CapsuleGeometry(r, len, 6, 14); capsCache.set(k, g); }
  return g;
}
// capsule centered at x,y,z, lying along the y axis before rotation
function caps(p: P, r: number, len: number, color: string | THREE.Material, x: number, y: number, z: number, rx = 0, rz = 0) {
  const m = new THREE.Mesh(capsGeo(r, len), typeof color === 'string' ? M(color) : color);
  m.position.set(x, y, z);
  m.rotation.set(rx, 0, rz);
  m.castShadow = true;
  m.receiveShadow = true;
  p.add(m);
  return m;
}

const EYE_W = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.3 });
const EYE_B = new THREE.MeshStandardMaterial({ color: '#16110d', roughness: 0.15 });
// a pair of cartoon eyes looking along +z, centered on x = 0
// Each eye sits in its own group so it can blink by squashing it vertically.
function eyes(p: P, spread: number, y: number, z: number, r: number, white = true) {
  const list: THREE.Object3D[] = (p.userData.eyes as THREE.Object3D[] | undefined) ?? [];
  for (const sx of [-1, 1]) {
    const e = group(p, sx * spread, y, z);
    if (white) mk(e, G.ball, EYE_W, r, r * 1.1, r * 0.6, 0, 0, 0, false);
    mk(e, G.ball, EYE_B, r * 0.62, r * 0.72, r * 0.45, 0, 0, r * 0.3, false);
    mk(e, G.ball, EYE_W, r * 0.2, r * 0.2, r * 0.15, r * 0.18, r * 0.25, r * 0.5, false);
    list.push(e);
  }
  p.userData.eyes = list;
}

// quick blink every few seconds, each creature on its own rhythm
function blink(m: THREE.Object3D, t: number, id: number) {
  const head = (m.userData.head as THREE.Object3D | undefined) ?? m;
  const list = head.userData.eyes as THREE.Object3D[] | undefined;
  if (!list) return;
  const period = 3200 + (id % 7) * 450;
  const ph = (t + id * 997) % period;
  const k = ph < 140 ? 0.12 : 1;
  for (const e of list) e.scale.y = k;
}

function legPivot(g: THREE.Group, x: number, y: number, z: number, len: number, th: number, color: string, list: THREE.Object3D[], foot?: string) {
  const p = group(g, x, y, z);
  const r = th / 2;
  caps(p, r, Math.max(0.001, len - th), color, 0, -len / 2, 0);
  if (foot) mk(p, cylGeo(r * 1.05, r * 1.15, 10), M(foot), 1, th * 0.7, 1, 0, -len + th * 0.35, 0);
  list.push(p);
  return p;
}

function animateLegs(g: THREE.Object3D, s: number) {
  const legs = g.userData.legs as THREE.Object3D[] | undefined;
  const signs = g.userData.signs as number[] | undefined;
  if (legs && signs) legs.forEach((l, i) => { l.rotation.x = s * signs[i]; });
  const arms = g.userData.arms as THREE.Object3D[] | undefined;
  if (arms) arms.forEach((a, i) => { a.rotation.x = s * (i ? 0.8 : -0.8); });
}

export function buildFarmer(shirt = '#d64541', overall = '#3b6fa8', jeans = '#2f5d8a') {
  if (artStyle() === 'toon') return buildToonFarmer(shirt, overall, jeans);
  const g = new THREE.Group();
  const legs: THREE.Object3D[] = [];
  legPivot(g, -0.05, 0.3, 0, 0.28, 0.08, jeans, legs);
  legPivot(g, 0.05, 0.3, 0, 0.28, 0.08, jeans, legs);
  legs.forEach((l) => ball(l, 0.05, '#5a3517', 0, -0.28, 0.025, 0.9, 0.6, 1.4));
  const body = group(g);
  const pp = personParts(shirt, overall);
  // sculpted shirt and overalls, with brass buttons on the straps
  const torso = new THREE.Mesh(pp.torso, SCULPT_MAT);
  torso.castShadow = torso.receiveShadow = true;
  body.add(torso);
  for (const sx of [-1, 1]) ball(body, 0.012, '#f2d16b', sx * 0.05, 0.495, 0.1);
  const arms: THREE.Object3D[] = [];
  for (const sx of [-1, 1]) {
    const a = group(body, sx * 0.13, 0.52, 0);
    caps(a, 0.036, 0.12, shirt, 0, -0.08, 0);
    ball(a, 0.038, '#f2c49b', 0, -0.19, 0);
    a.rotation.z = sx * 0.12;
    arms.push(a);
  }
  const head = group(body, 0, 0.66, 0);
  const hm = new THREE.Mesh(pp.head, SCULPT_MAT);
  hm.castShadow = hm.receiveShadow = true;
  head.add(hm);
  eyes(head, 0.04, 0.02, 0.092, 0.018, false);
  // straw hat: wide brim, rounded crown, red band
  const hat = group(head, 0, 0.06, 0);
  mk(hat, cylGeo(0.2, 0.2, 24), M('#e8c35a'), 1, 0.018, 1, 0, 0.0, 0);
  mk(hat, G.dome, M('#edc865'), 0.1, 0.09, 0.1, 0, 0.01, 0);
  mk(hat, cylGeo(0.102, 0.102, 20), M('#b5452c'), 1, 0.025, 1, 0, 0.022, 0);
  hat.rotation.x = -0.12;
  contactShadow(g, 0.34, 0.26);
  g.userData.legs = legs;
  g.userData.signs = [1, -1];
  g.userData.arms = arms;
  g.userData.head = head;
  g.userData.body = body;
  return g;
}

// Cartoon farmer to match the cartoon animals: big head, round belly, chunky boots and hands
function buildToonFarmer(shirt: string, overall: string, jeans: string) {
  const g = new THREE.Group();
  const legs: THREE.Object3D[] = [];
  legPivot(g, -0.06, 0.28, 0, 0.26, 0.095, jeans, legs);
  legPivot(g, 0.06, 0.28, 0, 0.26, 0.095, jeans, legs);
  legs.forEach((l) => ball(l, 0.062, '#6a3e1c', 0, -0.26, 0.03, 0.95, 0.7, 1.45));
  const body = group(g);
  const pp = toonPersonParts(shirt, overall);
  const torso = new THREE.Mesh(pp.torso, TOON_MAT);
  torso.castShadow = torso.receiveShadow = true;
  body.add(torso);
  for (const sx of [-1, 1]) ball(body, 0.015, '#f2d16b', sx * 0.058, 0.515, 0.118);
  const arms: THREE.Object3D[] = [];
  for (const sx of [-1, 1]) {
    const a = group(body, sx * 0.15, 0.53, 0);
    caps(a, 0.046, 0.12, shirt, 0, -0.08, 0);
    ball(a, 0.052, '#f6c9a0', 0, -0.2, 0);
    a.rotation.z = sx * 0.16;
    arms.push(a);
  }
  const head = group(body, 0, 0.74, 0);
  const hm = new THREE.Mesh(pp.head, TOON_MAT);
  hm.castShadow = hm.receiveShadow = true;
  head.add(hm);
  toonEyes(head, [0.05, 0.028, 0.116, 0.03, 0.22], '#6b4020');
  // big straw hat with a red band
  const hat = group(head, 0, 0.085, -0.01);
  mk(hat, cylGeo(0.235, 0.225, 28), M('#efc95e'), 1, 0.022, 1, 0, 0.0, 0);
  mk(hat, G.dome, M('#f2cf68'), 0.14, 0.12, 0.14, 0, 0.01, 0);
  mk(hat, cylGeo(0.142, 0.142, 24), M('#c0392b'), 1, 0.032, 1, 0, 0.026, 0);
  // tipped back so the face shows from the farm camera
  hat.rotation.x = -0.32;
  contactShadow(g, 0.4, 0.3);
  g.userData.legs = legs;
  g.userData.signs = [1, -1];
  g.userData.arms = arms;
  g.userData.head = head;
  g.userData.body = body;
  return g;
}

// the Blender farmer (tools/blender/animals.py): legs on the hips, and a body group carrying the
// torso, both arms and the head, like the sculpted farmer, so the walk cycle drives it unchanged
function farmerFromModel(src: THREE.Object3D) {
  const g = new THREE.Group();
  const body = group(g);
  const legs: THREE.Object3D[] = [], arms: THREE.Object3D[] = [];
  let head: THREE.Object3D | null = null;
  for (const c of [...src.clone().children]) {
    if (/^leg\d$/.test(c.name)) { legs[+c.name.slice(3)] = c; g.add(c); }
    else if (/^arm\d$/.test(c.name)) { const i = +c.name.slice(3); arms[i] = c; c.rotation.z = (i ? 1 : -1) * 0.16; body.add(c); }
    else if (c.name === 'head') { head = c; body.add(c); }
    else body.add(c);
  }
  if (head) {
    // the hat brim would shade the whole face; a cartoon face stays bright under it
    (head as THREE.Object3D).traverse((c) => { c.receiveShadow = false; });
    toonEyes(head, [0.05, 0.028, 0.116, 0.03, 0.22], '#6b4020');
  }
  contactShadow(g, 0.4, 0.3);
  g.userData.legs = legs;
  g.userData.signs = [1, -1];
  g.userData.arms = arms;
  g.userData.head = head;
  g.userData.body = body;
  return g;
}

export function buildCat() {
  const g = assemble('cat');
  const cp = creature('cat');
  if (g.userData.model) modelEyes(g, 'cat');
  else if (cp?.eye) toonEyes(g.userData.head as THREE.Group, cp.eye, '#3a2e28');
  g.scale.setScalar(1.25);
  return g;
}

export function buildDog() {
  const g = assemble('dog');
  const dp = creature('dog');
  if (g.userData.model) modelEyes(g, 'dog');
  else if (dp?.eye && dp.toon) toonEyes(g.userData.head as THREE.Group, dp.eye, '#3a2e28');
  else if (dp?.eye) realEyes(g.userData.head as THREE.Group, dp.eye, LID.dog);
  const tail = g.userData.tail as THREE.Object3D;
  tail.rotation.x = -0.6;
  return g;
}

// ------------------------------------------------------------------ animals

function fourLegs(g: THREE.Group, w: number, d: number, len: number, th: number, color: string, foot?: string) {
  const legs: THREE.Object3D[] = [];
  for (const [x, z] of [[-w / 2, d / 2], [w / 2, d / 2], [-w / 2, -d / 2], [w / 2, -d / 2]]) legPivot(g, x, len, z, len, th, color, legs, foot);
  g.userData.legs = legs;
  g.userData.signs = [1, -1, -1, 1];
}

function buildAnimal(kind: string) {
  return animalBody(kind);
}

// Soft contact shadow under a creature, so it sits on the ground even where the sun shadow is
// thin (and in low quality, where there is no ambient occlusion pass).
let blobMat: THREE.MeshBasicMaterial | null = null;
function contactShadow(p: P, w: number, d: number) {
  if (!blobMat) {
    const tex = canvasTex('blob', 64, 64, (c) => {
      const gr = c.createRadialGradient(32, 32, 0, 32, 32, 32);
      gr.addColorStop(0, 'rgba(0,0,0,0.55)');
      gr.addColorStop(0.6, 'rgba(0,0,0,0.25)');
      gr.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = gr; c.fillRect(0, 0, 64, 64);
    });
    blobMat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, color: '#ffffff' });
  }
  const m = new THREE.Mesh(G.plane, blobMat);
  m.rotation.x = -Math.PI / 2;
  m.scale.set(w, d, 1);
  m.position.y = 0.006;
  m.renderOrder = 1;
  p.add(m);
  return m;
}

// Level of detail for sculpted creatures. Every animal starts on the light mesh; once the
// camera comes close, the fine sculpt for that kind is built in idle time (one kind at a time,
// so there is no hitch) and swapped in. Far away animals drop back to the light mesh.
type LodPart = 'body' | 'head' | 'leg' | 'tail';
// the fine sculpt only for close ups; at the usual farm view the light mesh is indistinguishable
const LOD_NEAR = 20, LOD_FAR = 23;
let sculptBudget = 1;
const resetSculptBudget = () => { sculptBudget = 1; };
const lodWanted = new Set<string>();
let lodBusy = false;
function lodPump() {
  if (lodBusy || !lodWanted.size) return;
  lodBusy = true;
  const idle = (cb: () => void) => {
    const ric = (globalThis as { requestIdleCallback?: (f: () => void, o?: { timeout: number }) => number }).requestIdleCallback;
    if (ric) ric(cb, { timeout: 400 }); else setTimeout(cb, 30);
  };
  idle(() => {
    const kind = lodWanted.values().next().value as string;
    lodWanted.delete(kind);
    creature(kind, 0);
    lodBusy = false;
    lodPump();
  });
}
const lodPos = new THREE.Vector3();
function lodMesh(m: THREE.Mesh, kind: string, part: LodPart) {
  let near = false;
  // runs only for meshes in view; the swap shows from the next frame on
  m.onBeforeRender = (_r, _s, cam) => {
    const d = cam.position.distanceTo(lodPos.setFromMatrixPosition(m.matrixWorld));
    const want = near ? d < LOD_FAR : d < LOD_NEAR && getQuality() === 'high';
    if (want === near) return;
    if (want && !hasCreature(kind, 0)) { lodWanted.add(kind); lodPump(); return; }
    const cp = creature(kind, want ? 0 : 1);
    const geo = cp?.[part];
    if (!geo) return;
    near = want;
    m.geometry = geo;
  };
}

// ------------------------------------------------------------------ static batching
// Pens, fences and sheds are built from dozens of little boxes and cylinders. Once built they
// never move, so they are baked into one mesh per material: a pen goes from ~60 draw calls
// (times three with the shadow and ambient occlusion passes) to a handful.
function bakeable(o: THREE.Object3D): o is THREE.Mesh {
  const m = o as THREE.Mesh;
  return !!m.isMesh && !(o as THREE.InstancedMesh).isInstancedMesh && !Array.isArray(m.material) && o.visible && !o.userData.noMerge && !o.userData.keep && !m.onBeforeRender.length;
}
function mergeStatic(root: THREE.Object3D) {
  root.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(root.matrixWorld).invert();
  const rel = new THREE.Matrix4();
  const buckets = new Map<string, { mat: THREE.Material; cast: boolean; recv: boolean; geos: THREE.BufferGeometry[]; meshes: THREE.Mesh[] }>();
  const walk = (node: THREE.Object3D) => {
    for (const ch of node.children) {
      if (bakeable(ch)) {
        const mat = ch.material as THREE.Material;
        const key = `${mat.uuid}|${ch.castShadow}|${ch.receiveShadow}`;
        let b = buckets.get(key);
        if (!b) { b = { mat, cast: ch.castShadow, recv: ch.receiveShadow, geos: [], meshes: [] }; buckets.set(key, b); }
        const g = ch.geometry.index ? ch.geometry.toNonIndexed() : ch.geometry.clone();
        g.applyMatrix4(rel.multiplyMatrices(inv, ch.matrixWorld));
        b.geos.push(g);
        b.meshes.push(ch);
      }
      walk(ch);
    }
  };
  walk(root);
  for (const b of buckets.values()) {
    if (b.meshes.length < 2) continue;
    const names = ['position', 'normal', 'uv', 'color'].filter((a) => b.geos.some((g) => g.getAttribute(a)));
    for (const g of b.geos) {
      for (const a of Object.keys(g.attributes)) if (!names.includes(a)) g.deleteAttribute(a);
      const n = g.getAttribute('position').count;
      if (names.includes('uv') && !g.getAttribute('uv')) g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(n * 2), 2));
      if (names.includes('color') && !g.getAttribute('color')) g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(n * 3).fill(1), 3));
      if (!g.getAttribute('normal')) g.computeVertexNormals();
      g.clearGroups();
    }
    const merged = mergeGeometries(b.geos);
    if (!merged) continue;
    for (const m of b.meshes) m.removeFromParent();
    const mesh = new THREE.Mesh(merged, b.mat);
    mesh.castShadow = b.cast;
    mesh.receiveShadow = b.recv;
    root.add(mesh);
  }
}

// Puts a sculpted creature together on pivots: legs swing from the hips, the head nods from
// the neck and the tail swishes from its root.
// Blender animals (tools/blender/animals.py): a body plus `head`, `leg0..3` and `tail` parts
// already sitting on their pivots. Until a kind's model has loaded (or if it cannot load) the
// sculpt stands in; pens rebuild their herd when a model arrives.
const ANIMAL_MODELS = new Set([
  'alpaca', 'angora_goat', 'bactrian_camel', 'barn_owl', 'beaver', 'belted_galloway', 'bison', 'black_sheep',
  'black_swan', 'buffalo', 'camel', 'cashmere_goat', 'cassowary', 'cat', 'chicken', 'chinchilla', 'cow',
  'crane', 'dog', 'donkey', 'duck', 'emu', 'flamingo', 'goat', 'gobbler', 'golden_goose', 'goose',
  'guinea_fowl', 'highland_cow', 'horse', 'jacob_sheep', 'jersey_cow', 'kiwi_bird', 'llama', 'mandarin_duck',
  'merino_sheep', 'moose', 'muscovy_duck', 'musk_ox', 'nubian_goat', 'ostrich', 'parrot', 'peacock',
  'pheasant', 'pony', 'quail', 'rabbit', 'reindeer', 'rhea', 'sheep', 'silkie_chicken', 'silkworm',
  'spotted_deer', 'squirrel', 'swan', 'vicuna', 'watusi', 'yak', 'zebu',
  'hereford', 'suffolk_sheep', 'bronze_turkey', 'saanen_goat', 'ayam_cemani', 'grey_heron',
]);
const animalSrc = new Map<string, THREE.Object3D>();
let animalVer = 0;
function animalModel(kind: string) {
  if (!ANIMAL_MODELS.has(kind) || artStyle() !== 'toon') return null;
  const src = animalSrc.get(kind);
  if (!src && !modelCache.has(`animal_${kind}`)) {
    loadModel(`animal_${kind}`).then((m) => { animalSrc.set(kind, m); animalVer++; }).catch(() => {});
  }
  return src ?? null;
}
function assembleModel(src: THREE.Object3D) {
  const g = new THREE.Group();
  const legs: THREE.Object3D[] = [];
  for (const c of [...src.clone().children]) {
    if (c.name === 'eye') {
      // where the right eye goes: position in the model, radius in its scale, yaw in its turn
      g.userData.eyeAt = { p: c.position.clone(), r: c.scale.x, yaw: c.rotation.y };
      continue;
    }
    if (c.name === 'head') g.userData.head = c;
    else if (c.name === 'tail') g.userData.tail = c;
    else if (/^leg\d$/.test(c.name)) legs[+c.name.slice(3)] = c;
    else if ((c as THREE.Mesh).isMesh) {
      const bb = new THREE.Box3().setFromObject(c);
      g.userData.shadow = contactShadow(g, (bb.max.x - bb.min.x) * 1.5, (bb.max.z - bb.min.z) * 1.25);
    }
    g.add(c);
  }
  g.userData.legs = legs;
  g.userData.signs = legs.length === 4 ? [1, -1, -1, 1] : [1, -1];
  g.userData.model = true;
  return g;
}

// small natural eyes on a Blender animal's head, where its model marks them
function modelEyes(g: THREE.Object3D, kind: string) {
  const ea = g.userData.eyeAt as { p: THREE.Vector3; r: number; yaw: number } | undefined;
  const head = g.userData.head as THREE.Object3D | undefined;
  if (!ea || !head) return;
  const lp = ea.p.clone().sub(head.position);
  realEyes(head, [Math.abs(lp.x), lp.y, lp.z, ea.r, ea.yaw], LID[kind] ?? '#3a2a20');
}

function assemble(kind: string) {
  const src = animalModel(kind);
  if (src) return assembleModel(src);
  const g = new THREE.Group();
  const cp = creature(kind);
  if (!cp) return g;
  const add = (p: P, geo: THREE.BufferGeometry, mat: THREE.Material, part: LodPart) => {
    const m = new THREE.Mesh(geo, mat);
    m.castShadow = true;
    m.receiveShadow = true;
    lodMesh(m, kind, part);
    p.add(m);
    return m;
  };
  const fur = cp.toon ? TOON_MAT : SCULPT_MAT;
  add(g, cp.body, cp.wool ? (cp.toon ? TOON_WOOL : WOOL_MAT) : fur, 'body');
  cp.body.computeBoundingBox();
  const bb = cp.body.boundingBox as THREE.Box3;
  g.userData.shadow = contactShadow(g, (bb.max.x - bb.min.x) * 1.5, (bb.max.z - bb.min.z) * 1.25);
  const legs: THREE.Object3D[] = [];
  for (const [x, z] of cp.legs) {
    const pv = group(g, x, cp.legLen, z);
    if (cp.leg) add(pv, cp.leg, fur, 'leg');
    legs.push(pv);
  }
  const head = group(g, ...cp.headAt);
  add(head, cp.head, fur, 'head');
  g.userData.legs = legs;
  g.userData.signs = legs.length === 4 ? [1, -1, -1, 1] : [1, -1];
  g.userData.head = head;
  if (cp.tail) {
    const tail = group(g, ...cp.tailAt);
    add(tail, cp.tail, fur, 'tail');
    g.userData.tail = tail;
  }
  return g;
}

// shared torus shapes, so eye rims and horns are not rebuilt for every animal
const torusCache = new Map<string, THREE.TorusGeometry>();
function torus(r: number, t: number, rs: number, ts: number, arc = Math.PI * 2) {
  const k = `${r}|${t}|${rs}|${ts}|${arc}`;
  let g = torusCache.get(k);
  if (!g) { g = new THREE.TorusGeometry(r, t, rs, ts, arc); torusCache.set(k, g); }
  return g;
}

// Realistic eyes: a glossy dark eyeball set into the side of the head with a lid rim and a
// tiny catch light, turned outward the way prey animals' eyes are.
const EYE_REAL = new THREE.MeshStandardMaterial({ color: '#140e0a', roughness: 0.05, metalness: 0.1 });
function realEyes(head: THREE.Object3D, spec: [number, number, number, number, number], lid: string) {
  const [x, y, z, r, yaw] = spec;
  const list: THREE.Object3D[] = (head.userData.eyes as THREE.Object3D[] | undefined) ?? [];
  for (const sx of [-1, 1]) {
    const e = group(head, sx * x, y, z);
    e.rotation.y = sx * yaw;
    mk(e, G.ball, EYE_REAL, r, r * 0.9, r * 0.75, 0, 0, 0, false);
    mk(e, G.ball, EYE_W, r * 0.22, r * 0.22, r * 0.12, sx * r * 0.25, r * 0.3, r * 0.68, false);
    const rim = mk(e, torus(1, 0.22, 6, 18), M(lid), r * 1.02, r * 0.92, r * 1.0, 0, 0, r * 0.1, false);
    rim.rotation.y = 0;
    list.push(e);
  }
  head.userData.eyes = list;
}

// Cartoon eyes: a big white eye with a dark pupil looking forward and two catch lights, and a
// soft lid on top in the coat color.
const EYE_TOON = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.12 });
const eyeGeoCache = new Map<string, THREE.BufferGeometry>();
function toonEyeGeo(r: number, sx: number, lid: string) {
  const key = `${r.toFixed(4)}|${sx}|${lid}`;
  let g = eyeGeoCache.get(key);
  if (g) return g;
  const parts: [THREE.BufferGeometry, string, number, number, number, number, number, number][] = [
    [G.ball, '#ffffff', r, r * 1.12, r * 0.8, 0, 0, 0],
    [G.ball, '#1a120c', r * 0.58, r * 0.7, r * 0.4, -sx * r * 0.12, -r * 0.05, r * 0.52],
    [G.ball, '#ffffff', r * 0.2, r * 0.2, r * 0.1, sx * r * 0.1, r * 0.3, r * 0.86],
    [G.ball, '#ffffff', r * 0.09, r * 0.09, r * 0.05, -sx * r * 0.28, -r * 0.3, r * 0.84],
    [torus(1, 0.1, 6, 20, Math.PI), lid, r * 1.02, r * 1.1, r * 0.8, 0, 0, r * 0.12],
  ];
  const m = new THREE.Matrix4(), c = new THREE.Color();
  const geos = parts.map(([geo, col, a, b, d, px, py, pz]) => {
    const p = (geo.index ? geo.toNonIndexed() : geo.clone());
    p.applyMatrix4(m.makeScale(a, b, d).setPosition(px, py, pz));
    for (const k of Object.keys(p.attributes)) if (k !== 'position' && k !== 'normal') p.deleteAttribute(k);
    c.set(col);
    const n = p.getAttribute('position').count, arr = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { arr[i * 3] = c.r; arr[i * 3 + 1] = c.g; arr[i * 3 + 2] = c.b; }
    p.setAttribute('color', new THREE.BufferAttribute(arr, 3));
    return p;
  });
  g = mergeGeometries(geos) as THREE.BufferGeometry;
  eyeGeoCache.set(key, g);
  return g;
}

function toonEyes(head: THREE.Object3D, spec: [number, number, number, number, number], lid: string) {
  const [x, y, z, r0, yaw] = spec;
  // big googly eyes are most of a cartoon animal's charm
  const r = r0 * 1.25;
  const list: THREE.Object3D[] = [];
  for (const sx of [-1, 1]) {
    const e = group(head, sx * x, y, z);
    e.rotation.y = sx * yaw;
    // the white, pupil, two catch lights and the lid are one vertex colored mesh per eye
    mk(e, toonEyeGeo(r, sx, lid), EYE_TOON, 1, 1, 1, 0, 0, 0, false);
    list.push(e);
  }
  head.userData.eyes = list;
}

const LID: Record<string, string> = {
  cow: '#e9e3d8', sheep: '#1f1b19', goat: '#e3dccd', horse: '#6a3e22', chicken: '#c9642c',
  duck: '#1a4a2e', rabbit: '#8a7058', alpaca: '#c9b08c', goose: '#e8a33a', dog: '#7a4b26',
  quail: '#6a4a2a', yak: '#2a1e16', camel: '#a8845a',
  gobbler: '#9ab8d8', donkey: '#6a655f', buffalo: '#2a2a2c', peacock: '#1f4fb8', ostrich: '#9a7a70',
};

const TALL = new Set(['camel', 'ostrich', 'emu', 'flamingo', 'reindeer', 'llama', 'rhea', 'cassowary', 'crane', 'bactrian_camel', 'moose', 'spotted_deer', 'vicuna', 'grey_heron']);
// birds that float on their pond instead of walking
const SWIMMERS = new Set(['duck', 'swan', 'mandarin_duck', 'black_swan']);

function animalBody(kind: string) {
  const g = assemble(kind);
  const head = g.userData.head as THREE.Group | undefined;
  if (!head) return g;
  const cp = creature(kind);
  if (g.userData.model) {
    // Blender animals: natural proportions and small natural eyes, a little larger than life so
    // they still read well against their pens
    g.scale.setScalar(TALL.has(kind) ? 1.08 : 1.25);
    modelEyes(g, kind);
  } else if (cp?.toon) {
    // cartoon animals read bigger against their pens, like in classic farm games
    g.scale.setScalar(TALL.has(kind) ? 1.15 : 1.35);
  }
  if (g.userData.model) { /* eyes done above */ } else if (cp?.eye && cp.toon) toonEyes(head, cp.eye, '#3a2e28');
  else if (cp?.eye) realEyes(head, cp.eye, LID[kind] ?? '#3a2a20');
  if (cp?.bell && !g.userData.model) {
    // leather collar with a brass bell
    const [bx, by, bz, br] = cp.bell;
    const collar = new THREE.Mesh(torus(br, br * 0.16, 8, 28), M('#c0392b'));
    collar.position.set(bx, by, bz);
    collar.rotation.x = -0.7;
    collar.castShadow = true;
    g.add(collar);
    const bell = new THREE.Mesh(G.ball, new THREE.MeshStandardMaterial({ color: '#e8b53a', metalness: 0.85, roughness: 0.3 }));
    bell.scale.set(br * 0.32, br * 0.36, br * 0.32);
    bell.position.set(bx, by - br * 0.78, bz + br * 0.62);
    g.add(bell);
  }
  switch (kind) {
    case 'goat':
      if (cp?.toon) break;
      // ridged horns sweeping back over the neck
      for (const sx of [-1, 1]) {
        const horn = new THREE.Mesh(torus(0.05, 0.01, 8, 18, Math.PI * 0.85), M('#8d8479'));
        horn.position.set(sx * 0.022, 0.04, -0.045);
        horn.rotation.set(0, Math.PI / 2, 0.1);
        horn.castShadow = true;
        head.add(horn);
      }
      break;
    case 'chicken': case 'goose': case 'gobbler': case 'peacock': case 'ostrich': case 'quail':
    case 'guinea_fowl': case 'pheasant': case 'emu': case 'flamingo': case 'golden_goose':
    case 'silkie_chicken': case 'muscovy_duck': case 'crane': case 'rhea': case 'cassowary': case 'kiwi_bird': case 'parrot':
    case 'bronze_turkey': case 'ayam_cemani': case 'grey_heron': g.userData.peck = true; break;
    case 'yak':
      if (cp?.toon) break;
      // long horns curving up and out
      for (const sx of [-1, 1]) {
        const horn = new THREE.Mesh(torus(0.07, 0.014, 8, 16, Math.PI * 0.6), M('#e8e0cc'));
        horn.position.set(sx * 0.07, 0.06, -0.02);
        horn.rotation.set(0, sx > 0 ? 0 : Math.PI, 0.9);
        horn.castShadow = true;
        head.add(horn);
      }
      break;
    case 'buffalo':
      if (cp?.toon) break;
      // wide crescent horns sweeping back from the top of the head
      for (const sx of [-1, 1]) {
        const horn = new THREE.Mesh(torus(0.1, 0.018, 8, 20, Math.PI * 0.75), M('#5a5048'));
        horn.position.set(sx * 0.05, 0.06, -0.04);
        horn.rotation.set(0, sx > 0 ? 0 : Math.PI, -0.2);
        horn.castShadow = true;
        head.add(horn);
      }
      break;
    case 'rabbit': case 'squirrel': case 'chinchilla': g.userData.hop = true; break;
  }
  return g;
}

// beehive skep: stacked straw coils rising to a rounded top
let skep: THREE.BufferGeometry | null = null;
function skepGeo() {
  if (skep) return skep;
  const pts: THREE.Vector2[] = [new THREE.Vector2(0, 0)];
  const rings = 7;
  for (let i = 0; i <= rings * 4; i++) {
    const t = i / (rings * 4);
    const base = 0.16 * Math.sqrt(Math.max(0, 1 - Math.pow(t, 2.2))) + 0.01;
    const coil = Math.abs(Math.sin(t * rings * Math.PI)) * 0.012;
    pts.push(new THREE.Vector2(base + coil, t * 0.27));
  }
  pts.push(new THREE.Vector2(0, 0.275));
  skep = new THREE.LatheGeometry(pts, 24);
  return skep;
}

let hiveSrc: THREE.Object3D | null = null;
function buildHive() {
  const g = new THREE.Group();
  if (artStyle() === 'toon' && !hiveSrc && !modelCache.has('beehive_skep')) {
    // the bee garden rebuilds its hives (like a herd) once the Blender skep is in
    loadModel('beehive_skep').then((m) => { hiveSrc = m; animalVer++; }).catch(() => {});
  }
  if (hiveSrc) g.add(hiveSrc.clone());
  else {
    // a round straw skep on a little wooden stand
    for (const [x, z] of [[-0.1, -0.1], [0.1, -0.1], [-0.1, 0.1], [0.1, 0.1]]) cyl(g, 0.015, 0.015, 0.08, '#8a5a33', x, 0, z, 6);
    bxT(g, 0.34, 0.03, 0.34, 'planks', '#b98048', 0, 0.08, 0, 4);
    mk(g, skepGeo(), surfaceMat('thatch', '#e8c160', 3, 0.9), 1, 1, 1, 0, 0.11, 0);
    mk(g, G.ball, M('#3a2616'), 0.035, 0.028, 0.01, 0, 0.14, 0.14, false);
    ball(g, 0.02, '#c9983a', 0, 0.39, 0, 1, 0.6, 1);
  }
  const bees = group(g);
  for (let i = 0; i < 4; i++) {
    const b = group(bees);
    ball(b, 0.018, '#f5c518', 0, 0, 0, 0.9, 0.9, 1.3, false);
    ball(b, 0.019, '#2a1a10', 0, 0, -0.008, 0.85, 0.85, 0.35, false);
    ball(b, 0.014, '#e8f4ff', 0.012, 0.016, 0, 1.2, 0.35, 0.8, false);
    ball(b, 0.014, '#e8f4ff', -0.012, 0.016, 0, 1.2, 0.35, 0.8, false);
  }
  g.userData.bees = bees;
  return g;
}

function animalSpot(d: BuildingDef, id: number, t: number) {
  const u = hash(id, 1, 3), v = hash(id, 2, 5);
  const m = d.w >= 3 ? 0.55 : 0.45;
  let cx = m + u * (d.w - m * 2), cz = m + v * (d.h - m * 2);
  if (cx < 1.1 && cz < 1.1) { cx += 0.6; cz += 0.3; }
  const ph = (t / 5200) * (0.5 + u * 0.5) + id * 1.3 + 0.35 * Math.sin(t / 2300 + id);
  const r = 0.2 + v * 0.14;
  const x = clamp(cx + Math.cos(ph) * r, 0.3, d.w - 0.3);
  const z = clamp(cz + Math.sin(ph) * r * 0.8, 0.3, d.h - 0.3);
  return { x, z, heading: Math.atan2(-Math.sin(ph), Math.cos(ph) * 0.8) };
}

// ------------------------------------------------------------------ crops

const fruitMats = new Map<string, THREE.MeshStandardMaterial>();
function fruitMat(color: string) {
  let m = fruitMats.get(color);
  if (!m) { m = new THREE.MeshStandardMaterial({ color, roughness: 0.4, vertexColors: true }); fruitMats.set(color, m); }
  return m;
}

// Blender crops (tools/blender/crops.py): a `plant` and its `fruit`, whose baked ripe colors
// swap for a plain green while the crop grows. Plots replant quietly once a model arrives.
const cropSrc = new Map<string, THREE.Object3D>();
let cropVer = 0;
const unripeMats = new Map<string, THREE.MeshStandardMaterial>();
function cropModel(id: string) {
  if (artStyle() !== 'toon') return null;
  const src = cropSrc.get(id);
  if (!src && !modelCache.has(`crop_${id}`)) {
    loadModel(`crop_${id}`).then((m) => { cropSrc.set(id, m); cropVer++; }).catch(() => {});
  }
  return src ?? null;
}
function plantModel(cd: CropDef) {
  const src = cropModel(cd.id);
  if (src) {
    const g = new THREE.Group();
    const fruit: THREE.Mesh[] = [];
    for (const c of [...src.clone().children]) {
      g.add(c);
      if (c.name === 'fruit' && (c as THREE.Mesh).isMesh) {
        const f = c as THREE.Mesh;
        const unripe = cd.shape === 'flower' ? '#9cc45a' : '#b9d36a';
        let um = unripeMats.get(unripe);
        if (!um) { um = new THREE.MeshStandardMaterial({ color: unripe, roughness: 0.5 }); unripeMats.set(unripe, um); }
        f.userData.ripe = f.material;
        f.userData.unripe = um;
        fruit.push(f);
      }
    }
    return { g, fruit };
  }
  const g = new THREE.Group();
  const geo = cropGeo(cd);
  const plant = new THREE.Mesh(geo.plant, PLANT_MAT);
  const fr = new THREE.Mesh(geo.fruit, fruitMat(cd.fruit));
  for (const m of [plant, fr]) { m.castShadow = true; m.receiveShadow = true; g.add(m); }
  // bushy crops get a shell of painted leaf cards over their leafy core, like the trees
  const bushy = (cd.shape === 'bush' && cd.id !== 'cotton') || cd.id === 'potato';
  if (bushy) {
    const low = cd.id === 'strawberry';
    const shell = new THREE.Mesh(leafShell(cd.id.length * 3 + 1, 36), leafMat(shade(cd.leaf, 0.02)));
    shell.scale.set(0.088, low ? 0.05 : 0.085, 0.088);
    shell.position.set(0, low ? 0.07 : 0.17, 0);
    shell.receiveShadow = true;
    g.add(shell);
  }
  return { g, fruit: [fr] };
}

// ------------------------------------------------------------------ object builders

function buildStandIn(e: Entry, o: FarmObject, d: BuildingDef, store: GameStore) {
  switch (d.kind) {
    case 'plot': return buildPlot(e);
    case 'house': case 'barn': return d.id === 'manor' ? buildManor(e, d) : buildHouse(e, d);
    case 'production': return d.id === 'fishing_pier' ? buildPier(e, d) : buildHouse(e, d);
    case 'silo': return buildSilo(e);
    case 'board': return buildBoard(e);
    case 'pen': return buildPen(e, d);
    case 'tree': return buildFruitTree(e, d);
    case 'stall': return buildStall(e, d, store);
    case 'dock': return buildDock(e, store);
    case 'obstacle': return buildObstacle(e, o);
    case 'deco': return buildDeco(e, d);
  }
}
function buildObject(e: Entry, o: FarmObject, d: BuildingDef, store: GameStore) {
  buildStandIn(e, o, d, store);
  useModel(e, o, d);
}

const WET_MAT = new THREE.MeshStandardMaterial({ color: '#241206', transparent: true, opacity: 0.45, roughness: 0.15, depthWrite: false });
const DROP_MAT = new THREE.MeshStandardMaterial({ color: '#9fdcff', roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.85 });
function buildPlot(e: Entry) {
  const g = e.root;
  bxT(g, 0.92, 0.1, 0.92, 'soil', '#8a5a34', 0.5, 0, 0.5, 2, false);
  for (let k = 0; k < 4; k++) {
    const r = mk(g, cylGeo(0.07, 0.07, 10), surfaceMat('soil', '#7a4c2a', 3), 1, 0.8, 1, 0.5, 0.1, 0.2 + k * 0.2, false);
    r.rotation.z = Math.PI / 2;
    r.scale.set(1, 0.8, 0.45);
  }
  const crop = keep(group(g));
  // a watered field: darker, glistening soil with a few drops, until the crop is ready
  const wet = keep(mk(g, G.box, WET_MAT, 0.9, 0.01, 0.9, 0.5, 0.118, 0.5, false));
  const drops = keep(group(g));
  for (let k = 0; k < 7; k++) mk(drops, G.ball, DROP_MAT, 0.018, 0.012, 0.018, 0.15 + hash(k, 3) * 0.7, 0.125, 0.15 + hash(k, 5) * 0.7, false);
  wet.visible = drops.visible = false;
  let cur: string | null = null;
  let wasReady = false;
  let first = true;
  let born = 0, cver = cropVer;
  let plants: { g: THREE.Group; fruit: THREE.Mesh[]; ripe: number }[] = [];
  e.top = 0.55;
  e.update = (o, now, t) => {
    const pp = plotProgress(o, now);
    // a crop model that just arrived swaps in without the harvest or planting fuss
    const reload = !!cur && pp.crop === cur && cver !== cropVer;
    if (pp.crop !== cur || reload) {
      cver = cropVer;
      // harvested: the grown plants jump out of the soil
      if (!reload && !first && cur && wasReady) {
        plants.forEach((pl, i) => popOut(pl.g, i * 0.06, 1.1));
        bump(e, 'big');
      }
      crop.clear();
      plants = [];
      const planted = !reload && !first && !!pp.crop;
      cur = pp.crop;
      if (cur) {
        const cd = CROP[cur];
        for (const [x, z] of [[0.3, 0.3], [0.7, 0.3], [0.3, 0.7], [0.7, 0.7]]) {
          const pm = plantModel(cd);
          pm.g.position.set(x, 0.1, z);
          pm.g.userData.base = 1.5;
          pm.g.rotation.y = hash(x * 10, z * 10, 3) * 6;
          crop.add(pm.g);
          plants.push({ ...pm, ripe: -1 });
        }
        if (planted) { born = t; bump(e); }
      }
    }
    first = false;
    wasReady = pp.ready;
    const isWet = !!cur && !pp.ready && !!o.plot?.watered;
    wet.visible = drops.visible = isWet;
    if (isWet) drops.children.forEach((d, k) => { d.scale.setScalar(0.012 + Math.max(0, Math.sin(t / 400 + k * 1.7)) * 0.01); });
    if (!cur) return;
    const cd = CROP[cur];
    const s = pp.p;
    plants.forEach((pl, i) => {
      // freshly planted seedlings sprout one after another with a little overshoot
      const age = (t - born) / 1000 - i * 0.08;
      const grow = born ? (age <= 0 ? 0.001 : age >= 0.6 ? 1 : easeOutBack(age / 0.6)) : 1;
      const k = 1.5 * grow;
      const ready = pp.ready ? 1 + Math.max(0, Math.sin(t / 380 + i * 1.3)) * 0.05 : 1;
      pl.g.scale.set(k * (0.5 + 0.5 * s), k * (0.2 + 0.8 * s) * ready, k * (0.5 + 0.5 * s));
      pl.g.rotation.z = Math.sin(t / (pp.ready ? 420 : 900) + i + o.id) * (pp.ready ? 0.1 : 0.03);
      pl.g.rotation.x = Math.sin(t / 1300 + i * 2 + o.id) * 0.04;
      const ripe = pp.ready ? 1 : 0;
      for (const f of pl.fruit) { f.visible = s > 0.45; }
      if (pl.ripe !== ripe) {
        for (const f of pl.fruit) {
          f.material = ripe ? (f.userData.ripe ?? fruitMat(cd.fruit)) : (f.userData.unripe ?? fruitMat(cd.shape === 'flower' ? '#9cc45a' : '#b9d36a'));
        }
        pl.ripe = ripe;
      }
    });
  };
}

function smoke(g: THREE.Group, x: number, y: number, z: number) {
  const puffs = [0, 1, 2].map(() => {
    const m = new THREE.Mesh(G.ball, new THREE.MeshLambertMaterial({ color: '#f0f0f0', transparent: true, opacity: 0.6, flatShading: true, depthWrite: false }));
    g.add(m);
    return m;
  });
  return (on: boolean, t: number) => {
    puffs.forEach((m, k) => {
      m.visible = on;
      if (!on) return;
      const ph = (t / 1700 + k / 3) % 1;
      m.position.set(x + ph * 0.3 + Math.sin(t / 500 + k) * 0.04, y + ph * 1.1, z - ph * 0.1);
      const s = 0.08 + ph * 0.16;
      m.scale.set(s, s, s);
      (m.material as THREE.MeshLambertMaterial).opacity = 0.6 * (1 - ph);
    });
  };
}

// ------------------------------------------------------------------ Blender models
// Hand built models made in Blender (see tools/blender), loaded from public/models. They are Draco
// compressed (the decoder lives in public/draco); each file is fetched once and cloned per copy.
const gltfLoader = new GLTFLoader().setDRACOLoader(new DRACOLoader().setDecoderPath('/draco/'));
const modelCache = new Map<string, Promise<THREE.Object3D>>();
// model materials with a baked emission mask (windows, lamps), lit up at night like WIN
const MODEL_GLOW = new Set<THREE.MeshStandardMaterial>();
function loadModel(name: string) {
  let p = modelCache.get(name);
  if (!p) {
    p = gltfLoader.loadAsync(`/models/${name}.glb`).then((gl) => {
      gl.scene.traverse((o) => {
        const m = o as THREE.Mesh;
        if (!m.isMesh) return;
        m.castShadow = true;
        m.receiveShadow = true;
        const mat = m.material as THREE.MeshStandardMaterial;
        if (mat.emissiveMap) {
          mat.emissive.set('#ffc766');
          mat.emissiveIntensity = WIN.emissiveIntensity;
          MODEL_GLOW.add(mat);
        }
      });
      gl.scene.userData.top = new THREE.Box3().setFromObject(gl.scene).max.y;
      return gl.scene;
    });
    modelCache.set(name, p);
  }
  return p;
}

// scenery models the land builder uses once loaded (forest trees, FOR SALE sign)
const WORLD_MODELS: Record<string, THREE.Object3D> = {};
function firstMesh(o?: THREE.Object3D) {
  let found: THREE.Mesh | null = null;
  o?.traverse((c) => { if (!found && (c as THREE.Mesh).isMesh) found = c as THREE.Mesh; });
  return found as THREE.Mesh | null;
}

// The procedural building stands in until its model has loaded and is then swapped out; if the
// model cannot load, the procedural building simply stays. Placement ghosts keep the procedural
// look, since their see through styling is applied once when they are built.
function swapInModel(e: Entry, name: string, x: number, z: number, scale: number, onSwap?: () => void) {
  if (e.id < 0) return;
  const standIn = [...e.root.children];
  loadModel(name).then((src) => {
    const m = src.clone();
    m.position.set(x, 0, z);
    m.scale.setScalar(scale);
    for (const c of standIn) e.root.remove(c);
    e.root.add(m);
    onSwap?.();
  }).catch(() => { /* keep the procedural building */ });
}

// Buildings with a Blender model, by building id. Models sit centered on the footprint, front to
// +z. Named nodes drive the game side: `smoke*` empties puff (always, or only while producing),
// `glow*` empties get a pool of lamp light at night, `badge` carries the product icon, and
// `spin<Axis>*` / `sway<Axis>*` meshes turn about their origin. Stand in parts flagged
// `userData.keep` (water, goods on display, the boat) stay when the model swaps in.
interface ModelSpec { smoke?: 'always' | 'busy'; badge?: number; variants?: number }
const MODELS: Record<string, ModelSpec> = {
  barn: {}, silo: {}, board: {}, stall: {}, dock: {}, fishing_pier: { badge: 0.22 }, manor: { smoke: 'always' },
};
for (const id of ['hay_bale', 'picket_fence', 'bird_house', 'pumpkin_pile', 'birdbath', 'topiary', 'well', 'flower_arch',
  'hay_wagon', 'tractor', 'bench', 'lamp', 'scarecrow', 'windmill', 'pond', 'mailbox', 'gazebo', 'fountain',
  'sundial', 'bird_feeder', 'garden_swing', 'bonfire', 'totem_pole', 'picnic_spot', 'wind_turbine', 'stone_bridge', 'pergola', 'horse_statue', 'torii_gate', 'zen_garden', 'treehouse', 'greenhouse', 'water_tower', 'carousel', 'lighthouse', 'clock_tower', 'hot_air_balloon', 'golden_farmer']) MODELS[id] = {};
for (const d of Object.values(BUILDING)) if (d.kind === 'pen') MODELS[d.id] = {};
for (const d of Object.values(BUILDING)) if (d.kind === 'tree') MODELS[d.id] = {};
MODELS.flowers = {};
MODELS.sprinkler = {};
MODELS.stone_path = {};
MODELS.oak = {};
MODELS.tree_obs = { variants: 2 };
MODELS.rock_obs = { variants: 3 };
MODELS.plot = {};
MODELS.bush_obs = { variants: 2 };
for (const id of ['bakery', 'feed_mill', 'dairy', 'sugar_mill', 'bbq_grill', 'juice_press', 'loom', 'jam_maker', 'ice_cream',
  'sushi_bar', 'salad_bar', 'pizzeria', 'coffee_kiosk', 'oil_press', 'florist', 'workshop']) MODELS[id] = { badge: 0.26 };
function keep<T extends THREE.Object3D>(o: T) {
  o.userData.keep = true;
  return o;
}
function useModel(e: Entry, o: FarmObject, d: BuildingDef) {
  const spec = MODELS[d.id];
  if (!spec || e.id < 0 || artStyle() !== 'toon') return;
  const g = e.root;
  const standIn = g.children.filter((c) => !c.userData.keep);
  const cx = d.w / 2, cz = d.h / 2;
  loadModel(spec.variants ? `${d.id}${o.id % spec.variants}` : d.id).then((src) => {
    const m = src.clone();
    m.position.set(cx, 0, cz);
    // trees: the model's foliage joins the stand in's swaying crown group, beside its fruit
    const leaves = m.getObjectByName('crown');
    const crown = leaves && standIn.find((c) => c.userData.crown);
    for (const c of standIn) if (c !== crown) g.remove(c);
    g.add(m);
    if (leaves && crown) {
      for (const c of [...crown.children]) if (!c.userData.keep) crown.remove(c);
      crown.add(leaves);
    }
    const puffs: ((on: boolean, t: number) => void)[] = [];
    const movers: { o: THREE.Object3D; spin: boolean; axis: 'x' | 'y' | 'z'; base: number }[] = [];
    for (const c of m.children) {
      const x = cx + c.position.x, y = c.position.y, z = cz + c.position.z;
      const mv = /^(spin|sway)([XYZ])/.exec(c.name);
      if (c.name.startsWith('smoke')) puffs.push(smoke(g, x, y, z));
      else if (c.name.startsWith('glow')) groundGlow(g, x, z, 1.1 * c.scale.x);
      else if (c.name === 'badge') badge(g, d.icon, spec.badge ?? 0.3, x, y, z, c.rotation.y).translateZ(0.01);
      else if (mv) {
        const axis = mv[2].toLowerCase() as 'x' | 'y' | 'z';
        movers.push({ o: c, spin: mv[1] === 'spin', axis, base: c.rotation[axis] });
      }
    }
    e.top = src.userData.top ?? e.top;
    const hh = Math.max(0.25, e.top);
    e.hit.scale.y = hh;
    e.hit.position.y = hh / 2;
    const mode = spec.smoke ?? (d.kind === 'production' ? 'busy' : 'always');
    const prev = e.update;
    e.update = (o, now, t, dt) => {
      prev?.(o, now, t, dt);
      const busy = d.kind === 'production' && !!prodInfo(o, now).current;
      const on = mode === 'always' || busy;
      puffs.forEach((p, i) => p(on, t + i * 700));
      for (const v of movers) {
        if (v.spin) { if (mode === 'always' || busy) v.o.rotation[v.axis] += dt * 2.4; }
        else v.o.rotation[v.axis] = v.base + Math.sin(t / 2300 + e.id) * 0.6 + Math.sin(t / 830) * 0.08;
      }
    };
  }).catch(() => { /* keep the procedural building */ });
}

function buildHouse(e: Entry, d: BuildingDef) {
  const g = e.root;
  const w = d.w, h = d.h, H = d.height * ZU;
  const cx = w / 2, cz = h / 2, ww = w - 0.5, dd = h - 0.5, y0 = 0.08;
  const wallKind: SurfaceKind = d.kind === 'house' ? 'siding' : 'boards';
  const wallMat = surfaceMat(wallKind, d.wall, d.kind === 'house' ? 1 : 1.3);
  bxT(g, w - 0.14, y0, h - 0.14, 'stone', '#b9b3a4', cx, 0, cz, 2.2);
  const walls = new THREE.Mesh(meterBox(ww, H, dd), wallMat);
  walls.position.set(cx, y0 + H / 2, cz);
  walls.castShadow = true; walls.receiveShadow = true;
  g.add(walls);
  const rh = 0.45 + Math.min(ww, dd) * 0.3;
  roofT(g, ww + 0.34, rh, dd + 0.34, d.roof, wallMat, cx, y0 + H, cz, 0.17);
  mk(g, cylGeo(0.06, 0.06, 10), M(shade(d.roof, -0.14)), 1, ww + 0.42, 1, cx, y0 + H + rh - 0.01, cz).rotation.z = Math.PI / 2;
  // white trim along the eaves and corners
  for (const sz of [-1, 1]) bx(g, ww + 0.36, 0.05, 0.05, '#f4efe6', cx, y0 + H - 0.02, cz + sz * (dd / 2 + 0.17));
  for (const [ex, ez] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) bx(g, 0.07, H, 0.07, barnTrim(d), cx + ex * ww / 2, y0, cz + ez * dd / 2);
  const fz = cz + dd / 2, rx = cx + ww / 2;
  const barn = d.kind === 'barn';
  const shutter = shade(d.roof, 0.04);
  const doorX = d.kind === 'house' ? cx - ww * 0.22 : cx;
  const dh = H * (barn ? 0.62 : 0.5);
  if (barn) {
    // big barn door with white X braces, a hay loft and a hoist beam
    const bd = group(g, doorX, y0, fz + 0.01);
    bxT(bd, 0.56, dh, 0.04, 'boards', '#9a3326', 0, 0, 0, 2);
    bx(bd, 0.64, 0.05, 0.05, '#fbeee0', 0, dh, 0.01);
    for (const sx of [-1, 1]) bx(bd, 0.05, dh, 0.05, '#fbeee0', sx * 0.3, 0, 0.01);
    for (const r of [0.72, -0.72]) { const m = bx(bd, 0.035, dh * 1.2, 0.02, '#fbeee0', 0, 0, 0.035); m.rotation.z = r; m.position.y = dh / 2; }
    const loft = group(g, cx, y0 + H * 0.7, fz + 0.01);
    bx(loft, 0.34, 0.3, 0.03, '#6b2a20', 0, 0, 0);
    bx(loft, 0.4, 0.04, 0.05, '#fbeee0', 0, 0.3, 0.01);
    for (const sx of [-1, 1]) bx(loft, 0.04, 0.3, 0.05, '#fbeee0', sx * 0.18, 0, 0.01);
    mk(loft, G.box, surfaceMat('thatch', '#e8c865', 3), 0.28, 0.1, 0.06, 0, 0.05, 0.02);
    bx(loft, 0.06, 0.06, 0.28, '#6b4226', 0, 0.42, 0.1);
    bx(g, ww, 0.06, 0.05, '#fbeee0', cx, y0 + H - 0.06, fz);
  } else {
    // paneled door in a white frame with a stone step, a little awning and a porch lamp
    const dw = 0.3;
    const dg = group(g, doorX, y0, fz + 0.01);
    bxT(dg, dw, dh, 0.04, 'boards', d.kind === 'house' ? '#7a4a28' : shade(d.roof, -0.08), 0, 0, 0, 3);
    for (const [px, py] of [[-0.065, 0.55], [0.065, 0.55], [-0.065, 0.12], [0.065, 0.12]]) bx(dg, 0.1, dh * 0.33, 0.012, '#ffffff', px, dh * py, 0.02).material = MT('#000000', 0.12);
    bx(dg, dw + 0.08, 0.05, 0.05, '#f4efe6', 0, dh, 0.005);
    for (const sx of [-1, 1]) bx(dg, 0.04, dh, 0.05, '#f4efe6', sx * (dw / 2 + 0.02), 0, 0.005);
    ball(dg, 0.018, '#e9c46a', dw * 0.32, dh * 0.48, 0.035);
    bxT(g, dw + 0.16, 0.05, 0.16, 'stone', '#b5b0a2', doorX, y0 - 0.05, fz + 0.08, 4);
    roofT(g, dw + 0.22, 0.12, 0.34, d.roof, M(d.roof), doorX, y0 + dh + 0.05, fz + 0.02);
    for (const sx of [-1, 1]) bx(g, 0.02, 0.1, 0.02, '#f4efe6', doorX + sx * (dw / 2 + 0.06), y0 + dh - 0.04, fz + 0.18);
    const lx = doorX + dw / 2 + 0.1;
    bx(g, 0.02, 0.06, 0.05, '#3a3a3a', lx, y0 + dh * 0.72, fz + 0.03);
    mk(g, G.box, LAMP, 0.05, 0.07, 0.05, lx, y0 + dh * 0.72 + 0.07, fz + 0.06);
    groundGlow(g, lx, fz + 0.35, 1.1);
  }
  // front windows: the house has one next to the door, workshops one on each side
  const front = d.kind === 'house' ? [cx + ww * 0.2] : barn ? [] : ww > 1.2 ? [cx - ww * 0.3, cx + ww * 0.3] : [];
  for (const x of front) windowUnit(g, x, y0 + H * 0.3, fz + 0.01, 0, shutter, true);
  // side windows on the right face
  const nW = dd > 1.3 ? 2 : 1;
  for (let i = 0; i < nW; i++) {
    const z = cz - dd / 2 + ((i + 1) * dd) / (nW + 1);
    windowUnit(g, rx + 0.01, y0 + H * 0.3, z, Math.PI / 2, barn ? '#fbeee0' : shutter, !barn && i === 0);
  }
  let oven: ((on: boolean, t: number) => void) | null = null;
  switch (d.id) {
    case 'house': {
      // front porch: a plank deck with posts, a railing, a rocking chair and a doormat
      const pz = fz + 0.13;
      bxT(g, ww + 0.1, 0.06, 0.26, 'planks', '#b07a42', cx, y0 - 0.02, pz, 3);
      for (const x of [cx - ww / 2, cx + ww / 2, cx + ww * 0.02]) {
        bx(g, 0.05, H * 0.62, 0.05, '#f4efe6', x, y0 + 0.04, pz + 0.1);
      }
      bxT(g, ww + 0.2, 0.04, 0.34, 'planks', shade(d.roof, -0.05), cx, y0 + 0.04 + H * 0.62, pz + 0.02, 3);
      for (const y of [0.1, 0.2]) bx(g, ww * 0.45, 0.025, 0.025, '#f4efe6', cx + ww * 0.27, y0 + 0.04 + y, pz + 0.1);
      for (let i = 0; i < 6; i++) bx(g, 0.018, 0.12, 0.018, '#f4efe6', cx + ww * 0.06 + i * (ww * 0.42) / 5, y0 + 0.08, pz + 0.1);
      const chair = group(g, cx + ww * 0.3, y0 + 0.04, pz - 0.02);
      chair.rotation.y = -0.4;
      bx(chair, 0.13, 0.02, 0.12, '#8a5530', 0, 0.08, 0);
      bx(chair, 0.13, 0.13, 0.02, '#8a5530', 0, 0.09, -0.055).rotation.x = -0.15;
      for (const sx of [-1, 1]) {
        const rk = mk(chair, new THREE.TorusGeometry(0.08, 0.008, 4, 12, Math.PI * 0.5), M('#6b4226'), 1, 1, 1, sx * 0.055, 0.09, 0);
        rk.rotation.set(0, Math.PI / 2, Math.PI * 1.25);
      }
      bx(g, 0.2, 0.008, 0.1, '#b5452c', doorX, y0 + 0.045, pz + 0.02, false);
      // two dormers on the front slope of the roof
      for (const sx of [-0.25, 0.22]) {
        const dx = cx + ww * sx, dy = y0 + H + rh * 0.28, dz = cz + dd * 0.28;
        bxT(g, 0.26, 0.22, 0.26, 'siding', d.wall, dx, dy, dz, 1);
        roofT(g, 0.34, 0.14, 0.34, d.roof, wallMat, dx, dy + 0.22, dz, 0.04);
        windowUnit(g, dx, dy + 0.03, dz + 0.135, 0, shutter, false);
      }
      // mailbox on a post by the path
      const mb = group(g, cx - ww / 2 - 0.12, 0, fz + 0.2);
      bx(mb, 0.035, 0.3, 0.035, '#6b4226', 0, 0, 0);
      mk(mb, cylGeo(0.045, 0.045, 12), M('#3f6fa8'), 1, 0.18, 1, 0, 0.34, 0).rotation.x = Math.PI / 2;
      bx(mb, 0.01, 0.07, 0.04, '#c0392b', 0.05, 0.36, -0.02);
      break;
    }
    case 'barn': {
      // a louvered cupola on the ridge topped with a rooster weathervane
      const ry = y0 + H + rh;
      bxT(g, 0.26, 0.2, 0.26, 'boards', d.wall, cx, ry - 0.06, cz, 3);
      for (const sx of [-1, 1]) bx(g, 0.012, 0.12, 0.16, '#fbeee0', cx + sx * 0.132, ry - 0.02, cz);
      mk(g, cylGeo(0, 0.22, 4), M(d.roof), 1, 0.16, 1, cx, ry + 0.14, cz).rotation.y = Math.PI / 4;
      cyl(g, 0.008, 0.008, 0.22, '#3a3a3a', cx, ry + 0.22, cz, 6);
      const vane = group(g, cx, ry + 0.4, cz);
      bx(vane, 0.16, 0.012, 0.012, '#3a3a3a', 0, 0, 0);
      mk(vane, G.ball, M('#3a3a3a'), 0.035, 0.04, 0.012, 0.02, 0.04, 0);
      bx(vane, 0.012, 0.05, 0.05, '#3a3a3a', -0.07, 0.02, 0).rotation.x = Math.PI / 4;
      // hay bales stacked by the door
      for (const [bxp, by, bz] of [[cx + ww / 2 - 0.08, 0, fz + 0.14], [cx + ww / 2 - 0.08, 0.14, fz + 0.14], [cx + ww / 2 - 0.26, 0, fz + 0.14]] as const) {
        const hb = mk(g, cylGeo(0.07, 0.07, 14), surfaceMat('thatch', '#e8c865', 3), 1, 0.16, 1, bxp, by + 0.07, bz);
        hb.rotation.z = Math.PI / 2;
      }
      break;
    }
    case 'pizzeria': {
      // wood fired brick oven with a glowing mouth on the side of the shop
      const ox = rx + 0.02, oz = cz + 0.1;
      mk(g, G.dome, surfaceMat('stone', '#b0624a', 6), 0.22, 0.24, 0.22, ox, y0, oz);
      bxT(g, 0.5, y0, 0.5, 'stone', '#9a968a', ox, 0, oz, 4);
      mk(g, G.dome, LAMP, 0.08, 0.1, 0.02, ox + 0.2, y0, oz).rotation.set(0, Math.PI / 2, 0);
      bxT(g, 0.08, 0.2, 0.08, 'stone', '#8c4a3a', ox, y0 + 0.2, oz - 0.08, 6);
      oven = smoke(g, ox, y0 + 0.5, oz - 0.08);
      break;
    }
    case 'coffee_kiosk': {
      // striped awning across the front and a giant cup on the roof ridge
      for (let i = 0; i < 6; i++) {
        const st = bx(g, (ww + 0.1) / 6, 0.03, 0.34, i % 2 ? '#fff6df' : '#6b4226', cx - ww / 2 - 0.05 + (i + 0.5) * ((ww + 0.1) / 6), y0 + H * 0.78, fz + 0.14);
        st.rotation.x = 0.35;
      }
      const cup = group(g, cx, y0 + H + 0.45 + Math.min(ww, dd) * 0.3, cz);
      mk(cup, cylGeo(0.12, 0.09, 16), M('#ffffff'), 1, 0.18, 1, 0, 0.09, 0);
      mk(cup, cylGeo(0.11, 0.11, 16), M('#6b3f1f'), 1, 0.01, 1, 0, 0.175, 0);
      mk(cup, new THREE.TorusGeometry(0.05, 0.015, 8, 14), M('#ffffff'), 1, 1, 1, 0.13, 0.1, 0).rotation.y = 0;
      break;
    }
    case 'florist': {
      // buckets of fresh cut flowers along the front
      const cols = ['#e8305a', '#f2d23a', '#8a6ad0', '#ffffff', '#ff8fb0'];
      for (let i = 0; i < 4; i++) {
        const x = cx - ww / 2 + 0.12 + i * (ww - 0.24) / 3;
        if (Math.abs(x - cx) < 0.2) continue;
        mk(g, cylGeo(0.06, 0.05, 12), M('#8a8f96'), 1, 0.1, 1, x, y0 + 0.05, fz + 0.14);
        for (let k = 0; k < 5; k++) ball(g, 0.025, cols[(i + k) % 5], x + Math.cos(k * 1.3) * 0.035, y0 + 0.13 + (k % 2) * 0.02, fz + 0.14 + Math.sin(k * 1.3) * 0.035, 1, 1, 1, false);
      }
      break;
    }
    case 'oil_press': {
      // a stone basin with an upright millstone and a stack of olive baskets
      const ox = rx + 0.05, oz = cz + 0.1;
      mk(g, cylGeo(0.2, 0.22, 20), surfaceMat('stone', '#bdb6a6', 6), 1, 0.12, 1, ox, 0.06, oz);
      const wheel = mk(g, cylGeo(0.13, 0.13, 20), surfaceMat('stone', '#cfc8b8', 6), 1, 0.06, 1, ox, 0.24, oz);
      wheel.rotation.z = Math.PI / 2;
      cyl(g, 0.012, 0.012, 0.3, '#6b4226', ox, 0.12, oz, 6);
      for (let i = 0; i < 2; i++) {
        cyl(g, 0.07, 0.06, 0.08, '#b98048', cx - ww / 2 + 0.12 + i * 0.16, y0, fz + 0.12, 10);
        for (let k = 0; k < 4; k++) ball(g, 0.018, k % 2 ? '#5a6a1a' : '#3a2a3a', cx - ww / 2 + 0.1 + i * 0.16 + (k % 2) * 0.03, y0 + 0.09, fz + 0.1 + Math.floor(k / 2) * 0.03, 1, 1, 1, false);
      }
      break;
    }
    case 'salad_bar': {
      // crates of fresh produce by the door
      const veg = ['#e8432e', '#8ad05a', '#f0862a', '#ffd23a'];
      for (const [i, x] of [[0, cx - ww / 2 + 0.12], [1, cx + ww / 2 - 0.12]] as const) {
        bxT(g, 0.22, 0.1, 0.16, 'planks', '#b98048', x, y0, fz + 0.12, 5);
        for (let k = 0; k < 5; k++) ball(g, 0.03, veg[(i * 2 + k) % 4], x - 0.07 + (k % 3) * 0.07, y0 + 0.12, fz + 0.09 + Math.floor(k / 3) * 0.06, 1, 1, 1, false);
      }
      break;
    }
  }
  let puff: ((on: boolean, t: number) => void) | null = null;
  if (!barn) {
    const chx = cx + ww * 0.25, chz = cz - dd * 0.1;
    bxT(g, 0.18, 0.55 + rh * 0.3, 0.18, 'stone', '#b0624a', chx, y0 + H + rh * 0.2, chz, 5);
    bx(g, 0.22, 0.05, 0.22, '#7d4536', chx, y0 + H + rh * 0.5 + 0.55, chz);
    puff = smoke(g, chx, y0 + H + rh * 0.5 + 0.6, chz);
  }
  if (d.kind === 'production') badge(g, d.icon, 0.34, cx, y0 + dh + 0.24, fz + 0.035);
  e.top = y0 + H + rh;
  let lastQ = -1, lastDone = -1, beat = 0;
  e.update = (o, now, t) => {
    const info = prodInfo(o, now);
    const busy = !!info.current;
    if (puff) puff(d.kind === 'house' || busy, t);
    if (oven) oven(busy, t + 400);
    if (d.kind !== 'production') return;
    // react to the queue: a big hop when goods finish, a small one when queued or collected
    const q = o.prod?.queue.length ?? 0, done = info.done.length;
    if (lastQ >= 0) {
      if (done > lastDone) bump(e, 'big');
      else if (q !== lastQ) bump(e);
    }
    lastQ = q; lastDone = done;
    // while working the building chugs along with a gentle rhythm
    if (busy && t - beat > 1400) { beat = t; bump(e, 'work'); }
  };
  if (d.id === 'house' && artStyle() === 'toon') {
    swapInModel(e, 'farmhouse', cx, cz + 0.1, 0.95, () => {
      // the model's chimney smokes; the stand in's smoke went away with it
      const chimney = smoke(g, cx + 0.38, 2.3, cz - 0.15);
      e.top = 2.35;
      e.update = (_o, _now, t) => chimney(true, t);
    });
  }
}

// a framed window with a cross mullion, sill, shutters and an optional flower box.
// It faces +z, turned by `rotY`, and (x, y, z) is the bottom center on the wall.
function windowUnit(g: P, x: number, y: number, z: number, rotY: number, shutter: string, flowers: boolean) {
  const w = group(g, x, y, z);
  w.rotation.y = rotY;
  const W = 0.28, Hh = 0.3;
  bx(w, W + 0.06, Hh + 0.06, 0.03, '#f7f3ea', 0, -0.03, 0);
  mk(w, G.box, WIN, W, Hh, 0.03, 0, Hh / 2, 0.012);
  bx(w, 0.022, Hh, 0.02, '#f7f3ea', 0, 0, 0.03);
  bx(w, W, 0.022, 0.02, '#f7f3ea', 0, Hh / 2 - 0.011, 0.03);
  bx(w, W + 0.1, 0.03, 0.07, '#f7f3ea', 0, -0.05, 0.03);
  for (const sx of [-1, 1]) {
    bxT(w, 0.1, Hh + 0.04, 0.025, 'boards', shutter, sx * (W / 2 + 0.07), -0.02, 0.01, 6);
  }
  if (flowers) {
    bxT(w, W + 0.06, 0.07, 0.08, 'planks', '#8a5a2b', 0, -0.13, 0.06, 4);
    const cols = ['#ff6b8a', '#ffd23a', '#ffffff', '#ff9f43', '#b58cff'];
    for (let i = 0; i < 6; i++) {
      ball(w, 0.03, '#4f9e36', -0.12 + i * 0.048, -0.05, 0.06, 1, 0.8, 1, false);
      ball(w, 0.022, cols[i % cols.length], -0.12 + i * 0.048, -0.03 + (i % 2) * 0.015, 0.08, 1, 1, 1, false);
    }
  }
}

function barnTrim(d: BuildingDef) {
  return d.kind === 'house' ? '#f4efe6' : '#fbeee0';
}

function buildSilo(e: Entry) {
  const g = e.root;
  mk(g, cylGeo(0.4, 0.42, 24), surfaceMat('metal', '#d7dbe0', 3, 0.45, 1, 1.5), 1, 2.0, 1, 0.5, 1.0, 0.5);
  cyl(g, 0.46, 0.46, 0.1, '#a9a396', 0.5, 0, 0.5, 20);
  for (const y of [0.5, 1.0, 1.5]) cyl(g, 0.43, 0.43, 0.05, '#aab0b8', 0.5, y, 0.5, 24);
  mk(g, G.dome, new THREE.MeshStandardMaterial({ color: '#c0392b', roughness: 0.35, metalness: 0.2 }), 0.41, 0.36, 0.41, 0.5, 2.0, 0.5);
  bx(g, 0.03, 1.9, 0.03, '#7d838b', 0.93, 0, 0.44);
  bx(g, 0.03, 1.9, 0.03, '#7d838b', 0.93, 0, 0.58);
  for (let i = 1; i < 10; i++) bx(g, 0.02, 0.02, 0.15, '#7d838b', 0.93, i * 0.19, 0.51);
  e.top = 2.4;
}

function buildBoard(e: Entry) {
  const g = e.root;
  cyl(g, 0.04, 0.04, 1.0, '#6b4226', 0.18, 0, 0.5, 8);
  cyl(g, 0.04, 0.04, 1.0, '#6b4226', 0.82, 0, 0.5, 8);
  bxT(g, 0.8, 0.52, 0.07, 'planks', '#b07a3c', 0.5, 0.4, 0.5, 1.4);
  for (let i = 0; i < 3; i++) bx(g, 0.18, 0.22, 0.012, ['#fff8e6', '#e6f4ff', '#fff0f0'][i], 0.26 + i * 0.24, 0.55 + (i % 2) * 0.05, 0.54);
  roofT(g, 0.98, 0.16, 0.26, '#8a4a2a', M('#6b4226'), 0.5, 0.95, 0.5);
  e.top = 1.2;
}

// Chunky rail fence with capped posts: warm wood, or white paint for the tidier pens
const WHITE_FENCE = new Set(['sheepfold', 'stable', 'alpaca_ranch', 'peacock_garden', 'rabbit_hutch', 'pony_paddock', 'black_sheepfold', 'merino_fold', 'jacob_fold', 'silkie_coop', 'deer_park', 'chinchilla_hutch']);
function fence(g: THREE.Group, w: number, h: number, white = false) {
  const c = white ? '#f5f2ea' : '#c0864a';
  const pts: [number, number][] = [];
  for (let x = 0.05; x <= w - 0.04; x += 0.5) { pts.push([x, 0.05], [x, h - 0.05]); }
  for (let z = 0.55; z <= h - 0.5; z += 0.5) { pts.push([0.05, z], [w - 0.05, z]); }
  pts.push([w - 0.05, 0.05], [w - 0.05, h - 0.05]);
  const post = white ? M(c) : surfaceMat('boards', c, 4);
  const rail = (rw: number, rh: number, rd: number, x: number, y: number, z: number) =>
    white ? bx(g, rw, rh, rd, c, x, y, z) : bxT(g, rw, rh, rd, 'planks', c, x, y, z, 3);
  for (const [x, z] of pts) {
    mk(g, cylGeo(0.05, 0.055, 10), post, 1, 0.38, 1, x, 0.19, z);
    mk(g, G.dome, M(white ? '#e4dfd4' : shade(c, -0.08)), 0.058, 0.045, 0.058, x, 0.38, z);
  }
  for (const y of [0.12, 0.23, 0.33]) {
    rail(w - 0.1, 0.05, 0.035, w / 2, y, 0.05);
    rail(w - 0.1, 0.05, 0.035, w / 2, y, h - 0.05);
    rail(0.035, 0.05, h - 0.1, 0.05, y, h / 2);
    rail(0.035, 0.05, h - 0.1, w - 0.05, y, h / 2);
  }
}

// ------------------------------------------------------------------ grazing trips
// Animals let out of their pen walk (never teleport) along tile paths: out through the gate to a
// few grassy spots near the pen, eating at each, then back in. Positions are a pure function
// of time and the trip's start, so every frame (and a reload) agrees. The renderer lends its
// walk grid and knows where the flowers are for the bees.
type P2 = { x: number; y: number };
let GRAZE_NAV: {
  path: (sx: number, sy: number, tx: number, ty: number) => P2[] | null;
  nearest: (x: number, y: number) => P2 | null;
  grass: (x: number, y: number) => boolean;
  flowers: () => P2[];
} | null = null;

interface Trip { out: P2[]; eat: P2[][]; back: P2[]; recall?: { at: number; path: P2[] } }
const trips = new Map<string, Trip>();

function polyLen(pts: P2[]) {
  let L = 0;
  for (let i = 1; i < pts.length; i++) L += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
  return L;
}
// point at fraction k of the way along a polyline, and the walking direction there
function along(pts: P2[], k: number) {
  if (pts.length === 1) return { x: pts[0].x, y: pts[0].y, dx: 0, dy: 1 };
  const L = polyLen(pts);
  let want = Math.max(0, Math.min(1, k)) * L;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i];
    const seg = Math.hypot(b.x - a.x, b.y - a.y);
    if (want <= seg || i === pts.length - 1) {
      const u = seg ? Math.min(1, want / seg) : 1;
      return { x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u, dx: b.x - a.x, dy: b.y - a.y };
    }
    want -= seg;
  }
  const z = pts[pts.length - 1];
  return { x: z.x, y: z.y, dx: 0, dy: 1 };
}
const tileOf = (p: P2) => ({ x: Math.floor(p.x), y: Math.floor(p.y) });
function walk(from: P2, to: P2) {
  const a = tileOf(from), b = tileOf(to);
  const p = GRAZE_NAV?.path(a.x, a.y, b.x, b.y);
  return p ? [from, ...p, to] : [from, to];
}

function tripFor(o: FarmObject, d: BuildingDef, a: Animal): Trip | null {
  if (!a.graze || !GRAZE_NAV) return null;
  const key = `${o.id}|${o.x},${o.y}|${a.id}|${a.graze.at}`;
  let tr = trips.get(key);
  if (!tr) {
    const sp = animalSpot(d, a.id, a.graze.at);
    const home = { x: o.x + sp.x, y: o.y + sp.z };
    const gateIn = { x: o.x + d.w / 2, y: o.y + d.h - 0.3 };
    const gateOut = { x: o.x + d.w / 2, y: o.y + d.h + 0.45 };
    const g0 = GRAZE_NAV.nearest(Math.floor(gateOut.x), Math.floor(gateOut.y)) ?? tileOf(gateOut);
    // three grassy spots a few tiles from the gate, picked by the animal and the trip
    const spots: P2[] = [];
    for (let k = 0; k < 3; k++) {
      let best: P2 | null = null;
      for (let tries = 0; tries < 14 && !best; tries++) {
        const ang = hash(a.id, a.graze.at % 100000, k * 17 + tries) * Math.PI * 2;
        const r = 2 + hash(a.id, k, tries + 5) * 4;
        const tx = Math.floor(g0.x + Math.cos(ang) * r), ty = Math.floor(g0.y + Math.abs(Math.sin(ang)) * r * 0.9 + 0.5);
        if (GRAZE_NAV.grass(tx, ty)) best = { x: tx + 0.3 + hash(a.id, tx, ty) * 0.4, y: ty + 0.3 + hash(a.id, ty, tx) * 0.4 };
      }
      spots.push(best ?? { x: g0.x + 0.5, y: g0.y + 0.5 });
    }
    const out = [home, gateIn, gateOut, ...walk(gateOut, spots[0]).slice(1)];
    const eat = [walk(spots[0], spots[1]), walk(spots[1], spots[2])];
    const back = [...walk(spots[2], gateOut), gateIn, home];
    tr = { out, eat, back };
    if (trips.size > 400) trips.clear();
    trips.set(key, tr);
  }
  return tr;
}

// where a grazing animal is at time `now`: world x, y, heading, walking or eating
function grazePose(o: FarmObject, d: BuildingDef, a: Animal, now: number): { x: number; y: number; heading: number; moving: boolean } | null {
  const tr = tripFor(o, d, a);
  if (!tr) return null;
  const gp = grazePhase(a, now);
  let pt: { x: number; y: number; dx: number; dy: number }, moving = true;
  if (gp.phase === 'leaving') pt = along(tr.out, gp.k);
  else if (gp.phase === 'eating') {
    // stand and eat, stroll to the next patch, eat, stroll, eat
    const k = gp.k;
    if (k < 0.3) { pt = along(tr.eat[0], 0); moving = false; }
    else if (k < 0.4) pt = along(tr.eat[0], (k - 0.3) / 0.1);
    else if (k < 0.65) { pt = along(tr.eat[1], 0); moving = false; }
    else if (k < 0.75) pt = along(tr.eat[1], (k - 0.65) / 0.1);
    else { pt = along(tr.eat[1], 1); moving = false; }
  } else if (gp.phase === 'returning' && a.graze?.back !== undefined) {
    // called home early: from wherever it was, the shortest way back through the gate
    if (!tr.recall || tr.recall.at !== a.graze.back) {
      const from = grazePose(o, d, { ...a, graze: { at: a.graze.at } }, a.graze.back) ?? { x: o.x, y: o.y };
      const sp = animalSpot(d, a.id, a.graze.at);
      const gateOut = { x: o.x + d.w / 2, y: o.y + d.h + 0.45 };
      tr.recall = { at: a.graze.back, path: [...walk({ x: from.x, y: from.y }, gateOut), { x: o.x + d.w / 2, y: o.y + d.h - 0.3 }, { x: o.x + sp.x, y: o.y + sp.z }] };
    }
    pt = along(tr.recall.path, gp.k);
  } else if (gp.phase === 'returning') pt = along(tr.back, gp.k);
  else return null;
  return { x: pt.x, y: pt.y, heading: Math.atan2(pt.dx, pt.dy), moving };
}

// the bees of a hive fly (straight, they can) to flowers near the pen and back
function beePose(o: FarmObject, a: Animal, k: number, now: number) {
  const gp = grazePhase(a, now, true);
  if (gp.phase === 'in' || gp.phase === 'home' || gp.phase === 'full') return null;
  const fl = GRAZE_NAV?.flowers() ?? [];
  const cx = o.x + 1, cy = o.y + 1;
  const near = fl.filter((f) => Math.hypot(f.x - cx, f.y - cy) < 9);
  const pick = near.length ? near[Math.floor(hash(a.id, k, 7) * near.length)]
    : { x: cx + (hash(a.id, k, 3) - 0.5) * 6, y: o.y + 2.5 + hash(a.id, k, 4) * 3 };
  const target = { x: pick.x + (hash(k, a.id, 9) - 0.5) * 0.5, y: pick.y + (hash(a.id, k, 11) - 0.5) * 0.5 };
  const home = { x: cx, y: cy };
  const lerp2 = (p: P2, q: P2, u: number) => ({ x: p.x + (q.x - p.x) * u, y: p.y + (q.y - p.y) * u });
  let at: P2, h = 0.6, landed = false;
  if (gp.phase === 'leaving') { at = lerp2(home, target, gp.k); h = 0.5 + Math.sin(gp.k * Math.PI) * 0.6; }
  else if (gp.phase === 'eating') {
    // hop from bloom to bloom around the patch, landing to sip
    const w = now / 900 + k * 2;
    at = { x: target.x + Math.cos(w) * 0.25, y: target.y + Math.sin(w * 1.3) * 0.25 };
    landed = Math.sin(now / 700 + k) > 0.2;
    h = landed ? 0.28 : 0.45;
  } else {
    const from = gp.from !== undefined && a.graze?.back !== undefined ? target : target;
    at = lerp2(from, home, gp.k);
    h = 0.5 + Math.sin(gp.k * Math.PI) * 0.6;
  }
  return { x: at.x, y: at.y, h, landed };
}

function buildPen(e: Entry, d: BuildingDef) {
  const g = e.root;
  const w = d.w, h = d.h;
  // grassy pens keep the lawn (and its swaying grass), the others get a dirt yard
  if (!GRASSY_PEN.has(d.id)) {
    const dirt = !['duck_pond', 'swan_lake', 'reindeer_lodge', 'musk_ox_range', 'beaver_pond', 'mandarin_pond', 'black_swan_lake'].includes(d.id);
    keep(bxT(g, w - 0.1, 0.04, h - 0.1, dirt ? 'soil' : 'grass', PEN_GROUND[d.id] ?? d.wall, w / 2, 0, h / 2, dirt ? 1.5 : 0.8, false));
  }
  if (d.id !== 'beehive') fence(g, w, h, WHITE_FENCE.has(d.id));
  e.top = 0.9;
  switch (d.id) {
    case 'coop':
      bxT(g, 0.72, 0.45, 0.6, 'boards', '#e3cf94', 0.55, 0.04, 0.5, 2);
      roofT(g, 0.88, 0.32, 0.76, '#b5452c', surfaceMat('boards', '#e3cf94', 2), 0.55, 0.49, 0.5, 0.08);
      bx(g, 0.16, 0.2, 0.02, '#5a3517', 0.55, 0.1, 0.81);
      bx(g, 0.2, 0.03, 0.3, '#a8733f', 0.55, 0.04, 0.95).rotation.x = -0.4;
      break;
    case 'swan_lake': case 'black_swan_lake': case 'mandarin_pond':
      // a lily pond with a little white pavilion
      cyl(g, 0.95, 1.0, 0.04, '#d8c38e', 1.7, 0.02, 1.7, 16, false);
      mk(g, cylGeo(0.85, 0.85, 16), WATER, 1, 0.04, 1, 1.7, 0.06, 1.7, false);
      for (let i = 0; i < 5; i++) {
        const a = i * 1.3;
        mk(g, cylGeo(0.07, 0.07, 10), M('#4a9a3a'), 1, 0.01, 1, 1.7 + Math.cos(a) * 0.6, 0.085, 1.7 + Math.sin(a) * 0.55, false);
        if (i % 2 === 0) ball(g, 0.025, '#f7c6da', 1.7 + Math.cos(a) * 0.6, 0.1, 1.7 + Math.sin(a) * 0.55, 1, 0.7, 1, false);
      }
      for (const [x, z] of [[0.25, 0.25], [0.65, 0.25], [0.25, 0.65], [0.65, 0.65]]) cyl(g, 0.025, 0.025, 0.42, '#f4efe6', x, 0.04, z, 8);
      mk(g, G.dome, M('#f4efe6'), 0.34, 0.2, 0.34, 0.45, 0.46, 0.45);
      break;
    case 'flamingo_lagoon':
      // a shallow sandy lagoon, with a palm leaning over it
      cyl(g, 1.1, 1.15, 0.03, '#f2dfa8', 1.5, 0.02, 1.6, 18, false);
      mk(g, cylGeo(1.0, 1.0, 18), WATER, 1, 0.03, 1, 1.5, 0.05, 1.6, false);
      { const p = palmTree(g, '#4c9a38'); p.crown.position.set(0.35, 0, 0.35); p.crown.scale.setScalar(0.7); }
      break;
    case 'reindeer_lodge':
      // a snowy log lodge with a white roof and a sled
      bxT(g, 1.0, 0.5, 0.7, 'bark', '#8a5a34', 0.7, 0.04, 0.5, 2);
      roofT(g, 1.16, 0.34, 0.86, '#f4f8fa', surfaceMat('bark', '#8a5a34', 2), 0.7, 0.54, 0.5, 0.06);
      bx(g, 0.2, 0.3, 0.03, '#5a3a22', 0.7, 0.04, 0.86);
      for (let i = 0; i < 6; i++) mk(g, G.ball, M('#ffffff'), 0.14 + hash(i, 2) * 0.1, 0.05, 0.12, 0.3 + hash(i, 3) * 2.3, 0.04, 1.2 + hash(i, 4) * 1.5, false);
      { const sled = group(g, 2.4, 0.04, 0.5); bx(sled, 0.42, 0.12, 0.24, '#b5452c', 0, 0.05, 0); for (const sz of [-1, 1]) bx(sled, 0.5, 0.02, 0.02, '#e8c060', 0, 0, sz * 0.12); }
      e.top = 1.1;
      break;
    case 'muscovy_pond':
      // a small pond in the corner for the walking ducks, and a duck house
      cyl(g, 0.55, 0.6, 0.03, '#d8c38e', 0.8, 0.02, 2.2, 14, false);
      mk(g, cylGeo(0.48, 0.48, 14), WATER, 1, 0.03, 1, 0.8, 0.05, 2.2, false);
      bxT(g, 0.5, 0.35, 0.45, 'boards', '#f3e6c8', 0.45, 0.04, 0.45, 2);
      roofT(g, 0.62, 0.22, 0.58, d.roof, surfaceMat('boards', '#f3e6c8', 2), 0.45, 0.39, 0.45, 0.06);
      break;
    case 'beaver_pond': {
      // a pond held back by a dam of stacked logs, with the beavers' domed lodge
      cyl(g, 0.7, 0.75, 0.03, '#b8a070', 1.5, 0.02, 1.4, 16, false);
      mk(g, cylGeo(0.64, 0.64, 16), WATER, 1, 0.03, 1, 1.5, 0.05, 1.4, false);
      const bark = surfaceMat('bark', '#7a5a3a', 4);
      for (let i = 0; i < 7; i++) {
        const lg = mk(g, cylGeo(0.035, 0.035, 8), bark, 1, 0.5 + hash(i, 1) * 0.3, 1, 1.25 + (i % 3) * 0.25, 0.05 + Math.floor(i / 3) * 0.06, 2.12 + (hash(i, 2) - 0.5) * 0.06);
        lg.rotation.set(0, (hash(i, 3) - 0.5) * 0.3, Math.PI / 2);
      }
      mk(g, G.dome, surfaceMat('bark', '#6a4a2a', 3), 0.36, 0.28, 0.32, 1.65, 0.02, 1.2);
      break;
    }
    case 'crane_marsh': case 'heron_marsh':
      // shallow pools edged with reeds and cattails
      for (const [x, z, r] of [[1.0, 1.1, 0.5], [2.1, 2.0, 0.55]] as const) {
        mk(g, cylGeo(r, r, 14), WATER, 1, 0.03, 1, x, 0.05, z, false);
        for (let i = 0; i < 10; i++) {
          const a = (i / 10) * Math.PI * 2, rx = x + Math.cos(a) * (r + 0.05), rz = z + Math.sin(a) * (r + 0.05);
          cyl(g, 0.008, 0.01, 0.35 + hash(i, 4) * 0.2, '#6a9a3a', rx, 0.02, rz, 4, false);
          if (i % 3 === 0) mk(g, cylGeo(0.018, 0.018, 8), M('#6a3a1a'), 1, 0.07, 1, rx, 0.36 + hash(i, 4) * 0.2, rz, false);
        }
      }
      break;
    case 'silk_house': {
      // a little paper lantern shed among mulberry bushes
      bxT(g, 0.55, 0.4, 0.45, 'boards', '#f4efe6', 0.45, 0.04, 0.45, 2);
      roofT(g, 0.7, 0.24, 0.6, d.roof, surfaceMat('boards', '#f4efe6', 2), 0.45, 0.44, 0.45, 0.06);
      for (const [x, z] of [[1.5, 0.4], [1.55, 1.5], [0.5, 1.5]]) mk(g, toonCrown(5), toonLeafMat('#3f8a33'), 0.42, 0.42, 0.42, x, -0.12, z);
      break;
    }
    case 'squirrel_grove': {
      // a big oak in the corner with a knot hole, and acorns on the grass
      const t = leafyTree(g, 0.55, 0.55, '#4f9e36', 0.9, 7);
      mk(t.crown, G.ball, M('#3a2418'), 0.06, 0.07, 0.03, 0.06, 0.4, 0.08);
      for (let i = 0; i < 6; i++) ball(g, 0.025, '#8a5a2a', 0.9 + hash(i, 5) * 0.9, 0.03, 0.9 + hash(i, 6) * 0.9, 1, 1.2, 1, false);
      break;
    }
    case 'parrot_aviary':
      // perch stands and a leaning palm
      for (const [x, z] of [[0.5, 1.4], [1.5, 0.6]]) {
        cyl(g, 0.02, 0.025, 0.55, '#8a5a2a', x, 0.02, z, 8);
        bx(g, 0.4, 0.03, 0.03, '#8a5a2a', x, 0.55, z);
      }
      { const p = palmTree(g, '#4c9a38'); p.crown.position.set(0.4, 0, 0.4); p.crown.scale.setScalar(0.55); }
      break;
    case 'owl_barn':
      // a tall little barn with an open loft window where the owls roost
      bxT(g, 0.6, 0.6, 0.5, 'boards', '#a8452e', 0.45, 0.04, 0.45, 2);
      roofT(g, 0.74, 0.3, 0.64, d.roof, surfaceMat('boards', '#a8452e', 2), 0.45, 0.64, 0.45, 0.06);
      bx(g, 0.18, 0.18, 0.02, '#2a1a12', 0.45, 0.42, 0.71);
      bx(g, 0.22, 0.03, 0.06, '#f4efe6', 0.45, 0.4, 0.72);
      e.top = 1.2;
      break;
    case 'kiwi_burrow':
      // a grassy mound with a burrow and some ferns
      mk(g, G.dome, M('#6aa84a'), 0.45, 0.25, 0.4, 0.5, 0.02, 0.5);
      mk(g, G.ball, M('#2a1a12'), 0.1, 0.08, 0.03, 0.5, 0.08, 0.88);
      for (let i = 0; i < 5; i++) mk(g, toonCrown(i), toonLeafMat('#3f8a33'), 0.22, 0.2, 0.22, 1.3 + hash(i, 7) * 0.5, -0.06, 0.4 + hash(i, 8) * 1.1);
      break;
    case 'moose_woods': case 'deer_park':
      // a few pines and a salt lick
      for (const [x, z, s] of [[0.4, 0.4, 0.8], [2.6, 0.5, 0.65], [0.5, 2.5, 0.7]] as const) {
        cyl(g, 0.05, 0.07, 0.3 * s, '#6a4226', x, 0, z, 8);
        mk(g, pineGeo(), M('#3d8a30'), 0.36 * s, 0.9 * s, 0.36 * s, x, 0.75 * s, z);
      }
      bx(g, 0.18, 0.1, 0.18, '#e8e2d6', 1.7, 0.02, 1.4);
      break;
    case 'golden_nest': {
      // a big woven nest lined with straw, a golden egg glinting in it
      const nest = mk(g, new THREE.TorusGeometry(0.42, 0.14, 10, 24), surfaceMat('thatch', '#c8a050', 4), 1, 1, 1, 1, 0.1, 1);
      nest.rotation.x = Math.PI / 2;
      mk(g, cylGeo(0.42, 0.42, 20), surfaceMat('thatch', '#e8c865', 4), 1, 0.06, 1, 1, 0.04, 1, false);
      keep(mk(g, G.ball, new THREE.MeshStandardMaterial({ color: '#ffd23a', metalness: 0.35, roughness: 0.25, emissive: '#7a5200', emissiveIntensity: 0.5 }), 0.09, 0.12, 0.09, 1.15, 0.16, 0.9));
      break;
    }
    case 'duck_pond':
      cyl(g, 0.95, 1.0, 0.04, '#d8c38e', 1.7, 0.02, 1.7, 16, false);
      mk(g, cylGeo(0.85, 0.85, 16), WATER, 1, 0.04, 1, 1.7, 0.06, 1.7, false);
      bxT(g, 0.5, 0.35, 0.45, 'boards', '#f3e6c8', 0.45, 0.04, 0.45, 2);
      roofT(g, 0.62, 0.22, 0.58, '#2e6da4', surfaceMat('boards', '#f3e6c8', 2), 0.45, 0.39, 0.45, 0.06);
      break;
    case 'stable':
      bxT(g, 1.5, 0.75, 0.75, 'boards', '#a85a3a', 1.1, 0.04, 0.5, 1.6);
      roofT(g, 1.66, 0.38, 0.9, '#8e2c20', surfaceMat('boards', '#a85a3a', 1.6), 1.1, 0.79, 0.5, 0.08);
      for (const x of [0.65, 1.1, 1.55]) bx(g, 0.28, 0.42, 0.03, '#6b3a22', x, 0.04, 0.88);
      e.top = 1.3;
      break;
    case 'rabbit_hutch': {
      // raised hutch with a wire front, a sloped roof and a ramp down to the grass
      const hx = 0.62, hz = 0.5;
      for (const [x, z] of [[-0.38, -0.2], [0.38, -0.2], [-0.38, 0.2], [0.38, 0.2]]) bx(g, 0.05, 0.3, 0.05, '#7a4a28', hx + x, 0, hz + z);
      bxT(g, 0.86, 0.34, 0.5, 'boards', '#d9b98a', hx, 0.3, hz, 3);
      const mesh = new THREE.MeshStandardMaterial({ color: '#9aa3ab', metalness: 0.5, roughness: 0.4 });
      for (let i = 0; i < 9; i++) mk(g, G.box, mesh, 0.008, 0.26, 0.008, hx - 0.32 + i * 0.08, 0.47, hz + 0.255, false);
      for (let i = 0; i < 4; i++) mk(g, G.box, mesh, 0.66, 0.008, 0.008, hx, 0.36 + i * 0.075, hz + 0.255, false);
      bx(g, 0.72, 0.03, 0.03, '#7a4a28', hx, 0.33, hz + 0.26);
      bx(g, 0.72, 0.03, 0.03, '#7a4a28', hx, 0.6, hz + 0.26);
      const roofP = bxT(g, 1.0, 0.04, 0.66, 'planks', '#c0392b', hx, 0.66, hz, 3);
      roofP.rotation.x = -0.18;
      const ramp = bxT(g, 0.16, 0.02, 0.5, 'planks', '#b98048', hx + 0.5, 0.0, hz + 0.18, 4);
      ramp.rotation.x = -0.62;
      ramp.position.set(hx + 0.28, 0.14, hz + 0.42);
      for (let i = 0; i < 4; i++) {
        const c = mk(g, cylGeo(0.012, 0.004, 6), M('#f0862a'), 1, 0.08, 1, 1.45 + i * 0.05, 0.02, 1.62 - i * 0.03);
        c.rotation.z = Math.PI / 2 - 0.2 + i * 0.1;
      }
      e.top = 1.0;
      break;
    }
    case 'quail_coop':
      // a low A-frame hutch with a wire run
      bxT(g, 0.7, 0.28, 0.5, 'boards', '#e8d8b0', 0.55, 0.04, 0.45, 2);
      roofT(g, 0.84, 0.22, 0.62, '#6b8a3a', surfaceMat('boards', '#e8d8b0', 2), 0.55, 0.32, 0.45, 0.07);
      bx(g, 0.12, 0.12, 0.02, '#4a3020', 0.55, 0.04, 0.705);
      e.top = 0.7;
      break;
    case 'camel_corral':
      // a desert style shade of striped cloth on poles and a date palm
      for (const [x, z] of [[0.3, 0.3], [1.3, 0.3], [0.3, 1.1], [1.3, 1.1]]) mk(g, cylGeo(0.035, 0.04, 8), surfaceMat('bark', '#8a5a33', 4), 1, 0.85, 1, x, 0.46, z);
      for (let i = 0; i < 6; i++) bx(g, 1.14 / 6, 0.02, 0.95, i % 2 ? '#f2e6c8' : '#c0602a', 0.3 + (i + 0.5) * (1.0 / 6), 0.88, 0.7);
      { const p = palmTree(g, '#4c9a38'); p.crown.position.set(0.45, 0, 2.5); p.crown.scale.setScalar(0.8); }
      e.top = 1.3;
      break;
    case 'buffalo_wallow':
      // a muddy wallow pool beside the shelter
      cyl(g, 0.62, 0.66, 0.02, '#5a4028', 2.0, 0.03, 1.95, 20, false);
      keep(mk(g, cylGeo(0.55, 0.55, 20), new THREE.MeshStandardMaterial({ color: '#6a5034', roughness: 0.25 }), 1, 0.02, 1, 2.0, 0.05, 1.95, false));
      for (const [x, z] of [[0.25, 0.25], [1.15, 0.25], [0.25, 0.95], [1.15, 0.95]]) mk(g, cylGeo(0.04, 0.045, 8), surfaceMat('bark', '#8a5a33', 4), 1, 0.6, 1, x, 0.34, z);
      bxT(g, 1.1, 0.06, 0.9, 'thatch', '#c9a85a', 0.7, 0.62, 0.6, 2.5).rotation.x = 0.18;
      e.top = 0.9;
      break;
    case 'peacock_garden':
      // a white garden arbor with climbing roses and a small fountain bowl
      for (const x of [0.3, 1.1]) for (const z of [0.3, 0.7]) cyl(g, 0.025, 0.025, 0.7, '#f4efe6', x, 0.04, z, 8);
      for (let i = 0; i < 5; i++) { const a = mk(g, cylGeo(0.015, 0.015, 6), M('#f4efe6'), 1, 0.44, 1, 0.3 + i * 0.2, 0.74, 0.5); a.rotation.x = Math.PI / 2; }
      for (let i = 0; i < 16; i++) ball(g, 0.035, i % 3 ? '#4f9e36' : '#e8436a', 0.3 + (i % 8) * 0.11, 0.7 + (i % 3) * 0.04, 0.3 + Math.floor(i / 8) * 0.4, 1, 1, 1, false);
      cyl(g, 0.2, 0.16, 0.14, '#d9d3c4', 1.5, 0.04, 1.5, 16);
      mk(g, cylGeo(0.17, 0.17, 16), WATER, 1, 0.02, 1, 1.5, 0.18, 1.5, false);
      e.top = 1.0;
      break;
    case 'goose_pen':
      // a little pond in one corner and an A-frame goose house
      cyl(g, 0.42, 0.45, 0.03, '#d8c38e', 1.45, 0.02, 1.45, 20, false);
      mk(g, cylGeo(0.37, 0.37, 20), WATER, 1, 0.03, 1, 1.45, 0.05, 1.45, false);
      bxT(g, 0.5, 0.3, 0.46, 'boards', '#f3e6c8', 0.45, 0.04, 0.42, 2);
      roofT(g, 0.6, 0.24, 0.58, '#3f7fbf', surfaceMat('boards', '#f3e6c8', 2), 0.45, 0.34, 0.42, 0.05);
      bx(g, 0.14, 0.16, 0.02, '#4a3020', 0.45, 0.04, 0.655);
      e.top = 0.8;
      break;
    case 'beehive':
      for (let i = 0; i < 14; i++) {
        const x = 0.2 + hash(i, 4, 1) * 1.6, z = 0.2 + hash(i, 5, 1) * 1.6;
        cyl(g, 0.008, 0.008, 0.12, '#4f9e36', x, 0.04, z, 4, false);
        ball(g, 0.035, ['#ffd23a', '#ff8fb0', '#ffffff', '#b58cff'][i % 4], x, 0.17, z, 1, 1, 1, false);
      }
      e.top = 0.8;
      break;
    default: {
      // open shelter for cows, sheep and goats
      for (const [x, z] of [[0.25, 0.25], [1.15, 0.25], [0.25, 0.95], [1.15, 0.95]]) mk(g, cylGeo(0.04, 0.045, 8), surfaceMat('bark', '#8a5a33', 4), 1, 0.6, 1, x, 0.34, z);
      const r = bxT(g, 1.1, 0.06, 0.9, 'planks', d.roof, 0.7, 0.62, 0.6, 2.5);
      r.rotation.x = 0.18;
      bxT(g, 0.5, 0.25, 0.35, 'thatch', '#e2c15a', 0.55, 0.04, 0.5, 3);
    }
  }
  if (!['beehive', 'duck_pond', 'goose_pen', 'peacock_garden', 'swan_lake', 'flamingo_lagoon', 'golden_nest', 'mandarin_pond', 'black_swan_lake', 'silk_house', 'parrot_aviary', 'owl_barn', 'kiwi_burrow', 'squirrel_grove', 'crane_marsh', 'heron_marsh'].includes(d.id)) {
    bx(g, 0.55, 0.12, 0.18, '#8a5a2b', w - 0.55, 0.04, h - 0.35);
    bx(g, 0.47, 0.03, 0.12, '#e2c15a', w - 0.55, 0.14, h - 0.35, false);
  }
  // water stays live when the Blender model swaps in
  for (const c of g.children) if ((c as THREE.Mesh).material === WATER) keep(c);
  // everything built so far is scenery: bake it before the (animated) herd joins the pen
  mergeStatic(g);
  const herd = keep(group(g));
  let count = -1, ver = animalVer;
  const an = ANIMAL[d.animal ?? ''];
  const fed = new Map<number, number | null>();
  const hop = new Map<number, number>();
  e.update = (o, now, t) => {
    const list = o.pen?.animals ?? [];
    // sculpting a new kind takes a moment, so at most one new kind is sculpted per frame;
    // a farm full of pens fills in over a few frames instead of freezing on load
    if (list.length !== count && an && an.id !== 'bee' && !hasCreature(an.id, 1)) {
      if (sculptBudget <= 0) return;
      sculptBudget--;
    }
    if (list.length !== count || ver !== animalVer) {
      ver = animalVer;
      const grew = count >= 0 && list.length > count;
      herd.clear();
      count = list.length;
      for (let i = 0; i < count; i++) herd.add(an?.id === 'bee' ? buildHive() : buildAnimal(an?.id ?? ''));
      if (grew) { hop.set(list[count - 1].id, t); bump(e); }
    }
    // feeding or collecting makes that animal hop with joy
    for (const a of list) {
      const prev = fed.get(a.id);
      if (prev !== undefined && prev !== a.fedAt) hop.set(a.id, t);
      fed.set(a.id, a.fedAt);
    }
    herd.children.forEach((m, i) => {
      const a = list[i];
      const id = a?.id ?? i;
      let jump = 0;
      const h0 = hop.get(id);
      if (h0 !== undefined) {
        const u = (t - h0) / 1000;
        if (u > 0.75) hop.delete(id);
        else jump = Math.abs(Math.sin((u / 0.75) * Math.PI * 2)) * 0.12 * (1 - u / 0.75 * 0.5);
      }
      if (an && a && animalReady(a, an.time, now)) jump += Math.max(0, Math.sin(t / 170 + id)) * 0.03 * (Math.sin(t / 1900 + id) > 0.6 ? 1 : 0);
      if (an?.id === 'bee') {
        const slots = [[0.5, 0.5], [1.5, 0.5], [0.5, 1.5], [1.5, 1.5]];
        const [x, z] = slots[i % 4];
        m.position.set(x, 0.04 + jump * 0.3, z);
        const bees = m.userData.bees as THREE.Group;
        bees.children.forEach((b, k) => {
          const bp = a?.graze ? beePose(o, a, k, now) : null;
          if (bp) {
            // out on the flowers: the hive sits at (o.x + x, o.y + z)
            b.position.set(bp.x - o.x - x, bp.h + (bp.landed ? 0 : Math.sin(t / 150 + k) * 0.03), bp.y - o.y - z);
            b.rotation.y = t / 300 + k;
            const f2 = Math.sin(t / 18 + k) * (bp.landed ? 0.2 : 0.6);
            b.children[2].rotation.z = f2;
            b.children[3].rotation.z = -f2;
            return;
          }
          const ang = t / (400 + k * 90) + k * 2 + id;
          b.position.set(Math.cos(ang) * (0.25 + k * 0.05), 0.35 + Math.sin(t / 300 + k) * 0.08, Math.sin(ang) * (0.25 + k * 0.05));
          b.rotation.y = -ang;
          const flap = Math.sin(t / 18 + k) * 0.6;
          b.children[2].rotation.z = flap;
          b.children[3].rotation.z = -flap;
        });
        return;
      }
      const head = m.userData.head as THREE.Object3D | undefined;
      const tail = m.userData.tail as THREE.Object3D | undefined;
      const gz = a?.graze ? grazePose(o, d, a, now) : null;
      if (gz) {
        // out grazing: walking the path, or head down nibbling the grass
        m.position.set(gz.x - o.x, 0.04 + (gz.moving ? Math.abs(Math.sin(t / 110 + id)) * 0.012 : 0), gz.y - o.y);
        m.rotation.y = gz.heading;
        m.rotation.z = 0;
        animateLegs(m, gz.moving ? Math.sin(t / 110 + id) * 0.32 : 0);
        if (head) head.rotation.x = gz.moving ? 0 : 0.55 + Math.max(0, Math.sin(t / 260 + id)) * 0.25;
        if (tail) tail.rotation.z = Math.sin(t / 300 + id) * 0.4;
        blink(m, t, id);
        const cs = m.userData.shadow as THREE.Object3D | undefined;
        if (cs) cs.position.y = 0.006 - (m.position.y - 0.04);
        return;
      }
      if (head && !gz) head.rotation.x = Math.min(head.rotation.x, 0.5);
      if (an && SWIMMERS.has(an.id)) {
        const u = hash(id, 1, 3);
        const ang = t / (4200 + u * 2000) + id * 1.7;
        const r = 0.3 + u * 0.35;
        m.position.set(1.7 + Math.cos(ang) * r, 0.08 + Math.sin(t / 400 + id) * 0.01 + jump * 0.5, 1.7 + Math.sin(ang) * r);
        m.rotation.y = Math.atan2(-Math.sin(ang), Math.cos(ang));
        m.rotation.z = Math.sin(t / 520 + id) * 0.06;
        blink(m, t, id);
        // now and then a duck dips its head under water
        if (head) head.rotation.x = Math.max(0, Math.sin(t / 900 + id * 2.3) - 0.85) * 8;
        return;
      }
      const sp = animalSpot(d, id, t);
      blink(m, t, id);
      const cs = m.userData.shadow as THREE.Object3D | undefined;
      m.position.set(sp.x, 0.04 + jump + Math.abs(Math.sin(t / 110 + id)) * 0.008, sp.z);
      m.rotation.y = sp.heading;
      animateLegs(m, Math.sin(t / 110 + id) * 0.28);
      if (cs) cs.position.y = 0.006 - (m.position.y - 0.04);
      if (m.userData.hop) {
        // rabbits bound along in little hops, then sit and twitch their ears
        const hopping = Math.max(0, Math.sin(t / 2400 + id * 1.3));
        m.position.y += Math.abs(Math.sin(t / 150 + id)) * 0.07 * hopping;
        m.rotation.x = -Math.cos(t / 150 + id) * 0.25 * hopping * Math.sign(Math.sin(t / 150 + id));
        if (head) head.rotation.z = Math.sin(t / 260 + id) * 0.12 * (1 - hopping);
      }
      if (head) {
        const phase = Math.sin(t / 2600 + id * 1.7);
        if (m.userData.peck) head.rotation.x = Math.sin(t / 1500 + id) > 0.3 ? Math.pow(Math.max(0, Math.sin(t / 110 + id)), 4) * 0.9 : 0;
        else head.rotation.x = THREE.MathUtils.smoothstep(phase, 0.1, 0.6) * 0.75;
        head.rotation.y = Math.sin(t / 1700 + id) * 0.25 * (1 - THREE.MathUtils.smoothstep(phase, 0.1, 0.6));
      }
      if (tail) tail.rotation.z = Math.sin(t / (an?.id === 'goat' ? 90 : 330) + id) * 0.35;
    });
  };
}

const leafMats = new Map<string, THREE.MeshStandardMaterial>();
function leafMat(color: string) {
  let m = leafMats.get(color);
  if (!m) {
    m = windify(new THREE.MeshStandardMaterial({ color, map: leafTexture(), alphaTest: 0.45, side: THREE.DoubleSide, vertexColors: true, roughness: 0.75 }), 1, 0.35);
    leafMats.set(color, m);
  }
  return m;
}

// Leafy tree: tapered bark trunk with two limbs and a crown of lumpy foliage puffs.
// Returns the crown group (pivot at the trunk base, for swaying) and its main puff.
// cartoon leaf material per color: smooth and bright, tinted over the baked crown shading
const toonLeafCache = new Map<string, THREE.Material>();
function toonLeafMat(leaf: string) {
  let m = toonLeafCache.get(leaf);
  if (!m) {
    const c = new THREE.Color(leaf);
    c.offsetHSL(0, 0.12, 0.08);
    m = new THREE.MeshStandardMaterial({ color: c, vertexColors: true, roughness: 0.7 });
    toonLeafCache.set(leaf, m);
  }
  return m;
}

// Cartoon tree: a stout curving trunk with root flares and one puffy round crown
function toonTree(g: P, x: number, z: number, leaf: string, k: number, seed: number) {
  const bark = M('#8a5a32');
  const trunk = mk(g, cylGeo(0.07, 0.12, 12), bark, k, 0.6 * k, k, x, 0.3 * k, z);
  trunk.rotation.z = (hash(seed, 3) - 0.5) * 0.12;
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + seed;
    mk(g, G.ball, bark, 0.05 * k, 0.035 * k, 0.05 * k, x + Math.cos(a) * 0.09 * k, 0.02, z + Math.sin(a) * 0.09 * k);
  }
  const crown = group(g, x, 0, z);
  crown.userData.crown = true;
  const m = mk(crown, toonCrown(seed), toonLeafMat(leaf), k, k, k, 0, 0, 0);
  m.receiveShadow = true;
  return { crown, main: m };
}

function leafyTree(g: P, x: number, z: number, leaf: string, k = 1, seed = 1) {
  if (artStyle() === 'toon') return toonTree(g, x, z, leaf, k, seed);
  const bark = surfaceMat('bark', '#7a4b26', 3);
  mk(g, cylGeo(0.055, 0.095, 10), bark, k, 0.55 * k, k, x, 0.275 * k, z);
  for (const [a, rz] of [[0.6, 0.7], [3.4, -0.6]]) {
    const limb = mk(g, cylGeo(0.02, 0.035, 8), bark, k, 0.22 * k, k, x + Math.cos(a) * 0.05 * k, 0.5 * k, z + Math.sin(a) * 0.05 * k);
    limb.rotation.set(0, a, rz);
  }
  const crown = group(g, x, 0, z);
  const puffs: [number, number, number, number, number][] = [
    [0, 0.8, 0, 0.34, 0], [-0.2, 0.68, 0.1, 0.22, -0.05], [0.2, 0.7, -0.08, 0.23, 0.03],
    [0.05, 1.0, 0.02, 0.21, 0.07], [0.08, 0.66, 0.2, 0.2, 0.02], [-0.1, 0.72, -0.2, 0.2, -0.03],
  ];
  // each puff is a dark leafy core wrapped in a shell of painted leaf cards
  const main = puffs.map(([px, py, pz, r, l], i) => {
    const core = mk(crown, blobGeo(seed * 7 + i), M(shade(leaf, l - 0.12)), r * 0.86 * k, r * 0.8 * k, r * 0.86 * k, px * k, py * k, pz * k);
    const shell = new THREE.Mesh(leafShell(seed * 7 + i, i === 0 ? 90 : 60), leafMat(shade(leaf, l + 0.04)));
    shell.scale.set(r * k, r * 0.92 * k, r * k);
    shell.position.set(px * k, py * k, pz * k);
    shell.castShadow = true;
    shell.receiveShadow = true;
    crown.add(shell);
    return core;
  })[0];
  return { crown, main };
}

// points spread over the front and sides of a crown, used to hang fruit
function crownSpots(n: number, cx: number, cy: number, cz: number, r: number) {
  const out: [number, number, number][] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + hash(i, 4, 9) * 0.6;
    const y = -0.35 + hash(i, 5, 9) * 0.8;
    const c = Math.sqrt(1 - y * y);
    out.push([cx + Math.cos(a) * c * r, cy + y * r * 0.9, cz + Math.sin(a) * c * r]);
  }
  return out;
}

// Coconut palm: a curved ringed trunk and a crown of long arching fronds.
function palmTree(g: P, leaf: string) {
  const crown = group(g, 0.5, 0, 0.5);
  crown.userData.crown = true;
  const segs = 9;
  let x = 0, z = 0;
  const bark = surfaceMat('bark', '#9a7248', 3);
  for (let i = 0; i < segs; i++) {
    const t = i / segs;
    const nx = Math.sin(t * 1.4) * 0.16, ny = (i + 1) * 0.15;
    const seg = mk(crown, cylGeo(0.055 - t * 0.02, 0.065 - t * 0.02, 10), bark, 1, 0.16, 1, (x + nx) / 2, ny - 0.075, z);
    seg.rotation.z = -Math.atan2(nx - x, 0.15);
    mk(crown, cylGeo(0.07 - t * 0.02, 0.07 - t * 0.02, 10), M('#7a5634'), 1, 0.02, 1, nx, ny - 0.01, z);
    x = nx;
  }
  const top = keep(group(crown, x, segs * 0.15, z));
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2 + (i % 2) * 0.2;
    const f = group(top);
    f.rotation.y = a;
    // each frond is a row of leaflets drooping further toward the tip
    for (let k = 0; k < 7; k++) {
      const u = k / 6;
      const px = 0.06 + u * 0.48, py = 0.05 + Math.sin(u * 2.4) * 0.12 - u * u * 0.3;
      for (const sd of [-1, 1]) {
        const lf = mk(f, G.ball, M(shade(leaf, (k % 2) * 0.04 - 0.06)), 0.05, 0.01, 0.12 - u * 0.05, px, py, sd * (0.07 - u * 0.02), false);
        lf.rotation.set(sd * 0.5, sd * 0.5, -0.3 - u * 0.6);
      }
      mk(f, G.ball, M(shade(leaf, -0.14)), 0.05, 0.012, 0.012, px, py + 0.004, 0, false);
    }
  }
  return { crown, top };
}

function buildFruitTree(e: Entry, d: BuildingDef) {
  const g = e.root;
  const leaf = TREE_LEAF[d.id] ?? '#4f9e36';
  if (d.id === 'coconut_palm' || d.id === 'date_palm') return buildPalm(e, d, leaf);
  if (d.id === 'banana_tree') return buildBanana(e, leaf);
  const { crown } = leafyTree(g, 0.5, 0.5, leaf, d.id === 'walnut_tree' ? 1.2 : 1, d.id.length);
  const fc = FRUIT_COLOR[d.fruit ?? 'apple'] ?? '#e53935';
  // realistic fruit: dimpled apples, paired cherries, pitted oranges, blushing peaches, lemons
  const pg = produceGeo(d.fruit ?? 'apple');
  const fm = pg ? PRODUCE_MAT : new THREE.MeshStandardMaterial({ color: fc, roughness: 0.35 });
  const fruit = crownSpots(11, 0, 0.8, 0, 0.45).map(([x, y, z], i) => {
    const f = keep(mk(crown, pg ?? G.ball, fm, 0.055, 0.055, 0.055, x, y, z));
    f.rotation.set((hash(i, 2) - 0.5) * 0.6, hash(i, 3) * 6, (hash(i, 4) - 0.5) * 0.6);
    return f;
  });
  e.top = 1.25;
  let start = -1, wasReady = false, shake = -1e9;
  const shown: number[] = fruit.map(() => 0);
  e.update = (o, now, t) => {
    const ti = treeInfo(o, now);
    const st = o.tree?.startAt ?? 0;
    // picked: the tree shakes and its fruit tumbles down
    if (start >= 0 && st !== start && wasReady) {
      fruit.forEach((f, i) => { if (f.visible) dropDown(f, i * 0.05); });
      shake = t;
      bump(e);
    }
    start = st; wasReady = ti.ready;
    const n = ti.ready ? fruit.length : Math.floor(ti.p * fruit.length);
    const sc = ti.ready ? 1 : 0.5 + ti.p * 0.4;
    const base = d.fruit === 'cherry' || d.fruit === 'olive' || d.fruit === 'mulberry' || d.fruit === 'lychee' || d.fruit === 'hazelnut' || d.fruit === 'almond' ? 0.075 : d.fruit === 'lemon' || d.fruit === 'plum' || d.fruit === 'apricot' || d.fruit === 'lime' ? 0.07 : 0.085;
    fruit.forEach((f, i) => {
      // new fruit swells in instead of popping into existence
      shown[i] = i < n ? Math.min(1, shown[i] + 0.04) : 0;
      f.visible = shown[i] > 0;
      const ripe = ti.ready ? 1 + Math.sin(t / 300 + i) * 0.06 : 1;
      f.scale.setScalar(base * sc * easeOutBack(shown[i]) * ripe + 0.0001);
    });
    const u = (t - shake) / 900;
    const wobble = u >= 0 && u < 1 ? Math.sin(u * Math.PI * 7) * (1 - u) * 0.1 : 0;
    crown.rotation.z = Math.sin(t / 1100 + o.id) * 0.02 + wobble;
    crown.rotation.x = Math.sin(t / 1400 + o.id * 2) * 0.012 + wobble * 0.5;
  };
}

// Banana plant: a thick fibrous pseudostem, huge ragged paddle leaves and a hanging bunch
// with its purple flower bud.
function buildBanana(e: Entry, leaf: string) {
  const g = e.root;
  const crown = group(g, 0.5, 0, 0.5);
  crown.userData.crown = true;
  const stemM = surfaceMat('bark', '#8a8a4a', 3);
  mk(crown, cylGeo(0.07, 0.1, 12), stemM, 1, 0.95, 1, 0, 0.475, 0);
  const leafM = windify(new THREE.MeshStandardMaterial({ color: leaf, vertexColors: true, side: THREE.DoubleSide, roughness: 0.7 }), 1, 0.3);
  const leaves: THREE.Object3D[] = [];
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + (i % 2) * 0.3;
    const pv = group(crown, 0, 0.9, 0);
    pv.rotation.y = Math.PI / 2 - a;
    const lf = new THREE.Mesh(ruffledLeaf(200 + i), leafM);
    lf.scale.set(0.32, 0.85, 0.3);
    lf.rotation.x = 0.8 + (i % 3) * 0.15;
    lf.castShadow = true;
    pv.add(lf);
    leaves.push(pv);
  }
  const bunch = produceGeo('banana') as THREE.BufferGeometry;
  const fruit = [0, 1].map((k) => {
    const b = keep(mk(crown, bunch, PRODUCE_MAT, 0.3, 0.3, 0.3, k ? -0.12 : 0.12, 0.72, k ? 0.05 : -0.05));
    b.rotation.set(0, k * 2, k ? -0.35 : 0.35);
    return b;
  });
  ball(crown, 0.045, '#6a2a4a', 0.16, 0.55, -0.06, 0.8, 1.4, 0.8);
  e.top = 1.8;
  let start = -1, wasReady = false, shake = -1e9;
  e.update = (o, now, t) => {
    const ti = treeInfo(o, now);
    const st = o.tree?.startAt ?? 0;
    if (start >= 0 && st !== start && wasReady) { fruit.forEach((f) => { if (f.visible) popOut(f, 0, 0.6); }); shake = t; bump(e); }
    start = st; wasReady = ti.ready;
    fruit.forEach((f, i) => { f.visible = ti.ready || ti.p > (i + 1) * 0.4; f.scale.setScalar(0.3 * (ti.ready ? 1 : 0.55 + ti.p * 0.45)); });
    const u = (t - shake) / 900;
    const wobble = u >= 0 && u < 1 ? Math.sin(u * Math.PI * 7) * (1 - u) * 0.07 : 0;
    crown.rotation.z = Math.sin(t / 1600 + o.id) * 0.02 + wobble;
    leaves.forEach((l, i) => { l.rotation.z = Math.sin(t / 900 + i * 1.3 + o.id) * 0.05; });
  };
}

function buildPalm(e: Entry, d: BuildingDef, leaf: string) {
  const g = e.root;
  const { crown, top } = palmTree(g, leaf);
  const nut = PRODUCE_MAT;
  const fruit = [0, 1, 2, 3, 4].map((i) => {
    const a = (i / 5) * Math.PI * 2;
    return mk(top, produceGeo(d.fruit ?? 'coconut') ?? G.ball, nut, 0.06, 0.055, 0.06, Math.cos(a) * 0.07, -0.04, Math.sin(a) * 0.07);
  });
  e.top = 1.7;
  let start = -1, wasReady = false, shake = -1e9;
  e.update = (o, now, t) => {
    const ti = treeInfo(o, now);
    const st = o.tree?.startAt ?? 0;
    if (start >= 0 && st !== start && wasReady) {
      fruit.forEach((f, i) => { if (f.visible) dropDown(f, i * 0.06); });
      shake = t;
      bump(e);
    }
    start = st; wasReady = ti.ready;
    const n = ti.ready ? fruit.length : Math.floor(ti.p * fruit.length);
    fruit.forEach((f, i) => { f.visible = i < n; f.scale.setScalar(0.06 * (ti.ready ? 1 : 0.6 + ti.p * 0.4)); });
    const u = (t - shake) / 900;
    const wobble = u >= 0 && u < 1 ? Math.sin(u * Math.PI * 7) * (1 - u) * 0.08 : 0;
    crown.rotation.z = Math.sin(t / 1500 + o.id) * 0.025 + wobble;
    top.children.forEach((f, i) => { f.rotation.z = Math.sin(t / 700 + i + o.id) * 0.06; });
  };
}

function buildStall(e: Entry, d: BuildingDef, store: GameStore) {
  const g = e.root;
  bx(g, 1.8, 0.03, 1.8, '#c9a46a', 1, 0, 1, false);
  for (const [x, z] of [[0.3, 0.3], [1.7, 0.3], [0.3, 1.7], [1.7, 1.7]]) cyl(g, 0.04, 0.04, 1.3, '#7a4b26', x, 0, z, 6);
  bxT(g, 1.3, 0.45, 0.45, 'boards', '#c98a45', 1, 0, 1.3, 2);
  bxT(g, 1.4, 0.05, 0.55, 'planks', '#e3b075', 1, 0.45, 1.3, 2);
  for (let i = 0; i < 3; i++) bx(g, 0.3, 0.2, 0.22, '#a8733f', 0.55 + i * 0.45, 0.03, 1.72);
  for (let i = 0; i < 7; i++) {
    const s = bx(g, 1.62 / 7, 0.04, 1.75, i % 2 ? '#fff6df' : d.roof, 0.19 + (i + 0.5) * (1.62 / 7), 1.28, 1);
    s.rotation.x = 0.18;
  }
  const goods = keep(group(g));
  let key = '';
  e.top = 1.55;
  e.update = (_o, now) => {
    const s = store.s;
    const k = s.stall.map((x) => (x.item ? `${x.item}${x.soldAt <= now ? '$' : ''}` : '-')).join(',');
    if (k === key) return;
    key = k;
    goods.clear();
    s.stall.filter((x) => x.item).slice(0, 4).forEach((x, i) => {
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: emojiTex(x.soldAt <= now ? '💰' : ITEMS[x.item as string].icon) }));
      sp.scale.set(0.28, 0.28, 1);
      sp.position.set(0.55 + i * 0.3, 0.64, 1.3);
      goods.add(sp);
    });
  };
}

function waterBasin(g: THREE.Group, w: number, h: number) {
  keep(bxT(g, w - 0.04, 0.03, h - 0.04, 'sand', '#e2cf98', w / 2, 0, h / 2, 1.5, false));
  keep(mk(g, G.box, WATER, w - 0.3, 0.04, h - 0.3, w / 2, 0.035, h / 2, false));
}

function planks(g: THREE.Group, x: number, z: number, w: number, d: number) {
  const deck = bxT(g, d, 0.07, w, 'planks', '#c49660', x, 0.1, z, 1.2);
  deck.rotation.y = Math.PI / 2;
  for (const [px, pz] of [[x - w / 2 + 0.04, z + d / 2 - 0.04], [x + w / 2 - 0.04, z + d / 2 - 0.04], [x - w / 2 + 0.04, z], [x + w / 2 - 0.04, z]]) cyl(g, 0.035, 0.035, 0.22, '#6b4226', px, -0.05, pz, 6);
}

function buildPier(e: Entry, d: BuildingDef) {
  const g = e.root;
  waterBasin(g, 2, 2);
  planks(g, 0.45, 1, 0.55, 1.8);
  bxT(g, 0.5, 0.5, 0.45, 'boards', d.wall, 0.45, 0.17, 0.35, 2);
  roofT(g, 0.64, 0.24, 0.6, d.roof, surfaceMat('boards', d.wall, 2), 0.45, 0.67, 0.35, 0.07);
  badge(g, d.icon, 0.26, 0.45, 0.45, 0.585);
  const rod = keep(mk(g, cylGeo(0.01, 0.015, 5), M('#6b4226'), 1, 0.9, 1, 0.9, 0.55, 1.45));
  rod.rotation.z = -0.9;
  const bob = keep(ball(g, 0.04, '#e74c3c', 1.5, 0.08, 1.45));
  const lineGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(1.26, 0.86, 1.45), new THREE.Vector3(1.5, 0.1, 1.45)]);
  const line = keep(new THREE.Line(lineGeo, new THREE.LineBasicMaterial({ color: '#ffffff' })));
  g.add(line);
  e.top = 1.1;
  e.update = (o, now, t) => {
    const busy = !!prodInfo(o, now).current;
    bob.position.y = 0.08 + (busy ? Math.sin(t / 300) * 0.02 : 0);
  };
}

function buildDock(e: Entry, store: GameStore) {
  const g = e.root;
  waterBasin(g, 2, 2);
  planks(g, 0.4, 1, 0.5, 1.8);
  const boat = keep(group(g, 1.35, 0.06, 1));
  bx(boat, 0.5, 0.2, 1.1, '#8e4a2b', 0, 0, 0);
  roof(boat, 0.5, 0.2, 0.3, '#8e4a2b', 0, 0, 0.6, Math.PI / 2).rotation.set(Math.PI / 2, 0, 0);
  bx(boat, 0.46, 0.03, 1.05, '#c98a45', 0, 0.2, 0);
  bx(boat, 0.51, 0.04, 1.11, '#ffffff', 0, 0.12, 0, false);
  cyl(boat, 0.025, 0.03, 1.3, '#6b4226', 0, 0.2, 0.05, 6);
  const sail = new THREE.Mesh(sailGeo(), new THREE.MeshLambertMaterial({ color: '#fffaf0', side: THREE.DoubleSide }));
  sail.scale.set(1, 1.0, 0.55);
  sail.position.set(0, 0.35, 0.08);
  sail.castShadow = true;
  boat.add(sail);
  bx(boat, 0.01, 0.1, 0.16, '#e74c3c', 0, 1.42, 0.13);
  const crates = group(boat);
  if (artStyle() === 'toon') {
    // the Blender cargo boat (tools/blender/world.py) takes over the hull, mast and sail
    const hull = boat.children.filter((c) => c !== crates);
    loadModel('cargo_boat').then((m) => {
      for (const c of hull) boat.remove(c);
      boat.add(m.clone());
    }).catch(() => {});
  }
  const buoy = keep(ball(g, 0.07, '#e74c3c', 1.4, 0.1, 1.1));
  let key = '';
  e.top = 1.5;
  e.update = (_o, now, t) => {
    const s = store.s;
    const docked = boatState(s, now) === 'docked' && !!s.boat;
    boat.visible = docked;
    buoy.visible = !docked;
    boat.position.y = 0.06 + Math.sin(t / 700) * 0.015;
    boat.rotation.z = Math.sin(t / 900) * 0.03;
    buoy.position.y = 0.1 + Math.sin(t / 500) * 0.02;
    if (!docked || !s.boat) return;
    const k = s.boat.crates.map((c) => (c.filled ? 1 : 0)).join('');
    if (k === key) return;
    key = k;
    crates.clear();
    s.boat.crates.slice(0, 6).forEach((c, i) => {
      const m = mk(crates, G.box, c.filled ? M('#c98a45') : MT('#c98a45', 0.3), 0.14, 0.12, 0.14, (i % 2 ? 0.1 : -0.1), 0.28, -0.35 + Math.floor(i / 2) * 0.22);
      m.castShadow = c.filled;
    });
  };
}

function buildObstacle(e: Entry, o: FarmObject) {
  const g = e.root;
  if (o.type === 'tree_obs') {
    const { crown } = leafyTree(g, 0.5, 0.5, '#3f8a33', 1.08, o.id);
    e.top = 1.3;
    e.update = (ob, _n, t) => { crown.rotation.z = Math.sin(t / 1300 + ob.id) * 0.015; };
  } else if (o.type === 'rock_obs') {
    mk(g, G.rock, MF('#9a9ea3'), 0.34, 0.24, 0.3, 0.48, 0.18, 0.5).rotation.y = 0.6;
    mk(g, G.rock, MF('#83878c'), 0.16, 0.12, 0.15, 0.78, 0.08, 0.7);
    ball(g, 0.06, '#6aa84f', 0.25, 0.04, 0.72, 1, 0.5, 1);
    e.top = 0.5;
  } else {
    mk(g, blobGeo(11), M('#3f8a34'), 0.21, 0.19, 0.21, 0.37, 0.17, 0.5);
    mk(g, blobGeo(12), M('#4d9a3c'), 0.2, 0.18, 0.2, 0.63, 0.17, 0.45);
    mk(g, blobGeo(13), M('#5aab45'), 0.22, 0.2, 0.22, 0.5, 0.29, 0.55);
    const berry = new THREE.MeshStandardMaterial({ color: '#d9434b', roughness: 0.3 });
    for (const [x, y, z] of [[0.62, 0.3, 0.72], [0.4, 0.36, 0.72], [0.5, 0.42, 0.7], [0.3, 0.24, 0.62], [0.72, 0.22, 0.6]]) mk(g, G.ball, berry, 0.035, 0.035, 0.035, x, y, z);
    e.top = 0.55;
  }
}

// warm pool of light on the ground around a lamp, faded in at night
function groundGlow(g: P, x: number, z: number, size: number) {
  const m = new THREE.Mesh(G.plane, glowMat());
  m.rotation.x = -Math.PI / 2;
  m.scale.set(size, size, 1);
  m.position.set(x, 0.03, z);
  m.renderOrder = 2;
  g.add(m);
}

// Path tiles, refreshed with the walk grid. Paths never block the farmer.
const pathTiles = new Set<number>();
const WALKABLE = new Set(['dirt_path', 'stone_path']);
// One material per neighbor mask (north 1, east 2, south 4, west 8): a round center plus arms
// running to each connected side, drawn soft so tiles blend into one winding path.
const pathMats = new Map<number, THREE.Material>();
function pathMat(mask: number) {
  let m = pathMats.get(mask);
  if (m) return m;
  const tex = canvasTex(`path${mask}`, 128, 128, (c) => {
    c.clearRect(0, 0, 128, 128);
    c.filter = 'blur(5px)';
    c.fillStyle = '#b07a46';
    c.beginPath(); c.arc(64, 64, 40, 0, Math.PI * 2); c.fill();
    if (mask & 1) c.fillRect(26, -10, 76, 74);
    if (mask & 4) c.fillRect(26, 64, 76, 74);
    if (mask & 2) c.fillRect(64, 26, 74, 76);
    if (mask & 8) c.fillRect(-10, 26, 74, 76);
    c.filter = 'none';
    // darker wheel ruts and a scatter of pebbles
    c.globalCompositeOperation = 'source-atop';
    for (let i = 0; i < 90; i++) {
      const x = hash(i, mask, 1) * 128, y = hash(i, mask, 2) * 128, r = 1 + hash(i, mask, 3) * 3;
      c.fillStyle = i % 3 ? 'rgba(120, 84, 50, 0.35)' : 'rgba(235, 215, 180, 0.6)';
      c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill();
    }
    c.globalCompositeOperation = 'source-over';
  });
  m = new THREE.MeshStandardMaterial({ map: tex, transparent: true, depthWrite: false, roughness: 0.95, polygonOffset: true, polygonOffsetFactor: -2 });
  pathMats.set(mask, m);
  return m;
}

function buildDeco(e: Entry, d: BuildingDef) {
  const g = e.root;
  e.top = d.height * ZU + 0.2;
  switch (d.id) {
    case 'picket_fence': {
      // white pickets with pointed tops on two rails
      for (let i = 0; i < 6; i++) {
        const x = 0.1 + i * 0.16;
        bx(g, 0.07, 0.34, 0.025, '#f7f3ea', x, 0, 0.5);
        const tipM = mk(g, cylGeo(0, 0.05, 4), M('#f7f3ea'), 1, 0.06, 1, x, 0.37, 0.5);
        tipM.rotation.y = Math.PI / 4;
        tipM.scale.set(1, 1, 0.35);
      }
      for (const y of [0.08, 0.24]) bx(g, 0.96, 0.035, 0.02, '#ece6da', 0.5, y, 0.485);
      e.top = 0.5;
      break;
    }
    case 'dirt_path': {
      // a soft edged patch of packed earth that reaches toward neighboring path tiles
      const m = new THREE.Mesh(G.plane, pathMat(0));
      m.rotation.x = -Math.PI / 2;
      m.position.set(0.5, 0.014, 0.5);
      m.scale.set(1.02, 1.02, 1);
      m.receiveShadow = true;
      g.add(m);
      e.top = 0.1;
      let mask = -1;
      e.update = (o) => {
        const k = (pathTiles.has((o.y - 1) * GRID + o.x) ? 1 : 0) | (pathTiles.has(o.y * GRID + o.x + 1) ? 2 : 0)
          | (pathTiles.has((o.y + 1) * GRID + o.x) ? 4 : 0) | (pathTiles.has(o.y * GRID + o.x - 1) ? 8 : 0);
        if (k !== mask) { mask = k; m.material = pathMat(k); }
      };
      break;
    }
    case 'stone_path': {
      // flat irregular flagstones set in the grass
      const stone = surfaceMat('stone', '#c8c2b4', 6);
      for (let i = 0; i < 5; i++) {
        const st = mk(g, blobGeo(40 + i), stone, 0.16 + hash(i, 1) * 0.06, 0.02, 0.14 + hash(i, 2) * 0.05, 0.22 + (i % 3) * 0.28, 0.015, 0.25 + Math.floor(i / 3) * 0.45 + (i % 2) * 0.08, false);
        st.rotation.y = hash(i, 3) * 3;
      }
      e.top = 0.1;
      break;
    }
    case 'bird_house': {
      // a little house on a post with a round door, and a bird hopping on the perch
      cyl(g, 0.025, 0.03, 0.8, '#7a4a28', 0.5, 0, 0.5, 8);
      bxT(g, 0.2, 0.18, 0.18, 'boards', '#6aa0d8', 0.5, 0.8, 0.5, 6);
      roofT(g, 0.26, 0.1, 0.24, '#c0392b', surfaceMat('boards', '#6aa0d8', 6), 0.5, 0.98, 0.5, 0.03);
      mk(g, cylGeo(0.035, 0.035, 14), M('#2a1a10'), 1, 0.01, 1, 0.5, 0.9, 0.592).rotation.x = Math.PI / 2;
      mk(g, cylGeo(0.006, 0.006, 6), M('#7a4a28'), 1, 0.06, 1, 0.5, 0.85, 0.6).rotation.x = Math.PI / 2;
      const bird = keep(group(g, 0.5, 0.87, 0.64));
      ball(bird, 0.025, '#e8563a', 0, 0.02, 0, 1, 0.9, 1.3);
      ball(bird, 0.017, '#6a4a2a', 0, 0.045, 0.02);
      mk(bird, cylGeo(0, 0.006, 5), M('#f2b33a'), 1, 0.015, 1, 0, 0.045, 0.04).rotation.x = Math.PI / 2;
      e.top = 1.2;
      e.update = (o, _n, t) => {
        const k = Math.sin(t / 700 + o.id);
        bird.visible = Math.sin(t / 5000 + o.id) > -0.4;
        bird.position.y = 0.87 + Math.max(0, k) * 0.04;
        bird.rotation.y = Math.sin(t / 900 + o.id) * 0.8;
      };
      break;
    }
    case 'pumpkin_pile': {
      // pumpkins of every size in a heap, with a crate
      const pm = new THREE.MeshStandardMaterial({ color: '#f08a24', roughness: 0.55 });
      for (const [x, y, z, s] of [[0.35, 0.1, 0.4, 0.14], [0.62, 0.09, 0.35, 0.12], [0.5, 0.08, 0.65, 0.11], [0.5, 0.22, 0.45, 0.1], [0.72, 0.07, 0.62, 0.08]] as const) {
        mk(g, ribs(8), pm, s, s, s, x, y, z);
        cyl(g, 0.008, 0.012, 0.05, '#6a7a2a', x, y + s * 0.65, z, 6);
      }
      bxT(g, 0.26, 0.14, 0.2, 'planks', '#b98048', 0.22, 0, 0.72, 5);
      e.top = 0.5;
      break;
    }
    case 'birdbath': {
      // carved stone bowl on a pedestal, with a little bird dipping in
      const stone = surfaceMat('stone', '#d8d2c4', 6);
      mk(g, cylGeo(0.14, 0.18, 16), stone, 1, 0.06, 1, 0.5, 0.03, 0.5);
      mk(g, cylGeo(0.05, 0.07, 12), stone, 1, 0.45, 1, 0.5, 0.28, 0.5);
      mk(g, G.dome, stone, 0.26, 0.1, 0.26, 0.5, 0.6, 0.5).rotation.x = Math.PI;
      keep(mk(g, cylGeo(0.24, 0.24, 20), WATER, 1, 0.01, 1, 0.5, 0.6, 0.5, false));
      const bird = keep(group(g, 0.62, 0.62, 0.5));
      ball(bird, 0.022, '#6a8ab8', 0, 0.02, 0, 1, 0.9, 1.3);
      ball(bird, 0.015, '#4a5a7a', 0, 0.04, 0.02);
      e.top = 0.9;
      e.update = (o, _n, t) => { bird.rotation.x = Math.max(0, Math.sin(t / 400 + o.id) - 0.6) * 1.5; bird.rotation.y = Math.sin(t / 2000 + o.id) * 2; };
      break;
    }
    case 'topiary': {
      // three clipped spheres on a stem, in a terracotta pot
      mk(g, cylGeo(0.12, 0.09, 16), M('#c0643a'), 1, 0.16, 1, 0.5, 0.08, 0.5);
      cyl(g, 0.02, 0.025, 0.7, '#6b4226', 0.5, 0.16, 0.5, 8);
      for (const [y, r] of [[0.32, 0.13], [0.58, 0.11], [0.8, 0.08]] as const) {
        mk(g, blobGeo(50 + Math.round(y * 10)), M('#3f7f32'), r, r, r, 0.5, y, 0.5);
        const sh = new THREE.Mesh(leafShell(7 + Math.round(y * 10), 30), leafMat('#4f9a3a'));
        sh.scale.setScalar(r * 1.05); sh.position.set(0.5, y, 0.5); sh.castShadow = true; g.add(sh);
      }
      e.top = 1.05;
      break;
    }
    case 'well': {
      // round stone well with a little roof, crank and bucket
      const stone = surfaceMat('stone', '#bdb6a6', 5);
      mk(g, cylGeo(0.3, 0.32, 20), stone, 1, 0.34, 1, 0.5, 0.17, 0.5);
      mk(g, cylGeo(0.24, 0.24, 20), new THREE.MeshStandardMaterial({ color: '#0e1a24', roughness: 0.2 }), 1, 0.01, 1, 0.5, 0.3, 0.5, false);
      for (const sx of [-1, 1]) cyl(g, 0.025, 0.025, 0.55, '#6b4226', 0.5 + sx * 0.27, 0.32, 0.5, 8);
      roofT(g, 0.72, 0.22, 0.46, '#8e2c20', M('#6b4226'), 0.5, 0.86, 0.5);
      const axle = mk(g, cylGeo(0.02, 0.02, 8), M('#6b4226'), 1, 0.6, 1, 0.5, 0.72, 0.5);
      axle.rotation.z = Math.PI / 2;
      bx(g, 0.03, 0.1, 0.02, '#6b4226', 0.84, 0.66, 0.5);
      cyl(g, 0.004, 0.004, 0.25, '#c8b88a', 0.5, 0.47, 0.5, 4);
      mk(g, cylGeo(0.06, 0.05, 12), M('#8a8f96'), 1, 0.08, 1, 0.5, 0.45, 0.5);
      e.top = 1.2;
      break;
    }
    case 'flower_arch': {
      // white wooden arch smothered in climbing roses
      for (const x of [0.12, 0.88]) for (const z of [0.4, 0.6]) cyl(g, 0.025, 0.025, 1.0, '#f7f3ea', x, 0, z, 8);
      const arc = new THREE.Mesh(new THREE.TorusGeometry(0.38, 0.025, 8, 24, Math.PI), M('#f7f3ea'));
      arc.position.set(0.5, 1.0, 0.5);
      arc.castShadow = true;
      g.add(arc);
      const rm = new THREE.MeshStandardMaterial({ color: '#e8305a', roughness: 0.5 });
      for (let i = 0; i < 22; i++) {
        const a = (i / 21) * Math.PI;
        const px = 0.5 + Math.cos(a) * 0.38, py = 1.0 + Math.sin(a) * 0.38;
        mk(g, blobGeo(60 + (i % 4)), M(i % 2 ? '#3f8a2e' : '#4f9a36'), 0.06, 0.06, 0.06, px, py, 0.5 + (hash(i, 1) - 0.5) * 0.1);
        if (i % 2 === 0) mk(g, produceGeo('rose') as THREE.BufferGeometry, rm, 0.03, 0.03, 0.03, px, py + 0.04, 0.56);
      }
      for (let i = 0; i < 10; i++) {
        const x = i < 5 ? 0.12 : 0.88, y = 0.1 + (i % 5) * 0.18;
        mk(g, blobGeo(70 + (i % 4)), M('#3f8a2e'), 0.05, 0.06, 0.05, x, y, 0.5);
        if (i % 2) mk(g, produceGeo('rose') as THREE.BufferGeometry, rm, 0.028, 0.028, 0.028, x, y + 0.03, 0.56);
      }
      e.top = 1.5;
      break;
    }
    case 'hay_wagon': {
      // wooden farm wagon with spoked wheels and a load of hay
      bxT(g, 1.5, 0.08, 0.6, 'planks', '#b98048', 1, 0.28, 0.5, 3);
      for (const z of [0.22, 0.78]) bxT(g, 1.5, 0.16, 0.03, 'boards', '#9a6a3a', 1, 0.36, z, 3);
      for (const [x, z] of [[0.45, 0.16], [1.55, 0.16], [0.45, 0.84], [1.55, 0.84]]) {
        const w = group(g, x, 0.2, z);
        const rim = new THREE.Mesh(new THREE.TorusGeometry(0.19, 0.02, 8, 20), M('#5a3a1f'));
        rim.castShadow = true;
        w.add(rim);
        for (let k = 0; k < 6; k++) { const sp = mk(w, cylGeo(0.008, 0.008, 5), M('#7a4a28'), 1, 0.36, 1, 0, -0.18, 0); sp.rotation.z = (k / 6) * Math.PI; sp.position.set(0, 0, 0); }
        ball(w, 0.03, '#3a2a1a', 0, 0, 0);
      }
      const hay = surfaceMat('thatch', '#e8c865', 3, 0.95, 1, 1);
      mk(g, blobGeo(80), hay, 0.62, 0.22, 0.26, 1, 0.5, 0.5);
      cyl(g, 0.015, 0.015, 0.5, '#6b4426', 0.1, 0.3, 0.5, 6).rotation.z = 1.2;
      e.top = 0.9;
      break;
    }
    case 'tractor': {
      // red farm tractor: big rear wheels with treads, small front wheels, cab and exhaust
      const red = new THREE.MeshStandardMaterial({ color: '#c8201e', roughness: 0.35, metalness: 0.3 });
      const tire = new THREE.MeshStandardMaterial({ color: '#1e1e1e', roughness: 0.9 });
      const hub = new THREE.MeshStandardMaterial({ color: '#f2d23a', roughness: 0.4, metalness: 0.3 });
      mk(g, G.box, red, 0.5, 0.3, 0.9, 1, 0.45, 1.05);
      mk(g, G.box, red, 0.55, 0.12, 0.5, 1, 0.42, 0.62);
      mk(g, G.box, new THREE.MeshStandardMaterial({ color: '#2a2a2a', roughness: 0.6 }), 0.46, 0.04, 0.16, 1, 0.61, 1.45);
      for (let i = 0; i < 5; i++) bx(g, 0.52, 0.015, 0.012, '#888888', 1, 0.36 + i * 0.04, 1.5);
      for (const [x, z, r, w] of [[0.62, 0.62, 0.3, 0.14], [1.38, 0.62, 0.3, 0.14], [0.68, 1.4, 0.16, 0.1], [1.32, 1.4, 0.16, 0.1]] as const) {
        const wh = mk(g, cylGeo(r, r, 24), tire, 1, w, 1, x, r, z);
        wh.rotation.z = Math.PI / 2;
        const hb = mk(g, cylGeo(r * 0.55, r * 0.55, 20), hub, 1, w + 0.01, 1, x, r, z);
        hb.rotation.z = Math.PI / 2;
        for (let k = 0; k < 12; k++) {
          const a = (k / 12) * Math.PI * 2;
          const tr = bx(g, w + 0.02, 0.03, 0.05, '#141414', x, r + Math.sin(a) * r - 0.015, z + Math.cos(a) * r);
          tr.rotation.x = -a;
        }
      }
      // cab with a roof and glass
      for (const [x, z] of [[0.78, 0.45], [1.22, 0.45], [0.78, 0.8], [1.22, 0.8]]) bx(g, 0.03, 0.42, 0.03, '#2a2a2a', x, 0.55, z);
      mk(g, G.box, red, 0.52, 0.04, 0.44, 1, 0.99, 0.62);
      mk(g, G.box, WIN, 0.44, 0.3, 0.02, 1, 0.8, 0.8);
      bx(g, 0.16, 0.08, 0.14, '#3a3a3a', 1, 0.5, 0.62);
      cyl(g, 0.025, 0.025, 0.4, '#3a3a3a', 1.16, 0.6, 1.2, 8);
      const puff = smoke(g, 1.16, 1.05, 1.2);
      e.top = 1.3;
      e.update = (_o, _n, t) => puff(true, t);
      break;
    }
    case 'hay_bale': {
      const m = mk(g, cylGeo(0.2, 0.2, 20), surfaceMat('thatch', '#e8c865', 2, 0.95, 1, 1), 1, 0.55, 1, 0.5, 0.2, 0.5);
      m.rotation.z = Math.PI / 2;
      for (const x of [0.35, 0.65]) { const b = mk(g, cylGeo(0.205, 0.205, 20), M('#a8322a'), 1, 0.025, 1, x, 0.2, 0.5, false); b.rotation.z = Math.PI / 2; }
      break;
    }
    case 'oak': {
      const { crown } = leafyTree(g, 0.5, 0.5, '#4f9e36', 1, 3);
      e.top = 1.25;
      e.update = (o, _n, t) => { crown.rotation.z = Math.sin(t / 1200 + o.id) * 0.015; };
      break;
    }
    case 'flowers': {
      // a raised wooden bed of dark soil, leafy ground cover and a mix of garden flowers
      for (const [w, d, x, z] of [[0.84, 0.06, 0.5, 0.11], [0.84, 0.06, 0.5, 0.89], [0.06, 0.72, 0.11, 0.5], [0.06, 0.72, 0.89, 0.5]] as const) {
        bxT(g, w, 0.12, d, 'planks', '#b07a42', x, 0, z, 3);
      }
      bx(g, 0.72, 0.1, 0.72, '#4a2e18', 0.5, 0, 0.5, false);
      // a tidy 4 by 4 planting of short stemmed flowers in bare soil
      const cols = ['#ff5f86', '#ffd23a', '#ffffff', '#a97cff', '#ff8a3d', '#ff3b4f'];
      const kinds: FlowerKind[] = ['tulip', 'daisy', 'rose'];
      const seed = Math.abs(e.id);
      for (let i = 0; i < 16; i++) {
        const x = 0.23 + (i % 4) * 0.18 + (hash(i, 3, 5) - 0.5) * 0.04, z = 0.23 + Math.floor(i / 4) * 0.18 + (hash(i, 4, 5) - 0.5) * 0.04;
        const f = mk(g, flowerKit(kinds[(i + seed) % 3], cols[(i * 5 + seed) % cols.length], 0.1 + hash(i, 6, 5) * 0.03), FLOWER_KIT_MAT, 1.25, 1.25, 1.25, x, 0.1, z, false);
        f.rotation.set((hash(i, 7, 5) - 0.5) * 0.2, hash(i, 8, 5) * 6, (hash(i, 9, 5) - 0.5) * 0.2);
      }
      break;
    }
    case 'bench':
      bxT(g, 0.72, 0.05, 0.26, 'planks', '#b98048', 0.5, 0.2, 0.5, 3);
      bxT(g, 0.72, 0.2, 0.04, 'planks', '#b98048', 0.5, 0.27, 0.38, 3);
      for (const x of [0.2, 0.8]) for (const z of [0.4, 0.6]) bx(g, 0.04, 0.2, 0.04, '#4a3a30', x, 0, z);
      break;
    case 'lamp':
      cyl(g, 0.03, 0.04, 1.1, '#3a3a3a', 0.5, 0, 0.5, 6);
      mk(g, G.box, LAMP, 0.15, 0.18, 0.15, 0.5, 1.19, 0.5);
      mk(g, cylGeo(0, 0.13, 4), M('#3a3a3a'), 1, 0.1, 1, 0.5, 1.33, 0.5).rotation.y = Math.PI / 4;
      groundGlow(g, 0.5, 0.5, 2.4);
      e.top = 1.45;
      break;
    case 'scarecrow':
      cyl(g, 0.03, 0.03, 1.0, '#7a4b26', 0.5, 0, 0.5, 5);
      bx(g, 0.62, 0.04, 0.04, '#7a4b26', 0.5, 0.72, 0.5);
      bx(g, 0.3, 0.3, 0.12, '#c0392b', 0.5, 0.5, 0.5);
      ball(g, 0.1, '#f1dcb8', 0.5, 0.95, 0.5);
      cyl(g, 0.17, 0.17, 0.02, '#d9a93f', 0.5, 1.02, 0.5, 10);
      mk(g, cylGeo(0.03, 0.09, 8), M('#b8923a'), 1, 0.16, 1, 0.5, 1.12, 0.5);
      e.top = 1.3;
      break;
    case 'windmill': {
      mk(g, cylGeo(0.35, 0.55, 16), surfaceMat('stone', '#efe6d2', 3, 0.9, 1, 2), 1, 2.0, 1, 1, 1.0, 1);
      mk(g, cylGeo(0, 0.42, 16), surfaceMat('roof', '#9a3526', 3, 0.7, 1, 1.5), 1, 0.45, 1, 1, 2.22, 1);
      bx(g, 0.26, 0.4, 0.04, '#6b4226', 1, 0, 1.52);
      const hub = group(g, 1, 1.75, 1.42);
      ball(hub, 0.08, '#6b4226', 0, 0, 0.02);
      for (let i = 0; i < 4; i++) {
        const arm = group(hub);
        arm.rotation.z = (i * Math.PI) / 2;
        bx(arm, 0.05, 0.85, 0.02, '#6b4226', 0, 0, 0.05);
        bx(arm, 0.2, 0.6, 0.015, '#fff8e6', 0.12, 0.25, 0.06);
      }
      e.top = 2.7;
      e.update = (_o, _n, t) => { hub.rotation.z = -t / 900; };
      break;
    }
    case 'pond':
      cyl(g, 0.9, 0.95, 0.04, '#d8c38e', 1, 0, 1, 16, false);
      keep(mk(g, cylGeo(0.8, 0.8, 16), WATER, 1, 0.04, 1, 1, 0.04, 1, false));
      for (const [x, z] of [[0.6, 1.2], [1.3, 0.7], [1.4, 1.3]]) cyl(g, 0.1, 0.1, 0.01, '#4caf50', x, 0.065, z, 8, false);
      ball(g, 0.04, '#ff8fb0', 1.3, 0.1, 0.7);
      for (let k = 0; k < 5; k++) cyl(g, 0.01, 0.012, 0.35, '#5a8a2a', 1.75 + (k % 2) * 0.06, 0, 0.6 + k * 0.08, 4);
      e.top = 0.5;
      break;
    case 'fountain': {
      mk(g, cylGeo(0.85, 0.9, 32), surfaceMat('stone', '#c2bcac', 8, 0.9, 1, 0.5), 1, 0.22, 1, 1, 0.11, 1);
      keep(mk(g, cylGeo(0.75, 0.75, 24), WATER, 1, 0.04, 1, 1, 0.215, 1, false));
      cyl(g, 0.1, 0.14, 0.6, '#bfb9a8', 1, 0.2, 1, 8);
      cyl(g, 0.34, 0.28, 0.08, '#cfcabb', 1, 0.75, 1, 12);
      keep(mk(g, cylGeo(0.3, 0.3, 12), WATER, 1, 0.02, 1, 1, 0.83, 1, false));
      const drops = [...Array(10)].map(() => keep(ball(g, 0.03, '#d2f0ff', 1, 1, 1, 1, 1, 1, false)));
      e.top = 1.2;
      e.update = (_o, _n, t) => {
        drops.forEach((m, k) => {
          const a = (k / drops.length) * Math.PI * 2;
          const ph = (t / 900 + k * 0.13) % 1;
          m.position.set(1 + Math.cos(a) * 0.45 * ph, 0.95 + Math.sin(ph * Math.PI) * 0.3 - ph * 0.7, 1 + Math.sin(a) * 0.45 * ph);
        });
      };
      break;
    }
    case 'sprinkler': {
      // a brass riser on a stake; the Blender model adds the spinning head, the game the spray
      cyl(g, 0.02, 0.02, 0.34, '#c8962e', 0.5, 0, 0.5, 8);
      cyl(g, 0.07, 0.08, 0.04, '#2f8a3a', 0.5, 0, 0.5, 12);
      const spray = keep(group(g, 0.5, 0.38, 0.5));
      const jets = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(() => ball(spray, 0.022, '#bfe8ff', 0, 0, 0, 1, 1, 1, false));
      for (const j of jets) j.material = DROP_MAT;
      e.top = 0.6;
      e.update = (o, _n, t) => {
        // two arcs of water sweeping round, reaching out over the fields nearby
        jets.forEach((j, k) => {
          const arm = k % 2 ? Math.PI : 0;
          const ph = ((t / 900 + k * 0.1) % 1);
          const a = t / 700 + arm;
          const r = ph * 1.6;
          j.position.set(Math.cos(a) * r, Math.sin(ph * Math.PI) * 0.35 - ph * 0.3, Math.sin(a) * r);
          j.visible = ph < 0.95;
        });
        spray.rotation.y = Math.sin(o.id) * 0.3;
      };
      break;
    }
    case 'mailbox':
      cyl(g, 0.025, 0.025, 0.55, '#6b4226', 0.5, 0, 0.5, 5);
      bx(g, 0.18, 0.15, 0.3, '#2e6da4', 0.5, 0.55, 0.5);
      bx(g, 0.02, 0.18, 0.02, '#e74c3c', 0.6, 0.62, 0.45);
      bx(g, 0.02, 0.06, 0.08, '#e74c3c', 0.6, 0.74, 0.41);
      e.top = 0.9;
      break;
    case 'gazebo':
      mk(g, cylGeo(0.85, 0.9, 8), surfaceMat('stone', '#e6e0d0', 6, 0.9, 1, 0.3), 1, 0.1, 1, 1, 0.05, 1);
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
        cyl(g, 0.035, 0.035, 0.9, '#fdfaf2', 1 + Math.cos(a) * 0.74, 0.1, 1 + Math.sin(a) * 0.74, 6);
      }
      mk(g, cylGeo(0, 1.02, 8), M('#4f8a6a'), 1, 0.6, 1, 1, 1.3, 1).rotation.y = Math.PI / 8;
      cyl(g, 0.5, 0.5, 0.04, '#a8733f', 1, 0.35, 1, 12);
      cyl(g, 0.08, 0.1, 0.25, '#a8733f', 1, 0.1, 1, 6);
      mk(g, G.box, LAMP, 0.1, 0.1, 0.1, 1, 0.85, 1);
      groundGlow(g, 1, 1, 2.2);
      e.top = 1.7;
      break;
    default: {
      // a plain plinth stands in until the Blender model loads
      const w = d.w ?? 1, h = d.h ?? 1;
      bx(g, w * 0.7, 0.12, h * 0.7, '#b8a88a', w / 2, 0, h / 2);
      e.top = Math.max(0.5, d.height * ZU);
    }
  }
}

// ------------------------------------------------------------------ fishing spot
// A jetty off the south shore. Once opened a fisher waits in a rowboat inside a ring of buoys;
// the bobber dances when a fish bites and fish leap out when the catch is ready.

function signTex(text: string) {
  return canvasTex(`sign|${text}`, 256, 128, (c) => {
    c.fillStyle = '#c98a45'; c.fillRect(0, 0, 256, 128);
    c.strokeStyle = '#6b4226'; c.lineWidth = 12; c.strokeRect(6, 6, 244, 116);
    c.fillStyle = '#fff8e6'; c.font = '900 44px ui-rounded, "Trebuchet MS", system-ui, sans-serif';
    c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(text, 128, 66);
  });
}

function splashRing() {
  const m = new THREE.Mesh(new THREE.RingGeometry(0.7, 1, 24), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0, depthWrite: false }));
  m.rotation.x = -Math.PI / 2;
  return m;
}

function fishModel(color = '#ff9a3c') {
  const g = new THREE.Group();
  mk(g, G.ball, new THREE.MeshStandardMaterial({ color, roughness: 0.3, metalness: 0.2 }), 0.05, 0.035, 0.1, 0, 0, 0);
  const tail = mk(g, cylGeo(0, 0.04, 4), M(shade(color, -0.08)), 1, 0.06, 0.3, 0, 0, -0.11);
  tail.rotation.x = -Math.PI / 2;
  eyes(g, 0.03, 0.01, 0.06, 0.01, true);
  return g;
}

function buildFishingSpot() {
  const root = new THREE.Group();
  const X = FISH_SPOT.x, Z0 = GRID + 0.25, Z1 = FISH_SPOT.y - 0.2;
  // jetty deck on posts
  const n0 = root.children.length;
  const deck = new THREE.Mesh(meterBox(Z1 - Z0, 0.07, 0.7), surfaceMat('planks', '#c49660', 1.2));
  deck.rotation.y = Math.PI / 2;
  deck.position.set(X, -0.12, (Z0 + Z1) / 2);
  deck.castShadow = deck.receiveShadow = true;
  root.add(deck);
  for (let z = Z0 + 0.15; z <= Z1 + 0.01; z += 0.55) for (const sx of [-1, 1]) {
    mk(root, cylGeo(0.045, 0.05, 8), surfaceMat('bark', '#6b4226', 4), 1, 0.9, 1, X + sx * 0.32, -0.55, z);
  }
  for (const sx of [-1, 1]) mk(root, cylGeo(0.05, 0.05, 8), surfaceMat('bark', '#6b4226', 4), 1, 0.35, 1, X + sx * 0.32, 0.02, Z1);
  // sign at the shore end
  const sign = group(root, X - 0.55, -0.2, Z0 + 0.15);
  cyl(sign, 0.03, 0.03, 0.75, '#6b4226', 0, 0, 0, 6);
  const board = new THREE.Mesh(G.box, [M('#a8733f'), M('#a8733f'), M('#a8733f'), M('#a8733f'), new THREE.MeshStandardMaterial({ map: signTex('FISHING') }), new THREE.MeshStandardMaterial({ map: signTex('FISHING') })]);
  board.scale.set(0.62, 0.3, 0.05);
  board.position.set(0, 0.72, 0);
  board.castShadow = true;
  sign.add(board);
  // the Blender jetty (tools/blender/world.py) replaces the deck, piles and sign once loaded
  const jettyStandIn = root.children.slice(n0);
  if (artStyle() === 'toon') {
    loadModel('fishing_jetty').then((m) => {
      for (const c of jettyStandIn) root.remove(c);
      const j = m.clone();
      j.position.set(X, 0, Z0);
      root.add(j);
    }).catch(() => {});
  }
  const lock = badge(root, '🔒', 0.3, X, 0.35, Z0 + 0.3);
  lock.rotation.x = -0.3;
  // chain rope across the jetty while locked
  const rope = mk(root, cylGeo(0.012, 0.012, 6), M('#8a6a44'), 1, 0.66, 1, X, 0.02, Z0 + 0.3);
  rope.rotation.z = Math.PI / 2;

  // buoys marking the fishing area
  const open = group(root);
  const buoys: THREE.Object3D[] = [];
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2 + 0.3;
    const b = group(open, X + Math.cos(a) * 1.35, -0.5, FISH_SPOT.y + 0.4 + Math.sin(a) * 1.0);
    ball(b, 0.07, i % 2 ? '#ffffff' : '#e74c3c', 0, 0, 0, 1, 0.9, 1);
    cyl(b, 0.01, 0.01, 0.12, '#3a3a3a', 0, 0.04, 0, 4);
    buoys.push(b);
  }
  // rowboat with a fisher in a yellow raincoat
  const boat = group(open, X + 0.75, -0.62, FISH_SPOT.y + 0.35);
  boat.rotation.y = 0.5;
  const hull = mk(boat, G.dome, surfaceMat('planks', '#9a5a32', 3), 0.26, 0.2, 0.55, 0, 0.3, 0);
  hull.rotation.x = Math.PI;
  mk(boat, new THREE.TorusGeometry(1, 0.06, 6, 24), M('#7a4a28'), 0.26, 0.55, 0.4, 0, 0.3, 0).rotation.x = Math.PI / 2;
  mk(boat, G.ball, M('#f4efe6'), 0.27, 0.05, 0.56, 0, 0.16, 0);
  bx(boat, 0.44, 0.03, 0.1, '#7a4a28', 0, 0.22, -0.12);
  const hullStandIn = [...boat.children];
  const fisher = buildFarmer('#f2b134', '#3a5a40', '#3a5a40');
  fisher.position.set(0, 0.0, -0.12);
  fisher.scale.setScalar(0.9);
  const fl = fisher.userData.legs as THREE.Object3D[];
  fl.forEach((l) => { l.rotation.x = -1.4; });
  const arms = fisher.userData.arms as THREE.Object3D[];
  arms.forEach((a) => { a.rotation.x = -1.1; });
  boat.add(fisher);
  if (artStyle() === 'toon') {
    // Blender rowboat and fisher, seated and holding the rod like the stand ins
    loadModel('rowboat').then((m) => {
      for (const c of hullStandIn) boat.remove(c);
      boat.add(m.clone());
    }).catch(() => {});
    loadModel('fisher').then((m) => {
      const fresh = farmerFromModel(m);
      fisher.clear();
      for (const c of [...fresh.children]) fisher.add(c);
      Object.assign(fisher.userData, fresh.userData);
      (fisher.userData.legs as THREE.Object3D[]).forEach((l) => { l.rotation.x = -1.4; });
      (fisher.userData.arms as THREE.Object3D[]).forEach((a) => { a.rotation.x = -1.1; });
    }).catch(() => {});
  }
  const rod = group(boat, 0.08, 0.4, 0.1);
  mk(rod, cylGeo(0.006, 0.012, 5), M('#5a3a1a'), 1, 0.9, 1, 0, 0.45, 0);
  rod.rotation.x = 0.9;
  rod.rotation.z = 0.5;
  const bobber = group(open, X - 0.25, -0.53, FISH_SPOT.y + 0.8);
  ball(bobber, 0.035, '#e74c3c', 0, 0.02, 0);
  ball(bobber, 0.036, '#ffffff', 0, -0.005, 0, 1, 0.5, 1);
  const lineGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
  const line = new THREE.Line(lineGeo, new THREE.LineBasicMaterial({ color: '#f5f5f5' }));
  line.frustumCulled = false;
  open.add(line);
  const fish = fishModel();
  fish.visible = false;
  open.add(fish);
  const ring = splashRing();
  open.add(ring);

  const hit = new THREE.Mesh(G.box, HIT_MAT);
  hit.scale.set(3, 1.4, Z1 - Z0 + 1.8);
  hit.position.set(X, 0.2, (Z0 + Z1) / 2 + 0.6);
  root.add(hit);

  const tipV = new THREE.Vector3();
  const update = (state: 'locked' | 'idle' | 'waiting' | 'ready', p: number, t: number) => {
    const isOpen = state !== 'locked';
    open.visible = isOpen;
    lock.visible = rope.visible = !isOpen;
    if (!isOpen) return;
    buoys.forEach((b, i) => { b.position.y = -0.5 + Math.sin(t / 600 + i) * 0.02; b.rotation.z = Math.sin(t / 800 + i) * 0.1; });
    boat.position.y = -0.62 + Math.sin(t / 900) * 0.015;
    boat.rotation.z = Math.sin(t / 1100) * 0.04;
    const casting = state !== 'idle';
    bobber.visible = line.visible = casting;
    rod.rotation.x = casting ? 0.9 : 0.2;
    // the bobber twitches as a bite gets closer, and plunges when the fish is on
    let dip = Math.sin(t / 500) * 0.012;
    if (state === 'waiting' && p > 0.8) dip -= Math.max(0, Math.sin(t / 90)) * 0.03;
    if (state === 'ready') dip -= Math.max(0, Math.sin(t / 140)) * 0.06;
    bobber.position.y = -0.53 + dip;
    if (casting) {
      rod.updateWorldMatrix(true, false);
      tipV.set(0, 0.9, 0).applyMatrix4(rod.matrixWorld);
      open.worldToLocal(tipV);
      const pos = line.geometry.getAttribute('position') as THREE.BufferAttribute;
      pos.setXYZ(0, tipV.x, tipV.y, tipV.z);
      pos.setXYZ(1, bobber.position.x, bobber.position.y + 0.03, bobber.position.z);
      pos.needsUpdate = true;
    }
    // leaping fish and splash rings while the catch waits
    const u = ((t / 1700) % 1);
    fish.visible = state === 'ready' && u < 0.45;
    if (fish.visible) {
      const k = u / 0.45;
      fish.position.set(bobber.position.x + 0.35 - k * 0.7, -0.55 + Math.sin(k * Math.PI) * 0.45, bobber.position.z + 0.1);
      fish.rotation.set(0, -Math.PI / 2, 0);
      fish.rotateX(-Math.cos(k * Math.PI) * 1.1);
    }
    const rk = state === 'ready' ? ((t / 1700 + 0.55) % 1) : 1;
    ring.position.set(bobber.position.x - 0.35, -0.53, bobber.position.z + 0.1);
    ring.scale.setScalar(0.05 + rk * 0.35);
    (ring.material as THREE.MeshBasicMaterial).opacity = state === 'ready' ? (1 - rk) * 0.8 : 0;
  };
  return { root, hit, update };
}

// ------------------------------------------------------------------ manor
// A grand two story home: columned porch with a balcony, hipped roof with dormers,
// twin chimneys, lanterns, hedges, a stone path and a kennel for the dog.

function buildManor(e: Entry, d: BuildingDef) {
  const g = e.root;
  const H = d.height * ZU, y0 = 0.1;
  const wall = surfaceMat('siding', d.wall, 1.1);
  const trim = '#fbf7ee';
  const bw = 2.5, bd = 1.45, cx = 1.5, cz = 1.05, fz = cz + bd / 2;
  bxT(g, 2.9, y0, 2.0, 'stone', '#bdb6a6', cx, 0, cz, 2.2);
  const body = new THREE.Mesh(meterBox(bw, H, bd), wall);
  body.position.set(cx, y0 + H / 2, cz);
  body.castShadow = body.receiveShadow = true;
  g.add(body);
  // floor band and corner quoins
  bx(g, bw + 0.04, 0.06, bd + 0.04, trim, cx, y0 + H * 0.5, cz);
  for (const [ex, ez] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) bx(g, 0.1, H, 0.1, trim, cx + ex * bw / 2, y0, cz + ez * bd / 2);
  // hipped roof with eaves trim
  const rh = 0.85;
  const roofM = new THREE.Mesh(meterHip(bw + 0.36, rh, bd + 0.36), surfaceMat('roof', d.roof, 1.8, 0.65));
  roofM.position.set(cx, y0 + H, cz);
  roofM.castShadow = roofM.receiveShadow = true;
  g.add(roofM);
  bx(g, bw + 0.4, 0.07, bd + 0.4, trim, cx, y0 + H - 0.04, cz);
  // dormers on the front slope
  for (const sx of [-0.62, 0.62]) {
    const dg = group(g, cx + sx, y0 + H + 0.18, fz - 0.05);
    bxT(dg, 0.34, 0.34, 0.4, 'siding', d.wall, 0, 0, 0, 2);
    roofT(dg, 0.44, 0.2, 0.5, d.roof, wall, 0, 0.34, 0, 0.05).rotation.y = Math.PI / 2;
    windowUnit(dg, 0, 0.06, 0.205, 0, shade(d.roof, 0.05), false);
  }
  // chimneys
  for (const sx of [-1, 1]) {
    const x = cx + sx * (bw / 2 - 0.3);
    bxT(g, 0.22, 0.95, 0.22, 'stone', '#b0624a', x, y0 + H + 0.1, cz - 0.2, 5);
    bx(g, 0.28, 0.06, 0.28, '#7d4536', x, y0 + H + 1.05, cz - 0.2);
  }
  const puffA = smoke(g, cx - bw / 2 + 0.3, y0 + H + 1.15, cz - 0.2);
  const puffB = smoke(g, cx + bw / 2 - 0.3, y0 + H + 1.15, cz - 0.2);
  // portico: columns, balcony with railing and a pediment
  const pz = fz + 0.42;
  bxT(g, 1.1, 0.08, 0.5, 'stone', '#d9d3c4', cx, y0, fz + 0.22, 3);
  for (let i = 0; i < 3; i++) bxT(g, 0.9 - i * 0.12, 0.05, 0.14, 'stone', '#cfc9b9', cx, y0 - 0.05 - i * 0.03 + 0.02, pz + 0.12 + i * 0.1, 4);
  for (const sx of [-0.45, -0.15, 0.15, 0.45]) {
    mk(g, cylGeo(0.045, 0.05, 14), M(trim), 1, H * 0.5 - 0.08, 1, cx + sx, y0 + 0.08 + (H * 0.5 - 0.08) / 2, pz);
    bx(g, 0.12, 0.05, 0.12, trim, cx + sx, y0 + 0.08, pz);
  }
  bxT(g, 1.15, 0.07, 0.58, 'planks', '#e9e2d2', cx, y0 + H * 0.5, fz + 0.24, 3);
  for (let i = 0; i <= 10; i++) cyl(g, 0.012, 0.012, 0.2, trim, cx - 0.52 + i * 0.104, y0 + H * 0.5 + 0.07, pz + 0.05, 5);
  bx(g, 1.1, 0.03, 0.04, trim, cx, y0 + H * 0.5 + 0.27, pz + 0.05);
  roofT(g, 0.34, 0.34, 1.12, d.roof, M(trim), cx, y0 + H - 0.03, fz + 0.14, 0).rotation.y = Math.PI / 2;
  // entrance door and balcony door
  const door = group(g, cx, y0, fz + 0.01);
  bxT(door, 0.36, H * 0.36, 0.04, 'boards', '#6b3a22', 0, 0, 0, 3);
  mk(door, G.dome, WIN, 0.18, 0.12, 0.03, 0, H * 0.36, 0.005).rotation.x = Math.PI / 2;
  bx(door, 0.44, 0.05, 0.05, trim, 0, H * 0.36, 0.01);
  ball(door, 0.02, '#e9c46a', 0.12, H * 0.18, 0.035);
  const bdoor = group(g, cx, y0 + H * 0.5 + 0.07, fz + 0.01);
  mk(bdoor, G.box, WIN, 0.3, H * 0.3, 0.03, 0, H * 0.15, 0);
  bx(bdoor, 0.36, 0.05, 0.05, trim, 0, H * 0.3, 0.01);
  // windows on both floors, front and right side
  for (const x of [-0.95, -0.55, 0.55, 0.95]) {
    windowUnit(g, cx + x, y0 + H * 0.12, fz + 0.01, 0, '#3f5f8a', Math.abs(x) > 0.9);
    windowUnit(g, cx + x, y0 + H * 0.62, fz + 0.01, 0, '#3f5f8a', false);
  }
  for (const z of [-0.35, 0.35]) {
    windowUnit(g, cx + bw / 2 + 0.01, y0 + H * 0.12, cz + z, Math.PI / 2, '#3f5f8a', false);
    windowUnit(g, cx + bw / 2 + 0.01, y0 + H * 0.62, cz + z, Math.PI / 2, '#3f5f8a', false);
  }
  // lanterns by the steps
  for (const sx of [-1, 1]) {
    const lx = cx + sx * 0.62;
    cyl(g, 0.02, 0.03, 0.55, '#2f2f2f', lx, y0, pz + 0.25, 6);
    mk(g, G.box, LAMP, 0.08, 0.1, 0.08, lx, y0 + 0.6, pz + 0.25);
    mk(g, cylGeo(0, 0.07, 4), M('#2f2f2f'), 1, 0.06, 1, lx, y0 + 0.68, pz + 0.25).rotation.y = Math.PI / 4;
  }
  groundGlow(g, cx, pz + 0.4, 2.4);
  // hedges, flower beds and a stepping stone path
  for (const sx of [-1, 1]) {
    for (let i = 0; i < 3; i++) mk(g, blobGeo(20 + i + (sx > 0 ? 3 : 0)), M(shade('#3f8a33', (i % 2) * 0.05)), 0.2, 0.17, 0.16, cx + sx * (0.85 + i * 0.3), 0.16, fz + 0.28);
    for (let i = 0; i < 5; i++) ball(g, 0.035, ['#ff6b8a', '#ffd23a', '#ffffff', '#b58cff', '#ff9f43'][(i + (sx > 0 ? 2 : 0)) % 5], cx + sx * (0.8 + i * 0.16), 0.08, fz + 0.52, 1, 0.8, 1, false);
  }
  for (let i = 0; i < 3; i++) {
    const st = mk(g, cylGeo(0.12, 0.13, 10), surfaceMat('stone', '#cfc8b8', 6), 1, 0.03, 1, cx + (i % 2 ? 0.05 : -0.05), 0.015, pz + 0.55 + i * 0.25, false);
    st.scale.z = 0.8;
  }
  // kennel for the dog in the front right corner
  const k = group(g, 2.62, 0, 2.55);
  k.rotation.y = -0.5;
  bxT(k, 0.34, 0.24, 0.3, 'boards', '#b5452c', 0, 0, 0, 4);
  roofT(k, 0.4, 0.16, 0.38, '#5d3a1f', surfaceMat('boards', '#b5452c', 4), 0, 0.24, 0, 0.03).rotation.y = Math.PI / 2;
  mk(k, G.dome, M('#2a1a10'), 0.08, 0.13, 0.02, 0, 0, 0.152).rotation.set(0, 0, 0);
  mk(k, cylGeo(0.06, 0.06, 12), M('#9aa3ab'), 1, 0.02, 1, 0.22, 0, 0.12);
  e.top = y0 + H + rh + 0.2;
  e.update = (_o, _now, t) => { puffA(true, t); puffB(true, t + 700); };
}

// ------------------------------------------------------------------ ambient life
// Butterflies over the grass, gulls circling above the shore, fish leaping in the sea and a
// sailboat drifting on the horizon. Purely cosmetic.

class Life {
  private butterflies: { g: THREE.Group; wings: THREE.Mesh[]; hx: number; hz: number; seed: number }[] = [];
  private gulls: { g: THREE.Group; wings: THREE.Object3D[]; cx: number; cz: number; r: number; h: number; sp: number; ph: number }[] = [];
  private fish: { g: THREE.Group; ring: THREE.Mesh; t: number; x: number; z: number; dir: number }[] = [];
  private sail: THREE.Group;
  private nextFish = 2;

  constructor(scene: THREE.Scene) {
    const wingMat = (c: string) => new THREE.MeshStandardMaterial({ color: c, side: THREE.DoubleSide, roughness: 0.6 });
    const wingGeo = new THREE.CircleGeometry(1, 10);
    wingGeo.translate(1, 0, 0);
    const colors = ['#ffd23a', '#ffffff', '#ff8fb0', '#8fd3ff', '#ff9f43', '#b58cff'];
    for (let i = 0; i < 14; i++) {
      const g = new THREE.Group();
      const wings: THREE.Mesh[] = [];
      for (const sx of [-1, 1]) {
        const w = new THREE.Mesh(wingGeo, wingMat(colors[i % colors.length]));
        w.scale.set(0.045 * sx, 0.035, 1);
        w.rotation.x = -Math.PI / 2;
        const pivot = new THREE.Group();
        pivot.add(w);
        g.add(pivot);
        wings.push(pivot as unknown as THREE.Mesh);
      }
      mk(g, G.ball, M('#3a2616'), 0.008, 0.008, 0.035, 0, 0, 0, false);
      scene.add(g);
      this.butterflies.push({ g, wings, hx: 0, hz: 0, seed: i * 7.3 });
    }
    for (let i = 0; i < 6; i++) {
      const g = new THREE.Group();
      mk(g, G.ball, M('#ffffff'), 0.05, 0.045, 0.13, 0, 0, 0);
      mk(g, G.ball, M('#ffffff'), 0.035, 0.035, 0.04, 0, 0.02, 0.11);
      mk(g, cylGeo(0, 0.012, 5), M('#f0a030'), 1, 0.05, 1, 0, 0.02, 0.16).rotation.x = Math.PI / 2;
      const wings: THREE.Object3D[] = [];
      for (const sx of [-1, 1]) {
        const p = group(g, sx * 0.03, 0.02, 0);
        const w = bx(p, 0.26, 0.012, 0.08, '#f2f2f2', sx * 0.13, 0, 0);
        bx(p, 0.08, 0.013, 0.08, '#3a3a3a', sx * 0.25, 0, 0).position.y = 0.0005;
        void w;
        wings.push(p);
      }
      const side = i % 4, t = 0.2 + (i / 6) * 0.6;
      const cx = side === 0 ? GRID * t : side === 1 ? GRID * t : side === 2 ? -3 : GRID + 3;
      const cz = side === 0 ? -3 : side === 1 ? GRID + 3 : GRID * t;
      scene.add(g);
      this.gulls.push({ g, wings, cx, cz, r: 2 + hash(i, 3) * 2.5, h: 4 + hash(i, 4) * 2.5, sp: 0.25 + hash(i, 5) * 0.2, ph: i * 1.7 });
    }
    for (let i = 0; i < 3; i++) {
      const g = fishModel(['#ff9a3c', '#8fb8d8', '#f2d16b'][i]);
      g.visible = false;
      const ring = splashRing();
      scene.add(g, ring);
      this.fish.push({ g, ring, t: 99, x: 0, z: 0, dir: 0 });
    }
    // sailboat far out at sea
    this.sail = new THREE.Group();
    const hull = mk(this.sail, G.dome, M('#f4efe6'), 0.35, 0.25, 0.9, 0, 0.1, 0);
    hull.rotation.x = Math.PI;
    bx(this.sail, 0.5, 0.05, 1.4, '#2e6da4', 0, 0.08, 0).scale.set(0.5, 1, 1);
    cyl(this.sail, 0.02, 0.025, 1.6, '#6b4226', 0, 0.1, 0.05, 6);
    const sailM = new THREE.Mesh(sailGeo(), new THREE.MeshStandardMaterial({ color: '#fffaf0', side: THREE.DoubleSide }));
    sailM.scale.set(1, 1.4, 0.7);
    sailM.position.set(0, 0.25, 0.08);
    this.sail.add(sailM);
    scene.add(this.sail);
  }

  update(dt: number, t: number, night: number, target: THREE.Vector3) {
    const day = night < 0.4;
    // butterflies flutter around home points near the view, respawning when left behind
    this.butterflies.forEach((b, i) => {
      b.g.visible = day;
      if (!day) return;
      if (Math.hypot(b.hx - target.x, b.hz - target.z) > 11 || (b.hx === 0 && b.hz === 0)) {
        b.hx = clamp(target.x + (Math.random() - 0.5) * 16, 1, GRID - 1);
        b.hz = clamp(target.z + (Math.random() - 0.5) * 16, 1, GRID - 1);
      }
      const k = t / 1000 + b.seed;
      const x = b.hx + Math.sin(k * 0.7) * 1.2 + Math.sin(k * 1.9) * 0.3;
      const z = b.hz + Math.cos(k * 0.55) * 1.2 + Math.cos(k * 2.3) * 0.3;
      const y = 0.45 + Math.sin(k * 3.1) * 0.15 + Math.sin(k * 0.9) * 0.1;
      const px = b.g.position.x, pz = b.g.position.z;
      b.g.position.set(x, y, z);
      b.g.rotation.y = Math.atan2(x - px, z - pz);
      const flap = Math.sin(t / 45 + i) * 1.1;
      b.wings[0].rotation.z = flap;
      b.wings[1].rotation.z = -flap;
    });
    // gulls glide in wide circles, flapping now and then
    this.gulls.forEach((gl) => {
      const a = (t / 1000) * gl.sp + gl.ph;
      gl.g.position.set(gl.cx + Math.cos(a) * gl.r, gl.h + Math.sin(a * 2) * 0.3, gl.cz + Math.sin(a) * gl.r);
      gl.g.rotation.set(0, -a, 0.35);
      const flap = Math.sin(t / 1500 + gl.ph) > 0.3 ? Math.sin(t / 90 + gl.ph) * 0.6 : 0.08;
      gl.wings[0].rotation.z = flap;
      gl.wings[1].rotation.z = -flap;
    });
    // now and then a fish leaps out of the sea near the shore in view
    this.nextFish -= dt;
    if (this.nextFish <= 0) {
      this.nextFish = 1.5 + Math.random() * 3;
      const f = this.fish.find((x) => x.t > 1.2);
      if (f) {
        const side = Math.floor(Math.random() * 4);
        const along = clamp((side < 2 ? target.x : target.z) + (Math.random() - 0.5) * 14, 0, GRID);
        const out = 1.4 + Math.random() * 4;
        f.x = side === 2 ? -out : side === 3 ? GRID + out : along;
        f.z = side === 0 ? -out : side === 1 ? GRID + out : along;
        f.dir = Math.random() * Math.PI * 2;
        f.t = 0;
      }
    }
    for (const f of this.fish) {
      f.t += dt;
      const k = f.t / 0.8;
      f.g.visible = k < 1;
      if (k < 1) {
        const dx = Math.sin(f.dir), dz = Math.cos(f.dir);
        f.g.position.set(f.x + dx * (k - 0.5) * 0.9, -0.55 + Math.sin(k * Math.PI) * 0.6, f.z + dz * (k - 0.5) * 0.9);
        f.g.rotation.set(0, f.dir, 0);
        f.g.rotateX(-Math.cos(k * Math.PI) * 1.2);
      }
      const rk = f.t / 1.2;
      const m = f.ring.material as THREE.MeshBasicMaterial;
      m.opacity = rk < 1 ? (1 - rk) * 0.7 : 0;
      f.ring.visible = rk < 1;
      f.ring.position.set(f.x + Math.sin(f.dir) * 0.45, -0.53, f.z + Math.cos(f.dir) * 0.45);
      f.ring.scale.setScalar(0.08 + rk * 0.45);
    }
    // the sailboat circles the island far out
    const a = t / 90000;
    const R = GRID / 2 + 16;
    this.sail.position.set(GRID / 2 + Math.cos(a) * R, -0.5 + Math.sin(t / 900) * 0.03, GRID / 2 + Math.sin(a) * R);
    this.sail.rotation.set(Math.sin(t / 1300) * 0.03, -a, Math.sin(t / 1100) * 0.04);
  }
}
