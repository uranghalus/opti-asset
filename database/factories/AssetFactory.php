<?php

namespace Database\Factories;

use App\Models\Asset;
use App\Models\Item;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Asset>
 */
class AssetFactory extends Factory
{
    public function definition(): array
    {
        return [
            'item_id' => Item::factory(),
            'condition' => fake()->optional()->randomElement(['Baik', 'Rusak Ringan', 'Rusak Berat']),
            'purchase_date' => fake()->optional()->dateTimeThisDecade(),
            'purchase_price' => fake()->optional()->randomFloat(2, 1_000_000, 100_000_000),
            'in_come_date' => fake()->optional()->dateTimeThisDecade(),
            'broken_date' => null,
            'warranty_expire' => fake()->optional()->dateTimeThisDecade(),
            'location_id' => null,
            'department_id' => null,
            'assigned_user_id' => null,
            'assigned_status' => 'AVAILABLE',
            'brand' => fake()->optional()->company(),
            'model' => fake()->optional()->word(),
            'part_number' => fake()->optional()->numerify('PART-####'),
            'serial_number' => fake()->optional()->numerify('SN-########'),
            'no_spb' => fake()->optional()->numerify('SPB-####'),
            'document_number' => fake()->optional()->numerify('DOC-####'),
            'pic' => fake()->optional()->name(),
            'notes' => fake()->optional()->sentence(),
            'photo_url' => null,
            'document_url' => null,
            'kode_asset' => fake()->optional()->numerify('AST-####'),
            'garansi_exp' => fake()->optional()->dateTimeThisDecade(),
            'status' => 'ACT',
            'vendor_name' => fake()->optional()->company(),
            'asset_group_id' => null,
            'asset_category_id' => null,
            'asset_cluster_id' => null,
            'asset_sub_cluster_id' => null,
        ];
    }
}
