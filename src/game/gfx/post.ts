// High quality post processing: ambient occlusion (GTAO, a modern SSAO), bloom for night lights,
// then ACES tone mapping and sRGB output. Low quality skips all of this and renders directly.
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/examples/jsm/postprocessing/GTAOPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';

// Final color grade in display space: a little extra saturation and warmth, lifted shadows
// and a soft vignette, for the bright storybook look of mobile farm games.
const Grade = {
  uniforms: { tDiffuse: { value: null }, uSat: { value: 1.14 }, uWarm: { value: 0.03 }, uVig: { value: 0.28 } },
  vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: `
    uniform sampler2D tDiffuse; uniform float uSat; uniform float uWarm; uniform float uVig; varying vec2 vUv;
    void main() {
      vec4 c = texture2D(tDiffuse, vUv);
      float l = dot(c.rgb, vec3(0.299, 0.587, 0.114));
      c.rgb = mix(vec3(l), c.rgb, uSat);
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

  // `hide` lists objects that must not write into the AO depth and normal buffers (sky, sprites)
  constructor(gl: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.PerspectiveCamera, hide: THREE.Object3D[]) {
    const size = gl.getDrawingBufferSize(new THREE.Vector2());
    const target = new THREE.WebGLRenderTarget(size.x, size.y, { type: THREE.HalfFloatType, samples: 4 });
    this.composer = new EffectComposer(gl, target);
    this.composer.addPass(new RenderPass(scene, camera));

    this.ao = new GTAOPass(scene, camera, size.x, size.y);
    this.ao.updateGtaoMaterial({ radius: 0.55, distanceExponent: 1.4, thickness: 1.2, scale: 1.1, samples: 12 });
    this.ao.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 6, rings: 2, samples: 12 });
    this.ao.blendIntensity = 0.85;
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
    this.composer.addPass(new ShaderPass(Grade));
  }

  setSize(w: number, h: number, dpr: number) {
    this.composer.setPixelRatio(dpr);
    this.composer.setSize(w, h);
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
