# Wardrobe Studio yayın rehberi

10 Kasım 2026. Çalışma dizini `C:\dev\Wardrobe-Studio`.

Uygulama Vite ile statik dosyalara derlenir ve Cloudflare Workers Static Assets üzerinden sunulur. Üretim hedefi `wardrobe-studio` adlı proje ve Cloudflare hesabının ücretsiz `workers.dev` adresidir. Güncel yayın ve hesap bağlantısı sonucu [DEPLOYMENT_VERIFICATION.md](DEPLOYMENT_VERIFICATION.md) içindedir.

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

## GitHub ve Cloudflare bağlantısını tamamlama

Kaynak deposu [cagriaksoy191-oss/Wardrobe-Studio](https://github.com/cagriaksoy191-oss/Wardrobe-Studio) özel görünürlüktedir. Git ana dalı `main`. Cloudflare’a sunulan derlenmiş JavaScript ziyaretçiler tarafından indirilebilir. Depo görünürlüğü kaynak ve geçmişe erişimi sınırlar.

1. [Resmî Cloudflare giriş ekranında](https://dash.cloudflare.com/login) oturum açın. Hesap yoksa hesabı kendi ekranınızda oluşturun ve doğrulayın. Parola ve doğrulama kodları giriş ekranında kalmalıdır.
2. Hesabın Workers planının **Free** olduğunu doğrulayın. Ücretli plan, özel alan adı veya ek hizmet seçimi gerekmez.
3. **Workers & Pages → Create application → Import a repository / Connect GitHub** yolunu açın. Ekran adları Cloudflare sürümüne göre değişebilir.
4. Cloudflare GitHub uygulaması istendiğinde **Only select repositories** ile yalnız `Wardrobe-Studio` deposuna izin verin.
5. Proje adını Wrangler ile aynı olacak şekilde **wardrobe-studio** girin. Üretim dalını **main**, kök dizini depo kökü `/` seçin.
6. Build command alanına aşağıdaki komutu girin. Paket kurulumu kilit dosyasından yapılmalıdır. Varsayılan kurulumun `npm ci` olduğunu doğrulayın. Kurulum adımını ayrı ayarlayamayan ekranda build komutunun başına `npm ci &&` ekleyin.

```sh
npm test -- --run && npm run build && npm run deploy:verify
```

7. Deploy command alanını aşağıdaki gibi ayarlayın. Statik dizin `dist` ve SPA geri dönüşü Wrangler dosyasından alınır.

```sh
npx wrangler deploy
```

8. Üretim dışı dalların otomatik build’lerini ilk kurulumda kapalı tutun. Bu ayar ana dal dışındaki denemeler için build dakikası kullanımını önler. Gerekirse sonra belirli bir test dalı açılabilir.
9. İlk deploy tamamlanınca Cloudflare’ın gösterdiği gerçek HTTPS `workers.dev` adresini kaydedin. Hesaba ait alt alan adı yayın ekranı görülmeden belirlenemez.
10. Canlı testleri aşağıdaki listeyle tamamlayın ve gerçek URL ile commit kimliğini doğrulama belgesine yazın.

CLI ile yayın için resmi OAuth akışı da kullanılabilir. Cloudflare GitHub bağlantısı mevcutsa güncellemeler için CLI oturumuna gerek yoktur.

```powershell
npx wrangler login
npx wrangler whoami
npm test -- --run
npm run deploy
```

Wrangler girişte resmi Cloudflare izin ekranını açar. Tokenı sohbete, `.env` dosyasına veya Git deposuna eklemek gerekmez. Git tabanlı dağıtımda Cloudflare’ın yerleşik Builds bağlantısı kullanılmalıdır.

## Yerel tasarımları canlı adrese taşıma

Tarayıcı kayıtları protokol, alan adı ve porta göre ayrılır. `127.0.0.1:5175`, `localhost:5175` ve yeni HTTPS adresi farklı kayıt alanlarıdır. Canlı adres yerel kayıtları otomatik okuyamaz. Aynı canlı adres sonraki sürümlerde IndexedDB ve localStorage kayıtlarını kullanmaya devam eder. Farklı telefon veya tarayıcıda tasarım açmak için JSON dosyası taşınır.

10 Kasım yedekleri yalnız bu bilgisayardaki `.private/deployment-backups/2026-11-10/` klasöründedir. Burada kaynak ZIP’i, mevcut yerel tasarım dosyalarının ZIP’i, origin bazında tam tarayıcı kayıtları ve `portable-designs` altında içe alınabilir tasarımlar bulunur. `browser-manifest.json` dosya boyutu ve SHA-256 değerlerini içerir. `portable-designs-manifest.json` dosyaları kaynak kayıt kanalıyla eşleştirir.

Gerçek kayıtların bulunduğu adres `http://127.0.0.1:5175`. Çalışma kopyası, manuel kayıt noktası, geçmiş ve sürüm arşivinin tam kopyası bu origin’in `wardrobe-backup.json` dosyasındadır. Tarayıcı yedeği mevcut tasarım içe aktarıcısının dosya biçiminden farklıdır.

1. İlk olarak yerel uygulamadan **JSON** ile güncel tasarımı dışa aktarın. Adlandırılmış önemli sürümleri **Sürüm / AI** bölümünden ayrı JSON olarak saklayın. Hazırlanan `portable-designs` dosyaları da kullanılabilir.
2. Yeni canlı HTTPS adresini açın. Üstteki dosya yükleme kontrolünden ilgili `.wardrobe.json` dosyasını seçin.
3. Ölçüleri kontrol edin, **Kayıt noktası** oluşturun. İstenirse tasarımı adlandırılmış sürüm olarak kaydedin. Diğer sürümler için işlemi tekrarlayın.
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

Ardından hatalı Git commit’ini `git revert <commit-id>` ile geri alın, doğrulamaları çalıştırın ve `main` dalına gönderin. Bu işlem kaynak geçmişini korur ve bir sonraki push’un eski hatayı yeniden yayınlamasını önler. Hesap üzerinde önceki başarılı dağıtım oluşunca rollback ayrıca denenebilir. Tarayıcı verileri ayrı saklanır. Şema değişikliği içeren gelecekteki sürümlerde eski kodla veri uyumluluğu ayrıca kontrol edilmelidir.

## Ücretsiz kullanım sınırları

10 Kasım 2026 kontrolünde statik istekler ve statik dosya depolama ücretsizdir. Free plan bir sürümde en fazla 20.000 dosya ve dosya başına 25 MiB kabul eder. Workers Builds ayda 3000 build dakikası, bir eşzamanlı build ve build başına 20 dakika sınırına sahiptir. Bu yapılandırmanın yayın paketi uygulama, stil ve yerel PDF fontundan oluşur. [Statik ücretlendirme](https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/) · [Dosya sınırları](https://developers.cloudflare.com/workers/platform/limits/) · [Build sınırları](https://developers.cloudflare.com/workers/ci-cd/builds/limits-and-pricing/)

Ücretsiz `workers.dev` adresi kullanılır. Özel alan adı satın alma, veritabanı, harici depolama, sunucu API’si ve GitHub Actions çalışma dakikası bu kurulumun parçası değildir. Kullanıcının PDF/CSV/ZIP çıktıları kendi tarayıcısında oluşturulur. Cloudflare hesabı ve hizmet koşulları etkin kaldığı sürece son yayın bilgisayardan bağımsız çalışır.

## Canlı kabul listesi

- Gerçek HTTPS adresinde ana sayfa, JavaScript/CSS ve yerel Noto Sans fontu başarılı yanıt verir. Rastgele bir SPA yolunda F5 ile uygulama açılır.
- 3D ve WebGL sahnesi görünür, kamera hareket eder, A/B 2D cephesi ve üst plan açılır.
- Yeni tasarım veya test JSON’u açılır. Boyut değişimi, Geri Al/Yinele, manuel kayıt ve F5 sonrasında geri yükleme çalışır.
- Geometrisi ve işlevsel erişimi uygun test tasarımında PDF/CSV/ZIP indirilir. PDF açılır, CSV Türkçe başlıkları ve ZIP CRC’si kontrol edilir.
- Canlı sürüm commit’i Cloudflare deployment kaydıyla eşleşir. GitHub deposu özel görünürlüktedir ve Free plan hesap ekranında doğrulanır.
- Konsolda WebGL veya font yükleme hatası yoktur. Gerçek test sonuçları ve doğrulanamayan maddeler kayıt altına alınır.

İlk tercih Workers Static Assets’tir. Hesap veya OAuth bağlantısı beklemesi Pages’e geçiş gerektirmez. Workers’a özgü doğrulanmış bir teknik engel çıkarsa Pages için aynı Vite build ve `dist` çıktısı değerlendirilebilir.
