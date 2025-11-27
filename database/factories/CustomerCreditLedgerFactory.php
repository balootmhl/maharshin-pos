<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;
use App\Models\Branch;
use App\Models\Customer;
use App\Models\CustomerCreditLedger;
use App\Models\Reference;
use App\Models\User;

class CustomerCreditLedgerFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = CustomerCreditLedger::class;

    /**
     * Define the model's default state.
     */
    public function definition(): array
    {
        return [
            'customer_id' => Customer::factory(),
            'branch_id' => Branch::factory(),
            'transaction_date' => fake()->date(),
            'transaction_type' => fake()->regexify('[A-Za-z0-9]{50}'),
            'reference_type' => fake()->regexify('[A-Za-z0-9]{100}'),
            'reference_id' => Reference::factory(),
            'reference_no' => fake()->regexify('[A-Za-z0-9]{100}'),
            'debit' => fake()->randomFloat(2, 0, 9999999999999.99),
            'credit' => fake()->randomFloat(2, 0, 9999999999999.99),
            'balance' => fake()->randomFloat(2, 0, 9999999999999.99),
            'description' => fake()->text(),
            'created_by' => User::factory()->create()->created_by,
            'created_at' => fake()->dateTime(),
            'updated_at' => fake()->dateTime(),
            'creator_id' => User::factory(),
        ];
    }
}
