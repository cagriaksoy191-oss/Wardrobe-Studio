# Wardrobe Studio — Kullanıcı Kabul Testleri

Tarih:04.11.2026. Bu rehber düzeltme yapmaz. “Beklenen” ürünün doğru davranışıdır; “Mevcut denetim” bu turdaki kanıtı veya bilinen kusuru gösterir. Bilinen kusuru tekrar görmeniz yeni bir kullanım hatası değildir.

## Hazırlık ve sonuç kaydı

Önem sırası:önce UAT-06/16/26/30/33; sonra UAT-10/13/28/29/34/35. Görünüm ve dar ekran gibi bu denetimde tam doğrulanmayan maddeleri de UAT-08/14/15/17/20/25 ile tamamlayın.

Gerçek çalışmalarınızın bulunduğu 5173/5175 sekmelerini test için kullanmayın. Denetim 5180'de sentetik kayıtlarla yapıldı. Tamamen yeni oturum için PowerShell'i proje dizininde açıp ayrı bir port kullanabilirsiniz:

~~~powershell
Set-Location 'C:\dev\Wardrobe-Studio'
npm run dev -- --host 127.0.0.1 --port 5181 --strictPort
~~~

Tarayıcıda [izole test uygulamasını](http://127.0.0.1:5181/) açın. Farklı port ayrı localStorage/IndexedDB origin'idir. Örnek JSON'ları üst sağdaki dosyadan yükleme düğmesiyle açabilirsiniz; AI testinde “Sürüm / AI” içindeki ayrı önizleme yolunu kullanın.

|Kısa ad|Gerçek örnek|
|---|---|
|Düz|[Üç raylı düz Design](C:/dev/Wardrobe-Studio/artifacts/phase5/examples/straight/design.json)|
|Beşgen|[18/8 beşgen Design](C:/dev/Wardrobe-Studio/artifacts/phase5/examples/diagonal/design.json)|
|Kör|[Karma kör köşe Design](C:/dev/Wardrobe-Studio/artifacts/phase5/examples/blind/design.json)|
|Asimetrik|[25/4 asimetrik Design](C:/dev/Wardrobe-Studio/artifacts/phase5/examples/asymmetric/design.json)|

Her testte şu kısa kaydı tutun:

~~~text
Test kimliği / tarih / tarayıcı:
Başlangıç örneği ve sürüm adı:
Adımlar ve girilen mm değerleri:
Beklenen:
Görülen:
PASS / FAIL / TAMAMLANAMADI:
Ekran görüntüsü; çıktı dosya adı; ilgili AUD kimliği:
~~~

Beklenmeyen sonuçta önce ekranı ve mevcut değeri kaydedin; ardından gerekiyorsa Geri Al ile dönün. Bir düğmeyi sonucu gözlemeden tekrar tekrar tıklamayın. Uygulamayı yeniden açma/Undo, hatanın kanıtını kaydetmenin yerine geçmez. Kaydet checkpoint'i geçmişi sıfırlar; adlandırılmış sürüm ayrı tasarım kopyasıdır.

## 1. Aşama 1–2 — Temel tasarım

### UAT-01 — Boş projeden asimetrik L oluşturma

**Ekran/adımlar:** 1. Oda & Köşe → Yeni Tasarım / Sıfırdan. Adı “KABUL—L” yapın; L-Tipi Köşe Dolap ve Beşgen seçin. A uzunluk 2800, derinlik 600; B uzunluk 2200, derinlik 480; yükseklik 2400 mm. Boş Gardırobu Oluştur ve Başla'ya basın. 3D, 2D Cephe(A), B cephesi ve 2D Üst Plan arasında geçin.

**Beklenen:** İki kol ve köşe doğru yönde; girilen dış ölçüler korunur; boş iç hacimler seçilebilir. **Mevcut denetim:** Aynı ana akış tarayıcıda başarılı.

### UAT-02 — Dış/net ölçü ve kalınlık

**Ekran/adımlar:** Düz bir boş tasarımda tek bölmenin dış genişliğini 800 mm, derinliğini 600 mm yapın; diğer bölmeleri bu testten ayrı tutun. Ana panel 18, ince panel 8 mm. Bölmeyi seçip net etiketleri okuyun. Sonra 25/4'e geçin; Geri Al yapın.

**Beklenen:** Tek bağımsız dış 800 mm gövdede 764→750 mm net genişlik; 592→596 mm net derinlik; dış ölçüler sabit. Arkalık/taban 8→4 mm. **Not:** Paylaşımlı çoklu Bay'de sınır sahipliği nedeniyle her Bay'den tekrar 2 panel düşmeyebilir. **Mevcut denetim:** Bağımsız 800 mm örnek ve otomatik testlerle doğrulandı.

### UAT-03 — Paylaşımlı / ayrı gövdeler

**Ekran/adımlar:** Üç bölmeli düz örnekte 1. Oda & Köşe → Gövde konstrüksiyonu; A kolunu Paylaşımlı dikme'den Ayrı gövdeler'e değiştirin. Ön görünüşte ve üretim kesim listesinde dikmeleri karşılaştırın; Undo.

**Beklenen:** 3 Bay için 4 yerine 6 dikme; dış Bay genişlikleri korunur, net ölçüler yeniden hesaplanır. Eski JSON sessizce başka konstrüksiyona dönüşmez. **Mevcut denetim:** 18/25 mm bağımsız sayım ve mevcut testler PASS.

### UAT-04 — Kilitli ölçü ve imkânsız değişiklik

**Ekran/adımlar:** Düz tasarımda ilk bölmeyi Sabit Genişlik 800 mm ve kilitli yapın; diğerini Flex bırakın. Kol uzunluğunu 100 mm artırın, sonra sabit genişliklerin toplamından küçük bir değere düşürmeyi deneyin.

**Beklenen:** 800 mm sabit kalır; esnek alan artışı alır. İmkânsız değer anlaşılır hata verir ve son geçerli tasarım korunur; Undo bir işlemi geri alır. **Mevcut denetim:** Birim testleri/flex sınır denetimi PASS.

### UAT-05 — Köşe ve asimetrik derinlik

**Ekran/adımlar:** Beşgen örnekte A/B kol 900 mm ve derinlik 600/600 mm değerlerini not edin; B derinliğini 480 yapın. Sonra ayrı Kör örnekte klapa 70 mm değerini veB başlangıç tüketimini inceleyin. İmkânsız köşe ölçüsünü ayrı bir deneme kopyasında deneyin.

**Beklenen:** Beşgen eğik açıklık derinliklerle değişir; körA öncelikli 600+70=670 mm B tüketir. İstenen köşe kol ölçüsü sessizce başka değere dönüşmemeli. **Mevcut denetim:** Olağan geometri PASS; JSON'da aşırı derinlik/kısa kol AUD-012 nedeniyle sessiz yükseltilebiliyor.

### UAT-06 — JSON dışa/içe turu ve F5

**Ekran/adımlar:** Örnek bir tasarımda ayırt edici ölçü, malzeme ve LED ayarı yapın. Üst JSON düğmesinden dosya indirin; dosyanın gerçekten oluştuğunu kontrol edin. Başka test tasarımı açın; ilk dosyayı geri yükleyin; F5 yapın.

**Beklenen:** Ad, ölçüler, kalınlık, malzeme, LED, kayıt ve geometri aynı olmalı. **Mevcut denetim:** İçerik turu ve olağan F5 PASS; gerçek tarayıcı indirme dosyası UNVERIFIED. localStorage bulunmayan gecikmiş IDB geri yüklemesinde AUD-001 var; gerçek profilinizde depolama silerek bunu zorlamayın, izole teknik betik kanıtı mevcut.

## 2. Aşama 2.1–2.4 — Gelişmiş editör

### UAT-07 — Gerçek seçili raf aralığını düzenleme

**Ekran/adımlar:** Bir boş hücreye 3 raflı Raf Grubu atayın; 4 aralık oluşur. Kapakları Gizle yapın. İkinci aralığa tıklayın, etiket/adın yalnız onu gösterdiğine bakın. Y değerini 50 mm artırın; taslağı ve komşu dengeleme teklifini inceleyin, onaylayın; Undo.

**Beklenen:** Yalnız seçili aralık büyür; komşu ancak onayla dengelenir; diğerleri korunur. Undo eski rafları aynı yere getirir. **Mevcut denetim:** Sanal aralık, ortadaki iki aralığı yeniden bölme ve komşu koruma tarayıcıda PASS.

### UAT-08 — Normal/X-Ray/Gizle ve tıklama ayrımı

**Ekran/adımlar:** Menteşeli kapaklı bir bölmede Normal→X-Ray→Normal→Gizle→X-Ray→Normal yapın. Her Normal dönüşünde kulp yerine kapak yüzeyinin ortasına tıklayın. Kapalı opak kapak arkasındaki hücreyi seçmeyi deneyin; ardından Gizle'de aynı iç hacme tıklayın.

**Beklenen:** Yüzey tıklaması hâlâ kapağı açar; kapağı açmak başka hücreyi seçmez. Kapalı opak yüzey arkası seçilmez; Gizle/X-Ray'de doğru iç hücre seçilir. **Mevcut denetim:** Seçim kuralları kaynak/testlerde var; bütün geçiş sıraları ve X-Ray dönüşünde yüzey etkileşimi bu turda tam denenmedi.

### UAT-09 — Marquee ve Ctrl çoklu seçim

**Ekran/adımlar:** 2D Cephe'ye geçin, Kapakları Gizle ve Çoklu Seçim Aracı'nı açın. Üç bitişik aralığı çevreleyen dikdörtgen sürükleyin. Sürüklerken kontur ve canlı vurguyu, bitince grup ölçüsünü okuyun. Ctrl ile bir hücre ekleyip çıkarın.

**Beklenen:** Dikdörtgen içi şeffaf, kenarı siyah kesikli/kontrast; OrbitControls sürükleme sırasında dönmez. Toplam ölçü ara raf kalınlıklarını da içerir. **Mevcut denetim:** Gerçek drag sonunda 3 aralık ve 1113 mm gross=1077 mm net+2×18 mm PASS; ara kare canlı vurgusu ayrıca doğrulanmalı.

### UAT-10 — Yönlü X/Y/Z ankrajı

**Ekran/adımlar:** Seçili hücrenin yüzen panelinde Y yukarı/aşağı ve X sola/sağa yönlerini ayrı ayrı deneyin. Değişimden önce sabit sınır etiketini not edin.600 mm dış/592 mm net derinlikte Z→Arka seçip 500 mm net isteyin.

**Beklenen:** Etikette sabit denen yüzey yer değiştirmez. Komşu çakışması önce taslakta kalır. **Mevcut denetim:** Z Arka küçültme FAIL (AUD-004):etiket ön 600 sabit dese de ön 508 mm'ye gidiyor. X'in iki yönü kullanıcı turu bekliyor. Ayarlı raf için sözleşmedeki 32 mm sistem adımı da mevcut değil (AUD-018); serbest mm ayarıyla karıştırmayın.

### UAT-11 — Bağımsız çekmece ve grup

**Ekran/adımlar:** Düz örneği yükleyin. Normal modda ilk çekmeceyi aç/kapatın. Çoklu Seçim Aracı ile aynı çekmeceyi seçin; ön yüksekliğini 227'den 250 mm'ye uygulayın. Sonra Shift/Ctrl ile iki çekmece seçmeyi, adet ve iç/dış çekmece ayarını deneyin; her adımı Undo ile geri alın.

**Beklenen:** Normal tık hareket, düzenleme tık seçim yapar. İlk ön 250 mm olurken diğerleri 205/227 mm ve grup 690 mm kalır. Gerçek seçili çekmeceyle değişen ön aynı olmalı. **Mevcut denetim:** Tek ön/Undo tarayıcıda PASS; çekmecelere özel Ctrl/Shift çoklu fare turu UNVERIFIED. Kısmi/tam kızak seçimi yok (AUD-023).

### UAT-12 — Farklı raf grupları

**Ekran/adımlar:** Aynı Bay'in üst kısmına raf, alt kısmına ayakkabılık grubu koyun. İki gruptan aralıkları birlikte seçin. Her Grubu Kendi İçinde Eşit Dağıt ve ortak aralık sayısı değişimini ayrı ayrı deneyin. Bitişik uygun gruplarda Grupları Tek Hacimde Birleştir ve Yeniden Böl'ü kullanın.

**Beklenen:** Ayrı eşitlemede her grubun gross yüksekliği korunur; birleştirme ancak açık komutla olur. Sabit raf/çekmece sınırları sessizce kaldırılmaz; bir Undo toplu işlemi geri alır. **Mevcut denetim:** Mevcut birim testleri PASS; bu denetimde ayrı çoklu-grup UI turu yapılmadı.

### UAT-13 — Bağımsız kapak editörü

**Ekran/adımlar:** Kapak Düzenle'yi açın; bir kanadı seçin. Sol/sağ/çift menteşe, 110/155/165° seçeneklerini ve üst/alt ayırmayı deneyin. Üst yüklük kapağı ve alt kapağı ayrı yapın; birleştirin. Kapsanan bitişik bölmelerde iki Bay'i birlikte işaretleyin; aralığı açık bırakıp geri alın.

**Beklenen:** Editörde tıklama animasyon yerine seçer. Başlangıç/bitiş yükseklikleri ve kapsam doğru; kapağın dikme oturma sınırı, gap ve komşuları görselde kontrol edilir. Normal moda dönüşte hareket geri gelir. **Mevcut denetim:** Böl/birleştir/kapsam testleri PASS; tarayıcıda hibrit ayırma ve editörde hareketin durması PASS. Tüm özel ön sınırlarının oturması ayrı kullanıcı kontrolü bekliyor; tek sayılı sağ kanatta 1 mm fark AUD-009.

### UAT-14 — Yüzen panelin ekran sınırları

**Ekran/adımlar:** Hücre, çekmece ve kapak seçerek farklı panelleri açın. Tarayıcıyı geniş ve dar pencere yapın; kamerayı döndürün/yaklaştırın; gelişmiş bölümleri açın. Panelin altına kendi kaydırmasıyla ulaşın.

**Beklenen:** Panel ekran dışına kaçmaz; seçili bölgeyi gereksiz örtmez; ölçülerden üstte durur; tüm kontroller erişilebilir. **Mevcut denetim:** 1707×848 görünümde kullanıldı; tüm dar ekran/kamera durumları doğrulanmadı.

### UAT-15 — Ayrı kamera durumları

**Ekran/adımlar:** 3D'de belirgin bir açıya dönüp yakınlaşın.2D Cephe'ye geçip pan/zoom yapın; Üst Plan'a geçip farklı pan/zoom yapın.3D'ye dönün; sonra her 2D görünümüne yeniden dönün. Son olarak Görünümü Sıfırla'yı deneyin.

**Beklenen:** Son 3D açı/hedef/yakınlık korunur; 2D kameralar da kendi durumunu yalnız açık resetle kaybeder. **Mevcut denetim:** 3D dönüşü görsel/kod ile PASS.2D pan/zoom korunumu bu turda denenmedi; kodda sabit zoom ile yeniden kurulum görülüyor, özellikle kaydedin.

### UAT-16 — Kalıcı Undo/Redo ve checkpoint

**Ekran/adımlar:** Kaydet'e basın. Bir ölçüyü 800→850→900 mm yapın; F5. İki kez Geri Al ve iki kez Yinele deneyin. En az 6 farklı işlem yaptıktan sonra geçmiş menüsünden 5 İşlem Geri Al ve tek adım listesini deneyin. Son Manuel Kayıt Noktasına Dön'ü seçin; Redo yolunu kontrol edin.

**Beklenen:** F5'ten sonra 900 açılır; Undo 850/800'e gider. Geçmiş/checkpoint ayrımı ve durum metni doğru; manuel Kaydet geçmişi sıfırlar. **Mevcut denetim:** Olağan yol PASS; 75 işlem ve 50 adımlık sınırın arkasındaki checkpoint otomatik testte doğrulandı. Gecikmiş IDB/kota kusurları AUD-001/007 ayrı teknik testlerle bulundu.

## 3. Aşama 3 — Malzeme ve görsel sistem

### UAT-17 — Malzeme bağımsızlığı ve UV

**Ekran/adımlar:** 3. Malzeme / Çıktı → Yüzey. Önce İç Raf Yüzeyi için farklı ahşap seçin; sonra Gövde & Dikmeler için ceviz seçin. Rafın ilk seçiminin korunup korunmadığını izleyin. Kapakları mat lake, çekmece önünü kaşmir yapın. Bir bölmeyi genişletin. Cam, ayna ve metal seçeneklerini farklı açılardan inceleyin; 18→25 mm ana kalınlığı deneyin.

**Beklenen:** Malzemeler bağımsız; damar dikmede/kapakta dikey, rafta yatay; doku uzamaz. Saydam/yansıtıcı görünüm doğru, çakışık yüzey titremesi yok. **Mevcut denetim:** Katalog/UV testleri ve ceviz geçişi PASS; gövde olay işleyicisi raf malzemesini de koşulsuz yazıyor (AUD-030). Bu özel sıra için kullanıcı tekrarı bekleniyor. Tüm shader/kalınlık/açı kombinasyonları görsel olarak tüketilmedi.

### UAT-18 — Altı kulp ve kalınlık

**Ekran/adımlar:** Kulp sekmesinde 6 modeli, renkleri, boyları ve yönleri deneyin. Kapak ve çekmece kulpunu farklı seçin. İkisini açıp kapatın; 18→25 mm yapın.

**Beklenen:** Kulp hareketli parçayla birlikte gider; kapaktan/çekmeceden ayrılmaz; birinin seçimi diğerini değiştirmez. **Mevcut denetim:** Model/kalınlık konumu testleri PASS; kulptan sürgü sürükleme gerçek tarayıcıda PASS.

### UAT-19 — LED ve minimal bitiş

**Ekran/adımlar:** LED/Işık sekmesinde sıcaklık 3000→4000K, parlaklık düşük/yüksek ve LED kapalı/açık deneyin. Gömme sekmesinde Düz Gömme / Minimal Bitiş'i uygulayın; üst taç/yan/baza/ayak seçeneklerini değiştirin.

**Beklenen:** LED rafta/boruda doğru konumda; kalınlık değişince havada kalmaz. Taç/çıta kaldırılınca taşıyıcı üst/alt/dikmeler kalır. Zemine yakın boşluk ve tavana uyum uyarıları görünür olmalı. **Mevcut denetim:** LED/minimal yapısal testleri PASS; oda tavanından yüksek gövde için çapraz uyarı eksik AUD-006. Gerçek LED gücü/ayak yükü dış onaydır.

### UAT-20 — Gerçek eşya boyu ve görsel akıcılık

**Ekran/adımlar:** Yaklaşık 944 mm net yüksek askı hücresine Uzun Elbise / Palto önizlemesi atayın. Servis nişine merdiven koyun; 3D Eşyalar'ı kapatın. Geniş örnekte Sunum/Düzenleme/X-Ray arasında geçerken kapak aç/kapatın; aynı kamera ve pencere boyutunda takılmayı not edin.

**Beklenen:** Uzun eşya küçülerek sığmamalı; uygunsuzluk açık görünmeli. Genel eşya anahtarı tüm eşyayı gizlemeli. Hareket belirgin takılmamalı; FPS söylenecekse ölçüm gerekir. **Mevcut denetim:** AUD-015 dar hücreye küçültme; AUD-014 servis eşyasının genel gizleme dışında kalması. N8AO/InstancedMesh yok, ışık bütçesi plandan farklı (AUD-020). Bu denetimde kare süresi ölçülmedi.

## 4. Aşama 4 — Ergonomi, envanter ve oda

### UAT-21 — Anne/Baba/Ortak erişim

**Ekran/adımlar:** 1. Oda & Köşe → Kişiler & erişim. Anne 1500, Baba 1800 mm girin; Erişim haritası ve Anne/Baba göz hizası düğmelerini deneyin. Bir bölmeyi Anne, sonra Ortak yapın; yüksek askı uyarısını ve varsa boruyu indir Quick-Fix'ini uygulayın; Undo.

**Beklenen:** Boydan hesaplanan Anne göz 1395, günlük 1575, üst 1875 mm; Ortak kısa kişinin sınırını kullanır. Özel erişim değeri girerseniz “Boydan hesapla”ya dönmeden otomatik oran beklemeyin. **Mevcut denetim:** Profil/ortak/kamera/Quick-Fix testleri ve Anne 1500 UI girişi PASS; short/medium/long boru türü etkisiz AUD-010.

### UAT-22 — Ortak kapasite ve gerçek eşya ölçüsü

**Ekran/adımlar:** 800 mm tek gövdede tekli askı ve Ortak sahiplik kurun.2. İç & Kapak → Envanter & gerçek kapasite; Anne ve Baba için 12'şer gömlek hedefi ekleyin; askı başına aralık 45 mm yapın. Sonra eşya derinliğini hücreden büyük yapın.

**Beklenen:** 764 mm netten kullanılabilir 724 mm/45→16 gömlek; ilk hedef 12, ikinci 4 alır, toplam 32 sayılmaz. Büyük fiziksel derinlik sığmama/eksik hedef üretir. “Kapasite” tek tür hesabı, “Ayrılan” birlikte kullanılan alandır. **Mevcut denetim:** 16 toplam ve ters hedef sırası bağımsız doğrulandı; ilk-uygun yaklaşım optimum/adil dağıtım değildir.

### UAT-23 — Yatak ve oda kapısı engeli

**Ekran/adımlar:** Oda engelleri → Yatak → Engel ekle. X400, Y0, Z900; boyut 1600×550×2000 mm yapın. Üst planda yerleşimi incele ve Süpürme alanları'nı açın. Çarpışma uyarısını/Quick-Fix'ini deneyin; Undo. Ayrı denemede Oda kapısı, Kolon ve yüksek Y'deki Kiriş/Pencere ekleyin.

**Beklenen:** Gerçek düşey aralıkla çakışma; yalnız üstünde duran engel yanlış bloklamamalı. Quick-Fix bir adım; Undo eski engeli getirir. **Mevcut denetim:** Yatak çakışması veZ2230 Quick-Fix tarayıcıda PASS; diğer türlerin geometri testleri PASS.

### UAT-24 — Özel şablon, kopya ve yansıma

**Ekran/adımlar:** Seçili bölme için Şablonu uygula menüsünden Yüklük, Kademeli L-Askı, Kör Valiz, Takı Çekmecesi seçeneklerini ayrı ayrı deneyin. Bölmeyi kopyalayın ve yansıtın; kimliği/adı ve dış genişliği not edin; Undo.

**Beklenen:** Şablonlar ölçüye göre uyarı verir; L boruları farklı yükseklikte; kopya yeni hücre kimlikleriyle gelir. Çok Bay ortak kapağının yalnız tek parçası kopyalanamıyorsa açık hata ve eski tasarım korunmalı. **Mevcut denetim:** Bu işlevlerin testleri PASS; takı bölücü yerleşimi AUD-003 hatalı, köşe askı alanı hasHangingRod uygulanmıyor AUD-011.

## 5. Aşama 5 — Mekanik, sürüm, AI ve çıktı

### UAT-25 —2/3 ray ve doğrudan fare hareketi

**Ekran/adımlar:** Düz örnekte 2. İç & Kapak → Menteşeli / Sürgülü / Açık cephe. Ray düzeni 2 ve 3'ü ayrı deneyin; kanat adedi 2/3/4, bindirme 30 mm. Kapak Düzenle ve Çoklu Seçim kapalıyken kulpu, yüzeyi ayrı ayrı sürükleyip bırakın. Ray sonuna hızlı hareket edin; fareyi canvas dışına çıkarıp bırakmayı ve kamera döndürmeyi deneyin.

**Beklenen:** Kanat ekseninde takip/bırakılan konumda duruş; ray sınırını veya aynı raydaki kanadı aşmama. Editör/çoklu seçimde sürükleme kapalı; kamera hareketi yanlış kanat sürüklemesi başlatmaz. **Mevcut denetim:** Kulp drag ve editör koruması tarayıcıda PASS; normal yüzey drag, pointercancel ve tüm kamera iptal durumları bu turda ayrıca doğrulanmadı.

### UAT-26 — Açık çekmeceye gerçek temas

**Ekran/adımlar:** Düz 3 ray örneğini taze yükleyin. Soldaki çekmeceleri açmaya çalışın; kapalı sürgüde engel mesajını görün. Birinci kanadı 1964 mm, ikinciyi 982 mm sınırına götürün; çekmeceleri açın. İlk kanadı geri kapatmayı deneyin; sonra çekmeceleri kapatıp tekrar deneyin.

**Beklenen:** Açık çekmece varken sürgü temas noktasında gerçekten durur; uyarı tek başına yeterli değildir. Çekmece kapanınca yol açılır. **Mevcut denetim:** İlk sürgü 1458 mm'de durdu; 3D açık çekmece hacmi ve gerekçe görüldü.0.2 mm engel hızlı geçişi bağımsız geometri testinde de engellendi.

### UAT-27 — Hibrit ön ve üretim engeli

**Ekran/adımlar:** Düz örnekte Üst menteşeli / alt ayrı'ya basın; üst ve alt sistem türlerini inceleyin. Bir aralığı açık bırakın. Sonra ray derinliğini 50 mm yapın; 3. Malzeme / Çıktı → Üretim'e gidin; Undo.

**Beklenen:** Menteşeli+sürgülü+açık aralık aynı modelde çalışır; örtüşen yanlış kapsam uyarılır. Yetersiz rayda PDF/CSV/ZIP kapalı; Undo geçerli geometriyi ve düğmeleri geri getirir. **Mevcut denetim:** 2 menteşeli+2 sürgü UI ve 50 mm üretim kapısı PASS. Algılanmayan global/statik kusurlar AUD-002/003 ayrıca açık.

### UAT-28 — Sürüm yaşam döngüsü ve A/B

**Ekran/adımlar:** 3. Malzeme / Çıktı → Sürüm / AI. “KABUL—A” kaydedin; ölçü değiştirip “KABUL—B” kaydedin. A'yı yeniden adlandırıp arşivleyin; Arşivlenenleri de göster ile açın; Undo/Redo; F5. A/B'de farklı modeli seçin.

**Beklenen:** Arşiv/checkpoint/aktif kopya ayrı; sürüm açma geri alınabilir. Parça/alan/hacim farkları gerçek çözümden; dış kol ölçü farkları da açık karşılaştırılmalı. **Mevcut denetim:** Yaşam döngüsü ve 11 metrik PASS; kol uzunluk/derinlik/yükseklik farkı satırları eksik AUD-021. Sağ raf alanı özeti ile A/B farklı tanımda AUD-022.

### UAT-29 — AI JSON güvenli önizleme

**Ekran/adımlar:** Dış AI → Tam JSON ve talimatları hazırla / kopyala. İstemde mevcut tam Design'ı görün. Yanıt alanına önce {"schemaVersion":1}, sonra Düz örneğin tam JSON'unu yapıştırın; JSON doğrula ve önizle. Geçerli olanı Öneriyi yeni sürüm kaydet ile kaydedin; aktif tasarımı ayrıca açmadan değişmediğine bakın.

**Beklenen:** Bozuk belge reddedilir; geçerli öneri ayrı sürüm olur; aktif modele geçiş açık eylem/Undo ile yapılır. **Mevcut denetim:** Bu akış PASS; eksik/yinelenmiş ID, bad ray/tür/ölçü/büyük JSON teknik testleri PASS. Birleşimsiz L ve genel import farklılıkları AUD-002; wrapper kanıt dosyasını doğrudan Design diye yüklemeyin, teknik tekrarda yalnız içindeki design nesnesi kullanılır. Dış AI'ya bu denetimde veri gönderilmedi.

### UAT-30 — Gerçek PDF/CSV/SVG/ZIP indirme

**Ekran/adımlar:** Geçerli Düz örnekte Üretim → Paftaları ve kesim listesini geniş önizle. PDF indir, Tam CSV indir, Tüm SVG + CSV + JSON(ZIP), Bu paftayı SVG indir düğmelerini tek tek kullanın. Her seferinde tarayıcı indirme listesinde ve gerçek klasörde dosyayı bulun, açın; ad/boyut/tarihi kaydedin.

**Beklenen:** Başarı mesajına ek olarak gerçek okunabilir dosya oluşmalı; PDF 21 sayfa, CSV 69 veri satırı, ZIP 21SVG+CSV+Design içermeli. Yazdırılabilir rapor ayrıca açılmalı. **Mevcut denetim:** UI ve export dosyası içerikleri doğrulandı; otomasyonun gerçek download olayı 12 s'de dönmedi. Bu test özellikle sizin tamamlamanız gereken UNVERIFIED noktadır.

## 6. PDF ve gerçek üretim doğruluğu

### UAT-31 — Dört örneğin sayımı

**Ekran/adımlar:** [Düz PDF](C:/dev/Wardrobe-Studio/output/pdf/wardrobe-phase5-straight.pdf), [Beşgen PDF](C:/dev/Wardrobe-Studio/output/pdf/wardrobe-phase5-diagonal.pdf), [Kör PDF](C:/dev/Wardrobe-Studio/output/pdf/wardrobe-phase5-blind.pdf), [Asimetrik PDF](C:/dev/Wardrobe-Studio/output/pdf/wardrobe-phase5-asymmetric.pdf) açın. Kapak sayısı/sayfa ve tam kesim toplamını CSV ile karşılaştırın. Bir ortak dikme kodunu modül tablolarında ve tam listede bulun.

**Beklenen:** Sırasıyla 21/39/28/39 sayfa ve 69/94/81/94 fiziksel parça. Ortak kod birden fazla modülde görünse de tam kesim listesinde tek adet. **Mevcut denetim:** Bütün 338 satır bağımsız parser ile PASS.

### UAT-32 — Beşgen gerçek şekil ve alan

**Ekran/adımlar:** Beşgen PDF 21–22.sayfayı açın; P-22170AE2 çizimi/koordinatını okuyun.874×874 dış sınırı ve 398.8 mm eğik kenarı inceleyin. Asimetrikte aynı kodun 871 sınırını, 481.3 mm eğik kenarını karşılaştırın.

**Beklenen:** Beşgende V=(0, 0), (874, 0), (874, 592), (592, 874), (0, 874); alan 0.724114 m². Asimetrik V=(0, 0), (871, 0), (871, 596), (476, 871), (0, 871); alan 0.7043285 m². Dış dikdörtgen kesim/alan olarak alınmaz; damar+X ve ön eğik kenar belirgin. **Mevcut denetim:** Koordinat/kenar/iç açı/alan PASS; ayrı dış açı ve kesin birleşim detayı AUD-017.

### UAT-33 — Gerçek çekmece parçaları ve takı bölücüsü

**Ekran/adımlar:** Düz örnek ilk çekmeceyi PDF/CSV'de bulun. Ön 1448×227×18; iki yan 532×193×18; arka 1394×193×18; taban 1394×514×8 mm kontrol edin. Net 1394×514×185 mm'yi izleyin; organizatör kesimlerini ustayla kuru yerleşim olarak inceleyin.

**Beklenen:** 5 gerçek parça+ayrı bölücüler; dekoratif dış kutu tek levha sayılmaz. Parçalar tarifli birleşim dışında kesişmez. **Mevcut denetim:** Sayım/net normal örnekte PASS; organizerlerde 1–3 mm kesişme AUD-003. Küçük ön/18 mm taban ek örnekte net 32 yerine 36 mm AUD-005. Bu kusurlar varken bu parçaları yalnız dosyaya güvenerek kesin kestirmeyin.

### UAT-34 — Geniş kapak, raf ve donanım kontrolü

**Ekran/adımlar:** Beşgen B1'de 841×2276×18 mm kapak ve 1662 mm geniş 18 mm rafı inceleyin. PDF uyarı sayfasında raf desteği ve kapak genişliğini arayın. Menteşe/ray/kulp/raf desteği/duvar sabitleme/LED listesini gerçek usta ve katalogla eşleştirin.

**Beklenen:** Her gerçek geniş kanat için uyarı; raf için sehim/destek uyarısı; gerçek yük/delik kararı uzman onaylı. **Mevcut denetim:** Raf uyarısı var; çift/özel geniş kanat uyarısı yok AUD-008. Bu ölçüler otomatik imkânsız değildir. Tahmini menteşe adedi veya planlama ray zarfı katalog onayı sayılmaz.

### UAT-35 — A3 baskı, bant/ham kesim ve yerinde montaj

**Ekran/adımlar:** PDF'yi A3 yatay, %100/Gerçek boyut ile basın; “sayfaya sığdır”ı kapatın.1:5 poligonun 874 mm kenarını cetvelle yaklaşık 174.8 mm ölçün. Küçük font/kodları, tablo sonlarını ve B1 iç görünüşte rafları kontrol edin. Ustayla her görünür kenarın bant türü/kalınlığını, ham kesim düşümünü, arka/taban birleşimini ve bağlantı yöntemini yazılı netleştirin. Gerçek odada tavan/gönye/kot/priz/ankraj ve servis çıkarma yolunu ölçün.

**Beklenen:** Ölçek ve font okunur, kesim-montaj tarifi belirsiz değil, yerinde ölçü onaylı. **Mevcut denetim:** PDF gerçek 420×297 mm, ekran/font/sayfa bölme PASS; fiziksel baskı ve saha onayı yapılmadı. B1 iç görünüşte raf örtülmesi AUD-016; montaj/konum ayrıntısı AUD-017; ham kesim/bant/donanım/saha AUD-026–028. Genel aksonometri ve 8 not, patlatılmış bağlantı/montaj reçetesi değildir.

## Kabul sonrası

Sonuçları test kimliği ve AUD kimliğiyle eşleştirin. FAIL veya TAMAMLANAMADI maddesini PASS olarak işaretlemeyin. Düzeltme sonrası önce ilgili kısa regresyonu, ardından kritik tasarım→kayıt→mekanik→çıktı turunu tekrarlamak yeterlidir.

Bu rehberin öncesinde uygulamaya düzeltme uygulanmadı. [Bulgular ve düzeltme sırası](C:/dev/Wardrobe-Studio/FINAL_AUDIT.md), [gereksinim matrisi](C:/dev/Wardrobe-Studio/REQUIREMENTS_COVERAGE.md) ve[üretim ayrıntıları](C:/dev/Wardrobe-Studio/PRODUCTION_OUTPUT_AUDIT.md) ayrı raporlardadır.
