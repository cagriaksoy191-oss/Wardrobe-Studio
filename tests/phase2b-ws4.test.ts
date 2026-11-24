import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  CarcassConstructionPanel,
  InventoryPanel,
  NumberField,
  ObstaclePanel,
  Phase4InteriorPanel,
  Phase4RoomPanel,
  RoomCeilingPanel,
  RoomErgonomicsPanel,
  StorageTemplatePanel,
} from '../src/ui/Phase4Panels';
import { useWardrobeStore } from '../src/store/useWardrobeStore';

const worktreeRoot = resolve(__dirname, '..');
const appSource = readFileSync(resolve(worktreeRoot, 'src/App.tsx'), 'utf8');
const phase4Source = readFileSync(resolve(worktreeRoot, 'src/ui/Phase4Panels.tsx'), 'utf8');
const cssSource = readFileSync(resolve(worktreeRoot, 'src/index.css'), 'utf8');

describe('Phase 2B WS-4 — IA-07 4-Step Top-Level Navigation & Step 3/4 Separation', () => {
  it('renders a balanced 4-step sidebar navigation with aria-current="step"', () => {
    expect(appSource).toContain('grid grid-cols-4 gap-1');
    expect(appSource).toContain("activeStep === 'room-carcass' ? 'step' : undefined");
    expect(appSource).toContain("activeStep === 'interior-fronts' ? 'step' : undefined");
    expect(appSource).toContain("activeStep === 'view-export' ? 'step' : undefined");
    expect(appSource).toContain("activeStep === 'versions-production' ? 'step' : undefined");
    expect(appSource).toContain('>1. Oda<'.replace('>1. Oda<', '1. Oda'));
    expect(appSource).toContain('2. İç & Kapak');
    expect(appSource).toContain('3. Görünüm');
    expect(appSource).toContain('4. Çıktı');
  });

  it('limits Step 3 (3. Görünüm) to 5 balanced visual styling tabs without duplicated thickness card', () => {
    const step3Start = appSource.indexOf("{activeStep === 'view-export' && (");
    const step4Start = appSource.indexOf("{activeStep === 'versions-production' && (");
    expect(step3Start).toBeGreaterThan(-1);
    expect(step4Start).toBeGreaterThan(step3Start);

    const step3Block = appSource.slice(step3Start, step4Start);
    expect(step3Block).toContain('grid-cols-5');
    expect(step3Block).toContain('min-h-[32px]');
    expect(step3Block).toContain("{ id: 'materials', label: 'Yüzey' }");
    expect(step3Block).toContain("{ id: 'handles', label: 'Kulp' }");
    expect(step3Block).toContain("{ id: 'exterior', label: 'Gömme' }");
    expect(step3Block).toContain("{ id: 'led-studio', label: 'Işık' }");
    expect(step3Block).toContain("{ id: 'items', label: '3D Eşya' }");
    expect(step3Block).not.toContain('<ProductionPanel');
    expect(step3Block).not.toContain('<VersionPanel');
    expect(step3Block).not.toContain('label="Ana Panel (mm)"');
    expect(step3Block).not.toContain('label="Arkalık / Taban (mm)"');
  });

  it('dedicates Step 4 (4. Çıktı) to Üretim & Paftalar (default) and Sürümler & AI', () => {
    expect(appSource).toContain("useState<'production' | 'versions'>('production')");
    const step4Start = appSource.indexOf("{activeStep === 'versions-production' && (");
    const mainStart = appSource.indexOf('<main className="relative');
    expect(step4Start).toBeGreaterThan(-1);
    expect(mainStart).toBeGreaterThan(step4Start);

    const step4Block = appSource.slice(step4Start, mainStart);
    expect(step4Block).toContain('Üretim & Paftalar');
    expect(step4Block).toContain('Sürümler & AI');
    expect(step4Block).toContain('<ProductionPanel onReviewAccess={() => setShowAccessReview(true)} />');
    expect(step4Block).toContain('<VersionPanel />');
  });

  it('supports switching store activeStep to versions-production cleanly', () => {
    const store = useWardrobeStore.getState();
    store.setActiveStep('versions-production');
    expect(useWardrobeStore.getState().activeStep).toBe('versions-production');
    expect(useWardrobeStore.getState().doorEditorMode).toBe(false);
    store.setActiveStep('room-carcass');
  });
});

describe('Phase 2B WS-4 — IA-05 Task-First Step 1 & Step 2 Hierarchy with Progressive Disclosure', () => {
  it('orders Step 1 dimensions above the fold and tucks pro controls into collapsed accordions', () => {
    const step1Start = appSource.indexOf("{activeStep === 'room-carcass' && (");
    const step2Start = appSource.indexOf("{activeStep === 'interior-fronts' && (");
    expect(step1Start).toBeGreaterThan(-1);
    expect(step2Start).toBeGreaterThan(step1Start);

    const step1 = appSource.slice(step1Start, step2Start);
    const idxCreate = step1.indexOf('Gardırop oluştur');
    const idxDimensions = step1.indexOf('Duvar ve yükseklik ölçüleri (mm)');
    const idxCeiling = step1.indexOf('Oda tavan yüksekliği (mm)');
    const idxCorner = step1.indexOf('L-köşe birleşimi');
    const idxBays = step1.indexOf('{renderBaysSection()}');
    const idxThicknessAcc = step1.indexOf('Panel kalınlıkları ve gövde konstrüksiyonu');
    const idxErgoAcc = step1.indexOf('Kişiler ve ergonomi');
    const idxObstacleAcc = step1.indexOf('Oda engelleri');

    expect(idxCreate).toBeGreaterThan(-1);
    expect(idxDimensions).toBeGreaterThan(idxCreate);
    expect(idxCeiling).toBeGreaterThan(idxDimensions);
    expect(idxCorner).toBeGreaterThan(idxCeiling);
    expect(idxBays).toBeGreaterThan(idxCorner);
    expect(idxThicknessAcc).toBeGreaterThan(idxBays);
    expect(idxErgoAcc).toBeGreaterThan(idxThicknessAcc);
    expect(idxObstacleAcc).toBeGreaterThan(idxErgoAcc);

    // Preset subtitles & corner explanations present
    expect(step1).toContain('formatPresetSubtitle(preset)');
    expect(step1).toContain('Beşgen köşe:');
    expect(step1).toContain('Kör köşe:');
  });

  it('orders Step 2 actions & bays first with collapsed templates/inventory and no duplicate FrontSystemEditor', () => {
    const step2Start = appSource.indexOf("{activeStep === 'interior-fronts' && (");
    const step3Start = appSource.indexOf("{activeStep === 'view-export' && (");
    expect(step2Start).toBeGreaterThan(-1);
    expect(step3Start).toBeGreaterThan(step2Start);

    const step2 = appSource.slice(step2Start, step3Start);
    const idxTop = step2.indexOf('İç düzen ve kapak');
    const idxBays = step2.indexOf('{renderBaysSection()}');
    const idxTemplates = step2.indexOf('Özel depolama ve bölme kopyalama');
    const idxInventory = step2.indexOf('Envanter ve kapasite planı');

    expect(idxTop).toBeGreaterThan(-1);
    expect(idxBays).toBeGreaterThan(idxTop);
    expect(idxTemplates).toBeGreaterThan(idxBays);
    expect(idxInventory).toBeGreaterThan(idxTemplates);
    expect(step2).not.toContain('<FrontSystemEditor');
  });

  it('exports composable Phase4Panels sections while preserving legacy barrel exports', () => {
    expect(typeof RoomCeilingPanel).toBe('function');
    expect(typeof RoomErgonomicsPanel).toBe('function');
    expect(typeof CarcassConstructionPanel).toBe('function');
    expect(typeof ObstaclePanel).toBe('function');
    expect(typeof InventoryPanel).toBe('function');
    expect(typeof StorageTemplatePanel).toBe('function');
    expect(typeof Phase4RoomPanel).toBe('function');
    expect(typeof Phase4InteriorPanel).toBe('function');
    expect(typeof NumberField).toBe('function');
  });
});

describe('Phase 2B WS-4 — WS-3 DoorInspectorPanel, IA-02/IA-09 Flow, PE-01 History & PE-05/PE-12 Mobile', () => {
  it('mounts DoorInspectorPanel in Right Inspector, removes duplicate selects, and handles drawer event', () => {
    expect(appSource).toContain("import { DoorInspectorPanel } from './ui/DoorInspectorPanel';");
    expect(appSource).toContain('<DoorInspectorPanel onCloseEditor={() => setDoorEditorMode(false)} />');
    expect(appSource).toContain("window.addEventListener('wardrobe:open-selection-drawer'");
    expect(appSource).not.toContain('aria-label="Bölme kapak düzeni"');
    expect(appSource).not.toContain('aria-label="Menteşe açılma açısı"');
  });

  it('provides calm IA-02 first-use copy, IA-09 post-blank transition, and PE-01 checkpoint button state', () => {
    expect(appSource).toContain('accessBlocks.length > 0');
    expect(appSource).toContain("depthBMm: '550'");
    expect(appSource).toContain("setActiveStep('interior-fronts')");
    expect(appSource).toContain('Boş gardırop oluşturuldu.');
    expect(appSource).toMatch(/disabled=\{!hasUnsavedChanges\}[\s\S]{0,600}Son kayıt noktasına dön/);
  });

  it('defines PE-05 full-height fixed mobile drawers, compact narrow banners, and PE-12 44px touch targets', () => {
    expect(cssSource).toContain('.studio-accordion');
    expect(cssSource).toContain('.studio-mobile-drawer');
    expect(cssSource).toContain('position: fixed;');
    expect(cssSource).toContain('height: 100dvh;');
    expect(cssSource).toContain('@media (max-width: 640px)');
    expect(cssSource).toContain('.studio-first-use-banner');
    expect(cssSource).toContain('.studio-compact-nav button');
    expect(cssSource).toMatch(/\.studio-compact-nav button\s*\{[^}]*min-height:\s*44px/);
    expect(cssSource).toMatch(/@media\s*\(max-width:\s*520px\)[\s\S]*\.studio-header button\s*\{\s*min-height:\s*44px;/);
    expect(appSource).toContain('studio-mobile-drawer studio-mobile-drawer-left');
    expect(appSource).toContain('studio-mobile-drawer studio-mobile-drawer-right');
    expect(appSource).toContain('closeCompactPanel(true)');
  });

  it('maintains zero text-slate-500 and zero raw backtick copy regressions in App.tsx and Phase4Panels.tsx', () => {
    expect(appSource).not.toContain('text-slate-500');
    expect(phase4Source).not.toContain('text-slate-500');
    expect(appSource).not.toMatch(/`t`\s*&\s*`tb`/);
    expect(appSource).not.toMatch(/\(`Junction`\)|\(`Front`\)|\(`InsertRegistry`\)/);
  });
});
