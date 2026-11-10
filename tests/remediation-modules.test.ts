import { expect, it } from 'vitest';
import { pointInConvexPolygon, resolveMotions } from '../src/core/analysis/kinematics';
import { phase5Example } from '../src/core/presets/phase5Examples';
import { extractProduction } from '../src/core/production/productionModel';
import { normalizeAndValidateDesign } from '../src/core/schema/designSchema';
import { solveDesign } from '../src/core/solver/carcassSolver';
import { useWardrobeStore } from '../src/store/useWardrobeStore';

it.each([519, 520, 525, 529, 530])('uses the 530 mm hanging depth limit at %i mm', depth => {
  const design = phase5Example('straight');
  design.runs[0].depthMm = depth + 8;
  const model = solveDesign(design);
  expect(model.issues.some(issue => issue.code === 'SHALLOW_HANGING_DEPTH' && issue.targetId === 'A-hanging')).toBe(depth < 530);
});

it('applies the garment type to available rod clearance without shifting a manual rod', () => {
  const design = phase5Example('straight');
  const bay = design.runs[0].bays[0];
  for (const [rodHeightType, expectedWarning] of [['short', false], ['medium', false], ['long', true]] as const) {
    bay.root = { kind: 'leaf', id: 'height-kind', insert: { type: 'hangingRod', rodHeightType, rodHeightMm: 1035 } };
    const model = solveDesign(design);
    const rod = model.panels.find(p => p.role === 'hangingRod' && p.cellId === bay.root.id)!;
    const cell = model.cells.find(c => c.id === bay.root.id)!;
    expect(rod.worldPositionMm[1] - cell.yStartMm).toBe(1035);
    expect(model.issues.some(i => i.code === 'GARMENT_DROP_TOO_SHORT' && i.targetId === cell.id)).toBe(expectedWarning);
  }
});

it('fits a physical corner rod between shelves and includes it in capacity and hardware', () => {
  const design = phase5Example('asymmetric');
  design.junctions[0].shelvesCount = 1;
  design.junctions[0].hasHangingRod = true;
  const model = solveDesign(design);
  const rod = model.panels.find(p => p.id.endsWith('-corner-rod'))!;
  expect(rod).toBeDefined();
  const cell = model.cells.find(c => c.id === rod.cellId)!;
  expect(rod.worldPositionMm[1] - 14).toBeGreaterThan(cell.yStartMm);
  expect(rod.worldPositionMm[1] + 14).toBeLessThan(cell.yEndMm);
  for (const sign of [-1, 1]) expect(pointInConvexPolygon({
    xMm: rod.worldPositionMm[0] + sign * rod.cutWidthMm / 2, zMm: rod.worldPositionMm[2],
  }, cell.polygonXZMm!)).toBe(true);
  expect(model.analysis!.metrics.ortak.hangingLengthMm).toBeGreaterThan(0);
  expect(extractProduction(design, model).hardware.some(h => h.label.includes('Köşe askı borusu'))).toBe(true);
});

it.each([['partial', 440], ['full', 550], [undefined, 451]] as const)(
  'carries the %s drawer choice through JSON and motion',
  (drawerSlide, travel) => {
    const design = phase5Example('straight');
    const root = design.runs[0].bays[0].root;
    if (root.kind !== 'split' || root.children[0].node.kind !== 'leaf') throw new Error('fixture');
    Object.assign(root.children[0].node.insert!, { drawerSlide });
    const restored = normalizeAndValidateDesign(JSON.parse(JSON.stringify(design)));
    const model = solveDesign(restored);
    expect(model.drawers[0].maxSlideMm).toBe(travel);
    expect(resolveMotions(model).some(m => m.id === model.drawers[0].id && m.travelMm === travel)).toBe(true);
    expect(extractProduction(restored, model).hardware.some(h => h.detail.includes('çıkma ' + travel + ' mm'))).toBe(true);
  }
);

it('blocks a lift-out path even when the service item fits statically', () => {
  const design = phase5Example('straight');
  const bay = design.runs[0].bays[0];
  const height = solveDesign(design).bays[0].netInnerHeightMm;
  const item = { id: 'lift', name: 'Asılı merdiven', widthMm: 120, depthMm: 400, heightMm: height - 20 };
  bay.root = {
    kind: 'leaf', id: 'lift-niche', insert: { type: 'serviceNiche', serviceItems: [item] },
  };
  expect(solveDesign(design).issues.some(i => i.code === 'SERVICE_NICHE_LIFT_CLEARANCE')).toBe(false);
  Object.assign(item, { liftClearanceMm: 30 });
  const normalized = normalizeAndValidateDesign(JSON.parse(JSON.stringify(design)));
  const model = solveDesign(normalized);
  expect(model.issues.some(i => i.code === 'SERVICE_NICHE_LIFT_CLEARANCE' && i.severity === 'error')).toBe(true);
});

it('moves one adjustable shelf by exactly 32 mm and restores its datum on Undo', () => {
  const store = useWardrobeStore.getState();
  expect(store.importJsonString(JSON.stringify(phase5Example('straight'))).ok).toBe(true);
  const model = () => useWardrobeStore.getState().resolved;
  const shelves = () => model().panels.filter(p => p.id.startsWith('A-shelves-shelf-'));
  const id = model().cells.find(c => c.sourceLeafId === 'A-shelves')!.id;
  store.adjustShelfGrid(id, 0);
  const aligned = shelves().map(p => p.worldPositionMm[1]);
  const base = model().cells.find(c => c.id === id)!.yStartMm;
  expect(aligned.every((y, i) => (y - shelves()[i].cutThicknessMm / 2 - base) % 32 === 0)).toBe(true);
  store.adjustShelfGrid(id, 1);
  expect(shelves().map(p => p.worldPositionMm[1])).toEqual([aligned[0] + 32, ...aligned.slice(1)]);
  store.undo();
  expect(shelves().map(p => p.worldPositionMm[1])).toEqual(aligned);
});
