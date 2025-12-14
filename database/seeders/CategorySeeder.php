<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $categories = [
            ['code' => 'ENG', 'name' => 'Engine Parts', 'description' => 'Pistons, rings, gaskets, bearings for engines'],
            ['code' => 'FLT', 'name' => 'Filters', 'description' => 'Oil filters, air filters, fuel filters, hydraulic filters'],
            ['code' => 'BLT', 'name' => 'Belts & Chains', 'description' => 'V-belts, timing belts, roller chains'],
            ['code' => 'BRG', 'name' => 'Bearings & Seals', 'description' => 'Ball bearings, roller bearings, oil seals'],
            ['code' => 'BLD', 'name' => 'Blades & Cutters', 'description' => 'Harvester blades, rotary cutter blades'],
            ['code' => 'PMP', 'name' => 'Pumps & Components', 'description' => 'Water pumps, fuel pumps, hydraulic pumps, pump parts'],
            ['code' => 'ELC', 'name' => 'Electrical Parts', 'description' => 'Starters, alternators, spark plugs, batteries'],
            ['code' => 'HYD', 'name' => 'Hydraulic Parts', 'description' => 'Hydraulic hoses, fittings, cylinders, valves'],
            ['code' => 'TRN', 'name' => 'Transmission Parts', 'description' => 'Gears, clutches, shafts, transmission components'],
            ['code' => 'TIR', 'name' => 'Tires & Tubes', 'description' => 'Tractor tires, tubes, wheels'],
            ['code' => 'OIL', 'name' => 'Oils & Lubricants', 'description' => 'Engine oils, hydraulic oils, gear oils, grease'],
            ['code' => 'SPR', 'name' => 'Sprayer Parts', 'description' => 'Nozzles, pumps, hoses, tanks for sprayers'],
            ['code' => 'TLS', 'name' => 'Tools & Accessories', 'description' => 'Hand tools, wrenches, maintenance accessories'],
        ];

        foreach ($categories as $category) {
            Category::create(array_merge($category, ['is_active' => true]));
        }
    }
}
