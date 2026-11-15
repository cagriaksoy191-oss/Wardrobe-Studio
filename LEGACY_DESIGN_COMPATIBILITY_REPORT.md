# Eski tasarımların aday çözücüyle uyumluluğu

Sentetik Design v1 dosyaları önce yayınlanan `c57a4b2` derlemesinde gerçek dosya seçicisiyle açıldı. Asimetrik 25/4 çalışma kopyası manuel kaydedildi ve bir 25/4 arşiv sürümü ile bir 18/8 adlandırılmış sürüm oluşturuldu. Aynı izole tarayıcı kökeninde statik dosyalar aday derlemeye çevrildi, ardından F5 yapıldı. Tarayıcı proje başlığını, 25/4 mm ölçülerini ve **21:31:37** manuel kayıt saatiyle otomatik geri yükleme durumunu gösterdi. Eski arşiv, kaydedilmiş sürümler ve çalışma kopyası adayda normal ürün kontrolleriyle açıldı. [Tarayıcı kaydı](../evidence/browser/results.json)

| Akış | Sonuç |
| --- | --- |
| Eski JSON ve Design v1 | Dört dosya aynı semantik imza ve aynı Design baytlarıyla çözüldü. |
| Çalışma kopyası ve manuel checkpoint | Eski derlemede çift depoya yazma durumu ve adayda F5 sonrası kayıt noktası ile çalışma kopyası doğrulandı. |
| IndexedDB | Gerçek tarayıcıda yedekli kalıcılığın başarılı yazımı ve aynı kökende geri yükleme görüldü. IndexedDB önceliği ve yalnız IndexedDB’den geri okuma mevcut otomatik depo testleriyle doğrulandı. |
| Adlandırılmış sürüm ve arşiv | Aday, eski derlemenin arşivlenmiş 25/4 ve etkin 18/8 girdilerini ayrı ayrı gösterdi. Her ikisi açıldı. |
| Geri Al ve Yinele | 18/8 sürümünü açınca Geri Al 25/4’ü, Yinele tekrar 18/8’i gösterdi. |
| A/B karşılaştırması | Çalışma 25/4 ve arşivden seçilen 18/8 karşılaştırıldı. İki taraf 94 parça gösterdi ve paftalar aday çözücüyle oluşturuldu. |
| Eski tasarımın yeni PDF önizlemesi | 41 pafta ve kullanım engeli damgası. Ürün arayüzünden alınan PDF’nin tüm sayfaları doğrulandı. |

Oturum v2 ve sürüm arşivi v1, Design niyetini ve geçmişteki Design kopyalarını saklar. Uygulamanın etkin `ResolvedModel` alanı bellekte türetilir. Başlangıç, IndexedDB hidratasyonu, JSON yükleme, Geri Al, Yinele, adlandırılmış sürüm ve A/B karşılaştırması kendi Design girdisini yeniden çözer. İncelenen depolama şemalarında saklanan panel merkezleri veya çözülmüş geometri sürümü bulunmadı. Yeni veri göçü gerekmedi. [Çalışma deposu](src/store/useWardrobeStore.ts#L2414) · [Sürüm arşivi](src/store/versionArchive.ts) · [A/B yeniden çözme](src/ui/VersionPanel.tsx#L62) · [Oturum testleri](tests/remediation-session.test.ts)

Kullanıcı eski bir tasarımı aday çözücüyle açınca yalnız türetilmiş panel yerleşimi değişebilir. Önceden indirilen PDF, SVG ve ZIP kendi üretildikleri anın koordinatlarını taşır. Eski pafta ile yeniden oluşturulan pafta arasında sürüm ve panel konumu karşılaştırılabilir. Gerçek kullanıcı kayıt ve tasarım dosyaları korunmuştur. [Etkilenen koordinatlar](CANONICAL_GEOMETRY_BEFORE_AFTER.md)
