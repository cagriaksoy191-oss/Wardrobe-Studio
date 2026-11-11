# Wardrobe Studio yayın rehberi

11 Kasım 2026. Çalışma dizini `C:\dev\Wardrobe-Studio`.

Uygulama Vite ile derlenir ve Cloudflare Workers Static Assets üzerinden sunulur. `wardrobe-studio` projesi üretim adresini taşır. [Canlı site](https://wardrobe-studio.cagriaksoy191.workers.dev/) · [Doğrulama raporu](DEPLOYMENT_VERIFICATION.md)

## Yerel komutlar

Node.js sürümü `.node-version` içinde 24.16.0 olarak sabitlenmiştir. Bağımlılıklar `package-lock.json` ile kurulmalıdır.

```powershell
Set-Location C:\dev\Wardrobe-Studio
npm ci
npm test -- --run
npm run deploy:check
```

`deploy:check` üretim derlemesini oluşturur, yalnız izin verilen statik dosyaları ve Free plan boyut sınırlarını denetler, Wrangler dry-run çalıştırır. `wrangler.jsonc` yalnız `dist` klasörünü yayınlar. `public` dosyaları Vite tarafından bu klasöre kopyalanır. Yeni bir herkese açık dosya gerekiyorsa `scripts/verify-static-build.mjs` içindeki dosya listesi incelemeyle güncellenir.

Cloudflare’ın yerel statik sunumunu denemek için derlemeden sonra ayrı terminal açın.

```powershell
npm run preview:cloudflare
```

Test adresi `http://127.0.0.1:8787/`. Normal geliştirme `npm run dev -- --host 127.0.0.1 --port 5173` ile yürür. Canlı site, geliştirme bilgisayarı kapalıyken Cloudflare’da hizmet verir. Yerel değişiklikler Git’e gönderilip başarılı yayın oluşunca canlıya geçer.

## GitHub ve Cloudflare yayın ayarları

Özel kaynak deposunun `main` dalı Cloudflare Builds’e bağlıdır. Cloudflare bağımlılıkları kilit dosyasından `npm clean-install` ile kurar. Derlenmiş JavaScript ziyaretçilere açık olarak sunulur. [GitHub deposu](https://github.com/cagriaksoy191-oss/Wardrobe-Studio)

**Workers & Pages → wardrobe-studio → Settings → Builds → Production** altında depo, üretim dalı `main` ve kök dizin `/` görünür. Build komutu iki test worker’ı ve 30 saniyelik test süresi sınırıyla çalışır. Derleme ancak testler başarılıysa başlar.

```sh
npm test -- --run --maxWorkers=2 --testTimeout=30000 && npm run build && npm run deploy:verify
```

Deploy komutu yayın dizinini ve SPA yönlendirmesini `wrangler.jsonc` dosyasından alır.

```sh
npx wrangler deploy
```

Üretim dışı dalların otomatik build’leri kapalıdır. Wrangler sürüm başına ayrı herkese açık adresleri kapatır. Cloudflare Builds, yayın yetkisini kendi yönetilen build tokenı ile kullanır. [Version URLs](https://developers.cloudflare.com/workers/versions-and-deployments/version-urls/)

Bağlantıyı onarmak gerekirse resmî Cloudflare ekranından oturum açın ve **Settings → Builds** altında GitHub deposunu yeniden seçin. GitHub uygulamasının erişimi sorulursa **Only select repositories** ile `Wardrobe-Studio` seçin. Parola ve doğrulama kodlarını kendi giriş ekranınızda kullanın. [Cloudflare girişi](https://dash.cloudflare.com/login) · [GitHub bağlantısı](https://developers.cloudflare.com/workers/ci-cd/builds/git-integration/github-integration/)

Git bağlantısı üzerinden rutin güncellemeler için Wrangler oturumu gerekmez. Manuel yayın gerekirse CLI’nın resmî OAuth akışını kullanın.

```powershell
npx wrangler login
npx wrangler whoami
npm test -- --run
npm run deploy
```

Wrangler girişte resmî Cloudflare izin ekranını açar. Manuel yayından sonra aynı değişikliği `main` dalında da doğrulayın.

## Yerel tasarımları canlı adrese taşıma

Tarayıcı kayıtları protokol, alan adı ve porta göre ayrılır. `127.0.0.1:5175`, `localhost:5175` ve yeni HTTPS adresi farklı kayıt alanlarıdır. Canlı adres yerel kayıtları otomatik okuyamaz. Aynı canlı adres sonraki sürümlerde IndexedDB ve localStorage kayıtlarını kullanmaya devam eder. Farklı telefon veya tarayıcıda tasarım açmak için JSON dosyası taşınır.

10 Kasım yedekleri bu bilgisayardaki `C:\dev\Wardrobe-Studio\.private\deployment-backups\2026-11-10\` klasöründedir. Burada kaynak ZIP’i, yerel tasarım dosyalarının ZIP’i, adres bazında tarayıcı kayıtları ve `portable-designs` altında içe alınabilir tasarımlar bulunur. `browser-manifest.json` dosya boyutu ve SHA-256 değerlerini içerir. `portable-designs-manifest.json` dosyaları kaynak kayıt kanalıyla eşleştirir.

Gerçek kayıtların bulunduğu adres `http://127.0.0.1:5175`. Çalışma kopyası, manuel kayıt noktası, geçmiş ve sürüm arşivinin tam kopyası bu origin’in `wardrobe-backup.json` dosyasındadır. Tarayıcı yedeği mevcut tasarım içe aktarıcısının dosya biçiminden farklıdır.

1. 10 Kasım kopyaları için `portable-designs` klasöründen bir dosya seçin. Daha yeni bir kayıt için `npm run dev -- --host 127.0.0.1 --port 5175` komutuyla eski adresi açın ve **JSON** ile dışa aktarın. Adlandırılmış sürümleri **Sürüm / AI** bölümünden ayrı JSON olarak saklayabilirsiniz.
2. Yeni canlı HTTPS adresini açın. Üstteki dosya yükleme kontrolünden ilgili `.wardrobe.json` dosyasını seçin.
3. Ölçüleri kontrol edin ve **Kaydet** ile kayıt noktası oluşturun. Diğer tasarımları içe aktarırken her birini adlandırılmış sürüm olarak kaydedebilirsiniz.
4. F5 ile yenileyin ve tasarımın geri geldiğini kontrol edin.

Normal Design JSON içe aktarımı tasarım niyetini taşır. Tam geçmiş, eski kayıt noktası metaverileri ve sürüm arşivinin tüm yapısı ayrıca yerel tam yedekte saklanır. İçe aktarılan çalışma için canlı adreste yeni bir geçmiş oluşur. Yerel dosya ve tarayıcı kayıtlarını ancak kendi saklama kararınızla yönetebilirsiniz.

## Codex ile sonraki güncellemeler

Codex’e bu klasörde gereken değişikliği ve **test et, build doğrula, main dalına gönder, Cloudflare yayını ve canlı URL’yi doğrula** talimatını verin. Codex değişiklik kapsamını, Git diff’ini, kişisel dosya hariç tutmalarını ve test sonucunu kontrol ettikten sonra commit oluşturur ve gönderir. `main` push’u Cloudflare Builds’i tetikler. Başarısız build önceki başarılı dağıtımın yerini alamaz. Yayın kaydında commit kimliği ve gerçek URL izlenir.

Manuel akış aşağıdaki sırayı izler.

```powershell
npm test -- --run
npm run deploy:check
git status --short
git diff
git add <incelenen-dosyalar>
git diff --cached
git commit -m "Describe the verified change"
git push origin main
```

Yeni bir özellik veya bağımlılık eklerken `npm audit` sonucu da değerlendirilir. Mevcut güvenlik bulguları doğrulama belgesinde kayıtlıdır.

## Geri alma

Hızlı geri dönüş için **Cloudflare → wardrobe-studio → Deployments** ekranında önceki başarılı sürümün menüsünden **Rollback** seçilir. CLI alternatifi aşağıdadır. Yer tutucuyu gerçek sürüm kimliğiyle değiştirin.

```powershell
npx wrangler deployments list
npx wrangler rollback <onceki-basarili-version-id>
```

Ardından hatalı Git commit’ini `git revert <commit-id>` ile geri alın, doğrulamaları çalıştırın ve `main` dalına gönderin. Böylece sonraki otomatik yayın kaynak geçmişinden düzeltilmiş sürümü alır. Geri alınacak sürümün başarılı bir uygulama yayını olduğundan emin olun. Şema değişikliği içeren sürümlerde önceki kodun mevcut tarayıcı kayıtlarını okuyabildiğini kontrol edin. [Cloudflare rollback](https://developers.cloudflare.com/workers/versions-and-deployments/rollbacks/)

## Ücretsiz kullanım sınırları

11 Kasım 2026 kontrolünde statik istekler ve statik dosya depolama ücretsizdir. Free plan bir sürümde en fazla 20.000 dosya ve dosya başına 25 MiB kabul eder. Workers Builds ayda 3000 build dakikası, bir eşzamanlı build ve build başına 20 dakika sınırına sahiptir. [Statik ücretlendirme](https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/) · [Dosya sınırları](https://developers.cloudflare.com/workers/platform/limits/) · [Build sınırları](https://developers.cloudflare.com/workers/ci-cd/builds/limits-and-pricing/)

Ücretsiz `workers.dev` adresi kullanılır. Özel alan adı satın alma, veritabanı, harici depolama, sunucu API’si ve GitHub Actions çalışma dakikası bu kurulumun parçası değildir. Kullanıcının PDF/CSV/ZIP çıktıları kendi tarayıcısında oluşturulur. Cloudflare hesabı ve hizmet koşulları etkin kaldığı sürece son yayın bilgisayardan bağımsız çalışır.

## Canlı kabul listesi

- Gerçek HTTPS adresinde ana sayfa, JavaScript/CSS ve yerel Noto Sans fontu başarılı yanıt verir. Rastgele bir SPA yolunda F5 ile uygulama açılır.
- 3D ve WebGL sahnesi görünür, kamera hareket eder, A/B 2D cephesi ve üst plan açılır.
- Yeni tasarım veya test JSON’u açılır. Boyut değişimi, Geri Al/Yinele, manuel kayıt ve F5 sonrasında geri yükleme çalışır.
- Geometrisi ve işlevsel erişimi uygun test tasarımında PDF/CSV/ZIP indirilir. PDF açılır, CSV Türkçe başlıkları ve ZIP CRC’si kontrol edilir.
- Canlı sürüm commit’i Cloudflare deployment kaydıyla eşleşir. GitHub deposu özel görünürlüktedir ve Free plan hesap ekranında doğrulanır.
- Konsolda WebGL veya font yükleme hatası yoktur. Gerçek test sonuçları ve doğrulanamayan maddeler kayıt altına alınır.

İlk tercih Workers Static Assets’tir. Hesap veya OAuth bağlantısı beklemesi Pages’e geçiş gerektirmez. Workers’a özgü doğrulanmış bir teknik engel çıkarsa Pages için aynı Vite build ve `dist` çıktısı değerlendirilebilir.
