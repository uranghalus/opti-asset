<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tb_employee', function (Blueprint $table) {
            $table->string('division_id')->nullable()->after('id_position');
        });
    }

    public function down(): void
    {
        Schema::table('tb_employee', function (Blueprint $table) {
            $table->dropColumn('division_id');
        });
    }
};
