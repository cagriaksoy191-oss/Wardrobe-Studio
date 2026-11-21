# Wardrobe Studio · proje teslim durumu

**21 Kasım 2026 yerel WS-UX-011 adayı.** Büyük modellerde renk başına toplu seçim çizimi seçimin sırasını, davranışını ve kanonik üretim verisini korudu. 22+22 ölçümde bırakma kare p95’i 25,4→21,4 ms, panel p95’i 55,2→46,2 ms. 358 test ve gerçek tarayıcı kabulü geçti. **READY_FOR_RELEASE_REVIEW**. Üretim onayı ayrı. [WS-UX-011 raporu](WS_UX_011_FINAL_REMEDIATION_REPORT.md)

**17 Kasım 2026 doğrulanmış üretim.** ContactShadows kaynak ömrü düzeltmesi `ddfc3a5`, `d6dcabd` ilk uygulama sürümüyle Workers Free üzerinde yayımlandı. 354/354 Linux testi, 12 HTTPS dosyası ve gerçek tarayıcıda Sunum Modu, kamera, LED, güvenli hareket, kayıt ve üretim çıktıları doğrulandı. Resmî Radeon LED protokolü `RESEARCHED_NOT_READY` olarak kapatıldı. Yayın kullanıcının açık mühendislik risk kabulüne dayanır. Üç fiziksel P0 ve WS-UX-011 açık. [WebGL üretim raporu](WEBGL_CONTACT_SHADOWS_PRODUCTION_RELEASE.md)

**16 Kasım 2026 doğrulanmış üretim.** D3-BASELINE-001 `3dc5b5a` kaynağıyla yayımlandı. 350/350 Linux testi, kanonik 338 parça, 20/20 nominal yüzey teması ve 24 PDF/SVG pafta farkı canlıda doğrulandı. `POST_D3_BASELINE_001` güncel kanonik test referansıdır. MS-EXPORT-001 ve WS-UX-009a üretimde doğrulanmıştır. Bu tarihte üç fiziksel P0, WS-UX-011 ve WebGL borcu açıktı. [D3-BASELINE-001 üretim raporu](D3_BASELINE_001_PRODUCTION_RELEASE.md)

**14 Kasım 2026 tarihsel üretim kabulü:** Uygulama kaynağı `9624f90f3957165feb0d4f45c252deaade7e8546`; ilk yayın `main` commit'i `55a1639494c9132dbb6a2a6e82a5814babc66d8f`. Build `787f76dd-a7b0-4894-8dd4-3d50a43404f8`, Worker `da47d81f-f73e-4c6d-b1d6-7afacec73cad`, Ready / %100, Free. WS-UX-009a yalnız tek kanat/ilişkili çekmeceler için üretimde doğrulandı. 284/284 Linux testi, gerçek HTTPS, dört viewport, veri/üretim ve P0 çıktı kilitleri kontrol edildi. [Üretim kabul raporu](SAFE_MOTION_RECOVERY_PRODUCTION_RELEASE.md)

Aşağıdaki başlangıç paragrafı 13–14 Kasım devir tabanının tarihsel kaydıdır. Yalnız doküman yeniden yayını, uygulama kodu aynı kalırken Git HEAD ve Worker kimliğini değiştirebilir.

Uygulama kaynak tabanı `9e0e3da0409b731596d0c1edaf178b1876950c92`. 13 Kasım 2026 doğrulamasında Worker `89ba2d19-64e6-475d-8992-4682c9a5359d`, Ready / %100 olarak kaydedildi. `docs/final-ai-platform-handoff` bu tabandan ayrıldı. 14 Kasım 2026 dokümantasyon kabulünde varsayılan `main` devir için esas alınır. Yalnız Markdown entegrasyonu Git HEAD’ini ve Cloudflare yeniden yayınıyla Worker kimliğini değiştirebilir. Güncel SHA, build, Worker ve trafik her devralmada gerçek servislerden doğrulanır. [Canlı uygulama](https://wardrobe-studio.cagriaksoy191.workers.dev/) · [Yayın ve karar geçmişi](ENGINEERING_DECISION_LOG.md)

## Başlangıçtan üretime

Aşağıdaki yayınlanmamış aday paragrafı da ilk yerel kabulün tarihsel kaydıdır; güncel yayın kabulü yukarıdadır.

**14 Kasım 2026 · yayınlanmamış ek aday:** `feat/safe-motion-recovery`, uzak `main` `17ed1fe76e0c17c7a8b601e778e81acce3689429` tabanında WS-UX-009a için sınırlı güvenli hareket sıralaması içerir. 284/284 test, üretim build/dry-run, sıfır audit bulgusu, 338 parça ve dört kanonik imza korundu. Bilinen engel gerçek tarayıcıda geri park → üç çekmece → sürgü sırasıyla çözüldü. İptal ve manuel yöntem korunur. Bu paragraf üretim yayını anlamına gelmez. [Yeni uygulama raporu](SAFE_MOTION_RECOVERY_IMPLEMENTATION_REPORT.md) · [Güncel durum ayrımı](CURRENT_ISSUE_STATUS.md)

| Aşama | Kaynakta ve uygulamada bulunan teslim |
| --- | --- |
| 1 · Parametrik temel | Düz ve L oda/gövde, A/B kolları, paylaşılmış dikme, deterministik çözüm, seçim ve temel 3D/2D çalışma alanı. |
| 2 · İç düzen ve köşe | Sabit/esnek iç bölme, raf/aralık, askı ve çekmece, beşgen/kör köşe, yönlü boyutlandırma ve bağlamsal editör. |
| 3 · Görselleştirme ve çalışma oturumu | Bağımsız kapak/çekmece düzenleme, çoklu seçim, Undo/Redo, yerel otomatik çalışma kopyası ve kayıt noktası. PBR malzemeleri, 3D kulp, LED ve eşya önizlemesi. |
| 4 · Geometri ve analiz | Parametrik geometri düzeltmeleri, bağımsız kullanım/engel/ergonomi analizi, envanter ve depolama şablonları, hareket ve erişim tanısı. |
| 5 · Cephe, sürüm ve üretim | Menteşeli/sürgülü/açık karma cephe, ray ve hareket sınırları, adlandırılmış sürüm ve arşiv, A/B, JSON, üretim modeli, A3 teknik PDF/HTML ve SVG, kesim CSV ve ZIP. |
| Üretim ve bakım | GitHub özel depo, Cloudflare Workers Static Assets, otomatik `main` derlemesi/yayını, güvenlik bağımlılık güncellemesi ve tarayıcıda doğrulanmış UX sürümleri. |

Aşamalar ve ayrıntılı eski kabul kanıtları tarihsel tabanlarına bağlıdır. [İlk devir](PROJECT_HANDOFF.md) · [Aşama 4](PHASE4_VERIFICATION.md) · [Aşama 5](PHASE5_VERIFICATION.md) · [Kullanıcı kabul matrisi](USER_ACCEPTANCE_TESTS.md)

## Canlı bakım kapsamı

- `9624f90` / ilk yayın `55a1639`: açık kullanıcı başlatması, tek işlem sahipliği, gerçek pozla adım tamamlama, iptal/yeni komut/sahne değişimi ve güvenli manuel geri dönüş. Çarpışma hesabı, kesin hacim cache'i, geometri, kayıt şeması ve üretim kilitleri değişmedi.

- `4418549` Zod/Vitest güvenlik bakımı ve eski JSON uyumluluğu. `5de4fad` WS-UX-004–008 ölçü doğrulama/iptal, dış çekmece açıklaması, JSON sonrası menü/odak ve çoklu raf girişi.
- `6d88b0f` yayın zincirinde A–E otonom iyileştirmeler: sürgü-çekmece duruş açıklaması, A/B ekleme, ilk kullanım, A/B arşiv bağlamı, 2D kadraj, raf/aralık ve üst klapa dil düzeltmesi, Escape/odak, seçimde gereksiz sahne işini azaltma ve ön cephede pan atalet düzeltmesi.
- `10925a6` kesin çarpışma hacimlerinin aynı hareket sahnesi içinde tekrar kullanımı. `9e0e3da` WS-UX-018 kamera korunurken A/B ekleme kontrolü. Önceki canlı sentetik kabulde beş ekran boyutunda 20/20 hedef tıklaması ve odak dönüşü doğrulandı. [Kaynak ve test haritası](CODEBASE_MAP.md) · [Karar geçmişi](ENGINEERING_DECISION_LOG.md)

## Devir doğrulaması ve sınırlar

Aşağıdaki iki paragraf WS-UX-009a yayını öncesindeki devir kabulünün tarihsel kaydıdır. O yayındaki 284 test ve canlı kabulün sonuçları bu belgenin başında ve üretim raporundadır.

Bu devirde yeniden çalıştırılanlar: temiz `npm ci`, 18 dosyada 253/253 Vitest, TypeScript/Vite build, `deploy:check` ve Wrangler dry-run, tam/üretim npm audit (0 bilinen bulgu), dört tarihsel kabul fixture’ında eşit Design/ResolvedModel/ProductionPackage parmak izleri ve 338 fiziksel parça. Canlı HTTPS’de 11 dosya karşılaştırıldı. GitHub Cloudflare kontrolü ve etkin Worker gözlendi. Build’de Zod yorum açıklaması ve ana paket boyutu uyarıları görüldü. [Doğrulama yöntemi ve sayımlar](ENGINEERING_INVARIANTS.md) · [Yayın denetimi](DEVELOPMENT_AND_RELEASE_GUIDE.md)

Önceki kabulde tarayıcı arayüzü, sentetik kayıt, 3D/2D ve üretim çıktı akışları denenmişti. Devirde uzun GPU/etkileşim ölçümleri ve tam canlı tarayıcı kabul matrisi yeniden çalıştırılmadı. Atölye donanım onayı, yük altında hareket, tolerans ve erişim açık. Üç P0 fiziksel bulgu, manuel kurtarma ve büyük seçim gecikmesi sürüyor. GPU cleanup ve iki kutu seçimi deneyi yerel araştırma olarak kalır. [Güncel açık işler](OPEN_ISSUES_AND_TECHNICAL_DEBT.md)

## Gelecekteki çalışma sırası

1. Güvenli başlangıç için temiz klonda test/build ve dört kanonik tasarımın imzalarını doğrulayın.
2. WS-UX-011 yerel adayını 21 Kasım ölçümleri ve işlev kanıtıyla inceleyin. Sunum Modu için normal kaynak ömrü ve işlev regresyon kontrollerini sürdürün. Kapanan Radeon LED araştırma serisini yeniden başlatmayın.
3. WS-UX-009a'nın üretimde doğrulanmış sınırlı sırasını koruyun; desteklenmeyen park yollarında manuel kurtarmayı sürdürün.
4. WS-UX-001/002/003 için donanım, tolerans, yük ve gerçek erişim onayını tamamlayın. Fiziksel kabul beklerken üretim kapıları korunur.
5. Güvenilir otomatik kontrollerin ardından kullanıcı kendi tasarım iş akışıyla kabul testi yapar. Üç fiziksel P0 ve kısmi WS-UX-011 bu sırada izlenir.

## Sonraki kabul

1. Her aday için temiz klon, aynı CI ayarları, kanonik karşılaştırma ve kapsam dışı diff kontrolü.
2. Ayrı tarayıcı profiliyle sentetik düz/L, 3D ve A/B/üst plan, seçim, raf/çekmece, kapak hareketi, geri al/yinele, kayıt/F5, JSON ve PDF/CSV/ZIP. P0’larda tanısal çıktı ve üretim kilidini kontrol edin.
3. Fiziksel P0 adaylarında üretici çizimi, parça kodları, tolerans ve yük, 1:1 atölye numunesi, tekrarlı aç/kapa ve raf/askı erişimi. Bu kabulden önce üretim kilitleri sürer. [Fizibilite](CLOSED_CORNER_FEASIBILITY.md)
4. Performans adayı için doğruluk ve görsel eşitlik, drag/up/panel hazır dağılımları, bağlam kaybı/geri dönüşü ve iki GPU’da tekrarlanabilir karşılaştırma. [Ölçüm hedefleri](OPEN_ISSUES_AND_TECHNICAL_DEBT.md)

Eski raporların bazı bağlantıları yerel `artifacts/` kayıtlarına gider. Yeni klon için kritik sonuçlar bu pakette, sentetik model kaynağı ve doğrulayıcılar ise Git’te. Ham tarayıcı izleri, kişisel kayıtlar, yedekler ve yerel deney worktree’leri klona dahil olmaz.
