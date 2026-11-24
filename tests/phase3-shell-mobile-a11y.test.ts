import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const worktreeRoot = resolve(__dirname, '..');
const appSource = readFileSync(resolve(worktreeRoot, 'src/App.tsx'), 'utf8');
const cssSource = readFileSync(resolve(worktreeRoot, 'src/index.css'), 'utf8');

describe('Phase 3 Shell — VF-01 / VF-08 / PE-05 / PE-12 Mobile Portrait & Landscape Architecture', () => {
  it('collapses header to single 52px bar with >=44x44 targets on <=640px and max-height:500px', () => {
    expect(cssSource).toContain('@media (max-width: 640px), (max-height: 500px)');
    expect(cssSource).toMatch(/grid-template-areas:\s*"brand session"/);
    expect(cssSource).toMatch(/min-height:\s*52px/);
    expect(cssSource).toMatch(/\.studio-header button\s*\{\s*min-height:\s*44px;\s*min-width:\s*44px;/);
    expect(appSource).toContain('studio-mobile-tools-section');
    expect(appSource).toContain('studio-save-label');
    expect(appSource).toContain('aria-label={checkpointText}');
  });

  it('moves compact drawer controls to a thumb-friendly 48px bottom dock preserving screen-reader labels', () => {
    expect(cssSource).toMatch(/\.studio-compact-nav\s*\{[\s\S]*order:\s*20;[\s\S]*min-height:\s*48px;/);
    expect(appSource).toContain('Tasarım paneli');
    expect(appSource).toContain('Seçim ve uyarılar');
    expect(appSource).toContain('studio-dock-mobile-only');
  });

  it('styles mobile scene toggle, collapses scene/analysis toolbars and hides desktop mouse hints on narrow/touch viewports', () => {
    expect(cssSource).toContain('.studio-mobile-scene-toggle');
    expect(cssSource).toContain('.studio-scene-toolbar');
    expect(cssSource).toContain('.studio-analysis-toolbar');
    expect(cssSource).toContain('.studio-gesture-hint');
    expect(cssSource).toContain('@media (pointer: coarse)');
    expect(cssSource).toMatch(/\.studio-mobile-drawer nav\[aria-label="Tasarım adımları"\] button[\s\S]*min-height:\s*44px;/);
  });
});

describe('Phase 3 Shell — VF-02 WCAG 1.4.4 150% Text-Scale Header', () => {
  it('uses flex-wrap header with rem-floored .studio-brand so 150% html font-size wraps cleanly without crushing brand', () => {
    expect(cssSource).toMatch(/@media\s*\(max-width:\s*1660px\),\s*\(max-width:\s*104em\)/);
    expect(cssSource).toContain('max-width: 84em');
    expect(cssSource).toContain('max-width: 72.5em');
    expect(cssSource).toContain('max-width: 62.5em');
    expect(cssSource).toMatch(/\.studio-header\s*\{[\s\S]*display:\s*flex;[\s\S]*flex-wrap:\s*wrap;/);
    expect(cssSource).toMatch(/\.studio-brand\s*\{[\s\S]*flex:\s*1 1 12rem;[\s\S]*min-width:\s*12rem;/);
  });
});

describe('Phase 3 Shell — VF-03 / VF-06 / WCAG 2.4.1 Accessible Modal Drawers, History Focus & Skip Link', () => {
  it('provides a visually-hidden-until-focused skip link to #studio-setup', () => {
    expect(appSource).toContain('href="#studio-setup"');
    expect(appSource).toContain('Tasarım paneline atla');
    expect(appSource).toContain('sr-only focus:not-sr-only');
  });

  it('turns compact overlay drawers (<1280px) into focus-trapped modal dialogs with close-button focus', () => {
    expect(appSource).toContain("role={isCompactViewport && compactPanel === 'setup' ? 'dialog' : undefined}");
    expect(appSource).toContain("aria-modal={isCompactViewport && compactPanel === 'setup' ? true : undefined}");
    expect(appSource).toContain("role={isCompactViewport && compactPanel === 'selection' ? 'dialog' : undefined}");
    expect(appSource).toContain("aria-modal={isCompactViewport && compactPanel === 'selection' ? true : undefined}");
    expect(appSource).toContain('setupCloseButtonRef');
    expect(appSource).toContain('selectionCloseButtonRef');
    expect(appSource).toContain('handleTrapKeyDown');
  });

  it('moves focus into #studio-history-menu immediately on open (sync useLayoutEffect + pointer mousedown guard) so focus never drops to body', () => {
    expect(appSource).toContain('id="studio-history-menu"');
    expect(appSource).toContain('historyCloseButtonRef');
    expect(appSource).toContain('useLayoutEffect(');
    expect(appSource).toContain('onMouseDown={(e) => e.preventDefault()}');
    expect(appSource).toMatch(/if\s*\(!showHistoryMenu\)\s*return;[\s\S]*historyCloseButtonRef\.current/);
  });
});

describe('Phase 3 Shell — PM-02 / CF-01 / PM-04 / PM-06 / PM-08 Shortcuts, Escape, Redo & Slider Cleanup', () => {
  it('flushes active NumberField drafts via wardrobe:flush-drafts on Ctrl+S and aborts saveCheckpoint if invalid', () => {
    expect(appSource).toContain("new CustomEvent('wardrobe:flush-drafts', { detail })");
    expect(appSource).toContain('if (detail.hadInvalid)');
    expect(appSource).toContain('detail.firstInvalidEl?.focus()');
    expect(appSource).toContain('handleSaveCheckpoint()');
  });

  it('handles Escape on document with strict else-if priority and preventDefault/stopPropagation', () => {
    expect(appSource).toContain("document.addEventListener('keydown', handleKeyDown)");
    expect(appSource).toContain('if (e.defaultPrevented) return;');
    expect(appSource).toContain("if (document.querySelector('dialog[open]')) return;");
    expect(appSource).toMatch(/if\s*\(showHistoryMenu\)[\s\S]*else if\s*\(showTools\)[\s\S]*else if\s*\(compactPanel\)/);
  });

  it('indexes historyFuture[0].label for Redo aria-label and title (PM-06)', () => {
    expect(appSource).toContain('historyFuture[0].label');
    expect(appSource).not.toContain('historyFuture[historyFuture.length - 1].label');
  });

  it('closes LED slider history transactions on sub-tab/step change or unmount (PM-08)', () => {
    expect(appSource).toMatch(/materialSubTab !== 'led-studio'[\s\S]*endHistoryTransaction\(\)/);
  });
});

describe('Phase 3 Shell — VF-04 / VF-05 / VF-07 / CF-04 WCAG 2.2 Borders, Targets, Helper & Flip', () => {
  it('upgrades .studio-input border to >=3.75:1 (#64748b), lowers container flip to 560px, and raises disabled opacity', () => {
    expect(cssSource).toMatch(/\.studio-input\s*\{[\s\S]*border:\s*1px solid #64748b;/);
    expect(cssSource).toContain('@container (max-width: 560px)');
    expect(cssSource).not.toContain('@container (max-width: 720px)');
    expect(appSource).not.toContain('disabled:opacity-35');
    expect(appSource).not.toContain('disabled:opacity-40');
    expect(appSource).toContain('disabled:opacity-55');
  });

  it('links ceiling clearance helper via describedBy and enforces >=24px target height on compact controls', () => {
    expect(appSource).toContain('describedBy="ceiling-clearance-help"');
    expect(appSource).toContain('id="ceiling-clearance-help"');
    expect(cssSource).toMatch(/\.studio-app summary\s*\{\s*min-height:\s*24px;/);
    expect(appSource).toContain('min-h-6');
  });
});

describe('Phase 3 Shell — VF-09..VF-13, CF-17, CF-23 Craft, State Preservation, Wide Sunum Modu & Honest Copy', () => {
  it('replaces misleading Sorunsuz preset subtitle with truthful Erişime açık (VF-09)', () => {
    expect(appSource).toContain('Erişime açık');
    expect(appSource).not.toContain('· Sorunsuz');
  });

  it('preserves Step 1/2 accordion open state and Step 4 panels across step switches while aborting hidden exports (VF-10)', () => {
    expect(appSource).toContain('step1Accordions');
    expect(appSource).toContain('step2Accordions');
    expect(appSource).toContain('visitedOutputStep');
    expect(appSource).toContain("new CustomEvent('wardrobe:cancel-production-exports')");
  });

  it('de-duplicates Step 2 Kapak Düzenle triggers, formats uniform 2-row step tabs, prevents badge wrapping & renders non-truncating door badges', () => {
    expect(appSource).not.toContain('Cepheyi düzenle');
    expect(appSource).toContain("activeStep !== 'interior-fronts'");
    expect(appSource).toContain('formatDoorLeafBadge');
    expect(appSource).toContain('Sol Kapak');
    expect(appSource).toContain('Sağ Kapak');
    expect(appSource).toContain('whitespace-nowrap');
    expect(appSource).toContain('shrink-0');
  });

  it('collapses right sidebar in Sunum Modu with a Denetçiyi göster restore toggle and unifies violet active accent (VF-12)', () => {
    expect(appSource).toContain('showDesktopRightRail');
    expect(appSource).toContain('Denetçiyi göster');
    expect(appSource).toContain('Denetçiyi gizle');
    expect(appSource).toContain('border-violet-400 bg-violet-600 text-white');
  });

  it('auto-expands serviceNiche inspector settings (CF-23) and distinguishes read-recovery errors from write failures (VF-13)', () => {
    expect(appSource).toMatch(/selectedCell\?\.insert\?\.type === 'serviceNiche'[\s\S]*setShowAdvancedRightInspector\(true\)/);
    expect(appSource).toContain('isCorruptedRecoveryError');
    expect(appSource).toContain('eski kayıt okunamadı');
    expect(appSource).toContain('Önceki oturum kaydı okunamadı');
  });
});
