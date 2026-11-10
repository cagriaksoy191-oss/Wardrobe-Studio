import type { InteriorItemPreset, InteriorItemsConfig, ResolvedCell, ResolvedPanel } from '../schema/types';
import { INSERT_REGISTRY } from './insertRegistry';

const SIZES = {
  shirts: [44, 710, 450],
  jackets: [56, 780, 450],
  trousers: [32, 680, 360],
  longDresses: [48, 1220, 450],
  foldedClothes: [240, 34, 340],
  shoes: [215, 66, 285],
  bags: [250, 272, 151],
  storageBoxes: [320, 210, 360],
  hurc: [480, 260, 440],
  suitcases: [390, 250, 460],
} as const;

export type PreviewPreset = keyof typeof SIZES;
const HANGING = new Set<PreviewPreset>(['shirts', 'jackets', 'trousers', 'longDresses']);
const STORAGE = new Set<PreviewPreset>(['storageBoxes', 'hurc', 'suitcases']);

export function servicePreviewEnabled(config?: InteriorItemsConfig) {
  return config?.enabled !== false && config?.showServiceItems !== false;
}

function presetForCell(cell: ResolvedCell): InteriorItemPreset {
  const insert = cell.insert;
  if (!insert) return 'none';
  if (insert.itemPreset && insert.itemPreset !== 'auto') return insert.itemPreset;
  return INSERT_REGISTRY[insert.type].previewPreset?.(cell) ?? 'none';
}

/** Görsel numunenin sabit ölçüleri. Envanterin paket varsayımları ayrı kalır. */
export function itemPreviewPlan(cell: ResolvedCell, rod?: ResolvedPanel, config?: InteriorItemsConfig) {
  if (config?.enabled === false || cell.insert?.itemCountOverride === 0 ||
    cell.insert?.type === 'serviceNiche' || cell.insert?.storageTemplate === 'laundryBasket' ||
    (cell.polygonXZMm && !cell.hangingZoneMm)) return;
  const preset = presetForCell(cell);
  if (preset === 'none' || preset === 'auto') return;
  const hanging = HANGING.has(preset);
  if ((hanging && config?.showHangingClothes === false) ||
    (preset === 'foldedClothes' && config?.showFoldedClothes === false) ||
    ((preset === 'shoes' || preset === 'bags') && config?.showShoesAndBags === false) ||
    (STORAGE.has(preset) && config?.showStorageBoxesAndLuggage === false)) return;
  const [widthMm, heightMm, depthMm] = SIZES[preset];
  const zone = cell.hangingZoneMm;
  const axis = cell.wallAxis === 'B' && !zone ? 0 : 2;
  const depth = zone?.depthMm ?? cell.supportDepthMm ?? cell.netDepthMm;
  const depthCenter = zone ? zone.zMm + depth / 2 : cell.worldCenterMm[axis];
  const rodOffset = hanging && rod ? rod.worldPositionMm[axis] - depthCenter : 0;
  const rodHeight = hanging && rod ? rod.worldPositionMm[1] - cell.yStartMm : 0;
  const available = {
    widthMm: zone?.widthMm ?? cell.netWidthMm,
    heightMm: hanging ? Math.max(0, rodHeight - 28) : cell.netHeightMm,
    depthMm: Math.max(0, depth - 2 * Math.abs(rodOffset)),
  };
  const gap = hanging ? 12 : 24;
  const pitch = widthMm + gap;
  const maxCount = Math.floor((available.widthMm + gap) / pitch);
  const cap = hanging ? 18 : 6;
  const density = config?.density === 'low' ? 0.55 : config?.density === 'full' ? 1 : 0.85;
  const fits = (!hanging || Boolean(rod)) && maxCount > 0 && heightMm <= available.heightMm && depthMm <= available.depthMm;
  const count = fits ? Math.min(maxCount, cap, cell.insert?.itemCountOverride ?? Math.max(1, Math.round(maxCount * density))) : 0;
  const layers = preset === 'foldedClothes' ? Math.min(5, Math.floor((available.heightMm + 2) / (heightMm + 2))) : 1;
  return { preset, hanging, widthMm, heightMm, depthMm, pitch, rodHeight, rodOffset, count, layers, available };
}
