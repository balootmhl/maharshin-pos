<?php

namespace Tests\Feature\Http\Controllers;

use App\Models\Branch;
use App\Models\Sale;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Illuminate\Support\Carbon;
use JMac\Testing\Traits\AdditionalAssertions;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

/**
 * @see \App\Http\Controllers\SaleController
 */
final class SaleControllerTest extends TestCase
{
    use AdditionalAssertions, RefreshDatabase, WithFaker;

    #[Test]
    public function index_displays_view(): void
    {
        $sales = Sale::factory()->count(3)->create();

        $response = $this->get(route('sales.index'));

        $response->assertOk();
        $response->assertViewIs('sale.index');
        $response->assertViewHas('sales');
    }


    #[Test]
    public function create_displays_view(): void
    {
        $response = $this->get(route('sales.create'));

        $response->assertOk();
        $response->assertViewIs('sale.create');
    }


    #[Test]
    public function store_uses_form_request_validation(): void
    {
        $this->assertActionUsesFormRequest(
            \App\Http\Controllers\SaleController::class,
            'store',
            \App\Http\Requests\SaleStoreRequest::class
        );
    }

    #[Test]
    public function store_saves_and_redirects(): void
    {
        $invoice_no = fake()->word();
        $branch = Branch::factory()->create();
        $sale_date = Carbon::parse(fake()->date());
        $subtotal = fake()->randomFloat(/** decimal_attributes **/);
        $tax_amount = fake()->randomFloat(/** decimal_attributes **/);
        $discount_amount = fake()->randomFloat(/** decimal_attributes **/);
        $total_amount = fake()->randomFloat(/** decimal_attributes **/);
        $payment_status = fake()->word();
        $paid_amount = fake()->randomFloat(/** decimal_attributes **/);
        $credit_amount = fake()->randomFloat(/** decimal_attributes **/);
        $creator = User::factory()->create();

        $response = $this->post(route('sales.store'), [
            'invoice_no' => $invoice_no,
            'branch_id' => $branch->id,
            'sale_date' => $sale_date->toDateString(),
            'subtotal' => $subtotal,
            'tax_amount' => $tax_amount,
            'discount_amount' => $discount_amount,
            'total_amount' => $total_amount,
            'payment_status' => $payment_status,
            'paid_amount' => $paid_amount,
            'credit_amount' => $credit_amount,
            'creator_id' => $creator->id,
        ]);

        $sales = Sale::query()
            ->where('invoice_no', $invoice_no)
            ->where('branch_id', $branch->id)
            ->where('sale_date', $sale_date)
            ->where('subtotal', $subtotal)
            ->where('tax_amount', $tax_amount)
            ->where('discount_amount', $discount_amount)
            ->where('total_amount', $total_amount)
            ->where('payment_status', $payment_status)
            ->where('paid_amount', $paid_amount)
            ->where('credit_amount', $credit_amount)
            ->where('creator_id', $creator->id)
            ->get();
        $this->assertCount(1, $sales);
        $sale = $sales->first();

        $response->assertRedirect(route('sales.index'));
        $response->assertSessionHas('sale.id', $sale->id);
    }


    #[Test]
    public function show_displays_view(): void
    {
        $sale = Sale::factory()->create();

        $response = $this->get(route('sales.show', $sale));

        $response->assertOk();
        $response->assertViewIs('sale.show');
        $response->assertViewHas('sale');
    }


    #[Test]
    public function edit_displays_view(): void
    {
        $sale = Sale::factory()->create();

        $response = $this->get(route('sales.edit', $sale));

        $response->assertOk();
        $response->assertViewIs('sale.edit');
        $response->assertViewHas('sale');
    }


    #[Test]
    public function update_uses_form_request_validation(): void
    {
        $this->assertActionUsesFormRequest(
            \App\Http\Controllers\SaleController::class,
            'update',
            \App\Http\Requests\SaleUpdateRequest::class
        );
    }

    #[Test]
    public function update_redirects(): void
    {
        $sale = Sale::factory()->create();
        $invoice_no = fake()->word();
        $branch = Branch::factory()->create();
        $sale_date = Carbon::parse(fake()->date());
        $subtotal = fake()->randomFloat(/** decimal_attributes **/);
        $tax_amount = fake()->randomFloat(/** decimal_attributes **/);
        $discount_amount = fake()->randomFloat(/** decimal_attributes **/);
        $total_amount = fake()->randomFloat(/** decimal_attributes **/);
        $payment_status = fake()->word();
        $paid_amount = fake()->randomFloat(/** decimal_attributes **/);
        $credit_amount = fake()->randomFloat(/** decimal_attributes **/);
        $creator = User::factory()->create();

        $response = $this->put(route('sales.update', $sale), [
            'invoice_no' => $invoice_no,
            'branch_id' => $branch->id,
            'sale_date' => $sale_date->toDateString(),
            'subtotal' => $subtotal,
            'tax_amount' => $tax_amount,
            'discount_amount' => $discount_amount,
            'total_amount' => $total_amount,
            'payment_status' => $payment_status,
            'paid_amount' => $paid_amount,
            'credit_amount' => $credit_amount,
            'creator_id' => $creator->id,
        ]);

        $sale->refresh();

        $response->assertRedirect(route('sales.index'));
        $response->assertSessionHas('sale.id', $sale->id);

        $this->assertEquals($invoice_no, $sale->invoice_no);
        $this->assertEquals($branch->id, $sale->branch_id);
        $this->assertEquals($sale_date, $sale->sale_date);
        $this->assertEquals($subtotal, $sale->subtotal);
        $this->assertEquals($tax_amount, $sale->tax_amount);
        $this->assertEquals($discount_amount, $sale->discount_amount);
        $this->assertEquals($total_amount, $sale->total_amount);
        $this->assertEquals($payment_status, $sale->payment_status);
        $this->assertEquals($paid_amount, $sale->paid_amount);
        $this->assertEquals($credit_amount, $sale->credit_amount);
        $this->assertEquals($creator->id, $sale->creator_id);
    }


    #[Test]
    public function destroy_deletes_and_redirects(): void
    {
        $sale = Sale::factory()->create();

        $response = $this->delete(route('sales.destroy', $sale));

        $response->assertRedirect(route('sales.index'));

        $this->assertSoftDeleted($sale);
    }
}
