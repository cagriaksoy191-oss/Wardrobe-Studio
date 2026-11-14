# D3 deneysel parametrik CAD kabul raporu

**14 Kasım 2026 · DENEYSEL CAD — ÜRETİM ONAYI YOK**

Sonuç: iki ölçü ailesi için tekrarlanabilir bağımsız gövdeli D3 geometrisi oluşturuldu. İncelenen 12 H5 varyantı `EXPERIMENTAL_GEOMETRY_PASS`, erişim `ACCESS_PARTIAL`, donanım `HARDWARE_UNVERIFIED`, fiziksel kabul `PHYSICAL_TEST_REQUIRED`. Hiçbir aday üretime onaylı veya varsayılan çözüm değildir. İki H1 satırı yalnız kapalı gövde/yaprak ölçüsü ön elemesidir; H1 hareket/erişim/oda alanı `NOT_MODELED`/UNKNOWN.

## Korunan taban ve kapsam

- Uzak `main`: `bd5191052800641a8582e45b21896ddcb431a215`; gerçek Cloudflare panelinde Ready/%100: Worker `c1a6055a-b376-4317-8bbf-32409938a10c`, build `9ea75ddd-9305-4961-a6c5-637303c94522`.
- Önceki araştırma: `research/closed-corner-hardware-engineering`, `f8a7e7f72222a996d746a78c767be2f497a102b8`. Bu commit üzerinde yeni `research/d3-corner-cad-prototype` worktree'si kuruldu: `C:\dev\Wardrobe-Studio\artifacts\d3-corner-cad\worktree`.
- Önceki dalın `src`, test, public, package, Vite ve Wrangler dosyaları main ile aynı; eski araştırma worktree'si ve ilk kökteki kullanıcıya ait izlenmeyen raporlar korundu.
- Bu görevde solver, Design v1, 3D sahne, kayıt, kapak varsayılanı, kanonik örnek, üretim CSV/ZIP kilidi ve canlı uygulama değiştirilmedi. Main merge/deploy yapılmadı. Ücretli hizmet veya donanım siparişi yok.

## Gerçek geometri ve yeniden üretim

Mantıksal kaynak commit'i `8937015` (araç), bağımsız test commit'i `32e9334` (24 test). Raporlar ayrı dokümantasyon commit'inde saklanır; Git HEAD ve uzak gönderim sonucu görev sonu tesliminde verilir.

`research/d3/README.md` çalıştırma rehberidir. `node research/d3/generate.mjs`, iki orijinal + 12 H5 + iki H1 olmak üzere **16 satır**, 16 SVG, 16 geometri JSON, karşılaştırma JSON ve HTML üretir. 34 dosyanın SHA-256 manifesti iki bağımsız çalıştırmada **34/34** eşleşti. JSON'lar üretim kesim paketi veya uygulamaya import edilebilir gardırop dosyası değildir.

İki ayrı **geçerli düz Design v1** aynı mevcut çekirdekte çözülür; A dünya X yönünde ötelenir, B X/Z yansıtmasıyla yerleştirilir. Kapalı servis kutusu altı ayrı paneldir. Birleştirilmiş analiz bağlamı kalıcı Design v1 L modeli olarak sunulmaz. `startFillerMm` şema sınırı 300 mm'dir; 550/670 mm köşe tüketimi bu alana zorla yazılmaz. Ayrı bileşen uzunluğu ve açık montaj dönüşümü kullanılır.

Kesim ve niyet ölçüleri tamsayı mm'dir. Modül dağıtımı 2 mm adımlıdır; mevcut merkez yuvarlamasının tek mm genişliklerde oluşturabileceği yarım mm hizalama farkını önler. Hareket/izdüşüm koordinatları kesirli olabilir. Bu adım veya 40/70/100 mm dolgu **üretici toleransı değildir**.

Her gövde ayrı iki yan, taban, tavan ve arkalığa sahiptir. Baza 80, üst klapa 40, uç dolgu 20 mm korunur. Dış zarf 3000/2600 × 2400 mm; derinlikler 001'de 600/600, 002'de 600/480. Gövde netleri 001'de genişlik `modül−36`, derinlik 592, yükseklik 2244; 002'de `modül−50`, A derinlik 596/B 476, yükseklik 2230 mm. Hareketli/katı parçalar `.cad.json` içinde gerçek koordinat ve ölçüleriyle bulunur.

| Aile / analitik dolgu | Servis W×D mm | A modülleri mm | B modülleri mm | Kapak yaprakları mm |
|---|---|---|---|---|
| 001 / 40 | 640×640 | 780+780+780 | 970+970 | 386–482 |
| 001 / 70 | 670×670 | 770+770+770 | 954+956 | 381–475 |
| 001 / 100 | 700×700 | 760+760+760 | 940+940 | 376–467 |
| 002 / 40 | 520×640 | 820+820+820 | 646+646+648 | 317–404 |
| 002 / 70 | 550×670 | 810+810+810 | 636+636+638 | 312–399 |
| 002 / 100 | 580×700 | 800+800+800 | 626+626+628 | 307–394 |

70 mm örneğinde kalan 2330/1930 ve 2450/1930 mm uzunluklar **uç dolgu dahil** alanlardır; gövdelerin toplamı 2310/1910 ve 2430/1910 mm'dir. 550/450 mm başlangıç üst sınırları korunur; algoritma bu sayıları kapak genişliği olarak zorla üretmez. Gerçek uzun yapraklar 2276 mm, çekmece üzerindeki kısa yapraklar 001'de 1622, 002'de 1608 mm'dir.

İki iç düzen karşılaştırılır: `shelf`, ilk A modülünde üç dış çekmece + üst askı, diğerlerinde raf; `hanging`, ikinci A modülünün beş rafını ikinci 1700 mm askıya çevirir. Çekmece bankı 620 mm; kanonikte 690 mm idi. Bu **araştırma kapasite tercihi** hacim ve çekmece kaybına dahildir. 001 shelf/hanging: 106/102 modellenmiş panel, 10 kapak, üç çekmece, 19/14 ayrı raf paneli; 002: 117/113 panel, 12 kapak, üç çekmece, 23/18 raf paneli. Panel toplamı boru ve hareketli parçaları da içerir; onaylı kesim listesi değildir. Destek yüzeyi sayıları tabanları da içerdiği için ayrıca 22/16 ve 27/21'dir.

## Çarpışma ve kapalı yüz

12 H5 varyantının her birinde katı panel çiftleri ve kapalı başlangıç hareketli parçaları: **0 pozitif çakışma**. Katı SAT denetimi Y'de ve plan düzleminde 0,05 mm üstünü hata kabul eder; tolerans testleri geçirtmek için gevşetilmedi. Altı servis panelinin hacmi + iç boşluk = dış kutu hacmi testi geçti. Normal kapalı yüz; kapaklar, dış çekmece önleri ve tam derinlikli sabit raf/taban kenarları birlikte sayılarak sınandı; tasarlanmış ≤4 mm derzler hariç depolama yüksekliğinde açıklık yok. Bu hava/su sızdırmazlık veya montaj onayı değildir.

Orijinal 002'de daha sıkı araştırma denetimi **20 adet 0,5 mm plan örtüşmesi** buldu: köşe yanları/poligon raflar ve bazı sağ yan/raf birleşimleri. Mevcut uygulama doğrulayıcısının “0 kritik hata” bilgisiyle aynı kontrol değildir. Bu kanonik geometri değiştirilmedi; araştırma eşiğinde `NO_GO` olarak gösterilir. Orijinal iki modelin A1 üst cephesinde açık alan da vardır; D3'ün tam kapalı cephe sonucu kanoniklere aktarılmaz. Net hacimleri mevcut nominal çözümlenmiş hücre hesabıdır, bu sınırlar fiziksel kapasite onayı üretmez.

## Hareket ve erişim sınırları

H5, mevcut sabit pivot/katı kulp zarfıyla `IDEALIZED_HINGE_SIMULATION` olarak sınandı. 70/100 mm'de her modülün kendi iki kapağını sırayla 90° açma ve ters kapama çevrimleri kapanmış duruma döner; ilgili dış çekmeceler tam modellenen stroka gidip geri döner. 40 mm'de ilk köşe yakın kanat 001'de yaklaşık89,3°, 002'de88,2°'de durur; buna rağmen seçilen düz eşya senaryosu için yeterli açık duruş bulunur. 40 mm, onaylı 90° minimum çözüm ilan edilmez.

Bütün kapakları sırayla155°'ye, sonra bütün çekmeceleri açma stres denemesi komşu kanatlarda durur. Ters kapama sonunda 12 varyant da kapanır. Özellikle 002/70'te bu kalabalık duruş çekmeceleri yaklaşık401 mm'de sınırlar; komşular kapalıyken489 mm mümkündür. “Hepsi aynı anda tam açık” gereksinimi varsa bu yerleşimler **NO_GO**. Normal araştırma kullanım koşulu: komşu modülü kapat, hedef modülü kullan, ters sırayla kapat. Gerçek Blum bağlantısının eksen değişimi, menteşe/kulp ölçüsü, engelli oda ve fiziksel kapama sırası hâlâ doğrulanmadı.

Raf çıkarma koridoru 310×390×70 mm; askı senaryosu480×550×850 mm. Bunlar 280×360 ve450×520 mm eşyalara30 mm model payı eklenmesinden gelir; insan standardı değildir. Raf alanı yalnız açık cephe genişliğiyle geçirilmez: gerçek destek poligonu dikdörtgenle daraltılır, her kabul edilen merkez aralığının bütün düz çıkarma süpürmesi statik/açık hareketli katılara karşı sınanır. 20 mm derinlik örneklerinin güvenli ayak izleri birleşimi muhafazakâr alt sınırdır. Diğer yolların başarısızlığı iddia edilmez.

Askıda ölçülen uzunluk **480 mm zarf merkezinin doğrudan çıkarılabildiği boru üzerindeki aralıktır**. Borudan kancayı ayırma/döndürme modellenmedi; kendi askı borusu çıkarma testinde hariçtir. Bu yüzden `CONDITIONALLY_ACCESSIBLE`; gerçek erişilebilir boru boyu UNKNOWN ve insan boyu/kuvveti `UNVERIFIED_PHYSICAL` kalır. Tam boruyu erişilebilir saymak yanlış olur.

## Doğrulama

| Kontrol | Sonuç |
|---|---|
| Temiz `npm ci --no-fund` | PASS, 0 açık |
| `npm test -- --run --maxWorkers=2 --testTimeout=30000` | 19 dosya, **284/284** |
| `node --test research/d3/cad.node-test.mjs` | **24/24** ayrı deterministik test |
| TypeScript/Vite build | PASS; mevcut büyük chunk uyarısı sürer |
| `npm run deploy:check` | PASS, statik denetim + Wrangler **dry-run**, yayın yok |
| `npm audit`, `npm audit --omit=dev` | İkisi de 0 açık, exit0 |
| Kanonik Design/Resolved/Production SHA-256 | **12/12**, 69/94/81/94 = **338 parça** |
| Araç tekrar üretimi | **34/34 dosya SHA** eşit |
| Aynı f8 araştırma tabanı build'i | **12/12 dosya** birebir aynı |
| Gerçek canlı HTTPS | Üretim bd51910 dist'ine göre **11/11 dosya** aynı |
| Üç P0 canlı UI | CSV/ZIP devre dışı; tanısal PDF41/41/35 ve SVG indirmeleri çalışır |

İlk CAD testinde kayan noktalı kütle eşitliğinin katı karşılaştırması başarısız oldu; bağımsız doğru kg değerine küçük sayısal toleransla düzeltildi. Son24 testin tamamı geçti. Tarayıcıdaki son kör-köşe kontrol çağrısı araç zaman aşımına uğradı; yeniden bağlanıp81 parça/35 pafta/49mm engel ve kapalı CSV/ZIP güncel DOM'da doğrulandı. Başarısız/eksik kontrol geçmişi gizlenmedi. Görsel incelemede paftanın açık planı cephe başlığına taşıyordu; ölçek düzeltildi, 001/002 ve H1 son paftaları yeniden incelendi.

Yeni araştırma klasörü `.gitignore` ile Tailwind otomatik taramasından ayrılmış, dosyalar açıkça Git'e eklenmiştir. Önceki `scripts/research-corner-hardware.mjs` nedeniyle var olan `.contents{display:contents}` kuralı bu görevde temizlenmedi. Bu nedenle f8 build'i, **üretim main build'iyle aynı değildir**; yeni D3 kaynaklarının ek katkısı yoktur. Üretim kaynak farkı yok ve canlı main paketi ayrı doğrulandı. Araştırma build'i yayın adayı değildir.

Ham kanıtlar: worktree altında `artifacts/d3-cad/output/`, `artifacts/d3-cad/repeated/`; üst dizinde `application-tests.log`, `cad-tests.log`, `final-build.log`, `deploy-check.log`, `audit-all.json`, `audit-production.json`, `live-reference.json`, `live-ui.json`. Raporlar ve araştırma kaynakları Git'te; büyük sentetik kanıtlar artifacts içinde.

Cloudflare “Builds for Preview branches” anahtarı kapalı (`0`), üretim dalı main olarak **salt okunur** doğrulandı; ayar kaydedilmedi/değiştirilmedi. Bu koşul altında araştırma dallarının özel depoya yedeklenmesine izin vardır. Kesin gönderilen branch/SHA bilgisi görev sonu teslimindedir; bu dosya bir üretim yayını talimatı değildir.
