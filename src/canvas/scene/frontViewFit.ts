import type { OrthographicCamera } from 'three';
import type { OrbitControls } from 'three-stdlib';
import { boxVolume, drawerVolumes, hingedVolumes, panelVolume, slidingVolumes, type PhysicalVolume } from '../../core/analysis/kinematics';
import type { ResolvedModel } from '../../core/schema/types';

type Point3 = [number, number, number];
export type SceneBounds = { min: Point3; max: Point3 };
type FrontViewPose = { position: Point3; target: Point3; zoom: number };

/** Closed furniture bounds, in scene metres. The orthogonal projection also includes the return and the corner. */
export function furnitureBounds(model: ResolvedModel): SceneBounds | null {
  const min: Point3 = [Infinity, Infinity, Infinity];
  const max: Point3 = [-Infinity, -Infinity, -Infinity];
  const include = (volume: PhysicalVolume) => {
    min[1] = Math.min(min[1], volume.y0);
    max[1] = Math.max(max[1], volume.y1);
    for (const point of volume.polygon) {
      min[0] = Math.min(min[0], point.xMm);
      max[0] = Math.max(max[0], point.xMm);
      min[2] = Math.min(min[2], point.zMm);
      max[2] = Math.max(max[2], point.zMm);
    }
  };
  for (const panel of model.panels) if (!panel.animatedUnitId) include(panelVolume(panel));
  for (const door of model.doors) hingedVolumes(door, 0).forEach(include);
  for (const drawer of model.drawers) drawerVolumes(drawer, 0).forEach(include);
  for (const leaf of model.slidingDoors ?? []) slidingVolumes(leaf, leaf.initialOffsetMm).forEach(include);
  for (const system of model.slidingSystems ?? []) {
    for (const rail of system.railBoxes) include(boxVolume(rail.centerMm, rail.sizeMm));
  }
  if (!min.every(Number.isFinite) || !max.every(Number.isFinite)) return null;
  return { min: min.map(value => value / 1000) as Point3, max: max.map(value => value / 1000) as Point3 };
}

export function fitFrontView(bounds: SceneBounds, axis: 'A' | 'B', width: number, height: number): FrontViewPose {
  const side = axis === 'A' ? 0 : 2;
  const depth = axis === 'A' ? 2 : 0;
  const xMargin = Math.min(88, width * 0.16);
  const top = Math.min(145, height * 0.25);
  const bottom = Math.min(132, height * 0.22);
  const zoom = Math.min(
    Math.max(1, width - 2 * xMargin) / Math.max(0.01, bounds.max[side] - bounds.min[side]),
    Math.max(1, height - top - bottom) / Math.max(0.01, bounds.max[1] - bounds.min[1]),
  );
  const target = bounds.min.map((value, i) => (value + bounds.max[i]) / 2) as Point3;
  target[1] += (top - bottom) / (2 * zoom);
  const position = [...target] as Point3;
  position[depth] = bounds.max[depth] + 5;
  return { position, target, zoom };
}

export interface TopPlanFitOptions {
  topInsetPx?: number;
  bottomInsetPx?: number;
  leftInsetPx?: number;
  rightInsetPx?: number;
}

/**
 * Fits 2D top-down plan (`up = [0, 0, -1]`) inside the safe viewport region between
 * `.studio-scene-toolbar` (top) and `AnalysisToolbar` (bottom), reserving extra
 * world-space overhang for `+A` / `+B` anchors and `Derinlik` / `Dış` dimension pills.
 */
export function computeTopPlanFit(
  bounds: SceneBounds,
  width: number,
  height: number,
  options: TopPlanFitOptions = {},
): FrontViewPose {
  const safeWidth = Math.max(1, width);
  const safeHeight = Math.max(1, height);

  // World-space overhangs for top-plan dimension pills & +A/+B anchors (metres)
  const minXExt = bounds.min[0] - 0.08;
  const maxXExt = bounds.max[0] + 0.16;
  const minZExt = bounds.min[2] - 0.14;
  const maxZExt = bounds.max[2] + 0.12;

  const spanX = Math.max(0.2, maxXExt - minXExt);
  const spanZ = Math.max(0.2, maxZExt - minZExt);

  const leftInset = Math.min(options.leftInsetPx ?? 96, safeWidth * 0.16);
  const rightInset = Math.min(options.rightInsetPx ?? 116, safeWidth * 0.18);
  // Reserve space for .studio-scene-toolbar (top) and AnalysisToolbar + pill clearance (bottom)
  const topInset = Math.min(options.topInsetPx ?? 96, safeHeight * 0.24);
  const bottomInset = Math.min(options.bottomInsetPx ?? 132, safeHeight * 0.28);

  const usableW = Math.max(1, safeWidth - leftInset - rightInset);
  const usableH = Math.max(1, safeHeight - topInset - bottomInset);
  const zoom = Math.min(usableW / spanX, usableH / spanZ);

  const midX = (minXExt + maxXExt) / 2;
  const midZ = (minZExt + maxZExt) / 2;
  // With up = [0, 0, -1]: screenX = W/2 + (x - targetX)*zoom, screenY = H/2 + (z - targetZ)*zoom
  const targetX = midX - (leftInset - rightInset) / (2 * zoom);
  const targetZ = midZ - (topInset - bottomInset) / (2 * zoom);
  const target: Point3 = [targetX, 0, targetZ];
  const position: Point3 = [targetX, bounds.max[1] + 5, targetZ];
  return { position, target, zoom };
}

export function applyFrontViewPose(camera: OrthographicCamera, controls: OrbitControls, pose: FrontViewPose) {
  const damping = controls.enableDamping;
  // Flush the old pan offset before placing the camera. Otherwise its inertia
  // immediately moves the freshly fitted pose and switches off automatic fit.
  controls.enableDamping = false;
  controls.update();
  camera.position.set(...pose.position);
  camera.zoom = pose.zoom;
  camera.updateProjectionMatrix();
  controls.target.set(...pose.target);
  controls.update();
  controls.enableDamping = damping;
}
