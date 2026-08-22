<?php

namespace Database\Factories;

use App\Models\Asset;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<AssetDisposal>
 */
class AssetDisposalFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'asset_id' => Asset::factory(),
            'reason' => $this->faker->optional()->sentence(),
            'disposal_date' => $this->faker->optional()->dateBetween('-1 year', '+1 year'),
            'disposed_by' => User::factory(),
            'status' => 'pending',
        ];
    }

    public function pending(): static
    {
        return $this->state(fn () => ['status' => 'pending']);
    }

    public function approved(): static
    {
        return $this->state(fn () => ['status' => 'approved']);
    }

    public function rejected(): static
    {
        return $this->state(fn () => ['status' => 'rejected']);
    }

    public function withReason(string $reason): static
    {
        return $this->state(fn () => ['reason' => $reason]);
    }
}
