<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;
use App\Models\Branch;
use App\Models\Customer;
use App\Models\Sale;
use App\Models\User;

class SaleFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = Sale::class;

    /**
     * Define the model's default state.
     */
    public function definition(): array
    {
        return [
            'invoice_no' => fake()->regexify('[A-Za-z0-9]{50}'),
            'branch_id' => Branch::factory(),
            'customer_id' => Customer::factory(),
            'sale_date' => fake()->date(),
            'subtotal' => fake()->randomFloat(2, 0, 9999999999999.99),
            'tax_amount' => fake()->randomFloat(2, 0, 9999999999999.99),
            'discount_amount' => fake()->randomFloat(2, 0, 9999999999999.99),
            'total_amount' => fake()->randomFloat(2, 0, 9999999999999.99),
            'payment_status' => fake()->regexify('[A-Za-z0-9]{50}'),
            'payment_method' => fake()->regexify('[A-Za-z0-9]{50}'),
            'paid_amount' => fake()->randomFloat(2, 0, 9999999999999.99),
            'credit_amount' => fake()->randomFloat(2, 0, 9999999999999.99),
            'notes' => fake()->text(),
            'created_by' => User::factory()->create()->created_by,
            'creator_id' => User::factory(),
        ];
    }
}
