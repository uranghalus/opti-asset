<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        foreach (['asset_groups', 'asset_categories', 'asset_clusters', 'asset_sub_clusters'] as $tableName) {
            Schema::table($tableName, function (Blueprint $table) {
                $table->unsignedInteger('sort_order')->default(0)->after('name');
            });
        }
    }

    public function down(): void
    {
        foreach (['asset_groups', 'asset_categories', 'asset_clusters', 'asset_sub_clusters'] as $tableName) {
            Schema::table($tableName, function (Blueprint $table) {
                $table->dropColumn('sort_order');
            });
        }
    }
};
