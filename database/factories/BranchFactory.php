<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;
use App\Models\Branch;

class BranchFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = Branch::class;

    /**
     * Define the model's default state.
     */
    public function definition(): array
    {
        return [
            'code' => fake()->regexify('[A-Za-z0-9]{50}'),
            'name' => fake()->name(),
            'address' => fake()->text(),
            'phone' => fake()->phoneNumber(),
            'email' => fake()->safeEmail(),
            'is_active' => fake()->boolean(),
        ];
    }
}
