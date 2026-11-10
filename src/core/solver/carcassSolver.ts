import { resolveServiceItemPlacement } from '../inserts/insertRegistry';
import { assertDesignStructure, DesignConstraintError, runFrontMm } from '../schema/designConstraints';
import type {
  Bay,
  BayFrontMode,
  Design,
  DimensionAnnotation,
  HandleConfig,
  LedColorTempId,
  MaterialId,
  ResolvedBay,
  ResolvedCell,
  ResolvedCorner,
  ResolvedDoorLeaf,
  ResolvedDrawerUnit,
  ResolvedLedStrip,
  ResolvedModel,
  ResolvedPanel,
  Run,
  SizeSpec,
  SplitNode,
  ValidationIssue,
} from '../schema/types';
import { solveCornerJunction } from './cornerSolver';
import { distributeIntegerMm, DistributionError } from './flexSolver';
import { resolveStudioAnalysis } from '../analysis/studioAnalysis';
import { hangingProfile } from '../analysis/inventory';
import { attachSlidingFronts } from './slidingSolver';
import { validationConfig } from './validationConfig';
import { shelfGridIntervals } from './adjustableShelves';
import { estimatedBoardMassKg, exposedDrawerHeight, FRONT_REAR_GAP_MM, FRONT_VERTICAL_REVEAL_MM, frontVerticalRange, hingeRevealMm, planningSingleLeafKg } from '../fronts/frontGeometry';
import { planHingeOpenings } from './hingePlanning';

const LED_HEX_BY_TEMP: Record<LedColorTempId, string> = {
  warm2700K: '#ffd699',
  warm3000K: '#ffe4b5',
  natural3000K: '#ffe4b5',
  neutral4000K: '#fff6e8',
  cool5000K: '#f0f7ff',
};

const GLASS_OR_MIRROR_MATERIALS = new Set<MaterialId>([
  'clearGlass',
  'smokedGlass',
  'clearMirror',
  'bronzeMirror',
]);

interface LocalBoxBoundsMm {
  x0Mm: number;
  y0Mm: number;
  z0Mm: number;
  widthMm: number;
  heightMm: number;
  depthMm: number;
}

interface ParentSplitMeta {
  parentId?: string;
  parentDirection?: 'horizontal' | 'vertical';
  childIndexInParent?: number;
  sizeSpecInParent?: SizeSpec;
  lockedInParent?: boolean;
}

/**
 * Kolun (Run) yerel milimetre koordinatlarını dünya (World XZ) koordinatlarına dönüştürür.
 * - Wall A: X ekseni boyunca uzanır (Z = derinlik, odaya doğru +Z)
 * - Wall B: Z ekseni boyunca uzanır (X = derinlik, odaya doğru +X)
 */
function mapRunBoxToWorld(
  run: Run,
  localCenterMm: [number, number, number],
  localSizeMm: [number, number, number]
): {
  worldPositionMm: [number, number, number];
  boxSizeMm: [number, number, number];
  rotationYRad: number;
} {
  const [sx, sy, sz] = localSizeMm;

  if (run.wallAxis === 'B') {
    return {
      worldPositionMm: mapRunPointToWorld(run, localCenterMm),
      boxSizeMm: [sz, sy, sx],
      rotationYRad: 0,
    };
  }

  return {
    worldPositionMm: mapRunPointToWorld(run, localCenterMm),
    boxSizeMm: [sx, sy, sz],
    rotationYRad: 0,
  };
}

function mapRunPointToWorld(
  run: Run,
  localPointMm: [number, number, number]
): [number, number, number] {
  const [lx, ly, lz] = localPointMm;
  const depth = lz + (run.rearOffsetMm ?? 0);
  if (run.wallAxis === 'B') {
    return [depth, ly, lx];
  }
  return [lx, ly, depth];
}

/**
 * Tasarım belgesini (`Design`) hiçbir 3D bağımlılığı olmadan deterministik `ResolvedModel`'e çözer.
 */
export function solveDesign(design: Design): ResolvedModel {
  try {
    assertDesignStructure(design);
    const model = solveDesignGeometry(design);
    attachSlidingFronts(design, model);
    const motionScene = planHingeOpenings(design, model);
    const assemblyTopMm = Math.max(0, ...model.panels.map(panel =>
      panel.worldPositionMm[1] + (panel.polygonXZMm ? panel.cutThicknessMm : panel.boxSizeMm[1] / 2)
    ));
    const requiredTopMm = assemblyTopMm + (design.ceilingClearanceMm ?? 0);
    if (requiredTopMm > design.roomHeightMm + 0.5) {
      model.issues.push({
        id: 'room-height-exceeded', code: 'ROOM_HEIGHT_EXCEEDED', severity: 'error',
        title: 'Dolap tavan sınırını aşıyor',
        description: `Bitişler ve baza dahil üst kot ${assemblyTopMm} mm. Bildirilen montaj payıyla ${requiredTopMm} mm gerekir, oda ${design.roomHeightMm} mm.`,
      });
    }
    for (const door of model.doors) {
      if (door.widthMm <= validationConfig.hingedLeafWarningMm) continue;
      model.issues.push({
        id: door.id + '-width-warning', code: 'DOOR_LEAF_TOO_WIDE', severity: 'warning',
        title: `Geniş menteşeli kanat (${door.widthMm} mm)`,
        description: `${door.label} ${door.widthMm} × ${door.heightMm} × ${door.thicknessMm} mm. ${validationConfig.hingedLeafWarningMm} mm üzerindeki kanatlarda ağırlığı ve menteşe kapasitesini üreticiyle doğrulayın.`,
        targetId: door.id,
      });
    }
    model.analysis = resolveStudioAnalysis(design, model, motionScene);
    const metrics = Object.values(model.analysis.metrics);
    model.summary.totalHangingLengthMm = metrics.reduce((sum, owner) => sum + owner.hangingLengthMm, 0);
    model.summary.totalShelfAreaM2 = metrics.reduce((sum, owner) => sum + owner.shelfAreaMm2, 0) / 1_000_000;
    return model;
  } catch (error) {
    if (!(error instanceof DistributionError) && !(error instanceof DesignConstraintError)) throw error;
    return {
      designId: design.id, panelThicknessMm: design.runs[0]?.panelThicknessMm ?? 18,
      backPanelThicknessMm: design.runs[0]?.backPanelThicknessMm ?? 8,
      panels: [], doors: [], drawers: [], bays: [], cells: [], corners: [], ledStrips: [], dimensions: [],
      issues: [{
        id: 'design-solve-error',
        code: error instanceof DesignConstraintError ? error.code : 'DIMENSION_ALLOCATION_INVALID',
        severity: 'error', title: 'Tasarım çözülemedi', description: error.message,
      }],
      summary: { totalPanelsCount:0, totalDoorsCount:0, totalHangingLengthMm:0, totalShelfAreaM2:0, totalDrawerCount:0 },
    };
  }
}

function solveDesignGeometry(design: Design): ResolvedModel {
  const panels: ResolvedPanel[] = [];
  const doors: ResolvedDoorLeaf[] = [];
  const drawers: ResolvedDrawerUnit[] = [];
  const bays: ResolvedBay[] = [];
  const cells: ResolvedCell[] = [];
  const corners: ResolvedCorner[] = [];
  const ledStrips: ResolvedLedStrip[] = [];
  const dimensions: DimensionAnnotation[] = [];
  const issues: ValidationIssue[] = [];

  const extFinish = design.exteriorFinish;
  const topStyle = extFinish?.topStyle ?? 'flatFiller';
  const baseStyle = extFinish?.baseStyle ?? 'lowMinimalPlinth';
  const leftSideStyle = extFinish?.leftSideStyle ?? 'thinWallFiller';
  const rightSideStyle = extFinish?.rightSideStyle ?? 'thinWallFiller';
  const shadowGapMm = Math.round(extFinish?.ceilingShadowGapMm ?? 15);
  const plinthRecessMm = Math.round(extFinish?.plinthRecessMm ?? 45);

  const ledCfg = design.ledLighting;
  const ledEnabled = ledCfg ? ledCfg.enabled : true;
  const ledColorHex = LED_HEX_BY_TEMP[ledCfg?.colorTempId ?? 'warm3000K'];
  const ledIntensity = ledCfg?.intensity ?? 1.0;

  const defaultDoorHandle: HandleConfig = design.materials.doorHandleConfig ?? {
    styleId: 'barModern',
    finishId: 'matteBlack',
    lengthMm: 220,
    placement: 'middle',
    orientation: 'vertical',
    offsetFromEdgeMm: 38,
    verticalOffsetMm: 0,
  };

  const defaultDrawerHandle: HandleConfig = design.materials.drawerHandleConfig ?? {
    styleId: 'barModern',
    finishId: 'matteBlack',
    lengthMm: 160,
    placement: 'middle',
    orientation: 'horizontal',
    offsetFromEdgeMm: 38,
    verticalOffsetMm: 0,
  };

  const consumedStartByRunId = new Map<string, number>();
  const blindFrontCoverByRunId = new Map<string, number>();

  for (const run of design.runs) {
    consumedStartByRunId.set(run.id, 0);
    blindFrontCoverByRunId.set(run.id, 0);
  }

  // 1. KÖŞE BİRLEŞİMLERİNİ (JUNCTIONS) ÇÖZ
  if (design.layoutKind === 'l-shape' && design.junctions.length > 0) {
    for (const junction of design.junctions) {
      const runA = design.runs.find((r) => r.id === junction.runAId);
      const runB = design.runs.find((r) => r.id === junction.runBId);
      if (!runA || !runB) continue;

      const cornerResult = solveCornerJunction(junction, runA, runB, design);
      for (const side of cornerResult.panels.filter(p => p.role === 'cornerSidePanel')) {
        const adjoiningRun = design.runs.find(r => r.id === side.runId);
        if (adjoiningRun?.constructionMode === 'shared' && adjoiningRun.bays[0])
          side.bayIds = [junction.id, adjoiningRun.bays[0].id];
      }
      corners.push(cornerResult.corner);
      panels.push(...cornerResult.panels);
      doors.push(...cornerResult.doors);
      cells.push(...cornerResult.cells);
      ledStrips.push(...cornerResult.ledStrips);
      issues.push(...cornerResult.issues);

      consumedStartByRunId.set(runA.id, cornerResult.corner.consumedRunAMm);
      consumedStartByRunId.set(runB.id, cornerResult.corner.consumedRunBMm);

      if (junction.type === 'blind') {
        const priorityIsA = junction.priorityRunId !== runB.id;
        if (priorityIsA) {
          blindFrontCoverByRunId.set(
            runA.id,
            runFrontMm(runB) + junction.fillerWidthMm
          );
        } else {
          blindFrontCoverByRunId.set(
            runB.id,
            runFrontMm(runA) + junction.fillerWidthMm
          );
        }
      }

      if (junction.type === 'diagonal') {
        dimensions.push({
          id: `${junction.id}-dim-armA`,
          kind: 'cornerArm',
          runId: runA.id,
          label: `Köşe A: ${cornerResult.corner.consumedRunAMm} mm`,
          valueMm: cornerResult.corner.consumedRunAMm,
          startMm: [0, runA.heightMm + 60, 0],
          endMm: [cornerResult.corner.consumedRunAMm, runA.heightMm + 60, 0],
          editTarget: junction.type === 'diagonal' ? 'cornerArmA' : 'cornerFiller',
          minMm: junction.type === 'diagonal' ? 750 : 20,
          maxMm: junction.type === 'diagonal' ? 1300 : 150,
          sourceValueMm:
            junction.type === 'diagonal'
              ? cornerResult.corner.consumedRunAMm
              : junction.fillerWidthMm,
        });
        dimensions.push({
          id: `${junction.id}-dim-armB`,
          kind: 'cornerArm',
          runId: runB.id,
          label: `Köşe B: ${cornerResult.corner.consumedRunBMm} mm`,
          valueMm: cornerResult.corner.consumedRunBMm,
          startMm: [0, runB.heightMm + 60, 0],
          endMm: [0, runB.heightMm + 60, cornerResult.corner.consumedRunBMm],
          editTarget: junction.type === 'diagonal' ? 'cornerArmB' : 'cornerFiller',
          minMm: junction.type === 'diagonal' ? 750 : 20,
          maxMm: junction.type === 'diagonal' ? 1300 : 150,
          sourceValueMm:
            junction.type === 'diagonal'
              ? cornerResult.corner.consumedRunBMm
              : junction.fillerWidthMm,
        });
      }
    }
  }

  // 2. HER KOLU (RUN) VE BÖLMELERİNİ (BAYS) ÇÖZ
  for (const run of design.runs) {
    if (design.layoutKind === 'straight' && run.wallAxis !== 'A') {
      continue;
    }

    const runLen = Math.round(run.lengthMm);
    const runDepth = Math.round(run.depthMm);
    const runHeight = Math.round(run.heightMm);
    const plinthH = Math.round(run.plinthHeightMm);
    const topFillerH = Math.round(run.topFillerHeightMm);
    const startFillerW = Math.round(run.startFillerMm);
    const endFillerW = Math.round(run.endFillerMm);
    const t = Math.round(run.panelThicknessMm);
    const tb = Math.round(run.backPanelThicknessMm);

    const consumedCornerMm = consumedStartByRunId.get(run.id) ?? 0;
    const blindCoverMm = blindFrontCoverByRunId.get(run.id) ?? 0;
    const carcassOuterHeightMm = Math.max(400, runHeight - plinthH - topFillerH);
    const usableBaysSpanMm = runLen - consumedCornerMm - (consumedCornerMm === 0 ? startFillerW : 0) - endFillerW;
    if (usableBaysSpanMm < run.bays.length * (t + 40)) throw new DistributionError(`${run.label}: köşe ve klapalardan sonra bölmeler için yeterli alan yok.`);

    dimensions.push({
      id: `${run.id}-dim-total`,
      kind: 'runTotal',
      runId: run.id,
      label: `${run.label}: ${runLen} mm`,
      valueMm: runLen,
      startMm: mapRunPointToWorld(run, [0, runHeight + 140, 0]),
      endMm: mapRunPointToWorld(run, [runLen, runHeight + 140, 0]),
      editTarget: 'runLength',
      minMm: 1200,
      maxMm: 6000,
    });

    dimensions.push({
      id: `${run.id}-dim-height`,
      kind: 'height',
      runId: run.id,
      label: `Yükseklik: ${runHeight} mm`,
      valueMm: runHeight,
      startMm: mapRunPointToWorld(run, [runLen + 80, 0, runDepth]),
      endMm: mapRunPointToWorld(run, [runLen + 80, runHeight, runDepth]),
      editTarget: 'runHeight',
      minMm: 1800,
      maxMm: 3000,
    });

    dimensions.push({
      id: `${run.id}-dim-depth`,
      kind: 'depth',
      runId: run.id,
      label: `Derinlik: ${runDepth} mm`,
      valueMm: runDepth,
      startMm: mapRunPointToWorld(run, [runLen + 60, 0, 0]),
      endMm: mapRunPointToWorld(run, [runLen + 60, 0, runDepth]),
      editTarget: 'runDepth',
      minMm: 350,
      maxMm: 800,
    });

    if (startFillerW > 0 && consumedCornerMm === 0 && leftSideStyle !== 'flushClean') {
      const fillerZOffset =
        leftSideStyle === 'decorativeSideTrim'
          ? runDepth + 6 - Math.round(t / 2)
          : leftSideStyle === 'wallRevealPanel'
            ? runDepth - 12 - Math.round(t / 2)
            : runDepth - Math.round(t / 2);
      const mapped = mapRunBoxToWorld(
        run,
        [
          Math.round(startFillerW / 2),
          plinthH + Math.round(carcassOuterHeightMm / 2),
          fillerZOffset,
        ],
        [startFillerW, carcassOuterHeightMm, t]
      );
      panels.push({
        id: `${run.id}-start-filler`,
        label:
          leftSideStyle === 'decorativeSideTrim'
            ? `${run.label} Sol Dekoratif Yan Çerçeve`
            : leftSideStyle === 'wallRevealPanel'
              ? `${run.label} Sol Duvar Gölge Derzi`
              : `${run.label} Başlangıç Duvar Klapası`,
        runId: run.id,
        role: 'wallFiller',
        shapeKind: 'box',
        cutWidthMm: startFillerW,
        cutHeightMm: carcassOuterHeightMm,
        cutThicknessMm: t,
        ...mapped,
        grainAxis: 'vertical',
        materialSlot: 'front',
        isDecorativeTrim: true,
      });
    }

    if (endFillerW > 0 && rightSideStyle !== 'flushClean') {
      const fillerZOffset =
        rightSideStyle === 'decorativeSideTrim'
          ? runDepth + 6 - Math.round(t / 2)
          : rightSideStyle === 'wallRevealPanel'
            ? runDepth - 12 - Math.round(t / 2)
            : runDepth - Math.round(t / 2);
      const mapped = mapRunBoxToWorld(
        run,
        [
          runLen - Math.round(endFillerW / 2),
          plinthH + Math.round(carcassOuterHeightMm / 2),
          fillerZOffset,
        ],
        [endFillerW, carcassOuterHeightMm, t]
      );
      panels.push({
        id: `${run.id}-end-filler`,
        label:
          rightSideStyle === 'decorativeSideTrim'
            ? `${run.label} Sağ Dekoratif Yan Çerçeve`
            : rightSideStyle === 'wallRevealPanel'
              ? `${run.label} Sağ Duvar Gölge Derzi`
              : `${run.label} Bitiş Duvar Klapası`,
        runId: run.id,
        role: 'wallFiller',
        shapeKind: 'box',
        cutWidthMm: endFillerW,
        cutHeightMm: carcassOuterHeightMm,
        cutThicknessMm: t,
        ...mapped,
        grainAxis: 'vertical',
        materialSlot: 'front',
        isDecorativeTrim: true,
      });
    }

    if (plinthH > 0) {
      const plinthX0 = consumedCornerMm;
      const plinthW = Math.max(100, runLen - consumedCornerMm);
      if (baseStyle === 'adjustableFeet') {
        const footStep = Math.max(450, Math.floor(plinthW / Math.max(2, run.bays.length + 1)));
        let footIdx = 1;
        for (let fx = plinthX0 + 55; fx <= runLen - 50; fx += footStep) {
          for (const fz of [90, runDepth - 65]) {
            const mappedFoot = mapRunBoxToWorld(
              run,
              [fx, Math.round(plinthH / 2), fz],
              [38, plinthH, 38]
            );
            panels.push({
              id: `${run.id}-foot-${footIdx++}`,
              label: `${run.label} Ayarlı Metal Ayak`,
              runId: run.id,
              role: 'cabinetFoot',
              shapeKind: 'cylinderRod',
              cutWidthMm: 38,
              cutHeightMm: plinthH,
              cutThicknessMm: 38,
              ...mappedFoot,
              grainAxis: 'vertical',
              materialSlot: 'metal',
              isDecorativeTrim: true,
            });
          }
        }
      } else {
        const recess =
          baseStyle === 'recessedHiddenPlinth'
            ? Math.max(35, plinthRecessMm)
            : 25;
        const mapped = mapRunBoxToWorld(
          run,
          [
            plinthX0 + Math.round(plinthW / 2),
            Math.round(plinthH / 2),
            runDepth - recess - Math.round(t / 2),
          ],
          [plinthW, plinthH, t]
        );
        panels.push({
          id: `${run.id}-plinth`,
          label:
            baseStyle === 'recessedHiddenPlinth'
              ? `${run.label} İçeri Çekik Gömme Baza`
              : baseStyle === 'highClassicPlinth'
                ? `${run.label} Yüksek Klasik Baza`
                : `${run.label} Ön Baza`,
          runId: run.id,
          role: 'plinth',
          shapeKind: 'box',
          cutWidthMm: plinthW,
          cutHeightMm: plinthH,
          cutThicknessMm: t,
          ...mapped,
          grainAxis: 'horizontal',
          materialSlot: 'carcass',
          isDecorativeTrim: true,
        });
      }
    }

    if (plinthH < 18) {
      issues.push({
        id: `${run.id}-low-floor-clearance`,
        severity: 'warning',
        code: 'LOW_FLOOR_CLEARANCE_WARNING',
        title: `Zemine Çok Yakın Kapak Açılımı (${plinthH} mm Baza)`,
        description: `${run.label} alt baza yüksekliği ${plinthH} mm. Halı veya eşik bulunan odalarda alt kapakların zemine sürtmemesi için en az 30–40 mm gömme baza önerilir.`,
        targetId: run.id,
      });
    }

    if (topFillerH > 0 && topStyle !== 'none') {
      const topX0 = consumedCornerMm;
      const topW = Math.max(100, runLen - consumedCornerMm);
      const effectiveTopFillerH =
        topStyle === 'flushCeiling'
          ? Math.max(10, topFillerH - Math.min(shadowGapMm, Math.floor(topFillerH * 0.45)))
          : topFillerH;
      const mapped = mapRunBoxToWorld(
        run,
        [
          topX0 + Math.round(topW / 2),
          plinthH + carcassOuterHeightMm + Math.round(effectiveTopFillerH / 2),
          runDepth - Math.round(t / 2),
        ],
        [topW, effectiveTopFillerH, t]
      );
      panels.push({
        id: `${run.id}-top-filler`,
        label:
          topStyle === 'flushCeiling'
            ? `${run.label} Gölge Derzli Tavan Bitişi`
            : `${run.label} Üst Taç`,
        runId: run.id,
        role: 'topFiller',
        shapeKind: 'box',
        cutWidthMm: topW,
        cutHeightMm: effectiveTopFillerH,
        cutThicknessMm: t,
        ...mapped,
        grainAxis: 'horizontal',
        materialSlot: 'front',
        isDecorativeTrim: true,
      });

      if (topStyle === 'classicCrown' && topFillerH >= 28) {
        const crownH = Math.min(26, Math.round(topFillerH * 0.48));
        const crownMapped = mapRunBoxToWorld(
          run,
          [
            topX0 + Math.round(topW / 2),
            plinthH + carcassOuterHeightMm + topFillerH - Math.round(crownH / 2),
            runDepth + 10,
          ],
          [topW, crownH, t + 18]
        );
        panels.push({
          id: `${run.id}-top-crown`,
          label: `${run.label} Klasik Taç Profili`,
          runId: run.id,
          role: 'crownMolding',
          shapeKind: 'box',
          cutWidthMm: topW,
          cutHeightMm: crownH,
          cutThicknessMm: t + 18,
          ...crownMapped,
          grainAxis: 'horizontal',
          materialSlot: 'front',
          isDecorativeTrim: true,
        });
      }
    }

    const distributedBays = distributeIntegerMm(
      usableBaysSpanMm,
      run.bays.map((b) => ({ id: b.id, size: b.width, locked: b.locked })),
      0
    );

    if (t > 22) {
      issues.push({
        id: `${run.id}-thick-panel-info`,
        severity: 'warning',
        code: 'HEAVY_PANEL_THICKNESS',
        title: `Kalın Ana Panel Seçimi (${t} mm)`,
        description: `${run.label} üzerinde ${t} mm ana panel kalınlığı kullanılıyor. Dış ölçüler sabit tutularak iç net genişlikler ve çekmece iç kasaları otomatik daraltıldı; ağır kapaklar için ek menteşe önerilir.`,
        targetId: run.id,
      });
    }

    if (tb <= 4) {
      issues.push({
        id: `${run.id}-thin-back-panel-warning`,
        severity: 'warning',
        code: 'THIN_BACK_PANEL_THICKNESS',
        title: `İnce Arkalık / Çekmece Tabanı (${tb} mm)`,
        description: `${run.label} üzerinde ${tb} mm ince panel seçildi. Geniş çekmecelerde taban esnemesini önlemek için çekmece altı destek kayıtları veya 8 mm taban önerilir.`,
        targetId: run.id,
      });
    }

    const initialBayCursorX = consumedCornerMm + (consumedCornerMm === 0 ? startFillerW : 0);
    const shared = run.constructionMode === 'shared';
    const sharedCornerSide = shared && corners.some(c => c.type === 'diagonal' &&
      design.junctions.some(j => j.id === c.id && (j.runAId === run.id || j.runBId === run.id)));
    // Her ortak dikme, soldaki bölmenin brüt mm payına dahildir; net ölçüler daima tamsayıdır.
    const leftInset = (index: number) => shared && (index > 0 || sharedCornerSide) ? 0 : t;
    const frontStart = (start:number,index:number) => start - (shared && (index>0 || sharedCornerSide) ? Math.round(t/2) : 0);
    const frontEnd = (start:number,width:number,index:number) => start+width-(shared&&index<run.bays.length-1?Math.round(t/2):0);
    const baySpanMetaMap = new Map<
      string,
      {
        bIdx: number;
        bay: Bay;
        outerWidthMm: number;
        netInnerWidthMm: number;
        netInnerHeightMm: number;
        netInnerDepthMm: number;
        bayStartLocalX: number;
      }
    >();
    {
      let tempCursorX = initialBayCursorX;
      for (let bIdx = 0; bIdx < run.bays.length; bIdx++) {
        const bay = run.bays[bIdx];
        const outerWidthMm = distributedBays[bIdx]?.resolvedMm ?? 600;
        const netInnerWidthMm = outerWidthMm - leftInset(bIdx) - t;
        if (netInnerWidthMm < 40) throw new DistributionError(`${bay.label}: panellerden sonra en az 40 mm net genişlik gereklidir.`);
        const netInnerHeightMm = Math.max(100, carcassOuterHeightMm - 2 * t);
        const netInnerDepthMm = Math.max(100, runDepth - tb);
        baySpanMetaMap.set(bay.id, {
          bIdx,
          bay,
          outerWidthMm,
          netInnerWidthMm,
          netInnerHeightMm,
          netInnerDepthMm,
          bayStartLocalX: tempCursorX,
        });
        tempCursorX += outerWidthMm;
      }
    }

    // --- BAĞIMSIZ KAPAK (FRONT) KATMANI: AÇIK FRONT KAYITLARI + OTOMATİK BÖLME KAPAKLARI ---
    const bayCreatedDoorIdsMap = new Map<string, string[]>();
    for (const b of run.bays) {
      bayCreatedDoorIdsMap.set(b.id, []);
    }
    const baysHandledByExplicitFronts = new Set<string>();
    const explicitRunFronts = (design.fronts ?? []).filter((f) => f.runId === run.id);

    const isRunB = run.wallAxis === 'B';
    const closedRotY = isRunB ? Math.PI / 2 : 0;

    const instantiateDoorPairOrSingle = (opts: {
      doorIdPrefix: string;
      baseLabel: string;
      primaryBayId: string;
      coveredBayIds: string[];
      frontId?: string;
      isPartialHeight?: boolean;
      mode: 'auto' | 'singleLeft' | 'singleRight' | 'double';
      hingeAngleDeg: 110 | 155 | 165;
      doorY0: number;
      doorY1: number;
      openingStartMm: number;
      openingEndMm: number;
      openingBottomMm: number;
      openingTopMm: number;
      sharedStart: boolean;
      sharedEnd: boolean;
      inset?: boolean;
      materialId?: MaterialId;
      handleConfig?: HandleConfig;
    }) => {
      const doorH = opts.doorY1 - opts.doorY0;
      const reveal = hingeRevealMm(t, opts.hingeAngleDeg, opts.inset);
      const frontDepth = runDepth + (opts.inset ? 0 : t + FRONT_REAR_GAP_MM);
      const doorX0 = opts.openingStartMm + reveal;
      const span = opts.openingEndMm - opts.openingStartMm - 2 * reveal;
      const seam = 3 + Math.ceil((reveal - 2) / 2);
      const material = opts.materialId ?? design.materials.frontMaterialId;
      const singleMass = estimatedBoardMassKg(span, doorH, t, material);
      const autoPair = span >= 240 + seam &&
        (span > validationConfig.hingedLeafWarningMm || (singleMass ?? 0) > planningSingleLeafKg);
      const effectiveMode = opts.mode === 'auto' ? autoPair ? 'double' : 'singleLeft' : opts.mode;
      if (doorH < 140 || span < (effectiveMode === 'double' ? 240 + seam : 120)) {
        issues.push({
          id: `${opts.doorIdPrefix}-size`, code: 'HINGED_OPENING_TOO_SMALL', severity: opts.frontId ? 'error' : 'warning',
          title: 'Menteşeli cephe açıklığı yetersiz',
          description: `${opts.baseLabel}: derzler sonrası ${span} × ${doorH} mm. Açıklığı büyütün, kanat düzenini değiştirin veya açık bırakın.`,
          targetId: opts.frontId ?? opts.primaryBayId,
        });
        return;
      }
      const yCenter = opts.doorY0 + doorH / 2;
      const effectiveHandle: HandleConfig = opts.handleConfig ?? defaultDoorHandle;
      const handleLen =
        effectiveHandle.lengthMm > 0
          ? effectiveHandle.lengthMm
          : Math.min(240, Math.max(110, Math.round(doorH * 0.14)));

      const createDoorLeaf = (
        leafSuffix: string,
        leafLabel: string,
        leafX0: number,
        leafW: number,
        side: 'left' | 'right'
      ) => {
        const pivotLocalX = isRunB
          ? side === 'left'
            ? leafX0 + leafW
            : leafX0
          : side === 'left'
            ? leafX0
            : leafX0 + leafW;
        const pivotWorldMm = mapRunPointToWorld(run, [pivotLocalX, yCenter, frontDepth]);
        const doorId = `${opts.doorIdPrefix}-${leafSuffix}`;
        for (const bid of opts.coveredBayIds) {
          bayCreatedDoorIdsMap.get(bid)?.push(doorId);
        }

        const edgeOffset = Math.min(
          Math.max(20, Math.round(effectiveHandle.offsetFromEdgeMm ?? 38)),
          Math.max(24, Math.round(leafW * 0.45))
        );
        const handleX =
          effectiveHandle.placement === 'verticalEdge' ||
          effectiveHandle.styleId === 'profileVertical'
            ? side === 'left'
              ? leafW - 10
              : -(leafW - 10)
            : side === 'left'
              ? leafW - edgeOffset
              : -(leafW - edgeOffset);

        let handleY = -Math.round(doorH * 0.05);
        if (effectiveHandle.placement === 'top') {
          handleY = Math.round(doorH / 2 - Math.max(90, handleLen / 2 + 45));
        } else if (effectiveHandle.placement === 'bottom') {
          handleY = -Math.round(doorH / 2 - Math.max(90, handleLen / 2 + 45));
        } else if (effectiveHandle.placement === 'verticalEdge') {
          handleY = 0;
        }
        handleY += Math.round(effectiveHandle.verticalOffsetMm ?? 0);

        doors.push({
          id: doorId,
          frontId: opts.frontId,
          label: leafLabel,
          runId: run.id,
          bayId: opts.primaryBayId,
          bayIds: opts.coveredBayIds,
          hingeSide: side,
          maxAngleDeg: opts.hingeAngleDeg,
          widthMm: leafW,
          heightMm: doorH,
          thicknessMm: t,
          yStartMm: opts.doorY0,
          yEndMm: opts.doorY1,
          isPartialHeight: opts.isPartialHeight,
          pivotWorldMm,
          closedRotationYRad: closedRotY,
          openRotationDirection: side === 'left' ? -1 : 1,
          leafCenterOffsetMm: [
            side === 'left' ? leafW / 2 : -leafW / 2,
            0,
            -t / 2,
          ],
          handleOffsetMm: [handleX, handleY, t + 14],
          handleLengthMm: handleLen,
          clearanceMm: {
            spanStart: reveal,
            spanEnd: reveal,
            bottom: opts.doorY0 - opts.openingBottomMm,
            top: opts.openingTopMm - opts.doorY1,
            centerSeam: effectiveMode === 'double' ? seam : undefined,
          },
          hingeProfile: 'exterior-axis',
          mounting: opts.inset ? 'inset' : (pivotLocalX === doorX0 ? opts.sharedStart : opts.sharedEnd) ? 'shared-overlay' : 'overlay',
          materialId: opts.materialId,
          handleConfig: effectiveHandle,
        });

        const closedPanelWorld = mapRunBoxToWorld(
          run,
          [leafX0 + leafW / 2, yCenter, frontDepth - t / 2],
          [leafW, doorH, t]
        );
        panels.push({
          id: `${doorId}-panel`,
          label: leafLabel,
          runId: run.id,
          bayId: opts.primaryBayId,
          role: 'doorLeaf',
          shapeKind: 'box',
          cutWidthMm: leafW,
          cutHeightMm: doorH,
          cutThicknessMm: t,
          ...closedPanelWorld,
          grainAxis: 'vertical',
          materialSlot: 'front',
          materialIdOverride: opts.materialId,
          animatedUnitId: doorId,
        });
      };

      if (effectiveMode === 'double') {
        const leftW = Math.floor((span - seam) / 2);
        const rightW = span - seam - leftW;
        createDoorLeaf(
          'left',
          `${opts.baseLabel} Sol Kapak`,
          doorX0,
          leftW,
          isRunB ? 'right' : 'left'
        );
        createDoorLeaf(
          'right',
          `${opts.baseLabel} Sağ Kapak`,
          doorX0 + leftW + seam,
          rightW,
          isRunB ? 'left' : 'right'
        );
      } else {
        createDoorLeaf(
          effectiveMode === 'singleLeft' ? 'left' : 'right',
          `${opts.baseLabel} Kapak`,
          doorX0,
          span,
          effectiveMode === 'singleLeft' ? 'left' : 'right'
        );
      }
    };

    for (const front of explicitRunFronts) {
      const validMetas = front.bayIds
        .map((bid) => baySpanMetaMap.get(bid))
        .filter((m): m is NonNullable<typeof m> => Boolean(m));
      if (validMetas.length === 0) continue;

      for (const m of validMetas) {
        baysHandledByExplicitFronts.add(m.bay.id);
      }
      if (front.type === 'open' || front.type === 'sliding') {
        continue;
      }

      const firstMeta = validMetas.reduce((prev, cur) =>
        cur.bayStartLocalX < prev.bayStartLocalX ? cur : prev
      );
      const lastMeta = validMetas.reduce((prev, cur) =>
        cur.bayStartLocalX + cur.outerWidthMm > prev.bayStartLocalX + prev.outerWidthMm
          ? cur
          : prev
      );

      const blindOffset = firstMeta.bIdx === 0 ? blindCoverMm : 0;
      const inset = front.hingeMount === 'inset';
      if (inset && (validMetas.length !== 1 || blindOffset > 0)) {
        issues.push({ id: `${front.id}-inset`, code: 'INSET_FRONT_COVERAGE', severity: 'error',
          title: 'İçerlek kapak için tek net açıklık gerekir',
          description: 'İçerlek kanat, aradaki dikmeyi veya kör köşe klapasını kaplayamaz. Tek bölme veya bindirmeli montaj seçin.', targetId: front.id });
        continue;
      }
      const range = frontVerticalRange(run, front);
      const openingBottom = plinthH + (inset ? t : 0);
      const openingTop = plinthH + carcassOuterHeightMm - (inset ? t : 0);
      const doorY0 = Math.max(openingBottom + FRONT_VERTICAL_REVEAL_MM, range.start);
      const doorY1 = Math.min(openingTop - FRONT_VERTICAL_REVEAL_MM, range.end);
      const mode = front.hingeSide === 'right' ? 'singleRight' : front.hingeSide === 'left' || !front.hingeSide ? 'singleLeft' : front.hingeSide;

      instantiateDoorPairOrSingle({
        doorIdPrefix: `door-${front.id}`,
        baseLabel: front.label || firstMeta.bay.label,
        primaryBayId: firstMeta.bay.id,
        coveredBayIds: validMetas.map((m) => m.bay.id),
        frontId: front.id,
        isPartialHeight: doorY0 > plinthH + FRONT_VERTICAL_REVEAL_MM || doorY1 < plinthH + carcassOuterHeightMm - FRONT_VERTICAL_REVEAL_MM,
        mode,
        hingeAngleDeg: front.openingAngleDeg ?? firstMeta.bay.hingeAngleDeg ?? 110,
        doorY0,
        doorY1,
        openingStartMm: inset ? firstMeta.bayStartLocalX + leftInset(firstMeta.bIdx) : frontStart(firstMeta.bayStartLocalX, firstMeta.bIdx) + blindOffset,
        openingEndMm: inset ? lastMeta.bayStartLocalX + lastMeta.outerWidthMm - t : frontEnd(lastMeta.bayStartLocalX, lastMeta.outerWidthMm, lastMeta.bIdx),
        openingBottomMm: range.start <= openingBottom + FRONT_VERTICAL_REVEAL_MM ? openingBottom : range.start,
        openingTopMm: range.end >= openingTop - FRONT_VERTICAL_REVEAL_MM ? openingTop : range.end,
        sharedStart: blindOffset === 0 && shared && (firstMeta.bIdx > 0 || sharedCornerSide),
        sharedEnd: shared && lastMeta.bIdx < run.bays.length - 1,
        inset,
        materialId:
          front.materialId ?? firstMeta.bay.doorMaterialId ?? firstMeta.bay.frontMaterialId,
        handleConfig: front.handleConfig ?? firstMeta.bay.handleConfig,
      });
    }

    let bayCursorX = initialBayCursorX;

    for (let bIdx = 0; bIdx < run.bays.length; bIdx++) {
      const bay = run.bays[bIdx];
      const outerWidthMm = distributedBays[bIdx]?.resolvedMm ?? 600;
      const netInnerWidthMm = outerWidthMm - leftInset(bIdx) - t;
      if (netInnerWidthMm < 40) throw new DistributionError(`${bay.label}: panellerden sonra en az 40 mm net genişlik gereklidir.`);
      const netInnerHeightMm = Math.max(100, carcassOuterHeightMm - 2 * t);
      const netInnerDepthMm = Math.max(100, runDepth - tb);

      const bayStartLocalX = bayCursorX;
      const bayCenterLocalX = bayStartLocalX + Math.round(outerWidthMm / 2);
      const bayCenterLocalY = plinthH + Math.round(carcassOuterHeightMm / 2);
      const bayCenterLocalZ = runDepth / 2;

      const bayWorld = mapRunBoxToWorld(
        run,
        [bayCenterLocalX, bayCenterLocalY, bayCenterLocalZ],
        [outerWidthMm, carcassOuterHeightMm, runDepth]
      );

      const frontMode: BayFrontMode = bay.frontMode ?? (bay.autoFront ? 'auto' : 'open');
      const hingeAngleDeg: 110 | 155 | 165 = bay.hingeAngleDeg ?? 110;

      const resolvedBay: ResolvedBay = {
        id: bay.id,
        runId: run.id,
        label: bay.label,
        index: bIdx,
        owner: bay.owner,
        locked: bay.locked,
        sizeSpec: bay.width,
        frontMode,
        hingeAngleDeg,
        frontMaterialId: bay.doorMaterialId ?? bay.frontMaterialId,
        doorMaterialId: bay.doorMaterialId ?? bay.frontMaterialId,
        handleConfig: bay.handleConfig,
        outerWidthMm,
        netInnerWidthMm,
        netInnerHeightMm,
        netInnerDepthMm,
        startOffsetMm: bayStartLocalX,
        worldCenterMm: bayWorld.worldPositionMm,
        worldSizeMm: bayWorld.boxSizeMm,
        rotationYRad: bayWorld.rotationYRad,
      };
      bays.push(resolvedBay);

      dimensions.push({
        id: `${bay.id}-dim-outer`,
        kind: 'bayOuter',
        runId: run.id,
        bayId: bay.id,
        label: `Dış: ${outerWidthMm} mm`,
        valueMm: outerWidthMm,
        startMm: mapRunPointToWorld(run, [bayStartLocalX, 40, runDepth + 55]),
        endMm: mapRunPointToWorld(run, [bayStartLocalX + outerWidthMm, 40, runDepth + 55]),
        editTarget: 'bayOuterWidth',
        minMm: 220,
        maxMm: 1400,
      });

      dimensions.push({
        id: `${bay.id}-dim-inner`,
        kind: 'bayInner',
        runId: run.id,
        bayId: bay.id,
        label: `Net İç: ${netInnerWidthMm} mm`,
        valueMm: netInnerWidthMm,
        startMm: mapRunPointToWorld(run, [bayStartLocalX + leftInset(bIdx), plinthH + t + 35, runDepth + 15]),
        endMm: mapRunPointToWorld(run, [
          bayStartLocalX + outerWidthMm - t,
          plinthH + t + 35,
          runDepth + 15,
        ]),
        editTarget: 'bayInnerDerived',
        minMm: 220,
        maxMm: 1400,
        sourceValueMm: outerWidthMm,
      });

      // --- GÖVDE (KARKAS) PANELLERİ ---
      const leftSideWorld = mapRunBoxToWorld(
        run,
        [
          bayStartLocalX + t / 2,
          bayCenterLocalY,
          tb + Math.round(netInnerDepthMm / 2),
        ],
        [t, carcassOuterHeightMm, netInnerDepthMm]
      );
      if (!shared || (bIdx === 0 && !sharedCornerSide)) panels.push({
        id: `${bay.id}-side-left`,
        label: `${bay.label} Sol Dikme`,
        runId: run.id,
        bayId: bay.id,
        bayIds: [bay.id],
        role: 'sidePanel',
        shapeKind: 'box',
        cutWidthMm: netInnerDepthMm,
        cutHeightMm: carcassOuterHeightMm,
        cutThicknessMm: t,
        ...leftSideWorld,
        grainAxis: 'vertical',
        materialSlot: 'carcass',
      });

      const rightSideWorld = mapRunBoxToWorld(
        run,
        [
          bayStartLocalX + outerWidthMm - t / 2,
          bayCenterLocalY,
          tb + Math.round(netInnerDepthMm / 2),
        ],
        [t, carcassOuterHeightMm, netInnerDepthMm]
      );
      panels.push({
        id: `${bay.id}-side-right`,
        label: `${bay.label} Sağ Dikme`,
        runId: run.id,
        bayId: bay.id,
        bayIds: shared && bIdx < run.bays.length-1 ? [bay.id, run.bays[bIdx+1].id] : [bay.id],
        role: 'sidePanel',
        shapeKind: 'box',
        cutWidthMm: netInnerDepthMm,
        cutHeightMm: carcassOuterHeightMm,
        cutThicknessMm: t,
        ...rightSideWorld,
        grainAxis: 'vertical',
        materialSlot: 'carcass',
      });

      const bottomWorld = mapRunBoxToWorld(
        run,
        [
          shared ? bayStartLocalX + leftInset(bIdx) + netInnerWidthMm / 2 : bayCenterLocalX,
          plinthH + t / 2,
          tb + Math.round(netInnerDepthMm / 2),
        ],
        [netInnerWidthMm, t, netInnerDepthMm]
      );
      panels.push({
        id: `${bay.id}-bottom`,
        label: `${bay.label} Alt Tabla`,
        runId: run.id,
        bayId: bay.id,
        role: 'bottomPanel',
        shapeKind: 'box',
        cutWidthMm: netInnerWidthMm,
        cutHeightMm: netInnerDepthMm,
        cutThicknessMm: t,
        ...bottomWorld,
        grainAxis: 'horizontal',
        materialSlot: 'carcass',
      });

      const topWorld = mapRunBoxToWorld(
        run,
        [
          shared ? bayStartLocalX + leftInset(bIdx) + netInnerWidthMm / 2 : bayCenterLocalX,
          plinthH + carcassOuterHeightMm - t / 2,
          tb + Math.round(netInnerDepthMm / 2),
        ],
        [netInnerWidthMm, t, netInnerDepthMm]
      );
      panels.push({
        id: `${bay.id}-top`,
        label: `${bay.label} Üst Tabla`,
        runId: run.id,
        bayId: bay.id,
        role: 'topPanel',
        shapeKind: 'box',
        cutWidthMm: netInnerWidthMm,
        cutHeightMm: netInnerDepthMm,
        cutThicknessMm: t,
        ...topWorld,
        grainAxis: 'horizontal',
        materialSlot: 'carcass',
      });

      const backWorld = mapRunBoxToWorld(
        run,
        [bayCenterLocalX, bayCenterLocalY, Math.round(tb / 2)],
        [outerWidthMm, carcassOuterHeightMm, tb]
      );
      panels.push({
        id: `${bay.id}-back`,
        label: `${bay.label} Arkalık (${tb}mm)`,
        runId: run.id,
        bayId: bay.id,
        role: 'backPanel',
        shapeKind: 'box',
        cutWidthMm: outerWidthMm,
        cutHeightMm: carcassOuterHeightMm,
        cutThicknessMm: tb,
        ...backWorld,
        grainAxis: 'vertical',
        materialSlot: 'back',
      });

      // --- OTOMATİK VARSAYILAN KAPAK TÜRETİMİ (AÇIK FRONT KAYDI YOKSA) ---
      if (!baysHandledByExplicitFronts.has(bay.id) && frontMode !== 'open' && frontMode !== 'sliding') {
        const blindOffsetInBayMm = bIdx === 0 ? blindCoverMm : 0;
        if (blindOffsetInBayMm > 0 && outerWidthMm - blindOffsetInBayMm < 180) {
          issues.push({
            id: `${bay.id}-blind-opening-too-narrow`,
            severity: 'error',
            code: 'BLIND_CORNER_BAY_TOO_NARROW',
            title: `Kör Köşe Bölmesi Çok Dar (${outerWidthMm} mm)`,
            description: `${bay.label} genişliği (${outerWidthMm} mm), dik kolun kapattığı kör alandan (${blindCoverMm} mm) sonra kapak açmak için yeterli boşluk bırakmıyor. Bölme genişliğini en az ${blindCoverMm + 350} mm yapın.`,
            targetId: bay.id,
          });
        }

        const exposedBottomDrawerH = exposedDrawerHeight(
          bay,
          netInnerHeightMm,
          t
        );

        const doorY0 =
          exposedBottomDrawerH > 0
            ? plinthH + t + exposedBottomDrawerH
            : plinthH + FRONT_VERTICAL_REVEAL_MM;
        const doorY1 = plinthH + carcassOuterHeightMm - FRONT_VERTICAL_REVEAL_MM;
        const doorH = doorY1 - doorY0;

        if (doorH >= 160) {
          instantiateDoorPairOrSingle({
            doorIdPrefix: `door-${bay.id}`,
            baseLabel: bay.label,
            primaryBayId: bay.id,
            coveredBayIds: [bay.id],
            isPartialHeight: exposedBottomDrawerH > 0,
            mode: frontMode,
            hingeAngleDeg,
            doorY0,
            doorY1,
            openingStartMm: frontStart(bayStartLocalX, bIdx) + blindOffsetInBayMm,
            openingEndMm: frontEnd(bayStartLocalX, outerWidthMm, bIdx),
            openingBottomMm: exposedBottomDrawerH > 0 ? doorY0 : plinthH,
            openingTopMm: doorY1 + FRONT_VERTICAL_REVEAL_MM,
            sharedStart: blindOffsetInBayMm === 0 && shared && (bIdx > 0 || sharedCornerSide),
            sharedEnd: shared && bIdx < run.bays.length - 1,
            materialId: bay.doorMaterialId ?? bay.frontMaterialId,
            handleConfig: bay.handleConfig,
          });
        }
      }

      const bayCreatedDoorIds = bayCreatedDoorIdsMap.get(bay.id) ?? [];

      // --- BÖLME DİKEY YAN LED VE AÇIK BÖLME TAVAN LED ŞERİTLERİ ---
      if (ledEnabled) {
        if (ledCfg?.verticalSides) {
          const vStripH = Math.max(80, netInnerHeightMm - 36);
          const vStripZ = Math.max(tb + 30, runDepth - 48);
          for (const [sideSuffix, localX] of [
            ['left', bayStartLocalX + t + 2] as const,
            ['right', bayStartLocalX + outerWidthMm - t - 2] as const,
          ]) {
            const mappedVStrip = mapRunBoxToWorld(
              run,
              [localX, bayCenterLocalY, vStripZ],
              [4, vStripH, 10]
            );
            ledStrips.push({
              id: `${bay.id}-led-vside-${sideSuffix}`,
              runId: run.id,
              bayId: bay.id,
              kind: 'verticalSide',
              worldPositionMm: mappedVStrip.worldPositionMm,
              boxSizeMm: mappedVStrip.boxSizeMm,
              rotationYRad: mappedVStrip.rotationYRad,
              colorHex: ledColorHex,
              intensity: ledIntensity,
              coveringDoorIds: bayCreatedDoorIds,
            });
          }
        }

        const isBayOpenOrGlass =
          bayCreatedDoorIds.length === 0 ||
          doors.some(
            (d) =>
              bayCreatedDoorIds.includes(d.id) &&
              GLASS_OR_MIRROR_MATERIALS.has(d.materialId ?? design.materials.frontMaterialId)
          );
        if ((ledCfg?.openBays ?? true) && isBayOpenOrGlass) {
          const topStripW = Math.max(40, netInnerWidthMm - 24);
          const topStripY = plinthH + carcassOuterHeightMm - t - 2;
          const topStripZ = Math.max(tb + 30, runDepth - 65);
          const mappedTopStrip = mapRunBoxToWorld(
            run,
            [bayCenterLocalX, topStripY, topStripZ],
            [topStripW, 4, 12]
          );
          ledStrips.push({
            id: `${bay.id}-led-open-top`,
            runId: run.id,
            bayId: bay.id,
            kind: 'openBay',
            worldPositionMm: mappedTopStrip.worldPositionMm,
            boxSizeMm: mappedTopStrip.boxSizeMm,
            rotationYRad: mappedTopStrip.rotationYRad,
            colorHex: ledColorHex,
            intensity: ledIntensity,
            coveringDoorIds: bayCreatedDoorIds,
          });
        }
      }

      // --- İÇ BÖLME AĞACINI (SPLIT-TREE) ÖZYİNELEMELİ ÇÖZ ---
      const innerBounds: LocalBoxBoundsMm = {
        x0Mm: bayStartLocalX + leftInset(bIdx),
        y0Mm: plinthH + t,
        z0Mm: tb,
        widthMm: netInnerWidthMm,
        heightMm: netInnerHeightMm,
        depthMm: netInnerDepthMm,
      };

      const firstCellIndex = cells.length;
      solveSplitTreeRecursive(
        bay.root,
        innerBounds,
        {},
        run,
        bay,
        design,
        defaultDrawerHandle,
        ledEnabled,
        ledColorHex,
        ledIntensity,
        bayCreatedDoorIds,
        doors,
        drawers,
        ledStrips,
        `${bay.label}`,
        t,
        tb,
        panels,
        cells,
        dimensions,
        issues
      );

      if (bIdx === 0 && blindCoverMm > 0) {
        for (const cell of cells.slice(firstCellIndex))
          cell.accessOpeningWidthMm = Math.max(0, Math.min(cell.netWidthMm, outerWidthMm - blindCoverMm - leftInset(bIdx) - t));
      }

      bayCursorX += outerWidthMm;
    }
  }

  // Cam veya ayna kapak kullanıldığında bilgilendirici imalat/konstrüksiyon notu üret
  const usesGlassOrMirrorDoor =
    GLASS_OR_MIRROR_MATERIALS.has(design.materials.frontMaterialId) ||
    doors.some((d) => d.materialId && GLASS_OR_MIRROR_MATERIALS.has(d.materialId));
  if (usesGlassOrMirrorDoor) {
    issues.push({
      id: 'glass-mirror-construction-info',
      severity: 'warning',
      code: 'GLASS_MIRROR_CONSTRUCTION_INFO',
      title: 'Cam / Ayna Kapak Üretim Notu (Alüminyum Çerçeveli / Destekli Sistem)',
      description:
        'Tasarımda cam veya ayna kapak yüzeyi kullanılıyor. 3D stüdyoda alüminyum çerçeveli vitrin / arkalıklı ayna olarak gösterilen bu kapaklar, üretim aşamasında çerçevesiz suntalam kesimi yerine alüminyum profil çerçeve veya MDF destekli ayna paneli olarak imal edilmelidir.',
    });
  }

  const primaryRun = design.runs[0];
  return {
    designId: design.id,
    panelThicknessMm: Math.round(primaryRun?.panelThicknessMm ?? 18),
    backPanelThicknessMm: Math.round(primaryRun?.backPanelThicknessMm ?? 8),
    panels,
    doors,
    drawers,
    bays,
    cells,
    corners,
    ledStrips,
    dimensions,
    issues,
    summary: {
      totalPanelsCount: panels.length,
      totalDoorsCount: doors.length,
      totalHangingLengthMm: 0,
      totalShelfAreaM2: 0,
      totalDrawerCount: drawers.length,
    },
  };
}

function solveSplitTreeRecursive(
  node: SplitNode,
  bounds: LocalBoxBoundsMm,
  parentMeta: ParentSplitMeta,
  run: Run,
  bay: Bay,
  design: Design,
  defaultDrawerHandle: HandleConfig,
  ledEnabled: boolean,
  ledColorHex: string,
  ledIntensity: number,
  bayDoorIds: string[],
  allDoors: ResolvedDoorLeaf[],
  drawers: ResolvedDrawerUnit[],
  ledStrips: ResolvedLedStrip[],
  pathPrefix: string,
  defaultPanelThicknessMm: number,
  defaultBackPanelThicknessMm: number,
  panels: ResolvedPanel[],
  cells: ResolvedCell[],
  dimensions: DimensionAnnotation[],
  issues: ValidationIssue[]
): void {
  const centerLocal: [number, number, number] = [
    bounds.x0Mm + Math.round(bounds.widthMm / 2),
    bounds.y0Mm + Math.round(bounds.heightMm / 2),
    bounds.z0Mm + Math.round(bounds.depthMm / 2),
  ];
  const worldCell = mapRunBoxToWorld(run, centerLocal, [
    bounds.widthMm,
    bounds.heightMm,
    bounds.depthMm,
  ]);

  if (node.kind === 'split') {
    const divT = Math.round(defaultPanelThicknessMm);
    const spanToSplit = node.direction === 'vertical' ? bounds.widthMm : bounds.heightMm;

    const dist = distributeIntegerMm(
      spanToSplit,
      node.children.map((ch) => ({ id: ch.id, size: ch.size, locked: ch.locked })),
      divT
    );

    if (node.direction === 'vertical') {
      let cursorX = bounds.x0Mm;
      for (let i = 0; i < node.children.length; i++) {
        const childSpec = node.children[i];
        const childW = dist[i]?.resolvedMm ?? 200;

        solveSplitTreeRecursive(
          childSpec.node,
          {
            x0Mm: cursorX,
            y0Mm: bounds.y0Mm,
            z0Mm: bounds.z0Mm,
            widthMm: childW,
            heightMm: bounds.heightMm,
            depthMm: bounds.depthMm,
          },
          {
            parentId: node.id,
            parentDirection: 'vertical',
            childIndexInParent: i,
            sizeSpecInParent: childSpec.size,
            lockedInParent: childSpec.locked,
          },
          run,
          bay,
          design,
          defaultDrawerHandle,
          ledEnabled,
          ledColorHex,
          ledIntensity,
          bayDoorIds,
          allDoors,
          drawers,
          ledStrips,
          `${pathPrefix} > Sütun #${i + 1}`,
          defaultPanelThicknessMm,
          defaultBackPanelThicknessMm,
          panels,
          cells,
          dimensions,
          issues
        );

        cursorX += childW;

        if (i < node.children.length - 1) {
          const divWorld = mapRunBoxToWorld(
            run,
            [
              cursorX + divT / 2,
              bounds.y0Mm + Math.round(bounds.heightMm / 2),
              bounds.z0Mm + Math.round(bounds.depthMm / 2),
            ],
            [divT, bounds.heightMm, bounds.depthMm]
          );
          panels.push({
            id: `${node.id}-vdiv-${i + 1}`,
            label: `${pathPrefix} Ara Dikme #${i + 1}`,
            runId: run.id,
            bayId: bay.id,
            role: 'verticalDivider',
            shapeKind: 'box',
            cutWidthMm: bounds.depthMm,
            cutHeightMm: bounds.heightMm,
            cutThicknessMm: divT,
            ...divWorld,
            grainAxis: 'vertical',
            materialSlot: 'carcass',
          });
          cursorX += divT;
        }
      }
    } else {
      let cursorY = bounds.y0Mm;
      for (let i = 0; i < node.children.length; i++) {
        const childSpec = node.children[i];
        const childH = dist[i]?.resolvedMm ?? 300;

        solveSplitTreeRecursive(
          childSpec.node,
          {
            x0Mm: bounds.x0Mm,
            y0Mm: cursorY,
            z0Mm: bounds.z0Mm,
            widthMm: bounds.widthMm,
            heightMm: childH,
            depthMm: bounds.depthMm,
          },
          {
            parentId: node.id,
            parentDirection: 'horizontal',
            childIndexInParent: i,
            sizeSpecInParent: childSpec.size,
            lockedInParent: childSpec.locked,
          },
          run,
          bay,
          design,
          defaultDrawerHandle,
          ledEnabled,
          ledColorHex,
          ledIntensity,
          bayDoorIds,
          allDoors,
          drawers,
          ledStrips,
          `${pathPrefix} > Kat #${i + 1}`,
          defaultPanelThicknessMm,
          defaultBackPanelThicknessMm,
          panels,
          cells,
          dimensions,
          issues
        );

        cursorY += childH;

        if (i < node.children.length - 1) {
          const shelfWorld = mapRunBoxToWorld(
            run,
            [
              bounds.x0Mm + Math.round(bounds.widthMm / 2),
              cursorY + divT / 2,
              bounds.z0Mm + Math.round(bounds.depthMm / 2),
            ],
            [bounds.widthMm, divT, bounds.depthMm]
          );
          panels.push({
            id: `${node.id}-hdiv-${i + 1}`,
            label: `${pathPrefix} Sabit Ara Raf #${i + 1}`,
            runId: run.id,
            bayId: bay.id,
            role: 'shelf',
            shapeKind: 'box',
            cutWidthMm: bounds.widthMm,
            cutHeightMm: bounds.depthMm,
            cutThicknessMm: divT,
            ...shelfWorld,
            grainAxis: 'horizontal',
            materialSlot: 'shelf',
          });
          if (ledEnabled && (design.ledLighting?.shelfUnder ?? true)) {
            const stripW = Math.max(40, bounds.widthMm - 24);
            const stripZ = bounds.z0Mm + Math.round(bounds.depthMm * 0.72);
            const stripMapped = mapRunBoxToWorld(
              run,
              [bounds.x0Mm + Math.round(bounds.widthMm / 2), cursorY - 2, stripZ],
              [stripW, 4, 10]
            );
            ledStrips.push({
              id: `${node.id}-hdiv-led-${i + 1}`,
              runId: run.id,
              bayId: bay.id,
              kind: 'shelfUnder',
              worldPositionMm: stripMapped.worldPositionMm,
              boxSizeMm: stripMapped.boxSizeMm,
              rotationYRad: stripMapped.rotationYRad,
              colorHex: ledColorHex,
              intensity: ledIntensity,
              coveringDoorIds: bayDoorIds,
            });
          }
          cursorY += divT;
        }
      }
    }
    return;
  }

  // YAPRAK HÜCRE (LEAF CELL)
  const leafOwner = node.owner ?? bay.owner;
  const leafLabel = node.label ?? pathPrefix;
  const insert = node.insert;
  const t = defaultPanelThicknessMm;
  const shelfDepth = Math.max(100, bounds.depthMm - 15);
  const bayHingeAngle = bay.hingeAngleDeg ?? 110;
  // 110° standart menteşede kapak kalınlığı kadar (~22 mm) iç açıklık daralması oluşur; 155° sıfır çıkıntılı menteşede 0 mm'dir.
  const hingeProtrusionMm = bay.frontMode === 'open' ? 0 : bayHingeAngle === 110 ? 22 : 0;

  const getCoveringDoorsForSlice = (y0Mm: number, y1Mm: number): string[] =>
    allDoors
      .filter(
        (d) =>
          bayDoorIds.includes(d.id) &&
          d.yStartMm < y1Mm - 5 &&
          d.yEndMm > y0Mm + 5
      )
      .map((d) => d.id);

  const cellLedActive = insert?.ledEnabled !== false && ledEnabled;

  // Seçilen 3D eşya şablonunun hücre fiziksel ölçülerine sığma kontrolü
  if (insert?.itemPreset && insert.itemPreset !== 'none' && insert.itemPreset !== 'auto') {
    const preset = insert.itemPreset;
    if (preset === 'longDresses' && bounds.heightMm < 1250) {
      issues.push({
        id: `${node.id}-item-fit-long-dress`,
        severity: 'warning',
        code: 'ITEM_PHYSICAL_FIT_WARNING',
        title: `Uzun Elbise Yüksekliği Dar (${bounds.heightMm} mm < 1250 mm)`,
        description: `${leafLabel} yüksekliği (${bounds.heightMm} mm) uzun elbise/palto askısı için önerilen 1250 mm altındadır; etek uçları tabana değebilir.`,
        targetId: node.id,
      });
    } else if ((preset === 'shirts' || preset === 'jackets') && bounds.heightMm < 820) {
      issues.push({
        id: `${node.id}-item-fit-shirt-jacket`,
        severity: 'warning',
        code: 'ITEM_PHYSICAL_FIT_WARNING',
        title: `Gömlek / Ceket Askı Yüksekliği Dar (${bounds.heightMm} mm < 820 mm)`,
        description: `${leafLabel} yüksekliği (${bounds.heightMm} mm) standart gömlek/ceket askısı için dar.`,
        targetId: node.id,
      });
    } else if (
      preset === 'suitcases' &&
      (bounds.widthMm < 420 || bounds.heightMm < 260 || bounds.depthMm < 360)
    ) {
      issues.push({
        id: `${node.id}-item-fit-suitcase`,
        severity: 'warning',
        code: 'ITEM_PHYSICAL_FIT_WARNING',
        title: `Valiz Hücre Hacmi Dar (${bounds.widthMm}×${bounds.heightMm}×${bounds.depthMm} mm)`,
        description: `${leafLabel} ölçüleri standart kabin/orta boy valiz yerleşimi için dar.`,
        targetId: node.id,
      });
    } else if (preset === 'shoes' && bounds.depthMm < 310) {
      issues.push({
        id: `${node.id}-item-fit-shoes`,
        severity: 'warning',
        code: 'ITEM_PHYSICAL_FIT_WARNING',
        title: `Ayakkabı Raf Derinliği Dar (${bounds.depthMm} mm < 310 mm)`,
        description: `${leafLabel} net derinliği (${bounds.depthMm} mm) yetişkin ayakkabıları için önerilen 320 mm'nin altında.`,
        targetId: node.id,
      });
    }
  }


  if (bounds.widthMm > validationConfig.shelfSpanWarningMm &&
      defaultPanelThicknessMm <= validationConfig.shelfSpanReferenceThicknessMm) {
    issues.push({
      id: `${node.id}-sagging-warning`,
      severity: 'warning',
      code: 'SHELF_SPAN_EXCEEDED',
      title: `Geniş Açıklık (${bounds.widthMm} mm > ${validationConfig.shelfSpanWarningMm} mm)`,
      description: `${leafLabel} açıklığı ${validationConfig.shelfSpanWarningMm} mm sınırını aşıyor. Dikey destek veya daha kalın paneli marangozla değerlendirin.`,
      targetId: node.id,
    });
  }

  // Çoklu görünür raf aralığı üreten modüller (shelfStack, shoeRack, raflı beddingYukluk)
  const isMultiShelfModule =
    insert?.type === 'shelfStack' ||
    insert?.type === 'shoeRack' ||
    (insert?.type === 'beddingYukluk' && (insert.shelfCount ?? 0) > 0);

  if (isMultiShelfModule && insert) {
    const shelfCount =
      insert.type === 'shoeRack'
        ? Math.max(1, insert.shoeTiers ?? 4)
        : Math.max(1, insert.shelfCount ?? 3);
    const intervalCount = shelfCount + 1;
    const averageIntervalMm = (bounds.heightMm - shelfCount * t) / intervalCount;
    const shelfRows = insert.type === 'shelfStack' && insert.adjustable ? insert.shelfPinRows : undefined;
    if (shelfRows && shelfRows.length !== shelfCount) {
      throw new DistributionError('32 mm raf düzenindeki satır sayısı raf adediyle eşleşmeli.');
    }
    const intervals = shelfRows ? shelfGridIntervals(bounds.heightMm, t, shelfRows) : distributeIntegerMm(
      bounds.heightMm,
      Array.from({ length: intervalCount }, (_, idx) => ({
        id: `${node.id}-int-${idx}`,
        size: { kind: 'flex' as const, weight: 1, minMm: Math.floor(averageIntervalMm), maxMm: Math.ceil(averageIntervalMm) },
      })),
      t
    ).map(interval => interval.resolvedMm);

    let cursorY = bounds.y0Mm;
    for (let k = 0; k < intervalCount; k++) {
      const intH = intervals[k];
      const subCenterLocal: [number, number, number] = [
        bounds.x0Mm + Math.round(bounds.widthMm / 2),
        cursorY + Math.round(intH / 2),
        bounds.z0Mm + Math.round(bounds.depthMm / 2),
      ];
      const subWorld = mapRunBoxToWorld(run, subCenterLocal, [
        bounds.widthMm,
        intH,
        bounds.depthMm,
      ]);
      const subId = `${node.id}::sub-${k}`;
      const subCoveringDoors = getCoveringDoorsForSlice(cursorY, cursorY + intH);

      cells.push({
        id: subId,
        sourceLeafId: node.id,
        subIntervalIndex: k,
        subIntervalCount: intervalCount,
        subIntervalKind: 'shelfInterval',
        supportDepthMm: k > 0 ? shelfDepth : undefined,
        ...parentMeta,
        bayId: bay.id,
        runId: run.id,
        wallAxis: run.wallAxis,
        label: `${leafLabel} — ${k + 1}. Raf Aralığı`,
        path: `${pathPrefix} > ${k + 1}. Raf Aralığı`,
        owner: leafOwner,
        isLeaf: true,
        insert: node.insert,
        coveringDoorIds: subCoveringDoors,
        netWidthMm: bounds.widthMm,
        netHeightMm: intH,
        netDepthMm: bounds.depthMm,
        yStartMm: cursorY,
        yEndMm: cursorY + intH,
        worldCenterMm: subWorld.worldPositionMm,
        worldSizeMm: subWorld.boxSizeMm,
        rotationYRad: subWorld.rotationYRad,
      });

      cursorY += intH;

      if (k < shelfCount) {
        const shelfWorld = mapRunBoxToWorld(
          run,
          [
            bounds.x0Mm + Math.round(bounds.widthMm / 2),
            cursorY + t / 2,
            bounds.z0Mm + Math.round(shelfDepth / 2),
          ],
          [bounds.widthMm, t, shelfDepth]
        );
        panels.push({
          id:
            insert.type === 'shoeRack'
              ? `${node.id}-shoe-shelf-${k + 1}`
              : `${node.id}-shelf-${k + 1}`,
          label:
            insert.type === 'shoeRack'
              ? `${leafLabel} Ayakkabı Rafı #${k + 1}`
              : `${leafLabel} Raf #${k + 1}`,
          runId: run.id,
          bayId: bay.id,
          cellId: subId,
          role: 'shelf',
          shapeKind: 'box',
          cutWidthMm: bounds.widthMm,
          cutHeightMm: shelfDepth,
          cutThicknessMm: t,
          ...shelfWorld,
          grainAxis: 'horizontal',
          materialSlot: 'shelf',
        });

        if (cellLedActive && (design.ledLighting?.shelfUnder ?? true)) {
          const stripW = Math.max(40, bounds.widthMm - 24);
          const stripZ = bounds.z0Mm + Math.round(shelfDepth * 0.72);
          const stripMapped = mapRunBoxToWorld(
            run,
            [bounds.x0Mm + Math.round(bounds.widthMm / 2), cursorY - 2, stripZ],
            [stripW, 4, 10]
          );
          ledStrips.push({
            id: `${node.id}-shelf-led-${k + 1}`,
            runId: run.id,
            bayId: bay.id,
            cellId: subId,
            kind: 'shelfUnder',
            worldPositionMm: stripMapped.worldPositionMm,
            boxSizeMm: stripMapped.boxSizeMm,
            rotationYRad: stripMapped.rotationYRad,
            colorHex: ledColorHex,
            intensity: ledIntensity,
            coveringDoorIds: subCoveringDoors,
          });
        }

        cursorY += t;
      }
    }
    return;
  }

  // Çift Kat Askı (doubleHanging) — Alt ve Üst Askılık Alanlarını 2 bağımsız seçilebilir hacim olarak üret
  if (insert?.type === 'doubleHanging') {
    const hangDist = distributeIntegerMm(
      bounds.heightMm,
      [
        { id: `${node.id}-low`, size: { kind: 'flex' as const, weight: 1 } },
        { id: `${node.id}-high`, size: { kind: 'flex' as const, weight: 1 } },
      ],
      t
    );
    const lowH = hangDist[0]?.resolvedMm ?? Math.floor((bounds.heightMm - t) / 2);
    const highH = hangDist[1]?.resolvedMm ?? bounds.heightMm - t - lowH;
    const lowY0 = bounds.y0Mm;
    const lowY1 = lowY0 + lowH;
    const midShelfCenterY = lowY1 + t / 2;
    const highY0 = lowY1 + t;
    const highY1 = bounds.y0Mm + bounds.heightMm;

    const lowWorld = mapRunBoxToWorld(
      run,
      [
        bounds.x0Mm + Math.round(bounds.widthMm / 2),
        lowY0 + Math.round(lowH / 2),
        bounds.z0Mm + Math.round(bounds.depthMm / 2),
      ],
      [bounds.widthMm, lowH, bounds.depthMm]
    );
    const highWorld = mapRunBoxToWorld(
      run,
      [
        bounds.x0Mm + Math.round(bounds.widthMm / 2),
        highY0 + Math.round(highH / 2),
        bounds.z0Mm + Math.round(bounds.depthMm / 2),
      ],
      [bounds.widthMm, highH, bounds.depthMm]
    );

    const lowCoveringDoors = getCoveringDoorsForSlice(lowY0, lowY1);
    const highCoveringDoors = getCoveringDoorsForSlice(highY0, highY1);

    cells.push({
      id: `${node.id}::sub-0`,
      sourceLeafId: node.id,
      subIntervalIndex: 0,
      subIntervalCount: 2,
      subIntervalKind: 'doubleHangInterval',
      ...parentMeta,
      bayId: bay.id,
      runId: run.id,
      wallAxis: run.wallAxis,
      label: `${leafLabel} — Alt Askı Alanı`,
      path: `${pathPrefix} > Alt Askı Alanı`,
      owner: leafOwner,
      isLeaf: true,
      insert: node.insert,
      coveringDoorIds: lowCoveringDoors,
      netWidthMm: bounds.widthMm,
      netHeightMm: lowH,
      netDepthMm: bounds.depthMm,
      yStartMm: lowY0,
      yEndMm: lowY1,
      worldCenterMm: lowWorld.worldPositionMm,
      worldSizeMm: lowWorld.boxSizeMm,
      rotationYRad: lowWorld.rotationYRad,
    });

    cells.push({
      id: `${node.id}::sub-1`,
      sourceLeafId: node.id,
      subIntervalIndex: 1,
      subIntervalCount: 2,
      subIntervalKind: 'doubleHangInterval',
      ...parentMeta,
      bayId: bay.id,
      runId: run.id,
      wallAxis: run.wallAxis,
      label: `${leafLabel} — Üst Askı Alanı`,
      path: `${pathPrefix} > Üst Askı Alanı`,
      owner: leafOwner,
      isLeaf: true,
      insert: node.insert,
      coveringDoorIds: highCoveringDoors,
      netWidthMm: bounds.widthMm,
      netHeightMm: highH,
      netDepthMm: bounds.depthMm,
      yStartMm: highY0,
      yEndMm: highY1,
      worldCenterMm: highWorld.worldPositionMm,
      worldSizeMm: highWorld.boxSizeMm,
      rotationYRad: highWorld.rotationYRad,
    });

    if (bounds.heightMm < 1700) {
      issues.push({
        id: `${node.id}-double-hang-short`,
        severity: 'warning',
        code: 'DOUBLE_HANGING_HEIGHT_LOW',
        title: `Çift Kat Askı Yüksekliği Düşük (${bounds.heightMm} mm)`,
        description: `${leafLabel} içinde çift kat askının üst ve alt gömleklerinin sıkışmaması için en az 1750–1900 mm net yükseklik önerilir.`,
        targetId: node.id,
      });
    }

    const midShelf = mapRunBoxToWorld(
      run,
      [
        bounds.x0Mm + Math.round(bounds.widthMm / 2),
        midShelfCenterY,
        bounds.z0Mm + Math.round(shelfDepth / 2),
      ],
      [bounds.widthMm, t, shelfDepth]
    );
    panels.push({
      id: `${node.id}-double-mid-shelf`,
      label: `${leafLabel} Çift Askı Ara Rafı`,
      runId: run.id,
      bayId: bay.id,
      cellId: `${node.id}::sub-0`,
      role: 'shelf',
      shapeKind: 'box',
      cutWidthMm: bounds.widthMm,
      cutHeightMm: shelfDepth,
      cutThicknessMm: t,
      ...midShelf,
      grainAxis: 'horizontal',
      materialSlot: 'shelf',
    });

    const rod1Y = highY1 - 65;
    const rod2Y = lowY1 - 65;
    const rodZ = bounds.z0Mm + Math.round(bounds.depthMm * 0.52);

    for (const [idx, rY] of [rod1Y, rod2Y].entries()) {
      const worldRod = mapRunBoxToWorld(
        run,
        [bounds.x0Mm + Math.round(bounds.widthMm / 2), rY, rodZ],
        [bounds.widthMm, 28, 28]
      );
      panels.push({
        id: `${node.id}-rod-${idx + 1}`,
        label: `${leafLabel} Askı Borusu #${idx + 1}`,
        runId: run.id,
        bayId: bay.id,
        cellId: idx === 0 ? `${node.id}::sub-1` : `${node.id}::sub-0`,
        role: 'hangingRod',
        shapeKind: 'cylinderRod',
        cutWidthMm: bounds.widthMm,
        cutHeightMm: 28,
        cutThicknessMm: 28,
        ...worldRod,
        grainAxis: 'horizontal',
        materialSlot: 'metal',
      });

      if (cellLedActive && (design.ledLighting?.hangingRod ?? true)) {
        const rodLedMapped = mapRunBoxToWorld(
          run,
          [bounds.x0Mm + Math.round(bounds.widthMm / 2), rY - 14, rodZ],
          [Math.max(40, bounds.widthMm - 18), 4, 8]
        );
        ledStrips.push({
          id: `${node.id}-rod-led-${idx + 1}`,
          runId: run.id,
          bayId: bay.id,
          cellId: idx === 0 ? `${node.id}::sub-1` : `${node.id}::sub-0`,
          kind: 'hangingRod',
          worldPositionMm: rodLedMapped.worldPositionMm,
          boxSizeMm: rodLedMapped.boxSizeMm,
          rotationYRad: rodLedMapped.rotationYRad,
          colorHex: ledColorHex,
          intensity: ledIntensity,
          coveringDoorIds: idx === 0 ? highCoveringDoors : lowCoveringDoors,
        });
      }
    }
    return;
  }

  const leafCoveringDoors = getCoveringDoorsForSlice(bounds.y0Mm, bounds.y0Mm + bounds.heightMm);

  // Tekil İç Hacme Sahip Yaprak Hücreler (empty, hangingRod, serviceNiche, drawerBank, tek bölmeli beddingYukluk)
  cells.push({
    id: node.id,
    sourceLeafId: node.id,
    ...parentMeta,
    bayId: bay.id,
    runId: run.id,
    wallAxis: run.wallAxis,
    label: leafLabel,
    path: pathPrefix,
    owner: leafOwner,
    isLeaf: true,
    insert: node.insert,
    coveringDoorIds: leafCoveringDoors,
    netWidthMm: bounds.widthMm,
    netHeightMm: bounds.heightMm,
    netDepthMm: bounds.depthMm,
    yStartMm: bounds.y0Mm,
    yEndMm: bounds.y0Mm + bounds.heightMm,
    worldCenterMm: worldCell.worldPositionMm,
    worldSizeMm: worldCell.boxSizeMm,
    rotationYRad: worldCell.rotationYRad,
  });

  if (!insert || insert.type === 'empty') return;

  if (insert.type === 'hangingRod') {
    const rodY = bounds.y0Mm + Math.min(bounds.heightMm - 35, Math.max(35, insert.rodHeightMm ?? bounds.heightMm - 70));
    const rodZ = bounds.z0Mm + Math.round(bounds.depthMm * 0.52);
    const profile = hangingProfile(insert);
    const usableDrop = rodY - bounds.y0Mm - validationConfig.hangingBottomClearanceMm;
    if (usableDrop < profile.heightMm) {
      issues.push({
        id: `${node.id}-garment-drop`, code: 'GARMENT_DROP_TOO_SHORT', severity: 'warning',
        title: 'Boru altında kıyafet yüksekliği yetersiz',
        description: `${profile.label} için ${profile.heightMm} mm, boru altında ${Math.max(0, usableDrop)} mm kullanılabilir yükseklik var.`,
        targetId: node.id,
      });
    }
    const worldRod = mapRunBoxToWorld(
      run,
      [bounds.x0Mm + Math.round(bounds.widthMm / 2), rodY, rodZ],
      [bounds.widthMm, 28, 28]
    );
    panels.push({
      id: `${node.id}-rod-1`,
      label: `${leafLabel} Askı Borusu`,
      runId: run.id,
      bayId: bay.id,
      cellId: node.id,
      role: 'hangingRod',
      shapeKind: 'cylinderRod',
      cutWidthMm: bounds.widthMm,
      cutHeightMm: 28,
      cutThicknessMm: 28,
      ...worldRod,
      grainAxis: 'horizontal',
      materialSlot: 'metal',
    });

    if (insert.storageTemplate === 'trouserRack') {
      const slots = Math.max(1, Math.floor((bounds.widthMm - 40) / 55));
      for (let i=0;i<slots;i++) {
        const rodDepth=Math.max(100,bounds.depthMm-60);
        const mapped=mapRunBoxToWorld(run,[bounds.x0Mm+20+i*55,rodY-22,bounds.z0Mm+30+Math.round(rodDepth/2)],[12,12,rodDepth]);
        panels.push({id:`${node.id}-trouser-rod-${i}`,label:`Pantolon çubuğu ${i+1}`,runId:run.id,bayId:bay.id,cellId:node.id,
          role:'hangingRod',shapeKind:'cylinderRod',cutWidthMm:rodDepth,cutHeightMm:12,cutThicknessMm:12,...mapped,grainAxis:'horizontal',materialSlot:'metal'});
      }
    }

    if (cellLedActive && (design.ledLighting?.hangingRod ?? true)) {
      const rodLedMapped = mapRunBoxToWorld(
        run,
        [bounds.x0Mm + Math.round(bounds.widthMm / 2), rodY - 14, rodZ],
        [Math.max(40, bounds.widthMm - 18), 4, 8]
      );
      ledStrips.push({
        id: `${node.id}-rod-led-1`,
        runId: run.id,
        bayId: bay.id,
        cellId: node.id,
        kind: 'hangingRod',
        worldPositionMm: rodLedMapped.worldPositionMm,
        boxSizeMm: rodLedMapped.boxSizeMm,
        rotationYRad: rodLedMapped.rotationYRad,
        colorHex: ledColorHex,
        intensity: ledIntensity,
        coveringDoorIds: leafCoveringDoors,
      });
    }


    if (bounds.depthMm < validationConfig.hangingDepthMm) {
      issues.push({
        id: `${node.id}-shallow-hang`,
        severity: 'warning',
        code: 'SHALLOW_HANGING_DEPTH',
        title: `Dar Askı Derinliği (${bounds.depthMm} mm net)`,
        description: `${leafLabel} net derinliği ${validationConfig.hangingDepthMm} mm'nin altında. Standart yetişkin askılarında kıyafet omuzları kapağa sürtebilir.`,
        targetId: node.id,
      });
    }
  } else if (insert.type === 'drawerBank') {
    const count = Math.max(1, insert.drawerCount ?? 3);
    const gapMm = 4;
    if (bounds.heightMm < count * 80 + (count-1)*gapMm) throw new DistributionError(`${leafLabel}: ${count} çekmece için en az ${count*80+(count-1)*gapMm} mm net yükseklik gerekir.`);
    const defaultEachFrontH = Math.max(
      80,
      Math.floor((bounds.heightMm - (count - 1) * gapMm) / count)
    );
    const hasCustomDrawerHeights =
      Array.isArray(insert.drawerFrontHeightsMm) && insert.drawerFrontHeightsMm.length > 0;
    const drawerDist = hasCustomDrawerHeights
      ? distributeIntegerMm(
          bounds.heightMm,
          Array.from({ length: count }, (_, idx) => {
            const customH = insert.drawerFrontHeightsMm?.[idx];
            return {
              id: `${node.id}-drw-${idx}`,
              size:
                typeof customH === 'number' && customH >= 60
                  ? { kind: 'fixed' as const, mm: Math.round(customH) }
                  : { kind: 'flex' as const, weight: 1 },
            };
          }),
          gapMm
        )
      : null;

    // Bu çekmece grubunun önünde menteşeli kapak var mı?
    const overlappingDoors = allDoors.filter(
      (d) =>
        bayDoorIds.includes(d.id) &&
        d.yStartMm < bounds.y0Mm + bounds.heightMm - 5 &&
        d.yEndMm > bounds.y0Mm + 5
    );
    const isCoveredBySliding = design.fronts.some(f => {
      if (f.type !== 'sliding' || f.runId !== run.id || !f.bayIds.includes(bay.id)) return false;
      const { start, end } = frontVerticalRange(run, f);
      return start < bounds.y0Mm + bounds.heightMm - 5 && end > bounds.y0Mm + 5;
    })
      || (bay.frontMode==='sliding'&&!design.fronts.some(f=>f.bayIds.includes(bay.id)));
    const isCoveredByDoor = Boolean(insert.isInternalDrawer) || overlappingDoors.length > 0 || isCoveredBySliding;
    const coveringDoorIds = overlappingDoors.map((d) => d.id);

    // Menteşeli kapak arkasındaki iç çekmece, 110° standart menteşeyle çakışır mı?
    if (isCoveredByDoor && coveringDoorIds.length > 0 && bayHingeAngle === 110) {
      issues.push({
        id: `${node.id}-internal-drawer-hinge-conflict`,
        severity: 'warning',
        code: 'INTERNAL_DRAWER_HINGE_CONFLICT',
        title: `İç Çekmece – Menteşe Çakışma Riski (${leafLabel})`,
        description: `${leafLabel} önünde 110° standart menteşeli kapak bulunuyor. Çekmecenin kapağa çarpmadan çıkabilmesi için 25 mm iç çıta veya bölme kapak ayarından 155° Sıfır Çıkıntılı Menteşe seçilmesi önerilir.`,
        targetId: node.id,
      });
    }

    const drawerDepth = isCoveredByDoor
      ? Math.max(150, bounds.depthMm - 42)
      : Math.max(150, bounds.depthMm);

    const slideRatio = insert.drawerSlide === 'full' ? 1 : insert.drawerSlide === 'partial' ? 0.8 : 0.82;
    const maxSlideMm = Math.round(drawerDepth * slideRatio);
    const slideDirectionWorld: [number, number, number] =
      run.wallAxis === 'B' ? [1, 0, 0] : [0, 0, 1];

    const effectiveDrawerHandle: HandleConfig = insert.handleConfig ?? defaultDrawerHandle;
    const effectiveDrawerFrontMat: MaterialId | undefined =
      insert.frontMaterialId ??
      insert.drawerFrontMaterialId ??
      design.materials.drawerFrontMaterialId;

    let cursorDrawerY = bounds.y0Mm;
    for (let d = 0; d < count; d++) {
      const eachFrontH = drawerDist
        ? Math.max(60, drawerDist[d]?.resolvedMm ?? defaultEachFrontH)
        : defaultEachFrontH;
      const yBottom = cursorDrawerY;
      const yCenter = yBottom + eachFrontH / 2;
      const drawerUnitId = `drawer-${node.id}-${d + 1}`;
      cursorDrawerY += eachFrontH + gapMm;

      // Dış çekmece ise ön yüzü gövde önünde (kapak hizasında), iç çekmece ise içeride durur
      const frontLocalZ = isCoveredByDoor
        ? bounds.z0Mm + drawerDepth - t / 2
        : bounds.z0Mm + bounds.depthMm + t / 2 + 1;

      const frontWorld = mapRunBoxToWorld(
        run,
        [bounds.x0Mm + bounds.widthMm / 2, yCenter, frontLocalZ],
        [bounds.widthMm - 6, eachFrontH, t]
      );

      const boxOuterW = Math.max(120, bounds.widthMm - 24);
      const boxH = Math.max(50, eachFrontH - 34);
      const boxDepth = Math.max(120, drawerDepth - t);
      const sideT = Math.round(defaultPanelThicknessMm);
      const bottomT = Math.round(defaultBackPanelThicknessMm);

      const innerWidthMm = boxOuterW - 2 * sideT;
      const innerDepthMm = boxDepth - sideT;
      const innerHeightMm = boxH - bottomT;
      if (innerHeightMm < validationConfig.drawerClearHeightWarningMm) {
        issues.push({
          id: drawerUnitId + '-clear-height', code: 'DRAWER_CLEAR_HEIGHT_LOW', severity: 'warning',
          title: 'Çekmece net yüksekliği düşük', targetId: drawerUnitId,
          description: `${boxH} mm yan kasa ve ${bottomT} mm tabanla net yükseklik ${innerHeightMm} mm.`,
        });
      }

      const boxCenterX = bounds.x0Mm + bounds.widthMm / 2;
      const boxCenterY = yBottom + boxH / 2 + 8;
      // Kasa ön ucu çekmece ön kapağının (frontLocalZ - t/2) hemen arkasına birleşir
      const boxFrontZ = frontLocalZ - t / 2;
      const boxBackZ = boxFrontZ - boxDepth;
      const boxCenterZ = boxBackZ + boxDepth / 2;

      const boxWorld = mapRunBoxToWorld(
        run,
        [boxCenterX, boxCenterY, boxCenterZ],
        [boxOuterW, boxH, boxDepth]
      );

      // 1) Sol Yan Panel
      const leftSideWorld = mapRunBoxToWorld(
        run,
        [boxCenterX - boxOuterW / 2 + sideT / 2, boxCenterY, boxCenterZ],
        [sideT, boxH, boxDepth]
      );

      // 2) Sağ Yan Panel
      const rightSideWorld = mapRunBoxToWorld(
        run,
        [boxCenterX + boxOuterW / 2 - sideT / 2, boxCenterY, boxCenterZ],
        [sideT, boxH, boxDepth]
      );

      // 3) Arka Panel (Sol ve sağ yan panellerin arasında)
      const backPanelWorld = mapRunBoxToWorld(
        run,
        [boxCenterX, boxCenterY, boxBackZ + sideT / 2],
        [innerWidthMm, boxH, sideT]
      );

      // 4) Alt Taban Paneli (Üstü açık boş iç hacmin tabanı)
      const bottomPanelWorld = mapRunBoxToWorld(
        run,
        [
          boxCenterX,
          yBottom + 8 + bottomT / 2,
          boxBackZ + sideT + innerDepthMm / 2,
        ],
        [innerWidthMm, bottomT, innerDepthMm]
      );

      const handleLen =
        effectiveDrawerHandle.lengthMm > 0
          ? Math.min(bounds.widthMm - 40, effectiveDrawerHandle.lengthMm)
          : Math.min(200, Math.max(96, Math.round(bounds.widthMm * 0.32)));

      let handleCenterY = yCenter;
      if (
        effectiveDrawerHandle.placement === 'top' ||
        effectiveDrawerHandle.styleId === 'edgeLip' ||
        effectiveDrawerHandle.styleId === 'recessedJ'
      ) {
        handleCenterY = yBottom + eachFrontH - 12;
      } else if (effectiveDrawerHandle.placement === 'bottom') {
        handleCenterY = yBottom + 24;
      }
      handleCenterY += Math.round(effectiveDrawerHandle.verticalOffsetMm ?? 0);

      const handleWorld = mapRunBoxToWorld(
        run,
        [
          bounds.x0Mm + Math.round(bounds.widthMm / 2),
          handleCenterY,
          frontLocalZ + Math.round(t / 2) + 12,
        ],
        [handleLen, 14, 22]
      );

      const organizerPanels: ResolvedPanel[]=[];
      let organizerSlots: ResolvedDrawerUnit['organizerSlots'];
      const jewelry = insert.storageTemplate === 'jewelryDrawer';
      if (jewelry && (innerWidthMm < 3 * bottomT + 4 || innerDepthMm < 2 * bottomT + 3)) {
        issues.push({
          id: `${drawerUnitId}-organizer-fit`, code: 'DRAWER_ORGANIZER_FIT', severity: 'error',
          title: 'Takı bölücüleri çekmeceye sığmıyor',
          description: `${leafLabel} iç ölçüsü ${bottomT} mm kalınlıklı 4 × 3 düzeni için yetersiz.`,
          targetId: node.id,
        });
      } else if (jewelry) {
        const organizerH = Math.min(70, innerHeightMm);
        const gaps = (span: number, count: number) => distributeIntegerMm(
          span,
          Array.from({ length: count }, (_, index) => ({
            id: String(index), size: { kind: 'flex', weight: 1, minMm: 1 },
          })),
          bottomT
        );
        const columns = gaps(innerWidthMm, 4);
        const rows = gaps(innerDepthMm, 3);
        organizerSlots = {
          columnWidthsMm: columns.map(column => column.resolvedMm),
          rowDepthsMm: rows.map(row => row.resolvedMm),
          heightMm: organizerH,
        };
        const centerY = yBottom + 8 + bottomT + organizerH / 2;
        const innerBack = boxBackZ + sideT;
        const addDivider = (
          suffix: string, label: string, x: number, z: number, width: number, alongDepth: boolean
        ) => {
          const size: [number, number, number] = alongDepth
            ? [bottomT, organizerH, width] : [width, organizerH, bottomT];
          organizerPanels.push({
            id: `${drawerUnitId}-organizer-${suffix}`, label, runId: run.id, bayId: bay.id, cellId: node.id,
            role: 'drawerBox', shapeKind: 'box',
            cutWidthMm: width, cutHeightMm: organizerH, cutThicknessMm: bottomT,
            ...mapRunBoxToWorld(run, [x, centerY, z], size),
            grainAxis: 'horizontal', materialSlot: 'carcass', animatedUnitId: drawerUnitId,
          });
        };
        let left = boxCenterX - innerWidthMm / 2;
        for (const [col, { resolvedMm: width }] of columns.entries()) {
          if (col < columns.length - 1) {
            addDivider(`col-${col + 1}`, `Takı çekmecesi ara bölücüsü ${col + 1}`,
              left + width + bottomT / 2, innerBack + innerDepthMm / 2, innerDepthMm, true);
          }
          let back = innerBack;
          for (const [row, { resolvedMm: depth }] of rows.slice(0, -1).entries()) {
            addDivider(`row-${row + 1}-${col}`, 'Takı çekmecesi enine bölücü',
              left + width / 2, back + depth + bottomT / 2, width, false);
            back += depth + bottomT;
          }
          left += width + bottomT;
        }
      }
      panels.push(...organizerPanels);
      drawers.push({
        id: drawerUnitId,
        label: `${leafLabel} #${d + 1}`,
        cellId: node.id,
        bayId: bay.id,
        runId: run.id,
        wallAxis: run.wallAxis,
        rotationYRad: frontWorld.rotationYRad,
        drawerIndex: d,
        totalDrawersInBank: count,
        parentBankHeightMm: bounds.heightMm,
        isInternalDrawer: isCoveredByDoor,
        coveringDoorIds,
        widthMm: bounds.widthMm - 6,
        heightMm: eachFrontH,
        depthMm: drawerDepth,
        innerWidthMm,
        innerDepthMm,
        innerHeightMm,
        sideThicknessMm: sideT,
        bottomThicknessMm: bottomT,
        yStartMm: yBottom,
        yEndMm: yBottom + eachFrontH,
        maxSlideMm,
        slideRatio,
        slideDirectionWorld,
        frontWorldPositionMm: frontWorld.worldPositionMm,
        frontBoxSizeMm: frontWorld.boxSizeMm,
        boxWorldPositionMm: boxWorld.worldPositionMm,
        boxSizeMm: boxWorld.boxSizeMm,
        leftSideWorldPositionMm: leftSideWorld.worldPositionMm,
        leftSideBoxSizeMm: leftSideWorld.boxSizeMm,
        rightSideWorldPositionMm: rightSideWorld.worldPositionMm,
        rightSideBoxSizeMm: rightSideWorld.boxSizeMm,
        backPanelWorldPositionMm: backPanelWorld.worldPositionMm,
        backPanelBoxSizeMm: backPanelWorld.boxSizeMm,
        bottomPanelWorldPositionMm: bottomPanelWorld.worldPositionMm,
        bottomPanelBoxSizeMm: bottomPanelWorld.boxSizeMm,
        handleWorldPositionMm: handleWorld.worldPositionMm,
        handleBoxSizeMm: handleWorld.boxSizeMm,
        frontMaterialId: effectiveDrawerFrontMat,
        handleConfig: effectiveDrawerHandle,
        organizerPanels,
        organizerSlots,
      });

      panels.push({
        id: `${node.id}-drawer-front-${d + 1}`,
        label: `${leafLabel} Çekmece Önü #${d + 1}`,
        runId: run.id,
        bayId: bay.id,
        cellId: node.id,
        role: 'drawerFront',
        shapeKind: 'box',
        cutWidthMm: bounds.widthMm - 6,
        cutHeightMm: eachFrontH,
        cutThicknessMm: t,
        ...frontWorld,
        grainAxis: 'horizontal',
        materialSlot: 'front',
        materialIdOverride: effectiveDrawerFrontMat,
        animatedUnitId: drawerUnitId,
      });

      panels.push({
        id: `${node.id}-drawer-box-${d + 1}`,
        label: `${leafLabel} Çekmece Kasası #${d + 1}`,
        runId: run.id,
        bayId: bay.id,
        cellId: node.id,
        role: 'drawerBox',
        shapeKind: 'box',
        cutWidthMm: bounds.widthMm - 24,
        cutHeightMm: boxDepth,
        cutThicknessMm: boxH,
        ...boxWorld,
        grainAxis: 'horizontal',
        materialSlot: 'carcass',
        animatedUnitId: drawerUnitId,
      });
    }
  } else if (insert.type === 'serviceNiche') {
    // Dar Dikey Servis Nişi — İnce Kenar Önde, Yan Dikmeye Paralel Dikey Yerleşim ve Kapak Açıklığından Çıkarılabilirlik Kontrolü
    const rawItems = insert.serviceItems ?? [];
    const placements = rawItems.map((it) => resolveServiceItemPlacement(it));
    const requiredHandClearanceMm = insert.handClearanceMm ?? 30;
    const totalItemsWidthMm = placements.reduce((sum, p) => sum + p.frontWidthMm, 0);
    const maxItemHeightMm = placements.reduce((max, p) => Math.max(max, p.verticalHeightMm), 0);
    const maxItemDepthMm = placements.reduce((max, p) => Math.max(max, p.intoDepthMm), 0);
    for (const [index, placement] of placements.entries()) {
      const item = rawItems[index];
      const lift = item.liftClearanceMm ?? 0;
      if (placement.verticalHeightMm <= bounds.heightMm && placement.verticalHeightMm + lift > bounds.heightMm) {
        issues.push({
          id: `${node.id}-niche-lift-${item.id}`, code: 'SERVICE_NICHE_LIFT_CLEARANCE', severity: 'error',
          title: 'Servis nişinde kaldırma payı yetersiz',
          description: `${item.name} için ${placement.verticalHeightMm} mm eşya yüksekliği ve ${lift} mm kaldırma payı, toplam ${placement.verticalHeightMm + lift} mm gerektirir. Net yükseklik ${bounds.heightMm} mm.`,
          targetId: node.id,
        });
      }
    }

    // Etkin açıklık = hücre net genişliği - menteşe çıkıntısı
    const effectiveClearWidthMm = bounds.widthMm - hingeProtrusionMm;
    const remainingHandClearanceMm = bounds.widthMm - totalItemsWidthMm;
    const remainingExtractionMm = effectiveClearWidthMm - totalItemsWidthMm;

    if (placements.length > 0 && remainingHandClearanceMm < requiredHandClearanceMm) {
      issues.push({
        id: `${node.id}-niche-clearance`,
        severity: remainingHandClearanceMm < 0 ? 'error' : 'warning',
        code: 'SERVICE_NICHE_CLEARANCE_LOW',
        title:
          remainingHandClearanceMm < 0
            ? `Servis Nişi Genişliği Yetersiz (${Math.abs(remainingHandClearanceMm)} mm Taşma)`
            : `Servis Nişi El Payı Yetersiz (${remainingHandClearanceMm} mm kaldı)`,
        description: `${leafLabel} içindeki eşyaların ince kenar toplam genişliği ${totalItemsWidthMm} mm, net hücre genişliği ${bounds.widthMm} mm. Eşyaları rahatça kavrayıp çıkarabilmek için en az ${requiredHandClearanceMm} mm el payı önerilir.`,
        targetId: node.id,
      });
    } else if (placements.length > 0 && remainingExtractionMm < 15 && hingeProtrusionMm > 0) {
      issues.push({
        id: `${node.id}-niche-hinge-extraction`,
        severity: 'warning',
        code: 'SERVICE_NICHE_DOOR_EXTRACTION_TIGHT',
        title: `Servis Nişi Menteşe Geçiş Payı Dar (${remainingExtractionMm} mm)`,
        description: `${leafLabel} genişliği (${bounds.widthMm} mm) eşyalar (${totalItemsWidthMm} mm) için uygun olsa da 110° menteşe çıkıntısı (${hingeProtrusionMm} mm) nedeniyle etkin çıkış açıklığı ${effectiveClearWidthMm} mm'ye düşüyor. Nişi genişletin veya 155° sıfır çıkıntılı menteşe seçin.`,
        targetId: node.id,
      });
    }

    if (maxItemHeightMm > bounds.heightMm) {
      issues.push({
        id: `${node.id}-niche-height`,
        severity: 'error',
        code: 'SERVICE_NICHE_HEIGHT_LOW',
        title: `Servis Nişi Yüksekliği Yetersiz (${bounds.heightMm} mm < ${maxItemHeightMm} mm)`,
        description: `${leafLabel} net yüksekliği (${bounds.heightMm} mm), dikey yerleştirilen eşya yüksekliğinden (${maxItemHeightMm} mm) küçük.`,
        targetId: node.id,
      });
    }

    if (maxItemDepthMm > bounds.depthMm) {
      issues.push({
        id: `${node.id}-niche-depth`,
        severity: 'error',
        code: 'SERVICE_NICHE_DEPTH_LOW',
        title: `Servis Nişi Derinliği Yetersiz (${bounds.depthMm} mm < ${maxItemDepthMm} mm)`,
        description: `${leafLabel} net derinliği (${bounds.depthMm} mm), yan yüzeye paralel yerleştirilen eşya derinliğinden (${maxItemDepthMm} mm) küçük.`,
        targetId: node.id,
      });
    }
  }
}
