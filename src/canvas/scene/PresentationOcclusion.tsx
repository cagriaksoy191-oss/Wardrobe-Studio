import { useFrame, useThree } from '@react-three/fiber';
import { useLayoutEffect, useRef } from 'react';
import { DepthTexture, HalfFloatType, WebGLRenderTarget } from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';

/** Sunumda görünür yüzeylerin derinliğinden ortam gölgesi üretir. */
export function PresentationOcclusion() {
  const { gl, scene, camera, size } = useThree();
  const pipeline = useRef<{ composer: EffectComposer; ao: GTAOPass; depth: DepthTexture } | null>(null);
  useLayoutEffect(() => {
    if (!gl.extensions.has('EXT_color_buffer_float')) return;
    const target = new WebGLRenderTarget(1, 1, { type: HalfFloatType, depthTexture: new DepthTexture(1, 1) });
    const composer = new EffectComposer(gl, target);
    const scenePass = new RenderPass(scene, camera);
    const ao = new GTAOPass(scene, camera, 1, 1);
    ao.updateGtaoMaterial({ radius: 0.18, thickness: 0.12, samples: 8, distanceFallOff: 0.8 });
    ao.updatePdMaterial({ samples: 8, radius: 4 });
    ao.blendIntensity = 0.36;
    const depth = composer.readBuffer.depthTexture!;
    // Ana derinlik geçişi X-Ray yüzeylerinin depthWrite tercihine uyar.
    ao.setGBuffer(depth);
    const output = new OutputPass();
    composer.setPixelRatio(1);
    composer.addPass(scenePass);
    composer.addPass(ao);
    composer.addPass(output);
    pipeline.current = { composer, ao, depth };
    return () => {
      pipeline.current = null;
      ao.dispose();
      ao.gtaoMaterial.dispose();
      ao.blendMaterial.dispose();
      output.dispose();
      composer.dispose();
    };
  }, [gl, scene, camera]);

  useLayoutEffect(() => {
    pipeline.current?.composer.setSize(Math.max(1, size.width), Math.max(1, size.height));
  }, [gl, scene, camera, size.width, size.height]);

  useFrame((state, delta) => {
    const active = pipeline.current;
    if (!active) {
      state.gl.render(state.scene, state.camera);
      return;
    }
    const depth = active.composer.readBuffer.depthTexture!;
    if (depth !== active.depth) {
      active.depth = depth;
      active.ao.setGBuffer(depth);
    }
    active.composer.render(delta);
  }, 1);
  return null;
}
