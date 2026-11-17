# ContactShadows · kontrollü üretim yayını

## 17 Kasım 2026 yayın yetkisi

Kullanıcı, ContactShadows yaşam döngüsü düzeltmesinin kontrollü üretim yayınına kalan WebGL performans belirsizliği için **açık mühendislik risk kabulüyle** izin verdi. Otomatik kalite, fiziksel güvenlik ve üretim kilitleri kabulün koşuludur. Yayın adayı üretim tabanı `27361cbed6e4052b2712e7fd7f3559177a5bf156` üzerine eklenen kaynak düzeltmesi `ddfc3a5`, sahiplik testi `7f2134a` ve ilgili dokümantasyondur. Ürün ağacı `fafec94` ile eş. Son araştırma kararı `abc5153` içinde korunur.

**Resmî performans protokolü `RESEARCHED_NOT_READY`.** Normal Brave, Radeon 610M ve LED açık sahnede 16 yeni çift çalıştırıldı. 15. çiftin üretim penceresi ve 16. çiftin iki penceresi de ölçüm başlangıcında odaksızdı. Önceden belirlenen kurala göre iki çift elendi. 14 geçerli çiftin ortalama kare p95 farkı **−0,693 ms** ve betimleyici. 16 geçerli çift koşulu sağlanmadı. Önceki altı çiftte ortalama fark +0,450 ms ve tek taraflı %95 üst sınır +2,034 ms idi. Protokol geçmişi ve ham ölçümler korunur. [Nihai Radeon LED kararı](WEBGL_FINAL_LED_RELEASE_DECISION.md)

Yayın kapsamı mevcut shader, dört blur geçişi, gölge çözünürlüğü ve LED davranışıyla birlikte kaynak sahipliğini düzeltir. Üç fiziksel P0 için tam CSV/ZIP kilidi ve tanısal PDF/SVG/HTML sözleşmesi yayın koşuludur. Geometri ve kinematik uygulama dosyaları aynı kalır. [Kaynak ömrü uygulaması](WEBGL_CONTACT_SHADOWS_LIFECYCLE_IMPLEMENTATION.md) · [Kanonik üretim referansları](ENGINEERING_INVARIANTS.md#post_d3_baseline_001)

## Üretim doğrulaması

**Kaynak ömrü düzeltmesi üretimde doğrulandı.** İlk uygulama yayını `d6dcabd7dc9b50be4086098f218b1c7e34166898` güvenli ileri sarma ile özel GitHub deposunun `main` dalına alındı. Workers Builds `08b5b8d5-61dd-4d03-9304-06894d535453` başarılı. İlk Worker `a4908c93-2ca0-4cf5-98e7-b1b1fb36ed74` Ready ve %100 trafikte gözlendi. Workers Free etkin. Bu raporu ve devir belgelerini taşıyan yalnız Markdown commit’i mevcut Cloudflare iş akışında aynı uygulama paketini yeniden dağıtır. İlk uygulama sürümü ve build kimlikleri tarihsel kabul kanıtıdır. [GitHub commit’i](https://github.com/cagriaksoy191-oss/Wardrobe-Studio/commit/d6dcabd7dc9b50be4086098f218b1c7e34166898) · [Cloudflare build](https://dash.cloudflare.com/b76b247b22f0678a722cad37767e2b19/workers/services/view/wardrobe-studio/production/builds/08b5b8d5-61dd-4d03-9304-06894d535453) · [Canlı uygulama](https://wardrobe-studio.cagriaksoy191.workers.dev/)

| Kontrol | Sonuç |
| --- | --- |
| Temiz kurulum ve test | Windows ve Cloudflare Linux’ta 22 dosya, 354/354 test. CI ayarı `--maxWorkers=2 --testTimeout=30000`. |
| Üretim derlemesi | TypeScript/Vite, statik paket doğrulaması, `npm run deploy:check` ve Wrangler dry-run başarılı. Windows çıktısı 13 dosya ve 3.329.976 bayt. En büyük dosya 1.908.286 bayt. Vite büyük paket uyarısı devam ediyor. Worker bağlaması eklenmedi. |
| Bağımlılık güvenliği | Tam ve yalnız üretim `npm audit` sonuçlarında 0 güvenlik açığı. Cloudflare temiz kurulum kaydında 0 güvenlik açığı. |
| Geometri ve üretim | `POST_D3_BASELINE_001` düz 69, kör köşe 81, beşgen 94, asimetrik 94 parça. 12/12 SHA-256 ve toplam 338 fiziksel parça. Solver, kayıt şeması ve hareket motoru dosyaları aynı. |
| GPU kaynak sahipliği | İki hedef ve ek dokuları hedef üzerinden, düzlem geometrisi ve üç materyal kendi sahibi üzerinden serbest bırakılır. Dört test tek sefer dispose, React StrictMode, kaynak değişimi ve ödünç dokunun korunmasını doğruladı. Drei 10.7.9 MIT metni ve telif bildirimi HTTPS üzerinden dağıtıldı. |
| Gerçek HTTPS | Git’in LF satır sonlarıyla oluşturulan aday paketinin 12/12 yayımlanabilir dosyası bayt düzeyinde eşleşti. Windows çalışma ağacıyla ilk karşılaştırmadaki üç metin farkı satır sonlarından kaynaklandı. CSP, `nosniff` ve referrer ilkesi doğrulandı. |

Canlı ana belgenin SHA-256 değeri `6508b6667ce881f5ab74a6a7a2c298b480b0447107d3d2dc2e2aa9e00121bd3f`. `assets/index-BXvqRela.js` SHA-256 değeri `1e3e3cf372166b8f6b56b460a40bade12054d4814fcb174607f29c496d5a99bb`. `THIRD_PARTY_NOTICES.txt` SHA-256 değeri `3990b3526f7491d1d116831ab706212488681ce81e6b4f2110ded2457c5e71e1`.

## Gerçek tarayıcı kabulü

- İzole sentetik oturumda asimetrik 25/4 model ile sekiz Sunum/Düzenleme döngüsü, 1056×885 WebGL çizim tamponu ve yeniden açılan Sunum Modunda görünür temas gölgeleri doğrulandı. Konsolda hata veya uyarı kaydedilmedi. Dört otomatik test ve önceki iki fiziksel GPU araştırması dispose davranışının kanıtıdır. Canlı kontrol kapsamında işlevsel geçiş ve görüntü gözlemlendi. [İki GPU kaynak ömrü](WEBGL_RESOURCE_30_CYCLE_VERIFICATION.md)
- LED aç/kapa/aç, göz hizası kamera değişimi ve aynı görüntüye dönen kamera sıfırlama, 3D Perspektif, 2D A/B ve Üst Plan geçti. Asimetrik köşe kapağı 12,8° / 110° sınırını korudu.
- WS-UX-009a gerçek hareket sınırına uydu. Sürgü 1458 mm’de, ilgili çekmece 86 mm açıkken güvenli sıra sunuldu. Sıra çekmeceler ve birinci sürgü kapanınca başarı mesajını verdi. İkinci sürgünün 982 mm konumu korundu.
- Sentetik tavan yüksekliği 2550→2560 mm, Geri Al 2550, Yinele 2560 ve manuel kayıt sonrası F5 2560 mm. Canlı JSON içe/dışa aktarımında `Design` alanları eşleşti.
- Düz modelde CSV 69 satır ve 25 sütun. ZIP 29 giriş, CRC ve içerik doğrulaması geçti. Kör köşe, beşgen ve asimetrik modellerde tam CSV/ZIP hem panelde hem geniş önizlemede kilitli. Dört modelde sırasıyla 25/35/41/41 sayfalık A3 PDF, geçerli SVG ve gömülü fontlu HTML indirildi. Üç P0 PDF/HTML çıktısı tanısal olarak işaretli.

## Açık bulgular ve geri dönüş

WS-UX-001 beşgen raf erişimi, WS-UX-002 asimetrik beşgen erişimi ve WS-UX-003 kör köşe çekmece stroku fiziksel P0 olarak açık. WS-UX-011 büyük model seçim bırakma gecikmesi kısmi ve açık. MS-EXPORT-001, D3-BASELINE-001 ve WS-UX-009a korunur. Sentetik tarayıcı oturumu dışındaki kullanıcı kayıtları kullanılmadı. Başarısız B1/B2 ürün ağaçları ve benchmark araçları üretim paketine alınmadı. [Açık bulgular](OPEN_ISSUES_AND_TECHNICAL_DEBT.md)

Geri dönüş için yayın öncesi `edab9786-e496-4096-a785-de955f99b2c7` doğrulandı. Uygulama kabulü geçtiği için geri dönüş uygulanmadı. Kullanıcı onayı yalnız belgelenmiş Radeon LED performans belirsizliğini kapsar. Yeni GPU deneyi çalıştırılmadı.
