<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tb_department', function (Blueprint $table) {
            $table->foreignId('hod_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('manager_user_id')->nullable()->constrained('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('tb_department', function (Blueprint $table) {
            $table->dropConstrainedForeignId('hod_user_id');
            $table->dropConstrainedForeignId('manager_user_id');
        });
    }
};
