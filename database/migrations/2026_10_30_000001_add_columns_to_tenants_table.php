<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            $table->string('optigate_company_id')->nullable()->after('id');
            $table->string('code')->nullable()->unique()->after('optigate_company_id');
            $table->boolean('is_active')->default(true)->after('code');
            $table->timestamp('deactivated_at')->nullable()->after('is_active');
            $table->timestamp('last_department_synced_at')->nullable()->after('deactivated_at');
            $table->timestamp('last_division_synced_at')->nullable()->after('last_department_synced_at');
            $table->timestamp('last_position_synced_at')->nullable()->after('last_division_synced_at');
        });
    }

    public function down(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            $table->dropColumn([
                'optigate_company_id',
                'code',
                'is_active',
                'deactivated_at',
                'last_department_synced_at',
                'last_division_synced_at',
                'last_position_synced_at',
            ]);
        });
    }
};
