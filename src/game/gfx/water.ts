// Animated water: a standard material whose normals ripple with a sum of moving waves.
// The sea variant also turns turquoise in the shallows around the island and draws surf foam.
import * as THREE from 'three';
import { U } from './shared';

const common = /* glsl */ `
uniform float uTime;
uniform vec3 uShallow;
uniform vec3 uDeep;
uniform vec4 uRect;
uniform float uSea;
uniform float uScale;
varying vec3 vWPos;
float wHash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float wNoise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(wHash(i), wHash(i + vec2(1.0, 0.0)), u.x), mix(wHash(i + vec2(0.0, 1.0)), wHash(i + vec2(1.0, 1.0)), u.x), u.y);
}
// gradient of a height field built from a few directional waves
vec2 waveGrad(vec2 p, float t) {
  vec2 g = vec2(0.0);
  vec2 k; float a;
  k = vec2(0.93, 0.37) * 1.7; a = 0.050; g += a * k * cos(dot(k, p) - t * 1.3);
  k = vec2(-0.45, 0.89) * 2.3; a = 0.036; g += a * k * cos(dot(k, p) - t * 1.7);
  k = vec2(0.62, -0.78) * 3.7; a = 0.020; g += a * k * cos(dot(k, p) - t * 2.3);
  k = vec2(-0.97, -0.24) * 5.9; a = 0.011; g += a * k * cos(dot(k, p) - t * 3.1);
  k = vec2(0.2, 0.98) * 9.1; a = 0.006; g += a * k * cos(dot(k, p) - t * 4.3);
  float e = 0.15;
  float n0 = wNoise(p * 2.2 + t * 0.35);
  g += vec2(wNoise(p * 2.2 + vec2(e, 0.0) + t * 0.35) - n0, wNoise(p * 2.2 + vec2(0.0, e) + t * 0.35) - n0) / e * 0.05;
  return g;
}
float sdRect(vec2 p, vec4 r) {
  vec2 c = (r.xy + r.zw) * 0.5, h = (r.zw - r.xy) * 0.5;
  vec2 q = abs(p - c) - h;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0);
}
`;

export interface WaterOpts { sea?: boolean; shallow?: string; deep?: string; rect?: [number, number, number, number]; scale?: number }

export function makeWater(o: WaterOpts = {}) {
  const m = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.14, metalness: 0.0, envMapIntensity: 1.15 });
  const uniforms = {
    uTime: U.time,
    uShallow: { value: new THREE.Color(o.shallow ?? '#5fd4d0') },
    uDeep: { value: new THREE.Color(o.deep ?? '#2a86c9') },
    uRect: { value: new THREE.Vector4(...(o.rect ?? [0, 0, 1, 1])) },
    uSea: { value: o.sea ? 1 : 0 },
    uScale: { value: o.scale ?? 1 },
  };
  m.userData.uniforms = uniforms;
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, uniforms);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vWPos;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvWPos = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\n' + common)
      .replace('#include <color_fragment>', /* glsl */ `
#include <color_fragment>
vec2 wp = vWPos.xz * uScale;
float foam = 0.0;
float wt = uTime;
if (uSea > 0.5) {
  float d = sdRect(vWPos.xz, uRect);
  float shallow = exp(-max(d, 0.0) * 0.42);
  vec3 wcol = mix(uDeep, uShallow, shallow);
  float n = wNoise(vWPos.xz * 1.3 + wt * 0.2);
  float surf = 0.5 + 0.5 * sin(d * 7.0 - wt * 1.6 + n * 3.0);
  foam = smoothstep(0.55, 0.95, surf) * smoothstep(1.6, 0.2, d) * 0.75;
  foam = max(foam, smoothstep(0.35, 0.05, d + (n - 0.5) * 0.25));
  diffuseColor.rgb = mix(wcol, vec3(1.0), foam);
} else {
  float n = wNoise(wp * 1.7 + wt * 0.3);
  diffuseColor.rgb = mix(uDeep, uShallow, 0.35 + n * 0.3);
}
`)
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor = mix(roughnessFactor, 0.85, foam);')
      .replace('#include <normal_fragment_maps>', /* glsl */ `
#include <normal_fragment_maps>
{
  vec2 g = waveGrad(wp, wt) * mix(1.0, 0.35, foam);
  vec3 up = normalize((viewMatrix * vec4(0.0, 1.0, 0.0, 0.0)).xyz);
  vec3 pn = normalize((viewMatrix * vec4(-g.x, 1.0, -g.y, 0.0)).xyz);
  normal = normalize(mix(normal, pn, step(0.5, dot(normal, up))));
}
`);
  };
  m.customProgramCacheKey = () => 'water';
  return m;
}
