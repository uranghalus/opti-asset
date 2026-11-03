<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tb_division', function (Blueprint $table) {
            $table->string('id_division')->primary();
            $table->string('tenant_id');
            $table->string('optigate_division_id')->unique();
            $table->string('kode_division');
            $table->string('nama_division');
            $table->boolean('is_active')->default(true);
            $table->timestamp('deactivated_at')->nullable();
            $table->timestamps();

            $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tb_division');
    }
};
