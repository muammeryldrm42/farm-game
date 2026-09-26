// Talons Farm - real time 3D renderer built on three.js.
// Every model is built from low poly primitives, no asset files needed.
import * as THREE from 'three';
import { ANIMAL, BUILDING, CROP, ITEMS, type BuildingDef, type CropDef } from './data';
import {
  CHUNK, GRID, NCH, boatState, canFulfill, chunkState, penInfo, plotProgress, prodInfo, treeInfo,
  type FarmObject, type GameStore,
} from './state';

export const ZU = 1 / 40; // converts the old pixel heights used by effects into world units

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export function hash(x: number, y: number, s = 0) {
  let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul(s | 0, 1442695041);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

export function nightFactor(now: number) {
  const CYCLE = 16 * 60 * 1000;
  const p = (now % CYCLE) / CYCLE;
  const c = Math.cos(p * Math.PI * 2);
  const night = clamp((-c - 0.3) / 0.5, 0, 1);
  const dusk = clamp(1 - Math.abs(c + 0.15) / 0.3, 0, 1);
  return { night, dusk };
}

type Season = 'spring' | 'summer' | 'autumn' | 'winter';
export function seasonOf(d = new Date()): Season {
  const m = d.getMonth();
  if (m === 11 || m <= 1) return 'winter';
  if (m <= 4) return 'spring';
  if (m <= 7) return 'summer';
  return 'autumn';
}

// Weather is cosmetic: short showers (or snow in winter) come and go on a schedule.
export function weatherAt(now: number, season: Season) {
  const CYCLE = 9 * 60 * 1000;
  const idx = Math.floor(now / CYCLE);
  const into = (now % CYCLE) / 1000;
  const chance = season === 'winter' ? 0.6 : season === 'summer' ? 0.25 : 0.4;
  const len = season === 'winter' ? 180 : 110;
  if (hash(idx, 3, 5) >= chance || into > len) return { kind: 'clear' as const, k: 0 };
  const k = clamp(Math.min(into / 8, (len - into) / 8), 0, 1);
  return { kind: season === 'winter' ? ('snow' as const) : ('rain' as const), k };
}

// ------------------------------------------------------------------ shared geometry, materials, textures

const G = {
  box: new THREE.BoxGeometry(1, 1, 1),
  ball: new THREE.IcosahedronGeometry(1, 1),
  smooth: new THREE.SphereGeometry(1, 14, 10),
  dome: new THREE.SphereGeometry(1, 14, 7, 0, Math.PI * 2, 0, Math.PI / 2),
  rock: new THREE.DodecahedronGeometry(1, 0),
  plane: new THREE.PlaneGeometry(1, 1),
};

const cylCache = new Map<string, THREE.CylinderGeometry>();
function cylGeo(rt: number, rb: number, seg: number) {
  const k = `${rt.toFixed(3)}|${rb.toFixed(3)}|${seg}`;
  let g = cylCache.get(k);
  if (!g) { g = new THREE.CylinderGeometry(rt, rb, 1, seg); cylCache.set(k, g); }
  return g;
}

let prism: THREE.BufferGeometry | null = null;
function prismGeo() {
  if (prism) return prism;
  const v = [
    -0.5, 0, 0.5, 0.5, 0, 0.5, 0.5, 1, 0, -0.5, 0, 0.5, 0.5, 1, 0, -0.5, 1, 0,
    0.5, 0, -0.5, -0.5, 0, -0.5, -0.5, 1, 0, 0.5, 0, -0.5, -0.5, 1, 0, 0.5, 1, 0,
    0.5, 0, 0.5, 0.5, 0, -0.5, 0.5, 1, 0,
    -0.5, 0, -0.5, -0.5, 0, 0.5, -0.5, 1, 0,
  ];
  prism = new THREE.BufferGeometry();
  prism.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
  prism.computeVertexNormals();
  return prism;
}

let tri: THREE.BufferGeometry | null = null;
function sailGeo() {
  if (tri) return tri;
  tri = new THREE.BufferGeometry();
  tri.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, 0, 1, 0, 0, 0, 1], 3));
  tri.computeVertexNormals();
  return tri;
}

const matCache = new Map<string, THREE.Material>();
function M(color: string): THREE.MeshLambertMaterial {
  let m = matCache.get(color) as THREE.MeshLambertMaterial | undefined;
  if (!m) { m = new THREE.MeshLambertMaterial({ color, flatShading: true }); matCache.set(color, m); }
  return m;
}
function MT(color: string, opacity: number): THREE.MeshLambertMaterial {
  const k = `${color}@${opacity}`;
  let m = matCache.get(k) as THREE.MeshLambertMaterial | undefined;
  if (!m) { m = new THREE.MeshLambertMaterial({ color, transparent: true, opacity, flatShading: true, depthWrite: false }); matCache.set(k, m); }
  return m;
}

// glowing materials, their emissive strength follows the night
const WIN = new THREE.MeshLambertMaterial({ color: '#a9dcf5', emissive: '#ffc766', emissiveIntensity: 0 });
const LAMP = new THREE.MeshLambertMaterial({ color: '#fff3c4', emissive: '#ffcf6b', emissiveIntensity: 0.2 });
const WATER = new THREE.MeshPhongMaterial({ color: '#3f9fd8', shininess: 90, specular: '#ffffff', flatShading: true });

const texCache = new Map<string, THREE.Texture>();
const EF = '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
function canvasTex(key: string, w: number, h: number, draw: (c: CanvasRenderingContext2D) => void) {
  let t = texCache.get(key);
  if (t) return t;
  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  const c = cv.getContext('2d') as CanvasRenderingContext2D;
  draw(c);
  t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  texCache.set(key, t);
  return t;
}

function emojiTex(icon: string, badge = false) {
  return canvasTex(`e|${icon}|${badge}`, 128, 128, (c) => {
    if (badge) {
      c.fillStyle = '#fff8e6';
      c.beginPath(); c.arc(64, 64, 58, 0, Math.PI * 2); c.fill();
      c.lineWidth = 8; c.strokeStyle = '#8a5a2b'; c.stroke();
    }
    c.font = `${badge ? 64 : 92}px ${EF}`;
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText(icon, 64, 70);
  });
}

function bubbleTex(icon: string, mode: 'ready' | 'progress' | 'faded', step: number, count: number) {
  return canvasTex(`b|${icon}|${mode}|${step}|${count}`, 128, 160, (c) => {
    c.globalAlpha = mode === 'faded' ? 0.72 : 1;
    c.fillStyle = 'rgba(0,0,0,0.22)';
    c.beginPath(); c.arc(64, 70, 54, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#ffffff';
    c.beginPath(); c.moveTo(48, 110); c.lineTo(80, 110); c.lineTo(64, 152); c.closePath(); c.fill();
    c.beginPath(); c.arc(64, 64, 54, 0, Math.PI * 2); c.fill();
    if (mode === 'progress') {
      c.lineWidth = 9; c.strokeStyle = '#e6e0d0';
      c.beginPath(); c.arc(64, 64, 47, 0, Math.PI * 2); c.stroke();
      c.strokeStyle = '#5cb85c'; c.lineCap = 'round';
      c.beginPath(); c.arc(64, 64, 47, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * step) / 24); c.stroke();
    }
    c.font = `${mode === 'ready' ? 64 : 54}px ${EF}`;
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText(icon, 64, 68);
    if (count > 1) {
      c.fillStyle = '#e74c3c';
      c.beginPath(); c.arc(106, 22, 20, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#fff';
      c.font = '900 26px system-ui, sans-serif';
      c.fillText(String(count), 106, 24);
    }
  });
}

function textTex(text: string, color: string) {
  return canvasTex(`t|${text}|${color}`, 512, 96, (c) => {
    c.font = '900 54px ui-rounded, "Trebuchet MS", system-ui, sans-serif';
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.lineWidth = 12; c.strokeStyle = 'rgba(60,35,10,0.9)'; c.lineJoin = 'round';
    c.strokeText(text, 256, 50);
    c.fillStyle = color;
    c.fillText(text, 256, 50);
  });
}

// ------------------------------------------------------------------ mesh helpers (y is the bottom for boxes and cylinders)

type P = THREE.Object3D;
function mk(p: P, geo: THREE.BufferGeometry, mat: THREE.Material, sx: number, sy: number, sz: number, x: number, y: number, z: number, shadow = true) {
  const m = new THREE.Mesh(geo, mat);
  m.scale.set(sx, sy, sz);
  m.position.set(x, y, z);
  m.castShadow = shadow;
  m.receiveShadow = true;
  p.add(m);
  return m;
}
const bx = (p: P, w: number, h: number, d: number, color: string, x: number, y: number, z: number, shadow = true) => mk(p, G.box, M(color), w, h, d, x, y + h / 2, z, shadow);
const ball = (p: P, r: number, color: string, x: number, y: number, z: number, sx = 1, sy = 1, sz = 1, shadow = true) => mk(p, G.ball, M(color), r * sx, r * sy, r * sz, x, y, z, shadow);
const cyl = (p: P, rt: number, rb: number, h: number, color: string, x: number, y: number, z: number, seg = 8, shadow = true) => mk(p, cylGeo(rt, rb, seg), M(color), 1, h, 1, x, y + h / 2, z, shadow);
const roof = (p: P, w: number, h: number, d: number, color: string, x: number, y: number, z: number, rotY = 0) => {
  const m = mk(p, prismGeo(), M(color), w, h, d, x, y, z);
  m.rotation.y = rotY;
  return m;
};
function badge(p: P, icon: string, size: number, x: number, y: number, z: number, rotY = 0) {
  const m = new THREE.Mesh(G.plane, new THREE.MeshBasicMaterial({ map: emojiTex(icon, true), transparent: true }));
  m.scale.set(size, size, 1);
  m.position.set(x, y, z);
  m.rotation.y = rotY;
  p.add(m);
  return m;
}
function group(p?: P, x = 0, y = 0, z = 0) {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  p?.add(g);
  return g;
}

// ------------------------------------------------------------------ types

type Update = (o: FarmObject, now: number, t: number, dt: number) => void;
interface Entry {
  id: number;
  type: string;
  root: THREE.Group;
  hit: THREE.Mesh;
  top: number;
  update?: Update;
  bubble?: THREE.Sprite;
  bubbleKey?: string;
}
interface Burst { pts: THREE.Points; vel: Float32Array; life: number }
interface Float { s: THREE.Sprite; life: number }
interface Actor { x: number; y: number; tx: number; ty: number; wait: number; heading: number; moving: boolean; g: THREE.Group; phase: number }

const HIT_MAT = new THREE.MeshBasicMaterial({ visible: false });
const FRUIT_COLOR: Record<string, string> = { apple: '#e53935', cherry: '#b0102a', orange: '#ff9800' };
const TREE_LEAF: Record<string, string> = { apple_tree: '#4f9e36', cherry_tree: '#3f8a3a', orange_tree: '#2f7d32' };
const PEN_GROUND: Record<string, string> = {
  coop: '#d9c08a', pasture: '#86c24f', pigpen: '#94704a', sheepfold: '#9ccc5a',
  duck_pond: '#8fc45a', goat_yard: '#b8a46c', beehive: '#7fbf4f', stable: '#c9b27a',
};

// ------------------------------------------------------------------ renderer

export class Renderer {
  cam = { zoom: 1.3 };
  W = 1;
  H = 1;
  private gl: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(32, 1, 0.5, 400);
  private target = new THREE.Vector3(13.5, 0, 11.5);
  private az = Math.PI / 4;
  private azGoal = Math.PI / 4;
  private el = 0.86;
  private ray = new THREE.Raycaster();
  private ground = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  private sun = new THREE.DirectionalLight('#fff4e0', 2.4);
  private hemi = new THREE.HemisphereLight('#d6efff', '#5a7a3a', 1.25);
  private world = new THREE.Group();
  private land = new THREE.Group();
  private fxLayer = new THREE.Group();
  private entries = new Map<number, Entry>();
  private syncKey = '';
  private landKey = '';
  private tiles!: THREE.InstancedMesh;
  private sea!: THREE.Mesh;
  private shimmer!: THREE.Mesh;
  private clouds: THREE.Group[] = [];
  private bursts: Burst[] = [];
  private floats: Float[] = [];
  private ghost: { key: string; g: THREE.Group; foot: THREE.Mesh } | null = null;
  private sel: THREE.Group;
  private farmer: Actor;
  private dog: Actor;
  private wx: { pts: THREE.Points | null; rain: THREE.LineSegments | null; kind: string; vel: Float32Array | null } = { pts: null, rain: null, kind: 'none', vel: null };
  private season: Season = seasonOf();
  private last = 0;
  private panAnchor: THREE.Vector3 | null = null;
  private bg = new THREE.Color();

  constructor(public canvas: HTMLCanvasElement, public store: GameStore) {
    this.gl = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    this.gl.shadowMap.enabled = true;
    this.gl.shadowMap.type = THREE.PCFShadowMap;
    this.scene.fog = new THREE.Fog('#8fd3f5', 60, 140);
    this.scene.background = this.bg;

    this.sun.position.set(14 + 14, 26, 14 + 8);
    this.sun.target.position.set(14, 0, 14);
    this.sun.castShadow = true;
    const sc = this.sun.shadow.camera;
    sc.left = -24; sc.right = 24; sc.top = 24; sc.bottom = -24; sc.near = 1; sc.far = 90;
    const small = typeof window !== 'undefined' && window.innerWidth < 700;
    this.sun.shadow.mapSize.set(small ? 1024 : 2048, small ? 1024 : 2048);
    this.sun.shadow.bias = -0.0006;
    this.sun.shadow.normalBias = 0.02;
    this.scene.add(this.sun, this.sun.target, this.hemi, this.world, this.land, this.fxLayer);

    this.buildSea();
    this.buildClouds();
    this.sel = this.buildSelection();
    this.farmer = { x: 12.5, y: 11.2, tx: 12.5, ty: 11.2, wait: 2, heading: 0, moving: false, g: buildFarmer(), phase: 0 };
    this.dog = { x: 13.2, y: 11.6, tx: 13.2, ty: 11.6, wait: 0, heading: 0, moving: false, g: buildDog(), phase: 0 };
    this.world.add(this.farmer.g, this.dog.g);
    this.updateCamera();
  }

  dispose() {
    this.gl.dispose();
  }

  // ------------------------------------------------ camera

  resize(w: number, h: number, dpr: number) {
    this.W = w; this.H = h;
    this.gl.setPixelRatio(dpr);
    this.gl.setSize(w, h, false);
    this.camera.aspect = w / Math.max(1, h);
    this.camera.updateProjectionMatrix();
  }

  private updateCamera() {
    const dist = 34 / this.cam.zoom;
    const ce = Math.cos(this.el);
    this.camera.position.set(
      this.target.x + ce * Math.sin(this.az) * dist,
      this.target.y + Math.sin(this.el) * dist,
      this.target.z + ce * Math.cos(this.az) * dist,
    );
    this.camera.lookAt(this.target);
    this.camera.updateMatrixWorld();
  }

  private rayAt(sx: number, sy: number) {
    this.ray.setFromCamera(new THREE.Vector2((sx / this.W) * 2 - 1, -(sy / this.H) * 2 + 1), this.camera);
    return this.ray;
  }

  private groundAt(sx: number, sy: number) {
    const v = new THREE.Vector3();
    return this.rayAt(sx, sy).ray.intersectPlane(this.ground, v) ? v : null;
  }

  gridAt(sx: number, sy: number) {
    const g = this.groundAt(sx, sy);
    return g ? { x: Math.floor(g.x), y: Math.floor(g.z) } : { x: -99, y: -99 };
  }

  toScreen(gx: number, gy: number, z = 0) {
    const v = new THREE.Vector3(gx, z * ZU, gy).project(this.camera);
    return { x: ((v.x + 1) / 2) * this.W, y: ((1 - v.y) / 2) * this.H };
  }

  clampCam() {
    this.target.x = clamp(this.target.x, -1, GRID + 1);
    this.target.z = clamp(this.target.z, -1, GRID + 1);
  }

  panStart(sx: number, sy: number) {
    this.panAnchor = this.groundAt(sx, sy);
  }

  panTo(sx: number, sy: number) {
    if (!this.panAnchor) return;
    const cur = this.groundAt(sx, sy);
    if (!cur) return;
    this.target.x += this.panAnchor.x - cur.x;
    this.target.z += this.panAnchor.z - cur.z;
    this.clampCam();
    this.updateCamera();
  }

  zoomAt(sx: number, sy: number, zoom: number) {
    const before = this.groundAt(sx, sy);
    this.cam.zoom = clamp(zoom, 0.45, 2.6);
    this.updateCamera();
    const after = this.groundAt(sx, sy);
    if (before && after) {
      this.target.x += before.x - after.x;
      this.target.z += before.z - after.z;
    }
    this.clampCam();
    this.updateCamera();
  }

  rotate(dir: number) {
    this.azGoal += (dir * Math.PI) / 2;
  }

  rotateBy(rad: number) {
    this.az += rad;
    this.azGoal = this.az;
    this.updateCamera();
  }

  resetView(zoom: number) {
    this.centerOn(13.5, 11.5);
    this.cam.zoom = zoom;
    this.azGoal = Math.round((this.az - Math.PI / 4) / (Math.PI * 2)) * Math.PI * 2 + Math.PI / 4;
  }

  centerOn(gx: number, gy: number) {
    this.target.set(gx, 0, gy);
    this.updateCamera();
  }

  // ------------------------------------------------ picking

  pick(sx: number, sy: number): { obj?: FarmObject; tile: { x: number; y: number } } {
    const tile = this.gridAt(sx, sy);
    const moveId = this.store.ui.placing?.moveId;
    const hits: THREE.Object3D[] = [];
    for (const e of this.entries.values()) if (e.id !== moveId) hits.push(e.hit);
    const r = this.rayAt(sx, sy).intersectObjects(hits, false);
    if (r.length) {
      const id = r[0].object.userData.objId as number;
      const obj = this.store.obj(id);
      if (obj) return { obj, tile };
    }
    return { tile };
  }

  // ------------------------------------------------ static world

  private buildSea() {
    this.sea = new THREE.Mesh(new THREE.PlaneGeometry(600, 600, 1, 1), WATER);
    this.sea.rotation.x = -Math.PI / 2;
    this.sea.position.set(14, -0.55, 14);
    this.sea.receiveShadow = true;
    this.scene.add(this.sea);
    const tex = canvasTex('shimmer', 256, 256, (c) => {
      c.strokeStyle = 'rgba(255,255,255,0.55)';
      c.lineCap = 'round';
      for (let i = 0; i < 26; i++) {
        const x = hash(i, 1) * 256, y = hash(i, 2) * 256, l = 10 + hash(i, 3) * 26;
        c.lineWidth = 2 + hash(i, 4) * 2;
        c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + l / 2, y - 4, x + l, y); c.stroke();
      }
    });
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(60, 60);
    this.shimmer = new THREE.Mesh(new THREE.PlaneGeometry(600, 600), new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.35, depthWrite: false }));
    this.shimmer.rotation.x = -Math.PI / 2;
    this.shimmer.position.set(14, -0.53, 14);
    this.scene.add(this.shimmer);

    // island body: grass top is made of tiles, then soil, then a sandy beach
    const isl = this.land;
    bx(isl, GRID + 0.1, 1.2, GRID + 0.1, '#7a4b26', GRID / 2, -1.4, GRID / 2, false);
    bx(isl, GRID + 1.4, 0.34, GRID + 1.4, '#e8d08e', GRID / 2, -0.72, GRID / 2, false);
    bx(isl, GRID + 0.9, 0.2, GRID + 0.9, '#d9bd78', GRID / 2, -0.4, GRID / 2, false);
    const foam = new THREE.Mesh(G.box, MT('#ffffff', 0.35));
    foam.scale.set(GRID + 2.2, 0.02, GRID + 2.2);
    foam.position.set(GRID / 2, -0.54, GRID / 2);
    this.land.add(foam);

    this.tiles = new THREE.InstancedMesh(G.box, new THREE.MeshLambertMaterial({ color: '#ffffff' }), GRID * GRID);
    this.tiles.receiveShadow = true;
    const m = new THREE.Matrix4();
    for (let y = 0; y < GRID; y++) for (let x = 0; x < GRID; x++) {
      m.makeScale(1, 0.4, 1);
      m.setPosition(x + 0.5, -0.2, y + 0.5);
      this.tiles.setMatrixAt(y * GRID + x, m);
      this.tiles.setColorAt(y * GRID + x, new THREE.Color('#7cc450'));
    }
    this.land.add(this.tiles);
  }

  private dynLand = new THREE.Group();

  private rebuildLand() {
    const s = this.store.s;
    const key = s.chunks.join(';');
    if (key === this.landKey) return;
    this.landKey = key;
    const col = new THREE.Color();
    for (let y = 0; y < GRID; y++) for (let x = 0; x < GRID; x++) {
      const cs = chunkState(s, Math.floor(x / CHUNK), Math.floor(y / CHUNK));
      const h = hash(x, y, 3);
      if (cs === 'open') col.set((x + y) % 2 ? '#7fc653' : '#76be4b').offsetHSL(0, 0, (h - 0.5) * 0.04);
      else if (cs === 'buyable') col.set('#5f9a3c').offsetHSL(0, 0, (h - 0.5) * 0.05);
      else col.set('#4b7f35').offsetHSL(0, 0, (h - 0.5) * 0.05);
      this.tiles.setColorAt(y * GRID + x, col);
    }
    if (this.tiles.instanceColor) this.tiles.instanceColor.needsUpdate = true;

    // locked land: forest and FOR SALE signs
    this.land.remove(this.dynLand);
    this.dynLand.traverse((o) => { if ((o as THREE.InstancedMesh).isInstancedMesh) (o as THREE.InstancedMesh).dispose(); });
    this.dynLand = new THREE.Group();
    this.signs = [];
    const pines: [number, number, number][] = [];
    const rounds: [number, number, number][] = [];
    for (let cy = 0; cy < NCH; cy++) for (let cx = 0; cx < NCH; cx++) {
      const cs = chunkState(s, cx, cy);
      if (cs === 'open') continue;
      if (cs === 'buyable') this.buildSign(this.dynLand, cx, cy);
      for (let j = 0; j < CHUNK; j++) for (let i = 0; i < CHUNK; i++) {
        const x = cx * CHUNK + i, y = cy * CHUNK + j;
        if (cs === 'buyable' && (i === 1 || i === 2) && (j === 1 || j === 2)) continue;
        if (hash(x, y, 7) >= 0.5) continue;
        const k = hash(x, y, 11);
        const jx = (hash(x, y, 13) - 0.5) * 0.5, jy = (hash(x, y, 17) - 0.5) * 0.5;
        (k < 0.55 ? pines : rounds).push([x + 0.5 + jx, y + 0.5 + jy, 0.8 + hash(x, y, 19) * 0.5]);
      }
    }
    const mtx = new THREE.Matrix4(), q = new THREE.Quaternion(), sv = new THREE.Vector3(), pv = new THREE.Vector3();
    const trunks = new THREE.InstancedMesh(cylGeo(0.06, 0.09, 6), M('#6b3f1f'), pines.length + rounds.length);
    const pineA = new THREE.InstancedMesh(cylGeo(0, 1, 7), new THREE.MeshLambertMaterial({ color: '#ffffff', flatShading: true }), pines.length);
    const pineB = new THREE.InstancedMesh(cylGeo(0, 1, 7), new THREE.MeshLambertMaterial({ color: '#ffffff', flatShading: true }), pines.length);
    const crown = new THREE.InstancedMesh(G.ball, new THREE.MeshLambertMaterial({ color: '#ffffff', flatShading: true }), rounds.length);
    let ti = 0;
    pines.forEach(([x, z, sc], i) => {
      mtx.compose(pv.set(x, 0.2 * sc, z), q, sv.set(1, 0.4 * sc, 1)); trunks.setMatrixAt(ti++, mtx);
      mtx.compose(pv.set(x, 0.75 * sc, z), q, sv.set(0.42 * sc, 0.9 * sc, 0.42 * sc)); pineA.setMatrixAt(i, mtx);
      mtx.compose(pv.set(x, 1.2 * sc, z), q, sv.set(0.3 * sc, 0.7 * sc, 0.3 * sc)); pineB.setMatrixAt(i, mtx);
      col.set('#2f6b2a').offsetHSL(0, 0, (hash(i, 5) - 0.5) * 0.08);
      pineA.setColorAt(i, col); pineB.setColorAt(i, col.offsetHSL(0, 0, 0.04));
    });
    rounds.forEach(([x, z, sc], i) => {
      mtx.compose(pv.set(x, 0.25 * sc, z), q, sv.set(1, 0.5 * sc, 1)); trunks.setMatrixAt(ti++, mtx);
      mtx.compose(pv.set(x, 0.8 * sc, z), q, sv.set(0.42 * sc, 0.4 * sc, 0.42 * sc)); crown.setMatrixAt(i, mtx);
      col.set('#3f7d2e').offsetHSL(0, 0, (hash(i, 9) - 0.5) * 0.1);
      crown.setColorAt(i, col);
    });
    for (const im of [trunks, pineA, pineB, crown]) { im.castShadow = true; im.receiveShadow = true; this.dynLand.add(im); }
    this.land.add(this.dynLand);
  }

  private signs: THREE.Group[] = [];
  private buildSign(p: P, cx: number, cy: number) {
    const g = group(p, cx * CHUNK + CHUNK / 2, 0, cy * CHUNK + CHUNK / 2);
    cyl(g, 0.05, 0.05, 0.9, '#6b4226', 0, 0, 0, 6);
    const tex = canvasTex('forsale', 256, 128, (c) => {
      c.fillStyle = '#c98a45'; c.fillRect(0, 0, 256, 128);
      c.strokeStyle = '#6b4226'; c.lineWidth = 12; c.strokeRect(6, 6, 244, 116);
      c.fillStyle = '#fff8e6'; c.font = '900 48px ui-rounded, "Trebuchet MS", system-ui, sans-serif';
      c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('FOR SALE', 128, 66);
    });
    const board = new THREE.Mesh(G.box, [M('#a8733f'), M('#a8733f'), M('#a8733f'), M('#a8733f'), new THREE.MeshLambertMaterial({ map: tex }), new THREE.MeshLambertMaterial({ map: tex })]);
    board.scale.set(0.9, 0.45, 0.06);
    board.position.set(0, 0.95, 0);
    board.castShadow = true;
    g.add(board);
    g.userData.sign = true;
    this.signs.push(g);
  }

  // ------------------------------------------------ objects

  private sync() {
    const s = this.store.s;
    const key = `${this.store.objVersion}|${s.objects.length}`;
    if (key === this.syncKey) return;
    this.syncKey = key;
    const seen = new Set<number>();
    for (const o of s.objects) {
      seen.add(o.id);
      let e = this.entries.get(o.id);
      if (e && e.type !== o.type) { this.removeEntry(e); e = undefined; }
      if (!e) {
        e = this.makeEntry(o);
        this.entries.set(o.id, e);
        this.world.add(e.root);
      }
      e.root.position.set(o.x, 0, o.y);
    }
    for (const [id, e] of this.entries) if (!seen.has(id)) this.removeEntry(e);
  }

  private removeEntry(e: Entry) {
    this.world.remove(e.root);
    if (e.bubble) { this.fxLayer.remove(e.bubble); e.bubble.material.dispose(); }
    this.entries.delete(e.id);
  }

  private makeEntry(o: FarmObject): Entry {
    const d = BUILDING[o.type];
    const root = new THREE.Group();
    const e: Entry = { id: o.id, type: o.type, root, hit: null as unknown as THREE.Mesh, top: 1 };
    buildObject(e, o, d, this.store);
    const hit = new THREE.Mesh(G.box, HIT_MAT);
    const hh = Math.max(0.25, e.top);
    hit.scale.set(d.w * 0.96, hh, d.h * 0.96);
    hit.position.set(d.w / 2, hh / 2, d.h / 2);
    hit.userData.objId = o.id;
    root.add(hit);
    e.hit = hit;
    root.userData.objId = o.id;
    return e;
  }

  // ------------------------------------------------ frame

  frame(t: number) {
    const dt = Math.min(0.05, (t - (this.last || t)) / 1000);
    this.last = t;
    const s = this.store.s;
    const ui = this.store.ui;
    const now = Date.now();

    this.rebuildLand();
    this.sync();

    // smooth camera rotation
    if (Math.abs(this.azGoal - this.az) > 0.0005) this.az += (this.azGoal - this.az) * Math.min(1, dt * 8);
    this.updateCamera();

    const moveId = ui.placing?.moveId;
    for (const o of s.objects) {
      const e = this.entries.get(o.id);
      if (!e) continue;
      e.root.visible = o.id !== moveId;
      e.update?.(o, now, t, dt);
    }
    for (const g of this.signs) { g.children[1].position.y = 0.95 + Math.sin(t / 500 + g.position.x) * 0.03; g.rotation.y = this.az; }

    this.updateGhost(t);
    this.updateSelection(t);
    this.updateBubbles(t, now);
    this.consumeFx();
    this.updateFx(dt);
    this.updateActors(dt, t);
    this.updateClouds(dt);
    const wk = this.updateWeather(dt, now);
    this.updateLight(now, t, wk);

    this.gl.render(this.scene, this.camera);
  }

  private updateLight(now: number, t: number, rainK: number) {
    const s = this.store.s;
    const nf = s.settings.dayNight ? nightFactor(now) : { night: 0, dusk: 0 };
    const n = nf.night, dk = nf.dusk;
    this.sun.castShadow = s.settings.shadows;
    this.sun.intensity = lerp(2.5, 0.5, n) * (1 - 0.4 * rainK);
    this.sun.color.set('#fff4e0').lerp(new THREE.Color('#ff9a5a'), dk * 0.7).lerp(new THREE.Color('#8fa3ff'), n);
    this.hemi.intensity = lerp(1.3, 0.62, n) * (1 - 0.15 * rainK);
    this.hemi.color.set('#d6efff').lerp(new THREE.Color('#6b7cc4'), n);
    this.bg.set('#9ad8f7').lerp(new THREE.Color('#f5a36e'), dk * 0.55).lerp(new THREE.Color('#0f1a3d'), n).lerp(new THREE.Color('#6d7f92'), rainK * 0.5 * (1 - n));
    (this.scene.fog as THREE.Fog).color.copy(this.bg);
    WATER.color.set('#3f9fd8').lerp(new THREE.Color('#12305a'), n * 0.8);
    WIN.emissiveIntensity = n > 0.2 ? n * 1.1 : 0;
    LAMP.emissiveIntensity = 0.2 + n * 1.4;
    const tex = (this.shimmer.material as THREE.MeshBasicMaterial).map;
    if (tex) { tex.offset.x = (t / 90000) % 1; tex.offset.y = Math.sin(t / 4000) * 0.01; }
    (this.shimmer.material as THREE.MeshBasicMaterial).opacity = 0.35 * (1 - n * 0.6);
  }

  // ------------------------------------------------ placing ghost and selection

  private updateGhost(t: number) {
    const p = this.store.ui.placing;
    if (!p) {
      if (this.ghost) { this.fxLayer.remove(this.ghost.g); this.ghost = null; }
      return;
    }
    const key = `${p.type}|${p.moveId ?? -1}`;
    if (!this.ghost || this.ghost.key !== key) {
      if (this.ghost) this.fxLayer.remove(this.ghost.g);
      const d = BUILDING[p.type];
      const fake: FarmObject = { id: -1, type: p.type, x: p.x, y: p.y };
      if (d.kind === 'production') fake.prod = { queue: [], slots: 3 };
      if (d.kind === 'pen') fake.pen = { animals: [] };
      if (d.kind === 'plot') fake.plot = { crop: null, plantedAt: 0 };
      if (d.kind === 'tree') fake.tree = { startAt: Date.now() };
      const real = p.moveId !== undefined ? this.store.obj(p.moveId) : undefined;
      const src = real ?? fake;
      const e: Entry = { id: -1, type: p.type, root: new THREE.Group(), hit: null as unknown as THREE.Mesh, top: 1 };
      buildObject(e, src, d, this.store);
      e.update?.(src, Date.now(), t, 0);
      e.root.traverse((m) => {
        const mesh = m as THREE.Mesh;
        if (mesh.isMesh) { mesh.castShadow = false; }
      });
      const foot = new THREE.Mesh(G.plane, new THREE.MeshBasicMaterial({ color: '#5cb82e', transparent: true, opacity: 0.45, depthWrite: false }));
      foot.rotation.x = -Math.PI / 2;
      foot.scale.set(d.w, d.h, 1);
      foot.position.set(d.w / 2, 0.03, d.h / 2);
      e.root.add(foot);
      this.ghost = { key, g: e.root, foot };
      this.fxLayer.add(e.root);
    }
    const ok = this.store.canPlace(p.type, p.x, p.y, p.moveId);
    (this.ghost.foot.material as THREE.MeshBasicMaterial).color.set(ok ? '#5cb82e' : '#e0533d');
    this.ghost.g.position.set(p.x, 0.06 + Math.abs(Math.sin(t / 260)) * 0.06, p.y);
  }

  private buildSelection() {
    const g = new THREE.Group();
    const mat = new THREE.MeshBasicMaterial({ color: '#ffe066', transparent: true, opacity: 0.8, depthWrite: false });
    for (let i = 0; i < 4; i++) { const m = new THREE.Mesh(G.box, mat); g.add(m); }
    g.visible = false;
    this.fxLayer.add(g);
    return g;
  }

  private updateSelection(t: number) {
    const o = this.store.obj(this.store.ui.selectedId);
    if (!o) { this.sel.visible = false; return; }
    const d = BUILDING[o.type];
    this.sel.visible = true;
    this.sel.position.set(o.x, 0.04, o.y);
    const th = 0.07;
    const [a, b, c, e] = this.sel.children as THREE.Mesh[];
    a.scale.set(d.w, 0.04, th); a.position.set(d.w / 2, 0, 0);
    b.scale.set(d.w, 0.04, th); b.position.set(d.w / 2, 0, d.h);
    c.scale.set(th, 0.04, d.h); c.position.set(0, 0, d.h / 2);
    e.scale.set(th, 0.04, d.h); e.position.set(d.w, 0, d.h / 2);
    (a.material as THREE.MeshBasicMaterial).opacity = 0.55 + Math.sin(t / 180) * 0.35;
  }

  // ------------------------------------------------ status bubbles

  private bubbleFor(o: FarmObject, d: BuildingDef, now: number): { icon: string; mode: 'ready' | 'progress' | 'faded'; p: number; count: number } | null {
    const s = this.store.s;
    switch (d.kind) {
      case 'production': {
        const info = prodInfo(o, now);
        if (info.done.length) return { icon: ITEMS[info.done[0].recipe].icon, mode: 'ready', p: 0, count: info.done.length };
        if (info.current) return { icon: ITEMS[info.current.recipe].icon, mode: 'progress', p: info.progress, count: 0 };
        return null;
      }
      case 'pen': {
        const pi = penInfo(o, now);
        if (pi.ready) return { icon: ITEMS[pi.animal.product].icon, mode: 'ready', p: 0, count: pi.ready };
        if (pi.hungry && !pi.fed && pi.total) return { icon: ITEMS[pi.animal.feed].icon, mode: 'faded', p: 0, count: 0 };
        if (pi.fed) return { icon: ITEMS[pi.animal.product].icon, mode: 'progress', p: pi.progress, count: 0 };
        return null;
      }
      case 'board':
        return s.orders.some((x) => canFulfill(s, x, now)) ? { icon: '✅', mode: 'ready', p: 0, count: 0 } : null;
      case 'tree': {
        const ti = treeInfo(o, now);
        return ti.ready ? { icon: ITEMS[ti.fruit].icon, mode: 'ready', p: 0, count: 0 } : null;
      }
      case 'stall': {
        const sold = s.stall.filter((x) => x.item && x.soldAt <= now).length;
        return sold ? { icon: '💰', mode: 'ready', p: 0, count: sold } : null;
      }
      case 'dock': {
        if (boatState(s, now) !== 'docked' || !s.boat) return null;
        const b = s.boat;
        if (b.crates.every((c) => c.filled)) return { icon: '⛵', mode: 'ready', p: 0, count: 0 };
        if (b.crates.some((c) => !c.filled && (s.inv[c.item] ?? 0) >= c.qty)) return { icon: '📦', mode: 'ready', p: 0, count: 0 };
        return null;
      }
      default:
        return null;
    }
  }

  private updateBubbles(t: number, now: number) {
    const moveId = this.store.ui.placing?.moveId;
    for (const o of this.store.s.objects) {
      const e = this.entries.get(o.id);
      if (!e) continue;
      const d = BUILDING[o.type];
      const b = o.id === moveId ? null : this.bubbleFor(o, d, now);
      if (!b) {
        if (e.bubble) e.bubble.visible = false;
        continue;
      }
      const step = b.mode === 'progress' ? Math.round(clamp(b.p, 0, 1) * 24) : 0;
      const key = `${b.icon}|${b.mode}|${step}|${b.count}`;
      if (!e.bubble) {
        e.bubble = new THREE.Sprite(new THREE.SpriteMaterial({ depthTest: false, transparent: true }));
        e.bubble.center.set(0.5, 0);
        e.bubble.renderOrder = 10;
        this.fxLayer.add(e.bubble);
      }
      if (e.bubbleKey !== key) {
        e.bubble.material.map = bubbleTex(b.icon, b.mode, step, b.count);
        e.bubble.material.needsUpdate = true;
        e.bubbleKey = key;
      }
      const sc = b.mode === 'ready' ? 0.62 : 0.5;
      e.bubble.scale.set(sc, sc * 1.25, 1);
      const bob = b.mode === 'ready' ? Math.abs(Math.sin(t / 260 + o.id)) * 0.14 : 0;
      e.bubble.position.set(o.x + d.w / 2, e.top + 0.15 + bob, o.y + d.h / 2);
      e.bubble.visible = true;
    }
  }

  // ------------------------------------------------ effects

  private consumeFx() {
    for (const f of this.store.fx) {
      const y = (f.z ?? 30) * ZU;
      if (f.kind === 'float') {
        const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: textTex(f.text ?? '', f.color ?? '#fff'), depthTest: false, transparent: true }));
        sp.scale.set(1.6, 0.3, 1);
        sp.position.set(f.gx, y + 0.4, f.gy);
        sp.renderOrder = 12;
        this.fxLayer.add(sp);
        this.floats.push({ s: sp, life: 1.5 });
      } else {
        const n = 16;
        const pos = new Float32Array(n * 3);
        const vel = new Float32Array(n * 3);
        for (let i = 0; i < n; i++) {
          pos[i * 3] = f.gx; pos[i * 3 + 1] = y; pos[i * 3 + 2] = f.gy;
          const a = Math.random() * Math.PI * 2, sp = 0.8 + Math.random() * 1.6;
          vel[i * 3] = Math.cos(a) * sp; vel[i * 3 + 1] = 2 + Math.random() * 2; vel[i * 3 + 2] = Math.sin(a) * sp;
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        const pts = new THREE.Points(geo, new THREE.PointsMaterial({ color: f.color ?? '#ffffff', size: 0.11, transparent: true }));
        this.fxLayer.add(pts);
        this.bursts.push({ pts, vel, life: 0.9 });
      }
    }
    this.store.fx.length = 0;
  }

  private updateFx(dt: number) {
    this.bursts = this.bursts.filter((b) => {
      b.life -= dt;
      const mat = b.pts.material as THREE.PointsMaterial;
      if (b.life <= 0) { this.fxLayer.remove(b.pts); b.pts.geometry.dispose(); mat.dispose(); return false; }
      const a = b.pts.geometry.getAttribute('position') as THREE.BufferAttribute;
      const arr = a.array as Float32Array;
      for (let i = 0; i < arr.length; i += 3) {
        b.vel[i + 1] -= 7 * dt;
        arr[i] += b.vel[i] * dt; arr[i + 1] += b.vel[i + 1] * dt; arr[i + 2] += b.vel[i + 2] * dt;
      }
      a.needsUpdate = true;
      mat.opacity = clamp(b.life / 0.9, 0, 1);
      return true;
    });
    this.floats = this.floats.filter((f) => {
      f.life -= dt;
      if (f.life <= 0) { this.fxLayer.remove(f.s); f.s.material.dispose(); return false; }
      f.s.position.y += 0.7 * dt;
      f.s.material.opacity = clamp(f.life / 0.5, 0, 1);
      return true;
    });
  }

  // ------------------------------------------------ clouds

  private buildClouds() {
    const mat = new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false });
    for (let i = 0; i < 7; i++) {
      const g = new THREE.Group();
      const n = 3 + Math.floor(hash(i, 2) * 3);
      for (let k = 0; k < n; k++) {
        const m = new THREE.Mesh(G.ball, mat);
        const r = 0.9 + hash(i, k, 4) * 0.9;
        m.scale.set(r * 1.3, r * 0.8, r);
        m.position.set((k - n / 2) * 1.2, hash(i, k, 5) * 0.4, (hash(i, k, 6) - 0.5) * 1.2);
        m.castShadow = true;
        g.add(m);
      }
      g.position.set(-20 + hash(i, 7) * 70, 14 + hash(i, 8) * 4, -6 + hash(i, 9) * 40);
      g.userData.speed = 0.35 + hash(i, 10) * 0.35;
      this.scene.add(g);
      this.clouds.push(g);
    }
  }

  private updateClouds(dt: number) {
    const on = this.store.s.settings.clouds;
    for (const g of this.clouds) {
      g.visible = on;
      g.position.x += (g.userData.speed as number) * dt;
      if (g.position.x > GRID + 26) { g.position.x = -26; g.position.z = -6 + Math.random() * 40; }
    }
  }

  // ------------------------------------------------ weather

  private updateWeather(dt: number, now: number) {
    const on = this.store.s.settings.weather;
    const w = on ? weatherAt(now, this.season) : { kind: 'clear' as const, k: 0 };
    let kind = 'none';
    let want = 0;
    if (w.kind === 'rain') { kind = 'rain'; want = Math.round(900 * w.k); }
    else if (w.kind === 'snow') { kind = 'snow'; want = Math.round(700 * w.k); }
    else if (on && this.season === 'spring') { kind = 'petal'; want = 60; }
    else if (on && this.season === 'autumn') { kind = 'leaf'; want = 60; }
    else if (on && this.season === 'winter') { kind = 'snow'; want = 120; }
    const W = this.wx;
    const cap = 900;
    if (W.kind !== kind) {
      if (W.pts) { this.scene.remove(W.pts); W.pts.geometry.dispose(); (W.pts.material as THREE.Material).dispose(); W.pts = null; }
      if (W.rain) { this.scene.remove(W.rain); W.rain.geometry.dispose(); (W.rain.material as THREE.Material).dispose(); W.rain = null; }
      W.kind = kind;
      if (kind === 'rain') {
        const pos = new Float32Array(cap * 6);
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        for (let i = 0; i < cap; i++) this.seedDrop(pos, i, true);
        W.rain = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: '#d6e6ff', transparent: true, opacity: 0.55 }));
        W.rain.frustumCulled = false;
        this.scene.add(W.rain);
      } else if (kind !== 'none') {
        const pos = new Float32Array(cap * 3);
        const colA = new Float32Array(cap * 3);
        const cols = kind === 'petal' ? ['#ffc1d9', '#ffe1ec', '#ff9fc4'] : kind === 'leaf' ? ['#e67e22', '#d35400', '#f1c40f', '#a0522d'] : ['#ffffff'];
        const c = new THREE.Color();
        for (let i = 0; i < cap; i++) {
          pos[i * 3] = this.target.x + (Math.random() - 0.5) * 36;
          pos[i * 3 + 1] = Math.random() * 12;
          pos[i * 3 + 2] = this.target.z + (Math.random() - 0.5) * 36;
          c.set(cols[i % cols.length]);
          colA[i * 3] = c.r; colA[i * 3 + 1] = c.g; colA[i * 3 + 2] = c.b;
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        geo.setAttribute('color', new THREE.BufferAttribute(colA, 3));
        W.pts = new THREE.Points(geo, new THREE.PointsMaterial({ size: kind === 'snow' ? 0.12 : 0.16, vertexColors: true, transparent: true, opacity: 0.95 }));
        W.pts.frustumCulled = false;
        this.scene.add(W.pts);
      }
    }
    if (W.rain) {
      W.rain.geometry.setDrawRange(0, want * 2);
      const a = W.rain.geometry.getAttribute('position') as THREE.BufferAttribute;
      const arr = a.array as Float32Array;
      for (let i = 0; i < want; i++) {
        const o = i * 6;
        arr[o + 1] -= 16 * dt; arr[o + 4] -= 16 * dt;
        arr[o] -= 1.5 * dt; arr[o + 3] -= 1.5 * dt;
        if (arr[o + 4] < 0) this.seedDrop(arr, i, false);
      }
      a.needsUpdate = true;
    }
    if (W.pts) {
      W.pts.geometry.setDrawRange(0, want);
      const a = W.pts.geometry.getAttribute('position') as THREE.BufferAttribute;
      const arr = a.array as Float32Array;
      const fall = kind === 'snow' ? 1.1 : 0.9;
      for (let i = 0; i < want; i++) {
        const o = i * 3;
        arr[o + 1] -= fall * dt;
        arr[o] += (0.4 + Math.sin(now / 900 + i) * 0.6) * dt;
        arr[o + 2] += Math.cos(now / 1100 + i * 1.7) * 0.4 * dt;
        if (arr[o + 1] < 0 || Math.abs(arr[o] - this.target.x) > 20 || Math.abs(arr[o + 2] - this.target.z) > 20) {
          arr[o] = this.target.x + (Math.random() - 0.5) * 36;
          arr[o + 1] = 10 + Math.random() * 3;
          arr[o + 2] = this.target.z + (Math.random() - 0.5) * 36;
        }
      }
      a.needsUpdate = true;
    }
    return w.kind === 'rain' ? w.k : 0;
  }

  private seedDrop(arr: Float32Array, i: number, anyHeight: boolean) {
    const o = i * 6;
    const x = this.target.x + (Math.random() - 0.5) * 36, z = this.target.z + (Math.random() - 0.5) * 36;
    const y = anyHeight ? Math.random() * 14 : 12 + Math.random() * 3;
    arr[o] = x; arr[o + 1] = y + 0.45; arr[o + 2] = z;
    arr[o + 3] = x - 0.04; arr[o + 4] = y; arr[o + 5] = z;
  }

  // ------------------------------------------------ farmer and dog

  private freeTile(near: Actor, r: number) {
    const s = this.store;
    for (let i = 0; i < 24; i++) {
      const x = Math.floor(near.x + (Math.random() - 0.5) * r * 2);
      const y = Math.floor(near.y + (Math.random() - 0.5) * r * 2);
      if (s.isUnlocked(x, y) && !s.objectAt(x, y)) return { x: x + 0.5, y: y + 0.5 };
    }
    return null;
  }

  private step(a: Actor, speed: number, dt: number) {
    const dx = a.tx - a.x, dy = a.ty - a.y;
    if (Math.abs(dx) + Math.abs(dy) < 0.03) { a.moving = false; a.x = a.tx; a.y = a.ty; return true; }
    a.moving = true;
    const mv = speed * dt;
    // walk along one axis at a time, like following the tile grid
    if (Math.abs(dx) > 0.02) { const m = Math.sign(dx) * Math.min(Math.abs(dx), mv); a.x += m; a.heading = m > 0 ? Math.PI / 2 : -Math.PI / 2; }
    else { const m = Math.sign(dy) * Math.min(Math.abs(dy), mv); a.y += m; a.heading = m > 0 ? 0 : Math.PI; }
    return false;
  }

  private updateActors(dt: number, t: number) {
    const f = this.farmer, g = this.dog;
    if (!this.store.isUnlocked(Math.floor(f.x), Math.floor(f.y))) {
      const c = this.store.viewCenter();
      f.x = f.tx = c.x + 0.5; f.y = f.ty = c.y + 0.5;
    }
    if (this.step(f, 1.2, dt)) {
      f.wait -= dt;
      if (f.wait <= 0) {
        const n = this.freeTile(f, 5);
        if (n) { f.tx = n.x; f.ty = n.y; }
        f.wait = 1.5 + Math.random() * 4;
      }
    }
    const fd = Math.abs(g.x - f.x) + Math.abs(g.y - f.y);
    if (fd > 2.2 || (fd > 0.9 && !g.moving && Math.random() < dt * 0.8)) {
      g.tx = f.x + (Math.random() < 0.5 ? 0.6 : -0.6);
      g.ty = f.y + (Math.random() < 0.5 ? 0.5 : -0.5);
    } else if (!g.moving && Math.random() < dt * 0.15) {
      const n = this.freeTile(g, 2);
      if (n) { g.tx = n.x; g.ty = n.y; }
    }
    if (fd > 8) { g.x = f.x; g.y = f.y; }
    this.step(g, 1.9, dt);
    for (const a of [f, g]) {
      a.phase += dt * (a.moving ? (a === g ? 16 : 10) : 0);
      a.g.position.set(a.x, a.moving ? Math.abs(Math.sin(a.phase)) * 0.03 : 0, a.y);
      const cur = a.g.rotation.y;
      let diff = a.heading - cur;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      a.g.rotation.y = cur + diff * Math.min(1, dt * 10);
      animateLegs(a.g, a.moving ? Math.sin(a.phase) * 0.7 : 0);
      if (a === g) { const tail = a.g.userData.tail as THREE.Object3D; if (tail) tail.rotation.z = Math.sin(t / (a.moving ? 60 : 120)) * 0.6; }
    }
  }
}

// ------------------------------------------------------------------ model builders

function shade(hex: string, p: number) {
  return '#' + new THREE.Color(hex).offsetHSL(0, 0, p).getHexString();
}

function legPivot(g: THREE.Group, x: number, y: number, z: number, len: number, th: number, color: string, list: THREE.Object3D[]) {
  const p = group(g, x, y, z);
  bx(p, th, len, th, color, 0, -len, 0);
  list.push(p);
  return p;
}

function animateLegs(g: THREE.Object3D, s: number) {
  const legs = g.userData.legs as THREE.Object3D[] | undefined;
  const signs = g.userData.signs as number[] | undefined;
  if (legs && signs) legs.forEach((l, i) => { l.rotation.x = s * signs[i]; });
  const arms = g.userData.arms as THREE.Object3D[] | undefined;
  if (arms) arms.forEach((a, i) => { a.rotation.x = s * (i ? 0.8 : -0.8); });
}

export function buildFarmer() {
  const g = new THREE.Group();
  const legs: THREE.Object3D[] = [];
  legPivot(g, -0.05, 0.3, 0, 0.28, 0.075, '#2f5d8a', legs);
  legPivot(g, 0.05, 0.3, 0, 0.28, 0.075, '#2f5d8a', legs);
  legs.forEach((l) => bx(l, 0.085, 0.05, 0.12, '#5a3517', 0, -0.3, 0.02));
  bx(g, 0.24, 0.12, 0.16, '#3b6fa8', 0, 0.26, 0);
  bx(g, 0.24, 0.2, 0.15, '#d64541', 0, 0.36, 0);
  bx(g, 0.03, 0.14, 0.01, '#3b6fa8', -0.06, 0.4, 0.08);
  bx(g, 0.03, 0.14, 0.01, '#3b6fa8', 0.06, 0.4, 0.08);
  const arms: THREE.Object3D[] = [];
  for (const sx of [-1, 1]) {
    const a = group(g, sx * 0.15, 0.54, 0);
    bx(a, 0.06, 0.2, 0.06, '#d64541', 0, -0.2, 0);
    ball(a, 0.035, '#f2c49b', 0, -0.23, 0);
    arms.push(a);
  }
  ball(g, 0.1, '#f2c49b', 0, 0.66, 0);
  ball(g, 0.015, '#3a2616', -0.035, 0.68, 0.09);
  ball(g, 0.015, '#3a2616', 0.035, 0.68, 0.09);
  cyl(g, 0.19, 0.19, 0.02, '#d9a93f', 0, 0.72, 0, 12);
  cyl(g, 0.09, 0.1, 0.09, '#e8c35a', 0, 0.73, 0, 10);
  cyl(g, 0.101, 0.101, 0.025, '#b5452c', 0, 0.74, 0, 10);
  g.userData.legs = legs;
  g.userData.signs = [1, -1];
  g.userData.arms = arms;
  return g;
}

export function buildDog() {
  const g = new THREE.Group();
  const legs: THREE.Object3D[] = [];
  for (const [x, z] of [[-0.05, 0.1], [0.05, 0.1], [-0.05, -0.1], [0.05, -0.1]]) legPivot(g, x, 0.12, z, 0.11, 0.035, '#8a5a2b', legs);
  bx(g, 0.12, 0.1, 0.28, '#b07a3f', 0, 0.1, 0);
  bx(g, 0.1, 0.06, 0.2, '#f1dcb8', 0, 0.09, 0.01);
  bx(g, 0.12, 0.11, 0.12, '#b07a3f', 0, 0.18, 0.17);
  bx(g, 0.07, 0.05, 0.08, '#f1dcb8', 0, 0.18, 0.25);
  ball(g, 0.018, '#2a1a10', 0, 0.23, 0.29);
  bx(g, 0.03, 0.07, 0.04, '#6b4424', -0.06, 0.25, 0.15);
  bx(g, 0.03, 0.07, 0.04, '#6b4424', 0.06, 0.25, 0.15);
  const tail = group(g, 0, 0.18, -0.14);
  bx(tail, 0.025, 0.12, 0.025, '#b07a3f', 0, 0, 0);
  tail.rotation.x = -0.6;
  g.userData.tail = tail;
  g.userData.legs = legs;
  g.userData.signs = [1, -1, -1, 1];
  return g;
}

// ------------------------------------------------------------------ animals

function quadruped(body: [number, number, number], bodyColor: string, legLen: number, legColor: string, legTh = 0.05) {
  const g = new THREE.Group();
  const legs: THREE.Object3D[] = [];
  const [w, h, d] = body;
  for (const [x, z] of [[-w / 2 + legTh, d / 2 - legTh], [w / 2 - legTh, d / 2 - legTh], [-w / 2 + legTh, -d / 2 + legTh], [w / 2 - legTh, -d / 2 + legTh]]) {
    legPivot(g, x, legLen, z, legLen, legTh, legColor, legs);
  }
  bx(g, w, h, d, bodyColor, 0, legLen, 0);
  g.userData.legs = legs;
  g.userData.signs = [1, -1, -1, 1];
  return g;
}

function buildAnimal(kind: string) {
  switch (kind) {
    case 'chicken': {
      const g = new THREE.Group();
      const legs: THREE.Object3D[] = [];
      legPivot(g, -0.03, 0.07, 0, 0.07, 0.015, '#f0a030', legs);
      legPivot(g, 0.03, 0.07, 0, 0.07, 0.015, '#f0a030', legs);
      ball(g, 0.09, '#ffffff', 0, 0.13, 0, 1, 0.9, 1.2);
      ball(g, 0.055, '#ffffff', 0, 0.24, 0.07);
      mk(g, cylGeo(0, 0.02, 4), M('#f0a030'), 1, 0.05, 1, 0, 0.24, 0.13).rotation.x = Math.PI / 2;
      ball(g, 0.025, '#e0312b', 0, 0.3, 0.07, 0.6, 1, 1.4);
      ball(g, 0.04, '#f5f5f5', 0, 0.17, -0.1, 0.8, 1.2, 0.8);
      g.userData.legs = legs; g.userData.signs = [1, -1];
      return g;
    }
    case 'cow': {
      const g = quadruped([0.24, 0.2, 0.42], '#ffffff', 0.16, '#f5f5f5', 0.055);
      bx(g, 0.245, 0.09, 0.12, '#2b2b2b', 0, 0.23, 0.05);
      bx(g, 0.245, 0.07, 0.09, '#2b2b2b', 0, 0.2, -0.12);
      bx(g, 0.15, 0.15, 0.15, '#ffffff', 0, 0.26, 0.25);
      bx(g, 0.14, 0.07, 0.05, '#f2a7b5', 0, 0.26, 0.33);
      bx(g, 0.03, 0.05, 0.03, '#e8d8b0', -0.06, 0.41, 0.24);
      bx(g, 0.03, 0.05, 0.03, '#e8d8b0', 0.06, 0.41, 0.24);
      bx(g, 0.08, 0.03, 0.04, '#2b2b2b', -0.09, 0.37, 0.24);
      bx(g, 0.08, 0.03, 0.04, '#2b2b2b', 0.09, 0.37, 0.24);
      ball(g, 0.05, '#f2a7b5', 0, 0.13, -0.08, 1, 0.6, 1);
      return g;
    }
    case 'pig': {
      const g = quadruped([0.2, 0.16, 0.3], '#f4a9b8', 0.09, '#e8909f', 0.045);
      ball(g, 0.14, '#f4a9b8', 0, 0.2, 0, 0.8, 0.7, 1.15);
      mk(g, cylGeo(0.045, 0.045, 8), M('#e8909f'), 1, 0.04, 1, 0, 0.2, 0.18).rotation.x = Math.PI / 2;
      mk(g, cylGeo(0, 0.035, 4), M('#e8909f'), 1, 0.06, 1, -0.06, 0.3, 0.12);
      mk(g, cylGeo(0, 0.035, 4), M('#e8909f'), 1, 0.06, 1, 0.06, 0.3, 0.12);
      return g;
    }
    case 'sheep': {
      const g = quadruped([0.16, 0.12, 0.26], '#f7f3ea', 0.12, '#3a3a3a', 0.035);
      for (const [x, y, z] of [[0, 0.24, 0], [-0.07, 0.22, 0.07], [0.07, 0.22, 0.07], [-0.07, 0.22, -0.08], [0.07, 0.22, -0.08], [0, 0.29, 0.02]]) ball(g, 0.09, '#f7f3ea', x, y, z);
      bx(g, 0.09, 0.11, 0.11, '#3a3a3a', 0, 0.22, 0.18);
      bx(g, 0.05, 0.03, 0.04, '#3a3a3a', -0.07, 0.28, 0.16);
      bx(g, 0.05, 0.03, 0.04, '#3a3a3a', 0.07, 0.28, 0.16);
      return g;
    }
    case 'duck': {
      const g = new THREE.Group();
      ball(g, 0.08, '#ffffff', 0, 0.06, 0, 1, 0.75, 1.35);
      ball(g, 0.05, '#2e7d4a', 0, 0.15, 0.08);
      bx(g, 0.05, 0.02, 0.06, '#f0a030', 0, 0.13, 0.13);
      ball(g, 0.03, '#f0f0f0', 0, 0.08, -0.11, 0.8, 0.6, 1);
      g.userData.legs = []; g.userData.signs = [];
      return g;
    }
    case 'goat': {
      const g = quadruped([0.16, 0.15, 0.3], '#ece6da', 0.15, '#d8d0c0', 0.04);
      bx(g, 0.1, 0.12, 0.14, '#ece6da', 0, 0.3, 0.19);
      mk(g, cylGeo(0.005, 0.02, 5), M('#8a8f96'), 1, 0.12, 1, -0.035, 0.46, 0.16).rotation.x = -0.6;
      mk(g, cylGeo(0.005, 0.02, 5), M('#8a8f96'), 1, 0.12, 1, 0.035, 0.46, 0.16).rotation.x = -0.6;
      bx(g, 0.03, 0.06, 0.03, '#d8d0c0', 0, 0.24, 0.25);
      bx(g, 0.06, 0.03, 0.04, '#d8d0c0', -0.07, 0.36, 0.17);
      bx(g, 0.06, 0.03, 0.04, '#d8d0c0', 0.07, 0.36, 0.17);
      return g;
    }
    case 'horse': {
      const g = quadruped([0.18, 0.2, 0.46], '#8a5a2b', 0.28, '#6b4424', 0.05);
      const neck = bx(g, 0.1, 0.26, 0.12, '#8a5a2b', 0, 0.4, 0.2);
      neck.rotation.x = 0.5;
      bx(g, 0.1, 0.1, 0.22, '#8a5a2b', 0, 0.58, 0.32);
      bx(g, 0.03, 0.2, 0.1, '#3a2616', 0, 0.48, 0.15).rotation.x = 0.5;
      bx(g, 0.03, 0.06, 0.03, '#6b4424', -0.03, 0.67, 0.25);
      bx(g, 0.03, 0.06, 0.03, '#6b4424', 0.03, 0.67, 0.25);
      const tail = bx(g, 0.04, 0.22, 0.04, '#3a2616', 0, 0.22, -0.25);
      tail.rotation.x = -0.35;
      return g;
    }
    default:
      return new THREE.Group();
  }
}

function buildHive() {
  const g = new THREE.Group();
  bx(g, 0.3, 0.06, 0.3, '#a8733f', 0, 0, 0);
  bx(g, 0.26, 0.14, 0.26, '#fff1c4', 0, 0.06, 0);
  bx(g, 0.26, 0.14, 0.26, '#f5d67a', 0, 0.2, 0);
  bx(g, 0.32, 0.04, 0.32, '#d9a93f', 0, 0.34, 0);
  bx(g, 0.08, 0.02, 0.01, '#3a2616', 0, 0.09, 0.131);
  const bees = group(g);
  for (let i = 0; i < 3; i++) {
    const b = group(bees);
    ball(b, 0.022, '#f5c518', 0, 0, 0, 1.2, 1, 1, false);
    ball(b, 0.014, '#ffffff', 0, 0.02, 0, 1.4, 0.4, 0.8, false);
  }
  g.userData.bees = bees;
  return g;
}

function animalSpot(d: BuildingDef, id: number, t: number) {
  const u = hash(id, 1, 3), v = hash(id, 2, 5);
  const m = d.w >= 3 ? 0.55 : 0.45;
  let cx = m + u * (d.w - m * 2), cz = m + v * (d.h - m * 2);
  if (cx < 1.1 && cz < 1.1) { cx += 0.6; cz += 0.3; }
  const ph = (t / 5200) * (0.5 + u * 0.5) + id * 1.3 + 0.35 * Math.sin(t / 2300 + id);
  const r = 0.2 + v * 0.14;
  const x = clamp(cx + Math.cos(ph) * r, 0.3, d.w - 0.3);
  const z = clamp(cz + Math.sin(ph) * r * 0.8, 0.3, d.h - 0.3);
  return { x, z, heading: Math.atan2(-Math.sin(ph), Math.cos(ph) * 0.8) };
}

// ------------------------------------------------------------------ crops

function plantModel(cd: CropDef) {
  const g = new THREE.Group();
  const fruit: THREE.Mesh[] = [];
  const L = cd.leaf, F = cd.fruit;
  switch (cd.shape) {
    case 'grain':
      cyl(g, 0.015, 0.05, 0.3, L, 0, 0, 0, 5, false);
      fruit.push(ball(g, 0.05, F, 0, 0.34, 0, 1, 2, 1, false));
      break;
    case 'stalk':
      cyl(g, 0.018, 0.03, 0.52, L, 0, 0, 0, 5, false);
      bx(g, 0.22, 0.015, 0.05, L, 0, 0.2, 0, false).rotation.z = 0.4;
      bx(g, 0.22, 0.015, 0.05, L, 0, 0.3, 0, false).rotation.z = -0.4;
      fruit.push(ball(g, 0.04, F, 0.04, 0.34, 0.02, 1, 2.1, 1, false));
      break;
    case 'root':
      for (const r of [-0.4, 0, 0.4]) mk(g, cylGeo(0, 0.04, 5), M(L), 1, 0.22, 1, Math.sin(r) * 0.04, 0.11, 0, false).rotation.z = r;
      fruit.push(ball(g, 0.06, F, 0, 0.02, 0, 1, 0.8, 1, false));
      break;
    case 'bush':
      ball(g, 0.12, L, 0, 0.12, 0, 1, 0.9, 1, false);
      for (const [x, y, z] of [[0.08, 0.14, 0.06], [-0.07, 0.1, 0.08], [0.02, 0.2, 0.09], [-0.06, 0.17, -0.06]]) fruit.push(ball(g, 0.035, F, x, y, z, 1, 1, 1, false));
      break;
    case 'vine':
      ball(g, 0.09, L, -0.06, 0.03, 0.04, 1, 0.4, 1, false);
      ball(g, 0.08, L, 0.07, 0.03, -0.05, 1, 0.4, 1, false);
      fruit.push(ball(g, 0.1, F, 0, 0.07, 0, 1, 0.75, 1, false));
      break;
    case 'flower': {
      cyl(g, 0.012, 0.02, 0.48, L, 0, 0, 0, 5, false);
      bx(g, 0.14, 0.012, 0.05, L, 0, 0.22, 0, false).rotation.z = 0.35;
      const head = mk(g, cylGeo(0.09, 0.09, 10), M(F), 1, 0.03, 1, 0, 0.5, 0.02, false);
      head.rotation.x = 1.0;
      const c = mk(g, cylGeo(0.045, 0.045, 8), M('#6b3f1f'), 1, 0.035, 1, 0, 0.505, 0.03, false);
      c.rotation.x = 1.0;
      fruit.push(head);
      break;
    }
    case 'cane':
      for (const [x, z] of [[-0.04, 0], [0.04, 0.03], [0, -0.04]]) cyl(g, 0.018, 0.022, 0.55, L, x, 0, z, 5, false);
      fruit.push(ball(g, 0.03, F, 0, 0.56, 0, 1, 1, 1, false));
      break;
  }
  return { g, fruit };
}

// ------------------------------------------------------------------ object builders

function buildObject(e: Entry, o: FarmObject, d: BuildingDef, store: GameStore) {
  switch (d.kind) {
    case 'plot': return buildPlot(e);
    case 'house': case 'barn': return buildHouse(e, d);
    case 'production': return d.id === 'fishing_pier' ? buildPier(e, d) : buildHouse(e, d);
    case 'silo': return buildSilo(e);
    case 'board': return buildBoard(e);
    case 'pen': return buildPen(e, d);
    case 'tree': return buildFruitTree(e, d);
    case 'stall': return buildStall(e, d, store);
    case 'dock': return buildDock(e, store);
    case 'obstacle': return buildObstacle(e, o);
    case 'deco': return buildDeco(e, d);
  }
}

function buildPlot(e: Entry) {
  const g = e.root;
  bx(g, 0.92, 0.1, 0.92, '#8a5a34', 0.5, 0, 0.5, false);
  for (let k = 0; k < 3; k++) bx(g, 0.8, 0.02, 0.06, '#6e4424', 0.5, 0.1, 0.27 + k * 0.23, false);
  const crop = group(g);
  let cur: string | null = null;
  let plants: { g: THREE.Group; fruit: THREE.Mesh[]; ripe: number }[] = [];
  e.top = 0.55;
  e.update = (o, now, t) => {
    const pp = plotProgress(o, now);
    if (pp.crop !== cur) {
      crop.clear();
      plants = [];
      cur = pp.crop;
      if (cur) {
        const cd = CROP[cur];
        for (const [x, z] of [[0.3, 0.3], [0.7, 0.3], [0.3, 0.7], [0.7, 0.7]]) {
          const pm = plantModel(cd);
          pm.g.position.set(x, 0.1, z);
          pm.g.userData.base = 1.5;
          pm.g.rotation.y = hash(x * 10, z * 10, 3) * 6;
          crop.add(pm.g);
          plants.push({ ...pm, ripe: -1 });
        }
      }
    }
    if (!cur) return;
    const cd = CROP[cur];
    const s = pp.p;
    plants.forEach((pl, i) => {
      const k = 1.5;
      pl.g.scale.set(k * (0.5 + 0.5 * s), k * (0.2 + 0.8 * s), k * (0.5 + 0.5 * s));
      pl.g.rotation.z = Math.sin(t / (pp.ready ? 420 : 900) + i + o.id) * (pp.ready ? 0.1 : 0.03);
      const ripe = pp.ready ? 1 : 0;
      for (const f of pl.fruit) { f.visible = s > 0.45; }
      if (pl.ripe !== ripe) {
        for (const f of pl.fruit) f.material = ripe ? M(cd.fruit) : M(cd.shape === 'flower' ? '#9cc45a' : '#b9d36a');
        pl.ripe = ripe;
      }
    });
  };
}

function smoke(g: THREE.Group, x: number, y: number, z: number) {
  const puffs = [0, 1, 2].map(() => {
    const m = new THREE.Mesh(G.ball, new THREE.MeshLambertMaterial({ color: '#f0f0f0', transparent: true, opacity: 0.6, flatShading: true, depthWrite: false }));
    g.add(m);
    return m;
  });
  return (on: boolean, t: number) => {
    puffs.forEach((m, k) => {
      m.visible = on;
      if (!on) return;
      const ph = (t / 1700 + k / 3) % 1;
      m.position.set(x + ph * 0.3 + Math.sin(t / 500 + k) * 0.04, y + ph * 1.1, z - ph * 0.1);
      const s = 0.08 + ph * 0.16;
      m.scale.set(s, s, s);
      (m.material as THREE.MeshLambertMaterial).opacity = 0.6 * (1 - ph);
    });
  };
}

function buildHouse(e: Entry, d: BuildingDef) {
  const g = e.root;
  const w = d.w, h = d.h, H = d.height * ZU;
  const cx = w / 2, cz = h / 2, ww = w - 0.5, dd = h - 0.5, y0 = 0.08;
  bx(g, w - 0.14, y0, h - 0.14, '#b3ad9c', cx, 0, cz);
  bx(g, ww, H, dd, d.wall, cx, y0, cz);
  const rh = 0.45 + Math.min(ww, dd) * 0.3;
  roof(g, ww + 0.34, rh, dd + 0.34, d.roof, cx, y0 + H, cz);
  bx(g, ww + 0.4, 0.06, 0.09, shade(d.roof, -0.12), cx, y0 + H + rh - 0.05, cz);
  const fz = cz + dd / 2, rx = cx + ww / 2;
  const barn = d.kind === 'barn';
  // door on the front face
  const doorX = d.kind === 'house' ? cx - ww * 0.22 : cx;
  const dh = H * (barn ? 0.62 : 0.5);
  bx(g, barn ? 0.5 : 0.3, dh, 0.04, barn ? '#8e2c20' : '#6b4226', doorX, y0, fz + 0.01);
  if (barn) {
    for (const r of [0.85, -0.85]) { const m = bx(g, 0.035, dh * 1.15, 0.02, '#fbeee0', doorX, y0 + dh / 2 - dh * 0.575, fz + 0.04); m.rotation.z = r; m.position.y = y0 + dh / 2; }
    bx(g, 0.3, 0.26, 0.03, '#fbeee0', cx, y0 + H * 0.74, fz + 0.01);
    for (const x of [cx - ww / 2, cx + ww / 2]) bx(g, 0.06, H, 0.06, '#fbeee0', x, y0, fz);
    for (const z of [cz - dd / 2, cz + dd / 2]) bx(g, 0.06, H, 0.06, '#fbeee0', rx, y0, z);
    bx(g, ww, 0.06, 0.05, '#fbeee0', cx, y0 + H - 0.06, fz);
  } else {
    ball(g, 0.02, '#e9c46a', doorX + 0.09, y0 + dh * 0.5, fz + 0.04);
    bx(g, 0.34, 0.04, 0.14, '#9a968a', doorX, y0, fz + 0.08);
  }
  if (d.kind === 'house') {
    mk(g, G.box, WIN, 0.3, 0.26, 0.04, cx + ww * 0.2, y0 + H * 0.55, fz + 0.01);
    bx(g, 0.36, 0.04, 0.08, '#8a5a2b', cx + ww * 0.2, y0 + H * 0.36, fz + 0.03);
    for (let i = 0; i < 3; i++) ball(g, 0.03, ['#ff6b8a', '#ffd23a', '#ffffff'][i], cx + ww * 0.2 - 0.1 + i * 0.1, y0 + H * 0.36 + 0.07, fz + 0.05);
  }
  // windows on the right face
  const nW = dd > 1.3 ? 2 : 1;
  for (let i = 0; i < nW; i++) {
    const z = cz - dd / 2 + ((i + 1) * dd) / (nW + 1);
    bx(g, 0.03, 0.34, 0.36, '#ffffff', rx + 0.005, y0 + H * 0.38, z);
    mk(g, G.box, WIN, 0.04, 0.28, 0.3, rx + 0.01, y0 + H * 0.38 + 0.17, z);
    bx(g, 0.045, 0.28, 0.02, '#ffffff', rx + 0.012, y0 + H * 0.38 + 0.03, z);
  }
  let puff: ((on: boolean, t: number) => void) | null = null;
  if (!barn) {
    const chx = cx + ww * 0.25, chz = cz - dd * 0.1;
    bx(g, 0.16, 0.55 + rh * 0.3, 0.16, '#8c4a3a', chx, y0 + H + rh * 0.2, chz);
    puff = smoke(g, chx, y0 + H + rh * 0.5 + 0.6, chz);
  }
  if (d.kind === 'production') badge(g, d.icon, 0.34, cx, y0 + dh + 0.24, fz + 0.035);
  e.top = y0 + H + rh;
  e.update = (o, now, t) => {
    if (puff) puff(d.kind === 'house' || !!prodInfo(o, now).current, t);
  };
}

function buildSilo(e: Entry) {
  const g = e.root;
  cyl(g, 0.4, 0.42, 2.0, '#d7dbe0', 0.5, 0, 0.5, 14);
  for (const y of [0.5, 1.0, 1.5]) cyl(g, 0.43, 0.43, 0.05, '#aab0b8', 0.5, y, 0.5, 14);
  mk(g, G.dome, M('#c0392b'), 0.41, 0.36, 0.41, 0.5, 2.0, 0.5);
  bx(g, 0.03, 1.9, 0.03, '#7d838b', 0.93, 0, 0.44);
  bx(g, 0.03, 1.9, 0.03, '#7d838b', 0.93, 0, 0.58);
  for (let i = 1; i < 10; i++) bx(g, 0.02, 0.02, 0.15, '#7d838b', 0.93, i * 0.19, 0.51);
  e.top = 2.4;
}

function buildBoard(e: Entry) {
  const g = e.root;
  cyl(g, 0.04, 0.04, 1.0, '#6b4226', 0.18, 0, 0.5, 6);
  cyl(g, 0.04, 0.04, 1.0, '#6b4226', 0.82, 0, 0.5, 6);
  bx(g, 0.8, 0.52, 0.07, '#a0692f', 0.5, 0.4, 0.5);
  for (let i = 0; i < 3; i++) bx(g, 0.18, 0.22, 0.012, ['#fff8e6', '#e6f4ff', '#fff0f0'][i], 0.26 + i * 0.24, 0.55 + (i % 2) * 0.05, 0.54);
  roof(g, 0.98, 0.16, 0.26, '#6b4226', 0.5, 0.95, 0.5);
  e.top = 1.2;
}

function fence(g: THREE.Group, w: number, h: number) {
  const c = '#9c6a35';
  const pts: [number, number][] = [];
  for (let x = 0.05; x <= w - 0.04; x += 0.5) { pts.push([x, 0.05], [x, h - 0.05]); }
  for (let z = 0.55; z <= h - 0.5; z += 0.5) { pts.push([0.05, z], [w - 0.05, z]); }
  pts.push([w - 0.05, 0.05], [w - 0.05, h - 0.05]);
  for (const [x, z] of pts) bx(g, 0.06, 0.34, 0.06, c, x, 0, z);
  for (const y of [0.13, 0.26]) {
    bx(g, w - 0.1, 0.035, 0.03, c, w / 2, y, 0.05);
    bx(g, w - 0.1, 0.035, 0.03, c, w / 2, y, h - 0.05);
    bx(g, 0.03, 0.035, h - 0.1, c, 0.05, y, h / 2);
    bx(g, 0.03, 0.035, h - 0.1, c, w - 0.05, y, h / 2);
  }
}

function buildPen(e: Entry, d: BuildingDef) {
  const g = e.root;
  const w = d.w, h = d.h;
  bx(g, w - 0.1, 0.04, h - 0.1, PEN_GROUND[d.id] ?? d.wall, w / 2, 0, h / 2, false);
  if (d.id !== 'beehive') fence(g, w, h);
  e.top = 0.9;
  switch (d.id) {
    case 'coop':
      bx(g, 0.72, 0.45, 0.6, '#e3cf94', 0.55, 0.04, 0.5);
      roof(g, 0.88, 0.32, 0.76, '#b5452c', 0.55, 0.49, 0.5);
      bx(g, 0.16, 0.2, 0.02, '#5a3517', 0.55, 0.1, 0.81);
      bx(g, 0.2, 0.03, 0.3, '#a8733f', 0.55, 0.04, 0.95).rotation.x = -0.4;
      break;
    case 'pigpen':
      cyl(g, 0.5, 0.55, 0.02, '#6d4f30', 1.8, 0.04, 1.7, 12, false);
      bx(g, 0.9, 0.5, 0.7, '#a88058', 0.65, 0.04, 0.55);
      roof(g, 1.05, 0.3, 0.85, '#8e44ad', 0.65, 0.54, 0.55);
      break;
    case 'duck_pond':
      cyl(g, 0.95, 1.0, 0.04, '#d8c38e', 1.7, 0.02, 1.7, 16, false);
      mk(g, cylGeo(0.85, 0.85, 16), WATER, 1, 0.04, 1, 1.7, 0.06, 1.7, false);
      bx(g, 0.5, 0.35, 0.45, '#f3e6c8', 0.45, 0.04, 0.45);
      roof(g, 0.62, 0.22, 0.58, '#2e6da4', 0.45, 0.39, 0.45);
      break;
    case 'stable':
      bx(g, 1.5, 0.75, 0.75, '#a85a3a', 1.1, 0.04, 0.5);
      roof(g, 1.66, 0.38, 0.9, '#8e2c20', 1.1, 0.79, 0.5);
      for (const x of [0.65, 1.1, 1.55]) bx(g, 0.28, 0.42, 0.03, '#6b3a22', x, 0.04, 0.88);
      e.top = 1.3;
      break;
    case 'beehive':
      for (let i = 0; i < 14; i++) {
        const x = 0.2 + hash(i, 4, 1) * 1.6, z = 0.2 + hash(i, 5, 1) * 1.6;
        cyl(g, 0.008, 0.008, 0.12, '#4f9e36', x, 0.04, z, 4, false);
        ball(g, 0.035, ['#ffd23a', '#ff8fb0', '#ffffff', '#b58cff'][i % 4], x, 0.17, z, 1, 1, 1, false);
      }
      e.top = 0.8;
      break;
    default: {
      // open shelter for cows, sheep and goats
      for (const [x, z] of [[0.25, 0.25], [1.15, 0.25], [0.25, 0.95], [1.15, 0.95]]) bx(g, 0.07, 0.6, 0.07, '#7a4b26', x, 0.04, z);
      const r = bx(g, 1.1, 0.06, 0.9, d.roof, 0.7, 0.62, 0.6);
      r.rotation.x = 0.18;
      bx(g, 0.5, 0.25, 0.35, '#e2c15a', 0.55, 0.04, 0.5);
    }
  }
  if (d.id !== 'beehive' && d.id !== 'duck_pond') {
    bx(g, 0.55, 0.12, 0.18, '#8a5a2b', w - 0.55, 0.04, h - 0.35);
    bx(g, 0.47, 0.03, 0.12, '#e2c15a', w - 0.55, 0.14, h - 0.35, false);
  }
  const herd = group(g);
  let count = -1;
  const an = ANIMAL[d.animal ?? ''];
  e.update = (o, now, t) => {
    const list = o.pen?.animals ?? [];
    if (list.length !== count) {
      herd.clear();
      count = list.length;
      for (let i = 0; i < count; i++) herd.add(an?.id === 'bee' ? buildHive() : buildAnimal(an?.id ?? ''));
    }
    herd.children.forEach((m, i) => {
      const id = list[i]?.id ?? i;
      if (an?.id === 'bee') {
        const slots = [[0.5, 0.5], [1.5, 0.5], [0.5, 1.5], [1.5, 1.5]];
        const [x, z] = slots[i % 4];
        m.position.set(x, 0.04, z);
        const bees = m.userData.bees as THREE.Group;
        bees.children.forEach((b, k) => {
          const a = t / (400 + k * 90) + k * 2 + id;
          b.position.set(Math.cos(a) * (0.25 + k * 0.05), 0.35 + Math.sin(t / 300 + k) * 0.08, Math.sin(a) * (0.25 + k * 0.05));
        });
        return;
      }
      if (an?.id === 'duck') {
        const u = hash(id, 1, 3);
        const a = t / (4200 + u * 2000) + id * 1.7;
        const r = 0.3 + u * 0.35;
        m.position.set(1.7 + Math.cos(a) * r, 0.08 + Math.sin(t / 400 + id) * 0.01, 1.7 + Math.sin(a) * r);
        m.rotation.y = Math.atan2(-Math.sin(a), Math.cos(a));
        return;
      }
      const sp = animalSpot(d, id, t);
      m.position.set(sp.x, 0.04, sp.z);
      m.rotation.y = sp.heading;
      animateLegs(m, Math.sin(t / 110 + id) * 0.28);
    });
  };
}

function buildFruitTree(e: Entry, d: BuildingDef) {
  const g = e.root;
  const leaf = TREE_LEAF[d.id] ?? '#4f9e36';
  cyl(g, 0.06, 0.09, 0.5, '#7a4b26', 0.5, 0, 0.5, 6);
  const crown = group(g, 0.5, 0, 0.5);
  ball(crown, 0.33, leaf, 0, 0.78, 0, 1, 0.85, 1);
  ball(crown, 0.22, shade(leaf, -0.05), -0.2, 0.66, 0.08);
  ball(crown, 0.22, shade(leaf, 0.04), 0.18, 0.7, -0.1);
  ball(crown, 0.2, shade(leaf, 0.08), 0.02, 1.0, 0.02);
  const fc = FRUIT_COLOR[d.fruit ?? 'apple'] ?? '#e53935';
  const spots: [number, number, number][] = [[0.28, 0.75, 0.12], [-0.12, 0.72, 0.29], [0.15, 0.92, 0.22], [-0.28, 0.8, -0.05], [0.05, 0.62, 0.3], [0.26, 0.9, -0.14], [-0.18, 0.95, 0.12], [0.3, 0.62, -0.02]];
  const fruit = spots.map(([x, y, z]) => ball(crown, d.fruit === 'cherry' ? 0.04 : 0.055, fc, x, y, z));
  e.top = 1.25;
  e.update = (o, now, t) => {
    const ti = treeInfo(o, now);
    const n = ti.ready ? fruit.length : Math.floor(ti.p * fruit.length);
    const sc = ti.ready ? 1 : 0.5 + ti.p * 0.4;
    fruit.forEach((f, i) => { f.visible = i < n; f.scale.setScalar((d.fruit === 'cherry' ? 0.04 : 0.055) * sc); });
    crown.rotation.z = Math.sin(t / 1100 + o.id) * 0.02;
  };
}

function buildStall(e: Entry, d: BuildingDef, store: GameStore) {
  const g = e.root;
  bx(g, 1.8, 0.03, 1.8, '#c9a46a', 1, 0, 1, false);
  for (const [x, z] of [[0.3, 0.3], [1.7, 0.3], [0.3, 1.7], [1.7, 1.7]]) cyl(g, 0.04, 0.04, 1.3, '#7a4b26', x, 0, z, 6);
  bx(g, 1.3, 0.45, 0.45, '#c98a45', 1, 0, 1.3);
  bx(g, 1.4, 0.05, 0.55, '#e3b075', 1, 0.45, 1.3);
  for (let i = 0; i < 3; i++) bx(g, 0.3, 0.2, 0.22, '#a8733f', 0.55 + i * 0.45, 0.03, 1.72);
  for (let i = 0; i < 7; i++) {
    const s = bx(g, 1.62 / 7, 0.04, 1.75, i % 2 ? '#fff6df' : d.roof, 0.19 + (i + 0.5) * (1.62 / 7), 1.28, 1);
    s.rotation.x = 0.18;
  }
  const goods = group(g);
  let key = '';
  e.top = 1.55;
  e.update = (_o, now) => {
    const s = store.s;
    const k = s.stall.map((x) => (x.item ? `${x.item}${x.soldAt <= now ? '$' : ''}` : '-')).join(',');
    if (k === key) return;
    key = k;
    goods.clear();
    s.stall.filter((x) => x.item).slice(0, 4).forEach((x, i) => {
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: emojiTex(x.soldAt <= now ? '💰' : ITEMS[x.item as string].icon) }));
      sp.scale.set(0.28, 0.28, 1);
      sp.position.set(0.55 + i * 0.3, 0.64, 1.3);
      goods.add(sp);
    });
  };
}

function waterBasin(g: THREE.Group, w: number, h: number) {
  bx(g, w - 0.04, 0.03, h - 0.04, '#d8c38e', w / 2, 0, h / 2, false);
  mk(g, G.box, WATER, w - 0.3, 0.04, h - 0.3, w / 2, 0.035, h / 2, false);
}

function planks(g: THREE.Group, x: number, z: number, w: number, d: number) {
  bx(g, w, 0.07, d, '#b98a52', x, 0.1, z);
  for (let i = 0; i < Math.round(d * 5); i++) bx(g, w + 0.01, 0.005, 0.02, '#8a5a34', x, 0.17, z - d / 2 + (i + 0.5) * (d / Math.round(d * 5)), false);
  for (const [px, pz] of [[x - w / 2 + 0.04, z + d / 2 - 0.04], [x + w / 2 - 0.04, z + d / 2 - 0.04], [x - w / 2 + 0.04, z], [x + w / 2 - 0.04, z]]) cyl(g, 0.035, 0.035, 0.22, '#6b4226', px, -0.05, pz, 6);
}

function buildPier(e: Entry, d: BuildingDef) {
  const g = e.root;
  waterBasin(g, 2, 2);
  planks(g, 0.45, 1, 0.55, 1.8);
  bx(g, 0.5, 0.5, 0.45, d.wall, 0.45, 0.17, 0.35);
  roof(g, 0.64, 0.24, 0.6, d.roof, 0.45, 0.67, 0.35);
  badge(g, d.icon, 0.26, 0.45, 0.45, 0.585);
  const rod = mk(g, cylGeo(0.01, 0.015, 5), M('#6b4226'), 1, 0.9, 1, 0.9, 0.55, 1.45);
  rod.rotation.z = -0.9;
  const bob = ball(g, 0.04, '#e74c3c', 1.5, 0.08, 1.45);
  const lineGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(1.26, 0.86, 1.45), new THREE.Vector3(1.5, 0.1, 1.45)]);
  const line = new THREE.Line(lineGeo, new THREE.LineBasicMaterial({ color: '#ffffff' }));
  g.add(line);
  e.top = 1.1;
  e.update = (o, now, t) => {
    const busy = !!prodInfo(o, now).current;
    bob.position.y = 0.08 + (busy ? Math.sin(t / 300) * 0.02 : 0);
  };
}

function buildDock(e: Entry, store: GameStore) {
  const g = e.root;
  waterBasin(g, 2, 2);
  planks(g, 0.4, 1, 0.5, 1.8);
  const boat = group(g, 1.35, 0.06, 1);
  bx(boat, 0.5, 0.2, 1.1, '#8e4a2b', 0, 0, 0);
  roof(boat, 0.5, 0.2, 0.3, '#8e4a2b', 0, 0, 0.6, Math.PI / 2).rotation.set(Math.PI / 2, 0, 0);
  bx(boat, 0.46, 0.03, 1.05, '#c98a45', 0, 0.2, 0);
  bx(boat, 0.51, 0.04, 1.11, '#ffffff', 0, 0.12, 0, false);
  cyl(boat, 0.025, 0.03, 1.3, '#6b4226', 0, 0.2, 0.05, 6);
  const sail = new THREE.Mesh(sailGeo(), new THREE.MeshLambertMaterial({ color: '#fffaf0', side: THREE.DoubleSide }));
  sail.scale.set(1, 1.0, 0.55);
  sail.position.set(0, 0.35, 0.08);
  sail.castShadow = true;
  boat.add(sail);
  bx(boat, 0.01, 0.1, 0.16, '#e74c3c', 0, 1.42, 0.13);
  const crates = group(boat);
  const buoy = ball(g, 0.07, '#e74c3c', 1.4, 0.1, 1.1);
  let key = '';
  e.top = 1.5;
  e.update = (_o, now, t) => {
    const s = store.s;
    const docked = boatState(s, now) === 'docked' && !!s.boat;
    boat.visible = docked;
    buoy.visible = !docked;
    boat.position.y = 0.06 + Math.sin(t / 700) * 0.015;
    boat.rotation.z = Math.sin(t / 900) * 0.03;
    buoy.position.y = 0.1 + Math.sin(t / 500) * 0.02;
    if (!docked || !s.boat) return;
    const k = s.boat.crates.map((c) => (c.filled ? 1 : 0)).join('');
    if (k === key) return;
    key = k;
    crates.clear();
    s.boat.crates.slice(0, 6).forEach((c, i) => {
      const m = mk(crates, G.box, c.filled ? M('#c98a45') : MT('#c98a45', 0.3), 0.14, 0.12, 0.14, (i % 2 ? 0.1 : -0.1), 0.28, -0.35 + Math.floor(i / 2) * 0.22);
      m.castShadow = c.filled;
    });
  };
}

function buildObstacle(e: Entry, o: FarmObject) {
  const g = e.root;
  if (o.type === 'tree_obs') {
    cyl(g, 0.07, 0.11, 0.55, '#6b3f1f', 0.5, 0, 0.5, 6);
    ball(g, 0.34, '#3d8a33', 0.5, 0.85, 0.5, 1, 0.9, 1);
    ball(g, 0.24, '#347a2c', 0.3, 0.7, 0.55);
    ball(g, 0.24, '#4a9a3c', 0.68, 0.75, 0.42);
    ball(g, 0.2, '#56a845', 0.5, 1.12, 0.5);
    e.top = 1.3;
  } else if (o.type === 'rock_obs') {
    mk(g, G.rock, M('#9a9ea3'), 0.34, 0.24, 0.3, 0.48, 0.18, 0.5).rotation.y = 0.6;
    mk(g, G.rock, M('#83878c'), 0.16, 0.12, 0.15, 0.78, 0.08, 0.7);
    ball(g, 0.06, '#6aa84f', 0.25, 0.04, 0.72, 1, 0.5, 1);
    e.top = 0.5;
  } else {
    ball(g, 0.2, '#3f8a34', 0.38, 0.18, 0.5);
    ball(g, 0.2, '#4d9a3c', 0.62, 0.18, 0.45);
    ball(g, 0.22, '#5aab45', 0.5, 0.3, 0.55);
    ball(g, 0.035, '#d9434b', 0.62, 0.3, 0.72);
    ball(g, 0.035, '#d9434b', 0.4, 0.36, 0.7);
    e.top = 0.55;
  }
}

function buildDeco(e: Entry, d: BuildingDef) {
  const g = e.root;
  e.top = d.height * ZU + 0.2;
  switch (d.id) {
    case 'hay_bale': {
      const m = mk(g, cylGeo(0.2, 0.2, 10), M('#e2c15a'), 1, 0.55, 1, 0.5, 0.2, 0.5);
      m.rotation.z = Math.PI / 2;
      for (const x of [0.35, 0.65]) { const b = mk(g, cylGeo(0.205, 0.205, 10), M('#b8923a'), 1, 0.03, 1, x, 0.2, 0.5, false); b.rotation.z = Math.PI / 2; }
      break;
    }
    case 'oak':
      cyl(g, 0.06, 0.09, 0.5, '#7a4b26', 0.5, 0, 0.5, 6);
      ball(g, 0.32, '#4f9e36', 0.5, 0.8, 0.5, 1, 0.9, 1);
      ball(g, 0.22, '#468f30', 0.3, 0.66, 0.56);
      ball(g, 0.22, '#5aab45', 0.7, 0.7, 0.44);
      ball(g, 0.18, '#62b34c', 0.52, 1.02, 0.5);
      e.top = 1.25;
      break;
    case 'flowers': {
      bx(g, 0.8, 0.08, 0.8, '#6d4522', 0.5, 0, 0.5);
      bx(g, 0.72, 0.03, 0.72, '#5a8f3a', 0.5, 0.08, 0.5, false);
      const cols = ['#ff6b8a', '#ffd23a', '#ffffff', '#b58cff', '#ff9f43'];
      for (let i = 0; i < 12; i++) {
        const x = 0.2 + (i % 4) * 0.2, z = 0.22 + Math.floor(i / 4) * 0.28;
        cyl(g, 0.008, 0.008, 0.1, '#4f9e36', x, 0.1, z, 4, false);
        ball(g, 0.045, cols[i % cols.length], x, 0.22, z, 1, 0.7, 1, false);
      }
      break;
    }
    case 'bench':
      bx(g, 0.72, 0.05, 0.26, '#a8733f', 0.5, 0.2, 0.5);
      bx(g, 0.72, 0.2, 0.04, '#a8733f', 0.5, 0.27, 0.38);
      for (const x of [0.2, 0.8]) for (const z of [0.4, 0.6]) bx(g, 0.04, 0.2, 0.04, '#4a3a30', x, 0, z);
      break;
    case 'lamp':
      cyl(g, 0.03, 0.04, 1.1, '#3a3a3a', 0.5, 0, 0.5, 6);
      mk(g, G.box, LAMP, 0.15, 0.18, 0.15, 0.5, 1.19, 0.5);
      mk(g, cylGeo(0, 0.13, 4), M('#3a3a3a'), 1, 0.1, 1, 0.5, 1.33, 0.5).rotation.y = Math.PI / 4;
      e.top = 1.45;
      break;
    case 'scarecrow':
      cyl(g, 0.03, 0.03, 1.0, '#7a4b26', 0.5, 0, 0.5, 5);
      bx(g, 0.62, 0.04, 0.04, '#7a4b26', 0.5, 0.72, 0.5);
      bx(g, 0.3, 0.3, 0.12, '#c0392b', 0.5, 0.5, 0.5);
      ball(g, 0.1, '#f1dcb8', 0.5, 0.95, 0.5);
      cyl(g, 0.17, 0.17, 0.02, '#d9a93f', 0.5, 1.02, 0.5, 10);
      mk(g, cylGeo(0.03, 0.09, 8), M('#b8923a'), 1, 0.16, 1, 0.5, 1.12, 0.5);
      e.top = 1.3;
      break;
    case 'windmill': {
      mk(g, cylGeo(0.35, 0.55, 8), M('#f3ead6'), 1, 2.0, 1, 1, 1.0, 1);
      mk(g, cylGeo(0, 0.42, 8), M('#8e2c20'), 1, 0.45, 1, 1, 2.22, 1);
      bx(g, 0.26, 0.4, 0.04, '#6b4226', 1, 0, 1.52);
      const hub = group(g, 1, 1.75, 1.42);
      ball(hub, 0.08, '#6b4226', 0, 0, 0.02);
      for (let i = 0; i < 4; i++) {
        const arm = group(hub);
        arm.rotation.z = (i * Math.PI) / 2;
        bx(arm, 0.05, 0.85, 0.02, '#6b4226', 0, 0, 0.05);
        bx(arm, 0.2, 0.6, 0.015, '#fff8e6', 0.12, 0.25, 0.06);
      }
      e.top = 2.7;
      e.update = (_o, _n, t) => { hub.rotation.z = -t / 900; };
      break;
    }
    case 'pond':
      cyl(g, 0.9, 0.95, 0.04, '#d8c38e', 1, 0, 1, 16, false);
      mk(g, cylGeo(0.8, 0.8, 16), WATER, 1, 0.04, 1, 1, 0.04, 1, false);
      for (const [x, z] of [[0.6, 1.2], [1.3, 0.7], [1.4, 1.3]]) cyl(g, 0.1, 0.1, 0.01, '#4caf50', x, 0.065, z, 8, false);
      ball(g, 0.04, '#ff8fb0', 1.3, 0.1, 0.7);
      for (let k = 0; k < 5; k++) cyl(g, 0.01, 0.012, 0.35, '#5a8a2a', 1.75 + (k % 2) * 0.06, 0, 0.6 + k * 0.08, 4);
      e.top = 0.5;
      break;
    case 'fountain': {
      cyl(g, 0.85, 0.9, 0.22, '#a9a496', 1, 0, 1, 16);
      mk(g, cylGeo(0.75, 0.75, 16), WATER, 1, 0.04, 1, 1, 0.2, 1, false);
      cyl(g, 0.1, 0.14, 0.6, '#bfb9a8', 1, 0.2, 1, 8);
      cyl(g, 0.34, 0.28, 0.08, '#cfcabb', 1, 0.75, 1, 12);
      mk(g, cylGeo(0.3, 0.3, 12), WATER, 1, 0.02, 1, 1, 0.83, 1, false);
      const drops = [...Array(10)].map(() => ball(g, 0.03, '#d2f0ff', 1, 1, 1, 1, 1, 1, false));
      e.top = 1.2;
      e.update = (_o, _n, t) => {
        drops.forEach((m, k) => {
          const a = (k / drops.length) * Math.PI * 2;
          const ph = (t / 900 + k * 0.13) % 1;
          m.position.set(1 + Math.cos(a) * 0.45 * ph, 0.95 + Math.sin(ph * Math.PI) * 0.3 - ph * 0.7, 1 + Math.sin(a) * 0.45 * ph);
        });
      };
      break;
    }
    case 'mailbox':
      cyl(g, 0.025, 0.025, 0.55, '#6b4226', 0.5, 0, 0.5, 5);
      bx(g, 0.18, 0.15, 0.3, '#2e6da4', 0.5, 0.55, 0.5);
      bx(g, 0.02, 0.18, 0.02, '#e74c3c', 0.6, 0.62, 0.45);
      bx(g, 0.02, 0.06, 0.08, '#e74c3c', 0.6, 0.74, 0.41);
      e.top = 0.9;
      break;
    case 'gazebo':
      cyl(g, 0.85, 0.9, 0.1, '#e6e0d0', 1, 0, 1, 8);
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
        cyl(g, 0.035, 0.035, 0.9, '#fdfaf2', 1 + Math.cos(a) * 0.74, 0.1, 1 + Math.sin(a) * 0.74, 6);
      }
      mk(g, cylGeo(0, 1.02, 8), M('#4f8a6a'), 1, 0.6, 1, 1, 1.3, 1).rotation.y = Math.PI / 8;
      cyl(g, 0.5, 0.5, 0.04, '#a8733f', 1, 0.35, 1, 12);
      cyl(g, 0.08, 0.1, 0.25, '#a8733f', 1, 0.1, 1, 6);
      mk(g, G.box, LAMP, 0.1, 0.1, 0.1, 1, 0.85, 1);
      e.top = 1.7;
      break;
  }
}
