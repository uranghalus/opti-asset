<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('categories', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('tenant_id');
            $table->string('name');
            $table->string('code', 20)->nullable();
            $table->uuid('classification_id')->nullable();
            $table->string('classification_type')->nullable();
            $table->timestamps();

            $table->index('tenant_id');
            $table->index(['classification_type', 'classification_id']);

            $table->foreign('tenant_id')->references('id')->on('tenants')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('categories');
    }
};
