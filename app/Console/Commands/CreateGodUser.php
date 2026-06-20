<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

class CreateGodUser extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'make:god-user';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Create a super admin (god role) user';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $name = $this->ask('Enter name for the god user');
        if (empty($name)) {
            $this->error('Name is required.');
            return 1;
        }

        $email = $this->ask('Enter email address');
        if (empty($email)) {
            $this->error('Email is required.');
            return 1;
        }

        if (User::where('email', $email)->exists()) {
            $this->error("A user with email {$email} already exists.");
            return 1;
        }

        $password = $this->secret('Enter password');
        if (empty($password)) {
            $this->error('Password is required.');
            return 1;
        }

        $confirmPassword = $this->secret('Confirm password');
        if ($password !== $confirmPassword) {
            $this->error('Passwords do not match.');
            return 1;
        }

        $superAdminRoleName = config('project.super_admin', 'god');

        // Make sure role exists
        $role = Role::firstOrCreate(['name' => $superAdminRoleName]);

        // Create user
        $user = User::create([
            'name' => $name,
            'email' => $email,
            'password' => Hash::make($password),
            'branch_id' => null, // God users do not need to be assigned to a branch
        ]);

        // Assign role
        $user->assignRole($role);

        $this->info("Super admin user {$user->name} ({$user->email}) created successfully with role '{$superAdminRoleName}'.");
        return 0;
    }
}
