// Gradient sky dome with a soft sun glow and twinkling stars at night, all in one shader.
import * as THREE from 'three';
import { U } from './shared';

const vert = /* glsl */ `
varying vec3 vDir;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vDir = wp.xyz - cameraPosition;
  gl_Position = projectionMatrix * viewMatrix * wp;
  gl_Position.z = gl_Position.w; // always at the far plane
}`;

const frag = /* glsl */ `
uniform vec3 uTop;
uniform vec3 uHorizon;
uniform vec3 uBottom;
uniform vec3 uSunDir;
uniform vec3 uSunColor;
uniform float uStars;
uniform float uTime;
varying vec3 vDir;

float hash3(vec3 p) {
  p = fract(p * 0.3183099 + 0.1);
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}

void main() {
  vec3 d = normalize(vDir);
  float y = d.y;
  vec3 col = y > 0.0
    ? mix(uHorizon, uTop, pow(clamp(y, 0.0, 1.0), 0.55))
    : mix(uHorizon, uBottom, clamp(-y * 4.0, 0.0, 1.0));
  float s = max(dot(d, normalize(uSunDir)), 0.0);
  col += uSunColor * (pow(s, 8.0) * 0.35 + pow(s, 64.0) * 0.8 + smoothstep(0.9985, 0.9992, s) * 4.0);
  if (uStars > 0.0 && y > 0.0) {
    vec3 cell = floor(d * 140.0);
    float h = hash3(cell);
    if (h > 0.985) {
      vec3 c = (cell + 0.5) / 140.0;
      float r = length(d - normalize(c)) * 140.0;
      float tw = 0.6 + 0.4 * sin(uTime * (1.5 + h * 3.0) + h * 40.0);
      col += vec3(1.0, 0.96, 0.9) * smoothstep(0.35, 0.0, r) * uStars * tw * smoothstep(0.0, 0.25, y) * 1.6;
    }
  }
  gl_FragColor = vec4(col, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

export class Sky {
  mesh: THREE.Mesh;
  mat: THREE.ShaderMaterial;
  constructor() {
    this.mat = new THREE.ShaderMaterial({
      vertexShader: vert,
      fragmentShader: frag,
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
      uniforms: {
        uTop: { value: new THREE.Color('#3f8fe0') },
        uHorizon: { value: new THREE.Color('#bfe6fb') },
        uBottom: { value: new THREE.Color('#6fb6e0') },
        uSunDir: { value: new THREE.Vector3(0.5, 0.6, 0.3) },
        uSunColor: { value: new THREE.Color('#fff1d0') },
        uStars: { value: 0 },
        uTime: U.time,
      },
    });
    this.mesh = new THREE.Mesh(new THREE.SphereGeometry(200, 32, 16), this.mat);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = -10;
  }

  set(top: THREE.Color, horizon: THREE.Color, bottom: THREE.Color, sunDir: THREE.Vector3, sunColor: THREE.Color, stars: number) {
    const u = this.mat.uniforms;
    (u.uTop.value as THREE.Color).copy(top);
    (u.uHorizon.value as THREE.Color).copy(horizon);
    (u.uBottom.value as THREE.Color).copy(bottom);
    (u.uSunDir.value as THREE.Vector3).copy(sunDir);
    (u.uSunColor.value as THREE.Color).copy(sunColor);
    u.uStars.value = stars;
  }
}
