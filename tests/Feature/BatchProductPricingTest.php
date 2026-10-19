<?php

namespace Tests\Feature;

use App\Models\Branch;
use App\Models\BranchStock;
use App\Models\Category;
use App\Models\Group;
use App\Models\Product;
use App\Models\ProductPriceHistory;
use App\Models\User;
use App\Services\BatchPricingService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use function Pest\Laravel\actingAs;
use function Pest\Laravel\assertDatabaseHas;
use function Pest\Laravel\get;
use function Pest\Laravel\post;

uses(RefreshDatabase::class);

beforeEach(function () {
    config(['project.super_admin' => 'god']);
    Role::findOrCreate('god');
    Permission::findOrCreate('products.view');
    Permission::findOrCreate('products.edit');
});

test('BatchPricingService applies rounding rules correctly', function () {
    $service = app(BatchPricingService::class);

    // Test nearest_50
    expect($service->applyRounding(1024, 'nearest_50'))->toEqual(1000.0)
        ->and($service->applyRounding(1025, 'nearest_50'))->toEqual(1050.0)
        ->and($service->applyRounding(1049, 'nearest_50'))->toEqual(1050.0);

    // Test nearest_100
    expect($service->applyRounding(1049, 'nearest_100'))->toEqual(1000.0)
        ->and($service->applyRounding(1050, 'nearest_100'))->toEqual(1100.0)
        ->and($service->applyRounding(1099, 'nearest_100'))->toEqual(1100.0);

    // Test round_up_100
    expect($service->applyRounding(1001, 'round_up_100'))->toEqual(1100.0)
        ->and($service->applyRounding(1000, 'round_up_100'))->toEqual(1000.0);

    // Test round_down_100
    expect($service->applyRounding(1099, 'round_down_100'))->toEqual(1000.0)
        ->and($service->applyRounding(1100, 'round_down_100'))->toEqual(1100.0);

    // Test none
    expect($service->applyRounding(1234.567, 'none'))->toEqual(1234.57);
});

test('BatchPricingService calculates percentage with rounding accurately', function () {
    $service = app(BatchPricingService::class);

    // +10% on 1000 = 1100
    expect($service->calculateNewPrice(1000.0, 10.0, 'nearest_100'))->toEqual(1100.0);

    // -10% on 1000 = 900
    expect($service->calculateNewPrice(1000.0, -10.0, 'nearest_100'))->toEqual(900.0);

    // +7% on 1000 = 1070 -> nearest 100 = 1100
    expect($service->calculateNewPrice(1000.0, 7.0, 'nearest_100'))->toEqual(1100.0);

    // +7% on 1000 = 1070 -> nearest 50 = 1050
    expect($service->calculateNewPrice(1000.0, 7.0, 'nearest_50'))->toEqual(1050.0);
});

test('authorized users can view batch pricing page', function () {
    $branch = Branch::factory()->create(['is_active' => true]);
    /** @var User $user */
    $user = User::factory()->create([
        'branch_id' => $branch->id,
        'email_verified_at' => now(),
    ]);
    $user->givePermissionTo('products.view');

    actingAs($user);

    $response = get(route('products.batch-pricing.index'));
    $response->assertOk();
});

test('preview endpoint returns total count and maximum 10 sample preview items', function () {
    $branch = Branch::factory()->create(['is_active' => true]);
    /** @var User $user */
    $user = User::factory()->create([
        'branch_id' => $branch->id,
        'email_verified_at' => now(),
    ]);
    $user->givePermissionTo('products.view');

    $category = Category::factory()->create(['is_active' => true]);

    // Create 15 products in category
    for ($i = 1; $i <= 15; $i++) {
        $p = Product::create([
            'code' => "PRD-BATCH-{$i}",
            'name' => "Batch Product {$i}",
            'category_id' => $category->id,
            'unit' => 'pcs',
            'cost_price' => 1000.00,
            'selling_price' => 1500.00,
            'is_active' => true,
        ]);

        BranchStock::withoutGlobalScopes()->create([
            'branch_id' => $branch->id,
            'product_id' => $p->id,
            'cost_price' => 1000.00,
            'selling_price' => 1500.00,
            'quantity' => 10,
        ]);
    }

    actingAs($user);

    $response = post(route('products.batch-pricing.preview'), [
        'branch_id' => (string) $branch->id,
        'scope_type' => 'category',
        'scope_id' => $category->id,
        'target_field' => 'selling_price',
        'percentage' => 10,
        'rounding' => 'nearest_100',
    ]);

    $response->assertOk();
    $data = $response->json();

    expect($data['total_count'])->toEqual(15);
    expect(count($data['sample_items']))->toEqual(10); // limited to 10
    expect($data['sample_items'][0]['current_selling_price'])->toEqual(1500.0);
    expect((float) $data['sample_items'][0]['new_selling_price'])->toEqual(1700.0);
});

test('apply endpoint batch updates branch stock prices and records audit history', function () {
    $branch = Branch::factory()->create(['is_active' => true]);
    /** @var User $user */
    $user = User::factory()->create([
        'branch_id' => $branch->id,
        'email_verified_at' => now(),
    ]);
    $user->givePermissionTo(['products.view', 'products.edit']);

    $category = Category::factory()->create(['is_active' => true]);

    $product1 = Product::create([
        'code' => 'BATCH-TEST-1',
        'name' => 'Widget 1',
        'category_id' => $category->id,
        'cost_price' => 1000.00,
        'selling_price' => 2000.00,
        'is_active' => true,
    ]);

    $product2 = Product::create([
        'code' => 'BATCH-TEST-2',
        'name' => 'Widget 2',
        'category_id' => $category->id,
        'cost_price' => 2000.00,
        'selling_price' => 3000.00,
        'is_active' => true,
    ]);

    BranchStock::withoutGlobalScopes()->create([
        'branch_id' => $branch->id,
        'product_id' => $product1->id,
        'cost_price' => 1000.00,
        'selling_price' => 2000.00,
        'quantity' => 5,
    ]);

    actingAs($user);

    // Increase selling price by 10% with nearest_100
    $response = post(route('products.batch-pricing.apply'), [
        'branch_id' => (string) $branch->id,
        'scope_type' => 'category',
        'scope_id' => $category->id,
        'target_field' => 'selling_price',
        'percentage' => 10,
        'rounding' => 'nearest_100',
        'custom_note' => 'Seasonal markup test',
    ]);

    $response->assertRedirect();
    $response->assertSessionHas('success');

    // Product 1: 2000 * 1.1 = 2200
    $stock1 = BranchStock::withoutGlobalScopes()
        ->where(['branch_id' => $branch->id, 'product_id' => $product1->id])
        ->first();
    expect((float) $stock1->selling_price)->toEqual(2200.0);

    // Product 2 was created without existing branch stock, so applyBatchUpdate creates it!
    $stock2 = BranchStock::withoutGlobalScopes()
        ->where(['branch_id' => $branch->id, 'product_id' => $product2->id])
        ->first();
    expect($stock2)->not->toBeNull();
    // 3000 * 1.1 = 3300
    expect((float) $stock2->selling_price)->toEqual(3300.0);

    // Check product price history records
    expect(ProductPriceHistory::where('change_type', 'batch_pricing')->count())->toBe(2);

    $history1 = ProductPriceHistory::where('product_id', $product1->id)->first();
    expect($history1)->not->toBeNull();
    expect((float) $history1->old_selling_price)->toEqual(2000.0);
    expect((float) $history1->new_selling_price)->toEqual(2200.0);
    expect($history1->reason)->toContain('Seasonal markup test');
    expect($history1->changed_by)->toBe($user->id);
});

test('Super Admin can apply batch pricing across all branches simultaneously', function () {
    $branchA = Branch::factory()->create(['is_active' => true]);
    $branchB = Branch::factory()->create(['is_active' => true]);

    /** @var User $godUser */
    $godUser = User::factory()->create();
    $godUser->assignRole('god');

    $category = Category::factory()->create(['is_active' => true]);

    $product = Product::create([
        'code' => 'MULTI-BRANCH-1',
        'name' => 'Universal Item',
        'category_id' => $category->id,
        'cost_price' => 500.00,
        'selling_price' => 1000.00,
        'is_active' => true,
    ]);

    BranchStock::withoutGlobalScopes()->create([
        'branch_id' => $branchA->id,
        'product_id' => $product->id,
        'cost_price' => 500.00,
        'selling_price' => 1000.00,
        'quantity' => 10,
    ]);

    BranchStock::withoutGlobalScopes()->create([
        'branch_id' => $branchB->id,
        'product_id' => $product->id,
        'cost_price' => 500.00,
        'selling_price' => 1000.00,
        'quantity' => 20,
    ]);

    actingAs($godUser);

    // +20% on both selling and cost price across 'all' branches
    $response = post(route('products.batch-pricing.apply'), [
        'branch_id' => 'all',
        'scope_type' => 'all',
        'target_field' => 'both',
        'percentage' => 20,
        'rounding' => 'nearest_100',
        'custom_note' => 'All branch inflation adjustment',
    ]);

    $response->assertRedirect();

    $stockA = BranchStock::withoutGlobalScopes()
        ->where(['branch_id' => $branchA->id, 'product_id' => $product->id])
        ->first();
    // 500 * 1.2 = 600, 1000 * 1.2 = 1200
    expect((float) $stockA->cost_price)->toEqual(600.0);
    expect((float) $stockA->selling_price)->toEqual(1200.0);

    $stockB = BranchStock::withoutGlobalScopes()
        ->where(['branch_id' => $branchB->id, 'product_id' => $product->id])
        ->first();
    expect((float) $stockB->cost_price)->toEqual(600.0);
    expect((float) $stockB->selling_price)->toEqual(1200.0);

    // Check histories created for both branches
    expect(ProductPriceHistory::where('product_id', $product->id)->count())->toBe(2);
});
