# Use PHP 8.2 Alpine as the base image
FROM php:8.2-alpine

# Set environment variables
ENV COMPOSER_ALLOW_SUPERUSER=1 \
    PHP_MEMORY_LIMIT=256M \
    UPLOAD_MAX_FILESIZE=128M \
    POST_MAX_SIZE=128M \
    CONTAINER_ROLE=app \
    APP_ENV=production \
    PORT=8000

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
        shadow \
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
    echo "memory_limit=${PHP_MEMORY_LIMIT}" > /usr/local/etc/php/conf.d/memory-limit.ini && \
    echo "upload_max_filesize=${UPLOAD_MAX_FILESIZE}" > /usr/local/etc/php/conf.d/uploads.ini && \
    echo "post_max_size=${POST_MAX_SIZE}" >> /usr/local/etc/php/conf.d/uploads.ini

# Install npm and node
RUN npm install -g npm@latest

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Create Laravel user with the same UID/GID as the host user
# This helps with shared volume permissions
RUN addgroup -g 1000 laravel && \
    adduser -u 1000 -G laravel -h /home/laravel -D laravel && \
    # Add laravel user to the www-data group (if it exists)
    addgroup -g 82 -S www-data || true && \
    adduser laravel www-data || true

# Set up directories with proper permissions
RUN mkdir -p /app && \
    chown -R laravel:laravel /app && \
    chmod -R 755 /app

# Set up supervisor
COPY docker/supervisord/supervisord.conf /etc/supervisor.d/supervisord.ini
RUN chmod 644 /etc/supervisor.d/supervisord.ini

# Set up entrypoint
COPY docker/entrypoint.sh /usr/local/bin/entrypoint
RUN chmod +x /usr/local/bin/entrypoint

# Expose Laravel's built-in server port
EXPOSE 8000
WORKDIR /app

# Copy application code
COPY --chown=laravel:laravel . /app/

# Remove open_basedir restriction for composer
RUN echo "open_basedir=" > /usr/local/etc/php/conf.d/open-basedir.ini

# Install composer dependencies
RUN su laravel -c "composer install --no-interaction --prefer-dist --optimize-autoloader --no-dev"

# Install npm dependencies and build assets (if necessary)
RUN if [ -f "package.json" ]; then \
        su laravel -c "npm ci && npm run build || echo 'Frontend build failed, continuing anyway'"; \
    fi

# Create all required storage directories with proper permissions
RUN mkdir -p /app/storage/app/private/App/Models/Patient/946 && \
    mkdir -p /app/storage/app/public && \
    mkdir -p /app/storage/framework/cache && \
    mkdir -p /app/storage/framework/sessions && \
    mkdir -p /app/storage/framework/views && \
    mkdir -p /app/bootstrap/cache && \
    chown -R laravel:laravel /app/storage /app/bootstrap && \
    chmod -R 775 /app/storage /app/bootstrap

# Laravel optimization for production
RUN su laravel -c "php artisan storage:link || true"

# Clean up
RUN apk del $PHPIZE_DEPS && \
    rm -rf /var/cache/apk/* /tmp/*

# Switch to laravel user
USER laravel

# Set entrypoint
ENTRYPOINT ["entrypoint"]

# Default command - start Laravel's built-in server
CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--port=8000"]
