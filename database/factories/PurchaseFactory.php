<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;
use App\Models\Branch;
use App\Models\Purchase;
use App\Models\Supplier;
use App\Models\User;

class PurchaseFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = Purchase::class;

    /**
     * Define the model's default state.
     */
    public function definition(): array
    {
        return [
            'purchase_no' => fake()->regexify('[A-Za-z0-9]{50}'),
            'branch_id' => Branch::factory(),
            'supplier_id' => Supplier::factory(),
            'purchase_date' => fake()->date(),
            'subtotal' => fake()->randomFloat(2, 0, 9999999999999.99),
            'tax_amount' => fake()->randomFloat(2, 0, 9999999999999.99),
            'total_amount' => fake()->randomFloat(2, 0, 9999999999999.99),
            'payment_status' => fake()->regexify('[A-Za-z0-9]{50}'),
            'paid_amount' => fake()->randomFloat(2, 0, 9999999999999.99),
            'notes' => fake()->text(),
            'created_by' => User::factory()->create()->created_by,
            'creator_id' => User::factory(),
        ];
    }
}
