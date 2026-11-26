import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { OrthographicCamera, PerspectiveCamera, Vector3 } from 'three';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  computePopoverMaxHeightPx,
  computePopoverPlacement,
} from '../src/canvas/annotations/ContextualCellPopover';
import { resolveDimensionRenderEndpoints } from '../src/canvas/annotations/DimensionOverlay';
import { computeRunEndAnchorPositionMm } from '../src/canvas/annotations/RunEndAddBayOverlay';
import {
  computeHingedDoorDimensionOverlay,
  computeSlidingLeafDimensionOverlay,
  parseOverlayMmDraft,
  shouldShowCellDimensionOverlay,
} from '../src/canvas/annotations/SelectedCellDimensionOverlay';
import { runEndControlsFit } from '../src/canvas/annotations/runEndControlFit';
import { computeTopPlanFit, furnitureBounds } from '../src/canvas/scene/frontViewFit';
import {
  computeDefault3DCameraPose,
  get3DCameraContextKey,
} from '../src/canvas/scene/WardrobeCanvas';
import { phase5Example } from '../src/core/presets/phase5Examples';
import { SAMPLE_DESIGNS } from '../src/core/presets/sampleDesigns';
import { solveDesign } from '../src/core/solver/carcassSolver';
import { defaultSlidingConfig } from '../src/core/solver/slidingSolver';
import { analyzeSelectedCellsGroup } from '../src/core/solver/treeMutator';
import { useWardrobeStore } from '../src/store/useWardrobeStore';
import {
  canIsolateBayFromSharedFront,
  formatSharedFrontScopeSummary,
  resolveActiveDoorInspectorContext,
  splitDoorLeafLabel,
  switchBayFrontType,
} from '../src/ui/DoorInspectorPanel';
import {
  formatFrontEditorError,
  updateSlidingTrackCount,
  validateFrontBaySpanSelection,
} from '../src/ui/FrontSystemEditor';
import {
  flushNumberFieldDraft,
  WARDROBE_FLUSH_DRAFTS_EVENT,
  type FlushDraftsEventDetail,
} from '../src/ui/NumberField';

const worktreeRoot = resolve(__dirname, '..');
const readSrc = (rel: string) => readFileSync(resolve(worktreeRoot, rel), 'utf8');

function resetStore(design = structuredClone(SAMPLE_DESIGNS['straight-wardrobe'])) {
  const resolved = solveDesign(design);
  useWardrobeStore.setState({
    design,
    checkpointDesign: structuredClone(design),
    resolved,
    doorEditorMode: true,
    selectedBayId: resolved.bays[0]?.id ?? null,
    selectedDoorId: resolved.doors[0]?.id ?? resolved.slidingDoors?.[0]?.id ?? null,
    selectedDoorIds: resolved.doors[0]
      ? [resolved.doors[0].id]
      : resolved.slidingDoors?.[0]
        ? [resolved.slidingDoors[0].id]
        : [],
    selectedFrontId: null,
    selectedCellId: null,
    selectedCellIds: [],
    selectedDrawerId: null,
    selectedDrawerIds: [],
    openDoorIds: {},
    openDrawerIds: {},
    historyPast: [],
    historyFuture: [],
    commandError: null,
    resizeDraft: null,
  });
  return { design, resolved };
}

describe('Phase 3 CAD Framing, Contextual Editing, Front Systems & Overlay Numerics', () => {
  beforeEach(() => {
    resetStore();
  });

  describe('CF-01 / PM-02: NumberField synchronous Ctrl+S draft flush', () => {
    it('commits a valid uncommitted draft synchronously without setting hadInvalid', () => {
      const detail: FlushDraftsEventDetail = { hadInvalid: false, firstInvalidEl: null };
      const res = flushNumberFieldDraft('2850', false, 3000, 1200, 6000, detail, null);
      expect(res.action).toBe('commit');
      expect(res.committedValue).toBe(2850);
      expect(res.nextDraft).toBe('2850');
      expect(res.problem).toBeNull();
      expect(detail.hadInvalid).toBe(false);
    });

    it('flags detail.hadInvalid and records firstInvalidEl on invalid/empty/badInput draft', () => {
      const fakeEl = { tagName: 'INPUT' } as unknown as HTMLInputElement;
      const detail: FlushDraftsEventDetail = { hadInvalid: false, firstInvalidEl: null };

      const emptyRes = flushNumberFieldDraft('', false, 3000, 1200, 6000, detail, fakeEl);
      expect(emptyRes.action).toBe('invalid');
      expect(emptyRes.problem).toContain('Boş bırakılamaz');
      expect(detail.hadInvalid).toBe(true);
      expect(detail.firstInvalidEl).toBe(fakeEl);

      const detail2: FlushDraftsEventDetail = { hadInvalid: false, firstInvalidEl: null };
      const oobRes = flushNumberFieldDraft('100', false, 3000, 1200, 6000, detail2, fakeEl);
      expect(oobRes.action).toBe('invalid');
      expect(oobRes.problem).toContain('1200 ile 6000');
      expect(detail2.hadInvalid).toBe(true);
      expect(detail2.firstInvalidEl).toBe(fakeEl);
    });

    it('wires the window wardrobe:flush-drafts listener inside NumberField.tsx', () => {
      const src = readSrc('src/ui/NumberField.tsx');
      expect(WARDROBE_FLUSH_DRAFTS_EVENT).toBe('wardrobe:flush-drafts');
      expect(src).toContain('window.addEventListener(WARDROBE_FLUSH_DRAFTS_EVENT');
      expect(src).toContain('flushNumberFieldDraft');
    });
  });

  describe('CF-02 / CF-06 / CF-07 / CF-11 / CF-12 / CF-15 / CF-17 / CF-19: Front Systems & DoorInspectorPanel', () => {
    it('keeps hybrid vertically-split Açık range selected in store selectedFrontId with zero snap-back (CF-02)', () => {
      const bayId = useWardrobeStore.getState().resolved.bays[0].id;
      useWardrobeStore.getState().splitBayDoorHorizontally(bayId, 1850);

      const afterSplit = useWardrobeStore.getState();
      const bayFronts = afterSplit.design.fronts.filter((f) => f.bayIds.includes(bayId));
      expect(bayFronts.length).toBe(2);
      const upperFront = bayFronts[1]!;

      // Switch upper range to Open
      switchBayFrontType(bayId, upperFront, 'hinged', 'open');
      const afterOpen = useWardrobeStore.getState();
      expect(afterOpen.selectedFrontId).toBe(upperFront.id);
      expect(afterOpen.selectedDoorId).toBeNull();

      // Both DoorInspectorPanel and ContextualCellPopover resolve the EXACT same Açık range
      const ctx = resolveActiveDoorInspectorContext(
        afterOpen.design,
        afterOpen.resolved,
        afterOpen.selectedBayId,
        afterOpen.selectedDoorIds,
        afterOpen.selectedFrontId
      );
      expect(ctx.activeFront?.id).toBe(upperFront.id);
      expect(ctx.activeFrontType).toBe('open');
      expect(ctx.selectedHingedDoor).toBeNull();
    });

    it('detects multi-bay shared front scope summary and isolation eligibility (CF-06)', () => {
      const { design } = resetStore(phase5Example('straight'));
      const run = design.runs[0]!;
      const slidingFront = design.fronts.find((f) => f.bayIds.length > 1)!;
      expect(slidingFront).toBeDefined();

      const summary = formatSharedFrontScopeSummary(run, slidingFront.bayIds);
      expect(summary).toContain('–');
      expect(canIsolateBayFromSharedFront(run, slidingFront, slidingFront.bayIds[0]!)).toBe(true);
      expect(
        canIsolateBayFromSharedFront(
          run,
          slidingFront,
          slidingFront.bayIds[slidingFront.bayIds.length - 1]!
        )
      ).toBe(true);
      if (slidingFront.bayIds.length >= 3) {
        expect(canIsolateBayFromSharedFront(run, slidingFront, slidingFront.bayIds[1]!)).toBe(false);
      }

      const panelSrc = readSrc('src/ui/DoorInspectorPanel.tsx');
      expect(panelSrc).toContain('Ortak cephe ·');
      expect(panelSrc).toContain('Yalnızca bu bölmeyi ayır');
    });

    it('blocks unchecking the last bay and sanitizes Zod/front-id errors into clean Turkish (CF-07)', () => {
      const { design } = resetStore();
      const run = design.runs[0]!;
      expect(validateFrontBaySpanSelection(run, [])).toEqual({
        ok: false,
        error: 'En az 1 bölme seçili kalmalıdır.',
      });
      if (run.bays.length >= 3) {
        const nonAdj = validateFrontBaySpanSelection(run, [run.bays[0]!.id, run.bays[2]!.id]);
        expect(nonAdj.ok).toBe(false);
        if (!nonAdj.ok) expect(nonAdj.error).not.toContain('front-');
      }

      const rawZod = '[{"origin":"array","code":"too_small","minimum":1,"path":["fronts",0,"bayIds"],"message":"Too small: expected array to have >=1 items"}]';
      expect(formatFrontEditorError(rawZod)).toBe('En az 1 bölme seçili kalmalıdır.');
      const rawFrontId = 'Ortak kapak yalnızca aynı koldaki bitişik bölmeleri örtebilir: front-mwutafis-eoumw7';
      expect(formatFrontEditorError(rawFrontId)).not.toContain('front-mwutafis');

      const editorSrc = readSrc('src/ui/FrontSystemEditor.tsx');
      expect(editorSrc).toContain('disabled={isLastChecked}');
      expect(editorSrc).toContain('En az 1 bölme seçili kalmalıdır');
    });

    it('splits door leaf labels into truncatable base label + non-truncating side badge (CF-17)', () => {
      const left = splitDoorLeafLabel('S1: 800mm Sabit Modül (Net 764mm) Sol Kapak', 'left');
      const right = splitDoorLeafLabel('S1: 800mm Sabit Modül (Net 764mm) Sağ Kapak', 'right');
      expect(left.baseLabel).toBe('S1: 800mm Sabit Modül (Net 764mm)');
      expect(left.sideBadge).toBe('Sol Kapak');
      expect(right.sideBadge).toBe('Sağ Kapak');
    });

    it('preserves custom sliding parameters across 2-track <-> 3-track toggles and supports global material inherit (CF-19)', () => {
      const custom = {
        ...defaultSlidingConfig(18, 2),
        leafCount: 4,
        overlapMm: 42,
        startClearanceMm: 25,
        endClearanceMm: 30,
        verticalGapMm: 14,
      };
      const to3 = updateSlidingTrackCount(custom, 18, 3);
      expect(to3.trackCount).toBe(3);
      expect(to3.leafCount).toBe(4);
      expect(to3.overlapMm).toBe(42);
      expect(to3.startClearanceMm).toBe(25);
      expect(to3.endClearanceMm).toBe(30);
      expect(to3.verticalGapMm).toBe(14);
      expect(to3.trackDepthMm).toBeGreaterThanOrEqual(100);

      const editorSrc = readSrc('src/ui/FrontSystemEditor.tsx');
      expect(editorSrc).toContain('Genel kapak malzemesi (');
    });

    it('exposes corner door restore card (CF-11), multi-door batch actions (CF-12) and implicit open bay range promotion (CF-15)', () => {
      const panelSrc = readSrc('src/ui/DoorInspectorPanel.tsx');
      expect(panelSrc).toContain('Beşgen Köşe Kapağı (Açık)');
      expect(panelSrc).toContain('Köşe kapağını geri ekle');
      expect(panelSrc).toContain('kapak seçili');
      expect(panelSrc).toContain('kapağı aç');
      expect(panelSrc).toContain('kapağı kapat');
      expect(panelSrc).toContain('Kapsam kotları ve bölme aralığı');
      expect(panelSrc).not.toContain('{activeFront && (\n            <details');
    });
  });

  describe('CF-03 / CF-10 / WS-UX-010: 2D Üst Plan Auto-Fit & 3D L-Shape Framing', () => {
    it.each([
      ['l-diagonal-asymmetric', 835, 771], // 1440x900
      ['l-diagonal-asymmetric', 704, 673], // 1280x800
      ['l-diagonal-asymmetric', 1024, 569], // 1024x768
      ['l-symmetric-diagonal', 704, 673],
      ['l-blind-corner', 704, 673],
    ] as const)('keeps 2D Üst Plan +A/+B and Derinlik pills above AnalysisToolbar & footer for %s at %dx%d (CF-03)', (presetId, width, height) => {
      const design =
        presetId === 'l-symmetric-diagonal'
          ? (() => {
              const d = structuredClone(SAMPLE_DESIGNS['l-diagonal-asymmetric']);
              const rb = d.runs.find((r) => r.wallAxis === 'B');
              if (rb) rb.depthMm = 600;
              return d;
            })()
          : structuredClone(SAMPLE_DESIGNS[presetId]);
      const model = solveDesign(design);
      const bounds = furnitureBounds(model)!;
      const pose = computeTopPlanFit(bounds, width, height);

      const camera = new OrthographicCamera(-width / 2, width / 2, height / 2, -height / 2, 0.1, 30);
      camera.up.set(0, 0, -1);
      camera.position.set(...pose.position);
      camera.lookAt(new Vector3(...pose.target));
      camera.zoom = pose.zoom;
      camera.updateProjectionMatrix();
      camera.updateMatrixWorld();

      const projectPx = (mm: [number, number, number]) => {
        const p = new Vector3(mm[0] * 0.001, mm[1] * 0.001, mm[2] * 0.001).project(camera);
        return {
          x: ((p.x + 1) * width) / 2,
          y: ((1 - p.y) * height) / 2,
          z: p.z,
        };
      };

      const runAnchors = design.runs.map((run) => {
        const lastBay = model.bays.filter((b) => b.runId === run.id).at(-1);
        const endMm = lastBay ? lastBay.startOffsetMm + lastBay.outerWidthMm : run.lengthMm;
        return projectPx(computeRunEndAnchorPositionMm(run, endMm, '2d-plan-top'));
      });

      // WS-UX-010: both +A and +B anchors fit inside the canvas cleanly
      expect(runEndControlsFit(runAnchors, width, height, 68)).toBe(true);
      // Every run-end anchor and Derinlik midpoint stays strictly above AnalysisToolbar (~92px from bottom)
      for (const anchor of runAnchors) {
        expect(height - anchor.y).toBeGreaterThanOrEqual(96);
      }
      for (const dim of model.dimensions.filter((d) => d.kind === 'depth')) {
        const mid: [number, number, number] = [
          (dim.startMm[0] + dim.endMm[0]) / 2,
          (dim.startMm[1] + dim.endMm[1]) / 2,
          (dim.startMm[2] + dim.endMm[2]) / 2,
        ];
        const pt = projectPx(mid);
        expect(height - pt.y).toBeGreaterThanOrEqual(94);
        expect(pt.x).toBeGreaterThan(24);
        expect(pt.x).toBeLessThan(width - 24);
      }
    });

    it('frames L-shape 3D perspective camera so Run B Derinlik, Yükseklik & +B stay inside canvas left edge (CF-10)', () => {
      const design = structuredClone(SAMPLE_DESIGNS['l-diagonal-asymmetric']);
      const model = solveDesign(design);
      const runA = design.runs.find((r) => r.wallAxis === 'A')!;
      const runB = design.runs.find((r) => r.wallAxis === 'B')!;
      const pose = computeDefault3DCameraPose({
        layoutKind: 'l-shape',
        lenAM: runA.lengthMm * 0.001,
        lenBM: runB.lengthMm * 0.001,
        heightM: runA.heightMm * 0.001,
        depthAM: runA.depthMm * 0.001,
      });

      for (const [width, height] of [
        [835, 771],
        [704, 673],
      ] as const) {
        const camera = new PerspectiveCamera(42, width / height, 0.05, 40);
        camera.zoom = Math.min(1, width / Math.max(1, height) / 1.12);
        camera.position.set(...pose.position);
        camera.lookAt(new Vector3(...pose.target));
        camera.updateProjectionMatrix();
        camera.updateMatrixWorld();

        const lastBayB = model.bays.filter((b) => b.runId === runB.id).at(-1)!;
        const anchorBMm = computeRunEndAnchorPositionMm(
          runB,
          lastBayB.startOffsetMm + lastBayB.outerWidthMm,
          '3d-perspective'
        );
        const pB = new Vector3(
          anchorBMm[0] * 0.001,
          anchorBMm[1] * 0.001,
          anchorBMm[2] * 0.001
        ).project(camera);
        const screenXB = ((pB.x + 1) * width) / 2;
        expect(screenXB).toBeGreaterThanOrEqual(24);

        const depthB = model.dimensions.find((d) => d.kind === 'depth' && d.runId === runB.id)!;
        const depthEndpoints = resolveDimensionRenderEndpoints(depthB, '3d-perspective', design.runs);
        const depthMidM = new Vector3(
          ((depthEndpoints.startMm[0] + depthEndpoints.endMm[0]) / 2) * 0.001,
          ((depthEndpoints.startMm[1] + depthEndpoints.endMm[1]) / 2) * 0.001,
          ((depthEndpoints.startMm[2] + depthEndpoints.endMm[2]) / 2) * 0.001
        ).project(camera);
        const depthScreenX = ((depthMidM.x + 1) * width) / 2;
        // Centered ~160px Derinlik pill needs >= 80px center X to stay > 0px inside left edge
        expect(depthScreenX).toBeGreaterThan(80);

        const heightB = model.dimensions.find((d) => d.kind === 'height' && d.runId === runB.id)!;
        const heightMidM = new Vector3(
          ((heightB.startMm[0] + heightB.endMm[0]) / 2) * 0.001,
          ((heightB.startMm[1] + heightB.endMm[1]) / 2) * 0.001,
          ((heightB.startMm[2] + heightB.endMm[2]) / 2) * 0.001
        ).project(camera);
        const heightScreenX = ((heightMidM.x + 1) * width) / 2;
        expect(heightScreenX).toBeGreaterThan(82);
      }
    });
  });

  describe('CF-05 / CF-08 / CF-09 / CF-14 / CF-18 / CF-20 / CF-21 / CF-24 / PM-04 / VF-01 / VF-11: Overlays & Popover', () => {
    it('suppresses cell dimension overlays whenever doorEditorMode is true (CF-08)', () => {
      const { resolved } = resetStore();
      const firstCell = resolved.cells[0]!;
      const group = analyzeSelectedCellsGroup([firstCell.id], resolved);
      expect(shouldShowCellDimensionOverlay(group, false)).toBe(true);
      expect(shouldShowCellDimensionOverlay(group, true)).toBe(false);
    });

    it('rejects empty/whitespace/out-of-range inline mm drafts instead of converting "" to 0 mm (CF-09)', () => {
      expect(parseOverlayMmDraft('', false, 80, 2600).ok).toBe(false);
      expect(parseOverlayMmDraft('   ', false, 80, 2600).ok).toBe(false);
      expect(parseOverlayMmDraft('0', false, 80, 2600).ok).toBe(false);
      expect(parseOverlayMmDraft('abc', true, 80, 2600).ok).toBe(false);
      expect(parseOverlayMmDraft('420', false, 80, 2600)).toEqual({ ok: true, value: 420 });
    });

    it('projects diagonal corner door Kapak X along the 45° front chord (CF-18) and offsets Kapak/Kanat X above Dış pills (CF-14)', () => {
      const { resolved } = resetStore(structuredClone(SAMPLE_DESIGNS['l-diagonal-asymmetric']));
      const cornerDoor = resolved.doors.find((d) => d.isCornerDoor)!;
      const spec = computeHingedDoorDimensionOverlay(cornerDoor);
      const dx = spec.xEndMm[0] - spec.xStartMm[0];
      const dz = spec.xEndMm[2] - spec.xStartMm[2];
      // Must be diagonal (both X and Z span non-zero!) and equal to door width
      expect(Math.abs(dx)).toBeGreaterThan(100);
      expect(Math.abs(dz)).toBeGreaterThan(100);
      expect(Math.hypot(dx, dz)).toBeCloseTo(cornerDoor.widthMm, 2);
      expect(spec.xStartMm[1]).toBeGreaterThan(200);

      const slidingModel = solveDesign(phase5Example('straight'));
      const leaf = slidingModel.slidingDoors![0]!;
      const slideSpec = computeSlidingLeafDimensionOverlay(leaf, 0);
      expect(slideSpec.xStartMm[1]).toBeGreaterThan(200);
    });

    it('staggers 2D Cephe B Köşe B vs B kolu and 3D L-shape Run B bayOuter pills cleanly (CF-14)', () => {
      const { design, resolved } = resetStore(
        structuredClone(SAMPLE_DESIGNS['l-diagonal-asymmetric'])
      );
      const totalB = resolved.dimensions.find((d) => d.kind === 'runTotal' && d.runId === 'run-B')!;
      const armB = resolved.dimensions.find((d) => d.kind === 'cornerArm' && d.runId === 'run-B')!;
      const totalB2D = resolveDimensionRenderEndpoints(totalB, '2d-front-B', design.runs);
      const armB2D = resolveDimensionRenderEndpoints(armB, '2d-front-B', design.runs);
      expect(totalB2D.startMm[1] - armB2D.startMm[1]).toBeGreaterThanOrEqual(180);

      const bayOuterB = resolved.dimensions.find(
        (d) => d.kind === 'bayOuter' && d.runId === 'run-B'
      )!;
      const bayOuterA = resolved.dimensions.find(
        (d) => d.kind === 'bayOuter' && d.runId === 'run-A'
      )!;
      const b3D = resolveDimensionRenderEndpoints(bayOuterB, '3d-perspective', design.runs);
      const a3D = resolveDimensionRenderEndpoints(bayOuterA, '3d-perspective', design.runs);
      expect(b3D.startMm[1] - a3D.startMm[1]).toBeGreaterThanOrEqual(150);
    });

    it('computes safe dynamic popover maxHeight and flips resize-draft popover opposite the conflict badge (CF-05)', () => {
      expect(computePopoverMaxHeightPx(673, 218, 92)).toBe(351);
      const bounds = {
        minX: 310,
        maxX: 460,
        minY: 220,
        maxY: 420,
        centerX: 385,
        centerY: 320,
        canvasWidth: 800,
        canvasHeight: 740,
        conflictCenterX: 440,
      };
      const placed = computePopoverPlacement(bounds, 'cell-or-drawer', { conflictActive: true });
      expect(placed.leftPx).toBe(14);
      expect(placed.widthPx).toBe(320);

      // 1280x800 narrow scene (704px): cap popover width to 280px so right-aligned popover clears compact conflict badge (+8px gap)
      const narrowConflictPlaced = computePopoverPlacement(
        { ...bounds, canvasWidth: 704, conflictCenterX: 335 },
        'cell-or-drawer',
        { conflictActive: true }
      );
      expect(narrowConflictPlaced.widthPx).toBe(280);
      expect(narrowConflictPlaced.leftPx).toBe(410);
    });

    it('enforces a11y labels, desktop quick-bar xl:hidden, PM-04 Escape guard, no IBL jargon, and mobile scene toggle', () => {
      const overlaySrc = readSrc('src/canvas/annotations/SelectedCellDimensionOverlay.tsx');
      const dimSrc = readSrc('src/canvas/annotations/DimensionOverlay.tsx');
      const popoverSrc = readSrc('src/canvas/annotations/ContextualCellPopover.tsx');
      const canvasSrc = readSrc('src/canvas/scene/WardrobeCanvas.tsx');
      const analysisSrc = readSrc('src/canvas/scene/AnalysisOverlays.tsx');

      // CF-20
      expect(overlaySrc.match(/aria-label="Ölçü düzenleyiciyi kapat"/g)?.length).toBe(2);
      // CF-24
      expect(dimSrc).toContain('ViewProjectionGate');
      // VF-11 desktop quick-bar de-dup
      expect(popoverSrc).toContain('xl:hidden');
      // PM-04 Escape guard
      expect(canvasSrc).toContain("if (e.defaultPrevented || document.querySelector('dialog[open]')) return;");
      // CF-21 & VF-12
      expect(canvasSrc).not.toContain('IBL');
      expect(canvasSrc).toContain('Gelişmiş Yansıma ve Temas Gölgeleri');
      expect(canvasSrc).not.toContain('{resolved.backPanelThicknessMm}mm');
      expect(canvasSrc).toContain('{resolved.backPanelThicknessMm} mm');
      // VF-01 / VF-08 mobile collapsible scene & analysis toggle
      expect(canvasSrc).toContain('studio-mobile-scene-toggle');
      expect(canvasSrc).toContain('studio-mobile-scene-sheet');
      expect(analysisSrc).toContain('studio-analysis-toolbar');
      expect(analysisSrc).toContain('studio-gesture-hint');

      // Phase 3 Closure — Obs 1a/1b, PM-13, CF-16, VF-04
      expect(dimSrc).toContain('min-h-[25px]');
      expect(dimSrc).toContain('aria-describedby={validationError ? `dim-error-${dim.id}` : undefined}');
      expect(dimSrc).toContain('id={`dim-error-${dim.id}`}');

      expect(overlaySrc).toContain('Çakışma: {resizeDraft.conflictOverlapMm} mm');
      expect(overlaySrc).not.toContain('Çakışma: {resizeDraft.conflictOverlapMm} mm ({resizeDraft.neighborLabel})');
      expect(overlaySrc).toContain('aria-describedby={draftError ? `drawer-dim-error-${spec.axis}` : undefined}');
      expect(overlaySrc).toContain('aria-describedby={draftError ? `cell-dim-error-${spec.axis}` : undefined}');
      expect(overlaySrc.match(/pointer-events-auto group flex min-h-\[25px\] flex-col/g)?.length).toBe(2);

      // Auto-pose 3D camera context key changes across preset/layout switches while staying stable within the same design
      expect(get3DCameraContextKey({ id: 'straight-wardrobe', layoutKind: 'straight' })).not.toBe(
        get3DCameraContextKey({ id: 'l-diagonal-asymmetric', layoutKind: 'l-shape' })
      );
      expect(get3DCameraContextKey({ id: 'd1', layoutKind: 'straight' })).not.toBe(
        get3DCameraContextKey({ id: 'd1', layoutKind: 'l-shape' })
      );
      expect(get3DCameraContextKey({ id: 'd1', layoutKind: 'straight' })).toBe(
        get3DCameraContextKey({ id: 'd1', layoutKind: 'straight' })
      );
      expect(canvasSrc).toContain('if (designCameraKey === lastDesignCameraKeyRef.current) return;');

      // PM-13 drawerHeightInput Escape revert + CF-16 aria-describedby + badInput + VF-04 select borders
      expect(popoverSrc).toMatch(
        /e\.key === 'Escape'[\s\S]*setDrawerHeightInput\(String\(firstDrw\.heightMm\)\)[\s\S]*setDrawerHeightError\(null\)[\s\S]*e\.currentTarget\.blur\(\)/
      );
      expect(popoverSrc).toContain("aria-describedby={drawerHeightError ? 'popover-drawer-height-error' : undefined}");
      expect(popoverSrc).toContain('id="popover-drawer-height-error"');
      expect(popoverSrc).toContain("aria-describedby={groupIntervalInvalid ? 'popover-shelf-interval-error' : undefined}");
      expect(popoverSrc).toContain('id="popover-shelf-interval-error"');
      expect(popoverSrc).toContain('setGroupIntervalBadInput(Boolean(e.currentTarget.validity?.badInput))');
      expect(popoverSrc).toContain("aria-describedby={targetMmError ? 'popover-target-mm-error' : undefined}");
      expect(popoverSrc).toContain('id="popover-target-mm-error"');
      expect(popoverSrc).not.toMatch(/<select[\s\S]{0,600}border-slate-700/);
    });
  });
});
