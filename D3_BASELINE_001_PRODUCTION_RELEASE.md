# D3-BASELINE-001 üretim yayını

16 Kasım 2026 · **FIXED_AND_PRODUCTION_VERIFIED**

[Canlı Wardrobe Studio](https://wardrobe-studio.cagriaksoy191.workers.dev/)

## Doğrulanmış geometri yayını

| Kayıt | Değer |
| --- | --- |
| Geometriyi yayımlayan GitHub `main` | `3dc5b5ae8fbba6cd78dbc7bbd41dc4c6cf2d32f7` |
| Solver değişikliği | `0fdc0369e6287e6f79d78175e139e1fe17c5ada5` |
| Geometri testleri | `e9a42b6b64503c52436bfb299310bd791b43c148` |
| İlk Cloudflare build | `a80737ce-58d4-4818-806d-91d90b8931d8` |
| Geometri kabulündeki Worker | `b002bb84-1561-403b-b23c-6a991b1d2459` · Ready · %100 üretim trafiği |
| Önceki üretim ve geri dönüş tabanı | `c57a4b2de7acc08a679b33136dacaa6dde6c13d9` · `9ce09ac8-d627-421a-88a7-3f6b7a66e0d5` |
| Plan | Workers Free · mevcut workers.dev alan adı |

Bu rapor ilk geometri yayınının kabul kaydıdır. `main` üzerindeki yalnız Markdown kapanış kaydı mevcut izleme ayarıyla yeni bir build çalıştırabilir. Güncel dağıtımın kaynak commit’i, build’i, Worker kimliği ve trafik payı servis kaydından okunur. [Geometri commit’i](https://github.com/cagriaksoy191-oss/Wardrobe-Studio/commit/3dc5b5ae8fbba6cd78dbc7bbd41dc4c6cf2d32f7) · [Geometri build günlüğü](https://dash.cloudflare.com/b76b247b22f0678a722cad37767e2b19/workers/services/view/wardrobe-studio/production/builds/a80737ce-58d4-4818-806d-91d90b8931d8) · [Etkin dağıtım](https://dash.cloudflare.com/b76b247b22f0678a722cad37767e2b19/workers/services/view/wardrobe-studio/production/deployments)

## Nominal birleşim ve güvenlik

- Bağımsız katı hesabı önceki canlı kaynak tabanında 20 çift ve toplam 133.812,5 mm³ pozitif nominal kesişimi yeniden üretti. Yayınlanan kaynakta 20/20 çift ortak yüzeyde birleşti ve toplam pozitif hacim 0 mm³. A ve B köşe dikmeleri ilgili eksende 887,5 mm merkeze geldi. 25/4 örneğinde iç yüz 875 mm’deki beşgen kenarıyla çakışıyor. A2 rafının kenarı 2955 mm’deki dikme yüzüyle buluşuyor. Sıfır hacim bağımsız plan poligonu ve Y aralığı hesabıyla ölçüldü. Üretim ön kontrolünün 0,500001 mm eşiği korundu.
- 40 deterministik geometri kombinasyonu ve asimetrik çift regresyonu geçti. `0xd3000001` seed’iyle ek 32 kombinasyonda kesim alanları, parça kimlikleri ve ebatlar eşleşti. Önceki sürümün bu 32 senaryodaki 728 pozitif nominal çift kesişimi, adayda 0 oldu. Bu ölçümler gövde levhaları ve birleşimlerini kapsar.
- Gerçek HTTPS’den alınan ana JavaScript ve diğer yayımlanan dosyalar onaylı derlemeyle eşleşti. Aynı canlı tarayıcıdan alınan 24 SVG’nin çizim koordinatları hesaplanan adayla aynı. Düz modelin gerçek ZIP’indeki üretim JSON’u 69 merkez ve kimlik için adayla eşleşti. 25/4 tam üretim verisi kilitli kaldığı için 20 birleşimin üç boyutlu ölçümü, canlı paketle eşleştirilen çözüm ve tarayıcıdan gelen tanısal koordinatlarla doğrulandı.
- WS-UX-001/002/003 fiziksel P0’ları açık. Üçünde de panel ve geniş önizleme tam CSV/ZIP’i kilitledi. Tanısal PDF, SVG ve gömülü fontlu yazdırılabilir HTML canlıdan indirildi. 25/4 köşe kapağı 110° isteğinde 12,8° sınırını ve komşu kapağın neden olduğu engeli gösterdi. Fiziksel menteşe, ray, yük ve montaj kabulü ayrı kanıt gerektirir.
- MS-EXPORT-001 eylem denetimi, işlem sahibi ve bekleyen ZIP iptali testleri geçti. Gerçek canlı JSON değişiminde önceki indirme başarı mesajı temizlendi. WS-UX-009a kurtarmasında ilk sürgü 1458 mm’de, ilgili çekmece 86 mm açıkken güvenli sıra sunuldu. Üç çekmece ve hedef sürgü kapandı. Son kanat konumları 0 / 982 / 0 mm oldu. İzole canlı kabulün konsolunda hata veya uyarı kaydedilmedi. [Merkezleme ve birleşimler](D3_BASELINE_001_IMPLEMENTATION_REPORT.md) · [Geometri testi](tests/exact-panel-centering.test.ts) · [MS-EXPORT-001](MS_EXPORT_001_PRODUCTION_RELEASE.md) · [WS-UX-009a](SAFE_MOTION_RECOVERY_PRODUCTION_RELEASE.md)

## Geometri imzaları ve dosya etkisi

| Model | Parça | Merkez farkı olan panel | PDF/SVG çizim farkı |
| --- | ---: | ---: | ---: |
| Düz | 69 | 5 | 3/25 |
| Beşgen 18/8 | 94 | 9 | 5/41 |
| Kör | 81 | 4 | 4/35 |
| Asimetrik 25/4 | 94 | 12 | 12/41 |

Toplam 338 fiziksel parça. Dört Design imzası ve parça sırası eşit. Dört `ResolvedModel` ve dört `ProductionPackage` SHA-256 imzası yalnız ilgili `worldPositionMm` ve `worldCenterMm` farklarıyla değişti. Kesim ebatları, poligon köşeleri, açı, malzeme ve yüzey toplamları, işlevsel erişim ve ölçülen hareket duruşları eşit. `PRE_D3_BASELINE_001` önceki sürümün 12 imzasını saklar. `POST_D3_BASELINE_001` bu üretim kaynağının 12 geçerli imzasıdır. Geçiş `tests/manufacturing-download.test.ts` ve onun `tests/fixtures/d3-panel-centering-fingerprints.json` fikstürünü etkiledi. [Tarihsel ve geçerli SHA-256 tabloları](ENGINEERING_INVARIANTS.md#parmak-izi-karşılaştırması) · [Pafta kimlikleri ve alan karşılaştırması](CANONICAL_GEOMETRY_BEFORE_AFTER.md)

Dört modelin önceki ve yeni PDF’lerinde 142 sayfanın komutları ve metinleri karşılaştırıldı. Beklenen 24 sayfanın çizim komutları değişti ve tüm metinler aynı kaldı. Her değişen SVG’nin çizim öğesi konumu beklenen geometriyle eşleşti. Üç P0 için iki sürümde de 117 PDF sayfasının tamamında tanısal damga bulundu. Dört kanonik QA CSV’si bayt eşit. Düz modelin gerçek önceki ve yeni CSV’si eşit. Canlı yeni ZIP’te 29 giriş, 25 SVG ve ayrı 69 satırlık dosyayla bayt eşit gömülü CSV doğrulandı. ZIP’te değişen veri ilgili SVG’ler ve üretim modelindeki merkezlerdir.

## Gerçek tarayıcı ve eski kayıtlar

Önceki canlı uygulamada sentetik 25/4 manuel checkpoint, 25/4 arşiv girdisi, 18/8 adlandırılmış sürüm ve bir Yinele adımı hazırlandı. Aynı HTTPS kökeni ve izole profil, yeni paket sunulduktan sonra F5 ile açıldı. Çalışma kopyası ve 01:09:26 checkpoint’i geri geldi. Kaydedilmiş Yinele ile 18/8, Geri Al ile 25/4 geri açıldı. 25/4 arşiv kaydı ve eski 18/8 girdisiyle A/B 94/94 karşılaştırması geçti. Canlıdan dışa aktarılan Design JSON, kaynak sentetik dosyayla içerik bakımından eşit. IndexedDB ve localStorage yedek yolları otomatik depo testlerinde ayrı geçti. Canlı tarayıcıda iki depoya yazma ve normal profil geri yükleme akışı kullanıldı. Veri migration’ı gerekmedi.

3D izometrik, A ve B 2D cephesi ve üst plan, seçim kapalı ve aynı başlangıç kamerasıyla 1100×900 CSS görünümünde önce ve sonra alındı. A/B yan kesitleri, A2 modül ayrıntısı ve köşe montajı ayrı pafta düzeyinde karşılaştırıldı. 0,5 mm farkın kanıtı nominal dünya koordinatı ve çizim komutlarıdır. Oturum ve arşivler Design niyetini saklar. Eski kayıt yeniden açılınca yeni çözücü panel yerleşimini yeniden hesaplar. Önceden indirilen PDF, SVG ve ZIP dosyaları kendi üretildikleri koordinatları taşır. Eski tasarımdan yeniden alınan dosyalar bu yayının koordinatlarını kullanır. [Kayıt uyumluluğu](LEGACY_DESIGN_COMPATIBILITY_REPORT.md) · [Üretim rehberi](DEVELOPMENT_AND_RELEASE_GUIDE.md)

## Kalite ve kapsam

Temiz bağımlılık kurulumu, Windows aday ve birleşmiş `main`, ayrıca Cloudflare Linux’ta 21 dosya ve 350/350 Vitest. TypeScript/Vite, `deploy:check`, Cloudflare statik PASS ve iki npm denetiminde 0 bulgu. İlk Windows Vite koşusu derleme çıktısından sonra Node/libuv kapanış hatasıyla durdu. Aynı kilitle tekrarlanan koşu, birleşmiş `main` ve Linux başarılı. Ana Vite paketi boyut uyarısı görülüyor. Statik doğrulayıcı 12 dosya, 3.328.430 bayt toplam ve 1.907.995 bayt ana JavaScript raporladı. 11 gerçek HTTPS dosyası HTTP 200 ve eşleşen içerik verdi. JavaScript, CSS ve font baytları aynı. HTML ve OFL’de yalnız satır sonu normalleştirildi. CSS önceki üretimle eşit. CSP, nosniff ve Referrer-Policy korundu.

Üretim derlemesinde QA ölçüm betiği, özel tasarım veya kullanıcı yedeği bulunmuyor. İzole tarayıcıda yalnız sentetik kayıtlar kullanıldı. Mevcut gerçek kayıtlar ve özel dosyalar korundu. Geri dönüş gerektiren regresyon bulunmadı. D3 nominal bulgusu kapalı. Üç fiziksel P0, WS-UX-011 ve WebGL Sunum Modu kaynak ömrü açık. [Açık bulgular](OPEN_ISSUES_AND_TECHNICAL_DEBT.md)

Yayınla güncellenen yaşayan kayıtlar `AI_PLATFORM_HANDOFF.md`, `ENGINEERING_INVARIANTS.md`, `CODEBASE_MAP.md`, `OPEN_ISSUES_AND_TECHNICAL_DEBT.md`, `ENGINEERING_DECISION_LOG.md`, `PROJECT_FINAL_HANDOFF.md` ve `DEVELOPMENT_AND_RELEASE_GUIDE.md`. Tarihsel MS-EXPORT-001 yayınına ait `4c4a01d` raporunun içeriği birebir korunur. Tam sayısal test kanıtları, canlı indirilen sentetik çıktılar ve karşılaştırmalar yerel `artifacts/d3-baseline-001-release` dizinindedir.
