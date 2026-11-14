# D3 araştırma aracı

**DENEYSEL CAD — ÜRETİM ONAYI YOK**

Uygulamaya import edilmez. Mevcut çekirdek salt okunur esbuild köprüsüyle çağrılır; yeni bağımlılık yok. Design v1 şeması, kanonik örnekler, kayıt sistemi ve üretim kilitleri değiştirilmez. `manufacturingExport()` daima reddeder. `.cad.json`, uygulamaya yüklenebilir `.wardrobe.json` değildir. İki geçerli düz Design bileşeni, ayrı montaj dönüşümleriyle bir araya gelir; analiz bağlamı kalıcı bir Design v1 L modeli değildir.

Proje/worktree kökünde:

```powershell
npm ci
node --test research/d3/cad.node-test.mjs
node research/d3/generate.mjs
node research/d3/generate.mjs artifacts/d3-cad/repeated
```

`artifacts/d3-cad/output/index.html` dosyasını açın; SVG paftalar, deneysel katı geometri JSON'ları, `comparison.json` ve `SHA256.json` aynı klasördedir. Dosya SHA manifestleri iki çalıştırmada eşleşmelidir. Çıktı dizini worktree içinde olmak zorundadır. Tarih/rastgele kimlik kullanılmaz. Ana uygulama testleri ayrı olarak `npm test -- --run --maxWorkers=2 --testTimeout=30000` ile çalışır.

`buildPrototype(api,{kind:'diagonal'|'asymmetric',fillerMm:40|70|100,layout:'shelf'|'hanging',mechanism:'H5'|'H1',maxLeafMm:550})` parametrik giriş noktasıdır. Desteklenmeyen girdiler sessizce düzeltilmez. Modül dağıtımı, mevcut çözümleyicinin merkez yuvarlamalarında yarım mm panel taşmasını önlemek için 2 mm adımlarla yapılır. Bu bir donanım toleransı değildir. Tüm niyet ve kesim ölçüleri tamsayı mm; dönme/izdüşüm geometrisi kesirli koordinat kullanabilir.

Dosyalar: `engine.mjs` çekirdek köprüsü; `prototype.mjs` bağımsız gövdeler/servis kutusu; `geometry.mjs` dönüşüm ve poligon işlemleri; `access.mjs` gerçek katı engellere karşı düz çıkarma; `metrics.mjs` ortak karşılaştırma tanımları/hareket çevrimleri; `hardware.mjs` belgesel ön eleme; `visuals.mjs` filigranlı SVG; `generate.mjs` 16 karşılaştırma satırı/kanonik imzalar; `cad.node-test.mjs` bağımsız Node testleri.

H5 hareketi `IDEALIZED_HINGE_SIMULATION`; H1 hareketi `NOT_MODELED`. Gerçek menteşe montajı/yörüngesi `HARDWARE_KINEMATICS_UNVERIFIED`. Raf erişimi, 310×390×70 mm zarfın sabit açık duruşta çarpışmasız düz çıkarılabildiği destek yüzeyinin muhafazakâr alt sınırıdır. Askıda 480×550×850 mm senaryosunun **merkez konum aralığı** ölçülür; bütün borunun fiziksel erişilebilir boyu değildir. Askının borudan ayrılması/dönmesi `NOT_MODELED`, insan erişimi `UNVERIFIED_PHYSICAL`. Alan hesabı insan ergonomisi onayı üretmez.

Bu klasördeki `.gitignore` içindeki `*`, Tailwind otomatik içerik taramasını deneyden uzak tutar. İncelenen araştırma kaynakları `git add -f research/d3/<dosya>` ile açıkça izlenir. Yeni dosyaları yanlışlıkla atlamayın. Üretilmiş büyük kanıtlar `artifacts/` içinde kalır. Önceki araştırmanın `.contents` CSS etkisi bu görevde temizlenmez; aynı tabanın build'iyle karşılaştırılır. `main` üretim build'i farklı tabandır.

Tam kapsam ve kabul sınırları kökteki dört `D3_*.md` raporundadır. Bu dal için main merge/yayın yetkisi yoktur.
