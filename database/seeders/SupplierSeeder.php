<?php

namespace Database\Seeders;

use App\Models\Supplier;
use Illuminate\Database\Seeder;

class SupplierSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $suppliers = [
            [
                'code' => 'SUP001',
                'name' => 'Myanmar Beverages Co.',
                'phone' => '+95 9 888 111 222',
                'email' => 'sales@mmbeverages.com',
                'address' => 'Industrial Zone 1, Yangon',
            ],
            [
                'code' => 'SUP002',
                'name' => 'Golden Rice Trading',
                'phone' => '+95 9 888 222 333',
                'email' => 'orders@goldenrice.com',
                'address' => 'Bayintnaung Road, Yangon',
            ],
            [
                'code' => 'SUP003',
                'name' => 'Quick Snacks Distribution',
                'phone' => '+95 9 888 333 444',
                'email' => 'quicksnacks@email.com',
                'address' => 'Hlaing Township, Yangon',
            ],
            [
                'code' => 'SUP004',
                'name' => 'Clean Home Supplies',
                'phone' => '+95 9 888 444 555',
                'email' => null,
                'address' => 'South Okkalapa, Yangon',
            ],
        ];

        foreach ($suppliers as $supplier) {
            Supplier::create(array_merge($supplier, ['is_active' => true]));
        }
    }
}
