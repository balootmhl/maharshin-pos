# Agent Guidelines

## 1. Project Stack
- **Backend:** Laravel 12
- **Frontend:** React JS, Inertia.js, Tailwind CSS, Shadcn UI
- **Database:** MySQL
- **Local Environment:** Laravel Herd (macOS)

## 2. CLI & Development Commands
We are using **Laravel Herd** locally. Standard PHP, Artisan, and Composer commands can be run directly on the host machine.

- **PHP Artisan:** `php artisan <command>`
- **Composer:** `composer <command>`
- **Tinker:** `php artisan tinker`

*Note: For the frontend, always use `pnpm`.*

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
