// Detailed crop models. Each crop is two merged meshes: the plant (vertex colored) and its
// produce (one geometry, so the renderer can tint it green while unripe). Geometry is built once
// per crop and shared by every plant on the farm.
import * as THREE from 'three';
import type { CropDef } from '../data';
import { Kit, P, blade, cylinder, lump, ribs, tip, type V3 } from './kit';

const r = (i: number, s: number) => {
  let h = Math.imul(i | 0, 374761393) ^ Math.imul(s | 0, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};

const shade = (hex: string, l: number) => '#' + new THREE.Color(hex).offsetHSL(0, 0, l).getHexString();

export interface CropGeo { plant: THREE.BufferGeometry; fruit: THREE.BufferGeometry }

function leaves(k: Kit, n: number, color: string, len: number, width: number, y: number, tilt: number, seed: number) {
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + r(i, seed) * 0.8;
    k.add(blade(len * (0.8 + r(i, seed + 1) * 0.4), width, 0.5), shade(color, (r(i, seed + 2) - 0.5) * 0.08), [0, y, 0], [tilt + r(i, seed + 3) * 0.3, a, 0]);
  }
}

function build(cd: CropDef): CropGeo {
  const plant = new Kit(), fruit = new Kit();
  const L = cd.leaf, F = cd.fruit;
  const dark = shade(L, -0.1);
  const W = '#ffffff';
  switch (cd.shape) {
    case 'grain': {
      // a dense clump of stalks with heavy, slightly nodding ears
      const rice = cd.id === 'rice';
      for (let i = 0; i < 11; i++) {
        const a = r(i, 1) * Math.PI * 2, d = Math.sqrt(r(i, 2)) * 0.09;
        const x = Math.cos(a) * d, z = Math.sin(a) * d;
        const h = 0.26 + r(i, 3) * 0.1;
        const lx = (r(i, 4) - 0.5) * 0.25, lz = (r(i, 5) - 0.5) * 0.25;
        plant.add(cylinder(0.004, 0.006, 5), shade(L, 0.05), [x, 0, z], [lx, 0, lz], [1, h, 1]);
        const top = tip([x, 0, z], [lx, 0, lz], h);
        if (rice) {
          for (let j = 0; j < 4; j++) fruit.add(P.sphere, W, [top[0] + (j - 1.5) * 0.008, top[1] - j * 0.018, top[2] + 0.01 + j * 0.008], [0, 0, 0], [0.008, 0.013, 0.008]);
        } else {
          fruit.add(P.sphere, W, top, [lx + 0.25, 0, lz], [0.014, 0.045, 0.014]);
          for (let j = 0; j < 3; j++) fruit.add(cylinder(0.0015, 0.0015, 3), W, [top[0], top[1] + 0.03, top[2]], [lx + 0.2 + (j - 1) * 0.25, 0, lz + (j - 1) * 0.2], [1, 0.05, 1]);
        }
      }
      leaves(plant, 6, dark, 0.14, 0.018, 0, 0.55, 7);
      break;
    }
    case 'stalk': {
      // corn: a thick stalk, long arching leaves, two cobs in husks and a tassel
      plant.add(cylinder(0.012, 0.02, 8), L, [0, 0, 0], [0, 0, 0], [1, 0.56, 1]);
      for (let i = 0; i < 6; i++) {
        plant.add(blade(0.24, 0.035, 0.9), shade(L, (i % 2) * 0.05), [0, 0.08 + i * 0.07, 0], [0.7 + (i % 2) * 0.2, i * 2.4, 0]);
      }
      for (let j = 0; j < 5; j++) plant.add(cylinder(0.001, 0.003, 3), '#d9c27a', [0, 0.55, 0], [(j - 2) * 0.3, j * 1.2, 0.3], [1, 0.07, 1]);
      for (const [y, a] of [[0.26, 0.4], [0.36, 3.5]]) {
        const cx = Math.sin(a) * 0.03, cz = Math.cos(a) * 0.03;
        fruit.add(P.sphere, W, [cx, y, cz], [0.35 * Math.cos(a), 0, -0.35 * Math.sin(a)], [0.022, 0.055, 0.022]);
        plant.add(blade(0.1, 0.05, 0.3), shade(L, 0.08), [cx * 0.8, y - 0.05, cz * 0.8], [0.3, a, 0]);
      }
      break;
    }
    case 'root': {
      if (cd.id === 'potato') {
        // bushy potato plant with a few tubers peeking out of the soil
        for (let i = 0; i < 5; i++) plant.add(lump(30 + i, 0.25, 12), shade(L, (r(i, 8) - 0.5) * 0.1), [(r(i, 1) - 0.5) * 0.12, 0.09 + r(i, 2) * 0.06, (r(i, 3) - 0.5) * 0.12], [0, 0, 0], [0.07, 0.055, 0.07]);
        for (let i = 0; i < 3; i++) fruit.add(lump(40 + i, 0.3, 10), W, [Math.cos(i * 2.1) * 0.09, 0.005, Math.sin(i * 2.1) * 0.09], [0, i, 0], [0.04, 0.028, 0.032]);
      } else {
        // carrot: a fan of feathery fronds over a fat orange shoulder
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * Math.PI * 2;
          plant.add(blade(0.27 + r(i, 1) * 0.08, 0.045, 0.6), shade(L, (r(i, 2) - 0.5) * 0.1), [0, 0.03, 0], [0.35 + r(i, 3) * 0.25, a, 0]);
        }
        fruit.add(cylinder(0.05, 0.03, 12), W, [0, -0.02, 0], [0, 0, 0], [1, 0.06, 1]);
        fruit.add(P.sphere, W, [0, 0.04, 0], [0, 0, 0], [0.05, 0.016, 0.05]);
      }
      break;
    }
    case 'bush': {
      const cotton = cd.id === 'cotton', straw = cd.id === 'strawberry', chili = cd.id === 'chili';
      const berry = cd.id === 'blueberry', coffee = cd.id === 'coffee_bean';
      if (berry || coffee) {
        // a leafy shrub hung with clusters of small berries or coffee cherries
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * Math.PI * 2;
          plant.add(lump(70 + i, 0.25, 12), shade(L, (r(i, 5) - 0.5) * 0.12), [Math.cos(a) * 0.065, 0.13 + r(i, 6) * 0.07, Math.sin(a) * 0.065], [0, a, 0], [0.07, 0.075, 0.07]);
        }
        plant.add(lump(77, 0.2, 12), shade(L, 0.06), [0, 0.22, 0], [0, 0, 0], [0.075, 0.07, 0.075]);
        for (let c = 0; c < 6; c++) {
          const a = (c / 6) * Math.PI * 2 + 0.25;
          const cx = Math.cos(a) * 0.1, cz = Math.sin(a) * 0.1, cy = 0.1 + r(c, 8) * 0.14;
          for (let j = 0; j < 4; j++) fruit.add(P.sphere, W, [cx + (r(j, c) - 0.5) * 0.03, cy - j * 0.012, cz + (r(j, c + 9) - 0.5) * 0.03], [0, 0, 0], coffee ? [0.012, 0.014, 0.012] : 0.014);
        }
        break;
      }
      const h = straw ? 0.08 : 0.14;
      if (cotton) for (let i = 0; i < 5; i++) plant.add(cylinder(0.003, 0.006, 4), '#7a5a3a', [0, 0, 0], [(r(i, 1) - 0.5) * 0.9, i * 1.3, 0], [1, 0.24, 1]);
      for (let i = 0; i < (straw ? 6 : 5); i++) {
        const a = (i / 5) * Math.PI * 2;
        const d = straw ? 0.08 : 0.06;
        plant.add(lump(50 + i, 0.25, 12), shade(L, (r(i, 5) - 0.5) * 0.12), [Math.cos(a) * d, h + r(i, 6) * 0.05, Math.sin(a) * d], [0, a, 0], straw ? [0.06, 0.04, 0.06] : [0.075, 0.07, 0.075]);
      }
      plant.add(lump(59, 0.2, 12), shade(L, 0.05), [0, h + 0.06, 0], [0, 0, 0], straw ? [0.06, 0.04, 0.06] : [0.08, 0.075, 0.08]);
      const n = cotton ? 7 : straw ? 7 : chili ? 7 : 6;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + 0.3;
        const d = straw ? 0.11 : 0.1;
        const y = straw ? 0.03 + r(i, 7) * 0.04 : h - 0.02 + r(i, 7) * 0.12;
        const p: V3 = [Math.cos(a) * d, y, Math.sin(a) * d];
        if (cotton) fruit.add(lump(60 + i, 0.35, 10), W, [p[0], p[1] + 0.04, p[2]], [0, 0, 0], 0.03);
        else if (straw) {
          fruit.add(P.sphere, W, p, [Math.PI, 0, 0.3], [0.018, 0.026, 0.018]);
          plant.add(P.sphere, '#3d8a2f', [p[0], p[1] + 0.022, p[2]], [0, 0, 0], [0.014, 0.005, 0.014]);
        } else if (chili) fruit.add(P.sphere, W, p, [0.2, a, 0.3], [0.011, 0.04, 0.011]);
        else {
          fruit.add(P.sphereHi, W, p, [0, 0, 0], [0.032, 0.029, 0.032]);
          plant.add(P.sphere, '#2f7a2a', [p[0], p[1] + 0.027, p[2]], [0, 0, 0], [0.014, 0.005, 0.014]);
        }
      }
      break;
    }
    case 'vine': {
      // pumpkin patch: broad leaves on the ground, curly vine, a ribbed pumpkin with a stem
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 + 0.4;
        plant.add(P.sphere, shade(L, (r(i, 1) - 0.5) * 0.12), [Math.cos(a) * 0.13, 0.025 + r(i, 2) * 0.02, Math.sin(a) * 0.13], [0.2, a, 0.15], [0.07, 0.012, 0.06]);
      }
      for (let i = 0; i < 10; i++) {
        const a = i * 0.6;
        plant.add(P.sphere, dark, [Math.cos(a) * (0.05 + i * 0.01), 0.02, Math.sin(a) * (0.05 + i * 0.01)], [0, 0, 0], 0.008);
      }
      if (cd.id === 'watermelon') fruit.add(P.sphereHi, W, [0, 0.07, 0], [0, 0.6, 0], [0.1, 0.085, 0.13]);
      else fruit.add(ribs(8), W, [0, 0.07, 0], [0, 0, 0], [0.1, 0.1, 0.1]);
      plant.add(cylinder(0.006, 0.01, 6), '#6b8a2a', [0, 0.13, 0], [0.3, 0, 0.2], [1, 0.05, 1]);
      break;
    }
    case 'flower': {
      // sunflower: tall stalk, heart shaped leaves, a nodding head with a seed disc
      plant.add(cylinder(0.008, 0.013, 8), L, [0, 0, 0], [0, 0, 0], [1, 0.5, 1]);
      for (let i = 0; i < 4; i++) plant.add(P.sphere, shade(L, (i % 2) * 0.06), [Math.cos(i * 2.2) * 0.05, 0.14 + i * 0.08, Math.sin(i * 2.2) * 0.05], [0.4, i * 2.2, 0], [0.045, 0.008, 0.06]);
      const head: V3 = [0, 0.5, 0.03];
      plant.add(cylinder(0.05, 0.05, 20), '#5a3417', head, [1.1, 0, 0], [1, 0.02, 1]);
      plant.add(P.sphere, '#3f2410', [0, 0.512, 0.04], [1.1, 0, 0], [0.042, 0.012, 0.042]);
      const H = new THREE.Matrix4().makeTranslation(head[0], head[1], head[2]).multiply(new THREE.Matrix4().makeRotationX(1.1));
      for (let i = 0; i < 14; i++) {
        const m = H.clone()
          .multiply(new THREE.Matrix4().makeRotationY((i / 14) * Math.PI * 2))
          .multiply(new THREE.Matrix4().makeTranslation(0, 0.012, 0.075))
          .multiply(new THREE.Matrix4().makeRotationX(Math.PI / 2))
          .multiply(new THREE.Matrix4().makeScale(0.018, 0.04, 0.006));
        fruit.addMatrix(P.sphere, W, m);
      }
      break;
    }
    case 'leafy': {
      // lettuce: a loose rosette of ruffled leaves around a tight pale heart
      for (let ring = 0; ring < 3; ring++) {
        const n = 7 - ring;
        for (let i = 0; i < n; i++) {
          const a = (i / n) * Math.PI * 2 + ring * 0.5;
          const d = 0.075 - ring * 0.022;
          plant.add(lump(80 + ring * 10 + i, 0.3, 12), shade(L, -0.08 + ring * 0.05), [Math.cos(a) * d, 0.035 + ring * 0.022, Math.sin(a) * d], [0.9 - ring * 0.25, -a + Math.PI / 2, 0], [0.055, 0.012, 0.07 - ring * 0.01]);
        }
      }
      fruit.add(lump(95, 0.2, 14), W, [0, 0.07, 0], [0, 0, 0], [0.045, 0.045, 0.045]);
      break;
    }
    case 'cane': {
      // sugarcane: jointed canes with pale nodes and a crown of long leaves
      for (let c = 0; c < 4; c++) {
        const x = (r(c, 1) - 0.5) * 0.09, z = (r(c, 2) - 0.5) * 0.09;
        const h = 0.48 + r(c, 3) * 0.1;
        const lean: V3 = [(r(c, 4) - 0.5) * 0.12, 0, (r(c, 5) - 0.5) * 0.12];
        plant.add(cylinder(0.014, 0.016, 8), shade(L, -0.05), [x, 0, z], lean, [1, h, 1]);
        for (let j = 1; j < 5; j++) fruit.add(cylinder(0.018, 0.018, 8), W, tip([x, 0, z], lean, (j / 5) * h), lean, [1, 0.012, 1]);
        const top = tip([x, 0, z], lean, h - 0.02);
        for (let i = 0; i < 4; i++) plant.add(blade(0.22, 0.028, 0.5), shade(L, (r(i, c) - 0.5) * 0.08), top, [0.9 + r(i, c + 3) * 0.3, (i / 4) * Math.PI * 2 + c, 0]);
      }
      break;
    }
  }
  if (fruit.empty) fruit.add(P.sphere, W, [0, -1, 0], [0, 0, 0], 0.001);
  const fg = fruit.build();
  if (cd.id === 'watermelon') {
    // dark green stripes running along the melon
    const pos = fg.getAttribute('position') as THREE.BufferAttribute, col = fg.getAttribute('color') as THREE.BufferAttribute;
    const ax = new THREE.Vector3(Math.sin(0.6), 0, Math.cos(0.6)), v = new THREE.Vector3(), side = new THREE.Vector3(Math.cos(0.6), 0, -Math.sin(0.6));
    for (let i = 0; i < pos.count; i++) {
      v.set(pos.getX(i), pos.getY(i) - 0.07, pos.getZ(i));
      const a = Math.atan2(v.y, v.dot(side));
      const k = Math.sin(a * 7 + Math.sin(v.dot(ax) * 60) * 0.5) > 0.15 ? 0.4 : 1;
      col.setXYZ(i, k, k, k);
    }
  }
  return { plant: plant.build(), fruit: fg };
}

const cache = new Map<string, CropGeo>();
export function cropGeo(cd: CropDef) {
  let g = cache.get(cd.id);
  if (!g) { g = build(cd); cache.set(cd.id, g); }
  return g;
}

export const PLANT_MAT = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.75, side: THREE.DoubleSide });
