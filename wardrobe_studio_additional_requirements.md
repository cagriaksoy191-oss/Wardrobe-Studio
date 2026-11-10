# Wardrobe Studio — Ek Zorunlu Ürün Gereksinimleri (Additional Requirements)

> **Belge Statüsü:** `wardrobe_studio_master_plan.md` Ana Planına Eklenen Zorunlu Özellikler Belgesi  
> **Temel Kural:** Bu belge [wardrobe_studio_master_plan.md](file:///C:/dev/Wardrobe-Studio/wardrobe_studio_master_plan.md) içindeki **hiçbir özelliğin yerine geçmez, hiçbir özelliği silmez veya kapsam dışına çıkarmaz.** Ana plandaki 5 aşamanın tüm hedefleri aynen korunur; aşağıdaki tüm ek yetenek paketleri mevcut aşamalara eklenir.  
> **Son Güncelleme:** 03.11.2026 (Aşama 2.4, Aşama 3 Gömme Gövde Bitişleri ve Aşama 5 Profesyonel Üretim Dokümantasyonu Eklendi)

---

## 1. Eklenen Zorunlu Ürün Özellikleri

### A. Akıcı ve Kesintiye Duyarlı Menteşeli Kapak Hareketleri
- Kapalı bir menteşeli gardırop kapağına veya kulpuna tıklandığında kapak, gerçek menteşe pivot ekseni etrafında doğal ve akıcı bir yay/sönümleme animasyonuyla açılır.
- Açık kapağa tekrar tıklandığında aynı akıcılıkla kapanır.
- **Hareket Sırasında Yön Değiştirme (Mid-Flight Reversal):** Kapak açılırken veya kapanırken hareket tamamlanmadan tekrar tıklanırsa, konum sıçraması (jump/reset) yapmadan o anki açısından kesintisiz biçimde ters yöne döner.
- Menteşe türüne göre gerçek açılma açısı sınırları (`110°` standart, `155°` sıfır çıkıntılı, `165°` geniş açılı) ve kapak-çekmece sıralama kuralları (ör. iç çekmece açıkken kapağın önce çekmeceyi kapatması) uygulanır.

### B. Akıcı ve Kesintiye Duyarlı Çekmece Hareketleri
- Kapalı bir çekmeceye veya kulpuna tıklandığında çekmece kasası, ön yüzü ve kulpu birlikte gerçek teleskopik ray doğrultusunda akıcı bir animasyonla dışarı kayar.
- Açık çekmeceye tekrar tıklandığında kapanır.
- **Hareket Sırasında Yön Değiştirme:** Çekmece hareket hâlindeyken yeniden tıklandığında anlık konumundan kesintisiz şekilde yön değiştirir.
- Kızak açılma sınırları (`0.80` kısmi veya `1.0` tam çekmeli) aşılmaz; menteşeli kapak arkasındaki **iç çekmecelere** tıklandığında kapak kapalıysa önce kapak otomatik açılır, ardından çekmece çıkar.

### C. Değiştirilebilir Kapak ve Çekmece Kulpları (Bağımsız Özelleştirme)
- Tamamlanmış kişisel platformda tüm kapakların ve çekmecelerin kulpları kullanıcı tarafından özelleştirilebilir.
- **Kulp Seçenekleri:**
  - Farklı kulp modelleri (ör. Modern Çubuk/Bar Kulp, Minimal Düğme/Knob Kulp, Uzun Dikey Mimari Profil Kulp, Klasik Kavisli Kulp, Gömme/J-Profil Kulp),
  - Farklı renk ve yüzey malzemeleri (Mat Siyah, Fırçalanmış İnox/Krom, Antik Bronz/Pirinç, Altın, Gövde Rengi),
  - Farklı boyutlar (ör. `128 mm`, `160 mm`, `320 mm`, `600 mm`, `1000 mm`) ve uygun montaj konumları (dikey/yatay, üst/orta/alt hiza).
- **Bağımsız Seçim:** Kapak kulpları ile çekmece kulpları birbirinden bağımsız olarak seçilebilir ve bağlı oldukları hareketli kapak/çekmece ile birlikte 3D uzayda birebir hareket eder.

### D. Sürgülü Kapaklar ve Karma (Hibrit) Kapak Sistemleri (Zorunlu Özellik)
- Sürgülü kapak sistemi artık isteğe bağlı değil, tamamlanmış kişisel platformun **zorunlu** bir özelliğidir.
- Kullanıcı şu üç gardırop kapak mimarisini de özgürce oluşturabilir:
  1. **Tamamen Menteşeli Kapaklı Gardırop**,
  2. **Tamamen Sürgülü Kapaklı Gardırop** (2 veya 3 raylı, ön/arka ray ofsetli sistem),
  3. **Karma (Hibrit) Gardırop** (ör. L-gardırobun bir kolunda veya belirli bir bölme grubunda sürgülü kapaklar, köşe veya diğer bölmelerde menteşeli kapaklar ve dış çekmeceler).
- Gerçek ray derinlik payı (`~80–100 mm`), kapak örtüşme bölgeleri (overlap) ve montaj kuralları denetlenir; mekanik olarak imkânsız kombinasyonlarda (ör. tek bölmeye sürgülü kapak takmaya çalışmak veya sürgülü kapak örtüşme çizgisinde açılmayan çekmece bırakmak) kullanıcıya açık uyarılar gösterilir.

### E. Sürgülü Kapağı Kulpundan Fareyle Tutarak Serbest Sürükleme
- Sürgülü kapak yalnızca tıkla-aç/kapat animasyonuyla sınırlı kalmaz; kullanıcı sürgülü kapağın kulpuna (veya yüzeyine) fareyle basılı tutup **sağa veya sola doğrudan sürükleyebilir**.
- Kapak kendi ray ekseni boyunca fare hareketini gerçek zamanlı takip eder ve fare bırakıldığında geçerli konumunda durur (istenirse tekrar sürüklenebilir).
- Kapak, rayın sol/sağ mekanik bitiş sınırlarının veya aynı raydaki diğer bir sürgülü kapağın ötesine geçemez.

### F. Hareketli Parçalar Arasında Gerçekçi Geometrik Çarpışma ve Durdurma Davranışı
- **Temel Senaryo (Açık Çekmece — Sürgülü Kapak Çarpışması):**
  - Kullanıcı bir çekmeceyi açtığında ve ardından sürgülü kapağı kulpundan tutup açık çekmecenin olduğu tarafa doğru kaydırdığında; sürgülü kapak (veya arka yüzeyi/kulpu) açık çekmecenin gerçek 3D hacmiyle temas edeceği sınır noktasına (`collisionStopOffsetMm`) geldiği anda **daha fazla ilerleyemez ve o sınırda durur** (görsel çarpışma vurgusuyla birlikte).
  - Çekmece tekrar kapatıldığında engel kalkar ve sürgülü kapak yoluna serbestçe devam edebilir.
- **Kapsamlı Mekanik Çarpışma Kuralları:**
  - Aynı şekilde L-köşede birbirine dik açılan kapaklar, kulplar ve çekmeceler arasında gerçek 3D kutu/süpürme hacmi (`3D Swept AABB / OBB`) kesişimleri dikkate alınır.
  - Yalnızca görsel yakınlık nedeniyle sahte engel oluşturulmaz; parçaların gerçek yükseklik aralığı (`yStartMm..yEndMm`), derinlik ofseti (ön ray vs. arka ray vs. çekmece çıkıntısı) ve hareket yolu hesaba katılır.
  - Hızlı fare hareketlerinde (fast pointer delta) kapağın açık çekmecenin içinden "tünelleme" (tunneling) yaparak karşı tarafa geçmesi, sürekli aralık kısıtlaması (`continuous interval clamping`) ile kesin olarak engellenir.
- **Teknik Yaklaşım:** Bunun için ağır bir WASM fizik motoru (`Rapier` vb.) kurulmaz; deterministik **Sürekli 1D/3D Kinematik Aralık Kısıtlayıcı (Continuous Kinematic Range Clamping & Swept Volume Solver)** kullanılır.

### G. 3D Sahnedeki Ölçü Etiketlerinden Doğrudan Ölçü Düzenleme (Direct In-Scene Dimension Editing)
- Kullanıcı 3D veya 2D sahnede gösterilen milimetrik ölçü etiketlerine (ör. `Köşe A: 900 mm`, `A Kolu: 2800 mm`, `Derinlik: 600 mm`, `Yükseklik: 2400 mm`, `Dış: 920 mm`) doğrudan tıkladığında etiket üzerinde küçük bir sayısal düzenleme kutusu açılır.
- Yeni milimetrik değer yazılıp `Enter` tuşuna basıldığında (veya onaylandığında) tasarım parametrik çözümleyici üzerinden anında güncellenir; `Escape` tuşu ile işlem iptal edilebilir.
- Geçersiz veya sınır dışı değerlerde kullanıcıya anlaşılır uyarı gösterilir; geçerli değişiklikler doğrudan Undo/Redo geçmişine ve yerel kayda bağlanır.
- `Net İç: 884 mm` gibi türetilmiş/hesaplanmış ölçüler bağımsız parametre olarak ezilmez; bu etiketlere tıklandığında ilgili kaynak ölçünün (`Dış Genişlik mm`) düzenleme kontrolü açılır.
- Ölçü etiketiyle etkileşim sırasında 3D kamera döndürme/kaydırma hareketlerinin yanlışlıkla tetiklenmesi engellenir.

### H. Manuel Kayıt (Checkpoint) Butonu ve Sayfa Yenilemesinde Korunan Kalıcı Undo/Redo Geçmişi
- **Otomatik Kurtarma (Auto-Recovery):** Her tasarım değişikliğinden sonra güncel çalışma durumu otomatik olarak yerel depolamaya (`IndexedDB` + senkron `localStorage` yedeği) kaydedilir; sayfa yenilendiğinde son çalışma durumu kaybolmaz.
- **Kalıcı Geri Alma Geçmişi (Persistent Undo/Redo):** Henüz elle kaydedilmemiş değişikliklerin geri alma (`historyPast`) ve yineleme (`historyFuture`) geçmişi de kalıcı olarak saklanır. Sayfa yenilendiğinde kullanıcı son yaptığı değişiklikleri son manuel kayıt noktasına (`Checkpoint`) kadar adım adım geri alabilir (ör. `800 mm -> 850 mm -> 900 mm` sonrası sayfa yenilendiğinde `900 mm` açılır; Geri Al ile sırasıyla `850 mm` ve `800 mm` değerlerine dönülür).
- **Manuel Kaydet (Checkpoint) Butonu:** Üst araç çubuğunda milimetrik ölçü göster/gizle butonunun hemen solunda yer alan **Kaydet** butonuna basıldığında mevcut tasarım yeni temel kayıt noktası (`Checkpoint`) kabul edilir, Geri Al / Yinele geçmişi bu noktada sıfırlanır ve sonraki işlemler bu yeni temel durumdan itibaren geri alınabilir.
- **Durum Göstergesi:** Arayüzde son manuel kayıt noktasından sonra değişiklik yapılıp yapılmadığını gösteren anlaşılır bir `"Kaydedildi"` / `"Kaydedilmemiş değişiklikler (Otomatik korundu)"` göstergesi sunulur.

### I. Görünüm Geçişleri, Kapak/Çekmece Tıklama Ayrımı ve Her Görünür İç Hacmin Bağımsız Seçilebilmesi (Aşama 2.2)
- **Tutarlı Görünüm Geçişleri (`Normal ↔ X-Ray ↔ Gizle`):** `Normal → X-Ray`, `X-Ray → Normal`, `Normal → Gizle`, `Gizle → X-Ray` ve diğer tüm geçişler hangi sırayla yapılırsa yapılsın kapakların saydamlığı, malzeme/shader durumu ve tıklama (raycast) katmanları hatasız güncellenir.
- **X-Ray Sonrası Tam Kapak Yüzeyi Tıklanabilirliği:** `Normal → X-Ray → Normal` geçişinden sonra da kapak kanadının yalnızca kulpu değil, tüm yüzeyi tıklanabilir kalır (`THREE.Mesh.prototype.raycast` korunur).
- **Kapak/Çekmece Tıklaması ile İç Hücre Seçiminin Kesin Ayrımı:**
  - Kapağa veya kapak kulpuna tıklamak **yalnızca** o kapağı açar/kapatır; arkadaki veya komşu bir iç hücreyi otomatik seçmez.
  - Çekmece ön paneline veya kulpuna tıklamak **yalnızca** o çekmeceyi açar/kapatır.
  - Kapalı opak bir kapağın arkasındaki iç hücreler kapak kapalıyken yanlışlıkla seçilemez; kapak açıldığında (veya `X-Ray` / `Gizle` modunda) iç hücreye tıklandığında ilgili hücre seçilir.
- **Her Görünür İç Bölmenin ve Raf Aralığının Bağımsız Seçimi:**
  - Yalnızca `SplitNode` yaprakları değil; `shelfStack` (raf grubu), `shoeRack` (ayakkabılık), `beddingYukluk` (raflı yüklük), `doubleHanging` (üst ve alt askılık alanları) ve beşgen köşe (`diagonal` corner) içindeki **her görünür raf aralığı / kullanım hacmi** kararlı bir seçim kimliğine (`::sub-k` / `::corner-sub-k`) sahiptir.
  - Bir raf aralığına veya askı alanına tıklandığında yalnızca o aralık vurgulanır; üstündeki veya altındaki diğer aralıklar otomatik seçilmez.
  - Kullanıcı seçtiği tek bir aralığı bölmek, ölçüsünü değiştirmek veya içine bağımsız bir modül yerleştirmek istediğinde, ilgili aralık ihtiyaç anında (`realizeSubIntervalInDesign`) gerçek alt hücreye dönüştürülerek yalnızca o aralık düzenlenir.

---

## 2. Aşama 2.3 İçin Kaydedilen Zorunlu Gelişmiş Seçim ve Boyutlandırma Gereksinimleri

> **Uygulama Notu:** Aşağıdaki **J – O (7.1 – 7.7)** maddeleri **Aşama 2.3** kapsamında eksiksiz uygulanmak üzere zorunlu ürün gereksinimi olarak kayıt altına alınmıştır.

### J. Fareyle Çoklu Hücre Seçimi (7.1 — Marquee / Rectangle Multi-Select)
- Kullanıcı 3D/2D sahnede ikinci tıklamayı basılı tutup sürükleyerek veya açık bir **Seçim Aracı** üzerinden dikdörtgen seçim alanı oluşturabilir.
- Seçim dikdörtgeninin:
  - İçi tamamen şeffaftır,
  - Kenarları koyu sahnede de net görünen modern, belirgin siyah kesikli/noktalı çizgilerden (kontrast dış/iç kontur destekli) oluşur,
  - Sürükleme sırasında kapsanan görünür hücreler canlı olarak vurgulanır.
- Fare bırakıldığında kapsanan görünür hücreler topluca seçilir (`selectedCellIds: string[]`).
- Seçim sürüklemesi sırasında kamera dönmesi (`OrbitControls`) devre dışı kalır ve işlem bitince normal davranışına döner.
- Birden fazla seçilmiş hücreye ortak işlemler uygulanabilir.

### K. Seçimin Yanında Açılan Bağlamsal Düzenleme Paneli (7.2 — Floating Contextual Panel)
- Tek bir hücre veya hücre grubu seçildiğinde, 3D sahnede seçimin hemen yanında küçük, modern bir bağlamsal düzenleme paneli açılır.
- Bu panel üzerinden seçime uygun olarak:
  - Dikey / yatay bölme,
  - Bölme / raf sayısını değiştirme,
  - Raf veya askılık oluşturma,
  - İç modül (`InsertRegistry`) seçme,
  - Ölçü değiştirme,
  - Eşit dağıtma ve uygun toplu düzenleme işlemleri yapılabilir.
- Panel kameranın hareketine göre seçili alanı takip eder, ekran sınırlarının dışına taşmaz (viewport clamping) ve 3D sahneyi gereksiz yere kapatmaz.
- Mevcut sağ denetçi panelindeki gelişmiş ayarlar korunur; her iki arayüz aynı veri ve komut sistemini kullanır.
- Birden fazla uyumsuz hücre seçildiğinde uygulanamayacak işlemler yanlış sonuç üretmek yerine açıklamalı biçimde devre dışı bırakılır.

### L. Seçili Hücre ve Hücre Grupları İçin X/Y/Z Fiziksel Ölçü Çizgileri (7.3)
- Bir hücre seçildiğinde:
  - **X:** Genişlik,
  - **Y:** Yükseklik,
  - **Z:** Derinlik
  ölçüleri ilgili 3D eksen çizgileri ve küçük düzenlenebilir etiketlerle gösterilir.
- L-gardırobun farklı yönlere bakan kollarında (`A Kolu` vs `B Kolu`) yerel genişlik ve derinlik eksenleri doğru hesaplanır.
- Birden fazla **bitişik** hücre seçildiğinde, seçili grubun toplam fiziksel ölçüleri (aradaki `18 mm` bölücü panel kalınlıkları dâhil edilerek) gösterilir.
- Birbirinden kopuk hücreler veya farklı eksenli alanlar seçilmişse anlamsız bir toplama yapılmaz; kullanıcıya uygun seçenekler sunulur.

### M. Orantılı Toplu Boyutlandırma ve Eşit Dağıtma (7.4)
- Kullanıcı örneğin 6 eşit raf aralığını topluca seçip toplam yüksekliklerini değiştirebilir.
- **Oranları Koru**, **Eşit Dağıt** veya **Bölme/Raf Sayısını Değiştir** (ör. 6 eşit aralığı 7 eşit aralığa dönüştürme) işlemleri sunulur.
- Panel kalınlıkları (`18 mm`) ve tamsayı milimetre yuvarlaması (`distributeIntegerMm`) sıfır kayıpla hesaplanır.

### N. Yönlü Yeniden Boyutlandırma (7.5 — Directional Resize)
- Bir hücrenin genişliğini, yüksekliğini veya derinliğini değiştirirken büyüme/küçülme yönü seçilebilir:
  - **Genişlik:** Sola veya Sağa,
  - **Yükseklik:** Yukarı veya Aşağı,
  - **Derinlik:** Ön tarafa veya Arka tarafa.
- Sayı girildiğinde hangi sınırın sabit kalacağı (anchor boundary) ve hangi yönde büyüme gerçekleşeceği açıkça gösterilir.

### O. Komşu Bölmeyle Çakışma Uyarıları ve Kayıt / Undo-Redo Uyumluluğu (7.6 & 7.7)
- Bir hücre büyütüldüğünde komşu hücre **otomatik olarak sessizce küçültülmez**.
  - Örneğin `200 mm` yüksekliğindeki hücre yukarı yönde `300 mm` yapılmak istendiğinde üstteki komşu hücrenin yüksekliği kendiliğinden değişmez.
- Yeni ölçü mevcut komşu ile çakışma (ör. `100 mm` üst üste binme) gerektiriyorsa:
  - İstenen yeni ölçü **taslak düzenleme isteği (draft resize intent)** olarak korunur,
  - Etkilenen komşu alan belirgin **kırmızı çakışma vurgusuyla** gösterilir,
  - Çakışmanın milimetrik miktarı (`100 mm çakışma`) açıkça belirtilir,
  - Kullanıcıya komşu bölmeyi veya diğer sınırları elle düzenleme / onaylama olanağı verilir,
  - Geçersiz taslak durum üretilebilir/geçerli çözülmüş geometriyle karıştırılmaz ve geçersiz geometriden üretim çıktısı oluşturulmaz.
- Ağır fizik motoru kullanılmaz; mevcut parametrik çözücü üzerine kurulan yalın bir ölçü doğrulama ve taslak önizleme sistemiyle gerçekleştirilir.
- Tekli seçim, çoklu seçim, toplu bölme, yönlü ölçü değiştirme ve çakışma düzeltmeleri mevcut Undo/Redo, manuel `Kaydet` (`Checkpoint`), otomatik kurtarma ve JSON dışa/içe aktarım sistemleriyle tam uyumlu çalışır; toplu işlemler tek bir geri alma (`Undo`) adımı olarak kaydedilir.

---

## 3. Aşama 2.4 İçin Zorunlu Gelişmiş Düzenleme, Kapak Editörü ve Parametrik Malzeme Kalınlıkları Gereksinimleri

### P. Çekmecelerin Bağımsız Seçim ve Düzenleme Desteği
- Her çekmece kararlı bir kimliğe (`drawer-${cellId}-${index}`) sahip, bağımsız seçilebilir bir tasarım nesnesidir (hazır şablonlarda ve sonradan oluşturulan çekmecelerde çalışır).
- **Etkileşim Ayrımı:**
  - **Normal Kullanım Modunda:** Çekmeceye tıklamak çekmeceyi akıcı biçimde açıp kapatır.
  - **Düzenleme / Çoklu Seçim Aracı Aktifken (veya Shift/Ctrl ile tıklandığında):** Çekmeceye tıklamak çekmeceyi (veya birden fazla çekmeceyi) seçer, yalnızca ilgili çekmeceyi/çekmeceleri vurgular ve yüzen düzenleme panelinde çekmeceye özel ölçü, konum, çekmece adedi, iç/dış çekmece durumu ve mekanik parametre kontrollerini açar.
- Seçili çekmecede X/Y/Z fiziksel ölçü çizgileri ve parametrik düzenleme kontrolleri çalışır; Undo/Redo, otomatik kurtarma, manuel kayıt ve JSON ile tam uyumludur.

### Q. Farklı Raf Gruplarının Birlikte Düzenlenmesi
- Birden fazla farklı raf grubuna (ör. üst raf grubu ve alt ayakkabılık/raf grubu) ait hücreler birlikte seçildiğinde:
  1. Her hücrenin hangi ana raf grubuna (`sourceLeafId` veya ebeveyn `SplitNode`) ait olduğu belirlenir.
  2. Uygun ortak işlemler (her grubun kendi toplam fiziksel yüksekliğini ve bölücü kalınlıklarını koruyarak **Ayrı Ayrı Eşit Dağıtma**, her gruptaki **Aralık Sayısını Topluca Değiştirme**, **Toplu Modül Atama**) seçili grupların tamamına tek bir Undo adımında uygulanır.
  3. Aynı bölmede (`Bay`) üst üste bitişik olan farklı raf grupları için açık bir **"Grupları Birleştir ve Yeniden Böl"** seçeneği sunulur.
- Farklı raf grupları otomatik olarak tek bir kesintisiz hacim kabul edilmez; sabit paneller ve gerçek mekanik sınırlar korunur.

### R. Bağımsız Kapak Düzenleyici Modu (`Kapak Düzenle`)
- 3D sahnenin üst kısmında, mevcut **Çoklu Seçim Aracı** butonunun hemen solunda **Kapak Düzenle** butonu yer alır.
- **Kapak Düzenleme Görünümü:**
  - Gardırop gövdesi görsel olarak hafif geri planda kalır; kapaklar ve kapak sınırları belirginleşir.
  - Bu modda kapağa tıklamak açılma animasyonu yerine **kapağı seçer** ve yanında **Bağlamsal Kapak Düzenleme Paneli** açar.
  - Gereksiz iç hücre düzenleme kontrolleri gizlenerek arayüz sadeleşir; moddan çıkıldığında normal kapak/çekmece aç-kapat etkileşimleri geri gelir.
- **Kapak Tasarımı ve Özelleştirme (`Front` Katmanı):**
  - Kullanıcı tek menteşeli kapak (sol/sağ), çift menteşeli kapak, kapaksız açıklık, kısmi yükseklikte kapak, **üst ve alt bölmelere ayrı kapaklar** (ör. üst yüklük için ayrı kapak, alt askılık için ayrı kapak) ve uygun birden fazla bölmeyi örten ortak kapak oluşturabilir.
  - Her kapakta genişlik/yükseklik, kapsadığı bölmeler, başlangıç ve bitiş yüksekliği (`yStartMm..yEndMm`), sol/sağ menteşe yönü, menteşe açısı (`110° / 155° / 165°`), gerekli açıklık payları ve kapak ekleme, kaldırma, yatay bölme (Üst/Alt Kapak) ve birleştirme işlemleri sunulur.

### S. Yüzen Bağlamsal Düzenleme Paneli İyileştirmeleri ve Panel Rol Ayrımı
- Bir raf, iç hücre, çekmece veya kapak seçildiğinde ilgili tüm düzenlenebilir özellikler yüzen bağlamsal panelden erişilebilir olur; günlük işlemler önde görünür, gelişmiş ayarlar daraltılabilir (collapsible) bölümler altında sunulur.
- **Panel Rolleri:** Sol panel proje/oda/genel gövde ve malzeme kalınlığı ayarlarına; Sağ panel genel bilgi, doğrulama ve gelişmiş incelemeye; Yüzen panel seçili nesnenin günlük düzenlemesine odaklanır (hiçbir mevcut özellik erişilemez hâle getirilmez).
- **Yerleşim ve Katman Önceliği:** Yüzen panel ekran dışına taşmaz, kendi içinde kaydırılabilir (`overflow-y-auto`), kamera hareketiyle güncellenir, 3D ölçü etiketlerinin üzerinde (`z-index`) yer alır ve 3D modelin seçili bölgesini kapatmaz.

### T. 3D Sahnenin Uçlarından Yeni Gardırop Bölmesi Ekleme (`+` Butonları)
- 3D sahnede gardırobun uygun sol ve sağ uçlarında (`A Kolu` ve `B Kolu` uçlarında) modern **`+`** butonları yer alır.
- `+` butonuna basıldığında açılan yüzen oluşturma panelinden bölme türü, genişlik (Sabit mm / Esnek Flex), derinlik/yükseklik bilgisi ve başlangıç iç düzeni (**Raflı**, **Askılı**, **Çekmeceli**, **Ayakkabılıklı**, **Servis Nişi**, **Boş Bölme**) seçilerek yeni bölme eklenir.
- Mevcut kol uzunluğu içinde esnek alan yetersizse mevcut ölçüler sessizce bozulmaz; kullanıcıya **"Kol Uzunluğunu Otomatik Uzat"** veya **"Esnek Bölmelerle Paylaştır"** seçenekleri açıkça sunulur.

### U. Beşgen Köşe ve Çekmece Ölçü Düzenleme Desteği
- Beşgen köşe (`diagonal` corner) raf aralıklarında:
  - Dikey raf aralıklarının yüksekliği bağımsız olarak düzenlenebilir; bir aralık büyütüldüğünde komşu köşe raf aralığıyla oluşan çakışma (`mm`) kırmızı vurgulanır ve kullanıcı onayıyla komşu köşe raf aralığı dengelenerek uygulanabilir.
  - Köşe kol genişlikleri (`Köşe A / Köşe B`) tüm köşe modülü için ortaktır; tek bir köşe rafının genişliği bağımsız değiştirilmek istendiğinde neden teknik olarak tüm köşe modülünü etkilediği açıklanır ve doğrudan **Köşe A / Köşe B Kol Ölçüsü** düzenleme kontrolü sunulur.
- Seçili çekmecelerde de X/Y/Z ölçü çizgileri ve çekmece yüksekliği / grup yüksekliği / derinlik düzenleme kontrolleri çalışır.

### V. 3D Kamera Konumunun Korunması (`3D ↔ 2D ↔ 3D`)
- `3D Perspektif → 2D Cephe / Üst Plan → 3D Perspektif` geçişlerinde kullanıcının son 3D kamera konumu (`position`), hedef noktası (`target`), yönü ve yakınlığı korunur; tekrar 3D'ye dönüldüğünde son 3D görünüm birebir geri yüklenir.
- 2D cephe ve üstten plan modları kendi ortografik kamera durumlarını bağımsız yönetir; yalnızca kullanıcı açıkça **"Görünümü Sıfırla / Dolaba Sığdır"** komutunu verdiğinde kamera varsayılan konuma sıfırlanır.

### W. Çoklu Geri Al ve İşlem Geçmişi (`Operation History`)
- Üst araç çubuğunda Undo/Redo butonlarının yanında sade bir **İşlem Geçmişi** açılır menüsü yer alır:
  - **5 İşlem Geri Al**, **10 İşlem Geri Al**, **20 İşlem Geri Al**,
  - **Son Manuel Kayıt Noktasına (Checkpoint) Dön**,
  - Geçmişteki adımların listesi (hangi işlemin geri alınacağını önceden gösterir ve seçilen adıma tek tıkla döner; ileri alma `Redo` geçmişi korunur).

### X. İki Parametreli Malzeme Kalınlığı Sistemi (`18 mm` Ana Panel & `8 mm` İnce Panel)
- Kullanıcı arayüzünde proje genelini etkileyen iki temel kalınlık kontrolü sunulur:
  1. **`Ana Panel Kalınlığı (mm)` (Varsayılan: `18 mm`):** Gövde yan panelleri, ara dikmeler, raflar, üst/alt gövde tablaları, iç bölücüler (`SplitNode`), menteşeli kapak panelleri, çekmece önleri ve çekmece yan/arka kasa panelleri.
  2. **`Arkalık ve Çekmece Tabanı Kalınlığı (mm)` (Varsayılan: `8 mm`):** Gardırop arkalıkları (`backPanel`) ve çekmece alt tabanları (`drawerBottom`).
- Kalınlık değiştiğinde dış gardırop genişliği/yüksekliği/kol uzunluğu sabit tutulur; tüm **net iç genişlikler** (ör. `800 mm` dış bölmede `18 mm` iken `764 mm`, `25 mm` iken `750 mm`), raf aralıkları, bölücü paneller, beşgen/kör köşe geometrileri, kapak kalınlıkları, çekmece dış/iç ölçüleri ve servis nişi sığma kontrolleri saf TypeScript çözücü tarafından yeniden hesaplanır.
- Fiziksel olarak uyumsuz kalınlık/donanım durumlarında (ör. aşırı kalın veya aşırı ince panel nedeniyle net iç hacmin daralması veya çekmece kızak/kanal uyarısı) kullanıcıya açık doğrulama uyarısı gösterilir.
- Her iki kalınlık değeri `Design` şemasında, Undo/Redo geçmişinde, otomatik/manuel kayıtta ve JSON dışa/içe aktarımında korunur; eski tasarımlar varsayılan `18 mm / 8 mm` değerleriyle kayıpsız yüklenir.

---

## 4. Aşama 3 İçin Kaydedilen Modern Gömme Gardırop, Dekoratif Bitiş, Baza ve Ayak Gereksinimleri

> **Uygulama Notu:** Aşağıdaki dış gövde bitiş ve mimari entegrasyon özellikleri **Aşama 3**'te (orijinal görsel gerçekçilik, PBR malzemeler, iç LED, 3D kıyafet/eşya ve kulp kataloğu görevleriyle birlikte) uygulanacaktır.

### Y. Modern Gömme Gardırop ve Dış Bitiş Özelleştirmeleri (Aşama 3)
1. **Genel Tasarım Hedefi:** Anne ve babanın ortak kullanacağı L-tipi gömme gardırop başta olmak üzere, tavana ve zemine mümkün olduğunca yakın, sağ ve sol dış kenarları düz, dışarı taşan dekoratif şeritleri bulunmayan, modern ve mimari açıdan bütünleşik gömme gardırop görünümü desteklenir.
2. **Üst Bölüm Seçenekleri:**
   - Tavana yakın düz bitiş, Dekoratif üst şeritsiz görünüm, Klasik üst taç, Üst dolgu paneli, Tavana yakın kapalı bitiş (montaj boşluğu ve tavan toleransları gözetilerek).
3. **Alt Bölüm Seçenekleri:**
   - Çok düşük baza, Gizli veya içeri çekilmiş baza, Klasik yüksek baza, Ayaklı gardırop, Zemine yakın minimal bitiş (kapakların zemine sürtünmesini önleyecek boşluk ve mekanik destek korunarak).
4. **Sağ ve Sol Yan Bitişler:**
   - Düz çıkıntısız yan bitiş, Dekoratif yan çıtasız tasarım, İnce yan dolgu paneli, Klasik dekoratif yan dikme, Duvar birleşim paneli.
5. **Yapısal ve Dekoratif Parçaların Ayrılması:**
   - Dekoratif şerit veya taç kaldırıldığında taşıyıcı üst tabla, yan panel ve alt destek yapısal olarak korunur.
6. **Hazır Dış Görünüm Ön Ayarı (`"Düz Gömme / Minimal Bitiş"`):**
   - Tek tıkla üst dekoratif tacı ve dışarı taşan yan çıtaları kaldırır, alt bazayı düşük/gizli yapar, dış hatları düzleştirir ve kapak hareket boşluklarını koruyarak tavana/zemine yakın modern bütünleşik görünüm sağlar.

---

## 5. Aşama 5 İçin Kaydedilen Profesyonel Gardırop Üretim ve Kesim Dokümantasyonu Gereksinimleri

> **Uygulama Notu:** Aşağıdaki kapsamlı üretim dokümantasyonu sistemi, orijinal **Aşama 5**'teki SVG/PDF teknik çizim ve CSV parça listesi hedeflerinin genişletilmiş, zorunlu profesyonel karşılığı olarak **Aşama 5**'te uygulanacaktır.

### Z. Profesyonel Üretim ve Kesim Dokümantasyonu (`"Teknik Dosya Hazırla" / "Teknik PDF İndir"`) (Aşama 5)
1. **Temel Hedef:** Bir gardırop ustasına veya marangoz atölyesine verildiğinde hangi parçaların, kaç adet, hangi malzemeden, hangi kalınlıkta (`18 mm / 25 mm / 8 mm / 4 mm`), hangi kesim ölçülerinde ve hangi birleşim/köşe açılarıyla üretileceğini eksiksiz açıklayan Türkçe teknik üretim belgesi oluşturmak.
2. **Belge Bölümleri (Metin + Tablo + Ölçülü Teknik Çizimler Birlikte):**
   - **A. Proje Özeti:** Proje adı, tarih/sürüm, gardırop tipi, toplam ölçüler, kol uzunlukları/derinlikleri, yükseklik, köşe tipi, malzemeler, ana panel kalınlığı ve arkalık/çekmece tabanı kalınlığı.
   - **B. Genel Montaj Görünüşleri:** Ölçülü ön görünüşler, üstten plan, yan görünüşler, genel 3D izometrik görünüş, L-köşe bağlantı detayı ve parça yerleşim şemaları.
   - **C. Ayrıntılı Kesim Listesi (Cutlist):** Benzersiz parça kodu, parça adı, ait olduğu kol/bölme/modül, adet, malzeme türü, kalınlık, kesim genişliği ve uzunluğu, damar yönü, kenar bantlama bilgisi ve özel işlem/montaj açıklaması.
   - **D. Beşgen ve Özel Köşe Parçaları Teknik Çizimleri:** Poligonun tüm köşe noktaları, kenar uzunlukları, iç/dış açıları, diyagonal kesimleri, gerçek yönelimi (ön/arka kenar ayrımı) ve komşu panellerle birleşim sınırları doğrudan çözücü geometrisinden türetilmiş ölçülü çizimlerle gösterilir.
   - **E. Kapakların Üretim Ölçüleri:** Kapak kodu, konumu, kesim genişliği/yüksekliği/kalınlığı (dolap açıklığı ölçüsüyle karıştırılmadan), menteşe yönü, açıklık/bindirme payları, kulp konumu ve mekanizma bilgisi.
   - **F. Çekmece Parçaları:** Her çekmecenin ön paneli, arka paneli, sol yan paneli, sağ yan paneli, alt tabanı, net iç hacmi ve kızak boşlukları ayrı ayrı listelenir.
   - **G. Arkalıklar:** Sayısı, genişliği, yüksekliği, kalınlığı ve konstrüksiyon yerleşim farkları.
   - **H. Kenar Bantlama ve Damar Yönü:** Görünür kenar bantlama gereksinimleri, ham kesim vs nihai ölçü farkları ve ahşap damar yönü işaretleri.
   - **I. Donanım, Tolerans ve Üretilebilirlik Denetimi:** Menteşeler, kızaklar, kulplar ve bağlantı elemanları listesi; doğrulanmamış donanım delik ölçülerini uydurmadan açık uyarı verme; çakışma, negatif ölçü veya eksik donanım varsa belgede **"Teknik Kontrol Gerekiyor"** durumu gösterme ve yerinde uzman ölçü kontrolü notu.
3. **Tek Kanonik Veri Kaynağı:** PDF, CSV ve ölçülü SVG çıktıları aynı kanonik `Design` belgesi ve parametrik çözücüden üretilir; malzeme kalınlığı değiştiğinde tüm üretim çıktıları güncel kalınlıklara göre otomatik yeniden hesaplanır.

---

## 6. Ek Özelliklerin Mevcut 5 Aşamalı Ana Planla Bütünleştirilmesi

Orijinal [wardrobe_studio_master_plan.md](file:///C:/dev/Wardrobe-Studio/wardrobe_studio_master_plan.md) içindeki hiçbir aşama görevi çıkarılmadan, yeni gereksinimler şu takvimle entegre edilir:

| Geliştirme Aşaması | Orijinal Ana Plan Görevleri (Eksiksiz Korunur) | Bu Belgeyle Eklenen Görevler |
| :--- | :--- | :--- |
| **Aşama 2, 2.1, 2.2 & 2.3** *(Tamamlandı)* | 3 adımlı stüdyo arayüzü, dikey/yatay hücre bölme (`SplitNode`), modül kataloğu (`InsertRegistry`), bağımsız `Front` katmanı, X-Ray görünümü, temel çakışma ve dar niş kuralları. | • **Gereksinim A, B, G, H, I (Aşama 2.1–2.2):** Menteşeli kapak ve 5 panelli çekmecelerde tıkla-aç/kapat, doğrudan ölçü düzenleme, manuel Checkpoint ve her görünür raf aralığının bağımsız seçimi.<br/>• **Gereksinim J–O (Aşama 2.3):** Çoklu hücre seçimi, yüzen bağlamsal panel, X/Y/Z ölçü çizgileri, orantılı boyutlandırma, yönlü boyutlandırma ve kırmızı komşu çakışma çözümü. |
| **Aşama 2.4** *(Şimdi)* | Aşama 2 çekirdek stüdyo düzenleme deneyiminin, bağımsız kapak editörünün ve üretime temel oluşturacak parametrik malzeme kalınlığı motorunun tamamlanması. | • **Gereksinim P–X:** Çekmecelerin bağımsız seçimi/düzenlenmesi, farklı raf gruplarının birlikte düzenlenmesi, **Bağımsız Kapak Düzenleyici Modu (`Kapak Düzenle`)**, iyileştirilmiş yüzen panel, 3D sahne uçlarından `+` ile bölme ekleme, beşgen köşe & çekmece ölçü düzenleme, 3D kamera konumunun korunması, İşlem Geçmişi (çoklu geri al) ve **İki Parametreli Malzeme Kalınlığı Sistemi (`18 mm` Ana Panel / `8 mm` İnce Panel)**. |
| **Aşama 3** | Gerçekçi PBR malzemeler, Sunum Modu (`N8AO`, `ContactShadows`), Dolap İçi LED Şerit Aydınlatma, `InstancedMesh` ile ölçekli 3D iç eşya simülasyonu (kıyafetler, kutular, ayakkabılar, katlanır merdiven, ütü masası, valiz). | • **Gereksinim C:** Bağımsız **Kapak ve Çekmece Kulp Kataloğu** (modeller, renkler/malzemeler, boyutlar, konumlar).<br/>• **Gereksinim Y:** **Modern Gömme Gardırop Dış Bitiş Özelleştirmeleri** (üst taç/düz bitiş, alt baza/ayak seçenekleri, yan bitişler, taşıyıcı/dekoratif ayrımı ve `"Düz Gömme / Minimal Bitiş"` hazır görünümü). |
| **Aşama 4** | Anne & Baba ergonomi profilleri, göz hizası kameraları, sahiplik (`Anne/Baba/Ortak`), envanter kapasite sayacı, oda engelleri ve 2D süpürme alanı, özel şablonlar (Yüklük, Kademeli L-Askı), kopyala/yansıt ve Hızlı Düzeltme (`Quick-Fix`). | • Sürgülü ve karma kapak hareket yollarının oda engelleri, iç çekmeceler ve süpürme/çarpışma kurallarıyla bütünleşecek altyapısının hazırlanması. |
| **Aşama 5** *(veya gerekirse Ek Teslimat 5B)* | Adlandırılmış sürümler ve A/B karşılaştırma tablosu, Dış AI (Claude/Gemini) JSON köprüsü, yazdırılabilir 2D ölçülü teknik çizim (SVG/PDF), CSV parça listesi ve uzman kontrol raporu. | • **Gereksinim D, E & F:** Tam sürgülü ve karma kapak tasarım sistemi, sürgülü kapağı kulpundan fareyle sürükleme ve gerçek 3D hacimsel çarpışmada durma.<br/>• **Gereksinim Z:** **Profesyonel Gardırop Üretim ve Kesim Dokümantasyonu (`"Teknik Dosya Hazırla" / "Teknik PDF İndir"`)** — ölçülü montaj görünüşleri, beşgen köşe poligon/açı çizimleri, kapak/çekmece/arkalık kesim listeleri, kenar bantlama/damar yönü ve `"Teknik Kontrol Gerekiyor"` doğrulama sistemi. |
