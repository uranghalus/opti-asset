<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Email karyawan unik per tenant — jaminan untuk backfill link
     * users.employee_id (matching email) agar tidak ambigu. Email nullable:
     * index unik tetap mengizinkan beberapa baris NULL (MySQL & sqlite).
     */
    public function up(): void
    {
        Schema::table('tb_employee', function (Blueprint $table): void {
            $table->unique(['tenant_id', 'email'], 'tb_employee_tenant_id_email_unique');
        });
    }

    public function down(): void
    {
        Schema::table('tb_employee', function (Blueprint $table): void {
            $table->dropUnique('tb_employee_tenant_id_email_unique');
        });
    }
};
