# Wardrobe Studio · A3 üretim paketleri son incelemesi

6 Kasım 2026 · Dört örnekte aynı kaynak Design JSON ve güncel çözücü kullanıldı. Önceki paketler `artifacts/final-remediation/production` altında duruyor.

| Örnek | Eski → yeni sayfa | Fiziksel parça | Menteşeli / sürgülü | Poligon | Yeni dosyalar |
| --- | ---: | ---: | ---: | ---: | --- |
| Düz, üç ray | 23 → 25 | 69 | 0 / 3 | 0 | [PDF](artifacts/final-professional-polish/production/straight/wardrobe-professional-straight.pdf) · [ZIP](artifacts/final-professional-polish/production/straight/technical-package.zip) |
| Beşgen L, 18/8 mm | 35 → 40 | 94 | 5 / 2 | 5 | [PDF](artifacts/final-professional-polish/production/diagonal/wardrobe-professional-diagonal.pdf) · [ZIP](artifacts/final-professional-polish/production/diagonal/technical-package.zip) |
| Kör köşe, karma | 31 → 34 | 81 | 4 / 2 | 0 | [PDF](artifacts/final-professional-polish/production/blind/wardrobe-professional-blind.pdf) · [ZIP](artifacts/final-professional-polish/production/blind/technical-package.zip) |
| Asimetrik L, 25/4 mm | 35 → 40 | 94 | 5 / 2 | 5 | [PDF](artifacts/final-professional-polish/production/asymmetric/wardrobe-professional-asymmetric.pdf) · [ZIP](artifacts/final-professional-polish/production/asymmetric/technical-package.zip) |

338 fiziksel parça kodu ve 23 kapak kanadı eşleşti. Dört pakette kritik geometri hatası 0 ve statü **USTA KONTROLÜ GEREKİR**. Her örnekte Design JSON, çözümlenmiş model, kanonik üretim JSON'u, hareket kontrolü JSON'u, tam CSV, SVG paftaları, yazdırılabilir HTML, vektör PDF ve teknik ZIP ayrı dosya olarak bulunur. [Paket listesi](artifacts/final-professional-polish/production/manifest.json) · [Bağımsız PDF denetim özeti ve SHA-256](artifacts/final-professional-polish/pdf-qa.json)

## Kesim ve hareket

| Örnek ve parça kodu | Önce, mm | Sonra, mm | Neden |
| --- | --- | --- | --- |
| Beşgen · P-70570E4D | 389 × 2276 × 18 | 388 × 2276 × 18 | Gerçek eğik açıklık ve yan derzler çıkarıldıktan sonra sığan tamsayı. |
| Asimetrik · P-C0FD8349 | 523 × 555 × 25 | 520 × 555 × 25 | Kalınlığa bağlı iki uç ve merkez derzi. |
| Asimetrik · P-DCA01EE8 | 523 × 555 × 25 | 521 × 555 × 25 | Aynı açıklığın diğer kanadına tamsayı kalan payı. |
| Asimetrik · P-9D020167 | 843 × 2276 × 25 | 840 × 2276 × 25 | Paylaşımlı dikme ve kalınlığa bağlı derz. |
| Asimetrik · P-B003B07E | 843 × 2276 × 25 | 841 × 2276 × 25 | Aynı açıklığın diğer kanadına tamsayı kalan payı. |

Düz ve kör köşe örneklerinde kesim eni/boyu değişmedi. Düz eksen güncellemesi kanat ve kulp dönüşünü değiştirdi. Bir cephe genişliği 800 → 1000 mm olduğunda yeni test aynı kodun kanat enini 100 mm büyüttü. Bu yeni kesim SVG/PDF'in ortak vektör paftasında ve CSV satırında doğrulandı.

| Örnek | Kapak tablosu | Komşular kapalı, nominal → güvenli |
| --- | --- | --- |
| Düz | s. 25 | Üç sürgü, hareket aralığı ve ray numarası. |
| Beşgen 18/8 | s. 39–40 | Köşe 110° → 5,1° · B1 iç 110° → 103,9° · B1 dış 110° → 110° · üstler 155° → 155°. |
| Kör | s. 34 | Üst sol 155° → 136° · üst sağ 155° → 155° · B1 iç 110° → 79° · B1 dış 110° → 110°. |
| Asimetrik 25/4 | s. 39–40 | Köşe 110° → 12,8° · B1 iç 110° → 103,8° · B1 dış 110° → 110° · üstler 155° → 155°. |

Köşe kanatlarının engeli komşu kanattır. B1 iç kanatlarında alt ray sınırı belirler. Kör örneğin üst sol kanadı B1'e temas eder. Her satır kesim, kapalı dünya merkezi, üst/alt Y, eksen, el/yön, derz, kulp ve donanım statüsünü veya ray aralığını verir. Asimetrik köşede başka bir destekli el 61,3° sağlar. Bu seçenek Design'daki el tercihini değiştirmeden gösterilir. [Beşgen hareket](artifacts/final-professional-polish/production/diagonal/motion-checks.json) · [Kör köşe hareketi](artifacts/final-professional-polish/production/blind/motion-checks.json) · [Asimetrik hareket](artifacts/final-professional-polish/production/asymmetric/motion-checks.json)

## Bağımsız beşgen hesabı

Gövde ön doğrusu için `hypot(ArmA − depthB, ArmB − depthA)` kullanılır. 900/900 mm kol ve 600/600 mm gövdede dış doğrultu `hypot(300, 300) = 424,264… mm`. 600/480 mm gövdede `hypot(420, 300) = 516,140… mm`. Özel kesim paftası ise panelin kendi yerel koordinatlarını kullanır.

| P-22170AE2 tabanı | Yerel V1–V5, mm | Bağımsız V3–V4 mesafesi | Shoelace alanı |
| --- | --- | ---: | ---: |
| Beşgen 18/8 | (0,0) · (874,0) · (874,592) · (592,874) · (0,874) | √(282² + 282²) = 398,808… mm | 724114 mm² |
| Asimetrik 25/4 | (0,0) · (871,0) · (871,596) · (476,871) · (0,871) | √(395² + 275²) = 481,300… mm | 704328,5 mm² |

Python denetimi TypeScript hesaplarını çağırmadan kenarları, iç/dış açıları, alanı ve kapalı kanat dönüşünü yeniden hesapladı. Çizimde V/E sırası, kalınlık, damar, ön/arka yönü, dünya yerleşimi, montaj kotu ve eş parça kodları kaldı. Kenar ve açı yazıları 0,1 mm ve 0,1° ile gösterilir. Koordinatlar kesim kaynağıdır. [Bağımsız denetim betiği](scripts/final-professional-pdf-qa.py) · [Asimetrik özel kesim paftası](artifacts/final-professional-polish/production/asymmetric/svg/10-P-22170AE2.svg)

## Pafta düzeni, baskı ve montaj

- Tablo gövdesi 3,25 mm, yaklaşık 9,2 pt. Uzun hücreler satır yüksekliğiyle birlikte sarılıyor. Açık/koyu satır ayrımı, tekrarlanan sütun başlıkları ve sayfaya sığan gruplarla toplam sayfa sayısı 124'ten 139'a çıktı. Çizim ölçü yazıları büyütüldü. Kısa montaj ve malzeme paftalarında çizime ait boşluk kaldı.
- Kör köşe s. 8 artık kör klapa ve yanaşan kol açıklamasını gösteriyor. Beşgen özel pafta göndermesi yalnızca ilgili geometrilerde bulunuyor. Düz ve kör örnekte özel poligon sayısı sıfır.
- A3 yatay 420 × 297 mm MediaBox tüm sayfalarda doğrulandı. Sayfayı %100 yazdırma talimatı, paftadaki 1:15 veya 1:5 çizim ölçeğinden ayrıldı. Ölçü rakamları esas alınır. 50 mm kontrol çizgisi fiziksel yazdırma ayarını kontrol etmek içindir. Fiziksel cetvel kontrolü atölyede yapılır. SVG, HTML ve ZIP içindeki açıklama aynı kuralı kullanır.
- Patlatılmış montaj görünümünde numara ve parça kodu bağı korundu. Dikme referansları ve nominal donanım türleri planlama verisi sağlar. Bant ve ham kesim payı, kanal ve delik merkezi, ray sabitleme, cam/ayna ham kesim, bağlantı elemanı ve katalog taşıma kapasitesi seçilen ürünle ustaca doğrulanmalıdır. Menteşe adedi ürün seçimine bırakıldı.
- Poppler ile 139 sayfanın tamamı render edildi. Genel dizilim toplu görsellerde, kör s. 8, beşgen kapak tablosu ve asimetrik özel kesim ayrıntıda kontrol edildi. CSV kodları ve en/boy/kalınlık, SVG referansları, ZIP'teki dosyaların birebir eşliği ve PDF metnindeki parça kodları denetlendi. [Render dizini](artifacts/final-professional-polish/pdf-rendered) · [Beşgen sayfa özeti](artifacts/final-professional-polish/pdf-rendered/diagonal-overview-3.jpg) · [Asimetrik sayfa özeti](artifacts/final-professional-polish/pdf-rendered/asymmetric-overview-2.jpg)

## Kabul maddeleri

| No | Sonuç ve kanıt |
| --- | --- |
| 6 | Geçti. 23 kanadın kapalı konumu ve kesim eşleşmesi. Menteşelilerde pivot ve yerel ofsetten bağımsız yeniden hesap. |
| 15 | Geçti. Yeni kapak teknik tabloları ve 3D kanat değerleri. |
| 16 | Geçti. Düzenleme testi ve dört örnekte PDF/CSV/SVG/JSON eşleşmesi. |
| 17 | Geçti. Ayrı dizinde dört yeni PDF ve ZIP. |
| 18 | Geçti. Bağımsız 398,8 ve 481,3 mm hesabı, açı ve alan kontrolü. |
| 19 | Geçti. A3 render, daha büyük tablo yazısı, sarma ve başlık tekrarları. |
| 20 | Geçti. Kör s. 8 ve düz planın tipine uygun açıklaması. |

Tarayıcıda geniş önizleme, sayfa geçişi, iki sığdırma modu ve parça koduyla arama görüldü. PDF, CSV ve ZIP başlatma bildirimleri görüldü. Tarayıcı aracı dosya tamamlama olayı vermedi. Bu kontrolün dosya teslimi kısmı yukarıdaki yerel paketlerin bağımsız denetimiyle yapıldı. [Önizleme](artifacts/final-professional-polish/browser/22-production-preview.jpg) · [Tarayıcı indirme gözlemi](artifacts/final-professional-polish/browser/download-status.json)
