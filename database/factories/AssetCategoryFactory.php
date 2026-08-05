<?php

namespace Database\Factories;

use App\Models\AssetCategory;
use App\Models\AssetGroup;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<AssetCategory>
 */
class AssetCategoryFactory extends Factory
{
    public function definition(): array
    {
        return [
            'asset_group_id' => AssetGroup::factory(),
            'code' => fake()->optional()->numerify('0#.0#'),
            'name' => fake()->words(2, true),
            'description' => fake()->optional()->sentence(),
        ];
    }
}
