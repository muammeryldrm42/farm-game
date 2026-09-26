// High quality post processing: ambient occlusion (GTAO, a modern SSAO), bloom for night lights,
// then ACES tone mapping and sRGB output. Low quality skips all of this and renders directly.
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/examples/jsm/postprocessing/GTAOPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

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
