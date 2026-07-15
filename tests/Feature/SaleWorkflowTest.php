<?php

namespace Tests\Feature;

use App\Models\Branch;
use App\Models\BranchStock;
use App\Models\Category;
use App\Models\Customer;
use App\Models\CustomerCreditLedger;
use App\Models\Product;
use App\Models\Sale;
use App\Models\StockMovement;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('completing a POS sale executes inventory deduction, stock movement logging, and credit ledger records', function () {
    // 1. Arrange: Setup branch, user, product, and customer
    $branch = Branch::factory()->create(['is_active' => true]);
    $user = User::factory()->create([
        'branch_id' => $branch->id,
        'email_verified_at' => now(),
    ]);

    $category = Category::factory()->create([
        'is_active' => true,
        'parent_id' => null,
    ]);

    $product = Product::create([
        'code' => 'PRD-TEST-999',
        'barcode' => '12345678',
        'name' => 'Test Product',
        'category_id' => $category->id,
        'unit' => 'pcs',
        'cost_price' => 1000.00,
        'selling_price' => 1500.00,
        'is_active' => true,
    ]);

    // Create initial stock of 50 units for the product in this branch
    $branchStock = BranchStock::withoutGlobalScopes()->create([
        'branch_id' => $branch->id,
        'product_id' => $product->id,
        'quantity' => 50,
        'cost_price' => 1000.00,
        'selling_price' => 1500.00,
    ]);

    $customer = Customer::factory()->create([
        'current_balance' => 0.00,
    ]);

    // Authenticate as the branch user
    $this->actingAs($user);

    // Prepare Sale Store Request Payload (Partial payment with credit amount)
    $payload = [
        'branch_id' => $branch->id,
        'customer_id' => $customer->id,
        'price_type' => 'selling_price',
        'sale_date' => now()->format('Y-m-d'),
        'subtotal' => 7500.00,      // 5 units * 1500
        'tax_amount' => 0.00,
        'discount_amount' => 500.00,
        'total_amount' => 7000.00,   // subtotal + tax - discount
        'payment_status' => 'partial',
        'payment_method' => 'Cash',
        'paid_amount' => 4000.00,
        'credit_amount' => 3000.00,   // total_amount - paid_amount
        'notes' => 'Partial credit sale test',
        'items' => [
            [
                'product_id' => $product->id,
                'quantity' => 5,
                'unit_price' => 1500.00,
                'tax_rate' => 0.00,
                'tax_amount' => 0.00,
                'subtotal' => 7500.00,
            ]
        ]
    ];

    // 2. Act: Send POST store request
    $response = $this->post(route('sales.store'), $payload);

    // 3. Assert Response Redirects
    $response->assertRedirect(route('sales.create'));
    $response->assertSessionHas('completedSale');

    // 4. Assert Sale and items are created
    $sale = Sale::where('branch_id', $branch->id)->latest()->first();
    expect($sale)->not->toBeNull();
    expect($sale->invoice_no)->toStartWith('INV-');
    expect($sale->total_amount)->toEqual(7000.00);

    $this->assertDatabaseHas('sale_items', [
        'sale_id' => $sale->id,
        'product_id' => $product->id,
        'quantity' => 5,
        'unit_price' => 1500.00,
    ]);

    // 5. Assert Branch Stock quantity is decremented correctly (50 - 5 = 45)
    $updatedBranchStock = BranchStock::withoutGlobalScopes()
        ->where(['branch_id' => $branch->id, 'product_id' => $product->id])
        ->first();
    expect($updatedBranchStock->quantity)->toEqual(45);

    // 6. Assert Stock Movement is correctly logged
    $this->assertDatabaseHas('stock_movements', [
        'branch_id' => $branch->id,
        'product_id' => $product->id,
        'movement_type' => 'sale',
        'quantity' => -5,
        'quantity_before' => 50,
        'quantity_after' => 45,
        'reference_type' => Sale::class,
        'reference_id' => $sale->id,
    ]);

    // 7. Assert Customer Current Balance increases by credit amount (3000)
    $updatedCustomer = $customer->fresh();
    expect($updatedCustomer->current_balance)->toEqual(3000.00);

    // 8. Assert Customer Credit Ledger record exists
    $this->assertDatabaseHas('customer_credit_ledgers', [
        'customer_id' => $customer->id,
        'branch_id' => $branch->id,
        'transaction_type' => 'credit',
        'reference_type' => Sale::class,
        'reference_id' => $sale->id,
        'debit' => 3000.00,
        'credit' => 0.00,
        'balance' => 3000.00,
    ]);
});
