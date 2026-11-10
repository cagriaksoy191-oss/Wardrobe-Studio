# Wardrobe Studio · Son sürüm hazırlığı

6 Kasım 2026 · Aşama 1–5 son kullanıcı kabul adayı

**Kontrollü son kullanıcı testi için sürüm adayı oluşturulabilir.** Beşgen köşelerde ve kör köşe örneğinin alt sürgüsünde işlevsel engeli kaldıran düzenler var. Bu düzenler önizleme ve kullanıcı onayıyla uygulanıyor. Mevcut üç engelli örnek tanısal belge üretiyor. Genel yayın kararı gerçek kullanıcı kabulünü, her imalat kararı kendi saha ve donanım onayını bekliyor. [Gerçek görevler ve tarayıcı sonuçları](FINAL_USER_EXPERIENCE_ACCEPTANCE.md)

## Beş kalite kapısı

| Kapı | Durum | Gerekçe |
| --- | --- | --- |
| **1 · Veri ve geometri** | **PASS** | 213/213 test. Dört eski örnekte 0 kritik geometri hatası ve aynı 338 kanonik parça kodu. Kapak kesimleri, kapalı merkezler ve önceki örnek geometrisi eşleşti. Kayıt, geçmiş, geçersiz/büyük JSON ve hata enjeksiyonu kanıtları mevcut. |
| **2 · İşlevsel kullanım** | **PARTIAL** | Temel tasarım ve hareket senaryoları çalıştı. Üç tespit edilmiş engel grubu için ölçülmüş, geri alınabilir çözüm var. 5,1° ve 12,8° örnekleri mevcut kapaklarıyla engelli. İkisi için doğrulanmış kapalı alternatif bulunamadı. Birer askı çıkarma yolu ve katalog donanımı sahada açık. |
| **3 · UX/UI** | **PARTIAL** | Masaüstü, dar pencere, 390 ve 360 px testleri yapıldı. Mobil bölme formu ve erişim odağı düzeltildi. Dokunma, aktif sürüklemede odak kaybı ve bağımsız ilk kullanıcı testi açık. Yoğun bağlamsal paneller ve büyük kutu seçiminde kısa takılma görüldü. |
| **4 · Dosya ve üretim** | **PASS** | Dört A3 dosyası toplam 142 sayfa olarak işlendi ve doğrulandı. Engelli örnekler tanısal etiketli. Yedi dosya türü gerçek indirme olarak oluştu ve içerikleri incelendi. Fiziksel baskı, katalog ve usta onayı ilgili kullanıcıya bağlı. |
| **5 · Gerçek kullanıcı kabulü** | **EXTERNAL** | Bu belgenin sonundaki öncelikli liste kullanıcı bilgisayarında, gerçek telefon ve atölye koşullarında yürütülecek. |

## Test, derleme ve kaynak koruması

| Kontrol | Başlangıç | Son |
| --- | --- | --- |
| `npm test -- --run` | 207/207 | **213/213**, 13 dosya |
| `npm run build` | Başarılı, Vite paket boyutu uyarısı | **Başarılı**, sıkı TypeScript ve Vite 6.4.5. Ana minify paketi 1846,49 kB, gzip 517,12 kB. Paket boyutu uyarısı sürüyor. |

Beş yeni erişim testi, iki beşgen örneğin işlevsel ölçümünü ve PDF işaretlerini, kör köşe çekmece mesafesini, düz sürgü açma sırasını ve önizlemenin tek Geri Al işlemi olmasını kapsıyor. Bir ek regresyon, sığmayan sabit bölme ekleme girişiminde seçimi ve geçmişi koruyor. [İşlevsel erişim testleri](tests/functional-access.test.ts) · [Otomatik cephe testleri](tests/auto-front-geometry.test.ts)

Başlangıç kaynak ZIP’i 113 girdili ve CRC doğrulaması geçti. SHA-256 `fd15088e69379b6b99308539d233d0e3e68656ef58e25e2cbc64f135e4f71caf`. Ana plan, ek gereksinimler, önceki raporlar, dört önceki PDF ve kayıt altına alınan eski görsel kanıtlar dahil 85 dosyanın sağlama toplamı eşleşti. Tarayıcı verisi ayrı test origin’lerinde işlendi. [Kaynak yedeği](artifacts/final-user-acceptance/source-before-20261106-220156-501421.zip) · [Koruma doğrulaması](artifacts/final-user-acceptance/preservation-qa.json)

## İşlevsel erişim ve gerçekten giderilen engeller

Geometri hatası çözücünün tasarım geçerliliğini, mekanik duruş hareketin çarptığı konumu, işlevsel erişim eşyanın geçebileceği boşluğu veya çekmecenin gerçek hareketini gösterir. Katalog ve saha gerektiren durumlar ayrıca belirtilir. İşlevsel erişim çıktısı `ResolvedModel` içinde türetilir. Geçiş ölçüsü, raf/askı yüksekliğindeki fiziksel hacimleri ilgili ön açıklığın düz çıkarma koridoruna yansıtır ve kalan en geniş kesintisiz açıklığı ölçer. Çekmecede aynı sürekli hareket denetimiyle kızak stroku ölçülür. Kontrol, başlangıç konumu, denenmiş tek/çift açılma sıraları, sürgü parkları ve gerekirse engelleyen komşu menteşe hareketini kullanır.

Katlanmış giysi referansı köşe örneklerinde 310 mm’dir ve 30 mm elle tutma payı içerir. Bu ölçüyle geçen planlama düzeni referans eşyaya ve denenmiş sıraya bağlıdır. Eğme, esnek giysiyi katlayarak çıkarma, özel mekanizma veya nominalden farklı ürün için doğrulanamadı durumu kullanılabilir. Kullanım sonucu evrensel menteşe açısına bağlanmaz. [Ölçü ve sıra dökümü](artifacts/final-user-acceptance/access-probe.json) · [Erişim hesabı](src/core/analysis/functionalAccess.ts)

| Tasarım ve mevcut düzen | Ölçülmüş engel veya durum | Önizlenen çözüm ve üretim farkı |
| --- | --- | --- |
| **Düz, üç ray** | Üç çekmecede 451 / 451 mm. Kanat 2, 982 mm; ardından kanat 1, 1964 mm. Açık çekmece varken geri gelen kanat 1458 mm’de durdu. | Gerekli açma sırası UI ve modelde doğrulandı. Çekmeceler kapanınca kanat 0 mm’ye dönebildi. |
| **Beşgen 18/8 mm** | 110° nominal, B1 sol kanada karşı 5,1° güvenli. Dört köşe rafında 0–7 / 310 mm. | **Köşeyi açık bırak** dört rafı 365–393 mm’ye çıkarır. P-70570E4D kaldırılır, donanım tablosunda 2 satır eksilir, kalan parça kesimleri aynı. Bir askı yolu doğrulanamadı. |
| **Beşgen 25/4 mm, 600/480 derinlik** | 110° nominal, 12,8° güvenli. Dört köşe rafında 7–14 / 310 mm. | **Köşeyi açık bırak** dört rafı 461–469 mm’ye çıkarır. Aynı kanat ve 2 donanım satırı kaldırılır. Bir askı yolu doğrulanamadı. |
| **Kör köşe, karma cephe** | B1 sol kanadı 110° yerine 79° açılır. Beş B1 rafının ölçüsü yeterli. A2’de üç çekmece alt sürgü kanadı nedeniyle 49 / 451 mm. | **Alt Sürgülü Cephe · açık bırak** üç çekmeceyi 451 / 451 mm’ye çıkarır. P-04ABDEFB ve P-05ABE08E ile 4 donanım satırı kalkar. Üst menteşeli aralık ve alt aralığın kapsamı/kotları korunur. |

Karşı menteşe eli iki beşgen için çözüldü. 18/8 mm’de 0,2° ve 0–5 mm, asimetrikte 61,3° ve 253 mm bulundu. Komşu B1 cephesi açıkken 18/8 mm örneğinde 10,1° ve 5–11 mm, asimetrikte 63,6° ve 267–274 mm elde edildi. Bu düzenler 310 mm referansı karşılamadığı için öneri listesine girmedi. Ürün desteği ve erişim ölçümü bulunan seçenekler sunulur. Genel çift kanat, üst/alt bölme veya köşe sürgüsü için doğrulanmış yeni mekanizma eklenmedi.

Önizleme kapalı konumu, denenen hareketi, parça zarfını, erişim ve parça/donanım farkını gösterir. Kalan menteşede taşıyıcı panelin varlığı aranır. Uygulama tek geçmiş işlemidir ve eski önizleme güncel tasarımın üstüne yazamaz. Geçici hareket bayrakları çıkarılan parçalar için temizlenir. Üretim ön kontrolünde doğrulanmış engel varsa CSV ve ZIP devre dışı, PDF tanısal. Açık doğrulama bulunan düzenlerde belge usta kontrolü statüsünü korur. [Beşgen önce/sonra](artifacts/final-user-acceptance/browser/06-diagonal-remedy-preview.jpg) · [Asimetrik uygulama sonrası](artifacts/final-user-acceptance/browser/05-asymmetric-remedy-applied.jpg) · [Kör köşe önce/sonra](artifacts/final-user-acceptance/browser/08-blind-drawer-remedy-preview.jpg)

## Teknik üretim belgeleri

| Örnek | Sayfa önce → sonra | Parça | İşlevsel engel / doğrulanamadı | Belge ve uyarı yerleri |
| --- | ---: | ---: | ---: | --- |
| Düz | 25 → 25 | 69 | 0 / 0 | Usta kontrolü. Özet s. 1, kapak ve ray tablosu s. 25. [PDF](artifacts/final-user-acceptance/production/straight/wardrobe-acceptance-straight.pdf) |
| Beşgen 18/8 | 40 → 41 | 94 | 4 / 1 | Tanısal. Özet s. 1, erişim s. 34, etkilenen kapak s. 40. [PDF](artifacts/final-user-acceptance/production/diagonal/wardrobe-acceptance-diagonal-diagnostic.pdf) |
| Kör köşe | 34 → 35 | 81 | 3 / 1 | Tanısal. Özet s. 1, erişim s. 30, kapak ve ray tablosu s. 35. [PDF](artifacts/final-user-acceptance/production/blind/wardrobe-acceptance-blind-diagnostic.pdf) |
| Asimetrik 25/4 | 40 → 41 | 94 | 4 / 1 | Tanısal. Özet s. 1, erişim s. 34, etkilenen kapak s. 40. [PDF](artifacts/final-user-acceptance/production/asymmetric/wardrobe-acceptance-asymmetric-diagnostic.pdf) |

İlk sayfada dış ölçüler, gövde/arkalık kalınlıkları, yüzeyler, fiziksel parça ve özel kesim sayısı, kapak türleri, kritik geometri ve erişim ayrı satırlarda. Tanısal örneklerde en düşük geçiş ya da kızak sonucu ve ilgili pafta referansı ilk bakışta görünüyor. Kanonik parçalar, tam kesim listesi, özel kesim koordinatları, malzeme, montaj ve donanım paftaları korunuyor. Beşgen geometrilerindeki ön açıklıklar 398,808 ve 481,300 mm. Kapak ve ray tabloları çözülen kesim, merkez ve hareket verisiyle eşleşti.

142 sayfanın tamamı Poppler ile rasterleştirildi. Sayfa ebatları 420 × 297 mm yatay A3. Her sayfada 50 mm baskı kontrolü metni, çizgisi ve kalibrasyon alanı var. Kapak ve erişim paftaları ile dört ilk sayfa önceki sürümle görsel olarak karşılaştırıldı. Özel kesim, montaj ve tam kesim paftaları saklandı. Kısa erişim tabloları ve son kapak sayfalarında boşluk, ayrıntılı tablolarda A3’te küçük yazı kalıyor. Baskı ve atölye okuma testi bekliyor. [Dört özetin karşılaştırması](artifacts/final-user-acceptance/pdf-rendered/covers-before-after.jpg) · [PDF eşleşme kontrolü](artifacts/final-user-acceptance/pdf-qa.json) · [Gerçek indirme kontrolü](artifacts/final-user-acceptance/download-qa.json)

## Üretici ve marangoz kararı

- Yerinde tavan, duvar, gönye, süpürgelik, dolap yaklaşımı ve açma süpürmesi ölçülmeli. Referans eşya ve el payı gerçek kullanımda denenmeli.
- Menteşe serisi, gerçek hareket yolu, yaprak ağırlığı ve üreticinin verdiği kapasiteyle doğrulanmalı. Taş delikleri, montaj plakası, kenar mesafesi ve kapak kulpu ürün ve montaja göre seçilmeli.
- Sürgü ray profili, kanat ağırlığı, bindirme, tampon, çekmece kızak mesafesi ve cam/ayna taşıyıcısı katalog ve montajla onaylanmalı.
- Ham kesim, bant/testere payı, delik koordinatı, duvar bağlantısı, sabitleme ve montaj toleransı saha ve atölye kararıdır. Pafta son ölçüleri ve donanım kontrol noktalarını verir.

## İstenen 17 sorunun yanıtı

1. **İlk L oluşturulabiliyor mu?** Evet. Yeni tasarım formunda oda, iki kol ve derinlikleri girerek 3D sonuç alındı. İlk kullanıcı kolaylığı insan testi bekliyor.
2. **Raf ve çekmece eklemek pratik mi?** Yeşil artı ve görünür çekmece adediyle doğrudan yapılabiliyor. Raf aralığına göre yeniden dağıtımda yön ve komşu onayı gerekiyor.
3. **Kapak ölçüsü otomatik ve tutarlı mı?** Test edilen menteşe ve sürgü düzenlerinde evet. Örneğin 1040 → 1120 mm A2 değişikliğinde her üst kanat 521 → 561 mm oldu. Geometri, PDF ve kesim verisi eşleşti.
4. **Kapaklar gerçekten erişim veriyor mu?** Düz örnekte ve kör köşe B1 raflarında denenen sırada evet. İki beşgenin mevcut köşe kanadı ve kör örneğin A2 çekmeceleri engelli. Sonuçlar bölme bazında ayrıldı.
5. **5,1° ve 12,8° ne oldu?** Fiziksel sınırlar aynı ölçüldü. İki kapak için raf geçişi ayrıca hesaplandı ve işlevsel engel tasarımda, ön kontrolde ve PDF’de öne çıkarıldı.
6. **Kullanılabilir alternatif var mı?** Evet. İki beşgende açık köşe 365–393 ve 461–469 mm sağladı. Kör örnekte açık alt aralık 451 mm çekmece yolunu sağladı. Kapalı beşgen alternatifi doğrulanamadı.
7. **Kullanılamayan tasarım uyarılıyor mu?** Evet. Neden, etkilenen bölüm, açı veya hareket ve referans gösteriliyor. Tanısal PDF açık, üretim CSV/ZIP’i engel çözülene kadar kapalı.
8. **Geri Al/Yinele ve kayıt güvenilir mi?** Doğrulanan çalışma kopyası, adlandırılmış sürüm, manuel kayıt noktası, F5, sekmeyi yeniden açma ve kontrollü depo arızalarında sonuç tutarlı. Tarayıcının tamamını yeniden başlatma son kullanıcı adımı.
9. **Masaüstü kalabalığı kaldı mı?** Evet, yoğun seçim ve üretim ayrıntılarında. İlk ekran ve günlük çekmece/ölçü kontrolleri daha görünür. Araçlar ve ayrıntılar kademeli açılıyor.
10. **Mobil temel işlevler çalışıyor mu?** 390 ve 360 px masaüstü tarayıcı görünümünde evet. Dosya açma, ölçü, çözüm uygulama ve ekleme denendi. Gerçek dokunma kabulü açık.
11. **Sunum net ve gerçekçi mi?** Malzemeleri, derzleri, cam çerçevesini ve iç yerleşimi karşılaştırmak için yeterince net. Görsel ürün eşleştirmesi ve LED parlaklığı saha ölçümüne bağlı.
12. **Cam ve ayna doğrulandı mı?** Evet, gerçek 3D tarayıcı görüntüsünde ayrı ayrı. Cam rafları gösteriyor, ayna statik stüdyo yansıması kullanıyor.
13. **Gerçek ön plan ölçüldü mü?** Evet. Kapalı 3D p95 12,8 ms, Sunum/GTAO 19,4 ms, büyük L kapalı 19,2 ms. 63 hücreye kadar kutu seçiminde p95 70,8 ms’ye çıktı. Ayrıntılar kullanıcı deneyimi raporunda.
14. **İndirmeler tamamlandı mı?** Evet. Yedi türde dokuz dosya üretildi ve içerikleri doğrulandı. Tasarım JSON’u standart seçiciden yeniden açıldı.
15. **PDF’de engel kolay bulunuyor mu?** İlk sayfada kırmızı özet, erişim paftası ve ilgili kapak satırı aynı ölçüye işaret ediyor. Atölye okuma testi hâlâ gerekli.
16. **Kapı sonuçları nedir?** Veri/geometri PASS, işlevsel kullanım PARTIAL, UX/UI PARTIAL, dosya/üretim PASS, gerçek kullanıcı kabulü EXTERNAL.
17. **Kendi bilgisayarımda hangi testler öncelikli?** Önce fiziksel köşe/çekmece erişimi, sonra tam kayıt/kurtarma ve gerçek cihazda düzenleme. A3 baskı ve donanım onayını üretime geçmeden tamamlayın.

## Öncelikli son kabul listesi

1. **P0 · Günlük erişim.** Kendi tasarımında köşe kapağını aç. Katlanmış eşya ve askıyı kendi ölçülerinle dene. Kör köşede üç çekmeceyi tam çıkar ve komşu sürgüyü hareket ettir. Açık köşe kabul edilebilir mi, kapalı cephe gerekiyorsa hangi fiziksel sistem kullanılacak, karar ver.
2. **P0 · Verinin geri gelişi.** Test kopyasını elle kaydet, değiştir, F5 yap. Tarayıcıyı tamamen kapatıp aç. Kayıt noktasını, adlandırılmış sürümü ve indirdiğin JSON’u ayrı ayrı aç.
3. **P0 · İmalat kapısı.** Kendi PDF okuyucunda tanısal ilk sayfayı ve parça kodunu bul. A3 %100 baskıda 50 mm’yi cetvelle kontrol et. Ustayla ray, menteşe, cam/ayna, ölçü, montaj ve toleransı onayla.
4. **P1 · Fare ve telefon.** Gerçek telefonda 390/360 genişliğe yakın görünümde seç, pan/zoom yap, dosya ve ekleme formunu aç. Masaüstünde sürgüyü tutarken Escape ve pencere değişimini dene. Bıraktıktan sonra kamera, kapak ve seçim tekrar normal çalışmalı.
5. **P1 · İlk kullanım ve sahne.** Yeni L, raf/askı/yüklük, ölçü değişimi, malzeme ve A/B’yi yardım almadan tamamla. Büyük tasarımda kutu seçimi ve Sunum Modu’nu kendi GPU ve ekranında değerlendir.

Yayın kararını açık tutan başlıklar gerçek kullanıcı onayı, dokunma ve aktif sürükleme kesintisi denemesi, zorunlu kapalı köşe için ürün doğrulaması ve üç tanısal düzenin imalat öncesi çözümüdür. Küçük UX işleri mobilde bağlamsal panel ve artının üst üste gelmesi, yoğun editörde raf/aralık adlandırması ve ayrıntılı PDF sayfalarında okunabilirliktir.
