<?php

namespace Database\Factories;

use App\Models\AssetGroup;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<AssetGroup>
 */
class AssetGroupFactory extends Factory
{
    public function definition(): array
    {
        return [
            'code' => fake()->optional()->numerify('0#'),
            'name' => fake()->words(2, true),
            'description' => fake()->optional()->sentence(),
        ];
    }
}
