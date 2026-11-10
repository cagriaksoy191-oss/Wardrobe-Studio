import { Edges } from '@react-three/drei';
import { type ThreeEvent, useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import type {
  InteriorItemsConfig,
  MaterialPalette,
  ResizeDraftState,
  ResolvedBay,
  ResolvedCell,
  ResolvedDoorLeaf,
  ResolvedDrawerUnit,
  ResolvedLedStrip,
  ResolvedPanel,
  ResolvedSlidingLeaf,
} from '../../core/schema/types';
import type { DoorVisibilityMode } from '../../store/useWardrobeStore';
import {
  createWorldSpaceBoxGeometry,
  createWorldSpaceExtrudeGeometry,
  getOrCreateWoodBumpTexture,
  getOrCreateWoodTexture,
  MATERIAL_CATALOG,
} from '../materials/materialRegistry';
import { HandleMesh3D } from './HandleMesh3D';
import { WardrobeItemsPreview } from './WardrobeItemsPreview';
import { getDoorOpeningAngleRad, hingedHandleLocalPosition } from '../../core/analysis/kinematics';
import { motionRuntime } from '../scene/MotionController';
import { SlidingLeafInteraction, slidingAsDoor } from './SlidingLeafInteraction';
import { slidingCellHasOpening } from '../../core/analysis/motionConstraints';
import { useWardrobeStore } from '../../store/useWardrobeStore';

const MM_TO_M = 0.001;
// Z-fighting'i önlemek için çakışık yüzeylerde 0.1 mm mikro daraltma
const COPLANAR_INSET_M = 0.0001;

// Three.js Mesh.prototype.raycast referansını koru (undefined geçildiğinde prototip metodunun ezilmesini önler)
const NOOP_RAYCAST: THREE.Object3D['raycast'] = () => null;
const MESH_RAYCAST: THREE.Object3D['raycast'] = THREE.Mesh.prototype.raycast;

interface SpringTrackState {
  pos: number; // 0 (kapalı) .. 1 (tam açık)
  vel: number; // 1/sn hız (hareket ortasında tıklamalarda kesintisiz yön değişimi için)
}

interface WardrobeMeshGroupProps {
  panels: ResolvedPanel[];
  bays: ResolvedBay[];
  cells: ResolvedCell[];
  doors: ResolvedDoorLeaf[];
  slidingDoors?: ResolvedSlidingLeaf[];
  drawers: ResolvedDrawerUnit[];
  ledStrips?: ResolvedLedStrip[];
  onlyWhenOpenOrGlass?: boolean;
  interiorItemsConfig?: InteriorItemsConfig;
  renderQualityMode?: 'edit' | 'presentation';
  materials: MaterialPalette;
  wireframeMode: boolean;
  doorVisibilityMode: DoorVisibilityMode;
  openDoorIds: Record<string, boolean>;
  openDrawerIds: Record<string, boolean>;
  selectedBayId: string | null;
  selectedCellId: string | null;
  selectedCellIds: string[];
  selectedDrawerIds: string[];
  multiSelectToolActive: boolean;
  doorEditorMode: boolean;
  selectedDoorIds: string[];
  hoveredMarqueeCellIds: string[];
  resizeDraft: ResizeDraftState | null;
  onSelectBay: (bayId: string) => void;
  onSelectCell: (cellId: string, bayId: string, additive?: boolean) => void;
  onSelectDrawer: (drawerId: string, additive?: boolean) => void;
  onSelectDoor: (doorId: string | null, bayId: string, additive?: boolean) => void;
  onCellPointerDown?: (cellId: string, bayId: string, e: ThreeEvent<PointerEvent>) => void;
  onToggleDoor: (doorId: string) => void;
  onToggleDrawer: (drawerId: string) => void;
}

export function WardrobeMeshGroup({
  panels,
  bays,
  cells,
  doors,
  slidingDoors = [],
  drawers,
  ledStrips = [],
  onlyWhenOpenOrGlass = true,
  interiorItemsConfig,
  renderQualityMode = 'edit',
  materials,
  wireframeMode,
  doorVisibilityMode,
  openDoorIds,
  openDrawerIds,
  selectedBayId,
  selectedCellId,
  selectedCellIds,
  selectedDrawerIds,
  multiSelectToolActive,
  doorEditorMode,
  selectedDoorIds,
  hoveredMarqueeCellIds,
  resizeDraft,
  onSelectCell,
  onSelectDrawer,
  onSelectDoor,
  onCellPointerDown,
  onToggleDoor,
  onToggleDrawer,
}: WardrobeMeshGroupProps) {
  // Kapak ve çekmecelerin anlık kinematik durumları (0..1 açıklık oranı ve anlık hız)
  const doorSpringMapRef = useRef<Record<string, SpringTrackState>>({});
  const drawerSpringMapRef = useRef<Record<string, SpringTrackState>>({});

  // Yalnızca sabit gövde/raf/baza panellerini statik çiz (kapak ve çekmece panelleri kinematik gruplarda çizilir)
  const staticPanels = useMemo(
    () => panels.filter((p) => !p.animatedUnitId),
    [panels]
  );

  return (
    <group>
      {/* 1. SABİT GÖVDE, BÖLÜCÜ, RAF VE ASKI PANELLERİ */}
      {staticPanels.map((panel) => (
        <PanelMeshItem
          key={panel.id}
          panel={panel}
          materials={materials}
          renderQualityMode={renderQualityMode}
          wireframeMode={wireframeMode}
          isHighlightedBay={panel.bayId !== undefined && panel.bayId === selectedBayId}
          dimmedForDoorEditor={doorEditorMode}
        />
      ))}

      {/* 1.5 DOLAP İÇİ GERÇEKÇİ ŞERİT LED AYDINLATMA KATMANI */}
      {ledStrips.length > 0 && (
        <LedLightingLayer
          ledStrips={ledStrips}
          doors={doors}
          materials={materials}
          doorVisibilityMode={doorVisibilityMode}
          onlyWhenOpenOrGlass={onlyWhenOpenOrGlass}
          renderQualityMode={renderQualityMode}
        />
      )}

      {/* 2. GERÇEK ÖLÇEKLİ 3D KIYAFET, EŞYA VE SERVİS NİŞİ KÜTÜPHANESİ */}
      <WardrobeItemsPreview
        cells={cells}
        panels={panels}
        interiorItemsConfig={interiorItemsConfig}
      />

      {/* 3. KİNEMATİK ÇEKMECE BİRİMLERİ (Üstü Açık 5 Panelli Boş Kasa + Özelleştirilebilir Kulp + Bağımsız Seçim) */}
      {drawers.map((drawer) => (
        <AnimatedDrawerUnit
          key={drawer.id}
          drawer={drawer}
          materials={materials}
          renderQualityMode={renderQualityMode}
          wireframeMode={wireframeMode}
          doorVisibilityMode={doorVisibilityMode}
          isDesiredOpen={Boolean(openDrawerIds[drawer.id])}
          isSelectedDrawer={selectedDrawerIds.includes(drawer.id)}
          multiSelectToolActive={multiSelectToolActive}
          doorEditorMode={doorEditorMode}
          doorSpringMapRef={doorSpringMapRef}
          drawerSpringMapRef={drawerSpringMapRef}
          onToggleDrawer={onToggleDrawer}
          onSelectDrawer={onSelectDrawer}
        />
      ))}

      {/* 4. KİNEMATİK MENTEŞELİ KAPAKLAR (Normal, X-Ray ve Kapak Düzenle Modunda) */}
      {(doorVisibilityMode !== 'hidden' || doorEditorMode) &&
        doors.map((door) => (
          <AnimatedHingedDoorLeaf
            key={door.id}
            door={door}
            drawers={drawers}
            materials={materials}
            renderQualityMode={renderQualityMode}
            wireframeMode={wireframeMode}
            isXray={doorVisibilityMode === 'xray' && !doorEditorMode}
            doorEditorMode={doorEditorMode}
            isSelectedDoor={selectedDoorIds.includes(door.id)}
            isDesiredOpen={Boolean(openDoorIds[door.id])}
            doorSpringMapRef={doorSpringMapRef}
            drawerSpringMapRef={drawerSpringMapRef}
            onToggleDoor={onToggleDoor}
            onSelectDoor={onSelectDoor}
          />
        ))}
      {(doorVisibilityMode !== 'hidden' || doorEditorMode) && slidingDoors.map(leaf=><SlidingLeafInteraction key={leaf.id} leaf={leaf} doorEditorMode={doorEditorMode} multiSelectToolActive={multiSelectToolActive} onToggleDoor={onToggleDoor}>
        {toggle=><AnimatedHingedDoorLeaf door={slidingAsDoor(leaf)} slidingLeaf={leaf} drawers={drawers} materials={materials} renderQualityMode={renderQualityMode} wireframeMode={wireframeMode} isXray={doorVisibilityMode==='xray'&&!doorEditorMode} doorEditorMode={doorEditorMode} isSelectedDoor={selectedDoorIds.includes(leaf.id)} isDesiredOpen={Boolean(openDoorIds[leaf.id])} doorSpringMapRef={doorSpringMapRef} drawerSpringMapRef={drawerSpringMapRef} onToggleDoor={toggle} onSelectDoor={onSelectDoor}/>} 
      </SlidingLeafInteraction>)}

      {/* 4.5 KAPAK DÜZENLE MODUNDA KAPAKSIZ (AÇIK) BÖLMELER İÇİN TIKLANABİLİR 'KAPAK EKLE' ALANI */}
      {doorEditorMode &&
        bays
          .filter((b) => !doors.some((d) => d.bayIds.includes(b.id)) && !slidingDoors.some(d=>d.bayIds.includes(b.id)))
          .map((bay) => {
            const isSelectedOpenBay = bay.id === selectedBayId && selectedDoorIds.length === 0;
            const posM: [number, number, number] = [
              bay.worldCenterMm[0] * MM_TO_M,
              bay.worldCenterMm[1] * MM_TO_M,
              bay.worldCenterMm[2] * MM_TO_M,
            ];
            const sizeM: [number, number, number] = [
              Math.max(0.05, bay.worldSizeMm[0] * MM_TO_M - 0.008),
              Math.max(0.05, bay.worldSizeMm[1] * MM_TO_M - 0.008),
              Math.max(0.02, bay.worldSizeMm[2] * MM_TO_M),
            ];
            return (
              <mesh
                key={`open-bay-door-target-${bay.id}`}
                position={posM}
                rotation={[0, bay.rotationYRad, 0]}
                raycast={MESH_RAYCAST}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectDoor(null, bay.id, false);
                }}
              >
                <boxGeometry args={sizeM} />
                <meshBasicMaterial
                  color={isSelectedOpenBay ? '#f59e0b' : '#38bdf8'}
                  transparent
                  opacity={isSelectedOpenBay ? 0.22 : 0.12}
                  depthWrite={false}
                />
                <Edges
                  scale={1}
                  threshold={15}
                  color={isSelectedOpenBay ? '#f59e0b' : '#38bdf8'}
                  lineWidth={2}
                  raycast={NOOP_RAYCAST}
                />
              </mesh>
            );
          })}

      {/* 5. SEÇİLEBİLİR İÇ BÖLME / RAF ARALIĞI / KÖŞE HACMİ KATMANI */}
      {!doorEditorMode &&
        cells.map((cell) => {
          const isSelected =
            selectedCellIds.includes(cell.id) || cell.id === selectedCellId;
          const isMarqueeHovered = hoveredMarqueeCellIds.includes(cell.id);
          const isConflictNeighbor =
            resizeDraft !== null &&
            (resizeDraft.conflictOverlapMm > 0 || resizeDraft.exceedsBoundary) &&
            resizeDraft.neighborCellIds.includes(cell.id);
          const isResolvedNeighbor =
            resizeDraft !== null &&
            resizeDraft.conflictOverlapMm === 0 &&
            !resizeDraft.exceedsBoundary &&
            resizeDraft.neighborCellIds.includes(cell.id);

          return (
            <SelectableCellVolume
              key={cell.id}
              cell={cell}
              isSelected={isSelected}
              isMarqueeHovered={isMarqueeHovered}
              isConflictNeighbor={isConflictNeighbor}
              isResolvedNeighbor={isResolvedNeighbor}
              doorVisibilityMode={doorVisibilityMode}
              openDoorIds={openDoorIds}
              onSelectCell={onSelectCell}
              onCellPointerDown={onCellPointerDown}
            />
          );
        })}

      {/* 5.5 YÖNLÜ BOYUTLANDIRMA HAREKETLİ SINIR / ÇAKIŞMA HACMİ ÖNİZLEMESİ */}
      {resizeDraft?.conflictBoxWorldCenterMm && resizeDraft.conflictBoxWorldSizeMm && (
        <mesh
          position={[
            resizeDraft.conflictBoxWorldCenterMm[0] * MM_TO_M,
            resizeDraft.conflictBoxWorldCenterMm[1] * MM_TO_M,
            resizeDraft.conflictBoxWorldCenterMm[2] * MM_TO_M,
          ]}
          rotation={[0, resizeDraft.conflictBoxRotationYRad ?? 0, 0]}
          raycast={NOOP_RAYCAST}
        >
          <boxGeometry
            args={[
              Math.max(0.02, resizeDraft.conflictBoxWorldSizeMm[0] * MM_TO_M + 0.006),
              Math.max(0.02, resizeDraft.conflictBoxWorldSizeMm[1] * MM_TO_M + 0.004),
              Math.max(0.02, resizeDraft.conflictBoxWorldSizeMm[2] * MM_TO_M + 0.006),
            ]}
          />
          <meshBasicMaterial
            key={
              resizeDraft.conflictOverlapMm > 0 || resizeDraft.exceedsBoundary
                ? 'conflict-box-red'
                : 'conflict-box-green'
            }
            color={
              resizeDraft.conflictOverlapMm > 0 || resizeDraft.exceedsBoundary
                ? '#ef4444'
                : '#10b981'
            }
            transparent
            opacity={0.32}
            depthWrite={false}
          />
          <Edges
            scale={1}
            threshold={15}
            color={
              resizeDraft.conflictOverlapMm > 0 || resizeDraft.exceedsBoundary
                ? '#f87171'
                : '#34d399'
            }
            lineWidth={2.5}
            raycast={NOOP_RAYCAST}
          />
        </mesh>
      )}

      {/* 6. SEÇİLİ BÖLME (BAY) DIŞ ÇERÇEVE VURGUSU (Raycast Devre Dışı — Tıklamaları Asla Engellemez) */}
      {bays
        .filter((b) => b.id === selectedBayId)
        .map((bay) => {
          const posM: [number, number, number] = [
            bay.worldCenterMm[0] * MM_TO_M,
            bay.worldCenterMm[1] * MM_TO_M,
            bay.worldCenterMm[2] * MM_TO_M,
          ];
          const sizeM: [number, number, number] = [
            bay.worldSizeMm[0] * MM_TO_M + 0.004,
            bay.worldSizeMm[1] * MM_TO_M + 0.004,
            bay.worldSizeMm[2] * MM_TO_M + 0.004,
          ];
          return (
            <mesh
              key={`bay-hl-${bay.id}`}
              position={posM}
              rotation={[0, bay.rotationYRad, 0]}
              raycast={NOOP_RAYCAST}
            >
              <boxGeometry args={sizeM} />
              <meshBasicMaterial transparent opacity={0} depthWrite={false} />
              <Edges
                scale={1}
                threshold={15}
                color="#38bdf8"
                lineWidth={1.5}
                raycast={NOOP_RAYCAST}
              />
            </mesh>
          );
        })}
    </group>
  );
}

/**
 * Dolap İçi Şerit LED Katmanı:
 * - Raf altı, askı borusu altı, dikey yan kanal, açık bölme ve köşe modülü LED difüzör çubuklarını çizer.
 * - Kapaklar açıkken, cam kapak arkasındayken veya X-Ray/Gizli moddayken iç hacmi gerçekçi sıcak ışıkla aydınlatır;
 *   opak kapaklar tamamen kapalıyken dışarı ışık sızmasını önler.
 */
function LedLightingLayer({
  ledStrips,
  doors,
  materials,
  doorVisibilityMode,
  renderQualityMode,
  onlyWhenOpenOrGlass,
}: {
  ledStrips: ResolvedLedStrip[];
  doors: ResolvedDoorLeaf[];
  materials: MaterialPalette;
  doorVisibilityMode: DoorVisibilityMode;
  onlyWhenOpenOrGlass: boolean;
  renderQualityMode: 'edit' | 'presentation';
}) {
  const doorById = useMemo(() => {
    const map = new Map<string, ResolvedDoorLeaf>();
    for (const d of doors) map.set(d.id, d);
    return map;
  }, [doors]);
  const stripMaterials=useRef(new Map<string,THREE.MeshStandardMaterial>());
  const stripLights=useRef(new Map<string,THREE.PointLight>());

  const isStripVisibleOrIlluminating = (strip: ResolvedLedStrip): boolean => {
    if (!onlyWhenOpenOrGlass || doorVisibilityMode === 'hidden' || doorVisibilityMode === 'xray') return true;
    const cov = strip.coveringDoorIds ?? [];
    if (cov.length === 0) return true;
    return cov.some((doorId) => {
      if ((motionRuntime.positions[doorId]??0)>.15&&!doorId.startsWith('slide-')) return true;
      const doorObj = doorById.get(doorId);
      const current=useWardrobeStore.getState().resolved,slide=current.slidingDoors?.find(l=>l.id===doorId);
      if(slide){const cell=current.cells.find(c=>c.bayId===strip.bayId&&c.yStartMm<=strip.worldPositionMm[1]&&c.yEndMm>=strip.worldPositionMm[1]);if(cell&&slidingCellHasOpening(current,motionRuntime.positions,cell))return true;}
      const matId = slide?.materialId??doorObj?.materialId ?? materials.frontMaterialId;
      return Boolean(MATERIAL_CATALOG[matId]?.isGlass);
    });
  };
  const lightRunIds = useMemo(() => [...new Set(ledStrips.map(strip => strip.runId))], [ledStrips]);
  useFrame(() => {
    const activeByRun = new Map<string, ResolvedLedStrip>();
    for (const strip of ledStrips) {
      const active = isStripVisibleOrIlluminating(strip);
      const material = stripMaterials.current.get(strip.id);
      if (material) material.emissiveIntensity = active ? strip.intensity * (renderQualityMode === 'presentation' ? 2.8 : 2.2) : 0;
      if (active && !activeByRun.has(strip.runId)) activeByRun.set(strip.runId, strip);
    }
    for (const [runId, light] of stripLights.current) {
      const strip = activeByRun.get(runId);
      light.intensity = strip ? strip.intensity * (renderQualityMode === 'presentation' ? 0.68 : 0.34) : 0;
      if (strip) {
        const [x, y, z] = strip.worldPositionMm;
        light.position.set(x * MM_TO_M, (y - 65) * MM_TO_M, z * MM_TO_M);
        light.color.set(strip.colorHex);
      }
    }
  });

  return (
    <group>
      {ledStrips.map((strip) => {
        const active = isStripVisibleOrIlluminating(strip);
        const posM: [number, number, number] = [
          strip.worldPositionMm[0] * MM_TO_M,
          strip.worldPositionMm[1] * MM_TO_M,
          strip.worldPositionMm[2] * MM_TO_M,
        ];
        const sizeM: [number, number, number] = [
          Math.max(0.004, strip.boxSizeMm[0] * MM_TO_M),
          Math.max(0.003, strip.boxSizeMm[1] * MM_TO_M),
          Math.max(0.004, strip.boxSizeMm[2] * MM_TO_M),
        ];

        return (
          <mesh
            key={strip.id}
            position={posM}
            rotation={[0, strip.rotationYRad, 0]}
            raycast={NOOP_RAYCAST}
          >
            <boxGeometry args={sizeM} />
            <meshStandardMaterial
              ref={m=>{if(m)stripMaterials.current.set(strip.id,m);else stripMaterials.current.delete(strip.id);}}
              color={strip.colorHex}
              emissive={strip.colorHex}
              emissiveIntensity={active ? strip.intensity * (renderQualityMode === 'presentation' ? 2.8 : 2.2) : 0}
              roughness={0.2}
              toneMapped={false}
            />
          </mesh>
        );
      })}

      {lightRunIds.map(runId => (
          <pointLight
            ref={light=>{if(light)stripLights.current.set(runId,light);else stripLights.current.delete(runId);}}
            key={runId}
            intensity={0}
            distance={0.82}
            decay={2}
            castShadow
            shadow-mapSize={[128, 128]}
            shadow-camera-near={0.03}
            shadow-camera-far={0.84}
            shadow-bias={-0.001}
          />
      ))}
    </group>
  );
}

/**
 * Seçilebilir İç Bölme / Raf Aralığı / Köşe Bölmesi Hacmi
 */
interface SelectableCellVolumeProps {
  cell: ResolvedCell;
  isSelected: boolean;
  isMarqueeHovered: boolean;
  isConflictNeighbor: boolean;
  isResolvedNeighbor: boolean;
  doorVisibilityMode: DoorVisibilityMode;
  openDoorIds: Record<string, boolean>;
  onSelectCell: (cellId: string, bayId: string, additive?: boolean) => void;
  onCellPointerDown?: (cellId: string, bayId: string, e: ThreeEvent<PointerEvent>) => void;
}

function SelectableCellVolume({
  cell,
  isSelected,
  isMarqueeHovered,
  isConflictNeighbor,
  isResolvedNeighbor,
  doorVisibilityMode,
  openDoorIds,
  onSelectCell,
  onCellPointerDown,
}: SelectableCellVolumeProps) {
  const isDrawerCell = cell.insert?.type === 'drawerBank';
  const coveringDoors = (cell.coveringDoorIds ?? []).filter(id=>!id.startsWith('slide-'));

  const isBlockedByClosedOpaqueDoor =
    doorVisibilityMode === 'normal' &&
    coveringDoors.length > 0 &&
    !coveringDoors.some((doorId) => Boolean(openDoorIds[doorId]));

  const canRaycast = !isDrawerCell && !isBlockedByClosedOpaqueDoor;
  const cellRaycast:THREE.Object3D['raycast']=function(this:THREE.Object3D,raycaster,hits){
    if(doorVisibilityMode!=='normal'||slidingCellHasOpening(useWardrobeStore.getState().resolved,motionRuntime.positions,cell))MESH_RAYCAST.call(this,raycaster,hits);
  };

  const visualStateKey = isConflictNeighbor
    ? 'conflict'
    : isResolvedNeighbor
      ? 'resolved'
      : isMarqueeHovered
        ? 'marquee'
        : isSelected
          ? 'selected'
          : 'idle';

  const fillColor = isConflictNeighbor
    ? '#ef4444'
    : isResolvedNeighbor
      ? '#10b981'
      : isMarqueeHovered
        ? '#38bdf8'
        : '#f59e0b';

  const fillOpacity = isConflictNeighbor
    ? 0.28
    : isResolvedNeighbor
      ? 0.2
      : isMarqueeHovered
        ? 0.22
        : isSelected
          ? 0.16
          : 0.0;

  const edgeColor = isConflictNeighbor
    ? '#f87171'
    : isResolvedNeighbor
      ? '#34d399'
      : isMarqueeHovered
        ? '#38bdf8'
        : '#f59e0b';

  const showHighlightEdges =
    isSelected || isMarqueeHovered || isConflictNeighbor || isResolvedNeighbor;

  const polygonExtrudeGeom = useMemo(() => {
    if (!cell.polygonXZMm || cell.polygonXZMm.length < 3) return null;
    const shape = new THREE.Shape();
    const pts = cell.polygonXZMm;
    shape.moveTo(pts[0].xMm * MM_TO_M, -pts[0].zMm * MM_TO_M);
    for (let i = 1; i < pts.length; i++) {
      shape.lineTo(pts[i].xMm * MM_TO_M, -pts[i].zMm * MM_TO_M);
    }
    shape.closePath();

    const heightM = Math.max(0.02, cell.netHeightMm * MM_TO_M - 0.004);
    return new THREE.ExtrudeGeometry(shape, {
      depth: heightM,
      bevelEnabled: false,
    });
  }, [cell.polygonXZMm, cell.netHeightMm]);

  if (polygonExtrudeGeom) {
    return (
      <mesh
        geometry={polygonExtrudeGeom}
        position={[0, cell.yStartMm * MM_TO_M + 0.002, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        raycast={canRaycast ? cellRaycast : NOOP_RAYCAST}
        onPointerDown={
          canRaycast && onCellPointerDown
            ? (e) => {
                onCellPointerDown(cell.id, cell.bayId, e);
              }
            : undefined
        }
        onClick={
          canRaycast
            ? (e) => {
                e.stopPropagation();
                onSelectCell(
                  cell.id,
                  cell.bayId,
                  Boolean(e.shiftKey || e.ctrlKey || e.metaKey)
                );
              }
            : undefined
        }
      >
        <meshBasicMaterial
          key={`poly-cell-${visualStateKey}`}
          color={fillColor}
          transparent
          opacity={fillOpacity}
          depthWrite={false}
        />
        {showHighlightEdges && (
          <Edges
            scale={1}
            threshold={15}
            color={edgeColor}
            lineWidth={2.2}
            raycast={NOOP_RAYCAST}
          />
        )}
      </mesh>
    );
  }

  const posM: [number, number, number] = [
    cell.worldCenterMm[0] * MM_TO_M,
    cell.worldCenterMm[1] * MM_TO_M,
    cell.worldCenterMm[2] * MM_TO_M,
  ];
  const sizeM: [number, number, number] = [
    Math.max(0.02, cell.worldSizeMm[0] * MM_TO_M - 0.004),
    Math.max(0.02, cell.worldSizeMm[1] * MM_TO_M - 0.002),
    Math.max(0.02, cell.worldSizeMm[2] * MM_TO_M - 0.004),
  ];

  return (
    <mesh
      position={posM}
      rotation={[0, cell.rotationYRad, 0]}
      raycast={canRaycast ? cellRaycast : NOOP_RAYCAST}
      onPointerDown={
        canRaycast && onCellPointerDown
          ? (e) => {
              onCellPointerDown(cell.id, cell.bayId, e);
            }
          : undefined
      }
      onClick={
        canRaycast
          ? (e) => {
              e.stopPropagation();
              onSelectCell(
                cell.id,
                cell.bayId,
                Boolean(e.shiftKey || e.ctrlKey || e.metaKey)
              );
            }
          : undefined
      }
    >
      <boxGeometry args={sizeM} />
      <meshBasicMaterial
        key={`box-cell-${visualStateKey}`}
        color={fillColor}
        transparent
        opacity={fillOpacity}
        depthWrite={false}
      />
      {showHighlightEdges && (
        <Edges
          scale={1}
          threshold={15}
          color={edgeColor}
          lineWidth={2.2}
          raycast={NOOP_RAYCAST}
        />
      )}
    </mesh>
  );
}

/**
 * Menteşeli Kapak Kanadı — Alüminyum Çerçeveli Cam Kapak, Ayna Kapak, Parlak Lake,
 * Ahşap PBR ve Kapakla Birlikte Dönerek Açılan Kulp Desteği
 */
interface AnimatedHingedDoorLeafProps {
  door: ResolvedDoorLeaf;
  slidingLeaf?: ResolvedSlidingLeaf;
  drawers: ResolvedDrawerUnit[];
  materials: MaterialPalette;
  renderQualityMode: 'edit' | 'presentation';
  wireframeMode: boolean;
  isXray: boolean;
  doorEditorMode: boolean;
  isSelectedDoor: boolean;
  isDesiredOpen: boolean;
  doorSpringMapRef: React.MutableRefObject<Record<string, SpringTrackState>>;
  drawerSpringMapRef: React.MutableRefObject<Record<string, SpringTrackState>>;
  onToggleDoor: (doorId: string) => void;
  onSelectDoor: (doorId: string | null, bayId: string, additive?: boolean) => void;
}

function AnimatedHingedDoorLeaf({
  door,
  slidingLeaf,
  materials,
  renderQualityMode,
  wireframeMode,
  isXray,
  doorEditorMode,
  isSelectedDoor,
  isDesiredOpen,
  doorSpringMapRef,
  onToggleDoor,
  onSelectDoor,
}: AnimatedHingedDoorLeafProps) {
  const pivotGroupRef = useRef<THREE.Group>(null);
  const matId = door.materialId ?? materials.frontMaterialId;
  const matDef = MATERIAL_CATALOG[matId] ?? MATERIAL_CATALOG.linenBeige;
  const woodTexture = useMemo(() => getOrCreateWoodTexture(matId), [matId]);
  const woodBump = useMemo(() => getOrCreateWoodBumpTexture(matId), [matId]);

  const leafBoxSizeM: [number, number, number] = [
    Math.max(0.01, door.widthMm * MM_TO_M - COPLANAR_INSET_M),
    Math.max(0.01, door.heightMm * MM_TO_M - COPLANAR_INSET_M),
    Math.max(0.004, door.thicknessMm * MM_TO_M - COPLANAR_INSET_M),
  ];

  const leafGeom = useMemo(
    () => createWorldSpaceBoxGeometry(leafBoxSizeM, 'vertical'),
    [leafBoxSizeM[0], leafBoxSizeM[1], leafBoxSizeM[2]]
  );

  const maxVisualOpenRad = getDoorOpeningAngleRad(door);

  useFrame(() => {
    if (!doorSpringMapRef.current[door.id]) {
      doorSpringMapRef.current[door.id] = { pos: isDesiredOpen ? 1 : 0, vel: 0 };
    }
    const track = doorSpringMapRef.current[door.id];

    track.pos=motionRuntime.positions[door.id]??0;
    track.vel=motionRuntime.velocities[door.id]??0;

    if (pivotGroupRef.current) {
      const currentSwingRad = slidingLeaf?0:track.pos * maxVisualOpenRad * door.openRotationDirection;
      pivotGroupRef.current.rotation.y = door.closedRotationYRad + currentSwingRad;
      if(slidingLeaf)pivotGroupRef.current.position.set(...slidingLeaf.closedWorldPositionMm.map((v,i)=>(v+slidingLeaf.slideDirectionWorld[i]*track.pos)*MM_TO_M) as [number,number,number]);
    }
  });

  const pivotPosM: [number, number, number] = [
    door.pivotWorldMm[0] * MM_TO_M,
    door.pivotWorldMm[1] * MM_TO_M,
    door.pivotWorldMm[2] * MM_TO_M,
  ];

  const leafCenterOffsetM: [number, number, number] = [
    door.leafCenterOffsetMm[0] * MM_TO_M,
    door.leafCenterOffsetMm[1] * MM_TO_M,
    door.leafCenterOffsetMm[2] * MM_TO_M,
  ];

  const handleSurfacePosM = (slidingLeaf
    ? [door.handleOffsetMm[0], door.handleOffsetMm[1], door.thicknessMm / 2 + 1]
    : hingedHandleLocalPosition(door)).map(value => value * MM_TO_M) as [number, number, number];

  const handleDoorClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (doorEditorMode) {
      onSelectDoor(
        door.id,
        door.bayId ?? door.bayIds[0] ?? '',
        Boolean(e.shiftKey || e.ctrlKey || e.metaKey)
      );
    } else {
      onToggleDoor(door.id);
    }
  };

  const isGlassLeaf = Boolean(matDef.isGlass) && !isXray;
  const frameWidthM = Math.min(0.045, leafBoxSizeM[0] * 0.16);
  const envMapIntensity =
    renderQualityMode === 'presentation'
      ? matDef.isMirror
        ? 2.1
        : matDef.clearcoat
          ? 1.65
          : 1.15
      : matDef.isMirror
        ? 1.6
        : 0.9;

  return (
    <group
      ref={pivotGroupRef}
      position={pivotPosM}
      rotation={[0, door.closedRotationYRad, 0]}
    >
      {/* Alüminyum Çerçeveli Cam Kapak Modu */}
      {isGlassLeaf ? (
        <group position={leafCenterOffsetM}>
          {/* 4 Kenar Alüminyum Çerçeve Profilleri */}
          {[
            {
              pos: [-leafBoxSizeM[0] / 2 + frameWidthM / 2, 0, 0] as [number, number, number],
              size: [frameWidthM, leafBoxSizeM[1], leafBoxSizeM[2]] as [number, number, number],
            },
            {
              pos: [leafBoxSizeM[0] / 2 - frameWidthM / 2, 0, 0] as [number, number, number],
              size: [frameWidthM, leafBoxSizeM[1], leafBoxSizeM[2]] as [number, number, number],
            },
            {
              pos: [0, leafBoxSizeM[1] / 2 - frameWidthM / 2, 0] as [number, number, number],
              size: [
                Math.max(0.02, leafBoxSizeM[0] - 2 * frameWidthM),
                frameWidthM,
                leafBoxSizeM[2],
              ] as [number, number, number],
            },
            {
              pos: [0, -leafBoxSizeM[1] / 2 + frameWidthM / 2, 0] as [number, number, number],
              size: [
                Math.max(0.02, leafBoxSizeM[0] - 2 * frameWidthM),
                frameWidthM,
                leafBoxSizeM[2],
              ] as [number, number, number],
            },
          ].map((seg, idx) => (
            <mesh
              key={`glass-frame-${idx}`}
              position={seg.pos}
              castShadow
              receiveShadow
              raycast={MESH_RAYCAST}
              onClick={handleDoorClick}
            >
              <boxGeometry args={seg.size} />
              <meshStandardMaterial
                color={matDef.frameHex ?? '#1e293b'}
                metalness={0.78}
                roughness={0.26}
                emissive={doorEditorMode && isSelectedDoor ? '#f59e0b' : '#000000'}
                emissiveIntensity={doorEditorMode && isSelectedDoor ? 0.2 : 0}
              />
            </mesh>
          ))}

          {/* Orta Yarı Saydam Vitrin Cam Paneli */}
          <mesh
            position={[0, 0, 0]}
            raycast={MESH_RAYCAST}
            onClick={handleDoorClick}
          >
            <boxGeometry
              args={[
                Math.max(0.02, leafBoxSizeM[0] - 2 * frameWidthM),
                Math.max(0.02, leafBoxSizeM[1] - 2 * frameWidthM),
                Math.max(0.004, leafBoxSizeM[2] * 0.35),
              ]}
            />
            <meshStandardMaterial
              key={`glass-pane-${matId}-${doorEditorMode}-${isSelectedDoor}`}
              color={matDef.baseHex}
              transparent
              opacity={matDef.opacity ?? 0.34}
              roughness={matDef.roughness}
              metalness={matDef.metalness}
              envMapIntensity={1.6}
              depthWrite={false}
            />
          </mesh>
        </group>
      ) : (
        /* Standart / Lake / Ayna / Ahşap Kapak Kanadı Gövdesi */
        <mesh
          geometry={leafGeom}
          position={leafCenterOffsetM}
          castShadow={!isXray}
          receiveShadow={!isXray}
          raycast={isXray && !doorEditorMode ? NOOP_RAYCAST : MESH_RAYCAST}
          onClick={isXray && !doorEditorMode ? undefined : handleDoorClick}
        >
          <meshStandardMaterial
            key={
              isXray
                ? 'door-leaf-xray'
                : doorEditorMode
                  ? `door-leaf-editor-${isSelectedDoor}-${matId}`
                  : `door-leaf-solid-${matId}-${wireframeMode}-${renderQualityMode}`
            }
            color={!isXray && woodTexture ? '#ffffff' : matDef.baseHex}
            map={isXray ? null : woodTexture}
            bumpMap={isXray ? null : woodBump}
            bumpScale={woodBump ? 0.0012 : 0}
            roughness={matDef.roughness}
            metalness={matDef.metalness}
            envMapIntensity={envMapIntensity}
            emissive={doorEditorMode && isSelectedDoor ? '#f59e0b' : '#000000'}
            emissiveIntensity={doorEditorMode && isSelectedDoor ? 0.18 : 0}
            transparent={isXray}
            opacity={isXray ? 0.22 : 1}
            depthWrite={!isXray}
            wireframe={wireframeMode}
          />
          {(renderQualityMode === 'edit' || doorEditorMode || isXray || wireframeMode) && <Edges
            scale={1}
            threshold={15}
            color={
              doorEditorMode
                ? isSelectedDoor
                  ? '#f59e0b'
                  : '#38bdf8'
                : isXray
                  ? '#38bdf8'
                  : '#334155'
            }
            lineWidth={doorEditorMode ? (isSelectedDoor ? 2.6 : 1.8) : 1}
            raycast={NOOP_RAYCAST}
          />}
        </mesh>
      )}

      {/* Kapakla Birlikte Dönen 3D Kulp */}
      <HandleMesh3D
        handleConfig={door.handleConfig ?? materials.doorHandleConfig}
        defaultLengthMm={door.handleLengthMm}
        defaultOrientation="vertical"
        bodyMaterialId={matId}
        surfacePositionM={handleSurfacePosM}
        rotationYRad={0}
        isXray={isXray}
        raycastEnabled={!isXray || doorEditorMode}
        onClick={handleDoorClick}
      />
    </group>
  );
}

/**
 * Gerçekçi Üstü Açık, İçi Boş 5 Panelli Çekmece Birimi + Çekmeceyle Birlikte Kayan 3D Kulp
 */
interface AnimatedDrawerUnitProps {
  drawer: ResolvedDrawerUnit;
  materials: MaterialPalette;
  renderQualityMode: 'edit' | 'presentation';
  wireframeMode: boolean;
  doorVisibilityMode: DoorVisibilityMode;
  isDesiredOpen: boolean;
  isSelectedDrawer: boolean;
  multiSelectToolActive: boolean;
  doorEditorMode: boolean;
  doorSpringMapRef: React.MutableRefObject<Record<string, SpringTrackState>>;
  drawerSpringMapRef: React.MutableRefObject<Record<string, SpringTrackState>>;
  onToggleDrawer: (drawerId: string) => void;
  onSelectDrawer: (drawerId: string, additive?: boolean) => void;
}

function AnimatedDrawerUnit({
  drawer,
  materials,
  renderQualityMode,
  wireframeMode,
  isDesiredOpen,
  isSelectedDrawer,
  multiSelectToolActive,
  doorEditorMode,
  drawerSpringMapRef,
  onToggleDrawer,
  onSelectDrawer,
}: AnimatedDrawerUnitProps) {
  const slideGroupRef = useRef<THREE.Group>(null);
  const frontMatId =
    drawer.frontMaterialId ?? materials.drawerFrontMaterialId ?? materials.frontMaterialId;
  const carcassMatId = materials.carcassMaterialId;
  const frontMatDef = MATERIAL_CATALOG[frontMatId] ?? MATERIAL_CATALOG.linenBeige;
  const carcassMatDef = MATERIAL_CATALOG[carcassMatId] ?? MATERIAL_CATALOG.warmOak;
  const frontTexture = useMemo(() => getOrCreateWoodTexture(frontMatId), [frontMatId]);
  const frontBump = useMemo(() => getOrCreateWoodBumpTexture(frontMatId), [frontMatId]);
  const carcassTexture = useMemo(() => getOrCreateWoodTexture(carcassMatId), [carcassMatId]);

  const toMeters = (mmVec: [number, number, number]): [number, number, number] => [
    Math.max(0.004, mmVec[0] * MM_TO_M - COPLANAR_INSET_M),
    Math.max(0.004, mmVec[1] * MM_TO_M - COPLANAR_INSET_M),
    Math.max(0.004, mmVec[2] * MM_TO_M - COPLANAR_INSET_M),
  ];

  const frontSizeM = toMeters(drawer.frontBoxSizeMm);
  const leftSideSizeM = toMeters(drawer.leftSideBoxSizeMm);
  const rightSideSizeM = toMeters(drawer.rightSideBoxSizeMm);
  const backPanelSizeM = toMeters(drawer.backPanelBoxSizeMm);
  const bottomPanelSizeM = toMeters(drawer.bottomPanelBoxSizeMm);

  const frontGeom = useMemo(
    () => createWorldSpaceBoxGeometry(frontSizeM, 'horizontal'),
    [frontSizeM[0], frontSizeM[1], frontSizeM[2]]
  );
  const leftSideGeom = useMemo(
    () => createWorldSpaceBoxGeometry(leftSideSizeM, 'horizontal'),
    [leftSideSizeM[0], leftSideSizeM[1], leftSideSizeM[2]]
  );
  const rightSideGeom = useMemo(
    () => createWorldSpaceBoxGeometry(rightSideSizeM, 'horizontal'),
    [rightSideSizeM[0], rightSideSizeM[1], rightSideSizeM[2]]
  );
  const backPanelGeom = useMemo(
    () => createWorldSpaceBoxGeometry(backPanelSizeM, 'horizontal'),
    [backPanelSizeM[0], backPanelSizeM[1], backPanelSizeM[2]]
  );
  const bottomPanelGeom = useMemo(
    () => createWorldSpaceBoxGeometry(bottomPanelSizeM, 'horizontal'),
    [bottomPanelSizeM[0], bottomPanelSizeM[1], bottomPanelSizeM[2]]
  );

  useFrame(() => {
    if (!drawerSpringMapRef.current[drawer.id]) {
      drawerSpringMapRef.current[drawer.id] = { pos: isDesiredOpen ? 1 : 0, vel: 0 };
    }
    const track = drawerSpringMapRef.current[drawer.id];

    track.pos=motionRuntime.positions[drawer.id]??0;
    track.vel=motionRuntime.velocities[drawer.id]??0;

    if (slideGroupRef.current) {
      const slideDistM = track.pos * drawer.maxSlideMm * MM_TO_M;
      slideGroupRef.current.position.set(
        drawer.slideDirectionWorld[0] * slideDistM,
        drawer.slideDirectionWorld[1] * slideDistM,
        drawer.slideDirectionWorld[2] * slideDistM
      );
    }
  });

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (doorEditorMode) return;
    const isAdditiveOrSelectTool = Boolean(
      multiSelectToolActive || e.shiftKey || e.ctrlKey || e.metaKey
    );
    if (isAdditiveOrSelectTool) {
      onSelectDrawer(drawer.id, Boolean(e.shiftKey || e.ctrlKey || e.metaKey));
    } else {
      onToggleDrawer(drawer.id);
    }
  };

  const edgeColor = isSelectedDrawer ? '#f59e0b' : '#1e293b';
  const edgeWidth = isSelectedDrawer ? 2.4 : 1;

  const isWallB = drawer.wallAxis === 'B';
  // Çekmece ön kapağının tam dış yüzeyi (kalınlık değiştiğinde 18mm -> 25mm otomatik güncellenir)
  const handleSurfacePosM: [number, number, number] = isWallB
    ? [
        (drawer.frontWorldPositionMm[0] + drawer.frontBoxSizeMm[0] / 2) * MM_TO_M,
        drawer.handleWorldPositionMm[1] * MM_TO_M,
        drawer.handleWorldPositionMm[2] * MM_TO_M,
      ]
    : [
        drawer.handleWorldPositionMm[0] * MM_TO_M,
        drawer.handleWorldPositionMm[1] * MM_TO_M,
        (drawer.frontWorldPositionMm[2] + drawer.frontBoxSizeMm[2] / 2) * MM_TO_M,
      ];

  const defaultHandleLenMm = Math.max(drawer.handleBoxSizeMm[0], drawer.handleBoxSizeMm[2]);

  const renderCarcassBoxPanel = (
    geom: THREE.BufferGeometry,
    posMm: [number, number, number],
    keySuffix: string
  ) => (
    <mesh
      key={keySuffix}
      geometry={geom}
      position={[posMm[0] * MM_TO_M, posMm[1] * MM_TO_M, posMm[2] * MM_TO_M]}
      castShadow
      receiveShadow
      raycast={doorEditorMode ? NOOP_RAYCAST : MESH_RAYCAST}
      onClick={handleClick}
    >
      <meshStandardMaterial
        color={carcassMatDef.baseHex}
        map={carcassTexture}
        roughness={carcassMatDef.roughness}
        metalness={carcassMatDef.metalness}
        emissive={isSelectedDrawer ? '#f59e0b' : '#000000'}
        emissiveIntensity={isSelectedDrawer ? 0.14 : 0}
        wireframe={wireframeMode}
      />
      <Edges scale={1} threshold={15} color={edgeColor} lineWidth={edgeWidth} raycast={NOOP_RAYCAST} />
    </mesh>
  );

  return (
    <group ref={slideGroupRef}>
      {/* 1. Çekmece Ön Yüzü (Klapa) */}
      <mesh
        geometry={frontGeom}
        position={[
          drawer.frontWorldPositionMm[0] * MM_TO_M,
          drawer.frontWorldPositionMm[1] * MM_TO_M,
          drawer.frontWorldPositionMm[2] * MM_TO_M,
        ]}
        castShadow
        receiveShadow
        raycast={doorEditorMode ? NOOP_RAYCAST : MESH_RAYCAST}
        onClick={handleClick}
      >
        <meshStandardMaterial
          key={`drawer-front-${frontMatId}-${renderQualityMode}-${wireframeMode}`}
          color={frontTexture ? '#ffffff' : frontMatDef.baseHex}
          map={frontTexture}
          bumpMap={frontBump}
          bumpScale={frontBump ? 0.0012 : 0}
          roughness={frontMatDef.roughness}
          metalness={frontMatDef.metalness}
          envMapIntensity={renderQualityMode === 'presentation' ? 1.25 : 0.9}
          emissive={isSelectedDrawer ? '#f59e0b' : '#000000'}
          emissiveIntensity={isSelectedDrawer ? 0.18 : 0}
          wireframe={wireframeMode}
        />
        {(renderQualityMode === 'edit' || isSelectedDrawer || wireframeMode) && <Edges
          scale={1}
          threshold={15}
          color={isSelectedDrawer ? '#f59e0b' : '#334155'}
          lineWidth={edgeWidth}
          raycast={NOOP_RAYCAST}
        />}
      </mesh>

      {/* 2. Sol Yan Panel */}
      {renderCarcassBoxPanel(leftSideGeom, drawer.leftSideWorldPositionMm, 'left-side')}

      {/* 3. Sağ Yan Panel */}
      {renderCarcassBoxPanel(rightSideGeom, drawer.rightSideWorldPositionMm, 'right-side')}

      {/* 4. Arka Panel */}
      {renderCarcassBoxPanel(backPanelGeom, drawer.backPanelWorldPositionMm, 'back-panel')}

      {/* 5. Alt Taban Paneli (Üstü Açık Boş İç Hacmin Tabanı) */}
      {renderCarcassBoxPanel(bottomPanelGeom, drawer.bottomPanelWorldPositionMm, 'bottom-panel')}

      {/* 6. Çekmeceyle Birlikte Kayan 3D Kulp */}
      {drawer.organizerPanels?.map(panel=><mesh key={panel.id} position={panel.worldPositionMm.map(v=>v*MM_TO_M) as [number,number,number]} raycast={NOOP_RAYCAST} castShadow receiveShadow>
        <boxGeometry args={panel.boxSizeMm.map(v=>v*MM_TO_M) as [number,number,number]}/>
        <meshStandardMaterial color={carcassMatDef.baseHex} roughness={0.65} wireframe={wireframeMode}/>
        <Edges color="#64748b" raycast={NOOP_RAYCAST}/>
      </mesh>)}
      <HandleMesh3D
        handleConfig={drawer.handleConfig ?? materials.drawerHandleConfig}
        defaultLengthMm={defaultHandleLenMm}
        defaultOrientation="horizontal"
        bodyMaterialId={frontMatId}
        surfacePositionM={handleSurfacePosM}
        rotationYRad={isWallB ? Math.PI / 2 : 0}
        raycastEnabled={!doorEditorMode}
        onClick={handleClick}
      />
    </group>
  );
}

interface PanelMeshItemProps {
  panel: ResolvedPanel;
  materials: MaterialPalette;
  renderQualityMode: 'edit' | 'presentation';
  wireframeMode: boolean;
  isHighlightedBay: boolean;
  dimmedForDoorEditor?: boolean;
}

function PanelMeshItem({
  panel,
  materials,
  renderQualityMode,
  wireframeMode,
  isHighlightedBay,
  dimmedForDoorEditor = false,
}: PanelMeshItemProps) {
  const matId =
    panel.materialIdOverride ??
    (panel.materialSlot === 'front'
      ? materials.frontMaterialId
      : panel.materialSlot === 'shelf'
        ? (materials.shelfMaterialId ?? materials.carcassMaterialId)
        : panel.materialSlot === 'metal'
          ? 'brushedMetal'
          : materials.carcassMaterialId);
  const matDef = MATERIAL_CATALOG[matId] ?? MATERIAL_CATALOG.warmOak;
  const woodTexture = useMemo(() => getOrCreateWoodTexture(matId), [matId]);
  const woodBump = useMemo(() => getOrCreateWoodBumpTexture(matId), [matId]);

  const posM: [number, number, number] = [
    panel.worldPositionMm[0] * MM_TO_M,
    panel.worldPositionMm[1] * MM_TO_M,
    panel.worldPositionMm[2] * MM_TO_M,
  ];

  // 1) SİLİNDİR ASKI BORUSU VEYA AYARLI METAL DOLAP AYAĞI
  if (panel.shapeKind === 'cylinderRod') {
    const [sx, sy, sz] = panel.boxSizeMm;
    const isVerticalFoot = panel.role === 'cabinetFoot';
    const isAlongX = sx >= sz;
    const lengthM = isVerticalFoot
      ? sy * MM_TO_M
      : Math.max(sx, sz) * MM_TO_M - COPLANAR_INSET_M * 2;
    const radiusM = isVerticalFoot
      ? (Math.min(sx, sz) * MM_TO_M) / 2
      : (Math.min(sx, sy, sz) * MM_TO_M) / 2;

    return (
      <mesh
        position={posM}
        rotation={
          isVerticalFoot
            ? [0, 0, 0]
            : isAlongX
              ? [0, 0, Math.PI / 2]
              : [Math.PI / 2, 0, 0]
        }
        castShadow
        receiveShadow
        raycast={NOOP_RAYCAST}
      >
        <cylinderGeometry args={[radiusM, radiusM, lengthM, 20]} />
        <meshStandardMaterial
          color={isVerticalFoot ? '#334155' : '#d1d5db'}
          metalness={0.85}
          roughness={0.2}
          wireframe={wireframeMode}
        />
      </mesh>
    );
  }

  // 2) BEŞGEN / POLİGON EKSTRÜZYON PANEL (Dünya-Uzayı UV + Damar Yönü Destekli)
  if (panel.shapeKind === 'extrudedPolygon' && panel.polygonXZMm && panel.polygonXZMm.length >= 3) {
    const extrudeGeom = useMemo(() => {
      const thicknessM = Math.max(0.004, panel.cutThicknessMm * MM_TO_M - COPLANAR_INSET_M);
      return createWorldSpaceExtrudeGeometry(panel.polygonXZMm!, thicknessM);
    }, [panel.polygonXZMm, panel.cutThicknessMm]);

    return (
      <mesh
        geometry={extrudeGeom}
        position={[0, posM[1], 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        castShadow
        receiveShadow
        raycast={NOOP_RAYCAST}
      >
        <meshStandardMaterial
          key={`poly-panel-${matId}-${renderQualityMode}-${wireframeMode}`}
          color={woodTexture ? '#ffffff' : matDef.baseHex}
          map={woodTexture}
          bumpMap={woodBump}
          bumpScale={woodBump ? 0.0012 : 0}
          roughness={matDef.roughness}
          metalness={matDef.metalness}
          envMapIntensity={renderQualityMode === 'presentation' ? 1.15 : 0.85}
          wireframe={wireframeMode}
        />
        <Edges scale={1} threshold={15} color="#1e293b" raycast={NOOP_RAYCAST} />
      </mesh>
    );
  }

  // 3) STANDART PARAMETRİK KUTU PANEL (Dünya-Uzayı UV + Damar Yönü Destekli)
  const boxSizeM: [number, number, number] = [
    Math.max(0.002, panel.boxSizeMm[0] * MM_TO_M - COPLANAR_INSET_M),
    Math.max(0.002, panel.boxSizeMm[1] * MM_TO_M - COPLANAR_INSET_M),
    Math.max(0.002, panel.boxSizeMm[2] * MM_TO_M - COPLANAR_INSET_M),
  ];

  const boxGeom = useMemo(
    () => createWorldSpaceBoxGeometry(boxSizeM, panel.grainAxis),
    [boxSizeM[0], boxSizeM[1], boxSizeM[2], panel.grainAxis]
  );

  const isBackPanel = panel.materialSlot === 'back';
  const isInternalShelf = panel.role === 'shelf';

  return (
    <mesh
      geometry={boxGeom}
      position={posM}
      rotation={[0, panel.rotationYRad, 0]}
      castShadow={!isBackPanel}
      receiveShadow
      raycast={isInternalShelf || dimmedForDoorEditor ? NOOP_RAYCAST : MESH_RAYCAST}
      onClick={
        isInternalShelf || dimmedForDoorEditor
          ? undefined
          : (e) => {
              e.stopPropagation();
            }
      }
    >
      <meshStandardMaterial
        key={`carcass-panel-${matId}-${dimmedForDoorEditor}-${renderQualityMode}-${wireframeMode}`}
        color={woodTexture ? '#ffffff' : matDef.baseHex}
        map={woodTexture}
        bumpMap={isBackPanel ? null : woodBump}
        bumpScale={woodBump && !isBackPanel ? 0.0012 : 0}
        roughness={isBackPanel ? 0.8 : matDef.roughness}
        metalness={matDef.metalness}
        envMapIntensity={renderQualityMode === 'presentation' ? 1.15 : 0.85}
        transparent={dimmedForDoorEditor}
        opacity={dimmedForDoorEditor ? 0.6 : 1}
        wireframe={wireframeMode}
      />
      {(renderQualityMode === 'edit' || isHighlightedBay || wireframeMode) && <Edges
        scale={1}
        threshold={15}
        color={isHighlightedBay ? '#0284c7' : '#1e293b'}
        raycast={NOOP_RAYCAST}
      />}
    </mesh>
  );
}
