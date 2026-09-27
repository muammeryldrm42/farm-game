// High quality post processing: ambient occlusion (GTAO, a modern SSAO), bloom for night lights,
// then ACES tone mapping and sRGB output. Low quality skips all of this and renders directly.
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/examples/jsm/postprocessing/GTAOPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { HorizontalTiltShiftShader } from 'three/examples/jsm/shaders/HorizontalTiltShiftShader.js';
import { VerticalTiltShiftShader } from 'three/examples/jsm/shaders/VerticalTiltShiftShader.js';

// Final color grade in display space: extra saturation and warmth, vibrance that lifts the
// muted colors (roofs, wood, stone) without pushing the already bright grass further, lifted
// shadows and a soft vignette, for the bright storybook look of mobile farm games.
const Grade = {
  uniforms: { tDiffuse: { value: null }, uSat: { value: 1.12 }, uVib: { value: 0.45 }, uWarm: { value: 0.03 }, uVig: { value: 0.28 } },
  vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: `
    uniform sampler2D tDiffuse; uniform float uSat; uniform float uVib; uniform float uWarm; uniform float uVig; varying vec2 vUv;
    void main() {
      vec4 c = texture2D(tDiffuse, vUv);
      float l = dot(c.rgb, vec3(0.299, 0.587, 0.114));
      float chroma = max(c.r, max(c.g, c.b)) - min(c.r, min(c.g, c.b));
      c.rgb = mix(vec3(l), c.rgb, uSat + uVib * (1.0 - smoothstep(0.08, 0.55, chroma)));
      c.rgb += vec3(uWarm, uWarm * 0.4, -uWarm * 0.6);
      c.rgb = c.rgb * 0.97 + 0.03 * (1.0 - c.rgb) * c.rgb * 2.0;
      vec2 d = vUv - 0.5;
      c.rgb *= 1.0 - uVig * smoothstep(0.35, 0.85, length(d * vec2(1.1, 1.0)));
      gl_FragColor = vec4(clamp(c.rgb, 0.0, 1.0), c.a);
    }`,
};

export class Post {
  composer: EffectComposer;
  ao: GTAOPass;
  bloom: UnrealBloomPass;
  // a gentle tilt shift blur toward the top and bottom of the screen, for a miniature diorama look
  private tiltH: ShaderPass;
  private tiltV: ShaderPass;

  // `hide` lists objects that must not write into the AO depth and normal buffers (sky, sprites)
  constructor(gl: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.PerspectiveCamera, hide: THREE.Object3D[]) {
    const size = gl.getDrawingBufferSize(new THREE.Vector2());
    const target = new THREE.WebGLRenderTarget(size.x, size.y, { type: THREE.HalfFloatType, samples: 4 });
    this.composer = new EffectComposer(gl, target);
    this.composer.addPass(new RenderPass(scene, camera));

    this.ao = new GTAOPass(scene, camera, size.x, size.y);
    this.ao.updateGtaoMaterial({ radius: 0.55, distanceExponent: 1.4, thickness: 1.2, scale: 1.1, samples: 12 });
    this.ao.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 6, rings: 2, samples: 12 });
    this.ao.blendIntensity = 0.65;
    const render = this.ao.render.bind(this.ao);
    this.ao.render = (...args: Parameters<GTAOPass['render']>) => {
      const was = hide.map((o) => o.visible);
      hide.forEach((o) => { o.visible = false; });
      render(...args);
      hide.forEach((o, i) => { o.visible = was[i]; });
    };
    // AO is soft by nature, so it runs at half resolution and is blended over the full image
    const aoSize = this.ao.setSize.bind(this.ao);
    this.ao.setSize = (w: number, h: number) => aoSize(Math.max(1, Math.round(w / 2)), Math.max(1, Math.round(h / 2)));
    this.ao.setSize(size.x, size.y);
    this.composer.addPass(this.ao);

    this.bloom = new UnrealBloomPass(new THREE.Vector2(size.x, size.y), 0.25, 0.55, 1.0);
    this.composer.addPass(this.bloom);
    this.composer.addPass(new OutputPass());
    this.tiltH = new ShaderPass(HorizontalTiltShiftShader);
    this.tiltV = new ShaderPass(VerticalTiltShiftShader);
    for (const p of [this.tiltH, this.tiltV]) { p.uniforms.r.value = 0.52; this.composer.addPass(p); }
    this.composer.addPass(new ShaderPass(Grade));
    this.setTilt(size.x, size.y);
  }

  private setTilt(w: number, h: number) {
    this.tiltH.uniforms.h.value = 1.1 / Math.max(1, w);
    this.tiltV.uniforms.v.value = 1.1 / Math.max(1, h);
  }

  setSize(w: number, h: number, dpr: number) {
    this.composer.setPixelRatio(dpr);
    this.composer.setSize(w, h);
    this.setTilt(w * dpr, h * dpr);
  }

  render() {
    this.composer.render();
  }

  dispose() {
    this.composer.dispose();
    this.ao.dispose();
    this.bloom.dispose();
  }
}
