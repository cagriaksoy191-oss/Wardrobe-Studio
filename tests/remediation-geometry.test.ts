import { describe, expect, it } from 'vitest';
import { phase5Example } from '../src/core/presets/phase5Examples';
import { normalizeAndValidateDesign } from '../src/core/schema/designSchema';
import type { Design, ResolvedBay, ResolvedPanel } from '../src/core/schema/types';
import { solveDesign } from '../src/core/solver/carcassSolver';
import { buildResizeDraftState, commitDirectionalResizeInDesign } from '../src/core/solver/treeMutator';
import { extractProduction } from '../src/core/production/productionModel';
import { previewDesignJson } from '../src/core/versions/designExchange';
import { useWardrobeStore } from '../src/store/useWardrobeStore';

describe('AUD-002, AUD-012 and AUD-013 — design entry boundaries', () => {
  it.each([
    ['missing L junction', (d: Design) => { d.junctions = []; }],
    ['duplicate A axis', (d: Design) => { d.runs[1].wallAxis = 'A'; }],
    ['invalid priority', (d: Design) => { d.junctions[0].priorityRunId = 'missing'; }],
    ['unsupported drawerFront', (d: Design) => { d.fronts[0].type = 'drawerFront'; }],
    ['overlapping front ranges', (d: Design) => {
      d.fronts.push({ ...d.fronts[0], id: 'overlap-qa', type: 'open' });
    }],
    ['short corner arm', (d: Design) => { d.junctions[0].diagonalArmAMm = 600; }],
    ['mixed diagonal thickness', (d: Design) => { d.runs[1].panelThicknessMm = 25; }],
    ['mixed blind thickness', (d: Design) => {
      d.junctions[0].type = 'blind';
      d.runs[1].backPanelThicknessMm = 4;
    }],
  ] as const)('rejects %s on every entry path', (_name, mutate) => {
    const design = phase5Example('diagonal');
    mutate(design);
    const json = JSON.stringify(design);
    expect(() => normalizeAndValidateDesign(design)).toThrow();
    expect(previewDesignJson(json).errors.length).toBeGreaterThan(0);
    expect(extractProduction(design, solveDesign(design)).status).toBe('blocked');
    const store = useWardrobeStore.getState();
    const before = store.exportJsonString();
    expect(store.importJsonString(json).ok).toBe(false);
    store.openNamedVersion(design, 'Bozuk varyant');
    expect(store.exportJsonString()).toBe(before);
  });

  it('still accepts a valid earlier separate-body document', () => {
    const design = phase5Example('straight');
    delete design.runs[0].constructionMode;
    expect(normalizeAndValidateDesign(JSON.parse(JSON.stringify(design)))).toEqual(design);
    expect(solveDesign(design).panels.filter(p => p.role === 'sidePanel')).toHaveLength(4);
  });

  it('blocks an actual static collision while allowing the original panel contacts', () => {
    const design = phase5Example('asymmetric');
    const model = solveDesign(design);
    expect(extractProduction(design, model).status).toBe('review');
    const sides = model.panels.filter(p => p.role === 'sidePanel');
    sides[1].worldPositionMm = [...sides[0].worldPositionMm];
    expect(extractProduction(design, model).issues.some(i => i.code === 'STATIC_PANEL_INTERSECTION')).toBe(true);
  });
});

describe('AUD-005, AUD-006, AUD-008 and AUD-009 — true physical extents', () => {
  it('reports the 32 mm physical drawer clearance in the compact drawer case', () => {
    const design = phase5Example('straight');
    design.runs[0].backPanelThicknessMm = 18;
    const root = design.runs[0].bays[0].root;
    if (root.kind !== 'split') throw new Error('fixture');
    root.children[0].size = { kind: 'fixed', mm: 248 };
    const drawer = solveDesign(design).drawers[0];
    expect(drawer.leftSideBoxSizeMm[1]).toBe(50);
    expect(drawer.innerHeightMm).toBe(32);
  });

  it('blocks export for a 3000 mm assembly in an 1800 mm room', () => {
    const design = phase5Example('straight');
    design.runs[0].heightMm = 3000;
    design.roomHeightMm = 1800;
    const model = solveDesign(design);
    expect(model.issues.some(i => i.code === 'ROOM_HEIGHT_EXCEEDED' && i.severity === 'error')).toBe(true);
    expect(extractProduction(design, model).status).toBe('blocked');
  });

  it.each(['diagonal', 'blind', 'asymmetric'] as const)('warns for every actual wide %s leaf', kind => {
    const model = solveDesign(phase5Example(kind));
    const wide = model.doors.filter(d => d.widthMm > 600);
    expect(wide.length).toBeGreaterThan(0);
    for (const door of wide) {
      expect(model.issues.some(i => i.code === 'DOOR_LEAF_TOO_WIDE' && i.targetId === door.id)).toBe(true);
    }
  });

  it.each(['diagonal', 'asymmetric'] as const)('uses the same closed %s hinge and cut geometry', kind => {
    const model = solveDesign(phase5Example(kind));
    expect(model.doors.some(d => d.widthMm % 2 === 1)).toBe(true);
    for (const door of model.doors) {
      const [u, v, w] = door.leafCenterOffsetMm;
      const c = Math.cos(door.closedRotationYRad), s = Math.sin(door.closedRotationYRad);
      const panel = model.panels.find(p => p.animatedUnitId === door.id)!;
      expect(panel.worldPositionMm[0]).toBeCloseTo(door.pivotWorldMm[0] + u * c + w * s, 8);
      expect(panel.worldPositionMm[1]).toBeCloseTo(door.pivotWorldMm[1] + v, 8);
      expect(panel.worldPositionMm[2]).toBeCloseTo(door.pivotWorldMm[2] - u * s + w * c, 8);
    }
  });
});

function overlap(a: ResolvedPanel, b: ResolvedPanel) {
  return a.worldPositionMm.map((c, axis) => {
    const h = a.boxSizeMm[axis] / 2;
    const q = b.worldPositionMm[axis], k = b.boxSizeMm[axis] / 2;
    return Math.min(c + h, q + k) - Math.max(c - h, q - k);
  });
}

describe('AUD-003 — exact organizer boundaries', () => {
  it.each([
    ['straight', 3], ['straight', 8], ['diagonal', 8],
    ['blind', 18], ['asymmetric', 4],
  ] as const)('%s with %i mm dividers closes every physical interval', (kind, thickness) => {
    const design = phase5Example(kind);
    for (const run of design.runs) run.backPanelThicknessMm = thickness;
    const model = solveDesign(design);
    expect(model.drawers.length).toBeGreaterThan(0);
    for (const drawer of model.drawers) {
      const panels = drawer.organizerPanels!;
      expect(panels).toHaveLength(11);
      for (const [i, a] of panels.entries()) for (const b of panels.slice(i + 1)) {
        expect(overlap(a, b).some(mm => mm <= 0.00001), a.id + ' / ' + b.id).toBe(true);
      }
      for (const row of [1, 2]) {
        const pieces = panels.filter(p => p.id.includes('-row-' + row + '-'));
        expect(pieces.reduce((sum, p) => sum + p.cutWidthMm, 3 * thickness)).toBe(drawer.innerWidthMm);
      }
      expect(panels.every(p => p.cutThicknessMm === thickness)).toBe(true);
    }
  });
});

function depthBounds(bay: ResolvedBay, axis: number) {
  const center = bay.worldCenterMm[axis], halfDepth = bay.worldSizeMm[axis] / 2;
  return [center - halfDepth, center + halfDepth];
}

describe('AUD-004 — front and rear anchoring', () => {
  it.each([['straight', 0], ['diagonal', 0], ['asymmetric', 1], ['blind', 1]] as const)(
    'preserves the front and then the back on %s run %i',
    (kind, index) => {
      const design = phase5Example(kind), run = design.runs[index], axis = index ? 0 : 2;
      const bayId = run.bays[0].id;
      let model = solveDesign(design);
      const resize = (direction: 'front' | 'back', netMm: number) => {
        const id = model.cells.find(cell => cell.bayId === bayId)!.id;
        const draft = buildResizeDraftState(model, [id], 'Z', direction, netMm)!;
        expect(draft.exceedsBoundary, draft.boundaryErrorReason).toBe(false);
        commitDirectionalResizeInDesign(design, draft, model);
        model = solveDesign(design);
        return depthBounds(model.bays.find(b => b.id === bayId)!, axis);
      };
      const originalFront = run.depthMm, back = run.backPanelThicknessMm;
      expect(resize('back', originalFront - back - 80)).toEqual([80, originalFront]);
      expect(resize('back', originalFront - back - 40)).toEqual([40, originalFront]);
      expect(resize('front', originalFront - back - 50)).toEqual([40, originalFront - 10]);
      expect(resize('front', originalFront - back - 40)).toEqual([40, originalFront]);
    }
  );
});
