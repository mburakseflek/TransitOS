#!/usr/bin/env bash
set -euo pipefail

PG_BIN="/Library/PostgreSQL/18/bin"
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
PG_ROOT="$ROOT_DIR/.local/project-postgres"
PG_DATA="$PG_ROOT/data"
PG_LOG="$PG_ROOT/postgres.log"
PG_PORT="55432"
PG_USER="$(whoami)"

if [ ! -x "$PG_BIN/psql" ] || [ ! -x "$PG_BIN/initdb" ] || [ ! -x "$PG_BIN/pg_ctl" ]; then
  echo "PostgreSQL 18 komutları bulunamadı."
  echo "Beklenen klasör: /Library/PostgreSQL/18/bin"
  exit 1
fi

mkdir -p "$PG_ROOT"

if [ ! -f "$PG_DATA/PG_VERSION" ]; then
  echo "TransitOS yerel veritabanı ilk kez hazırlanıyor..."
  "$PG_BIN/initdb" -D "$PG_DATA" -U "$PG_USER" --auth-local=trust --auth-host=trust -N
  {
    echo ""
    echo "port = $PG_PORT"
    echo "listen_addresses = '127.0.0.1'"
    echo "max_connections = 40"
    echo "shared_buffers = '32MB'"
  } >> "$PG_DATA/postgresql.conf"
fi

if ! lsof -nP -iTCP:$PG_PORT -sTCP:LISTEN >/dev/null 2>&1; then
  echo "TransitOS yerel veritabanı başlatılıyor..."
  "$PG_BIN/pg_ctl" -D "$PG_DATA" -l "$PG_LOG" start
fi

echo "Veritabanı bağlantısı bekleniyor..."
for _ in {1..30}; do
  if "$PG_BIN/pg_isready" -h 127.0.0.1 -p "$PG_PORT" -U "$PG_USER" -d postgres >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

if ! "$PG_BIN/pg_isready" -h 127.0.0.1 -p "$PG_PORT" -U "$PG_USER" -d postgres >/dev/null 2>&1; then
  echo "Veritabanı başlatılamadı. Log:"
  tail -n 80 "$PG_LOG" 2>/dev/null || true
  exit 1
fi

echo "TransitOS veritabanı kullanıcısı hazırlanıyor..."
"$PG_BIN/psql" -h 127.0.0.1 -p "$PG_PORT" -U "$PG_USER" -d postgres -tc "SELECT 1 FROM pg_roles WHERE rolname='transitos'" | grep -q 1 \
  || "$PG_BIN/psql" -h 127.0.0.1 -p "$PG_PORT" -U "$PG_USER" -d postgres -c "CREATE ROLE transitos LOGIN PASSWORD 'transitos';"

echo "TransitOS veritabanı hazırlanıyor..."
"$PG_BIN/psql" -h 127.0.0.1 -p "$PG_PORT" -U "$PG_USER" -d postgres -tc "SELECT 1 FROM pg_database WHERE datname='transitos_cloud'" | grep -q 1 \
  || "$PG_BIN/createdb" -h 127.0.0.1 -p "$PG_PORT" -U "$PG_USER" -O transitos transitos_cloud

echo "Tablolar uygulanıyor..."
npx prisma migrate deploy

echo "Hazır. Şimdi npm run dev ile siteyi açabilirsiniz."
