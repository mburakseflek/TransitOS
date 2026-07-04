#!/usr/bin/env bash
set -euo pipefail

PG_BIN="/Library/PostgreSQL/18/bin"
PG_PLIST="/Library/LaunchDaemons/postgresql-18.plist"

if [ ! -x "$PG_BIN/psql" ]; then
  echo "PostgreSQL 18 bulunamadı. Önce PostgreSQL 18 kurulu olmalı."
  exit 1
fi

echo "Mac yönetici şifreniz istenirse yazın ve Enter'a basın."
echo "Not: Güvenlik nedeniyle yazarken ekranda yıldız veya nokta görünmez."

if ! lsof -nP -iTCP:5432 -sTCP:LISTEN >/dev/null 2>&1; then
  echo "PostgreSQL servisi başlatılıyor..."
  sudo launchctl bootstrap system "$PG_PLIST" 2>/dev/null || true
  sudo launchctl kickstart -k system/postgresql-18 2>/dev/null || true
  sleep 3
fi

if ! lsof -nP -iTCP:5432 -sTCP:LISTEN >/dev/null 2>&1; then
  echo "PostgreSQL başlatılamadı. Sistem Ayarları veya PostgreSQL servis durumunu kontrol edin."
  exit 1
fi

echo "TransitOS veritabanı kullanıcısı hazırlanıyor..."
sudo -u postgres "$PG_BIN/psql" -d postgres -tc "SELECT 1 FROM pg_roles WHERE rolname='transitos'" | grep -q 1 \
  || sudo -u postgres "$PG_BIN/psql" -d postgres -c "CREATE ROLE transitos LOGIN PASSWORD 'transitos';"

echo "TransitOS veritabanı hazırlanıyor..."
sudo -u postgres "$PG_BIN/psql" -d postgres -tc "SELECT 1 FROM pg_database WHERE datname='transitos_cloud'" | grep -q 1 \
  || sudo -u postgres "$PG_BIN/createdb" -O transitos transitos_cloud

echo "Tablolar uygulanıyor..."
npx prisma migrate deploy

echo "Hazır. Artık npm run dev ile siteyi açabilirsiniz."
