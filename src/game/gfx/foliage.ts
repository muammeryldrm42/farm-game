// Instanced grass tufts and wild flowers that sway in the wind. The sway runs in the vertex
// shader, so thousands of blades cost one draw call per layer.
import * as THREE from 'three';
import { toonCrown } from './toon';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { U } from './shared';

const rnd = (i: number, s: number) => {
  let h = Math.imul(i | 0, 374761393) ^ Math.imul(s | 0, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
};

// Bends a material in the wind. Vertices move more the higher they are above `height` zero,
// and gusts roll across the world so neighbours move together.
export function windify<T extends THREE.Material>(m: T, height: number, amount = 1): T {
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = U.time;
    sh.uniforms.uWind = U.wind;
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nuniform float uTime;\nuniform float uWind;')
      .replace('#include <begin_vertex>', /* glsl */ `
#include <begin_vertex>
{
  vec4 wo = modelMatrix * vec4(0.0, 0.0, 0.0, 1.0);
  #ifdef USE_INSTANCING
  wo = modelMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
  #endif
  float k = clamp(position.y / ${height.toFixed(3)}, 0.0, 1.0);
  k *= k;
  float gust = sin(uTime * 1.3 + wo.x * 0.35 + wo.z * 0.22) * 0.5 + 0.5;
  float sway = sin(uTime * 2.6 + wo.x * 1.7 + wo.z * 1.3) * 0.35 + gust * 0.9;
  float side = sin(uTime * 3.4 + wo.z * 2.1) * 0.25;
  transformed.x += sway * k * ${(0.06 * amount).toFixed(3)} * uWind;
  transformed.z += side * k * ${(0.05 * amount).toFixed(3)} * uWind;
  transformed.y -= abs(sway) * k * ${(0.015 * amount).toFixed(3)} * uWind;
}
`);
  };
  // grass is lit like the lawn from both sides, so back faces must not flip their normal
  const vs = m.onBeforeCompile;
  m.onBeforeCompile = (sh, r) => {
    vs(sh, r);
    sh.fragmentShader = sh.fragmentShader.replace('#include <normal_fragment_begin>', '#include <normal_fragment_begin>\nnormal = normalize(vNormal);');
  };
  m.customProgramCacheKey = () => `wind${height}|${amount}`;
  return m;
}

// one tuft: a handful of curved blades, darker at the root, with colors baked in vertex colors
function tuftGeometry(seed: number) {
  const parts: THREE.BufferGeometry[] = [];
  const blades = 7;
  const root = new THREE.Color('#58a02e'), tip = new THREE.Color('#9ad650');
  for (let b = 0; b < blades; b++) {
    const a = rnd(b, seed) * Math.PI * 2;
    const r = rnd(b, seed + 1) * 0.07;
    const h = 0.09 + rnd(b, seed + 2) * 0.1;
    const lean = 0.03 + rnd(b, seed + 3) * 0.06;
    const w = 0.03 + rnd(b, seed + 4) * 0.015;
    const ox = Math.cos(a) * r, oz = Math.sin(a) * r;
    const face = rnd(b, seed + 5) * Math.PI;
    const fx = Math.cos(face), fz = Math.sin(face);
    const segs = 3;
    const pos: number[] = [], col: number[] = [], idx: number[] = [];
    for (let s = 0; s <= segs; s++) {
      const t = s / segs;
      const y = h * t;
      const bend = lean * t * t;
      const hw = (w / 2) * (1 - t * 0.92);
      const cx = ox + Math.cos(a) * bend, cz = oz + Math.sin(a) * bend;
      pos.push(cx - fx * hw, y, cz - fz * hw, cx + fx * hw, y, cz + fz * hw);
      const c = root.clone().lerp(tip, t);
      col.push(c.r, c.g, c.b, c.r, c.g, c.b);
      if (s < segs) { const i = s * 2; idx.push(i, i + 1, i + 2, i + 1, i + 3, i + 2); }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    g.setIndex(idx);
    parts.push(g);
  }
  const g = mergeGeometries(parts) as THREE.BufferGeometry;
  // normals point up so the blades catch light like the lawn below them
  const n = new Float32Array((g.getAttribute('position') as THREE.BufferAttribute).count * 3);
  for (let i = 0; i < n.length; i += 3) { n[i] = 0; n[i + 1] = 1; n[i + 2] = 0; }
  g.setAttribute('normal', new THREE.BufferAttribute(n, 3));
  return g;
}

export interface Spot { x: number; z: number; open: boolean }

// One map wide instanced batch drawn a block of land at a time. A plain batch is drawn whole
// whenever any bit of it is on screen; here the instances are sorted into square blocks and only
// the blocks in view are packed to the front and drawn, still in a single draw call. The packing
// is redone only when the set of blocks in view changes.
export class BlockBatch {
  private src: Float32Array;
  private srcCol: Float32Array | null;
  private blocks: { start: number; n: number; sphere: THREE.Sphere }[] = [];
  private shown: Uint8Array;

  constructor(readonly mesh: THREE.InstancedMesh, size = 12) {
    const n = mesh.count, a = mesh.instanceMatrix.array as Float32Array;
    const col = mesh.instanceColor ? (mesh.instanceColor.array as Float32Array) : null;
    const key = (i: number) => (Math.floor(a[i * 16 + 12] / size) + 64) * 256 + Math.floor(a[i * 16 + 14] / size) + 64;
    const order = Array.from({ length: n }, (_, i) => i).sort((x, y) => key(x) - key(y));
    this.src = new Float32Array(n * 16);
    this.srcCol = col ? new Float32Array(n * 3) : null;
    const g = mesh.geometry;
    if (!g.boundingSphere) g.computeBoundingSphere();
    const r0 = g.boundingSphere!.radius + g.boundingSphere!.center.length();
    const box = new THREE.Box3(), p = new THREE.Vector3();
    let start = 0, reach = 0;
    order.forEach((from, i) => {
      this.src.set(a.subarray(from * 16, from * 16 + 16), i * 16);
      if (col && this.srcCol) this.srcCol.set(col.subarray(from * 3, from * 3 + 3), i * 3);
      const e = a.subarray(from * 16, from * 16 + 16);
      reach = Math.max(reach, Math.hypot(e[0], e[1], e[2]), Math.hypot(e[4], e[5], e[6]), Math.hypot(e[8], e[9], e[10]));
      box.expandByPoint(p.set(e[12], e[13], e[14]));
      if (i === n - 1 || key(order[i + 1]) !== key(from)) {
        const sphere = box.getBoundingSphere(new THREE.Sphere());
        sphere.radius += r0 * reach;
        this.blocks.push({ start, n: i + 1 - start, sphere });
        start = i + 1; reach = 0; box.makeEmpty();
      }
    });
    this.shown = new Uint8Array(this.blocks.length);
    (mesh.instanceMatrix.array as Float32Array).set(this.src);
    if (col && this.srcCol) col.set(this.srcCol);
    this.shown.fill(1);
    // the blocks are culled here, so the batch as a whole never is
    mesh.frustumCulled = false;
  }

  cull(view: THREE.Frustum) {
    const blocks = this.blocks;
    let changed = false;
    for (let b = 0; b < blocks.length; b++) {
      const on = view.intersectsSphere(blocks[b].sphere) ? 1 : 0;
      if (on !== this.shown[b]) { this.shown[b] = on; changed = true; }
    }
    if (!changed) return;
    const m = this.mesh.instanceMatrix.array as Float32Array;
    const c = this.mesh.instanceColor ? (this.mesh.instanceColor.array as Float32Array) : null;
    let o = 0;
    for (let b = 0; b < blocks.length; b++) {
      if (!this.shown[b]) continue;
      const { start, n } = blocks[b];
      m.set(this.src.subarray(start * 16, (start + n) * 16), o * 16);
      if (c && this.srcCol) c.set(this.srcCol.subarray(start * 3, (start + n) * 3), o * 3);
      o += n;
    }
    this.mesh.count = o;
    this.mesh.visible = o > 0;
    this.mesh.instanceMatrix.needsUpdate = true;
    if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;
  }
}

export interface Culled { cull(view: THREE.Frustum, shadow: THREE.Frustum | null): void }

// Culls a big batch (already added to its parent) by blocks. A batch that casts shadow gets a
// twin on layer 2, which only the sun's shadow camera sees: the twin draws the blocks inside the
// shadow box, the batch itself only the blocks on screen. Light batches cost less drawn whole.
export function blockBatch(im: THREE.InstancedMesh): Culled | null {
  const g = im.geometry;
  const tris = ((g.index ? g.index.count : g.getAttribute('position').count) / 3) * im.count;
  if (tris < 100000) return null;
  if (!im.castShadow || !im.parent) {
    const b = new BlockBatch(im);
    return { cull: (view) => b.cull(view) };
  }
  const twin = new THREE.InstancedMesh(im.geometry, im.material, im.count);
  (twin.instanceMatrix.array as Float32Array).set(im.instanceMatrix.array as Float32Array);
  twin.layers.set(2);
  twin.castShadow = true;
  twin.receiveShadow = false;
  im.castShadow = false;
  im.parent.add(twin);
  const main = new BlockBatch(im), caster = new BlockBatch(twin);
  return { cull: (view, shadow) => { main.cull(view); if (shadow) caster.cull(shadow); } };
}

const PEBBLE = new THREE.DodecahedronGeometry(1, 1);

const SPIKE_COLORS = ['#9a6ad8', '#b78af0', '#e8c23a'];
const BUSH_COLORS = ['#5cb83a', '#4fa834', '#6cc444'];
const FLOWER_COLORS = ['#ffffff', '#ffd23a', '#ff8fb0', '#b58cff', '#ff6b6b', '#8fd3ff'];

export class Foliage {
  group = new THREE.Group();
  private grassGeos: THREE.BufferGeometry[] = [];
  private grassMat = windify(new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.DoubleSide, roughness: 0.95 }), 0.25, 1);
  private flowerMat = windify(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.6 }), 0.18, 0.8);
  private bushMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.75 });
  private pebbleMat = new THREE.MeshStandardMaterial({ color: '#b7b3aa', roughness: 0.9, flatShading: true });

  private batches: Culled[] = [];

  private keep(im: THREE.InstancedMesh) {
    this.group.add(im);
    const b = blockBatch(im);
    if (b) this.batches.push(b);
  }

  // draw only the grass and flowers on the land in view
  cull(view: THREE.Frustum, shadow: THREE.Frustum | null) {
    for (const b of this.batches) b.cull(view, shadow);
  }

  // tiles: every free tile the grass may grow on; density: tufts per open tile
  rebuild(tiles: Spot[], density: number) {
    // everything in the group goes, shadow twins of the batches included
    for (const m of [...this.group.children]) { this.group.remove(m); (m as THREE.InstancedMesh).dispose(); }
    this.batches = [];
    if (density <= 0 || !tiles.length) return;
    if (!this.grassGeos.length) for (let v = 0; v < 3; v++) this.grassGeos.push(tuftGeometry(100 + v * 31));

    const tufts: [number, number, number, number, boolean][][] = this.grassGeos.map(() => []);
    const flowers: [number, number, number, number][] = [];
    const bushes: [number, number, number][] = [];
    const spikes: [number, number, number, number][] = [];
    const pebbles: [number, number, number][] = [];
    tiles.forEach((t, ti) => {
      const n = t.open ? density : Math.max(1, Math.round(density * 0.35));
      for (let k = 0; k < n; k++) {
        const s = ti * 13 + k;
        const x = t.x + 0.08 + rnd(s, 1) * 0.84, z = t.z + 0.08 + rnd(s, 2) * 0.84;
        tufts[Math.floor(rnd(s, 3) * tufts.length)].push([x, z, rnd(s, 4) * Math.PI * 2, 0.75 + rnd(s, 5) * 0.6, t.open]);
      }
      // meadow scatter: clumps of lupines and the odd pebble
      if (rnd(ti, 51) < (t.open ? 0.16 : 0.22)) {
        const n = 3 + Math.floor(rnd(ti, 52) * 4), c = rnd(ti, 53);
        for (let k = 0; k < n; k++) spikes.push([t.x + 0.2 + rnd(ti * 5 + k, 54) * 0.6, t.z + 0.2 + rnd(ti * 5 + k, 55) * 0.6, rnd(ti * 5 + k, 56) * 6, c]);
      }
      if (rnd(ti, 61) < 0.025) pebbles.push([t.x + 0.2 + rnd(ti, 62) * 0.6, t.z + 0.2 + rnd(ti, 63) * 0.6, 0.04 + rnd(ti, 64) * 0.05]);
      // now and then a round leafy bush, for a lush garden feel
      if (t.open && rnd(ti, 31) < 0.03) bushes.push([t.x + 0.3 + rnd(ti, 32) * 0.4, t.z + 0.3 + rnd(ti, 33) * 0.4, 0.28 + rnd(ti, 34) * 0.14]);
      if (t.open && rnd(ti, 9) < 0.12) {
        const c = 3 + Math.floor(rnd(ti, 10) * 4);
        for (let k = 0; k < c; k++) flowers.push([t.x + 0.15 + rnd(ti * 7 + k, 11) * 0.7, t.z + 0.15 + rnd(ti * 7 + k, 12) * 0.7, rnd(ti * 7 + k, 13) * 6, rnd(ti, 14)]);
      }
    });

    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sv = new THREE.Vector3(), pv = new THREE.Vector3();
    const up = new THREE.Vector3(0, 1, 0);
    const col = new THREE.Color();
    tufts.forEach((list, v) => {
      if (!list.length) return;
      const im = new THREE.InstancedMesh(this.grassGeos[v], this.grassMat, list.length);
      list.forEach(([x, z, r, s, open], i) => {
        q.setFromAxisAngle(up, r);
        m4.compose(pv.set(x, 0, z), q, sv.set(s, s * (open ? 1 : 1.25), s));
        im.setMatrixAt(i, m4);
        // tinted toward the saturated lawn so the tufts do not look straw pale against it
        col.setRGB(0.78, 0.95, 0.62).offsetHSL((rnd(i, v + 20) - 0.5) * 0.04, 0, (rnd(i, v + 21) - 0.5) * 0.1);
        if (!open) col.multiplyScalar(0.72);
        im.setColorAt(i, col);
      });
      im.receiveShadow = true;
      im.castShadow = false;
      this.keep(im);
    });
    if (bushes.length) {
      const im = new THREE.InstancedMesh(toonCrown(4, 0.035), this.bushMat, bushes.length);
      bushes.forEach(([x, z, s], i) => {
        q.setFromAxisAngle(up, rnd(i, 40) * 6);
        // the crown sits around y 0.8 with its underside near 0.36, so sink it to the ground
        m4.compose(pv.set(x, -0.3 * s, z), q, sv.set(s * 1.15, s, s * 1.15));
        im.setMatrixAt(i, m4);
        im.setColorAt(i, col.set(BUSH_COLORS[i % BUSH_COLORS.length]));
      });
      im.castShadow = true;
      im.receiveShadow = true;
      this.keep(im);
    }
    SPIKE_COLORS.forEach((sc, ci) => {
      const list = spikes.filter(([, , , c]) => Math.floor(c * SPIKE_COLORS.length) === ci);
      if (!list.length) return;
      const im = new THREE.InstancedMesh(flowerKit('spike', sc, 0.16), this.flowerMat, list.length);
      list.forEach(([x, z, r], i) => {
        q.setFromAxisAngle(up, r);
        m4.compose(pv.set(x, 0, z), q, sv.setScalar(1 + rnd(i, 57) * 0.6));
        im.setMatrixAt(i, m4);
      });
      im.receiveShadow = true;
      this.keep(im);
    });
    if (pebbles.length) {
      const im = new THREE.InstancedMesh(PEBBLE, this.pebbleMat, pebbles.length);
      pebbles.forEach(([x, z, s], i) => {
        q.setFromAxisAngle(up, rnd(i, 65) * 6);
        m4.compose(pv.set(x, s * 0.2, z), q, sv.set(s, s * 0.6, s * 0.8));
        im.setMatrixAt(i, m4);
      });
      im.castShadow = true;
      im.receiveShadow = true;
      this.keep(im);
    }
    // wild flowers in little clumps: one instanced batch per color, each a real daisy or tulip
    FLOWER_COLORS.forEach((fc, ci) => {
      const list = flowers.filter(([, , , c]) => Math.floor(c * FLOWER_COLORS.length) === ci);
      if (!list.length) return;
      const im = new THREE.InstancedMesh(flowerKit(ci % 3 === 1 ? 'tulip' : 'daisy', fc, 0.1), this.flowerMat, list.length);
      list.forEach(([x, z, r], i) => {
        q.setFromAxisAngle(up, r);
        m4.compose(pv.set(x, 0, z), q, sv.setScalar(0.8 + rnd(i, 30) * 0.4));
        im.setMatrixAt(i, m4);
      });
      im.receiveShadow = true;
      this.keep(im);
    });
  }
}

// ---------------------------------------------------------------- garden flowers
// Cartoon garden flowers built from soft petal shapes, with a leafy stem, baked into vertex
// colors so a whole bed draws with one material: daisies, tulips and round rosettes.
export type FlowerKind = 'daisy' | 'tulip' | 'rose' | 'spike';
const kitCache = new Map<string, THREE.BufferGeometry>();
export const FLOWER_KIT_MAT = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.6 });

function painted(src: THREE.BufferGeometry, color: string) {
  const g = src.index ? src.toNonIndexed() : src;
  const c = new THREE.Color(color);
  const n = (g.getAttribute('position') as THREE.BufferAttribute).count;
  const a = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { a[i * 3] = c.r; a[i * 3 + 1] = c.g; a[i * 3 + 2] = c.b; }
  g.setAttribute('color', new THREE.BufferAttribute(a, 3));
  g.deleteAttribute('uv');
  return g;
}

// a soft rounded petal or leaf: a squashed sphere pushed out along +x
function blade(len: number, wid: number, thick: number) {
  const g = new THREE.SphereGeometry(1, 6, 4);
  g.scale(len, thick, wid);
  g.translate(len, 0, 0);
  return g;
}

export function flowerKit(kind: FlowerKind, petal: string, h = 0.22) {
  const key = `${kind}|${petal}|${h}`;
  const hit = kitCache.get(key);
  if (hit) return hit;
  const parts: THREE.BufferGeometry[] = [];
  const stem = new THREE.CylinderGeometry(0.006, 0.009, h, 4);
  stem.translate(0, h / 2, 0);
  parts.push(painted(stem, '#3f8f2c'));
  // two leaves on the stem, angled up and out
  for (const [a, y] of [[0.4, 0.3], [3.5, 0.5]] as const) {
    const lf = blade(0.045, 0.018, 0.005);
    lf.rotateZ(0.5);
    lf.rotateY(a);
    lf.translate(0, h * y, 0);
    parts.push(painted(lf, '#4fa834'));
  }
  const dark = '#' + new THREE.Color(petal).multiplyScalar(0.8).getHexString();
  if (kind === 'daisy') {
    for (let i = 0; i < 9; i++) {
      const p = blade(0.036, 0.014, 0.005);
      p.rotateZ(0.2);
      p.rotateY((i / 9) * Math.PI * 2);
      p.translate(0, h, 0);
      parts.push(painted(p, i % 2 ? petal : dark));
    }
    const eye = new THREE.SphereGeometry(0.022, 10, 6);
    eye.scale(1, 0.6, 1);
    eye.translate(0, h + 0.004, 0);
    parts.push(painted(eye, '#f2b632'));
  } else if (kind === 'tulip') {
    // a cup of petals curving up around the center
    for (let i = 0; i < 6; i++) {
      const p = blade(0.045, 0.026, 0.01);
      p.rotateZ(Math.PI / 2 - 0.28);
      p.translate(0.018, 0, 0);
      p.rotateY((i / 6) * Math.PI * 2 + (i % 2) * 0.5);
      p.translate(0, h - 0.008, 0);
      parts.push(painted(p, i % 2 ? petal : dark));
    }
  } else if (kind === 'spike') {
    // lupine or lavender: little florets stacked up the top of the stem, smaller toward the tip
    for (let i = 0; i < 9; i++) {
      const t = i / 8, r = 0.013 * (1 - t * 0.55);
      const fl = new THREE.SphereGeometry(r, 5, 3);
      fl.translate(Math.cos(i * 2.4) * r * 0.6, h * (0.62 + t * 0.4), Math.sin(i * 2.4) * r * 0.6);
      parts.push(painted(fl, i % 2 ? petal : dark));
    }
  } else {
    // rosette: rings of cupped petals, tighter toward the middle
    for (let ring = 0; ring < 3; ring++) {
      const n = 7 - ring * 2, r = 0.034 - ring * 0.009;
      for (let i = 0; i < n; i++) {
        const p = blade(r, r * 0.8, 0.006);
        p.rotateZ(0.5 + ring * 0.45);
        p.rotateY((i / n) * Math.PI * 2 + ring);
        p.translate(0, h + ring * 0.009, 0);
        parts.push(painted(p, ring === 1 ? dark : petal));
      }
    }
  }
  const g = mergeGeometries(parts) as THREE.BufferGeometry;
  kitCache.set(key, g);
  return g;
}
