import {beforeEach,describe,it,expect,vi} from 'vitest';
import {phase5Example} from '../src/core/presets/phase5Examples';
import {buildExternalAiPrompt,designMetrics,designSignature,previewDesignJson} from '../src/core/versions/designExchange';
import {parseVersionArchive,useVersionArchive,VERSION_ARCHIVE_KEY} from '../src/store/versionArchive';
import {useWardrobeStore} from '../src/store/useWardrobeStore';
import {allowsSlidingDrag} from '../src/canvas/wardrobe/SlidingLeafInteraction';
import {MotionSimulator} from '../src/core/analysis/motionSimulator';
import {solveDesign} from '../src/core/solver/carcassSolver';
import {slidingCellHasOpening} from '../src/core/analysis/motionConstraints';

describe('Phase 5 — versions, AI bridge and interaction boundaries',()=>{
  beforeEach(()=>{vi.unstubAllGlobals();useVersionArchive.setState({versions:[],error:null,status:'idle'});});
  it('keeps named versions, checkpoints and the active design independent',()=>{
    const storage=new Map<string,string>();vi.stubGlobal('localStorage',{getItem:(k:string)=>storage.get(k),setItem:(k:string,v:string)=>storage.set(k,v)});
    const d=phase5Example('straight'),s=useWardrobeStore.getState();s.openNamedVersion(d,'Original');s.saveCheckpoint();const checkpoint=designSignature(useWardrobeStore.getState().checkpointDesign),history=useWardrobeStore.getState().historyPast.length;
    const id=useVersionArchive.getState().save('A — İlk çözüm',d)!;d.name='Changed outside';
    expect(useVersionArchive.getState().versions[0].design.name).not.toBe('Changed outside');expect(designSignature(useWardrobeStore.getState().checkpointDesign)).toBe(checkpoint);expect(useWardrobeStore.getState().historyPast).toHaveLength(history);
    const envelope=JSON.parse(storage.get(VERSION_ARCHIVE_KEY)!);expect(parseVersionArchive(envelope)).toHaveLength(1);
    useVersionArchive.getState().rename(id,'B — Yeni ad');useVersionArchive.getState().setArchived(id,true);expect(useVersionArchive.getState().versions[0].archived).toBe(true);useVersionArchive.getState().setArchived(id,false);expect(useVersionArchive.getState().versions[0].name).toBe('B — Yeni ad');vi.unstubAllGlobals();
  });
  it('reopens a version as one Undo operation without losing the working copy',()=>{
    const s=useWardrobeStore.getState(),a=phase5Example('straight'),b=phase5Example('asymmetric');s.openNamedVersion(a,'A');const before=designSignature(useWardrobeStore.getState().design),count=useWardrobeStore.getState().historyPast.length;s.openNamedVersion(b,'B');expect(useWardrobeStore.getState().historyPast.length).toBe(Math.min(50,count+1));useWardrobeStore.getState().undo();expect(designSignature(useWardrobeStore.getState().design)).toBe(before);useWardrobeStore.getState().redo();expect(useWardrobeStore.getState().design.id).toBe(b.id);
  });
  it('builds a full Design JSON prompt and previews without touching active state',()=>{
    const d=phase5Example('straight'),signature=designSignature(useWardrobeStore.getState().design),prompt=buildExternalAiPrompt(d,'Rafları anne için alçalt');expect(prompt).toContain(JSON.stringify(d,null,2));expect(prompt).toContain('Rafları anne için alçalt');const result=previewDesignJson(JSON.stringify(d));expect(result.errors).toEqual([]);expect(result.design).toEqual(d);expect(designSignature(useWardrobeStore.getState().design)).toBe(signature);
  });
  it('shows actionable JSON syntax/schema, duplicate, front and solver errors',()=>{
    expect(previewDesignJson('```json\n{}\n```').errors.length).toBeGreaterThan(0);
    const d=phase5Example('straight');d.runs[0].panelThicknessMm=-1;expect(previewDesignJson(JSON.stringify(d)).errors[0]).toContain('runs.0.panelThicknessMm');
    const duplicate=phase5Example('straight');duplicate.runs[0].bays[1].id=duplicate.runs[0].bays[0].id;expect(previewDesignJson(JSON.stringify(duplicate)).errors.join()).toContain('Tekrarlanan');
    const invalid=phase5Example('straight');invalid.fronts[0].yEndMm=5000;expect(previewDesignJson(JSON.stringify(invalid)).errors.join()).toContain('yükseklik');
    const impossible=phase5Example('straight');impossible.fronts[0].sliding!.leafWidthsMm=[150,150,150];expect(previewDesignJson(JSON.stringify(impossible)).errors.join()).toContain('SLIDING_WIDTH_ALLOCATION');
  });
  it('rejects oversized or deeply nested external responses before solver work',()=>{
    expect(previewDesignJson(' '.repeat(2000001)).errors[0]).toContain('2 MB');expect(previewDesignJson('['.repeat(80)+'0'+']'.repeat(80)).errors[0]).toContain('derin');
  });
  it('validates archive entries independently and tolerates stale/malformed storage',()=>{
    expect(parseVersionArchive({versions:[]})).toEqual([]);const d=phase5Example('straight'),v={id:'v1',name:'A',createdAt:'2026-11-04',updatedAt:'2026-11-04',design:d};expect(parseVersionArchive({schemaVersion:1,versions:[{...v,design:{}},v,v]})).toHaveLength(1);
  });
  it('compares actual net geometry and counts sliding leaves in A/B metrics',()=>{
    const a=phase5Example('straight'),b=structuredClone(a);b.runs[0].panelThicknessMm=25;b.runs[0].backPanelThicknessMm=4;b.fronts=[];const ma=designMetrics(a),mb=designMetrics(b);expect(ma.doors).toBe(3);expect(mb.doors).toBe(0);expect(ma.parts).not.toBe(mb.parts);expect(ma.drawerLitres).toBeGreaterThan(0);expect(mb.storageLitres).not.toBe(ma.storageLitres);
  });
  it('disables sliding drag in edit, multiselect, non-primary or modified pointer modes',()=>{
    const base={editor:false,multiSelect:false,button:0};expect(allowsSlidingDrag(base)).toBe(true);for(const flags of [{editor:true},{multiSelect:true},{button:1},{shift:true},{ctrl:true},{meta:true}])expect(allowsSlidingDrag({...base,...flags})).toBe(false);
  });
  it('keeps manual sliding pose between animation frames without changing Design/history',()=>{
    const d=phase5Example('straight'),r=solveDesign(d),sim=new MotionSimulator();sim.load(d,r);const leaf=r.slidingDoors![0],json=JSON.stringify(d),moved=sim.dragTo(leaf.id,300);expect(moved.blocked).toBe(false);for(let i=0;i<80;i++)sim.step(1/60,{},{});expect(sim.positions[leaf.id]).toBe(300);expect(JSON.stringify(d)).toBe(json);sim.load(d,r);expect(sim.positions[leaf.id]).toBe(300);sim.load(d,solveDesign(d));expect(sim.positions[leaf.id]).toBe(leaf.initialOffsetMm);
  });
  it('uses actual sliding coverage when exposing cells and gates drawers on opening',()=>{
    const d=phase5Example('straight'),r=solveDesign(d),sim=new MotionSimulator();sim.load(d,r);const cell=r.cells.find(c=>c.bayId===d.runs[0].bays[0].id)!,leaf=r.slidingDoors![0],drawer=r.drawers[0];expect(slidingCellHasOpening(r,sim.positions,cell)).toBe(false);
    for(let i=0;i<100;i++)sim.step(1/60,{}, {[drawer.id]:true});expect(sim.positions[drawer.id]).toBeLessThan(.7);
    sim.dragTo(leaf.id,leaf.maxOffsetMm);expect(slidingCellHasOpening(r,sim.positions,cell)).toBe(true);
  });
  it('keeps front changes reversible in history and rejects disjoint bay coverage',()=>{
    const s=useWardrobeStore.getState(),d=phase5Example('straight');s.openNamedVersion(d,'Front test');s.selectBay(d.runs[0].bays[0].id);const count=useWardrobeStore.getState().historyPast.length;s.splitFrontSystem(d.fronts[0].id);expect(useWardrobeStore.getState().design.fronts).toHaveLength(2);expect(useWardrobeStore.getState().historyPast).toHaveLength(Math.min(50,count+1));useWardrobeStore.getState().undo();expect(useWardrobeStore.getState().design.fronts).toHaveLength(1);s.patchFrontSystem(d.fronts[0].id,{bayIds:[]});expect(useWardrobeStore.getState().commandError).toBeTruthy();
  });
});
