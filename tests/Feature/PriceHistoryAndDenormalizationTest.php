<?php

namespace Tests\Feature;

use App\Models\Branch;
use App\Models\BranchStock;
use App\Models\Category;
use App\Models\Product;
use App\Models\ProductPriceHistory;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\User;
use App\Services\PriceHistoryService;
use App\Services\ReportService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

beforeEach(function () {
    config(['project.super_admin' => 'god']);
    Role::findOrCreate('god');
    Permission::findOrCreate('sales.create');
    Permission::findOrCreate('sales.view');
});

test('completing a sale stores immutable snapshots of cost_price, product_name, product_code, and unit', function () {
    $branch = Branch::factory()->create(['is_active' => true]);
    $user = User::factory()->create([
        'branch_id' => $branch->id,
        'email_verified_at' => now(),
    ]);
    $user->givePermissionTo(['sales.create', 'sales.view']);

    $category = Category::factory()->create(['is_active' => true]);

    $product = Product::create([
        'code' => 'TEST-SNAP-1',
        'barcode' => '999888777',
        'name' => 'Original Snapshot Name',
        'category_id' => $category->id,
        'unit' => 'box',
        'cost_price' => 1000.00,
        'selling_price' => 1500.00,
        'is_active' => true,
    ]);

    $branchStock = BranchStock::withoutGlobalScopes()->create([
        'branch_id' => $branch->id,
        'product_id' => $product->id,
        'quantity' => 100,
        'cost_price' => 1000.00,
        'selling_price' => 1500.00,
    ]);

    $this->actingAs($user);

    $payload = [
        'branch_id' => $branch->id,
        'customer_id' => null,
        'price_type' => 'selling_price',
        'sale_date' => now()->format('Y-m-d'),
        'subtotal' => 1500.00,
        'tax_amount' => 0.00,
        'discount_amount' => 0.00,
        'total_amount' => 1500.00,
        'payment_status' => 'paid',
        'payment_method' => 'cash',
        'paid_amount' => 1500.00,
        'credit_amount' => 0.00,
        'items' => [
            [
                'product_id' => $product->id,
                'quantity' => 1,
                'unit_price' => 1500.00,
                'tax_rate' => 0.00,
                'tax_amount' => 0.00,
                'subtotal' => 1500.00,
            ],
        ],
    ];

    $response = $this->post(route('sales.store'), $payload);
    $response->assertRedirect(route('sales.create'));

    $saleItem = SaleItem::latest('id')->first();
    expect($saleItem)->not->toBeNull()
        ->and((float) $saleItem->cost_price)->toEqual(1000.00)
        ->and($saleItem->product_name)->toBe('Original Snapshot Name')
        ->and($saleItem->product_code)->toBe('TEST-SNAP-1')
        ->and($saleItem->unit)->toBe('box')
        ->and($saleItem->profit)->toEqual(500.00);
});

test('updating product pricing today does NOT retroactively distort past daily profit report', function () {
    $branch = Branch::factory()->create(['is_active' => true]);
    $superAdmin = User::factory()->create([
        'branch_id' => $branch->id,
    ]);
    $superAdmin->assignRole('god');

    $category = Category::factory()->create(['is_active' => true]);

    $product = Product::create([
        'code' => 'PROFIT-TEST-99',
        'name' => 'Historical Widget',
        'category_id' => $category->id,
        'unit' => 'pcs',
        'cost_price' => 1000.00,
        'selling_price' => 1500.00,
        'is_active' => true,
    ]);

    $branchStock = BranchStock::withoutGlobalScopes()->create([
        'branch_id' => $branch->id,
        'product_id' => $product->id,
        'quantity' => 50,
        'cost_price' => 1000.00,
        'selling_price' => 1500.00,
    ]);

    $pastDate = now()->subDays(30)->format('Y-m-d');

    // Create a sale 30 days ago
    $sale = Sale::create([
        'invoice_no' => 'INV-HIST-001',
        'branch_id' => $branch->id,
        'customer_id' => null,
        'price_type' => 'selling_price',
        'sale_date' => $pastDate,
        'subtotal' => 1500.00,
        'tax_amount' => 0,
        'discount_amount' => 0,
        'total_amount' => 1500.00,
        'payment_status' => 'paid',
        'paid_amount' => 1500.00,
        'credit_amount' => 0,
        'created_by' => $superAdmin->id,
    ]);

    SaleItem::create([
        'sale_id' => $sale->id,
        'product_id' => $product->id,
        'product_name' => 'Historical Widget',
        'product_code' => 'PROFIT-TEST-99',
        'unit' => 'pcs',
        'quantity' => 1,
        'unit_price' => 1500.00,
        'cost_price' => 1000.00, // Frozen snapshot!
        'tax_rate' => 0,
        'tax_amount' => 0,
        'subtotal' => 1500.00,
    ]);

    $reportService = app(ReportService::class);

    // Initial check of 30 days ago: Profit should be +500
    $reportBefore = $reportService->getDailyProfitReportData($superAdmin, $pastDate, $branch->id);
    expect($reportBefore['summary']['total_profit'])->toEqual(500.00);

    // TODAY: Massive price increase (Cost price jumps to 2,000, Selling jumps to 2,500)
    $branchStock->update([
        'cost_price' => 2000.00,
        'selling_price' => 2500.00,
    ]);
    $product->update([
        'cost_price' => 2000.00,
        'selling_price' => 2500.00,
    ]);

    // Check report for 30 days ago again: It MUST STILL be +500.00, NOT -500.00!
    $reportAfter = $reportService->getDailyProfitReportData($superAdmin, $pastDate, $branch->id);
    expect($reportAfter['summary']['total_profit'])->toEqual(500.00)
        ->and($reportAfter['invoices'][0]['items'][0]['cost_price'])->toEqual(1000.00)
        ->and($reportAfter['invoices'][0]['items'][0]['item_profit'])->toEqual(500.00);
});

test('PriceHistoryService records price change audit logs when prices change', function () {
    $branch = Branch::factory()->create();
    $user = User::factory()->create();
    $category = Category::factory()->create();

    $product = Product::create([
        'code' => 'AUDIT-1',
        'name' => 'Audit Test Product',
        'category_id' => $category->id,
        'cost_price' => 1000.00,
        'selling_price' => 1500.00,
    ]);

    $service = app(PriceHistoryService::class);

    $history = $service->recordChange(
        productId: $product->id,
        branchId: $branch->id,
        oldCostPrice: 1000.00,
        newCostPrice: 1200.00,
        oldSellingPrice: 1500.00,
        newSellingPrice: 1800.00,
        changeType: 'branch_pricing',
        reason: 'Supplier price hike',
        userId: $user->id
    );

    expect($history)->not->toBeNull();
    expect(ProductPriceHistory::count())->toBe(1);

    $recorded = ProductPriceHistory::first();
    expect((float) $recorded->old_cost_price)->toEqual(1000.00)
        ->and((float) $recorded->new_cost_price)->toEqual(1200.00)
        ->and((float) $recorded->old_selling_price)->toEqual(1500.00)
        ->and((float) $recorded->new_selling_price)->toEqual(1800.00)
        ->and($recorded->change_type)->toBe('branch_pricing')
        ->and($recorded->reason)->toBe('Supplier price hike')
        ->and($recorded->changed_by)->toBe($user->id);
});
