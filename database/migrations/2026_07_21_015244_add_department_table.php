<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        //
        Schema::create('tb_department', function (Blueprint $table) {
            // Menggunakan UUID sebagai Primary Key
            $table->uuid('id_department')->primary();

            $table->string('kode_department', 50)->unique();
            $table->string('nama_department')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tb_department');
    }
};
