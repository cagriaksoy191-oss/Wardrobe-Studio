# WS-UX-009a · güvenli hareket sıralaması uygulama ve kabul raporu

14 Kasım 2026 · **Yerel aday doğrulandı; yayın yapılmadı.**

## 1. Referans, kapsam ve teslim

- Dal: `feat/safe-motion-recovery`.
- Taban: `origin/main` **`17ed1fe76e0c17c7a8b601e778e81acce3689429`**, uzak Git üzerinden başlangıçta ve son kontrolde doğrulandı.
- Önceki uygulama kaynak tabanı: `9e0e3da0409b731596d0c1edaf178b1876950c92`.
- Uygulama ve test commit'i: **`9624f90f3957165feb0d4f45c252deaade7e8546`**.
- Çalışma ağacı: `C:\dev\Wardrobe-Studio\artifacts\safe-motion-recovery\worktree`.
- Kanıt kökü: `C:\dev\Wardrobe-Studio\artifacts\safe-motion-recovery`.
- Üretim adresi: <https://wardrobe-studio.cagriaksoy191.workers.dev/>. Bu görevde `main` merge/push, GitHub push veya Cloudflare deployment yapılmadı. Görev girdisindeki son doğrulanmış Worker `660674f5-e629-4736-a08b-ae63d9ff99e3`; bu oturumda panel/üretim trafiği yeniden doğrulanmadı.

Özgün çalışma ağacı, diğer worktree'ler, araştırma dalları, yedekler ve önceden bulunan takip edilmeyen `PRODUCTION_SECURITY_RELEASE_VERIFICATION.md` korundu. Kişisel tasarım veya üretim profilinin kayıtları kullanılmadı. Backend, bağımlılık, şema ve ücretli hizmet eklenmedi.

## 2. İncelenen mimari ve doğrulanmış kök neden

Yaşayan devir belgeleri, AGENTS sözleşmesi ve önceki hareket raporları okundu. Yerel tarihsel raporlar gerçekten `artifacts/motion-camera-production-release/reports/` altında bulundu: `INTERACTION_RESIDUAL_FIXES.md`, `MOTION_AND_RENDER_PROFILE.md`, `MOTION_CAMERA_PRODUCTION_RELEASE.md`. Kök `AUTONOMOUS_UX_HARDENING_REPORT.md` de incelendi.

`MotionSimulator`, `Design`/`ResolvedModel` üzerinden kurulan sahnede gerçek poz, hedef, hız, engel ve manuel duruşları tutar. `MotionController` R3F kare başında simülatörü çalıştırır. Sahne öğeleri geçici pozları doğrudan okur. Store açık/kapalı isteklerini sağlar; bu pozlar Design veya üretim verisi değildir. `createMotionConstraint` aynı hareket sahnesindeki kesin hacimleri yeniden kullanan mevcut çarpışma sınırıdır.

Eski sistemde tekil hedefler, `manualStops` ve `closingDrawerId` vardı; birden çok adıma sahip işlem, ortak işlem sahipliği ve bütün bekleyen adımları birlikte iptal eden koordinatör yoktu. İki ayrı kapanış komutu karşılıklı fiziksel engeli ortadan kaldıramıyordu. Engel gerçektir; temel çarpışma hesabı hatası olarak değerlendirilmedi.

## 3. Eski sürümün gerçek tarayıcıda yeniden üretimi

İzole IAB tarayıcısında, sentetik üç raylı düz örnekle taban uygulama port 5501'de çalıştırıldı. İkinci kanat 982 mm, birinci kanat 1964 mm park edildi; üç çekmece açıldı. Kanadı kapatma isteği **1458,05 mm**'de durdu. Çekmeceleri kapatma isteği yaklaşık **86 mm** açık kaldı ve manuel geri park açıklaması gösterildi. Adayın daha hassas ölçümü **86,05 mm**; eski QA göstergesi çekmece değerini tamsayıya yuvarlıyordu.

Kapanma isteği engelin içinden geçirilmedi. Aynı sentetik durum yeni 31 testin ve tarayıcı kabulünün başlangıcıdır. Kanıt: `baseline-blocked.jpg`, `regression-evidence.json`.

## 4. Seçilen sınırlı çözüm

[safeMotionRecovery.ts](src/core/analysis/safeMotionRecovery.ts) yalnız **bir sürgü kanadı ve o kanadın kapanışını engelleyen çekmeceler** için deterministik sıra arar. Mevcut poz, izinli uç parklar ve açık hedef değerlendirilir. Aday yollar kopyalanmış pozlarda aynı kesin doğrusal süpürme denetiminden geçer. Planlama gerçek kullanıcı pozunu, hedefini veya tasarımını değiştirmez.

Bilinen örneğin hesaplanan beş adımı:

1. Birinci sürgüyü **1964 mm**'ye geri park et.
2. Çekmece #1'i **0**'a kapat.
3. Çekmece #2'yi **0**'a kapat.
4. Çekmece #3'ü **0**'a kapat.
5. Birinci sürgüyü **0 mm**'ye kapat.

İkinci kanat **982 mm**'de kalır. Genel robotik planlayıcı, eşzamanlı kanat taşıma veya diğer kanatları kendiliğinden yerleştirme eklenmedi. Başka kanat/statik engel parkı kapatırsa plan reddedilir. Kullanıcıya gerekçe ve manuel yöntem gösterilir; güvenli plan olmadan otomatik eylem sunulmaz.

## 5. İşlem sahipliği, gerçek tamamlanma ve iptal

Simülatör tek işlem kimliği, başlangıç pozları, sahne kimliği, sahip olunan adımlar, beklenen pozlar ve mevcut adımı tutar. Başlatma sırasında güncel sahne, gerçek pozlar, komut revizyonu ve yeniden hesaplanan plan uyuşmalıdır. Eski/değiştirilmiş önizleme, bekleyen yeni komut ve çift başlatma reddedilir.

Her adım başlamadan güncel tam yol tekrar denetlenir. Normal spring hareketinin her yer değiştirmesi de mevcut çarpışma sınırından geçer. Sonraki adıma geçiş yalnız **gerçek poz tam hedefte ve hız sıfır** olduğunda yapılır. Bir adıma hedef komutu verilmesi tamamlanma sayılmaz. Hedefe ulaşamayan adım 10 saniye simülasyon süresinde başarısız olur; kalan adımlar çalışmaz.

İptal, sahip olunan tüm hedefleri gerçek pozlarında tutar ve hızlarını sıfırlar. Yeni açık manuel istek gelmedikçe iptal edilmiş kapanışlar yeniden oynatılmaz. İşlem planı/önizleme referansları tamamlanma ve iptalde bırakılır; terminal bildirim yalnız küçük bir durum nesnesidir. Çift başlatma mevcut sahibin yerini alamaz.

| Değişiklik | Davranış ve doğrulama |
| --- | --- |
| İptal düğmesi | Tüm kalan adımlar sonlanır; 4 ayrı zaman noktasında otomatik test ve 390×844 tarayıcı testi. |
| Kapak/çekmece komutu, aynı değerli komut dahil | Store komut revizyonu işlemi iptal eder. Yalnız yeni manuel istek devam eder. |
| Manuel sürükleme | Pointer capture / `dragTo` işlem sahipliğini bırakır; manuel hareket de aynı çarpışma sınırında kalır. |
| Yeni çözülmüş sahne/engel | Eski işlem sahne değişiminde iptal edilir. Gerçek uygulamada Design yeniden çözümü, önceden var olan politika gereği yeni sahneyi home pozlarında başlatır; eski plan yeni sahnede çalışmaz. |
| Çalışan adımda yeni fiziksel limit | Güncel sınır başarısızlığı işlemi durdurur, adım ilerlemez. Birim testinde gerçek constraint ile doğrulandı. |
| Ölçü, bölme ekle/sil, JSON, Undo/Redo, adlandırılmış sürüm | Gerçek store girişleriyle yeni `ResolvedModel` üretildi; `load` iptali 7 ayrı testte doğrulandı. |
| React unmount | Gerçek App root'u QA düğmesiyle kaldırıldı; cleanup `cancelled` üretti, son pozlar sabit kaldı. |

## 6. Arayüz ve erişilebilirlik

Gerçek engel ve doğrulanmış plan varsa **“Güvenli sırayla kapat”** görünür. Açıklama hesaplanmış adımların parça adlarından üretilir; hareket edecek üç çekmece dahil bütün parçalar önceden listelenir. Kullanıcı başlatmadan hareket olmaz. Çalışırken adım mesajı, `Adım n/5`, tamamlanan adımlar için erişilebilir `<progress>` ve **“Güvenli sırayı iptal et”** sunulur.

Başlat/iptal/tamamlandı düğmesi aynı DOM öğesinde kalır; Enter ile geçişlerde odak korundu. Düğme yüksekliği 44 CSS px; 360 ve 390 CSS px genişlikte ekran sınırları içindeydi. Tamamlanan işlemin eski engel uyarısı temizlenir. Mobil kontroller masaüstü tarayıcı viewport testidir; fiziksel telefon veya ekran okuyucu kabulü yapılmadı.

## 7. Gerçek tarayıcı sonuçları

Gerçek R3F sahnesi, uygulama store'u ve `motionRuntime` ile sentetik QA sayfaları kullanıldı. Hazırlık/engel/unmount için görünür QA düğmeleri; kurtarmayı başlatmak ve iptal etmek için **ürünün gerçek düğmeleri** kullanıldı. Pozlar görünür QA çıktısından okundu. QA HTML'leri yalnız yok sayılan `artifacts/qa/` altında; üretim paketine eklenmedi.

| Senaryo | Gözlenen sonuç |
| --- | --- |
| 1600×900 masaüstü | Beş adım tamamlandı: kanat **0**, üç çekmece **0/0/0**, ikinci kanat **982 mm**. 3D ve sonrasında 2D cephe çalıştı. |
| 360×800 viewport | Enter ile başlatma, görünür ilerleme, `completed` 5/5; gerçek son pozlar **0 / 0/0/0**, diğer kanat **982 mm**. Tamamlanma düğmesi odakta kaldı. |
| 390×844 viewport iptal | Enter ile başlat/iptal; kanat **1792,87 mm**, çekmeceler **86,05 mm**. Sonraki ayrı gözlemde değerler aynen kaldı. |
| İptal sonrası manuel kurtarma | Geri park, çekmeceleri kapat, kanadı kapat: **0 / 0/0/0**, bildirim temiz. |
| Ters yönlü çekmece komutu | Otomatik işlem `cancelled`; kanat **1901,74 mm**'de kaldı, yeni manuel açma isteği çekmeceleri **451 mm**'ye götürdü. Eski son kapatma oynatılmadı. |
| Yeni engel içeren JSON | `Sahne değişti` ile iptal; yeni sahnede bütün home pozları **0**, sonraki gözlemde eski işlem başlamadı. |
| Komutsuz başlangıç | Altı hareketli parçanın pozları **0**, işlem `null`; iki ayrı gözlemde değişmedi. |
| Gerçek React unmount | Çalışan adım iptal edildi; kanat **1898,9433407519787 mm**, diğer kanat **982 mm**, çekmece pozları **0,19079822594235019** (normalize strok). Sonraki gözlem birebir aynı. |

Her ara hedefin tam pozuna ve sıfır hızına varması deterministik testte ayrı ayrı doğrulandı; tarayıcıda başlangıç, ara ilerleme ve son pozlar ayrıca gözlendi. Kararlı son kabul sekmelerinde **konsol warning/error ve WebGL hatası yok** (`console-results.json`: `[]`). Geliştirme sırasında Vite yenilemesi QA hazırlık referansını sıfırladığında eski QA sekmesinde iki `reference.first` TypeError görüldü; bunlar kaydedilmiş üretim davranışı olarak sayılmadı. Son kabul temiz sekmelerde tekrarlandı. Uzun GPU stres testi yapılmadı.

## 8. Testler ve kalite kapıları

| Kontrol | Sonuç |
| --- | --- |
| `npm ci` | Başarılı; 226 paket kuruldu, 227 paket denetlendi. Kilit dosyası değişmedi. |
| `npm test -- --run --maxWorkers=2 --testTimeout=30000` | **19 dosya, 284/284**; 253 mevcut + **31 yeni** test. Son koşu 20,26 sn. |
| `npm run build` | TypeScript + Vite başarılı. |
| `npm run deploy:check` | Build, statik doğrulama, Wrangler **dry-run** başarılı; gerçek deploy yok. |
| `npm audit` | **0** bilinen bulgu. |
| `npm audit --omit=dev` | **0** bilinen üretim bağımlılığı bulgusu. |
| `git diff --check` | Başarılı. |

Yeni testler: bilinen duruş, saf planlama, bütün gerçek ara hedefler, 4 zaman noktasında iptal, ters/aynı değerli komut, sürükleme, çift başlatma, bozulmuş/eski plan, NaN, yeni engel/sahne, hedefe varamama, diğer kanadın parkı kapatması, 1e-9 poz farkı, 7 store değişikliği, verilerin korunması, manuel kurtarma, fiziksel nüfuz regresyonu ve tekrarlanan durumun tek store bildirimi üretmesi.

İlk yeni test derlemesindeki TypeScript TS2367 daraltma hatası test döngüsünün durum okumasında düzeltildi. Windows'ta çalışan Vite native modülü kilitlediği için bir `npm ci` denemesi EPERM verdi; yalnız bu görevin Vite süreci durdurulup temiz kurulum ve bütün kalite zinciri başarıyla tekrarlandı. Bu başarısız denemeler başarılı sayılmadı. Son kapılarda hata yok. Mevcut Zod yorum annotation ve Vite büyük chunk uyarıları sürüyor.

Statik doğrulayıcı 12 içerik dosyası, **3.326.688 bayt**; en büyük JS **1.906.253 bayt** bildirdi. Wrangler 14 varlık taradı, bağlama bulunmadı ve `--dry-run: exiting now` ile çıktı. QA, kişisel tasarım, env veya yedek dosyası üretim varlıkları arasında yok.

## 9. Hareket, çarpışma ve performans regresyonları

`motionConstraints.ts`, `kinematics.ts`, çözücüler, üretim/export kodu, `ProductionPanel`, paketler ve Wrangler yapılandırması değişmedi. Tolerans, hacim, sweep ve mevcut kesin poz cache'i korunuyor.

Taban/aday karşılaştırmasında dört kanonik örnek için sabit 1/60 sn, aç/kapa ve sürükleme girişleriyle **4×293 = 1172** kare alındı. Her karede gerçek pozlar, hedefler, hızlar, duruşlar ve bildirimler derin eşit çıktı. Yeni otomatik sıranın her yer değiştirmesi ayrıca değişmemiş `constrainMotion` ile tekrar sınandı: daha fazla fiziksel nüfuz yok.

Plan arama kullanıcıya teklif hazırlanırken, durağan engel durumunda çalışır; poz revizyonuna göre saklanır. Çalışan işlemde plan araması her karede tekrarlanmaz. React'e poz/hız akışı eklenmedi. Aynı durumun 600 kez yayımlanması **bir** store bildirimi verdi. Yeni CPU/GPU p95 eşdeğerlik iddiası yapılmıyor; önceki cache kodu korunması, eşit hareket izleri ve bildirim testi bu görevdeki kanıtlardır. WS-UX-011 ve uzun WebGL kaynak ömrü kabulü ayrı kalır.

## 10. Design, kayıt ve üretim doğruluğu

Hareket, işlem ve komut revizyonu geçicidir. Sahip olunan hedefler kapanışla senkronlanırken Design JSON, checkpoint, Undo geçmişi ve ileri geçmişi birebir aynı kaldı. Gerçek drawer kimlikleriyle test edildi. Adlandırılmış sürüm açma yeni çözümle eski işlemi iptal eder. Adlandırılmış sürüm arşivine yazma veya otomatik sürüm oluşturma eklenmedi. Mevcut kayıt/JSON/Undo/Redo testleri de 284 testin içinde geçti.

Dört kanonik modelde Design, ResolvedModel ve ProductionPackage SHA-256 değerleri tabanla ve [mühendislik değişmezlerindeki](ENGINEERING_INVARIANTS.md) 12 imzayla birebir eşit. Parça sayıları **69 / 94 / 81 / 94 = 338**. Ayrıntılı imzalar yerel `regression-evidence.json` içinde; imza yöntemi ve klonda çalıştırılabilen komut değişmezler belgesinde korunuyor.

| Model | A3 PDF sayfası | CSV satırı / sütun | Geçerli XML SVG | ZIP girdisi |
| --- | ---: | ---: | ---: | ---: |
| Düz | **25** | **69 / 25** | 25 | **29** |
| Beşgen | 49 | 94 / 25 | 49 | 53 |
| Kör köşe | 35 | 81 / 25 | 35 | 39 |
| Asimetrik | 49 | 94 / 25 | 49 | 53 |

Mevcut `node scripts/phase5-fixtures.mjs` tekrar çalıştırıldı. Dört PDF `pdfinfo` ile açıldı; tamamı A3 yatay (**1190,55×841,89 pt**). 158 SVG XML olarak ayrıştırıldı. CSV'ler ayrıştırıldı, ZIP merkez dizinleri açıldı ve girdiler sayıldı. Bunlar varsayılan iç QA pafta düzeninin sayılarıdır; kompakt ürün paftası seçenekleriyle köşe sayfa sayısı farklı olabilir. Bütün sayfalar için yeni görsel PDF kabulü iddia edilmiyor.

Üç P0 örneğin işlevsel erişimi hâlâ **blocked**. İç QA üreticisi bunlar için tanısal inceleme dosyaları ve doğrudan iç CSV/ZIP üretebilir; bu, ürün indirme kilidinin açılması değildir. Ürün panelinin `diagnostic` koşullu tam CSV/ZIP engelleri ve tanısal PDF/SVG yolu aynen korunmuştur; ilgili erişim/çıktı testleri geçti.

## 11. Güncellenen belgeler ve kanıtlar

Hedefli güncellendi: `AI_PLATFORM_HANDOFF.md`, `CODEBASE_MAP.md`, `PROJECT_FINAL_HANDOFF.md`, `ENGINEERING_INVARIANTS.md`, `OPEN_ISSUES_AND_TECHNICAL_DEBT.md`, `ENGINEERING_DECISION_LOG.md`, `CURRENT_ISSUE_STATUS.md`. Bu rapor yeni eklendi. Ana sözleşmeler, AGENTS, README ve tarihsel raporlar yeniden yazılmadı.

Yerel kanıtlar: `final-ci.log`, `final-tests.log`, `final-build.log`, `final-deploy-check.log`, `final-audit.log`, `final-audit-production.log`, `final-production-exports.log`, `compare-regression.mjs`, `regression-evidence.json`, `export-evidence.json`, `browser-results.json`, `console-results.json` ve beş ekran görüntüsü. Üretilen sentetik dosyalar aday worktree'de `artifacts/phase5/examples/` ve `output/pdf/` altında. QA HTML'leri ve bu kanıt klasörü Git ignore kapsamında; kişisel veri içermez.

## 12. Açık sınırlar, WS-UX-009a durumu ve yayın kararı

**WS-UX-009a: IMPLEMENTED_AND_BROWSER_VERIFIED_PENDING_RELEASE.** Bilinen tek kanat/çekmece durumunun sınırlı kabulü sağlandı. **Üretimde kapanmış sayılmadı.** Güvenli uç park bulunamayan ara parklar, başka kanatların taşınmasını gerektiren zincirler ve genel köşe mekanizmaları otomatik destek iddiası taşımaz. Manuel kurtarma korunur.

WS-UX-001/002/003 P0 fiziksel doğrulama ve tam CSV/ZIP engelleri sürer. WS-UX-011, WebGL kaynak birikimi, B1/B2 ve reddedilmiş marquee adayları değiştirilmedi veya birleştirilmedi. Gerçek menteşe, donanım, ray toleransı ve yük altında fiziksel kullanım bu yazılım kabulüyle onaylanmış olmaz.

Ayrı yayın onayına önerilen içerik: **`9624f90f3957165feb0d4f45c252deaade7e8546` uygulama/test commit'i ve onu izleyen bu rapor dahil yalnız dokümantasyon commit'i**. Dokümantasyon commit'inin kesin kimliği teslim yanıtında ve `git log -2` ile bulunur. Onay gelene kadar bu dal yerelde kalır. Onaylı gelecek yayında güncel `origin/main` uyumu, aynı CI kapıları, Cloudflare Linux sonucu ve gerçek HTTPS kabulü ayrıca doğrulanmalıdır.
