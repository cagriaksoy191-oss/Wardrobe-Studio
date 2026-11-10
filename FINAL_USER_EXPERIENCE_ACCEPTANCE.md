# Wardrobe Studio · Son kullanıcı deneyimi kabulü

6 Kasım 2026 · Windows, Node.js 24.16.0, npm 11.13.0

Gerçek arayüz işlemleri gömülü Chromium tarayıcıda, ayrı bir test origin’indeki üretim derlemesinde yürütüldü. Ön plan ölçümleri ayrı geliştirme origin’inde alındı. Bulgular tarayıcı etkileşimini, çözücü ve dosya doğrulamasını, görsel değerlendirmeyi ayrı kanıtlar olarak kullanır. Bağımsız kullanıcı oturumu ve fiziksel donanım denemesi bekliyor. [Tarayıcı kanıtları](artifacts/final-user-acceptance/browser/) · [Sürüm kararı](FINAL_RELEASE_READINESS.md)

## Gerçek görevler

| Senaryo | Hedef, izlenen yol ve sonuç | Sürtünme, yanlış seçim riski ve insan kontrolü |
| --- | --- | --- |
| **A · İlk L-gardırop** | **Tamamlandı.** İlk ekranda **1. Oda & Köşe → Yeni tasarım → L**. Oda 2640 mm, dolap 2400 mm, A 2950 × 600 mm, B 2250 × 480 mm ile 3D gövde oluşturuldu. Hazır örnekler ayrı bir açılır bölümde. | Kullanıcı oda ve dolap yüksekliğini ayrı giriyor. Köşe seçiminin ne anlama geldiği ilk kez kullanan kişiyle denenmeli. [Form](artifacts/final-user-acceptance/browser/15-new-l-form.jpg) · [3D sonuç](artifacts/final-user-acceptance/browser/16-new-l-created.jpg) |
| **B · İç düzen** | **Tamamlandı.** A ve B uçlarındaki yeşil **+** ile raflı, uzun askılı ve dört çekmeceli bölmeler oluşturuldu. Ayrı örnekte 650 mm ayakkabılık 390 px’de, boş bölme masaüstünde eklendi. Raf grubu 6’dan 7 aralığa çıkarıldı. Son aralık 306’dan 350 mm’ye alındı, komşu 261 mm’ye ancak onaydan sonra düştü. Son aralığa **Hızlı Modül Ata → Yüklük / Hurç** uygulandı. **Çekmece adedi** alanında 3 → 4 ve Geri Al/Yinele denendi. | Ekleme varsayılan olarak kol boyunu koruyor. Raf adedini değiştirirken raf ile raf aralığının farklı sayılar olduğunu anlamak gerekiyor. Üst rafta yanlış büyütme yönü önizlemede engellendi. Yüklük mevcut hücreye modül olarak atanıyor. [Raf ve yüklük](artifacts/final-user-acceptance/browser/41-shelves-loft-intervals.jpg) · [Çekmece adedi](artifacts/final-user-acceptance/browser/23-drawer-count-edit.jpg) |
| **C · Boyut ve otomatik cephe** | **Tamamlandı.** Bölme listesinden A2 seçildi, **Sabit Genişlik → Sabit Dış Genişlik** ile 1040 → 1120 mm girildi. A1 1040 → 960 mm, net A2 1022 → 1102 mm, iki üst menteşeli kanat 521 × 555 → 561 × 555 mm oldu. A kolu 3000 mm kaldı. Geri Al ve Yinele aynı ölçüleri geri getirdi. | Dış ve net iç genişlik ayrı gösteriliyor. Esnek bölmeyi sabite geçirmek ek bir adım. Üretim kesimiyle eşleşme ayrıca otomatik testte denetlendi. [Ölçü ve kanatlar](artifacts/final-user-acceptance/browser/40-hinge-width-reflows.jpg) |
| **D · Köşe erişimi** | **Tamamlandı, belirtilen çözümle.** Köşe kapağı gerçekten açıldı ve B1 sol kapağa karşı 5,1° sınır bildirimi verdi. **Erişim ve çözümleri incele → Köşeyi açık bırak → Önizle → Çözümü uygula** denendi. Dört raftaki engel kalktı. 25/4 mm örneği ayrıca uygulandı ve geri alındı. 390 px’de uygulama sonrası odak **3D Perspektif** düğmesine döndü. | Kapak ve donanımın kaldırılması önizlemede açıkça yazıyor. Kapalı cephe isteyen kullanıcı için bu iki örnekte doğrulanmış menteşeli çözüm yok. Her iki örnekte bir askı çıkarma yolu saha kontrolünde kalıyor. [Fiziksel duruş](artifacts/final-user-acceptance/browser/69-diagonal-physical-stop.jpg) · [Önizleme](artifacts/final-user-acceptance/browser/06-diagonal-remedy-preview.jpg) |
| **E · Sürgü ve çekmece** | **Tamamlandı.** **2. İç & Kapak** içindeki milimetre sürgüleriyle kanat 2, 982 mm’ye ve kanat 1, 1964 mm’ye park edildi. Çekmeceler açıldı. Açık çekmeceler varken kanat 1, 1458 mm’de durdu. Çekmeceler kapanınca 0 mm’ye döndü. 3D kulpu sürükleme 0 → 252 mm hareket verdi. Ayrı olarak kör köşe alt sürgülü aralığı açık bırakıldı ve üç çekmece açıldı. | **Kapak Düzenle** açıkken tıklama seçim içindir. Açma komutu editörde ayrıca yer alır. Seçim ve hareket modlarının ayrımı görünür. Sürükleme sırasında odak kaybı, işletim sistemi pointer iptali ve dokunma testi bekliyor. [Ray duruşu](artifacts/final-user-acceptance/browser/18-slider-stops-at-open-drawers.jpg) · [Kör köşe çekmece önizlemesi](artifacts/final-user-acceptance/browser/08-blind-drawer-remedy-preview.jpg) |
| **F · Görsellik** | **Kısmen doğrulandı.** **3. Malzeme / Çıktı → Yüzey → Kapak** üzerinden yedi yüzey denendi. **Kulp** sekmesinde düğme kulp, sahnede **LED**, **3D Eşyalar**, **Sunum Modu** ve kılavuz görünümü denendi. Kapaklar kapalı ve açılma komutundan sonra ayrı kareler alındı. | Kapak, gövde ve raf ayrı yüzey grupları. Karşılaştırmada kapak değişirken raf ve gövde grupları sabit referans olarak kullanıldı. Cam okunaklı. Aynanın statik stüdyo yansıması bazı açılarda düz griye yakın. [Cam](artifacts/final-user-acceptance/browser/29-glass-presentation-closed.jpg) · [Ayna](artifacts/final-user-acceptance/browser/28-mirror-presentation-closed.jpg) |
| **G · Ergonomi** | **Tamamlandı.** **Oda & Köşe → Kişiler & erişim** bölümünde Anne 1580 mm ve Baba 1850 mm girildi. **İç & Kapak → Envanter** altında Anne için 12 gömlek eklendi. Kapasite 21, ayrılan 12, eksik 0 olarak gösterildi. Erişim haritası açıldı. | Miktar alanı hedef oluşturulunca görünür. Kapasite tahmini kullanıcı eşyasının ölçüsü ve gerçek erişimle karşılaştırılmalı. [Envanter](artifacts/final-user-acceptance/browser/24-ergonomics-inventory.jpg) |
| **H · Oda** | **Kısmen doğrulandı.** **Oda & Köşe → Oda engelleri → Yatak → Engel ekle**. 1600 × 550 × 2000 mm yatak, **2D Üst Plan** ve **Süpürme alanları** katmanında çakışma ile görüldü. Tekerlekle yakınlaşma gerçekleşti. | Plan, kapak ve oda engelini birlikte gösteriyor. Tarayıcı aracındaki birincil düğmeyle sürükleme planı kaydırmadı. 2D sağ tuşla kaydırma ve gerçek dokunma hareketi ayrıca denenmeli. [Üst plan ve süpürme](artifacts/final-user-acceptance/browser/26-top-plan-sweep-overlay.jpg) |
| **I · A/B ve sürüm** | **Tamamlandı.** **Malzeme / Çıktı → Sürüm / AI → Aktif tasarımı yeni sürüm kaydet**. **Kabul A** 3000 mm, **Kabul B** 3100 mm olarak saklandı. A/B penceresinde 3100 mm çalışma kopyası ile arşivdeki 3000 mm sürüm karşılaştırıldı. 69/69 parça ve 1012 mm’ye karşı 1045/1045/1046 mm sürgü enleri görüldü. Pencere Escape ile kapandı. Test sekmesi yeniden açılınca Kabul A arşivden açıldı. | Arşiv, otomatik kurtarma ve manuel kayıt noktası üç ayrı işlem. Arayüz ayrımı açıklıyor. İlk defa kaydeden kullanıcının bunları ayırt etmesi ölçülmeli. [A/B](artifacts/final-user-acceptance/browser/12-ab-3100-vs-3000.jpg) · [A sürümünü yeniden açma](artifacts/final-user-acceptance/browser/55-named-version-reopened.jpg) |
| **J · Teknik ön kontrol** | **Tamamlandı.** **Malzeme / Çıktı → Üretim**. Düz örnekte 25 sayfalık önizlemede P-12D9E348 arandı, genişliğe sığdırma kullanıldı ve PDF/CSV/SVG/ZIP alındı. Beşgende tanısal PDF indirildi, CSV ve ZIP düğmeleri engel varken devre dışı kaldı. | Ön kontrol geometri, erişim ve donanım durumlarını ayrı gösteriyor. A3 baskı ve marangozun paftayı okuma süresi sahada kontrol edilmeli. [Düz önizleme](artifacts/final-user-acceptance/browser/10-production-straight.jpg) · [Tanısal indirme](artifacts/final-user-acceptance/browser/52-diagnostic-download.jpg) |

## Seçim ve düzenleme

- Tek hücre ve tek çekmece ayrı seçildi. Shift ve Ctrl ile üç aralık bir gruba eklendi. A cephesindeki kutu sürüklemesi dört aralık seçti. Dört öğelik seçim B cephesine geçerken korundu. Escape önce etkin çoklu seçim aracından, kapak düzenleme sırasında da editörden çıktı. Toplu açma düğmesine hızlı çift tıklama sonrası komut başlangıç durumuna döndü ve B kolu 2600 mm kaldı. [Shift/Ctrl](artifacts/final-user-acceptance/browser/42-shift-ctrl-selection.jpg) · [Kutu seçimi](artifacts/final-user-acceptance/browser/44-marquee-front-a.jpg) · [Çift tıklama](artifacts/final-user-acceptance/rapid-press.json)
- 3D orbit sonrası bir ölçü etiketinin ekran konumu yerleştiğinde 931 × 324 px idi. B cephesi ve 3D arasında dönünce aynı konum okundu. Kapak editöründe 561 × 555 × 18 mm ve nominal/güvenli 155° görüldü. Çekmece editörü bağımsız ön yüksekliği ve kızak türünü gösterdi. [3D dönüş](artifacts/final-user-acceptance/browser/48-orbit-restored.jpg) · [Kapak editörü](artifacts/final-user-acceptance/browser/50-door-edit-start.jpg) · [Çekmece editörü](artifacts/final-user-acceptance/browser/51-drawer-edit.jpg)
- Sürgü ve kutu seçiminde Escape temizleme yoluna bağlandı. Pointer iptali ve pencere odağı kaybı için temizleme yolları kodda var. Elde tutulan fare işaretçisiyle arka plana geçiş ve işletim sistemi pointer iptalinin gerçek etkileşim sonucu doğrulanmadı. 
- İlk adım oda ve yeni tasarıma ayrıldı. Örnek açma tek geri alma adımı kullanıyor. Bölme ekleme formu doğru başlangıç içeriğini, kol boyunun korunacağını veya seçilen uzatmayı ve hedef kolu gösteriyor. Sığmayan sabit bölme denemesi testte çalışma kopyasını, seçimi ve geçmişi korudu.
- Kalan bilgi yükü özellikle yoğun masaüstü seçim panelinde ve iç düzen önizlemesinde. Günlük işlemler üstte veya seçimin yanında. Bindirme, ray ekseni ve menteşe eli kapak/donanım ayrıntılarında. **Dış genişlik** gövdenin kapladığı alan, **net iç** kullanılabilir iç genişlik, **esnek** kalan alanı paylaşan ölçü, **kayıt noktası** elle geri dönülen çalışma kopyası, **ön kontrol** üretim dosyalarından önceki incelemedir.

## Ekran boyutları ve odak

| Pencere | Belge genişliği | Gözlem |
| --- | ---: | --- |
| 1600 × 900 | 1600 px | Yan paneller ve 3D aynı anda açık. Erişim, A/B ve teknik pafta pencereleri kullanıldı. |
| 1366 × 768 | 1366 px | Sahne ve erişim düğmesi görünür. İkinci düzey araçlar **Araçlar** altında. |
| 1024 × 768 | 1024 px | Sahne tam genişlikte. **Tasarım paneli** ve **Seçim ve uyarılar** ayrı ayrı açıldı ve Escape ile kapandı. |
| 390 × 844 | 390 px | Dosya seçiciyle proje açıldı, ölçü paneli ve erişim penceresi kullanıldı, 650 mm ayakkabılık eklendi. |
| 360 × 800 | 360 px | Model, ölçü paneli ve ekran içine sığan bölme penceresi görüldü. |

390 px’de eski sahneye bağlı bölme formunun sağ kenarı 442 px’ye kadar taşıyordu. Son form 8–382 px, 360 px’de 8–352 px arasında kaldı. Kapat ve ekleme düğmeleri pencere içinde. Erişim penceresinde yedi Tab adımı pencere içinde kaldı. Escape açan düğmeye, başarılı uygulama kalıcı 3D görünüm düğmesine döndü. [Ölçüm](artifacts/final-user-acceptance/layout-browser.json) · [Önceki taşma](artifacts/final-user-acceptance/browser/37-mobile-add-bay-before-fix.jpg) · [390 px son form](artifacts/final-user-acceptance/browser/66-mobile-bay-final-390.jpg) · [Odak](artifacts/final-user-acceptance/mobile-apply-focus.json)

Masaüstü tarayıcı yeniden boyutlandırması kullanıldı. Gerçek telefonda parmakla seçim, kaydırma, ekran klavyesi ve küçük ikon hedefleri için kabul açık. Dar ekranda seçili hücrenin bağlamsal paneli yeşil artının üstüne gelebiliyor. Seçimi kapatmak modelin uçlarını yeniden erişilebilir yapıyor.

## Yüzeyler, ışık ve sunum

| Yüzey | Görsel gözlem |
| --- | --- |
| Açık İskandinav meşe | Açık ton ve kapakta dikey damar göründü. [Kare](artifacts/final-user-acceptance/browser/27-acik-mese.jpg) |
| Amerikan ceviz | Meşeden daha sıcak ve koyu. [Kare](artifacts/final-user-acceptance/browser/27-amerikan-ceviz.jpg) |
| Koyu İtalyan ceviz | Kapak sınırları seçilebilir kaldı. Koyu tonda damar kontrastı daha düşük. [Kare](artifacts/final-user-acceptance/browser/27-koyu-ceviz.jpg) |
| İpek mat beyaz | Kapaklar açık tonda ve derzler okunaklı. [Kare](artifacts/final-user-acceptance/browser/27-beyaz-mdflam.jpg) |
| Adaçayı mat lake | Düz yüzey ile damarlı malzeme görsel olarak ayrılıyor. [Kare](artifacts/final-user-acceptance/browser/27-mat-lake.jpg) |
| Şeffaf temperli cam | Çerçeve ve raf/eşya derinliği görünür. Sunumda yansıma ile şeffaflık aynı cephede okunabiliyor. [Kare](artifacts/final-user-acceptance/browser/29-glass-presentation-closed.jpg) |
| Gümüş boy aynası | Kapalı yüzey opak, stüdyo çevre haritasını yansıtıyor. Oda ve hareket eden nesnelerin gerçek zamanlı ayna yansıması kapsam dışı. [Kare](artifacts/final-user-acceptance/browser/28-mirror-presentation-closed.jpg) |

Yüzey seçimi aynı kamera açısından sahneye işlendi. Kapalı yaprakların çerçeve konumu ve açıklıklar görsel olarak tutarlı kaldı. LED kontrolü ve açık kapaklarla iç hacim incelendi. Aydınlık farkı malzeme ve sahne pozuna bağlı, fotometrik ölçüm yapılmadı. Sunum Modu ölçü/kılavuzları gizledi, **Kılavuzları göster** ile geri getirildi. Kıyafet ve hurçlar hacimle orantılı göründü. Gerçek ürün ölçüsü veya malzeme numunesiyle görsel eşleştirme bekliyor. [Açık kapak, LED ve kulp](artifacts/final-user-acceptance/browser/31-presentation-open-led-toggle.jpg) · [Kılavuz kontrolü](artifacts/final-user-acceptance/browser/32-presentation-guides-and-items.jpg)

## Gerçek ön plan performansı

1600 × 900 test penceresinde geliştirme derlemesinin `?qa-performance` ölçeri 180 kare örnekledi. Kayıtlarda görünürlük `visible` ve belge odağı açık. Piksel ölçüsü WebGL tamponudur. 3D pencereleri için tablo milisaniye cinsinden p50/p95 aralığını gösterir. Hareket satırları art arda girişleri içeren pencerelerdir. A/B ve üretim satırları pencere açıkken arka planda devam eden tuvalin kare süresidir.

| Durum | WebGL px | 180 kare süresi | p50 / p95 |
| --- | --- | ---: | ---: |
| Kapalı 3D, LED kapalı | 928 × 770 | 1,58 sn | 8,9 / 12,8 ms |
| Açık, 3D eşyalar açık, LED kapalı | 928 × 737 | 1,49 sn | 8,1 / 11,1 ms |
| Açık, 3D eşyalar ve LED açık | 928 × 737 | 1,84 sn | 10,0 / 12,7 ms |
| Sunum ve GTAO, LED ve eşyalar açık | 928 × 737 | 3,07 sn | 16,9 / 19,4 ms |
| Büyük L, kapalı, 14 bölme | 928 × 810 | 2,51 sn | 13,6 / 19,2 ms |
| Büyük L, art arda orbit | 928 × 810 | 3,03–3,65 sn | 16,3–18,2 / 21,4–32,7 ms |
| Büyük L, kutu seçimi, 63 hücreye kadar | 928 × 810 | 3,35–3,93 sn | 14,5–15,7 / 48,4–70,8 ms |
| Sürgü kulpu, tekrar sürükleme | 928 × 810 | 1,71–2,11 sn | 9,5–9,8 / 14,1–23,3 ms |
| A/B penceresi | 928 × 810 | 1,77 sn | 9,9 / 13,6 ms |
| Üretim önizlemesi | 928 × 810 | 1,86 sn | 10,2 / 13,4 ms |

A/B ve teknik önizleme görünür olana kadar araç üzerinden yaklaşık 323 ms ve 307 ms geçti. Bu sayılar araç gecikmesini de içerir. En belirgin kısa takılma büyük toplu seçimde ölçüldü. Örneklenen konsolda WebGL hata/uyarı kaydı görülmedi. Bellek tüketimi ve uzun oturumlar ölçülmedi. [Ham ön plan örnekleri](artifacts/final-user-acceptance/foreground-performance.json) · [63 hücre seçimi](artifacts/final-user-acceptance/browser/62-foreground-marquee.jpg)

## Kayıt, kurtarma ve gerçek dosyalar

Manuel kayıt noktası alındı, A2 1120’den 1180 mm’ye değiştirildi, menüden kayıt noktasına dönülünce 1120 mm geri geldi. F5 sonrası manuel kaydedilmemiş 3100 mm’lik çalışma otomatik kurtarmada açıldı. Test sekmesi kapatılıp yeniden açılınca çalışma kopyası ve iki adlandırılmış sürüm görüldü. Tarayıcı sürecinin tamamen kapatılması ve yeniden başlatılması ayrı bir kullanıcı testi. [Kayıt noktasına dönüş](artifacts/final-user-acceptance/browser/53-checkpoint-restored.jpg) · [Sekmeyi yeniden açma](artifacts/final-user-acceptance/browser/54-test-tab-reopened.jpg)

Geçersiz JSON, geçerli tasarımı ve seçilebilir ölçüleri korudu. Hata ekranı dosyanın neden açılmadığını ve hangi dosyanın seçileceğini Türkçe açıkladı. 32.432 baytlık geçerli dosya gerçek seçiciden 14 bölme, 144 hücre, 28 menteşeli kanat ve 42 çekmeceyle açıldı. localStorage ve IndexedDB tekil/çift hataları, eski kanal seçimi ve geciken kayıt/kurtarmanın yeni düzenlemeyi ezmemesi, kontrollü hata enjeksiyonlu testlerle doğrulandı. [Geçersiz dosya](artifacts/final-user-acceptance/browser/22-invalid-json-final.jpg) · [Büyük dosya](artifacts/final-user-acceptance/browser/14-large-design-import.jpg) · [Kayıt regresyonları](tests/remediation-session.test.ts)

| Gerçek indirme | Doğrulanan içerik |
| --- | --- |
| Tasarım JSON, iki dosya | 3567 ve 5171 bayt. Geçerli Design ve kanıt örneğiyle aynı veri. İndirilen düz tasarım standart seçiciden tekrar açıldı. |
| Sürüm JSON | 3567 bayt. A sürümünün kaynak Design içeriğiyle eşleşti. |
| Düz üretim PDF | 121.227 bayt. 25 yatay A3 sayfa, 69 parça kodu, her sayfada 50 mm baskı kontrolü. |
| Beşgen tanısal PDF | 168.781 bayt. 41 sayfa. İlk sayfada kullanım engeli, 5,1° / 110° ve 0 / 310 mm. |
| Düz kesim CSV | 41.070 bayt. UTF-8 BOM ve Türkçe başlıklar, 69 benzersiz parça satırı, çözülen kesim ölçüleriyle eşleşme. |
| Kapak paftası SVG | 8582 bayt. `viewBox`, çizim ve parça etiketleri bulunan geçerli SVG. |
| Düz teknik ZIP | 80.660 bayt. CRC sağlam, 29 öğe içinde 25 SVG pafta, indirilen CSV ile birebir aynı CSV ve eşleşen Design. |
| 3D PNG | 765.128 bayt. 1856 × 1621 px, geçerli PNG. |

İndirme bitiş olayları ve oluşan dosyaların içeriği birlikte denetlendi. [Dosya içerik doğrulaması ve SHA-256](artifacts/final-user-acceptance/download-qa.json) · [İndirilen dosyalar](artifacts/final-user-acceptance/downloads/)

## Son kullanıcıdan bekleyenler

1. Kendi oda ölçüleriyle yeni L oluşturun. Bir raf ve çekmece ekleyip yüklüğü bulun. Kapak ölçüleri ve komşu boyutundaki otomatik değişikliği kontrol edin.
2. Kendi kapağınız, kulpunuz ve eşyanızla köşe rafı/askı geçişini ölçün. Kör köşede çekmeceyi tam çıkarıp sürgünün duruşunu görün.
3. Manuel kayıt, F5, tarayıcıyı tamamen kapatıp açma ve adlandırılmış sürüme dönme adımlarını kendi profilinizde tekrarlayın.
4. Telefonda dosya açmayı, form ve ölçü panelini, pan/zoom’u ve hızlı seçimi deneyin. Masaüstünde aktif sürüklemede pencere odağını değiştirin.
5. A3 PDF’yi kendi okuyucunuzda açıp %100 baskıda 50 mm çizgiyi ölçün. Tanısal örnekleri, donanım ve saha ölçüleriyle birlikte inceleyin.
