# Wardrobe Studio

Tarayıcıda çalışan parametrik 3D/2D düz ve L-köşe gardırop tasarım stüdyosu. Oda, gövde, iç düzen ve kapaklar düzenlenebilir. Aynı model, hareket ve erişim analizi ile teknik üretim paftalarını besler.

- İlk devir ve güvenli başlangıç · [AI_PLATFORM_HANDOFF.md](AI_PLATFORM_HANDOFF.md)
- Yeni bir yapay zekâ konuşmasına yapıştırılacak talimat · [START_HERE_NEW_AI.md](START_HERE_NEW_AI.md)
- Tamamlanan aşamalar ve güncel teslim · [PROJECT_FINAL_HANDOFF.md](PROJECT_FINAL_HANDOFF.md)
- Nihai kabul ve canlı sürüm · [Kabul raporu](FINAL_SOFTWARE_ACCEPTANCE_REPORT.md) · [Üretim tabanı](FINAL_PRODUCTION_BASELINE.md)
- Fiziksel doğrulama ve sonraki bakım · [Açık riskler](FINAL_OPEN_RISKS_AND_PHYSICAL_VALIDATION.md) · [Bakım ve AI devri](FINAL_MAINTENANCE_AND_AI_HANDOFF.md)
- Kaynak dosyaları ve ilgili testler · [CODEBASE_MAP.md](CODEBASE_MAP.md)
- Geliştirme, yayın ve geri alma · [DEVELOPMENT_AND_RELEASE_GUIDE.md](DEVELOPMENT_AND_RELEASE_GUIDE.md)
- Üretim, ölçü ve veri kuralları · [ENGINEERING_INVARIANTS.md](ENGINEERING_INVARIANTS.md)
- Açık sorunlar ve deneylerin durumu · [OPEN_ISSUES_AND_TECHNICAL_DEBT.md](OPEN_ISSUES_AND_TECHNICAL_DEBT.md)
- Yayın ve mühendislik kararları · [ENGINEERING_DECISION_LOG.md](ENGINEERING_DECISION_LOG.md)

Node sürümü [.node-version](.node-version) içinde. Depo kökünde `npm ci` ve `npm run dev -- --host 127.0.0.1 --port 5173` ile başlatın. Kayıtlar tarayıcı profiline ve adrese bağlıdır. [Canlı stüdyo](https://wardrobe-studio.cagriaksoy191.workers.dev/)

Yeni klonda varsayılan `main` dalındaki bu dizinden başlayın. `docs/final-ai-platform-handoff`, paketin hazırlandığı dal olarak korunur. Uygulama kaynak tabanı, güncel Git HEAD’i ve Cloudflare dağıtımı için AI devir rehberindeki doğrulama adımlarını izleyin.
