# Üç P0 kapalı köşe: gerçek donanımla mühendislik araştırması

**14 Kasım 2026 · RESEARCH_ONLY · üretim onayı verilmedi.**

Üç sorunun mevcut gövde ve kapaklarını koruyarak takılabilecek, bütün bağlantı/yük/hareket/erişim koşulları doğrulanmış bir donanım çözümü bulunmadı. Kapalı cephe mümkündür diye bütün iç hacim erişilebilir sayılamaz. En güvenilir sonraki yön, dar kanatlı bağımsız dikdörtgen modüller; ikinci yön üreticinin katlanır/pocket sistemine göre yeniden boyutlandırılmış ayrı modüldür. Bunlar henüz üretim tasarımı değildir. WS-UX-001/002/003 **BLOCKED_EXTERNAL_VALIDATION** kalır.

## 1. Taban, kapsam ve gerçek yayın

| Kontrol | 2026-11-14 gözlemi |
| --- | --- |
| GitHub `refs/heads/main`, `origin/main`, araştırma tabanı | **bd 5191052800641a 8582e 45b 21896ddcb 431a 215**; fetch ve `ls-remote` aynı |
| Ayrı dal | `research/closed-corner-hardware-engineering` |
| Worktree | `C:/dev/Wardrobe-Studio/artifacts/corner-hardware-engineering/worktree` |
| Başarılı mevcut Cloudflare build | **9ea 75ddd-9305-4961-a 6c 5-637303c 94522**; GitHub Workers Builds kontrolü `completed/success` |
| Etkin Worker | **c 1a 6055a-b 376-4317-8bbf-32409938a 10c**; resmî Deployments ekranında Ready/%100; build logunda tam UUID |
| Gerçek HTTPS | [Canlı site](https://wardrobe-studio.cagriaksoy191.workers.dev/); doğrulanmış üretim `dist` referansıyla 11 dosya HTTP200/içerik eşleşmesi |

Cloudflare ekranı salt okunur kullanıldı. Yeni push, merge, deploy, ücretli servis, backend veya veritabanı yok. Uygulama `src`, `tests`, `public`, paket kilidi, yapılandırma, kanonik örnekler ve üretim kapıları değişmedi. Eski worktree'ler, yerel raporlar, yedekler ve kullanıcı projeleri korundu. Yeni araç yalnız sentetik kopyalar üretir; tarayıcı profilini veya kullanıcı JSON'larını okumaz.

[AGENTS](AGENTS.md), [devir](AI_PLATFORM_HANDOFF.md), [değişmezler](ENGINEERING_INVARIANTS.md), [harita](CODEBASE_MAP.md), [açık işler](OPEN_ISSUES_AND_TECHNICAL_DEBT.md), [eski fizibilite](CLOSED_CORNER_FEASIBILITY.md), [son teslim](PROJECT_FINAL_HANDOFF.md), [kararlar](ENGINEERING_DECISION_LOG.md) ve [hareket yayını](SAFE_MOTION_RECOVERY_PRODUCTION_RELEASE.md) incelendi. Eski 57 denemelik prob özgün `artifacts/autonomous-ux-hardening/closed-corner-probe.mjs/.json` içinde bulundu; silinmedi veya yeni fiziksel test sayılmadı.

## 2. Yöntem ve tekrar üretme

[Bağımsız araştırma aracı](scripts/research-corner-hardware.mjs) üretimden import edilmez. Üretim çekirdeğini salt okunur çağırır, dört kanoniği referans SHA'larla sınar, üç eski adayın kopyasını ve iki opsiyonel köşe askısını yeniden çözer; ağırlık, tolerans ve yeni topoloji için ayrı analitik sonuç üretir.

```powershell
npm ci --no-fund --no-audit
npm test -- --run --maxWorkers=2 --testTimeout=30000
npm run build
npm run deploy:verify
node scripts/research-corner-hardware.mjs
npm audit
npm audit --omit=dev
```

Çıktı: worktree içindeki Git dışı `artifacts/corner-hardware-research/engineering-analysis.json`; tasarım/çözülmüş model/üretim, her kanadın kapalı ve ulaşılan hacmi, erişim adımları, eski aday açma/ters kapama izi, kütle/tolerans/topoloji hesapları. Kaynak kod ve rapor Git'tedir; dev bundle, ham JSON, üretici PDF'leri ve tarayıcı indirmeleri Git'e eklenmez.

Hareketler mevcut `motionConstraints` ve `kinematics` üzerinden tekrarlandı. **Sabit planlama pivotu gerçek gizli menteşe bağlantı kinematiği değildir.** Katlanır/pocket mekanizmaları mevcut modelde yok. Yetersiz CAD'i genel döner menteşeyle değiştirip yeni donanımı çarpışmadan geçmiş göstermedik. Yeni kavramlar için aşağıdaki boyut/yük/derinlik elemesi yapıldı; tam donanım yörüngesi `UNVERIFIED`.

## 3. Kanonik mekanik envanter

Ölçülerin kaynağı [phase5Example](src/core/presets/phase5Examples.ts), [gövde çözücüsü](src/core/solver/carcassSolver.ts), [köşe çözücüsü](src/core/solver/cornerSolver.ts), [cephe](src/core/fronts/frontGeometry.ts), [sürgü](src/core/solver/slidingSolver.ts), [kinematik](src/core/analysis/kinematics.ts) ve [üretim modeli](src/core/production/productionModel.ts). Aşağıdakiler **modelin nominal bitmiş ölçüleridir**, sahadan alınmış ölçü değildir.

| Veri | 001 beşgen | 002 asimetrik | 003 kör köşe |
| --- | --- | --- | --- |
| A/B kol uzunluğu, gövde yüksekliği | 3000/2600, 2400 mm | aynı | aynı |
| A/B derinliği | 600/600 | 600/480 | 600/600 |
| Ana panel / arkalık | 18/8 | 25/4 | 18/8 |
| Baza / üst dolgu / uç klapa | 80/40/20 | aynı | aynı |
| Köşe tüketimi A/B | 900/900 | 900/900 | 0/670; B başlangıcı 600+70 |
| Köşe dış poligon | (0,0),(900,0),(900,600),(600,900),(0,900) | (0,0),(900,0),(900,600),(480,900),(0,900) | kapalı planlama köşesi 670×670 |
| Köşe net cephe ağzı / yaprak | 399 / 388×2276×18 | 481 / 464×2276×25 | ayrı diyagonal kapak yok |
| B1 çift kanat | 841/841×2276×18 | 840/841×2276×25 | 951/952×2276×18 |
| A üst çift kanat | 521/521×555×18 | 520/521×555×25 | 866/866×555×18 |
| A alt sürgü yaprakları | 1037/1038×1698×18 | 1039/1040×1698×25 | 1148/1148×1698×18 |
| Alt ray açıklığı X | 933–2978; 2045 | 929–2978; 2049 | 712–2978; 2266 |
| Kanat merkez Z / hat aralığı | 617/647; 30 | 620,5/657,5; 37 | 617/647; 30 |
| Ray hacmi | Y86/1796,8 mm kalın; 90 mm derin | aynı | aynı |
| Sürgü üst/alt pay, bindirme | 10/10,30 mm | aynı | aynı |
| Model çekmece tam stroku | 451×3 | 454×3 | 451×3 |
| Çekmece önleri | 1016×227×18 | 1009×227×25 | 1706×227×18 |
| Kasa yanları; taban | 18×193×532; 962×8×514 | 25×193×529; 941×4×504 | 18×193×532; 1652×8×514 |
| A askı hücresi net W/H/D | 1022/1536/592 | 1015/1515/596 | 1712/1536/592 |

**Malzeme:** `warmOak` gövde ve `linenBeige` cephe; UI bunları MDFLAM görünümüyle sunar. Fiziksel üretici, levha sınıfı, yoğunluk, kaplama/bant ve gerçek kütle **UNVERIFIED**. Modelin genel donanım BOM'undaki menteşe/ray satırları seçilmiş satın alma ürünleri değildir. Çekmecenin 451 mm hareketi bir ray model numarasını kanıtlamaz.

**Pivotlar** dünya mm koordinatıdır; dikey Y ekseni etrafında döner. Kapalı açı A düz cephesine göre, işaret açılma yönüdür. Bunlar tas/delik ekseni veya gerçek dört çubuk bağlantısı değildir.

| Model / yaprak | Pivot X/Y/Z | Kapalı açı; yön; nominal açılım |
| --- | --- | --- |
| 001 köşe | 604,24/1220/879,17 | 45°;−; 110° |
| 001 A üst sol/sağ | 1933/2080,5/619 · 2978/2080,5/619 | 0°;−/+; 155° |
| 001 B1 sol/sağ | 619/1220/893 · 619/1220/2578 | 90°;+/−; 110° |
| 002 köşe | 492,06/1220/867,82 | 34,85°;−; 110° |
| 002 A üst sol/sağ | 1931/2080,5/626 · 2976/2080,5/626 | 0°;−/+; 155° |
| 002 B1 sol/sağ | 506/1220/891 · 506/1220/2576 | 90°;+/−; 110° |
| 003 A üst sol/sağ | 1243/2080,5/619 · 2978/2080,5/619 | 0°;−/+; 155° |
| 003 B1 sol/sağ | 619/1220/672 · 619/1220/2578 | 90°;+/−; 110° |

Köşe menteşeli yaprağında model alt/üst pay 2 mm. Yan başlangıç/bitiş payları 001'de 5/5,808 mm,002'de 14/3,300 mm. Bu değerler üretici montaj boşlukları değildir. Tamsayı kalıcı niyetten türeyen dönük koordinatlar ve temas hesabı hassas mm'dir; bunları fiziksel ölçüm hassasiyeti olarak yorumlamayın.

Köşe raf ağızları 001'de 399 mm, Y aralıkları 98–645/663–1210/1228–1775/1793–2342; 002'de 481 mm ve 105–643/668–1206/1231–1769/1794–2335. 874/871 mm net derinlik göstergesi poligonun sınırlayıcı ölçüsüdür; bütün rafın bu derinlikte dikdörtgen olduğu anlamına gelmez.

Köşe kulpu `barModern`: yüzeyden 27 mm çıkıntılı,11×220 mm model zarfı. Sürgü `recessedJ`: 22×320×9,5 mm zarf. Çekmece kulpu yatay yerleştirilir. Gerçek kulpun bağlantı/vida/elde tutma hacmi ve kütlesi bilinmiyor. Açık konumlar ham raporda panel+kulp poligonlarıyla saklanır; üretici aparat gövdeleri modele dahil değildir.

Tasarım tavanı 2550 mm; gerçek oda planı, duvar dikliği, süpürgelik ve yatak/oda kapısı engelleri girilmemiş. **3000×2400×2600 mm mobilya zarfı oda açılım boşluğu değildir.** Montaj yüzeyleri, vida tutunması, yüklü sehim ve yatay/düşey imalat toleransları bilinmiyor.

## 4. Tekrarlanan hata ve tarihsel adaylar

| Senaryo | Güncel kaynak sonucu | Sınır |
| --- | --- | --- |
| 001 kanonik | Güvenli rapor 5,1°/110; raf 7/7/7/0, gereken 310 mm | B1 sol kapak engeller. Doğrudan hassas constraint 5,189°; UI güvenli aşağı yuvarlamayı 5,1 gösterir. |
| 002 kanonik | 12,8°/110; raf 14/14/14/7, gereken 310 | B1 sol engeller; hassas constraint 12,831°. |
| 003 kanonik | Üç çekmece 49/451; koridor 1102/1706 | Park düzeni ve ön ray/kanat kısıtı sürer. |
| Eski 001: 1150/1050, sağ köşe, B1 tek sol 155° | B1 önce 155°, köşe 60°; raf 458/310, A çekmeceleri 451/451; açma/ters kapama tekrar hedeflere ulaştı | B1 kapalıyken köşe yaklaşık 0,07°. 1535 mm tek B1 fiziksel uygun değil. 93 parça. |
| Eski 002: 1050/1050, sağ köşe | Raf 448/310; 59,6° sonra A yan dikme; çekmece 454/454; ters kapanış geçti | 675×2276×25 mm köşe; askı sorunu sürer. 94 parça. |
| Eski 003:A1=1500,üç hat | −745/−1490 park,451/451×3; 1462/1456 mm; ters kapanış geçti | 6 mm koridor farkı, donanım kesiti yok; 82 parça. |

Eski rapordaki 71/72/44 değişen kesim, fiziksel üretim farkının tarihsel sayımıdır; yeni bir standart mekanizma eklenmedi. Tekrarlama üç seçili aday ve iki ek askı kopyasıyla sınırlı,57 taramanın kör tekrarı değil.

**Önemli ek erişim:** Kanonik A askısı 001/002/003'te 33/28/0 mm, gereken 480; sınıf `unverified`, üst sürgü rayı engel etiketli. Eski 001/002'de A askısı 32/29 mm kalıyor. Opsiyonel köşe borusu eklendiğinde 365/480 ve 355/480 mm. Model düz geçişi doğrulamaz; askıyı döndürerek kullanma veya insan kolunun erişmesi bununla kanıtlanmış değildir. Bu sonuçlar raporda gizlenmedi.

## 5. Kanat kütlesi ve moment

`m_panel=W×H×t×ρ / 10^9`, `M_panel=m×9,80665×W/2000`. Ağırlık merkezi homojen yaprakta W/2,H/2,t/2. Moment yerçekiminin **menteşe hattına eğilme yüküdür**; dikey eksen etrafında açma torku değildir. Gerçek bağlantı kuvvetleri menteşe aralığı, plaka, vida ve panel rijitliği olmadan çıkarılamaz.

Kaynak: [European Panel Federation, “Density, Mass and Sheet Size”](https://europanels.org/the-wood-based-panel-industry/types-of-wood-based-panels-economic-impact/medium-density-fibreboard/) ortalama MDF700–800, LDF<650 ve HDF>800 kg/m³ ayrımını verir; [EGGER Eurodekor MDF EPD](https://www.egger.com/get_download/971cb671-dc55-4134-910f-df1cf4795572/Environmental_product_declaration_Eurodekor_MDF.pdf?country=RO), “Fire” bölümü >600 kg/m³ koşulu içerir. Erişim 2026-11-14. EGGER belgesi bu projenin levha seçimi değildir; 600 kg/m³ bir hafif senaryo,750 orta,850 ağır stres senaryosu seçildi. Bunlar her MDF'nin garantili alt/üst sınırı değildir. Yanlış biçimde çekirdek yoğunluğu bütün levhaya uygulanmadı.

| Yaprak W×H×t, mm | Yalnız panel kg @600 /750 /850 | Panel momenti Nm @600–850 |
| --- | ---: | ---: |
| 001 mevcut 388×2276×18 | 9,54 /11,92 /13,51 | 18,14–25,71 |
| 002 mevcut 464×2276×25 | 15,84 /19,80 /22,44 | 36,04–51,06 |
| Eski dev B1 1535×2276×18 | **37,73 /47,16 /53,45** | **283,99–402,32** |
| Eski 001 köşe 675×2276×18 | 16,59 /20,74 /23,51 | 54,92–77,80 |
| Eski 002 köşe 675×2276×25 | **23,04 /28,81 /32,65** | 76,27–108,05 |
| Yeni düz yaprak 550×2276×18 | 13,52 /16,90 /19,15 | 36,46–51,65 |
| Yeni düz yaprak 550×2276×25 | **18,78 /23,47 /26,60** | 50,64–71,74 |
| Yeni dar yaprak 450×2276×25 | 15,36 /19,20 /21,76 | 33,90–48,02 |

Araç ayrıca her yaprağa 0/1/2 kg ek kütle duyarlılığı uygular. Bunlar gerçek kulp/menteşe ağırlığı değildir. Muhafazakâr serbest kenar koluyla dev B1'in 2 kg ek kütlesi 30,11 Nm daha getirir: ağır sonuç 55,45 kg/432,43 Nm. Gerçek ek kütlenin merkezi ölçülmelidir.

Sonuçlar [donanım matrisi H1–H10](CORNER_HARDWARE_EVIDENCE_MATRIX.md) ile karşılaştırıldı. Dev B1 WingLine L en/yük koşuluna uymaz; Blum'un 600 mm referansına daha çok menteşe ekleyerek 1535 mm onay çıkarılmaz. 550 mm/25 mm yaprak 25 kg sınıfında 750 kg/m³+2 kg ile 25,47 kg'a,850 senaryoda 26,60 kg'a ulaşır. 450 mm/25 mm aynı senaryolarda daha elverişli, fakat ürünle tam bağlantı ve yük eşleşmesi hâlâ yok.

## 6. Tolerans ve yeni topoloji ön elemesi

Eski 003'te **1462−1456=6 mm**, modellenen eşya/çekmece koridoru farkıdır. Her iki yanda 3 mm fiziksel ray boşluğu veya üretici toleransı değildir. Altı bağımsız etki düşünülür: imalat konumu, gövde montaj kaçıklığı, ray yerleşimi, ayar/stop konumu, yüklü sehim, hareket boşluğu. Her birinin gerçek değeri bilinmiyor.

| Her etki için varsayımsal olumsuz sapma | En kötü toplam | 6 mm'den kalan |
| ---: | ---: | ---: |
| 0 | 0 | 6 |
| 0,5 mm | 3 | 3 |
| 1 mm | 6 | **0: temas sınırı** |
| 1,5 mm | 9 | −3 |
| 2 mm | 12 | −6 |

Bu değerler katalog toleransı değildir; kırılganlık duyarlılığıdır. RSS/istatistiksel güven çıkarılmadı: dağılım, bağımsızlık ve örneklem yok. Wing 77'nin 1,5 mm üst tabla sınırı gibi gerçek ürün koşulları yalnız kendi sistemi için geçerlidir; 003'e aktarılmadı. İzin verilen minimum emniyet boşluğu üretici/atölye tarafından tanımlanıp gerçek en kötü birikimle karşılaştırılmalı.

Yeni kapalı dikdörtgen topoloji için 70 mm örnek köşe klapasıyla kullanılabilir düz kol boyları 001'de 2330/1930,002'de 2450/1930 mm hesaplandı. Eski beşgenli brüt gövde plan alanı 3,045/2,823 m²; köşeyi depolama saymayan iki düz kol 2,556/2,3964 m². Fark **0,489 m² (%16,06)** / **0,4266 m² (%15,11)**. Bu net raf alanı veya gerçek kapasite kaybı değildir; paneller, raf adedi, yeni cep hacmi ve dolgu detayları henüz kesilmedi. Kör köşede ilk 670×600 mm hacmi kullanımdan çıkarmanın brüt karşılığı 0,402 m²'dir. Kullanıcı alan kaybını ayrıca seçmelidir.

Hawa H3'ün belgeli derinlik denkliğine 25 mm yaprak, Z3=3,M2=100 senaryosu kondu: 450 mm yapraktaT2=445; 550'de 545 mm. B'nin 480 mm dış derinliği serbest mekanizma derinliği değildir. Cep eni, bitmiş iç derinlik, dışarı taşan M2, tutamak ve tespit düzlemi çözülmedi. Bu yalnız ölçü elemesi; hareket simülasyonu veya montaj kabulü değildir.

## 7. Ergonomi ve test sınırı

**310 ve 480 mm'nin kaynağı bir evrensel ergonomi standardı değil, uygulama senaryosudur.** [inventory.ts](src/core/analysis/inventory.ts) katlanmış kıyafeti 280×360, gömlek askısını 450×520 mm tanımlar; [functionalAccess.ts](src/core/analysis/functionalAccess.ts)30 mm nominal handling ekleyerek 310/480 gereksinimini türetir. 30 mm'nin antropometrik validasyonu yok. Askı zarfı; elin/kolun eklemleri, elbiseyi eğerek çıkarma, gerçek kumaş deformasyonu ve erişim kuvvetini içermez.

[U.S. Access Board, §308 ve engel üstünden erişim rehberi](https://www.access-board.gov/aba/guides/chapter-3-operable-parts/) yaklaşma alanı, derinlik ve erişim yüksekliğinin birlikte ele alınmasını gösterir. Erişim 2026-11-14. ABD erişilebilir yapı/operatör kapsamıdır; Türkiye'deki bu gardırobun mevzuat kabulü veya 310/480 doğrulaması değildir. Kişiye özgü boy, erişim, tutma ve gerçek askıyla 1: 1 prova gerekir.

Mevcut askı borusu üretim planındaY2272 mm. Yazılımın 1620 mm kişi için 1701 günlük/2025 üst erişim sınırları da planlama varsayımıdır. Dar kapı açıklığı çözülse bile bu yüksekliğe rahat erişim varsayılamaz. Günlük askı ve raflar kullanıcının ölçülmüş sınırına taşınmalı; üst yüklük ayrı kapalı erişimle değerlendirilmelidir. Bu görevde varsayılan yükseklik değiştirilmedi.

## 8. Regresyon ve kabul kanıtı

| Kontrol | Sonuç |
| --- | --- |
| Temiz `npm ci` | Başarılı, paket kilidi değişmedi |
| Mevcut testler | **19 dosya,284/284**, CI ayarı 2 worker/30 saniye; build ile eşzamanlı çalıştırılmadı |
| TypeScript/Vite | Başarılı; mevcut Zod annotation / büyük chunk uyarıları hata sayılmadı |
| Statik paket doğrulama | `deploy:verify` PASS; yerel araştırma build'i 12 içerik dosyası,3.326.715 bayt |
| Audit tam / üretim | **0 /0** bilinen bulgu |
| Dört kanonik | **12/12 Design/ResolvedModel/ProductionPackage SHA aynı**; [tam referanslar](ENGINEERING_INVARIANTS.md) |
| Fiziksel parça | **69+94+81+94=338** |
| Bağımsız araştırma | Hata değerleri, üç tarihsel adayın açma/ters kapaması, kütle/moment birim kontrolü, tolerans eşiği ve tanısal SVG/gate kaynak koşulları geçti |
| Canlı üretim kapıları | İzole IAB, yalnız sentetik dört kaynaktan üç P0: tam CSV/ZIP gerçekten disabled; PDF/SVG açık |
| Gerçek canlı indirmeler | 001/002/003: **41/41/35 A3** PDF; PDF ve SVG'lerde tanısal damga doğrulandı; tarayıcı warn/error kaydı yok |
| Fiziksel test | **Yapılmadı**; üretim onayı verilmedi |

Canlı varlık kontrolünde araştırma worktree'sinin yeni build'i önce farklı hash'li dosyalar istedi. Sebep: yerel araştırma dosyaları taranırken Tailwind'e eklenen kullanılmayan `.contents` kuralı; eski/yeni CSS farkı yalnız bu kuraldı. Olmayan hash adresine statik SPA fallback'i 200/HTML dönebildiğinden bu ilk eşleştirme **başarısız** kaydedildi. Ardından aynı `bd51910` tabanının önce doğrulanmış üretim `dist`iyle 11 dosyanın tamamı eşleşti. İlk başarısız kontrol geçilmiş sayılmadı ve yeni araştırma build'i yayına gönderilmedi.

Yerel kanıt kökü: `C:/dev/Wardrobe-Studio/artifacts/corner-hardware-engineering/`; `tests.log`, `build.log`, `audit*.json`, `live-https.json` (ilk fark), `live-production-reference.json` (üretimle eşleşme), `engineering-probe-final.log`, `sources/`, `browser/verification.json` ve tanısal indirmeler. Kritik sayılar ve kaynaklar bu Git raporunda kalıcıdır; özel/üretilmiş dosyaları klona taşımak gerekmez.

## 9. Karar

Ürün seçimi için [kanıt matrisi](CORNER_HARDWARE_EVIDENCE_MATRIX.md), uygulanabilirlik karşılaştırması için [adaylar](CORNER_DESIGN_CANDIDATES.md), sahada gereken asgari bilgiler ve kabul için [fiziksel kontrol listesi](CORNER_PHYSICAL_VALIDATION_CHECKLIST.md) birlikte okunmalı. Sonraki güvenli yazılım işi, seçilmiş tek üretici konfigürasyonunu CAD/BOM ve ölçülmüş toleranslarla **ayrı deneysel fikstürde** temsil etmek; kanonik tasarım/şema/üretim kilidine entegrasyon ancak ayrı inceleme ve onayla yapılır.
