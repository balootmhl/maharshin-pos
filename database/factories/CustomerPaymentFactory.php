<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;
use App\Models\Branch;
use App\Models\Customer;
use App\Models\CustomerPayment;
use App\Models\User;

class CustomerPaymentFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = CustomerPayment::class;

    /**
     * Define the model's default state.
     */
    public function definition(): array
    {
        return [
            'payment_no' => fake()->regexify('[A-Za-z0-9]{50}'),
            'customer_id' => Customer::factory(),
            'branch_id' => Branch::factory(),
            'payment_date' => fake()->date(),
            'amount' => fake()->randomFloat(2, 0, 9999999999999.99),
            'payment_method' => fake()->regexify('[A-Za-z0-9]{50}'),
            'reference_no' => fake()->regexify('[A-Za-z0-9]{100}'),
            'notes' => fake()->text(),
            'created_by' => User::factory()->create()->created_by,
            'created_at' => fake()->dateTime(),
            'updated_at' => fake()->dateTime(),
            'creator_id' => User::factory(),
        ];
    }
}
