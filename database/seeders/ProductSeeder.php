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
            // Beverages
            ['code' => 'BEV001', 'barcode' => '4800000001', 'name' => 'Coca Cola 500ml', 'category' => 'BEV', 'cost' => 350, 'price' => 500, 'unit' => 'bottle'],
            ['code' => 'BEV002', 'barcode' => '4800000002', 'name' => 'Pepsi 500ml', 'category' => 'BEV', 'cost' => 350, 'price' => 500, 'unit' => 'bottle'],
            ['code' => 'BEV003', 'barcode' => '4800000003', 'name' => 'Sprite 500ml', 'category' => 'BEV', 'cost' => 350, 'price' => 500, 'unit' => 'bottle'],
            ['code' => 'BEV004', 'barcode' => '4800000004', 'name' => 'Red Bull Energy Drink', 'category' => 'BEV', 'cost' => 800, 'price' => 1200, 'unit' => 'can'],
            ['code' => 'BEV005', 'barcode' => '4800000005', 'name' => 'Green Tea 350ml', 'category' => 'BEV', 'cost' => 400, 'price' => 600, 'unit' => 'bottle'],

            // Snacks
            ['code' => 'SNK001', 'barcode' => '4800000011', 'name' => 'Lay\'s Classic Chips', 'category' => 'SNK', 'cost' => 800, 'price' => 1200, 'unit' => 'pack'],
            ['code' => 'SNK002', 'barcode' => '4800000012', 'name' => 'Pringles Original', 'category' => 'SNK', 'cost' => 2000, 'price' => 3000, 'unit' => 'can'],
            ['code' => 'SNK003', 'barcode' => '4800000013', 'name' => 'Oreo Cookies', 'category' => 'SNK', 'cost' => 700, 'price' => 1000, 'unit' => 'pack'],
            ['code' => 'SNK004', 'barcode' => '4800000014', 'name' => 'KitKat Chocolate', 'category' => 'SNK', 'cost' => 500, 'price' => 800, 'unit' => 'piece'],

            // Dairy
            ['code' => 'DRY001', 'barcode' => '4800000021', 'name' => 'Fresh Milk 1L', 'category' => 'DRY', 'cost' => 2000, 'price' => 2800, 'unit' => 'bottle'],
            ['code' => 'DRY002', 'barcode' => '4800000022', 'name' => 'Cheese Slice Pack', 'category' => 'DRY', 'cost' => 3000, 'price' => 4500, 'unit' => 'pack'],
            ['code' => 'DRY003', 'barcode' => '4800000023', 'name' => 'Yogurt Cup', 'category' => 'DRY', 'cost' => 600, 'price' => 900, 'unit' => 'cup'],

            // Groceries
            ['code' => 'GRC001', 'barcode' => '4800000031', 'name' => 'Rice 5kg', 'category' => 'GRC', 'cost' => 8000, 'price' => 10000, 'unit' => 'bag'],
            ['code' => 'GRC002', 'barcode' => '4800000032', 'name' => 'Cooking Oil 1L', 'category' => 'GRC', 'cost' => 4000, 'price' => 5500, 'unit' => 'bottle'],
            ['code' => 'GRC003', 'barcode' => '4800000033', 'name' => 'Sugar 1kg', 'category' => 'GRC', 'cost' => 1500, 'price' => 2000, 'unit' => 'pack'],
            ['code' => 'GRC004', 'barcode' => '4800000034', 'name' => 'Salt 500g', 'category' => 'GRC', 'cost' => 300, 'price' => 500, 'unit' => 'pack'],
            ['code' => 'GRC005', 'barcode' => '4800000035', 'name' => 'Instant Noodles Pack', 'category' => 'GRC', 'cost' => 200, 'price' => 350, 'unit' => 'pack'],

            // Household
            ['code' => 'HHD001', 'barcode' => '4800000041', 'name' => 'Dish Soap 500ml', 'category' => 'HHD', 'cost' => 1500, 'price' => 2200, 'unit' => 'bottle'],
            ['code' => 'HHD002', 'barcode' => '4800000042', 'name' => 'Laundry Detergent 1kg', 'category' => 'HHD', 'cost' => 3500, 'price' => 5000, 'unit' => 'pack'],
            ['code' => 'HHD003', 'barcode' => '4800000043', 'name' => 'Toilet Paper 12 Roll', 'category' => 'HHD', 'cost' => 4000, 'price' => 5500, 'unit' => 'pack'],
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
                'low_stock_alert' => 10,
                'is_active' => true,
            ]);
        }
    }
}
