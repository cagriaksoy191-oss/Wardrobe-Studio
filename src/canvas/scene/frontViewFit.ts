import { boxVolume, drawerVolumes, hingedVolumes, panelVolume, slidingVolumes, type PhysicalVolume } from '../../core/analysis/kinematics';
import type { ResolvedModel } from '../../core/schema/types';

type Point3 = [number, number, number];
export type SceneBounds = { min: Point3; max: Point3 };

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

export function fitFrontView(bounds: SceneBounds, axis: 'A' | 'B', width: number, height: number) {
  const side = axis === 'A' ? 0 : 2;
  const depth = axis === 'A' ? 2 : 0;
  const xMargin = Math.min(88, width * 0.16);
  const top = Math.min(145, height * 0.25);
  const bottom = Math.min(86, height * 0.16);
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
