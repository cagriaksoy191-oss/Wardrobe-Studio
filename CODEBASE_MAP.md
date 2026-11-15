# Wardrobe Studio · güncel kaynak kod haritası

Üretim uygulama kaynağı `9624f90`; WS-UX-009a'nın ilk yayın/kabul commit'i `55a1639`. Yalnız doküman gönderimleri uygulama kaynağını değiştirmez. Başlangıç: [AI devir rehberi](AI_PLATFORM_HANDOFF.md). Teknik sözleşme: [mühendislik değişmezleri](ENGINEERING_INVARIANTS.md). Aşağıdaki harita işlev, sembol ve ilgili testlerle aranabilir.

## Çalışma zamanları ve veri akışı

[package.json](package.json) React, React DOM, Zustand/Immer, Zod, Three.js, React Three Fiber, Drei, Vitest, TypeScript/Vite ve dışa aktarma bağımlılıklarını listeler. [main.tsx](src/main.tsx) React kökü → [App](src/App.tsx) çalışma adımları, dialoglar, başlatma ve menüler → [useWardrobeStore](src/store/useWardrobeStore.ts) komut, seçim, kayıt ve çözülmüş model → [WardrobeCanvas](src/canvas/scene/WardrobeCanvas.tsx) Three/R3F sahne. [Vite](vite.config.ts) tarayıcı derlemesini, [Wrangler](wrangler.jsonc) statik SPA yayınını, [paket denetimi](scripts/verify-static-build.mjs) izinli varlıkları doğrular. `npm run build` TypeScript denetimini ve Vite build’i sıralar. Vitest dosyaları `tests/` altında.

## CAD ve model

| Alan | Girdi → kaynak ve sembol → çıktı | Hedef test |
| --- | --- | --- |
| Tasarım ve şema | JSON/komut taslağı → [types](src/core/schema/types.ts) `Design`, `Run`, `Bay`, `SplitNode`, `Junction`, `Front`, `ResolvedModel` ve [designSchema](src/core/schema/designSchema.ts) `DesignSchema`, `roundDesignMeasurements`, `normalizeAndValidateDesign`, `parseDesignJson` → doğrulanmış tamsayı mm tasarım. [designConstraints](src/core/schema/designConstraints.ts) `assertDesignStructure` referans ve yapı kuralları. | [JSON](tests/security-json-compatibility.test.ts), [solver](tests/solver.test.ts) |
| Oda, düz/L, gövde, A/B | `Design.runs/junctions` → [sampleDesigns](src/core/presets/sampleDesigns.ts) `createBlankDesign`, [carcassSolver](src/core/solver/carcassSolver.ts) `solveDesign`, [flexSolver](src/core/solver/flexSolver.ts) `distributeIntegerMm`, [cornerSolver](src/core/solver/cornerSolver.ts) `solveCornerJunction` → panel, arkalık, dikme, bay, köşe, hücre, ölçü ve hata. | [solver](tests/solver.test.ts), [geometri](tests/remediation-geometry.test.ts) |
| İç düzen ve erişim aralıkları | Ağaç/hücre ID ve ölçü → [treeMutator](src/core/solver/treeMutator.ts) `splitLeafInDesign`, `realizeSubIntervalInDesign`, `realizeLeafWithExactSolvedHeights`, `setContiguousGroupIntervalCountInDesign`, `commitDirectionalResizeInDesign` ve [adjustableShelves](src/core/solver/adjustableShelves.ts) `shelfGridIntervals` → değişen niyet ve çözümde raf/aralıklar. [insertRegistry](src/core/inserts/insertRegistry.ts), [storageTemplates](src/core/inserts/storageTemplates.ts) ve [itemPreview](src/core/inserts/itemPreview.ts) askı, aksesuar, hizmet öğesi ve şablonları besler. | [modüller](tests/remediation-modules.test.ts), [düzenleme](tests/ux-editing.test.ts) |
| Çekmeceler | İç/dış `drawerBank`, yükseklik, kapsam → [treeMutator](src/core/solver/treeMutator.ts) `updateDrawerFrontHeightInDesign`, `equalizeDrawerBankInDesign` ve [carcassSolver](src/core/solver/carcassSolver.ts) → `ResolvedDrawerUnit`, çekmece kasası ve gerçek üretim bileşenleri. | [modüller](tests/remediation-modules.test.ts), [üretim](tests/phase5-production.test.ts) |
| Menteşe, sürgü ve otomatik cephe | Bay modu ve `Front` → [frontCommands](src/core/fronts/frontCommands.ts) `automaticBayFront`, `configureFrontInDesign`, `splitFrontRangeInDesign`; [frontGeometry](src/core/fronts/frontGeometry.ts) `frontVerticalRange`, `retainLegacyBodyAnchors`; [hingePlanning](src/core/solver/hingePlanning.ts) `planHingeOpenings`; [slidingSolver](src/core/solver/slidingSolver.ts) `defaultSlidingConfig`, `attachSlidingFronts` → bağımsız üst/alt aralık, menteşe ve 2/3 raylı kanat geometrisi. | [otomatik cephe](tests/auto-front-geometry.test.ts), [hareket](tests/phase5-motion.test.ts), [Aşama 4](tests/phase4.test.ts) |
| Malzeme, kulp, klapa, bitiş | `MaterialPalette`, `HandleConfig`, `ExteriorFinishConfig`, LED ve `Run` klapa ayarları → `setMaterials`, `setExteriorFinish`, `setLedLighting` [store](src/store/useWardrobeStore.ts), [materialRegistry](src/canvas/materials/materialRegistry.ts), [HandleMesh3D](src/canvas/wardrobe/HandleMesh3D.tsx), [productionModel](src/core/production/productionModel.ts) `materialForPanel` → render malzemesi, kulp, klapa/taç ve üretim malzemesi. | [geometri](tests/remediation-geometry.test.ts), [üretim](tests/phase5-production.test.ts), [temas](tests/phase5-contact.test.ts) |

## Fiziksel davranış

| Alan | Girdi → kaynak ve sembol → çıktı | Hedef test |
| --- | --- | --- |
| Poz ve çarpışma | `Design` + `ResolvedModel` + anlık poz → [kinematics](src/core/analysis/kinematics.ts) `hingedVolumes`, `slidingVolumes`, `drawerVolumes`, `roomDoorSweep`; [motionConstraints](src/core/analysis/motionConstraints.ts) `buildMotionScene`, `initialMotionConflicts`, `sweptTranslationTime`, `constrainMotion`, `createMotionConstraint` → limit, temas, gerçek açılma/strok ve engel. | [hareket](tests/phase5-motion.test.ts), [temas](tests/phase5-contact.test.ts) |
| Simülatör ve etkileşim | Hareket isteği ve kare süresi → [MotionSimulator](src/core/analysis/motionSimulator.ts), [MotionController / MotionNotice](src/canvas/scene/MotionController.tsx), [SlidingLeafInteraction](src/canvas/wardrobe/SlidingLeafInteraction.tsx) → geçici poz, ray düzlemi sürükleme, Türkçe duruş nedeni. | [kurtarma](tests/drawer-slide-recovery.test.ts), [temas](tests/phase5-contact.test.ts) |
| WS-UX-009a güvenli sıra · üretimde doğrulandı | Gerçek poz + engel → [safeMotionRecovery](src/core/analysis/safeMotionRecovery.ts) `planSafeRecovery` → izole kopyada tek kanat/çekmece planı. Simülatörde `recoveryOffer`, `startRecovery`, `cancelRecovery`, gerçek hedefe varış ve işlem sahipliği. `MotionNotice` açıklama/başlat/iptal/ilerleme sunar. Store `motionCommand` yeni aynı değerli komutu da ayırt eder; `syncRecoveryTargets`/`notifyRecovery` geçicidir. Design/geçmiş/üretim verisi değişmez. | [31 yeni deterministik test](tests/safe-motion-recovery.test.ts), [üretim kabulü ve sınırlar](SAFE_MOTION_RECOVERY_PRODUCTION_RELEASE.md), [ilk uygulama raporu](SAFE_MOTION_RECOVERY_IMPLEMENTATION_REPORT.md) |
| İşlevsel erişim, engel ve ergonomi | Çözülmüş hacimler + eşya zarfı + oda engelleri → [functionalAccess](src/core/analysis/functionalAccess.ts) `resolveFunctionalAccess`, `accessWarnings`; [studioAnalysis](src/core/analysis/studioAnalysis.ts) `resolveStudioAnalysis`; [inventory](src/core/analysis/inventory.ts) `resolveInventory` → raf/askı koridoru, çekmece ulaşımı, süpürme, erişim sınıfı ve envanter. [AccessReview](src/ui/AccessReview.tsx) ve [accessRemedies](src/core/fronts/accessRemedies.ts) `evaluateAccessOptions` adayları kullanıcıya gösterir. | [işlevsel erişim](tests/functional-access.test.ts), [Aşama 4 analiz](tests/phase4-analysis.test.ts) |

## Arayüz ve store

| Alan | Girdi → kaynak ve sembol → çıktı | Hedef test |
| --- | --- | --- |
| 3D, 2D A/B, üst plan, kamera | Çözülmüş model, viewport, görünüm → [WardrobeCanvas](src/canvas/scene/WardrobeCanvas.tsx), `OrthographicStudioView`, `SceneCameraAndSelectionTracker`, [frontViewFit](src/canvas/scene/frontViewFit.ts) `fitFrontView`, `applyFrontViewPose`, [WardrobeMeshGroup](src/canvas/wardrobe/WardrobeMeshGroup.tsx) → kamera kadrajı, sahne, seçim ve görünüm. [AnalysisOverlays](src/canvas/scene/AnalysisOverlays.tsx) erişim/engel yardımcıları. | [kamera](tests/front-view-fit.test.ts) ve 3D→A→B→plan tarayıcı testi |
| Hücre editörü, çoklu seçim ve ölçü | İşaretçi, klavye, hit-test/ID → [WardrobeCanvas](src/canvas/scene/WardrobeCanvas.tsx) kutu seçimi, [ContextualCellPopover](src/canvas/annotations/ContextualCellPopover.tsx), [SelectedCellDimensionOverlay](src/canvas/annotations/SelectedCellDimensionOverlay.tsx), [DimensionOverlay](src/canvas/annotations/DimensionOverlay.tsx), [FrontSystemEditor](src/ui/FrontSystemEditor.tsx) → bağlamsal seçim ve ölçü. Store `selectCell`, `setSelectedCells`, `setHoveredMarqueeCells`, `selectDoor`, `selectDrawer`, `commitResizeDraft`. | [UX düzenleme](tests/ux-editing.test.ts), [modüller](tests/remediation-modules.test.ts), büyük seçim tarayıcı testi |
| Yeşil A/B, dar ekran | Uç ankrajı ve ekran/toolbar sınırları → [RunEndAddBayOverlay](src/canvas/annotations/RunEndAddBayOverlay.tsx), [runEndControlFit](src/canvas/annotations/runEndControlFit.ts) `runEndControlsFit` → uçta veya toolbar’da erişilebilir ekleme, store `addBayAtRunEnd`. | [kontrol kadrajı](tests/run-end-control-fit.test.ts), dar ve geniş gerçek tıklama |
| İlk açılış, klavye ve dialog | Yeni/kayıtlı oturum ve kullanıcı girdisi → [App](src/App.tsx), [StudioDialog](src/ui/StudioDialog.tsx), [Phase4Panels](src/ui/Phase4Panels.tsx) `NumberField`, [editorFeedback](src/ui/editorFeedback.ts) `readNumberDraft`, `readBlankMeasurements`, `defaultShelfIntervalDraft` → ilk kullanım, geçersiz taslağın reddi, Escape iptali, odak dönüşü. | [UX düzenleme](tests/ux-editing.test.ts), ilk açılış/F5 ve klavye |
| Sunum ve ekran görüntüsü | Görünüm modu, kamera ve malzeme → [WardrobeCanvas](src/canvas/scene/WardrobeCanvas.tsx) `StudioEnvironmentController` ve Drei `ContactShadows`, [PresentationOcclusion](src/canvas/scene/PresentationOcclusion.tsx), [CanvasCapture](src/canvas/scene/CanvasCapture.tsx), [WardrobeItemsPreview](src/canvas/wardrobe/WardrobeItemsPreview.tsx) → sunum sahnesi, renk/derinlik/tel görüntüsü. | [kamera](tests/front-view-fit.test.ts), sentetik WebGL ve kaynak ömrü tarayıcı kontrolü |
| Kalıcı komut ve Undo/Redo | Kullanıcı mutasyonu → [useWardrobeStore](src/store/useWardrobeStore.ts) `applyCommand` Immer, normalizasyon, solve, geçmiş ve kayıt; `undo`, `undoSteps`, `redo`, `revertToCheckpoint`. | [oturum](tests/remediation-session.test.ts), [UX](tests/ux-editing.test.ts) |

## Kayıt, değişim ve üretim

| Alan | Girdi → kaynak ve sembol → çıktı | Hedef test |
| --- | --- | --- |
| Çalışma kopyası ve manuel kayıt | `Design` ve geçmiş → [useWardrobeStore](src/store/useWardrobeStore.ts) `saveCheckpoint`, `hydrateFromIndexedDB`, `saveCurrentStateToStorage`. IndexedDB `wardrobe-studio:session:v2`, eski `wardrobe-studio:active-design:v1`, localStorage `wardrobe-studio:session-sync:v2`. Zaman damgası ve revizyon yerel çalışmayı korur. | [oturum](tests/remediation-session.test.ts) |
| Adlandırılmış sürüm, arşiv ve A/B | Derin kopyalanan Design → [versionArchive](src/store/versionArchive.ts) `useVersionArchive`, `parseVersionArchive`; anahtar `wardrobe-studio:named-versions:v1` iki tarayıcı deposunda. [VersionPanel](src/ui/VersionPanel.tsx), [designExchange](src/core/versions/designExchange.ts) `designMetrics`, `designDimensions` → sürüm kayıt/ad/depo durumu, A çalışma kopyası, B seçili arşiv dahil karşılaştırma. | [sürümler](tests/phase5-versions.test.ts), [JSON](tests/security-json-compatibility.test.ts) |
| JSON ve harici AI metni | Tasarım metni → [designExchange](src/core/versions/designExchange.ts) `previewDesignJson`, `buildExternalAiPrompt`; store `importJsonString`, `exportJsonString` → önizleme, kullanıcı onaylı import veya yerel indirme/metin. | [sürümler](tests/phase5-versions.test.ts), [JSON](tests/security-json-compatibility.test.ts), [UX](tests/ux-editing.test.ts) |
| BOM, tanı ve parça ID | Design + ResolvedModel → [productionModel](src/core/production/productionModel.ts) `extractProduction`, `partCode`, `assertProductionReady`, [staticPreflight](src/core/production/staticPreflight.ts) `staticProductionIssues` → fiziksel parça, kesim ve malzeme, donanım, hata, erişim. [ProductionPanel](src/ui/ProductionPanel.tsx) ve [kullanıcı CSV/ZIP eylemi](src/export/manufacturingDownload.ts) aynı [uygunluk politikasını](src/core/production/fullExportPolicy.ts) kullanır. | [üretim](tests/phase5-production.test.ts), [erişim](tests/functional-access.test.ts), [indirme](tests/manufacturing-download.test.ts) |
| PDF/CSV/SVG/ZIP | ProductionPackage → [technicalSheets](src/core/production/technicalSheets.ts) `buildTechnicalSheets`, `sheetToSvg`, `buildPrintableReport`; [pdfWriter](src/export/pdfWriter.ts) `createProductionPdf`, `localPdfFont`; [csvExport](src/core/production/csvExport.ts) `buildCutListCsv`; [zipWriter](src/export/zipWriter.ts) `createTechnicalZip`; [download](src/export/download.ts) `downloadFile` → yerel A3 paftalar ve kesim paketi. | [üretim](tests/phase5-production.test.ts), [dosya regresyonu](tests/remediation-deliverables.test.ts), [fixture](scripts/phase5-fixtures.mjs) |

Şema, kalıcılık, CAD veya üretim değişince ilgili satırları, değişmezleri ve fixture kanıtını güncelleyin. Yeni dağıtım için yayın ve karar kayıtlarını güncelleyin. Bulgu kapanışına ortam, commit ve yeniden üretim kanıtı ekleyin.

---

## Tarihsel Aşama 3–5 haritası

Aşağıdaki özgün kayıt önceki aşamalara aittir. Eski satır referanslarını ve ortam yollarını tarihsel bağlamda okuyun.

> **Aşama 5 son durum:** Güncel davranış, doğrulama ve sınırlar `PHASE5_VERIFICATION.md` içindedir. Aşağıdaki ana harita tarihsel Aşama 3 devir kaydıdır; Aşama 4 ergonomi/envanter/engel/şablonları da korunur. Güncel ek dosyalar ve veri akışı aşağıdadır.

## Aşama 5 kaynak haritası

| Kaynak | Sorumluluk |
|---|---|
| `src/core/schema/types.ts`, `designSchema.ts` | İsteğe bağlı SlidingFrontConfig; üç ray; çözülen sürgü/rail tipi; mm ve kapsam doğrulaması; eski Design schemaVersion 1 korunur |
| `src/core/solver/slidingSolver.ts` | Bağımsız Front açıklığı, tamsayı kanat dağıtımı, bindirme, ray ve yan payları, fiziksel kanat/kapak paneli ve kapsama ilişkileri |
| `src/core/fronts/frontCommands.ts` | Otomatik cepheyi özelleştirme, sistem değişimi, alt/üst bağımsız aralık; Immer/Undo komutları |
| `src/core/analysis/kinematics.ts` | Kapak/çekmece/sürgü panel ve altı kulp stili hacimleri; ortak plan süpürme kaynağı |
| `src/core/analysis/motionConstraints.ts` | Sürekli doğrusal SAT, döner sagitta sınırı, başlangıç kesişmesi, düşey aralık ve gerçek açık hücre kapsamı |
| `src/core/analysis/motionSimulator.ts` | React'ten bağımsız geçici spring/drag pozları, tek hareket sınırı, kapak/çekmece sıralaması |
| `src/canvas/scene/MotionController.tsx` | Kare başında simülasyon; kırmızı durma çerçevesi, Türkçe neden ve dekoratif ray zarfları; NOOP_RAYCAST |
| `src/canvas/wardrobe/SlidingLeafInteraction.tsx` | Kameraya bağlı ray düzleminde pointer capture/sürükleme; editör ve çoklu seçimden ayrım; mevcut PBR/HandleMesh renderer adaptasyonu |
| `src/canvas/scene/CanvasCapture.tsx` | Kamera korunarak renkli/derinlik/tel PNG; yardımcıları geçici gizleme ve tüm render ayarlarını geri yükleme |
| `src/core/versions/designExchange.ts` | Tam JSON promptu, sınırlanmış doğrulama önizlemesi ve gerçek net A/B ölçütleri |
| `src/store/versionArchive.ts` | v2 oturumdan ayrı, derin kopyalı adlandırılmış sürümler; localStorage/IndexedDB, yeniden adlandırma/arşivleme/geri yükleme |
| `src/core/production/productionModel.ts` | Tek fiziksel BOM: malzeme/kalınlık, gerçek çekmece bileşenleri, ortak dikme, poligon kenarı/açısı, donanım, durum ve üretim kapısı |
| `src/core/production/technicalSheets.ts` | Kağıt mm çizim elemanları; cephe/plan/kesit/modül/poligon, tam sayfalı tablolar; SVG/yazdırılabilir HTML |
| `src/core/production/csvExport.ts` | Tam liste UTF-8 BOM CSV; metin kaçışı/formül etkisizleştirme |
| `src/export/pdfWriter.ts`, `zipWriter.ts`, `download.ts` | Dinamik jsPDF+yerel Türkçe font; fflate SVG/CSV/JSON paketi; Blob indirmeleri |
| `src/ui/FrontSystemEditor.tsx`, `VersionPanel.tsx`, `ProductionPanel.tsx` | Mevcut üç adımlı stüdyoya entegre kapak/sürüm/AI/üretim kontrolleri ve geniş pafta önizlemesi |
| `src/core/presets/phase5Examples.ts` | Dört bağımsız üretim/QA örneği; aktif kullanıcı tasarımına otomatik yüklenmez |
| `scripts/phase5-{fixtures,motion-check}.mjs`, `phase5-pdf-qa.py` | Aynı core/export fonksiyonlarıyla gerçek dosya üretimi, fiziksel örnek kontrolü, PDF yeniden açma ve Poppler render incelemesi |

### Güncel veri sınırları

`Design → solveDesign → ResolvedModel → extractProduction → TechnicalSheet / CSV / PDF / ZIP`.

`Design` içine çözülen konum, BOM veya geçici açık kapak pozları yazılmaz. Niyet/kesim uzunlukları tamsayı mm; tek kalınlıktaki merkezler yarım mm, döner yüzeyler trigonometrik mm koordinatı taşıyabilir. Metreye dönüşüm 3D canvas içinde kalır. Beşgen `outerFrontSpanMm` dış Pisagor uzunluğu; `frontOpeningWidthMm` dikmeler sonrası net açıklıktır.

`useWardrobeStore.openNamedVersion` bir Undo komutudur; checkpoint korunur. İsimli arşiv anahtarı `wardrobe-studio:named-versions:v1`, mevcut oturum `wardrobe-studio:session:v2` / `session-sync:v2` anahtarlarından ayrıdır. Sürgü hareketi imperative simülatörde saklanır; UI'ya yalnız bildirim/drag bitişi yansır.

Üretim `drawerBox` görsel zarfını dışlar; organizatörleri dışlamaz. Cam/ayna montajı ham cam kesimi olarak gösterilmez. `assertProductionReady` kritik geometri hatasında PDF/CSV/ZIP üretimini engeller; tanı amaçlı önizleme hata durumunu taşır.

> **Belge Kapsamı:** Bu belge, `C:\dev\Wardrobe-Studio` içindeki tüm kaynak dosyaların sorumluluklarını, veri yapılarını, parametrik çözücü matematiğini, 3D sahne ve raycast mimarisini, Zustand durum yönetimini, somut veri akışlarını ve **Aşama 4 / Aşama 5** için önerilen entegrasyon noktalarını ayrıntılı olarak açıklar.

---

## 1. Dizin Yapısı ve Dosya Sorumlulukları

### 1.1. Tam Proje Ağacı (`C:\dev\Wardrobe-Studio`)

```text
C:\dev\Wardrobe-Studio\
├── index.html                                      # HTML giriş noktası (Türkçe başlık, root div)
├── package.json                                    # Bağımlılıklar ve npm betikleri (dev, build, test)
├── tsconfig.json                                   # TypeScript 5.8 sıkı (strict) derleyici ayarları
├── vite.config.ts                                  # Vite 6 + React + Tailwind v4 + Vitest yapılandırması
├── wardrobe_studio_master_plan.md                  # Onaylanmış 5 aşamalı ana proje planı (Salt-Okunur Referans)
├── wardrobe_studio_additional_requirements.md      # Kullanıcı ek gereksinimleri A–Z (Salt-Okunur Referans)
├── implementation_plan_gemini.md                   # İlk mimari araştırma belgesi (Tarihsel Referans)
├── bagimsiz_arastirma_ve_plan_claude.md            # İkinci mimari araştırma belgesi (Tarihsel Referans)
├── gemini_review_of_claude.md                      # Çapraz teknik değerlendirme (Tarihsel Referans)
├── claude_final_audit_of_gemini_review.md          # Nihai mimari denetim (Tarihsel Referans)
├── AGENTS.md                                       # Codex için hızlı başlangıç ve çalışma kuralları
├── PROJECT_HANDOFF.md                              # Kapsamlı proje geçmişi ve aşama devir belgesi
├── CODEBASE_MAP.md                                 # Bu belge: Teknik mimari ve kaynak kod haritası
├── HANDOFF_VERIFICATION.md                         # Test, derleme ve özellik doğrulama raporu
├── src\
│   ├── main.tsx                                    # React 19 DOM kök bağlayıcısı
│   ├── App.tsx                                     # Ana stüdyo kabuğu: Üst bar, Sol panel, Orta 3D/2D sahne, Sağ denetçi
│   ├── index.css                                   # Tailwind CSS v4 (@import "tailwindcss";) ve özel kaydırma çubuğu stilleri
│   ├── vite-env.d.ts                               # Vite istemci tip bildirimleri
│   ├── core\
│   │   ├── schema\
│   │   │   ├── types.ts                            # Tüm kalıcı (Design) ve türetilmiş (ResolvedModel) TypeScript tipleri
│   │   │   └── designSchema.ts                     # Zod doğrulama şemaları ve normalizeAndValidateDesign()
│   │   ├── solver\
│   │   │   ├── flexSolver.ts                       # distributeIntegerMm(): Tamsayı mm garantili sabit/esnek dağıtıcı
│   │   │   ├── cornerSolver.ts                     # solveCornerJunction(): Beşgen (diagonal) ve Kör (blind) köşe matematiği
│   │   │   ├── carcassSolver.ts                    # solveDesign(): Ana parametrik çözücü (Run -> Bay -> SplitNode -> Panel/Door/Drawer)
│   │   │   └── treeMutator.ts                      # SplitNode ağaç mutasyonları, çoklu seçim analizi, yönlü boyutlandırma
│   │   ├── inserts\
│   │   │   └── insertRegistry.ts                   # 8 iç modül tanımı, servis eşyaları ve resolveServiceItemPlacement()
│   │   └── presets\
│   │       └── sampleDesigns.ts                    # 3 hazır şablon (SAMPLE_DESIGNS) ve createBlankDesign() sihirbazı
│   ├── store\
│   │   └── useWardrobeStore.ts                     # Zustand + Immer store, Undo/Redo, Checkpoint, localStorage + IndexedDB
│   └── canvas\
│       ├── materials\
│       │   └── materialRegistry.ts                 # 6 PBR malzeme, prosedürel dokular, Studio IBL, kulp/LED/dış cephe meta verileri
│       ├── scene\
│       │   └── WardrobeCanvas.tsx                  # R3F Canvas, 3D/2D kameralar, Marquee seçimi, ışıklar, üst sahne araç çubuğu
│       ├── wardrobe\
│       │   ├── WardrobeMeshGroup.tsx               # Gövde panelleri, beşgen köşe, hücre vurgu/tıklama, kapak/çekmece animasyonu, LED
│       │   ├── HandleMesh3D.tsx                    # Prosedürel 3D kulp geometrileri (4 stil × 4 metal kaplama × 4 boyut)
│       │   └── WardrobeItemsPreview.tsx            # Hücre sınırlarına (clamp) duyarlı 3D giysi, kutu, ayakkabı, hurç ve servis eşyaları
│       └── annotations\
│           ├── ContextualCellPopover.tsx           # Seçili hücre/grup/çekmece/kapak için akıllı konumlanan sağ üst yüzen düzenleyici
│           ├── DimensionOverlay.tsx                # 3D/2D genel ölçü çizgileri ve tıklanabilir doğrudan mm girdi kutuları
│           ├── SelectedCellDimensionOverlay.tsx    # Seçili hücre/grup/çekmece/kapak üzerinde X/Y/Z eksen etiketleri ve yönlü boyutlandırma
│           └── RunEndAddBayOverlay.tsx             # A ve B kolu uçlarında 3D "+ Bölme Ekle" açılır penceresi
└── tests\
    └── solver.test.ts                              # 37 kapsamlı Vitest birim testi (Aşama 1, 2, 2.1, 2.2, 2.3, 2.4 ve 3)
```

### 1.2. Katmanlar Arası Bağımlılık Kuralları
- **`src/core/` (Saf Parametrik Çekirdek):** Hiçbir React, Three.js veya DOM bağımlılığı içermez (`zod` hariç). Node.js / Vitest ortamında doğrudan milisaniyeler içinde çalışır.
- **`src/store/useWardrobeStore.ts` (Durum ve Komut Katmanı):** `src/core/` fonksiyonlarını çağırır; her tasarım değişikliğinde `produce(currentDesign, mutator)` ile yeni `Design` üretir ve anında `solveDesign(nextDesign)` çağırarak `resolved: ResolvedModel` durumunu günceller.
- **`src/canvas/` (3D/2D R3F Görselleştirme Katmanı):** `useWardrobeStore` içinden `design` ve `resolved` verilerini okur; kullanıcı etkileşimlerini (`selectCell`, `toggleDoor`, `startOrUpdateResizeDraft` vb.) store aksiyonlarına iletir.
- **`src/App.tsx` (Ana Kullanıcı Arayüzü):** Üst kontrol çubuğunu, sol yapı/malzeme/aydınlatma panelini, orta `WardrobeCanvas` alanını ve sağ seçili öğe/uyarı denetçisini birleştirir.

---

## 2. Veri Modeli ve Şema Mimarisi (`src/core/schema/types.ts` & `designSchema.ts`)

### 2.1. Kalıcı Tasarım Modeli (`Design`)
[`src/core/schema/types.ts`](file:///C:/dev/Wardrobe-Studio/src/core/schema/types.ts) içindeki ana kalıcı veri yapısı:

- **`Design`:**
  - `schemaVersion: 1`
  - `id: string`, `name: string`
  - `layoutKind: 'l-shape' | 'straight'`
  - `roomHeightMm: number` (`1800..3200`)
  - `panelThicknessMm?: number` (`16 | 18 | 22 | 25`, varsayılan `18`)
  - `backPanelThicknessMm?: number` (`6 | 8 | 10 | 18`, varsayılan `8`)
  - `runs: Run[]`: Duvar kolları (`wallAxis: 'A' | 'B'`, `lengthMm`, `depthMm`, `heightMm`, `plinthHeightMm`, `topFillerHeightMm`, `startFillerMm`, `endFillerMm`, `panelThicknessMm`, `backPanelThicknessMm`, `bays: Bay[]`).
  - `junctions: CornerJunction[]`: L-köşe tanımı (`type: 'diagonal' | 'blind'`, `priorityRunId`, `fillerWidthMm`, `diagonalArmAMm`, `diagonalArmBMm`, `shelvesCount`, `intervalHeightsMm?: number[]`, `hasHangingRod`, `doorMode?: 'left' | 'right' | 'open'`).
  - `fronts: Front[]`: Özel kapak tanımları (`id`, `bayId`, `coveredBayIds?: string[]`, `type: 'hinged' | 'sliding' | 'flapUp'`, `hingeSide`, `hingeAngleDeg`, `yStartMm`, `yEndMm`, `trackIndex?: 0 | 1`, `slideOffsetMm?: number`, `materialId?: MaterialId`, `handle?: HandleConfig`).
  - `materials: MaterialPalette`: Genel `carcassMaterialId` ve `frontMaterialId` (`'warmOak' | 'naturalWalnut' | 'matteWhite' | 'linenBeige' | 'softAnthracite' | 'smokedGlass'`).
  - `defaultDoorHandle?: HandleConfig`, `defaultDrawerHandle?: HandleConfig`: Genel kulp ayarları (`style: 'verticalBar' | 'horizontalBar' | 'roundKnob' | 'recessedProfile'`, `finish: 'matteBlack' | 'brushedBrass' | 'satinChrome' | 'anthracite'`, `lengthMm: 96 | 160 | 320 | 480`).
  - `ledLighting?: LedLightingConfig`: `enabled: boolean`, `colorTemp: LedColorTempId`, `intensity: number`.
  - `exteriorFinish?: ExteriorFinishConfig`: `preset`, `plinthColorHex`, `fillerColorHex`, `wallColorHex`.
  - `interiorItems?: InteriorItemsConfig`: `enabled: boolean`.

- **`Bay` (Dikey Gövde Bölmesi):**
  - `id`, `label`, `width: SizeSpec` (`{ kind: 'fixed', mm }` veya `{ kind: 'flex', weight, minMm?, maxMm? }`), `locked: boolean`, `owner: 'anne' | 'baba' | 'ortak'`.
  - `autoFront: boolean`, `frontMode?: 'auto' | 'singleLeft' | 'singleRight' | 'double' | 'open'`, `hingeAngleDeg?: 110 | 155 | 165`.
  - `frontMaterialId?: MaterialId`, `doorMaterialId?: MaterialId`, `doorHandle?: HandleConfig`.
  - `root: SplitNode`: Bölmenin özyinelemeli iç hücre ağacı.

- **`SplitNode` (Özyinelemeli İç Hücre Ağacı):**
  - **`kind: 'leaf'`:** Yaprak hücre (`id`, `label`, `owner`, `insert: InsertConfig | null`).
  - **`kind: 'split'`:** Bölünmüş düğüm (`id`, `direction: 'horizontal' | 'vertical'`, `dividerThicknessMm`, `children: SplitChild[]`).
    - **Önemli Semantik Kural:** `direction: 'horizontal'` **yatay bir raf/tabla ile alt-üst bölünmeyi** (çocukların Y ekseninde alttan üste dizilmesini) ifade eder. `direction: 'vertical'` **dikey bir ara dikme ile sol-sağ bölünmeyi** (çocukların X ekseninde soldan sağa dizilmesini) ifade eder.

- **`InsertConfig` (İç Modül Yapılandırması):**
  - `type: 'shelfStack' | 'hangingRod' | 'doubleHanging' | 'drawerBank' | 'shoeRack' | 'serviceNiche' | 'beddingYukluk' | 'empty'`
  - Modüle özgü alanlar: `shelfCount`, `adjustable`, `rodHeightType` (`'short' | 'medium' | 'long'`), `drawerCount`, `drawerFrontHeightsMm`, `isInternalDrawer`, `drawerFrontMaterialId` / `frontMaterialId`, `drawerHandle`, `shoeTiers`, `serviceItems`, `handClearanceMm`, `itemPreset` (`InteriorItemPreset`), `itemCountOverride`.

### 2.2. Türetilmiş Çözülmüş Model (`ResolvedModel`)
`solveDesign(design)` tarafından her seferinde sıfırdan hesaplanan çıktı:
- `panelThicknessMm`, `backPanelThicknessMm`
- `bays: ResolvedBay[]`: Her bölmenin kol üzerindeki başlangıç ofseti (`startOffsetMm`), dış genişliği (`outerWidthMm`), net iç genişliği (`netInnerWidthMm`), net yüksekliği, net derinliği ve 3D dünya merkezi (`worldCenterMm`).
- `cells: ResolvedCell[]`: 3D sahnede seçilebilir ve düzenlenebilir her bir iç hacim veya raf/askı/köşe alt aralığı (`::sub-k`, `::corner-sub-k`). İçinde `netWidthMm`, `netHeightMm`, `netDepthMm`, `yStartMm`, `yEndMm`, `worldCenterMm`, `worldSizeMm`, `coveringDoorIds`, `sourceLeafId`, `subIntervalIndex`, `subIntervalCount`, `subIntervalKind` bulunur.
- `panels: ResolvedPanel[]`: Marangoz kesim listesine ve 3D sahneye giden tüm ahşap parçalar (`kind: 'side' | 'divider' | 'top' | 'bottom' | 'shelf' | 'back' | 'plinth' | 'filler' | 'drawerFront' | 'drawerBox' | 'door' | 'cornerPanel'`).
- `doors: ResolvedDoorLeaf[]`: Menteşe pivot noktası (`pivotWorldMm`), açılma açısı (`openAngleRad`), kulp ofseti (`handleOffsetMm`), malzeme kimliği (`materialId`), kulp yapılandırması (`handle`) ve örttüğü bölme/alan bilgileriyle çözülmüş kapak kanatları.
- `drawers: ResolvedDrawerUnit[]`: Ön kapak ve 5 parçalı kasa ölçüleri (`frontWidthMm`, `frontHeightMm`, `boxOuterWidthMm`, `boxSideDepthMm`, `boxSideHeightMm`, `sideThicknessMm`, `bottomWidthMm`, `bottomDepthMm`, `bottomThicknessMm`, `backWidthMm`, `backHeightMm`), ray açılma mesafesi (`slideDistanceMm`), `coveringDoorIds`, `materialId` ve `handle`.
- `corner: ResolvedCorner | null`: Çözülmüş beşgen veya kör köşe geometrisi (`outlinePointsMm`, `consumedRunAMm`, `consumedRunBMm`, `diagonalDoorWidthMm`).
- `dimensions: DimensionAnnotation[]`: 3D/2D ölçü çizgileri ve tıklanabilir düzenleme hedefleri (`editTarget`).
- `warnings: ValidationWarning[]`: Marangoz üretim, ergonomi ve çakışma uyarıları (`severity: 'error' | 'warning' | 'info'`).

### 2.3. Zod Şema Doğrulaması (`src/core/schema/designSchema.ts`)
- [`normalizeAndValidateDesign(raw: unknown): Design`](file:///C:/dev/Wardrobe-Studio/src/core/schema/designSchema.ts#L194-L196): JSON içe aktarımında (`importJsonString`) ve `localStorage`/`IndexedDB` oturum yüklemesinde tüm veriyi doğrular. Eksik olan Aşama 2.4 / Aşama 3 alanlarını (`panelThicknessMm`, `backPanelThicknessMm`, `defaultDoorHandle`, `defaultDrawerHandle`, `ledLighting`, `exteriorFinish`, `interiorItems`) güvenli varsayılanlarla tamamlar.

---

## 3. Parametrik Çözücü ve Matematiksel Motor (`src/core/solver/` & `inserts/`)

### 3.1. `flexSolver.ts` — Tamsayı Milimetre Dağıtıcısı
- [`distributeIntegerMm(totalSpanMm, items, dividerThicknessMm)`](file:///C:/dev/Wardrobe-Studio/src/core/solver/flexSolver.ts#L24-L160):
  1. Toplam alandan ara bölücü kalınlıklarını (`(count - 1) * dividerThicknessMm`) düşer.
  2. `fixed` öğelerin milimetre değerlerini ayırır.
  3. Kalan net alanı `flex` öğeler arasında `weight` ve `minMm`/`maxMm` sınırlarına göre iteratif olarak dağıtır.
  4. `Math.round` kaynaklı `±1..2 mm` farkı (`remainderMm`) son serbest esnek öğeye (veya hiç esnek öğe yoksa son kilitsiz sabit öğeye) ekleyerek `sum(resolvedMm) + totalDividersMm === totalSpanMm` eşitliğini **%100 garanti eder**.

### 3.2. `cornerSolver.ts` — L-Köşe Geometrisi Çözücüsü
- [`solveCornerJunction(junction, runA, runB)`](file:///C:/dev/Wardrobe-Studio/src/core/solver/cornerSolver.ts#L19-L263):
  - **Beşgen Köşe (`diagonal`):**
    - A kolundan `diagonalArmAMm` (örn. `900 mm`), B kolundan `diagonalArmBMm` (örn. `900 mm`) tüketir.
    - 5 köşeli taban/tavan/raf poligonunu (`outlinePointsMm`) saat yönünde üretir: `[0,0] -> [armA, 0] -> [armA, depthA] -> [depthB, armB] -> [0, armB]`.
    - Asimetrik derinlikli diyagonal kapak açıklığını $\sqrt{(\text{armA} - D_B)^2 + (\text{armB} - D_A)^2}$ formülüyle hesaplar; net kapak açıklığı `< 380 mm` ise uyarı (`CORNER_DOOR_NARROW`) üretir.
    - Beşgen köşe açılır kapağını (`door-corner-${junction.id}`) ve `45°` (`-Math.PI / 4`) diyagonal menteşe eksenini oluşturur.
  - **Kör Köşe (`blind`):**
    - Öncelikli kol (`priorityRunId === 'run-A'`) köşeye kadar tam uzanır (`consumedRunAMm = 0`).
    - Yanaşan kol (`run-B`), öncelikli kolun derinliği + kör köşe klapası kadar geriden başlar (`consumedRunBMm = runA.depthMm + fillerWidthMm`).
    - `fillerWidthMm < 45 mm` ise çekmece/kapak कपाk kulpu çakışma hatası (`BLIND_FILLER_TOO_SMALL`) üretir.

### 3.3. `carcassSolver.ts` — Ana Parametrik Gövde Çözücüsü
- [`solveDesign(design: Design): ResolvedModel`](file:///C:/dev/Wardrobe-Studio/src/core/solver/carcassSolver.ts#L569-L779):
  - **Adım 1:** L-şekilli tasarımda `solveCornerJunction` çalıştırılır; beşgen köşe ise her köşe raf aralığı için `${junction.id}::corner-sub-${idx}` kimlikli bağımsız `ResolvedCell` nesneleri üretilir (`junction.intervalHeightsMm` varsa özel yükseklikler, yoksa eşit dağılım kullanılır).
  - **Adım 2:** Her duvar kolu (`solveSingleRun`) için köşe tüketimi ve başlangıç/bitiş klapaları (`startFillerMm`, `endFillerMm`) düşülerek `availableForBaysMm` bulunur.
  - **Adım 3 (Paylaşımlı Dikmeler):** `N` bölme için `N + 1` adet dikey panel (`divider`) üretilir. İlk ve son bölme dış dikmelerden `t` (`panelThicknessMm`), iç dikmelerden `t / 2` pay alır; böylece `outerWidthMm` toplamı kol uzunluğunu tam tutarken her bölmenin `netInnerWidthMm` değeri gerçek marangoz ölçüsüne eşit olur.
  - **Adım 4 (`solveSplitTree` & Alt Aralık Üretimi):** Her bölmenin `root: SplitNode` ağacı alttan üste (`horizontal`) ve soldan sağa (`vertical`) çözülür.
    - Eğer bir yaprak hücrede çok katlı raf (`shelfStack`), ayakkabılık (`shoeRack`), yüklük (`beddingYukluk`, `shelfCount > 0`) veya çift kat askı (`doubleHanging`) varsa, `carcassSolver` bu yaprağı otomatik olarak `${leaf.id}::sub-0`, `${leaf.id}::sub-1`, ... şeklinde **bağımsız seçilebilir alt hücrelere (`ResolvedCell`)** ayırır.
  - **Adım 5 (Kapak Üretimi ve `coveringDoorIds` Eşlemesi):**
    - Bölme için `design.fronts` içinde özel kapak(lar) tanımlıysa (yatay bölünmüş üst/alt kapaklar veya çoklu bölme kaplayan kapaklar) onlar üretilir; yoksa `bay.frontMode` (`auto`, `singleLeft`, `singleRight`, `double`, `open`) kullanılır.
    - Her kapak kanadı (`ResolvedDoorLeaf`), dikeyde (`yStartMm..yEndMm`) ve yatayda (`coveredBayIds`) örttüğü tüm iç hücrelerin ve çekmecelerin `coveringDoorIds` dizisine kaydedilir.
  - **Adım 6 (5 Parçalı Çekmece Kasası ve Menteşe Klapa Payı):**
    - `drawerBank` içeren hücrelerde her çekmece için `ResolvedDrawerUnit` üretilir.
    - Önünde menteşeli kapak varsa (`isCoveredByHingedDoor`), menteşe çakışmasını önlemek için `30 mm` iç klapa payı (`hingeClearanceFillerMm = 30`) düşülür.
    - Her çekmecenin 5 ahşap parçası (`drawerFront`, `2× yan parça`, `arka parça`, `alt tabla`) parametrik kalınlıklarla (`t` ve `tb`) hesaplanır ve `panels` dizisine eklenir.

### 3.4. `treeMutator.ts` — Hücre Ağacı Mutasyonları, Grup Analizi ve Yönlü Boyutlandırma
[`src/core/solver/treeMutator.ts`](file:///C:/dev/Wardrobe-Studio/src/core/solver/treeMutator.ts) içindeki kritik fonksiyonlar:
- `realizeSubIntervalInDesign(draft, targetCellId)`: `${leafId}::sub-${k}` sanal alt aralığını gerçek bir yatay `SplitNode` düğümüne dönüştürür.
- `realizeLeafWithExactSolvedHeights(draft, leafId, resolvedCells)`: Bir yaprağın alt aralıklarını mevcut çözülmüş milimetre yüksekliklerini (`fixed` mm) birebir koruyarak gerçek `SplitNode` çocuklarına dönüştürür (diğer rafların `1 mm` bile kaymasını önler).
- `analyzeSelectedCellsGroup(selectedCellIds, resolved)`: Seçili hücre kümesinin tekil mi, dikey bitişik yığın mı (`isContiguousVertical`), yatay bitişik sıra mı (`isContiguousHorizontal`), çoklu raf grubu mu (`shelfGroups`, `isMultiShelfGroupSelection`, `canMergeShelfGroups`) olduğunu ve brüt/net ölçülerini hesaplar.
- `setContiguousGroupIntervalCountInDesign` & `equalizeContiguousCellsInDesign`: Seçili raf grubunun (veya çoklu raf gruplarının her birinin kendi içinde) raf aralığı sayısını değiştirir / yüksekliklerini eşitler.
- `mergeAndResplitSelectedGroupsInDesign`: Aynı bölmede dikey bitişik olan birden fazla raf grubunu tek bir hacimde birleştirip `N` eşit aralığa böler.
- `buildResizeDraftState` & `commitDirectionalResizeInDesign`: `X` (`left`/`right`), `Y` (`up`/`down`) ve `Z` (`front`/`back`) eksenlerinde yönlü boyutlandırma taslağı (`ResizeDraftState`) oluşturur; sabit ve hareketli sınırları belirler; komşu hücreyle olan çakışmayı (`conflictOverlapMm`) hesaplar ve onaylandığında (`commitResizeDraft`) hem hedef grubu orantılı ölçekler hem de komşu bölmeyi tek atomik adımda günceller.

---

## 4. 3D Sahne, Etkileşim ve Görselleştirme Katmanı (`src/canvas/`)

### 4.1. `WardrobeCanvas.tsx` — Sahne Yöneticisi ve Marquee Seçimi
- **Kamera Yönetimi (`SceneCameraAndSelectionTracker`):**
  - `viewMode === '3d-perspective'` iken `PerspectiveCamera` + `OrbitControls` çalışır ve her karede kamera konumu/hedefi `saved3DCameraStateRef` içine kaydedilir. `2D Cephe A`, `2D Cephe B` veya `2D Üst Plan` (`OrthographicCamera`) görünümlerine geçip tekrar `3D Perspektif`'e dönüldüğünde kullanıcının bıraktığı açı aynen geri yüklenir.
  - Ayrıca seçili hücre/çekmece/kapak grubunun 3D köşelerini ekran piksellerine (`SelectionScreenBounds`) izdüşürerek `ContextualCellPopover` bileşeninin seçili bölmenin üstünü kapatmamasını sağlar.
- **Dikdörtgen Çerçeve (`Marquee`) ile Çoklu Seçim:**
  - `Çoklu Seçim Aracı` (`multiSelectToolActive`) açıkken veya `Shift` tuşu basılıyken ya da zaten seçili bir hücrenin üzerinden sürükleme başlatıldığında `doesCellIntersectScreenRect` çalışır; çerçeve içine giren görünür hücreler canlı olarak `hoveredMarqueeCellIds` ile vurgulanır ve fare bırakıldığında `setSelectedCells` ile seçilir.

### 4.2. `WardrobeMeshGroup.tsx` — 3D Geometri, Raycast Önceliği ve Kinematik Animasyonlar
- **`NOOP_RAYCAST` Güvenliği:** Dosya başında `const NOOP_RAYCAST: THREE.Object3D['raycast'] = () => {};` tanımlıdır. Tüm vurgu kutuları, tel kafesler, LED şeritler, kıyafet önizlemeleri ve çakışma önizleme kutuları `raycast={NOOP_RAYCAST}` kullanır.
- **Hücre Tıklama ve Kapak Önceliği:**
  - `DoorLeafAnimated` bileşeninde kapaklara tıklandığında `e.stopPropagation()` çağrılır:
    - Eğer `doorEditorMode === true` ise kapak seçilir (`onSelectDoor`).
    - Aksi halde kapak açılır/kapanır (`onToggle`).
  - Böylece `Normal` görünümde kapalı bir kapağa tıklandığında ışın (raycast) kapağın arkasındaki iç hücreye geçmez.
- **Kinematik Kapak ve Çekmece Sönümlemesi (`useFrame`):**
  - `DoorLeafAnimated`: `pivotGroupRef.current.rotation.y = THREE.MathUtils.damp(current, targetAngle, 9, delta)` ile menteşe ekseninde (`pivotWorldMm`) pürüzsüz açılır/kapanır. Beşgen köşe kapağında (`isCornerDoor`) grup `-Math.PI / 4` döndürülerek diyagonal ön cepheye hizalanır.
  - `DrawerUnitAnimated`: `slideGroupRef.current.position.x/z = THREE.MathUtils.damp(...)` ile ray boyunca dışarı kayar. Tıklandığında çekmeceyi seçer (`onSelectDrawer`) ve aynı zamanda açıp kapatır (`onToggle`).

### 4.3. `materialRegistry.ts`, `HandleMesh3D.tsx` ve `WardrobeItemsPreview.tsx`
- **`materialRegistry.ts`:**
  - `MATERIAL_REGISTRY`: 6 PBR malzeme tanımı. `getOrCreatePbrMaterial(materialId, renderQualityMode)` prosedürel `CanvasTexture` (ahşap damarları ve keten dokusu) üretir ve `materialCache` içinde saklar.
  - `getOrCreateStudioEnvMap()`: Sunum ve düzenleme modlarında metal kulplar, cam yüzeyler ve lake kapaklar üzerinde gerçekçi yansıma oluşturan equirectangular stüdyo ortam haritası.
- **`HandleMesh3D.tsx`:**
  - `DoorLeafAnimated` ve `DrawerUnitAnimated` içinden çağrılır; seçili kulp stiline (`verticalBar`, `horizontalBar`, `roundKnob`, `recessedProfile`), metal kaplamaya ve boyuta (`96/160/320/480 mm`) göre 3D kulp ayaklarını ve gövdesini oluşturur.
- **`WardrobeItemsPreview.tsx`:**
  - `resolved.cells` dizisini tarar; `cell.insert.itemPreset` (`'auto'` veya kullanıcı seçimi) ve `itemCountOverride` değerlerine göre askıda gömlek/ceket/elbise/pantolon, katlı kazak yığınları, saklama kutuları, yorgan/yastık/valiz/hurç, ayakkabı çiftleri ve servis eşyalarını (`resolveServiceItemPlacement` ile) hücrenin `netWidthMm × netHeightMm × netDepthMm` sınırları içinde (`clamp`) 3D olarak çizer.

---

## 5. Durum Yönetimi, Geçmiş ve Kalıcılık (`src/store/useWardrobeStore.ts`)

- **Merkezi Komut Yürütücüsü (`applyCommand(label, mutator)`):**
  - Tüm tasarım değişiklikleri bu fonksiyon üzerinden geçer.
  - `produce(currentDesign, mutator)` ile değişmez (`immutable`) yeni `Design` üretilir.
  - `solveDesign(nextDesign)` ile yeni `ResolvedModel` hesaplanır.
  - Önceki tasarım `historyPast` dizisine (maksimum `40` adım) açıklamasıyla (`label`) eklenir; `historyFuture` temizlenir.
  - Silinmiş hücre/çekmece/kapak kimlikleri aktif seçim dizilerinden (`selectedCellIds`, `selectedDrawerIds`, `selectedDoorIds`) otomatik temizlenir.
  - `saveCurrentStateToStorage` çağrılarak hem **senkron `localStorage`** (`wardrobe-studio:session-sync:v2`) hem de **asenkron `IndexedDB`** (`wardrobe-studio:session:v2`) anında güncellenir.
- **Manuel Kayıt Noktası (`saveCheckpoint` & `revertToCheckpoint`):**
  - Kullanıcı üst bardaki `Kaydet` butonuna bastığında mevcut `design`, `checkpointDesign` olarak sabitlenir (`hasUnsavedChanges = false`).
  - Kullanıcı `Son Kayda Dön` butonuna bastığında tüm ara denemeler geri alınarak `checkpointDesign` durumuna dönülür.

---

## 6. Somut Veri Akışı Senaryoları (A–F)

### Senaryo A: Kullanıcı Duvar Kolu Ölçüsünü Değiştirdiğinde
1. Kullanıcı sol panelden veya 3D sahnedeki `DimensionOverlay` etiketine tıklayarak A Kolu uzunluğunu `2800 mm` → `3100 mm` yapar.
2. `useWardrobeStore.updateRunDimension('run-A', 'lengthMm', 3100)` çağrılır.
3. `applyCommand` içinde `runA.lengthMm = 3100` güncellenir ve `solveDesign(nextDesign)` çalışır.
4. `carcassSolver` köşe payını (`900 mm`) ve klapaları düşer; kalan alanı `distributeIntegerMm` ile sabit (`locked`) bölmeleri koruyup esnek (`flex`) bölmelere dağıtır.
5. Tüm paneller, kapaklar ve 3D sahne anında yeni ölçülere göre yeniden çizilir; değişiklik `localStorage` + `IndexedDB`'ye kaydedilir.

### Senaryo B: Kullanıcı 3D Sahnede Bir Raf Aralığına Tıkladığında
1. Kullanıcı B1 bölmesindeki 2. raf aralığına (`cell-b1-shelves::sub-1`) tıklar (`WardrobeMeshGroup.tsx`).
2. Eğer önünde kapalı bir kapak varsa ve görünüm `Normal` ise kapak tıklamayı yakalar ve açılır. Kapak açıksa veya `X-Ray`/`Gizli` moddaysa tıklama doğrudan `cell-b1-shelves::sub-1` hücresine ulaşır.
3. `useWardrobeStore.selectCell('cell-b1-shelves::sub-1', 'bay-B1', e.shiftKey)` çalışır.
4. Sahnede yalnızca o raf aralığının etrafında kehribar tel kafes vurgu ve `SelectedCellDimensionOverlay` (`X / Y / Z` ölçü etiketleri) belirir; sağ üstte `ContextualCellPopover` açılır.

### Senaryo C: Kullanıcı Çoklu Seçim Yapıp Raf Sayısını Değiştirdiğinde
1. Kullanıcı `Shift+Tık` veya `Çoklu Seçim` çerçevesi ile bir raf grubundaki aralıkları seçer (`selectedCellIds`).
2. `ContextualCellPopover` içinde `analyzeSelectedCellsGroup(selectedCellIds, resolved)` çalışır; toplam brüt yüksekliği ve mevcut aralık sayısını gösterir.
3. Kullanıcı `5 Eşit Bölme` butonuna tıklar → `useWardrobeStore.setContiguousGroupIntervalCount(5)` → `treeMutator.setContiguousGroupIntervalCountInDesign` çalışır.
4. Seçili grubun toplam brüt yüksekliği sabit tutularak içinden `4 × panelThicknessMm` ara raf kalınlığı düşülür ve kalan net yükseklik `distributeIntegerMm` ile 5 eşit aralığa dağıtılır. Komşu bölmeler `1 mm` bile kaymaz.

### Senaryo D: Kullanıcı Yönlü Boyutlandırma Yapıp Komşu Çakışmasını Çözdüğünde
1. Kullanıcı seçili hücrenin mavi `Y` yüksekliğine tıklar (`SelectedCellDimensionOverlay.tsx`), yön olarak `Yukarı (Alt Sabit)` seçer ve `700 mm` girer.
2. `startOrUpdateResizeDraft('Y', 'up', 700)` → `buildResizeDraftState` çalışır.
3. Üstteki komşu hücre otomatik küçültülmez; `conflictOverlapMm` hesaplanır ve 3D sahnede kırmızı yarı saydam çakışma kutusu + sağ üst panelde sarı/kırmızı **Komşu Bölme Çakışma Çözümü** kartı gösterilir.
4. Kullanıcı `Komşuyu Otomatik Küçült` butonuna (`autoBalanceResizeDraftNeighbor`) ve ardından `Onayla ve Uygula` butonuna (`commitResizeDraft`) tıklar.
5. `commitDirectionalResizeInDesign` seçili hücreyi (veya grubu orantılı olarak) büyütür, üst komşuyu küçültür ve `ResizeDraftState` temizlenir.

### Senaryo E: Kullanıcı Bir Kapağın veya Çekmecenin Malzemesini ve Kulpunu Özelleştirdiğinde
1. Kullanıcı `Kapak Düzenle` modunda bir kapağa tıklar veya normal modda bir çekmeceye tıklar.
2. `ContextualCellPopover` içindeki **Kapak Malzemesi & 3D Kulp** (veya **Çekmece Ön Malzeme & 3D Kulp**) bölümünden `Füme Cam (Alüminyum Çerçeveli)` ve `Mat Siyah / 320 mm Dikey Bar` seçer.
3. `setDoorMaterialAndHandle` (veya `setDrawerMaterialAndHandle`) çalışır; `carcassSolver` ilgili kapak/çekmece için `materialId: 'smokedGlass'` ve yeni `handle` yapılandırmasını çözer.
4. `WardrobeMeshGroup` o kapağı alüminyum çerçeveli yarı saydam füme cam olarak ve `HandleMesh3D` ile yeni 3D kulpunu çizerek günceller.

### Senaryo F: Kaydet (Checkpoint), Undo ve Sayfa Yenileme (`F5`)
1. Her işlemde `PersistedStudioSession` (`workingDesign`, `checkpointDesign`, `historyPast`, `historyFuture`) senkron olarak `localStorage`'a ve asenkron olarak `IndexedDB`'ye yazılır.
2. Kullanıcı `F5` ile sayfayı yenilediğinde `useWardrobeStore` başlatılırken `readSyncSessionFromLocalStorage()` senkron olarak çalışır; tasarım ve tüm `Undo/Redo` geçmişi ilk karede sıfır gecikmeyle geri yüklenir.

---

## 7. Aşama 4 ve Aşama 5 İçin Önerilen Entegrasyon Noktaları (Codex Rehberi)

Codex'in mevcut mimariyi bozmadan **Aşama 4** ve **Aşama 5** özelliklerini ekleyebileceği en temiz entegrasyon noktaları şunlardır:

1. **Aşama 4 — Anne/Baba Ergonomi Isı Haritası ve Kıyafet Envanter Hesaplayıcısı:**
   - **Yeni Modül Önerisi:** `src/core/ergonomics/ergonomicsAndInventory.ts` oluşturun.
   - `solveDesign` çıktısındaki `ResolvedModel.cells` ve `ResolvedModel.drawers` dizilerini girdi olarak alıp Anne/Baba/Ortak kapasite sayılarını (askı uzunluğu mm, katlı giysi raf hacmi, ayakkabı çifti kapasitesi, yüklük hacmi) ve her hücrenin ergonomik erişim bölgesini (`low` / `comfort` / `high` / `stepStoolRequired`) saf fonksiyonlarla hesaplayın.
   - 3D görselleştirme için `WardrobeMeshGroup.tsx` içinde isteğe bağlı açılıp kapanabilen bir **Ergonomi Bölgesi Renk Katmanı** (`showErgonomicsZoneOverlay`) ekleyin.
2. **Aşama 4 — Oda Engelleri (Room Obstacles: Kolon, Kiriş, Süpürgelik, Priz, Kapı Açılımı):**
   - `src/core/schema/types.ts` içindeki `Design` arayüzüne `obstacles?: RoomObstacle[]` alanını ve `designSchema.ts` içine Zod şemasını ekleyin (geriye dönük uyumlu `.optional()`).
   - `carcassSolver.ts` içinde engel kutularıyla (`worldCenterMm`, `worldSizeMm`) dolap kolları (`Run`) ve kapak açılım yayları (`ResolvedDoorLeaf`) arasındaki kesişimleri denetleyip `warnings: ValidationWarning[]` dizisine engel çakışma uyarılarını ekleyin.
   - `WardrobeMeshGroup.tsx` içinde oda engellerini yarı saydam mimari referans kütleleri olarak (`raycast={NOOP_RAYCAST}`) çizin.
3. **Aşama 4 & 5 — Zorunlu Sürgülü Kapaklar (`sliding`) ve Hibrit Cephe (`Gereksinim D, E, F`):**
   - `types.ts` içinde zaten `FrontType = 'hinged' | 'sliding' | 'flapUp'` ve `Front` üzerinde `trackIndex?: 0 | 1`, `slideOffsetMm?: number` alanları hazırdır; `BayFrontMode` tipine `'slidingDouble' | 'slidingTriple'` veya `Front.type === 'sliding'` desteği ekleyin.
   - `carcassSolver.ts` içinde sürgülü kapaklar için ray derinliği düşümünü (`~80–90 mm`), ön/arka ray Z ofsetini (`trackIndex: 0 | 1`) ve sürgülü kapak arkasındaki çekmecelerin kapak tam açık değilken çakışma uyarısını ekleyin.
   - `WardrobeMeshGroup.tsx` içinde sürgülü kapak kanatlarını menteşe dönüşü (`rotation.y`) yerine yatay eksende (`position.x` veya `position.z`) `THREE.MathUtils.damp` ile kayacak şekilde genişletin.
4. **Aşama 5 — Gerçek Ölçülü Marangoz Üretim Dokümanı, Kesim Listesi (CSV) ve Çok Sayfalı PDF (`Gereksinim X, Y, Z`):**
   - **Yeni Modül Önerisi:** `src/core/export/cutlistAndProductionDoc.ts` oluşturun.
   - `ResolvedModel.panels` ve `ResolvedModel.drawers` zaten her parçanın gerçek milimetre boyutlarını (`widthMm`, `heightMm`, `thicknessMm`), `panelThicknessMm` (`t`) ve `backPanelThicknessMm` (`tb`) değerlerini üretmektedir. Bu veriden parça kodu (`A-B1-SOL-DIKME`, `A-B1-DRW1-ALT` vb.), kenar bandı (`PVC 0.8mm / 2mm`), malzeme adı ve plaka optimizasyon özetini türetin.
   - Çok sayfalı üretim dokümanı için 2D teknik cephe (A Kolu, B Kolu), üst plan ve modül kesitlerini ölçekli **SVG** olarak üreten temiz bir rapor bileşeni (`src/canvas/export/ProductionReportModal.tsx` veya yazdırılabilir `@media print` / PDF üreteci) ekleyin.
5. **Aşama 5 — A/B Tasarım Karşılaştırma ve AI Görselleştirme Köprüsü:**
   - `useWardrobeStore.ts` içine ikinci bir karşılaştırma yuvası (`comparisonDesignB: Design | null`) ekleyerek mevcut tasarım (`Design A`) ile ikinci varyantın (`Design B` — örn. Beşgen Köşe vs. Kör Köşe) metriklerini yan yana karşılaştırın.
   - `App.tsx` içindeki `3. Görünüm & Çıktı` (`activeStep === 'view-export'`) sekmesini A/B karşılaştırma, AI Render/Prompt Köprüsü, CSV Kesim Listesi ve PDF Marangoz Üretim Raporu butonlarıyla tamamlayın.
