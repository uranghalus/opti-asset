<?php

namespace Database\Factories;

use App\Models\ActivityLog;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ActivityLog>
 */
class ActivityLogFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_name' => fake()->name(),
            'action' => fake()->randomElement(['created', 'updated', 'deleted']),
            'subject_type' => 'Asset',
            'subject_label' => fake()->words(2, true),
            'properties' => null,
        ];
    }
}
