#!/bin/sh
set -e

wait_for() {
  host="$1"
  port="$2"
  name="$3"
  echo "Waiting for ${name} at ${host}:${port}..."
  until python -c "
import socket, sys
s = socket.socket()
s.settimeout(2)
try:
    s.connect(('${host}', int('${port}')))
    s.close()
    sys.exit(0)
except OSError:
    sys.exit(1)
" 2>/dev/null; do
    sleep 1
  done
  echo "${name} is up."
}

if [ -n "${DATABASE_URL:-}" ]; then
  wait_for "${DB_HOST:-db}" "${DB_PORT:-5432}" "PostgreSQL"
fi

if [ -n "${REDIS_URL:-}" ]; then
  wait_for "${REDIS_HOST:-redis}" "${REDIS_PORT:-6379}" "Redis"
fi

python manage.py migrate --noinput
python manage.py collectstatic --noinput

exec "$@"
