<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;
use App\Models\Product;
use App\Models\SaleItem;
use App\Models\SaleReturn;
use App\Models\SaleReturnItem;

class SaleReturnItemFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = SaleReturnItem::class;

    /**
     * Define the model's default state.
     */
    public function definition(): array
    {
        return [
            'sale_return_id' => SaleReturn::factory(),
            'sale_item_id' => SaleItem::factory(),
            'product_id' => Product::factory(),
            'quantity' => fake()->numberBetween(-10000, 10000),
            'unit_price' => fake()->randomFloat(2, 0, 9999999999999.99),
            'subtotal' => fake()->randomFloat(2, 0, 9999999999999.99),
        ];
    }
}
