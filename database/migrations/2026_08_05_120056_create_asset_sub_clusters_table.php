<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('asset_sub_clusters', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('tenant_id');
            $table->uuid('asset_cluster_id');
            $table->string('code', 20)->nullable();
            $table->string('name');
            $table->text('description')->nullable();
            $table->text('notes')->nullable();
            $table->string('type')->default('PERALATAN');
            $table->timestamps();

            $table->unique(['asset_cluster_id', 'code']);
            $table->foreign('tenant_id')->references('id')->on('tenants')->cascadeOnDelete();
            $table->foreign('asset_cluster_id')->references('id')->on('asset_clusters')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('asset_sub_clusters');
    }
};
