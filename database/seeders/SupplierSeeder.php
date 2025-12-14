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
                'name' => 'Kubota Genuine Parts Myanmar',
                'phone' => '+95 9 888 111 222',
                'email' => 'parts@kubota-myanmar.com',
                'address' => 'Industrial Zone 1, Shwe Pyi Thar, Yangon',
            ],
            [
                'code' => 'SUP002',
                'name' => 'Yanmar Parts & Service',
                'phone' => '+95 9 888 222 333',
                'email' => 'parts@yanmar-mm.com',
                'address' => 'Bayintnaung Road, Mayangone, Yangon',
            ],
            [
                'code' => 'SUP003',
                'name' => 'Golden Bearing Trading',
                'phone' => '+95 9 888 333 444',
                'email' => 'goldenbearing@email.com',
                'address' => 'Latha Township, Yangon',
            ],
            [
                'code' => 'SUP004',
                'name' => 'Myanmar Filter House',
                'phone' => '+95 9 888 444 555',
                'email' => 'filterhouse@email.com',
                'address' => 'Mingalardon, Yangon',
            ],
            [
                'code' => 'SUP005',
                'name' => 'V-Belt & Chain Supplies',
                'phone' => '+95 9 888 555 666',
                'email' => 'vbeltchain@email.com',
                'address' => 'Hlaing Tharyar Industrial Zone, Yangon',
            ],
            [
                'code' => 'SUP006',
                'name' => 'Castrol Lubricants Myanmar',
                'phone' => '+95 9 888 666 777',
                'email' => 'castrol.mm@email.com',
                'address' => 'Thilawa SEZ, Yangon',
            ],
            [
                'code' => 'SUP007',
                'name' => 'Tractor Tire Center',
                'phone' => '+95 9 888 777 888',
                'email' => null,
                'address' => 'Mandalay Industrial Zone, Mandalay',
            ],
        ];

        foreach ($suppliers as $supplier) {
            Supplier::create(array_merge($supplier, ['is_active' => true]));
        }
    }
}
