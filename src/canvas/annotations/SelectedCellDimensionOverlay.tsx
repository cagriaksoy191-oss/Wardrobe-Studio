import { Line } from '@react-three/drei';
import { SceneHtml as Html } from './SceneHtml';
import { AlertTriangle, Check, Pencil, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { ResizeAxis, ResizeDirection } from '../../core/schema/types';
import { analyzeSelectedCellsGroup } from '../../core/solver/treeMutator';
import { useWardrobeStore } from '../../store/useWardrobeStore';

const MM_TO_M = 0.001;

interface AxisLineSpec {
  axis: ResizeAxis;
  title: string;
  shortTag: string;
  valueMm: number;
  netDetailLabel?: string;
  color: string;
  badgeClass: string;
  startMm: [number, number, number];
  endMm: [number, number, number];
  defaultDirection: ResizeDirection;
  directionOptions: { value: ResizeDirection; label: string }[];
  minMm: number;
  maxMm: number;
}

export function SelectedCellDimensionOverlay() {
  const design = useWardrobeStore((s) => s.design);
  const resolved = useWardrobeStore((s) => s.resolved);
  const viewMode = useWardrobeStore((s) => s.viewMode);
  const selectedCellId = useWardrobeStore((s) => s.selectedCellId);
  const selectedCellIds = useWardrobeStore((s) => s.selectedCellIds);
  const selectedDrawerId = useWardrobeStore((s) => s.selectedDrawerId);
  const selectedDrawerIds = useWardrobeStore((s) => s.selectedDrawerIds);
  const doorEditorMode = useWardrobeStore((s) => s.doorEditorMode);
  const selectedDoorId = useWardrobeStore((s) => s.selectedDoorId);
  const selectedDoorIds = useWardrobeStore((s) => s.selectedDoorIds);
  const resizeDraft = useWardrobeStore((s) => s.resizeDraft);

  const startOrUpdateResizeDraft = useWardrobeStore((s) => s.startOrUpdateResizeDraft);
  const commitResizeDraft = useWardrobeStore((s) => s.commitResizeDraft);
  const updateSelectedDrawerHeight = useWardrobeStore((s) => s.updateSelectedDrawerHeight);
  const updateCornerParam = useWardrobeStore((s) => s.updateCornerParam);

  const [editingAxis, setEditingAxis] = useState<ResizeAxis | null>(null);
  const [draftVal, setDraftVal] = useState<string>('');
  const [direction, setDirection] = useState<ResizeDirection>('up');
  const inputRef = useRef<HTMLInputElement | null>(null);

  const activeDrawerIds =
    selectedDrawerIds.length > 0
      ? selectedDrawerIds
      : selectedDrawerId
        ? [selectedDrawerId]
        : [];

  const activeDoorIds =
    selectedDoorIds.length > 0
      ? selectedDoorIds
      : selectedDoorId
        ? [selectedDoorId]
        : [];

  const activeCellIds =
    selectedCellIds.length > 0
      ? selectedCellIds
      : selectedCellId
        ? [selectedCellId]
        : [];

  useEffect(() => {
    if (editingAxis && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingAxis]);

  useEffect(() => {
    setEditingAxis(null);
  }, [activeCellIds.join(','), activeDrawerIds.join(','), activeDoorIds.join(','), doorEditorMode]);

  // ---------------------------------------------------------------------------
  // 1. KAPAK DÜZENLEME MODUNDA SEÇİLİ KAPAK ÖLÇÜ ÇİZGİLERİ
  // ---------------------------------------------------------------------------
  if (doorEditorMode && activeDoorIds.length > 0) {
    const selectedDoor = resolved.doors.find((d) => d.id === activeDoorIds[0]);
    if (!selectedDoor) return null;

    const [hx, hy, hz] = selectedDoor.pivotWorldMm;
    const wMm = selectedDoor.widthMm;
    const hMm = selectedDoor.heightMm;
    const tMm = selectedDoor.thicknessMm;
    const isRunA = selectedDoor.runId !== 'run-B';
    const offsetSign = selectedDoor.hingeSide === 'left' ? 1 : -1;

    const centerX = isRunA ? hx + (offsetSign * wMm) / 2 : hx + 20;
    const centerZ = isRunA ? hz + 20 : hz + (offsetSign * wMm) / 2;
    const yBottom = hy - hMm / 2;
    const yTop = hy + hMm / 2;

    const xStart: [number, number, number] = isRunA
      ? [centerX - wMm / 2, yBottom + 16, centerZ]
      : [centerX, yBottom + 16, centerZ - wMm / 2];
    const xEnd: [number, number, number] = isRunA
      ? [centerX + wMm / 2, yBottom + 16, centerZ]
      : [centerX, yBottom + 16, centerZ + wMm / 2];

    const yStart: [number, number, number] = isRunA
      ? [centerX + wMm / 2 - 14, yBottom, centerZ]
      : [centerX, yBottom, centerZ + wMm / 2 - 14];
    const yEnd: [number, number, number] = isRunA
      ? [centerX + wMm / 2 - 14, yTop, centerZ]
      : [centerX, yTop, centerZ + wMm / 2 - 14];

    return (
      <group>
        <Line
          points={[
            [xStart[0] * MM_TO_M, xStart[1] * MM_TO_M, xStart[2] * MM_TO_M],
            [xEnd[0] * MM_TO_M, xEnd[1] * MM_TO_M, xEnd[2] * MM_TO_M],
          ]}
          color="#f59e0b"
          lineWidth={2.5}
        />
        <Html
          position={[
            ((xStart[0] + xEnd[0]) / 2) * MM_TO_M,
            ((xStart[1] + xEnd[1]) / 2) * MM_TO_M,
            ((xStart[2] + xEnd[2]) / 2) * MM_TO_M,
          ]}
          center
          zIndexRange={[30, 10]}
        >
          <div className="pointer-events-none rounded border border-amber-300 bg-amber-500 px-2 py-0.5 font-mono text-[10px] font-bold text-slate-950 shadow">
            Kapak X: {wMm} mm · Kalınlık: {tMm} mm
          </div>
        </Html>

        <Line
          points={[
            [yStart[0] * MM_TO_M, yStart[1] * MM_TO_M, yStart[2] * MM_TO_M],
            [yEnd[0] * MM_TO_M, yEnd[1] * MM_TO_M, yEnd[2] * MM_TO_M],
          ]}
          color="#38bdf8"
          lineWidth={2.5}
        />
        <Html
          position={[
            ((yStart[0] + yEnd[0]) / 2) * MM_TO_M,
            ((yStart[1] + yEnd[1]) / 2) * MM_TO_M,
            ((yStart[2] + yEnd[2]) / 2) * MM_TO_M,
          ]}
          center
          zIndexRange={[30, 10]}
        >
          <div className="pointer-events-none rounded border border-sky-300 bg-sky-500 px-2 py-0.5 font-mono text-[10px] font-bold text-slate-950 shadow">
            Kapak Y: {hMm} mm
          </div>
        </Html>
      </group>
    );
  }

  // ---------------------------------------------------------------------------
  // 2. SEÇİLİ ÇEKMECE(LER) X / Y / Z FİZİKSEL ÖLÇÜ ÇİZGİLERİ
  // ---------------------------------------------------------------------------
  if (activeDrawerIds.length > 0) {
    const selectedDrawers = activeDrawerIds
      .map((id) => resolved.drawers.find((d) => d.id === id))
      .filter((d): d is NonNullable<typeof d> => Boolean(d));

    if (selectedDrawers.length === 0) return null;

    const firstDrw = selectedDrawers[0];
    const isRunA = firstDrw.wallAxis === 'A';
    const minY = Math.min(...selectedDrawers.map((d) => d.yStartMm));
    const maxY = Math.max(...selectedDrawers.map((d) => d.yEndMm));
    const totalHMm = Math.round(maxY - minY);
    const wMm = firstDrw.widthMm;
    const dMm = firstDrw.depthMm;
    const [cx, , cz] = firstDrw.boxWorldPositionMm;
    const frontOffset = 30;

    let xStartMm: [number, number, number];
    let xEndMm: [number, number, number];
    let yStartMm: [number, number, number];
    let yEndMm: [number, number, number];
    let zStartMm: [number, number, number];
    let zEndMm: [number, number, number];

    if (isRunA) {
      const frontZ = cz + dMm / 2 + frontOffset;
      xStartMm = [cx - wMm / 2, minY + 10, frontZ];
      xEndMm = [cx + wMm / 2, minY + 10, frontZ];
      yStartMm = [cx + wMm / 2 - 12, minY, frontZ];
      yEndMm = [cx + wMm / 2 - 12, maxY, frontZ];
      zStartMm = [cx - wMm / 2 + 14, maxY - 10, cz - dMm / 2];
      zEndMm = [cx - wMm / 2 + 14, maxY - 10, cz + dMm / 2];
    } else {
      const frontX = cx + dMm / 2 + frontOffset;
      xStartMm = [frontX, minY + 10, cz - wMm / 2];
      xEndMm = [frontX, minY + 10, cz + wMm / 2];
      yStartMm = [frontX, minY, cz + wMm / 2 - 12];
      yEndMm = [frontX, maxY, cz + wMm / 2 - 12];
      zStartMm = [cx - dMm / 2, maxY - 10, cz - wMm / 2 + 14];
      zEndMm = [cx + dMm / 2, maxY - 10, cz - wMm / 2 + 14];
    }

    const drawerSpecs: AxisLineSpec[] = [
      {
        axis: 'X',
        title: 'Çekmece Dış Genişlik (X)',
        shortTag: `X: ${wMm} mm`,
        valueMm: wMm,
        netDetailLabel: `Net İç: ${firstDrw.innerWidthMm} mm (${firstDrw.sideThicknessMm}mm Yan)`,
        color: '#f59e0b',
        badgeClass: 'bg-amber-500 text-slate-950 border-amber-300',
        startMm: xStartMm,
        endMm: xEndMm,
        defaultDirection: 'right',
        directionOptions: [],
        minMm: 200,
        maxMm: 1200,
      },
      {
        axis: 'Y',
        title:
          selectedDrawers.length === 1
            ? `Çekmece #${firstDrw.drawerIndex + 1} Ön Yükseklik (Y)`
            : `${selectedDrawers.length} Çekmece Toplam Yükseklik (Y)`,
        shortTag: `Y: ${totalHMm} mm`,
        valueMm: totalHMm,
        netDetailLabel:
          selectedDrawers.length === 1
            ? `Net İç Yük: ${firstDrw.innerHeightMm} mm`
            : `${selectedDrawers.length} çekmece seçili`,
        color: '#38bdf8',
        badgeClass: 'bg-sky-500 text-slate-950 border-sky-300 hover:bg-sky-400',
        startMm: yStartMm,
        endMm: yEndMm,
        defaultDirection: 'up',
        directionOptions: [],
        minMm: 80,
        maxMm: Math.max(120, firstDrw.parentBankHeightMm - 80),
      },
      {
        axis: 'Z',
        title: 'Çekmece Kasa Derinliği (Z)',
        shortTag: `Z: ${dMm} mm`,
        valueMm: dMm,
        netDetailLabel: `Net İç: ${firstDrw.innerDepthMm} mm (Taban: ${firstDrw.bottomThicknessMm}mm)`,
        color: '#34d399',
        badgeClass: 'bg-emerald-500 text-slate-950 border-emerald-300',
        startMm: zStartMm,
        endMm: zEndMm,
        defaultDirection: 'front',
        directionOptions: [],
        minMm: 250,
        maxMm: 750,
      },
    ];

    return (
      <group>
        {drawerSpecs.map((spec) => {
          const startM: [number, number, number] = [
            spec.startMm[0] * MM_TO_M,
            spec.startMm[1] * MM_TO_M,
            spec.startMm[2] * MM_TO_M,
          ];
          const endM: [number, number, number] = [
            spec.endMm[0] * MM_TO_M,
            spec.endMm[1] * MM_TO_M,
            spec.endMm[2] * MM_TO_M,
          ];
          const midM: [number, number, number] = [
            (startM[0] + endM[0]) / 2,
            (startM[1] + endM[1]) / 2,
            (startM[2] + endM[2]) / 2,
          ];

          const isEditing = editingAxis === spec.axis && spec.axis === 'Y' && selectedDrawers.length === 1;

          return (
            <group key={`drw-dim-${spec.axis}`}>
              <Line points={[startM, endM]} color={spec.color} lineWidth={2.6} />
              <Html
                position={midM}
                center
                distanceFactor={viewMode === '3d-perspective' ? 5.0 : undefined}
                zIndexRange={isEditing ? [60, 40] : [30, 10]}
              >
                {isEditing ? (
                  <div
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                    className="pointer-events-auto flex flex-col gap-1.5 rounded-lg border border-sky-400 bg-slate-950/95 p-2 text-[11px] text-slate-100 shadow-2xl min-w-[205px]"
                  >
                    <div className="flex items-center justify-between text-[10px] font-bold text-sky-300">
                      <span>{spec.title}</span>
                      <button
                        type="button"
                        onClick={() => setEditingAxis(null)}
                        className="text-slate-400 hover:text-white"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                    <div className="flex items-center gap-1">
                      <input
                        ref={inputRef}
                        type="number"
                        step={10}
                        min={spec.minMm}
                        max={spec.maxMm}
                        value={draftVal}
                        onChange={(e) => setDraftVal(e.target.value)}
                        onKeyDown={(e) => {
                          e.stopPropagation();
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const n = Number(draftVal.trim());
                            if (Number.isFinite(n) && n >= 80) {
                              updateSelectedDrawerHeight(firstDrw.id, Math.round(n));
                            }
                            setEditingAxis(null);
                          } else if (e.key === 'Escape') {
                            setEditingAxis(null);
                          }
                        }}
                        className="w-20 rounded border border-slate-700 bg-slate-900 px-2 py-1 font-mono text-xs font-bold text-white"
                      />
                      <span className="font-mono text-[10px] text-slate-400">mm</span>
                      <button
                        type="button"
                        onClick={() => {
                          const n = Number(draftVal.trim());
                          if (Number.isFinite(n) && n >= 80) {
                            updateSelectedDrawerHeight(firstDrw.id, Math.round(n));
                          }
                          setEditingAxis(null);
                        }}
                        className="flex items-center gap-1 rounded bg-sky-500 px-2 py-1 text-[10px] font-bold text-slate-950 hover:bg-sky-400"
                      >
                        <Check className="h-3 w-3" />
                        Uygula
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (spec.axis === 'Y' && selectedDrawers.length === 1) {
                        setEditingAxis('Y');
                        setDraftVal(String(spec.valueMm));
                      }
                    }}
                    className={`pointer-events-auto group flex flex-col items-center rounded-md border px-2 py-0.5 font-mono text-[10px] font-bold shadow-lg ${spec.badgeClass}`}
                  >
                    <span className="flex items-center gap-1 whitespace-nowrap">
                      <span>{spec.shortTag}</span>
                      {spec.axis === 'Y' && selectedDrawers.length === 1 && (
                        <Pencil className="h-2.5 w-2.5 opacity-80" />
                      )}
                    </span>
                    {spec.netDetailLabel && (
                      <span className="text-[8px] font-semibold opacity-85 whitespace-nowrap">
                        {spec.netDetailLabel}
                      </span>
                    )}
                  </button>
                )}
              </Html>
            </group>
          );
        })}
      </group>
    );
  }

  // ---------------------------------------------------------------------------
  // 3. SEÇİLİ HÜCRE / RAF GRUBU / BEŞGEN KÖŞE ÖLÇÜ ÇİZGİLERİ
  // ---------------------------------------------------------------------------
  const group = analyzeSelectedCellsGroup(activeCellIds, resolved);
  if (group.cells.length === 0) return null;

  const first = group.cells[0];
  const [cx, cy, cz] = group.groupWorldCenterMm;
  const wMm = group.grossWidthMm;
  const hMm = group.grossHeightMm;
  const dMm = group.netDepthMm;

  const isRunA = first.wallAxis === 'A';
  const isCorner = group.isCornerSelection;
  const activeJunction = design.junctions[0] ?? null;

  let xStartMm: [number, number, number];
  let xEndMm: [number, number, number];
  let yStartPosMm: [number, number, number];
  let yEndPosMm: [number, number, number];
  let zStartMm: [number, number, number];
  let zEndMm: [number, number, number];

  const frontOffsetMm = 28;

  if (isCorner) {
    xStartMm = [cx - wMm * 0.35, group.yStartMm + 16, cz + wMm * 0.35];
    xEndMm = [cx + wMm * 0.35, group.yStartMm + 16, cz - wMm * 0.35];
    yStartPosMm = [cx + wMm * 0.36, group.yStartMm, cz - wMm * 0.36];
    yEndPosMm = [cx + wMm * 0.36, group.yEndMm, cz - wMm * 0.36];
    zStartMm = [cx - dMm * 0.3, cy, cz - dMm * 0.3];
    zEndMm = [cx + dMm * 0.3, cy, cz + dMm * 0.3];
  } else if (isRunA) {
    const frontZ = cz + dMm / 2 + frontOffsetMm;
    const backZ = cz - dMm / 2;
    const leftX = cx - wMm / 2;
    const rightX = cx + wMm / 2;

    xStartMm = [leftX, group.yStartMm + 14, frontZ];
    xEndMm = [rightX, group.yStartMm + 14, frontZ];

    yStartPosMm = [rightX - 14, group.yStartMm, frontZ];
    yEndPosMm = [rightX - 14, group.yEndMm, frontZ];

    zStartMm = [leftX + 18, group.yEndMm - 14, backZ];
    zEndMm = [leftX + 18, group.yEndMm - 14, cz + dMm / 2];
  } else {
    const frontX = cx + dMm / 2 + frontOffsetMm;
    const backX = cx - dMm / 2;
    const leftZ = cz - wMm / 2;
    const rightZ = cz + wMm / 2;

    xStartMm = [frontX, group.yStartMm + 14, leftZ];
    xEndMm = [frontX, group.yStartMm + 14, rightZ];

    yStartPosMm = [frontX, group.yStartMm, rightZ - 14];
    yEndPosMm = [frontX, group.yEndMm, rightZ - 14];

    zStartMm = [backX, group.yEndMm - 14, leftZ + 18];
    zEndMm = [cx + dMm / 2, group.yEndMm - 14, leftZ + 18];
  }

  const axisSpecs: AxisLineSpec[] = [
    {
      axis: 'X',
      title: isCorner
        ? 'Beşgen Köşe Kol Genişliği (Köşe A / B)'
        : group.cells.length > 1
          ? 'Toplam Genişlik (X)'
          : 'Hücre Genişliği (X)',
      shortTag: isCorner
        ? `Köşe A: ${activeJunction?.diagonalArmAMm ?? wMm} mm`
        : `X: ${wMm} mm`,
      valueMm: isCorner ? (activeJunction?.diagonalArmAMm ?? wMm) : wMm,
      netDetailLabel: isCorner
        ? `Tüm köşe rafları ortak kol ölçüsü paylaşır`
        : group.widthDividersMm > 0
          ? `Net: ${group.netWidthSumMm} + ${group.widthDividersMm}mm Bölücü`
          : undefined,
      color: '#f59e0b',
      badgeClass: 'bg-amber-500 text-slate-950 border-amber-300 hover:bg-amber-400',
      startMm: xStartMm,
      endMm: xEndMm,
      defaultDirection: 'right',
      directionOptions: [
        { value: 'right', label: 'Sağa (Sol Sabit)' },
        { value: 'left', label: 'Sola (Sağ Sabit)' },
      ],
      minMm: isCorner ? 750 : 100,
      maxMm: isCorner ? 1300 : 2400,
    },
    {
      axis: 'Y',
      title: isCorner
        ? 'Köşe Raf Aralığı Yüksekliği (Y)'
        : group.cells.length > 1
          ? 'Toplam Yükseklik (Y)'
          : 'Hücre Yüksekliği (Y)',
      shortTag: `Y: ${hMm} mm`,
      valueMm: hMm,
      netDetailLabel:
        group.heightDividersMm > 0
          ? `Net: ${group.netHeightSumMm} + ${group.heightDividersMm}mm Raf`
          : undefined,
      color: '#38bdf8',
      badgeClass: 'bg-sky-500 text-slate-950 border-sky-300 hover:bg-sky-400',
      startMm: yStartPosMm,
      endMm: yEndPosMm,
      defaultDirection: 'up',
      directionOptions: [
        { value: 'up', label: 'Yukarı (Alt Sabit)' },
        { value: 'down', label: 'Aşağı (Üst Sabit)' },
      ],
      minMm: Math.max(80, group.cells.length * 80 + group.heightDividersMm),
      maxMm: 2600,
    },
    {
      axis: 'Z',
      title: isCorner ? 'Beşgen Köşe B Kolu (Z)' : 'Net İç Derinlik (Z)',
      shortTag: isCorner
        ? `Köşe B: ${activeJunction?.diagonalArmBMm ?? dMm} mm`
        : `Z: ${dMm} mm`,
      valueMm: isCorner ? (activeJunction?.diagonalArmBMm ?? dMm) : dMm,
      color: '#34d399',
      badgeClass: 'bg-emerald-500 text-slate-950 border-emerald-300 hover:bg-emerald-400',
      startMm: zStartMm,
      endMm: zEndMm,
      defaultDirection: 'front',
      directionOptions: [
        { value: 'front', label: 'Öne (Arka Duvar Sabit)' },
        { value: 'back', label: 'Arkaya (Ön Sabit)' },
      ],
      minMm: isCorner ? 750 : 324,
      maxMm: isCorner ? 1300 : 774,
    },
  ];

  const handleOpenAxisEditor = (spec: AxisLineSpec, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingAxis(spec.axis);
    setDraftVal(String(spec.valueMm));
    setDirection(spec.defaultDirection);
  };

  const handlePreviewOrApply = (spec: AxisLineSpec, e?: React.SyntheticEvent) => {
    e?.stopPropagation();
    const num = Number(draftVal.trim());
    if (!Number.isFinite(num) || Number.isNaN(num)) return;
    const rounded = Math.round(num);

    if (isCorner && (spec.axis === 'X' || spec.axis === 'Z')) {
      const paramField = spec.axis === 'X' ? 'diagonalArmAMm' : 'diagonalArmBMm';
      updateCornerParam(paramField, Math.max(750, Math.min(1300, rounded)));
      setEditingAxis(null);
      return;
    }

    startOrUpdateResizeDraft(spec.axis, direction, rounded);
    const latestDraft = useWardrobeStore.getState().resizeDraft;
    if (
      latestDraft &&
      latestDraft.conflictOverlapMm === 0 &&
      !latestDraft.exceedsBoundary &&
      latestDraft.neighborCellIds.length === 0
    ) {
      commitResizeDraft();
    }
    setEditingAxis(null);
  };

  return (
    <group>
      {axisSpecs.map((spec) => {
        const startM: [number, number, number] = [
          spec.startMm[0] * MM_TO_M,
          spec.startMm[1] * MM_TO_M,
          spec.startMm[2] * MM_TO_M,
        ];
        const endM: [number, number, number] = [
          spec.endMm[0] * MM_TO_M,
          spec.endMm[1] * MM_TO_M,
          spec.endMm[2] * MM_TO_M,
        ];
        const midM: [number, number, number] = [
          (startM[0] + endM[0]) / 2,
          (startM[1] + endM[1]) / 2,
          (startM[2] + endM[2]) / 2,
        ];

        const isEditing = editingAxis === spec.axis;

        return (
          <group key={`sel-dim-${spec.axis}`}>
            <Line points={[startM, endM]} color={spec.color} lineWidth={2.6} />
            <Html
              position={midM}
              center
              distanceFactor={viewMode === '3d-perspective' ? 5.0 : undefined}
              zIndexRange={isEditing ? [60, 40] : [30, 10]}
            >
              {isEditing ? (
                <div
                  onPointerDown={(e) => e.stopPropagation()}
                  onPointerUp={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                  onWheel={(e) => e.stopPropagation()}
                  className="pointer-events-auto flex flex-col gap-1.5 rounded-lg border border-amber-400 bg-slate-950/95 p-2 text-[11px] text-slate-100 shadow-2xl backdrop-blur-md min-w-[215px]"
                >
                  <div className="flex items-center justify-between text-[10px] font-bold text-amber-300">
                    <span>{spec.title}</span>
                    <button
                      type="button"
                      onClick={() => setEditingAxis(null)}
                      className="text-slate-400 hover:text-white"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>

                  {isCorner && (spec.axis === 'X' || spec.axis === 'Z') ? (
                    <div className="text-[10px] text-slate-300 leading-snug">
                      Beşgen köşe modülündeki tüm raflar aynı kol ölçüsünü paylaşır (750–1300 mm):
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-1 text-[10px]">
                      {spec.directionOptions.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setDirection(opt.value)}
                          className={`rounded border px-1.5 py-0.5 font-medium transition ${
                            direction === opt.value
                              ? 'border-amber-400 bg-amber-500/25 text-amber-200 font-semibold'
                              : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-1">
                    <input
                      ref={inputRef}
                      type="number"
                      step={10}
                      min={spec.minMm}
                      max={spec.maxMm}
                      value={draftVal}
                      onChange={(e) => setDraftVal(e.target.value)}
                      onKeyDown={(e) => {
                        e.stopPropagation();
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handlePreviewOrApply(spec);
                        } else if (e.key === 'Escape') {
                          e.preventDefault();
                          setEditingAxis(null);
                        }
                      }}
                      className="w-24 rounded border border-slate-700 bg-slate-900 px-2 py-1 font-mono text-xs font-bold text-white focus:border-amber-400 focus:outline-none"
                    />
                    <span className="font-mono text-[10px] text-slate-400">mm</span>
                    <button
                      type="button"
                      onClick={(e) => handlePreviewOrApply(spec, e)}
                      className="flex items-center gap-1 rounded bg-amber-500 px-2 py-1 text-[10px] font-bold text-slate-950 hover:bg-amber-400"
                    >
                      <Check className="h-3 w-3" />
                      Uygula
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => handleOpenAxisEditor(spec, e)}
                  title={`${spec.title} — Yönlü boyutlandırmak için tıklayın`}
                  className={`pointer-events-auto group flex flex-col items-center rounded-md border px-2 py-0.5 font-mono text-[10px] font-bold shadow-lg transition hover:scale-105 ${spec.badgeClass}`}
                >
                  <span className="flex items-center gap-1 whitespace-nowrap">
                    <span>{spec.shortTag}</span>
                    <Pencil className="h-2.5 w-2.5 opacity-75 group-hover:opacity-100" />
                  </span>
                  {spec.netDetailLabel && (
                    <span className="text-[8px] font-semibold opacity-85 whitespace-nowrap">
                      {spec.netDetailLabel}
                    </span>
                  )}
                </button>
              )}
            </Html>
          </group>
        );
      })}

      {/* ÇAKIŞMA ÖNİZLEMESİ 3D KIRMIZI ETİKETİ */}
      {resizeDraft &&
        resizeDraft.conflictBoxWorldCenterMm &&
        (resizeDraft.conflictOverlapMm > 0 || resizeDraft.exceedsBoundary) && (
          <Html
            position={[
              resizeDraft.conflictBoxWorldCenterMm[0] * MM_TO_M,
              resizeDraft.conflictBoxWorldCenterMm[1] * MM_TO_M,
              resizeDraft.conflictBoxWorldCenterMm[2] * MM_TO_M,
            ]}
            center
            zIndexRange={[35, 15]}
          >
            <div className="pointer-events-none flex items-center gap-1.5 whitespace-nowrap rounded-md border border-rose-400 bg-rose-950/95 px-2.5 py-1 text-[11px] font-bold text-rose-200 shadow-xl">
              <AlertTriangle className="h-3.5 w-3.5 text-rose-400 shrink-0" />
              <span>
                Çakışma: {resizeDraft.conflictOverlapMm} mm ({resizeDraft.neighborLabel})
              </span>
            </div>
          </Html>
        )}
    </group>
  );
}
