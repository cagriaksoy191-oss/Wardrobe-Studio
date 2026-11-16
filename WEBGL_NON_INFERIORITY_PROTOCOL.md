# ContactShadows · ölçüm öncesi protokol

Bu protokol yeni performans pencereleri açılmadan dondurulur. Üretim `27361cbed6e4052b2712e7fd7f3559177a5bf156`, aday `fafec9472a7341a741e82e040654b4f7baa41efd` kaynak ağacı. Adayda uygulama kodu, shader ve çizim optimizasyonu değişikliği yok. Önceki 3,3 saniyelik veri örneklem planlama ve bağımsız denetim içindir. Yeni kabul hesabına girmez.

## Hedef, sınırlar ve çıkarım

Karşılaştırma birimi aynı GPU ve sahnede ardışık iki tarayıcı zamanlama penceresidir. Fark daima aday eksi üretim. Birincil metrik tamamlanan R3F/kompozit çizimleri arasındaki gerçek kare aralığının nearest-rank p95'i. Bir p95 değişikliği için mutlak sınır +2,0 ms. Bu, 60 Hz kare bütçesinin %12'si ve 120 Hz bütçesinin %24'ü. Kuyruk ölçüsüyle birlikte küçük bir kare süresi farkına izin verir, düzenli olarak bir yenileme aralığı kaybetmeyi tolere etmez. Başsız Chrome kare zamanlaması doğrudan monitör kare teslimi olmadığından gerçek pencere koşusu ayrı kabul edilir.

| Metrik | İzin verilen kötüleşme | Gerekçe |
| --- | ---: | --- |
| Kare p95 | +2,0 ms | 60 Hz bütçesinin %12'si, sabit mutlak kullanıcı gecikmesi. |
| CPU çizim p95 | +2,0 ms | Ana iş parçacığı ve sürücüye gönderimde aynı kare bütçesi. |
| GPU sorgu p95 | +2,5 ms | 60 Hz bütçesinin %15'i. GPU başlatma/çalışma kuyruğu ayrımını kare p95 ile birlikte gözetir. |
| >33,3 ms kare oranı | +2 yüzde puanı | İki 60 Hz yenileme aralığını aşan ek kareleri sınırlar. >50 ve >100 ms ayrıca gösterilir. |
| İlk Sunum veya Düzenleme karesi | +20 ms (ayrı) | 60 Hz'de yaklaşık bir ek karelik mod geçişi farkı. |

Eşli farkların ortalaması ve örnek standart sapması üzerinden t güven sınırları. `NON_INFERIORITY` için tek taraflı %95 üst sınır kötüleşme sınırından kesin küçük olmalı. `TWO_SIDED_EQUIVALENCE` için aynı %90 çift taraflı aralığın iki ucu ± sınırın içinde olmalı. Yayın mantığı tüm zorunlu senaryo ve ölçütlerin birlikte geçmesini gerektiren intersection–union kuralıdır. Tek bir olumlu sahne yeterli değil. Belirli bir gerileme ilan etmek için birincil ve tamamlayıcı 36 metrik/sahne bir taraflı zarar testine Holm %5, ayrıca çiftlerin en az %70'inde pozitif fark ve iki blokta da ortalama pozitif fark aranır. Tek sonuç okuması, başsız dizi bittikten sonra. Birincil sonuç daha hızlı olduğu için iki taraflı eşdeğerliği kaçırabilir. Bu, `NON_INFERIORITY` sonucundan ayrı raporlanır.

## Örneklem ve sıra

Planlama hedefi fark 0 ms iken birincil metrikte yaklaşık %90 güç, tek taraflı α=0,05, eşli fark standart sapması önceki ham veriden. Yaklaşık n hesabı `ceil(((t(.95,n−1)+1.2816)*s/2)^2)`. En az 12 çift ve en yakın çift sayıya yuvarlama. Makine süresiyle önceden sınırlandırılan tavan 24. Radeon LED'in önceki s=5,31 ms değeri bu tavanda %90 güce yetmez. Daha uzun pencere ve eşli sıra gürültüyü azaltabilir, bu etki varsayılıp güven aralığı daraltılmaz. Plan AMD kapalı 14, ağır açık 16, LED 24. RTX kapalı 12, ağır açık 12, LED 24. Geçerlilik yedeği sahne başına en çok iki ek çift, yalnız önceden tanımlanan teknik geçersizlikte. Metrik sonuçlarına göre ek örnek talep edilmez.

Dört başsız blok AMD → NVIDIA → NVIDIA → AMD. Her sahne iki blokta dengeli. İki veya dört çiftlik gruplarda AB/BA dengesi, dönen sahne sırası ve protokolde sabit deterministik tohum. AMD LED ilk blokta öne alınır. Süreklilik sınırlaması nedeniyle ana seri içinde başka GPU testi, build veya tarayıcı etkileşimi başlatılmaz. Aynı AC durumu, güç şeması ve Brave sürümü. Her blok yeni, izole profil, aynı grafik sürücüsü ve ANGLE Direct3D 11. On saniye bloklar arası boşta bekleme, iki eş arasına sonuçla tetiklenen bir saniye boşluk, eşlerin arasındaki iki karşılaştırma penceresi ardışık. Her pencere temiz belge ve aynı hazırlık. Düzenleme ilk dört kare ve 450 ms, Sunum 12 kare ve 2.000 ms ısınma, ardından 8.300 ms hedef örneklem. GPU sorgusu her üçüncü tamamlanan kare, en çok 16 bekleyen sorgu. İlk ve son 3,3 saniye alt pencereleri, sıcaklık/frekans, blok, sıra ve GPU→CPU yığılması ilişkileri ayrı tanısal okumadır.

## Eşleşme ve eleme

Fikstür aynı sentetik büyük L. Kapalı konum, LED açık kapalı konum, ağır sahnede aynı sabit açık poz ve eşya. Tam WebGL renderer dizesi, fiziksel adaptör LUID, kullanıcı ajanı, viewport/DPR/canvas, sahne varlık sayıları, aynı mekanik poz, kamera, LED ve görünür ışık sayısı saklanır. Farklı renderer, cihaz değişimi, eşleştirme hatası, yeniden çizimin bitmemesi, görünürlük kaybı, 8.000 ms altında süre, 100 altında tamamlanan kare, zamanlayıcı kullanılan pencerede 35 altında GPU örneği veya disjoint pencereyi teknik olarak geçersiz kılar. Her ham satır saklanır. Yüksek zamanlama değerleri silinmez. Teknik yedek bütün çifti aynı AB/BA düzeniyle tekrarlar. Kullanıcı tıklaması kuyruğu CPU/GPU ölçümüne dahil değildir.

## Tanısal kontroller ve ayrı kabul

- AMD LED için dört ek AB/BA çiftinde GPU sorgusu kapalı. Bu ayrı deney GPU query overhead etkisini değerlendirir ve ana kabul hesabına girmez.
- Normal Brave penceresinde her GPU ve üç sahne için iki A/B çifti, gerçek görünür UI. Ayrı gözlem örneklemi, başsız güven sınırlarına karıştırılmaz. Her GPU adayında gerçek pencere altında 30 Sunum/Düzenleme döngüsü, native hedef/doku olayları, bağlam kaybı/geri yükleme ve en az bir 120 saniyelik Sunum beklemesi. Önceki uygulama build'inin etkileri ve ekran tazeleme farkları ayrı değerlendirilir.
- GPU frekans, sıcaklık, güç ve yük sadece desteklenen salt okunur sürücü ve işletim sistemi sayaçlarından. NVIDIA `nvidia-smi`, AMD sürücü telemetrisi ve Windows host yükü. Erişilmeyen metrik `NOT_MEASURED`. Tarayıcı içi GPU zamanı, sürücü saat frekansı veya VRAM bayt ölçümü yerine kullanılmaz.
- Canvas PNG'leri ağ aktarımı ve kodlama ana pencere sonrasında. Mevcut eşiği koruruz. Piksel başına maksimum kanal farkı ortalaması ≤0,25 ve iki seviyeyi aşan pikseller ≤%1. Sentetik bağlam kaybı ayrı koşu.

[Khronos WebGL GPU sorgusu](https://registry.khronos.org/webgl/extensions/EXT_disjoint_timer_query_webgl2/) · [Tek taraflı çıkarım örneği](https://www.hhs.gov/guidance/sites/default/files/hhs-guidance-documents/FDA/E9-Statistical-Principles-for-Clinical-Trials.pdf) · [NVIDIA telemetri başvurusu](https://docs.nvidia.com/deploy/nvidia-smi/index.html)
