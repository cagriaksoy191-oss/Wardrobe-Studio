# D3 fiziksel prototip için teknik doğrulama planı

**14 Kasım 2026 · DENEYSEL CAD — ÜRETİM ONAYI YOK**

Bu belge kesim/sipariş listesi değildir. Yazılım prototipi tamamlandı; fiziksel prototip yapılmadı. Tam CAD/BOM ve yerinde ölçü olmadan marangoz üretimine geçilmez. D3'ün net hacim kaybını kullanıcı henüz kabul etmedi.

## Prova adayları ve eleme

**Yalnız donanım/oda/kullanıcı verileri tamamlanırsa** H5/70mm, iki ailede karşılaştırılabilir1:1 modül provası için adaydır.70mm optimum veya üretici minimumu değildir;100mm daha küçük kapasiteyle duyarlılık kontrolü,40mm daha büyük kapasite fakat ilk kanatta90° altı sınır örneğidir. Her iki iç düzen de korunur; raf/askı tercihi yapılmaz.

| Aday | Kutu dağılımı | İlk A kutusu | Servis kutusu | Model kullanım sırası |
|---|---|---|---|---|
| EXPERIMENTAL_D3_001_70_shelf_H5 | A770+770+770; B954+956 | Net734×2244×592; alt620mm dış çekmece bankı; boru1700mm | 670×670×2400, T18/TB8 | Komşu modül kapalı; hedef çift kapak90°; kullan; ters kapa |
| EXPERIMENTAL_D3_002_70_shelf_H5 | A810+810+810; B636+636+638 | Net760×2230×596; aynı program | 550×670×2400, T25/TB4 | Aynı; B raf derinliği461mm, askı B'de değil |

Hanging varyantında ikinci A kutusunun beş raf paneli kaldırılıp ikinci1700mm boru eklenir.001 kullanılabilir boru1388,0021440mm; daha az raf kalır. Bu yeni boru eklemesi deneydir, kullanıcının projesine uygulanmadı.

**Elenecek/NO_GO koşulları:** aynı anda bütün kanatların155° ve tüm çekmecelerin tam açık olması zorunluysa mevcut yerleşim;480mm askı zarfından dar net hücre üreten250mm yaprak üst sınırı deneyi;25mm kanadı23mm sınırındaki mekanizmaya takmak; gerçek H1 katlanır yörüngesini iki sabit pivotla doğrulanmış saymak; istenmeyen kapasite kaybı; gerçek oda/insan/donanım verileri olmadan fiziksel üretim. Çekmecelerin kalabalık açık pozda kısalmasını kullanıcı kullanım kolaylığı açısından reddedebilir; bu karar yazılım tarafından örtülmez.

## Gerekli dört veri paketi

1. **Gerçek oda ve montaj:** iki duvar boyunca farklı yüksekliklerde uzunluk, açı/gönye, tavan/döşeme eğimi, süpürgelik/priz/kolon, ankraj zemini, yatak/oda kapısı ve tam hareket zarfları, montaj/taşıma sırası. Mevcut3000/2600×2400 ve derinlikler sadece referanstır. Kesin duvar/kapak ve insan geçiş payları bu verilerden türetilir.
2. **Gerçek levha ve kütle:** levha türü, ölçülmüş T/TB/bant/yoğunluk; kısa/uzun kapak ve gerçek kulpu ayrı tartım; nem/eğrilik, izin verilen raf yükleri/sehim.650–800kg/m³ ve1kg donanım payı ölçüm yerine geçmez. Her kapak için kütle kayıt tablosu doldurulur.
3. **Tam üretici CAD/BOM:** H5'te gerçek71B7550/uygun alternatif, montaj plakası, TB/örtme/derz, uzun/kısa kapak adedi, vidalar ve delik planı; H1'de9237880/9237881 tarafı, doğru Sensys8675 varyantı, katlama menteşeleri, taşıyıcı/kılavuz profiller ve aktivasyon. Gerçek bağlantı yörüngesi içeren CAD veya ölçülmüş kinematik; ray ürünü/stroku/yükü; montaj revizyonu ve üretici uygulama onayı. Kesin sipariş kodları eksikken set tamamlandı denmez.
4. **Gerçek eşya ve ergonomi:** kişilerin günlük/üst erişim ölçüleri, kavrama ve kuvvet sınırı, gerçek askı kancası/giysi boyu, dolu çekmece/kutular, raf eşyaları.310/480mm senaryoları karşılaştırma içindir. Borudan ayırma, dikey kaldırma ve dönüş yolu ayrı gerçek hareket olarak ölçülür.

## 1:1 fiziksel kabul yöntemi

Önce tek köşe yakın A modülü, ilk B modülü ve servis kutusu sınırı birlikte kurulacak mühendislik maketi için usta/üretici tasarımı onaylar. Kapak kısa/uzunluğu ve25mm sınırı nedeniyle iki aile ayrı değerlendirilir. Bağlantı güvenliği doğrulanmadan yük veya ömür testi yapılmaz. Bu görevde malzeme kesilmedi ve donanım sipariş edilmedi.

| Test | Ölçülecek kanıt | Geçiş kapısı |
|---|---|---|
| Kapalı dış yüz | Kapak/çekmece/filler derz haritası, servis kutusu kapanışı, montaj fotoğrafları | Açık depolama kalmaması; üretici derzleri; kapalı servis hacminin kullanılabilir sayılmaması |
| Gerçek açma/ters kapama | Her kanat açı/kuvvet eğrisi, komşu kapak/kulp/panelle en küçük açıklık, yanlış sıra | Üretici sınırları içinde sürtme/çarpışma olmaması; zorunlu sıra varsa kullanıcı tarafından kabul |
| Dış çekmece | Gerçek rayla yüklü açılma mm, ön/kulp/kapak zarfı, geri kapama | İstenen işlevsel strok ve kapanma;485/489mm varsayımı yerine ölçülmüş katalog/montaj sonucu |
| Raf | Gerçek280×360mm ve kullanıcının eşyalarıyla arka/yan konumlardan çıkarma videosu | Eşya, el ve kol için kanıtlı yol; yalnız ön açıklığın geniş olması yetmez |
| Askı | Kancayı kaldırma, ayırma, giysiyle çıkarma/dönme, boru boyunca konum ve insan erişimi |1700mm'nin kişi için uygunluğu; uçlar/merkezde gerçek kullanım; üst profil veya dolguya takılmama |
| Oda | Gerçek yatak/oda kapısı ve kullanıcı hareketiyle açık konum | Katıların ve gerekli insan alanının birlikte sığması |
| Yük/tolerans | Üreticinin yöntemiyle vida, bağlantı, yüklü raf/kapak, gerçek imalat sapması | Seçilmiş ürün/levha ve yetkili kişinin kabul sınırları; yazılımın uydurduğu bir güvenlik katsayısı değil |

Her konum için sonucu ACCESSIBLE, CONDITIONALLY_ACCESSIBLE, BLOCKED, NOT_MODELED veya UNVERIFIED_PHYSICAL olarak ayrı kaydedin. Fiziksel erişim mümkünse yazılım alt sınırının dışındaki yol ölçülüp belgelenebilir; önceden geçmiş sayılmaz. Fiziksel sonuç başarısızsa D3 de reddedilir.

## Kabul ve gelecekte entegrasyon

Geometri PASS ≠ gerçek donanım PASS ≠ fiziksel kullanım PASS. H5 için mevcut sonuç ACCESS_PARTIAL/PHYSICAL_TEST_REQUIRED; H1 hareketi NOT_MODELED. İmalata geçiş; dört veri paketi, üretici/usta kontrolü, gerçek oda/insan provası ve **kullanıcının sayısal kapasite kaybını kabulü** ile ayrı karar gerektirir. Bundan sonra bile Design/UI entegrasyonu ve üretim kilidini açma yeni bir görevdir.

Üç P0 açık kalır; tanısal PDF/SVG ve CSV/ZIP engelleri korunur. Bu rapor kullanıcı kayıtlarını dönüştürme, main'e merge veya Cloudflare yayın izni vermez.
