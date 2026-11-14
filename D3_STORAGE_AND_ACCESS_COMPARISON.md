# D3 depolama ve erişim karşılaştırması

**14 Kasım 2026 · DENEYSEL CAD — ÜRETİM ONAYI YOK**

Kaynak: `node research/d3/generate.mjs` → `artifacts/d3-cad/output/comparison.json`. Aşağıdaki yuvarlanmış sayılar aynı D3-1 tanımlarından gelir. Rastgele tek puan veya otomatik en iyi aday seçimi yoktur.

## Ortak tanımlar

1. **Brüt gövde hacmi:** uç dolgular ve varsa servis kutusu dahil kapalı mobilya plan ayak izinin birleşimi ×2280 mm (2400−baza80−üst40). Donanımın kapalı ön çıkıntısı hariç nominal mobilya gövde zarfı. D3 servis boşluğu bu brüt hacimde kullanılabilir depolama değildir.
2. **Net geometrik iç depolama:** yalnız yaprak hücrelerin net plan poligonu ×net yükseklik; çekmece bankı hücresi yerine gerçek iç çekmece ölçülerinin hacmi, organizer katıları düşülerek eklenir. Ebeveynler/raf katıları iki kez sayılmaz. Askının üstündeki yüksek boşluk da geometrik hacme dahildir; tamamı erişilebilir hacim değildir. Fiziksel erişilebilir hacim UNKNOWN. Orijinal002'nin0,5mm örtüşmeleri nedeniyle nominal hücre sonucu fiziksel onay değildir.
3. **Raf destek yüzeyi:** askı/çekmece hücreleri hariç, her yaprak aralığının taban destek poligonu. Rafın gerçek15mm ön geri çekilmesi hesaba katılır; taban dahil. Aynı alan farklı yüksekliklerde gerçekten ayrı depolamadır. Askı üstü/altı varsayımsal raf eklenmez.
4. **Erişilebilir raf:** 310×390×70mm zarfın, mevcut çekirdek tarafından ulaşılabilen açık duruşta çarpışmasız düz çıkarılabildiği destek ayak izlerinin birleşimi;20mm derinlik örneklemesiyle **muhafazakâr alt sınır**, evrensel insan erişimi değil.
5. **Askı boyu:** gerçek boru kesim boyu; kullanılabilir boy boru başına40mm uç payı düşülür (mevcut envanter tanımı).
6. **Askı erişimi:**480×550×850mm zarf **merkezinin** düz çıkarma aralığı. Boru üzerinde toplam uzunluk ile aynı kavram değildir. Kanca ayırma ve döndürme NOT_MODELED; fiziksel erişilebilir boru UNKNOWN.
7. **Çekmece hacmi:** net içW×D×H eksi organizer katıları. Model stroku, seçili duruştaki sürekli çarpışma testi sonucudur; katalog ray garantisi değildir.
8. **Gövde sayısı:** orijinal tek paylaşımlı L montajı; D3 ayrı kutu gövdeler. Servis kutusu kullanılabilir dolap sayılmaz.
9. **Oda ayak izi:** brüt nominal gövde/filler plan birleşimi; raf toplam alanıyla karıştırılmaz.
10. **Kapak ek oda alanı:** komşular kapalıyken bağımsız olarak ulaşılabilen en çok90° hareketlerin yaprak+kulp süpürme birleşiminin gövde ayak izi dışındaki bölümü.1° poligonlaştırma,5mm X orta nokta entegrasyonu;2,5mm tekrar farkı≤0,00083m². Bu bir hata üst sınırı değildir. Birleşim, bütün bu yerleri boş bırakma gereğini gösterir; hepsinin aynı anda açılabildiğini göstermez. Gerçek oda engelleri verilmediği için fiziksel oda uyumu UNKNOWN.
11. **Kapalı servis hacmi:** dış kutuW×D×2400 ve altı panel çıkarılmış iç boşluğu ayrı. Bu hacim net depolamaya eklenmez.

## 70 mm analitik dolgu: aynı 12 ölçüt

| Ölçüt | Orijinal001 | D3 001 raf | Orijinal002 | D3 002 raf |
|---|---:|---:|---:|---:|
| Brüt gövde m³ | 6,942600 | 6,851172 | 6,436440 | 6,303972 |
| Net geometrik iç m³ | 6,224075 | 5,110282 | 5,651759 | 4,593353 |
| Raf destek m² | 11,269750 | 10,434436 | 10,210429 | 9,404720 |
| Erişilebilir raf alt sınırı m² | 8,250020 | 10,428674 | 7,266298 | 9,395603 |
| Ham / kullanılabilir askı mm | 1022 /982 | 734 /694 | 1015 /975 | 760 /720 |
| Askı düz çıkarma merkez aralığı mm | 0 | 252,013 koşullu | 0 | 276,034 koşullu |
| Çekmece net iç m³ | 0,268688 | 0,177139 | 0,266077 | 0,184021 |
| Çekmece model stroku mm | 451×3 | 485×3 | 454×3 | 489×3 |
| Kullanılabilir kutu/montaj sayısı | 1 paylaşımlı L | 5 ayrı | 1 paylaşımlı L | 6 ayrı |
| Nominal gövde oda planı m² | 3,045000 | 3,004900 | 2,823000 | 2,764900 |
| Kapak ek boş oda zarfı m², yaklaşık | 1,641255 | 1,393215 | 1,678517 | 1,282044 |
| Kapalı servis dış / iç m³ | 0 /0 | 1,077360 /0,980436 | 0 /0 | 0,884400 /0,784808 |

**0 mm orijinal askı merkezi sonucu**, belirtilen düz zarfın üst ray/cephe engeliyle geçememesidir; insanların hiçbir yöntemle erişemeyeceği iddiası değildir. Orijinal001/002 borusu2272mm'dedir. D3 borusu1700mm'dedir; gerçek kullanıcıya uygunluğu hâlâ bilinmiyor. B derinliği476mm olduğundan002 askısı B koluna taşınmadı;550mm zarf sığmaz.

D3'te raf öne açıklıkları001'de734–920,002'de586–760mm; ilk askı hücresindeki gerçek açık geçiş732/756mm. Rafların en küçük net yüksekliği359/350mm; raf derinlikleri001'de taban592/raf577,002'de A596/581 veB476/461mm. Her rafın ölçüsü, yönü, açık duruş adımları, güvenli poligonları ve engel testi JSON `reach` satırlarındadır. Kanonik değerler aynı destek poligonu yöntemiyle ölçüldü.

Kapak/kulp ön çıkıntısının ve gerçek menteşe ekseninin oda zarfına katkısı fiziksel ürünle doğrulanmalı. Modelin90° kapak/kulp yarıçapı yaklaşık0,32–0,49m mertebesindedir; gerçek odanın minimum mesafesi olarak kullanılamaz. Paftadaki toplu155° stres duruşu ile tablodaki bağımsız≤90° oda zarfı **farklı deneylerdir**.

## Duyarlılık ve iç düzenler

`R`: raf ağırlıklı, tek askı. `A`: ikinci A modülü askıya ayrılmış. Tüm H5 satırları kapalı yüz ve ayrı gövde geometrisinde PASS; raf senaryosu ACCESSIBLE, askı CONDITIONALLY_ACCESSIBLE, fiziksel erişim UNVERIFIED_PHYSICAL. Toplam kapasiteye “tam erişilebilir” denmez.

| Aile/dolgu/düzen | Net iç m³ | Raf m² | Erişilebilir raf ≥m² | Kullanılabilir askı mm | Düz merkez aralığı mm |
|---|---:|---:|---:|---:|---:|
| 001/40/R | 5,186537 | 10,590976 | 10,570964 | 704 | 257,286 |
| 001/70/R | 5,110282 | 10,434436 | 10,428674 | 694 | 252,013 |
| 001/100/R | 5,034028 | 10,277896 | 10,272112 | 684 | 242,005 |
| 001/40/A | 5,226177 | 8,004088 | 7,984076 | 1408 | 521,286 |
| 001/70/A | 5,149390 | 7,882318 | 7,876556 | 1388 | 506,013 |
| 001/100/A | 5,072603 | 7,760548 | 7,754764 | 1368 | 486,005 |
| 002/40/R | 4,661010 | 9,544340 | 9,510708 | 730 | 273,322 |
| 002/70/R | 4,593353 | 9,404720 | 9,395603 | 720 | 276,034 |
| 002/100/R | 4,525696 | 9,265100 | 9,255899 | 710 | 266,034 |
| 002/40/A | 4,718375 | 6,848570 | 6,814938 | 1460 | 563,322 |
| 002/70/A | 4,649973 | 6,743960 | 6,734843 | 1440 | 556,034 |
| 002/100/A | 4,581571 | 6,639350 | 6,630149 | 1420 | 536,034 |

H1/70/R kapalı gövde referansları H5/70/R'nin boyutsal gövdesidir. H1 üst profil/kılavuz gerçek kesiti eklenmediği için bu bir **donanım öncesi geometrik kapasite referansıdır**. H1'in gerçek net kapasitesi, erişimi, stroku ve açık oda alanı UNKNOWN; H5 hareket/erişim sayıları H1'e taşınmaz.

## Gerçek ödünleşme

70/R için001: net iç kayıp **1,113793m³ (%17,895)**; raf kaybı0,835314m²; erişilebilir raf alt sınırı kazanımı2,178654m²; kullanılabilir boru **28,8cm azalır**; çekmece iç hacmi91,548 litre azalır. 002: net kayıp **1,058406m³ (%18,727)**; raf kaybı0,805709m²; erişilebilir raf kazanımı2,129306m²; boru **25,5cm azalır**; çekmece82,056 litre küçülür. Yüzde hesabı bu yeni net hücre hacminden gelir.

70/A seçilirse001 boru1388mm'ye çıkar: orijinale göre40,6cm artış; net hacim kaybı1,074685m³ (%17,267), raf kaybı3,387432m². 002 boru1440mm:46,5cm artış; net hacim kaybı1,001786m³ (%17,725), raf kaybı3,466469m². Erişilebilir raf alt sınırı bu düzende orijinale göre0,373464/0,531454m² azalır. Böylece askı artırmanın bedeli raf olarak da görünür.

Raf paneli sayısı orijinal10'dan19/23'e çıkar, fakat her panel küçülür; sayıyı alanın yerine kullanmayın. A düzeni A2'deki beş raf panelinden vazgeçer:14/18 panel kalır. Orijinaldeki köşe raflarının kaldırılması ve bağımsız kutuların ek yanları hacim kaybının parçasıdır.

Eski0,489m²/%16,06 ve0,4266m²/%15,11 **brüt kullanılabilir kol planı** farklarıydı; bu raporun depolama kaybı oranları değildir. Yeni mobilya gövde ayak izi farkı001'de0,0401m²,002'de0,0581m²'dir: kapalı servis kutusu hâlâ odada yer kapladığından depo kaybı kadar oda alanı geri kazanılmaz.

Kullanıcı bu kayıpları kabul etmedi. Raf/askı tercihi yapılmadı, D3 varsayılan olmadı. Donanım, oda ve insan erişimi doğrulanmadan “daha iyi gardırop” veya üretim PASS denemez.
