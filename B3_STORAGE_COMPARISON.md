# B3 ortak tanımlarla kapasite karşılaştırması

15 Kasım 2026. **DENEYSEL CAD — FİZİKSEL ÜRETİM ONAYI YOK.** D3-1 tanımları ve aynı `summarize/shelfReach/rasterUnion` yöntemi kullanılır. Hacimler nominal mm³'ten, alanlar mm²'den çevrilir; fiziksel eşya kapasitesi veya doldurulmuş gardırop ölçümü değildir.

| Metrik | Orijinal kör | SINGLE3 | DUAL3 | DUAL2 |
| --- | ---: | ---: | ---: | ---: |
| Brüt gövde m³ |6,851172|6,744240|6,744240|6,744240|
| Modül gövdeleri m³ |6,796452|6,689520|6,689520|6,689520|
| Net geometrik iç m³ |6,042317592|5,967981720|5,845388040|5,892809200|
| Net fark litre |0|−74,335872|−196,929552|−149,508392|
| Net fark % |0|−1,2303|−3,2592|−2,4744|
| Raf destek m² |6,153288|8,934798|6,048888|6,048888|
| Modellenen erişilebilir raf alt sınırı m² |5,531830|8,498898|5,626820|5,626820|
| Ham/kullanılabilir boru mm |1712/1672|828/788|1658/1578|1658/1578|
| Düz askı çıkarma merkez aralığı mm |0|348|698 toplam|698 toplam|
| Organizer sonrası çekmece litre |463,205400|180,601560|361,668360|409,089520|
| Çekmece adedi |3|3|6|4|
| Modellenen strok mm |49×3 /451 talep|451×3|451×6|451×4|
| Bağımsız gövde |1 bağlı L montajı|5|5|5|
| Fiziksel geometri parça sayımı |81|109|157|123|
| Kapalı servis brüt/net m³ |0/0|0/0|0/0|0/0|
| Model gövde iz alanı m² |3,004900|2,958000|2,958000|2,958000|
| Gövde dışına ek kapak oda zarfı yaklaşık m² |2,501029|1,450509|1,450509|1,450509|
| Fiziksel erişilebilir hacim |UNKNOWN|UNKNOWN|UNKNOWN|UNKNOWN|

Net geometrik iç, yaprak hücre iç hacimlerinden çekmece bankası hacmini çıkarıp gerçek kutu içini/organizer düşümünü ekler. Montaj boşluğu, kapalı servis ve levha zaten bu tanımla ayrılır; sırf dış ölçü çarpımı değildir. Brüt gövde, D3 yöntemindeki çözülen gövde iz alanı×2280 mm'dir; orijinal paylaşımlı ve B3 ayrı gövde dizilimi aynı dış kol uzunluğuna rağmen türetilmiş iz alanında farklıdır. Tablodaki farkı yalnız ray kazancı gibi yorumlamayın. Modül gövdeleri uç dolgu alanını dışarıda tutar. B3 sabit kör yüzünün dışarı taşınması ve ayrı gövdelerin ek dikmeleri açık araştırma değişiklikleridir.

Raf destek alanı askı hücresinin tabanını raf olarak saymaz; aynı destek bir kez sayılır. Erişim alt sınırı310×390×70 mm ortak katlı eşya zarfı ve20 mm taramayla güvenli destek poligonlarının alanıdır. Yerleştirme/döndürme veya gerçek valiz kabulü değildir. Oda zarfı tekil depo açma çevrimlerinin5/2,5 mm integrasyonuyla birleşimidir; B3 inceltme farkı−265,468 mm², orijinal−231,742 mm². Bu küçük sayısal fark bütün hata için garanti veya gerçek oda ölçümü değildir. Kullanıcının odasında sığdığı UNKNOWN.

Yeni çekmeceler eski geniş üç çekmeceyle eşdeğer değildir. Toplam iç hacim SINGLE3'te%61,0105, DUAL3'te%21,9205, DUAL2'de%11,6829 azalır. DUAL2 daha yüksek kutuyla daha çok litre sunar; DUAL3 daha çok bağımsız organizer sunar. SINGLE3 raf alanını artırırken askı boyunu yarıdan fazla azaltır. DUAL2/3'te iki borunun kullanılabilir toplamı1578 mm, orijinal1672 mm'den94 mm azdır; düz çıkarma merkez aralığı ise0'dan698 mm'ye iyileşir. Tek keyfî başarı puanı veya kapasite kaybı onayı yoktur.

B3 parça sayımı ahşap gövde/cephe/kutu/organizer katılarıdır; ray/vida/menteşe rezervlerini üretim parçası saymaz. Eski81 üretim parçasıyla nominal ahşap-katı temeli karşılaştırılır; B3 yeni iç önleri ve organizer parçalarını gerçek katı olarak içerir. Bu sayım üretim kesim listesi değildir. Üç P0 için tam CSV/ZIP kilitleri korunur. Kör alan bağlantılıdır; kapalı servis0 olması bütün kör hacmin fiziksel kullanılabilir olduğu anlamına gelmez.

Ham tam hassasiyet ölçümler ZIP içindeki `comparison.json` ve her `.cad.json` dosyasındadır. Bu rapordaki sayılar seçilmiş92° sınırlı adaylara aittir. Sınırsız155° negatif örneğinin raf alt sınırı5,645407 m² olsa da hareket sistemi NO_GO'dur; kapasite değeri kabul sağlamaz.
