#!/bin/zsh
set -euo pipefail

cd "$(dirname "$0")"

LOG_FILE="$PWD/transitos-web-background-start.log"
SERVER_LOG="$PWD/transitos-web-server.log"
PID_FILE="$PWD/.transitos-web.pid"
PORT="${PORT:-3100}"
export PORT
exec > >(tee -a "$LOG_FILE") 2>&1

echo ""
echo "SeflekTur TransitOS Web arka planda başlatılıyor..."
echo ""

finish_with_error() {
  echo ""
  echo "Başlatma tamamlanamadı. Günlük dosyası:"
  echo "$LOG_FILE"
  read -r "REPLY?Kapatmak için Enter'a basın..."
  exit 1
}

if ! command -v npm >/dev/null 2>&1; then
  echo "Node.js / npm bulunamadı. Önce Node.js kurulmalı."
  finish_with_error
fi

echo "Eski web süreci ve bozuk önbellek kontrol ediliyor..."
if [ -f "$PID_FILE" ]; then
  kill "$(cat "$PID_FILE")" >/dev/null 2>&1 || true
  rm -f "$PID_FILE"
fi

if command -v lsof >/dev/null 2>&1 && lsof -nP -iTCP:$PORT -sTCP:LISTEN >/dev/null 2>&1; then
  lsof -tiTCP:$PORT -sTCP:LISTEN | xargs kill -9 >/dev/null 2>&1 || true
  sleep 1
fi

if command -v lsof >/dev/null 2>&1 && lsof -nP -iTCP:$PORT -sTCP:LISTEN >/dev/null 2>&1; then
  echo "Port $PORT hâlâ kullanımda. Açık Terminal/Node süreçlerini kapatıp tekrar deneyin."
  finish_with_error
fi

rm -rf .next

echo "Veri merkezi kontrol ediliyor..."
bash scripts/ensure-database.sh || finish_with_error

echo "Web uygulaması arka planda temiz başlatılıyor..."
nohup npm run dev:web > "$SERVER_LOG" 2>&1 &
echo $! > "$PID_FILE"

sleep 5
open "http://127.0.0.1:$PORT"

echo ""
echo "Hazır: http://127.0.0.1:$PORT"
echo "Sunucu günlüğü: $SERVER_LOG"
read -r "REPLY?Bu pencereyi kapatmak için Enter'a basın..."
