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
    echo "post_max_size=${POST_MAX_SIZE}" >> /usr/local/etc/php/conf.d/uploads.ini && \
    # Clean up build dependencies
    apk del $PHPIZE_DEPS && \
    rm -rf /var/cache/apk/* /tmp/*

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Create non-root user
RUN addgroup -g 1000 laravel && \
    adduser -u 1000 -G laravel -h /home/laravel -D laravel && \
    mkdir -p /var/run/php-fpm && \
    chown -R laravel:laravel /var/run/php-fpm

# Install Node.js and npm
COPY --from=node:18-alpine /usr/local/bin/node /usr/local/bin/node
COPY --from=node:18-alpine /usr/local/lib/node_modules /usr/local/lib/node_modules
RUN ln -s /usr/local/lib/node_modules/npm/bin/npm-cli.js /usr/local/bin/npm

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

# Only copy the composer files first to leverage Docker cache
COPY --chown=laravel:laravel composer.* /app/
RUN composer install --prefer-dist --no-scripts --no-dev --no-autoloader || \
    composer update --prefer-dist --no-scripts --no-dev --no-autoloader

# Copy package.json files
COPY --chown=laravel:laravel package*.json /app/
RUN npm ci --only=production

# Copy application code
COPY --chown=laravel:laravel . /app/

# Build assets and finish composer installation
RUN npm run build && \
    composer dump-autoload --optimize --no-dev

# Laravel optimization for production
RUN php artisan storage:link || true && \
    mkdir -p /app/storage/app/public && \
    mkdir -p /app/storage/framework/cache && \
    mkdir -p /app/storage/framework/sessions && \
    mkdir -p /app/storage/framework/views && \
    mkdir -p /app/bootstrap/cache && \
    chown -R laravel:laravel /app/storage /app/bootstrap/cache && \
    chmod -R 775 /app/storage /app/bootstrap/cache

# Switch to non-root user
USER laravel

# Set entrypoint
ENTRYPOINT ["entrypoint"]

# Default command - start PHP-FPM
CMD ["php-fpm"]
