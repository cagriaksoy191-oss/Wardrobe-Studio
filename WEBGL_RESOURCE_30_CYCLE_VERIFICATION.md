# Sunum Modu · 30 döngü kaynak doğrulaması

16 Kasım 2026. Yerel sentetik büyük L, üretim `27361cb` ve aday `7f2134a`. Her WebGL sayacı `renderer.info.memory` üzerinden okundu. Program sayısı `renderer.info.programs.length`. Native temas dokuları `deleteTexture` çağrısı ve ilgili hedefin `dispose` olayıyla gözlendi. Hedef/doku kimliği ilk temas derinlik veya 512×512 blur çiziminde eşlendi ve her referans bir defa gözlemciye bağlandı. Sahne ve materyal sahipliğinin açıklaması [uygulama raporunda](WEBGL_CONTACT_SHADOWS_LIFECYCLE_IMPLEMENTATION.md).

Her 30 döngü oturumunda ilk ve son örnek dahil açma ve kapamanın her biri için en az beş çizilmiş kare ve 120 ms beklendi. Program sayısı tanısal olarak izlendi. Uygulama sahnesinin ve shader önbelleğinin kaynakları Three.js tarafından yönetildi. Yeniden açılışta 12 kare ve 500 ms sonrası kaydedildi. Bağlam kurtarma, aynı canvas üzerinde `WEBGL_lose_context`, 700 ms sonra geri yükleme isteği ve geri yüklemeden sonra yeni çizimle doğrulandı.

## Sonuçlar

Her GPU'da sürüm başına iki ayrı belge yüklemesinde 30 döngü. Toplam 240 döngü, adayda 120. Aşağıdaki aç/kapa doku değerleri dört üretim tabanı ve dört aday oturumunun tamamında aynı.

| Varyant | 1. döngü | 10. döngü | 20. döngü | 30. döngü |
| --- | ---: | ---: | ---: | ---: |
| Üretim tabanı | 16 / 8 | 34 / 26 | 54 / 46 | 74 / 66 |
| Aday | 16 / 6 | 16 / 6 | 16 / 6 | 16 / 6 |

Üretim tabanında Sunum geometrileri 986→1015, düzenleme geometrileri 1272–1273→1301. Adayda bütün Sunum örnekleri 986; düzenleme başlangıç ve son örnekleri 1271–1272 aralığında. Adayda düzenleme program sayısı örnekleme sonunda 16–18. Bu sayaçlardaki sınırlı değişim, doku/hedef sızıntısındaki 30 döngülük büyümeyi göstermedi.

| İzlenen sahipli nesne | Dört üretim oturumunda ayrılan / bir kez bırakılan | Dört aday oturumunda ayrılan / bir kez bırakılan |
| --- | ---: | ---: |
| Render target ve native texture | 240 / 0 | 240 / 240 |
| Temas geometrisi | 120 / 0 | 120 / 120 |
| Derinlik materyali | 120 / 0 | 120 / 120 |
| Blur materyali | 240 / 0 | 240 / 240 |

Adayın hiçbir izlenen nesnesinde çift dispose gözlenmedi. Dört aday yeniden açılışı ve sekiz bağlam geri yükleme testi geçti. Sekiz öncesi/sonrası bağlam PNG'si çifti piksel olarak birebir aynı. Aday, geri yükleme sonrası Sunum'da 16 ve Düzenleme'de 6 dokuya döndü. [Görsel karşılaştırma](WEBGL_VISUAL_EQUIVALENCE_REPORT.md)

**VRAM baytları `NOT_MEASURED`.** Render target, native texture bırakma olayları ve `renderer.info` sayaçları kaynak ömrünü gösterir. Sürücü belleği tahsisi veya sürücünün baytları işletim sistemine iade ettiği an ölçülmedi.

Teslimde `results/cycle-resources.csv` oturumların her birindeki 1–30 noktalarının açma/kapama geometri, doku ve program sayaçlarını içerir. `results/cycle-textures.png` düzenleme durumundaki doku eğrisi, `results/summary.json` ise hedef, geometri ve materyal olayları ile bağlam durumunun özeti. Ham nesne olayları ve geri yükleme PNG'leri `evidence/` altında.
