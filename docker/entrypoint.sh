#!/bin/sh
set -e

# Define default values
role=${CONTAINER_ROLE:-app}
env=${APP_ENV:-production}

cd /app

# Run Laravel optimization if not in local environment
if [ "$env" != "local" ]; then
    echo "🔄 Running Laravel optimizations..."
    php artisan config:cache
    php artisan route:cache
    php artisan view:cache
fi

# Run migrations with a timeout to prevent hanging on database issues
if [ "$MIGRATE_ON_STARTUP" = "true" ]; then
    echo "🔄 Running database migrations..."
    php artisan migrate --force || echo "⚠️ Migration failed, will continue startup"
fi

# Clear caches if requested (useful for redeployments)
if [ "$CLEAR_CACHES_ON_STARTUP" = "true" ]; then
    echo "🧹 Clearing caches..."
    php artisan cache:clear
    php artisan config:clear
    php artisan view:clear
    php artisan route:clear
fi

# Start appropriate service based on container role
case "$role" in
    app)
        echo "🚀 Starting PHP-FPM..."
        exec php artisan serv --host=0.0.0.0
        ;;
    queue)
        echo "⚙️ Starting Laravel queue worker..."
        exec php artisan queue:work --tries=3 --timeout=90 --memory=512
        ;;
    scheduler)
        echo "⏱️ Starting Laravel scheduler..."
        while true; do
            php artisan schedule:run --verbose --no-interaction
            sleep 60
        done
        ;;
    *)
        echo "❌ Unknown container role: $role"
        exit 1
        ;;
esac
