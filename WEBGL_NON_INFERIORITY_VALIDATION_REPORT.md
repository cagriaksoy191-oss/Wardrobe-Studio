# ContactShadows · performans gerilememe doğrulaması

16 Kasım 2026. Üretim `27361cbed6e4052b2712e7fd7f3559177a5bf156`, aday ürün ağacı `fafec9472a7341a741e82e040654b4f7baa41efd`. Aday uygulama kodu ölçüm sırasında değişmedi. Deney protokolü ilk kabul penceresinden önce `4fbe85b` ile kaydedildi. Eski 5 çiftlik veri yeni kabul hesabına dahil edilmedi. [Dondurulan protokol](WEBGL_NON_INFERIORITY_PROTOCOL.md)

## Sonuçlar

`NON_INFERIORITY` **6/6** zorunlu sahne ve **30/30** tamamlayıcı ölçüt. `TWO_SIDED_EQUIVALENCE` **6/6** birincil ve **30/30** tamamlayıcı ölçüt. Önceden tanımlanan Holm düzeltilmiş, iki blokta tekrar şartlı gerileme ölçütünü karşılayan sonuç yok.

| GPU ve sahne | Çift | Üretim → aday p95 medyanı | Ortalama eşli kare p95 farkı | %90 çift taraflı aralık | %95 tek taraflı üst sınır |
| --- | ---: | ---: | ---: | ---: | ---: |
| Radeon 610M kapalı | 14 | 16,50 → 15,60 ms | +0,08 ms | −0,69…+0,85 ms | +0,85 ms |
| Radeon 610M ağır açık | 16 | 17,25 → 17,70 ms | +0,44 ms | −0,10…+0,99 ms | +0,99 ms |
| Radeon 610M LED | 24 | 21,30 → 20,85 ms | −0,23 ms | −0,92…+0,46 ms | +0,46 ms |
| RTX 5070 Ti kapalı | 12 | 10,25 → 10,80 ms | +0,32 ms | −0,62…+1,25 ms | +1,25 ms |
| RTX 5070 Ti ağır açık | 12 | 10,85 → 10,95 ms | +0,12 ms | −0,16…+0,39 ms | +0,39 ms |
| RTX 5070 Ti LED | 24 | 14,45 → 14,00 ms | −0,25 ms | −1,02…+0,51 ms | +0,51 ms |

Karar eşli farkların ortalaması üzerinden verildi. İki kolun p95 medyanları ve bunların farkı tanısal değerlerdir. Birincil kötüleşme sınırı bütün sahnelerde +2,0 ms. Tablodaki tek taraflı üst sınırların tamamı +2,0 ms'den küçük. Çift taraflı eşdeğerlik için aynı aralığın iki ucu da ±2,0 ms içinde.

## Tamamlayıcı sınırlar

| GPU ve sahne | CPU p95 üst (ms) | GPU p95 üst (ms) | >33,3 ms üst (yp) | Sunuma giriş üst (ms) | Düzenlemeye dönüş üst (ms) |
| --- | ---: | ---: | ---: | ---: | ---: |
| Radeon 610M kapalı | +0,75 | +1,07 | +0,04 | +1,76 | +19,72 |
| Radeon 610M ağır açık | +1,02 | +0,88 | +0,23 | +0,49 | +12,90 |
| Radeon 610M LED | +0,48 | +0,25 | +0,20 | +4,18 | +1,34 |
| RTX 5070 Ti kapalı | +1,30 | +1,05 | +0,02 | +2,13 | +1,11 |
| RTX 5070 Ti ağır açık | +0,35 | +0,46 | 0,00 | +1,51 | +1,42 |
| RTX 5070 Ti LED | +0,49 | +0,50 | +0,02 | +1,12 | +0,87 |

Radeon kapalı sahnede Düzenlemeye dönüş +20 ms sınırına en yakın ölçüt. Eşli ortalama +4,31 ms, üst sınır +19,72 ms. İki kolda da 60 ms üstünde tekil dönüşler oldu. En uzun ölçülen üretim/aday dönüşü 127,4/179,2 ms. Bunlar saklandı. Uzun kare toplamları Radeon üretim/aday için >33,3 ms **59/60**, >50 ms **11/11**, >100 ms **2/3**. RTX için **4/3**, **2/2**, **1/0**. Ham oranlar ve p50/p90/p95/p97,5/p99 değerleri `timing-windows.csv` içinde.

## Veri bütünlüğü ve kapsam

**204/204** ana pencere, **102/102** eş. Eleme, disjoint veya tamamlanmayan GPU sorgusu yok. Gerçek pencere 8.300,1–8.331,5 ms, pencere başına 397–1.176 kare aralığı ve 133–393 GPU sorgusu. Toplam 152.343 CPU ve 50.849 GPU örneği. Her eş aynı renderer, kamera, hareketli parça pozları, görünür ışık envanteri ve canvas ile doğrulandı. Başsız 1.578×839 viewport, sahneye göre 915×695 veya 915×748 canvas, DPR 1. Ana/derinlik/blur çağrıları kapalıda 968/967/4, ağır açıkta 1094/1093/4, LED'de 1126/1125/4. Aynı sahnedeki tüm çiftlerde sayı aynı.

Kare p95, tamamlanmış çizimler arası nearest-rank ölçüm. Eski seri R3F `delta` kullanıyordu. Karşılaştırmalar her çalışmanın kendi protokolü içinde yorumlanır. Destekleyici CPU değeri sürücü gönderim beklemesini içerebilir. GPU değeri WebGL sorgusu, CPU süresi ile tahmin edilmedi. Döngü tutarlılığı için sahne/blok/sıra analizi, tek çifti dışarıda bırakan duyarlılık hesabı ve ikili hareketli-blok bootstrap ayrıca saklandı. Bu analizler önceden dondurulan kabul hesabını değiştirmedi. [AMD LED araştırması](WEBGL_AMD_LED_VARIANCE_INVESTIGATION.md) · [Normal pencere karşılaştırması](WEBGL_HEADLESS_VS_HEADED_COMPARISON.md) · [WebGL zamanlayıcı belirtimi](https://registry.khronos.org/webgl/extensions/EXT_disjoint_timer_query_webgl2/)
