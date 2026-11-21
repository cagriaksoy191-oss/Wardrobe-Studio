# WS-UX-011 kontrollü üretim yayını

**21 Kasım 2026 · `FIXED_AND_PRODUCTION_BROWSER_VERIFIED`.** Büyük model kutu seçimi için onaylı çizim gruplaması üretimde doğrulandı. 64 çözülmüş hücre eşiği ve önceki seçim davranışı korundu. Kabul, doğrulanan büyük model etkileşimi ve sentetik tarayıcı akışlarını kapsar.

| Kayıt | Doğrulanan değer |
| --- | --- |
| Önceki GitHub tabanı | `26841cc0dee39d65cfa00d6b33f3c899919f7284` |
| İlk uygulama yayını | `23c72df4d99fa781ad2242904929c19d053b0673`. Kaynak `325c634`, regresyon testleri `f0fba84`. Fast-forward. |
| Cloudflare Linux build | `5ea6e18c-10cb-4681-a179-f30d874bfab7`. 358/358 test, Vite ve statik doğrulama, deploy başarılı. |
| İlk uygulama Worker’ı | `ceb5a259-89d7-48fb-a8a5-dbdac8f229b1`, Ready ve %100 üretim trafiği. |
| Plan ve parmak izi | Workers Free. HTTPS üzerinden 12/12 dosya onaylı LF paketle bayt düzeyinde eşleşti. Ana JS SHA-256 `6e488049353d2f48216c9557f8a391f0620b7bcce1b65281a35a89436c468580`. |
| Geri dönüş | Gerekmedi. Önceki doğrulanmış Worker `22f84d50-8c7f-4f04-b76b-4bac389b1a52`. |

İlk uygulama sürümünün kimlikleri kabul kanıtını gösterir. Uygulama kabulü sonrasında bu rapor ve yaşayan belgeler bir Markdown commit’inde toplandı. Workers Builds mevcut `*` izleme yolu ile aynı uygulama paketini yeniden dağıtır. [GitHub uygulama commit’i](https://github.com/cagriaksoy191-oss/Wardrobe-Studio/commit/23c72df4d99fa781ad2242904929c19d053b0673) · [Cloudflare uygulama build’i](https://dash.cloudflare.com/b76b247b22f0678a722cad37767e2b19/workers/services/view/wardrobe-studio/production/builds/5ea6e18c-10cb-4681-a179-f30d874bfab7) · [Canlı uygulama](https://wardrobe-studio.cagriaksoy191.workers.dev/)

## Kaynak incelemesi ve eşik

- Test tasarımı raf sayısı komutuyla 63→64→65→64→63 çözülmüş hücreye getirildi. Dört turda 20 kontrol yapıldı. 63’te iki kehribar ve bir mavi çizgi ayrı kaldı. 64 ve 65’te iki kehribar kutu tek çizimde, mavi önizleme kendi çizimindeydi. Kimlik sırası ve kutu başına 12 segment, bağımsız Three geometrisinin dünya uç noktalarıyla eşleşti. Ölçülen çizgilerde 2,2 genişlik, opaklık 1, açık depth-test/depth-write ve raycast dışı davranış korundu. Aynı renkte segment sırası korunur. Çizgilerin gruplandığı ekran görüntülerinde aday incelemesinde küçük raster farkları kaydedilmişti. [Aday raporu](WS_UX_011_FINAL_REMEDIATION_REPORT.md)
- Her eşik geçişinde çıkan çizgi geometrileri birer kez dispose edildi. Kullanımdan çıkan materyaller bırakıldı. 64 hücreli sabit sahnede yedi tekrarlı seçim sonunda geometri sayacı 1135, program sayacı 23 olarak sabit kaldı. Modeli tekrar çözme çevrimlerinde toplam sahne sayacı eski üretimde de adayda da artabildi. Karşılaştırılabilir bir turda iki sürümde de dört örnekte fark +108 idi. Bu sayaç bütün sahne kaynaklarını kapsar. İzlenen seçim çizgileri için sürekli birikim gözlenmedi.
- Aynı renkli 126 dikdörtgenin 1512 segmenti tek çizimde toplandı. Dört köşe poligonu kendi mevcut kenar yolundaydı. Ters sürükleme, önceki ölçümlerdeki 130 kimliği aynı sırayla verdi. Design JSON ve Geri Al geçmişi eşleşti. Yeni bir hover dizisi aynı kimlikleri taşıdığında çizgi noktaları tekrar hesaplanabilir. Önceki tanıda daha az tampon tahsisi, güncel ek kontrolde de geometri bırakma davranışı görüldü.

## Performans kanıtı

22 üretim ve 22 aday işlemi, normal Brave / Radeon 610M ve tek 14 bölmeli sentetik L modeli. 44/44 işlem aynı sıralı 130 hücreyi seçti. Yeni süre karşılaştırması çalıştırılmadı.

| p95 | Önce (ms) | Sonra (ms) |
| --- | ---: | ---: |
| Sürükleme karesi | 19,2 | 19,5 |
| Bırakmayı kapsayan kare | 25,4 | 21,4 |
| Seçim sahnesi hazır | 54,3 | 45,2 |
| Panel ilk tıklanabilir | 55,2 | 46,2 |
| Bırakmayı izleyen 200 ms’de kare | 30,8 | 27,4 |

Toplu panel kazanımı %16,3. Panel p95’i blok çiftlerinde 47,5→50,1 ve 55,9→45,2 ms idi. Normal modelde kısa kabulde panel medyanı 23,5→19,7 ms oldu. İlk tıklanabilir kare, etkin düğmenin hit-test ile ilk erişilebilir durumudur. Bu değerler belirtilen GPU ve sahne için geçerli. [Ölçüm ayrıntıları](WS_UX_011_FINAL_REMEDIATION_REPORT.md)

## Canlı HTTPS kabulü

- Brave’in izole sentetik profiliyle ters ve ileri kutu, 130 hücre ve bağlam paneli, seçim temizleme, boş kutu ve hareket sırasında Escape doğrulandı. Büyük modelde toplu raf değiştirildi. Geri Al/Yinele ve manuel kayıt sonrası F5, dışa aktarılan JSON’larla denetlendi. 130 kimliğin sırası ve seçimin Design/Undo etkisi yayın öncesinde onaylı adayda doğrudan okundu.
- Normal modelde tekli seçim, Ctrl ile ekleme, Shift ile çıkarma, 2D seçim/üst plan/3D’ye dönüş, Sunum Modu ve LED çalıştı. WS-UX-009a 1458 mm sürgü duruşu ve 86 mm açık çekmeceyle güvenli hareketi tamamladı. İlgili kanat kapandı ve ikinci sürgü 982 mm’de kaldı. Konsol ve WebGL bağlam kaybı kaydı yok.
- Düz modelde JSON içe/dışa aktarımı, 69 satır × 25 sütun tam CSV ve 29 girişli ZIP doğrulandı. ZIP CRC ve tasarım/üretim verileri eşleşti. A3 PDF ve SVG çıktıları geçerli. WS-UX-001, WS-UX-002 ve WS-UX-003 için tam CSV/ZIP panelde ve modalda kilitliydi. Engelli düğmelere gerçek tıklama indirme oluşturmadı. 35/41/41 sayfalık tanısal PDF, SVG ve gömülü fontlu HTML indirildi ve ayrıştırıldı.
- Temiz kurulum, 358/358 test, TypeScript/Vite, `deploy:check` ve Wrangler dry-run geçti. Tam ve yalnız üretim bağımlılığı audit’i 0 bulgu. Paket kapsamı 13 statik dosya, 12 HTTPS varlığı. Vite büyük JS uyarısı mevcut. Ölçüm probu ve sentetik tasarım dosyaları paket dışında.
- `POST_D3_BASELINE_001` 12/12 SHA-256 ve 338 fiziksel parça. Düz 69, beşgen 94, kör köşe 81, asimetrik 94. D3-BASELINE-001, MS-EXPORT-001, WS-UX-009a ve ContactShadows kod kapsamı korundu. Fiziksel P0’lar açık. Sentetik oturum dışında kullanıcı kayıtlarına erişilmedi.

Yerel kanıt dizini `artifacts/ws-ux-011-release/`. Eşik ve yaşam döngüsü deneyi, onaylı paket, Cloudflare Linux logları, HTTPS eşleşmesi ve gerçek tarayıcı çıktıları bu dizinde. Önceki 22+22 ham karşılaştırması ve SHA-256 envanteri `artifacts/ws-ux-011-final/` altında.
