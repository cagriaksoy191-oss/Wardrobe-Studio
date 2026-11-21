# Wardrobe Studio · doğrulanmış üretim tabanı

21 Kasım 2026 · GitHub, Cloudflare paneli, Linux build kaydı ve gerçek HTTPS yanıtları karşılaştırıldı. [Canlı uygulama](https://wardrobe-studio.cagriaksoy191.workers.dev/)

| Referans | Doğrulanan değer |
|---|---|
| GitHub `origin/main` | `5044f17fe6cb95ec51d12ae9f6a2537252793f25` |
| Son uygulama paketini ilk yayınlayan commit | `23c72df4d99fa781ad2242904929c19d053b0673` |
| Cloudflare build | `b8558118-d594-4f98-a615-aedc8d31288d` · GitHub kontrolü başarılı · Linux 358/358, build ve statik kabul geçti |
| Etkin Worker | `c352f36f-107a-4fc5-90cc-4464dcb8367b` · Ready · %100 trafik |
| Plan ve giriş noktası | Workers Free (panelde $0) · özel GitHub deposunun `main` dalı · Workers Static Assets |
| Önceki doğrulanmış Worker | `ceb5a259-89d7-48fb-a8a5-dbdac8f229b1` · WS-UX-011 ilk yayınındaki aynı statik paket |
| WS-UX-011 öncesi sürüm | `22f84d50-8c7f-4f04-b76b-4bac389b1a52` · farklı uygulama kodu · [WS-UX-011 yayın kaydı](WS_UX_011_PRODUCTION_RELEASE.md) |

`23c72df..5044f17` farkı altı Markdown belgesinden oluşur. Statik uygulama verisini tarayıcıda saklar. Wrangler dry-run API Worker, çalışma zamanı binding’i veya backend göstermedi. Test, arşiv ve geliştirme dosyaları dağıtıma girmez. Geri dönüş kararı için önce olayın hangi sürümde başladığını ve seçilen Worker’ın gerçekten farklı uygulama dosyaları sunup sunmadığını belirleyin. Geri alma işlemi açık kullanıcı onayı gerektirir. [GitHub main](https://github.com/cagriaksoy191-oss/Wardrobe-Studio/commit/5044f17fe6cb95ec51d12ae9f6a2537252793f25) · [Cloudflare build](https://dash.cloudflare.com/b76b247b22f0678a722cad37767e2b19/workers/services/view/wardrobe-studio/production/builds/b8558118-d594-4f98-a615-aedc8d31288d) · [Bakım kılavuzu](FINAL_MAINTENANCE_AND_AI_HANDOFF.md)

## HTTPS dosyaları

21 Kasım 2026, 17.49 TSİ. Her dosyanın HTTP 200 yanıt gövdesi temiz checkout’tan üretilen paketle byte ve SHA-256 düzeyinde aynı. `index.html` canlı kök adresten alındı. `_headers` dağıtım ayarı, canlı yanıttaki karşılıkları aracılığıyla kontrol edildi.

| Dosya | Bayt | SHA-256 |
|---|---:|---|
| `assets/browser-C_pOKF9d.js` | 9393 | `cc0045d124115d5a184e8a6c362b640766bf60c77966f8fa2a0834cf09c40e6e` |
| `assets/html2canvas.esm-QH1iLAAe.js` | 202379 | `061c08e50c0dc57b8d5e6531f0b8237a52a68b233260d49ab2f2c2906ad112c4` |
| `assets/index-CgKGgGEp.css` | 57977 | `bb6eca79772b85c584456de01237de91147524e517db79e674ed93577a5fd743` |
| `assets/index-Diyqlp_9.js` | 1909185 | `6e488049353d2f48216c9557f8a391f0620b7bcce1b65281a35a89436c468580` |
| `assets/index.es-BxbypAmG.js` | 159803 | `55c25969aab716e91d94608f988ce8a31165f30e256c69b30df587f001023777` |
| `assets/pdfWriter-DNobulYt.js` | 385445 | `f0f8edb94d960eab4e31160083f42b08e12ec7a9b173e79f73253c998aa95fcd` |
| `assets/purify.es-CAi2OJFm.js` | 30469 | `8e143ee7bcdf076d62676183aacc62568c9adb8042c57d4fef7d62e1ca7c345a` |
| `assets/zipWriter-g1kT6Zw6.js` | 538 | `63db7aeeda7c77f41a5a96868a441d7bccebbcabea94ad89a835521ded0dbd69` |
| `fonts/NotoSans-Regular.ttf` | 569208 | `b85c38ecea8a7cfb39c24e395a4007474fa5a4fc864f6ee33309eb4948d232d5` |
| `fonts/OFL.txt` | 4377 | `0dab92d0544f7b233403f14b84a663bdbfa746982eda629e7f4f9ffe1b036feb` |
| `index.html` | 562 | `153d05e6d138a83c863054fa58e99e642217d906e6fcfc0e5da70616b1cb9506` |
| `THIRD_PARTY_NOTICES.txt` | 1231 | `3990b3526f7491d1d116831ab706212488681ce81e6b4f2110ded2457c5e71e1` |

## Kanonik veri

`POST_D3_BASELINE_001` tabanıyla **12/12 SHA-256**, **338 fiziksel parça** ve asimetrik 25/4 modelinde **20/20 sıfır hacimli nominal panel birleşimi**. Parça kimlikleri ve kodlar, kesim ölçüleri, panel koordinatları ve malzeme/yüzey toplamları aynı. Düz, beşgen, kör ve asimetrik modeller sırasıyla **69/94/81/94** parça ve **25/41/35/41** teknik pafta üretti. Eski `PRE_D3_BASELINE_001` referansları sürüm geçmişinde korunur. [Kanonik regresyon](tests/manufacturing-download.test.ts) · [Mühendislik değişmezleri](ENGINEERING_INVARIANTS.md)

| Model | Veri | SHA-256 |
|---|---|---|
| Düz | Design | `e1c33d152db9328e304c4d030d049fda84582aaac567eadb56cea7656e6491b0` |
| Düz | ResolvedModel | `3ad8406d135e56a7fa69bb3723e91311eac15a940af8245f4f0ee23e80cd8518` |
| Düz | ProductionPackage | `3abf32fc5412f844c160410aaccfece4bb7f9709f2024faf6313fbd9956d5f18` |
| Beşgen 18/8 | Design | `a4168587a1e2535b5ac374e443979ac449543d2d11d117f562a79f390a8e9a7e` |
| Beşgen 18/8 | ResolvedModel | `0989f474a4e0c645760bddce2444adcfcf47ae728f2896f5ae38f7ea227fd260` |
| Beşgen 18/8 | ProductionPackage | `0064548c147a93d8c8444d816d9c71e8a041bac5693b3661430a4e1127d33392` |
| Kör köşe | Design | `a313f6b547d93dfe50889a7edf6b60270d54a9b43b1eab99a4514a2051de00b2` |
| Kör köşe | ResolvedModel | `095afe19236b5444dcc6932cdb6c17360508a3ea3602f3674a2d61d87bf0aeb0` |
| Kör köşe | ProductionPackage | `0d90050032153569c03819e416746210543689ecb67d806abb756c036541f2e1` |
| Asimetrik 25/4 | Design | `b54123c5b527fc79d492525621734f5287f67deabda964736aeb92284637f854` |
| Asimetrik 25/4 | ResolvedModel | `65f964b117ba69d454595131f49b8cf4f517c760813549e32aa4ecc9416d345c` |
| Asimetrik 25/4 | ProductionPackage | `cb1c61c776967d57a154ec801c09f27886c3c252df3c8fa837a6978b1492b4f7` |
