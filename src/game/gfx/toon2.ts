// More cartoon farm animals, built from a few shared body plans (cattle, small ruminants,
// walking birds, water birds) plus a handful of one offs. Same pivots as the other sculpts.
import { Sculpt, capsule, ellipsoid, noise3, sphere, type Paint } from './sdf';
import type { CreatureParts } from './creatures';
import { C, birdLeg, build, ears, eyeOn, horns, mixHex, patches, puffs, shade, smooth, toonLeg, type Box } from './toon';

// ---------------------------------------------------------------- cattle and deer

interface Cattle {
  coat: Paint; face?: Paint; muzzle: string; legLen?: number; slim?: number; head?: number;
  leg?: string | ((y: number) => string); hoof?: string; hump?: Paint; skirt?: Paint; shag?: number; dewlap?: Paint;
  horns?: { pts: Box[]; r0: number; r1: number; color: string }; ear?: string; earInner?: string; earLen?: number; earDroop?: number;
  tail?: string; tailTip?: string; extraHead?: (h: Sculpt, k: number) => void;
}

function cattle(o: Cattle): CreatureParts {
  const L = o.legLen ?? 0.17, dy = L - 0.17, sl = o.slim ?? 1, k = o.head ?? 1;
  const b = new Sculpt()
    .add(ellipsoid(0, 0.3 + dy, -0.01, 0.15 * sl, 0.135 * sl, 0.2), o.coat)
    .add(sphere(0, 0.31 + dy, 0.1, 0.13 * sl), o.coat, 0.09)
    .add(sphere(0, 0.31 + dy, -0.12, 0.13 * sl), o.coat, 0.09)
    .add(capsule(0, 0.33 + dy, 0.14, 0, 0.39 + dy, 0.21, 0.09 * sl, 0.08 * sl), o.coat, 0.07);
  if (o.hump) b.add(sphere(0, 0.43 + dy, 0.1, 0.085 * sl), o.hump, 0.06);
  if (o.dewlap) b.add(ellipsoid(0, 0.26 + dy, 0.2, 0.03, 0.08, 0.06), o.dewlap, 0.04);
  if (o.skirt) b.add(ellipsoid(0, 0.22 + dy, 0, 0.165 * sl, 0.08, 0.21), o.skirt, 0.06);
  if (o.shag || o.skirt) {
    const sh = o.shag ?? 0.008, skirt = !!o.skirt;
    b.displace((x, y, z) => (skirt && y < 0.3 + dy ? noise3(x * 45, y * 6, z * 45) * 0.024 : noise3(x * 40, y * 8, z * 40) * sh));
  }
  const body = build(b, [-0.22, 0.06 + dy, -0.3], [0.22, 0.58 + dy, 0.33], C);
  const face = o.face ?? o.coat;
  const h = new Sculpt()
    .add(sphere(0, 0.03 * k, 0, 0.1 * k), face)
    .add(ellipsoid(0, -0.02 * k, 0.06 * k, 0.088 * k, 0.075 * k, 0.07 * k), face, 0.05 * k)
    .add(ellipsoid(0, -0.05 * k, 0.12 * k, 0.09 * k, 0.062 * k, 0.058 * k), o.muzzle, 0.03 * k)
    .carve(ellipsoid(0.035 * k, -0.04 * k, 0.175 * k, 0.014 * k, 0.018 * k, 0.014 * k), 0.006)
    .carve(ellipsoid(-0.035 * k, -0.04 * k, 0.175 * k, 0.014 * k, 0.018 * k, 0.014 * k), 0.006);
  const el = o.earLen ?? 0.055;
  ears(h, 0.12 * k, 0.04 * k, -0.01 * k, el * k, 0.05 * k, o.ear ?? (typeof face === 'string' ? face : '#8a5a34'), o.earInner ?? '#f4a9b8', (o.earDroop ?? 0) * k);
  if (o.horns) horns(h, o.horns.pts, o.horns.r0, o.horns.r1, o.horns.color);
  o.extraHead?.(h, k);
  const head = build(h, [-0.34, -0.2, -0.16], [0.34, 0.42, 0.26], C * 0.6, 0.015);
  const tail = build(new Sculpt()
    .add(capsule(0, 0, 0, 0, -0.17, 0.01, 0.012, 0.009), o.tail ?? (typeof o.coat === 'string' ? o.coat : '#8a5a34'))
    .add(sphere(0, -0.19, 0.012, 0.024), o.tailTip ?? '#2a2826', 0.02), [-0.04, -0.23, -0.04], [0.04, 0.02, 0.05], C * 0.55);
  return {
    toon: true, eye: [0.046 * k, 0.05 * k, 0.094 * k, 0.033 * k, 0.36], body, head, headAt: [0, 0.42 + dy, 0.24],
    leg: toonLeg(L, 0.075 * Math.max(0.75, sl), o.leg ?? (typeof o.coat === 'string' ? o.coat : '#8a5a34'), o.hoof ?? '#3a2a20'),
    legs: [[-0.085 * sl, 0.12], [0.085 * sl, 0.12], [-0.085 * sl, -0.12], [0.085 * sl, -0.12]], legLen: L, tail, tailAt: [0, 0.38 + dy, -0.21],
  };
}

const jerseyCow = () => cattle({
  coat: shade('#c8905a', '#e0b07a', 0.2, 0.42), face: (x, y, z) => (z > 0.1 && y < -0.02 ? '#f2e6d6' : '#a8703e'), muzzle: '#3a2a24',
  ear: '#a8703e', leg: (y) => (y < -0.1 ? '#5a3a24' : '#c8905a'), tail: '#c8905a',
  horns: { pts: [[0.05, 0.11, -0.01], [0.075, 0.145, -0.02], [0.08, 0.165, -0.01]], r0: 0.016, r1: 0.008, color: '#f3e6c4' },
});

const beltedGalloway = () => cattle({
  coat: (_x, _y, z) => (Math.abs(z + 0.01) < 0.075 ? '#f6f4ee' : '#232122'), face: '#232122', muzzle: '#2a2626', ear: '#232122', earInner: '#6a5a5a',
  leg: '#232122', shag: 0.02, tail: '#232122',
});

const zebu = () => cattle({
  coat: shade('#dcd8d0', '#f2f0ea', 0.2, 0.42), face: '#cfcac0', muzzle: '#4a4448', hump: '#c0bab0', dewlap: '#e4e0d8',
  ear: '#cfcac0', earLen: 0.075, earDroop: 0.035, leg: '#cfcac0', tailTip: '#3a3436',
  horns: { pts: [[0.05, 0.1, -0.01], [0.07, 0.15, -0.02], [0.07, 0.2, 0.0]], r0: 0.018, r1: 0.007, color: '#3a3436' },
});

const watusi = () => cattle({
  coat: (x, y, z) => patches(x, y, z, 0.6, '#f2e6d6', '#8a3a1a'), face: '#8a3a1a', muzzle: '#4a2a1a', ear: '#8a3a1a', leg: '#7a3418',
  horns: { pts: [[0.06, 0.08, -0.01], [0.14, 0.15, -0.03], [0.21, 0.27, -0.02], [0.24, 0.38, 0.02]], r0: 0.055, r1: 0.016, color: '#efe4cc' },
});

const muskOx = () => cattle({
  coat: '#3a2618', face: '#4a3424', muzzle: '#2a1a12', skirt: '#2e1e14', shag: 0.02, leg: '#e8e0d0', hoof: '#2a1a12', ear: '#3a2618',
  hump: '#5a4230',
  horns: { pts: [[0.02, 0.1, 0], [0.1, 0.1, 0], [0.14, 0.03, 0.02], [0.12, -0.05, 0.07]], r0: 0.042, r1: 0.012, color: '#d8ccb8' },
});

const moose = () => cattle({
  coat: shade('#4a3020', '#5e3e28', 0.35, 0.6), face: '#4a3020', muzzle: '#3a2418', legLen: 0.3, head: 1.15, dewlap: '#4a3020',
  leg: (y) => (y < -0.14 ? '#b8a890' : '#4a3020'), ear: '#4a3020', earLen: 0.06, tail: '#4a3020', tailTip: '#4a3020',
  extraHead: (h, k) => {
    // a long drooping nose and broad palmate antlers
    h.add(ellipsoid(0, -0.08 * k, 0.15 * k, 0.07 * k, 0.07 * k, 0.07 * k), '#3a2418', 0.03);
    for (const sx of [-1, 1]) {
      h.add(capsule(sx * 0.06, 0.1, -0.02, sx * 0.14, 0.14, -0.02, 0.018, 0.016), '#d8c8a0', 0.01);
      h.add(ellipsoid(sx * 0.22, 0.17, -0.02, 0.1, 0.05, 0.075), '#d8c8a0', 0.02);
      for (let i = 0; i < 4; i++) h.add(capsule(sx * (0.16 + i * 0.035), 0.2, -0.02 + (i - 1.5) * 0.02, sx * (0.19 + i * 0.04), 0.26, -0.02 + (i - 1.5) * 0.025, 0.012, 0.006), '#d8c8a0', 0.008);
    }
  },
});

const spottedDeer = () => cattle({
  coat: (x, y, z) => (y < 0.4 ? '#f2e6d0' : noise3(x * 60, y * 60, z * 60) > 0.72 ? '#fbf6ea' : '#c07a3a'), face: '#c07a3a', muzzle: '#2a2020',
  legLen: 0.28, slim: 0.72, head: 0.72, leg: (y) => (y < -0.2 ? '#8a5a2a' : '#c07a3a'), ear: '#c07a3a', earLen: 0.065, tail: '#fbf6ea', tailTip: '#fbf6ea',
  extraHead: (h) => {
    for (const sx of [-1, 1]) {
      const pts: Box[] = [[0.025, 0.07, -0.01], [0.05, 0.13, -0.03], [0.07, 0.2, -0.02], [0.06, 0.26, 0.02]];
      for (let i = 0; i < pts.length - 1; i++) h.add(capsule(sx * pts[i][0], pts[i][1], pts[i][2], sx * pts[i + 1][0], pts[i + 1][1], pts[i + 1][2], 0.01, 0.007), '#d8c8a0', 0.008);
      for (const ty of [0.13, 0.2]) h.add(capsule(sx * 0.06, ty, -0.02, sx * 0.06, ty + 0.04, 0.03, 0.006, 0.004), '#d8c8a0', 0.006);
    }
  },
});

// ---------------------------------------------------------------- goats and sheep

interface Small {
  coat: Paint; face: Paint; muzzle?: string; wool?: Paint; woolSize?: number; legColor: string; hoof?: string;
  ear?: string; earDroop?: boolean; horns?: { pts: Box[]; r0: number; r1: number; color: string }[]; beard?: string;
  locks?: string; skirt?: Paint; tuft?: string;
}

function smallRuminant(o: Small): CreatureParts {
  const sheep = !!o.wool;
  const b = new Sculpt();
  if (sheep) {
    b.add(ellipsoid(0, 0.26, 0, 0.12, 0.1, 0.15), o.wool as Paint);
    puffs(b, [0, 0.26, 0], [0.12, 0.1, 0.15], 34, o.woolSize ?? 0.052, o.wool as Paint, 1.3);
    b.add(sphere(0, 0.29, -0.17, 0.035), o.wool as Paint, 0.02);
  } else {
    b.add(ellipsoid(0, 0.29, -0.01, 0.1, 0.095, 0.15), o.coat)
      .add(sphere(0, 0.3, 0.08, 0.092), o.coat, 0.07)
      .add(sphere(0, 0.3, -0.1, 0.092), o.coat, 0.07)
      .add(capsule(0, 0.31, 0.1, 0, 0.37, 0.16, 0.06, 0.05), o.coat, 0.05);
    if (o.skirt) b.add(ellipsoid(0, 0.22, 0, 0.11, 0.07, 0.16), o.skirt, 0.05);
    if (o.locks) {
      // ringlets hanging all over the coat
      for (let i = 0; i < 26; i++) {
        const a = i * 2.39, z = -0.12 + (i / 26) * 0.26, y = 0.3 + Math.sin(a) * 0.07, x = Math.cos(a) * 0.1;
        b.add(capsule(x, y, z, x * 1.1, y - 0.05, z, 0.02, 0.014), o.locks, 0.012);
      }
    }
    if (o.skirt || o.locks) b.displace((x, y, z) => noise3(x * 50, y * 10, z * 50) * 0.015);
  }
  const body = build(b, [-0.2, 0.1, -0.24], [0.2, 0.44, 0.24], C * 0.9, sheep ? 0.01 : 0.02);
  const h = new Sculpt();
  if (sheep) {
    h.add(sphere(0, 0, 0, 0.068), o.face)
      .add(ellipsoid(0, -0.02, 0.05, 0.05, 0.045, 0.05), o.face, 0.03)
      .add(ellipsoid(0, -0.03, 0.09, 0.03, 0.022, 0.014), o.muzzle ?? '#4a3f39', 0.01);
    ears(h, 0.085, 0.005, -0.01, 0.045, 0.036, o.ear ?? (typeof o.face === 'string' ? o.face : '#3b322d'), '#e79aa8', 0.01);
    puffs(h, [0, 0.05, -0.005], [0.05, 0.03, 0.045], 9, 0.03, o.tuft ?? (o.wool as Paint), 2.1, -0.2);
  } else {
    h.add(sphere(0, 0.01, 0, 0.062), o.face)
      .add(capsule(0, -0.005, 0.02, 0, -0.035, 0.085, 0.048, 0.036), o.face, 0.03)
      .add(ellipsoid(0, -0.042, 0.108, 0.03, 0.022, 0.018), o.muzzle ?? '#dca5a5', 0.012);
    if (o.beard) h.add(capsule(0, -0.06, 0.07, 0, -0.115, 0.06, 0.018, 0.006), o.beard, 0.012);
    const ear = o.ear ?? (typeof o.face === 'string' ? o.face : '#8a5a34');
    if (o.earDroop) for (const sx of [-1, 1]) h.add(ellipsoid(sx * 0.066, -0.03, 0.005, 0.018, 0.055, 0.03), ear, 0.012);
    else ears(h, 0.075, 0.01, -0.01, 0.045, 0.034, ear, '#eeb0b8');
  }
  for (const hn of o.horns ?? []) horns(h, hn.pts, hn.r0, hn.r1, hn.color);
  const head = build(h, [-0.16, -0.14, -0.12], [0.16, 0.16, 0.14], C * 0.5, 0.012);
  const tail = sheep ? null : build(new Sculpt().add(capsule(0, 0, 0, 0, 0.05, -0.02, 0.014, 0.008), typeof o.coat === 'string' ? o.coat : '#f6f2ea'), [-0.03, -0.02, -0.04], [0.03, 0.07, 0.02], C * 0.5);
  return {
    toon: true, wool: sheep, eye: sheep ? eyeOn(0.068, 0.42, 0.2, 0.32, 0.4) : eyeOn(0.062, 0.48, 0.22, 0.32, 0.45), body, head,
    headAt: sheep ? [0, 0.3, 0.19] : [0, 0.37, 0.17],
    leg: toonLeg(sheep ? 0.13 : 0.16, sheep ? 0.05 : 0.052, o.legColor, o.hoof ?? '#2a2420'),
    legs: sheep ? [[-0.06, 0.09], [0.06, 0.09], [-0.06, -0.09], [0.06, -0.09]] : [[-0.05, 0.09], [0.05, 0.09], [-0.05, -0.09], [0.05, -0.09]],
    legLen: sheep ? 0.13 : 0.16, tail, tailAt: [0, 0.34, -0.2],
  };
}

const curlHorn = (x: number, color: string, r0 = 0.02) => ({
  pts: [[x, 0.05, -0.01], [x + 0.04, 0.08, -0.04], [x + 0.07, 0.05, -0.05], [x + 0.08, 0.0, -0.02], [x + 0.06, -0.03, 0.02]] as Box[], r0, r1: 0.008, color,
});

const blackSheep = () => smallRuminant({
  coat: '#2e2a2a', face: '#1f1b19', legColor: '#1f1b19',
  wool: (x, y, z) => mixHex('#1e1b1b', '#3e3838', smooth(0.16, 0.34, y + (noise3(x * 30, y * 30, z * 30) - 0.5) * 0.04)),
});

const merinoSheep = () => smallRuminant({
  coat: '#f2ead8', face: '#f4ece0', muzzle: '#e8b0a8', legColor: '#f4ece0', woolSize: 0.06,
  wool: (x, y, z) => mixHex('#e8dcc4', '#faf4e6', smooth(0.14, 0.36, y + (noise3(x * 24, y * 24, z * 24) - 0.5) * 0.06)),
  horns: [curlHorn(0.035, '#e8dcc0', 0.022)],
});

const jacobSheep = () => smallRuminant({
  coat: '#f6f2ea', face: (x, _y, z) => (Math.abs(x) < 0.014 && z > 0.02 ? '#f6f2ea' : '#2a2422'), muzzle: '#2a2422', legColor: '#f6f2ea',
  wool: (x, y, z) => patches(x, y, z, 0.58, '#6a4a34', '#f6f2ea'), tuft: '#f6f2ea',
  horns: [
    { pts: [[0.02, 0.05, -0.01], [0.03, 0.12, -0.02], [0.02, 0.17, 0.01]], r0: 0.014, r1: 0.006, color: '#3a3230' },
    curlHorn(0.04, '#3a3230', 0.016),
  ],
});

const nubianGoat = () => smallRuminant({
  coat: (x, y, z) => patches(x, y, z, 0.58, '#f2e6d6', '#6a3a1e'), face: '#6a3a1e', muzzle: '#4a2a18', legColor: '#6a3a1e', earDroop: true, ear: '#5a3018',
});

const angoraGoat = () => smallRuminant({
  coat: '#f8f4ec', face: '#f8f4ec', muzzle: '#e8c8c0', legColor: '#f0eadc', locks: '#fbf8f0',
  horns: [{ pts: [[0.026, 0.05, 0.0], [0.05, 0.09, -0.03], [0.08, 0.1, -0.06], [0.1, 0.08, -0.08]], r0: 0.012, r1: 0.005, color: '#c8b8a0' }],
});

const cashmereGoat = () => smallRuminant({
  coat: '#e6dccc', face: '#efe8dc', muzzle: '#d8b8b0', legColor: '#e6dccc', skirt: '#dccfb8', beard: '#e6dccc',
  horns: [{ pts: [[0.026, 0.05, 0.0], [0.045, 0.11, -0.04], [0.06, 0.15, -0.09], [0.07, 0.15, -0.13]], r0: 0.014, r1: 0.005, color: '#8a7a68' }],
});

// ---------------------------------------------------------------- birds

interface Walker {
  body: Paint; size?: number; neck: Paint; neckLen?: number; head: Paint; headR?: number; beak: string; beakLen?: number;
  wing?: Paint; legLen: number; legColor: string; legTh?: number; tail?: Paint; extraHead?: (h: Sculpt) => void; extraBody?: (b: Sculpt) => void; fluffy?: boolean;
}

function walker(o: Walker): CreatureParts {
  const s = o.size ?? 1, nl = o.neckLen ?? 0.1, L = o.legLen, by = L + 0.07 * s;
  const b = new Sculpt()
    .add(ellipsoid(0, by, -0.01, 0.075 * s, 0.068 * s, 0.1 * s), o.body)
    .add(capsule(0, by + 0.02 * s, 0.05 * s, 0, by + 0.02 * s + nl, 0.07 * s + nl * 0.25, 0.034 * s, 0.024 * s), o.neck, 0.03 * s);
  if (o.tail) b.add(capsule(0, by + 0.01, -0.08 * s, 0, by + 0.06 * s, -0.14 * s, 0.03 * s, 0.014 * s), o.tail, 0.02);
  for (const sx of [-1, 1]) b.add(ellipsoid(sx * 0.068 * s, by + 0.005, -0.015 * s, 0.022 * s, 0.045 * s, 0.07 * s), o.wing ?? o.body, 0.015);
  o.extraBody?.(b);
  if (o.fluffy) b.displace((x, y, z) => noise3(x * 70, y * 70, z * 70) * 0.012);
  const body = build(b, [-0.16 * s, L - 0.02, -0.24 * s], [0.16 * s, by + nl + 0.1 * s, 0.2 * s], C * 0.5 * Math.max(1, s * 0.8));
  const R = o.headR ?? 0.036 * s;
  const h = new Sculpt()
    .add(sphere(0, 0, 0, R), o.head)
    .add(capsule(0, -0.004, R * 0.8, 0, -0.01, R * 0.8 + (o.beakLen ?? 0.03), R * 0.36, R * 0.12), o.beak, 0.006);
  o.extraHead?.(h);
  const head = build(h, [-R * 2, -R * 2.2, -R * 2], [R * 2, R * 2.6, R * 2 + (o.beakLen ?? 0.03) + 0.02], C * 0.35);
  return {
    toon: true, eye: eyeOn(R, 0.6, 0.25, 0.32, 0.85), body, head, headAt: [0, by + 0.02 * s + nl + R * 0.6, 0.07 * s + nl * 0.25 + 0.01],
    leg: birdLeg(L, o.legTh ?? 0.022, o.legColor), legs: [[-0.03 * s, 0], [0.03 * s, 0]], legLen: L, tail: null, tailAt: [0, 0, 0],
  };
}

const silkieChicken = () => walker({
  body: '#fbf8f0', neck: '#fbf8f0', head: '#fbf8f0', beak: '#5a6a8a', beakLen: 0.018, legLen: 0.06, legColor: '#6a7a9a', fluffy: true,
  extraBody: (b) => puffs(b, [0, 0.13, -0.01], [0.075, 0.068, 0.1], 22, 0.03, '#fbf8f0', 0.6),
  extraHead: (h) => {
    // a pom pom crest and a dark blue face
    puffs(h, [0, 0.03, -0.005], [0.022, 0.014, 0.02], 8, 0.016, '#ffffff', 1.1, -0.3);
    h.add(ellipsoid(0.02, -0.005, 0.02, 0.012, 0.014, 0.01), '#3a4a7a', 0.006).add(ellipsoid(-0.02, -0.005, 0.02, 0.012, 0.014, 0.01), '#3a4a7a', 0.006);
  },
});

const muscovyDuck = () => walker({
  body: (x, y, z) => (y > 0.16 && Math.abs(x) > 0.04 ? '#f4f2ee' : noise3(x * 30, y * 30, z * 30) > 0.6 ? '#2a4a3a' : '#1a1e22'),
  wing: (_x, y) => (y > 0.14 ? '#f4f2ee' : '#1a2a24'), neck: '#f4f2ee', neckLen: 0.05, head: '#f4f2ee', beak: '#f0c0a8', legLen: 0.06, legColor: '#e8a040',
  extraHead: (h) => {
    for (const sx of [-1, 1]) h.add(ellipsoid(sx * 0.02, 0.0, 0.018, 0.014, 0.018, 0.012), '#c8282a', 0.006);
    h.add(sphere(0, 0.004, 0.034, 0.01), '#c8282a', 0.004);
  },
});

const crane = () => walker({
  body: '#e8e8ec', size: 1.05, neck: (_x, y) => (y > 0.66 ? '#2a2a2e' : '#f4f4f6'), neckLen: 0.24, head: (_x, y) => (y > 0.012 ? '#d8282a' : '#2a2a2e'),
  beak: '#8a8a70', beakLen: 0.05, legLen: 0.38, legColor: '#3a3a3e', legTh: 0.024,
  tail: '#3a3a40',
});

const rhea = () => walker({
  body: (_x, y) => (y < 0.44 ? '#f4f0e8' : '#9aa0a8'), size: 1.6, neck: '#a8aeb6', neckLen: 0.2, head: '#8a9098', headR: 0.04,
  beak: '#6a5a4a', beakLen: 0.03, legLen: 0.34, legColor: '#9a9488', legTh: 0.045, fluffy: true,
});

const cassowary = () => walker({
  body: '#141414', size: 1.7, neck: (_x, y) => (y > 0.68 ? '#3a6ac8' : '#c8282a'), neckLen: 0.2, head: '#4a8ae8', headR: 0.042,
  beak: '#2a2a2a', beakLen: 0.035, legLen: 0.34, legColor: '#6a6a5a', legTh: 0.05, fluffy: true,
  extraHead: (h) => {
    // the tall brown casque and red wattles
    h.add(ellipsoid(0, 0.045, 0.004, 0.012, 0.035, 0.03), '#8a6a3a', 0.01);
    h.add(ellipsoid(0.01, -0.05, 0.01, 0.009, 0.022, 0.01), '#d8282a', 0.006).add(ellipsoid(-0.01, -0.05, 0.01, 0.009, 0.022, 0.01), '#d8282a', 0.006);
  },
});

const kiwiBird = (): CreatureParts => {
  // a round fuzzy brown ball with a long thin beak and sturdy feet
  const b = new Sculpt()
    .add(ellipsoid(0, 0.1, -0.01, 0.075, 0.07, 0.085), (x, y, z) => mixHex('#6a4a2a', '#9a7448', noise3(x * 40, y * 40, z * 40)))
    .displace((x, y, z) => noise3(x * 80, y * 80, z * 80) * 0.01);
  const body = build(b, [-0.1, 0.02, -0.11], [0.1, 0.19, 0.1], C * 0.4);
  const h = new Sculpt()
    .add(sphere(0, 0, 0, 0.034), '#7a5a34')
    .add(capsule(0, -0.006, 0.028, 0, -0.03, 0.11, 0.008, 0.004), '#d8c8a0', 0.006);
  const head = build(h, [-0.05, -0.06, -0.05], [0.05, 0.05, 0.13], C * 0.3);
  return {
    toon: true, eye: eyeOn(0.034, 0.6, 0.3, 0.26, 0.8), body, head, headAt: [0, 0.13, 0.075],
    leg: birdLeg(0.045, 0.024, '#b8a890'), legs: [[-0.03, 0], [0.03, 0]], legLen: 0.045, tail: null, tailAt: [0, 0, 0],
  };
};

const parrot = (): CreatureParts => {
  // an upright scarlet macaw: red body, blue and yellow wings and a long tail
  const b = new Sculpt()
    .add(ellipsoid(0, 0.15, -0.01, 0.055, 0.08, 0.06), '#d8282a')
    .add(capsule(0, 0.1, -0.05, 0, 0.0, -0.18, 0.025, 0.01), (_x, y) => (y > 0.05 ? '#d8282a' : '#2a6ac8'), 0.02);
  for (const sx of [-1, 1]) b.add(ellipsoid(sx * 0.05, 0.14, -0.03, 0.02, 0.06, 0.05), (_x, y) => (y > 0.16 ? '#f2c23a' : y > 0.12 ? '#3aa05a' : '#2a6ac8'), 0.012);
  const body = build(b, [-0.09, -0.02, -0.21], [0.09, 0.25, 0.08], C * 0.4);
  const h = new Sculpt()
    .add(sphere(0, 0, 0, 0.038), '#d8282a')
    .add(ellipsoid(0.018, 0.0, 0.02, 0.014, 0.018, 0.012), '#f4f0e8', 0.006).add(ellipsoid(-0.018, 0.0, 0.02, 0.014, 0.018, 0.012), '#f4f0e8', 0.006)
    .add(capsule(0, 0.0, 0.03, 0, -0.03, 0.05, 0.016, 0.006), '#f2e6c8', 0.006)
    .add(capsule(0, -0.018, 0.028, 0, -0.03, 0.038, 0.01, 0.005), '#2a2a2a', 0.004);
  const head = build(h, [-0.06, -0.06, -0.05], [0.06, 0.05, 0.08], C * 0.3);
  return {
    toon: true, eye: eyeOn(0.038, 0.6, 0.3, 0.3, 0.8), body, head, headAt: [0, 0.25, 0.02],
    leg: birdLeg(0.07, 0.02, '#5a5a5a'), legs: [[-0.025, 0], [0.025, 0]], legLen: 0.07, tail: null, tailAt: [0, 0, 0],
  };
};

const barnOwl = (): CreatureParts => {
  // a round golden owl with a white heart shaped face
  const b = new Sculpt()
    .add(ellipsoid(0, 0.15, 0, 0.07, 0.09, 0.065), (x, y, z) => (z > 0.03 ? '#fbf6ea' : noise3(x * 70, y * 70, z * 70) > 0.7 ? '#8a8a88' : '#d8a060'));
  for (const sx of [-1, 1]) b.add(ellipsoid(sx * 0.06, 0.15, -0.01, 0.02, 0.07, 0.05), '#c89050', 0.012);
  const body = build(b, [-0.1, 0.04, -0.09], [0.1, 0.26, 0.09], C * 0.4);
  const h = new Sculpt()
    .add(sphere(0, 0, 0, 0.055), '#d8a060')
    .add(ellipsoid(0, -0.005, 0.03, 0.048, 0.044, 0.028), '#fbf6ea', 0.01)
    .add(capsule(0, -0.004, 0.05, 0, -0.02, 0.058, 0.007, 0.004), '#e8c8a8', 0.004);
  const head = build(h, [-0.08, -0.07, -0.07], [0.08, 0.07, 0.09], C * 0.35);
  return {
    toon: true, eye: [0.02, 0.008, 0.05, 0.014, 0.1], body, head, headAt: [0, 0.27, 0.01],
    leg: birdLeg(0.06, 0.022, '#e8e0d0'), legs: [[-0.025, 0], [0.025, 0]], legLen: 0.06, tail: null, tailAt: [0, 0, 0],
  };
};

// water birds float on their pond, so they have no legs
function swimmer(bodyPaint: Paint, neck: Paint, neckLen: number, head: Paint, beak: string, extra?: { body?: (b: Sculpt) => void; head?: (h: Sculpt) => void }): CreatureParts {
  const b = new Sculpt()
    .add(ellipsoid(0, 0.07, -0.01, 0.08, 0.058, 0.115), bodyPaint)
    .add(ellipsoid(0, 0.105, -0.11, 0.035, 0.03, 0.04), bodyPaint, 0.03)
    .add(capsule(0, 0.09, 0.07, 0, 0.1 + neckLen, 0.09, 0.03, 0.026), neck, 0.025);
  for (const sx of [-1, 1]) b.add(ellipsoid(sx * 0.064, 0.09, -0.02, 0.022, 0.038, 0.08), bodyPaint, 0.015);
  extra?.body?.(b);
  const body = build(b, [-0.12, -0.01, -0.17], [0.12, 0.16 + neckLen, 0.14], C * 0.5);
  const h = new Sculpt()
    .add(sphere(0, 0, 0, 0.038), head)
    .add(ellipsoid(0, -0.01, 0.048, 0.02, 0.009, 0.03), beak, 0.008);
  extra?.head?.(h);
  const hd = build(h, [-0.06, -0.06, -0.06], [0.06, 0.07, 0.1], C * 0.35);
  return { toon: true, eye: eyeOn(0.038, 0.6, 0.25, 0.3, 0.85), body, head: hd, headAt: [0, 0.11 + neckLen, 0.095], leg: null, legs: [], legLen: 0, tail: null, tailAt: [0, 0, 0] };
}

const mandarinDuck = () => swimmer(
  (x, y, z) => (y > 0.1 && Math.abs(x) > 0.05 && z < 0.0 ? '#e8782a' : z > 0.05 ? '#6a3a6a' : y > 0.09 ? '#8a6a4a' : '#e8c89a'),
  '#e8782a', 0.04, (_x, y, z) => (y > 0.012 ? '#2a5a4a' : z > 0.01 && y > -0.012 ? '#fbf6ea' : '#e8782a'), '#d8282a',
  { body: (b) => { for (const sx of [-1, 1]) b.add(ellipsoid(sx * 0.05, 0.14, -0.05, 0.008, 0.04, 0.028), '#e8782a', 0.008); } },
);

const blackSwan = () => swimmer('#1a1a1e', '#1a1a1e', 0.14, '#1a1a1e', '#d8282a', {
  body: (b) => { for (let i = 0; i < 6; i++) b.add(sphere((i % 2 ? 1 : -1) * 0.04, 0.12, -0.08 + i * 0.012, 0.018), '#2a2a30', 0.01); },
  head: (h) => h.add(sphere(0, -0.006, 0.075, 0.008), '#f4f0e8', 0.003),
});

// ---------------------------------------------------------------- small mammals and one offs

const squirrel = (): CreatureParts => {
  const fur = '#b8622a';
  const b = new Sculpt()
    .add(ellipsoid(0, 0.08, -0.01, 0.045, 0.06, 0.05), fur)
    .add(ellipsoid(0, 0.07, 0.03, 0.03, 0.04, 0.02), '#f2e6d0', 0.02)
    .add(sphere(0.03, 0.04, -0.02, 0.03), fur, 0.02).add(sphere(-0.03, 0.04, -0.02, 0.03), fur, 0.02);
  const body = build(b, [-0.07, -0.01, -0.08], [0.07, 0.15, 0.07], C * 0.35);
  const h = new Sculpt()
    .add(sphere(0, 0, 0, 0.035), fur)
    .add(sphere(0, -0.01, 0.028, 0.018), '#f2e6d0', 0.01)
    .add(sphere(0, -0.004, 0.044, 0.006), '#3a2a24', 0.003);
  for (const sx of [-1, 1]) h.add(capsule(sx * 0.018, 0.028, -0.004, sx * 0.024, 0.055, -0.008, 0.01, 0.004), fur, 0.006);
  const head = build(h, [-0.05, -0.05, -0.05], [0.05, 0.07, 0.06], C * 0.3);
  // the big bushy tail curls up over the back
  const tail = build(new Sculpt()
    .add(capsule(0, 0, 0, 0, 0.06, -0.04, 0.03, 0.04), '#c8723a')
    .add(capsule(0, 0.06, -0.04, 0, 0.13, -0.01, 0.04, 0.035), '#c8723a', 0.02)
    .add(sphere(0, 0.15, 0.02, 0.03), '#c8723a', 0.02)
    .displace((x, y, z) => noise3(x * 60, y * 60, z * 60) * 0.012), [-0.06, -0.04, -0.1], [0.06, 0.2, 0.07], C * 0.4);
  return { toon: true, eye: eyeOn(0.035, 0.5, 0.25, 0.34, 0.5), body, head, headAt: [0, 0.14, 0.03], leg: null, legs: [], legLen: 0, tail, tailAt: [0, 0.04, -0.06] };
};

const beaver = (): CreatureParts => {
  const fur = '#6a4428';
  const b = new Sculpt()
    .add(ellipsoid(0, 0.07, -0.01, 0.07, 0.065, 0.1), fur)
    .add(ellipsoid(0, 0.02, -0.16, 0.045, 0.012, 0.07), (x, y, z) => (noise3(x * 90, y * 90, z * 90) > 0.5 ? '#3a2a24' : '#2a1e1a'), 0.01)
    .displace((x, y, z) => (z > -0.1 ? noise3(x * 60, y * 60, z * 60) * 0.008 : 0));
  for (const [x, z] of [[0.045, 0.06], [-0.045, 0.06], [0.05, -0.05], [-0.05, -0.05]]) b.add(ellipsoid(x, 0.012, z, 0.02, 0.014, 0.028), '#3a2a20', 0.012);
  const body = build(b, [-0.1, -0.01, -0.24], [0.1, 0.15, 0.12], C * 0.4);
  const h = new Sculpt()
    .add(sphere(0, 0, 0, 0.045), fur)
    .add(ellipsoid(0, -0.012, 0.035, 0.03, 0.024, 0.022), '#8a6040', 0.012)
    .add(sphere(0, 0.0, 0.056, 0.01), '#1a1412', 0.004)
    .add(ellipsoid(0, -0.036, 0.048, 0.012, 0.012, 0.004), '#f2a030', 0.003);
  for (const sx of [-1, 1]) h.add(sphere(sx * 0.03, 0.032, -0.01, 0.011), fur, 0.006);
  const head = build(h, [-0.06, -0.06, -0.06], [0.06, 0.06, 0.07], C * 0.35);
  return { toon: true, eye: eyeOn(0.045, 0.5, 0.3, 0.3, 0.5), body, head, headAt: [0, 0.1, 0.1], leg: null, legs: [], legLen: 0, tail: null, tailAt: [0, 0, 0] };
};

const chinchilla = (): CreatureParts => {
  const grey = (x: number, y: number, z: number) => (y < 0.04 ? '#f4f2ee' : mixHex('#8a8e96', '#b8bcc4', noise3(x * 30, y * 30, z * 30)));
  const b = new Sculpt()
    .add(ellipsoid(0, 0.065, -0.01, 0.06, 0.06, 0.07), grey)
    .add(capsule(0, 0.05, -0.07, 0, 0.1, -0.12, 0.022, 0.03), '#9a9ea6', 0.02)
    .displace((x, y, z) => noise3(x * 90, y * 90, z * 90) * 0.008);
  const body = build(b, [-0.09, -0.01, -0.16], [0.09, 0.14, 0.08], C * 0.35);
  const h = new Sculpt()
    .add(sphere(0, 0, 0, 0.042), '#a8acb4')
    .add(sphere(0, -0.012, 0.032, 0.018), '#d8dade', 0.01)
    .add(sphere(0, -0.006, 0.046, 0.007), '#e8a0a8', 0.003);
  // big round ears
  for (const sx of [-1, 1]) {
    h.add(ellipsoid(sx * 0.03, 0.045, -0.005, 0.022, 0.026, 0.006), '#a8acb4', 0.008);
    h.add(ellipsoid(sx * 0.03, 0.045, -0.0, 0.015, 0.018, 0.003), '#e8b8c0', 0.003);
  }
  const head = build(h, [-0.06, -0.05, -0.05], [0.06, 0.08, 0.06], C * 0.3);
  return { toon: true, eye: eyeOn(0.042, 0.5, 0.2, 0.34, 0.5), body, head, headAt: [0, 0.12, 0.05], leg: null, legs: [], legLen: 0, tail: null, tailAt: [0, 0, 0] };
};

const silkworm = (): CreatureParts => {
  // a plump creamy caterpillar in soft segments
  const b = new Sculpt();
  for (let i = 0; i < 7; i++) b.add(sphere(0, 0.03 + Math.sin(i * 0.9) * 0.004, -0.09 + i * 0.026, 0.028 - Math.abs(i - 3) * 0.002), i % 2 ? '#f2ece0' : '#e8e0d0', 0.012);
  for (let i = 0; i < 6; i++) for (const sx of [-1, 1]) b.add(sphere(sx * 0.018, 0.006, -0.08 + i * 0.03, 0.007), '#d8ccb8', 0.004);
  const body = build(b, [-0.05, -0.01, -0.13], [0.05, 0.07, 0.1], C * 0.3);
  const h = new Sculpt()
    .add(sphere(0, 0, 0, 0.03), '#f6f0e4')
    .add(capsule(0.01, 0.02, 0.0, 0.016, 0.04, 0.01, 0.004), '#8a7a6a', 0.003)
    .add(capsule(-0.01, 0.02, 0.0, -0.016, 0.04, 0.01, 0.004), '#8a7a6a', 0.003);
  const head = build(h, [-0.04, -0.04, -0.04], [0.04, 0.05, 0.04], C * 0.25);
  return { toon: true, eye: eyeOn(0.03, 0.45, 0.2, 0.3, 0.4), body, head, headAt: [0, 0.04, 0.1], leg: null, legs: [], legLen: 0, tail: null, tailAt: [0, 0, 0] };
};

const pony = (): CreatureParts => {
  // a stocky little Shetland: chestnut with a flaxen mane and a shaggy forelock
  const coat = shade('#9a5a2a', '#7a4420', 0.24, 0.42), mane = '#f2dca0';
  const b = new Sculpt()
    .add(ellipsoid(0, 0.33, 0, 0.1, 0.1, 0.16), coat)
    .add(sphere(0, 0.33, 0.1, 0.1), coat, 0.07)
    .add(sphere(0, 0.34, -0.1, 0.1), coat, 0.07)
    .add(capsule(0, 0.35, 0.12, 0, 0.45, 0.19, 0.07, 0.056), coat, 0.05);
  for (let i = 0; i <= 6; i++) { const t = i / 6; b.add(sphere(0, 0.4 + t * 0.09, 0.09 + t * 0.1, 0.034), mane, 0.018); }
  b.displace((x, y, z) => noise3(x * 40, y * 40, z * 40) * 0.008);
  const body = build(b, [-0.14, 0.2, -0.22], [0.14, 0.54, 0.27], C);
  const h = new Sculpt()
    .add(sphere(0, 0, 0, 0.065), '#9a5a2a')
    .add(capsule(0, -0.01, 0.02, 0, -0.035, 0.1, 0.055, 0.048), (_x, _y, z) => (z > 0.08 ? '#6a3a1e' : '#9a5a2a'), 0.03);
  puffs(h, [0, 0.055, 0.02], [0.03, 0.02, 0.03], 7, 0.024, mane, 0.4, -0.3);
  for (const sx of [-1, 1]) h.add(capsule(sx * 0.03, 0.05, -0.01, sx * 0.038, 0.1, -0.02, 0.018, 0.006), '#9a5a2a', 0.01);
  const head = build(h, [-0.1, -0.1, -0.08], [0.1, 0.13, 0.17], C * 0.5);
  const tail = build(new Sculpt()
    .add(capsule(0, 0, 0, 0, -0.16, -0.04, 0.032, 0.022), mane)
    .displace((x, y, z) => noise3(x * 70, y * 20, z * 70) * 0.012), [-0.06, -0.21, -0.09], [0.06, 0.04, 0.05], C * 0.55);
  return {
    toon: true, eye: eyeOn(0.065, 0.55, 0.25, 0.32, 0.6), body, head, headAt: [0, 0.47, 0.22],
    leg: toonLeg(0.2, 0.07, (y) => (y < -0.14 ? '#f4efe6' : '#7a4420'), '#2e2018'), legs: [[-0.06, 0.12], [0.06, 0.12], [-0.06, -0.12], [0.06, -0.12]], legLen: 0.2, tail, tailAt: [0, 0.38, -0.21],
  };
};

const bactrianCamel = (): CreatureParts => {
  // two woolly humps, a shaggy neck and a thick winter coat
  const coat = shade('#b8844a', '#a0703a', 0.5, 0.72), shag = '#8a5a2a';
  const b = new Sculpt()
    .add(ellipsoid(0, 0.55, 0, 0.11, 0.1, 0.19), coat)
    .add(sphere(0, 0.67, 0.07, 0.07), shag, 0.05)
    .add(sphere(0, 0.67, -0.08, 0.07), shag, 0.05)
    .add(capsule(0, 0.55, 0.13, 0, 0.5, 0.24, 0.065, 0.055), coat, 0.05)
    .add(capsule(0, 0.5, 0.24, 0, 0.68, 0.32, 0.055, 0.045), coat, 0.04)
    .add(ellipsoid(0, 0.5, 0.22, 0.06, 0.08, 0.05), shag, 0.04)
    .displace((x, y, z) => (y > 0.62 || (z > 0.15 && y < 0.58) ? noise3(x * 50, y * 12, z * 50) * 0.022 : 0));
  const body = build(b, [-0.14, 0.42, -0.23], [0.14, 0.78, 0.38], C);
  const h = new Sculpt()
    .add(sphere(0, 0, 0, 0.055), '#b8844a')
    .add(capsule(0, -0.005, 0.02, 0, -0.022, 0.09, 0.044, 0.038), (_x, _y, z) => (z > 0.07 ? '#d8b080' : '#b8844a'), 0.03)
    .add(sphere(0, 0.045, 0.0, 0.032), shag, 0.02);
  for (const sx of [-1, 1]) h.add(ellipsoid(sx * 0.045, 0.04, -0.03, 0.016, 0.022, 0.012), '#a0703a', 0.01);
  const head = build(h, [-0.09, -0.08, -0.07], [0.09, 0.1, 0.15], C * 0.5);
  const tail = build(new Sculpt().add(capsule(0, 0, 0, 0, -0.14, -0.01, 0.01, 0.008), '#a0703a').add(ellipsoid(0, -0.16, -0.01, 0.016, 0.03, 0.016), '#5a3a1a', 0.01), [-0.03, -0.21, -0.04], [0.03, 0.02, 0.03], C * 0.5);
  return {
    toon: true, eye: eyeOn(0.055, 0.55, 0.25, 0.32, 0.6), body, head, headAt: [0, 0.7, 0.33],
    leg: toonLeg(0.42, 0.06, '#a0703a', '#6a5038'), legs: [[-0.062, 0.13], [0.062, 0.13], [-0.062, -0.13], [0.062, -0.13]], legLen: 0.42, tail, tailAt: [0, 0.58, -0.2],
  };
};

const vicuna = (): CreatureParts => {
  // slender and golden with a long white bib hanging from the chest
  const coat = (x: number, y: number, z: number) => (y < 0.34 || (z > 0.1 && y < 0.5) ? '#fbf6ea' : mixHex('#c8904a', '#e0aa62', noise3(x * 20, y * 20, z * 20)));
  const b = new Sculpt()
    .add(ellipsoid(0, 0.4, 0, 0.085, 0.085, 0.15), coat)
    .add(capsule(0, 0.42, 0.1, 0, 0.64, 0.16, 0.048, 0.04), (_x, y) => (y < 0.5 ? '#fbf6ea' : '#d8a058'), 0.04)
    .add(ellipsoid(0, 0.36, 0.13, 0.05, 0.08, 0.04), '#fbf6ea', 0.03)
    .displace((x, y, z) => (z > 0.1 && y < 0.44 ? noise3(x * 50, y * 10, z * 50) * 0.018 : 0));
  const body = build(b, [-0.12, 0.26, -0.18], [0.12, 0.72, 0.24], C * 0.8);
  const h = new Sculpt()
    .add(sphere(0, 0, 0, 0.046), '#d8a058')
    .add(capsule(0, -0.01, 0.02, 0, -0.018, 0.064, 0.03, 0.026), '#e8c490', 0.02)
    .add(ellipsoid(0, -0.02, 0.09, 0.012, 0.008, 0.005), '#3a2a20', 0.005);
  for (const sx of [-1, 1]) h.add(capsule(sx * 0.026, 0.035, -0.02, sx * 0.04, 0.09, -0.01, 0.012, 0.008), '#c8904a', 0.008);
  const head = build(h, [-0.08, -0.06, -0.06], [0.08, 0.12, 0.11], C * 0.4);
  const tail = build(new Sculpt().add(capsule(0, 0, 0, 0, -0.05, -0.03, 0.016, 0.012), '#d8a058'), [-0.03, -0.07, -0.06], [0.03, 0.03, 0.03], C * 0.45);
  return {
    toon: true, eye: eyeOn(0.046, 0.45, 0.22, 0.36, 0.45), body, head, headAt: [0, 0.67, 0.17],
    leg: toonLeg(0.28, 0.046, '#e0aa62', '#4a3a30'), legs: [[-0.05, 0.09], [0.05, 0.09], [-0.05, -0.09], [0.05, -0.09]], legLen: 0.28, tail, tailAt: [0, 0.43, -0.15],
  };
};

// ---------------------------------------------------------------- late unlocks

const hereford = () => cattle({
  coat: (_x, y, z) => (y < 0.22 && z > -0.05 ? '#f4efe6' : '#8a2e16'), face: '#f6f2ea', muzzle: '#e8b8a8', ear: '#8a2e16', leg: (y) => (y < -0.1 ? '#f4efe6' : '#8a2e16'),
  tail: '#8a2e16', tailTip: '#f4efe6', dewlap: '#f4efe6',
  horns: { pts: [[0.05, 0.09, -0.01], [0.09, 0.1, 0.0], [0.11, 0.08, 0.04]], r0: 0.016, r1: 0.007, color: '#efe2c0' },
});

const suffolkSheep = () => smallRuminant({
  coat: '#f2ecdc', face: '#141212', muzzle: '#141212', legColor: '#141212', ear: '#141212', tuft: '#f2ecdc',
  wool: (x, y, z) => mixHex('#e2d8c2', '#f8f2e4', smooth(0.14, 0.36, y + (noise3(x * 26, y * 26, z * 26) - 0.5) * 0.05)),
});

const saanenGoat = () => smallRuminant({
  coat: '#f8f6f0', face: '#faf8f2', muzzle: '#eec0b8', legColor: '#f4f0e6', ear: '#f4f0e6', beard: '#f4f0e6',
});

const bronzeTurkey = () => walker({
  body: (x, y, z) => (noise3(x * 50, y * 50, z * 50) > 0.62 ? '#3a6a4a' : '#4a2e1a'), size: 1.35, wing: (_x, y) => (y > 0.18 ? '#5a3a22' : '#e8e0d0'),
  neck: '#6a8ab0', neckLen: 0.07, head: '#b8d0e8', beak: '#d8c8a0', beakLen: 0.022, legLen: 0.1, legColor: '#c8a890',
  extraBody: (b) => {
    // the fanned tail with pale tips
    for (let i = 0; i < 9; i++) {
      const a = (i / 8 - 0.5) * 2.2;
      b.add(capsule(0, 0.26, -0.1, Math.sin(a) * 0.14, 0.26 + Math.cos(a) * 0.15, -0.15, 0.03, 0.022), (_x, y) => (y > 0.37 ? '#e8dcc0' : '#4a2e1a'), 0.01);
    }
  },
  extraHead: (h) => {
    h.add(capsule(0, -0.01, 0.03, 0.006, -0.06, 0.03, 0.009, 0.006), '#c81e1e', 0.005);
    h.add(ellipsoid(0, -0.04, 0.0, 0.02, 0.03, 0.02), '#c81e1e', 0.01);
  },
});

const ayamCemani = () => walker({
  body: (x, y, z) => (noise3(x * 40, y * 40, z * 40) > 0.66 ? '#1a2a2a' : '#0e0e10'), neck: '#0e0e10', neckLen: 0.06, head: '#161618', beak: '#141414',
  beakLen: 0.018, legLen: 0.08, legColor: '#1a1a1c', tail: '#101418',
  extraHead: (h) => {
    // a black serrated comb and wattles, black all over
    for (let i = 0; i < 4; i++) h.add(sphere(0, 0.035 + (i % 2) * 0.006, -0.012 + i * 0.012, 0.011), '#1e1a1c', 0.006);
    h.add(ellipsoid(0, -0.035, 0.022, 0.01, 0.016, 0.008), '#1e1a1c', 0.005);
  },
  extraBody: (b) => {
    for (let i = 0; i < 4; i++) b.add(capsule(0, 0.18, -0.1, (i - 1.5) * 0.02, 0.3 - i * 0.012, -0.17 - i * 0.012, 0.012, 0.006), '#14202a', 0.008);
  },
});

const greyHeron = () => walker({
  body: (_x, y) => (y < 0.44 ? '#e8eaec' : '#8a94a0'), wing: '#7a8490', size: 1.05, neck: (_x, _y, z) => (z > 0.14 ? '#f0f0f2' : '#dcdee2'), neckLen: 0.26,
  head: (_x, y) => (y > 0.012 ? '#1a1a1e' : '#f4f4f6'), beak: '#d8b830', beakLen: 0.07, legLen: 0.36, legColor: '#8a7a5a', legTh: 0.022, tail: '#6a7480',
  extraHead: (h) => h.add(capsule(0, 0.02, -0.03, 0, 0.0, -0.1, 0.006, 0.003), '#1a1a1e', 0.004),
});

export const toonMakers2: Record<string, () => CreatureParts> = {
  silkie_chicken: silkieChicken, pony, black_sheep: blackSheep, jersey_cow: jerseyCow, muscovy_duck: muscovyDuck, nubian_goat: nubianGoat,
  silkworm, angora_goat: angoraGoat, mandarin_duck: mandarinDuck, squirrel, merino_sheep: merinoSheep, parrot, belted_galloway: beltedGalloway,
  moose, cashmere_goat: cashmereGoat, rhea, bactrian_camel: bactrianCamel, beaver, jacob_sheep: jacobSheep, spotted_deer: spottedDeer,
  crane, zebu, musk_ox: muskOx, black_swan: blackSwan, cassowary, watusi, chinchilla, barn_owl: barnOwl, kiwi_bird: kiwiBird, vicuna,
  hereford, suffolk_sheep: suffolkSheep, saanen_goat: saanenGoat, bronze_turkey: bronzeTurkey, ayam_cemani: ayamCemani, grey_heron: greyHeron,
};
