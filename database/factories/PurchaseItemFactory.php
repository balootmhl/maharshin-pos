<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;
use App\Models\Product;
use App\Models\Purchase;
use App\Models\PurchaseItem;

class PurchaseItemFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = PurchaseItem::class;

    /**
     * Define the model's default state.
     */
    public function definition(): array
    {
        return [
            'purchase_id' => Purchase::factory(),
            'product_id' => Product::factory(),
            'quantity' => fake()->numberBetween(-10000, 10000),
            'unit_cost' => fake()->randomFloat(2, 0, 9999999999999.99),
            'tax_rate' => fake()->randomFloat(2, 0, 999.99),
            'tax_amount' => fake()->randomFloat(2, 0, 9999999999999.99),
            'subtotal' => fake()->randomFloat(2, 0, 9999999999999.99),
        ];
    }
}
