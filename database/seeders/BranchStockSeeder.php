<?php

namespace Database\Seeders;

use App\Models\Branch;
use App\Models\BranchStock;
use App\Models\Product;
use Illuminate\Database\Seeder;

class BranchStockSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $branches = Branch::all();
        $products = Product::all();

        foreach ($branches as $branch) {
            foreach ($products as $product) {
                // Random stock between 20 and 200
                BranchStock::create([
                    'branch_id' => $branch->id,
                    'product_id' => $product->id,
                    'quantity' => rand(20, 200),
                ]);
            }
        }
    }
}
