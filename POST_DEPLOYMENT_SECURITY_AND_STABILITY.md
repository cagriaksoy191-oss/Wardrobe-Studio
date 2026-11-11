# Wardrobe Studio yayın sonrası güvenlik ve stabilite raporu

11 Kasım 2026 · Yerel bakım dalı `maintenance/security-review`

Canlı site, denetim boyunca `main` dalındaki `597407b9caa7ab2d09f4d22a5c8d33fcf64359d3` yayınının dosyalarını sundu. Bakım dalında Zod ve Vitest güncellendi. Güncel npm denetiminde adayın tam bağımlılık ağacı ve üretim ağacı **0 bulgu** verdi. Aday yerelde doğrulandı ve üretim onayı bekliyor. [Canlı site](https://wardrobe-studio.cagriaksoy191.workers.dev/) · [Özel GitHub deposu](https://github.com/cagriaksoy191-oss/Wardrobe-Studio) · [Mevcut Cloudflare build kaydı](https://dash.cloudflare.com/b76b247b22f0678a722cad37767e2b19/workers/services/view/wardrobe-studio/production/builds/186fe621-e7ad-49c0-99e4-5742f4aec16e)

## Başlangıç ve son doğrulama

| Kontrol | Canlı sürümün yerel başlangıç kopyası | Bakım dalı adayı |
| --- | --- | --- |
| `npm test -- --run` | 13 dosyada 213/213 | 14 dosyada 222/222 |
| TypeScript ve Vite 6.4.5 üretim derlemesi | Başarılı | Başarılı |
| `npm audit` | 4 paket: 1 yüksek, 2 kritik, 1 orta | 0 |
| `npm audit --omit=dev` | 1 yüksek, Zod | 0 |
| Statik paket ve Wrangler dry-run | 12 dosya, 3.266.109 bayt | 12 dosya, 3.306.588 bayt |
| En büyük dosya | 1.846.487 bayt | 1.886.966 bayt |

Node 24.16.0 ve Cloudflare build ortamının kullandığı npm 10.9.2 ile kilit dosyasından temiz kurulum başarılı oldu. Aynı ortam sürümleriyle `npm test -- --run --maxWorkers=2 --testTimeout=30000 && npm run build && npm run deploy:verify` yerelde 222/222 geçti. Wrangler dry-run varlıkları okudu ve binding olmadığını bildirdi. Cloudflare’ın gerçek Linux build’i ancak onaylanmış `main` gönderiminden sonra doğrulanabilir.

Vite’ın mevcut büyük parça uyarısı sürüyor. Zod 4 paketindeki iki yorum için Rollup açıklama konumu uyarısı çıktı. Derleme bu yorumları temizleyip başarıyla tamamlandı. Ana JS yaklaşık 40,5 kB, gzip karşılığı yaklaşık 14,8 kB büyüdü. CSS dosyası ve hash’i aynı kaldı.

## Güncel güvenlik bulguları

`npm ls zod vitest tinypool @vitest/mocker` başlangıçta Zod **3.25.76**, Vitest **3.2.7**, tinypool **1.1.1** ve `@vitest/mocker` **3.2.7** gösterdi. Dört npm paket kaydı, beş ayrı güvenlik duyurusuna karşılık geliyor. Vitest’in kritik derecesi tinypool bağımlılığını da yansıtıyor.

| Paket ve derece | Etkilenen ve düzeltilen sürümler | Projedeki koşul ve geçiş |
| --- | --- | --- |
| **Zod, yüksek** | `<4.6.6` etkilenir. İlk düzeltilen sürüm **4.6.6**. | Ana tarayıcı paketinde. Büyük koleksiyonların doğrulanması belleği tüketebilir. Wardrobe Studio’da dışarıdan bir JSON’un kullanıcı tarafından dosya olarak açılması veya AI köprüsüne verilmesi gerekir. Bayt, düğüm ve derinlik sınırları maruziyeti azaltır. Aday **4.6.7** kullanıyor. [GHSA-mrhx-c7xc-m3w5](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5) |
| **Vitest, npm denetiminde kritik** | Doğrudan yönlendirme duyurusu `>=2.1.0 <4.1.11` ve `>=5.0.0-beta.1 <5.0.0-rc.2` aralıklarını kapsar. Düzeltmeler **4.1.11** ve **5.0.0-rc.2**. Eski bağımlılıkları da etkilenir. | Node test çalıştırıcısı ve CI. Aday **4.1.12** ile iki mocker düzeltmesini alıyor ve tinypool’u bağımlılık ağacından çıkarıyor. Vite 6.4.5 ve Node 24 korunuyor. [GHSA-82fw-gwwq-j7x9](https://github.com/advisories/GHSA-82fw-gwwq-j7x9) |
| **tinypool, kritik** | Bir duyuru `<=2.1.0`, diğeri `<2.1.2` için. Düzeltmeler sırasıyla **2.1.1** ve **2.1.2**. | Node worker zinciri. Uygulamada prototip kirlenmesine yol açabilen ayrı bir yol ve ilgili worker kullanımı varsa test veya CI sürecinin yetkileriyle kod çalıştırılabilir. Loopback kullanımı tek başına bu önkoşulu ortadan kaldırmaz. Adaydan paket tamamen çıktı. [GHSA-5gmw-xhrv-c9v3](https://github.com/advisories/GHSA-5gmw-xhrv-c9v3) · [GHSA-85c8-ppgw-ccpr](https://github.com/advisories/GHSA-85c8-ppgw-ccpr) |
| **`@vitest/mocker`, orta** | Dosya okuma uyarısı `>=2.1.0 <4.1.11` ve `>=5.0.0-beta.1 <5.0.0-rc.2`. Kod enjeksiyonu uyarısı `>=2.1.0-beta.7 <4.1.12` ve `>=5.0.0-beta.1 <5.0.3`. **4.1.12** iki uyarıyı da kapsar. | Risk, savunmasız mock eklentisinin ulaşılan bir geliştirme sunucusunda kullanılmasıyla oluşur. Bu proje Node test ortamı kullanıyor. Uygulama Vite yapılandırmasında bağımsız mocker eklentisi veya Vitest Browser Mode yok. Adayda Vitest ile eşleşen **4.1.12** kurulu. [GHSA-82fw-gwwq-j7x9](https://github.com/advisories/GHSA-82fw-gwwq-j7x9) · [GHSA-qxg6-89mg-rqv8](https://github.com/advisories/GHSA-qxg6-89mg-rqv8) |

Vite’ın derlenen modül listesi başlangıçta Zod v3’ü, adayda Zod v4’ü ana JS içinde gösterdi. Vitest, tinypool ve mocker iki üretim paketinde de bulunmadı. Bu bulgular arasında canlı tarayıcıyı etkileyen uyarı Zod’a ait. JSON yerelde işlendiği için bu uygulamada risk tarayıcının kullanılabilirliğine yansır. Test zinciri uyarıları eski geliştirici ve CI kurulumlarında değerlendirilmelidir. Adaydaki sıfır sonuç, denetim tarihinde bildirilen paket açıklarıyla sınırlıdır.

`package.json` dosyasında yalnız Zod ve Vitest sürümleri sabitlendi. Kilit dosyası Vitest ailesini ve bağlı test araçlarını güncelledi. tinypool ve vite-node artık kurulmuyor. Vitest 4.1.12, npm’in önerdiği 5.1.0’a geçiş gerektirmeden ilgili düzeltmeleri içeriyor. Uygulama kaynakları, şema tanımı, TypeScript, Vite ve Wrangler yapılandırmaları başlangıçla eşleşiyor.

## JSON, şema ve kayıt uyumluluğu

- Dosya seçici okumadan önce 2.000.000 bayt sınırını uygular. Normal JSON ve AI önizlemesi `parseDesignJson` ile UTF-8 boyutu, 30.000 düğüm ve 70 derinlik sınırından geçer. Ardından Zod ve tasarım yapısı denetimi çalışır. Normal içe aktarma ayrıca ölçü dağıtımı geçersizse çalışma kopyasına uygulamaz.
- `designSchema.ts` şema v1’i ve eksik cephe, birleşim ve malzeme alanlarının varsayılanlarını korur. Eski kayıtta bulunmayan konstrüksiyon modu aynı anlamı taşır. Zod 4, v3’ün sayı düzeyinde kabul ettiği sonsuz değeri ve güvenli tamsayı aralığı dışındaki tamsayıları reddeder. Bu fark temel doğrulayıcılarla gözlendi. Geçerli fiziksel ölçülere yönelik şema değişikliği yapılmadı. [Zod 4 değişiklikleri](https://zod.dev/v4/changelog)
- localStorage ve IndexedDB’den oturum yüklenirken çalışma, checkpoint ve geçmiş tasarımları ayrı ayrı normalleştirilir. Adlandırılmış arşiv okuma ve yazmada aynı şemayı kullanır. Depolama anahtarları, oturum sürümü ve arşiv formatı korundu. Dosya ve AI metin sınırları depolamadaki bütün oturum zarfına uygulanmaz. Yamalı Zod ve mevcut kurtarma davranışı bu yol için önem taşır.
- Oluşturma şablonları ve Undo/Redo bellekteki tipli tasarımları kullanır. Düzenleme komutları ölçüleri yuvarlayıp tasarımı doğrular. Çözücü kendi girişinde düzen, köşe, ölçü ve cephe yapısı kurallarını kontrol eder. AI önizlemesi dış servise bağlanmaz ve çalışma kopyasını uygulama işlemi olmadan değiştirmez.

Önceki sentetik düz, beşgen, kör ve asimetrik JSON dosyaları eski ve yeni bağımlılıklarla karşılaştırıldı. Normalize edilen Design, çözülmüş model ve sabit tarihli üretim verisinin hash’leri dört örnekte de eşleşti. Parça sayıları sırasıyla 69, 94, 81 ve 94. Aynı örnekler AI önizlemesinde ve arşiv okuyucusunda açıldı.

Dokuz yeni regresyon dört tasarımın JSON ve AI turunu, v1 varsayılanlarını ve eski arşivi, hatalı iç alanın bildirilmesini ve üç giriş sınırını kapsıyor. Geçersiz girişlerin çalışma kopyasını koruduğu doğrulandı. Mevcut 213 test de başarılı. [Yeni regresyonlar](tests/security-json-compatibility.test.ts)

## İzole tarayıcı sonuçları

| Canlı HTTPS akışı | Sonuç |
| --- | --- |
| 3D ve WebGL | Three.js r176 sahnesi çizildi. |
| A ve B cepheleri, üst plan | Üç görünüm açıldı. |
| Yeni örnek | Hazır örneklerden asimetrik beşgen L tasarımı açıldı. |
| Bölme ölçüsü, Geri Al ve Yinele | 920 → 900 → 920 → 900 mm. |
| Manuel kayıt ve F5 | 900 mm bölme ölçüsü yenilemeden sonra geri geldi. |
| Kapak ve çekmece | Açma komutları çalıştı ve sahne değişti. Köşe kapağının mevcut çakışma sınırı gösterildi. |
| Sunum Modu | Mod açıldı ve düzenleme moduna dönüldü. |
| JSON, üretim ön kontrolü | Eski sentetik düz tasarım içe alındı ve dışa verildi. Üretim kontrolü 0 kritik geometri hatası ve 0 erişim engeli verdi. |
| PDF, CSV, ZIP | PDF 25 yatay A3 sayfa. CSV 69 parça ve 25 sütun. ZIP CRC doğru, 29 girdi ve 25 geçerli SVG var. ZIP içindeki CSV ve Design JSON ayrı çıktılarla eşleşti. |

Aday testi için önce eski derleme `127.0.0.1:4187` adresinde açıldı. 3000 mm checkpoint ve adlandırılmış sürüm iki depoya yazıldı. 3100 mm çalışma kopyası ve 3200 mm Yinele adımı kaydedildi. Aynı adres aday derlemeye geçirildi ve yenilendi. Çalışma 3100 mm açıldı, Yinele 3200 mm’ye çıktı, iki Geri Al işlemi 3100 ve 3000 mm’ye döndü. Eski arşivden indirilen JSON yine 3000 mm idi.

Adayda geçerli ve geçersiz AI JSON önizlemeleri çalıştı, çalışma kopyası korundu ve arşivden indirilen dosya normal seçiciyle açıldı. 3D sahne ve üretim ön kontrolü geçti. İndirilen PDF, CSV ve ZIP içeriği aynı kabul kurallarıyla doğrulandı. Canlı ve yerel kontrollerde yakalanan konsol hatası sayısı sıfır. [Yerel test kanıtları](artifacts/maintenance/security-review/)

## Canlı sitenin ve verilerin korunduğuna ilişkin kanıt

- Başlangıç ve bitişte uzak `main` SHA’sı `597407b9caa7ab2d09f4d22a5c8d33fcf64359d3`. GitHub, bu commit’in **Workers Builds: wardrobe-studio** kontrolünü başarılı gösteriyor. Bu görevde Cloudflare ayarları ve üretim dalı üzerinde yazma işlemi yapılmadı.
- Sertifika doğrulamasıyla alınan ana HTML, yedi JS, CSS, PDF fontu ve lisans yerel başlangıç derlemesiyle eşleşti. Önceki ve son HTTPS yanıtlarının bayt hash’leri ve güvenlik başlıkları aynı. Ana JS dosyası `index-D02jioWt.js`, SHA-256 `530480f058818843b1bc540ae8bfd5a8166dc665661b0883ac538461fea5dbc6`.
- Canlı yanıtlarda `nosniff`, `strict-origin-when-cross-origin` ve çerçeve, nesne ve base öğesini sınırlandıran CSP görüldü. `/.env`, `/.git/config`, `/package.json`, `/wrangler.jsonc`, `/node_modules/zod/package.json`, yedek aracı, `/.private/` ve `/backups/` ana SPA HTML’ini döndürdü. Yanıt baytları ana HTML ile eşleşti.
- Git dosya listesi ve ignore kuralları denetlendi. Yedekler, tasarımlar, `artifacts`, `dist`, geçici dosyalar ve yerel gizli ayarlar kapsam dışında. Kaynak ve iki üretim paketindeki kimlik bilgisi kalıbı taraması 0 eşleşme verdi. Kaynakta `import.meta.env` kullanımı yerel font yolu ve geliştirme ölçümüyle sınırlı. Wrangler yalnız izin verilen statik dosyaları alır.
- 20 özel yedek dosyasının ve 116 mevcut yerel JSON dosyasının başlangıç ve bitiş hash’leri eşleşti. Gerçek kullanıcı profilinin IndexedDB, localStorage, checkpoint veya sürüm arşivi üzerinde işlem yapılmadı. Tarayıcı kayıt denemeleri izole profilde ve sentetik tasarımlarla yapıldı.
- Geçici önizlemeler yalnız `127.0.0.1:4187` üzerinde dinledi. İki süreç de durduruldu. Bitişte kontrol edilen 5173, 5175, 8787, 4173 ve 4187 portlarında dinleyici yoktu.

## Onay ve sonraki yayın akışı

Canlı sürüm, aday yayına alınana kadar Zod 3.25.76 içerir. Bakım dalındaki npm denetiminde açık paket bulgusu kalmadı. Gerçek Cloudflare build’i ve yeni sürümün canlı adreste doğrulanması, kullanıcı onayı sonrasındaki adımlardır. Üretimde deneme amaçlı rollback veya ücretli hizmet etkinleştirmesi yapılmadı.

1. Yeni görev için güncel `main` üzerinden ayrı dal açılır. Değişiklikler, testler, statik derleme ve izole tarayıcı kontrolü bu dalda tamamlanır.
2. Git diff’i, kanıtlar ve bilinen sınırlamalar kullanıcıya sunulur. Birleştirme ve üretim gönderimi için açık onay alınır.
3. Onay sonrasında güncel `main` kontrol edilir, incelenen dal birleştirilip gönderilir. Mevcut Cloudflare Builds bağlantısının build ve deploy kayıtlarında commit doğrulanır.
4. HTTPS adresi ve temel kullanıcı akışları tekrar kontrol edilir. Gerekirse Cloudflare Deployments ekranından bilinen çalışan sürüme dönülür ve Git’e düzeltme kaydedilir.

Bu akış mevcut Git ve Cloudflare Builds ile yürür. [Yayın rehberi](DEPLOYMENT_GUIDE.md) · [Cloudflare geri alma](https://developers.cloudflare.com/workers/versions-and-deployments/rollbacks/)
