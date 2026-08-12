<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('asset_transfers', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('tenant_id');

            $table->uuid('asset_id');
            $table->uuid('from_location_id')->nullable();
            $table->uuid('to_location_id')->nullable();
            $table->uuid('from_department_id')->nullable();
            $table->uuid('to_department_id')->nullable();
            $table->string('from_user_id')->nullable();
            $table->string('to_user_id')->nullable();

            $table->integer('quantity')->default(1);
            $table->string('status', 20)->default('pending');
            $table->text('notes')->nullable();

            $table->string('requested_by')->nullable();
            $table->string('approved_by')->nullable();
            $table->dateTime('approved_at')->nullable();

            $table->timestamps();

            $table->foreign('tenant_id')->references('id')->on('tenants')->cascadeOnDelete();
            $table->foreign('asset_id')->references('id')->on('assets')->cascadeOnDelete();
            $table->foreign('from_location_id')->references('id')->on('locations')->nullOnDelete();
            $table->foreign('to_location_id')->references('id')->on('locations')->nullOnDelete();
            $table->index(['tenant_id', 'status']);
            $table->index(['tenant_id', 'asset_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('asset_transfers');
    }
};
