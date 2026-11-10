import { isValidElement, type ReactElement } from 'react';
import { describe, expect, it } from 'vitest';
import { WardrobeItemsPreview } from '../src/canvas/wardrobe/WardrobeItemsPreview';
import { itemPreviewPlan } from '../src/core/inserts/itemPreview';
import { phase5Example } from '../src/core/presets/phase5Examples';
import { buildCutListCsv } from '../src/core/production/csvExport';
import { extractProduction, polygonCutGroups } from '../src/core/production/productionModel';
import { buildPrintableReport, buildTechnicalSheets, sheetToSvg } from '../src/core/production/technicalSheets';
import type { InteriorItemsConfig } from '../src/core/schema/types';
import { solveDesign } from '../src/core/solver/carcassSolver';
import { designDimensions, designMetrics } from '../src/core/versions/designExchange';
import { useWardrobeStore } from '../src/store/useWardrobeStore';

describe('Physical previews and independent surfaces', () => {
  it.each([[true, true, true], [true, false, false], [false, true, false], [false, false, false]])(
    'renders service items only with both switches (global %s, service %s)',
    (enabled, showServiceItems, shown) => {
      const design = phase5Example('straight');
      design.runs[0].bays[0].root = {
        kind: 'leaf', id: 'service-qa', insert: { type: 'serviceNiche',
          serviceItems: [{ id: 'ladder', name: 'Merdiven', widthMm: 130, depthMm: 480, heightMm: 1550 }] },
      };
      const { cells, panels } = solveDesign(design);
      const interiorItemsConfig: InteriorItemsConfig = { enabled, showServiceItems, density: 'medium' };
      const view = WardrobeItemsPreview({ cells: cells.filter(cell => cell.id === 'service-qa'), panels, interiorItemsConfig });
      expect(isValidElement<{ children: (ReactElement | null)[] }>(view)
        && view.props.children.some(child => child !== null)).toBe(shown);
    }
  );

  it('keeps the 1220 mm garment and reports the required space instead of shrinking it', () => {
    const design = phase5Example('straight');
    const bay = design.runs[0].bays[0];
    bay.root = {
      kind: 'split', id: 'preview-split', direction: 'horizontal',
      children: [
        { id: 'preview-child', size: { kind: 'fixed', mm: 944 },
          node: { kind: 'leaf', id: 'long-preview', insert: { type: 'hangingRod', itemPreset: 'longDresses' } } },
        { id: 'preview-rest', size: { kind: 'flex', weight: 1 }, node: { kind: 'leaf', id: 'empty-preview', insert: null } },
      ],
    };
    const plan = (model: ReturnType<typeof solveDesign>) => itemPreviewPlan(
      model.cells.find(cell => cell.id === 'long-preview')!,
      model.panels.find(panel => panel.role === 'hangingRod' && panel.cellId === 'long-preview')
    )!;
    const model = solveDesign(design);
    expect(plan(model)).toMatchObject({ heightMm: 1220, count: 0 });
    expect(model.issues.some(issue => issue.code === 'PREVIEW_ITEM_FIT' && issue.description.includes('1220'))).toBe(true);
    bay.root.children[0].size = { kind: 'fixed', mm: 1610 };
    expect(plan(solveDesign(design)).heightMm).toBe(1220);
    expect(plan(solveDesign(design)).count).toBeGreaterThan(0);
  });

  it('uses the palette click command without overwriting a previously chosen shelf', () => {
    const store = useWardrobeStore.getState();
    store.openNamedVersion(phase5Example('straight'), 'Malzeme testi');
    store.setSurfaceMaterial('shelf', 'naturalWalnut');
    store.setSurfaceMaterial('carcass', 'matteWhite');
    const { design, resolved } = useWardrobeStore.getState();
    expect(design.materials).toMatchObject({ shelfMaterialId: 'naturalWalnut', carcassMaterialId: 'matteWhite' });
    const parts = extractProduction(design, resolved).parts;
    expect(parts.find(part => part.role === 'shelf')?.materialId).toBe('naturalWalnut');
    expect(parts.find(part => part.role === 'sidePanel')?.materialId).toBe('matteWhite');
    store.undo();
    expect(useWardrobeStore.getState().design.materials.shelfMaterialId).toBe('naturalWalnut');
  });
});

describe('Production drawing and comparison consistency', () => {
  it('keeps a finite error preview while blocking printable exports of an empty invalid assembly', () => {
    const design = phase5Example('diagonal');
    design.junctions = [];
    const model = solveDesign(design), pkg = extractProduction(design, model);
    const sheets = buildTechnicalSheets(design, model, pkg, true);
    expect(pkg.status).toBe('blocked');
    expect(sheets.map(sheet => sheetToSvg(sheet)).join('')).not.toMatch(/NaN|Infinity/);
    expect(() => buildPrintableReport(pkg, sheets)).toThrow('Kritik');
  });
  it.each(['diagonal', 'asymmetric'] as const)('paints the back before the B shelf in %s', kind => {
    const design = phase5Example(kind), model = solveDesign(design), pkg = extractProduction(design, model);
    const sheet = buildTechnicalSheets(design, model, pkg, true).find(s => s.id === '06-MOD-bay-B1')!;
    const order = sheet.elements.flatMap(element => element.kind === 'polygon' && element.partCode ? [element.partCode] : []);
    const back = pkg.parts.find(part => part.role === 'backPanel' && part.moduleIds.includes('bay-B1'))!;
    const shelves = pkg.parts.filter(part => part.role === 'shelf' && part.moduleIds.includes('bay-B1'));
    expect(order.indexOf(back.code)).toBeGreaterThanOrEqual(0);
    expect(shelves.length).toBeGreaterThan(0);
    expect(shelves.every(part => order.indexOf(part.code) > order.indexOf(back.code))).toBe(true);
  });

  it('groups the identical polygon cuts with a reference to every individual part', () => {
    const design = phase5Example('asymmetric'), model = solveDesign(design), pkg = extractProduction(design, model);
    const [group] = polygonCutGroups(pkg, true);
    expect(group.parts).toHaveLength(5);
    const sheets = buildTechnicalSheets(design, model, pkg, true);
    const drawing = sheets.find(s => s.id === group.id)!;
    expect(drawing.partCodes).toEqual(group.parts.map(part => part.code));
    const coordinatePage = sheets.find(s => s.id === group.id + '-KOORD-1')!;
    const csv = buildCutListCsv(pkg, true);
    for (const part of group.parts) {
      expect(coordinatePage.elements.some(el => el.kind === 'text' && el.text === part.code)).toBe(true);
      expect(csv.split('\r\n').find(line => line.includes(part.code))).toContain(group.id);
      expect(part.edges.reduce((total, edge) => total + edge.turnAngleDeg, 0)).toBeCloseTo(360, 8);
    }
  });

  it('links all modeled front positions and hardware and keeps a separate exploded assembly', () => {
    const design = phase5Example('asymmetric'), model = solveDesign(design), pkg = extractProduction(design, model);
    expect(pkg.frontDetails).toHaveLength(model.doors.length + model.slidingDoors!.length);
    for (const row of pkg.frontDetails) {
      const cut = pkg.parts.find(part => part.code === row.partCode)!;
      expect(row.closedCenterMm).toEqual(cut.worldCenterMm);
      expect(row.hardwareCodes.every(code => pkg.hardware.some(item => item.code === code))).toBe(true);
      if (row.motion.kind === 'hinged') {
        expect(row.motion.pivotMm).toEqual(model.doors.find(door => door.id === row.unitId)!.pivotWorldMm);
      }
    }
    const corner = buildTechnicalSheets(design, model, pkg, true).find(sheet => sheet.id === '14-MONTAJ-junc-custom');
    expect(corner?.partCodes.length).toBe(7);
  });

  it('compares real dimensions and reuses net storage without conflating physical and material areas', () => {
    const design = phase5Example('asymmetric'), model = solveDesign(design);
    const dimensions = designDimensions(design, model);
    expect(dimensions).toMatchObject({ layout: 'L', depthRelation: 'Asimetrik derinlik', depthA: 600, depthB: 480, height: 2400 });
    expect(designDimensions(phase5Example('straight')).lengthB).toBeUndefined();
    const pkg = extractProduction(design, model);
    const metrics = designMetrics(design, model);
    expect(dimensions.outer).toEqual(pkg.outerEnvelopeMm);
    expect(metrics.shelfAreaM2).toBe(model.summary.totalShelfAreaM2);
    expect(metrics.shelfAreaM2 * 1e6).toBeCloseTo(pkg.surfaceAreasMm2.netStorage, 6);
    expect(metrics.physicalShelfAreaM2).toBeLessThan(metrics.panelsAreaM2);
    expect(metrics.shelfAreaM2).not.toBe(metrics.physicalShelfAreaM2);
  });
});

it('keeps the A front and rail fixed on a rear-depth command through Undo and Redo', () => {
  const store = useWardrobeStore.getState();
  const design = phase5Example('straight');
  store.openNamedVersion(design, 'Z ankrajı');
  const current = useWardrobeStore.getState;
  const rails = () => current().resolved.slidingSystems![0].railBoxes.map(box => box.centerMm);
  const before = rails();
  const cell = current().resolved.cells.find(candidate => candidate.id === 'A-hanging')!;
  store.selectCell(cell.id, cell.bayId);
  store.startOrUpdateResizeDraft('Z', 'back', 500);
  expect(store.commitResizeDraft()).toBe(true);
  expect(current().design.runs[0]).toMatchObject({ depthMm: 508, rearOffsetMm: 92 });
  expect(rails()).toEqual(before);
  store.undo();
  expect(current().design.runs[0].depthMm).toBe(600);
  store.redo();
  expect(current().design.runs[0].rearOffsetMm).toBe(92);
  expect(rails()).toEqual(before);
});

it.each(['left', 'right'] as const)('keeps the fixed side of the interior X command to the %s', direction => {
  const design = phase5Example('straight');
  const bay = design.runs[0].bays[0];
  bay.root = {
    kind: 'split', id: 'x-qa', direction: 'vertical',
    children: ['l', 'm', 'r'].map(key => ({
      id: 'x-slot-' + key, size: { kind: 'flex', weight: 1 },
      node: { kind: 'leaf', id: 'x-cell-' + key, insert: null },
    })),
  };
  const store = useWardrobeStore.getState();
  store.openNamedVersion(design, 'X ankrajı');
  const current = () => useWardrobeStore.getState().resolved.cells.find(cell => cell.id === 'x-cell-m')!;
  const before = current();
  const sign = direction === 'left' ? 1 : -1;
  const fixed = before.worldCenterMm[0] + sign * before.netWidthMm / 2;
  store.selectCell(before.id, bay.id);
  store.startOrUpdateResizeDraft('X', direction, before.netWidthMm + 40);
  store.autoBalanceResizeDraftNeighbor();
  expect(store.commitResizeDraft()).toBe(true);
  expect(current().netWidthMm).toBe(before.netWidthMm + 40);
  expect(current().worldCenterMm[0] + sign * current().netWidthMm / 2).toBe(fixed);
});
