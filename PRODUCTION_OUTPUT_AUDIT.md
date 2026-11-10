# Wardrobe Studio — Üretim Çıktıları ve Marangoz PDF Denetimi

Tarih:04.11.2026. Bu rapor mevcut dört gerçek örneğin nominal geometrisini ve belge kalitesini inceler. Uygulama/örnek kaynakları/PDF’ler değiştirilmedi. Bütün çıktıların birbirine eşit olmasıyla fiziksel doğruluk aynı kabul edilmedi.

## Karar ve kapsam

Parça kodları, adetler, nominal kesim en/boy/kalınlıkları ve malzeme alanları dört örnekte CSV/PDF/üretim JSON'u arasında tutarlı. SVG pafta komutları güncel kodla yeniden türetildi ve mevcut dosyalarla aynı çıktı. Beşgen raf/tabla matematiği bağımsız formüllerle doğrulandı.

Buna karşılık takı organizerleri fiziksel kesişiyor (AUD-003), bazı kapak merkezleri render/üretim arasında 1 mm ayrılıyor (AUD-009), B iç modül paftası rafları arkalıkla kapatabiliyor (AUD-016). Kulp koordinatı/pay/birleşim/dış açı gibi belge alanları eksik (AUD-017). Küçük ön/kalın tabanlı ek örnekte net çekmece yüksekliği fazla bildiriliyor (AUD-005). Bu yüzden “tutarlı nominal teknik paket” ile “kesin atölye kesim ve montaj emri” ayrı tutulmalıdır.

## Gerçek dosyalar ve tasarım kimlikleri

|Örnek /Design ID|Dış ölçüler /kalınlık|Fiziksel parça|Poligon|PDF /SVG sayfası|Kaynaklar|
|---|---|---:|---:|---:|---|
|straight /phase 5-straight|A:3000×2400×600 mm, 18/8 mm|69|0|21|[Design](C:/dev/Wardrobe-Studio/artifacts/phase5/examples/straight/design.json), [Resolved](C:/dev/Wardrobe-Studio/artifacts/final-audit/straight-resolved.json), [Üretim JSON](C:/dev/Wardrobe-Studio/artifacts/phase5/examples/straight/production.json), [CSV](C:/dev/Wardrobe-Studio/artifacts/phase5/examples/straight/cut-list.csv), [HTML](C:/dev/Wardrobe-Studio/artifacts/phase5/examples/straight/report.html), [PDF](C:/dev/Wardrobe-Studio/output/pdf/wardrobe-phase5-straight.pdf), [ZIP](C:/dev/Wardrobe-Studio/artifacts/phase5/examples/straight/technical-package.zip)|
|diagonal /phase 5-diagonal|A:3000×2400×600 mm, 18/8 mm; B:2600×2400×600 mm, 18/8 mm|94|5|39|[Design](C:/dev/Wardrobe-Studio/artifacts/phase5/examples/diagonal/design.json), [Resolved](C:/dev/Wardrobe-Studio/artifacts/final-audit/diagonal-resolved.json), [Üretim JSON](C:/dev/Wardrobe-Studio/artifacts/phase5/examples/diagonal/production.json), [CSV](C:/dev/Wardrobe-Studio/artifacts/phase5/examples/diagonal/cut-list.csv), [HTML](C:/dev/Wardrobe-Studio/artifacts/phase5/examples/diagonal/report.html), [PDF](C:/dev/Wardrobe-Studio/output/pdf/wardrobe-phase5-diagonal.pdf), [ZIP](C:/dev/Wardrobe-Studio/artifacts/phase5/examples/diagonal/technical-package.zip)|
|blind /phase 5-blind|A:3000×2400×600 mm, 18/8 mm; B:2600×2400×600 mm, 18/8 mm|81|0|28|[Design](C:/dev/Wardrobe-Studio/artifacts/phase5/examples/blind/design.json), [Resolved](C:/dev/Wardrobe-Studio/artifacts/final-audit/blind-resolved.json), [Üretim JSON](C:/dev/Wardrobe-Studio/artifacts/phase5/examples/blind/production.json), [CSV](C:/dev/Wardrobe-Studio/artifacts/phase5/examples/blind/cut-list.csv), [HTML](C:/dev/Wardrobe-Studio/artifacts/phase5/examples/blind/report.html), [PDF](C:/dev/Wardrobe-Studio/output/pdf/wardrobe-phase5-blind.pdf), [ZIP](C:/dev/Wardrobe-Studio/artifacts/phase5/examples/blind/technical-package.zip)|
|asymmetric /phase 5-asymmetric|A:3000×2400×600 mm, 25/4 mm; B:2600×2400×480 mm, 25/4 mm|94|5|39|[Design](C:/dev/Wardrobe-Studio/artifacts/phase5/examples/asymmetric/design.json), [Resolved](C:/dev/Wardrobe-Studio/artifacts/final-audit/asymmetric-resolved.json), [Üretim JSON](C:/dev/Wardrobe-Studio/artifacts/phase5/examples/asymmetric/production.json), [CSV](C:/dev/Wardrobe-Studio/artifacts/phase5/examples/asymmetric/cut-list.csv), [HTML](C:/dev/Wardrobe-Studio/artifacts/phase5/examples/asymmetric/report.html), [PDF](C:/dev/Wardrobe-Studio/output/pdf/wardrobe-phase5-asymmetric.pdf), [ZIP](C:/dev/Wardrobe-Studio/artifacts/phase5/examples/asymmetric/technical-package.zip)|

Her örneğin SVG dosyaları aynı örnek kökündeki svg klasöründedir. Mevcut PDF SHA256 değerleri [artifacts/final-audit/production-output-checks.json](C:/dev/Wardrobe-Studio/artifacts/final-audit/production-output-checks.json) içinde; dördü de eski manifest ile eşleşiyor. Kod/sayfa kimlikleri [artifacts/final-audit/examples-audit.json](C:/dev/Wardrobe-Studio/artifacts/final-audit/examples-audit.json) içinde listeli.

## Bağımsız doğrulama zinciri

1. Design normalize edildi, solveDesign iki kez ve JSON turuyla çözüldü; dört örnekte aynı geometri elde edildi.
2. Aynı sürüm adı/tarih ile kanonik üretim modeli yeniden türetildi; mevcut production.json ile tam JSON eşitliği bulundu.
3. CSV yeniden üretildi ve mevcut dosyayla byte düzeyinde aynı bulundu. SVG komutlarından 127 sayfanın tamamı yeniden türetildi ve mevcut SVG metinleriyle aynı bulundu.
4. Ayrı Python csv/zipfile/XML/pypdf araçları, dosya biçimlerini çözücüden bağımsız okudu.338 kesim satırının her birinde kod/adet/ölçü eşleştirildi. PDF kesim satırları ayrıca metin içinden en×boy×kalınlık olarak okunup karşılaştırıldı; 10 poligon koordinat/açı tablosu ve yuvarlanmış malzeme alanları eşleşti.
5. Polygon shoelace/hypot/atan2 ve N+1/2N formülleri uygulamadan ayrı yazıldı. Organizer kesişmesi ayrı kutu geometrisiyle bulundu; bu, ortak hatayı yakalayan adımdır.

Mevcut disk PDF'leri yeniden okundu ve Poppler ile yeniden render edildi; PDF'lerin byte düzeyinde yeniden üretim eşitliği iddia edilmez (PDF meta verileri değişebilir). Tarayıcıdan yeni PDF üretim bildirimi görüldü, indirme dosyası yakalanamadı. Yeni SVG komutlarının eşitliği, eski PDF içindeki sayısal ölçü/kod/font/sayfa kontrolü ve PDF yazıcısı kaynak incelemesi birlikte kullanıldı.

Kanıt: [artifacts/final-audit/independent-results.json](C:/dev/Wardrobe-Studio/artifacts/final-audit/independent-results.json), [artifacts/final-audit/production-output-checks.json](C:/dev/Wardrobe-Studio/artifacts/final-audit/production-output-checks.json), [artifacts/final-audit/pdf-numeric-checks.json](C:/dev/Wardrobe-Studio/artifacts/final-audit/pdf-numeric-checks.json), [artifacts/final-audit/pdf-numeric-review.py](C:/dev/Wardrobe-Studio/artifacts/final-audit/pdf-numeric-review.py).

## Fiziksel parça sayımı

|Rol|Düz|Beşgen|Kör|Asimetrik|
|---|---:|---:|---:|---:|
|Yan/duvar klapası|1|2|2|2|
|Baza|1|3|2|3|
|Üst klapa/taç|1|3|2|3|
|Kör köşe klapası|0|0|2|0|
|Normal dikme|3|3|5|3|
|Köşe dikmesi|0|2|0|2|
|Normal alt tabla|2|3|3|3|
|Normal üst tabla|2|3|3|3|
|Normal arkalık|2|3|3|3|
|Köşe arkalığı|0|2|0|2|
|Beşgen alt/üst/ara raf|0|5|0|5|
|Eğik köşe kapağı|0|1|0|1|
|Düz kapak/sürgü kanadı|3|6|6|6|
|Düz raf/bölücü|6|10|5|10|
|Çekmece önü|3|3|3|3|
|Çekmece sol/sağ yan|6|6|6|6|
|Çekmece arkası|3|3|3|3|
|Çekmece tabanı|3|3|3|3|
|Takı organizeri|33|33|33|33|
|**Toplam**|**69**|**94**|**81**|**94**|

Her fiziksel kesim satırının quantity değeri 1; aynı parça kodu tam kesim listesinde tek satırdır. Modül eşleştirme tablolarında ortak dikmenin aynı kodla iki modülde görünmesi doğrudur; bu ikinci bir kesim adedi değildir. Kodlar paket içinde benzersizdir; aynı sourceId başka tasarım/sürümde aynı kodu alabilir, bu nedenle tasarım/sürüm kimliğiyle birlikte kullanılmalıdır.

Resolved.summary.totalPanelsCount kesim adedi değildir: düz örnekte 61 çizim paneli ile 69 gerçek kesim parçası vardır. Görsel drawerBox dış kutusu çıkarılır, her çekmeceye 4 gerçek yan/arka/taban parçası eklenir; askı borusu gibi elemanlar levha yerine donanım olur. Yetkili kesim sayacı kanonik production.parts listesidir.

### Paylaşımlı ve ayrı konstrüksiyon

|Örnek/kol|Bay dış genişlikleri|Net genişlikleri|Gerçek dikme /beklenen|
|---|---|---|---|
|straight/run-A|1490, 1490|1454, 1472|3/3|
|diagonal/run-A|1040, 1040|1022, 1022|3/3|
|diagonal/run-B|1680|1662|2/2|
|blind/run-A|1250, 1730|1214, 1712|3/3|
|blind/run-B|1910|1874|2/2|
|asymmetric/run-A|1040, 1040|1015, 1015|3/3|
|asymmetric/run-B|1680|1655|2/2|

Bağımsız ek örnekte 2400 mm, 3 Bay için shared 4 dikme, separate 6 dikme; 18 ve 25 mm kalınlıkta net toplam+dikme toplamı 2400 mm. Bütün mevcut eski ayrı gövdeler otomatik shared'a dönüştürülmedi. Ana plandaki 800 mm tek gövde:800−2×18=764 mm; 25 mm için 750 mm. Paylaşımlı sınırın bütün kalınlığının bir Bay hesabına yüklenmesi mevcut tamsayı sahiplik kuralıdır; her Bay'de tekrar iki panel düşülmesi beklenmez.

## İki malzeme kalınlığı

|Ana /ince mm|800 mm tek Bay net genişlik|600 mm dış gövdede net derinlik|Çekmece yan/arka|Taban|
|---|---:|---:|---:|---:|
|18/8|764|592|18|8|
|25/4|750|596|25|4|
|18/3|764|597|18|3|
|16/6|768|594|16|6|
|22/10|756|590|22|10|

Beş kombinasyonun bağımsız örneği ve üretim JSON'u kaydedildi; dış ölçüler aynı kaldı. Güncel net derinlik kuralı D−arkalık kalınlığıdır; kapak gövdenin önünde olduğu için ayrıca ana panel kalınlığı düşülmez. Eski belgelerdeki D−t−tb ifadesi güncel geometrinin kanıtı sayılmadı.18/3 de şemada ve çözücüde destekleniyor. Her kombinasyon için ayrıca yeni PDF dosyası üretilmedi; tamsayı geometri/üretim modeli doğrulandı, 18/8 ve 25/4 gerçek dört PDF'de kontrol edildi.

Uçlar:18 mm taban ve 80 mm önlü küçük çekmecede fiziksel 32 mm net yerine 36 mm bildirme AUD-005; per-run 18/8↔25/4 karışık paylaşımlı köşede B tarafının A kalınlığından türemesi AUD-013. Olağan global iki kontrolün iki kolu birlikte değiştirmesi bu JSON uç riskini kaldırmıyor.

## Beşgen kesim matematiği

P-22170AE2 alt tabla ve diğer 4 aynı şekilli poligon için yerel V sırası, sol/arka ofset çıkarılarak bağımsız kuruldu. Dünya X/Z başlangıcı arka duvar birleşimidir; alt tablada Y=80 mm ekstrüzyon alt referansıdır, gerçek üst yüzey 80+t'dir. Alan mm² olabilir ve yarım mm² sonuca sahip olabilir; bu tamsayı mm uzunluk kuralının ihlali değildir.

|Özellik|18/8 eşit derinlik|25/4 asimetrik|
|---|---|---|
|ArmA/ArmB, DA/DB|900/900, 600/600 mm|900/900, 600/480 mm|
|Dünya ofseti X/Z|8/8 mm|4/4 mm|
|Yerel V1..V5|(0, 0), (874, 0), (874, 592), (592, 874), (0, 874)|(0, 0), (871, 0), (871, 596), (476, 871), (0, 871)|
|Dış parça sınırı|874×874 mm|871×871 mm|
|E1..E5|874, 592, 398.8082246, 592, 874 mm|871, 596, 481.3003220, 476, 871 mm|
|İç açılar V1..V5|90, 90, 135, 135, 90°|90, 90, 124.8457334, 145.1542666, 90°|
|Gerçek alan|724114 mm²=0.724114 m²|704328.5 mm²=0.7043285 m²|
|Dış sınır dikdörtgeni alanı|763876 mm²|758641 mm²|
|Dikdörtgenden çıkarılan üçgen|39762 mm²|54312.5 mm²|
|Damar|Yerel+X; horizontal/W|Yerel+X; horizontal/W|
|Ana kalınlık|18 mm|25 mm|

Eşit derinlik:874=900−18−8; 592=600−8. Eğik kenar sqrt(282²+282²)=398.8082246 mm. Alan 874²−282²/2=724114 mm². Asimetrik:871=900−25−4; 596=600−4; 476=480−4. Eğik kenar sqrt(395²+275²)=481.3003220 mm; alan 871²−395×275/2=704328.5 mm². atan2 ile bulunan açıların toplamı her beşgende 540°; uygulama acos sonucu ile eşleşir.

Dış ön açıklık (duvar kolları):sqrt((ArmA−DB)²+(ArmB−DA)²) eşit örnekte 424.264→424 mm, asimetrikte 516.140→516 mm. Dikmeler sonrası net açıklık sırasıyla 399 ve 481 mm. Gerçek eğik kapak kesimi 389×2276×18 ve 464×2276×25 mm; açıklık ölçüsüyle aynı değildir, panel/gap/yerleşim düşümleri vardır. Bunlar kanonik değerler ve belgeyle eşleşir; gerçek menteşe/profil imalat uygunluğu ayrıca uzman onayıdır.

PDF çizimindeki E3 ön eğik kenardır; E1 arka A duvarı, E5 arka B duvarı, E2/E4 ön doğrultu referanslarıdır. Yerel noktalar ofsetle dünya noktalarına döner. İç açı tablosu doğru; ayrı dış dönüş/kesim açısı ve kesin birleşim detayı eksikliği AUD-017 olarak kaldı.0.1 mm/0.1° yazı yuvarlaması, tamsayı V koordinatlarını veya alanı değiştirmez.

Kör örnekte öncelikli A derinliği 600 ve klapa 70 olduğundan B tüketimi 670 mm; A tüketimi 0. Beşgenle aynı poligon raf kesimi varsayılmadı.

Kanıt görüntüleri: [Özel parça çizimi](C:/dev/Wardrobe-Studio/artifacts/final-audit/pdf-detail-diagonal-21.png), [V/E/açı tablosu](C:/dev/Wardrobe-Studio/artifacts/final-audit/pdf-detail-diagonal-22.png).

## Çekmece üretimi ve montaj mantığı

Her mevcut örnekte 3 çekmece var. Her çekmecede yapısal ön +sol yan +sağ yan +arka +taban =5 gerçek kesim parçası; 11 organizer ayrı sayılıyor. Bu modelde görünen ön aynı zamanda kasanın ön duvarıdır; ikinci bir gizli iç ön duvar varsayılmadı. Hareketli dış kutu temsili levha kesim parçası değildir.

Düz örneğin ilk çekmecesi için:

|Parça/net|Gerçek nominal ölçü mm|
|---|---|
|Ön|1448×227×18|
|Sol yan ve sağ yan (her biri)|532×193×18|
|Arka|1394×193×18|
|Taban|1394×514×8|
|İç en×derinlik×yükseklik|1394×514×185|
|Planlanan hareket|451 mm (550×0.82 yuvarlama)|

Kasa dış eni 1430; iki 18 mm yan sonrası 1394. Kasa dış derinliği 532; 18 mm arka sonrası 514. Yan yüksekliği 193; 8 mm taban sonrası 185. Ön genişliği net hücre 1454−6=1448; kasa eni 1454−24=1430, iki yanda nominal 12 mm boşluk. Bu 12 mm ve hareket uzunluğu katalog ray montaj payı olarak onaylanmış değildir.

25/4 asimetrik ilk çekmecede ön 1009×227×25; yan 529×193×25; arka 941×193×25; taban 941×504×4; iç 941×504×189; hareket 454 mm. Beş fiziksel parça boyut ilişkisi tutarlı. Küçük ek örnekte görülen AUD-005 normal 227 mm önlü bu fixture'larda yoktur.

**Organizer kusuru:** Boyuna merkezler net eni dörde bölen konumlarda, enine kesimler ise 3 kalınlık düşülmüş dörtlü aralıklarda yerleşiyor. Bunlar aynı sınırları kullanmıyor. Düz/beşgende 3 mm ve 1 mm, körde 2 mm, asimetrikte 1 mm hacim kesişmesi bulundu. Birleşim çentiği tariflenmediğinden “geçme tasarlanmış” varsayılmadı. Hata kesim listelerinin eşitliğiyle yakalanmıyor; AUD-003 düzeltmesi gereklidir.

Organizatör hacmi net çekmece hacminden düşülüyor. Kesişen bölücülerde çift düşüm de oluşabilir; fark küçük olsa da önce yerleşim invariantı düzeltilmelidir. Gerçek kanal, vida, taban oturma ve ön bağlantısı seçilmedi; PDF nominal yerleşimi gösteriyor, birleştirme reçetesi vermiyor (AUD-027).

## Kapaklar, raylar ve fiziksel uygunluk

Düz örnek 3 ray/3 kanat; 2976 mm açıklık, 30 mm bindirme. Toplam kanat eni=2976+2×30=3036 mm; ray derinliği 100 mm gövdenin önüne ekleniyor, toplam dış derinlik 700 mm; iç 592 mm korunuyor. Beşgen/kör/asimetrikte A alt sürgü 2 ray, üst menteşe ve B menteşe açık/kapalı kapsamları bağımsız. Asimetrikte 25 mm kanat için 37 mm ray ekseni ve 90 mm ray zarfı; katalog kesiti hâlâ kesin değil.

Ek bağımsız matriste 2/3 ray×2..6 kanat=10 sistemde kanat toplamı−(N−1)×bindirme=açıklık tam tamsayı tuttu. Mevcut testler özel eşit olmayan kanatlar, yanlış genişlik/ray endeksi/yetersiz derinlik, B eksenindeki sürgü ve düşey ayrımı da kapsıyor. Açık çekmece/0.2 mm ince engel/same-track hızlı hareket geçişi engellendi. Üretim belgeleri kapalı referans pozdan üretiliyor; ekrandaki geçici açık poz kesim ölçüsünü değiştirmiyor.

|Örnek|>600 mm gerçek menteşeli kanatlar|Genişlik uyarısı|
|---|---|---|
|Beşgen|841×2276×18 (2 kanat)|Yok|
|Kör|866×555×18 (2 üst), 951/952×2276×18|Yok|
|Asimetrik|843×2276×25 (2 kanat)|Genişlik özel uyarısı yok; 25 mm genel ağırlık notu var|

Bu ölçüler otomatik imkânsız sayılmadı. AUD-008 genişlik uyarısı açığıdır; gerçek yoğunluk/kanat ağırlığı, menteşe adedi ve üretici yük eğrisi AUD-026 uzman işidir. Beşgen B kolundaki 1662 mm genişliğinde 18 mm raflar için SHELF_SPAN_EXCEEDED uyarısı vardır; eksik diye raporlanmadı. Gerçek sehim/destek ve 4 mm geniş taban taşıması yalnız geometriyle kesinleşmez.

Kapalı sağ kanatta tek sayılı genişlikten 1 mm merkez farkı AUD-009; bu kesim eni hatası değildir. Yine de hareket zarfı/render/teknik yerleşim farklılaştığı için düzeltilmelidir. Genel JSON kabul açıkları veya tavan çakışması, paket review olsa da geçersiz senaryolar üretebilir; “kritik hata yok” yazısı tüm fiziksel risklerin tarandığı anlamına gelmez.

## Malzeme alanı kontrolü

|Örnek|Malzeme /kalınlık|Fiziksel adet|Bağımsız net alan m²|
|---|---|---:|---:|
|straight|Keten Bej / Kaşmir (MDFLAM) /18 mm|8|8.0009040|
|straight|Sıcak Doğal Meşe (MDFLAM) /8 mm|38|9.8423280|
|straight|Sıcak Doğal Meşe (MDFLAM) /18 mm|23|14.2843340|
|straight toplam|Farklı gruplar ayrı toplanır|69|32.1275660|
|diagonal|Keten Bej / Kaşmir (MDFLAM) /18 mm|15|9.7603270|
|diagonal|Sıcak Doğal Meşe (MDFLAM) /8 mm|41|14.8589040|
|diagonal|Sıcak Doğal Meşe (MDFLAM) /18 mm|38|23.6556380|
|diagonal toplam|Farklı gruplar ayrı toplanır|94|48.2748690|
|blind|Keten Bej / Kaşmir (MDFLAM) /18 mm|15|10.9604820|
|blind|Sıcak Doğal Meşe (MDFLAM) /8 mm|39|14.7041640|
|blind|Sıcak Doğal Meşe (MDFLAM) /18 mm|27|19.7376600|
|blind toplam|Farklı gruplar ayrı toplanır|81|45.4023060|
|asymmetric|Keten Bej / Kaşmir (MDFLAM) /25 mm|15|9.9464260|
|asymmetric|Sıcak Doğal Meşe (MDFLAM) /4 mm|41|14.7977520|
|asymmetric|Sıcak Doğal Meşe (MDFLAM) /25 mm|38|21.8693985|
|asymmetric toplam|Farklı gruplar ayrı toplanır|94|46.6135765|

Dikdörtgenlerde W×H, poligonda gerçek shoelace alanı toplandı. PDF özetleri 3 ondalığa, poligon çizim alanı 4 ondalığa yuvarlıyor; bu belgelenen gösterim hassasiyetidir. Cam/ayna montaj zarfı, ham levha alanına katılmıyor; dört mevcut örnekte bu tür cam montaj satırı yok, davranışı T8 ayrı test ediyor.

Bu alan stok levha adedi/fire/testere payı/nesting hesabı değildir. Birim malzemelerin yoğunluğu/fiyatı veya maliyet kıyaslaması yapılmadı. Raf kapasitesiyle levha alanı da aynı metrik değildir; stüdyo ile A/B raf alanındaki farklı tanım AUD-022, buradaki net kesim alanının yanlış olduğu anlamına gelmez.

## Kenar bantlama, ham kesim ve donanım

|Bilgi|Mevcut kesinlik|Kalan karar|
|---|---|---|
|Parça W/H/T, damar, V/E referansı|Nominal bitmiş geometri olarak var|İmalat yönteminden doğan düşüm|
|Dikdörtgen kenar E1 alt/E2 sağ/E3 üst/E4 sol|Referans tanımı var|Hangi kenar görünür/bantlı, malzeme ve bant kalınlığı|
|Poligon ön/arka eğik kenar|V/E ve ön/arka açıklaması var|Bant ve birleşim sınırının kesin imalat detayı|
|Arkalık/taban|Adet/en/boy/kalınlık var|Kanal/içten/alttan bindirme, geçme/tolerans|
|Menteşe|Açı/yön, tahmini adet|Katalog model, yük, kupa/delik/vida merkezleri|
|Çekmece kızağı|Bir çift, planlanan hareket/kasa|Gerçek boy, tip, tam/kısmi açılım ve montaj payı|
|Sürgü rayı|2 profil ve kanat başına mekanizma planı|Profil kesiti, kesim düşümü, teker/stoper/yavaşlatıcı|
|Kulp|Model/yüzey/nominal uzunluk|Belgede çözülmüş konum; gerçek delik aksı katalogdan|
|Ayarlı raf|Dört pim/raf tahmini|32 mm sistem datum/ayar davranışı ve gerçek pim/delik|
|Gövde bağlantısı/ankraj|Belirlenmedi, null|Vida/minifix/kavela, yük, duvar türü ve saha tesisatı|
|LED|Şerit mm boyu|Volt, W/m, sürücü rezervi, kablo, profil, elektrikçi onayı|
|Baza/ayak|Geometrik zarf/yerleşim|Gerçek ürün ve yük/zemin çözümü|

Bilinmeyen bağlantı adetlerinin null olması sahte kesinlikten kaçınan doğru davranıştır; tek başına P0 değildir. Eksik bilinen kulp koordinatı/yön/pay tablosu AUD-017 yazılım/belge kapsamıdır. Katalog delikleri veya bant kalınlığı bilmeden ham ölçü hesaplamak önerilmedi. Önce usta/üretici kararı, sonra seçilmiş yöntemden ayrı ham kesim alanları türetilmeli. CNC/nesting sözleşmede v2+ olup bu denetimde zorunlu eksik sayılmadı.

**Montaj yeterliliği sorusunun cevabı:** Genel aksonometri, modül/köşe eşleştirmesi ve 8 sıralı montaj notu var. Parçaların hangi bağlantıyla, hangi delik/kanal/toleransla birleşeceğini gösteren yeterli montaj reçetesi ve patlatılmış çizim yok. Dolayısıyla yeni bir usta yalnız PDF'den bağımsız kesin montaj yapacak düzeyde belge mevcut değildir; genel planlama paketi olarak değerlidir.

## PDF görsel ve pratik kalite

Dört PDF’nin bütün 127 sayfası yeniden render edildi.13 temas görüntüsüyle tüm sayfalar; poligon çizimi/koordinatı, B modül detayı, yoğun kesim tablosu ve uyarı sayfaları ayrıca 1400 px tam sayfa görüntülerde incelendi. Bu yöntem her metnin fiziksel A3 baskıda okunmasıyla eşdeğer değildir; fiziksel baskı yapılmadı.

- Her sayfa yatay 419.99958×297.00008 mm; A3 toleransı içinde. SVG 420 mm×297 mm. Ölçek etiketleri fit hesabından 1:5/1:15/1:20 gibi seçiliyor; 874 mm poligonun 1:5 çizim eni 174.8 mm. Ekran zoom’u ve yazıcı “sayfaya sığdır” seçeneği baskı ölçeğini değiştirebilir; %100/gerçek boyut yazılmalıdır.
- Yerel gömülü NotoSans ile Türkçe karakterler hem çıkarılan metinde hem büyütülmüş örneklerde doğru. Tablo metni çoğunlukla 2.7 mm≈7.65 pt, ölçüler 2.8 mm≈7.94 pt; A3 üzerinde küçük ama yoğun listede kullanılabilir. Parça kodları tekrar başlıklı tablolarda bulunabiliyor.
- İncelenen temas ve tam sayfalarda görünür sayfa dışı kesilme, eksik son sayfa veya taşmış tablo tespit edilmedi. Bu, tüm olası uzun kullanıcı metinleri için tipografik garanti değildir; mevcut testler çizim komutu sınırlarını denetliyor, her glifin mürekkep sınırını değil.
- AUD-016':beşgen/asimetrik 17.sayfa B1 iç görünüşte rafları örtüyor; metin/cutlist doğru olsa da atölye görselini yanıltır.
- AUD-024:malzeme/kısa aralık tablolarında geniş boşluk; aynı şekilli beş poligonun çizim+koordinatı 10 sayfa. Hata sınıfı P3 sayfa ekonomisidir, geometri hatası değil.

Görsel kanıtlar: [Örtülen B iç görünüşü](C:/dev/Wardrobe-Studio/artifacts/final-audit/pdf-detail-diagonal-17.png), [Yoğun kesim listesi](C:/dev/Wardrobe-Studio/artifacts/final-audit/pdf-detail-asymmetric-31.png), [Uyarı ve8 montaj notu](C:/dev/Wardrobe-Studio/artifacts/final-audit/pdf-detail-asymmetric-39.png).13 temas resminin adı pdf-contact-{straight, diagonal, blind, asymmetric}-{n}.jpg biçimindedir; gereksiz 127 ara PNG tutulmadı.

## Üretim için kalan kabul adımları

1. AUD-002/003/005/006/009/012/013 global ve geometrik kusurları düzelt; bağımsız sınır/alan/kapanış regresyonlarını kalıcılaştır.
2. AUD-008 gerçek kanat uyarısını ve AUD-016/017 pafta/bilgi kapsamını tamamla.
3. Gerçek donanım, bant, ham kesim, arka/taban birleşimi ve destekleri ustayla kesinleştir (AUD-026/027).
4. Dört örneği yeniden üret; 338 tekil satır, 127 veya yeniden sayfalanmış karşılığı, kod, ölçü, alan ve poligon matematiğini tekrar karşılaştır.
5. Gerçek tarayıcı dosya indirmesini ve A3 %100 baskıyı kullanıcı doğrulasın; nihai oda rölevesi ve montaj onayı alınsın (AUD-028).

Bu denetimde hiçbir imalat ölçüsü veya uygulama kodu düzeltilmedi. Ayrıntılı bulgu tekrarı [FINAL_AUDIT.md](C:/dev/Wardrobe-Studio/FINAL_AUDIT.md), sözleşme izlenebilirliği [REQUIREMENTS_COVERAGE.md](C:/dev/Wardrobe-Studio/REQUIREMENTS_COVERAGE.md), pratik kontrol [USER_ACCEPTANCE_TESTS.md](C:/dev/Wardrobe-Studio/USER_ACCEPTANCE_TESTS.md) içindedir.
