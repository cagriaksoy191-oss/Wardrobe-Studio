# D3-BASELINE-001 yerel kabul ve yayın kararı

**READY_FOR_RELEASE_REVIEW** · 15 Kasım 2026

| Kabul alanı | Sonuç |
| --- | --- |
| Bağımsız başlangıç ölçümü | 20 pozitif kesişim, 133.812,5 mm³. Tarihsel kanıttaki 20 çift ile eşleşti. |
| Gerçek aday çözümü | 20/20 yüzey teması, sıfır pozitif hacim. Kesim ve kimlikler eşit. |
| Geniş geometri matrisi | 40/40 kurgu, sıfır yapısal penetrasyon, doğrudan yüzey ve kesim kontrolleri. |
| Kanonik geometri | 69 + 94 + 81 + 94 = 338. Dört Design imzası eşit. Sekiz türetilmiş imza, karşılık gelen yerleşim değişiklikleriyle ayrı belgelenmiş. |
| Çizim ve paket | 3, 5, 4 ve 12 değişen PDF/SVG pafta. Kesim CSV’leri eşit. Düz ZIP, üç P0 tanısal belge ve kilit akışları doğrulandı. |
| Eski kayıtlar | Önceki derlemeden aynı kökende IndexedDB/localStorage oturumu ve manuel nokta, eski JSON, arşiv, adlandırılmış sürüm, Geri Al/Yinele, A/B ve PDF önizleme geçti. |
| Hareket ve erişim | Dört kanonik modelde aç/kapa, ters geçiş, engel ve son konum ölçümleri eşit. Adayda 25/4 menteşe 12,8° sınırında durdu ve ters kapandı. WS-UX-009a sürgü ve çekmece akışı 1458 mm’deki engelden 0 / 982 / 0 mm son konumlarına ulaştı. Kullanıcı iptali ve ters komut ayrı tarayıcı turlarında geçti. |
| MS-EXPORT-001 | Üç P0 erişim engeli ve tam CSV/ZIP kilidi, tanısal PDF/SVG/HTML, eylem denetimi, asenkron iptal ve iç seri hale getirme testleri geçti. |
| Gerçek tarayıcı | İzole profilde 3D, A/B cephesi, üst plan ve üretim kesitleri. Konsol hata/uyarı ve WebGL hatası kaydedilmedi. |
| Yerel CI | Temiz npm kurulumu, 21 dosyada 350/350 Vitest, TypeScript/Vite, `deploy:check` ve iki npm denetiminde 0 bulgu. |
| Statik derleme | 12 dosya, 3.328.430 bayt. Ana JS 1.907.995 bayt. CSS SHA-256 aynı. Vite’ın mevcut büyük JS dosyası uyarısı görüldü. |

Git tabanı `c57a4b2de7acc08a679b33136dacaa6dde6c13d9`. Kod `0fdc0369e6287e6f79d78175e139e1fe17c5ada5`, testler `e9a42b6b64503c52436bfb299310bd791b43c148`. MS-EXPORT-001 yayın kaydı `4c4a01d` kaynak commit’inden belge olarak ayrı taşındı. Çalışma yalnız yerel `fix/d3-baseline-001-exact-panel-centering` dalındadır. GitHub `main` ve Worker `9ce09ac8-d627-421a-88a7-3f6b7a66e0d5` doğrulanmış üretim tabanıdır. Yerel aday için ayrı yayın kararı gerekir. [Üretim tabanı](MS_EXPORT_001_PRODUCTION_RELEASE.md) · [Çalışma ve yayın rehberi](DEVELOPMENT_AND_RELEASE_GUIDE.md)

Üç fiziksel P0, WS-UX-011 ve WebGL kaynak ömrü açık. D3-BASELINE-001 nominal yerleşim kusuru yerel adayda doğrulandı ve üretim durumu açık. İmalat için katalog donanımı, yük, tolerans ve atölye kabulü gerekir. [Açık bulgular](OPEN_ISSUES_AND_TECHNICAL_DEBT.md)

Kanıt takımı yerel `artifacts/d3-baseline-001-fix` dizinindedir. [Kök neden ve uygulama](D3_BASELINE_001_IMPLEMENTATION_REPORT.md) · [Test matrisi](GEOMETRY_REGRESSION_MATRIX.md) · [Kanonik etki](CANONICAL_GEOMETRY_BEFORE_AFTER.md) · [Kayıt uyumluluğu](LEGACY_DESIGN_COMPATIBILITY_REPORT.md) · [Tarayıcı sonuçları](../evidence/browser/results.json)
