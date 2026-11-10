import { type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import type { HandleConfig, MaterialId } from '../../core/schema/types';
import { HANDLE_FINISH_CATALOG, MATERIAL_CATALOG } from '../materials/materialRegistry';

const MM_TO_M = 0.001;
const MESH_RAYCAST: THREE.Object3D['raycast'] = THREE.Mesh.prototype.raycast;
const NOOP_RAYCAST: THREE.Object3D['raycast'] = () => null;

export interface HandleMesh3DProps {
  handleConfig?: HandleConfig;
  defaultLengthMm: number;
  defaultOrientation: 'vertical' | 'horizontal';
  bodyMaterialId: MaterialId;
  surfacePositionM: [number, number, number];
  rotationYRad?: number;
  isXray?: boolean;
  raycastEnabled?: boolean;
  onClick?: (e: ThreeEvent<MouseEvent>) => void;
}

/**
 * Gerçek Ölçekli 3D Kapak ve Çekmece Kulpu Bileşeni:
 * - Yerel koordinat sisteminde `z = 0` kapak/çekmece dış yüzeyidir; `+Z` dışarı (odaya) doğrudur.
 * - Menteşeli kapaklarda `pivotGroupRef` içinde, çekmecelerde `slideGroupRef` içinde yer alır;
 *   böylece kapak açılırken veya çekmece kayarken kendi parçasıyla %100 rijit hareket eder.
 * - 6 kulp modeli (`barModern`, `profileVertical`, `knobMinimal`, `classicCurve`, `recessedJ`, `edgeLip`)
 *   ve 5 yüzey rengi (`matteBlack`, `brushedInox`, `antiqueBronze`, `warmGold`, `bodyMatch`) desteklenir.
 */
export function HandleMesh3D({
  handleConfig,
  defaultLengthMm,
  defaultOrientation,
  bodyMaterialId,
  surfacePositionM,
  rotationYRad = 0,
  isXray = false,
  raycastEnabled = true,
  onClick,
}: HandleMesh3DProps) {
  const styleId = handleConfig?.styleId ?? 'barModern';
  const finishId = handleConfig?.finishId ?? 'matteBlack';
  const orientation = handleConfig?.orientation ?? defaultOrientation;
  const rawLengthMm = handleConfig?.lengthMm ?? defaultLengthMm;
  const lengthM = Math.max(0.06, rawLengthMm * MM_TO_M);

  const finishDef = HANDLE_FINISH_CATALOG[finishId] ?? HANDLE_FINISH_CATALOG.matteBlack;
  const bodyMatDef = MATERIAL_CATALOG[bodyMaterialId] ?? MATERIAL_CATALOG.warmOak;

  const colorHex = finishId === 'bodyMatch' ? bodyMatDef.baseHex : finishDef.hex;
  const metalness = finishId === 'bodyMatch' ? bodyMatDef.metalness : finishDef.metalness;
  const roughness = finishId === 'bodyMatch' ? bodyMatDef.roughness : finishDef.roughness;

  const raycastFn = raycastEnabled ? MESH_RAYCAST : NOOP_RAYCAST;
  const isVertical = orientation === 'vertical';
  const rotZ = isVertical ? 0 : Math.PI / 2;

  const matKey = `handle-mat-${styleId}-${finishId}-${bodyMaterialId}-${isXray ? 'xray' : 'solid'}`;

  const renderMaterial = (overrideHex?: string, overrideRoughness?: number) => (
    <meshStandardMaterial
      key={matKey}
      color={overrideHex ?? colorHex}
      metalness={metalness}
      roughness={overrideRoughness ?? roughness}
      transparent={isXray}
      opacity={isXray ? 0.65 : 1}
    />
  );

  // 1) Minimal Yuvarlak Topuz Kulp (knobMinimal) — Yönden bağımsız simetrik topuz
  if (styleId === 'knobMinimal') {
    return (
      <group position={surfacePositionM} rotation={[0, rotationYRad, 0]}>
        {/* Boyun / Bağlantı Ayağı */}
        <mesh
          position={[0, 0, 0.007]}
          rotation={[Math.PI / 2, 0, 0]}
          castShadow={!isXray}
          raycast={raycastFn}
          onClick={onClick}
        >
          <cylinderGeometry args={[0.006, 0.007, 0.014, 20]} />
          {renderMaterial()}
        </mesh>
        {/* Ön Disk Topuz */}
        <mesh
          position={[0, 0, 0.018]}
          rotation={[Math.PI / 2, 0, 0]}
          castShadow={!isXray}
          raycast={raycastFn}
          onClick={onClick}
        >
          <cylinderGeometry args={[0.017, 0.015, 0.009, 24]} />
          {renderMaterial()}
        </mesh>
      </group>
    );
  }

  // 2) Gömme J-Kulp / Kanal Kulp (recessedJ)
  if (styleId === 'recessedJ') {
    const channelLenM = Math.max(0.11, lengthM);
    return (
      <group position={surfacePositionM} rotation={[0, rotationYRad, rotZ]}>
        {/* Koyu Gölge Kanalı (Oyuk Görünümü) */}
        <mesh
          position={[0, 0, 0.0015]}
          castShadow={false}
          raycast={raycastFn}
          onClick={onClick}
        >
          <boxGeometry args={[0.022, channelLenM, 0.003]} />
          {renderMaterial('#111827', 0.85)}
        </mesh>
        {/* Ön J Dudak Profili */}
        <mesh
          position={[-0.007, 0, 0.005]}
          castShadow={!isXray}
          raycast={raycastFn}
          onClick={onClick}
        >
          <boxGeometry args={[0.006, channelLenM, 0.009]} />
          {renderMaterial()}
        </mesh>
      </group>
    );
  }

  // 3) Üst Kenar / Gizli Çekme Kulp (edgeLip)
  if (styleId === 'edgeLip') {
    const lipLenM = Math.max(0.09, lengthM);
    return (
      <group position={surfacePositionM} rotation={[0, rotationYRad, rotZ]}>
        {/* Ön Yüzey İnce Plaka */}
        <mesh
          position={[0, 0, 0.006]}
          castShadow={!isXray}
          raycast={raycastFn}
          onClick={onClick}
        >
          <boxGeometry args={[0.018, lipLenM, 0.012]} />
          {renderMaterial()}
        </mesh>
        {/* Parmak Tutma Kıvrımı */}
        <mesh
          position={[0, 0, 0.015]}
          castShadow={!isXray}
          raycast={raycastFn}
          onClick={onClick}
        >
          <boxGeometry args={[0.022, lipLenM, 0.005]} />
          {renderMaterial()}
        </mesh>
      </group>
    );
  }

  // 4) İnce Dikey Profil Kulp (profileVertical)
  if (styleId === 'profileVertical') {
    const profLenM = Math.max(0.18, lengthM * 1.35);
    return (
      <group position={surfacePositionM} rotation={[0, rotationYRad, rotZ]}>
        {/* Kapak Kenarına Oturan İnce Boydan Boya/Uzun L-Profil */}
        <mesh
          position={[0, 0, 0.01]}
          castShadow={!isXray}
          raycast={raycastFn}
          onClick={onClick}
        >
          <boxGeometry args={[0.007, profLenM, 0.02]} />
          {renderMaterial()}
        </mesh>
        <mesh
          position={[-0.005, 0, 0.018]}
          castShadow={!isXray}
          raycast={raycastFn}
          onClick={onClick}
        >
          <boxGeometry args={[0.014, profLenM, 0.004]} />
          {renderMaterial()}
        </mesh>
      </group>
    );
  }

  // 5) Klasik Kavisli Kulp (classicCurve)
  if (styleId === 'classicCurve') {
    const footOffsetM = Math.max(0.035, lengthM * 0.4);
    return (
      <group position={surfacePositionM} rotation={[0, rotationYRad, rotZ]}>
        {/* Üst ve Alt Rozet Tabanlar */}
        {[-footOffsetM, footOffsetM].map((yOff, idx) => (
          <group key={idx} position={[0, yOff, 0]}>
            <mesh
              position={[0, 0, 0.003]}
              rotation={[Math.PI / 2, 0, 0]}
              castShadow={!isXray}
              raycast={raycastFn}
              onClick={onClick}
            >
              <cylinderGeometry args={[0.01, 0.011, 0.006, 18]} />
              {renderMaterial()}
            </mesh>
            <mesh
              position={[0, 0, 0.012]}
              rotation={[Math.PI / 2, 0, 0]}
              castShadow={!isXray}
              raycast={raycastFn}
              onClick={onClick}
            >
              <cylinderGeometry args={[0.005, 0.006, 0.016, 16]} />
              {renderMaterial()}
            </mesh>
          </group>
        ))}
        {/* Kavisli Köprü Gövde */}
        <mesh
          position={[0, 0, 0.023]}
          castShadow={!isXray}
          raycast={raycastFn}
          onClick={onClick}
        >
          <cylinderGeometry args={[0.0065, 0.0065, lengthM * 0.92, 18]} />
          {renderMaterial()}
        </mesh>
        {/* Orta Dekoratif Boğum */}
        <mesh
          position={[0, 0, 0.024]}
          castShadow={!isXray}
          raycast={raycastFn}
          onClick={onClick}
        >
          <cylinderGeometry args={[0.0085, 0.0085, Math.min(0.045, lengthM * 0.28), 18]} />
          {renderMaterial()}
        </mesh>
      </group>
    );
  }

  // 6) Varsayılan: Modern Düz Bar Kulp (barModern) — 2 Ayaklı Mimari Köprü Bar
  const footSpanOffsetM = Math.max(0.03, lengthM * 0.36);
  return (
    <group position={surfacePositionM} rotation={[0, rotationYRad, rotZ]}>
      {/* İki Bağlantı Ayağı */}
      {[-footSpanOffsetM, footSpanOffsetM].map((yOff, idx) => (
        <mesh
          key={idx}
          position={[0, yOff, 0.009]}
          castShadow={!isXray}
          raycast={raycastFn}
          onClick={onClick}
        >
          <boxGeometry args={[0.01, 0.012, 0.018]} />
          {renderMaterial()}
        </mesh>
      ))}
      {/* Ana Düz Bar Gövdesi */}
      <mesh
        position={[0, 0, 0.022]}
        castShadow={!isXray}
        raycast={raycastFn}
        onClick={onClick}
      >
        <boxGeometry args={[0.011, lengthM, 0.01]} />
        {renderMaterial()}
      </mesh>
    </group>
  );
}
