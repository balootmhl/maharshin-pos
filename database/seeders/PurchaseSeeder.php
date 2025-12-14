<?php

namespace Database\Seeders;

use App\Models\Branch;
use App\Models\BranchStock;
use App\Models\Product;
use App\Models\Purchase;
use App\Models\PurchaseItem;
use App\Models\Supplier;
use App\Models\User;
use Illuminate\Database\Seeder;

class PurchaseSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $branch = Branch::first();
        $user = User::first();
        $suppliers = Supplier::all();
        $products = Product::take(10)->get();

        // Create a few sample purchases
        for ($i = 1; $i <= 3; $i++) {
            $supplier = $suppliers->random();
            $purchaseDate = now()->subDays(rand(30, 60));

            $itemsData = [];
            $subtotal = 0;
            $taxAmount = 0;

            // 2-5 items per purchase
            $itemCount = rand(2, 5);
            $selectedProducts = $products->random($itemCount);

            foreach ($selectedProducts as $product) {
                $qty = rand(20, 100);
                $unitCost = $product->cost_price;
                $itemSubtotal = $qty * $unitCost;
                $itemTax = $itemSubtotal * ($product->tax_rate / 100);

                $itemsData[] = [
                    'product' => $product,
                    'quantity' => $qty,
                    'unit_cost' => $unitCost,
                    'tax_rate' => $product->tax_rate,
                    'tax_amount' => $itemTax,
                    'subtotal' => $itemSubtotal,
                ];

                $subtotal += $itemSubtotal;
                $taxAmount += $itemTax;
            }

            $totalAmount = $subtotal + $taxAmount;

            $purchase = Purchase::create([
                'purchase_no' => 'PO-'.str_pad($i, 6, '0', STR_PAD_LEFT),
                'branch_id' => $branch->id,
                'supplier_id' => $supplier->id,
                'purchase_date' => $purchaseDate,
                'subtotal' => $subtotal,
                'tax_amount' => $taxAmount,
                'total_amount' => $totalAmount,
                'payment_status' => 'paid',
                'paid_amount' => $totalAmount,
                'notes' => null,
                'created_by' => $user->id,
            ]);

            // Create purchase items
            foreach ($itemsData as $item) {
                PurchaseItem::create([
                    'purchase_id' => $purchase->id,
                    'product_id' => $item['product']->id,
                    'quantity' => $item['quantity'],
                    'unit_cost' => $item['unit_cost'],
                    'tax_rate' => $item['tax_rate'],
                    'tax_amount' => $item['tax_amount'],
                    'subtotal' => $item['subtotal'],
                ]);

                // Increase stock
                $stock = BranchStock::where('branch_id', $branch->id)
                    ->where('product_id', $item['product']->id)
                    ->first();
                if ($stock) {
                    $stock->increment('quantity', $item['quantity']);
                }
            }
        }
    }
}
