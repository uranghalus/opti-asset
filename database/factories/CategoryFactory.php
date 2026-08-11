<?php

namespace Database\Factories;

use App\Enums\ClassificationLevel;
use App\Models\AssetGroup;
use App\Models\Category;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Category>
 */
class CategoryFactory extends Factory
{
    public function definition(): array
    {
        return [
            'name' => fake()->words(2, true),
            'code' => fake()->unique()->numerify('##.##'),
            'classification_id' => AssetGroup::factory(),
            'classification_type' => ClassificationLevel::GROUP,
        ];
    }
}
