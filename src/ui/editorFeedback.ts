import type { LayoutKind, ResolvedBay, ResolvedDoorLeaf, ResolvedDrawerUnit } from '../core/schema/types';
import type { SelectionGroupAnalysis } from '../core/solver/treeMutator';

type NumberDraftResult = { kind: 'empty' | 'invalid' | 'outOfRange' } | { kind: 'value'; value: number };

export function readNumberDraft(text: string, badInput: boolean, min: number, max: number): NumberDraftResult {
  if (badInput) return { kind: 'invalid' };
  if (!text.trim()) return { kind: 'empty' };
  const value = Number(text);
  if (!Number.isFinite(value)) return { kind: 'invalid' };
  if (value < min || value > max) return { kind: 'outOfRange' };
  return { kind: 'value', value: Math.round(value) };
}

export const blankMeasureFields = {
  lengthAMm: { label: 'A Kolu Uzunluk (mm)', min: 1200, max: 6000, step: 50 },
  depthAMm: { label: 'A Kolu Derinlik (mm)', min: 350, max: 800, step: 20 },
  lengthBMm: { label: 'B Kolu Uzunluk (mm)', min: 1200, max: 6000, step: 50 },
  depthBMm: { label: 'B Kolu Derinlik (mm)', min: 350, max: 800, step: 20 },
  roomHeightMm: { label: 'Oda tavan yüksekliği (mm)', min: 1800, max: 4000, step: 1 },
  heightMm: { label: 'Gardırop yüksekliği (mm)', min: 1800, max: 3000, step: 20 },
} as const;

export type BlankMeasure = keyof typeof blankMeasureFields;
export type BlankMeasureDrafts = Record<BlankMeasure, string>;

export function readBlankMeasurements(drafts: BlankMeasureDrafts, layout: LayoutKind):
  { ok: true; values: Partial<Record<BlankMeasure, number>> } | { ok: false; error: string; field: BlankMeasure } {
  const values: Partial<Record<BlankMeasure, number>> = {};
  for (const key of Object.keys(blankMeasureFields) as BlankMeasure[]) {
    if (layout !== 'l-shape' && (key === 'lengthBMm' || key === 'depthBMm')) continue;
    const { label, min, max } = blankMeasureFields[key];
    const result = readNumberDraft(drafts[key], false, min, max);
    if (result.kind !== 'value') return { ok: false, field: key, error: `${label}: ${min} ile ${max} arasında bir sayı girin.` };
    values[key] = result.value;
  }
  if (values.heightMm !== undefined && values.roomHeightMm !== undefined && values.heightMm > values.roomHeightMm) {
    return { ok: false, field: 'heightMm', error: 'Gardırop yüksekliği oda tavanını aşıyor.' };
  }
  return { ok: true, values };
}

export function shouldExplainExternalDrawers(
  bay: ResolvedBay,
  doors: readonly ResolvedDoorLeaf[],
  drawers: readonly ResolvedDrawerUnit[],
  hasExplicitFront: boolean,
): boolean {
  return !hasExplicitFront && bay.frontMode !== 'open' && bay.frontMode !== 'sliding' &&
    !doors.length && drawers.some(drawer => !drawer.isInternalDrawer && drawer.parentBankHeightMm === bay.netInnerHeightMm);
}

type IntervalSelection = Pick<SelectionGroupAnalysis, 'cells' | 'shelfGroups' | 'isMultiShelfGroupSelection'>;

export function shelfIntervalLimit(selection: IntervalSelection): number {
  // A full shoe rack stays a shoe rack when resized. Its schema allows ten shelves, i.e. eleven intervals.
  return selection.shelfGroups.some(({ cells }) =>
    cells[0]?.insert?.type === 'shoeRack' && cells[0].subIntervalCount === cells.length,
  ) ? 11 : 12;
}

export function defaultShelfIntervalDraft(selection: IntervalSelection, max: number): string {
  if (selection.isMultiShelfGroupSelection) return '';
  return String(Math.min(max, selection.cells.length > 1 ? selection.cells.length + 1 : 3));
}

export function readShelfIntervalDraft(text: string, max: number): number | null {
  const count = Number(text);
  return Number.isInteger(count) && count >= 1 && count <= max ? count : null;
}
