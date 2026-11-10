import type { Design, ResolvedDoorLeaf, ResolvedModel, ResolvedPanel } from '../schema/types';
import { buildMotionScene, constrainMotion, hingedMotionPart, initialMotionConflicts, type MotionStop } from '../analysis/motionConstraints';
import { panelVolume, polygonBounds, rotateExact } from '../analysis/kinematics';
import { estimatedBoardMassKg, FRONT_REAR_GAP_MM, planningSingleLeafKg } from '../fronts/frontGeometry';

function oppositeHand(door: ResolvedDoorLeaf): ResolvedDoorLeaf {
  const side = door.hingeSide === 'left' ? 'right' : 'left';
  const x = door.leafCenterOffsetMm[0] * 2;
  const pivot = rotateExact({ xMm: x, zMm: 0 }, door.closedRotationYRad, {
    xMm: door.pivotWorldMm[0], zMm: door.pivotWorldMm[2],
  });
  return {
    ...door, hingeSide: side, openRotationDirection: side === 'left' ? -1 : 1,
    pivotWorldMm: [pivot.xMm, door.pivotWorldMm[1], pivot.zMm],
    leafCenterOffsetMm: [-door.leafCenterOffsetMm[0], 0, door.leafCenterOffsetMm[2]],
    handleOffsetMm: [-door.handleOffsetMm[0], door.handleOffsetMm[1], door.handleOffsetMm[2]],
  };
}

function supportAtHinge(door: ResolvedDoorLeaf, uprights: ResolvedPanel[]) {
  const rear = rotateExact({ xMm: 0, zMm: door.leafCenterOffsetMm[2] - door.thicknessMm / 2 - FRONT_REAR_GAP_MM }, door.closedRotationYRad, {
    xMm: door.pivotWorldMm[0], zMm: door.pivotWorldMm[2],
  });
  const reach = door.isCornerDoor
    ? Math.max(door.clearanceMm?.spanStart ?? 0, door.clearanceMm?.spanEnd ?? 0) + FRONT_REAR_GAP_MM
    : (door.clearanceMm?.spanStart ?? 0) + FRONT_REAR_GAP_MM;
  return uprights.find(panel => {
    const volume = panelVolume(panel);
    if (Math.min(volume.y1, door.yEndMm) - Math.max(volume.y0, door.yStartMm) < door.heightMm / 2) return false;
    const box = polygonBounds(volume.polygon);
    const dx = Math.max(box.minX - rear.xMm, 0, rear.xMm - box.maxX);
    const dz = Math.max(box.minZ - rear.zMm, 0, rear.zMm - box.maxZ);
    return Math.hypot(dx, dz) <= reach + 0.5;
  });
}

const safeDegrees = (stop: MotionStop, door: ResolvedDoorLeaf) =>
  stop.blocked ? Math.floor(stop.position * door.maxAngleDeg * 10) / 10 : door.maxAngleDeg;

/** Each design limit starts with all other leaves at home. Live movement still uses their current positions. */
export function planHingeOpenings(design: Design, model: ResolvedModel) {
  const scene = buildMotionScene(design, model);
  const uprights = model.panels.filter(panel => ['sidePanel', 'cornerSidePanel', 'verticalDivider'].includes(panel.role));
  const isAuto = (door: ResolvedDoorLeaf) => door.frontId
    ? design.fronts.find(front => front.id === door.frontId)?.hingeSide === 'auto'
    : model.bays.find(bay => bay.id === door.bayId)?.frontMode === 'auto';

  function alternativeAt(index: number, door: ResolvedDoorLeaf, currentAngle: number) {
    if (currentAngle >= door.maxAngleDeg || door.clearanceMm?.centerSeam !== undefined) return;
    const alternative = oppositeHand(door);
    if (!supportAtHinge(alternative, uprights)) return;
    const parts = scene.parts.slice();
    parts[index] = hingedMotionPart(alternative);
    const candidate = { ...scene, parts };
    const safeAngleDeg = safeDegrees(constrainMotion(candidate, {}, door.id, 1), door);
    if (safeAngleDeg <= currentAngle + 1) return;
    if (initialMotionConflicts(candidate).some(conflict => conflict.partId === door.id || conflict.otherId === door.id)) return;
    return { door: alternative, part: parts[index], safeAngleDeg };
  }

  model.doors.forEach((door, index) => {
    if (!isAuto(door)) return;
    const safe = safeDegrees(constrainMotion(scene, {}, door.id, 1), door);
    const alternate = alternativeAt(index, door, safe);
    if (alternate) {
      model.doors[index] = alternate.door;
      scene.parts[index] = alternate.part;
    }
  });

  const homeStops = new Map<string, MotionStop>();
  model.doors.forEach((door, index) => {
    const stop = constrainMotion(scene, {}, door.id, 1);
    homeStops.set(door.id, stop);
    const safeAngleDeg = safeDegrees(stop, door);
    const alternate = alternativeAt(index, door, safeAngleDeg);
    const support = supportAtHinge(door, uprights);
    door.hingeSupportPanelId = support?.id;
    door.mounting = !support ? 'needs-support'
      : door.isCornerDoor ? 'diagonal'
      : door.mounting === 'inset' ? 'inset'
      : (support.bayIds?.length ?? 0) > 1 ? 'shared-overlay' : 'overlay';
    door.opening = {
      safeAngleDeg, blockerId: stop.blockerId, blockerLabel: stop.blockerLabel,
      alternative: alternate && { side: alternate.door.hingeSide, safeAngleDeg: alternate.safeAngleDeg },
    };

    if (!support) model.issues.push({
      id: `${door.id}-support`, code: 'HINGE_SUPPORT_REVIEW', severity: 'expert',
      title: 'Menteşe kenarında taşıyıcı kontrolü',
      description: `${door.label}: planlanan eksenin arkasında uygun konumda dikme doğrulanamadı. Taşıyıcı kayıt veya farklı menteşe yönü usta ile belirlenmeli.`,
      targetId: door.id,
    });
    if (stop.blocked) model.issues.push({
      id: `${door.id}-opening`, code: 'HINGED_OPENING_LIMITED', severity: 'warning',
      title: `Kapak açılımı sınırlı · ${safeAngleDeg}° / ${door.maxAngleDeg}°`,
      description: `${door.label}, komşular kapalıyken ${stop.blockerLabel ?? 'diğer parça'} nedeniyle ${safeAngleDeg}° ile sınırlı.`,
      targetId: door.id,
      why: 'Kesintisiz hareket hesabı, planlama eksenini ve panel ile kulp hacimlerini kullanır. Açık komşular canlı sınırı değiştirebilir.',
      suggestions: alternate
        ? [`Diğer menteşe yönü bu modelde ${alternate.safeAngleDeg}° sağlıyor.`]
        : ['Cepheyi taşıyıcıya göre yeniden bölmeyi, komşu açıklığını veya sürgülü cepheyi değerlendirin.'],
    });
    const mass = estimatedBoardMassKg(door.widthMm, door.heightMm, door.thicknessMm, door.materialId ?? design.materials.frontMaterialId);
    if (mass !== null && mass > planningSingleLeafKg) model.issues.push({
      id: `${door.id}-mass`, code: 'HINGED_BOARD_MASS_REVIEW', severity: 'expert',
      title: `Kanat ağırlığı tahmini · ${mass.toFixed(1)} kg`,
      description: `${door.label}: 750 kg/m³ levha kabulüyle, kulp hariç. Menteşe adedi ve taşıma kapasitesi seçilen ürün ile doğrulanmalı.`,
      targetId: door.id,
    });
  });
  if (model.doors.length) model.issues.push({
    id: 'hinge-catalogue-review', code: 'HINGE_CATALOGUE_REVIEW', severity: 'expert',
    title: 'Menteşe ürünü ve montaj payı doğrulanmalı',
    description: 'Düz bindirmede dış kenar, açılı köşede arka kenar sabit planlama eksenidir. Gizli menteşenin bağlantı yörüngesi, kenar radyüsü, tas mesafesi, taşıma kapasitesi ve delikleri seçilen ürünle doğrulanır.',
  });
  return { ...scene, hingeHomeStops: homeStops };
}
