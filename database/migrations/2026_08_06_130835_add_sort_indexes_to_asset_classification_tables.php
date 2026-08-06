<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('asset_groups', function (Blueprint $table) {
            $table->index(['tenant_id', 'sort_order', 'code'], 'asset_groups_tenant_sort_code_index');
        });

        Schema::table('asset_categories', function (Blueprint $table) {
            $table->index(['asset_group_id', 'sort_order', 'code'], 'asset_categories_group_sort_code_index');
        });

        Schema::table('asset_clusters', function (Blueprint $table) {
            $table->index(['asset_category_id', 'sort_order', 'code'], 'asset_clusters_category_sort_code_index');
        });

        Schema::table('asset_sub_clusters', function (Blueprint $table) {
            $table->index(['asset_cluster_id', 'sort_order', 'code'], 'asset_sub_clusters_cluster_sort_code_index');
        });
    }

    public function down(): void
    {
        Schema::table('asset_groups', function (Blueprint $table) {
            $table->dropIndex('asset_groups_tenant_sort_code_index');
        });

        Schema::table('asset_categories', function (Blueprint $table) {
            $table->dropIndex('asset_categories_group_sort_code_index');
        });

        Schema::table('asset_clusters', function (Blueprint $table) {
            $table->dropIndex('asset_clusters_category_sort_code_index');
        });

        Schema::table('asset_sub_clusters', function (Blueprint $table) {
            $table->dropIndex('asset_sub_clusters_cluster_sort_code_index');
        });
    }
};
