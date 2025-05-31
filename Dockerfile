# Stage 1: Build the application
FROM php:8.2-alpine as builder

# Set environment variables for build stage
ENV COMPOSER_ALLOW_SUPERUSER=1 \
    PHP_MEMORY_LIMIT=256M \
    UPLOAD_MAX_FILESIZE=128M \
    POST_MAX_SIZE=128M \
    PSYSH_HISTORY_FILE=/dev/null \
    PSYSH_CONFIG_FILE=/dev/null \
    PSYSH_MANUAL_DB_FILE=/dev/null

# Install necessary packages and PHP extensions
RUN apk --no-cache add \
        libmemcached-libs \
        zlib \
        libzip-dev \
        libpng-dev \
        libsodium \
        libsodium-dev \
        jpeg-dev \
        freetype-dev \
        curl \
        icu \
        icu-dev \
        g++ \
        make \
        oniguruma-dev \
        linux-headers \
        libxml2-dev \
        bash \
        git \
        nodejs \
        npm \
        postgresql-dev \
        libpq \
        $PHPIZE_DEPS && \
    docker-php-ext-configure gd --with-freetype --with-jpeg && \
    docker-php-ext-install -j$(nproc) \
        mysqli \
        pdo_mysql \
        pdo_pgsql \
        pgsql \
        sodium \
        zip \
        gd \
        intl \
        bcmath \
        opcache \
        exif && \
    pecl install redis && \
    docker-php-ext-enable redis opcache

# Install npm and Composer
RUN npm install -g npm@latest
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Set up app directory
WORKDIR /app

# Copy composer files and install dependencies
COPY composer.* ./
RUN composer install --no-interaction --prefer-dist --no-scripts --no-autoloader

# Copy application code
COPY . .

# Install npm dependencies and build assets
RUN if [ -f "package.json" ]; then \
        npm ci && \
        npm run build || echo 'Frontend build failed, continuing anyway'; \
    fi

# Finish composer installation
RUN composer dump-autoload --optimize --no-dev

# Stage 2: Create the production image
FROM php:8.2-alpine

# Set environment variables for production
ENV PHP_MEMORY_LIMIT=256M \
    UPLOAD_MAX_FILESIZE=128M \
    POST_MAX_SIZE=128M \
    CONTAINER_ROLE=app \
    APP_ENV=production \
    PORT=8000 \
    PSYSH_HISTORY_FILE=/dev/null \
    PSYSH_CONFIG_FILE=/dev/null \
    PSYSH_MANUAL_DB_FILE=/dev/null

# Install required PHP extensions
COPY --from=builder /usr/local/lib/php/extensions /usr/local/lib/php/extensions
COPY --from=builder /usr/local/etc/php/conf.d /usr/local/etc/php/conf.d

# Install minimal required packages including PostgreSQL runtime libraries
RUN apk --no-cache add \
        libmemcached-libs \
        zlib \
        libzip \
        libpng \
        libsodium \
        jpeg \
        freetype \
        icu \
        bash \
        supervisor \
        libpq && \
    # Configure PHP
    echo "memory_limit=${PHP_MEMORY_LIMIT}" > /usr/local/etc/php/conf.d/memory-limit.ini && \
    echo "upload_max_filesize=${UPLOAD_MAX_FILESIZE}" > /usr/local/etc/php/conf.d/uploads.ini && \
    echo "post_max_size=${POST_MAX_SIZE}" >> /usr/local/etc/php/conf.d/uploads.ini

# Copy application from builder stage
WORKDIR /app
COPY --from=builder /app /app

# Create all necessary directories
RUN mkdir -p /app/storage/app/public && \
    mkdir -p /app/storage/app/private/App/Models/Patient/946 && \
    mkdir -p /app/storage/app/private/App/Models/ReferrerOrder && \
    mkdir -p /app/storage/framework/cache && \
    mkdir -p /app/storage/framework/sessions && \
    mkdir -p /app/storage/framework/views && \
    mkdir -p /app/bootstrap/cache && \
    chmod -R 777 /app/storage && \
    chmod -R 777 /app/bootstrap/cache

# Set up supervisor and entrypoint
COPY docker/supervisord/supervisord.conf /etc/supervisor.d/supervisord.ini
COPY docker/entrypoint.sh /usr/local/bin/entrypoint
RUN chmod +x /usr/local/bin/entrypoint

# Expose Laravel's built-in server port
EXPOSE 8000

# Set entrypoint and default command
ENTRYPOINT ["entrypoint"]
CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--port=8000"]
