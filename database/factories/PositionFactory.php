<?php

namespace Database\Factories;

use App\Models\Division;
use App\Models\Position;
use App\Models\Tenant;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Position>
 */
class PositionFactory extends Factory
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
            'optigate_position_id' => fake()->unique()->numberBetween(1, 9999),
            'department_id' => null,
            'division_id' => Division::factory(),
            'kode_position' => fake()->unique()->lexify('??'),
            'nama_position' => fake()->unique()->jobTitle(),
            'is_active' => true,
        ];
    }
}
