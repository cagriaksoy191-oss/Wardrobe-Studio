import { BoxGeometry, EdgesGeometry, Vector3 } from 'three';
import { describe, expect, it } from 'vitest';
import {
  appendCellBoxOutline,
  CELL_OUTLINE_BATCH_MIN_MODEL_SIZE,
  cellBoxSizeMetres,
  shouldBatchCellBoxOutlines,
} from '../src/canvas/wardrobe/boxSelectionOutline';
import { SAMPLE_DESIGNS } from '../src/core/presets/sampleDesigns';
import type { Bay, ResolvedCell } from '../src/core/schema/types';
import { solveDesign } from '../src/core/solver/carcassSolver';
import { useWardrobeStore } from '../src/store/useWardrobeStore';

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

  describe('WS-UX-011: batched rectangular cell outline threshold & 130-cell marquee selection', () => {
    it('activates batched box outlines at exactly 64 solved cells (63 -> false, 64 -> true, 65 -> true)', () => {
      expect(CELL_OUTLINE_BATCH_MIN_MODEL_SIZE).toBe(64);
      expect(shouldBatchCellBoxOutlines(63)).toBe(false);
      expect(shouldBatchCellBoxOutlines(64)).toBe(true);
      expect(shouldBatchCellBoxOutlines(65)).toBe(true);
    });

    it('preserves exact selectedCellIds order (selectedCellId === ids[0]), emits 3,120 vertices for 130 cells, and never mutates design, history, or unsaved state', () => {
      const design = structuredClone(SAMPLE_DESIGNS['straight-wardrobe']);
      const run = design.runs[0]!;
      run.lengthMm = 5400;
      run.heightMm = 2400;
      const templateBay = run.bays[0]!;
      const bays: Bay[] = Array.from({ length: 13 }, (_, idx) => ({
        ...structuredClone(templateBay),
        id: `bay-dense-${idx + 1}`,
        label: `B${idx + 1}`,
        width: { kind: 'flex', weight: 1 },
        locked: false,
        frontMode: 'open',
        root: {
          kind: 'leaf',
          id: `leaf-dense-${idx + 1}`,
          insert: {
            type: 'shelfStack',
            shelfCount: 9,
            adjustable: true,
          },
        },
      }));
      run.bays = bays;
      design.fronts = [];

      const resolved = solveDesign(design);
      expect(resolved.cells).toHaveLength(130);
      expect(shouldBatchCellBoxOutlines(resolved.cells.length)).toBe(true);

      const snapshotBefore = structuredClone(design);
      useWardrobeStore.setState({
        design,
        checkpointDesign: structuredClone(design),
        resolved,
        doorEditorMode: false,
        selectedBayId: bays[0]!.id,
        selectedCellId: null,
        selectedCellIds: [],
        selectedDrawerId: null,
        selectedDrawerIds: [],
        selectedDoorId: null,
        selectedDoorIds: [],
        selectedFrontId: null,
        historyPast: [],
        historyFuture: [],
        hasUnsavedChanges: false,
        resizeDraft: null,
      });

      // Deterministic non-trivial ordering (interleaved reverse + forward) with duplicate tail
      const allIds = resolved.cells.map((c) => c.id);
      const expectedOrder = [
        ...allIds.filter((_, idx) => idx % 2 === 1).reverse(),
        ...allIds.filter((_, idx) => idx % 2 === 0),
      ];
      expect(expectedOrder).toHaveLength(130);

      useWardrobeStore.getState().setSelectedCells([...expectedOrder, expectedOrder[0]!, expectedOrder[64]!]);
      const stateAfter = useWardrobeStore.getState();

      expect(stateAfter.selectedCellIds).toEqual(expectedOrder);
      expect(stateAfter.selectedCellId).toBe(expectedOrder[0]);
      expect(stateAfter.design).toBe(design);
      expect(stateAfter.design).toEqual(snapshotBefore);
      expect(stateAfter.historyPast).toEqual([]);
      expect(stateAfter.historyFuture).toEqual([]);
      expect(stateAfter.hasUnsavedChanges).toBe(false);

      const cellById = new Map(resolved.cells.map((c) => [c.id, c]));
      const outlinePoints: [number, number, number][] = [];
      for (const id of stateAfter.selectedCellIds) {
        const cell = cellById.get(id)!;
        expect(cell).toBeDefined();
        appendCellBoxOutline(outlinePoints, cell);
      }
      expect(outlinePoints).toHaveLength(130 * 24);
      expect(outlinePoints.every((pt) => pt.every((coord) => Number.isFinite(coord)))).toBe(true);
    });
  });
});
