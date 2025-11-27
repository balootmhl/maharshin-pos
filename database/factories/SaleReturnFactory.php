<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;
use App\Models\Branch;
use App\Models\Sale;
use App\Models\SaleReturn;
use App\Models\User;

class SaleReturnFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = SaleReturn::class;

    /**
     * Define the model's default state.
     */
    public function definition(): array
    {
        return [
            'return_no' => fake()->regexify('[A-Za-z0-9]{50}'),
            'sale_id' => Sale::factory(),
            'branch_id' => Branch::factory(),
            'return_date' => fake()->date(),
            'total_amount' => fake()->randomFloat(2, 0, 9999999999999.99),
            'refund_amount' => fake()->randomFloat(2, 0, 9999999999999.99),
            'refund_method' => fake()->regexify('[A-Za-z0-9]{50}'),
            'reason' => fake()->text(),
            'created_by' => User::factory()->create()->created_by,
            'creator_id' => User::factory(),
        ];
    }
}
