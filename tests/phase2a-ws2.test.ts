import * as THREE from 'three';
import { beforeEach, describe, expect, it } from 'vitest';
import { phase5Example } from '../src/core/presets/phase5Examples';
import { SAMPLE_DESIGNS } from '../src/core/presets/sampleDesigns';
import { solveDesign } from '../src/core/solver/carcassSolver';
import { analyzeSelectedCellsGroup } from '../src/core/solver/treeMutator';
import { useWardrobeStore } from '../src/store/useWardrobeStore';
import {
  computeTotalSelectedCount,
  getCanvasGestureHint,
  resolveStudioOrbitConfig,
} from '../src/canvas/scene/WardrobeCanvas';
import {
  hasOpenSlidingLeaf,
  motionRuntime,
  publishMotionNotice,
} from '../src/canvas/scene/MotionController';
import {
  buildMergedInnerByOuterMap,
  resolveDimensionRenderEndpoints,
} from '../src/canvas/annotations/DimensionOverlay';
import {
  computeRunEndAnchorPositionMm,
  computeRunEndAnchorY,
  filterRunsForRunEndOverlay,
} from '../src/canvas/annotations/RunEndAddBayOverlay';
import {
  computeSlidingLeafDimensionOverlay,
  shouldShowCellDimensionOverlay,
} from '../src/canvas/annotations/SelectedCellDimensionOverlay';
import { resolveSlidingLeafCursor } from '../src/canvas/wardrobe/SlidingLeafInteraction';
import {
  OWNER_BADGES,
  REACH_BADGES,
  SWEEP_BADGES,
  shouldShowCellAnalysisBadge,
} from '../src/canvas/scene/AnalysisOverlays';
import { fitFrontView, furnitureBounds } from '../src/canvas/scene/frontViewFit';

function resetStoreWith(design = structuredClone(SAMPLE_DESIGNS['l-diagonal-asymmetric'])) {
  const resolved = solveDesign(design);
  useWardrobeStore.setState({
    design,
    checkpointDesign: structuredClone(design),
    resolved,
    viewMode: '3d-perspective',
    doorEditorMode: false,
    multiSelectToolActive: false,
    selectedBayId: resolved.bays[0]?.id ?? null,
    selectedCellId: null,
    selectedCellIds: [],
    selectedDrawerId: null,
    selectedDrawerIds: [],
    selectedDoorId: null,
    selectedDoorIds: [],
    openDoorIds: {},
    openDrawerIds: {},
    hasOpenSlidingLeaf: false,
    motionNotice: null,
    motionRecovery: null,
    motionRecoveryOffer: null,
    resizeDraft: null,
  });
  return resolved;
}

describe('Phase 2A WS-2: CAD Interaction, Overlays, Selection & Sliding Parity', () => {
  beforeEach(() => {
    resetStoreWith();
  });

  describe('CAD-01 & CAD-03: 2D left-drag pan, multi-select zoom/pan & gesture hints', () => {
    it('maps LEFT drag to PAN in all 2D orthographic views when marquee is inactive', () => {
      for (const viewMode of ['2d-front-A', '2d-front-B', '2d-plan-top'] as const) {
        const cfg = resolveStudioOrbitConfig({
          viewMode,
          multiSelectToolActive: false,
          cleanPresentation: false,
          orbitPausedForMarquee: false,
          isPartDragging: false,
          modifierMarqueeHeld: false,
        });
        expect(cfg.enabled).toBe(true);
        expect(cfg.enableRotate).toBe(false);
        expect(cfg.enablePan).toBe(true);
        expect(cfg.enableZoom).toBe(true);
        expect(cfg.mouseButtons.LEFT).toBe(THREE.MOUSE.PAN);
        expect(cfg.mouseButtons.MIDDLE).toBe(THREE.MOUSE.DOLLY);
        expect(cfg.mouseButtons.RIGHT).toBe(THREE.MOUSE.PAN);
      }
    });

    it('suppresses LEFT pan when Shift/Ctrl marquee modifier is held in 2D without disabling zoom or right-pan', () => {
      const cfg = resolveStudioOrbitConfig({
        viewMode: '2d-front-A',
        multiSelectToolActive: false,
        cleanPresentation: false,
        orbitPausedForMarquee: false,
        isPartDragging: false,
        modifierMarqueeHeld: true,
      });
      expect(cfg.enabled).toBe(true);
      expect(cfg.mouseButtons.LEFT).toBeUndefined();
      expect(cfg.mouseButtons.RIGHT).toBe(THREE.MOUSE.PAN);
      expect(cfg.enableZoom).toBe(true);
    });

    it('keeps wheel zoom and right-drag pan active during multi-select tool in both 3D and 2D', () => {
      for (const viewMode of ['3d-perspective', '2d-front-A', '2d-plan-top'] as const) {
        const cfg = resolveStudioOrbitConfig({
          viewMode,
          multiSelectToolActive: true,
          cleanPresentation: false,
          orbitPausedForMarquee: false,
          isPartDragging: false,
        });
        expect(cfg.enabled).toBe(true);
        expect(cfg.enableRotate).toBe(false);
        expect(cfg.enableZoom).toBe(true);
        expect(cfg.enablePan).toBe(true);
        expect(cfg.mouseButtons.LEFT).toBeUndefined();
        expect(cfg.mouseButtons.RIGHT).toBe(THREE.MOUSE.PAN);
        expect(cfg.mouseButtons.MIDDLE).toBe(THREE.MOUSE.DOLLY);
      }
    });

    it('produces distinct Turkish mode-aware gesture hints for every interaction mode', () => {
      const normal3D = getCanvasGestureHint({
        viewMode: '3d-perspective',
        doorEditorMode: false,
        multiSelectToolActive: false,
        hasResizeDraft: false,
      });
      const normal2D = getCanvasGestureHint({
        viewMode: '2d-front-A',
        doorEditorMode: false,
        multiSelectToolActive: false,
        hasResizeDraft: false,
      });
      const multi = getCanvasGestureHint({
        viewMode: '3d-perspective',
        doorEditorMode: false,
        multiSelectToolActive: true,
        hasResizeDraft: false,
      });
      const doorEdit = getCanvasGestureHint({
        viewMode: '3d-perspective',
        doorEditorMode: true,
        multiSelectToolActive: false,
        hasResizeDraft: false,
      });
      const draft = getCanvasGestureHint({
        viewMode: '3d-perspective',
        doorEditorMode: false,
        multiSelectToolActive: false,
        hasResizeDraft: true,
      });

      expect(normal3D).toContain('Shift+Tık');
      expect(normal3D).toContain('Sürgü');
      expect(normal2D).toContain('Sol sürükle: Kaydır');
      expect(multi).toContain('Yakınlaştır');
      expect(doorEdit).toContain('Kapak Düzenle');
      expect(draft).toContain('Boyutlandırma');
    });
  });

  describe('CAD-04: Dimension non-collision & run-end + filtering', () => {
    it('merges every bayInner into bayOuter in 2D front views to eliminate pill overlaps', () => {
      const resolved = useWardrobeStore.getState().resolved;
      const runADims = resolved.dimensions.filter(
        (d) => d.kind !== 'depth' && (!d.runId || d.runId === 'run-A')
      );
      const { mergedInnerByOuterId, suppressedInnerIds } = buildMergedInnerByOuterMap(
        runADims,
        '2d-front-A',
        null
      );
      const runAOuter = runADims.filter((d) => d.kind === 'bayOuter');
      const runAInner = runADims.filter((d) => d.kind === 'bayInner');
      expect(runAOuter.length).toBeGreaterThan(0);
      expect(mergedInnerByOuterId.size).toBe(runAInner.length);
      expect(suppressedInnerIds.size).toBe(runAInner.length);
    });

    it('separates 3D depth dimension vertically above the roof away from bottom bayOuter pills', () => {
      const { design, resolved } = useWardrobeStore.getState();
      const depthDim = resolved.dimensions.find((d) => d.kind === 'depth' && d.runId === 'run-A');
      expect(depthDim).toBeDefined();
      const endpoints3D = resolveDimensionRenderEndpoints(depthDim!, '3d-perspective', design.runs);
      const runA = design.runs.find((r) => r.id === 'run-A')!;
      expect(endpoints3D.startMm[1]).toBe(runA.heightMm + 35);
      expect(endpoints3D.endMm[1]).toBe(runA.heightMm + 35);

      const endpointsPlan = resolveDimensionRenderEndpoints(depthDim!, '2d-plan-top', design.runs);
      expect(endpointsPlan.startMm[1]).toBe(depthDim!.startMm[1]);
    });

    it('filters run-end + buttons to the active axis in 2D front views and raises anchor above midpoint', () => {
      const { design } = useWardrobeStore.getState();
      expect(filterRunsForRunEndOverlay(design.runs, 'l-shape', '2d-front-A').map((r) => r.wallAxis)).toEqual(['A']);
      expect(filterRunsForRunEndOverlay(design.runs, 'l-shape', '2d-front-B').map((r) => r.wallAxis)).toEqual(['B']);
      expect(filterRunsForRunEndOverlay(design.runs, 'l-shape', '3d-perspective').map((r) => r.wallAxis)).toEqual(['A', 'B']);
      expect(filterRunsForRunEndOverlay(design.runs, 'l-shape', '2d-plan-top').map((r) => r.wallAxis)).toEqual(['A', 'B']);

      const anchorY = computeRunEndAnchorY(2400);
      expect(anchorY).toBeGreaterThan(1700);
      expect(anchorY).toBeLessThan(2100);
    });

    it('offsets +A and +B anchors clear of Derinlik pills in 2d-plan-top without changing 3D/front positions', () => {
      const { design, resolved } = useWardrobeStore.getState();
      const runA = design.runs.find((r) => r.wallAxis === 'A')!;
      const runB = design.runs.find((r) => r.wallAxis === 'B')!;
      const depthA = resolved.dimensions.find((d) => d.kind === 'depth' && d.runId === runA.id)!;
      const depthB = resolved.dimensions.find((d) => d.kind === 'depth' && d.runId === runB.id)!;
      const depthAMidZ = (depthA.startMm[2] + depthA.endMm[2]) / 2;
      const depthBMidX = (depthB.startMm[0] + depthB.endMm[0]) / 2;

      const planA = computeRunEndAnchorPositionMm(runA, runA.lengthMm, '2d-plan-top');
      const planB = computeRunEndAnchorPositionMm(runB, runB.lengthMm, '2d-plan-top');
      expect(Math.abs(planA[2] - depthAMidZ)).toBeGreaterThanOrEqual(350);
      expect(Math.abs(planB[0] - depthBMidX)).toBeGreaterThanOrEqual(500);

      // 3D and 2D front anchor coordinates remain unchanged.
      const perspA = computeRunEndAnchorPositionMm(runA, runA.lengthMm, '3d-perspective');
      const frontA = computeRunEndAnchorPositionMm(runA, runA.lengthMm, '2d-front-A');
      expect(perspA).toEqual(frontA);
      expect(perspA[0]).toBe(runA.lengthMm + 72);
      expect(perspA[2]).toBe(Math.round(runA.depthMm * 0.55));
    });

    it('reserves >= 120px bottom clearance in 2D front framing so stacked Dış/Net İç pills clear AnalysisToolbar', () => {
      const resolved = useWardrobeStore.getState().resolved;
      const bounds = furnitureBounds(resolved)!;
      for (const [axis, width, height] of [
        ['A', 840, 715],
        ['B', 840, 715],
        ['A', 680, 615],
        ['A', 766, 583],
      ] as const) {
        const pose = fitFrontView(bounds, axis, width, height);
        const camera = new THREE.OrthographicCamera(-width / 2, width / 2, height / 2, -height / 2, 0.1, 30);
        camera.position.set(...pose.position);
        camera.lookAt(new THREE.Vector3(...pose.target));
        camera.zoom = pose.zoom;
        camera.updateProjectionMatrix();
        camera.updateMatrixWorld();

        // Bottom bayOuter pill sits at y = 40 mm (0.04 m) with ~16px half-height; AnalysisToolbar top is ~91px from bottom.
        const pillCenter = new THREE.Vector3(
          (bounds.min[0] + bounds.max[0]) / 2,
          0.04,
          (bounds.min[2] + bounds.max[2]) / 2
        ).project(camera);
        const pillCenterFromBottomPx = ((pillCenter.y + 1) * height) / 2;
        const pillBottomFromCanvasBottomPx = pillCenterFromBottomPx - 16;
        expect(pillBottomFromCanvasBottomPx).toBeGreaterThanOrEqual(91 + 16);
      }
    });
  });

  describe('CAD-05: Sliding-door edit-mode parity', () => {
    it('auto-selects a sliding leaf when entering doorEditorMode on a sliding wardrobe', () => {
      const slidingDesign = phase5Example('straight');
      const resolved = resetStoreWith(slidingDesign);
      expect(resolved.doors.length).toBe(0);
      expect((resolved.slidingDoors ?? []).length).toBeGreaterThan(0);

      useWardrobeStore.getState().setDoorEditorMode(true);
      const next = useWardrobeStore.getState();
      expect(next.doorEditorMode).toBe(true);
      expect(next.selectedDoorId).toBeTruthy();
      expect(resolved.slidingDoors?.some((d) => d.id === next.selectedDoorId)).toBe(true);
    });

    it('computes sliding leaf 3D dimension labels and coordinates (Kanat X, Kanat Y, Ray #)', () => {
      const slidingDesign = phase5Example('straight');
      const resolved = solveDesign(slidingDesign);
      const leaf = resolved.slidingDoors![0];
      const spec = computeSlidingLeafDimensionOverlay(leaf, 0);

      expect(spec.widthMm).toBe(leaf.widthMm);
      expect(spec.heightMm).toBe(leaf.heightMm);
      expect(spec.thicknessMm).toBe(leaf.thicknessMm);
      expect(spec.trackNumber).toBe(leaf.trackIndex + 1);
      expect(spec.widthLabel).toBe(`Kanat X: ${leaf.widthMm} mm · Kalınlık: ${leaf.thicknessMm} mm`);
      expect(spec.heightLabel).toBe(`Kanat Y: ${leaf.heightMm} mm`);
      expect(spec.trackLabel).toBe(`Ray ${leaf.trackIndex + 1}`);
      expect(Math.abs(spec.xEndMm[0] - spec.xStartMm[0])).toBeCloseTo(leaf.widthMm, 3);
      expect(Math.abs(spec.yEndMm[1] - spec.yStartMm[1])).toBeCloseTo(leaf.heightMm, 3);
    });
  });

  describe('CAD-07 & IA-04: Multi-group selection overlay suppression & clean Turkish labels', () => {
    it('suppresses single-cell X/Y/Z overlay for non-contiguous multi-bay selection and strips (Bay)', () => {
      const resolved = useWardrobeStore.getState().resolved;
      const bayA1Cell = resolved.cells.find((c) => c.bayId === 'bay-A1');
      const bayA2Cell = resolved.cells.find((c) => c.bayId === 'bay-A2');
      expect(bayA1Cell).toBeDefined();
      expect(bayA2Cell).toBeDefined();

      const singleGroup = analyzeSelectedCellsGroup([bayA1Cell!.id], resolved);
      expect(shouldShowCellDimensionOverlay(singleGroup)).toBe(true);

      const multiBayGroup = analyzeSelectedCellsGroup([bayA1Cell!.id, bayA2Cell!.id], resolved);
      expect(multiBayGroup.isMultiShelfGroupSelection).toBe(true);
      expect(shouldShowCellDimensionOverlay(multiBayGroup)).toBe(false);
      expect(multiBayGroup.cannotMergeReason).toBeDefined();
      expect(multiBayGroup.cannotMergeReason).not.toContain('(Bay)');
    });
  });

  describe('CAD-08: Live hasOpenSlidingLeaf header sync without altering collision/recovery safety', () => {
    it('tracks manually dragged sliding leaf open state and closes cleanly via setAllDoorsOpen(false)', () => {
      const slidingDesign = phase5Example('straight');
      const resolved = resetStoreWith(slidingDesign);
      motionRuntime.load(slidingDesign, resolved);
      publishMotionNotice();
      expect(useWardrobeStore.getState().hasOpenSlidingLeaf).toBe(false);

      const leaf = resolved.slidingDoors![0];
      const dragTarget = leaf.openOffsetMm !== 0 ? leaf.openOffsetMm : leaf.maxOffsetMm || leaf.minOffsetMm;
      const result = motionRuntime.dragTo(leaf.id, dragTarget);
      expect(Math.abs(result.position)).toBeGreaterThan(10);
      publishMotionNotice();
      expect(hasOpenSlidingLeaf(motionRuntime)).toBe(true);
      expect(useWardrobeStore.getState().hasOpenSlidingLeaf).toBe(true);

      useWardrobeStore.getState().setAllDoorsOpen(false);
      const stateAfterClose = useWardrobeStore.getState();
      for (let i = 0; i < 120; i++) {
        motionRuntime.step(
          0.03,
          stateAfterClose.openDoorIds,
          stateAfterClose.openDrawerIds,
          stateAfterClose.motionCommand
        );
      }
      publishMotionNotice();
      expect(Math.abs(motionRuntime.positions[leaf.id] ?? 0)).toBeLessThan(1);
      expect(useWardrobeStore.getState().hasOpenSlidingLeaf).toBe(false);
    });

    it('resets hasOpenSlidingLeaf to false when loading another preset', () => {
      useWardrobeStore.getState().setHasOpenSlidingLeaf(true);
      expect(useWardrobeStore.getState().hasOpenSlidingLeaf).toBe(true);
      useWardrobeStore.getState().loadPreset('straight-wardrobe');
      expect(useWardrobeStore.getState().hasOpenSlidingLeaf).toBe(false);
    });
  });

  describe('CAD-11, CAD-12 & 7.9: Door selection count, sliding cursor & non-color-only badges', () => {
    it('includes selectedDoorIds in totalSelectedCount and clears them via clearCellSelection', () => {
      const resolved = useWardrobeStore.getState().resolved;
      const door = resolved.doors[0];
      expect(door).toBeDefined();

      useWardrobeStore.getState().selectDoor(door.id, door.bayId ?? null);
      const s = useWardrobeStore.getState();
      expect(
        computeTotalSelectedCount({
          selectedCellIds: s.selectedCellIds,
          selectedCellId: s.selectedCellId,
          selectedDrawerIds: s.selectedDrawerIds,
          selectedDrawerId: s.selectedDrawerId,
          selectedDoorIds: s.selectedDoorIds,
          selectedDoorId: s.selectedDoorId,
        })
      ).toBe(1);

      useWardrobeStore.getState().clearCellSelection();
      const cleared = useWardrobeStore.getState();
      expect(cleared.selectedDoorIds).toEqual([]);
      expect(cleared.selectedDoorId).toBeNull();
    });

    it('resolves ew-resize on draggable hover, grabbing while dragging, and default in restricted modes', () => {
      expect(
        resolveSlidingLeafCursor({ dragging: false, hovered: true, editor: false, multiSelect: false })
      ).toBe('ew-resize');
      expect(
        resolveSlidingLeafCursor({ dragging: true, hovered: true, editor: false, multiSelect: false })
      ).toBe('grabbing');
      expect(
        resolveSlidingLeafCursor({ dragging: false, hovered: true, editor: true, multiSelect: false })
      ).toBe('');
      expect(
        resolveSlidingLeafCursor({ dragging: false, hovered: true, editor: false, multiSelect: true })
      ).toBe('');
      expect(
        resolveSlidingLeafCursor({ dragging: false, hovered: true, editor: false, multiSelect: false, cleanPresentation: true })
      ).toBe('');
      expect(
        resolveSlidingLeafCursor({ dragging: false, hovered: true, editor: false, multiSelect: false, shift: true })
      ).toBe('');
    });

    it('assigns unique non-color symbols and text codes across ownership, ergonomics and sweep overlays', () => {
      const ownerSymbols = new Set(Object.values(OWNER_BADGES).map((b) => b.symbol));
      const ownerCodes = new Set(Object.values(OWNER_BADGES).map((b) => b.code));
      expect(ownerSymbols.size).toBe(3);
      expect(ownerCodes.size).toBe(3);

      const reachSymbols = new Set(Object.values(REACH_BADGES).map((b) => b.symbol));
      const reachCodes = new Set(Object.values(REACH_BADGES).map((b) => b.code));
      expect(reachSymbols.size).toBe(4);
      expect(reachCodes.size).toBe(4);

      const sweepSymbols = new Set(Object.values(SWEEP_BADGES).map((b) => b.symbol));
      expect(sweepSymbols.size).toBe(4);

      expect(shouldShowCellAnalysisBadge('3d-perspective', { netHeightMm: 400, netWidthMm: 500 })).toBe(true);
      expect(shouldShowCellAnalysisBadge('2d-front-A', { netHeightMm: 400, netWidthMm: 500 })).toBe(true);
      expect(shouldShowCellAnalysisBadge('2d-plan-top', { netHeightMm: 400, netWidthMm: 500 })).toBe(false);
    });
  });
});
