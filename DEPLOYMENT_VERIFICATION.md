# Wardrobe Studio yayın doğrulaması

10 Kasım 2026.

**Yerel hazırlık tamamlanıyor. Cloudflare oturumu bağlantı bekliyor. Gerçek canlı URL henüz oluşmadı.**

## Başlangıç doğrulaması

- `npm test -- --run` başarılı, 13 dosyada 213/213 test geçti.
- `npm run build` başarılı, TypeScript ve Vite 6.4.5 geçti. Mevcut ana JavaScript paket boyutu uyarısı sürüyor.
- Klasörde Git deposu bulunmuyordu. `main` dalıyla yerel Git deposu oluşturuldu.
- GitHub CLI ve bağlayıcıda hesap `cagriaksoy191-oss` olarak doğrulandı. Bağlayıcının depo oluşturma yetkisi sınırlıydı. Mevcut GitHub CLI oturumuyla özel depo oluşturuldu. [Özel kaynak deposu](https://github.com/cagriaksoy191-oss/Wardrobe-Studio)
- `wrangler whoami` oturum olmadığını bildirdi. Resmî Cloudflare dashboard’u giriş ekranına yönlendirdi. Hesap planı ve GitHub–Cloudflare bağlantısı henüz doğrulanamadı.

## Statik mimari

Kaynakta bir yerel API, WebSocket, sunucu veritabanı, SSR veya harici AI çağrısı bulunmadı. Çözücü, görselleştirme ve üretim dosyaları istemcide çalışıyor. Çalışma zamanındaki tek `fetch`, `BASE_URL + fonts/NotoSans-Regular.ttf` dosyasını aynı siteden alıyor. PDF fontu ve lisansı `public/fonts` içinde.

`wrangler.jsonc` yalnız `dist` statik dizinini, SPA geri dönüşünü ve `workers.dev` hedefini içeriyor. Kullanıcı API Worker’ı veya veri depolama binding’i eklenmedi. Wrangler 4.160.0 projeye sabitlendi, Node.js 24.16.0 `.node-version` ile belirtildi. GitHub otomatik yayını için Cloudflare’ın yerleşik Builds bağlantısı kullanılacak. Ayrıntılı ayarlar [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) içinde.

Wrangler dry-run başarılı oldu ve **No bindings found** bildirdi. Statik dosya denetimi 12 dosya, toplam 3.266.109 bayt ve en büyük dosya için 1.846.487 bayt ölçtü. Free sınırları 20.000 dosya ve dosya başına 26.214.400 bayt. Son kontrol sonuçları aşağıda güncellenir.

## Kaynak ve kişisel kayıt yedekleri

Yedekler `.private/deployment-backups/2026-11-10/` altında ve Git hariç tutmasında.

| Yedek | Girdi | Bayt | SHA-256 |
| --- | ---: | ---: | --- |
| source-before.zip | 108 | 912867 | 501d0ad0c4dbc306ced7493b4cf5042daf4992b3785da2c7dd826603490058c6 |
| design-files-before.zip | 116 | 1296854 | 688d11484af4a6000597df31d91b8a25f778e0dbd0617e22719b04c4c604a73e |

Brave kişisel profilinde `127.0.0.1:5173`, `localhost:5173`, `127.0.0.1:5175` ve `localhost:5175` origin’leri uygulama anahtarları için salt okunur incelendi. Gerçek veri `http://127.0.0.1:5175` üzerinde bulundu. İki localStorage ve iki IndexedDB kaydı, 640623 baytlık tam yedeğe alındı. Bu dosyanın SHA-256 değeri `47e0213033207db2ba96cb930c4d54b66276561f2d92524237b0d58807ec6510`.

Çalışma, kayıt noktası ve arşivdeki tasarımlar iki kayıt kanalından toplam 10 ayrı taşınabilir Design kopyasına çıkarıldı. Tam yedek geçmiş ve metaveriyi de içerir. JSON içe aktarıcıyla canlıya aktarmak için `portable-designs` altındaki dosyalar kullanılabilir. Diğer üç origin’de uygulama kaydı görülmedi. İnceleme mevcut tarayıcı profili ve belirtilen adreslerle sınırlıdır.

## Git ve herkese açık dosya denetimi

`.gitignore` bağımlılıkları, derleme çıktısını, Wrangler önbelleğini, özel yedekleri, tüm `artifacts`, `output` ve `tmp` dizinlerini, tasarım JSON’larını, ZIP/PDF dosyalarını ve yerel gizli ayarları dışarıda bırakır. Bu dosyalar diskte saklanır. Commit kimliğinde hesaba ait GitHub noreply adresi kullanılır.

Herkese açık kaynak dosyaları yerel font, lisans ve statik yanıt başlıklarıdır. Yayın denetleyicisi izin verilmeyen public veya build dosyasında ve Free dosya sınırı aşıldığında işlemi durdurur. Statik yanıtlarda MIME türü denetimi, referrer politikası ve çerçeve/nesne/base politikası uygulanır.

Kaynak, staged dosyalar ve derlenmiş dosyalarda sır taraması, kişisel dosya hariç tutmaları ve temiz checkout kontrolü sonuçları aşağıda güncellenir.

## Bağımlılık güvenlik bulguları

10 Kasım `npm audit` sonucu **4 bulgu**, bir moderate, bir high ve iki critical. Bu sayının test ve dolaylı bağımlılık yayılımını da içerdiği dikkate alınmalı. Ham sonuç `artifacts/deployment/npm-audit-before.json` içinde yerel saklandı.

- **Zod high**. Kurulu 3.x sürümü kaynak tüketimi uyarısı aralığında. Mevcut JSON girişleri 2.000.000 bayt, 30.000 düğüm ve 70 derinlik sınırıyla korunuyor. Doğrulama ziyaretçinin tarayıcısında yürür. Önerilen düzeltme 4.6.6+ ana sürümüne geçiştir ve eski Design dosyalarıyla regresyon incelemesi gerektirir. [Advisory](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5)
- **Vitest/tinypool critical ve mocker moderate**. Geliştirme/test zincirindedir. Uyarılar nesne prototipi üzerinden worker seçenekleri ve dev-server mock yönlendirmesiyle ilgilidir. Canlı statik çıktıya test sunucusu ve bu paketler yüklenmez. Önerilen otomatik düzeltme Vitest ana sürümünü değiştiriyor. [Tinypool advisory](https://github.com/advisories/GHSA-5gmw-xhrv-c9v3) · [Mocker advisory](https://github.com/advisories/GHSA-82fw-gwwq-j7x9)

Bu bulgular açık olarak raporlanıyor. Bağımlılık ana sürüm geçişi bu altyapı değişikliğinde uygulanmadı. Mevcut kilitlenmiş uygulama ve test sürümleriyle doğrulama yapıldı.

## Hesap bağlantısı ve canlı test durumu

| Kontrol | Durum |
| --- | --- |
| Yerel test, build ve Wrangler dry-run | PASS |
| Free plan dosya sınırları | PASS |
| Kişisel kaynak/tasarım ve tarayıcı kayıt yedeği | PASS, belirtilen profil/origin’ler |
| GitHub depo görünürlüğü | PRIVATE |
| GitHub ilk kaynak push’u | Bekliyor |
| Cloudflare giriş ve Free plan kontrolü | Kullanıcı girişi bekleniyor |
| GitHub–Cloudflare otomatik build bağlantısı | Bekliyor |
| Gerçek kalıcı HTTPS adresi | Oluşmadı |
| Canlı URL üzerinde 3D/2D/WebGL | UNVERIFIED |
| Canlı URL üzerinde JSON/PDF/CSV/ZIP | UNVERIFIED |
| Canlı kayıt, Undo/Redo ve F5 | UNVERIFIED |
| Hesapta rollback uygulaması | UNVERIFIED |

Cloudflare giriş ekranında oturum tamamlanınca Free plan ve yalnız bu depoya verilen GitHub izni doğrulanmalı. Ardından ilk deploy oluşturulup gerçek HTTPS adreste kabul listesi yürütülmeli. Yerel testler canlı test statüsüne dönüştürülemez.

## Ücret ve kapsam sonucu

Yapılandırma Cloudflare Free Static Assets ve ücretsiz `workers.dev` içindir. Statik trafik ücretsiz ve sınırsız, Free build kotası aylık 3000 dakikadır. Hesap girişine kadar kullanıcının planı doğrulanamaz. Ücretli hizmet etkinleştirilmedi. [Resmî statik ücretlendirme](https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/) · [Build kotası](https://developers.cloudflare.com/workers/ci-cd/builds/limits-and-pricing/)

Kaynak ve gerçek kayıt yedekleri alınarak yayın hazırlığı yapıldı. Gardırop algoritması, 3D geometri, kapak/çekmece sistemi, üretim dosyası mantığı ve uygulama arayüzü bu görevin değişiklik kapsamına alınmadı.
