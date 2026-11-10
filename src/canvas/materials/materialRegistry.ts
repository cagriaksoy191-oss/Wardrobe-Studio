import * as THREE from 'three';
import type {
  GrainAxis,
  HandleFinishId,
  HandleStyleId,
  LedColorTempId,
  MaterialId,
  Point2DMm,
} from '../../core/schema/types';

export type MaterialCategory = 'wood' | 'solidMatte' | 'glossLacquer' | 'glassMirror' | 'metal';

export const MATERIAL_CATEGORY_LABELS: Record<MaterialCategory, string> = {
  wood: 'Ahşap & MDFLAM',
  solidMatte: 'Düz Mat & Lake',
  glossLacquer: 'Parlak Lake',
  glassMirror: 'Cam & Ayna',
  metal: 'Metal',
};

export interface MaterialDef {
  id: MaterialId;
  name: string;
  category: MaterialCategory;
  categoryLabel: string;
  baseHex: string;
  streakHex: string;
  poreHex?: string;
  hasWoodGrain: boolean;
  roughness: number;
  metalness: number;
  clearcoat?: number;
  bumpScale?: number;
  envMapIntensity: number;
  isGlass?: boolean;
  glassOpacity?: number;
  opacity?: number;
  frameHex?: string;
  isMirror?: boolean;
  constructionNote?: string;
}

export const MATERIAL_CATALOG: Record<MaterialId, MaterialDef> = {
  // --- 1. AHŞAP & MDFLAM DOKULAR ---
  warmOak: {
    id: 'warmOak',
    name: 'Sıcak Doğal Meşe (MDFLAM)',
    category: 'wood',
    categoryLabel: 'Ahşap & MDFLAM',
    baseHex: '#c89d6c',
    streakHex: '#9c6e3e',
    poreHex: '#84592d',
    hasWoodGrain: true,
    roughness: 0.56,
    metalness: 0.04,
    bumpScale: 0.0025,
    envMapIntensity: 0.55,
  },
  lightNordicOak: {
    id: 'lightNordicOak',
    name: 'Açık İskandinav Meşe (MDFLAM)',
    category: 'wood',
    categoryLabel: 'Ahşap & MDFLAM',
    baseHex: '#dcc3a1',
    streakHex: '#bfa17a',
    poreHex: '#a78862',
    hasWoodGrain: true,
    roughness: 0.58,
    metalness: 0.03,
    bumpScale: 0.0022,
    envMapIntensity: 0.5,
  },
  smokedOak: {
    id: 'smokedOak',
    name: 'Füme Koyu Meşe (MDFLAM)',
    category: 'wood',
    categoryLabel: 'Ahşap & MDFLAM',
    baseHex: '#5c4938',
    streakHex: '#3f3023',
    poreHex: '#2c2117',
    hasWoodGrain: true,
    roughness: 0.54,
    metalness: 0.05,
    bumpScale: 0.0028,
    envMapIntensity: 0.6,
  },
  naturalWalnut: {
    id: 'naturalWalnut',
    name: 'Amerikan Ceviz (MDFLAM)',
    category: 'wood',
    categoryLabel: 'Ahşap & MDFLAM',
    baseHex: '#734d34',
    streakHex: '#4d301d',
    poreHex: '#382112',
    hasWoodGrain: true,
    roughness: 0.52,
    metalness: 0.05,
    bumpScale: 0.0026,
    envMapIntensity: 0.65,
  },
  darkWalnut: {
    id: 'darkWalnut',
    name: 'Koyu İtalyan Ceviz (MDFLAM)',
    category: 'wood',
    categoryLabel: 'Ahşap & MDFLAM',
    baseHex: '#4a3121',
    streakHex: '#2d1c11',
    poreHex: '#1f130b',
    hasWoodGrain: true,
    roughness: 0.48,
    metalness: 0.06,
    bumpScale: 0.0028,
    envMapIntensity: 0.7,
  },

  // --- 2. DÜZ MDFLAM & İPEK MAT LAKE ---
  matteWhite: {
    id: 'matteWhite',
    name: 'İpek Mat Beyaz (MDFLAM / Lake)',
    category: 'solidMatte',
    categoryLabel: 'Düz MDFLAM & Mat Lake',
    baseHex: '#f3f4f6',
    streakHex: '#e5e7eb',
    hasWoodGrain: false,
    roughness: 0.4,
    metalness: 0.02,
    envMapIntensity: 0.5,
  },
  creamAlabaster: {
    id: 'creamAlabaster',
    name: 'Sıcak Krem / Alabaster (MDFLAM)',
    category: 'solidMatte',
    categoryLabel: 'Düz MDFLAM & Mat Lake',
    baseHex: '#efe9dd',
    streakHex: '#e2dac9',
    hasWoodGrain: false,
    roughness: 0.42,
    metalness: 0.02,
    envMapIntensity: 0.5,
  },
  linenBeige: {
    id: 'linenBeige',
    name: 'Keten Bej / Kaşmir (MDFLAM)',
    category: 'solidMatte',
    categoryLabel: 'Düz MDFLAM & Mat Lake',
    baseHex: '#dfd5c6',
    streakHex: '#cfc2af',
    hasWoodGrain: false,
    roughness: 0.46,
    metalness: 0.03,
    envMapIntensity: 0.5,
  },
  sageGreen: {
    id: 'sageGreen',
    name: 'Modern Adaçayı Yeşili (Mat Lake)',
    category: 'solidMatte',
    categoryLabel: 'Düz MDFLAM & Mat Lake',
    baseHex: '#8fa395',
    streakHex: '#7a8f80',
    hasWoodGrain: false,
    roughness: 0.42,
    metalness: 0.03,
    envMapIntensity: 0.55,
  },
  softAnthracite: {
    id: 'softAnthracite',
    name: 'Mat Antrasit Gri (MDFLAM / Lake)',
    category: 'solidMatte',
    categoryLabel: 'Düz MDFLAM & Mat Lake',
    baseHex: '#374151',
    streakHex: '#272f3d',
    hasWoodGrain: false,
    roughness: 0.44,
    metalness: 0.08,
    envMapIntensity: 0.6,
  },

  // --- 3. PARLAK LAKE YÜZEYLER ---
  glossWhiteLacquer: {
    id: 'glossWhiteLacquer',
    name: 'Parlak Beyaz Lake (High-Gloss)',
    category: 'glossLacquer',
    categoryLabel: 'Parlak Lake',
    baseHex: '#f8fafc',
    streakHex: '#f1f5f9',
    hasWoodGrain: false,
    roughness: 0.09,
    metalness: 0.06,
    envMapIntensity: 1.25,
  },
  glossCreamLacquer: {
    id: 'glossCreamLacquer',
    name: 'Parlak İnci Krem Lake',
    category: 'glossLacquer',
    categoryLabel: 'Parlak Lake',
    baseHex: '#f3ede0',
    streakHex: '#e6decb',
    hasWoodGrain: false,
    roughness: 0.11,
    metalness: 0.06,
    envMapIntensity: 1.2,
  },

  // --- 4. CAM, AYNA & METAL KAPAK/YÜZEYLER ---
  clearGlass: {
    id: 'clearGlass',
    name: 'Şeffaf Temperli Cam (Alüminyum Çerçeveli)',
    category: 'glassMirror',
    categoryLabel: 'Cam & Ayna (Çerçeveli)',
    baseHex: '#dceefb',
    streakHex: '#bae6fd',
    hasWoodGrain: false,
    roughness: 0.07,
    metalness: 0.12,
    envMapIntensity: 1.4,
    isGlass: true,
    glassOpacity: 0.3,
    frameHex: '#27272a',
    constructionNote:
      'Alüminyum çerçeve profili + 4/6 mm temperli cam ve özel cam kapak menteşesi gerektirir (Uzman Doğrulaması).',
  },
  smokedGlass: {
    id: 'smokedGlass',
    name: 'Füme Bronz Cam (Alüminyum Çerçeveli)',
    category: 'glassMirror',
    categoryLabel: 'Cam & Ayna (Çerçeveli)',
    baseHex: '#443830',
    streakHex: '#29221d',
    hasWoodGrain: false,
    roughness: 0.08,
    metalness: 0.18,
    envMapIntensity: 1.45,
    isGlass: true,
    glassOpacity: 0.44,
    frameHex: '#18181b',
    constructionNote:
      'Alüminyum çerçeve profili + füme temperli cam ve özel cam kapak menteşesi gerektirir (Uzman Doğrulaması).',
  },
  clearMirror: {
    id: 'clearMirror',
    name: 'Gümüş Boy Aynası (Taşıyıcı Panelli)',
    category: 'glassMirror',
    categoryLabel: 'Cam & Ayna (Çerçeveli)',
    baseHex: '#e2e8f0',
    streakHex: '#cbd5e1',
    hasWoodGrain: false,
    roughness: 0.04,
    metalness: 0.94,
    envMapIntensity: 1.65,
    isMirror: true,
    frameHex: '#334155',
    constructionNote:
      'MDFLAM taşıyıcı kapak üzerine güvenlik filmli 4 mm ayna yapıştırma ve ağır yük menteşesi önerilir.',
  },
  bronzeMirror: {
    id: 'bronzeMirror',
    name: 'Füme / Bronz Ayna (Taşıyıcı Panelli)',
    category: 'glassMirror',
    categoryLabel: 'Cam & Ayna (Çerçeveli)',
    baseHex: '#9a7b63',
    streakHex: '#785c47',
    hasWoodGrain: false,
    roughness: 0.05,
    metalness: 0.92,
    envMapIntensity: 1.6,
    isMirror: true,
    frameHex: '#292524',
    constructionNote:
      'MDFLAM taşıyıcı kapak üzerine güvenlik filmli 4 mm bronz ayna ve ağır yük menteşesi önerilir.',
  },
  brushedMetal: {
    id: 'brushedMetal',
    name: 'Fırçalanmış Antrasit Metal Yüzey',
    category: 'metal',
    categoryLabel: 'Metal Yüzeyler',
    baseHex: '#52525b',
    streakHex: '#3f3f46',
    hasWoodGrain: false,
    roughness: 0.28,
    metalness: 0.84,
    envMapIntensity: 1.3,
  },
};

export interface HandleStyleDef {
  id: HandleStyleId;
  name: string;
  shortDesc: string;
  defaultLengthMm: number;
  availableLengthsMm: number[];
}

export const HANDLE_STYLE_CATALOG: Record<HandleStyleId, HandleStyleDef> = {
  barModern: {
    id: 'barModern',
    name: 'Modern Çubuk (Bar) Kulp',
    shortDesc: 'İki ayaklı, modern dikdörtgen/silindirik mimari bar kulp',
    defaultLengthMm: 220,
    availableLengthsMm: [128, 160, 220, 320, 480],
  },
  profileVertical: {
    id: 'profileVertical',
    name: 'Uzun Mimari Profil Kulp',
    shortDesc: 'Boydan veya yarım boy ince L-kesitli modern dikey kulp',
    defaultLengthMm: 600,
    availableLengthsMm: [320, 600, 900, 1100],
  },
  knobMinimal: {
    id: 'knobMinimal',
    name: 'Minimal Silindirik Düğme Kulp',
    shortDesc: 'Tek noktalı sade dairesel düğme kulp',
    defaultLengthMm: 42,
    availableLengthsMm: [36, 42, 54],
  },
  classicCurve: {
    id: 'classicCurve',
    name: 'Klasik Kavisli Kemer Kulp',
    shortDesc: 'Yumuşak geçişli ergonomik kemer kulp',
    defaultLengthMm: 160,
    availableLengthsMm: [128, 160, 224, 320],
  },
  recessedJ: {
    id: 'recessedJ',
    name: 'Gömme / J-Profil Kulp',
    shortDesc: 'Yüzeyden taşmayan modern gömme oyuk/J-profil kulp',
    defaultLengthMm: 180,
    availableLengthsMm: [128, 180, 260, 400],
  },
  edgeLip: {
    id: 'edgeLip',
    name: 'İnce Kenar Çıta Kulp',
    shortDesc: 'Kapak/çekmece kenarına oturan minimal metal tutamak',
    defaultLengthMm: 160,
    availableLengthsMm: [96, 160, 240, 350],
  },
};

export interface HandleFinishDef {
  id: HandleFinishId;
  name: string;
  hex: string;
  metalness: number;
  roughness: number;
}

export const HANDLE_FINISH_CATALOG: Record<HandleFinishId, HandleFinishDef> = {
  matteBlack: {
    id: 'matteBlack',
    name: 'Mat Siyah Anodize',
    hex: '#18181b',
    metalness: 0.72,
    roughness: 0.34,
  },
  brushedInox: {
    id: 'brushedInox',
    name: 'Fırçalanmış İnox / Krom',
    hex: '#d4d4d8',
    metalness: 0.9,
    roughness: 0.22,
  },
  antiqueBronze: {
    id: 'antiqueBronze',
    name: 'Antik Bronz / Füme Pirinç',
    hex: '#6b4c35',
    metalness: 0.84,
    roughness: 0.3,
  },
  warmGold: {
    id: 'warmGold',
    name: 'Saten Altın / Şampanya',
    hex: '#d4af37',
    metalness: 0.88,
    roughness: 0.24,
  },
  bodyMatch: {
    id: 'bodyMatch',
    name: 'Kapak Rengiyle Uyumlu',
    hex: '#94a3b8',
    metalness: 0.25,
    roughness: 0.45,
  },
};

export interface LedColorTempDef {
  id: LedColorTempId;
  name: string;
  kelvinLabel: string;
  hex: string;
  emissiveHex: string;
}

export const LED_COLOR_TEMP_CATALOG: Record<LedColorTempId, LedColorTempDef> = {
  warm2700K: {
    id: 'warm2700K',
    name: 'Sıcak Günbatımı Beyazı',
    kelvinLabel: '2700K Sıcak',
    hex: '#ffdfa8',
    emissiveHex: '#ffb957',
  },
  warm3000K: {
    id: 'warm3000K',
    name: 'Doğal Sıcak Beyaz',
    kelvinLabel: '3000K Doğal',
    hex: '#ffedd0',
    emissiveHex: '#ffd28a',
  },
  natural3000K: {
    id: 'natural3000K',
    name: 'Doğal Sıcak Beyaz',
    kelvinLabel: '3000K Doğal',
    hex: '#ffedd0',
    emissiveHex: '#ffd28a',
  },
  neutral4000K: {
    id: 'neutral4000K',
    name: 'Nötr Gün Işığı',
    kelvinLabel: '4000K Nötr',
    hex: '#fff9ed',
    emissiveHex: '#fff0d4',
  },
  cool5000K: {
    id: 'cool5000K',
    name: 'Soğuk Kristal Beyaz',
    kelvinLabel: '5000K Soğuk',
    hex: '#f0f7ff',
    emissiveHex: '#cce5ff',
  },
};

const textureCache = new Map<string, THREE.CanvasTexture>();
const bumpTextureCache = new Map<string, THREE.CanvasTexture>();
let cachedStudioEnvTexture: THREE.DataTexture | null = null;

/**
 * Tarayıcıda harici ağ bağımlılığı olmadan yüksek kaliteli prosedürel ahşap damarlı doku üretir.
 * Doku yatay (U) ekseni boyunca doğal lifler, hareler ve gözenek çizgilerine sahiptir.
 */
export function getOrCreateWoodTexture(materialId: MaterialId): THREE.CanvasTexture | null {
  const def = MATERIAL_CATALOG[materialId];
  if (!def || !def.hasWoodGrain || typeof document === 'undefined') return null;

  const cached = textureCache.get(materialId);
  if (cached) return cached;

  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.fillStyle = def.baseHex;
  ctx.fillRect(0, 0, 512, 512);

  // 1. Yumuşak ton geçişli geniş ahşap hare bantları
  for (let b = 0; b < 18; b++) {
    const yBand = ((b * 31) % 512);
    const bandH = 18 + (b % 5) * 9;
    const grad = ctx.createLinearGradient(0, yBand, 0, yBand + bandH);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(0.5, def.streakHex);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.globalAlpha = 0.08 + (b % 4) * 0.02;
    ctx.fillStyle = grad;
    ctx.fillRect(0, yBand, 512, bandH);
  }

  // 2. Doğal ahşap damar lifleri (U ekseni boyunca uzanan organik bezier eğrileri)
  ctx.strokeStyle = def.streakHex;
  for (let i = 0; i < 210; i++) {
    const y = (i * 2.45 + ((i * 19) % 13)) % 512;
    ctx.globalAlpha = 0.07 + ((i * 11) % 16) * 0.011;
    ctx.lineWidth = 0.8 + (i % 3) * 0.65;
    const wave1 = ((i % 7) - 3) * 3.2;
    const wave2 = ((i % 5) - 2) * 3.5;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.bezierCurveTo(170, y + wave1, 340, y - wave2, 512, y);
    ctx.stroke();
  }

  // 3. İnce ahşap gözenekleri (Wood pores)
  ctx.strokeStyle = def.poreHex ?? def.streakHex;
  for (let p = 0; p < 140; p++) {
    const px = (p * 43) % 480;
    const py = (p * 29) % 512;
    const len = 14 + (p % 6) * 6;
    ctx.globalAlpha = 0.14;
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(px + len, py + ((p % 3) - 1) * 0.6);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  tex.needsUpdate = true;

  textureCache.set(materialId, tex);
  return tex;
}

/**
 * Ahşap yüzeylerde ışığın damar gözenekleriyle gerçekçi etkileşime girmesi için
 * hafif kabartma (bumpMap) dokusu üretir.
 */
export function getOrCreateWoodBumpTexture(materialId: MaterialId): THREE.CanvasTexture | null {
  const def = MATERIAL_CATALOG[materialId];
  if (!def || !def.hasWoodGrain || typeof document === 'undefined') return null;

  const cached = bumpTextureCache.get(materialId);
  if (cached) return cached;

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, 256, 256);

  ctx.strokeStyle = '#525252';
  for (let i = 0; i < 120; i++) {
    const y = (i * 2.15) % 256;
    ctx.globalAlpha = 0.25 + (i % 4) * 0.08;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.bezierCurveTo(85, y + ((i % 5) - 2) * 1.5, 170, y - ((i % 4) - 2) * 1.5, 256, y);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.needsUpdate = true;

  bumpTextureCache.set(materialId, tex);
  return tex;
}

/**
 * Sunum Modu, Ayna, Cam, Parlak Lake ve Metal yüzeyler için harici HDR dosyası gerektirmeyen,
 * anında yüklenen prosedürel Equirectangular Stüdyo Çevre Haritası (IBL EnvMap) oluşturur.
 */
export function getOrCreateStudioEnvMap(): THREE.DataTexture {
  if (cachedStudioEnvTexture) return cachedStudioEnvTexture;

  const width = 128;
  const height = 64;
  const data = new Uint8Array(width * height * 4);

  for (let y = 0; y < height; y++) {
    const v = y / (height - 1); // 0 = alt, 1 = üst
    for (let x = 0; x < width; x++) {
      const u = x / (width - 1);
      const idx = (y * width + x) * 4;

      // Yumuşak stüdyo tavan/pencere aydınlatması simülasyonu
      const skyFactor = Math.max(0, Math.min(1, (v - 0.35) / 0.65));
      const softboxA =
        Math.exp(-Math.pow((u - 0.25) * 5.5, 2) - Math.pow((v - 0.72) * 5.0, 2)) * 95;
      const softboxB =
        Math.exp(-Math.pow((u - 0.75) * 4.8, 2) - Math.pow((v - 0.65) * 4.5, 2)) * 75;
      const warmBounce =
        Math.exp(-Math.pow((v - 0.25) * 4.0, 2)) * 28;

      const baseR = 38 + skyFactor * 145 + softboxA + softboxB * 0.9 + warmBounce;
      const baseG = 42 + skyFactor * 142 + softboxA * 0.96 + softboxB * 0.95 + warmBounce * 0.8;
      const baseB = 52 + skyFactor * 148 + softboxA * 0.88 + softboxB * 1.05;

      data[idx] = Math.min(255, Math.round(baseR));
      data[idx + 1] = Math.min(255, Math.round(baseG));
      data[idx + 2] = Math.min(255, Math.round(baseB));
      data[idx + 3] = 255;
    }
  }

  const tex = new THREE.DataTexture(data, width, height, THREE.RGBAFormat);
  tex.mapping = THREE.EquirectangularReflectionMapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.magFilter = THREE.LinearFilter;
  tex.minFilter = THREE.LinearFilter;
  tex.needsUpdate = true;

  cachedStudioEnvTexture = tex;
  return tex;
}

/**
 * Bir Kutu (BoxGeometry) panelin UV koordinatlarını dünya ölçeğinde (metre/milimetre)
 * ve seçilen damar yönüne (`grainAxis: 'vertical' | 'horizontal'`) göre yeniden hesaplar.
 * Böylece 400mm'lik raf 900mm'ye çıktığında doku sünmez (stretch olmaz).
 */
export function createWorldSpaceBoxGeometry(
  sizeMeters: [number, number, number],
  grainAxis: GrainAxis
): THREE.BoxGeometry {
  const [sx, sy, sz] = sizeMeters;
  const geom = new THREE.BoxGeometry(sx, sy, sz);

  const posAttr = geom.attributes.position;
  const normAttr = geom.attributes.normal;
  const uvAttr = geom.attributes.uv;

  // 0.65 metre = 1 doku tekrarı
  const scale = 1 / 0.65;

  for (let i = 0; i < posAttr.count; i++) {
    const vx = posAttr.getX(i);
    const vy = posAttr.getY(i);
    const vz = posAttr.getZ(i);

    const nx = Math.abs(normAttr.getX(i));
    const ny = Math.abs(normAttr.getY(i));

    let u = 0;
    let v = 0;

    if (ny > 0.5) {
      // Üst ve alt yüzeyler (XZ düzlemi)
      const longestHorizontalIsX = sx >= sz;
      if (longestHorizontalIsX) {
        u = vx * scale;
        v = vz * scale;
      } else {
        u = vz * scale;
        v = vx * scale;
      }
    } else if (nx > 0.5) {
      // Yan yüzeyler (YZ düzlemi)
      if (grainAxis === 'vertical') {
        u = vy * scale;
        v = vz * scale;
      } else {
        u = vz * scale;
        v = vy * scale;
      }
    } else {
      // Ön ve arka yüzeyler (XY düzlemi)
      if (grainAxis === 'vertical') {
        u = vy * scale;
        v = vx * scale;
      } else {
        u = vx * scale;
        v = vy * scale;
      }
    }

    uvAttr.setXY(i, u, v);
  }

  uvAttr.needsUpdate = true;
  return geom;
}

/**
 * Beşgen / Poligon ekstrüzyon rafların UV koordinatlarını dünya ölçeğinde normalize eder.
 * Böylece beşgen köşe kolları büyütülüp küçültüldüğünde ahşap dokusu sünmez.
 */
export function createWorldSpaceExtrudeGeometry(
  polygonXZMm: Point2DMm[],
  thicknessM: number
): THREE.ExtrudeGeometry {
  const MM_TO_M = 0.001;
  const shape = new THREE.Shape();
  shape.moveTo(polygonXZMm[0].xMm * MM_TO_M, -polygonXZMm[0].zMm * MM_TO_M);
  for (let i = 1; i < polygonXZMm.length; i++) {
    shape.lineTo(polygonXZMm[i].xMm * MM_TO_M, -polygonXZMm[i].zMm * MM_TO_M);
  }
  shape.closePath();

  const geom = new THREE.ExtrudeGeometry(shape, {
    depth: thicknessM,
    bevelEnabled: false,
  });

  const posAttr = geom.attributes.position;
  const uvAttr = geom.attributes.uv;
  const scale = 1 / 0.65;

  if (posAttr && uvAttr) {
    for (let i = 0; i < posAttr.count; i++) {
      const vx = posAttr.getX(i);
      const vy = posAttr.getY(i);
      uvAttr.setXY(i, vx * scale, vy * scale);
    }
    uvAttr.needsUpdate = true;
  }

  return geom;
}
