<?php

namespace Tests\Feature\Http\Controllers;

use App\Models\Branch;
use App\Models\Sale;
use App\Models\SaleReturn;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Illuminate\Support\Carbon;
use JMac\Testing\Traits\AdditionalAssertions;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

/**
 * @see \App\Http\Controllers\SaleReturnController
 */
final class SaleReturnControllerTest extends TestCase
{
    use AdditionalAssertions, RefreshDatabase, WithFaker;

    #[Test]
    public function index_displays_view(): void
    {
        $saleReturns = SaleReturn::factory()->count(3)->create();

        $response = $this->get(route('sale-returns.index'));

        $response->assertOk();
        $response->assertViewIs('saleReturn.index');
        $response->assertViewHas('saleReturns');
    }


    #[Test]
    public function create_displays_view(): void
    {
        $response = $this->get(route('sale-returns.create'));

        $response->assertOk();
        $response->assertViewIs('saleReturn.create');
    }


    #[Test]
    public function store_uses_form_request_validation(): void
    {
        $this->assertActionUsesFormRequest(
            \App\Http\Controllers\SaleReturnController::class,
            'store',
            \App\Http\Requests\SaleReturnStoreRequest::class
        );
    }

    #[Test]
    public function store_saves_and_redirects(): void
    {
        $return_no = fake()->word();
        $sale = Sale::factory()->create();
        $branch = Branch::factory()->create();
        $return_date = Carbon::parse(fake()->date());
        $total_amount = fake()->randomFloat(/** decimal_attributes **/);
        $refund_amount = fake()->randomFloat(/** decimal_attributes **/);
        $creator = User::factory()->create();

        $response = $this->post(route('sale-returns.store'), [
            'return_no' => $return_no,
            'sale_id' => $sale->id,
            'branch_id' => $branch->id,
            'return_date' => $return_date->toDateString(),
            'total_amount' => $total_amount,
            'refund_amount' => $refund_amount,
            'creator_id' => $creator->id,
        ]);

        $saleReturns = SaleReturn::query()
            ->where('return_no', $return_no)
            ->where('sale_id', $sale->id)
            ->where('branch_id', $branch->id)
            ->where('return_date', $return_date)
            ->where('total_amount', $total_amount)
            ->where('refund_amount', $refund_amount)
            ->where('creator_id', $creator->id)
            ->get();
        $this->assertCount(1, $saleReturns);
        $saleReturn = $saleReturns->first();

        $response->assertRedirect(route('saleReturns.index'));
        $response->assertSessionHas('saleReturn.id', $saleReturn->id);
    }


    #[Test]
    public function show_displays_view(): void
    {
        $saleReturn = SaleReturn::factory()->create();

        $response = $this->get(route('sale-returns.show', $saleReturn));

        $response->assertOk();
        $response->assertViewIs('saleReturn.show');
        $response->assertViewHas('saleReturn');
    }


    #[Test]
    public function edit_displays_view(): void
    {
        $saleReturn = SaleReturn::factory()->create();

        $response = $this->get(route('sale-returns.edit', $saleReturn));

        $response->assertOk();
        $response->assertViewIs('saleReturn.edit');
        $response->assertViewHas('saleReturn');
    }


    #[Test]
    public function update_uses_form_request_validation(): void
    {
        $this->assertActionUsesFormRequest(
            \App\Http\Controllers\SaleReturnController::class,
            'update',
            \App\Http\Requests\SaleReturnUpdateRequest::class
        );
    }

    #[Test]
    public function update_redirects(): void
    {
        $saleReturn = SaleReturn::factory()->create();
        $return_no = fake()->word();
        $sale = Sale::factory()->create();
        $branch = Branch::factory()->create();
        $return_date = Carbon::parse(fake()->date());
        $total_amount = fake()->randomFloat(/** decimal_attributes **/);
        $refund_amount = fake()->randomFloat(/** decimal_attributes **/);
        $creator = User::factory()->create();

        $response = $this->put(route('sale-returns.update', $saleReturn), [
            'return_no' => $return_no,
            'sale_id' => $sale->id,
            'branch_id' => $branch->id,
            'return_date' => $return_date->toDateString(),
            'total_amount' => $total_amount,
            'refund_amount' => $refund_amount,
            'creator_id' => $creator->id,
        ]);

        $saleReturn->refresh();

        $response->assertRedirect(route('saleReturns.index'));
        $response->assertSessionHas('saleReturn.id', $saleReturn->id);

        $this->assertEquals($return_no, $saleReturn->return_no);
        $this->assertEquals($sale->id, $saleReturn->sale_id);
        $this->assertEquals($branch->id, $saleReturn->branch_id);
        $this->assertEquals($return_date, $saleReturn->return_date);
        $this->assertEquals($total_amount, $saleReturn->total_amount);
        $this->assertEquals($refund_amount, $saleReturn->refund_amount);
        $this->assertEquals($creator->id, $saleReturn->creator_id);
    }


    #[Test]
    public function destroy_deletes_and_redirects(): void
    {
        $saleReturn = SaleReturn::factory()->create();

        $response = $this->delete(route('sale-returns.destroy', $saleReturn));

        $response->assertRedirect(route('saleReturns.index'));

        $this->assertSoftDeleted($saleReturn);
    }
}
