<?php

namespace Database\Seeders;

use App\Models\Branch;
use Illuminate\Database\Seeder;

class BranchSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create specific branches for testing
        Branch::create([
            'code' => 'HQ',
            'name' => 'Headquarters',
            'address' => '123 Main Street, Yangon',
            'phone' => '+95 9 123 456 789',
            'email' => 'hq@maharshin.com',
            'is_active' => true,
        ]);

        Branch::create([
            'code' => 'MDY',
            'name' => 'Mandalay Branch',
            'address' => '456 78th Street, Mandalay',
            'phone' => '+95 9 987 654 321',
            'email' => 'mandalay@maharshin.com',
            'is_active' => true,
        ]);

        Branch::create([
            'code' => 'NPT',
            'name' => 'Naypyidaw Branch',
            'address' => '789 Capital Road, Naypyidaw',
            'phone' => '+95 9 555 666 777',
            'email' => 'naypyidaw@maharshin.com',
            'is_active' => true,
        ]);
    }
}
