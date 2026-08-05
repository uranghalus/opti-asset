<?php

namespace Database\Factories;

use App\Models\AssetCluster;
use App\Models\AssetSubCluster;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<AssetSubCluster>
 */
class AssetSubClusterFactory extends Factory
{
    public function definition(): array
    {
        return [
            'asset_cluster_id' => AssetCluster::factory(),
            'code' => fake()->optional()->numerify('0#.0#.0#.0#'),
            'name' => fake()->words(2, true),
            'description' => fake()->optional()->sentence(),
            'notes' => fake()->optional()->sentence(),
            'type' => 'PERALATAN',
        ];
    }
}
