<?php

use App\Actions\MergeDuplicateRolesAction;
use App\Models\User;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    /**
     * Konsolidasi ejaan role: `super_admin` (underscore) adalah duplikat
     * historis dari `super-admin` (hyphen, kanonik). Merge — bukan rename —
     * agar assignment & permission pindah tanpa tabrakan unique index.
     */
    public function up(): void
    {
        app(MergeDuplicateRolesAction::class)('super_admin', User::ROLE_SUPER_ADMIN);
    }

    /**
     * Tidak reversible secara utuh: assignment yang sudah dipindah tidak
     * dapat di-unmerge tanpa data asli. Role kanonik `super-admin` adalah
     * state yang benar setelah migrasi ini.
     */
    public function down(): void
    {
        //
    }
};
