# Wardrobe Studio — yaşayan bulgu envanteri

## 14 Kasım 2026 · gerçek üretim kabulü

Uygulama kaynağı **`9624f90f3957165feb0d4f45c252deaade7e8546`**, ilk uygulama yayınının GitHub `main` commit'i **`55a1639494c9132dbb6a2a6e82a5814babc66d8f`**. Cloudflare build **`787f76dd-a7b0-4894-8dd4-3d50a43404f8`**, Worker **`da47d81f-f73e-4c6d-b1d6-7afacec73cad`**, Ready / %100 trafik, Free. Bunlar tarihli ilk kaynak kabulünün kimlikleridir; yalnız doküman gönderimi sonrası güncel HEAD/Worker ayrıca doğrulanır. [Üretim kabul raporu](SAFE_MOTION_RECOVERY_PRODUCTION_RELEASE.md)

| Bulgu | Güncel üretim durumu |
| --- | --- |
| WS-UX-001 · P0 | Açık; fiziksel doğrulama ve tam CSV/ZIP kilidi sürer. |
| WS-UX-002 · P0 | Açık; fiziksel doğrulama ve tam CSV/ZIP kilidi sürer. |
| WS-UX-003 · P0 | Açık; fiziksel doğrulama ve tam CSV/ZIP kilidi sürer. |
| WS-UX-009a · P2 | **FIXED_AND_PRODUCTION_BROWSER_VERIFIED**; yalnız doğrulanmış tek sürgü/ilişkili çekmeceler. Desteklenmeyen zincirler manuel kalır. |
| WS-UX-011 · P2 | Kısmi; büyük kutu seçimi bırakma gecikmesi sürer. |

**4 açık/kısmi kullanıcı bulgusu** ve ayrı WebGL kaynak yönetimi borcu sürer. 284/284 Linux testi, 12 kanonik imza/338 parça, canlı dosya eşleşmesi, 4 viewport, kurtarma/iptal/manuel müdahale, JSON/kayıt/F5/Undo, üretim çıktıları ve üç P0 kilidi doğrulandı. Önceki 14 Kasım aday ve 12 Kasım envanterleri aşağıda korunur.

## Tarihsel kayıt · 14 Kasım 2026 yerel aday kabulü (yayın öncesi)

Uzak `main` **`17ed1fe76e0c17c7a8b601e778e81acce3689429`**, uygulama kaynak tabanı **`9e0e3da0409b731596d0c1edaf178b1876950c92`**. Görev başlangıcında son doğrulanmış Worker **`660674f5-e629-4736-a08b-ae63d9ff99e3`** olarak bildirildi; bu görevde Cloudflare paneli yeniden denetlenmedi veya yayın yapılmadı. Aşağıdaki yerel aday, eski 12 Kasım envanterinden ayrıdır.

| Bulgu | Üretim | `feat/safe-motion-recovery` yerel adayı |
| --- | --- | --- |
| WS-UX-001 · P0 | Fiziksel doğrulama bekliyor | Değişmedi; tam CSV/ZIP kilidi korunuyor. |
| WS-UX-002 · P0 | Fiziksel doğrulama bekliyor | Değişmedi; tam CSV/ZIP kilidi korunuyor. |
| WS-UX-003 · P0 | Fiziksel doğrulama bekliyor | Değişmedi; tam CSV/ZIP kilidi korunuyor. |
| WS-UX-009a · P2 | Açık; manuel kurtarma | **IMPLEMENTED_AND_BROWSER_VERIFIED_PENDING_RELEASE**. Bilinen tek kanat/çekmece senaryosu, iptal, müdahale ve yeni sahne doğrulandı. Desteklenmeyen planlar manuel kalır. |
| WS-UX-011 · P2 | Kısmi; büyük kutu seçimi bırakma gecikmesi | Bu görevde değiştirilmedi. |

Üretimde **5 açık/kısmi kullanıcı bulgusu** sürüyor. Yerel adayda WS-UX-009a sınırlı kabulü sağladı, yayın onayı bekliyor; diğer **4 açık/kısmi** bulgu değişmedi. WS-UX-004–008, 009'un duruş bildirimi, 010, 012–017 ve 018 önceki yayınlarda düzeltilmiştir. Sunum Modu WebGL kaynak ömrü ayrıca açık teknik borçtur. 284/284 test, build, dry-run, audit (0/0), dört kanonik model ve 338 parça doğrulandı. [Aday raporu](SAFE_MOTION_RECOVERY_IMPLEMENTATION_REPORT.md) · [Açık işlerin güncel ayrıntıları](OPEN_ISSUES_AND_TECHNICAL_DEBT.md)

## Tarihsel kayıt · 12 Kasım 2026

**12 Kasım 2026.** Bu kayıt, [önceki denetimin](COMPREHENSIVE_UX_FUNCTIONAL_AUDIT.md) tarihsel kanıtlarını değiştirmez. Üretim ve yerel aday aşağıda ayrı gösterilir.

- **Üretim:** [gerçek HTTPS](https://wardrobe-studio.cagriaksoy191.workers.dev/), uzak `main` ve yayın kaynağı `5de4fad8358cf1221673a94bdaee1a67b591bb22`. Cloudflare `b64f824d-4031-43c7-b52b-761f6a21a186` gözlemde trafiğin %100'ünü alıyordu. Son kontrolde 11 HTTPS yanıtı önceki dağıtımla aynı SHA-256 değerlerini verdi.
- **Aday:** yalnız yerel `fix/autonomous-ux-hardening`, son ürün commit'i `0ae96abde978953687e7946ba09a5facdd531be4`. Ayrı rapor commit'leri ürün içeriğini değiştirmez. Aday yayımlanmadı.
- **Sayım:** Üretimde önceden düzeltilmiş 5, açık 12. İlk 12'den adayda **8 kapatılabilir**, **1 kısmi**, **3 fiziksel onay bekliyor**. Adayın açık dağılımı **P0: 3 · P1: 0 · P2: 1 · P3: 0**. Yeniden sınıflandırılan 010 ile üretimde açık dağılımı **P0: 3 · P1: 2 · P2: 5 · P3: 2**.

| Bulgu | Önem ve tarihsel durum | Canlı | Yerel aday / kanıt |
| --- | --- | --- | --- |
| **WS-UX-001** Beşgen 18/8 kapalı cephe | P0 · açık | Açık | **BLOCKED_EXTERNAL_VALIDATION** · B1 önce 155°, köşe sonra 60°; 458/310 mm raf koridoru. 1535 mm B1 kanadı ve sıra gerçek donanımla doğrulanmalı. |
| **WS-UX-002** Asimetrik beşgen 25/4 | P0 · açık | Açık | **BLOCKED_EXTERNAL_VALIDATION** · sağ menteşe ve 1050×1050 kollarla 448/310 mm; 25 mm kanat, pivot ve askı erişimi açık. |
| **WS-UX-003** Kör köşe sürgü/çekmece | P0 · açık | Açık | **BLOCKED_EXTERNAL_VALIDATION** · üç ayrı ray, A1=1500 mm ile 451/451 mm; 6 mm nominal fark ve 0/480 mm askı koridoru. |
| **WS-UX-004** Geçersiz ölçünün korunması | P1 · eski denetimde düzeltildi | **FIXED_AND_BROWSER_VERIFIED** | Canlı 2550 mm, 999999 girdisinde korundu; başlangıç formu 1000 ve boş değerde oluşturmayı kapattı. Adayda form 5/5 ekran boyutunda yeniden sınandı. |
| **WS-UX-005** Escape ile ölçü iptali | P1 · eski denetimde düzeltildi | **FIXED_AND_BROWSER_VERIFIED** | Canlı 2580 taslağı Escape ve Tab sonrası kaydedilmedi, 2550 kaldı. |
| **WS-UX-006** Dış çekmecede kapak açıklaması | P1 · eski denetimde düzeltildi | **FIXED_AND_BROWSER_VERIFIED** | Canlı ve adayda B2 dış çekmeceler, menteşeli kanadın oluşmama sebebiyle birlikte göründü. |
| **WS-UX-007** JSON sonrası Araçlar/erişim | P1 · eski denetimde düzeltildi | **FIXED_AND_BROWSER_VERIFIED** | Canlı 1280×720, JSON'dan sonra Araçlar kapalı, odak geri döndü, erişim merkezine tıklandı ve doğru dialog açıldı. |
| **WS-UX-008** Çoklu raf otomatik hedefi | P1 · eski denetimde düzeltildi | **FIXED_AND_BROWSER_VERIFIED** | Canlı 48 aralık seçimi; yerleşen alan boş, 55/12/4,5 reddedildi, 5×12=60 uygulandı; Undo sonrası JSON bayt eşit. |
| **WS-UX-009** Sürgü/çekmece kapanışı | P1 · açık | Açık | **FIXED_AND_BROWSER_VERIFIED** · gerçek 1458 mm sürgü ve 86 mm çekmece duruşu görünür. Geri park, bekleme ve yeniden kapatma 0 mm'ye ulaştı. Kinematik koruma etkin. |
| **WS-UX-010** Yeşil A/B artılarının örtülmesi | P2 → **P1** · ana bölme ekleme eylemi dar ekranda engelleniyor | Açık | **FIXED_AND_BROWSER_VERIFIED** · 5 boyut × 2 editör durumu × 2 kol: 20/20 merkez isabeti, doğru dialog, düğmeye dönen odak. Mobilde 44×44 CSS px. |
| **WS-UX-011** Büyük model gecikmesi | P2 · açık | Açık | **PARTIAL** · kutu seçiminde kare p95 228,1→145,6 ms; React p95 187,2→49,3 ms. Kinematik ve sunum yükü açık. |
| **WS-UX-012** İlk kullanımın açıklığı | P2 · açık | Açık | **FIXED_AND_BROWSER_VERIFIED** · temiz köklerde üç yol, oluşturma/örnek odağı ve doğrudan JSON; 5 kayıt/F5 senaryosunda rehber görünmedi. Gerçek yeni kullanıcı araştırması yapılmadı. |
| **WS-UX-013** A/B arşiv bağlamı | P2 · açık | Açık | **FIXED_AND_BROWSER_VERIFIED** · seçili sürüm B, çalışma kopyası A, seçimsiz B boş; arşiv seçeneği etiketli. |
| **WS-UX-014** 2D kadraj | P2 · açık | Açık | **FIXED_AND_BROWSER_VERIFIED** · A/B uzun ve kısa/asimetrik; 928→390→928 CSS px tuval, yakınlaştırma, pan ve sıfırlama; JSON bayt eşit. |
| **WS-UX-015** Fiziksel raf ve aralık | P2 · açık | Açık | **FIXED_AND_BROWSER_VERIFIED** · raf grubu 4/5, düzenlemeden sonra 5/6. Köşe sayısı ayrı etiketli. |
| **WS-UX-016** Üst Taç ölçü etiketi | P3 · açık | Açık | **FIXED_AND_BROWSER_VERIFIED** · Üst klapa (mm), dekoratif taç ayrı; 40→50 mm aynı `topFillerHeightMm` alanında. |
| **WS-UX-017** Arama alanında Escape | P3 · açık | Açık | **FIXED_AND_BROWSER_VERIFIED** · parça kodu yazılıyken ilk Escape'te kapandı, açan düğme odaklandı. |

Kanıtlar: [ana rapor ve yeniden üretim](AUTONOMOUS_UX_HARDENING_REPORT.md), [P0 fizibilitesi](CLOSED_CORNER_FEASIBILITY.md), [tarayıcı ölçümleri](artifacts/autonomous-ux-hardening/browser-results.json), [son HTTPS parmak izi](artifacts/autonomous-ux-hardening/final-live-fingerprint.json).
