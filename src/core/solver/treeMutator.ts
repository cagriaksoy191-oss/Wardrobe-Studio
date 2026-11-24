import { INSERT_REGISTRY, STANDARD_SERVICE_ITEMS } from '../inserts/insertRegistry';
import type {
  Design,
  InsertConfig,
  OwnerType,
  ResizeAxis,
  ResizeDirection,
  ResizeDraftState,
  ResolvedCell,
  ResolvedModel,
  SizeSpec,
  SplitNode,
  WallAxis,
} from '../schema/types';
import { distributeIntegerMm } from './flexSolver';
import { validationConfig } from './validationConfig';

let idCounter = 100;
function nextUid(prefix: string): string {
  idCounter += 1;
  return `${prefix}-${Date.now().toString(36).slice(-4)}-${idCounter}`;
}

function cloneInsertSafe(insert: InsertConfig | null): InsertConfig | null {
  if (!insert) return null;
  return {
    ...insert,
    shelfPinRows: insert.shelfPinRows ? [...insert.shelfPinRows] : undefined,
    drawerFrontHeightsMm: insert.drawerFrontHeightsMm
      ? [...insert.drawerFrontHeightsMm]
      : undefined,
    serviceItems: insert.serviceItems
      ? insert.serviceItems.map((it) => ({ ...it }))
      : undefined,
  };
}

export type SplitPresetKind = 'equal' | 'topYukluk' | 'leftServiceNiche' | 'bottomDrawers';

/**
 * Eğer verilen hücre kimliği otomatik üretilmiş bir alt aralığa (`${leafId}::sub-${k}`) aitse,
 * ilgili ana yaprak hücreyi (`leafId`) raf konumlarını 1 mm bile kaydırmadan gerçek bir yatay
 * `SplitNode` ağacına dönüştürür ve hedef alt aralığın yeni gerçek yaprak kimliğini döndürür.
 */
export function realizeSubIntervalInDesign(draft: Design, targetCellId: string): string {
  if (!targetCellId.includes('::sub-')) {
    return targetCellId;
  }

  const [leafId, subPart] = targetCellId.split('::sub-');
  const targetSubIndex = Number.parseInt(subPart, 10);
  if (!leafId || Number.isNaN(targetSubIndex)) {
    return targetCellId;
  }

  let realizedLeafId = targetCellId;

  const transformNode = (node: SplitNode, thicknessMm: number): SplitNode => {
    if (node.kind === 'leaf') {
      if (node.id !== leafId) return node;

      const ins = node.insert;
      if (ins?.type === 'doubleHanging') {
        const splitId = nextUid('split-dh');
        const ch0Id = `${leafId}-sub-0`;
        const ch1Id = `${leafId}-sub-1`;
        realizedLeafId = targetSubIndex === 1 ? ch1Id : ch0Id;

        return {
          kind: 'split',
          id: splitId,
          direction: 'horizontal',
          dividerThicknessMm: thicknessMm,
          children: [
            {
              id: nextUid('ch'),
              size: { kind: 'flex', weight: 1 },
              node: {
                kind: 'leaf',
                id: ch0Id,
                label: `${node.label ?? 'Askı'} — Alt Askı Alanı`,
                owner: node.owner,
                insert: { type: 'hangingRod', rodHeightType: 'short' },
              },
            },
            {
              id: nextUid('ch'),
              size: { kind: 'flex', weight: 1 },
              node: {
                kind: 'leaf',
                id: ch1Id,
                label: `${node.label ?? 'Askı'} — Üst Askı Alanı`,
                owner: node.owner,
                insert: { type: 'hangingRod', rodHeightType: 'short' },
              },
            },
          ],
        };
      }

      const shelfCount =
        ins?.type === 'shoeRack'
          ? Math.max(1, ins.shoeTiers ?? 4)
          : Math.max(1, ins?.shelfCount ?? 3);
      const intervalCount = shelfCount + 1;
      const clampedIdx = Math.max(0, Math.min(intervalCount - 1, targetSubIndex));
      const splitId = nextUid('split-shelves');
      const rows = ins?.adjustable ? ins.shelfPinRows : undefined;

      const children = Array.from({ length: intervalCount }, (_, idx) => {
        const subLeafId = `${leafId}-sub-${idx}`;
        if (idx === clampedIdx) {
          realizedLeafId = subLeafId;
        }
        const size: SizeSpec = rows && idx < rows.length
          ? { kind: 'fixed', mm: (rows[idx] - (rows[idx - 1] ?? 0)) * validationConfig.adjustableShelfPitchMm - (idx > 0 ? thicknessMm : 0) }
          : { kind: 'flex', weight: 1 };
        return {
          id: nextUid('ch'),
          size,
          node: {
            kind: 'leaf' as const,
            id: subLeafId,
            label: `${node.label ?? 'Raf Bölmesi'} — ${idx + 1}. Raf Aralığı`,
            owner: node.owner,
            insert: { type: 'empty' as const },
          },
        };
      });

      return {
        kind: 'split',
        id: splitId,
        direction: 'horizontal',
        dividerThicknessMm: thicknessMm,
        children,
      };
    }

    return {
      ...node,
      children: node.children.map((ch) => ({
        ...ch,
        node: transformNode(ch.node, thicknessMm),
      })),
    };
  };

  for (const run of draft.runs) {
    for (const bay of run.bays) {
      bay.root = transformNode(bay.root, run.panelThicknessMm);
    }
  }

  return realizedLeafId;
}

/**
 * Tasarım içindeki tüm bölmelerde (`Bay.root`) verilen yaprak hücreyi (`targetCellId`) bulur
 * ve dikey veya yatay olarak iki alt hücreye böler.
 * Eğer `targetCellId` bir raf/askı alt aralığıysa (`::sub-k`), önce o aralığı bağımsız alt hücreye
 * dönüştürür ve yalnızca seçilen aralığı böler.
 */
export function splitLeafInDesign(
  draft: Design,
  rawTargetCellId: string,
  direction: 'horizontal' | 'vertical',
  preset: SplitPresetKind = 'equal'
): { newPrimaryCellId: string | null } {
  const targetCellId = rawTargetCellId.includes('::sub-')
    ? realizeSubIntervalInDesign(draft, rawTargetCellId)
    : rawTargetCellId;

  let createdCellId: string | null = null;

  const transformNode = (node: SplitNode): SplitNode => {
    if (node.kind === 'leaf') {
      if (node.id !== targetCellId) return node;

      const splitId = nextUid('split');
      const child1Id = nextUid('ch');
      const child2Id = nextUid('ch');
      const leaf1Id = nextUid('cell');
      const leaf2Id = nextUid('cell');
      createdCellId = leaf1Id;

      if (direction === 'vertical' && preset === 'leftServiceNiche') {
        return {
          kind: 'split',
          id: splitId,
          direction: 'vertical',
          dividerThicknessMm: 18,
          children: [
            {
              id: child1Id,
              size: { kind: 'fixed', mm: 250 },
              locked: true,
              node: {
                kind: 'leaf',
                id: leaf1Id,
                label: 'Dar Servis Nişi (Merdiven/Ütü)',
                owner: node.owner,
                insert: {
                  type: 'serviceNiche',
                  handClearanceMm: 30,
                  serviceItems: [
                    structuredClone(STANDARD_SERVICE_ITEMS[0]),
                    structuredClone(STANDARD_SERVICE_ITEMS[1]),
                  ],
                },
              },
            },
            {
              id: child2Id,
              size: { kind: 'flex', weight: 1 },
              node: {
                kind: 'leaf',
                id: leaf2Id,
                label: node.label ?? 'Sağ Ana Bölme',
                owner: node.owner,
                insert: node.insert
                  ? cloneInsertSafe(node.insert)
                  : INSERT_REGISTRY.hangingRod.createDefaultConfig(),
              },
            },
          ],
        };
      }

      if (direction === 'horizontal' && preset === 'topYukluk') {
        return {
          kind: 'split',
          id: splitId,
          direction: 'horizontal',
          dividerThicknessMm: 18,
          children: [
            {
              id: child1Id,
              size: { kind: 'flex', weight: 1 },
              node: {
                kind: 'leaf',
                id: leaf1Id,
                label: node.label ?? 'Alt Ana Hacim',
                owner: node.owner,
                insert: node.insert
                  ? cloneInsertSafe(node.insert)
                  : INSERT_REGISTRY.hangingRod.createDefaultConfig(),
              },
            },
            {
              id: child2Id,
              size: { kind: 'fixed', mm: 380 },
              locked: true,
              node: {
                kind: 'leaf',
                id: leaf2Id,
                label: 'Üst Yüklük / Hurç Bölmesi',
                owner: node.owner,
                insert: INSERT_REGISTRY.beddingYukluk.createDefaultConfig(),
              },
            },
          ],
        };
      }

      if (direction === 'horizontal' && preset === 'bottomDrawers') {
        return {
          kind: 'split',
          id: splitId,
          direction: 'horizontal',
          dividerThicknessMm: 18,
          children: [
            {
              id: child1Id,
              size: { kind: 'fixed', mm: 720 },
              locked: true,
              node: {
                kind: 'leaf',
                id: leaf1Id,
                label: 'Alt 4 Çekmeceli Modül',
                owner: node.owner,
                insert: INSERT_REGISTRY.drawerBank.createDefaultConfig(),
              },
            },
            {
              id: child2Id,
              size: { kind: 'flex', weight: 1 },
              node: {
                kind: 'leaf',
                id: leaf2Id,
                label: 'Üst Askı / Raf Bölmesi',
                owner: node.owner,
                insert: INSERT_REGISTRY.hangingRod.createDefaultConfig(),
              },
            },
          ],
        };
      }

      // Standart eşit 2'ye bölme
      return {
        kind: 'split',
        id: splitId,
        direction,
        dividerThicknessMm: 18,
        children: [
          {
            id: child1Id,
            size: { kind: 'flex', weight: 1 },
            node: {
              kind: 'leaf',
              id: leaf1Id,
              label: direction === 'vertical' ? 'Sol Bölme' : 'Alt Bölme',
              owner: node.owner,
              insert: node.insert
                ? cloneInsertSafe(node.insert)
                : { type: 'empty' },
            },
          },
          {
            id: child2Id,
            size: { kind: 'flex', weight: 1 },
            node: {
              kind: 'leaf',
              id: leaf2Id,
              label: direction === 'vertical' ? 'Sağ Bölme' : 'Üst Bölme',
              owner: node.owner,
              insert: node.insert
                ? cloneInsertSafe(node.insert)
                : { type: 'empty' },
            },
          },
        ],
      };
    }

    return {
      ...node,
      children: node.children.map((ch) => ({
        ...ch,
        node: transformNode(ch.node),
      })),
    };
  };

  for (const run of draft.runs) {
    for (const bay of run.bays) {
      bay.root = transformNode(bay.root);
    }
  }

  return { newPrimaryCellId: createdCellId };
}

/**
 * Verilen yaprak hücrenin (`targetCellId`) bulunduğu ebeveyn `split` düğümünü kaldırıp
 * tekrar tek bir yaprak hücreye (`leaf`) birleştirir.
 */
export function unsplitParentOfLeafInDesign(
  draft: Design,
  rawTargetCellId: string
): { mergedCellId: string | null } {
  const targetCellId = rawTargetCellId.includes('::sub-')
    ? rawTargetCellId.split('::sub-')[0]
    : rawTargetCellId;

  let mergedId: string | null = null;

  const transformNode = (node: SplitNode): SplitNode => {
    if (node.kind === 'leaf') return node;

    const matchingChild = node.children.find(
      (ch) => ch.node.kind === 'leaf' && ch.node.id === targetCellId
    );
    if (matchingChild && matchingChild.node.kind === 'leaf') {
      mergedId = matchingChild.node.id;
      return {
        kind: 'leaf',
        id: matchingChild.node.id,
        label: matchingChild.node.label ?? 'Birleştirilmiş Bölme',
        owner: matchingChild.node.owner,
        insert: cloneInsertSafe(matchingChild.node.insert),
      };
    }

    return {
      ...node,
      children: node.children.map((ch) => ({
        ...ch,
        node: transformNode(ch.node),
      })),
    };
  };

  for (const run of draft.runs) {
    for (const bay of run.bays) {
      bay.root = transformNode(bay.root);
    }
  }

  return { mergedCellId: mergedId };
}

/**
 * Bir yaprak hücrenin ebeveyn `split` içindeki boyutunu (`fixed | flex`) ve kilidini günceller.
 */
export function updateLeafSizeInParent(
  draft: Design,
  rawTargetCellId: string,
  newSize: SizeSpec,
  locked?: boolean
): void {
  const targetCellId = rawTargetCellId.includes('::sub-')
    ? rawTargetCellId.split('::sub-')[0]
    : rawTargetCellId;

  const visit = (node: SplitNode) => {
    if (node.kind === 'leaf') return;
    for (const ch of node.children) {
      if (ch.node.kind === 'leaf' && ch.node.id === targetCellId) {
        ch.size = newSize;
        if (locked !== undefined) {
          ch.locked = locked;
        }
        return;
      }
      visit(ch.node);
    }
  };

  for (const run of draft.runs) {
    for (const bay of run.bays) {
      visit(bay.root);
    }
  }
}

/**
 * Bir yaprak hücrenin iç modülünü (`InsertConfig`), etiketini veya sahibini günceller.
 */
export function updateLeafNodeInDesign(
  draft: Design,
  rawTargetCellId: string,
  updater: (leaf: Extract<SplitNode, { kind: 'leaf' }>) => void
): void {
  const targetCellId = rawTargetCellId.includes('::sub-')
    ? rawTargetCellId.split('::sub-')[0]
    : rawTargetCellId;

  const visit = (node: SplitNode) => {
    if (node.kind === 'leaf') {
      if (node.id === targetCellId) {
        updater(node);
      }
      return;
    }
    for (const ch of node.children) {
      visit(ch.node);
    }
  };

  for (const run of draft.runs) {
    for (const bay of run.bays) {
      visit(bay.root);
    }
  }
}

export function setCellInsertInDesign(
  draft: Design,
  rawTargetCellId: string,
  insert: InsertConfig | null,
  customLabel?: string,
  owner?: OwnerType,
  isolateSubInterval?: boolean
): string {
  const targetCellId =
    isolateSubInterval && rawTargetCellId.includes('::sub-')
      ? realizeSubIntervalInDesign(draft, rawTargetCellId)
      : rawTargetCellId.includes('::sub-')
        ? rawTargetCellId.split('::sub-')[0]
        : rawTargetCellId;

  updateLeafNodeInDesign(draft, targetCellId, (leaf) => {
    leaf.insert = insert;
    if (customLabel !== undefined) {
      leaf.label = customLabel;
    }
    if (owner !== undefined) {
      leaf.owner = owner;
    }
  });

  return targetCellId;
}

// ============================================================================
// AŞAMA 2.3 — ÇOKLU HÜCRE SEÇİM ANALİZİ, ORANTILI TOPLU BOYUTLANDIRMA,
// EŞİT ARALIK DÖNÜŞTÜRME VE YÖNLÜ ÇAKIŞMA ÖNİZLEME / KOMİT KATMANI
// ============================================================================

export interface SelectedShelfGroupInfo {
  groupKey: string;
  groupLabel: string;
  bayId: string;
  runId: string;
  sourceLeafId: string | null;
  parentId: string | null;
  cells: ResolvedCell[];
  grossHeightMm: number;
  netHeightSumMm: number;
  heightDividersMm: number;
  netWidthMm: number;
  yStartMm: number;
  yEndMm: number;
  isContiguousVertical: boolean;
}

export interface SelectionGroupAnalysis {
  cells: ResolvedCell[];
  isSingle: boolean;
  isCornerSelection: boolean;
  sameRun: boolean;
  runId: string | null;
  wallAxis: WallAxis | null;
  sameBay: boolean;
  bayId: string | null;
  isContiguousVertical: boolean;
  isContiguousHorizontal: boolean;
  commonSourceLeafId: string | null;
  isFullSourceLeafSelection: boolean;
  /** Seçim içindeki farklı raf/bölme grupları (Alt → Üst sıralı) */
  shelfGroups: SelectedShelfGroupInfo[];
  isMultiShelfGroupSelection: boolean;
  canMergeShelfGroups: boolean;
  cannotMergeReason?: string;
  /** X ekseni (Genişlik): Brüt toplam, net aralıklar toplamı ve ara dikme kalınlıkları (mm) */
  grossWidthMm: number;
  netWidthSumMm: number;
  widthDividersMm: number;
  /** Y ekseni (Yükseklik): Brüt toplam, net aralıklar toplamı ve ara raf/tabla kalınlıkları (mm) */
  grossHeightMm: number;
  netHeightSumMm: number;
  heightDividersMm: number;
  /** Z ekseni (Derinlik): Net derinlik (mm) */
  netDepthMm: number;
  yStartMm: number;
  yEndMm: number;
  groupWorldCenterMm: [number, number, number];
  groupWorldSizeMm: [number, number, number];
  rotationYRad: number;
}

/**
 * Seçili hücre kimliklerini (`selectedCellIds`) çözülmüş model üzerinde analiz eder;
 * bitişiklik (dikey raf yığını veya yatay yan yana sıra), çoklu raf grubu kümesi,
 * brüt/net toplam ölçüler, panel kalınlığı payları ve 3D grup sınırlayıcı kutusunu hesaplar.
 */
export function analyzeSelectedCellsGroup(
  selectedCellIds: string[],
  resolved: ResolvedModel
): SelectionGroupAnalysis {
  const t = Math.round(resolved.panelThicknessMm ?? 18);
  const uniqueIds = Array.from(new Set(selectedCellIds));
  const rawCells = uniqueIds
    .map((id) => resolved.cells.find((c) => c.id === id))
    .filter((c): c is ResolvedCell => Boolean(c));

  // Dikey olarak alttan üste (yStartMm), eşitse soldan sağa sırala
  const cells = [...rawCells].sort((a, b) => {
    if (a.yStartMm !== b.yStartMm) return a.yStartMm - b.yStartMm;
    const posA = a.wallAxis === 'A' ? a.worldCenterMm[0] : a.worldCenterMm[2];
    const posB = b.wallAxis === 'A' ? b.worldCenterMm[0] : b.worldCenterMm[2];
    return posA - posB;
  });

  if (cells.length === 0) {
    return {
      cells: [],
      isSingle: false,
      isCornerSelection: false,
      sameRun: false,
      runId: null,
      wallAxis: null,
      sameBay: false,
      bayId: null,
      isContiguousVertical: false,
      isContiguousHorizontal: false,
      commonSourceLeafId: null,
      isFullSourceLeafSelection: false,
      shelfGroups: [],
      isMultiShelfGroupSelection: false,
      canMergeShelfGroups: false,
      grossWidthMm: 0,
      netWidthSumMm: 0,
      widthDividersMm: 0,
      grossHeightMm: 0,
      netHeightSumMm: 0,
      heightDividersMm: 0,
      netDepthMm: 0,
      yStartMm: 0,
      yEndMm: 0,
      groupWorldCenterMm: [0, 0, 0],
      groupWorldSizeMm: [0, 0, 0],
      rotationYRad: 0,
    };
  }

  const first = cells[0];
  const isSingle = cells.length === 1;
  const isCornerSelection = cells.every((c) => c.subIntervalKind === 'cornerInterval');
  const sameRun = cells.every((c) => c.runId === first.runId);
  const sameBay = cells.every((c) => c.bayId === first.bayId);

  const firstLeaf = first.sourceLeafId ?? null;
  const commonSourceLeafId =
    firstLeaf && cells.every((c) => c.sourceLeafId === firstLeaf) ? firstLeaf : null;
  const isFullSourceLeafSelection =
    Boolean(commonSourceLeafId) &&
    first.subIntervalCount !== undefined &&
    cells.length === first.subIntervalCount;

  // Seçim içindeki farklı raf/ebeveyn gruplarını çıkar
  const groupBuckets = new Map<string, ResolvedCell[]>();
  for (const c of cells) {
    const gKey = c.cornerJunctionId
      ? `corner::${c.cornerJunctionId}`
      : c.sourceLeafId && c.id.includes('::sub-')
        ? `leaf::${c.sourceLeafId}`
        : c.parentId
          ? `split::${c.parentId}`
          : `cell::${c.id}`;
    const list = groupBuckets.get(gKey) ?? [];
    list.push(c);
    groupBuckets.set(gKey, list);
  }

  const shelfGroups: SelectedShelfGroupInfo[] = Array.from(groupBuckets.entries())
    .map(([groupKey, gCells]) => {
      const sorted = [...gCells].sort((a, b) => a.yStartMm - b.yStartMm);
      const gf = sorted[0];
      let gContig = sorted.length === 1;
      if (sorted.length > 1) {
        gContig = true;
        for (let i = 1; i < sorted.length; i++) {
          const gap = sorted[i].yStartMm - sorted[i - 1].yEndMm;
          if (Math.abs(gap - t) > 4 || Math.abs(sorted[i].netWidthMm - gf.netWidthMm) > 2) {
            gContig = false;
            break;
          }
        }
      }
      const gNetH = sorted.reduce((acc, item) => acc + item.netHeightMm, 0);
      const gDivH = Math.max(0, (sorted.length - 1) * t);
      const baseLabel = gf.label.includes('—') ? gf.label.split('—')[0].trim() : gf.label;
      return {
        groupKey,
        groupLabel: baseLabel,
        bayId: gf.bayId,
        runId: gf.runId,
        sourceLeafId: gf.sourceLeafId ?? null,
        parentId: gf.parentId ?? null,
        cells: sorted,
        grossHeightMm: gNetH + gDivH,
        netHeightSumMm: gNetH,
        heightDividersMm: gDivH,
        netWidthMm: gf.netWidthMm,
        yStartMm: sorted[0].yStartMm,
        yEndMm: sorted[sorted.length - 1].yEndMm,
        isContiguousVertical: gContig,
      };
    })
    .sort((a, b) => a.yStartMm - b.yStartMm);

  const isMultiShelfGroupSelection = shelfGroups.length > 1;

  // Dikey bitişiklik kontrolü: Aynı bölmede, aynı genişlik ve X/Z hizasında, aralarında t mm raf/bölücü olan yığın
  let isContiguousVertical = isSingle;
  if (cells.length > 1 && sameBay) {
    isContiguousVertical = true;
    for (let i = 0; i < cells.length; i++) {
      const c = cells[i];
      const sameColumn =
        Math.abs(c.worldCenterMm[0] - first.worldCenterMm[0]) <= 3 &&
        Math.abs(c.worldCenterMm[2] - first.worldCenterMm[2]) <= 3 &&
        Math.abs(c.netWidthMm - first.netWidthMm) <= 2;
      if (!sameColumn) {
        isContiguousVertical = false;
        break;
      }
      if (i > 0) {
        const prev = cells[i - 1];
        const gap = c.yStartMm - prev.yEndMm;
        if (Math.abs(gap - t) > 4) {
          isContiguousVertical = false;
          break;
        }
      }
    }
  }

  let canMergeShelfGroups = false;
  let cannotMergeReason: string | undefined;
  if (isMultiShelfGroupSelection) {
    if (!sameBay) {
      cannotMergeReason =
        'Seçili raf grupları farklı dikey bölmelerde yer aldığı için tek bir hacimde birleştirilemez; ancak her grubu kendi içinde toplu eşitleyebilirsiniz.';
    } else if (!isContiguousVertical) {
      cannotMergeReason =
        'Seçili raf grupları arasında seçilmemiş bir ara bölme var veya genişlikleri farklı. Tek hacimde birleştirmek için aynı sütundaki bitişik grupların tüm raflarını seçin.';
    } else {
      canMergeShelfGroups = true;
    }
  }

  // Yatay bitişiklik kontrolü: Aynı bölmede, aynı Y başlangıç/bitiş yüksekliğinde, yan yana t mm dikey bölücülü sıra
  let isContiguousHorizontal = isSingle;
  if (cells.length > 1 && sameBay && !isCornerSelection) {
    isContiguousHorizontal = true;
    for (let i = 0; i < cells.length; i++) {
      const c = cells[i];
      if (Math.abs(c.yStartMm - first.yStartMm) > 2 || Math.abs(c.yEndMm - first.yEndMm) > 2) {
        isContiguousHorizontal = false;
        break;
      }
      if (i > 0) {
        const prev = cells[i - 1];
        const axisIdx = first.wallAxis === 'A' ? 0 : 2;
        const prevRight = prev.worldCenterMm[axisIdx] + prev.netWidthMm / 2;
        const currLeft = c.worldCenterMm[axisIdx] - c.netWidthMm / 2;
        if (Math.abs(currLeft - prevRight - t) > 4) {
          isContiguousHorizontal = false;
          break;
        }
      }
    }
  }

  const netHeightSumMm = isContiguousVertical
    ? cells.reduce((acc, c) => acc + c.netHeightMm, 0)
    : first.netHeightMm;
  const heightDividersMm = isContiguousVertical ? Math.max(0, (cells.length - 1) * t) : 0;
  const grossHeightMm = isContiguousVertical ? netHeightSumMm + heightDividersMm : first.netHeightMm;

  const netWidthSumMm = isContiguousHorizontal
    ? cells.reduce((acc, c) => acc + c.netWidthMm, 0)
    : first.netWidthMm;
  const widthDividersMm = isContiguousHorizontal ? Math.max(0, (cells.length - 1) * t) : 0;
  const grossWidthMm = isContiguousHorizontal ? netWidthSumMm + widthDividersMm : first.netWidthMm;

  const netDepthMm = first.netDepthMm;
  const yStartMm = Math.min(...cells.map((c) => c.yStartMm));
  const yEndMm = Math.max(...cells.map((c) => c.yEndMm));

  // Grup 3D merkezi
  let minX = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  let minZ = Number.POSITIVE_INFINITY;
  let maxZ = Number.NEGATIVE_INFINITY;

  for (const c of cells) {
    const halfX = (c.wallAxis === 'A' ? c.worldSizeMm[0] : c.worldSizeMm[2]) / 2;
    const halfY = c.worldSizeMm[1] / 2;
    const halfZ = (c.wallAxis === 'A' ? c.worldSizeMm[2] : c.worldSizeMm[0]) / 2;
    minX = Math.min(minX, c.worldCenterMm[0] - halfX);
    maxX = Math.max(maxX, c.worldCenterMm[0] + halfX);
    minY = Math.min(minY, c.worldCenterMm[1] - halfY);
    maxY = Math.max(maxY, c.worldCenterMm[1] + halfY);
    minZ = Math.min(minZ, c.worldCenterMm[2] - halfZ);
    maxZ = Math.max(maxZ, c.worldCenterMm[2] + halfZ);
  }

  const groupWorldCenterMm: [number, number, number] = [
    Math.round((minX + maxX) / 2),
    Math.round((minY + maxY) / 2),
    Math.round((minZ + maxZ) / 2),
  ];

  const groupWorldSizeMm: [number, number, number] = [
    grossWidthMm,
    grossHeightMm,
    netDepthMm,
  ];

  return {
    cells,
    isSingle,
    isCornerSelection,
    sameRun,
    runId: sameRun ? first.runId : null,
    wallAxis: sameRun ? first.wallAxis : null,
    sameBay,
    bayId: sameBay ? first.bayId : null,
    isContiguousVertical,
    isContiguousHorizontal,
    commonSourceLeafId,
    isFullSourceLeafSelection,
    shelfGroups,
    isMultiShelfGroupSelection,
    canMergeShelfGroups,
    cannotMergeReason,
    grossWidthMm,
    netWidthSumMm,
    widthDividersMm,
    grossHeightMm,
    netHeightSumMm,
    heightDividersMm,
    netDepthMm,
    yStartMm,
    yEndMm,
    groupWorldCenterMm,
    groupWorldSizeMm,
    rotationYRad: first.rotationYRad,
  };
}

/**
 * Bir çok-aralıklı yaprağı (`shelfStack`, `shoeRack`, `beddingYukluk`, `doubleHanging`)
 * her alt aralığının çözülmüş tam milimetrik yüksekliğini (`fixed` mm) koruyarak
 * gerçek bir yatay `SplitNode` düğümüne dönüştürür.
 */
export function realizeLeafWithExactSolvedHeights(
  draft: Design,
  leafId: string,
  resolvedCells: ResolvedCell[]
): string[] {
  const subCells = resolvedCells
    .filter((c) => c.sourceLeafId === leafId)
    .sort((a, b) => a.yStartMm - b.yStartMm);

  if (subCells.length <= 1) {
    return [leafId];
  }

  const createdLeafIds: string[] = [];
  const thicknessMm = subCells[1].yStartMm - subCells[0].yEndMm;

  const transformNode = (node: SplitNode): SplitNode => {
    if (node.kind === 'leaf') {
      if (node.id !== leafId) return node;

      const isDoubleHang = node.insert?.type === 'doubleHanging';
      const splitId = nextUid('split-exact');
      const children = subCells.map((sc, idx) => {
        const subLeafId = `${leafId}-sub-${idx}`;
        createdLeafIds.push(subLeafId);
        return {
          id: nextUid('ch'),
          size: { kind: 'fixed' as const, mm: sc.netHeightMm },
          node: {
            kind: 'leaf' as const,
            id: subLeafId,
            label: sc.label,
            owner: node.owner,
            insert: isDoubleHang
              ? ({ type: 'hangingRod', rodHeightType: 'short' } as const)
              : ({ type: 'empty' } as const),
          },
        };
      });

      return {
        kind: 'split',
        id: splitId,
        direction: 'horizontal',
        dividerThicknessMm: thicknessMm,
        children,
      };
    }

    return {
      ...node,
      children: node.children.map((ch) => ({
        ...ch,
        node: transformNode(ch.node),
      })),
    };
  };

  for (const run of draft.runs) {
    for (const bay of run.bays) {
      bay.root = transformNode(bay.root);
    }
  }

  return createdLeafIds;
}

/**
 * Seçili tek bir hücreyi dikey veya yatay yönde `count` (2..10) eşit bölmeye ayırır.
 */
export function divideCellIntoNInDesign(
  draft: Design,
  rawTargetCellId: string,
  direction: 'horizontal' | 'vertical',
  count: number
): { createdCellIds: string[] } {
  const cleanCount = Math.max(2, Math.min(10, Math.round(count)));
  const targetCellId = rawTargetCellId.includes('::sub-')
    ? realizeSubIntervalInDesign(draft, rawTargetCellId)
    : rawTargetCellId;

  const createdCellIds: string[] = [];

  const transformNode = (node: SplitNode): SplitNode => {
    if (node.kind === 'leaf') {
      if (node.id !== targetCellId) return node;

      const splitId = nextUid('split-n');
      const children = Array.from({ length: cleanCount }, (_, idx) => {
        const leafId = nextUid('cell');
        createdCellIds.push(leafId);
        return {
          id: nextUid('ch'),
          size: { kind: 'flex' as const, weight: 1 },
          node: {
            kind: 'leaf' as const,
            id: leafId,
            label: `${node.label ?? 'Bölme'} (${idx + 1}/${cleanCount})`,
            owner: node.owner,
            insert: { type: 'empty' as const },
          },
        };
      });

      return {
        kind: 'split',
        id: splitId,
        direction,
        dividerThicknessMm: 18,
        children,
      };
    }

    return {
      ...node,
      children: node.children.map((ch) => ({
        ...ch,
        node: transformNode(ch.node),
      })),
    };
  };

  for (const run of draft.runs) {
    for (const bay of run.bays) {
      bay.root = transformNode(bay.root);
    }
  }

  return { createdCellIds };
}

function setSingleContiguousGroupIntervalCountInDesign(
  draft: Design,
  selectedCellIds: string[],
  targetIntervalCount: number,
  resolved: ResolvedModel
): { newSelectedCellIds: string[] } {
  const t = Math.round(resolved.panelThicknessMm ?? 18);
  const cleanCount = Math.max(1, Math.min(12, Math.round(targetIntervalCount)));
  const group = analyzeSelectedCellsGroup(selectedCellIds, resolved);
  if (group.cells.length === 0) {
    return { newSelectedCellIds: [] };
  }

  // Beşgen köşe seçiliyse köşe raf adedini güncelle ve özel aralık yüksekliklerini sıfırla (eşit dağıt)
  if (group.isCornerSelection && draft.junctions.length > 0) {
    const junc = draft.junctions[0];
    junc.shelvesCount = Math.max(1, Math.min(7, cleanCount - 1));
    junc.intervalHeightsMm = undefined;
    const newIds = Array.from(
      { length: junc.shelvesCount + 1 },
      (_, idx) => `${junc.id}::corner-sub-${idx}`
    );
    return { newSelectedCellIds: newIds };
  }

  // Durum 1: Aynı ana yaprağın (ör. cell-b2-shoes veya cell-b1-shelves) tüm alt aralıkları seçiliyse
  if (group.isFullSourceLeafSelection && group.commonSourceLeafId) {
    const leafId = group.commonSourceLeafId;
    if (cleanCount === 1) {
      updateLeafNodeInDesign(draft, leafId, (leaf) => {
        leaf.insert = { type: 'empty' };
      });
      return { newSelectedCellIds: [leafId] };
    }

    updateLeafNodeInDesign(draft, leafId, (leaf) => {
      if (leaf.insert?.type === 'shoeRack') {
        leaf.insert = {
          ...leaf.insert,
          shoeTiers: cleanCount - 1,
        };
      } else {
        leaf.insert = {
          type: 'shelfStack',
          shelfCount: cleanCount - 1,
          adjustable: true,
        };
      }
    });

    const newIds = Array.from({ length: cleanCount }, (_, idx) => `${leafId}::sub-${idx}`);
    return { newSelectedCellIds: newIds };
  }

  // Durum 2: Bir yaprağın alt kümesi (örn. 6 raf aralığından 3'ü) veya gerçek SplitNode kardeş hücreleri seçiliyse
  if (!group.isContiguousVertical && !group.isContiguousHorizontal) {
    return { newSelectedCellIds: selectedCellIds };
  }

  // Eğer seçili hücreler sanal ::sub-k aralıklarıysa, önce ana yaprağı tam çözülmüş yükseklikleriyle gerçek SplitNode'a dönüştür
  const targetLeafIds: string[] = [];
  const realizedLeaves = new Set<string>();
  for (const c of group.cells) {
    if (c.sourceLeafId && c.id.includes('::sub-')) {
      if (!realizedLeaves.has(c.sourceLeafId)) {
        realizeLeafWithExactSolvedHeights(draft, c.sourceLeafId, resolved.cells);
        realizedLeaves.add(c.sourceLeafId);
      }
      const subIdx = c.subIntervalIndex ?? 0;
      targetLeafIds.push(`${c.sourceLeafId}-sub-${subIdx}`);
    } else {
      targetLeafIds.push(c.id);
    }
  }

  const newSelectedCellIds: string[] = [];
  const isVerticalStack = group.isContiguousVertical;
  const combinedGrossMm = isVerticalStack ? group.grossHeightMm : group.grossWidthMm;
  const totalDividersMm = (cleanCount - 1) * t;
  const availableNetSumMm = Math.max(cleanCount * 50, combinedGrossMm - totalDividersMm);

  const dist = distributeIntegerMm(
    availableNetSumMm,
    Array.from({ length: cleanCount }, (_, i) => ({
      id: `eq-${i}`,
      size: { kind: 'flex' as const, weight: 1 },
    })),
    0
  );

  // Mevcut kardeşlerin çözülmüş net ölçülerini haritala (diğer kardeşler 1 mm bile kaymasın)
  const solvedNetSizeByLeafId = new Map<string, number>();
  for (const rc of resolved.cells) {
    if (rc.sourceLeafId && rc.id.includes('::sub-')) {
      solvedNetSizeByLeafId.set(
        `${rc.sourceLeafId}-sub-${rc.subIntervalIndex ?? 0}`,
        isVerticalStack ? rc.netHeightMm : rc.netWidthMm
      );
    } else {
      solvedNetSizeByLeafId.set(rc.id, isVerticalStack ? rc.netHeightMm : rc.netWidthMm);
    }
  }

  const transformSplit = (node: SplitNode): SplitNode => {
    if (node.kind === 'leaf') return node;

    const childLeafIds = node.children.map((ch) => (ch.node.kind === 'leaf' ? ch.node.id : null));
    const indices = targetLeafIds
      .map((tid) => childLeafIds.indexOf(tid))
      .filter((idx) => idx !== -1)
      .sort((a, b) => a - b);

    if (indices.length === targetLeafIds.length && indices.length > 0) {
      const startIdx = indices[0];
      const endIdx = indices[indices.length - 1];
      const firstChild = node.children[startIdx];
      const baseOwner =
        firstChild.node.kind === 'leaf' ? firstChild.node.owner : group.cells[0].owner;

      // Seçili olmayan kardeşlerin ölçülerini mevcut çözülmüş mm değerlerinde sabitle
      const updatedBefore = node.children.slice(0, startIdx).map((ch) => {
        if (ch.node.kind === 'leaf') {
          const exactMm = solvedNetSizeByLeafId.get(ch.node.id);
          if (exactMm !== undefined) {
            return { ...ch, size: { kind: 'fixed' as const, mm: exactMm } };
          }
        }
        return ch;
      });

      const updatedAfter = node.children.slice(endIdx + 1).map((ch) => {
        if (ch.node.kind === 'leaf') {
          const exactMm = solvedNetSizeByLeafId.get(ch.node.id);
          if (exactMm !== undefined) {
            return { ...ch, size: { kind: 'fixed' as const, mm: exactMm } };
          }
        }
        return ch;
      });

      const replacementChildren = dist.map((d, idx) => {
        const newLeafId = nextUid('cell-eq');
        newSelectedCellIds.push(newLeafId);
        return {
          id: nextUid('ch-eq'),
          size: { kind: 'fixed' as const, mm: d.resolvedMm },
          node: {
            kind: 'leaf' as const,
            id: newLeafId,
            label: `${startIdx + idx + 1}. Raf Aralığı (Eşit)`,
            owner: baseOwner,
            insert: { type: 'empty' as const },
          },
        };
      });

      return {
        ...node,
        children: [...updatedBefore, ...replacementChildren, ...updatedAfter],
      };
    }

    return {
      ...node,
      children: node.children.map((ch) => ({
        ...ch,
        node: transformSplit(ch.node),
      })),
    };
  };

  for (const run of draft.runs) {
    for (const bay of run.bays) {
      bay.root = transformSplit(bay.root);
    }
  }

  return {
    newSelectedCellIds: newSelectedCellIds.length > 0 ? newSelectedCellIds : targetLeafIds,
  };
}

/**
 * Seçili bitişik raf/hücre grubunun (veya birden fazla raf grubu seçiliyse her bir raf grubunun)
 * aralık sayısını kendi toplam brüt yüksekliği içinde bağımsız olarak değiştirir.
 */
export function setContiguousGroupIntervalCountInDesign(
  draft: Design,
  selectedCellIds: string[],
  targetIntervalCount: number,
  resolved: ResolvedModel
): { newSelectedCellIds: string[] } {
  const group = analyzeSelectedCellsGroup(selectedCellIds, resolved);
  if (group.cells.length === 0) {
    return { newSelectedCellIds: [] };
  }

  if (group.shelfGroups.length > 1) {
    const combinedSelectedIds: string[] = [];
    for (const sg of group.shelfGroups) {
      const res = setSingleContiguousGroupIntervalCountInDesign(
        draft,
        sg.cells.map((c) => c.id),
        targetIntervalCount,
        resolved
      );
      combinedSelectedIds.push(...res.newSelectedCellIds);
    }
    return { newSelectedCellIds: combinedSelectedIds };
  }

  return setSingleContiguousGroupIntervalCountInDesign(
    draft,
    selectedCellIds,
    targetIntervalCount,
    resolved
  );
}

/**
 * Seçili bitişik hücrelerin yüksekliklerini (veya birden fazla raf grubu seçiliyse her grubun kendi içindeki
 * raf aralıklarını) toplam brüt ölçülerini ve ara raf kalınlıklarını koruyarak eşitler.
 */
export function equalizeContiguousCellsInDesign(
  draft: Design,
  selectedCellIds: string[],
  resolved: ResolvedModel
): { newSelectedCellIds: string[] } {
  const group = analyzeSelectedCellsGroup(selectedCellIds, resolved);
  if (group.shelfGroups.length > 1) {
    const combinedSelectedIds: string[] = [];
    for (const sg of group.shelfGroups) {
      const res = setSingleContiguousGroupIntervalCountInDesign(
        draft,
        sg.cells.map((c) => c.id),
        sg.cells.length,
        resolved
      );
      combinedSelectedIds.push(...res.newSelectedCellIds);
    }
    return { newSelectedCellIds: combinedSelectedIds };
  }

  return setSingleContiguousGroupIntervalCountInDesign(
    draft,
    selectedCellIds,
    selectedCellIds.length,
    resolved
  );
}

/**
 * Aynı bölme içinde fiziksel olarak dikey bitişik olan birden fazla raf grubunu
 * tek bir birleşik raf hacmine dönüştürür ve `targetIntervalCount` eşit aralığa böler.
 */
export function mergeAndResplitSelectedGroupsInDesign(
  draft: Design,
  selectedCellIds: string[],
  targetIntervalCount: number,
  resolved: ResolvedModel
): { newSelectedCellIds: string[] } {
  const group = analyzeSelectedCellsGroup(selectedCellIds, resolved);
  if (!group.canMergeShelfGroups || !group.bayId) {
    return setContiguousGroupIntervalCountInDesign(
      draft,
      selectedCellIds,
      targetIntervalCount,
      resolved
    );
  }

  const cleanCount = Math.max(1, Math.min(12, Math.round(targetIntervalCount)));
  const targetTopLeafIds = Array.from(
    new Set(group.cells.map((c) => c.sourceLeafId ?? c.id))
  );

  // Çözülmüş brüt yüksekliği hesapla
  const mergedGrossHeightMm = group.grossHeightMm;
  const mergedLeafId = nextUid('cell-merged');

  const transformNode = (node: SplitNode): SplitNode => {
    if (node.kind === 'leaf') return node;

    if (node.direction === 'horizontal') {
      const childIds = node.children.map((ch) => (ch.node.kind === 'leaf' ? ch.node.id : null));
      const matchedIndices = targetTopLeafIds
        .map((id) => childIds.indexOf(id))
        .filter((idx) => idx !== -1)
        .sort((a, b) => a - b);

      if (matchedIndices.length === targetTopLeafIds.length && matchedIndices.length >= 2) {
        const startIdx = matchedIndices[0];
        const endIdx = matchedIndices[matchedIndices.length - 1];
        const firstMatched = node.children[startIdx];
        const baseOwner =
          firstMatched.node.kind === 'leaf' ? firstMatched.node.owner : group.cells[0].owner;

        const mergedNode: SplitNode = {
          kind: 'leaf',
          id: mergedLeafId,
          label: 'Birleştirilmiş Raf Bölmesi',
          owner: baseOwner,
          insert:
            cleanCount <= 1
              ? { type: 'empty' }
              : {
                  type: 'shelfStack',
                  shelfCount: cleanCount - 1,
                  adjustable: true,
                },
        };

        // Eğer ebeveynin tüm çocukları birleştirildiyse doğrudan tek yaprağa indirge
        if (startIdx === 0 && endIdx === node.children.length - 1) {
          return mergedNode;
        }

        const before = node.children.slice(0, startIdx);
        const after = node.children.slice(endIdx + 1);
        return {
          ...node,
          children: [
            ...before,
            {
              id: nextUid('ch-merged'),
              size: { kind: 'fixed', mm: mergedGrossHeightMm },
              node: mergedNode,
            },
            ...after,
          ],
        };
      }
    }

    return {
      ...node,
      children: node.children.map((ch) => ({
        ...ch,
        node: transformNode(ch.node),
      })),
    };
  };

  for (const run of draft.runs) {
    for (const bay of run.bays) {
      if (bay.id === group.bayId) {
        bay.root = transformNode(bay.root);
      }
    }
  }

  const newSelectedCellIds =
    cleanCount <= 1
      ? [mergedLeafId]
      : Array.from({ length: cleanCount }, (_, idx) => `${mergedLeafId}::sub-${idx}`);
  return { newSelectedCellIds };
}

/**
 * Bir çekmece ünitesinin (`drawer-${cellId}-${d+1}`) ön kapak yüksekliğini günceller;
 * aynı çekmece grubundaki komşu çekmeceyi toplam çekmece grubu yüksekliğini koruyacak şekilde dengeler.
 */
export function updateDrawerFrontHeightInDesign(
  draft: Design,
  drawerId: string,
  newHeightMm: number,
  resolved: ResolvedModel
): void {
  const targetDrawer = resolved.drawers.find((d) => d.id === drawerId);
  if (!targetDrawer) return;

  const bankDrawers = resolved.drawers
    .filter((d) => d.cellId === targetDrawer.cellId)
    .sort((a, b) => a.drawerIndex - b.drawerIndex);
  const count = bankDrawers.length;
  if (count <= 1) return;

  const gapMm = 4;
  const totalAvailableFrontSum = Math.max(
    count * 60,
    targetDrawer.parentBankHeightMm - (count - 1) * gapMm
  );
  const currentHeights = bankDrawers.map((d) => d.heightMm);
  const targetIdx = targetDrawer.drawerIndex;
  const neighborIdx = targetIdx < count - 1 ? targetIdx + 1 : targetIdx - 1;

  const pairAvailable = currentHeights[targetIdx] + currentHeights[neighborIdx];
  const clampedNewH = Math.max(60, Math.min(pairAvailable - 60, Math.round(newHeightMm)));
  const nextHeights = [...currentHeights];
  nextHeights[targetIdx] = clampedNewH;
  nextHeights[neighborIdx] = Math.max(60, pairAvailable - clampedNewH);

  // Toplam sapmayı sıfırla
  const sum = nextHeights.reduce((a, b) => a + b, 0);
  if (sum !== totalAvailableFrontSum) {
    nextHeights[neighborIdx] = Math.max(60, nextHeights[neighborIdx] + (totalAvailableFrontSum - sum));
  }

  updateLeafNodeInDesign(draft, targetDrawer.cellId, (leaf) => {
    if (leaf.insert?.type === 'drawerBank') {
      leaf.insert = {
        ...leaf.insert,
        drawerFrontHeightsMm: nextHeights,
      };
    }
  });
}

/**
 * Bir çekmece grubundaki tüm çekmeceleri tekrar eşit yüksekliğe sıfırlar.
 */
export function equalizeDrawerBankInDesign(draft: Design, cellId: string): void {
  updateLeafNodeInDesign(draft, cellId, (leaf) => {
    if (leaf.insert?.type === 'drawerBank') {
      leaf.insert = {
        ...leaf.insert,
        drawerFrontHeightsMm: undefined,
      };
    }
  });
}

/**
 * Yönlü yeniden boyutlandırma (`ResizeDraftState`) oluşturucu.
 * Komşu hücreyi izinsiz küçültmez; çakışma miktarını (`conflictOverlapMm`),
 * etkilenen komşu hücre kimliklerini (`neighborCellIds`) ve 3D kırmızı çakışma kutusunu hesaplar.
 */
export function buildResizeDraftState(
  resolved: ResolvedModel,
  selectedCellIds: string[],
  axis: ResizeAxis,
  direction: ResizeDirection,
  requestedTotalMm: number,
  customNeighborDraftMm?: number
): ResizeDraftState | null {
  const t = Math.round(resolved.panelThicknessMm ?? 18);
  const group = analyzeSelectedCellsGroup(selectedCellIds, resolved);
  if (group.cells.length === 0 || !group.bayId || !group.runId) {
    return null;
  }

  const firstCell = group.cells[0];
  const cleanRequestedMm = Math.max(60, Math.round(requestedTotalMm));

  // -------------------------------------------------------------------------
  // 1. Y EKSENİ (YÜKSEKLİK): YUKARI ('up') VEYA AŞAĞI ('down')
  // -------------------------------------------------------------------------
  if (axis === 'Y') {
    const dir: 'up' | 'down' = direction === 'down' ? 'down' : 'up';
    const currentTotalMm = group.grossHeightMm;
    const internalDividersMm = group.heightDividersMm;
    const deltaMm = cleanRequestedMm - currentTotalMm;

    // Aynı bölme (veya beşgen köşe) ve aynı yatay sütundaki hücreleri bul
    const columnCells = resolved.cells
      .filter(
        (c) =>
          c.bayId === group.bayId &&
          Math.abs(c.worldCenterMm[0] - firstCell.worldCenterMm[0]) <= 5 &&
          Math.abs(c.worldCenterMm[2] - firstCell.worldCenterMm[2]) <= 5
      )
      .sort((a, b) => a.yStartMm - b.yStartMm);

    const neighborCell =
      dir === 'up'
        ? columnCells.find(
            (c) => !selectedCellIds.includes(c.id) && Math.abs(c.yStartMm - (group.yEndMm + t)) <= 5
          )
        : [...columnCells]
            .reverse()
            .find(
              (c) =>
                !selectedCellIds.includes(c.id) && Math.abs(c.yEndMm - (group.yStartMm - t)) <= 5
            );

    const fixedBoundaryLabel =
      dir === 'up'
        ? `Alt Sınır Sabit (Y = ${group.yStartMm} mm)`
        : `Üst Sınır Sabit (Y = ${group.yEndMm} mm)`;
    const movingBoundaryLabel =
      dir === 'up'
        ? `Üst Sınır Hareketli (${group.yEndMm} → ${group.yEndMm + deltaMm} mm)`
        : `Alt Sınır Hareketli (${group.yStartMm} → ${group.yStartMm - deltaMm} mm)`;

    if (!neighborCell) {
      const conflictOverlapMm = Math.abs(deltaMm);
      const boundaryY = dir === 'up' ? group.yEndMm : group.yStartMm;
      return {
        axis: 'Y',
        direction: dir,
        targetCellIds: group.cells.map((c) => c.id),
        bayId: group.bayId,
        runId: group.runId,
        currentTotalMm,
        requestedTotalMm: cleanRequestedMm,
        deltaMm,
        internalDividersMm,
        fixedBoundaryLabel,
        movingBoundaryLabel,
        neighborCellIds: [],
        neighborLabel: dir === 'up' ? 'Dolap Üst Gövde Tablası' : 'Dolap Alt Baza Tablası',
        neighborCurrentMm: 0,
        neighborDraftMm: 0,
        requiredNeighborMm: 0,
        conflictOverlapMm,
        exceedsBoundary: deltaMm !== 0,
        boundaryErrorReason:
          deltaMm !== 0
            ? dir === 'up'
              ? 'Seçili alan dolabın en üst sınırındadır; yukarı doğru büyütülemez. Büyüme yönünü "Aşağı" seçin.'
              : 'Seçili alan dolabın en alt sınırındadır; aşağı doğru büyütülemez. Büyüme yönünü "Yukarı" seçin.'
            : undefined,
        conflictBoxWorldCenterMm: [
          group.groupWorldCenterMm[0],
          boundaryY,
          group.groupWorldCenterMm[2],
        ],
        conflictBoxWorldSizeMm: [
          group.grossWidthMm,
          Math.max(24, conflictOverlapMm),
          group.netDepthMm,
        ],
        conflictBoxRotationYRad: group.rotationYRad,
      };
    }

    const neighborCurrentMm = neighborCell.netHeightMm;
    const requiredNeighborMm = neighborCurrentMm - deltaMm;
    const neighborDraftMm =
      customNeighborDraftMm !== undefined ? Math.round(customNeighborDraftMm) : neighborCurrentMm;
    const conflictOverlapMm = Math.abs(neighborDraftMm - requiredNeighborMm);
    const minTargetNet = group.cells.length * 60;
    const targetNet = cleanRequestedMm - internalDividersMm;
    const exceedsBoundary = requiredNeighborMm < 60 || targetNet < minTargetNet;
    const boundaryErrorReason =
      requiredNeighborMm < 60
        ? `Komşu bölme (${neighborCell.label}) en az 60 mm yüksekliğe sahip olmalıdır (Gereken: ${requiredNeighborMm} mm).`
        : targetNet < minTargetNet
          ? `Seçili grup içindeki her aralık en az 60 mm net yüksekliğe sahip olmalıdır.`
          : undefined;

    const movingBoundaryY = dir === 'up' ? group.yEndMm + deltaMm / 2 : group.yStartMm - deltaMm / 2;

    return {
      axis: 'Y',
      direction: dir,
      targetCellIds: group.cells.map((c) => c.id),
      bayId: group.bayId,
      runId: group.runId,
      currentTotalMm,
      requestedTotalMm: cleanRequestedMm,
      deltaMm,
      internalDividersMm,
      fixedBoundaryLabel,
      movingBoundaryLabel,
      neighborCellIds: [neighborCell.id],
      neighborLabel: neighborCell.label,
      neighborCurrentMm,
      neighborDraftMm,
      requiredNeighborMm,
      conflictOverlapMm,
      exceedsBoundary,
      boundaryErrorReason,
      conflictBoxWorldCenterMm: [
        group.groupWorldCenterMm[0],
        movingBoundaryY,
        group.groupWorldCenterMm[2],
      ],
      conflictBoxWorldSizeMm: [
        group.grossWidthMm,
        Math.max(24, conflictOverlapMm || Math.abs(deltaMm)),
        group.netDepthMm,
      ],
      conflictBoxRotationYRad: group.rotationYRad,
    };
  }

  // -------------------------------------------------------------------------
  // 2. X EKSENİ (GENİŞLİK): SOLA ('left') VEYA SAĞA ('right')
  // -------------------------------------------------------------------------
  if (axis === 'X') {
    const dir: 'left' | 'right' = direction === 'left' ? 'left' : 'right';
    const currentTotalMm = group.grossWidthMm;
    const internalDividersMm = group.widthDividersMm;
    const deltaMm = cleanRequestedMm - currentTotalMm;
    const axisIdx = firstCell.wallAxis === 'A' ? 0 : 2;

    const groupLeftMm = group.groupWorldCenterMm[axisIdx] - currentTotalMm / 2;
    const groupRightMm = group.groupWorldCenterMm[axisIdx] + currentTotalMm / 2;

    // Önce aynı bölme içinde yan yana dikey bölünmüş (vertical SplitNode) komşu var mı kontrol et
    const internalNeighbors = resolved.cells.filter((c) => {
      if (c.bayId !== group.bayId || selectedCellIds.includes(c.id)) return false;
      const overlapsY = c.yStartMm < group.yEndMm && c.yEndMm > group.yStartMm;
      if (!overlapsY) return false;
      const cLeft = c.worldCenterMm[axisIdx] - c.netWidthMm / 2;
      const cRight = c.worldCenterMm[axisIdx] + c.netWidthMm / 2;
      return dir === 'right'
        ? Math.abs(cLeft - (groupRightMm + t)) <= 5
        : Math.abs(cRight - (groupLeftMm - t)) <= 5;
    });

    const fixedBoundaryLabel =
      dir === 'right'
        ? `Sol Dikme Sabit (${Math.round(groupLeftMm)} mm)`
        : `Sağ Dikme Sabit (${Math.round(groupRightMm)} mm)`;
    const movingBoundaryLabel =
      dir === 'right'
        ? `Sağ Dikme Sağa Hareketli (${deltaMm >= 0 ? '+' : ''}${deltaMm} mm)`
        : `Sol Dikme Sola Hareketli (${deltaMm >= 0 ? '+' : ''}${deltaMm} mm)`;

    if (internalNeighbors.length > 0) {
      const nb = internalNeighbors[0];
      const neighborCurrentMm = nb.netWidthMm;
      const requiredNeighborMm = neighborCurrentMm - deltaMm;
      const neighborDraftMm =
        customNeighborDraftMm !== undefined ? Math.round(customNeighborDraftMm) : neighborCurrentMm;
      const conflictOverlapMm = Math.abs(neighborDraftMm - requiredNeighborMm);
      const exceedsBoundary = requiredNeighborMm < 80 || cleanRequestedMm < 80;

      const conflictCenter: [number, number, number] = [...group.groupWorldCenterMm];
      conflictCenter[axisIdx] =
        dir === 'right' ? groupRightMm + deltaMm / 2 : groupLeftMm - deltaMm / 2;

      return {
        axis: 'X',
        direction: dir,
        targetCellIds: group.cells.map((c) => c.id),
        bayId: group.bayId,
        runId: group.runId,
        currentTotalMm,
        requestedTotalMm: cleanRequestedMm,
        deltaMm,
        internalDividersMm,
        fixedBoundaryLabel,
        movingBoundaryLabel,
        neighborCellIds: internalNeighbors.map((c) => c.id),
        neighborLabel: nb.label,
        neighborCurrentMm,
        neighborDraftMm,
        requiredNeighborMm,
        conflictOverlapMm,
        exceedsBoundary,
        boundaryErrorReason: exceedsBoundary
          ? `Komşu iç bölme (${nb.label}) en az 80 mm genişlikte olmalıdır (Gereken: ${requiredNeighborMm} mm).`
          : undefined,
        conflictBoxWorldCenterMm: conflictCenter,
        conflictBoxWorldSizeMm: [
          Math.max(24, conflictOverlapMm || Math.abs(deltaMm)),
          group.grossHeightMm,
          group.netDepthMm,
        ],
        conflictBoxRotationYRad: group.rotationYRad,
      };
    }

    // Hücre bölmenin tam genişliğini kaplıyorsa: Komşu gövde bölmesini (Bay) kontrol et
    const runBays = resolved.bays
      .filter((b) => b.runId === group.runId)
      .sort((a, b) => a.index - b.index);
    const currentBayIdx = runBays.findIndex((b) => b.id === group.bayId);
    const neighborBay =
      dir === 'right' ? runBays[currentBayIdx + 1] : runBays[currentBayIdx - 1];

    if (!neighborBay) {
      return {
        axis: 'X',
        direction: dir,
        targetCellIds: group.cells.map((c) => c.id),
        bayId: group.bayId,
        runId: group.runId,
        currentTotalMm,
        requestedTotalMm: cleanRequestedMm,
        deltaMm,
        internalDividersMm: 0,
        fixedBoundaryLabel,
        movingBoundaryLabel,
        neighborCellIds: [],
        neighborLabel: dir === 'left' ? 'Sol Duvar / Köşe Sınırı' : 'Sağ Duvar Sınırı',
        neighborCurrentMm: 0,
        neighborDraftMm: 0,
        requiredNeighborMm: 0,
        conflictOverlapMm: Math.abs(deltaMm),
        exceedsBoundary: deltaMm !== 0,
        boundaryErrorReason:
          deltaMm !== 0
            ? `${dir === 'left' ? 'Sol' : 'Sağ'} yönde komşu gövde bölmesi bulunmuyor. Diğer yönü seçin veya duvar kolu uzunluğunu artırın.`
            : undefined,
        conflictBoxWorldCenterMm: group.groupWorldCenterMm,
        conflictBoxWorldSizeMm: [
          Math.max(24, Math.abs(deltaMm)),
          group.grossHeightMm,
          group.netDepthMm,
        ],
        conflictBoxRotationYRad: group.rotationYRad,
      };
    }

    const neighborBayCells = resolved.cells.filter((c) => c.bayId === neighborBay.id);
    const neighborCurrentMm = neighborBay.netInnerWidthMm;
    const requiredNeighborMm = neighborCurrentMm - deltaMm;
    const neighborDraftMm =
      customNeighborDraftMm !== undefined ? Math.round(customNeighborDraftMm) : neighborCurrentMm;
    const conflictOverlapMm = Math.abs(neighborDraftMm - requiredNeighborMm);
    const exceedsBoundary = requiredNeighborMm < 180 || cleanRequestedMm < 180;

    const conflictCenter: [number, number, number] = [...group.groupWorldCenterMm];
    conflictCenter[axisIdx] =
      dir === 'right' ? groupRightMm + deltaMm / 2 : groupLeftMm - deltaMm / 2;

    return {
      axis: 'X',
      direction: dir,
      targetCellIds: group.cells.map((c) => c.id),
      bayId: group.bayId,
      runId: group.runId,
      currentTotalMm,
      requestedTotalMm: cleanRequestedMm,
      deltaMm,
      internalDividersMm: 0,
      fixedBoundaryLabel,
      movingBoundaryLabel,
      neighborCellIds: neighborBayCells.map((c) => c.id),
      neighborLabel: neighborBay.label,
      neighborCurrentMm,
      neighborDraftMm,
      requiredNeighborMm,
      conflictOverlapMm,
      exceedsBoundary,
      boundaryErrorReason: exceedsBoundary
        ? `Komşu gövde bölmesi (${neighborBay.label}) en az 180 mm net iç genişliğe sahip olmalıdır.`
        : undefined,
      conflictBoxWorldCenterMm: conflictCenter,
      conflictBoxWorldSizeMm: [
        Math.max(24, conflictOverlapMm || Math.abs(deltaMm)),
        group.grossHeightMm,
        group.netDepthMm,
      ],
      conflictBoxRotationYRad: group.rotationYRad,
    };
  }

  // -------------------------------------------------------------------------
  // 3. Z EKSENİ (DERİNLİK): ÖNE ('front') VEYA ARKAYA ('back')
  // -------------------------------------------------------------------------
  const dir: 'front' | 'back' = direction === 'back' ? 'back' : 'front';
  const currentTotalMm = group.netDepthMm;
  const deltaMm = cleanRequestedMm - currentTotalMm;
  const bay = resolved.bays.find(item => item.id === group.bayId);
  const depthAxis = firstCell.wallAxis === 'B' ? 0 : 2;
  const outerDepth = bay?.worldSizeMm[depthAxis] ?? currentTotalMm;
  const rear = bay ? bay.worldCenterMm[depthAxis] - outerDepth / 2 : 0;
  const front = rear + outerDepth;
  const proposedDepth = outerDepth + deltaMm;
  const proposedRear = dir === 'back' ? rear - deltaMm : rear;
  const proposedFront = proposedRear + proposedDepth;
  const corner = resolved.corners.find(item => item.type === 'diagonal');
  const adjoiningArm = depthAxis === 0 ? corner?.consumedRunAMm : corner?.consumedRunBMm;
  let boundaryErrorReason: string | undefined;
  if (!bay) {
    boundaryErrorReason = 'Beşgen köşe derinliğini komşu kolların derinlikleri ve köşe kol ölçüleri belirler.';
  } else if (proposedRear < 0) {
    boundaryErrorReason = 'Arka panel oda duvarını aşar. Kullanılabilir arka boşluk ' + rear + ' mm.';
  } else if (proposedDepth < validationConfig.minRunDepthMm || proposedFront > validationConfig.maxRunFrontMm) {
    boundaryErrorReason = `Gövde derinliği en az ${validationConfig.minRunDepthMm} mm olmalı ve ön cephe duvardan en fazla ${validationConfig.maxRunFrontMm} mm uzaklıkta kalmalıdır.`;
  } else if (adjoiningArm !== undefined && proposedFront + validationConfig.diagonalLegBeyondFrontMm > adjoiningArm) {
    boundaryErrorReason = `Bu cephe derinliği için komşu beşgen köşe kolunu en az ${proposedFront + validationConfig.diagonalLegBeyondFrontMm} mm yapın.`;
  }

  return {
    axis: 'Z',
    direction: dir,
    targetCellIds: group.cells.map((c) => c.id),
    bayId: group.bayId,
    runId: group.runId,
    currentTotalMm,
    requestedTotalMm: cleanRequestedMm,
    deltaMm,
    internalDividersMm: 0,
    fixedBoundaryLabel: dir === 'front' ? `Arkalık sabit (${rear} mm)` : `Ön cephe sabit (${front} mm)`,
    movingBoundaryLabel: dir === 'front'
      ? `Ön cephe ${front} → ${proposedFront} mm` : `Arkalık ${rear} → ${proposedRear} mm`,
    neighborCellIds: [],
    neighborLabel: 'Aynı koldaki bütün bölmeler',
    neighborCurrentMm: 0,
    neighborDraftMm: 0,
    requiredNeighborMm: 0,
    conflictOverlapMm: Math.max(0, -proposedRear),
    exceedsBoundary: Boolean(boundaryErrorReason),
    boundaryErrorReason,
  };
}

/**
 * Çakışması giderilmiş (`conflictOverlapMm === 0 && !exceedsBoundary`) bir `ResizeDraftState`
 * işlemini `draft: Design` üzerine tek atomik adımda uygular.
 */
export function commitDirectionalResizeInDesign(
  draft: Design,
  resizeDraft: ResizeDraftState,
  resolved: ResolvedModel
): { updatedTargetCellIds: string[] } {
  const t = Math.round(resolved.panelThicknessMm ?? 18);
  const {
    axis,
    targetCellIds,
    bayId,
    runId,
    requestedTotalMm,
    internalDividersMm,
    neighborCellIds,
    neighborDraftMm,
  } = resizeDraft;

  // 1. Z Ekseni (Derinlik): İlgili kolun derinliğini güncelle
  if (axis === 'Z') {
    const run = draft.runs.find((r) => r.id === runId);
    if (!run || resizeDraft.exceedsBoundary) {
      throw new Error(resizeDraft.boundaryErrorReason ?? 'Derinlik değişikliği uygulanamaz.');
    }
    const newDepth = Math.round(requestedTotalMm + run.backPanelThicknessMm);
    const rear = run.rearOffsetMm ?? 0;
    const newRear = resizeDraft.direction === 'back' ? rear + run.depthMm - newDepth : rear;
    if (newRear < 0 || newDepth < validationConfig.minRunDepthMm || newRear + newDepth > validationConfig.maxRunFrontMm) {
      throw new Error('Derinlik değişikliği gövde veya oda duvarı sınırını aşıyor.');
    }
    run.depthMm = newDepth;
    if (newRear > 0) run.rearOffsetMm = newRear;
    else delete run.rearOffsetMm;
    return { updatedTargetCellIds: targetCellIds };
  }

  // 2. X Ekseni (Genişlik): İç dikey bölünme veya Gövde Bölmesi (Bay) genişliği
  if (axis === 'X') {
    const firstTarget = resolved.cells.find((c) => c.id === targetCellIds[0]);
    const bay = resolved.bays.find((b) => b.id === bayId);
    if (!firstTarget || !bay) {
      return { updatedTargetCellIds: targetCellIds };
    }

    // Eğer hedef hücre(ler) bölme içindeki dikey bir SplitNode altındaysa
    const isInternalSplit =
      neighborCellIds.length > 0 &&
      resolved.cells.find((c) => c.id === neighborCellIds[0])?.bayId === bayId;

    if (isInternalSplit) {
      const targetCells = targetCellIds
        .map((id) => resolved.cells.find((c) => c.id === id))
        .filter((c): c is ResolvedCell => Boolean(c));
      const newNetSum = Math.max(targetCells.length * 80, requestedTotalMm - internalDividersMm);
      const dist = distributeIntegerMm(
        newNetSum,
        targetCells.map((c) => ({
          id: c.sourceLeafId ?? c.id,
          size: { kind: 'flex' as const, weight: Math.max(1, c.netWidthMm) },
        })),
        0
      );

      const newWidthByLeafId = new Map<string, number>();
      for (const d of dist) {
        newWidthByLeafId.set(d.id, d.resolvedMm);
      }
      for (const nbId of neighborCellIds) {
        const nbCell = resolved.cells.find((c) => c.id === nbId);
        if (nbCell) {
          newWidthByLeafId.set(nbCell.sourceLeafId ?? nbCell.id, neighborDraftMm);
        }
      }

      const updateVerticalSplits = (node: SplitNode) => {
        if (node.kind === 'leaf') return;
        if (node.direction === 'vertical') {
          for (const ch of node.children) {
            if (ch.node.kind === 'leaf') {
              const targetW = newWidthByLeafId.get(ch.node.id);
              if (targetW !== undefined) {
                ch.size = { kind: 'fixed', mm: targetW };
              }
            }
          }
        }
        for (const ch of node.children) {
          updateVerticalSplits(ch.node);
        }
      };

      for (const r of draft.runs) {
        for (const b of r.bays) {
          if (b.id === bayId) {
            updateVerticalSplits(b.root);
          }
        }
      }
      return { updatedTargetCellIds: targetCellIds };
    }

    // Aksi halde gövde bölmesinin (Bay) ve komşu gövde bölmesinin dış genişliklerini güncelle
    const run = draft.runs.find((r) => r.id === runId);
    const neighborCell = resolved.cells.find((c) => c.id === neighborCellIds[0]);
    const neighborBay = neighborCell
      ? resolved.bays.find((b) => b.id === neighborCell.bayId)
      : undefined;

    if (run && neighborBay) {
      const bayOverhead = bay.outerWidthMm - bay.netInnerWidthMm;
      const nbOverhead = neighborBay.outerWidthMm - neighborBay.netInnerWidthMm;
      const newBayOuter = Math.round(requestedTotalMm + bayOverhead);
      const newNbOuter = Math.round(neighborDraftMm + nbOverhead);

      for (const b of run.bays) {
        const resolvedB = resolved.bays.find((rb) => rb.id === b.id);
        if (b.id === bay.id) {
          b.width = { kind: 'fixed', mm: newBayOuter };
        } else if (b.id === neighborBay.id) {
          b.width = { kind: 'fixed', mm: newNbOuter };
        } else if (resolvedB) {
          b.width = { kind: 'fixed', mm: resolvedB.outerWidthMm };
        }
      }
    }

    return { updatedTargetCellIds: targetCellIds };
  }

  // 3. Y Ekseni (Yükseklik): Tek hücre veya bitişik dikey hücre grubunu orantılı boyutlandır + komşuyu güncelle
  const targetCells = targetCellIds
    .map((id) => resolved.cells.find((c) => c.id === id))
    .filter((c): c is ResolvedCell => Boolean(c))
    .sort((a, b) => a.yStartMm - b.yStartMm);

  if (targetCells.length === 0) {
    return { updatedTargetCellIds: targetCellIds };
  }

  const neighborCell =
    neighborCellIds.length > 0
      ? resolved.cells.find((c) => c.id === neighborCellIds[0])
      : undefined;

  // Beşgen Köşe (cornerInterval) Y ekseni boyutlandırması: junction.intervalHeightsMm dizisini güncelle
  if (targetCells[0].subIntervalKind === 'cornerInterval') {
    const juncId = targetCells[0].cornerJunctionId ?? bayId;
    const junc = draft.junctions.find((j) => j.id === juncId) ?? draft.junctions[0];
    if (junc) {
      const cornerCells = resolved.cells
        .filter((c) => c.cornerJunctionId === junc.id)
        .sort((a, b) => (a.subIntervalIndex ?? 0) - (b.subIntervalIndex ?? 0));
      const nextHeights = cornerCells.map((c) => c.netHeightMm);

      const newTargetNetSum = Math.max(
        targetCells.length * 60,
        requestedTotalMm - internalDividersMm
      );
      const dist = distributeIntegerMm(
        newTargetNetSum,
        targetCells.map((tc) => ({
          id: String(tc.subIntervalIndex ?? 0),
          size: { kind: 'flex' as const, weight: Math.max(1, tc.netHeightMm) },
        })),
        0
      );

      for (const d of dist) {
        const idx = Number.parseInt(d.id, 10);
        if (!Number.isNaN(idx) && idx >= 0 && idx < nextHeights.length) {
          nextHeights[idx] = d.resolvedMm;
        }
      }
      if (neighborCell && neighborCell.subIntervalIndex !== undefined) {
        nextHeights[neighborCell.subIntervalIndex] = neighborDraftMm;
      }
      junc.intervalHeightsMm = nextHeights;
    }
    return { updatedTargetCellIds: targetCellIds };
  }

  // Eğer hedef veya komşu hücrelerden herhangi biri sanal ::sub-k aralığıysa, ilgili yaprakları gerçek SplitNode'a dönüştür
  const leavesToRealize = new Set<string>();
  for (const tc of targetCells) {
    if (tc.sourceLeafId && tc.id.includes('::sub-')) {
      leavesToRealize.add(tc.sourceLeafId);
    }
  }
  if (neighborCell?.sourceLeafId && neighborCell.id.includes('::sub-')) {
    leavesToRealize.add(neighborCell.sourceLeafId);
  }

  for (const leafId of leavesToRealize) {
    realizeLeafWithExactSolvedHeights(draft, leafId, resolved.cells);
  }

  const resolveActualLeafId = (c: ResolvedCell): string => {
    if (c.sourceLeafId && c.id.includes('::sub-') && leavesToRealize.has(c.sourceLeafId)) {
      return `${c.sourceLeafId}-sub-${c.subIntervalIndex ?? 0}`;
    }
    return c.id;
  };

  // Seçili gruptaki hücrelerin yeni net yüksekliklerini mevcut oranlarını koruyarak dağıt
  const newTargetNetSum = Math.max(targetCells.length * 60, requestedTotalMm - internalDividersMm);
  const dist = distributeIntegerMm(
    newTargetNetSum,
    targetCells.map((tc) => ({
      id: resolveActualLeafId(tc),
      size: { kind: 'flex' as const, weight: Math.max(1, tc.netHeightMm) },
    })),
    0
  );

  // Bölmedeki tüm yaprakların hedef net yükseklik haritasını oluştur
  const netHeightMap = new Map<string, number>();
  const bayCells = resolved.cells.filter((c) => c.bayId === bayId);
  for (const rc of bayCells) {
    netHeightMap.set(resolveActualLeafId(rc), rc.netHeightMm);
  }
  // Dönüştürülmemiş (dokunulmamış) çok-aralıklı yaprakların toplam yüksekliğini de haritaya ekle
  const bySourceLeaf = new Map<string, ResolvedCell[]>();
  for (const rc of bayCells) {
    if (rc.sourceLeafId && !leavesToRealize.has(rc.sourceLeafId)) {
      const list = bySourceLeaf.get(rc.sourceLeafId) ?? [];
      list.push(rc);
      bySourceLeaf.set(rc.sourceLeafId, list);
    }
  }
  for (const [sLeafId, list] of bySourceLeaf.entries()) {
    const grossH =
      list.reduce((sum, item) => sum + item.netHeightMm, 0) +
      Math.max(0, (list.length - 1) * t);
    netHeightMap.set(sLeafId, grossH);
  }
  for (const d of dist) {
    netHeightMap.set(d.id, d.resolvedMm);
  }
  if (neighborCell) {
    netHeightMap.set(resolveActualLeafId(neighborCell), neighborDraftMm);
  }

  // Yatay SplitNode ağacındaki tüm çocukların boyutlarını aşağıdan yukarıya (bottom-up) güncelle
  const computeAndAssignHeights = (node: SplitNode): number | null => {
    if (node.kind === 'leaf') {
      return netHeightMap.get(node.id) ?? null;
    }

    if (node.direction === 'horizontal') {
      let totalGross = 0;
      let allKnown = true;
      for (const ch of node.children) {
        const chHeight = computeAndAssignHeights(ch.node);
        if (chHeight !== null) {
          ch.size = { kind: 'fixed', mm: chHeight };
          totalGross += chHeight;
        } else {
          allKnown = false;
        }
      }
      if (allKnown && node.children.length > 0) {
        return totalGross + (node.children.length - 1) * t;
      }
      return null;
    }

    for (const ch of node.children) {
      computeAndAssignHeights(ch.node);
    }
    return null;
  };

  for (const r of draft.runs) {
    for (const b of r.bays) {
      if (b.id === bayId) {
        computeAndAssignHeights(b.root);
      }
    }
  }

  const updatedTargetCellIds = targetCells.map((tc) => resolveActualLeafId(tc));
  return { updatedTargetCellIds };
}

