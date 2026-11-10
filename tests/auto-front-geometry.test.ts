import { describe, expect, it } from 'vitest';
import { constrainMotion, buildMotionScene } from '../src/core/analysis/motionConstraints';
import { MotionSimulator } from '../src/core/analysis/motionSimulator';
import { hingedHandleSurface, hingedVolumes, polygonsIntersect, rotateExact } from '../src/core/analysis/kinematics';
import { frontVerticalRange } from '../src/core/fronts/frontGeometry';
import { configureFrontInDesign, splitFrontRangeInDesign } from '../src/core/fronts/frontCommands';
import { SAMPLE_DESIGNS } from '../src/core/presets/sampleDesigns';
import { phase5Example } from '../src/core/presets/phase5Examples';
import { extractProduction } from '../src/core/production/productionModel';
import { buildCutListCsv } from '../src/core/production/csvExport';
import { buildTechnicalSheets, sheetToSvg } from '../src/core/production/technicalSheets';
import { normalizeAndValidateDesign } from '../src/core/schema/designSchema';
import { solveDesign } from '../src/core/solver/carcassSolver';
import { useWardrobeStore } from '../src/store/useWardrobeStore';

const straight = () => structuredClone(SAMPLE_DESIGNS['straight-wardrobe']);

describe('Automatic front geometry', () => {
  it.each([110, 155, 165] as const)('clears closed parallel neighbors up to %i° without excluding any uprights', target => {
    const design = straight();
    design.runs[0].bays.forEach(bay => { bay.hingeAngleDeg = target; });
    const model = solveDesign(design);
    const door = model.doors.find(d => d.id === 'door-bay-S1-right')!;
    const scene = buildMotionScene(design, model);
    expect(scene.parts.find(part => part.id === door.id)?.ignoredStaticIds.size).toBe(0);
    expect(door.opening?.safeAngleDeg).toBe(target);
    expect(door.pivotWorldMm[2]).toBe(design.runs[0].depthMm + door.thicknessMm + 1);
    expect(hingedVolumes(door, 0)[0].polygon.every(point => point.zMm >= design.runs[0].depthMm + 1)).toBe(true);
    expect(constrainMotion(scene, {}, door.id, 1)).toMatchObject({ position: 1, blocked: false });
  });

  it('distinguishes design clearance from an adjacent door already open', () => {
    const design = straight();
    const model = solveDesign(design);
    const scene = buildMotionScene(design, model);
    const door = model.doors.find(d => d.id === 'door-bay-S1-right')!;
    const neighbor = model.doors.find(d => d.id === 'door-bay-S2-left')!;
    expect(door.opening?.safeAngleDeg).toBe(110);
    const limit = constrainMotion(scene, { [neighbor.id]: 1 }, door.id, 1);
    expect(limit).toMatchObject({ blocked: true, blockerId: neighbor.id });
    expect(limit.position).toBeGreaterThan(0);
    expect(limit.position).toBeLessThan(1);
    expect(limit.reason).toContain('Önce engel olan parçayı kapatın');
    expect(hingedVolumes(door, limit.position).some(a => hingedVolumes(neighbor, 1)
      .some(b => Math.min(a.y1, b.y1) > Math.max(a.y0, b.y0) && polygonsIntersect(a.polygon, b.polygon)))).toBe(false);
  });

  it('guides the user out of a real drawer and slider interlock without moving the other part', () => {
    const design = phase5Example('straight');
    const model = solveDesign(design);
    const [leaf, neighbor] = model.slidingDoors!;
    const drawer = model.drawers[0];
    const sim = new MotionSimulator();
    sim.load(design, model);
    sim.dragTo(leaf.id, leaf.maxOffsetMm);
    sim.dragTo(neighbor.id, neighbor.maxOffsetMm);
    const advance = (drawers: Record<string, boolean>) => {
      for (let i = 0; i < 300; i++) sim.step(1 / 60, {}, drawers);
    };
    advance({ [drawer.id]: true });
    expect(sim.positions[drawer.id]).toBe(1);
    const stop = sim.dragTo(leaf.id, 0);
    expect(stop.blockerId).toBe(drawer.id);
    expect(stop.reason).toContain('Sürgüyü geri kaydırın');
    expect(sim.positions[drawer.id]).toBe(1);
    advance({});
    expect(sim.positions[drawer.id]).toBeGreaterThan(0);
    expect(sim.stops[drawer.id].reason).toContain('çekmece açıklığının dışına');
    sim.dragTo(leaf.id, leaf.maxOffsetMm);
    advance({});
    expect(sim.positions[drawer.id]).toBe(0);
    expect(sim.dragTo(leaf.id, 0)).toMatchObject({ position: 0, blocked: false });
  });

  it.each([[18, 8], [25, 4], [18, 3], [16, 6], [36, 18]])('resolves automatic cuts against the real %i/%i body', (t, tb) => {
    const design = straight();
    const run = design.runs[0];
    run.panelThicknessMm = t;
    run.backPanelThicknessMm = tb;
    run.bays[0].frontMode = 'auto';
    run.bays[0].width = { kind: 'fixed', mm: 1000 };
    const model = solveDesign(design);
    const doors = model.doors.filter(door => door.bayId === run.bays[0].id);
    expect(doors).toHaveLength(2);
    const gap = doors[0].clearanceMm!;
    expect(doors.reduce((sum, door) => sum + door.widthMm, 0) + gap.spanStart + gap.spanEnd + gap.centerSeam!).toBe(1000);
    expect(doors.every(door => door.thicknessMm === t && door.heightMm === run.heightMm - run.topFillerHeightMm - run.plinthHeightMm - 4)).toBe(true);
    const initial = solveDesign({ ...design, runs: [{ ...run, constructionMode: 'shared' }] });
    expect(initial.doors.filter(door => door.bayId === run.bays[0].id).reduce((sum, door) => sum + door.widthMm, 0))
      .toBe(doors.reduce((sum, door) => sum + door.widthMm, 0) - Math.round(t / 2));
  });

  it('chooses an alternate supported hand only for automatic intent and preserves leaf identity', () => {
    const design = structuredClone(SAMPLE_DESIGNS['l-blind-corner']);
    const bay = design.runs[0].bays[0];
    const auto = solveDesign(design).doors.find(door => door.bayId === bay.id)!;
    expect(auto.hingeSide).toBe('right');
    expect(auto.opening?.safeAngleDeg).toBe(110);
    bay.frontMode = 'singleLeft';
    const chosen = solveDesign(design).doors.find(door => door.bayId === bay.id)!;
    expect(chosen.id).toBe(auto.id);
    expect(chosen.hingeSide).toBe('left');
    expect(chosen.opening?.alternative).toEqual({ side: 'right', safeAngleDeg: 110 });
    expect(chosen.opening!.safeAngleDeg).toBeLessThan(110);
  });

  it('keeps explicit wide leaves, and gives an inset opening different bounds from overlay', () => {
    const design = straight();
    const run = design.runs[0];
    const bay = run.bays[0];
    const id = configureFrontInDesign(design, solveDesign(design), bay.id, undefined, 'hinged');
    const front = design.fronts.find(f => f.id === id)!;
    front.hingeSide = 'right';
    const overlay = solveDesign(design);
    const door = overlay.doors.find(d => d.frontId === id)!;
    expect(door.widthMm).toBeGreaterThan(600);
    expect(overlay.issues.some(i => i.code === 'DOOR_LEAF_TOO_WIDE' && i.targetId === door.id)).toBe(true);
    front.hingeMount = 'inset';
    const insetModel = solveDesign(design);
    const inset = insetModel.doors.find(d => d.frontId === id)!;
    expect(inset.id).toBe(door.id);
    expect(inset.mounting).toBe('inset');
    expect(inset.pivotWorldMm[2]).toBe(run.depthMm);
    expect(inset.widthMm + 2 * inset.clearanceMm!.spanStart).toBe(insetModel.bays[0].netInnerWidthMm);
    expect(inset.heightMm + 4).toBe(insetModel.bays[0].netInnerHeightMm);
  });

  it('follows roof and split seam, preserves expert elevations and round trips anchor intent', () => {
    const design = straight();
    const run = design.runs[0];
    const id = configureFrontInDesign(design, solveDesign(design), run.bays[0].id, undefined, 'hinged');
    splitFrontRangeInDesign(design, id, 1800);
    const [lower, upper] = design.fronts;
    const before = frontVerticalRange(run, upper);
    run.heightMm += 170;
    const restored = normalizeAndValidateDesign(JSON.parse(JSON.stringify(design)));
    const range = frontVerticalRange(restored.runs[0], restored.fronts[1]);
    expect(range).toEqual({ start: before.start + 170, end: before.end + 170 });
    expect(range.start - frontVerticalRange(run, lower).end).toBe(4);
    expect(solveDesign(restored).doors.find(d => d.frontId === upper.id)?.heightMm).toBe(before.end - before.start);
  });

  it('applies a body edit to legacy hybrid coverage atomically and restores it on Undo', () => {
    const design = phase5Example('diagonal');
    const store = useWardrobeStore.getState();
    expect(store.openNamedVersion(design, 'Geometri testi')).toBe(true);
    const previous = useWardrobeStore.getState();
    const id = design.fronts.find(front => front.type === 'hinged')!.id;
    const door = previous.resolved.doors.find(d => d.frontId === id)!;
    previous.updateRunDimension(design.runs[0].id, 'heightMm', 2300);
    const resized = useWardrobeStore.getState();
    expect(resized.commandError).toBeNull();
    expect(resized.resolved.doors.find(d => d.id === door.id)?.heightMm).toBe(door.heightMm - 100);
    expect(resized.design.fronts.find(f => f.id === id)?.yEndAnchor).toBe('top');
    resized.undo();
    expect(useWardrobeStore.getState().design.fronts).toEqual(previous.design.fronts);
  });

  it('recomputes both flex runs and the angled corner from their edited dimensions', () => {
    const design = phase5Example('asymmetric');
    const store = useWardrobeStore.getState;
    expect(store().openNamedVersion(design, 'L kolları')).toBe(true);
    const [a, b] = design.runs;
    const door = (id: string) => store().resolved.doors.find(d => d.id === id)!;
    const aId = 'door-front-A-upper-right', bId = 'door-bay-B1-right';
    const old = { a: door(aId).widthMm, b: door(bId).widthMm };
    store().updateRunDimension(a.id, 'lengthMm', a.lengthMm + 100);
    expect(door(aId).widthMm).toBeGreaterThan(old.a);
    expect(door(bId).widthMm).toBe(old.b);
    store().updateRunDimension(b.id, 'lengthMm', b.lengthMm + 100);
    expect(door(bId).widthMm).toBeGreaterThan(old.b);
    const cornerId = store().resolved.doors.find(d => d.isCornerDoor)!.id;
    const cornerWidth = door(cornerId).widthMm;
    store().updateCornerParam('diagonalArmAMm', design.junctions[0].diagonalArmAMm + 60);
    expect(door(cornerId).widthMm).toBeGreaterThan(cornerWidth);
    expect(store().commandError).toBeNull();
  });

  it('keeps merged front intent through a split and through edits to both body edges', () => {
    const design = straight();
    const run = design.runs[0], bay = run.bays[0];
    const id = configureFrontInDesign(design, solveDesign(design), bay.id, undefined, 'hinged');
    design.fronts[0].materialId = 'naturalWalnut';
    const store = useWardrobeStore.getState;
    expect(store().openNamedVersion(design, 'Kapak kapsamı')).toBe(true);
    const lower = () => store().resolved.doors.find(d => d.frontId === id)!;
    const previous = lower();
    store().splitBayDoorHorizontally(bay.id, 1800);
    expect(store().design.fronts).toHaveLength(2);
    expect(store().resolved.doors.find(d => d.frontId === store().design.fronts[1].id)!.yStartMm - lower().yEndMm).toBe(4);
    store().mergeBayDoors(bay.id);
    expect(store().design.fronts).toHaveLength(1);
    expect(lower()).toMatchObject({ id: previous.id, heightMm: previous.heightMm, materialId: 'naturalWalnut' });
    store().updateRunDimension(run.id, 'plinthHeightMm', run.plinthHeightMm + 35);
    store().updateRunDimension(run.id, 'topFillerHeightMm', run.topFillerHeightMm - 20);
    expect(lower().yStartMm).toBe(previous.yStartMm + 35);
    expect(lower().yEndMm).toBe(previous.yEndMm + 20);
    expect(store().commandError).toBeNull();
  });

  it('retains surviving multi-bay front scope and adapts standard rails when the body changes', () => {
    const design = phase5Example('straight');
    const store = useWardrobeStore.getState;
    const runId = design.runs[0].id, [a, b] = design.runs[0].bays;
    const frontId = design.fronts[0].id;
    expect(store().openNamedVersion(design, 'Sürgü kapsamı')).toBe(true);
    const leaves = () => store().resolved.slidingDoors!.filter(d => d.frontId === frontId);
    const old = leaves()[0];
    store().addBayAtRunEnd(runId, 'end', { starterKind: 'empty', widthMode: 'fixed', widthMm: 550 });
    expect(store().resolved.bays).toHaveLength(3);
    expect(leaves()[0].widthMm).toBeLessThan(old.widthMm);
    store().removeBay(runId, b.id);
    expect(store().design.fronts[0].bayIds).toEqual([a.id]);
    expect(leaves()[0].id).toBe(old.id);
    store().updateMaterialThicknesses(25, 4);
    expect(leaves()).toHaveLength(3);
    expect(leaves()[0].thicknessMm).toBe(25);
    expect(store().resolved.slidingSystems![0].trackSpacingMm).toBe(37);
    expect(store().resolved.issues.some(issue => issue.code === 'SLIDING_TRACK_CLEARANCE')).toBe(false);
  });

  it('keeps the selection and history when an extra fixed bay cannot fit the wall', () => {
    const design = phase5Example('straight');
    const run = design.runs[0];
    for (const bay of run.bays) bay.width = { kind: 'fixed', mm: 1490 };
    const store = useWardrobeStore.getState;
    expect(store().openNamedVersion(design, 'Sabit dolu kol')).toBe(true);
    const original = store().design;
    const cell = store().resolved.cells.find(entry => entry.bayId === run.bays[0].id)!;
    store().selectCell(cell.id, cell.bayId);
    const history = store().historyPast;
    expect(store().addBayAtRunEnd(run.id, { starterKind: 'drawers', widthMode: 'fixed', widthMm: 600 })).toBe(false);
    expect(store().commandError).toBeTruthy();
    expect(store().design).toBe(original);
    expect(store().selectedCellId).toBe(cell.id);
    expect(store().historyPast).toBe(history);
  });

  it('feeds a resized cut to the CSV and to the vector sheet shared by PDF and SVG', () => {
    const design = straight();
    const bay = design.runs[0].bays[0];
    bay.frontMode = 'double';
    bay.width = { kind: 'fixed', mm: 800 };
    const before = extractProduction(design, solveDesign(design));
    bay.width.mm = 1000;
    const model = solveDesign(design);
    const pkg = extractProduction(design, model);
    const door = model.doors.find(d => d.bayId === bay.id)!;
    const cut = pkg.frontDetails.find(d => d.unitId === door.id)!;
    const old = before.frontDetails.find(d => d.partCode === cut.partCode)!;
    expect(cut.cutSizeMm[0]).toBe(old.cutSizeMm[0] + 100);
    expect(cut.cutSizeMm).toEqual([door.widthMm, door.heightMm, door.thicknessMm]);
    const sheet = buildTechnicalSheets(design, model, pkg).find(s => s.id.startsWith('15-KAPAK') && s.partCodes.includes(cut.partCode))!;
    expect(sheetToSvg(sheet)).toContain(cut.cutSizeMm.join(' × '));
    const csvRow = buildCutListCsv(pkg).split('\r\n').find(row => row.includes(`;"${cut.partCode}";`));
    expect(csvRow).toContain(`;"${door.widthMm}";"${door.heightMm}";"${door.thicknessMm}";`);
  });

  it.each(['diagonal', 'blind', 'asymmetric'] as const)('rebuilds %s cuts and preserves canonical closed pose and hardware geometry', kind => {
    const design = phase5Example(kind);
    for (const run of design.runs) {
      run.depthMm -= 25;
      run.lengthMm += 50;
    }
    const model = solveDesign(design);
    const pkg = extractProduction(design, model);
    expect(model.doors.length).toBeGreaterThan(0);
    for (const door of model.doors) {
      const detail = pkg.frontDetails.find(d => d.unitId === door.id)!;
      const part = pkg.parts.find(p => p.code === detail.partCode)!;
      const local = door.leafCenterOffsetMm;
      const closed = rotateExact({ xMm: local[0], zMm: local[2] }, door.closedRotationYRad,
        { xMm: door.pivotWorldMm[0], zMm: door.pivotWorldMm[2] });
      expect(detail.closedCenterMm[0]).toBeCloseTo(closed.xMm, 8);
      expect(detail.closedCenterMm[2]).toBeCloseTo(closed.zMm, 8);
      expect(part).toMatchObject({ widthMm: door.widthMm, heightMm: door.heightMm, thicknessMm: door.thicknessMm });
      expect(detail.handle.surfaceMm).toEqual(hingedHandleSurface(door));
      expect(door.opening!.safeAngleDeg).toBeLessThanOrEqual(door.maxAngleDeg);
    }
  });
});
