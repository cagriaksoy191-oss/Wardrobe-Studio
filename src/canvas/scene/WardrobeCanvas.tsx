import {
  ContactShadows,
  Grid,
  OrbitControls,
  OrthographicCamera,
  PerspectiveCamera,
} from '@react-three/drei';
import { Canvas, type ThreeEvent, useFrame, useThree } from '@react-three/fiber';
import { BoxSelect, DoorOpen, Lightbulb, RotateCcw, Shirt, Sparkles, X } from 'lucide-react';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import type { ResolvedCell } from '../../core/schema/types';
import { analyzeSelectedCellsGroup } from '../../core/solver/treeMutator';
import { type DoorVisibilityMode, type StudioViewMode, useWardrobeStore } from '../../store/useWardrobeStore';
import { runFrontMm } from '../../core/schema/designConstraints';
import {
  ContextualCellPopover,
  type SelectionScreenBounds,
} from '../annotations/ContextualCellPopover';
import { DimensionOverlay } from '../annotations/DimensionOverlay';
import { RunEndAddBayOverlay } from '../annotations/RunEndAddBayOverlay';
import { SelectedCellDimensionOverlay } from '../annotations/SelectedCellDimensionOverlay';
import { getOrCreateStudioEnvMap } from '../materials/materialRegistry';
import { WardrobeMeshGroup } from '../wardrobe/WardrobeMeshGroup';
import { AnalysisOverlays, AnalysisToolbar } from './AnalysisOverlays';
import { eyeCameraPose } from '../../core/analysis/studioAnalysis';
import { MotionController, SlidingRails, motionRuntime } from './MotionController';
import { slidingCellHasOpening } from '../../core/analysis/motionConstraints';
import { CanvasCapture } from './CanvasCapture';
import { PresentationOcclusion } from './PresentationOcclusion';

const MM_TO_M = 0.001;

function FrameSample({ output }: { output: React.RefObject<HTMLOutputElement | null> }) {
  const samples = useRef<number[]>([]);
  const foreground = useRef<boolean | null>(null);
  useFrame(({ gl }, delta) => {
    const active = document.visibilityState === 'visible' && document.hasFocus();
    if (foreground.current !== active) {
      foreground.current = active;
      samples.current = [];
      if (output.current) output.current.textContent = '180 kare ölçülüyor';
      return;
    }
    samples.current.push(delta * 1000);
    if (samples.current.length < 180) return;
    const sorted = samples.current.sort((a, b) => a - b);
    const p50 = sorted[90], p95 = sorted[171];
    if (output.current) {
      const canvas = gl.domElement;
      const seconds = sorted.reduce((sum, ms) => sum + ms, 0) / 1000;
      output.current.textContent = `180 kare / ${seconds.toFixed(2)} sn · p50 ${p50.toFixed(1)} ms · p95 ${p95.toFixed(1)} ms · ${canvas.width}×${canvas.height} px · ${document.visibilityState} · ${active ? 'ön plan odağı var' : 'ön plan odağı yok'}`;
    }
    samples.current = [];
  });
  return null;
}

function isCellCurrentlySelectable(
  cell: ResolvedCell,
  doorVisibilityMode: DoorVisibilityMode,
  openDoorIds: Record<string, boolean>
): boolean {
  if (cell.insert?.type === 'drawerBank') return false;
  const coveringDoors = (cell.coveringDoorIds ?? []).filter(id=>!id.startsWith('slide-'));
  if(doorVisibilityMode==='normal'&&!slidingCellHasOpening(useWardrobeStore.getState().resolved,motionRuntime.positions,cell))return false;
  if (
    doorVisibilityMode === 'normal' &&
    coveringDoors.length > 0 &&
    !coveringDoors.some((doorId) => Boolean(openDoorIds[doorId]))
  ) {
    return false;
  }
  return true;
}

function doesCellIntersectScreenRect(
  cell: ResolvedCell,
  camera: THREE.Camera,
  canvasWidth: number,
  canvasHeight: number,
  rectMinX: number,
  rectMinY: number,
  rectMaxX: number,
  rectMaxY: number
): boolean {
  const samplePointsWorldM: THREE.Vector3[] = [];
  const cx = cell.worldCenterMm[0] * MM_TO_M;
  const cy = cell.worldCenterMm[1] * MM_TO_M;
  const cz = cell.worldCenterMm[2] * MM_TO_M;

  const halfW = cell.netWidthMm * MM_TO_M * 0.36;
  const halfH = cell.netHeightMm * MM_TO_M * 0.36;
  const halfD = cell.netDepthMm * MM_TO_M * 0.45;

  if (cell.subIntervalKind === 'cornerInterval') {
    samplePointsWorldM.push(
      new THREE.Vector3(cx, cy, cz),
      new THREE.Vector3(cx, cy - halfH, cz),
      new THREE.Vector3(cx, cy + halfH, cz)
    );
  } else if (cell.wallAxis === 'A') {
    const frontZ = cz + halfD;
    for (const dx of [-halfW, 0, halfW]) {
      for (const dy of [-halfH, 0, halfH]) {
        samplePointsWorldM.push(new THREE.Vector3(cx + dx, cy + dy, frontZ));
      }
    }
  } else {
    const frontX = cx + halfD;
    for (const dz of [-halfW, 0, halfW]) {
      for (const dy of [-halfH, 0, halfH]) {
        samplePointsWorldM.push(new THREE.Vector3(frontX, cy + dy, cz + dz));
      }
    }
  }

  let cellMinX = Number.POSITIVE_INFINITY;
  let cellMaxX = Number.NEGATIVE_INFINITY;
  let cellMinY = Number.POSITIVE_INFINITY;
  let cellMaxY = Number.NEGATIVE_INFINITY;

  const tempVec = new THREE.Vector3();
  for (const pt of samplePointsWorldM) {
    tempVec.copy(pt).project(camera);
    if (tempVec.z < -1 || tempVec.z > 1) continue;
    const sx = ((tempVec.x + 1) * 0.5) * canvasWidth;
    const sy = ((-tempVec.y + 1) * 0.5) * canvasHeight;
    cellMinX = Math.min(cellMinX, sx);
    cellMaxX = Math.max(cellMaxX, sx);
    cellMinY = Math.min(cellMinY, sy);
    cellMaxY = Math.max(cellMaxY, sy);

    if (sx >= rectMinX && sx <= rectMaxX && sy >= rectMinY && sy <= rectMaxY) {
      return true;
    }
  }

  if (!Number.isFinite(cellMinX)) return false;

  const overlapsX = cellMinX <= rectMaxX && cellMaxX >= rectMinX;
  const overlapsY = cellMinY <= rectMaxY && cellMaxY >= rectMinY;
  return overlapsX && overlapsY;
}

interface Saved3DCameraState {
  position: [number, number, number];
  target: [number, number, number];
}

type OrthographicMode = Exclude<StudioViewMode, '3d-perspective'>;
type OrthographicPose = Saved3DCameraState & { zoom: number };

function OrthographicStudioView({ mode, defaults, poses, enabled }: {
  mode: OrthographicMode;
  defaults: OrthographicPose;
  poses: React.RefObject<Partial<Record<OrthographicMode, OrthographicPose>>>;
  enabled: boolean;
}) {
  const camera = useRef<THREE.OrthographicCamera>(null);
  const controls = useRef<OrbitControlsImpl>(null);
  const initial = useRef(poses.current[mode] ?? defaults);
  const reset = useWardrobeStore(state => state.cameraResetTick);
  const previousReset = useRef(reset);
  useLayoutEffect(() => {
    if (reset === previousReset.current) return;
    previousReset.current = reset;
    if (!camera.current || !controls.current) return;
    camera.current.position.set(...defaults.position);
    camera.current.zoom = defaults.zoom;
    camera.current.updateProjectionMatrix();
    controls.current.target.set(...defaults.target);
    controls.current.update();
    poses.current[mode] = defaults;
  }, [reset, defaults, mode, poses]);
  useFrame(() => {
    if (!camera.current || controls.current?.object !== camera.current) return;
    poses.current[mode] = {
      position: camera.current.position.toArray(),
      target: controls.current.target.toArray(),
      zoom: camera.current.zoom,
    };
  });
  return <>
    <OrthographicCamera ref={camera} makeDefault position={initial.current.position} zoom={initial.current.zoom}
      up={mode === '2d-plan-top' ? [0, 0, -1] : [0, 1, 0]} near={0.1} far={30} />
    <OrbitControls ref={controls} makeDefault enabled={enabled} target={initial.current.target}
      enableRotate={false} enableDamping />
  </>;
}

function SceneCameraAndSelectionTracker({
  cameraRef,
  orbitControls3DRef,
  saved3DCameraStateRef,
  default3DPosition,
  default3DTarget,
  onUpdateScreenBounds,
}: {
  cameraRef: React.MutableRefObject<THREE.Camera | null>;
  orbitControls3DRef: React.MutableRefObject<OrbitControlsImpl | null>;
  saved3DCameraStateRef: React.MutableRefObject<Saved3DCameraState | null>;
  default3DPosition: [number, number, number];
  default3DTarget: [number, number, number];
  onUpdateScreenBounds: (bounds: SelectionScreenBounds | null) => void;
}) {
  const { camera, size } = useThree();
  const resolved = useWardrobeStore((s) => s.resolved);
  const viewMode = useWardrobeStore((s) => s.viewMode);
  const cameraResetTick = useWardrobeStore((s) => s.cameraResetTick);
  const selectedBayId = useWardrobeStore((s) => s.selectedBayId);
  const selectedCellId = useWardrobeStore((s) => s.selectedCellId);
  const selectedCellIds = useWardrobeStore((s) => s.selectedCellIds);
  const selectedDrawerId = useWardrobeStore((s) => s.selectedDrawerId);
  const selectedDrawerIds = useWardrobeStore((s) => s.selectedDrawerIds);
  const doorEditorMode = useWardrobeStore((s) => s.doorEditorMode);
  const selectedDoorId = useWardrobeStore((s) => s.selectedDoorId);
  const selectedDoorIds = useWardrobeStore((s) => s.selectedDoorIds);

  const lastBoundsRef = useRef<string>('');
  const lastViewModeRef = useRef<string>(viewMode);
  const lastResetTickRef = useRef<number>(cameraResetTick);
  const eyeCameraTick = useWardrobeStore(s=>s.eyeCameraTick);
  const lastEyeTickRef = useRef(0);

  useEffect(()=>{
    if(eyeCameraTick===lastEyeTickRef.current || viewMode!=='3d-perspective' || !(camera as THREE.PerspectiveCamera).isPerspectiveCamera) return;
    const state=useWardrobeStore.getState();
    if(!state.eyeLevelOwner) {lastEyeTickRef.current=eyeCameraTick;return;}
    const pose=eyeCameraPose(state.design,state.eyeLevelOwner);
    camera.position.set(...pose.positionMm.map(v=>v*MM_TO_M) as [number,number,number]);
    const target=new THREE.Vector3(...pose.targetMm.map(v=>v*MM_TO_M) as [number,number,number]);
    camera.lookAt(target);
    orbitControls3DRef.current?.target.copy(target);
    orbitControls3DRef.current?.update();
    saved3DCameraStateRef.current={position:[camera.position.x,camera.position.y,camera.position.z],target:[target.x,target.y,target.z]};
    lastEyeTickRef.current=eyeCameraTick;
  },[eyeCameraTick,viewMode,camera,orbitControls3DRef,saved3DCameraStateRef]);

  useEffect(() => {
    cameraRef.current = camera;
  }, [camera, cameraRef]);

  // 3D görünüme geri dönüldüğünde kaydedilmiş 3D kamera açısını ve hedefini geri yükle
  useEffect(() => {
    if (viewMode === '3d-perspective' && !(camera as THREE.PerspectiveCamera).isPerspectiveCamera) return;
    if (viewMode === '3d-perspective' && lastViewModeRef.current !== '3d-perspective') {
      const saved = saved3DCameraStateRef.current;
      if (saved && camera) {
        camera.position.set(saved.position[0], saved.position[1], saved.position[2]);
        camera.updateProjectionMatrix();
        if (orbitControls3DRef.current) {
          orbitControls3DRef.current.target.set(
            saved.target[0],
            saved.target[1],
            saved.target[2]
          );
          orbitControls3DRef.current.update();
        }
      }
    }
    lastViewModeRef.current = viewMode;
  }, [viewMode, camera, orbitControls3DRef, saved3DCameraStateRef]);

  // Kullanıcı "Görünümü Sıfırla" butonuna bastığında 3D kamerayı varsayılan başlangıç açısına döndür
  useEffect(() => {
    if (viewMode === '3d-perspective' && !(camera as THREE.PerspectiveCamera).isPerspectiveCamera) return;
    if (cameraResetTick !== lastResetTickRef.current) {
      lastResetTickRef.current = cameraResetTick;
      if (viewMode !== '3d-perspective') return;
      saved3DCameraStateRef.current = {
        position: [...default3DPosition],
        target: [...default3DTarget],
      };
      if (viewMode === '3d-perspective' && camera) {
        camera.position.set(
          default3DPosition[0],
          default3DPosition[1],
          default3DPosition[2]
        );
        camera.updateProjectionMatrix();
        if (orbitControls3DRef.current) {
          orbitControls3DRef.current.target.set(
            default3DTarget[0],
            default3DTarget[1],
            default3DTarget[2]
          );
          orbitControls3DRef.current.update();
        }
      }
    }
  }, [
    cameraResetTick,
    viewMode,
    camera,
    default3DPosition,
    default3DTarget,
    orbitControls3DRef,
    saved3DCameraStateRef,
  ]);

  useFrame(() => {
    cameraRef.current = camera;

    // 3D moddayken anlık kamera konumunu ve hedefini sakla (2D'ye geçip dönüldüğünde korunması için)
    if (viewMode === '3d-perspective' && (camera as THREE.PerspectiveCamera).isPerspectiveCamera && orbitControls3DRef.current) {
      const tgt = orbitControls3DRef.current.target;
      saved3DCameraStateRef.current = {
        position: [camera.position.x, camera.position.y, camera.position.z],
        target: [tgt.x, tgt.y, tgt.z],
      };
    }

    if (size.width <= 0 || size.height <= 0) return;

    let boxCenterMm: [number, number, number] | null = null;
    let boxDimsMm: [number, number, number] | null = null;
    let isRunA = true;

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

    if (doorEditorMode) {
      const door =
        resolved.doors.find((d) => d.id === activeDoorIds[0]) ?? resolved.slidingDoors?.find(d=>d.id===activeDoorIds[0]) ??
        resolved.doors.find((d) => d.bayId === selectedBayId);
      const bay =
        resolved.bays.find((b) => b.id === (door?.bayId ?? selectedBayId)) ??
        resolved.bays[0];
      const panel = door && resolved.panels.find(part => part.animatedUnitId === door.id);
      if (panel) {
        const [w, h, d] = panel.boxSizeMm;
        const cos = Math.abs(Math.cos(panel.rotationYRad));
        const sin = Math.abs(Math.sin(panel.rotationYRad));
        boxCenterMm = panel.worldPositionMm;
        boxDimsMm = [w * cos + d * sin, h, d * cos + w * sin];
        isRunA = true;
      } else if (bay) {
        boxCenterMm = bay.worldCenterMm;
        boxDimsMm = bay.worldSizeMm;
        isRunA = true;
      }
    } else if (activeDrawerIds.length > 0) {
      const drw = resolved.drawers.find((d) => d.id === activeDrawerIds[0]);
      if (drw) {
        boxCenterMm = drw.boxWorldPositionMm;
        boxDimsMm = [drw.widthMm, drw.heightMm, drw.depthMm];
        isRunA = drw.wallAxis === 'A';
      }
    } else if (activeCellIds.length > 0) {
      const group = analyzeSelectedCellsGroup(activeCellIds, resolved);
      if (group.cells.length > 0) {
        boxCenterMm = group.groupWorldCenterMm;
        boxDimsMm = [group.grossWidthMm, group.grossHeightMm, group.netDepthMm];
        isRunA = group.wallAxis !== 'B';
      }
    }

    if (!boxCenterMm || !boxDimsMm) {
      if (lastBoundsRef.current !== 'null') {
        lastBoundsRef.current = 'null';
        onUpdateScreenBounds(null);
      }
      return;
    }

    const [cx, cy, cz] = boxCenterMm;
    const halfW = (boxDimsMm[0] * MM_TO_M) / 2;
    const halfH = (boxDimsMm[1] * MM_TO_M) / 2;
    const halfD = (boxDimsMm[2] * MM_TO_M) / 2;
    const centerM = new THREE.Vector3(cx * MM_TO_M, cy * MM_TO_M, cz * MM_TO_M);

    const corners: THREE.Vector3[] = [];
    for (const sx of [-1, 1]) {
      for (const sy of [-1, 1]) {
        for (const sz of [-1, 1]) {
          corners.push(
            new THREE.Vector3(
              centerM.x + sx * (isRunA ? halfW : halfD),
              centerM.y + sy * halfH,
              centerM.z + sz * (isRunA ? halfD : halfW)
            )
          );
        }
      }
    }

    let minX = Number.POSITIVE_INFINITY;
    let maxX = Number.NEGATIVE_INFINITY;
    let minY = Number.POSITIVE_INFINITY;
    let maxY = Number.NEGATIVE_INFINITY;

    const temp = new THREE.Vector3();
    for (const pt of corners) {
      temp.copy(pt).project(camera);
      const px = ((temp.x + 1) * 0.5) * size.width;
      const py = ((-temp.y + 1) * 0.5) * size.height;
      minX = Math.min(minX, px);
      maxX = Math.max(maxX, px);
      minY = Math.min(minY, py);
      maxY = Math.max(maxY, py);
    }

    const roundedBounds: SelectionScreenBounds = {
      minX: Math.round(minX),
      maxX: Math.round(maxX),
      minY: Math.round(minY),
      maxY: Math.round(maxY),
      centerX: Math.round((minX + maxX) / 2),
      centerY: Math.round((minY + maxY) / 2),
      canvasWidth: Math.round(size.width),
      canvasHeight: Math.round(size.height),
    };

    const sig = `${Math.round(roundedBounds.minX / 3)},${Math.round(roundedBounds.maxX / 3)},${Math.round(roundedBounds.centerY / 3)},${roundedBounds.canvasWidth},${roundedBounds.canvasHeight}`;
    if (sig !== lastBoundsRef.current) {
      lastBoundsRef.current = sig;
      onUpdateScreenBounds(roundedBounds);
    }
  });

  return null;
}

interface MarqueeDragState {
  pointerId: number;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  isDragging: boolean;
  additive: boolean;
}

function StudioEnvironmentController({ presentation }: { presentation: boolean }) {
  const { scene, gl } = useThree();
  useEffect(() => {
    const envTex = getOrCreateStudioEnvMap();
    if (envTex) {
      scene.environment = envTex;
    }
  }, [scene]);
  useLayoutEffect(() => {
    scene.environmentIntensity = presentation ? 1.12 : 1;
    gl.toneMappingExposure = presentation ? 1.08 : 1;
  }, [presentation, scene, gl]);
  return null;
}

function FitPerspectiveWidth() {
  const { camera, size } = useThree();
  useLayoutEffect(() => {
    if (!(camera instanceof THREE.PerspectiveCamera)) return;
    camera.zoom = Math.min(1, size.width / Math.max(1, size.height) / 1.12);
    camera.updateProjectionMatrix();
  }, [camera, size.width, size.height]);
  return null;
}

export function WardrobeCanvas() {
  const design = useWardrobeStore((s) => s.design);
  const resolved = useWardrobeStore((s) => s.resolved);
  const viewMode = useWardrobeStore((s) => s.viewMode);
  const doorVisibilityMode = useWardrobeStore((s) => s.doorVisibilityMode);
  const renderQualityMode = useWardrobeStore((s) => s.renderQualityMode);
  const openDoorIds = useWardrobeStore((s) => s.openDoorIds);
  const openDrawerIds = useWardrobeStore((s) => s.openDrawerIds);
  const showDimensions = useWardrobeStore((s) => s.showDimensions);
  const wireframeMode = useWardrobeStore((s) => s.wireframeMode);
  const selectedBayId = useWardrobeStore((s) => s.selectedBayId);
  const selectedCellId = useWardrobeStore((s) => s.selectedCellId);
  const selectedCellIds = useWardrobeStore((s) => s.selectedCellIds);
  const selectedDrawerId = useWardrobeStore((s) => s.selectedDrawerId);
  const selectedDrawerIds = useWardrobeStore((s) => s.selectedDrawerIds);
  const doorEditorMode = useWardrobeStore((s) => s.doorEditorMode);
  const selectedDoorId = useWardrobeStore((s) => s.selectedDoorId);
  const selectedDoorIds = useWardrobeStore((s) => s.selectedDoorIds);
  const hoveredMarqueeCellIds = useWardrobeStore((s) => s.hoveredMarqueeCellIds);
  const multiSelectToolActive = useWardrobeStore((s) => s.multiSelectToolActive);
  const resizeDraft = useWardrobeStore((s) => s.resizeDraft);
  const eyeLevelOwner = useWardrobeStore(s=>s.eyeLevelOwner);
  const isPartDragging = useWardrobeStore(s=>s.isPartDragging);

  const selectBay = useWardrobeStore((s) => s.selectBay);
  const selectCell = useWardrobeStore((s) => s.selectCell);
  const selectDrawer = useWardrobeStore((s) => s.selectDrawer);
  const selectDoor = useWardrobeStore((s) => s.selectDoor);
  const setSelectedCells = useWardrobeStore((s) => s.setSelectedCells);
  const setHoveredMarqueeCells = useWardrobeStore((s) => s.setHoveredMarqueeCells);
  const setMultiSelectToolActive = useWardrobeStore((s) => s.setMultiSelectToolActive);
  const setDoorEditorMode = useWardrobeStore((s) => s.setDoorEditorMode);
  const setRenderQualityMode = useWardrobeStore((s) => s.setRenderQualityMode);
  const setLedLighting = useWardrobeStore((s) => s.setLedLighting);
  const setInteriorItemsConfig = useWardrobeStore((s) => s.setInteriorItemsConfig);
  const clearCellSelection = useWardrobeStore((s) => s.clearCellSelection);
  const toggleDoor = useWardrobeStore((s) => s.toggleDoor);
  const toggleDrawer = useWardrobeStore((s) => s.toggleDrawer);
  const triggerCameraReset = useWardrobeStore((s) => s.triggerCameraReset);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const toolbarRef = useRef<HTMLDivElement | null>(null);
  const [runAddDock, setRunAddDock] = useState<HTMLDivElement | null>(null);
  useLayoutEffect(() => {
    const scene = containerRef.current;
    const toolbar = toolbarRef.current;
    if (!scene || !toolbar) return;
    const update = () => scene.style.setProperty('--scene-toolbar-bottom', `${toolbar.offsetTop + toolbar.offsetHeight + 8}px`);
    const observer = new ResizeObserver(update);
    observer.observe(toolbar);
    update();
    return () => observer.disconnect();
  }, []);
  const cameraRef = useRef<THREE.Camera | null>(null);
  const orbitControls3DRef = useRef<OrbitControlsImpl | null>(null);
  const saved3DCameraStateRef = useRef<Saved3DCameraState | null>(null);
  const orthographicPoses = useRef<Partial<Record<OrthographicMode, OrthographicPose>>>({});
  const marqueeRef = useRef<MarqueeDragState | null>(null);
  const suppressNextClickRef = useRef<boolean>(false);

  const [marqueeBox, setMarqueeBox] = useState<{
    left: number;
    top: number;
    width: number;
    height: number;
  } | null>(null);
  const [orbitPausedForMarquee, setOrbitPausedForMarquee] = useState<boolean>(false);
  const [selectionScreenBounds, setSelectionScreenBounds] =
    useState<SelectionScreenBounds | null>(null);
  const [presentationGuides, setPresentationGuides] = useState(false);
  const presentation = renderQualityMode === 'presentation';
  const cleanPresentation = presentation && !presentationGuides;

  const runA = design.runs.find((r) => r.wallAxis === 'A') ?? design.runs[0];
  const runB = design.runs.find((r) => r.wallAxis === 'B');

  const lenAM = (runA?.lengthMm ?? 2800) * MM_TO_M;
  const lenBM = design.layoutKind === 'l-shape' && runB ? runB.lengthMm * MM_TO_M : 0.8;
  const heightM = (runA?.heightMm ?? 2400) * MM_TO_M;
  const roomHeightM = design.roomHeightMm * MM_TO_M;

  const centerXM = lenAM / 2;
  const centerYM = heightM / 2;
  const sceneDepthM = design.layoutKind === 'l-shape' ? lenBM : (runA ? runFrontMm(runA) : 600) * MM_TO_M;
  const centerZM = sceneDepthM / 2;
  const radiusM = Math.hypot(lenAM, heightM, sceneDepthM) / 2;
  const cameraDistanceM = radiusM / Math.sin(42 * Math.PI / 360) * 1.1;
  const cameraDirection = new THREE.Vector3(design.layoutKind === 'l-shape' ? 1 : 0.55, 0.65, 1).normalize();
  const default3DPosition: [number, number, number] = [
    centerXM + cameraDirection.x * cameraDistanceM,
    centerYM + cameraDirection.y * cameraDistanceM,
    centerZM + cameraDirection.z * cameraDistanceM,
  ];
  const default3DTarget: [number, number, number] = [centerXM, centerYM, centerZM];

  const initial3DCameraPos = saved3DCameraStateRef.current?.position ?? default3DPosition;
  const initial3DCameraTarget = saved3DCameraStateRef.current?.target ?? default3DTarget;
  const orthographicDefaults: Record<OrthographicMode, OrthographicPose> = {
    '2d-front-A': { position: [lenAM / 2, heightM / 2, 5], target: [lenAM / 2, heightM / 2, 0], zoom: 195 },
    '2d-front-B': { position: [5, heightM / 2, lenBM / 2], target: [0, heightM / 2, lenBM / 2], zoom: 195 },
    '2d-plan-top': { position: [lenAM / 2, 6, lenBM / 2], target: [lenAM / 2, 0, lenBM / 2], zoom: 175 },
  };

  const computeCellsInMarquee = useCallback(
    (x1: number, y1: number, x2: number, y2: number): string[] => {
      const container = containerRef.current;
      const camera = cameraRef.current;
      if (!container || !camera) return [];

      const rect = container.getBoundingClientRect();
      const minX = Math.min(x1, x2);
      const maxX = Math.max(x1, x2);
      const minY = Math.min(y1, y2);
      const maxY = Math.max(y1, y2);

      const matchedIds: string[] = [];
      for (const cell of resolved.cells) {
        if (!isCellCurrentlySelectable(cell, doorVisibilityMode, openDoorIds)) {
          continue;
        }
        if (
          doesCellIntersectScreenRect(
            cell,
            camera,
            rect.width,
            rect.height,
            minX,
            minY,
            maxX,
            maxY
          )
        ) {
          matchedIds.push(cell.id);
        }
      }
      return matchedIds;
    },
    [resolved.cells, doorVisibilityMode, openDoorIds]
  );

  const handleCellPointerDown = useCallback(
    (cellId: string, _bayId: string, e: ThreeEvent<PointerEvent>) => {
      if (e.button !== 0 || marqueeRef.current) return;
      const isAlreadySelected =
        selectedCellIds.includes(cellId) || selectedCellId === cellId;
      if (!isAlreadySelected && !multiSelectToolActive && !e.shiftKey) {
        return;
      }

      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const localX = e.nativeEvent.clientX - rect.left;
      const localY = e.nativeEvent.clientY - rect.top;

      marqueeRef.current = {
        pointerId: e.pointerId,
        startX: localX,
        startY: localY,
        currentX: localX,
        currentY: localY,
        isDragging: false,
        additive: Boolean(e.shiftKey || e.ctrlKey || e.metaKey),
      };
      setOrbitPausedForMarquee(true);
    },
    [selectedCellIds, selectedCellId, multiSelectToolActive]
  );

  const handleContainerPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (cleanPresentation) return;
    if (e.button !== 0 || marqueeRef.current || !(e.target instanceof HTMLCanvasElement)) return;
    if (!multiSelectToolActive && !e.shiftKey) return;

    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const localX = e.clientX - rect.left;
    const localY = e.clientY - rect.top;

    marqueeRef.current = {
      pointerId: e.pointerId,
      startX: localX,
      startY: localY,
      currentX: localX,
      currentY: localY,
      isDragging: false,
      additive: Boolean(e.shiftKey || e.ctrlKey || e.metaKey),
    };
    setOrbitPausedForMarquee(true);
  };

  useEffect(() => {
    const clearMarquee = () => {
      marqueeRef.current = null;
      setMarqueeBox(null);
      setOrbitPausedForMarquee(false);
      setHoveredMarqueeCells([]);
    };
    const cancelMarquee = (event: Event) => {
      const drag = marqueeRef.current;
      if (!drag || ('pointerId' in event && event.pointerId !== drag.pointerId)) return;
      clearMarquee();
      suppressNextClickRef.current = false;
    };
    const escapeMarquee = (event: KeyboardEvent) => {
      if (event.key === 'Escape') cancelMarquee(event);
    };
    const handleWindowPointerMove = (e: PointerEvent) => {
      const m = marqueeRef.current;
      const container = containerRef.current;
      if (!m || !container || e.pointerId !== m.pointerId) return;

      const rect = container.getBoundingClientRect();
      const localX = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
      const localY = Math.max(0, Math.min(rect.height, e.clientY - rect.top));

      m.currentX = localX;
      m.currentY = localY;

      const dist = Math.hypot(localX - m.startX, localY - m.startY);
      if (!m.isDragging && dist > 6) {
        m.isDragging = true;
        suppressNextClickRef.current = true;
      }

      if (m.isDragging) {
        const left = Math.min(m.startX, localX);
        const top = Math.min(m.startY, localY);
        const width = Math.abs(localX - m.startX);
        const height = Math.abs(localY - m.startY);
        setMarqueeBox({ left, top, width, height });

        const hits = computeCellsInMarquee(m.startX, m.startY, localX, localY);
        setHoveredMarqueeCells(hits);
      }
    };

    const handleWindowPointerUp = (e: PointerEvent) => {
      const m = marqueeRef.current;
      if (!m || e.pointerId !== m.pointerId) return;

      if (m.isDragging) {
        const hits = computeCellsInMarquee(m.startX, m.startY, m.currentX, m.currentY);
        if (m.additive) {
          const combined = Array.from(new Set([...selectedCellIds, ...hits]));
          setSelectedCells(combined);
        } else if (hits.length > 0) {
          setSelectedCells(hits);
        } else {
          setHoveredMarqueeCells([]);
        }
        setTimeout(() => {
          suppressNextClickRef.current = false;
        }, 60);
      } else {
        setHoveredMarqueeCells([]);
      }

      clearMarquee();
    };

    window.addEventListener('pointermove', handleWindowPointerMove);
    window.addEventListener('pointerup', handleWindowPointerUp);
    window.addEventListener('pointercancel', cancelMarquee);
    window.addEventListener('blur', cancelMarquee);
    window.addEventListener('keydown', escapeMarquee);
    return () => {
      window.removeEventListener('pointermove', handleWindowPointerMove);
      window.removeEventListener('pointerup', handleWindowPointerUp);
      window.removeEventListener('pointercancel', cancelMarquee);
      window.removeEventListener('blur', cancelMarquee);
      window.removeEventListener('keydown', escapeMarquee);
    };
  }, [computeCellsInMarquee, selectedCellIds, setHoveredMarqueeCells, setSelectedCells]);

  // Esc tuşu ile aktif taslağı, kapak düzenleme modunu veya seçimi temizleme
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        const st = useWardrobeStore.getState();
        if (st.resizeDraft) {
          st.cancelResizeDraft();
        } else if (st.doorEditorMode) {
          st.setDoorEditorMode(false);
        } else if (st.multiSelectToolActive) {
          st.setMultiSelectToolActive(false);
        } else {
          st.clearCellSelection();
        }
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  const frameSampleOutput = useRef<HTMLOutputElement>(null);
  const showFrameSample = import.meta.env.DEV && new URLSearchParams(window.location.search).has('qa-performance');
  const controlsEnabled = !orbitPausedForMarquee && (cleanPresentation || !multiSelectToolActive) && !isPartDragging;
  const totalSelectedCount =
    selectedCellIds.length ||
    selectedDrawerIds.length ||
    (selectedCellId ? 1 : 0) ||
    (selectedDrawerId ? 1 : 0);

  return (
    <div
      ref={containerRef}
      onPointerDownCapture={handleContainerPointerDown}
      className={`studio-scene relative h-full w-full bg-slate-950 select-none ${
        multiSelectToolActive && !cleanPresentation ? 'cursor-crosshair' : ''
      }`}
    >
      {showFrameSample && (
        <output ref={frameSampleOutput} id="qa-frame-sample"
          className="pointer-events-none absolute bottom-1 right-1 z-50 rounded bg-slate-950 px-2 text-xs text-white">
          180 kare ölçülüyor
        </output>
      )}
      <Canvas
        shadows
        dpr={[1, 2]}
        onPointerMissed={() => {
          if (suppressNextClickRef.current || cleanPresentation) return;
          clearCellSelection();
        }}
      >
        <color
          attach="background"
          args={[renderQualityMode === 'presentation' ? '#090f1d' : '#0b1120']}
        />
        <StudioEnvironmentController presentation={presentation} />
        {showFrameSample && <FrameSample key={`${viewMode}-${renderQualityMode}-${doorVisibilityMode}`} output={frameSampleOutput} />}
        {renderQualityMode === 'presentation' && viewMode === '3d-perspective' && !wireframeMode && <PresentationOcclusion />}
        <MotionController showContact={!cleanPresentation} />
        <CanvasCapture />
        <SlidingRails />

        <SceneCameraAndSelectionTracker
          cameraRef={cameraRef}
          orbitControls3DRef={orbitControls3DRef}
          saved3DCameraStateRef={saved3DCameraStateRef}
          default3DPosition={default3DPosition}
          default3DTarget={default3DTarget}
          onUpdateScreenBounds={setSelectionScreenBounds}
        />

        {/* KAMERA VE KONTROL KURULUMU (3D Perspektif Açısı 2D Geçişlerinde Korunur) */}
        {viewMode === '3d-perspective' && (
          <>
            <PerspectiveCamera
              makeDefault
              position={initial3DCameraPos}
              fov={42}
              near={0.05}
              far={40}
            />
            <FitPerspectiveWidth />
            <OrbitControls
              ref={orbitControls3DRef}
              makeDefault
              enabled={controlsEnabled}
              target={initial3DCameraTarget}
              enableDamping
              dampingFactor={0.08}
              minDistance={0.8}
              maxDistance={12}
              maxPolarAngle={eyeLevelOwner ? Math.PI / 2 : Math.PI / 2 - 0.01}
            />
          </>
        )}

        {viewMode !== '3d-perspective' && (
          <OrthographicStudioView key={viewMode} mode={viewMode} defaults={orthographicDefaults[viewMode]}
            poses={orthographicPoses} enabled={controlsEnabled} />
        )}

        {/* STÜDYO AYDINLATMASI (Düzenleme Modu vs Profesyonel Sunum Modu) */}
        <ambientLight intensity={presentation ? 0.76 : 0.75} />
        <hemisphereLight
          args={[
            '#fff8f0',
            presentation ? '#827566' : '#1e293b',
            presentation ? 0.88 : 0.65,
          ]}
        />
        <directionalLight
          position={[4.5, 5.5, 5.0]}
          intensity={presentation ? 1.45 : 1.35}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-bias={-0.0002}
        />
        <directionalLight
          position={[-2.5, 3.0, 3.5]}
          intensity={presentation ? 0.72 : 0.45}
          color={renderQualityMode === 'presentation' ? '#ffedd5' : '#ffffff'}
        />

        {/* ODA DUVAR VE ZEMİN REFERANS DÜZLEMLERİ */}
        <group>
          <mesh position={[(lenAM + 0.4) / 2, roomHeightM / 2, -0.012]} receiveShadow>
            <boxGeometry args={[lenAM + 0.4, roomHeightM, 0.02]} />
            <meshStandardMaterial
              color={renderQualityMode === 'presentation' ? '#1e293b' : '#162033'}
              roughness={0.85}
              transparent
              opacity={renderQualityMode === 'presentation' ? 0.88 : 0.55}
            />
          </mesh>

          {design.layoutKind === 'l-shape' && (
            <mesh position={[-0.012, roomHeightM / 2, (lenBM + 0.4) / 2]} receiveShadow>
              <boxGeometry args={[0.02, roomHeightM, lenBM + 0.4]} />
              <meshStandardMaterial
                color={renderQualityMode === 'presentation' ? '#172033' : '#131c2e'}
                roughness={0.85}
                transparent
                opacity={renderQualityMode === 'presentation' ? 0.88 : 0.55}
              />
            </mesh>
          )}

          {renderQualityMode === 'presentation' && (
            <>
              <mesh
                position={[lenAM / 2 + 0.4, -0.003, lenBM / 2 + 0.6]}
                rotation={[-Math.PI / 2, 0, 0]}
                receiveShadow
              >
                <planeGeometry args={[8, 8]} />
                <meshStandardMaterial color="#0f172a" roughness={0.65} metalness={0.08} />
              </mesh>
              <ContactShadows
                position={[lenAM * 0.45, 0.001, lenBM * 0.45]}
                opacity={0.46}
                scale={8}
                blur={1.9}
                far={2.6}
                resolution={512}
                color="#020617"
              />
            </>
          )}

          {!cleanPresentation && <Grid
            position={[2.0, -0.002, 2.0]}
            args={[10, 10]}
            cellSize={0.1}
            cellThickness={renderQualityMode === 'presentation' ? 0.25 : 0.5}
            cellColor="#1e293b"
            sectionSize={1.0}
            sectionThickness={renderQualityMode === 'presentation' ? 0.6 : 1.1}
            sectionColor="#334155"
            fadeDistance={renderQualityMode === 'presentation' ? 8 : 12}
            fadeStrength={1}
          />}
        </group>

        {/* ÇÖZÜLMÜŞ GARDIROP PANELLERİ, KİNEMATİK KAPAK/ÇEKMECELER VE SEÇİM HACİMLERİ */}
        <WardrobeMeshGroup
          panels={resolved.panels}
          bays={resolved.bays}
          cells={resolved.cells}
          doors={resolved.doors}
          slidingDoors={resolved.slidingDoors}
          drawers={resolved.drawers}
          ledStrips={resolved.ledStrips}
          onlyWhenOpenOrGlass={design.ledLighting?.onlyWhenOpenOrGlass}
          interiorItemsConfig={design.interiorItems}
          renderQualityMode={renderQualityMode}
          materials={design.materials}
          wireframeMode={wireframeMode}
          doorVisibilityMode={doorVisibilityMode}
          openDoorIds={openDoorIds}
          openDrawerIds={openDrawerIds}
          selectedBayId={cleanPresentation ? null : selectedBayId}
          selectedCellId={cleanPresentation ? null : selectedCellId}
          selectedCellIds={cleanPresentation ? [] : selectedCellIds}
          selectedDrawerIds={
            cleanPresentation ? [] : selectedDrawerIds.length > 0
              ? selectedDrawerIds
              : selectedDrawerId
                ? [selectedDrawerId]
                : []
          }
          multiSelectToolActive={!cleanPresentation && multiSelectToolActive}
          doorEditorMode={!cleanPresentation && doorEditorMode}
          selectedDoorIds={
            cleanPresentation ? [] : selectedDoorIds.length > 0
              ? selectedDoorIds
              : selectedDoorId
                ? [selectedDoorId]
                : []
          }
          hoveredMarqueeCellIds={cleanPresentation ? [] : hoveredMarqueeCellIds}
          resizeDraft={cleanPresentation ? null : resizeDraft}
          onSelectBay={(bayId) => { if (!cleanPresentation) selectBay(bayId); }}
          onSelectCell={(cellId, bayId, additive) => {
            if (suppressNextClickRef.current || cleanPresentation) return;
            selectCell(cellId, bayId, additive);
          }}
          onSelectDrawer={(drawerId, additive) => {
            if (suppressNextClickRef.current || cleanPresentation) return;
            selectDrawer(drawerId, additive);
          }}
          onSelectDoor={(doorId, bayId, additive) => {
            if (suppressNextClickRef.current || cleanPresentation) return;
            selectDoor(doorId, bayId, additive);
          }}
          onCellPointerDown={cleanPresentation ? undefined : handleCellPointerDown}
          onToggleDoor={toggleDoor}
          onToggleDrawer={toggleDrawer}
        />

        {!cleanPresentation && <AnalysisOverlays />}
        {/* KÜRESEL MİLİMETRİK ÖLÇÜ ÇİZGİLERİ KATMANI */}
        {!cleanPresentation && showDimensions && (
          <DimensionOverlay
            dimensions={resolved.dimensions}
            viewMode={viewMode}
            selectedBayId={selectedBayId}
          />
        )}

        {/* SEÇİLİ HÜCRE / ÇEKMECE / KAPAK ODAKLI X / Y / Z FİZİKSEL ÖLÇÜ ÇİZGİLERİ */}
        {!cleanPresentation && <SelectedCellDimensionOverlay />}

        {/* AŞAMA 2.4: 3D SAHNE UÇLARINDAN YENİ BÖLME EKLEME (+ BUTONU) */}
        {!cleanPresentation && <RunEndAddBayOverlay dock={runAddDock} editorOpen={doorEditorMode || totalSelectedCount > 0} />}
      </Canvas>

      {/* DİKDÖRTGEN ÇOKLU SEÇİM ÇERÇEVESİ */}
      {!cleanPresentation && marqueeBox && (
        <div
          style={{
            left: `${marqueeBox.left}px`,
            top: `${marqueeBox.top}px`,
            width: `${marqueeBox.width}px`,
            height: `${marqueeBox.height}px`,
            border: '2px dashed #020617',
            outline: '1px dashed rgba(248, 250, 252, 0.9)',
            boxShadow: '0 0 0 1px rgba(15, 23, 42, 0.65)',
            backgroundColor: 'rgba(56, 189, 248, 0.04)',
          }}
          className="pointer-events-none absolute z-40 rounded-sm"
        >
          {hoveredMarqueeCellIds.length > 0 && (
            <span className="absolute -top-6 left-0 whitespace-nowrap rounded bg-slate-950/95 px-2 py-0.5 font-mono text-[10px] font-bold text-sky-300 border border-sky-400/50 shadow">
              {hoveredMarqueeCellIds.length} bölme seçiliyor
            </span>
          )}
        </div>
      )}

      {/* SEÇİMİN YANINDA AÇILAN YÜZEN BAĞLAMSAL DÜZENLEME PANELİ */}
      {!cleanPresentation && <ContextualCellPopover screenBounds={selectionScreenBounds} />}
      {!cleanPresentation && <AnalysisToolbar />}

      {/* SAHNE ÜSTÜ SOL: AKTİF GÖRÜNÜM ROZETİ + GÖRÜNÜMÜ SIFIRLA */}
      <div ref={toolbarRef} className="studio-scene-toolbar flex flex-wrap items-start gap-1.5">
      <div className="flex min-w-0 max-w-full flex-wrap items-center gap-x-2 gap-y-1 rounded-lg border border-slate-800 bg-slate-900/95 px-2.5 py-1 text-xs text-slate-300">
        <span className="h-2 w-2 rounded-full bg-emerald-400" />
        <span className="font-semibold text-white">
          {viewMode === '3d-perspective' && '3D Stüdyo'}
          {viewMode === '2d-front-A' && '2D Cephe A'}
          {viewMode === '2d-front-B' && '2D Cephe B'}
          {viewMode === '2d-plan-top' && '2D Üst Plan'}
        </span>
        <span className="text-slate-400">
          <strong className="text-sky-300">{resolved.panelThicknessMm} mm</strong> /{' '}
          <strong className="text-emerald-300">{resolved.backPanelThicknessMm}mm</strong>
        </span>
        <button
          type="button"
          onClick={triggerCameraReset}
          title="Kamerayı varsayılan başlangıç açısına sıfırla"
          className="ml-1 flex items-center gap-1 rounded border border-slate-700 bg-slate-800/90 px-2 py-0.5 text-[10px] font-medium text-slate-200 hover:border-amber-400/60 hover:text-white transition"
        >
          <RotateCcw className="h-3 w-3" />
          Görünümü Sıfırla
        </button>
      </div>

      {/* SAHNE ÜSTÜ SAĞ: SUNUM MODU / LED / 3D EŞYALAR / KAPAK DÜZENLE / ÇOKLU SEÇİM ARACI */}
      <div className="studio-scene-actions">
        <button
          type="button"
          aria-pressed={presentation}
          onClick={() => {
            if (!presentation) setPresentationGuides(false);
            setRenderQualityMode(presentation ? 'edit' : 'presentation');
          }}
          className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold shadow-lg backdrop-blur-md transition ${
            renderQualityMode === 'presentation'
              ? 'border-violet-400 bg-violet-600 text-white'
              : 'border-slate-700 bg-slate-900/90 text-slate-200 hover:border-violet-400/60 hover:bg-slate-800'
          }`}
          title="Düzenleme Modu ve Profesyonel Sunum Modu (Gelişmiş IBL Yansıma ve Temas Gölgeleri) arasında geçiş yapın"
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>{renderQualityMode === 'presentation' ? 'Sunum Modu' : 'Düzenleme Modu'}</span>
        </button>

        {presentation && <button type="button" aria-pressed={presentationGuides}
          className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs"
          onClick={() => setPresentationGuides(!presentationGuides)}>{presentationGuides ? 'Kılavuzları gizle' : 'Kılavuzları göster'}</button>}
        <button
          type="button"
          onClick={() =>
            setLedLighting({ enabled: !(design.ledLighting?.enabled ?? true) })
          }
          className={`flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-semibold shadow-lg backdrop-blur-md transition ${
            (design.ledLighting?.enabled ?? true)
              ? 'border-amber-400/80 bg-amber-500/20 text-amber-200'
              : 'border-slate-700 bg-slate-900/90 text-slate-400 hover:text-slate-200'
          }`}
          aria-pressed={design.ledLighting?.enabled ?? true}
          title="Dolap İçi Şerit LED Aydınlatmayı Aç / Kapat"
        >
          <Lightbulb className="h-3.5 w-3.5" />
          <span>LED</span>
        </button>

        <button
          type="button"
          onClick={() =>
            setInteriorItemsConfig({ enabled: !(design.interiorItems?.enabled ?? true) })
          }
          className={`flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-semibold shadow-lg backdrop-blur-md transition ${
            (design.interiorItems?.enabled ?? true)
              ? 'border-emerald-400/80 bg-emerald-500/20 text-emerald-200'
              : 'border-slate-700 bg-slate-900/90 text-slate-400 hover:text-slate-200'
          }`}
          aria-pressed={design.interiorItems?.enabled ?? true}
          title="3D Kıyafet, Ayakkabı, Çanta ve Hurç Önizlemelerini Göster / Gizle"
        >
          <Shirt className="h-3.5 w-3.5" />
          <span>3D Eşyalar</span>
        </button>

        {!cleanPresentation && <><button
          type="button"
          onClick={() => setDoorEditorMode(!doorEditorMode)}
          className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold shadow-lg backdrop-blur-md transition ${
            doorEditorMode
              ? 'border-amber-400 bg-amber-500 text-slate-950'
              : 'border-slate-700 bg-slate-900/90 text-slate-200 hover:border-amber-400/60 hover:bg-slate-800'
          }`}
          title="Kapak Düzenle Modu: Gövde üzerinde kapak kanatlarını seçin, yatay bölün (üst yüklük + alt kapak), birleştirin veya menteşe yönünü değiştirin"
        >
          <DoorOpen className="h-3.5 w-3.5" />
          <span>{doorEditorMode ? 'Kapak Düzenle Aktif' : 'Kapak Düzenle'}</span>
        </button>

        <button
          type="button"
          onClick={() => setMultiSelectToolActive(!multiSelectToolActive)}
          className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold shadow-lg backdrop-blur-md transition ${
            multiSelectToolActive
              ? 'border-sky-400 bg-sky-500 text-slate-950'
              : 'border-slate-700 bg-slate-900/90 text-slate-200 hover:border-sky-400/60 hover:bg-slate-800'
          }`}
          title="Çoklu Seçim / Düzenleme Aracı: Aktifken dikdörtgen seçim alanı oluşturabilir veya çekmecelere tıklayarak açmak yerine doğrudan çekmeceyi seçip düzenleyebilirsiniz"
        >
          <BoxSelect className="h-3.5 w-3.5" />
          <span>{multiSelectToolActive ? 'Çoklu Seçim Aracı Aktif' : 'Çoklu Seçim Aracı'}</span>
        </button>

        {totalSelectedCount > 0 && (
          <button
            type="button"
            onClick={clearCellSelection}
            className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-900/90 px-2.5 py-1.5 text-xs font-medium text-slate-300 shadow-lg backdrop-blur-md hover:border-rose-500/50 hover:text-rose-200 transition"
            title="Seçimi Temizle (Esc)"
          >
            <X className="h-3.5 w-3.5" />
            <span>Seçimi Temizle ({totalSelectedCount})</span>
          </button>
        )}
        </>}
      </div>
      <div ref={setRunAddDock} className="studio-run-add-dock" role="group" aria-label="Kollara bölme ekle" />
      </div>
    </div>
  );
}
