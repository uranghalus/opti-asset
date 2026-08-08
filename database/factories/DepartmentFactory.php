<?php

namespace Database\Factories;

use App\Models\Department;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Department>
 */
class DepartmentFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'id_department' => (string) Str::uuid(),
            'kode_department' => fake()->unique()->lexify('??'),
            'nama_department' => fake()->unique()->company(),
        ];
    }
}
