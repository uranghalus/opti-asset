<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * The classification tables receiving the new type dimension.
     *
     * @var array<int, string>
     */
    private const TABLES = [
        'asset_groups',
        'asset_categories',
        'asset_clusters',
        'asset_sub_clusters',
    ];

    /**
     * Add the nullable classification_type enum and the unique (id, classification_type)
     * index that composite foreign keys reference. Values stay nullable until the
     * backfill command fills them; the NOT NULL step follows business review (Fase 2).
     */
    public function up(): void
    {
        foreach (self::TABLES as $table) {
            Schema::table($table, function (Blueprint $blueprint) {
                $blueprint->enum('classification_type', ['peralatan', 'aktiva_tetap'])->nullable();
                $blueprint->unique(['id', 'classification_type'], $blueprint->getTable().'_id_classification_type_unique');
                $blueprint->index('classification_type', $blueprint->getTable().'_classification_type_index');
            });
        }
    }

    public function down(): void
    {
        foreach (self::TABLES as $table) {
            Schema::table($table, function (Blueprint $blueprint) {
                $name = $blueprint->getTable();
                $blueprint->dropUnique($name.'_id_classification_type_unique');
                $blueprint->dropIndex($name.'_classification_type_index');
                $blueprint->dropColumn('classification_type');
            });
        }
    }
};
