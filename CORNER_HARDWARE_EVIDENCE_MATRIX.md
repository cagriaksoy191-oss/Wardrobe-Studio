# Köşe donanımı kanıt matrisi

14 Kasım 2026 · Erişim tarihi bütün harici kaynaklarda **2026-11-14**. Bu belge satın alma listesi veya üretici proje onayı değildir. `UNVERIFIED`, ilgili değerin bu çalışma için doğrulanmadığını belirtir. Eksik değer sıfır kabul edilmez. Aday kararları [aday raporunda](CORNER_DESIGN_CANDIDATES.md), hesaplar [mühendislik raporunda](CLOSED_CORNER_ENGINEERING_RESEARCH.md).

## Kaynak ve sürüm yöntemi

Ürün sayfası, teknik planlama ve montaj belgesi ayrı okundu. PDF'lerin ilgili şekilleri render edilerek incelendi. Hettich WingLine L kılavuzu web okuyucusunun boyut sınırını aştığından doğrudan üretici adresinden indirildi. Hawa'nın eski `www.hawa.com/_Resources/...` adresi 404 verdi; güncel üretici broşürünün CDN kopyası kullanıldı. Hiçbir üreticiye kullanıcı dosyası gönderilmedi, yazışma veya sipariş yapılmadı.

Blum'un `/2026/catalogue/en/` yayınının iç başlığı **Catalogue 2027/2028**. Aşağıdaki sayılar belgenin **basılı sayfa numarasıdır**; web başlığı bazen dört fazla sayar. Kullanıcının verdiği 2024/2025 s. 718 de ayrıca okundu; menteşe adedi tablosudur, köşe mekanizması onayı değildir. Güncel karşılığı s. 734'tür.

## H1 — Hettich WingLine L, 25 kg, kapanma yayı olmayan set

| Alan | Belgelenen bilgi / uygulanabilirlik |
| --- | --- |
| Model ve kod | **9237880 sol**; sağ karşılık **9237881**. Bunlar 9237852 gibi kendiliğinden kapanan setlerle karıştırılmamalı. |
| Ürün / katalog | [9237880 teknik sayfa](https://shop.hettich.com/in_EN/Folding-door-systems/WingLine-L-folding-door-system/1-Running-and-guide-components/Sets-of-standard-fittings/WingLine-L-set-of-fittings-for-max-door-wing-weight-of-25-kg-without-self-closing-feature,-600-mm,-left/p/9237880), “Technical details / Advice”; [üretici föyü](https://www.hettich.com/fileadmin/Media_Center/Catalogue/Hettich_Product_Leaflet_WingLine_L_2023.pdf), “Performance summary”. |
| Montaj | [MTA 9 236 822 03, 16.11.2020](https://web2.hettich.com/hbh/addon/montage/MTA_923682203_WingLine_L_25kg.pdf), özellikle **s. 3–4**. Güncel ürün sayfası bu kılavuza bağlıdır. |
| Ölçü / yük | İki kanatlı katlanma; **kanat başına ≤25 kg, genişlik 250–600, kalınlık 16–25 mm**. Kılavuz yüksekliği **1000–2400 mm**, föy **500–2400** gösteriyor: alt sınır farkı `UNVERIFIED`; 2276 mm aday bundan etkilenmiyor. |
| Bağlantı | Setin ray/rehber parçaları ve merkez menteşeleri; profiller ayrıca. Bu yaylı olmayan sette gövde menteşesi de kapanma yaysız; öneri **Sensys 8675, 110°**. Pull/Push to move kombinasyonu gerekiyor. |
| Boşluk / montaj | S.3 yüksekliğe/yüke bağlı menteşe dağılımı; 2276 mm için 2400 mm sınıfı incelenmeli. S.4'te etkin açı, yan mesafe ve katlanmış paket kalınlığa bağlı; örneğin D=25/B=450 satırı, standart 110° menteşeyi etkin 100° kesitle gösterir. Bu, modeldeki 155° B1 hareketi değildir. |
| Türkiye | [Hettich Türkiye ürün ailesi](https://shop.hettich.com/tr_TR/Katlan%C4%B1r-kapak-sistemleri/Katlan%C4%B1r-kapak-sistemi-WingLine-L/c/group616454636136) mevcut. Tam setin güncel stok/termini **UNVERIFIED**. |

**Karar:** 1535 mm tek kanat veya onun ikiye bölünmüş yaklaşık 766 mm yaprakları bu sisteme uymaz. Yeni dikdörtgen modülde 550×2276×18 veya 450×2276×25 mm yapraklar yalnız ölçü/yük ön elemesini geçebilir; gövde, bağlantı ve hareket eşleşmesi tamamlanmadı.

## H2 — Hettich Wing 77, dört kanatlı serbest paket

| Alan | Belgelenen bilgi / uygulanabilirlik |
| --- | --- |
| Model / ürün | **70987 / 0070987**, dört kanat; [teknik ürün sayfası](https://shop.hettich.com/au_EN/Folding-door-systems/Wing-77-folding-door-system/Sets-of-fittings/Set-2-Wing-77,-1-folding-sliding-door-with-4-panels/p/70987), “Technical details / Set comprises”. |
| Montaj | [071 374-08/03, iki sayfa](https://web2.hettich.com/hbh/addon/montage/71374_WING_77_4_TueRIG_NEU.pdf), **s. 1 kesit ve hareket, s. 2 gövde/kanat hesabı**. |
| Yük / boyut | Her yaprak **≤20 kg**, **≤400 mm** genişlik, yaklaşık **≤2400 mm** yükseklik. Dört yaprak paketi en çok 1600 mm. Minimum en/boy **UNVERIFIED**. Kalınlığa göre çizilmiş bağlantı örnekleri var; s. 2'deki 19/25 mm detayları tüm levhalar için genel onay sayılmaz. |
| Kinematik | Yana sabit menteşe yerine üst taşıyıcı ve alt rehberle katlanan/yer değiştiren paket. **9193574** taşıyıcı profil, **70985** rehber profil ayrıca; [üretici aile listesi](https://shop.hettich.com/us_EN/Folding-door-systems/Wing-77-folding-door-system/c/group743682361007). |
| Kritik gövde koşulu | Desteksiz iç göz **800 mm'yi aşmamalı**; yüklü üst tabla sehimi **≤1,5 mm**; orta dikme ve taban **en az 40 mm geri çekilir**. Bunlar üretici koşullarıdır, bu projede ölçülmüş sonuç değildir. |
| Montaj / yön | S.2 kanat eni `(iç açıklık − 3×derz + 2×bindirme)/4`; bindirme en çok 15 mm. Stoper, bağlantı ve rehber yerleri s. 1–2'den seçilir. Açılı beşgen köşeye doğrudan uyarlama onayı **UNVERIFIED**. |
| Türkiye | Hettich kanalı var; **70987 + profillerin** stok/termini **UNVERIFIED**. |

**Karar:** Eski 18 mm B1 adayını dört yaklaşık 382 mm yaprağa bölmek yük/en açısından anlamlıdır. Fakat mevcut net B1 **1512 mm**, 800 mm koşulunu karşılamaz. Yeni taşıyıcı/topoloji ve paket parkının köşeyi serbest bıraktığı doğrulanmadan eşleşmiş sayılamaz. 384×2276×25 mm yaprak, yüksek yoğunluk ve ek kütlede 20 kg'ı aşabilir.

## H3 — Hawa Folding Concepta III V2 25 Pull

| Alan | Kanıt / koşul |
| --- | --- |
| Teknik kaynak | [Güncel aile broşürü](https://a.storyblok.com/f/322161/x/87676ac3cf/en_brochure_hawa_concepta_iii_family_a4.pdf), **s. 91 özellikler, s. 92–95 kesit/BOM, s. 104 derinlik**; [üretici aile sayfası](https://the.hawa.com/products/hawa-concepta-3-family). |
| Kodlar | V2 sol **53444**, sağ **53445**. Zemin bağlantılı gövde ray seti **53446/53447**, iki kapaklı ön ray **53450/53451**, dikme **31520**. Üst modül için gövde rayı **53448/53449** farklıdır. Eski 31507 temel setini V2 parçalarıyla karıştırmayın. |
| Sınırlar | Katalog kapak yükü **10–25 kg**, yükseklik **1900–2700**, genişlik **350–750**, kalınlık **18–26 mm**. Aile web özetinde en alt sınırı 440: sipariş konfigürasyonu teyit edilmeli. |
| Hareket / montaj | Dönme+katlanma+yan cebe girme; sabit pivot değildir. S.91 kesitinde 110 mm yerleşim, üstte≥40 mm; s. 92 derzler 2–5 mm. Bunlar farklı yönlerdeki kesit ölçüleridir; tek bir “gerekli boşluk” sayısına indirgenemez. |
| Derinlik | S.104: `T2=TB+92+Z3−M2`, `KT2≥T2`, `M2≥S+75`, `M2≤TB−250`. Seçilen gövde türü için ayrıca montaj kılavuzu/konfigüratör çıktısı **UNVERIFIED**. |
| Tedarik / karar | Türkiye stok/termin **UNVERIFIED**. Dikdörtgen yeni modül araştırması; mevcut beşgenin doğrudan donanım karşılığı değil. 550×2276×25 ağır senaryoda 25 kg'ı aşar. 450 mm daha düşük yük verir; cep bağlantısı ve yük biriminin konfigürasyon karşılığı teyit edilmeden onay yok. |

## H4 — Blum CLIP top köşe katlama menteşesi

**79T8500** vidalı, **79T8530** çakma. [Güncel katalog s. 110](https://publications.blum.com/2026/catalogue/en/110/) ve [s. 111 planlama](https://publications.blum.com/2026/catalogue/en/111/); [montaj/ayar girişi a 210](https://www.blum.com/a210). Eski [2024 s. 116](https://publications.blum.com/2024/catalogue/id/116/) aynı temel kalınlık kısıtını gösterir.

- Ön kalınlığı **15–23 mm**, katalog açısı 60°; **155° veya 170° taşıyıcı menteşeyle birlikte** çalışır. Kapalı L biçimli iki cephenin bağlantısıdır; tek düz diyagonal yaprağı ikiye kesip takmak aynı uygulama değildir.
- Bağımsız maksimum kg, en ve boy **UNVERIFIED**; menteşe adedi/taşıyıcı hesabı gerekir. S.111'deki fabrika kesiti 19 mm'dir; 18 mm için ayar/delik seçimi ayrıca yapılır.
- **25 mm: HARDWARE_INCOMPATIBLE.** 18 mm yeni L cephe: bağlantı planı ve yüklü hareket bekler. Sağ/sol yerleşim, taban menteşesi ve montaj plakası seçilmedi.
- [Türkiye satış noktaları](https://www.blum.com/tr/tr/contact/distributor-addresses/): yerel kanal mevcut; bu kodların stok/termini **UNVERIFIED**.

## H5 — Blum CLIP top BLUMOTION 155°, düz bindirme

**71B7550** vidalı düz kol, **71B7650** yarım bindirme farklıdır. [Güncel s. 78](https://publications.blum.com/2026/catalogue/en/78/), [s. 79 kesit/delik/boşluk](https://publications.blum.com/2026/catalogue/en/79/), [montaj a 210](https://www.blum.com/a210).

155° ve sıfır çıkıntı iddiası **belgelenmiş bindirmeli uygulama** içindir. Kalınlık, tas delik mesafesi ve plaka yüksekliği s. 79 tablosuyla birlikte seçilir; duvara karşı bindirmede deneme önerilir. Tek menteşe için bağımsız genel kg/en/boy limiti **UNVERIFIED**. [S.734 yük/adet tablosu](https://publications.blum.com/2026/catalogue/en/734/) **600 mm referans enine** dayanır; [üreticinin adet açıklaması](https://ea.blum.com/en/number-of-hinges/) 650 mm'ye ilişkin ayrı koşul verir. Bu veriler 1535 mm yaprağa uzatılamaz.

**Karar:** Eski dev B1 için belgelenmiş uygunluk yok; ilave menteşeyle otomatik onay reddedildi. Yeni 450 mm dikdörtgen yaprak için yükseklik/kütleye göre adet, vida tutunması, montaj ve boşluk kontrolü gerekir. Üretici tablolarındaki ayar aralığı, dolabın izin verilen toplam montaj hatası değildir. Türkiye kanal mevcut, tam ürünün stok/termini **UNVERIFIED**.

H4/H5 için `a210` katalogda verilen resmî montaj girişidir; bu oturumun web okuyucusu açamadı. Kod/konfigürasyona özel güncel montaj PDF'sinin indirilmesi **UNVERIFIED** kalır. Teknik planlama sayfasını eksiksiz montaj talimatı gibi göstermeyin.

## H6 — Hettich TopLine XL, üç kapak / iki ray

**9275786**, STB19/17 mm, [ürün ve CAD bağlantıları](https://shop.hettich.com/fr_EN/Sliding-door-systems/Sliding-door-systems-for-overlay-door-position/TopLine-XL-sliding-door-system/TopLine-XL,-Set-of-running-and-guide-components,-STB-19,-17-mm,-18---30-mm,-60-kg,-3-door/p/9275786), “Technical details”; ürünün montaj bölümündeki [TopLine XL çizim paketi](https://web2.hettich.com/hbh/addon/mc/PDF/9275786.pdf), s. 1 “Drawings / Zeichnungen: TopLine XL”. Bu altı sayfalık kesit paketi, bütün aşamaları içeren kurulum talimatı sayılmadı; tam uygulama montaj talimatı **UNVERIFIED**.

Üç ahşap kapak; **iki ray**, kapak başına≤60 kg, en 750–1350 mm, kalınlık 18–30 mm, alt mesafe 17 mm. Minimum/maksimum yükseklik bu ürün sayfasından **UNVERIFIED**. Ön kapak ortada; diğer ikisi arka hatta. Taşıyıcı profil, alt rehber, stoper ve fren setleri aynı kesitle seçilir; 30 mm model ray merkezini bu ürüne eşitlemeyin. Türkiye tam set stok/termin **UNVERIFIED**.

**HARDWARE_INCOMPATIBLE:** Eski 003 adayının 775/775/776 mm yaprakları en/kalınlık/yük ön elemesine sığabilir; üçünün bağımsız hatta park edilmesi bu setin yapısı değildir. 60 kg kapasite bunu değiştirmez.

## H7 — Blum SPACE CORNER / MOVENTO özel köşe çekmecesi

[Türkçe üretici tanıtımı](https://www.blum.com/tr/tr/products/cabinet-applications/space-corner/overview/), “Standart parçalar ile kullanım”: önerilen köşe genişliği 900–1200 mm; TANDEMBOX, MOVENTO veya TANDEM ile **özel gövde/çekmece** mümkündür. Tanıtımdaki 65 kg, her kombinasyonun kapasitesi değildir.

Somut teknik referans: **769.6860S**, **T51.7601 L/R**, [Blum ABD montaj föyü, s. 1–2](https://d2.blum.com/services/BEC003/cme120138_ma_dok_bus_%24sen-us_%24aof_%24v1.pdf). S.1: 33/36/39/42 inç köşe, yan levha en çok 16 mm, **170 lb statik** kapasite. S.2'de 39 inç örnek ve 103 mm ray geri çekmesi var. Bu ABD kombinasyonu 65 kg dinamik veriyle birleştirilmedi. Dolap yüksekliği ve giysi erişimi için genel onay **UNVERIFIED**.

**Karar:** Mevcut 18/25 mm çekmece yanlarına doğrudan uymaz. Özel çekmece kutusu ve köşe topolojisi gerekir; simetrik mutfak örneği 600/480 gardırop askı kabulü değildir. Üstte bağımsız kapalı askılık tasarlanmadan 003'ün iki ihtiyacı birlikte çözülmez. Türkiye aile kanalı var; ABD setinin yerel eşdeğeri/stoku **UNVERIFIED**.

## H8 — Sugatsune MonoFlat UNISON MFU1200

Somut ağır sol set **MFU1200-70-L**; [üretici ürün sayfası](https://www.sugatsune.com/mono-flat-unison-flush-sliding-door-system-heavy-duty-left-mfu1200-70-l/). [Montaj kılavuzu](https://www.sugatsune.com/content/site-assets/Instructions/MFU1200-Instructions-ENG.pdf), **s. 1 sınırlar, s. 2 parçalar, s. 3 işleme**: **800–1200 mm en, ≤2700 mm boy, 30–40 mm kalınlık**. Hafif 40 tipi 20–40 kg; ağır 70 tipi 40–70 kg. Minimum boy **UNVERIFIED**.

Önce içe, sonra yana kayan eş düzlemli kapı; bağlantı **MFU1200-L-BL / R-BL**, ray **MFU1200-RS-BL**, ağır fren **MFU1200-70DSC-BL**. Düşey ve ön/arka ayar±4 mm; bu, serbest çarpışma payı değildir. Taşıyıcı çerçeve ve park hacmi gerekir. Türkiye stok/temsil **UNVERIFIED**.

**HARDWARE_INCOMPATIBLE:** Eski 003'ün 775 mm/18 mm kanatları en ve kalınlık koşullarını; diğer P0'ların 18/25 mm kanatları kalınlığı sağlamıyor. Ağır setin minimum 40 kg yükü de hafif yaprakta karşılanmış sayılamaz.

## H9 — Gerçek üç hatlı ray için raumplus ön araştırması

[SMART Sliding teknik broşürü](https://www.raumplus.de/fileadmin/user_upload/Downloads/Broschueren/97.01.313_SmartSliding_Technik_DE_EN_2024.pdf), **s. 6 yük yolu, s. 7 üç hatlı alt profil seçenekleri, s. 9–13 sistem ayrımı**. Üretici üç hatlı profil seçeneği sunuyor; bu araştırmada üç hattın piyasada hiç bulunmadığı sonucu çıkarılmadı.

Ancak adayın gerekli **tam sistem/profil/teker/rehber kodları, 30 mm merkez uyumu, stoper, alt montaj ve kullanılabilir açıklığı UNVERIFIED**. Broşürdeki genel alt taşımalı 180 kg veya AIR60 kg değerleri seçilmemiş bir sisteme taşınamaz. En/boy/dolgu kalınlığı ve Türkiye tam set tedariki de **UNVERIFIED**. Bu kayıt bir satın alma adayı değildir; üreticiden kesit ve birlikte çalışan BOM istenmesi için somut yönlendirmedir. Tek/çift hatlı Facet ile üç bağımsız ray onayı çıkarılmadı.

## H10 — Dar bağımsız çekmece için Blum MOVENTO 760H5000S

[Güncel katalog s. 420](https://publications.blum.com/2026/catalogue/en/420/): **760H5000S**, NL500 mm, **40 kg dinamik**, tam açılım; **T51.7601 sol/sağ** kilit. [S.421 montaj kesiti](https://publications.blum.com/2026/catalogue/en/421/), [montaj a 410](https://www.blum.com/a410): nominal derinlikNL+3, iç çekmecede ön kalınlığıX ve ek düzenekler ayrıca; yan levha en çok 16 mm; `SKW=LW−42`, `SKL=NL−10`. Yan stabilizasyonun ek derinliği ve geniş göz koşulları ayrıca hesaplanır.

Mevcut 532/529 mm yan parçaları ve 18/25 mm yan levhaları bu ürünün doğrudan kesim listesi değildir. Yeni dar kutu, bağlantı ve yüklü strok doğrulanmalı. Kapak en/boy/kalınlığı alanları bu ürün için uygulanmaz; çekmece önünün izinli yükseklik/ağırlık dağılımı **UNVERIFIED**. NL500 değeri mevcut 451 mm yazılım strokunun üretici belgesi sayılmaz. Türkiye stok/termin **UNVERIFIED**.

## Genel sonuç

**Hiçbir bütün aday `HARDWARE_DOCUMENTATION_MATCHED` durumuna ulaşmadı.** Ürünlerin varlığı ve bazı ölçüleri doğrulandı; projeye özgü bütün yük, bağlantı ve hareket koşulları doğrulanmadı. Kanat yoğunluğu, gerçek donanım kütlesi, oda engelleri, bağlantı tutunması ve toleranslar [fiziksel kontrol listesine](CORNER_PHYSICAL_VALIDATION_CHECKLIST.md) bağlıdır. Üç P0'ın üretim engelleri sürer.
