<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tb_position', function (Blueprint $table) {
            $table->string('id_position')->primary();
            $table->string('tenant_id');
            $table->string('optigate_position_id')->unique();
            $table->string('department_id')->nullable();
            $table->string('division_id')->nullable();
            $table->string('kode_position');
            $table->string('nama_position');
            $table->boolean('is_active')->default(true);
            $table->timestamp('deactivated_at')->nullable();
            $table->timestamps();

            $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tb_position');
    }
};
