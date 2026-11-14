# Tam kapalı cephe adayları ve eleme kararları

14 Kasım 2026 · Üretim tabanı `bd51910`. Bütün yeni seçenekler ayrı araştırmadır. Normal kullanım sonunda dış cephe kapanır; sürekli açık köşe, sökülerek kullanılan panel ve hayalî özel donanım aday değildir. **Hiçbirine üretim onayı verilmedi.** Kaynaklı ürün koşulları [H1–H10 matrisindedir](CORNER_HARDWARE_EVIDENCE_MATRIX.md); geometri/hesap/test yöntemi [araştırma raporundadır](CLOSED_CORNER_ENGINEERING_RESEARCH.md).

## Etiketlerin kullanımı

- `CONCEPT_ONLY`: mekanik avantaj ve bazı ölçü sınırları var; tam bağlantı/kinematik çözülmedi.
- `SIMULATION_FEASIBLE`: belirtilen alt kullanım mevcut ideal modelde geçti; donanım veya fiziksel onay değildir.
- `HARDWARE_DOCUMENTATION_MATCHED`: bütün ilgili boyut, yük, bağlantı koşulları karşılanmış. **Bu çalışmada hiçbir bütün adaya verilmedi.**
- `HARDWARE_INCOMPATIBLE`: seçilen ürünün belgeli bir koşulu karşılanmıyor.
- `PHYSICAL_TEST_REQUIRED`: belirtilen test kapısı tamamlanmalı; bir kavramın yapılmış test sonucu değildir.
- `REJECTED`: mevcut biçimi görevin bütün kullanım koşullarını karşılamıyor.

## Aday tanımları ve somut mekanik avantaj

| Kimlik / P0 | Kapalı mimari | Durum ve karar |
| --- | --- | --- |
| **D1 /001** | Eski 1150×1050 köşe, B1 tek 1535 mm/155°, sonra köşe 60° | **REJECTED** mevcut nihai biçimiyle. Raf alt senaryosu `SIMULATION_FEASIBLE`; 37,73–53,45 kg yalnız panel, aşırı en, askı ve sıralama riski var. Daha çok menteşe bir çözüm kanıtı değil. |
| **D2 /001** | Aynı genişletilmiş köşe yanında B1'i **Wing 77 dört kanatlı paketle** değiştirmek; köşe kanadını ayrıca incelemek | **CONCEPT_ONLY → PHYSICAL_TEST_REQUIRED.** Dev yaprak yerine yaklaşık 382 mm yapraklar, gerçek H2 donanımı. Mevcut 1512 mm net B1 gözünü 800 mm altı destekli gözlere bölmek; orta dikme/raf önlerini≥40 mm geri çekmek ve tabla rijitliğini yeniden tasarlamak gerekir. Köşe 675 mm yaprağı tek WingLine L yaprağı olamaz; ikiye bölünmüş yaklaşık 336 mm 18 mm yaprakta yalnız en/yük elemesi mümkün. Açılı gövdeye H1 bağlantısı henüz yok. |
| **D3 /001 ve 002** | İki dikdörtgen kol, köşesi kapalı dolgu/servis boşluğu; bağımsız dar menteşeli kapaklar veya dikdörtgen H1 katlanır modül | **CONCEPT_ONLY → PHYSICAL_TEST_REQUIRED.** Köşedeki karşılıklı kapak bağımlılığını kaldırma avantajı var. 001 için 550×2276×18 H1,002 için 450×2276×25 H1 veya H5 ayrı menteşeli ön elemesi. Günlük askı/çekmece normal düz açıklıklarda; köşe boşluğu depolama sayılmaz. Brüt plan alanı bedeli aşağıda. En az mekanizma belirsizliği taşıyan ilk atölye inceleme yönü. |
| **A1 /002** | Eski 1050×1050 sağ menteşeli 675×2276×25 köşe | **REJECTED** bütün gardırop kabulü olarak. Raf 448 mm geçer, ancak kapak A dikmede 59,6°'de durur, köşe askısı 355/480; A askısı 29/480. H4 25 mm'ye uymaz; 675 mm tek kanat H1'e sığmaz ve 25 kg sınıfında yük sorunu vardır. |
| **A2 /002** | Açılı tek cephe yerine yeni **450 mm yapraklı dikdörtgen pocket modül**, Hawa V2 H3; askı düz 600 mm derinlikteki kola alınır | **CONCEPT_ONLY → PHYSICAL_TEST_REQUIRED.** Katlanmış paket yana çekilerek ön açıklıktan çıkar. 25 mm kalınlık ürün aralığında; 450 mm yaprak yükü 550 mm'ye göre daha elverişli. Mevcut 481 mm köşe ağzına iki 450 mm yaprak sığmaz: yeni gövde, cep ve komşu modül boyutları gerekir. B'nin 480 mm derinliği otomatik yeterlilik değil. |
| **B1 /003** | EskiA1=1500,775/775/776 mm üç bağımsız raylı yaprak | **SIMULATION_FEASIBLE — yalnız çekmece**; bütün gardırop adayı **REJECTED**.451 mm strok tekrarlandı; askı 0/480 ve 6 mm nominal pay kaldı. Birlikte çalışan ray BOM'u yok. |
| **B2 /003** | B1'in üç rayını **TopLine XL9275786** ile karşılama | **HARDWARE_INCOMPATIBLE.** H6 iki raylıdır; üç kapak, üç bağımsız park hattı değildir. Kanat yük/en uyumu bu yapısal uyumsuzluğu gidermez. |
| **B3 /003** | A2'yi dar bağımsız modüllere ayırma; alt katta kapalı **dış çekmece cepheleri**, üstte bağımsız kapalı askı kapakları; sürgü rayı askı geçişinden çıkar | **CONCEPT_ONLY → PHYSICAL_TEST_REQUIRED.** Çekmece önündeki ikinci hareketli katman ve askı yolunu kesen Y1796 rayı kaldırılır; dış cephe çekmece önleriyle kapalı kalır. Yeni kutular H10'a göre≤16 mm yanlarla, seçilmiş NL500/40 kg setine göre çizilir. Bu, eskiA2'ye tek gömme kapak ekleme deneyi değildir. |
| **B4 /003** | Alt köşeyi üretici **SPACE CORNER** özel kutusuna dönüştürme; üst askıyı bağımsız düz erişim modülüne ayırma | **CONCEPT_ONLY → PHYSICAL_TEST_REQUIRED.** Köşedeki depolama kullanıcıya dışarı gelir. H7 gerçek mimari referanstır; 600 mm gövdeye ABD setini doğrudan takma veya 25 mm kutu kullanma önerisi değildir. Özel simetrik köşe, kutu ve ön yüz gerekir; askı ayrı çözülür. B3'e göre daha kapsamlı üretim değişikliği. |
| **B5 /003** | Üreticinin üç hatlı **raumplus** sisteminden eksiksiz yeni çerçeveli cephe; çekmece ve askı açıklığı birlikte yeniden yerleştirilir | **CONCEPT_ONLY.** H9 üç hatlı gerçek ürün yönünü gösterir. Tam kod/kesit/park açıklığı yok; mevcut 30 mm merkezler veya 775 mm ahşap yapraklar olduğu gibi kullanılamaz. Tedarikçi CAD/BOM sağlanmadan simülasyon sırasına alınmaz. |

## 1. Donanım ve ölçü/yük matrisi

“Ön eleme uygun” tam eşleşme değildir; gerçek ek kütle, vida/taşıyıcı ve montaj koşulları açık kalır. Yalnız ölçüldüğü belirtilen sonuçlar güncel çekirdek probundan gelir.

| Aday | Tam kapalı cephe | Gerçek donanım | Kapak boyut sınırı | Kapak ağırlığı | Montaj boşluğu | Tolerans riski |
| --- | --- | --- | --- | --- | --- | --- |
| D1 | Evet, modelde | H5 adayı; bütün eşleşme yok |1535 mm için belgeli uygunluk yok |37,73–53,45+ek kg; H1'e uygunsuz | Plaka/vida/oda belirsiz | Yüksek/bilinmiyor |
| D2 | Evet, amaçlanan | H2 kodu doğrulandı; köşe bağlantısı belirsiz |382 mm paket ön elemesi; B1 destek koşulu şu an **uygunsuz** |18 mm dar yaprak elverişli; gerçek paket bilinmiyor |40 mm destek çekilmesi ve 1,5 mm sehim şartı karşılanmadı | Bilinmiyor |
| D3 | Evet, dolgu ve kapaklarla | H1/H5 doğrulandı, proje eşleşmesi yok |550/18 veya 450/25 ön elemesi uygun | Sırasıyla≤21,15 /23,76 kg @850+2; gerçek ek kütle ölçülmedi | Kapak, duvar, vida ve montaj erişimi belirsiz | Bilinmiyor |
| A1 | Evet, modelde | H4 uygunsuz; H5 eşleşmedi |675 mm H1'e uygunsuz; H4 kalınlık uygunsuz |23,04–32,65+ek; 25 kg sınıfı bütün aralıkta geçmez | Pivot/delik/kulp belirsiz | Yüksek/bilinmiyor |
| A2 | Evet, tasarım amacı | H3 V2 kodları doğrulandı |450×2276×25 ön elemesi uygun |15,36–21,76+ek; gerçek konfigürasyon yük teyidi yok | Cep eni/bağlantı/tavan/oda belirsiz | Bilinmiyor |
| B1 | Evet, modelde | Tam üç ray seti belirsiz |775/776×1698×18; seçilmiş ürüne göre belirsiz | Panel yaklaşık 14,2–20,2+ek; çerçeve/ray yükü belirsiz | Nominal modelde 6 mm koridor farkı | **Yüksek**,1 mm×6 ile pay sıfır |
| B2 | Evet | H6 gerçek | En/t kalınlık ön elemesi uygun; **ray yapısı uygunsuz** |60 kg sınıfına panel elemesi sığar | Montaj başka kesit; belirsiz | Ray uyumsuzluğu nedeniyle kabul yok |
| B3 | Evet; dış çekmece önleri dahil | H10/H5 gerçek | Yeni ölçüler kesinleşmedi | Kutu+iç yük+önler ölçülmedi | H10 montajı, ray/kapak düşey ayrımı belirsiz | Bilinmiyor |
| B4 | Evet | H7 somut referans | Mevcut kutu 18/25 mm yanlarla uygunsuz; yeni özel kutu gerekli | Seçilen bölgesel setin kendi sınıfı kullanılmalı | Özel köşe/geri çekme/montaj çözülmedi | Bilinmiyor |
| B5 | Evet, amaçlanan | Aile gerçek; kodlar `UNVERIFIED` | Belirsiz | Belirsiz | Ray kesiti/park/delik belirsiz | Bilinmiyor |

## 2. Çarpışma, erişim ve üretim matrisi

| Aday | Hareket çarpışması | Raf erişimi | Askı erişimi | Çekmece stroku | Türkiye tedarik | Fiziksel prototip | Üretim onayı |
| --- | --- | --- | --- | --- | --- | --- | --- |
| D1 | Yalnız B1→köşe ve ters sıra ideal modelde geçti; kapalı komşu engeller |458/310×4 | Köşe 365/480; A32/480, doğrulanmadı |451/451×3 | Tam set belirsiz | Yapılmadı; mevcut biçim elendi | **Verilmedi** |
| D2 | Gerçek katlanır/paket yörüngesi belirsiz | Yeni sonuç yok; 458 değeri bu donanıma taşınmaz | Belirsiz; A üst ray ayrıca çözülmeli | Yeni sonuç yok | Belirsiz | Gerekli, yapılmadı | **Verilmedi** |
| D3 | Yeni gövde/kapak/oda testi yapılmadı | Dar düz modül ağzı hedeflenir; ölçülmedi | Yeni düz erişim ve erişim yüksekliği ölçülmeli | Yeni kutu/cepheyle ölçülmeli | Kanallar mevcut; set stoku belirsiz | Gerekli, yapılmadı | **Verilmedi** |
| A1 |59,6°'de A dikmeye temas; 110° geçmedi |448/310×4 | Köşe 355/480; A29/480 |454/454×3 | Belirsiz | Yapılmadı; mevcut bütün çözüm elendi | **Verilmedi** |
| A2 | Üretici CAD yörüngesiyle test yok | Pocket parkı sonrası ölçülmeli |450 mm kanat eni,480 mm askı koridoru değildir; net açıklık ayrıca | Yeni sonuç yok | Belirsiz | Gerekli, yapılmadı | **Verilmedi** |
| B1 | Seçilen park/strok/ters kapanış ideal modelde geçti | A1 valiz 794/480 eski aday sonucu | A2 **0/480** | **451/451×3** | Tam uyumlu ray seti belirsiz | Gerekli, yapılmadı | **Verilmedi** |
| B2 | Üç hat kinematiği ürünle kurulamaz | Geçerli test yok | Çözülmedi | B1'in 451 değeri aktarılamaz | Belirsiz | Bu yanlış eşleştirme elendi | **Verilmedi** |
| B3 | Yeni kutu/kapak komşuluğu belirsiz | Düz ayrı raf ağzı ölçülmeli | Üst çapraz ray kaldırıldığı için avantaj; gerçek zarf ölçülmedi | NL500 ürün,451 mm model garantisi değil; hedef strok test edilmeli | Belirsiz | **Öncelikli 1: 1 modül** | **Verilmedi** |
| B4 | Özel köşe ray/ön yüz testi yok | Çekmeceye alınan depolama ayrıca sayılmalı | Ayrı düz askı modülüyle hâlâ belirsiz | Üretici özel gövdesinde ölçülmeli | Yerel eşdeğer belirsiz | Gerekli, yapılmadı | **Verilmedi** |
| B5 | Tam kesit/CAD olmadan test yok | Belirsiz | Y1796 ray sorunu yeniden çözülmeli | Belirsiz | Belirsiz | CAD sonrası gerekli | **Verilmedi** |

## 3. Yeni mimarilerin ölçü ve kapasite bedeli

**D2:**1535 mm eski ön zarfı dört eşit olmayan tamsayı yaprağa bölmek tek başına yeterli değil. H2 formülü, gerçek bindirme/derz ve donanım eksenleriyle uygulanmalı. 384 mm yalnız kütle için muhafazakâr yaprak örneği; kesim ölçüsü değildir. Mevcut 1512 mm iç göz, yeni 18 mm orta destekle yaklaşık 747/747 mm gözlere ayrılabilir; bu yalnız genişlik hesabıdır.≥40 mm geri çekilen desteğin raf ve askı rijitliği, paket park hacmi ve köşe komşuluğu henüz çözülmedi. Yeni dikme/parça sayısı ve üretim BOM'u **UNVERIFIED**.

**D3:** Köşeden her iki düz kolu ayıran 70 mm örnek dolgu ile 001'de 2330/1930,002'de 2450/1930 mm düz boy kalır. 002'nin A kolunda örneğin 900+900+650 mm brüt modül dağılımı bu boya sığar; birleşim/kenar payları nedeniyle bu bir kesim listesi değildir. B kolunda 900+900 sonrası 130 mm bakiye, dolgu/servis boşluğu olarak ele alınabilir. Köşe depolaması kaybolur. Eski beşgenle karşılaştırılan brüt plan alanı farkı 001'de 0,489 m²,002'de 0,4266 m². Net raf/hacim, askı boyu ve parça adedi hesaplanmadı; kullanıcı alan kaybını kabul etmeden kalıcı modele geçilmez.

**A2:** H3 derinlik denklemiyle 450×25 mm yaprak/M2=100/Z3=3 içinT2=445 mm. 600 mm kolda ön eleme daha rahat; 480 mm dış derinlikte bitmiş cep/konstrüksiyon için yeterlilik belirsiz. Dışarı taşan 100 mm ile katlanma sırasındaki oda süpürmesi ayrı ölçülür. Katalog “yana saklanır” ifadesi açılma anında hiç oda alanı gerekmiyor anlamına gelmez. Cep tüketimi, H3 kesitindeki 110 mm yerleşim ve yeni dikme kalınlıklarıyla kesinleştirilmeden net kullanılabilir genişlik verilemez.

**B3:** Eski 1706 mm tek geniş çekmecenin yerine örneğin iki dar dikey modül düşünülebilir; mevcut üçlü bankanın işlevi korunacak şekilde adet ve yük dağılımı yeniden kararlaştırılır. Çekmece kasasıNL500 için 490 mm ve ürünün≤16 mm yan kesitine göre yeniden çizilir. Askılık bölgesi üstündeki ray artık Y1796 seviyesinde kesmez. Üst kapak ve dış çekmece hareket hacimleri arasında gerçek düşey derz/donanım payı ayrılır. Bu mekanik avantaj test sonucu değildir. Mevcut kullanıcı verisi ve kanonik örnekte değişiklik yapılmadı.

**B4:** Mekanizma depolamayı dışarı getirerek erişim derinliğini azaltır; bedeli özel köşe gövdesi, iki yönlü cephe ve üreticiye göre kutudur. ABD örneğinin 39 inç köşesi 990,6 mm'dir; bu,600/480 gardıroba aktarılacak standart ölçü değildir. Üst askıyı ayrı normal modüle almak toplam askı boyunu/raf hacmini değiştirir; dolap bütününde kapasite karşılaştırması gerekir.

## 4. Doğrudan elenen kısa yollar

| Eşleştirme / deney | Sonuç |
| --- | --- |
| 001 mevcut 388 mm yaprağı ikiye bölüp H1/H3 takmak | Yaklaşık 194 mm yaprak, H1 minimum 250 ve H3 minimum 350 altında. **HARDWARE_INCOMPATIBLE**. |
| 002 mevcut 464 mm yaprağı ikiye bölüp H1/H3 takmak | Yaklaşık 232 mm, aynı alt sınırların altında. **HARDWARE_INCOMPATIBLE**. |
| 002'ye Blum 79T8500 takmak |25 mm >23 mm; **HARDWARE_INCOMPATIBLE**. |
|1535 mm B1'i iki WingLine L yaprağı yapmak | Her yaprak yaklaşık 766 mm >600; **HARDWARE_INCOMPATIBLE**. |
| Kör köşe adayına SugatsuneMFU1200 takmak |775/776 mm <800; 18 mm <30; **HARDWARE_INCOMPATIBLE**. |
| Eski 003'te yalnız üçüncü ray / yalnız iki rayda genişlik değiştirme | Önceki probda 49 mm strok kaldı. Yeni donanım kabulü olarak tekrarlanmadı. |
| Eski 003 çekmecesiniA1'e taşıma / A2'ye tek gömme 155° kapak | Tarihsel 3/4 başlangıç kesişmesi ve 0 strok. **REJECTED**. B3 yeni dar kutu ve bağımsız dış cephe tasarımı bunların üzerine “geçti” etiketi koymaz. |
| Köşe kapağını kaldırma / sürgü alt panelini sökerek kullanma | Tam kapalı normal kullanım şartını ihlal eder. **REJECTED**. |

## 5. Üç P0 için öneri ve sonraki adım

1. **001:** ÖncelikD3 bağımsız dar kapaklı dikdörtgen düzenin 1: 1 örneği. Beşgen hacmin korunması önemliyse D2 için Hettich'ten tam kesit/BOM ve yüklü taşıyıcı hesabı alınmalı; mevcut 1535 mm tek kanat bırakılmamalı. Raf/askı bütünlüğü ayrıca çözülmeli.
2. **002:** D3'te 450 mm 25 mm yapraklar; oda açılımı kısıtlıysa A2 pocket. Kalınlık uyumu tek başına yeterli değil. 25 mm 675 mm geniş köşe yerine dar yapraklar yükü azaltır; H4 bu kalınlıkta kullanılamaz.
3. **003:** ÖncelikB3, çekmece ve askı cephesini ayrı işlevlere ayıran kapalı modül. B4 ikinci, daha kapsamlı seçenek. Eski üç raylı B1 tam gardırop çözümü değildir. B5 ancak üretici eksiksiz üç hat kesiti verirse yeniden değerlendirilir.

**Şu anda “çekmece ve askı aynı anda çözüldü” denebilecek aday yok.** Yeni seçeneklerde ölçülmeyen erişim değerleri boş bırakıldı. CAD, bağlantı ve gerçek eşya/kullanıcı provası olmadan güvenli hareket sıralama kodu yeni mekanizmaya genişletilmemeli. Ayrı deneysel fikstür ve fiziksel testten sonra kullanıcıya somut bir mimari seçimi sunulmalı; `main` entegrasyonu bu görevin dışındadır.
