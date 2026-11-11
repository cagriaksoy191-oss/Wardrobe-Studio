import { describe, expect, it } from 'vitest';
import { phase5Example } from '../src/core/presets/phase5Examples';
import { createBlankDesign } from '../src/core/presets/sampleDesigns';
import { DesignSchema } from '../src/core/schema/designSchema';
import { solveDesign } from '../src/core/solver/carcassSolver';
import { analyzeSelectedCellsGroup, setContiguousGroupIntervalCountInDesign } from '../src/core/solver/treeMutator';
import {
  defaultShelfIntervalDraft, readBlankMeasurements, readNumberDraft, readShelfIntervalDraft, shelfIntervalLimit, shouldExplainExternalDrawers,
} from '../src/ui/editorFeedback';

describe('measurement drafts', () => {
  it.each(['999999', '-50', '1799.9', '4000.1'])('rejects %s instead of moving the room ceiling to a limit', draft => {
    expect(readNumberDraft(draft, false, 1800, 4000)).toEqual({ kind: 'outOfRange' });
  });

  it('distinguishes clearing the field from an incomplete number reported by the browser', () => {
    expect(readNumberDraft('', false, 1800, 4000)).toEqual({ kind: 'empty' });
    expect(readNumberDraft('', true, 1800, 4000)).toEqual({ kind: 'invalid' });
    expect(readNumberDraft('1e999', false, 1800, 4000)).toEqual({ kind: 'invalid' });
  });

  it('keeps integer millimetres and allows the configured bounds, including a negative position', () => {
    expect(readNumberDraft('2699.6', false, 1800, 4000)).toEqual({ kind: 'value', value: 2700 });
    expect(readNumberDraft('4000', false, 1800, 4000)).toEqual({ kind: 'value', value: 4000 });
    expect(readNumberDraft('-50', false, -10000, 20000)).toEqual({ kind: 'value', value: -50 });
  });
});

describe('new wardrobe measurements', () => {
  const drafts = { lengthAMm: '3000', depthAMm: '600', lengthBMm: '2500', depthBMm: '520', heightMm: '2450', roomHeightMm: '2680' };

  it('blocks the formerly clamped length and keeps the requested millimetres for a valid L design', () => {
    expect(readBlankMeasurements({ ...drafts, lengthAMm: '999999' }, 'l-shape')).toMatchObject({ ok: false, field: 'lengthAMm' });
    const valid = readBlankMeasurements(drafts, 'l-shape');
    if (!valid.ok) throw new Error(valid.error);
    const design = createBlankDesign({ layoutKind: 'l-shape', ...valid.values });
    expect(design.runs.map(run => [run.lengthMm, run.depthMm, run.heightMm])).toEqual([[3000, 600, 2450], [2500, 520, 2450]]);
    expect(design.roomHeightMm).toBe(2680);
  });

  it('requires visible measures only and still prevents a wardrobe taller than the room', () => {
    const emptyB = { ...drafts, depthBMm: '' };
    expect(readBlankMeasurements(emptyB, 'l-shape')).toMatchObject({ ok: false, field: 'depthBMm' });
    expect(readBlankMeasurements(emptyB, 'straight')).toMatchObject({ ok: true });
    expect(readBlankMeasurements({ ...drafts, roomHeightMm: '2400' }, 'l-shape')).toMatchObject({ ok: false, field: 'heightMm' });
  });
});

describe('automatic hinge feedback', () => {
  it('explains the absent hinge only when real exterior drawers fill the bay', () => {
    const design = phase5Example('straight');
    design.fronts = [];
    const bay = design.runs[0].bays[0];
    bay.frontMode = 'double';
    bay.autoFront = true;
    const drawers = { type: 'drawerBank' as const, drawerCount: 4, isInternalDrawer: false };
    bay.root = { kind: 'leaf', id: 'audit-drawer-bank', label: 'Audit drawers', owner: bay.owner, insert: drawers };
    const solve = (explicit = false) => {
      const model = solveDesign(design);
      const resolvedBay = model.bays.find(item => item.id === bay.id)!;
      const doors = model.doors.filter(item => item.bayId === bay.id);
      const units = model.drawers.filter(item => item.bayId === bay.id);
      return { doors, units, notice: shouldExplainExternalDrawers(resolvedBay, doors, units, explicit) };
    };
    const exterior = solve();
    expect(exterior.units).toHaveLength(4);
    expect(exterior.doors).toHaveLength(0);
    expect(exterior.notice).toBe(true);
    expect(solve(true).notice).toBe(false);
    bay.frontMode = 'open';
    expect(solve().notice).toBe(false);
    bay.frontMode = 'double';
    drawers.isInternalDrawer = true;
    const interior = solve();
    expect(interior.doors).toHaveLength(2);
    expect(interior.notice).toBe(false);
  });
});

describe('shelf interval target', () => {
  it('requires a group target and passes a valid count to the real shelf and shoe rack command', () => {
    const design = phase5Example('straight');
    const [shelfBay, shoeBay] = design.runs[0].bays;
    shelfBay.root = { kind: 'leaf', id: 'audit-shelves', label: 'Audit shelves', owner: shelfBay.owner, insert: { type: 'shelfStack', shelfCount: 7 } };
    shoeBay.root = { kind: 'leaf', id: 'audit-shoes', label: 'Audit shoes', owner: shoeBay.owner, insert: { type: 'shoeRack', shoeTiers: 5 } };
    const model = solveDesign(design);
    const selection = model.cells.filter(cell => cell.sourceLeafId === shelfBay.root.id || cell.sourceLeafId === shoeBay.root.id).map(cell => cell.id);
    const group = analyzeSelectedCellsGroup(selection, model);
    expect(group.shelfGroups).toHaveLength(2);
    expect(group.cells).toHaveLength(14);
    const max = shelfIntervalLimit(group);
    expect(max).toBe(11);
    expect(readShelfIntervalDraft(defaultShelfIntervalDraft(group, max), max)).toBeNull();
    expect(readShelfIntervalDraft('15', max)).toBeNull();
    expect(readShelfIntervalDraft('12', max)).toBeNull();
    expect(readShelfIntervalDraft('4.5', max)).toBeNull();
    const target = readShelfIntervalDraft('5', max);
    expect(target).toBe(5);
    if (target === null) throw new Error('A valid count must be applicable');
    const { newSelectedCellIds } = setContiguousGroupIntervalCountInDesign(design, selection, target, model);
    expect(DesignSchema.safeParse(design).success).toBe(true);
    expect(newSelectedCellIds).toHaveLength(10);
    const after = solveDesign(design);
    expect(after.cells.filter(cell => cell.sourceLeafId === 'audit-shelves')).toHaveLength(5);
    expect(after.cells.filter(cell => cell.sourceLeafId === 'audit-shoes' && cell.insert?.type === 'shoeRack')).toHaveLength(5);
  });
});
