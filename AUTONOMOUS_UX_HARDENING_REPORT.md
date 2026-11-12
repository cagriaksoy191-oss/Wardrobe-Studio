# Wardrobe Studio — otonom UX ve işlev doğrulaması

12 Kasım 2026 · Yerel dal: `fix/autonomous-ux-hardening`.

Başlangıçta açık 12 bulgunun **8'i adayda düzeltildi ve tarayıcıda doğrulandı**. Büyük model performansı **kısmen** iyileşti. Üç **P0** bulgu için kapalı cephe adayı ölçüldü; fiziksel doğrulama açık. Üretime merge, push veya Cloudflare yayını yapılmadı. [Yaşayan envanter](CURRENT_ISSUE_STATUS.md) canlı ile adayı ayrı gösterir.

Başlangıç `5de4fad8358cf1221673a94bdaee1a67b591bb22` uzak `main` ile aynıydı. Cloudflare Builds denetimi başarılıydı; `b64f824d-4031-43c7-b52b-761f6a21a186` yönetim ekranında %100 trafik alıyordu. [Canlı HTTPS parmak izi](artifacts/autonomous-ux-hardening/final-live-fingerprint.json) son kontrolde eski dağıtımın 11 yanıtıyla eşleşti. Son ürün kaynak commit'i `0ae96abde978953687e7946ba09a5facdd531be4`; sonraki commit'ler yalnız bu raporlardır.

## Düzeltmeler ve yeniden üretim

| Bulgu | Önce / neden | Düzeltme, yeniden üretim ve sonuç |
| --- | --- | --- |
| **009 · sürgü/çekmece** | Düz üç rayda kanat 2 982, kanat 1 1964 mm park. Çekmeceler açıldıktan sonra `Home` kanadı 1458,05 mm'de durdurdu. Kapatma komutuna rağmen çekmece 86,05 mm açık kaldı. Yeni kısıt hesabı da engel gördü; yalnız eski bayrak veya sayısal titreme değildi. Düğme komutu, gerçek pozu anlatmıyordu. | `motionSimulator.ts` ve `MotionController.tsx` gerçek pozdan komut/engel durumunu açıklıyor. Kanadı kullanıcı `End` ile geri park etti; önce “kapanıyor”, sonra “çekmece kapandı”; `Home` 0 mm. Engel gerçekten kalkmış ayrı testte eski manuel uyarı yeniden hesaplanıp temizlendi. Çarpışma zarfı, hedef toleransları ve manuel kanat davranışı korunuyor; karşı taraf kendiliğinden park edilmiyor. [Önce](artifacts/autonomous-ux-hardening/02-before-slide-stop.jpg) · [sonra](artifacts/autonomous-ux-hardening/05-after-slide-stop.jpg) · [kinematik ölçüm](artifacts/autonomous-ux-hardening/motion-before.json). |
| **010 · yeşil artılar** | İlk L, A3 boş bölme, hücre editörü açık. Sahneye projekte edilen düğmenin merkezi, bağımsız HTML düzenleyici kutusunun altına geliyordu. 390 ve 360'ta her iki kontrol isabetsiz. | `SceneHtml.tsx`, `RunEndAddBayOverlay.tsx`, `WardrobeCanvas.tsx`, `index.css`: editör açıkken veya tuval 500 CSS px ve altındayken aynı yeşil düğmeler sahne araçları yanına alınır. Panel, ölçülen araç çubuğu altından başlar; darda alttan açılır ve kendi içinde kayar. Seçim korunarak doğru A/B dialogları açıldı ve odak düğmeye döndü. Geniş ve seçimsiz tuvalde eski sahne düğmeleri var. [Önce](artifacts/autonomous-ux-hardening/03-before-mobile-plus.jpg) · [sonra, 360](artifacts/autonomous-ux-hardening/08-after-mobile-plus.jpg). |
| **013 · A/B** | Arşiv listesinde bir sürüm seçip A/B açınca kaynak taşınmıyordu; B alanının açık erişilebilir adı yoktu. [Önce](artifacts/ux-functional-audit/browser/14-before-ab.jpg). | `VersionPanel.tsx`: A çalışma kopyası adıyla gösterilir. Listede görünür ve seçili kayıt B'ye gelir; seçim yoksa B boş. İki farklı sentetik kayıt, seçimsiz açılış ve arşivlenen kayıt `[Arşiv]` etiketiyle doğrulandı. [Sonra](artifacts/autonomous-ux-hardening/10-after-version-compare.jpg). |
| **014 · 2D kadraj** | Büyük L, A=5700 mm; 928 CSS px tuvalde sabit 195 zoom, kapalı cephenin uçlarını kesti. [Önce](artifacts/autonomous-ux-hardening/04-before-long-front.jpg). | `frontViewFit.ts` ve `WardrobeCanvas.tsx`: kapalı panel, kanat, çekmece ve ray zarflarının gerçek X/Y veya Z/Y izdüşümü; tuval boyuna göre zoom ve etiket payı. İlk açılış ve otomatik modda yeniden boyutlandırma, ayrı A/B manuel pozları ve açık sıfırlama var. A ve B=5700, ayrıca kısa B=2500, A/B derinliği 600/520. 928→390→928 tuval, tekerlek yakınlaştırma, görünüm değiştirip geri dönme ve sıfırlama gerçek tarayıcıda. Sağ tuş başlangıcına eşlenen gerçek sürüklemede etikette +42,3 CSS px pan, reset sonrası aynı piksel. Ek kontrolde bulunan 9,9 px atalet artığı giderildi; 90 çerçeveli regresyon testi var. Kamera dizisi öncesi ve sonrası JSON bayt eşit. [Uzun A](artifacts/autonomous-ux-hardening/06-after-long-front-a.jpg) · [uzun B](artifacts/autonomous-ux-hardening/07-after-long-front-b.jpg) · [390 px](artifacts/autonomous-ux-hardening/16-after-long-front-390.jpg) · [kısa B](artifacts/autonomous-ux-hardening/17-after-short-front-b.jpg). |
| **017 · Escape** | Chromium `type=search` ilk Escape'te metni temizliyordu, dialog ikinci Escape'te kapanıyordu. [Önce](artifacts/ux-functional-audit/browser/21-before-production-preview.jpg). | `ProductionPanel.tsx` arama alanında Escape'i dialog kapatmaya yönlendiriyor. `P-12D9E348` yazılıyken tek Escape; dialog kapandı, “Paftaları ve kesim listesini geniş önizle” odaklandı. IME oluşturma kontrolü var; gerçek IME senaryosu çalıştırılmadı. [Sonra](artifacts/autonomous-ux-hardening/11-after-production-search.jpg). |
| **012 · ilk kullanım** | Temiz kök varsayılan erişim uyarılı beşgeni doğrudan gösteriyordu; uyarının örneğe ait olduğu ve sonraki adım belirsizdi. | `App.tsx`, `useWardrobeStore.ts` ve bölme dialogu: yalnız boş oturum kesinleşince küçük, kapatılabilir yönlendirme. Kendi gardırobunu oluştur, hazır örnek incele ve JSON aç ayrı. Temiz köklerde üçü de kullanıldı, oluşturma ve örnek listesi odağı doğrulandı. A/B, dış/net, oda/gardırop, sabit/esnek açıklaması ilgili formda. Beş F5 sonrasında kayıt döndü, rehber açılmadı; yeni alan kalıcı zarfın parçası değil. [Önce](artifacts/autonomous-ux-hardening/01-before-first-use.jpg) · [sonra](artifacts/autonomous-ux-hardening/12-after-first-use.jpg). |
| **015 · raf/aralık** | A5 dört rafla beş aralık oluşturuyordu; ekleme ve düzenleme ayrı birimleri tek sayı gibi gösteriyordu. [Önce](artifacts/ux-functional-audit/browser/17-before-shelf-multiselect.jpg). | `RunEndAddBayOverlay.tsx`, `ContextualCellPopover.tsx`, `App.tsx`: raflı başlangıç 4/5, ayakkabılık 5/6, köşe ayrı. İlk L A5 seçildi → tüm aralıklar → 6 aralık. Etiket 4 fiziksel raf/5 aralık → **5/6** oldu. Solver/adet anlamı aynı. [Sonra](artifacts/autonomous-ux-hardening/19-after-shelf-count.jpg). |
| **016 · klapa** | “Üst Taç” etiketi `topFillerHeightMm` değerine yazıyordu. [Önce](artifacts/ux-functional-audit/browser/13-before-body-dimensions.jpg). | `App.tsx`: **Üst klapa (mm)**, dolgu yüksekliği açıklaması ve Gömme sekmesindeki dekoratif taç ayrımı. Kanonik kör örneğin kopyasında 40→50 mm yazıldı; JSON aynı alana yazıldığını gösterdi. [Sonra](artifacts/autonomous-ux-hardening/15-after-top-filler.jpg). |
| **011 · büyük model** | Önceki denetimde yaklaşık 72–74 ms kare p95 raporlanmıştı. Bu çalışma ayrı ve karşılaştırılabilir bir profil çifti topladı. | `WardrobeMeshGroup.tsx` ve `WardrobeCanvas.tsx`: sahne alt bileşenleri aynı girdilerde React çizimini atlıyor, seçimin olay işleyicileri sabit. Seçili hücre kümesi, raycast ve tüm sahne ayarları korundu. Ölçüm aşağıda; **PARTIAL**. |
| **001–003 · kapalı cephe** | 5,1° ve 12,8° köşe sınırları; kör köşede 49/451 mm. | 57 model denemesi ve aç/kapat tekrarları. Hiçbir aday varsayılana, kullanıcı tasarımına veya üretim kurallarına yazılmadı. [Ayrı fizibilite](CLOSED_CORNER_FEASIBILITY.md). |

## Tarayıcı ve ekran matrisi

Chromium, Windows, izole tarayıcı ve sentetik örnekler. Baseline `4201`; çalışma `4202`; üretim paketi yerel önizleme `4203`. Derlenmiş son paket `index-rW07DHam.js` gerçek WebGL sahnesiyle açıldı; son önizlemede konsol hata/uyarı sayısı 0. 3D fare dönüşü, kamera sıfırlama ve üst plan çalıştı. [Son paket](artifacts/autonomous-ux-hardening/20-final-build-webgl.jpg).

| Boyut | Önce, editör açık A/B merkez | Aday, açık A/B | Aday, kapalı A/B | Derlenmiş pakette akış |
| --- | --- | --- | --- | --- |
| 1600×900 | ✓ / ✓ | ✓ / ✓ | ✓ / ✓ | [Yeni L, A raf, editör/kaydırma, geçersiz ölçü, 2D/üst/3D, kayıt/F5](artifacts/autonomous-ux-hardening/matrix-1600.jpg) |
| 1366×768 | ✓ / ✗ | ✓ / ✓ | ✓ / ✓ | [Aynı akış; editör kaydırması klavye odağıyla ayrıca](artifacts/autonomous-ux-hardening/matrix-1366.jpg) |
| 1024×768 | ✓ / ✗ | ✓ / ✓ | ✓ / ✓ | [Aynı akış; editör kaydırması klavye odağıyla ayrıca](artifacts/autonomous-ux-hardening/matrix-1024.jpg) |
| 390×844 | ✗ / ✗ | ✓ / ✓ | ✓ / ✓ | [Aynı akış; fare kaydırması](artifacts/autonomous-ux-hardening/matrix-390.jpg) |
| 360×800 | ✗ / ✗ | ✓ / ✓ | ✓ / ✓ | [Aynı akış; klavye kaydırması, ayrıca gerçek B2 ekleme ve Ctrl+Z/Ctrl+Y](artifacts/autonomous-ux-hardening/matrix-360.jpg) |

✓ hem `elementFromPoint` ile merkez isabeti, hem gerçek tarayıcı tıklaması, doğru kol dialogu ve kapanışta odak dönüşü. 20/20. Mobilde iki durumda da 44×44 CSS px. Bağlamsal editör beş boyutta ekran içinde; 360'ta dikey kaydırma ile alt kontroller erişilebilir.

- Fare ve klavye: gerçek sürükleme sırasında test düzeneğinden `pointercancel`, `blur` ve Escape ayrı verildi. Üçünde de önizleme ve seçim temizlendi; sonraki normal sürükleme 130 hücre seçti. Ek deneyde gerçek fare sürüklerken odak test çerçevesinden dış düğmeye alındı: tarayıcı `isTrusted=true` blur üretti; seçim öncesi ve sonrası boş. 2D pan testinde gerçek fare hareketi kullanıldı, sağ tuş başlangıcı test düzeneği tarafından eşlendi. Escape ve Tab ile sayısal alan odak kaybı ayrıca canlıda gözlendi.
- Sınır: 390/360 ölçüleri masaüstü Chromium görünümüdür. Fiziksel telefon, yerel dokunma/pinch, işletim sistemi kaynaklı pointer iptali veya bağımsız kullanıcı kabul oturumu yok. Test düzeneği gerçek pencerenin uygulamalar arası odağını değil, tarayıcıdaki çerçevenin gerçek odak kaybını ölçer.
- Kanıt dizini: [ölçü ve ekran görüntüsü indeksi](artifacts/autonomous-ux-hardening/browser-results.json). Her sahne ekran görüntüsünde kullanılan örnek bu indekste kayıtlıdır. Gerçek kullanıcı tasarımları kullanılmadı. Canlı testte ayrı tarayıcıdaki eski sentetik çalışma kopyasına dönüldü.

## Gerçek performans profili — WS-UX-011

Karşılaştırma, A–D değişikliklerinden sonraki aynı kaynak üzerinde, yalnız E değişikliği öncesi/sonrası. Aynı Chromium 157, ön plan odağı, 1600×900 pencere, 928×810 piksel WebGL tuvali, DPR ~1, aynı 14 bölme/144 hücre sentetik L ve aynı düzenleme ayarları. LED ve 3D eşyalar açık. Kutu seçimi X-Ray; dört aynı sürüklemenin her birinde 130 hücre. Hareket normal kapak görünümünde, kapak/çekmece aç komutları, yaklaşık 5,5 sn sonra kapama, toplam yaklaşık 11,7 sn; sunum aynı sahnede yaklaşık 11,1 sn. Önceki raporun 54 hücre ölçümüyle sayısal olarak kıyaslanmaz.

| Etkileşim ve metrik (ms) | Önce p50 / p95 | Sonra p50 / p95 |
| --- | ---: | ---: |
| Kutu seçimi, kare aralığı (293→261 kare) | 38,2 / 228,1 | **34,4 / 145,6** |
| Kutu seçimi, React sahne render süresi (50→51 örnek) | 127,3 / 187,2 | **16,1 / 49,3** |
| Kutu seçimi, projeksiyon + seçilebilirlik (36→36) | 0,3 / 0,5 | 0,2 / 0,9 |
| Kutu seçimi, R3F ana render öncesi CPU | 0,4 / 0,9 | 0,4 / 0,9 |
| Kutu seçimi, Three ana render çağrısı CPU | 28,4 / 36,3 | 25,7 / 36,4 |
| Hareket, kare aralığı (103→113 kare) | 102,8 / 278,1 | 99,6 / 230,5 |
| Hareket, çarpışmalı hareket adımı CPU | 71,7 / 82,1 | 70,1 / 85,1 |
| Sunum, kare aralığı (237→226 kare) | 44,7 / 71,6 | 47,3 / 69,2 |
| Sunum, Three ana sahne render çağrısı CPU | 20,3 / 27,1 | 21,3 / 27,5 |

React Profiler `actualDuration`, `performance.now`, Long Tasks, hareket adımı ve Three sayaçları alındı. Kutu seçiminde React sahne p95 yaklaşık %74, kare p95 %36 düştü; 50→51 React örneğinde toplam 5455→1077 ms. İşaretçinin projeksiyon ve seçilebilirlik süresi toplam 9,5→9,4 ms; ana darboğaz değildi ve projeksiyon önbelleği eklenmedi. Vurguya ait reaktif iş azaldı; hover store yazımının p95'i 0,2 ms kaldı. Aynı örneklerin hiçbirinde etkileşim aralığında solver veya izlenen dünya kutu/ekstrüzyon fabrikası çağrısı yoktu; bu iz sürümü diğer Three/drei iç tahsislerinin sıfır olduğunu göstermez.

Kutu seçiminde çizim çağrısı p95 her iki ölçümde 1668, üçgenler yaklaşık 164 bin, canlı geometri p95 1577. GPU zamanı ayrı zamanlayıcıyla ölçülmedi; Three süreleri ana iş parçacığı/driver beklemesi içerebilir. Sunumda dokuların medyanı 8'den 18'e çıkıyor; iki ana sahne çağrısı/kare ve ek geçişler var. Tekil LED veya materyal etkisi ayrıştırılmadı; etkiler değiştirilmedi. Hareket p95 farkı ile daha kısa React işi gözlendi, ancak kinematik adım hızlanmadı. Sunumda karışık sonuç var. Bu yüzden yalnız doğrulanmış render optimizasyonu tutuldu, kinematik ve sunum ayrı açık. Yerel ölçüm aracı ve iptal düzeneği yayın kodundan çıkarıldı. [Ham profiller](artifacts/autonomous-ux-hardening/browser-results.json) · [Sunum görünümü](artifacts/autonomous-ux-hardening/09-after-performance-presentation.jpg).

## Regresyonlar, paket ve güvenlik

- Başlangıçta **232/232**, 15 dosya. Son dalda **242/242**, 17 dosya; `npm test -- --run --maxWorkers=2 --testTimeout=30000` Windows Node 24.16.0 / npm 11.13.0 üzerinde. +3 hareket testi (karşılıklı engel, eski uyarının kalkması, hızlı komut/iptal), +5 kamera testi (gerçek Three projeksiyonu ve sağ pan ataleti), +2 boş/IndexedDB oturumu testi. [Test çıktısı](artifacts/autonomous-ux-hardening/final-tests.log).
- TypeScript/Vite, statik doğrulama ve `wrangler deploy --dry-run` başarılı. Statik doğrulayıcı 12 yayın dosyası, 3.315.699 bayt toplam, en büyük dosya 1.895.696 bayt; tanımlı Free sınırları içinde. Zod saf çağrı notu ve Vite ana paket boyutu uyarısı var; ikisi de derlemeyi engellemedi. Bağımlılık, Cloudflare ayarı ve statik güvenlik kuralları değişmedi; tam ve üretim `npm audit` 0 bulgu. [Derleme ve kuru koşu](artifacts/autonomous-ux-hardening/deploy-check.log).
- Düz **69**, beşgen **94**, asimetrik **94**, kör **81** = **338**. Dört modelin tasarım, çözülmüş geometri ve üretim SHA-256 imzaları birebir. Bu karşılaştırma kapak kesimi, beşgenler, erişim uyarıları ve üretim verisini kapsar. [Son imzalar](artifacts/autonomous-ux-hardening/final-models.json).
- Tarayıcıda B2 çekmece adedi 4→3; ön yüz yüksekliği 762→700 mm, komşu 762→824, üçüncü 762 mm; tek çekmece aç/kapat. A kolu 3000→3100 mm olduğunda A1 kapakları 204/205→214/215 mm, yükseklik 2326 mm. Adlandırılmış A/B sürümleri, manuel kayıt ve F5, mobil Geri Al/Yinele, geçerli JSON çevrimi ve geçersiz JSON'dan sonra çalışma kopyasının bayt eşitliği doğrulandı.
- Gerçek düz üç ray çıktıları: JSON 3000 mm; CSV 69 parça × 25 sütun, BOM/ayraç/benzersiz kod; PDF 25 A3 sayfa, kapak, malzeme, genel çizim ve son sayfa örnekleri render edildi; SVG arşivdeki birebir paftayla eşleşti. ZIP 29 dosya, 25 SVG, CRC temiz, JSON/CSV birebir ve üretim JSON 69 parça. Kör köşe 35 A3 tanısal PDF ve damgalı SVG; CSV ve ZIP pasif. [İçerik denetimi](artifacts/autonomous-ux-hardening/candidate-export-check.json) · [Tanısal kapak](artifacts/autonomous-ux-hardening/blind-diag-render-01.png).
- Canlıda 004–008 yeniden sınandı: geçersiz 999999 ve boş form, Escape sonrası 2550, dış çekmece açıklaması, JSON'dan sonra odak ve erişim, 48 aralıktan 12 gruba 5'er aralık ve bayt eşit Undo. Çoklu seçimde bir ara DOM örneğinde önceki sayı göründü; yerleşen hedef boş, otomatik işlem yok. Canlı tarayıcı konsol hatası 0. [Canlı kanıt ve yerel sonuçlar](artifacts/autonomous-ux-hardening/browser-results.json).
- Önceden kaydedilen 137 korumalı dosyanın hash'i aynı, eksik dosya yok. Önceki audit, kullanıcı tasarım/yedekleri, yerel kayıt sözleşmesi ve adlandırılmış sürümler korunuyor. QA indirmeleri, görüntüler ve deney düzeneği yalnız Git tarafından dışlanan kanıt dizininde.

## Yayın adayları ve sonraki adım

| Grup | Yerel commit | Yayın kararı |
| --- | --- | --- |
| A · güvenli hareket | `1f9fa55` | Ayrı onayla yayınlanabilir. Fiziksel engel koruması sürer. |
| B · ekleme ve yerleşim | `72a2826` | Ayrı onayla yayınlanabilir. Gerçek telefon ergonomisi sonraki kontrol. |
| C · kamera, A/B, Escape | `27faada`, `0ae96ab` | İkisi birlikte yayınlanabilir; ikinci commit pan ataletini temizler. |
| D · ilk kullanım ve terimler | `a134ac3` | Ayrı onayla yayınlanabilir. Gerçek yeni kullanıcıyla anlaşılabilirlik henüz ölçülmedi. |
| E · render işi | `f4284e3` | Ölçülen kutu seçimi iyileştirmesi yayınlanabilir. Kinematik/sunum düzeltmesi diye sunulmaz. |
| F · mekanik fizibilite | [Ayrı rapor](CLOSED_CORNER_FEASIBILITY.md) | Deneysel tasarımlar, donanım veya yeni üretim paftaları yayınlanmaz. |

Açık işler: **P0 3**, **P1 0**, **P2 1**, **P3 0** yerel adayda. Öncelik, kapalı cephe donanımı ve yüklü 1:1 prototip; ardından büyük modelde `constrainMotion` CPU maliyeti ve zamanlayıcı destekli GPU/sunum karşılaştırması. Fiziksel cihaz, gerçek yeni kullanıcı ve atölye değerlendirmesi bu yazılım kontrollerinden ayrıdır.
