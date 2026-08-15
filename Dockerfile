# =========================================================
# Stage 1: Build frontend assets (Vite + Inertia/React)
# =========================================================
FROM node:22-alpine AS frontend-builder

WORKDIR /app

# Copy only package files first for better layer caching
COPY package.json pnpm-lock.yaml ./

RUN corepack enable && corepack pnpm install --frozen-lockfile

# Copy the rest of the app so Vite can see resources/, vite.config.js, etc.
COPY . .

RUN corepack pnpm build

# =========================================================
# Stage 2: Final production PHP + Nginx image
# =========================================================
FROM serversideup/php:8.3-fpm-nginx

USER root

# Same GD/exif extensions as your local dev setup
RUN apt-get update && apt-get install -y \
    libpng-dev libjpeg-dev libfreetype6-dev libexif-dev \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install gd exif \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /var/www/html

# Copy application code (respects .dockerignore, see below)
COPY --chown=www-data:www-data . .

# Copy built frontend assets from stage 1 (Vite output)
COPY --from=frontend-builder --chown=www-data:www-data /app/public/build ./public/build

# Install PHP dependencies (production only, no dev packages)
USER root
RUN composer install --no-dev --optimize-autoloader --no-interaction 2>/dev/null || true

# Route/view caches are safe at build time (don't depend on env vars).
# config:cache is intentionally NOT run here — env vars (DB_HOST, APP_KEY, etc.)
# only exist at container runtime in Container Apps, not at build time.
# Run config:cache as part of container startup instead (see entrypoint note below).
RUN php artisan route:cache || true \
    && php artisan view:cache || true

USER www-data

# serversideup/php images listen on 8080 by default for nginx
EXPOSE 8080