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
        $branches = [
            [
                'code' => 'BR-YGN-BYN',
                'name' => 'Yangon Bayintnaung Showroom',
                'address' => 'No. 123, Bayintnaung Road, Hlaing Township, Yangon',
                'phone' => '+95 9 750 123 456',
                'email' => 'bayintnaung@pos.zabyuaungpyae.com',
            ],
        ];

        foreach ($branches as $branch) {
            Branch::create(array_merge($branch, ['is_active' => true]));
        }
    }
}
