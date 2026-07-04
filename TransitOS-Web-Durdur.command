#!/bin/zsh

cd "$(dirname "$0")"

PID_FILE="$PWD/.transitos-web.pid"
PORT="${PORT:-3100}"

if [ -f "$PID_FILE" ]; then
  kill -9 "$(cat "$PID_FILE")" >/dev/null 2>&1 || true
  rm -f "$PID_FILE"
fi

if command -v lsof >/dev/null 2>&1; then
  lsof -tiTCP:$PORT -sTCP:LISTEN | xargs kill -9 >/dev/null 2>&1 || true
fi

echo "SeflekTur TransitOS Web durduruldu."
read -r "REPLY?Kapatmak icin Enter'a basin..."
