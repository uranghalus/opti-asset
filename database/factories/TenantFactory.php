<?php

namespace Database\Factories;

use App\Models\Tenant;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Tenant>
 */
class TenantFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'id' => (string) Str::uuid(),
            'code' => fake()->unique()->lexify('??'),
            'name' => fake()->unique()->company(),
            'optigate_company_id' => fake()->unique()->numberBetween(1, 9999),
            'is_active' => true,
        ];
    }
}
