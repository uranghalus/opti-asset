<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('asset_categories', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('tenant_id');
            $table->uuid('asset_group_id');
            $table->string('code', 20)->nullable();
            $table->string('name');
            $table->text('description')->nullable();
            $table->timestamps();

            $table->unique(['asset_group_id', 'code']);
            $table->foreign('tenant_id')->references('id')->on('tenants')->cascadeOnDelete();
            $table->foreign('asset_group_id')->references('id')->on('asset_groups')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('asset_categories');
    }
};
