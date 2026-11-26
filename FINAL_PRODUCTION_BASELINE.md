# Wardrobe Studio · doğrulanmış üretim tabanı

26 Kasım 2026 · GitHub, Cloudflare Workers Builds ve gerçek HTTPS yanıtları karşılaştırıldı. [Canlı uygulama](https://wardrobe-studio.cagriaksoy191.workers.dev/) · [Aşama 3 yayın raporu](PHASE3_UX_PRODUCTION_RELEASE.md)

| Referans | Doğrulanan değer |
|---|---|
| Uygulama paketini yayınlayan `main` commit'i | `185dd485a7a04c305e9997fd497e3cac67706bb1` (uygulama kodu: `dc488263a2d34802c79fdfc10cc98b2eb5e8ab81`, `53fe48c..185dd48` fast-forward) |
| Cloudflare build (`185dd48`) | `825003a1-dd83-4669-bf2e-8afda794b76d` · GitHub kontrolü `139988287957` başarılı · Linux 506/506 test, build ve statik doğrulama geçti |
| Doğrulanan uygulama Worker'ı | `c2893096-a64b-4df2-ba7e-38db2a799140` · Ready · %100 trafik |
| Plan ve giriş noktası | Workers Free (panelde $0) · özel GitHub deposunun `main` dalı · Workers Static Assets (`0` binding) |
| Önceki üretim tabanı (geri alma referansı) | `53fe48c82ff312268218173bdaf2e936ecaf9e45` (etiket: `release/baseline-pre-phase3-53fe48c`) · Worker `1f8b5159-ddc3-4baa-a4be-d4f3e3a8998e` · Build `4aaa50ad-14b7-4fc2-9a29-3290d26b4a14` |
| Daha önceki tarihsel taban (21 Kasım 2026) | `5044f17fe6cb95ec51d12ae9f6a2537252793f25` · Worker `c352f36f-107a-4fc5-90cc-4464dcb8367b` · [WS-UX-011 yayın kaydı](WS_UX_011_PRODUCTION_RELEASE.md) |

Statik uygulama verisini tarayıcıda (`localStorage` + `IndexedDB`) saklar. Wrangler dry-run API Worker, çalışma zamanı binding'i veya backend göstermedi. Test, arşiv ve geliştirme dosyaları dağıtıma girmez. Bu belge güncellendikten sonra salt Markdown commit'i de Workers Builds `*` izleme yoluyla aynı uygulama paketini dağıtabilir. [GitHub uygulama commit'i](https://github.com/cagriaksoy191-oss/Wardrobe-Studio/commit/185dd485a7a04c305e9997fd497e3cac67706bb1) · [Cloudflare build](https://dash.cloudflare.com/b76b247b22f0678a722cad37767e2b19/workers/services/view/wardrobe-studio/production/builds/825003a1-dd83-4669-bf2e-8afda794b76d) · [Bakım kılavuzu](FINAL_MAINTENANCE_AND_AI_HANDOFF.md)

## HTTPS dosyaları (`185dd48` / `dc48826`)

26 Kasım 2026, 17.53 TSİ (14:53 UTC). 9 ikili JS/CSS/font dosyası temiz `npm ci` derlemesiyle bayt ve SHA-256 düzeyinde birebir, 3 metin dosyası (`index.html`, `fonts/OFL.txt`, `THIRD_PARTY_NOTICES.txt`) LF-normalleştirilmiş olarak %100 eşleşti. `_headers` canlı HTTP başlıklarıyla doğrulandı (`nosniff`, `strict-origin-when-cross-origin`, `frame-ancestors 'none'`).

| Dosya | Canlı Bayt | Canlı SHA-256 |
|---|---:|---|
| `assets/browser-BNKhCVn9.js` | 9393 | `5fcb1b10a6f1c92462eeecf5589a61dcace1afe78d9ad4ff27ec2876d997fdfa` |
| `assets/html2canvas.esm-QH1iLAAe.js` | 202379 | `061c08e50c0dc57b8d5e6531f0b8237a52a68b233260d49ab2f2c2906ad112c4` |
| `assets/index-B6dbtL1N.css` | 77586 | `851388561d71e53c561d5b956a81c9bd37ba604b1cce3a9efcf9d3b174b61e4f` |
| `assets/index-CJoDrtKZ.js` | 2005309 | `3eef1d54a37be63a2f3de6295ccd78fddeea009e3f244ce35fb0097ae7a266be` |
| `assets/index.es-DKj5XYfw.js` | 159803 | `b61435731679184950bbe08c462dffb5af37dda6c361e026b02f925db3031b7b` |
| `assets/pdfWriter-DhSAGxat.js` | 385609 | `0af682e671796051b0eb9c31d46b72a8418efcd5060b9cbb46bc3ce4f600baca` |
| `assets/purify.es-CAi2OJFm.js` | 30469 | `8e143ee7bcdf076d62676183aacc62568c9adb8042c57d4fef7d62e1ca7c345a` |
| `assets/zipWriter-BHGGJdKs.js` | 538 | `4ff6c2548b76989cfe5fe1ec92a20f411438424439a8bb5083a80f891376a62f` |
| `fonts/NotoSans-Regular.ttf` | 569208 | `b85c38ecea8a7cfb39c24e395a4007474fa5a4fc864f6ee33309eb4948d232d5` |
| `fonts/OFL.txt` | 4377 | `0dab92d0544f7b233403f14b84a663bdbfa746982eda629e7f4f9ffe1b036feb` |
| `index.html` | 562 | `9650dff04c127b141a458042eea3430903ae0ee8d393b42c1d75400556bea06f` |
| `THIRD_PARTY_NOTICES.txt` | 1231 | `3990b3526f7491d1d116831ab706212488681ce81e6b4f2110ded2457c5e71e1` |

## Kanonik veri

`POST_D3_BASELINE_001` tabanıyla **12/12 SHA-256**, **338 fiziksel parça** ve asimetrik 25/4 modelinde **20/20 sıfır hacimli nominal panel birleşimi** korundu. Düz, beşgen, kör ve asimetrik modeller sırasıyla **69/94/81/94** parça ve **25/41/35/41** teknik pafta üretir; `WS-UX-001`, `WS-UX-002` ve `WS-UX-003` CSV/ZIP kilitleri etkindir. [Kanonik regresyon](tests/manufacturing-download.test.ts) · [Mühendislik değişmezleri](ENGINEERING_INVARIANTS.md)

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
