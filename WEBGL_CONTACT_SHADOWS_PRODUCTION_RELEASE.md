# ContactShadows · kontrollü üretim yayını

## 17 Kasım 2026 yayın yetkisi

Kullanıcı, ContactShadows yaşam döngüsü düzeltmesinin kontrollü üretim yayınına kalan WebGL performans belirsizliği için **açık mühendislik risk kabulüyle** izin verdi. Otomatik kalite, fiziksel güvenlik ve üretim kilitleri kabulün koşuludur. Yayın adayı üretim tabanı `27361cbed6e4052b2712e7fd7f3559177a5bf156` üzerine eklenen kaynak düzeltmesi `ddfc3a5`, sahiplik testi `7f2134a` ve ilgili dokümantasyondur. Ürün ağacı `fafec94` ile eş. Son araştırma kararı `abc5153` içinde korunur.

**Resmî performans protokolü `RESEARCHED_NOT_READY`.** Normal Brave, Radeon 610M ve LED açık sahnede 16 yeni çift çalıştırıldı. 15. çiftin üretim penceresi ve 16. çiftin iki penceresi de ölçüm başlangıcında odaksızdı. Önceden belirlenen kurala göre iki çift elendi. 14 geçerli çiftin ortalama kare p95 farkı **−0,693 ms** ve betimleyici. 16 geçerli çift koşulu sağlanmadı. Önceki altı çiftte ortalama fark +0,450 ms ve tek taraflı %95 üst sınır +2,034 ms idi. Protokol geçmişi ve ham ölçümler korunur. [Nihai Radeon LED kararı](WEBGL_FINAL_LED_RELEASE_DECISION.md)

Yayın kapsamı mevcut shader, dört blur geçişi, gölge çözünürlüğü ve LED davranışıyla birlikte kaynak sahipliğini düzeltir. Üç fiziksel P0 için tam CSV/ZIP kilidi ve tanısal PDF/SVG/HTML sözleşmesi yayın koşuludur. Geometri ve kinematik uygulama dosyaları aynı kalır. [Kaynak ömrü uygulaması](WEBGL_CONTACT_SHADOWS_LIFECYCLE_IMPLEMENTATION.md) · [Kanonik üretim referansları](ENGINEERING_INVARIANTS.md#post_d3_baseline_001)

## Üretim doğrulaması

Yayın kaydı, GitHub `main` üzerinden derleme tamamlandığında gerçek Cloudflare Worker, HTTPS paket eşlemesi ve sentetik tarayıcı kontrolleriyle tamamlanır. Önceki doğrulanmış geri dönüş sürümü `edab9786-e496-4096-a785-de955f99b2c7`.
