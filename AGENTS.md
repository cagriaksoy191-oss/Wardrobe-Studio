# WARDROBE STUDIO — AGENT TALİMATLARI (`AGENTS.md`)

Bu dosya, **Wardrobe Studio** kod tabanında çalışan yazılım geliştirme ajanları (OpenAI Codex vb.) için bağlayıcı mimari kuralları, çalışma dizini sınırlarını ve doğrulama adımlarını tanımlar.

---

## 1. Proje Kimliği ve Aktif Çalışma Dizini

- **Proje Adı:** Wardrobe Studio — Parametrik 3D/2D Gömme ve L-Köşe Gardırop Tasarım Stüdyosu.
- **Aktif Çalışma Dizini:** `C:\dev\Wardrobe-Studio`
  - **KESİN KURAL:** Tüm dosya okuma, yazma, test ve derleme işlemleri yalnızca `C:\dev\Wardrobe-Studio` içinde yapılmalıdır. Eski OneDrive klasörlerine kesinlikle dosya yazmayın.
- **Mevcut durum.** Aşama 1–5 tamamlandı. [Nihai kabul](FINAL_SOFTWARE_ACCEPTANCE_REPORT.md), [üretim tabanı](FINAL_PRODUCTION_BASELINE.md) ve [üç fiziksel P0](FINAL_OPEN_RISKS_AND_PHYSICAL_VALIDATION.md) güncel durumu kaydeder. Aşama 4 ve 5 doğrulama raporları tarihsel kayıtlardır. Genel denetim, refactor veya yeni ürün kapsamı kullanıcıdan ayrı talimat gerektirir.

---

## 2. Okunması Gereken Belge Hiyerarşisi

Yeni platform veya temiz klonda önce [AI_PLATFORM_HANDOFF.md](AI_PLATFORM_HANDOFF.md) dosyasını okuyun. Yetkilendirilmiş yeni klon kökü, özgün makinedeki çalışma dizini sınırının karşılığıdır. Güncel üretim tabanı, açık P0 güvenlik kapıları ve test sayımı devir belgelerinde bulunur. Eski doğrulama raporlarının sayımları tarihsel referanstır.

Yeni bir göreve başlamadan önce kök dizindeki şu belgeleri sırasıyla inceleyin:

1. [`PROJECT_HANDOFF.md`](PROJECT_HANDOFF.md) — Projenin vizyonu, tamamlanan aşamaların (Aşama 1 → Aşama 3) tam özeti, mevcut özellik haritası ve Aşama 4 / Aşama 5 görev kapsamı.
2. [`CODEBASE_MAP.md`](CODEBASE_MAP.md) — Tüm kaynak dosyaların sorumlulukları, `Design` / `ResolvedModel` şemaları, parametrik çözücü matematiği, 3D R3F sahne yapısı, veri akışları ve Aşama 4–5 entegrasyon noktaları.
3. [`HANDOFF_VERIFICATION.md`](HANDOFF_VERIFICATION.md) — Ortam sürümleri, 37 birim testinin dökümü, üretim derlemesi durumu ve özellik doğrulama matrisi.
4. [`wardrobe_studio_master_plan.md`](wardrobe_studio_master_plan.md) — Onaylanmış 5 aşamalı ana geliştirme planı (**Salt-Okunur Ana Sözleşme**).
5. [`wardrobe_studio_additional_requirements.md`](wardrobe_studio_additional_requirements.md) — Kullanıcı tarafından eklenen kalıcı gereksinimler `Gereksinim A–Z` (**Salt-Okunur Ek Sözleşme**).

---

## 3. Değiştirilemez Mimari Kurallar (Architectural Invariants)

1. **Tamsayı Milimetre (`integer mm`) Kuralı:**
   - Veri modelindeki (`Design`) ölçüler ve çözülen kesim boyutları **tamsayı milimetredir**. Türetilen nominal panel merkezleri, D3-BASELINE-001 gereği tek ölçülü panelleri yüzlerine oturtmak için yarım milimetre olabilir.
   - Kayan noktalı (`float`) metre dönüşümü (`MM_TO_M = 0.001`) yalnızca `src/canvas/` altındaki R3F 3D/2D sahne bileşenlerinde uygulanır.
2. **Sabit / Esnek (`Fixed / Flex`) Tamsayı Dağıtımı:**
   - Bölme genişlikleri ve hücre bölünmeleri [`distributeIntegerMm`](file:///C:/dev/Wardrobe-Studio/src/core/solver/flexSolver.ts) ile çözülür. Yuvarlama farkı (`remainderMm`) son serbest esnek öğeye eklenerek `toplam(resolvedMm) + araBölücüler === totalSpanMm` eşitliği `%100` korunur.
3. **Çift Katmanlı Veri Modeli (`Design` → `ResolvedModel`):**
   - `Design` (`src/core/schema/types.ts`) yalnızca kalıcı kullanıcı niyetini saklar.
   - 3D koordinatlar, panel kesim ebatları, çekmece kasa parçaları, kapak pivotları ve uyarılar asla `Design` içine kaydedilmez; her zaman `solveDesign(design)` (`src/core/solver/carcassSolver.ts`) ile deterministik olarak türetilir.
4. **Paylaşımlı Dikme (`Shared Partition`) ve Parametrik Kalınlıklar:**
   - Yan yana duran `N` adet bölme (`Bay`), `N + 1` adet dikey panel (`divider`) paylaşır.
   - Gövde/raf kalınlığı (`panelThicknessMm`, varsayılan 18 mm, 12–36 mm) ve arkalık kalınlığı (`backPanelThicknessMm`, varsayılan 8 mm, 3–18 mm) parametriktir. `run.panelThicknessMm` ve `run.backPanelThicknessMm` değerlerini kullanın.
5. **L-Köşe Matematiği (Beşgen & Kör Köşe):**
   - Beşgen köşe (`diagonal`), A kolundan `diagonalArmAMm` ve B kolundan `diagonalArmBMm` tüketir. Asimetrik kol derinliklerinde (`D_A != D_B`) ön kapak açıklığı Pisagor formülüyle $\sqrt{(\text{Arm}_A - D_B)^2 + (\text{Arm}_B - D_A)^2}$ olarak hesaplanır.
   - Kör köşe (`blind`), öncelikli kolun derinliği + klapa (`runA.depthMm + fillerWidthMm`) kadar yanaşan koldan tüketir; `fillerWidthMm < 45 mm` ise çakışma hatası üretilir.
6. **`SplitNode` Yön Semantiği ve Sanal Alt Aralıklar (`::sub-k`):**
   - `SplitNode.direction === 'horizontal'`, **yatay bir raf/tabla ile alt-üst bölünmeyi** (Y ekseni yığını) ifade eder.
   - `SplitNode.direction === 'vertical'`, **dikey bir ara dikme ile sol-sağ bölünmeyi** (X ekseni sırası) ifade eder.
   - Çok katlı raflar (`shelfStack`), ayakkabılıklar (`shoeRack`), çift kat askılar (`doubleHanging`) ve beşgen köşe rafları, `carcassSolver` tarafından `${leafId}::sub-${k}` ve `${junctionId}::corner-sub-${k}` kimlikli bağımsız seçilebilir hücrelere (`ResolvedCell`) dönüştürülür. Bu hücrelerde değişiklik yaparken `treeMutator.ts` içindeki `realizeSubIntervalInDesign` veya `realizeLeafWithExactSolvedHeights` fonksiyonlarını kullanın.
7. **3D Raycast Seçim Güvenliği (`NOOP_RAYCAST`):**
   - 3D sahneye eklenen tüm dekoratif veya yardımcı öğeler (3D kıyafet/eşya önizlemeleri, LED şeritler, tel kafes seçim kutuları, çakışma önizleme kutuları, ergonomi/engel katmanları) `raycast={NOOP_RAYCAST}` kullanmalıdır; aksi halde kullanıcının raf aralıklarını ve çekmeceleri tıklayarak seçmesini engellerler.

---

## 4. Geliştirme Sınırları ve Kapsam Kuralları

- **Ana Plan ve Ek Gereksinimlerin Korunması:** `wardrobe_studio_master_plan.md` ve `wardrobe_studio_additional_requirements.md` belgelerindeki hiçbir özellik silinemez, basitleştirilerek iptal edilemez veya başka bir özelliğin yerine geçirilemez.
- **Zorunlu Sürgülü Kapak ve Hibrit Cephe (`Gereksinim D, E, F`):** Sürgülü kapak sistemi ve aynı dolapta menteşeli + sürgülü + açık bölme (hibrit cephe) kullanımı opsiyonel değil, **Aşama 4–5 için zorunludur**.
- **Zorunlu Gerçek Ölçülü Marangoz Üretim Paketi (`Gereksinim X, Y, Z`):** Aşama 5'teki üretim çıktısı; malzeme kalınlık özetini, 2D teknik cephe/plan/kesit çizimlerini, modül detaylarını ve parça bazlı tam kesim listesini (CSV + çok sayfalı yazdırılabilir/PDF rapor) içermelidir.
- **Mevcut Çalışan İşlevlerin Korunması:** Aşama 1–3'te tamamlanan özellikleri (3D kamera koruma, bağımsız çekmece/kapak editörü, çoklu seçim, yönlü boyutlandırma, PBR malzemeler, 3D kulplar, LED aydınlatma, 3D eşya önizlemeleri, `localStorage` + `IndexedDB` + `Undo/Redo`) gereksiz yere yeniden yazmayın; mevcut temiz mimariyi genişletin.

---

## 5. Doğrulama ve Çalıştırma Komutları

Her geliştirme adımından sonra aşağıdaki komutları `C:\dev\Wardrobe-Studio` dizininde çalıştırarak sıfır hata koşulunu doğrulayın:

```powershell
# Güncel 358 test ve yeni testler CI ayarıyla geçmeli
npm test -- --run --maxWorkers=2 --testTimeout=30000

# TypeScript sıkı tip denetimi ve Vite üretim derlemesi (0 hata ile tamamlanmalıdır)
npm run build

# Yerel geliştirme sunucusu (Varsayılan: http://127.0.0.1:5173/)
npm run dev -- --host 127.0.0.1 --port 5173
```
