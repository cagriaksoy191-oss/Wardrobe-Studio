# MS-EXPORT-001 üretim yayını ve kabulü

15 Kasım 2026 · **Üretimde doğrulandı.**

| Kayıt | Sonuç |
| --- | --- |
| Canlı adres | [Wardrobe Studio](https://wardrobe-studio.cagriaksoy191.workers.dev/) |
| GitHub `main` | `c57a4b2de7acc08a679b33136dacaa6dde6c13d9` · [Commit](https://github.com/cagriaksoy191-oss/Wardrobe-Studio/commit/c57a4b2de7acc08a679b33136dacaa6dde6c13d9) |
| Cloudflare Linux build | `7c8c7e0b-e2aa-455e-ae3a-4343ad7440ad` · tamamlandı · 1 dk 48 sn · [Build günlüğü](https://dash.cloudflare.com/b76b247b22f0678a722cad37767e2b19/workers/services/view/wardrobe-studio/production/builds/7c8c7e0b-e2aa-455e-ae3a-4343ad7440ad) |
| Aktif Worker | `9ce09ac8-d627-421a-88a7-3f6b7a66e0d5` · Ready · %100 üretim trafiği |
| Plan | Workers Free, etkin plan 0 ABD doları. Mevcut alan adı ve statik mimari kullanıldı. |
| Önceki üretim | `bd5191052800641a8582e45b21896ddcb431a215` · Worker `c1a6055a-b376-4317-8bbf-32409938a10c` |

Uzak `main` ve temiz yayın worktree’si kontrol edildi. Adayın zinciri, `bd51910` tabanından kod `4d9d3e2a4d076894f0e84bbb6d2166a200b80e2a`, test `dcbf7098d87f346098e2ed61568aa1f41a7e1e85` ve dokümantasyon `c57a4b2de7acc08a679b33136dacaa6dde6c13d9` üzerinden ilerledi. Üç commit fast-forward ile birleştirildi. Birleşmiş `main` doğrulandı ve normal push ile gönderildi. GitHub Workers Builds kontrolü başarılı. [Uygulama kapsamı](MS_EXPORT_001_IMPLEMENTATION_REPORT.md)

## İndirme kararı ve işlem sahipliği

| Kritik geometri | İşlevsel erişim | Kullanıcı tam CSV ve ZIP |
| --- | --- | --- |
| `blocked` | Herhangi | Reddedilir. Teknik önizleme açıktır, tanısal indirmeler kapalıdır. |
| `review` | `blocked` | Reddedilir. Tanısal PDF/SVG/yazdırılabilir HTML açıktır. |
| `review` | `unverified` | Mevcut usta ve erişim uyarısıyla izin verilir. |
| `review` | `usable` | Mevcut üretim ön kontrolüyle izin verilir. |
| Eksik, bilinmeyen veya tutarsız | Herhangi | Reddedilir. |

Panel ve geniş önizleme aynı politikayı kullanıyor. İndirme eylemi tek store okumasından güncel Design ve ResolvedModel’i alıyor ve paketi o çiftle oluşturuyor. Normal JSON ve sürüm açılışı çözümü yeniden hesaplıyor. Eksik analiz, uyumsuz kimlik ve erişim sonucu reddediliyor. Engelli tasarımların altı doğrudan CSV/ZIP çağrısında hata ve sıfır indirme doğrulandı. Ek üç yerel QA kontrolü CSV yazıcısına, teknik pafta üretimine, ZIP modülünü yüklemeye ve indirme işlevine hiç ulaşılmadığını doğrudan ölçtü. İç QA serileştirmesi ve tanısal çıktı sözleşmesi korunuyor. [Politika](src/core/production/fullExportPolicy.ts) · [İndirme eylemi](src/export/manufacturingDownload.ts) · [Regresyon testleri](tests/manufacturing-download.test.ts)

ZIP yazıcısının asenkron yüklenmesi boyunca tasarım/çözüm veya ilgili sürüm değişikliği isteği geçersiz kılıyor. İlk anlık görüntüye dönülse de bu karar sürüyor. Panel kapanırsa işlem sahibi sinyali iptal ediyor. Asenkron bekleyişten sonra her iki koşul denetleniyor. Paftaların hesaplanması, senkron ZIP üretimi ve tarayıcıya teslim aynı JavaScript görevinde gerçekleşiyor. Panelin etkin işlem referansı, aynı anda ikinci indirme işini önlüyor. Yerel tarayıcıda gerçek çift tıklama ve geçerli ZIP alımı görüldü. Soğuk ZIP yüklemesinin kısa yarış aralığında panel kapanması ve tasarım değişikliği, otomatik iptal ve sıfır indirme testleriyle deterministik olarak doğrulandı.

## Otomatik test, derleme ve canlı dosya bütünlüğü

| Kontrol | Sonuç |
| --- | --- |
| Temiz npm kurulumu, aday ve birleşmiş `main` | Başarılı |
| `npm test -- --run --maxWorkers=2 --testTimeout=30000` | Windows aday, birleşmiş Windows `main` ve Cloudflare Linux’ta 20 dosya, 309/309 |
| TypeScript ve Vite | Windows ve Cloudflare Linux’ta başarılı. Vite ana JS boyutu uyarısı sürüyor. |
| `npm run deploy:check` ve Cloudflare `deploy:verify` | Başarılı. Wrangler dry-run binding bulmadı. Statik doğrulayıcı 12 dosya, 3.328.763 bayt toplam ve en büyük dosya 1.908.328 bayt raporladı. |
| `npm audit` ve `npm audit --omit=dev` | 0 ve 0 bulgu |
| Aday ve birleşmiş `main` derlemesi | 12 dosya bayt düzeyinde eşit |
| Canlı HTTPS | 11 yayımlanan dosya HTTP 200 ve eşleşen içerik. JS/CSS/font baytları eşit. HTML ve OFL metni satır sonu normalizasyonundan sonra eşit. |
| Önceki üretimle CSS | SHA-256 `bb6eca79772b85c584456de01237de91147524e517db79e674ed93577a5fd743` her iki sürümde aynı |
| HTTPS başlıkları | CSP `frame-ancestors 'none'; object-src 'none'; base-uri 'self'`, `nosniff` ve `strict-origin-when-cross-origin` önceki sürümle eşit. |

Düz **69**, beşgen 18/8 **94**, kör **81** ve asimetrik 25/4 **94** fiziksel parça. Toplam **338**. Design, ResolvedModel ve ProductionPackage için **12/12 SHA-256** mevcut üretim referansıyla eşleşti. Tablodaki kanonik imzalar güncellenmedi. [Kanonik imzalar](ENGINEERING_INVARIANTS.md#parmak-izi-karşılaştırması)

## Tarayıcı ve indirilen dosyalar

Adayın yerel derlemesi ve açık HTTPS adresi üzerinde izole tarayıcıda normal JSON dosya seçicisi kullanıldı.

| Sentetik model | Tam CSV/ZIP, panel ve geniş önizleme | Gerçek tanısal dosyalar |
| --- | --- | --- |
| WS-UX-001 · beşgen 18/8 | Kilitli. 94 parça, 4 erişim engeli. | 41 damgalı PDF sayfası, damgalı SVG, damgalı ve gömülü fontlu yazdırılabilir HTML |
| WS-UX-002 · asimetrik 25/4 | Kilitli. 94 parça, 4 erişim engeli. | 41 damgalı PDF sayfası, damgalı SVG, damgalı ve gömülü fontlu yazdırılabilir HTML |
| WS-UX-003 · kör köşe | Kilitli. 81 parça, 3 erişim engeli. | 35 damgalı PDF sayfası, damgalı SVG, damgalı ve gömülü fontlu yazdırılabilir HTML |
| Düz | İzinli | BOM’lu CSV’de 69 fiziksel parça satırı. ZIP’te 29 giriş, 25 SVG, kaynak JSON ve 69 benzersiz parça kodu. İç CSV ayrı CSV ile bayt eşit. |

Her iki ortamda ayrı ayrı PDF’lerin **117/117** sayfasındaki tanısal damga okundu. Canlıda adlandırılmış sentetik kör sürüm açılınca kilitler doğru uygulandı. Düz ZIP başarı mesajı görünürken asimetrik JSON yüklendiğinde eski mesaj silindi. Aynı Design ID’siyle kör tasarıma geçişte ve Undo/Redo sırasında tam CSV/ZIP kilidi **kilitli → izinli → kilitli** sırasını izledi. Manuel kayıt noktası F5 sonrası aynı saatle geri geldi. F5 sonrasında indirilen JSON, özellik anahtarlarının sırasından bağımsız karşılaştırmada düz sentetik girdiyle eşit.

Canlı 3D Perspektif ve 2D Cephe (A) seçildi ve sahne çizildi. WS-UX-009a senaryosunda birinci sürgü kapanırken **1458 mm** sınırında durdu. “Güvenli sırayla kapat” tamamlandı bildirimi gösterdi, ilgili üç çekmece kapandı ve son sürgü konumları **0 / 982 / 0 mm** oldu. Kabul oturumunun tarayıcı kaydında konsol hata/uyarısı ve WebGL hatası görülmedi. Uzun süreli GPU kaynak ömrü bu akışın ölçümü değildir. [Hareket kabulü](SAFE_MOTION_RECOVERY_PRODUCTION_RELEASE.md)

## Veri koruma, geri dönüş ve açık kalemler

Sentetik tasarımlar ve QA adlandırılmış sürümleri izole tarayıcı profilinde kullanıldı. Gerçek kullanıcı kayıtları, yerel tasarım dosyaları, IndexedDB ve localStorage biçimleri korundu. Yayın öncesi HTTPS’de önceki Worker’ın 11 dosyası doğrulandı ve geri dönüş için derleme saklandı. Geri dönüş gerektiren bir regresyon saptanmadı. Yeni Worker %100 trafikte.

WS-UX-001/002/003 fiziksel P0’ları, D3-BASELINE-001 nominal yerleşim bulgusu, WS-UX-011 büyük seçim gecikmesi ve WebGL Sunum Modu kaynak ömrü açık kalır. Üç P0 için yalnız tanısal belge yolu açıktır. Deneysel D3 ve B3 araştırması bu sürüme dahil edilmedi. [Güncel durum](OPEN_ISSUES_AND_TECHNICAL_DEBT.md)

Dağıtım sonrası bu kayıt ve ilgili belge güncellemeleri `codex/ms-export-001-production-record` yerel dalında tutuldu. Bu kayıt için ikinci üretim build’i başlatılmadı. Ham kabul kanıtları `C:/dev/Wardrobe-Studio/artifacts/ms-export-001-release` altında yerel olarak saklanır.
