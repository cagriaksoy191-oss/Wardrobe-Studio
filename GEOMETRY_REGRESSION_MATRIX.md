# Yapısal panel geometri regresyon matrisi

41 yeni deterministik test. 40 test, on ana panel kalınlığı ile dört geçerli kurgu kombinasyonunu kapsar. Bir test asimetrik 25/4 üretim fikstürünün 20 birleşim yüzeyini doğrudan sabitler.

| Profil | Yapısal düzen A/B | Derinlik A/B mm | Arkalık mm | Köşe kolları A/B mm | İlk bölme A/B mm | Yükseklik mm |
| --- | --- | --- | ---: | --- | --- | ---: |
| Simetrik | Ayrı / ayrı | 600 / 600 | 8 | 900 / 900 | 480 / 620 | 2400 |
| Asimetrik | Paylaşımlı / paylaşımlı | 601 / 479 | 7 | 901 / 903 | 801 / 702 | 2401 |
| Asimetrik | Ayrı / paylaşımlı | 600 / 480 | 3 | 905 / 907 | 461 / 980 | 2401 |
| Simetrik | Paylaşımlı / paylaşımlı | 599 / 599 | 5 | 900 / 900 | 742 / 877 | 2400 |

Her satır `12, 16, 17, 18, 19, 22, 24, 25, 26, 36 mm` ile çalıştırıldı. Ana panel şeması 12–36 mm tamsayı, arkalık şeması 3–18 mm tamsayı kabul eder. Preset düğmeleri bu aralığın alt kümesini gösterir. L birleşiminde ana panel ve arkalık kalınlığı iki kolda eşleşir. Matris varsayılan 20 mm uç klapasını boy dağıtımında hesaba katar. [Şema](src/core/schema/designSchema.ts#L173) · [Tasarım kısıtları](src/core/schema/designConstraints.ts)

Her kolda dar 181 mm hücre, ona bitişik esnek hücre, 931 mm sabit dikey aralık, yatay ve dikey bölücü, ayarlanabilir raflar ve çift askı ara rafı yer alır. Hem genişliğin hem yüksekliğin tek/çift durumları ile arkalık kalınlığından kaynaklanan net derinlik çift/tek durumları kapsanır.

Kontroller gerçek yüz koordinatlarını, panel kalınlığı ve enini, tamsayı kesim ölçülerini, dikme ve arkalık sınırlarını, köşe tablalarının iki eksen temasını ve kararlı parça kimliklerini karşılaştırır. Yapısal hacim taraması Y aralığıyla sıfır toleranslı dışbükey plan ayırıcı eksenini birlikte kullanır. 40/40 kurguda pozitif hacimli kesişme bulunmadı. 20 birleşimin aday temasına ilişkin bağımsız poligon ölçümü de 20/20 yüzey teması verdi. [Uygulama testi](tests/exact-panel-centering.test.ts) · [Çift bazlı bağımsız ölçüm](../evidence/twenty-joints-before-after.json)

Kanonik kör köşe ve düz örnekler ayrıca gerçek çıktı ve hareket denetiminde yer aldı. Ölçüm yapısal gövde levhalarını kapsar. Dekoratif bitiş, hareketli kanatlar ve tasarlanmış hareket temasları kendi yerleşim ve güvenlik kurallarına tabidir. Fiziksel donanımın 1:1 montaj deneyi ayrı kabul konusudur. [Dört kanonik model](CANONICAL_GEOMETRY_BEFORE_AFTER.md)
