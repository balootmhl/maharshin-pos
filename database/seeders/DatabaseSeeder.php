<?php

namespace Database\Seeders;

use App\Models\Todo;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Create roles and users first
        $this->createSuperAdmin();
        $this->createManager();
        $user = $this->createTestUser();

        // Seed dummy data for todos
        Todo::factory()
            ->count(5)
            ->for($user, 'creator')
            ->create();

        // Seed POS data in the correct order
        $this->call([
            // 1. Core reference data
            BranchSeeder::class,
            CategorySeeder::class,
            SupplierSeeder::class,
            CustomerSeeder::class,

            // 2. Products
            ProductSeeder::class,

            // 3. Stock initialization
            BranchStockSeeder::class,

            // 4. Settings
            SettingSeeder::class,

            // 5. Sample transactions
            PurchaseSeeder::class,
            SaleSeeder::class,
        ]);
    }

    // super admin user with super admin role and all permissions
    protected function createSuperAdmin(): void
    {
        // Create super admin role
        Role::create(['name' => config('project.super_admin')]);

        // create user and assign role
        $user = User::factory()->create([
            'name' => 'Admin',
            'email' => 'admin@mail.com',
            'password' => Hash::make('password'),
        ]);
        $user->assignRole(config('project.super_admin'));
    }

    // manager role and CRUD permissions
    protected function createManager(): void
    {
        $roleName = 'manager';

        // Create role
        $role = Role::create(['name' => $roleName]);

        // create CRUD permissions and assign to role
        $crud = ['create', 'read', 'update', 'delete'];
        foreach ($crud as $p) {
            Permission::firstOrCreate(['name' => $p]);
        }
        $permissions = Permission::get()->pluck('name');
        $role->syncPermissions($permissions);

        // create user and assign role
        $user = User::factory()->create([
            'name' => 'Manager User',
            'email' => 'manager@mail.com',
            'password' => Hash::make('password'),
        ]);
        $user->assignRole($roleName);
    }

    // user with read permission
    protected function createTestUser(): User
    {
        $role = Role::create(['name' => 'user']);
        $role->givePermissionTo('read');

        // create user
        $user = User::factory()->create([
            'name' => 'Test User',
            'email' => 'user@mail.com',
            'password' => Hash::make('password'),
        ]);
        $user->assignRole($role);

        return $user;
    }
}
