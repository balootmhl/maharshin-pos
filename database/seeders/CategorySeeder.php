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
            ['code' => 'BEV', 'name' => 'Beverages', 'description' => 'Drinks and beverages'],
            ['code' => 'SNK', 'name' => 'Snacks', 'description' => 'Chips, cookies, and snacks'],
            ['code' => 'DRY', 'name' => 'Dairy Products', 'description' => 'Milk, cheese, and dairy items'],
            ['code' => 'FRZ', 'name' => 'Frozen Foods', 'description' => 'Frozen meals and ice cream'],
            ['code' => 'GRC', 'name' => 'Groceries', 'description' => 'Daily grocery items'],
            ['code' => 'HPC', 'name' => 'Health & Personal Care', 'description' => 'Personal care products'],
            ['code' => 'HHD', 'name' => 'Household', 'description' => 'Household cleaning items'],
            ['code' => 'STA', 'name' => 'Stationery', 'description' => 'Office and school supplies'],
        ];

        foreach ($categories as $category) {
            Category::create(array_merge($category, ['is_active' => true]));
        }
    }
}
