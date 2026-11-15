# Orijinal25/4:20 panel örtüşmesinin teşhisi

15 Kasım 2026. Bulguyu izleyen mevcut kimlik **D3-BASELINE-001**, sınıf **NOMINAL_GEOMETRY_PLACEMENT_DEFECT**. Yeni fiziksel P0 ilan edilmedi. Kanonik Design, solver, sahne ve kesim listesi değiştirilmedi.

20 çiftin her birinde gerçekten pozitif nominal katı kesişimi vardır; yalnız ekrandaki çizgi kalınlığı değildir. Araştırma SAT eşiği0,05 mm, üretim montaj toleransı değildir. Belgelenmiş kanal/geçme veya kasıtlı penetrasyon kanıtı yoktur; bütün20 olay koordinat yuvarlama kaynaklı nominal penetrasyon olarak sınıflandırılır. Gerçek parça kesim/montaj kusuru, tolerans veya atölye ölçümü bulunmadığından **NOT_PROVEN_FROM_NOMINAL_RENDER_COORDINATES**.

İlk10 çift: köşe yan panel merkezi `arm - Math.round(t/2)` ile25 mm levhada887 mm; nominal doğru merkez887,5 mm. Yatay beşgen poligonun iç kenarı875 mm'de kalırken yan yüz874,5 mm'ye gelir. A yönündeX0,5 mm, B yönündeZ0,5 mm kesişme oluşur (`cornerSolver.ts`119/143).

Son10 çift: raf/yatay bölücü merkezi `bounds.x0 + Math.round(odd width/2)` nedeniyle tam yarımdan0,5 mm kayar. Yan panel merkezi zaten yarım mm olduğundan tamsayı kesim ölçüsüyle kurulabilecek birleşim nominal yerleşimde0,5 mm çakışır (`carcassSolver.ts`, yatay bölücü ve raf merkezleri).

Yalnız kopya model üzerinde köşeA.X/B.Z merkezlerine+0,5, etkilenen düz raf/bölücülere yerel yatay eksende−0,5 mm uygulanan karşı olgusal tanıda20→0 statik kesişme olur. Tüm kesim en/boy/kalınlıkları ve poligonları birebir aynı kalır. Bu deney bir solver düzeltmesi değildir. Tamsayı mm kesim ölçüleri yarım mm panel merkeziyle geometrik olarak tutarlı olabilir; bu görev mimari kuralı yeniden tanımlamaz.

Çift bazlı hacim toplamı **133812,5 mm³ =133,8125 cm³ =0,0001338125 m³**. Bu değer tüm birleşimlerin küresel hacim birleşimi hesabı değildir. A köşe çiftleri0,5×25×596=7450 mm³; B0,5×25×476=5950 mm³. A düz raflar7262,5, B raflar5762,5 mm³; yatay bölücü7450 mm³.

Her olayın gerçek iki kimliği, rolü, dünya merkezi, kutu boyutu, X/Y/Z kesişme derinliği, tam kesişim poligonu/hacmi ve nominal kesim ebatları aşağıdaki ek tabloda bulunur. Tam hassasiyet JSON teslim kökündeki `ORIGINAL_25_4_OVERLAP_AUDIT.json` içindedir. Ortak tolerans varsayımı UNKNOWN; kesim ölçüsü etkisi bu koordinat düzeltmesi için sıfır. Üretim kesimi bu görevde değiştirilmedi. D3 galerisindeki orijinal25/4 NO_GO etiketi katı yerleşim kusurunu gösterir; yeni kanıtlanmış fiziksel P0 demek değildir.

Sonraki ayrı görev, koordinat hassasiyetini/üretim montaj niyetini ve tüm tek/çift kalınlıkları test etmelidir. Kusur küçük diye gizlenmez; donanım veya erişim sorunlarının yerine de geçirilmez.

<!-- PAIR_TABLE -->

### Çift 1

| Gerçek parça kimliği | Tip | Dünya merkezi X/Y/Z mm | Kutu X/Y/Z mm | Kesim en/boy/kalınlık mm |
| --- | --- | --- | --- | --- |
| `junc-custom-side-A` |cornerSidePanel|887 / 1220 / 302|25 / 2280 / 596|596 / 2280 / 25|
| `junc-custom-bottom-pentagon` |cornerPolygonShelf|0 / 80 / 0|871 / 25 / 871|871 / 871 / 25|

Kesişim X/Y/Z: **0.5 / 25 / 596 mm**; plan alanı298 mm², hacim **7450 mm³**. Kesişim plan poligonu: (874.5,4); (875,4); (875,600); (874.5,600).

Sınıf: koordinat yuvarlamasıyla nominal katı penetrasyonu; kasıtlı geçme kanıtı yok. Kaynak: src/core/solver/cornerSolver.ts:119/143. Kesim ebatları/poligonları karşı olgusal merkez düzeltmesinde aynı; fiziksel imalat kusuru kanıtlanmadı, üretim toleransı UNKNOWN.

### Çift 2

| Gerçek parça kimliği | Tip | Dünya merkezi X/Y/Z mm | Kutu X/Y/Z mm | Kesim en/boy/kalınlık mm |
| --- | --- | --- | --- | --- |
| `junc-custom-side-A` |cornerSidePanel|887 / 1220 / 302|25 / 2280 / 596|596 / 2280 / 25|
| `junc-custom-top-pentagon` |cornerPolygonShelf|0 / 2335 / 0|871 / 25 / 871|871 / 871 / 25|

Kesişim X/Y/Z: **0.5 / 25 / 596 mm**; plan alanı298 mm², hacim **7450 mm³**. Kesişim plan poligonu: (874.5,4); (875,4); (875,600); (874.5,600).

Sınıf: koordinat yuvarlamasıyla nominal katı penetrasyonu; kasıtlı geçme kanıtı yok. Kaynak: src/core/solver/cornerSolver.ts:119/143. Kesim ebatları/poligonları karşı olgusal merkez düzeltmesinde aynı; fiziksel imalat kusuru kanıtlanmadı, üretim toleransı UNKNOWN.

### Çift 3

| Gerçek parça kimliği | Tip | Dünya merkezi X/Y/Z mm | Kutu X/Y/Z mm | Kesim en/boy/kalınlık mm |
| --- | --- | --- | --- | --- |
| `junc-custom-side-A` |cornerSidePanel|887 / 1220 / 302|25 / 2280 / 596|596 / 2280 / 25|
| `junc-custom-shelf-pentagon-1` |cornerPolygonShelf|0 / 643 / 0|871 / 25 / 871|871 / 871 / 25|

Kesişim X/Y/Z: **0.5 / 25 / 596 mm**; plan alanı298 mm², hacim **7450 mm³**. Kesişim plan poligonu: (874.5,4); (875,4); (875,600); (874.5,600).

Sınıf: koordinat yuvarlamasıyla nominal katı penetrasyonu; kasıtlı geçme kanıtı yok. Kaynak: src/core/solver/cornerSolver.ts:119/143. Kesim ebatları/poligonları karşı olgusal merkez düzeltmesinde aynı; fiziksel imalat kusuru kanıtlanmadı, üretim toleransı UNKNOWN.

### Çift 4

| Gerçek parça kimliği | Tip | Dünya merkezi X/Y/Z mm | Kutu X/Y/Z mm | Kesim en/boy/kalınlık mm |
| --- | --- | --- | --- | --- |
| `junc-custom-side-A` |cornerSidePanel|887 / 1220 / 302|25 / 2280 / 596|596 / 2280 / 25|
| `junc-custom-shelf-pentagon-2` |cornerPolygonShelf|0 / 1206 / 0|871 / 25 / 871|871 / 871 / 25|

Kesişim X/Y/Z: **0.5 / 25 / 596 mm**; plan alanı298 mm², hacim **7450 mm³**. Kesişim plan poligonu: (874.5,4); (875,4); (875,600); (874.5,600).

Sınıf: koordinat yuvarlamasıyla nominal katı penetrasyonu; kasıtlı geçme kanıtı yok. Kaynak: src/core/solver/cornerSolver.ts:119/143. Kesim ebatları/poligonları karşı olgusal merkez düzeltmesinde aynı; fiziksel imalat kusuru kanıtlanmadı, üretim toleransı UNKNOWN.

### Çift 5

| Gerçek parça kimliği | Tip | Dünya merkezi X/Y/Z mm | Kutu X/Y/Z mm | Kesim en/boy/kalınlık mm |
| --- | --- | --- | --- | --- |
| `junc-custom-side-A` |cornerSidePanel|887 / 1220 / 302|25 / 2280 / 596|596 / 2280 / 25|
| `junc-custom-shelf-pentagon-3` |cornerPolygonShelf|0 / 1769 / 0|871 / 25 / 871|871 / 871 / 25|

Kesişim X/Y/Z: **0.5 / 25 / 596 mm**; plan alanı298 mm², hacim **7450 mm³**. Kesişim plan poligonu: (874.5,4); (875,4); (875,600); (874.5,600).

Sınıf: koordinat yuvarlamasıyla nominal katı penetrasyonu; kasıtlı geçme kanıtı yok. Kaynak: src/core/solver/cornerSolver.ts:119/143. Kesim ebatları/poligonları karşı olgusal merkez düzeltmesinde aynı; fiziksel imalat kusuru kanıtlanmadı, üretim toleransı UNKNOWN.

### Çift 6

| Gerçek parça kimliği | Tip | Dünya merkezi X/Y/Z mm | Kutu X/Y/Z mm | Kesim en/boy/kalınlık mm |
| --- | --- | --- | --- | --- |
| `junc-custom-side-B` |cornerSidePanel|242 / 1220 / 887|476 / 2280 / 25|476 / 2280 / 25|
| `junc-custom-bottom-pentagon` |cornerPolygonShelf|0 / 80 / 0|871 / 25 / 871|871 / 871 / 25|

Kesişim X/Y/Z: **476 / 25 / 0.5 mm**; plan alanı238 mm², hacim **5950 mm³**. Kesişim plan poligonu: (4,874.5); (480,874.5); (480,875); (4,875).

Sınıf: koordinat yuvarlamasıyla nominal katı penetrasyonu; kasıtlı geçme kanıtı yok. Kaynak: src/core/solver/cornerSolver.ts:119/143. Kesim ebatları/poligonları karşı olgusal merkez düzeltmesinde aynı; fiziksel imalat kusuru kanıtlanmadı, üretim toleransı UNKNOWN.

### Çift 7

| Gerçek parça kimliği | Tip | Dünya merkezi X/Y/Z mm | Kutu X/Y/Z mm | Kesim en/boy/kalınlık mm |
| --- | --- | --- | --- | --- |
| `junc-custom-side-B` |cornerSidePanel|242 / 1220 / 887|476 / 2280 / 25|476 / 2280 / 25|
| `junc-custom-top-pentagon` |cornerPolygonShelf|0 / 2335 / 0|871 / 25 / 871|871 / 871 / 25|

Kesişim X/Y/Z: **476 / 25 / 0.5 mm**; plan alanı238 mm², hacim **5950 mm³**. Kesişim plan poligonu: (4,874.5); (480,874.5); (480,875); (4,875).

Sınıf: koordinat yuvarlamasıyla nominal katı penetrasyonu; kasıtlı geçme kanıtı yok. Kaynak: src/core/solver/cornerSolver.ts:119/143. Kesim ebatları/poligonları karşı olgusal merkez düzeltmesinde aynı; fiziksel imalat kusuru kanıtlanmadı, üretim toleransı UNKNOWN.

### Çift 8

| Gerçek parça kimliği | Tip | Dünya merkezi X/Y/Z mm | Kutu X/Y/Z mm | Kesim en/boy/kalınlık mm |
| --- | --- | --- | --- | --- |
| `junc-custom-side-B` |cornerSidePanel|242 / 1220 / 887|476 / 2280 / 25|476 / 2280 / 25|
| `junc-custom-shelf-pentagon-1` |cornerPolygonShelf|0 / 643 / 0|871 / 25 / 871|871 / 871 / 25|

Kesişim X/Y/Z: **476 / 25 / 0.5 mm**; plan alanı238 mm², hacim **5950 mm³**. Kesişim plan poligonu: (4,874.5); (480,874.5); (480,875); (4,875).

Sınıf: koordinat yuvarlamasıyla nominal katı penetrasyonu; kasıtlı geçme kanıtı yok. Kaynak: src/core/solver/cornerSolver.ts:119/143. Kesim ebatları/poligonları karşı olgusal merkez düzeltmesinde aynı; fiziksel imalat kusuru kanıtlanmadı, üretim toleransı UNKNOWN.

### Çift 9

| Gerçek parça kimliği | Tip | Dünya merkezi X/Y/Z mm | Kutu X/Y/Z mm | Kesim en/boy/kalınlık mm |
| --- | --- | --- | --- | --- |
| `junc-custom-side-B` |cornerSidePanel|242 / 1220 / 887|476 / 2280 / 25|476 / 2280 / 25|
| `junc-custom-shelf-pentagon-2` |cornerPolygonShelf|0 / 1206 / 0|871 / 25 / 871|871 / 871 / 25|

Kesişim X/Y/Z: **476 / 25 / 0.5 mm**; plan alanı238 mm², hacim **5950 mm³**. Kesişim plan poligonu: (4,874.5); (480,874.5); (480,875); (4,875).

Sınıf: koordinat yuvarlamasıyla nominal katı penetrasyonu; kasıtlı geçme kanıtı yok. Kaynak: src/core/solver/cornerSolver.ts:119/143. Kesim ebatları/poligonları karşı olgusal merkez düzeltmesinde aynı; fiziksel imalat kusuru kanıtlanmadı, üretim toleransı UNKNOWN.

### Çift 10

| Gerçek parça kimliği | Tip | Dünya merkezi X/Y/Z mm | Kutu X/Y/Z mm | Kesim en/boy/kalınlık mm |
| --- | --- | --- | --- | --- |
| `junc-custom-side-B` |cornerSidePanel|242 / 1220 / 887|476 / 2280 / 25|476 / 2280 / 25|
| `junc-custom-shelf-pentagon-3` |cornerPolygonShelf|0 / 1769 / 0|871 / 25 / 871|871 / 871 / 25|

Kesişim X/Y/Z: **476 / 25 / 0.5 mm**; plan alanı238 mm², hacim **5950 mm³**. Kesişim plan poligonu: (4,874.5); (480,874.5); (480,875); (4,875).

Sınıf: koordinat yuvarlamasıyla nominal katı penetrasyonu; kasıtlı geçme kanıtı yok. Kaynak: src/core/solver/cornerSolver.ts:119/143. Kesim ebatları/poligonları karşı olgusal merkez düzeltmesinde aynı; fiziksel imalat kusuru kanıtlanmadı, üretim toleransı UNKNOWN.

### Çift 11

| Gerçek parça kimliği | Tip | Dünya merkezi X/Y/Z mm | Kutu X/Y/Z mm | Kesim en/boy/kalınlık mm |
| --- | --- | --- | --- | --- |
| `bay-A1-side-right` |sidePanel|1927.5 / 1220 / 302|25 / 2280 / 596|596 / 2280 / 25|
| `A-root-hdiv-1` |shelf|1408 / 807.5 / 302|1015 / 25 / 596|1015 / 596 / 25|

Kesişim X/Y/Z: **0.5 / 25 / 596 mm**; plan alanı298 mm², hacim **7450 mm³**. Kesişim plan poligonu: (1915,4); (1915.5,4); (1915.5,600); (1915,600).

Sınıf: koordinat yuvarlamasıyla nominal katı penetrasyonu; kasıtlı geçme kanıtı yok. Kaynak: src/core/solver/carcassSolver.ts: horizontal divider and shelf center construction. Kesim ebatları/poligonları karşı olgusal merkez düzeltmesinde aynı; fiziksel imalat kusuru kanıtlanmadı, üretim toleransı UNKNOWN.

### Çift 12

| Gerçek parça kimliği | Tip | Dünya merkezi X/Y/Z mm | Kutu X/Y/Z mm | Kesim en/boy/kalınlık mm |
| --- | --- | --- | --- | --- |
| `bay-A2-side-right` |sidePanel|2967.5 / 1220 / 302|25 / 2280 / 596|596 / 2280 / 25|
| `A-shelves-shelf-1` |shelf|2448 / 467.5 / 295|1015 / 25 / 581|1015 / 581 / 25|

Kesişim X/Y/Z: **0.5 / 25 / 581 mm**; plan alanı290.5 mm², hacim **7262.5 mm³**. Kesişim plan poligonu: (2955,585.5); (2955,4.5); (2955.5,4.5); (2955.5,585.5).

Sınıf: koordinat yuvarlamasıyla nominal katı penetrasyonu; kasıtlı geçme kanıtı yok. Kaynak: src/core/solver/carcassSolver.ts: horizontal divider and shelf center construction. Kesim ebatları/poligonları karşı olgusal merkez düzeltmesinde aynı; fiziksel imalat kusuru kanıtlanmadı, üretim toleransı UNKNOWN.

### Çift 13

| Gerçek parça kimliği | Tip | Dünya merkezi X/Y/Z mm | Kutu X/Y/Z mm | Kesim en/boy/kalınlık mm |
| --- | --- | --- | --- | --- |
| `bay-A2-side-right` |sidePanel|2967.5 / 1220 / 302|25 / 2280 / 596|596 / 2280 / 25|
| `A-shelves-shelf-2` |shelf|2448 / 843.5 / 295|1015 / 25 / 581|1015 / 581 / 25|

Kesişim X/Y/Z: **0.5 / 25 / 581 mm**; plan alanı290.5 mm², hacim **7262.5 mm³**. Kesişim plan poligonu: (2955,585.5); (2955,4.5); (2955.5,4.5); (2955.5,585.5).

Sınıf: koordinat yuvarlamasıyla nominal katı penetrasyonu; kasıtlı geçme kanıtı yok. Kaynak: src/core/solver/carcassSolver.ts: horizontal divider and shelf center construction. Kesim ebatları/poligonları karşı olgusal merkez düzeltmesinde aynı; fiziksel imalat kusuru kanıtlanmadı, üretim toleransı UNKNOWN.

### Çift 14

| Gerçek parça kimliği | Tip | Dünya merkezi X/Y/Z mm | Kutu X/Y/Z mm | Kesim en/boy/kalınlık mm |
| --- | --- | --- | --- | --- |
| `bay-A2-side-right` |sidePanel|2967.5 / 1220 / 302|25 / 2280 / 596|596 / 2280 / 25|
| `A-shelves-shelf-3` |shelf|2448 / 1219.5 / 295|1015 / 25 / 581|1015 / 581 / 25|

Kesişim X/Y/Z: **0.5 / 25 / 581 mm**; plan alanı290.5 mm², hacim **7262.5 mm³**. Kesişim plan poligonu: (2955,585.5); (2955,4.5); (2955.5,4.5); (2955.5,585.5).

Sınıf: koordinat yuvarlamasıyla nominal katı penetrasyonu; kasıtlı geçme kanıtı yok. Kaynak: src/core/solver/carcassSolver.ts: horizontal divider and shelf center construction. Kesim ebatları/poligonları karşı olgusal merkez düzeltmesinde aynı; fiziksel imalat kusuru kanıtlanmadı, üretim toleransı UNKNOWN.

### Çift 15

| Gerçek parça kimliği | Tip | Dünya merkezi X/Y/Z mm | Kutu X/Y/Z mm | Kesim en/boy/kalınlık mm |
| --- | --- | --- | --- | --- |
| `bay-A2-side-right` |sidePanel|2967.5 / 1220 / 302|25 / 2280 / 596|596 / 2280 / 25|
| `A-shelves-shelf-4` |shelf|2448 / 1595.5 / 295|1015 / 25 / 581|1015 / 581 / 25|

Kesişim X/Y/Z: **0.5 / 25 / 581 mm**; plan alanı290.5 mm², hacim **7262.5 mm³**. Kesişim plan poligonu: (2955,585.5); (2955,4.5); (2955.5,4.5); (2955.5,585.5).

Sınıf: koordinat yuvarlamasıyla nominal katı penetrasyonu; kasıtlı geçme kanıtı yok. Kaynak: src/core/solver/carcassSolver.ts: horizontal divider and shelf center construction. Kesim ebatları/poligonları karşı olgusal merkez düzeltmesinde aynı; fiziksel imalat kusuru kanıtlanmadı, üretim toleransı UNKNOWN.

### Çift 16

| Gerçek parça kimliği | Tip | Dünya merkezi X/Y/Z mm | Kutu X/Y/Z mm | Kesim en/boy/kalınlık mm |
| --- | --- | --- | --- | --- |
| `bay-A2-side-right` |sidePanel|2967.5 / 1220 / 302|25 / 2280 / 596|596 / 2280 / 25|
| `A-shelves-shelf-5` |shelf|2448 / 1971.5 / 295|1015 / 25 / 581|1015 / 581 / 25|

Kesişim X/Y/Z: **0.5 / 25 / 581 mm**; plan alanı290.5 mm², hacim **7262.5 mm³**. Kesişim plan poligonu: (2955,585.5); (2955,4.5); (2955.5,4.5); (2955.5,585.5).

Sınıf: koordinat yuvarlamasıyla nominal katı penetrasyonu; kasıtlı geçme kanıtı yok. Kaynak: src/core/solver/carcassSolver.ts: horizontal divider and shelf center construction. Kesim ebatları/poligonları karşı olgusal merkez düzeltmesinde aynı; fiziksel imalat kusuru kanıtlanmadı, üretim toleransı UNKNOWN.

### Çift 17

| Gerçek parça kimliği | Tip | Dünya merkezi X/Y/Z mm | Kutu X/Y/Z mm | Kesim en/boy/kalınlık mm |
| --- | --- | --- | --- | --- |
| `bay-B1-side-right` |sidePanel|242 / 1220 / 2567.5|476 / 2280 / 25|476 / 2280 / 25|
| `B-shelves-shelf-1` |shelf|235 / 543.5 / 1728|461 / 25 / 1655|1655 / 461 / 25|

Kesişim X/Y/Z: **461 / 25 / 0.5 mm**; plan alanı230.5 mm², hacim **5762.5 mm³**. Kesişim plan poligonu: (4.5,2555); (465.5,2555); (465.5,2555.5); (4.5,2555.5).

Sınıf: koordinat yuvarlamasıyla nominal katı penetrasyonu; kasıtlı geçme kanıtı yok. Kaynak: src/core/solver/carcassSolver.ts: horizontal divider and shelf center construction. Kesim ebatları/poligonları karşı olgusal merkez düzeltmesinde aynı; fiziksel imalat kusuru kanıtlanmadı, üretim toleransı UNKNOWN.

### Çift 18

| Gerçek parça kimliği | Tip | Dünya merkezi X/Y/Z mm | Kutu X/Y/Z mm | Kesim en/boy/kalınlık mm |
| --- | --- | --- | --- | --- |
| `bay-B1-side-right` |sidePanel|242 / 1220 / 2567.5|476 / 2280 / 25|476 / 2280 / 25|
| `B-shelves-shelf-2` |shelf|235 / 994.5 / 1728|461 / 25 / 1655|1655 / 461 / 25|

Kesişim X/Y/Z: **461 / 25 / 0.5 mm**; plan alanı230.5 mm², hacim **5762.5 mm³**. Kesişim plan poligonu: (4.5,2555); (465.5,2555); (465.5,2555.5); (4.5,2555.5).

Sınıf: koordinat yuvarlamasıyla nominal katı penetrasyonu; kasıtlı geçme kanıtı yok. Kaynak: src/core/solver/carcassSolver.ts: horizontal divider and shelf center construction. Kesim ebatları/poligonları karşı olgusal merkez düzeltmesinde aynı; fiziksel imalat kusuru kanıtlanmadı, üretim toleransı UNKNOWN.

### Çift 19

| Gerçek parça kimliği | Tip | Dünya merkezi X/Y/Z mm | Kutu X/Y/Z mm | Kesim en/boy/kalınlık mm |
| --- | --- | --- | --- | --- |
| `bay-B1-side-right` |sidePanel|242 / 1220 / 2567.5|476 / 2280 / 25|476 / 2280 / 25|
| `B-shelves-shelf-3` |shelf|235 / 1445.5 / 1728|461 / 25 / 1655|1655 / 461 / 25|

Kesişim X/Y/Z: **461 / 25 / 0.5 mm**; plan alanı230.5 mm², hacim **5762.5 mm³**. Kesişim plan poligonu: (4.5,2555); (465.5,2555); (465.5,2555.5); (4.5,2555.5).

Sınıf: koordinat yuvarlamasıyla nominal katı penetrasyonu; kasıtlı geçme kanıtı yok. Kaynak: src/core/solver/carcassSolver.ts: horizontal divider and shelf center construction. Kesim ebatları/poligonları karşı olgusal merkez düzeltmesinde aynı; fiziksel imalat kusuru kanıtlanmadı, üretim toleransı UNKNOWN.

### Çift 20

| Gerçek parça kimliği | Tip | Dünya merkezi X/Y/Z mm | Kutu X/Y/Z mm | Kesim en/boy/kalınlık mm |
| --- | --- | --- | --- | --- |
| `bay-B1-side-right` |sidePanel|242 / 1220 / 2567.5|476 / 2280 / 25|476 / 2280 / 25|
| `B-shelves-shelf-4` |shelf|235 / 1896.5 / 1728|461 / 25 / 1655|1655 / 461 / 25|

Kesişim X/Y/Z: **461 / 25 / 0.5 mm**; plan alanı230.5 mm², hacim **5762.5 mm³**. Kesişim plan poligonu: (4.5,2555); (465.5,2555); (465.5,2555.5); (4.5,2555.5).

Sınıf: koordinat yuvarlamasıyla nominal katı penetrasyonu; kasıtlı geçme kanıtı yok. Kaynak: src/core/solver/carcassSolver.ts: horizontal divider and shelf center construction. Kesim ebatları/poligonları karşı olgusal merkez düzeltmesinde aynı; fiziksel imalat kusuru kanıtlanmadı, üretim toleransı UNKNOWN.
