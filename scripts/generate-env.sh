#!/usr/bin/env bash
# Genera src/app/environments/environment.ts e environment.production.ts
# a partire da variabili di ambiente o da un file .env nella root.

set -e

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
ENV_DIR="$ROOT_DIR/src/app/environments"

if [ -f "$ROOT_DIR/.env" ]; then
  # shellcheck disable=SC1091
  set -a && source "$ROOT_DIR/.env" && set +a
fi

mkdir -p "$ENV_DIR"

cat > "$ENV_DIR/environment.ts" <<EOF
export const environment = {
  production: false,
  apiBaseUrl: '${API_BASE_URL:-}',
};
EOF

cat > "$ENV_DIR/environment.production.ts" <<EOF
export const environment = {
  production: true,
  apiBaseUrl: '${API_BASE_URL:-}',
};
EOF

echo "Environments generati in $ENV_DIR"
