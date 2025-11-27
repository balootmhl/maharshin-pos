<?php

namespace Tests\Feature\Http\Controllers;

use App\Models\Customer;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use JMac\Testing\Traits\AdditionalAssertions;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

/**
 * @see \App\Http\Controllers\CustomerController
 */
final class CustomerControllerTest extends TestCase
{
    use AdditionalAssertions, RefreshDatabase, WithFaker;

    #[Test]
    public function index_displays_view(): void
    {
        $customers = Customer::factory()->count(3)->create();

        $response = $this->get(route('customers.index'));

        $response->assertOk();
        $response->assertViewIs('customer.index');
        $response->assertViewHas('customers');
    }


    #[Test]
    public function create_displays_view(): void
    {
        $response = $this->get(route('customers.create'));

        $response->assertOk();
        $response->assertViewIs('customer.create');
    }


    #[Test]
    public function store_uses_form_request_validation(): void
    {
        $this->assertActionUsesFormRequest(
            \App\Http\Controllers\CustomerController::class,
            'store',
            \App\Http\Requests\CustomerStoreRequest::class
        );
    }

    #[Test]
    public function store_saves_and_redirects(): void
    {
        $code = fake()->word();
        $name = fake()->name();
        $credit_limit = fake()->randomFloat(/** decimal_attributes **/);
        $current_balance = fake()->randomFloat(/** decimal_attributes **/);
        $is_active = fake()->boolean();

        $response = $this->post(route('customers.store'), [
            'code' => $code,
            'name' => $name,
            'credit_limit' => $credit_limit,
            'current_balance' => $current_balance,
            'is_active' => $is_active,
        ]);

        $customers = Customer::query()
            ->where('code', $code)
            ->where('name', $name)
            ->where('credit_limit', $credit_limit)
            ->where('current_balance', $current_balance)
            ->where('is_active', $is_active)
            ->get();
        $this->assertCount(1, $customers);
        $customer = $customers->first();

        $response->assertRedirect(route('customers.index'));
        $response->assertSessionHas('customer.id', $customer->id);
    }


    #[Test]
    public function show_displays_view(): void
    {
        $customer = Customer::factory()->create();

        $response = $this->get(route('customers.show', $customer));

        $response->assertOk();
        $response->assertViewIs('customer.show');
        $response->assertViewHas('customer');
    }


    #[Test]
    public function edit_displays_view(): void
    {
        $customer = Customer::factory()->create();

        $response = $this->get(route('customers.edit', $customer));

        $response->assertOk();
        $response->assertViewIs('customer.edit');
        $response->assertViewHas('customer');
    }


    #[Test]
    public function update_uses_form_request_validation(): void
    {
        $this->assertActionUsesFormRequest(
            \App\Http\Controllers\CustomerController::class,
            'update',
            \App\Http\Requests\CustomerUpdateRequest::class
        );
    }

    #[Test]
    public function update_redirects(): void
    {
        $customer = Customer::factory()->create();
        $code = fake()->word();
        $name = fake()->name();
        $credit_limit = fake()->randomFloat(/** decimal_attributes **/);
        $current_balance = fake()->randomFloat(/** decimal_attributes **/);
        $is_active = fake()->boolean();

        $response = $this->put(route('customers.update', $customer), [
            'code' => $code,
            'name' => $name,
            'credit_limit' => $credit_limit,
            'current_balance' => $current_balance,
            'is_active' => $is_active,
        ]);

        $customer->refresh();

        $response->assertRedirect(route('customers.index'));
        $response->assertSessionHas('customer.id', $customer->id);

        $this->assertEquals($code, $customer->code);
        $this->assertEquals($name, $customer->name);
        $this->assertEquals($credit_limit, $customer->credit_limit);
        $this->assertEquals($current_balance, $customer->current_balance);
        $this->assertEquals($is_active, $customer->is_active);
    }


    #[Test]
    public function destroy_deletes_and_redirects(): void
    {
        $customer = Customer::factory()->create();

        $response = $this->delete(route('customers.destroy', $customer));

        $response->assertRedirect(route('customers.index'));

        $this->assertSoftDeleted($customer);
    }
}
