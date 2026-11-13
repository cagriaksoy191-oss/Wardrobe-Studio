# Wardrobe Studio · proje teslim durumu

13 Kasım 2026. Üretim tabanı `9e0e3da0409b731596d0c1edaf178b1876950c92`. Etkin Cloudflare Worker `89ba2d19-64e6-475d-8992-4682c9a5359d`, Ready / %100. Devir dalı bu tabandan ayrılır. [Canlı uygulama](https://wardrobe-studio.cagriaksoy191.workers.dev/) · [Yayın ve karar geçmişi](ENGINEERING_DECISION_LOG.md)

## Başlangıçtan üretime

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

- `4418549` Zod/Vitest güvenlik bakımı ve eski JSON uyumluluğu. `5de4fad` WS-UX-004–008 ölçü doğrulama/iptal, dış çekmece açıklaması, JSON sonrası menü/odak ve çoklu raf girişi.
- `6d88b0f` yayın zincirinde A–E otonom iyileştirmeler: sürgü-çekmece duruş açıklaması, A/B ekleme, ilk kullanım, A/B arşiv bağlamı, 2D kadraj, raf/aralık ve üst klapa dil düzeltmesi, Escape/odak, seçimde gereksiz sahne işini azaltma ve ön cephede pan atalet düzeltmesi.
- `10925a6` kesin çarpışma hacimlerinin aynı hareket sahnesi içinde tekrar kullanımı. `9e0e3da` WS-UX-018 kamera korunurken A/B ekleme kontrolü. Önceki canlı sentetik kabulde beş ekran boyutunda 20/20 hedef tıklaması ve odak dönüşü doğrulandı. [Kaynak ve test haritası](CODEBASE_MAP.md) · [Karar geçmişi](ENGINEERING_DECISION_LOG.md)

## Devir doğrulaması ve sınırlar

Bu devirde yeniden çalıştırılanlar: temiz `npm ci`, 18 dosyada 253/253 Vitest, TypeScript/Vite build, `deploy:check` ve Wrangler dry-run, tam/üretim npm audit (0 bilinen bulgu), dört tarihsel kabul fixture’ında eşit Design/ResolvedModel/ProductionPackage parmak izleri ve 338 fiziksel parça. Canlı HTTPS’de 11 dosya karşılaştırıldı. GitHub Cloudflare kontrolü ve etkin Worker gözlendi. Build’de Zod yorum açıklaması ve ana paket boyutu uyarıları görüldü. [Doğrulama yöntemi ve sayımlar](ENGINEERING_INVARIANTS.md) · [Yayın denetimi](DEVELOPMENT_AND_RELEASE_GUIDE.md)

Önceki kabulde tarayıcı arayüzü, sentetik kayıt, 3D/2D ve üretim çıktı akışları denenmişti. Devirde uzun GPU/etkileşim ölçümleri ve tam canlı tarayıcı kabul matrisi yeniden çalıştırılmadı. Atölye donanım onayı, yük altında hareket, tolerans ve erişim açık. Üç P0 fiziksel bulgu, manuel kurtarma ve büyük seçim gecikmesi sürüyor. GPU cleanup ve iki kutu seçimi deneyi yerel araştırma olarak kalır. [Güncel açık işler](OPEN_ISSUES_AND_TECHNICAL_DEBT.md)

## Sonraki kabul

1. Her aday için temiz klon, aynı CI ayarları, kanonik karşılaştırma ve kapsam dışı diff kontrolü.
2. Ayrı tarayıcı profiliyle sentetik düz/L, 3D ve A/B/üst plan, seçim, raf/çekmece, kapak hareketi, geri al/yinele, kayıt/F5, JSON ve PDF/CSV/ZIP. P0’larda tanısal çıktı ve üretim kilidini kontrol edin.
3. Fiziksel P0 adaylarında üretici çizimi, parça kodları, tolerans ve yük, 1:1 atölye numunesi, tekrarlı aç/kapa ve raf/askı erişimi. Bu kabulden önce üretim kilitleri sürer. [Fizibilite](CLOSED_CORNER_FEASIBILITY.md)
4. Performans adayı için doğruluk ve görsel eşitlik, drag/up/panel hazır dağılımları, bağlam kaybı/geri dönüşü ve iki GPU’da tekrarlanabilir karşılaştırma. [Ölçüm hedefleri](OPEN_ISSUES_AND_TECHNICAL_DEBT.md)

Eski raporların bazı bağlantıları yerel `artifacts/` kayıtlarına gider. Yeni klon için kritik sonuçlar bu pakette, sentetik model kaynağı ve doğrulayıcılar ise Git’te. Ham tarayıcı izleri, kişisel kayıtlar, yedekler ve yerel deney worktree’leri klona dahil olmaz.
