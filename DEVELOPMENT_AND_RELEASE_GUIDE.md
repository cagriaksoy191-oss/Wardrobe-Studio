# Windows geliştirme ve yayın rehberi

Komutları yetkilendirilmiş depo kökünde PowerShell ile çalıştırın. Özgün dizin `C:\dev\Wardrobe-Studio`. Ayrı bir dal/worktree kullanırken kullanıcının çalışma ağacını, yerel tasarımlarını ve diğer dalları koruyun.

## Git ve temiz kurulum

```powershell
git status --short --branch
git remote -v
git branch -avv
git worktree list
git fetch origin
git rev-parse HEAD origin/main
git log --oneline -8 origin/main
node --version
npm --version
npm ci
```

[.node-version](.node-version) Node 24.16.0. Devir doğrulaması Windows’ta npm 11.13.0, önceki Cloudflare Linux build’i npm 10.9.2 kullandı. [Kilitli bağımlılıklar](package-lock.json) ve [komutlar](package.json) belirleyicidir. `npm ci` ile kilitli ağacı kurun. `git reset --hard`, `git clean -fdx` ve force push kullanıcı dosyalarını ya da Git geçmişini riske atar.

## Geliştirme ve doğrulama

```powershell
npm run dev -- --host 127.0.0.1 --port 5173
```

Geliştirme sunucusu ayrı terminalde açık kalabilir. Temiz adayda CI testlerini ve build’i sıralı yürütün. Varsayılan 5 saniyelik test sınırının eşzamanlı build altında zaman aşımı gözlendi. Aşağıdaki süre CI ayarıdır. Gerçek test başarısızlığında yayın durur.

```powershell
npm test -- --run --maxWorkers=2 --testTimeout=30000
npm run build
npm run deploy:verify
npm run deploy:check
npm audit
npm audit --omit=dev
```

`deploy:check`, build + statik izin listesi + `wrangler deploy --dry-run` çalıştırır. Hazır `dist` ile yalnız dry-run için `npx wrangler deploy --dry-run`. Yerel statik paket için `npm run preview:cloudflare` ve `http://127.0.0.1:8787/`. Vite önizleme için `npm run preview -- --host 127.0.0.1`. `npm run deploy` gerçek yayın komutudur ve kullanıcı onayı gerektirir. [Statik paket denetimi](scripts/verify-static-build.mjs) · [Wrangler ayarı](wrangler.jsonc)

Devir sonucu 253/253, iki audit’te 0 bilinen bulgu, `deploy:verify` 12 dosya ve 3.317.608 bayt, en büyük 1.897.495 bayt. Wrangler 14 dizin girdisi okudu, binding yok ve dry-run ile çıktı. Zod `@__PURE__` yorumları ve ana JS paket boyutu build uyarısı verdi. Denetim, Free için 20.000 dosya ve tek dosya 25 MiB sınırını kullanır. Yayın öncesi güncel plan ve sınırları kontrol edin. [Cloudflare statik limitleri](https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/)

## Hesap ve otomatik yayın

GitHub kaynağı özel, Cloudflare Worker statik ve herkese açık. `wrangler.jsonc` yalnız `dist` ve SPA fallback tanımlar. `workers_dev: true`, `preview_urls: false`. Uygulama sunucusu ve Cloudflare veritabanı bağı yok. `public/` içeriği ve Vite build’e gömülen değerler ziyaretçilerin erişimine açıktır. Sırlar, tasarım dosyaları, arşivler, profil/yedek ve özel ortam değişkenleri paket dışında tutulur. [Güvenlik başlıkları](public/_headers) · [Git dışı dosyalar](.gitignore)

Cloudflare ayarlarında özel GitHub deposu bağlı, üretim dalı `main`, üretim derlemeleri açık, önizleme dallarının build anahtarı kapalı. Kök `/`. Build komutu `npm test -- --run --maxWorkers=2 --testTimeout=30000 && npm run build && npm run deploy:verify`. Deploy komutu `npx wrangler deploy`. İzleme yolu `*` olduğundan yalnız Markdown değişikliği bile `main` gönderiminde üretimi tetikleyebilir. Devir dalını gönderme kontrolünde önizleme build’leri kapalı görüldü ve depo ağacında GitHub Actions workflow’u yoktu. Sonraki bir gönderimden önce ayarları yeniden okuyun. [Cloudflare Builds ayarları](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/)

1. Yetkili aday, güncel `origin/main`, kapsam, CI, build, dry-run, audit ve kanonik kontrolleri karşılaştırın. Önceki başarılı Worker UUID’sini kaydedin.
2. Yalnız onaylanmış commit’leri normal Git işlemleriyle `main` dalına aktarın. Kullanıcıdan açık yayın onayı alındığında GitHub’a gönderin.
3. GitHub kontrolünde ve Cloudflare Builds logunda tam SHA, test ve build sonucu, ardından etkin Worker UUID’si ve trafik payı. Cloudflare planı Free kalmalı.
4. İzole profille gerçek HTTPS tarayıcı kabulünü ve paket karşılaştırmasını yapın. Onaylı yayın raporuna test, build, Worker, trafik, HTTPS ve açık bulguları kaydedin.

## Gerçek paket ve tarayıcı kabulü

Aday SHA’sını temiz worktree’de derleyin. `dist/index.html` referanslarının canlı ana HTML’de aynı hash’li CSS/JS dosyalarına gittiğini kontrol edin. Ana HTML, CSS, JS, lazy export chunk’ları ve fontları GET ile indirip HTTP 2xx ve SHA-256 kıyaslayın. Tarihsel 11 dosyalık kıyasta `index.html` ve OFL metni için yalnız CRLF/LF normalleştirmesine izin verildi. JS, CSS ve font baytları birebir karşılaştırıldı. `_headers` bir yapılandırma dosyasıdır, içeriği yerine HTTP başlıklarını kontrol edin. SPA fallback ile gizli dosya yolunun 200 vermesi mümkündür. Yanıtın ana HTML olup olmadığını ve istenen özel dosya içeriğinin açığa çıkmadığını inceleyin.

```powershell
@'
import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';

const site = 'https://wardrobe-studio.cagriaksoy191.workers.dev/';
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const normalize = bytes => bytes.toString('utf8').replace(/\r+\n/g, '\n');
const files = (await readdir('dist', { recursive: true, withFileTypes: true }))
  .filter(entry => entry.isFile() && !['_headers', '.assetsignore'].includes(entry.name));
for (const entry of files) {
  const localPath = entry.parentPath + '/' + entry.name;
  const path = localPath.replaceAll('\\', '/').replace(/^dist\//, '');
  const response = await fetch(new URL(path === 'index.html' ? '' : path, site), {
    cache: 'no-store',
    signal: AbortSignal.timeout(10000),
  });
  const local = await readFile(localPath);
  const live = Buffer.from(await response.arrayBuffer());
  const text = path === 'index.html' || path === 'fonts/OFL.txt';
  const matched = response.ok && (hash(local) === hash(live) ||
    (text && normalize(local) === normalize(live)));
  console.log(response.status, matched ? 'PASS' : 'FAIL', path);
  if (!matched) process.exitCode = 1;
}
'@ | node --input-type=module
```

Yeni ve sentetik tarayıcı profilinde 3D/WebGL, 2D A/B ve üst plan, bölme/raf/çekmece, menteşe ve sürgü, dar ekran/klavye/odak, Undo/Redo, manuel kayıt/F5, JSON ve üretim indirmeleri. P0’larda tanı açık ve tam CSV/ZIP kapalı olmalı. Konsol hatalarını ve tüm indirmeleri gözden geçirin. Yerel ve canlı adreslerin ayrı origin saklaması vardır. Gerçek kayıtların taşınması gerekiyorsa kullanıcı, özgün origin’den tasarım ve adlandırılmış sürümleri JSON olarak dışa aktarır ve hedef origin’de uygun araçla içe alır. [Veri ve çıktı sözleşmesi](ENGINEERING_INVARIANTS.md)

## Güvenli geri alma

Başarısız bir yayında, kullanıcıca yetkilendirilmiş geri alma için Cloudflare Deployments üzerinden daha önce doğrulanan Worker’ı seçin veya yetkili Wrangler oturumunda `npx wrangler rollback <önceki-başarılı-version-id>` kullanın. Durumu, trafik, canlı baytlar ve sentetik kayıt uyumluluğuyla doğrulayın. Önceki kodun güncel tarayıcı şemasını okuyabildiğini kontrol edin. Ardından sorumlu Git değişikliğini ayrı, test edilmiş `git revert <commit-id>` ile düzeltin. Onaylı `main` yayını kaynak ve Cloudflare durumunu tekrar hizalar. Kimlik bilgilerini belgeye, terminal çıktısına veya repoya eklemeyin. [Cloudflare rollback](https://developers.cloudflare.com/workers/versions-and-deployments/rollbacks/) · [Tarihsel yayın rehberi](DEPLOYMENT_GUIDE.md)
