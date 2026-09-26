// Geometry kit: collects many small colored primitives and merges them into one mesh, so a
// detailed model (a wheat clump, a cow's face) costs a single draw call.
import * as THREE from 'three';
import { mergeGeometries, mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

export type V3 = [number, number, number];

const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _p = new THREE.Vector3(), _s = new THREE.Vector3();
const _c = new THREE.Color();

export class Kit {
  private parts: THREE.BufferGeometry[] = [];

  add(geo: THREE.BufferGeometry, color: string, pos: V3 = [0, 0, 0], rot: V3 = [0, 0, 0], scale: V3 | number = 1) {
    const g = geo.index ? geo.toNonIndexed() : geo.clone();
    if (g.getAttribute('uv')) g.deleteAttribute('uv');
    if (g.getAttribute('uv1')) g.deleteAttribute('uv1');
    if (!g.getAttribute('normal')) g.computeVertexNormals();
    const s = typeof scale === 'number' ? [scale, scale, scale] : scale;
    _m.compose(_p.set(...pos), _q.setFromEuler(_e.set(rot[0], rot[1], rot[2])), _s.set(s[0], s[1], s[2]));
    g.applyMatrix4(_m);
    const n = (g.getAttribute('position') as THREE.BufferAttribute).count;
    const col = new Float32Array(n * 3);
    _c.set(color);
    for (let i = 0; i < n; i++) { col[i * 3] = _c.r; col[i * 3 + 1] = _c.g; col[i * 3 + 2] = _c.b; }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    this.parts.push(g);
    return this;
  }

  // add with a ready made transform matrix
  addMatrix(geo: THREE.BufferGeometry, color: string, m: THREE.Matrix4) {
    this.add(geo, color);
    this.parts[this.parts.length - 1].applyMatrix4(m);
    return this;
  }

  get empty() { return this.parts.length === 0; }

  build() {
    const g = mergeGeometries(this.parts) as THREE.BufferGeometry;
    g.computeBoundingSphere();
    return g;
  }
}

// point at distance `len` along +y after rotating by `rot` (same Euler order as Kit.add)
export function tip(pos: V3, rot: V3, len: number): V3 {
  const v = new THREE.Vector3(0, len, 0).applyEuler(new THREE.Euler(rot[0], rot[1], rot[2]));
  return [pos[0] + v.x, pos[1] + v.y, pos[2] + v.z];
}

// ------------------------------------------------------------------ shared primitives

export const P = {
  sphere: new THREE.SphereGeometry(1, 12, 9),
  sphereHi: new THREE.SphereGeometry(1, 18, 12),
  box: new THREE.BoxGeometry(1, 1, 1),
};

const cyl = new Map<string, THREE.BufferGeometry>();
// unit height cylinder whose base sits at y = 0
export function cylinder(rt: number, rb: number, seg = 8) {
  const k = `${rt}|${rb}|${seg}`;
  let g = cyl.get(k);
  if (!g) { g = new THREE.CylinderGeometry(rt, rb, 1, seg); g.translate(0, 0.5, 0); cyl.set(k, g); }
  return g;
}

const blades = new Map<string, THREE.BufferGeometry>();
// a leaf blade growing up +y, tapering to a point and curving toward +z
export function blade(len: number, width: number, bend: number, segs = 5) {
  const k = `${len}|${width}|${bend}|${segs}`;
  let g = blades.get(k);
  if (g) return g;
  const pos: number[] = [], idx: number[] = [];
  for (let i = 0; i <= segs; i++) {
    const t = i / segs;
    const w = width * Math.sin(Math.min(1, t * 1.15 + 0.08) * Math.PI) * 0.5 + width * 0.08 * (1 - t);
    const y = len * t * (1 - bend * t * 0.35);
    const z = bend * len * t * t;
    pos.push(-w, y, z, w, y, z);
    if (i < segs) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  }
  g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  blades.set(k, g);
  return g;
}

const lumps = new Map<number, THREE.BufferGeometry>();
// sphere with soft random bulges, for foliage, wool and potatoes
export function lump(seed: number, amount = 0.2, detail = 16) {
  const k = seed * 1000 + Math.round(amount * 100) + detail * 100000;
  let g = lumps.get(k);
  if (g) return g;
  const base = new THREE.SphereGeometry(1, detail, Math.round(detail * 0.7));
  base.deleteAttribute('uv');
  base.deleteAttribute('normal');
  g = mergeVertices(base);
  const pos = g.getAttribute('position') as THREE.BufferAttribute;
  const v = new THREE.Vector3();
  const rnd = (i: number, s: number) => {
    let h = Math.imul(i | 0, 374761393) ^ Math.imul(s | 0, 668265263);
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  };
  const dirs = [...Array(6)].map((_, i) => new THREE.Vector3(rnd(i, seed) - 0.5, rnd(i, seed + 1) - 0.5, rnd(i, seed + 2) - 0.5).normalize());
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i).normalize();
    let d = 0;
    for (const dir of dirs) d += Math.pow(Math.max(0, v.dot(dir)), 5) * amount;
    v.multiplyScalar(1 - amount * 0.4 + d);
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals();
  lumps.set(k, g);
  return g;
}

const ribbed = new Map<number, THREE.BufferGeometry>();
// pumpkin style ribbed ball, flattened a little
export function ribs(n: number) {
  let g = ribbed.get(n);
  if (g) return g;
  g = new THREE.SphereGeometry(1, 36, 18);
  const pos = g.getAttribute('position') as THREE.BufferAttribute;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const a = Math.atan2(v.z, v.x);
    const r = 1 - Math.pow(Math.abs(Math.cos(a * n / 2)), 6) * 0.12;
    const pole = 1 - Math.pow(Math.abs(v.y), 6) * 0.25;
    pos.setXYZ(i, v.x * r, v.y * 0.72 * pole, v.z * r);
  }
  g.deleteAttribute('uv');
  g.computeVertexNormals();
  ribbed.set(n, g);
  return g;
}
