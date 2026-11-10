import type { Design, OwnerType, PersonProfile, ResolvedModel, ResolvedReach, StudioAnalysis, ValidationIssue } from '../schema/types';
import { obstacleFootprint, polygonBounds, polygonsIntersect, rectangle, resolveMotions, roomDoorSweep, rotatePoint } from './kinematics';
import { hangingProfile, INVENTORY_CATALOG, itemDimensions, resolveInventory } from './inventory';
import {buildMotionScene,initialMotionConflicts,type MotionScene} from './motionConstraints';
import { validationConfig } from '../solver/validationConfig';
import { runFrontMm } from '../schema/designConstraints';
import { itemPreviewPlan } from '../inserts/itemPreview';
import { resolveFunctionalAccess } from './functionalAccess';

export const DEFAULT_PROFILES = { anne:{heightMm:1620}, baba:{heightMm:1780} };
export const OWNER_NAMES: Record<OwnerType,string> = {anne:'Anne',baba:'Baba',ortak:'Ortak'};
export const REACH_LABELS = {low:'Alt bölge · eğilerek erişim',comfortable:'Kolay günlük erişim',high:'Üst erişim · daha az rahat',assisted:'Yüklük · tabure gerekebilir'};
export function profileLimits(profile: PersonProfile) {
  return {eyeHeightMm:Math.round(profile.heightMm*0.93),dailyReachMm:profile.dailyReachMm??Math.round(profile.heightMm*1.05),upperReachMm:profile.upperReachMm??Math.round(profile.heightMm*1.25)};
}
export function limitsForOwner(design:Design,owner:OwnerType) {
  const profiles=design.ergonomics??DEFAULT_PROFILES;
  if(owner!=='ortak') return profileLimits(profiles[owner]);
  const a=profileLimits(profiles.anne),b=profileLimits(profiles.baba);
  return {eyeHeightMm:Math.min(a.eyeHeightMm,b.eyeHeightMm),dailyReachMm:Math.min(a.dailyReachMm,b.dailyReachMm),upperReachMm:Math.min(a.upperReachMm,b.upperReachMm)};
}
export function resolveStudioAnalysis(design:Design,model:ResolvedModel,motionScene?:MotionScene):StudioAnalysis {
  const extra:ValidationIssue[]=[];
  const scene = motionScene ?? buildMotionScene(design, model);
  const reach:ResolvedReach[]=model.cells.map(cell=>{
    const rod=model.panels.find(p=>p.role==='hangingRod' && p.cellId===cell.id);
    const drawer=model.drawers.find(d=>d.cellId===cell.id);
    const accessHeightMm=Math.round(rod?.worldPositionMm[1]??drawer?.frontWorldPositionMm[1]??cell.yStartMm+Math.min(250,cell.netHeightMm/2));
    const limits=limitsForOwner(design,cell.owner);
    const zone=accessHeightMm<450?'low':accessHeightMm<=limits.dailyReachMm?'comfortable':accessHeightMm<=limits.upperReachMm?'high':'assisted';
    const explanation=`${OWNER_NAMES[cell.owner]} için erişim ${accessHeightMm} mm; günlük sınır ${limits.dailyReachMm} mm, üst sınır ${limits.upperReachMm} mm. Ortak alanda kısa kişinin erişimi esas alınır.`;
    if(rod && (zone==='high'||zone==='assisted')) {
      const target=Math.min(limits.dailyReachMm-cell.yStartMm,cell.netHeightMm-65);
      const minGarment=cell.insert ? hangingProfile(cell.insert).heightMm + validationConfig.hangingBottomClearanceMm : 0;
      extra.push({id:`reach-${cell.id}`,code:'ERGONOMIC_HANGING_HIGH',severity:'warning',title:`${OWNER_NAMES[cell.owner]} için askılık yüksek`,description:explanation,targetId:cell.id,
        why:'Bu boru günlük erişim sınırının üzerinde. Eşikler ayarlanabilir planlama varsayımlarıdır.',suggestions:['Boru yüksekliğini düşürün veya daha aşağıda bir askı alanı kullanın.'],
        quickFixes:!cell.cornerJunctionId && target>=minGarment?[{kind:'lowerRod',label:`Boruyu ${cell.yStartMm+target} mm yüksekliğe indir`,cellId:cell.id,heightMm:target}]:[]});
    }
    const template=cell.insert?.storageTemplate;
    const item = itemPreviewPlan(cell, rod, design.interiorItems);
    if (item && item.count === 0) {
      const { available } = item;
      extra.push({
        id: `preview-fit-${cell.id}`, code: 'PREVIEW_ITEM_FIT', severity: 'warning',
        title: '3D eşya örneği ayrılan alana sığmıyor',
        description: `${cell.label}: örnek ${item.widthMm} × ${item.heightMm} × ${item.depthMm} mm (G × Y × D). ${item.hanging ? 'Boru ve askı payı sonrası ' : ''}kullanılabilir alan ${available.widthMm} × ${available.heightMm} × ${available.depthMm} mm. Örnek sahnede gizlenir.`,
        targetId: cell.id,
      });
    }
    if(template) {
      const min=validationConfig.storageMinimumMm[template];
      if(cell.netWidthMm<min[0]||cell.netHeightMm<min[1]||cell.netDepthMm<min[2]) extra.push({id:`template-fit-${cell.id}`,code:'STORAGE_TEMPLATE_FIT',severity:'warning',title:'Özel depolama için net alan dar',description:`${cell.label}: ${min[0]} × ${min[1]} × ${min[2]} mm (genişlik × yükseklik × derinlik) planlama alanı önerilir. Gerçek net alan ${cell.netWidthMm} × ${cell.netHeightMm} × ${cell.netDepthMm} mm.`,targetId:cell.id,why:'Eşya veya mekanizma görüntüsü kapasiteyi artırmak için küçültülmez.'});
      if(template==='blindLuggage' && (cell.accessOpeningWidthMm??cell.netWidthMm)<480) extra.push({id:`blind-access-${cell.id}`,code:'BLIND_LUGGAGE_ACCESS',severity:'warning',title:'Kör köşede valiz çıkarma açıklığı dar',description:`Ön erişim ${cell.accessOpeningWidthMm??cell.netWidthMm} mm. 450 mm valiz kesiti ve 30 mm tutma payı için açıklığı genişletin; köşede döndürerek çıkarma yerinde kontrol gerektirir.`,targetId:cell.id});
      if(template==='trouserRack'||template==='jewelryDrawer'||template==='laundryBasket') extra.push({id:`hardware-${cell.id}`,code:'STORAGE_HARDWARE_REVIEW',severity:'expert',title:'Özel depolama donanımı kontrolü',description:'Gösterilen mekanizma yerleşim temsilidir. Gerçek ürünün montaj, ray ve yük sınırlarını üretici kataloğundan doğrulayın; delik ölçüleri varsayılmamıştır.',targetId:cell.id});
    }
    return {cellId:cell.id,owner:cell.owner,zone,accessHeightMm,dailyReachMm:limits.dailyReachMm,upperReachMm:limits.upperReachMm,explanation};
  });
  const {inventory,metrics}=resolveInventory(design,model);
  for(const row of inventory) if(row.shortfall>0) {
    const quickFixes:NonNullable<ValidationIssue['quickFixes']>=[];
    if(!INVENTORY_CATALOG[row.target.kind].hanging) {
      const dims=itemDimensions(row.target);
      for(const cell of model.cells) {
        if(cell.insert?.type!=='shelfStack'||cell.insert.shelfPinRows||!cell.sourceLeafId||(cell.owner!==row.target.owner&&cell.owner!=='ortak'))continue;
        const group=model.cells.filter(c=>c.sourceLeafId===cell.sourceLeafId);
        const run=design.runs.find(r=>r.id===cell.runId);
        const t=run?.panelThicknessMm??model.panelThicknessMm;
        const gross=group.reduce((sum,c)=>sum+c.netHeightMm,0)+(group.length-1)*t;
        const intervals=Math.floor((gross+t)/(dims.heightMm+t));
        if(intervals>=2&&intervals<group.length&&cell.netWidthMm>=dims.widthMm&&cell.netDepthMm>=dims.depthMm) {
          quickFixes.push({kind:'shelfCount',label:`${cell.label.split('—')[0].trim()}: ${intervals} geniş aralığa düzenle`,cellId:cell.sourceLeafId,count:intervals-1});break;
        }
      }
    }
    extra.push({id:`inventory-${row.target.id}`,code:'INVENTORY_SHORTFALL',severity:'warning',title:`${OWNER_NAMES[row.target.owner]} envanterinde ${row.shortfall} adet eksik yer`,description:row.suggestion,targetId:row.target.id,why:'Hedefler sırayla yerleştirilir; Ortak alanlar bir kez paylaştırılır. Görsel eşya ölçeği hesaba katılmaz.',suggestions:row.spaceLabels.length?[`Uygun alanlar: ${row.spaceLabels.join(', ')}`]:['Uygun iç modül, net derinlik ve eşya ölçülerini kontrol edin.'],quickFixes});
  }
  const motions=resolveMotions(model);
  for(const conflict of initialMotionConflicts(scene))extra.push({id:`initial-${conflict.partId}-${conflict.otherId}`,code:'MOTION_INITIAL_INTERSECTION',severity:'error',title:'Kapalı konumda fiziksel parça kesişmesi',description:conflict.description,targetId:conflict.partId,why:'Canlı harekette kullanılan aynı panel/kulp hacimleri kapalı başlangıçta da denetlenir. Üretim çıktısı bu hata giderilmeden açılmaz.'});
  const bodies=[...model.bays.map(b=>({polygon:rectangle(b.worldCenterMm[0]-b.worldSizeMm[0]/2,b.worldCenterMm[2]-b.worldSizeMm[2]/2,b.worldSizeMm[0],b.worldSizeMm[2]),y0:b.worldCenterMm[1]-b.worldSizeMm[1]/2,y1:b.worldCenterMm[1]+b.worldSizeMm[1]/2})),
    ...model.corners.filter(c=>c.type==='diagonal').map(c=>({polygon:c.polygonXZMm,y0:0,y1:design.runs[0].heightMm}))];
  const colliding=new Set<string>();
  const allPoints=[...bodies.flatMap(b=>b.polygon),...motions.flatMap(m=>m.sweepPolygonsMm.flat())];
  const allBounds=allPoints.length?polygonBounds(allPoints):{minX:0,maxX:0,minZ:0,maxZ:0};
  for(const obstacle of design.obstacles??[]) {
    const poly=obstacleFootprint(obstacle),oy0=obstacle.positionMm[1],oy1=oy0+obstacle.sizeMm[1];
    const overlapY=(y0:number,y1:number)=>oy0<y1&&oy1>y0;
    const runB=design.runs.find(r=>r.wallAxis==='B');
    const alongX=Boolean(runB && obstacle.positionMm[0]>=runFrontMm(runB) && obstacle.positionMm[2]>runFrontMm(design.runs[0]));
    const ob=polygonBounds(poly);
    const position:[number,number,number]=[...obstacle.positionMm];
    if(alongX) position[0]+=Math.ceil(allBounds.maxX-ob.minX+50); else position[2]+=Math.ceil(allBounds.maxZ-ob.minZ+50);
    const fix={kind:'moveObstacle' as const,label:`Engeli ${alongX?'X':'Z'}=${position[alongX?0:2]} mm konumuna taşı`,obstacleId:obstacle.id,positionMm:position};
    if(bodies.some(b=>overlapY(b.y0,b.y1)&&polygonsIntersect(poly,b.polygon))) {
      colliding.add(obstacle.id);
      extra.push({id:`obstacle-body-${obstacle.id}`,code:'ROOM_OBSTACLE_BODY',severity:'error',title:`${obstacle.label} dolap gövdesiyle kesişiyor`,description:'Engelin konumunu, klapayı veya gövde ölçülerini düzenleyin. Priz/pencere gibi alanlarda erişim ve havalandırma da korunmalıdır.',targetId:obstacle.id,why:'Engelin yükseklik aralığı ve gerçek üst plan ayak izi gövde hacmiyle kesişiyor.',quickFixes:obstacle.kind==='bed'||obstacle.kind==='other'?[fix]:[]});
    }
    for(const motion of motions) if(overlapY(motion.yStartMm,motion.yEndMm)&&motion.sweepPolygonsMm.some(p=>polygonsIntersect(p,poly,1))) {
      colliding.add(obstacle.id);
      extra.push({id:`obstacle-motion-${obstacle.id}-${motion.id}`,code:motion.kind==='hinged'?'OBSTACLE_DOOR_SWEEP':motion.kind==='sliding'?'OBSTACLE_SLIDING_SWEEP':'OBSTACLE_DRAWER_SWEEP',severity:'warning',title:`${motion.label} → ${obstacle.label}`,description:motion.kind==='hinged'?`Kapağın ${motion.maxAngleDeg}° açılma alanında engel var.`:`${motion.kind==='sliding'?'Sürgünün':'Çekmecenin'} ${motion.travelMm} mm hareket alanında engel var.`,targetId:obstacle.id,why:'Düşey aralıklar, panel ve kulp zarfları birlikte kontrol edilir. Üst plan yayı 1° adımlıdır; canlı hareket sürekli çarpışma denetimiyle temastan önce durdurulur.',suggestions:['Üst plan süpürme katmanını açın ve engeli/yerleşimi inceleyin.'],quickFixes:obstacle.kind==='bed'||obstacle.kind==='other'?[fix]:[]});
    }
    if(obstacle.kind==='roomDoor' && roomDoorSweep(obstacle).some(p=>bodies.some(b=>overlapY(b.y0,b.y1)&&polygonsIntersect(p,b.polygon,1)))) {
      colliding.add(obstacle.id);
      extra.push({id:`room-door-${obstacle.id}`,code:'ROOM_DOOR_ACCESS_CONFLICT',severity:'warning',title:'Oda kapısının açılımı dolaba ulaşıyor',description:`${obstacle.label} açılma alanını veya dolap başlangıcını düzenleyin.`,targetId:obstacle.id});
    }
  }
  // Mevcut marangoz uyarılarını da aynı açıklama / tek komut düzeltme arayüzüne bağla.
  for(const issue of model.issues) {
    const cell=model.cells.find(c=>c.id===issue.targetId||c.sourceLeafId===issue.targetId);
    if((issue.code==='INTERNAL_DRAWER_HINGE_CONFLICT'||issue.code==='SERVICE_NICHE_DOOR_EXTRACTION_TIGHT')&&cell)
      issue.quickFixes=[{kind:'hinge155',label:'155° sıfır çıkıntılı menteşe seç',bayId:cell.bayId}];
    if(!issue.why) issue.why=issue.description;
  }
  model.issues.push(...extra);
  return {reach,inventory,metrics,motions,collidingObstacleIds:[...colliding],
    functionalAccess: resolveFunctionalAccess(design, model, scene)};
}

export function eyeCameraPose(design:Design,owner:'anne'|'baba') {
  const heightMm=profileLimits((design.ergonomics??DEFAULT_PROFILES)[owner]).eyeHeightMm;
  const a=design.runs.find(r=>r.wallAxis==='A')??design.runs[0],b=design.runs.find(r=>r.wallAxis==='B');
  const x=Math.round(a.lengthMm/2), z=design.layoutKind==='l-shape'&&b?Math.round(b.lengthMm/2):runFrontMm(a);
  return {positionMm:[x+(b?1800:0),heightMm,z+2200] as [number,number,number],targetMm:[x,heightMm,z] as [number,number,number]};
}

export function panelPlanFootprint(panel:ResolvedModel['panels'][number]) {
  if(panel.polygonXZMm) return panel.polygonXZMm;
  return rectangle(-panel.boxSizeMm[0]/2,-panel.boxSizeMm[2]/2,panel.boxSizeMm[0],panel.boxSizeMm[2]).map(p=>rotatePoint(p,panel.rotationYRad,{xMm:panel.worldPositionMm[0],zMm:panel.worldPositionMm[2]}));
}
