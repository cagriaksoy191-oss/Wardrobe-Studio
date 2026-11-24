import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { computePopoverPlacement } from '../src/canvas/annotations/ContextualCellPopover';
import { phase5Example } from '../src/core/presets/phase5Examples';
import { SAMPLE_DESIGNS } from '../src/core/presets/sampleDesigns';
import { solveDesign } from '../src/core/solver/carcassSolver';
import { analyzeSelectedCellsGroup } from '../src/core/solver/treeMutator';
import { useWardrobeStore } from '../src/store/useWardrobeStore';
import {
  resolveActiveDoorInspectorContext,
  switchBayFrontType,
} from '../src/ui/DoorInspectorPanel';

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

describe('Phase 2B WS-3: Contextual Editor & Unified Authoritative Door Inspector (CAD-02, CAD-06)', () => {
  beforeEach(() => {
    resetStore();
  });

  describe('resolveActiveDoorInspectorContext (hinged / sliding / open / corner / hybrid)', () => {
    it('detects standard hinged bay context and cut dimensions', () => {
      const { design, resolved } = useWardrobeStore.getState();
      const firstDoor = resolved.doors[0]!;
      const ctx = resolveActiveDoorInspectorContext(
        design,
        resolved,
        firstDoor.bayId ?? null,
        [firstDoor.id]
      );

      expect(ctx.isCornerDoor).toBe(false);
      expect(ctx.activeFrontType).toBe('hinged');
      expect(ctx.isHybridBay).toBe(false);
      expect(ctx.selectedHingedDoor?.id).toBe(firstDoor.id);
      expect(ctx.selectedSlidingLeaf).toBeNull();
      expect(ctx.targetBay?.id).toBe(firstDoor.bayId);
    });

    it('detects 3-track sliding wardrobe context and selected leaf', () => {
      const { design, resolved } = resetStore(phase5Example('straight'));
      const firstLeaf = resolved.slidingDoors![0]!;
      const ctx = resolveActiveDoorInspectorContext(
        design,
        resolved,
        resolved.bays[0].id,
        [firstLeaf.id]
      );

      expect(ctx.isCornerDoor).toBe(false);
      expect(ctx.activeFrontType).toBe('sliding');
      expect(ctx.selectedSlidingLeaf?.id).toBe(firstLeaf.id);
      expect(ctx.frontSlidingLeaves.length).toBeGreaterThanOrEqual(2);
      expect(ctx.selectedHingedDoor).toBeNull();
    });

    it('detects open bay front context when bay.frontMode is open', () => {
      const openDesign = structuredClone(SAMPLE_DESIGNS['straight-wardrobe']);
      openDesign.runs[0].bays[0].frontMode = 'open';
      const { design, resolved } = resetStore(openDesign);
      const bayId = resolved.bays[0].id;
      const ctx = resolveActiveDoorInspectorContext(design, resolved, bayId, []);

      expect(ctx.activeFrontType).toBe('open');
      expect(ctx.hingedMode).toBe('open');
      expect(ctx.selectedHingedDoor).toBeNull();
      expect(ctx.selectedSlidingLeaf).toBeNull();
    });

    it('detects diagonal corner door context', () => {
      const { design, resolved } = resetStore(
        structuredClone(SAMPLE_DESIGNS['l-diagonal-asymmetric'])
      );
      const cornerDoor = resolved.doors.find((d) => d.isCornerDoor)!;
      expect(cornerDoor).toBeDefined();

      const ctx = resolveActiveDoorInspectorContext(
        design,
        resolved,
        resolved.bays[0].id,
        [cornerDoor.id]
      );

      expect(ctx.isCornerDoor).toBe(true);
      expect(ctx.selectedHingedDoor?.id).toBe(cornerDoor.id);
      expect(ctx.activeFrontType).toBe('hinged');
    });

    it('detects hybrid bay with upper hinged + lower sliding ranges and switches active range cleanly', () => {
      const { design, resolved } = resetStore(phase5Example('asymmetric'));
      const hybridBay = resolved.bays.find(
        (b) => design.fronts.filter((f) => f.bayIds.includes(b.id)).length >= 2
      );
      expect(hybridBay).toBeDefined();
      const hybridBayId = hybridBay!.id;
      const bayFronts = design.fronts.filter((f) => f.bayIds.includes(hybridBayId));
      expect(bayFronts.length).toBeGreaterThanOrEqual(2);

      const slidingFront = bayFronts.find((f) => f.type === 'sliding')!;
      const hingedFront = bayFronts.find((f) => f.type === 'hinged')!;
      expect(slidingFront).toBeDefined();
      expect(hingedFront).toBeDefined();

      const slidingCtx = resolveActiveDoorInspectorContext(
        design,
        resolved,
        hybridBayId,
        [],
        slidingFront.id
      );
      expect(slidingCtx.isHybridBay).toBe(true);
      expect(slidingCtx.activeFront?.id).toBe(slidingFront.id);
      expect(slidingCtx.activeFrontType).toBe('sliding');
      expect(slidingCtx.selectedSlidingLeaf).not.toBeNull();

      const hingedCtx = resolveActiveDoorInspectorContext(
        design,
        resolved,
        hybridBayId,
        [],
        hingedFront.id
      );
      expect(hingedCtx.isHybridBay).toBe(true);
      expect(hingedCtx.activeFront?.id).toBe(hingedFront.id);
      expect(hingedCtx.activeFrontType).toBe('hinged');
      expect(hingedCtx.selectedHingedDoor).not.toBeNull();
    });
  });

  describe('switchBayFrontType unified front switcher', () => {
    it('switches default hinged bay -> sliding -> open -> hinged while keeping leaf selection synced', () => {
      const bayId = useWardrobeStore.getState().resolved.bays[0].id;

      // 1. Hinged -> Sliding
      switchBayFrontType(bayId, null, 'hinged', 'sliding');
      let state = useWardrobeStore.getState();
      expect(state.commandError).toBeNull();
      const createdFront = state.design.fronts.find((f) => f.bayIds.includes(bayId))!;
      expect(createdFront.type).toBe('sliding');
      expect(state.selectedDoorId).toBeTruthy();
      expect(state.resolved.slidingDoors?.some((d) => d.id === state.selectedDoorId)).toBe(true);

      // 2. Sliding -> Open (cleans up sliding config & clears selectedDoorId)
      switchBayFrontType(bayId, createdFront, 'sliding', 'open');
      state = useWardrobeStore.getState();
      const openFront = state.design.fronts.find((f) => f.id === createdFront.id)!;
      expect(openFront.type).toBe('open');
      expect(openFront.sliding).toBeUndefined();
      expect(state.selectedDoorId).toBeNull();
      expect(state.selectedBayId).toBe(bayId);

      // 3. Open -> Hinged (restores hinged leaves and auto-selects first leaf)
      switchBayFrontType(bayId, openFront, 'open', 'hinged');
      state = useWardrobeStore.getState();
      const hingedFront = state.design.fronts.find((f) => f.id === createdFront.id)!;
      expect(hingedFront.type).toBe('hinged');
      expect(state.selectedDoorId).toBeTruthy();
      expect(state.resolved.doors.some((d) => d.id === state.selectedDoorId)).toBe(true);
    });

    it('keeps default bay clean when toggling hinged -> open -> hinged without explicit Front', () => {
      const bayId = useWardrobeStore.getState().resolved.bays[0].id;
      expect(useWardrobeStore.getState().design.fronts).toHaveLength(0);

      switchBayFrontType(bayId, null, 'hinged', 'open');
      let state = useWardrobeStore.getState();
      expect(state.design.fronts).toHaveLength(0);
      expect(state.resolved.bays.find((b) => b.id === bayId)?.frontMode).toBe('open');
      expect(state.selectedDoorId).toBeNull();

      switchBayFrontType(bayId, null, 'open', 'hinged');
      state = useWardrobeStore.getState();
      expect(state.design.fronts).toHaveLength(0);
      expect(state.resolved.doors.some((d) => d.id === state.selectedDoorId)).toBe(true);
    });

    it('is a no-op when switching to the already active front type', () => {
      const bayId = useWardrobeStore.getState().resolved.bays[0].id;
      const beforePast = useWardrobeStore.getState().historyPast.length;
      switchBayFrontType(bayId, null, 'hinged', 'hinged');
      expect(useWardrobeStore.getState().historyPast.length).toBe(beforePast);
    });
  });

  describe('CAD-02: Popover placement & non-occlusion geometry', () => {
    it('docks door quick-bar at top-right for left/center leaves and flips to top-left for right-side leaves', () => {
      const leftLeafBounds = {
        minX: 160,
        maxX: 300,
        minY: 180,
        maxY: 610,
        centerX: 230,
        centerY: 395,
        canvasWidth: 800,
        canvasHeight: 740,
      };
      const rightPlacement = computePopoverPlacement(leftLeafBounds, 'door-quick-bar');
      expect(rightPlacement.widthPx).toBeLessThanOrEqual(312);
      expect(rightPlacement.topPx).toBe(104);
      // Clear of right edge of left leaf + Kapak Y badge (~300 + 80 = 380)
      expect(rightPlacement.leftPx).toBeGreaterThan(leftLeafBounds.maxX + 80);

      const rightLeafBounds = {
        minX: 520,
        maxX: 680,
        minY: 180,
        maxY: 610,
        centerX: 600,
        centerY: 395,
        canvasWidth: 800,
        canvasHeight: 740,
      };
      const leftPlacement = computePopoverPlacement(rightLeafBounds, 'door-quick-bar');
      expect(leftPlacement.leftPx).toBe(14);
      expect(leftPlacement.leftPx + leftPlacement.widthPx).toBeLessThan(rightLeafBounds.minX);
    });

    it('places cell/drawer popover clear of SelectedCellDimensionOverlay X/Y/Z pills', () => {
      const leftCellBounds = {
        minX: 140,
        maxX: 280,
        minY: 260,
        maxY: 420,
        centerX: 210,
        centerY: 340,
        canvasWidth: 820,
        canvasHeight: 740,
      };
      const placedRight = computePopoverPlacement(leftCellBounds, 'cell-or-drawer');
      expect(placedRight.topPx).toBe(104);
      expect(placedRight.leftPx).toBeGreaterThanOrEqual(leftCellBounds.maxX + 84);

      const rightCellBounds = {
        minX: 540,
        maxX: 690,
        minY: 260,
        maxY: 420,
        centerX: 615,
        centerY: 340,
        canvasWidth: 820,
        canvasHeight: 740,
      };
      const placedLeft = computePopoverPlacement(rightCellBounds, 'cell-or-drawer');
      expect(placedLeft.leftPx).toBe(14);
      expect(placedLeft.leftPx + placedLeft.widthPx).toBeLessThanOrEqual(rightCellBounds.minX - 84);
    });
  });

  describe('CAD-07 preservation & Workshop CAD hygiene across WS-3 files', () => {
    const ws3Files = [
      'src/ui/DoorInspectorPanel.tsx',
      'src/ui/FrontSystemEditor.tsx',
      'src/canvas/annotations/ContextualCellPopover.tsx',
    ];

    it('contains zero text-slate-500, zero raw JSX backticks, zero SplitNode and zero (Bay)', () => {
      for (const relPath of ws3Files) {
        const src = readFileSync(resolve(process.cwd(), relPath), 'utf8');
        expect(src, `${relPath} must not use text-slate-500`).not.toContain('text-slate-500');
        expect(src, `${relPath} must not leak SplitNode`).not.toContain('SplitNode');
        expect(src, `${relPath} must not leak (Bay)`).not.toContain('(Bay)');
        // No markdown backtick wrappers inside user-facing labels like (`Y`) or (`X / Y / Z`)
        expect(src, `${relPath} must not leak markdown backticks in labels`).not.toMatch(/\(`[^`]+`\)/);
      }
    });

    it('keeps ContextualCellPopover lightweight (no embedded FrontSystemEditor/HingedOpeningCard) and dispatches narrow-screen drawer event', () => {
      const popoverSrc = readFileSync(
        resolve(process.cwd(), 'src/canvas/annotations/ContextualCellPopover.tsx'),
        'utf8'
      );
      expect(popoverSrc).not.toContain('<FrontSystemEditor');
      expect(popoverSrc).not.toContain('<HingedOpeningCard');
      expect(popoverSrc).toContain("new CustomEvent('wardrobe:open-selection-drawer')");
      // CAD-07 multi-group summary & scroll cap preserved
      expect(popoverSrc).toContain('{group.shelfGroups.length} grup · {group.cells.length} aralık');
      expect(popoverSrc).toContain('max-h-36 space-y-1 overflow-y-auto pr-1');
    });

    it('preserves CAD-07 multi-group selection analysis accurately', () => {
      const { resolved } = resetStore(structuredClone(SAMPLE_DESIGNS['l-diagonal-asymmetric']));
      const bayA1Cell = resolved.cells.find((c) => c.bayId === 'bay-A1')!;
      const bayA2Cell = resolved.cells.find((c) => c.bayId === 'bay-A2')!;
      const multiGroup = analyzeSelectedCellsGroup([bayA1Cell.id, bayA2Cell.id], resolved);

      expect(multiGroup.isMultiShelfGroupSelection).toBe(true);
      expect(multiGroup.shelfGroups.length).toBe(2);
      expect(multiGroup.cannotMergeReason).toBeTruthy();
      expect(multiGroup.cannotMergeReason).not.toContain('(Bay)');
    });
  });
});
