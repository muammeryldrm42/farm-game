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

// ---------------------------------------------------------------- more tree fruit (painted skins)

function pear() {
  // narrow neck, round bottom, green gold with russet freckles
  const g = lathe([[0, -0.9], [0.55, -0.82], [0.9, -0.4], [0.85, 0.05], [0.5, 0.45], [0.38, 0.8], [0.2, 1.0], [0, 1.02]], 24, (x, y, z) => {
    const c = mix('#a8c040', '#e0c24a', 0.4 + y * 0.3 + (noise3(x * 5, y * 5, z * 5) - 0.5) * 0.5);
    if (noise3(x * 28, y * 28, z * 28) > 0.75) c.lerp(D.set('#9a6a2a'), 0.4);
    return c;
  });
  return mergeGeometries([g, solid(cyl, '#5a3a1f', stem(0.95, 0.05, 0.3))]) as THREE.BufferGeometry;
}

function plum() {
  // deep purple with a dusty bloom and a faint seam
  return lathe([[0, -0.85], [0.6, -0.75], [0.95, -0.2], [0.95, 0.25], [0.6, 0.78], [0.1, 0.88], [0, 0.85]], 22, (x, y, z) => {
    const c = mix('#3a1248', '#7a3a9a', 0.45 + (noise3(x * 4, y * 4, z * 4) - 0.5) * 0.6);
    return c.lerp(D.set('#b8a8d0'), noise3(x * 12, y * 12, z * 12) * 0.25);
  }, (x, _y, z) => -Math.exp(-Math.pow(Math.atan2(z, x) / 0.15, 2)) * 0.05);
}

function mango() {
  // kidney shaped, green at the stem blushing to orange and red
  const g = lathe(round(18).map(([r, y]) => [r * (1 - 0.15 * y), y * 1.3]), 22, (x, y, z) => mix('#6aa83a', '#f08a2a', 0.3 - y * 0.4 + x * 0.3 + noise3(x * 4, y * 4, z * 4) * 0.3).lerp(D.set('#d8342a'), Math.max(0, x * 0.4)));
  g.scale(0.9, 0.8, 0.7);
  g.rotateZ(0.3);
  return g;
}

function avocado() {
  // pebbly dark green pear shaped fruit
  return lathe([[0, -0.9], [0.62, -0.8], [0.85, -0.3], [0.7, 0.3], [0.45, 0.8], [0.15, 0.98], [0, 0.98]], 20, (x, y, z) => mix('#1f3a14', '#4a6a24', noise3(x * 14, y * 14, z * 14)), (x, y, z) => (noise3(x * 30, y * 30, z * 30) - 0.5) * 0.05);
}

function pomegranate() {
  // round with a crown of little sepals at the top
  const g = lathe([[0, -0.9], [0.65, -0.78], [0.98, -0.2], [0.95, 0.3], [0.55, 0.78], [0.28, 0.85], [0.3, 1.02], [0.18, 1.0], [0, 0.92]], 24, (x, y, z) => mix('#8a1020', '#e0483a', 0.5 + (noise3(x * 5, y * 5, z * 5) - 0.5) * 0.7 + x * 0.2));
  return g;
}

function banana() {
  // a hand of curved yellow bananas with green tips hanging from a stalk
  const parts: THREE.BufferGeometry[] = [];
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    for (let k = 0; k < 6; k++) {
      const t = k / 5;
      const r = 0.13 * Math.sin(Math.min(1, t * 1.1 + 0.1) * Math.PI) + 0.03;
      const sp = new THREE.SphereGeometry(r, 8, 6);
      const out = 0.12 + t * 0.35, up = -0.2 + t * 0.55 + Math.sin(t * 2.4) * 0.1;
      sp.translate(Math.cos(a) * out, up, Math.sin(a) * out);
      sp.deleteAttribute('uv');
      const tip = t < 0.12 || t > 0.9;
      parts.push(paint(sp.toNonIndexed(), () => C.set(tip ? '#5a7a2a' : '#f2d23a').clone()));
    }
  }
  parts.push(solid(cyl, '#6a7a3a', new THREE.Matrix4().makeTranslation(0, -0.1, 0).multiply(new THREE.Matrix4().makeScale(0.06, 1.2, 0.06))));
  return mergeGeometries(parts) as THREE.BufferGeometry;
}

// ---------------------------------------------------------------- more field crops (grey skins)

function bellPepper() {
  // four lobes and a stubby green stem
  const g = lathe([[0, -0.72], [0.55, -0.8], [0.92, -0.4], [0.98, 0.2], [0.8, 0.62], [0.3, 0.7], [0, 0.6]], 24, (x, y, z) => C.setScalar(0.85 + y * 0.12 + noise3(x * 5, y * 5, z * 5) * 0.08).clone(), (x, _y, z) => Math.pow(Math.abs(Math.cos(Math.atan2(z, x) * 2)), 3) * 0.08 - 0.04);
  return g;
}

function eggplant() {
  // long glossy teardrop
  return lathe([[0, -1.3], [0.35, -1.22], [0.6, -0.8], [0.62, -0.2], [0.45, 0.4], [0.25, 0.85], [0, 0.95]], 20, (x, y, z) => C.setScalar(0.8 + noise3(x * 4, y * 4, z * 4) * 0.25).clone());
}

function raspberry() {
  // a dome of tiny round drupelets
  const parts: THREE.BufferGeometry[] = [];
  for (let i = 0; i < 26; i++) {
    const y = -0.9 + (i / 26) * 1.6, a = i * 2.4;
    const r = Math.sqrt(Math.max(0.05, 1 - Math.pow((y + 0.1) / 1, 2))) * 0.62;
    const sp = new THREE.SphereGeometry(0.28, 7, 5);
    sp.translate(Math.cos(a) * r, y, Math.sin(a) * r);
    sp.deleteAttribute('uv');
    parts.push(paint(sp.toNonIndexed(), () => C.setScalar(0.85 + (i % 3) * 0.06).clone()));
  }
  return mergeGeometries(parts) as THREE.BufferGeometry;
}

function cucumber() {
  // long, slightly curved, bumpy with pale stripes
  const g = lathe([[0, -1.6], [0.3, -1.5], [0.42, -1.0], [0.44, 0.8], [0.35, 1.4], [0, 1.55]], 16, (x, y, z) => C.setScalar(Math.sin(Math.atan2(z, x) * 6) > 0.4 ? 1.2 : 0.8).clone(), (x, y, z) => (noise3(x * 20, y * 20, z * 20) > 0.75 ? 0.06 : 0));
  g.rotateZ(Math.PI / 2);
  return g;
}

function grapes() {
  // a tapering bunch of round grapes with a bloom, hanging from a short stalk
  const parts: THREE.BufferGeometry[] = [];
  let i = 0;
  for (let row = 0; row < 7; row++) {
    const n = Math.max(1, 6 - row);
    const r = 0.1 + (6 - row) * 0.07;
    for (let k = 0; k < n; k++) {
      const a = (k / n) * Math.PI * 2 + row;
      const sp = new THREE.SphereGeometry(0.17, 8, 6);
      sp.translate(Math.cos(a) * r, 0.5 - row * 0.2, Math.sin(a) * r);
      sp.deleteAttribute('uv');
      const tone = 0.8 + ((i++ * 7) % 5) * 0.06;
      parts.push(paint(sp.toNonIndexed(), () => C.setScalar(tone).clone()));
    }
  }
  return mergeGeometries(parts) as THREE.BufferGeometry;
}

function pineapple() {
  // a golden oval covered in diamond scales
  return lathe([[0, -1.0], [0.55, -0.95], [0.75, -0.4], [0.75, 0.4], [0.5, 0.9], [0.2, 1.0], [0, 1.0]], 28, (x, y, z) => {
    const a = Math.atan2(z, x);
    const d = Math.abs(Math.sin(a * 6 + y * 6)) + Math.abs(Math.sin(a * 6 - y * 6));
    return C.setScalar(d < 0.45 ? 0.55 : 0.95 + noise3(x * 8, y * 8, z * 8) * 0.1).clone();
  }, (x, y, z) => {
    const a = Math.atan2(z, x);
    return (Math.abs(Math.sin(a * 6 + y * 6)) + Math.abs(Math.sin(a * 6 - y * 6))) * 0.025;
  });
}

function onion() {
  // papery bulb with fine vertical lines
  return lathe([[0, -0.75], [0.55, -0.7], [0.95, -0.25], [0.95, 0.15], [0.55, 0.62], [0.18, 0.9], [0.08, 1.2], [0, 1.2]], 22, (x, y, z) => C.setScalar(0.85 + (Math.sin(Math.atan2(z, x) * 14) > 0.7 ? 0.15 : 0) + noise3(x * 6, y * 6, z * 6) * 0.08).clone());
}

function shallot() {
  // a slim teardrop bulb, a little pointed at the neck
  return lathe([[0, -0.9], [0.45, -0.8], [0.7, -0.35], [0.66, 0.2], [0.36, 0.7], [0.12, 1.05], [0, 1.1]], 20, (x, y, z) => C.setScalar(0.86 + (Math.sin(Math.atan2(z, x) * 12) > 0.75 ? 0.12 : 0) + noise3(x * 6, y * 6, z * 6) * 0.08).clone());
}

function leek() {
  // a long pale shank with a hint of roots at the base
  return lathe([[0, -1.0], [0.3, -0.95], [0.34, -0.8], [0.3, 0.2], [0.26, 1.0], [0, 1.05]], 16, (x, y, z) => C.setScalar(0.95 - Math.max(0, y) * 0.25 + noise3(x * 8, y * 3, z * 8) * 0.05).clone());
}

// ---- late orchard fruit

const cone = new THREE.ConeGeometry(1, 1, 5);
cone.translate(0, 0.5, 0);
const up = new THREE.Vector3(0, 1, 0);
// short spikes or scales standing out of a surface point along its normal
function spikes(n: number, seed: number, place: (i: number) => [THREE.Vector3, number], color: string | ((i: number) => string), len: number, w: number) {
  const out: THREE.BufferGeometry[] = [];
  for (let i = 0; i < n; i++) {
    const [p, s] = place(i);
    const dir = p.clone().normalize();
    const q = new THREE.Quaternion().setFromUnitVectors(up, dir);
    const m = new THREE.Matrix4().compose(p, q, new THREE.Vector3(w * s, len * s, w * s));
    out.push(solid(cone, typeof color === 'string' ? color : color(i + seed), m));
  }
  return out;
}
// evenly spread points on an ellipsoid (golden spiral)
const spiral = (i: number, n: number, rx: number, ry: number) => {
  const y = 1 - (2 * (i + 0.5)) / n, r = Math.sqrt(1 - y * y), a = i * 2.39996;
  return new THREE.Vector3(Math.cos(a) * r * rx, y * ry, Math.sin(a) * r * rx);
};
const leafAt = (x: number, y: number, rz: number, color = '#4f9e36', s = 1) => solid(leafGeo, color, new THREE.Matrix4().makeTranslation(x, y, 0).multiply(new THREE.Matrix4().makeRotationZ(rz)).multiply(new THREE.Matrix4().makeScale(0.32 * s, 0.05 * s, 0.13 * s)));
const merge = (parts: THREE.BufferGeometry[]) => mergeGeometries(parts) as THREE.BufferGeometry;
const small = (g: THREE.BufferGeometry, s: number, x: number, y: number, z = 0) => { g.scale(s, s, s); g.translate(x, y, z); return g; };

function tangerine() {
  // a squat, loose skinned mandarin in deep orange
  const g = lathe(round(20).map(([r, y]) => [r, y * 0.8]), 28, (x, y, z) => mix('#e05a00', '#ff8a10', 0.5 + (noise3(x * 5, y * 5, z * 5) - 0.5) * 0.8), (x, y, z) => (noise3(x * 30, y * 30, z * 30) - 0.5) * 0.04);
  return merge([g, leafAt(0.2, 0.8, -0.4, '#3f8a2a')]);
}
function bloodOrange() {
  const g = lathe(round(20).map(([r, y]) => [r, y * 0.96]), 28, (x, y, z) => mix('#e86a10', '#a8201a', 0.35 + x * 0.3 + (noise3(x * 3, y * 3, z * 3) - 0.5) * 0.9), (x, y, z) => (noise3(x * 40, y * 40, z * 40) - 0.5) * 0.03);
  return merge([g, solid(leafGeo, '#5a8a2a', new THREE.Matrix4().makeTranslation(0, 0.95, 0).multiply(new THREE.Matrix4().makeScale(0.14, 0.05, 0.14)))]);
}
function kumquat() {
  // a little oval citrus, eaten skin and all
  const g = lathe(round(16).map(([r, y]) => [r * 0.8, y * 1.05]), 20, (x, y, z) => mix('#f07a00', '#ffa82a', 0.5 + (noise3(x * 6, y * 6, z * 6) - 0.5) * 0.7), (x, y, z) => (noise3(x * 35, y * 35, z * 35) - 0.5) * 0.03);
  return merge([g, leafAt(0.18, 1.0, -0.5, '#2f7a2a', 0.8)]);
}
function yuzu() {
  // a knobbly, lumpy bright yellow citrus
  const g = lathe(round(20).map(([r, y]) => [r, y * 0.9]), 28, (x, y, z) => mix('#e8b400', '#fbd82a', 0.5 + (noise3(x * 5, y * 5, z * 5) - 0.5) * 0.7), (x, y, z) => (noise3(x * 4, y * 4, z * 4) - 0.5) * 0.14 + (noise3(x * 30, y * 30, z * 30) - 0.5) * 0.05);
  return merge([g, leafAt(0.2, 0.9, -0.4, '#3a8a2e')]);
}
function nectarine() {
  // smooth and glossy: a peach without the fuzz, deep red over gold
  const g = lathe([[0, -0.85], [0.5, -0.78], [0.92, -0.35], [0.98, 0.1], [0.78, 0.6], [0.35, 0.9], [0.05, 0.82], [0, 0.78]], 26, (x, y, z) => mix('#f0b030', '#b8141e', 0.55 + x * 0.3 + y * 0.2 + (noise3(x * 4, y * 4, z * 4) - 0.5) * 0.5), (x, _y, z) => -Math.exp(-Math.pow(Math.atan2(z, x) / 0.18, 2)) * 0.07);
  return merge([g, leafAt(0.2, 0.9, -0.4)]);
}
function whitePeach() {
  const g = lathe([[0, -0.85], [0.5, -0.78], [0.92, -0.35], [0.98, 0.1], [0.78, 0.6], [0.35, 0.9], [0.05, 0.82], [0, 0.78]], 26, (x, y, z) => mix('#f6e8c8', '#ec8a8a', 0.25 + x * 0.35 + y * 0.2 + (noise3(x * 4, y * 4, z * 4) - 0.5) * 0.6), (x, _y, z) => -Math.exp(-Math.pow(Math.atan2(z, x) / 0.18, 2)) * 0.08);
  return merge([g, leafAt(0.2, 0.9, -0.4)]);
}
function chestnut() {
  // a spiny green burr split open over two glossy brown nuts
  const burr = lathe(round(14).map(([r, y]) => [r * 0.9, y * 0.85]), 18, () => C.set('#8aa83a').clone());
  const parts = [burr, ...spikes(70, 0, (i) => [spiral(i, 70, 0.88, 0.8), 1], '#a8c050', 0.35, 0.05)];
  for (const x of [-0.28, 0.28]) {
    const nut = lathe(round(12).map(([r, y]) => [r * 0.55, y * 0.6]), 16, (px, py, pz) => (py < -0.3 ? C.set('#c8b890').clone() : mix('#5a2a10', '#8a4a1e', 0.5 + (noise3(px * 8, py * 20, pz * 8) - 0.5) * 0.6)));
    parts.push(small(nut, 1, x, 0.55, -0.1));
  }
  return merge(parts);
}
function papaya() {
  // long pear shaped fruit ripening from green to orange, flecked with dots
  return lathe([[0, -1.25], [0.45, -1.15], [0.72, -0.6], [0.7, 0.1], [0.55, 0.7], [0.3, 1.1], [0, 1.2]], 26, (x, y, z) => {
    const c = mix('#f09020', '#5a9a2a', 0.2 + y * 0.35 + (noise3(x * 3, y * 3, z * 3) - 0.5) * 0.5);
    if (noise3(x * 25, y * 25, z * 25) > 0.8) c.lerp(D.set('#3a6a1a'), 0.4);
    return c;
  }, (x, _y, z) => Math.abs(Math.cos(Math.atan2(z, x) * 2.5)) * 0.05);
}
function guava() {
  // a rounded pear with a bumpy lime to yellow skin and a crown at the tip
  const g = lathe([[0, -0.9], [0.55, -0.82], [0.95, -0.35], [0.95, 0.15], [0.7, 0.62], [0.3, 0.88], [0.08, 0.95], [0, 0.95]], 24, (x, y, z) => mix('#c8d850', '#7aa83a', 0.4 + y * 0.3 + (noise3(x * 5, y * 5, z * 5) - 0.5) * 0.6), (x, y, z) => (noise3(x * 12, y * 12, z * 12) - 0.5) * 0.06);
  const parts = [g];
  for (let i = 0; i < 5; i++) parts.push(solid(cone, '#5a4a2a', new THREE.Matrix4().makeTranslation(Math.cos(i * 1.26) * 0.08, -0.9, Math.sin(i * 1.26) * 0.08).multiply(new THREE.Matrix4().makeRotationX(Math.PI)).multiply(new THREE.Matrix4().makeScale(0.04, 0.12, 0.04))));
  return merge([...parts, leafAt(0.2, 0.95, -0.4)]);
}
function pistachio() {
  // a bunch of cream nuts blushed rose pink
  const parts: THREE.BufferGeometry[] = [solid(cyl, '#7a5a3a', new THREE.Matrix4().makeTranslation(0, -0.2, 0).multiply(new THREE.Matrix4().makeScale(0.04, 1.2, 0.04)))];
  for (let i = 0; i < 9; i++) {
    const a = i * 2.4, y = 0.7 - i * 0.12;
    const nut = lathe(round(10).map(([r, yy]) => [r * 0.6, yy]), 12, (x, py, z) => mix('#f0e0b0', '#d86a7a', 0.3 + py * 0.3 + (noise3(x * 6, py * 6, z * 6) - 0.5) * 0.7));
    parts.push(small(nut, 0.3, Math.cos(a) * 0.25, y, Math.sin(a) * 0.25));
  }
  return merge(parts);
}
function elderberry() {
  // a flat umbrella of tiny black purple berries on red stalks
  const parts: THREE.BufferGeometry[] = [];
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    parts.push(solid(cyl, '#a82a3a', new THREE.Matrix4().makeRotationY(-a).multiply(new THREE.Matrix4().makeRotationZ(-1.1)).multiply(new THREE.Matrix4().makeScale(0.03, 0.7, 0.03))));
  }
  const berry = lathe(round(8), 10, (x, y, z) => mix('#1a0a2a', '#4a1a4a', 0.4 + (noise3(x * 9, y * 9, z * 9) - 0.5)));
  for (let i = 0; i < 38; i++) {
    const r = Math.sqrt((i + 0.5) / 38) * 0.75, a = i * 2.4;
    parts.push(small(berry.clone(), 0.12, Math.cos(a) * r, 0.25 - r * r * 0.3, Math.sin(a) * r));
  }
  return merge(parts);
}
function dragonFruit() {
  // a hot pink oval covered in leafy scales with green tips
  const body = lathe(round(18).map(([r, y]) => [r * 0.8, y * 1.05]), 24, (x, y, z) => mix('#d8105a', '#f0408a', 0.5 + (noise3(x * 4, y * 4, z * 4) - 0.5) * 0.6));
  const sc = spikes(16, 0, (i) => { const p = spiral(i, 18, 0.78, 1.0); return [p, 1]; }, (i) => (i % 2 ? '#e0206a' : '#9ab82a'), 0.45, 0.16);
  return merge([body, ...sc]);
}
function pecan() {
  // an oval green husk with four ridges along it
  return lathe([[0, -1.0], [0.4, -0.85], [0.62, -0.3], [0.62, 0.3], [0.4, 0.85], [0, 1.0]], 24, (x, y, z) => mix('#4a7a2a', '#7aa83a', 0.5 + (noise3(x * 5, y * 5, z * 5) - 0.5) * 0.8), (x, _y, z) => Math.pow(Math.abs(Math.cos(Math.atan2(z, x) * 2)), 6) * 0.1);
}
function macadamia() {
  // a round green husk splitting to show the hard brown shell
  const husk = lathe(round(14), 18, (x, y, z) => (x > 0.35 && Math.abs(z) < 0.35 ? mix('#6a3a1a', '#8a5a2a', 0.5).clone() : mix('#4a7a2a', '#6a9a3a', noise3(x * 5, y * 5, z * 5))));
  return merge([husk, solid(cyl, '#5a4a2a', stem(0.95, 0.05, 0.2))]);
}
function jackfruit() {
  // huge and oblong, the skin a mass of little green knobs
  return lathe([[0, -1.2], [0.5, -1.1], [0.75, -0.5], [0.78, 0.2], [0.65, 0.8], [0.35, 1.15], [0, 1.2]], 30, (x, y, z) => mix('#8aa83a', '#c8c050', 0.4 + (noise3(x * 4, y * 4, z * 4) - 0.5) * 0.8), (x, y, z) => Math.pow(Math.abs(Math.sin(x * 22) * Math.sin(y * 20) * Math.sin(z * 22)), 0.5) * 0.06);
}
function durian() {
  // an olive green football of stout pyramid thorns
  const body = lathe([[0, -1.0], [0.55, -0.85], [0.82, -0.3], [0.82, 0.3], [0.55, 0.85], [0, 1.0]], 22, (x, y, z) => mix('#7a8a2a', '#a8a83a', 0.5 + (noise3(x * 4, y * 4, z * 4) - 0.5) * 0.6));
  return merge([body, ...spikes(80, 0, (i) => [spiral(i, 80, 0.8, 0.96), 1], (i) => (i % 3 ? '#8a9a30' : '#6a7a24'), 0.22, 0.09), solid(cyl, '#6a5a2a', stem(0.95, 0.07, 0.1))]);
}
function passionFruit() {
  // a round wrinkled purple fruit with pale freckles
  const g = lathe(round(18), 22, (x, y, z) => {
    const c = mix('#3a0a3a', '#6a1a5a', 0.5 + (noise3(x * 4, y * 4, z * 4) - 0.5) * 0.8);
    return noise3(x * 26, y * 26, z * 26) > 0.8 ? c.lerp(D.set('#d8c8d8'), 0.5) : c;
  }, (x, y, z) => (noise3(x * 10, y * 10, z * 10) - 0.5) * 0.08);
  return merge([g, solid(cyl, '#5a7a2a', stem(0.95, 0.05, 0.3))]);
}
function cashew() {
  // a juicy yellow red cashew apple with the kidney shaped nut hanging below
  const apple = lathe([[0, -0.3], [0.5, -0.25], [0.75, 0.2], [0.68, 0.8], [0.4, 1.1], [0, 1.15]], 22, (x, y, z) => mix('#f0c020', '#d8301a', 0.3 + x * 0.4 + y * 0.2 + (noise3(x * 4, y * 4, z * 4) - 0.5) * 0.5));
  const nut = solid(leafGeo, '#8a8a70', new THREE.Matrix4().makeTranslation(0.08, -0.55, 0).multiply(new THREE.Matrix4().makeRotationZ(0.5)).multiply(new THREE.Matrix4().makeScale(0.26, 0.4, 0.22)));
  return merge([apple, nut]);
}
function loquat() {
  // a little cluster of apricot orange ovals
  const one = () => lathe(round(12).map(([r, y]) => [r * 0.8, y * 0.95]), 16, (x, y, z) => mix('#f0a020', '#f8c040', 0.5 + (noise3(x * 5, y * 5, z * 5) - 0.5) * 0.7));
  return merge([small(one(), 0.55, -0.35, -0.2), small(one(), 0.55, 0.35, -0.3), small(one(), 0.55, 0, 0.25), solid(cyl, '#6a5a3a', new THREE.Matrix4().makeTranslation(0, 0.3, 0).multiply(new THREE.Matrix4().makeScale(0.04, 0.6, 0.04)))]);
}
function crabapple() {
  // three small tart red apples on long stems
  const one = () => lathe([[0, -0.78], [0.35, -0.85], [0.75, -0.6], [0.98, -0.1], [0.95, 0.35], [0.7, 0.72], [0.3, 0.8], [0.08, 0.66], [0, 0.62]], 16, (x, y, z) => mix('#e0a020', '#b8101a', 0.65 + y * 0.2 + (noise3(x * 5, y * 5, z * 5) - 0.5) * 0.6));
  const parts = [small(one(), 0.5, -0.4, -0.3), small(one(), 0.5, 0.4, -0.35), small(one(), 0.5, 0, -0.15, 0.35)];
  for (const [x, z] of [[-0.4, 0], [0.4, 0], [0, 0.35]]) parts.push(solid(cyl, '#6a4a2a', new THREE.Matrix4().makeTranslation(x, 0.1, z).multiply(new THREE.Matrix4().makeRotationZ(x * 0.8)).multiply(new THREE.Matrix4().makeScale(0.03, 0.6, 0.03))));
  return merge(parts);
}
function cinnamon() {
  // a bunch of small dark purple berries sitting in pale cups
  const parts: THREE.BufferGeometry[] = [];
  for (let i = 0; i < 6; i++) {
    const a = i * 2.4, y = 0.4 - i * 0.14, x = Math.cos(a) * 0.3, z = Math.sin(a) * 0.3;
    parts.push(small(lathe(round(10).map(([r, yy]) => [r * 0.8, yy]), 12, (px, py, pz) => mix('#2a1a3a', '#5a3a6a', 0.5 + (noise3(px * 8, py * 8, pz * 8) - 0.5))), 0.32, x, y, z));
    parts.push(small(lathe([[0, -0.4], [0.7, -0.2], [0.8, 0.1], [0.7, 0.12]], 10, () => C.set('#c8b890').clone()), 0.3, x, y - 0.2, z));
  }
  parts.push(solid(cyl, '#6a4a2a', new THREE.Matrix4().makeTranslation(0, -0.4, 0).multiply(new THREE.Matrix4().makeScale(0.04, 1.1, 0.04))));
  return merge(parts);
}
function mangosteen() {
  // a deep purple ball under a thick green cap of sepals
  const g = lathe(round(18).map(([r, y]) => [r, y * 0.9]), 24, (x, y, z) => mix('#2a0a1a', '#5a1a3a', 0.5 + (noise3(x * 4, y * 4, z * 4) - 0.5) * 0.7));
  const parts = [g, solid(cyl, '#6a5a2a', stem(0.95, 0.06, 0.1))];
  for (let i = 0; i < 4; i++) parts.push(solid(leafGeo, '#5a7a2a', new THREE.Matrix4().makeRotationY((i / 4) * Math.PI * 2).multiply(new THREE.Matrix4().makeTranslation(0.3, 0.82, 0)).multiply(new THREE.Matrix4().makeRotationZ(-0.4)).multiply(new THREE.Matrix4().makeScale(0.36, 0.1, 0.28))));
  return merge(parts);
}
function blackCherry() {
  const one = (x: number) => {
    const g = lathe([[0, -0.8], [0.6, -0.7], [0.95, -0.15], [0.9, 0.35], [0.45, 0.72], [0.12, 0.62], [0, 0.55]], 18, (px, py, pz) => mix('#12020a', '#4a0a1a', 0.4 + py * 0.3 + (noise3(px * 8, py * 8, pz * 8) - 0.5) * 0.4));
    return small(g, 0.62, x, -0.3);
  };
  const s = (x: number) => solid(cyl, '#5f7a2a', new THREE.Matrix4().makeTranslation(x, 0.05, 0).multiply(new THREE.Matrix4().makeRotationZ(x > 0 ? 0.45 : -0.45)).multiply(new THREE.Matrix4().makeScale(0.04, 1.1, 0.04)));
  return merge([one(-0.45), one(0.45), s(-0.45), s(0.45)]);
}
function silverPear() {
  // a slender pale green pear with a silvery bloom
  const g = lathe([[0, -0.9], [0.5, -0.82], [0.82, -0.4], [0.76, 0.05], [0.45, 0.45], [0.32, 0.85], [0.18, 1.05], [0, 1.07]], 24, (x, y, z) => mix('#b8c8a0', '#e0e8d0', 0.4 + y * 0.3 + (noise3(x * 5, y * 5, z * 5) - 0.5) * 0.5));
  return merge([g, solid(cyl, '#5a3a1f', stem(1.0, 0.05, 0.3))]);
}

function radish() {
  // round red root with a white tail
  const g = lathe([[0, -0.8], [0.4, -0.55], [0.9, -0.1], [0.92, 0.3], [0.6, 0.72], [0, 0.8]], 20, (x, y, z) => C.setScalar(0.9 + noise3(x * 5, y * 5, z * 5) * 0.15).clone());
  return g;
}

function cabbage() {
  // a tight round head with pale veins radiating from the base
  return lathe(round(18).map(([r, y]) => [r, y * 0.9]), 26, (x, y, z) => {
    const a = Math.atan2(z, x);
    const vein = Math.abs(Math.sin(a * 7 + y * 2)) < 0.12 ? 0.25 : 0;
    return C.setScalar(0.9 + vein + y * 0.08).clone();
  }, (x, y, z) => (noise3(x * 6, y * 6, z * 6) - 0.5) * 0.06);
}

function floret() {
  // broccoli head: a dome of little bumpy clusters
  const parts: THREE.BufferGeometry[] = [];
  for (let i = 0; i < 14; i++) {
    const y = 0.2 + (i / 14) * 0.6, a = i * 2.4;
    const r = Math.sqrt(Math.max(0, 1 - Math.pow((y - 0.2) / 0.7, 2))) * 0.62;
    const sp = new THREE.SphereGeometry(0.34, 10, 7);
    const pos = sp.getAttribute('position') as THREE.BufferAttribute;
    for (let k = 0; k < pos.count; k++) {
      const v = new THREE.Vector3().fromBufferAttribute(pos, k);
      v.multiplyScalar(1 + (noise3(v.x * 18 + i, v.y * 18, v.z * 18) - 0.5) * 0.25);
      pos.setXYZ(k, v.x, v.y, v.z);
    }
    sp.computeVertexNormals();
    sp.translate(Math.cos(a) * r, y, Math.sin(a) * r);
    sp.deleteAttribute('uv');
    parts.push(paint(sp.toNonIndexed(), () => C.setScalar(0.85 + (i % 4) * 0.05).clone()));
  }
  return mergeGeometries(parts) as THREE.BufferGeometry;
}

function apricot() {
  // small velvety fruit with a seam, orange with a rosy cheek
  return lathe([[0, -0.8], [0.6, -0.72], [0.95, -0.2], [0.95, 0.25], [0.6, 0.72], [0.12, 0.82], [0, 0.78]], 22, (x, y, z) => mix('#f6a23a', '#e0582a', 0.2 + x * 0.35 + y * 0.2 + (noise3(x * 4, y * 4, z * 4) - 0.5) * 0.5), (x, _y, z) => -Math.exp(-Math.pow(Math.atan2(z, x) / 0.16, 2)) * 0.06);
}

function lime() {
  const g = lathe(round(18).map(([r, y]) => [r, y * 0.95]), 24, (x, y, z) => mix('#3f8a1e', '#8ac83a', 0.45 + (noise3(x * 5, y * 5, z * 5) - 0.5) * 0.8), (x, y, z) => (noise3(x * 40, y * 40, z * 40) - 0.5) * 0.03);
  return g;
}

function fig() {
  // teardrop with a purple skin going green at the neck
  return lathe([[0, -0.85], [0.6, -0.78], [0.95, -0.3], [0.85, 0.2], [0.45, 0.62], [0.16, 0.92], [0.08, 1.05], [0, 1.05]], 22, (x, y, z) => mix('#3e1640', '#8a5a4a', Math.max(0, y) * 0.9 + (noise3(x * 6, y * 6, z * 6) - 0.5) * 0.3));
}

function olive() {
  // a little sprig: three oval olives, green to purple black
  const parts: THREE.BufferGeometry[] = [];
  const cols = ['#5a6a1a', '#3a2a3a', '#7a8a2a'];
  [[-0.35, 0, 0], [0.3, 0.1, 0.1], [0, -0.35, -0.2]].forEach(([x, y, z], i) => {
    const g = lathe(round(12).map(([r, yy]) => [r * 0.62, yy]), 14, () => C.set(cols[i]).clone());
    g.translate(x, y, z);
    parts.push(g);
  });
  parts.push(solid(leafGeo, '#8a9a7a', new THREE.Matrix4().makeTranslation(0.1, 0.55, 0).multiply(new THREE.Matrix4().makeRotationZ(-0.6)).multiply(new THREE.Matrix4().makeScale(0.5, 0.06, 0.14))));
  return mergeGeometries(parts) as THREE.BufferGeometry;
}

function walnut() {
  // still in its green husk, a few pale lenticel dots
  return lathe(round(16).map(([r, y]) => [r, y * 1.08]), 20, (x, y, z) => (noise3(x * 30, y * 30, z * 30) > 0.8 ? C.set('#c8d8a0').clone() : mix('#4a7a2a', '#6a9a3a', noise3(x * 5, y * 5, z * 5))));
}

function garlic() {
  // papery bulb made of plump cloves, with a pointed neck
  return lathe([[0, -0.7], [0.6, -0.65], [0.95, -0.2], [0.9, 0.2], [0.5, 0.55], [0.15, 0.8], [0.06, 1.1], [0, 1.1]], 24, (x, y, z) => C.setScalar(0.9 + noise3(x * 8, y * 8, z * 8) * 0.12).clone(), (x, _y, z) => Math.pow(Math.abs(Math.cos(Math.atan2(z, x) * 4)), 2) * 0.1 - 0.05);
}

function beet() {
  return lathe([[0, -1.2], [0.1, -0.9], [0.5, -0.5], [0.95, -0.05], [0.9, 0.35], [0.5, 0.7], [0, 0.78]], 20, (x, y, z) => C.setScalar(0.85 + noise3(x * 5, y * 5, z * 5) * 0.2).clone());
}

function peaPod() {
  // a curved pod swollen over the peas inside
  const parts: THREE.BufferGeometry[] = [];
  for (let i = 0; i < 6; i++) {
    const t = i / 5;
    const sp = new THREE.SphereGeometry(0.2 - Math.abs(t - 0.5) * 0.12, 10, 7);
    sp.scale(1, 1, 0.75);
    sp.translate(0, -t * 1.4 + 0.7, Math.sin(t * Math.PI) * 0.15);
    sp.deleteAttribute('uv');
    parts.push(paint(sp.toNonIndexed(), () => C.setScalar(0.9 + (i % 2) * 0.08).clone()));
  }
  return mergeGeometries(parts) as THREE.BufferGeometry;
}

function zucchini() {
  const g = lathe([[0, -1.8], [0.3, -1.7], [0.4, -1.1], [0.42, 1.0], [0.3, 1.6], [0, 1.7]], 16, (x, y, z) => C.setScalar(noise3(x * 30, y * 4, z * 30) > 0.6 ? 1.3 : 0.9).clone());
  g.rotateZ(Math.PI / 2);
  return g;
}

function sweetPotato() {
  // long lumpy tuber with a rosy skin
  const g = lathe([[0, -1.5], [0.25, -1.3], [0.5, -0.7], [0.55, 0.1], [0.45, 0.9], [0.2, 1.4], [0, 1.5]], 16, (x, y, z) => C.setScalar(0.85 + noise3(x * 6, y * 6, z * 6) * 0.2).clone(), (x, y, z) => (noise3(x * 5, y * 3, z * 5) - 0.5) * 0.25);
  g.rotateZ(Math.PI / 2);
  return g;
}

function tulip() {
  // six petals forming a deep cup, slightly flared at the rim
  return lathe([[0, -0.2], [0.35, -0.15], [0.62, 0.2], [0.7, 0.7], [0.66, 1.05], [0.5, 1.2]], 18, (x, y, z) => C.setScalar(0.8 + y * 0.2).clone(), (x, y, z) => Math.pow(Math.abs(Math.cos(Math.atan2(z, x) * 3)), 4) * 0.12 * Math.max(0, y));
}

function rose() {
  // a spiral of cupped petals: several nested open cups
  const parts: THREE.BufferGeometry[] = [];
  for (let k = 0; k < 4; k++) {
    const r = 1 - k * 0.22;
    const g = lathe([[0, -0.3], [r * 0.5, -0.2], [r * 0.95, 0.15], [r, 0.45 + k * 0.08]], 14, () => C.setScalar(0.72 + k * 0.1).clone(), (x, y, z) => Math.sin(Math.atan2(z, x) * (5 - k) + k) * 0.08 * Math.max(0, y));
    g.rotateY(k * 0.7);
    parts.push(g);
  }
  return mergeGeometries(parts) as THREE.BufferGeometry;
}

// ---------------------------------------------------------------- late game orchard

function quince() {
  // a lumpy golden pear with a fuzzy grey bloom near the stem
  const g = lathe([[0, -0.9], [0.6, -0.82], [0.95, -0.35], [0.92, 0.15], [0.62, 0.62], [0.3, 0.9], [0, 0.92]], 24, (x, y, z) => mix('#d8b82a', '#f2d84a', 0.5 + (noise3(x * 5, y * 5, z * 5) - 0.5) * 0.7).lerp(D.set('#c8c0a8'), Math.max(0, y - 0.4) * 0.6), (x, y, z) => (noise3(x * 3, y * 3, z * 3) - 0.5) * 0.12);
  return mergeGeometries([g, solid(cyl, '#5a3a1f', stem(0.85, 0.05, 0.3)), solid(leafGeo, '#5a9a3a', new THREE.Matrix4().makeTranslation(0.25, 0.95, 0).multiply(new THREE.Matrix4().makeRotationZ(-0.5)).multiply(new THREE.Matrix4().makeScale(0.32, 0.05, 0.14)))]) as THREE.BufferGeometry;
}

function almond() {
  // a velvety grey green hull split open on the almond inside
  const hull = lathe([[0, -0.95], [0.45, -0.7], [0.7, -0.1], [0.6, 0.45], [0.3, 0.85], [0, 1]], 18, (x, y, z) => mix('#8aa870', '#b8c8a0', noise3(x * 6, y * 6, z * 6)), (x, _y, z) => -Math.exp(-Math.pow(Math.atan2(z, x - 0.0) / 0.3, 2)) * 0.25);
  hull.scale(0.9, 0.9, 0.7);
  const nut = lathe([[0, -0.6], [0.3, -0.4], [0.38, 0.1], [0.2, 0.55], [0, 0.65]], 12, (x, y, z) => mix('#a0683a', '#c8905a', noise3(x * 12, y * 12, z * 12)));
  nut.scale(0.8, 0.8, 0.5);
  nut.translate(0.35, 0, 0.1);
  return mergeGeometries([hull, nut]) as THREE.BufferGeometry;
}

function mulberry() {
  // a long cluster of glossy purple black drupelets
  const parts: THREE.BufferGeometry[] = [];
  for (let i = 0; i < 30; i++) {
    const y = -1 + (i / 30) * 1.8, a = i * 2.4;
    const r = 0.45 * Math.sqrt(Math.max(0.1, 1 - Math.pow(y / 1.05, 2)));
    const sp = new THREE.SphereGeometry(0.26, 7, 5);
    sp.translate(Math.cos(a) * r, y, Math.sin(a) * r);
    sp.deleteAttribute('uv');
    parts.push(paint(sp.toNonIndexed(), () => mix('#2a0a2a', '#6a1a4a', (i % 4) / 3)));
  }
  parts.push(solid(cyl, '#6a8a3a', stem(0.8, 0.04, 0.1)));
  return mergeGeometries(parts) as THREE.BufferGeometry;
}

function grapefruit() {
  // big and round, a pitted yellow peel with a pink blush
  const g = lathe(round(20).map(([r, y]) => [r, y * 0.94]), 28, (x, y, z) => mix('#f2c83a', '#f08a6a', 0.3 + x * 0.35 + (noise3(x * 4, y * 4, z * 4) - 0.5) * 0.5), (x, y, z) => (noise3(x * 36, y * 36, z * 36) - 0.5) * 0.03);
  return g;
}

function persimmon() {
  // a squat glossy orange fruit under a four leaf green calyx
  const g = lathe([[0, -0.6], [0.55, -0.58], [0.95, -0.25], [1, 0.1], [0.85, 0.42], [0.4, 0.55], [0, 0.5]], 26, (x, y, z) => mix('#e0580a', '#f8962a', 0.5 + (noise3(x * 4, y * 4, z * 4) - 0.5) * 0.5 + y * 0.2));
  const parts = [g];
  for (let i = 0; i < 4; i++) {
    parts.push(solid(leafGeo, '#4a7a2a', new THREE.Matrix4().makeRotationY((i / 4) * Math.PI * 2).multiply(new THREE.Matrix4().makeTranslation(0.25, 0.56, 0)).multiply(new THREE.Matrix4().makeScale(0.3, 0.05, 0.16))));
  }
  parts.push(solid(cyl, '#4a3a1f', stem(0.56, 0.06, 0)));
  return mergeGeometries(parts) as THREE.BufferGeometry;
}

function dates() {
  // a hanging strand of sticky brown dates
  const parts: THREE.BufferGeometry[] = [];
  for (let i = 0; i < 9; i++) {
    const g = lathe(round(10).map(([r, y]) => [r * 0.45, y * 0.75]), 12, (x, y, z) => mix('#4a1e0a', '#9a4a1a', 0.4 + (noise3(x * 8, y * 8, z * 8) - 0.5) * 0.8), (x, y, z) => (noise3(x * 20, y * 20, z * 20) - 0.5) * 0.05);
    const a = i * 2.2, r = 0.25 + (i % 3) * 0.12;
    g.translate(Math.cos(a) * r, -0.2 - i * 0.12, Math.sin(a) * r);
    parts.push(g);
  }
  parts.push(solid(cyl, '#c8902a', new THREE.Matrix4().makeTranslation(0, -1.2, 0).multiply(new THREE.Matrix4().makeScale(0.05, 1.3, 0.05))));
  return mergeGeometries(parts) as THREE.BufferGeometry;
}

function lychee() {
  // a pair of bumpy rosy red fruit on a twig
  const one = (x: number, y: number) => {
    const g = lathe(round(14).map(([r, yy]) => [r, yy * 1.05]), 18, (px, py, pz) => mix('#a8182a', '#e8504a', 0.5 + (noise3(px * 7, py * 7, pz * 7) - 0.5) * 0.8), (px, py, pz) => Math.max(0, noise3(px * 9, py * 9, pz * 9) - 0.55) * 0.35);
    g.scale(0.6, 0.6, 0.6);
    g.translate(x, y, 0);
    return g;
  };
  return mergeGeometries([one(-0.35, -0.2), one(0.35, -0.35), solid(cyl, '#6a5a2a', new THREE.Matrix4().makeTranslation(0, 0.2, 0).multiply(new THREE.Matrix4().makeScale(0.04, 0.6, 0.04)))]) as THREE.BufferGeometry;
}

function hazelnut() {
  // a round brown nut in a frilly green husk
  const nut = lathe(round(14).map(([r, y]) => [r * 0.8, y * 0.85]), 18, (x, y, z) => mix('#6a3a1a', '#a8683a', 0.5 + y * 0.3 + (noise3(x * 10, y * 30, z * 10) - 0.5) * 0.5));
  const parts = [nut];
  for (let i = 0; i < 6; i++) {
    parts.push(solid(leafGeo, '#7aa84a', new THREE.Matrix4().makeRotationY((i / 6) * Math.PI * 2).multiply(new THREE.Matrix4().makeTranslation(0.45, 0.45, 0)).multiply(new THREE.Matrix4().makeRotationZ(0.9)).multiply(new THREE.Matrix4().makeScale(0.45, 0.06, 0.22))));
  }
  return mergeGeometries(parts) as THREE.BufferGeometry;
}

function starfruit() {
  // five deep ribs make a star in cross section, waxy yellow with green edges
  return lathe([[0, -1.1], [0.35, -0.9], [0.6, -0.3], [0.62, 0.3], [0.4, 0.9], [0, 1.1]], 40, (x, y, z) => {
    const rib = Math.abs(Math.cos(Math.atan2(z, x) * 2.5));
    return mix('#e8c21a', '#8ab82a', rib * 0.5 + (noise3(x * 5, y * 5, z * 5) - 0.5) * 0.3);
  }, (x, _y, z) => (Math.pow(Math.abs(Math.cos(Math.atan2(z, x) * 2.5)), 3) - 0.4) * 0.55);
}

function mapleSyrup() {
  // a pair of red maple keys (samaras) with papery wings
  const parts: THREE.BufferGeometry[] = [];
  for (const s of [-1, 1]) {
    const seed = new THREE.SphereGeometry(0.22, 10, 8);
    seed.translate(s * 0.15, -0.3, 0);
    seed.deleteAttribute('uv');
    parts.push(paint(seed.toNonIndexed(), () => C.set('#8a2a1a').clone()));
    parts.push(solid(leafGeo, '#d8442a', new THREE.Matrix4().makeTranslation(s * 0.55, 0.1, 0).multiply(new THREE.Matrix4().makeRotationZ(s * 0.9)).multiply(new THREE.Matrix4().makeScale(0.55, 0.22, 0.04))));
  }
  return mergeGeometries(parts) as THREE.BufferGeometry;
}

function cocoaPod() {
  // a long ribbed pod ripening from green to orange and red brown
  const g = lathe([[0, -1.3], [0.3, -1.1], [0.6, -0.5], [0.66, 0.2], [0.5, 0.85], [0.22, 1.2], [0, 1.3]], 30, (x, y, z) => mix('#d8781a', '#8a2a1a', 0.3 + y * 0.25 + (noise3(x * 4, y * 4, z * 4) - 0.5) * 0.6).lerp(D.set('#c8a82a'), Math.max(0, -y - 0.6) * 0.5), (x, _y, z) => Math.abs(Math.cos(Math.atan2(z, x) * 5)) * 0.1 - 0.05);
  g.scale(0.8, 0.8, 0.8);
  return g;
}

function sakura() {
  // a spray of five petal pink blossoms with pale centers
  const parts: THREE.BufferGeometry[] = [];
  const spots: [number, number, number][] = [[0, 0.2, 0], [-0.45, -0.1, 0.2], [0.45, -0.15, -0.1], [0.05, -0.45, 0.3]];
  spots.forEach(([bx, by, bz], k) => {
    for (let i = 0; i < 5; i++) {
      const p = new THREE.SphereGeometry(1, 8, 5);
      p.scale(0.26, 0.06, 0.2);
      p.translate(0.24, 0, 0);
      p.rotateY((i / 5) * Math.PI * 2 + k);
      p.rotateX(-0.5);
      p.translate(bx, by, bz);
      p.deleteAttribute('uv');
      parts.push(paint(p.toNonIndexed(), () => mix('#f7c6da', '#e8789a', (i % 2) * 0.35 + k * 0.08)));
    }
    const c = new THREE.SphereGeometry(0.09, 8, 6);
    c.translate(bx, by + 0.03, bz);
    c.deleteAttribute('uv');
    parts.push(paint(c.toNonIndexed(), () => C.set('#f2d23a').clone()));
  });
  return mergeGeometries(parts) as THREE.BufferGeometry;
}

function goldenApple() {
  // an apple of pure polished gold, with a little green leaf
  const prof: [number, number][] = [[0, -0.78], [0.35, -0.85], [0.75, -0.6], [0.98, -0.1], [0.95, 0.35], [0.7, 0.72], [0.3, 0.8], [0.08, 0.66], [0, 0.62]];
  const body = lathe(prof, 28, (x, y, z) => mix('#b8860a', '#ffe070', 0.55 + y * 0.35 + (noise3(x * 3, y * 3, z * 3) - 0.5) * 0.3));
  return mergeGeometries([body, solid(cyl, '#6a4a1a', stem(0.6, 0.05, 0.25)), solid(leafGeo, '#4f9e36', new THREE.Matrix4().makeTranslation(0.22, 0.86, 0).multiply(new THREE.Matrix4().makeRotationZ(-0.5)).multiply(new THREE.Matrix4().makeScale(0.3, 0.05, 0.14)))]) as THREE.BufferGeometry;
}

const makers: Record<string, () => THREE.BufferGeometry> = {
  quince, almond, mulberry, grapefruit, persimmon, date: dates, lychee, hazelnut, starfruit, maple_syrup: mapleSyrup, cocoa_pod: cocoaPod, sakura, golden_apple: goldenApple,
  tulip, rose, soybean: peaPod,
  apricot, lime, fig, olive, walnut, garlic, beet, pea: peaPod, zucchini, sweet_potato: sweetPotato,
  apple, cherry, orange, peach, lemon, coconut, tomato, strawberry, chili,
  pear, plum, mango, avocado, pomegranate, banana,
  bell_pepper: bellPepper, eggplant, raspberry, cucumber, grape: grapes, pineapple, onion, radish, shallot, leek, cabbage,
  tangerine, blood_orange: bloodOrange, kumquat, yuzu, nectarine, white_peach: whitePeach, chestnut, papaya, guava, pistachio, elderberry,
  dragon_fruit: dragonFruit, pecan, macadamia, jackfruit, durian, passion_fruit: passionFruit, cashew, loquat, crabapple, cinnamon, mangosteen,
  black_cherry: blackCherry, silver_pear: silverPear, broccoli: floret,
};
const cache = new Map<string, THREE.BufferGeometry>();
export function produceGeo(kind: string) {
  let g = cache.get(kind);
  if (!g && makers[kind]) { g = makers[kind](); cache.set(kind, g); }
  return g ?? null;
}

export const PRODUCE_MAT = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.32, metalness: 0 });
