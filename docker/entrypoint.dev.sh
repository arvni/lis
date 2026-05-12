#!/bin/sh
set -e

cd /app

role=${CONTAINER_ROLE:-app}

# ─────────────────────────────────────────────
# Install composer deps if vendor is empty
# (named volume comes up empty on first run)
# ─────────────────────────────────────────────
if [ ! -f /app/vendor/autoload.php ]; then
    echo "📦 Installing composer dependencies (with dev)..."
    composer install --no-interaction --prefer-dist
fi

# ─────────────────────────────────────────────
# Wait for DB
# ─────────────────────────────────────────────
if [ "$role" = "app" ] || [ "$role" = "queue" ] || [ "$role" = "scheduler" ]; then
    echo "⏳ Waiting for database connection at $DB_HOST:$DB_PORT..."
    for i in $(seq 1 30); do
        if nc -z "$DB_HOST" "$DB_PORT" 2>/dev/null; then
            echo "✅ Database is ready."
            break
        fi
        sleep 2
    done
fi

# ─────────────────────────────────────────────
# Generate APP_KEY if missing
# ─────────────────────────────────────────────
if ! grep -q "^APP_KEY=base64" /app/.env 2>/dev/null; then
    echo "🔑 Generating APP_KEY..."
    php artisan key:generate --force || true
fi

case "$role" in
    app)
        if [ "$MIGRATE_ON_STARTUP" = "true" ]; then
            echo "🔄 Running migrations..."
            php artisan migrate --force || echo "⚠️  Migrations failed; continuing"
        fi
        echo "🚀 Starting Laravel dev server on 0.0.0.0:8000..."
        exec php artisan serve --host=0.0.0.0 --port=8000
        ;;

    vite)
        if [ ! -d /app/node_modules ] || [ -z "$(ls -A /app/node_modules 2>/dev/null)" ]; then
            echo "📦 Installing npm dependencies..."
            npm install
        fi
        echo "⚡ Starting Vite dev server on 0.0.0.0:5173..."
        exec npm run dev -- --host 0.0.0.0 --port 5173
        ;;

    queue)
        exec php artisan queue:listen --tries=3 --timeout=90
        ;;

    scheduler)
        echo "⏱️ Starting scheduler loop..."
        while true; do
            php artisan schedule:run --verbose --no-interaction
            sleep 60
        done
        ;;

    *)
        exec "$@"
        ;;
esac
