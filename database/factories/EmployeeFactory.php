<?php

namespace Database\Factories;

use App\Models\Department;
use App\Models\Employee;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Employee>
 */
class EmployeeFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'id_employee' => (string) Str::uuid(),
            'nik_employee' => fake()->numerify('NIK-####'),
            'nama_employee' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'number' => fake()->phoneNumber(),
            'photo_url' => null,
            'id_department' => Department::factory(),
            'last_login_ip' => null,
        ];
    }
}
