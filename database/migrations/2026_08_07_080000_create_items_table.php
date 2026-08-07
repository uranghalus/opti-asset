<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('tenant_id');
            $table->string('code');
            $table->string('name');
            $table->uuid('category_id')->nullable();
            $table->uuid('department_id')->nullable();
            $table->text('description')->nullable();
            $table->string('created_by')->nullable();
            $table->string('updated_by')->nullable();
            $table->timestamps();

            $table->unique(['tenant_id', 'code']);
            $table->unique(['id', 'tenant_id']);
            $table->index(['category_id', 'tenant_id']);
            $table->index(['department_id', 'tenant_id']);
            $table->index('tenant_id');

            $table->foreign('tenant_id')->references('id')->on('tenants')->cascadeOnDelete();
            $table->foreign('category_id')->references('id')->on('asset_categories')->nullOnDelete();
            $table->foreign('department_id')->references('id_department')->on('tb_department')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('items');
    }
};
