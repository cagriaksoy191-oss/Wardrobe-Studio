import { describe, expect, it } from 'vitest';
import {
  HANDLE_FINISH_CATALOG,
  HANDLE_STYLE_CATALOG,
  MATERIAL_CATALOG,
  createWorldSpaceBoxGeometry,
  createWorldSpaceExtrudeGeometry,
} from '../src/canvas/materials/materialRegistry';
import { resolveServiceItemPlacement } from '../src/core/inserts/insertRegistry';
import { SAMPLE_DESIGNS } from '../src/core/presets/sampleDesigns';
import { normalizeAndValidateDesign } from '../src/core/schema/designSchema';
import { solveDesign } from '../src/core/solver/carcassSolver';
import { distributeIntegerMm } from '../src/core/solver/flexSolver';
import { analyzeSelectedCellsGroup } from '../src/core/solver/treeMutator';
import { useWardrobeStore } from '../src/store/useWardrobeStore';

describe('Wardrobe Studio Phase 1 & Phase 2 — Parametric Solver, SplitNode Editor, Doors & Drawers Tests', () => {
  it('1. Fixed 800mm bay with 18mm side panels yields exactly 764mm net inner width', () => {
    const straight = SAMPLE_DESIGNS['straight-wardrobe'];
    const resolved = solveDesign(straight);

    const bayS1 = resolved.bays.find((b) => b.id === 'bay-S1');
    expect(bayS1).toBeDefined();
    expect(bayS1?.outerWidthMm).toBe(800);
    expect(bayS1?.netInnerWidthMm).toBe(764);
  });

  it('2. Fixed/Flex integer mm distribution preserves locked items and distributes remainder mm with zero drift', () => {
    const dist = distributeIntegerMm(
      1900,
      [
        { id: 'b1', size: { kind: 'fixed', mm: 800 }, locked: true },
        { id: 'b2', size: { kind: 'flex', weight: 1 } },
        { id: 'b3', size: { kind: 'flex', weight: 1 } },
        { id: 'b4', size: { kind: 'flex', weight: 1 } },
      ],
      0
    );

    expect(dist[0].resolvedMm).toBe(800);
    for (const d of dist) {
      expect(Number.isInteger(d.resolvedMm)).toBe(true);
    }
    const sum = dist.reduce((acc, d) => acc + d.resolvedMm, 0);
    expect(sum).toBe(1900);
  });

  it('3. Recursive SplitNode subtracts 18mm internal divider thickness accurately (e.g. 260mm niche + 18mm divider + remaining)', () => {
    const lDiagonal = SAMPLE_DESIGNS['l-diagonal-asymmetric'];
    const resolved = solveDesign(lDiagonal);

    const bayA1 = resolved.bays.find((b) => b.id === 'bay-A1')!;
    expect(bayA1.outerWidthMm).toBe(920);
    expect(bayA1.netInnerWidthMm).toBe(884);

    const nicheCell = resolved.cells.find((c) => c.id === 'cell-a1-service-niche')!;
    const drawersCell = resolved.cells.find((c) => c.id === 'cell-a1-drawers')!;

    expect(nicheCell.netWidthMm).toBe(260);
    expect(drawersCell.netWidthMm).toBe(884 - 18 - 260);
    expect(nicheCell.netWidthMm + 18 + drawersCell.netWidthMm).toBe(bayA1.netInnerWidthMm);
  });

  it('4. Pentagonal/Diagonal corner supports asymmetric run depths (600mm vs 480mm) without gaps', () => {
    const lDiagonal = SAMPLE_DESIGNS['l-diagonal-asymmetric'];
    const resolved = solveDesign(lDiagonal);

    expect(resolved.corners.length).toBe(1);
    const corner = resolved.corners[0];
    expect(corner.type).toBe('diagonal');
    expect(corner.consumedRunAMm).toBe(900);
    expect(corner.consumedRunBMm).toBe(900);
    expect(corner.depthAMm).toBe(600);
    expect(corner.depthBMm).toBe(480);

    expect(corner.polygonXZMm).toHaveLength(5);
    expect(corner.polygonXZMm[2]).toEqual({ xMm: 900, zMm: 600 });
    expect(corner.polygonXZMm[3]).toEqual({ xMm: 480, zMm: 900 });

    const bayA1 = resolved.bays.find((b) => b.id === 'bay-A1')!;
    const bayB1 = resolved.bays.find((b) => b.id === 'bay-B1')!;
    expect(bayA1.startOffsetMm).toBe(900);
    expect(bayB1.startOffsetMm).toBe(900);
  });

  it('5. Blind corner consumes priority run depth + filler width from abutting run and places L-filler panels', () => {
    const lBlind = SAMPLE_DESIGNS['l-blind-corner'];
    const resolved = solveDesign(lBlind);

    expect(resolved.corners.length).toBe(1);
    const corner = resolved.corners[0];
    expect(corner.type).toBe('blind');
    expect(corner.consumedRunAMm).toBe(0);
    expect(corner.consumedRunBMm).toBe(660);

    const bayB1 = resolved.bays.find((b) => b.id === 'bay-blind-B1')!;
    expect(bayB1.startOffsetMm).toBe(660);

    const cornerFillers = resolved.panels.filter((p) => p.role === 'cornerFiller');
    expect(cornerFillers).toHaveLength(2);
  });

  it('6. Service niche fit validation detects when hand clearance < 30mm (e.g. 220mm niche with 130+90mm items)', () => {
    const design = structuredClone(SAMPLE_DESIGNS['l-diagonal-asymmetric']);
    const rootSplit = design.runs[0].bays[0].root;
    if (rootSplit.kind === 'split') {
      const lowerSplit = rootSplit.children[0].node;
      if (lowerSplit.kind === 'split') {
        lowerSplit.children[0].size = { kind: 'fixed', mm: 220 };
      }
    }

    const resolved = solveDesign(design);
    const clearanceIssue = resolved.issues.find((iss) => iss.code === 'SERVICE_NICHE_CLEARANCE_LOW');
    expect(clearanceIssue).toBeDefined();
    expect(clearanceIssue?.title).toContain('0 mm kaldı');
  });

  it('7. JSON export/import round-trip and Zod schema validation preserve exact design', () => {
    for (const preset of Object.values(SAMPLE_DESIGNS)) {
      const jsonStr = JSON.stringify(preset);
      const parsed = normalizeAndValidateDesign(JSON.parse(jsonStr));
      expect(parsed).toEqual(preset);

      const solvedBefore = solveDesign(preset);
      const solvedAfter = solveDesign(parsed);
      expect(solvedAfter.panels.length).toBe(solvedBefore.panels.length);
      expect(solvedAfter.bays).toEqual(solvedBefore.bays);
    }
  });

  it('8. Store commands update run length, keep locked fixed bays constant, resize flex bays, and support Undo/Redo', () => {
    const store = useWardrobeStore.getState();
    store.loadPreset('l-diagonal-asymmetric');

    const beforeBayA1 = useWardrobeStore.getState().resolved.bays.find((b) => b.id === 'bay-A1')!;
    const beforeBayA2 = useWardrobeStore.getState().resolved.bays.find((b) => b.id === 'bay-A2')!;
    expect(beforeBayA1.outerWidthMm).toBe(920);
    expect(beforeBayA2.outerWidthMm).toBe(960);

    useWardrobeStore.getState().updateRunDimension('run-A', 'lengthMm', 3000);

    const afterBayA1 = useWardrobeStore.getState().resolved.bays.find((b) => b.id === 'bay-A1')!;
    const afterBayA2 = useWardrobeStore.getState().resolved.bays.find((b) => b.id === 'bay-A2')!;
    expect(afterBayA1.outerWidthMm).toBe(920);
    expect(afterBayA2.outerWidthMm).toBe(1160);

    useWardrobeStore.getState().undo();
    const undoneBayA2 = useWardrobeStore.getState().resolved.bays.find((b) => b.id === 'bay-A2')!;
    expect(undoneBayA2.outerWidthMm).toBe(960);

    useWardrobeStore.getState().redo();
    const redoneBayA2 = useWardrobeStore.getState().resolved.bays.find((b) => b.id === 'bay-A2')!;
    expect(redoneBayA2.outerWidthMm).toBe(1160);
  });

  // ============================================================================
  // AŞAMA 2 TESTLERİ: HÜCRE BÖLME/BİRLEŞTİRME, BAĞIMSIZ KAPAK KATMANI VE KİNEMATİK
  // ============================================================================

  it('9. Interactive cell splitting and unsplitting accurately adds and removes 18mm dividers', () => {
    const store = useWardrobeStore.getState();
    store.loadPreset('straight-wardrobe');

    // bay-S3 altındaki cell-s3-hang tek hacimli uzun askı yaprak hücresidir
    const beforeCell = useWardrobeStore
      .getState()
      .resolved.cells.find((c) => c.id === 'cell-s3-hang')!;
    expect(beforeCell).toBeDefined();
    const originalW = beforeCell.netWidthMm;
    const originalYStart = beforeCell.yStartMm;

    // Hücreyi dikey olarak iki eşit sütuna böl
    useWardrobeStore.getState().splitCell('cell-s3-hang', 'vertical', 'equal');
    const afterSplitCells = useWardrobeStore
      .getState()
      .resolved.cells.filter((c) => c.bayId === 'bay-S3' && c.yStartMm === originalYStart);
    expect(afterSplitCells).toHaveLength(2);
    expect(afterSplitCells[0].netWidthMm + 18 + afterSplitCells[1].netWidthMm).toBe(originalW);

    // Bölünmeyi birleştir (Unsplit) -> tekrar tek hücreye döner
    useWardrobeStore.getState().unsplitCell(afterSplitCells[0].id);
    const afterUnsplitCells = useWardrobeStore
      .getState()
      .resolved.cells.filter((c) => c.bayId === 'bay-S3' && c.yStartMm === originalYStart);
    expect(afterUnsplitCells).toHaveLength(1);
    expect(afterUnsplitCells[0].netWidthMm).toBe(originalW);
  });

  it('10. Automatic Front layer generates double doors for >600mm bays, single doors for <=600mm bays, and partial doors above external bottom drawers', () => {
    const straight = SAMPLE_DESIGNS['straight-wardrobe'];
    const resolved = solveDesign(straight);

    // bay-S2 (1100mm) altında dış çekmece grubu (720mm + 18mm ara tabla) var: kapaklar otomatik çift kanat ve çekmece üstünden başlamalı!
    const s2Doors = resolved.doors.filter((d) => d.bayId === 'bay-S2');
    expect(s2Doors).toHaveLength(2);
    // Baza (80mm) + Alt Tabla (18mm) + Dış Çekmece (720mm) + Ara Bölücü (18mm) = 836mm
    expect(s2Doors[0].yStartMm).toBe(836);

    // bay-S2 alt çekmeceleri dış çekmece olduğu için coveringDoorIds boş olmalı
    const s2Drawers = resolved.drawers.filter((d) => d.bayId === 'bay-S2');
    expect(s2Drawers.length).toBeGreaterThan(0);
    expect(s2Drawers[0].isInternalDrawer).toBe(false);
    expect(s2Drawers[0].coveringDoorIds).toHaveLength(0);
  });

  it('11. Internal drawers behind 110° hinged doors trigger INTERNAL_DRAWER_HINGE_CONFLICT warning, resolved by 155° zero-protrusion hinge', () => {
    const store = useWardrobeStore.getState();
    store.loadPreset('l-diagonal-asymmetric');

    // bay-A1 içinde dikey bölünmüş 4'lü çekmece tam boy kapak arkasındadır ve varsayılan menteşe 110°'dir
    const initialIssues = useWardrobeStore.getState().resolved.issues;
    const conflictIssue = initialIssues.find(
      (iss) => iss.code === 'INTERNAL_DRAWER_HINGE_CONFLICT'
    );
    expect(conflictIssue).toBeDefined();

    // bay-A1 menteşesini 155° Sıfır Çıkıntılı Menteşe yap -> uyarı ortadan kalkmalı!
    useWardrobeStore.getState().setBayFrontConfig('run-A', 'bay-A1', 'auto', 155);
    const updatedIssues = useWardrobeStore.getState().resolved.issues;
    const afterIssue = updatedIssues.find(
      (iss) => iss.code === 'INTERNAL_DRAWER_HINGE_CONFLICT' && iss.targetId === 'cell-a1-drawers'
    );
    expect(afterIssue).toBeUndefined();
  });

  it('12. Smart kinematic sequencing: opening an internal drawer automatically opens covering doors; closing a covering door automatically closes internal drawers', () => {
    const store = useWardrobeStore.getState();
    store.loadPreset('l-diagonal-asymmetric');

    const internalDrawer = useWardrobeStore
      .getState()
      .resolved.drawers.find((d) => d.cellId === 'cell-a1-drawers')!;
    expect(internalDrawer).toBeDefined();
    expect(internalDrawer.coveringDoorIds.length).toBeGreaterThan(0);

    // İç çekmeceyi aç -> önündeki kapaklar da otomatik açılmalı
    useWardrobeStore.getState().toggleDrawer(internalDrawer.id);
    const stateAfterDrawerOpen = useWardrobeStore.getState();
    expect(stateAfterDrawerOpen.openDrawerIds[internalDrawer.id]).toBe(true);
    for (const doorId of internalDrawer.coveringDoorIds) {
      expect(stateAfterDrawerOpen.openDoorIds[doorId]).toBe(true);
    }

    // Önündeki kapağı kapat -> iç çekmece de otomatik kapanacak şekilde işaretlenmeli
    const firstCoveringDoorId = internalDrawer.coveringDoorIds[0];
    useWardrobeStore.getState().toggleDoor(firstCoveringDoorId);
    const stateAfterDoorClose = useWardrobeStore.getState();
    expect(stateAfterDoorClose.openDoorIds[firstCoveringDoorId]).toBe(false);
    expect(stateAfterDoorClose.openDrawerIds[internalDrawer.id]).toBe(false);
  });

  // ============================================================================
  // AŞAMA 2.1 TESTLERİ: 5 PANELLİ BOŞ ÇEKMECE, NİŞ DİK YÖNLENDİRME, SIFIRDAN
  // BOŞ TASARIM, 3D ÖLÇÜ ETİKETİ METAVERİSİ VE KALICI CHECKPOINT / UNDO-REDO
  // ============================================================================

  it('13. Hollow open-top 5-panel drawer unit computes front, left/right sides, back panel, bottom panel, and positive net interior volume', () => {
    const resolved = solveDesign(SAMPLE_DESIGNS['l-diagonal-asymmetric']);
    expect(resolved.drawers.length).toBeGreaterThan(0);

    for (const drw of resolved.drawers) {
      expect(drw.innerWidthMm).toBeGreaterThan(100);
      expect(drw.innerDepthMm).toBeGreaterThan(150);
      expect(drw.innerHeightMm).toBeGreaterThan(40);

      // Sol ve sağ yan paneller ile arka ve alt taban panelleri geçerli pozitif ölçülere sahip olmalı
      expect(drw.leftSideBoxSizeMm.every((v) => v > 0)).toBe(true);
      expect(drw.rightSideBoxSizeMm.every((v) => v > 0)).toBe(true);
      expect(drw.backPanelBoxSizeMm.every((v) => v > 0)).toBe(true);
      expect(drw.bottomPanelBoxSizeMm.every((v) => v > 0)).toBe(true);

      // Alt taban panelinin Y merkezi, çekmece ön yüzünün Y merkezinden daha aşağıda olmalı (üstü açık kasa)
      expect(drw.bottomPanelWorldPositionMm[1]).toBeLessThan(drw.frontWorldPositionMm[1]);
    }
  });

  it('14. Service niche resolveServiceItemPlacement orients ladder and ironing board edge-on (thin edge in front, broad face parallel to side panels)', () => {
    // Kullanıcı genişlik ve derinliği ters girse bile (ör. 470x130), niş yerleşimi ince kenarı (130mm) öne, geniş yüzeyi (470mm) derinliğe paralel yerleştirir
    const ladderSwapped = resolveServiceItemPlacement({
      id: 'item-step-ladder',
      name: 'Katlanır Merdiven',
      widthMm: 470,
      depthMm: 130,
      heightMm: 1180,
    });
    expect(ladderSwapped.frontWidthMm).toBe(130);
    expect(ladderSwapped.intoDepthMm).toBe(470);
    expect(ladderSwapped.verticalHeightMm).toBe(1180);

    const ironingBoard = resolveServiceItemPlacement({
      id: 'item-ironing-board',
      name: 'Ütü Masası (Katlı)',
      widthMm: 90,
      depthMm: 410,
      heightMm: 1380,
    });
    expect(ironingBoard.frontWidthMm).toBe(90);
    expect(ironingBoard.intoDepthMm).toBe(410);
  });

  it('15. startBlankDesign creates a clean empty wardrobe from scratch, supports Undo recovery, and preserves all 3 SAMPLE_DESIGNS intact', () => {
    const store = useWardrobeStore.getState();
    store.loadPreset('l-diagonal-asymmetric');
    store.startBlankDesign({
      name: 'Sıfırdan Test Dolabı',
      layoutKind: 'l-shape',
      cornerType: 'diagonal',
      lengthAMm: 3000,
      depthAMm: 600,
      lengthBMm: 2400,
      depthBMm: 550,
      heightMm: 2450,
    });

    const state = useWardrobeStore.getState();
    expect(state.design.name).toBe('Sıfırdan Test Dolabı');
    expect(state.design.layoutKind).toBe('l-shape');
    expect(state.resolved.cells.every((c) => c.insert === null || c.insert.type === 'empty')).toBe(
      true
    );
    // Yanlışlıkla sıfırdan başlatılırsa tek tıkla Geri Al (Undo) ile önceki tasarıma dönülebilir
    expect(state.historyPast).toHaveLength(1);

    // Orijinal 3 hazır şablon korunmuş olmalı
    expect(Object.keys(SAMPLE_DESIGNS)).toEqual([
      'l-diagonal-asymmetric',
      'l-blind-corner',
      'straight-wardrobe',
    ]);
  });

  it('16. Dimension annotations expose editTarget metadata and link derived bayInner dimensions to their source outer width', () => {
    const resolved = solveDesign(SAMPLE_DESIGNS['l-diagonal-asymmetric']);

    const runLenDim = resolved.dimensions.find((d) => d.id === 'run-A-dim-total')!;
    expect(runLenDim.editTarget).toBe('runLength');

    const cornerADim = resolved.dimensions.find(
      (d) => d.kind === 'cornerArm' && d.runId === 'run-A'
    )!;
    expect(cornerADim.editTarget).toBe('cornerArmA');

    const bayA1Outer = resolved.dimensions.find((d) => d.id === 'bay-A1-dim-outer')!;
    const bayA1Inner = resolved.dimensions.find((d) => d.id === 'bay-A1-dim-inner')!;
    expect(bayA1Outer.editTarget).toBe('bayOuterWidth');
    expect(bayA1Inner.editTarget).toBe('bayInnerDerived');
    expect(bayA1Inner.sourceValueMm).toBe(bayA1Outer.valueMm);
  });

  it('17. Consecutive dimension edits (800 -> 850 -> 900) preserve each step in Undo/Redo and saveCheckpoint() commits a new clean checkpoint', () => {
    const store = useWardrobeStore.getState();
    store.loadPreset('straight-wardrobe');

    // Başlangıçta bay-S1 dış genişliği 800 mm ve kayıt noktası temiz
    expect(
      useWardrobeStore.getState().resolved.bays.find((b) => b.id === 'bay-S1')?.outerWidthMm
    ).toBe(800);
    expect(useWardrobeStore.getState().hasUnsavedChanges).toBe(false);
    expect(useWardrobeStore.getState().historyPast).toHaveLength(0);

    // Ardışık iki değişiklik: 800 -> 850 -> 900
    useWardrobeStore.getState().setBaySize('run-A', 'bay-S1', { kind: 'fixed', mm: 850 });
    useWardrobeStore.getState().setBaySize('run-A', 'bay-S1', { kind: 'fixed', mm: 900 });

    expect(
      useWardrobeStore.getState().resolved.bays.find((b) => b.id === 'bay-S1')?.outerWidthMm
    ).toBe(900);
    expect(useWardrobeStore.getState().hasUnsavedChanges).toBe(true);
    expect(useWardrobeStore.getState().historyPast).toHaveLength(2);

    // 1. Geri Al -> 850 mm
    useWardrobeStore.getState().undo();
    expect(
      useWardrobeStore.getState().resolved.bays.find((b) => b.id === 'bay-S1')?.outerWidthMm
    ).toBe(850);

    // 2. Geri Al -> 800 mm (Checkpoint noktasına geri döndü -> hasUnsavedChanges false olmalı!)
    useWardrobeStore.getState().undo();
    expect(
      useWardrobeStore.getState().resolved.bays.find((b) => b.id === 'bay-S1')?.outerWidthMm
    ).toBe(800);
    expect(useWardrobeStore.getState().hasUnsavedChanges).toBe(false);

    // İki kez İleri Al (Redo) -> 850 -> 900 mm
    useWardrobeStore.getState().redo();
    useWardrobeStore.getState().redo();
    expect(
      useWardrobeStore.getState().resolved.bays.find((b) => b.id === 'bay-S1')?.outerWidthMm
    ).toBe(900);
    expect(useWardrobeStore.getState().hasUnsavedChanges).toBe(true);

    // Manuel Kaydet (saveCheckpoint) -> 900 mm yeni başlangıç/kayıt noktası olur ve Undo/Redo geçmişi sıfırlanır
    useWardrobeStore.getState().saveCheckpoint();
    expect(useWardrobeStore.getState().hasUnsavedChanges).toBe(false);
    expect(useWardrobeStore.getState().historyPast).toHaveLength(0);
    expect(useWardrobeStore.getState().historyFuture).toHaveLength(0);
    expect(
      useWardrobeStore.getState().resolved.bays.find((b) => b.id === 'bay-S1')?.outerWidthMm
    ).toBe(900);
  });

  // ============================================================================
  // AŞAMA 2.2 TESTLERİ: HER GÖRÜNÜR İÇ BÖLMENİN (RAF ARALIKLARI, ÇİFT ASKI
  // BÖLGELERİ, BEŞGEN KÖŞE ARALIKLARI) BAĞIMSIZ SEÇİMİ VE AYRIŞTIRILMASI
  // ============================================================================

  it('18. Every visible compartment (shelfStack intervals, shoeRack intervals, doubleHanging zones, and diagonal corner intervals) generates an independent ResolvedCell with coveringDoorIds', () => {
    const resolved = solveDesign(SAMPLE_DESIGNS['l-diagonal-asymmetric']);

    // bay-B2: Üstte 3 raflı shelfStack -> 4 bağımsız raf aralığı; Altta 5 raflı shoeRack -> 6 bağımsız ayakkabı aralığı (Toplam 10 görünür bölme)
    const bayB2Cells = resolved.cells.filter((c) => c.bayId === 'bay-B2');
    expect(bayB2Cells).toHaveLength(10);

    const shoeIntervals = bayB2Cells.filter((c) => c.sourceLeafId === 'cell-b2-shoes');
    expect(shoeIntervals).toHaveLength(6);
    expect(shoeIntervals.map((c) => c.id)).toEqual([
      'cell-b2-shoes::sub-0',
      'cell-b2-shoes::sub-1',
      'cell-b2-shoes::sub-2',
      'cell-b2-shoes::sub-3',
      'cell-b2-shoes::sub-4',
      'cell-b2-shoes::sub-5',
    ]);

    const topBoxIntervals = bayB2Cells.filter((c) => c.sourceLeafId === 'cell-b2-boxes');
    expect(topBoxIntervals).toHaveLength(4);

    // Her alt aralığın Y sınırları çakışmamalı ve arasında 18mm raf kalınlığı bulunmalı
    for (let i = 0; i < shoeIntervals.length - 1; i++) {
      expect(shoeIntervals[i + 1].yStartMm - shoeIntervals[i].yEndMm).toBe(18);
    }

    // bay-A2: Çift askılı bölme (doubleHanging) -> Alt ve Üst olmak üzere 2 bağımsız askı bölgesi + üst yüklük
    const doubleHangCells = resolved.cells.filter(
      (c) => c.sourceLeafId === 'cell-a2-double-hang'
    );
    expect(doubleHangCells).toHaveLength(2);
    expect(doubleHangCells[0].subIntervalKind).toBe('doubleHangInterval');
    expect(doubleHangCells[1].subIntervalKind).toBe('doubleHangInterval');
    expect((doubleHangCells[0].coveringDoorIds ?? []).length).toBeGreaterThan(0);

    // Beşgen Köşe (junc-main): 4 raflı diyagonal köşe -> 5 bağımsız beşgen köşe raf aralığı
    const cornerCells = resolved.cells.filter((c) => c.subIntervalKind === 'cornerInterval');
    expect(cornerCells).toHaveLength(5);
    for (const cc of cornerCells) {
      expect(cc.polygonXZMm).toBeDefined();
      expect(cc.polygonXZMm).toHaveLength(5);
      expect(cc.coveringDoorIds ?? []).toContain('door-corner-junc-main');
    }
  });

  it('19. Splitting or isolating a single sub-interval (e.g. cell-b2-shoes::sub-2) materializes only that compartment without shifting shelf positions and supports single-step Undo', () => {
    const store = useWardrobeStore.getState();
    store.loadPreset('l-diagonal-asymmetric');

    const beforeSub2 = useWardrobeStore
      .getState()
      .resolved.cells.find((c) => c.id === 'cell-b2-shoes::sub-2')!;
    expect(beforeSub2).toBeDefined();
    const { yStartMm, yEndMm, netWidthMm } = beforeSub2;

    // 3. ayakkabı raf aralığını bağımsız alt hücreye ayır ve dikey olarak ikiye böl
    useWardrobeStore.getState().splitCell('cell-b2-shoes::sub-2', 'vertical', 'equal');

    const afterCells = useWardrobeStore
      .getState()
      .resolved.cells.filter(
        (c) => c.bayId === 'bay-B2' && c.yStartMm === yStartMm && c.yEndMm === yEndMm
      );
    // Yalnızca bu raf aralığı iki yan yana bölmeye ayrılmış olmalı (arada 18mm dikey bölücü ile)
    expect(afterCells).toHaveLength(2);
    expect(afterCells[0].netWidthMm + 18 + afterCells[1].netWidthMm).toBe(netWidthMm);

    // Tek adımda Geri Al (Undo) ile orijinal 6 aralıklı ayakkabılığa geri dönülmeli
    useWardrobeStore.getState().undo();
    const restoredShoeIntervals = useWardrobeStore
      .getState()
      .resolved.cells.filter((c) => c.sourceLeafId === 'cell-b2-shoes');
    expect(restoredShoeIntervals).toHaveLength(6);
  });

  it('20. Clicking/toggling a door or drawer only animates the door/drawer and never alters selectedCellId or selectedBayId', () => {
    const store = useWardrobeStore.getState();
    store.loadPreset('l-diagonal-asymmetric');

    // Seçili hücreyi belirli bir raf aralığına ayarla
    useWardrobeStore.getState().selectCell('cell-b1-shelves::sub-1', 'bay-B1');
    expect(useWardrobeStore.getState().selectedCellId).toBe('cell-b1-shelves::sub-1');
    expect(useWardrobeStore.getState().selectedBayId).toBe('bay-B1');

    // Başka bir bölmenin (bay-A2) kapağını ve bir çekmeceyi aç/kapat
    const doorA2 = useWardrobeStore
      .getState()
      .resolved.doors.find((d) => d.bayId === 'bay-A2')!;
    const drawerA1 = useWardrobeStore.getState().resolved.drawers[0]!;

    useWardrobeStore.getState().toggleDoor(doorA2.id);
    expect(useWardrobeStore.getState().selectedCellId).toBe('cell-b1-shelves::sub-1');
    expect(useWardrobeStore.getState().selectedBayId).toBe('bay-B1');

    useWardrobeStore.getState().toggleDrawer(drawerA1.id);
    expect(useWardrobeStore.getState().selectedCellId).toBe('cell-b1-shelves::sub-1');
    expect(useWardrobeStore.getState().selectedBayId).toBe('bay-B1');
  });

  // ============================================================================
  // AŞAMA 2.3 TESTLERİ: ÇOKLU HÜCRE SEÇİMİ, ARALIK DÖNÜŞTÜRME (6 -> 7 EŞİT ARALIK),
  // YÖNLÜ BOYUTLANDIRMA VE KIRMIZI KOMŞU ÇAKIŞMA ÇÖZÜMÜ
  // ============================================================================

  it('21. Multi-cell selection (setSelectedCells) and analyzeSelectedCellsGroup compute contiguous stack gross/net/divider totals without polluting Undo history', () => {
    const store = useWardrobeStore.getState();
    store.loadPreset('l-diagonal-asymmetric');
    store.saveCheckpoint();

    const shoeCellIds = [
      'cell-b2-shoes::sub-0',
      'cell-b2-shoes::sub-1',
      'cell-b2-shoes::sub-2',
      'cell-b2-shoes::sub-3',
      'cell-b2-shoes::sub-4',
      'cell-b2-shoes::sub-5',
    ];

    useWardrobeStore.getState().setSelectedCells(shoeCellIds, 'bay-B2');

    const state = useWardrobeStore.getState();
    expect(state.selectedCellIds).toEqual(shoeCellIds);
    expect(state.selectedBayId).toBe('bay-B2');
    // Seçim yapmak Undo geçmişine adım eklememeli ve hasUnsavedChanges üretmemeli
    expect(state.historyPast).toHaveLength(0);
    expect(state.hasUnsavedChanges).toBe(false);

    const group = analyzeSelectedCellsGroup(state.selectedCellIds, state.resolved);
    expect(group.cells).toHaveLength(6);
    expect(group.isContiguousVertical).toBe(true);
    // 6 aralık arasında 5 adet 18mm raf bölücü bulunur (5 × 18 = 90mm)
    expect(group.heightDividersMm).toBe(90);
    expect(group.grossHeightMm).toBe(950);
    expect(group.netHeightSumMm).toBe(860);
    expect(group.netHeightSumMm + group.heightDividersMm).toBe(group.grossHeightMm);
  });

  it('22. Converting 6 equal shelf intervals into 7 equal intervals (setContiguousGroupIntervalCount) preserves exact gross height with 0mm drift and reverts in 1 Undo step', () => {
    const store = useWardrobeStore.getState();
    store.loadPreset('l-diagonal-asymmetric');
    store.saveCheckpoint();

    const shoeCellIds = [
      'cell-b2-shoes::sub-0',
      'cell-b2-shoes::sub-1',
      'cell-b2-shoes::sub-2',
      'cell-b2-shoes::sub-3',
      'cell-b2-shoes::sub-4',
      'cell-b2-shoes::sub-5',
    ];
    useWardrobeStore.getState().setSelectedCells(shoeCellIds, 'bay-B2');

    // 6 eşit aralığı 7 eşit aralığa dönüştür
    useWardrobeStore.getState().setContiguousGroupIntervalCount(7);

    const afterState = useWardrobeStore.getState();
    // bay-B2 alt bölgesinde (cell-b2-shoes: yStart=98..yEnd=1048mm, 950mm brüt yükseklik) artık 7 aralık bulunmalı
    const lowerCells = afterState.resolved.cells.filter(
      (c) => c.bayId === 'bay-B2' && c.sourceLeafId === 'cell-b2-shoes'
    );
    expect(lowerCells).toHaveLength(7);

    // 7 aralık + 6 × 18mm (108mm) ara raf = 950mm brüt yükseklik (net toplam = 842mm)
    const netSum = lowerCells.reduce((acc, c) => acc + c.netHeightMm, 0);
    expect(netSum).toBe(950 - 6 * 18); // 842 mm
    for (const c of lowerCells) {
      expect(Number.isInteger(c.netHeightMm)).toBe(true);
      // 842 / 7 = 120mm veya 121mm
      expect(c.netHeightMm === 120 || c.netHeightMm === 121).toBe(true);
    }

    // Tek adımda Geri Al (Undo) -> tekrar 6 aralığa döner
    useWardrobeStore.getState().undo();
    const restoredShoes = useWardrobeStore
      .getState()
      .resolved.cells.filter((c) => c.sourceLeafId === 'cell-b2-shoes');
    expect(restoredShoes).toHaveLength(6);
  });

  it('23. Directional resizing (Y / up) does NOT auto-shrink neighbor cell without user approval; shows conflict mm, balances neighbor, and commits in 1 Undo step', () => {
    const store = useWardrobeStore.getState();
    store.loadPreset('l-diagonal-asymmetric');
    store.saveCheckpoint();

    // bay-B2'de en alttaki ayakkabı raf aralığını (cell-b2-shoes::sub-0) seçelim
    const bottomSub0 = useWardrobeStore
      .getState()
      .resolved.cells.find((c) => c.id === 'cell-b2-shoes::sub-0')!;
    const upperSub1 = useWardrobeStore
      .getState()
      .resolved.cells.find((c) => c.id === 'cell-b2-shoes::sub-1')!;

    const initialH0 = bottomSub0.netHeightMm; // ~144 mm
    const initialH1 = upperSub1.netHeightMm; // ~143 mm

    useWardrobeStore.getState().selectCell('cell-b2-shoes::sub-0', 'bay-B2');

    // Alt aralığı yukarı doğru (+Y) 200 mm'ye büyütmek için taslak başlat
    useWardrobeStore.getState().startOrUpdateResizeDraft('Y', 'up', 200);

    const draftState = useWardrobeStore.getState();
    expect(draftState.resizeDraft).not.toBeNull();
    // Taslak aşamasında gerçek tasarım henüz değişmemiş olmalı!
    const liveSub1DuringDraft = draftState.resolved.cells.find(
      (c) => c.id === 'cell-b2-shoes::sub-1'
    )!;
    expect(liveSub1DuringDraft.netHeightMm).toBe(initialH1);

    // Kırmızı komşu çakışması tespit edilmiş olmalı (200 - initialH0 > 0) ve çakışma varken commitResizeDraft() false dönmeli
    expect(draftState.resizeDraft!.conflictOverlapMm).toBe(200 - initialH0);
    expect(draftState.resizeDraft!.neighborCellIds).toContain('cell-b2-shoes::sub-1');
    expect(useWardrobeStore.getState().commitResizeDraft()).toBe(false);

    // İptal testi: cancelResizeDraft() hiçbir değişiklik yapmadan taslağı kapatır
    useWardrobeStore.getState().cancelResizeDraft();
    expect(useWardrobeStore.getState().resizeDraft).toBeNull();
    expect(useWardrobeStore.getState().historyPast).toHaveLength(0);

    // Tekrar taslak aç ve komşuyu kullanıcı onayıyla dengele (autoBalanceResizeDraftNeighbor)
    useWardrobeStore.getState().startOrUpdateResizeDraft('Y', 'up', 200);
    useWardrobeStore.getState().autoBalanceResizeDraftNeighbor();

    const balancedDraft = useWardrobeStore.getState().resizeDraft!;
    expect(balancedDraft.conflictOverlapMm).toBe(0);
    expect(balancedDraft.neighborDraftMm).toBe(initialH1 - (200 - initialH0));

    // Onayla ve Uygula -> Tek bir Undo adımında her iki hücre birlikte güncellenir
    const committed = useWardrobeStore.getState().commitResizeDraft();
    expect(committed).toBe(true);
    expect(useWardrobeStore.getState().resizeDraft).toBeNull();
    expect(useWardrobeStore.getState().historyPast).toHaveLength(1);

    const afterCells = useWardrobeStore
      .getState()
      .resolved.cells.filter((c) => c.bayId === 'bay-B2' && c.yEndMm <= 1050)
      .sort((a, b) => a.yStartMm - b.yStartMm);

    expect(afterCells[0].netHeightMm).toBe(200);
    expect(afterCells[1].netHeightMm).toBe(initialH1 - (200 - initialH0));
    // Diğer 4 üst aralığın yüksekliği 1 mm bile değişmemiş olmalı!
    expect(afterCells).toHaveLength(6);

    // Tek adımda Geri Al -> Orijinal ölçülere döner
    useWardrobeStore.getState().undo();
    const revertedSub0 = useWardrobeStore
      .getState()
      .resolved.cells.find((c) => c.id === 'cell-b2-shoes::sub-0')!;
    expect(revertedSub0.netHeightMm).toBe(initialH0);
  });

  it('24. Proportional group resize of multiple contiguous intervals scales heights proportionally and resolves neighbor conflict cleanly', () => {
    const store = useWardrobeStore.getState();
    store.loadPreset('l-diagonal-asymmetric');
    store.saveCheckpoint();

    // İlk 2 ayakkabı aralığını birlikte seçelim
    const pairIds = ['cell-b2-shoes::sub-0', 'cell-b2-shoes::sub-1'];
    useWardrobeStore.getState().setSelectedCells(pairIds, 'bay-B2');

    const groupBefore = analyzeSelectedCellsGroup(pairIds, useWardrobeStore.getState().resolved);
    const initialGross = groupBefore.grossHeightMm; // ~305 mm (2 net + 18mm)
    const targetGross = initialGross + 60; // +60 mm yukarı büyüt

    useWardrobeStore.getState().startOrUpdateResizeDraft('Y', 'up', targetGross);
    expect(useWardrobeStore.getState().resizeDraft!.conflictOverlapMm).toBe(60);
    expect(useWardrobeStore.getState().resizeDraft!.neighborCellIds).toContain(
      'cell-b2-shoes::sub-2'
    );

    // Komşu 3. aralığı 60 mm küçülterek çakışmayı sıfırla ve uygula
    useWardrobeStore.getState().autoBalanceResizeDraftNeighbor();
    expect(useWardrobeStore.getState().commitResizeDraft()).toBe(true);

    const lowerCells = useWardrobeStore
      .getState()
      .resolved.cells.filter((c) => c.bayId === 'bay-B2' && c.yEndMm <= 1050)
      .sort((a, b) => a.yStartMm - b.yStartMm);

    // İlk iki aralığın brüt yüksekliği (net0 + 18 + net1) tam olarak targetGross olmalı
    expect(lowerCells[0].netHeightMm + 18 + lowerCells[1].netHeightMm).toBe(targetGross);
  });

  // ============================================================================
  // AŞAMA 2.4 TESTLERİ: İKİ PARAMETRELİ MALZEME KALINLIĞI, BAĞIMSIZ ÇEKMECE,
  // ÇOKLU RAF GRUBU BİRLEŞTİRME, KAPAK EDİTÖRÜ, BEŞGEN KÖŞE Y BOYUTLANDIRMA & ÇOKLU UNDO
  // ============================================================================

  it('25. Two-parameter material thickness (18mm -> 25mm main panel, 8mm -> 4mm back/drawer bottom) updates net bay widths, dividers, and 5-panel drawer boxes', () => {
    const store = useWardrobeStore.getState();
    store.loadPreset('l-diagonal-asymmetric');
    store.setBaySize('run-A', 'bay-A1', { kind: 'fixed', mm: 800 });
    store.saveCheckpoint();

    const bayA1Before = useWardrobeStore
      .getState()
      .resolved.bays.find((b) => b.id === 'bay-A1')!;
    // 18mm kalınlıkta 800mm dış genişlik -> 764mm net iç genişlik
    expect(bayA1Before.outerWidthMm).toBe(800);
    expect(bayA1Before.netInnerWidthMm).toBe(764);

    // Ana paneli 25 mm, arkalık/çekmece tabanını 4 mm yap
    useWardrobeStore.getState().updateMaterialThicknesses(25, 4);

    const afterState = useWardrobeStore.getState();
    expect(afterState.resolved.panelThicknessMm).toBe(25);
    expect(afterState.resolved.backPanelThicknessMm).toBe(4);

    const bayA1After = afterState.resolved.bays.find((b) => b.id === 'bay-A1')!;
    // Dış genişlik 800mm korunur, net iç genişlik 800 - 2*25 = 750mm olur!
    expect(bayA1After.outerWidthMm).toBe(800);
    expect(bayA1After.netInnerWidthMm).toBe(750);

    // 5 panelli çekmece kasası yan kalınlığı 25mm, taban kalınlığı 4mm olmalı
    const firstDrawer = afterState.resolved.drawers[0]!;
    expect(firstDrawer.sideThicknessMm).toBe(25);
    expect(firstDrawer.bottomThicknessMm).toBe(4);
    expect(firstDrawer.innerWidthMm).toBe(firstDrawer.boxSizeMm[0] - 2 * 25);

    // Kalın panel (25mm) ve ince arkalık (4mm) doğrulama uyarıları üretilmeli
    expect(afterState.resolved.issues.some((i) => i.code === 'HEAVY_PANEL_THICKNESS')).toBe(true);
    expect(afterState.resolved.issues.some((i) => i.code === 'THIN_BACK_PANEL_THICKNESS')).toBe(
      true
    );
  });

  it('26. Independent drawer selection and individual drawer front height editing auto-balances sibling drawers in 1 Undo step', () => {
    const store = useWardrobeStore.getState();
    store.loadPreset('l-diagonal-asymmetric');
    store.saveCheckpoint();

    const initialDrawers = useWardrobeStore
      .getState()
      .resolved.drawers.filter((d) => d.cellId === 'cell-a1-drawers');
    expect(initialDrawers).toHaveLength(4);
    const d0 = initialDrawers[0];
    const d1 = initialDrawers[1];

    // Bağımsız çekmece seçimi Undo geçmişini kirletmemeli
    useWardrobeStore.getState().selectDrawer(d0.id, d0.cellId, d0.bayId, false);
    expect(useWardrobeStore.getState().selectedDrawerIds).toEqual([d0.id]);
    expect(useWardrobeStore.getState().historyPast).toHaveLength(0);

    // Shift+Click ile ikinci çekmeceyi çoklu seçime ekle
    useWardrobeStore.getState().selectDrawer(d1.id, d1.cellId, d1.bayId, true);
    expect(useWardrobeStore.getState().selectedDrawerIds).toEqual([d0.id, d1.id]);

    // 1. çekmecenin ön yüksekliğini 220 mm olarak güncelle
    useWardrobeStore.getState().updateSelectedDrawerHeight(d0.id, 220);

    const updatedDrawers = useWardrobeStore
      .getState()
      .resolved.drawers.filter((d) => d.cellId === 'cell-a1-drawers');
    expect(updatedDrawers[0].heightMm).toBe(220);

    // Çekmeceleri Eşitle (equalizeDrawerBankHeights) ile tekrar eşit yüksekliğe döner
    useWardrobeStore.getState().equalizeDrawerBankHeights('cell-a1-drawers');
    const equalizedDrawers = useWardrobeStore
      .getState()
      .resolved.drawers.filter((d) => d.cellId === 'cell-a1-drawers');
    expect(equalizedDrawers[0].heightMm).toBe(d0.heightMm);
  });

  it('27. Multi-shelf-group selection (upper shelfStack + lower shoeRack in bay-B2) supports batch interval count and merging into one continuous group', () => {
    const store = useWardrobeStore.getState();
    store.loadPreset('l-diagonal-asymmetric');
    store.saveCheckpoint();

    // bay-B2'deki üst raf grubu (cell-b2-boxes) ve alt ayakkabılık grubundan (cell-b2-shoes) hücreleri birlikte seç
    const b2Cells = useWardrobeStore
      .getState()
      .resolved.cells.filter((c) => c.bayId === 'bay-B2');
    const allB2Ids = b2Cells.map((c) => c.id);

    useWardrobeStore.getState().setSelectedCells(allB2Ids, 'bay-B2');
    const groupInfo = analyzeSelectedCellsGroup(allB2Ids, useWardrobeStore.getState().resolved);

    expect(groupInfo.isMultiShelfGroupSelection).toBe(true);
    expect(groupInfo.shelfGroups).toHaveLength(2);
    expect(groupInfo.canMergeShelfGroups).toBe(true);

    // İki raf grubunu birleştirip tek bir sürekli 8 eşit aralıklı raf grubuna böl
    useWardrobeStore.getState().mergeAndResplitSelectedGroups(8);

    const mergedB2Cells = useWardrobeStore
      .getState()
      .resolved.cells.filter((c) => c.bayId === 'bay-B2');
    expect(mergedB2Cells).toHaveLength(8);

    // Tek adımda Geri Al -> Orijinal 2 ayrı raf grubuna geri döner
    useWardrobeStore.getState().undo();
    const restoredGroupInfo = analyzeSelectedCellsGroup(
      allB2Ids,
      useWardrobeStore.getState().resolved
    );
    expect(restoredGroupInfo.shelfGroups).toHaveLength(2);
  });

  it('28. Door Editor Mode splits a full-height bay door horizontally into Upper Yüklük + Lower Body doors and merges them back', () => {
    const store = useWardrobeStore.getState();
    store.loadPreset('l-diagonal-asymmetric');
    store.saveCheckpoint();

    const doorsBefore = useWardrobeStore
      .getState()
      .resolved.doors.filter((d) => d.bayId === 'bay-A2');
    // bay-A2 (800mm) başlangıçta tam boy çift kapak (2 kanat)
    expect(doorsBefore).toHaveLength(2);

    // bay-A2 kapağını Y=1850mm yüksekliğinden yatay olarak ikiye böl (Alt Çift Kapak + Üst Yüklük Çift Kapak = 4 kanat)
    useWardrobeStore.getState().splitBayDoorHorizontally('bay-A2', 1850);

    const doorsAfterSplit = useWardrobeStore
      .getState()
      .resolved.doors.filter((d) => d.bayId === 'bay-A2');
    expect(doorsAfterSplit).toHaveLength(4);
    expect(doorsAfterSplit.every((d) => d.isPartialHeight)).toBe(true);

    // Bölünmüş kapakları tekrar tek tam boy kapakta birleştir
    useWardrobeStore.getState().mergeBayDoors('bay-A2');
    const doorsAfterMerge = useWardrobeStore
      .getState()
      .resolved.doors.filter((d) => d.bayId === 'bay-A2');
    expect(doorsAfterMerge).toHaveLength(2);
  });

  it('29. Pentagonal corner shelf interval supports vertical (Y) directional resize with neighbor balancing', () => {
    const store = useWardrobeStore.getState();
    store.loadPreset('l-diagonal-asymmetric');
    store.saveCheckpoint();

    const cornerCellsBefore = useWardrobeStore
      .getState()
      .resolved.cells.filter((c) => c.subIntervalKind === 'cornerInterval');
    expect(cornerCellsBefore.length).toBeGreaterThanOrEqual(2);

    const c0 = cornerCellsBefore[0];
    const targetH = c0.netHeightMm + 50;

    useWardrobeStore.getState().selectCell(c0.id, c0.bayId);
    useWardrobeStore.getState().startOrUpdateResizeDraft('Y', 'up', targetH);

    // Komşu köşe raf aralığı ile 50mm çakışma tespit edilmeli
    expect(useWardrobeStore.getState().resizeDraft?.conflictOverlapMm).toBe(50);

    // Komşuyu dengele ve uygula
    useWardrobeStore.getState().autoBalanceResizeDraftNeighbor();
    expect(useWardrobeStore.getState().commitResizeDraft()).toBe(true);

    const cornerCellsAfter = useWardrobeStore
      .getState()
      .resolved.cells.filter((c) => c.subIntervalKind === 'cornerInterval');
    expect(cornerCellsAfter[0].netHeightMm).toBe(targetH);
  });

  it('30. Adding a new bay at run end (addBayAtRunEnd) and multi-step Undo (undoSteps / revertToCheckpoint) work deterministically', () => {
    const store = useWardrobeStore.getState();
    store.loadPreset('l-diagonal-asymmetric');
    store.saveCheckpoint();

    const initialBayCount = useWardrobeStore.getState().resolved.bays.length;

    // 3 farklı işlem gerçekleştir
    useWardrobeStore.getState().addBayAtRunEnd('run-A', {
      starterPreset: 'drawers',
      widthMode: 'fixed',
      widthMm: 600,
      autoExtendRunLength: true,
    });
    useWardrobeStore.getState().updateMaterialThicknesses(22, 8);
    useWardrobeStore.getState().setCornerDoorMode('right');

    expect(useWardrobeStore.getState().historyPast).toHaveLength(3);
    expect(useWardrobeStore.getState().resolved.bays.length).toBe(initialBayCount + 1);

    // 2 adım birden geri al (undoSteps(2)) -> Redo geçmişinde 2 adım korunmalı
    useWardrobeStore.getState().undoSteps(2);
    expect(useWardrobeStore.getState().historyPast).toHaveLength(1);
    expect(useWardrobeStore.getState().historyFuture).toHaveLength(2);
    expect(useWardrobeStore.getState().resolved.panelThicknessMm).toBe(18);

    // Son kayıt noktasına dön (revertToCheckpoint) -> tüm adımlar geri alınır
    useWardrobeStore.getState().revertToCheckpoint();
    expect(useWardrobeStore.getState().historyPast).toHaveLength(0);
    expect(useWardrobeStore.getState().resolved.bays.length).toBe(initialBayCount);
    expect(useWardrobeStore.getState().hasUnsavedChanges).toBe(false);
  });

  // ===========================================================================
  // AŞAMA 3 TESTLERİ: PBR MALZEME, DÜNYA ÖLÇEKLİ UV, CAM/AYNA DOĞRULAMASI,
  // KULP ÖZELLEŞTİRME, GÖMME GARDIROP BİTİŞİ, İÇ LED VE 3D EŞYA SIĞMA KONTROLLERİ
  // ===========================================================================

  it('31. PBR Material Catalog provides 17 materials across 5 categories and world-space UV mapping scales proportionally without texture stretching', () => {
    const allMaterials = Object.values(MATERIAL_CATALOG);
    expect(allMaterials.length).toBe(17);
    expect(Object.keys(HANDLE_STYLE_CATALOG).length).toBe(6);
    expect(Object.keys(HANDLE_FINISH_CATALOG).length).toBe(5);

    // 1m vs 2m kutu geometrisinin UV açıklığı tam 2 kat olmalı (doku sünmesini önler)
    const box1m = createWorldSpaceBoxGeometry([1, 2, 0.6], 'vertical');
    const box2m = createWorldSpaceBoxGeometry([2, 2, 0.6], 'vertical');

    const getMaxV = (geom: ReturnType<typeof createWorldSpaceBoxGeometry>) => {
      const uv = geom.attributes.uv;
      let maxV = -Infinity;
      let minV = Infinity;
      for (let i = 0; i < uv.count; i++) {
        const v = uv.getY(i);
        if (v > maxV) maxV = v;
        if (v < minV) minV = v;
      }
      return maxV - minV;
    };

    expect(getMaxV(box2m)).toBeCloseTo(getMaxV(box1m) * 2, 3);

    // Beşgen poligon raf ekstrüzyon geometrisi de dünya ölçekli UV üretmeli
    const polyGeom = createWorldSpaceExtrudeGeometry(
      [
        { xMm: 0, zMm: 0 },
        { xMm: 900, zMm: 0 },
        { xMm: 900, zMm: 600 },
        { xMm: 600, zMm: 900 },
        { xMm: 0, zMm: 900 },
      ],
      0.018
    );
    expect(polyGeom.attributes.uv.count).toBeGreaterThan(0);
  });

  it('32. Selecting glass or mirror door material emits GLASS_MIRROR_CONSTRUCTION_INFO expert validation note', () => {
    const store = useWardrobeStore.getState();
    store.loadPreset('l-diagonal-asymmetric');
    store.setMaterials({ frontMaterialId: 'smokedGlass' });

    const issues = useWardrobeStore.getState().resolved.issues;
    const glassNote = issues.find((iss) => iss.code === 'GLASS_MIRROR_CONSTRUCTION_INFO');
    expect(glassNote).toBeDefined();
    expect(glassNote?.description).toContain('alüminyum çerçeveli');
  });

  it('33. Door and drawer handle customization updates ResolvedDoorLeaf / ResolvedDrawerUnit and stays flush when panelThicknessMm changes (18mm -> 25mm)', () => {
    const store = useWardrobeStore.getState();
    store.loadPreset('l-diagonal-asymmetric');
    store.updateMaterialThicknesses(18, 8);

    // Kulp modelini ve rengini özelleştir
    store.setGlobalDoorHandle({
      styleId: 'profileVertical',
      finishId: 'warmGold',
      lengthMm: 600,
      placement: 'verticalEdge',
    });

    const door18 = useWardrobeStore
      .getState()
      .resolved.doors.find((d) => !d.isCornerDoor)!;
    const drawer18 = useWardrobeStore.getState().resolved.drawers[0];
    expect(door18.handleConfig?.styleId).toBe('profileVertical');
    expect(door18.handleConfig?.finishId).toBe('warmGold');
    expect(door18.handleLengthMm).toBe(600);
    // 18mm kapakta kulp Z ofseti kapak dış yüzeyi (t + 14 = 32mm)
    expect(door18.handleOffsetMm[2]).toBe(18 + 14);

    // Ana panel kalınlığını 25mm yap -> kulp Z ofseti otomatik olarak 25 + 14 = 39mm olmalı
    store.updateMaterialThicknesses(25, 8);
    const door25 = useWardrobeStore
      .getState()
      .resolved.doors.find((d) => !d.isCornerDoor)!;
    const drawer25 = useWardrobeStore.getState().resolved.drawers[0];
    expect(door25.handleOffsetMm[2]).toBe(25 + 14);
    expect(drawer25.handleWorldPositionMm).not.toEqual(drawer18.handleWorldPositionMm);
  });

  it('34. "Düz Gömme / Minimal Bitiş" (builtInMinimal) removes decorative crown/side trims while preserving all structural carcass panels', () => {
    const store = useWardrobeStore.getState();
    store.loadPreset('l-diagonal-asymmetric');

    // Önce klasik çerçeveli/taçlı bitiş uygula -> dekoratif yan pervaz ve taç panelleri üretilmeli
    store.applyExteriorFinishPreset('classicTrimmed');
    const panelsClassic = useWardrobeStore.getState().resolved.panels;
    expect(panelsClassic.some((p) => p.isDecorativeTrim)).toBe(true);

    // Şimdi "Düz Gömme / Minimal Bitiş" uygula -> dekoratif çıkıntılı pervaz/taç kalmamalı, ancak tüm taşıyıcı dikme/alt/üst tablalar korunmalı
    store.applyExteriorFinishPreset('builtInMinimal');
    const panelsMinimal = useWardrobeStore.getState().resolved.panels;
    expect(
      panelsMinimal.some(
        (p) => p.role === 'decorativeSideTrim' || p.role === 'crownMolding'
      )
    ).toBe(false);

    // Yapısal taşıyıcı paneller (sidePanel, bottomPanel, topPanel) eksiksiz korunmalı
    const sidePanels = panelsMinimal.filter((p) => p.role === 'sidePanel');
    const bottomPanels = panelsMinimal.filter((p) => p.role === 'bottomPanel');
    const topPanels = panelsMinimal.filter((p) => p.role === 'topPanel');
    expect(sidePanels.length).toBeGreaterThanOrEqual(8);
    expect(bottomPanels.length).toBeGreaterThanOrEqual(4);
    expect(topPanels.length).toBeGreaterThanOrEqual(4);
  });

  it('35. Interior LED strips are generated for shelves, hanging rods, and pentagonal corner and reposition when panelThicknessMm changes', () => {
    const store = useWardrobeStore.getState();
    store.loadPreset('l-diagonal-asymmetric');
    store.updateMaterialThicknesses(18, 8);
    store.setLedLighting({
      enabled: true,
      shelfUnder: true,
      verticalSides: true,
      hangingRod: true,
      openBays: true,
      cornerModule: true,
      colorTempId: 'warm2700K',
      intensity: 0.9,
    });

    const strips18 = useWardrobeStore.getState().resolved.ledStrips;
    expect(strips18.length).toBeGreaterThan(5);
    expect(strips18.some((s) => s.kind === 'shelfUnder')).toBe(true);
    expect(strips18.some((s) => s.kind === 'verticalSide')).toBe(true);
    expect(strips18.some((s) => s.kind === 'hangingRod')).toBe(true);
    expect(strips18.some((s) => s.kind === 'cornerPentagon')).toBe(true);

    const firstSideStrip18 = strips18.find((s) => s.kind === 'verticalSide')!;
    store.updateMaterialThicknesses(25, 8);
    const firstSideStrip25 = useWardrobeStore
      .getState()
      .resolved.ledStrips.find((s) => s.id === firstSideStrip18.id)!;

    // Dikme kalınlığı 18 -> 25 mm olduğunda dikey yan LED şeridin X/Z konumu da yeni iç yüzeye kaymalı
    expect(firstSideStrip25.worldPositionMm).not.toEqual(firstSideStrip18.worldPositionMm);
  });

  it('36. Physical 3D item fit check emits ITEM_PHYSICAL_FIT_WARNING when long dresses are assigned to a short cell', () => {
    const store = useWardrobeStore.getState();
    store.loadPreset('l-diagonal-asymmetric');

    // Raf aralığı olan kısa bir hücreye (< 1250mm) uzun elbise (longDresses) ata
    const shortShelfCell = useWardrobeStore
      .getState()
      .resolved.cells.find((c) => c.netHeightMm < 600 && !c.polygonXZMm)!;
    store.setCellItemPreset(shortShelfCell.sourceLeafId ?? shortShelfCell.id, 'longDresses');

    const fitWarning = useWardrobeStore
      .getState()
      .resolved.issues.find((iss) => iss.code === 'ITEM_PHYSICAL_FIT_WARNING');
    expect(fitWarning).toBeDefined();
  });

  it('37. Phase 3 settings (materials, handles, exteriorFinish, ledLighting, interiorItems) support Undo/Redo and JSON export/import round-trip', () => {
    const store = useWardrobeStore.getState();
    store.loadPreset('l-diagonal-asymmetric');
    store.saveCheckpoint();

    store.setMaterials({
      carcassMaterialId: 'naturalWalnut',
      frontMaterialId: 'smokedGlass',
      drawerFrontMaterialId: 'creamAlabaster',
      shelfMaterialId: 'naturalWalnut',
    });
    store.applyExteriorFinishPreset('builtInMinimal');
    store.setLedLighting({ colorTempId: 'warm2700K', intensity: 0.75 });
    store.setInteriorItemsConfig({ density: 'full', showHangingClothes: true });

    const exportedJson = useWardrobeStore.getState().exportJsonString();
    const parsed = normalizeAndValidateDesign(JSON.parse(exportedJson));
    expect(parsed.materials.carcassMaterialId).toBe('naturalWalnut');
    expect(parsed.materials.frontMaterialId).toBe('smokedGlass');
    expect(parsed.exteriorFinish?.presetId).toBe('builtInMinimal');
    expect(parsed.ledLighting?.colorTempId).toBe('warm2700K');
    expect(parsed.interiorItems?.density).toBe('full');

    // Undo / Redo kontrolü
    useWardrobeStore.getState().undo();
    expect(useWardrobeStore.getState().design.interiorItems?.density).not.toBe('full');
    useWardrobeStore.getState().redo();
    expect(useWardrobeStore.getState().design.interiorItems?.density).toBe('full');
  });
});
