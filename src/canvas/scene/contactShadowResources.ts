// Resource allocation and shader customization adapted from Drei 10.7.9
// ContactShadows. See public/THIRD_PARTY_NOTICES.txt.
import * as THREE from 'three';
import { HorizontalBlurShader, VerticalBlurShader } from 'three-stdlib';

export function createContactShadowResources(resolution: number, scale: number, color: string) {
  const target = new THREE.WebGLRenderTarget(resolution, resolution);
  const scratch = new THREE.WebGLRenderTarget(resolution, resolution);
  target.texture.generateMipmaps = scratch.texture.generateMipmaps = false;
  const geometry = new THREE.PlaneGeometry(scale, scale).rotateX(Math.PI / 2);
  const depth = new THREE.MeshDepthMaterial();
  depth.depthTest = depth.depthWrite = false;
  depth.onBeforeCompile = shader => {
    shader.uniforms = { ...shader.uniforms, ucolor: { value: new THREE.Color(color) } };
    shader.fragmentShader = shader.fragmentShader.replace('void main() {',
      `uniform vec3 ucolor;
         void main() {
        `);
    shader.fragmentShader = shader.fragmentShader.replace(
      'vec4( vec3( 1.0 - fragCoordZ ), opacity );',
      'vec4( ucolor * fragCoordZ * 2.0, ( 1.0 - fragCoordZ ) * 1.0 );',
    );
  };
  const horizontal = new THREE.ShaderMaterial(HorizontalBlurShader);
  const vertical = new THREE.ShaderMaterial(VerticalBlurShader);
  horizontal.depthTest = vertical.depthTest = false;
  const plane = new THREE.Mesh(geometry, horizontal);
  let generation = 0;
  let active = false;

  function attach() {
    const effect = ++generation;
    active = true;
    return () => {
      if (!active || generation !== effect) return;
      active = false;

      // StrictMode reattaches the same memoized resources in the same commit.
      queueMicrotask(() => {
        if (generation !== effect) return;
        // The imported shader descriptors share uniform objects across materials.
        if (horizontal.uniforms.tDiffuse.value === target.texture) horizontal.uniforms.tDiffuse.value = null;
        if (vertical.uniforms.tDiffuse.value === scratch.texture) vertical.uniforms.tDiffuse.value = null;
        target.dispose();
        scratch.dispose();
        geometry.dispose();
        depth.dispose();
        horizontal.dispose();
        vertical.dispose();
      });
    };
  }

  return {
    target, scratch, geometry, plane, depth, horizontal, vertical, attach,
    get active() { return active; },
  };
}
