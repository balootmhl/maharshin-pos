<?php

namespace Tests\Feature\Http\Controllers;

use App\Models\Branch;
use App\Models\Customer;
use App\Models\CustomerPayment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Illuminate\Support\Carbon;
use JMac\Testing\Traits\AdditionalAssertions;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

/**
 * @see \App\Http\Controllers\CustomerPaymentController
 */
final class CustomerPaymentControllerTest extends TestCase
{
    use AdditionalAssertions, RefreshDatabase, WithFaker;

    #[Test]
    public function index_displays_view(): void
    {
        $customerPayments = CustomerPayment::factory()->count(3)->create();

        $response = $this->get(route('customer-payments.index'));

        $response->assertOk();
        $response->assertViewIs('customerPayment.index');
        $response->assertViewHas('customerPayments');
    }


    #[Test]
    public function create_displays_view(): void
    {
        $response = $this->get(route('customer-payments.create'));

        $response->assertOk();
        $response->assertViewIs('customerPayment.create');
    }


    #[Test]
    public function store_uses_form_request_validation(): void
    {
        $this->assertActionUsesFormRequest(
            \App\Http\Controllers\CustomerPaymentController::class,
            'store',
            \App\Http\Requests\CustomerPaymentStoreRequest::class
        );
    }

    #[Test]
    public function store_saves_and_redirects(): void
    {
        $payment_no = fake()->word();
        $customer = Customer::factory()->create();
        $branch = Branch::factory()->create();
        $payment_date = Carbon::parse(fake()->date());
        $amount = fake()->randomFloat(/** decimal_attributes **/);
        $payment_method = fake()->word();
        $created_at = Carbon::parse(fake()->dateTime());
        $updated_at = Carbon::parse(fake()->dateTime());
        $creator = User::factory()->create();

        $response = $this->post(route('customer-payments.store'), [
            'payment_no' => $payment_no,
            'customer_id' => $customer->id,
            'branch_id' => $branch->id,
            'payment_date' => $payment_date->toDateString(),
            'amount' => $amount,
            'payment_method' => $payment_method,
            'created_at' => $created_at->toDateTimeString(),
            'updated_at' => $updated_at->toDateTimeString(),
            'creator_id' => $creator->id,
        ]);

        $customerPayments = CustomerPayment::query()
            ->where('payment_no', $payment_no)
            ->where('customer_id', $customer->id)
            ->where('branch_id', $branch->id)
            ->where('payment_date', $payment_date)
            ->where('amount', $amount)
            ->where('payment_method', $payment_method)
            ->where('created_at', $created_at)
            ->where('updated_at', $updated_at)
            ->where('creator_id', $creator->id)
            ->get();
        $this->assertCount(1, $customerPayments);
        $customerPayment = $customerPayments->first();

        $response->assertRedirect(route('customerPayments.index'));
        $response->assertSessionHas('customerPayment.id', $customerPayment->id);
    }


    #[Test]
    public function show_displays_view(): void
    {
        $customerPayment = CustomerPayment::factory()->create();

        $response = $this->get(route('customer-payments.show', $customerPayment));

        $response->assertOk();
        $response->assertViewIs('customerPayment.show');
        $response->assertViewHas('customerPayment');
    }


    #[Test]
    public function edit_displays_view(): void
    {
        $customerPayment = CustomerPayment::factory()->create();

        $response = $this->get(route('customer-payments.edit', $customerPayment));

        $response->assertOk();
        $response->assertViewIs('customerPayment.edit');
        $response->assertViewHas('customerPayment');
    }


    #[Test]
    public function update_uses_form_request_validation(): void
    {
        $this->assertActionUsesFormRequest(
            \App\Http\Controllers\CustomerPaymentController::class,
            'update',
            \App\Http\Requests\CustomerPaymentUpdateRequest::class
        );
    }

    #[Test]
    public function update_redirects(): void
    {
        $customerPayment = CustomerPayment::factory()->create();
        $payment_no = fake()->word();
        $customer = Customer::factory()->create();
        $branch = Branch::factory()->create();
        $payment_date = Carbon::parse(fake()->date());
        $amount = fake()->randomFloat(/** decimal_attributes **/);
        $payment_method = fake()->word();
        $created_at = Carbon::parse(fake()->dateTime());
        $updated_at = Carbon::parse(fake()->dateTime());
        $creator = User::factory()->create();

        $response = $this->put(route('customer-payments.update', $customerPayment), [
            'payment_no' => $payment_no,
            'customer_id' => $customer->id,
            'branch_id' => $branch->id,
            'payment_date' => $payment_date->toDateString(),
            'amount' => $amount,
            'payment_method' => $payment_method,
            'created_at' => $created_at->toDateTimeString(),
            'updated_at' => $updated_at->toDateTimeString(),
            'creator_id' => $creator->id,
        ]);

        $customerPayment->refresh();

        $response->assertRedirect(route('customerPayments.index'));
        $response->assertSessionHas('customerPayment.id', $customerPayment->id);

        $this->assertEquals($payment_no, $customerPayment->payment_no);
        $this->assertEquals($customer->id, $customerPayment->customer_id);
        $this->assertEquals($branch->id, $customerPayment->branch_id);
        $this->assertEquals($payment_date, $customerPayment->payment_date);
        $this->assertEquals($amount, $customerPayment->amount);
        $this->assertEquals($payment_method, $customerPayment->payment_method);
        $this->assertEquals($created_at->timestamp, $customerPayment->created_at);
        $this->assertEquals($updated_at->timestamp, $customerPayment->updated_at);
        $this->assertEquals($creator->id, $customerPayment->creator_id);
    }


    #[Test]
    public function destroy_deletes_and_redirects(): void
    {
        $customerPayment = CustomerPayment::factory()->create();

        $response = $this->delete(route('customer-payments.destroy', $customerPayment));

        $response->assertRedirect(route('customerPayments.index'));

        $this->assertModelMissing($customerPayment);
    }
}
