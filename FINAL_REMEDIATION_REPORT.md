# Wardrobe Studio · Son düzeltme ve kabul raporu

5 Kasım 2026 · C:\dev\Wardrobe-Studio

**30 bulgunun 25'i RESOLVED, 2'si PARTIAL, 3'ü EXTERNAL. Dört P1 bulgusu kapandı.** Yazılım regresyonları ve nominal üretim paketi denetimi tamamlandı. Son sürümde gerçek işaretçi, ön plan WebGL performansı ve tarayıcı indirme kabulü açık.

[344 maddelik yeniden kontrol](C:/dev/Wardrobe-Studio/FINAL_REQUIREMENTS_RECHECK.md) · [Önceki denetim](C:/dev/Wardrobe-Studio/FINAL_AUDIT.md)

## Başlangıç ve koruma

Başlangıç denetimi dört P1, yirmi P2, üç P3 ve üç dış doğrulama kaydı içeriyordu. Kod değişikliğinden önce 7 dosyada 120 test ve üretim derlemesi geçti. Kaynak, test, yapılandırma, genel varlık ve proje belgelerinin 84 girdilik arşivi alındı. Önceki yedeklerin, dört denetim belgesinin, sözleşmelerin, eski testlerin ve dört eski PDF'nin kayıtlı SHA-256 değerleri karşılaştırıldı. **20/20 eşleşme**. Yeni belgeler, PDF'ler ve kanıtlar ayrı ad ve dizinlerde. Çalışma tarayıcı origin'i `127.0.0.1:5182` idi. 5173 ve 5175 kullanıcı origin'lerine test işlemi uygulanmadı.

[Değişiklik öncesi arşiv](C:/dev/Wardrobe-Studio/artifacts/final-remediation/phase5-audit-before-remediation.zip) · [Koruma kontrolü](C:/dev/Wardrobe-Studio/artifacts/final-remediation/preservation-check.json)

## 30 bulgunun sonucu

| Bulgu | Durum | Değişiklik ve kanıt |
|---|---|---|
| AUD-001 | RESOLVED | Oturum ve okuma revizyonu geç IndexedDB sonucunu sınırlar. Yeni proje, JSON, sürüm, checkpoint ve Undo/Redo yarışları, normal yenileme ve daha yeni depo seçimi otomatik testte. |
| AUD-002 | RESOLVED | Grafik, kimlik, kol ekseni, öncelik, bitişik cephe kapsamı, örtüşme ve desteklenen türler ortak kapıdan geçiyor. Eski eş kalınlıklı separate yapılar açılıyor. Bozuk oturum ve sürüm verisi kurtarma indirmesinde saklanıyor. Boş BOM, test edilen sabit kesişmeler ve tavan ihlali üretimi engelliyor. |
| AUD-003 | RESOLVED | Organizer 4 × 3 aralıkları tamsayı dağıtımla kapanıyor. Kesim ve yerleşim aynı kenarlardan. 3/4/8/18 mm ve birden çok genişlikte regresyon. Dört dosyada 48 eski kesişme, yeni geometride 0. |
| AUD-004 | RESOLVED | İsteğe bağlı arka ofsetle seçilen gerçek dünya sınırı korunuyor. 600 dış / 592 net → 500 net arka ayarında gövde 508 mm, ofset 92 mm, ön düzlem 600 mm. A/B büyütme ve küçültme, komşu ve ray, Undo/Redo test edildi. |
| AUD-005 | RESOLVED | 50 mm yan kasa ve 18 mm taban örneğinde net 32 mm. Minimum uyarısı fiziksel boşluğu değiştirmiyor. Net kutu, envanter ve teknik ölçü aynı çözümden. |
| AUD-006 | RESOLVED | Baza ve üst bitiş dahil çözülmüş en üst kot, oda ve girilmiş montaj payıyla karşılaştırılıyor. 1800 mm oda / 3000 mm dolap kritik ve üretime kapalı. |
| AUD-007 | RESOLVED | IndexedDB ve localStorage ayrı yazma girişimleri. İki başarı, tek başarı ve iki hata ayrı durumlar. Kayıt revizyonu eski sonucu geçerli duruma uygulamıyor. |
| AUD-008 | RESOLVED | Çözülen her menteşeli kanatta >600 mm genişlik uyarısı. Çift, özel, kısmi ve köşe kanatları ortak denetimde. |
| AUD-009 | RESOLVED | Tamsayı niyetle yarım mm merkezler ve açılı pivot koordinatları korunuyor. A/B, sol/sağ ve çift kanatların kapalı panel merkezi kinematikten tekrar hesaplandı. |
| AUD-010 | RESOLVED | Kısa, orta ve uzun profiller sırasıyla 850, 1000 ve 1400 mm envanter düşey gereksinimine bağlı. 35 mm boru altı payı hesaba katılıyor. 1035 mm elle seçilen boru örneğinde konum korunuyor ve profil uyarısı değişiyor. |
| AUD-011 | RESOLVED | Beşgen köşe askısı seçilebilir. Boru en yüksek uygun aralıkta poligon içinde çözülüyor. Kapasite muhafazakâr askı bölgesinden geliyor. Erişim uyarısı, boru boyu ve iki taşıyıcı listeleniyor. |
| AUD-012 | RESOLVED | Beşgen kolun gereken minimumu komşu ön düzleme göre hesaplanıyor. 600 mm gibi sığmayan niyet gerekli A/B boylarıyla reddediliyor. Kör klapa 45 mm altında giriş sınırında reddediliyor. |
| AUD-013 | RESOLVED | L birleşiminin iki kolunda farklı ana panel veya arkalık kalınlığı ortak doğrulamada açıkça reddediliyor. Eş 18/8, 25/4 ve 18/3 kalınlıkları ile farklı A/B derinlikleri çalışıyor. |
| AUD-014 | RESOLVED | Genel 3D eşya anahtarı servis nişi dahil tüm eşya ağacını kapatıyor. Genel ve servis anahtarlarının dört kombinasyonu React bileşeni üzerinden sınandı. |
| AUD-015 | RESOLVED | Kıyafet ve raf örnekleri sabit mm boyutlu. Sığmayan örneğin boyutu ve mevcut boşluk uyarıda görünür. 944 mm hacimde 1220 mm elbise gizleniyor ve yeterli hacimde aynı 1220 mm ile çiziliyor. Envanterin boyut varsayımları ayrı. |
| AUD-016 | RESOLVED | A ve B iç paftalarında arkalık geriye, ilgili raflar ön katmana çiziliyor. Her iki beşgen B1 sayfası 17, çizim sırası testi ve PNG ile kontrol edildi. |
| AUD-017 | RESOLVED | Kapalı kanat merkezi, pivot, yön, derz, ray ve bindirme, kulp yüzeyi ve donanım kodları üretim modelinde ve 15-KAPAK paftasında. Patlatılmış gövde ve köşe şemaları parça kodlarına bağlı. İç açı ve düzlemde dış dönüş ayrı. |
| AUD-018 | RESOLVED | 32 mm satırlar modülün alt iç yüzünden raf altına ölçülüyor. Etkinleştirme, +32 ve Undo ile raf ve komşu boşlukları test edildi. Teknik pafta satırları gösterir. |
| AUD-019 | RESOLVED | Ortak validationConfig askı, kanat, raf, çekmece neti, depolama ve köşe eşiklerini taşıyor. 519/520/525/529 mm uyarır, 530 mm sınırı geçer. |
| AUD-020 | PARTIAL | Tekrarlanan parçalar InstancedMesh, iç nokta ışığı kol başına bir, Sunum modunda gerçek GTAO. N8AO tercih farkının, görsel kalitenin ve ön plandaki kare bütçesinin kabulü bekliyor. |
| AUD-021 | RESOLVED | A/B tablo yerleşimi, eş/asimetrik derinliği, iki kol boy ve derinliğini, arka ofseti, yüksekliği ve kapalı X/Y/Z dış zarfını karşılaştırıyor. Otomatik model ve paket eşitliği testi geçti. |
| AUD-022 | RESOLVED | Net raf/taban alanı ortak envanter analizinden. Fiziksel raf yüzeyi ve net üretim levha alanı ayrı adlandırılıyor. Köşe alanı shoelace hesabıyla. |
| AUD-023 | RESOLVED | Bağlamsal kızak seçimi kalıcı. Örnekte 550 mm kasada 440/550/451 mm kısmi/tam/eski hareket. Hareket, süpürme ve PDF donanım notu aynı değeri kullanıyor. |
| AUD-024 | RESOLVED | Beş eş poligon için tek çizim ve tek koordinat paftası. Her parçanın tekil kodu, alt kotu ve CSV kesim satırı korunuyor. İki 39 sayfalık örnek yeni ayrıntılarla 35'er sayfa. |
| AUD-025 | RESOLVED | Niş eşyasında 0–500 mm isteğe bağlı kaldırma payı. Statik sığan fakat kaldırırken tavana değen eşya kritik uyarı üretir. |
| AUD-026 | EXTERNAL | Menteşe, sürgü, çekmece kızağı, raf yükü, elektrik ve ankraj ürün seçimi ile gerçek taşıma hesabı. |
| AUD-027 | EXTERNAL | Bant, ham kesim, kanal/zıvana, birleşim, vida/minifix/kavela, arkalık ve çekmece tabanı yöntemi ile montaj toleransları. |
| AUD-028 | EXTERNAL | Yerinde oda, duvar, döşeme ve tavan ölçüsü. Fiziksel A3 baskı ve cetvel kontrolü. |
| AUD-029 | PARTIAL | Registry varsayılan önizleme kararını taşıyor. Geometri ve kapasite ayrı saf hesap katmanlarında. Mevcut çarpışma kontrollü yay simülatörü korundu. Teknik tercih farklarının kullanıcı kabulü bekliyor. |
| AUD-030 | RESOLVED | Paletin tıklama işleyicisi tek yüzey alanını güncelleyen komutu çağırıyor. Raf → gövde sırası store ve üretim malzemesinde test edildi. Gövdeyi raflara uygulama ayrı düğme. Son sürüm fare denemesi UAT 4'te. |

RESOLVED, burada belirtilen yazılım senaryosunun doğrulamasıdır. Tam işaretçi ve fiziksel kabul adımları ayrıca aşağıda listelenir.

## Kaynak ve uygulama kararları

- **Giriş ve saklama.** Ortak Zod ve grafik katmanı normal import, AI, açma, store komutu, çözücü ve üretim preflight'ında kullanılıyor. Eski kayıtla uyum için sürüm numarası korundu. Arka ofset, montaj payı, kızak, 32 mm satırlar ve kaldırma payı isteğe bağlı niyet alanları. Dünya koordinatları ve donanım ayrıntıları çözümden üretilir. [Şema](C:/dev/Wardrobe-Studio/src/core/schema/designSchema.ts) · [Grafik denetimi](C:/dev/Wardrobe-Studio/src/core/schema/designConstraints.ts) · [Oturum](C:/dev/Wardrobe-Studio/src/store/useWardrobeStore.ts) · [Sürüm arşivi](C:/dev/Wardrobe-Studio/src/store/versionArchive.ts)
- **Geometri.** Arka ankraj seçilen kolun bütün gövde derinliğini değiştirir. Ön ankrajı aşan duvar penetrasyonu reddedilir. Paylaşımlı köşede kollar için ortak panel ve arkalık kalınlığı seçildi. Ayarlanabilir rafın açık etkinleştirmesi eski raf altını en yakın 32 mm satırına alır. En yakın satır en fazla 16 mm kayma getirebilir. Komşu açıklık yeterli gelmezse komut reddedilir. Yeni modül paleti ve yeni çekmeceli bölme varsayılanı %80, alanı eksik eski kayıt %82. [Çözücü](C:/dev/Wardrobe-Studio/src/core/solver/carcassSolver.ts) · [Köşe](C:/dev/Wardrobe-Studio/src/core/solver/cornerSolver.ts) · [Boyut komutları](C:/dev/Wardrobe-Studio/src/core/solver/treeMutator.ts) · [32 mm hesabı](C:/dev/Wardrobe-Studio/src/core/solver/adjustableShelves.ts)
- **Görsellik.** Örneğin 3D sabit boyutları ile envanterin paket varsayımları ayrıldı. Uygun örnek sayısı boşluktan türetilir. Sunumda Three.js GTAOPass ana derinlik tamponundan AO üretiyor, sekiz AO ve sekiz filtre örneği kullanıyor. Gölge geçişi, IBL ve ContactShadows ile birlikte çalışacak şekilde bağlandı. Renk hedefi desteklenmeyen GPU'da temel render yolu kullanılır. Yeni npm paketi eklenmedi. Gerçek görüntü ve performans kabulü açık. [Önizleme hesabı](C:/dev/Wardrobe-Studio/src/core/inserts/itemPreview.ts) · [GTAO bağlantısı](C:/dev/Wardrobe-Studio/src/canvas/scene/PresentationOcclusion.tsx) · [Three.js GTAOPass](https://threejs.org/docs/pages/GTAOPass.html) · [N8AO projesi](https://github.com/N8python/n8ao)
- **Animasyon ve registry.** Geometriyi üreten fonksiyonlar model ve envanter açısından bağımsız test edilebilir. Registry'deki önizleme seçicisi, varsayılan eşya dallarını bileşenden kaldırdı. Tam modül sözleşmesine taşıma ayrı bir mimari değişiklik olur. Mevcut simülatör, aynı kare içinde aday hareketi sürekli çarpışma sorgusundan geçirip gerçek durma noktasını kaydediyor. Yay kitaplığına geçişte bu sınırlama, elle sürükleme ve eşzamanlı komut sırası yeniden entegre edilirdi. İki fark PARTIAL. [Registry](C:/dev/Wardrobe-Studio/src/core/inserts/insertRegistry.ts) · [Simülatör](C:/dev/Wardrobe-Studio/src/core/analysis/motionSimulator.ts) · [React Spring](https://www.react-spring.dev/)
- **Üretim.** Yapısal ve organizer preflight, kesim modeli, SVG, PDF, CSV ve HTML aynı çözülen parçaları kullanıyor. Eski tekil poligon paftası API seçeneği korunuyor. Uygulama ve yeni paketler ortak paftayı kullanıyor. [Preflight](C:/dev/Wardrobe-Studio/src/core/production/staticPreflight.ts) · [Üretim modeli](C:/dev/Wardrobe-Studio/src/core/production/productionModel.ts) · [Paftalar](C:/dev/Wardrobe-Studio/src/core/production/technicalSheets.ts)

### Denetimde ayrıca düzeltilenler

| Kayıt | Değişiklik | Kanıt sınırı |
|---|---|---|
| FIX-001 | A, B ve üst plan için ayrı kamera konumu, hedef ve zoom belleği. Açık sıfırlama aktif görünümü etkiler. | Derleme ve kaynak denetimi. Canlı pan/zoom döngüsü UAT 6. |
| FIX-002 | Marquee aynı pointer kimliğini izler. İptal veya pencere odak kaybı seçim kutusu ve geçici kamera kilidini temizler. Sürgü kayıp yakalamada da bırakılır. | Mevcut sürgü/çarpışma testleri geçti. Gerçek iptal UAT 3/5. |
| FIX-003 | Sürüm açma sonucunu UI'ya döndürür. Geçersiz eski sürümler kurtarma verisi olarak korunur. | Bozuk sürüm + sonraki kayıt/yeniden adlandırma testi. |
| FIX-004 | Tuvale göre yüzen panel genişliği ve dar ekranda ayrı yan panel düğmeleri. | Derleme ve kaynak denetimi. Boyut taraması UAT 6. |
| FIX-005 | Kapalı aksonometride kapaklar iç raf ve çekmecelerin önünde. Patlatılmış şemada arkalıklar arkada ve üst/alt tablalar ayrı kodlu. | PDF'nin 3. sayfası ile patlatılmış sayfalar görsel kontrol edildi. |

## Regresyon ve derleme

| Yeni dosya | Test | Kapsam |
|---|---:|---|
| `remediation-session.test.ts` | 13 | Geç okuma ve kullanıcı komutları, v2 geri yükleme, 4 kanal sonucu, yeni kopya seçimi ve iki kurtarma yolu. |
| `remediation-geometry.test.ts` | 26 | Ortak geçersiz giriş, eski separate, sabit kesişme, tavan, 32 mm net kasa, geniş/tek mm kanat, organizer kalınlıkları, A/B Z ankrajları. |
| `remediation-modules.test.ts` | 12 | 530 mm sınırı, üç askı profili, gerçek köşe borusu, üç kızak oranı, servis kaldırma ve ayarlı raf adımı. |
| `remediation-deliverables.test.ts` | 15 | Eşya anahtarları, 1220 mm örnek, malzeme komutu, B paftası, ortak poligon, donanım eşleştirme, ölçü/alan karşılaştırması, kritik çıktı kapısı ve yönlü ankraj. |

**186/186 test, 11 dosya.** Eski 120 test dosya içeriği korunarak geçti. Node v24.16.0, npm 11.13.0, Vitest 3.2.7 ve Vite 6.4.5. TypeScript ve üretim derlemesi başarılı. Vite mevcut 500 kB üzeri paket uyarısını veriyor. İlk gruplarda düzeltme öncesi sırasıyla 24, 8 ve 6 beklenen başarısızlık kaydedildi.

[Son test](C:/dev/Wardrobe-Studio/artifacts/final-remediation/final-tests.log) · [Son derleme](C:/dev/Wardrobe-Studio/artifacts/final-remediation/final-build.log) · [A öncesi](C:/dev/Wardrobe-Studio/artifacts/final-remediation/red-group-a.log) · [B öncesi](C:/dev/Wardrobe-Studio/artifacts/final-remediation/red-group-b.log) · [C öncesi](C:/dev/Wardrobe-Studio/artifacts/final-remediation/red-group-c.log)

## Dört üretim paketi

| Örnek | Parça eski → yeni | A3 sayfa eski → yeni | Geometrisi değişen satır | İndir |
|---|---:|---:|---:|---|
| Düz, 18/8 | 69 → 69 | 21 → 23 | 30 organizer | [PDF](C:/dev/Wardrobe-Studio/artifacts/final-remediation/production/straight/wardrobe-final-straight.pdf) · [ZIP](C:/dev/Wardrobe-Studio/artifacts/final-remediation/production/straight/technical-package.zip) |
| Beşgen L, 18/8 | 94 → 94 | 39 → 35 | 30 organizer, 5 kapak | [PDF](C:/dev/Wardrobe-Studio/artifacts/final-remediation/production/diagonal/wardrobe-final-diagonal.pdf) · [ZIP](C:/dev/Wardrobe-Studio/artifacts/final-remediation/production/diagonal/technical-package.zip) |
| Kör L, 18/8 | 81 → 81 | 28 → 31 | 30 organizer, 3 kapak | [PDF](C:/dev/Wardrobe-Studio/artifacts/final-remediation/production/blind/wardrobe-final-blind.pdf) · [ZIP](C:/dev/Wardrobe-Studio/artifacts/final-remediation/production/blind/technical-package.zip) |
| Asimetrik beşgen, 25/4 | 94 → 94 | 39 → 35 | 21 organizer, 5 kapak | [PDF](C:/dev/Wardrobe-Studio/artifacts/final-remediation/production/asymmetric/wardrobe-final-asymmetric.pdf) · [ZIP](C:/dev/Wardrobe-Studio/artifacts/final-remediation/production/asymmetric/technical-package.zip) |

**338 parça, 124 sayfa, dört pakette sıfır kritik.** Dört eski tasarım JSON'u aynen girdi olarak kullanıldı. Eklenen veya çıkarılan parça kodu yok. 18 organizer parçasında enine kesim boyu değişti. Düz örnekte 342 → 344 mm, beşgen örnekte 234 → 236 mm, asimetrik örnekte 232 → 233 mm. Diğer geometri farkları yerleşim merkezi ve pivot düzeltmeleri. Beşgen alt ve üst tablaların BOM görevi taban/tavan olarak ayrıldı. Grup çizimi aynı fiziksel parçaları ve nominal şekli taşıyor.

Bağımsız Python kontrolü organizer kutularının gerçek uçlarını, 5 parçalı çekmece kasalarını, kesim CSV'sini ve PDF/SVG kesim tablosunda her kodun adedini ve ölçüsünü karşılaştırdı. Zip kaynak JSON'u, kanonik üretim JSON'u, SVG ve CSV eşit. V/E geometrisi çapraz çarpım, shoelace ve atan2 ile yeniden hesaplandı. Beşgen 18/8 örneğinin beş köşeli alanı 724.114 mm², eğik kenarı 398,8 mm. Asimetrik 25/4 örneğinde 704.328,5 mm² ve 481,3 mm. İki örneğin ortak şekil paftaları 21–22, B1 iç cepheleri 17. Poppler ile 124 sayfa render edildi. Kontak paftaları ve kritik çizimler görsel olarak incelendi.

[Üretim manifesti ve eski-yeni koordinatlar](C:/dev/Wardrobe-Studio/artifacts/final-remediation/production/manifest.json) · [Bağımsız sayısal kontrol](C:/dev/Wardrobe-Studio/artifacts/final-remediation/production-qa.json) · [B1 paftası](C:/dev/Wardrobe-Studio/artifacts/final-remediation/rendered/asymmetric/page-17.png) · [Dış açı ve kodlar](C:/dev/Wardrobe-Studio/artifacts/final-remediation/rendered/asymmetric/page-22.png) · [Köşe montajı](C:/dev/Wardrobe-Studio/artifacts/final-remediation/rendered/asymmetric/page-34.png)

Dosyalar **modellenen bitmiş parçanın nominal ölçüsü ve marangoz incelemesi** için kullanılabilir. Parça kotu, yerel kesim koordinatı, malzeme kalınlığı ve modellenen kapak/çekmece zarfı bu kapsamda doğrulandı. Düzlemdeki dış dönüş, testere eğimi ve birleşim ayarından ayrı bir değerdir. Kesime geçmeden katalog, bant ve ham kesim, bağlantı ve saha ölçüsü kararları ile gerçek A3 baskı doğrulaması gerekir. Çok geniş raflar, ağır kanatlar ve ince tabanlar bu uzman kontrolünde öncelikli.

## Gerçek tarayıcı ve açık kabul

Bağımsız Brave origin'inde varsayılan 600/480 mm asimetrik sahne, raf aralığı paneli, Normal → X-Ray ve Düzenleme → Sunum gözlendi. Bu gözlem görsel değişikliklerden önce yapıldı. 1707 × 848 ekran görüntüsü ve 1505 × 1140 WebGL tamponu görüldü. Arka planda 180 kare örneği p50 1001,9 ms, p95 1002,5 ms ve yaklaşık 1 FPS verdi. Tarayıcının arka plan sınırlaması nedeniyle bu ölçü hedef performans hesabına alınmadı. Sekmeyi öne alma girişiminde bilgisayar kullanımı Windows etkin adresini güvenle doğrulayamadı ve o tur için durdu. Son derleme üzerinde gerçek yüzey/kulp sürükleme, pointercancel, marquee ara vurgusu, çoklu çekmece, X-Ray sıraları, 2D kamera, dar ekran, indirme ve yenileme kabulü tamamlanmadı. Otomatik solver ve dosya kanıtı bu adımların yerine kullanılmadı.

Kalan teknik sınırlar arasında Sunum modunda GTAO'nun ön plan kare maliyeti, tüm özel menteşe açıklıklarında dikmeye oturma ve eski panel birleşimlerinin 0,5 mm merkez toleransı var. Organizer denetimi ayrı olarak 0,000001 mm sayısal toleransla yapılıyor. Yeni yazılım FAIL satırı kalmadı. 12 PARTIAL ve 12 UNVERIFIED satırdaki kapsam ve sonraki test, yeniden kontrol belgesinde ayrı gösterildi.

### Kullanıcı kabul sırası

1. Yalıtılmış origin'de yeni boş proje oluşturun. Bir ölçüyü değiştirip checkpoint, Undo/Redo, JSON dışa/içe alma ve yenilemeyi yapın. Çalışma, geçmiş ve adlandırılmış sürümün ayrı kaldığını karşılaştırın.
2. A ve B'de X sol/sağ ve Y yukarı/aşağı taslağı ile uygulamayı karşılaştırın. 600/592 mm örnekte Z Arka'yı 500 mm yapın. Ön ve ray sabit, arka 92 mm olmalı. Undo/Redo ile iki pozisyonu görün.
3. İki ve üç raylı cephede normal kapak yüzeyinden ve kulptan sürükleyin. Açık çekmeceye doğru hızlı sürüklemeyi deneyin. Dışarı bırakma, odak kaybı ve dokunmatik pointercancel sonrası kamera ve seçim tekrar yanıt vermeli.
4. Normal, X-Ray ve Gizle geçişlerini iki yönde deneyin. Normal'e dönüşte tüm kapak yüzeyi tıklanmalı. 3D Eşyalar kapalıyken servis merdiveni kaybolmalı. 944 mm hacimde uzun örnek küçülmemeli. Önce rafa sonra gövdeye malzeme seçin.
5. Marquee ile canlı vurguyu ve bırakma sonucunu görün. Ctrl/Shift ile iki çekmeceyi seçin. Farklı raf gruplarına tek toplu düzenleme uygulayın ve her grubun brüt yüksekliğini karşılaştırın.
6. A, B, üst plan ve perspektifte farklı pan/zoom yapıp sırayla geri dönün. Sıfırlama yalnız aktif görünümü etkilemeli. Geniş ve dar pencerede yüzen kontrol ve yan panelleri deneyin.
7. Aynı sahne, pencere boyutu ve görünürlükle `?qa-performance` adresinde ön planda 180 kare bekleyin. Düzenleme, X-Ray ve Sunum için p50/p95 kaydedin. Kulp, şeffaf kapak ve LED ile AO gölgelerini inceleyin.
8. L tasarımı 18/8 ve 25/4 ile açın. Kısa kol ve farklı kol kalınlığını içe aktararak reddi görün. Köşe askısı, ±32 mm raf, kısmi/tam çekmece ve servis kaldırma payını değiştirin.
9. İki adlandırılmış sürümde dış ölçüleri ve üç alan etiketini karşılaştırın. Anne/Baba hedefini ve özel depolama şablonunu deneyin. AI önizlemesine geçerli ve birleşimsiz L yükleyin. Tavanı aşan model üretim indirmesini engellemeli.
10. PDF, CSV ve ZIP düğmelerinden gerçekten inen dosyaları açın. Aynı parça kodunu PDF ve CSV'de bulun. B1 raflarını ve ortak beşgen paftasını karşılaştırın. Fiziksel A3 cetvel ve montaj kontrolünü marangozla yapın.
