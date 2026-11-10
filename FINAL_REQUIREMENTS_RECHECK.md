# Wardrobe Studio · 344 gereksinimin son kontrolü

5 Kasım 2026. Önceki matris tarihsel kanıt olarak saklandı. Bu tabloda her kimlik için durum ve kanıt sınırı ayrı verilir.
[Önceki 344 satır](C:/dev/Wardrobe-Studio/REQUIREMENTS_COVERAGE.md) · [30 AUD ve kabul adımları](C:/dev/Wardrobe-Studio/FINAL_REMEDIATION_REPORT.md)

| Durum | Önce | Şimdi |
|---|---:|---:|
| PASS | 251 | 299 |
| PARTIAL | 50 | 12 |
| FAIL | 10 | 0 |
| UNVERIFIED | 12 | 12 |
| DEFERRED | 15 | 15 |
| EXTERNAL VERIFICATION | 6 | 6 |

Önceki 10 FAIL satırın 9 tanesi PASS ve 1 tanesi PARTIAL oldu. 50 PARTIAL satırın 39 tanesi PASS oldu. 12 UNVERIFIED satır aynı kabul sınırında. N01 otomatik komut kanıtı kazandı. V02, S05 ve J03 için kaynak düzeltmeleri eklendi.

PASS, satırın yazılım yükümlülüğü için mevcut kaynak, otomatik regresyon veya çıktı kanıtını gösterir. Korunan 251 PASS satırın önceki kanıtı aşağıda aynı kimlikle bağlıdır. 120 önceki test yeniden çalıştırıldı. Önceki tarayıcı kanıtı bu turun canlı gözlemi olarak sayılmadı.

[186 test sonucu](C:/dev/Wardrobe-Studio/artifacts/final-remediation/final-tests.log) · [Derleme](C:/dev/Wardrobe-Studio/artifacts/final-remediation/final-build.log) · [Üretim denetimi](C:/dev/Wardrobe-Studio/artifacts/final-remediation/production-qa.json)

## Önceki FAIL satırları

- **MP043 · PASS** · Çekmecede kısmi 0.80 / tam 1.0 kızak sınırı seçimi. Kısmi ve tam seçimi kalıcı. Çözülen çıkma hareket, süpürme ve donanım listesine gidiyor. (AUD-023)
- **MP051 · PASS** · Beşgen askı alanı seçeneği. Beşgen fiziksel boru, güvenli aralık, kapasite, donanım ve düzenleme kontrolü eklendi. (AUD-011)
- **MP055 · PASS** · Kancalı eşya kaldırma payı. Eşya başına kaldırma mm değeri ve net yükseklik sınırı doğrulandı. (AUD-025)
- **MP057 · PASS** · Tüm mühendislik eşiklerini validationConfig içinde toplama. Askı, geniş kanat, raf açıklığı, çekmece neti, modül depolama ve köşe eşikleri validationConfig üzerinden okunuyor. (AUD-019)
- **MP080 · PASS** · Ayarlı rafta 32 mm sistem adımı. Alt iç yüz referansı ve ±32 mm komutu var. Eski raflar açık etkinleştirmeye kadar yerinde. (AUD-018)
- **MP088 · PARTIAL** · Sunumda N8AO iç köşe gölgesi. Three.js GTAO eklendi. N8AO ile teknik tercih farkı, gerçek görüntü kalitesi ve ön planda performans kabulü açık. (AUD-020)
- **MP092 · PASS** · LED kol başına en fazla 1 hafif iç ışık. Sahne bir kol kimliği başına en çok bir iç PointLight kuruyor. Görsel şeritler ayrı. (AUD-020)
- **MP093 · PASS** · InstancedMesh ile eşya çoğaltma. Kıyafet, askı kancası, ayakkabı ve tekrarlanan kutu bileşenleri InstancedMesh ile çiziliyor. (AUD-020)
- **B04 · PASS** · 0.80 kısmi /1.0 tam çekme rayı seçimi. 0,80/1,00 seçenekleri ve alanı eksik eski 0,82 kayıt test edildi. (AUD-023)
- **N04 · PASS** · Z arka yönünde sabit ön sınır. A ve B arka ankrajı ön cephenin dünya koordinatını koruyor. Ön ray ve Undo/Redo ayrıca test edildi. (AUD-004)

## Bütün satırlar

| Kimlik | Gereksinim | Önce → Şimdi | Kanıt / kalan iş |
|---|---|---|---|
| MP001 | Düz gardırop tasarımı | PASS → PASS | Korunan önceki kanıt · I:straight; B:room-obstacle |
| MP002 | Kör köşeli L tasarımı | PASS → PASS | Korunan önceki kanıt · I:blind; T1 #5 |
| MP003 | Beşgen köşeli L tasarımı | PASS → PASS | Korunan önceki kanıt · I:diagonal; B:corner-resize |
| MP004 | Asimetrik kol derinliği | PASS → PASS | Korunan önceki kanıt · I:asymmetric; T1 #4 |
| MP005 | Tek Design kullanıcı niyeti; ResolvedModel deterministik türetim | PASS → PASS | Korunan önceki kanıt · I:*:deterministic ve round-trip |
| MP006 | Saf TypeScript çekirdeği; React/Three bağımsızlığı | PASS → PASS | Korunan önceki kanıt · src/core import incelemesi |
| MP007 | Kalıcı niyette tamsayı mm, render sınırında metre | PASS → PASS | Korunan önceki kanıt · T2 rounding; I:flex:bounded-random |
| MP008 | Tüm çözülmüş koordinatları da tamsayı sayma yönündeki lafzi karar | PARTIAL → PASS | AUD-009 · Kullanıcı tamsayı niyet ile türetilmiş yarım mm merkezi ayırdı. A/B kapalı kanat merkezi pivot, süpürme ve üretimle aynı. |
| MP009 | Sabit/esnek ve kilitli genişlikler | PASS → PASS | Korunan önceki kanıt · T1 #2/#8; T2 sınırlar |
| MP010 | Remainder dağıtımı ve toplam mm kapanışı | PASS → PASS | Korunan önceki kanıt · I:3000 bounded flex; T1 #2 |
| MP011 | Eşzamanlı min/max sınırları ve imkânsız dağıtımı ret | PASS → PASS | Korunan önceki kanıt · T2 min/max/overflow; I:flex:bounded-random |
| MP012 | Run + Junction grafiğinin global geçerliliği | PARTIAL → PASS | AUD-002 · Grafik, eksen, öncelik, kimlik ve cephe kapsamı ortak şema ve çözücü sınırında doğrulanıyor. |
| MP013 | Run bazında uzunluk, derinlik, yükseklik | PASS → PASS | Korunan önceki kanıt · T1 #4/#8; I:thickness-* |
| MP014 | SplitNode yatay=alt/üst, dikey=sol/sağ | PASS → PASS | Korunan önceki kanıt · T1 #3/#9; B:virtual-cell-edit |
| MP015 | InsertRegistry parametre, varsayılan, geometri, kapasite ve kuralı tek tipli nesnede toplama | PARTIAL → PARTIAL | AUD-029 · Registry artık varsayılan önizleme seçimini de taşıyor. Geometri ve kapasite ayrı saf hesap katmanlarında. Tek sözleşme için hedefli modül göçü gerekir. |
| MP016 | Yeni ağır CAD/CSG/fizik motoru eklememe | PASS → PASS | Korunan önceki kanıt · package.json; MC; MS |
| MP017 | Tek SPA ve mevcut mimariyi aşamalarla genişletme | PASS → PASS | Korunan önceki kanıt · package.json; kaynak dizinleri |
| MP018 | Vite kurulumu ve dev/build çalışması | PASS → PASS | Korunan önceki kanıt · build.log; 5180 dev sunucusu |
| MP019 | React 19 | PASS → PASS | Korunan önceki kanıt · package.json; çalışan tarayıcı |
| MP020 | TypeScript strict | PASS → PASS | Korunan önceki kanıt · tsconfig; build.log |
| MP021 | Tailwind CSS | PASS → PASS | Korunan önceki kanıt · package.json; çalışan arayüz |
| MP022 | Lucide Icons | PASS → PASS | Korunan önceki kanıt · package.json; arayüz |
| MP023 | Three WebGL + R3F + drei | PASS → PASS | Korunan önceki kanıt · WC; çalışan 3D/2D |
| MP024 | Animasyonda react-spring/three tercihi | PARTIAL → PARTIAL | AUD-029 · Mevcut çarpışmalı simülatörün davranış testleri geçiyor. Ana plandaki react-spring/three bağımlılığı kullanılmıyor. |
| MP025 | Zustand + Immer | PASS → PASS | Korunan önceki kanıt · ST; T1 komut/Undo testleri |
| MP026 | Zod çalışma zamanı şeması | PASS → PASS | Korunan önceki kanıt · S; I:json-reject:* |
| MP027 | idb-keyval / IndexedDB kalıcılığı | PARTIAL → PASS | AUD-001/007 · Geç okuma, daha yeni iki depo kaydı, geçmiş ve hata kombinasyonları kontrollü test edildi. |
| MP028 | Vitest çekirdek test altyapısı | PASS → PASS | Korunan önceki kanıt · T120:7 dosya, 120 test |
| MP029 | Kutu panelleri gerçek mm boyutuyla üretme; mesh.scale ile sündürmeme | PASS → PASS | Korunan önceki kanıt · WM PanelMeshItem; T1 #25 |
| MP030 | Beşgen Shape/ExtrudeGeometry panel üretimi | PASS → PASS | Korunan önceki kanıt · WM; I:poligon V/E/açı/alan |
| MP031 | Ahşap dokuda dünya ölçeğinde UV | PASS → PASS | Korunan önceki kanıt · T1 #31; MAT |
| MP032 | Dikme/kapak dikey, raf yatay grainAxis | PASS → PASS | Korunan önceki kanıt · T1 #31; I:poligon grain; MAT |
| MP033 | Çakışık yüzeylerde Z-fighting önlemi | UNVERIFIED → UNVERIFIED | UAT 4/7 · Merkez düzeltmesi ve render sırası kaynakta. Malzeme ve kalınlık kombinasyonlarıyla ön planda titreme taraması bekliyor. |
| MP034 | Kapakları Bay'den bağımsız Front katmanında tutma | PASS → PASS | Korunan önceki kanıt · FC; T1 #28; T5 hibrit |
| MP035 | Birden çok bitişik Bay'i tek kapakla kapsama | PASS → PASS | Korunan önceki kanıt · T7 front tests; FC; FE |
| MP036 | Kapak yStart/yEnd ve kısmi yükseklik | PASS → PASS | Korunan önceki kanıt · T1 #10/#28; B:hybrid-and-gate |
| MP037 | Otomatik ≤600 mm tek, >600 mm çift kapak | PASS → PASS | Korunan önceki kanıt · T1 #10 |
| MP038 | Dış çekmece üstünde otomatik kapak alt sınırını yükseltme | PASS → PASS | Korunan önceki kanıt · T1 #10 |
| MP039 | Gerçek sol/sağ menteşe pivotları | PARTIAL → PASS | AUD-009 · Sol ve sağ menteşe, A ve B eksenleri ve beşgen dönme ekseni panel sınırlarına bağlı. |
| MP040 | 110/155/165° açılma sınırları | PASS → PASS | Korunan önceki kanıt · T2 açı testleri; T5; KIN |
| MP041 | Doğal açılma/kapanma, yarıda ters yön | PASS → PASS | Korunan önceki kanıt · I:motion:mid-flight-reversal; MS |
| MP042 | İç çekmece öncesi kapak açma ve kapatmada sıralama | PASS → PASS | Korunan önceki kanıt · T1 #12; MS |
| MP043 | Çekmecede kısmi 0.80 / tam 1.0 kızak sınırı seçimi | FAIL → PASS | AUD-023 · Kısmi ve tam seçimi kalıcı. Çözülen çıkma hareket, süpürme ve donanım listesine gidiyor. |
| MP044 | R3F hareketi sırasında yeniden çizim | PASS → PASS | Korunan önceki kanıt · WC sürekli render döngüsü; tarayıcı hareketleri |
| MP045 | Paylaşımlı N+1 dikme ve ayrı 2N gövde korunumu | PASS → PASS | Korunan önceki kanıt · I:partitions:*; dört örnek; T2/T8 |
| MP046 | Dış/net ölçü ve 800−2×18=764 mm | PASS → PASS | Korunan önceki kanıt · I:thickness:18/8; T1 #1 |
| MP047 | Beşgen net/dış açıklık ve asimetrik Pisagor | PASS → PASS | Korunan önceki kanıt · I:poligonlar; T1 #4; PRO |
| MP048 | Kör köşede öncelikli kol derinliği+klapa tüketimi | PASS → PASS | Korunan önceki kanıt · T1 #5; I:blind |
| MP049 | Kör klapa dar olduğunda çakışma uyarısı | PASS → PASS | Korunan önceki kanıt · CO; T1 köşe kuralı |
| MP050 | Beşgen raf alanı seçeneği | PASS → PASS | Korunan önceki kanıt · B:corner-resize; I:poligonlar |
| MP051 | Beşgen askı alanı seçeneği | FAIL → PASS | AUD-011 · Beşgen fiziksel boru, güvenli aralık, kapasite, donanım ve düzenleme kontrolü eklendi. |
| MP052 | Kademeli L-Askı farklı yükseklik şablonu | PASS → PASS | Korunan önceki kanıt · T4 staged L rods |
| MP053 | Dar servis nişinde gerçek eşya en/derinlik/boy sığması | PASS → PASS | Korunan önceki kanıt · T1 #6/#14; CS |
| MP054 | Servis nişi 30–50 mm el/tutma payı | PASS → PASS | Korunan önceki kanıt · T1 #6; CS handClearanceMm |
| MP055 | Kancalı eşya kaldırma payı | FAIL → PASS | AUD-025 · Eşya başına kaldırma mm değeri ve net yükseklik sınırı doğrulandı. |
| MP056 | Etkin açıklık ve 110° menteşe çıkıntısı; 155° çözümü | PASS → PASS | Korunan önceki kanıt · T1 #11/#14; T4 QuickFix |
| MP057 | Tüm mühendislik eşiklerini validationConfig içinde toplama | FAIL → PASS | AUD-019 · Askı, geniş kanat, raf açıklığı, çekmece neti, modül depolama ve köşe eşikleri validationConfig üzerinden okunuyor. |
| MP058 | Hata/Uyarı/Bilgi/Uzman dört seviye | PASS → PASS | Korunan önceki kanıt · S ValidationIssue; CS/SA; PP |
| MP059 | Parça/hücre statik çakışmalarını saptama | PARTIAL → PARTIAL | AUD-002/003 · Yapısal paneller, kollar ve organizer çiftleri denetleniyor. Eski panel birleşimlerinde yarım mm toleransı ve modellenmeyen birleşimler var. |
| MP060 | Menteşeli kapak kenarının dikmeye oturma kontrolü | UNVERIFIED → UNVERIFIED | UAT 3/8 · Pivot ve kapalı paylar artık üretim tablosunda. Tüm özel menteşeli aralıkların dikmeye oturma taraması bekliyor. |
| MP061 | Her gerçek >600 mm menteşeli kanada uyarı | PARTIAL → PASS | AUD-008 · Çözülen her menteşeli kanat 600 mm sınırından geçiyor. |
| MP062 | 18 mm raf açıklığı >850 mm sehim uyarısı | PASS → PASS | Korunan önceki kanıt · I:diagonal 1662 mm; T1/CS; PRO |
| MP063 | Önden askıda <530 mm net derinlik uyarısı | PARTIAL → PASS | AUD-019 · 519, 520, 525 ve 529 mm uyarıyor. 530 mm eşik uyarısı üretmiyor. |
| MP064 | İç çekmecede menteşe/çıta önerisi | PASS → PASS | Korunan önceki kanıt · T1 #11; T4 hinge 155 |
| MP065 | L köşe kapak/çekmece/kulp hacimsel hareket kısıtı | PASS → PASS | Korunan önceki kanıt · T5/T6; MC; I:thin-fast |
| MP066 | Duvar gönyesi, nem/havalandırma, yük ve ankraj uzman sınırı | EXTERNAL VERIFICATION → EXTERNAL VERIFICATION | AUD-026/028 · Duvar, yük, ankraj ve nem koşulları yerinde değerlendirilir. |
| MP067 | Doğru tasarım niyeti ve çözüm arasında sessiz köşe ölçüsü değiştirmeme | PARTIAL → PASS | AUD-012 · Kısa köşe kolu gereken A/B mm ile reddediliyor. |
| MP068 | Oda/Gövde, İç/Kapak, Malzeme/Çıktı üç adım | PASS → PASS | Korunan önceki kanıt · B:oda→iç→malzeme |
| MP069 | Global 3D perspektif | PASS → PASS | Korunan önceki kanıt · B:camera; browser-final.jpg |
| MP070 | Global 2D ölçülü A/B cephe | PASS → PASS | Korunan önceki kanıt · B:canvas-marquee; WC |
| MP071 | Global 2D üst plan | PASS → PASS | Korunan önceki kanıt · B:room-obstacle |
| MP072 | Kapak kapalı/açık/X-Ray/gizli anahtarları | PASS → PASS | Korunan önceki kanıt · B:sliding ve hidden; WC |
| MP073 | İç eşyalar genel göster/gizle | PARTIAL → PASS | AUD-014 · Genel ve servis anahtarının dört kombinasyonu gerçek React önizleme girişinde test edildi. |
| MP074 | Global Undo/Redo ve adlandırılmış sürüm erişimi | PASS → PASS | Korunan önceki kanıt · B:history-after-open/version-lifecycle |
| MP075 | Hücre hacmi seçimi ve sağ bağlamsal denetçi | PASS → PASS | Korunan önceki kanıt · B:items-raycast |
| MP076 | Hızlı dikey/yatay bölme | PASS → PASS | Korunan önceki kanıt · T1 #9; B:virtual-cell-edit |
| MP077 | Hazır modül atama | PASS → PASS | Korunan önceki kanıt · T1; B:shelfStack; IR |
| MP078 | Sayısal/kaydırıcı ölçü düzenleme | PASS → PASS | Korunan önceki kanıt · B:drawer-edit/corner-resize |
| MP079 | Sabit panellerde 1 mm hassasiyet ve 10 mm ok adımı | PASS → PASS | Korunan önceki kanıt · T1 mm; DO/POP step kaynakları |
| MP080 | Ayarlı rafta 32 mm sistem adımı | FAIL → PASS | AUD-018 · Alt iç yüz referansı ve ±32 mm komutu var. Eski raflar açık etkinleştirmeye kadar yerinde. |
| MP081 | Zengin PBR ahşap kataloğu | PASS → PASS | Korunan önceki kanıt · T1 #31; B:materials-lighting |
| MP082 | Mat/parlak lake malzemeleri | PASS → PASS | Korunan önceki kanıt · MAT katalog/shader; T1 #31 |
| MP083 | Cam/ayna malzeme görünümü ve ayrı yapım uyarısı | PASS → PASS | Korunan önceki kanıt · T1 #32; MAT |
| MP084 | Metal malzeme | PASS → PASS | Korunan önceki kanıt · MAT; T1 #31 |
| MP085 | Gövde/raf/kapak/çekmece malzemesini bağımsız seçme | PARTIAL → PASS | AUD-030 · Paletin çağırdığı store komutu her yüzeye tek alan yazıyor. Ayrı raf seçimi üretim modelinde de doğrulandı. |
| MP086 | Düzenleme/Sunum geçişi | PASS → PASS | Korunan önceki kanıt · B:materials-lighting |
| MP087 | IBL ve yönlü gölge | PASS → PASS | Korunan önceki kanıt · WC envMap/directionalLight; browser-final.jpg |
| MP088 | Sunumda N8AO iç köşe gölgesi | FAIL → PARTIAL | AUD-020 · Three.js GTAO eklendi. N8AO ile teknik tercih farkı, gerçek görüntü kalitesi ve ön planda performans kabulü açık. |
| MP089 | ContactShadows | PASS → PASS | Korunan önceki kanıt · WC; browser-material-led.jpg |
| MP090 | İç LED şeritlerinin raf/askı/köşede konumu | PASS → PASS | Korunan önceki kanıt · T1 #35; B:materials-lighting |
| MP091 | LED sıcaklık ve parlaklık ayarı | PASS → PASS | Korunan önceki kanıt · T2 transaction; B:4000K |
| MP092 | LED kol başına en fazla 1 hafif iç ışık | FAIL → PASS | AUD-020 · Sahne bir kol kimliği başına en çok bir iç PointLight kuruyor. Görsel şeritler ayrı. |
| MP093 | InstancedMesh ile eşya çoğaltma | FAIL → PASS | AUD-020 · Kıyafet, askı kancası, ayakkabı ve tekrarlanan kutu bileşenleri InstancedMesh ile çiziliyor. |
| MP094 | Gerçek boylu kısa/uzun kıyafetler | PARTIAL → PASS | AUD-015 · Örnek boyu sabit. 944 mm hücre 1220 mm örneği küçültmeden gizliyor ve ölçüsünü bildiriyor. |
| MP095 | Gerçek boylu kutu/hurç/çanta/valiz/ayakkabı | PARTIAL → PASS | AUD-015 · Kutu, hurç, çanta, valiz ve ayakkabı boyutları sabit katalogdan. Sığma yalnız sayıyı ve görünürlüğü etkiliyor. |
| MP096 | Servis nişinde ölçekli merdiven/ütü masası | PASS → PASS | Korunan önceki kanıt · T1 #14; IT |
| MP097 | Hedef cihazda Sunum/Düzenleme/X-Ray kare süresi ölçümü | UNVERIFIED → UNVERIFIED | UAT 7 · Arka plan örneği 1 FPS civarına kısıtlandı. Aynı sahnede ön planda üç mod için p50 ve p95 ölçülecek. |
| MP098 | Her komut sonrası otomatik kalıcı kayıt | PARTIAL → PASS | AUD-001/007 · Komutlar iki kanalı ayrı dener. Bir veya iki başarılı kopya ile hata durumları ayrı. |
| MP099 | Taşınabilir wardrobe.json üretimi ve geri yükleme | PARTIAL → PARTIAL | AUD-001/002, UAT 1/10 · JSON içerik turu ve kurtarma test edildi. Gerçek tarayıcı indirme ve dosyadan yeniden açma zinciri son turda gözlenmedi. |
| MP100 | schemaVersion 1 ve eksik opsiyonel alanlara varsayılanlar | PASS → PASS | Korunan önceki kanıt · T1 #7; I:legacy:*; S |
| MP101 | JSON tüm geçersiz global durumları reddeder | PARTIAL → PASS | AUD-002 · Birleşim, öncelik, eksen, kimlik, cephe kapsamı ve eski separate girişleri ortak regresyonda. |
| MP102 | Slider jestini tek history transaction sayma | PASS → PASS | Korunan önceki kanıt · T2 LED gesture |
| MP103 | En az 50 okunabilir Undo adımı | PASS → PASS | Korunan önceki kanıt · T2 75 işlem/checkpoint |
| MP104 | Sayfa yenileme/JSON aynı geometri | PASS → PASS | Korunan önceki kanıt · B:F5 olağan yol; I:legacy ve fixture round-trip |
| MP105 | Anne/Baba boy profilleri ve canlı erişim sınırları | PASS → PASS | Korunan önceki kanıt · T4 reach; B:room-obstacle |
| MP106 | 2D/3D ergonomi ısı haritası | PASS → PASS | Korunan önceki kanıt · AO; T4 reach |
| MP107 | Anne/Baba göz hizası kamera ön ayarı | PASS → PASS | Korunan önceki kanıt · T4 eyeCamera; B:Anne 1395 |
| MP108 | Bay/hücre Anne/Baba/Ortak sahipliği ve renk katmanı | PASS → PASS | Korunan önceki kanıt · T4 ownership; AO |
| MP109 | Gerçek ölçülü hedef envanter sayacı | PASS → PASS | Korunan önceki kanıt · T4 physical dimensions; I:common-not-duplicated |
| MP110 | Askı uzunluğu/raf alanı/çekmece hacmi kapasite metrikleri | PARTIAL → PASS | AUD-005/022 · Net raf/taban, kullanılabilir askı ve çekmece hacmi ortak analizden türetiliyor. |
| MP111 | Ortak alanı iki kişiye iki kez saymama | PASS → PASS | Korunan önceki kanıt · I:12+4=16; T4 common |
| MP112 | Birlikte envanter hedeflerini sırayla rezervasyon | PASS → PASS | Korunan önceki kanıt · I:inventory ters sıra; T4 |
| MP113 | Oda engellerini gerçek yükseklik/ayak iziyle modelleme | PASS → PASS | Korunan önceki kanıt · T4; B:bed |
| MP114 | Yatak, oda kapısı, pencere, radyatör, priz | PASS → PASS | Korunan önceki kanıt · P4UI 9 tür; T4 obstacle |
| MP115 | Kolon/kiriş/diğer engeller | PASS → PASS | Korunan önceki kanıt · P4UI; T4 column |
| MP116 | 2D kapak/çekmece süpürme alanı | PASS → PASS | Korunan önceki kanıt · T4 sweep; B:room-plan |
| MP117 | Oda engeliyle gövde ve hareket çakışması uyarısı | PASS → PASS | Korunan önceki kanıt · T4; B:collision/QuickFix |
| MP118 | Yüklük ve kör köşe valiz şablonları | PASS → PASS | Korunan önceki kanıt · T4 deepYukluk/blindLuggage |
| MP119 | Takı/pantolon/çamaşır şablonları | PARTIAL → PASS | AUD-003 · Organizer yerleşim boşlukları ve kesim sınırları aynı dağıtımdan. Pantolon ve çamaşır şablonları mevcut. |
| MP120 | Bay kopyalama ve simetrik yansıtma | PASS → PASS | Korunan önceki kanıt · T4 fresh IDs/mirror/unsupported-copy rejection |
| MP121 | Neden açıklaması ve Quick-Fix tek Undo | PASS → PASS | Korunan önceki kanıt · T4; B:bedZ2230 |
| MP122 | Adlandırılmış sürüm oluştur/yeniden adlandır/arşivle/aç | PASS → PASS | Korunan önceki kanıt · T7; B:version-lifecycle/history-after-open |
| MP123 | Yan yana kapasite/envanter/ölçü fark tablosu | PARTIAL → PASS | AUD-021/022 · Karşılaştırma yerleşim, A/B boy ve derinlik, yükseklik ve kapalı X/Y/Z zarfını içeriyor. |
| MP124 | Dış AI için tam Design JSON istemi | PASS → PASS | Korunan önceki kanıt · T7 prompt; browser-ai-prompt.txt |
| MP125 | Dış JSON önizleme→ayrı varyant; aktif tasarıma açık açma | PASS → PASS | Korunan önceki kanıt · T7; B:json-preview/history-after-open |
| MP126 | AI yolunda yinelenmiş/eksik ID, bozuk tür/ölçü/referans retleri | PARTIAL → PASS | AUD-002 · AI önizleme aynı parser ve grafiği çalıştırıyor. Üretim kontrolünün hata ve uyarılarını gösteriyor. |
| MP127 | Ölçülü SVG/PDF teknik paftalar | PARTIAL → PASS | AUD-016/017/024 · Dört PDF/SVG paketi raf görünürlüğü, geometri ve kapak/montaj kodlarıyla doğrulandı. |
| MP128 | Tam CSV kesim/parça listesi | PASS → PASS | Korunan önceki kanıt · P:69/94/81/94 tekil; I:csv-bytes |
| MP129 | Uzman doğrulama raporu ve kritik üretim kapısı | PARTIAL → PARTIAL | AUD-002/006/026 · Somut kritikler üretimi engelliyor. Serbest birleşim ve katalog doğrulaması kapsamı açık. |
| MP130 | Teknik çizim/CSV/Solver mm eşitliği | PARTIAL → PASS | AUD-003/009/017 · 338 parça kodu ve nominal ölçü, PDF/CSV/SVG/JSON boyunca kontrol edildi. Merkez ve poligonlar ayrıca hesaplandı. |
| MP131 | Dev/test/build sıfır hata | PASS → PASS | Korunan önceki kanıt · tests.log 120/120; build.log exit 0 |
| MP132 | Gerçek 3D/2D/X-Ray ve hareket eksenleri görsel kabulü | PARTIAL → PARTIAL | UAT 2–8 · X/Y/Z, çarpışma ve kamera durumu kodu denetlendi. Gerçek işaretçi ve görünüm sıralarının kabulü bekliyor. |
| MP133 | Gerçek oda ölçülerini kullanıcı sonradan girebilir | PARTIAL → PASS | AUD-006 · Oda tavanı ve isteğe bağlı montaj payı gerçek üst kotla karşılaştırılıyor. |
| DEF01 | U planlı dolap | DEFERRED → DEFERRED | Seviye C. Bu teslimin zorunlu geliştirme kapsamı dışında. |
| DEF02 | Ada / walk-in yerleşim | DEFERRED → DEFERRED | Seviye C. Bu teslimin zorunlu geliştirme kapsamı dışında. |
| DEF03 | Eğimli tavan ve serbest poligon planlar | DEFERRED → DEFERRED | Seviye C. Bu teslimin zorunlu geliştirme kapsamı dışında. |
| DEF04 | Sıkıştırılmış glTF kıyafet paketleri | DEFERRED → DEFERRED | Seviye C. Bu teslimin zorunlu geliştirme kapsamı dışında. |
| DEF05 | Kullanım sıklığı simülasyonu | DEFERRED → DEFERRED | Seviye C. Bu teslimin zorunlu geliştirme kapsamı dışında. |
| DEF06 | Envanterden otomatik optimum yerleşim | DEFERRED → DEFERRED | Seviye C. Bu teslimin zorunlu geliştirme kapsamı dışında. |
| DEF07 | Çok kullanıcı/bulut/kimlik doğrulama | DEFERRED → DEFERRED | Seviye C. Bu teslimin zorunlu geliştirme kapsamı dışında. |
| DEF08 | Uygulama içi ücretli LLM API | DEFERRED → DEFERRED | Seviye C. Bu teslimin zorunlu geliştirme kapsamı dışında. |
| DEF09 | CNC delik/kesim dosyaları DXF/MPR | DEFERRED → DEFERRED | Seviye C. Bu teslimin zorunlu geliştirme kapsamı dışında. |
| DEF10 | Stok levha kesim optimizasyonu/nesting | DEFERRED → DEFERRED | Seviye C. Bu teslimin zorunlu geliştirme kapsamı dışında. |
| DEF11 | Döner karusel | DEFERRED → DEFERRED | Seviye C. Bu teslimin zorunlu geliştirme kapsamı dışında. |
| DEF12 | Pantograf mekanizması | DEFERRED → DEFERRED | Seviye C. Bu teslimin zorunlu geliştirme kapsamı dışında. |
| DEF13 | GPU path-tracing fotoğraf modu | DEFERRED → DEFERRED | Seviye C. Bu teslimin zorunlu geliştirme kapsamı dışında. |
| DEF14 | WebGPU | DEFERRED → DEFERRED | Seviye C. Bu teslimin zorunlu geliştirme kapsamı dışında. |
| DEF15 | AR görünümü | DEFERRED → DEFERRED | Seviye C. Bu teslimin zorunlu geliştirme kapsamı dışında. |
| DEF16 | Doğrulanmış biFold köşe kapağı | EXTERNAL VERIFICATION → EXTERNAL VERIFICATION | AUD-026 · BiFold prototip ve katalog doğrulaması koşullu kalıyor. |
| DEF17 | OpenCascade/WASM/CSG/Rapier/cloth/AccumulativeShadows eklememe kararı | PASS → PASS | Korunan önceki kanıt · package.json; kaynak |
| DEF18 | Sürgülüyü isteğe bağlı sayan eski varsayımın geçersizliği | PASS → PASS | Korunan önceki kanıt · Ek D–F ve güncel FE/MC |
| DEF19 | Eski OneDrive dizini varsayımı yerine güncel C:/dev çalışma sınırı | PASS → PASS | Korunan önceki kanıt · baseline-manifest; yeni artefakt yolları |
| A01 | Kapak/kulptan gerçek pivotta açılma | PARTIAL → PASS | AUD-009 · Kapalı üretim merkezi ve menteşe kinematiği aynı sınırları kullanıyor. |
| A02 | Açık kapağın akıcı kapanması | PASS → PASS | Korunan önceki kanıt · MS; T5/T6 |
| A03 | Yarıda konum sıçramadan ters yön | PASS → PASS | Korunan önceki kanıt · I:motion:mid-flight-reversal |
| A04 | 110/155/165° gerçek açı sınırları | PASS → PASS | Korunan önceki kanıt · T2 açı testleri |
| A05 | İç çekmece açıkken önce çekmeceyi kapatma | PASS → PASS | Korunan önceki kanıt · T1 #12 |
| B01 | Kasa/ön/kulp aynı hareketli birimde | PASS → PASS | Korunan önceki kanıt · T1 #13; WM; B:açık çekmeceler |
| B02 | Tıklamayla açma/kapatma | PASS → PASS | Korunan önceki kanıt · B:motion-interlock; T1 #20 |
| B03 | Hareket sırasında kesintisiz ters yön | PASS → PASS | Korunan önceki kanıt · MS ortak yay; T5 hareket sınırları |
| B04 | 0.80 kısmi /1.0 tam çekme rayı seçimi | FAIL → PASS | AUD-023 · 0,80/1,00 seçenekleri ve alanı eksik eski 0,82 kayıt test edildi. |
| B05 | İç çekmece öncesinde örtücü kapak açma | PASS → PASS | Korunan önceki kanıt · T1 #12; MS |
| C01 | Altı kulp modeli | PASS → PASS | Korunan önceki kanıt · HM ve UI katalogları |
| C02 | Beş renk/yüzey seçeneği | PASS → PASS | Korunan önceki kanıt · HM; drawer UI |
| C03 | Farklı uzunluklar | PASS → PASS | Korunan önceki kanıt · T1 #33; UI96/160/220/320 vb. |
| C04 | Dikey/yatay ve üst/orta/alt konum | PASS → PASS | Korunan önceki kanıt · CS/HM; T1 #33 |
| C05 | Kapak ve çekmece genel kulplarının bağımsızlığı | PASS → PASS | Korunan önceki kanıt · T1 #33/#37 |
| C06 | Bireysel kulp override ve hareketle birlikte bağlılık | PASS → PASS | Korunan önceki kanıt · T1 #33; WM; B:kulp sürükleme |
| C07 | 18→25 mm kalınlıkta yüzeye bağlı kulp konumu | PASS → PASS | Korunan önceki kanıt · T1 #33 |
| D01 | Tamamen menteşeli gardırop | PASS → PASS | Korunan önceki kanıt · T1 otomatik kapaklar; I:eski örnekler |
| D02 | Tamamen 2 raylı sürgülü gardırop | PASS → PASS | Korunan önceki kanıt · I:2 track 2..6 leaf; B:track 2 |
| D03 | Tamamen 3 raylı sürgülü gardırop | PASS → PASS | Korunan önceki kanıt · I:3 track 2..6 leaf; B:üç ray |
| D04 | Aynı tasarımda sürgülü/menteşeli/açık karma | PASS → PASS | Korunan önceki kanıt · T5 hibrit; B:üst 2 menteşe/alt 2 sürgü |
| D05 | Ray derinliği ve track ofsetlerinin modele katılması | PASS → PASS | Korunan önceki kanıt · T5; B:100 mm ön ek, 50 mm kritik |
| D06 | Bindirme ve gerçek kanat genişlik kapanışı | PASS → PASS | Korunan önceki kanıt · I:10 sistem; T5 eşit/özel genişlik |
| D07 | İmkânsız ray/tek bölme/çekmece erişim uyarıları | PASS → PASS | Korunan önceki kanıt · T5; B:kapalı ön çekmece reddi |
| D08 | Gerçek profil/montaj/yük uygunluğu | EXTERNAL VERIFICATION → EXTERNAL VERIFICATION | AUD-026 · Ray profili, yük ve montaj kararı üreticiye bağlı. |
| E01 | Kulptan gerçek fareyle sürükleme | PASS → PASS | Korunan önceki kanıt · B:1462 mm bırakma |
| E02 | Normal modda yüzeyden doğrudan sürükleme | UNVERIFIED → UNVERIFIED | UAT 3 · Normal mod sürükleme yolu ve çarpışma simülasyonu mevcut. Yüzeyden gerçek fare sürüklemesi bekliyor. |
| E03 | Fareyi izleme ve bırakılan geçerli pozda kalma | PASS → PASS | Korunan önceki kanıt · B:1462 mm; T7 manual pose/history |
| E04 | Sol/sağ ray mekanik bitiş sınırları | PASS → PASS | Korunan önceki kanıt · T5 unequal widths/bounds; B:End/Home |
| E05 | Aynı raydaki kanadı geçmeme | PASS → PASS | Korunan önceki kanıt · T5 fast same-track |
| F01 | Açık çekmeceye yaklaşan sürgünün temas sınırında durması | PASS → PASS | Korunan önceki kanıt · B:1458 mm; T5 open drawer |
| F02 | Çekmece kapanınca sürgü yolunun açılması | PASS → PASS | Korunan önceki kanıt · T5 engel pozuna göre sınır; MC |
| F03 | L-köşe kapak/çekmece/kulp gerçek hacimleri | PASS → PASS | Korunan önceki kanıt · T6 corner; T5 protrusion |
| F04 | Düşey aralık ve ön/arka ray derinlik ayrımı | PASS → PASS | Korunan önceki kanıt · T5 vertical separation/different tracks |
| F05 | Hızlı harekette çok ince engelden tünellememe | PASS → PASS | Korunan önceki kanıt · I:0.2 mm engel, 489.9500001 mm duruş |
| F06 | Başlangıç kesişmesini kritik hata sayma | PASS → PASS | Korunan önceki kanıt · I:initial-overlap; T6 closed overlap |
| F07 | Deterministik sürekli kinematik; ağır fizik yok | PASS → PASS | Korunan önceki kanıt · MC/MS; package.json |
| G01 | Kol/köşe/derinlik/yükseklik/dış etiketinden düzenleme | PASS → PASS | Korunan önceki kanıt · DO editTarget; T1 #16 |
| G02 | Enter/onay uygular, Escape iptal eder | PASS → PASS | Korunan önceki kanıt · DO/SD olayları; B:Enter kullanılan alanlar |
| G03 | Geçersiz ve sınır dışı değerde açık ret/uyarı | PARTIAL → PASS | AUD-002/012/013 · Geçersiz grafik, kısa kol, çakışan cephe ve desteklenmeyen köşe kalınlığı neden belirtilerek reddediliyor. |
| G04 | Türetilmiş net etiketi dış kaynak ölçüye bağlama | PASS → PASS | Korunan önceki kanıt · T1 #16 |
| G05 | Değişikliği tek Undo ve yerel kayda bağlama | PARTIAL → PASS | AUD-001/007 · Tek komut geçmişi ve iki depo hata koşulları korunuyor. |
| G06 | Etiket düzenlerken yanlış kamera hareketini durdurma | PASS → PASS | Korunan önceki kanıt · DO event stop; B:boyut düzenleme |
| H01 | IndexedDB+senkron localStorage otomatik kurtarma | PARTIAL → PASS | AUD-001/007 · Başlangıç revizyonu, eski oturum kurtarması ve bağımsız iki yazma yolu test edildi. |
| H02 | F5 sonrasında historyPast/historyFuture korunumu | PASS → PASS | Korunan önceki kanıt · T2 session; B:F5/history-after-open |
| H03 | Kaydet yeni checkpoint ve geçmiş sıfırlama | PASS → PASS | Korunan önceki kanıt · T1 #17; B:checkpoint |
| H04 | Kaydet konumu Ölçüler düğmesinin hemen solu | PASS → PASS | Korunan önceki kanıt · browser-final.jpg |
| H05 | Kaydedildi/değişti/otomatik kurtarma hata durumları | PASS → PASS | Korunan önceki kanıt · B; PER:error |
| I01 | Normal/X-Ray/Gizle bütün geçiş sıraları | UNVERIFIED → UNVERIFIED | UAT 4 · Önceki görünüm yolları mevcut. Normal/X-Ray/Gizle sıraları son sürümde gerçek tarayıcıda tekrarlanacak. |
| I02 | X-Ray sonrası Normal'de tüm kapak yüzeyi tıklanabilirliği | UNVERIFIED → UNVERIFIED | UAT 4 · X-Ray dönüşünde normal raycast kaynakta korunuyor. Gerçek fareyle kapak yüzeyi kabulü bekliyor. |
| I03 | Kapak/kulp tıklaması hücre seçimini değiştirmez | PASS → PASS | Korunan önceki kanıt · T1 #20; ST |
| I04 | Çekmece ön/kulp tıklaması yalnız hareketi etkiler | PASS → PASS | Korunan önceki kanıt · T1 #20; B:drawer normal/edit ayrımı |
| I05 | Kapalı opak kapak arkası hücreyi seçtirmeme | PASS → PASS | Korunan önceki kanıt · T7 sliding coverage; WC/WM |
| I06 | Raf/ayakkabılık/çift askı/yüklük/köşe kararlı sanal aralık kimlikleri | PASS → PASS | Korunan önceki kanıt · T1 #18; I:resolved hücreler |
| I07 | Tek görünür aralık seçimi yalnız o aralığı vurgular | PASS → PASS | Korunan önceki kanıt · B:corner second/three middle cells |
| I08 | İhtiyaçta realizeSubInterval; komşuları koruma | PASS → PASS | Korunan önceki kanıt · T1 #19; B:547/359/359/359/548 |
| I09 | Dekoratif eşyalar ve analiz katmanı seçimi engellemez | PASS → PASS | Korunan önceki kanıt · B:items-raycast; NOOP_RAYCAST kaynakları |
| J01 | Seçim aracıyla 3D/2D dikdörtgen sürükleme | PASS → PASS | Korunan önceki kanıt · B:2D gerçek drag; WC |
| J02 | Şeffaf iç, siyah kesikli kontrast kontur | PASS → PASS | Korunan önceki kanıt · browser-marquee.jpg; WC CSS |
| J03 | Sürüklerken canlı kapsanan hücre vurgusu | UNVERIFIED → UNVERIFIED | UAT 5 · Marquee pointer kimliği ve iptal temizliği düzeltildi. Canlı vurgunun ara kareleri gerçek sürüklemede gözlenecek. |
| J04 | Bırakınca selectedCellIds grubunu oluşturma | PASS → PASS | Korunan önceki kanıt · B:3 hücre/1113 mm |
| J05 | Seçim esnasında OrbitControls devre dışı | PASS → PASS | Korunan önceki kanıt · WC controlsEnabled; B:drag |
| J06 | Çoklu seçime ortak işlem ve tek Undo | PASS → PASS | Korunan önceki kanıt · T1 #22; B:count/equal |
| K01 | Seçimin yanında tek/grup paneli | PASS → PASS | Korunan önceki kanıt · browser-drawer-editor.jpg; browser-final.jpg |
| K02 | Dikey/yatay bölme ve modül atama | PASS → PASS | Korunan önceki kanıt · T1 #9; POP; B |
| K03 | Sayı/ölçü/eşit/orantılı ortak işlemler | PASS → PASS | Korunan önceki kanıt · T1 #22/#24; B:count |
| K04 | Panelin kamera izleme ve viewport sınırları | PARTIAL → PARTIAL | UAT 5/6 · Yüzen panel genişliği tuvale göre sınırlanıyor. Dar ekran ve seçim üstüne gelme durumları gerçek görünümde kontrol edilecek. |
| K05 | Sağ gelişmiş denetçi aynı komutları kullanır | PASS → PASS | Korunan önceki kanıt · POP/APP→ST; B |
| K06 | Uyumsuz seçimde açıklamalı devre dışı işlemler | PASS → PASS | Korunan önceki kanıt · TM grup analizleri; T1 #21/#27 |
| L01 | Tek hücrede X/Y/Z gerçek eksen ölçüleri | PASS → PASS | Korunan önceki kanıt · browser-final.jpg; SD |
| L02 | A/B kolunda yerel genişlik/derinlik yönü | PASS → PASS | Korunan önceki kanıt · CS mapRun; T5 B wall; I:runChecks |
| L03 | Bitişik grubun ara paneller dahil gross ölçüsü | PASS → PASS | Korunan önceki kanıt · B:1113=1077+36; T1 #21 |
| L04 | Kopuk/farklı eksenli seçimde anlamsız toplam yapmama | PASS → PASS | Korunan önceki kanıt · TM analyzeSelectedCellsGroup; T1 #21/#27 |
| M01 | Oranları koru | PASS → PASS | Korunan önceki kanıt · T1 #24 |
| M02 | Eşit dağıt | PASS → PASS | Korunan önceki kanıt · T1 #22; B |
| M03 | Raf/aralık sayısı 6→7 veya seçili grupta 2→3 | PASS → PASS | Korunan önceki kanıt · T1 #22; B:359/359/359 |
| M04 | Kalınlık ve tamsayı remainder sıfır kayıp | PASS → PASS | Korunan önceki kanıt · I:3000 flex; B:gross 1113 |
| N01 | X sola/sağa yönlü genişlik | UNVERIFIED → UNVERIFIED | UAT 2 · Sol ve sağ komutun sabit uçları otomatik regresyonda geçti. İki yönün gerçek fare ve yüzen panel denemesi bekliyor. |
| N02 | Y yukarı/aşağı ve komşu koruma | PASS → PASS | Korunan önceki kanıt · T1 #23/#24; B:corner resize |
| N03 | Z ön yönünde net derinlik | PASS → PASS | Korunan önceki kanıt · T2 net 500 mm üç kalınlık |
| N04 | Z arka yönünde sabit ön sınır | FAIL → PASS | AUD-004 · A ve B arka ankrajı ön cephenin dünya koordinatını koruyor. Ön ray ve Undo/Redo ayrıca test edildi. |
| N05 | Sabit/hareketli sınır etiketi gerçek sonuçla eşleşir | PARTIAL → PASS | AUD-004 · Arka ofset ve ön sınır aynı taslak ve komit hesabından. Duvarı aşan büyüme engelleniyor. |
| O01 | Komşuyu sessiz otomatik küçültmeme | PASS → PASS | Korunan önceki kanıt · B:64 mm çakışma önce taslak |
| O02 | Draft intent ve kırmızı hacim | PASS → PASS | Korunan önceki kanıt · browser-corner-draft.jpg |
| O03 | Milimetrik çakışma miktarı | PASS → PASS | Korunan önceki kanıt · B:64 mm |
| O04 | Kullanıcı onayıyla komşuyu dengeleme | PASS → PASS | Korunan önceki kanıt · B:736/800/672 |
| O05 | Geçersiz taslağı geçerli/üretim geometriyle karıştırmama | PASS → PASS | Korunan önceki kanıt · TM/ST draft ayrımı; PP |
| O06 | Toplu işlem tek Undo; JSON/checkpoint uyumu | PASS → PASS | Korunan önceki kanıt · T1 #23/#24; B:Undo |
| O07 | Hafif parametrik çözüm; ağır fizik yok | PASS → PASS | Korunan önceki kanıt · TM; package.json |
| P01 | Kararlı cell+index kimliği ve bağımsız seçim | PASS → PASS | Korunan önceki kanıt · T1 #26; B:drawer 1 |
| P02 | Normal tıklama aç/kapat | PASS → PASS | Korunan önceki kanıt · T1 #20; B:motion-interlock |
| P03 | Düzenleme/çoklu araçta tıklama seçim | PASS → PASS | Korunan önceki kanıt · B:drawer-edit; T1 #26 |
| P04 | Shift/Ctrl ile birden fazla çekmece seçimi | UNVERIFIED → UNVERIFIED | UAT 5 · Çoklu çekmece seçim komutları mevcut. Shift/Ctrl ile gerçek çoklu tıklama bekliyor. |
| P05 | Tek ön yüksekliği ve kardeş dengeleme | PASS → PASS | Korunan önceki kanıt · B:227→250, diğer 205/227; Undo |
| P06 | Grup yüksekliği ve adet kontrolü | PASS → PASS | Korunan önceki kanıt · T1 #26; POP |
| P07 | X/Z fiziksel boyut düzenlemesi | PASS → PASS | Korunan önceki kanıt · T2 Z; TM/POP |
| P08 | İç/dış çekmece konumu | PASS → PASS | Korunan önceki kanıt · T1 #10/#12; CS |
| P09 | Kızak mekanik parametre seçimi | PARTIAL → PASS | AUD-023 · Çekmece grubunda kızak türü ve çözülmüş çıkma mesafesi var. |
| P10 | Çekmece ölçülerinde kalınlık ve gerçek net hacim | PARTIAL → PASS | AUD-005 · 50 mm yan ve 18 mm tabanda 32 mm net yükseklik doğrulandı. |
| P11 | Undo/Redo, kayıt ve JSON uyumu | PARTIAL → PASS | AUD-001/007/023 · Kayıt, geçmiş ve kızak seçiminin JSON turu otomatik testte. |
| Q01 | sourceLeafId/ebeveyn ile grubu ayırt etme | PASS → PASS | Korunan önceki kanıt · T1 #27 |
| Q02 | Her grupta kendi gross'unu koruyarak ayrı eşitleme | PASS → PASS | Korunan önceki kanıt · TM batch group; T1 #27 |
| Q03 | Aralık adedini gruplara topluca uygulama | PASS → PASS | Korunan önceki kanıt · T1 #27 |
| Q04 | Toplu modül atama | PASS → PASS | Korunan önceki kanıt · TM batchAssignInsert; ST |
| Q05 | Bitişik grupları açık komutla birleştir/yeniden böl | PASS → PASS | Korunan önceki kanıt · T1 #27 |
| Q06 | Sabit/mechanik sınırları otomatik tek hacme çevirmeme | PASS → PASS | Korunan önceki kanıt · TM grup uyumlulukları; T1 #27 |
| R01 | Düğme Çoklu Seçim solunda | PASS → PASS | Korunan önceki kanıt · browser-final.jpg |
| R02 | Gövde geri planda; kapak sınırları belirgin | PASS → PASS | Korunan önceki kanıt · B:editor |
| R03 | Editörde tıklama seçer, hareket ettirmez | PASS → PASS | Korunan önceki kanıt · B:poses 1458/982/0 korundu; T7 |
| R04 | Kapak paneli ve sade iç kontroller | PASS → PASS | Korunan önceki kanıt · POP; B:editor |
| R05 | Normal moda dönünce aç/kapat geri gelir | PASS → PASS | Korunan önceki kanıt · SI/WC mode gate; B |
| R06 | Tek sol/sağ, çift, açık front | PASS → PASS | Korunan önceki kanıt · T1 #10/#28; FC/FE |
| R07 | Üst yüklük/alt ayrı ve kısmi yükseklik | PASS → PASS | Korunan önceki kanıt · T1 #28; B:hybrid |
| R08 | Birden çok bitişik Bay ortak kapak | PASS → PASS | Korunan önceki kanıt · T7 front coverage |
| R09 | En/boy, kapsam, yStart/yEnd, menteşe açı/yön kontrolleri | PASS → PASS | Korunan önceki kanıt · FE/POP; T1 #28; T7 |
| R10 | Kapak ekle/kaldır/böl/birleştir | PASS → PASS | Korunan önceki kanıt · T1 #28; T7; B:upper hinged |
| R11 | Açıklık payları ve geometrik tutarlılık | PARTIAL → PASS | AUD-009/017 · Gerçek yarım mm merkez, pivot, derz ve kulp yüzeyi nominal üretim tablosuna bağlı. |
| S01 | Hücre/çekmece/kapak günlük özellikleri yüzen panelden erişilir | PARTIAL → PASS | AUD-018/023 · Bağlamsal panelde 32 mm raf ve çekmece kızak kontrolleri var. |
| S02 | Gelişmiş kontroller daraltılabilir | PASS → PASS | Korunan önceki kanıt · B; POP |
| S03 | Sol genel, sağ inceleme, yüzen günlük rol ayrımı | PASS → PASS | Korunan önceki kanıt · APP/POP; browser-final.jpg |
| S04 | Panel kendi içinde scroll ve ölçülerin üzerinde katman | PASS → PASS | Korunan önceki kanıt · POP overflow/z-index; B |
| S05 | Tüm ekran boyutlarında taşmama ve seçimi kapatmama | UNVERIFIED → UNVERIFIED | UAT 6 · Dar ekranda açılır yan paneller ve tuval genişliğine bağlı popover var. Ekran boyutları canlı doğrulanacak. |
| T01 | Uygun A/B uçlarında yalnız+ tetikleyici | PASS → PASS | Korunan önceki kanıt · END; browser-final.jpg |
| T02 | Sabit/Flex genişlik ve başlangıç iç düzen seçimi | PASS → PASS | Korunan önceki kanıt · END; T1 #30 |
| T03 | Raf/askı/çekmece/ayakkabı/servis/boş başlangıçları | PASS → PASS | Korunan önceki kanıt · END katalog |
| T04 | Derinlik/yükseklik bilgisi | PASS → PASS | Korunan önceki kanıt · END |
| T05 | Uzat / Flex ile paylaştır açık seçenekleri | PASS → PASS | Korunan önceki kanıt · END; TM; T1 #30 |
| T06 | Mevcut sabitleri sessiz bozmama | PASS → PASS | Korunan önceki kanıt · T1 #30; FM retleri |
| U01 | Köşe tek Y aralığı bağımsız düzenleme | PASS → PASS | Korunan önceki kanıt · B:ikinci 736→800 |
| U02 | Kırmızı çakışma/onayla komşu dengeleme | PASS → PASS | Korunan önceki kanıt · B:64 mm; Undo |
| U03 | Köşe X/Y genişliğinin tüm modül kol ölçüsü olduğunu açıklama | PASS → PASS | Korunan önceki kanıt · POP corner controls; T1 #29 |
| U04 | Köşe kolu alanı ile gerçek çözüm uyumu | PARTIAL → PASS | AUD-012 · Girilen beşgen kol uzunluğu kullanılıyor veya gereken ölçü açıkça gösteriliyor. |
| U05 | Çekmece X/Y/Z, ön/grup/derinlik kontrolleri | PASS → PASS | Korunan önceki kanıt · T1 #26; T2 Z; B:drawer-edit |
| V01 | 3D position/target/yön/yakınlık 2D dönüşünde korunur | PASS → PASS | Korunan önceki kanıt · Kaydedilmiş 3D ref; B:orbit→2D→3D |
| V02 | 2D cephe ve plan kendi kamera durumunu korur; yalnız açık resetle varsayılana döner | UNVERIFIED → UNVERIFIED | UAT 6 · A, B ve plan için bağımsız konum, hedef ve zoom belleği eklendi. Pan/zoom ve açık reset canlı doğrulanacak. |
| V03 | Açık Görünümü Sıfırla komutu | PASS → PASS | Korunan önceki kanıt · WC cameraResetTick; B |
| W01 | 5/10/20 işlem geri al menüsü | PASS → PASS | Korunan önceki kanıt · APP; T1 #30 |
| W02 | Gerçek checkpoint'e dönme | PASS → PASS | Korunan önceki kanıt · T2 75 işlem/50 history |
| W03 | Adım listesi ve tıklanan adıma dönme | PASS → PASS | Korunan önceki kanıt · APP; ST undoSteps |
| W04 | Redo yolunu koruma | PASS → PASS | Korunan önceki kanıt · T2 checkpoint; B:version Undo/Redo |
| X01 | Global ana panel kontrolü varsayılan 18 | PASS → PASS | Korunan önceki kanıt · APP; S; I:18/8 |
| X02 | Global arkalık/taban kontrolü varsayılan 8 | PASS → PASS | Korunan önceki kanıt · APP; S; I:18/8 |
| X03 | Gövde, raf, dikme, kapak, çekmece ön/yan/arka ana kalınlığı | PASS → PASS | Korunan önceki kanıt · I:thickness; T8 25/4 |
| X04 | Arkalık ve çekmece tabanı ikinci kalınlık | PASS → PASS | Korunan önceki kanıt · I:18/8, 25/4, 18/3, 16/6, 22/10 |
| X05 | Kalınlık değişirken dış ölçüleri sabit/neti yeniden hesaplama | PASS → PASS | Korunan önceki kanıt · I:800−2 t, 600−tb; T1 #25 |
| X06 | Köşe ve nişin yeni kalınlıkla tutarlı çözümü | PARTIAL → PASS | AUD-005/013 · 18/8, 25/4 ve 18/3 işleniyor. Farklı kalınlıklı L kolları açıkça reddediliyor. |
| X07 | Kalın/ince panel ve donanım uyarısı | PASS → PASS | Korunan önceki kanıt · I:asymmetric HEAVY/THIN; T8 |
| X08 | Undo/kayıt/JSON/legacy 18-8 varsayılanları | PASS → PASS | Korunan önceki kanıt · T1 #25/#37; T2 legacy; I:legacy |
| Y01 | Düz modern tavana/zemine yakın genel görünüm | PASS → PASS | Korunan önceki kanıt · T1 #34; CS exteriorFinish |
| Y02 | Düz/dekoratifsiz/taç/dolgu/kapalı üst bitiş seçenekleri | PASS → PASS | Korunan önceki kanıt · APP; CS/CO |
| Y03 | Tavan toleransı ve montaj boşluğuna göre uyum | PARTIAL → PASS | AUD-006 · Gerçek üst kot ve kullanıcının bildirdiği montaj payı tavanla kontrol ediliyor. |
| Y04 | Düşük/gizli/klasik baza/ayak/minimal alt bitiş | PASS → PASS | Korunan önceki kanıt · APP; CS; T1 #34 |
| Y05 | Zemin sürtme ve mekanik destek uyarıları | PASS → PASS | Korunan önceki kanıt · CS low-floor-clearance; yapısal alt korunumu |
| Y06 | Düz/çıtasız/ince dolgu/dekoratif/duvar yan bitişi | PASS → PASS | Korunan önceki kanıt · APP; CS sideFinish |
| Y07 | Dekorasyon kaldırılınca taşıyıcı panelleri koruma | PASS → PASS | Korunan önceki kanıt · T1 #34 |
| Y08 | Tek tık Düz Gömme/Minimal Bitiş | PASS → PASS | Korunan önceki kanıt · T1 #34; APP |
| Z01 | Türkçe kapsamlı marangoz belgesi hedefi | PARTIAL → PARTIAL | AUD-017/026–028 · Nominal marangoz dosyası genişletildi. Kesin imalat için ürün, bant, birleştirme ve saha kararları bekliyor. |
| Z02 | Proje adı/tarih/sürüm/tip/dış kol ölçüleri | PASS → PASS | Korunan önceki kanıt · P:kapak sayfaları; production.json |
| Z03 | Malzeme ve iki kalınlık özeti | PASS → PASS | Korunan önceki kanıt · P:malzeme sayfaları; bağımsız alan toplamı |
| Z04 | Ölçülü A/B cephe | PASS → PASS | Korunan önceki kanıt · P:SVG/PDF; TS |
| Z05 | Üst plan ve yan kesit | PASS → PASS | Korunan önceki kanıt · P:plan/kesitler |
| Z06 | Genel 3D aksonometri | PASS → PASS | Korunan önceki kanıt · P:her örnek s.3 |
| Z07 | L-köşe bağlantı/parça yerleşim detayı | PARTIAL → PARTIAL | AUD-017/027 · Beşgenin üst/alt, iki dikme, iki arkalık ve raf kodları ayrı patlatılmış şemada. Bağlantı yöntemi ustaya bağlı. |
| Z08 | İç modül çiziminde gerçek raf/kasa görünürlüğü | PARTIAL → PASS | AUD-016 · B arkalığı arkada, raflar önünde. İki B1 PDF sayfası 17 ve kod sırası doğrulandı. |
| Z09 | Benzersiz fiziksel kod/adet/aitlik tam cutlist | PASS → PASS | Korunan önceki kanıt · P:69/94/81/94 eşit; benzersiz kodlar |
| Z10 | Paylaşımlı paneli tek, ayrı komşuları ayrı sayma | PASS → PASS | Korunan önceki kanıt · I:partitions; T8; P |
| Z11 | Malzeme/kalınlık/nominal en-boy/grain bilgisi | PASS → PASS | Korunan önceki kanıt · P:CSV/PDF satırları |
| Z12 | Bütün poligon V noktaları ve yerel-dünya ofseti | PASS → PASS | Korunan önceki kanıt · I:poligon vertices; P:özel paftalar |
| Z13 | Bütün poligon kenar uzunlukları ve gerçek alan | PASS → PASS | Korunan önceki kanıt · I:shoelace/hypot; P |
| Z14 | Poligon iç ve dış/imalat açıları | PARTIAL → PASS | AUD-017 · İç açı ve 180° eksi iç açı olarak düzlemde dış dönüş ayrı alanlarda. İmalat ayarı katalog/ustaya bağlı. |
| Z15 | Diyagonal ön/arka kenar ve damar yönelimi | PASS → PASS | Korunan önceki kanıt · P:V/E referansları ve +X damar oku |
| Z16 | Komşu panellere kesin birleşim tarifi | EXTERNAL VERIFICATION → EXTERNAL VERIFICATION | AUD-027 · Komşu panel bağlantıları ve montaj toleransları kesinleştirilecek. |
| Z17 | Kapak gerçek kesim en/boy/kalınlık ve kodu | PASS → PASS | Korunan önceki kanıt · P:kapak cutlist; I:wideDoors |
| Z18 | Kapak yön/pay/konum/kulp koordinatı ve mekanizma eşleştirmesi | PARTIAL → PASS | AUD-017 · Pivot, yön, ray ve bindirme, gerçek merkez, boşluk, kulp ve donanım eşleştirmesi 15-KAPAK paftasında. |
| Z19 | Her çekmecede 5 gerçek parça; görsel dış kutuyu saymama | PASS → PASS | Korunan önceki kanıt · I:drawers; T8; P |
| Z20 | Organizatörleri ayrı ve imal edilebilir sayma | PARTIAL → PASS | AUD-003 · Dört örnekte toplam 132 organizer parçası ve sıfır iç kesişme. |
| Z21 | Çekmece gerçek net hacim ve kızak boşluğu | PARTIAL → PASS | AUD-005/023 · Net kasa ve planlanan çıkma gerçek çözümden. Ürün montaj payı donanım notunda. |
| Z22 | Arkalık adet/en/boy/kalınlık ve shared/separate ayrımı | PASS → PASS | Korunan önceki kanıt · P; I:thickness/partitions |
| Z23 | Görünür kenar bantlarının kesin planı ve bant kalınlığı | EXTERNAL VERIFICATION → EXTERNAL VERIFICATION | AUD-027 · Görünür kenar, bant türü ve bant kalınlığı usta kararı. |
| Z24 | Ham kesim ve bitmiş nominal ölçünün ayrılması | PARTIAL → PARTIAL | AUD-027 · CSV nominal bitmiş ölçü ve ham kesim durumunu ayrı tutuyor. Ürün/bağlantı seçilmeden ham mm verilmez. |
| Z25 | Ahşap damar yönü işaretleri | PASS → PASS | Korunan önceki kanıt · P:CSV grain ve poligon oku |
| Z26 | Menteşe/ray/kulp/raf desteği/LED/bağlantı listesi | PASS → PASS | Korunan önceki kanıt · P:hardware list; T8 pins |
| Z27 | Katalog delik ölçülerini uydurmama | PASS → PASS | Korunan önceki kanıt · PRO hardware confirmed=false; P |
| Z28 | Negatif/parça boyutu/algılanan kritik hata üretimi engeller | PASS → PASS | Korunan önceki kanıt · T8 block; B:50 mm ray tüm 3 çıktı disabled |
| Z29 | Bütün kritik geometri ve eksik donanımın kapıya girmesi | PARTIAL → PARTIAL | AUD-002/006/026 · Örnek kritikler engelli, katalog belirsizlikleri uzman durumunda. Genel birleşim toleransı ve tüm montaj türleri doğrulanmış değil. |
| Z30 | Uzman/yerinde ölçü ve üretim onayı sınırını açık yazma | PASS → PASS | Korunan önceki kanıt · P:kapak/son sayfa; AUD-026/028 |
| Z31 | PDF/CSV/SVG aynı Design→Resolved→kanonik kaynağı kullanır | PASS → PASS | Korunan önceki kanıt · I:yeniden üretim eşitliği; T8 ZIP |
| Z32 | Kalınlık değişiminde tüm çıktıları yeniden türetme | PASS → PASS | Korunan önceki kanıt · T8 25/4; I:thickness; PRO/TS |
| Z33 | Gerçek A3 boyutu, Türkçe font ve sayfa bölme | PASS → PASS | Korunan önceki kanıt · P:420×297, 127 sayfa; 13 temas+tam detay incelemesi |
| Z34 | Pafta alanının okunur ve ekonomik kullanımı | PARTIAL → PASS | AUD-024 · İki L örneğinde beş eş poligon iki ortak paftaya indi. 124 A3 sayfa render ve görsel kontrolden geçti. |
| Z35 | Gerçek A3 basılı okunabilirlik ve cetvel kontrolü | EXTERNAL VERIFICATION → EXTERNAL VERIFICATION | AUD-028 · Fiziksel A3 yazıcı ve cetvel kontrolü bekliyor. |
| Z36 | Tarayıcı indirmesinin gerçek dosyaya ulaşması | UNVERIFIED → UNVERIFIED | UAT 10 · PDF/CSV/ZIP/SVG üretim fonksiyonlarının çıktıları doğrulandı. Tarayıcı indirmesinin disk yolu son turda gözlenmedi. |
