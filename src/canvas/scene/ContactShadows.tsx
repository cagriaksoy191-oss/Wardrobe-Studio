// Adapted from Drei 10.7.9 ContactShadows. See public/THIRD_PARTY_NOTICES.txt.
// The original contact shadow example is by @mrdoob.
import { useFrame, useThree } from '@react-three/fiber';
import { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { createContactShadowResources } from './contactShadowResources';

interface Props {
  position: [number, number, number];
  opacity: number;
  scale: number;
  blur: number;
  far: number;
  resolution: number;
  color: string;
}

const NOOP_RAYCAST = () => null;

export function ContactShadows({ position, opacity, scale, blur, far, resolution, color }: Props) {
  const root = useRef<THREE.Group>(null);
  const shadowCamera = useRef<THREE.OrthographicCamera>(null);
  const scene = useThree(state => state.scene);
  const gl = useThree(state => state.gl);

  const pass = useMemo(() => createContactShadowResources(resolution, scale, color), [resolution, scale, color]);
  useLayoutEffect(pass.attach, [pass]);

  const blurShadows = (amount: number, camera: THREE.OrthographicCamera) => {
    const { plane, horizontal, vertical, target, scratch } = pass;
    plane.visible = true;
    plane.material = horizontal;
    horizontal.uniforms.tDiffuse.value = target.texture;
    horizontal.uniforms.h.value = amount / 256;
    gl.setRenderTarget(scratch);
    gl.render(plane, camera);
    plane.material = vertical;
    vertical.uniforms.tDiffuse.value = scratch.texture;
    vertical.uniforms.v.value = amount / 256;
    gl.setRenderTarget(target);
    gl.render(plane, camera);
    plane.visible = false;
  };

  useFrame(() => {
    const camera = shadowCamera.current;
    const group = root.current;
    if (!pass.active || !camera || !group) return;

    const background = scene.background;
    const override = scene.overrideMaterial;
    group.visible = false;
    scene.background = null;
    scene.overrideMaterial = pass.depth;
    try {
      gl.setRenderTarget(pass.target);
      gl.render(scene, camera);
      blurShadows(blur, camera);
      blurShadows(blur * 0.4, camera);
    } finally {
      gl.setRenderTarget(null);
      group.visible = true;
      scene.overrideMaterial = override;
      scene.background = background;
    }
  });

  return <group position={position} rotation-x={Math.PI / 2} ref={root}>
    <mesh geometry={pass.geometry} scale={[1, -1, 1]} rotation={[-Math.PI / 2, 0, 0]} raycast={NOOP_RAYCAST}>
      <meshBasicMaterial transparent map={pass.target.texture} opacity={opacity} depthWrite={false} />
    </mesh>
    <orthographicCamera ref={shadowCamera} args={[-scale / 2, scale / 2, scale / 2, -scale / 2, 0, far]} />
  </group>;
}
