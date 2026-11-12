# Wardrobe Studio — yaşayan bulgu envanteri

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
