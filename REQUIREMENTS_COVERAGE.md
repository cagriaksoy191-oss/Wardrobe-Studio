# Wardrobe Studio — Gereksinim İzlenebilirlik Matrisi

Tarih: 04.11.2026. Bu denetim kaynak kodu değiştirmeden yapıldı. MP = [salt okunur ana plan](C:/dev/Wardrobe-Studio/wardrobe_studio_master_plan.md); EK = [salt okunur A–Z ek sözleşme](C:/dev/Wardrobe-Studio/wardrobe_studio_additional_requirements.md). Eski tamamlanma raporları kanıt yerine kullanılmadı.

## Sayım ve durumların anlamı

Aynı yükümlülüğün §2, §9 kabul kriteri, §13 başlangıç işi ve §14 karar özetindeki tekrarları tekrar sayılmadı. Farklı davranışlar ayrı satırlara ayrıldı. Bu, metin içindeki madde işareti sayısı değil, izlenebilir atomik denetim maddesi sayısıdır. PASS ilgili satırın belirtilen kanıt sınırında doğrulandığını gösterir; bütün kombinasyonların tüketildiği anlamına gelmez. PARTIAL kısmi uygulama veya açık doğrulama sınırı; FAIL yok/yanlış davranış; UNVERIFIED kod var ama yeterli çalışma kanıtı yok; DEFERRED sözleşmedeki v2+; EXTERNAL VERIFICATION gerçek donanım/saha onayıdır. D–F sürgülü/karma kapsamı zorunludur, ertelenmedi.

|Kapsam|Toplam|PASS|PARTIAL|FAIL|UNVERIFIED|DEFERRED|EXTERNAL VERIFICATION|
|---|---:|---:|---:|---:|---:|---:|---:|
|Ana plan MP001–MP133|133|95|26|8|3|0|1|
|A–Z atomik ek maddeler|192|153|24|2|9|0|4|
|Ertelenen/koşullu kapsam ve geçersiz eski varsayımlar|19|3|0|0|0|15|1|
|Bütün matris|344|251|50|10|12|15|6|

Ana plan: dış uzman/ertelenmiş satırlar hariç 132 yazılım yükümlülüğünün 95 tanesi PASS, 26 tanesi PARTIAL, 8 tanesi FAIL, 3 tanesi UNVERIFIED. Eksiklerin büyüklükleri eşit olmadığından bu oran ürünün yüzde tamamlanması olarak kullanılmamalıdır.

A–Z: dış uzman/ertelenmiş satırlar hariç 188 yazılım yükümlülüğünün 153 tanesi PASS, 24 tanesi PARTIAL, 2 tanesi FAIL, 9 tanesi UNVERIFIED. Eksiklerin büyüklükleri eşit olmadığından bu oran ürünün yüzde tamamlanması olarak kullanılmamalıdır.

## Kod ve test anahtarı

Her satırın Kod/Test hücresindeki kısaltma aşağıdaki gerçek dosyaya karşılık gelir. Bir test dosyası adı, dosyadaki her testin o gereksinimi sınadığı anlamına gelmez; numara/başlık ve kanıt sütunu kapsamı daraltır. Yeni bulunan kusurların çoğu için mevcut test yoktur; AUD kayıtları önerilen kalıcı regresyonu ayrıca verir.

|Kısaltma|Gerçek dosya|
|---|---|
|S|[src/core/schema/designSchema.ts](C:/dev/Wardrobe-Studio/src/core/schema/designSchema.ts)|
|CS|[src/core/solver/carcassSolver.ts](C:/dev/Wardrobe-Studio/src/core/solver/carcassSolver.ts)|
|CO|[src/core/solver/cornerSolver.ts](C:/dev/Wardrobe-Studio/src/core/solver/cornerSolver.ts)|
|FM|[src/core/solver/flexSolver.ts](C:/dev/Wardrobe-Studio/src/core/solver/flexSolver.ts)|
|TM|[src/core/solver/treeMutator.ts](C:/dev/Wardrobe-Studio/src/core/solver/treeMutator.ts)|
|IR|[src/core/inserts/insertRegistry.ts](C:/dev/Wardrobe-Studio/src/core/inserts/insertRegistry.ts)|
|ST|[src/store/useWardrobeStore.ts](C:/dev/Wardrobe-Studio/src/store/useWardrobeStore.ts)|
|SL|[src/core/solver/slidingSolver.ts](C:/dev/Wardrobe-Studio/src/core/solver/slidingSolver.ts)|
|FC|[src/core/fronts/frontCommands.ts](C:/dev/Wardrobe-Studio/src/core/fronts/frontCommands.ts)|
|SA|[src/core/analysis/studioAnalysis.ts](C:/dev/Wardrobe-Studio/src/core/analysis/studioAnalysis.ts)|
|INV|[src/core/analysis/inventory.ts](C:/dev/Wardrobe-Studio/src/core/analysis/inventory.ts)|
|KIN|[src/core/analysis/kinematics.ts](C:/dev/Wardrobe-Studio/src/core/analysis/kinematics.ts)|
|MC|[src/core/analysis/motionConstraints.ts](C:/dev/Wardrobe-Studio/src/core/analysis/motionConstraints.ts)|
|MS|[src/core/analysis/motionSimulator.ts](C:/dev/Wardrobe-Studio/src/core/analysis/motionSimulator.ts)|
|VER|[src/core/versions/designExchange.ts](C:/dev/Wardrobe-Studio/src/core/versions/designExchange.ts)|
|VA|[src/store/versionArchive.ts](C:/dev/Wardrobe-Studio/src/store/versionArchive.ts)|
|PRO|[src/core/production/productionModel.ts](C:/dev/Wardrobe-Studio/src/core/production/productionModel.ts)|
|TS|[src/core/production/technicalSheets.ts](C:/dev/Wardrobe-Studio/src/core/production/technicalSheets.ts)|
|CSV|[src/core/production/csvExport.ts](C:/dev/Wardrobe-Studio/src/core/production/csvExport.ts)|
|PDF|[src/export/pdfWriter.ts](C:/dev/Wardrobe-Studio/src/export/pdfWriter.ts)|
|APP|[src/App.tsx](C:/dev/Wardrobe-Studio/src/App.tsx)|
|WC|[src/canvas/scene/WardrobeCanvas.tsx](C:/dev/Wardrobe-Studio/src/canvas/scene/WardrobeCanvas.tsx)|
|WM|[src/canvas/wardrobe/WardrobeMeshGroup.tsx](C:/dev/Wardrobe-Studio/src/canvas/wardrobe/WardrobeMeshGroup.tsx)|
|IT|[src/canvas/wardrobe/WardrobeItemsPreview.tsx](C:/dev/Wardrobe-Studio/src/canvas/wardrobe/WardrobeItemsPreview.tsx)|
|HM|[src/canvas/wardrobe/HandleMesh3D.tsx](C:/dev/Wardrobe-Studio/src/canvas/wardrobe/HandleMesh3D.tsx)|
|SI|[src/canvas/wardrobe/SlidingLeafInteraction.tsx](C:/dev/Wardrobe-Studio/src/canvas/wardrobe/SlidingLeafInteraction.tsx)|
|MAT|[src/canvas/materials/materialRegistry.ts](C:/dev/Wardrobe-Studio/src/canvas/materials/materialRegistry.ts)|
|POP|[src/canvas/annotations/ContextualCellPopover.tsx](C:/dev/Wardrobe-Studio/src/canvas/annotations/ContextualCellPopover.tsx)|
|SD|[src/canvas/annotations/SelectedCellDimensionOverlay.tsx](C:/dev/Wardrobe-Studio/src/canvas/annotations/SelectedCellDimensionOverlay.tsx)|
|DO|[src/canvas/annotations/DimensionOverlay.tsx](C:/dev/Wardrobe-Studio/src/canvas/annotations/DimensionOverlay.tsx)|
|END|[src/canvas/annotations/RunEndAddBayOverlay.tsx](C:/dev/Wardrobe-Studio/src/canvas/annotations/RunEndAddBayOverlay.tsx)|
|AO|[src/canvas/scene/AnalysisOverlays.tsx](C:/dev/Wardrobe-Studio/src/canvas/scene/AnalysisOverlays.tsx)|
|P4UI|[src/ui/Phase4Panels.tsx](C:/dev/Wardrobe-Studio/src/ui/Phase4Panels.tsx)|
|FE|[src/ui/FrontSystemEditor.tsx](C:/dev/Wardrobe-Studio/src/ui/FrontSystemEditor.tsx)|
|VP|[src/ui/VersionPanel.tsx](C:/dev/Wardrobe-Studio/src/ui/VersionPanel.tsx)|
|PP|[src/ui/ProductionPanel.tsx](C:/dev/Wardrobe-Studio/src/ui/ProductionPanel.tsx)|
|T1|[tests/solver.test.ts](C:/dev/Wardrobe-Studio/tests/solver.test.ts)|
|T2|[tests/phase4.test.ts](C:/dev/Wardrobe-Studio/tests/phase4.test.ts)|
|T4|[tests/phase4-analysis.test.ts](C:/dev/Wardrobe-Studio/tests/phase4-analysis.test.ts)|
|T5|[tests/phase5-motion.test.ts](C:/dev/Wardrobe-Studio/tests/phase5-motion.test.ts)|
|T6|[tests/phase5-contact.test.ts](C:/dev/Wardrobe-Studio/tests/phase5-contact.test.ts)|
|T7|[tests/phase5-versions.test.ts](C:/dev/Wardrobe-Studio/tests/phase5-versions.test.ts)|
|T8|[tests/phase5-production.test.ts](C:/dev/Wardrobe-Studio/tests/phase5-production.test.ts)|

## Kanıt anahtarı

- T120: [120/120 birim test logu](C:/dev/Wardrobe-Studio/artifacts/final-audit/tests.log) ve [sıkı TS + üretim derlemesi](C:/dev/Wardrobe-Studio/artifacts/final-audit/build.log).
- I: [119 bağımsız gözlem](C:/dev/Wardrobe-Studio/artifacts/final-audit/independent-results.json); 3000 rastgele sınırlandırılmış flex vakası tek gözlemde yer alır. 97 olumlu/22 dikkat kaydı, 22 benzersiz hata veya eski test başarısızlığı demek değildir. Aynı kusurun dört örnekte tekrarı vardır. [Tekrar üretim betiği](C:/dev/Wardrobe-Studio/artifacts/final-audit/independent-audit.mjs).
- B: [İzole Brave5180 oturumu](C:/dev/Wardrobe-Studio/artifacts/final-audit/browser-evidence.json); 19 doğrulanan senaryo ve indirmede 1 UNVERIFIED. Alt adımlar/kanıt sınırı JSON içinde. [Yakalanan uyarı/hata listesi](C:/dev/Wardrobe-Studio/artifacts/final-audit/browser-console.json) boştur; bu tam tarayıcı performans ölçümü değildir.
- P: [Python PDF/CSV/SVG/ZIP çapraz kontrolü](C:/dev/Wardrobe-Studio/artifacts/final-audit/production-output-checks.json) ve [Bağımsız örnek geometri hesapları](C:/dev/Wardrobe-Studio/artifacts/final-audit/examples-audit.json). PDF kesim ölçüleri ayrıca [sayısal PDF kontrolü](C:/dev/Wardrobe-Studio/artifacts/final-audit/pdf-numeric-checks.json) ile eşleşti. 127 sayfanın tamamı 13 temas görüntüsünde, seçili kritik sayfalar ayrıca tam çözünürlükte incelendi; fiziksel A3 baskı yapılmadı.
- PER: [Yalnız bellekte gecikme/kota enjeksiyonu](C:/dev/Wardrobe-Studio/artifacts/final-audit/persistence-race.json); gerçek kullanıcı deposuna erişmedi. [Betik](C:/dev/Wardrobe-Studio/artifacts/final-audit/persistence-review.mjs).
- AUD-nnn: [Öncelikli bulgu ve tekrar adımları](C:/dev/Wardrobe-Studio/FINAL_AUDIT.md); ölçü/PDF ayrıntıları [PRODUCTION_OUTPUT_AUDIT.md](C:/dev/Wardrobe-Studio/PRODUCTION_OUTPUT_AUDIT.md); kullanıcı tekrarları [USER_ACCEPTANCE_TESTS.md](C:/dev/Wardrobe-Studio/USER_ACCEPTANCE_TESTS.md).

## Ana plan — ürün, kapsam ve mimari

|Kimlik|Gereksinim|Kaynak|Kod|Test|Sonuç / kanıt|Durum|Eksik / sınır|Önem|Öneri|
|---|---|---|---|---|---|---|---|---|---|
|MP001|Düz gardırop tasarımı|MP §1–3; §9 A1; §13–14|S, CS, FM, CO, ST|T1, T2|I:straight; B:room-obstacle|PASS|—|—|—|
|MP002|Kör köşeli L tasarımı|MP §1–3; §9 A1; §13–14|S, CS, FM, CO, ST|T1, T2|I:blind; T1 #5|PASS|—|—|—|
|MP003|Beşgen köşeli L tasarımı|MP §1–3; §9 A1; §13–14|S, CS, FM, CO, ST|T1, T2|I:diagonal; B:corner-resize|PASS|—|—|—|
|MP004|Asimetrik kol derinliği|MP §1–3; §9 A1; §13–14|S, CS, FM, CO, ST|T1, T2|I:asymmetric; T1 #4|PASS|—|—|—|
|MP005|Tek Design kullanıcı niyeti; ResolvedModel deterministik türetim|MP §1–3; §9 A1; §13–14|S, CS, FM, CO, ST|T1, T2|I:*:deterministic ve round-trip|PASS|—|—|—|
|MP006|Saf TypeScript çekirdeği; React/Three bağımsızlığı|MP §1–3; §9 A1; §13–14|S, CS, FM, CO, ST|T1, T2|src/core import incelemesi|PASS|—|—|—|
|MP007|Kalıcı niyette tamsayı mm, render sınırında metre|MP §1–3; §9 A1; §13–14|S, CS, FM, CO, ST|T1, T2|T2 rounding; I:flex:bounded-random|PASS|Ağırlık/açı/alan ve türetilmiş yarım mm merkezleri uzunluk niyetinden ayırdık.|—|—|
|MP008|Tüm çözülmüş koordinatları da tamsayı sayma yönündeki lafzi karar|MP §1–3; §9 A1; §13–14|S, CS, FM, CO, ST|T1, T2|Kod; I:hinged-render-vs-production-center|PARTIAL|Tek sayılı kutuda yarım mm merkez ve trigonometrik koordinat gerekir; katı yuvarlama AUD-009 üretiyor.|P2|Kesim/niyet tamsayı, türetilmiş merkez/açı hassasiyetini açıklaştır.|
|MP009|Sabit/esnek ve kilitli genişlikler|MP §1–3; §9 A1; §13–14|S, CS, FM, CO, ST|T1, T2|T1 #2/#8; T2 sınırlar|PASS|—|—|—|
|MP010|Remainder dağıtımı ve toplam mm kapanışı|MP §1–3; §9 A1; §13–14|S, CS, FM, CO, ST|T1, T2|I:3000 bounded flex; T1 #2|PASS|—|—|—|
|MP011|Eşzamanlı min/max sınırları ve imkânsız dağıtımı ret|MP §1–3; §9 A1; §13–14|S, CS, FM, CO, ST|T1, T2|T2 min/max/overflow; I:flex:bounded-random|PASS|—|—|—|
|MP012|Run + Junction grafiğinin global geçerliliği|MP §1–3; §9 A1; §13–14|S, CS, FM, CO, ST|T1, T2|I:validation-gap:*|PARTIAL|AUD-002: L birleşimi ve öncelik/eksen doğrulaması eksik.|P1|Ortak grafik invariantı.|
|MP013|Run bazında uzunluk, derinlik, yükseklik|MP §1–3; §9 A1; §13–14|S, CS, FM, CO, ST|T1, T2|T1 #4/#8; I:thickness-*|PASS|—|—|—|
|MP014|SplitNode yatay=alt/üst, dikey=sol/sağ|MP §1–3; §9 A1; §13–14|S, CS, FM, CO, ST|T1, T2|T1 #3/#9; B:virtual-cell-edit|PASS|—|—|—|
|MP015|InsertRegistry parametre, varsayılan, geometri, kapasite ve kuralı tek tipli nesnede toplama|MP §1–3; §9 A1; §13–14|S, CS, FM, CO, ST|—|IR; CS; INV|PARTIAL|AUD-029: katalog ve varsayılanlar var; geometri ve kapasite ayrı dosyalarda dallanıyor.|P3|Mevcut davranışı koruyarak küçük ortak modül sözleşmesi değerlendir; kapsamlı refactor gerekmez.|
|MP016|Yeni ağır CAD/CSG/fizik motoru eklememe|MP §1–3; §9 A1; §13–14|S, CS, FM, CO, ST|T1, T2|package.json; MC; MS|PASS|—|—|—|
|MP017|Tek SPA ve mevcut mimariyi aşamalarla genişletme|MP §1–3; §9 A1; §13–14|S, CS, FM, CO, ST|T1, T2|package.json; kaynak dizinleri|PASS|—|—|—|
|MP018|Vite kurulumu ve dev/build çalışması|MP §1–3; §9 A1; §13–14|S, CS, FM, CO, ST|T1, T2|build.log; 5180 dev sunucusu|PASS|—|—|—|
|MP019|React 19|MP §1–3; §9 A1; §13–14|S, CS, FM, CO, ST|T1, T2|package.json; çalışan tarayıcı|PASS|—|—|—|
|MP020|TypeScript strict|MP §1–3; §9 A1; §13–14|S, CS, FM, CO, ST|T1, T2|tsconfig; build.log|PASS|—|—|—|
|MP021|Tailwind CSS|MP §1–3; §9 A1; §13–14|S, CS, FM, CO, ST|T1, T2|package.json; çalışan arayüz|PASS|—|—|—|
|MP022|Lucide Icons|MP §1–3; §9 A1; §13–14|S, CS, FM, CO, ST|T1, T2|package.json; arayüz|PASS|—|—|—|
|MP023|Three WebGL + R3F + drei|MP §1–3; §9 A1; §13–14|S, CS, FM, CO, ST|T1, T2|WC; çalışan 3D/2D|PASS|—|—|—|
|MP024|Animasyonda react-spring/three tercihi|MP §1–3; §9 A1; §13–14|S, CS, FM, CO, ST|T5|MS; WM; package.json|PARTIAL|AUD-029: kendi yay/sönümleyici sistemi kullanılmış; kesintili dönüş davranışı doğrulandı, belirtilen kitaplık kullanılmıyor.|P3|Davranışı koru; teknik tercih sapmasını açıkça karara bağla.|
|MP025|Zustand + Immer|MP §1–3; §9 A1; §13–14|S, CS, FM, CO, ST|T1, T2|ST; T1 komut/Undo testleri|PASS|—|—|—|
|MP026|Zod çalışma zamanı şeması|MP §1–3; §9 A1; §13–14|S, CS, FM, CO, ST|T1, T2|S; I:json-reject:*|PASS|—|—|—|
|MP027|idb-keyval / IndexedDB kalıcılığı|MP §1–3; §9 A1; §13–14|S, CS, FM, CO, ST|T2|PER|PARTIAL|AUD-001/007 uç kayıt koşulları.|P1|Geç okuma ve yedek yazma yollarını düzelt.|
|MP028|Vitest çekirdek test altyapısı|MP §1–3; §9 A1; §13–14|S, CS, FM, CO, ST|T1, T2|T120:7 dosya, 120 test|PASS|—|—|—|

## Ana plan — fiziksel geometri ve hareket

|Kimlik|Gereksinim|Kaynak|Kod|Test|Sonuç / kanıt|Durum|Eksik / sınır|Önem|Öneri|
|---|---|---|---|---|---|---|---|---|---|
|MP029|Kutu panelleri gerçek mm boyutuyla üretme; mesh.scale ile sündürmeme|MP §4; §6.1; §9 A1–2; §10|CS, CO, WM, MAT, MC, MS|T1, T2, T5, T6|WM PanelMeshItem; T1 #25|PASS|—|—|—|
|MP030|Beşgen Shape/ExtrudeGeometry panel üretimi|MP §4; §6.1; §9 A1–2; §10|CS, CO, WM, MAT, MC, MS|T1, T2, T5, T6|WM; I:poligon V/E/açı/alan|PASS|—|—|—|
|MP031|Ahşap dokuda dünya ölçeğinde UV|MP §4; §6.1; §9 A1–2; §10|CS, CO, WM, MAT, MC, MS|T1, T2, T5, T6|T1 #31; MAT|PASS|—|—|—|
|MP032|Dikme/kapak dikey, raf yatay grainAxis|MP §4; §6.1; §9 A1–2; §10|CS, CO, WM, MAT, MC, MS|T1, T2, T5, T6|T1 #31; I:poligon grain; MAT|PASS|—|—|—|
|MP033|Çakışık yüzeylerde Z-fighting önlemi|MP §4; §6.1; §9 A1–2; §10|CS, CO, WM, MAT, MC, MS|—|WM/MAT kaynak incelemesi|UNVERIFIED|Tüm kalınlık ve malzemelerde yüzey titremesi görsel olarak taranmadı.|P3|UAT-17'yi farklı kamera yakınlığında yap.|
|MP034|Kapakları Bay'den bağımsız Front katmanında tutma|MP §4; §6.1; §9 A1–2; §10|CS, CO, WM, MAT, MC, MS|T1, T2, T5, T6|FC; T1 #28; T5 hibrit|PASS|—|—|—|
|MP035|Birden çok bitişik Bay'i tek kapakla kapsama|MP §4; §6.1; §9 A1–2; §10|CS, CO, WM, MAT, MC, MS|T1, T2, T5, T6|T7 front tests; FC; FE|PASS|—|—|—|
|MP036|Kapak yStart/yEnd ve kısmi yükseklik|MP §4; §6.1; §9 A1–2; §10|CS, CO, WM, MAT, MC, MS|T1, T2, T5, T6|T1 #10/#28; B:hybrid-and-gate|PASS|—|—|—|
|MP037|Otomatik ≤600 mm tek, >600 mm çift kapak|MP §4; §6.1; §9 A1–2; §10|CS, CO, WM, MAT, MC, MS|T1, T2, T5, T6|T1 #10|PASS|—|—|—|
|MP038|Dış çekmece üstünde otomatik kapak alt sınırını yükseltme|MP §4; §6.1; §9 A1–2; §10|CS, CO, WM, MAT, MC, MS|T1, T2, T5, T6|T1 #10|PASS|—|—|—|
|MP039|Gerçek sol/sağ menteşe pivotları|MP §4; §6.1; §9 A1–2; §10|CS, CO, WM, MAT, MC, MS|T1, T2, T5, T6|I:hinged-render-vs-production-center|PARTIAL|AUD-009: tek sayılı sağ kanatta 1 mm fark.|P2|Tek merkez/pivot hesabı.|
|MP040|110/155/165° açılma sınırları|MP §4; §6.1; §9 A1–2; §10|CS, CO, WM, MAT, MC, MS|T1, T2, T5, T6|T2 açı testleri; T5; KIN|PASS|—|—|—|
|MP041|Doğal açılma/kapanma, yarıda ters yön|MP §4; §6.1; §9 A1–2; §10|CS, CO, WM, MAT, MC, MS|T1, T2, T5, T6|I:motion:mid-flight-reversal; MS|PASS|—|—|—|
|MP042|İç çekmece öncesi kapak açma ve kapatmada sıralama|MP §4; §6.1; §9 A1–2; §10|CS, CO, WM, MAT, MC, MS|T1, T2, T5, T6|T1 #12; MS|PASS|—|—|—|
|MP043|Çekmecede kısmi 0.80 / tam 1.0 kızak sınırı seçimi|MP §4; §6.1; §9 A1–2; §10|CS, CO, WM, MAT, MC, MS|—|CS:2080|FAIL|AUD-023: sabit 0.82; tip seçimi yok.|P2|Kalıcı kızak/çıkma niyeti ekle.|
|MP044|R3F hareketi sırasında yeniden çizim|MP §4; §6.1; §9 A1–2; §10|CS, CO, WM, MAT, MC, MS|T1, T2, T5, T6|WC sürekli render döngüsü; tarayıcı hareketleri|PASS|invalidate talebi frameloop=demand için anlamlı; bu sahne sürekli çiziyor.|—|—|
|MP045|Paylaşımlı N+1 dikme ve ayrı 2N gövde korunumu|MP §4; §6.1; §9 A1–2; §10|CS, CO, WM, MAT, MC, MS|T1, T2, T5, T6|I:partitions:*; dört örnek; T2/T8|PASS|—|—|—|
|MP046|Dış/net ölçü ve 800−2×18=764 mm|MP §4; §6.1; §9 A1–2; §10|CS, CO, WM, MAT, MC, MS|T1, T2, T5, T6|I:thickness:18/8; T1 #1|PASS|—|—|—|
|MP047|Beşgen net/dış açıklık ve asimetrik Pisagor|MP §4; §6.1; §9 A1–2; §10|CS, CO, WM, MAT, MC, MS|T1, T2, T5, T6|I:poligonlar; T1 #4; PRO|PASS|—|—|—|
|MP048|Kör köşede öncelikli kol derinliği+klapa tüketimi|MP §4; §6.1; §9 A1–2; §10|CS, CO, WM, MAT, MC, MS|T1, T2, T5, T6|T1 #5; I:blind|PASS|—|—|—|
|MP049|Kör klapa dar olduğunda çakışma uyarısı|MP §4; §6.1; §9 A1–2; §10|CS, CO, WM, MAT, MC, MS|T1, T2, T5, T6|CO; T1 köşe kuralı|PASS|Alt sınır 45 mm; olağan varsayılan 60 mm.|—|—|
|MP050|Beşgen raf alanı seçeneği|MP §4; §6.1; §9 A1–2; §10|CS, CO, WM, MAT, MC, MS|T1, T2, T5, T6|B:corner-resize; I:poligonlar|PASS|—|—|—|
|MP051|Beşgen askı alanı seçeneği|MP §4; §6.1; §9 A1–2; §10|CS, CO, WM, MAT, MC, MS|—|I:corner-rod|FAIL|AUD-011: alan saklanıyor, boru/UI yok.|P2|Köşe askı seçeneğini tamamla.|
|MP052|Kademeli L-Askı farklı yükseklik şablonu|MP §4; §6.1; §9 A1–2; §10|CS, CO, WM, MAT, MC, MS|T1, T2, T5, T6|T4 staged L rods|PASS|—|—|—|
|MP053|Dar servis nişinde gerçek eşya en/derinlik/boy sığması|MP §4; §6.1; §9 A1–2; §10|CS, CO, WM, MAT, MC, MS|T1, T2, T5, T6|T1 #6/#14; CS|PASS|—|—|—|
|MP054|Servis nişi 30–50 mm el/tutma payı|MP §4; §6.1; §9 A1–2; §10|CS, CO, WM, MAT, MC, MS|T1, T2, T5, T6|T1 #6; CS handClearanceMm|PASS|—|—|—|
|MP055|Kancalı eşya kaldırma payı|MP §4; §6.1; §9 A1–2; §10|CS, CO, WM, MAT, MC, MS|—|S/CS incelemesi|FAIL|AUD-025: asma/kaldırma alanı yok.|P2|Opsiyonel kaldırma payını doğrulamaya kat.|
|MP056|Etkin açıklık ve 110° menteşe çıkıntısı; 155° çözümü|MP §4; §6.1; §9 A1–2; §10|CS, CO, WM, MAT, MC, MS|T1, T2, T5, T6|T1 #11/#14; T4 QuickFix|PASS|—|—|—|
|MP057|Tüm mühendislik eşiklerini validationConfig içinde toplama|MP §4; §6.1; §9 A1–2; §10|CS, CO, WM, MAT, MC, MS|—|Kaynak taraması|FAIL|AUD-019: ortak yapılandırma yok.|P2|Küçük ortak eşik kaynağı.|
|MP058|Hata/Uyarı/Bilgi/Uzman dört seviye|MP §4; §6.1; §9 A1–2; §10|CS, CO, WM, MAT, MC, MS|T1, T2, T5, T6|S ValidationIssue; CS/SA; PP|PASS|—|—|—|
|MP059|Parça/hücre statik çakışmalarını saptama|MP §4; §6.1; §9 A1–2; §10|CS, CO, WM, MAT, MC, MS|T1, T2, T5, T6|I:organizers-do-not-intersect; L-without-junction|PARTIAL|AUD-002/003: tüm statik çiftler kapsanmıyor.|P1|Gövde/organizer invariantlarını ekle.|
|MP060|Menteşeli kapak kenarının dikmeye oturma kontrolü|MP §4; §6.1; §9 A1–2; §10|CS, CO, WM, MAT, MC, MS|—|CS/FC yerleşimi|UNVERIFIED|Genel tüm özel front sınırları için bağımsız tam oturma taraması yapılmadı.|P2|UAT-13 ve hedefli sınır regresyonu.|
|MP061|Her gerçek >600 mm menteşeli kanada uyarı|MP §4; §6.1; §9 A1–2; §10|CS, CO, WM, MAT, MC, MS|T1, T2, T5, T6|I:*:wide-hinge-warning|PARTIAL|AUD-008: çift/özel kanatlarda eksik.|P2|Ortak gerçek kanat kontrolü.|
|MP062|18 mm raf açıklığı >850 mm sehim uyarısı|MP §4; §6.1; §9 A1–2; §10|CS, CO, WM, MAT, MC, MS|T1, T2, T5, T6|I:diagonal 1662 mm; T1/CS; PRO|PASS|—|—|—|
|MP063|Önden askıda <530 mm net derinlik uyarısı|MP §4; §6.1; §9 A1–2; §10|CS, CO, WM, MAT, MC, MS|—|CS:2015|PARTIAL|AUD-019: eşik 520, 520–529 aralığı kaçıyor.|P2|Onaylı 530 eşiğiyle tutarlı yap.|
|MP064|İç çekmecede menteşe/çıta önerisi|MP §4; §6.1; §9 A1–2; §10|CS, CO, WM, MAT, MC, MS|T1, T2, T5, T6|T1 #11; T4 hinge 155|PASS|—|—|—|
|MP065|L köşe kapak/çekmece/kulp hacimsel hareket kısıtı|MP §4; §6.1; §9 A1–2; §10|CS, CO, WM, MAT, MC, MS|T1, T2, T5, T6|T5/T6; MC; I:thin-fast|PASS|—|—|—|
|MP066|Duvar gönyesi, nem/havalandırma, yük ve ankraj uzman sınırı|MP §4; §6.1; §9 A1–2; §10|CS, CO, WM, MAT, MC, MS|T1, T2, T5, T6|PRO notes; AUD-026/028|EXTERNAL VERIFICATION|Genel uzman notu var; gerçek saha/malzeme denetimi yapılmadı.|EXTERNAL|Yerinde ölçü ve donanım onayı.|
|MP067|Doğru tasarım niyeti ve çözüm arasında sessiz köşe ölçüsü değiştirmeme|MP §4; §6.1; §9 A1–2; §10|CS, CO, WM, MAT, MC, MS|T1, T2, T5, T6|I:corner-arm-clamp|PARTIAL|AUD-012:600→1150 sessiz alt sınır.|P2|Açık ret/öneri.|

## Ana plan — iş akışı, görsel sistem ve saklama

|Kimlik|Gereksinim|Kaynak|Kod|Test|Sonuç / kanıt|Durum|Eksik / sınır|Önem|Öneri|
|---|---|---|---|---|---|---|---|---|---|
|MP068|Oda/Gövde, İç/Kapak, Malzeme/Çıktı üç adım|MP §5; §7–8; §9 A2–3; §12|APP, WC, POP, WM, MAT, IT, ST|T1, T2|B:oda→iç→malzeme|PASS|—|—|—|
|MP069|Global 3D perspektif|MP §5; §7–8; §9 A2–3; §12|APP, WC, POP, WM, MAT, IT, ST|T1, T2|B:camera; browser-final.jpg|PASS|—|—|—|
|MP070|Global 2D ölçülü A/B cephe|MP §5; §7–8; §9 A2–3; §12|APP, WC, POP, WM, MAT, IT, ST|T1, T2|B:canvas-marquee; WC|PASS|—|—|—|
|MP071|Global 2D üst plan|MP §5; §7–8; §9 A2–3; §12|APP, WC, POP, WM, MAT, IT, ST|T1, T2|B:room-obstacle|PASS|—|—|—|
|MP072|Kapak kapalı/açık/X-Ray/gizli anahtarları|MP §5; §7–8; §9 A2–3; §12|APP, WC, POP, WM, MAT, IT, ST|T1, T2|B:sliding ve hidden; WC|PASS|—|—|—|
|MP073|İç eşyalar genel göster/gizle|MP §5; §7–8; §9 A2–3; §12|APP, WC, POP, WM, MAT, IT, ST|T1, T2|I:items:global-hide-includes-service|PARTIAL|AUD-014 servis eşyası istisnası.|P3|Genel anahtarı tüm eşyalara uygula.|
|MP074|Global Undo/Redo ve adlandırılmış sürüm erişimi|MP §5; §7–8; §9 A2–3; §12|APP, WC, POP, WM, MAT, IT, ST|T1, T2|B:history-after-open/version-lifecycle|PASS|—|—|—|
|MP075|Hücre hacmi seçimi ve sağ bağlamsal denetçi|MP §5; §7–8; §9 A2–3; §12|APP, WC, POP, WM, MAT, IT, ST|T1, T2|B:items-raycast|PASS|—|—|—|
|MP076|Hızlı dikey/yatay bölme|MP §5; §7–8; §9 A2–3; §12|APP, WC, POP, WM, MAT, IT, ST|T1, T2|T1 #9; B:virtual-cell-edit|PASS|—|—|—|
|MP077|Hazır modül atama|MP §5; §7–8; §9 A2–3; §12|APP, WC, POP, WM, MAT, IT, ST|T1, T2|T1; B:shelfStack; IR|PASS|—|—|—|
|MP078|Sayısal/kaydırıcı ölçü düzenleme|MP §5; §7–8; §9 A2–3; §12|APP, WC, POP, WM, MAT, IT, ST|T1, T2|B:drawer-edit/corner-resize|PASS|—|—|—|
|MP079|Sabit panellerde 1 mm hassasiyet ve 10 mm ok adımı|MP §5; §7–8; §9 A2–3; §12|APP, WC, POP, WM, MAT, IT, ST|T1, T2|T1 mm; DO/POP step kaynakları|PASS|—|—|—|
|MP080|Ayarlı rafta 32 mm sistem adımı|MP §5; §7–8; §9 A2–3; §12|APP, WC, POP, WM, MAT, IT, ST|—|AUD-018|FAIL|Sistem ızgarası/datum yok.|P2|Ayarlı raf davranışını tamamla.|
|MP081|Zengin PBR ahşap kataloğu|MP §5; §7–8; §9 A2–3; §12|APP, WC, POP, WM, MAT, IT, ST|T1, T2|T1 #31; B:materials-lighting|PASS|—|—|—|
|MP082|Mat/parlak lake malzemeleri|MP §5; §7–8; §9 A2–3; §12|APP, WC, POP, WM, MAT, IT, ST|T1, T2|MAT katalog/shader; T1 #31|PASS|—|—|—|
|MP083|Cam/ayna malzeme görünümü ve ayrı yapım uyarısı|MP §5; §7–8; §9 A2–3; §12|APP, WC, POP, WM, MAT, IT, ST|T1, T2|T1 #32; MAT|PASS|—|—|—|
|MP084|Metal malzeme|MP §5; §7–8; §9 A2–3; §12|APP, WC, POP, WM, MAT, IT, ST|T1, T2|MAT; T1 #31|PASS|—|—|—|
|MP085|Gövde/raf/kapak/çekmece malzemesini bağımsız seçme|MP §5; §7–8; §9 A2–3; §12|APP, WC, POP, WM, MAT, IT, ST|—|APP:1510; AUD-030|PARTIAL|Gövde seçimi bağımsız raf seçimini de aynı değere yazıyor.|P2|Gövde ve raf override niyetini ayır.|
|MP086|Düzenleme/Sunum geçişi|MP §5; §7–8; §9 A2–3; §12|APP, WC, POP, WM, MAT, IT, ST|T1, T2|B:materials-lighting|PASS|—|—|—|
|MP087|IBL ve yönlü gölge|MP §5; §7–8; §9 A2–3; §12|APP, WC, POP, WM, MAT, IT, ST|T1, T2|WC envMap/directionalLight; browser-final.jpg|PASS|—|—|—|
|MP088|Sunumda N8AO iç köşe gölgesi|MP §5; §7–8; §9 A2–3; §12|APP, WC, POP, WM, MAT, IT, ST|—|AUD-020; package.json/WC|FAIL|Postprocessing/N8AO yok.|P2|Hedef cihaz ölçümüyle tamamla.|
|MP089|ContactShadows|MP §5; §7–8; §9 A2–3; §12|APP, WC, POP, WM, MAT, IT, ST|T1, T2|WC; browser-material-led.jpg|PASS|—|—|—|
|MP090|İç LED şeritlerinin raf/askı/köşede konumu|MP §5; §7–8; §9 A2–3; §12|APP, WC, POP, WM, MAT, IT, ST|T1, T2|T1 #35; B:materials-lighting|PASS|—|—|—|
|MP091|LED sıcaklık ve parlaklık ayarı|MP §5; §7–8; §9 A2–3; §12|APP, WC, POP, WM, MAT, IT, ST|T1, T2|T2 transaction; B:4000K|PASS|—|—|—|
|MP092|LED kol başına en fazla 1 hafif iç ışık|MP §5; §7–8; §9 A2–3; §12|APP, WC, POP, WM, MAT, IT, ST|—|WM:402; AUD-020|FAIL|Bay/köşe başına, toplam 8 kesiliyor.|P2|Kol bazında ışık bütçesi.|
|MP093|InstancedMesh ile eşya çoğaltma|MP §5; §7–8; §9 A2–3; §12|APP, WC, POP, WM, MAT, IT, ST|—|IT; AUD-020|FAIL|Ayrı mesh'ler kullanılıyor.|P2|Hedefli instance uygulaması.|
|MP094|Gerçek boylu kısa/uzun kıyafetler|MP §5; §7–8; §9 A2–3; §12|APP, WC, POP, WM, MAT, IT, ST|T1, T2|I:items:long-garment-keeps-physical-length|PARTIAL|AUD-015: dar hücreye küçültme.|P2|Nominal boyu koru.|
|MP095|Gerçek boylu kutu/hurç/çanta/valiz/ayakkabı|MP §5; §7–8; §9 A2–3; §12|APP, WC, POP, WM, MAT, IT, ST|—|IT; AUD-015|PARTIAL|Bazı boyutlar Math.min ile sığdırılıyor; çeşitler mevcut.|P2|Gerçek boy + sığmama gösterimi.|
|MP096|Servis nişinde ölçekli merdiven/ütü masası|MP §5; §7–8; §9 A2–3; §12|APP, WC, POP, WM, MAT, IT, ST|T1, T2|T1 #14; IT|PASS|—|—|—|
|MP097|Hedef cihazda Sunum/Düzenleme/X-Ray kare süresi ölçümü|MP §5; §7–8; §9 A2–3; §12|APP, WC, POP, WM, MAT, IT, ST|—|B görsel gözlem|UNVERIFIED|FPS/frame-time ölçülmedi; akıcılık sayısal kabulü yok.|P2|UAT-20 kısa cihaz ölçümü.|
|MP098|Her komut sonrası otomatik kalıcı kayıt|MP §5; §7–8; §9 A2–3; §12|APP, WC, POP, WM, MAT, IT, ST|T1, T2|PER; B:F5|PARTIAL|Olağan kayıt çalışıyor; AUD-001/007 uç koşullar.|P1|Kayıt revizyonu/yedekler.|
|MP099|Taşınabilir wardrobe.json üretimi ve geri yükleme|MP §5; §7–8; §9 A2–3; §12|APP, WC, POP, WM, MAT, IT, ST|T1, T2|I:*:round-trip; B:json-preview|PARTIAL|İçerik yolu doğru; gerçek tarayıcı indirme dosyası doğrulanamadı.|P2|UAT-30 gerçek indirme.|
|MP100|schemaVersion 1 ve eksik opsiyonel alanlara varsayılanlar|MP §5; §7–8; §9 A2–3; §12|APP, WC, POP, WM, MAT, IT, ST|T1, T2|T1 #7; I:legacy:*; S|PASS|—|—|—|
|MP101|JSON tüm geçersiz global durumları reddeder|MP §5; §7–8; §9 A2–3; §12|APP, WC, POP, WM, MAT, IT, ST|T1, T2|I:json-reject:* ve validation-gap:*|PARTIAL|AUD-002: temel şema iyi, grafik invariantı eksik.|P1|Ortak giriş doğrulaması.|
|MP102|Slider jestini tek history transaction sayma|MP §5; §7–8; §9 A2–3; §12|APP, WC, POP, WM, MAT, IT, ST|T1, T2|T2 LED gesture|PASS|—|—|—|
|MP103|En az 50 okunabilir Undo adımı|MP §5; §7–8; §9 A2–3; §12|APP, WC, POP, WM, MAT, IT, ST|T1, T2|T2 75 işlem/checkpoint|PASS|—|—|—|
|MP104|Sayfa yenileme/JSON aynı geometri|MP §5; §7–8; §9 A2–3; §12|APP, WC, POP, WM, MAT, IT, ST|T1, T2|B:F5 olağan yol; I:legacy ve fixture round-trip|PASS|Hydration yarış koşulu ayrı MP098/AUD-001.|—|—|

## Ana plan — Aşama 4 ve Aşama 5 kabul ayrıntıları

|Kimlik|Gereksinim|Kaynak|Kod|Test|Sonuç / kanıt|Durum|Eksik / sınır|Önem|Öneri|
|---|---|---|---|---|---|---|---|---|---|
|MP105|Anne/Baba boy profilleri ve canlı erişim sınırları|MP §2; §9 A4–5; §10; §12.3|SA, INV, P4UI, AO, VER, VA, VP, PRO, TS, PP|T4, T7, T8|T4 reach; B:room-obstacle|PASS|—|—|—|
|MP106|2D/3D ergonomi ısı haritası|MP §2; §9 A4–5; §10; §12.3|SA, INV, P4UI, AO, VER, VA, VP, PRO, TS, PP|T4, T7, T8|AO; T4 reach|PASS|—|—|—|
|MP107|Anne/Baba göz hizası kamera ön ayarı|MP §2; §9 A4–5; §10; §12.3|SA, INV, P4UI, AO, VER, VA, VP, PRO, TS, PP|T4, T7, T8|T4 eyeCamera; B:Anne 1395|PASS|—|—|—|
|MP108|Bay/hücre Anne/Baba/Ortak sahipliği ve renk katmanı|MP §2; §9 A4–5; §10; §12.3|SA, INV, P4UI, AO, VER, VA, VP, PRO, TS, PP|T4, T7, T8|T4 ownership; AO|PASS|—|—|—|
|MP109|Gerçek ölçülü hedef envanter sayacı|MP §2; §9 A4–5; §10; §12.3|SA, INV, P4UI, AO, VER, VA, VP, PRO, TS, PP|T4, T7, T8|T4 physical dimensions; I:common-not-duplicated|PASS|—|—|—|
|MP110|Askı uzunluğu/raf alanı/çekmece hacmi kapasite metrikleri|MP §2; §9 A4–5; §10; §12.3|SA, INV, P4UI, AO, VER, VA, VP, PRO, TS, PP|T4, T7, T8|I:summary-metrics; drawer-small|PARTIAL|AUD-005/022: uç hacim ve iki özet farklı tanımda.|P2|Tek gerçek kapasite tanımı.|
|MP111|Ortak alanı iki kişiye iki kez saymama|MP §2; §9 A4–5; §10; §12.3|SA, INV, P4UI, AO, VER, VA, VP, PRO, TS, PP|T4, T7, T8|I:12+4=16; T4 common|PASS|—|—|—|
|MP112|Birlikte envanter hedeflerini sırayla rezervasyon|MP §2; §9 A4–5; §10; §12.3|SA, INV, P4UI, AO, VER, VA, VP, PRO, TS, PP|T4, T7, T8|I:inventory ters sıra; T4|PASS|İlk hedef 12, ikinci 4; ters sıra kişiyi değiştirir. Optimum/adil dağılım garantisi yok.|—|—|
|MP113|Oda engellerini gerçek yükseklik/ayak iziyle modelleme|MP §2; §9 A4–5; §10; §12.3|SA, INV, P4UI, AO, VER, VA, VP, PRO, TS, PP|T4, T7, T8|T4; B:bed|PASS|—|—|—|
|MP114|Yatak, oda kapısı, pencere, radyatör, priz|MP §2; §9 A4–5; §10; §12.3|SA, INV, P4UI, AO, VER, VA, VP, PRO, TS, PP|T4, T7, T8|P4UI 9 tür; T4 obstacle|PASS|—|—|—|
|MP115|Kolon/kiriş/diğer engeller|MP §2; §9 A4–5; §10; §12.3|SA, INV, P4UI, AO, VER, VA, VP, PRO, TS, PP|T4, T7, T8|P4UI; T4 column|PASS|—|—|—|
|MP116|2D kapak/çekmece süpürme alanı|MP §2; §9 A4–5; §10; §12.3|SA, INV, P4UI, AO, VER, VA, VP, PRO, TS, PP|T4, T7, T8|T4 sweep; B:room-plan|PASS|—|—|—|
|MP117|Oda engeliyle gövde ve hareket çakışması uyarısı|MP §2; §9 A4–5; §10; §12.3|SA, INV, P4UI, AO, VER, VA, VP, PRO, TS, PP|T4, T7, T8|T4; B:collision/QuickFix|PASS|—|—|—|
|MP118|Yüklük ve kör köşe valiz şablonları|MP §2; §9 A4–5; §10; §12.3|SA, INV, P4UI, AO, VER, VA, VP, PRO, TS, PP|T4, T7, T8|T4 deepYukluk/blindLuggage|PASS|—|—|—|
|MP119|Takı/pantolon/çamaşır şablonları|MP §2; §9 A4–5; §10; §12.3|SA, INV, P4UI, AO, VER, VA, VP, PRO, TS, PP|T4, T7, T8|T4; I:organizers|PARTIAL|AUD-003 organizer yerleşimi; diğer şablonlar mevcut.|P1|Takı bölücü kapanışı.|
|MP120|Bay kopyalama ve simetrik yansıtma|MP §2; §9 A4–5; §10; §12.3|SA, INV, P4UI, AO, VER, VA, VP, PRO, TS, PP|T4, T7, T8|T4 fresh IDs/mirror/unsupported-copy rejection|PASS|—|—|—|
|MP121|Neden açıklaması ve Quick-Fix tek Undo|MP §2; §9 A4–5; §10; §12.3|SA, INV, P4UI, AO, VER, VA, VP, PRO, TS, PP|T4, T7, T8|T4; B:bedZ2230|PASS|—|—|—|
|MP122|Adlandırılmış sürüm oluştur/yeniden adlandır/arşivle/aç|MP §2; §9 A4–5; §10; §12.3|SA, INV, P4UI, AO, VER, VA, VP, PRO, TS, PP|T4, T7, T8|T7; B:version-lifecycle/history-after-open|PASS|—|—|—|
|MP123|Yan yana kapasite/envanter/ölçü fark tablosu|MP §2; §9 A4–5; §10; §12.3|SA, INV, P4UI, AO, VER, VA, VP, PRO, TS, PP|T4, T7, T8|T7 metrics; B:a-b|PARTIAL|AUD-021: kapasite/parça var; dış kol ölçü fark satırları yok.|P2|Ölçü satırlarını ekle.|
|MP124|Dış AI için tam Design JSON istemi|MP §2; §9 A4–5; §10; §12.3|SA, INV, P4UI, AO, VER, VA, VP, PRO, TS, PP|T4, T7, T8|T7 prompt; browser-ai-prompt.txt|PASS|—|—|—|
|MP125|Dış JSON önizleme→ayrı varyant; aktif tasarıma açık açma|MP §2; §9 A4–5; §10; §12.3|SA, INV, P4UI, AO, VER, VA, VP, PRO, TS, PP|T4, T7, T8|T7; B:json-preview/history-after-open|PASS|—|—|—|
|MP126|AI yolunda yinelenmiş/eksik ID, bozuk tür/ölçü/referans retleri|MP §2; §9 A4–5; §10; §12.3|SA, INV, P4UI, AO, VER, VA, VP, PRO, TS, PP|T4, T7, T8|I:10 ret örneği; AUD-002|PARTIAL|Yerel negatifler reddediliyor; birleşimsiz L kabul ediliyor.|P1|Grafik doğrulamasını tamamla.|
|MP127|Ölçülü SVG/PDF teknik paftalar|MP §2; §9 A4–5; §10; §12.3|SA, INV, P4UI, AO, VER, VA, VP, PRO, TS, PP|T4, T7, T8|P:127 sayfa; I:SVG eşitliği|PARTIAL|AUD-016/017: çizim görünürlüğü/bilgi kapsamı eksik.|P2|Pafta ve alan kapsamı.|
|MP128|Tam CSV kesim/parça listesi|MP §2; §9 A4–5; §10; §12.3|SA, INV, P4UI, AO, VER, VA, VP, PRO, TS, PP|T4, T7, T8|P:69/94/81/94 tekil; I:csv-bytes|PASS|Nominal ölçü ve kod tutarlılığı; AUD-003 ortak geometrisi ayrıca hatalı.|—|—|
|MP129|Uzman doğrulama raporu ve kritik üretim kapısı|MP §2; §9 A4–5; §10; §12.3|SA, INV, P4UI, AO, VER, VA, VP, PRO, TS, PP|T4, T7, T8|T8; B:rail 50|PARTIAL|Algılanan kritiklerde kapı çalışır; AUD-002/003/006 kapsam dışında kalıyor.|P1|Eksik invariantları kapıya bağla.|
|MP130|Teknik çizim/CSV/Solver mm eşitliği|MP §2; §9 A4–5; §10; §12.3|SA, INV, P4UI, AO, VER, VA, VP, PRO, TS, PP|T4, T7, T8|I/P tüm nominal kesimler eşit|PARTIAL|AUD-009 merkez 1 mm ve AUD-003 ortak geometri hatası; eşitlik tek başına doğruluk değil.|P2|Kapalı render ve üretim yerleşimini eşitle.|
|MP131|Dev/test/build sıfır hata|MP §2; §9 A4–5; §10; §12.3|SA, INV, P4UI, AO, VER, VA, VP, PRO, TS, PP|T4, T7, T8|tests.log 120/120; build.log exit 0|PASS|Bundle>500 kB uyarısı var; derleme hatası değil.|—|—|
|MP132|Gerçek 3D/2D/X-Ray ve hareket eksenleri görsel kabulü|MP §2; §9 A4–5; §10; §12.3|SA, INV, P4UI, AO, VER, VA, VP, PRO, TS, PP|—|B:20 senaryo|PARTIAL|Tüm görünüm sıraları ve tüm malzeme/kalınlık kombinasyonları tüketilmedi.|P2|UAT görünüm ve malzeme turu.|
|MP133|Gerçek oda ölçülerini kullanıcı sonradan girebilir|MP §2; §9 A4–5; §10; §12.3|SA, INV, P4UI, AO, VER, VA, VP, PRO, TS, PP|T4, T7, T8|P4UI/APP; AUD-006|PARTIAL|Oda/gövde girişi var; tavan çapraz kontrolü eksik.|P2|Tavan uyumunu doğrula.|

## Ana plan — bilinçli ertelenen ve koşullu kapsam

|Kimlik|Gereksinim|Kaynak|Kod|Test|Sonuç / kanıt|Durum|Eksik / sınır|Önem|Öneri|
|---|---|---|---|---|---|---|---|---|---|
|DEF01|U planlı dolap|MP §2 SeviyeC; §6.1.3; §11; §12; §14|S, APP, WC, PRO|—|Ana sözleşme ve mevcut kapsam|DEFERRED|—|—|v2+; beş aşama eksiği değil.|
|DEF02|Ada / walk-in yerleşim|MP §2 SeviyeC; §6.1.3; §11; §12; §14|S, APP, WC, PRO|—|Ana sözleşme ve mevcut kapsam|DEFERRED|—|—|v2+.|
|DEF03|Eğimli tavan ve serbest poligon planlar|MP §2 SeviyeC; §6.1.3; §11; §12; §14|S, APP, WC, PRO|—|Ana sözleşme ve mevcut kapsam|DEFERRED|—|—|v2+.|
|DEF04|Sıkıştırılmış glTF kıyafet paketleri|MP §2 SeviyeC; §6.1.3; §11; §12; §14|S, APP, WC, PRO|—|Ana sözleşme ve mevcut kapsam|DEFERRED|—|—|v2+; mevcut prosedürel eşya ayrı.|
|DEF05|Kullanım sıklığı simülasyonu|MP §2 SeviyeC; §6.1.3; §11; §12; §14|S, APP, WC, PRO|—|Ana sözleşme ve mevcut kapsam|DEFERRED|—|—|v2+.|
|DEF06|Envanterden otomatik optimum yerleşim|MP §2 SeviyeC; §6.1.3; §11; §12; §14|S, APP, WC, PRO|—|Ana sözleşme ve mevcut kapsam|DEFERRED|—|—|v2+; mevcut ilk-uygun rezervasyonla karıştırma.|
|DEF07|Çok kullanıcı/bulut/kimlik doğrulama|MP §2 SeviyeC; §6.1.3; §11; §12; §14|S, APP, WC, PRO|—|Ana sözleşme ve mevcut kapsam|DEFERRED|—|—|v2+.|
|DEF08|Uygulama içi ücretli LLM API|MP §2 SeviyeC; §6.1.3; §11; §12; §14|S, APP, WC, PRO|—|Ana sözleşme ve mevcut kapsam|DEFERRED|—|—|v2+; dış tam JSON köprüsü zorunlu ve mevcut.|
|DEF09|CNC delik/kesim dosyaları DXF/MPR|MP §2 SeviyeC; §6.1.3; §11; §12; §14|S, APP, WC, PRO|—|Ana sözleşme ve mevcut kapsam|DEFERRED|—|—|v2+.|
|DEF10|Stok levha kesim optimizasyonu/nesting|MP §2 SeviyeC; §6.1.3; §11; §12; §14|S, APP, WC, PRO|—|Ana sözleşme ve mevcut kapsam|DEFERRED|—|—|v2+; net parça alanı fire hesabı değildir.|
|DEF11|Döner karusel|MP §2 SeviyeC; §6.1.3; §11; §12; §14|S, APP, WC, PRO|—|Ana sözleşme ve mevcut kapsam|DEFERRED|—|—|v2+.|
|DEF12|Pantograf mekanizması|MP §2 SeviyeC; §6.1.3; §11; §12; §14|S, APP, WC, PRO|—|Ana sözleşme ve mevcut kapsam|DEFERRED|—|—|v2+.|
|DEF13|GPU path-tracing fotoğraf modu|MP §2 SeviyeC; §6.1.3; §11; §12; §14|S, APP, WC, PRO|—|Ana sözleşme ve mevcut kapsam|DEFERRED|—|—|v2+.|
|DEF14|WebGPU|MP §2 SeviyeC; §6.1.3; §11; §12; §14|S, APP, WC, PRO|—|Ana sözleşme ve mevcut kapsam|DEFERRED|—|—|v2+; WebGL geçerli.|
|DEF15|AR görünümü|MP §2 SeviyeC; §6.1.3; §11; §12; §14|S, APP, WC, PRO|—|Ana sözleşme ve mevcut kapsam|DEFERRED|—|—|v2+.|
|DEF16|Doğrulanmış biFold köşe kapağı|MP §2 SeviyeC; §6.1.3; §11; §12; §14|S, APP, WC, PRO|—|Ana sözleşme ve mevcut kapsam|EXTERNAL VERIFICATION|Donanım/prototip doğrulanırsa koşullu; mevcut zorunlu teslim önkoşulu değil.|EXTERNAL|Gerçek donanım/kinematik doğrulama sonrası karar.|
|DEF17|OpenCascade/WASM/CSG/Rapier/cloth/AccumulativeShadows eklememe kararı|MP §2 SeviyeC; §6.1.3; §11; §12; §14|S, APP, WC, PRO|—|package.json; kaynak|PASS|Bunlar ertelenen özellik değil; reddedilmiş teknik karmaşıklık.|—|—|
|DEF18|Sürgülüyü isteğe bağlı sayan eski varsayımın geçersizliği|MP §2 SeviyeC; §6.1.3; §11; §12; §14|S, APP, WC, PRO|—|Ek D–F ve güncel FE/MC|PASS|Güncel zorunlu kapsamda denetlendi.|—|—|
|DEF19|Eski OneDrive dizini varsayımı yerine güncel C:/dev çalışma sınırı|MP §2 SeviyeC; §6.1.3; §11; §12; §14|S, APP, WC, PRO|—|baseline-manifest; yeni artefakt yolları|PASS|Son kullanıcı talimatı öncelikli; eski yol kullanılmadı.|—|—|

## Ek A — menteşeli hareket

|Kimlik|Gereksinim|Kaynak|Kod|Test|Sonuç / kanıt|Durum|Eksik / sınır|Önem|Öneri|
|---|---|---|---|---|---|---|---|---|---|
|A01|Kapak/kulptan gerçek pivotta açılma|EK A; Ana §4.3|MS, MC, WM, ST|T1 #12/#20; T2; T5, T6|I:hinged-center|PARTIAL|AUD-009 1 mm merkez sapması.|P2|Ortak pivot hesabı.|
|A02|Açık kapağın akıcı kapanması|EK A; Ana §4.3|MS, MC, WM, ST|T1 #12/#20; T2; T5, T6|MS; T5/T6|PASS|—|—|—|
|A03|Yarıda konum sıçramadan ters yön|EK A; Ana §4.3|MS, MC, WM, ST|T1 #12/#20; T2; T5, T6|I:motion:mid-flight-reversal|PASS|—|—|—|
|A04|110/155/165° gerçek açı sınırları|EK A; Ana §4.3|MS, MC, WM, ST|T1 #12/#20; T2; T5, T6|T2 açı testleri|PASS|—|—|—|
|A05|İç çekmece açıkken önce çekmeceyi kapatma|EK A; Ana §4.3|MS, MC, WM, ST|T1 #12/#20; T2; T5, T6|T1 #12|PASS|—|—|—|

## Ek B — çekmece hareketi

|Kimlik|Gereksinim|Kaynak|Kod|Test|Sonuç / kanıt|Durum|Eksik / sınır|Önem|Öneri|
|---|---|---|---|---|---|---|---|---|---|
|B01|Kasa/ön/kulp aynı hareketli birimde|EK B|CS, MS, WM, ST|T1 #12/#13/#20; T5, T6|T1 #13; WM; B:açık çekmeceler|PASS|—|—|—|
|B02|Tıklamayla açma/kapatma|EK B|CS, MS, WM, ST|T1 #12/#13/#20; T5, T6|B:motion-interlock; T1 #20|PASS|—|—|—|
|B03|Hareket sırasında kesintisiz ters yön|EK B|CS, MS, WM, ST|T1 #12/#13/#20; T5, T6|MS ortak yay; T5 hareket sınırları|PASS|—|—|—|
|B04|0.80 kısmi /1.0 tam çekme rayı seçimi|EK B|CS, MS, WM, ST|—|AUD-023|FAIL|Sabit 0.82.|P2|Ray tipi/çıkma seçimi.|
|B05|İç çekmece öncesinde örtücü kapak açma|EK B|CS, MS, WM, ST|T1 #12/#13/#20; T5, T6|T1 #12; MS|PASS|—|—|—|

## Ek C — kulp kataloğu

|Kimlik|Gereksinim|Kaynak|Kod|Test|Sonuç / kanıt|Durum|Eksik / sınır|Önem|Öneri|
|---|---|---|---|---|---|---|---|---|---|
|C01|Altı kulp modeli|EK C; Ana §9 A3|HM, CS, APP, POP, FE|T1 #33/#37|HM ve UI katalogları|PASS|—|—|—|
|C02|Beş renk/yüzey seçeneği|EK C; Ana §9 A3|HM, CS, APP, POP, FE|T1 #33/#37|HM; drawer UI|PASS|—|—|—|
|C03|Farklı uzunluklar|EK C; Ana §9 A3|HM, CS, APP, POP, FE|T1 #33/#37|T1 #33; UI96/160/220/320 vb.|PASS|Belgedeki uzunluklar örnektir; her örneğin birebir zorunlu sabit liste olması yorumlanmadı.|—|—|
|C04|Dikey/yatay ve üst/orta/alt konum|EK C; Ana §9 A3|HM, CS, APP, POP, FE|T1 #33/#37|CS/HM; T1 #33|PASS|—|—|—|
|C05|Kapak ve çekmece genel kulplarının bağımsızlığı|EK C; Ana §9 A3|HM, CS, APP, POP, FE|T1 #33/#37|T1 #33/#37|PASS|—|—|—|
|C06|Bireysel kulp override ve hareketle birlikte bağlılık|EK C; Ana §9 A3|HM, CS, APP, POP, FE|T1 #33/#37|T1 #33; WM; B:kulp sürükleme|PASS|—|—|—|
|C07|18→25 mm kalınlıkta yüzeye bağlı kulp konumu|EK C; Ana §9 A3|HM, CS, APP, POP, FE|T1 #33/#37|T1 #33|PASS|—|—|—|

## Ek D — zorunlu sürgülü/karma cephe

|Kimlik|Gereksinim|Kaynak|Kod|Test|Sonuç / kanıt|Durum|Eksik / sınır|Önem|Öneri|
|---|---|---|---|---|---|---|---|---|---|
|D01|Tamamen menteşeli gardırop|EK D; Ek §6 A5|SL, FC, FE, MC, CS|T5, T6, T7|T1 otomatik kapaklar; I:eski örnekler|PASS|—|—|—|
|D02|Tamamen 2 raylı sürgülü gardırop|EK D; Ek §6 A5|SL, FC, FE, MC, CS|T5, T6, T7|I:2 track 2..6 leaf; B:track 2|PASS|—|—|—|
|D03|Tamamen 3 raylı sürgülü gardırop|EK D; Ek §6 A5|SL, FC, FE, MC, CS|T5, T6, T7|I:3 track 2..6 leaf; B:üç ray|PASS|—|—|—|
|D04|Aynı tasarımda sürgülü/menteşeli/açık karma|EK D; Ek §6 A5|SL, FC, FE, MC, CS|T5, T6, T7|T5 hibrit; B:üst 2 menteşe/alt 2 sürgü|PASS|—|—|—|
|D05|Ray derinliği ve track ofsetlerinin modele katılması|EK D; Ek §6 A5|SL, FC, FE, MC, CS|T5, T6, T7|T5; B:100 mm ön ek, 50 mm kritik|PASS|—|—|—|
|D06|Bindirme ve gerçek kanat genişlik kapanışı|EK D; Ek §6 A5|SL, FC, FE, MC, CS|T5, T6, T7|I:10 sistem; T5 eşit/özel genişlik|PASS|—|—|—|
|D07|İmkânsız ray/tek bölme/çekmece erişim uyarıları|EK D; Ek §6 A5|SL, FC, FE, MC, CS|T5, T6, T7|T5; B:kapalı ön çekmece reddi|PASS|—|—|—|
|D08|Gerçek profil/montaj/yük uygunluğu|EK D; Ek §6 A5|SL, FC, FE, MC, CS|T5, T6, T7|AUD-026|EXTERNAL VERIFICATION|Zarflar planlama; üretici kesiti/delikleri yok.|EXTERNAL|Katalog ve usta onayı.|

## Ek E — doğrudan sürgü sürükleme

|Kimlik|Gereksinim|Kaynak|Kod|Test|Sonuç / kanıt|Durum|Eksik / sınır|Önem|Öneri|
|---|---|---|---|---|---|---|---|---|---|
|E01|Kulptan gerçek fareyle sürükleme|EK E|SI, MC, MS, WM|T5, T7|B:1462 mm bırakma|PASS|—|—|—|
|E02|Normal modda yüzeyden doğrudan sürükleme|EK E|SI, MC, MS, WM|—|SI yüzey olayı|UNVERIFIED|Editör yüzey sürüklemesi denendi; normal yüzey sürüklemesi bu turda ayrıca uygulanmadı.|P2|UAT-25 yüzey deneyi.|
|E03|Fareyi izleme ve bırakılan geçerli pozda kalma|EK E|SI, MC, MS, WM|T5, T7|B:1462 mm; T7 manual pose/history|PASS|—|—|—|
|E04|Sol/sağ ray mekanik bitiş sınırları|EK E|SI, MC, MS, WM|T5, T7|T5 unequal widths/bounds; B:End/Home|PASS|—|—|—|
|E05|Aynı raydaki kanadı geçmeme|EK E|SI, MC, MS, WM|T5, T7|T5 fast same-track|PASS|—|—|—|

## Ek F — gerçek temas ve durdurma

|Kimlik|Gereksinim|Kaynak|Kod|Test|Sonuç / kanıt|Durum|Eksik / sınır|Önem|Öneri|
|---|---|---|---|---|---|---|---|---|---|
|F01|Açık çekmeceye yaklaşan sürgünün temas sınırında durması|EK F|MC, MS, KIN, SI|T5, T6, T7|B:1458 mm; T5 open drawer|PASS|—|—|—|
|F02|Çekmece kapanınca sürgü yolunun açılması|EK F|MC, MS, KIN, SI|T5, T6, T7|T5 engel pozuna göre sınır; MC|PASS|—|—|—|
|F03|L-köşe kapak/çekmece/kulp gerçek hacimleri|EK F|MC, MS, KIN, SI|T5, T6, T7|T6 corner; T5 protrusion|PASS|—|—|—|
|F04|Düşey aralık ve ön/arka ray derinlik ayrımı|EK F|MC, MS, KIN, SI|T5, T6, T7|T5 vertical separation/different tracks|PASS|—|—|—|
|F05|Hızlı harekette çok ince engelden tünellememe|EK F|MC, MS, KIN, SI|T5, T6, T7|I:0.2 mm engel, 489.9500001 mm duruş|PASS|—|—|—|
|F06|Başlangıç kesişmesini kritik hata sayma|EK F|MC, MS, KIN, SI|T5, T6, T7|I:initial-overlap; T6 closed overlap|PASS|—|—|—|
|F07|Deterministik sürekli kinematik; ağır fizik yok|EK F|MC, MS, KIN, SI|T5, T6, T7|MC/MS; package.json|PASS|—|—|—|

## Ek G — sahnede ölçü düzenleme

|Kimlik|Gereksinim|Kaynak|Kod|Test|Sonuç / kanıt|Durum|Eksik / sınır|Önem|Öneri|
|---|---|---|---|---|---|---|---|---|---|
|G01|Kol/köşe/derinlik/yükseklik/dış etiketinden düzenleme|EK G|DO, SD, POP, CS, ST|T1 #16/#17; T2|DO editTarget; T1 #16|PASS|—|—|—|
|G02|Enter/onay uygular, Escape iptal eder|EK G|DO, SD, POP, CS, ST|T1 #16/#17; T2|DO/SD olayları; B:Enter kullanılan alanlar|PASS|—|—|—|
|G03|Geçersiz ve sınır dışı değerde açık ret/uyarı|EK G|DO, SD, POP, CS, ST|T1 #16/#17; T2|I:corner-arm-clamp/global gaps|PARTIAL|AUD-002/012 tüm girişlerde tutarlı değil.|P1|Ortak doğrulama.|
|G04|Türetilmiş net etiketi dış kaynak ölçüye bağlama|EK G|DO, SD, POP, CS, ST|T1 #16/#17; T2|T1 #16|PASS|—|—|—|
|G05|Değişikliği tek Undo ve yerel kayda bağlama|EK G|DO, SD, POP, CS, ST|T1 #16/#17; T2|T1 #17; B:Undo|PARTIAL|Olağan yol iyi; AUD-001/007 kayıt uçları.|P1|Kayıt korumalarını tamamla.|
|G06|Etiket düzenlerken yanlış kamera hareketini durdurma|EK G|DO, SD, POP, CS, ST|T1 #16/#17; T2|DO event stop; B:boyut düzenleme|PASS|—|—|—|

## Ek H — checkpoint ve kalıcı geçmiş

|Kimlik|Gereksinim|Kaynak|Kod|Test|Sonuç / kanıt|Durum|Eksik / sınır|Önem|Öneri|
|---|---|---|---|---|---|---|---|---|---|
|H01|IndexedDB+senkron localStorage otomatik kurtarma|EK H|ST, APP|T1 #17; T2|PER|PARTIAL|AUD-001/007 gecikme/kota koşulları.|P1|Bağımsız yazma ve revizyon koruması.|
|H02|F5 sonrasında historyPast/historyFuture korunumu|EK H|ST, APP|T1 #17; T2|T2 session; B:F5/history-after-open|PASS|—|—|—|
|H03|Kaydet yeni checkpoint ve geçmiş sıfırlama|EK H|ST, APP|T1 #17; T2|T1 #17; B:checkpoint|PASS|—|—|—|
|H04|Kaydet konumu Ölçüler düğmesinin hemen solu|EK H|ST, APP|T1 #17; T2|browser-final.jpg|PASS|—|—|—|
|H05|Kaydedildi/değişti/otomatik kurtarma hata durumları|EK H|ST, APP|T1 #17; T2|B; PER:error|PASS|—|—|—|

## Ek I — görünüm, raycast, bağımsız aralık

|Kimlik|Gereksinim|Kaynak|Kod|Test|Sonuç / kanıt|Durum|Eksik / sınır|Önem|Öneri|
|---|---|---|---|---|---|---|---|---|---|
|I01|Normal/X-Ray/Gizle bütün geçiş sıraları|EK I|WC, WM, CS, TM, ST|—|WC/WM görünüm dalları|UNVERIFIED|Bu turda bütün permütasyonlar gerçek tarayıcıda denenmedi.|P2|UAT-08 geçiş turu.|
|I02|X-Ray sonrası Normal'de tüm kapak yüzeyi tıklanabilirliği|EK I|WC, WM, CS, TM, ST|—|WM Mesh.prototype.raycast kullanımı|UNVERIFIED|Bu özel dönüş sırası bu turda fareyle doğrulanmadı.|P2|UAT-08 yüzey tıklaması.|
|I03|Kapak/kulp tıklaması hücre seçimini değiştirmez|EK I|WC, WM, CS, TM, ST|T1 #18/#19/#20; T7|T1 #20; ST|PASS|—|—|—|
|I04|Çekmece ön/kulp tıklaması yalnız hareketi etkiler|EK I|WC, WM, CS, TM, ST|T1 #18/#19/#20; T7|T1 #20; B:drawer normal/edit ayrımı|PASS|—|—|—|
|I05|Kapalı opak kapak arkası hücreyi seçtirmeme|EK I|WC, WM, CS, TM, ST|T1 #18/#19/#20; T7|T7 sliding coverage; WC/WM|PASS|—|—|—|
|I06|Raf/ayakkabılık/çift askı/yüklük/köşe kararlı sanal aralık kimlikleri|EK I|WC, WM, CS, TM, ST|T1 #18/#19/#20; T7|T1 #18; I:resolved hücreler|PASS|—|—|—|
|I07|Tek görünür aralık seçimi yalnız o aralığı vurgular|EK I|WC, WM, CS, TM, ST|T1 #18/#19/#20; T7|B:corner second/three middle cells|PASS|—|—|—|
|I08|İhtiyaçta realizeSubInterval; komşuları koruma|EK I|WC, WM, CS, TM, ST|T1 #18/#19/#20; T7|T1 #19; B:547/359/359/359/548|PASS|—|—|—|
|I09|Dekoratif eşyalar ve analiz katmanı seçimi engellemez|EK I|WC, WM, CS, TM, ST|T1 #18/#19/#20; T7|B:items-raycast; NOOP_RAYCAST kaynakları|PASS|—|—|—|

## Ek J — çoklu seçim

|Kimlik|Gereksinim|Kaynak|Kod|Test|Sonuç / kanıt|Durum|Eksik / sınır|Önem|Öneri|
|---|---|---|---|---|---|---|---|---|---|
|J01|Seçim aracıyla 3D/2D dikdörtgen sürükleme|EK J|WC, ST, TM|T1 #21/#22|B:2D gerçek drag; WC|PASS|—|—|—|
|J02|Şeffaf iç, siyah kesikli kontrast kontur|EK J|WC, ST, TM|T1 #21/#22|browser-marquee.jpg; WC CSS|PASS|—|—|—|
|J03|Sürüklerken canlı kapsanan hücre vurgusu|EK J|WC, ST, TM|—|WC hoveredMarqueeCellIds|UNVERIFIED|Ara fare kareleri ayrı kaydedilmedi.|P3|UAT-09 canlı vurguyu gözle.|
|J04|Bırakınca selectedCellIds grubunu oluşturma|EK J|WC, ST, TM|T1 #21/#22|B:3 hücre/1113 mm|PASS|—|—|—|
|J05|Seçim esnasında OrbitControls devre dışı|EK J|WC, ST, TM|T1 #21/#22|WC controlsEnabled; B:drag|PASS|—|—|—|
|J06|Çoklu seçime ortak işlem ve tek Undo|EK J|WC, ST, TM|T1 #21/#22|T1 #22; B:count/equal|PASS|—|—|—|

## Ek K — bağlamsal panel

|Kimlik|Gereksinim|Kaynak|Kod|Test|Sonuç / kanıt|Durum|Eksik / sınır|Önem|Öneri|
|---|---|---|---|---|---|---|---|---|---|
|K01|Seçimin yanında tek/grup paneli|EK K|POP, SD, APP, TM|T1 #21–#24/#27|browser-drawer-editor.jpg; browser-final.jpg|PASS|—|—|—|
|K02|Dikey/yatay bölme ve modül atama|EK K|POP, SD, APP, TM|T1 #21–#24/#27|T1 #9; POP; B|PASS|—|—|—|
|K03|Sayı/ölçü/eşit/orantılı ortak işlemler|EK K|POP, SD, APP, TM|T1 #21–#24/#27|T1 #22/#24; B:count|PASS|—|—|—|
|K04|Panelin kamera izleme ve viewport sınırları|EK K|POP, SD, APP, TM|—|POP; B:1707×848 görünüm|PARTIAL|Dar ekran/tüm konumlarda taşmama ayrıca doğrulanmadı.|P2|UAT-14 ekran boyutu turu.|
|K05|Sağ gelişmiş denetçi aynı komutları kullanır|EK K|POP, SD, APP, TM|T1 #21–#24/#27|POP/APP→ST; B|PASS|—|—|—|
|K06|Uyumsuz seçimde açıklamalı devre dışı işlemler|EK K|POP, SD, APP, TM|T1 #21–#24/#27|TM grup analizleri; T1 #21/#27|PASS|—|—|—|

## Ek L — fiziksel grup ölçüleri

|Kimlik|Gereksinim|Kaynak|Kod|Test|Sonuç / kanıt|Durum|Eksik / sınır|Önem|Öneri|
|---|---|---|---|---|---|---|---|---|---|
|L01|Tek hücrede X/Y/Z gerçek eksen ölçüleri|EK L|SD, TM, CS|T1 #21; T2|browser-final.jpg; SD|PASS|—|—|—|
|L02|A/B kolunda yerel genişlik/derinlik yönü|EK L|SD, TM, CS|T1 #21; T2|CS mapRun; T5 B wall; I:runChecks|PASS|—|—|—|
|L03|Bitişik grubun ara paneller dahil gross ölçüsü|EK L|SD, TM, CS|T1 #21; T2|B:1113=1077+36; T1 #21|PASS|—|—|—|
|L04|Kopuk/farklı eksenli seçimde anlamsız toplam yapmama|EK L|SD, TM, CS|T1 #21; T2|TM analyzeSelectedCellsGroup; T1 #21/#27|PASS|—|—|—|

## Ek M — toplu boyutlandırma

|Kimlik|Gereksinim|Kaynak|Kod|Test|Sonuç / kanıt|Durum|Eksik / sınır|Önem|Öneri|
|---|---|---|---|---|---|---|---|---|---|
|M01|Oranları koru|EK M|TM, FM, POP, ST|T1 #22/#24|T1 #24|PASS|—|—|—|
|M02|Eşit dağıt|EK M|TM, FM, POP, ST|T1 #22/#24|T1 #22; B|PASS|—|—|—|
|M03|Raf/aralık sayısı 6→7 veya seçili grupta 2→3|EK M|TM, FM, POP, ST|T1 #22/#24|T1 #22; B:359/359/359|PASS|—|—|—|
|M04|Kalınlık ve tamsayı remainder sıfır kayıp|EK M|TM, FM, POP, ST|T1 #22/#24|I:3000 flex; B:gross 1113|PASS|—|—|—|

## Ek N — yönlü ölçü

|Kimlik|Gereksinim|Kaynak|Kod|Test|Sonuç / kanıt|Durum|Eksik / sınır|Önem|Öneri|
|---|---|---|---|---|---|---|---|---|---|
|N01|X sola/sağa yönlü genişlik|EK N|TM, POP, SD|—|TM X dalları|UNVERIFIED|Bu turda her iki X yönünde gerçek kullanıcı uç testi yapılmadı.|P2|UAT-10 X ankrajları.|
|N02|Y yukarı/aşağı ve komşu koruma|EK N|TM, POP, SD|T1 #23/#24; T2 Z front|T1 #23/#24; B:corner resize|PASS|—|—|—|
|N03|Z ön yönünde net derinlik|EK N|TM, POP, SD|T1 #23/#24; T2 Z front|T2 net 500 mm üç kalınlık|PASS|—|—|—|
|N04|Z arka yönünde sabit ön sınır|EK N|TM, POP, SD|—|I:Z-back-anchor|FAIL|AUD-004 sabit 600→508.|P1|Destekle veya açıkça reddet.|
|N05|Sabit/hareketli sınır etiketi gerçek sonuçla eşleşir|EK N|TM, POP, SD|T1 #23/#24; T2 Z front|AUD-004|PARTIAL|Z arka küçültme etiketi yanlış.|P1|Etiket ve commit tek sınır modeli.|

## Ek O — taslak çakışma ve geçmiş

|Kimlik|Gereksinim|Kaynak|Kod|Test|Sonuç / kanıt|Durum|Eksik / sınır|Önem|Öneri|
|---|---|---|---|---|---|---|---|---|---|
|O01|Komşuyu sessiz otomatik küçültmeme|EK O|TM, POP, WM, ST, PP|T1 #23/#24/#29; T2|B:64 mm çakışma önce taslak|PASS|—|—|—|
|O02|Draft intent ve kırmızı hacim|EK O|TM, POP, WM, ST, PP|T1 #23/#24/#29; T2|browser-corner-draft.jpg|PASS|—|—|—|
|O03|Milimetrik çakışma miktarı|EK O|TM, POP, WM, ST, PP|T1 #23/#24/#29; T2|B:64 mm|PASS|—|—|—|
|O04|Kullanıcı onayıyla komşuyu dengeleme|EK O|TM, POP, WM, ST, PP|T1 #23/#24/#29; T2|B:736/800/672|PASS|—|—|—|
|O05|Geçersiz taslağı geçerli/üretim geometriyle karıştırmama|EK O|TM, POP, WM, ST, PP|T1 #23/#24/#29; T2|TM/ST draft ayrımı; PP|PASS|—|—|—|
|O06|Toplu işlem tek Undo; JSON/checkpoint uyumu|EK O|TM, POP, WM, ST, PP|T1 #23/#24/#29; T2|T1 #23/#24; B:Undo|PASS|—|—|—|
|O07|Hafif parametrik çözüm; ağır fizik yok|EK O|TM, POP, WM, ST, PP|T1 #23/#24/#29; T2|TM; package.json|PASS|—|—|—|

## Ek P — bağımsız çekmece

|Kimlik|Gereksinim|Kaynak|Kod|Test|Sonuç / kanıt|Durum|Eksik / sınır|Önem|Öneri|
|---|---|---|---|---|---|---|---|---|---|
|P01|Kararlı cell+index kimliği ve bağımsız seçim|EK P|CS, WM, POP, ST, SD|T1 #13/#26; T2|T1 #26; B:drawer 1|PASS|—|—|—|
|P02|Normal tıklama aç/kapat|EK P|CS, WM, POP, ST, SD|T1 #13/#26; T2|T1 #20; B:motion-interlock|PASS|—|—|—|
|P03|Düzenleme/çoklu araçta tıklama seçim|EK P|CS, WM, POP, ST, SD|T1 #13/#26; T2|B:drawer-edit; T1 #26|PASS|—|—|—|
|P04|Shift/Ctrl ile birden fazla çekmece seçimi|EK P|CS, WM, POP, ST, SD|—|WM olayları; ST|UNVERIFIED|Hücre Ctrl denendi; çekmecelerde ayrı çoklu fare testi yapılmadı.|P2|UAT-11 çoklu çekmece.|
|P05|Tek ön yüksekliği ve kardeş dengeleme|EK P|CS, WM, POP, ST, SD|T1 #13/#26; T2|B:227→250, diğer 205/227; Undo|PASS|—|—|—|
|P06|Grup yüksekliği ve adet kontrolü|EK P|CS, WM, POP, ST, SD|T1 #13/#26; T2|T1 #26; POP|PASS|—|—|—|
|P07|X/Z fiziksel boyut düzenlemesi|EK P|CS, WM, POP, ST, SD|T1 #13/#26; T2|T2 Z; TM/POP|PASS|Tek çekmece derinliği grup/gövde niyetine bağlanır; bağımsız her çekmece gövdesi varsayılmadı.|—|—|
|P08|İç/dış çekmece konumu|EK P|CS, WM, POP, ST, SD|T1 #13/#26; T2|T1 #10/#12; CS|PASS|—|—|—|
|P09|Kızak mekanik parametre seçimi|EK P|CS, WM, POP, ST, SD|—|AUD-023|PARTIAL|Açılma testi var; ray tipi/çıkma seçimi yok.|P2|Kızak niyetini ekle.|
|P10|Çekmece ölçülerinde kalınlık ve gerçek net hacim|EK P|CS, WM, POP, ST, SD|T1 #13/#26; T2|I:drawer-small|PARTIAL|AUD-005 küçük ön/kalın taban neti fazla.|P2|Gerçek neti koru.|
|P11|Undo/Redo, kayıt ve JSON uyumu|EK P|CS, WM, POP, ST, SD|T1 #13/#26; T2|T1 #26/#37; B|PARTIAL|Olağan yol iyi; AUD-001/007 genel kayıt uçları.|P1|Kayıt korumaları.|

## Ek Q — ayrı raf grupları

|Kimlik|Gereksinim|Kaynak|Kod|Test|Sonuç / kanıt|Durum|Eksik / sınır|Önem|Öneri|
|---|---|---|---|---|---|---|---|---|---|
|Q01|sourceLeafId/ebeveyn ile grubu ayırt etme|EK Q|TM, POP, ST|T1 #27|T1 #27|PASS|—|—|—|
|Q02|Her grupta kendi gross'unu koruyarak ayrı eşitleme|EK Q|TM, POP, ST|T1 #27|TM batch group; T1 #27|PASS|—|—|—|
|Q03|Aralık adedini gruplara topluca uygulama|EK Q|TM, POP, ST|T1 #27|T1 #27|PASS|—|—|—|
|Q04|Toplu modül atama|EK Q|TM, POP, ST|T1 #27|TM batchAssignInsert; ST|PASS|—|—|—|
|Q05|Bitişik grupları açık komutla birleştir/yeniden böl|EK Q|TM, POP, ST|T1 #27|T1 #27|PASS|—|—|—|
|Q06|Sabit/mechanik sınırları otomatik tek hacme çevirmeme|EK Q|TM, POP, ST|T1 #27|TM grup uyumlulukları; T1 #27|PASS|—|—|—|

## Ek R — kapak editörü

|Kimlik|Gereksinim|Kaynak|Kod|Test|Sonuç / kanıt|Durum|Eksik / sınır|Önem|Öneri|
|---|---|---|---|---|---|---|---|---|---|
|R01|Düğme Çoklu Seçim solunda|EK R|FC, FE, POP, WC, WM, ST|T1 #28; T5, T7|browser-final.jpg|PASS|—|—|—|
|R02|Gövde geri planda; kapak sınırları belirgin|EK R|FC, FE, POP, WC, WM, ST|T1 #28; T5, T7|B:editor|PASS|—|—|—|
|R03|Editörde tıklama seçer, hareket ettirmez|EK R|FC, FE, POP, WC, WM, ST|T1 #28; T5, T7|B:poses 1458/982/0 korundu; T7|PASS|—|—|—|
|R04|Kapak paneli ve sade iç kontroller|EK R|FC, FE, POP, WC, WM, ST|T1 #28; T5, T7|POP; B:editor|PASS|—|—|—|
|R05|Normal moda dönünce aç/kapat geri gelir|EK R|FC, FE, POP, WC, WM, ST|T1 #28; T5, T7|SI/WC mode gate; B|PASS|—|—|—|
|R06|Tek sol/sağ, çift, açık front|EK R|FC, FE, POP, WC, WM, ST|T1 #28; T5, T7|T1 #10/#28; FC/FE|PASS|—|—|—|
|R07|Üst yüklük/alt ayrı ve kısmi yükseklik|EK R|FC, FE, POP, WC, WM, ST|T1 #28; T5, T7|T1 #28; B:hybrid|PASS|—|—|—|
|R08|Birden çok bitişik Bay ortak kapak|EK R|FC, FE, POP, WC, WM, ST|T1 #28; T5, T7|T7 front coverage|PASS|—|—|—|
|R09|En/boy, kapsam, yStart/yEnd, menteşe açı/yön kontrolleri|EK R|FC, FE, POP, WC, WM, ST|T1 #28; T5, T7|FE/POP; T1 #28; T7|PASS|—|—|—|
|R10|Kapak ekle/kaldır/böl/birleştir|EK R|FC, FE, POP, WC, WM, ST|T1 #28; T5, T7|T1 #28; T7; B:upper hinged|PASS|—|—|—|
|R11|Açıklık payları ve geometrik tutarlılık|EK R|FC, FE, POP, WC, WM, ST|T1 #28; T5, T7|I:odd centers; T5 widths|PARTIAL|AUD-0091 mm yerleşim farkı; üretim bilinen pay tablosu AUD-017.|P2|Ortak sınır ve belge eşleştirmesi.|

## Ek S — panel rol ve yerleşimi

|Kimlik|Gereksinim|Kaynak|Kod|Test|Sonuç / kanıt|Durum|Eksik / sınır|Önem|Öneri|
|---|---|---|---|---|---|---|---|---|---|
|S01|Hücre/çekmece/kapak günlük özellikleri yüzen panelden erişilir|EK S|POP, APP, SD|T1 #26/#28; kaynak|POP; AUD-023|PARTIAL|Çekmecede zorunlu ray tipi yok; diğer mevcut kontroller erişilebilir.|P2|Eksik mekanik niyeti ekle.|
|S02|Gelişmiş kontroller daraltılabilir|EK S|POP, APP, SD|T1 #26/#28; kaynak|B; POP|PASS|—|—|—|
|S03|Sol genel, sağ inceleme, yüzen günlük rol ayrımı|EK S|POP, APP, SD|T1 #26/#28; kaynak|APP/POP; browser-final.jpg|PASS|—|—|—|
|S04|Panel kendi içinde scroll ve ölçülerin üzerinde katman|EK S|POP, APP, SD|T1 #26/#28; kaynak|POP overflow/z-index; B|PASS|—|—|—|
|S05|Tüm ekran boyutlarında taşmama ve seçimi kapatmama|EK S|POP, APP, SD|—|POP clamp; 1707×848 ekran gözlemi|UNVERIFIED|Dar ekran ve tüm kameralar doğrulanmadı.|P2|UAT-14 responsive gözlem.|

## Ek T — uçtan bölme ekleme

|Kimlik|Gereksinim|Kaynak|Kod|Test|Sonuç / kanıt|Durum|Eksik / sınır|Önem|Öneri|
|---|---|---|---|---|---|---|---|---|---|
|T01|Uygun A/B uçlarında yalnız+ tetikleyici|EK T|END, TM, ST|T1 #30|END; browser-final.jpg|PASS|—|—|—|
|T02|Sabit/Flex genişlik ve başlangıç iç düzen seçimi|EK T|END, TM, ST|T1 #30|END; T1 #30|PASS|—|—|—|
|T03|Raf/askı/çekmece/ayakkabı/servis/boş başlangıçları|EK T|END, TM, ST|T1 #30|END katalog|PASS|—|—|—|
|T04|Derinlik/yükseklik bilgisi|EK T|END, TM, ST|T1 #30|END|PASS|Kolun ortak yüksekliği/derinliği bilgi olarak sunuluyor; ayrı Bay gövde yüksekliği/depth alanı sözleşmede zorunlu görülmedi.|—|—|
|T05|Uzat / Flex ile paylaştır açık seçenekleri|EK T|END, TM, ST|T1 #30|END; TM; T1 #30|PASS|—|—|—|
|T06|Mevcut sabitleri sessiz bozmama|EK T|END, TM, ST|T1 #30|T1 #30; FM retleri|PASS|—|—|—|

## Ek U — köşe ve çekmece boyutları

|Kimlik|Gereksinim|Kaynak|Kod|Test|Sonuç / kanıt|Durum|Eksik / sınır|Önem|Öneri|
|---|---|---|---|---|---|---|---|---|---|
|U01|Köşe tek Y aralığı bağımsız düzenleme|EK U|CO, TM, POP, SD|T1 #26/#29; T2|B:ikinci 736→800|PASS|—|—|—|
|U02|Kırmızı çakışma/onayla komşu dengeleme|EK U|CO, TM, POP, SD|T1 #26/#29; T2|B:64 mm; Undo|PASS|—|—|—|
|U03|Köşe X/Y genişliğinin tüm modül kol ölçüsü olduğunu açıklama|EK U|CO, TM, POP, SD|T1 #26/#29; T2|POP corner controls; T1 #29|PASS|—|—|—|
|U04|Köşe kolu alanı ile gerçek çözüm uyumu|EK U|CO, TM, POP, SD|T1 #26/#29; T2|I:corner-arm-clamp|PARTIAL|AUD-012 sessiz alt sınır.|P2|Açık ret/uyarlama.|
|U05|Çekmece X/Y/Z, ön/grup/derinlik kontrolleri|EK U|CO, TM, POP, SD|T1 #26/#29; T2|T1 #26; T2 Z; B:drawer-edit|PASS|—|—|—|

## Ek V — kamera korunumu

|Kimlik|Gereksinim|Kaynak|Kod|Test|Sonuç / kanıt|Durum|Eksik / sınır|Önem|Öneri|
|---|---|---|---|---|---|---|---|---|---|
|V01|3D position/target/yön/yakınlık 2D dönüşünde korunur|EK V|WC|T4 eyeCamera; kaynak|Kaydedilmiş 3D ref; B:orbit→2D→3D|PASS|Görünüm korundu; damping esnasında piksel eşitliği iddia edilmedi.|—|—|
|V02|2D cephe ve plan kendi kamera durumunu korur; yalnız açık resetle varsayılana döner|EK V|WC|—|WC:706/725/744|UNVERIFIED|Kameralar koşullu yeniden kurulan sabit zoom değerlerinde; 2D pan/zoom→başka görünüm→dönüş bu turda denenmedi.|P2|UAT-15; gerekirse ayrı ortografik durum ref'leri.|
|V03|Açık Görünümü Sıfırla komutu|EK V|WC|T4 eyeCamera; kaynak|WC cameraResetTick; B|PASS|—|—|—|

## Ek W — çoklu işlem geçmişi

|Kimlik|Gereksinim|Kaynak|Kod|Test|Sonuç / kanıt|Durum|Eksik / sınır|Önem|Öneri|
|---|---|---|---|---|---|---|---|---|---|
|W01|5/10/20 işlem geri al menüsü|EK W|ST, APP|T1 #30; T2 checkpoint 75|APP; T1 #30|PASS|—|—|—|
|W02|Gerçek checkpoint'e dönme|EK W|ST, APP|T1 #30; T2 checkpoint 75|T2 75 işlem/50 history|PASS|—|—|—|
|W03|Adım listesi ve tıklanan adıma dönme|EK W|ST, APP|T1 #30; T2 checkpoint 75|APP; ST undoSteps|PASS|—|—|—|
|W04|Redo yolunu koruma|EK W|ST, APP|T1 #30; T2 checkpoint 75|T2 checkpoint; B:version Undo/Redo|PASS|—|—|—|

## Ek X — iki kalınlık parametresi

|Kimlik|Gereksinim|Kaynak|Kod|Test|Sonuç / kanıt|Durum|Eksik / sınır|Önem|Öneri|
|---|---|---|---|---|---|---|---|---|---|
|X01|Global ana panel kontrolü varsayılan 18|EK X|S, CS, CO, ST, APP, PRO|T1 #25/#33/#35; T2; T8|APP; S; I:18/8|PASS|—|—|—|
|X02|Global arkalık/taban kontrolü varsayılan 8|EK X|S, CS, CO, ST, APP, PRO|T1 #25/#33/#35; T2; T8|APP; S; I:18/8|PASS|—|—|—|
|X03|Gövde, raf, dikme, kapak, çekmece ön/yan/arka ana kalınlığı|EK X|S, CS, CO, ST, APP, PRO|T1 #25/#33/#35; T2; T8|I:thickness; T8 25/4|PASS|—|—|—|
|X04|Arkalık ve çekmece tabanı ikinci kalınlık|EK X|S, CS, CO, ST, APP, PRO|T1 #25/#33/#35; T2; T8|I:18/8, 25/4, 18/3, 16/6, 22/10|PASS|—|—|—|
|X05|Kalınlık değişirken dış ölçüleri sabit/neti yeniden hesaplama|EK X|S, CS, CO, ST, APP, PRO|T1 #25/#33/#35; T2; T8|I:800−2 t, 600−tb; T1 #25|PASS|—|—|—|
|X06|Köşe ve nişin yeni kalınlıkla tutarlı çözümü|EK X|S, CS, CO, ST, APP, PRO|T1 #25/#33/#35; T2; T8|I:mixed-corner-thickness; drawer-small|PARTIAL|Global eşit kalınlık iyi; AUD-013 farklı kol, AUD-005 küçük çekmece ucu.|P2|Uyumsuz kombinasyonları çöz/reddet.|
|X07|Kalın/ince panel ve donanım uyarısı|EK X|S, CS, CO, ST, APP, PRO|T1 #25/#33/#35; T2; T8|I:asymmetric HEAVY/THIN; T8|PASS|—|—|—|
|X08|Undo/kayıt/JSON/legacy 18-8 varsayılanları|EK X|S, CS, CO, ST, APP, PRO|T1 #25/#33/#35; T2; T8|T1 #25/#37; T2 legacy; I:legacy|PASS|—|—|—|

## Ek Y — modern gömme dış bitiş

|Kimlik|Gereksinim|Kaynak|Kod|Test|Sonuç / kanıt|Durum|Eksik / sınır|Önem|Öneri|
|---|---|---|---|---|---|---|---|---|---|
|Y01|Düz modern tavana/zemine yakın genel görünüm|EK Y|CS, CO, APP, ST|T1 #34/#37|T1 #34; CS exteriorFinish|PASS|—|—|—|
|Y02|Düz/dekoratifsiz/taç/dolgu/kapalı üst bitiş seçenekleri|EK Y|CS, CO, APP, ST|T1 #34/#37|APP; CS/CO|PASS|—|—|—|
|Y03|Tavan toleransı ve montaj boşluğuna göre uyum|EK Y|CS, CO, APP, ST|T1 #34/#37|AUD-006|PARTIAL|Alt düzey boşluk alanları var; oda tavanı çapraz kontrolü yok.|P2|Tavan yüksekliğini doğrula.|
|Y04|Düşük/gizli/klasik baza/ayak/minimal alt bitiş|EK Y|CS, CO, APP, ST|T1 #34/#37|APP; CS; T1 #34|PASS|—|—|—|
|Y05|Zemin sürtme ve mekanik destek uyarıları|EK Y|CS, CO, APP, ST|T1 #34/#37|CS low-floor-clearance; yapısal alt korunumu|PASS|Gerçek yük/ankraj AUD-026.|—|—|
|Y06|Düz/çıtasız/ince dolgu/dekoratif/duvar yan bitişi|EK Y|CS, CO, APP, ST|T1 #34/#37|APP; CS sideFinish|PASS|—|—|—|
|Y07|Dekorasyon kaldırılınca taşıyıcı panelleri koruma|EK Y|CS, CO, APP, ST|T1 #34/#37|T1 #34|PASS|—|—|—|
|Y08|Tek tık Düz Gömme/Minimal Bitiş|EK Y|CS, CO, APP, ST|T1 #34/#37|T1 #34; APP|PASS|—|—|—|

## Ek Z — üretim dokümantasyonu

|Kimlik|Gereksinim|Kaynak|Kod|Test|Sonuç / kanıt|Durum|Eksik / sınır|Önem|Öneri|
|---|---|---|---|---|---|---|---|---|---|
|Z01|Türkçe kapsamlı marangoz belgesi hedefi|EK Z.1–3|PRO, TS, CSV, PDF, PP|T8; T6|AUD-003/017/026/027|PARTIAL|Nominal paket var; eksiksiz ham kesim/montaj emri düzeyinde değil.|P1|Önce geometri, sonra eksik alanlar ve atölye onayı.|
|Z02|Proje adı/tarih/sürüm/tip/dış kol ölçüleri|EK Z.1–3|PRO, TS, CSV, PDF, PP|T8; T6|P:kapak sayfaları; production.json|PASS|—|—|—|
|Z03|Malzeme ve iki kalınlık özeti|EK Z.1–3|PRO, TS, CSV, PDF, PP|T8; T6|P:malzeme sayfaları; bağımsız alan toplamı|PASS|—|—|—|
|Z04|Ölçülü A/B cephe|EK Z.1–3|PRO, TS, CSV, PDF, PP|T8; T6|P:SVG/PDF; TS|PASS|—|—|—|
|Z05|Üst plan ve yan kesit|EK Z.1–3|PRO, TS, CSV, PDF, PP|T8; T6|P:plan/kesitler|PASS|—|—|—|
|Z06|Genel 3D aksonometri|EK Z.1–3|PRO, TS, CSV, PDF, PP|T8; T6|P:her örnek s.3|PASS|Perspektif fotoğraf değil; ölçülü teknik izdüşüm.|—|—|
|Z07|L-köşe bağlantı/parça yerleşim detayı|EK Z.1–3|PRO, TS, CSV, PDF, PP|T8; T6|AUD-017; P:köşe eşleştirme|PARTIAL|Yerleşim/kod var; birleşim yöntemi ve patlatılmış montaj ayrıntısı yok.|P2|Seçilen yönteme göre detay.|
|Z08|İç modül çiziminde gerçek raf/kasa görünürlüğü|EK Z.1–3|PRO, TS, CSV, PDF, PP|T8; T6|AUD-016; diagonal/asymmetric s.17|PARTIAL|B arkalık rafları örtebiliyor.|P2|İzdüşüm derinlik sırası.|
|Z09|Benzersiz fiziksel kod/adet/aitlik tam cutlist|EK Z.1–3|PRO, TS, CSV, PDF, PP|T8; T6|P:69/94/81/94 eşit; benzersiz kodlar|PASS|—|—|—|
|Z10|Paylaşımlı paneli tek, ayrı komşuları ayrı sayma|EK Z.1–3|PRO, TS, CSV, PDF, PP|T8; T6|I:partitions; T8; P|PASS|—|—|—|
|Z11|Malzeme/kalınlık/nominal en-boy/grain bilgisi|EK Z.1–3|PRO, TS, CSV, PDF, PP|T8; T6|P:CSV/PDF satırları|PASS|—|—|—|
|Z12|Bütün poligon V noktaları ve yerel-dünya ofseti|EK Z.1–3|PRO, TS, CSV, PDF, PP|T8; T6|I:poligon vertices; P:özel paftalar|PASS|—|—|—|
|Z13|Bütün poligon kenar uzunlukları ve gerçek alan|EK Z.1–3|PRO, TS, CSV, PDF, PP|T8; T6|I:shoelace/hypot; P|PASS|—|—|—|
|Z14|Poligon iç ve dış/imalat açıları|EK Z.1–3|PRO, TS, CSV, PDF, PP|T8; T6|I:interior angles; AUD-017|PARTIAL|İç açılar doğru; dış/imalat açıları ayrı yazılmıyor.|P2|Açı anlamını ve dış dönüşü açık ver.|
|Z15|Diyagonal ön/arka kenar ve damar yönelimi|EK Z.1–3|PRO, TS, CSV, PDF, PP|T8; T6|P:V/E referansları ve +X damar oku|PASS|—|—|—|
|Z16|Komşu panellere kesin birleşim tarifi|EK Z.1–3|PRO, TS, CSV, PDF, PP|T8; T6|AUD-027|EXTERNAL VERIFICATION|Bant/kanal/vida/minifix yöntemi seçilmedi.|EXTERNAL|Usta ile yöntem, sonra detay.|
|Z17|Kapak gerçek kesim en/boy/kalınlık ve kodu|EK Z.1–3|PRO, TS, CSV, PDF, PP|T8; T6|P:kapak cutlist; I:wideDoors|PASS|—|—|—|
|Z18|Kapak yön/pay/konum/kulp koordinatı ve mekanizma eşleştirmesi|EK Z.1–3|PRO, TS, CSV, PDF, PP|T8; T6|AUD-017|PARTIAL|Yön/açı hardware satırında; tam kod/koordinat/pay tablosu yok.|P2|Bilinen çözülmüş alanları belgeye kat.|
|Z19|Her çekmecede 5 gerçek parça; görsel dış kutuyu saymama|EK Z.1–3|PRO, TS, CSV, PDF, PP|T8; T6|I:drawers; T8; P|PASS|—|—|—|
|Z20|Organizatörleri ayrı ve imal edilebilir sayma|EK Z.1–3|PRO, TS, CSV, PDF, PP|T8; T6|AUD-003|PARTIAL|33 parça sayılıyor; yerleşimde 1–3 mm kesişme.|P1|Kapanış hesabını düzelt.|
|Z21|Çekmece gerçek net hacim ve kızak boşluğu|EK Z.1–3|PRO, TS, CSV, PDF, PP|T8; T6|AUD-005/023|PARTIAL|Olağan net doğru; küçük taban ucu ve ray seçimi eksik.|P2|Net invariant ve kızak niyeti.|
|Z22|Arkalık adet/en/boy/kalınlık ve shared/separate ayrımı|EK Z.1–3|PRO, TS, CSV, PDF, PP|T8; T6|P; I:thickness/partitions|PASS|—|—|—|
|Z23|Görünür kenar bantlarının kesin planı ve bant kalınlığı|EK Z.1–3|PRO, TS, CSV, PDF, PP|T8; T6|AUD-027|EXTERNAL VERIFICATION|E kenar referansları var; kenar/bant seçimi kesin değil.|EXTERNAL|Atölyeyle kenar başına plan.|
|Z24|Ham kesim ve bitmiş nominal ölçünün ayrılması|EK Z.1–3|PRO, TS, CSV, PDF, PP|T8; T6|P:uyarı notu; AUD-027|PARTIAL|Ayrım metinde açık; iki ayrı ölçü sütunu ve düşüm yok.|P2|Yöntem seçildikten sonra ham ölçü alanı.|
|Z25|Ahşap damar yönü işaretleri|EK Z.1–3|PRO, TS, CSV, PDF, PP|T8; T6|P:CSV grain ve poligon oku|PASS|—|—|—|
|Z26|Menteşe/ray/kulp/raf desteği/LED/bağlantı listesi|EK Z.1–3|PRO, TS, CSV, PDF, PP|T8; T6|P:hardware list; T8 pins|PASS|Tahmin/null değerler doğru etiketlenmiş; kesin katalog onayı değildir.|—|—|
|Z27|Katalog delik ölçülerini uydurmama|EK Z.1–3|PRO, TS, CSV, PDF, PP|T8; T6|PRO hardware confirmed=false; P|PASS|—|—|—|
|Z28|Negatif/parça boyutu/algılanan kritik hata üretimi engeller|EK Z.1–3|PRO, TS, CSV, PDF, PP|T8; T6|T8 block; B:50 mm ray tüm 3 çıktı disabled|PASS|—|—|—|
|Z29|Bütün kritik geometri ve eksik donanımın kapıya girmesi|EK Z.1–3|PRO, TS, CSV, PDF, PP|T8; T6|AUD-002/003/006; PRO|PARTIAL|review etiketi dürüst; eksik statik invariantlar dışarıda.|P1|Üretimden önce global invariantları tamamla.|
|Z30|Uzman/yerinde ölçü ve üretim onayı sınırını açık yazma|EK Z.1–3|PRO, TS, CSV, PDF, PP|T8; T6|P:kapak/son sayfa; AUD-026/028|PASS|—|—|—|
|Z31|PDF/CSV/SVG aynı Design→Resolved→kanonik kaynağı kullanır|EK Z.1–3|PRO, TS, CSV, PDF, PP|T8; T6|I:yeniden üretim eşitliği; T8 ZIP|PASS|—|—|—|
|Z32|Kalınlık değişiminde tüm çıktıları yeniden türetme|EK Z.1–3|PRO, TS, CSV, PDF, PP|T8; T6|T8 25/4; I:thickness; PRO/TS|PASS|—|—|—|
|Z33|Gerçek A3 boyutu, Türkçe font ve sayfa bölme|EK Z.1–3|PRO, TS, CSV, PDF, PP|T8; T6|P:420×297, 127 sayfa; 13 temas+tam detay incelemesi|PASS|—|—|—|
|Z34|Pafta alanının okunur ve ekonomik kullanımı|EK Z.1–3|PRO, TS, CSV, PDF, PP|T8; T6|AUD-024|PARTIAL|Kısa tablolar/tekrarlı 10 poligon sayfası fazla boşluk.|P3|Kod izlenebilirliğiyle sayfa birleştir.|
|Z35|Gerçek A3 basılı okunabilirlik ve cetvel kontrolü|EK Z.1–3|PRO, TS, CSV, PDF, PP|T8; T6|AUD-028|EXTERNAL VERIFICATION|Ekran ve PDF sayfa ölçüsü kontrol edildi; fiziksel baskı yapılmadı.|EXTERNAL|UAT-35 %100 A3 baskı.|
|Z36|Tarayıcı indirmesinin gerçek dosyaya ulaşması|EK Z.1–3|PRO, TS, CSV, PDF, PP|—|B:download timeout 12000 ms|UNVERIFIED|UI başarılı; kaydedilmiş tarayıcı dosya yolu görülmedi. Export dosyaları ayrıca doğru.|P2|UAT-30 indirme klasörü testi.|

## Ana plan bölüm ve kabul kriteri kapsama indeksi

|Kaynak bölüm|Matris karşılığı|
|---|---|
|§1 vizyon/mühendislik|MP001–MP017|
|§2 SeviyeA/B/C özellik haritası|MP001–MP017, MP034–MP133, DEF01–DEF18|
|§3.1 yığın|MP018–MP028, MP088–MP093|
|§3.2 katmanlar|MP005–MP017, MP098–MP104|
|§3.3 mm/Run+Junction/InsertRegistry|MP005–MP015|
|§4.1 panel/poligon/UV|MP029–MP033|
|§4.2 Front/autoFront|MP034–MP038|
|§4.3 hareket/render|MP039–MP044|
|§5 iş akışı/seçim/32 mm|MP068–MP080; G–W|
|§6.1 köşe/biFold|MP045–MP052; DEF16|
|§6.2 niş|MP053–MP056; AUD-025|
|§6.3 doğrulama/uzman|MP057–MP067|
|§7 görsel kalite/ölçüm|MP081–MP097|
|§8 kalıcılık/şema/geçmiş|MP098–MP104; H, W|
|§9 Aşama 1 kabul 1 çalıştırma|MP018, MP131|
|§9 Aşama 1 kabul 2 düz/kör/beşgen/asimetrik geometri|MP001–MP004, MP045–MP049, MP059/067|
|§9 Aşama 1 kabul 3 764 mm/fixed-flex|MP009–MP011, MP046|
|§9 Aşama 1 kabul 4 kayıt/JSON|MP098–MP104|
|§9 Aşama 2 kabul 1 boş→L+niş+çekmece+askı|MP068–MP078, MP050–MP056, P, T|
|§9 Aşama 2 kabul 2 pivot/sıralama|MP039–MP043, A, B|
|§9 Aşama 2 kabul 3 çıkarılabilirlik/kulp/çekmece|MP053–MP065, F|
|§9 Aşama 3 kabul 1 UV/damar|MP031–MP032|
|§9 Aşama 3 kabul 2 hedef cihaz/sunum|MP086–MP097|
|§9 Aşama 3 kabul 3 gerçek eşyalar|MP073, MP093–MP096|
|§9 Aşama 4 kabul 1 profil/uyarı|MP105–MP108|
|§9 Aşama 4 kabul 2 oda/yay|MP113–MP117|
|§9 Aşama 4 kabul 3 hedef-kapasite|MP109–MP112|
|§9 Aşama 5 kabul 1 sürüm/kapasite/AI|MP122–MP126|
|§9 Aşama 5 kabul 2 teknik ölçü eşitliği|MP127–MP130; Z|
|§10 beş çekirdek test grubu|T1, T2, T4–T8; MP131–MP132|
|§11 reddedilenler ve ertelenenler|DEF01–DEF17|
|§12 eski çalışma yolu/sürgü varsayımı|DEF18–DEF19; güncel kullanıcı kapsamı üstün|
|§12 çıktının aşaması/cihaz/gerçek ölçü|MP097, MP127–MP133|
|§13 başlangıç işleri|MP005–MP028, MP069–MP071, MP098–MP104; tekrar sayılmadı|
|§14 karar özeti|MP005–MP017, MP039–MP044, MP053–MP056, MP086–MP104, MP124–MP126, DEF01–DEF19; yeni bağımsız yükümlülük yok|
|Ek §6 aşama bütünleştirme tablosu|A–Z bütün atomik satırlar; D–F zorunlu Aşama 5, Y Aşama 3, Z Aşama 5|

Denetim sonucunda sözleşmenin bütün zorunlu özelliklerinin tamamlandığı söylenemez. Eksik/yanlış davranışlar bulgularda ayrılmış, doğrulanmamış etkileşimler UNVERIFIED bırakılmıştır. Bu belge düzeltme yapılmış olduğunu iddia etmez.
