<?php

namespace Database\Seeders;

use App\Models\Branch;
use App\Models\BranchStock;
use App\Models\Category;
use App\Models\Group;
use App\Models\Product;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ProductImportSeeder extends Seeder
{
    public function run(): void
    {
        $jsonPath = database_path('data/products.json');

        if (!file_exists($jsonPath)) {
            $this->command->error("Product data file not found: {$jsonPath}");
            $this->command->info("Run 'php artisan import:excel-to-json <excel-file>' first.");
            return;
        }

        $products = json_decode(file_get_contents($jsonPath), true);
        $this->command->info("Importing " . count($products) . " products...");

        // Get the first (and currently only) branch
        $branch = Branch::first();
        if (!$branch) {
            $this->command->error("No branch found. Run BranchSeeder first.");
            return;
        }

        DB::transaction(function () use ($products, $branch) {
            $categoryCache = [];
            $groupCache = [];
            $codeCount = []; // Track duplicate codes
            $bar = $this->command->getOutput()->createProgressBar(count($products));

            foreach ($products as $item) {
                // 1. Create/find Category
                $categoryName = trim($item['category_name']);
                if (!empty($categoryName) && !isset($categoryCache[$categoryName])) {
                    $category = Category::firstOrCreate(
                        ['name' => $categoryName],
                        ['code' => $categoryName, 'is_active' => true]
                    );
                    $categoryCache[$categoryName] = $category->id;
                }
                $categoryId = $categoryCache[$categoryName] ?? null;

                // 2. Create Product (append suffix for duplicate codes)
                $originalCode = $item['code'];
                if (!isset($codeCount[$originalCode])) {
                    $codeCount[$originalCode] = 0;
                }
                $codeCount[$originalCode]++;

                $code = $codeCount[$originalCode] === 1
                    ? $originalCode
                    : $originalCode . '-' . ($codeCount[$originalCode] - 1);

                $product = Product::create([
                    'code' => $code,
                    'name' => $item['name'],
                    'category_id' => $categoryId,
                    'cost_price' => $item['buy_price'],
                    'selling_price' => $item['sale_price'],
                    'is_active' => true,
                ]);

                // 3. Create/find Group (if present)
                $groupId = null;
                $groupCode = trim($item['group'] ?? '');
                if (!empty($groupCode)) {
                    if (!isset($groupCache[$groupCode])) {
                        $group = Group::withoutGlobalScopes()->firstOrCreate(
                            ['code' => $groupCode, 'branch_id' => $branch->id],
                            ['name' => $groupCode, 'is_active' => true]
                        );
                        $groupCache[$groupCode] = $group->id;
                    }
                    $groupId = $groupCache[$groupCode];
                }

                // 4. Create BranchStock
                BranchStock::withoutGlobalScopes()->firstOrCreate(
                    [
                        'product_id' => $product->id,
                        'branch_id' => $branch->id,
                    ],
                    [
                        'group_id' => $groupId,
                        'quantity' => $item['quantity'] ?? 0,
                        'cost_price' => $item['buy_price'],
                        'selling_price' => $item['sale_price'],
                    ]
                );

                $bar->advance();
            }

            $bar->finish();
            $this->command->newLine(2);
        });

        // Summary
        $this->command->info("Import complete!");
        $this->command->info("  Categories: " . Category::count());
        $this->command->info("  Products:   " . Product::count());
        $this->command->info("  Groups:     " . Group::withoutGlobalScopes()->count());
        $this->command->info("  Stock entries: " . BranchStock::withoutGlobalScopes()->count());
    }
}
