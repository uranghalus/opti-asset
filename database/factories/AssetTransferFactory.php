<?php

namespace Database\Factories;

use App\Enums\AssetTransferStatus;
use App\Models\Asset;
use App\Models\AssetTransfer;
use App\Models\Location;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<AssetTransfer>
 */
class AssetTransferFactory extends Factory
{
    public function definition(): array
    {
        return [
            'asset_id' => Asset::factory(),
            'from_location_id' => Location::factory(),
            'to_location_id' => Location::factory(),
            'quantity' => fake()->numberBetween(1, 5),
            'status' => AssetTransferStatus::Pending,
            'notes' => fake()->optional()->sentence(),
            'requested_by' => User::factory(),
            'approved_by' => null,
            'approved_at' => null,
        ];
    }
}
