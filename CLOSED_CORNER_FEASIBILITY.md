# Kapalı cephe fizibilitesi — WS-UX-001, 002, 003

12 Kasım 2026 · Dal: `fix/autonomous-ux-hardening` · Başlangıç: `5de4fad8358cf1221673a94bdaee1a67b591bb22`.

Üç P0 bulgu **açık — BLOCKED_EXTERNAL_VALIDATION**. Her biri için mevcut veri modeliyle ifade edilebilen bir kapalı cephe adayı bulundu. Bunlar laboratuvar tasarımlarıdır; uygulamadaki örneklere, kullanıcı kayıtlarına ve üretim kurallarına işlenmedi. Stok donanımı eşleşmesi, yük altında hareket ve atölye ölçümü doğrulanmadı.

## Ölçüm yöntemi

[Tekrar çalıştırılabilir prob](artifacts/autonomous-ux-hardening/closed-corner-probe.mjs) kanonik JSON'un bellekteki kopyalarını üretir. 22 beşgen, 22 asimetrik beşgen ve 13 kör köşe senaryosunda şema, `solveDesign`, üretim parçası listesi ve `functionalAccess` sonucu okunur. Öne çıkan adayların açma ve ters sırada kapama komutları aynı `constrainMotion` fonksiyonuna yeniden verildi. [Ham sonuçta](artifacts/autonomous-ux-hardening/closed-corner-probe.json) kanat kesimleri, hareket adımları, diğer engeller, değişen parça kimlikleri ve komut/ulaşılan konum ayrı saklanır.

- Koridor, modellenen hacimler ve seçilen eşya zarfı için tek parça, düz geçiştir. `0/480 mm` askı sonucu, bu yöntemle geçiş doğrulanmadığı anlamına gelir. Döndürerek erişim veya gerçek el boşluğu bu ölçüden çıkarılamaz.
- Parça sayısı üretim modelinin fiziksel parça sayısıdır. Değişen kesim sayısı aynı kimlikte ölçü, poligon, malzeme veya lif yönü değişikliğini sayar. Menteşe, kızak ve bağlantı BOM'u ayrıca doğrulanmalıdır.
- Üç kanonik modelin kapalı dış zarfı 3000 × 2400 × 2600 mm. Öne çıkan varyantlar bu zarfı koruyor. Bu, açık kanatların oda içinde sığacağını veya montajın aynı kalacağını garanti etmez.

| Bulgu | Kanonik engel | Kapalı cephe adayı ve simülasyon | Kesim farkı |
| --- | --- | --- | --- |
| **001 · Beşgen 18/8** | Komşular kapalıyken köşe 5,1°/110°. Raf geçişleri 7/7/7/0 mm, hedef 310. | Köşe kolları 1150×1050, sağa menteşe; B1 tek sol kanat, 155° nominal. B kapalıyken köşe 0°. Önce B1 **155°**, sonra köşe **60°**; dört rafta **458/310 mm**, A çekmeceleri **451/451 mm**. Köşe önce, B1 sonra kapanır; ikisi de sıfıra döndü. | 94→93; 1 parça çıkar, 71 kesim değişir. Köşe 388→675 ×2276×18; B1 tek kanat 1535×2276×18 mm. |
| **002 · Asimetrik beşgen 25/4** | Köşe 12,8°/110°. Raflar 14/14/14/7 mm, hedef 310. | Köşe kolları 1050×1050 ve sağ menteşe; B1 çift kanat kalır. Köşe tek başına **59,6°**, dört rafta **448/310 mm**, A çekmeceleri **454/454 mm**. Ters komutla köşe 0°. | 94→94; 72 kesim değişir. Köşe 464→675 ×2276×25 mm; A/B derinlikleri 600/480 mm kalır. |
| **003 · Kör köşe** | İki rayda çekmece koridoru 1102/1706 mm, üç çekmecenin her biri **49/451 mm**. | A1 dış genişliği 1250→1500; üç ayrı ray, üç kanat. Kanat 2 **−745**, kanat 3 **−1490 mm**; üç çekmece **451/451 mm**, koridor **1462/1456 mm**. İlk çekmeceyi kapatıp kanatları 3→2 sırayla geri getirme probu sıfıra döndü. | 81→82; 1 yeni kanat, 44 kesim değişir. Üç kanat 775/775/776 ×1698×18 mm. |

## Karar ve alternatifler

### 001 · 18/8 mm beşgen

- **Birinci araştırma adayı: B1'i önce açan kapalı düzen.** Modelde başlangıç kesişmesi veya kritik geometri hatası yok. 1535×2276 mm tek B1 kanadı, mevcut çift kanattan çok daha büyük. Nominal 155° değerinin gerçek menteşeyle sağlanması, levha ağırlığı/sehim, taşıyıcı dikme, menteşe adedi, dış açılım alanı ve kullanıcıya kapanış sırasının anlatılması ayrı kapılardır. Yüklü dolapta kapalı komşuyla köşe açılamıyor.
- **Yalnız yön veya nominal açı** yeterli olmadı. Sağ menteşe tek başına 0,2° ve 5/5/5/0 mm; B1'i tek kanat yapıp köşe kollarını korumak en iyi 11/11/11/1 mm. B başlangıç klapasını 60–200 mm yapmak bu modelde köşe yanındaki teması değiştirmedi. Kolları 1050×1050 yapmak 600 mm kanat verdi, ancak sol menteşede 5,1° ve en çok 8 mm koridor kaldı. A üst kanadını tekleştirmek de köşeyi açmadı.
- **Askı ve alternatif iki kanat.** Birinci adaya üst aralıkta askı borusu eklendiğinde düz askı koridoru 365/480 mm; `unverified`. Bölünmüş bir beşgen köşe kanadı veya birbirine bağlı katlanır kanatlar şu an modelde yok. Düz B bölmesindeki `double` iki bağımsız yaprak sağlar; bir köşe katlanma menteşesi gibi kullanılamaz.
- **Kontrol:** Köşe kapağı kaldırılınca 393/393/393/365 mm ölçüldü. Bu, engelin köşe cephe hareketinden geldiğini destekler. Açık cephe üretim çözümü sayılmadı.

### 002 · 25/4 mm asimetrik beşgen

- **Birinci araştırma adayı: 1050×1050, sağ menteşe.** Komşu B1 çift kanat kalır, köşe tek hamleyle açılır. Süpürme A yan dikmesinde durur; 59,6° fiziksel ürün seçimi değildir. 25 mm kanat, eksen/ofset, kenar boşluğu, montaj plakası ve kulp derinliği gerçek ölçülerle doğrulanmalı. Üst aralığa boru konduğunda askı zarfı **355/480 mm**, dolayısıyla askı erişimi ayrıca açık.
- **Daha büyük yedek:** 1150×1050, sağ köşe ve B1 tek sol 155° seçeneğinde köşe 61,5° ve dört rafta 546/310 mm. Köşe kanadı 754×2276×25 mm; 94→93 parça, 71 kesim değişir. Daha geniş B1 kanadı ve üretim farkı nedeniyle ilk sırada değil.
- **Yalnız sağa çevirme** 61,3° ama 253/310 mm; yalnız B1 tek sol en çok 274/310 mm. 780×800 kollar, klapa 60–200 mm veya yalnız B1 nominal açı değişikliği yetersiz. Kapak kaldırılırsa 469/469/469/461 mm; açık cephe kontrol deneyi olarak kalır.

### 003 · Kör köşe, sürgü ve çekmece

- **Birinci araştırma adayı: üç ayrı ray ve daha geniş park bölmesi.** A1=1475 mm ile üç ray dahi **49/451 mm**'de kalıyor; 1500, 1530 ve 1580 mm'de 451 mm ulaşılıyor. Sırasıyla koridor/gereksinim **1462/1456**, **1432/1426**, **1382/1376 mm**. Bu değerler yalnızca **6 mm** nominal toplam koridor farkı verir; çıta, kılavuz, ayar, yüklü kanat sehimleri ve çekmece toleransı bunu tüketebilir. 1500 mm'de A1 valiz rafı 794/480 mm; A2 askı koridoru 0/480 mm ve `unverified`. Bu nedenle çekmece alt problemi iyileşse de tam kapalı gardırop kabulü geçmedi.
- **Üç kanat, iki ray** ayrı bir testti: 49/451 mm ve 0 mm koridor. Üç rayı tek başına eklemek 1474 mm koridor açtı, strok yine 49 mm. İki rayda kanat genişliklerini asimetrik yapmak en iyi 49 mm, diğer dağıtımda 22 mm. A1'i 1630 mm'ye genişletip iki kanat bırakmak da 49 mm'de kaldı. Açılım, ray adedi ve park genişliğinin birlikte çalışmasına bağlı.
- **Çekmeceyi taşıma ve ayrı menteşeli alt cephe.** Çekmece bankasını A1'e taşımak üç kapalı konum kesişmesi ve 0 mm strok; A2 altına tek sağ gömme 155° kanat eklemek dört kesişme ve 0 mm strok verdi. İkisi de mevcut tasarımda reddedildi. Dar, ayrı çekmeceler veya dış çekmece cepheleri ancak yeni bir tasarım çalışmasıyla ele alınabilir; mevcut kapalı görünümün birebir karşılığı varsayılmadı.

## Üretici verisiyle eşleştirme ve açık kapılar

| Donanım | Doğrulanmış katalog bilgisi | Bu tasarımlarda anlamı |
| --- | --- | --- |
| Blum CLIP top 155°, 95° kör köşe ve açılı montaj seçenekleri | 155° bindirmeli model için sıfır çıkıntı uygulaması; kör köşe gömme ve bindirmeli 95° tipler ayrı ürünlerdir. [Blum menteşe kataloğu](https://publications.blum.com/2024/catalogue/id/74/) | 155° B1 adayı için başlangıç noktasıdır. Açılı köşe ve düz B1 ayrı kesit gerektirir. Sabit pivot modeli bağlantı kolunun gerçek yörüngesini taklit etmez. |
| Blum 60° katlanır köşe | Ön yüz 15–23 mm, 155° veya 170° taşıyıcı menteşeyle birlikte. [Blum katlanır köşe planlaması](https://publications.blum.com/2024/catalogue/id/116/) | 18 mm levha, kalınlık aralığına girer. 25 mm kanat girmez. İki yaprak bağlantısı, ek yarık, ağırlık ve delik konumları ayrı tasarım gerektirir. 60° katalog değeri ile simülasyondaki 60° duruş aynı mekanizma değildir. |
| Hettich TopLine XL 9275786 | 3 kapı, **2 ray**; 18–30 mm, 750–1350 mm genişlik, kapı başına 60 kg üst sınır. [Hettich teknik detayları](https://shop.hettich.com/fr_EN/Sliding-door-systems/Sliding-door-systems-for-overlay-door-position/TopLine-XL-sliding-door-system/TopLine-XL%2C-Set-of-running-and-guide-components%2C-STB-19%2C-17-mm%2C-18---30-mm%2C-60-kg%2C-3-door/p/9275786) | Kör köşedeki kanatlar genişlik ve kalınlığa sığsa bile iki ray, üç bağımsız raylı park düzenini sağlayamaz. 80 kg'lık 9275785 de iki ray ve 22–30 mm; 18 mm için doğrudan karşılık değildir. [Hettich 9275785](https://shop.hettich.com/gb_EN/Sliding-door-systems/Sliding-door-systems-for-overlay-door-position/TopLine-XL-sliding-door-system/TopLine-XL%2C-Set-of-running-and-guide-components%2C-STB-19%2C-17-mm%2C-22---30-mm%2C-80-kg%2C-3-door/p/9275785) |
| raumplus Facet; alttan taşıyan ve üstten asılan sistemler | Facet teknik föyünde tek/çift hat; alttan taşıyan ve üstten asılan sistemlerde yük yolu farklı. [Facet föyü](https://www.raumplus.com/fileadmin/user_upload/Datenblaetter/Datenblatt_Facet.pdf) · [Üretici sistem karşılaştırması](https://www.raumplus.com/fileadmin/user_upload/Datenblaetter/Datenblatt_Bodengefuehrt_Deckengefuehrt.pdf) | Üç ayrı rayı birleştirmenin onayı sayılmaz. Kesit, toplam ray derinliği, stoper, bindirme ve kızak yolu için bir üreticinin uyumlu parça listesi bulunmalı. |
| Blum MOVENTO tam açılım kızak ailesi | Yük sınıfı ve montaj boyu ürün seçimine bağlıdır. [Blum MOVENTO ürün aralığı](https://www.blum.com/gb/en/products/runnersystems/movento/programme/index.html) | Modeldeki 451/454 mm izinli strok, satın alınan rayın boyu veya garanti ettiği strok değildir. Kasa boyu, yan pay, yük sınıfı, alt sürgü rayının yüksekliği ve montaj düzlemi ile birlikte kontrol edilir. |

Bir sonraki teknik adım: önce 003 için üç bağımsız rayın üretici kesiti ve stoper yerleri, ardından 002 için 25 mm kanadın gerçek pivot ve bağlantı zarfı, son olarak 001 için 1535 mm B1 kanadının yük ve montaj uygunluğu. Menteşe/kızak üreticisi çizimleriyle toleranslı çakışma analizi, 1:1 numune, yük altında çoklu açma/kapatma ve raf/askı erişimi gerekiyor. Bu kapılar geçilince tasarım alternatifleri yeni bir kullanıcı kararı olarak değerlendirilebilir.

Kanonik kör örneğin indirilen [tanısal paftasının kapak görüntüsü](artifacts/autonomous-ux-hardening/blind-diag-render-01.png) 49/451 mm engeli ve üretim dışı damgayı gösterir. CSV/ZIP kısıtları üç orijinal P0 örneği için aynen korunur.
