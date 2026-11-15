# MS-EXPORT-001 üretim çıktısı eylem denetimi

15 Kasım 2026. **READY_FOR_RELEASE**, kontrollü yayın değerlendirmesine hazır yerel aday. Dal `fix/manufacturing-export-action-guards`. Üretim tabanı `bd5191052800641a8582e45b21896ddcb431a215`. Önceki denetim `audit/geometry-and-manufacturing-safety` dalında `598938e30bc60248c17f51c4dbf867a480954b85`. Uygulama commit’i `4d9d3e2a4d076894f0e84bbb6d2166a200b80e2a`, test commit’i `dcbf7098d87f346098e2ed61568aa1f41a7e1e85`. Kullanıcı bu görevde yayın yetkisi vermedi. Uzak dal gönderimi, main birleştirmesi ve Cloudflare yayını yapılmadı.

## Önceki davranış ve sınır

Üç fiziksel P0 tasarımında üretim paketi `status=review` ve `accessStatus=blocked` döndürüyor. Eski paneldeki `disabled` koşulu CSV/ZIP düğmelerini kapatıyordu. İndirme eylemleri ise erişim durumu denetimini tekrar yapmadan geometri temelli yazıcıları çağırıyordu. `assertProductionReady` kritik geometriyi engelliyordu ve bunu sürdürür. Tanısal PDF/SVG/HTML, geometri analizi ve iç QA aynı düşük seviyeli sözleşmeyi kullanır.

Uygulamanın desteklenen tam CSV/ZIP yolları Üretim paneli ve aynı kontrol grubunu kullanan geniş pafta önizlemesidir. Kaydedilmiş bir sürüm açıldığında veya JSON geldiğinde aktif Design ve çözümü birlikte güncellenir. Sürüm/AI önizlemesi sadece görüntü ve tasarım verisi sağlar. PNG ve Design JSON indirmeleri ayrı amaç taşır. Statik Worker’da üretim dosyası sunan bir API yok.

## Uygulanan davranış

| Geometri | Erişim | Tam CSV/ZIP |
| --- | --- | --- |
| `blocked` | Tümü | Ret |
| `review` | `blocked` | Ret |
| `review` | `unverified` | İzin ve mevcut usta/erişim uyarısı |
| `review` | `usable` | Mevcut izin ve usta kontrolü ibaresi |
| Geçersiz veri | Eksik, bilinmeyen veya çözümle uyuşmayan durum | Ret ve Türkçe açıklama |

- [`fullExportPolicy.ts`](src/core/production/fullExportPolicy.ts) düğmeler ve komut için aynı ret gerekçesini verir. Design ve üretim kimliklerini, geometri durumu ve kritik issue uyumunu, çözümün erişim kayıtlarını ve paketin özetini kontrol eder. Geçerli boş erişim listesi mevcut `unverified` davranışını sürdürür. Çözüm analizi eksikse izin verilmez.
- [`productionModel.ts`](src/core/production/productionModel.ts) mevcut erişim özetini küçük ortak işlevle hesaplar. Düşük seviyeli geometri denetimi ve üretim paketi alanları aynı. Tanısal ve iç QA yazıcılarında değişiklik yok.
- [`manufacturingDownload.ts`](src/export/manufacturingDownload.ts) eylem başladığında aktif Design ve ResolvedModel’i Zustand’dan tek okumada alır, ilgili sürüm adını bulur, paketi bu çiftten üretir ve politikayı tekrar uygulayıp izin verilirse gerçek yazıcıya geçer. JSON’daki kullanıcı verisinden uygunluk kararı devralınmaz.
- CSV eşzamanlı hazırlanır. ZIP yazıcısı yüklenirken tasarım/çözüm ve ilgili arşiv kaydı gözlenir. Geçici değişip önceki duruma dönen anlık görüntü de geçersiz olur. Sahip panel kapanırsa isteğin iptal sinyali kontrol edilir. Geçersiz istek dosya oluşturma veya tarayıcı indirmesi başlamadan sonlanır. Kullanıcı güncel tasarım için yeni indirme başlatabilir. Güncel tasarıma ait olmayan başarı mesajı temizlenir.
- [`ProductionPanel.tsx`](src/ui/ProductionPanel.tsx) panel ve geniş önizlemede aynı uygunluk sonucunu kullanır. İndirme engeli açıklaması `aria-describedby` ile CSV/ZIP kontrollerine bağlanır. İşlem sahipliği panel içinde tutulur. Kayıt şemasına veya global store alanlarına ek yapılmadı.

Bu sınır desteklenen kullanıcı çıktı eylemlerini kapsar. Alt seviye serileştirme işlevleri iç QA girdileriyle çağrılabilir. Ürün kararı üçüncü taraf dosyaları, tarayıcı dışında çalışan araçlar veya fiziksel atölye kabulü için bir yetki belgesi üretmez.

## Otomatik kontroller

**309/309 test** ve 20 test dosyası. 284 mevcut teste 25 yeni test eklendi. [Yeni regresyon dosyası](tests/manufacturing-download.test.ts)

- Altı doğrudan eylem testi üç P0 × CSV/ZIP için ortak politika ve komut reddini karşılaştırdı. İndirme yardımcı işlevi her ret için sıfır çağrı aldı.
- Düz pozitif kontrolde gerçek CSV baytları ve ZIP içeriği, kritik geometride iki tam çıktı ve PDF/HTML yazıcı reddi, gerçek `unverified` servis nişinde izin ve çıktı uyarısı kontrol edildi.
- Eksik veya bilinmeyen durum, tutarsız erişim özeti, çözümsüz anlık görüntü, farklı tasarım kimliği, normal JSON ve sonradan açılan adlandırılmış sürüm denendi. Aynı ID’de tasarım değişimi, önceki nesneye geri dönme, ilgili sürüm yeniden adlandırma ve panel iptali bekleyen ZIP’i durdurdu. Sadece seçim değişmesi indirmeyi durdurmadı.
- Mevcut iç QA CSV/ZIP testleri, Design v1 uyumluluğu, Undo/Redo, oturum ve sürüm arşivi testleri ile WS-UX-009a testleri geçti. D3/B3 araştırma testleri bu dalın kapsamına alınmadı. Önceki 44 seri araştırma testi ayrı denetim kaydında.

Dört kanonik örnekte Design, ResolvedModel ve ProductionPackage için **12/12 SHA-256** eşleşti. Düz 69, beşgen 18/8 94, kör 81, asimetrik 25/4 94 parça. Toplam **338**. Referans imzaları değişmedi. [Sabit imzalar](ENGINEERING_INVARIANTS.md#parmak-izi-karşılaştırması)

## Tarayıcı ve gerçek dosyalar

Uygulamanın derlenmiş sürümü, izole uygulama içi tarayıcıda loopback adresinden sınandı. Normal JSON içe aktarma, ana panel, geniş önizleme ve adlandırılmış kör köşe sürümünü yeniden açma kullanıldı. Test dosyaları sentetik. Tarayıcının indirdiği yalnızca bu yeni kanıt dosyaları çalışma alanına alındı.

| Model ve yol | CSV/ZIP | PDF/SVG/HTML |
| --- | --- | --- |
| WS-UX-001, beşgen 18/8 | Kapalı | Üçü indirildi, 41 PDF sayfasının hepsi tanısal |
| WS-UX-002, asimetrik 25/4 | Kapalı | Üçü indirildi, 41 PDF sayfasının hepsi tanısal |
| WS-UX-003, kör köşe | Kapalı | Üçü indirildi, 35 PDF sayfasının hepsi tanısal |
| Kör köşe, geniş önizleme ve adlandırılmış sürüm | Kapalı | Açık |
| Sentetik kritik geometri | Kapalı | Kapalı |
| Düz model | CSV ana panelden, ZIP geniş önizlemeden indirildi | Açık |

Düz CSV 41.070 bayt, UTF-8 BOM ve 69 parça satırı. ZIP 80.679 bayt, 29 girdi, 25 SVG ve 69 benzersiz parça kodu. ZIP’in içindeki CSV, ayrı indirilen CSV ile bayt düzeyinde eşit. Tanısal SVG ve yazdırılabilir HTML damgaları ve HTML’de gömülü yerel yazı tipi test edildi. Başarı mesajının düz modelden kör köşeye geçişte kaldığı ilk tarayıcı turunda görüldü. Düzeltmeden sonra aynı sırada mesaj kalktı ve yeni modelin kilitleri devreye girdi. 390 × 844 mobil görünümde engel metni görünür, her iki biçim kilitli ve düğme açıklaması erişilebilir. Ham kanıt `artifacts/browser-acceptance` içinde.

## Derleme ve yayın

`npm ci`, `npm test -- --run --maxWorkers=2 --testTimeout=30000`, `npm run build`, `npm run deploy:check`, `npm audit` ve `npm audit --omit=dev` başarılı. Her iki bağımlılık denetimi sıfır açık bildirdi. Wrangler adımı kuru koşu. Vite’ın önceden var olan büyük JS parçası uyarısı devam ediyor. İlk derlemede bir test başlığı Tailwind’in fazladan bir CSS kuralı çıkarmasına neden oldu. Test adı düzeltildi ve CSS üretim referansıyla bayt eşitliğine döndü.

D3-BASELINE-001 ve üç fiziksel P0 açık. Solver merkezleri, `0.500001 mm` eşiği, D3/B3 raporları, kanonik geometri, seri hale getirme, hareket kurtarma ve gerçek kullanıcı verileri değişmedi. Sonraki kontrollü yayın ayrı kullanıcı onayı gerektirir.
