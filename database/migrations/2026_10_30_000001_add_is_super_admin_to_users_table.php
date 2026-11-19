<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Add the platform super-admin flag to the users table.
     *
     * The `is_super_admin` boolean is the single source of truth for the
     * super-admin bypass alongside the Spatie `super-admin` role. It is set
     * for the account matching config('auth.super_admin_email')
     * (superadmin@appdutamall.com by default) and can be granted/revoked via
     * the SuperAdminGrant flow or the app:grant-super-admin-role command.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->boolean('is_super_admin')->default(false)->after('email');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->dropColumn('is_super_admin');
        });
    }
};
