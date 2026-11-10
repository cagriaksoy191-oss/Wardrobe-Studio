# Wardrobe Studio — Aşama 4 teslim ve doğrulama raporu

4 Kasım 2026 · `C:\dev\Wardrobe-Studio`

Kullanıcının Aşama 4 onayındaki kapsam uygulandı. Aşama 5'e başlanmadı. Ana plan ve ek gereksinimler belgeleri değiştirilmedi; bağımlılık eklenmedi. Önceki kaynakların yedeği `phase4-before.zip`, kaynak değişikliklerinin listesi `artifacts/phase4/changed-files.txt` içindedir. Klasörde Git deposu bulunmadığından commit oluşturulmadı.

## Kritik düzeltmeler

| Konu | Son davranış |
| --- | --- |
| Paylaşımlı dikme | Yeni tasarımlar `constructionMode: shared` kullanır; düz kolda N bölme için N+1 dikme vardır. Ortak panel iki bölmenin kimliğini taşır. Beşgen köşenin yan paneli ilk bölmeyle paylaşılır; kör köşe ve iki kol da test edildi. |
| Eski JSON | Alanı bulunmayan eski dosyalar `separate` kabul edilir; dış ölçüler ve ayrı gövdeler korunur. Oda panelinden açıkça paylaşımlı dikmeye geçilebilir. Net açıklıklar yeniden hesaplanır, işlem geri alınabilir. |
| Tamsayı mm | Komut sınırında mm değerleri yuvarlanır; şema ve çözüm doğrulanır. Geçersiz işlem tasarıma veya geçmişe yazılmaz. Kesim ebatları tamsayıdır; tek sayılı panel kalınlıklarının fiziksel merkezleri yarım mm olabilir. |
| Net Z | Tanım `dış derinlik − arkalık kalınlığı` ile tutarlıdır. 500 mm net istek, 8 mm arkalıkta 508 mm dış ve tam 500 mm net üretir. Ön kapak gövdenin önündedir. |
| Fixed/Flex | Sabitler korunur, min/max sınırlar birlikte çözülür, olanaksız toplam reddedilir. Yuvarlama farkı sınırlar içinde son serbest öğeye gider. Otomatik eşit raf aralıkları güncel ölçüden türetilen floor/ceil sınırlarıyla en fazla 1 mm farklılaşır. |
| Checkpoint | 50 adımlık Undo geçmişinden bağımsız gerçek checkpoint saklanır. 75 işlem sonrası dönüş ve Redo test edildi. Değişiklik göstergesi tasarım içeriğine bağlıdır. LED sürüklemesi tek Undo adımıdır. Oturum yüklemede tekli/çoklu seçim eşitlendi. |
| Kapak açısı | Animasyon ve süpürme aynı 110°/155°/165° tanımını kullanır; eski 90°/98° görsel kısıt kaldırıldı. |
| Tarayıcı hatası | Sahne HTML etiketlerinin eşzamanlı kök kaldırmasından doğan React hatası, izole DOM kökleri ve ertelenmiş temizlemeyle giderildi. Ölçü düzenleyici ve seçim/katman geçişleri yeniden denendi. |

## Kullanım walkthrough'u

1. **1. Oda & Köşe → Kişiler & erişim:** Anne/Baba boylarını mm girip Enter'a basın veya alandan çıkın. Göz hizası boyun %93'ü, günlük erişim %105'i, üst erişim %125'idir. Erişim varsayımları altında günlük/üst sınırlar değiştirilebilir. Ortak alan kısa kişinin sınırlarıyla değerlendirilir.
2. **Ergonomi / Sahiplik:** Sahne altından erişim veya Anne/Baba/Ortak katmanını açın. 2D/3D katmanları malzemeleri değiştirmez. Göz hizası düğmeleri kişiye göre kamera kurar; Görünümü Sıfırla genel çerçeveye döner. 3D→2D→3D son 3D konumunu korur.
3. **2. İç & Kapak → Envanter:** Kişi ve eşya seçip hedef ekleyin, adedi düzenleyin. Ayrıntıda gerçek eşyanızın en/derinlik/yüksekliğini ve askı aralığını girebilirsiniz. Kapasite tek türün tahminidir; Ayrılan bütün hedeflerin birlikte sonucudur. Ortak hacim liste sırasıyla bir kez kullanılır. Askı uzunluğu, raf/taban alanı, net çekmece hacmi ve ayakkabı kapasitesi kişi bazında gösterilir.
4. **Oda engelleri:** Yatak, oda kapısı, pencere, radyatör, priz/anahtar, kolon, kiriş, süpürgelik veya diğer engeli ekleyin. X/Y/Z sol-alt-arka köşedir; A kolu X, B kolu Z yönündedir, Y yukarıdır. Boyut/dönüş düzenlenebilir. Oda kapısının menteşesi ve açısı da ayarlanır. Düzenleme ve kaldırma Undo ile geri döner.
5. **Üst plan + Süpürme alanları:** Tam açılma alanlarını inceleyin. Sarı kapak, mavi çekmece, kırmızı engelle kesişen hareket alanıdır. Yatay ayak iziyle birlikte düşey aralık kontrol edilir. Oda kapısının açılımı da dolap gövdesiyle karşılaştırılır.
6. **Özel depolama:** Bir gövde seçip şablonu uygulayın. Altı şablon: derin Türk evi yüklüğü, kademeli L-askı, kör köşe valiz/yüklük, 4×3 gözlü takı çekmecesi, pantolonluk, kirli çamaşır sepeti. Uygun türler yalnız seçili iç hücreye uygulanabilir. L-askı iki kolun ilk bölmesini, kör köşe şablonu öncelikli kolun ilk bölmesini düzenler. Yetersiz ölçüde uyarı gösterilir.
7. **Kopyalama/yansıtma:** Hedef kolu seçip kopya veya aynalı kopya ekleyin. Kol kaynak bölmenin dış genişliği kadar uzar; ağaç kimlikleri yenilenir. Seçili bölmeyi aynala, sol/sağ düzeni ve menteşeyi yansıtır. Çok bölmeli ortak kapak varsa önce kapsamı ayırmak gerekir.
8. **Neden? / Quick-Fix:** Sağdaki uyarı açıklamasını açın. Uygun durumda 155° menteşe, alçak askılık, daha geniş raf aralığı veya açıkça belirtilen engel konumu önerilir. Düğmeye basılmadan tasarım değişmez; uygulama tek Undo işlemidir. Belirsiz donanım durumları açıklanır.

Profiller, envanter, engeller ve şablon niyeti Design içinde kalıcıdır; analiz ve geometriler çözümden türetilir. JSON, otomatik kayıt ve Undo/Redo desteklenir.

## Doğrulama

| Kontrol | Sonuç |
| --- | --- |
| `npm test -- --run` | **76/76 başarılı:** değişmeden korunan 37 önceki test + 17 geometri/kayıt testi + 22 Aşama 4 analiz/şablon testi. |
| `npm run build` | TypeScript ve Vite başarılı. Büyük paket uyarısı sürüyor; hata değil. Yaklaşık 1.63 MB JS / 443.5 kB gzip. |
| Ortam | Node v24.16.0, Vite v6.4.5, Vitest v3.2.7. |
| Gerçek tarayıcı | Brave masaüstü, ayrı kayıt alanı `127.0.0.1:5174`. 5173 kullanıcı kayıtları QA için kullanılmadı. |

Yeni testler; düz/L panel sahipliğini, eski JSON'u, ondalık komutları, farklı kalınlıklarda 500 mm net Z'yi, olanaksız/kilitli dağıtımları, min/max toplamlarını, 75 işlem checkpoint/Redo'yu, menteşe kinematiğini, profil/sahipliği, ortak alanın iki kez sayılmamasını, gerçek eşya ölçülerini, köşe poligon alanını, engel yüksekliğini, kapak/çekmece/oda kapısı hareketini, Quick-Fix/Undo'yu, altı şablonu ve kopya kimliklerini kapsar.

Tarayıcıda gözlenenler:

- Anne boyu 1500 mm yapıldığında göz hizası 1395 mm ve erişim sınırları güncellendi; yeniden açılışta korundu. Anne/Baba kameralarının farklı yükseklikleri görüldü.
- Ergonomi/sahiplik açıldı. Sahiplik ve 3D eşya katmanı görünürken eşyanın arkasındaki ikinci raf aralığı tıklanarak seçildi.
- Paylaşımlı dikme seçimi dış genişlikleri korudu, net açıklıkları/panel sayısını değiştirdi.
- Yatak gövde/hareket çakışmaları üst planda görüldü. `Z=2450 mm` düzeltmesi uyarıları kaldırdı; tek Undo eski konumu ve uyarıları geri getirdi.
- 10 gömlek için kapasite 12, ayrılan 10/10 görüldü. Hedef/iç düzen değişince sonuç canlı güncellendi.
- Takı şablonu uygulandı. Aynalı kopya A kolunu 2800→3720 mm uzattı; Undo ile 2800 mm'ye döndü.
- 3D→2D cephe→3D kamera açısı korundu; üst plan yönü sabitlendi. Ölçü düzenleyicisi açılıp iptal edildi.
- Düzeltmeden sonraki temiz oturumda konsolda error/warn kaydı yoktu: `artifacts/phase4/browser-console.json`.

Ekran kanıtları `artifacts/phase4/` içindedir: `ergonomics.jpg`, `ownership.jpg`, `anne-eye.jpg`, `baba-eye.jpg`, `room-sweeps.jpg`, `selection-through-overlay.jpg`, `3d-before-2d.jpg`, `3d-after-2d.jpg`. Derleme kaydı `build.log` içindedir. Son arayüz metninde kapasitenin muhafazakâr tahmin olduğu ayrıca açıklandı; bu metin değişikliği işlevi değiştirmedi.

## Gerçek sınırlar ve riskler

- Ergonomi değiştirilebilir planlama varsayımlarıdır; ayrıntılı antropometrik simülasyon değildir. Günlük/üst sınırların sırası, diğer sınır boydan hesaplandığında da doğrulanır. Reddedilen sayısal giriş kayıtlı değere döner.
- Envanter ölçülü kutu/askı yerleşimidir; optimum paketleme, esnek kumaş veya sıkıştırma simülasyonu yoktur. Hedef sırası sonucu etkiler; en iyi yerleşim bulunamayabilir. 1000 adet hesaplama eşiğinde arayüz `1000+` gösterir. 3D önizleme yoğunluğu kapasiteyi etkilemez.
- Menteşe süpürmesi 1° adımlı zarflar ve 1 mm tolerans kullanır. Kapak kalınlığı, çekmece gövdesi/önü/kulpu kapsanır. Kapak kulpları/donanımın ayrıntılı mekanik çarpışması, parçalar arası sürekli çarpışma ve engelde durma Aşama 5'tedir. Uyarılar hareketi durdurmaz.
- Pantolonluk, sepet ve özel donanım yerleşimleri temsilidir; üreticiye özgü delik/ray/yük bilgisi uydurulmadı. Kademeli askı seviyeleri düşeyde ayrılır; giysi şeklinin ayrıntılı mekanik analizi yapılmaz.
- Bu teslim marangoz üretim onayı veya tam parça ihracı değildir. Çekmece kasa parçaları ve beşgen kesim geometrisinin üretim raporuna açılması Aşama 5'te yapılmalıdır.
- 17 PBR malzeme, 6 kulp stili/yüzeyleri, Sunum Modu, LED, bitiş, çekmece/kapak editörleri ve çoklu seçim korunmuştur. Manuel doğrulama masaüstü Brave ile sınırlıdır; mobil/farklı tarayıcı matrisi test edilmedi. FPS garantisi verilmedi.

## Korunan Aşama 5 kapsamı

Sürgülü ve hibrit kapaklar; ray seçenekleri ve fiziksel hareket kuralları; kulptan sürükleme; kapak/çekmece çarpışması ve hareket sınırları; A/B tasarım ve kapasite karşılaştırması; adlandırılmış sürümler; AI JSON varyant köprüsü; ölçülü SVG/PDF cephe/plan/kesit ve modül detayları; CSV tam kesim listesi; çok sayfalı yazdırılabilir marangoz PDF'i; malzeme kalınlık özeti; beşgen poligonları/açıları ve bütün kesim ölçüleri; kapak/çekmece/arkalık/parça detayları; kenar bandı, damar yönü, donanım bilgileri ve doğrulanmamış üretim durumlarının açık işaretlenmesi. Ana plan ve Gereksinim A–Z geçerlidir. Donanım doğrulamasına bağlı katlanır köşe kapakları bu koşullarla ele alınacaktır.

Geliştirme burada durur. Aşama 5 için kullanıcının ayrıca onayı gerekir.
