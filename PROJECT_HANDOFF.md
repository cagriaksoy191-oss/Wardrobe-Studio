# WARDROBE STUDIO — KAPSAMLI PROJE DEVİR BELGESİ (`PROJECT_HANDOFF.md`)

> **4 Kasım 2026 son durum:** Aşama 1-5 tamamlandı. Güncel kullanım, üretim durumu ve bağımsız dosya/tarayıcı doğrulaması `PHASE5_VERIFICATION.md` içindedir. 120/120 test ve TypeScript/Vite derlemesi başarılıdır. Aşağıdaki Aşama 1-3 anlatımı ve aşama hedefleri tarihsel devir kaydıdır; Aşama 4 ayrıntıları `PHASE4_VERIFICATION.md` içinde korunur.

## Güncel Aşama 5 özellikleri ve devir noktası

- Bağımsız Front üzerinden iki/üç raylı, 2-6 kanatlı sürgü; eşit veya farklı genişlikler, ray/bindirme/yan payları, kısmi yükseklik ve menteşeli+sürgülü+açık karma cephe.
- Yüzey/kulptan sürükleme; editör/çoklu seçim ayrımı; mm kinematik ile aynı panel/kulp/çekmece hacimlerini kullanan sürekli temas sınırı ve görünür durma açıklaması. Başlangıç kesişmesi kritik üretim hatasıdır.
- Ayrı localStorage/IndexedDB adlandırılmış sürüm arşivi, arşivden açma/Undo ve hafif SVG/ölçüt A/B karşılaştırması.
- Tam JSON+talimat promptu; dışarıya bağlantı kurmadan doğrulanmış JSON önizleme, yeni sürüme kaydetme ve ayrı aktif açma.
- Tek fiziksel parça çıkarımı: N+1 ortak dikme, ayrı eski gövdelerin korunması, beş gerçek çekmece parçası ve bağımsız organizatörler. Görsel kasa kutusu üretim listesinde yoktur.
- A3 SVG/PDF teknik cephe, plan, kesit, her modül, tam kesim listesi, özel poligon V/E/açı/damar bilgileri, donanım/montaj/uyarılar. UTF-8 CSV, SVG/CSV/JSON ZIP ve gömülü fontlu yazdırılabilir rapor. Renkli/derinlik/tel PNG ve görselleştirme promptu.
- 18/8, 25/4, düz, beşgen, kör köşe ve asimetrik örnekler: `output/pdf/`, `artifacts/phase5/examples/`. Dört gerçek PDF toplam 127 sayfadır; kaynak koduyla aynı export fonksiyonlarından üretilip tekrar açılarak/render edilerek incelenmiştir.

Üretim durumu **USTA KONTROLÜ GEREKİR**; bant/ham kesim düşümü, donanım markası/yükü ve delik şablonu uydurulmaz. Kritik geometride CSV/PDF/ZIP indirmeleri kapalıdır. Yedek `phase5-before.zip`; sözleşmeler ve eski yedek korunmuştur. Sonraki genel denetim veya refactor için ayrı kullanıcı talimatı beklenir.

> **Belge Kapsamı:** Bu belge, Wardrobe Studio projesinin ilk mimari araştırmasından **Aşama 3** sonuna kadar olan tüm mühendislik geçmişini, mevcut çalışan sistemin tam özellik haritasını, kullanıcı tarafından eklenen kalıcı gereksinimleri ve **Aşama 4 / Aşama 5** hedeflerini projeyi devralacak geliştirme modeline (OpenAI Codex) eksiksiz aktarmak amacıyla hazırlanmıştır.

---

## 1. Proje Vizyonu ve Ürün Amacı

**Wardrobe Studio**, marangoz üretime uygun milimetrik doğrulukla çalışan, tarayıcı tabanlı (100% istemci tarafı), parametrik bir **3D/2D Gömme ve Köşe Gardırop Tasarım Stüdyosu**dur.

### 1.1. Çözdüğü Temel Problem
Standart hazır mobilya araçları (örn. IKEA PAX planlayıcıları) yalnızca sabit genişlikli (500/750/1000 mm) modülleri yan yana dizer; gerçek evlerdeki **asimetrik derinlikli L-köşeleri**, **beşgen (diyagonal) veya kör köşe birleşimlerini**, **kolon/kiriş/süpürgelik engellerini**, **dar dikey servis nişlerini (katlanır merdiven, ütü masası, dikey süpürge)** ve **marangoz kesim listesi (panel bazlı 18 mm / 8 mm net düşümler)** gereksinimlerini karşılayamaz. Genel amaçlı 3D CAD araçları (SketchUp, Fusion 360) ise mobilya bağlantı matematiğini, raf/çekmece/menteşe çakışmalarını ve kullanıcı ergonomisini bilmez.

Wardrobe Studio bu iki uç arasındaki boşluğu doldurur:
- **Birincil Gerçek Dünya Senaryosu:** Ebeveynlerin (**Anne**, **Baba** ve **Ortak** kullanım) birlikte kullanacağı, kolları farklı derinliklerde olabilen (örn. A Kolu `600 mm` derinlik, B Kolu `480 mm` veya `580 mm` derinlik) **L-tipi gömme köşe gardıropların** ve **düz (I-tipi) gömme gardıropların** hem görsel hem de üretim (marangoz) düzeyinde hatasız tasarlanması.
- **Tasarım Felsefesi:** Kullanıcı 3D sahnede veya 2D teknik cephe/plan görünümlerinde doğrudan bölmelere, raf aralıklarına, çekmecelere ve kapaklara tıklayarak milimetrik düzenleme yapar; arka planda çalışan deterministik parametrik çözücü (`carcassSolver`) her değişiklikte tüm ahşap panelleri, kapakları, çekmece kasalarını, kulpları, 3D eşya önizlemelerini ve kural/çakışma uyarılarını `1 mm` tamsayı hassasiyetinde yeniden hesaplar.

---

## 2. Planlama ve Mimari Karar Geçmişi

Proje kodlamaya başlamadan önce iki farklı mimari yaklaşımın çapraz denetimiyle şekillenmiştir:

1. [`implementation_plan_gemini.md`](file:///C:/dev/Wardrobe-Studio/implementation_plan_gemini.md): İlk bağımsız araştırma ve mimari teklif.
2. [`bagimsiz_arastirma_ve_plan_claude.md`](file:///C:/dev/Wardrobe-Studio/bagimsiz_arastirma_ve_plan_claude.md): İkinci bağımsız araştırma; özyinelemeli `SplitNode` hücre ağacı, `InsertRegistry` eklenti mimarisi, `Front` (Kapak) katmanının gövde ağacından ayrılması ve kural motoru (`RuleEngine`) önerilerini getirdi.
3. [`gemini_review_of_claude.md`](file:///C:/dev/Wardrobe-Studio/gemini_review_of_claude.md): İki planın çapraz teknik incelemesi; L-köşe geometrisi matematiği (`L_A_used = ArmA`, `L_B_used = ArmB`), tamsayı milimetre (`integer mm`) yuvarlama farkı dağıtımı ve asimetrik derinlikli beşgen köşe formüllerini netleştirdi.
4. [`claude_final_audit_of_gemini_review.md`](file:///C:/dev/Wardrobe-Studio/claude_final_audit_of_gemini_review.md): Nihai hakem denetimi; gereksiz karmaşıklıkları (V1'de U-tipi dolap, sunucu bağımlılığı, ağır CSG boolean operasyonları) eleyerek hibrit mimariyi onayladı.
5. [`wardrobe_studio_master_plan.md`](file:///C:/dev/Wardrobe-Studio/wardrobe_studio_master_plan.md): Yukarıdaki dört belgenin birleştirilmesiyle oluşturulan ve kullanıcı tarafından onaylanan **Nihai Ana Proje Planı** (5 Aşamalı Yol Haritası).
6. [`wardrobe_studio_additional_requirements.md`](file:///C:/dev/Wardrobe-Studio/wardrobe_studio_additional_requirements.md): Geliştirme sürecinde gerçek kullanıcı testleriyle ortaya çıkan ve ana planı daraltmadan genişleten **Kalıcı Ek Ürün Gereksinimleri Belgesi (Gereksinim A–Z)**.

### Temel Mimari Kararlar ve Gerekçeleri
- **Çift Katmanlı Veri Modeli (`Design` → `ResolvedModel`):** Kalıcı durum (`Design`) yalnızca kullanıcının niyetini (duvar kolları, sabit/esnek bölme genişlikleri, özyinelemeli `SplitNode` ağacı, malzeme/kulp/LED tercihleri) tutar. 3D koordinatlar, panel ebatları, çekmece parçaları ve uyarılar asla JSON içinde saklanmaz; her zaman `solveDesign(design)` ile deterministik olarak türetilir.
- **Tamsayı Milimetre (`integer mm`) Matematiği:** Veri modeli ve çözücüde kayan noktalı (`float`) metre/santimetre kullanılmaz; tüm hesaplamalar tamsayı milimetre (`Math.round`) ile yapılır. Yalnızca React Three Fiber (R3F) render aşamasında `MM_TO_M = 0.001` çarpanı uygulanır.
- **Paylaşımlı Dikme (`Shared Partition`) Kuralı:** Yan yana duran `N` adet bölme (`Bay`), çift yan dikme (`2N`) yerine `N + 1` adet dikey panel paylaşır. Böylece hem malzeme israfı önlenir hem de marangoz üretim standardı korunur.
- **Beşgen Köşe Asimetrik Derinlik Formülü:** A kolu (`D_A`) ve B kolu (`D_B`) farklı derinlikte olduğunda, diyagonal ön açıklık Pisagor teoremiyle hesaplanır:
  $$\text{DoorOpening} = \sqrt{(\text{Arm}_A - D_B)^2 + (\text{Arm}_B - D_A)^2}$$
- **Gövde (`Carcass`) ve Ön Cephe (`Front`) Ayrımı:** İç hücre ağacı (`SplitNode`) ile dış kapaklar (`BayFrontMode` ve `Design.fronts`) birbirinden bağımsızdır. Bir kapak tek bölmeyi, yarım bölmeyi (üst yüklük / alt gövde) veya birden fazla bölmeyi örtebilir.

---

## 3. Tamamlanan Aşamaların Ayrıntılı Geçmişi

### Aşama 1: Çekirdek Parametrik Motor, L-Köşe Çözücüsü ve 3D/2D Gövde İskeleti
- **Hedef:** Sıfır hata ile çalışan tamsayı milimetre çözücüsü, L-köşe (Beşgen + Kör Köşe) matematiği, 3D/2D sahne ve kalıcı oturum altyapısı.
- **Tamamlananlar:**
  - `types.ts` ve `designSchema.ts` (Zod doğrulama şeması).
  - `flexSolver.ts` (`distributeIntegerMm`): Sabit (`fixed`) ve esnek (`flex`) genişlik/yükseklik dağıtımı; yuvarlama farkının (`remainderMm`) son esnek öğeye eklenerek `%100` toplam korunumu.
  - `cornerSolver.ts` (`solveCornerJunction`): Beşgen köşe (`diagonal`) ve Kör köşe (`blind`) geometri hesabı, kol tüketimleri (`consumedRunAMm`, `consumedRunBMm`), beşgen köşe özel poligon taban/tavan/raf üretimi.
  - `carcassSolver.ts` (`solveDesign`): Duvar kolları (`Run`), bölmeler (`Bay`), paylaşımlı dikmeler (`divider`), alt/üst tablalar, baza (`plinth`), üst/yan klapalar (`filler`) ve `8 mm` arkalık (`back`) panellerinin 3D dünya koordinatlarında üretimi.
  - `WardrobeCanvas.tsx` ve `WardrobeMeshGroup.tsx`: `3D Perspektif`, `2D Cephe A`, `2D Cephe B` ve `2D Üst Plan` görünümleri.
  - `useWardrobeStore.ts`: Zustand + Immer + `idb-keyval` (IndexedDB) + JSON dışa/içe aktarım + 3 hazır şablon (`l-diagonal-asymmetric`, `l-blind-corner`, `straight-wardrobe`).

### Aşama 2: İç Modül Kütüphanesi (`InsertRegistry`), Hücre Ağacı (`SplitNode`) ve Kinematik Kapak/Çekmece
- **Hedef:** Bölmelerin içini özyinelemeli olarak yatay/dikey bölebilme, 8 iç modül tipini yerleştirme, kinematik açılır kapak/çekmece animasyonları ve temel marangoz kuralları.
- **Tamamlananlar:**
  - `insertRegistry.ts`: 8 modül tipi (`shelfStack`, `hangingRod`, `doubleHanging`, `drawerBank`, `shoeRack`, `serviceNiche`, `beddingYukluk`, `empty`).
  - `treeMutator.ts`: Hücre bölme (`splitLeafInDesign`), birleştirme (`unsplitParentOfLeafInDesign`), hazır bölme şablonları (`equal`, `topYukluk`, `leftServiceNiche`, `bottomDrawers`).
  - Kinematik menteşeli kapak açılma/kapanma (`pivotWorldMm` etrafında dönüş) ve çekmece ray hareketi (`slideDistanceMm` boyunca ileri kayma).
  - Çekmece–menteşe çakışma kuralı (`30 mm` iç klapa düşümü), dar servis nişi el/menteşe payı (`30 mm`) denetimi ve köşe akustik/mekanik çakışma uyarıları (`ValidationWarning`).

### Aşama 2.1: Etkileşim Hatalarının Düzeltilmesi ve Kullanım İyileştirmeleri
- **Kullanıcı Geri Bildirimi Üzerine Düzeltilenler:**
  - 3D sahnede iç çekmecelere doğrudan tıklanarak açılıp kapanabilmesi; önünde kapalı kapak varsa kapağın otomatik açılması ve kapak kapatıldığında arkasındaki açık çekmecenin otomatik kapanması (`coveringDoorIds` bağımlılığı).
  - Beşgen köşe dolabına yüksekliği ve açılma yönü (`sol`/`sağ`/`açık`) doğru hesaplanmış açılır köşe kapağının (`door-corner-*`) eklenmesi.
  - Üst araç çubuğuna `Kapak Görünümü: Normal | Yarı Saydam (X-Ray) | Gizli` anahtarının eklenmesi.
  - 3D/2D ölçü etiketlerine (`DimensionOverlay.tsx`) doğrudan tıklanarak klavyeden milimetre değeri girilebilmesi (`Inline Dimension Input`).
  - Seçili hücrenin 3D sahnede tel kafes (`wireframe`) kutu ve yüzen bağlamsal balon (`ContextualCellPopover.tsx`) ile vurgulanması.
  - Duvar kolu uçlarına (`RunEndAddBayOverlay.tsx`) `+ Bölme Ekle` butonunun eklenmesi.
  - Servis nişi eşyalarının (`resolveServiceItemPlacement`) ince kenarı öne bakacak, geniş yüzü yan dikmeye paralel olacak şekilde düzeltilmesi.
  - Sıfırdan boş gardırop oluşturma sihirbazının (`createBlankDesign`) eklenmesi.

### Aşama 2.2: Raycast Seçim Hatalarının Giderilmesi ve Görünür Her Raf Aralığının Bağımsız Seçimi
- **Kullanıcı Geri Bildirimi Üzerine Düzeltilenler:**
  - `Normal` kapak modunda kapalı kapakların arkasındaki görünmez iç hücrelerin yanlışlıkla seçilmesi engellendi (`stopPropagation()` ve `isCellCurrentlySelectable` kontrolü).
  - Yardımcı vurgu ve ölçü çizgilerinin tıklamaları yakalaması (`raycast={NOOP_RAYCAST}`) tamamen devre dışı bırakıldı.
  - Çok katlı raflarda (`shelfStack`), ayakkabılıklarda (`shoeRack`), çift kat askılarda (`doubleHanging`) ve beşgen köşe raflarında tek bir dev yaprak yerine **her görünür raf aralığının** (`${leafId}::sub-${k}` ve `${junctionId}::corner-sub-${k}`) bağımsız bir `ResolvedCell` olarak üretilmesi ve ayrı ayrı seçilebilmesi sağlandı.
  - Sanal bir alt aralıkta işlem yapıldığında `realizeSubIntervalInDesign` ile yalnızca o yaprağın mevcut raf konumları `1 mm` bile kaymadan gerçek `SplitNode` ağacına dönüştürülmesi sağlandı.

### Aşama 2.3: Gelişmiş Çoklu Seçim, Parametrik Raf Grubu Düzenleme ve Yönlü Boyutlandırma
- **Tamamlananlar:**
  - `Shift/Ctrl + Tık` ve `Çoklu Seçim Aracı` (`marquee` dikdörtgen çerçeve sürükleme) ile birden fazla hücre/raf aralığının seçilmesi (`selectedCellIds`).
  - Seçilen hücre grubunun analizi (`analyzeSelectedCellsGroup`): Brüt/net genişlik ve yükseklik, ara raf/dikme kalınlıkları (`heightDividersMm`, `widthDividersMm`) ve 3D grup sınırlayıcı kutusu.
  - Seçili hücreyi `N` (`2..10`) eşit parçaya bölme (`divideCellIntoNInDesign`), bitişik raf grubunun aralık sayısını değiştirme (`setContiguousGroupIntervalCountInDesign`) ve eşit olmayan bitişik aralıkları tek tıkla eşitleme (`equalizeContiguousCellsInDesign`).
  - Seçili hücre veya grup üzerinde `X` (kehribar), `Y` (mavi) ve `Z` (zümrüt) ölçülerine tıklayarak **Yönlü Boyutlandırma** (`Yukarı/Aşağı`, `Sağa/Sola`, `Öne/Arkaya`) ve **Komşu Bölme Çakışma Önizlemesi** (`ResizeDraftState`, `conflictOverlapMm`, `Komşuyu Otomatik Küçült/Büyüt` ve `Onayla`).
  - Kalıcı oturum (`localStorage` senkron + `IndexedDB` asenkron), 40 adımlı `Undo/Redo` geçmişi ve `Kaydet (Checkpoint)` / `Son Kayda Dön` sistemi.

### Aşama 2.4: Kamera Koruma, Bağımsız Çekmece/Kapak Editörü, Çoklu Raf Grubu Birleştirme ve Parametrik Malzeme Kalınlıkları
- **Tamamlananlar:**
  - `3D Perspektif` ↔ `2D Cephe/Plan` geçişlerinde kullanıcının 3D kamera açısının ve odak noktasının (`saved3DCameraStateRef`) korunması + `Görünümü Sıfırla` butonu.
  - Sağ üst yüzen düzenleme panelinin (`ContextualCellPopover.tsx`) seçilen 3D bölmenin üzerine binmeyecek şekilde akıllı konumlandırılması (`SelectionScreenBounds`), `Küçült` ve `× Kapat` kontrolleri.
  - Her çekmecenin (`ResolvedDrawerUnit`) 3D sahnede bağımsız seçilebilmesi (`selectDrawer`, `Shift+Tık` çoklu çekmece seçimi), `X / Y / Z` çekmece ölçülerinin gösterimi ve tekil çekmece ön kapak yüksekliğinin (`drawerFrontHeightsMm`) düzenlenebilmesi.
  - Çoklu raf grubu seçildiğinde (`isMultiShelfGroupSelection`) her grubu ayrı ayrı eşitleme veya aynı bölmede bitişikse `Grupları Birleştir ve Eşit Böl` (`mergeAndResplitSelectedGroupsInDesign`) seçeneği.
  - Beşgen köşe raflarının `Y` yüksekliğinin (`junction.intervalHeightsMm`) bağımsız düzenlenebilmesi ve `X/Z` kol ölçüsü (`diagonalArmAMm`, `diagonalArmBMm`) paylaşımının açıkça gösterilmesi.
  - **Bağımsız Kapak Düzenleme Modu (`Kapak Düzenle`):** Kapak açılma yönü (`sol`/`sağ`/`çift`/`açık`), menteşe açısı (`110°`/`155°`/`165°`), kapağı yatay bölme (üst yüklük + alt gövde kapağı: `splitBayDoorHorizontally`), birleştirme (`mergeBayDoors`), çoklu bölme kaplama (`coveredBayIds`: `setFrontBaySpan`) ve dikey sınır (`yStartMm` / `yEndMm`) düzenleme.
  - **Parametrik Malzeme Kalınlıkları:** Gövde/raf paneli (`16/18/22/25 mm`) ve arkalık (`6/8/10/18 mm`) kalınlıklarının sabit `18/8 mm` olmaktan çıkarılıp tüm çözücü, iç net derinlik (`D - t - tb`), çekmece kasa parçaları (`bottomThicknessMm = tb`) ve raf aralıklarında parametrik hale getirilmesi.

### Aşama 3: Görsel Gerçekçilik, PBR Malzemeler, LED Aydınlatma, 3D Kıyafet/Eşya Önizlemeleri ve Kulp Özelleştirme
- **Tamamlananlar:**
  - **6 Gerçekçi PBR Malzeme (`materialRegistry.ts`):** `warmOak` (Sıcak Meşe), `naturalWalnut` (Doğal Ceviz), `matteWhite` (Mat Kırık Beyaz Lake), `linenBeige` (Keten Dokulu Bej), `softAnthracite` (Yumuşak Antrasit Mat), `smokedGlass` (Füme Cam — alüminyum çerçeveli yarı saydam vitrin kapağı). Prosedürel ahşap damar/keten dokuları (`CanvasTexture`) ve önbellekleme (`materialCache`).
  - **Modül/Kapak/Çekmece Bazında Malzeme Özelleştirme:** Genel gövde/kapak malzemesine ek olarak seçili kapak (`Front.materialId` / `Bay.doorMaterialId`) veya seçili çekmece grubu (`InsertConfig.frontMaterialId` / `drawerFrontMaterialId`) için bağımsız malzeme atama ve genel palete sıfırlama.
  - **Prosedürel 3D Kulp Sistemi (`HandleMesh3D.tsx`):** 4 kulp stili (`verticalBar`, `horizontalBar`, `roundKnob`, `recessedProfile`) × 4 metal kaplama (`matteBlack`, `brushedBrass`, `satinChrome`, `anthracite`) × 4 standart delik aralığı boyutu (`96`, `160`, `320`, `480 mm`). Kapak ve çekmece kulplarının genel ve tekil olarak özelleştirilmesi; kulp merkezinin kapak ön yüzünden dışarıda (`t + 14 mm`) konumlandırılarak geometrik gömülmenin önlenmesi.
  - **İç LED Şerit Aydınlatma:** Aç/Kapat anahtarı, 3 renk sıcaklığı (`warm2700K`, `natural3000K`, `neutral4000K` + geriye dönük `warm3000K`/`cool5000K` uyumu) ve parlaklık (`intensity`) kontrolü. Her bölme ve beşgen köşe tavan tablasının altında 3D emissive LED kanal ve dinamik iç aydınlatma (`pointLight`).
  - **Dış Cephe ve Oda Uyumu (`ExteriorFinishConfig`):** Baza (`plinth`), üst/yan klapa (`filler`) ve arka/yan duvar renklerinin hazır kombinasyonlarla (`sameAsCarcass`, `sameAsFront`, `anthracitePlinth`, `whiteArchitectural`) veya özel renk seçiciyle ayarlanması.
  - **Hücre Sınırlarına Duyarlı 3D Kıyafet ve Eşya Önizlemeleri (`WardrobeItemsPreview.tsx`):** Askıda gömlek/ceket/uzun elbise/pantolon, katlı kazak/tişört yığınları, yorgan/yastık/valiz/hurç (`beddingYukluk`), ayakkabı çiftleri ve kutuları (`shoeRack`), katlanır merdiven/ütü masası/dikey süpürge (`serviceNiche`). Her hücreye özel eşya tipi (`itemPreset: 'auto' | 'foldedClothes' | 'storageBoxes' | ... | 'none'`) ve adet (`itemCountOverride`) seçimi; `clamp` matematiği ile eşyaların hücre dışına taşmasının engellenmesi; `raycast={NOOP_RAYCAST}` ile hücre seçimini asla engellememe garantisi.
  - **Düzenleme Modu / Profesyonel Sunum Modu (`renderQualityMode`):** Studio IBL (`getOrCreateStudioEnvMap`), yumuşak zemin gölgeleri (`ContactShadows`), yüksek kaliteli PBR yansımaları ve sadeleştirilmiş sahne görünümü.

---

## 4. Mevcut Uygulamanın Tam Özellik Haritası

| Kategori | Mevcut Özellik | Durum | İlgili Dosyalar |
| :--- | :--- | :--- | :--- |
| **Yerleşim & Köşe** | L-Tipi (`l-shape`) ve Düz (`straight`) yerleşim, Beşgen (`diagonal`) ve Kör (`blind`) köşe, asimetrik kol derinliği | Tamamlandı & Test Edildi | [`cornerSolver.ts`](file:///C:/dev/Wardrobe-Studio/src/core/solver/cornerSolver.ts), [`carcassSolver.ts`](file:///C:/dev/Wardrobe-Studio/src/core/solver/carcassSolver.ts) |
| **Gövde & Kalınlık** | Paylaşımlı dikmeler (`N+1`), parametrik panel (`16–25 mm`) ve arkalık (`6–18 mm`) kalınlıkları, baza ve üst/yan klapalar | Tamamlandı & Test Edildi | [`carcassSolver.ts`](file:///C:/dev/Wardrobe-Studio/src/core/solver/carcassSolver.ts), [`App.tsx`](file:///C:/dev/Wardrobe-Studio/src/App.tsx) |
| **Hücre Ağacı** | Özyinelemeli yatay/dikey bölme (`SplitNode`), birleştirme, `N`'e bölme, her raf aralığının (`::sub-k`) bağımsız seçimi | Tamamlandı & Test Edildi | [`treeMutator.ts`](file:///C:/dev/Wardrobe-Studio/src/core/solver/treeMutator.ts), [`carcassSolver.ts`](file:///C:/dev/Wardrobe-Studio/src/core/solver/carcassSolver.ts) |
| **Çoklu Seçim & Boyut** | `Shift+Tık`, `Marquee` çerçeve seçimi, grup analizi, aralık sayısı değiştirme, eşitleme, çoklu raf grubu birleştirme | Tamamlandı & Test Edildi | [`treeMutator.ts`](file:///C:/dev/Wardrobe-Studio/src/core/solver/treeMutator.ts), [`WardrobeCanvas.tsx`](file:///C:/dev/Wardrobe-Studio/src/canvas/scene/WardrobeCanvas.tsx) |
| **Yönlü Boyutlandırma** | `X / Y / Z` eksenlerinde yönlü büyüme/küçülme, komşu bölme çakışma önizlemesi (`ResizeDraftState`), otomatik dengeleme | Tamamlandı & Test Edildi | [`treeMutator.ts`](file:///C:/dev/Wardrobe-Studio/src/core/solver/treeMutator.ts), [`SelectedCellDimensionOverlay.tsx`](file:///C:/dev/Wardrobe-Studio/src/canvas/annotations/SelectedCellDimensionOverlay.tsx) |
| **Çekmece Sistemi** | Dış/İç çekmece, bağımsız çekmece seçimi, tekil ön kapak yüksekliği (`drawerFrontHeightsMm`), 5 parçalı kasa hesabı | Tamamlandı & Test Edildi | [`carcassSolver.ts`](file:///C:/dev/Wardrobe-Studio/src/core/solver/carcassSolver.ts), [`ContextualCellPopover.tsx`](file:///C:/dev/Wardrobe-Studio/src/canvas/annotations/ContextualCellPopover.tsx) |
| **Kapak Editörü** | Bağımsız `Kapak Düzenle` modu, yatay bölme (üst yüklük / alt gövde), çoklu bölme kaplama (`coveredBayIds`), menteşe açısı | Tamamlandı & Test Edildi | [`useWardrobeStore.ts`](file:///C:/dev/Wardrobe-Studio/src/store/useWardrobeStore.ts), [`ContextualCellPopover.tsx`](file:///C:/dev/Wardrobe-Studio/src/canvas/annotations/ContextualCellPopover.tsx) |
| **PBR Malzeme & Cam** | 5 ahşap/lake/keten doku + Alüminyum çerçeveli Füme Cam (`smokedGlass`), kapak/çekmece bazında malzeme özelleştirme | Tamamlandı & Test Edildi | [`materialRegistry.ts`](file:///C:/dev/Wardrobe-Studio/src/canvas/materials/materialRegistry.ts), [`WardrobeMeshGroup.tsx`](file:///C:/dev/Wardrobe-Studio/src/canvas/wardrobe/WardrobeMeshGroup.tsx) |
| **3D Kulplar & LED** | 4 kulp stili × 4 metal kaplama × 4 boyut (`HandleMesh3D`), iç LED şerit (`2700K/3000K/4000K`) + parlaklık, dış cephe uyumu | Tamamlandı & Test Edildi | [`HandleMesh3D.tsx`](file:///C:/dev/Wardrobe-Studio/src/canvas/wardrobe/HandleMesh3D.tsx), [`WardrobeMeshGroup.tsx`](file:///C:/dev/Wardrobe-Studio/src/canvas/wardrobe/WardrobeMeshGroup.tsx) |
| **3D Eşya Önizleme** | Hücre sınırlarına (`clamp`) duyarlı 3D giysi/kutu/ayakkabı/hurç/servis eşyası, hücre bazında tip ve adet seçimi | Tamamlandı & Test Edildi | [`WardrobeItemsPreview.tsx`](file:///C:/dev/Wardrobe-Studio/src/canvas/wardrobe/WardrobeItemsPreview.tsx) |
| **Sunum & Kalıcılık** | `Düzenleme` vs `Sunum Modu` (Studio IBL + `ContactShadows`), `localStorage` + `IndexedDB` kaydı, 40 adım `Undo/Redo`, JSON I/O | Tamamlandı & Test Edildi | [`WardrobeCanvas.tsx`](file:///C:/dev/Wardrobe-Studio/src/canvas/scene/WardrobeCanvas.tsx), [`useWardrobeStore.ts`](file:///C:/dev/Wardrobe-Studio/src/store/useWardrobeStore.ts) |

---

## 5. Kullanıcı Tarafından Eklenen ve Değiştirilen Gereksinimler (`Gereksinim A–Z`)

Kullanıcının geliştirme sürecinde eklediği tüm kurallar [`wardrobe_studio_additional_requirements.md`](file:///C:/dev/Wardrobe-Studio/wardrobe_studio_additional_requirements.md) içinde belgelenmiştir. Özet tablosu:

- **Tamamlanan Ek Gereksinimler (Aşama 2 – 2.4 – 3 içinde uygulandı):**
  - **A, B, C:** 2D/3D ölçü etiketlerine tıklayarak doğrudan sayısal girdi, seçili hücre tel kafes/balon vurgusu, kol uçlarında `+ Bölme Ekle`, servis nişi eşyalarının ince kenarı öne bakacak şekilde yerleşimi, sıfırdan boş gardırop sihirbazı.
  - **G, H, I:** `Normal` kapak modunda kapalı kapak arkasındaki hücrelerin seçilmemesi, `NOOP_RAYCAST` ile yardımcı çizgilerin tıklamayı engellememesi, her raf/askı/köşe aralığının (`::sub-k`) bağımsız seçilebilmesi.
  - **J, K, L, M, N, O:** Çoklu seçim (`Shift+Tık` + `Marquee`), toplu raf sayısı değiştirme ve eşitleme, yönlü boyutlandırma (`X/Y/Z` + yön seçimi), komşu bölme çakışma önizlemesi ve kalıcı `Undo/Redo` + `Checkpoint` sistemi.
  - **P, Q, R, S, T, U, V, W:** 3D kamera açısının 2D geçişlerinde korunması, yüzen panelin seçili hücreyi kapatmaması, çoklu raf grubu birleştirme, bağımsız çekmece seçimi ve ön yükseklik düzenleme, beşgen köşe bağımsız raf yüksekliği, bağımsız `Kapak Düzenle` modu, parametrik gövde (`16–25 mm`) ve arkalık (`6–18 mm`) kalınlıkları, çekmece alt/arka parçalarının gerçek üretim hesabına dahil edilmesi.
- **Aşama 4 ve Aşama 5'te Uygulanması Zorunlu Ek Gereksinimler:**
  - **Gereksinim D, E, F (Sürgülü Kapaklar ve Hibrit Cephe):** Ana planda "opsiyonel" geçen sürgülü kapak özelliği kullanıcı talimatıyla **zorunlu** hale getirilmiştir. İki raylı (`trackIndex: 0 | 1`) sürgülü kapak sistemi, yatay eksende sürükleyerek (`slideOffsetMm`) açma/kapatma, sürgülü kapak arkasındaki çekmecelerin kapak tam açık değilken çakışma uyarısı vermesi ve aynı dolapta **menteşeli + sürgülü + açık raf (hibrit cephe)** kullanımı.
  - **Gereksinim X, Y, Z (Gerçek Ölçülü Marangoz Üretim Dokümanı, 2D Teknik Çizimler ve PDF Raporu):** Aşama 5'te oluşturulacak çıktı basit bir özet liste değil; **A) Yönetici özeti ve malzeme kalınlık tablosu**, **B) Kol bazlı 2D teknik cephe/üst plan/kesit çizimleri**, **C) Modül ve bölme detay sayfaları (brüt/net, raf aralıkları, çekmece kasa parçaları)** ve **D) Parça bazlı tam kesim listesi (Parça Kodu, Adet, Boy × En × Kalınlık mm, Kenar Bandı, Malzeme)** içeren çok sayfalı profesyonel bir **Marangoz Üretim Paketi (PDF / Yazdırılabilir Rapor + CSV)** olmalıdır.

---

## 6. Henüz Geliştirilmemiş Aşamalar (Codex'in Görev Kapsamı: Aşama 4 ve Aşama 5)

### 6.1. Aşama 4: Anne/Baba Ergonomisi, Envanter, Oda Engelleri ve Gelişmiş Köşe/Niş Çözümleri
Kaynak: [`wardrobe_studio_master_plan.md`](file:///C:/dev/Wardrobe-Studio/wardrobe_studio_master_plan.md) (Bölüm 5 — Aşama 4) ve [`wardrobe_studio_additional_requirements.md`](file:///C:/dev/Wardrobe-Studio/wardrobe_studio_additional_requirements.md) (Bölüm 3 & 8).

1. **Anne / Baba / Ortak Bölgeleme (Zoning) ve Erişim Ergonomisi Haritası:**
   - Zaten veri modelinde her `Bay` ve `leaf` üzerinde `owner: 'anne' | 'baba' | 'ortak'` alanı mevcuttur.
   - Aşama 4'te kullanıcı boy bilgilerine göre (örn. Anne `162 cm`, Baba `178 cm` veya ayarlanabilir boy profili) 3D/2D sahnede **Erişim Ergonomisi Isı Haritası (Ergonomic Reach Zones)** eklenecektir:
     - `0–450 mm`: Eğilerek erişim / Alt bölge (Ayakkabı, ağır çekmece)
     - `450–1700 mm`: Konforlu günlük erişim bölgesi (Askı, sık kullanılan raf/çekmece)
     - `1700–2050 mm`: Üst erişim (Boy profiline göre uyarı/bilgi)
     - `2050 mm+`: Merdiven/Tabure gerektiren Yüklük bölgesi (`beddingYukluk`)
2. **Canlı Kıyafet ve Eşya Kapasite / Envanter Hesaplayıcısı:**
   - Mevcut tasarımdaki toplam askı borusu uzunlukları (uzun askı, kısa askı, çift kat askı), raf alanları, çekmece hacimleri, ayakkabılık katları ve yüklük hacimlerinden hareketle:
     - Anne, Baba ve Ortak alanlar için **tahmini kapasite sayaçları** (örn. `~42 Gömlek/Ceket`, `~14 Uzun Elbise`, `~36 Katlı Kazak/Tişört`, `~18 Çift Ayakkabı`, `~6 Büyük Yorgan/Hurç`).
     - İhtiyaç listesi karşılaştırması (hedef eşya sayısı vs. mevcut dolap kapasitesi).
3. **Oda Engelleri (Room Obstacles) ve Tesisat/Kiriş/Süpürgelik/Kapı-Pencere Tanımları:**
   - Odaya kolon (`pillar`), tavan kirişi (`beam`), süpürgelik (`skirting`), priz/anahtar (`switch`) ve oda kapısı/penceresi açılım alanı tanımlama.
   - Engel ile dolap gövdesi veya kapak açılımı çakıştığında `ValidationWarning` üretilmesi ve klapa (`filler`) / derinlik düşümü önerilmesi.
4. **Kör Köşe ve Beşgen Köşe Özel Aksesuar / Hareketli Mekanizma Seçenekleri:**
   - Kör köşede ölü hacmi değerlendiren kademeli L-askı, dışarı çekilebilir kör köşe mekanizması veya derin valiz/hurç erişim analizi.
5. **Sürgülü Kapak ve Hibrit Cephe Altyapısının Hazırlanması (Aşama 4 → Aşama 5 Köprüsü):**
   - `types.ts` içinde tanımlı olan `FrontType: 'hinged' | 'sliding' | 'flapUp'` ve `trackIndex?: 0 | 1`, `slideOffsetMm?: number` alanlarının çözücü (`carcassSolver.ts`) ve 3D sahnede (`WardrobeMeshGroup.tsx`) ray derinliği (`80–100 mm`) ve kapak çakışma kurallarıyla bağlanması.

### 6.2. Aşama 5: Sürgülü/Hibrit Kapaklar, A/B Karşılaştırma, AI Köprüsü ve Marangoz Üretim Paketi (PDF/CSV)
Kaynak: [`wardrobe_studio_master_plan.md`](file:///C:/dev/Wardrobe-Studio/wardrobe_studio_master_plan.md) (Bölüm 5 — Aşama 5) ve [`wardrobe_studio_additional_requirements.md`](file:///C:/dev/Wardrobe-Studio/wardrobe_studio_additional_requirements.md) (Bölüm 3, 9, 10).

1. **Zorunlu Sürgülü Kapak Sistemi ve Hibrit Cephe (`Gereksinim D, E, F`):**
   - Çift raylı (`Ön Ray / Arka Ray`) sürgülü kapak seçimi, 3D sahnede sürgülü kapağı yatay eksende sağa/sola kaydırarak açma/kapatma, sürgülü kapak açık değilken arkasındaki çekmecenin açılmasını engelleyen çakışma denetimi, aynı gardırop kolunda sürgülü + menteşeli + açık bölme hibrit cephe desteği.
2. **A/B Tasarım Karşılaştırma Modu (örn. Beşgen Köşe vs. Kör Köşe):**
   - İki tasarım varyantını (`Tasarım A` ve `Tasarım B`) yan yana veya anlık geçişle karşılaştırma tablosu: Toplam askı metresi (mm), toplam raf alanı ($\text{m}^2$), çekmece sayısı, ölü köşe hacmi, kapak açılım payı, toplam plaka/panel alanı ve tahmini maliyet/ergonomi farkı.
3. **AI Görselleştirme Köprüsü (Render Export + Prompt Generator):**
   - 3D sahneden yüksek çözünürlüklü PNG ekran görüntüsü (`gl.domElement.toDataURL`) + derinlik/kenar referansı alma ve seçili malzemelere/ışıklandırmaya uygun hazır mimari görselleştirme istemi (prompt) üretme.
4. **Gerçek Ölçülü Marangoz Üretim Dokümanı, Kesim Listesi (Cutlist CSV) ve Çok Sayfalı PDF Raporu (`Gereksinim X, Y, Z`):**
   - `ResolvedModel.panels` ve `ResolvedModel.drawers` verilerinden hareketle her bir parçanın (`sol/sağ/ara dikme`, `alt/üst tabla`, `sabit/hareketli raf`, `baza`, `klapa`, `arkalık`, `kapak`, `çekmece ön/yan/arka/alt parçaları`) milimetrik kesim ölçüsü, kenar bandı (`0.8 mm / 2 mm PVC` hangi kenarlarda var), malzeme kodu ve ait olduğu bölme/modül bilgisi.
   - Ölçekli 2D vektörel (SVG/Canvas tabanlı) Ön Cephe A, Ön Cephe B, Üst Plan ve Bölme Kesit çizimleriyle birlikte **yazdırılabilir / PDF olarak indirilebilir** eksiksiz üretim kitapçığı.

---

## 7. Bilinen Sorunlar, Plan–Kod Farklılıkları ve Teknik Notlar

Projeyi devralacak modelin yanılgıya düşmemesi için aşağıdaki **plan ve gerçek uygulama farklılıkları** şeffaf biçimde kaydedilmiştir:

1. **Sunum Modu (`renderQualityMode === 'presentation'`): `@react-three/postprocessing` (`N8AO`) yerine Studio IBL + `ContactShadows` Kullanımı:**
   - `wardrobe_studio_master_plan.md` içinde Aşama 3 için `@react-three/postprocessing` (`N8AO`) ifadesi geçmektedir. Ancak `package.json` içinde `@react-three/postprocessing` kurulu değildir (React 19 + Three r176 uyumluluğu ve kare hızı kararlılığı için dışlanmıştır).
   - Bunun yerine [`materialRegistry.ts`](file:///C:/dev/Wardrobe-Studio/src/canvas/materials/materialRegistry.ts) içindeki `getOrCreateStudioEnvMap()` ile prosedürel equirectangular **Studio IBL** ortam haritası, `@react-three/drei` `ContactShadows`, `2048×2048` gölge haritalı yönlü ışıklar ve iç LED `pointLight` kaynakları kullanılmıştır.
2. **3D Eşya Önizlemeleri (`WardrobeItemsPreview.tsx`): `InstancedMesh` yerine Prosedürel `<group>` / `<mesh>` Hiyerarşisi:**
   - Ana planda 3D eşyalar için `InstancedMesh` ifadesi geçmektedir. Mevcut uygulamada bir gardıropta toplam `30–100` civarında iç eşya bulunduğundan ve her eşyanın hücre boyutuna (`clamp`) ve renk varyasyonuna göre bağımsız ölçeklenmesi gerektiğinden, [`WardrobeItemsPreview.tsx`](file:///C:/dev/Wardrobe-Studio/src/canvas/wardrobe/WardrobeItemsPreview.tsx) içinde `raycast={NOOP_RAYCAST}` atanmış hafif prosedürel Three.js `<group>` ve `<mesh>` bileşenleri kullanılmıştır. Performans sorunu yoktur.
3. **Kapak/Çekmece Animasyonları: `@react-spring/three` yerine `useFrame` Eksponansiyel Sönümleme (`THREE.MathUtils.damp`):**
   - Ana planda `@react-spring/three` geçmesine karşın, [`WardrobeMeshGroup.tsx`](file:///C:/dev/Wardrobe-Studio/src/canvas/wardrobe/WardrobeMeshGroup.tsx) içinde ekstra paket bağımlılığı olmadan `useFrame` içinde `THREE.MathUtils.damp` kullanılmıştır. Bu yöntem, kapak veya çekmece hareketin tam ortasındayken tekrar tıklandığında sıçrama yapmadan anında yumuşak geri dönüş (mid-flight reversal) sağlar.
4. **Şema Alan Adı Eş칭leri (Backward-Compatible Property Aliases):**
   - [`types.ts`](file:///C:/dev/Wardrobe-Studio/src/core/schema/types.ts) içinde geriye dönük uyumluluk için bazı alanların iki eşdeğer adı desteklenmektedir:
     - Bölme kapak malzemesi: `bay.doorMaterialId ?? bay.frontMaterialId`
     - Çekmece ön malzemesi: `insert.frontMaterialId ?? insert.drawerFrontMaterialId`
     - LED renk sıcaklığı: `'warm2700K' | 'warm3000K' | 'natural3000K' | 'neutral4000K' | 'cool5000K'`
   - Yeni kod yazarken bu fallback zincirlerini bozmamaya dikkat edilmelidir.
5. **Üretim Derlemesi (`vite build`) Chunk Boyutu Uyarısı:**
   - `npm run build` çalıştığında Three.js + R3F tek pakette toplandığı için Vite standart `> 500 kB` bilgilendirme uyarısı (`dist/assets/index-*.js ~1,580 kB / gzip 426 kB`) verir; bu bir derleme hatası değildir (`exit code 0`). İstenirse Aşama 5'te `manualChunks` ile `three` ayrı bir chunk'a ayrılabilir.

---

## 8. Korunması Gereken Kritik Kurallar (Invariants)

1. **Birim Değişmezliği:** Tüm veri modeli (`Design`), çözücü (`carcassSolver`, `cornerSolver`, `flexSolver`) ve ağaç mutasyonları (`treeMutator`) **tamsayı milimetre (`integer mm`)** cinsinden çalışmalıdır. Yalnızca R3F 3D/2D sahne bileşenlerinde `MM_TO_M = 0.001` dönüşümü uygulanır.
2. **Paylaşımlı Dikme ve Net İç Genişlik Matematiği:**
   - Bir kolda `N` adet bölme varsa `N + 1` adet dikey panel (`t = panelThicknessMm`) bulunur.
   - Her bölmenin net iç genişliği `netInnerWidthMm = outerWidthMm - (solDikmePayı + sağDikmePayı)` formülüyle hesaplanır ve `sum(bays.outerWidthMm) + startFillerMm + endFillerMm === availableRunLengthMm` eşitliği asla bozulmamalıdır.
3. **Parametrik Kalınlık Bağımlılığı:**
   - Hiçbir yerde sabit `18` veya `8` milimetre varsayımı yapılmamalıdır; her zaman `run.panelThicknessMm` (veya `design.panelThicknessMm ?? 18`) ve `run.backPanelThicknessMm` (veya `design.backPanelThicknessMm ?? 8`) kullanılmalıdır.
   - Net iç derinlik her zaman `netDepthMm = run.depthMm - run.panelThicknessMm - run.backPanelThicknessMm` olarak hesaplanır.
4. **3D Raycast Seçim Güvenliği:**
   - Tüm dekoratif/yardımcı 3D öğeler (3D giysi/eşya önizlemeleri, LED şeritler, tel kafes seçim kutuları, ölçü çizgileri) `raycast={NOOP_RAYCAST}` kullanmalıdır; aksi halde kullanıcının raf aralıklarına ve çekmecelere tıklamasını engellerler.
5. **Ana Plan ve Ek Gereksinim Bütünlüğü:**
   - [`wardrobe_studio_master_plan.md`](file:///C:/dev/Wardrobe-Studio/wardrobe_studio_master_plan.md) ve [`wardrobe_studio_additional_requirements.md`](file:///C:/dev/Wardrobe-Studio/wardrobe_studio_additional_requirements.md) içindeki hiçbir özellik silinemez veya kapsam dışına çıkarılamaz.

---

## 9. Codex İçin Mevcut Başlangıç Durumu

- **Aktif Çalışma Dizini:** `C:\dev\Wardrobe-Studio` (OneDrive dışındaki yerel hızlı geliştirme dizini).
- **Mevcut Geliştirme Aşaması:** **Aşama 1, 2, 2.1, 2.2, 2.3, 2.4 ve 3 tamamlanmıştır.** Sıradaki geliştirme adımı **Aşama 4**'tür.
- **Test ve Derleme Durumu:**
  - `npm test -- --run` → `tests/solver.test.ts` içinde **37 / 37 birim testi başarılı (`PASS`)**.
  - `npm run build` → `tsc -b && vite build` **0 TypeScript ve 0 derleme hatası ile başarılı**.
- **Codex'in İlk Adımı:** Herhangi bir kod değişikliği yapmadan önce [`AGENTS.md`](file:///C:/dev/Wardrobe-Studio/AGENTS.md), [`CODEBASE_MAP.md`](file:///C:/dev/Wardrobe-Studio/CODEBASE_MAP.md) ve [`HANDOFF_VERIFICATION.md`](file:///C:/dev/Wardrobe-Studio/HANDOFF_VERIFICATION.md) belgelerini okumak, ardından kullanıcının **Aşama 4** talimatına göre geliştirmeye başlamaktır.
