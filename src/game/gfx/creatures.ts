// Sculpted animal parts. Each creature is a body, a head, a leg and a tail, each one smooth
// SDF mesh with its coat painted into vertex colors. The renderer assembles them on pivots so
// heads can graze, legs can walk and tails can swish. Built once per kind and cached.
import * as THREE from 'three';
import { Sculpt, capsule, ellipsoid, noise3, sphere } from './sdf';

export interface CreatureParts {
  body: THREE.BufferGeometry;
  head: THREE.BufferGeometry;
  headAt: [number, number, number];
  leg: THREE.BufferGeometry | null;
  legs: [number, number][]; // x, z of each hip
  legLen: number;
  tail: THREE.BufferGeometry | null;
  tailAt: [number, number, number];
  wool?: boolean;
}

const C = 0.0065; // voxel size used for sculpting

function leg(len: number, th: number, color: string, hoof: string, hoofH = 0.04) {
  return new Sculpt()
    .add(capsule(0, 0.01, 0, 0, -len + th * 0.5, 0.004, th * 0.55, th * 0.46), (_x, y) => (y < -len + hoofH ? hoof : color))
    .add(ellipsoid(0, -len + hoofH * 0.45, 0.006, th * 0.5, hoofH * 0.55, th * 0.58), hoof, 0.012)
    .build([-th, -len - 0.01, -th], [th, 0.03, th + 0.02], C * 0.75);
}

// Holstein coat: irregular black patches from two octaves of noise
const holstein = (x: number, y: number, z: number, th = 0.57) =>
  noise3(x * 7 + 3, y * 7, z * 7) * 0.7 + noise3(x * 17 + 8, y * 17, z * 17) * 0.3 > th ? '#1f1f1f' : '#f7f5f0';

function cow(): CreatureParts {
  const coat = (x: number, y: number, z: number) => holstein(x, y, z);
  const body = new Sculpt()
    // deep barrel, withers over the shoulders, a flat back and hook bones at the hips
    .add(ellipsoid(0, 0.33, 0, 0.125, 0.13, 0.23), coat)
    .add(sphere(0, 0.345, 0.13, 0.12), coat, 0.07)
    .add(ellipsoid(0, 0.35, -0.14, 0.12, 0.12, 0.11), coat, 0.07)
    .add(sphere(0.085, 0.43, -0.16, 0.035), coat, 0.04)
    .add(sphere(-0.085, 0.43, -0.16, 0.035), coat, 0.04)
    .add(ellipsoid(0, 0.44, 0.1, 0.06, 0.03, 0.08), coat, 0.05)
    // neck and dewlap
    .add(capsule(0, 0.35, 0.15, 0, 0.41, 0.26, 0.085, 0.068), coat, 0.06)
    .add(ellipsoid(0, 0.29, 0.21, 0.03, 0.06, 0.06), coat, 0.04)
    // udder with four teats
    .add(ellipsoid(0, 0.215, -0.09, 0.06, 0.045, 0.06), '#eba9b1', 0.035)
    .add(capsule(0.025, 0.19, -0.07, 0.025, 0.165, -0.07, 0.008, 0.007), '#e39aa3', 0.008)
    .add(capsule(-0.025, 0.19, -0.07, -0.025, 0.165, -0.07, 0.008, 0.007), '#e39aa3', 0.008)
    .add(capsule(0.025, 0.19, -0.11, 0.025, 0.165, -0.11, 0.008, 0.007), '#e39aa3', 0.008)
    .add(capsule(-0.025, 0.19, -0.11, -0.025, 0.165, -0.11, 0.008, 0.007), '#e39aa3', 0.008)
    .build([-0.16, 0.14, -0.28], [0.16, 0.5, 0.33], C);
  const face = (x: number, y: number, z: number) => (Math.abs(x) < 0.028 && z > 0.02 ? '#f7f5f0' : holstein(x, y, z + 5, 0.5));
  const head = new Sculpt()
    // long face tapering to a broad wet muzzle, poll between the horns
    .add(sphere(0, 0.035, 0.0, 0.068), face)
    .add(capsule(0, 0.03, 0.02, 0, -0.045, 0.13, 0.064, 0.05), face, 0.04)
    .add(ellipsoid(0, -0.065, 0.15, 0.058, 0.042, 0.042), '#e9a7ae', 0.03)
    .carve(ellipsoid(0.024, -0.06, 0.19, 0.011, 0.014, 0.012))
    .carve(ellipsoid(-0.024, -0.06, 0.19, 0.011, 0.014, 0.012))
    .carve(ellipsoid(0, -0.095, 0.17, 0.04, 0.004, 0.02), 0.004)
    .add(ellipsoid(0.095, 0.03, -0.01, 0.055, 0.016, 0.03), '#f0ece4', 0.015)
    .add(ellipsoid(-0.095, 0.03, -0.01, 0.055, 0.016, 0.03), '#f0ece4', 0.015)
    .add(capsule(0.04, 0.085, -0.01, 0.07, 0.115, -0.03, 0.013, 0.005), '#e9dcbc', 0.01)
    .add(capsule(-0.04, 0.085, -0.01, -0.07, 0.115, -0.03, 0.013, 0.005), '#e9dcbc', 0.01)
    .build([-0.16, -0.13, -0.09], [0.16, 0.14, 0.22], C * 0.6);
  const tail = new Sculpt()
    .add(capsule(0, 0, 0, 0, -0.2, 0.012, 0.012, 0.008), '#f7f5f0')
    .add(ellipsoid(0, -0.225, 0.012, 0.02, 0.04, 0.02), '#1f1f1f', 0.015)
    .displace((x, y, z) => (y < -0.19 ? noise3(x * 90, y * 40, z * 90) * 0.008 : 0))
    .build([-0.04, -0.28, -0.04], [0.04, 0.02, 0.05], C * 0.55);
  return { body, head, headAt: [0, 0.41, 0.26], leg: leg(0.2, 0.055, '#f7f5f0', '#3a2e26', 0.035), legs: [[-0.075, 0.15], [0.075, 0.15], [-0.075, -0.15], [0.075, -0.15]], legLen: 0.2, tail, tailAt: [0, 0.42, -0.25] };
}

function pig(): CreatureParts {
  const pink = '#f4a9b8';
  const body = new Sculpt()
    .add(ellipsoid(0, 0.2, 0, 0.13, 0.12, 0.17), pink)
    .add(sphere(0, 0.21, 0.1, 0.1), pink, 0.06)
    .build([-0.15, 0.06, -0.2], [0.15, 0.34, 0.22], C);
  const head = new Sculpt()
    .add(sphere(0, 0, 0, 0.095), pink)
    .add(ellipsoid(0.055, -0.03, 0.055, 0.035, 0.025, 0.03), '#f7b8c4', 0.03)
    .add(ellipsoid(-0.055, -0.03, 0.055, 0.035, 0.025, 0.03), '#f7b8c4', 0.03)
    .add(capsule(0, -0.015, 0.07, 0, -0.015, 0.115, 0.045, 0.047), '#f08ea2', 0.02)
    .carve(ellipsoid(0.017, -0.015, 0.165, 0.009, 0.013, 0.012))
    .carve(ellipsoid(-0.017, -0.015, 0.165, 0.009, 0.013, 0.012))
    .add(ellipsoid(0.062, 0.08, 0.02, 0.035, 0.045, 0.013), '#f08ea2', 0.012)
    .add(ellipsoid(-0.062, 0.08, 0.02, 0.035, 0.045, 0.013), '#f08ea2', 0.012)
    .build([-0.12, -0.11, -0.11], [0.12, 0.14, 0.18], C * 0.7);
  return { body, head, headAt: [0, 0.24, 0.15], leg: leg(0.1, 0.058, '#f0a0b0', '#c97b8b', 0.03), legs: [[-0.065, 0.085], [0.065, 0.085], [-0.065, -0.085], [0.065, -0.085]], legLen: 0.1, tail: null, tailAt: [0, 0.23, -0.16] };
}

function sheep(): CreatureParts {
  const wool = (x: number, y: number, z: number) => (noise3(x * 30, y * 30, z * 30) > 0.72 ? '#ece6d8' : '#faf7ef');
  const body = new Sculpt()
    .add(ellipsoid(0, 0.25, 0, 0.16, 0.13, 0.2), wool)
    .add(sphere(0, 0.3, -0.03, 0.12), wool, 0.06)
    .displace((x, y, z) => Math.pow(noise3(x * 38, y * 38, z * 38), 1.5) * 0.028)
    .build([-0.2, 0.08, -0.25], [0.2, 0.45, 0.25], C);
  const head = new Sculpt()
    .add(ellipsoid(0, -0.01, 0.03, 0.052, 0.062, 0.08), '#3a3a3a')
    .add(sphere(0, 0.045, 0.0, 0.055), '#faf7ef', 0.02)
    .add(ellipsoid(0.065, 0.005, -0.005, 0.04, 0.014, 0.022), '#3a3a3a', 0.01)
    .add(ellipsoid(-0.065, 0.005, -0.005, 0.04, 0.014, 0.022), '#3a3a3a', 0.01)
    .displace((x, y, z) => (y > 0.03 ? Math.pow(noise3(x * 45, y * 45, z * 45), 1.5) * 0.018 * Math.min(1, (y - 0.03) / 0.03) : 0))
    .build([-0.12, -0.09, -0.08], [0.12, 0.13, 0.13], C * 0.7);
  return { body, head, headAt: [0, 0.29, 0.18], leg: leg(0.13, 0.04, '#3a3a3a', '#222222', 0.025), legs: [[-0.05, 0.075], [0.05, 0.075], [-0.05, -0.075], [0.05, -0.075]], legLen: 0.13, tail: null, tailAt: [0, 0, 0], wool: true };
}

function goat(): CreatureParts {
  const c = '#ece6da';
  const body = new Sculpt()
    .add(ellipsoid(0, 0.27, 0, 0.085, 0.09, 0.16), c)
    .add(sphere(0, 0.28, 0.09, 0.08), c, 0.05)
    .add(capsule(0, 0.29, 0.1, 0, 0.34, 0.16, 0.05, 0.042), c, 0.04)
    .build([-0.11, 0.15, -0.2], [0.11, 0.4, 0.22], C);
  const head = new Sculpt()
    .add(ellipsoid(0, 0.0, 0.02, 0.05, 0.058, 0.065), c)
    .add(capsule(0, -0.01, 0.05, 0, -0.03, 0.105, 0.036, 0.028), c, 0.03)
    .add(sphere(0, -0.028, 0.13, 0.012), '#6b5a4a', 0.01)
    .add(capsule(0, -0.055, 0.08, 0, -0.105, 0.07, 0.013, 0.004), '#d8d0c0', 0.012)
    .add(ellipsoid(0.07, 0.005, 0, 0.04, 0.014, 0.022), '#ddd5c4', 0.01)
    .add(ellipsoid(-0.07, 0.005, 0, 0.04, 0.014, 0.022), '#ddd5c4', 0.01)
    .build([-0.12, -0.12, -0.06], [0.12, 0.08, 0.16], C * 0.7);
  const tail = new Sculpt().add(capsule(0, 0, 0, 0, 0.05, -0.01, 0.014, 0.008), c).build([-0.03, -0.02, -0.04], [0.03, 0.07, 0.02], C * 0.6);
  return { body, head, headAt: [0, 0.34, 0.16], leg: leg(0.16, 0.042, '#e6dfd1', '#6b5a4a', 0.03), legs: [[-0.05, 0.09], [0.05, 0.09], [-0.05, -0.09], [0.05, -0.09]], legLen: 0.16, tail, tailAt: [0, 0.3, -0.15] };
}

function horse(): CreatureParts {
  const c = '#8a5a2b', hair = '#3a2616';
  const body = new Sculpt()
    .add(ellipsoid(0, 0.39, 0, 0.1, 0.11, 0.22), c)
    .add(sphere(0, 0.4, 0.13, 0.1), c, 0.06)
    .add(sphere(0, 0.41, -0.13, 0.1), c, 0.06)
    .add(capsule(0, 0.43, 0.15, 0, 0.58, 0.25, 0.062, 0.045), c, 0.05)
    .add(capsule(0, 0.49, 0.13, 0, 0.63, 0.22, 0.024, 0.02), hair, 0.02)
    .build([-0.13, 0.26, -0.26], [0.13, 0.68, 0.32], C);
  const head = new Sculpt()
    .add(capsule(0, 0.0, 0, 0, -0.05, 0.13, 0.05, 0.042), c)
    .add(sphere(0, -0.055, 0.14, 0.045), '#6b4424', 0.03)
    .carve(sphere(0.02, -0.05, 0.185, 0.009))
    .carve(sphere(-0.02, -0.05, 0.185, 0.009))
    .add(capsule(0.03, 0.03, -0.01, 0.035, 0.085, -0.02, 0.013, 0.004), c, 0.01)
    .add(capsule(-0.03, 0.03, -0.01, -0.035, 0.085, -0.02, 0.013, 0.004), c, 0.01)
    .add(capsule(0, 0.05, -0.01, 0, 0.03, 0.05, 0.02, 0.012), hair, 0.01)
    .build([-0.07, -0.11, -0.06], [0.07, 0.1, 0.2], C * 0.7);
  const tail = new Sculpt()
    .add(capsule(0, 0, 0, 0, -0.2, -0.04, 0.03, 0.018), hair)
    .displace((x, y, z) => noise3(x * 60, y * 25, z * 60) * 0.008)
    .build([-0.05, -0.24, -0.08], [0.05, 0.04, 0.04], C * 0.6);
  return { body, head, headAt: [0, 0.6, 0.25], leg: leg(0.3, 0.052, c, '#2a1d14', 0.045), legs: [[-0.06, 0.15], [0.06, 0.15], [-0.06, -0.15], [0.06, -0.15]], legLen: 0.3, tail, tailAt: [0, 0.46, -0.24] };
}

function chicken(): CreatureParts {
  const body = new Sculpt()
    .add(ellipsoid(0, 0.16, 0, 0.088, 0.085, 0.108), '#ffffff')
    .add(ellipsoid(0, 0.22, -0.085, 0.035, 0.07, 0.035), '#f4f1ea', 0.04)
    .add(ellipsoid(0.078, 0.165, -0.005, 0.028, 0.058, 0.085), (_x, y) => (y < 0.13 ? '#e9e5dc' : '#f7f5f0'), 0.012)
    .add(ellipsoid(-0.078, 0.165, -0.005, 0.028, 0.058, 0.085), (_x, y) => (y < 0.13 ? '#e9e5dc' : '#f7f5f0'), 0.012)
    .build([-0.12, 0.06, -0.14], [0.12, 0.3, 0.13], C * 0.7);
  const head = new Sculpt()
    .add(sphere(0, 0.02, 0.02, 0.056), '#ffffff')
    .add(capsule(0, 0.018, 0.06, 0, 0.012, 0.105, 0.02, 0.002), '#f0a030', 0.006)
    .add(sphere(0, 0.078, 0.0, 0.02), '#e0312b', 0.012)
    .add(sphere(0, 0.088, 0.022, 0.022), '#e0312b', 0.012)
    .add(sphere(0, 0.078, 0.044, 0.018), '#e0312b', 0.012)
    .add(ellipsoid(0, -0.018, 0.068, 0.012, 0.02, 0.01), '#e0312b', 0.01)
    .build([-0.07, -0.06, -0.05], [0.07, 0.12, 0.12], C * 0.55);
  return { body, head, headAt: [0, 0.23, 0.06], leg: leg(0.08, 0.018, '#f0a030', '#f0a030', 0.01), legs: [[-0.03, 0], [0.03, 0]], legLen: 0.08, tail: null, tailAt: [0, 0, 0] };
}

function duck(): CreatureParts {
  const body = new Sculpt()
    .add(ellipsoid(0, 0.065, 0, 0.08, 0.062, 0.115), '#ffffff')
    .add(ellipsoid(0, 0.1, -0.1, 0.04, 0.03, 0.05), '#f4f4f4', 0.03)
    .add(ellipsoid(0.065, 0.08, -0.01, 0.022, 0.04, 0.08), '#ececec', 0.012)
    .add(ellipsoid(-0.065, 0.08, -0.01, 0.022, 0.04, 0.08), '#ececec', 0.012)
    .build([-0.1, -0.01, -0.16], [0.1, 0.15, 0.13], C * 0.7);
  const head = new Sculpt()
    .add(sphere(0, 0.012, 0, 0.052), (_x, y) => (y < -0.03 ? '#ffffff' : '#2e7d4a'))
    .add(ellipsoid(0, -0.005, 0.062, 0.03, 0.012, 0.045), '#f0a030', 0.012)
    .build([-0.07, -0.06, -0.06], [0.07, 0.08, 0.12], C * 0.55);
  return { body, head, headAt: [0, 0.15, 0.08], leg: null, legs: [], legLen: 0, tail: null, tailAt: [0, 0, 0] };
}

export function dogParts(): CreatureParts {
  const c = '#b07a3f', cream = '#f1dcb8';
  const body = new Sculpt()
    .add(ellipsoid(0, 0.16, 0, 0.06, 0.066, 0.12), (_x, y, z) => (y < 0.14 && z > -0.02 ? cream : c))
    .add(sphere(0, 0.17, 0.07, 0.065), (_x, y) => (y < 0.16 ? cream : c), 0.04)
    .add(capsule(0, 0.18, 0.08, 0, 0.23, 0.12, 0.045, 0.04), c, 0.04)
    .build([-0.09, 0.07, -0.15], [0.09, 0.28, 0.16], C * 0.7);
  const head = new Sculpt()
    .add(sphere(0, 0.005, 0, 0.064), c)
    .add(capsule(0, -0.015, 0.035, 0, -0.025, 0.09, 0.036, 0.03), cream, 0.03)
    .add(sphere(0, -0.012, 0.118, 0.016), '#1f140c', 0.006)
    .add(ellipsoid(0.062, -0.005, -0.01, 0.02, 0.052, 0.034), '#7a4b26', 0.012)
    .add(ellipsoid(-0.062, -0.005, -0.01, 0.02, 0.052, 0.034), '#7a4b26', 0.012)
    .build([-0.1, -0.08, -0.08], [0.1, 0.09, 0.15], C * 0.55);
  const tail = new Sculpt().add(capsule(0, 0, 0, 0, 0.09, 0, 0.015, 0.008), c).build([-0.03, -0.02, -0.03], [0.03, 0.11, 0.03], C * 0.5);
  return { body, head, headAt: [0, 0.24, 0.12], leg: leg(0.13, 0.04, c, cream, 0.03), legs: [[-0.042, 0.08], [0.042, 0.08], [-0.042, -0.08], [0.042, -0.08]], legLen: 0.13, tail, tailAt: [0, 0.19, -0.12] };
}

function rabbit(): CreatureParts {
  const fur = '#f4efe8';
  const fluff = (x: number, y: number, z: number) => Math.pow(noise3(x * 70, y * 70, z * 70), 2) * 0.008;
  const body = new Sculpt()
    .add(ellipsoid(0, 0.1, -0.01, 0.08, 0.075, 0.1), fur)
    .add(sphere(0.045, 0.085, -0.05, 0.055), fur, 0.04)
    .add(sphere(-0.045, 0.085, -0.05, 0.055), fur, 0.04)
    .add(sphere(0, 0.105, 0.05, 0.06), fur, 0.04)
    .add(ellipsoid(0.03, 0.03, 0.075, 0.018, 0.03, 0.024), fur, 0.02)
    .add(ellipsoid(-0.03, 0.03, 0.075, 0.018, 0.03, 0.024), fur, 0.02)
    .add(sphere(0, 0.12, -0.115, 0.035), '#ffffff', 0.015)
    .displace(fluff)
    .build([-0.12, -0.01, -0.17], [0.12, 0.2, 0.13], 0.005);
  const ear = (sx: number) => ellipsoid(sx * 0.026, 0.09, -0.012, 0.018, 0.062, 0.011);
  const earPaint = (x: number, _y: number, z: number) => (z > -0.004 && Math.abs(Math.abs(x) - 0.026) < 0.009 ? '#f5b5c0' : fur);
  const head = new Sculpt()
    .add(sphere(0, 0, 0.01, 0.055), fur)
    .add(sphere(0.028, -0.02, 0.042, 0.03), fur, 0.02)
    .add(sphere(-0.028, -0.02, 0.042, 0.03), fur, 0.02)
    .add(sphere(0, -0.008, 0.066, 0.011), '#f08ea2', 0.006)
    .add(ear(1), earPaint, 0.015)
    .add(ear(-1), earPaint, 0.015)
    .build([-0.08, -0.07, -0.06], [0.08, 0.17, 0.1], 0.0042);
  return { body, head, headAt: [0, 0.17, 0.07], leg: null, legs: [], legLen: 0, tail: null, tailAt: [0, 0, 0] };
}

function alpaca(): CreatureParts {
  const c = '#ead5b3', dark = '#cdb592';
  const fluff = (x: number, y: number, z: number) => Math.pow(noise3(x * 42, y * 42, z * 42), 1.6) * 0.02;
  const body = new Sculpt()
    .add(ellipsoid(0, 0.34, 0, 0.1, 0.1, 0.16), c)
    .add(sphere(0, 0.35, 0.09, 0.09), c, 0.05)
    .add(capsule(0, 0.38, 0.1, 0, 0.57, 0.16, 0.058, 0.046), c, 0.05)
    .add(sphere(0, 0.39, -0.16, 0.035), c, 0.02)
    .displace(fluff)
    .build([-0.14, 0.2, -0.22], [0.14, 0.64, 0.24], C);
  const head = new Sculpt()
    .add(ellipsoid(0, 0, 0.02, 0.045, 0.05, 0.06), c)
    .add(ellipsoid(0, -0.022, 0.07, 0.03, 0.028, 0.035), dark, 0.025)
    .add(sphere(0, -0.02, 0.1, 0.008), '#5a4030', 0.006)
    .add(sphere(0, 0.048, 0.0, 0.045), c, 0.02)
    .add(capsule(0.03, 0.05, -0.01, 0.048, 0.105, -0.005, 0.012, 0.007), c, 0.01)
    .add(capsule(-0.03, 0.05, -0.01, -0.048, 0.105, -0.005, 0.012, 0.007), c, 0.01)
    .displace((x, y, z) => (y > 0.025 ? Math.pow(noise3(x * 50, y * 50, z * 50), 1.6) * 0.016 * Math.min(1, (y - 0.025) / 0.03) : 0))
    .build([-0.08, -0.07, -0.06], [0.08, 0.14, 0.13], 0.0045);
  return { body, head, headAt: [0, 0.58, 0.17], leg: leg(0.25, 0.046, c, '#4a3a30', 0.03), legs: [[-0.055, 0.1], [0.055, 0.1], [-0.055, -0.1], [0.055, -0.1]], legLen: 0.25, tail: null, tailAt: [0, 0, 0], wool: true };
}

function goose(): CreatureParts {
  const w = '#fbfbf8';
  const body = new Sculpt()
    .add(ellipsoid(0, 0.16, -0.01, 0.085, 0.078, 0.13), w)
    .add(ellipsoid(0, 0.19, -0.13, 0.04, 0.035, 0.05), '#f1f1ec', 0.03)
    .add(ellipsoid(0.07, 0.17, -0.02, 0.025, 0.05, 0.09), '#ececea', 0.012)
    .add(ellipsoid(-0.07, 0.17, -0.02, 0.025, 0.05, 0.09), '#ececea', 0.012)
    .add(capsule(0, 0.18, 0.08, 0, 0.3, 0.11, 0.036, 0.026), w, 0.04)
    .build([-0.11, 0.06, -0.19], [0.11, 0.34, 0.16], C * 0.7);
  const head = new Sculpt()
    .add(sphere(0, 0.01, 0, 0.04), w)
    .add(capsule(0, 0.0, 0.03, 0, -0.008, 0.08, 0.018, 0.011), '#f08a24', 0.01)
    .add(sphere(0, 0.018, 0.035, 0.013), '#f08a24', 0.008)
    .build([-0.06, -0.05, -0.05], [0.06, 0.06, 0.11], C * 0.5);
  return { body, head, headAt: [0, 0.31, 0.11], leg: leg(0.1, 0.022, '#f08a24', '#f08a24', 0.012), legs: [[-0.035, 0], [0.035, 0]], legLen: 0.1, tail: null, tailAt: [0, 0, 0] };
}

const makers: Record<string, () => CreatureParts> = { cow, pig, sheep, goat, horse, chicken, duck, rabbit, alpaca, goose, dog: dogParts };
const cache = new Map<string, CreatureParts>();

export function creature(kind: string) {
  let c = cache.get(kind);
  if (!c && makers[kind]) { c = makers[kind](); cache.set(kind, c); }
  return c ?? null;
}

// the farmer's head and torso, sculpted so the face, ears, hair and overalls read as one piece
const people = new Map<string, { head: THREE.BufferGeometry; torso: THREE.BufferGeometry }>();
export function personParts(shirt: string, overall: string) {
  const key = `${shirt}|${overall}`;
  let p = people.get(key);
  if (p) return p;
  const skin = '#f2c49b';
  const face = (x: number, y: number, z: number) => (z > 0.06 && Math.abs(x) > 0.045 && y < -0.005 && y > -0.05 ? '#f0a8a0' : skin);
  const head = new Sculpt()
    .add(ellipsoid(0, 0, 0, 0.11, 0.108, 0.106), face)
    .add(ellipsoid(0, -0.012, 0.104, 0.022, 0.02, 0.02), '#e8a883', 0.012)
    .add(ellipsoid(0.108, -0.005, 0, 0.018, 0.03, 0.022), skin, 0.01)
    .add(ellipsoid(-0.108, -0.005, 0, 0.018, 0.03, 0.022), skin, 0.01)
    .add(ellipsoid(0, 0.028, -0.018, 0.114, 0.094, 0.106), '#6b4020', 0.01)
    .add(ellipsoid(0.03, 0.058, 0.07, 0.05, 0.022, 0.035), '#6b4020', 0.02)
    .carve(ellipsoid(0, -0.052, 0.09, 0.026, 0.006, 0.02), 0.004)
    .build([-0.14, -0.13, -0.14], [0.14, 0.14, 0.14], 0.005);
  const torso = new Sculpt()
    .add(capsule(0, 0.39, 0, 0, 0.49, 0, 0.105, 0.1), (x, y, z) => {
      if (y < 0.415) return overall;
      if (z > 0.05 && Math.abs(x) < 0.062 && y < 0.5) return overall;
      if (z > 0 && Math.abs(Math.abs(x) - 0.05) < 0.013 && y < 0.56) return overall;
      return shirt;
    })
    .add(ellipsoid(0, 0.31, 0, 0.112, 0.07, 0.115), overall, 0.03)
    .build([-0.13, 0.22, -0.13], [0.13, 0.62, 0.13], 0.006);
  p = { head, torso };
  people.set(key, p);
  return p;
}
