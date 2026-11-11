# Wardrobe Studio — Yerel düzeltmeler ve doğrulama

11–12 Kasım 2026, TSİ · `audit/ux-functional-quality` · taban `4418549ee3bea1d5252f3589af767e10b02cd515`

**Beş P1 düzeltildi.** Aday yerel incelemeye hazır. [Canlı uygulama](https://wardrobe-studio.cagriaksoy191.workers.dev/) `4418549…` ve Cloudflare `40f67c62-a76c-48a4-aa3a-ff9e9c6cf908` üzerinde. GitHub’a gönderim, `main` birleştirmesi, Cloudflare yapılandırma değişikliği veya yayın yapılmadı. [Tam denetim ve kalan bulgular](COMPREHENSIVE_UX_FUNCTIONAL_AUDIT.md)

## Uygulanan değişiklikler

| Kimlik | Önce → aday | Doğrulama |
|---|---|---|
| **WS-UX-004 · Ölçü sınırı** | Paylaşılan ölçü alanı sınır dışı değeri sessizce min/max’a taşıyordu; kurulum da varsayılanı/sınırı sessizce kullanabiliyordu. Düzenleyici önceki değeri koruyor ve aralığı açıklıyor. Kurulum, geçersiz görünen ölçüyü işaretleyip düzeltme yapılana kadar oluşturmayı bekletiyor. | Tavan 2680 için 999999 ve −50 reddedildi. Boş değer zararsız, yarım `e` tarayıcıda hatalı giriş, 2699,6 → 2700 mm; hızlı iki değişiklik sonrası JSON 2690. 390 px kurulumda 999999 ve boş değer engellendi; geçerli 3000×600/2500×520 L ve 2450 mm gövde oluştu. 360 px’de geçersiz fakat gizli B alanı düz yerleşimi engellemedi. [Ölçü önce](artifacts/ux-functional-audit/browser/11-before-out-of-range.jpg) · [sonra](artifacts/ux-functional-audit/browser/38-after-out-of-range.jpg) · [Kurulum önce](artifacts/ux-functional-audit/browser/43-before-blank-wizard-range.jpg) · [sonra](artifacts/ux-functional-audit/browser/44-after-blank-wizard-range.jpg) |
| **WS-UX-005 · Escape** | Enter veya odaktan çıkış taslağı uyguluyordu; Escape iptal etmiyordu. Değiştirilmiş taslağa Escape basıldığında önceki değer geri gelir ve o blur kaydetmez. | 2680 → 2700 → Escape → sahneye tıkla, 2680 kaldı. Geçerli Enter/blur ve tamsayı davranışı korunur. [Önce](artifacts/ux-functional-audit/browser/12-before-number-escape.jpg) · [Sonra](artifacts/ux-functional-audit/browser/39-after-number-escape.jpg) |
| **WS-UX-006 · Çekmeceli cephe** | Tam boy dış çekmecelerde “Çift Kapak” seçili görünürken neden kanat bulunmadığı yazmıyordu. Gerçekte çözülen çekmece grubu tüm ön yüzü kaplıyor ve otomatik kanat yoksa durum açıklanıyor. | B2’de dört çekmece ve açıklama, A1’de açıklamasız iki gerçek kapak. Gerçek solver ile iç çekmece ve açık cephe karşı örnekleri. [Önce](artifacts/ux-functional-audit/browser/05-before-drawer-door-choice.jpg) · [Sonra](artifacts/ux-functional-audit/browser/40-after-drawer-door-choice.jpg) |
| **WS-UX-007 · Araçlar ve uyarı** | JSON seçildikten sonra dar menü uyarı düğmesini örtüyordu. Dosya seçilince menü kapanıp odak Araçlar’a döner. | 1280×720, aynı beşgen dosya ve aynı düğme konumu: merkezde önce JSON indirme, sonra erişim düğmesi. Pencere gerçek tıklamayla açıldı. Geçersiz dosya mesajı ve çalışma kopyası koruması çalıştı. [Önce](artifacts/ux-functional-audit/browser/35-before-local-import-warning.jpg) · [Sonra](artifacts/ux-functional-audit/browser/36-after-local-import-warning.jpg) · [Açılan pencere](artifacts/ux-functional-audit/browser/37-after-access-dialog.jpg) |
| **WS-UX-008 · Toplu raf hedefi** | Ayrı gruplar toplam seçimi hedef olarak alıyordu; 54 seçim 55 aralık önerdi ve şema reddetti. Grup başına hedef boş başlıyor; sayısal alan ve arttır/azalt düğmeleri adlandırıldı. Tam ayakkabılık bulunan seçimde 1–11, diğerinde 1–12 aralık kontrol edilir. | Aynı 54 hücre/18 grup. Boşken işlem pasif; 55, 12 ve 4,5 ayakkabılıklı bu seçimde kabul edilmedi. Açıkça 5 girilince 90 aralık seçildi. Tek Undo başlangıç JSON’unu bayt düzeyinde geri getirdi. Tek grup kısayolu kalır; üst sınırda geçersiz kısayol sunulmaz. [Önce](artifacts/ux-functional-audit/browser/30-before-batch-interval-result.jpg) · [Hedef bekliyor](artifacts/ux-functional-audit/browser/41-after-batch-interval-neutral.jpg) · [Geçerli uygulama](artifacts/ux-functional-audit/browser/42-after-batch-interval-applied.jpg) |

Kaynak değişiklikleri [App.tsx](src/App.tsx), [Phase4Panels.tsx](src/ui/Phase4Panels.tsx), [ContextualCellPopover.tsx](src/canvas/annotations/ContextualCellPopover.tsx) ve [editorFeedback.ts](src/ui/editorFeedback.ts) ile sınırlı. Solver, hareket/çarpışma, kayıt şeması, depolama, üretim yazıcıları, bağımlılıklar ve yayın yapılandırması değişmedi. Kurulum doğrulaması mevcut mm aralıklarını kullanır; kullanıcı ölçüleri uygulama tarafından seçilmez. Raf düzenlemesinde fiziksel sığma ve şema denetimi mevcut komutta kalır.

## Test, derleme ve üretim doğruluğu

| Kontrol | Sonuç |
|---|---|
| Başlangıç `npm test -- --run` | **222/222**, 14 dosya |
| Son `npm test -- --run` | **232/232**, 15 dosya; ayrı koşuda 5,05 sn. [Günlük](artifacts/ux-functional-audit/candidate-tests.log) |
| Yeni regresyonlar | [10 test](tests/ux-editing.test.ts): aralık dışı/boş/eksik sayı, geçerli tamsayı ve işaret, iki kurulum senaryosu, gerçek dış/iç çekmece modeli, gerçek raf/ayakkabılık komutu. Escape, menü örtüşmesi ve odak doğrudan tarayıcıyla sınandı. |
| `npm run build` | Geçti; TypeScript ve Vite. Başlangıçtaki Zod açıklama ve büyük JS parçası uyarıları sürüyor. [Günlük](artifacts/ux-functional-audit/candidate-build.log) |
| `npm run deploy:check` | Geçti; 12 statik dosya, 3.307.650 bayt, en büyük JS 1.887.990 bayt. Wrangler **dry-run**. [Günlük](artifacts/ux-functional-audit/candidate-deploy-check.log) |
| Son derleme tarayıcı | Yerel `dist`: canvas görünür, örneklenen konsol hata kaydı yok. Gerçek JSON, PDF, CSV, tek SVG ve ZIP indirildi. 25 A3 PDF, 69 satır × 25 sütun CSV, 25 SVG/29 ZIP girdisi, CRC ve ZIP içi JSON/CSV eşleşti. Düz JSON ve CSV başlangıç indirmeleriyle bayt düzeyinde aynı. [Son dosya doğrulaması](artifacts/ux-functional-audit/dist-export-check.json) |
| Kör köşe dosya kapısı | 35 A3 tanısal PDF ve tanısal damgalı SVG indirildi. Tam CSV ve ZIP kapalı. [Kare](artifacts/ux-functional-audit/browser/47-after-diagnostic-gate.jpg) |
| Dört kanonik örnek | Düz 69, beşgen 94, kör 81, asimetrik 94; **338 fiziksel parça**. Tasarım, tam çözülmüş model ve üretim modeli parmak izleri aynı. Arşivden ayrıştırılan tasarım da aynı. Önceden teslim edilen dört PDF yeniden üretilmedi veya değiştirilmedi. [Önce](artifacts/ux-functional-audit/baseline-designs.json) · [Sonra](artifacts/ux-functional-audit/candidate-designs.json) |
| Veri ve canlı sürüm | 137 korunan dosyanın SHA-256 değeri aynı. Uzak `main` aynı ve denetim dalı gönderilmedi. Canlı HTTPS dosyaları başlangıç paketiyle yeniden eşleşti. [HTTP](artifacts/ux-functional-audit/live-after-http.json) |

Bir eşzamanlı build/test koşusunda mevcut Aşama 4 “75 işlem sonrası checkpoint/Redo” testi 5 saniye sınırını aştı; 231 geçti, 1 zaman aşımı. Aynı kaynakta ve aynı `npm test -- --run` komutuyla, derleme ve test tarayıcıları kapandıktan sonra **232/232** geçti. Test, timeout ayarı ve checkpoint kodu değiştirilmedi. [Zaman aşımı günlüğü](artifacts/ux-functional-audit/candidate-tests-concurrent-timeout.log)

[64 tarayıcı ekranı, boyut ve adım indeksi](artifacts/ux-functional-audit/screenshot-index.md) · [Ham tarayıcı gözlemleri](artifacts/ux-functional-audit/browser-results.json). Ekranlar ve sentetik indirmeler yerel kanıt dizininde; kişisel tasarımlar, arşiv dosyaları ve kanıt çıktıları commit’e dahil edilmedi.

## Açık sorunlar ve kullanıcı kararı

1. **Kapalı cephe:** P0 **WS-UX-001–003** açık. Canlı hareket bildirimleri 5,1°/110°, 12,8°/110° ve kör çekmecede alt sürgü engelini yeniden üretti. Kör çekmecenin erişim tanısı 49/451 mm. Açık önizleme ilgili kapağı ve donanımı kaldırıyor. Kendi tasarımınızda açık aralık kabul edilecekse bunu kullanıcı seçmeli; kapalı yüz gerekiyorsa ölçü ve gerçek donanımla ayrı teknik görev gerekir.
2. **Sürgü/çekmece kapanış sırası:** P1 **WS-UX-009** açık. Güvenli elle yol: kanadı park et, çekmecelerin kapanmasını bekle, sonra kanadı kapat. Otomatik sıralama istenirse hareket ve fiziksel sınırlar ayrı tasarlanıp doğrulanmalı.
3. **Kullanım öncelikleri:** 6 P2 ve 2 P3 envanterde. Mobil `+` örtüşmesi, uzun 2D kadraj, A/B etiketi, ilk kullanım ve raf terimleri iyileştirme adayları. Performans için önce ön plan CPU/GPU izi alınmalı. Gerçek telefon, işletim sistemi işaretçi iptali, uzun oturum ve fiziksel montaj doğrulamaları açık. Bölme sıralama bir ürün kararıdır. Gelecek hata listenizi mevcut kimliklerle birleştirip önceliği birlikte belirleyin.

## Yayın kararı ve sonraki sıra

Yerel adayın beş arayüz düzeltmesi regresyon kontrolünü geçti ve dört üretim örneği korundu. Bu denetimi tam üretim veya kapalı köşe kabulü saymayın. Sıra: kullanıcı hata listesini envantere ekle → kapalı cephe ve kapanış sırasını doğrula → gerçek mobil deneme ve ölçümlü performans profili → ayrı yayın talimatı gelirse yalnız onaylanan değişiklikleri kontrollü yayına al. Açık engeller için tanısal üretim kısıtlarını koru.
