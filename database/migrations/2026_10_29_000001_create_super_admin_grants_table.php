<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Catatan pemberian dan pencabutan status super-admin pada level User.
     * Berfungsi sebagai audit trail permanen (tidak ada expires_at).
     */
    public function up(): void
    {
        Schema::create('super_admin_grants', function (Blueprint $table): void {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('granted_by_user_id')->nullable();
            $table->unsignedBigInteger('granted_to_user_id')->nullable();
            $table->text('reason')->nullable();
            $table->timestamp('granted_at');
            $table->unsignedBigInteger('revoked_by_user_id')->nullable();
            $table->timestamp('revoked_at')->nullable();
            $table->text('revoked_reason')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('granted_by_user_id')->references('id')->on('users')->onDelete('set null');
            $table->foreign('granted_to_user_id')->references('id')->on('users')->onDelete('set null');
            $table->foreign('revoked_by_user_id')->references('id')->on('users')->onDelete('set null');

            $table->index('granted_to_user_id');
            $table->index('granted_at');
            $table->index('revoked_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('super_admin_grants');
    }
};
