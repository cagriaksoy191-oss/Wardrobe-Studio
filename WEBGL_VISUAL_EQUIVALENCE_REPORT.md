# Sunum Modu · temas gölgesi görsel karşılaştırması

16 Kasım 2026. Her GPU kendi üzerinde üretim `27361cb` ile yerel aday `7f2134a` karşılaştırıldı. Büyük L fikstüründe aynı piksel oranı, kamera projeksiyonu ve pozlar kullanıldı. Varyantlar aynı sürücü ve Brave sürümünde ayrı origin'e yüklenir. Görüntüler doğrudan 915×695 canvas'tan alındı. Tampon kopyalama ölçüm penceresi bittikten sonra gerçekleşti.

Piksel metriği, her pikselin en büyük mutlak RGB kanal farkını alır. Kabul ölçütleri 0–255 ölçeğinde ortalama en çok 0,25 ve iki seviyeyi aşan pikseller en çok %1. Yan yana karşılaştırmada temas zemininin konumu ve koyuluğu, kenar ve bulanıklık, alt gölge, açık kapak/çekmece, LED ve tekrar açma kontrol edilir. Aynı GPU karşılaştırması donanımlar arası antialiasing farkını shader farkına karıştırmaz. Bağlam geri yükleme için yeniden açılmış çizim ve bağlam sonrası çizim ayrıca karşılaştırılır.

| GPU | Sahne | Ortalama en büyük kanal farkı (0–255) | İki seviyeyi aşan piksel oranı | Sonuç |
| --- | --- | ---: | ---: | --- |
| Radeon | Kapalı | 0,0399 | %0,055 | PASS |
| Radeon | Ağır açık | 0,1000 | %0,606 | PASS |
| Radeon | LED | 0,0391 | %0,056 | PASS |
| RTX | Kapalı | 0,0401 | %0,056 | PASS |
| RTX | Ağır açık | 0,0969 | %0,591 | PASS |
| RTX | LED | 0,0402 | %0,057 | PASS |

Dört aday yeniden açılış PNG'si, aynı GPU'daki başlangıç aday sahnesiyle eşiği geçti. En büyük ortalama fark 0,0408, iki kanal seviyesini aşan piksel oranı en çok %0,059. Bağlam kaybından önce/sonra aynı oturumun sekiz PNG çifti piksel olarak eşit. Görsel kabul üç seçili sahne ve bu gözlem koşullarıyla sınırlıdır.

Tam PNG'ler ve render/kamera verisi `evidence/` altındadır. Teslim `results/AMD-visual-comparison.png` ve `results/NVIDIA-visual-comparison.png` yan yana paftalarını ve ham piksel istatistiklerini `results/summary.json` içinde içerir. [Çizim yaklaşımı](WEBGL_CONTACT_SHADOWS_LIFECYCLE_IMPLEMENTATION.md) · [Zamanlama koşulları](WEBGL_CROSS_GPU_PERFORMANCE_COMPARISON.md)
