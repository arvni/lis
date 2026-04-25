# ═══════════════════════════════════════════════════════════
# Stage 1: Build
# ═══════════════════════════════════════════════════════════
FROM php:8.2-fpm-alpine AS builder

ENV COMPOSER_ALLOW_SUPERUSER=1

RUN apk --no-cache add \
        libzip-dev \
        libpng-dev \
        libsodium-dev \
        jpeg-dev \
        freetype-dev \
        icu-dev \
        oniguruma-dev \
        linux-headers \
        libxml2-dev \
        postgresql-dev \
        g++ \
        make \
        git \
        nodejs \
        npm \
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
        exif \
        pcntl && \
    pecl install redis && \
    docker-php-ext-enable redis opcache

COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /app

# Install PHP dependencies (cached layer)
COPY composer.json composer.lock ./
RUN composer install \
        --no-interaction \
        --prefer-dist \
        --no-scripts \
        --no-dev \
        --no-autoloader

# Copy source code
COPY . .

# Build frontend assets
RUN if [ -f "package.json" ]; then \
        npm ci && \
        npm run build || echo "⚠️ Frontend build failed, continuing"; \
        rm -rf node_modules; \
    fi

# Finalise autoloader
RUN composer dump-autoload --optimize --no-dev

# ═══════════════════════════════════════════════════════════
# Stage 2: Production image
# ═══════════════════════════════════════════════════════════
FROM php:8.2-fpm-alpine

LABEL maintainer="Bion Genetic Laboratory"

ENV PHP_MEMORY_LIMIT=256M \
    UPLOAD_MAX_FILESIZE=128M \
    POST_MAX_SIZE=128M \
    CONTAINER_ROLE=app \
    APP_ENV=production \
    PORT=9000 \
    PSYSH_HISTORY_FILE=/dev/null \
    PSYSH_CONFIG_FILE=/dev/null \
    PSYSH_MANUAL_DB_FILE=/dev/null

# Copy PHP extensions from builder
COPY --from=builder /usr/local/lib/php/extensions /usr/local/lib/php/extensions
COPY --from=builder /usr/local/etc/php/conf.d     /usr/local/etc/php/conf.d

# Runtime libraries + netcat for DB readiness check
RUN apk --no-cache add \
        libzip \
        libpng \
        libsodium \
        jpeg \
        freetype \
        icu-libs \
        libpq \
        bash \
        netcat-openbsd && \
    echo "memory_limit=${PHP_MEMORY_LIMIT}"           >  /usr/local/etc/php/conf.d/app.ini && \
    echo "upload_max_filesize=${UPLOAD_MAX_FILESIZE}" >> /usr/local/etc/php/conf.d/app.ini && \
    echo "post_max_size=${POST_MAX_SIZE}"             >> /usr/local/etc/php/conf.d/app.ini && \
    echo "expose_php=Off"                             >> /usr/local/etc/php/conf.d/app.ini && \
    echo "opcache.enable=1"                           >> /usr/local/etc/php/conf.d/app.ini && \
    echo "opcache.validate_timestamps=0"              >> /usr/local/etc/php/conf.d/app.ini && \
    echo "opcache.memory_consumption=128"             >> /usr/local/etc/php/conf.d/app.ini

WORKDIR /app

# Copy built application from builder
COPY --from=builder /app /app

# PHP-FPM pool config
COPY docker/php-fpm/www.conf /usr/local/etc/php-fpm.d/www.conf

# Storage directories — owned by www-data, no world-write
RUN mkdir -p \
        /app/storage/app/public \
        /app/storage/app/private \
        /app/storage/framework/cache/data \
        /app/storage/framework/sessions \
        /app/storage/framework/views \
        /app/bootstrap/cache && \
    chown -R www-data:www-data \
        /app/storage \
        /app/bootstrap/cache && \
    chmod -R 755 \
        /app/storage \
        /app/bootstrap/cache

COPY docker/entrypoint.sh /usr/local/bin/entrypoint
RUN chmod +x /usr/local/bin/entrypoint

EXPOSE 9000

ENTRYPOINT ["entrypoint"]
CMD ["php-fpm"]
