<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;
use App\Models\Branch;
use App\Models\Product;
use App\Models\Reference;
use App\Models\StockMovement;
use App\Models\User;

class StockMovementFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = StockMovement::class;

    /**
     * Define the model's default state.
     */
    public function definition(): array
    {
        return [
            'product_id' => Product::factory(),
            'branch_id' => Branch::factory(),
            'movement_type' => fake()->regexify('[A-Za-z0-9]{50}'),
            'quantity' => fake()->numberBetween(-10000, 10000),
            'reference_type' => fake()->regexify('[A-Za-z0-9]{100}'),
            'reference_id' => Reference::factory(),
            'notes' => fake()->text(),
            'created_by' => User::factory()->create()->created_by,
            'created_at' => fake()->dateTime(),
            'creator_id' => User::factory(),
        ];
    }
}
