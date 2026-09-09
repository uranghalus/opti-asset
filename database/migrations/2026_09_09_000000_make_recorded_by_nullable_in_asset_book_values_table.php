<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('asset_book_values', function (Blueprint $table) {
            $table->dropForeign(['recorded_by']);
            $table->unsignedBigInteger('recorded_by')->nullable()->change();
            $table->foreign('recorded_by')
                ->references('id')
                ->on('users')
                ->onUpdate('cascade')
                ->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::table('asset_book_values', function (Blueprint $table) {
            $table->dropForeign(['recorded_by']);
            $table->unsignedBigInteger('recorded_by')->nullable(false)->change();
            $table->foreign('recorded_by')
                ->references('id')
                ->on('users')
                ->onUpdate('cascade')
                ->onDelete('cascade');
        });
    }
};
