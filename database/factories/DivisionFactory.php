<?php

namespace Database\Factories;

use App\Models\Division;
use App\Models\Tenant;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Division>
 */
class DivisionFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'tenant_id' => Tenant::factory(),
            'optigate_division_id' => fake()->unique()->numberBetween(1, 9999),
            'kode_division' => fake()->unique()->lexify('??'),
            'nama_division' => fake()->unique()->company(),
            'is_active' => true,
        ];
    }
}
