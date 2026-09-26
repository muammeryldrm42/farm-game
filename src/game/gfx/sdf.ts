// Sculpting with signed distance fields. Shapes are smooth unions of spheres, ellipsoids and
// tapered capsules, meshed once with naive surface nets. This gives soft, seamless, organic
// forms (a cow's body flowing into its neck, a pig's snout growing out of its face) that plain
// primitives cannot, and it all happens in code at load time.
import * as THREE from 'three';

export type Dist = (x: number, y: number, z: number) => number;
type Paint = string | ((x: number, y: number, z: number) => string);

export const sphere = (cx: number, cy: number, cz: number, r: number): Dist =>
  (x, y, z) => Math.hypot(x - cx, y - cy, z - cz) - r;

export const ellipsoid = (cx: number, cy: number, cz: number, rx: number, ry: number, rz: number): Dist =>
  (x, y, z) => {
    const px = (x - cx) / rx, py = (y - cy) / ry, pz = (z - cz) / rz;
    const k0 = Math.hypot(px, py, pz);
    const k1 = Math.hypot(px / rx, py / ry, pz / rz);
    return k1 === 0 ? -Math.min(rx, ry, rz) : (k0 * (k0 - 1)) / k1;
  };

// capsule from a to b whose radius tapers from ra to rb
export const capsule = (ax: number, ay: number, az: number, bx: number, by: number, bz: number, ra: number, rb = ra): Dist => {
  const dx = bx - ax, dy = by - ay, dz = bz - az;
  const dd = dx * dx + dy * dy + dz * dz;
  return (x, y, z) => {
    const px = x - ax, py = y - ay, pz = z - az;
    const t = Math.max(0, Math.min(1, (px * dx + py * dy + pz * dz) / dd));
    return Math.hypot(px - dx * t, py - dy * t, pz - dz * t) - (ra + (rb - ra) * t);
  };
};

// smooth minimum: blends two shapes with a fillet of size k
function smin(a: number, b: number, k: number) {
  if (k <= 0) return Math.min(a, b);
  const h = Math.max(k - Math.abs(a - b), 0) / k;
  return Math.min(a, b) - h * h * k * 0.25;
}

// cheap smooth 3D value noise, for wool curls and coat patterns
function hash3(x: number, y: number, z: number) {
  let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul(z | 0, 1442695041);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
export function noise3(x: number, y: number, z: number) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
  const fx = x - xi, fy = y - yi, fz = z - zi;
  const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy), w = fz * fz * (3 - 2 * fz);
  const l = (a: number, b: number, t: number) => a + (b - a) * t;
  const c = (i: number, j: number, k: number) => hash3(xi + i, yi + j, zi + k);
  return l(l(l(c(0, 0, 0), c(1, 0, 0), u), l(c(0, 1, 0), c(1, 1, 0), u), v), l(l(c(0, 0, 1), c(1, 0, 1), u), l(c(0, 1, 1), c(1, 1, 1), u), v), w);
}

interface Part { d: Dist; paint: Paint; k: number; sub: boolean }

export class Sculpt {
  private parts: Part[] = [];
  private bump: ((x: number, y: number, z: number) => number) | null = null;
  // strength of the fine fur or skin mottling painted into the colors
  grain = 0.07;

  // add a shape blended into what is already there with fillet size k
  add(d: Dist, paint: Paint, k = 0.02) { this.parts.push({ d, paint, k, sub: false }); return this; }
  // carve a shape away (nostrils, mouths)
  carve(d: Dist, k = 0.005) { this.parts.push({ d, paint: '#000000', k, sub: true }); return this; }
  // displace the surface outward by a small amount (wool, bark)
  displace(f: (x: number, y: number, z: number) => number) { this.bump = f; return this; }

  field: Dist = (x, y, z) => {
    let d = Infinity;
    for (const p of this.parts) {
      const v = p.d(x, y, z);
      if (p.sub) {
        const h = Math.max(p.k - Math.abs(-v - d), 0) / Math.max(p.k, 1e-6);
        d = Math.max(d, -v) + h * h * p.k * 0.25;
      } else d = d === Infinity ? v : smin(d, v, p.k);
    }
    return this.bump ? d - this.bump(x, y, z) : d;
  };

  private color(x: number, y: number, z: number, out: THREE.Color) {
    let best = Infinity, paint: Paint = '#ffffff';
    for (const p of this.parts) {
      if (p.sub) continue;
      const v = p.d(x, y, z);
      if (v < best) { best = v; paint = p.paint; }
    }
    out.set(typeof paint === 'string' ? paint : paint(x, y, z));
  }

  // mesh the surface inside the box [min, max] with cubes of size `cell`
  build(min: [number, number, number], max: [number, number, number], cell: number) {
    const nx = Math.ceil((max[0] - min[0]) / cell) + 1;
    const ny = Math.ceil((max[1] - min[1]) / cell) + 1;
    const nz = Math.ceil((max[2] - min[2]) / cell) + 1;
    const f = new Float32Array(nx * ny * nz);
    const idx = (i: number, j: number, k: number) => i + nx * (j + ny * k);
    for (let k = 0; k < nz; k++) for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
      f[idx(i, j, k)] = this.field(min[0] + i * cell, min[1] + j * cell, min[2] + k * cell);
    }
    // one vertex per cell that the surface passes through, at the mean of its edge crossings
    const cellVert = new Int32Array(nx * ny * nz).fill(-1);
    const pos: number[] = [];
    const corners = [[0, 0, 0], [1, 0, 0], [0, 1, 0], [1, 1, 0], [0, 0, 1], [1, 0, 1], [0, 1, 1], [1, 1, 1]];
    const edges = [[0, 1], [2, 3], [4, 5], [6, 7], [0, 2], [1, 3], [4, 6], [5, 7], [0, 4], [1, 5], [2, 6], [3, 7]];
    const cv = new Float32Array(8);
    for (let k = 0; k < nz - 1; k++) for (let j = 0; j < ny - 1; j++) for (let i = 0; i < nx - 1; i++) {
      let mask = 0;
      for (let c = 0; c < 8; c++) {
        const [a, b, e] = corners[c];
        cv[c] = f[idx(i + a, j + b, k + e)];
        if (cv[c] < 0) mask |= 1 << c;
      }
      if (mask === 0 || mask === 255) continue;
      let sx = 0, sy = 0, sz = 0, n = 0;
      for (const [a, b] of edges) {
        if ((cv[a] < 0) === (cv[b] < 0)) continue;
        const t = cv[a] / (cv[a] - cv[b]);
        const ca = corners[a], cb = corners[b];
        sx += ca[0] + (cb[0] - ca[0]) * t; sy += ca[1] + (cb[1] - ca[1]) * t; sz += ca[2] + (cb[2] - ca[2]) * t;
        n++;
      }
      cellVert[idx(i, j, k)] = pos.length / 3;
      pos.push(min[0] + (i + sx / n) * cell, min[1] + (j + sy / n) * cell, min[2] + (k + sz / n) * cell);
    }
    // a quad around every grid edge the surface crosses
    const tris: number[] = [];
    const quad = (a: number, b: number, c: number, d: number) => {
      if (a < 0 || b < 0 || c < 0 || d < 0) return;
      tris.push(a, b, c, a, c, d);
    };
    for (let k = 0; k < nz; k++) for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
      const inside = f[idx(i, j, k)] < 0;
      if (i < nx - 1 && j > 0 && k > 0 && inside !== (f[idx(i + 1, j, k)] < 0)) {
        quad(cellVert[idx(i, j - 1, k - 1)], cellVert[idx(i, j, k - 1)], cellVert[idx(i, j, k)], cellVert[idx(i, j - 1, k)]);
      }
      if (j < ny - 1 && i > 0 && k > 0 && inside !== (f[idx(i, j + 1, k)] < 0)) {
        quad(cellVert[idx(i - 1, j, k - 1)], cellVert[idx(i, j, k - 1)], cellVert[idx(i, j, k)], cellVert[idx(i - 1, j, k)]);
      }
      if (k < nz - 1 && i > 0 && j > 0 && inside !== (f[idx(i, j, k + 1)] < 0)) {
        quad(cellVert[idx(i - 1, j - 1, k)], cellVert[idx(i, j - 1, k)], cellVert[idx(i, j, k)], cellVert[idx(i - 1, j, k)]);
      }
    }
    // normals from the field gradient; triangles turned to face outward
    const nv = pos.length / 3;
    const nor = new Float32Array(nv * 3), col = new Float32Array(nv * 3);
    const e = cell * 0.5, c = new THREE.Color();
    for (let v = 0; v < nv; v++) {
      const x = pos[v * 3], y = pos[v * 3 + 1], z = pos[v * 3 + 2];
      let gx = this.field(x + e, y, z) - this.field(x - e, y, z);
      let gy = this.field(x, y + e, z) - this.field(x, y - e, z);
      let gz = this.field(x, y, z + e) - this.field(x, y, z - e);
      const l = Math.hypot(gx, gy, gz) || 1;
      gx /= l; gy /= l; gz /= l;
      nor[v * 3] = gx; nor[v * 3 + 1] = gy; nor[v * 3 + 2] = gz;
      this.color(x, y, z, c);
      // baked ambient occlusion: creases and the undersides between shapes get darker, which
      // reads as depth and makes the soft forms feel solid
      const probe = cell * 4;
      const open = Math.max(0, Math.min(1, this.field(x + gx * probe, y + gy * probe, z + gz * probe) / probe));
      const under = 0.82 + 0.18 * (gy * 0.5 + 0.5);
      const mottle = 1 - this.grain + this.grain * 2 * noise3(x * 55, y * 55, z * 55);
      const k = (0.62 + 0.38 * open) * under * mottle;
      col[v * 3] = c.r * k; col[v * 3 + 1] = c.g * k; col[v * 3 + 2] = c.b * k;
    }
    for (let t = 0; t < tris.length; t += 3) {
      const a = tris[t], b = tris[t + 1], d = tris[t + 2];
      const ux = pos[b * 3] - pos[a * 3], uy = pos[b * 3 + 1] - pos[a * 3 + 1], uz = pos[b * 3 + 2] - pos[a * 3 + 2];
      const wx = pos[d * 3] - pos[a * 3], wy = pos[d * 3 + 1] - pos[a * 3 + 1], wz = pos[d * 3 + 2] - pos[a * 3 + 2];
      const fx = uy * wz - uz * wy, fy = uz * wx - ux * wz, fz = ux * wy - uy * wx;
      if (fx * nor[a * 3] + fy * nor[a * 3 + 1] + fz * nor[a * 3 + 2] < 0) { tris[t + 1] = d; tris[t + 2] = b; }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    g.setIndex(tris);
    g.computeBoundingSphere();
    return g;
  }
}

export const SCULPT_MAT = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.62, metalness: 0 });
export const WOOL_MAT = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, metalness: 0 });
