import { BoxGeometry, EdgesGeometry, Vector3 } from 'three';
import { describe, expect, it } from 'vitest';
import { appendCellBoxOutline, cellBoxSizeMetres } from '../src/canvas/wardrobe/boxSelectionOutline';
import type { ResolvedCell } from '../src/core/schema/types';

describe('rectangular cell selection outlines', () => {
  it.each([0, Math.PI / 2, -Math.PI / 3])('preserves every ordered segment at rotation %s', rotationYRad => {
    const cell = {
      worldSizeMm: [763, 409, 578],
      worldCenterMm: [1242.5, 791, -183],
      rotationYRad,
    } as ResolvedCell;
    const originalMesh = new BoxGeometry(0.759, 0.407, 0.574);
    const originalOutline = new EdgesGeometry(originalMesh, 15);
    try {
      const positions = originalOutline.getAttribute('position');
      const actual: [number, number, number][] = [];
      appendCellBoxOutline(actual, cell);
      expect(actual).toHaveLength(24);
      for (let index = 0; index < positions.count; index++) {
        const point = new Vector3().fromBufferAttribute(positions, index)
          .applyAxisAngle(new Vector3(0, 1, 0), rotationYRad)
          .add(new Vector3(1.2425, 0.791, -0.183));
        point.toArray().forEach((coordinate, axis) => expect(actual[index][axis]).toBeCloseTo(coordinate, 10));
      }
    } finally {
      originalMesh.dispose();
      originalOutline.dispose();
    }
  });

  it('keeps the minimum hit volume and appends each cell without replacing previous segments', () => {
    const cell = { worldSizeMm: [6, 8, 12], worldCenterMm: [0, 0, 0], rotationYRad: 0 } as ResolvedCell;
    const points: [number, number, number][] = [];
    expect(cellBoxSizeMetres(cell)).toEqual([0.02, 0.02, 0.02]);
    appendCellBoxOutline(points, cell);
    const first = points.slice();
    appendCellBoxOutline(points, { ...cell, worldCenterMm: [30, 0, 0] });
    expect(points.slice(0, 24)).toEqual(first);
    expect(points).toHaveLength(48);
    expect(points[24][0] - points[0][0]).toBeCloseTo(0.03);
  });
});
