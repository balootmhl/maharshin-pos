<?php

namespace Tests\Feature\Http\Controllers;

use App\Models\Branch;
use App\Models\Purchase;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Illuminate\Support\Carbon;
use JMac\Testing\Traits\AdditionalAssertions;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

/**
 * @see \App\Http\Controllers\PurchaseController
 */
final class PurchaseControllerTest extends TestCase
{
    use AdditionalAssertions, RefreshDatabase, WithFaker;

    #[Test]
    public function index_displays_view(): void
    {
        $purchases = Purchase::factory()->count(3)->create();

        $response = $this->get(route('purchases.index'));

        $response->assertOk();
        $response->assertViewIs('purchase.index');
        $response->assertViewHas('purchases');
    }


    #[Test]
    public function create_displays_view(): void
    {
        $response = $this->get(route('purchases.create'));

        $response->assertOk();
        $response->assertViewIs('purchase.create');
    }


    #[Test]
    public function store_uses_form_request_validation(): void
    {
        $this->assertActionUsesFormRequest(
            \App\Http\Controllers\PurchaseController::class,
            'store',
            \App\Http\Requests\PurchaseStoreRequest::class
        );
    }

    #[Test]
    public function store_saves_and_redirects(): void
    {
        $purchase_no = fake()->word();
        $branch = Branch::factory()->create();
        $purchase_date = Carbon::parse(fake()->date());
        $subtotal = fake()->randomFloat(/** decimal_attributes **/);
        $tax_amount = fake()->randomFloat(/** decimal_attributes **/);
        $total_amount = fake()->randomFloat(/** decimal_attributes **/);
        $payment_status = fake()->word();
        $paid_amount = fake()->randomFloat(/** decimal_attributes **/);
        $creator = User::factory()->create();

        $response = $this->post(route('purchases.store'), [
            'purchase_no' => $purchase_no,
            'branch_id' => $branch->id,
            'purchase_date' => $purchase_date->toDateString(),
            'subtotal' => $subtotal,
            'tax_amount' => $tax_amount,
            'total_amount' => $total_amount,
            'payment_status' => $payment_status,
            'paid_amount' => $paid_amount,
            'creator_id' => $creator->id,
        ]);

        $purchases = Purchase::query()
            ->where('purchase_no', $purchase_no)
            ->where('branch_id', $branch->id)
            ->where('purchase_date', $purchase_date)
            ->where('subtotal', $subtotal)
            ->where('tax_amount', $tax_amount)
            ->where('total_amount', $total_amount)
            ->where('payment_status', $payment_status)
            ->where('paid_amount', $paid_amount)
            ->where('creator_id', $creator->id)
            ->get();
        $this->assertCount(1, $purchases);
        $purchase = $purchases->first();

        $response->assertRedirect(route('purchases.index'));
        $response->assertSessionHas('purchase.id', $purchase->id);
    }


    #[Test]
    public function show_displays_view(): void
    {
        $purchase = Purchase::factory()->create();

        $response = $this->get(route('purchases.show', $purchase));

        $response->assertOk();
        $response->assertViewIs('purchase.show');
        $response->assertViewHas('purchase');
    }


    #[Test]
    public function edit_displays_view(): void
    {
        $purchase = Purchase::factory()->create();

        $response = $this->get(route('purchases.edit', $purchase));

        $response->assertOk();
        $response->assertViewIs('purchase.edit');
        $response->assertViewHas('purchase');
    }


    #[Test]
    public function update_uses_form_request_validation(): void
    {
        $this->assertActionUsesFormRequest(
            \App\Http\Controllers\PurchaseController::class,
            'update',
            \App\Http\Requests\PurchaseUpdateRequest::class
        );
    }

    #[Test]
    public function update_redirects(): void
    {
        $purchase = Purchase::factory()->create();
        $purchase_no = fake()->word();
        $branch = Branch::factory()->create();
        $purchase_date = Carbon::parse(fake()->date());
        $subtotal = fake()->randomFloat(/** decimal_attributes **/);
        $tax_amount = fake()->randomFloat(/** decimal_attributes **/);
        $total_amount = fake()->randomFloat(/** decimal_attributes **/);
        $payment_status = fake()->word();
        $paid_amount = fake()->randomFloat(/** decimal_attributes **/);
        $creator = User::factory()->create();

        $response = $this->put(route('purchases.update', $purchase), [
            'purchase_no' => $purchase_no,
            'branch_id' => $branch->id,
            'purchase_date' => $purchase_date->toDateString(),
            'subtotal' => $subtotal,
            'tax_amount' => $tax_amount,
            'total_amount' => $total_amount,
            'payment_status' => $payment_status,
            'paid_amount' => $paid_amount,
            'creator_id' => $creator->id,
        ]);

        $purchase->refresh();

        $response->assertRedirect(route('purchases.index'));
        $response->assertSessionHas('purchase.id', $purchase->id);

        $this->assertEquals($purchase_no, $purchase->purchase_no);
        $this->assertEquals($branch->id, $purchase->branch_id);
        $this->assertEquals($purchase_date, $purchase->purchase_date);
        $this->assertEquals($subtotal, $purchase->subtotal);
        $this->assertEquals($tax_amount, $purchase->tax_amount);
        $this->assertEquals($total_amount, $purchase->total_amount);
        $this->assertEquals($payment_status, $purchase->payment_status);
        $this->assertEquals($paid_amount, $purchase->paid_amount);
        $this->assertEquals($creator->id, $purchase->creator_id);
    }


    #[Test]
    public function destroy_deletes_and_redirects(): void
    {
        $purchase = Purchase::factory()->create();

        $response = $this->delete(route('purchases.destroy', $purchase));

        $response->assertRedirect(route('purchases.index'));

        $this->assertSoftDeleted($purchase);
    }
}
