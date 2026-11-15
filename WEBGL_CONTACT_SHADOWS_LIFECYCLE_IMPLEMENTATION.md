# Sunum Modu temas gölgesi kaynak ömrü

16 Kasım 2026. Yerel inceleme dalı `fix/webgl-contact-shadow-lifecycle`. Üretim tabanı GitHub `main` `27361cbed6e4052b2712e7fd7f3559177a5bf156`, Cloudflare Worker `edab9786-e496-4096-a785-de955f99b2c7`. Cloudflare GitHub kontrolü ve 11 yayın dosyasının canlı HTTPS doğrulaması geçti.

## Kök neden ve sahiplik

Kilitli Drei 10.7.9 sürümündeki `ContactShadows`, iki `WebGLRenderTarget`, yatay düzlem geometrisi, bir derinlik materyali ve iki blur materyalini `useMemo` içinde yaratıyor. Unmount sırasında bunlar için cleanup kaydetmiyor. Düzenleme moduna dönünce React ağaçtan bileşeni kaldırıyor. R3F JSX ile oluşturulan `MeshBasicMaterial` ömrünü yönetiyor. Elle oluşturulup `geometry` ve `map` üzerinden bağlanan nesneler için açık kaynak temizliği gerekiyor. [Drei 10.7.9 kaynağı](https://github.com/pmndrs/drei/blob/v10.7.9/src/core/ContactShadows.tsx)

| Kaynak | Sahibi ve kapanış yolu |
| --- | --- |
| İki 512×512 hedef ve bunların native dokuları, framebuffer ve renderbuffer kaynakları | Her temas gölgesi örneği hedeflerini oluşturur. `target.dispose()` ve `scratch.dispose()` Three.js hedef kaynaklarını serbest bırakır. Her hedefin dokusu aynı işlemde serbest bırakılır. |
| Temas düzlemi | Temas ve bulanıklık çiziminde aynı `PlaneGeometry` kullanılır. Geometri bir defa bırakılır. Blur mesh ayrı varsayılan materyal oluşturmadan var olan blur materyaliyle kurulur. |
| Derinlik, yatay ve dikey blur materyalleri | Her örnek üç materyalini bir defa bırakır. Three.js renderer her materyal için shader programı referans sayısını yönetir. |
| Ekrandaki temel materyal ile grup, kamera ve mesh | React/R3F tarafından yönetilir. Temas düzlemi seçim raycast'ine katılmaz. |
| `three-stdlib` blur uniform tanımları ve sahnenin diğer kaynakları | Shader tanımları paylaşılır. Kapanış, yalnız ilgili örneğe ait mevcut texture referansını temizler. Başka bir gölge örneğinin texture'ına ve uygulamanın materyal/doku önbelleklerine müdahale edilmez. |

[Kaynak fabrikası](src/canvas/scene/contactShadowResources.ts) layout effect kurulumu sırasında etkinleşir. Cleanup çizim iznini anında kaldırır, bırakmayı mikro göreve alır. React StrictMode aynı memoyu aynı commit içinde tekrar bağladığında yeni nesil eski cleanup'ı geçersiz kılar. Ayrı memo kendi cleanup'ını tamamlar. Sonlandırılan efektin tekrar çağrılması ikinci bir bırakma oluşturmaz. Dört otomatik test bire bir bırakmayı, StrictMode tekrar bağlanmasını, birbirinden bağımsız örnekleri ve başka örneğin paylaşılan uniform referansının korunmasını kapsar. [Testler](tests/contact-shadow-resources.test.ts)

## Korunan çizim ve önceki denemeler

`ContactShadows.tsx` aynı derinlik shader'ı değişikliğini, `three-stdlib` `HorizontalBlurShader`/`VerticalBlurShader` tanımlarını, iki blur çiftini (`blur`, `blur × 0,4`) ve ana kamera öncesi çizim sırasını kullanır. Aynı sahne bağlantısı, konum, `opacity=0,46`, `scale=8`, `blur=1,9`, `far=2,6`, `resolution=512`, `color=#020617`. Arka plan, override materyali ve hedef geri yüklemesi `finally` içinde tamamlanır. [Bileşen](src/canvas/scene/ContactShadows.tsx) · [Çağrı yeri](src/canvas/scene/WardrobeCanvas.tsx)

- `a1e8731` minimal öncül. Kaynak sayaçları iki GPU'da sabit kaldı. RTX açık sahne kare p95'i iki turda 29,8→34,4 ve 33,2→32,0 ms olduğu için eşdeğerlik belirsiz kaldı. Yeni aday aynı çizim yaklaşımını güncel tabana taşıyor ve StrictMode efekt tekrarına karşı tek bırakma sağlıyor.
- `c42c5a7` önceki B1. Aynı kaynakları toplarken blur shader kurulumu ve hedef geri yükleme farklıydı. RTX açık sahne regresyonu kaydedildi. Bu çizim farklılıkları yeni adaya taşınmadı.
- `a8c1ba3` önceki B2. Temas geçişi sırasında gölge haritası güncellemesini atladı. Radeon 610M LED sahnesinde B1→B2 iki turda GPU p95 43,51→47,59 ve 48,19→53,75 ms, kare p95 65,1→77,7 ve 66,7→90,3 ms. Yeni aday bu optimizasyonu uygulamaz.

Uyarlanan Drei kodunun MIT bildirimi yayın dosyalarına dahil edildi. Statik doğrulama metnin `public/` ve `dist/` kopyalarını karşılaştırır. Bağımlılık kilidi değişmedi. [Üçüncü taraf bildirimi](public/THIRD_PARTY_NOTICES.txt) · [Drei MIT lisansı](https://github.com/pmndrs/drei/blob/v10.7.9/LICENSE)

## Otomatik kalite

Temiz `npm ci`, `npm test -- --run --maxWorkers=2 --testTimeout=30000` (üretim tabanı **350/350**, aday **354/354**), `npm run build`, `npm run deploy:check`, `npm audit` ve `npm audit --omit=dev` geçti. İki audit sıfır güvenlik açığı bildirdi. Wrangler adımı dry-run çalıştı. Statik paket 13 dosya ve 3.329.976 bayt. Üretim tabanı ve aday CSS dosyası `index-CgKGgGEp.css` (57.977 bayt) SHA-256 `bb6eca79772b85c584456de01237de91147524e517db79e674ed93577a5fd743`. Vite'ın bilinen paket boyutu uyarısı mevcut. `POST_D3_BASELINE_001` dört kanonik örneğinin 12 imzası geçti. Toplam 338 parça, dağılım 69/94/81/94. [Kanonik imzalar](ENGINEERING_INVARIANTS.md#post_d3_baseline_001) · [Yayın kararı](WEBGL_RESOURCE_RELEASE_DECISION.md)
