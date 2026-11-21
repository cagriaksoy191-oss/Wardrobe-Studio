# Açık kullanıcı bulguları ve teknik borç

**21 Kasım 2026 güncel durum.** Üç fiziksel P0 açık. WS-UX-011 doğrulanan büyük model kutu seçiminde **FIXED_AND_PRODUCTION_BROWSER_VERIFIED**. 64 hücre eşiği ve küçük model çizim yolu doğrulandı. Performans değerleri Brave / Radeon 610M ölçümüne aittir. [WS-UX-011 yayın raporu](WS_UX_011_PRODUCTION_RELEASE.md)

**17 Kasım 2026 güncel durum.** WS-UX-001, WS-UX-002 ve WS-UX-003 fiziksel P0 olarak açık. WS-UX-011 kısmi kapanmış P2 olarak açık. ContactShadows kaynak ömrü düzeltmesi üretimde doğrulandı. Normal Brave Radeon 610M LED performans protokolü `RESEARCHED_NOT_READY` olarak kapatıldı. Üretim yayını bu performans belirsizliğinin açık mühendislik risk kabulüne dayanır. [WebGL üretim raporu](WEBGL_CONTACT_SHADOWS_PRODUCTION_RELEASE.md)

**15 Kasım 2026 tarihsel üretim kabulü.** MS-EXPORT-001, GitHub `main` `c57a4b2` ve Worker `9ce09ac8-d627-421a-88a7-3f6b7a66e0d5` ile Ready, %100 trafikte ve canlı tarayıcıda doğrulandı. Üç fiziksel P0 (WS-UX-001/002/003), D3-BASELINE-001 nominal yerleşim bulgusu, WS-UX-011 ve WebGL kaynak ömrü borcu açık. [Üretim kabulü](MS_EXPORT_001_PRODUCTION_RELEASE.md)

**14 Kasım 2026 güncel durum:** WS-UX-009a, `9624f90` kaynağı / `55a1639` ilk yayını ile **FIXED_AND_PRODUCTION_BROWSER_VERIFIED**, yalnız tek sürgü ve ilişkili çekmeceler kapsamında. İlk kabul Worker'ı `da47d81f-f73e-4c6d-b1d6-7afacec73cad`, Ready / %100. **Dört açık/kısmi kullanıcı bulgusu** kaldı: WS-UX-001/002/003 P0 ve WS-UX-011 P2. WebGL kaynak yönetimi ayrı teknik borçtur. [Üretim raporu](SAFE_MOTION_RECOVERY_PRODUCTION_RELEASE.md)

Tarihsel başlangıç envanteri (13 Kasım; aşağıdaki beşli sayım bu tarihe aittir):

13 Kasım 2026 · Canlı taban `9e0e3da`. **Beş açık veya kısmi kullanıcı bulgusu** bulunuyor. WS-UX-001/002/003 P0, WS-UX-009a ve WS-UX-011 P2. İlk 17 denetim bulgusunun 13’ü üretimde kapalıdır. Sonradan eklenen WS-UX-018 de kapalıdır. WebGL kaynak ömrü ve reddedilmiş B2 ayrı teknik borç kalemleri. Eski [denetim](COMPREHENSIVE_UX_FUNCTIONAL_AUDIT.md) ve [durum tablosu](CURRENT_ISSUE_STATUS.md) önceki yayınları kaydeder.

## D3-BASELINE-001 · nominal yerleşim · üretimde doğrulandı

16 Kasım 2026. 25/4 modelindeki 20 yarım milimetre penetrasyonu canlı geometri kaynağında 20 sıfır hacimli yüzey temasına dönüştü. **FIXED_AND_PRODUCTION_VERIFIED**. Üç fiziksel P0, WS-UX-011 ve WebGL kaynak ömrü açık. [D3-BASELINE-001 üretim raporu](D3_BASELINE_001_PRODUCTION_RELEASE.md)

## WS-UX-001 · P0 · beşgen 18/8 · fiziksel doğrulama bekliyor

- Tekrar: kanonik `diagonal` modelde komşu kapakları kapalı tutun, 3D’de köşe kapağını açın ve Erişim İncelemesi’ndeki raf koridorunu okuyun. Canlı limit **5,1°/110°**, dört raf için **7/7/7/0 mm**, hedef 310 mm. Kapalı cephede depolama kullanılamıyor.
- Geçici yol: tanısal PDF/SVG ve erişim uyarılarıyla tasarımı inceleyin. Tam CSV/ZIP kapalıdır. Kapaksız simülasyon sadece engeli izole eder.
- Araştırma: 1150×1050 mm kollar, B1’i 155° önce açma, ardından köşe 60° ve 458/310 mm raf koridoru. Geri kapanışta sıra tersine döner. B1 tek kanat **1535×2276×18 mm**, 94→93 fiziksel parça ve 71 kesim değişikliği.
- Kabul: gerçek menteşe kapasitesi, kanat yükü/sehim, taşıyıcı dikme, menteşe sayısı, oda açıklığı, yük altında sıra ve erişim. [Fizibilite](CLOSED_CORNER_FEASIBILITY.md)

## WS-UX-002 · P0 · asimetrik beşgen 25/4 · fiziksel doğrulama bekliyor

- Tekrar: `asymmetric` modelde 600/480 mm kol derinlikleriyle köşe kapağını açın, Erişim İncelemesi’nde rafları kontrol edin. Canlı limit **12,8°/110°**, raflar **14/14/14/7 mm**, hedef 310 mm.
- Geçici yol: tanısal PDF/SVG. Tam CSV/ZIP kapalıdır.
- Araştırma: 1050×1050 mm kollar ve sağ menteşe, köşe **59,6°**, dört raf **448/310 mm**. A çekmeceleri 454/454 mm, askı zarfı **355/480 mm**, 94 fiziksel parça, 72 kesim değişikliği.
- Kabul: 25 mm kanat için gerçek menteşe/pivot ve bağlantı zarfı, kenar payı, montaj plakası, kulp, yük ve askı erişimi. [Fizibilite](CLOSED_CORNER_FEASIBILITY.md)

## WS-UX-003 · P0 · kör köşe · fiziksel doğrulama bekliyor

- Tekrar: `blind` modelde alt sürgüleri A2 iç çekmeceleri için park edin ve çekmeceleri açın. Canlı strok **49/451 mm**, koridor **1102/1706 mm**. Üç çekmecenin normal kullanımı engellenir.
- Geçici yol: Erişim İncelemesi ve tanısal PDF/SVG. Tam CSV/ZIP kapalıdır.
- Araştırma: A1 1500 mm, üç ayrı ray ve üç kanat. İki hareketli kanat −745 ve −1490 mm parkta, çekmeceler **451/451 mm**, koridor **1462/1456 mm**. **6 mm nominal pay** ve A2 askı **0/480 mm**. 81→82 fiziksel parça, 44 kesim değişikliği. Üç kanat/iki ray ve tek başına ray ekleme tam strok vermedi.
- Kabul: gerçekten uyumlu üç bağımsız ray, üretici kesiti, stoper, bağlantı ve toleranslar, yüklü kanat sehimleri, 1:1 montaj ve çekmece/askı erişimi. [Fizibilite](CLOSED_CORNER_FEASIBILITY.md)

## WS-UX-009a · P2 · sınırlı kapsamda üretimde doğrulandı

- **Üretim kabulü:** Normal JSON yükleme, gerçek sürgü/çekmece kontrolleri, klavye başlatma/iptal, gerçek 3D sürükleme ve mobil viewport ile doğrulandı. Hedef kanat ve üç çekmece 0'a döner; başka kanat 982 mm'de kalabilir. Sistem bütün gardırobu kapattığını iddia etmez. Desteklenmeyen park/engel zincirleri manuel kalır. [Canlı kabul](SAFE_MOTION_RECOVERY_PRODUCTION_RELEASE.md)
- Aşağıdaki yerel aday ve ilk kabul koşulu kayıtları yayın öncesine aittir; üretimde açık durumu yukarıdaki yayınla sınırlı kapsamda kapatılmıştır.

- Tekrar: iç çekmeceyle örtüşen sürgüyü açın, çekmeceyi kısmen açık bırakıp sürgüyü kapatın. Tarihsel sentetik canlı senaryoda kanat **1458 mm** konumunda durdu ve uyarı çekmecenin **86 mm** açık olduğunu gösterdi. WS-UX-009’un anlaşılır duruş bildirimi yayında.
- Geçici yol: kanadı geri park edin, çekmeceyi kapatın, tamamen kapanmasını bekleyin ve kanadı tekrar kapatın. Önceki canlı akışta son konumlar sıfıra döndü ve uyarı kalktı.
- Kabul: tek komutlu güvenli sıralama ayrı bir geliştirmedir. Karşılıklı engeller, yarıda iptal/ters komut, gerçek ulaşılan konum ve mevcut temas limitleri korunmalıdır. [Hareket regresyonu](tests/drawer-slide-recovery.test.ts) · [Duruş bildirimi](src/canvas/scene/MotionController.tsx)
- **14 Kasım yerel aday:** `feat/safe-motion-recovery`, taban `17ed1fe`. “Güvenli sırayla kapat” yalnız doğrulanmış planla ve kullanıcı başlatmasıyla çalışır. Bilinen 1458,05 / 86,05 mm engeli; 1964 mm park → üç çekmeceyi sırayla 0 → kanadı 0 akışıyla çözüldü. 284 test, değişmeyen dört kanonik imza, masaüstü/mobil viewport, iptal/manuel müdahale/yeni sahne kabulü doğrulandı. **IMPLEMENTED_AND_BROWSER_VERIFIED_PENDING_RELEASE**; üretimde açık durum devam eder. [Tam rapor](SAFE_MOTION_RECOVERY_IMPLEMENTATION_REPORT.md)
- Sınır: tek sürgü ve kendi kapanışını engelleyen çekmeceler. Diğer kanatları taşıyan genel planlayıcı yok. Güvenli park yolu bulunamayan zincirler manuel kalır. Üç P0, WS-UX-011 ve WebGL borcu bu adayda çözülmüş sayılmaz.

## WS-UX-011 · P2 · büyük kutu seçimi · doğrulanan kapsamda kapalı

- **21 Kasım 2026 üretim kabulü.** `23c72df`, Worker `ceb5a259-89d7-48fb-a8a5-dbdac8f229b1`, Ready / %100. 130 hücre ve normal model gerçek HTTPS kabulü geçti. Aynı 64 hücreli sahnede tekrarlı seçim kaynak sayacı sabit kaldı. Aşağıdaki maddeler önceki deneylerin tarihsel kaydıdır. [Yayın kabulü](WS_UX_011_PRODUCTION_RELEASE.md)

- **21 Kasım 2026 yerel aday `READY_FOR_RELEASE_REVIEW`.** Büyük modelde toplu kenar çizimiyle bırakma kare p95’i 25,4→21,4 ms, ilk tıklanabilir panel p95’i 55,2→46,2 ms. 44/44 sürüklemede aynı sıralı 130 hücre, normal model kısa kontrolü ve 358 test geçti. Tek Radeon 610M ortamı, panel p95’inin bir blokta ters yönde oynaması ve yaklaşık %20 hedefinin altında kalan kazanım kabul raporunda yer alıyor. Üretim bulgusu açık. [WS-UX-011 aday raporu](WS_UX_011_FINAL_REMEDIATION_REPORT.md)

- Tekrar: ayrı profilde 14 bölmeli büyük L, 144 çözülmüş hücre, 130 beklenen seçim, 1600×900 CSS ve DPR 1 referansıyla kutu seçimini etkinleştirin. Aynı kamera/işaretçi yoluyla sürükleme, bırakma ve bağlamsal panelin hazır olmasını birlikte ölçün. Hareket CPU optimizasyonu üretimdedir. Çok sayıda seçimde bırakma gecikmesi sürüyor.
- Geçici yol: seçim alanını daraltın veya küçük gruplar halinde seçin.
- İlk deney (`MARQUEE_TRACE_AND_REMEDIATION.md`): `App` aboneliğinde geçici hover önizlemesi daraltıldı. Sürükleme p95 iyileşti. Bırakma kare p95 iki turda **76,3→122,5 ms**, **78,4→125,2 ms** olduğundan yama geri alındı.
- İkinci deney (`MARQUEE_INTERACTION_REMEDIATION_REPORT.md`, `7b91a12`): vurgu dolgu/materyal güncellemeleri ve seçim önizlemesi yollarında çalışma azaltıldı. **84/84** seçim aynı sıralı 130 kimliği döndürdü ve seçim görüntüsü eşitti. Sürükleme kazancı tutarsız, bırakma kare p95 **52,2→59,2 ms**, **50,7→97,8 ms**, ikinci tur panel hazır p95 **63,1→111,9 ms**. Deney geri alındı ve üretimde yok.
- Kabul: `EdgesGeometry` kurulumu, çizgi buffer yüklemeleri, React DOM/R3F commit ve `pointerup` sonrası panel işini bağımsız ölçün. Zaman çakışması nedensellik kanıtı değildir. Raycast ve seçim geometrisi ölçülen bırakma yükünün tamamını açıklamadı. Üretim/aday sırasını değiştirerek çoklu oturum, drag/up/panel hazır p50/p95/p99/maks., aynı sıralı kimlikler ve piksel eşitliği arayın. [Sahne seçimi](src/canvas/scene/WardrobeCanvas.tsx) · [Seçim kenarları](src/canvas/wardrobe/WardrobeMeshGroup.tsx)

## WebGL · kaynak ömrü üretimde düzeltildi · kalan performans belirsizliği

- **17 Kasım 2026 üretim durumu.** İki render target, düzlem geometrisi ve üç materyal sahibi olan ContactShadows bileşeni `ddfc3a5` ile yayımlandı. Dört sahiplik testi ve canlı tarayıcı geçişleri doğrulandı. Performans araştırması kapalı. Önceki yerel araştırma kararları aşağıda tarihsel olarak korunur. [Kontrollü yayın](WEBGL_CONTACT_SHADOWS_PRODUCTION_RELEASE.md)

- **17 Kasım 2026 nihai Radeon LED kontrolü · `RESEARCHED_NOT_READY`.** Normal pencerede 16 yeni çift çalıştırıldı. Başlangıçta odak koşulunu karşılamayan iki çift önceden sabitlenen kuralla elendi. Kalan 14 çiftin ortalama kare p95 farkı −0,693 ms, betimleyici. On altı geçerli çift gerektiren yayın koşulu açık ve araştırma kapatıldı. [Nihai karar](WEBGL_FINAL_LED_RELEASE_DECISION.md)
- **16 Kasım 2026 gerilememe doğrulaması · `RESEARCHED_NOT_READY`.** Aynı aday kodu iki GPU'da 102 başsız çiftte 6/6 sahne ve 30/30 tamamlayıcı ölçütü geçti. Normal pencerede iki ağır açık sahne bağımsız tekrarda geçti. Normal Radeon LED kare p95 üst sınırı +2,0339 ms ve önceden belirlenen eşik +2,0 ms. İki normal pencerede 30'ar döngü, bağlam kurtarma ve 31 görsel eşleşme geçti. Açık doğrulama koşulu normal Radeon LED kare p95. [Son yayın incelemesi](WEBGL_FINAL_RELEASE_READINESS.md)
- **16 Kasım 2026 yerel aday `7f2134a` · `RESEARCHED_NOT_READY`.** `27361cb` tabanında iki GPU'da ikişer 30 döngü. Taban kapalı doku 8→66, aday tüm kapanışlarda 6. Aday 240/240 native hedef dokusunu bıraktı. Bağlam/görsel ve 354 test geçti. RTX kapalı sahne p95 eşdeğer, RTX ağır açık ve iki GPU'da LED dahil kalan p95 aralıkları belirsiz. Bu aday üretimde yok. [Kabul kararı](WEBGL_RESOURCE_RELEASE_DECISION.md)
- Eski üretim sahnesi Drei **10.7.9** `ContactShadows` kullanıyordu. Aynı modeli Sunum/Düzenleme arasında art arda değiştirirken kaynak sayısı birikiyordu. Önceki 30 döngü deneyinde kapalı doku sayısı örneği **10→68**. Sunum geçişlerini sınırlamak bu eski sürüm için geçici yoldu. [Sahne](src/canvas/scene/WardrobeCanvas.tsx)
- Drei her mount’ta iki render target, düzlem geometrisi ve üç materyal oluşturur. Kendi oluşturduğu kaynaklar için unmount cleanup kaydetmez. Minimal aday sahip olunan bu nesneleri dispose eder ve shader sağlayıcısını/blur geçişini korur. Ölçülen texture sayacı iki GPU’da üretimde 18→76, adayda 18→18; geometri adayda 8→8. Sayaç ve silme çağrıları sürücü VRAM ölçümü değildir. [Drei bileşeni](https://github.com/pmndrs/drei/blob/v10.7.9/src/core/ContactShadows.tsx)
- Minimal B1 **`a1e8731f0cc418e871d0fa695f9bd156354600fc`**, **RESEARCHED_NOT_READY**. İki GPU’da 30 döngüde birikim durdu, kaynak sayımları sabitlendi ve bağlam geri yüklendi. RTX açık sahne karşılaştırmalarında kare p95 örnekleri **29,8→34,4** ve **33,2→32,0 ms**. Oturum farkları nedeniyle RTX/AMD GPU eşdeğerliği güvenilir biçimde doğrulanmadı.
- Önceki B1 **`c42c5a7`**, **REGRESSION_DETECTED**. İlk kaynak ömrü çalışması `da7ea00` yerel. B2 **`a8c1ba3`** temas derinlik geçişi adayı renderer durumunu 12/12 geri yükledi, LED senaryosunda iki turda GPU ve kare p95 yükseldi. B2 yayın önerisi yok.
- Önceki performans kabulü aynı tarayıcı/güç/viewport/DPR, ters koşu sıraları, tekrarlar ve açık/kapalı/LED sahnelerinde kaynak ve süre eşdeğerliğini birlikte arıyordu. 17 Kasım tarihli istisna yayın kararını kapsadı. Araştırma protokolünün sonuçları tarihsel kayıtlarına göre okunur.
- Üretimde Drei’den türetilen kodun MIT metni ve telif bildirimi `public/THIRD_PARTY_NOTICES.txt` içinde ve statik doğrulayıcının izin listesinde dağıtılır. [Drei v10.7.9 MIT](https://github.com/pmndrs/drei/blob/v10.7.9/LICENSE)

## Sonraki ajanın öncelikleri

Temiz klonda test ve dört kanonik örnek doğrulamasıyla başlayın. WS-UX-009a'nın doğrulanmış sınırlarını ve manuel kurtarmayı koruyun. WS-UX-001/002/003 için fiziksel mühendislik ve gerçek iş akışı kabulü açıktır. Kutu seçimi ve WebGL normal bakım ve regresyon kontrollerinde izlenir. Yeni yayınlar ayrı kullanıcı yetkisi gerektirir. [Kabul koşulları](PROJECT_FINAL_HANDOFF.md)

Yerel ham izler, profiller ve araştırma raporları Git klonunun parçası değildir. Bu belge kararları, ölçüm sınırlarını ve tekrar adımlarını saklar. Fiziksel üretim kapıları ancak doğrulanmış donanım ve atölye kabulüyle yeniden değerlendirilir.
