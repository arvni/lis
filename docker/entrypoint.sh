#!/bin/sh
set -e

# ─────────────────────────────────────────────
# Configuration
# ─────────────────────────────────────────────
role=${CONTAINER_ROLE:-app}
env=${APP_ENV:-production}

cd /app

# ─────────────────────────────────────────────
# Wait for MySQL to be ready (TCP check)
# ─────────────────────────────────────────────
echo "⏳ Waiting for database connection..."
max_retries=30
count=0
until nc -z "$DB_HOST" "$DB_PORT" 2>/dev/null; do
    count=$((count + 1))
    if [ "$count" -ge "$max_retries" ]; then
        echo "❌ Database not reachable after ${max_retries} attempts. Aborting."
        exit 1
    fi
    echo "   Retrying (${count}/${max_retries})..."
    sleep 2
done
echo "✅ Database is ready."

# ─────────────────────────────────────────────
# Clear caches if requested
# ─────────────────────────────────────────────
if [ "$CLEAR_CACHES_ON_STARTUP" = "true" ]; then
    echo "🧹 Clearing caches..."
    php artisan optimize:clear
fi

# ─────────────────────────────────────────────
# Migrations — app role only to avoid races
# ─────────────────────────────────────────────
if [ "$MIGRATE_ON_STARTUP" = "true" ] && [ "$role" = "app" ]; then
    echo "🔄 Running database migrations..."
    php artisan migrate --force
fi

# ─────────────────────────────────────────────
# Laravel optimizations — app role, non-local
# ─────────────────────────────────────────────
if [ "$env" != "local" ] && [ "$role" = "app" ]; then
    echo "⚡ Running Laravel optimizations..."
    php artisan config:cache
    php artisan route:cache
    php artisan view:cache
fi

# ─────────────────────────────────────────────
# Storage link — app role only
# ─────────────────────────────────────────────
if [ "$role" = "app" ]; then
    php artisan storage:link --quiet || true
fi

# ─────────────────────────────────────────────
# Start service based on role
# ─────────────────────────────────────────────
case "$role" in
    app)
        echo "🚀 Starting Laravel application server..."
        exec php artisan serve --host=0.0.0.0 --port=${PORT:-8000}
        ;;

    queue)
        echo "⚙️ Starting queue worker..."
        exec php artisan queue:work \
            --tries=3 \
            --timeout=90 \
            --memory=512 \
            --sleep=3 \
            --max-jobs=1000
        ;;

    scheduler)
        echo "⏱️ Starting scheduler loop..."
        trap 'echo "🛑 Scheduler shutting down..."; exit 0' SIGTERM SIGINT
        while true; do
            php artisan schedule:run --verbose --no-interaction
            sleep 60 &
            wait $!
        done
        ;;

    *)
        echo "❌ Unknown CONTAINER_ROLE: $role"
        exit 1
        ;;
esac
