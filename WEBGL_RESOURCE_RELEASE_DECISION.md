# ContactShadows · yerel yayın incelemesi

**`RESEARCHED_NOT_READY`** · 16 Kasım 2026 · `fix/webgl-contact-shadow-lifecycle`. Üretim tabanı `27361cbed6e4052b2712e7fd7f3559177a5bf156`, Worker `edab9786-e496-4096-a785-de955f99b2c7`. GitHub Workers Builds kontrolü başarılı (`18768d7f-cc07-4aa1-90a9-79914d4e101d`), 11 internet dosyası üretim tabanıyla eşleşti. Kaynak commit'i `ddfc3a5`, test commit'i `7f2134a`. Dal yerelde kaldı.

| Kabul ekseni | Gözlem |
| --- | --- |
| Kök neden ve temizleme | Drei 10.7.9 temas bileşeni, kendi render hedeflerini, düzlemini ve üç materyalini unmount sırasında dispose etmiyordu. Yerel aday sahipli hedefleri ve bunların native dokularını, geometriyi ve üç materyali tek sefer bırakıyor. [Uygulama](WEBGL_CONTACT_SHADOWS_LIFECYCLE_IMPLEMENTATION.md) |
| İki GPU ve tekrarlı 30 döngü | Her iki GPU'da iki aday oturumunun tamamında doku sayısı Sunum 16 / Düzenleme 6. Üretimde açılış 16→74, kapanış 8→66. Adayın 240 native hedef dokusu ve 480 geometri/materyal nesnesi bırakıldı. Adayda çift dispose yok. [Kaynak raporu](WEBGL_RESOURCE_30_CYCLE_VERIFICATION.md) |
| Açma ve bağlam kurtarma | Dört aday yeniden açılışı, sekiz bağlam kurtarması ve bağlam kurtarma sonrası çizim geçti. Her kurtarma oturumunun PNG çifti eşit. [Görsel rapor](WEBGL_VISUAL_EQUIVALENCE_REPORT.md) |
| Gölgeler | İki GPU'daki altı kapalı/açık/LED piksel çifti kabul eşiğini geçti. Aynı derinlik ve dört blur çizimi kullanıldı. [Görsel rapor](WEBGL_VISUAL_EQUIVALENCE_REPORT.md) |
| Performans | 60/60 geçerli pencere, sıfır disjoint. RTX kapalı eşdeğer. RTX ağır açıkta kare p95 medyanı 12,10→11,50 ms, GPU p95 11,09→9,95 ms, iki taraflı eşdeğerlik belirsiz. LED'de iki GPU için eşdeğerlik belirsiz. Önceden belirlenen tekrarlanabilir regresyon kriteri karşılanmadı. Radeon kapalı sahne kapanışı da belirsiz. [Performans raporu](WEBGL_CROSS_GPU_PERFORMANCE_COMPARISON.md) |
| Otomatik kalite ve kanonik model | Temiz kurulum, 354/354 test, Vite üretim paketi, statik doğrulama, Wrangler dry-run, iki audit sıfır bulgu. Dört `POST_D3_BASELINE_001` modelinin 12 imzası ve toplam 338 parça (69/94/81/94) korunuyor. [Otomatik kalite](WEBGL_CONTACT_SHADOWS_LIFECYCLE_IMPLEMENTATION.md#otomatik-kalite) |

## Normal üretim derlemesinde tarayıcı regresyonu

Sentetik dosyalar ve yeni yerel origin `127.0.0.1:8796` ile test edildi. Ölçüm enstrümantasyonu bu pakette bulunmaz. Üretim kullanıcı verisine erişilmedi.

| Tarayıcı senaryosu | Gözlem |
| --- | --- |
| Sunum ve görünüm | Aç, kapat, yeniden aç geçti. 3D perspektif, 2D cephe A/B ve üst plan çizildi. Sürüm arşivinden A/B tasarım karşılaştırması ve kapak kesim tablosu açıldı. |
| JSON, geçmiş, manuel kayıt | Dört kanonik JSON içe aktarıldı. Düz modelin tarayıcıdan indirilen Design JSON'u yapısal olarak girişle aynı. Geri Al düz→asimetrik, Yinele asimetrik→düz. Manuel kayıt, yeniden yükleme ve kayıt noktası geri geldi. |
| Kapak ve çekmece, WS-UX-009a | Asimetrik 464 mm köşe kapağı açma/kapatma kontrolü geçti. 12,8° mevcut fiziksel sınır gösterildi. Düz modelde 1458 mm kanat, 86 mm açık çekmece engeli yeniden üretildi. Güvenli sıra iki kez `[0,982,0]` ve tamamlanma mesajını verdi. |
| MS-EXPORT-001 düz model | Tam CSV 69 özgün parça satırı ve 25 sütun. ZIP 29 giriş, CRC geçerli, 25 SVG, CSV ve Design eşit. A3 PDF 25 sayfa ve yerel fontlu HTML ile SVG indirildi. |
| Üç fiziksel P0, MS-EXPORT-001 | Kör, beşgen 18/8 ve asimetrik beşgen 25/4 CSV/ZIP düğmeleri devre dışı. Sırasıyla 35, 41 ve 41 sayfa tanısal A3 PDF, tanısal HTML ve SVG indirildi. |
| Konsol | Son yerel doğrulama oturumunda yakalanan hata/uyarı sayısı 0. Bağlam kaybı yalnız ayrı ölçüm paketinde kontrollü olarak tetiklendi. |

Ham regresyon kanıtı teslimde `browser/product-checks.json`, `browser/file-verification.json`, ekran görüntüleri ve tarayıcıdan indirilen sentetik dosyalar altında. Kaynak ve performans verileri, PNG'ler, ölçüm programları ve tekrar komutları `WARDROBE_STUDIO_WEBGL_CONTACT_SHADOWS_EVIDENCE.zip` içinde.

Performans kabulü için belirsiz kalan açık/LED ve Radeon kapalı senaryolarının tekrarında daha yüksek örneklem ve sabit güç/termal koşullar gerekir. Bu sonuçla üretim yayını önerilmez. Üç fiziksel P0 (WS-UX-001/002/003) ve WS-UX-011 açık. `NOT_MEASURED` gerçek VRAM baytları için geçerlidir.
