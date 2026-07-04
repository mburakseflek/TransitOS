# SeflekTur TransitOS Cloud v2.0

Web merkezli yeni sürümün başlangıç projesidir. Amaç tüm cihazların aynı merkezi veriye bağlanmasıdır:

- Web panel: Windows, macOS, iOS ve Android tarayıcılarından erişim
- Ortak veri: PostgreSQL
- API: Next.js route handlers
- Roller: Yönetici ve Taşeron
- Para birimi: Türk Lirası
- Hakedişler: Aylık hesaplama mantığı
- Giderler: Aylık hakedişten düşülür

## İlk Kurulum

```bash
cd TransitOSCloud
cp .env.example .env
docker compose up -d
npm install
npm run db:generate
npm run db:migrate
npm run dev
```

Giriş:

- Yönetici ID: `admin`
- Yönetici şifre: `seflektur`

## Mimari

Bu proje v2.0 cloud temelidir. Mevcut macOS uygulaması daha sonra bu API’ye bağlanabilir. İlk hedef web panelin tüm cihazlarda kullanılabilir olmasıdır.
