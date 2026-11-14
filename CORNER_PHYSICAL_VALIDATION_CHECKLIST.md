# Köşe donanımı: fiziksel doğrulama ve asgari saha bilgisi

14 Kasım 2026 · **PLANLANDI, YAPILMADI.** Atölye, gerçek mobilya veya kullanıcı üzerinde test yapılmadı. Bu liste bir üretim serbest bırakma belgesi değildir. Üç P0 kilidi sürer. [Araştırma](CLOSED_CORNER_ENGINEERING_RESEARCH.md) · [Ürün kanıtı ve kodlar](CORNER_HARDWARE_EVIDENCE_MATRIX.md) · [Aday seçimi](CORNER_DESIGN_CANDIDATES.md).

## Kullanıcı/marangozdan istenecek dört kritik bilgi paketi

Bu bilgiler araştırma tamamlanmadan zorunlu soru haline getirilmedi. Bir sonraki somut prototip için birlikte toplanmalı; kişisel verilerin Git'e yüklenmesi gerekmez.

| Paket | Gerekli en az bilgi | Neyi belirler? |
| --- | --- | --- |
| **1. Yerinde plan ve montaj** | A/B kullanılabilir boyu ve derinlik, tavan yüksekliği, iki duvarın gerçek açısı/diklik farkı; süpürgelik, oda kapısı/yatak/radyatör; kapak önündeki en dar serbest mesafe; duvar/tavan taşıyıcı yüzey türü | Dar menteşeli mi pocket mı; oda çarpışması, dolgu ve sabitleme |
| **2. Gerçek levha ve yaprak** | Üretici+ürün/sınıf, bitmiş kalınlık, kaplama/bant; en az bir gerçek yaprağın donanım/kulp dahil tartılmış kütlesi ve düzlüğü | Yoğunluk senaryosunu gerçek kütleye, sehim ve vida tutunması hesabına dönüştürür |
| **3. Tam donanım paketi** | Ürün/sol-sağ kodu, bütün ray/rehber/plaka/stoper/menteşe bağlantıları, güncel montaj şablonu ve CAD; tedarikçinin izinli yük/boyut/boşluk ve montaj koşulları | Gerçek yörünge, tolerans bütçesi ve yerel satın alınabilirlik |
| **4. Gerçek kullanım** | En geniş normal askı+giysinin en/derinliği, raf eşyası/valiz; kullanıcının rahat erişim yüksekliği ve yaklaşma biçimi; gerekli çekmece açılımı ve normal yükü; köşede alan kaybı ve açma sırası tercihi |310/480 varsayımı yerine gerçek geçiş/erişim; dar kutu, raf ve askı dağılımı |

Bütün odanın yeniden ölçü projesi veya bütün donanımların satın alınması ilk adım değildir. Önce bir aday ve bir kritik erişim modülü seçilir. Marangozun/üreticinin teknik teyidi, fiziksel ölçümün yerine geçmez; ikisi ayrı kaydedilir.

## Aşama 1 — Belge ve kuru montaj kapısı

- [ ] Aday kimliği, tasarım revizyonu, ölçü kaynağı ve tarih yazıldı; `CONCEPT_ONLY` etiketi korunuyor.
- [ ] Tam mekanizma kodları aynı nesil/bölgesel ürünlerden; özellikle Hawa eski 31507 ile V2 setleri karıştırılmadı.
- [ ] Her yaprak en/boy/kalınlık **ve gerçek ek kütle dahil yük** sınırında. Minimum yük varsa o da karşılanıyor.
- [ ] Yükün hangi parçalardan gövdeye/duvara aktarıldığı çizildi; plaka, vida boyu/kenar mesafesi ve levha tutunması üretici/uzman tarafından kontrol edildi.
- [ ] Gerçek delik/kanal şablonu ve sökme-bakım erişimi var. Modeldeki pivot gerçek bağlantı hareketiyle karıştırılmadı.
- [ ] H2 seçildiyse göz açıklığı≤800 mm, orta parçalar≥40 mm geri çekilmiş; üst tabla yüklü sehim≤1,5 mm koşulunu sağlayacak tasarım yapıldı. Bunlar H2'ye özgü; başka raya taşınmadı.
- [ ] H3 seçildiyse cep, üst/alt bağlantı türü, derzler, dikme, M2/T2 derinlik ve bütün BOM aynı konfigürasyonda.
- [ ] H10 seçildiyse≤16 mm kutu yanları, genişlik/uzunluk/alt paylar ve kilitler üretici kesitine göre; mevcut 18/25 mm kutuya doğrudan ray etiketi yapıştırılmadı.
- [ ] Türkiye tam set temini, muadil değişirse yeniden doğrulama ve yedek parça/bakım erişimi yazılı kaydedildi. Sadece ürün ailesinin satılıyor olması yeterli sayılmadı.

## Aşama 2 — Güvenli 1: 1 prova

Önce karton/ince levha zarfıyla **oda alanını** ve eşya geçişini prova edin. Bu, ağır kapağın taşıma testini yapmaz. Sonra seçilmiş levha/donanımla gerçek tespit düzlemine sahip bir test modülü kurulur. Ağır kapağı karton bağlantıyla veya geçici yetersiz sabitlemeyle yüklemeyin. Montaj üretici talimatıyla yetkin kişi tarafından yapılır.

| Deney | Ölçülecek sonuç | Kabul koşulu |
| --- | --- | --- |
| Kapalı cephe | Derz, bindirme, yüzey hizası, stoper noktası, bütün kapakların kapanması | Her göz normal kullanımda kapanır; kullanım için parça sökme yok; seçilmiş üretici kesiti sağlanır |
| Açılma yörüngesi | Kapak/kapak, kapak/gövde, kapak/kulp, ray/çekmece, duvar/oda kapısı boyunca en küçük boşluk | Sürekli hareket boyunca çarpışma yok; belirsiz pay “geçti” sayılmaz |
| Açma/kapama sırası | Her başlangıç kombinasyonunda kullanıcı komutu ve ulaşılan konum; ters sıra | Gerekli sıra anlaşılır; karşılıklı kilitlenme/tehlikeli zorlama yok; kullanıcı bütün ilgili parçaları yeniden kapatabilir |
| Raf | En alt, orta, en üst raftaki gerçek eşyayı iki yönde alma/koyma; ön ağız ve el boşluğu | Gerçek eşya ve kullanıcıyla yeterli erişim. 310 mm bir evrensel kabul sınırı değil |
| Askı | Kullanıcının normal askı+giysiyle tutma, çıkarma, geri asma; borunun ön/arka/uç konumları | Üst ray, kapak paketi veya komşu kulp erişimi kesmiyor; 480 mm senaryosu otomatik kabul değil |
| Çekmece | Kapalıdan hedef stroka ve geri; bütün çekmeceler, normal yük dağılımıyla | Seçilen işlev için kararlaştırılmış tam/yeterli strok; 451/454 mm ancak bu projeye ilişkin hedef; katalogNL ile eşit sayılmaz |
| Oda ve beden | Kullanıcının duruş/yan yaklaşma alanı, omuz/dirsek/kol, kapak açıkken geçiş | Sahada ölçülmüş yeterlilik; yazılım boy yüzdeleri tek başına kabul değil |
| Bakım | Kanat/kızak ayarı, gerekli sökme ve erişim, temizleme | Olağan kullanım için sökme gerekmez; servis talimata uygun erişebilir |

Dönerek çıkarılan askı yolu ayrıca kaydedilir; doğrusal koridor testiyle aynı sonuç sayılmaz. Parmak sıkışma noktaları, stoperler ve tutma alanı mekanizma talimatıyla kontrol edilir. “155° açıldı” bütün erişim testlerinin yerine geçmez.

## Aşama 3 — Yük, sehim ve tolerans

- [ ] Yaprağı bütün aksesuarlarıyla tartın; homojen panelW/2 kabulü yerine ağır kulp/çerçeve etkisini kaydedin.
- [ ] Üreticinin izinli kullanım yükü ve dağılımıyla kapalı/açık/parkta sehim, gövde dikliği ve bağlantı gevşemesini ölçün. Üretici talimatı olmadan aşırı yük testi uygulamayın.
- [ ] Altı tolerans katkısı için ölçülen/sözleşmeyle kabul edilen aralıkları ayrı yazın: panel üretimi, gövde montajı, ray hizası, ayar/stop, yüklü sehim, hareket boşluğu.
- [ ] Kör köşedeki 6 mm'yi tek nominal çizimden onaylamayın. Gerçek minimum dinamik açıklık ile en kötü birikimi karşılaştırın; güvenlik rezervini üretici/uzman tanımlasın.
- [ ] Katalogdaki ayar aralığını imalat toleransı gibi toplamayın. Belgesi olmayan sayıyı uydurmayın; ölçüm/üretici teyidi bekleyin.
- [ ] Kuru/yüklü hareketi her yönde ve en olumsuz izinli ayarla tekrarlayın. İlk kısa aç/kapa provası aşınma/ömür sertifikası değildir; gerekli çevrim ve kabulü ürün üreticisi/uzman belirlemeli.
- [ ] Her temas, kaçırılan tam strok, takılan askı veya kapanmayan cephe **FAIL**; ölçülemeyen koşul **UNVERIFIED**.

Ölçüm kaydı: aday ve donanım revizyonu, tartı/ölçüm aracı, gerçek ölçüler, yük dağılımı, başlangıç pozları, ulaşılan poz, minimum açıklık, tekrar adedi, fotoğraf/video, yapan ve kontrol eden kişi, tarih. Kişisel ev fotoğraflarını veya adresi herkese açık rapora koymayın.

## Aşama 4 — Yazılıma dönüş ve üretim kapısı

1. Kabul edilmiş tek konfigürasyonu CAD/BOM ve ölçüm belgesiyle dondurun. Uymayan ölçü/kapasite aralıklarını da kaydedin.
2. Yeni mekanizmanın serbestlik dereceleri, gerçek pivot/rehber yörüngesi, donanım/kulp hacmi ve tolerans zarfını ayrı araştırma fikstüründe temsil edin. Karşılaştırma ölçülen 1: 1 pozlara dayanmalı.
3. Kapalı başlangıç, bütün ara pozlar, ters sıra, yanlış sıra, gerçek strok ve raf/askı erişimi için bağımsız regresyonlar hazırlayın. Çarpışma toleransını geçmek amacıyla gevşetmeyin.
4. Dört kanonik tasarımın 12 imzası/338 parçası,284 mevcut test, kayıt/JSON/geçmiş ve tanısal kapılar tekrar korunmalı. Yeni mekanizma şemaya/ürüne alınacaksa ayrı mimari inceleme ve kullanıcı onayı gerekir.
5. Ancak belgeli donanım eşleşmesi **ve** fiziksel kabulden sonra ilgili P0'ın üretim kapısı yeniden değerlendirilebilir. Bu araştırma commit'i, `HARDWARE_DOCUMENTATION_MATCHED` veya üretim onayı yerine geçmez. `main`/Cloudflare yayını için ayrıca açık kullanıcı talimatı gerekir.
