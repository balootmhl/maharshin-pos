<?php

namespace Tests\Feature;

use App\Models\Branch;
use App\Models\Category;
use App\Models\Customer;
use App\Models\Group;
use App\Models\Product;
use App\Models\Sale;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class MultiBranchSecurityTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Setup super admin role name
        config(['project.super_admin' => 'god']);
        Role::findOrCreate('god');
        Role::findOrCreate('manager');
    }

    public function test_non_god_user_can_only_see_sales_from_their_own_branch()
    {
        $this->withoutExceptionHandling();

        // 1. Create two branches
        $branchA = Branch::factory()->create(['is_active' => true]);
        $branchB = Branch::factory()->create(['is_active' => true]);

        // 2. Create users
        /** @var User $managerA */
        $managerA = User::factory()->create([
            'branch_id' => $branchA->id,
        ]);
        $managerA->assignRole('manager');

        /** @var User $godUser */
        $godUser = User::factory()->create([
            'branch_id' => null,
        ]);
        $godUser->assignRole('god');

        // 3. Create sales for both branches (using withoutGlobalScopes or direct DB insertion to bypass constraints if needed)
        // Actually, just acting as manager of each branch to save sales, or bypass scope
        Sale::withoutEvents(function () use ($branchA, $branchB, $managerA) {
            Sale::create([
                'invoice_no' => 'INV-A001',
                'branch_id' => $branchA->id,
                'sale_date' => now()->toDateString(),
                'subtotal' => 100,
                'tax_amount' => 5,
                'discount_amount' => 0,
                'total_amount' => 105,
                'payment_status' => 'paid',
                'paid_amount' => 105,
                'credit_amount' => 0,
                'created_by' => $managerA->id,
            ]);

            Sale::create([
                'invoice_no' => 'INV-B001',
                'branch_id' => $branchB->id,
                'sale_date' => now()->toDateString(),
                'subtotal' => 200,
                'tax_amount' => 10,
                'discount_amount' => 0,
                'total_amount' => 210,
                'payment_status' => 'paid',
                'paid_amount' => 210,
                'credit_amount' => 0,
                'created_by' => $managerA->id,
            ]);
        });

        // 4. Act as Manager A - should only see Sale from Branch A
        $this->actingAs($managerA);
        $response = $this->get(route('sales.index'));
        $response->assertOk();
        
        $salesList = $response->original->getData()['page']['props']['sales']['data'] ?? $response->original->getData()['page']['props']['sales'];
        $this->assertCount(1, $salesList);
        $this->assertEquals('INV-A001', $salesList[0]['invoice_no']);

        // 5. Act as God User - should see both sales
        $this->actingAs($godUser);
        $response = $this->get(route('sales.index'));
        $response->assertOk();
        
        $salesList = $response->original->getData()['page']['props']['sales']['data'] ?? $response->original->getData()['page']['props']['sales'];
        $this->assertCount(2, $salesList);
    }

    public function test_non_god_user_sales_creation_overrides_submitted_branch_id_with_their_own()
    {
        $this->withoutExceptionHandling();

        $branchA = Branch::factory()->create(['is_active' => true]);
        $branchB = Branch::factory()->create(['is_active' => true]);

        /** @var User $managerA */
        $managerA = User::factory()->create([
            'branch_id' => $branchA->id,
        ]);
        $managerA->assignRole('manager');

        $category = Category::factory()->create(['is_active' => true, 'parent_id' => null]);
        $product = Product::create([
            'code' => 'PRD-TEST-ABC',
            'barcode' => '123456789',
            'name' => 'Test Product',
            'category_id' => $category->id,
            'unit' => 'pcs',
            'cost_price' => 10.00,
            'selling_price' => 20.00,
            'tax_rate' => 0.00,
            'low_stock_alert' => 5,
            'is_active' => true,
        ]);

        $this->actingAs($managerA);

        // Try to submit a sale for Branch B
        $saleData = [
            'branch_id' => $branchB->id, // Submitting branch B
            'customer_id' => null,
            'price_type' => 'selling_price',
            'sale_date' => now()->toDateString(),
            'subtotal' => 100,
            'tax_amount' => 0,
            'discount_amount' => 0,
            'total_amount' => 100,
            'payment_status' => 'paid',
            'paid_amount' => 100,
            'credit_amount' => 0,
            'items' => [
                [
                    'product_id' => $product->id,
                    'quantity' => 1,
                    'unit_price' => 100,
                    'tax_rate' => 0,
                    'tax_amount' => 0,
                    'subtotal' => 100,
                ]
            ]
        ];

        $response = $this->post(route('sales.store'), $saleData);
        $response->assertRedirect(route('sales.create'));

        // Assert that the sale was saved under Branch A instead of B
        $sale = Sale::withoutGlobalScopes()->where('invoice_no', 'like', 'INV-%')->first();
        $this->assertNotNull($sale);
        $this->assertEquals($branchA->id, $sale->branch_id, "The saved branch_id should be Branch A, overriding the submitted Branch B.");
    }

    public function test_daily_profit_report_is_restricted_by_branch_for_non_god_users()
    {
        $this->withoutExceptionHandling();

        $branchA = Branch::factory()->create(['is_active' => true]);
        $branchB = Branch::factory()->create(['is_active' => true]);

        /** @var User $managerA */
        $managerA = User::factory()->create([
            'branch_id' => $branchA->id,
        ]);
        $managerA->assignRole('manager');

        /** @var User $godUser */
        $godUser = User::factory()->create([
            'branch_id' => null,
        ]);
        $godUser->assignRole('god');

        // Create a sale for Branch A and a sale for Branch B
        Sale::withoutEvents(function () use ($branchA, $branchB, $managerA) {
            Sale::create([
                'invoice_no' => 'INV-A001',
                'branch_id' => $branchA->id,
                'sale_date' => now()->toDateString(),
                'subtotal' => 100,
                'tax_amount' => 0,
                'discount_amount' => 0,
                'total_amount' => 100,
                'payment_status' => 'paid',
                'paid_amount' => 100,
                'credit_amount' => 0,
                'created_by' => $managerA->id,
            ]);

            Sale::create([
                'invoice_no' => 'INV-B001',
                'branch_id' => $branchB->id,
                'sale_date' => now()->toDateString(),
                'subtotal' => 200,
                'tax_amount' => 0,
                'discount_amount' => 0,
                'total_amount' => 200,
                'payment_status' => 'paid',
                'paid_amount' => 200,
                'credit_amount' => 0,
                'created_by' => $managerA->id,
            ]);
        });

        // 1. Act as Manager A - should see only Branch A sale data in report
        $this->actingAs($managerA);
        $response = $this->get(route('reports.daily-profit'));
        $response->assertOk();

        $pageProps = $response->original->getData()['page']['props'];
        $invoices = $pageProps['invoices'];
        $branchesProp = $pageProps['branches'];

        // Manager A should only see 1 branch in the selection list
        $this->assertCount(1, $branchesProp);
        $this->assertEquals($branchA->id, $branchesProp[0]['id']);

        // Manager A should only see Branch A's sale
        $this->assertCount(1, $invoices);
        $this->assertEquals('INV-A001', $invoices[0]['invoice_no']);

        // Try to query Branch B's data - should still be restricted to Branch A
        $responseWithFilter = $this->get(route('reports.daily-profit', ['branch_id' => $branchB->id]));
        $responseWithFilter->assertOk();
        $filteredPageProps = $responseWithFilter->original->getData()['page']['props'];
        $filteredInvoices = $filteredPageProps['invoices'];
        $this->assertCount(1, $filteredInvoices);
        $this->assertEquals('INV-A001', $filteredInvoices[0]['invoice_no']);

        // 2. Act as God User - should see all active branches in the list, and can view all or specific branch data
        $this->actingAs($godUser);
        $responseGod = $this->get(route('reports.daily-profit'));
        $responseGod->assertOk();

        $godProps = $responseGod->original->getData()['page']['props'];
        $godBranchesProp = $godProps['branches'];
        $godInvoices = $godProps['invoices'];

        // God user should see all active branches
        $this->assertCount(2, $godBranchesProp);

        // Without branch filter, should see both sales
        $this->assertCount(2, $godInvoices);

        // Filtering by Branch B should show only Branch B's sale
        $responseGodWithFilter = $this->get(route('reports.daily-profit', ['branch_id' => $branchB->id]));
        $responseGodWithFilter->assertOk();
        $godFilteredProps = $responseGodWithFilter->original->getData()['page']['props'];
        $godFilteredInvoices = $godFilteredProps['invoices'];
        $this->assertCount(1, $godFilteredInvoices);
        $this->assertEquals('INV-B001', $godFilteredInvoices[0]['invoice_no']);
    }
}
