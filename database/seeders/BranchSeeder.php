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
                'code' => 'BR-YGN',
                'name' => 'Yangon Main Showroom',
                'address' => 'No. 123, Bayintnaung Road, Hlaing Township, Yangon',
                'phone' => '+95 9 750 123 456',
                'email' => 'yangon@maharshin.com',
            ],
            [
                'code' => 'BR-MDY',
                'name' => 'Mandalay Branch',
                'address' => 'No. 45, 78th Street, Chan Aye Thar Zan Township, Mandalay',
                'phone' => '+95 9 750 234 567',
                'email' => 'mandalay@maharshin.com',
            ],
            [
                'code' => 'BR-NPT',
                'name' => 'Nay Pyi Taw Branch',
                'address' => 'Dekkhina Thiri Township, Nay Pyi Taw',
                'phone' => '+95 9 750 345 678',
                'email' => 'naypyitaw@maharshin.com',
            ],
            [
                'code' => 'BR-PTN',
                'name' => 'Pathein Service Center',
                'address' => 'Shwe Myintmo Road, Pathein, Ayeyarwady',
                'phone' => '+95 9 750 456 789',
                'email' => 'pathein@maharshin.com',
            ],
        ];

        foreach ($branches as $branch) {
            Branch::create(array_merge($branch, ['is_active' => true]));
        }
    }
}
