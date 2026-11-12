import { OrthographicCamera, Vector3 } from 'three';
import { OrbitControls } from 'three-stdlib';
import { describe, expect, it } from 'vitest';
import { applyFrontViewPose, fitFrontView, furnitureBounds } from '../src/canvas/scene/frontViewFit';
import { phase5Example } from '../src/core/presets/phase5Examples';
import { solveDesign } from '../src/core/solver/carcassSolver';

describe('WS-UX-014 – orthographic front framing', () => {
  it.each([
    ['A', 928, 730], ['A', 360, 565], ['B', 680, 600], ['B', 390, 625],
  ] as const)('contains the closed furniture in front %s at %s × %s', (axis, width, height) => {
    const design = phase5Example('asymmetric');
    design.runs[0].lengthMm = 5700;
    const model = solveDesign(design);
    const bounds = furnitureBounds(model)!;
    expect(bounds.max[0] - bounds.min[0]).toBeGreaterThan(5.65);
    expect(bounds.max[2] - bounds.min[2]).toBeLessThan(5);
    const before = JSON.stringify(design);
    const pose = fitFrontView(bounds, axis, width, height);
    const camera = new OrthographicCamera(-width / 2, width / 2, height / 2, -height / 2, 0.1, 30);
    camera.position.set(...pose.position);
    camera.lookAt(new Vector3(...pose.target));
    camera.zoom = pose.zoom;
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();
    for (const x of [bounds.min[0], bounds.max[0]]) {
      for (const y of [bounds.min[1], bounds.max[1]]) {
        for (const z of [bounds.min[2], bounds.max[2]]) {
          const point = new Vector3(x, y, z).project(camera);
          expect((point.x + 1) * width / 2).toBeGreaterThanOrEqual(Math.min(88, width * 0.16) - 1e-5);
          expect((1 - point.x) * width / 2).toBeGreaterThanOrEqual(Math.min(88, width * 0.16) - 1e-5);
          expect((1 - point.y) * height / 2).toBeGreaterThanOrEqual(Math.min(145, height * 0.25) - 1e-5);
          expect((point.y + 1) * height / 2).toBeGreaterThanOrEqual(Math.min(86, height * 0.16) - 1e-5);
          expect(Math.abs(point.z)).toBeLessThan(1);
        }
      }
    }
    expect(JSON.stringify(design)).toBe(before);
  });

  it('stays fitted when reset during the settling frames after a right-button pan', () => {
    const camera = new OrthographicCamera(-450, 450, 300, -300, 0.1, 30);
    const ownerDocument = new EventTarget();
    const surface = Object.assign(new EventTarget(), {
      style: {}, ownerDocument, clientHeight: 600, clientWidth: 900,
      setPointerCapture: () => {}, releasePointerCapture: () => {},
    });
    const controls = new OrbitControls(camera, surface as unknown as HTMLElement);
    controls.enableDamping = true;
    const pose = fitFrontView({ min: [0, 0, 0], max: [5.7, 2.4, 2.6] }, 'A', 900, 600);
    applyFrontViewPose(camera, controls, pose);
    const pointer = (type: string, x: number) => Object.assign(new Event(type), {
      clientX: x, clientY: 240, button: 2, pointerType: 'mouse', pointerId: 1,
    });
    surface.dispatchEvent(pointer('pointerdown', 450));
    ownerDocument.dispatchEvent(pointer('pointermove', 590));
    ownerDocument.dispatchEvent(pointer('pointerup', 590));
    expect(Math.abs(camera.position.x - pose.position[0])).toBeGreaterThan(0.01);

    applyFrontViewPose(camera, controls, pose);
    for (let frame = 0; frame < 90; frame++) controls.update();
    expect(camera.position.distanceTo(new Vector3(...pose.position))).toBeLessThan(1e-6);
    expect(controls.target.distanceTo(new Vector3(...pose.target))).toBeLessThan(1e-6);
    expect(controls.enableDamping).toBe(true);
    controls.dispose();
  });
});
