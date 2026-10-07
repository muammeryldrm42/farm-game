// Procedural surface textures. Every texture is painted pixel by pixel at runtime (texpaint.ts):
// an albedo map (kept close to white so the material color still tints it) and a tangent space
// normal map derived from a height field. Everything tiles seamlessly.
import * as THREE from 'three';
import { h2, paintSurface, type SurfaceKind, type SurfacePixels } from './texpaint';

export type { SurfaceKind };
// ------------------------------------------------------------------ texture building

export interface Surface { map: THREE.Texture; normalMap: THREE.Texture }

const cache = new Map<SurfaceKind, Surface>();
// every texture made for a surface (the base pair and the scaled copies materials use), so all of
// them refresh when its pixels arrive
const users = new Map<SurfaceKind, THREE.Texture[]>();

function blank(rgba: number[]) {
  const t = new THREE.DataTexture(new Uint8Array(rgba), 1, 1);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.magFilter = THREE.LinearFilter;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  t.generateMipmaps = true;
  t.anisotropy = 8;
  t.needsUpdate = true;
  return t;
}

function fill(kind: SurfaceKind, px: SurfacePixels) {
  const s = cache.get(kind);
  if (!s) return;
  s.map.image = { data: px.albedo, width: px.size, height: px.size };
  s.normalMap.image = { data: px.normal, width: px.size, height: px.size };
  for (const t of users.get(kind) ?? []) t.needsUpdate = true;
}

// The pixels are painted in a background worker so the start up never waits on them (they take
// seconds on a phone); until they arrive a surface shows its plain tint. Without workers they are
// painted right here.
let pool: Worker[] | null = null;
let next = 0;
function workers() {
  if (pool) return pool;
  pool = [];
  try {
    const n = Math.max(1, Math.min(3, (navigator.hardwareConcurrency ?? 2) - 1));
    for (let i = 0; i < n; i++) {
      const w = new Worker(new URL('./texpaint.worker.ts', import.meta.url));
      w.onmessage = (e: MessageEvent<{ kind: SurfaceKind } & SurfacePixels>) => fill(e.data.kind, e.data);
      pool.push(w);
    }
  } catch { pool = []; }
  return pool;
}
const pending = new Set<SurfaceKind>();
export const surfacesReady = () => pending.size === 0;

function build(kind: SurfaceKind): Surface {
  const map = blank([255, 255, 255, 255]);
  map.colorSpace = THREE.SRGBColorSpace;
  const normalMap = blank([128, 128, 255, 255]);
  const s = { map, normalMap };
  cache.set(kind, s);
  users.set(kind, [map, normalMap]);
  const pool = workers();
  if (pool.length) {
    pending.add(kind);
    const w = pool[next++ % pool.length];
    const done = (e: MessageEvent<{ kind: SurfaceKind }>) => { if (e.data.kind === kind) { pending.delete(kind); w.removeEventListener('message', done); } };
    w.addEventListener('message', done);
    w.postMessage(kind);
  } else fill(kind, paintSurface(kind));
  return s;
}

export function surface(kind: SurfaceKind): Surface {
  return cache.get(kind) ?? build(kind);
}

// A tinted, textured standard material. Geometry UVs are expected in meters; `scale` is how many
// texture repeats fit in one meter.
const matCache = new Map<string, THREE.MeshStandardMaterial>();
export function surfaceMat(kind: SurfaceKind, color: string, scale = 1, rough = 0.85, normalScale = 1, scaleY = scale) {
  const key = `${kind}|${color}|${scale}|${scaleY}|${rough}|${normalScale}`;
  let m = matCache.get(key);
  if (m) return m;
  const base = surface(kind);
  let map = base.map, normalMap = base.normalMap;
  if (scale !== 1 || scaleY !== 1) {
    map = base.map.clone(); map.repeat.set(scale, scaleY); map.needsUpdate = true;
    normalMap = base.normalMap.clone(); normalMap.repeat.set(scale, scaleY); normalMap.needsUpdate = true;
    users.get(kind)?.push(map, normalMap);
  }
  m = new THREE.MeshStandardMaterial({ color, map, normalMap, roughness: rough, metalness: 0 });
  m.normalScale.set(normalScale, normalScale);
  matCache.set(key, m);
  return m;
}

// ------------------------------------------------------------------ geometry with UVs in meters

const boxCache = new Map<string, THREE.BoxGeometry>();
// A box of real size with every face's UVs measured in meters, so textures keep the same density
// no matter how big the box is.
export function meterBox(w: number, h: number, d: number) {
  const key = `${w.toFixed(3)}|${h.toFixed(3)}|${d.toFixed(3)}`;
  let g = boxCache.get(key);
  if (g) return g;
  g = new THREE.BoxGeometry(w, h, d);
  const uv = g.getAttribute('uv') as THREE.BufferAttribute;
  // face order: +x, -x, +y, -y, +z, -z with 4 vertices each
  const dims: [number, number][] = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) for (let k = 0; k < 4; k++) {
    const i = f * 4 + k;
    uv.setXY(i, uv.getX(i) * dims[f][0], uv.getY(i) * dims[f][1]);
  }
  uv.needsUpdate = true;
  boxCache.set(key, g);
  return g;
}

const roofCache = new Map<string, THREE.BufferGeometry>();
// Gable roof of real size with the base centered at the origin. Slopes get UVs that run down the
// slope, so tile rows stay horizontal.
// Material group 0 is the two slopes, group 1 the gable ends, pulled in by `inset` so they line up
// with the wall below the eaves.
export function meterRoof(w: number, h: number, d: number, inset = 0) {
  const key = `${w.toFixed(3)}|${h.toFixed(3)}|${d.toFixed(3)}|${inset.toFixed(3)}`;
  let g = roofCache.get(key);
  if (g) return g;
  const hw = w / 2, hd = d / 2;
  const slope = Math.hypot(hd, h);
  const pos: number[] = [];
  const uvs: number[] = [];
  const quad = (a: number[], b: number[], c: number[], e: number[], ua: number[], ub: number[], uc: number[], ue: number[]) => {
    pos.push(...a, ...b, ...c, ...a, ...c, ...e);
    uvs.push(...ua, ...ub, ...uc, ...ua, ...uc, ...ue);
  };
  // front slope (+z) and back slope (-z)
  quad([-hw, 0, hd], [hw, 0, hd], [hw, h, 0], [-hw, h, 0], [0, 0], [w, 0], [w, slope], [0, slope]);
  quad([hw, 0, -hd], [-hw, 0, -hd], [-hw, h, 0], [hw, h, 0], [0, 0], [w, 0], [w, slope], [0, slope]);
  // gable ends
  const gx = hw - inset;
  pos.push(gx, 0, hd, gx, 0, -hd, gx, h, 0);
  uvs.push(0, 0, d, 0, d / 2, h);
  pos.push(-gx, 0, -hd, -gx, 0, hd, -gx, h, 0);
  uvs.push(0, 0, d, 0, d / 2, h);
  g = new THREE.BufferGeometry();
  g.addGroup(0, 12, 0);
  g.addGroup(12, 6, 1);
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  g.computeVertexNormals();
  roofCache.set(key, g);
  return g;
}

const hipCache = new Map<string, THREE.BufferGeometry>();
// Hip roof: four slopes rising to a short ridge along x, base centered at the origin, UVs in meters.
export function meterHip(w: number, h: number, d: number) {
  const key = `${w.toFixed(3)}|${h.toFixed(3)}|${d.toFixed(3)}`;
  let g = hipCache.get(key);
  if (g) return g;
  const hw = w / 2, hd = d / 2, rx = Math.max(0.01, hw - hd);
  const sl = Math.hypot(hd, h);
  const pos: number[] = [], uvs: number[] = [];
  const tri = (a: number[], b: number[], c: number[], ua: number[], ub: number[], uc: number[]) => { pos.push(...a, ...b, ...c); uvs.push(...ua, ...ub, ...uc); };
  // front and back trapezoids
  tri([-hw, 0, hd], [hw, 0, hd], [rx, h, 0], [0, 0], [w, 0], [hw + rx, sl]);
  tri([-hw, 0, hd], [rx, h, 0], [-rx, h, 0], [0, 0], [hw + rx, sl], [hw - rx, sl]);
  tri([hw, 0, -hd], [-hw, 0, -hd], [-rx, h, 0], [0, 0], [w, 0], [hw + rx, sl]);
  tri([hw, 0, -hd], [-rx, h, 0], [rx, h, 0], [0, 0], [hw + rx, sl], [hw - rx, sl]);
  // hipped ends
  const el = Math.hypot(hw - rx, h);
  tri([hw, 0, hd], [hw, 0, -hd], [rx, h, 0], [0, 0], [d, 0], [hd, el]);
  tri([-hw, 0, -hd], [-hw, 0, hd], [-rx, h, 0], [0, 0], [d, 0], [hd, el]);
  g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  g.computeVertexNormals();
  hipCache.set(key, g);
  return g;
}

// ------------------------------------------------------------------ foliage cards

function canvasOf(size: number) {
  const cv = document.createElement('canvas');
  cv.width = size; cv.height = size;
  return cv;
}

let leafTexCache: THREE.Texture | null = null;
// a cluster of painted leaves on a transparent background, used on tree crown cards
export function leafTexture() {
  if (leafTexCache) return leafTexCache;
  const S = 256;
  const cv = canvasOf(S);
  const c = cv.getContext('2d') as CanvasRenderingContext2D;
  const rnd = (i: number, s: number) => h2(i, s, 777);
  for (let i = 0; i < 26; i++) {
    const x = 30 + rnd(i, 1) * (S - 60), y = 30 + rnd(i, 2) * (S - 60);
    const a = rnd(i, 3) * Math.PI * 2, len = 34 + rnd(i, 4) * 26, w = len * 0.42;
    c.save();
    c.translate(x, y);
    c.rotate(a);
    const tone = 170 + Math.floor(rnd(i, 5) * 70);
    const g = c.createLinearGradient(0, -w, 0, w);
    g.addColorStop(0, `rgb(${tone - 40},${tone},${tone - 70})`);
    g.addColorStop(0.5, `rgb(${tone},${Math.min(255, tone + 30)},${tone - 40})`);
    g.addColorStop(1, `rgb(${tone - 60},${tone - 20},${tone - 90})`);
    c.fillStyle = g;
    c.beginPath();
    c.moveTo(-len / 2, 0);
    c.bezierCurveTo(-len / 4, -w, len / 4, -w, len / 2, 0);
    c.bezierCurveTo(len / 4, w, -len / 4, w, -len / 2, 0);
    c.fill();
    c.strokeStyle = `rgba(255,255,230,0.35)`;
    c.lineWidth = 1.5;
    c.beginPath(); c.moveTo(-len / 2, 0); c.lineTo(len / 2, 0); c.stroke();
    c.restore();
  }
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  leafTexCache = t;
  return t;
}

const shellCache = new Map<number, THREE.BufferGeometry>();
// Leaf cards scattered over a unit sphere, each facing outward, with normals pointing away from the
// center so the whole crown shades like one soft volume while its edge breaks up into leaves.
export function leafShell(seed: number, count = 70) {
  const k = seed * 1000 + count;
  let g = shellCache.get(k);
  if (g) return g;
  const pos: number[] = [], nor: number[] = [], uv: number[] = [], col: number[] = [];
  const v = new THREE.Vector3(), t1 = new THREE.Vector3(), t2 = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
  for (let i = 0; i < count; i++) {
    // fibonacci sphere keeps the cards evenly spread
    const y = 1 - ((i + 0.5) / count) * 2 * 0.95;
    const r = Math.sqrt(1 - y * y), a = i * 2.39996 + seed;
    v.set(Math.cos(a) * r, y, Math.sin(a) * r);
    const d = 0.92 + h2(i, seed, 5) * 0.16;
    const c = v.clone().multiplyScalar(d);
    t1.crossVectors(v, Math.abs(v.y) > 0.9 ? new THREE.Vector3(1, 0, 0) : up).normalize();
    t2.crossVectors(v, t1).normalize();
    const rot = h2(i, seed, 6) * Math.PI * 2;
    const a1 = t1.clone().multiplyScalar(Math.cos(rot)).add(t2.clone().multiplyScalar(Math.sin(rot)));
    const a2 = v.clone().cross(a1).normalize();
    const s = 0.42 + h2(i, seed, 7) * 0.18;
    // tilt the card a little off the surface so the crown edge looks ragged
    const tilt = v.clone().multiplyScalar(0.25);
    const corners = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
    const base = pos.length / 3;
    const shade = 0.75 + (y * 0.5 + 0.5) * 0.35;
    for (const [cx, cy] of corners) {
      const p = c.clone().add(a1.clone().multiplyScalar(cx * s)).add(a2.clone().multiplyScalar(cy * s)).add(tilt.clone().multiplyScalar(cy * s));
      pos.push(p.x, p.y, p.z);
      const n = p.clone().normalize();
      nor.push(n.x, n.y, n.z);
      uv.push((cx + 1) / 2, (cy + 1) / 2);
      col.push(shade, shade, shade);
    }
    void base;
  }
  const idx: number[] = [];
  for (let i = 0; i < count; i++) { const b = i * 4; idx.push(b, b + 1, b + 2, b, b + 2, b + 3); }
  g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx);
  shellCache.set(k, g);
  return g;
}
