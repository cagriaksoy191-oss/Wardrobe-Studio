import type { InsertConfig, InsertType, InteriorItemPreset, ResolvedCell, ServiceItemSpec } from '../schema/types';

export interface InsertRegistryEntry {
  type: InsertType;
  title: string;
  shortTitle: string;
  description: string;
  recommendedMinWidthMm: number;
  recommendedMinHeightMm: number;
  createDefaultConfig: () => InsertConfig;
  previewPreset?: (cell: ResolvedCell) => InteriorItemPreset;
}

export const STANDARD_SERVICE_ITEMS: ServiceItemSpec[] = [
  {
    id: 'std-ladder',
    name: 'Katlanır Ev Merdiveni (4 Basamak)',
    widthMm: 130,
    depthMm: 480,
    heightMm: 1550,
  },
  {
    id: 'std-ironing',
    name: 'Katlanır Ütü Masası',
    widthMm: 90,
    depthMm: 420,
    heightMm: 1500,
  },
  {
    id: 'std-vacuum',
    name: 'Dikey Şarjlı Süpürge',
    widthMm: 150,
    depthMm: 280,
    heightMm: 1220,
  },
];

export interface ResolvedServiceItemPlacement {
  id: string;
  name: string;
  /** Nişin ön açıklığı (genişlik ekseni) boyunca kapladığı ince kenar ölçüsü (mm) */
  frontWidthMm: number;
  /** Nişin derinlik ekseni boyunca yan dikmeye paralel uzanan geniş yüz ölçüsü (mm) */
  intoDepthMm: number;
  /** Dikey yükseklik (mm) */
  verticalHeightMm: number;
  /** Girilen (widthMm, depthMm) değerinin ince kenarı öne getirmek için 90° döndürülüp döndürülmediği */
  rotated90Deg: boolean;
}

/**
 * Dar servis nişindeki eşyaları (merdiven, ütü masası, süpürge) ince kenarı öne bakacak,
 * geniş yüzü ise nişin yan dikmelerine paralel olacak şekilde yönlendirir.
 * Hem parametrik çözümleyici (sığma ve kapaktan çıkarılabilirlik hesabı) hem de 3D sahne bu ortak fonksiyonu kullanır.
 */
export function resolveServiceItemPlacement(
  item: ServiceItemSpec
): ResolvedServiceItemPlacement {
  const w = Math.max(20, Math.round(item.widthMm));
  const d = Math.max(20, Math.round(item.depthMm));
  const h = Math.max(100, Math.round(item.heightMm));

  // İnce kenar her zaman niş ağzına (öne) bakar; geniş yüz niş derinliği boyunca yan panele paralel yerleşir
  const frontWidthMm = Math.min(w, d);
  const intoDepthMm = Math.max(w, d);

  return {
    id: item.id,
    name: item.name,
    frontWidthMm,
    intoDepthMm,
    verticalHeightMm: h,
    rotated90Deg: w > d,
  };
}

export const INSERT_REGISTRY: Record<InsertType, InsertRegistryEntry> = {
  shelfStack: {
    type: 'shelfStack',
    title: 'Raf Grubu (Katlı Giysi / Kutu)',
    shortTitle: 'Raf Grubu',
    description: 'Kazak, tişört, ev tekstili veya düzenleyici kutular için çok katlı raf sistemi.',
    recommendedMinWidthMm: 250,
    recommendedMinHeightMm: 350,
    previewPreset: cell => {
      if (cell.netHeightMm >= 340 && cell.subIntervalIndex === 0) return 'storageBoxes';
      if (cell.owner === 'anne' && cell.subIntervalIndex === 1 && cell.netHeightMm >= 272) return 'bags';
      return 'foldedClothes';
    },
    createDefaultConfig: () => ({
      type: 'shelfStack',
      shelfCount: 3,
      adjustable: true,
    }),
  },
  hangingRod: {
    type: 'hangingRod',
    title: 'Tekli Askı Borusu (Gömlek / Uzun Elbise)',
    shortTitle: 'Tekli Askı',
    description: 'Kısa (gömlek/ceket), orta veya uzun (elbise/palto) askılık alanı.',
    recommendedMinWidthMm: 350,
    recommendedMinHeightMm: 850,
    previewPreset: cell => {
      const profile = cell.insert?.rodHeightType;
      return profile === 'long' ? 'longDresses' : profile === 'medium' ? 'jackets' : 'shirts';
    },
    createDefaultConfig: () => ({
      type: 'hangingRod',
      rodHeightType: 'long',
    }),
  },
  doubleHanging: {
    type: 'doubleHanging',
    title: 'Çift Kat Askı (Üst + Alt Boru)',
    shortTitle: 'Çift Kat Askı',
    description: 'Gömlek, ceket ve pantolonlar için ara raflı çift katlı maksimum kapasiteli askılık.',
    recommendedMinWidthMm: 450,
    recommendedMinHeightMm: 1750,
    previewPreset: cell => cell.subIntervalIndex === 0 ? 'trousers' : 'shirts',
    createDefaultConfig: () => ({
      type: 'doubleHanging',
    }),
  },
  drawerBank: {
    type: 'drawerBank',
    title: 'Çekmece Takımı (Dış veya İç Çekmece)',
    shortTitle: 'Çekmece Takımı',
    description: 'Teleskopik raylı dıştan açılan veya kapak arkası iç çekmece grubu.',
    recommendedMinWidthMm: 350,
    recommendedMinHeightMm: 360,
    createDefaultConfig: () => ({
      type: 'drawerBank',
      drawerCount: 4,
      drawerSlide: 'partial',
      isInternalDrawer: false,
    }),
  },
  shoeRack: {
    type: 'shoeRack',
    title: 'Çok Katlı Ayakkabılık',
    shortTitle: 'Ayakkabılık',
    description: 'Sık aralıklı ayakkabı ve kutu rafları.',
    recommendedMinWidthMm: 350,
    recommendedMinHeightMm: 500,
    previewPreset: () => 'shoes',
    createDefaultConfig: () => ({
      type: 'shoeRack',
      shoeTiers: 5,
    }),
  },
  serviceNiche: {
    type: 'serviceNiche',
    title: 'Dar Dikey Servis Nişi (Merdiven / Ütü Masası)',
    shortTitle: 'Servis Nişi',
    description: 'Katlanır merdiven, ütü masası ve süpürge için el ve menteşe payı denetimli özel bölme.',
    recommendedMinWidthMm: 180,
    recommendedMinHeightMm: 1300,
    createDefaultConfig: () => ({
      type: 'serviceNiche',
      handClearanceMm: 30,
      serviceItems: [structuredClone(STANDARD_SERVICE_ITEMS[0]), structuredClone(STANDARD_SERVICE_ITEMS[1])],
    }),
  },
  beddingYukluk: {
    type: 'beddingYukluk',
    title: 'Yüklük / Yorgan & Valiz Bölmesi',
    shortTitle: 'Yüklük / Hurç',
    description: 'Yorgan, yastık, büyük hurç ve mevsimlik valizler için geniş ve yüksek tek hacim.',
    recommendedMinWidthMm: 450,
    recommendedMinHeightMm: 320,
    previewPreset: cell => (cell.subIntervalIndex ?? 0) % 2 === 1 ? 'suitcases' : 'hurc',
    createDefaultConfig: () => ({
      type: 'beddingYukluk',
    }),
  },
  empty: {
    type: 'empty',
    title: 'Boş Hacim (Açık Niş)',
    shortTitle: 'Boş Hacim',
    description: 'İç aparat atanmamış serbest açık bölme.',
    recommendedMinWidthMm: 150,
    recommendedMinHeightMm: 150,
    createDefaultConfig: () => ({
      type: 'empty',
    }),
  },
};
