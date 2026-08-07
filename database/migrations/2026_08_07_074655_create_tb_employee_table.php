<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tb_employee', function (Blueprint $table) {
            $table->uuid('id_employee')->primary();

            $table->string('tenant_id')->nullable();
            $table->string('nik_employee')->nullable();
            $table->string('nama_employee');
            $table->string('email')->nullable();
            $table->string('number')->nullable();
            $table->string('photo_url')->nullable();
            $table->uuid('id_department')->nullable();
            $table->uuid('id_position')->nullable();
            $table->string('last_login_ip')->nullable();
            $table->timestamps();

            $table->foreign('tenant_id')->references('id')->on('tenants')->cascadeOnDelete();
            $table->unique(['tenant_id', 'nik_employee']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tb_employee');
    }
};
