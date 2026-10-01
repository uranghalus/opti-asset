<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Old unique => [child table, old columns, new columns per type].
     * Group becomes unique per (tenant_id, classification_type, code) and child
     * levels per (tenant_id, classification_type, parent_id, code), so the same
     * code may exist once per type (Q8). Multiple NULL types stay legal while
     * unbackfilled rows exist.
     *
     * @var array<string, array{old: array<int, string>, new: array<int, string>}>
     */
    private const UNIQUES = [
        'asset_groups' => [
            'old' => ['tenant_id', 'code'],
            'new' => ['tenant_id', 'classification_type', 'code'],
        ],
        'asset_categories' => [
            'old' => ['asset_group_id', 'code'],
            'new' => ['tenant_id', 'classification_type', 'asset_group_id', 'code'],
        ],
        'asset_clusters' => [
            'old' => ['asset_category_id', 'code'],
            'new' => ['tenant_id', 'classification_type', 'asset_category_id', 'code'],
        ],
        'asset_sub_clusters' => [
            'old' => ['asset_cluster_id', 'code'],
            'new' => ['tenant_id', 'classification_type', 'asset_cluster_id', 'code'],
        ],
    ];

    public function up(): void
    {
        foreach (self::UNIQUES as $table => ['old' => $old, 'new' => $new]) {
            Schema::table($table, function (Blueprint $blueprint) use ($old, $new) {
                $name = $blueprint->getTable();
                $blueprint->dropUnique($name.'_'.implode('_', $old).'_unique');
                $blueprint->unique($new, $name.'_code_per_type_unique');
            });
        }
    }

    public function down(): void
    {
        foreach (self::UNIQUES as $table => ['old' => $old, 'new' => $new]) {
            Schema::table($table, function (Blueprint $blueprint) use ($old) {
                $name = $blueprint->getTable();
                $blueprint->dropUnique($name.'_code_per_type_unique');
                $blueprint->unique($old, $name.'_'.implode('_', $old).'_unique');
            });
        }
    }
};
