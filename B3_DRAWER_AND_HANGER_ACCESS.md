# B3 çekmece ve askılık erişimi

15 Kasım 2026. **DENEYSEL CAD — FİZİKSEL ÜRETİM ONAYI YOK.** Ölçü birimi mm; mevcut çekirdeğin sürekli çarpışma sınırı ve kulp katıları korunur.

## Çekmece

| Düzen | Adet | Kullanılabilir iç en×derinlik×yükseklik | Dış ön en | Organizer sonrası toplam litre | İstenen/ulaşılan model stroku |
| --- | ---: | --- | --- | ---: | --- |
| Orijinal |3|1652×514×185|1706|463,2054|451/49, her üçü |
| SINGLE3 |3|786×460×171|822|180,60156|451/451, her üçü |
| DUAL3 |6|3×786×460×171 ve3×788×460×171|822/824|361,66836|451/451, her altısı |
| DUAL2 |4|2×786×460×287 ve2×788×460×287|822/824|409,08952|451/451, her dördü |

B3 kutu yan/ön/arka levhası15, tabanı8 mm; dış ön ayrı18 mm'dir. Kutu dış eni816/818, boyu490 mm. Üçlü kutu yüksekliği179, ikili295 mm; taban düşülmüş kullanılabilir yükseklik171/287. Dört kolon×üç sıra organizerin katı hacmi ayrıca düşülür. Her çekmecede yatay yan açıklık3 mm, dikey çekmece-çekmece derzi4 mm'dir. Bu değerler nominal model açıklığıdır; gerçek levha/eğrilik/montaj toleransı değildir. Kapalı cephe denetimi tasarlanan ≤4 mm derzleri depolama açıklığı saymaz.

451 mm önceki kanonik senaryoyla kıyas hedefidir; NL500'den türetilmiş üretici stroku değildir.500 mm hedef ancak ayrı `STROKE500` duyarlılık kimliğiyle sınanabilir ve donanım UNVERIFIED kalır. Ahşap parça hacmi×650–800 kg/m³ varsayımıyla üçlü kutunun ilk çekmecesi9,574–11,784 kg, ikili13,576–16,709 kg'dır. Ray/kulp kütlesi ve doğrulanmış eşya yükü UNKNOWN;40 kg katalog sınıfı40 kg eşya garantisi değildir.

## Üst askı

Orijinal üst sürgü rayı480×550×850 mm önceki yazılım zarfının düz çıkarma yolunu keser:1712 mm geometrik ağız olsa da bu senaryonun geçişi ve merkez aralığı0. Boru2272 mm'dedir. Eski üç bağımsız raylı aday çekmecede451/451 verirken askıda0/480 kaldığından bütün sistem çözümü değildir.

B3 üst sürgü rayı taşımaz. Alt dış çekmece önleri üst askı ağzından bağımsızdır. Boru yüksekliği1700 mm analitik yerleşimdir; 1620 mm kullanıcı için kanca kaldırma kabulü yapılmamıştır.

| Düzen | Net ağız / açık kalan ön geçiş | Ham/kullanılabilir boru | Düz çıkarma merkez aralığı |
| --- | --- | --- | --- |
| SINGLE3 |828/828|828/788|348: yerel [240,588] |
| DUAL3 ve DUAL2 |828/828 ve830/830|1658/1578 toplam|348+350=698: [240,588] ve[240,590] |

480 mm genişlik için merkez kenarlardan240 mm içeride kalır.348/350 mm bütün borunun erişilebilir boyu değildir; ayrı kolonların toplamı698 mm tek kesintisiz ağız değildir.550 mm derin,850 mm yüksek zarf boru çevresinde düz dışarı taşınır; üst/yan panel, kapak/kulp katılarıyla çarpışma ve verilen açma adımları denetlenir. Modelde bu kolonların düz yol geçişi iyileşir; kancanın borudan ayrılması, yukarı kaldırılması, ikinci/döner yol ve insan hareketi **NOT_MODELED**. Fiziksel erişilebilir askı boyu/hacim UNKNOWN.

Her askı kolonu için önünde600×600 mm ve1800 mm yükseklikte yaklaşma rezervi çizilir; dünya Z1180–1780 mm. Bu, oda ölçümü veya antropometrik standart değildir. Gerçek yatak/duvar, gövde sabitlemesi, merdiven ve kullanıcı duruşu bilinmez. Kör544 mm açıklığa gerçek valiz/hurç sokma yolu ayrıca kabul gerektirir;310 mm raf referansı bunu geçmiş saymaz.

## Sıralama ve ters hareket

Üç92° sınırlı adayda her biri11 senaryo, toplam33 çevrim: komşular0/30/60/90/155° talebiyle ileri/ters sıra (talep gerçek92° limite sıkıştırılır), çekmeceleri ayrı aç/kapat, hepsini açık bırakıp kapakları yanlış sırada kapat, çekmeceleri ve kapakları ters sırada kapat; ayrıca çekmece-önce/kapak-sonra. Bütün test edilen çekmeceler451 mm'ye ve bütün33 çevrim başlangıç konumuna döndü. Tüm kapakların istenen açıya ulaştığı iddia edilmez; temaslar hareketi sınırlar. Kapaklar kapalıyken de alt dış çekmeceler451 mm hareket eder. Kulp katıları test sahnesine dahildir. Sentetik oda engeli testi strokun gerçekten sınırlandığını ve geri dönüşü ayrıca doğrular.

Askılık için komşu depolar kapalı tutulup gereken üst çift kapak kendi güvenli adımlarıyla açılır, düz zarf çıkarılır, aynı yol geri alınır ve kapaklar ters sırada kapanır. Bütün gardırobu aynı anda sonuna kadar açma zorunluluğu yoktur; birinci üst kapak açıkken bitişik sol üst kanat~17,23°'de kalabilir. Fiziksel uygulamada hangi sıra ve açının gerektiği üretici mekanizmasıyla yeniden ölçülmelidir.

`DUAL3_UNLIMITED155`: komşular155° ileri sırada ilk kolon çekmeceleri **10,675076 mm**'de durur; çekmece-önce/kapak-sonra ters çevrimi başlangıca dönmez. Bu varyant **NO_GO** olarak tutulur. Galerideki tek bölme açma resmi ve451 mm bağımsız-bölme ölçümü bu olumsuz ortak sıra sonucunun yerine kullanılamaz.

Özet sınıf: geometrik katı ve sınırlı çevrim PASS, erişim **ACCESS_PARTIAL**, donanım **HARDWARE_UNVERIFIED**, insan/oda/yük kabulü **PHYSICAL_TEST_REQUIRED**.
