import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createBlankDesign, SAMPLE_DESIGNS } from '../src/core/presets/sampleDesigns';
import { normalizeAndValidateDesign } from '../src/core/schema/designSchema';
import { solveDesign } from '../src/core/solver/carcassSolver';
import { distributeIntegerMm } from '../src/core/solver/flexSolver';
import { doorFootprint, getDoorOpeningAngleRad, polygonAreaMm2, resolveMotions } from '../src/core/analysis/kinematics';
import { useWardrobeStore } from '../src/store/useWardrobeStore';

describe('Phase 4 — physical dimensions and durable design intent', () => {
  beforeEach(() => { useWardrobeStore.getState().endHistoryTransaction(); useWardrobeStore.getState().loadPreset('straight-wardrobe'); });
  it('shares one physical partition at each boundary, retains external bay widths, and records both owners', () => {
    const d=structuredClone(SAMPLE_DESIGNS['straight-wardrobe']);
    d.runs[0].constructionMode='shared';
    const solved=solveDesign(d), legacy=solveDesign(SAMPLE_DESIGNS['straight-wardrobe']);
    expect(solved.panels.filter(p=>p.role==='sidePanel')).toHaveLength(4);
    expect(solved.panels.filter(p=>p.role==='sidePanel' && p.bayIds?.length===2)).toHaveLength(2);
    expect(solved.bays.map(b=>b.outerWidthMm)).toEqual(legacy.bays.map(b=>b.outerWidthMm));
    const t=d.runs[0].panelThicknessMm;
    expect(solved.bays.reduce((n,b)=>n+b.netInnerWidthMm,0)+4*t).toBe(solved.bays.reduce((n,b)=>n+b.outerWidthMm,0));
  });
  it.each(['diagonal','blind'] as const)('keeps shared corner ownership valid for %s corners', type => {
    const d=createBlankDesign({layoutKind:'l-shape',cornerType:type});
    const r=solveDesign(d);
    expect(r.issues.some(i=>i.severity==='error')).toBe(false);
    for(const run of d.runs) {
      const sides=r.panels.filter(p=>p.runId===run.id && (p.role==='sidePanel'||p.role==='cornerSidePanel'));
      expect(sides).toHaveLength(run.bays.length+1);
    }
  });
  it('preserves legacy separate-module JSON, material choices, and exact outside dimensions', () => {
    const d=SAMPLE_DESIGNS['straight-wardrobe'];
    const parsed=normalizeAndValidateDesign(JSON.parse(JSON.stringify(d)));
    expect(parsed).toEqual(d);
    expect(solveDesign(parsed).panels.filter(p=>p.role==='sidePanel')).toHaveLength(6);
    expect(createBlankDesign({layoutKind:'straight'}).runs[0].constructionMode).toBe('shared');
  });
  it('rounds decimal commands before persistence; exported design reloads exactly', () => {
    const s=useWardrobeStore.getState();
    s.setBaySize('run-A','bay-S1',{kind:'fixed',mm:800.5});
    const state=useWardrobeStore.getState();
    expect(state.design.runs[0].bays[0].width).toEqual({kind:'fixed',mm:801});
    expect(normalizeAndValidateDesign(JSON.parse(state.exportJsonString()))).toEqual(state.design);
  });
  it('restores a session with consistent single and multiple cell selection', async () => {
    const restored = structuredClone(SAMPLE_DESIGNS['l-diagonal-asymmetric']);
    const session = JSON.stringify({version:2, workingDesign:restored, checkpointDesign:restored, historyPast:[], historyFuture:[], lastCheckpointAt:null, lastAutoSavedAt:null});
    vi.stubGlobal('window', {localStorage:{getItem:()=>session}});
    try {
      await useWardrobeStore.getState().hydrateFromIndexedDB();
      const state=useWardrobeStore.getState();
      expect(state.selectedCellId).toBe(state.resolved.cells[0].id);
      expect(state.selectedCellIds).toEqual([state.selectedCellId]);
      expect(state.hasUnsavedChanges).toBe(false);
    } finally { vi.unstubAllGlobals(); }
  });
  it.each([[18,8],[25,4],[16,10]])('sets the requested 500mm net depth with t=%i, back=%i', (t,tb) => {
    const s=useWardrobeStore.getState(); s.updateMaterialThicknesses(t,tb);
    s.selectCell('cell-s3-hang','bay-S3'); s.startOrUpdateResizeDraft('Z','front',500);
    expect(useWardrobeStore.getState().commitResizeDraft()).toBe(true);
    expect(useWardrobeStore.getState().design.runs[0].depthMm).toBe(500+tb);
    expect(useWardrobeStore.getState().resolved.cells.find(c=>c.id==='cell-s3-hang')?.netDepthMm).toBe(500);
  });
  it('rejects fixed overflow, locked changes, and impossible flex limits', () => {
    expect(()=>distributeIntegerMm(700,[{id:'a',size:{kind:'fixed',mm:800},locked:true},{id:'b',size:{kind:'flex',weight:1}}])).toThrow();
    expect(()=>distributeIntegerMm(1000,[{id:'a',size:{kind:'fixed',mm:800},locked:true},{id:'b',size:{kind:'fixed',mm:800},locked:true}])).toThrow();
    expect(()=>distributeIntegerMm(1000,[{id:'a',size:{kind:'flex',weight:1,maxMm:100}},{id:'b',size:{kind:'flex',weight:1,maxMm:100}}])).toThrow();
    const state=useWardrobeStore.getState(), before=state.exportJsonString();
    state.updateRunDimension('run-A','lengthMm',500);
    expect(useWardrobeStore.getState().exportJsonString()).toBe(before);
    expect(useWardrobeStore.getState().commandError).toContain('sığmıyor');
  });
  it('satisfies simultaneous min/max constraints and preserves all integer totals', () => {
    expect(distributeIntegerMm(101, ['a','b','c'].map(id=>({id,size:{kind:'flex',weight:1}}))).map(x=>x.resolvedMm)).toEqual([33,33,35]);
    const items=[{id:'a',size:{kind:'flex' as const,weight:1,minMm:100}},{id:'b',size:{kind:'flex' as const,weight:100,maxMm:10}}];
    expect(distributeIntegerMm(200,items).map(x=>x.resolvedMm)).toEqual([190,10]);
    for(let total=150;total<2000;total+=17) {
      const r=distributeIntegerMm(total,[{id:'fixed',size:{kind:'fixed',mm:50},locked:true},{id:'a',size:{kind:'flex',weight:1,minMm:10}},{id:'b',size:{kind:'flex',weight:3,minMm:10}}],18);
      expect(r[0].resolvedMm).toBe(50);
      expect(r.every(v=>Number.isInteger(v.resolvedMm))).toBe(true);
      expect(r.reduce((n,v)=>n+v.resolvedMm,36)).toBe(total);
    }
  });
  it('restores the true checkpoint after 75 operations and retains a Redo path', () => {
    const s=useWardrobeStore.getState(); s.saveCheckpoint(); const checkpoint=s.exportJsonString();
    for(let i=1;i<=75;i++) s.updateRunDimension('run-A','lengthMm',3000+i);
    expect(useWardrobeStore.getState().historyPast).toHaveLength(50);
    s.revertToCheckpoint();
    expect(useWardrobeStore.getState().exportJsonString()).toBe(checkpoint);
    expect(useWardrobeStore.getState().hasUnsavedChanges).toBe(false);
    s.redo();
    expect(useWardrobeStore.getState().design.runs[0].lengthMm).toBe(3075);
    expect(useWardrobeStore.getState().hasUnsavedChanges).toBe(true);
  });
  it('groups slider gestures in a single Undo step', () => {
    const s=useWardrobeStore.getState(); s.saveCheckpoint(); const before=useWardrobeStore.getState().historyPast.length; s.beginHistoryTransaction();
    for(const intensity of [0.2,0.4,0.6,0.8]) s.setLedLighting({intensity});
    s.endHistoryTransaction(); expect(useWardrobeStore.getState().historyPast).toHaveLength(before+1);
    s.undo(); expect(useWardrobeStore.getState().hasUnsavedChanges).toBe(false);
  });
  it.each([110,155,165] as const)('uses the same %i degree limit for rendering and sweep geometry', angle => {
    const door={...solveDesign(SAMPLE_DESIGNS['straight-wardrobe']).doors[0],maxAngleDeg:angle};
    expect(getDoorOpeningAngleRad(door)).toBeCloseTo(angle*Math.PI/180);
    expect(polygonAreaMm2(doorFootprint(door,1))).toBeCloseTo(door.widthMm*door.thicknessMm,-3);
    const motion=resolveMotions({doors:[door],drawers:[]})[0];
    expect(motion.maxAngleDeg).toBe(angle); expect(motion.sweepPolygonsMm).toHaveLength(angle);
  });
  it('rejects broken front references and inverted ranges on JSON import', () => {
    const d=structuredClone(SAMPLE_DESIGNS['straight-wardrobe']);
    d.fronts=[{id:'bad',runId:'missing',bayIds:['missing'],type:'hinged',yStartMm:1000,yEndMm:100}];
    expect(()=>normalizeAndValidateDesign(d)).toThrow();
  });
});
