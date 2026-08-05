<?php

namespace Database\Factories;

use App\Models\AssetCategory;
use App\Models\AssetCluster;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<AssetCluster>
 */
class AssetClusterFactory extends Factory
{
    public function definition(): array
    {
        return [
            'asset_category_id' => AssetCategory::factory(),
            'code' => fake()->optional()->numerify('0#.0#.0#'),
            'name' => fake()->words(2, true),
            'description' => fake()->optional()->sentence(),
        ];
    }
}
