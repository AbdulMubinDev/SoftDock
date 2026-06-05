#!/usr/bin/env bash
# Start SoftDock via Docker Compose (recommended).

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ ! -f .env ]]; then
  echo "Missing .env — copy and edit secrets first:"
  echo "  cp .env.example .env"
  exit 1
fi

docker compose up --build -d "$@"
echo ""
echo "SoftDock is starting. Open http://localhost:${WEB_PORT:-8080}"
echo "Logs: docker compose logs -f"
