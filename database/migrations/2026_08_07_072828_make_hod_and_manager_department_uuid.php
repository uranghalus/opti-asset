<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tb_department', function (Blueprint $table) {
            $table->dropForeign(['hod_user_id']);
            $table->dropForeign(['manager_user_id']);

            $table->string('hod_user_id', 255)->nullable()->change();
            $table->string('manager_user_id', 255)->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('tb_department', function (Blueprint $table) {
            $table->unsignedBigInteger('hod_user_id')->nullable()->change();
            $table->unsignedBigInteger('manager_user_id')->nullable()->change();

            $table->foreign('hod_user_id')->references('id')->on('users')->nullOnDelete();
            $table->foreign('manager_user_id')->references('id')->on('users')->nullOnDelete();
        });
    }
};
