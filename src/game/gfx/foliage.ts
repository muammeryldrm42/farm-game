// Instanced grass tufts and wild flowers that sway in the wind. The sway runs in the vertex
// shader, so thousands of blades cost one draw call per layer.
import * as THREE from 'three';
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

function flowerGeometry() {
  const stem = new THREE.CylinderGeometry(0.006, 0.008, 0.16, 4);
  stem.translate(0, 0.08, 0);
  const green = new THREE.Color('#4f9e36');
  const white = new THREE.Color('#ffffff');
  const paint = (g: THREE.BufferGeometry, c: THREE.Color) => {
    const n = (g.getAttribute('position') as THREE.BufferAttribute).count;
    const a = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { a[i * 3] = c.r; a[i * 3 + 1] = c.g; a[i * 3 + 2] = c.b; }
    g.setAttribute('color', new THREE.BufferAttribute(a, 3));
    return g;
  };
  const parts = [paint(stem.toNonIndexed(), green)];
  for (let i = 0; i < 5; i++) {
    const p = new THREE.SphereGeometry(0.026, 6, 4);
    p.scale(1, 0.35, 0.6);
    p.translate(0.026, 0, 0);
    p.rotateY((i / 5) * Math.PI * 2);
    p.translate(0, 0.165, 0);
    parts.push(paint(p.toNonIndexed(), white));
  }
  const eye = new THREE.SphereGeometry(0.014, 6, 4);
  eye.translate(0, 0.172, 0);
  parts.push(paint(eye.toNonIndexed(), new THREE.Color('#ffd23a')));
  for (const p of parts) { p.deleteAttribute('uv'); }
  return mergeGeometries(parts) as THREE.BufferGeometry;
}

export interface Spot { x: number; z: number; open: boolean }

const FLOWER_COLORS = ['#ffffff', '#ffd23a', '#ff8fb0', '#b58cff', '#ff6b6b', '#8fd3ff'];

export class Foliage {
  group = new THREE.Group();
  private grassGeos: THREE.BufferGeometry[] = [];
  private flowerGeo: THREE.BufferGeometry | null = null;
  private grassMat = windify(new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.DoubleSide, roughness: 0.95 }), 0.25, 1);
  private flowerMat = windify(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.8 }), 0.18, 0.8);
  private meshes: THREE.InstancedMesh[] = [];

  // tiles: every free tile the grass may grow on; density: tufts per open tile
  rebuild(tiles: Spot[], density: number) {
    for (const m of this.meshes) { this.group.remove(m); m.dispose(); }
    this.meshes = [];
    if (density <= 0 || !tiles.length) return;
    if (!this.grassGeos.length) for (let v = 0; v < 3; v++) this.grassGeos.push(tuftGeometry(100 + v * 31));
    if (!this.flowerGeo) this.flowerGeo = flowerGeometry();

    const tufts: [number, number, number, number, boolean][][] = this.grassGeos.map(() => []);
    const flowers: [number, number, number, number][] = [];
    tiles.forEach((t, ti) => {
      const n = t.open ? density : Math.max(1, Math.round(density * 0.35));
      for (let k = 0; k < n; k++) {
        const s = ti * 13 + k;
        const x = t.x + 0.08 + rnd(s, 1) * 0.84, z = t.z + 0.08 + rnd(s, 2) * 0.84;
        tufts[Math.floor(rnd(s, 3) * tufts.length)].push([x, z, rnd(s, 4) * Math.PI * 2, 0.75 + rnd(s, 5) * 0.6, t.open]);
      }
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
        col.setRGB(1, 1, 1).offsetHSL((rnd(i, v + 20) - 0.5) * 0.04, 0, (rnd(i, v + 21) - 0.5) * 0.12);
        if (!open) col.multiplyScalar(0.72);
        im.setColorAt(i, col);
      });
      im.receiveShadow = true;
      im.castShadow = false;
      this.meshes.push(im);
      this.group.add(im);
    });
    if (flowers.length) {
      const im = new THREE.InstancedMesh(this.flowerGeo, this.flowerMat, flowers.length);
      flowers.forEach(([x, z, r, c], i) => {
        q.setFromAxisAngle(up, r);
        m4.compose(pv.set(x, 0, z), q, sv.setScalar(0.9 + rnd(i, 30) * 0.4));
        im.setMatrixAt(i, m4);
        im.setColorAt(i, col.set(FLOWER_COLORS[Math.floor(c * FLOWER_COLORS.length)]));
      });
      im.receiveShadow = true;
      this.meshes.push(im);
      this.group.add(im);
    }
  }
}
