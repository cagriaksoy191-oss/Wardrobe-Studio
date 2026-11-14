# D3 donanım ön eşleştirmesi ve belirsizlikler

**14 Kasım 2026 · DENEYSEL CAD — ÜRETİM ONAYI YOK**

Bu çalışma önceki geniş donanım araştırmasını tekrarlamaz. Yalnız H1 WingLine L ve H5 Blum155° kaynakları yeniden kontrol edildi. Hiçbir D3 varyantı `HARDWARE_DOCUMENTATION_MATCHED` veya fiziksel üretim PASS değildir.

## H5: bağımsız menteşeli kanatlar

Somut aday **Blum CLIP top BLUMOTION155°,71B7550**, vidalı tam bindirme. **71B7650** yarım bindirme alternatifidir; aynı plaka/örtme hesabıyla değiştirilemez. [Üretici katalog sayfası78](https://publications.blum.com/2026/catalogue/en/78/)155° ve yalnız belirtilen tam bindirme uygulamasındaki0-protrusion özelliğini gösterir. Kaynağın URL'sinde2026 bulunmasına rağmen, kontrol sırasında görünen baskı başlığı2027/2028'dir; doküman sürümü URL'den varsayılmadı.

[Planlama sayfası79](https://publications.blum.com/2026/catalogue/en/79/), TB/FD/plaka/örtme ve minimum derz çizelgeleri içerir.25mm kalınlık otomatik ret değildir; doğru TB/plaka/derz ve duvar uygulaması seçilmelidir. Üretici duvar yanında deneme uygulaması önerir. Ayar aralıkları kesim, gövde gönye veya toplam montaj toleransı değildir. [Adet/yük referans grafiği](https://publications.blum.com/2026/catalogue/en/734/)600mm referans yaprakla ilişkilidir; buradan her D3 kapak için kesin adet çıkarılmadı.

| 70 mm model | Yaprak W mm | Uzun / kısa H mm | T mm | Yalnız panel kütlesi kg aralığı |
|---|---:|---:|---:|---:|
| 001 | 381–475 | 2276 /1622 | 18 | 7,230–15,568 |
| 002 | 312–399 | 2276 /1608 | 25 | 10,426–18,162 |

Kütle aralığı her gerçek yaprağın650–800kg/m³ **varsayımsal** yoğunluğuyla hesaplanır; ölçülmüş malzeme değildir. Gerçek kulp/menteşe ek kütlesi UNKNOWN.1kg ek donanım yalnız hassasiyet payıdır; H5 için doğrulanmış taşıma sınırı bilinmediğinden bu hesap yük PASS üretmez. Her yaprağın ayrı kg aralığı JSON `doors`/`hardware` içindedir.

Araçta155° yalnız nominal açıdır. Sabit dış pivot, gerçek Blum çok bağlantılı menteşe CAD'i değildir. D3'ün19/23 raf paneli ve alt dış çekmece düzeni için çanak, plaka, vida ve montaj kuvvet yolu henüz modellenmedi. Özellikle25mm gövdeye doğru delik/örtme seçimi ve kısa/uzun kapakta menteşe adedi UNKNOWN. Kulp katısı mevcut görsel zarfı içerir; gerçek kulp ürün ölçüsü doğrulanmış değildir.

**H5 sonucu:** ölçü/kütle ön bilgisi mevcut; gerçek donanım yükü, montajı ve yörüngesi `HARDWARE_KINEMATICS_UNVERIFIED`. İdeal hareket testleri bunu değiştirmez.

## H1: WingLine L kapalı geometri ön elemesi

Somut sol set **9237880**, sağ karşılık **9237881**,25kg/kanat sınıfı, kendiliğinden kapama özelliği olmayan sürüm. [Güncel üretici ürün sayfası](https://shop.hettich.com/us_EN/Folding-door-systems/WingLine-L-folding-door-system/1-Running-and-guide-components/Sets-of-standard-fittings/WingLine-L-set-of-fittings-for-max-door-wing-weight-of-25-kg-without-self-closing-feature%2C-600-mm%2C-left/p/9237880) setin iki kanatlık katlanır/sürülür kapı için olduğunu, Pull/Push to move ile birlikte kullanıldığını, profilsiz ve yaylı kapanmayan gövde menteşesi gerektirdiğini belirtir. Sensys8675 önerisi, rastgele başka yaylı menteşeye izin değildir. [Üretici imos ürün eşleme belgesi](https://www1.hettich.com/downloads/imos/Informationsblatt_Hettich_Schiebe_und_Faltt%C3%BCrsysteme_20012025_V1.pdf) sol/sağ kodları ayrıca doğrular.

[WingLine L üretici föyü](https://www.hettich.com/fileadmin/Media_Center/Catalogue/Hettich_Product_Leaflet_WingLine_L_2023.pdf) ve [MTA9 236 82203 montaj kılavuzu](https://web2.hettich.com/hbh/addon/montage/MTA_923682203_WingLine_L_25kg.pdf), kanat genişliği250–600mm, kalınlık16–25mm ve25kg sınıfının değerlendirme temelidir. Föyde500–2400mm, montaj çiziminde1000–2400mm yükseklik aralığı görülür; düşük uç uyumsuzluğu korunur. D3'ün1608mm ve üzerindeki yaprakları iki belgenin ortak aralığındadır. Bu, bütün montajın doğrulandığı anlamına gelmez.

70mm statik D3 yaprakları001'de381–475mm,002'de312–399mm olduğundan genişlik/kalınlık/ortak yükseklik ön elemesi geçer.650–800 yoğunluk +**varsayımsal1kg** payda en ağır kanat yaklaşık16,568/19,162kg;25kg'nın altındadır. Gerçek yoğunluk ve donanım tartılmadan yük onayı verilmez. Uzun2276mm kanat için montaj çizelgesindeki2400mm sınıfı **beş gövde menteşesi adayı** olarak kaydedilir; kısa kanatların adedi ve tam bağlantı seti UNVERIFIED. Merkez katlama menteşesi sayısı, gövde menteşesi sayısıyla karıştırılmamalıdır.

H1 için eksik kalanlar: kesin gövde menteşesi/orta menteşe varyantı, üst taşıyıcı ve kılavuz profiller/uzunlukları, Pull/Push aktivasyon sürümü, sabitleyiciler, gerçek dolap içi profil kesiti, katlanmış paketin kutu/komşu kapak/kulp/oda zarfı ve kapama sırası. H1 JSON'undan ideal pivot/açılma metadatası çıkarıldı; yalnız kapalı yaprak katıları kalır. H1 net hacim tablosu **profiller yerleştirilmeden önceki gövde referansıdır**; donanımlı net depolama UNKNOWN.

Montaj kılavuzunun daha önce indirilen3–4.sayfa görselleri yeniden incelendi (bu görevde doğrudan PDF web isteği erişilemedi; güncel ürün sayfası aynı montaj bağlantısını veriyor). Sayfa4'te Sensys8645i/8675 için nominal110°/etkin100° ve **F** mesafesi tek bindirmede18/19mm için61mm,25mm için67mm; çift bindirmede71/77mm'dir. Bu F'nin referans düzlemi D3'ün analitik dolgusuyla eşleştirilmeden70mm dolguya otomatik PASS verilmez. Aynı referans/montaj seçilirse70mm'nin61/67 karşısında yalnız9/3mm nominal farkı vardır; çift bindirmede71/77'yi karşılamaz.40mm de bu F koşullarını karşılayan H1 duvar uygulaması olarak kabul edilemez. Bunlar doğrulanmış toplam tolerans bütçesi değildir; H5'in dolgu senaryosuna taşınmaz.

**H1 sonucu:** boyutsal ve varsayımsal yük ön elemesi; hareket, raf/askı erişimi, strok ve oda açılımı NOT_MODELED/UNKNOWN. İki bağımsız H5 pivotunu birlikte döndürüp WingLine L doğrulandı denmedi.25mm yaprak için23mm ile sınırlı eski katlama menteşeleri bu çözümde kullanılmadı.

## Tolerans ve üretim kapıları

- 40/70/100mm yalnız analitik köşe dolgularıdır; üretici minimum montaj boşluğu veya tehlikesiz parmak payı değildir.
- Modeldeki derzler2–3mm seviyesinde nominaldir. Gerçek panel kalınlığı, bant, gönye, kapak eğriliği, delik konumu, duvar sapması ve sıcaklık/nem birikimi ölçülmedi; doğrulanmış tolerans bütçesi UNKNOWN.
- Gerçek menteşe ekseni, vida tutunması, yüklü sehim, taşıma yolu, montaj toleransı, delik şablonu, kesin sipariş seti ve çevrim ömrü **UNVERIFIED**.
- 485/489mm çekmece hareketi D3 modelinin sürekli çarpışma sonucudur; seçilmiş bir rayın katalog stroku değildir. Gerçek ray ürünü, net derinlik ve yük/bağlantı seçimi eksik.
- Oda engelleri yok varsayımıyla boşluk incelendi. Gerçek yatak, oda kapısı, süpürgelik, priz ve kullanıcı hareketi yokken oda PASS verilmez.

H5 ve H1 aynı modülde keyfî karıştırılmadı. H5 fiziksel modül provası için daha fazla yazılım hareket kanıtına sahiptir; bu **daha iyi/üretime hazır sistem** kararı değildir. H1 alternatif araştırması ancak tam CAD/BOM ve profil yerleşiminden sonra ilerleyebilir. Kullanıcı kapasite kaybını kabul etmedi; hiçbir sipariş/kesim onayı verilmedi.
