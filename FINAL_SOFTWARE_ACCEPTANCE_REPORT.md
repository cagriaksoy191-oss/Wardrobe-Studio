# Wardrobe Studio · nihai yazılım kabulü

**SOFTWARE_RELEASE_ACCEPTED** · 21 Kasım 2026. Doğrulanan uygulama kapsamı tamamlandı ve yazılım bakım aşamasına alınabilir. **PHYSICAL_PRODUCTION_VALIDATION_PENDING** · WS-UX-001, WS-UX-002 ve WS-UX-003 açık. [Fiziksel kabul deneyleri](FINAL_OPEN_RISKS_AND_PHYSICAL_VALIDATION.md)

Canlı sürüm GitHub `main` `5044f17fe6cb95ec51d12ae9f6a2537252793f25`, Cloudflare build `b8558118-d594-4f98-a615-aedc8d31288d` ve Worker `c352f36f-107a-4fc5-90cc-4464dcb8367b` ile doğrulandı. Worker Ready, %100 trafik ve Workers Free. Canlı 12 dosyanın tümü onaylı statik paketle bayt düzeyinde eşleşti. [Canlı uygulama](https://wardrobe-studio.cagriaksoy191.workers.dev/) · [Üretim tabanı, SHA-256 ve geri dönüş](FINAL_PRODUCTION_BASELINE.md)

## Otomatik kabul ve güvenlik

| Kontrol | Sonuç |
|---|---|
| Temiz bağımlılık kurulumu | `npm ci` geçti. Node 24.16.0. |
| Uygulama testleri | Windows’ta 23 dosyada 358/358, etkin Cloudflare Linux build’inde 358/358. CI ile `--maxWorkers=2 --testTimeout=30000`. |
| Odaklı regresyon | 5 dosyada 110/110. Geometri, indirme kapıları, hareket güvenliği, JSON uyumluluğu ve WebGL kaynak sahipliği. |
| Derleme ve paket | TypeScript, Vite, `deploy:check` ve Wrangler 4.160.0 dry-run geçti. 13 statik dosya, 3.330.741 bayt. Paket ve tek dosyalar Free sınırları içinde. |
| Bağımlılık güvenliği | `npm audit` ve `npm audit --omit=dev` sıfır bilinen güvenlik bulgusu. |
| Kanonik geometri | 338 fiziksel parça, 12/12 `POST_D3_BASELINE_001` imzası ve 20/20 nominal yüzey teması. Teknik pafta sayıları ve dışa aktarılan dosyaların yapısı doğrulandı. |

Ana JS paketi yaklaşık 1,91 MB ham boyutta ve bilinen Vite boyut uyarısı sürüyor. Zod’da Rollup’un kaldırdığı saf işlev yorumları görüldü. Dağıtım statik. Canlı cevaplarda `nosniff`, `strict-origin-when-cross-origin` ve CSP’nin `frame-ancestors`, `object-src`, `base-uri` kuralları kontrol edildi. Çıktı yüzeyinde CSV formül öneklerinin kaçışlandığı ve SVG metninin XML olarak kaçışlandığı doğrulandı. Statik pakette denetim testlerinin QA işaretleri bulunmadı. Bu güvenlik değerlendirmesi uygulama ve paket yüzeyine odaklandı. [CSV kodu](src/core/production/csvExport.ts) · [Teknik paftalar](src/core/production/technicalSheets.ts)

## Gerçek tarayıcı kabulü

Brave’de gerçek HTTPS adresi, ayrı profiller ve sentetik tasarımlar kullanıldı. 390 × 844 görünüm Chromium viewport emülasyonuyla ölçüldü. Canlı oturumlarda konsol hatası ve WebGL bağlam kaybı gözlenmedi.

| Akış | Doğrulanan kapsam |
|---|---|
| Yeni tasarım ve düzenleme | Yeni düz ve L model, oda yüksekliği, L modelinde A’ya raflı ve B’ye çekmeceli bölme ekleme. B bölmesinin sabit genişliği 600→580 mm düzenlendi. Büyük L’de seçili rafları toplu düzenleme ve Geri Al/Yinele. |
| 3D, 2D ve sunum | 3D, 2D A/B, üst plan, sürükleyerek kamera hareketi ve sıfırlama. LED iki yönde değiştirildi. Sunum/Düzenleme üç kez çevrildi ve sahne görseli incelendi. |
| Seçim | Tek seçim, Ctrl ile ekleme, Shift ile çıkarma, iki yönde kutu sürükleme, 130 hücre, boş kutu, Escape iptali ve seçim temizliği. Salt seçim Design JSON’u değiştirmedi. |
| Hareket | Menteşeli köşe kapağı açma/kapama, 12,8° çarpışma sınırı, sürgünün ters hareketi, çekmece hareketi ve 86 mm'de açık kalan çekmece uyarısı. WS-UX-009a tek sürgüyü ve ilgili çekmeceleri güvenli sırayla kapattı. Ayrı denemede iptal doğrulandı. |
| Kayıt ve dosya | Manuel kayıt, F5, çalışma kopyası ve checkpoint’in IndexedDB ile localStorage eşitliği. İzole IndexedDB açma hatasında yerel yedekten geri yüklendi. JSON içe/dışa aktarma, adlandırılmış sürüm ve arşiv, A/B karşılaştırması, aynı tasarım kimliğinde farklı içerik doğrulandı. Eski Design v1 açıldı. Bozuk ve desteklenmeyen JSON reddedildi, çalışma kopyası korundu. |
| Düz model çıktısı | CSV’de 69 benzersiz parça satırı. ZIP 29 girdi ve 25 SVG, başarılı CRC, iç CSV dış CSV ile bayt eşit ve iç Design JSON aynı. 25 sayfalık A3 PDF, SVG ve yazdırılabilir HTML. |
| Fiziksel P0 çıktıları | Üç modelde panel ve önizlemede tam CSV/ZIP kilitli. Gerçek tıklama indirme üretmedi. Tanısal PDF/SVG/HTML indirildi ve damgaları doğrulandı. Beşgen 41, kör köşe 35, asimetrik 41 sayfa. |
| Dar ekran ve klavye | 390 px’de ana menüler, erişim uyarısı, üretim paneli, önizleme, dikey kaydırma ve kilitler. Yatay taşma 0 px. Escape önizlemeyi kapattı, odak döndü. Tanısal PDF düğmesinde Tab odağı görünür. Bozuk JSON uyarısı çalışma kopyasını korudu. |

WS-UX-011 için aynı kaynak ağacından, dağıtım kapsamı dışındaki yerel QA yapısında **20 adet 63/64/65 sınır kontrolü** ve aynı sırada **130 seçim kimliği** doğrulandı. Sabit 64 hücreli modelde yedi seçim/temizleme döngüsünde geometriler 805, WebGL programları 23 olarak sabit kaldı. Eşik geçişlerinde bırakılan çizgi geometrileri bir kez temizlendi. Yerel önizlemede uygulama dışı `favicon.ico` HTTP 404 kaydı görüldü. Yaklaşık %16 panel p95 iyileşmesi önceki Radeon 610M kanıtıdır. [WS-UX-011 yayın kanıtı](WS_UX_011_PRODUCTION_RELEASE.md)

## Korunan yazılım ve üretim davranışı

- **MS-EXPORT-001** · Tam CSV/ZIP gerçek kullanıcı eyleminde etkin tasarım ve sürüme göre yetkilendirilir. Bekleyen ZIP, aktif tasarım veya adlandırılmış sürüm değişirse geçersizleşir. `review + unverified` tasarımda uyarılı indirme devam eder. Kritik geometri güvenli biçimde reddedilir. [Üretim raporu](MS_EXPORT_001_PRODUCTION_RELEASE.md) · [Regresyon testleri](tests/manufacturing-download.test.ts)
- **D3-BASELINE-001** · 25/4 modelindeki düzeltilmiş 20 birleşim sıfır hacimli nominal panel teması. [Üretim raporu](D3_BASELINE_001_PRODUCTION_RELEASE.md) · [Birleşim testleri](tests/exact-panel-centering.test.ts)
- **WS-UX-009a** · Doğrulanmış tek kanat ve ilgili çekmeceler kapsamında üretimde. Desteklenmeyen engel dizilerinde manuel yöntem sürer. [Üretim raporu](SAFE_MOTION_RECOVERY_PRODUCTION_RELEASE.md)
- **WS-UX-011** · **FIXED_AND_PRODUCTION_BROWSER_VERIFIED**, doğrulanan büyük model kutu seçimi kapsamında. [Üretim raporu](WS_UX_011_PRODUCTION_RELEASE.md)
- **ContactShadows** · `ddfc3a5` kaynak ömrü düzeltmesi üretimde. Çözünürlük 512 ve blur 1,9. İki render target, düzlem ve üç materyalin sahipliği, tek sefer bırakma ve paylaşılan nesnelerin korunması odaklı testlerde doğrulandı. MIT bildirimi canlı dosyaya dahil. Önceki iki fiziksel GPU’nun görsel eşdeğerlik ve kaynak ömrü kanıtları korundu. Kısa canlı geçişler tekrarlandı. Resmî performans sonucu `RESEARCHED_NOT_READY`, yayın açık mühendislik risk kabulüyle yapıldı. [WebGL raporu](WEBGL_CONTACT_SHADOWS_PRODUCTION_RELEASE.md)

Kabul artefaktları yerel `artifacts/final-software-acceptance/` dizininde. `evidence-index.json` otomatik test, gerçek HTTPS, kanonik veri, canlı tarayıcı ve dosya kanıtlarının SHA-256 listesini içerir. Kişisel kayıtlar ve normal tarayıcı profilleri kullanılmadı. Kaynak kod ve geçmiş raporlar olduğu gibi korundu. İzole dal yalnız dokümantasyon teslimidir. GitHub `main` ve Cloudflare üzerinde bu denetim kapsamında değişiklik yapılmadı. [Bakım ve AI devri](FINAL_MAINTENANCE_AND_AI_HANDOFF.md)
