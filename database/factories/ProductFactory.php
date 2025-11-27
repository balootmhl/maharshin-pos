<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;
use App\Models\Category;
use App\Models\Product;
use App\Models\User;

class ProductFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = Product::class;

    /**
     * Define the model's default state.
     */
    public function definition(): array
    {
        return [
            'code' => fake()->regexify('[A-Za-z0-9]{100}'),
            'barcode' => fake()->regexify('[A-Za-z0-9]{100}'),
            'name' => fake()->name(),
            'description' => fake()->text(),
            'category_id' => Category::factory(),
            'unit' => fake()->regexify('[A-Za-z0-9]{50}'),
            'cost_price' => fake()->randomFloat(2, 0, 9999999999999.99),
            'selling_price' => fake()->randomFloat(2, 0, 9999999999999.99),
            'tax_rate' => fake()->randomFloat(2, 0, 999.99),
            'low_stock_alert' => fake()->numberBetween(-10000, 10000),
            'is_active' => fake()->boolean(),
            'created_by' => User::factory()->create()->created_by,
            'updated_by' => User::factory()->create()->updated_by,
            'creator_id' => User::factory(),
            'updater_id' => User::factory(),
        ];
    }
}
