// Third batch of farm animals (the second wave of unlocks): breeds built on the shared body
// plans of toon2.ts, plus parametric horses, rabbits, hens, ducks, geese and peafowl. Same pivots
// and conventions as the other sculpts.
import type * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { Sculpt, capsule, ellipsoid, noise3, sphere, type Paint } from './sdf';
import type { CreatureParts } from './creatures';
import { C, birdLeg, build, ears, eyeOn, mixHex, patches, puffs, shade, smooth, toonLeg, type Box } from './toon';
import { cattle, curlHorn, smallRuminant, walker } from './toon2';

// ---------------------------------------------------------------- cattle and deer

const texasLonghorn = () => cattle({
  coat: (x, y, z) => patches(x, y, z, 0.55, '#f4ece0', '#9a4a1e'), face: (x, y, z) => patches(x, y, z + 0.3, 0.5, '#f4ece0', '#9a4a1e'), muzzle: '#d8a898',
  ear: '#9a4a1e', leg: '#e8dcc8', tail: '#9a4a1e',
  horns: { pts: [[0.06, 0.08, -0.01], [0.16, 0.12, -0.02], [0.27, 0.15, 0.0], [0.36, 0.2, 0.04], [0.42, 0.26, 0.05]], r0: 0.03, r1: 0.008, color: '#efe2c4' },
});

const angusCow = () => cattle({
  coat: shade('#1a1818', '#2a2624', 0.2, 0.45), face: '#1c1a1a', muzzle: '#2e2828', ear: '#1c1a1a', earInner: '#5a4a4a', leg: '#1c1a1a', tail: '#1c1a1a',
});

const charolais = () => cattle({
  coat: shade('#e8dcc4', '#f6eee0', 0.2, 0.45), face: '#efe6d4', muzzle: '#e8b0a0', ear: '#efe6d4', leg: '#e8dcc4', hoof: '#6a5a4a', tail: '#efe6d4', tailTip: '#d8ccb8',
  slim: 1.05,
});

const elk = () => cattle({
  coat: (_x, y, z) => (z > 0.1 || y < 0.3 ? '#4a2e1a' : z < -0.18 && y > 0.4 ? '#e8d8b0' : '#b88a50'), face: '#5a3a22', muzzle: '#2a1a12',
  legLen: 0.32, slim: 0.82, head: 0.9, leg: '#3a2414', ear: '#6a4a2a', earLen: 0.07, tail: '#e8d8b0', tailTip: '#e8d8b0', dewlap: '#4a2e1a',
  extraHead: (h) => {
    // wide sweeping antlers with long tines
    for (const sx of [-1, 1]) {
      const pts: Box[] = [[0.03, 0.07, -0.01], [0.09, 0.14, -0.05], [0.14, 0.23, -0.08], [0.17, 0.33, -0.06], [0.16, 0.42, -0.02]];
      for (let i = 0; i < pts.length - 1; i++) h.add(capsule(sx * pts[i][0], pts[i][1], pts[i][2], sx * pts[i + 1][0], pts[i + 1][1], pts[i + 1][2], 0.014, 0.009), '#d8c8a0', 0.01);
      for (const k of [1, 2, 3]) h.add(capsule(sx * pts[k][0], pts[k][1], pts[k][2], sx * (pts[k][0] - 0.01), pts[k][1] + 0.07, pts[k][2] + 0.07, 0.008, 0.004), '#e8dcc0', 0.006);
    }
  },
});

// ---------------------------------------------------------------- sheep and goats

const valaisBlacknose = () => smallRuminant({
  coat: '#f6f0e4', face: '#141212', muzzle: '#141212', legColor: '#f0eadc', ear: '#141212', woolSize: 0.066, tuft: '#fbf8f0',
  wool: (x, y, z) => mixHex('#ece2cc', '#fffcf4', smooth(0.14, 0.36, y + (noise3(x * 20, y * 20, z * 20) - 0.5) * 0.08)),
  horns: [curlHorn(0.035, '#d8c8a8', 0.02)],
});

const dorper = () => smallRuminant({
  coat: (_x, _y, z) => (z > 0.08 ? '#161414' : '#f2ece0'), face: '#161414', muzzle: '#2a2626', legColor: '#f2ece0', ear: '#161414',
});

const boerGoat = () => smallRuminant({
  coat: '#f4efe6', face: '#8a3a1a', muzzle: '#6a2a14', legColor: '#f0eadc', earDroop: true, ear: '#7a3216',
  horns: [{ pts: [[0.026, 0.05, 0.0], [0.04, 0.09, -0.04], [0.05, 0.1, -0.08]], r0: 0.012, r1: 0.005, color: '#4a3a30' }],
});

const pygmyGoat = () => smallRuminant({
  coat: (x, y, z) => (y < 0.25 ? '#3a3230' : mixHex('#6a5a4a', '#9a8a78', noise3(x * 30, y * 30, z * 30))), face: '#6a5a4a', muzzle: '#d8b0a8', legColor: '#3a3230', beard: '#8a7a68',
  horns: [{ pts: [[0.022, 0.05, 0.0], [0.03, 0.08, -0.02]], r0: 0.01, r1: 0.005, color: '#8a7a68' }],
});

// ---------------------------------------------------------------- horses

interface Horse { coat: Paint; mane: string; face?: (x: number, y: number, z: number) => string; leg: string | ((y: number) => string); hoof?: string; ear?: number; feather?: string }
function horseLike(o: Horse): CreatureParts {
  const b = new Sculpt()
    .add(ellipsoid(0, 0.45, 0, 0.11, 0.11, 0.2), o.coat)
    .add(sphere(0, 0.45, 0.12, 0.11), o.coat, 0.08)
    .add(sphere(0, 0.46, -0.13, 0.11), o.coat, 0.08)
    .add(capsule(0, 0.47, 0.14, 0, 0.6, 0.22, 0.075, 0.058), o.coat, 0.06);
  for (let i = 0; i <= 6; i++) { const t = i / 6; b.add(sphere(0, 0.53 + t * 0.12, 0.1 + t * 0.11, 0.032 - t * 0.006), o.mane, 0.018); }
  const body = build(b, [-0.15, 0.3, -0.27], [0.15, 0.7, 0.32], C);
  const base = typeof o.coat === 'string' ? o.coat : '#8a5a34';
  const face = o.face ?? (() => base);
  const h = new Sculpt()
    .add(sphere(0, 0, 0, 0.065), face)
    .add(capsule(0, -0.01, 0.02, 0, -0.04, 0.12, 0.055, 0.046), face, 0.03)
    .carve(ellipsoid(0.022, -0.035, 0.165, 0.009, 0.012, 0.01), 0.004)
    .carve(ellipsoid(-0.022, -0.035, 0.165, 0.009, 0.012, 0.01), 0.004)
    .add(sphere(0, 0.06, 0.03, 0.026), o.mane, 0.015);
  const el = o.ear ?? 0.065;
  for (const sx of [-1, 1]) h.add(capsule(sx * 0.03, 0.05, -0.01, sx * (0.04 + el * 0.15), 0.05 + el, -0.02, 0.02 + el * 0.08, 0.006), base, 0.012);
  const head = build(h, [-0.12, -0.11, -0.08], [0.12, 0.05 + el + 0.05, 0.2], C * 0.55);
  const tail = build(new Sculpt()
    .add(capsule(0, 0, 0, 0, -0.2, -0.05, 0.032, 0.02), o.mane)
    .displace((x, y, z) => noise3(x * 70, y * 20, z * 70) * 0.01), [-0.06, -0.25, -0.1], [0.06, 0.04, 0.05], C * 0.6);
  return {
    toon: true, eye: eyeOn(0.065, 0.55, 0.25, 0.3, 0.6), body, head, headAt: [0, 0.62, 0.25],
    leg: toonLeg(0.3, o.feather ? 0.074 : 0.064, o.leg, o.hoof ?? '#2e2018'),
    legs: [[-0.065, 0.15], [0.065, 0.15], [-0.065, -0.15], [0.065, -0.15]], legLen: 0.3, tail, tailAt: [0, 0.5, -0.25],
  };
}

const clydesdale = () => horseLike({
  coat: shade('#6a3a1a', '#4a2812', 0.34, 0.56), mane: '#1a1210', feather: '#f6f2ea',
  face: (x, y, z) => (Math.abs(x) < 0.022 + z * 0.1 && z > 0.0 && y > -0.05 ? '#fbf6ee' : z > 0.1 ? '#3a2012' : '#6a3a1a'),
  leg: (y) => (y < -0.14 ? '#f6f2ea' : '#4a2812'),
});

const appaloosa = () => horseLike({
  coat: (x, y, z) => (z < -0.02 && y > 0.4 ? (noise3(x * 40, y * 40, z * 40) > 0.62 ? '#3a2a22' : '#f4efe6') : mixHex('#8a8680', '#b8b2a8', noise3(x * 20, y * 20, z * 20))),
  mane: '#2a2220', leg: (y) => (y < -0.2 ? '#3a3230' : '#9a948a'),
  face: (_x, _y, z) => (z > 0.1 ? '#4a4240' : '#9a948a'),
});

const mule = () => horseLike({
  coat: shade('#6a4a32', '#5a3c28', 0.3, 0.5), mane: '#2a1e16', ear: 0.12,
  face: (_x, y, z) => (z > 0.1 && y < -0.02 ? '#d8c8b0' : '#6a4a32'), leg: (y) => (y < -0.2 ? '#3a2a1e' : '#5a3c28'),
});

// ---------------------------------------------------------------- rabbits

function rabbitLike(fur: string, belly: string, lop: boolean, fluffy: boolean, coat?: (x: number, y: number, z: number) => string | null): CreatureParts {
  const paint = (x: number, y: number, z: number) => coat?.(x, y, z) ?? (z > 0.02 && y < 0.1 && Math.abs(x) < 0.04 ? belly : shade(fur, mixHex(fur, '#ffffff', 0.2), 0.03, 0.14)(x, y));
  const b = new Sculpt()
    .add(ellipsoid(0, 0.085, -0.02, 0.065, 0.072, 0.085), paint)
    .add(sphere(0.042, 0.065, -0.045, 0.048), paint, 0.03)
    .add(sphere(-0.042, 0.065, -0.045, 0.048), paint, 0.03)
    .add(sphere(0, 0.1, -0.1, 0.03), '#ffffff', 0.015);
  for (const sx of [-1, 1]) {
    b.add(ellipsoid(sx * 0.026, 0.016, 0.055, 0.018, 0.015, 0.028), belly, 0.012);
    b.add(ellipsoid(sx * 0.048, 0.012, -0.02, 0.022, 0.013, 0.05), belly, 0.015);
  }
  if (fluffy) puffs(b, [0, 0.09, -0.02], [0.07, 0.07, 0.09], 30, 0.035, fur, 1.2);
  const body = build(b, [-0.13, -0.01, -0.17], [0.13, 0.22, 0.13], C * 0.55);
  const h = new Sculpt()
    .add(sphere(0, 0, 0, 0.058), fur)
    .add(ellipsoid(0, -0.015, 0.02, 0.055, 0.042, 0.045), fur, 0.03)
    .add(sphere(0.013, -0.022, 0.05, 0.018), belly, 0.01)
    .add(sphere(-0.013, -0.022, 0.05, 0.018), belly, 0.01)
    .add(sphere(0, -0.005, 0.063, 0.009), '#f08aa0', 0.005);
  for (const sx of [-1, 1]) {
    // lop ears hang down past the cheeks; others stand up
    if (lop) h.add(capsule(sx * 0.045, 0.03, -0.005, sx * 0.07, -0.06, 0.005, 0.02, 0.024), fur, 0.012);
    else {
      h.add(capsule(sx * 0.022, 0.04, -0.01, sx * 0.036, 0.15, -0.03, 0.022, 0.016), fur, 0.012);
      h.add(ellipsoid(sx * 0.031, 0.1, 0.002, 0.011, 0.04, 0.006), '#f4a0b0', 0.004);
    }
  }
  if (fluffy) puffs(h, [0, 0.01, -0.01], [0.05, 0.05, 0.05], 12, 0.024, fur, 1.4, -0.3);
  const head = build(h, [-0.11, -0.1, -0.09], [0.11, 0.19, 0.1], C * 0.45);
  return { toon: true, eye: eyeOn(0.058, 0.46, 0.2, 0.32, 0.45), body, head, headAt: [0, 0.17, 0.07], leg: null, legs: [], legLen: 0, tail: null, tailAt: [0, 0, 0] };
}
const lopRabbit = () => rabbitLike('#c8986a', '#f4ece0', true, false);
const angoraRabbit = () => rabbitLike('#f6f2ec', '#ffffff', false, true);

// ---------------------------------------------------------------- hens

interface Hen { body: Paint; neck?: Paint; comb?: string; tail: Paint; legC: string; feathered?: string; crest?: string; fluffy?: boolean }
function henLike(o: Hen): CreatureParts {
  const b = new Sculpt()
    .add(ellipsoid(0, 0.16, -0.01, 0.08, 0.075, 0.095), o.body)
    .add(sphere(0, 0.17, 0.04, 0.068), o.body, 0.04)
    .add(capsule(0, 0.18, 0.04, 0, 0.23, 0.07, 0.044, 0.036), o.neck ?? o.body, 0.03)
    .add(capsule(0, 0.17, -0.07, 0, 0.25, -0.11, 0.036, 0.018), o.tail, 0.03)
    .add(capsule(0.025, 0.17, -0.07, 0.035, 0.23, -0.12, 0.026, 0.014), o.tail, 0.02)
    .add(capsule(-0.025, 0.17, -0.07, -0.035, 0.23, -0.12, 0.026, 0.014), o.tail, 0.02);
  for (const sx of [-1, 1]) b.add(ellipsoid(sx * 0.07, 0.165, -0.01, 0.022, 0.048, 0.068), o.body, 0.015);
  if (o.fluffy) b.displace((x, y, z) => noise3(x * 70, y * 70, z * 70) * 0.01);
  const body = build(b, [-0.12, 0.07, -0.17], [0.12, 0.3, 0.14], C * 0.55);
  const h = new Sculpt()
    .add(sphere(0, 0, 0, 0.043), o.neck ?? o.body)
    .add(capsule(0, -0.002, 0.035, 0, -0.008, 0.062, 0.014, 0.003), '#e8b040', 0.006);
  if (o.comb) {
    h.add(sphere(0, 0.045, 0.014, 0.016), o.comb, 0.008).add(sphere(0, 0.052, -0.006, 0.019), o.comb, 0.008).add(sphere(0, 0.044, -0.026, 0.015), o.comb, 0.008)
      .add(ellipsoid(0, -0.032, 0.034, 0.01, 0.018, 0.01), o.comb, 0.008);
  }
  if (o.crest) puffs(h, [0, 0.045, -0.004], [0.035, 0.03, 0.035], 14, 0.024, o.crest, 1.2, -0.2);
  const head = build(h, [-0.07, -0.06, -0.07], [0.07, 0.1, 0.08], C * 0.4);
  const leg = birdLeg(0.08, 0.022, o.legC);
  if (o.feathered) {
    // feathered feet: a fluffy cuff of feathers down each leg
    const f = build(new Sculpt().add(ellipsoid(0, -0.05, 0.005, 0.018, 0.03, 0.02), o.feathered), [-0.03, -0.09, -0.03], [0.03, -0.01, 0.04], C * 0.3);
    return { toon: true, eye: eyeOn(0.043, 0.6, 0.25, 0.3, 0.8), body, head, headAt: [0, 0.24, 0.07], leg: merge2(leg, f), legs: [[-0.03, 0], [0.03, 0]], legLen: 0.08, tail: null, tailAt: [0, 0, 0] };
  }
  return { toon: true, eye: eyeOn(0.043, 0.6, 0.25, 0.3, 0.8), body, head, headAt: [0, 0.24, 0.07], leg, legs: [[-0.03, 0], [0.03, 0]], legLen: 0.08, tail: null, tailAt: [0, 0, 0] };
}
const merge2 = (a: THREE.BufferGeometry, b: THREE.BufferGeometry) => (mergeGeometries([a, b]) ?? a) as THREE.BufferGeometry;

const orpington = () => henLike({ body: shade('#d89a48', '#eab86a', 0.12, 0.26), comb: '#d8302a', tail: '#c88a3a', legC: '#e8d8c0', fluffy: true });
const brahmaChicken = () => henLike({
  body: '#f6f2ea', neck: (x, y, z) => (Math.sin(Math.atan2(x, z) * 10) > 0.2 && y > 0.18 ? '#1e1c1e' : '#f6f2ea'), comb: '#d8302a',
  tail: '#1e1c1e', legC: '#e8c060', feathered: '#f6f2ea', fluffy: true,
});
const polishChicken = () => henLike({ body: '#1e1c20', tail: '#1e1c20', legC: '#5a5a6a', crest: '#fbf8f0' });

// ---------------------------------------------------------------- ducks, geese and peafowl

function duckLike(bodyC: string, bill: string): CreatureParts {
  const b = new Sculpt()
    .add(ellipsoid(0, 0.065, -0.005, 0.078, 0.058, 0.11), bodyC)
    .add(ellipsoid(0, 0.1, -0.1, 0.03, 0.026, 0.036), bodyC, 0.03)
    .add(capsule(0, 0.09, 0.06, 0, 0.15, 0.085, 0.034, 0.028), bodyC, 0.025);
  for (const sx of [-1, 1]) b.add(ellipsoid(sx * 0.062, 0.08, -0.015, 0.02, 0.036, 0.072), mixHex(bodyC, '#d8d0c0', 0.3), 0.015);
  const body = build(b, [-0.1, -0.01, -0.16], [0.1, 0.19, 0.13], C * 0.55);
  const h = new Sculpt().add(sphere(0, 0, 0, 0.044), bodyC).add(ellipsoid(0, -0.012, 0.054, 0.026, 0.01, 0.034), bill, 0.01);
  const head = build(h, [-0.06, -0.06, -0.06], [0.06, 0.06, 0.1], C * 0.4);
  return { toon: true, eye: eyeOn(0.044, 0.6, 0.25, 0.3, 0.8), body, head, headAt: [0, 0.16, 0.085], leg: null, legs: [], legLen: 0, tail: null, tailAt: [0, 0, 0] };
}
const pekinDuck = () => duckLike('#fbf4e2', '#f5a023');

const indianRunner = () => walker({
  body: (_x, y) => (y > 0.2 ? '#f4efe6' : '#8a6a44'), size: 0.85, neck: '#f4efe6', neckLen: 0.2, head: (_x, y) => (y > 0.0 ? '#7a5a3a' : '#f4efe6'),
  beak: '#6a8a3a', beakLen: 0.035, legLen: 0.07, legColor: '#e8902a', tail: '#8a6a44',
});

function gooseLike(back: string, belly: string, bill: string): CreatureParts {
  const paint = (_x: number, y: number) => (y < 0.15 ? belly : back);
  const b = new Sculpt()
    .add(ellipsoid(0, 0.16, -0.02, 0.085, 0.075, 0.115), paint)
    .add(ellipsoid(0, 0.19, -0.12, 0.03, 0.026, 0.036), back, 0.03)
    .add(capsule(0, 0.18, 0.06, 0, 0.3, 0.105, 0.036, 0.026), back, 0.03)
    .add(ellipsoid(0, 0.1, 0.0, 0.05, 0.03, 0.06), belly, 0.03);
  for (const sx of [-1, 1]) b.add(ellipsoid(sx * 0.07, 0.175, -0.03, 0.022, 0.044, 0.078), shade(back, '#5a5a5e', 0.14, 0.2), 0.015);
  const body = build(b, [-0.12, 0.05, -0.17], [0.12, 0.34, 0.15], C * 0.55);
  const h = new Sculpt().add(sphere(0, 0, 0, 0.038), back).add(capsule(0, -0.005, 0.03, 0, -0.012, 0.066, 0.016, 0.009), bill, 0.008);
  const head = build(h, [-0.055, -0.05, -0.05], [0.055, 0.05, 0.09], C * 0.4);
  return { toon: true, eye: eyeOn(0.038, 0.62, 0.25, 0.3, 0.85), body, head, headAt: [0, 0.31, 0.11], leg: birdLeg(0.1, 0.024, bill), legs: [[-0.035, 0], [0.035, 0]], legLen: 0.1, tail: null, tailAt: [0, 0, 0] };
}
const toulouseGoose = () => gooseLike('#7a7a80', '#e8e4dc', '#f08a24');

function whitePeacock(): CreatureParts {
  const white = '#f8f6f2';
  const b = new Sculpt()
    .add(ellipsoid(0, 0.2, 0, 0.06, 0.065, 0.085), white)
    .add(capsule(0, 0.22, 0.04, 0, 0.33, 0.09, 0.03, 0.022), white, 0.02);
  for (let i = -6; i <= 6; i++) {
    const a = i * 0.23, ex = Math.sin(a) * 0.28, ey = 0.19 + Math.cos(a) * 0.24, ez = -0.12 - Math.cos(a) * 0.09;
    const tip: Box = [ex * 0.88, 0.19 + (ey - 0.19) * 0.88, ez];
    const feather = (x: number, y: number, z: number) => (Math.hypot(x - tip[0], y - tip[1], z - tip[2]) < 0.03 ? '#e8e4dc' : white);
    b.add(capsule(0, 0.19, -0.07, ex, ey, ez, 0.028, 0.042), feather, 0.012);
  }
  const body = build(b, [-0.34, 0.1, -0.3], [0.34, 0.49, 0.14], C * 0.6);
  const h = new Sculpt().add(sphere(0, 0, 0, 0.03), white).add(capsule(0, -0.004, 0.024, 0, -0.006, 0.042, 0.008, 0.003), '#e8d8b8', 0.004);
  for (const i of [-1, 0, 1]) {
    h.add(capsule(i * 0.006, 0.025, 0, i * 0.016, 0.065, -0.012, 0.0045), white, 0.004);
    h.add(sphere(i * 0.016, 0.068, -0.013, 0.008), white, 0.003);
  }
  const head = build(h, [-0.05, -0.04, -0.05], [0.05, 0.09, 0.06], C * 0.35);
  return { toon: true, eye: eyeOn(0.03, 0.62, 0.25, 0.34, 0.85), body, head, headAt: [0, 0.34, 0.09], leg: birdLeg(0.12, 0.02, '#c8c0b8'), legs: [[-0.028, 0], [0.028, 0]], legLen: 0.12, tail: null, tailAt: [0, 0, 0] };
}

// ---------------------------------------------------------------- third wave breeds

const leghorn = () => henLike({ body: '#fbfaf4', comb: '#e02a24', tail: '#f4f2ea', legC: '#f0c030' });
const rhodeIslandRed = () => henLike({ body: shade('#8a2a14', '#a83a1e', 0.12, 0.26), comb: '#e02a24', tail: '#1a2a22', legC: '#f0c030' });
const wyandotte = () => henLike({
  body: (x, _y, z) => (Math.sin(x * 90) * Math.sin(z * 90) > 0.25 ? '#1e1c1e' : '#f4f2ec'), neck: '#f4f2ec', comb: '#d8302a', tail: '#1e1c1e', legC: '#f0c030', fluffy: true,
});
const marans = () => henLike({ body: '#1e1c1c', neck: (_x, y) => (y > 0.2 ? '#b8641a' : '#1e1c1c'), comb: '#d8302a', tail: '#1a2420', legC: '#e8d8b8', feathered: '#2a2626' });
const khakiCampbell = () => duckLike('#b89a6a', '#3a5a3a');
const callDuck = () => duckLike('#f8f6ee', '#f5a023');
const emdenGoose = () => gooseLike('#f6f4ee', '#ffffff', '#f08a24');
const dutchRabbit = () => rabbitLike('#1e1c1e', '#ffffff', false, false, (_x, y, z) => (z > -0.01 || y < 0.03 ? '#fbfaf6' : null));
const guernsey = () => cattle({
  coat: (x, y, z) => patches(x, y, z, 0.55, '#f6f0e6', '#c8843a'), face: (x, _y, z) => (Math.abs(x) < 0.03 && z > 0.02 ? '#f6f0e6' : '#c8843a'), muzzle: '#e8c0a8',
  ear: '#c8843a', leg: (y) => (y < -0.1 ? '#f6f0e6' : '#c8843a'), tail: '#c8843a',
  horns: { pts: [[0.05, 0.1, -0.01], [0.075, 0.14, -0.02], [0.08, 0.16, 0.0]], r0: 0.015, r1: 0.007, color: '#f3e6c4' },
});
const brownSwiss = () => cattle({
  coat: shade('#6a5a4a', '#7e6c5a', 0.2, 0.45), face: '#6a5a4a', muzzle: '#2a2626', ear: '#6a5a4a', earLen: 0.07, leg: '#5a4a3a', tail: '#6a5a4a',
  extraHead: (h, k) => h.add(ellipsoid(0, -0.05 * k, 0.12 * k, 0.095 * k, 0.066 * k, 0.05 * k), '#e8e0d0', 0.02),
});
const dexter = () => cattle({ coat: shade('#1e1c1c', '#2a2626', 0.2, 0.45), face: '#1e1c1c', muzzle: '#2a2626', ear: '#1e1c1c', leg: '#1e1c1c', legLen: 0.13, slim: 0.9, tail: '#1e1c1c',
  horns: { pts: [[0.05, 0.1, -0.01], [0.08, 0.14, 0.0], [0.08, 0.17, 0.03]], r0: 0.014, r1: 0.006, color: '#e8dcc0' } });
const shetlandSheep = () => smallRuminant({
  coat: '#6a4a30', face: '#6a4a30', muzzle: '#4a3020', legColor: '#6a4a30', ear: '#6a4a30',
  wool: (x, y, z) => mixHex('#5a3e28', '#8a6444', smooth(0.14, 0.36, y + (noise3(x * 26, y * 26, z * 26) - 0.5) * 0.06)),
});
const karakul = () => smallRuminant({
  coat: '#2a2624', face: '#1a1818', muzzle: '#1a1818', legColor: '#1a1818', ear: '#1a1818', woolSize: 0.038,
  wool: (x, y, z) => mixHex('#1e1a1a', '#3e3634', noise3(x * 50, y * 50, z * 50)),
});
const alpineGoat = () => smallRuminant({
  coat: (_x, _y, z) => (z > 0.0 ? '#f0e2c8' : '#1e1c1c'), face: (x, _y, z) => (Math.abs(x) > 0.02 && z > 0.02 ? '#1e1c1c' : '#f0e2c8'), muzzle: '#d8b0a8',
  legColor: '#1e1c1c', beard: '#8a7a68',
  horns: [{ pts: [[0.026, 0.05, 0.0], [0.04, 0.1, -0.04], [0.045, 0.13, -0.09]], r0: 0.012, r1: 0.005, color: '#6a5a48' }],
});
const palomino = () => horseLike({
  coat: shade('#d8a848', '#e8bc60', 0.34, 0.56), mane: '#f8f0dc',
  face: (x, y, z) => (Math.abs(x) < 0.016 + z * 0.08 && z > 0.02 && y > -0.03 ? '#fbf6ee' : '#d8a848'), leg: (y) => (y < -0.22 ? '#fbf6ee' : '#d8a848'),
});
const friesian = () => horseLike({ coat: shade('#161416', '#221e20', 0.34, 0.56), mane: '#0e0c0e', feather: '#161416', leg: '#161416' });

void ears;

export const toonMakers3: Record<string, () => CreatureParts> = {
  texas_longhorn: texasLonghorn, angus_cow: angusCow, charolais, elk, valais_blacknose: valaisBlacknose, dorper, boer_goat: boerGoat,
  pygmy_goat: pygmyGoat, clydesdale, appaloosa, mule, lop_rabbit: lopRabbit, angora_rabbit: angoraRabbit, orpington,
  brahma_chicken: brahmaChicken, polish_chicken: polishChicken, pekin_duck: pekinDuck, indian_runner: indianRunner,
  toulouse_goose: toulouseGoose, white_peacock: whitePeacock,
  leghorn, rhode_island_red: rhodeIslandRed, wyandotte, marans, khaki_campbell: khakiCampbell, call_duck: callDuck, emden_goose: emdenGoose,
  dutch_rabbit: dutchRabbit, guernsey, brown_swiss: brownSwiss, dexter, shetland_sheep: shetlandSheep, karakul, alpine_goat: alpineGoat,
  palomino, friesian,
};
