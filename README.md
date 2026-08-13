# Maharshin POS

A modern, robust Point of Sale (POS) and Inventory Management System built with Laravel, React, Inertia.js, and Docker.

## Core Features

- **Inventory Management:** Products, Categories, Product Pricing, Stock Movements, Stock Adjustments, and Stock History.
- **Sales & Returns:** Process Sales (with multiple price types and payment statuses), issue Receipts, and manage Sale Returns.
- **Purchases:** Manage Suppliers, record Purchases (Purchase Orders), and update inventory automatically.
- **Customer Management:** Track Customers, Credit Limits, and Customer Credit Ledgers.
- **Reporting:** Daily Summaries, Sales Reports, Daily Profit Reports, and Low Stock Alerts.
- **Role-Based Access Control (RBAC):** Granular permissions for Sales, Purchases, Stocks, Customers, Suppliers, and Reports using Spatie Permissions.
- **Multi-Branch Support:** Segregate stocks and transactions by branches. 

## Technology Stack

- [Laravel v12](https://laravel.com/)
- [Inertia v2](https://inertiajs.com)
- [React JS v19](https://react.dev/)
- [Tailwind CSS v4](https://tailwindcss.com/)
- [Shadcn UI](https://ui.shadcn.com/)
- [Docker & Docker Compose](https://www.docker.com/)

## Requirements

- Docker Desktop (or Docker Engine + Compose plugin)
- Node.js & pnpm (for local frontend development)

## Installation & Setup

1. Clone the repository.
2. Copy `.env.example` to `.env` and configure your environment variables.
3. Start the Docker containers:
   ```bash
   docker compose up -d
   ```
4. Install PHP dependencies inside the container:
   ```bash
   docker compose exec app composer install
   ```
5. Generate application key:
   ```bash
   docker compose exec app php artisan key:generate
   ```
6. Run migrations and seeders:
   ```bash
   docker compose exec app php artisan migrate:refresh --seed
   ```
7. Install Node dependencies (using pnpm):
   ```bash
   pnpm install
   ```
8. Build frontend assets or start Vite development server:
   ```bash
   pnpm run dev
   ```

## Authorization & Roles

- The system uses [Spatie Laravel Permission](https://spatie.be/docs/laravel-permission).
- **Super Admin (`god`):** Has bypass access to all routes, including core settings, users, and branches.
- **Standard Roles:** Managers, Cashiers, and Inventory Staff are restricted by specific `permissions` (e.g., `sales.create`, `products.view`).

### Default Users (Seed Data)

| Name         | Login Email      | Password | Role    |
|--------------|------------------|----------|---------|
| Super Admin  | admin@mail.com   | password | god     |
| Manager User | manager@mail.com | password | manager |
| User         | user@mail.com    | password |         |

## Development Guidelines

- **Docker First:** Always use `docker compose exec app ...` for backend CLI operations (Artisan, Composer). 
- **Frontend Tools:** Use `pnpm` exclusively for frontend package management.
- **RBAC:** All new controllers must implement `HasMiddleware` and explicitly define permission mappings.
