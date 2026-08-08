<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('assets', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('tenant_id');

            $table->uuid('item_id')->nullable();
            $table->string('condition', 100)->nullable();
            $table->dateTime('purchase_date')->nullable();
            $table->decimal('purchase_price', 15, 2)->nullable();
            $table->dateTime('in_come_date')->nullable();
            $table->dateTime('broken_date')->nullable();
            $table->dateTime('warranty_expire')->nullable();
            $table->uuid('location_id')->nullable();
            $table->uuid('department_id')->nullable();
            $table->uuid('assigned_user_id')->nullable();
            $table->string('assigned_status', 50)->default('AVAILABLE');
            $table->string('brand', 100)->nullable();
            $table->string('model', 100)->nullable();
            $table->string('part_number', 100)->nullable();
            $table->string('serial_number', 100)->nullable();
            $table->string('no_spb', 100)->nullable();
            $table->string('document_number', 100)->nullable();
            $table->string('pic', 100)->nullable();
            $table->text('notes')->nullable();
            $table->text('photo_url')->nullable();
            $table->text('document_url')->nullable();
            $table->string('kode_asset', 100)->nullable();
            $table->dateTime('garansi_exp')->nullable();
            $table->string('status', 50)->default('ACTIVE');
            $table->string('vendor_name', 100)->nullable();

            $table->uuid('asset_group_id')->nullable();
            $table->uuid('asset_category_id')->nullable();
            $table->uuid('asset_cluster_id')->nullable();
            $table->uuid('asset_sub_cluster_id')->nullable();

            $table->timestamps();

            $table->unique(['id', 'tenant_id']);
            $table->unique(['kode_asset', 'tenant_id']);
            $table->unique(['serial_number', 'tenant_id']);
            $table->index(['item_id', 'tenant_id']);
            $table->index('tenant_id');
            $table->index(['tenant_id', 'asset_group_id']);
            $table->index(['tenant_id', 'asset_category_id']);
            $table->index(['tenant_id', 'asset_cluster_id']);
            $table->index(['tenant_id', 'asset_sub_cluster_id']);

            $table->foreign('tenant_id')->references('id')->on('tenants')->cascadeOnDelete();
            $table->foreign('item_id')->references('id')->on('items')->nullOnDelete();
            $table->foreign('location_id')->references('id')->on('locations')->nullOnDelete();
            $table->foreign('department_id')->references('id_department')->on('tb_department')->nullOnDelete();
            $table->foreign('asset_group_id')->references('id')->on('asset_groups')->nullOnDelete();
            $table->foreign('asset_category_id')->references('id')->on('asset_categories')->nullOnDelete();
            $table->foreign('asset_cluster_id')->references('id')->on('asset_clusters')->nullOnDelete();
            $table->foreign('asset_sub_cluster_id')->references('id')->on('asset_sub_clusters')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('assets');
    }
};
