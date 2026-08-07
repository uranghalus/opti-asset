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
        Schema::table('tb_department', function (Blueprint $table) {
            $table->string('tenant_id')->nullable();
            $table->foreign('tenant_id')->references('id')->on('tenants')->cascadeOnDelete();
            $table->dropUnique('tb_department_kode_department_unique');
            $table->unique(['tenant_id', 'kode_department']);
        });
    }

    public function down(): void
    {
        Schema::table('tb_department', function (Blueprint $table) {
            $table->dropUnique(['tenant_id', 'kode_department']);
            $table->unique('kode_department');
            $table->dropForeign(['tenant_id']);
            $table->dropColumn('tenant_id');
        });
    }
};
