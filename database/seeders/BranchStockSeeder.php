<?php

namespace Database\Seeders;

use App\Models\Branch;
use App\Models\BranchStock;
use App\Models\Group;
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
            // Get groups for this branch
            $branchGroups = Group::where('branch_id', $branch->id)->pluck('id')->toArray();

            foreach ($products as $product) {
                // Random stock between 20 and 200
                // Random group assignment (nullable - some products may not have a group)
                $groupId = !empty($branchGroups) && rand(0, 10) > 2
                    ? $branchGroups[array_rand($branchGroups)]
                    : null;

                BranchStock::create([
                    'branch_id' => $branch->id,
                    'product_id' => $product->id,
                    'group_id' => $groupId,
                    'quantity' => rand(20, 200),
                ]);
            }
        }
    }
}
