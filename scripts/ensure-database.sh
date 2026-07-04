#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
PG_PORT="${TRANSITOS_DB_PORT:-55432}"
PG_BIN="${TRANSITOS_PG_BIN:-/Library/PostgreSQL/18/bin}"
PG_ROOT="$ROOT_DIR/.local/project-postgres"
PG_DATA="$PG_ROOT/data"
PG_LOG="$PG_ROOT/postgres.log"
PG_USER="$(whoami)"

is_ready() {
  "$PG_BIN/pg_isready" -h 127.0.0.1 -p "$PG_PORT" -U transitos -d transitos_cloud >/dev/null 2>&1
}

wait_until_ready() {
  for _ in {1..45}; do
    if is_ready; then
      return 0
    fi
    sleep 1
  done
  return 1
}

set_postgres_config_value() {
  local key="$1"
  local value="$2"
  local config_file="$PG_DATA/postgresql.conf"
  local tmp_file="$config_file.tmp"

  awk -v key="$key" -v value="$value" '
    BEGIN { written = 0 }
    $0 ~ "^[#[:space:]]*" key "[[:space:]]*=" {
      if (!written) {
        print key " = " value
        written = 1
      }
      next
    }
    { print }
    END {
      if (!written) {
        print key " = " value
      }
    }
  ' "$config_file" > "$tmp_file"
  mv "$tmp_file" "$config_file"
}

configure_native_postgres() {
  set_postgres_config_value "port" "$PG_PORT"
  set_postgres_config_value "listen_addresses" "'127.0.0.1'"
  set_postgres_config_value "max_connections" "40"
  set_postgres_config_value "shared_buffers" "'32MB'"
  set_postgres_config_value "shared_memory_type" "mmap"
  set_postgres_config_value "dynamic_shared_memory_type" "mmap"
}

prepare_database() {
  "$PG_BIN/psql" -h 127.0.0.1 -p "$PG_PORT" -U "$PG_USER" -d postgres \
    -tc "SELECT 1 FROM pg_roles WHERE rolname='transitos'" | grep -q 1 \
    || "$PG_BIN/psql" -h 127.0.0.1 -p "$PG_PORT" -U "$PG_USER" -d postgres \
      -c "CREATE ROLE transitos LOGIN PASSWORD 'transitos';"

  "$PG_BIN/psql" -h 127.0.0.1 -p "$PG_PORT" -U "$PG_USER" -d postgres \
    -tc "SELECT 1 FROM pg_database WHERE datname='transitos_cloud'" | grep -q 1 \
    || "$PG_BIN/createdb" -h 127.0.0.1 -p "$PG_PORT" -U "$PG_USER" \
      -O transitos transitos_cloud
}

start_native_postgres() {
  if [ ! -x "$PG_BIN/pg_ctl" ] || [ ! -x "$PG_BIN/initdb" ] || [ ! -x "$PG_BIN/psql" ]; then
    return 1
  fi

  mkdir -p "$PG_ROOT"
  if [ ! -f "$PG_DATA/PG_VERSION" ]; then
    echo "TransitOS yerel veri merkezi ilk kez hazırlanıyor..."
    "$PG_BIN/initdb" -D "$PG_DATA" -U "$PG_USER" --auth-local=trust --auth-host=trust -N
  fi
  configure_native_postgres

  if "$PG_BIN/pg_ctl" -D "$PG_DATA" status >/dev/null 2>&1; then
    return 0
  fi

  rm -f "$PG_DATA/postmaster.pid"
  echo "TransitOS yerel veri merkezi başlatılıyor..."
  if ! "$PG_BIN/pg_ctl" -D "$PG_DATA" -l "$PG_LOG" start >/dev/null; then
    return 1
  fi
}

start_docker_postgres() {
  if ! command -v docker >/dev/null 2>&1 || ! docker info >/dev/null 2>&1; then
    return 1
  fi
  echo "TransitOS Docker veri merkezi başlatılıyor..."
  docker compose -f "$ROOT_DIR/docker-compose.yml" up -d postgres >/dev/null
}

if ! is_ready; then
  if start_native_postgres && wait_until_ready; then
    prepare_database
  elif start_docker_postgres && wait_until_ready; then
    :
  else
    echo ""
    echo "TransitOS veri merkezi başlatılamadı."
    echo "Yerel PostgreSQL günlüğü: $PG_LOG"
    tail -n 30 "$PG_LOG" 2>/dev/null || true
    exit 1
  fi
fi

cd "$ROOT_DIR"
npx prisma migrate deploy
echo "TransitOS veri merkezi hazır."
