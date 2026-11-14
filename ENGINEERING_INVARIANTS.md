# Mühendislik değişmezleri

Her değişiklikte ilgili otomatik kontrolleri ve kullanıcıya yansıyan akışı çalıştırın. Bu belge [AGENTS.md](AGENTS.md), [ana plan](wardrobe_studio_master_plan.md) ve [ek gereksinimleri](wardrobe_studio_additional_requirements.md) tamamlar.

| Kural | Uygulama ve doğrulama |
| --- | --- |
| **Kalıcı niyet ve türetilen sonuç** | `Design` v1 oda, kollar, bölme ağaçları, birleşimler, cephe, malzeme ve opsiyonel stüdyo ayarlarını saklar. `solveDesign` panel, hücre, kapak, çekmece, LED, ölçü, erişim ve uyarıları yeniden türetir. Geçici seçim, hareket ve üretim modeli tasarım JSON’una yazılmaz. [Tipler](src/core/schema/types.ts) · [Çözücü](src/core/solver/carcassSolver.ts) · [Solver testi](tests/solver.test.ts) |
| **Tamsayı mm ve dağıtım** | Kalıcı uzunluklar ve nominal bölme dağılımı tamsayı mm. `roundDesignMeasurements` sınırında normalleştirin. `distributeIntegerMm` ile bölücü payı dahil toplamı koruyun. Hareket zarfı, dönüş ve türetilmiş poligon hesaplarında mm/radyan hassasiyetini koruyun. Render metre dönüşümü sahne sınırında yapılır. [Şema](src/core/schema/designSchema.ts) · [Dağıtım](src/core/solver/flexSolver.ts) · [Geometri testi](tests/remediation-geometry.test.ts) |
| **Gövde ve köşe** | Paylaşımlı modda N bölmede N+1 ana dikme, ayrı gövdede kendi panelleri. Kalınlıkları `Run` üzerinden okuyun. Güncel şema gövde için 12–36 mm, arkalık için 3–18 mm kabul eder. Beşgende açıklık, kolların karşılıklı derinlikleri çıkarıldıktan sonra Pisagor ile hesaplanır. Kör köşede öncelikli derinlik + klapa payını koruyun. 25/4 mm asimetrik kanonik örnek geçerlidir. [Köşe çözücüsü](src/core/solver/cornerSolver.ts) · [Şema](src/core/schema/designSchema.ts) · [Geometri testi](tests/remediation-geometry.test.ts) |
| **Ağaç ve cephe** | `horizontal` yatay rafla alt/üst, `vertical` dikmeyle sol/sağ ayırır. Sanal `::sub-k` ve köşe aralıklarının kimliklerini koruyun. Alt aralığı değiştirmeden önce uygun mutatörle gerçekleştirin. Otomatik cephe sınırları gövde/boşluk değişimine bağlı, açık kullanıcı aralıkları ve eski gövde ankrajları kendi semantiğini korur. [Ağaç mutatörleri](src/core/solver/treeMutator.ts) · [Cephe geometrisi](src/core/fronts/frontGeometry.ts) · [Cephe testi](tests/auto-front-geometry.test.ts) · [Modül testi](tests/remediation-modules.test.ts) |
| **Parça kimliği ve fiziksel sayım** | `partCode(id)` fiziksel kaynağın kimliğinden kararlı kod üretir. Ortak dikmeyi ve kapağı iki kez saymayın. Çekmecenin yan, arka, taban, ön ve mevcut düzenleyici parçalarını koruyun. Poligon köşeleri, yön, gerçek kenarlar, açı, malzeme, kalınlık ve lif yönü üretim sözleşmesidir. [Üretim modeli](src/core/production/productionModel.ts) · [Statik preflight](src/core/production/staticPreflight.ts) · [Üretim testi](tests/phase5-production.test.ts) |
| **Hareket ve çarpışma** | Kanat pivotu, çekmece stroku, ray konumu, kulp zarfı, düşey bindirme, başlangıç kesişmesi ve gerçek ulaşılan konumu koruyun. Sürgü doğrusal süpürme, menteşe dönüşü ayrı hesaplanır. Cache sahneye özgü; aynı konumun kesin hacmi saklanır. Yüksek hız veya ardışık komutta temas atlanmamalı. Dekoratif çizimler `NOOP_RAYCAST` kullanır. [Kinematik](src/core/analysis/kinematics.ts) · [Çarpışma](src/core/analysis/motionConstraints.ts) · [Hareket/temas](tests/phase5-contact.test.ts) · [Hareket geri kazanımı](tests/drawer-slide-recovery.test.ts) |
| **Erişim ve üretim kapıları** | İşlevsel erişim modellenen hacimler, komut dizisi ve doğrusal eşya geçişinden türetilir. Fiziksel donanım/laboratuvar kabulü ayrıca gerekir. Kritik geometride yalnız önizleme. Geometri geçer ve işlevsel erişim blokluysa tanısal PDF/SVG/HTML, uygulamada tam CSV/ZIP kilitli. `assertProductionReady` geometri kapısını denetler. İşlevsel CSV/ZIP kapısı `ProductionPanel` sorumluluğudur. İç CSV/ZIP yazıcılarını doğrudan çağıran QA betikleri kullanıcı indirme yolunun yerine geçmez. [Erişim](src/core/analysis/functionalAccess.ts) · [Üretim paneli](src/ui/ProductionPanel.tsx) · [Erişim testi](tests/functional-access.test.ts) |
| **Geriye dönük uyumluluk ve kalıcılık** | `normalizeAndValidateDesign` ve `parseDesignJson` eski opsiyonel alanları, yapı ve ID doğrulamasını korur. Çalışma kopyası, manuel checkpoint, Undo/Redo ve sürüm arşivi ayrı anlam taşır. Hidratasyon daha yeni yerel düzenlemeyi korur. [Şema](src/core/schema/designSchema.ts) · [Oturum](src/store/useWardrobeStore.ts) · [Arşiv](src/store/versionArchive.ts) · [Oturum testi](tests/remediation-session.test.ts) · [JSON uyumluluğu](tests/security-json-compatibility.test.ts) |
| **Pafta ve dosya bütünlüğü** | Aynı `ProductionPackage` ve teknik paftalar PDF, SVG/HTML, CSV ve ZIP’i besler. A3 yatay 420×297 mm, teknik ölçü rakamları ve pafta ölçeği, Türkçe yerel font, tam kesim satırları, CSV formül etkisizleştirme ve tanısal damga sürer. ZIP, ayrı PDF yerine SVG’leri ve destek verisini paketler. [Paftalar](src/core/production/technicalSheets.ts) · [CSV](src/core/production/csvExport.ts) · [PDF](src/export/pdfWriter.ts) · [ZIP](src/export/zipWriter.ts) · [Dosya regresyonu](tests/remediation-deliverables.test.ts) |

## Tarayıcı verisinin kapsamı

**WS-UX-009a yerel aday sözleşmesi:** Güvenli sıra kullanıcı eylemi olmadan başlamaz. Plan kopya pozlarda aynı `createMotionConstraint` ile doğrulanır; her adım gerçek hedef ve sıfır hıza ulaşınca ilerler. Yeni komut (aynı hedef dahil), sürükleme, yeni çözülmüş sahne ve unmount eski işlemi sonlandırır. İptal edilen adımlar hedeflerini gerçek pozda tutar; yeni açık manuel istek olmadan yeniden oynatılmaz. Plan/işlem kimliği, açık/kapalı hedefler ve ilerleme `Design`, checkpoint, adlandırılmış sürüm veya Undo/Redo'ya kaydedilmez. Güvenli park doğrulanamazsa otomatik eylem sunulmaz. Bu sözleşme çarpışma toleransı, P0 üretim kilidi veya donanım kabulünü değiştirmez. [Koordinasyon testleri](tests/safe-motion-recovery.test.ts) · [Kapsam ve doğrulama](SAFE_MOTION_RECOVERY_IMPLEMENTATION_REPORT.md)

Oturum biçimi v2, tek tasarım ve arşiv zarfı ayrı v1 biçimleridir. Çalışma kopyası ve checkpoint yerel oturumda geçmişle birlikte saklanır. Sürüm arşivi derin kopyalar, adlar ve arşiv durumunu ayrı saklar. Oturum kurtarma, daha yeni zaman damgası ve yerel düzenleme yarışını korur. Adlandırılmış sürümlerde hidratasyon ID ve güncellenme zamanı üzerinden birleştirir. Kurtarma belgelerini kullanıcı onayı olmadan temizlemeyin.

Aktif tasarım JSON’u, checkpoint/Undo geçmişi ya da arşiv zarfı içermez. Sürüm paneli seçili sürümün Design JSON’unu indirir. Hedefte JSON önizlemesi üzerinden ayrı bir sürüm olarak kaydedilebilir. Bu aktarım, geçmiş ve arşiv metadatası için tam profil yedeği işlevi görmez. Kullanıcı, özel yedekleri ve taşınan tasarım dosyalarını kendi erişim alanında saklar. [Oturum](src/store/useWardrobeStore.ts) · [Arşiv](src/store/versionArchive.ts) · [Sürüm paneli](src/ui/VersionPanel.tsx)

## Dört kanonik örnek

| Sentetik model | Fiziksel parça | Erişim |
| --- | ---: | --- |
| `straight` · düz | 69 | Kullanılabilir |
| `diagonal` · beşgen 18/8 | 94 | WS-UX-001 · tanısal |
| `blind` · kör köşe | 81 | WS-UX-003 · tanısal |
| `asymmetric` · asimetrik beşgen 25/4 | 94 | WS-UX-002 · tanısal |
| **Toplam** | **338** | |

Git’teki fixture üreticisi [`phase5Example(kind)`](src/core/presets/phase5Examples.ts). Temiz klonda `node scripts/phase5-fixtures.mjs` ile `artifacts/phase5/examples/<kind>/design.json` üretilir. A3 PDF’ler `output/pdf/` altında, JSON/SVG/CSV/ZIP/HTML diğer fixture dosyalarıyla birlikte çıkar. Bu komut sentetik iç QA çıktısı da üretir. Ürün arayüzündeki P0 çıktı kilidini ayrıca doğrulayın. `--user-acceptance` ve `--professional-polish` eski yerel önkoşul dosyalarına bağlıdır. Tarihsel tarayıcı kabul girdileri `artifacts/final-user-acceptance/production/<kind>/design.json` altındaydı. Devirde tekrar üretilen dört Design, bu tarihsel girdilerle karşılaştırıldı. [Fixture betiği](scripts/phase5-fixtures.mjs)

Düz referans **25 A3 sayfa**, **69 fiziksel CSV satırı × 25 sütun** (başlık ayrı), **29 ZIP girişi**, bunların **25’i SVG**. Üç P0 için önceki kabulde tanısal PDF/SVG açık, tam CSV/ZIP kapalıydı. Pafta sayısı kompakt poligon seçimine, detay ve tasarım içeriğine bağlıdır. Tarih, sürüm adı, PDF üretim metadatası ve ZIP zaman bilgisi dosya baytlarını değiştirebilir. İndirme kontrollerinde pafta boyutu ve sayısı, CSV tablosu, ZIP içeriği, Türkçe metin ve kilitler doğrulanır.

### Parmak izi karşılaştırması

Tasarımı şemadan geçirin, `solveDesign` çalıştırın, üretim modelini `extractProduction(design, model, 'QA', '2026-11-04T12:00:00.000Z')` ile sabit metadata altında çıkarın. Her nesneyi `designSignature` ile nesne anahtarları sıralı, dizi sırası korunmuş JSON’a çevirip SHA-256 alın. Aynı Node sürümünde aynı girdi ile eski/yeni checkout karşılaştırılır. Çıktı değişirse parça kimliği, sayısı, kesim, geometri ve erişim farkını ayrı inceleyin. Geçmiş JSON doğrulamasında `previewDesignJson` ve `parseVersionArchive` sonucu da normalize edilen tasarımla eşit olmalıdır.

```powershell
@'
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { createServer } from 'vite';

const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
try {
  const { parseDesignJson } = await vite.ssrLoadModule('/src/core/schema/designSchema.ts');
  const { solveDesign } = await vite.ssrLoadModule('/src/core/solver/carcassSolver.ts');
  const { extractProduction } = await vite.ssrLoadModule('/src/core/production/productionModel.ts');
  const { designSignature } = await vite.ssrLoadModule('/src/core/versions/designExchange.ts');
  const hash = value => createHash('sha256').update(designSignature(value)).digest('hex');
  for (const kind of ['straight', 'diagonal', 'blind', 'asymmetric']) {
    const path = 'artifacts/phase5/examples/' + kind + '/design.json';
    const design = parseDesignJson(await readFile(path, 'utf8'));
    const model = solveDesign(design);
    const production = extractProduction(design, model, 'QA', '2026-11-04T12:00:00.000Z');
    console.log(JSON.stringify({ kind, parts: production.parts.length, design: hash(design), geometry: hash(model), production: hash(production) }));
  }
} finally {
  await vite.close();
}
'@ | node --input-type=module
```

| Model | Design SHA-256 | Geometri SHA-256 | Üretim SHA-256 |
| --- | --- | --- | --- |
| `straight` | `e1c33d152db9328e304c4d030d049fda84582aaac567eadb56cea7656e6491b0` | `7fcca6a76561727d3e69441720f74938cd38d4e20f5f8d5e71553bcac68c73a8` | `192d047b1db2f452d13f16be89e3b24441efe547400bbfb728f00ceb052030d4` |
| `diagonal` | `a4168587a1e2535b5ac374e443979ac449543d2d11d117f562a79f390a8e9a7e` | `d7fc97c501b6dd68c7159dda9443fa7b53cf56a77413820f08ab7c8a9b048101` | `5c200b4f4c35b882894fe5ccd7ce797b63d216669ee9063b9150b7011e77028f` |
| `blind` | `a313f6b547d93dfe50889a7edf6b60270d54a9b43b1eab99a4514a2051de00b2` | `0877f5fcf310556cf921fbabf67384a719c03a26140bc9bd8c9cf1e02d15cc30` | `737c193abff836e4118de2b51900cbc946575fb5257e5e99a23bd338934f498b` |
| `asymmetric` | `b54123c5b527fc79d492525621734f5287f67deabda964736aeb92284637f854` | `fdbd3ee9fed83028ad534440786bf6d803afc2d0b85e967059f74e4a0a0b70b4` | `75dc34e92ed9427cb158483a96b6c6906adf30d3e374dba7a5b7e27b6a3af4c8` |
