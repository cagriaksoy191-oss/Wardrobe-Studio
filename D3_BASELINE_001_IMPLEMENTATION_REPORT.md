# D3-BASELINE-001 uygulama raporu

15 Kasım 2026 · Yerel aday · `fix/d3-baseline-001-exact-panel-centering`

## Kök neden

Üretim tabanı `c57a4b2de7acc08a679b33136dacaa6dde6c13d9` üzerinde bağımsız katı ölçümü 25/4 fikstüründe 20 nominal penetrasyonu ve 133.812,5 mm³ toplam çift hacmini yeniden üretti. Eski iki kanıt aynı çiftleri gösterdi. Dünya planı kutu köşelerine dönüşüm ve öteleme uygulanarak, beşgenlerde gerçek poligon kullanılarak hesaplandı. Plan kesişimi ile Y aralığının çarpımı hacmi verdi. Çiftlerin her birinde X ya da Z boyunca 0,5 mm penetrasyon vardı. Bağımsız geometrik sıfır hesabının hassasiyeti 0,0000001 mm. [Eski ölçüm ve tarihsel kontrol](../baseline-overlap-and-impact.json) · [Gerçek adayla 20 çiftin tam karşılaştırması](../evidence/twenty-joints-before-after.json)

| Kaynak ve birleşim | Çift | Önceki nominal çift hacmi | Aday |
| --- | ---: | ---: | --- |
| Köşe A/B yan dikmeleri ile beşgen alt, üst ve üç raf | 10 | 67.000 mm³ | Her çift sıfır hacim ve ortak yüzey |
| A1 sağ dikme ile yatay bölücü, A2 sağ dikme ile beş raf ve B1 sağ dikme ile dört raf | 10 | 66.812,5 mm³ | Her çift sıfır hacim ve ortak yüzey |
| Toplam | 20 | 133.812,5 mm³ | 0 mm³ |

Örneğin A ve B tarafında `900 - Math.round(25 / 2) = 887` merkez ve 874,5 mm iç yüz üretiyordu. Beşgen panelin kenarı `900 - 25 = 875` mm. Adayın 887,5 mm merkezi her iki yüzü 875 mm’de buluşturuyor. A2 rafında 1015 mm genişliğin yuvarlanmış yarısı, sağ ucu 2955,5 mm’ye taşıyordu. Doğru yarıyla uç ve dikmenin iç yüzü 2955 mm’de buluşuyor. Temas alanı 20 çift boyunca 11.525–14.900 mm². Bu birleşimlerde niyet, modelde temsil edilen düz kenar birleşimidir. Kanal ve geçme için ayrı üretim detayı bulunuyor olsaydı bu çiftlerden ayrı sınıflandırılırdı. [Nominal birleşim yakınlaştırması](../evidence/visual/nominal-joints-closeups.png)

## Kaynak düzeltmesi

- Köşe dikmelerinin A genişlik ve B derinlik ekseninde `arm - Math.round(t / 2)` yerine `arm - t / 2` kullanıldı. Dikme ve arkalıkların diğer eksenleri de kenardan gerçek yarım boy ile yerleşiyor. [Köşe çözücüsü](src/core/solver/cornerSolver.ts#L106)
- Normal gövdenin açıklık merkezi, dikme/tabla derinlik merkezi ve arkalık merkezinde dış veya iç sınırdan kesin yarım uzunluk kullanıldı. Böylece tek gövde genişliği, boyu, net derinliği veya arkalık kalınlığı panelin karşı yüzünü kaydırmıyor. [Gövde merkezi](src/core/solver/carcassSolver.ts#L893) · [Gövde panelleri](src/core/solver/carcassSolver.ts#L964)
- Dikey bölücü yüksekliği/derinliği ve yatay bölücü genişliği/derinliği, raf grubu ve çift askı orta rafı fiziksel sınırlarına göre ortalanıyor. A kolunun boyuna ekseni dünya X, B kolunun boyuna ekseni dünya Z. Raf derinliği kendi kesim ölçüsünden gelir ve arka yüz net derinliğin başlangıcına dayanır. [Dikey bölücü](src/core/solver/carcassSolver.ts#L1368) · [Yatay bölücü](src/core/solver/carcassSolver.ts#L1440) · [Raf grubu](src/core/solver/carcassSolver.ts#L1643) · [Çift askı ara rafı](src/core/solver/carcassSolver.ts#L1806)
- Tamsayı ve yarım tamsayı mm, bu ölçü aralığında IEEE-754 sayı biçiminde tam temsil edilir. Merkez koordinatı panelin kesim ölçüsünden ayrı. Gövde, raf veya kapak uzunluğu gibi tasarım ölçüsü dağıtımındaki yuvarlamalar, kapak boşluk kararları ve gösterim hassasiyeti kendi sözleşmelerini sürdürür. Metre dönüşümü sahnenin sorumluluğundadır.
- Statik ön kontroldeki 0,500001 mm eşiği korundu. Bağımsız hacim hesabı ve regresyon testleri yüzey temasını bu eşik olmadan ayırdı. Nominal temas doğrulaması atölye montaj toleransını belirlemez. [Üretim ön kontrolü](src/core/production/staticPreflight.ts#L53)

Üretim kapıları ve hareket sistemi kendi kaynaklarına dokunulmadan doğrulandı. Üç P0 tanısal belge akışında ve tam CSV/ZIP kilitli. Model ve donanımın fiziksel kabulü açık. [Kanonik farklar](CANONICAL_GEOMETRY_BEFORE_AFTER.md) · [Geometri matrisi](GEOMETRY_REGRESSION_MATRIX.md) · [Kayıt uyumluluğu](LEGACY_DESIGN_COMPATIBILITY_REPORT.md) · [Kabul kararı](D3_BASELINE_001_RELEASE_DECISION.md)
