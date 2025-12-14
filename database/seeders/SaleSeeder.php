<?php

namespace Database\Seeders;

use App\Models\Branch;
use App\Models\BranchStock;
use App\Models\Customer;
use App\Models\Product;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\User;
use Illuminate\Database\Seeder;

class SaleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $branch = Branch::first();
        $user = User::first();
        $products = Product::take(10)->get();
        $customers = Customer::all();

        // Create a few sample sales
        for ($i = 1; $i <= 5; $i++) {
            $customer = rand(0, 1) ? $customers->random() : null;
            $saleDate = now()->subDays(rand(0, 30));

            // Create items first to calculate totals
            $itemsData = [];
            $subtotal = 0;
            $taxAmount = 0;

            // 1-4 items per sale
            $itemCount = rand(1, 4);
            $selectedProducts = $products->random($itemCount);

            foreach ($selectedProducts as $product) {
                $qty = rand(1, 5);
                $unitPrice = $product->selling_price;
                $itemSubtotal = $qty * $unitPrice;
                $itemTax = $itemSubtotal * ($product->tax_rate / 100);

                $itemsData[] = [
                    'product' => $product,
                    'quantity' => $qty,
                    'unit_price' => $unitPrice,
                    'tax_rate' => $product->tax_rate,
                    'tax_amount' => $itemTax,
                    'subtotal' => $itemSubtotal,
                ];

                $subtotal += $itemSubtotal;
                $taxAmount += $itemTax;
            }

            $totalAmount = $subtotal + $taxAmount;
            $paidAmount = $customer ? rand(0, 1) * $totalAmount : $totalAmount;
            $creditAmount = $totalAmount - $paidAmount;
            $paymentStatus = $creditAmount == 0 ? 'paid' : ($paidAmount > 0 ? 'partial' : 'unpaid');

            $sale = Sale::create([
                'invoice_no' => 'INV-'.str_pad($i, 6, '0', STR_PAD_LEFT),
                'branch_id' => $branch->id,
                'customer_id' => $customer?->id,
                'sale_date' => $saleDate,
                'subtotal' => $subtotal,
                'tax_amount' => $taxAmount,
                'discount_amount' => 0,
                'total_amount' => $totalAmount,
                'payment_status' => $paymentStatus,
                'payment_method' => 'Cash',
                'paid_amount' => $paidAmount,
                'credit_amount' => $creditAmount,
                'notes' => null,
                'created_by' => $user->id,
            ]);

            // Create sale items
            foreach ($itemsData as $item) {
                SaleItem::create([
                    'sale_id' => $sale->id,
                    'product_id' => $item['product']->id,
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                    'tax_rate' => $item['tax_rate'],
                    'tax_amount' => $item['tax_amount'],
                    'subtotal' => $item['subtotal'],
                ]);

                // Reduce stock
                $stock = BranchStock::where('branch_id', $branch->id)
                    ->where('product_id', $item['product']->id)
                    ->first();
                if ($stock) {
                    $stock->decrement('quantity', $item['quantity']);
                }
            }
        }
    }
}
