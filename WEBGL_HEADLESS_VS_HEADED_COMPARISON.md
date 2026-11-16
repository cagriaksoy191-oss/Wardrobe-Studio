# Başsız Brave ve normal Brave penceresi

Bu çalışma `27361cb` üretim tabanını `fafec94` ContactShadows adayıyla karşılaştırır. Başsız ve normal pencere serileri ayrı değerlendirilir. Her iki modun kare aralığı R3F kompozit çizimlerinin tamamlanma zamanları arasındaki süredir. Monitörün gerçekten sunduğu kareyi veya girişten fotona toplam gecikmeyi ölçmez. Normal penceredeki sınırlı tekrar, farklı sunum yolunda görünür işlev, hareket ve akıcılık sorunlarının ortaya çıkıp çıkmadığını sınar. [Ölçüm öncesi protokol](WEBGL_NON_INFERIORITY_PROTOCOL.md)

Kamera projeksiyonu, çözülmüş parça pozları, görünür ışık envanteri, LED, canvas ve cihaz piksel oranı her çift için denetlenir. Kapalı, ağır açık ve LED sahneleri aynı sentetik büyük L üzerinden kurulur. Süre örneklerine PNG yakalama ve dosya yazımı girmez. Piksel denetimi aynı GPU ve aynı pencere modunda yapılır. Kaynak ömrü, iki GPU'da da gerçek pencerede 30 aç/kapa ve 120 saniyelik Sunum beklemesiyle, daha sonra sentetik bağlam kaybıyla ayrıca sınanır. Bu fixture dokuları için 16/6 sayaçları kullanılır. VRAM baytları `NOT_MEASURED`.

## İlk normal pencere turu

Gerçek, odaklı Brave `--app` penceresinde 24/24 ölçüm. AMD Radeon 610M (13C0) ve NVIDIA GeForce RTX 5070 Ti Laptop GPU (2F18), ANGLE D3D11. Başsız ve normalde aynı Brave `157.1.99.57`, DPR 1. Normal viewport 1584×892, canvas sahneye göre 918×748 veya 918×801. Başsız viewport 1578×839, canvas 915×695 veya 915×748. Her çiftte canvas ve sahne eşleşti. Monitör Windows'ta 300 Hz olarak raporlandı. Sahne başına iki normal pencere çifti başlangıç göstergesidir.

| GPU ve sahne | İlk iki kare p95 farkı | İlk iki CPU p95 farkı | İlk iki GPU p95 farkı |
| --- | --- | --- | --- |
| Radeon kapalı | −2,40 / +0,80 ms | −2,40 / −2,30 ms | −3,09 / +3,25 ms |
| Radeon ağır açık | +1,10 / +1,00 ms | +1,20 / +2,60 ms | +3,39 / +3,33 ms |
| Radeon LED | +3,20 / +0,40 ms | +3,20 / +0,60 ms | +1,90 / +1,15 ms |
| RTX kapalı | −0,40 / −0,50 ms | −0,50 / −0,40 ms | −0,19 / −0,72 ms |
| RTX ağır açık | +2,20 / +2,00 ms | +2,20 / +2,10 ms | +1,72 / +1,77 ms |
| RTX LED | −1,30 / −1,90 ms | −1,50 / −1,90 ms | −1,34 / −1,48 ms |

Bu yüzden AMD ağır açık/LED ve RTX ağır açık için ilk iki çiftten bağımsız ikinci bir normal pencere deneyi kaydedildi. Altı yeni çiftin başındaki protokol aynı kötüleşme sınırlarını kullanır ve başlangıç çiftlerini yeni teste dahil etmez. [Bağımsız tekrar protokolü](WEBGL_HEADED_CONFIRMATION_PROTOCOL.md)

## Bağımsız normal pencere tekrarı

36/36 pencere ve üç sahnede altışar çift. Dört ayrı taze profil, iki cihaz, 3 AB ve 3 BA, eleme veya disjoint yok. Tabloda ortalama ± güven sonucu yerine doğrudan eşli ortalama ve tek taraflı üst sınır `(ortalama / üst)` verilmiştir. Birimler ms.

| GPU ve sahne | Kare p95 | CPU p95 | GPU p95 | 6 ölçütün sonucu |
| --- | ---: | ---: | ---: | --- |
| Radeon ağır açık | −0,02 / +1,05 | +0,03 / +1,19 | −0,03 / +1,22 | 6/6 geçti |
| RTX ağır açık | +0,83 / +1,58 | +0,83 / +1,57 | +0,69 / +1,24 | 6/6 geçti |
| Radeon LED | +0,45 / **+2,03** | +0,28 / +1,64 | −0,63 / +0,54 | 5/6 geçti, kare p95 belirsiz |

İki ağır açık sahnede ilk iki çiftteki uyarılar bağımsız örneklemde gerilememe sınırlarının içinde kaldı. Radeon LED kare p95 için tam üst sınır **+2,033875866 ms**. +2,0 ms kabul sınırını aştığı için bu ölçüt geçmedi. %90 çift taraflı aralık −1,13…+2,03 ms. İki blokta ortalamalar −0,70 ve +1,60 ms, altı çiftin ikisinde pozitif fark. Önceden belirlenen tekrarlanabilir regresyon koşulu karşılanmadı. İlk iki çift ile tekrar serisinin verileri ayrı tutuldu. [Radeon LED değişkenliği](WEBGL_AMD_LED_VARIANCE_INVESTIGATION.md) · [Yayın kararı](WEBGL_FINAL_RELEASE_READINESS.md)

## Kaynak ömrü

Her iki gerçek pencerede 30 aday döngüsünün tamamı, 120 saniye Sunum beklemesi ve bağlam kaybı/geri yükleme tamamlandı. Toplam 120 native hedef dokusu bir kez bırakıldı. Her cihazda aç/kapa doku sayısı 16/6. Her 120 saniyelik beklemede Sunum geometrisi 986, doku 16 ve GPU program sayısı kendi başlangıç değeriyle aynı. Yapay bağlam kaybından sonra iki cihaz da yeniden çizdi ve 16/6 dokularına döndü. Bu değerler sentetik test sahnesine aittir.

60 döngüde 120/120 hedef, 60/60 geometri, 60/60 derinlik ve 120/120 blur materyali bir defa dispose edildi. Çift dispose sıfır. İki bağlam kurtarma görüntüsü eşinin tamamı piksel olarak birebir aynı. İki tarayıcı modu ve ayrı GPU sorgusu kontrolü dahil 31/31 aynı-GPU karşılaştırması eşiği geçti. En büyük ortalama kanal farkı 0,1011/255, iki seviyeyi aşan piksel oranı en çok %0,621. Kapalı ve ağır açık sahne, LED, temas gölgesi ve görüntü tekrar açıldıktan sonraki çizim kanıtları `results/visual-resources.json` ve PNG paftalarında.

Normal üretim paketinin ayrıca yerel arayüz denetiminde sürükleme kamerayı önden arka düzleme çevirdi. Görünümü Sıfırla 3D kadrajını geri getirdi. Kapak/çekmece kontrolleri, LED açık→kapalı→açık ve Sunum/Düzenleme geçişi çalıştı. Ağır L modelinin var olan mekanik sınırlamaları hareket uyarısında gösterildi. Konsolda yeni hata veya uyarı yakalanmadı. Ekran görüntüleri `browser/` altında. Manuel kontrol normal pencere zamanlamasına sayılmadı.
