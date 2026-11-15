# Kanonik geometri ve üretim dosyalarının önce/sonra karşılaştırması

Üretim tabanı `c57a4b2` ile aday kodu `0fdc036` aynı Node sürümünde ve aynı dört Design v1 girdisiyle çözüldü. Paket adı `QA`, tarih `2026-11-04T12:00:00.000Z`. SHA-256 hesabında mevcut `designSignature` yöntemi kullanıldı. Üretim tabanının imzaları mühendislik değişmezlerinde korunur. [Üretim tabanı](ENGINEERING_INVARIANTS.md#parmak-izi-karşılaştırması) · [Aday test imzaları](tests/fixtures/d3-panel-centering-fingerprints.json) · [Makinece okunabilir sonuç](../evidence/canonical-before-after.json)

| Model | Fiziksel parça | Yapısal kesişim önce → sonra | Merkezi değişen panel | Değişen PDF ve SVG pafta |
| --- | ---: | --- | ---: | --- |
| Düz | 69 | 0 → 0 | 5 | 3/25 |
| Beşgen 18/8 | 94 | 0 → 0 | 9 | 5/41 |
| Kör köşe | 81 | 0 → 0 | 4 | 4/35 |
| Asimetrik 25/4 | 94 | 20 → 0 | 12 | 12/41 |

Toplam 338 fiziksel parça. Dört modelde Design JSON baytları, sıralı kimlikler, kutu boyları, kesim ebatları, poligon köşeleri/açıları, parça kodları, malzeme ve yüzey toplamları eşit. `ResolvedModel` içinde yalnız ilgili panellerin `worldPositionMm` değeri değişti. `ProductionPackage` içinde aynı parçaların `worldCenterMm` değeri değişti. Kapak, çekmece, raf açıklığı, askı erişimi, uyarılar ve çözülen işlevsel erişim alanları alan bazında eşit. [Önceki nesneler](../evidence/before/canonical.json) · [Aday nesneleri](../evidence/after/canonical.json)

## Koordinat farkları

| Model | Paneller | Dünya X/Y/Z farkı mm | Neden |
| --- | --- | --- | --- |
| Düz | A rafları 1–5 | 0 / 0 / −0,5 | Tek derinlikli A rafının arka yüzü gövde arka düzlemine oturur. |
| Beşgen 18/8 | A rafları 1–5, B rafları 1–4 | A 0 / 0 / −0,5. B −0,5 / 0 / 0. | Aynı derinlik yarısı iki kol eksenine eşlenir. |
| Kör köşe | B rafları 1–4 | −0,5 / 0 / 0 | B kolu derinlik merkezi dünya X’tir. |
| Asimetrik 25/4 | `junc-custom-side-A/B` | A +0,5 / 0 / 0. B 0 / 0 / +0,5. | Dikmenin iç yüzü köşe poligonunun bitiş düzlemine taşınır. |
| Asimetrik 25/4 | `A-root-hdiv-1` | −0,5 / 0 / 0 | Yatay bölücünün tek genişliği kendi açıklığına oturur. |
| Asimetrik 25/4 | A rafları 1–5, B rafları 1–4 | −0,5 / 0 / −0,5 | Aynı rafta hem genişlik hem derinlik yarımı önce yuvarlanıyordu. |

Önceki kopya deneyinde 12 panel yalnız kesişmeye neden olan eksende taşınmış ve 10 pafta etkilenmişti. Gerçek aday aynı 12 panelin dokuzunda derinlik yerleşimini de düzeltti. 25/4 örneğinde bu ek eksen düzeltmesi, `05-KESIT-A` ve `05-KESIT-B` paftalarını değiştirdi. Diğer kanonik modellerde de değişiklikler yalnız tek derinlikli rafların arka yüzüyle açıklanır. Dünya koordinatları ve birleşimlerin ölçüleri model ve çift bazında saklandı. [Yüzey yakınlaştırması](../evidence/visual/nominal-joints-closeups.png)

## SHA-256 değerleri

| Model | Nesne | Üretim tabanı | Yerel aday |
| --- | --- | --- | --- |
| Düz | Design | `e1c33d152db9328e304c4d030d049fda84582aaac567eadb56cea7656e6491b0` | Aynı |
| Düz | ResolvedModel | `7fcca6a76561727d3e69441720f74938cd38d4e20f5f8d5e71553bcac68c73a8` | `3ad8406d135e56a7fa69bb3723e91311eac15a940af8245f4f0ee23e80cd8518` |
| Düz | ProductionPackage | `192d047b1db2f452d13f16be89e3b24441efe547400bbfb728f00ceb052030d4` | `3abf32fc5412f844c160410aaccfece4bb7f9709f2024faf6313fbd9956d5f18` |
| Beşgen 18/8 | Design | `a4168587a1e2535b5ac374e443979ac449543d2d11d117f562a79f390a8e9a7e` | Aynı |
| Beşgen 18/8 | ResolvedModel | `d7fc97c501b6dd68c7159dda9443fa7b53cf56a77413820f08ab7c8a9b048101` | `0989f474a4e0c645760bddce2444adcfcf47ae728f2896f5ae38f7ea227fd260` |
| Beşgen 18/8 | ProductionPackage | `5c200b4f4c35b882894fe5ccd7ce797b63d216669ee9063b9150b7011e77028f` | `0064548c147a93d8c8444d816d9c71e8a041bac5693b3661430a4e1127d33392` |
| Kör köşe | Design | `a313f6b547d93dfe50889a7edf6b60270d54a9b43b1eab99a4514a2051de00b2` | Aynı |
| Kör köşe | ResolvedModel | `0877f5fcf310556cf921fbabf67384a719c03a26140bc9bd8c9cf1e02d15cc30` | `095afe19236b5444dcc6932cdb6c17360508a3ea3602f3674a2d61d87bf0aeb0` |
| Kör köşe | ProductionPackage | `737c193abff836e4118de2b51900cbc946575fb5257e5e99a23bd338934f498b` | `0d90050032153569c03819e416746210543689ecb67d806abb756c036541f2e1` |
| Asimetrik 25/4 | Design | `b54123c5b527fc79d492525621734f5287f67deabda964736aeb92284637f854` | Aynı |
| Asimetrik 25/4 | ResolvedModel | `fdbd3ee9fed83028ad534440786bf6d803afc2d0b85e967059f74e4a0a0b70b4` | `65f964b117ba69d454595131f49b8cf4f517c760813549e32aa4ecc9416d345c` |
| Asimetrik 25/4 | ProductionPackage | `75dc34e92ed9427cb158483a96b6c6906adf30d3e374dba7a5b7e27b6a3af4c8` | `cb1c61c776967d57a154ec801c09f27886c3c252df3c8fa837a6978b1492b4f7` |

Dört Design imzası eşit, sekiz türetilmiş imza farklı. Bu tablo aday kanıtıdır. Üretimdeki tarihsel referans tablosu ayrı kalır.

## PDF, SVG, CSV ve ZIP

PDF sayfa karşılaştırması sıkıştırması çözülmüş çizim komutları üzerinden yapıldı. Her değişen PDF sayfası aynı kimlikli değişen SVG ile eşleşti. Üç P0 için iki sürümdeki bütün 117 sayfada tanısal damga doğrulandı. Değişen paftalar aşağıdadır.

- **Düz** (3/25) `02-GENEL`, `05-KESIT-A`, `04-PLAN`.
- **Beşgen 18/8** (5/41) `02-GENEL`, `05-KESIT-A`, `05-KESIT-B`, `04-PLAN`, `14-MONTAJ-bay-B1`.
- **Kör köşe** (4/35) `02-GENEL`, `05-KESIT-B`, `04-PLAN`, `14-MONTAJ-bay-B1`.
- **Asimetrik 25/4** (12/41) `02-GENEL`, `03-CEPHE-A`, `05-KESIT-A`, `03-CEPHE-B`, `05-KESIT-B`, `04-PLAN`, `06-MOD-bay-A1`, `06-MOD-bay-A2`, `06-MOD-bay-B1`, `14-MONTAJ-bay-A1`, `14-MONTAJ-bay-B1`, `14-MONTAJ-junc-custom`.

CSV baytları dört modelin tamamında eşit. Düz modelin gerçek tarayıcı ZIP’inde 29 giriş, 25 SVG ve 69 satırlık ayrı dosyayla eşit CSV doğrulandı. Paket karşılaştırmasında her modelde yalnız yukarıda listelenen SVG’ler ve `uretim-modeli.json` değişti. Üç P0’ın tam ZIP ve CSV kullanıcı indirmeleri kilitli kaldı. Bu üç ZIP için yalnız iç QA yazıcısının bellek içi girdileri karşılaştırıldı.

Adayda arşivlenmiş eski 25/4 tasarımın teknik önizlemesi ve gerçek tanısal PDF, SVG, yazdırılabilir HTML indirmesi doğrulandı. A ve B yan kesitleri, A2 modül ayrıntısı ve köşe montajı uygulamada görüntülendi. Poppler ile aynı A3 PDF paftaları karşılaştırıldı. Basılı ölçekte 0,5 mm bazı raster sayfalara tam piksel olarak yansımıyor. Yakınlaştırma sayısal panel sınırlarından türetildi. [Paftaların görsel karşılaştırması](../evidence/visual/pdf-sheet-comparison.jpg) · [Eşlenmiş 3D/2D/üst plan](../evidence/visual/same-camera-views.jpg) · [Tarayıcı indirme kontrolleri](../evidence/browser/download-verification.json)
