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
# Validate required environment variables and
# confirm database credentials work before any
# artisan commands run (all three roles)
# ─────────────────────────────────────────────
echo "🔍 Validating environment..."
php artisan env:validate

# ─────────────────────────────────────────────
# Wait for all pending migrations to finish
# (used by queue + scheduler roles so they don't
#  start processing jobs against a mid-migration schema)
# ─────────────────────────────────────────────
wait_for_migrations() {
    echo "⏳ Waiting for pending migrations to complete..."
    max_retries=60
    count=0
    while [ "$count" -lt "$max_retries" ]; do
        # Secondary TCP check before querying migrate status
        if ! nc -z "$DB_HOST" "$DB_PORT" 2>/dev/null; then
            count=$((count + 1))
            echo "   DB not reachable (${count}/${max_retries}), retrying..."
            sleep 5
            continue
        fi
        # Capture exit code separately so a non-zero migrate:status does not
        # break the wait loop (set -e would otherwise kill the script)
        set +e
        migrate_out=$(php artisan migrate:status 2>&1)
        migrate_rc=$?
        set -e
        if [ "$migrate_rc" -ne 0 ]; then
            count=$((count + 1))
            echo "   migrate:status failed (${count}/${max_retries}), retrying..."
            sleep 5
            continue
        fi
        if ! echo "$migrate_out" | grep -q "| No "; then
            echo "✅ All migrations have run."
            return 0
        fi
        count=$((count + 1))
        echo "   Migrations still pending (${count}/${max_retries})..."
        sleep 5
    done
    echo "❌ Migrations did not complete within timeout. Aborting."
    exit 1
}

# ─────────────────────────────────────────────
# Clear caches if requested
# ─────────────────────────────────────────────
if [ "$CLEAR_CACHES_ON_STARTUP" = "true" ]; then
    echo "🧹 Clearing caches..."
    php artisan optimize:clear
fi

# ─────────────────────────────────────────────
# Migrations — app role only, with advisory lock
# so simultaneous replicas do not race
# ─────────────────────────────────────────────
if [ "$MIGRATE_ON_STARTUP" = "true" ] && [ "$role" = "app" ]; then
    echo "🔄 Running database migrations..."
    php artisan migrate:safe
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
        wait_for_migrations
        echo "⚙️ Starting queue worker..."
        exec php artisan queue:work \
            --tries=3 \
            --timeout=90 \
            --memory=512 \
            --sleep=3 \
            --max-jobs=1000
        ;;

    scheduler)
        wait_for_migrations
        echo "⏱️ Starting scheduler loop..."
        trap 'echo "🛑 Scheduler shutting down..."; exit 0' SIGTERM SIGINT
        while true; do
            # Skip this tick if a previous schedule:run is still running
            if [ -f /tmp/schedule.pid ] && kill -0 "$(cat /tmp/schedule.pid)" 2>/dev/null; then
                echo "⚠️  Previous schedule:run still running (PID $(cat /tmp/schedule.pid)), skipping tick."
            else
                php artisan schedule:run --verbose --no-interaction &
                echo $! > /tmp/schedule.pid
            fi
            sleep 60 &
            wait $!
        done
        ;;

    *)
        echo "❌ Unknown CONTAINER_ROLE: $role"
        exit 1
        ;;
esac
