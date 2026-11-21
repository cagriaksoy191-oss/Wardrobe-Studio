# WS-UX-011 · büyük model kutu seçimi

21 Kasım 2026. Üretim referansı `26841cc0dee39d65cfa00d6b33f3c899919f7284`. Çalışma dalı `fix/ws-ux-011-marquee-interaction`. Üretim HTTPS paketinde yayımlanan 12 dosya doğrulandı.

**READY_FOR_RELEASE_REVIEW.** Büyük modelde toplam bırakma ve panel p95 değerleri sırasıyla %15,7 ve %16,3 iyileşti. Adayın panel p95’i 46,2 ms. Sürükleme p95 farkı 0,3 ms. Normal model ve işlev kabulü yerel tarayıcıda tamamlandı. Yayın ayrı kullanıcı onayı gerektirir.

## Darboğaz ve değişiklik

Önceki izlerde `pointerup` işleyicisi p95 yaklaşık 0,3–0,5 ms sürdü. `7b91a12` dolgu malzemesi ve hover güncellemesi deneyi ikinci turda bırakma kare p95’ini 50,7’den 97,8 ms’ye, panel p95’ini 63,1’den 111,9 ms’ye çıkardı. Eski izlerde App/R3F render süreleri ve kenar ref bağlamaları bırakma çevresinde yoğunlaşırken, raycast ve kamera grup analizi yaklaşık 0,3 ms p95 sürdü. V8 küçük GC p95’i 2,7–2,9 ms aralığındaydı. Bu ölçümler önceki geliştirme profiline aittir.

Güncel üretim kodunun üç tanı sürüklemesinde 130 seçim çizgisi 130 ayrı çizgi geometrisiyle işlendi. İlk tamamlanan sahne karesinde toplam 1528 çizim çağrısı görüldü. Bırakma ile bu karenin tamamlanması arasında 360, 645 ve 370 WebGL tamponu oluşturulup yüklendi. İlk toplu çizim varyantında aynı sahne 5 seçim çizgisi geometrisi ve 1403 çizim çağrısı verdi. Tampon sayıları 120, 130 ve 130 oldu. Tampon sayaçları sahne genelini kapsar. Bunlar tek başına React commit veya GC süresini ölçmez.

`src/canvas/wardrobe/WardrobeMeshGroup.tsx` aynı renkteki dikdörtgen hücre kenarlarını mevcut Drei `Line` bileşeniyle birleştirir. `boxSelectionOutline.ts` dikdörtgen hacmin boyutu, merkez, Y dönüşü ve önceki kenar sırasıyla aynı 12 segmenti üretir. İlk varyant tüm boyutlarda toplu çizim kullandı. Normal modelde panel medyanı 17,1’den 24,0 ms’ye çıktığı için son varyant 64 çözülmüş hücreden küçük modellerde önceki hücre başına çizimi kullanır. Model tabanlı karar sürükleme boyunca sabittir ve çizilecek hücre sayısını sınırlamaz. Poligon köşeler mevcut kenar bileşenini kullanır. Çizgiler `NOOP_RAYCAST` ile etkileşim dışıdır. Dört deterministik test segmentleri eski `EdgesGeometry` ile üç dönüşte karşılaştırır ve minimum hacmi sınar.

## Ölçüm ve sonuç

Normal Brave 157, Radeon 610M ANGLE D3D11, 1600×900 CSS px, DPR 1, 928×810 çizim tamponu. Model 14 bölme ve 144 çözülmüş hücre içeriyor. İki yerel paket üretim kipinde aynı ölçüm koduyla derlendi. Her blokta 3 ısınma ve 11 geçerli seçim, taban–aday–aday–taban sırası, aynı kamera ve dört sabit işaretçi yönü kullanıldı. Nihai karşılaştırmada **22 + 22** geçerli sürükleme var. Her seçimde önceki kayıttaki **aynı sıralı 130 benzersiz hücre** seçildi. Design JSON ve Undo geçmişi eşleşti.

| Ölçüm | Üretim p50 / p95 (ms) | Aday p50 / p95 (ms) | p95 değişimi |
| --- | ---: | ---: | ---: |
| Sürükleme karesi | 11,5 / 19,2 | 11,8 / 19,5 | +%1,6 |
| Bırakmayı kapsayan kare | 12,7 / 25,4 | 12,4 / 21,4 | −%15,7 |
| Bırakmadan seçim sahnesinin tamamlanmasına | 41,1 / 54,3 | 36,6 / 45,2 | −%16,8 |
| Panelin ilk tıklanabilir karesi | 41,7 / 55,2 | 37,2 / 46,2 | −%16,3 |
| Bırakmayı izleyen 200 ms içindeki kareler | 14,9 / 30,8 | 15,7 / 27,4 | −%11,0 |
| >50 ms kare / giriş sonrası Long Task | 0 / 0 | 0 / 0 | 0 |

Bırakma kare p95’i blok çiftlerinde 24,2→21,6 ve 31,6→15,5 ms. Panel p95’i 47,5→50,1 ve 55,9→45,2 ms. Panel medyanı iki blok çiftinde de düştü. Toplu kazanım yaklaşık %20 hedefinin altında, panel p95’i 50 ms’nin altında. Bir bloktaki panel p95 artışı örneklem belirsizliği olarak korunur.

İlk varyantın 22+22 ölçümünde bırakma kare p95 24,4→16,6 ms, panel p95 51,3→44,6 ms idi. Normal modeldeki panel medyanı artışı, toplu çizimin büyük modellerle sınırlandırılması kararına yol açtı. İki varyantın verileri kendi taban bloklarına göre okunur.

Görünür tamamlanma R3F’nin Store commit’inden ve kutu kaybından sonraki ilk tamamlanan karesidir. Ekranın fiziksel taraması ölçülmedi. Panel ölçümü etkin ve hit-test ile erişilen temizleme düğmesinin ilk gözlendiği kareyi gösterir. Her örnekte sonraki gerçek tıklama düğmenin işlemini doğruladı. Yüzdelikler nearest-rank. Aynı tarayıcı oturumu ve 22 gözlem geniş donanım genellemesi için yeterli değildir. P99 kabul ölçütü olarak kullanılmadı.

Ham ölçümler proje altındaki `artifacts/ws-ux-011-final/comparison.json`, `comparison-summary.json`, `diagnostic.json` ve `approach-1/` dizininde. Protokol, normal model gözlemleri, tarayıcı kabulü, ekran görüntüleri ve otomatik kontrol kayıtları aynı yerel dizinde.

## Gerçek tarayıcı ve değişmezler

- Normal modelde iki ısınma sonrası her sürümde beş sürükleme ve aynı yedi hücre. Panel medyanı 23,5→19,7 ms, bırakma karesi medyanı 7,1→5,7 ms. Bırakma maksimumu 7,8→12,5 ms. Örnek küçük olduğundan bu kontrol büyük modelin ölçüm serisine katılmadı.
- Dört çizim yönü, seçim temizleme, aktif sürüklemeyi Escape ile iptal, boş kutu ve yeni seçim doğrulandı. 3D’de tekli seçim, Ctrl ile ekleme ve Shift ile çıkarma, 2D cephede hücre seçimi, üst plan ve 3D’ye dönüş geçti. Kamera değişikliği ve sıfırlaması çalıştı. İki ekran görüntüsü çiftinde 751.680 sahne pikselinin 175 ve 413’ü farklıydı. Sahne kesiti, çizgilerin küçük raster farklarını içerir.
- Büyük modelde Ctrl ve Shift ile ayrı ayrı 42 hücrelik seçime kutu eklendi. İki işlem de mevcut sırayı koruyarak 130 hücreye çıktı. Design JSON aynı kaldı.
- Tek hücreyi dikey bölme ve Geri Al, toplu raf aralığı değişikliği, Geri Al/Yinele ve manuel kayıt sonrası F5 doğrulandı. JSON içe/dışa aktarımı semantik olarak eşleşti. Adlandırılmış sürüm, arşiv ve A/B karşılaştırması ile Sunum Modu, kapak ve çekmece komutları sentetik oturumda çalıştı. Görülen konsol hatası yerel favicon 404’üydü.
- Üç fiziksel P0 modelinde tam CSV ve ZIP kilitliydi. Tanısal PDF, SVG ve HTML indirildi ve dosyalar ayrıştırıldı. A3 PDF sayfa sayıları kör köşe 35, beşgen 41, asimetrik 41. SVG geçerli ve HTML gömülü fontu içeriyor.
- `POST_D3_BASELINE_001` için 12 SHA-256 ve 338 fiziksel parça doğrulandı. Düz 69, beşgen 94, kör köşe 81, asimetrik 94. D3-BASELINE-001, MS-EXPORT-001, WS-UX-009a, ContactShadows, kayıt ve üretim politikası yolları üretim referansıyla aynı.

Temiz `npm ci`, **358/358** test, TypeScript/Vite build, `deploy:check` ve Wrangler dry-run geçti. Tam ve üretim bağımlılığı denetimlerinde 0 güvenlik açığı raporlandı. Vite büyük paket uyarısı sürüyor. QA ölçüm kodu standart üretim paketinin dışında. Kaynak commit’i `325c634`, test commit’i `f0fba84`.

WS-UX-011 üretimde açık. WS-UX-001, WS-UX-002 ve WS-UX-003 için fiziksel kabul bekleniyor. Aday inceleme için hazır ve ölçülen kazanım tek donanım koşuluna ait.
