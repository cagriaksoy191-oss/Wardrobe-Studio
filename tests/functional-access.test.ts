import { describe, expect, it } from 'vitest';
import { evaluateAccessOptions } from '../src/core/fronts/accessRemedies';
import { phase5Example } from '../src/core/presets/phase5Examples';
import { extractProduction } from '../src/core/production/productionModel';
import { buildTechnicalSheets, sheetToSvg } from '../src/core/production/technicalSheets';
import { solveDesign } from '../src/core/solver/carcassSolver';
import { useWardrobeStore } from '../src/store/useWardrobeStore';

describe('Functional access and assisted layout review', () => {
  it.each([
    ['diagonal', 5.1, 0, 365],
    ['asymmetric', 12.8, 7, 461],
  ] as const)('classifies %s corner separately from collision and previews a usable opening', (kind, angle, gap, improved) => {
    const design = phase5Example(kind);
    const model = solveDesign(design);
    const pkg = extractProduction(design, model);
    const id = design.junctions[0].id;
    const door = model.doors.find(leaf => leaf.isCornerDoor)!;
    const cells = pkg.functionalAccess.filter(entry => entry.bayId === id);
    expect(door.opening!.safeAngleDeg).toBe(angle);
    expect(pkg.issues.filter(issue => issue.severity === 'error')).toEqual([]);
    expect(pkg.accessStatus).toBe('blocked');
    expect(Math.min(...cells.map(entry => entry.clearWidthMm))).toBe(gap);
    expect(cells.every(entry => entry.status === 'blocked' && entry.requiredWidthMm === 310)).toBe(true);

    const [option] = evaluateAccessOptions(design, model, id);
    expect(option.remedy).toEqual({ kind: 'corner', junctionId: id, mode: 'open' });
    expect(evaluateAccessOptions(design, model, id)).toHaveLength(1);
    expect(option.entries.every(entry => entry.status === 'usable')).toBe(true);
    expect(Math.min(...option.entries.map(entry => entry.clearWidthMm))).toBe(improved);
    expect(option.removed).toEqual(['P-70570E4D']);
    expect(option.resized).toEqual([]);
    expect(option.design.runs).toEqual(design.runs);
    expect(design.junctions[0].doorMode).toBe('left');

    const sheets = buildTechnicalSheets(design, model, pkg, true);
    expect(sheetToSvg(sheets[0])).toContain('KULLANIM ENGELİ');
    expect(sheetToSvg(sheets[0])).toContain(`${angle}° / 110°`);
    expect(sheets.some(sheet => sheet.id.startsWith('13-ERISIM'))).toBe(true);
    expect(sheets.filter(sheet => sheet.id.startsWith('15-KAPAK')).map(sheetToSvg).join('')).toContain('İşlevsel erişim engeli');
  });

  it('tests actual drawer stroke separately from the blind corner B1 hinge angle', () => {
    const design = phase5Example('blind');
    const model = solveDesign(design);
    const entries = model.analysis!.functionalAccess;
    const b1 = model.doors.find(door => door.id === 'door-bay-B1-left')!;
    expect(b1.opening?.safeAngleDeg).toBe(79);
    expect(entries.filter(entry => entry.bayId === b1.bayId).every(entry => entry.status === 'usable')).toBe(true);
    const drawer = entries.find(entry => entry.kind === 'drawer')!;
    expect(drawer.status).toBe('blocked');
    expect(drawer.travel).toEqual({ availableMm: 49, requiredMm: 451 });
    expect(drawer.blockerLabel).toContain('Sürgü');
    const [option] = evaluateAccessOptions(design, model, drawer.bayId);
    expect(option.remedy).toEqual({ kind: 'open-front', frontId: 'front-A-lower' });
    expect(option.entries.find(entry => entry.id === drawer.id)?.travel).toEqual({ availableMm: 451, requiredMm: 451 });
    expect(option.design.fronts.find(front => front.id === 'front-A-upper')).toEqual(design.fronts.find(front => front.id === 'front-A-upper'));
  });

  it('keeps a validated two-step sliding opening and full drawer travel in the straight package', () => {
    const design = phase5Example('straight');
    const model = solveDesign(design);
    const pkg = extractProduction(design, model);
    const drawer = pkg.functionalAccess.find(entry => entry.kind === 'drawer')!;
    expect(pkg.accessStatus).toBe('usable');
    expect(drawer.travel).toEqual({ availableMm: 451, requiredMm: 451 });
    expect(drawer.steps.map(step => step.position)).toEqual([982, 1964]);
  });

  it('applies the preview in one command, preserves the checkpoint and rejects a stale preview', () => {
    const store = useWardrobeStore.getState;
    expect(store().openNamedVersion(phase5Example('diagonal'), 'Erişim testi')).toBe(true);
    store().saveCheckpoint();
    const historyBefore = store().historyPast.length;
    const original = store().design;
    const [option] = evaluateAccessOptions(original, store().resolved, original.junctions[0].id);
    expect(store().applyAccessRemedy(original, option.remedy)).toBe(true);
    expect(store().design.junctions[0].doorMode).toBe('open');
    expect(store().historyPast).toHaveLength(historyBefore + 1);
    expect(store().checkpointDesign).toEqual(original);
    expect(store().applyAccessRemedy(original, option.remedy)).toBe(false);
    store().undo();
    expect(store().design).toEqual(original);
  });
});
