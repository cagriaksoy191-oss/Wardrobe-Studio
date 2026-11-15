import { describe, expect, it } from 'vitest';
import { polygonsIntersect } from '../src/core/analysis/kinematics';
import { phase5Example } from '../src/core/presets/phase5Examples';
import { extractProduction } from '../src/core/production/productionModel';
import { normalizeAndValidateDesign } from '../src/core/schema/designSchema';
import type { ResolvedPanel, SplitNode } from '../src/core/schema/types';
import { solveDesign } from '../src/core/solver/carcassSolver';

const thicknesses = [12, 16, 17, 18, 19, 22, 24, 25, 26, 36];
const profiles = [
  { name: 'separate symmetric', modes: ['separate', 'separate'], depths: [600, 600],
    backs: [8, 8], arms: [900, 900], widths: [480, 620], height: 2400 },
  { name: 'shared asymmetric', modes: ['shared', 'shared'], depths: [601, 479],
    backs: [7, 7], arms: [901, 903], widths: [801, 702], height: 2401 },
  { name: 'mixed asymmetric', modes: ['separate', 'shared'], depths: [600, 480],
    backs: [3, 3], arms: [905, 907], widths: [461, 980], height: 2401 },
  { name: 'shared symmetric', modes: ['shared', 'shared'], depths: [599, 599],
    backs: [5, 5], arms: [900, 900], widths: [742, 877], height: 2400 },
] as const;
const cases = thicknesses.flatMap(t => profiles.map(profile => [t, profile.name, profile] as const));

const structuralRoles = new Set([
  'backPanel', 'bottomPanel', 'topPanel', 'sidePanel', 'cornerBackPanel',
  'cornerSidePanel', 'cornerPolygonShelf', 'verticalDivider', 'shelf',
]);

function shelf(id: string): SplitNode {
  return { kind: 'leaf', id, owner: 'ortak', insert: { type: 'shelfStack', shelfCount: 2 } };
}

function splitTree(axis: string): SplitNode {
  return {
    kind: 'split', id: axis + '-stack', direction: 'horizontal',
    children: [
      { id: axis + '-bottom', size: { kind: 'fixed', mm: 931 }, node: {
        kind: 'split', id: axis + '-columns', direction: 'vertical', children: [
          { id: axis + '-left', size: { kind: 'fixed', mm: 181 }, node: shelf(axis + '-narrow') },
          { id: axis + '-right', size: { kind: 'flex', weight: 1 }, node: shelf(axis + '-wide') },
        ],
      } },
      { id: axis + '-top', size: { kind: 'flex', weight: 1 }, node: shelf(axis + '-upper') },
    ],
  };
}

function span(panel: ResolvedPanel, axis: 0 | 1 | 2) {
  const center = panel.worldPositionMm[axis];
  const half = panel.boxSizeMm[axis] / 2;
  return [center - half, center + half];
}

function solid(panel: ResolvedPanel) {
  const [x0, x1] = span(panel, 0);
  const [z0, z1] = span(panel, 2);
  return {
    id: panel.id,
    y: panel.polygonXZMm
      ? [panel.worldPositionMm[1], panel.worldPositionMm[1] + panel.cutThicknessMm]
      : span(panel, 1),
    plan: panel.polygonXZMm ?? [
      { xMm: x0, zMm: z0 }, { xMm: x1, zMm: z0 },
      { xMm: x1, zMm: z1 }, { xMm: x0, zMm: z1 },
    ],
  };
}

describe('Structural panels centered from the nominal faces', () => {
  it.each(cases)('%i mm in a %s frame', (t, _, profile) => {
    const design = phase5Example('diagonal');
    design.fronts = [];
    design.ledLighting = undefined;
    const junction = design.junctions[0];
    junction.diagonalArmAMm = profile.arms[0];
    junction.diagonalArmBMm = profile.arms[1];
    junction.doorMode = 'open';
    for (const [i, run] of design.runs.entries()) {
      run.heightMm = profile.height;
      run.depthMm = profile.depths[i];
      run.lengthMm = profile.arms[i] + profile.widths[i] + 610 + run.endFillerMm;
      run.panelThicknessMm = t;
      run.backPanelThicknessMm = profile.backs[i];
      run.constructionMode = profile.modes[i];
      run.bays[0].width = { kind: 'fixed', mm: profile.widths[i] };
      run.bays[0].root = splitTree(run.wallAxis);
      if (run.bays.length === 1) {
        run.bays.push({ ...run.bays[0], id: run.bays[0].id + '-second', label: run.wallAxis + ' second bay' });
      }
      run.bays[1].width = { kind: 'flex', weight: 1 };
      run.bays[1].root = {
        kind: 'leaf', id: run.wallAxis + '-double', owner: 'ortak',
        insert: { type: 'doubleHanging' },
      };
      for (const bay of run.bays) bay.frontMode = 'open';
    }

    const input = normalizeAndValidateDesign(design);
    const model = solveDesign(input);
    const pkg = extractProduction(input, model);
    expect(pkg.issues.filter(issue => issue.severity === 'error')).toEqual([]);
    const panels = model.panels.filter(panel => structuralRoles.has(panel.role));
    const byId = new Map(panels.map(panel => [panel.id, panel]));
    expect(byId.size).toBe(panels.length);
    const get = (id: string) => {
      const panel = byId.get(id);
      expect(panel, id).toBeDefined();
      return panel!;
    };

    for (const [i, run] of input.runs.entries()) {
      const ax = run.wallAxis;
      const along = ax === 'A' ? 0 : 2;
      const depth = ax === 'A' ? 2 : 0;
      const arm = profile.arms[i];
      const back = run.backPanelThicknessMm;
      const lower = run.plinthHeightMm;
      const upper = run.heightMm - run.topFillerHeightMm;
      const height = upper - lower;
      const leftInset = run.constructionMode === 'shared' ? 0 : t;
      const firstWidth = profile.widths[i];
      const firstRight = arm + firstWidth;
      const firstInner = [arm + leftInset, firstRight - t];
      const secondInner = [firstRight + leftInset, run.lengthMm - run.endFillerMm - t];
      const firstId = run.bays[0].id;
      const secondId = run.bays[1].id;
      const cornerSide = get(junction.id + '-side-' + ax);
      expect(span(cornerSide, along)).toEqual([arm - t, arm]);
      expect(span(cornerSide, depth)).toEqual([profile.backs[0], run.depthMm]);
      expect(span(cornerSide, 1)).toEqual([lower, upper]);
      expect(cornerSide.cutThicknessMm).toBe(t);
      const cornerBack = get(junction.id + '-back-' + ax);
      expect(span(cornerBack, along)).toEqual([ax === 'A' ? back : 0, arm]);
      expect(span(cornerBack, depth)).toEqual([0, back]);
      expect(span(cornerBack, 1)).toEqual([lower, upper]);
      expect(cornerBack.cutThicknessMm).toBe(back);
      expect(Math.max(...get(junction.id + '-bottom-pentagon').polygonXZMm!
        .map(p => ax === 'A' ? p.xMm : p.zMm))).toBe(arm - t);

      const backPanel = get(firstId + '-back');
      expect(span(backPanel, along)).toEqual([arm, firstRight]);
      expect(span(backPanel, depth)).toEqual([0, back]);
      expect(span(backPanel, 1)).toEqual([lower, upper]);
      expect(backPanel.cutThicknessMm).toBe(back);
      for (const [bayId, inner] of [[firstId, firstInner], [secondId, secondInner]] as const) {
        const bottom = get(bayId + '-bottom');
        const top = get(bayId + '-top');
        expect(span(bottom, 1)).toEqual([lower, lower + t]);
        expect(span(top, 1)).toEqual([upper - t, upper]);
        for (const panel of [bottom, top]) {
          expect(span(panel, along)).toEqual(inner);
          expect(span(panel, depth)).toEqual([back, run.depthMm]);
          expect(panel.cutWidthMm).toBe(inner[1] - inner[0]);
          expect(panel.cutHeightMm).toBe(run.depthMm - back);
        }
        expect(span(get(bayId + '-side-right'), 1)).toEqual([lower, upper]);
      }
      const rightSide = get(firstId + '-side-right');
      expect(span(rightSide, along)).toEqual([firstInner[1], firstRight]);
      expect(span(rightSide, depth)).toEqual([back, run.depthMm]);

      const separator = get(ax + '-columns-vdiv-1');
      const divider = get(ax + '-stack-hdiv-1');
      const middle = get(ax + '-double-double-mid-shelf');
      expect(span(separator, along)).toEqual([firstInner[0] + 181, firstInner[0] + 181 + t]);
      expect(span(separator, 1)).toEqual([lower + t, lower + t + 931]);
      expect(span(separator, depth)).toEqual([back, run.depthMm]);
      expect(span(divider, along)).toEqual(firstInner);
      expect(span(divider, 1)).toEqual([lower + t + 931, lower + t + 931 + t]);
      expect(span(divider, depth)).toEqual([back, run.depthMm]);
      const shelfSpans = [
        [get(ax + '-narrow-shelf-1'), [firstInner[0], firstInner[0] + 181]],
        [get(ax + '-wide-shelf-1'), [firstInner[0] + 181 + t, firstInner[1]]],
        [get(ax + '-upper-shelf-1'), firstInner],
        [middle, secondInner],
      ] as const;
      for (const [panel, inner] of shelfSpans) {
        expect(span(panel, along), panel.id).toEqual(inner);
        expect(span(panel, depth), panel.id).toEqual([back, run.depthMm - 15]);
        expect(panel.cutWidthMm).toBe(inner[1] - inner[0]);
        expect(panel.cutThicknessMm).toBe(t);
      }
      expect(model.bays.find(bay => bay.id === firstId)?.netInnerHeightMm).toBe(height - 2 * t);
    }

    // This uses the mathematical separating plane, without the 0.5 mm manufacturing threshold.
    const solids = panels.map(solid);
    const intersections = solids.flatMap((a, i) => solids.slice(i + 1).flatMap(b =>
      Math.min(a.y[1], b.y[1]) > Math.max(a.y[0], b.y[0]) && polygonsIntersect(a.plan, b.plan)
        ? [[a.id, b.id]]
        : []));
    expect(intersections).toEqual([]);
    expect(pkg.parts.every(part => [part.widthMm, part.heightMm, part.thicknessMm].every(Number.isInteger))).toBe(true);
  });
});

it('places all twenty canonical butt joints in exact face contact', () => {
  const model = solveDesign(normalizeAndValidateDesign(phase5Example('asymmetric')));
  const byId = new Map(model.panels.map(panel => [panel.id, panel]));
  const panels = model.panels.filter(panel => panel.role === 'cornerPolygonShelf');
  expect(panels).toHaveLength(5);
  const rightFaces = [
    ['bay-A1-side-right', ['A-root-hdiv-1'], 0, 2],
    ['bay-A2-side-right', Array.from({ length: 5 }, (_, i) => 'A-shelves-shelf-' + (i + 1)), 0, 2],
    ['bay-B1-side-right', Array.from({ length: 4 }, (_, i) => 'B-shelves-shelf-' + (i + 1)), 2, 0],
  ] as const;
  for (const [id, ids, axis, depth] of rightFaces) {
    const upright = byId.get(id)!;
    for (const shelfId of ids) {
      const panel = byId.get(shelfId)!;
      expect(span(panel, axis)[1], shelfId).toBe(span(upright, axis)[0]);
      expect(span(panel, depth)[0]).toBe(span(upright, depth)[0]);
      expect(span(panel, 1)[0]).toBeGreaterThan(span(upright, 1)[0]);
      expect(span(panel, 1)[1]).toBeLessThan(span(upright, 1)[1]);
    }
  }
  const corner = [
    [byId.get('junc-custom-side-A')!, 0, 'xMm'],
    [byId.get('junc-custom-side-B')!, 2, 'zMm'],
  ] as const;
  for (const [upright, axis, key] of corner) {
    for (const panel of panels) {
      const boundary = Math.max(...panel.polygonXZMm!.map(point => point[key]));
      expect(boundary, panel.id).toBe(span(upright, axis)[0]);
    }
  }
});
