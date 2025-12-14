<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Database\Seeder;

class ProductSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $products = [
            // Engine Parts
            ['code' => 'ENG001', 'barcode' => '8801000001', 'name' => 'Piston Set (Kubota RT120)', 'category' => 'ENG', 'cost' => 85000, 'price' => 120000, 'unit' => 'set'],
            ['code' => 'ENG002', 'barcode' => '8801000002', 'name' => 'Piston Ring Set 85mm', 'category' => 'ENG', 'cost' => 25000, 'price' => 38000, 'unit' => 'set'],
            ['code' => 'ENG003', 'barcode' => '8801000003', 'name' => 'Cylinder Head Gasket (Yanmar)', 'category' => 'ENG', 'cost' => 18000, 'price' => 28000, 'unit' => 'piece'],
            ['code' => 'ENG004', 'barcode' => '8801000004', 'name' => 'Connecting Rod Bearing', 'category' => 'ENG', 'cost' => 12000, 'price' => 18000, 'unit' => 'set'],
            ['code' => 'ENG005', 'barcode' => '8801000005', 'name' => 'Crankshaft Main Bearing', 'category' => 'ENG', 'cost' => 35000, 'price' => 52000, 'unit' => 'set'],
            ['code' => 'ENG006', 'barcode' => '8801000006', 'name' => 'Valve Set Intake/Exhaust', 'category' => 'ENG', 'cost' => 22000, 'price' => 35000, 'unit' => 'set'],

            // Filters
            ['code' => 'FLT001', 'barcode' => '8802000001', 'name' => 'Oil Filter (Kubota)', 'category' => 'FLT', 'cost' => 8000, 'price' => 15000, 'unit' => 'piece'],
            ['code' => 'FLT002', 'barcode' => '8802000002', 'name' => 'Oil Filter (Yanmar)', 'category' => 'FLT', 'cost' => 9000, 'price' => 16000, 'unit' => 'piece'],
            ['code' => 'FLT003', 'barcode' => '8802000003', 'name' => 'Air Filter Element (Large)', 'category' => 'FLT', 'cost' => 15000, 'price' => 25000, 'unit' => 'piece'],
            ['code' => 'FLT004', 'barcode' => '8802000004', 'name' => 'Air Filter Element (Small)', 'category' => 'FLT', 'cost' => 8000, 'price' => 14000, 'unit' => 'piece'],
            ['code' => 'FLT005', 'barcode' => '8802000005', 'name' => 'Fuel Filter', 'category' => 'FLT', 'cost' => 6000, 'price' => 10000, 'unit' => 'piece'],
            ['code' => 'FLT006', 'barcode' => '8802000006', 'name' => 'Hydraulic Filter', 'category' => 'FLT', 'cost' => 25000, 'price' => 40000, 'unit' => 'piece'],

            // Belts & Chains
            ['code' => 'BLT001', 'barcode' => '8803000001', 'name' => 'V-Belt A68', 'category' => 'BLT', 'cost' => 8000, 'price' => 12000, 'unit' => 'piece'],
            ['code' => 'BLT002', 'barcode' => '8803000002', 'name' => 'V-Belt B72', 'category' => 'BLT', 'cost' => 10000, 'price' => 15000, 'unit' => 'piece'],
            ['code' => 'BLT003', 'barcode' => '8803000003', 'name' => 'V-Belt C85', 'category' => 'BLT', 'cost' => 12000, 'price' => 18000, 'unit' => 'piece'],
            ['code' => 'BLT004', 'barcode' => '8803000004', 'name' => 'Timing Belt (Kubota)', 'category' => 'BLT', 'cost' => 35000, 'price' => 55000, 'unit' => 'piece'],
            ['code' => 'BLT005', 'barcode' => '8803000005', 'name' => 'Roller Chain #50 (10ft)', 'category' => 'BLT', 'cost' => 45000, 'price' => 65000, 'unit' => 'roll'],
            ['code' => 'BLT006', 'barcode' => '8803000006', 'name' => 'Chain Link Connector', 'category' => 'BLT', 'cost' => 2500, 'price' => 4500, 'unit' => 'piece'],

            // Bearings & Seals
            ['code' => 'BRG001', 'barcode' => '8804000001', 'name' => 'Ball Bearing 6205', 'category' => 'BRG', 'cost' => 3500, 'price' => 6000, 'unit' => 'piece'],
            ['code' => 'BRG002', 'barcode' => '8804000002', 'name' => 'Ball Bearing 6208', 'category' => 'BRG', 'cost' => 5500, 'price' => 9000, 'unit' => 'piece'],
            ['code' => 'BRG003', 'barcode' => '8804000003', 'name' => 'Roller Bearing 30205', 'category' => 'BRG', 'cost' => 8000, 'price' => 13000, 'unit' => 'piece'],
            ['code' => 'BRG004', 'barcode' => '8804000004', 'name' => 'Oil Seal 35x52x7', 'category' => 'BRG', 'cost' => 2000, 'price' => 3500, 'unit' => 'piece'],
            ['code' => 'BRG005', 'barcode' => '8804000005', 'name' => 'Oil Seal 45x62x8', 'category' => 'BRG', 'cost' => 2500, 'price' => 4500, 'unit' => 'piece'],

            // Blades & Cutters
            ['code' => 'BLD001', 'barcode' => '8805000001', 'name' => 'Harvester Blade Set', 'category' => 'BLD', 'cost' => 65000, 'price' => 95000, 'unit' => 'set'],
            ['code' => 'BLD002', 'barcode' => '8805000002', 'name' => 'Rotary Cutter Blade', 'category' => 'BLD', 'cost' => 18000, 'price' => 28000, 'unit' => 'piece'],
            ['code' => 'BLD003', 'barcode' => '8805000003', 'name' => 'Tiller Blade Set', 'category' => 'BLD', 'cost' => 35000, 'price' => 52000, 'unit' => 'set'],
            ['code' => 'BLD004', 'barcode' => '8805000004', 'name' => 'Plow Share Point', 'category' => 'BLD', 'cost' => 12000, 'price' => 18000, 'unit' => 'piece'],

            // Pumps & Components
            ['code' => 'PMP001', 'barcode' => '8806000001', 'name' => 'Water Pump Assembly', 'category' => 'PMP', 'cost' => 85000, 'price' => 120000, 'unit' => 'piece'],
            ['code' => 'PMP002', 'barcode' => '8806000002', 'name' => 'Fuel Injection Pump', 'category' => 'PMP', 'cost' => 350000, 'price' => 480000, 'unit' => 'piece'],
            ['code' => 'PMP003', 'barcode' => '8806000003', 'name' => 'Fuel Lift Pump', 'category' => 'PMP', 'cost' => 45000, 'price' => 68000, 'unit' => 'piece'],
            ['code' => 'PMP004', 'barcode' => '8806000004', 'name' => 'Hydraulic Pump Gear', 'category' => 'PMP', 'cost' => 180000, 'price' => 250000, 'unit' => 'piece'],
            ['code' => 'PMP005', 'barcode' => '8806000005', 'name' => 'Water Pump Impeller', 'category' => 'PMP', 'cost' => 25000, 'price' => 38000, 'unit' => 'piece'],

            // Electrical Parts
            ['code' => 'ELC001', 'barcode' => '8807000001', 'name' => 'Starter Motor (Kubota)', 'category' => 'ELC', 'cost' => 180000, 'price' => 250000, 'unit' => 'piece'],
            ['code' => 'ELC002', 'barcode' => '8807000002', 'name' => 'Alternator 12V 40A', 'category' => 'ELC', 'cost' => 120000, 'price' => 165000, 'unit' => 'piece'],
            ['code' => 'ELC003', 'barcode' => '8807000003', 'name' => 'Glow Plug (Set of 4)', 'category' => 'ELC', 'cost' => 35000, 'price' => 55000, 'unit' => 'set'],
            ['code' => 'ELC004', 'barcode' => '8807000004', 'name' => 'Battery 12V 100Ah', 'category' => 'ELC', 'cost' => 180000, 'price' => 250000, 'unit' => 'piece'],
            ['code' => 'ELC005', 'barcode' => '8807000005', 'name' => 'Ignition Switch', 'category' => 'ELC', 'cost' => 15000, 'price' => 25000, 'unit' => 'piece'],

            // Hydraulic Parts
            ['code' => 'HYD001', 'barcode' => '8808000001', 'name' => 'Hydraulic Hose 1/2" (1m)', 'category' => 'HYD', 'cost' => 12000, 'price' => 20000, 'unit' => 'piece'],
            ['code' => 'HYD002', 'barcode' => '8808000002', 'name' => 'Hydraulic Hose 3/4" (1m)', 'category' => 'HYD', 'cost' => 18000, 'price' => 28000, 'unit' => 'piece'],
            ['code' => 'HYD003', 'barcode' => '8808000003', 'name' => 'Hydraulic Fitting Set', 'category' => 'HYD', 'cost' => 8000, 'price' => 14000, 'unit' => 'set'],
            ['code' => 'HYD004', 'barcode' => '8808000004', 'name' => 'Hydraulic Cylinder Seal Kit', 'category' => 'HYD', 'cost' => 35000, 'price' => 55000, 'unit' => 'set'],
            ['code' => 'HYD005', 'barcode' => '8808000005', 'name' => 'Hydraulic Control Valve', 'category' => 'HYD', 'cost' => 250000, 'price' => 350000, 'unit' => 'piece'],

            // Transmission Parts
            ['code' => 'TRN001', 'barcode' => '8809000001', 'name' => 'Clutch Plate', 'category' => 'TRN', 'cost' => 85000, 'price' => 120000, 'unit' => 'piece'],
            ['code' => 'TRN002', 'barcode' => '8809000002', 'name' => 'Clutch Pressure Plate', 'category' => 'TRN', 'cost' => 120000, 'price' => 165000, 'unit' => 'piece'],
            ['code' => 'TRN003', 'barcode' => '8809000003', 'name' => 'Release Bearing', 'category' => 'TRN', 'cost' => 25000, 'price' => 40000, 'unit' => 'piece'],
            ['code' => 'TRN004', 'barcode' => '8809000004', 'name' => 'PTO Shaft', 'category' => 'TRN', 'cost' => 180000, 'price' => 250000, 'unit' => 'piece'],

            // Tires & Tubes
            ['code' => 'TIR001', 'barcode' => '8810000001', 'name' => 'Tractor Rear Tire 12.4-28', 'category' => 'TIR', 'cost' => 350000, 'price' => 480000, 'unit' => 'piece'],
            ['code' => 'TIR002', 'barcode' => '8810000002', 'name' => 'Tractor Front Tire 6.00-16', 'category' => 'TIR', 'cost' => 95000, 'price' => 135000, 'unit' => 'piece'],
            ['code' => 'TIR003', 'barcode' => '8810000003', 'name' => 'Inner Tube 12.4-28', 'category' => 'TIR', 'cost' => 35000, 'price' => 52000, 'unit' => 'piece'],
            ['code' => 'TIR004', 'barcode' => '8810000004', 'name' => 'Inner Tube 6.00-16', 'category' => 'TIR', 'cost' => 15000, 'price' => 25000, 'unit' => 'piece'],

            // Oils & Lubricants
            ['code' => 'OIL001', 'barcode' => '8811000001', 'name' => 'Engine Oil 15W-40 (5L)', 'category' => 'OIL', 'cost' => 45000, 'price' => 65000, 'unit' => 'can'],
            ['code' => 'OIL002', 'barcode' => '8811000002', 'name' => 'Engine Oil 15W-40 (20L)', 'category' => 'OIL', 'cost' => 165000, 'price' => 220000, 'unit' => 'drum'],
            ['code' => 'OIL003', 'barcode' => '8811000003', 'name' => 'Hydraulic Oil 46 (20L)', 'category' => 'OIL', 'cost' => 120000, 'price' => 165000, 'unit' => 'drum'],
            ['code' => 'OIL004', 'barcode' => '8811000004', 'name' => 'Gear Oil 90 (5L)', 'category' => 'OIL', 'cost' => 55000, 'price' => 78000, 'unit' => 'can'],
            ['code' => 'OIL005', 'barcode' => '8811000005', 'name' => 'Grease Cartridge 400g', 'category' => 'OIL', 'cost' => 5000, 'price' => 8500, 'unit' => 'piece'],
            ['code' => 'OIL006', 'barcode' => '8811000006', 'name' => 'Grease Bucket 15kg', 'category' => 'OIL', 'cost' => 85000, 'price' => 120000, 'unit' => 'bucket'],

            // Sprayer Parts
            ['code' => 'SPR001', 'barcode' => '8812000001', 'name' => 'Spray Nozzle (Flat Fan)', 'category' => 'SPR', 'cost' => 3500, 'price' => 6000, 'unit' => 'piece'],
            ['code' => 'SPR002', 'barcode' => '8812000002', 'name' => 'Spray Nozzle (Cone)', 'category' => 'SPR', 'cost' => 4000, 'price' => 7000, 'unit' => 'piece'],
            ['code' => 'SPR003', 'barcode' => '8812000003', 'name' => 'Sprayer Pump Diaphragm', 'category' => 'SPR', 'cost' => 8000, 'price' => 14000, 'unit' => 'piece'],
            ['code' => 'SPR004', 'barcode' => '8812000004', 'name' => 'Spray Hose 10m', 'category' => 'SPR', 'cost' => 25000, 'price' => 38000, 'unit' => 'roll'],
            ['code' => 'SPR005', 'barcode' => '8812000005', 'name' => 'Spray Lance/Wand', 'category' => 'SPR', 'cost' => 12000, 'price' => 20000, 'unit' => 'piece'],

            // Tools & Accessories
            ['code' => 'TLS001', 'barcode' => '8813000001', 'name' => 'Combination Wrench Set', 'category' => 'TLS', 'cost' => 45000, 'price' => 68000, 'unit' => 'set'],
            ['code' => 'TLS002', 'barcode' => '8813000002', 'name' => 'Socket Wrench Set', 'category' => 'TLS', 'cost' => 65000, 'price' => 95000, 'unit' => 'set'],
            ['code' => 'TLS003', 'barcode' => '8813000003', 'name' => 'Grease Gun', 'category' => 'TLS', 'cost' => 18000, 'price' => 28000, 'unit' => 'piece'],
            ['code' => 'TLS004', 'barcode' => '8813000004', 'name' => 'Oil Drain Pan', 'category' => 'TLS', 'cost' => 8000, 'price' => 14000, 'unit' => 'piece'],
            ['code' => 'TLS005', 'barcode' => '8813000005', 'name' => 'Funnel Set', 'category' => 'TLS', 'cost' => 5000, 'price' => 9000, 'unit' => 'set'],
        ];

        foreach ($products as $p) {
            $category = Category::where('code', $p['category'])->first();

            Product::create([
                'code' => $p['code'],
                'barcode' => $p['barcode'],
                'name' => $p['name'],
                'description' => null,
                'category_id' => $category?->id,
                'unit' => $p['unit'],
                'cost_price' => $p['cost'],
                'selling_price' => $p['price'],
                'tax_rate' => 0,
                'low_stock_alert' => 5,
                'is_active' => true,
            ]);
        }
    }
}
