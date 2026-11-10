import { runFrontMm } from '../schema/designConstraints';
import { INVENTORY_CATALOG } from '../analysis/inventory';
import { validationConfig } from './validationConfig';
import { FRONT_REAR_GAP_MM } from '../fronts/frontGeometry';
import type {
  Design,
  HandleConfig,
  Junction,
  MaterialId,
  Point2DMm,
  ResolvedCell,
  ResolvedCorner,
  ResolvedDoorLeaf,
  ResolvedLedStrip,
  ResolvedPanel,
  Run,
  ValidationIssue,
} from '../schema/types';
import { distributeIntegerMm } from './flexSolver';

export interface CornerSolveOutput {
  corner: ResolvedCorner;
  panels: ResolvedPanel[];
  doors: ResolvedDoorLeaf[];
  cells: ResolvedCell[];
  ledStrips: ResolvedLedStrip[];
  issues: ValidationIssue[];
}

const DEFAULT_CORNER_HANDLE: HandleConfig = {
  styleId: 'barModern',
  finishId: 'matteBlack',
  lengthMm: 220,
  placement: 'middle',
  orientation: 'vertical',
  offsetFromEdgeMm: 42,
  verticalOffsetMm: 0,
};

/**
 * L-Gardırop Köşe Çözümleyicisi (Kör Köşe ve Beşgen/Diyagonal Köşe).
 * Asimetrik kol derinliklerini (`runA.depthMm !== runB.depthMm`), malzeme kalınlıklarını (`t`, `tb`),
 * dış gövde bitişlerini, LED şeritlerini ve kulp ayarlarını doğal olarak destekler.
 */
export function solveCornerJunction(
  junction: Junction,
  runA: Run,
  runB: Run,
  design?: Design
): CornerSolveOutput {
  const depthA = runFrontMm(runA);
  const depthB = runFrontMm(runB);
  const t = Math.round(runA.panelThicknessMm);
  const tb = Math.round(runA.backPanelThicknessMm);
  const plinthH = Math.round(runA.plinthHeightMm);
  const topFillerH = Math.round(runA.topFillerHeightMm);
  const carcassH = Math.max(400, Math.round(runA.heightMm) - plinthH - topFillerH);

  const extFinish = design?.exteriorFinish;
  const topStyle = extFinish?.topStyle ?? 'flushCeiling';
  const baseStyle = extFinish?.baseStyle ?? 'recessedHiddenPlinth';
  const ledCfg = design?.ledLighting;

  const panels: ResolvedPanel[] = [];
  const doors: ResolvedDoorLeaf[] = [];
  const cells: ResolvedCell[] = [];
  const ledStrips: ResolvedLedStrip[] = [];
  const issues: ValidationIssue[] = [];

  if (junction.type === 'diagonal') {
    const armA = junction.diagonalArmAMm;
    const armB = junction.diagonalArmBMm;

    const polygonXZMm: Point2DMm[] = [
      { xMm: 0, zMm: 0 },
      { xMm: armA, zMm: 0 },
      { xMm: armA, zMm: depthA },
      { xMm: depthB, zMm: armB },
      { xMm: 0, zMm: armB },
    ];

    const innerPolygonXZMm: Point2DMm[] = [
      { xMm: tb, zMm: tb },
      { xMm: armA - t, zMm: tb },
      { xMm: armA - t, zMm: depthA },
      { xMm: depthB, zMm: armB - t },
      { xMm: tb, zMm: armB - t },
    ];

    const dx = armA - t - depthB;
    const dz = armB - t - depthA;
    const frontOpeningWidthMm = Math.round(Math.hypot(dx, dz));
    const frontAngleDeg = Math.round(((Math.atan2(dz, dx) * 180) / Math.PI) * 10) / 10;

    if (frontOpeningWidthMm < 380) {
      issues.push({
        id: `${junction.id}-narrow-diagonal-opening`,
        severity: 'warning',
        code: 'DIAGONAL_CORNER_OPENING_NARROW',
        title: `Beşgen Köşe Kapak Açıklığı Dar (${frontOpeningWidthMm} mm)`,
        description: `Köşe kolları (${armA}×${armB} mm) komşu derinliklere (${depthA}/${depthB} mm) göre dar bir ön açıklık bırakıyor. Rahat erişim için ≥420 mm önerilir.`,
        targetId: junction.id,
      });
    }

    // 1. Sağ Yan Dikme (A koluyla birleşen yapısal yüzey)
    const sideADepth = Math.max(100, depthA - tb);
    panels.push({
      id: `${junction.id}-side-A`,
      label: 'Beşgen Köşe Sağ Yan Dikme (A Kolu)',
      runId: runA.id,
      role: 'cornerSidePanel',
      shapeKind: 'box',
      cutWidthMm: sideADepth,
      cutHeightMm: carcassH,
      cutThicknessMm: t,
      boxSizeMm: [t, carcassH, sideADepth],
      worldPositionMm: [
        armA - Math.round(t / 2),
        plinthH + Math.round(carcassH / 2),
        tb + Math.round(sideADepth / 2),
      ],
      rotationYRad: 0,
      grainAxis: 'vertical',
      materialSlot: 'carcass',
    });

    // 2. Sol Yan Dikme (B koluyla birleşen yapısal yüzey)
    const sideBDepth = Math.max(100, depthB - tb);
    panels.push({
      id: `${junction.id}-side-B`,
      label: 'Beşgen Köşe Sol Yan Dikme (B Kolu)',
      runId: runB.id,
      role: 'cornerSidePanel',
      shapeKind: 'box',
      cutWidthMm: sideBDepth,
      cutHeightMm: carcassH,
      cutThicknessMm: t,
      boxSizeMm: [sideBDepth, carcassH, t],
      worldPositionMm: [
        tb + Math.round(sideBDepth / 2),
        plinthH + Math.round(carcassH / 2),
        armB - Math.round(t / 2),
      ],
      rotationYRad: 0,
      grainAxis: 'vertical',
      materialSlot: 'carcass',
    });

    // 3. A Duvarı Arkalık
    const backAWidth = Math.max(100, armA - tb);
    panels.push({
      id: `${junction.id}-back-A`,
      label: 'Beşgen Köşe A Duvarı Arkalık',
      runId: runA.id,
      role: 'cornerBackPanel',
      shapeKind: 'box',
      cutWidthMm: backAWidth,
      cutHeightMm: carcassH,
      cutThicknessMm: tb,
      boxSizeMm: [backAWidth, carcassH, tb],
      worldPositionMm: [
        tb + Math.round(backAWidth / 2),
        plinthH + Math.round(carcassH / 2),
        Math.round(tb / 2),
      ],
      rotationYRad: 0,
      grainAxis: 'vertical',
      materialSlot: 'back',
    });

    // 4. B Duvarı Arkalık
    panels.push({
      id: `${junction.id}-back-B`,
      label: 'Beşgen Köşe B Duvarı Arkalık',
      runId: runB.id,
      role: 'cornerBackPanel',
      shapeKind: 'box',
      cutWidthMm: armB,
      cutHeightMm: carcassH,
      cutThicknessMm: tb,
      boxSizeMm: [tb, carcassH, armB],
      worldPositionMm: [
        Math.round(tb / 2),
        plinthH + Math.round(carcassH / 2),
        Math.round(armB / 2),
      ],
      rotationYRad: 0,
      grainAxis: 'vertical',
      materialSlot: 'back',
    });

    // 5. Beşgen Yapısal Alt Tabla, Üst Tabla, Ara Raflar ve Seçilebilir Köşe Raf Aralıkları
    const shelfCount = Math.max(0, junction.shelvesCount);
    const netInnerH = carcassH - 2 * t;
    const midFrontX = Math.round((armA - t + depthB) / 2);
    const midFrontZ = Math.round((depthA + (armB - t)) / 2);
    const closedRotationYRad = Math.atan2(dz, dx);
    const doorMode = junction.doorMode ?? 'left';
    const cornerDoorId = `door-corner-${junction.id}`;
    const cornerCoveringDoorIds = doorMode !== 'open' ? [cornerDoorId] : [];

    panels.push({
      id: `${junction.id}-bottom-pentagon`,
      label: 'Beşgen Köşe Alt Tabla',
      runId: runA.id,
      role: 'cornerPolygonShelf',
      shapeKind: 'extrudedPolygon',
      cutWidthMm: armA - t - tb,
      cutHeightMm: armB - t - tb,
      cutThicknessMm: t,
      boxSizeMm: [armA - t - tb, t, armB - t - tb],
      worldPositionMm: [0, plinthH, 0],
      rotationYRad: 0,
      polygonXZMm: innerPolygonXZMm,
      grainAxis: 'horizontal',
      materialSlot: 'carcass',
    });

    panels.push({
      id: `${junction.id}-top-pentagon`,
      label: 'Beşgen Köşe Üst Tabla',
      runId: runA.id,
      role: 'cornerPolygonShelf',
      shapeKind: 'extrudedPolygon',
      cutWidthMm: armA - t - tb,
      cutHeightMm: armB - t - tb,
      cutThicknessMm: t,
      boxSizeMm: [armA - t - tb, t, armB - t - tb],
      worldPositionMm: [0, plinthH + carcassH - t, 0],
      rotationYRad: 0,
      polygonXZMm: innerPolygonXZMm,
      grainAxis: 'horizontal',
      materialSlot: 'carcass',
    });

    const intervalCount = shelfCount + 1;
    const customHeights =
      junction.intervalHeightsMm && junction.intervalHeightsMm.length === intervalCount
        ? junction.intervalHeightsMm
        : null;
    const intervalDist = distributeIntegerMm(
      netInnerH,
      Array.from({ length: intervalCount }, (_, idx) => ({
        id: `${junction.id}-int-${idx}`,
        size: customHeights
          ? ({ kind: 'fixed' as const, mm: Math.max(60, Math.round(customHeights[idx])) })
          : ({ kind: 'flex' as const, weight: 1 }),
      })),
      t
    );

    // Beşgen köşe üst tavan LED şeridi
    const cornerLedHex =
      ledCfg?.colorTempId === 'warm2700K'
        ? '#ffd699'
        : ledCfg?.colorTempId === 'neutral4000K'
          ? '#fff6e8'
          : ledCfg?.colorTempId === 'cool5000K'
            ? '#f0f7ff'
            : '#ffe4b5';
    const cornerLedIntensity = ledCfg?.intensity ?? 0.85;

    if (ledCfg?.enabled && ledCfg.cornerModule) {
      ledStrips.push({
        id: `${junction.id}-led-top`,
        runId: runA.id,
        bayId: junction.id,
        kind: 'cornerPentagon',
        worldPositionMm: [
          Math.round(midFrontX * 0.85),
          plinthH + carcassH - t - 2,
          Math.round(midFrontZ * 0.85),
        ],
        boxSizeMm: [Math.max(160, frontOpeningWidthMm - 80), 4, 14],
        rotationYRad: closedRotationYRad,
        colorHex: cornerLedHex,
        intensity: cornerLedIntensity,
        coveringDoorIds: cornerCoveringDoorIds,
      });
    }

    let cursorY = plinthH + t;
    for (let k = 0; k < intervalCount; k++) {
      const intH = intervalDist[k]?.resolvedMm ?? Math.floor(netInnerH / intervalCount);
      const cellLabel =
        intervalCount > 1
          ? `Beşgen Köşe — ${k + 1}. Raf Aralığı`
          : 'Beşgen Köşe — İç Hacim';
      const cellId = `${junction.id}::corner-sub-${k}`;

      cells.push({
        id: cellId,
        cornerJunctionId: junction.id,
        subIntervalIndex: k,
        subIntervalCount: intervalCount,
        subIntervalKind: 'cornerInterval',
        bayId: junction.id,
        runId: runA.id,
        wallAxis: runA.wallAxis,
        label: cellLabel,
        path: `Beşgen Köşe > ${k + 1}. Raf Aralığı`,
        owner: junction.owner ?? 'ortak',
        isLeaf: true,
        insert: { type: 'empty' },
        coveringDoorIds: cornerCoveringDoorIds,
        accessOpeningWidthMm: frontOpeningWidthMm,
        polygonXZMm: innerPolygonXZMm,
        netWidthMm: frontOpeningWidthMm,
        netHeightMm: intH,
        netDepthMm: Math.max(armA - t - tb, armB - t - tb),
        yStartMm: cursorY,
        yEndMm: cursorY + intH,
        worldCenterMm: [midFrontX, cursorY + Math.round(intH / 2), midFrontZ],
        worldSizeMm: [frontOpeningWidthMm, intH, Math.min(depthA, depthB)],
        rotationYRad: closedRotationYRad,
      });

      cursorY += intH;

      if (k < shelfCount) {
        panels.push({
          id: `${junction.id}-shelf-pentagon-${k + 1}`,
          label: `Beşgen Köşe Rafı #${k + 1}`,
          runId: runA.id,
          role: 'cornerPolygonShelf',
          shapeKind: 'extrudedPolygon',
          cutWidthMm: armA - t - tb,
          cutHeightMm: armB - t - tb,
          cutThicknessMm: t,
          boxSizeMm: [armA - t - tb, t, armB - t - tb],
          worldPositionMm: [0, cursorY, 0],
          rotationYRad: 0,
          polygonXZMm: innerPolygonXZMm,
          grainAxis: 'horizontal',
          materialSlot: 'shelf',
        });

        if (ledCfg?.enabled && ledCfg.cornerModule && ledCfg.shelfUnder) {
          ledStrips.push({
            id: `${junction.id}-led-shelf-${k + 1}`,
            runId: runA.id,
            bayId: junction.id,
            cellId,
            kind: 'cornerPentagon',
            worldPositionMm: [
              Math.round(midFrontX * 0.85),
              cursorY - 2,
              Math.round(midFrontZ * 0.85),
            ],
            boxSizeMm: [Math.max(160, frontOpeningWidthMm - 90), 4, 12],
            rotationYRad: closedRotationYRad,
            colorHex: cornerLedHex,
            intensity: cornerLedIntensity,
            coveringDoorIds: cornerCoveringDoorIds,
          });
        }

        cursorY += t;
      }
    }

    if (junction.hasHangingRod) {
      const cell = cells.reduce((tallest, current) => current.netHeightMm > tallest.netHeightMm ? current : tallest);
      const profile = INVENTORY_CATALOG.shirts;
      const usableDepth = Math.min(INVENTORY_CATALOG.jackets.depthMm, armB - t - tb);
      const rodZ = tb + Math.floor(usableDepth / 2);
      const rightAt = (z: number) => z <= depthA
        ? armA - t
        : Math.floor(armA - t - dx * (z - depthA) / dz);
      const rodEndX = rightAt(rodZ + 14);
      const rodWidth = rodEndX - tb;
      const rodY = cell.yEndMm - 70;
      if (cell.netHeightMm < 100 || rodWidth <= 40 || usableDepth < 28) {
        issues.push({
          id: `${junction.id}-corner-rod-fit`, code: 'CORNER_ROD_FIT', severity: 'error',
          title: 'Köşe askı borusu aralığa sığmıyor',
          description: 'Raf sayısını azaltın veya köşe iç hacmini artırın.',
          targetId: cell.id,
        });
      } else {
        cell.insert = { type: 'hangingRod', rodHeightType: 'short', rodHeightMm: rodY - cell.yStartMm };
        cell.hangingZoneMm = { xMm: tb, zMm: tb, widthMm: rightAt(tb + usableDepth) - tb, depthMm: usableDepth };
        panels.push({
          id: `${junction.id}-corner-rod`, label: 'Köşe askı borusu', runId: runA.id, bayId: junction.id,
          cellId: cell.id, role: 'hangingRod', shapeKind: 'cylinderRod',
          cutWidthMm: rodWidth, cutHeightMm: 28, cutThicknessMm: 28,
          boxSizeMm: [rodWidth, 28, 28], worldPositionMm: [tb + rodWidth / 2, rodY, rodZ],
          rotationYRad: 0, grainAxis: 'horizontal', materialSlot: 'metal',
        });
        const drop = rodY - cell.yStartMm - validationConfig.hangingBottomClearanceMm;
        if (drop < profile.heightMm || usableDepth < validationConfig.hangingDepthMm
          || frontOpeningWidthMm < Math.min(profile.widthMm, profile.depthMm) + 30) {
          issues.push({
            id: `${junction.id}-corner-rod-clearance`, code: 'CORNER_HANGING_CLEARANCE', severity: 'warning',
            title: 'Köşe askı alanı veya giriş açıklığı dar',
            description: `Boru altı ${drop} mm, askı alanı derinliği ${usableDepth} mm, ön açıklık ${frontOpeningWidthMm} mm. Raf aralığını ve kıyafetin girişini kontrol edin.`,
            targetId: cell.id,
          });
        }
      }
    }

    // 6. Ön Baza / Ayak ve Üst Bitiş (Gömme / Klasik Taç / Ayaklı Uyumlu)
    if (plinthH > 0) {
      if (baseStyle === 'adjustableFeet') {
        const footRadius = 22;
        const footPositions: [number, number][] = [
          [depthB + 45, armB - t - 45],
          [armA - t - 45, depthA + 45],
          [120, 120],
        ];
        footPositions.forEach(([fx, fz], fIdx) => {
          panels.push({
            id: `${junction.id}-foot-${fIdx + 1}`,
            label: `Beşgen Köşe Ayak #${fIdx + 1}`,
            runId: runA.id,
            role: 'cabinetFoot',
            shapeKind: 'cylinderRod',
            cutWidthMm: footRadius * 2,
            cutHeightMm: plinthH,
            cutThicknessMm: footRadius * 2,
            boxSizeMm: [footRadius * 2, plinthH, footRadius * 2],
            worldPositionMm: [fx, Math.round(plinthH / 2), fz],
            rotationYRad: 0,
            grainAxis: 'vertical',
            materialSlot: 'metal',
            isDecorativeTrim: true,
          });
        });
      } else {
        const recessFactor = baseStyle === 'recessedHiddenPlinth' ? 0.94 : 0.98;
        panels.push({
          id: `${junction.id}-plinth`,
          label: 'Beşgen Köşe Ön Baza',
          runId: runA.id,
          role: 'plinth',
          shapeKind: 'box',
          cutWidthMm: frontOpeningWidthMm,
          cutHeightMm: plinthH,
          cutThicknessMm: t,
          boxSizeMm: [frontOpeningWidthMm, plinthH, t],
          worldPositionMm: [
            Math.round(midFrontX * recessFactor),
            Math.round(plinthH / 2),
            Math.round(midFrontZ * recessFactor),
          ],
          rotationYRad: closedRotationYRad,
          grainAxis: 'horizontal',
          materialSlot: 'carcass',
          isDecorativeTrim: true,
        });
      }
    }

    if (topFillerH > 0 && topStyle !== 'none') {
      const shadowGap =
        topStyle === 'flushCeiling'
          ? Math.min(Math.max(0, extFinish?.ceilingShadowGapMm ?? 15), topFillerH - 10)
          : 0;
      const effectiveFillerH = Math.max(10, topFillerH - shadowGap);

      panels.push({
        id: `${junction.id}-top-filler`,
        label:
          topStyle === 'classicCrown'
            ? 'Beşgen Köşe Üst Taç'
            : 'Beşgen Köşe Üst Bitiş Paneli',
        runId: runA.id,
        role: 'topFiller',
        shapeKind: 'box',
        cutWidthMm: frontOpeningWidthMm,
        cutHeightMm: effectiveFillerH,
        cutThicknessMm: t,
        boxSizeMm: [
          frontOpeningWidthMm,
          effectiveFillerH,
          topStyle === 'classicCrown' ? t + 18 : t,
        ],
        worldPositionMm: [
          midFrontX,
          plinthH + carcassH + Math.round(effectiveFillerH / 2),
          midFrontZ,
        ],
        rotationYRad: closedRotationYRad,
        grainAxis: 'horizontal',
        materialSlot: 'front',
        isDecorativeTrim: true,
      });
    }

    // 7. Beşgen Köşe Menteşeli Açılı Kapak (doorMode !== 'open' ise)
    if (doorMode !== 'open') {
      // Eğik ön yüzün kalınlığı, komşu kapalı kapak düzlemlerine doğru taşar.
      // Uç boşlukları bu normal izdüşümünü de karşılar; sabit 2 mm ile başlangıçta
      // üst üste binen iki kapak, sürekli çarpışma denetiminde hiç açılamazdı.
      const cosine=Math.cos(closedRotationYRad),sine=Math.sin(closedRotationYRad);
      const neighbourGap=t-Math.round(t/2)+2;
      const gapA=Math.max(2,Math.ceil(((t+1)*sine-neighbourGap)/Math.max(.01,cosine))+1);
      const gapB=Math.max(2,Math.ceil(((t+1)*cosine-neighbourGap)/Math.max(.01,sine))+1);
      const doorW = Math.floor(Math.hypot(dx, dz) - gapA - gapB);
      const doorH = carcassH - 4;
      const yCenter = plinthH + carcassH / 2;
      const isLeft = doorMode === 'left';

      const alongHinge = gapB + (isLeft ? 0 : doorW);
      // Özel açılı bağlantıda eksen arka kenar düzleminde modellenir.
      // Düz bindirme eksenini buraya taşımak farklı bir köşe montajı gerektirir.
      const pivotDepth = FRONT_REAR_GAP_MM;
      const pivotX = depthB + alongHinge * cosine + pivotDepth * sine;
      const pivotZ = armB - t - alongHinge * sine + pivotDepth * cosine;
      const centerOffsetX = isLeft ? doorW / 2 : -doorW / 2;
      const centerOffsetZ = t / 2;
      const doorId = cornerDoorId;

      const resolvedDoorMatId: MaterialId =
        junction.doorMaterialId ?? design?.materials.frontMaterialId ?? 'linenBeige';
      const resolvedHandle: HandleConfig =
        junction.handleConfig ?? design?.materials.doorHandleConfig ?? DEFAULT_CORNER_HANDLE;

      const edgeOffset = Math.max(24, Math.min(80, resolvedHandle.offsetFromEdgeMm ?? 42));
      const handleLen = Math.min(
        Math.max(36, resolvedHandle.lengthMm),
        Math.max(80, doorH - 120)
      );
      const placementYOffset =
        resolvedHandle.placement === 'top'
          ? Math.round(doorH * 0.32)
          : resolvedHandle.placement === 'bottom'
            ? -Math.round(doorH * 0.32)
            : (resolvedHandle.verticalOffsetMm ?? -Math.round(doorH * 0.05));

      doors.push({
        id: doorId,
        label: 'Beşgen Köşe Açılı Kapak',
        runId: runA.id,
        bayIds: [junction.id],
        isCornerDoor: true,
        hingeSide: isLeft ? 'left' : 'right',
        maxAngleDeg: 110,
        widthMm: doorW,
        heightMm: doorH,
        thicknessMm: t,
        yStartMm: plinthH+2,
        yEndMm: plinthH + carcassH-2,
        materialId: resolvedDoorMatId,
        handleConfig: resolvedHandle,
        pivotWorldMm: [pivotX, yCenter, pivotZ],
        closedRotationYRad,
        openRotationDirection: isLeft ? -1 : 1,
        leafCenterOffsetMm: [
          centerOffsetX,
          0,
          centerOffsetZ,
        ],
        handleOffsetMm: [
          isLeft ? doorW - edgeOffset : -(doorW - edgeOffset),
          placementYOffset,
          t + 14,
        ],
        handleLengthMm: handleLen,
        hingeProfile: 'diagonal-rear-axis',
        mounting: 'diagonal',
        clearanceMm: {
          spanStart: gapB,
          spanEnd: Math.hypot(dx, dz) - gapB - doorW,
          bottom: 2, top: 2,
        },
      });

      panels.push({
        id: `${doorId}-panel`,
        label: 'Beşgen Köşe Açılı Kapak Paneli',
        runId: runA.id,
        role: 'cornerAngledDoor',
        shapeKind: 'box',
        cutWidthMm: doorW,
        cutHeightMm: doorH,
        cutThicknessMm: t,
        boxSizeMm: [doorW, doorH, t],
        worldPositionMm: [pivotX+cosine*centerOffsetX+sine*centerOffsetZ,yCenter,pivotZ-sine*centerOffsetX+cosine*centerOffsetZ],
        rotationYRad: closedRotationYRad,
        grainAxis: 'vertical',
        materialSlot: 'front',
        materialIdOverride: resolvedDoorMatId,
        animatedUnitId: doorId,
      });
    }

    for(const panel of panels)panel.bayIds??=[junction.id];
    return {
      corner: {
        id: junction.id,
        type: 'diagonal',
        consumedRunAMm: armA,
        consumedRunBMm: armB,
        depthAMm: depthA,
        depthBMm: depthB,
        frontOpeningWidthMm,
        outerFrontSpanMm:Math.round(Math.hypot(armA-depthB,armB-depthA)),
        frontAngleDeg,
        polygonXZMm,
        innerPolygonXZMm,
      },
      panels,
      doors,
      cells,
      ledStrips,
      issues,
    };
  }

  // ==========================================================================
  // KÖR KÖŞE (BLIND CORNER)
  // ==========================================================================
  const fillerW = Math.round(junction.fillerWidthMm);
  const priorityIsA = junction.priorityRunId !== runB.id;

  if (junction.fillerWidthMm < validationConfig.blindFillerMinimumMm) {
    issues.push({
      id: `${junction.id}-blind-filler-narrow`,
        severity: 'error',
      code: 'BLIND_CORNER_FILLER_TOO_NARROW',
      title: `Kör Köşe Klapası Dar (${junction.fillerWidthMm} mm < ${validationConfig.blindFillerMinimumMm} mm)`,
      description: `L-köşede dik kesişen kapak ve çekmece kulplarının (yaklaşık 30–35 mm çıkıntı) birbirine çarpmaması için kör klapa genişliğinin en az 45–60 mm olması önerilir.`,
      targetId: junction.id,
    });
  }

  const consumedRunAMm = priorityIsA ? 0 : depthB + fillerW;
  const consumedRunBMm = priorityIsA ? depthA + fillerW : 0;

  panels.push({
    id: `${junction.id}-blind-filler-A`,
    label: 'L-Köşe Kör Klapa (A Kolu Yönü)',
    runId: runA.id,
    role: 'cornerFiller',
    shapeKind: 'box',
    cutWidthMm: fillerW,
    cutHeightMm: carcassH,
    cutThicknessMm: t,
    boxSizeMm: [fillerW, carcassH, t],
    worldPositionMm: [
      depthB + Math.round(fillerW / 2),
      plinthH + Math.round(carcassH / 2),
      depthA - Math.round(t / 2),
    ],
    rotationYRad: 0,
    grainAxis: 'vertical',
    materialSlot: 'front',
  });

  panels.push({
    id: `${junction.id}-blind-filler-B`,
    label: 'L-Köşe Kör Klapa (B Kolu Yönü)',
    runId: runB.id,
    role: 'cornerFiller',
    shapeKind: 'box',
    cutWidthMm: fillerW,
    cutHeightMm: carcassH,
    cutThicknessMm: t,
    boxSizeMm: [t, carcassH, fillerW],
    worldPositionMm: [
      depthB - Math.round(t / 2),
      plinthH + Math.round(carcassH / 2),
      depthA + Math.round(fillerW / 2),
    ],
    rotationYRad: 0,
    grainAxis: 'vertical',
    materialSlot: 'front',
  });

  const blindFootprint: Point2DMm[] = [
    { xMm: 0, zMm: 0 },
    { xMm: depthB + fillerW, zMm: 0 },
    { xMm: depthB + fillerW, zMm: depthA + fillerW },
    { xMm: 0, zMm: depthA + fillerW },
  ];

  return {
    corner: {
      id: junction.id,
      type: 'blind',
      consumedRunAMm,
      consumedRunBMm,
      depthAMm: depthA,
      depthBMm: depthB,
      frontOpeningWidthMm: fillerW,
      frontAngleDeg: 90,
      polygonXZMm: blindFootprint,
      innerPolygonXZMm: blindFootprint,
    },
    panels,
    doors,
    cells,
    ledStrips,
    issues,
  };
}
