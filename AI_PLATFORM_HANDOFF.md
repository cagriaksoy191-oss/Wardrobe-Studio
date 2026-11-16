# Wardrobe Studio · yapay zekâ devir rehberi

**16 Kasım 2026 doğrulanmış üretim.** D3-BASELINE-001 `3dc5b5a` kaynağıyla yayımlandı. 350/350 Linux testi, kanonik 338 parça, 20/20 nominal yüzey teması ve 24 PDF/SVG pafta farkı canlıda doğrulandı. `POST_D3_BASELINE_001` güncel kanonik test referansıdır. MS-EXPORT-001 ve WS-UX-009a üretimde doğrulanmıştır. Üç fiziksel P0, WS-UX-011 ve WebGL borcu açık. [D3-BASELINE-001 üretim raporu](D3_BASELINE_001_PRODUCTION_RELEASE.md)

**15 Kasım 2026 doğrulanmış üretim.** MS-EXPORT-001 için GitHub `main` `c57a4b2de7acc08a679b33136dacaa6dde6c13d9`, Cloudflare build `7c8c7e0b-e2aa-455e-ae3a-4343ad7440ad` ve Worker `9ce09ac8-d627-421a-88a7-3f6b7a66e0d5`. Workers Free, Ready / %100 trafik, 309 test, 12 kanonik SHA ve 338 parça. Tam CSV/ZIP eylemi aktif tasarımı denetler ve bekleyen ZIP’i ilgili değişiklikte iptal eder. [Üretim kabulü](MS_EXPORT_001_PRODUCTION_RELEASE.md) · [Canlı adres](https://wardrobe-studio.cagriaksoy191.workers.dev/)

**14 Kasım 2026 · WS-UX-009a üretim kabulü:** Uygulama kaynağı `9624f90f3957165feb0d4f45c252deaade7e8546`, uygulamayı yayınlayan `main` commit'i `55a1639494c9132dbb6a2a6e82a5814babc66d8f`. İlk kabul build'i `787f76dd-a7b0-4894-8dd4-3d50a43404f8`, Worker `da47d81f-f73e-4c6d-b1d6-7afacec73cad`: Ready, %100 trafik, Workers Free. Linux 284/284 test; gerçek HTTPS'de masaüstü/mobil kurtarma, iptal ve veri/üretim kontrolleri geçti. **FIXED_AND_PRODUCTION_BROWSER_VERIFIED**, yalnız tek sürgü ve ilişkili çekmeceler için. Dört açık/kısmi bulgu ve ayrı WebGL borcu sürer. [Üretim kabul raporu](SAFE_MOTION_RECOVERY_PRODUCTION_RELEASE.md)

Bu kimlikler ilk doğrulanmış uygulama yayınının tarihli kanıtıdır. Sonraki yalnız doküman gönderimi Git HEAD'ini ve Worker kimliğini değiştirebilir; güncel sürümü Git/Cloudflare üzerinden ayrıca okuyun.

## Amaç ve üretim durumu

Wardrobe Studio, ev içi gömme ve L-köşe gardıropları tamsayı milimetrelerle tasarlayan bir 3D/2D stüdyo. Kullanıcının hedefi ölçü ve kesim güvenilirliği, gerçekçi kapak/çekmece erişimi, hızlı düzenleme, yerel kayıtların taşınabilirliği ve ücretsiz statik yayındır. Teknik paftalar atölye incelemesine girdi sağlar. Gerçek donanım, montaj ve yük doğrulaması fiziksel kabul için ayrıca gerekir.

13 Kasım 2026 doğrulamasında uygulama kaynak tabanı **`9e0e3da0409b731596d0c1edaf178b1876950c92`**, Cloudflare Workers Free, Worker **`89ba2d19-64e6-475d-8992-4682c9a5359d`**, build `d5cafa54-3238-44ac-8b5d-94dd551b7eba`, Ready / %100 trafik olarak kaydedildi. O tarihte uzak `main`, GitHub Cloudflare kontrolü, panel ve canlı HTTPS statik paket karşılaştırması uyuştu. Yerel test tabanı 18 dosyada 253 test. [Canlı adres](https://wardrobe-studio.cagriaksoy191.workers.dev/) · [Özel kaynak deposu](https://github.com/cagriaksoy191-oss/Wardrobe-Studio) · [Uygulama kaynak commit’i](https://github.com/cagriaksoy191-oss/Wardrobe-Studio/commit/9e0e3da0409b731596d0c1edaf178b1876950c92)

Özgün çalışma dizini `C:\dev\Wardrobe-Studio`. Yeni bilgisayarda kullanıcının yetkilendirdiği klonun kökünü esas alın. Devir dosyaları `docs/final-ai-platform-handoff` dalında hazırlanmıştır. Paketin ana erişim noktası varsayılan `main` dalıdır.

14 Kasım 2026 kabulünde uygulama kaynak commit’i, GitHub `main` HEAD’i ve etkin Cloudflare Worker kimliği ayrı izlenir. Yalnız dokümantasyon entegrasyonu Git HEAD’ini ve otomatik build sonucunda Worker kimliğini değiştirebilir. Güncel HEAD’i uzak Git’ten, dağıtılan SHA’yı Cloudflare build’inden, etkin Worker ve trafik payını Deployments ekranından doğrulayın. Yukarıdaki tarihli Worker kaydını sonraki bir oturumun güncel sürümü saymayın. Kaynak ağacı ve canlı varlıklar ayrıca karşılaştırılır.

## Okuma sırası

Aşağıdaki yerel aday paragrafı yayın öncesi kabulün tarihsel kaydıdır; güncel üretim durumu yukarıdadır.

**14 Kasım 2026 · yerel WS-UX-009a adayı:** `feat/safe-motion-recovery`, uzak `main` **`17ed1fe76e0c17c7a8b601e778e81acce3689429`** üzerinden geliştirildi. Kullanıcının başlattığı, iptal edilebilir tek sürgü/engelleyen çekmece sırası eklendi. 253 mevcut + 31 yeni test, dört kanonik model ve üç tarayıcı viewport'u doğrulandı. Kod ve belgeler yalnız bu aday dalındadır; `main`/GitHub/Cloudflare yayını yapılmadı. WS-UX-009a **üretimde açık**, adayda sınırlı senaryo için doğrulandı. Desteklenmeyen park yollarında manuel yöntem sürer. [Uygulama ve kabul raporu](SAFE_MOTION_RECOVERY_IMPLEMENTATION_REPORT.md) · [Üretim/aday ayrımı](CURRENT_ISSUE_STATUS.md)

1. [AGENTS.md](AGENTS.md) ve burada bağlı yerel çalışma kuralları.
2. [PROJECT_FINAL_HANDOFF.md](PROJECT_FINAL_HANDOFF.md) ve [OPEN_ISSUES_AND_TECHNICAL_DEBT.md](OPEN_ISSUES_AND_TECHNICAL_DEBT.md).
3. Dokunacağınız akışın [kaynak haritası](CODEBASE_MAP.md), [mühendislik değişmezleri](ENGINEERING_INVARIANTS.md) ve [geliştirme/yayın rehberi](DEVELOPMENT_AND_RELEASE_GUIDE.md).
4. Kapsam tartışmalarında [ana plan](wardrobe_studio_master_plan.md), [ek gereksinimler](wardrobe_studio_additional_requirements.md) ve [karar geçmişi](ENGINEERING_DECISION_LOG.md). Eski tarihli raporları kendi commit ve ortamlarına göre yorumlayın.

## Çalıştırma ve ilk inceleme

```powershell
git status --short --branch
git remote -v
git worktree list
git fetch origin
git rev-parse HEAD origin/main
node --version
npm ci
npm test -- --run --maxWorkers=2 --testTimeout=30000
npm run build
npm run dev -- --host 127.0.0.1 --port 5173
```

Node 24.16.0 referansı [.node-version](.node-version) içinde. Temiz bir çalışma ağacı kullanın. Kullanıcı değişikliklerine, başka dallara ve worktree’lere dokunmayın. Önce yerel belgeyi, takip edilen dosyaları ve erişilebilir Git/dağıtım kayıtlarını araştırın. Erişim açığı ancak sonucu etkiliyorsa, gereken erişimi ve etkisini belirtin. Kimlik doğrulamayı resmî sağlayıcı ekranında yürütün.

## Model ve güvenli değişiklik sınırları

- React/Vite uygulaması [App](src/App.tsx) üzerinden başlar. [Zustand store](src/store/useWardrobeStore.ts) kalıcı komutu doğrular, geçmişi yönetir ve çözücüyü çağırır. [Tipler ve şema](src/core/schema/types.ts) kullanıcı niyetini, [çözücü](src/core/solver/carcassSolver.ts) sahne ve üretim için türetilmiş modeli tanımlar.
- [Sahne](src/canvas/scene/WardrobeCanvas.tsx) çözülen modeli R3F ile çizer. [Hareket sınırı](src/core/analysis/motionConstraints.ts) ve [işlevsel erişim](src/core/analysis/functionalAccess.ts) önizleme ile üretim uyarılarını besler. [Üretim modeli](src/core/production/productionModel.ts) fiziksel parçaları, [üretim paneli](src/ui/ProductionPanel.tsx) çıktı kapılarını belirler.
- Tamsayı mm, ortak dikmeler, kararlı parça kimlikleri, şema v1 uyumluluğu ve erişim/çarpışma korumaları sürer. Üç fiziksel P0 için tam CSV/ZIP kilidi ve tanısal paftalar korunur. Hareket limiti veya çıktı kilidi uyarıyı gizlemek için gevşetilemez.
- Profil/adres bazlı IndexedDB ve localStorage verisini, otomatik çalışma kopyasını, manuel kontrol noktalarını, arşivi ve yedekleri koruyun. Sentetik veriyi ayrı profilde kullanın. Çalışma tasarımını ve adlandırılmış sürümleri ayrı Design JSON dosyaları olarak taşıyabilirsiniz. Adres, port, cihaz veya tarayıcı değişiminde kayıtlar kendiliğinden taşınmaz. Tasarımları, arşivleri, tarayıcı profillerini, izleri ve sırları Git’e eklemeyin.
- Geometri veya üretimle ilişkili değişikliklerde dört kanonik örneği ve tüm testleri çalıştırın. Hedeflenen arayüzü, kayıt/F5, Undo/Redo, JSON, 3D/2D ve üretim kapılarıyla birlikte sentetik tarayıcı profiliyle sınayın. Ayrıntılar [mühendislik değişmezlerinde](ENGINEERING_INVARIANTS.md).

## Dört açık bulgu ve yerel deneyler

D3-BASELINE-001 için yerel `fix/d3-baseline-001-exact-panel-centering` adayı kesin yarım ölçüyle doğrulandı. 20 nominal penetrasyon yüzey temasına dönüştü. Design ölçüleri ve kesim ebatları tamsayı kalır. Üretim tabanı ve aday imzaları ayrı belgelenmiştir. [Yerel kabul](D3_BASELINE_001_RELEASE_DECISION.md) · [Önce ve sonra](CANONICAL_GEOMETRY_BEFORE_AFTER.md)

WS-UX-001 beşgen raf erişimi (5,1°/110°), WS-UX-002 asimetrik beşgen ve 25 mm menteşe/askı erişimi (12,8°/110°), WS-UX-003 kör köşe çekmece stroku (49/451 mm) fiziksel doğrulama bekler. WS-UX-009a sınırlı tek kanat/çekmece kapsamında üretimde doğrulandı; desteklenmeyen hareket zincirleri manuel kalır. WS-UX-011 büyük modelde kısmi kapanmıştır. Hareket CPU iyileştirmesi yayında, 130 hücre seçimi bırakma gecikmesi sürüyor.

Sunum modu kaynak birikimi ayrı teknik borçtur. `27361cb` tabanından açılan `fix/webgl-contact-shadow-lifecycle` dalındaki `7f2134a` iki GPU'da kaynak birikimini durdurdu. `codex/webgl-non-inferiority` aynı kodu 102 başsız çiftte doğruladı. Bağımsız normal pencere tekrarında ağır açık sahneler geçti, Radeon LED kare p95 üst sınırı +2,0339 ms ile +2,0 ms eşiğine sığmadı. Aday `RESEARCHED_NOT_READY`. Eski `a1e8731`, B1 `c42c5a7`, B2 `a8c1ba3` ve kutu seçimi `7b91a12` araştırma kayıtları korunur. Yerel SHA’lar temiz klonda bulunmayabilir. [Güncel yerel karar](WEBGL_FINAL_RELEASE_READINESS.md) · [İlk yerel karar](WEBGL_RESOURCE_RELEASE_DECISION.md) · [Açık iş listesi](OPEN_ISSUES_AND_TECHNICAL_DEBT.md)

## Yayın ve önerilen ilk görev

İlk iş olarak temiz klonda dalı ve tabanı doğrulayın, test/build/dry-run ve dört sentetik örneği tekrar çalıştırın. Sonuçları kod veya canlı ortamı değiştirmeden raporlayın. İlk fiziksel inceleme için kör köşe üç ray adayının üretici kesiti ve tolerans verisini araştırmak, ayrı bir geliştirme kararı için kanıt sağlar.

Canlı yayın ve ücretli servis değişikliği açık kullanıcı onayı gerektirir. Onaylı yayında doğru SHA, Linux Cloudflare build, trafik alan Worker ve canlı HTTPS paket baytları birlikte doğrulanır. `main` gönderimi otomatik üretim yayını başlatabilir. Geri alma önce doğrulanmış Worker sürümüne ve ardından onaylı Git düzeltmesine dayanır. [Yayın rehberi](DEVELOPMENT_AND_RELEASE_GUIDE.md)
