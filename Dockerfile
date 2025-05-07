# Use PHP 8.2 Alpine as the base image
FROM php:8.2-alpine

# Set environment variables
ENV COMPOSER_ALLOW_SUPERUSER=1 \
    PHP_MEMORY_LIMIT=256M \
    UPLOAD_MAX_FILESIZE=128M \
    POST_MAX_SIZE=128M \
    CONTAINER_ROLE=app \
    APP_ENV=production \
    PORT=9000

# Install necessary system packages and PHP extensions
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
        supervisor \
        nodejs \
        npm \
        $PHPIZE_DEPS && \
    docker-php-ext-configure gd --with-freetype --with-jpeg && \
    docker-php-ext-install -j$(nproc) \
        mysqli \
        pdo_mysql \
        sodium \
        zip \
        gd \
        intl \
        bcmath \
        opcache \
        exif && \
    pecl install redis && \
    docker-php-ext-enable redis opcache && \
    # Configure PHP
    echo "opcache.enable=1" >> /usr/local/etc/php/conf.d/docker-php-ext-opcache.ini && \
    echo "opcache.enable_cli=1" >> /usr/local/etc/php/conf.d/docker-php-ext-opcache.ini && \
    echo "opcache.jit_buffer_size=256M" >> /usr/local/etc/php/conf.d/docker-php-ext-opcache.ini && \
    echo "opcache.jit=1255" >> /usr/local/etc/php/conf.d/docker-php-ext-opcache.ini && \
    echo "memory_limit=${PHP_MEMORY_LIMIT}" > /usr/local/etc/php/conf.d/memory-limit.ini && \
    echo "upload_max_filesize=${UPLOAD_MAX_FILESIZE}" > /usr/local/etc/php/conf.d/uploads.ini && \
    echo "post_max_size=${POST_MAX_SIZE}" >> /usr/local/etc/php/conf.d/uploads.ini

# Install latest npm and node
RUN npm install -g npm@latest && \
    npm install -g vite

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Create non-root user
RUN addgroup -g 1000 laravel && \
    adduser -u 1000 -G laravel -h /home/laravel -D laravel && \
    mkdir -p /var/run/php-fpm && \
    chown -R laravel:laravel /var/run/php-fpm

# Configure PHP-FPM
RUN mkdir -p /usr/local/etc/php-fpm.d/
COPY docker/php/fpm-pool.conf /usr/local/etc/php-fpm.d/www.conf
COPY docker/php/php.ini /usr/local/etc/php/conf.d/custom.ini

# Set up supervisor
COPY docker/supervisord/supervisord.conf /etc/supervisor.d/supervisord.ini

# Set up entrypoint
COPY docker/entrypoint.sh /usr/local/bin/entrypoint
RUN chmod +x /usr/local/bin/entrypoint

# Expose PHP-FPM port (to be connected to Nginx container)
EXPOSE 9000
WORKDIR /app

# Set appropriate work directory permissions
RUN mkdir -p /app && chown -R laravel:laravel /app

# Copy application code
COPY --chown=laravel:laravel . /app/

# Remove open_basedir restriction for composer
RUN echo "open_basedir=" > /usr/local/etc/php/conf.d/open-basedir.ini

# Install composer dependencies
RUN composer install --no-interaction --prefer-dist --optimize-autoloader --no-dev

# Build frontend assets with detailed error handling
RUN if [ -f "vite.config.js" ] || [ -f "vite.config.ts" ]; then \
        echo "Building assets with Vite..." && \
        npm ci && \
        npm run build && \
        # Verify that manifest file was created
        if [ -f "public/build/manifest.json" ]; then \
            echo "Vite build successful, manifest file created." && \
            # Set proper permissions
            chown -R laravel:laravel /app/public/build; \
        else \
            echo "Vite build completed but manifest.json not found. Creating fallback..." && \
            mkdir -p public/build && \
            echo '{"resources/js/app.js":{"file":"assets/app.js","isEntry":true}}' > public/build/manifest.json && \
            chown -R laravel:laravel /app/public/build; \
        fi \
    else \
        echo "No Vite configuration found, skipping frontend build."; \
    fi

# Laravel optimization for production
RUN php artisan storage:link || true && \
    mkdir -p /app/storage/app/public && \
    mkdir -p /app/storage/framework/cache && \
    mkdir -p /app/storage/framework/sessions && \
    mkdir -p /app/storage/framework/views && \
    mkdir -p /app/bootstrap/cache && \
    chown -R laravel:laravel /app/storage /app/bootstrap/cache && \
    chmod -R 775 /app/storage /app/bootstrap/cache

# Clean up
RUN apk del $PHPIZE_DEPS && \
    rm -rf /var/cache/apk/* /tmp/*

# Switch to non-root user
USER laravel

# Set entrypoint
ENTRYPOINT ["entrypoint"]

# Default command - start PHP-FPM
CMD ["php-fpm"]
