#!/bin/sh
set -e

# Define default values
role=${CONTAINER_ROLE:-app}
env=${APP_ENV:-production}
port=${PORT:-8000}

cd /app

# Create all necessary directories with very permissive permissions
echo "🔧 Setting up storage directories with appropriate permissions..."
mkdir -p /app/storage/app/private/App/Models/Patient/946
mkdir -p /app/storage/app/private/App/Models/ReferrerOrder
mkdir -p /app/storage/framework/cache
mkdir -p /app/storage/framework/sessions
mkdir -p /app/storage/framework/views
mkdir -p /app/bootstrap/cache

# Make storage directories writable
chmod -R 777 /app/storage || true
chmod -R 777 /app/bootstrap/cache || true

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

# Start appropriate service based on container role
case "$role" in
    app)
        echo "🚀 Starting Laravel application server on port $port..."
        exec php artisan serve --host=0.0.0.0 --port=$port
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
