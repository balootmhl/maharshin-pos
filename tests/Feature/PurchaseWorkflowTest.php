<?php

namespace Tests\Feature;

use App\Models\Branch;
use App\Models\BranchStock;
use App\Models\Category;
use App\Models\Product;
use App\Models\Purchase;
use App\Models\StockMovement;
use App\Models\Supplier;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('recording a purchase executes inventory increment and stock movement logging', function () {
    // 1. Arrange: Setup branch, user, product, and supplier
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
        'code' => 'PRD-TEST-888',
        'barcode' => '87654321',
        'name' => 'Purchase Product',
        'category_id' => $category->id,
        'unit' => 'pcs',
        'cost_price' => 1000.00,
        'selling_price' => 1500.00,
        'is_active' => true,
    ]);

    // Set initial branch stock to 10
    $branchStock = BranchStock::withoutGlobalScopes()->create([
        'branch_id' => $branch->id,
        'product_id' => $product->id,
        'quantity' => 10,
        'cost_price' => 1000.00,
        'selling_price' => 1500.00,
    ]);

    $supplier = Supplier::factory()->create();

    // Authenticate as the branch user
    $this->actingAs($user);

    // Prepare Purchase Store payload
    $payload = [
        'branch_id' => $branch->id,
        'supplier_id' => $supplier->id,
        'purchase_date' => now()->format('Y-m-d'),
        'subtotal' => 18000.00,      // 20 units * 900
        'tax_amount' => 0.00,
        'total_amount' => 18000.00,
        'payment_status' => 'paid',
        'paid_amount' => 18000.00,
        'notes' => 'Bulk stock replenishing test',
        'items' => [
            [
                'product_id' => $product->id,
                'quantity' => 20,
                'unit_cost' => 900.00,
                'tax_rate' => 0.00,
                'tax_amount' => 0.00,
                'subtotal' => 18000.00,
            ]
        ]
    ];

    // 2. Act: Send POST store request
    $response = $this->post(route('purchases.store'), $payload);

    // 3. Assert redirects to purchases.create
    $response->assertRedirect(route('purchases.create'));
    $response->assertSessionHas('completedPurchase');

    // 4. Assert Purchase and item records exist
    $purchase = Purchase::where('branch_id', $branch->id)->latest()->first();
    expect($purchase)->not->toBeNull();
    expect($purchase->purchase_no)->toStartWith('PO-');
    expect($purchase->total_amount)->toEqual(18000.00);

    $this->assertDatabaseHas('purchase_items', [
        'purchase_id' => $purchase->id,
        'product_id' => $product->id,
        'quantity' => 20,
        'unit_cost' => 900.00,
    ]);

    // 5. Assert Branch Stock quantity increases correctly (10 + 20 = 30)
    $updatedBranchStock = BranchStock::withoutGlobalScopes()
        ->where(['branch_id' => $branch->id, 'product_id' => $product->id])
        ->first();
    expect($updatedBranchStock->quantity)->toEqual(30);

    // 6. Assert Stock Movement is correctly logged with positive quantity
    $this->assertDatabaseHas('stock_movements', [
        'branch_id' => $branch->id,
        'product_id' => $product->id,
        'movement_type' => 'purchase',
        'quantity' => 20,
        'quantity_before' => 10,
        'quantity_after' => 30,
        'reference_type' => Purchase::class,
        'reference_id' => $purchase->id,
    ]);
});
