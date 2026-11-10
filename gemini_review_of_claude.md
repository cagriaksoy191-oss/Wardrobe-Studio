# Wardrobe Studio — Bağımsız Çapraz Değerlendirme Raporu (Gemini 4 Argon)

> **İncelenen Belgeler:**
> - **Claude Planı:** [bagimsiz_arastirma_ve_plan_claude.md](file:///c:/Users/cagri/OneDrive/Resimler/Masaüstü/Wardrobe-Studio/bagimsiz_arastirma_ve_plan_claude.md) *(Claude Opus 5.5)*
> - **Gemini Planı:** [implementation_plan_gemini.md](file:///c:/Users/cagri/OneDrive/Resimler/Masaüstü/Wardrobe-Studio/implementation_plan_gemini.md) *(Gemini 4 Argon)*
> - **Tarih:** 27.10.2026

---

## 1. Yönetici Özeti

Birbirinden tamamen bağımsız olarak hazırlanan iki araştırma ve mimari plan karşılaştırıldığında, projenin en kritik temel kararlarında **olağanüstü bir teknik yakınsama (convergence)** olduğu görülmektedir. Her iki model de birbirinden habersiz olarak; **React + TypeScript + Vite + React Three Fiber (R3F) + Zustand/Immer + Zod + IndexedDB** teknoloji yığınını seçmiş, 3D görüntüleyiciyi saf bir TypeScript hesaplama çekirdeğinden (`Solver / Core`) ayırmış, ağır WASM CAD çekirdeklerini (`OpenCascade` / `Manifold-3D`) ve fizik motorlarını (`Rapier`) ilk sürüm için reddetmiş, iç düzen için **Özyinelemeli Bölme Ağacı (`SplitNode`)** ve genel genişletilebilirlik için **Kol + Köşe Birleşimi (`Run/Wall + Junction`)** grafiğini önermiştir. Bu ortaklık, seçilen temel mimarinin doğruluğunu güçlü biçimde kanıtlamaktadır.

Bununla birlikte iki plan birbirini tamamlayan çok değerli farklılıklara sahiptir:
- **Claude planının öne çıktığı alanlar:** Kapakların (`Front`) gövde bölmelerinden (`Bay`) bağımsız bir katman olarak modellenmesi, CSS Flexbox benzeri `fixed(mm) | flex(weight)` ölçü dağıtım ve kilitleme mekanizması, modül eklenti kaydı (`InsertRegistry`), **Envanter Odaklı Tasarım**, **Anne/Baba İki Kişilik Ergonomi Profili + Sahiplik Renklendirmesi** ve **Oda Engelleriyle (yatak, kapı, radyatör) Süpürme Alanı Çakışma Kontrolü**. Bu fikirler benim ilk planımdaki karşılıklarından daha olgundur ve nihai plana doğrudan dahil edilmelidir.
- **Gemini planının öne çıktığı alanlar:** L-köşe modüllerinde **Katlanır (Bi-Fold / Akordeon) Kapak kinematiği**, dinamik kapak/çekmece animasyonlarıyla uyumlu **`N8AO` + `ContactShadows` + Dolap İçi LED Aydınlatma** görselleştirme hattı, dar dikey bölmelerde `180–250 mm` (merdiven/ütü masası) esnekliği, karmaşık 3D sürükle-bırak yerine hatasız **Hücre Seçimi + Bağlamsal Denetçi** etkileşimi ve ilk aşamadan itibaren **Dikey Kesit (Solver + Temel 3D Doğrulama)** geliştirme stratejisi.

Bu raporda; iki planın ortak noktaları, mimari farkları, kabul edilmesi gereken üstün fikirler, teknik riskler ve nihai plan öncesi çözülmesi gereken 7 kritik karar ayrıntılı olarak değerlendirilmiştir.

---

## 2. İki Planın Ortak Güçlü Yönleri

İki bağımsız araştırmanın aynı sonuca vardığı ve artık tartışmaya kapalı "onaylanmış mimari kararlar" olarak kabul edebileceğimiz noktalar şunlardır:

| Mimari / Ürün Alanı | Claude Planı Karşılığı | Gemini Planı Karşılığı | Ortak Teknik Gerekçe |
| :--- | :--- | :--- | :--- |
| **Gerçeğin Tek Kaynağı (Single Source of Truth)** | `Tasarım Belgesi (JSON) + Saf TS Çözümleyici` (Bölüm 0.1, 3.1) | `WardrobeProjectSchema + Saf TS CarcassSolver` (Bölüm 6.1) | 3D bileşenler matematiksel hesap yapmaz; yalnızca çözülmüş modeli çizer. Testler tarayıcısız çalışır, 2D çizim, parça listesi ve AI aynı çıktıyı kullanır. |
| **Teknoloji Yığını** | TS + Vite + React + R3F + `drei` + Zustand + Immer + Zod (Bölüm 2.1, 2.3) | TS + Vite + React 19 + R3F + `drei` + Zustand + Immer + Zod (Bölüm 3.1, 3.4) | Yapılandırıcının %80'i durum ve UI yönetimidir; R3F deklaratif sahne ağacı ile parametrik veri ağacını birebir eşler. |
| **Geometri Üretim Yöntemi** | Kutu paneller + özel köşeler için `THREE.Shape` $\rightarrow$ `ExtrudeGeometry` (Bölüm 2.3, 4.1) | `ParametricBoxPanel` + `ParametricPolygonPanel` (`ExtrudeGeometry`) (Bölüm 3.1, 4.1) | WASM CAD çekirdekleri (15–25 MB) gerçek zamanlı kaydırıcı (slider) etkileşiminde yavaştır; mobilya panelleri kutu ve 2D poligon ekstrüzyonuyla `<1 ms` içinde üretilir. |
| **İç Hacim Özelleştirme** | Özyinelemeli `SplitNode` (`horizontal | vertical | leaf`) (Bölüm 3.3) | Özyinelemeli `InteriorNode` (`Split-Tree`) (Bölüm 5.1) | Tek bir modül içinde hem dar dikey ütü masası/merdiven nişi hem de yatay çekmece+askı katmanları oluşturmanın tek temiz yolu özyinelemeli ağaçtır. |
| **Genel Platforma Genişleme** | `Run[] + Junction[]` grafiği (Bölüm 0.6, 3.3) | `WallSegment[] + CornerJunctionModule` grafiği (Bölüm 6.2) | Düz = 1 kol, L = 2 kol + 1 birleşim, U = 3 kol + 2 birleşim. İlk sürümde U arayüzü yazılmasa da veri modeli yeniden yazılmadan tüm formları destekler. |
| **Doku ve Suyolu Doğruluğu** | Dünya-ölçeğinde UV hesabı + `grainAxis` (Bölüm 4.1) | `applyWorldSpaceBoxUVs` + `grainDirection` (Bölüm 3.3, 7) | Modül boyutu değiştiğinde ahşap dokusunun sünmesini (stretching) önler ve dikmelerde dikey, raflarda yatay suyolu yönünü korur. |
| **Fizik Motoru Kullanmama** | Kinematik yay animasyonu + 2D analitik süpürme alanı (Bölüm 2.3, 4.2) | `@react-spring/three` kinematik pivot + 2D süpürme kesişimi (Bölüm 3.2, 4.3) | Kapak ve çekmece hareketleri belirli ray ve menteşe eksenlerinde deterministiktir; `Rapier` gibi bir fizik motoru gereksiz yük getirir. |
| **Yerel Kalıcılık & AI Köprüsü** | Sunucusuz `IndexedDB` + JSON + v1'de Pano/Komut AI Köprüsü (Bölüm 2.3, 7.3) | Sunucusuz `IndexedDB` + `.lform.json` + AI JSON Komut Protokolü (Bölüm 3.4, 6.3) | İlk sürümde sunucu, kimlik doğrulama ve LLM API maliyeti yaratmadan tam veri güvenliği ve dış AI modelleriyle (Claude/Gemini) entegrasyon sağlar. |

---

## 3. Önemli Mimari Farklılıklar

İki plan aynı terimleri kullansa bile mimari düzeyde **6 gerçek tasarım farkı** bulunmaktadır:

### 3.1 Kapak (`Front`) ve Modül (`Bay`) İlişkisi
- **Gemini Planı (Bölüm 4.2):** Kapakları modülün veya iç bölmenin bir parçası olarak ele aldı.
- **Claude Planı (Bölüm 3.3, Madde 1):** Kapakları (`Front`) bölmelerden bağımsız, üst düzey bir katman (`spanBays`, `yRange`, `hingeSide`) olarak tanımladı.
- **Teknik Değerlendirme:** **Claude'un yaklaşımı kesin olarak daha üstündür.** Gerçek gömme dolaplarda dış cephedeki kapak ritmi ile iç bölme yapısı her zaman birebir örtüşmez:
  1. Bir modülün alt yarısında dıştan açılan 3 çekmece varken, yalnızca üst yarısını (`yRange: [800, 2200]`) örten bir menteşeli kapak olabilir.
  2. Yan yana duran `220 mm` dar merdiven nişi ile `380 mm` raf bölmesi, dışarıdan tek bir `600 mm` kapakla (`spanBays: [bay1, bay2]`) örtülerek cephede simetri sağlanabilir.
  3. Sürgülü kapaklar doğası gereği birden fazla gövde bölmesinin (`Run` boyunca 2 veya 3 `Bay`) önünde hareket eder.

### 3.2 Modül ve Bölme Ölçülendirme Matematiği (`Sabit mm` vs. `Fixed | Flex`)
- **Gemini Planı (Bölüm 1.2, 5.1):** Ölçüleri milimetrik değerler ve otomatik kalan boşluk doldurma olarak tanımladı.
- **Claude Planı (Bölüm 1.5, 3.3 Madde 3):** CSS Flexbox mantığında `type Size = { kind: 'fixed'; mm: number } | { kind: 'flex'; weight: number; minMm?: number; maxMm?: number }` ve `locked` (kilit/pin) kavramını veri modelinin çekirdeğine yerleştirdi.
- **Teknik Değerlendirme:** **Claude'un modeli çok daha güçlüdür.** Gömme gardıropta toplam duvar boyu sabittir. Kullanıcı *"Ütü masası bölmesi 250 mm sabit (`fixed`) kalsın, köşe 900 mm sabit kalsın, kalan duvar boyunu diğer 3 modüle eşit (`flex: 1`) dağıt"* dediğinde sistem hiçbir manuel hesap gerektirmeden duvarı milimetrik olarak doldurur.

### 3.3 Köşe Birleşimi (`Junction`) Sahipliği ve L-Köşe Tipleri
- **Claude Planı (Bölüm 3.3, 5.1):** Köşeyi iki kolu birbirine bağlayan `Junction` (`blind | lRail | diagonal | openShelves`) nesnesi olarak modelledi ve **Kademeli L-Askı** (bir kolda kısa askı, diğer kolda raf/çekmece ile askı borularının çakışmasını önleme) fikrini sundu. Ancak L-köşe dolabının dış kapağının nasıl açılacağını (katlanır kapak kinematiğini) detaylandırmadı.
- **Gemini Planı (Bölüm 4.2, 5.2):** L-Poligon köşe modülünde orta dikme olmadan tam erişim sağlayan **Katlanır Köşe Kapağı (`BiFoldDoor` — birbirine bağlı iki kanatlı $\theta_1, \theta_2$ akordeon kinematiği)** ve **Kademeli Derinlikli Köşe** (ör. bir kol 60 cm askı, diğer kol 40 cm raf geçişi) modellerini tanımladı.
- **Teknik Değerlendirme:** İki yaklaşım birleştirilmelidir: Veri modelinde Claude'un `Junction` sahiplik yapısı kullanılmalı; köşe tiplerine Gemini'nin **Katlanır Kapaklı (Bi-Fold) L-Köşe kinematiği** ve **Farklı Derinlikli Kol Geçişi (`runA.depth !== runB.depth`)** desteği eklenmelidir.

### 3.4 Eklenti Kaydı (`InsertRegistry`) Mimarisi
- **Claude Planı (Bölüm 3.3, Madde 4):** Her iç modül türünün (raf, askı, çekmece, ayakkabılık, servis nişi) Zod şemasını, varsayılanlarını, geometri üreticisini, kapasite formülünü, doğrulama kurallarını ve parça listesi katkısını tek bir `InsertRegistry` kaydında toplamayı önerdi.
- **Teknik Değerlendirme:** **Claude'un bu deseni mutlaka benimsenmelidir.** Kod tabanında devasa `switch (node.type)` bloklarını önler ve yeni bir depolama aparatı eklemeyi tek bir modül dosyası tanımlamaya indirger.

### 3.5 Geri Al / Yinele (Undo / Redo) Mekanizması
- **Gemini Planı (Bölüm 3.4):** `Zundo` (Zustand temporal middleware) önerdi.
- **Claude Planı (Bölüm 2.3, 3.4):** Tiplenmiş **Komut Geçmişi (`Command`) + Belge Anlık Görüntüleri (`Immer` yapısal paylaşımıyla)** önerdi.
- **Teknik Değerlendirme:** **Claude'un yaklaşımı daha uygundur.** Tasarım belgesi çok küçüktür (`<50–200 KB`). Değişiklikleri `splitCell`, `setInsert`, `resizeBay` gibi semantik komutlar üzerinden yapmak; hem geri alma listesinde *"Bölme 2'ye çekmece eklendi"* gibi okunabilir açıklamalar göstermeyi sağlar, hem kaydırıcı (slider) sürüklenirken ara değerleri tek bir komutta birleştirmeyi kolaylaştırır, hem de gelecekteki AI asistanının doğrudan aynı komut API'sini kullanmasına olanak tanır.

### 3.6 Birim Temsili (`Tamsayı mm` vs. Kayan Nokta)
- **Claude Planı (Bölüm 3.2):** Belgede tüm ölçülerin **tamsayı milimetre (`integer mm`)** tutulmasını, yalnızca 3D render sınırında `× 0.001` ile metreye çevrilmesini ve çakışık düzlemlere `0.1 mm` görsel ofset verilmesini şart koştu.
- **Teknik Değerlendirme:** Çok yerinde bir mühendislik kuralıdır. JavaScript kayan nokta aritmetiğinde `800 - 2 * 18` hesabı yerine esnek bölme (`flex`) dağıtımlarında oluşabilecek küsuratlar `Math.round` ve kalan milimetrenin son esnek hücreye eklenmesi (`remainder distribution`) ile her zaman tam sayı milimetreye yuvarlanmalıdır.

---

## 4. Claude Planından Kabul Edilmesi Önerilen Fikirler

Claude'un bağımsız araştırmasında sunduğu şu **8 fikir**, projenin amacına (anne ve babanın gerçek gardırobunu en verimli şekilde tasarlamak) doğrudan hizmet etmekte olup nihai plana dahil edilmelidir:

1. **İki Kişilik Ergonomi Profili ve Sahiplik Renklendirmesi (Claude Bölüm 6, Madde 2 & 3):**
   - *Fayda:* Anne ve babanın boy ölçüleri (ör. `162 cm` ve `178 cm`) girildiğinde, 2D/3D ön görünüşte her kullanıcı için **"Altın Erişim Bölgesi (Dirsek–Omuz)"**, **"Eğilme Bölgesi"** ve **"Merdiven Gerektiren Üst Bölge"** sınırlarının gösterilmesi; ayrıca her bölmenin `Anne | Baba | Ortak` olarak etiketlenip renklendirilebilmesi.
   - *Maliyet:* Çok düşük (1–2/5), kullanıcı faydası çok yüksek (5/5).
2. **Envanter Odaklı Kapasite Sayacı (Claude Bölüm 0.8, 6 Madde 1):**
   - *Fayda:* Kullanıcının sığdırmak istediği hedef eşya miktarlarını (ör. *"30 gömlek, 10 uzun elbise/palto, 18 çift ayakkabı, 4 valiz, 2 yorgan, 1 ütü masası, 1 katlanır merdiven"*) girmesi ve mevcut tasarımın bu envanteri yüzde kaç oranında karşıladığını (`Askı: 38/40 ✓`, `Ayakkabı: 12/18 ⚠`) canlı görmesi.
   - *Maliyet:* Her `InsertRegistry` öğesine basit bir kapasite formülü eklendiğinde ilk sürümde basit bir sayaç olarak geliştirilmesi çok kolaydır.
3. **Oda Bağlamı (Engeller) ve Zeminde 2D Süpürme Alanı (Claude Bölüm 6 Madde 4, 8.1):**
   - *Fayda:* Yalnızca gardırobun kendi kapak/çekmecelerinin birbirine çarpmasını değil; açılan kapağın veya çekmecenin odadaki **yatak, oda kapısı, pencere veya radyatörle** çakışmasını ve duvar prizini/anahtarını kapatmasını denetlemek, gömme dolap tasarımında hayati bir gerçek dünya kontrolüdür.
4. **Türk Evi "Yüklük" (Yorgan/Nevresim) ve Kör Köşe Valiz/Kademeli L-Askı Şablonları (Claude Bölüm 5.1, 5.2):**
   - *Fayda:* Standart Avrupa gardırop araçlarında bulunmayan derin/geniş yorgan-nevresim yüklük bölmesi ve üst mezanin (baza/yüklük) kurgusu, Türkiye'deki ebeveyn yatak odası ihtiyaçlarına birebir uygundur.
5. **Doğrulama Taksonomisi (`Hata | Uyarı | Bilgi | Uzman Doğrulaması Gerekir`) ve "Neden?" Açıklamaları (Claude Bölüm 6 Madde 8, 8.1, 8.2):**
   - *Fayda:* Özellikle **"Dış duvara bitişik gömme dolapta nem ve küf riski (havalandırma boşluğu)"** ve **"600 mm üzeri tek menteşeli kapak ağırlık/sarkma uyarısı"** gibi kuralların açıklayıcı nedenlerle ve tek tıkla düzeltme önerileriyle sunulması.
6. **Bağımsız `Front` (Kapak) Katmanı (Claude Bölüm 3.3):**
   - Bölüm 3.1'de açıklandığı üzere, kapakların gövde bölmelerinden bağımsız tanımlanması.
7. **`Fixed | Flex` Ölçü Dağıtımı ve Ölçü Kilitleme (`Pin/Lock`) (Claude Bölüm 1.5, 3.3):**
   - Bölüm 3.2'de açıklandığı üzere, sabit nişlerin ölçüsünü koruyup kalan duvar uzunluğunu esnek bölmelere otomatik dağıtma.
8. **Bölme Kopyalama ve Yansıtma (`Copy / Mirror Bay`) (Claude Bölüm 1.5):**
   - Anne ve baba bölümlerini tasarlarken bir bölmenin iç ağacını diğer kola kopyalamak veya simetrik yansıtmak tasarım süresini büyük ölçüde kısaltır.

---

## 5. Claude Planındaki Önemli Riskler, Çelişkiler veya Eksikler

Tarafsız bir teknik incelemede, Claude'un planında düzeltilmezse geliştirme sürecini yavaşlatacak veya 3D kalitesini düşürecek **6 önemli risk ve teknik çelişki** tespit edilmiştir:

### 5.1 Aşama 1'in Tamamen 3D'siz Yapılması Riski (`A1 bitmeden A2'ye geçilmez` — Claude Bölüm 0.10, 11)
- **Sorun:** Claude, Aşama 1'de (A1) hiç 3D sahne kurmadan düz, L-kör, L-diyagonal ve U fikstürlerinin tüm panel ve köşe hesaplarını sadece birim testlerle (snapshot) bitirmeyi önermektedir.
- **Teknik Risk:** 3D uzay geometrisinde (özellikle L-köşede B kolunun 90° döndürülmesi, yerel eksenlerden dünya eksenlerine dönüşüm, `ExtrudeGeometry` poligon yönelimleri ve kapak menteşe pivot eksenleri) birim testini yazan geliştirici/model kendi koordinat varsayımını teste de yazdığı için **testler yeşil geçer, ancak 3D sahneye çıkıldığında panellerin 18 mm kayık olduğu veya ters yöne ekstrüde edildiği görülür.**
- **Çözüm:** Birim test disiplini (`Vitest`) kesinlikle korunmalı, ancak **Faz 1'de çözümleyici (Solver) ile birlikte en temel 3D kutu/tel-kafes (wireframe) görüntüleyici eşzamanlı ayağa kaldırılmalıdır** (Gemini Faz 1 yaklaşımı). Görsel doğrulama ile matematiksel birim testi ilk günden birlikte yürümelidir.

### 5.2 Görselleştirme ve Animasyon Çelişkisi: `AccumulativeShadows` ve `frameloop="demand"` (Claude Bölüm 4.3, 10)
- **Sorun 1 (`AccumulativeShadows`):** Claude, Sunum modunda `@react-three/drei` içindeki `AccumulativeShadows` bileşenini önermektedir (Bölüm 4.3). `AccumulativeShadows`, sahne tamamen statikken 60–100 kare boyunca gölge biriktirir. Kullanıcı bir kapağa veya çekmeceye tıklayıp açma animasyonunu başlattığında, `AccumulativeShadows` ya kapalı kapağın "hayalet gölgesini" yerde bırakır ya da her karede yeniden hesaplanmaya çalışırsa FPS'i çökertir.
  - **Doğru Çözüm (Gemini Bölüm 3.3):** Dinamik kapak/çekmece animasyonlarıyla tam uyumlu olan **`N8AO` (ekran-uzayı ortam kapatma) + `ContactShadows` + tek yönlü gölge haritası** kullanılmalıdır.
- **Sorun 2 (`frameloop="demand"` ile Yay Animasyonu):** Claude FPS düşüşünü önlemek için `frameloop="demand"` önermektedir (Bölüm 10). Ancak `@react-spring/three` veya `maath/easing` kullanılırken `frameloop="demand"` aktifse, animasyon süresince her karede `invalidate()` tetiklenmezse kapak animasyonları donar. Bu entegrasyon kuralı açıkça tanımlanmalıdır.
- **Sorun 3 (Dolap İçi LED Aydınlatmanın v2'ye Ertelenmesi):** Claude, iç LED aydınlatmayı v2+'ya bırakmıştır (Bölüm 4.3). Oysa kullanıcı gereksinimlerinde (Bölüm 3) aydınlatma temel özellikler arasındadır ve koyu ahşap/antrasit gömme dolapların iç bölmeleri iç aydınlatma olmadan 3D'de karanlık kalır. Gemini planındaki **Dolap İçi LED Şerit Aydınlatma** (düşük maliyetli `emissive` şerit + hafif iç ışık kaynağı) v1'de yer almalıdır.

### 5.3 Dar Dikey Servis Nişi Ölçü Kısıtı Hatası (Claude Bölüm 5.2)
- **Sorun:** Claude, Bölüm 5.2'deki modül tablosunda **"Dar dikey servis nişi (ütü masası, süpürge, katlanır merdiven)"** için genişlik aralığını **`30–45 cm` (`300–450 mm`)** olarak belirtmiştir.
- **Teknik Hata:** Katlanmış bir ütü masası `90–120 mm`, katlanır alüminyum ev merdiveni ise `120–160 mm` kalınlığındadır. Kullanıcımız bu projede özellikle **ince ve uzun özel depolama bölmeleri** denemek istemektedir (Gemini planında `200–250 mm` örneği verilmiştir). Eğer doğrulama kuralları `300 mm` altını engellerse değerli bir alan israf edilir.
- **Çözüm:** Dikey servis nişinin minimum net genişlik sınırı **`160 mm`** olmalı; `200 mm` altında yalnızca *"El erişimi dar olabilir, eşya kalınlığını kontrol edin"* şeklinde `Bilgi` uyarısı verilmelidir.

### 5.4 L-Köşe Kapak Mekanizması Eksikliği (Claude Bölüm 3.3, 5.1)
- **Sorun:** Claude köşe tiplerini `blind | lRail | diagonal | openShelves` olarak tanımlamış, ancak `lRail` (90° içbükey L-köşe dolabı) seçildiğinde bu köşenin kapaklarının nasıl açılacağını belirtmemiştir.
- **Çözüm:** İçbükey 90° L-köşe modüllerinde orta dikme olmadığı için iki kanadın birbirine menteşelendiği **Katlanır Köşe Kapağı (`BiFoldDoor` / Akordeon Kapak)** veya **165°/170° Geniş Açılı Çift Kapak** kinematiği (Gemini Bölüm 4.2) zorunludur.

### 5.5 3D/2D Sürükle-Bırak (Drag & Drop) ve 6 Ayrı Modun Yaratacağı Arayüz Karmaşıklığı (Claude Bölüm 1.4, 1.5)
- **Sorun:** Claude; üst çubukta 6 ayrı çalışma modu (`Oda, Gövde, İç Düzen, Kapaklar, Malzeme, Sunum`), sahnede rafları/dikmeleri fareyle sürükleme, sürükle-bırak modül paleti ve ölçü çizgisi üzerinde `1200/3` gibi aritmetik ifadeler çalışan satır içi metin kutuları önermiştir.
- **Risk:** Özellikle "İç Düzen" ve "Kapaklar" modlarını birbirinden ayırmak ve "İç Düzen" modunda kapakları otomatik gizlemek, kullanıcının **"Bu iç çekmece veya raf menteşeyle/kapakla çakışıyor mu?"** sorusunu düzenleme anında görmesini engeller. Ayrıca 3D/2D sahnede özyinelemeli ağaç sınırlarını fareyle sürüklemek (pointer-drag gizmo) ilk sürümde en çok UI hatası üreten kısımdır.
- **Çözüm:**
  1. Mod sayısı 6 yerine **3 ana çalışma adımına** (`1. Oda & Gövde` $\rightarrow$ `2. İç Düzen & Kapaklar` $\rightarrow$ `3. Malzeme, Sunum & Çıktı`) indirilmeli; kapakların görünürlüğü/açıklığı her modda üst çubuktaki hızlı anahtarlarla (`Kapakları Aç / Yarı Saydam (X-Ray) / Gizle`) kontrol edilebilmelidir.
  2. Düzenleme etkileşiminde birincil yöntem **Hücreye Tıkla $\rightarrow$ Sağ Denetçiden (Inspector) veya Hızlı Eylem Çubuğundan Böl / Modül Ata / Sayısal veya Kaydırıcı ile Ölçü Değiştir** olmalıdır. Sahnede fareyle bölücü sürükleme v1'de zorunlu tutulmamalı, isteğe bağlı yardımcı etkileşim olarak eklenmelidir.

### 5.6 OneDrive ve Türkçe Klasör Yolu (`Masaüstü`) Uyarısının Değerlendirilmesi (Claude Bölüm 10)
- **Değerlendirme:** Claude, çalışma klasörünün `OneDrive\Resimler\Masaüstü\Wardrobe-Studio` altında olmasının `node_modules` senkronizasyon yavaşlığına ve bazı araçlarda ASCII dışı karakter (`ü`, `ı`) sorunlarına yol açabileceğini çok doğru tespit etmiştir. Ancak mevcut çalışma alanımız doğrudan bu dizindir. Eğer kullanıcı klasörü taşımak istemezse, Vite ve paket yöneticisi yapılandırmasıyla (veya OneDrive'da `node_modules` klasörünü hariç tutarak) mevcut dizinde de sorunsuz çalışılabilir; bu karar kullanıcıya bırakılmalıdır.

---

## 6. Kendi Başlangıç Planımda (`implementation_plan_gemini.md`) Değiştirilmesi Gereken Kararlar

Claude'un planıyla yaptığım karşılaştırma sonucunda, kendi ilk planımdaki şu **6 kararı Claude'un yaklaşımı lehine güncellemeyi** öneriyorum:

1. **CSG (`@react-three/csg` / `three-bvh-csg`) Kütüphanesinin v1'den Çıkarılması:**
   - İlk planımda (Bölüm 3.1) gömme kulp oyuğu veya kiriş çentiği gibi nadir durumlar için `three-bvh-csg` önermiştim. Claude (Bölüm 0.4, 2.3) ilk sürümde CSG'ye hiç gerek olmadığını, tüm beşgen/özel panellerin 2D poligon ekstrüzyonuyla (`ExtrudeGeometry`) çözülebildiğini belirtti. **Claude haklıdır; `three-bvh-csg` bağımlılığı v1'den tamamen çıkarılmalıdır.**
2. **Kapakların Gövde/Hücre İçinden Çıkarılıp Bağımsız `Front` Katmanına Taşınması:**
   - İlk planımda kapaklar modül bileşeninin doğrudan alt parçasıydı. Claude'un bağımsız `Front` katmanı (`spanBays`, `yRange`) benimsenerek kısmi kapaklar, çift bölmeyi örten tek kapaklar ve çoklu bölme örten sürgülü kapaklar desteklenmelidir.
3. **Sabit Milimetre Yerine `Fixed | Flex` + `Locked` Ölçü Çözücüsüne Geçilmesi:**
   - İlk planımdaki manuel modül genişliği yaklaşımı, Claude'un `Size = fixed(mm) | flex(weight)` ve kilit (`pin`) mekanizmasıyla değiştirilmelidir.
4. **`Zundo` Yerine Komut (`Command`) + Anlık Görüntü (`Snapshot`) Geçmişine Geçilmesi:**
   - İlk planımda önerdiğim `Zundo` yerine, Claude'un önerdiği tiplenmiş komut geçmişi (`splitCell`, `setInsert`, `resizeBay` vb.) kullanılmalıdır.
5. **Ergonomi, Sahiplik (`Anne | Baba | Ortak`), Envanter Sayacı ve Oda Engellerinin Veri Modeline Eklenmesi:**
   - İlk planımda ergonomi yalnızca göz hizası kamerası ve `>1950 mm` genel uyarısı olarak yer alıyordu. Claude'un iki kişilik boy profili, sahiplik etiketleri, envanter karşılama sayacı ve oda engelleri (yatak/kapı/radyatör süpürme çakışması) ilk sürüm veri modeline eklenmelidir.
6. **Geliştirme Fazlarının Yeniden Dengelenmesi:**
   - İlk planımda 5 faz vardı ve doğrulama/ergonomi kuralları Faz 3'te kapak animasyonlarıyla birleştirilmişti. Claude'un doğrulama, ergonomi ve kapasite motorunu ayrı ve kapsamlı bir kalite aşaması olarak ele alması daha doğrudur.

---

## 7. Karşılaştırma ve İlk Sürüm (v1) Kapsamına İlişkin Karar Önerileri

İki planın sentezinden çıkan tüm kararlar, projenin kalitesini ve geliştirme verimliliğini koruyacak şekilde üç grupta sınıflandırılmıştır:

### A. Kritik Kararlar ve Gerekli Düzeltmeler (Mimari ve Doğruluk İçin Zorunlu)

| # | Karar Başlığı | Seçilen Yaklaşım (Sentez) | Teknik Gerekçe | Zorluk |
| :--- | :--- | :--- | :--- | :--- |
| **A1** | **Merkezi Veri Modeli & Çözümleyici** | Niyet bildiren `Design` JSON (Zod, `integer mm`) $\rightarrow$ Saf TS `Solver` $\rightarrow$ `ResolvedModel` (Paneller, Kapaklar, Hacimler, Uyarılar, Kapasite). | 3D sahne hiçbir hesap yapmaz; tüm mühendislik kuralları, 2D teknik çizim ve parça listesi tek kaynaktan beslenir. | Orta |
| **A2** | **Ölçü Dağıtım Motoru** | `fixed(mm) | flex(weight, min, max)` + `locked` bayrağı (Claude Bölüm 3.3). | Duvar boyu veya köşe tipi değiştiğinde özel nişlerin (ör. 220 mm merdiven bölmesi) bozulmadan kalan alanın otomatik dağıtılmasını sağlar. | Düşük |
| **A3** | **İç Bölme Sistemi** | Özyinelemeli `SplitNode` (`horizontal | vertical | leaf`) + `InsertRegistry` eklenti mimarisi. | Tek modül içinde hem dar dikey servis nişi hem yatay raf/çekmece/askı kombinasyonlarını sınırsız ama kurallı biçimde destekler. | Orta |
| **A4** | **Bağımsız Kapak (`Front`) Katmanı** | Kapaklar `spanBays` ve `yRange` ile gövdeden bağımsız tanımlanır; menteşenin dikmeye basması kural motorunca denetlenir. | Yarı açık/yarı kapaklı modüller, dış çekmece üstü kapak ve sürgülü kapaklar için zorunludur. | Orta |
| **A5** | **Birleştirilmiş L-Köşe Mimarisi** | Claude'un `Junction` sahiplik modeli + 4 Köşe Tipi: **1) Kör Köşe (Kör Klapalı)**, **2) Beşgen/Diyagonal Köşe**, **3) L-Poligon Köşe (Katlanır Bi-Fold Kapaklı & Kademeli L-Askı destekli)**, **4) Açık/Kademeli Köşe**. | L-gardırobun en zor problemi olan köşe birleşiminde hem matematiksel duvar sahipliğini hem de kapak açılma kinematiğini eksiksiz çözer. | Yüksek |
| **A6** | **3D Render ve Görsel Kalite Hattı** | `WebGLRenderer` + Dünya-uzayı UV (`grainAxis`) + `N8AO` + `ContactShadows` + Dolap İçi LED Şerit Aydınlatma (`AccumulativeShadows` ve `CSG` kullanılmayacak). | Kapak ve çekmece animasyonları çalışırken 60 FPS akıcılıkta yüksek iç derinlik algısı ve gerçekçi malzeme görünümü sağlar. | Orta |

### B. Kullanıcı Deneyimini ve Kaliteyi Geliştiren Öneriler (v1'e Dahil Edilecek Yüksek Faydalı Özellikler)

| # | Özellik | Kaynak Plan | Kullanıcı Faydası ve Uygulama Yaklaşımı | Zorluk |
| :--- | :--- | :--- | :--- | :--- |
| **B1** | **Anne & Baba Ergonomi Profili + Sahiplik (`Anne/Baba/Ortak`)** | Claude (Bölüm 6) | Boy ölçülerine göre erişim bölgelerini (altın bölge / yüksek bölge) 2D ve 3D'de gösterir; kimin hangi bölmeyi kullandığını renklendirir. | Düşük |
| **B2** | **Envanter Kapasite Sayacı + Ölçekli 3D Eşya Gösterimi** | Claude + Gemini Sentezi | Claude'un sayısal envanter karşılama tablosu ("30 gömlek, 20 ayakkabı, 1 merdiven") ile Gemini'nin 3D sahnede `InstancedMesh` ile ölçekli eşya gösterimi birleştirilir. | Orta |
| **B3** | **Oda Engelleri ve 2D Süpürme Alanı (`Swept Area`)** | Claude (Bölüm 6, 8) | Yatak, oda kapısı, pencere, radyatör ve priz konumlarını tanımlayıp açılan kapak/çekmecelerin bunlara çarpmasını üstten planda ve 3D'de gösterir. | Orta |
| **B4** | **Hafifletilmiş A/B Varyant Karşılaştırma** | Gemini + Claude Sentezi | Çift 3D tuval (canvas) açmak yerine; **Adlandırılmış Sürümler (Snapshots)** arasında tek tıkla anlık geçiş + **Yan Yana Kapasite, Envanter ve Ölçü Farkı Tablosu** sunulur. | Düşük |
| **B5** | **Aynı 3D Sahne Üzerinden 2D Ortografik Ölçülü Ön Görünüş + Kesim Listesi** | Ortak (Claude 1.4 / Gemini 1.1) | Ayrı bir 2D motoru yazmadan, ortografik kamera + SVG/HTML ölçü katmanı ve yazdırılabilir teknik özet + CSV parça listesi üretilir. | Orta |
| **B6** | **"Neden?" Açıklamalı Kurallar + Hızlı Düzeltme + Uzman Etiketi** | Claude (Bölüm 8) | Çakışma, raf esnemesi (`>850 mm`), dar askı derinliği (`<550 mm`) ve dış duvar nem uyarısını açıklamasıyla gösterir; tek tıkla düzeltme komutu önerir. | Düşük |

### C. Daha Sonraya (v1.x / v2+) Bırakılması Gereken Geliştirmeler (Aşırı Mühendislik Önlemi)

İlk sürümün makul sürede ve hatasız tamamlanması için iki planda geçen şu özellikler **v1 kapsamı dışına** çıkarılmalıdır:
1. **`three-bvh-csg` (Boolean CSG Kesimleri):** İlk sürümde gerekli değildir (`ExtrudeGeometry` yeterlidir).
2. **Sahnede Serbest Fare Sürükleme ile Ağaç Bölücü Taşıma ve Satır İçi Aritmetik Parser (`1200/3`):** Seçim + Sağ Denetçi (Inspector) sayısal/kaydırıcı kontrolü ve hızlı bölme butonları çok daha kararlı ve hızlıdır.
3. **Tam Oda İçi Birinci Şahıs Yürüme (WASD First-Person Walk):** Bunun yerine kamera ön ayarlarında **"Anne Göz Hizası (162 cm)"** ve **"Baba Göz Hizası (178 cm)"** sabit/dönebilen bakış noktaları (v1) hem daha kolaydır hem de aynı ergonomik faydayı sağlar.
4. **Döner Karusel / Sihirli Köşe Mekanizmaları ve Pantograf (İnen Askı) Kol Animasyonu:** v2'ye bırakılmalıdır.
5. **Fotogerçekçi Path-Tracing (`three-gpu-pathtracer`), WebGPU, glTF Kıyafet Paketleri, AR Görünümü ve Uygulama İçi Ücretli LLM API:** Tamamı v2+'ya ertelenmelidir.

---

## 8. Geliştirme Aşamalarının Karşılaştırılması ve Önerilen Birleştirilmiş Yol Haritası

- **Claude'un Yol Haritası (A0–A7, 8 Aşama):** `A1`'de tamamen 3D'siz model/çözümleyici, `A2`'de temel 3D, `A3`'te düzenleme UI, `A4`'te köşe/kapak/animasyon, `A5`'te doğrulama/ergonomi/kapasite, `A6`'da görsel kalite/eşya, `A7`'de çıktı/cila.
- **Gemini'nin Yol Haritası (Faz 1–5, 5 Aşama):** Faz 1'de çekirdek + temel 3D L-iskelet, Faz 2'de köşe + Split-Tree, Faz 3'te kapak/çekmece animasyonu + çakışma, Faz 4'te görsel kalite + eşyalar, Faz 5'te A/B karşılaştırma + çıktı.

### Değerlendirme ve Önerilen Sentez Sıralaması (6 Aşama)
Claude'un `A0 (Kurulum)` ve `A1 (Model + Çözümleyici + ≥40 Birim Testi)` kalite kapısı fikri çok değerlidir; ancak 3D koordinat ve dönüşüm hatalarını erken yakalamak için `A1` ile `A2`'nin temel 3D kutu/tel-kafes doğrulaması arasındaki duvar kaldırılmalıdır:

1. **Aşama 1 — Kurulum, Veri Modeli ve Çözümleyici Çekirdeği (+ Tanısal 3D İskelet):**
   - Zod şeması (`integer mm`), komutlar, `fixed/flex` dağıtımı, `Run + Junction` grafiği, `SplitNode` ağacı, panel üreticisi ve ≥40 `Vitest` birim testi + koordinat doğrulaması için temel 3D kutu/ölçü görünümü.
2. **Aşama 2 — Özel L-Köşe Modülleri, İç Modül Kaydı (`InsertRegistry`) ve 2D/3D Görünüm:**
   - Kör köşe, beşgen köşe (`ExtrudeGeometry`), L-poligon köşe ve kademeli L-askı; raf, askı, çekmece, ayakkabılık, dar servis nişi (merdiven/ütü masası) ve yüklük modülleri; ortografik ölçülü ön görünüş ve üstten plan.
3. **Aşama 3 — Stüdyo Düzenleme Deneyimi, Durum Yönetimi ve Kalıcılık:**
   - Yapı ağacı, sağ bağlamsal denetçi (Inspector), hücre bölme/kilitleme/kopyalama/yansıtma, komut tabanlı Geri Al/Yinele, adlandırılmış sürümler (Snapshots), `IndexedDB` otomatik kayıt ve JSON içe/dışa aktarım.
4. **Aşama 4 — Bağımsız Kapak Katmanı (`Front`), Kinematik Animasyonlar ve Süpürme Alanları:**
   - Menteşeli, katlanır (`BiFoldDoor`), sürgülü ve kalkar kapaklar ile çekmece açılma/kapanma yay animasyonları (`@react-spring/three`); X-ray / kapak gizleme; 2D kapak/çekmece süpürme yayları.
5. **Aşama 5 — Doğrulama Motoru, Anne/Baba Ergonomisi, Oda Engelleri ve Envanter Kapasitesi:**
   - Kapak-çekmece, L-köşe ve oda engeli (yatak/kapı/radyatör) çakışma kuralları; raf sehim ve askı derinliği uyarıları; Anne/Baba boy profili erişim haritası ve sahiplik renklendirmesi; canlı envanter karşılama sayacı.
6. **Aşama 6 — Görsel Gerçekçilik, 3D Eşya Simülasyonu, A/B Karşılaştırma ve Marangoz Çıktıları:**
   - Dünya-uzayı UV'li PBR malzemeler, `N8AO` + `ContactShadows`, dolap içi LED aydınlatma; `InstancedMesh` ile ölçekli kıyafet/kutu/merdiven/ütü masası içerikleri; A/B sürüm karşılaştırma tablosu; yazdırılabilir 2D ölçülü çizim (SVG/PDF) ve CSV parça/kesim listesi.

---

## 9. Doğrulanması Gereken Teknik Varsayımlar

Her iki planda yer alan ve kodlama sırasında küçük teknik kontrollerle doğrulanması gereken varsayımlar şunlardır:

1. **R3F + `@react-three/postprocessing` (`N8AO`) Sürüm Uyumu:**
   - Kurulum aşamasında (Aşama 1) React 19 / Three.js güncel sürümü ile `@react-three/fiber` ve `@react-three/postprocessing` paketlerinin akran bağımlılık (peer dependency) uyumu doğrulanmalıdır.
2. **Asimetrik Derinlikli L-Köşe (`runA.depth !== runB.depth`) Poligon Matematiği:**
   - Bir kol `600 mm` (askı derinliği), diğer kol `450 mm` (raf derinliği) olduğunda beşgen ve L-köşe modülünün ön kapak açısının ve iç raf poligonunun hatasız kapandığı Aşama 1–2'deki birim testlerle kanıtlanmalıdır.
3. **`frameloop` ve Animasyon Performansı:**
   - `N8AO` açıkken kapak/çekmece yay animasyonları sırasında hedef dizüstü bilgisayarda `≥55 FPS` korunduğu; gerekirse düzenleme/animasyon anında AO kalitesinin dinamik ölçeklendiği doğrulanmalıdır.
4. **Ergonomi ve Donanım Eşikleri:**
   - Claude'un Bölüm 8.1 ve 13'te dürüstçe belirttiği üzere; askı yükseklikleri, raf sehim sınırı (`800–900 mm`), menteşe boşluk payları (`25–30 mm`) sabit kodlanmamalı (hardcoded olmamalı), `validationConfig` içinde yapılandırılabilir parametreler olarak tutulmalıdır.

---

## 10. Nihai Plan Oluşturulmadan Önce Çözülmesi Gereken Kritik Anlaşmazlıklar ve Kararlar

Nihai birleştirilmiş proje planını yazmadan önce, kullanıcı onayı ve (gerekirse) ikinci modelin son görüşüyle netleştirilmesi gereken **7 temel karar noktası** aşağıdadır:

> [!IMPORTANT]
> **Onaylanması Gereken Nihai Sentez Kararları:**
> 1. **Aşama 1 Stratejisi (Tamamen 3D'siz A1 vs. Çözümleyici + Tanısal 3D İskelet):** Claude'un `Vitest` birim testi kapısını koruyarak, 3D koordinat/dönüşüm hatalarını ilk günden görmek için Aşama 1'e basit bir 3D kutu/ölçü sahnesi dahil edilmesi önerilmektedir.
> 2. **Kapak (`Front`) ve Çekmece Modellemesi:** Dış kapakların Claude'un önerdiği bağımsız `Front` katmanında (`spanBays`, `yRange`), çekmece kasalarının ise `SplitNode` yapraklarında (`Leaf`) tutulması ve L-köşeler için Gemini'nin **Katlanır Kapak (`BiFoldDoor`)** kinematiğinin eklenmesi.
> 3. **Düzenleme Etkileşimi (Tıkla + Sağ Denetçi vs. Sahnede Fareyle Bölücü Sürükleme):** İlk sürümde hata riskini düşürmek için birincil düzenleme yönteminin **Hücre Seçimi + Sağ Denetçi (Inspector) + Hızlı Bölme/Şablon Butonları** olması, mod sayısının 6 yerine 3 akıcı adıma indirilmesi.
> 4. **Görselleştirme Hattı (`N8AO + ContactShadows + İç LED` vs. `AccumulativeShadows`):** Kapak/çekmece animasyonlarıyla çelişen `AccumulativeShadows` yerine `N8AO + ContactShadows` kullanılması ve dolap içi LED şerit aydınlatmanın v1'de tutulması.
> 5. **Dar Servis Nişi Minimum Genişliği:** Claude'un `300 mm` alt sınırı yerine, katlanır merdiven ve ütü masası bölmeleri için minimum sınırın **`160 mm`** olarak güncellenmesi.
> 6. **İlk Sürüm (v1) Kişiselleştirme ve Karşılaştırma Paketi:** Claude'un **Anne/Baba Ergonomi Profili + Sahiplik + Envanter Sayacı + Oda Engelleri** ile Gemini'nin **Hafifletilmiş A/B Sürüm Karşılaştırma Tablosu + Ölçekli 3D Eşya Gösterimi** özelliklerinin v1'de birleştirilmesi.
> 7. **Çalışma Klasörü Konumu:** Mevcut `OneDrive\Resimler\Masaüstü\Wardrobe-Studio` klasöründe devam edilip edilmeyeceği veya Claude'un önerdiği gibi OneDrive dışı bir yola (`C:\dev\wardrobe-studio`) taşınıp taşınmayacağı konusunda kullanıcı tercihi.
