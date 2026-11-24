import type { Design } from '../schema/types';
import { validationConfig } from '../solver/validationConfig';

export const SAMPLE_DESIGNS: Record<string, Design> = {
  'l-diagonal-asymmetric': {
    schemaVersion: 1,
    id: 'l-diagonal-asymmetric',
    name: 'L-Gardırop: Beşgen Köşe + Asimetrik Derinlik (600/480mm)',
    layoutKind: 'l-shape',
    roomHeightMm: 2550,
    materials: {
      carcassMaterialId: 'warmOak',
      frontMaterialId: 'linenBeige',
    },
    junctions: [
      {
        id: 'junc-main',
        runAId: 'run-A',
        runBId: 'run-B',
        type: 'diagonal',
        priorityRunId: 'run-A',
        fillerWidthMm: 60,
        diagonalArmAMm: 900,
        diagonalArmBMm: 900,
        shelvesCount: 4,
        hasHangingRod: false,
      },
    ],
    fronts: [],
    runs: [
      {
        id: 'run-A',
        label: 'A Kolu (Sol Ana Duvar - 600mm)',
        wallAxis: 'A',
        lengthMm: 2800,
        depthMm: 600,
        heightMm: 2400,
        plinthHeightMm: 80,
        topFillerHeightMm: 40,
        startFillerMm: 0,
        endFillerMm: 20,
        panelThicknessMm: 18,
        backPanelThicknessMm: 8,
        bays: [
          {
            id: 'bay-A1',
            label: 'A1: Servis Nişi + Çekmece/Askı',
            width: { kind: 'fixed', mm: 920 },
            locked: true,
            owner: 'ortak',
            autoFront: true,
            root: {
              kind: 'split',
              id: 'split-a1-root',
              direction: 'horizontal',
              dividerThicknessMm: 18,
              children: [
                {
                  id: 'ch-a1-lower',
                  size: { kind: 'flex', weight: 1 },
                  node: {
                    kind: 'split',
                    id: 'split-a1-vertical',
                    direction: 'vertical',
                    dividerThicknessMm: 18,
                    children: [
                      {
                        id: 'ch-a1-niche',
                        size: { kind: 'fixed', mm: 260 },
                        locked: true,
                        node: {
                          kind: 'leaf',
                          id: 'cell-a1-service-niche',
                          label: 'Merdiven & Ütü Masası Nişi',
                          owner: 'ortak',
                          insert: {
                            type: 'serviceNiche',
                            handClearanceMm: 30,
                            serviceItems: [
                              {
                                id: 'item-ladder',
                                name: 'Katlanır Merdiven',
                                widthMm: 130,
                                depthMm: 480,
                                heightMm: 1550,
                              },
                              {
                                id: 'item-ironing',
                                name: 'Ütü Masası',
                                widthMm: 90,
                                depthMm: 420,
                                heightMm: 1500,
                              },
                            ],
                          },
                        },
                      },
                      {
                        id: 'ch-a1-right',
                        size: { kind: 'flex', weight: 1 },
                        node: {
                          kind: 'split',
                          id: 'split-a1-right-stack',
                          direction: 'horizontal',
                          dividerThicknessMm: 18,
                          children: [
                            {
                              id: 'ch-a1-drawers',
                              size: { kind: 'fixed', mm: 720 },
                              node: {
                                kind: 'leaf',
                                id: 'cell-a1-drawers',
                                label: '4 Çekmeceli Modül',
                                owner: 'anne',
                                insert: {
                                  type: 'drawerBank',
                                  drawerCount: 4,
                                },
                              },
                            },
                            {
                              id: 'ch-a1-hang',
                              size: { kind: 'flex', weight: 1 },
                              node: {
                                kind: 'leaf',
                                id: 'cell-a1-short-hang',
                                label: 'Üst Gömlek/Ceket Askısı',
                                owner: 'anne',
                                insert: {
                                  type: 'hangingRod',
                                  rodHeightType: 'short',
                                },
                              },
                            },
                          ],
                        },
                      },
                    ],
                  },
                },
                {
                  id: 'ch-a1-top-yukluk',
                  size: { kind: 'fixed', mm: 380 },
                  locked: true,
                  node: {
                    kind: 'leaf',
                    id: 'cell-a1-yukluk',
                    label: 'A1 Üst Yüklük / Hurç Alanı',
                    owner: 'ortak',
                    insert: {
                      type: 'beddingYukluk',
                    },
                  },
                },
              ],
            },
          },
          {
            id: 'bay-A2',
            label: 'A2: Baba Çift Kat Askı Bölmesi',
            width: { kind: 'flex', weight: 1, minMm: 500 },
            locked: false,
            owner: 'baba',
            autoFront: true,
            root: {
              kind: 'split',
              id: 'split-a2-root',
              direction: 'horizontal',
              dividerThicknessMm: 18,
              children: [
                {
                  id: 'ch-a2-main',
                  size: { kind: 'flex', weight: 1 },
                  node: {
                    kind: 'leaf',
                    id: 'cell-a2-double-hang',
                    label: 'Çift Kat Gömlek/Pantolon Askısı',
                    owner: 'baba',
                    insert: {
                      type: 'doubleHanging',
                    },
                  },
                },
                {
                  id: 'ch-a2-top',
                  size: { kind: 'fixed', mm: 380 },
                  locked: true,
                  node: {
                    kind: 'leaf',
                    id: 'cell-a2-yukluk',
                    label: 'A2 Üst Yüklük',
                    owner: 'baba',
                    insert: {
                      type: 'beddingYukluk',
                    },
                  },
                },
              ],
            },
          },
        ],
      },
      {
        id: 'run-B',
        label: 'B Kolu (Sağ Duvar - 480mm İnce Derinlik)',
        wallAxis: 'B',
        lengthMm: 2200,
        depthMm: 480,
        heightMm: 2400,
        plinthHeightMm: 80,
        topFillerHeightMm: 40,
        startFillerMm: 0,
        endFillerMm: 20,
        panelThicknessMm: 18,
        backPanelThicknessMm: 8,
        bays: [
          {
            id: 'bay-B1',
            label: 'B1: Katlı Giysi & Çekmece Kulesi',
            width: { kind: 'flex', weight: 1, minMm: 450 },
            locked: false,
            owner: 'anne',
            autoFront: true,
            root: {
              kind: 'split',
              id: 'split-b1-root',
              direction: 'horizontal',
              dividerThicknessMm: 18,
              children: [
                {
                  id: 'ch-b1-drawers',
                  size: { kind: 'fixed', mm: 680 },
                  node: {
                    kind: 'leaf',
                    id: 'cell-b1-drawers',
                    label: '3 Çekmeceli İç Düzen',
                    owner: 'anne',
                    insert: {
                      type: 'drawerBank',
                      drawerCount: 3,
                    },
                  },
                },
                {
                  id: 'ch-b1-shelves',
                  size: { kind: 'flex', weight: 1 },
                  node: {
                    kind: 'leaf',
                    id: 'cell-b1-shelves',
                    label: 'Kazak & Tekstil Rafları',
                    owner: 'anne',
                    insert: {
                      type: 'shelfStack',
                      shelfCount: 3,
                    },
                  },
                },
                {
                  id: 'ch-b1-top',
                  size: { kind: 'fixed', mm: 380 },
                  node: {
                    kind: 'leaf',
                    id: 'cell-b1-yukluk',
                    label: 'B1 Üst Yüklük',
                    owner: 'ortak',
                    insert: {
                      type: 'beddingYukluk',
                    },
                  },
                },
              ],
            },
          },
          {
            id: 'bay-B2',
            label: 'B2: Ayakkabılık & Çok Amaçlı Kutu',
            width: { kind: 'fixed', mm: 600 },
            locked: true,
            owner: 'ortak',
            autoFront: true,
            root: {
              kind: 'split',
              id: 'split-b2-root',
              direction: 'horizontal',
              dividerThicknessMm: 18,
              children: [
                {
                  id: 'ch-b2-shoes',
                  size: { kind: 'fixed', mm: 950 },
                  node: {
                    kind: 'leaf',
                    id: 'cell-b2-shoes',
                    label: '5 Katlı Ayakkabılık',
                    owner: 'ortak',
                    insert: {
                      type: 'shoeRack',
                      shoeTiers: 5,
                    },
                  },
                },
                {
                  id: 'ch-b2-storage',
                  size: { kind: 'flex', weight: 1 },
                  node: {
                    kind: 'leaf',
                    id: 'cell-b2-boxes',
                    label: 'Çok Amaçlı Kiler & Kutu Rafları',
                    owner: 'ortak',
                    insert: {
                      type: 'shelfStack',
                      shelfCount: 3,
                    },
                  },
                },
              ],
            },
          },
        ],
      },
    ],
  },

  'l-blind-corner': {
    schemaVersion: 1,
    id: 'l-blind-corner',
    name: 'L-Gardırop: Kör Köşe (Kör Klapalı + Kademeli L-Askı)',
    layoutKind: 'l-shape',
    roomHeightMm: 2550,
    materials: {
      carcassMaterialId: 'naturalWalnut',
      frontMaterialId: 'matteWhite',
    },
    junctions: [
      {
        id: 'junc-blind',
        runAId: 'run-A',
        runBId: 'run-B',
        type: 'blind',
        priorityRunId: 'run-A',
        fillerWidthMm: 60,
        diagonalArmAMm: 900,
        diagonalArmBMm: 900,
        shelvesCount: 3,
        hasHangingRod: true,
      },
    ],
    fronts: [],
    runs: [
      {
        id: 'run-A',
        label: 'A Kolu (Öncelikli Kör Köşe Kolu - 600mm)',
        wallAxis: 'A',
        lengthMm: 2700,
        depthMm: 600,
        heightMm: 2400,
        plinthHeightMm: 80,
        topFillerHeightMm: 40,
        startFillerMm: 0,
        endFillerMm: 20,
        panelThicknessMm: 18,
        backPanelThicknessMm: 8,
        bays: [
          {
            id: 'bay-blind-A1',
            label: 'A1: Kör Köşe Derin Askı & Valiz Bölmesi',
            width: { kind: 'fixed', mm: 1100 },
            locked: true,
            owner: 'ortak',
            autoFront: true,
            root: {
              kind: 'split',
              id: 'split-blind-a1',
              direction: 'horizontal',
              dividerThicknessMm: 18,
              children: [
                {
                  id: 'ch-blind-main',
                  size: { kind: 'flex', weight: 1 },
                  node: {
                    kind: 'leaf',
                    id: 'cell-blind-hang',
                    label: 'Kör Köşe Uzun Askı & Valiz Alanı',
                    owner: 'ortak',
                    insert: {
                      type: 'hangingRod',
                      rodHeightType: 'long',
                    },
                  },
                },
                {
                  id: 'ch-blind-top',
                  size: { kind: 'fixed', mm: 420 },
                  node: {
                    kind: 'leaf',
                    id: 'cell-blind-yukluk',
                    label: 'Derin Yorgan / Yüklük Bölmesi',
                    owner: 'ortak',
                    insert: {
                      type: 'beddingYukluk',
                    },
                  },
                },
              ],
            },
          },
          {
            id: 'bay-blind-A2',
            label: 'A2: Anne Uzun Elbise & Çekmece',
            width: { kind: 'flex', weight: 1 },
            locked: false,
            owner: 'anne',
            autoFront: true,
            root: {
              kind: 'split',
              id: 'split-blind-a2',
              direction: 'horizontal',
              dividerThicknessMm: 18,
              children: [
                {
                  id: 'ch-blind-a2-drw',
                  size: { kind: 'fixed', mm: 540 },
                  node: {
                    kind: 'leaf',
                    id: 'cell-blind-a2-drw',
                    label: '3 Çekmeceli Alt Modül',
                    owner: 'anne',
                    insert: {
                      type: 'drawerBank',
                      drawerCount: 3,
                    },
                  },
                },
                {
                  id: 'ch-blind-a2-hang',
                  size: { kind: 'flex', weight: 1 },
                  node: {
                    kind: 'leaf',
                    id: 'cell-blind-a2-hang',
                    label: 'Uzun Elbise / Palto Askısı',
                    owner: 'anne',
                    insert: {
                      type: 'hangingRod',
                      rodHeightType: 'long',
                    },
                  },
                },
              ],
            },
          },
          {
            id: 'bay-blind-A3',
            label: 'A3: Baba Çift Askı Bölmesi',
            width: { kind: 'flex', weight: 1 },
            locked: false,
            owner: 'baba',
            autoFront: true,
            root: {
              kind: 'leaf',
              id: 'cell-blind-a3',
              label: 'Çift Kat Askı',
              owner: 'baba',
              insert: {
                type: 'doubleHanging',
              },
            },
          },
        ],
      },
      {
        id: 'run-B',
        label: 'B Kolu (Yanaşan Kol - 580mm)',
        wallAxis: 'B',
        lengthMm: 2100,
        depthMm: 580,
        heightMm: 2400,
        plinthHeightMm: 80,
        topFillerHeightMm: 40,
        startFillerMm: 0,
        endFillerMm: 20,
        panelThicknessMm: 18,
        backPanelThicknessMm: 8,
        bays: [
          {
            id: 'bay-blind-B1',
            label: 'B1: Kademeli Raf & Çekmece',
            width: { kind: 'flex', weight: 1 },
            locked: false,
            owner: 'baba',
            autoFront: true,
            root: {
              kind: 'split',
              id: 'split-blind-b1',
              direction: 'horizontal',
              dividerThicknessMm: 18,
              children: [
                {
                  id: 'ch-blind-b1-drw',
                  size: { kind: 'fixed', mm: 720 },
                  node: {
                    kind: 'leaf',
                    id: 'cell-blind-b1-drw',
                    label: '4 Çekmece',
                    owner: 'baba',
                    insert: {
                      type: 'drawerBank',
                      drawerCount: 4,
                    },
                  },
                },
                {
                  id: 'ch-blind-b1-shf',
                  size: { kind: 'flex', weight: 1 },
                  node: {
                    kind: 'leaf',
                    id: 'cell-blind-b1-shf',
                    label: '4 Katlı Raf',
                    owner: 'baba',
                    insert: {
                      type: 'shelfStack',
                      shelfCount: 4,
                    },
                  },
                },
              ],
            },
          },
          {
            id: 'bay-blind-B2',
            label: 'B2: Servis Nişi & Ayakkabılık',
            width: { kind: 'fixed', mm: 650 },
            locked: true,
            owner: 'ortak',
            autoFront: true,
            root: {
              kind: 'split',
              id: 'split-blind-b2',
              direction: 'vertical',
              dividerThicknessMm: 18,
              children: [
                {
                  id: 'ch-blind-b2-niche',
                  size: { kind: 'fixed', mm: 250 },
                  locked: true,
                  node: {
                    kind: 'leaf',
                    id: 'cell-blind-b2-niche',
                    label: 'Ütü Masası & Süpürge Nişi',
                    owner: 'ortak',
                    insert: {
                      type: 'serviceNiche',
                      handClearanceMm: 30,
                      serviceItems: [
                        {
                          id: 'item-iron-2',
                          name: 'Ütü Masası',
                          widthMm: 95,
                          depthMm: 420,
                          heightMm: 1500,
                        },
                      ],
                    },
                  },
                },
                {
                  id: 'ch-blind-b2-shoes',
                  size: { kind: 'flex', weight: 1 },
                  node: {
                    kind: 'leaf',
                    id: 'cell-blind-b2-shoes',
                    label: '6 Katlı Ayakkabılık',
                    owner: 'ortak',
                    insert: {
                      type: 'shoeRack',
                      shoeTiers: 6,
                    },
                  },
                },
              ],
            },
          },
        ],
      },
    ],
  },

  'straight-wardrobe': {
    schemaVersion: 1,
    id: 'straight-wardrobe',
    name: 'Düz (I-Tipi) Gömme Gardırop (3000 × 2400 × 600mm)',
    layoutKind: 'straight',
    roomHeightMm: 2550,
    materials: {
      carcassMaterialId: 'warmOak',
      frontMaterialId: 'softAnthracite',
    },
    junctions: [],
    fronts: [],
    runs: [
      {
        id: 'run-A',
        label: 'Ana Duvar Kolu (3000mm)',
        wallAxis: 'A',
        lengthMm: 3000,
        depthMm: 600,
        heightMm: 2400,
        plinthHeightMm: 80,
        topFillerHeightMm: 40,
        startFillerMm: 0,
        endFillerMm: 0,
        panelThicknessMm: 18,
        backPanelThicknessMm: 8,
        bays: [
          {
            id: 'bay-S1',
            label: 'S1: 800mm Sabit Modül (Net 764mm)',
            width: { kind: 'fixed', mm: 800 },
            locked: true,
            owner: 'anne',
            autoFront: true,
            root: {
              kind: 'leaf',
              id: 'cell-s1-hang',
              label: 'Çift Kat Askı (764mm Net)',
              owner: 'anne',
              insert: {
                type: 'doubleHanging',
              },
            },
          },
          {
            id: 'bay-S2',
            label: 'S2: Esnek Raf & Çekmece',
            width: { kind: 'flex', weight: 1 },
            locked: false,
            owner: 'ortak',
            autoFront: true,
            root: {
              kind: 'split',
              id: 'split-s2',
              direction: 'horizontal',
              dividerThicknessMm: 18,
              children: [
                {
                  id: 'ch-s2-drw',
                  size: { kind: 'fixed', mm: 720 },
                  node: {
                    kind: 'leaf',
                    id: 'cell-s2-drw',
                    label: '4 Çekmece',
                    owner: 'ortak',
                    insert: {
                      type: 'drawerBank',
                      drawerCount: 4,
                    },
                  },
                },
                {
                  id: 'ch-s2-shf',
                  size: { kind: 'flex', weight: 1 },
                  node: {
                    kind: 'leaf',
                    id: 'cell-s2-shf',
                    label: 'Üst Raf Grubu',
                    owner: 'ortak',
                    insert: {
                      type: 'shelfStack',
                      shelfCount: 3,
                    },
                  },
                },
              ],
            },
          },
          {
            id: 'bay-S3',
            label: 'S3: Esnek Baba Askı & Yüklük',
            width: { kind: 'flex', weight: 1 },
            locked: false,
            owner: 'baba',
            autoFront: true,
            root: {
              kind: 'split',
              id: 'split-s3',
              direction: 'horizontal',
              dividerThicknessMm: 18,
              children: [
                {
                  id: 'ch-s3-hang',
                  size: { kind: 'flex', weight: 1 },
                  node: {
                    kind: 'leaf',
                    id: 'cell-s3-hang',
                    label: 'Uzun Askı Bölmesi',
                    owner: 'baba',
                    insert: {
                      type: 'hangingRod',
                      rodHeightType: 'long',
                    },
                  },
                },
                {
                  id: 'ch-s3-top',
                  size: { kind: 'fixed', mm: 420 },
                  node: {
                    kind: 'leaf',
                    id: 'cell-s3-yukluk',
                    label: 'Üst Yorgan Yüklüğü',
                    owner: 'ortak',
                    insert: {
                      type: 'beddingYukluk',
                    },
                  },
                },
              ],
            },
          },
        ],
      },
    ],
  },
};

export interface BlankDesignOptions {
  name?: string;
  layoutKind: 'l-shape' | 'straight';
  cornerType?: 'diagonal' | 'blind';
  lengthAMm?: number;
  depthAMm?: number;
  lengthBMm?: number;
  depthBMm?: number;
  heightMm?: number;
  roomHeightMm?: number;
  /** true olduğunda başlangıç bölme adedi raf açıklığı uyarısı (850 mm) üretmeyecek biçimde otomatik hesaplanır (IA-09). */
  autoFitBayCount?: boolean;
}

function computeBlankBayCount(
  usableSpanMm: number,
  panelThicknessMm: number,
  minBays: number,
  maxBays: number
): number {
  const safeNetSpanMm = validationConfig.shelfSpanWarningMm - 10;
  const neededForSpan = Math.ceil((usableSpanMm - panelThicknessMm) / (safeNetSpanMm + panelThicknessMm));
  const maxByMinWidth = Math.max(1, Math.floor((usableSpanMm - panelThicknessMm) / (300 + panelThicknessMm)));
  const floorBays = Math.min(minBays, maxByMinWidth);
  return Math.max(floorBays, Math.min(maxBays, maxByMinWidth, neededForSpan));
}

function createBlankBays(axis: 'A' | 'B', count: number): Design['runs'][number]['bays'] {
  const lower = axis.toLowerCase();
  return Array.from({ length: count }, (_, idx) => {
    const num = idx + 1;
    return {
      id: `bay-${axis}${num}`,
      label: `${axis}${num}: Boş Gövde Bölmesi #${num}`,
      width: { kind: 'flex' as const, weight: 1 },
      locked: false,
      owner: 'ortak' as const,
      autoFront: true,
      frontMode: 'open' as const,
      hingeAngleDeg: 110 as const,
      root: {
        kind: 'leaf' as const,
        id: `cell-blank-${lower}${num}`,
        label: `${axis}${num} Boş İç Hacim`,
        owner: 'ortak' as const,
        insert: { type: 'empty' as const },
      },
    };
  });
}

/**
 * Kullanıcının iç modülleri önceden doldurulmamış, sıfırdan boş bir gardırop oluşturmasını sağlar.
 */
export function createBlankDesign(options: BlankDesignOptions): Design {
  const layoutKind = options.layoutKind;
  const cornerType = options.cornerType ?? 'diagonal';
  const lengthAMm = Math.max(1200, Math.min(6000, Math.round(options.lengthAMm ?? 2600)));
  const depthAMm = Math.max(350, Math.min(800, Math.round(options.depthAMm ?? 600)));
  const lengthBMm = Math.max(1200, Math.min(6000, Math.round(options.lengthBMm ?? 2100)));
  const depthBMm = Math.max(350, Math.min(800, Math.round(options.depthBMm ?? 550)));
  const heightMm = Math.max(1800, Math.min(3000, Math.round(options.heightMm ?? 2400)));
  const panelThicknessMm = 18;
  const endFillerMm = 20;
  const fillerWidthMm = 60;
  const diagonalArmAMm = Math.max(900, depthBMm + 150);
  const diagonalArmBMm = Math.max(900, depthAMm + 150);

  const cornerConsumeA = layoutKind === 'l-shape' && cornerType === 'diagonal' ? diagonalArmAMm : 0;
  const usableAMm = Math.max(200, lengthAMm - endFillerMm - cornerConsumeA);
  const bayCountA = options.autoFitBayCount
    ? computeBlankBayCount(usableAMm, panelThicknessMm, 2, 7)
    : 2;

  const runs: Design['runs'] = [
    {
      constructionMode: 'shared',
      id: 'run-A',
      label: `A Kolu (${lengthAMm}×${depthAMm}mm)`,
      wallAxis: 'A',
      lengthMm: lengthAMm,
      depthMm: depthAMm,
      heightMm,
      plinthHeightMm: 80,
      topFillerHeightMm: 40,
      startFillerMm: 0,
      endFillerMm,
      panelThicknessMm,
      backPanelThicknessMm: 8,
      bays: createBlankBays('A', bayCountA),
    },
  ];

  if (layoutKind === 'l-shape') {
    const cornerConsumeB = cornerType === 'diagonal' ? diagonalArmBMm : depthAMm + fillerWidthMm;
    const usableBMm = Math.max(200, lengthBMm - endFillerMm - cornerConsumeB);
    const bayCountB = options.autoFitBayCount
      ? computeBlankBayCount(usableBMm, panelThicknessMm, 1, 6)
      : 1;
    runs.push({
      constructionMode: 'shared',
      id: 'run-B',
      label: `B Kolu (${lengthBMm}×${depthBMm}mm)`,
      wallAxis: 'B',
      lengthMm: lengthBMm,
      depthMm: depthBMm,
      heightMm,
      plinthHeightMm: 80,
      topFillerHeightMm: 40,
      startFillerMm: 0,
      endFillerMm,
      panelThicknessMm,
      backPanelThicknessMm: 8,
      bays: createBlankBays('B', bayCountB),
    });
  }

  return {
    schemaVersion: 1,
    id: 'custom-blank-wardrobe',
    name:
      options.name?.trim() ||
      (layoutKind === 'l-shape'
        ? `Özel L-Gardırop (${cornerType === 'diagonal' ? 'Beşgen Köşe' : 'Kör Köşe'})`
        : 'Özel Düz (I-Tipi) Gardırop'),
    layoutKind,
    roomHeightMm: options.roomHeightMm === undefined ? Math.max(heightMm + 100, 2550)
      : Math.max(1800, Math.min(4000, Math.round(options.roomHeightMm))),
    materials: {
      carcassMaterialId: 'warmOak',
      frontMaterialId: 'linenBeige',
    },
    junctions:
      layoutKind === 'l-shape'
        ? [
            {
              id: 'junc-custom',
              runAId: 'run-A',
              runBId: 'run-B',
              type: cornerType,
              priorityRunId: 'run-A',
              fillerWidthMm,
              diagonalArmAMm,
              diagonalArmBMm,
              shelvesCount: 2,
              hasHangingRod: false,
              doorMode: 'open',
            },
          ]
        : [],
    fronts: [],
    runs,
  };
}

