# Wardrobe Studio · bakım ve AI devri

21 Kasım 2026 · Üretim tabanı `5044f17fe6cb95ec51d12ae9f6a2537252793f25`, Worker `c352f36f-107a-4fc5-90cc-4464dcb8367b`. Temel sözleşme 358 uygulama testi, dört tasarımda 12 güncel kanonik imza, 338 parça, 20 nominal panel teması ve üç fiziksel P0 için CSV/ZIP kilididir. [Üretim tabanı](FINAL_PRODUCTION_BASELINE.md) · [Nihai yazılım kabulü](FINAL_SOFTWARE_ACCEPTANCE_REPORT.md)

## Yeni modelin ilk altı adımı

1. Projeyi tanıyın. [Başlangıç talimatını](START_HERE_NEW_AI.md), [AI devir rehberini](AI_PLATFORM_HANDOFF.md), [AGENTS.md](AGENTS.md) ve [kaynak haritasını](CODEBASE_MAP.md) okuyun. `Design` kullanıcı niyeti, `ResolvedModel` türetilmiş durum ve `ProductionPackage` üretim sözleşmesidir.
2. [Mühendislik değişmezlerini](ENGINEERING_INVARIANTS.md) ve [açık fiziksel P0’ları](FINAL_OPEN_RISKS_AND_PHYSICAL_VALIDATION.md) inceleyin. Çarpışma sınırlarını, geçici hareket durumunu, çıktı yetkilendirmesini ve kayıt davranışını koruyun.
3. Güncel tabanı doğrulayın. `git status --short --branch`, `git worktree list`, `git remote -v`, `git fetch origin` ve `git rev-parse origin/main` ile ayrı durumları görün. Cloudflare build, etkin Worker, trafik ve canlı varlık SHA’larını karşılaştırın. Tarihli kimlikler, canlı panel yerine kullanılmamalı.
4. Güncel tabandan izole bir geliştirme dalı/worktree açın. Mevcut kullanıcı çalışma alanlarını, kayıtları ve diğer dalları koruyun. İzole tarayıcı profili ve sentetik tasarımlar kullanın. Sırları, tarayıcı depolarını, kullanıcı tasarımlarını ve yerel test çıktılarını Git’e eklemeyin.
5. Testleri, kanonik imzaları ve üretim kilitlerini doğrulayın. Adayı temiz kurun. Kullanıcının gördüğü akışı doğrulayın ve varsa doğrulanamayan kısımları kaydedin. Solver veya üretim referansı değişikliği, ayrı gerekçe ve kullanıcı kapsamı gerektirir.
6. Üretim için açık onay alın. Onaylı kapsamı güvenli Git işlemleriyle aktarın. Linux build, HTTPS, etkin Worker ve kullanıcı akışlarını doğrulayın. Rollback için önceki doğrulanmış Worker’ı ve paket farkını kullanın. Salt Markdown değişiklikleri de Cloudflare build tetikleyebilir. [Yayın kılavuzu](DEVELOPMENT_AND_RELEASE_GUIDE.md)

## Sıralı komutlar

```powershell
npm ci
npm test -- --run --maxWorkers=2 --testTimeout=30000
npm run build
npm run deploy:check
npm audit
npm audit --omit=dev
```

`deploy:check` statik dosya kontrolünü ve Wrangler dry-run’ı çalıştırır. Yerel geliştirme için `npm run dev -- --host 127.0.0.1 --port 5173`. Özel GitHub deposu ve Workers Free mevcut mimarinin parçasıdır. Üretim verisini dışarı aktaran yeni servis, backend, telemetri veya veri tabanı bu bakım tabanının dışındadır. [Mühendislik kararları](ENGINEERING_DECISION_LOG.md)
