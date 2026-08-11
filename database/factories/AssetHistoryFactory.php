<?php

namespace Database\Factories;

use App\Models\Asset;
use App\Models\AssetHistory;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<AssetHistory>
 */
class AssetHistoryFactory extends Factory
{
    public function definition(): array
    {
        return [
            'asset_id' => Asset::factory(),
            'field' => fake()->randomElement(['status', 'condition', 'location_id', 'department_id', 'pic']),
            'old_value' => fake()->optional()->word(),
            'new_value' => fake()->optional()->word(),
            'changed_by' => null,
            'changed_by_name' => fake()->optional()->name(),
        ];
    }
}
