import { useFrame, useThree, type ThreeElements } from '@react-three/fiber';
import { useLayoutEffect, useRef, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { Group, Vector3, type OrthographicCamera, type PerspectiveCamera } from 'three';

type SceneHtmlProps = Pick<ThreeElements['group'], 'position'> & {
  children: ReactNode;
  center?: boolean;
  distanceFactor?: number;
  zIndexRange?: [number, number];
};

/** Screen labels with a DOM root whose cleanup never runs inside an R3F commit.
 * A fresh host per effect also keeps StrictMode's mount/cleanup replay isolated.
 */
export function SceneHtml({ children, position, center = false, distanceFactor, zIndexRange = [20, 0] }: SceneHtmlProps) {
  const { gl } = useThree();
  const group = useRef<Group>(null);
  const dom = useRef<{ host: HTMLDivElement; root: Root } | null>(null);
  const point = useRef(new Vector3());
  const cameraPoint = useRef(new Vector3());
  const target = gl.domElement.parentElement;

  useLayoutEffect(() => {
    if (!target) return;
    const host = document.createElement('div');
    host.style.cssText = 'position:absolute;top:0;left:0;pointer-events:none;transform-origin:0 0;';
    target.appendChild(host);
    const root = createRoot(host);
    const entry = { host, root };
    dom.current = entry;
    return () => {
      if (dom.current === entry) dom.current = null;
      host.style.display = 'none';
      queueMicrotask(() => {
        root.unmount();
        host.remove();
      });
    };
  }, [target]);

  useLayoutEffect(() => {
    dom.current?.root.render(
      <div style={{ transform: center ? 'translate(-50%, -50%)' : undefined, pointerEvents: 'none' }}>
        {children}
      </div>
    );
  });

  useFrame(({ camera, size }) => {
    const host = dom.current?.host;
    if (!host || !group.current) return;
    group.current.getWorldPosition(point.current);
    camera.getWorldPosition(cameraPoint.current);
    const distance = point.current.distanceTo(cameraPoint.current);
    const depth = point.current.clone().project(camera);
    host.style.display = depth.z < -1 || depth.z > 1 ? 'none' : '';
    let scale = 1;
    if (distanceFactor !== undefined) {
      const perspective = camera as PerspectiveCamera;
      scale = perspective.isPerspectiveCamera
        ? distanceFactor / (2 * Math.tan(perspective.fov * Math.PI / 360) * distance)
        : distanceFactor * (camera as OrthographicCamera).zoom;
    }
    host.style.transform = `translate3d(${(depth.x + 1) * size.width / 2}px,${(1 - depth.y) * size.height / 2}px,0) scale(${scale})`;
    const t = Math.max(0, Math.min(1, (distance - camera.near) / (camera.far - camera.near)));
    host.style.zIndex = String(Math.round(zIndexRange[0] + t * (zIndexRange[1] - zIndexRange[0])));
  });

  return <group ref={group} position={position} />;
}
