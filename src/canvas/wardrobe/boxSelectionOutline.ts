import type { ResolvedCell } from '../../core/schema/types';

type Point = [number, number, number];
const MM_TO_M = 0.001;

// Choose the rendering path for the solved model so it stays stable throughout a drag.
export const CELL_OUTLINE_BATCH_MIN_MODEL_SIZE = 64;

export function shouldBatchCellBoxOutlines(cellCount: number): boolean {
  return cellCount >= CELL_OUTLINE_BATCH_MIN_MODEL_SIZE;
}

const CORNERS: readonly Point[] = [
  [-1, -1, -1], [-1, -1, 1], [-1, 1, -1], [-1, 1, 1],
  [1, -1, -1], [1, -1, 1], [1, 1, -1], [1, 1, 1],
];

// Preserve the segment order used by EdgesGeometry on the cell's BoxGeometry.
const EDGE_ENDPOINTS = [2, 3, 7, 6, 1, 0, 4, 5, 3, 1, 7, 3, 1, 5, 5, 7, 6, 4, 2, 6, 4, 0, 0, 2];

export function cellBoxSizeMetres(cell: ResolvedCell): Point {
  const [width, height, depth] = cell.worldSizeMm;
  return [
    Math.max(0.02, width * MM_TO_M - 0.004),
    Math.max(0.02, height * MM_TO_M - 0.002),
    Math.max(0.02, depth * MM_TO_M - 0.004),
  ];
}

export function appendCellBoxOutline(points: Point[], cell: ResolvedCell): void {
  const [width, height, depth] = cellBoxSizeMetres(cell);
  const [centerX, centerY, centerZ] = cell.worldCenterMm.map(mm => mm * MM_TO_M);
  const sin = Math.sin(cell.rotationYRad);
  const cos = Math.cos(cell.rotationYRad);
  const corners = CORNERS.map(([sideX, sideY, sideZ]): Point => {
    // BoxGeometry stores its local coordinates as float32 before applying the mesh transform.
    const x = Math.fround(sideX * width / 2);
    const y = Math.fround(sideY * height / 2);
    const z = Math.fround(sideZ * depth / 2);
    return [centerX + cos * x + sin * z, centerY + y, centerZ - sin * x + cos * z];
  });
  for (const corner of EDGE_ENDPOINTS) points.push(corners[corner]);
}
