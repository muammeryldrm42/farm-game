// Procedural surface textures. Every texture is painted pixel by pixel into a canvas at runtime:
// an albedo map (kept close to white so the material color still tints it) and a tangent space
// normal map derived from a height field. Everything tiles seamlessly.
import * as THREE from 'three';

export type SurfaceKind = 'roof' | 'boards' | 'planks' | 'siding' | 'stone' | 'grass' | 'soil' | 'bark' | 'sand' | 'metal' | 'thatch';

// ------------------------------------------------------------------ tileable noise

function h2(x: number, y: number, s: number) {
  let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul(s | 0, 1442695041);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

const wrap = (v: number, p: number) => ((v % p) + p) % p;
const smooth = (t: number) => t * t * (3 - 2 * t);
const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

// value noise on a lattice of `p` cells that wraps, so u,v in [0,1) tiles
function vnoise(u: number, v: number, p: number, s: number) {
  const x = u * p, y = v * p;
  const x0 = Math.floor(x), y0 = Math.floor(y);
  const fx = smooth(x - x0), fy = smooth(y - y0);
  const a = h2(wrap(x0, p), wrap(y0, p), s), b = h2(wrap(x0 + 1, p), wrap(y0, p), s);
  const c = h2(wrap(x0, p), wrap(y0 + 1, p), s), d = h2(wrap(x0 + 1, p), wrap(y0 + 1, p), s);
  return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
}

function fbm(u: number, v: number, p: number, s: number, oct = 4) {
  let sum = 0, amp = 0.5, norm = 0;
  for (let i = 0; i < oct; i++) {
    sum += vnoise(u, v, p << i, s + i * 17) * amp;
    norm += amp;
    amp *= 0.5;
  }
  return sum / norm;
}

// cellular noise: distance to the nearest and second nearest feature point, tiled
function cells(u: number, v: number, p: number, s: number) {
  const x = u * p, y = v * p;
  const xi = Math.floor(x), yi = Math.floor(y);
  let d1 = 9, d2 = 9, id = 0;
  for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) {
    const cx = xi + i, cy = yi + j;
    const wx = wrap(cx, p), wy = wrap(cy, p);
    const px = cx + 0.15 + h2(wx, wy, s) * 0.7, py = cy + 0.15 + h2(wx, wy, s + 1) * 0.7;
    const d = Math.hypot(px - x, py - y);
    if (d < d1) { d2 = d1; d1 = d; id = wy * p + wx; } else if (d < d2) d2 = d;
  }
  return { d1, d2, id };
}

// ------------------------------------------------------------------ painters
// Each painter returns albedo rgb (0..1) and a height (0..1) for a texel at u,v.

type Px = [number, number, number, number];
type Painter = (u: number, v: number, o: Px) => void;

const grey = (o: Px, k: number, h: number) => { o[0] = k; o[1] = k; o[2] = k; o[3] = h; };

const PAINT: Record<SurfaceKind, { size: number; bump: number; paint: Painter }> = {
  // overlapping clay tiles in staggered rows, 4 x 4 tiles per texture
  roof: {
    size: 512, bump: 5,
    paint(u, v, o) {
      const rows = 4, cols = 4;
      const ry = v * rows, row = Math.floor(ry), fy = ry - row;
      const rx = u * cols + (row % 2) * 0.5, col = Math.floor(rx), fx = rx - col;
      const tone = 0.82 + h2(wrap(col, cols), row, 3) * 0.18;
      // tiles are rounded across their width and thicker toward the lower edge
      const across = Math.sin(fx * Math.PI);
      const edge = fx < 0.04 || fx > 0.96 ? 0 : 1;
      const lip = fy < 0.1 ? fy / 0.1 : 1;
      const grain = fbm(u, v, 8, 7, 3) * 0.12;
      const h = (0.35 + 0.45 * Math.pow(across, 0.6) * (0.55 + 0.45 * (1 - fy))) * edge * lip + grain * 0.3;
      const k = tone * (0.72 + 0.28 * across) * (edge ? 1 : 0.55) * (fy < 0.06 ? 0.62 : 1) - grain * 0.3;
      o[0] = k; o[1] = k * 0.97; o[2] = k * 0.95; o[3] = h;
    },
  },
  // vertical boards with grain, used on barn walls
  boards: {
    size: 512, bump: 4,
    paint(u, v, o) {
      const n = 6, bu = u * n, b = Math.floor(bu), f = bu - b;
      const gap = f < 0.05 || f > 0.97;
      const grain = fbm(u * 1 + h2(b, 1, 5) * 0.3, v, 4, 11 + b, 3);
      const streak = Math.sin((f * 5 + grain * 7 + h2(b, 2, 5) * 6) * Math.PI) * 0.5 + 0.5;
      const knot = cells(u, v, 3, 40 + b).d1 < 0.08 ? 0.75 : 1;
      const tone = (0.8 + h2(b, 3, 5) * 0.2) * (0.86 + streak * 0.14) * knot;
      grey(o, gap ? 0.45 : tone, gap ? 0.1 : 0.7 + streak * 0.08 - grain * 0.1);
    },
  },
  // horizontal deck planks with nails
  planks: {
    size: 512, bump: 4,
    paint(u, v, o) {
      const n = 5, bv = v * n, b = Math.floor(bv), f = bv - b;
      const gap = f < 0.06;
      const seam = wrap(u * 2 + h2(b, 1, 9), 1);
      const grain = fbm(u, v * 1.2, 4, 21 + b, 3);
      const streak = Math.sin((f * 4 + grain * 8) * Math.PI) * 0.5 + 0.5;
      const nail = (Math.hypot((seam - 0.03) * 8, (f - 0.3) * 1.6) < 0.09 || Math.hypot((seam - 0.03) * 8, (f - 0.75) * 1.6) < 0.09);
      const tone = (0.78 + h2(b, 3, 9) * 0.22) * (0.86 + streak * 0.14) * (seam < 0.012 ? 0.6 : 1);
      if (nail) { grey(o, 0.35, 0.9); return; }
      grey(o, gap ? 0.4 : tone, gap ? 0.05 : 0.7 + streak * 0.06);
    },
  },
  // painted clapboard siding, 8 boards per texture
  siding: {
    size: 512, bump: 6,
    paint(u, v, o) {
      const n = 8, bv = v * n, f = bv - Math.floor(bv);
      const paint = fbm(u, v, 8, 31, 3);
      // each board leans outward toward its lower edge, leaving a shadow line
      const h = 0.25 + 0.6 * (1 - f);
      const k = (f > 0.9 ? 0.68 : 0.93 + 0.07 * (1 - f)) - paint * 0.08;
      grey(o, k, h + paint * 0.05);
    },
  },
  // fieldstone with mortar
  stone: {
    size: 512, bump: 7,
    paint(u, v, o) {
      const c = cells(u, v, 6, 51);
      const edge = c.d2 - c.d1;
      const mortar = edge < 0.07;
      const rough = fbm(u, v, 8, 53, 4);
      const tone = 0.72 + h2(c.id, 1, 57) * 0.26;
      const bulge = Math.min(1, edge * 3.2);
      if (mortar) { grey(o, 0.62 + rough * 0.1, 0.08 + rough * 0.05); return; }
      const k = tone - rough * 0.16;
      o[0] = k; o[1] = k * 0.98; o[2] = k * 0.95; o[3] = 0.3 + bulge * 0.55 + rough * 0.15;
    },
  },
  // soft lawn: speckles of lighter and darker blades
  grass: {
    size: 512, bump: 2.5,
    paint(u, v, o) {
      const big = fbm(u, v, 4, 61, 3);
      const fine = vnoise(u, v, 128, 63);
      const blade = vnoise(u * 1.0, v * 0.25, 256, 65);
      const k = 0.78 + big * 0.2 + (fine - 0.5) * 0.12 + (blade - 0.5) * 0.1;
      o[0] = k * 0.96; o[1] = k; o[2] = k * 0.9; o[3] = fine * 0.6 + blade * 0.4;
    },
  },
  // tilled soil with small clods
  soil: {
    size: 512, bump: 6,
    paint(u, v, o) {
      const c = cells(u, v, 14, 71);
      const clod = Math.max(0, 1 - c.d1 * 2.2);
      const n = fbm(u, v, 8, 73, 4);
      const k = 0.7 + n * 0.25 + clod * 0.1 - (h2(c.id, 2, 71) < 0.08 ? 0.15 : 0);
      o[0] = k; o[1] = k * 0.96; o[2] = k * 0.92; o[3] = clod * 0.6 + n * 0.4;
    },
  },
  // vertical bark ridges
  bark: {
    size: 512, bump: 7,
    paint(u, v, o) {
      const n = fbm(u, v * 0.25, 8, 81, 4);
      const ridge = Math.abs(Math.sin((u * 10 + n * 2.5) * Math.PI));
      const k = 0.6 + ridge * 0.35 + n * 0.1;
      grey(o, k, ridge * 0.8 + n * 0.2);
    },
  },
  sand: {
    size: 512, bump: 2,
    paint(u, v, o) {
      const n = fbm(u, v, 8, 91, 4);
      const g = h2(Math.floor(u * 256), Math.floor(v * 256), 93);
      const ripple = Math.sin((v * 12 + n * 3) * Math.PI * 2) * 0.5 + 0.5;
      const k = 0.88 + n * 0.1 + (g - 0.5) * 0.08;
      o[0] = k; o[1] = k * 0.98; o[2] = k * 0.94; o[3] = ripple * 0.4 + n * 0.4 + g * 0.2;
    },
  },
  // corrugated sheet metal with a bit of wear
  metal: {
    size: 512, bump: 5,
    paint(u, v, o) {
      const rib = Math.sin(u * 16 * Math.PI * 2) * 0.5 + 0.5;
      const wear = fbm(u, v, 6, 101, 4);
      const k = 0.8 + rib * 0.15 - (wear > 0.62 ? (wear - 0.62) * 0.8 : 0);
      grey(o, k, rib);
    },
  },
  // straw bundles for hay and thatch
  thatch: {
    size: 512, bump: 5,
    paint(u, v, o) {
      const n = vnoise(u * 1.0, v * 0.1, 96, 111);
      const m = vnoise(u, v * 0.2, 48, 113);
      const k = 0.72 + n * 0.22 + m * 0.08;
      o[0] = k; o[1] = k * 0.96; o[2] = k * 0.86; o[3] = n * 0.7 + m * 0.3;
    },
  },
};

// ------------------------------------------------------------------ texture building

export interface Surface { map: THREE.Texture; normalMap: THREE.Texture }

const cache = new Map<SurfaceKind, Surface>();

function canvasOf(size: number) {
  const cv = document.createElement('canvas');
  cv.width = size; cv.height = size;
  return cv;
}

function build(kind: SurfaceKind): Surface {
  const { size, bump, paint } = PAINT[kind];
  const heights = new Float32Array(size * size);
  const albedo = canvasOf(size);
  const ac = albedo.getContext('2d') as CanvasRenderingContext2D;
  const aImg = ac.createImageData(size, size);
  const px: Px = [0, 0, 0, 0];
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    paint((x + 0.5) / size, (y + 0.5) / size, px);
    const i = y * size + x;
    heights[i] = px[3];
    aImg.data[i * 4] = clamp01(px[0]) * 255;
    aImg.data[i * 4 + 1] = clamp01(px[1]) * 255;
    aImg.data[i * 4 + 2] = clamp01(px[2]) * 255;
    aImg.data[i * 4 + 3] = 255;
  }
  ac.putImageData(aImg, 0, 0);

  // normal map from the height field with a wrapped Sobel filter
  const normal = canvasOf(size);
  const nc = normal.getContext('2d') as CanvasRenderingContext2D;
  const nImg = nc.createImageData(size, size);
  const H = (x: number, y: number) => heights[wrap(y, size) * size + wrap(x, size)];
  const k = bump * (size / 256);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const dx = (H(x + 1, y - 1) + 2 * H(x + 1, y) + H(x + 1, y + 1)) - (H(x - 1, y - 1) + 2 * H(x - 1, y) + H(x - 1, y + 1));
    const dy = (H(x - 1, y + 1) + 2 * H(x, y + 1) + H(x + 1, y + 1)) - (H(x - 1, y - 1) + 2 * H(x, y - 1) + H(x + 1, y - 1));
    // canvas rows grow downward while texture v grows upward, so dy keeps its sign
    let nx = -dx * k * 0.125, ny = dy * k * 0.125, nz = 1;
    const l = Math.hypot(nx, ny, nz);
    nx /= l; ny /= l; nz /= l;
    const i = (y * size + x) * 4;
    nImg.data[i] = (nx * 0.5 + 0.5) * 255;
    nImg.data[i + 1] = (ny * 0.5 + 0.5) * 255;
    nImg.data[i + 2] = (nz * 0.5 + 0.5) * 255;
    nImg.data[i + 3] = 255;
  }
  nc.putImageData(nImg, 0, 0);

  const map = new THREE.CanvasTexture(albedo);
  map.colorSpace = THREE.SRGBColorSpace;
  const normalMap = new THREE.CanvasTexture(normal);
  for (const t of [map, normalMap]) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.anisotropy = 8;
    t.generateMipmaps = true;
  }
  return { map, normalMap };
}

export function surface(kind: SurfaceKind): Surface {
  let s = cache.get(kind);
  if (!s) { s = build(kind); cache.set(kind, s); }
  return s;
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
