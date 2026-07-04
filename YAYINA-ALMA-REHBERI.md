# SeflekTur TransitOS Web Yayına Alma Rehberi

Bu rehber, siteyi GitHub + Vercel + kendi domain modeliyle yayına almak içindir.

## 1. GitHub Deposu

1. GitHub hesabınıza girin.
2. Yeni repository oluşturun.
3. Repository adı olarak örneğin `seflektur-transitos-web` kullanın.
4. Public veya Private seçebilirsiniz.
5. `README`, `.gitignore` veya lisans eklemeyin; proje içinde hazır dosyalar var.

Terminalde:

```bash
cd "/Users/burakseflek/Documents/Codex/2026-05-09/build-a-fully-native-macos-application/TransitOSCloud"
git init
git add .
git commit -m "TransitOS web yayina hazir"
git branch -M main
git remote add origin GITHUB_REPO_ADRESI
git push -u origin main
```

`GITHUB_REPO_ADRESI` yerine GitHub'ın verdiği adres yazılır.

## 2. Ücretsiz Veritabanı

TransitOS paneli için internette çalışan PostgreSQL gerekir.

En sade seçenek:

1. Vercel hesabına girin.
2. Dashboard içinden projenizi oluştururken veya oluşturduktan sonra Storage / Marketplace bölümünden Neon PostgreSQL ekleyin.
3. Oluşturulan `DATABASE_URL` değerini Vercel otomatik eklerse ekstra işlem gerekmez.
4. Otomatik eklenmezse Vercel Project Settings > Environment Variables bölümüne `DATABASE_URL` olarak ekleyin.

## 3. Vercel Projesi

1. Vercel hesabına GitHub ile giriş yapın.
2. Add New > Project seçin.
3. GitHub repository olarak `seflektur-transitos-web` seçin.
4. Framework: Next.js olmalı.
5. Root Directory: Eğer repository doğrudan `TransitOSCloud` klasöründen oluşturulduysa boş bırakın. Eğer tüm çalışma klasörünü GitHub'a yüklerseniz root directory `TransitOSCloud` olmalı.
6. Build Command otomatik olarak `npm run build:vercel` kullanılacak.

## 4. Vercel Ortam Değişkenleri

Project Settings > Environment Variables alanına şunları ekleyin:

```text
DATABASE_URL=Neon veya PostgreSQL bağlantı adresi
JWT_SECRET=uzun-rastgele-guvenli-bir-metin
ADMIN_LOGIN_ID=admin
ADMIN_PASSWORD=seflektur
TRANSITOS_STORE_FILES_IN_DB=true
```

`JWT_SECRET` için uzun ve tahmin edilemez bir metin kullanın.

## 5. İlk Yayın

Vercel deploy başlattığında şu işlem otomatik olur:

1. Paketler kurulur.
2. Prisma Client hazırlanır.
3. Veritabanı tabloları uygulanır.
4. Next.js site derlenir.
5. Site yayına alınır.

## 6. Domain Bağlama

1. Vercel Project > Settings > Domains bölümüne girin.
2. Domaininizi ekleyin: örneğin `seflektur.com`.
3. Vercel'in verdiği DNS kayıtlarını domain aldığınız firmadaki DNS alanına ekleyin.
4. DNS yayılımı tamamlanınca site domain üzerinden açılır.

## 7. Yayından Sonra Kontrol

Şunları test edin:

- Ana site açılıyor mu?
- TransitOS giriş ekranı açılıyor mu?
- Yönetici girişi çalışıyor mu?
- Site düzenleme panelinde görsel yükleyip kaydedince kalıcı oluyor mu?
- Taşıyıcı ve hizmet talep formları yönetici paneline düşüyor mu?
- Evrak yükleme ve görüntüleme çalışıyor mu?

## Önemli Not

Vercel ücretsiz plan, şirket sitesi için deneme ve düşük trafikli başlangıçta işinizi görür. Resmi ticari kullanım şartları ve trafik büyüdüğünde Vercel planı ayrıca kontrol edilmelidir.
