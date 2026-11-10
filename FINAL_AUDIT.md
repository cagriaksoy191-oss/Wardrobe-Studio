# Wardrobe Studio — Nihai Bağımsız Proje Denetimi

Denetim tarihi: 04.11.2026. Çalışma kökü: C:/dev/Wardrobe-Studio. Kapsam: Aşama 1–5, Aşama 2.1–2.4 ve A–Z ek sözleşme. Bu görev yalnız denetimdir; uygulamaya düzeltme uygulanmadı.

## Yönetici özeti

Wardrobe Studio, ana tasarım akışları çalışan ve mevcut mimarisi hedefli düzeltmelerle olgunlaştırılabilecek bir üründür. Bununla birlikte “beş aşamanın bütün zorunlu ayrıntıları tamamlandı” iddiası bağımsız denetimde doğrulanmadı. Kayıt geri yükleme yarışı, eksik global JSON/geometri doğrulaması, takı çekmecesi bölücülerinin fiziksel kesişmesi ve Z arka yönlü ölçü ankrajı öncelikli kusurlardır. Bunlar özellik listesindeki küçük görsel boşluklarla aynı önem düzeyinde değildir.

Mevcut 120 testin tamamı ve sıkı TypeScript/üretim derlemesi başarılıdır. Bu, yeni bulunan kusurların yokluğu anlamına gelmez. Dört örnekte nominal parça sayıları ve ölçüleri çıktı türleri arasında eşleşiyor; aynı hatalı yerleşimin birden fazla çıktıya tutarlı taşınabildiği de gösterildi.

P0: 0, P1: 4, P2: 20, P3: 3 yazılım bulgusu; ayrıca 3 EXTERNAL doğrulama konusu kaydedildi. Toplam 30 bulgu kaydı vardır. P0 düzeyinde temel sistemin çalışmaması, kanıtlanmış geri alınamaz veri kaybı veya yaygın ciddi geometri/üretim bozulması tespit edilmedi. Koşullu kayıt yarışı ve belirli şablon/girişlerdeki hatalar P1 olarak sınıflandırıldı. AUD-001'de aktif yeni çalışma/geçmişin ezilmesi kanıtlandı; kalıcı geri alınamaz kayıp ayrıca kanıtlanmadı. AUD-002/003 üretim için yüksek önceliklidir; P1 olmaları kesim öncesi ertelenebilecekleri anlamına gelmez.

Üretim paketleri “USTA KONTROLÜ GEREKİR” der; “fabrika üretimine hazır” onayı vermez. Nominal geometri/kod eşleştirmesi için yararlıdır. Özellikle organizer geometrisi düzeltilmeden ve ham kesim/bant/birleşim/donanım kararları kesinleşmeden bu dosyalar koşulsuz kesim emri olarak kullanılmamalıdır.

## Kullanıcının 12 sorusuna cevap

1. **Genel durum:** Günlük parametrik tasarım, gelişmiş seçim, sürgü, sürüm ve çıktı akışları büyük ölçüde işler. Son tur; güvenilirlik, eksik zorunlu ayrıntılar ve üretim açıklığının tamamlanmasıdır.
2. **Ana planın karşılanması:** 133 atomik ana plan satırının 95'sı PASS, 26'i PARTIAL, 8'i FAIL, 3'ü UNVERIFIED, 1'i EXTERNAL VERIFICATION. Dış uzman satırı hariç 132 yazılım yükümlülüğünün 95'sı tam doğrulandı. Aynı yükümlülüğün farklı bölümlerdeki tekrarları ikinci kez sayılmadı.
3. **A–Z durumu:** 192 atomik satırda 153 PASS, 24 PARTIAL, 2 FAIL, 9 UNVERIFIED, 4 EXTERNAL VERIFICATION. B'nin kızak seçimi ve N'nin Z arka ankrajı açık FAIL; H kayıt güvenilirliği ve Z üretim ayrıntıları başlıca kısmi alanlardır. A–Z'nin tümü eksiksiz karşılandı denemez.
4. **Hata sayıları:** 0 P0 /4 P1 /20 P2 /3 P3; 3 dış uzman konusu. Matris satırı sayısı hata sayısı değildir; tek hata birden çok gereksinimi etkileyebilir.
5. **Gerçek ölçü ve geometri:** Temel net ölçü, paylaşımlı dikme, tamsayı dağıtımı ve beşgen alan/açı matematiği doğrulandı. Organizer kesişmesi, Z ankrajı, küçük kalın tabanlı çekmece net yüksekliği ve 1 mm kapalı kapak merkezi sapması doğrulanmış hatalardır. Birleşimsiz L gibi geçersiz global durumlar da kabul edilebiliyor.
6. **Sürgülü/karma sistem:** Denetlenen 2/3 ray, 2–6 kanat, eşit/özel genişlik, ray sınırı, düşey ayrım ve sürekli temas senaryoları başarılı. Tarayıcıda açık çekmeceye karşı gerçek duruş görüldü. Bütün donanım/plan birleşimleri ve iptal edilen fare sürüklemesi için sınırsız güvenilirlik iddiası yok.
7. **PDF’nin güvenilir yönleri:** A3 sayfa boyutu, Türkçe font, 69/94/81/94 tekil parça, CSV/PDF nominal kesim ölçüleri, malzeme alanları, poligon koordinatları ve iç açılar eşleşiyor. Paylaşımlı dikme tam kesim listesinde iki kez sayılmıyor.
8. **PDF’de kesinleşmesi gerekenler:** Bilinen kapak/kulp konum ve pay eşleştirmeleri, B iç görünüşü, montaj/birleşim detayı; ayrıca bant planı/kalınlığı, ham kesim düşümleri, gerçek ray/menteşe/profil/delikler, yük ve ankraj/LED seçimi. Son grupta usta/üretici onayı gerekir.
9. **Test/derleme:** 120/120; 7 test dosyası başarılı. npm run build exit 0. Vite ana paket için büyüklük uyarısı verdi; hata değildir.
10. **Gerçek tarayıcı:** İzole Brave 5180'de boş→L, köşe ölçüsü/onay/Undo, sanal raf seçimi, gerçek marquee, çekmece düzenleme, malzeme/LED/Sunum, kişi/engel/Quick-Fix, sürgü kulp sürükleme/temas, sürüm/arşiv/A–B/JSON/F5 ve üretim engeli denendi. İndirme dosyasının diske ulaşması doğrulanamadı.
11. **Kullanıcının en önemli tekrarları:** Önce USER_ACCEPTANCE_TESTS.md içindeki kayıt/F5/gerçek indirme, organizer ve kapak ölçüleri, Z arka ankrajı, görünüm geçişleri ve A3 gerçek boyut baskı kontrolleri. Beklenen doğru davranışla mevcut bilinen kusur ayrı yazıldı.
12. **Düzeltme sırası:** Kayıt güvenilirliği ve ortak doğrulama; organizer/net/ankraj/merkez geometri; zorunlu eksik parametreler; belge ayrıntıları; görsel/performance kapsamı ve son kullanıcı kabulü. Mevcut mimariyi baştan yazmak gerekmiyor.

## Yöntem ve çalışma sınırları

AGENTS.md, ana plan, ek sözleşme, PROJECT_HANDOFF, CODEBASE_MAP, HANDOFF_VERIFICATION, PHASE4_VERIFICATION ve PHASE5_VERIFICATION okundu. Ana/ek sözleşme beklentiyi, gerçek kaynak uygulamayı, yeni test/tarayıcı/matematik sonuçları kanıtı belirledi. Eski raporların “tamamlandı” etiketleri bağımsız kabul edilmedi.

Şema, flex/köşe/gövde/split çözücü, treeMutator, store/kayıt/geçmiş, analiz/envanter, kinematik kısıtlayıcı, Front komutları, sürüm/AI, üretim çıkarımı/paftalar/export ve sahne/seçim/malzeme/eşya bileşenleri incelendi. Bağımlılık eklenmedi; sürüm yükseltilmedi; eski testler düzenlenmedi.

Kaynaklar, testler, yapılandırmalar, sözleşmeler ve mevcut raporlar için başlangıç manifestindeki 75 dosyanın SHA256 değeri son kontrolde 75/75 aynıydı. Mevcut dört PDF’nin manifest hash'leri de aynıdır. Git deposu bulunmadığı için diff yerine dosya hash kanıtı kullanıldı. Üretim derlemesinin dist/tsbuildinfo gibi türetilmiş dosyaları ve yeni denetim rapor/kanıtları bu değişmezlik kapsamından ayrıdır.

Gerçek kullanıcı kayıtlarına yazılmadı. Kullanıcının 5173/5175 origin'leri üzerinde değişiklik yapılmadı; UI denemeleri 5180'de yalnız sentetik denetim tasarımlarıyla yapıldı. Gecikme/kota enjeksiyonu Node içinde sahte, bellek tabanlı idb-keyval karşılığıyla yapıldı; tarayıcı deposuna bağlanmadı. Geçici SSR araçları ayrı Vite cacheDir ve hmr:false ile kullanıldı. Tam sayfa PNG ara dosyaları inceleme sonrası temizlendi; 13 temas resmi ve seçili 6 detay tutuldu.

## Çalıştırma sonuçları

|Kontrol|Sonuç|Sınır|
|---|---|---|
|Node/npm|24.16.0 /11.13.0|Bu ortamda gözlenen sürümler|
|npm test -- --run|7/7 dosya, 120/120 test, exit 0|Yeni kusurların bazıları mevcut test kapsamı dışında|
|npm run build|TS strict ve Vite 6.4.5 başarılı, exit 0|Ana JS1735.27 kB, gzip 480.28 kB; >500 kB paket uyarısı|
|Bağımsız betik|119 gözlem:97 olumlu, 22 dikkat kaydı|22 benzersiz hata değildir; 3000 flex örneği tek gözlemde|
|İzole kayıt deneyi|Geç okuma ve LS kota sorunları tekrarlandı|Sahte bellek deposu; gerçek kayda dokunulmadı|
|PDF/CSV/SVG/ZIP|Dört örnek, 127 sayfa; 338 kesim satırı|Nominal tutarlılık; ortak geometri kusuru ayrıca değerlendirildi|
|Tarayıcı|20 kayıtlı senaryo; 19 PASS, 1 UNVERIFIED|PASS kayıtları belirtilen alt akışlar için; tüm UI permütasyonları değil|

3000 flex vakasında her net ölçü tamsayı kaldı; ara bölücülerle toplam hedefi tuttu ve tüm min/max sınırları korundu. Üç eski preset ve dört üretim tasarımı JSON turunda aynı geometriyi verdi. Derinlik ve kalınlık komutlarının iki farklı sıralaması eşdeğer sonuç üretti. Bu son kontrol tüm olası komutların birbirleriyle değişmeli olduğunu iddia etmez.

### Bağımsız kontrolün uygulamayı tekrar etmemesi

Beklenen net ölçü 800−2 t ve 600−tb ile; paylaşımlı dikmeler N+1, ayrı gövdeler 2N ile; poligon alanı shoelace, kenarlar hypot, açı atan2(cross, dot) ile hesaplandı. Uygulama açı için acos kullanır. Organizer çiftlerinde ayrı üç eksenli kutu kesişimi hesaplandı. Hareket için 20 mm panel ve 0.2 mm engelde beklenen temas 490 mm, güvenlik payıyla 489.95 mm idi; sonuç 489.9500001 mm oldu. Başlangıçta kesişen parça tek kritik çakışma verdi ve hareket engellendi; bu güvenli davranış hata sayılmadı.

Kapasite görsel kıyafet sayısından alınmadı. Ortak 724 mm kullanılabilir askı, 45 mm adımda 16 eşya verdi; 12+12 hedefte 12/4 paylaşıldı. Ters hedef sırası öncelik alan kişiyi değiştirdi, toplam 16 kaldı. Bu belgelenmiş ilk-uygun yerleştirmedir; optimum veya adil dağılım algoritması değildir.

## Gerçek tarayıcı kanıtları

Ayrıntılar: [artifacts/final-audit/browser-evidence.json](C:/dev/Wardrobe-Studio/artifacts/final-audit/browser-evidence.json); yakalanan warn/error listesi: [artifacts/final-audit/browser-console.json](C:/dev/Wardrobe-Studio/artifacts/final-audit/browser-console.json). Bu listede 0 kayıt vardır; bütün tarayıcı geçmişi veya ölçülmüş performans anlamına gelmez.

|Akış|Gözlenen sonuç|Kanıt|
|---|---|---|
|Boş L ve ergonomi/engel|A2800/D600, B2200/D480, H2400; Anne 1500→göz 1395 mm; yatak çakışması; Quick-FixZ2230|[artifacts/final-audit/browser-room-plan.jpg](C:/dev/Wardrobe-Studio/artifacts/final-audit/browser-room-plan.jpg)|
|Köşe ikinci aralık|736→800; 64 mm kırmızı taslak; onay 736/800/672; Undo 736/736/736|[artifacts/final-audit/browser-corner-draft.jpg](C:/dev/Wardrobe-Studio/artifacts/final-audit/browser-corner-draft.jpg)|
|Raf/marquee|547/547/548/548 aralıklarının ortası 2→3; 359/359/359; gerçek drag 3 hücre, gross 1113 mm|[artifacts/final-audit/browser-marquee.jpg](C:/dev/Wardrobe-Studio/artifacts/final-audit/browser-marquee.jpg)|
|Sürgü teması|3 ray; direkt kulp sürükleme; çekmece açıkken ilk kanat 1458 mm sınırında durdu|[artifacts/final-audit/browser-collision.jpg](C:/dev/Wardrobe-Studio/artifacts/final-audit/browser-collision.jpg)|
|Çekmece editörü|İlk ön 227→250; diğer 205/227; seçili kimlik doğru; Undo eski değerler|[artifacts/final-audit/browser-drawer-editor.jpg](C:/dev/Wardrobe-Studio/artifacts/final-audit/browser-drawer-editor.jpg)|
|Malzeme/ışık|Ceviz, Sunum, 4000K LED; kamerada 3D→2D→3D görünüm korunumu|[artifacts/final-audit/browser-material-led.jpg](C:/dev/Wardrobe-Studio/artifacts/final-audit/browser-material-led.jpg)|
|Sürüm/A–B/AI|Adlandır/yeniden adlandır/arşiv/F5; JSON ayrı varyant; aktif açık açmayla ve Undo/Redo|[artifacts/final-audit/browser-comparison.jpg](C:/dev/Wardrobe-Studio/artifacts/final-audit/browser-comparison.jpg)|
|Üretim kapısı|Ray 50 mm kritik; PDF/CSV/ZIP düğmeleri birlikte devre dışı; Undo geri açtı|[artifacts/final-audit/browser-production-blocked.jpg](C:/dev/Wardrobe-Studio/artifacts/final-audit/browser-production-blocked.jpg)|
|Teknik önizleme|21 sayfa, A1 modül detayı, 1:15 ve gerçek netler|[artifacts/final-audit/browser-preview.jpg](C:/dev/Wardrobe-Studio/artifacts/final-audit/browser-preview.jpg)|
|Eşya üzerinden seçim|Gömlek mesh’i içinden tıklama doğru 1454×1536×592 hücresini seçti|[artifacts/final-audit/browser-final.jpg](C:/dev/Wardrobe-Studio/artifacts/final-audit/browser-final.jpg)|

CSV indirme olayı, tıklamadan önce bekletilerek 12 s sınırıyla yeniden denendi; olay/saved path dönmedi. UI, PDF/CSV/ZIP/SVG üretim başarı bildirimleri gösterdi. Bu, indirme klasörüne ulaşıldığının kanıtı sayılmadı. Tarayıcı iç sayfaları veya indirme klasörüne erişerek araç sınırı aşılmadı. Mevcut disk çıktıları ayrı export/çözümleyici ve bağımsız parser yoluyla doğrulandı.

## Aşama bazında durum

|Aşama|Doğrulanan güçlü alan|Öncelikli açıklar|
|---|---|---|
|1–2 temel|mm, flex, kilit, net/dış, shared/separate, köşe, SplitNode|AUD-002 global doğrulama; AUD-006 tavan; AUD-012/013 köşe uçları|
|2.1–2.4 editör|Sanal aralık, marquee, komşu onayı, çekmece/kapak editörü, checkpoint|AUD-001/004/007 kayıt ve Z ankrajı; AUD-009/018/023; seçili UI tekrarları UNVERIFIED|
|3 görsel|PBR/UV, 6 kulp, LED, ContactShadows, bitiriş presetleri|AUD-014/015 eşya davranışı; AUD-020 teknik kapsam; cihaz ölçümü yok|
|4 analiz|Kişi/ortak erişim, gerçek envanter, oda/sweep, QuickFix, şablon, kopya/yansıma|AUD-003 organizer; AUD-005 net; AUD-010/011/019/022/025|
|5 sürüm/mekanik/üretim|Sürüm yaşam döngüsü, AI önizleme, 2/3 ray sürekli temas, tekil BOM|AUD-002 ortak giriş; AUD-008/009; AUD-016/017/021; atölye onayları|

## Öncelikli bulgu listesi

|Kimlik|Önem|Bulgu|Aşama|
|---|---|---|---|
|AUD-001|P1|Geç IndexedDB geri yüklemesi yeni çalışma kopyasını ezebiliyor|1 / 2.1 / 5|
|AUD-002|P1|Genel JSON kabulü ve çözücü küresel tasarım invariantlarını aynı yerde doğrulamıyor|1 / 5|
|AUD-003|P1|Takı çekmecesi bölücülerinin kesimleri ile yerleşimleri birbirine uymuyor|4 / 5|
|AUD-004|P1|Z yönünde ‘Ön cephe sabit’ küçültme ön cepheyi taşıyor|2.3 / 2.4|
|AUD-005|P2|Kalın tabanlı küçük çekmecede net yükseklik fazla bildiriliyor|2.4 / 4 / 5|
|AUD-006|P2|Oda tavanından yüksek dolap üretim uyarısına girmiyor|1 / 3 / 4 / 5|
|AUD-007|P2|localStorage yazma hatası çalışan IndexedDB yedeğini de atlıyor|1 / 2.1|
|AUD-008|P2|600 mm üzeri çift ve bağımsız menteşeli kanatlarda genişlik uyarısı yok|2 / 5|
|AUD-009|P2|Tek sayılı sağ kapaklarda animasyon ile üretim merkezi 1 mm ayrılıyor|2 / 5|
|AUD-010|P2|Kısa/orta/uzun askı türü niyeti kullanılmıyor|2 / 4|
|AUD-011|P2|Beşgen köşedeki hasHangingRod niyeti uygulanmıyor ve erişilebilir kontrol yok|1 / 2 / 4|
|AUD-012|P2|Köşe kol ölçüsü niyetten farklı bir değere sessiz yükseltiliyor|1 / 2.4|
|AUD-013|P2|Kolların kalınlığı farklıysa paylaşımlı köşe B kalınlığıyla uyumsuz kalıyor|1 / 2.4 / 5|
|AUD-014|P3|3D Eşyalar genel anahtarı servis nişi eşyalarını gizlemiyor|3|
|AUD-015|P2|Gerçek ölçülü eşya önizlemeleri dar hücreye sığdırılarak küçültülüyor|3 / 4|
|AUD-016|P2|B kolu modül çiziminde arkalık rafları örtebiliyor|5|
|AUD-017|P2|Profesyonel üretim paftasında bilinen kapak ve birleşim ayrıntıları eksik|5|
|AUD-018|P2|Ayarlı raflar için 32 mm sistem adımı uygulanmamış|2 / 2.4|
|AUD-019|P2|Ortak validationConfig yok; askı derinliği eşiği plandan farklı|2 / 4|
|AUD-020|P2|Sunum ve eşya altyapısında zorunlu teknik kapsam tam uygulanmamış|3|
|AUD-021|P2|A/B tablosunda kol ve dış ölçü farkları bulunmuyor|5|
|AUD-022|P2|Stüdyo raf alanı özeti ile A/B raf alanı farklı tanımlar kullanıyor|1 / 4 / 5|
|AUD-023|P2|Kısmi/tam çekmece kızak seçimi yerine sabit %82 hareket var|2 / 2.4 / 5|
|AUD-024|P3|A3 paftalarda gereksiz boşluk ve tekrarlanan özel parça sayfaları var|5|
|AUD-025|P2|Servis nişinde kancalı eşyanın kaldırma payı temsil edilmiyor|2 / 4|
|AUD-026|EXTERNAL|Gerçek menteşe, ray, taşıma ve elektrik donanımı katalog doğrulaması gerektiriyor|3 / 4 / 5|
|AUD-027|EXTERNAL|Bitmiş nominal geometri ham kesim ve kesin birleşim emri değildir|5|
|AUD-028|EXTERNAL|Yerinde ölçü, montaj boşluğu ve fiziksel A3 baskı onayı bekliyor|3 / 4 / 5|
|AUD-029|P3|İki teknik mimari kararı sözleşmedeki biçimde uygulanmamış|1 / 2|
|AUD-030|P2|Gövde malzemesi seçimi bağımsız raf malzemesini de eziyor|3|

Aşağıdaki her kayıt aynı anda birden çok örnekte görülebilir; tekrarlar yeni hata olarak sayılmadı. EXTERNAL maddeler yazılım kusuru sayısına katılmadı.

### AUD-001 — P1 — Geç IndexedDB geri yüklemesi yeni çalışma kopyasını ezebiliyor

Aşama: 1 / 2.1 / 5. Gereksinim: Ana §8, Aşama 1 kabul 4; Ek H.

Dosyalar: [src/store/useWardrobeStore.ts:2292](C:/dev/Wardrobe-Studio/src/store/useWardrobeStore.ts:2292), [src/store/useWardrobeStore.ts:393](C:/dev/Wardrobe-Studio/src/store/useWardrobeStore.ts:393).

**Yeniden üretme:** Senkron localStorage kaydı olmayan başlangıçta IndexedDB okumasını geciktir. Okuma sürerken yeni geçerli JSON içe aktar; ardından eski okumanın dönmesine izin ver.

**Beklenen:** Geri yükleme başlangıcından sonra yapılan kullanıcı işlemi korunmalı; geç okuma yeni revizyonu değiştirmemeli.

**Gerçek:** Aktif ad önce ‘Yeni çalışma — geç gelen kayıt ezmemeli’, sonra ‘Eski IndexedDB kaydı’; geçmiş 0. Simülasyon yalnız bellekte çalıştı. Kalıcı ve geri alınamaz veri kaybı ayrıca kanıtlanmadı; aktif çalışma ve geçmişin beklenmedik değişmesi kanıtlandı.

**Kanıt:** persistence-race.json: lateReadOverwritesCurrentDesign=true; persistence-review.mjs

**Önerilen düzeltme/doğrulama:** Ana oturuma başlangıç revizyonu/tek seferlik hydration koruması ekle; geç okuma kullanıcı değişikliğine uygulanmasın. Arşivdeki benzer koruma örnek alınabilir.

**Kalıcı regresyon/kabul önerisi:** Gecikmiş IDB okuması sırasında import, yeni proje, Undo ve checkpoint senaryoları.

### AUD-002 — P1 — Genel JSON kabulü ve çözücü küresel tasarım invariantlarını aynı yerde doğrulamıyor

Aşama: 1 / 5. Gereksinim: Ana §3.3, §8, §9.1; Ek O, Z.3.

Dosyalar: [src/core/schema/designSchema.ts:363](C:/dev/Wardrobe-Studio/src/core/schema/designSchema.ts:363), [src/core/versions/designExchange.ts:15](C:/dev/Wardrobe-Studio/src/core/versions/designExchange.ts:15), [src/core/solver/carcassSolver.ts:230](C:/dev/Wardrobe-Studio/src/core/solver/carcassSolver.ts:230).

**Yeniden üretme:** case-L-without-junction.json içindeki design nesnesini AI önizlemesine ver. Ayrıca case-duplicate-axis ve case-unsupported-drawer-front içindeki design nesnelerini genel import yoluna ver. priorityRunId değerini mevcut olmayan bir kimlik yap.

**Beklenen:** L için A+B ve uygun tek birleşim, geçerli öncelik referansı ve desteklenen front türleri tüm girişlerde aynı kuralla denetlenmeli.

**Gerçek:** Birleşimsiz L, AI önizlemesinde de kabul ediliyor; iki kol köşede üst üste yerleşirken kritik hata yok. Yalnız B eksenli düz tasarım genel normalizer tarafından kabul ediliyor, çözücü 0 parça ve review döndürüyor. Bağımsız drawerFront genel yolda kabul edilip menteşeli olarak çözülüyor. Son iki örneği AI yolu ayrıca reddediyor. priorityRunId üyeliği denetlenmiyor.

**Kanıt:** case-L-without-junction.json; case-duplicate-axis.json; case-unsupported-drawer-front.json; case-invalid-priority.json; independent-results.json: validation-gap:*

**Önerilen düzeltme/doğrulama:** Mevcut Zod sonrasına tek ortak grafik/özellik doğrulaması koy; genel import, AI, sürüm açma ve çözücü sınırı bunu kullansın. Statik gövde kesişmelerini de üretim kapısına bağla.

**Kalıcı regresyon/kabul önerisi:** L birleşimi yok/çoklu/yanlış eksen, geçersiz öncelik, 0 parça, desteklenmeyen front için tüm giriş yolları aynı ret sonucunu vermeli.

### AUD-003 — P1 — Takı çekmecesi bölücülerinin kesimleri ile yerleşimleri birbirine uymuyor

Aşama: 4 / 5. Gereksinim: Ana §6.3; Ek Z.2.F, Z.2.I.

Dosyalar: [src/core/solver/carcassSolver.ts:2190](C:/dev/Wardrobe-Studio/src/core/solver/carcassSolver.ts:2190), [src/core/production/productionModel.ts:59](C:/dev/Wardrobe-Studio/src/core/production/productionModel.ts:59).

**Yeniden üretme:** Dört üretim örneğini çöz. Aynı çekmecenin boyuna ve enine organizer kutularının üç eksendeki örtüşmesini bağımsız hesapla.

**Beklenen:** Ayrı parçalar, tarifli bir geçme/çentik olmadığı sürece birbirini fiziksel olarak kesmemeli; kesimler yerleşimle kapanmalı.

**Gerçek:** Düz ve beşgende 3×70×8 ve 1×70×8 mm; körde 2×70×8 mm; asimetrikte 1×70×4 mm kesişmeler var. Enine parçalar kalınlık düşülerek kesiliyor, boyuna merkezler bu kesimlere göre yerleşmiyor. Çentik/bindirme birleşimi tanımlı değil. Bu ortak hata tüm çıktılara taşınıyor.

**Kanıt:** independent-results.json: dört organizers-do-not-intersect kaydı; *-resolved.json; examples-audit.json

**Önerilen düzeltme/doğrulama:** Organizer aralıklarını gerçek kalınlıklarla tek tamsayı dağıtımı üzerinden türet; kesim ve merkezleri aynı sınır çiftinden hesapla. Geçme amaçlanıyorsa birleşimi ayrıca tanımla ve belgele.

**Kalıcı regresyon/kabul önerisi:** Farklı iç genişlik ve 3/4/8/18 mm bölücülerde tüm organizer çiftleri için hacim kesişmesi ve toplam aralık kapanışı.

### AUD-004 — P1 — Z yönünde ‘Ön cephe sabit’ küçültme ön cepheyi taşıyor

Aşama: 2.3 / 2.4. Gereksinim: Ek N, O, U.

Dosyalar: [src/core/solver/treeMutator.ts:1694](C:/dev/Wardrobe-Studio/src/core/solver/treeMutator.ts:1694), [src/core/solver/treeMutator.ts:1768](C:/dev/Wardrobe-Studio/src/core/solver/treeMutator.ts:1768).

**Yeniden üretme:** 600 mm dış / 592 mm net derinlikli hücrede Z → Arka yönünü seçip neti 500 mm yap; taslağı uygula.

**Beklenen:** Etiketteki 600 mm ön cephe korunmalı veya mevcut şemayla bu hareket desteklenmiyorsa açıkça reddedilmeli.

**Gerçek:** Taslak ‘Ön Cephe Sabit (600 mm)’ diyor; uygulama run.depthMm=508 yapıyor ve ön cephe 508 mm oluyor. Arka başlangıç 0 kalıyor; iki yön aynı küçülmeyi üretiyor.

**Kanıt:** independent-results.json: Z-back-anchor

**Önerilen düzeltme/doğrulama:** Mevcut duvar başlangıcına bağlı şemada desteklenmeyen arka yönde küçültmeyi açıklamayla kapat veya açık arka ofset niyeti tasarla; etiket ve hareketi aynı sınır modelinden üret.

**Kalıcı regresyon/kabul önerisi:** Her yön için hem büyütme hem küçültmede sabit sınırın önce/sonra eşitliği; A ve B kolu.

### AUD-005 — P2 — Kalın tabanlı küçük çekmecede net yükseklik fazla bildiriliyor

Aşama: 2.4 / 4 / 5. Gereksinim: Ek P, X, Z.2.F.

Dosyalar: [src/core/solver/carcassSolver.ts:2111](C:/dev/Wardrobe-Studio/src/core/solver/carcassSolver.ts:2111).

**Yeniden üretme:** 248 mm yüksek drawerBank aralığını 3 çekmeceye böl; ince panel/taban kalınlığını 18 mm yap.

**Beklenen:** Net yükseklik yan kasa yüksekliğinden gerçek taban kalınlığı çıkarılarak bulunmalı.

**Gerçek:** 80 mm ön, 50 mm yan kasa ve 18 mm tabanda fiziksel net 32 mm; innerHeightMm alt sınırı nedeniyle 36 mm yazılıyor. Üç çekmecede de kritik hata yok. Hacim ve net aralık tablosu fazla değer alabilir.

**Kanıt:** independent-results.json: drawer:small-front-thick-bottom-net-height

**Önerilen düzeltme/doğrulama:** Gerçek net ölçüyü kısıtlamayla büyütme; 32 mm olarak bildir veya gerekli minimuma uymayan tasarımı reddet.

**Kalıcı regresyon/kabul önerisi:** En küçük ön yüksekliği ve tüm taban kalınlıklarında dış kasa = taban + gerçek net yükseklik.

### AUD-006 — P2 — Oda tavanından yüksek dolap üretim uyarısına girmiyor

Aşama: 1 / 3 / 4 / 5. Gereksinim: Ana §5.1, §6.3; Ek Y.2, Z.2.I.

Dosyalar: [src/core/schema/designSchema.ts:269](C:/dev/Wardrobe-Studio/src/core/schema/designSchema.ts:269), [src/core/solver/carcassSolver.ts:149](C:/dev/Wardrobe-Studio/src/core/solver/carcassSolver.ts:149).

**Yeniden üretme:** roomHeightMm=1800 ve run.heightMm=3000 olan case-above-ceiling.json design nesnesini önizle.

**Beklenen:** Oda sınırıyla açık geometrik uyumsuzluk gösterilmeli ve üretim kapısı bu durumu işlemeli.

**Gerçek:** Normalizasyon ve AI önizlemesi kabul ediyor; issues boş, üretim review. Kullanıcıya tavanla 1200 mm çakışma bildirilmiyor.

**Kanıt:** case-above-ceiling.json; independent-results.json: validation-gap:above-ceiling

**Önerilen düzeltme/doğrulama:** Oda yüksekliği–gövde/üst bitiş–montaj boşluğu çapraz kontrolünü ortak doğrulamaya ekle; yerinde toleransı ayrıca uzman maddesi olarak tut.

**Kalıcı regresyon/kabul önerisi:** Tavan altı/sınırda/üstünde ve farklı üst bitişlerde beklenen uyarı/ret.

### AUD-007 — P2 — localStorage yazma hatası çalışan IndexedDB yedeğini de atlıyor

Aşama: 1 / 2.1. Gereksinim: Ana §8; Ek H.

Dosyalar: [src/store/useWardrobeStore.ts:393](C:/dev/Wardrobe-Studio/src/store/useWardrobeStore.ts:393).

**Yeniden üretme:** İzole bellek denetiminde localStorage.setItem için kota hatası üret; IDB set işlevini çalışır bırak; yeni tasarımı kaydet.

**Beklenen:** İki depolama yolu bağımsız denenmeli; birinin arızası diğerini engellememeli.

**Gerçek:** Tek try bloğunda localStorage hatasından sonra idbSet çağrılmıyor. Durum error olarak gösteriliyor; IDB eski tasarımda kalıyor. Hata kullanıcıdan saklanmıyor.

**Kanıt:** persistence-race.json: localStorageFailure.idbFallbackWritten=false

**Önerilen düzeltme/doğrulama:** Depolama sonuçlarını ayrı yakala; en az bir başarılı kalıcı kopyayı ve kısmi arıza durumunu doğru raporla.

**Kalıcı regresyon/kabul önerisi:** LS bozuk/IDB iyi, LS iyi/IDB bozuk, ikisi bozuk; yeni kayıt ve geçmişin korunması.

### AUD-008 — P2 — 600 mm üzeri çift ve bağımsız menteşeli kanatlarda genişlik uyarısı yok

Aşama: 2 / 5. Gereksinim: Ana §6.3; Ek Z.2.E, Z.2.I.

Dosyalar: [src/core/solver/carcassSolver.ts:1137](C:/dev/Wardrobe-Studio/src/core/solver/carcassSolver.ts:1137), [src/core/solver/carcassSolver.ts:725](C:/dev/Wardrobe-Studio/src/core/solver/carcassSolver.ts:725).

**Yeniden üretme:** Beşgen örnekte B1 çift kapağı, kör örnekte B1 ve üst kapakları kontrol et.

**Beklenen:** Otomatik/özel ve tek/çift seçimine bakılmadan her gerçek menteşeli kanat genişliği denetlenmeli.

**Gerçek:** 841×2276×18, 843×2276×25 ve 951/952×2276×18 mm kanatlar için DOOR_LEAF_TOO_WIDE yok. Mevcut kontrol yalnız otomatik türetimin tek kapak dalında. 25 mm genel ağırlık uyarısı var; kanat genişliği/yük hesabının yerini tutmuyor. Bu kapaklar otomatik olarak imkânsız sayılmadı.

**Kanıt:** examples-audit.json: wideDoors; independent-results.json: *:wide-hinge-warning

**Önerilen düzeltme/doğrulama:** Kanat listesini oluşturan ortak noktada gerçek en/boy/kalınlık üzerinden uyarı üret; menteşe kapasitesini katalog doğrulamasına bırak.

**Kalıcı regresyon/kabul önerisi:** Tek/çift/özel/köşe ve 599/600/601 mm gerçek kanat sınırları.

### AUD-009 — P2 — Tek sayılı sağ kapaklarda animasyon ile üretim merkezi 1 mm ayrılıyor

Aşama: 2 / 5. Gereksinim: Ek A, F, Z.3.

Dosyalar: [src/core/solver/carcassSolver.ts:754](C:/dev/Wardrobe-Studio/src/core/solver/carcassSolver.ts:754), [src/canvas/wardrobe/WardrobeMeshGroup.tsx:749](C:/dev/Wardrobe-Studio/src/canvas/wardrobe/WardrobeMeshGroup.tsx:749).

**Yeniden üretme:** Beşgen/asimetrik örnekte kapalı sağ kanadın pivot + döndürülmüş leafCenterOffset değerini statik panel merkeziyle karşılaştır.

**Beklenen:** Kapalı hareketli panel, kesim/teknik çizim paneliyle aynı koordinatta olmalı.

**Gerçek:** Beşgen üst sağ kapak X=2718 yerine animasyonda 2717; B1 sağ kapak Z=2158 yerine 2157. Asimetrikte aynı tür 1 mm fark var. Kesim genişliği doğru; yerleşim ve hareket zarfı tutarsız.

**Kanıt:** independent-results.json: diagonal/asymmetric:hinged-render-vs-production-center

**Önerilen düzeltme/doğrulama:** Pivot ve merkezleri aynı uç sınırlardan türet; tek sayıda yarım mm türetilmiş merkezi iki kez farklı yuvarlama.

**Kalıcı regresyon/kabul önerisi:** Tek/çift mm kanatlarda A/B, sol/sağ ve kapalı poz eşitliği.

### AUD-010 — P2 — Kısa/orta/uzun askı türü niyeti kullanılmıyor

Aşama: 2 / 4. Gereksinim: Ana §2 iç modüller, §9 Aşama 2; Ek K.

Dosyalar: [src/core/schema/types.ts:89](C:/dev/Wardrobe-Studio/src/core/schema/types.ts:89), [src/core/solver/carcassSolver.ts:1959](C:/dev/Wardrobe-Studio/src/core/solver/carcassSolver.ts:1959), [src/App.tsx:2613](C:/dev/Wardrobe-Studio/src/App.tsx:2613).

**Yeniden üretme:** Aynı hücrede rodHeightType=short, medium, long seçeneklerini sırayla çöz.

**Beklenen:** Sunulan kısa/orta/uzun seçiminin giysi yüksekliği, sığma veya yerleşimde tanımlı etkisi olmalı. Aynı hücrede borunun mutlaka üç farklı yüksekliğe gitmesi tek başına zorunlu değildir.

**Gerçek:** Üç seçimde de boru Y=2272 mm; daha önemlisi rodHeightType alanı geometri, eşya önizlemesi ve kapasite/ergonomi kodunda okunmuyor. UI niyeti kaydediyor ama kullanım farkı üretmiyor. Açık rodHeightMm ve boru indirme Quick-Fix çalışıyor.

**Kanıt:** independent-results.json: rod:preset-types-consumed; alan kullanım taraması

**Önerilen düzeltme/doğrulama:** Türlerin anlamını netleştirip mevcut boru yerleşimine bağla; seçimin etkisini kullanıcıya göster.

**Kalıcı regresyon/kabul önerisi:** Kısa/orta/uzun seçiminin kararlaştırılan giysi/sığma semantiği; yalnız yükseklik farklılığını zorlayan test yazılmamalı.

### AUD-011 — P2 — Beşgen köşedeki hasHangingRod niyeti uygulanmıyor ve erişilebilir kontrol yok

Aşama: 1 / 2 / 4. Gereksinim: Ana §6.1.2; Ek I.

Dosyalar: [src/core/schema/types.ts:187](C:/dev/Wardrobe-Studio/src/core/schema/types.ts:187), [src/core/solver/cornerSolver.ts:186](C:/dev/Wardrobe-Studio/src/core/solver/cornerSolver.ts:186).

**Yeniden üretme:** Beşgen junction.hasHangingRod=true yap; köşe panellerini ve kapasiteyi incele.

**Beklenen:** Ana planın köşe askı alanı seçeneği kullanıcının erişebildiği, çözülen bir seçenek olmalı.

**Gerçek:** Alan JSON'da kalıyor fakat köşe borusu üretilmiyor; köşe yalnız raflarla çözülüyor. hasHangingRod için UI kontrolü bulunmadı.

**Kanıt:** independent-results.json: corner-rod; cornerSolver kaynak incelemesi

**Önerilen düzeltme/doğrulama:** Köşe askı seçeneğini mevcut çözücü/UI/kapasite yoluna tamamla; raflarla birlikte kullanım ve erişim kurallarını tanımla.

**Kalıcı regresyon/kabul önerisi:** true/false geometri, üretim donanımı, kapasite ve JSON geri yükleme farkı.

### AUD-012 — P2 — Köşe kol ölçüsü niyetten farklı bir değere sessiz yükseltiliyor

Aşama: 1 / 2.4. Gereksinim: Ana §3.3; Ek G, O, U.

Dosyalar: [src/core/solver/cornerSolver.ts:65](C:/dev/Wardrobe-Studio/src/core/solver/cornerSolver.ts:65).

**Yeniden üretme:** B derinliği 1000 mm iken diagonalArmAMm=600 yap.

**Beklenen:** Geçersiz istek açıkça reddedilmeli veya 1150 mm uyarlama ayrı bir öneri/onayla niyete yansıtılmalı.

**Gerçek:** Design 600 saklıyor; çözülmüş A tüketimi max(1000+150, 600)=1150. Dar açıklık uyarısı var fakat istenen ölçünün değiştirildiğini söyleyen uyarı yok.

**Kanıt:** independent-results.json: corner-arm-clamp

**Önerilen düzeltme/doğrulama:** Alt sınırı ortak doğrulamada açıkça işle; ölçü etiketlerinin farklı kaynak değerleri göstermesine izin verme.

**Kalıcı regresyon/kabul önerisi:** Eşik altı/sınır/üstü köşe kolu; UI, JSON ve teknik ölçü tutarlılığı.

### AUD-013 — P2 — Kolların kalınlığı farklıysa paylaşımlı köşe B kalınlığıyla uyumsuz kalıyor

Aşama: 1 / 2.4 / 5. Gereksinim: Ana §3.3; Ek X, Z.3.

Dosyalar: [src/core/solver/cornerSolver.ts:48](C:/dev/Wardrobe-Studio/src/core/solver/cornerSolver.ts:48), [src/core/solver/cornerSolver.ts:125](C:/dev/Wardrobe-Studio/src/core/solver/cornerSolver.ts:125).

**Yeniden üretme:** Paylaşımlı asimetrik L'de A=18/8, B=25/4 bırak; B'ye ait köşe dikmesi ve arkalığı kontrol et.

**Beklenen:** Desteklenen per-run kalınlıklarla köşe sınırı uyumlu çözülmeli veya bu kombinasyon açıkça desteklenmiyor denmeli.

**Gerçek:** B'nin normal parçaları 25/4; B kimlikli ortak köşe dikmesi/arkalığı A'dan alınan 18/8. Köşe net sınırları da A kalınlığıyla hesaplanıyor; özel uyumsuzluk kontrolü yok. Global UI iki kolu birlikte değiştiriyor; risk farklı kalınlıklı JSON'da.

**Kanıt:** independent-results.json: mixed-corner-thickness

**Önerilen düzeltme/doğrulama:** Köşenin kalınlık sahipliğini netleştir; farklı değerleri ortak dikme sınırlarında doğru ele al veya ortak doğrulamada reddet.

**Kalıcı regresyon/kabul önerisi:** A/B eşit ve farklı kalınlıklar, shared/separate; paylaşılan fiziksel sınır ve BOM kalınlık eşitliği.

### AUD-014 — P3 — 3D Eşyalar genel anahtarı servis nişi eşyalarını gizlemiyor

Aşama: 3. Gereksinim: Ana §5.1, §9 Aşama 3.

Dosyalar: [src/canvas/wardrobe/WardrobeItemsPreview.tsx:102](C:/dev/Wardrobe-Studio/src/canvas/wardrobe/WardrobeItemsPreview.tsx:102).

**Yeniden üretme:** Servis nişine merdiven ata; interiorItems.enabled=false yap.

**Beklenen:** Genel göster/gizle tüm eşya önizlemelerine uygulanmalı.

**Gerçek:** Servis nişi dalı enabled kontrolünden önce dönüyor; disabled durumunda merdivenin 5 mesh'i üretiliyor. Servis eşyalarının ayrı showServiceItems anahtarı çalışıyor.

**Kanıt:** independent-results.json: items:global-hide-includes-service; saf React öğe ağacı denetimi, gerçek tarayıcı deneyi değildir

**Önerilen düzeltme/doğrulama:** Genel enabled koşulunu servis dalına da uygula; ayrı niş anahtarının genel anahtarla ilişkisini koru.

**Kalıcı regresyon/kabul önerisi:** Genel/niş anahtarının dört kombinasyonu.

### AUD-015 — P2 — Gerçek ölçülü eşya önizlemeleri dar hücreye sığdırılarak küçültülüyor

Aşama: 3 / 4. Gereksinim: Ana §4.1, §9 Aşama 3.

Dosyalar: [src/canvas/wardrobe/WardrobeItemsPreview.tsx:202](C:/dev/Wardrobe-Studio/src/canvas/wardrobe/WardrobeItemsPreview.tsx:202).

**Yeniden üretme:** 1100 mm yüksek gövdede 944 mm net askı hücresine longDresses önizlemesi ata.

**Beklenen:** Nominal gerçek boy korunmalı; sığmayan eşya taşma/uygunsuzluk olarak gösterilmeli.

**Gerçek:** 1220 mm nominal gövde boyu hücreye göre Math.min ile yaklaşık 733–769 mm çiziliyor. Çanta/kutu/valizde de sığdırma var. Sığma uyarısı mevcut ve envanter gerçek ölçüyle hesaplanıyor; kapasite hatası olarak sınıflandırılmadı.

**Kanıt:** independent-results.json: items:long-garment-keeps-physical-length

**Önerilen düzeltme/doğrulama:** Görsel nominal ölçüyü koru; taşan eşyayı açık uyarı/yerleşim temsiliyle göster. Kapasite algoritmasından bağımsız mevcut doğru ölçü yolunu koru.

**Kalıcı regresyon/kabul önerisi:** Dar/yeterli hücrede kıyafet, valiz, kutu boyutlarının değişmemesi; raycast güvenliği.

### AUD-016 — P2 — B kolu modül çiziminde arkalık rafları örtebiliyor

Aşama: 5. Gereksinim: Ek Z.2.B.

Dosyalar: [src/core/production/technicalSheets.ts:54](C:/dev/Wardrobe-Studio/src/core/production/technicalSheets.ts:54).

**Yeniden üretme:** Beşgen veya asimetrik PDF'nin 17. sayfası 06-MOD-bay-B1'i aç.

**Beklenen:** İç modül paftası dört rafı ve beş aralığı görünür çizmelidir.

**Gerçek:** Metin beş aralığı listeliyor; çizim boş kapalı dikdörtgen gibi. projected tüm görünümleri dünya Z merkezine göre sıralıyor; B bakışında arkalık öne boyanabiliyor. Kesim tablosunda raflar mevcut.

**Kanıt:** pdf-detail-diagonal-17.png; pdf-contact-asymmetric-2.jpg; ilgili PDF s.17

**Önerilen düzeltme/doğrulama:** Her izdüşüm için bakış derinliğiyle sıralama veya iç görünüşte arkalığı çizgi/saydam gösterme kullan.

**Kalıcı regresyon/kabul önerisi:** A ve B iç modül çizimlerinde rafların görünürlüğü; çift/tek mm genişlikler.

### AUD-017 — P2 — Profesyonel üretim paftasında bilinen kapak ve birleşim ayrıntıları eksik

Aşama: 5. Gereksinim: Ek Z.1, Z.2.B, D, E, H, I.

Dosyalar: [src/core/production/productionModel.ts:77](C:/dev/Wardrobe-Studio/src/core/production/productionModel.ts:77), [src/core/production/technicalSheets.ts:97](C:/dev/Wardrobe-Studio/src/core/production/technicalSheets.ts:97).

**Yeniden üretme:** Kapak kesim satırını, donanım satırını, beşgen açı tablosunu ve montaj notlarını birlikte incele.

**Beklenen:** Kesim kodu üzerinden kapak açılım yönü, konumu/payları ve mevcut çözülmüş kulp koordinatları izlenebilmeli; köşe dış/imalat açıları ve birleşim tarifi açık olmalı.

**Gerçek:** En/boy/kalınlık ve menteşe yönü/açısı ayrı donanım satırında var; kesin kulp konumu/yerel koordinatı, kapak başına pay eşleştirmesi ve poligon dış açıları yok. Birleştirilmiş aksonometri ve 8 genel not var; patlatılmış parça/bağlantı detayı yok. Mevcut bilgiler nominal planlama için yararlı, Z'nin eksiksiz atölye tarifi düzeyine ulaşmıyor.

**Kanıt:** Dört report.html ve PDF; pdf-detail-diagonal-22.png; pdf-detail-asymmetric-39.png; productionModel notes/hardware

**Önerilen düzeltme/doğrulama:** Önce çözücüde zaten bulunan yön/konum/payları parça koduna bağla. Birleşim yöntemi seçildikten sonra ona özel montaj detayı üret; katalog deliği uydurma.

**Kalıcı regresyon/kabul önerisi:** Bir kapak ve poligon kodundan tüm yerleşim/imalat alanlarının izlenmesi; belge alanlarının eksiksizlik kontrolü.

### AUD-018 — P2 — Ayarlı raflar için 32 mm sistem adımı uygulanmamış

Aşama: 2 / 2.4. Gereksinim: Ana §5.2.

Dosyalar: [src/core/schema/types.ts:88](C:/dev/Wardrobe-Studio/src/core/schema/types.ts:88), [src/core/solver/treeMutator.ts:1375](C:/dev/Wardrobe-Studio/src/core/solver/treeMutator.ts:1375).

**Yeniden üretme:** adjustable=true raf grubunu sayısal yükseklik düzenlemesiyle değiştir; şema, UI ve mutator'da delik ızgarası/32 mm adımını ara.

**Beklenen:** Ayarlı raf hareketi sözleşmedeki 32 mm sistem adımıyla ve datumuyla temsil edilmeli.

**Gerçek:** adjustable bilgisi ve dört pim/raf donanım tahmini var; 32 mm sistem datum/adım alanı veya uygulaması yok. Ölçüler serbest tamsayı mm.

**Kanıt:** Kaynak taraması; phase5-production.test.ts raf pimi testi yalnız adet doğruluyor

**Önerilen düzeltme/doğrulama:** Sabit ve ayarlı rafı davranışta ayır; seçilen donanım sistemine göre delik datumunu/adımını tanımla, kesin delik çapını katalogla bırak.

**Kalıcı regresyon/kabul önerisi:** 32 mm geçerli adım/sınır değerleri; sabit rafta 1 mm hassasiyet korunmalı.

### AUD-019 — P2 — Ortak validationConfig yok; askı derinliği eşiği plandan farklı

Aşama: 2 / 4. Gereksinim: Ana §6.3.

Dosyalar: [src/core/solver/carcassSolver.ts:2015](C:/dev/Wardrobe-Studio/src/core/solver/carcassSolver.ts:2015), [src/core/schema/types.ts:298](C:/dev/Wardrobe-Studio/src/core/schema/types.ts:298).

**Yeniden üretme:** Kodda validationConfig alanını ara; 525 mm net askı derinliğini kontrol et.

**Beklenen:** Eşikler tek yapılandırmada bulunmalı; onaylı planın <530 mm askı uyarısı uygulanmalı.

**Gerçek:** 600/850/520 gibi eşikler dağınık sabitler. Askı uyarısı <520 mm; 520–529 mm arası plandaki uyarıyı alamıyor. Ergonomi kişisel eşikleri ayrıca ayarlanabiliyor.

**Kanıt:** carcassSolver.ts:2015; kaynak taraması; ana plan §6.3 ile karşılaştırma

**Önerilen düzeltme/doğrulama:** Mevcut eşikleri küçük ortak yapılandırmada topla; 530/520 kararını kullanıcı sözleşmesine göre tutarlı yap ve UI/PDF'de aynı kaynağı kullan.

**Kalıcı regresyon/kabul önerisi:** Her eşiğin hemen altı/üzeri; 519/520/525/529/530 mm askı net derinliği.

### AUD-020 — P2 — Sunum ve eşya altyapısında zorunlu teknik kapsam tam uygulanmamış

Aşama: 3. Gereksinim: Ana §3.1, §7, §9 Aşama 3; Ek §6.

Dosyalar: [src/canvas/scene/WardrobeCanvas.tsx:664](C:/dev/Wardrobe-Studio/src/canvas/scene/WardrobeCanvas.tsx:664), [src/canvas/wardrobe/WardrobeItemsPreview.tsx:99](C:/dev/Wardrobe-Studio/src/canvas/wardrobe/WardrobeItemsPreview.tsx:99), [src/canvas/wardrobe/WardrobeMeshGroup.tsx:402](C:/dev/Wardrobe-Studio/src/canvas/wardrobe/WardrobeMeshGroup.tsx:402), [package.json:1](C:/dev/Wardrobe-Studio/package.json:1).

**Yeniden üretme:** Bağımlılıkları ve sahne ağacını incele; LED temsilci ışık gruplamasını karşılaştır.

**Beklenen:** Sözleşmedeki N8AO, InstancedMesh ve kol başına en fazla bir iç ışık yaklaşımı uygulanmış veya kapsam değişikliği ayrıca kabul edilmiş olmalı.

**Gerçek:** IBL, ContactShadows, emissive LED ve Sunum düğmesi çalışıyor. N8AO/postprocessing ve InstancedMesh yok; her eşya ayrı mesh'ler. Nokta ışığı kol yerine bölme/köşe başına seçilip toplam 8'e kesiliyor. Önceki raporların teknik tercih açıklaması tek başına zorunlu kapsamı kaldırmıyor. FPS/kare süresi bu denetimde ölçülmedi; yavaşlık kanıtı değildir.

**Kanıt:** package.json; WardrobeCanvas/ItemsPreview/MeshGroup kaynak incelemesi; browser-material-led.jpg

**Önerilen düzeltme/doğrulama:** Mevcut sahneyi hedefli tamamla; önce hedef cihazda küçük performans ölçümü yap, sonra AO/instance/ışık bütçesini sözleşmeyle uyumlu kesinleştir. Sıfırdan sahne yazma.

**Kalıcı regresyon/kabul önerisi:** Görsel mod karşılaştırması, ışık sayısı invariantı ve kullanıcı cihazında animasyon sırasında kare süresi.

### AUD-021 — P2 — A/B tablosunda kol ve dış ölçü farkları bulunmuyor

Aşama: 5. Gereksinim: Ana §2, §9 Aşama 5 kapasite/envanter/ölçü fark tablosu.

Dosyalar: [src/core/versions/designExchange.ts:51](C:/dev/Wardrobe-Studio/src/core/versions/designExchange.ts:51), [src/ui/VersionPanel.tsx:14](C:/dev/Wardrobe-Studio/src/ui/VersionPanel.tsx:14).

**Yeniden üretme:** Uzunluğu/derinliği/yüksekliği farklı iki sürümü karşılaştır; 11 metrik satırını incele.

**Beklenen:** Kapasitenin yanında dış ölçüler ve A/B kol ölçü farkları açık tablo satırlarıyla karşılaştırılmalı.

**Gerçek:** Parça, alan, askı, hacim, kapak, çekmece, uyarı ve toplam envanter eksiği var. Kol uzunluk/derinlik/yükseklik farkı satırları yok; küçük SVG önizlemesindeki metin fark tablosu yerine geçmiyor.

**Kanıt:** browser-comparison.jpg; browser-evidence.json; DesignMetrics arayüzü

**Önerilen düzeltme/doğrulama:** Mevcut metrik tablosuna boyutlu A/B kol satırları ekle; bulunmayan kola açık değer göster. Ayrıntılı kişi/envanter farkı ayrıca yararlı iyileştirmedir.

**Kalıcı regresyon/kabul önerisi:** Düz↔L, eşit↔asimetrik kollar, yalnız yükseklik değişimi karşılaştırması.

### AUD-022 — P2 — Stüdyo raf alanı özeti ile A/B raf alanı farklı tanımlar kullanıyor

Aşama: 1 / 4 / 5. Gereksinim: Ana §9 Aşama 4–5 kapasite tutarlılığı.

Dosyalar: [src/core/solver/carcassSolver.ts:268](C:/dev/Wardrobe-Studio/src/core/solver/carcassSolver.ts:268), [src/core/solver/carcassSolver.ts:1314](C:/dev/Wardrobe-Studio/src/core/solver/carcassSolver.ts:1314), [src/core/analysis/inventory.ts:101](C:/dev/Wardrobe-Studio/src/core/analysis/inventory.ts:101), [src/App.tsx:2813](C:/dev/Wardrobe-Studio/src/App.tsx:2813).

**Yeniden üretme:** Düz örneği aç; sağ özetin Toplam Raf Alanı değerini aynı tasarımın A/B Raf alanı değeriyle karşılaştır.

**Beklenen:** Aynı adla verilen kapasite tanımı aynı değeri üretmeli veya farkı açıkça adlandırılmalı.

**Gerçek:** Sağ özet 7.7 m², A/B yaklaşık 5.23 m². Eski özet ayrı eklemeler/köşede 0.72 yaklaşımı kullanıyor; A/B gerçek depolama alanlarından geliyor. Üretim levha alanı ayrı doğru metrik; bu bulgu onu geçersiz kılmıyor.

**Kanıt:** summary-metrics.json; browser-evidence.json; browser-comparison.jpg; browser-final.jpg

**Önerilen düzeltme/doğrulama:** Tek kapasite tanımı kullan veya fiziksel raf yüzeyi/erişilebilir net depolama alanını ayrı, açıklamalı adlarla göster; köşede yaklaşık katsayıyı kaldır.

**Kalıcı regresyon/kabul önerisi:** Aynı tasarımda sağ özet, envanter ve A/B ortak metrikleri eşleşmeli; poligon alanı bağımsız doğrulanmalı.

### AUD-023 — P2 — Kısmi/tam çekmece kızak seçimi yerine sabit %82 hareket var

Aşama: 2 / 2.4 / 5. Gereksinim: Ana §4.3; Ek B, P.

Dosyalar: [src/core/solver/carcassSolver.ts:2080](C:/dev/Wardrobe-Studio/src/core/solver/carcassSolver.ts:2080), [src/core/schema/types.ts:85](C:/dev/Wardrobe-Studio/src/core/schema/types.ts:85).

**Yeniden üretme:** Çekmece parametreleri ve maxSlideMm üretimini incele; kısmi/tam çekme seçeneğini ara.

**Beklenen:** Onaylı 0.80 kısmi veya 1.0 tam çekmeli ray tipine göre hareket sınırı türetilmeli.

**Gerçek:** maxSlideMm=Math.round(drawerDepth*0.82); ray tipi/çıkma oranı şemada ve UI'de yok. Hareket sınırı uygulanıyor ama kullanıcının zorunlu mekanik seçimi bulunmuyor.

**Kanıt:** carcassSolver.ts:2080; examples-audit.json drawer travel; schema/UI incelemesi

**Önerilen düzeltme/doğrulama:** Küçük bir kalıcı kızak/çıkma niyeti ekleyip çözücü, hareket ve belgeye bağla; gerçek ürün paylarını katalog doğrulamasında tut.

**Kalıcı regresyon/kabul önerisi:** A/B kolunda 0.80 ve 1.0 son hareketi, çarpışma ve JSON/Undo korunumu.

### AUD-024 — P3 — A3 paftalarda gereksiz boşluk ve tekrarlanan özel parça sayfaları var

Aşama: 5. Gereksinim: Ek Z; denetim §12 pratik PDF kalitesi.

Dosyalar: [src/core/production/technicalSheets.ts:70](C:/dev/Wardrobe-Studio/src/core/production/technicalSheets.ts:70), [src/core/production/technicalSheets.ts:117](C:/dev/Wardrobe-Studio/src/core/production/technicalSheets.ts:117).

**Yeniden üretme:** 39 sayfalık beşgen/asimetrik PDF'lerde aynı şekilli beş poligonun çizim ve koordinat sayfalarına, kısa aralık/malzeme tablolarına bak.

**Beklenen:** Kod izlenebilirliği korunarak A3 alanı ekonomik kullanılmalı.

**Gerçek:** Aynı geometri beş parça için çizim+koordinat olarak 10 sayfa. Çok kısa tablolar da tam A3 kullanıyor. Sayfa kaybı veya yanlış ölçü değildir; atölye dolaşımını ve yazdırma yükünü artırıyor.

**Kanıt:** pdf-contact-diagonal-2/3.jpg; pdf-contact-asymmetric-2/3.jpg

**Önerilen düzeltme/doğrulama:** Geometriyi tekrar kullanarak kod/adet eşleştirmesi ve çizim+koordinat birlikte yerleşim seçeneği sun; tam kesim listesini tekil koru.

**Kalıcı regresyon/kabul önerisi:** Tüm kodların bulunabilirliği ve okunabilir font korunarak sayfa ekonomisi görsel kontrolü.

### AUD-025 — P2 — Servis nişinde kancalı eşyanın kaldırma payı temsil edilmiyor

Aşama: 2 / 4. Gereksinim: Ana §6.2.1.

Dosyalar: [src/core/schema/types.ts:76](C:/dev/Wardrobe-Studio/src/core/schema/types.ts:76), [src/core/solver/carcassSolver.ts:2288](C:/dev/Wardrobe-Studio/src/core/solver/carcassSolver.ts:2288).

**Yeniden üretme:** ServiceItemSpec ve niş yüksekliği kontrolünü incele; asılı/kancalı eşya ile zeminde duran eşya ayrımını ara.

**Beklenen:** Kancadan çıkarmak için gerekli ek yükseklik kullanıcı niyetinde temsil edilip net yükseklikle karşılaştırılmalı.

**Gerçek:** Eşyada yalnız en/derinlik/boy var; kontrol maxItemHeightMm>bounds.heightMm. Kanca/askı biçimi ve kaldırma payı alanı veya kontrolü yok. Statik sığma, el payı ve menteşe çıkarılabilirlik kontrolü mevcut.

**Kanıt:** ServiceItemSpec; serviceNiche dalı kaynak incelemesi

**Önerilen düzeltme/doğrulama:** İsteğe bağlı asma/kaldırma payını dar kapsamla ekle ve niş yüksekliği uyarısına kat; gerçek çıkarma manevrasını uzman kontrolü olarak belirt.

**Kalıcı regresyon/kabul önerisi:** Zemindeki ve kancalı aynı eşya için farklı gerekli net yükseklik; sıfır ve pozitif kaldırma payı.

### AUD-026 — EXTERNAL — Gerçek menteşe, ray, taşıma ve elektrik donanımı katalog doğrulaması gerektiriyor

Aşama: 3 / 4 / 5. Gereksinim: Ana §6.3; Ek D, F, Z.2.I.

Dosyalar: [src/core/production/productionModel.ts:75](C:/dev/Wardrobe-Studio/src/core/production/productionModel.ts:75).

**Yeniden üretme:** Özellikle 841/843/952 mm kanatları, 1662 mm 18 mm rafları, 4 mm geniş çekmece tabanını ve LED donanım listesini üretici/ustayla incele.

**Beklenen:** Gerçek katalog ürünü, malzeme ağırlığı/yük, destek, ray kesiti/kesim düşümü ve LED elektrik boyutlandırması dışarıdan kesinleşmeli.

**Gerçek:** Menteşe adetleri yükseklik tahmini, raylar planlama zarfları, bağlantı/sürücü adetleri null. PDF bunu belirtiyor ve hiçbir örneğe fabrika üretim onayı vermiyor. Geniş raf uyarıları mevcut. Gerçek donanım onayı bu denetimde yapılmadı.

**Kanıt:** Dört production.json hardware; PDF donanım ve uyarı sayfaları

**Önerilen düzeltme/doğrulama:** Seçilen gerçek ürünlerin katalog/usta onayını tasarım sürümüne iliştir; onaysız delik/kapasite değeri üretme.

**Kalıcı regresyon/kabul önerisi:** Yazılım testi yerine katalog + marangoz/elektrikçi onay kaydı.

### AUD-027 — EXTERNAL — Bitmiş nominal geometri ham kesim ve kesin birleşim emri değildir

Aşama: 5. Gereksinim: Ek Z.1, Z.2.C, H, I.

Dosyalar: [src/core/production/productionModel.ts:44](C:/dev/Wardrobe-Studio/src/core/production/productionModel.ts:44), [src/core/production/productionModel.ts:110](C:/dev/Wardrobe-Studio/src/core/production/productionModel.ts:110).

**Yeniden üretme:** Bir raf, kapak, poligon ve çekmece tabanını ustayla seç; bantlı kenar/bant kalınlığı/kanal ve birleşim yöntemini belirle.

**Beklenen:** Ham kesim için görünür kenar, bant türü/kalınlığı, arkalık/taban montaj biçimi, bağlantı ve tolerans kararları kesinleşmeli.

**Gerçek:** E1–E4/V–E kenar referansları ve damar var; bant planı genel olarak usta onayı bekliyor. Ham kesim düşümü uygulanmıyor. Vida/minifix/kavela, kanal/zıvana ve testere/fire/nesting hesabı belirlenmemiş. Bu belirsizlik PDF'de açık; uyarı olması AUD-003 geometri hatasını ortadan kaldırmaz.

**Kanıt:** PDF s.1 ve son sayfalar; CSV banding/notes; production.json notes

**Önerilen düzeltme/doğrulama:** Atölyeyle bitmiş ölçü–ham kesim sözleşmesi ve birleşim yöntemini kesinleştir; ardından belgede ayrı alanlarla göster. CNC/nesting v2+ olarak kalır.

**Kalıcı regresyon/kabul önerisi:** Usta tarafından imalat yöntemi ve ölçü düşümleri onayı; örnek parça/çekmece montajı.

### AUD-028 — EXTERNAL — Yerinde ölçü, montaj boşluğu ve fiziksel A3 baskı onayı bekliyor

Aşama: 3 / 4 / 5. Gereksinim: Ana §6.3, §12; Ek Y, Z.2.I.

Dosyalar: [src/core/production/productionModel.ts:111](C:/dev/Wardrobe-Studio/src/core/production/productionModel.ts:111).

**Yeniden üretme:** Gerçek odada duvar/tavan/döşeme, priz/havalandırma ve servis çıkarma yolunu ölç; PDF'yi A3 %100 gerçek boyutta bas.

**Beklenen:** Gönyesizlik, kot, klapa alıştırma, duvar ankrajı ve fiziksel okunabilirlik yerinde doğrulanmalı.

**Gerçek:** Bu denetimde ekran/PDF ölçüsü kontrol edildi; fiziksel baskı, malzeme, oda rölevesi ve gerçek montaj yapılmadı. Yazılımın bunlara ilişkin uyarı notları mevcut.

**Kanıt:** Dört PDF son notları; production-output-checks.json A3 boyutu; 13 PDF temas görüntüsü

**Önerilen düzeltme/doğrulama:** USER_ACCEPTANCE_TESTS.md üretim grubundaki saha ve A3 cetvel kontrolünü tamamla; gerçek ölçüleri onaylanmış sürüme kaydet.

**Kalıcı regresyon/kabul önerisi:** Yerinde uzman ve kullanıcı kabul tutanağı.

### AUD-029 — P3 — İki teknik mimari kararı sözleşmedeki biçimde uygulanmamış

Aşama: 1 / 2. Gereksinim: Ana §3.1 animasyon ve §3.3 InsertRegistry.

Dosyalar: [src/core/inserts/insertRegistry.ts:3](C:/dev/Wardrobe-Studio/src/core/inserts/insertRegistry.ts:3), [src/core/analysis/motionSimulator.ts:1](C:/dev/Wardrobe-Studio/src/core/analysis/motionSimulator.ts:1), [src/core/solver/carcassSolver.ts:1480](C:/dev/Wardrobe-Studio/src/core/solver/carcassSolver.ts:1480).

**Yeniden üretme:** InsertRegistryEntry alanlarını ve animasyon bağımlılıklarını ana planla karşılaştır.

**Beklenen:** Kayıt nesnesi parametre/geometri/kapasite/kuralları tek tipli sözleşmede toplamalı; animasyon için belirlenen react-spring/three kararı uygulanmalı veya kullanıcı tarafından ayrıca değiştirilmiş olmalı.

**Gerçek:** Registry katalog/varsayılan içeriyor; geometri ve kapasite ayrı dallarda. Animasyon kendi sönümlü yay koduyla çalışıyor. İşlevsel hareket testleri başarılı; bu teknik uyum açığı kanıtlanmış hareket arızası değildir. Önceki ajan raporu kullanıcı sözleşmesini kendiliğinden değiştiremez.

**Kanıt:** insertRegistry.ts; motionSimulator.ts; package.json; MP015/MP024

**Önerilen düzeltme/doğrulama:** Mevcut çalışan davranışı koruyarak bu iki teknik kararı açıkça incele; küçük ortak modül sözleşmesi mümkün. Sadece kitaplık değiştirmek için büyük refactor yapma; kapsam kararı ayrı düzeltme onayında somutlaştırılsın.

**Kalıcı regresyon/kabul önerisi:** Gerekirse davranış eşdeğerliği testleri; kütüphane adına göre uygulamayı doğru varsayma.

### AUD-030 — P2 — Gövde malzemesi seçimi bağımsız raf malzemesini de eziyor

Aşama: 3. Gereksinim: Ana Aşama 3 malzeme özelleştirmesi; denetim §7 bağımsız gövde/raf malzemeleri.

Dosyalar: [src/App.tsx:1396](C:/dev/Wardrobe-Studio/src/App.tsx:1396), [src/App.tsx:1510](C:/dev/Wardrobe-Studio/src/App.tsx:1510).

**Yeniden üretme:** 3. Malzeme / Çıktı → Yüzey: önce İç Raf Yüzeyi için farklı bir malzeme seç; sonra Gövde & Dikmeler için başka malzeme seç.

**Beklenen:** Gövde kontrolü yalnız gövde niyetini değiştirir; bağımsız atanmış raf malzemesi korunur veya birlikte uygulama açıkça kullanıcıya seçtirilir.

**Gerçek:** Gövde düğmesi onClick dalı setMaterials içinde carcassMaterialId ile shelfMaterialId değerlerini koşulsuz aynı m.id yapıyor. Ayrı İç Raf Yüzeyi kontrolü mevcut olmasına rağmen seçimi bir sonraki gövde seçiminde kayboluyor. Kaynak olay yolu kesin; bu özel işlem sırası bu denetimde ayrıca tarayıcıda tekrarlanmadı.

**Kanıt:** App.tsx:1510–1514 doğrudan olay işleyicisi; MP085; UAT-17

**Önerilen düzeltme/doğrulama:** Gövde seçimini yalnız gövdeye uygula; raf için miras davranışı isteniyorsa bağımsız override korunmalı ve birlikte uygula seçeneği açık olmalı.

**Kalıcı regresyon/kabul önerisi:** Önce raf sonra gövde seçen UI regresyonu; yalnız setMaterials store testinin geçmesi bu olay bağlama kusurunu yakalamaz.

## Kesin doğrulanamayan noktalar

Gerçek tarayıcı indirmesi; bütün Normal/X-Ray/Gizle sıraları ve dönüşte tüm yüzey raycast’i; normal modda ayrıca yüzey sürükleme ve pointercancel; tüm X yönlü büyütme/küçültmeler; çekmecelerde Shift/Ctrl çoklu fare seçimi; marquee ara kare canlı vurgusu; dar ekran/tüm kamera açıları için popover; 2D pan/zoom durumunun ayrı korunumu; tüm malzeme/kalınlık kombinasyonlarında Z-fighting/kulp/LED görsel taraması; her özel front kenarının genel dikmeye oturması; sayısal hedef cihaz performansı. Kod incelemesi bu maddeleri otomatik PASS yapmadı. Matris 12 ayrı UNVERIFIED satırı ile kapsamı daralan PARTIAL satırlarını gösterir.

Eski Aşama 1–3 presetleri, Aşama 4 analiz alanlarını içeren tasarımlar ve Aşama 5 fixture'ları normalize/JSON turunda denendi. Kullanıcının bütün tarihî kişisel dosyalarının envanteri alınmadı; “her eski dosya kesin uyumludur” denmedi. Kaynakta bilinmeyen alanlar için Zod davranışı, desteklenen schemaVersion 1 sınırı ve ortak doğrulama açıkları sürer. Gerçek katalog, oda, malzeme ve fiziksel montaj ayrıca AUD-026–028 kapsamındadır.

## Son düzeltme turu için sıralı plan

1. **Kayıt ve kabul sınırı:** AUD-001/007 için revizyon/yedek koruması; AUD-002/006 için tek ortak global doğrulama ve üretim kapısı. Her hata için önce gecikme/kota/eksik birleşim regresyonu yazılmalı.
2. **Geometri ve gerçek netler:** AUD-003/004/005/009/012/013; organizör tamsayı kapanışı, ankraj, gerçek net, pivot ve köşe sahipliği. Yeni testler bağımsız beklenen sınırlardan türetilmeli.
3. **Zorunlu işlev açıklıkları:** AUD-008/010/011/018/019/023/025; geniş kanat uyarısı, askı seçenekleri, 32 mm ve kancalı niş, kızak niyeti. Mevcut komut/şema yolunu küçük eklerle genişletme yeterli.
4. **Üretim ve karşılaştırma:** AUD-016/017/021/022; izdüşüm sırası, bilinen konum/pay/kod alanları, tek kapasite tanımı. Dört fixture yeniden üretilecek; eski kaynak/testler korunarak yeni regresyonlar eklenecek.
5. **Atölye sözleşmesi:** AUD-026/027/028 için gerçek donanım, bant, ham kesim, birleşim, röleve ve A3 onayı. Yazılımdan bilinmeyen delik/taşıma değeri uydurulmayacak.
6. **Görsel kapsam ve kullanıcı kabulü:** AUD-014/015/020/024/029/030; gerçek eşya ölçeği, genel gizleme, ölçülmüş AO/instance/ışık bütçesi, sayfa ekonomisi; UNVERIFIED UAT turu. Her düzeltme grubundan sonra 120 test+yeni anlamlı regresyonlar ve build; gereksiz tekrar/büyük yeniden mimari yok.

## Kanıt ve teslim dosyaları

- [REQUIREMENTS_COVERAGE.md](C:/dev/Wardrobe-Studio/REQUIREMENTS_COVERAGE.md)
- [PRODUCTION_OUTPUT_AUDIT.md](C:/dev/Wardrobe-Studio/PRODUCTION_OUTPUT_AUDIT.md)
- [USER_ACCEPTANCE_TESTS.md](C:/dev/Wardrobe-Studio/USER_ACCEPTANCE_TESTS.md)
- [artifacts/final-audit/tests.log](C:/dev/Wardrobe-Studio/artifacts/final-audit/tests.log)
- [artifacts/final-audit/build.log](C:/dev/Wardrobe-Studio/artifacts/final-audit/build.log)
- [artifacts/final-audit/independent-results.json](C:/dev/Wardrobe-Studio/artifacts/final-audit/independent-results.json)
- [artifacts/final-audit/independent-audit.mjs](C:/dev/Wardrobe-Studio/artifacts/final-audit/independent-audit.mjs)
- [artifacts/final-audit/persistence-race.json](C:/dev/Wardrobe-Studio/artifacts/final-audit/persistence-race.json)
- [artifacts/final-audit/persistence-review.mjs](C:/dev/Wardrobe-Studio/artifacts/final-audit/persistence-review.mjs)
- [artifacts/final-audit/production-output-checks.json](C:/dev/Wardrobe-Studio/artifacts/final-audit/production-output-checks.json)
- [artifacts/final-audit/pdf-numeric-checks.json](C:/dev/Wardrobe-Studio/artifacts/final-audit/pdf-numeric-checks.json)
- [artifacts/final-audit/browser-evidence.json](C:/dev/Wardrobe-Studio/artifacts/final-audit/browser-evidence.json)
- [artifacts/final-audit/preservation-check.json](C:/dev/Wardrobe-Studio/artifacts/final-audit/preservation-check.json)
- [artifacts/final-audit/coverage-counts.json](C:/dev/Wardrobe-Studio/artifacts/final-audit/coverage-counts.json)
- [artifacts/final-audit/findings.json](C:/dev/Wardrobe-Studio/artifacts/final-audit/findings.json)

Bağımsız hızlı tekrarlar çalışma kökünde: node artifacts/final-audit/independent-audit.mjs; node artifacts/final-audit/persistence-review.mjs; Python ile artifacts/final-audit/pdf-numeric-review.py. Tam PDF görsel yeniden taraması production-review.py ile 127 geçici PNG üretir; doğrudan uygulama testlerine eklenmedi. Denetim betiklerinin başarısız ilk çalıştırma denemeleri (ör. satır seçimi/regex veya yanlış yol) betik içinde düzeltildi; bunlar uygulama kusuru olarak sayılmadı.

Denetim raporları tamamlandı. Uygulama düzeltmesi, refactor, bağımlılık güncellemesi veya kapsam değişikliği yapılmadı. Son düzeltme turu için ayrı kullanıcı onayı beklenir.
