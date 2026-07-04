#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

PORT="${PORT:-3100}"
PID_FILE="$ROOT_DIR/.transitos-web.pid"

if [ -f "$PID_FILE" ]; then
  kill "$(cat "$PID_FILE")" >/dev/null 2>&1 || true
  rm -f "$PID_FILE"
fi

if command -v lsof >/dev/null 2>&1 && lsof -nP -iTCP:$PORT -sTCP:LISTEN >/dev/null 2>&1; then
  lsof -tiTCP:$PORT -sTCP:LISTEN | xargs kill -9 >/dev/null 2>&1 || true
  sleep 1
fi

if command -v lsof >/dev/null 2>&1 && lsof -nP -iTCP:$PORT -sTCP:LISTEN >/dev/null 2>&1; then
  echo "Port $PORT hâlâ kullanımda. Açık Terminal/Node sürecini kapatıp tekrar deneyin."
  exit 1
fi

rm -rf .next

bash scripts/ensure-database.sh
echo "TransitOS Web: http://127.0.0.1:${PORT}"
exec npx next dev --hostname 127.0.0.1 --port "$PORT"
