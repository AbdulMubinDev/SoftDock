# SoftDock — Tonight Local Production Ship

**Superseded by Docker.** See [`docs/DOCKER.md`](DOCKER.md) for the current setup.

**Goal:** Run core SoftDock locally in production mode (`DEBUG=False`, built frontend, Redis WebSockets).

**Status:** COMPLETE — use `docker compose up --build -d` instead of manual venv setup.

---

## Quick start (Docker — recommended)

```bash
cp .env.example .env   # set SECRET_KEY and ENCRYPTION_KEY
docker compose up --build -d
# Open http://localhost:8080
```

See [`docs/DOCKER.md`](DOCKER.md) for full instructions.

---

## Legacy local setup (removed)

Local `.venv`, `node_modules`, and standalone `softdock-redis` container have been cleaned up.
Use `./scripts/clean-local.sh` to remove any leftover artifacts.
