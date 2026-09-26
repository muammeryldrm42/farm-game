// Cartoon style animals, in the spirit of classic farm games: big heads, short sturdy legs,
// round bodies, clean bright coats and large friendly eyes. Every kind keeps the same pivots
// as its realistic sculpt (legs, head, tail), so all the animations work unchanged.
import * as THREE from 'three';
import { Sculpt, capsule, ellipsoid, noise3, sphere, type Paint } from './sdf';
import type { CreatureParts } from './creatures';

const C = 0.0065;
type Eye = [number, number, number, number, number];
type Box = [number, number, number];

// eye spec on a head sphere of radius R: spread and lift as fractions of R, size, outward yaw
function eyeOn(R: number, spread = 0.42, up = 0.22, size = 0.3, yaw = 0.4): Eye {
  const x = R * spread, y = R * up;
  const z = Math.sqrt(Math.max(0, R * R - x * x - y * y)) * 0.93;
  return [x, y, z, R * size, yaw];
}

// blend two hex colors, t from 0 to 1
function mixHex(a: string, b: string, t: number) {
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
  const ch = (sh: number) => Math.round(((pa >> sh) & 255) * (1 - t) + ((pb >> sh) & 255) * t);
  return '#' + ((ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).padStart(6, '0');
}
const smooth = (e0: number, e1: number, v: number) => {
  const t = Math.max(0, Math.min(1, (v - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};

// soft edged patches: a blend band instead of a hard threshold keeps outlines round and clean
function patches(x: number, y: number, z: number, th: number, spot: string, base: string) {
  const v = noise3(x * 5 + 3, y * 5, z * 5) * 0.8 + noise3(x * 11 + 8, y * 11, z * 11) * 0.2;
  return mixHex(base, spot, smooth(th - 0.035, th + 0.035, v));
}

// a gentle top to bottom shade: a touch lighter on the back, warmer on the belly
function shade(base: string, belly: string, y0: number, y1: number) {
  return (_x: number, y: number) => mixHex(belly, base, smooth(y0, y1, y));
}

// short sturdy leg ending in a rounded hoof or paw
function toonLeg(len: number, th: number, color: string | ((y: number) => string), hoof: string) {
  const paint = (_x: number, y: number) => (y < -len + 0.035 ? hoof : typeof color === 'string' ? color : color(y));
  return new Sculpt()
    .add(capsule(0, 0.02, 0, 0, -len + 0.03, 0.004, th * 0.62, th * 0.5), paint)
    .add(ellipsoid(0, -len + 0.018, 0.006, th * 0.58, 0.022, th * 0.64), hoof, 0.02)
    .build([-th, -len - 0.01, -th], [th, 0.05, th + 0.02], C * 0.7);
}

// thin bird leg with three forward toes
function birdLeg(len: number, th: number, color: string) {
  const s = new Sculpt().add(capsule(0, 0.02, 0, 0, -len + 0.006, 0.004, th * 0.5, th * 0.42), color);
  for (const a of [-0.55, 0, 0.55]) {
    s.add(capsule(0, -len + 0.005, 0.004, Math.sin(a) * th * 2.2, -len + 0.004, 0.004 + Math.cos(a) * th * 2.4, th * 0.3), color, th * 0.4);
  }
  s.add(capsule(0, -len + 0.005, 0.004, 0, -len + 0.004, -th * 1.1, th * 0.26), color, th * 0.4);
  return s.build([-th * 3, -len - 0.01, -th * 2], [th * 3, 0.04, th * 3.5], Math.min(C * 0.5, th * 0.22), 1.6);
}

// a fluffy cloud of puffs around an ellipsoid (wool, fleece, down)
function puffs(s: Sculpt, c: Box, r: Box, n: number, size: number, paint: Paint, seed = 1, minY = -1) {
  const ga = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const y = 1 - (2 * (i + 0.5)) / n;
    if (y < minY) continue;
    const rad = Math.sqrt(1 - y * y), th = ga * i + seed;
    const jit = 0.85 + 0.3 * ((Math.sin(i * 12.9898 + seed * 78.233) * 43758.5453) % 1 + 1) % 1;
    s.add(sphere(c[0] + Math.cos(th) * rad * r[0] * 0.86, c[1] + y * r[1] * 0.86, c[2] + Math.sin(th) * rad * r[2] * 0.86, size * jit), paint, size * 0.45);
  }
  return s;
}

// ear sticking out sideways with a pink inside
function ears(h: Sculpt, x: number, y: number, z: number, len: number, w: number, color: string, inner = '#f4a9b8', droop = 0) {
  for (const sx of [-1, 1]) {
    h.add(ellipsoid(sx * x, y - droop, z, len, w * 0.42, w * 0.62), color, w * 0.4);
    h.add(ellipsoid(sx * (x + len * 0.12), y - droop, z + w * 0.3, len * 0.62, w * 0.2, w * 0.3), inner, w * 0.12);
  }
}

// a curved horn from a list of points with tapering radius, mirrored on both sides
function horns(h: Sculpt, pts: Box[], r0: number, r1: number, color: string) {
  for (const sx of [-1, 1]) {
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i], b = pts[i + 1];
      const ra = r0 + (r1 - r0) * (i / (pts.length - 1)), rb = r0 + (r1 - r0) * ((i + 1) / (pts.length - 1));
      h.add(capsule(sx * a[0], a[1], a[2], sx * b[0], b[1], b[2], ra, rb), color, 0.012);
    }
  }
}

function build(s: Sculpt, min: Box, max: Box, cell: number, grain = 0.02) {
  s.grain = grain;
  return s.build(min, max, cell);
}

// ---------------------------------------------------------------- cattle and friends

function cow(): CreatureParts {
  const coat = (x: number, y: number, z: number) => patches(x, y, z, 0.6, '#2a2826', '#fbf9f4');
  const b = new Sculpt()
    .add(ellipsoid(0, 0.3, -0.01, 0.15, 0.135, 0.2), coat)
    .add(sphere(0, 0.31, 0.1, 0.13), coat, 0.09)
    .add(sphere(0, 0.31, -0.12, 0.13), coat, 0.09)
    .add(capsule(0, 0.33, 0.14, 0, 0.39, 0.21, 0.09, 0.08), coat, 0.07)
    // round pink udder
    .add(ellipsoid(0, 0.19, -0.1, 0.06, 0.04, 0.055), '#f4a9b8', 0.04);
  for (const [x, z] of [[0.022, -0.085], [-0.022, -0.085], [0.022, -0.12], [-0.022, -0.12]]) b.add(sphere(x, 0.155, z, 0.012), '#ee97a8', 0.012);
  const body = build(b, [-0.18, 0.12, -0.3], [0.18, 0.48, 0.3], C);
  const face = (x: number, y: number, z: number) => (z > 0.02 && Math.abs(x) < 0.05 + y * 0.2 ? '#fbf9f4' : patches(x + 3, y, z, 0.45, '#2a2826', '#fbf9f4'));
  const h = new Sculpt()
    .add(sphere(0, 0.03, 0.0, 0.1), face)
    .add(ellipsoid(0, -0.02, 0.06, 0.088, 0.075, 0.07), face, 0.05)
    .add(ellipsoid(0, -0.05, 0.12, 0.09, 0.062, 0.058), '#f7b3c0', 0.03)
    .carve(ellipsoid(0.035, -0.04, 0.175, 0.014, 0.018, 0.014), 0.006)
    .carve(ellipsoid(-0.035, -0.04, 0.175, 0.014, 0.018, 0.014), 0.006)
    .carve(capsule(-0.03, -0.085, 0.165, 0.03, -0.085, 0.165, 0.004), 0.004)
    // tuft of hair between the horns
    .add(sphere(0, 0.125, 0.01, 0.028), '#2a2826', 0.02)
    .add(sphere(0.02, 0.13, 0.03, 0.02), '#2a2826', 0.015)
    .add(sphere(-0.02, 0.13, 0.03, 0.02), '#2a2826', 0.015);
  ears(h, 0.12, 0.04, -0.01, 0.055, 0.052, '#2a2826');
  horns(h, [[0.05, 0.11, -0.01], [0.075, 0.145, -0.02], [0.08, 0.165, -0.01]], 0.018, 0.009, '#f3e6c4');
  const head = build(h, [-0.19, -0.13, -0.11], [0.19, 0.2, 0.2], C * 0.6, 0.015);
  const tail = build(new Sculpt()
    .add(capsule(0, 0, 0, 0, -0.17, 0.01, 0.012, 0.009), '#fbf9f4')
    .add(sphere(0, -0.19, 0.012, 0.026), '#2a2826', 0.02), [-0.04, -0.23, -0.04], [0.04, 0.02, 0.05], C * 0.55);
  return {
    toon: true, eye: [0.046, 0.05, 0.094, 0.033, 0.36], bell: [0, 0.36, 0.18, 0.1],
    body, head, headAt: [0, 0.42, 0.24], leg: toonLeg(0.17, 0.075, '#fbf9f4', '#4a3a30'),
    legs: [[-0.085, 0.12], [0.085, 0.12], [-0.085, -0.12], [0.085, -0.12]], legLen: 0.17, tail, tailAt: [0, 0.38, -0.21],
  };
}

function sheep(): CreatureParts {
  const wool = (x: number, y: number, z: number) => mixHex('#efe6d6', '#fdfaf3', smooth(0.16, 0.34, y + (noise3(x * 30, y * 30, z * 30) - 0.5) * 0.04));
  const b = new Sculpt().add(ellipsoid(0, 0.26, 0, 0.12, 0.1, 0.15), wool);
  puffs(b, [0, 0.26, 0], [0.12, 0.1, 0.15], 34, 0.052, wool, 1.3);
  b.add(sphere(0, 0.29, -0.17, 0.035), wool, 0.02);
  const body = build(b, [-0.2, 0.1, -0.24], [0.2, 0.42, 0.24], C, 0.01);
  const face = '#3b322d';
  const h = new Sculpt()
    .add(sphere(0, 0, 0, 0.068), face)
    .add(ellipsoid(0, -0.02, 0.05, 0.05, 0.045, 0.05), face, 0.03)
    .add(ellipsoid(0, -0.03, 0.09, 0.03, 0.022, 0.014), '#4a3f39', 0.01)
    .carve(capsule(-0.014, -0.05, 0.095, 0.014, -0.05, 0.095, 0.003), 0.003);
  ears(h, 0.085, 0.005, -0.01, 0.045, 0.036, face, '#e79aa8', 0.01);
  puffs(h, [0, 0.05, -0.005], [0.05, 0.03, 0.045], 9, 0.03, '#fdfaf3', 2.1, -0.2);
  const head = build(h, [-0.15, -0.09, -0.08], [0.15, 0.12, 0.13], C * 0.5, 0.01);
  return {
    toon: true, wool: true, eye: eyeOn(0.068, 0.42, 0.2, 0.32, 0.4), body, head, headAt: [0, 0.3, 0.19],
    leg: toonLeg(0.13, 0.05, face, '#1f1a17'), legs: [[-0.06, 0.09], [0.06, 0.09], [-0.06, -0.09], [0.06, -0.09]], legLen: 0.13, tail: null, tailAt: [0, 0, 0],
  };
}

function goat(): CreatureParts {
  const coat = (x: number, y: number, z: number) => patches(x, y, z, 0.64, '#b98a5c', '#f6f2ea');
  const b = new Sculpt()
    .add(ellipsoid(0, 0.29, -0.01, 0.1, 0.095, 0.15), coat)
    .add(sphere(0, 0.3, 0.08, 0.092), coat, 0.07)
    .add(sphere(0, 0.3, -0.1, 0.092), coat, 0.07)
    .add(capsule(0, 0.31, 0.1, 0, 0.37, 0.16, 0.06, 0.05), coat, 0.05);
  const body = build(b, [-0.13, 0.17, -0.22], [0.13, 0.44, 0.23], C * 0.8);
  const h = new Sculpt()
    .add(sphere(0, 0.01, 0, 0.062), '#f6f2ea')
    .add(capsule(0, -0.005, 0.02, 0, -0.035, 0.085, 0.048, 0.036), '#f6f2ea', 0.03)
    .add(ellipsoid(0, -0.042, 0.108, 0.03, 0.022, 0.018), '#dca5a5', 0.012)
    .add(capsule(0, -0.06, 0.07, 0, -0.115, 0.06, 0.018, 0.006), '#e4dccd', 0.012);
  ears(h, 0.075, 0.01, -0.01, 0.045, 0.034, '#f6f2ea', '#eeb0b8');
  horns(h, [[0.026, 0.05, 0.0], [0.04, 0.1, -0.035], [0.046, 0.105, -0.075]], 0.014, 0.005, '#a89a86');
  const head = build(h, [-0.13, -0.14, -0.1], [0.13, 0.13, 0.14], C * 0.5, 0.012);
  const tail = build(new Sculpt().add(capsule(0, 0, 0, 0, 0.05, -0.02, 0.014, 0.008), '#f6f2ea'), [-0.03, -0.02, -0.04], [0.03, 0.07, 0.02], C * 0.5);
  return {
    toon: true, eye: eyeOn(0.062, 0.48, 0.22, 0.32, 0.45), body, head, headAt: [0, 0.37, 0.17],
    leg: toonLeg(0.16, 0.052, '#f6f2ea', '#6a5646'), legs: [[-0.05, 0.09], [0.05, 0.09], [-0.05, -0.09], [0.05, -0.09]], legLen: 0.16, tail, tailAt: [0, 0.34, -0.2],
  };
}

function horse(): CreatureParts {
  const coat = shade('#a4622c', '#8a4f22', 0.34, 0.56);
  const mane = '#3b2415';
  const b = new Sculpt()
    .add(ellipsoid(0, 0.45, 0, 0.11, 0.11, 0.2), coat)
    .add(sphere(0, 0.45, 0.12, 0.11), coat, 0.08)
    .add(sphere(0, 0.46, -0.13, 0.11), coat, 0.08)
    .add(capsule(0, 0.47, 0.14, 0, 0.6, 0.22, 0.075, 0.058), coat, 0.06);
  for (let i = 0; i <= 6; i++) {
    const t = i / 6;
    b.add(sphere(0, 0.53 + t * 0.12, 0.1 + t * 0.11, 0.032 - t * 0.006), mane, 0.018);
  }
  const body = build(b, [-0.15, 0.3, -0.27], [0.15, 0.7, 0.32], C);
  const face = (x: number, y: number, z: number) => (Math.abs(x) < 0.016 + z * 0.08 && z > 0.02 && y > -0.03 ? '#fbf6ee' : z > 0.1 ? '#7a4a2a' : '#a4622c');
  const h = new Sculpt()
    .add(sphere(0, 0, 0, 0.065), face)
    .add(capsule(0, -0.01, 0.02, 0, -0.04, 0.12, 0.055, 0.046), face, 0.03)
    .carve(ellipsoid(0.022, -0.035, 0.165, 0.009, 0.012, 0.01), 0.004)
    .carve(ellipsoid(-0.022, -0.035, 0.165, 0.009, 0.012, 0.01), 0.004)
    .add(sphere(0, 0.06, 0.03, 0.026), mane, 0.015);
  for (const sx of [-1, 1]) h.add(capsule(sx * 0.03, 0.05, -0.01, sx * 0.04, 0.115, -0.02, 0.02, 0.006), '#a4622c', 0.012);
  const head = build(h, [-0.1, -0.11, -0.08], [0.1, 0.14, 0.2], C * 0.55);
  const tail = build(new Sculpt()
    .add(capsule(0, 0, 0, 0, -0.2, -0.05, 0.032, 0.02), mane)
    .displace((x, y, z) => noise3(x * 70, y * 20, z * 70) * 0.01), [-0.06, -0.25, -0.1], [0.06, 0.04, 0.05], C * 0.6);
  return {
    toon: true, eye: eyeOn(0.065, 0.55, 0.25, 0.3, 0.6), body, head, headAt: [0, 0.62, 0.25],
    leg: toonLeg(0.3, 0.064, (y) => (y < -0.2 ? '#fbf6ee' : '#a4622c'), '#2e2018'),
    legs: [[-0.065, 0.15], [0.065, 0.15], [-0.065, -0.15], [0.065, -0.15]], legLen: 0.3, tail, tailAt: [0, 0.5, -0.25],
  };
}

function donkey(): CreatureParts {
  const grey = '#9a948c', light = '#ece6de';
  const coat = (x: number, y: number, z: number) => (y < 0.31 ? light : shade(grey, '#8a847c', 0.32, 0.46)(x, y));
  const b = new Sculpt()
    .add(ellipsoid(0, 0.38, 0, 0.1, 0.1, 0.17), coat)
    .add(sphere(0, 0.38, 0.1, 0.1), coat, 0.07)
    .add(sphere(0, 0.39, -0.1, 0.1), coat, 0.07)
    .add(capsule(0, 0.4, 0.12, 0, 0.5, 0.19, 0.065, 0.052), coat, 0.05);
  for (let i = 0; i <= 5; i++) b.add(sphere(0, 0.46 + i * 0.02, 0.1 + i * 0.018, 0.02), '#4a4440', 0.012);
  const body = build(b, [-0.13, 0.25, -0.24], [0.13, 0.58, 0.27], C);
  const face = (_x: number, _y: number, z: number) => (z > 0.05 ? light : grey);
  const h = new Sculpt()
    .add(sphere(0, 0, 0, 0.065), face)
    .add(capsule(0, -0.01, 0.02, 0, -0.035, 0.1, 0.057, 0.05), face, 0.03)
    .add(ellipsoid(0, -0.03, 0.148, 0.03, 0.018, 0.008), '#5a5450', 0.008)
    .add(sphere(0, 0.06, 0.02, 0.022), '#4a4440', 0.012);
  const ear = (_x: number, y: number) => (y > 0.14 ? '#3a3430' : grey);
  for (const sx of [-1, 1]) {
    h.add(capsule(sx * 0.03, 0.05, -0.02, sx * 0.065, 0.165, -0.04, 0.024, 0.012), ear, 0.012);
    h.add(ellipsoid(sx * 0.046, 0.1, -0.012, 0.01, 0.04, 0.006), '#e8c8c8', 0.004);
  }
  const head = build(h, [-0.12, -0.11, -0.09], [0.12, 0.2, 0.18], C * 0.55);
  const tail = build(new Sculpt()
    .add(capsule(0, 0, 0, 0, -0.15, -0.01, 0.01, 0.008), grey)
    .add(ellipsoid(0, -0.17, -0.01, 0.018, 0.035, 0.018), '#3a3430', 0.012), [-0.04, -0.22, -0.04], [0.04, 0.02, 0.03], C * 0.5);
  return {
    toon: true, eye: eyeOn(0.065, 0.55, 0.25, 0.3, 0.6), body, head, headAt: [0, 0.51, 0.21],
    leg: toonLeg(0.25, 0.058, (y) => (y < -0.18 ? light : grey), '#2a2420'),
    legs: [[-0.058, 0.12], [0.058, 0.12], [-0.058, -0.12], [0.058, -0.12]], legLen: 0.25, tail, tailAt: [0, 0.42, -0.2],
  };
}

function buffalo(): CreatureParts {
  const coat = shade('#4a4a50', '#3a3a40', 0.24, 0.5);
  const b = new Sculpt()
    .add(ellipsoid(0, 0.36, 0, 0.15, 0.14, 0.21), coat)
    .add(sphere(0, 0.4, 0.1, 0.14), coat, 0.09)
    .add(sphere(0, 0.36, -0.13, 0.13), coat, 0.09)
    .add(capsule(0, 0.36, 0.15, 0, 0.37, 0.24, 0.1, 0.09), coat, 0.06);
  const body = build(b, [-0.19, 0.19, -0.3], [0.19, 0.58, 0.36], C);
  const h = new Sculpt()
    .add(ellipsoid(0, 0.0, 0, 0.09, 0.085, 0.085), '#4a4a50')
    .add(ellipsoid(0, -0.03, 0.07, 0.08, 0.06, 0.06), '#5c5c62', 0.04)
    .add(ellipsoid(0, -0.035, 0.125, 0.05, 0.03, 0.012), '#2a2a2e', 0.012)
    .carve(ellipsoid(0.022, -0.03, 0.135, 0.009, 0.011, 0.008), 0.004)
    .carve(ellipsoid(-0.022, -0.03, 0.135, 0.009, 0.011, 0.008), 0.004);
  ears(h, 0.1, 0.0, -0.02, 0.045, 0.036, '#4a4a50', '#8a7078');
  horns(h, [[0.06, 0.05, -0.01], [0.13, 0.07, -0.04], [0.19, 0.11, -0.03], [0.2, 0.16, 0.01]], 0.03, 0.009, '#6e645a');
  const head = build(h, [-0.25, -0.12, -0.11], [0.25, 0.2, 0.17], C * 0.6);
  const tail = build(new Sculpt()
    .add(capsule(0, 0, 0, 0, -0.18, 0.0, 0.012, 0.009), '#4a4a50')
    .add(ellipsoid(0, -0.2, 0, 0.02, 0.035, 0.02), '#1e1e22', 0.012), [-0.04, -0.25, -0.04], [0.04, 0.02, 0.04], C * 0.5);
  return {
    toon: true, eye: eyeOn(0.085, 0.5, 0.2, 0.28, 0.45), body, head, headAt: [0, 0.38, 0.3],
    leg: toonLeg(0.2, 0.08, '#4a4a50', '#1e1e20'), legs: [[-0.09, 0.15], [0.09, 0.15], [-0.09, -0.15], [0.09, -0.15]], legLen: 0.2, tail, tailAt: [0, 0.44, -0.28],
  };
}

function yak(): CreatureParts {
  const coat = '#3d2b1f';
  const hair = (x: number, y: number, z: number) => noise3(x * 45, y * 6, z * 45) * 0.022;
  const b = new Sculpt()
    .add(ellipsoid(0, 0.36, 0, 0.15, 0.15, 0.21), coat)
    .add(sphere(0, 0.44, 0.08, 0.13), coat, 0.09)
    .add(ellipsoid(0, 0.26, 0, 0.165, 0.08, 0.21), '#34241a', 0.06)
    .displace((x, y, z) => (y < 0.34 ? hair(x, y, z) : noise3(x * 30, y * 30, z * 30) * 0.008));
  const body = build(b, [-0.2, 0.14, -0.27], [0.2, 0.6, 0.27], C);
  const face = (x: number, y: number, z: number) => (z > 0.03 && Math.abs(x) < 0.04 && y > -0.05 ? '#efe6d6' : coat);
  const h = new Sculpt()
    .add(sphere(0, 0, 0, 0.08), face)
    .add(ellipsoid(0, -0.03, 0.06, 0.065, 0.055, 0.055), face, 0.03)
    .add(ellipsoid(0, -0.04, 0.105, 0.04, 0.026, 0.012), '#2a1e16', 0.01)
    .add(sphere(0, 0.06, 0.02, 0.045), coat, 0.02);
  ears(h, 0.09, 0.0, -0.02, 0.035, 0.03, coat, '#8a6a5a');
  horns(h, [[0.06, 0.05, 0.0], [0.12, 0.08, 0.0], [0.135, 0.15, 0.02]], 0.022, 0.007, '#efe4cc');
  const head = build(h, [-0.17, -0.1, -0.1], [0.17, 0.18, 0.14], C * 0.55);
  const tail = build(new Sculpt()
    .add(capsule(0, 0, 0, 0, -0.18, -0.02, 0.025, 0.03), coat)
    .displace((x, y, z) => noise3(x * 60, y * 15, z * 60) * 0.012), [-0.06, -0.24, -0.07], [0.06, 0.04, 0.05], C * 0.6);
  return {
    toon: true, eye: eyeOn(0.08, 0.5, 0.2, 0.28, 0.45), body, head, headAt: [0, 0.38, 0.28],
    leg: toonLeg(0.18, 0.072, coat, '#1a120c'), legs: [[-0.085, 0.13], [0.085, 0.13], [-0.085, -0.13], [0.085, -0.13]], legLen: 0.18, tail, tailAt: [0, 0.44, -0.24],
  };
}

function camel(): CreatureParts {
  const coat = shade('#d6aa6c', '#c8985a', 0.5, 0.72);
  const b = new Sculpt()
    .add(ellipsoid(0, 0.58, 0, 0.1, 0.1, 0.18), coat)
    .add(sphere(0, 0.68, -0.02, 0.09), coat, 0.07)
    .add(capsule(0, 0.58, 0.13, 0, 0.52, 0.25, 0.062, 0.05), coat, 0.05)
    .add(capsule(0, 0.52, 0.25, 0, 0.72, 0.34, 0.05, 0.045), coat, 0.04);
  const body = build(b, [-0.13, 0.45, -0.22], [0.13, 0.8, 0.4], C);
  const face = (_x: number, _y: number, z: number) => (z > 0.07 ? '#e8c894' : '#d6aa6c');
  const h = new Sculpt()
    .add(sphere(0, 0, 0, 0.056), face)
    .add(capsule(0, -0.005, 0.02, 0, -0.022, 0.09, 0.044, 0.038), face, 0.03)
    .add(ellipsoid(0, -0.045, 0.1, 0.03, 0.012, 0.022), '#caa272', 0.01)
    .add(sphere(0, 0.045, 0.0, 0.03), '#b8864c', 0.02);
  for (const sx of [-1, 1]) h.add(ellipsoid(sx * 0.045, 0.04, -0.03, 0.016, 0.022, 0.012), '#c8985a', 0.01);
  const head = build(h, [-0.09, -0.08, -0.07], [0.09, 0.1, 0.15], C * 0.5);
  const tail = build(new Sculpt()
    .add(capsule(0, 0, 0, 0, -0.14, -0.01, 0.01, 0.008), '#d6aa6c')
    .add(ellipsoid(0, -0.16, -0.01, 0.016, 0.03, 0.016), '#6a4a2a', 0.01), [-0.03, -0.21, -0.04], [0.03, 0.02, 0.03], C * 0.5);
  return {
    toon: true, eye: eyeOn(0.056, 0.55, 0.25, 0.32, 0.6), body, head, headAt: [0, 0.74, 0.35],
    leg: toonLeg(0.46, 0.058, '#d6aa6c', '#8a6a48'), legs: [[-0.062, 0.13], [0.062, 0.13], [-0.062, -0.13], [0.062, -0.13]], legLen: 0.46, tail, tailAt: [0, 0.6, -0.19],
  };
}

function alpaca(): CreatureParts {
  const fleece = (x: number, y: number, z: number) => mixHex('#d9b98a', '#efd9b0', smooth(0.28, 0.48, y + (noise3(x * 30, y * 30, z * 30) - 0.5) * 0.05));
  const b = new Sculpt()
    .add(ellipsoid(0, 0.36, 0, 0.1, 0.1, 0.14), fleece)
    .add(capsule(0, 0.38, 0.08, 0, 0.56, 0.15, 0.065, 0.055), fleece, 0.04);
  puffs(b, [0, 0.36, 0], [0.1, 0.1, 0.14], 26, 0.045, fleece, 0.7);
  for (let i = 0; i < 6; i++) {
    const t = i / 5, a = i * 2.1;
    b.add(sphere(Math.cos(a) * 0.04, 0.4 + t * 0.15, 0.1 + t * 0.05 + Math.sin(a) * 0.025, 0.04), fleece, 0.02);
  }
  b.add(sphere(0, 0.4, -0.15, 0.035), fleece, 0.02);
  const body = build(b, [-0.16, 0.22, -0.22], [0.16, 0.66, 0.26], C, 0.01);
  const h = new Sculpt()
    .add(sphere(0, 0, 0, 0.055), '#f7ecd8')
    .add(ellipsoid(0, -0.02, 0.045, 0.036, 0.032, 0.036), '#f7ecd8', 0.02)
    .add(ellipsoid(0, -0.02, 0.078, 0.014, 0.01, 0.006), '#4a3a30', 0.006);
  puffs(h, [0, 0.045, -0.005], [0.04, 0.025, 0.035], 8, 0.028, '#efd9b0', 1.7, -0.2);
  for (const sx of [-1, 1]) h.add(capsule(sx * 0.03, 0.05, -0.02, sx * 0.048, 0.11, -0.01, 0.015, 0.009), '#e8d2ac', 0.01);
  const head = build(h, [-0.1, -0.08, -0.08], [0.1, 0.14, 0.1], C * 0.5, 0.01);
  return {
    toon: true, wool: true, eye: eyeOn(0.055, 0.45, 0.22, 0.34, 0.45), body, head, headAt: [0, 0.58, 0.17],
    leg: toonLeg(0.25, 0.054, '#e6cc9e', '#5a4636'), legs: [[-0.055, 0.09], [0.055, 0.09], [-0.055, -0.09], [0.055, -0.09]], legLen: 0.25, tail: null, tailAt: [0, 0, 0],
  };
}

function rabbit(): CreatureParts {
  const fur = (x: number, y: number, z: number) => (z > 0.02 && y < 0.1 && Math.abs(x) < 0.04 ? '#f6efe6' : shade('#cbb39c', '#e6d8c8', 0.03, 0.14)(x, y));
  const b = new Sculpt()
    .add(ellipsoid(0, 0.085, -0.02, 0.065, 0.072, 0.085), fur)
    .add(sphere(0.042, 0.065, -0.045, 0.048), fur, 0.03)
    .add(sphere(-0.042, 0.065, -0.045, 0.048), fur, 0.03)
    .add(sphere(0, 0.1, -0.1, 0.03), '#ffffff', 0.015);
  for (const sx of [-1, 1]) {
    b.add(ellipsoid(sx * 0.026, 0.016, 0.055, 0.018, 0.015, 0.028), '#f6efe6', 0.012);
    b.add(ellipsoid(sx * 0.048, 0.012, -0.02, 0.022, 0.013, 0.05), '#f6efe6', 0.015);
  }
  const body = build(b, [-0.11, -0.01, -0.15], [0.11, 0.2, 0.12], C * 0.55);
  const h = new Sculpt()
    .add(sphere(0, 0, 0, 0.058), '#cbb39c')
    .add(ellipsoid(0, -0.015, 0.02, 0.055, 0.042, 0.045), '#cbb39c', 0.03)
    .add(sphere(0.013, -0.022, 0.05, 0.018), '#f6efe6', 0.01)
    .add(sphere(-0.013, -0.022, 0.05, 0.018), '#f6efe6', 0.01)
    .add(sphere(0, -0.005, 0.063, 0.009), '#f08aa0', 0.005);
  for (const sx of [-1, 1]) {
    h.add(capsule(sx * 0.022, 0.04, -0.01, sx * 0.036, 0.15, -0.03, 0.022, 0.016), '#cbb39c', 0.012);
    h.add(ellipsoid(sx * 0.031, 0.1, 0.002, 0.011, 0.04, 0.006), '#f4a0b0', 0.004);
  }
  const head = build(h, [-0.09, -0.07, -0.08], [0.09, 0.19, 0.09], C * 0.45);
  return { toon: true, eye: eyeOn(0.058, 0.46, 0.2, 0.32, 0.45), body, head, headAt: [0, 0.17, 0.07], leg: null, legs: [], legLen: 0, tail: null, tailAt: [0, 0, 0] };
}

export function dog(): CreatureParts {
  const gold = '#d8a060', white = '#fbf3e6';
  const coat = (x: number, y: number, z: number) => (z > 0.05 && y < 0.23 && Math.abs(x) < 0.05 ? white : shade(gold, '#e6b576', 0.14, 0.26)(x, y));
  const b = new Sculpt()
    .add(ellipsoid(0, 0.2, -0.005, 0.065, 0.065, 0.11), coat)
    .add(sphere(0, 0.2, 0.06, 0.066), coat, 0.05)
    .add(sphere(0, 0.2, -0.07, 0.062), coat, 0.05)
    .add(capsule(0, 0.21, 0.07, 0, 0.25, 0.11, 0.048, 0.042), coat, 0.04);
  const body = build(b, [-0.09, 0.12, -0.15], [0.09, 0.3, 0.17], C * 0.6);
  const h = new Sculpt()
    .add(sphere(0, 0, 0, 0.06), gold)
    .add(capsule(0, -0.015, 0.03, 0, -0.02, 0.075, 0.034, 0.03), white, 0.02)
    .add(sphere(0, -0.008, 0.104, 0.015), '#1e1a18', 0.008)
    .carve(capsule(-0.014, -0.045, 0.09, 0.014, -0.045, 0.09, 0.003), 0.003);
  for (const sx of [-1, 1]) h.add(capsule(sx * 0.05, 0.03, -0.01, sx * 0.068, -0.035, 0.0, 0.024, 0.02), '#b87a40', 0.012);
  const head = build(h, [-0.1, -0.08, -0.08], [0.1, 0.08, 0.13], C * 0.45);
  const tail = build(new Sculpt().add(capsule(0, 0, 0, 0, 0.08, 0, 0.014, 0.009), gold), [-0.03, -0.02, -0.03], [0.03, 0.1, 0.03], C * 0.5);
  return {
    toon: true, eye: eyeOn(0.06, 0.44, 0.24, 0.3, 0.4), body, head, headAt: [0, 0.25, 0.12],
    leg: toonLeg(0.13, 0.046, (y) => (y < -0.09 ? white : gold), white),
    legs: [[-0.042, 0.08], [0.042, 0.08], [-0.042, -0.08], [0.042, -0.08]], legLen: 0.13, tail, tailAt: [0, 0.22, -0.12],
  };
}

// ---------------------------------------------------------------- birds

function chicken(): CreatureParts {
  const white = '#fdfaf2', red = '#e0302a';
  const b = new Sculpt()
    .add(ellipsoid(0, 0.16, -0.01, 0.075, 0.07, 0.09), white)
    .add(sphere(0, 0.17, 0.04, 0.065), white, 0.04)
    .add(capsule(0, 0.18, 0.04, 0, 0.23, 0.07, 0.042, 0.036), white, 0.03)
    .add(capsule(0, 0.17, -0.07, 0, 0.26, -0.11, 0.036, 0.018), '#f4efe2', 0.03)
    .add(capsule(0.025, 0.17, -0.07, 0.035, 0.24, -0.12, 0.026, 0.014), '#f4efe2', 0.02)
    .add(capsule(-0.025, 0.17, -0.07, -0.035, 0.24, -0.12, 0.026, 0.014), '#f4efe2', 0.02);
  for (const sx of [-1, 1]) b.add(ellipsoid(sx * 0.068, 0.165, -0.01, 0.022, 0.046, 0.066), '#efe8da', 0.015);
  const body = build(b, [-0.11, 0.07, -0.16], [0.11, 0.3, 0.14], C * 0.55);
  const h = new Sculpt()
    .add(sphere(0, 0, 0, 0.042), white)
    .add(sphere(0, 0.045, 0.014, 0.016), red, 0.008)
    .add(sphere(0, 0.052, -0.006, 0.019), red, 0.008)
    .add(sphere(0, 0.044, -0.026, 0.015), red, 0.008)
    .add(capsule(0, -0.002, 0.035, 0, -0.008, 0.062, 0.014, 0.003), '#f2b632', 0.006)
    .add(ellipsoid(0, -0.032, 0.034, 0.01, 0.018, 0.01), red, 0.008);
  const head = build(h, [-0.06, -0.06, -0.06], [0.06, 0.08, 0.08], C * 0.4);
  return {
    toon: true, eye: eyeOn(0.042, 0.6, 0.25, 0.3, 0.8), body, head, headAt: [0, 0.24, 0.07],
    leg: birdLeg(0.08, 0.022, '#f2a933'), legs: [[-0.03, 0], [0.03, 0]], legLen: 0.08, tail: null, tailAt: [0, 0, 0],
  };
}

function duck(): CreatureParts {
  const white = '#fdfbf5';
  const b = new Sculpt()
    .add(ellipsoid(0, 0.065, -0.005, 0.075, 0.055, 0.105), white)
    .add(ellipsoid(0, 0.1, -0.1, 0.03, 0.026, 0.036), white, 0.03)
    .add(capsule(0, 0.09, 0.06, 0, 0.14, 0.085, 0.032, 0.028), white, 0.025);
  for (const sx of [-1, 1]) b.add(ellipsoid(sx * 0.06, 0.08, -0.015, 0.02, 0.035, 0.07), '#f1ede2', 0.015);
  const body = build(b, [-0.1, -0.01, -0.16], [0.1, 0.18, 0.13], C * 0.55);
  const h = new Sculpt()
    .add(sphere(0, 0, 0, 0.042), white)
    .add(ellipsoid(0, -0.012, 0.052, 0.025, 0.009, 0.032), '#f59a23', 0.01);
  const head = build(h, [-0.06, -0.06, -0.06], [0.06, 0.06, 0.1], C * 0.4);
  return { toon: true, eye: eyeOn(0.042, 0.6, 0.25, 0.3, 0.8), body, head, headAt: [0, 0.15, 0.085], leg: null, legs: [], legLen: 0, tail: null, tailAt: [0, 0, 0] };
}

function goose(): CreatureParts {
  const white = '#fbf9f3', orange = '#f39024';
  const b = new Sculpt()
    .add(ellipsoid(0, 0.16, -0.02, 0.08, 0.07, 0.11), white)
    .add(ellipsoid(0, 0.19, -0.12, 0.03, 0.026, 0.036), white, 0.03)
    .add(capsule(0, 0.18, 0.06, 0, 0.3, 0.105, 0.036, 0.026), white, 0.03);
  for (const sx of [-1, 1]) b.add(ellipsoid(sx * 0.066, 0.175, -0.03, 0.022, 0.042, 0.075), '#e6e2da', 0.015);
  const body = build(b, [-0.11, 0.07, -0.17], [0.11, 0.34, 0.15], C * 0.55);
  const h = new Sculpt()
    .add(sphere(0, 0, 0, 0.038), white)
    .add(capsule(0, -0.005, 0.03, 0, -0.012, 0.066, 0.016, 0.009), orange, 0.008)
    .add(sphere(0, 0.008, 0.032, 0.012), orange, 0.008);
  const head = build(h, [-0.055, -0.05, -0.05], [0.055, 0.05, 0.09], C * 0.4);
  return {
    toon: true, eye: eyeOn(0.038, 0.62, 0.25, 0.3, 0.85), body, head, headAt: [0, 0.31, 0.11],
    leg: birdLeg(0.1, 0.024, orange), legs: [[-0.035, 0], [0.035, 0]], legLen: 0.1, tail: null, tailAt: [0, 0, 0],
  };
}

function gobbler(): CreatureParts {
  const b = new Sculpt()
    .add(ellipsoid(0, 0.17, 0, 0.085, 0.08, 0.1), '#6e4a32')
    .add(sphere(0, 0.18, 0.05, 0.07), '#4a3024', 0.04)
    .add(capsule(0, 0.2, 0.06, 0, 0.29, 0.1, 0.03, 0.022), '#a9c4dd', 0.02);
  for (let i = -4; i <= 4; i++) {
    const a = i * 0.27, ex = Math.sin(a) * 0.17, ey = 0.18 + Math.cos(a) * 0.17;
    const band = (x: number, y: number) => {
      const d = Math.hypot(x, y - 0.18);
      return d > 0.15 ? '#f1e8d8' : d > 0.12 ? '#3a2418' : '#8a5a38';
    };
    b.add(capsule(0, 0.18, -0.09, ex, ey, -0.11, 0.03, 0.034), band, 0.012);
  }
  for (const sx of [-1, 1]) b.add(ellipsoid(sx * 0.075, 0.17, -0.01, 0.022, 0.05, 0.07), '#8a6444', 0.015);
  const body = build(b, [-0.22, 0.07, -0.17], [0.22, 0.4, 0.16], C * 0.6);
  const h = new Sculpt()
    .add(sphere(0, 0, 0, 0.034), '#a9c4dd')
    .add(capsule(0, -0.004, 0.028, 0, -0.008, 0.05, 0.01, 0.004), '#e8c48a', 0.005)
    .add(capsule(0, 0.02, 0.03, 0, -0.02, 0.046, 0.008, 0.006), '#d8322a', 0.005)
    .add(ellipsoid(0, -0.034, 0.02, 0.012, 0.025, 0.012), '#d8322a', 0.008);
  const head = build(h, [-0.05, -0.07, -0.05], [0.05, 0.05, 0.07], C * 0.4);
  return {
    toon: true, eye: eyeOn(0.034, 0.62, 0.25, 0.32, 0.85), body, head, headAt: [0, 0.31, 0.105],
    leg: birdLeg(0.08, 0.024, '#c9a08a'), legs: [[-0.035, 0], [0.035, 0]], legLen: 0.08, tail: null, tailAt: [0, 0, 0],
  };
}

function peacock(): CreatureParts {
  const blue = '#1f5fbf';
  const b = new Sculpt()
    .add(ellipsoid(0, 0.2, 0, 0.06, 0.065, 0.085), blue)
    .add(capsule(0, 0.22, 0.04, 0, 0.33, 0.09, 0.03, 0.022), '#2a74d6', 0.02);
  // the train fanned open and leaning back, so it shows from the farm camera
  for (let i = -6; i <= 6; i++) {
    const a = i * 0.23, ex = Math.sin(a) * 0.28, ey = 0.19 + Math.cos(a) * 0.24, ez = -0.12 - Math.cos(a) * 0.09;
    const tip: Box = [ex * 0.88, 0.19 + (ey - 0.19) * 0.88, ez];
    const feather = (x: number, y: number, z: number) => {
      const d = Math.hypot(x - tip[0], y - tip[1], z - tip[2]);
      return d < 0.018 ? '#1a2a7a' : d < 0.03 ? '#e8c24a' : d < 0.04 ? '#2a9a9a' : '#3aa05a';
    };
    b.add(capsule(0, 0.19, -0.07, ex, ey, ez, 0.028, 0.042), feather, 0.012);
  }
  for (const sx of [-1, 1]) b.add(ellipsoid(sx * 0.055, 0.2, -0.01, 0.018, 0.04, 0.06), '#b89a6a', 0.012);
  const body = build(b, [-0.34, 0.1, -0.3], [0.34, 0.49, 0.14], C * 0.6);
  const h = new Sculpt()
    .add(sphere(0, 0, 0, 0.03), '#2a74d6')
    .add(capsule(0, -0.004, 0.024, 0, -0.006, 0.042, 0.008, 0.003), '#d8c8a0', 0.004);
  for (const i of [-1, 0, 1]) {
    h.add(capsule(i * 0.006, 0.025, 0, i * 0.016, 0.065, -0.012, 0.0045), '#2a74d6', 0.004);
    h.add(sphere(i * 0.016, 0.068, -0.013, 0.008), '#2a74d6', 0.003);
  }
  const head = build(h, [-0.05, -0.04, -0.05], [0.05, 0.09, 0.06], C * 0.35);
  return {
    toon: true, eye: eyeOn(0.03, 0.62, 0.25, 0.34, 0.85), body, head, headAt: [0, 0.34, 0.09],
    leg: birdLeg(0.12, 0.02, '#9a9088'), legs: [[-0.028, 0], [0.028, 0]], legLen: 0.12, tail: null, tailAt: [0, 0, 0],
  };
}

function ostrich(): CreatureParts {
  const pink = '#e8b8a8';
  const b = new Sculpt()
    .add(ellipsoid(0, 0.56, -0.02, 0.12, 0.1, 0.15), '#2a2624')
    .add(sphere(0, 0.6, -0.16, 0.07), '#f6f2ea', 0.03)
    .add(capsule(0, 0.6, 0.1, 0, 0.93, 0.17, 0.036, 0.024), pink, 0.03)
    .displace((x, y, z) => (y < 0.65 && z < 0.1 ? noise3(x * 40, y * 40, z * 40) * 0.012 : 0));
  for (const sx of [-1, 1]) {
    b.add(ellipsoid(sx * 0.11, 0.56, -0.06, 0.03, 0.06, 0.08), '#f6f2ea', 0.02);
    b.add(sphere(sx * 0.05, 0.47, 0, 0.045), pink, 0.03);
  }
  const body = build(b, [-0.17, 0.4, -0.25], [0.17, 0.98, 0.22], C);
  const h = new Sculpt()
    .add(sphere(0, 0, 0, 0.036), '#e0b0a0')
    .add(ellipsoid(0, -0.01, 0.036, 0.018, 0.008, 0.028), '#d8a888', 0.008);
  puffs(h, [0, 0.03, -0.005], [0.02, 0.012, 0.018], 6, 0.012, '#5a4a44', 0.9, -0.2);
  const head = build(h, [-0.05, -0.05, -0.05], [0.05, 0.06, 0.08], C * 0.35);
  return {
    toon: true, eye: eyeOn(0.036, 0.58, 0.25, 0.38, 0.8), body, head, headAt: [0, 0.95, 0.17],
    leg: birdLeg(0.44, 0.05, '#e2b2a2'), legs: [[-0.05, 0], [0.05, 0]], legLen: 0.44, tail: null, tailAt: [0, 0, 0],
  };
}

function quail(): CreatureParts {
  const plume = (x: number, y: number, z: number) => (z > 0.02 && y < 0.08 ? '#f0e2c6' : noise3(x * 140, y * 140, z * 140) > 0.72 ? '#f2e6d0' : '#9a7250');
  const b = new Sculpt()
    .add(ellipsoid(0, 0.075, 0, 0.045, 0.042, 0.055), plume)
    .add(ellipsoid(0, 0.085, -0.05, 0.02, 0.014, 0.02), '#7a5a40', 0.015);
  const body = build(b, [-0.06, 0.02, -0.08], [0.06, 0.13, 0.07], C * 0.35);
  const h = new Sculpt()
    .add(sphere(0, 0, 0, 0.026), '#8a6240')
    .add(capsule(0, -0.002, 0.02, 0, -0.004, 0.032, 0.007, 0.003), '#3a2e26', 0.003)
    .add(capsule(0, 0.02, 0.01, 0, 0.045, 0.03, 0.006, 0.004), '#2a1e16', 0.004)
    .add(sphere(0, 0.046, 0.034, 0.009), '#2a1e16', 0.004);
  const head = build(h, [-0.035, -0.035, -0.035], [0.035, 0.065, 0.05], C * 0.3);
  return {
    toon: true, eye: eyeOn(0.026, 0.6, 0.25, 0.34, 0.85), body, head, headAt: [0, 0.12, 0.05],
    leg: birdLeg(0.035, 0.014, '#c89a78'), legs: [[-0.018, 0], [0.018, 0]], legLen: 0.035, tail: null, tailAt: [0, 0, 0],
  };
}

// calico farm cat: white with orange and black patches, pointy ears and a long curling tail
function cat(): CreatureParts {
  const coat = (x: number, y: number, z: number) => {
    const w = '#fbf6ee';
    const o = patches(x, y, z, 0.55, '#e8913a', w);
    return o !== w ? mixHex(o, '#2a2624', smooth(0.6, 0.66, noise3(x * 9 + 20, y * 9, z * 9))) : o;
  };
  const b = new Sculpt()
    .add(ellipsoid(0, 0.15, -0.01, 0.05, 0.05, 0.085), coat)
    .add(sphere(0, 0.155, 0.05, 0.05), coat, 0.04)
    .add(capsule(0, 0.16, 0.06, 0, 0.2, 0.085, 0.036, 0.032), coat, 0.03);
  const body = build(b, [-0.08, 0.08, -0.12], [0.08, 0.26, 0.14], C * 0.5);
  const h = new Sculpt()
    .add(ellipsoid(0, 0, 0, 0.058, 0.052, 0.052), coat)
    .add(sphere(0.012, -0.018, 0.043, 0.016), '#fbf6ee', 0.01)
    .add(sphere(-0.012, -0.018, 0.043, 0.016), '#fbf6ee', 0.01)
    .add(sphere(0, -0.006, 0.053, 0.008), '#f08aa0', 0.004);
  for (const sx of [-1, 1]) {
    h.add(capsule(sx * 0.03, 0.035, -0.005, sx * 0.044, 0.078, -0.01, 0.019, 0.004), sx < 0 ? '#e8913a' : '#2a2624', 0.01);
    h.add(ellipsoid(sx * 0.035, 0.05, 0.004, 0.008, 0.016, 0.004), '#f4a9b8', 0.003);
  }
  const head = build(h, [-0.08, -0.06, -0.06], [0.08, 0.1, 0.08], C * 0.4);
  const tail = build(new Sculpt()
    .add(capsule(0, 0, 0, 0, 0.08, -0.04, 0.012, 0.01), '#e8913a')
    .add(capsule(0, 0.08, -0.04, 0, 0.14, -0.015, 0.01, 0.009), '#2a2624', 0.01), [-0.03, -0.02, -0.07], [0.03, 0.17, 0.02], C * 0.4);
  return {
    toon: true, eye: eyeOn(0.055, 0.44, 0.2, 0.3, 0.35), body, head, headAt: [0, 0.21, 0.09],
    leg: toonLeg(0.1, 0.034, '#fbf6ee', '#fbf6ee'), legs: [[-0.028, 0.05], [0.028, 0.05], [-0.028, -0.06], [0.028, -0.06]], legLen: 0.1, tail, tailAt: [0, 0.17, -0.09],
  };
}

export const toonMakers: Record<string, () => CreatureParts> = {
  cow, sheep, goat, horse, donkey, buffalo, yak, camel, alpaca, rabbit, dog, cat, chicken, duck, goose, gobbler, peacock, ostrich, quail,
};

// ---------------------------------------------------------------- farmer
// A friendly cartoon farmer: big round head with rosy cheeks, button nose and a smile, a plaid
// shirt under denim overalls. The renderer adds eyes, arms, boots and the straw hat.
const people = new Map<string, { head: THREE.BufferGeometry; torso: THREE.BufferGeometry }>();
export function toonPersonParts(shirt: string, overall: string) {
  const key = `${shirt}|${overall}`;
  const hit = people.get(key);
  if (hit) return hit;
  const skin = '#f6c9a0', hair = '#6b4020';
  const face = (x: number, y: number, z: number) => (z > 0.07 && Math.abs(x) > 0.05 && y < -0.01 && y > -0.06 ? '#f4a0a0' : skin);
  const h = new Sculpt()
    .add(sphere(0, 0, 0, 0.135), face)
    .add(sphere(0, -0.012, 0.134, 0.028), '#f2a888', 0.012)
    .add(ellipsoid(0.133, -0.005, 0, 0.022, 0.036, 0.026), skin, 0.012)
    .add(ellipsoid(-0.133, -0.005, 0, 0.022, 0.036, 0.026), skin, 0.012)
    .add(ellipsoid(0, 0.03, -0.022, 0.142, 0.115, 0.13), hair, 0.012)
    .add(ellipsoid(0.11, -0.03, -0.02, 0.03, 0.05, 0.05), hair, 0.02)
    .add(ellipsoid(-0.11, -0.03, -0.02, 0.03, 0.05, 0.05), hair, 0.02)
    .carve(capsule(-0.045, -0.052, 0.116, 0, -0.07, 0.126, 0.006), 0.004)
    .carve(capsule(0, -0.07, 0.126, 0.045, -0.052, 0.116, 0.006), 0.004);
  const head = build(h, [-0.17, -0.16, -0.17], [0.17, 0.17, 0.18], 0.005, 0.012);
  const dk = mixHex(shirt, '#000000', 0.4), lt = mixHex(shirt, '#ffffff', 0.25);
  const plaid = (x: number, y: number) => {
    const a = Math.sin(x * 140) > 0.5, b = Math.sin(y * 140) > 0.5;
    return a && b ? dk : a || b ? shirt : lt;
  };
  const denim = (x: number, y: number, z: number) => mixHex(overall, '#000000', noise3(x * 80, y * 200, z * 80) * 0.18);
  const t = new Sculpt()
    .add(capsule(0, 0.39, 0, 0, 0.5, 0, 0.125, 0.115), (x, y, z) => {
      if (y < 0.42) return denim(x, y, z);
      if (z > 0.05 && Math.abs(x) < 0.07 && y < 0.51) return denim(x, y, z);
      if (z > 0 && Math.abs(Math.abs(x) - 0.058) < 0.015 && y < 0.58) return denim(x, y, z);
      return plaid(x, y);
    })
    .add(ellipsoid(0, 0.33, 0.01, 0.13, 0.08, 0.13), denim, 0.04)
    // bib pocket
    .add(ellipsoid(0, 0.465, 0.105, 0.035, 0.025, 0.008), mixHex(overall, '#000000', 0.15), 0.006);
  const torso = build(t, [-0.16, 0.22, -0.16], [0.16, 0.66, 0.16], 0.006, 0.012);
  const p = { head, torso };
  people.set(key, p);
  return p;
}

// ---------------------------------------------------------------- trees
// A puffy cartoon tree crown: a cluster of soft round leaf balls, darker underneath and sunlit
// on top, sculpted as one smooth piece. Colors are baked in grey so any leaf color can tint it.
const crowns = new Map<number, THREE.BufferGeometry>();
export function toonCrown(seed: number) {
  const key = seed % 6;
  const hit = crowns.get(key);
  if (hit) return hit;
  const shadeY = (_x: number, y: number) => mixHex('#8c9488', '#ffffff', smooth(0.5, 1.2, y));
  const s = new Sculpt().add(sphere(0, 0.8, 0, 0.33), shadeY);
  const ga = Math.PI * (3 - Math.sqrt(5));
  const n = 9;
  for (let i = 0; i < n; i++) {
    const y = 0.85 - (1.7 * (i + 0.5)) / n;
    const rad = Math.sqrt(1 - y * y), th = ga * i + key * 1.3;
    const r = 0.16 + ((Math.sin(i * 7.1 + key * 3.3) + 1) / 2) * 0.06;
    s.add(sphere(Math.cos(th) * rad * 0.3, 0.8 + y * 0.27, Math.sin(th) * rad * 0.3, r), shadeY, 0.07);
  }
  s.add(sphere(0.04, 1.08, -0.02, 0.17), shadeY, 0.08);
  // a few leafy bumps break up the silhouette
  s.displace((x, y, z) => (noise3(x * 12 + key, y * 12, z * 12) - 0.5) * 0.016);
  s.grain = 0.05;
  const g = s.build([-0.62, 0.3, -0.62], [0.62, 1.34, 0.62], 0.014);
  crowns.set(key, g);
  return g;
}
