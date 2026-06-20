<?php

namespace Tests\Feature;

use App\Models\Branch;
use App\Models\BranchStock;
use App\Models\Category;
use App\Models\Group;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class ProductBranchStockTest extends TestCase
{
    use RefreshDatabase;

    #[Test]
    public function product_creation_and_update_saves_to_auth_user_branch_stock()
    {
        // 1. Create two branches
        $branchA = Branch::factory()->create(['name' => 'Branch A', 'is_active' => true]);
        $branchB = Branch::factory()->create(['name' => 'Branch B', 'is_active' => true]);

        // 2. Create a manager user assigned to Branch B (no Spatie roles needed)
        $user = User::factory()->create([
            'branch_id' => $branchB->id,
            'email_verified_at' => now(),
        ]);

        // 3. Create a category (setting parent_id to null prevents infinite factory recursion)
        $category = Category::factory()->create([
            'is_active' => true,
            'parent_id' => null,
        ]);

        // 4. Create two groups manually since GroupFactory doesn't exist
        $group1 = Group::create([
            'branch_id' => $branchB->id,
            'code' => 'GRP-001',
            'name' => 'Group 1',
            'is_active' => true,
        ]);

        $group2 = Group::create([
            'branch_id' => $branchB->id,
            'code' => 'GRP-002',
            'name' => 'Group 2',
            'is_active' => true,
        ]);

        // Authenticate as the manager of Branch B
        $this->actingAs($user);

        // --- SECTION A: STORE TEST ---
        $productData = [
            'code' => 'PRD-TEST-123',
            'barcode' => '9876543210',
            'name' => 'Test Branch Product',
            'description' => 'Test description',
            'category_id' => $category->id,
            'group_id' => $group1->id,
            'unit' => 'pcs',
            'cost_price' => 10.00,
            'selling_price' => 20.00,
            'tax_rate' => 5.00,
            'low_stock_alert' => 5,
            'is_active' => true,
        ];

        $response = $this->post(route('products.store'), $productData);
        $response->assertRedirect(route('products.index'));

        // Verify the product was created in the main products table
        $product = Product::where('code', 'PRD-TEST-123')->first();
        $this->assertNotNull($product);

        // Verify branch stock records were created for both branches
        // Since store loops through all active branches, both Branch A and Branch B should have a stock record
        $stockA = BranchStock::withoutGlobalScope(\App\Models\Scopes\BranchScope::class)
            ->where('product_id', $product->id)
            ->where('branch_id', $branchA->id)
            ->first();

        $stockB = BranchStock::withoutGlobalScope(\App\Models\Scopes\BranchScope::class)
            ->where('product_id', $product->id)
            ->where('branch_id', $branchB->id)
            ->first();

        $this->assertNotNull($stockA, 'Stock record for Branch A should exist');
        $this->assertNotNull($stockB, 'Stock record for Branch B should exist');

        // Verify initial prices and groups were saved to BOTH branch stock records
        $this->assertEquals(10.00, $stockA->cost_price);
        $this->assertEquals(20.00, $stockA->selling_price);
        $this->assertEquals($group1->id, $stockA->group_id);

        $this->assertEquals(10.00, $stockB->cost_price);
        $this->assertEquals(20.00, $stockB->selling_price);
        $this->assertEquals($group1->id, $stockB->group_id);

        // --- SECTION B: UPDATE TEST ---
        // Manager updates the product with new cost, selling price and new group
        $updatedData = array_merge($productData, [
            'cost_price' => 15.00,
            'selling_price' => 25.00,
            'group_id' => $group2->id,
        ]);

        // When updating, since the manager is authenticated and scoped to Branch B,
        // it should only update the BranchStock record of Branch B, and NOT Branch A.
        $response = $this->put(route('products.update', $product), $updatedData);
        $response->assertRedirect(route('products.index'));

        // Refresh stock records
        $stockA->refresh();
        $stockB->refresh();

        // Branch B's stock record should be updated with new prices and group
        $this->assertEquals(15.00, $stockB->cost_price, "Branch B's cost price should be updated to 15.00");
        $this->assertEquals(25.00, $stockB->selling_price, "Branch B's selling price should be updated to 25.00");
        $this->assertEquals($group2->id, $stockB->group_id, "Branch B's group ID should be updated to Group 2");

        // Branch A's stock record should remain UNCHANGED (retaining original values)
        $this->assertEquals(10.00, $stockA->cost_price, "Branch A's cost price should remain unchanged at 10.00");
        $this->assertEquals(20.00, $stockA->selling_price, "Branch A's selling price should remain unchanged at 20.00");
        $this->assertEquals($group1->id, $stockA->group_id, "Branch A's group ID should remain unchanged at Group 1");
    }

    #[Test]
    public function product_update_creates_branch_stock_if_it_does_not_exist_for_user_branch()
    {
        // 1. Create default Branch A and a category
        $branchA = Branch::factory()->create(['name' => 'Branch A', 'is_active' => true]);
        $category = Category::factory()->create(['is_active' => true, 'parent_id' => null]);

        // 2. Create a product (only Branch A exists at this time)
        $product = Product::create([
            'code' => 'PRD-EXISTING',
            'barcode' => '111222333',
            'name' => 'Existing Product',
            'category_id' => $category->id,
            'unit' => 'pcs',
            'cost_price' => 10.00,
            'selling_price' => 20.00,
            'tax_rate' => 0.00,
            'low_stock_alert' => 5,
            'is_active' => true,
        ]);

        // Create Branch A stock record
        $product->branchStocks()->create([
            'branch_id' => $branchA->id,
            'cost_price' => 10.00,
            'selling_price' => 20.00,
            'quantity' => 0,
        ]);

        // 3. Now create new Branch B and a user assigned to it
        $branchB = Branch::factory()->create(['name' => 'Branch B', 'is_active' => true]);
        $user = User::factory()->create([
            'branch_id' => $branchB->id,
            'email_verified_at' => now(),
        ]);

        $group = Group::create([
            'branch_id' => $branchB->id,
            'code' => 'GRP-NEW',
            'name' => 'New Group',
            'is_active' => true,
        ]);

        // 4. Authenticate as the manager of Branch B
        $this->actingAs($user);

        // 5. Update the product
        $updatedData = [
            'code' => 'PRD-EXISTING',
            'name' => 'Existing Product Updated',
            'category_id' => $category->id,
            'group_id' => $group->id,
            'unit' => 'pcs',
            'cost_price' => 15.00,
            'selling_price' => 25.00,
            'tax_rate' => 0.00,
            'low_stock_alert' => 5,
            'is_active' => true,
        ];

        $response = $this->put(route('products.update', $product), $updatedData);
        $response->assertRedirect(route('products.index'));

        // 6. Assert that Branch B's branch stock record has been created and has correct prices and group!
        $stockB = BranchStock::withoutGlobalScope(\App\Models\Scopes\BranchScope::class)
            ->where('product_id', $product->id)
            ->where('branch_id', $branchB->id)
            ->first();

        $this->assertNotNull($stockB, 'Stock record for Branch B should have been created during product update');
        $this->assertEquals(15.00, $stockB->cost_price);
        $this->assertEquals(25.00, $stockB->selling_price);
        $this->assertEquals($group->id, $stockB->group_id);
    }
}
