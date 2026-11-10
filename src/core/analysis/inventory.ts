import type { Design, InsertConfig, InventoryItemKind, InventoryResult, InventoryTarget, OwnerType, Point2DMm, ResolvedModel, StorageMetrics } from '../schema/types';
import { pointInConvexPolygon, polygonAreaMm2, polygonBounds, rectangle } from './kinematics';
import { validationConfig } from '../solver/validationConfig';

export interface ItemDimensions { widthMm:number; depthMm:number; heightMm:number; hangerPitchMm?:number }
export const INVENTORY_CATALOG: Record<InventoryItemKind, ItemDimensions & { label:string; hanging?:boolean }> = {
  shirts:{label:'Gömlek / bluz',widthMm:450,depthMm:520,heightMm:850,hangerPitchMm:45,hanging:true},
  jackets:{label:'Ceket / takım',widthMm:480,depthMm:550,heightMm:1000,hangerPitchMm:70,hanging:true},
  trousers:{label:'Pantolon',widthMm:380,depthMm:450,heightMm:750,hangerPitchMm:55,hanging:true},
  longClothes:{label:'Uzun kıyafet',widthMm:480,depthMm:550,heightMm:1400,hangerPitchMm:65,hanging:true},
  foldedClothes:{label:'Katlanmış kıyafet',widthMm:280,depthMm:360,heightMm:70},
  shoes:{label:'Ayakkabı çifti',widthMm:220,depthMm:320,heightMm:150},
  bags:{label:'Çanta',widthMm:260,depthMm:180,heightMm:300},
  suitcases:{label:'Valiz (yatay)',widthMm:650,depthMm:450,heightMm:280},
  hurc:{label:'Hurç',widthMm:500,depthMm:450,heightMm:300},
  bedding:{label:'Yorgan / nevresim paketi',widthMm:650,depthMm:500,heightMm:400},
  boxes:{label:'Saklama kutusu',widthMm:350,depthMm:400,heightMm:250},
  accessories:{label:'Takı / aksesuar kutusu',widthMm:80,depthMm:120,heightMm:40},
};
export function hangingProfile(insert: InsertConfig) {
  const profile = insert.rodHeightType ?? (insert.itemPreset === 'longDresses' ? 'long' : 'short');
  return INVENTORY_CATALOG[profile === 'long' ? 'longClothes' : profile === 'medium' ? 'jackets' : 'shirts'];
}
export function itemDimensions(target: InventoryTarget): ItemDimensions {
  const base=INVENTORY_CATALOG[target.kind];
  return {widthMm:target.widthMm??base.widthMm,depthMm:target.depthMm??base.depthMm,heightMm:target.heightMm??base.heightMm,hangerPitchMm:target.hangerPitchMm??base.hangerPitchMm};
}
interface FreeBox { x:number; z:number; y:number; w:number; d:number; h:number }
interface Space {
  id:string; label:string; owner:OwnerType; kind:'hanging'|'shelf'|'shoe'|'drawer'|'yukluk'|'trouser'|'laundry';
  boxes:FreeBox[]; polygon?:Point2DMm[]; openingMm?:number;
}
const blankMetrics=():StorageMetrics=>({hangingLengthMm:0,shelfAreaMm2:0,drawerVolumeMm3:0,storageVolumeMm3:0,shoePairs:0});

function storageSpaces(model: ResolvedModel): Space[] {
  const result:Space[]=[];
  for(const cell of model.cells) {
    if(cell.insert?.type==='drawerBank' || cell.insert?.type==='serviceNiche') continue;
    const template=cell.insert?.storageTemplate;
    const hanging=cell.insert?.type==='hangingRod'||cell.insert?.type==='doubleHanging';
    const rod=model.panels.find(p=>p.role==='hangingRod' && p.cellId===cell.id);
    const polygon = cell.hangingZoneMm ? undefined : cell.polygonXZMm;
    const bounds = polygon ? polygonBounds(polygon) : undefined;
    const zone = cell.hangingZoneMm;
    const width = zone?.widthMm ?? (bounds ? bounds.maxX - bounds.minX : cell.netWidthMm);
    const depth = zone?.depthMm ?? (bounds ? bounds.maxZ - bounds.minZ : cell.supportDepthMm ?? cell.netDepthMm);
    const kind:Space['kind']=template==='trouserRack'?'trouser':template==='laundryBasket'?'laundry':hanging?'hanging':cell.insert?.type==='shoeRack'?'shoe':cell.insert?.type==='beddingYukluk'?'yukluk':'shelf';
    result.push({id:cell.id,label:cell.label,owner:cell.owner,kind,polygon,openingMm:cell.accessOpeningWidthMm,
      boxes:[{x:zone?.xMm??bounds?.minX??0,z:zone?.zMm??bounds?.minZ??0,y:0,w:Math.max(0,width-(hanging?40:0)),d:depth,h:hanging&&rod?Math.max(0,rod.worldPositionMm[1]-cell.yStartMm-validationConfig.hangingBottomClearanceMm):cell.netHeightMm}]});
  }
  for(const drawer of model.drawers) {
    const cell=model.cells.find(c=>c.id===drawer.cellId);
    const boxes:FreeBox[]=[];
    if (drawer.organizerSlots) {
      const { columnWidthsMm, rowDepthsMm, heightMm } = drawer.organizerSlots;
      let x = 0;
      for (const w of columnWidthsMm) {
        let z = 0;
        for (const d of rowDepthsMm) {
          boxes.push({x,z,y:0,w,d,h:heightMm});
          z += d + drawer.bottomThicknessMm;
        }
        x += w + drawer.bottomThicknessMm;
      }
    } else boxes.push({x:0,y:0,z:0,w:drawer.innerWidthMm,d:drawer.innerDepthMm,h:drawer.innerHeightMm});
    result.push({id:drawer.id,label:drawer.label,owner:cell?.owner??'ortak',kind:'drawer',boxes});
  }
  return result;
}
function compatible(space:Space,target:InventoryTarget):boolean {
  if(space.owner!==target.owner && space.owner!=='ortak') return false;
  if(space.kind==='laundry') return false;
  if(space.kind==='trouser') return target.kind==='trousers';
  if(space.kind==='hanging') return Boolean(INVENTORY_CATALOG[target.kind].hanging);
  if(INVENTORY_CATALOG[target.kind].hanging) return false;
  if(space.kind==='shoe') return target.kind==='shoes';
  return true;
}
/** Ayrık boş kutularla muhafazakâr yerleşim. Aynı hacim iki hedef için tekrar kullanılmaz. */
function reserve(spaces:Space[],target:InventoryTarget,limit:number): {count:number;labels:string[]} {
  const dims=itemDimensions(target), isHanging=Boolean(INVENTORY_CATALOG[target.kind].hanging);
  let count=0; const labels=new Set<string>();
  for(const space of spaces) {
    if(!compatible(space,target)) continue;
    if(space.openingMm!==undefined && Math.min(dims.widthMm,dims.depthMm)+30>space.openingMm) continue;
    let madeProgress=true;
    while(count<limit && madeProgress) {
      madeProgress=false;
      for(let i=0;i<space.boxes.length;i++) {
        const box=space.boxes[i];
        const orientations=isHanging?[[dims.hangerPitchMm??55,dims.depthMm]]:[[dims.widthMm,dims.depthMm],[dims.depthMm,dims.widthMm]];
        const orientation=orientations.find(([w,d])=>w<=box.w && d<=box.d && dims.heightMm<=box.h && (!space.polygon || rectangle(box.x,box.z,w,d).every(p=>pointInConvexPolygon(p,space.polygon!))));
        if(!orientation) continue;
        const [w,d]=orientation;
        space.boxes.splice(i,1);
        if(box.w>w) space.boxes.push({...box,x:box.x+w,w:box.w-w});
        if(!isHanging) {
          if(box.d>d) space.boxes.push({...box,z:box.z+d,w,d:box.d-d});
          if(box.h>dims.heightMm) space.boxes.push({...box,y:box.y+dims.heightMm,w,d,h:box.h-dims.heightMm});
        }
        count++; labels.add(space.label); madeProgress=true; break;
      }
    }
    if(count>=limit) break;
  }
  return {count,labels:[...labels]};
}
export function resolveInventory(design:Design,model:ResolvedModel): {inventory:InventoryResult[];metrics:Record<OwnerType,StorageMetrics>} {
  const spaces=storageSpaces(model);
  const metrics:Record<OwnerType,StorageMetrics>={anne:blankMetrics(),baba:blankMetrics(),ortak:blankMetrics()};
  for(const space of spaces) {
    const box=space.boxes[0], m=metrics[space.owner];
    const area=space.polygon?polygonAreaMm2(space.polygon):box.w*box.d;
    if (space.kind !== 'drawer') m.storageVolumeMm3+=space.polygon?area*box.h:space.boxes.reduce((sum,b)=>sum+b.w*b.d*b.h,0);
    if(space.kind==='hanging'||space.kind==='trouser') m.hangingLengthMm+=box.w;
    else if(space.kind==='drawer') { /* Gerçek iç hacim, aşağıda bölücü hacmi düşülerek hesaplanır. */ }
    else m.shelfAreaMm2+=area;
    if(space.kind==='shoe') m.shoePairs+=reserve(structuredClone([space]),{id:'metric',kind:'shoes',owner:space.owner,quantity:0},1000).count;
  }
  for(const drawer of model.drawers) {
    const owner=model.cells.find(c=>c.id===drawer.cellId)?.owner??'ortak';
    const dividerVolume=(drawer.organizerPanels??[]).reduce((sum,p)=>sum+p.cutWidthMm*p.cutHeightMm*p.cutThicknessMm,0);
    const volume = Math.max(0,drawer.innerWidthMm*drawer.innerDepthMm*drawer.innerHeightMm-dividerVolume);
    metrics[owner].drawerVolumeMm3 += volume;
    metrics[owner].storageVolumeMm3 += volume;
  }
  const remaining=structuredClone(spaces);
  const inventory=(design.inventory??[]).map(target=>{
    const capacity=reserve(structuredClone(spaces),target,1000).count;
    const reserved=reserve(remaining,target,target.quantity);
    const shortfall=Math.max(0,target.quantity-reserved.count);
    return {target,capacity,allocated:reserved.count,shortfall,spaceLabels:reserved.labels,
      suggestion:shortfall ? `${shortfall} adet için ek uygun alan gerekli. ${INVENTORY_CATALOG[target.kind].hanging?'Askı uzunluğu, net derinlik ve boru altı yüksekliğini kontrol edin.':'Raf aralığı, çekmece iç ölçüsü veya yüklük alanını artırın.'}`:'Hedef için uygun fiziksel alan ayrıldı.'};
  });
  return {inventory,metrics};
}
