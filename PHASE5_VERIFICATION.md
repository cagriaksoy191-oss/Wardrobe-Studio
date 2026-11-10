# WARDROBE STUDIO - AŞAMA 5 TESLİM VE DOĞRULAMA

**Tarih:** 4 Kasım 2026. **Çalışma kökü:** `C:\dev\Wardrobe-Studio`.

Aşama 5 uygulanmıştır. Bu teslim, sürgülü/karma cephe, fiziksel hareket sınırı, adlandırılmış sürüm, dış AI JSON köprüsü ve gerçek dosya üreten teknik üretim paketini kapsar. Genel mimari/güvenlik denetimi veya yeni kapsam başlatılmamıştır. Aşağıdaki üretim sınırları ürünün içinde de gösterilir; yazılım fabrika onayı vermez.

## 1. Başlangıç ve koruma

- Değişiklik öncesi mevcut **76/76** test ve `npm run build` başarılıydı. Kayıtlar: `artifacts/phase5/baseline-tests.log`, `baseline-build.log`.
- Aşama 4 kaynak/doküman/config/test ağacının 49 dosyalık yedeği: **`phase5-before.zip`**. `node_modules`, `dist`, geçici çıktılar ve başka arşivler dahil edilmedi.
- `phase4-before.zip` üzerine yazılmadı. Ana plan ve A-Z ek gereksinim sözleşmesi değiştirilmedi. Başlangıç SHA-256 değerleri `artifacts/phase5/baseline-manifest.json`, son karşılaştırma `preservation-check.json` içindedir.
- Eski 37 çözücü + 17 Aşama 4 geometri/oturum + 22 Aşama 4 analiz testi korunmuştur. Eksik `constructionMode` eski ayrı gövde davranışını korur; yeni boş tasarım paylaşımlı dikme kullanır.

## 2. Kullanım

### Sürgü ve karma cephe

1. **2. İç & Kapak** adımında bir gövde seçin; **Kapak Sistemleri** panelinden Menteşeli / Sürgülü / Açık seçin. Otomatik kapakta önce “Kapak aralığını özelleştir” kullanılabilir.
2. İki/üç ray; 2-6 kanat; bindirme; ray derinliği/eksen aralığı; üst-alt ve başlangıç-bitiş yan payları ayarlanır. Özel genişliklerde son kanat kalan açıklığı tamamlar. Her kanadın rayı ayrı seçilir.
3. “Kapsanan bitişik bölmeler” ile ortak cephe, alt/üst kotlarla kısmi cephe kurulur. “Üst menteşeli / alt ayrı” tek Undo ile üst menteşeli + bağımsız alt sistem oluşturur. Aralık türü Açık yapılabilir; kapsanmayan yükseklik açık kalır.
4. Normal modda kanadın **yüzeyini veya kulpunu sürükleyin**. Yan paneldeki mm sürgüsü de aynı fiziksel sınırı kullanır. Kapak Düzenle, Çoklu Seçim ve Shift/Ctrl/Meta durumlarında yüzey sürükleme devre dışıdır.
5. Pointer capture, pointer cancel/up, pencere odağı kaybı ve ikinci pointer koruması vardır. Birincil dokunma için Pointer Events yolu uygulanmıştır; fiziksel telefon/tablet üzerinde test yapılmamıştır.

Ray sistemi gövdenin **önüne** eklenir. Örneğin 600 mm gövde + 100 mm ray zarfı = 700 mm toplam derinlik; iç net derinlik `600 - arkalık` olarak kalır. Yan pay açıklığı daraltır; kendiliğinden dolgu parçası üretmez. Ray profilleri yerleşim zarflarıdır, katalog kesiti değildir.

Kanat genişlikleri toplamı eksi bindirmeler tam açıklığa eşittir. Yetersiz ray derinliği/eksen aralığı, uygunsuz genişlik, aynı rayda başlangıç kesişmesi ve düşey cephe çakışması görünür hatadır. Kapak düzeni ve malzeme/kulp seçimleri `Design`/JSON içinde saklanır. Açık/kapalı hareket pozları geçici sahne durumudur; Undo kaydı oluşturmaz ve model yeniden kurulduğunda sıfırlanır.

### Sürümler ve dış AI

1. **3. Malzeme / Çıktı → Sürüm / AI**: ad girip aktif tasarımı yeni sürüm kaydedin. Yeniden adlandırma, geri alınabilir arşivleme ve sürüm JSON indirmesi vardır.
2. “Bu sürümü aç” mevcut çalışma kopyasını bir Undo adımıyla değiştirir; önceki çalışma Geri Al ile geri gelir. Ctrl+S kontrol noktası ve otomatik oturum ayrı kalır.
3. A/B panelinde **A aktif çalışma**, B arşivden seçilen sürümdür; iki hafif SVG önizleme, fiziksel parça, levha alanı, net askı/raf/çekmece/depolama kapasitesi, kanat/çekmece, hata/uyarı ve envanter eksik farkları gösterilir.
4. Dış AI bölümünde istek girip **tam JSON ve talimatları** hazırlayın/kopyalayın. Dış servise otomatik çağrı, yükleme veya ücretli API yoktur.
5. Dönen tam Design JSON metnini yapıştırın veya JSON dosyası seçin; doğrulayın. Hatalar alan yolu/kural koduyla, uyarılar ayrı gösterilir. Geçerli öneri **önce yeni sürüm** olarak kaydedilir; aktif tasarımı açma ayrı düğmedir.

JSON köprüsü 2 MB, derinlik/nesne sayısı ve kol/bölme sınırı uygular; Zod, benzersiz kimlik, bitişik kapsam, eksen bağlantısı, çözücü ve üretim geometrisini denetler. Markdown kod bloğu/tam olmayan JSON kabul edilmez. Çekmece önleri `insert.drawerBank` içinden türetilir; şemadaki tarihsel `Front.type=drawerFront` yer tutucusu yeni AI önerisinde kabul edilmez.

Sürüm arşivi `wardrobe-studio:named-versions:v1` anahtarında localStorage + IndexedDB kullanır; v2 oturum/checkpoint anahtarlarını değiştirmez. Sürüm kaydı anlık tasarımın derin kopyasıdır; açılışta arşivler birleştirilir, devam eden düzenleme geç gelen IDB okumasıyla ezilmez. Tarayıcı verilerinin temizlenmesi arşivi siler; önemli sürümleri JSON olarak da indirin. Arşiv 200 kayıtla sınırlıdır; görünür hata sessiz kayıt kaybını önler.

### Üretim ve görselleştirme çıktıları

**3. Malzeme / Çıktı → Üretim**:

- Geniş pafta önizlemesi; gerçek indirilebilir çok sayfalı **Türkçe vektör PDF**; tam **UTF-8 BOM / noktalı virgül CSV**; tek SVG; tüm SVG + CSV + kaynak Design + üretim modeli içeren ZIP; gömülü fontlu yazdırılabilir HTML.
- A3 yatay, mm, pafta bazında standart ölçek. PDF/SVG/yazdırma aynı çizgi, çokgen ve metin komutlarını kullanır. PDF içine yerel Noto Sans gömülür; internet bağlantısı gerekmez.
- Kapak/version/tarih/durum; her kolun dış/ek ray derinliği ve kalınlık özeti; genel aksonometri; A/B cephe; plan; her kolun düşey yan kesiti; her modülün açık iç cephesi ve tam parça/aralık/çekmece tabloları; tam kesim listesi; donanım/montaj/uyarı sayfaları.
- Beşgen alt/üst/ara raflar ayrı özel kesim paftası ve koordinat tablosu alır: bütün V noktaları, E kenar boyları, köşe iç açıları, yerel/dünya başlangıcı, ön/arka yönü, damar oku ve bant kontrolü. Dış dikdörtgen kesim şekli olarak sunulmaz.
- Renkli PNG ve dış görselleştirme promptu; derinlik ve tel/kenar PNG yardımcıları. CSS görünüm boyutunun 2 katı, uzun kenarda en fazla 4096 piksel. Seçim hacimleri/stüdyo kılavuzları yardımcı haritalarda gizlenip aynı işlem sonunda geri yüklenir. HTML ölçü etiketleri PNG'ye girmez; temiz renkli görsel için Ölçüler kapatılabilir. Tel çıktısı görünmeyen iç parçaları da gösteren iskelet görünüşüdür, kontur/CNC çizimi değildir.

## 3. Üretimde tek ölçü kaynağı

`Design → solveDesign → extractProduction → TechnicalSheet / CSV / PDF / ZIP`.

- Her gerçek fiziksel parça kararlı kaynak kimliği ve `P-...` kodu alır; adet 1 olarak listelenir. Kodlar SVG, modül tabloları, tam CSV, PDF ve üretim JSON'unda aynıdır. Kod çakışması/negatif veya tamsayı olmayan kesim boyu ihracı engeller.
- Paylaşımlı N+1 dikme tek fiziksel satırdır; `moduleIds` iki komşuyu gösterebilir. Ayrı gövde şemasındaki 2N panel korunur.
- Görsel `drawerBox` kesim listesine girmez. Her çekmece **yapısal ön + sol yan + sağ yan + arka + taban** olarak beş gerçek parça; organizatörler ayrıca çıkarılır. Bu konstrüksiyonda ön yüz kasanın ön duvarıdır; modellenmeyen altıncı iç ön duvar eklenmez.
- Rod, ayak ve LED'ler levha satırı değil donanımdır. Askı borusu eksen yüksekliği ve boyu, raylar, kanat mekanizması, kulplar, tahmini menteşeler ve raf destekleri belirtilir. Seçilmemiş genel bağlantı/duvar sabitleme/LED güç sistemi adedi **Belirlenmedi** gösterilir.
- Arkalık/taban her koldaki gerçek `backPanelThicknessMm`, ana parçalar gerçek `panelThicknessMm` kullanır. 18/8 ve 25/4 örnekleri ayrı doğrulanmıştır.
- Cam/ayna satırı çerçeve/taşıyıcı dahil montaj zarfıdır; iç cam/profil/taşıyıcı kesimleri bilinmiyorsa ham levha veya ham cam emri olarak gösterilmez, levha alanı toplamından ayrılır.
- CSV kullanıcı metinlerini tırnaklar ve formül başlangıçlarını etkisizleştirir; SVG/HTML kullanıcı metinlerini kaçırır. Yazdırılabilir rapor dış dosya/font sunucusuna bağımlı değildir.

## 4. Fiziksel hareket ve Aşama 4 ile tutarlılık

Tek mm kinematik kaynağı kapak paneli, altı kulp stili, sürgü ve çekmecenin beş panelini içerir. Canlı renderer aynı konum parametresini okur; React/Zustand'a kare başına poz yazılmaz.

- Doğrusal sürgü/çekmecede sürekli SAT giriş/çıkış aralığı: hızlı sürükleme ince bir engelin öbür tarafına atlayamaz.
- Döner kapakta uç hull'ları + yarıçap/sagitta sınırı ve uyarlamalı bölme: ara yay boşluğu atlanmaz. Son yay adımı 0,05 mm ile sınırlandırılır, temas öncesi 0,05 mm ayırma payı kullanılır. Son yay/spring yakınsaması da çarpışma denetiminden geçer.
- Düşey aralık, gerçek kalınlık, aynı/farklı ray, kulp çıkıntısı, açık çekmece, diğer kapak ve statik gövde/engel dikkate alınır. Menteşenin kendi montaj dikmesi temas adayı dışında tutulur; sınırsız gövde yok sayma uygulanmaz.
- Başlangıçta fiziksel olarak kesişen parçalar `MOTION_INITIAL_INTERSECTION` kritik hatası üretir. Hareket durunca parça kırmızı çerçeveyle, neden ve diğer parça adı üst şeritte gösterilir.
- Aşama 4 üst planı aynı hacimlerden türetilir; döner plan zarfı 1 derece, canlı temas kontrolü daha incedir. Oda kapısı için korunan tam açılma zarfı muhafazakâr engel olarak kullanılır.

Bu iş sırasında gereken iki temel düzeltme yapıldı: (1) köşe kanadının kapalı panel merkezi animasyonla eşitlendi, kalınlık/komşu cepheye göre uç boşluğu türetildi; (2) tek kalınlıklarda çekmece ve yatay tabla merkezleri yuvarlama yüzünden arkalığa/alt tablaya taşmayacak biçimde yarım mm merkez koordinatlarıyla çözüldü. **Niyet ve kesim uzunlukları tamsayı mm kalır**; merkezler ve dönme koordinatları türetilmiş geometridir.

Beşgende dış diagonal `hypot(ArmA-DB, ArmB-DA)`, dikmeler sonrası net açıklık ve uç boşlukları sonrası kanat boyu farklı ölçülerdir. `outerFrontSpanMm` dış formülü, mevcut `frontOpeningWidthMm` net açıklığı taşır; plan/özel parça paftaları bu ayrımı açıklar.

## 5. Otomatik doğrulama

| Test dosyası | Adet | Sonuç / kapsam |
|---|---:|---|
| `tests/solver.test.ts` | 37 | Korunan Aşama 1-3 regresyonları |
| `tests/phase4.test.ts` | 17 | Korunan geometri, checkpoint, Undo/Redo, eski JSON |
| `tests/phase4-analysis.test.ts` | 22 | Korunan ergonomi/envanter/engel/süpürme |
| `tests/phase5-motion.test.ts` | 11 | İki/üç ray, eşit/asimetrik kanat, uç sınırları, karma aralık, kulp, hızlı hareket, B ekseni |
| `tests/phase5-contact.test.ts` | 4 | Son spring adımı, gerçek L kapak teması, başlangıç kesişmesi, 25/4 çekmece yüzleri |
| `tests/phase5-versions.test.ts` | 11 | Ayrı arşiv, açma/Undo, JSON önizleme/hata/boyut sınırı, A/B netleri, seçim politikası, geçici poz |
| `tests/phase5-production.test.ts` | 18 | Dört gerçek paket, beş çekmece parçası/organizatör, N+1/legacy, 25/4, poligonlar, tam CSV/kod, A3 sınırları, kaçış, cam zarfı, kritik ihracat kilidi, ZIP byte eşitliği/BOM ve malzeme adları |
| **Toplam** | **120** | **120/120 başarılı** |

`npm run build`: TypeScript strict + Vite başarılı. Son kayıtlar `artifacts/phase5/final-tests.log` ve `final-build.log`. Önceden de bulunan büyük 3D chunk uyarısı devam eder; PDF ve ZIP üretimi ayrı dinamik modüllerdir. Yeni bağımlılıklar `jspdf@4.2.1`, `fflate@0.8.3`; Noto Sans SIL OFL lisansı `public/fonts/OFL.txt` içindedir. Var olan Vitest/Zod bağımlılık uyarıları için kapsam dışı büyük sürüm yükseltmesi yapılmadı.

## 6. Gerçek tarayıcı kontrolü

Brave'de **`http://127.0.0.1:5175/`** ayrı origin kullanıldı; 5173 kullanıcının oturumuna müdahale edilmedi. Örnekler ve QA sürümleri bu test origin'indedir.

- Eski L tasarım kaydı ayrı sürüme alındı. Hatalı JSON alan yolu hatalarıyla reddedildi. Geçerli JSON önizleme ve yeni sürüm kaydı aktif tasarımı değiştirmedi; ayrı Aç düğmesi değiştirdi. Geri Al önceki L çalışma kopyasını, Yinele düz örneği getirdi.
- Sayfa yenilemesinde çalışma/Undo ve isimli arşiv geri geldi. A/B'de 25/4 L ile üç raylı düz örneğin **94 / 69 fiziksel parçası**, kapasiteleri ve farkları görünür tablo/iki SVG ile denetlendi. Tam AI promptunda kaynak Design JSON bulundu.
- Düz örnek yüzeyden sürüklenerek **1436 mm** konumuna geldi; Undo sayısı değişmedi. Çekmece kapalı sürgüde durdu. Kanatlar **1964 / 982 mm** konumuna alınınca açıklık boşaldı. Açık çekmeceye doğru kapanan ilk sürgü **1458 mm** civarında durdu ve Türkçe neden göründü. Düzenleme modundaki yüzey sürüklemesinde kanat **0 mm** konumunda kaldı.
- İki raya geçiş ve üst menteşeli/alt sürgülü bölme üretildi. Ray derinliği 50 mm yapılarak kritik hata oluşturuldu: PDF/CSV/ZIP düğmeleri kapandı; Undo ile üç raylı örneğe dönüldü.
- Düz 21 pafta ve asimetrik 39 pafta geniş önizlemede açıldı; açık modül içi, özel beşgen, tüm koordinat sayfaları ve parça kodları incelendi. PDF/CSV/ZIP düğmeleri çalıştırıldı; UI başarı bildirimi ve sıfır console error/warn gözlendi.
- Renkli ve temizlenen derinlik/tel yardımcıları **2006 × 1520 piksel** üretildi; gerçek PNG byte'ları `artifacts/phase5/browser-*.png` olarak kaydedilip incelendi.

**Otomasyon sınırı:** Tarayıcı eklentisinin dosya yükleme yardımcısı “file URL erişimi” gerektirdiği için ayar değiştirilmedi; aynı örnek yerel HTTP kaynağından okunup uygulamanın JSON metin önizlemesiyle yüklendi. Blob PDF için otomasyonun `download` olayı zaman aşımına uğradı; UI üretim bildirimi görüldü ancak tarayıcının indirme dizinindeki dosya ayrıca yakalanamadı. İç indirme geçmişi URL'si araç politikasıyla kapalıydı, aşılmadı. **Aşağıdaki gerçek PDF/CSV/ZIP dosyaları uygulamanın aynı export fonksiyonlarıyla ayrıca diske üretilip bağımsız denetlendi**; yalnız başarı mesajına dayanılmadı.

Kanıt görüntüleri: `browser-sliding-collision.jpg`, `browser-production-preview.jpg`, `browser-version-comparison.jpg`, `browser-polygon-preview.jpg`, `browser-capture-validation.jpg` (`artifacts/phase5/` içinde).

## 7. Gerçek örnek dosyalar ve PDF incelemesi

| Örnek | Ana/arka (mm) | Fiziksel parça | Poligon | PDF sayfa |
|---|---|---:|---:|---:|
| Düz / üç ray / organizatörlü çekmece | 18 / 8 | 69 | 0 | 21 |
| Beşgen L / karma cephe | 18 / 8 | 94 | 5 | 39 |
| Kör köşe / karma cephe | 18 / 8 | 81 | 0 | 28 |
| Asimetrik beşgen L (600/480) | 25 / 4 | 94 | 5 | 39 |

PDF'ler `output/pdf/wardrobe-phase5-{straight,diagonal,blind,asymmetric}.pdf` içindedir. Her örneğin **Design JSON, canonical production JSON, tam CSV, tüm SVG, yazdırılabilir HTML ve ZIP** dosyaları `artifacts/phase5/examples/{örnek}/` altındadır; SHA-256 ve pafta listeleri `examples/manifest.json` içindedir. Kör köşe örneğinde valiz/yüklük kör alanda, çekmeceler erişilebilir ikinci bölmededir.

PDF'ler baştan sona pypdf ile yeniden açıldı; 127 sayfanın her biri Poppler ile PNG'ye çevrildi. Türkçe karakterler, tüm parça kodları, son montaj notu, beşgen V/E bilgileri ve A3 sayfa boyu programla denetlendi. Sayfa düzenleri kontak paftalarda; özel poligon, kesim tablosu, net aralık/çekmece ve son sayfalar tam boy görsellerde incelendi. Sonuç `artifacts/phase5/pdf-qa.json`; 13 kontak pafta ve beş seçili tam boy PNG `artifacts/phase5/pdf-preview/` içinde korundu. `tmp/pdfs/` altındaki bu işte üretilen geçici render dosyaları temizlendi; QA betiği tekrar üretir.

Yeniden üretim:

```powershell
npm test -- --run
npm run build
node scripts/phase5-motion-check.mjs
node scripts/phase5-fixtures.mjs
# pypdf/Pillow ve Poppler bulunan Python ortamı:
python scripts/phase5-pdf-qa.py
npm run dev -- --host 127.0.0.1 --port 5173
```

## 8. Gerçek sınırlar ve teslim sonrası durma noktası

- Ölçüler nominal bitmiş model geometrisidir. Kenar bant kalınlığı, ham kesim düşümü, testere/fire, kanal/zıvana/bağlantı ve alıştırma planı seçilmemiştir; kesin ham kesim/CNC emri verilmez.
- Ray kesiti, teker/klavuz düzeni, taşıma kapasitesi, kulp delik aksı, menteşe kupa/vida şablonu ve sabitleme üretici/usta kontrolündedir. Menteşe/destek adetleri açıkça planlama tahminidir. Bilinmeyen adet “0” veya kesin ürün olarak uydurulmaz.
- Çarpışma hacimleri dikdörtgen/dışbükey panel ve kulp zarflarıdır; ayrıntılı eğri donanım, esneme, tolerans zinciri veya oda kapısının eşzamanlı fizik motoru simüle edilmez. Güvenli yönde muhafazakâr erken durma olabilir. Gerçek yük/menteşe türü için katalog gerekir.
- Dar veya tek açıklıklı sürgü, bütün iç çekmecelere aynı anda erişim sağlamayabilir. Kanatlar izin verilen ray üzerinde yığılmalı; gerekirse kanat adedi/genişliği veya iç bölme düzeni değişmelidir. Yazılım çarpışmayı kaldırmak için gövdeyi ya da eşyayı sessizce küçültmez.
- PDF/A, CNC/CAM, kesim optimizasyonu/nesting, stok levha/fire hesabı, bulut senkronu, hesap sistemi ve otomatik ücretli AI entegrasyonu bu teslimde yoktur.
- Gerçek marangoz üretimine geçmeden yerinde oda ölçüsü, duvar/döşeme doğruluğu, 4 mm taban taşıması, ağır/geniş kanat ve sabitleme ayrıca kontrol edilmelidir. Normal rapor durumu **USTA KONTROLÜ GEREKİR**; kritik hatada **ÜRETİM ÇIKTISI ENGELLİ**.

Aşama 1-5 geliştirme teslimi burada biter. Genel denetim/refactor veya yeni ürün kapsamı kullanıcıdan ayrı talimat gelmeden başlatılmaz.
