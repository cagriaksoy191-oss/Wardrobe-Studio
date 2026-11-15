# Radeon 610M ve RTX 5070 Ti · Sunum Modu karşılaştırması

16 Kasım 2026. Üretim kaynağı `27361cb`, yerel aday `7f2134a`. Windows, Brave `157.1.99.57` (Headless Chrome `157.0.0.0`), ANGLE Direct3D 11. Radeon 610M sürücüsü `32.0.13034.7001`, NVIDIA GeForce RTX 5070 Ti Laptop GPU sürücüsü `32.0.16.1692`. Oturumda grafik adaptörü LUID ile seçildi ve her pencerede gerçek `WEBGL_debug_renderer_info` renderer dizesi kayda girdi. Viewport 1578×839, çizim tamponu 915×695, DPR 1. Monitör sunum süreleri, GPU saat frekansı ve termal telemetri ölçülmedi.

## Yöntem

- Sentetik büyük L, 14 bölme ve 144 hücre. Çözümlenmiş sahne 311 panel, 28 kapak, 42 çekmece. Açık meşe cephe/gövde malzemesi. Kapalı sahne başlangıç pozunda, ağır açık sahne 70 hareketli öğenin aynı güvenli son pozunda ve eşya görünür, LED sahnesi kapalı pozda ve LED açık. QA yalnız ağır sahnedeki son pozu iki varyantta da sabitler.
- Her eşli koşuda iki paket ayrı localhost origin'lerinden yüklenir. Her turda sıra ters çevrilir ve sahne sırası döndürülür. Düzenlemede 800 ms hazırlık, Sunum'da 12 kare ve 1.800 ms ısınma, ardından 3.300 ms hedef zaman penceresi. Pencerenin gerçek süresi ve örnek sayısı CSV'de. Isınmasız karşılaştırma yürütülmedi.
- CPU süresi ön R3F callback başlangıcından gerçek kompozit kare için `EffectComposer.render` dönüşüne kadardır. CPU değeri sürücü gönderimi sırasında olası beklemeyi içerir. Frame aralığı ardışık R3F karelerinin delta süresidir. Uzun kare `>33,3 ms`. Geçiş süresi mod mutasyonundan seçilen moddaki ilk tamamlanmış kareye kadar ölçülür.
- GPU süresi `EXT_disjoint_timer_query_webgl2` ile her üçüncü karede, derinlik/blur ve ana kompozit çizimi dahil ölçülür. Asenkron sonucu kullanılabilir sorgular alınır, disjoint ile işaretlenen sorgular atılır. 20 kare ve sekiz GPU sorgusunun altındaki pencereler kabul dışı. [Khronos timer query belirtimi](https://registry.khronos.org/webgl/extensions/EXT_disjoint_timer_query_webgl2/)
- Her satır beş pencere p95'inin medyanını kullanır. Karar, her eşli aday eksi taban farkının %90 t güven aralığına dayanır. CPU/kare/GPU p95 eşiği `±max(1 ms, taban medyanının %10'u)`. Açma/kapatma için `±max(20 ms, taban medyanının %10'u)`. Uzun kare artışı üst sınırı 2 yüzde puanı. Dört veya beş eşleşmede aynı yönde eşik aşımı ve alt güven sınırının da eşik üzerinde olması regresyon kanıtı. Eşiğe sığmayan ve bu regresyon koşulunu sağlamayan aralık belirsizdir.

## Sonuçlar

60/60 geçerli pencere, altı senaryoda beşer eş. Radeon'da pencere başına 175–359 CPU ve 59–120 GPU örneği, RTX'te 241–445 CPU ve 81–149 GPU örneği. Her iki GPU'da sıfır disjoint. Bütün eşlerde viewport, DPR, tampon, kamera ve 70 hareketli öğenin poz kayıtları eşleşti. Ana sahne/temas derinliği/blur çağrıları kapalıda 968/967/4, açıkta 1094/1093/4, LED'de 1126/1125/4. Her çiftte aynı çağrı sayıları kaydedildi.

| GPU ve sahne | CPU p95 (ms) | Kare p95 (ms) | GPU p95 (ms) | GPU farkı, %90 GA (ms) | p95 kabulü |
| --- | ---: | ---: | ---: | ---: | --- |
| Radeon kapalı | 15,00 → 17,00 | 15,90 → 17,40 | 12,23 → 13,76 | −0,80 … +4,61 | Belirsiz |
| Radeon ağır açık | 16,10 → 16,20 | 16,20 → 16,60 | 14,35 → 16,59 | −5,14 … +4,56 | Belirsiz |
| Radeon LED | 19,30 → 22,00 | 19,30 → 22,20 | 16,91 → 19,85 | −1,62 … +8,59 | Belirsiz |
| RTX kapalı | 11,20 → 10,40 | 11,40 → 10,60 | 9,83 → 9,02 | −0,96 … +0,47 | PASS |
| RTX ağır açık | 11,90 → 11,40 | 12,10 → 11,50 | 11,09 → 9,95 | −2,03 … +0,73 | Belirsiz |
| RTX LED | 17,30 → 15,30 | 17,60 → 15,50 | 16,05 → 13,90 | −4,43 … +1,87 | Belirsiz |

RTX ağır açık sahnede her üç p95 güven aralığının üst ucu kötüleşme eşiğinin altında kaldı. Alt uçlar da eşdeğerlik aralığının içinde olmalıydı. RTX LED GPU p95 üst ucu +1,87 ms ile +1,60 ms eşiğini aştı. Radeon LED medyanları yükseldi. Eşler arasındaki değişim −1,62…+8,59 ms GPU güven aralığı verdi. Hiçbir sahne önceden belirlenen tekrarlanabilir regresyon kriterini karşılamadı. RTX kapalı dışındaki beş sahnede iki taraflı eşdeğerlik kanıtı tamamlanmadı.

Uzun kare ve Sunum'a giriş, altı sahnenin tamamında eşik içinde. Radeon kapalı sahnenin Düzenleme'ye dönüşünde medyan 15,9→17,1 ms, güven aralığı −21,46…+61,22 ms. Diğer beş sahnenin kapatma ölçütü geçti. Mod geçişleri kullanıcı tıklamasının giriş kuyruğunu içermiyor. Test makinesinin ısı ve saat frekansı kaydı tutulmadığından bu değişkenliğe belirli bir sistem nedeni atanmıyor.

## Veri ve tekrar

Yerel teslimde `results/performance-windows.csv` her pencerenin CPU ve kare p50/p95/p99, GPU p50/p95, örnek sayısı, disjoint sayısı, mod gecikmeleri, uzun kare oranı ve çizim çağrılarını içerir. `results/summary.json` eşli farkları ve güven aralıklarını, `results/paired-p95.png` güven aralığı çizelgesini içerir. Zaman serileri ve doğrulanmış kamera/pozlar `evidence/` altındaki run JSON'larında bulunur. Tekrar için kanıt paketindeki `qa/README.md` ve `qa/ACCEPTANCE.md` kullanılır. [Kaynak ömrü ölçümü](WEBGL_RESOURCE_30_CYCLE_VERIFICATION.md) · [Yayın kararı](WEBGL_RESOURCE_RELEASE_DECISION.md)
