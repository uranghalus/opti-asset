<?php

namespace Database\Factories;

use App\Models\Item;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Item>
 */
class ItemFactory extends Factory
{
    public function definition(): array
    {
        return [
            'code' => fake()->unique()->bothify('ITM-####'),
            'name' => fake()->words(3, true),
            'category_id' => null,
            'department_id' => null,
            'description' => fake()->optional()->sentence(),
        ];
    }
}
