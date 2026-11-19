<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Child table => [parent table, parent FK column].
     *
     * @var array<string, array{parent: string, column: string}>
     */
    private const CHILDREN = [
        'asset_categories' => ['parent' => 'asset_groups', 'column' => 'asset_group_id'],
        'asset_clusters' => ['parent' => 'asset_categories', 'column' => 'asset_category_id'],
        'asset_sub_clusters' => ['parent' => 'asset_clusters', 'column' => 'asset_cluster_id'],
    ];

    /**
     * Enforce child type = parent type at the database level with composite
     * foreign keys (child: [parent_id, classification_type] references parent's
     * unique (id, classification_type)). Columns are still nullable, so rows
     * awaiting the backfill pass the constraint; NULL child values are legal.
     */
    public function up(): void
    {
        foreach (self::CHILDREN as $child => ['parent' => $parent, 'column' => $column]) {
            Schema::table($child, function (Blueprint $blueprint) use ($parent, $column) {
                $name = $blueprint->getTable();
                $blueprint->index([$column, 'classification_type'], $name.'_classification_type_parent_index');
                $blueprint->foreign([$column, 'classification_type'], $name.'_classification_type_parent_fk')
                    ->references(['id', 'classification_type'])
                    ->on($parent)
                    ->cascadeOnDelete();
            });
        }
    }

    public function down(): void
    {
        foreach (self::CHILDREN as $child => ['column' => $column]) {
            Schema::table($child, function (Blueprint $blueprint) {
                $name = $blueprint->getTable();
                $blueprint->dropForeign($name.'_classification_type_parent_fk');
                $blueprint->dropIndex($name.'_classification_type_parent_index');
            });
        }
    }
};
