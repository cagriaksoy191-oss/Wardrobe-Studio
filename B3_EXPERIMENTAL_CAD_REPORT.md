# B3 deneysel kör köşe CAD kabulü

15 Kasım 2026. **DENEYSEL CAD — FİZİKSEL ÜRETİM ONAYI YOK.** Araştırma dalı `research/b3-blind-corner-cad`, taban `3cc309c616ec95b382487e535ddc53d9cdcecca4`. Tarihsel D3 çalışma ağacı ve donanım araştırması korundu. Uygulama kaynakları, preset, şema v1, kayıt sistemi, solver, güvenli kurtarma ve üretim kapıları değiştirilmedi. Main'e merge ve Cloudflare deploy yapılmadı.

## Karar

Üç sınırlı B3 düzeni kapalı cepheyi ve 451 mm karşılaştırma strokunu birlikte sağlayan **EXPERIMENTAL_GEOMETRY_PASS / ACCESS_PARTIAL / HARDWARE_UNVERIFIED / PHYSICAL_TEST_REQUIRED** adaylarıdır. Fiziksel olarak kullanılabilir hacim UNKNOWN; WS-UX-003 kapanmadı. Hiçbiri varsayılan tasarım seçilmedi veya üretime onaylanmadı. Kapasite kaybına kullanıcı onayı varsayılmadı.

`SINGLE3`: tek dar kolonda üç dış çekmece ve üst askılık, diğer A kolonunda raf. `DUAL3`: iki kolonda altışar değil, toplam altı çekmece ve iki üst askılık. `DUAL2`: iki kolonda toplam dört yüksek çekmece ve iki üst askılık. Sınırsız tam boy 155° `DUAL3_UNLIMITED155`, hatalı sırada ~10,675 mm duruş ve başlangıca dönememe nedeniyle sistem olarak **NO_GO**. Kapalı geometri PASS bu olumsuz hareket sonucunu geçersiz kılmaz.

## Gerçek deneysel montaj

- Dış boyutlar A/B 3000/2600 mm, yükseklik2400, derinlik600/600, gövde18/arkalık8 mm; baza80, üst dolgu40 ve uç dolgu20 mm. A1 kör1250 korunur; eski A2 1730,864+866 mm'ye; B11910,954+956 mm'ye ayrılır. Beş bağımsız gövde, 10 menteşeli kanat, sıfır sürgü/üst sürgü rayı vardır.
- Alt çekmece bölgesi690 mm; dış cephe önleri18 mm. Üst askı kapakları bağımsız1552 mm yüksekliğinde ideal H5; tam boy kapaklar2276 mm. Kanat genişliği286–475 mm; 650–800 kg/m³ levha varsayımıyla kanat ahşap kütlesi7,616–15,568 kg. Donanım/kulp kütlesi, menteşe adedi ve taşıma kabulü bilinmiyor.
- Tam boy kanatlar için **92° analitik limit**, üst askı kanatlarında155° ideal pivot kullanılır. Gerçek71B7550+70T7553.09 bir ön eşleştirmedir; üretici bağlantı yörüngesi değildir. Bütün kanatlar aynı anda155° açılamaz. Galerinin açık resmi ilk askı bölümü ve çekmecelerin çarpışma kısıtlı duruşudur.
- Kör sabit ön panel yalnız bu deneysel çözülen modelde Z591'den610 mm'ye alınır (arka yüz601 mm). Böylece iç yatay panellerle iki başlangıç örtüşmesi kalkar. Kanonik solver ve JSON değiştirilmedi. 92° limit ve15 mm çekmece kutusu da yalnız araştırma montajının türetilmiş verisidir; Design v1 bu ayrıntıları tek başına yeniden üretemez, CAD JSON uygulamaya import edilmemelidir.
- A1 bağlantılı kör depolamadır; D3'teki mühürlü servis kutusuna eşit sayılmaz. Önü670 mm örtülü, kalan net açıklık544 mm. Valiz/hurç yerleştirme ve dönüş yolu modellenmedi. Geometrik kapalı servis hacmi0, fiziksel olarak kullanılamayan kör hacim UNKNOWN.
- Raylar için21×28,5×503 mm ve menteşeler için50×120×60 mm analitik rezerv kutuları çizildi. Bunlar gerçek ürün CAD'i veya doğrulanmış çarpışma katısı değildir. Vida/delik/bağlantı elemanı uydurulmadı.

## Teslim ve kabul

Tam ölçüler, hacimler, hareket adımları, statik ve hareketli gerçek katılar bağımsız Node aracıyla hesaplanır; `research/b3/README.md` tekrar adımlarını verir. Galeri 3D görüntüleri aynı fiziksel katılardan Three.js derinlik tamponuyla alınmıştır; ressam sıralamasının yanlış örtme riski giderildi. Plan/cephe/erişim çizimleri vektördür. Döndürülebilen ürün CAD'i, STEP veya üretici mekanizma CAD'i teslim edildiği iddia edilmez.

284 uygulama +24 mevcut D3 +16 B3 +4 paket testi geçti.12 kanonik SHA ve69+94+81+94=338 parça korundu. npm ci/build/deploy:check ve iki npm audit başarılı. Yeni araştırma tabanına göre12 build dosyası birebir aynı. Eski araştırmadan gelen `.contents` CSS farkı hâlâ vardır; bu build canlı üretim bundle'ı sayılmaz. Canlı11 dosya gerçek main dist referansıyla ayrıca eşleşti.

Gerçek HTTPS'de üç P0 için CSV/ZIP düğmeleri kapalı, tanısal PDF/SVG düğmeleri açık doğrulandı; çekirdek tanısal PDF/SVG dosyaları ayrıca üretildi. Kilit UI katmanındadır; düşük seviyeli CSV/ZIP üreticilerinin bağımsız güvenlik sınırı olduğu iddia edilmez. WS-UX-009a'nın31 testi284 içinde geçer. WS-UX-001/002/003, WS-UX-011 ve WebGL kaynak/GPU borcu açık kalır.

Cloudflare panelinde mevcut build `9ea75ddd-9305-4961-a6c5-637303c94522`, Worker `c1a6055a-b376-4317-8bbf-32409938a10c`, main `bd5191052800641a8582e45b21896ddcb431a215`, Ready/%100. Preview branch builds kapalı yeniden okundu. Yalnız araştırma dalını özel depoya göndermek kapsam içindedir; üretim ayarı değiştirilmedi. Başka worktree'ler, iki mevcut kök untracked rapor ve kullanıcı kayıtları korundu.

İlgili kanıtlar: [erişim](B3_DRAWER_AND_HANGER_ACCESS.md), [kapasite](B3_STORAGE_COMPARISON.md), [donanım](B3_HARDWARE_FIT_AND_UNCERTAINTY.md), [fiziksel kabul](B3_PHYSICAL_VALIDATION_SPEC.md), [20 örtüşme](ORIGINAL_25_4_PANEL_OVERLAP_AUDIT.md), [gerçek ZIP/PDF teslimi](CAD_GALLERY_PORTABILITY_VERIFICATION.md).
