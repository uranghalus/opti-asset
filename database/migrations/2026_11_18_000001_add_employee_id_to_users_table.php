<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Link login users to employee records persistently.
     *
     * The `employee_id` FK references `tb_employee.id_employee` (uuid, i.e.
     * char(36)) and is unique: one employee can be linked to at most one
     * user. The unique index is added as a separate statement, not an inline
     * column modifier.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->char('employee_id', 36)->nullable()->after('department');
            $table->foreign('employee_id')->references('id_employee')->on('tb_employee')->nullOnDelete();
            $table->unique('employee_id');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->dropForeign(['employee_id']);
            $table->dropUnique(['employee_id']);
            $table->dropColumn('employee_id');
        });
    }
};
