import { Edges } from '@react-three/drei';
import { useLayoutEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { resolveServiceItemPlacement } from '../../core/inserts/insertRegistry';
import { itemPreviewPlan, servicePreviewEnabled, type PreviewPreset } from '../../core/inserts/itemPreview';
import type { InteriorItemPreset, InteriorItemsConfig, ResolvedCell, ResolvedPanel } from '../../core/schema/types';

const MM_TO_M = 0.001;
const NOOP_RAYCAST: THREE.Object3D['raycast'] = () => null;

export const INTERIOR_ITEM_PRESET_LABELS: Record<InteriorItemPreset, string> = {
  auto: 'Otomatik (Modül Tipine Göre)',
  none: 'Boş (Eşya Gizli)',
  shirts: 'Askılı Gömlek / Bluz Grubu',
  jackets: 'Askılı Ceket / Takım Elbise',
  trousers: 'Askılı Pantolon Grubu',
  longDresses: 'Uzun Elbise / Palto Grubu',
  foldedClothes: 'Katlanmış Kazak / Tişört Yığını',
  shoes: 'Ayakkabı Çiftleri',
  bags: 'El Çantası / Omuz Çantası',
  storageBoxes: 'Organizer Kutu / Sepet',
  hurc: 'Yüklük Hurcu / Yorgan Paketi',
  suitcases: 'Valiz / Bavul',
};

const FABRIC = ['#f8fafc', '#cbd5e1', '#93c5fd', '#64748b', '#e2d9c8', '#a7f3d0'];
const DARK = ['#292524', '#57534e', '#78350f', '#e7e5e4', '#1e293b', '#991b1b'];
const PALETTES: Record<PreviewPreset, readonly string[]> = {
  shirts: FABRIC,
  jackets: ['#1e293b', '#334155', '#475569', '#57534e', '#292524'],
  trousers: DARK,
  longDresses: ['#9f1239', '#0f766e', '#3730a3', '#b45309', '#334155'],
  foldedClothes: FABRIC,
  shoes: DARK,
  bags: ['#78350f', '#1c1917', '#a16207', '#be123c', '#d6d3d1'],
  storageBoxes: ['#cbd5e1', '#e7e5e4', '#a8a29e'],
  hurc: ['#e7e5e4', '#a8a29e', '#94a3b8'],
  suitcases: DARK,
};

type XYZ = [number, number, number];
type ItemBox = { center: XYZ; size: XYZ; color: string };
const softItemGeometry = new RoundedBoxGeometry(1, 1, 1, 1, 0.08);

function ItemInstances({ pieces, hooks = false }: { pieces: ItemBox[]; hooks?: boolean }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const mesh = ref.current!;
    const transform = new THREE.Object3D();
    const color = new THREE.Color();
    pieces.forEach((piece, index) => {
      transform.position.set(...piece.center).multiplyScalar(MM_TO_M);
      transform.scale.set(...piece.size).multiplyScalar(MM_TO_M);
      transform.updateMatrix();
      mesh.setMatrixAt(index, transform.matrix);
      mesh.setColorAt(index, color.set(piece.color));
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [pieces]);
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, pieces.length]} castShadow receiveShadow raycast={NOOP_RAYCAST}>
      {hooks ? <cylinderGeometry args={[0.5, 0.5, 1, 8]} /> : <primitive object={softItemGeometry} attach="geometry" dispose={null} />}
      <meshStandardMaterial roughness={hooks ? 0.25 : 0.73} metalness={hooks ? 0.8 : 0.04} />
    </instancedMesh>
  );
}

function PlannedItems({ cell, plan }: { cell: ResolvedCell; plan: NonNullable<ReturnType<typeof itemPreviewPlan>> }) {
  const { preset, hanging, widthMm: w, heightMm: h, depthMm: d, pitch, count, layers, rodOffset, rodHeight } = plan;
  const zone = cell.hangingZoneMm;
  const position: XYZ = [zone ? zone.xMm + zone.widthMm / 2 : cell.worldCenterMm[0], cell.yStartMm, zone ? zone.zMm + zone.depthMm / 2 : cell.worldCenterMm[2]];
  if (cell.supportDepthMm !== undefined) {
    position[cell.wallAxis === 'B' ? 0 : 2] -= (cell.netDepthMm - cell.supportDepthMm) / 2;
  }
  const boxes: ItemBox[] = [];
  const hooks: ItemBox[] = [];
  const add = (center: XYZ, size: XYZ, color: string) => boxes.push({ center, size, color });
  const palette = PALETTES[preset];
  for (let index = 0; index < count; index++) {
    const x = (index - (count - 1) / 2) * pitch;
    const color = palette[index % palette.length];
    if (hanging) {
      add([x, rodHeight - 28 - h / 2, rodOffset], [w - 6, h, d], color);
      add([x, rodHeight - 16, rodOffset], [14, 22, d * 0.86], '#b48352');
      if (preset !== 'trousers') add([x, rodHeight - 32, rodOffset], [w, 45, d * 0.42], color);
      hooks.push({ center: [x, rodHeight + 10, rodOffset], size: [4, 26, 4], color: '#d4d4d8' });
    } else if (preset === 'shoes') {
      for (const offset of [-53, 53]) {
        add([x + offset, 8, 0], [82, 16, d], '#e7e5e4');
        add([x + offset, 40, -d * 0.14], [78, 52, d * 0.62], color);
        add([x + offset, 25, d * 0.22], [76, 28, d * 0.42], color);
      }
    } else if (preset === 'bags') {
      add([x, 110, -3], [w, 220, d - 6], color);
      add([x, 246, -3], [w * 0.46, 52, 18], color);
      add([x, 150, d / 2 - 3], [28, 18, 6], '#d4af37');
    } else {
      for (let layer = 0; layer < layers; layer++) {
        const shade = palette[(index * 3 + layer) % palette.length];
        const lid = preset === 'foldedClothes' ? 0 : 16;
        const y = layer * (h + 2);
        add([x, y + (h - lid) / 2, 0], [w, h - lid, d], shade);
        if (lid) add([x, y + h - lid / 2, 0], [w, lid, d], preset === 'suitcases' ? '#292524' : '#d6d3d1');
      }
    }
  }
  return (
    <group position={position.map(mm => mm * MM_TO_M) as XYZ} rotation={[0, !zone && cell.wallAxis === 'B' ? Math.PI / 2 : 0, 0]}>
      <ItemInstances pieces={boxes} />
      {hooks.length > 0 && <ItemInstances pieces={hooks} hooks />}
    </group>
  );
}

export function WardrobeItemsPreview({ cells, panels, interiorItemsConfig }: {
  cells: ResolvedCell[];
  panels: ResolvedPanel[];
  interiorItemsConfig?: InteriorItemsConfig;
}) {
  if (interiorItemsConfig?.enabled === false) return null;
  const rods = new Map(panels.filter(panel => panel.role === 'hangingRod' && panel.cellId).reverse().map(panel => [panel.cellId, panel]));
  return (
    <group>
      {cells.map(cell => {
        if (cell.insert?.type === 'serviceNiche') {
          return servicePreviewEnabled(interiorItemsConfig) ? <ServiceNicheRealItems key={cell.id} cell={cell} /> : null;
        }
        if (cell.insert?.storageTemplate === 'laundryBasket') {
          return interiorItemsConfig?.showStorageBoxesAndLuggage === false ? null : <LaundryBasket key={cell.id} cell={cell} />;
        }
        const plan = itemPreviewPlan(cell, rods.get(cell.id), interiorItemsConfig);
        return plan && plan.count > 0 ? <PlannedItems key={cell.id} cell={cell} plan={plan} /> : null;
      })}
    </group>
  );
}

function LaundryBasket({cell}:{cell:ResolvedCell}) {
  const w=350*MM_TO_M,h=600*MM_TO_M,d=450*MM_TO_M;
  const overflow=cell.netWidthMm<350||cell.netHeightMm<600||cell.netDepthMm<450;
  const color=overflow?'#fb7185':'#94a3b8';
  return <group position={[cell.worldCenterMm[0]*MM_TO_M,cell.yStartMm*MM_TO_M+0.005,cell.worldCenterMm[2]*MM_TO_M]} rotation={[0,cell.wallAxis==='B'?Math.PI/2:0,0]}>
    <mesh position={[0,0.008,0]} raycast={NOOP_RAYCAST}><boxGeometry args={[w,0.016,d]}/><meshStandardMaterial color={color}/></mesh>
    {Array.from({length:8},(_,i)=>{const x=-w/2+i*w/7;return [-d/2,d/2].map((z,j)=><mesh key={`${i}-${j}`} position={[x,h/2,z]} raycast={NOOP_RAYCAST}><boxGeometry args={[0.004,h,0.004]}/><meshStandardMaterial color={color} metalness={0.6} roughness={0.35}/></mesh>);})}
    {[0.12,0.3,0.48,0.6].map(y=><group key={y}>{[-d/2,d/2].map((z,i)=><mesh key={`x-${i}`} position={[0,y,z]} raycast={NOOP_RAYCAST}><boxGeometry args={[w,0.005,0.005]}/><meshStandardMaterial color={color}/></mesh>)}{[-w/2,w/2].map((x,i)=><mesh key={`z-${i}`} position={[x,y,0]} raycast={NOOP_RAYCAST}><boxGeometry args={[0.005,0.005,d]}/><meshStandardMaterial color={color}/></mesh>)}</group>)}
    <mesh position={[0,0.2,0]} raycast={NOOP_RAYCAST}><boxGeometry args={[w-0.04,0.36,d-0.04]}/><meshStandardMaterial color={overflow?'#be123c':'#cbd5e1'} roughness={0.9}/></mesh>
  </group>;
}

function ServiceNicheRealItems({ cell }: { cell: ResolvedCell }) {
  const rawItems = cell.insert?.serviceItems ?? [];
  if (rawItems.length === 0) return null;

  const placements = rawItems.map((it) => resolveServiceItemPlacement(it));
  const totalFrontWidthMm = placements.reduce((acc, p) => acc + p.frontWidthMm, 0);
  const gapMm = placements.length > 1
    ? Math.min(8, Math.max(0, Math.floor((cell.netWidthMm - totalFrontWidthMm) / (placements.length - 1)))) : 0;

  const isWallB = cell.wallAxis === 'B';
  const rotY = isWallB ? Math.PI / 2 : 0;
  const cellBottomYM = cell.yStartMm * MM_TO_M;

  let cursorAlongWidthMm = -(totalFrontWidthMm + (placements.length - 1) * gapMm) / 2;

  return (
    <group
      position={[
        cell.worldCenterMm[0] * MM_TO_M,
        cellBottomYM,
        cell.worldCenterMm[2] * MM_TO_M,
      ]}
      rotation={[0, rotY, 0]}
    >
      {placements.map((item) => {
        const frontWM = item.frontWidthMm * MM_TO_M;
        const depthM = item.intoDepthMm * MM_TO_M;
        const heightM = item.verticalHeightMm * MM_TO_M;

        const itemRightEdgeMm = cursorAlongWidthMm + item.frontWidthMm;
        const centerAlongWidthMm = cursorAlongWidthMm + item.frontWidthMm / 2;
        cursorAlongWidthMm = itemRightEdgeMm + gapMm;

        const overflowsWidth =
          totalFrontWidthMm > cell.netWidthMm || itemRightEdgeMm > cell.netWidthMm / 2 + 2;
        const overflowsDepth = item.intoDepthMm > cell.netDepthMm;
        const overflowsHeight = item.verticalHeightMm > cell.netHeightMm;
        const hasOverflow = overflowsWidth || overflowsDepth || overflowsHeight;

        const depthCenterOffsetMm =
          -cell.netDepthMm / 2 + item.intoDepthMm / 2 + Math.min(20, Math.max(0, cell.netDepthMm - item.intoDepthMm));
        const itemX = centerAlongWidthMm * MM_TO_M;
        const itemZ = depthCenterOffsetMm * MM_TO_M;

        const lowerName = item.name.toLowerCase();
        const isLadder = lowerName.includes('merdiven') || item.id.includes('ladder');
        const isIroningBoard = lowerName.includes('ütü') || item.id.includes('iron');

        if (isLadder && !hasOverflow) {
          const stepCount = lowerName.includes('4') ? 4 : 3;
          return (
            <group key={item.id} position={[itemX, 0.004, itemZ]}>
              {/* Katlı Merdiven Ön ve Arka Alüminyum Kolları (Yan Dikmeye Paralel) */}
              {[-depthM * 0.42, depthM * 0.42].map((zRail, rIdx) => (
                <mesh
                  key={rIdx}
                  position={[0, heightM / 2, zRail]}
                  castShadow
                  raycast={NOOP_RAYCAST}
                >
                  <boxGeometry args={[frontWM * 0.72, heightM, 0.032]} />
                  <meshStandardMaterial color="#cbd5e1" metalness={0.78} roughness={0.28} />
                </mesh>
              ))}
              {/* Basamaklar */}
              {Array.from({ length: stepCount }, (_, sIdx) => {
                const stepY = ((sIdx + 1) / (stepCount + 1)) * heightM * 0.88;
                return (
                  <mesh
                    key={sIdx}
                    position={[0, stepY, 0]}
                    castShadow
                    raycast={NOOP_RAYCAST}
                  >
                    <boxGeometry args={[frontWM * 0.78, 0.022, depthM * 0.82]} />
                    <meshStandardMaterial color="#334155" roughness={0.45} metalness={0.35} />
                  </mesh>
                );
              })}
            </group>
          );
        }

        if (isIroningBoard && !hasOverflow) {
          return (
            <group key={item.id} position={[itemX, 0.004, itemZ]}>
              {/* Katlı Metal Ayak Çerçevesi */}
              <mesh
                position={[-frontWM * 0.22, heightM * 0.46, 0]}
                castShadow
                raycast={NOOP_RAYCAST}
              >
                <boxGeometry args={[frontWM * 0.34, heightM * 0.92, depthM * 0.55]} />
                <meshStandardMaterial color="#94a3b8" metalness={0.72} roughness={0.3} />
              </mesh>
              {/* Kumaş Kaplı Ütü Masası Tablası (İnce Kenar Önde, Geniş Yüz Yan Dikmeye Paralel) */}
              <mesh
                position={[frontWM * 0.14, heightM * 0.48, 0]}
                castShadow
                raycast={NOOP_RAYCAST}
              >
                <boxGeometry args={[frontWM * 0.48, heightM * 0.94, depthM * 0.94]} />
                <meshStandardMaterial color="#cbd5e1" roughness={0.75} />
              </mesh>
            </group>
          );
        }

        // Dikey Şarjlı Süpürge veya taşma durumunda şeffaf sınır kutusu
        if (!hasOverflow) {
          return (
            <group key={item.id} position={[itemX, 0.004, itemZ]}>
              {/* Zemin Süpürge Başlığı */}
              <mesh position={[0, 0.032, 0]} castShadow raycast={NOOP_RAYCAST}>
                <boxGeometry args={[frontWM * 0.85, 0.058, depthM * 0.85]} />
                <meshStandardMaterial color="#1e293b" roughness={0.4} metalness={0.4} />
              </mesh>
              {/* Dikey Boru */}
              <mesh position={[0, heightM * 0.48, 0]} castShadow raycast={NOOP_RAYCAST}>
                <cylinderGeometry args={[0.016, 0.016, heightM * 0.82, 16]} />
                <meshStandardMaterial color="#d97706" metalness={0.78} roughness={0.25} />
              </mesh>
              {/* Üst Siklon Motor Gövdesi */}
              <mesh position={[0, heightM * 0.84, 0]} castShadow raycast={NOOP_RAYCAST}>
                <cylinderGeometry args={[0.052, 0.052, 0.21, 18]} />
                <meshStandardMaterial color="#475569" metalness={0.6} roughness={0.32} />
              </mesh>
            </group>
          );
        }

        return (
          <mesh key={item.id} position={[itemX, heightM / 2 + 0.004, itemZ]} raycast={NOOP_RAYCAST}>
            <boxGeometry args={[frontWM, heightM, depthM]} />
            <meshStandardMaterial
              color="#f43f5e"
              transparent
              depthWrite={false}
              opacity={0.48}
              roughness={0.35}
              metalness={0.25}
            />
            <Edges scale={1} threshold={15} color="#fda4af" lineWidth={2} raycast={NOOP_RAYCAST} />
          </mesh>
        );
      })}
    </group>
  );
}
