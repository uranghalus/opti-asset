<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('assets')
            ->where('status', 'ACTIVE')
            ->update(['status' => 'ACT']);
        DB::table('assets')
            ->where('status', 'INACTIVE')
            ->update(['status' => 'LOAN']);
        DB::table('assets')
            ->where('status', 'DISPOSED')
            ->update(['status' => 'DSP']);
    }

    public function down(): void
    {
        DB::table('assets')
            ->where('status', 'ACT')
            ->update(['status' => 'ACTIVE']);
        DB::table('assets')
            ->where('status', 'LOAN')
            ->update(['status' => 'INACTIVE']);
        DB::table('assets')
            ->where('status', 'DSP')
            ->update(['status' => 'DISPOSED']);
    }
};
