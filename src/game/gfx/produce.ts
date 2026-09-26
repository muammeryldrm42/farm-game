// Realistic fruit and vegetable shapes with painted skins (vertex colors), each about one unit
// in radius so callers scale them to size. Built once per kind.
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { noise3 } from './sdf';

type Skin = (x: number, y: number, z: number, n: THREE.Vector3) => THREE.Color;

// lathe a profile (radius at height) around y, then paint every vertex
function lathe(profile: [number, number][], segs: number, skin: Skin, bump?: (x: number, y: number, z: number) => number) {
  const pts = profile.map(([r, y]) => new THREE.Vector2(Math.max(0.0001, r), y));
  const g = new THREE.LatheGeometry(pts, segs);
  g.deleteAttribute('uv');
  const pos = g.getAttribute('position') as THREE.BufferAttribute;
  if (bump) {
    const v = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      const r = Math.hypot(v.x, v.z);
      if (r < 1e-4) continue;
      const k = 1 + bump(v.x, v.y, v.z);
      pos.setXYZ(i, v.x * k, v.y, v.z * k);
    }
  }
  g.computeVertexNormals();
  return paint(g.toNonIndexed(), skin);
}

function paint(g: THREE.BufferGeometry, skin: Skin) {
  const pos = g.getAttribute('position') as THREE.BufferAttribute;
  const nor = g.getAttribute('normal') as THREE.BufferAttribute;
  const col = new Float32Array(pos.count * 3);
  const n = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    n.fromBufferAttribute(nor, i);
    const c = skin(pos.getX(i), pos.getY(i), pos.getZ(i), n);
    col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return g;
}

function solid(geo: THREE.BufferGeometry, color: string, m: THREE.Matrix4) {
  const g = (geo.index ? geo.toNonIndexed() : geo.clone());
  if (g.getAttribute('uv')) g.deleteAttribute('uv');
  g.applyMatrix4(m);
  const c = new THREE.Color(color);
  return paint(g, () => c);
}

const C = new THREE.Color(), D = new THREE.Color();
const mix = (a: string, b: string, t: number) => C.set(a).lerp(D.set(b), Math.max(0, Math.min(1, t))).clone();
const round = (n = 18): [number, number][] => [...Array(n + 1)].map((_, i) => { const a = -Math.PI / 2 + (i / n) * Math.PI; return [Math.cos(a), Math.sin(a)]; });

const stem = (h: number, r: number, tilt = 0.2) => new THREE.Matrix4().makeTranslation(0, h, 0).multiply(new THREE.Matrix4().makeRotationZ(tilt)).multiply(new THREE.Matrix4().makeScale(r, 0.3, r));
const cyl = new THREE.CylinderGeometry(1, 1, 1, 6);
cyl.translate(0, 0.5, 0);
const leafGeo = new THREE.SphereGeometry(1, 8, 5);

function apple() {
  // dimpled at both poles, red over a yellow green ground, with fine streaks and freckles
  const prof: [number, number][] = [[0, -0.78], [0.35, -0.85], [0.75, -0.6], [0.98, -0.1], [0.95, 0.35], [0.7, 0.72], [0.3, 0.8], [0.08, 0.66], [0, 0.62]];
  const body = lathe(prof, 26, (x, y, z) => {
    const streak = noise3(Math.atan2(z, x) * 5, y * 1.2, 0) * 0.6 + noise3(x * 6, y * 6, z * 6) * 0.4;
    const blush = 0.82 + y * 0.2 + (streak - 0.5) * 0.7;
    const c = mix('#b8c94a', '#c3151d', blush);
    if (noise3(x * 30, y * 30, z * 30) > 0.78) c.lerp(D.set('#f2e6a0'), 0.35);
    return c;
  });
  return mergeGeometries([body, solid(cyl, '#5a3a1f', stem(0.6, 0.05, 0.25)), solid(leafGeo, '#4f9e36', new THREE.Matrix4().makeTranslation(0.22, 0.86, 0).multiply(new THREE.Matrix4().makeRotationZ(-0.5)).multiply(new THREE.Matrix4().makeScale(0.3, 0.05, 0.14)))]) as THREE.BufferGeometry;
}

function cherry() {
  // a pair of glossy dark red cherries hanging from joined stems
  const one = (x: number) => {
    const g = lathe([[0, -0.8], [0.6, -0.7], [0.95, -0.15], [0.9, 0.35], [0.45, 0.72], [0.12, 0.62], [0, 0.55]], 18, (px, py, pz) => mix('#5c0612', '#c01a2c', 0.4 + py * 0.4 + (noise3(px * 8, py * 8, pz * 8) - 0.5) * 0.4));
    g.scale(0.62, 0.62, 0.62);
    g.translate(x, -0.3, 0);
    return g;
  };
  const s1 = solid(cyl, '#5f7a2a', new THREE.Matrix4().makeTranslation(-0.45, 0.05, 0).multiply(new THREE.Matrix4().makeRotationZ(-0.45)).multiply(new THREE.Matrix4().makeScale(0.04, 1.1, 0.04)));
  const s2 = solid(cyl, '#5f7a2a', new THREE.Matrix4().makeTranslation(0.45, 0.05, 0).multiply(new THREE.Matrix4().makeRotationZ(0.45)).multiply(new THREE.Matrix4().makeScale(0.04, 1.1, 0.04)));
  return mergeGeometries([one(-0.45), one(0.45), s1, s2]) as THREE.BufferGeometry;
}

function orange() {
  // pitted peel: tiny pores push the surface in and out
  const g = lathe(round(20).map(([r, y]) => [r, y * 0.96]), 28, (x, y, z) => {
    const c = mix('#e86a00', '#ffa21f', 0.5 + (noise3(x * 5, y * 5, z * 5) - 0.5) * 0.8);
    return y > 0.9 ? c.lerp(D.set('#7a9a2a'), 0.6) : c;
  }, (x, y, z) => (noise3(x * 40, y * 40, z * 40) - 0.5) * 0.03);
  return mergeGeometries([g, solid(leafGeo, '#5a8a2a', new THREE.Matrix4().makeTranslation(0, 0.95, 0).multiply(new THREE.Matrix4().makeScale(0.14, 0.05, 0.14)))]) as THREE.BufferGeometry;
}

function peach() {
  // velvety, heart shaped with a crease down one side and a red blush on the sunny cheek
  const g = lathe([[0, -0.85], [0.5, -0.78], [0.92, -0.35], [0.98, 0.1], [0.78, 0.6], [0.35, 0.9], [0.05, 0.82], [0, 0.78]], 26, (x, y, z) => {
    const blush = 0.35 + x * 0.35 + y * 0.25 + (noise3(x * 4, y * 4, z * 4) - 0.5) * 0.6;
    return mix('#f6c06a', '#e0473a', blush);
  }, (x, _y, z) => -Math.exp(-Math.pow(Math.atan2(z, x) / 0.18, 2)) * 0.08);
  return mergeGeometries([g, solid(leafGeo, '#4f9e36', new THREE.Matrix4().makeTranslation(0.2, 0.9, 0).multiply(new THREE.Matrix4().makeRotationZ(-0.4)).multiply(new THREE.Matrix4().makeScale(0.32, 0.05, 0.13)))]) as THREE.BufferGeometry;
}

function lemon() {
  // oval with a pointed nub at each end and a pitted, waxy peel
  const g = lathe([[0, -1.2], [0.12, -1.12], [0.45, -0.85], [0.78, -0.35], [0.8, 0.2], [0.55, 0.78], [0.18, 1.08], [0, 1.2]], 24, (x, y, z) => mix('#e7c21a', '#fff05a', 0.55 + (noise3(x * 6, y * 6, z * 6) - 0.5) * 0.7), (x, y, z) => (noise3(x * 38, y * 38, z * 38) - 0.5) * 0.03);
  g.rotateZ(Math.PI / 2);
  g.scale(0.8, 0.8, 0.8);
  return g;
}

function coconut() {
  const g = lathe(round(16).map(([r, y]) => [r, y * 1.05]), 20, (x, y, z) => mix('#5a3418', '#8a5a2e', noise3(x * 3, y * 18, z * 3)), (x, y, z) => (noise3(x * 6, y * 30, z * 6) - 0.5) * 0.06);
  return g;
}

// ---------------------------------------------------------------- field crops (grey skins, tinted by the material)

function tomato() {
  const g = lathe([[0, -0.8], [0.6, -0.75], [0.95, -0.3], [1, 0.1], [0.9, 0.45], [0.55, 0.68], [0.15, 0.62], [0, 0.58]], 24, (x, y, z) => C.setScalar(0.85 + y * 0.12 + noise3(x * 6, y * 6, z * 6) * 0.1).clone(), (x, _y, z) => -Math.pow(Math.abs(Math.sin(Math.atan2(z, x) * 3)), 8) * 0.04);
  return g;
}

function strawberry() {
  // a plump cone speckled with little seeds
  const g = lathe([[0, -1.1], [0.35, -0.85], [0.75, -0.2], [0.9, 0.35], [0.7, 0.7], [0.2, 0.82], [0, 0.8]], 22, (x, y, z) => {
    const seed = Math.sin(Math.atan2(z, x) * 11 + y * 9) * Math.sin(y * 18) > 0.75;
    return C.setScalar(seed ? 0.55 : 0.92 + y * 0.08).clone();
  });
  return g;
}

function chili() {
  // a curved, tapering pod
  const parts: THREE.BufferGeometry[] = [];
  const segs = 8;
  for (let i = 0; i < segs; i++) {
    const t = i / segs;
    const r = 0.28 * (1 - t * 0.8);
    const sp = new THREE.SphereGeometry(r, 12, 8);
    sp.translate(Math.sin(t * 1.2) * 0.35, -t * 1.6, 0);
    parts.push(sp);
  }
  for (const p of parts) p.deleteAttribute('uv');
  const g = (mergeGeometries(parts) as THREE.BufferGeometry).toNonIndexed();
  return paint(g, () => C.setScalar(1).clone());
}

const makers: Record<string, () => THREE.BufferGeometry> = { apple, cherry, orange, peach, lemon, coconut, tomato, strawberry, chili };
const cache = new Map<string, THREE.BufferGeometry>();
export function produceGeo(kind: string) {
  let g = cache.get(kind);
  if (!g && makers[kind]) { g = makers[kind](); cache.set(kind, g); }
  return g ?? null;
}

export const PRODUCE_MAT = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.32, metalness: 0 });
