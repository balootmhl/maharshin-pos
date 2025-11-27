<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;
use App\Models\Setting;

class SettingFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = Setting::class;

    /**
     * Define the model's default state.
     */
    public function definition(): array
    {
        return [
            'key' => fake()->regexify('[A-Za-z0-9]{100}'),
            'value' => fake()->text(),
            'description' => fake()->text(),
            'group' => fake()->regexify('[A-Za-z0-9]{50}'),
            'updated_at' => fake()->dateTime(),
        ];
    }
}
