#!/usr/bin/env bash
# Remove local dev artifacts (venv, node_modules, SQLite, env files, standalone Redis).
# Does NOT remove Docker Compose volumes unless you pass --volumes.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

REMOVE_VOLUMES=false
if [[ "${1:-}" == "--volumes" ]]; then
  REMOVE_VOLUMES=true
fi

echo "[clean] Stopping SoftDock Docker stack..."
if $REMOVE_VOLUMES; then
  docker compose down -v 2>/dev/null || true
else
  docker compose down 2>/dev/null || true
fi

echo "[clean] Removing standalone Redis container (legacy local setup)..."
docker stop softdock-redis 2>/dev/null || true
docker rm softdock-redis 2>/dev/null || true

echo "[clean] Removing Python/Node local artifacts..."
rm -rf backend/.venv backend/.venv-wsl backend/.env backend/db.sqlite3 backend/staticfiles
rm -rf frontend/node_modules frontend/dist frontend/.env
find backend -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true

echo "[clean] Done. Use Docker: cp .env.example .env && docker compose up --build"
