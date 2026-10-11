// The height of the highest surface of some meshes over a spot on the ground: where a ray dropped
// from the sky would land. The farm's Blender buildings are tens of thousands of triangles each,
// and a plain raycast tests every one of them (5 to 15 ms a drop on a desktop, several times that
// on a phone: a hitch each time a bird looks for a roof to sit on). So each geometry gets a grid
// over its own ground plan the first time something lands on it, listing the triangles over each
// cell, and a drop tests only the few under the spot.
import * as THREE from 'three';

interface Grid {
  x0: number; z0: number; cs: number; nx: number; nz: number;
  // the triangles over cell c are tris[start[c]] up to tris[start[c + 1]]
  start: Uint32Array; tris: Uint32Array;
  pos: Float32Array; idx: Uint32Array;
}
const grids = new WeakMap<THREE.BufferGeometry, Grid | null>();

function gridOf(g: THREE.BufferGeometry): Grid | null {
  const had = grids.get(g);
  if (had !== undefined) return had;
  let grid: Grid | null = null;
  const p = g.getAttribute('position');
  if (p && p.itemSize === 3) {
    // plain floats and indices, as they are when they are so already (Draco gives them so), a copy
    // if not: one kind of array each keeps the loops below fast
    const plain = !(p as THREE.InterleavedBufferAttribute).isInterleavedBufferAttribute && !p.normalized && p.array instanceof Float32Array;
    let pos = p.array as Float32Array;
    if (!plain) {
      pos = new Float32Array(p.count * 3);
      for (let i = 0; i < p.count; i++) { pos[i * 3] = p.getX(i); pos[i * 3 + 1] = p.getY(i); pos[i * 3 + 2] = p.getZ(i); }
    }
    const ia = g.index?.array;
    let idx: Uint32Array;
    if (ia instanceof Uint32Array) idx = ia;
    else if (ia) idx = Uint32Array.from(ia);
    else { idx = new Uint32Array(p.count - p.count % 3); for (let i = 0; i < idx.length; i++) idx[i] = i; }
    const nt = Math.floor(idx.length / 3);
    let x0 = Infinity, z0 = Infinity, x1 = -Infinity, z1 = -Infinity;
    for (let i = 0; i < p.count; i++) {
      const x = pos[i * 3], z = pos[i * 3 + 2];
      if (x < x0) x0 = x; if (x > x1) x1 = x;
      if (z < z0) z0 = z; if (z > z1) z1 = z;
    }
    if (nt > 0 && x1 >= x0 && z1 >= z0) {
      // cells for some sixteen triangles each, sixty four a side at most
      const n = Math.min(64, Math.max(1, Math.ceil(Math.sqrt(nt / 16))));
      const cs = Math.max(x1 - x0, z1 - z0, 1e-6) / n;
      const nx = Math.min(n, Math.max(1, Math.ceil((x1 - x0) / cs))), nz = Math.min(n, Math.max(1, Math.ceil((z1 - z0) / cs)));
      // two rounds: the cells under each triangle and how many triangles over each cell, then which
      const box = new Uint8Array(nt * 4), start = new Uint32Array(nx * nz + 1);
      for (let t = 0; t < nt; t++) {
        const a = idx[t * 3] * 3, b = idx[t * 3 + 1] * 3, c = idx[t * 3 + 2] * 3;
        const ax = pos[a], az = pos[a + 2], bx = pos[b], bz = pos[b + 2], cx = pos[c], cz = pos[c + 2];
        const i0 = Math.max(0, Math.floor((Math.min(ax, bx, cx) - x0) / cs)), i1 = Math.min(nx - 1, Math.floor((Math.max(ax, bx, cx) - x0) / cs));
        const j0 = Math.max(0, Math.floor((Math.min(az, bz, cz) - z0) / cs)), j1 = Math.min(nz - 1, Math.floor((Math.max(az, bz, cz) - z0) / cs));
        box[t * 4] = i0; box[t * 4 + 1] = i1; box[t * 4 + 2] = j0; box[t * 4 + 3] = j1;
        for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) start[j * nx + i + 1]++;
      }
      for (let c = 0; c < nx * nz; c++) start[c + 1] += start[c];
      const tris = new Uint32Array(start[nx * nz]), fill = start.slice(0, nx * nz);
      for (let t = 0; t < nt; t++) {
        for (let j = box[t * 4 + 2]; j <= box[t * 4 + 3]; j++) for (let i = box[t * 4]; i <= box[t * 4 + 1]; i++) tris[fill[j * nx + i]++] = t;
      }
      grid = { x0, z0, cs, nx, nz, start, tris, pos, idx };
    }
  }
  grids.set(g, grid);
  return grid;
}

// the highest of a grid's triangles over a spot of its own plan (-Infinity: none)
function topOf(gr: Grid, px: number, pz: number) {
  const fx = (px - gr.x0) / gr.cs, fz = (pz - gr.z0) / gr.cs;
  if (fx < -1e-6 || fz < -1e-6 || fx > gr.nx + 1e-6 || fz > gr.nz + 1e-6) return -Infinity;
  const i = Math.min(gr.nx - 1, Math.max(0, Math.floor(fx))), j = Math.min(gr.nz - 1, Math.max(0, Math.floor(fz)));
  const { pos, idx, tris } = gr, c = j * gr.nx + i;
  let best = -Infinity;
  for (let k = gr.start[c], e = gr.start[c + 1]; k < e; k++) {
    const t = tris[k] * 3, a = idx[t] * 3, b = idx[t + 1] * 3, cc = idx[t + 2] * 3;
    const ax = pos[a], az = pos[a + 2], bx = pos[b], bz = pos[b + 2], cx = pos[cc], cz = pos[cc + 2];
    const d = (bz - cz) * (ax - cx) + (cx - bx) * (az - cz);
    if (d === 0) continue; // a wall: seen edge on from above
    const u = ((bz - cz) * (px - cx) + (cx - bx) * (pz - cz)) / d;
    const v = ((cz - az) * (px - cx) + (ax - cx) * (pz - cz)) / d;
    if (u < -1e-7 || v < -1e-7 || u + v > 1 + 1e-7) continue;
    const y = u * pos[a + 1] + v * pos[b + 1] + (1 - u - v) * pos[cc + 1];
    if (y > best) best = y;
  }
  return best;
}

const inv = new THREE.Matrix4(), lp = new THREE.Vector3(), ld = new THREE.Vector3();
const rayO = new THREE.Vector3(), rayD = new THREE.Vector3(0, -1, 0), hits: THREE.Intersection[] = [];
let slow: THREE.Raycaster | null = null;

// The highest point of the meshes (their world matrices up to date) over (x, z) in the world, or
// null when none is there. A mesh that stands tilted, is instanced or bends is left to a plain ray.
export function dropOnto(meshes: THREE.Mesh[], x: number, z: number): number | null {
  let best = -Infinity;
  for (let i = 0; i < meshes.length; i++) {
    const m = meshes[i], g = m.geometry;
    const bent = (m as THREE.InstancedMesh).isInstancedMesh || (m as THREE.SkinnedMesh).isSkinnedMesh || Object.keys(g.morphAttributes).length > 0;
    let gr: Grid | null = null;
    if (!bent) {
      inv.copy(m.matrixWorld).invert();
      ld.set(0, -1, 0).transformDirection(inv);
      if (Math.abs(ld.x) < 1e-5 && Math.abs(ld.z) < 1e-5 && ld.y < 0) gr = gridOf(g);
    }
    if (gr) {
      lp.set(x, 0, z).applyMatrix4(inv);
      const y = topOf(gr, lp.x, lp.z);
      if (y === -Infinity) continue;
      const w = lp.set(lp.x, y, lp.z).applyMatrix4(m.matrixWorld).y;
      if (w > best) best = w;
      continue;
    }
    // (the meshes given are the ones to try, whatever their layers)
    if (!slow) { slow = new THREE.Raycaster(); slow.layers.enableAll(); }
    slow.set(rayO.set(x, 30, z), rayD);
    hits.length = 0;
    slow.intersectObject(m, false, hits);
    if (hits.length && hits[0].point.y > best) best = hits[0].point.y;
  }
  hits.length = 0;
  return best === -Infinity ? null : best;
}
