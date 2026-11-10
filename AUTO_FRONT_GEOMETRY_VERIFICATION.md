# Wardrobe Studio · Otomatik kapak geometrisi

6 Kasım 2026 · `C:\dev\Wardrobe-Studio`

## Başlangıç ölçümü ve teşhis

Kaynak değiştirilmeden önce 186 test ve üretim derlemesi geçti. Kaynak, test, betik, belge ve başlangıç derlemesi ayrı ZIP'e alındı. SHA-256 değeri `6750FC1A96255735A3A431690F5B48B81287B4ACAA866359EF12341C62CBB2B0`. [Kaynak yedeği](artifacts/final-professional-polish/source-before-20261106-151939-d4d2aa.zip)

| Olasılık | İnceleme sonucu |
| --- | --- |
| Düz komşuda kanat eni veya derz hatası | Başlangıçta kapalı 18 mm iki komşu kanat arasında 4 mm toplam yan boşluk vardı. Eni aynı kalan bir kanatta eski arka eksene göre öne taşan kesit 19 mm idi. `asin(4 / 19) ≈ 12,15°` ölçülen 12,14–12,15° erken durmayı açıklar. |
| Kalınlık ve eksen | Eski eksen gövde ön düzleminde, kanat kesiti bu düzlemin önündeydi. Dönüşte dış köşe yana süpürüyordu. Aynı modelde uç klapası veya üst tabla yaklaşık 90°'de ayrı bir temas üretiyordu. Düz kanatta eksen dış yüz kenarına taşındı. |
| Paylaşımlı dikme ve montaj istisnası | Eski hareket sahnesi bazı montaj dikmelerini dışlıyordu. Yeni düz eksen kendi dikmesi dahil tam katı geometriyle sınandı. Geçerli kapalı bağlantılar, başlangıç kontağı ile hacim kesişimini ayıran mevcut dar toleransla ele alınıyor. |
| Köşe ve menteşe eli | Beşgen kanat, komşu B1 kanadıyla gerçekten kesişebiliyor. Geometri ve montaj desteği el değişimi için ayrı ayrı sınanıyor. Katalog verisi bulunmadığında açılı köşede muhafazakâr arka kenar ekseni kullanılıyor. |
| Kulp ve açık komşu | Kulp hacmi kanatla aynı dönüşü kullanır. Kapalı komşularla 110° alan düz kanat, komşu kanat açık tutulunca temasta durdu. Sürgü testinde gömme kulp geçti, çıkıntılı bar kulp gerçek temasta durdu. |
| Sayısal tolerans ve hızlı hareket | `0,05 mm` temas öncesi hareket payı korundu. İnce engel, rayda hızlı hareket, açık çekmece ve arada kalan açısal temas testleri fiziksel engelleri yakaladı. |

[Başlangıç hareket ölçümleri](artifacts/final-professional-polish/baseline-motion.json) · [Yeni hareket ölçümleri](artifacts/final-professional-polish/updated-motion.json) · [Hareket testleri](tests/phase5-motion.test.ts)

## Çözücü davranışı

- `Design` kapsamı, cephe türünü, el/kanat tercihini, kot niyetini, malzemeyi ve kulpu saklar. Düz, beşgen, içerlek ve sürgülü kesimler `ResolvedModel` üzerinden çizime, hareket sahnesine ve üretime gider. Kesim ve kullanıcı kotları tamsayı mm, merkezler yarım mm, eğik dönüşün dünya izdüşümü kayan nokta hassasiyetindedir.
- Dış ve paylaşımlı bindirme gerçek sınır panelinden çözülür. İçerlek montaj tek net açıklığı kullanır ve yalnızca gelişmiş ayarlarda sunulur. Düz bindirmede kapalı kanadın arka yüzü gövde önünden 1 mm öndedir. Ekseni dış yüz kenarında, Y merkezi gerçek kanat ortasındadır. Beşgen ekseni eğik kenarın arka yüzündedir. Kapalı merkez, dönüş işareti ve kulp aynı eksen dönüşümünü kullanır.
- Nominal yan pay, 18 mm standartta 2 mm'den başlar. Kalınlık artışı, 165° ve içerlek seçenekleri payı artırır. Merkez derzi nominal payla büyür. Beşgen kanat eğik açıklığa sığan tamsayı enden kesilir ve artık mesafe derz olarak kaydedilir. Üst/alt ayrımında 4 mm derz korunur. Bunlar planlama değerleridir ve kenar işlemiyle birlikte katalogdan kontrol edilmelidir.
- Otomatik düzen tek kanadı nominal 600 mm genişlik ve 22 kg levha eşiğiyle değerlendirir. Ölçüye sığan çift kanat gerekiyorsa iki tamsayı kesim oluşturur. Ağırlık, 750 kg/m³ levha varsayımıyla kulp hariç hesaplanır. Cam ve aynanın levha ağırlığı tahmini boş bırakılır. Genişlik uyarısı korunur. Kullanıcının belirlediği sol, sağ ve çift düzen için uyarı veya öneri gösterilir.
- Otomatik tek kanatta karşı el yalnızca destek paneli bulunduğunda, kapalı temas testi temiz olduğunda ve açılma iyileştiğinde seçilir. Elle belirlenen yön ve beşgen köşe tercihi korunur. Çift kanadı hareketi iyileştirmek için otomatik yeniden bölme bu modelde kullanıcı kararına bırakılır.
- Yeni otomatik kapsam, gövde üstü ile alt taban/dış çekmece üstünden türetilir. Üst yüklük gövde üstüne bağlı kalır. Bölme/birleştirme alt aralık kimliğini, üst sınırı ve geçerli yüzey niyetini taşır. Bir bölme silindiğinde onu kapsayan çoklu cephe kalan bölmelerle çözülür. Varsayılan ray açıklıkları kalınlığa uyarlanır. Özel ray ve kanat değerlerinde uygunluk kontrolü çalışır.
- Eski v1 JSON'lar doğrudan açılır. Gövde düzenlemesinde yalnızca eski otomatik gövde üstü/baza sınırıyla tam eşleşen kot, aynı Undo adımında göreli hale gelir. Elle verilmiş diğer kotlar mutlak kalır. Kapak tipi ve kanat sayısı korunduğunda parça kimlikleri de korunur. Tekten çifte geçiş yeni fiziksel parça üretir.

[Gövde ve derz kuralları](src/core/fronts/frontGeometry.ts) · [Cephe düzenlemeleri](src/core/fronts/frontCommands.ts) · [Menteşe planlaması](src/core/solver/hingePlanning.ts) · [Kanonik gövde çözücüsü](src/core/solver/carcassSolver.ts)

## Hedef, tasarım sınırı ve canlı hareket

Tasarım sınırı diğer parçalar kapalıyken aynı kesintisiz hareket denetiminden gelir. Canlı komut, diğer kanatların, rayın, kulpun, çekmecenin ve oda engellerinin o andaki hacmini kullanır. Ekran ve üretim tablosu hedefi, güvenli sınırı ve engeli ayrı yazar.

| Deneme | Önce | Sonra |
| --- | --- | --- |
| Düz örnek, S1 sağ / S2 sol | Yaklaşık 12,15° | Her kanat tek başına kapalı komşularla 110°. 155° ve 165° hedefleri aynı senaryoda ayrı test edildi. |
| Yerleşik 600/480 mm L | A1 sağ / A2 sol yaklaşık 12,15° | Düz kanatlar tek başına 110°. Köşe 58,3°'de B1'e temas eder. Destekli sağ seçenek 61,3° verir. |
| Beşgen 18/8 mm üretim örneği | Köşe 4,9°, B1 iç kanat 3,7° | Köşe 5,1° · B1 iç kanat 103,9° · alt ray. |
| Asimetrik 25/4 mm üretim örneği | Köşe ve B1 iç kanat yaklaşık 2,6° | Köşe 12,8° · B1 iç kanat 103,8° · alt ray. Sağ köşe seçeneği 61,3°. |
| Kör köşe üretim örneği | Üst sol yaklaşık 90° · B1 iç kanat 71,2° | Üst sol 136° · komşu kanat. B1 iç kanat 79° · alt ray. |
| Düz üç ray, açık çekmece | — | Kanat 1, 1964 mm'den sıfıra dönerken 1458 mm'de durdu. Kanat geri kaydırılıp çekmece kapatılınca sıfıra erişti. |

[Canlı köşe teması](artifacts/final-professional-polish/browser/03-corner-opening.jpg) · [Canlı sürgü/çekmece teması](artifacts/final-professional-polish/browser/26-drawer-slider-probe.jpg)

## Regresyonlar ve kapsama

- Brave'de A1 dış eni 920 → 1000 mm olduğunda kesimler 456/457 → 496/497 × 2276 × 18 mm oldu. Undo ve Redo dış eni ve kesimleri geri getirdi. Yeni L'nin otomatik tek/çift düzeni 560 ve 820 mm ile denendi. 18/8 → 25/4 mm sonrasında kanat yeniden çözüldü. Üst/alt ayrım ve el tercihi açılıp kontrol edildi. [Yeniden boyutlama](artifacts/final-professional-polish/browser/04-auto-resize.jpg) · [Kalınlık](artifacts/final-professional-polish/browser/17-thickness-25-4.jpg) · [Üst/alt](artifacts/final-professional-polish/browser/18-split-front.jpg)
- 21 yeni vaka, eski 186 testle birlikte çalıştırıldı. Yeni kapsamda 18/8, 25/4, 18/3, 16/6 ve 36/18 mm, açık ve kapalı komşu, üç hedef açı, manuel/otomatik/çift/içerlek kanat, A/B kolu ve köşe boyutu, baza ve üst dolgu, kapak bölme/birleştirme, bölme ekleme/silme, varsayılan üç ray, eski JSON ve Undo yer alır. Testler kapalı konum, pivot, kulp, parça kodu ve üretim kesimlerini de karşılaştırır. [Yeni regresyonlar](tests/auto-front-geometry.test.ts) · [Önceki geometri regresyonları](tests/remediation-geometry.test.ts)
- Oda engeli, eşzamanlı açılma, ray/kulp ve hızlı sürükleme otomatik hareket testleriyle sınandı. İşaretçinin iptal olayında yakalamayı bırakma ve sürükleme durumunu temizleme kodu korunuyor. Bu olayın gerçek tarayıcıda yeniden üretilmesi açık. [Sürükleme davranışı](src/canvas/wardrobe/SlidingLeafInteraction.tsx)

## Donanım doğrulaması

Model düz kapakta `exterior-axis`, beşgende `diagonal-rear-axis` planlama profili kaydeder. Seçilecek menteşenin çok bağlantılı yörüngesi, kenar radyüsü ve tas mesafesi farklı olabilir. 840/841 × 2276 × 25 mm kanatlar için levha tahmini 35,8/35,9 kg, kör köşedeki 951/952 × 2276 × 18 mm kanatlar için 29,2/29,3 kg'dır. Bunlar açık cephe tercihleri olarak korunur. Üretimde daha dar kanat, farklı bölünme, taşıyıcı kayıt veya uygun sürgü seçeneği değerlendirilebilir. Gerçek ray, menteşe adedi, montaj deliği ve taşıma kapasitesi ürün ve usta onayına bağlıdır. Katlanır özel köşe donanımı da bu kapsamdadır.

Kataloglar kalınlık, kenar açıklığı ve bağlantı tipinin modele göre değiştiğini, menteşe adedinin kanat yüksekliği ve ağırlığıyla birlikte seçildiğini gösterir. [Blum 110° planlama](https://publications.blum.com/2022/catalogue/en/75/) · [Blum 155° planlama](https://publications.blum.com/2022/catalogue/en/83/) · [Blum menteşe adedi](https://publications.blum.com/2026/catalogue/en/734/) · [Hettich Sensys planlama](https://www.hettich.com/fileadmin/Media_Center/Planning/HUS_Sensys_Brochure.pdf)

## Kabul maddeleri

| No | Sonuç ve kanıt |
| --- | --- |
| 1 | Geçti. Canlı 920 → 1000 mm ve otomatik A/B kolu testleri. |
| 2 | Geçti. Baza, gövde üstü, yüklük ve 4 mm ara derz testleri. |
| 3 | Geçti. Normal editörde kesim salt okunur. Kapsam ve özel kotlar gelişmiş ayarlarda. |
| 4 | Geçti. Canlı tek/çift geçişi ve otomatik yük/genişlik değerlendirmesi. |
| 5 | Planlama modeli geçti. Kapalı dönüş matematiği ve donanım ekseninin 3D/üretim eşleşmesi test edildi. Fiziksel ürün profili onaya bağlı. |
| 7 | Geçti. Nominal 110/155/165° ayrı, komşular kapalı güvenli sınır ayrı. |
| 8 | Model kapsamında geçti. Açık komşu, gerçek köşe, kulp ve ray kontağı testleri. |
| 9 | Ölçülen erken durma senaryosu geçti. Düz komşudaki yaklaşık 12,15° sınırı kalktı. |
| 10 | Geçti. Simetrik/asimetrik poligon, değişen köşe kolu, kör köşe ve 600/480 L. |
| 11 | Geçti. İki/üç ray, açık bölme ve hibrit kapsam testleri. |
| 12 | Geçti. Açık çekmece 1458 mm teması ve geri kaydırarak kurtarma. |
| 13 | Geçti. Dört eski Design birebir yeniden çözüldü, yerel JSON doğrulama ve sürümden açma denendi. |
| 14 | Geçti. Canlı Undo/Redo ve yeniden yükleme sonrası checkpoint/kurtarma. Otomatik kayıt regresyonları da geçti. |
| 30 | Geçti. `npm test -- --run` ile 207/207. |
| 31 | Geçti. `npm run build` ile TypeScript ve Vite. Mevcut büyük paket uyarısı görüldü. |
| 32 | Açıkça işaretlendi. Dört paket de ürün ve usta kontrolü gerektiriyor. |
| 33 | Geçti. İzole 5183, başlangıç ZIP'i, ayrı çıktı dizini ve mevcut belgeler. |
