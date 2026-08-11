<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('asset_histories', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('tenant_id');
            $table->uuid('asset_id');
            $table->string('field', 50);
            $table->text('old_value')->nullable();
            $table->text('new_value')->nullable();
            $table->uuid('changed_by')->nullable();
            $table->string('changed_by_name')->nullable();
            $table->timestamps();

            $table->index(['asset_id', 'tenant_id']);
            $table->index('tenant_id');

            $table->foreign('tenant_id')->references('id')->on('tenants')->cascadeOnDelete();
            $table->foreign('asset_id')->references('id')->on('assets')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('asset_histories');
    }
};
