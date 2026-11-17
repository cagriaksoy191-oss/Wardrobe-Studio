# Radeon 610M LED · nihai yayın kararı

**17 Kasım 2026 · `RESEARCHED_NOT_READY`.** Önceki deneyden kalan tek yayın koşulu normal Brave penceresinde Radeon 610M LED kare p95’iydi. Önceden dondurulan `81696c6` protokolünde 16 geçerli yeni çift, +2,0 ms kötüleşme sınırı ve tek taraflı %95 güven düzeyi kullanıldı. Dört izole profilde 32 pencerenin tamamı ölçüldü. Başka GPU, sahne veya kaynak ömrü deneyi açılmadı. [Dondurulan protokol](WEBGL_FINAL_LED_PROTOCOL.md)

## Önceki ve yeni seri

| Normal Brave Radeon LED serisi | Çift | Aday eksi üretim ortalama kare p95 farkı | Tek taraflı %95 üst sınır |
| --- | ---: | ---: | ---: |
| 16 Kasım bağımsız doğrulama | 6 geçerli | +0,450 ms | +2,034 ms |
| 17 Kasım nihai doğrulama | 16 çalıştırıldı, 14 geçerli | −0,693 ms, betimleyici | Protokol 16 geçerli çift gerektiriyordu |

Yeni geçerli çiftlerin kare p95 farkı standart sapması 1,609 ms. Pencere p95 medyanları üretim ve adayda sırasıyla 21,05 ve 19,75 ms. Aynı çiftlerde ortalama CPU p95 farkı −0,643 ms ve GPU p95 farkı −0,587 ms. Bu değerler betimleyici. Planlanan %95 üst sınır kararı, 16 geçerli çift koşulu sağlanmadığından hesaplanmadı. Belirgin regresyon kararı için de geçerli bir kabul örneklemi oluşmadı.

## Teknik eleme ve istatistik sınırı

15. çiftte üretim penceresi, 16. çiftte iki pencere de başlangıçta tarayıcı odağına sahip değildi. Bu üç pencere görünür kaydedildi. Odak koşulu ölçüm öncesinde yazılı olarak sabitlendiği için her iki çift bütünüyle elendi. Ham zaman serileri ve `evidence/block-3/invalid-pairs.json` saklandı. Dört blokta Radeon 610M ANGLE D3D11, Brave `157.1.99.57`, Radeon sürücüsü `32.0.13034.7001`, 1584×892 viewport, 918×801 canvas, DPR 1, referans kamera ve LED sahnesi korundu. Tüm pencerelerde sıfır disjoint. Her blok başında AC bağlantısı ve Windows güç şeması doğrulandı. Geçerli çiftlerin sırası 7 AB ve 7 BA.

Önceki altı çift yeni sonuca katılmadı. Nihai seri önceki sınırda sonuçtan sonra seçildiği için tekrarların toplam yanlış kabul oranı tek testin nominal %5’iyle ifade edilemez. Aynı makine, sürücü ve blok içi yakınlık da çiftlerin tam bağımsızlığını garanti etmez. Eksik örneklemde planlanan %97,5 duyarlılık sınırı uygulanmadı. Örneklem ve +2,0 ms sınırı sabit kaldı, ek pencere çalıştırılmadı. Kalan belirsizlik normal Radeon LED kare p95 yayına kabul koşuludur. Bu araştırma burada sona erdi.

Önceden kabul edilen kaynak ömrü, görsel sonuçlar, diğer GPU ve sahne ölçümleri geçerliliğini koruyor. Adayın ContactShadows kodu ve ürün ağacı `fafec94` ile birebir aynı. Fiziksel geometriler, çarpışma güvenliği ve üç üretim kilidi aynı ürün ağacında. Sentetik fikstürler ayrı tarayıcı profillerinde çalıştırıldı. `main` `27361cbed6e4052b2712e7fd7f3559177a5bf156` olarak yeniden okundu ve canlı ana sayfanın SHA-256 değeri önceki üretim kanıtıyla eşleşti. Yayın adayı yerelde bekliyor ve üretim için açık onay gerekiyor.

Ham teslim `artifacts/webgl-final-led/WARDROBE_STUDIO_FINAL_RADEON_LED_EVIDENCE.zip` içinde. Arşiv 32 pencereyi, çift verilerini, teknik eleme kayıtlarını, telemetriyi, protokol ve girdi hash’lerini içerir. [Önceki yayın kararı](WEBGL_FINAL_RELEASE_READINESS.md)
