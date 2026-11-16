# Radeon 610M LED · performans değişkenliği incelemesi

Üretim tabanı `27361cb`, ContactShadows adayı `fafec94`. Etki işareti her zaman aday eksi üretim. Kısa eski seri planlama ve tanı amacıyla incelendi. Yeni deney ayrı, önceden belirlenmiş ölçütlerle değerlendirildi. [Ölçüm öncesi protokol](WEBGL_NON_INFERIORITY_PROTOCOL.md)

## Bağımsız eski veri denetimi

Önceki kanıt ZIP'indeki 177 girdinin SHA-256 ve boyutları, 60 zamanlama penceresi, 240 kaynak döngü satırı yeniden hesaplandı. Nearest-rank `sıralı[ceil(n × p) − 1]` ile CPU/kare p50/p95/p99 ve GPU p50/p95 doğrulandı. `n=5`, `df=4` ve `t=.95` kritik değeri `2,131847` ile eski iki taraflı %90 güven aralıkları yeniden elde edildi. Her pencerede gerçek ANGLE Direct3D11 donanım adı kaydedilmiş, kamera/poz ve profil koşulları eşleşmişti. İki GPU'da sıraya üç AB ile iki BA çift girmiş. Gerçek süre, örnek sayısı, >33,3 ms uzun kare oranı ve açma/kapatma işaretleri eski özetlerle uyumlu. Sıfır disjoint ve sıfır geçersiz pencere. Yüksek değerler ham serilerde duruyor. Bağımsız denetim tarihsel yayın kararını değiştirmedi.

| Radeon LED çifti | Sıra | Kare p95 üretim → aday | GPU p95 üretim → aday |
| --- | --- | ---: | ---: |
| 1 | AB | 17,8 → 18,7 ms | 16,57 → 18,20 ms |
| 2 | BA | 19,4 → 17,3 ms | 16,91 → 16,66 ms |
| 3 | AB | 19,3 → 22,2 ms | 18,87 → 19,85 ms |
| 4 | BA | 18,2 → 30,3 ms | 16,55 → 29,48 ms |
| 5 | AB | 22,5 → 26,4 ms | 21,02 → 23,16 ms |

Dördüncü çiftte adayın 174 kare aralığından 81'i üretim p95'i olan 18,2 ms'nin üstünde. Tek bir en yüksek kare bu farkı açıklamıyor. Beş GPU farkından en büyüğü aynı turda +12,93 ms. CPU, kare ve GPU p95 birlikte yükselmişti. O koşuda frekans, güç, sıcaklık veya eşzamanlı süreç yükü kaydı yoktu. Dolayısıyla eski anormalliğe bu nedenlerden herhangi biri atanamaz.

Önceki RTX ağır açık senaryoda kare p95 12,1→11,5 ms ve GPU p95 11,09→9,95 ms idi. Daha iyi görünen medyanlar iki taraflı eşiği otomatik geçirmez. Eski GPU fark aralığı −2,03…+0,73 ms, alt tarafı kabul bandını aştı. Bu tarihsel sonuca yeni bir eşik uygulanmadı.

## Yeni AMD LED deneyi

24 geçerli eş, iki ayrı blok, 12 AB ve 12 BA. Kare p95 medyanı 21,30→20,85 ms. Aday eksi üretim eşli ortalaması **−0,23 ms**, tek taraflı %95 üst sınır **+0,46 ms**. GPU p95 eşli ortalaması **−0,49 ms**, üst sınır **+0,25 ms**. İki sınır da önceden belirlenen +2,0 ve +2,5 ms eşiklerinin altında. Eski +12,1 ms'lik kare p95 farkı yeni seride tekrarlanmadı. Materyal, kamera, çözülmüş pozlar, LED ve görünür ışık sayısı eşleşti. Üç çizim sayaç değeri 1126/1125/4 olarak kaldı.

| Olası açıklama | Ölçülen kanıt |
| --- | --- |
| Kısa pencere ve kuyruk örneklemesi | Aynı 8,3 saniyelik yeni serinin ilk ve son 3,3 saniyeleri tek başına alındığında eşli kare p95 farkı standart sapması **2,85** ve **3,83 ms**. Tam pencerede **1,98 ms**, eski kısa seride **5,31 ms**. Uzun pencere ve daha çok eş, önceden gözlenen istatistiksel belirsizliği azalttı. |
| Isı, frekans ve güç | AMD ADLX, ölçüm aralığında 600–2200 MHz grafik saati, 57–68 °C ve 22–67 W `GPUPower` bildirdi. Frekans, sıcaklık ve güç için pencere medyan farklarının kare p95 farkıyla korelasyonu sırasıyla −0,06, −0,16 ve −0,21. Bu saat ve ısı aralığında kuvvetli bir ilişki gözlenmedi. Dereceler kartın bildirdiği sensörden, watt değeri ADLX'in bildirdiği metriktir. |
| Güç ve adaptör seçimi | Windows yüksek performans şeması kayıtlı, ara kontrol ve normal pencere öncesi AC `Online`. Her pencerede Radeon 610M ANGLE D3D11, LUID `0,61187`. Adaptör geçişi gözlenmedi. |
| Zamanlayıcının kendi yükü | AMD LED dört ayrı AB/BA çiftinde GPU sorgusu kapalı, kare p95 farkı ortalaması −0,95 ms ve dört fark da aday lehine. Zamanlayıcılı ortalama −0,23 ms. Küçük kontrol, sorguların neden olduğu mutlak maliyeti veya eski uç olayın nedenini ölçmeye yetmez. Yeni seride sorgu kapalıyken aday yavaşlamadı. |
| Sürücü derleme ve önbelleği | Aynı sürücü, aynı Brave, her blokta yeni profil ve eşit ısınma. İlk ve son alt pencerelerde değişkenlik var. Çizim adetleri eşleşti. Sürücü derleyicisinin cache hit/miss serisi `NOT_MEASURED`. |
| Arka plan yükü | AMD LED penceresinde toplam host CPU kullanım medyanı %8,22–15,82. Eşli değişim ile kare p95 farkı korelasyonu +0,10. Süreç başına GPU ve CPU kullanım izi `NOT_MEASURED`. |

AMD LED kare p95 farkı AB'de −0,03 ms, BA'da −0,43 ms, ilk blokta −0,63 ms, son blokta +0,17 ms. Her defasında bir çifti dışarıda bırakan tanısal hesapta ortalama −0,50…−0,11 ms. Tam kabul hesabı bütün çiftleri içerir. Kare ile CPU p95 farkı `r=0,99`, kare ile GPU farkı `r=0,91`. Bu birliktelik yavaş karelerin çizim yolunda görüldüğünü gösterir. Eski uç olayın belirli fiziksel nedeni, o koşuya ait telemetri bulunmadığı için belirlenemedi.

Diğer senaryolarda kare p95 eşli fark SD'si Radeon kapalıda 2,37→1,63 ms, ağır açıkta 2,47→1,25 ms, RTX LED'de 3,22→2,18 ms, RTX ağır açıkta 1,49→0,54 ms. RTX kapalıda 0,74→1,80 ms. Farklı pencere ve kare işaretleri nedeniyle bu değerler protokoller arası tanı amaçlı. Başsız seride AMD LED için anlamlı kötüleşme görülmedi. [Kabul hesabı](WEBGL_NON_INFERIORITY_VALIDATION_REPORT.md) · [AMD ADLX GPU metrikleri](https://gpuopen.com/manuals/adlx/adlx-sdk-references/adlx-interfaces/performance-monitoring/iadlxgpumetrics/)

Normal pencere Radeon LED tekrarı altı bağımsız çiftle sınırlı. Kare p95 ortalama farkı +0,45 ms ve üst sınırı +2,03 ms. GPU p95 ortalama farkı −0,63 ms ve üst sınırı +0,54 ms. İlk blokta kare p95 farkı ortalaması −0,70 ms, ikinci blokta +1,60 ms. Normal pencere belirsizliği doğrudan GPU p95 artışıyla tekrarlanmadı. CPU paket derecesi, saat frekansı ve gücü `NOT_MEASURED`. Sürücü kompozisyonu ile süreç başı yükü ayıran bir iz, kalan normal pencere farkını tanımlamak için gerekir. [Normal pencere sonuçları](WEBGL_HEADLESS_VS_HEADED_COMPARISON.md)
