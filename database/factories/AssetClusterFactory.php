<?php

namespace Database\Factories;

use App\Enums\ClassificationType;
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
            'classification_type' => ClassificationType::AKTIVA_TETAP->value,
        ];
    }

    public function peralatan(): static
    {
        return $this->state(fn (): array => [
            'classification_type' => ClassificationType::PERALATAN->value,
        ]);
    }
}
