# External Services Required for SoftDock MVP

## 1. Redis (Required)

Redis is needed for two things:
- **Django Channels** — WebSocket layer for real-time AI streaming
- **Celery** — Async task queue for document processing

### Setup Options

**Option A: Docker (recommended for local dev)**
```bash
docker run -d --name softdock-redis -p 6379:6379 redis:alpine
```

**Option B: Upstash (free cloud Redis)**
- Sign up at https://upstash.com
- Create a Redis database (free tier: 10k commands/day)
- Copy the connection URL and set `REDIS_URL` in `backend/.env`

**Option C: Install natively**
- Linux: `sudo apt install redis-server`
- macOS: `brew install redis`
- Windows: Use WSL2 or Docker

### Verify
```bash
redis-cli ping
# Should return: PONG
```

---

## 2. At Least One AI Provider API Key (Required)

Users must add at least one API key in **Settings → Keys** to use the AI assistant. SoftDock supports these providers:

| Provider | Get API Key | Free Tier |
|----------|-------------|-----------|
| **Anthropic** (Claude) | https://console.anthropic.com/settings/keys | $5 credit on signup |
| **OpenAI** (GPT) | https://platform.openai.com/api-keys | Pay-as-you-go |
| **Google** (Gemini) | https://aistudio.google.com/apikey | Free tier available |
| **Groq** | https://console.groq.com/keys | Generous free tier |
| **xAI** (Grok) | https://console.x.ai/ | $25 monthly free credit |
| **OpenRouter** | https://openrouter.ai/keys | Pay-as-you-go, many models |

### Recommended for Testing
- **Groq** — fastest responses, generous free tier
- **Google Gemini** — free tier with good limits
- **Anthropic** — best quality, $5 signup credit

---

## 3. PostgreSQL (Optional for Dev)

SQLite works fine for local development. PostgreSQL is recommended for production.

### If Using PostgreSQL
```bash
# Docker
docker run -d --name softdock-db \
  -e POSTGRES_USER=softdock_user \
  -e POSTGRES_PASSWORD=yourpassword \
  -e POSTGRES_DB=softdock_db \
  -p 5432:5432 \
  postgres:16-alpine

# Then set in backend/.env:
DATABASE_URL=postgres://softdock_user:yourpassword@localhost:5432/softdock_db
```

### If Using SQLite (default)
No setup needed. The database file is created automatically at `backend/db.sqlite3`.

---

## 4. Environment Variables

Create `backend/.env` with these values:

```env
SECRET_KEY=your-random-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
FRONTEND_URL=http://localhost:5173
REDIS_URL=redis://localhost:6379/0
ENCRYPTION_KEY=your-fernet-key-here

# Optional: Only if using PostgreSQL
# DATABASE_URL=postgres://softdock_user:password@localhost:5432/softdock_db
```

### Generate Required Keys

```python
# Generate SECRET_KEY
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"

# Generate ENCRYPTION_KEY (Fernet)
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

Create `frontend/.env` with:

```env
VITE_API_URL=http://127.0.0.1:8000/api
VITE_WS_URL=ws://127.0.0.1:8000/ws
```

---

## 5. Quick Start Commands

```bash
# 1. Start Redis (Docker)
docker run -d --name softdock-redis -p 6379:6379 redis:alpine

# 2. Backend setup
cd SoftDock/backend
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser

# 3. Start backend services (each in separate terminal)
python manage.py runserver          # Django dev server
celery -A core worker --loglevel=info   # Celery worker

# 4. Frontend setup
cd SoftDock/frontend
npm install
npm run dev
```

---

## 6. Production Deployment (Future)

For production on the Contabo VPS, you'll additionally need:
- **Nginx** — reverse proxy (config template in `nginx/softdock.conf`)
- **Gunicorn + Uvicorn** — ASGI server for Django + WebSockets
- **PM2 or systemd** — process management
- **Cloudflare** — DNS + SSL (free plan)
- **Paddle** — payment processing (for billing feature)

These are NOT needed for the MVP / local development.
