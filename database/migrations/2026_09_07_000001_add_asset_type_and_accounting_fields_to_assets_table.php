<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('assets', function (Blueprint $table) {
            $table->enum('asset_type', ['fixed_asset', 'equipment'])->nullable()->after('status');
            $table->decimal('acquisition_cost', 15, 8)->nullable()->after('asset_type');
            $table->integer('useful_life_years')->nullable()->after('acquisition_cost');
            $table->enum('depreciation_method', ['straight_line', 'declining_balance', 'none'])->default('none')->after('useful_life_years');
            $table->decimal('accumulated_depreciation', 15, 8)->default(0)->after('depreciation_method');
            $table->unsignedBigInteger('capitalization_threshold_id')->nullable()->after('accumulated_depreciation');
            $table->text('type_override_reason')->nullable()->after('capitalization_threshold_id');

            $table->foreign('capitalization_threshold_id')
                ->references('id')
                ->on('capitalization_thresholds')
                ->onUpdate('cascade')
                ->onDelete('set null');

            $table->index('asset_type');
        });
    }

    public function down(): void
    {
        Schema::table('assets', function (Blueprint $table) {
            $table->dropForeign(['capitalization_threshold_id']);
            $table->dropIndex(['asset_type']);
            $table->dropColumn([
                'asset_type',
                'acquisition_cost',
                'useful_life_years',
                'depreciation_method',
                'accumulated_depreciation',
                'capitalization_threshold_id',
                'type_override_reason',
            ]);
        });
    }
};