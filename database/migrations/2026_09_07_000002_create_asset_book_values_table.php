<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('asset_book_values', function (Blueprint $table) {
            $table->id();
            $table->string('asset_id');
            $table->date('period_ends_at');
            $table->decimal('book_value', 15, 8);
            $table->decimal('accumulated_depreciation', 15, 8);
            $table->text('notes')->nullable();
            $table->unsignedBigInteger('recorded_by');
            $table->timestamps();

            $table->foreign('asset_id')
                ->references('id')
                ->on('assets')
                ->onUpdate('cascade')
                ->onDelete('cascade');

            $table->foreign('recorded_by')
                ->references('id')
                ->on('users')
                ->onUpdate('cascade')
                ->onDelete('cascade');

            $table->unique(['asset_id', 'period_ends_at']);
            $table->index(['asset_id', 'period_ends_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('asset_book_values');
    }
};