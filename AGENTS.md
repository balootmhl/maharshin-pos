# Agent Guidelines

## 1. Project Stack
- **Backend:** Laravel 12
- **Frontend:** React JS, Inertia.js, Tailwind CSS, Shadcn UI
- **Database:** MySQL
- **Containerization:** Docker & Docker Compose

## 2. Docker & CLI Commands
We are strictly using Docker for this project. **DO NOT** run standard PHP or Artisan commands directly on the host machine. Instead, execute them inside the `app` container via Docker Compose.

- **PHP Artisan:** `docker compose exec app php artisan <command>`
- **Composer:** `docker compose exec app composer <command>`
- **Tinker:** `docker compose exec app php artisan tinker`

*Note: For the frontend, you can still run `pnpm` commands on the host if necessary for Vite/Asset compilation.*

## 3. Node Package Manager
- Always use `pnpm` instead of `npm` or `yarn` for frontend dependencies and scripts (e.g., `pnpm install`, `pnpm run dev`, `pnpm run build`).

## 4. UI/UX Aesthetics
- Prioritize high-quality, modern, and beautiful UI/UX. Use Shadcn UI components natively.
- Maintain responsive design and dynamic layouts.
- When handling errors (e.g., 403, 404), integrate them into the `AppLayout` or use custom Inertia React pages rather than falling back to default raw Laravel blades.

## 5. Security & RBAC
- Strictly enforce Role-Based Access Control (RBAC) using Spatie Permissions.
- Always apply RBAC middleware (`HasMiddleware`) on both frontend UI elements and backend controllers.
- Core admin routes (e.g., `/settings`, `/users`, `/roles`, `/branches`) must remain protected under the `role:god` middleware. Do not bypass or remove this.

## 6. Code Quality
- Add comprehensive docblocks.
- Use strict typing where applicable (e.g., return types like `Response` or `RedirectResponse`).
- Preserve existing configurations, comments, and structure when editing code.
