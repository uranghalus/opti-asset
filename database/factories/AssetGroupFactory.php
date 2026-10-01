<?php

namespace Database\Factories;

use App\Enums\ClassificationType;
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
            'code' => fake()->unique()->numerify('0#'),
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
