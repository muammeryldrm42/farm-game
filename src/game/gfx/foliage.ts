// Instanced grass tufts and wild flowers that sway in the wind. The sway runs in the vertex
// shader, so thousands of blades cost one draw call per layer.
import * as THREE from 'three';
import { toonCrown } from './toon';
import { mergeGeometries, mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
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

// Far from the camera the meadow thins out (low quality only, where a phone draws it): past `near`
// fewer and fewer tufts and wild flowers are drawn, down to `min` of them from `far` on. Nothing
// pops: each one has a rank of its own (from where it stands) and shrinks smoothly to nothing as
// the share kept passes its rank, and the batch leaves out the ones shrunk to nothing everywhere
// in a block. A far tuft or flower is a pixel or two; a phone's GPU is spared a third of the
// meadow's triangles at the usual view.
export const THIN = { near: 30, far: 55, min: 0.3, fade: 0.15 };
// the share kept at a distance from the camera (above 1 near it: none of them is shrinking there)
export function thinKeep(d: number) {
  const t = Math.min(1, Math.max(0, (d - THIN.near) / (THIN.far - THIN.near)));
  return 1 + THIN.fade + (THIN.min - 1 - THIN.fade) * t;
}
// a thing's rank in [0, 1), from its spot (worked out the same way in the shader, below)
export function thinRank(x: number, z: number) {
  const qx = Math.floor(x * 256 + 0.5) | 0, qz = Math.floor(z * 256 + 0.5) | 0;
  let h = (Math.imul(qx, 374761393) ^ Math.imul(qz, 668265263)) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0;
  h = (h ^ (h >>> 16)) >>> 0;
  return h / 4294967296;
}
export function thinOut<T extends THREE.Material>(m: T): T {
  const prev = m.onBeforeCompile;
  m.onBeforeCompile = (sh, r) => {
    prev.call(m, sh, r);
    sh.uniforms.uThin = U.thin;
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nuniform float uThin;')
      .replace('#include <project_vertex>', /* glsl */ `
#ifdef USE_INSTANCING
if (uThin > 0.5) {
  ivec2 q = ivec2(floor(instanceMatrix[3].xz * 256.0 + 0.5));
  uint h = (uint(q.x) * 374761393u) ^ (uint(q.y) * 668265263u);
  h = (h ^ (h >> 13u)) * 1274126177u;
  h ^= h >> 16u;
  float rank = float(h) / 4294967296.0;
  vec3 wp = (modelMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
  float t = clamp((distance(wp, cameraPosition) - ${THIN.near.toFixed(1)}) / ${(THIN.far - THIN.near).toFixed(1)}, 0.0, 1.0);
  float keep = mix(${(1 + THIN.fade).toFixed(3)}, ${THIN.min.toFixed(3)}, t);
  transformed *= clamp((keep - rank) / ${THIN.fade.toFixed(3)}, 0.0, 1.0);
}
#endif
#include <project_vertex>`);
  };
  const key = m.customProgramCacheKey.bind(m);
  m.customProgramCacheKey = () => `${key()}|thin`;
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
  // (thinned: each thing's rank, sorted within its block)
  private rank: Float32Array | null;
  private blocks: { start: number; n: number; sphere: THREE.Sphere }[] = [];
  // how many of each block are drawn (0: out of view)
  private shown: Uint32Array;

  constructor(readonly mesh: THREE.InstancedMesh, size = 12, thin = false) {
    const n = mesh.count, a = mesh.instanceMatrix.array as Float32Array;
    const col = mesh.instanceColor ? (mesh.instanceColor.array as Float32Array) : null;
    const key = (i: number) => (Math.floor(a[i * 16 + 12] / size) + 64) * 256 + Math.floor(a[i * 16 + 14] / size) + 64;
    // a thinned batch keeps each block in the order of rank: the ones kept far away come first
    const ranks = thin ? Float32Array.from({ length: n }, (_, i) => thinRank(a[i * 16 + 12], a[i * 16 + 14])) : null;
    const order = Array.from({ length: n }, (_, i) => i).sort((x, y) => key(x) - key(y) || (ranks ? ranks[x] - ranks[y] : 0));
    this.src = new Float32Array(n * 16);
    this.srcCol = col ? new Float32Array(n * 3) : null;
    this.rank = ranks ? new Float32Array(n) : null;
    const g = mesh.geometry;
    if (!g.boundingSphere) g.computeBoundingSphere();
    const r0 = g.boundingSphere!.radius + g.boundingSphere!.center.length();
    const box = new THREE.Box3(), p = new THREE.Vector3();
    let start = 0, reach = 0;
    order.forEach((from, i) => {
      this.src.set(a.subarray(from * 16, from * 16 + 16), i * 16);
      if (col && this.srcCol) this.srcCol.set(col.subarray(from * 3, from * 3 + 3), i * 3);
      if (ranks && this.rank) this.rank[i] = ranks[from];
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
    this.shown = new Uint32Array(this.blocks.length);
    (mesh.instanceMatrix.array as Float32Array).set(this.src);
    if (col && this.srcCol) col.set(this.srcCol);
    for (let b = 0; b < this.blocks.length; b++) this.shown[b] = this.blocks[b].n;
    // the blocks are culled here, so the batch as a whole never is
    mesh.frustumCulled = false;
  }

  // `eye`: the camera, for a thinned batch
  cull(view: THREE.Frustum, eye: THREE.Vector3 | null = null) {
    const blocks = this.blocks, rank = U.thin.value && eye ? this.rank : null;
    let changed = false;
    for (let b = 0; b < blocks.length; b++) {
      const { start, n, sphere } = blocks[b];
      let want = view.intersectsSphere(sphere) ? n : 0;
      if (want && rank) {
        // as many as any spot of the block keeps (in steps, so a moving camera rarely repacks)
        const k = Math.ceil(thinKeep(Math.max(0, eye!.distanceTo(sphere.center) - sphere.radius)) * 20) / 20 + 1e-4;
        if (k < 1) {
          let lo = 0, hi = n;
          while (lo < hi) { const mid = (lo + hi) >> 1; if (rank[start + mid] < k) lo = mid + 1; else hi = mid; }
          want = lo;
        }
      }
      if (want !== this.shown[b]) { this.shown[b] = want; changed = true; }
    }
    // the same blocks as last time: the batch is as it was, but shown again (the small meadow
    // batches are hidden while the camera is far out, and must come back as it zooms in)
    if (!changed) { this.mesh.visible = this.mesh.count > 0; return; }
    const m = this.mesh.instanceMatrix.array as Float32Array;
    const c = this.mesh.instanceColor ? (this.mesh.instanceColor.array as Float32Array) : null;
    let o = 0;
    for (let b = 0; b < blocks.length; b++) {
      const n = this.shown[b];
      if (!n) continue;
      const { start } = blocks[b];
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

// (`eye`: the camera, for a batch thinned with distance)
export interface Culled { cull(view: THREE.Frustum, shadow: THREE.Frustum | null, eye?: THREE.Vector3 | null): void }

// Culls a big batch (already added to its parent) by blocks. A batch that casts shadow gets a
// twin on layer 2, which only the sun's shadow camera sees: the twin draws the blocks inside the
// shadow box, the batch itself only the blocks on screen. Light batches cost less drawn whole.
// (A map wide batch of some tens of thousands of triangles is not light: most of it is out of
// view, yet a phone's GPU would still work through every one of its corners.)
// (`thin`: thinned far from the camera, with a material from thinOut; never one that casts shadow)
export function blockBatch(im: THREE.InstancedMesh, thin = false): Culled | null {
  const g = im.geometry;
  const tris = ((g.index ? g.index.count : g.getAttribute('position').count) / 3) * im.count;
  if (tris < 20000) return null;
  if (!im.castShadow || !im.parent) {
    // (a thinned batch in smaller blocks: each one's far side thins out more)
    const b = new BlockBatch(im, thin ? 6 : 12, thin);
    return { cull: (view, _shadow, eye) => b.cull(view, eye) };
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
  private grassMat = thinOut(windify(new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.DoubleSide, roughness: 0.95 }), 0.25, 1));
  private flowerMat = thinOut(windify(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.6 }), 0.18, 0.8));
  private bushMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.75 });
  private pebbleMat = new THREE.MeshStandardMaterial({ color: '#b7b3aa', roughness: 0.9, flatShading: true });

  private batches: { b: Culled | null; im: THREE.InstancedMesh; small: boolean }[] = [];

  // small: wild flowers and pebbles, only a pixel or two when the camera is far out; thin: thinned
  // far from the camera (the tufts and wild flowers, whose materials are made for it)
  private keep(im: THREE.InstancedMesh, small = false, thin = false) {
    this.group.add(im);
    const b = blockBatch(im, thin);
    if (b || small) this.batches.push({ b, im, small });
  }

  // draw only the grass and flowers on the land in view; from far out, not the little things
  cull(view: THREE.Frustum, shadow: THREE.Frustum | null, far = false, eye: THREE.Vector3 | null = null) {
    for (const { b, im, small } of this.batches) {
      if (small && far) { im.visible = false; continue; }
      if (b) b.cull(view, shadow, eye);
      else im.visible = true;
    }
  }

  // tiles: every free tile the grass may grow on; density: tufts per open tile; lite: low quality
  rebuild(tiles: Spot[], density: number, lite = false) {
    // everything in the group goes, shadow twins of the batches included
    for (const m of [...this.group.children]) { this.group.remove(m); (m as THREE.InstancedMesh).dispose(); }
    this.batches = [];
    // (thinned in low quality only, where there are no shadows to give the far ones away)
    U.thin.value = lite ? 1 : 0;
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
      this.keep(im, false, true);
    });
    if (bushes.length) {
      // a coarser sculpt than a tree crown: a bush is small on screen, and there are many (and
      // coarser still in low quality: half the triangles, a phone shows it a few dozen pixels wide)
      const im = new THREE.InstancedMesh(toonCrown(4, lite ? 0.075 : 0.055), this.bushMat, bushes.length);
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
      const im = new THREE.InstancedMesh(flowerKit('spike', sc, 0.16, lite), this.flowerMat, list.length);
      list.forEach(([x, z, r], i) => {
        q.setFromAxisAngle(up, r);
        m4.compose(pv.set(x, 0, z), q, sv.setScalar(1 + rnd(i, 57) * 0.6));
        im.setMatrixAt(i, m4);
      });
      im.receiveShadow = true;
      this.keep(im, true, true);
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
      this.keep(im, true);
    }
    // wild flowers in little clumps: one instanced batch per color, each a real daisy or tulip
    FLOWER_COLORS.forEach((fc, ci) => {
      const list = flowers.filter(([, , , c]) => Math.floor(c * FLOWER_COLORS.length) === ci);
      if (!list.length) return;
      const im = new THREE.InstancedMesh(flowerKit(ci % 3 === 1 ? 'tulip' : 'daisy', fc, 0.1, lite), this.flowerMat, list.length);
      list.forEach(([x, z, r], i) => {
        q.setFromAxisAngle(up, r);
        m4.compose(pv.set(x, 0, z), q, sv.setScalar(0.8 + rnd(i, 30) * 0.4));
        im.setMatrixAt(i, m4);
      });
      im.receiveShadow = true;
      this.keep(im, true, true);
    });
  }
}

// ---------------------------------------------------------------- garden flowers
// Cartoon garden flowers built from soft petal shapes, with a leafy stem, baked into vertex
// colors so a whole bed draws with one material: daisies, tulips and round rosettes.
export type FlowerKind = 'daisy' | 'tulip' | 'rose' | 'spike';
const kitCache = new Map<string, THREE.BufferGeometry>();
export const FLOWER_KIT_MAT = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.6 });

// The parts stay indexed: a corner shared by several triangles (a sphere's are each shared by
// about six) is worked out once on the GPU instead of once for every triangle. Each part is one
// color, so the picture is the same.
function painted(src: THREE.BufferGeometry, color: string) {
  const g = src;
  const c = new THREE.Color(color);
  const n = (g.getAttribute('position') as THREE.BufferAttribute).count;
  const a = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { a[i * 3] = c.r; a[i * 3 + 1] = c.g; a[i * 3 + 2] = c.b; }
  g.setAttribute('color', new THREE.BufferAttribute(a, 3));
  g.deleteAttribute('uv');
  return g;
}

// a soft rounded petal or leaf: a squashed sphere pushed out along +x (`lite`: a coarser one, a
// leaf flat as a lozenge, a petal (`round`) still a little rounded)
function blade(len: number, wid: number, thick: number, lite = false, round = false) {
  const g = new THREE.SphereGeometry(1, lite ? 4 : 6, lite ? (round ? 3 : 2) : 4);
  g.scale(len, thick, wid);
  g.translate(len, 0, 0);
  return g;
}

// `lite`: fewer, simpler florets on a lupine and coarser petals on a daisy or tulip, for low
// quality (a wild flower is a few pixels on a phone: a third of the triangles, the same look)
export function flowerKit(kind: FlowerKind, petal: string, h = 0.22, lite = false) {
  const key = `${kind}|${petal}|${h}|${lite}`;
  const hit = kitCache.get(key);
  if (hit) return hit;
  const parts: THREE.BufferGeometry[] = [];
  // lite: the stem a three sided tube with no ends (its ends are hidden in the ground and the
  // florets) and coarser leaves; a lupine is a few pixels tall on a phone, its leaves less than one
  const stem = lite ? new THREE.CylinderGeometry(0.006, 0.009, h, 3, 1, true) : new THREE.CylinderGeometry(0.006, 0.009, h, 4);
  stem.translate(0, h / 2, 0);
  parts.push(painted(stem, '#3f8f2c'));
  // two leaves on the stem, angled up and out
  for (const [a, y] of [[0.4, 0.3], [3.5, 0.5]] as const) {
    const lf = blade(0.045, 0.018, 0.005, lite);
    lf.rotateZ(0.5);
    lf.rotateY(a);
    lf.translate(0, h * y, 0);
    parts.push(painted(lf, '#4fa834'));
  }
  const dark = '#' + new THREE.Color(petal).multiplyScalar(0.8).getHexString();
  if (kind === 'daisy') {
    for (let i = 0; i < 9; i++) {
      const p = blade(0.036, 0.014, 0.005, lite, true);
      p.rotateZ(0.2);
      p.rotateY((i / 9) * Math.PI * 2);
      p.translate(0, h, 0);
      parts.push(painted(p, i % 2 ? petal : dark));
    }
    const eye = lite ? new THREE.SphereGeometry(0.022, 6, 3) : new THREE.SphereGeometry(0.022, 10, 6);
    eye.scale(1, 0.6, 1);
    eye.translate(0, h + 0.004, 0);
    parts.push(painted(eye, '#f2b632'));
  } else if (kind === 'tulip') {
    // a cup of petals curving up around the center
    for (let i = 0; i < 6; i++) {
      const p = blade(0.045, 0.026, 0.01, lite, true);
      p.rotateZ(Math.PI / 2 - 0.28);
      p.translate(0.018, 0, 0);
      p.rotateY((i / 6) * Math.PI * 2 + (i % 2) * 0.5);
      p.translate(0, h - 0.008, 0);
      parts.push(painted(p, i % 2 ? petal : dark));
    }
  } else if (kind === 'spike') {
    // lupine or lavender: little florets stacked up the top of the stem, smaller toward the tip
    const n = lite ? 6 : 9;
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1), r = 0.013 * (1 - t * 0.55) * (lite ? 1.15 : 1);
      const fl = lite ? new THREE.SphereGeometry(r, 4, 2) : new THREE.SphereGeometry(r, 5, 3);
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
  // a sphere's poles and seam repeat the same corner (same place, normal and color) several
  // times: those are made one, so a lupine's florets are a third of the corners to work out
  const g = mergeVertices(mergeGeometries(parts) as THREE.BufferGeometry);
  kitCache.set(key, g);
  return g;
}
