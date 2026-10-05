// Sculpted animal parts. Each creature is a body, a head, a leg and a tail, each one smooth
// SDF mesh with its coat painted into vertex colors. The renderer assembles them on pivots so
// heads can graze, legs can walk and tails can swish. Built once per kind and cached.
import * as THREE from 'three';
import { Sculpt, capsule, ellipsoid, noise3, sphere, withDetail } from './sdf';
import { toonMakers } from './toon';
import { toonMakers2 } from './toon2';
import { toonMakers3 } from './toon3';

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
  eye?: [number, number, number, number, number]; // x, y, z on the head, radius, outward yaw
  toon?: boolean; // cartoon style: big friendly eyes instead of realistic ones
  bell?: [number, number, number, number]; // collar center x, y, z and radius, on the body
}

const C = 0.0065; // voxel size used for sculpting

// A jointed leg: muscled upper leg, knee, slim cannon bone, fetlock and hoof.
function leg(len: number, th: number, color: string | ((y: number) => string), hoof: string, hoofH = 0.04) {
  const paint = (_x: number, y: number) => (y < -len + hoofH ? hoof : typeof color === 'string' ? color : color(y));
  const knee = -len * 0.48;
  return new Sculpt()
    .add(capsule(0, 0.01, 0, 0, knee, 0.004, th * 0.64, th * 0.44), paint)
    .add(sphere(0, knee, 0.007, th * 0.47), paint, 0.014)
    .add(capsule(0, knee, 0.006, 0, -len + hoofH, 0.004, th * 0.38, th * 0.34), paint, 0.01)
    .add(sphere(0, -len + hoofH + th * 0.25, 0.006, th * 0.42), paint, 0.012)
    .add(ellipsoid(0, -len + hoofH * 0.45, 0.008, th * 0.48, hoofH * 0.55, th * 0.56), hoof, 0.01)
    .build([-th, -len - 0.01, -th], [th, 0.03, th + 0.02], C * 0.7);
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
  return { eye: [0.058, 0.04, 0.045, 0.016, 0.9], body, head, headAt: [0, 0.41, 0.26], leg: leg(0.2, 0.055, '#f7f5f0', '#3a2e26', 0.035), legs: [[-0.075, 0.15], [0.075, 0.15], [-0.075, -0.15], [0.075, -0.15]], legLen: 0.2, tail, tailAt: [0, 0.42, -0.25] };
}

function sheep(): CreatureParts {
  const wool = (x: number, y: number, z: number) => (noise3(x * 30, y * 30, z * 30) > 0.7 ? '#e6ddcc' : '#f5f0e4');
  const fleece = (x: number, y: number, z: number) => Math.pow(noise3(x * 34, y * 34, z * 34), 1.5) * 0.026 + noise3(x * 90, y * 90, z * 90) * 0.006;
  const body = new Sculpt()
    .add(ellipsoid(0, 0.26, 0, 0.155, 0.135, 0.21), wool)
    .add(sphere(0, 0.3, -0.05, 0.12), wool, 0.06)
    .add(sphere(0, 0.29, 0.1, 0.11), wool, 0.06)
    .displace(fleece)
    .build([-0.2, 0.08, -0.27], [0.2, 0.46, 0.27], C);
  const face = '#2d2927';
  const head = new Sculpt()
    // black Suffolk face with a woolly poll
    .add(capsule(0, 0.02, 0, 0, -0.035, 0.085, 0.045, 0.028), face)
    .add(ellipsoid(0, -0.04, 0.1, 0.028, 0.022, 0.015), '#1c1917', 0.01)
    .add(ellipsoid(0.058, 0.01, -0.005, 0.045, 0.012, 0.02), face, 0.01)
    .add(ellipsoid(-0.058, 0.01, -0.005, 0.045, 0.012, 0.02), face, 0.01)
    .add(sphere(0, 0.05, -0.01, 0.046), '#f5f0e4', 0.02)
    .displace((x, y, z) => (y > 0.03 ? Math.pow(noise3(x * 45, y * 45, z * 45), 1.5) * 0.016 * Math.min(1, (y - 0.03) / 0.03) : 0))
    .build([-0.12, -0.09, -0.08], [0.12, 0.12, 0.13], C * 0.6);
  return { eye: [0.034, 0.012, 0.035, 0.009, 0.85], body, head, headAt: [0, 0.3, 0.2], leg: leg(0.14, 0.036, face, '#1a1715', 0.02), legs: [[-0.055, 0.1], [0.055, 0.1], [-0.055, -0.1], [0.055, -0.1]], legLen: 0.14, tail: null, tailAt: [0, 0, 0], wool: true };
}

function goat(): CreatureParts {
  const c = '#f1ece2';
  const body = new Sculpt()
    // lean Saanen goat: prominent withers and hip bones, narrow barrel
    .add(ellipsoid(0, 0.28, 0, 0.08, 0.085, 0.165), c)
    .add(sphere(0, 0.29, 0.1, 0.078), c, 0.05)
    .add(sphere(0.05, 0.33, -0.12, 0.03), c, 0.03)
    .add(sphere(-0.05, 0.33, -0.12, 0.03), c, 0.03)
    .add(capsule(0, 0.3, 0.1, 0, 0.36, 0.17, 0.048, 0.036), c, 0.04)
    .add(ellipsoid(0, 0.2, -0.07, 0.038, 0.03, 0.04), '#f0c9c0', 0.025)
    .build([-0.11, 0.15, -0.21], [0.11, 0.42, 0.24], C);
  const head = new Sculpt()
    .add(sphere(0, 0.015, 0, 0.045), c)
    .add(capsule(0, 0.01, 0.02, 0, -0.04, 0.1, 0.04, 0.024), c, 0.03)
    .add(ellipsoid(0, -0.045, 0.108, 0.02, 0.016, 0.012), '#9a8676', 0.008)
    .add(capsule(0, -0.06, 0.07, 0, -0.115, 0.06, 0.012, 0.004), '#e3dccd', 0.012)
    .add(ellipsoid(0.058, 0.0, -0.005, 0.045, 0.012, 0.018), c, 0.01)
    .add(ellipsoid(-0.058, 0.0, -0.005, 0.045, 0.012, 0.018), c, 0.01)
    .build([-0.12, -0.13, -0.06], [0.12, 0.08, 0.14], C * 0.6);
  const tail = new Sculpt().add(capsule(0, 0, 0, 0, 0.05, -0.01, 0.013, 0.007), c).build([-0.03, -0.02, -0.04], [0.03, 0.07, 0.02], C * 0.6);
  return { eye: [0.034, 0.02, 0.03, 0.01, 0.85], body, head, headAt: [0, 0.36, 0.17], leg: leg(0.17, 0.04, c, '#5a4a3c', 0.024), legs: [[-0.048, 0.1], [0.048, 0.1], [-0.048, -0.1], [0.048, -0.1]], legLen: 0.17, tail, tailAt: [0, 0.31, -0.16] };
}

function horse(): CreatureParts {
  const c = '#8a5230', hair = '#2a1a12';
  const coat = (x: number, y: number, z: number) => (noise3(x * 20, y * 20, z * 20) > 0.72 ? '#7a4828' : c);
  const body = new Sculpt()
    // bay horse: deep chest, strong hindquarters, arched crest of the neck
    .add(ellipsoid(0, 0.4, 0, 0.1, 0.11, 0.22), coat)
    .add(sphere(0, 0.405, 0.14, 0.105), coat, 0.06)
    .add(ellipsoid(0, 0.415, -0.14, 0.105, 0.11, 0.11), coat, 0.06)
    .add(capsule(0, 0.44, 0.15, 0, 0.59, 0.26, 0.066, 0.045), coat, 0.05)
    .add(capsule(0, 0.5, 0.13, 0, 0.64, 0.23, 0.026, 0.02), hair, 0.02)
    .displace((x, y, z) => (y > 0.5 && z > 0.1 && Math.abs(x) < 0.03 ? noise3(x * 120, y * 50, z * 50) * 0.008 : 0))
    .build([-0.13, 0.26, -0.27], [0.13, 0.69, 0.33], C);
  const blaze = (x: number, _y: number, z: number) => (Math.abs(x) < 0.013 && z > 0.02 && z < 0.13 ? '#f3eee6' : c);
  const head = new Sculpt()
    .add(capsule(0, 0.0, 0, 0, -0.05, 0.13, 0.05, 0.04), blaze)
    .add(sphere(0, -0.012, 0.03, 0.052), blaze, 0.03)
    .add(sphere(0, -0.058, 0.14, 0.044), '#4a3020', 0.03)
    .carve(sphere(0.021, -0.052, 0.183, 0.009))
    .carve(sphere(-0.021, -0.052, 0.183, 0.009))
    .add(capsule(0.03, 0.03, -0.01, 0.035, 0.088, -0.02, 0.013, 0.004), c, 0.01)
    .add(capsule(-0.03, 0.03, -0.01, -0.035, 0.088, -0.02, 0.013, 0.004), c, 0.01)
    .add(capsule(0, 0.055, -0.01, 0, 0.03, 0.055, 0.02, 0.012), hair, 0.01)
    .build([-0.08, -0.11, -0.06], [0.08, 0.11, 0.2], C * 0.6);
  const tail = new Sculpt()
    .add(capsule(0, 0, 0, 0, -0.22, -0.05, 0.032, 0.016), hair)
    .displace((x, y, z) => noise3(x * 80, y * 25, z * 80) * 0.01)
    .build([-0.05, -0.26, -0.09], [0.05, 0.04, 0.04], C * 0.6);
  const sock = (y: number) => (y < -0.23 ? '#efe9df' : c);
  return { eye: [0.042, 0.012, 0.035, 0.012, 0.9], body, head, headAt: [0, 0.61, 0.26], leg: leg(0.3, 0.05, sock, '#2a1d14', 0.04), legs: [[-0.06, 0.16], [0.06, 0.16], [-0.06, -0.16], [0.06, -0.16]], legLen: 0.3, tail, tailAt: [0, 0.47, -0.25] };
}

function chicken(): CreatureParts {
  // red brown hen: darker wings, a fan of tail feathers, lighter breast
  const plume = (_x: number, y: number, z: number) => (z > 0.05 && y < 0.18 ? '#c9743a' : y > 0.2 ? '#a9542a' : '#b8622f');
  const body = new Sculpt()
    .add(ellipsoid(0, 0.16, 0, 0.085, 0.085, 0.105), plume)
    .add(ellipsoid(0, 0.19, 0.06, 0.06, 0.07, 0.06), plume, 0.03)
    .add(ellipsoid(0.075, 0.17, -0.01, 0.026, 0.055, 0.085), '#8e4521', 0.012)
    .add(ellipsoid(-0.075, 0.17, -0.01, 0.026, 0.055, 0.085), '#8e4521', 0.012)
    .add(ellipsoid(0, 0.24, -0.09, 0.02, 0.07, 0.035), '#3b2016', 0.02)
    .add(ellipsoid(0.022, 0.23, -0.085, 0.015, 0.065, 0.03), '#5a2a18', 0.012)
    .add(ellipsoid(-0.022, 0.23, -0.085, 0.015, 0.065, 0.03), '#5a2a18', 0.012)
    .displace((x, y, z) => noise3(x * 110, y * 110, z * 110) * 0.003)
    .build([-0.11, 0.06, -0.14], [0.11, 0.32, 0.14], C * 0.6);
  const head = new Sculpt()
    .add(sphere(0, 0.02, 0.02, 0.045), '#b8622f')
    .add(capsule(0, 0.018, 0.055, 0, 0.008, 0.09, 0.016, 0.002), '#e8b441', 0.006)
    .add(sphere(0, 0.065, 0.0, 0.014), '#d42a22', 0.008)
    .add(sphere(0, 0.074, 0.017, 0.016), '#d42a22', 0.008)
    .add(sphere(0, 0.074, 0.035, 0.015), '#d42a22', 0.008)
    .add(sphere(0, 0.064, 0.05, 0.012), '#d42a22', 0.008)
    .add(ellipsoid(0, -0.012, 0.055, 0.01, 0.018, 0.008), '#d42a22', 0.008)
    .add(ellipsoid(0.038, 0.012, 0.02, 0.008, 0.01, 0.01), '#d42a22', 0.006)
    .add(ellipsoid(-0.038, 0.012, 0.02, 0.008, 0.01, 0.01), '#d42a22', 0.006)
    .build([-0.07, -0.05, -0.05], [0.07, 0.1, 0.11], C * 0.45);
  return { eye: [0.03, 0.028, 0.03, 0.008, 1.0], body, head, headAt: [0, 0.24, 0.07], leg: leg(0.08, 0.017, '#e8b441', '#d9a13a', 0.008), legs: [[-0.03, 0], [0.03, 0]], legLen: 0.08, tail: null, tailAt: [0, 0, 0] };
}

function duck(): CreatureParts {
  // mallard drake: chestnut breast, grey flanks, black tail with a curl, white collar
  const plume = (_x: number, y: number, z: number) => (z > 0.06 ? '#6e3a24' : z < -0.09 ? '#1d1d1d' : y > 0.1 ? '#8c8680' : '#b9b3aa');
  const body = new Sculpt()
    .add(ellipsoid(0, 0.065, 0, 0.078, 0.06, 0.115), plume)
    .add(ellipsoid(0, 0.1, -0.1, 0.035, 0.028, 0.045), '#1d1d1d', 0.03)
    .add(sphere(0, 0.13, -0.13, 0.012), '#1d1d1d', 0.01)
    .add(ellipsoid(0.062, 0.085, -0.01, 0.02, 0.035, 0.08), (_x, _y, z) => (z < -0.04 && z > -0.07 ? '#3657b8' : '#7d766c'), 0.012)
    .add(ellipsoid(-0.062, 0.085, -0.01, 0.02, 0.035, 0.08), (_x, _y, z) => (z < -0.04 && z > -0.07 ? '#3657b8' : '#7d766c'), 0.012)
    .add(capsule(0, 0.09, 0.07, 0, 0.14, 0.085, 0.03, 0.026), (_x, y) => (y < 0.12 ? '#6e3a24' : y < 0.13 ? '#ffffff' : '#1f5e3a'), 0.02)
    .build([-0.1, -0.01, -0.16], [0.1, 0.17, 0.13], C * 0.6);
  const head = new Sculpt()
    .add(sphere(0, 0.012, 0, 0.045), '#1f5e3a')
    .add(ellipsoid(0, -0.004, 0.055, 0.026, 0.01, 0.04), '#d9c23a', 0.012)
    .add(sphere(0, 0.0, 0.092, 0.008), '#2a2a2a', 0.004)
    .build([-0.06, -0.05, -0.06], [0.06, 0.07, 0.11], C * 0.45);
  return { eye: [0.03, 0.02, 0.015, 0.007, 1.0], body, head, headAt: [0, 0.15, 0.085], leg: null, legs: [], legLen: 0, tail: null, tailAt: [0, 0, 0] };
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
  return { eye: [0.03, 0.02, 0.045, 0.011, 0.35], body, head, headAt: [0, 0.24, 0.12], leg: leg(0.13, 0.04, c, cream, 0.03), legs: [[-0.042, 0.08], [0.042, 0.08], [-0.042, -0.08], [0.042, -0.08]], legLen: 0.13, tail, tailAt: [0, 0.19, -0.12] };
}

function rabbit(): CreatureParts {
  const fur = (_x: number, y: number, z: number) => (y < 0.07 || (z > 0.05 && y < 0.1) ? '#efe8de' : noise3(_x * 40, y * 40, z * 40) > 0.6 ? '#a58b72' : '#b89e84');
  const fluff = (x: number, y: number, z: number) => Math.pow(noise3(x * 70, y * 70, z * 70), 2) * 0.008;
  const body = new Sculpt()
    .add(ellipsoid(0, 0.1, -0.01, 0.08, 0.075, 0.1), fur)
    .add(sphere(0.045, 0.085, -0.05, 0.055), fur, 0.04)
    .add(sphere(-0.045, 0.085, -0.05, 0.055), fur, 0.04)
    .add(sphere(0, 0.105, 0.05, 0.06), fur, 0.04)
    .add(ellipsoid(0.03, 0.03, 0.075, 0.018, 0.03, 0.024), fur, 0.02)
    .add(ellipsoid(-0.03, 0.03, 0.075, 0.018, 0.03, 0.024), fur, 0.02)
    .add(sphere(0, 0.12, -0.115, 0.03), '#ffffff', 0.015)
    .displace(fluff)
    .build([-0.12, -0.01, -0.17], [0.12, 0.2, 0.13], 0.005);
  const ear = (sx: number) => ellipsoid(sx * 0.026, 0.09, -0.012, 0.018, 0.062, 0.011);
  const earPaint = (x: number, y: number, z: number) => (z > -0.004 && Math.abs(Math.abs(x) - 0.026) < 0.009 ? '#e8b0b0' : y > 0.14 ? '#5a4636' : '#b09680');
  const head = new Sculpt()
    .add(sphere(0, 0, 0.01, 0.055), fur)
    .add(sphere(0.028, -0.02, 0.042, 0.03), fur, 0.02)
    .add(sphere(-0.028, -0.02, 0.042, 0.03), fur, 0.02)
    .add(sphere(0, -0.008, 0.066, 0.009), '#c98a8a', 0.006)
    .add(ear(1), earPaint, 0.015)
    .add(ear(-1), earPaint, 0.015)
    .build([-0.08, -0.07, -0.06], [0.08, 0.17, 0.1], 0.0042);
  return { eye: [0.034, 0.012, 0.03, 0.011, 0.9], body, head, headAt: [0, 0.17, 0.07], leg: null, legs: [], legLen: 0, tail: null, tailAt: [0, 0, 0] };
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
  return { eye: [0.036, 0.008, 0.045, 0.011, 0.8], body, head, headAt: [0, 0.58, 0.17], leg: leg(0.25, 0.046, c, '#4a3a30', 0.03), legs: [[-0.055, 0.1], [0.055, 0.1], [-0.055, -0.1], [0.055, -0.1]], legLen: 0.25, tail: null, tailAt: [0, 0, 0], wool: true };
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
  return { eye: [0.026, 0.02, 0.012, 0.008, 1.0], body, head, headAt: [0, 0.31, 0.11], leg: leg(0.1, 0.022, '#f08a24', '#f08a24', 0.012), legs: [[-0.035, 0], [0.035, 0]], legLen: 0.1, tail: null, tailAt: [0, 0, 0] };
}

function gobbler(): CreatureParts {
  // bronze gobbler: iridescent dark body, barred wings and a fanned, white tipped tail
  const bronze = (x: number, y: number, z: number) => (noise3(x * 40, y * 40, z * 40) > 0.62 ? '#6a4a2a' : '#3e2a1c');
  const fan = (x: number, y: number, z: number) => {
    const d = Math.hypot(x, y - 0.17, z + 0.1);
    if (d > 0.27) return '#f0e6d2';
    return Math.sin(d * 90) > 0.6 ? '#2a1a10' : '#8a5a32';
  };
  const b = new Sculpt()
    .add(ellipsoid(0, 0.17, 0, 0.1, 0.1, 0.13), bronze)
    .add(ellipsoid(0.085, 0.18, -0.01, 0.028, 0.06, 0.1), (_x, y) => (Math.sin(y * 120) > 0.3 ? '#e8dcc0' : '#4a3222'), 0.012)
    .add(ellipsoid(-0.085, 0.18, -0.01, 0.028, 0.06, 0.1), (_x, y) => (Math.sin(y * 120) > 0.3 ? '#e8dcc0' : '#4a3222'), 0.012)
    .add(capsule(0, 0.2, 0.08, 0, 0.3, 0.1, 0.035, 0.022), bronze, 0.03);
  for (let i = 0; i < 9; i++) {
    const a = -1.2 + (i / 8) * 2.4;
    b.add(ellipsoid(Math.sin(a) * 0.15, 0.2 + Math.cos(a) * 0.16, -0.14, 0.035, 0.13, 0.012), fan, 0.01);
  }
  const body = b.build([-0.3, 0.05, -0.2], [0.3, 0.46, 0.16], C * 0.7);
  const head = new Sculpt()
    .add(sphere(0, 0.012, 0, 0.03), '#9ab8d8')
    .add(capsule(0, 0.008, 0.025, 0, 0.0, 0.055, 0.01, 0.004), '#d8c8a8', 0.004)
    .add(capsule(0.005, 0.02, 0.035, 0.012, -0.03, 0.06, 0.006, 0.004), '#c8202a', 0.004)
    .add(ellipsoid(0, -0.03, 0.01, 0.018, 0.028, 0.016), '#c8202a', 0.012)
    .build([-0.05, -0.07, -0.04], [0.05, 0.05, 0.08], C * 0.4);
  return { eye: [0.022, 0.018, 0.012, 0.006, 1.0], body, head, headAt: [0, 0.31, 0.105], leg: leg(0.08, 0.02, '#b89a8a', '#9a7a6a', 0.01), legs: [[-0.035, 0], [0.035, 0]], legLen: 0.08, tail: null, tailAt: [0, 0, 0] };
}

function donkey(): CreatureParts {
  // grey donkey: pale belly and muzzle, a dark stripe down the back and across the shoulders
  const c = '#8f8a84';
  const coat = (x: number, y: number, z: number) => (y < 0.3 ? '#d9d4cc' : Math.abs(x) < 0.015 && y > 0.4 ? '#3a342e' : Math.abs(z - 0.1) < 0.015 && y > 0.38 ? '#4a443e' : c);
  const body = new Sculpt()
    .add(ellipsoid(0, 0.35, 0, 0.09, 0.1, 0.19), coat)
    .add(sphere(0, 0.36, 0.11, 0.09), coat, 0.06)
    .add(sphere(0, 0.37, -0.11, 0.092), coat, 0.06)
    .add(capsule(0, 0.38, 0.13, 0, 0.5, 0.21, 0.058, 0.045), coat, 0.05)
    .add(capsule(0, 0.44, 0.12, 0, 0.55, 0.19, 0.016, 0.014), '#3a342e', 0.012)
    .build([-0.12, 0.22, -0.23], [0.12, 0.6, 0.28], C);
  const head = new Sculpt()
    .add(capsule(0, 0.0, 0, 0, -0.05, 0.12, 0.052, 0.045), c)
    .add(sphere(0, -0.058, 0.125, 0.046), '#e3ded6', 0.03)
    .carve(sphere(0.02, -0.055, 0.168, 0.009))
    .carve(sphere(-0.02, -0.055, 0.168, 0.009))
    .add(ellipsoid(0.035, 0.08, -0.01, 0.016, 0.07, 0.012), (_x, y) => (y > 0.13 ? '#2a2420' : c), 0.012)
    .add(ellipsoid(-0.035, 0.08, -0.01, 0.016, 0.07, 0.012), (_x, y) => (y > 0.13 ? '#2a2420' : c), 0.012)
    .build([-0.07, -0.11, -0.06], [0.07, 0.17, 0.19], C * 0.6);
  const tail = new Sculpt()
    .add(capsule(0, 0, 0, 0, -0.15, -0.02, 0.012, 0.008), c)
    .add(ellipsoid(0, -0.17, -0.02, 0.018, 0.035, 0.018), '#2a2420', 0.012)
    .build([-0.04, -0.22, -0.05], [0.04, 0.02, 0.03], C * 0.55);
  return { eye: [0.042, 0.012, 0.03, 0.011, 0.9], body, head, headAt: [0, 0.51, 0.22], leg: leg(0.25, 0.046, (y: number) => (y < -0.2 ? '#d9d4cc' : c), '#2a2420', 0.035), legs: [[-0.055, 0.13], [0.055, 0.13], [-0.055, -0.13], [0.055, -0.13]], legLen: 0.25, tail, tailAt: [0, 0.4, -0.2] };
}

function buffalo(): CreatureParts {
  // water buffalo: massive slate grey body, a heavy low head and sparse coarse hair
  const c = (x: number, y: number, z: number) => (noise3(x * 24, y * 24, z * 24) > 0.7 ? '#4a4a4c' : '#343436');
  const body = new Sculpt()
    .add(ellipsoid(0, 0.35, 0, 0.14, 0.14, 0.24), c)
    .add(sphere(0, 0.39, 0.12, 0.13), c, 0.07)
    .add(sphere(0, 0.36, -0.14, 0.12), c, 0.07)
    .add(capsule(0, 0.36, 0.18, 0, 0.35, 0.27, 0.09, 0.075), c, 0.06)
    .build([-0.18, 0.15, -0.3], [0.18, 0.56, 0.35], C);
  const head = new Sculpt()
    .add(sphere(0, 0.02, 0, 0.07), c)
    .add(capsule(0, 0.0, 0.03, 0, -0.05, 0.12, 0.065, 0.055), c, 0.04)
    .add(ellipsoid(0, -0.06, 0.14, 0.058, 0.045, 0.04), '#2a2a2c', 0.03)
    .carve(ellipsoid(0.024, -0.055, 0.178, 0.011, 0.013, 0.012))
    .carve(ellipsoid(-0.024, -0.055, 0.178, 0.011, 0.013, 0.012))
    .add(ellipsoid(0.085, 0.01, -0.01, 0.045, 0.016, 0.028), '#3a3a3c', 0.012)
    .add(ellipsoid(-0.085, 0.01, -0.01, 0.045, 0.016, 0.028), '#3a3a3c', 0.012)
    .build([-0.12, -0.12, -0.08], [0.12, 0.11, 0.2], C * 0.6);
  const tail = new Sculpt().add(capsule(0, 0, 0, 0, -0.2, 0.01, 0.011, 0.008), '#343436').add(ellipsoid(0, -0.21, 0.01, 0.018, 0.03, 0.018), '#1a1a1a', 0.012).build([-0.04, -0.26, -0.04], [0.04, 0.02, 0.05], C * 0.55);
  return { eye: [0.06, 0.03, 0.04, 0.013, 0.95], body, head, headAt: [0, 0.37, 0.3], leg: leg(0.2, 0.065, '#303032', '#1a1a1a', 0.035), legs: [[-0.085, 0.16], [0.085, 0.16], [-0.085, -0.16], [0.085, -0.16]], legLen: 0.2, tail, tailAt: [0, 0.44, -0.26] };
}

function peacock(): CreatureParts {
  // blue peacock with a long green train covered in eye spots
  const blue = '#1f4fb8';
  const train = (x: number, y: number, z: number) => {
    const u = x * 22, v = z * 14;
    const fx = u - Math.round(u), fz = v - Math.round(v);
    const d = Math.hypot(fx, fz);
    return d < 0.14 ? '#1a2f8a' : d < 0.24 ? '#2a9a9a' : d < 0.32 ? '#e8c43a' : noise3(x * 30, y * 30, z * 30) > 0.5 ? '#2f7a3a' : '#3f8a3a';
  };
  const body = new Sculpt()
    .add(ellipsoid(0, 0.17, 0, 0.065, 0.07, 0.1), (_x, _y, z) => (z < -0.05 ? '#8a7a5a' : blue))
    .add(capsule(0, 0.2, 0.06, 0, 0.33, 0.085, 0.03, 0.02), blue, 0.03)
    .add(ellipsoid(0, 0.12, -0.3, 0.09, 0.025, 0.24), train, 0.04)
    .build([-0.12, 0.06, -0.56], [0.12, 0.38, 0.13], C * 0.7);
  const head = new Sculpt()
    .add(sphere(0, 0.012, 0, 0.026), (_x, y, z) => (Math.abs(y - 0.015) < 0.006 && z > 0.005 ? '#ffffff' : blue))
    .add(capsule(0, 0.01, 0.02, 0, 0.005, 0.045, 0.008, 0.003), '#8a8a8a', 0.004)
    .add(capsule(0, 0.03, -0.005, 0, 0.065, -0.01, 0.003, 0.002), '#2a4a9a', 0.003)
    .add(sphere(0, 0.068, -0.01, 0.007), '#2a9a9a', 0.004)
    .add(capsule(0.012, 0.03, -0.005, 0.02, 0.062, -0.015, 0.003, 0.002), '#2a4a9a', 0.003)
    .add(sphere(0.02, 0.064, -0.015, 0.006), '#2a9a9a', 0.004)
    .add(capsule(-0.012, 0.03, -0.005, -0.02, 0.062, -0.015, 0.003, 0.002), '#2a4a9a', 0.003)
    .add(sphere(-0.02, 0.064, -0.015, 0.006), '#2a9a9a', 0.004)
    .build([-0.04, -0.03, -0.04], [0.04, 0.09, 0.06], C * 0.35);
  return { eye: [0.018, 0.016, 0.008, 0.005, 1.0], body, head, headAt: [0, 0.34, 0.09], leg: leg(0.12, 0.018, '#8a8a8a', '#6a6a6a', 0.01), legs: [[-0.028, 0], [0.028, 0]], legLen: 0.12, tail: null, tailAt: [0, 0, 0] };
}

function ostrich(): CreatureParts {
  // big fluffy black body with white wing and tail plumes, bare pinkish neck and thighs
  const plume = (x: number, y: number, z: number) => (z < -0.1 || (Math.abs(x) > 0.1 && y < 0.5) ? '#f2eee6' : '#1c1a18');
  const body = new Sculpt()
    .add(ellipsoid(0, 0.52, 0, 0.13, 0.11, 0.17), plume)
    .add(ellipsoid(0, 0.55, -0.15, 0.09, 0.07, 0.07), '#f2eee6', 0.05)
    .add(ellipsoid(0.11, 0.5, -0.02, 0.04, 0.07, 0.12), '#f2eee6', 0.03)
    .add(ellipsoid(-0.11, 0.5, -0.02, 0.04, 0.07, 0.12), '#f2eee6', 0.03)
    .add(capsule(0, 0.58, 0.12, 0, 0.93, 0.17, 0.035, 0.022), '#c9a8a0', 0.04)
    .displace((x, y, z) => (y < 0.62 && z < 0.14 ? Math.pow(noise3(x * 50, y * 50, z * 50), 1.5) * 0.02 : 0))
    .build([-0.18, 0.36, -0.26], [0.18, 0.98, 0.22], C);
  const head = new Sculpt()
    .add(sphere(0, 0.01, 0, 0.032), '#b89a92')
    .add(ellipsoid(0, 0.0, 0.035, 0.018, 0.009, 0.03), '#8a7a6a', 0.008)
    .build([-0.05, -0.04, -0.04], [0.05, 0.05, 0.08], C * 0.4);
  return { eye: [0.024, 0.016, 0.012, 0.009, 1.0], body, head, headAt: [0, 0.95, 0.17], leg: leg(0.44, 0.045, (y: number) => (y > -0.12 ? '#d8b4aa' : '#b8968c'), '#8a7064', 0.03), legs: [[-0.05, 0], [0.05, 0]], legLen: 0.44, tail: null, tailAt: [0, 0, 0] };
}

function quail(): CreatureParts {
  // plump little brown quail with scaly speckles and a curled head plume
  const speck = (x: number, y: number, z: number) => (noise3(x * 90, y * 90, z * 90) > 0.62 ? '#e8d8b8' : noise3(x * 30, y * 30, z * 30) > 0.55 ? '#5a3e26' : '#8a6a44');
  const body = new Sculpt()
    .add(ellipsoid(0, 0.075, 0, 0.055, 0.05, 0.07), speck)
    .add(ellipsoid(0, 0.085, 0.045, 0.04, 0.04, 0.035), (_x, y) => (y < 0.08 ? '#c8a878' : '#8a6a44'), 0.02)
    .add(ellipsoid(0, 0.09, -0.06, 0.03, 0.02, 0.03), '#5a3e26', 0.02)
    .build([-0.07, 0.01, -0.1], [0.07, 0.14, 0.09], 0.0035);
  const head = new Sculpt()
    .add(sphere(0, 0.01, 0, 0.026), (_x, y, z) => (z > 0.012 && y < 0.005 ? '#2a1e14' : Math.abs(y - 0.012) < 0.004 ? '#f2ead8' : '#6a4a2a'))
    .add(capsule(0, 0.005, 0.02, 0, 0.0, 0.036, 0.007, 0.002), '#3a3a3a', 0.003)
    .add(capsule(0, 0.03, 0.005, 0, 0.05, 0.02, 0.004, 0.007), '#2a1e14', 0.003)
    .build([-0.04, -0.03, -0.03], [0.04, 0.07, 0.05], 0.0025);
  return { eye: [0.017, 0.014, 0.012, 0.005, 1.0], body, head, headAt: [0, 0.12, 0.05], leg: leg(0.035, 0.01, '#c8a080', '#a88060', 0.006), legs: [[-0.018, 0], [0.018, 0]], legLen: 0.035, tail: null, tailAt: [0, 0, 0] };
}

function yak(): CreatureParts {
  // shaggy dark yak: long hair skirt hanging to the knees, a hump over the shoulders
  const hair = (x: number, y: number, z: number) => (noise3(x * 30, y * 10, z * 30) > 0.6 ? '#3a2a1e' : '#241a12');
  const shag = (x: number, y: number, z: number) => (y < 0.34 ? Math.pow(noise3(x * 60, y * 12, z * 60), 1.4) * 0.03 * Math.min(1, (0.34 - y) / 0.06) : noise3(x * 50, y * 50, z * 50) * 0.008);
  const body = new Sculpt()
    .add(ellipsoid(0, 0.36, 0, 0.13, 0.13, 0.22), hair)
    .add(sphere(0, 0.44, 0.1, 0.11), hair, 0.07)
    .add(sphere(0, 0.36, -0.13, 0.11), hair, 0.07)
    .add(ellipsoid(0, 0.26, 0, 0.14, 0.07, 0.2), hair, 0.06)
    .add(capsule(0, 0.38, 0.17, 0, 0.36, 0.25, 0.085, 0.07), hair, 0.06)
    .displace(shag)
    .build([-0.19, 0.15, -0.28], [0.19, 0.58, 0.33], C);
  const head = new Sculpt()
    .add(sphere(0, 0.02, 0, 0.065), '#2a1e16')
    .add(capsule(0, 0.0, 0.03, 0, -0.045, 0.11, 0.06, 0.05), '#2a1e16', 0.04)
    .add(ellipsoid(0, -0.055, 0.13, 0.052, 0.04, 0.035), '#d8cfc0', 0.03)
    .carve(ellipsoid(0.02, -0.05, 0.165, 0.009, 0.012, 0.01))
    .carve(ellipsoid(-0.02, -0.05, 0.165, 0.009, 0.012, 0.01))
    .add(ellipsoid(0.075, 0.015, -0.01, 0.035, 0.014, 0.022), '#2a1e16', 0.012)
    .add(ellipsoid(-0.075, 0.015, -0.01, 0.035, 0.014, 0.022), '#2a1e16', 0.012)
    .displace((x, y, z) => (y > 0.03 ? noise3(x * 60, y * 60, z * 60) * 0.012 : 0))
    .build([-0.11, -0.11, -0.08], [0.11, 0.12, 0.19], C * 0.6);
  const tail = new Sculpt().add(capsule(0, 0, 0, 0, -0.18, 0.02, 0.02, 0.03), '#241a12').displace((x, y, z) => noise3(x * 80, y * 30, z * 80) * 0.012).build([-0.06, -0.24, -0.05], [0.06, 0.03, 0.07], C * 0.6);
  return { eye: [0.055, 0.03, 0.035, 0.012, 0.95], body, head, headAt: [0, 0.37, 0.28], leg: leg(0.18, 0.058, '#241a12', '#141008', 0.03), legs: [[-0.08, 0.14], [0.08, 0.14], [-0.08, -0.14], [0.08, -0.14]], legLen: 0.18, tail, tailAt: [0, 0.44, -0.24] };
}

function camel(): CreatureParts {
  // one humped dromedary: sandy coat, long curved neck and knobbly long legs
  const c = (x: number, y: number, z: number) => (noise3(x * 18, y * 18, z * 18) > 0.66 ? '#b89060' : '#c9a270');
  const body = new Sculpt()
    .add(ellipsoid(0, 0.55, 0, 0.1, 0.1, 0.2), c)
    .add(ellipsoid(0, 0.67, -0.01, 0.075, 0.09, 0.1), c, 0.06)
    .add(sphere(0, 0.54, 0.13, 0.09), c, 0.05)
    .add(capsule(0, 0.56, 0.17, 0, 0.5, 0.28, 0.06, 0.05), c, 0.05)
    .add(capsule(0, 0.5, 0.28, 0, 0.72, 0.34, 0.05, 0.042), c, 0.04)
    .build([-0.13, 0.38, -0.25], [0.13, 0.8, 0.4], C);
  const head = new Sculpt()
    .add(capsule(0, 0.0, 0, 0, -0.02, 0.1, 0.045, 0.036), c)
    .add(ellipsoid(0, -0.03, 0.105, 0.035, 0.028, 0.03), '#a88050', 0.02)
    .add(ellipsoid(0.04, 0.03, -0.01, 0.012, 0.018, 0.01), c, 0.008)
    .add(ellipsoid(-0.04, 0.03, -0.01, 0.012, 0.018, 0.01), c, 0.008)
    .build([-0.07, -0.07, -0.05], [0.07, 0.07, 0.15], C * 0.55);
  const tail = new Sculpt().add(capsule(0, 0, 0, 0, -0.15, -0.01, 0.01, 0.006), c).add(ellipsoid(0, -0.16, -0.01, 0.014, 0.025, 0.014), '#5a3e26', 0.01).build([-0.03, -0.2, -0.04], [0.03, 0.02, 0.03], C * 0.5);
  return { eye: [0.036, 0.018, 0.035, 0.01, 0.9], body, head, headAt: [0, 0.74, 0.35], leg: leg(0.46, 0.04, '#c9a270', '#6a5038', 0.03), legs: [[-0.06, 0.14], [0.06, 0.14], [-0.06, -0.14], [0.06, -0.14]], legLen: 0.46, tail, tailAt: [0, 0.6, -0.2] };
}


// Art style: the animals always use the cartoon sculpts (see toon.ts); the realistic option was retired.
export type ArtStyle = 'real' | 'toon';
export function artStyle(): ArtStyle {
  return 'toon';
}

const makers: Record<string, () => CreatureParts> = { quail, yak, camel, gobbler, donkey, buffalo, peacock, ostrich, cow, sheep, goat, horse, chicken, duck, rabbit, alpaca, goose, dog: dogParts };
const cache = new Map<string, CreatureParts>();

// Two meshes per kind: lod 0 is the close up sculpt, lod 1 a much lighter copy for animals seen
// from afar. Both come from the same sculpt, only the voxel size differs.
export const LOD_DETAIL = [1.55, 3];
export function creature(kind: string, lod = 1) {
  const key = `${kind}|${lod}`;
  let c = cache.get(key);
  // kinds that only exist as cartoons (the cat) are used in both styles
  const toon = toonMakers[kind] ?? toonMakers2[kind] ?? toonMakers3[kind];
  const make = (artStyle() === 'toon' && toon) || makers[kind] || toon;
  if (!c && make) { c = withDetail(LOD_DETAIL[lod], make); cache.set(key, c); }
  return c ?? null;
}
export const hasCreature = (kind: string, lod: number) => cache.has(`${kind}|${lod}`);

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
  // plaid flannel shirt and faded denim overalls
  const sc = new THREE.Color(shirt), dk = '#' + sc.clone().multiplyScalar(0.55).getHexString(), lt = '#' + sc.clone().lerp(new THREE.Color('#ffffff'), 0.25).getHexString();
  const plaid = (x: number, y: number) => {
    const a = Math.sin(x * 160) > 0.55, b = Math.sin(y * 160) > 0.55;
    return a && b ? dk : a || b ? shirt : lt;
  };
  const oc = new THREE.Color(overall);
  const denim = (x: number, y: number, z: number) => '#' + oc.clone().multiplyScalar(0.85 + noise3(x * 80, y * 200, z * 80) * 0.3).getHexString();
  const torso = new Sculpt()
    .add(capsule(0, 0.39, 0, 0, 0.49, 0, 0.105, 0.1), (x, y, z) => {
      if (y < 0.415) return denim(x, y, z);
      if (z > 0.05 && Math.abs(x) < 0.062 && y < 0.5) return denim(x, y, z);
      if (z > 0 && Math.abs(Math.abs(x) - 0.05) < 0.013 && y < 0.56) return denim(x, y, z);
      return plaid(x, y);
    })
    .add(ellipsoid(0, 0.31, 0, 0.112, 0.07, 0.115), denim, 0.03)
    .build([-0.13, 0.22, -0.13], [0.13, 0.62, 0.13], 0.006);
  p = { head, torso };
  people.set(key, p);
  return p;
}
