# Deploying a new Laravel + Inertia + React app to the shared Azure infra

**Purpose**: This guide lets an AI coding agent (Claude Code, Antigravity, etc.) deploy a
*new* Laravel + Inertia + React (RILT-stack) app to Azure, reusing the shared
Container Registry, MySQL Flexible Server, and Container Apps Environment that
already host `maharshin-pos`. Reusing this infra means **no new fixed monthly
cost** for ACR or the DB server — only the new Container App's own
scale-to-zero consumption is billable.

Give this whole file to the agent working inside the new app's repo and tell
it to fill in the placeholders in Step 0, then execute Steps 1-8 in order.

---

## Step 0 — Fill in these values first

Shared infra already exists (do not recreate):

| Name | Value |
|---|---|
| Resource Group | `balootmhl` |
| Region | Southeast Asia |
| ACR login server | `zapposacr.azurecr.io` |
| Container Apps Environment | `maharshin-pos-env` |
| MySQL Flexible Server FQDN | `balootmhl-db.mysql.database.azure.com` |
| MySQL admin login (server-level admin only — do not use for app connections) | `balootmhl` |

New values the agent must choose and substitute everywhere below:

| Placeholder | Example | Notes |
|---|---|---|
| `<APP_SLUG>` | `myapp` | short kebab-case name, used for image name, container app name, DB name |
| `<DB_NAME>` | `myapp_db` | new database on the shared MySQL server |
| `<DB_USER>` | `myapp_user` | dedicated MySQL user, scoped to `<DB_NAME>` only — never reuse the `balootmhl` admin login as the app's runtime DB user |
| `<DB_PASSWORD>` | (generate a strong random password) | **must be set with single quotes in bash** — see Pitfall #1 |
| `<APP_HOSTNAME>` (optional custom domain) | `myapp.zabyuaungpyae.com` | only if a custom domain is wanted |

---

## Step 1 — Prepare the Dockerfile

Use this two-stage template (proven working for `maharshin-pos`). Adjust the
`apt-get install` extension list only if the new app needs different PHP
extensions (check `composer.json` `require` for hints like `ext-gd`,
`ext-imagick`, etc.).

```dockerfile
# =========================================================
# Stage 1: Build frontend assets (Vite + Inertia/React)
# =========================================================
FROM node:22-alpine AS frontend-builder
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && corepack pnpm install --frozen-lockfile
COPY . .
RUN corepack pnpm build

# =========================================================
# Stage 2: Final production PHP + Nginx image
# =========================================================
FROM serversideup/php:8.3-fpm-nginx
USER root

RUN apt-get update && apt-get install -y \
        libpng-dev libjpeg-dev libfreetype6-dev libexif-dev \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install gd exif \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /var/www/html
COPY --chown=www-data:www-data . .
COPY --from=frontend-builder --chown=www-data:www-data /app/public/build ./public/build

USER root
RUN composer install --no-dev --optimize-autoloader --no-interaction 2>/dev/null || true

# IMPORTANT: do NOT run `php artisan config:cache` here — env vars only exist
# at Container Apps runtime, not at build time. Caching a config snapshot with
# empty/missing env vars baked in will break the app in production.
RUN php artisan route:cache || true \
    && php artisan view:cache || true

USER www-data
EXPOSE 8080
```

And a matching `.dockerignore`:

```
.git
.gitignore
.env
.env.*
!.env.example
node_modules
vendor
storage/logs/*
storage/framework/cache/*
storage/framework/sessions/*
storage/framework/views/*
docker-compose.yml
docker-compose.*.yml
Dockerfile
.dockerignore
README.md
tests
.phpunit.result.cache
```

## Step 2 — Required Laravel code fixes (before building)

Apply these to `bootstrap/app.php` (or wherever middleware is configured) —
required because Container Apps terminates TLS at the edge and forwards plain
HTTP internally:

```php
->withMiddleware(function (Middleware $middleware) {
    $middleware->trustProxies(at: '*');
    // ... rest of existing middleware config
})
```

Without this, Laravel thinks every request is plain HTTP, which breaks secure
cookies, `Request::isSecure()`, and causes mixed-content-style issues.

Also confirm `config/database.php`'s `mysql` connection has:
```php
'options' => extension_loaded('pdo_mysql') ? array_filter([
    PDO::MYSQL_ATTR_SSL_CA => env('MYSQL_ATTR_SSL_CA'),
]) : [],
```
(Laravel 11/12 default skeleton already includes this — just confirm it
wasn't removed.)

## Step 3 — Create the database and a scoped user on the shared MySQL server

Run from a machine with `mysql` client and network access to the server
(firewall already allows "any Azure service" + your dev IP if previously added):

```bash
mysql -h balootmhl-db.mysql.database.azure.com \
      -u balootmhl -p \
      --ssl-mode=REQUIRED <<'SQL'
CREATE DATABASE <DB_NAME>;
CREATE USER '<DB_USER>'@'%' IDENTIFIED BY '<DB_PASSWORD>';
GRANT ALL PRIVILEGES ON <DB_NAME>.* TO '<DB_USER>'@'%';
FLUSH PRIVILEGES;
SQL
```

Using a dedicated user scoped to only the new database (rather than the
shared admin login) means a credential leak or bug in the new app can't touch
`maharshin_pos`'s data.

If importing an existing SQL dump (from cPanel/older MySQL), MySQL 8.4's
auto-generated invisible primary key (GIPK) can collide with the dump's own
`ALTER TABLE ... ADD PRIMARY KEY` statements ("Multiple primary key defined").
Disable it for the import session:

```bash
mysql -h balootmhl-db.mysql.database.azure.com -u balootmhl -p \
      --ssl-mode=REQUIRED \
      --init-command="SET SESSION sql_generate_invisible_primary_key=OFF;" \
      <DB_NAME> < dump.sql
```

Otherwise, just run migrations after first deploy (Step 6).

## Step 4 — Generate an APP_KEY

```bash
php artisan key:generate --show
```
Copy the output (`base64:...`) — used as a secret in Step 5.

## Step 5 — Build and push the image (must be linux/amd64)

```bash
az acr login --name zapposacr

docker buildx build --platform linux/amd64 \
  -t zapposacr.azurecr.io/<APP_SLUG>:v1 . --push
```

**Pitfall**: on Apple Silicon Macs, `docker build` defaults to `arm64` and
Container Apps will reject the image ("image OS/Arch must be linux/amd64").
Always use `buildx --platform linux/amd64` explicitly.

## Step 6 — Create the Container App

```bash
az containerapp create \
  --name <APP_SLUG> \
  --resource-group balootmhl \
  --environment maharshin-pos-env \
  --image zapposacr.azurecr.io/<APP_SLUG>:v1 \
  --registry-server zapposacr.azurecr.io \
  --target-port 8080 \
  --ingress external \
  --min-replicas 0 \
  --max-replicas 1 \
  --secrets db-password='<DB_PASSWORD>' app-key='base64:...' \
  --env-vars \
    DB_CONNECTION=mysql \
    DB_HOST=balootmhl-db.mysql.database.azure.com \
    DB_PORT=3306 \
    DB_DATABASE=<DB_NAME> \
    DB_USERNAME=<DB_USER> \
    DB_PASSWORD=secretref:db-password \
    APP_ENV=production \
    APP_DEBUG=false \
    APP_KEY=secretref:app-key \
    MYSQL_ATTR_SSL_CA=/etc/ssl/certs/ca-certificates.crt \
    LOG_CHANNEL=stderr \
    LOG_STACK=stderr \
    LOG_LEVEL=error \
    TELESCOPE_ENABLED=false
```

**Pitfall — quoting secrets**: always use **single quotes** around any secret
value containing `$`, `@`, or other shell-special characters. Double quotes
let bash interpolate `$xyz` as an (empty) variable, silently mangling the
password.

After creation, get the app's URL and set `APP_URL` (can't be known until the
app exists):

```bash
FQDN=$(az containerapp show --name <APP_SLUG> --resource-group balootmhl \
  --query properties.configuration.ingress.fqdn -o tsv)

az containerapp update --name <APP_SLUG> --resource-group balootmhl \
  --set-env-vars APP_URL=https://$FQDN
```

## Step 7 — Run migrations

Container Apps' filesystem is ephemeral and `az containerapp exec` needs an
interactive TTY (won't work from CI/non-interactive shells). Options, easiest
first:

- **From a local machine with DB network access**: point local `.env` at the
  same `DB_HOST`/`DB_DATABASE`/`DB_USER` (with `MYSQL_ATTR_SSL_CA` set) and run
  `php artisan migrate --force` locally — it's the same database, so this is
  equivalent to running it in the container.
- **Interactively** (if a real terminal is available): `az containerapp exec
  --name <APP_SLUG> --resource-group balootmhl --command "php artisan migrate --force"`.
- For repeatable/CI use, consider adding an Azure Container Apps Job that runs
  `php artisan migrate --force` on demand instead of relying on exec.

## Step 8 — Verify

```bash
curl -I https://$FQDN/up      # expect 200 — health route, doesn't touch DB
curl -I https://$FQDN/        # expect 200 or 302 — first real DB-touching request
```

Check logs for errors:
```bash
az containerapp logs show --name <APP_SLUG> --resource-group balootmhl \
  --type console --tail 100
```

Common first-request errors and what they mean:
- `SQLSTATE[HY000] [3159] ... require_secure_transport=ON` → `MYSQL_ATTR_SSL_CA`
  env var missing or wrong path.
- `SQLSTATE[HY000] [2002] Connection refused` → check DB firewall rule
  "Allow public access from any Azure service", and double/single-quoting of
  the DB password secret.
- 500 with no clear error in logs → confirm `LOG_CHANNEL=stderr` is set (the
  container's local `storage/logs/laravel.log` is not reliably readable via
  exec and isn't persisted).

---

## Optional — Custom domain (Cloudflare DNS)

1. Get this app's own domain verification ID (differs per Container App):
   ```bash
   az containerapp show --name <APP_SLUG> --resource-group balootmhl \
     --query properties.customDomainVerificationId -o tsv
   ```
2. In Cloudflare DNS for the domain, add:
   - `CNAME  <subdomain>  →  <APP_SLUG>.<container-apps-default-domain>`
     — **Proxy status must be "DNS only" (grey cloud)**, not proxied, or
     domain verification and managed-cert issuance will fail.
   - `TXT  asuid.<subdomain>  →  <verification ID from step 1>`
3. Once DNS propagates (check with `dig <APP_HOSTNAME>` / `dig -t TXT
   asuid.<subdomain>.<domain>`):
   ```bash
   az containerapp hostname add \
     --hostname <APP_HOSTNAME> --name <APP_SLUG> --resource-group balootmhl

   az containerapp hostname bind \
     --hostname <APP_HOSTNAME> --name <APP_SLUG> --resource-group balootmhl \
     --environment maharshin-pos-env --validation-method CNAME
   ```
   Managed certificate issuance can take a few minutes up to ~20 minutes.
4. Update `APP_URL` to the custom domain once the cert is bound:
   ```bash
   az containerapp update --name <APP_SLUG> --resource-group balootmhl \
     --set-env-vars APP_URL=https://<APP_HOSTNAME>
   ```

---

## Things this shared setup gives you for free (no extra cost)

- **ACR**: one Basic-SKU registry (`zapposacr.azurecr.io`, flat ~$5/month
  total) can hold any number of image repositories — pushing
  `zapposacr.azurecr.io/<APP_SLUG>:v1` doesn't add a new registry charge.
- **MySQL Flexible Server**: one server can hold many databases — creating
  `<DB_NAME>` on the existing `balootmhl-db` server doesn't add a new DB
  server charge (only the extra storage the new DB actually uses, within the
  existing 20GB).
- **Container Apps Environment**: `maharshin-pos-env` can host multiple
  Container Apps — only each app's own scale-to-zero consumption is billed.

The only new recurring cost from adding an app is that app's own Container
Apps consumption (near-zero at low traffic, scale-to-zero when idle).

## Things that are NOT shared and need attention

- **Ephemeral filesystem**: Container Apps storage doesn't persist across
  restarts/scale events. If the new app writes uploads to local disk, wire up
  Azure Blob Storage via `Storage::disk()` before real use — don't rely on
  `storage/app/public`.
- **Backups**: the shared MySQL server's automated backups cover all
  databases on it, but confirm retention window is adequate for the new app's
  data too (it's a global server setting, not per-database).
- **DB user isolation**: always create a dedicated `<DB_USER>` scoped to
  `<DB_NAME>` (Step 3) — never let two apps share the same MySQL login.
