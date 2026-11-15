# D3/B3 taşınabilir CAD teslim kabulü

15 Kasım 2026. **DENEYSEL CAD — FİZİKSEL ÜRETİM ONAYI YOK.** Bunlar araştırma galerisi ZIP'leridir; engelli üretim CSV/ZIP çıkışı değildir.

## Gerçek teslim dosyaları

Ortak Windows klasörü: `C:\dev\Wardrobe-Studio\output\pdf\cad-delivery-2026-11-15`.

| Dosya | Tam boyut (byte) | İçerik |
| --- | ---: | --- |
| D3_CAD_GALLERY_PORTABLE.zip |13747748|16 varyant×7 görünüm;168 hash denetimli dosya+manifest |
| B3_CAD_GALLERY_PORTABLE.zip |3393809|5 varyant×7 görünüm;45 hash denetimli dosya+manifest |
| D3_CAD_COMPARISON_ATLAS.pdf |1511998|34 sayfa, seçili002/70/hanging açıklamalı sayfa2 |
| B3_ENGINEERING_COMPARISON_ATLAS.pdf |789827|11 sayfa, üç sınırlı aday+orijinal+elenen155° örnek |

Tam yollar:

```text
C:\dev\Wardrobe-Studio\output\pdf\cad-delivery-2026-11-15\D3_CAD_GALLERY_PORTABLE.zip
C:\dev\Wardrobe-Studio\output\pdf\cad-delivery-2026-11-15\B3_CAD_GALLERY_PORTABLE.zip
C:\dev\Wardrobe-Studio\output\pdf\cad-delivery-2026-11-15\D3_CAD_COMPARISON_ATLAS.pdf
C:\dev\Wardrobe-Studio\output\pdf\cad-delivery-2026-11-15\B3_ENGINEERING_COMPARISON_ATLAS.pdf
C:\dev\Wardrobe-Studio\output\pdf\cad-delivery-2026-11-15\DELIVERY_SHA256.json
C:\dev\Wardrobe-Studio\output\pdf\cad-delivery-2026-11-15\ORIGINAL_25_4_OVERLAP_AUDIT.json
C:\dev\Wardrobe-Studio\output\pdf\cad-delivery-2026-11-15\previews
```

ZIP SHA-256: D3`202f67d33b155abb0227bb5641403637fc6485345e95727db1f7524f00eac201`; B3`9b0d4c9144eeee43fa3f6aa66520319558db2924058a7c984fce85304ee837e4`.

PDF SHA-256: D3`31ff010f45be85dc0129eda9deb81af8f9581d964ecde1a53486bea63404bd70`; B3`83054967bacba7fb15604c586d3e15c43a9bceab536777313270c1ca31601a95`.

## Önceki galerinin durumu ve yeni paket

Eski3cc309c galerisi sıfır script,16 göreli SVG, göreli JSON indirme bağlantıları ve yerel makale hash'leri içeriyordu. CDN/fetch yoktu; yalnız index.html paylaşımı kardeş dosyaları kaybediyordu. Yeni HTML tüm147 görüntüyü gömülü SVG/data-URL olarak taşır; CSS/JS inline, aktif CDN/API/hesap/token yok. SVG içindeki3D rasterleri de gömülüdür. Varyant/hash ve yedi görünüm menüsü çalışır. Ham SVG/JSON, README, manifest ve atlas kardeş dosyalardır. HTML tek başına görsel seçim için yeterlidir; indirme bağlantıları için ZIP bütünlüğü korunmalıdır.

D3 orijinal18/8 ve25/4,40/70/100 mm dolgu, raf/askı düzenleri ve iki H1 kapalı ön elemesi korunur. H1 açık hareketi açıkça NOT_MODELED; H5 ideal pivot. Önceki D3'ün34 kanıt dosyası+SHA256.json özgün hash'leriyle `source-d3-original` içine kopyalandı. Seçili hash `#EXPERIMENTAL_D3_002_70_hanging_H5`, B3 varsayılanı `#EXPERIMENTAL_B3_003_DUAL3`.

## Doğrulama ayrımı

- ZIP'ler özgün worktree/staging dışında `verification-independent/D3` ve`B3` klasörlerine çıkarıldı.213 manifest girdisinin tamamında byte veSHA eşleşti; ZIP path traversal denetimi geçti. Tüm statik bağlantılar ve her varyantın CAD JSON kimliği kontrol edildi.21 varyantın147 görünümü gerçek tarayıcıda sınırlı loopback HTTP üzerinde seçildi; görüntü kimliği, yüklenme ve2400 px doğal en doğrulandı.
- Otomatik tarayıcı güvenlik denetimi doğrudan file:// navigasyonunu reddetti; başka protokol açığı veya alternatif tarayıcıyla aşılmadı. HTTP sonucu file-origin testi diye gösterilmez. Kullanıcı ZIP'leri kendi ayrı klasörlerine çıkarıp index.html'e çift tıkladığını ve iki galeride kapalı/açık görünümlerin çalıştığını **doğrudan bildirdi**. Bu bölüm USER_REPORTED_FILE_OPEN_PASS'tir; ajanın doğrudan file-origin gözlemi değildir. İnternet fiziksel olarak kesilmedi; çevrimdışı gereksinimi aktif ağ bağımlılığı olmayan içerik incelemesiyle desteklenir.
- HTML-only bağımsız kopyaları `verification-html-only` altındadır. Dört paket testi tüm gömülü görünüm/uyarıları, JSON, bağlantı ve manifestleri doğrular. Tekrarlanan finalize aynıZIP SHA'larını verdi. Veri/çizimler deterministik; Three.js raster yakalamalarında farklıGPU piksel eşitliği garanti edilmez.
- İki atlasın toplam45 sayfası Poppler ile render edildi, bütün sayfalar temas sayfalarında ve seçili sayfalar büyütülerek incelendi. Noto gömülü, sıfır sayfa dışı karakter; kırpılma/font eksikliği saptanmadı. Her sayfada tam fiziksel üretim onayı yok uyarısı var. Plan/cepheler vektör;3D'ler derinlik tamponlu gerçek katı görüntüleridir. Önce saptanan vektör sıralama görünürlük kusuru bu teslimden önce giderildi. B3 son sayfalarında92° koşulu ve155° negatif çevrim başarısızlığı yazılıdır.
- `previews` her21 varyant ve iki genel bakış için2400×1680 SVG, ayrıca sekiz2500 px PNG içerir. Bunlar üretim paftası kabulü değildir. Tüm teslim dosyalarıSHA manifestinde listelenir. Kaynak/raporlar Git'te, hamgörseller ve ZIP/PDF'ler yerel artifacts/output içinde kalır; herkese açık yayın veya GitHubRelease oluşturulmadı.

## Regresyon kapıları

Temiz npm ci,284 uygulama testi (2 worker/30 saniye),24 eski D3,16 B3,4 paket testi başarılı.12 kanonik imza/338 parça korundu. npm run build ve npm run deploy:check başarılı; Wrangler yalnız dry-run. npm audit ve npm audit --omit=dev sıfır açık. Vite'ın mevcut>500 kB chunk uyarısı sürer; build hatası değildir.

Yeni araştırmanın12 dist dosyası önceki araştırma tabanıylaSHA olarak aynı; Tailwind'e yeni sınıf sızmadı. f8/3cc tabanındaki eski `.contents` kuralı gerçek üretim CSS'inden farklıdır, buna bağlıJS hash'leri de farklıdır. Üretim CSS'ine rastgele müdahale edilmedi. Canlı11 HTTPS dosyası **bd51910 üretim worktree dist'iyle** birebir eşleşti; araştırma build'i canlı referans olarak kullanılmadı. Üç P0 canlı UI'da tam CSV/ZIP kapalı, tanısalPDF/SVG açık. Dört kanoniğin tanısal çıktıları gerçek çekirdek yazarlarıyla ayrıca üretildi; kullanıcı dosyaları değiştirilmedi.

Kaynak komutlar ve yeniden üretim sınırları: [B3 README](research/b3/README.md), [galeri README](research/portable-cad/README.md). Otomatik kanıtlar `artifacts/portable-cad`, kalite logları üst`artifacts/b3-blind-cad` klasöründedir.
