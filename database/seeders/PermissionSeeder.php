<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;

class PermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        $permissions = [
            'products.view', 'products.create', 'products.edit', 'products.delete',
            'sales.view', 'sales.create', 'sales.edit', 'sales.delete',
            'purchases.view', 'purchases.create', 'purchases.edit', 'purchases.delete',
            'stocks.view', 'stocks.adjust', 'stocks.transfer',
            'customers.view', 'customers.create', 'customers.edit', 'customers.delete',
            'suppliers.view', 'suppliers.create', 'suppliers.edit', 'suppliers.delete',
            'reports.sales', 'reports.stocks', 'reports.financial',
            'settings.view', 'settings.edit',
            'users.view', 'users.create', 'users.edit', 'users.delete',
            'branches.view', 'branches.create', 'branches.edit', 'branches.delete',
            'roles.view', 'roles.manage',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission]);
        }
    }
}
