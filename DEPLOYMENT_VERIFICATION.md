# Wardrobe Studio yayın doğrulaması

11 Kasım 2026.

**Wardrobe Studio, Cloudflare Workers Static Assets üzerinde yayında.** Gerçek HTTPS adresi anonim HTTP istekleriyle ve tarayıcıyla doğrulandı. [Canlı site](https://wardrobe-studio.cagriaksoy191.workers.dev/)

Cloudflare hesabında Workers **Free ($0)** güncel plan olarak görünüyor. Özel GitHub deposunun `main` dalı Cloudflare Builds’e bağlı. Üretim dışı dal build’leri kapalı. [Özel kaynak deposu](https://github.com/cagriaksoy191-oss/Wardrobe-Studio)

## Başlangıç doğrulaması

- `npm test -- --run` başarılı, 13 dosyada 213/213 test geçti.
- `npm run build` başarılı, TypeScript ve Vite 6.4.5 geçti. Mevcut ana JavaScript paket boyutu uyarısı sürüyor.
- Klasörde Git deposu bulunmuyordu. `main` dalıyla yerel Git deposu oluşturuldu.
- GitHub CLI ve bağlayıcıda hesap `cagriaksoy191-oss` olarak doğrulandı. Bağlayıcının depo oluşturma yetkisi sınırlıydı. Mevcut GitHub CLI oturumuyla özel depo oluşturuldu. [Özel kaynak deposu](https://github.com/cagriaksoy191-oss/Wardrobe-Studio)
- İlk kaynak commit’i `c181faa6e3b41a9deaa8bc6ee4e056f1c009c0cf` özel deponun `main` dalına gönderildi. Temiz checkout üzerinde `npm ci`, 213 test, üretim derlemesi ve statik paket denetimi başarılı.
- Cloudflare ve GitHub oturumları kullanıcı tarafından resmî ekranlarda açıldı. Projeye bağlı depo ve `main` dalı ayarlarda doğrulandı. GitHub uygulamasının hesap genelindeki erişim listesini açmak ek kimlik doğrulaması gerektirdi. O liste üzerinde işlem yapılmadı.

## Statik mimari

Kaynakta bir yerel API, WebSocket, sunucu veritabanı, SSR veya harici AI çağrısı bulunmadı. Çözücü, görselleştirme ve üretim dosyaları istemcide çalışıyor. Çalışma zamanındaki tek `fetch`, `BASE_URL + fonts/NotoSans-Regular.ttf` dosyasını aynı siteden alıyor. PDF fontu ve lisansı `public/fonts` içinde.

`wrangler.jsonc` dosyası `dist` statik dizinini, SPA geri dönüşünü ve `workers.dev` üretim hedefini tanımlar. `preview_urls: false` sürüm başına açık adresleri kapatır. Wrangler 4.160.0 ve Node.js 24.16.0 sabitlendi. Cloudflare Node sürümünü `.node-version` dosyasından aldı ve kilit dosyasıyla `npm clean-install` çalıştırdı. [Yayın ayarları](DEPLOYMENT_GUIDE.md)

Wrangler dry-run başarılı oldu ve **No bindings found** bildirdi. Yerel statik paket 12 dosya ve toplam 3.266.109 bayt. En büyük dosya 1.846.487 baytlık ana JavaScript. Wrangler, `_headers` dosyasını yanıt kuralları olarak kullanıp 11 statik dosya yükledi. Free sınırları 20.000 dosya ve dosya başına 26.214.400 bayt. [Workers sınırları](https://developers.cloudflare.com/workers/platform/limits/)

## Kaynak ve kişisel kayıt yedekleri

Yedekler `.private/deployment-backups/2026-11-10/` altında ve Git hariç tutmasında.

| Yedek | Girdi | Bayt | SHA-256 |
| --- | ---: | ---: | --- |
| source-before.zip | 108 | 912867 | 501d0ad0c4dbc306ced7493b4cf5042daf4992b3785da2c7dd826603490058c6 |
| design-files-before.zip | 116 | 1296854 | 688d11484af4a6000597df31d91b8a25f778e0dbd0617e22719b04c4c604a73e |

Brave kişisel profilinde `127.0.0.1:5173`, `localhost:5173`, `127.0.0.1:5175` ve `localhost:5175` origin’leri uygulama anahtarları için salt okunur incelendi. Gerçek veri `http://127.0.0.1:5175` üzerinde bulundu. İki localStorage ve iki IndexedDB kaydı, 640623 baytlık tam yedeğe alındı. Bu dosyanın SHA-256 değeri `47e0213033207db2ba96cb930c4d54b66276561f2d92524237b0d58807ec6510`.

Çalışma, kayıt noktası ve arşivdeki tasarımlar iki kayıt kanalından toplam 10 ayrı taşınabilir Design kopyasına çıkarıldı. Tam yedek geçmiş ve metaveriyi de içerir. JSON içe aktarıcıyla canlıya aktarmak için `portable-designs` altındaki dosyalar kullanılabilir. Diğer üç origin’de uygulama kaydı görülmedi. İnceleme mevcut tarayıcı profili ve belirtilen adreslerle sınırlıdır.

Başlangıçta yedeklenen 116 yerel JSON dosyasının tamamı yayın sonrasında yeniden hash’lendi ve başlangıçla eşleşti.

## Git ve herkese açık dosya denetimi

`.gitignore` bağımlılıkları, derleme çıktısını, Wrangler önbelleğini, özel yedekleri, tüm `artifacts`, `output` ve `tmp` dizinlerini, tasarım JSON’larını, ZIP/PDF dosyalarını ve yerel gizli ayarları dışarıda bırakır. Bu dosyalar diskte saklanır. Commit kimliğinde hesaba ait GitHub noreply adresi kullanılır.

Herkese açık kaynak dosyaları yerel font, lisans ve statik yanıt başlıklarıdır. Yayın denetleyicisi izin verilmeyen public veya build dosyasında ve Free dosya sınırı aşıldığında işlemi durdurur. Statik yanıtlarda MIME türü denetimi, referrer politikası ve çerçeve/nesne/base politikası uygulanır.

Gönderim öncesi 114 takip edilen dosya ve üretim çıktısı tarandı. Taranan kapsamda kimlik bilgisi veya Git’e alınmış özel ve geçici dosya tespit edilmedi. Uygulama kaynakları, testler ve sözleşmelerden 75 dosyanın hash’i başlangıçla eşleşti. Canlı adreste ana JS, CSS ve TTF baytları yerel üretimle eşleşti. `/.env`, `/.git/config`, `/package.json`, yedek aracı ve `/.private/` için gezinme yanıtı aynı SPA HTML belgesiydi. Herkese açık dosya listesi ve yanıt başlıkları ayrıca denetlendi.

## Bağımlılık güvenlik bulguları

10 Kasım `npm audit` sonucu **4 bulgu**, bir moderate, bir high ve iki critical. Bu sayının test ve dolaylı bağımlılık yayılımını da içerdiği dikkate alınmalı. Ham sonuç `artifacts/deployment/npm-audit-before.json` içinde yerel saklandı.

- **Zod high**. Kurulu 3.x sürümü kaynak tüketimi uyarısı aralığında. Mevcut JSON girişleri 2.000.000 bayt, 30.000 düğüm ve 70 derinlik sınırıyla korunuyor. Doğrulama ziyaretçinin tarayıcısında yürür. Önerilen düzeltme 4.6.6+ ana sürümüne geçiştir ve eski Design dosyalarıyla regresyon incelemesi gerektirir. [Advisory](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5)
- **Vitest/tinypool critical ve mocker moderate**. Geliştirme/test zincirindedir. Uyarılar nesne prototipi üzerinden worker seçenekleri ve dev-server mock yönlendirmesiyle ilgilidir. Canlı statik çıktıya test sunucusu ve bu paketler yüklenmez. Önerilen otomatik düzeltme Vitest ana sürümünü değiştiriyor. [Tinypool advisory](https://github.com/advisories/GHSA-5gmw-xhrv-c9v3) · [Mocker advisory](https://github.com/advisories/GHSA-82fw-gwwq-j7x9)

Bu bulgular açık olarak raporlanıyor. Bağımlılık ana sürüm geçişi bu altyapı değişikliğinde uygulanmadı. Mevcut kilitlenmiş uygulama ve test sürümleriyle doğrulama yapıldı.

## Cloudflare derleme ve canlı kabul sonuçları

İlk Cloudflare build’inde 75 işlemli kayıt noktası testi 5 saniye sınırına takıldı. Build komutuna `--testTimeout=30000` eklendi. Sonraki build 59 saniyede tamamlandı ve sürüm `6a846522-e381-403c-8df4-684d09cc2803` üretimde yüzde 100 trafik aldı. [İlk başarılı Cloudflare build’i](https://dash.cloudflare.com/b76b247b22f0678a722cad37767e2b19/workers/services/view/wardrobe-studio/production/builds/437d5b3d-b467-441f-a625-a21158f052c2)

`main` dalına gönderilen `6bf9b159e799fbb64281e6d1a10af5e0e1e66d43` commit’i Cloudflare build’ini otomatik tetikledi. GitHub kontrolü `success` ile bitti. Sürüm `5b2eacbe-4e6d-41c7-849c-d8c24a497705` **Ready** ve yüzde 100 trafikle göründü. Cloudflare sürüm adreslerini **Previews disabled** olarak gösterdi. [GitHub commit’i](https://github.com/cagriaksoy191-oss/Wardrobe-Studio/commit/6bf9b159e799fbb64281e6d1a10af5e0e1e66d43) · [Otomatik build](https://dash.cloudflare.com/b76b247b22f0678a722cad37767e2b19/workers/services/view/wardrobe-studio/production/builds/6597166a-bc14-48f2-b6cf-e9ac5e2bf3b8)

Önceki çalışan sürümün menüsünde **Rollback** doğrulandı. Üretim trafiğinde deneme amaçlı geri dönüş uygulanmadı. [Dağıtımlar](https://dash.cloudflare.com/b76b247b22f0678a722cad37767e2b19/workers/services/view/wardrobe-studio/production/deployments)

| Canlı kontrol | Gözlenen sonuç |
| --- | --- |
| HTTPS ve SPA | Ana sayfa, JS, CSS ve PDF fontu 200. İç içe URL açıldı ve yenilendi. |
| 3D ve WebGL | Three.js sahnesi görüntülendi. Sürükleyince kamera döndü. Konsolda hata görülmedi. |
| 2D | A ve B cepheleri ve üst plan açıldı. |
| JSON | Sentetik 3000 mm tasarım yüklendi. İndirilen 3100 mm JSON tekrar açıldı. |
| Geri Al ve Yinele | 3000 → 3100 → 3000 → 3100 mm. |
| Kayıt ve yenileme | Manuel kayıt noktası sonrasında ana sayfa ve iç içe yol 3100 mm tasarımı geri yükledi. |
| PDF | İndirilen 121.159 baytlık dosyanın 25 sayfası A3 yatay. Kapak sayfası Poppler ile görüntülendi. |
| CSV | UTF-8 BOM ve Türkçe başlıklar, 69 parça satırı ve 25 sütun. |
| ZIP | CRC geçerli, 29 girdi, 25 SVG. CSV ve tasarım JSON’u ayrı indirilen dosyalarla eşleşti. |

Canlı denemeler ayrı tarayıcı profilinde ve sentetik tasarımla yapıldı. Çıktılar ve kanıtlar `artifacts/deployment/` altında yerel saklanıyor. JSON ve ZIP dosyaları kullanıcının gerçek tasarım arşivini içermez.

Yerel 5173, 5175 ve 8787 portlarındaki test süreçleri durdurulduktan sonra HTTPS ana sayfası ve statik dosyalar yeniden 200 döndü.

## Ücret ve kapsam sonucu

Workers **Free** ve ücretsiz `workers.dev` kullanılıyor. Statik istekler ücretsiz ve sınırsız, Free build kotası aylık 3000 dakikadır. Üretim Cloudflare’da hizmet verir ve yerel sunucunun çalışmasına ihtiyaç duymaz. Bu yayın için ücretli plan veya ek hizmet etkinleştirilmedi. [Statik ücretlendirme](https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/) · [Build kotası](https://developers.cloudflare.com/workers/ci-cd/builds/limits-and-pricing/)

Yerel kayıtlar kendi adreslerinde saklanır. Canlı adrese taşıma adımları rehberde yer alır. [Tasarım taşıma ve sonraki yayınlar](DEPLOYMENT_GUIDE.md)
