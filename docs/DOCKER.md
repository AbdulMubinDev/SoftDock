# SoftDock — Docker

Run the full stack (PostgreSQL, Redis, Django/Daphne, Celery, Nginx + React) with Docker Compose.

## Prerequisites

- Docker Desktop (Windows/Mac) or Docker Engine + Compose (Linux/WSL)
- No local Python venv or `node_modules` required

## Quick start

```bash
cd SoftDock

# 1. Create env file with secrets
cp .env.example .env
# Edit .env — set SECRET_KEY and ENCRYPTION_KEY (see below)

# 2. Build and start
docker compose up --build -d

# 3. Open the app
# http://localhost:8080
```

### Generate secrets

```bash
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

Put the outputs in `.env` as `SECRET_KEY` and `ENCRYPTION_KEY`.

## Services

| Service | Role |
|---------|------|
| `web` | Nginx — React static files + reverse proxy to backend |
| `backend` | Django REST + Daphne WebSockets |
| `celery` | Background tasks (knowledge doc processing) |
| `db` | PostgreSQL 16 |
| `redis` | Channels + Celery broker |

## Useful commands

```bash
docker compose logs -f              # all logs
docker compose logs -f backend      # backend only
docker compose ps
docker compose down                 # stop, keep data volumes
docker compose down -v                # stop + delete DB/media volumes

./scripts/clean-local.sh              # remove local venv/node_modules
./scripts/clean-local.sh --volumes  # also reset Docker volumes
```

## Create admin user

```bash
docker compose exec backend python manage.py createsuperuser
```

Admin panel: http://localhost:8080/admin/

## Architecture

```
Browser → web:80 (nginx)
            ├── /          → React (dist/)
            ├── /api/      → backend:8000
            ├── /ws/       → backend:8000 (WebSocket)
            ├── /media/    → backend:8000
            └── /admin/    → backend:8000
```

## Configuration

All settings live in `.env` at the project root. See [`.env.example`](.env.example).

Change the public port with `WEB_PORT=8080` in `.env`.

## Clean up legacy local setup

If you previously ran the non-Docker local production setup:

```bash
./scripts/clean-local.sh
```

This removes `.venv`, `node_modules`, `backend/.env`, `frontend/.env`, and the old `softdock-redis` container.
