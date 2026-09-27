// Crops unlocked from level 25 on, each built as its own plant: grains, beans, berries, melons,
// flowers, herbs, greens and roots. Same rules as crops.ts: the plant is vertex colored and the
// produce is one grey shaded geometry that the renderer tints with the crop's fruit color.
import * as THREE from 'three';
import type { CropDef } from '../data';
import { Kit, P, blade, cylinder, lump, ruffledLeaf, type V3 } from './kit';
import { produceGeo } from './produce';

const r = (i: number, s: number) => {
  let h = Math.imul(i | 0, 374761393) ^ Math.imul(s | 0, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};
const shade = (hex: string, l: number) => '#' + new THREE.Color(hex).offsetHSL(0, 0, l).getHexString();
const W = '#ffffff', TAU = Math.PI * 2;

// a frame at `pos`, leaning `tilt` away from upright toward +z and then turned `yaw` about y
const frame = (pos: V3, yaw = 0, tilt = 0, roll = 0) =>
  new THREE.Matrix4().compose(new THREE.Vector3(...pos), new THREE.Quaternion().setFromEuler(new THREE.Euler(tilt, yaw, roll, 'YXZ')), new THREE.Vector3(1, 1, 1));
const S = (x: number, y: number, z: number) => new THREE.Matrix4().makeScale(x, y, z);
const T = (x: number, y: number, z: number) => new THREE.Matrix4().makeTranslation(x, y, z);
const Rx = (a: number) => new THREE.Matrix4().makeRotationX(a);
const Ry = (a: number) => new THREE.Matrix4().makeRotationY(a);
const end = (pos: V3, yaw: number, tilt: number, len: number): V3 => {
  const v = new THREE.Vector3(0, len, 0).applyMatrix4(frame([0, 0, 0], yaw, tilt));
  return [pos[0] + v.x, pos[1] + v.y, pos[2] + v.z];
};

function stem(k: Kit, color: string, pos: V3, yaw: number, tilt: number, len: number, rb = 0.005, rt = rb * 0.7) {
  k.addMatrix(cylinder(rt, rb, 6), color, frame(pos, yaw, tilt).multiply(S(1, len, 1)));
  return end(pos, yaw, tilt, len);
}
// an oval leaf (or petal) whose base sits at pos, pointing along the frame's +y
function oval(k: Kit, color: string, pos: V3, yaw: number, tilt: number, len: number, w: number, th = 0.004, roll = 0) {
  k.addMatrix(P.sphere, color, frame(pos, yaw, tilt, roll).multiply(T(0, len / 2, 0)).multiply(S(w, len / 2, th)));
}
function sword(k: Kit, color: string, pos: V3, yaw: number, tilt: number, len: number, w: number, bend = 0.5) {
  k.addMatrix(blade(len, w, bend), color, frame(pos, yaw, tilt));
}
function ruff(k: Kit, color: string, pos: V3, yaw: number, tilt: number, sx: number, sy: number, sz: number, seed: number) {
  k.addMatrix(ruffledLeaf(seed), color, frame(pos, yaw, tilt).multiply(S(sx, sy, sz)));
}
function ball(k: Kit, color: string, pos: V3, s: V3 | number) {
  k.add(P.sphere, color, pos, [0, 0, 0], s);
}
// a round flower: `n` petals around the flower's axis, which leans `tilt` from upright
function petals(k: Kit, color: string, center: V3, yaw: number, tilt: number, n: number, len: number, w: number, cup: number, spin = 0, th = 0.003) {
  const F = frame(center, yaw, tilt);
  for (let i = 0; i < n; i++) {
    const m = F.clone().multiply(Ry((i / n) * TAU + spin)).multiply(Rx(Math.PI / 2 - cup)).multiply(T(0, len * 0.5, 0)).multiply(S(w, len * 0.5, th));
    k.addMatrix(P.sphere, color, m);
  }
}
// leafy mound of foliage lumps
function mound(k: Kit, L: string, n: number, y: number, spread: number, size: V3, seed: number) {
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU + r(i, seed) * 0.5;
    k.add(lump(seed + i, 0.25, 12), shade(L, (r(i, seed + 1) - 0.5) * 0.12), [Math.cos(a) * spread, y + r(i, seed + 2) * 0.05, Math.sin(a) * spread], [0, a, 0], size);
  }
  k.add(lump(seed + 50, 0.2, 12), shade(L, 0.05), [0, y + 0.05, 0], [0, 0, 0], size);
}
// broad ground leaves of a melon or squash patch with a curling vine
function patch(k: Kit, L: string) {
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * TAU + 0.4;
    ruff(k, shade(L, (r(i, 1) - 0.5) * 0.12), [Math.cos(a) * 0.06, 0.01, Math.sin(a) * 0.06], a + Math.PI / 2, 1.25, 0.1, 0.13, 0.06, 150 + i);
  }
  for (let i = 0; i < 10; i++) ball(k, shade(L, -0.12), [Math.cos(i * 0.6) * (0.05 + i * 0.011), 0.02, Math.sin(i * 0.6) * (0.05 + i * 0.011)], 0.007);
  for (let i = 0; i < 3; i++) petals(k, '#f2c81a', [Math.cos(i * 2.2) * 0.13, 0.05, Math.sin(i * 2.2) * 0.13], 0, 0.3, 5, 0.018, 0.009, 0.5);
}
// several stalks with alternate lance leaves (grains and reeds); returns the tips
function stalks(k: Kit, L: string, n: number, h0: number, h1: number, spread: number, lean: number, seed: number, th = 0.004, leafLen = 0.12) {
  const tips: { p: V3; yaw: number; tilt: number }[] = [];
  for (let i = 0; i < n; i++) {
    const a = r(i, seed) * TAU, d = Math.sqrt(r(i, seed + 1)) * spread;
    const base: V3 = [Math.cos(a) * d, 0, Math.sin(a) * d];
    const yaw = a + Math.PI / 2 + (r(i, seed + 2) - 0.5), tilt = lean * (0.4 + r(i, seed + 3));
    const h = h0 + r(i, seed + 4) * (h1 - h0);
    const top = stem(k, shade(L, 0.04), base, yaw, tilt, h, th);
    for (let j = 0; j < 2; j++) sword(k, shade(L, (r(j, i + seed) - 0.5) * 0.1), end(base, yaw, tilt, h * (0.25 + j * 0.3)), yaw + (j ? 2.6 : -0.5), 0.9, leafLen, 0.014, 0.6);
    tips.push({ p: top, yaw, tilt });
  }
  return tips;
}


// fingers spread from one point like a hand (cassava, horse chestnut style leaves)
function palmate(k: Kit, color: string, pos: V3, yaw: number, tilt: number, n: number, len: number, w: number) {
  for (let i = 0; i < n; i++) oval(k, shade(color, (i % 2) * 0.04), pos, yaw + (i - (n - 1) / 2) * 0.45, tilt, len * (1 - Math.abs(i - (n - 1) / 2) * 0.12), w, 0.004);
}
// an umbrella of rays ending in little flower balls (dill, cilantro)
function umbel(k: Kit, stemC: string, flower: Kit, flowerC: string, c: V3, rays: number, rad: number, size: number) {
  for (let i = 0; i < rays; i++) {
    const a = (i / rays) * TAU, tip = stem(k, stemC, c, a, 1.0, rad, 0.0012);
    ball(flower, flowerC, [tip[0], tip[1] + 0.004, tip[2]], size);
  }
}
// a string of berries hanging from a point
function raceme(k: Kit, color: string, top: V3, n: number, r: number, len: number) {
  for (let i = 0; i < n; i++) ball(k, i % 3 ? color : '#dddddd', [top[0] + Math.sin(i * 1.7) * 0.006, top[1] - (i / n) * len, top[2] + Math.cos(i * 1.7) * 0.006], r * (1 - i / n * 0.3));
}

// second wave crops (levels 1 to 200); returns false when the crop is not one of them
function wave2(cd: CropDef, plant: Kit, fruit: Kit): boolean {
  const L = cd.leaf, dark = shade(L, -0.1);
  switch (cd.id) {
    // ---------------------------------------------------------------- third wave
    case 'swiss_chard': {
      // big crinkled dark leaves on thick glowing stalks
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * TAU, tilt = 0.3 + (i % 3) * 0.12;
        fruit.addMatrix(cylinder(0.006, 0.01, 7), i % 2 ? W : '#e0e0e0', frame([0, 0, 0], a, tilt).multiply(S(1, 0.13, 1)));
        ruff(plant, shade(L, (r(i, 1) - 0.5) * 0.12 - 0.05), end([0, 0, 0], a, tilt, 0.12), a, tilt + 0.3, 0.07, 0.15, 0.05, 900 + i);
      }
      return true;
    }
    case 'watercress': {
      // a low, dense mat of little round leaflets on trailing stems
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * TAU + r(i, 1) * 0.4, base: V3 = [0, 0.01, 0];
        const tilt = 1.1 + r(i, 2) * 0.3;
        stem(plant, shade(L, 0.1), base, a, tilt, 0.14, 0.0018);
        for (let j = 0; j < 5; j++) {
          const q = end(base, a, tilt, 0.03 + j * 0.025);
          for (const o of [-1, 1]) oval(j > 2 ? fruit : plant, j > 2 ? W : shade(L, (r(i, j) - 0.5) * 0.12), [q[0], q[1] + 0.01, q[2]], a + o * 1.2, 1.3, 0.016, 0.014, 0.003);
        }
      }
      return true;
    }
    case 'radicchio': {
      // a tight wine red head with white ribs, cupped by loose green outer leaves
      for (let i = 0; i < 7; i++) ruff(plant, shade(L, (r(i, 1) - 0.5) * 0.1), [0, 0.01, 0], (i / 7) * TAU, 1.15, 0.09, 0.14, 0.06, 910 + i);
      fruit.add(lump(920, 0.1, 18), W, [0, 0.06, 0], [0, 0, 0], [0.058, 0.055, 0.058]);
      for (let i = 0; i < 6; i++) ruff(fruit, '#e8e8e8', [0, 0.02, 0], (i / 6) * TAU + 0.3, 0.3, 0.05, 0.08, 0.04, 925 + i);
      return true;
    }
    case 'sorrel': {
      // upright arrow shaped leaves and a few rusty red seed spikes
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * TAU, tilt = 0.35 + (i % 3) * 0.12;
        const q = stem(plant, shade(L, 0.1), [0, 0, 0], a, tilt, 0.07, 0.002);
        oval(i % 2 ? fruit : plant, i % 2 ? W : shade(L, (r(i, 1) - 0.5) * 0.12), q, a, tilt, 0.13, 0.035, 0.004);
      }
      for (let s = 0; s < 3; s++) {
        const c = stem(plant, '#8a3a2a', [0, 0, 0], s * 2.1, 0.12, 0.3, 0.0025);
        for (let j = 0; j < 8; j++) ball(plant, '#a83a2a', [c[0], c[1] - j * 0.012, c[2]], 0.005);
      }
      return true;
    }
    case 'sweet_pea': {
      // a tripod of canes twined with tendrils and frilly, scented pea flowers
      for (let i = 0; i < 3; i++) {
        const a = (i / 3) * TAU, base: V3 = [Math.cos(a) * 0.1, 0, Math.sin(a) * 0.1];
        stem(plant, '#a88a5a', base, -a - Math.PI / 2, 0.2, 0.44, 0.004);
        for (let j = 0; j < 7; j++) {
          const q = end(base, -a - Math.PI / 2, 0.2, 0.05 + j * 0.055);
          oval(plant, shade(L, (r(i, j) - 0.5) * 0.12), q, a + j * 1.9, 1.2, 0.035, 0.018);
          if (j % 2) {
            const p: V3 = [q[0] * 1.35, q[1], q[2] * 1.35];
            petals(fruit, W, p, a, 1.2, 2, 0.022, 0.02, 0.2, j);
            petals(fruit, '#e8e8e8', [p[0], p[1] + 0.004, p[2]], a, 1.4, 1, 0.018, 0.015, 0.6, j);
          }
        }
      }
      return true;
    }
    case 'endive': {
      // frisee: a mop of very fine, curly leaves round a pale yellow heart
      for (let i = 0; i < 40; i++) {
        const a = i * 2.4, tilt = 0.5 + (i % 5) * 0.15;
        const heart = i > 28;
        ruff(heart ? fruit : plant, heart ? W : shade(L, (r(i, 1) - 0.5) * 0.14), [0, 0.01, 0], a, heart ? 0.3 : tilt, 0.018, heart ? 0.06 : 0.12, 0.02, 930 + (i % 9));
      }
      return true;
    }
    case 'zinnia':
    case 'cosmos': {
      // zinnias: stiff stems with layered, rounded blooms; cosmos: airy stems and wide eight petalled faces
      const cos = cd.id === 'cosmos';
      for (const { p, yaw, tilt } of stalks(plant, L, cos ? 9 : 6, cos ? 0.3 : 0.24, cos ? 0.4 : 0.3, 0.07, 0.15, 31, cos ? 0.002 : 0.0035, cos ? 0.04 : 0.07)) {
        if (cos) {
          petals(fruit, W, p, yaw, tilt * 0.6, 8, 0.03, 0.014, 0.15, r(p[0] * 20, 3));
          ball(plant, '#f0c020', p, [0.008, 0.005, 0.008]);
          for (let j = 0; j < 6; j++) stem(plant, shade(L, 0.05), end(p, yaw, tilt, -0.12 - j * 0.02), yaw + j * 1.1, 1.1, 0.04, 0.0006);
        } else {
          for (let ring = 0; ring < 3; ring++) petals(fruit, ring % 2 ? '#e8e8e8' : W, [p[0], p[1] + ring * 0.005, p[2]], yaw, tilt * 0.5, 12 - ring * 2, 0.03 - ring * 0.006, 0.012, 0.2 + ring * 0.35, ring * 0.3);
          ball(plant, '#e8a020', [p[0], p[1] + 0.012, p[2]], 0.007);
          for (let j = 0; j < 2; j++) oval(plant, dark, end(p, yaw, tilt, -0.1 - j * 0.06), yaw + j * Math.PI, 1.2, 0.05, 0.018);
        }
      }
      return true;
    }
    case 'sunchoke': {
      // tall rough stalks with little yellow sunflowers; knobbly tubers at the foot
      for (const { p, yaw, tilt } of stalks(plant, L, 4, 0.4, 0.48, 0.05, 0.08, 32, 0.006, 0.12)) {
        petals(plant, '#f0c020', p, yaw, 1.0, 12, 0.03, 0.01, 0.15, 1);
        ball(plant, '#7a4a1a', [p[0], p[1] + 0.004, p[2]], [0.014, 0.006, 0.014]);
        for (let j = 0; j < 3; j++) oval(plant, dark, end(p, yaw, tilt, -0.1 - j * 0.1), yaw + j * 2.1, 1.0, 0.08, 0.035);
      }
      for (let i = 0; i < 5; i++) fruit.add(lump(940 + i, 0.35, 10), W, [Math.cos(i * 1.3) * 0.06, 0.01, Math.sin(i * 1.3) * 0.06], [0, i, 0.4], [0.025, 0.02, 0.02]);
      return true;
    }
    case 'snapdragon':
    case 'lupin': {
      // tall spikes packed with flowers (snapdragons: plump lipped bells; lupins: pea flowers on a
      // cone), over a mound of leaves (lupins: hand shaped)
      const lup = cd.id === 'lupin';
      if (lup) for (let i = 0; i < 6; i++) {
        const a = (i / 6) * TAU, q = stem(plant, shade(L, 0.1), [0, 0, 0], a, 0.9, 0.08, 0.002);
        palmate(plant, L, q, a, 1.4, 9, 0.045, 0.008);
      }
      else for (let i = 0; i < 8; i++) oval(plant, shade(L, (r(i, 1) - 0.5) * 0.1), [0, 0.02, 0], (i / 8) * TAU, 1.0, 0.07, 0.016);
      for (let s = 0; s < (lup ? 4 : 5); s++) {
        const a = (s / (lup ? 4 : 5)) * TAU, tilt = 0.08 + r(s, 2) * 0.1, base: V3 = [Math.cos(a) * 0.03, 0, Math.sin(a) * 0.03];
        const h = 0.3 + r(s, 3) * 0.06;
        stem(plant, shade(L, 0.05), base, a, tilt, h, 0.003);
        const n = lup ? 16 : 9;
        for (let j = 0; j < n; j++) {
          const u = j / n, q = end(base, a, tilt, h * (0.45 + u * 0.55));
          const rr = lup ? 0.02 * (1 - u) + 0.006 : 0.012;
          const b = j * 2.4;
          fruit.add(lump(950 + (j % 5), 0.25, 8), j % 3 ? W : '#e8e8e8', [q[0] + Math.cos(b) * rr, q[1], q[2] + Math.sin(b) * rr], [0, b, 0], lup ? 0.009 : 0.013);
        }
      }
      return true;
    }
    case 'salsify': {
      // grass like blue green leaves, a purple flower or two and the pale root top
      for (let i = 0; i < 12; i++) sword(plant, shade('#7a9a8a', (r(i, 1) - 0.5) * 0.1), [0, 0.02, 0], (i / 12) * TAU, 0.3 + r(i, 2) * 0.4, 0.24, 0.01, 0.6);
      for (let k = 0; k < 2; k++) {
        const c = stem(plant, '#7a9a8a', [0, 0, 0], k * 3, 0.15, 0.3, 0.0025);
        petals(plant, '#8a4ab8', c, k * 3, 0.2, 10, 0.02, 0.006, 0.3);
      }
      fruit.add(cylinder(0.022, 0.014, 10), W, [0, -0.06, 0], [0, 0, 0], [1, 0.1, 1]);
      return true;
    }
    case 'celery': {
      // a bunch of thick ribbed stalks fanning out, leafy at the tips
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * TAU, tilt = 0.12 + (i % 3) * 0.06;
        const top = end([0, 0, 0], a, tilt, 0.22 + (i % 2) * 0.04);
        fruit.addMatrix(cylinder(0.008, 0.012, 7), i % 2 ? W : '#e4e4e4', frame([Math.cos(a) * 0.01, 0, Math.sin(a) * 0.01], a, tilt).multiply(S(1, 0.22 + (i % 2) * 0.04, 1)));
        for (let j = 0; j < 3; j++) ruff(plant, shade(L, (r(i, j) - 0.5) * 0.1), top, a + (j - 1) * 0.8, tilt + 0.5, 0.03, 0.05, 0.02, 700 + j);
      }
      return true;
    }
    case 'turnip':
    case 'rutabaga': {
      // a round root half out of the soil, purple shouldered, under a rosette of rough leaves
      const big = cd.id === 'rutabaga';
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * TAU;
        const q = stem(plant, shade(L, 0.1), [0, 0.05, 0], a, 0.5, 0.06, 0.004);
        ruff(plant, shade(big ? '#6a8a8a' : L, (r(i, 1) - 0.5) * 0.1), q, a, 0.6 + (i % 2) * 0.2, 0.07, 0.17, 0.05, 710 + i);
      }
      const R = big ? 0.055 : 0.045;
      fruit.add(P.sphereHi, W, [0, R * 0.55, 0], [0, 0, 0], [R, R * 0.92, R]);
      plant.add(P.sphereHi, big ? '#8a4a6a' : '#8a3a8a', [0, R * 0.95, 0], [0, 0, 0], [R * 0.9, R * 0.5, R * 0.9]);
      stem(plant, '#e8e0d0', [0, 0.005, 0], 0, Math.PI, 0.04, 0.003);
      return true;
    }
    case 'chives': {
      // a tuft of hollow blue green tubes with round purple pompoms
      for (let i = 0; i < 22; i++) {
        const a = r(i, 1) * TAU, d = Math.sqrt(r(i, 2)) * 0.05;
        stem(plant, shade(L, (r(i, 3) - 0.5) * 0.1), [Math.cos(a) * d, 0, Math.sin(a) * d], a, 0.1 + r(i, 4) * 0.2, 0.2 + r(i, 5) * 0.08, 0.003, 0.0015);
      }
      for (let i = 0; i < 5; i++) {
        const a = i * 1.26, top = stem(plant, shade(L, 0.1), [Math.cos(a) * 0.02, 0, Math.sin(a) * 0.02], a, 0.2, 0.28, 0.0025);
        fruit.add(lump(730 + i, 0.3, 10), W, top, [0, 0, 0], 0.017);
      }
      return true;
    }
    case 'parsley': {
      // a dense mound of tightly curled leaves on slim stems
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * TAU, tilt = 0.3 + r(i, 1) * 0.4;
        const top = stem(plant, shade(L, 0.12), [0, 0, 0], a, tilt, 0.12 + r(i, 2) * 0.05, 0.0025);
        for (let j = 0; j < 4; j++) ruff(i % 2 ? fruit : plant, i % 2 ? W : shade(L, (r(i, j) - 0.5) * 0.1), top, a + j * 1.57, 0.7, 0.025, 0.035, 0.02, 740 + j);
      }
      return true;
    }
    case 'arugula': {
      // a loose rosette of long, deeply lobed peppery leaves
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * TAU + r(i, 1) * 0.3, tilt = 0.9 + (i % 3) * 0.15, k = i < 8 ? plant : fruit;
        const col = i < 8 ? shade(L, (r(i, 2) - 0.5) * 0.1) : W;
        const base: V3 = [0, 0.01, 0];
        stem(plant, shade(L, 0.12), base, a, tilt, 0.12, 0.002);
        for (let j = 0; j < 4; j++) {
          const q = end(base, a, tilt, 0.04 + j * 0.035);
          for (const o of [-1, 1]) oval(k, col, q, a + o * 1.1, tilt + 0.3, 0.035 - j * 0.004, 0.014, 0.003);
        }
        oval(k, col, end(base, a, tilt, 0.17), a, tilt, 0.04, 0.02, 0.003);
      }
      return true;
    }
    case 'buckwheat': {
      // red stems, heart shaped leaves and frothy clusters of tiny pink white flowers
      for (const { p, yaw, tilt } of stalks(plant, L, 7, 0.24, 0.32, 0.07, 0.15, 21, 0.004, 0.06)) {
        for (let j = 0; j < 7; j++) ball(fruit, j % 2 ? W : '#eeeeee', [p[0] + Math.cos(j * 2.4) * 0.014, p[1] + (j % 3) * 0.006, p[2] + Math.sin(j * 2.4) * 0.014], 0.009);
        oval(plant, dark, end(p, yaw, tilt, -0.1), yaw + 1.2, 1.1, 0.04, 0.03);
      }
      return true;
    }
    case 'daikon': {
      // big feathery leaves over a long white radish pushing up out of the ground
      for (let i = 0; i < 9; i++) {
        const a = (i / 9) * TAU, base: V3 = [0, 0.1, 0];
        const q = stem(plant, shade(L, 0.1), base, a, 0.5, 0.12, 0.004);
        for (let j = 0; j < 3; j++) ruff(plant, shade(L, (r(i, j) - 0.5) * 0.1), end(base, a, 0.5, 0.04 + j * 0.04), a + (j % 2 ? 1 : -1) * 0.9, 1.0, 0.03, 0.05, 0.02, 750 + j);
        ruff(plant, L, q, a, 0.8, 0.04, 0.07, 0.02, 754);
      }
      fruit.add(cylinder(0.034, 0.03, 14), W, [0, -0.03, 0], [0, 0, 0], [1, 0.13, 1]);
      fruit.add(P.sphere, W, [0, 0.1, 0], [0, 0, 0], [0.034, 0.012, 0.034]);
      return true;
    }
    case 'dill': {
      // tall hollow stems with thread fine leaves and flat yellow flower umbrellas
      for (const { p, yaw, tilt } of stalks(plant, L, 6, 0.3, 0.4, 0.06, 0.1, 23, 0.003, 0.02)) {
        umbel(plant, shade(L, 0.1), fruit, W, p, 10, 0.045, 0.006);
        for (let j = 0; j < 4; j++) {
          const q = end(p, yaw, tilt, -0.1 - j * 0.05);
          for (let s = 0; s < 5; s++) stem(plant, shade(L, 0.05), q, yaw + s * 1.25, 1.1, 0.05, 0.0008);
        }
      }
      return true;
    }
    case 'fava_bean':
    case 'mung_bean': {
      // upright bean plants with grey green leaflets and pods standing out from the stems
      const fava = cd.id === 'fava_bean';
      for (let s = 0; s < (fava ? 4 : 6); s++) {
        const a = (s / (fava ? 4 : 6)) * TAU, base: V3 = [Math.cos(a) * 0.03, 0, Math.sin(a) * 0.03];
        const tilt = fava ? 0.08 : 0.35, h = fava ? 0.32 : 0.22;
        stem(plant, shade(L, 0.05), base, a, tilt, h, fava ? 0.006 : 0.003);
        for (let j = 0; j < 5; j++) {
          const q = end(base, a, tilt, 0.05 + j * (h / 5.5));
          for (let k = 0; k < 2; k++) oval(plant, shade(L, (r(s, j + k) - 0.5) * 0.12), q, a + j * 2.1 + k * Math.PI, 1.1, fava ? 0.04 : 0.035, fava ? 0.02 : 0.016);
          if (j > 0 && j % 2 === 0) {
            if (fava) fruit.addMatrix(P.sphere, W, frame(q, a + j, 0.6).multiply(T(0, 0.04, 0)).multiply(S(0.012, 0.045, 0.01)));
            else for (let k = 0; k < 3; k++) fruit.addMatrix(P.sphere, W, frame(q, a + j + k * 0.4, 2.4).multiply(T(0, 0.03, 0)).multiply(S(0.004, 0.032, 0.004)));
          }
          if (fava && j === 3) petals(plant, '#f4f0e8', [q[0], q[1] + 0.01, q[2]], a, 1.2, 4, 0.012, 0.008, 0.4);
        }
      }
      return true;
    }
    case 'poppy': {
      // hairy stems holding up four petalled crimson cups round a dark crown
      for (let i = 0; i < 6; i++) ruff(plant, shade('#7a9a7a', (r(i, 1) - 0.5) * 0.1), [0, 0.01, 0], (i / 6) * TAU, 1.1, 0.05, 0.1, 0.03, 760 + i);
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * TAU + 0.3, c = stem(plant, '#7a9a6a', [0, 0, 0], a, 0.2 + r(i, 2) * 0.15, 0.24 + r(i, 3) * 0.06, 0.0025);
        petals(fruit, W, c, a, 0.3, 4, 0.04, 0.036, 0.75, i, 0.004);
        ball(plant, '#1a1a1a', [c[0], c[1] + 0.008, c[2]], 0.009);
      }
      return true;
    }
    case 'kohlrabi': {
      // a swollen pale green bulb sitting on the soil, leaf stalks sprouting from its sides
      fruit.add(P.sphereHi, W, [0, 0.05, 0], [0, 0, 0], [0.055, 0.05, 0.055]);
      for (let i = 0; i < 7; i++) {
        const a = (i / 7) * TAU, y = 0.05 + (i % 3) * 0.015;
        const q = stem(plant, '#a8c890', [Math.cos(a) * 0.04, y, Math.sin(a) * 0.04], a, 0.5, 0.1, 0.003);
        oval(plant, shade(L, (r(i, 1) - 0.5) * 0.1), q, a, 0.7, 0.09, 0.045, 0.004);
      }
      return true;
    }
    case 'cilantro': {
      // lacy round leaves low down and white flower umbels on the taller stems
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * TAU, top = stem(plant, shade(L, 0.1), [0, 0, 0], a, 0.6, 0.1, 0.002);
        for (let j = 0; j < 3; j++) ruff(i % 2 ? fruit : plant, i % 2 ? W : shade(L, (r(i, j) - 0.5) * 0.1), top, a + (j - 1) * 0.7, 0.9, 0.025, 0.028, 0.012, 770 + j);
      }
      for (const { p } of stalks(plant, L, 3, 0.24, 0.3, 0.03, 0.15, 25, 0.002, 0.03)) umbel(plant, shade(L, 0.1), plant, '#f8f4f0', p, 8, 0.03, 0.005);
      return true;
    }
    case 'fennel': {
      // a fat white bulb of layered leaf bases, green stalks and clouds of feathery fronds
      for (let i = 0; i < 5; i++) fruit.add(P.sphereHi, i % 2 ? W : '#eeeeee', [(i - 2) * 0.01, 0.045, (i % 2) * 0.01], [0, i * 0.6, 0], [0.05 - i * 0.004, 0.05, 0.035]);
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * TAU, q = stem(plant, '#a8d080', [0, 0.07, 0], a, 0.2, 0.18, 0.006);
        for (let j = 0; j < 12; j++) stem(plant, shade(L, (r(i, j) - 0.5) * 0.1), q, a + j * 0.52, 0.5 + (j % 3) * 0.3, 0.07, 0.0008);
      }
      return true;
    }
    case 'blackberry': {
      // arching thorny canes with three part leaves and clusters of glossy drupelet berries
      for (let b = 0; b < 5; b++) {
        const a = (b / 5) * TAU;
        let p: V3 = [0, 0, 0];
        for (let s = 0; s < 4; s++) {
          const tilt = 0.2 + s * 0.35, q = stem(plant, '#6a3a3a', p, a, tilt, 0.09, 0.005 - s * 0.0007);
          for (let k = 0; k < 3; k++) oval(plant, shade(L, (r(b, s + k) - 0.5) * 0.12), q, a + (k - 1) * 0.7, tilt + 0.6, 0.04, 0.022);
          if (s > 0) {
            const bp = end(p, a, tilt, 0.05);
            for (let d = 0; d < 9; d++) ball(fruit, d % 2 ? W : '#dddddd', [bp[0] + Math.cos(d * 2.4) * 0.007, bp[1] - 0.02 - (d / 9) * 0.014, bp[2] + Math.sin(d * 2.4) * 0.007], 0.0075);
          }
          p = q;
        }
      }
      return true;
    }
    case 'spelt': {
      // tall stalks with flat, bearded ears
      for (const { p, yaw, tilt } of stalks(plant, L, 11, 0.38, 0.46, 0.09, 0.16, 26)) {
        fruit.addMatrix(P.sphere, W, frame(p, yaw, tilt + 0.2).multiply(T(0, 0.035, 0)).multiply(S(0.012, 0.045, 0.006)));
        for (let j = 0; j < 5; j++) fruit.addMatrix(cylinder(0.0006, 0.001, 3), '#e0e0e0', frame(end(p, yaw, tilt + 0.2, 0.01 + j * 0.012), yaw + (j % 2 ? 0.4 : -0.4), tilt + 0.25).multiply(S(1, 0.045, 1)));
      }
      return true;
    }
    case 'daffodil': {
      // blue green sword leaves and nodding trumpet flowers
      for (let i = 0; i < 10; i++) sword(plant, shade(L, (r(i, 1) - 0.5) * 0.1), [0, 0, 0], (i / 10) * TAU, 0.2 + r(i, 2) * 0.25, 0.2, 0.014, 0.3);
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * TAU + 0.2, c = stem(plant, shade(L, 0.05), [Math.cos(a) * 0.02, 0, Math.sin(a) * 0.02], a, 0.15, 0.24 + r(i, 3) * 0.05, 0.003);
        petals(fruit, W, c, a, 1.3, 6, 0.03, 0.014, 0.1, i);
        fruit.addMatrix(cylinder(0.014, 0.009, 10), '#e8e8e8', frame(c, a, 1.3).multiply(S(1, 0.028, 1)));
      }
      return true;
    }
    case 'oregano':
    case 'sage':
    case 'rosemary': {
      // woody little herb bushes: oval leaves (sage soft and grey, oregano small) or needles (rosemary)
      const rose = cd.id === 'rosemary', sageP = cd.id === 'sage';
      const n = rose ? 9 : 11;
      for (let s = 0; s < n; s++) {
        const a = (s / n) * TAU + r(s, 1) * 0.3, tilt = 0.25 + r(s, 2) * 0.35, h = rose ? 0.26 : 0.18;
        const base: V3 = [0, 0, 0];
        const top = stem(plant, rose ? '#7a6a4a' : shade(L, 0.1), base, a, tilt, h, 0.003);
        const steps = rose ? 10 : 5;
        for (let j = 0; j < steps; j++) {
          const q = end(base, a, tilt, 0.03 + j * (h - 0.03) / steps);
          const k = j >= steps - 2 ? fruit : plant, col = j >= steps - 2 ? W : shade(L, (r(s, j) - 0.5) * 0.12);
          if (rose) for (let o = 0; o < 4; o++) k.addMatrix(cylinder(0.0015, 0.002, 3), col, frame(q, a + o * 1.57 + j, 0.9).multiply(S(1, 0.03, 1)));
          else for (const o of [0, Math.PI]) oval(k, col, q, a + o + j * 1.57, 1.0, sageP ? 0.045 : 0.022, sageP ? 0.02 : 0.013, 0.004);
        }
        if (s % 3 === 0) ball(plant, rose ? '#a8b8e8' : sageP ? '#8a5ad8' : '#e8a8d0', [top[0], top[1] + 0.008, top[2]], 0.008);
      }
      return true;
    }
    case 'brussels_sprout': {
      // a tall thick stalk studded with little green sprouts under a topknot of leaves
      stem(plant, '#9ab880', [0, 0, 0], 0, 0, 0.34, 0.014, 0.011);
      for (let i = 0; i < 26; i++) {
        const a = i * 2.4, y = 0.05 + (i / 26) * 0.26;
        fruit.add(lump(780 + (i % 5), 0.15, 10), i % 2 ? W : '#e8e8e8', [Math.cos(a) * 0.022, y, Math.sin(a) * 0.022], [0, a, 0], 0.017);
      }
      for (let i = 0; i < 7; i++) ruff(plant, shade(L, (r(i, 1) - 0.5) * 0.1), [0, 0.33, 0], (i / 7) * TAU, 0.8, 0.07, 0.12, 0.05, 785 + i);
      for (let i = 0; i < 4; i++) stem(plant, '#9ab880', [0, 0.06 + i * 0.06, 0], i * 2.1, 1.3, 0.05, 0.003);
      return true;
    }
    case 'asparagus': {
      // spears pushing up through the soil, and a few tall ferny fronds behind them
      for (let i = 0; i < 10; i++) {
        const a = i * 2.4, d = Math.sqrt((i + 0.5) / 10) * 0.08, h = 0.1 + r(i, 1) * 0.08;
        const base: V3 = [Math.cos(a) * d, 0, Math.sin(a) * d];
        fruit.addMatrix(cylinder(0.006, 0.008, 7), W, frame(base, a, 0.05).multiply(S(1, h, 1)));
        fruit.add(P.sphere, '#dddddd', end(base, a, 0.05, h), [0, 0, 0], [0.007, 0.014, 0.007]);
      }
      for (let f = 0; f < 2; f++) {
        const c = stem(plant, shade(L, 0.05), [f ? 0.06 : -0.06, 0, -0.05], f * Math.PI, 0.15, 0.36, 0.004);
        for (let j = 0; j < 30; j++) stem(plant, shade(L, (r(f, j) - 0.5) * 0.1), [c[0], c[1] - 0.04 - (j / 30) * 0.2, c[2]], j * 2.4, 1.0 + (j % 3) * 0.2, 0.06, 0.0007);
      }
      return true;
    }
    case 'iris': {
      // a fan of flat sword leaves and tall stems of violet flowers with drooping falls
      for (let i = 0; i < 8; i++) sword(plant, shade(L, (r(i, 1) - 0.5) * 0.1), [(i - 3.5) * 0.012, 0, 0], i % 2 ? 0 : Math.PI, 0.1 + i * 0.03, 0.28, 0.022, 0.2);
      for (let i = 0; i < 3; i++) {
        const c = stem(plant, shade(L, 0.05), [(i - 1) * 0.04, 0, 0.02], i, 0.08, 0.34, 0.003);
        petals(fruit, W, c, 0, 0, 3, 0.04, 0.02, -0.6, i, 0.003);
        petals(fruit, '#dddddd', [c[0], c[1] + 0.01, c[2]], 0, 0, 3, 0.035, 0.016, 1.3, i + Math.PI / 3, 0.003);
        ball(plant, '#f0c020', [c[0], c[1] + 0.006, c[2]], 0.005);
      }
      return true;
    }
    case 'currant': {
      // a bushy shrub with maple like leaves and strings of shining berries hanging below
      for (let s = 0; s < 6; s++) {
        const a = (s / 6) * TAU, top = stem(plant, '#7a5a3a', [0, 0, 0], a, 0.4, 0.24, 0.004);
        for (let j = 0; j < 3; j++) {
          const q = end([0, 0, 0], a, 0.4, 0.08 + j * 0.06);
          ruff(plant, shade(L, (r(s, j) - 0.5) * 0.12), q, a + j * 2, 1.1, 0.04, 0.045, 0.03, 790 + j);
          if (j > 0) raceme(fruit, W, [q[0], q[1] - 0.01, q[2]], 7, 0.008, 0.05);
        }
        ruff(plant, L, top, a, 0.8, 0.04, 0.045, 0.03, 793);
      }
      return true;
    }
    case 'celeriac': {
      // a knobbly root bulb at the surface under a tuft of celery like stalks
      fruit.add(lump(800, 0.25, 14), W, [0, 0.035, 0], [0, 0, 0], [0.055, 0.045, 0.055]);
      for (let i = 0; i < 12; i++) stem(plant, '#d8c8a0', [Math.cos(i) * 0.04, 0.0, Math.sin(i) * 0.04], i * 2.4, 2.6, 0.03, 0.001);
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * TAU, q = stem(plant, '#a8d080', [0, 0.07, 0], a, 0.3, 0.14, 0.004);
        for (let j = 0; j < 3; j++) ruff(plant, shade(L, (r(i, j) - 0.5) * 0.1), q, a + (j - 1) * 0.8, 0.8, 0.03, 0.045, 0.02, 801 + j);
      }
      return true;
    }
    case 'tomatillo':
    case 'habanero': {
      // a sprawling bush: papery husk lanterns (tomatillo) or wrinkled lantern peppers (habanero)
      const husk = cd.id === 'tomatillo';
      mound(plant, L, 6, 0.1, 0.06, [0.055, 0.05, 0.055], 810);
      for (let i = 0; i < 4; i++) stem(plant, shade(L, -0.1), [0, 0, 0], i * 1.57 + 0.4, 0.6, 0.15, 0.004);
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * TAU + 0.2, d = 0.11, y = 0.07 + r(i, 7) * 0.08;
        const p: V3 = [Math.cos(a) * d, y, Math.sin(a) * d];
        if (husk) {
          fruit.add(lump(820 + i, 0.2, 10), W, p, [0, a, 0], [0.022, 0.028, 0.022]);
          ball(fruit, '#dddddd', [p[0], p[1] - 0.026, p[2]], [0.006, 0.01, 0.006]);
        } else {
          fruit.add(lump(830 + i, 0.3, 10), W, p, [0, a, 0], [0.018, 0.024, 0.018]);
          ball(fruit, '#dddddd', [p[0], p[1] - 0.022, p[2]], [0.006, 0.008, 0.006]);
        }
        stem(plant, '#4a7a2a', [p[0], p[1] + 0.02, p[2]], a, 0, 0.015, 0.0025);
      }
      return true;
    }
    case 'amaranth': {
      // tall stems with broad leaves and long drooping crimson tassels
      for (const { p, yaw, tilt } of stalks(plant, L, 4, 0.34, 0.42, 0.05, 0.08, 27, 0.006, 0.1)) {
        for (let t = 0; t < 3; t++) {
          const dir = yaw + (t - 1) * 1.1;
          for (let j = 0; j < 9; j++) {
            const u = j / 9, q = end(p, dir, 0.6 + u * 1.8, u * 0.12);
            ball(fruit, j % 2 ? W : '#dddddd', q, 0.013 - u * 0.004);
          }
        }
        for (let j = 0; j < 3; j++) oval(plant, shade(L, (j % 2) * 0.06), end(p, yaw, tilt, -0.12 - j * 0.07), yaw + j * 2.1, 1.1, 0.08, 0.04);
      }
      return true;
    }
    case 'carnation': {
      // narrow blue grey leaves and stiff stems carrying frilled double flowers
      for (let i = 0; i < 14; i++) sword(plant, shade(L, (r(i, 1) - 0.5) * 0.1), [0, 0, 0], (i / 14) * TAU, 0.6 + r(i, 2) * 0.3, 0.09, 0.008, 0.4);
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * TAU + 0.3, c = stem(plant, shade(L, 0.05), [0, 0, 0], a, 0.2 + r(i, 3) * 0.1, 0.25, 0.0025);
        plant.addMatrix(cylinder(0.008, 0.005, 8), shade(L, 0.1), frame(end(c, a, 0.2, -0.02), a, 0.2).multiply(S(1, 0.022, 1)));
        for (let ring = 0; ring < 3; ring++) petals(fruit, ring % 2 ? '#e8e8e8' : W, [c[0], c[1] + ring * 0.004, c[2]], a, 0.2, 9 - ring * 2, 0.024 - ring * 0.005, 0.014, 0.3 + ring * 0.4, ring);
      }
      return true;
    }
    case 'horseradish': {
      // big wavy upright leaves over a thick cream root crown
      for (let i = 0; i < 7; i++) ruff(plant, shade(L, (r(i, 1) - 0.5) * 0.1), [0, 0.02, 0], (i / 7) * TAU, 0.3 + (i % 3) * 0.1, 0.07, 0.28, 0.05, 840 + i);
      fruit.add(cylinder(0.03, 0.022, 12), W, [0, -0.04, 0], [0, 0, 0], [1, 0.08, 1]);
      fruit.add(lump(847, 0.2, 10), '#eeeeee', [0, 0.04, 0], [0, 0, 0], [0.03, 0.012, 0.03]);
      return true;
    }
    case 'lemongrass': {
      // a fountain of long arching blades from pale, fat stalk bases
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * TAU, base: V3 = [Math.cos(a) * 0.02, 0, Math.sin(a) * 0.02];
        fruit.addMatrix(cylinder(0.006, 0.009, 7), i % 2 ? W : '#e8e8e8', frame(base, a, 0.08).multiply(S(1, 0.1, 1)));
        for (let j = 0; j < 2; j++) sword(plant, shade(L, (r(i, j) - 0.5) * 0.12), end(base, a, 0.08, 0.09), a + (j - 0.5) * 0.5, 0.3 + j * 0.25, 0.3, 0.012, 0.9);
      }
      return true;
    }
    case 'sesame': {
      // upright stalks with paired leaves, pale bell flowers and oblong pods up the stem
      for (const { p, yaw, tilt } of stalks(plant, L, 6, 0.3, 0.38, 0.06, 0.08, 28, 0.004, 0.08)) {
        for (let j = 0; j < 5; j++) {
          const q = end(p, yaw, tilt, -0.02 - j * 0.035);
          fruit.addMatrix(P.sphere, j % 2 ? W : '#e8e8e8', frame(q, yaw + j * 2.1, 0.4).multiply(T(0, 0.012, 0)).multiply(S(0.005, 0.016, 0.005)));
        }
        petals(plant, '#f8f0f4', p, yaw, 1.4, 5, 0.012, 0.008, 1.0);
      }
      return true;
    }
    case 'lily': {
      // tall leafy stems with big recurved trumpet flowers and orange anthers
      for (let s = 0; s < 3; s++) {
        const a = (s / 3) * TAU, base: V3 = [Math.cos(a) * 0.03, 0, Math.sin(a) * 0.03];
        const c = stem(plant, shade(L, 0.05), base, a, 0.12, 0.34, 0.004);
        for (let j = 0; j < 7; j++) oval(plant, shade(L, (r(s, j) - 0.5) * 0.1), end(base, a, 0.12, 0.05 + j * 0.04), a + j * 2.4, 1.0, 0.06, 0.012);
        petals(fruit, W, c, a, 1.0, 6, 0.055, 0.017, -0.3, s);
        for (let k = 0; k < 5; k++) ball(plant, '#d8601a', end(c, a + k * 1.26, 1.0, 0.035), 0.004);
      }
      return true;
    }
    case 'yam':
    case 'taro':
    case 'cassava': {
      // yam: a heart leaved vine up a stake; taro: huge elephant ear leaves; cassava: tall stems with
      // hand shaped leaves. All three keep their tubers at the foot, showing just above the soil.
      if (cd.id === 'yam') {
        stem(plant, '#8a6a3a', [0, 0, 0], 0, 0, 0.4, 0.005);
        for (let j = 0; j < 10; j++) {
          const q: V3 = [Math.cos(j * 1.3) * 0.018, 0.04 + j * 0.036, Math.sin(j * 1.3) * 0.018];
          oval(plant, shade(L, (j % 2) * 0.06), q, j * 1.3, 1.2, 0.06, 0.035);
        }
      } else if (cd.id === 'taro') {
        for (let i = 0; i < 5; i++) {
          const a = (i / 5) * TAU, q = stem(plant, '#6a8a5a', [0, 0.02, 0], a, 0.35, 0.28, 0.005);
          ruff(plant, shade(L, (i % 2) * 0.06), q, a, 1.9, 0.14, 0.16, 0.05, 850 + i);
        }
      } else {
        for (let s = 0; s < 3; s++) {
          const a = (s / 3) * TAU, c = stem(plant, '#8a7a5a', [Math.cos(a) * 0.02, 0, Math.sin(a) * 0.02], a, 0.12, 0.36, 0.006);
          for (let j = 0; j < 3; j++) {
            const q = stem(plant, '#b86a4a', end([0, 0, 0], a, 0.12, 0.2 + j * 0.06), a + j * 2.1, 1.0, 0.05, 0.0015);
            palmate(plant, L, q, a + j * 2.1, 1.3, 7, 0.07, 0.012);
          }
          palmate(plant, L, c, a, 0.4, 7, 0.07, 0.012);
        }
      }
      for (let i = 0; i < (cd.id === 'cassava' ? 5 : 3); i++) {
        const a = i * 2.2, long = cd.id === 'cassava';
        fruit.addMatrix(lump(860 + i, 0.2, 10), i % 2 ? W : '#e8e8e8', frame([Math.cos(a) * 0.04, 0.01, Math.sin(a) * 0.04], a + Math.PI / 2, long ? 1.45 : 1.2).multiply(S(long ? 0.018 : 0.03, long ? 0.07 : 0.035, long ? 0.018 : 0.028)));
      }
      return true;
    }
    case 'bitter_melon': {
      // a trellised vine hung with long warty green gourds and little yellow flowers
      for (const x of [-0.12, 0.12]) stem(plant, '#8a5a33', [x, 0, 0], 0, 0, 0.42, 0.007);
      stem(plant, '#8a5a33', [-0.13, 0.38, 0], Math.PI / 2, Math.PI / 2, 0.26, 0.005);
      for (let i = 0; i < 12; i++) ruff(plant, shade(L, (r(i, 1) - 0.5) * 0.12), [-0.11 + (i % 6) * 0.045, 0.22 + Math.floor(i / 6) * 0.12, 0.01], r(i, 2) - 0.5, 1.3, 0.045, 0.05, 0.03, 870 + i);
      for (let i = 0; i < 4; i++) {
        const x = -0.09 + i * 0.06, y = 0.2 + (i % 2) * 0.1;
        fruit.addMatrix(lump(880 + i, 0.35, 12), W, frame([x, y, 0.03], 0, Math.PI).multiply(T(0, 0.05, 0)).multiply(S(0.016, 0.055, 0.016)));
      }
      for (let i = 0; i < 4; i++) petals(plant, '#f2d020', [-0.1 + i * 0.07, 0.36, 0.03], 0, 1.3, 5, 0.012, 0.007, 0.3);
      return true;
    }
    case 'gerbera': {
      // a rosette of lobed leaves and big bright daisies with dark eyes
      for (let i = 0; i < 7; i++) ruff(plant, shade(L, (r(i, 1) - 0.5) * 0.1), [0, 0.01, 0], (i / 7) * TAU, 1.2, 0.05, 0.12, 0.03, 890 + i);
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * TAU + 0.4, c = stem(plant, shade(L, 0.1), [0, 0, 0], a, 0.2 + r(i, 1) * 0.15, 0.22 + r(i, 2) * 0.04, 0.003);
        petals(fruit, W, c, a, 0.4, 18, 0.045, 0.009, 0.1, i);
        petals(fruit, '#dddddd', [c[0], c[1] + 0.003, c[2]], a, 0.4, 14, 0.028, 0.006, 0.3, i + 0.1);
        ball(plant, '#3a2a1a', [c[0], c[1] + 0.006, c[2]], [0.014, 0.006, 0.014]);
      }
      return true;
    }
    case 'cornflower': {
      // wiry grey green stems with fringed, ragged blue flower heads
      for (const { p, yaw, tilt } of stalks(plant, '#7a9a8a', 9, 0.24, 0.32, 0.07, 0.18, 29, 0.0022, 0.07)) {
        petals(fruit, W, p, yaw, tilt * 0.5, 9, 0.022, 0.008, 0.5, r(p[0] * 30, 2));
        petals(fruit, '#dddddd', [p[0], p[1] + 0.004, p[2]], yaw, tilt * 0.5, 6, 0.014, 0.006, 1.0, 0.3);
        ball(plant, '#3a2a6a', [p[0], p[1] + 0.006, p[2]], 0.005);
      }
      return true;
    }
  }
  return false;
}

// returns false for crops that crops.ts builds itself
export function lateCrop(cd: CropDef, plant: Kit, fruit: Kit): boolean {
  if (wave2(cd, plant, fruit)) return true;
  const L = cd.leaf, dark = shade(L, -0.1);
  switch (cd.id) {
    // ------------------------------------------------------------ grains
    case 'rye': {
      // tall slender stalks with long thin ears bristling with awns
      for (const { p, yaw, tilt } of stalks(plant, L, 12, 0.36, 0.46, 0.09, 0.18, 1)) {
        fruit.addMatrix(P.sphere, W, frame(p, yaw, tilt + 0.15).multiply(T(0, 0.035, 0)).multiply(S(0.008, 0.045, 0.008)));
        for (let j = 0; j < 7; j++) fruit.addMatrix(cylinder(0.0006, 0.0012, 3), '#e8e0c8', frame(end(p, yaw, tilt + 0.15, 0.01 + j * 0.01), yaw + (j % 2 ? 0.5 : -0.5), tilt + 0.3).multiply(S(1, 0.06, 1)));
      }
      return true;
    }
    case 'quinoa': {
      // stout stems with goosefoot leaves and big clustered seed plumes on top
      for (const { p, yaw, tilt } of stalks(plant, L, 5, 0.26, 0.34, 0.07, 0.12, 2, 0.007, 0.08)) {
        for (let j = 0; j < 7; j++) {
          const q = end(p, yaw, tilt, -0.02 + j * 0.012);
          const a = j * 2.3;
          fruit.add(lump(300 + j, 0.3, 8), j % 2 ? W : '#e0e0e0', [q[0] + Math.cos(a) * 0.016, q[1], q[2] + Math.sin(a) * 0.016], [0, a, 0], [0.014, 0.022, 0.014]);
        }
      }
      for (let i = 0; i < 6; i++) oval(plant, dark, [0, 0.06 + i * 0.03, 0], i * 2.4, 1.1, 0.06, 0.03);
      return true;
    }
    case 'sorghum': {
      // tall cane like stalks, wide arching leaves and a dense upright seed head
      for (let c = 0; c < 3; c++) {
        const a = c * 2.1 + 0.3, base: V3 = [Math.cos(a) * 0.05, 0, Math.sin(a) * 0.05];
        const top = stem(plant, shade(L, 0.05), base, a, 0.06, 0.44, 0.011, 0.008);
        for (let j = 0; j < 4; j++) sword(plant, shade(L, (j % 2) * 0.06), end(base, a, 0.06, 0.1 + j * 0.08), a + j * 1.9, 0.95, 0.2, 0.035, 0.8);
        fruit.add(lump(310 + c, 0.2, 12), '#d8d8d8', [top[0], top[1] + 0.04, top[2]], [0, 0, 0], [0.024, 0.05, 0.024]);
        for (let j = 0; j < 16; j++) {
          const b = j * 2.4, y = top[1] + 0.01 + (j / 16) * 0.07;
          ball(fruit, W, [top[0] + Math.cos(b) * 0.022, y, top[2] + Math.sin(b) * 0.022], 0.009);
        }
      }
      return true;
    }
    case 'millet': {
      // foxtail heads: long bristly spikes nodding over at the top
      for (const { p, yaw, tilt } of stalks(plant, L, 9, 0.28, 0.36, 0.08, 0.2, 3)) {
        fruit.addMatrix(lump(720, 0.15, 10), W, frame(p, yaw, tilt + 0.55).multiply(T(0, 0.045, 0)).multiply(S(0.016, 0.055, 0.016)));
        for (let j = 0; j < 10; j++) fruit.addMatrix(cylinder(0.0006, 0.001, 3), '#dddddd', frame(end(p, yaw, tilt + 0.55, 0.012 + j * 0.008), yaw + j * 1.7, tilt + 0.55 + 1.3).multiply(S(1, 0.022, 1)));
      }
      return true;
    }
    case 'flax': {
      // a stand of slim stems with needle leaves, each topped by a sky blue flower
      for (const { p, yaw, tilt } of stalks(plant, L, 14, 0.26, 0.36, 0.08, 0.14, 4, 0.0025, 0.05)) {
        petals(fruit, W, p, yaw, tilt, 5, 0.018, 0.011, 0.35, r(p[0] * 99, 1));
        ball(plant, '#f0d040', p, 0.004);
      }
      return true;
    }
    // ------------------------------------------------------------ bushes and pods
    case 'cherry_tomato': {
      // a staked bush with trusses of little tomatoes hanging off it
      mound(plant, L, 6, 0.13, 0.06, [0.065, 0.065, 0.065], 400);
      stem(plant, '#9a7a4a', [0.02, 0, -0.02], 0, 0, 0.34, 0.005);
      for (let t = 0; t < 4; t++) {
        const a = t * 1.57 + 0.4;
        for (let j = 0; j < 5; j++) {
          const d = 0.09 + j * 0.012, y = 0.19 - j * 0.02 - (j * j) * 0.003;
          fruit.add(produceGeo('tomato') as THREE.BufferGeometry, W, [Math.cos(a + j * 0.18) * d, y, Math.sin(a + j * 0.18) * d], [0, a, 0], 0.017);
          ball(plant, '#2f7a2a', [Math.cos(a + j * 0.18) * d, y + 0.015, Math.sin(a + j * 0.18) * d], [0.008, 0.003, 0.008]);
        }
      }
      return true;
    }
    case 'jalapeno': {
      // a compact bush with fat glossy peppers hanging point down
      mound(plant, L, 5, 0.13, 0.05, [0.05, 0.05, 0.05], 410);
      for (let i = 0; i < 4; i++) stem(plant, shade(L, -0.1), [0, 0, 0], i * 1.57, 0.4, 0.14, 0.005);
      for (let i = 0; i < 7; i++) {
        const a = (i / 7) * TAU + 0.3, d = 0.11, y = 0.1 + r(i, 7) * 0.05;
        fruit.addMatrix(P.sphere, W, frame([Math.cos(a) * d, y, Math.sin(a) * d], a, Math.PI - 0.25).multiply(T(0, 0.03, 0)).multiply(S(0.015, 0.034, 0.015)));
        stem(plant, '#3f7a2a', [Math.cos(a) * d, y, Math.sin(a) * d], a, 0.2, 0.02, 0.004);
        ball(plant, '#3f7a2a', [Math.cos(a) * d, y - 0.002, Math.sin(a) * d], [0.012, 0.005, 0.012]);
      }
      return true;
    }
    case 'peanut': {
      // low clover like leaves and yellow pea flowers; pods pushed half into the soil
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * TAU, d = 0.05 + r(i, 1) * 0.06, base: V3 = [Math.cos(a) * d * 0.3, 0, Math.sin(a) * d * 0.3];
        const top = stem(plant, shade(L, 0.05), base, a + Math.PI / 2, 0.9, d + 0.04, 0.003);
        for (let j = 0; j < 4; j++) oval(plant, shade(L, (j % 2) * 0.06 - 0.03), top, a + Math.PI / 2 + (j - 1.5) * 0.7, 1.2, 0.035, 0.016);
        if (i % 3 === 0) petals(plant, '#f2c020', [top[0], top[1] + 0.01, top[2]], 0, 0, 5, 0.012, 0.007, 0.6);
      }
      for (let i = 0; i < 5; i++) {
        const a = i * 1.26 + 0.2, x = Math.cos(a) * 0.12, z = Math.sin(a) * 0.12;
        for (const o of [-1, 1]) fruit.add(lump(420 + i, 0.15, 10), o > 0 ? W : '#eeeeee', [x + Math.cos(a) * o * 0.012, 0.004, z + Math.sin(a) * o * 0.012], [0, a, 0], [0.013, 0.012, 0.013]);
      }
      return true;
    }
    case 'chickpea': {
      // a feathery little bush dotted with puffy pods
      for (let i = 0; i < 9; i++) {
        const a = (i / 9) * TAU, base: V3 = [0, 0, 0];
        const top = stem(plant, shade(L, 0.05), base, a, 0.45, 0.22, 0.003);
        for (let j = 0; j < 6; j++) {
          const q = end(base, a, 0.45, 0.06 + j * 0.03);
          for (const o of [-1, 1]) oval(plant, shade(L, (r(i, j) - 0.5) * 0.1), q, a + o * 1.3, 1.0, 0.018, 0.008);
        }
        fruit.addMatrix(P.sphere, W, frame(end(base, a, 0.45, 0.13), a, 1.6).multiply(S(0.012, 0.018, 0.011)));
        fruit.addMatrix(P.sphere, W, frame(top, a, 1.2).multiply(S(0.011, 0.017, 0.01)));
      }
      return true;
    }
    case 'lentil': {
      // a fine tangle of stems with tiny leaflets and flat paired pods
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * TAU + r(i, 2), base: V3 = [Math.cos(a) * 0.02, 0, Math.sin(a) * 0.02];
        const tilt = 0.3 + r(i, 3) * 0.4;
        stem(plant, shade(L, 0.06), base, a, tilt, 0.2, 0.0025);
        for (let j = 0; j < 7; j++) oval(plant, shade(L, (r(j, i) - 0.5) * 0.1), end(base, a, tilt, 0.04 + j * 0.022), a + (j % 2 ? 1.3 : -1.3), 1.0, 0.014, 0.005);
        if (i % 2 === 0) {
          const q = end(base, a, tilt, 0.12 + r(i, 4) * 0.06);
          for (const o of [-1, 1]) fruit.addMatrix(P.sphere, W, frame(q, a + o * 0.4, 1.9).multiply(T(0, 0.012, 0)).multiply(S(0.009, 0.014, 0.004)));
        }
      }
      return true;
    }
    case 'black_bean': {
      // bushy beans with three part leaves and slim pods hanging under them
      for (let i = 0; i < 7; i++) {
        const a = (i / 7) * TAU, base: V3 = [0, 0, 0];
        const top = stem(plant, shade(L, 0.05), base, a, 0.5, 0.2, 0.004);
        for (let j = 0; j < 3; j++) oval(plant, shade(L, (j - 1) * 0.05), top, a + (j - 1) * 0.9, 1.0 + (j === 1 ? -0.4 : 0.2), 0.06, 0.028, 0.004);
        for (let j = 0; j < 2; j++) {
          const q = end(base, a, 0.5, 0.1 + j * 0.04);
          fruit.addMatrix(P.sphere, W, frame(q, a + j, Math.PI - 0.3).multiply(T(0, 0.04, 0)).multiply(S(0.007, 0.042, 0.005)));
        }
      }
      return true;
    }
    case 'cranberry': {
      // a low trailing mat of tiny leaves with glossy berries sitting on top
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * TAU + r(i, 1) * 0.3, base: V3 = [0, 0.01, 0];
        const q = stem(plant, '#6a3a2a', base, a, 1.4, 0.16 + r(i, 2) * 0.04, 0.0025);
        for (let j = 0; j < 5; j++) {
          const p = end(base, a, 1.4, 0.03 + j * 0.03);
          oval(plant, shade(L, (r(i, j) - 0.5) * 0.12), [p[0], p[1] + 0.005, p[2]], a + (j % 2 ? 1.2 : -1.2), 1.0, 0.018, 0.008);
        }
        if (i % 3 === 0) oval(plant, shade(L, 0.05), q, a, 0.3, 0.03, 0.01);
      }
      for (let i = 0; i < 14; i++) {
        const a = i * 2.4, d = 0.03 + Math.sqrt(r(i, 5)) * 0.12;
        ball(fruit, W, [Math.cos(a) * d, 0.035 + r(i, 6) * 0.02, Math.sin(a) * d], 0.016);
      }
      return true;
    }
    case 'goji': {
      // long arching wands with narrow leaves and little oblong red berries all along them
      for (let b = 0; b < 6; b++) {
        const a = (b / 6) * TAU;
        let p: V3 = [0, 0, 0];
        for (let s = 0; s < 4; s++) {
          const tilt = 0.25 + s * 0.35;
          const q = stem(plant, '#8a7a5a', p, a, tilt, 0.08, 0.004 - s * 0.0006);
          for (let j = 0; j < 3; j++) {
            const m = end(p, a, tilt, 0.02 + j * 0.025);
            oval(plant, shade(L, (r(b, s + j) - 0.5) * 0.12), m, a + (j % 2 ? 1.1 : -1.1), tilt + 0.8, 0.035, 0.009);
            if (s > 0) fruit.addMatrix(P.sphere, W, frame(m, a + j, Math.PI).multiply(T(0, 0.012, 0)).multiply(S(0.007, 0.013, 0.007)));
          }
          p = q;
        }
      }
      return true;
    }
    case 'gooseberry': {
      // a thorny little shrub with lobed leaves and striped round berries hanging singly
      for (let b = 0; b < 6; b++) {
        const a = (b / 6) * TAU + 0.2;
        let p: V3 = [0, 0, 0];
        for (let s = 0; s < 3; s++) {
          const tilt = 0.3 + s * 0.35;
          const q = stem(plant, '#7a6a4a', p, a, tilt, 0.09, 0.005 - s * 0.001);
          ruff(plant, shade(L, (r(b, s) - 0.5) * 0.12), q, a + 1.2, 1.1, 0.035, 0.04, 0.02, 500 + b * 3 + s);
          if (s > 0) {
            const m = end(p, a, tilt, 0.05);
            fruit.add(lump(510 + b, 0.08, 12), W, [m[0], m[1] - 0.025, m[2]], [0, 0, 0], [0.017, 0.019, 0.017]);
            stem(plant, '#6a5a3a', [m[0], m[1] - 0.012, m[2]], 0, 0, 0.012, 0.0015);
          }
          p = q;
        }
      }
      return true;
    }
    case 'okra': {
      // an upright plant with big hand shaped leaves, a cream flower and ridged pods pointing up
      const top = stem(plant, shade(L, -0.05), [0, 0, 0], 0, 0, 0.42, 0.011, 0.007);
      for (let i = 0; i < 6; i++) {
        const y = 0.08 + i * 0.055, a = i * 2.4;
        stem(plant, shade(L, 0.05), [0, y, 0], a, 0.9, 0.05, 0.003);
        ruff(plant, shade(L, (i % 2) * 0.06 - 0.03), end([0, y, 0], a, 0.9, 0.05), a, 1.2, 0.09, 0.1, 0.06, 520 + i);
      }
      for (let i = 0; i < 5; i++) {
        const y = 0.17 + i * 0.045, a = i * 2.4 + 1.2;
        fruit.addMatrix(cylinder(0.002, 0.011, 5), W, frame([Math.cos(a) * 0.014, y, Math.sin(a) * 0.014], a, 0.3).multiply(S(1, 0.085, 1)));
      }
      petals(plant, '#f6ecb0', [top[0], top[1] - 0.04, top[2] + 0.03], 0, 0.5, 5, 0.035, 0.022, 0.5);
      ball(plant, '#8a1a2a', [top[0], top[1] - 0.04, top[2] + 0.03], 0.009);
      return true;
    }
    case 'tea': {
      // a clipped, flat topped tea bush with bright new shoots (two leaves and a bud)
      for (let i = 0; i < 9; i++) {
        const a = (i / 9) * TAU, d = i === 8 ? 0 : 0.08;
        plant.add(lump(530 + i, 0.18, 12), shade(L, 0.02), [Math.cos(a) * d * 0.5, 0.115, Math.sin(a) * d * 0.5], [0, a, 0], [0.085, 0.065, 0.085]);
      }
      for (let i = 0; i < 90; i++) {
        const y = 1 - (2 * (i + 0.5)) / 90;
        if (y < -0.3) continue;
        const a = i * 2.39996, c = Math.sqrt(1 - y * y);
        const p: V3 = [Math.cos(a) * c * 0.13, 0.12 + y * 0.075, Math.sin(a) * c * 0.13];
        oval(plant, shade(L, (r(i, 7) - 0.5) * 0.14), p, a + Math.PI / 2 + r(i, 8), 0.9 + y, 0.032, 0.014, 0.004);
      }
      for (let i = 0; i < 4; i++) stem(plant, '#6a5a3a', [Math.cos(i * 1.6) * 0.04, 0, Math.sin(i * 1.6) * 0.04], i * 1.6, 0.3, 0.1, 0.006);
      for (let i = 0; i < 14; i++) {
        const a = i * 2.4, d = Math.sqrt((i + 0.5) / 14) * 0.13;
        const p: V3 = [Math.cos(a) * d, 0.19 - d * d * 1.5, Math.sin(a) * d];
        for (const o of [-1, 1]) oval(fruit, W, p, a + o * 0.6, 0.6, 0.03, 0.012);
        fruit.addMatrix(P.sphere, '#e0e0e0', frame(p, a, 0.1).multiply(T(0, 0.015, 0)).multiply(S(0.004, 0.015, 0.004)));
      }
      return true;
    }
    // ------------------------------------------------------------ melons and squash
    case 'cantaloupe':
      patch(plant, L);
      fruit.add(P.sphereHi, W, [0.01, 0.075, 0], [0, 0, 0], [0.085, 0.078, 0.085]);
      stem(plant, '#6b8a2a', [0.01, 0.15, 0], 0, 0.3, 0.02, 0.005);
      return true;
    case 'honeydew':
      patch(plant, L);
      fruit.add(P.sphereHi, W, [0.01, 0.075, 0], [0, 0.5, 0], [0.088, 0.075, 0.1]);
      stem(plant, '#6b8a2a', [0.01, 0.148, 0.02], 0, 0.3, 0.02, 0.005);
      return true;
    case 'butternut': {
      // a bell shaped squash lying on its side: round seed end and a long smooth neck
      patch(plant, L);
      const m = frame([0, 0.05, 0], 0.6, Math.PI / 2 - 0.1);
      fruit.addMatrix(P.sphereHi, W, m.clone().multiply(T(0, -0.04, 0)).multiply(S(0.05, 0.052, 0.05)));
      fruit.addMatrix(cylinder(0.03, 0.036, 14), W, m.clone().multiply(T(0, -0.03, 0)).multiply(S(1, 0.09, 1)));
      fruit.addMatrix(P.sphereHi, W, m.clone().multiply(T(0, 0.06, 0)).multiply(S(0.03, 0.02, 0.03)));
      stem(plant, '#8a8a4a', end([0, 0.05, 0], 0.6, Math.PI / 2 - 0.1, 0.075), 0.6, Math.PI / 2, 0.02, 0.006);
      return true;
    }
    // ------------------------------------------------------------ flowers
    case 'marigold': {
      // a ferny mound topped with ruffled pompom blooms
      mound(plant, L, 6, 0.08, 0.06, [0.06, 0.05, 0.06], 540);
      for (let i = 0; i < 7; i++) {
        const a = (i / 7) * TAU, d = i === 6 ? 0 : 0.07;
        const top = stem(plant, L, [Math.cos(a) * d * 0.5, 0.05, Math.sin(a) * d * 0.5], a, d ? 0.35 : 0, 0.15 + r(i, 2) * 0.05, 0.003);
        fruit.add(lump(550 + i, 0.35, 12), W, [top[0], top[1] + 0.015, top[2]], [0, a, 0], [0.028, 0.022, 0.028]);
        petals(fruit, '#d8d8d8', top, a, 0, 12, 0.03, 0.012, 0.25, i);
      }
      return true;
    }
    case 'chamomile': {
      // a haze of fine stems with little daisies: white rays round a yellow dome
      for (const { p, yaw, tilt } of stalks(plant, L, 13, 0.18, 0.28, 0.08, 0.2, 5, 0.0025, 0.05)) {
        petals(fruit, W, p, yaw, tilt * 0.5, 12, 0.02, 0.005, 0.1, r(p[0] * 50, 3));
        ball(plant, '#f0c020', [p[0], p[1] + 0.004, p[2]], [0.009, 0.007, 0.009]);
      }
      return true;
    }
    case 'hibiscus': {
      // a glossy shrub with big trumpet flowers and a long stamen column
      mound(plant, L, 6, 0.14, 0.07, [0.07, 0.07, 0.07], 560);
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * TAU + 0.5, c: V3 = [Math.cos(a) * 0.1, 0.22 + r(i, 1) * 0.06, Math.sin(a) * 0.1];
        petals(fruit, W, c, a, 0.9, 5, 0.05, 0.03, 0.35, i);
        petals(fruit, '#aaaaaa', c, a, 0.9, 5, 0.018, 0.012, 0.6, i + 0.6);
        stem(plant, '#f0d060', c, a, 0.9, 0.05, 0.002);
        ball(plant, '#d8281a', end(c, a, 0.9, 0.05), 0.006);
      }
      return true;
    }
    case 'saffron': {
      // grassy crocus leaves and lilac cups each holding three red threads
      for (let i = 0; i < 12; i++) sword(plant, shade(L, (r(i, 1) - 0.5) * 0.1), [0, 0, 0], (i / 12) * TAU, 0.3 + r(i, 2) * 0.3, 0.16, 0.008, 0.3);
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * TAU, c = stem(plant, '#f0f0e0', [Math.cos(a) * 0.05, 0, Math.sin(a) * 0.05], a, 0.15, 0.08, 0.003);
        petals(fruit, W, c, a, 0.15, 6, 0.045, 0.016, 1.2, i);
        for (let j = 0; j < 3; j++) stem(plant, '#d8281a', c, a + j * 2.1, 0.4, 0.04, 0.0015);
      }
      return true;
    }
    case 'peony': {
      // a leafy bush carrying a few huge, many petalled blooms
      for (let i = 0; i < 8; i++) ruff(plant, shade(L, (r(i, 1) - 0.5) * 0.1), [0, 0.02, 0], (i / 8) * TAU, 0.9, 0.08, 0.14, 0.06, 570 + i);
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * TAU + 0.3, c = stem(plant, L, [0, 0, 0], a, 0.3, 0.22 + r(i, 2) * 0.05, 0.004);
        petals(fruit, W, c, a, 0.3, 9, 0.045, 0.028, 0.5, i);
        petals(fruit, '#eeeeee', [c[0], c[1] + 0.008, c[2]], a, 0.3, 8, 0.035, 0.024, 0.9, i + 0.3);
        petals(fruit, W, [c[0], c[1] + 0.014, c[2]], a, 0.3, 7, 0.026, 0.02, 1.3, i + 0.6);
        fruit.add(lump(580 + i, 0.3, 10), '#f4f4f4', [c[0], c[1] + 0.022, c[2]], [0, 0, 0], 0.018);
      }
      return true;
    }
    case 'orchid': {
      // broad fleshy leaves at the base and an arching spray of flat moth shaped flowers
      for (let i = 0; i < 4; i++) oval(plant, shade(L, (i % 2) * 0.06), [0, 0.02, 0], i * 1.6, 1.25, 0.14, 0.035, 0.006);
      stem(plant, '#6a5a3a', [0.01, 0, -0.03], 0, 0.05, 0.3, 0.003);
      let p: V3 = [0.01, 0.02, -0.03];
      for (let s = 0; s < 6; s++) {
        const tilt = 0.1 + s * 0.28;
        const q = stem(plant, '#4a6a3a', p, 0, tilt, 0.06, 0.0025);
        if (s >= 2) {
          petals(fruit, W, q, 0, 1.5, 5, 0.03, 0.02, 0, s, 0.002);
          fruit.addMatrix(P.sphere, '#bbbbbb', frame(q, 0, 1.5).multiply(T(0, 0.004, 0.01)).multiply(S(0.01, 0.006, 0.014)));
        }
        p = q;
      }
      return true;
    }
    case 'dahlia': {
      // tall stems carrying layered blooms of pointed petals
      for (let i = 0; i < 5; i++) ruff(plant, shade(L, (r(i, 1) - 0.5) * 0.1), [0, 0.04, 0], (i / 5) * TAU, 1.0, 0.07, 0.1, 0.05, 590 + i);
      for (let i = 0; i < 3; i++) {
        const a = (i / 3) * TAU + 0.2, c = stem(plant, L, [0, 0, 0], a, 0.25, 0.3 + r(i, 3) * 0.06, 0.004);
        for (let ring = 0; ring < 4; ring++) petals(fruit, ring % 2 ? '#e8e8e8' : W, [c[0], c[1] + ring * 0.005, c[2]], a, 0.4, 14 - ring * 2, 0.042 - ring * 0.008, 0.009, 0.25 + ring * 0.35, ring * 0.2);
        ball(plant, '#f0c020', [c[0], c[1] + 0.02, c[2]], 0.008);
      }
      return true;
    }
    case 'lotus': {
      // a little pool with round pads and a pointed cup shaped bloom held above the water
      plant.add(cylinder(0.16, 0.16, 20), '#3a7ab0', [0, -0.005, 0], [0, 0, 0], [1, 0.012, 1]);
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * TAU + 0.4;
        plant.add(cylinder(0.065, 0.065, 16), shade(L, (i % 2) * 0.05), [Math.cos(a) * 0.09, 0.01 + (i === 3 ? 0.06 : 0), Math.sin(a) * 0.09], [0, a, i === 3 ? 0.2 : 0], [1, 0.006, 1]);
      }
      const c = stem(plant, shade(L, 0.05), [0, 0, 0], 0, 0.05, 0.16, 0.005);
      petals(fruit, W, c, 0, 0.05, 8, 0.06, 0.028, 0.75, 0);
      petals(fruit, '#f0f0f0', [c[0], c[1] + 0.006, c[2]], 0, 0.05, 6, 0.05, 0.024, 1.15, 0.4);
      plant.add(cylinder(0.014, 0.01, 12), '#e8d040', [c[0], c[1], c[2]], [0, 0, 0], [1, 0.022, 1]);
      return true;
    }
    // ------------------------------------------------------------ greens and herbs
    case 'kale': {
      // a sturdy stem with long, tightly frilled blue green leaves
      stem(plant, '#8aa87a', [0, 0, 0], 0, 0, 0.1, 0.012);
      for (let i = 0; i < 10; i++) {
        const a = i * 2.4, y = 0.03 + i * 0.008;
        ruff(i < 6 ? plant : fruit, i < 6 ? shade(L, (r(i, 1) - 0.5) * 0.1) : W, [0, y, 0], a, 0.9 - i * 0.05, 0.06, 0.22 - i * 0.008, 0.07, 600 + i);
      }
      return true;
    }
    case 'basil': {
      // a bushy herb of glossy cupped leaves in pairs up square stems
      for (let s = 0; s < 6; s++) {
        const a = (s / 6) * TAU, base: V3 = [Math.cos(a) * 0.03, 0, Math.sin(a) * 0.03];
        const tilt = 0.2 + r(s, 1) * 0.2;
        const top = stem(plant, shade(L, 0.08), base, a, tilt, 0.22, 0.004);
        for (let j = 0; j < 4; j++) {
          const q = end(base, a, tilt, 0.05 + j * 0.045);
          for (const o of [0, Math.PI]) oval(plant, shade(L, (r(s, j) - 0.5) * 0.1), q, a + o + j * 1.57, 1.1, 0.045, 0.02, 0.006);
        }
        for (let j = 0; j < 4; j++) oval(fruit, W, top, a + j * 1.57, 0.5, 0.03, 0.016, 0.005);
      }
      return true;
    }
    case 'mint': {
      // a spreading patch of upright stems with crinkled, toothed leaves in crossing pairs
      for (let s = 0; s < 10; s++) {
        const a = r(s, 1) * TAU, d = Math.sqrt(r(s, 2)) * 0.1, base: V3 = [Math.cos(a) * d, 0, Math.sin(a) * d];
        const top = stem(plant, '#6a5a4a', base, a, 0.1, 0.2 + r(s, 3) * 0.05, 0.003);
        for (let j = 0; j < 4; j++) {
          const q = end(base, a, 0.1, 0.04 + j * 0.045);
          for (const o of [0, Math.PI]) ruff(plant, shade(L, (r(s, j) - 0.5) * 0.1), q, a + o + j * 1.57, 1.1, 0.025, 0.04, 0.018, 610 + j);
        }
        for (const o of [0, Math.PI]) ruff(fruit, W, top, a + o, 0.5, 0.02, 0.032, 0.014, 620);
      }
      return true;
    }
    case 'bok_choy': {
      // a vase of thick white spoon stalks opening into dark rounded blades
      for (let i = 0; i < 9; i++) {
        const a = (i / 9) * TAU, tilt = 0.25 + (i % 3) * 0.08;
        fruit.addMatrix(P.sphere, W, frame([Math.cos(a) * 0.012, 0, Math.sin(a) * 0.012], a, tilt).multiply(T(0, 0.055, 0)).multiply(S(0.016, 0.06, 0.009)));
        oval(plant, shade(L, -0.18 + (i % 2) * 0.06), end([0, 0, 0], a, tilt, 0.08), a, tilt + 0.25, 0.1, 0.045, 0.006);
      }
      return true;
    }
    case 'cauliflower': {
      // a firm white curd of knobbly florets cupped by big blue green leaves
      for (let i = 0; i < 9; i++) {
        const a = (i / 9) * TAU;
        ruff(plant, shade(L, (i % 2) * 0.06 - 0.03), [Math.cos(a) * 0.02, 0, Math.sin(a) * 0.02], a, 0.55 + (i % 3) * 0.12, 0.1, 0.19, 0.08, 630 + i);
      }
      fruit.add(lump(640, 0.12, 20), W, [0, 0.07, 0], [0, 0, 0], [0.068, 0.05, 0.068]);
      for (let i = 0; i < 18; i++) {
        const a = i * 2.4, d = Math.sqrt((i + 0.5) / 18) * 0.055;
        ball(fruit, i % 3 ? W : '#eeeeee', [Math.cos(a) * d, 0.11 - d * d * 7, Math.sin(a) * d], 0.017);
      }
      return true;
    }
    case 'romanesco': {
      // a lime green cone made of spiralling smaller cones, a fractal in a vegetable
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * TAU;
        ruff(plant, shade(L, (i % 2) * 0.06 - 0.03), [0, 0, 0], a, 0.6 + (i % 3) * 0.1, 0.09, 0.17, 0.07, 650 + i);
      }
      fruit.add(cylinder(0, 0.065, 16), '#dddddd', [0, 0.04, 0], [0, 0, 0], [1, 0.1, 1]);
      for (let i = 0; i < 34; i++) {
        const t = i / 34, a = i * 2.4, rr = 0.062 * (1 - t) + 0.006;
        const y = 0.045 + t * 0.09, s = 0.018 * (1 - t * 0.7);
        fruit.addMatrix(cylinder(0, 1, 8), W, frame([Math.cos(a) * rr, y, Math.sin(a) * rr], a + Math.PI / 2, 0.7 * (1 - t)).multiply(S(s, s * 1.4, s)));
      }
      return true;
    }
    case 'artichoke': {
      // silvery thistle leaves round a stalk topped with a globe of overlapping scales
      for (let i = 0; i < 7; i++) ruff(plant, shade(L, (r(i, 1) - 0.5) * 0.1), [0, 0.01, 0], (i / 7) * TAU, 1.0, 0.07, 0.22, 0.06, 660 + i);
      const c = stem(plant, shade(L, 0.05), [0, 0, 0], 0, 0, 0.24, 0.008);
      for (let ring = 0; ring < 5; ring++) {
        const n = 9 - ring, y = c[1] - 0.012 + ring * 0.014, rr = 0.03 - ring * 0.004;
        for (let i = 0; i < n; i++) {
          const a = (i / n) * TAU + ring * 0.4;
          fruit.addMatrix(P.sphere, ring % 2 ? '#dddddd' : W, frame([Math.cos(a) * rr * 0.6, y, Math.sin(a) * rr * 0.6], a + Math.PI / 2, 0.25 + ring * 0.08).multiply(T(0, 0.012, 0)).multiply(S(0.016, 0.022, 0.006)));
        }
      }
      return true;
    }
    // ------------------------------------------------------------ roots and rhizomes
    case 'ginger': {
      // reed like shoots with two ranks of slender leaves over a knobbly rhizome
      for (let s = 0; s < 5; s++) {
        const a = s * 1.26, base: V3 = [Math.cos(a) * 0.04, 0.01, Math.sin(a) * 0.04];
        stem(plant, shade(L, 0.05), base, a, 0.12, 0.3 + r(s, 1) * 0.1, 0.004);
        for (let j = 0; j < 6; j++) sword(plant, shade(L, (r(s, j) - 0.5) * 0.1), end(base, a, 0.12, 0.08 + j * 0.04), a + (j % 2 ? Math.PI / 2 : -Math.PI / 2), 1.0, 0.1, 0.02, 0.4);
      }
      for (let i = 0; i < 6; i++) {
        const a = i * 1.05;
        fruit.add(lump(670 + i, 0.25, 10), W, [Math.cos(a) * 0.05, 0.012, Math.sin(a) * 0.05], [0, a, 0.3], [0.032, 0.018, 0.02]);
        ball(plant, '#d86a7a', [Math.cos(a) * 0.075, 0.02, Math.sin(a) * 0.075], 0.006);
      }
      return true;
    }
    case 'parsnip': {
      // celery like compound leaves over a broad cream shoulder
      for (let i = 0; i < 7; i++) {
        const a = (i / 7) * TAU, top = stem(plant, shade(L, 0.1), [0, 0.02, 0], a, 0.45, 0.18, 0.004);
        for (let j = 0; j < 3; j++) ruff(plant, shade(L, (r(i, j) - 0.5) * 0.1), end([0, 0.02, 0], a, 0.45, 0.08 + j * 0.05), a + (j - 1) * 1.1, 1.0, 0.03, 0.05, 0.02, 680 + j);
        ruff(plant, L, top, a, 0.7, 0.03, 0.05, 0.02, 684);
      }
      fruit.add(cylinder(0.045, 0.03, 14), W, [0, -0.03, 0], [0, 0, 0], [1, 0.06, 1]);
      fruit.add(P.sphere, W, [0, 0.03, 0], [0, 0, 0], [0.045, 0.014, 0.045]);
      return true;
    }
    case 'turmeric': {
      // big glossy lance leaves standing up from a cluster of orange rhizome fingers
      for (let i = 0; i < 7; i++) {
        const a = (i / 7) * TAU, base: V3 = [Math.cos(a) * 0.02, 0, Math.sin(a) * 0.02];
        const q = stem(plant, shade(L, 0.1), base, a, 0.25, 0.08, 0.005);
        oval(plant, shade(L, (i % 2) * 0.06), q, a, 0.35 + (i % 3) * 0.1, 0.24, 0.045, 0.006);
      }
      for (let i = 0; i < 7; i++) {
        const a = i * 0.9;
        fruit.addMatrix(P.sphere, W, frame([Math.cos(a) * 0.03, 0.012, Math.sin(a) * 0.03], a + Math.PI / 2, 1.3).multiply(T(0, 0.025, 0)).multiply(S(0.012, 0.03, 0.012)));
      }
      return true;
    }
    case 'wasabi': {
      // round heart leaves on long stalks around a knobbly green rhizome
      for (let i = 0; i < 9; i++) {
        const a = (i / 9) * TAU, q = stem(plant, shade(L, 0.12), [0, 0.04, 0], a, 0.6 + (i % 3) * 0.1, 0.13, 0.003);
        plant.add(cylinder(0.045, 0.045, 14), shade(L, (r(i, 1) - 0.5) * 0.1), q, [0.3, a, 0], [1, 0.004, 1]);
      }
      fruit.add(cylinder(0.022, 0.028, 12), W, [0, -0.02, 0], [0, 0, 0], [1, 0.07, 1]);
      for (let j = 0; j < 4; j++) fruit.add(cylinder(0.028, 0.028, 12), '#cccccc', [0, -0.01 + j * 0.013, 0], [0, 0, 0], [1, 0.004, 1]);
      return true;
    }
    case 'leek': {
      // a tall white shank fanning into flat blue green leaves folded along one plane
      fruit.add(produceGeo('leek') as THREE.BufferGeometry, W, [0, 0.05, 0], [0, 0, 0], [0.034, 0.07, 0.034]);
      for (let i = 0; i < 10; i++) {
        const o = i % 2 ? 1 : -1;
        sword(plant, shade(L, (r(i, 1) - 0.5) * 0.12 - i * 0.01), [0, 0.1 + i * 0.012, 0], (o > 0 ? 0 : Math.PI) + (r(i, 2) - 0.5) * 0.3, 0.2 + i * 0.06, 0.26 - i * 0.012, 0.034, 0.9);
      }
      return true;
    }
    case 'shallot': {
      // a clump of copper teardrop bulbs, each with its own hollow leaves
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * TAU + 0.3, x = Math.cos(a) * 0.03, z = Math.sin(a) * 0.03;
        fruit.add(produceGeo('shallot') as THREE.BufferGeometry, W, [x, 0.03, z], [0, a, (i - 1.5) * 0.12], 0.032);
        for (let j = 0; j < 3; j++) stem(plant, shade(L, (r(i, j) - 0.5) * 0.1), [x, 0.06, z], a + j * 2.1, 0.15 + j * 0.08, 0.2 + r(i, j + 3) * 0.06, 0.004, 0.0015);
      }
      return true;
    }
    // ------------------------------------------------------------ climbers
    case 'green_bean': {
      // a teepee of three poles smothered in bean vine, slim pods dangling all over
      for (let i = 0; i < 3; i++) {
        const a = (i / 3) * TAU, base: V3 = [Math.cos(a) * 0.1, 0, Math.sin(a) * 0.1];
        stem(plant, '#8a6a3a', base, -a - Math.PI / 2, 0.22, 0.46, 0.006);
        for (let j = 0; j < 7; j++) {
          const q = end(base, -a - Math.PI / 2, 0.22, 0.05 + j * 0.055);
          for (let k = 0; k < 3; k++) oval(plant, shade(L, (r(i, j + k) - 0.5) * 0.14), q, a + j * 1.3 + (k - 1) * 0.9, 1.3 - (k === 1 ? 0.3 : 0), 0.045, 0.024, 0.004);
          if (j % 2 === 1) fruit.addMatrix(cylinder(0.004, 0.005, 6), W, frame([q[0] * 1.3, q[1], q[2] * 1.3], a + j, Math.PI - 0.15).multiply(S(1, 0.1, 1)));
        }
      }
      return true;
    }
    case 'hops': {
      // bines twisting up strings to a tall pole, hung with papery green cones
      stem(plant, '#8a6a3a', [0, 0, 0], 0, 0, 0.52, 0.006);
      for (let b = 0; b < 2; b++) {
        const a0 = b * Math.PI, base: V3 = [Math.cos(a0) * 0.1, 0, Math.sin(a0) * 0.1];
        stem(plant, '#d8c8a0', base, -a0 - Math.PI / 2, 0.19, 0.51, 0.0012);
        for (let j = 0; j < 8; j++) {
          const q = end(base, -a0 - Math.PI / 2, 0.19, 0.06 + j * 0.055);
          ruff(plant, shade(L, (r(b, j) - 0.5) * 0.12), q, a0 + j * 1.9, 1.2, 0.055, 0.065, 0.035, 690 + j);
          const cp: V3 = [q[0] + Math.cos(a0 + j * 1.9 + 1) * 0.035, q[1] - 0.03, q[2] + Math.sin(a0 + j * 1.9 + 1) * 0.035];
          fruit.add(lump(700 + j, 0.2, 8), W, cp, [0, j, 0], [0.018, 0.03, 0.018]);
          for (let s = 0; s < 4; s++) petals(fruit, s % 2 ? '#dddddd' : W, [cp[0], cp[1] + 0.022 - s * 0.012, cp[2]], 0, 0, 5, 0.018, 0.013, -0.9, s * 0.6);
        }
      }
      return true;
    }
    case 'vanilla': {
      // a vanilla orchid vine zigzagging up a post, thick leaves and bunches of long green beans
      stem(plant, '#7a5a3a', [0, 0, 0], 0, 0, 0.46, 0.012);
      let p: V3 = [0.015, 0.02, 0];
      for (let j = 0; j < 7; j++) {
        const a = j * 1.9, q = stem(plant, '#4a7a3a', p, a, 0.35, 0.07, 0.004);
        oval(plant, shade(L, (j % 2) * 0.06), q, a + 1.2, 1.1, 0.07, 0.028, 0.007);
        if (j % 2 === 0 && j > 0) for (let b = 0; b < 4; b++) fruit.addMatrix(cylinder(0.0035, 0.004, 6), W, frame([q[0] + Math.cos(a) * 0.03, q[1], q[2] + Math.sin(a) * 0.03], a + b * 0.3, Math.PI - 0.1 - b * 0.06).multiply(S(1, 0.11, 1)));
        p = [Math.cos(a) * 0.02, q[1], Math.sin(a) * 0.02];
      }
      petals(plant, '#f0e8a0', [0.03, 0.4, 0.02], 0, 1.0, 6, 0.028, 0.012, 0.5);
      return true;
    }
    case 'aloe': {
      // a rosette of thick, spotted, toothed leaves with a spike of coral flowers
      for (let ring = 0; ring < 3; ring++) {
        const n = 7 - ring * 2;
        for (let i = 0; i < n; i++) {
          const a = (i / n) * TAU + ring * 0.5, tilt = 0.95 - ring * 0.3;
          const m = frame([0, 0.01, 0], a, tilt).multiply(S(1, 0.2 - ring * 0.02, 0.45));
          (ring === 2 ? fruit : plant).addMatrix(cylinder(0.002, 0.022, 6), ring === 2 ? W : shade(L, ring * 0.05 - 0.04), m);
          for (let t = 0; t < 4; t++) ball(plant, '#e8f0e0', end([0, 0.01, 0], a, tilt, 0.04 + t * 0.035), 0.0035);
        }
      }
      const top = stem(plant, '#7a8a5a', [0.01, 0.05, 0], 0, 0.08, 0.3, 0.003);
      for (let j = 0; j < 10; j++) {
        const q = end([0.01, 0.05, 0], 0, 0.08, 0.2 + j * 0.01);
        plant.addMatrix(cylinder(0.003, 0.004, 5), j < 5 ? '#e0602a' : '#f0a040', frame(q, j * 2.4, 2.3).multiply(S(1, 0.022, 1)));
      }
      ball(plant, '#e0602a', top, 0.005);
      return true;
    }
  }
  return false;
}

// painted patterns that follow the produce's surface after it is built
export function latePaint(cd: CropDef, g: THREE.BufferGeometry) {
  if (cd.id !== 'cantaloupe' && cd.id !== 'honeydew') return;
  const pos = g.getAttribute('position') as THREE.BufferAttribute, col = g.getAttribute('color') as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    if (y < 0.02) continue;
    let k = 1;
    if (cd.id === 'cantaloupe') {
      // a raised pale net over darker ribs
      const n = Math.abs(Math.sin(x * 140 + Math.sin(z * 90) * 2)) < 0.25 || Math.abs(Math.sin(z * 140 + Math.sin(y * 90) * 2)) < 0.25;
      k = n ? 1.1 : 0.72 + (Math.abs(Math.cos(Math.atan2(z, x) * 5)) < 0.1 ? -0.15 : 0);
    } else k = 0.94 + Math.sin(x * 60 + z * 40) * 0.04;
    col.setXYZ(i, col.getX(i) * k, col.getY(i) * k, col.getZ(i) * k);
  }
}
