<?php

declare(strict_types=1);

use App\Models\Tenant;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Direct backfill: convert existing UUID tenant primary keys to ULIDs
 * (D4 decision). All tenant_id foreign key columns are updated in lockstep.
 */
return new class extends Migration
{
    public function up(): void
    {
        // Collect existing tenants: id (UUID) -> new ULID
        $rows = DB::table('tenants')->pluck('id');

        foreach ($rows as $oldId) {
            $newId = (string) Str::ulid();

            DB::table('tenants')->where('id', $oldId)->update(['id' => $newId]);

            // Populate code slug for existing tenants (no code before)
            $tenant = Tenant::find($newId);
            if ($tenant && blank($tenant->code)) {
                $tenant->update(['code' => strtolower(str_replace(' ', '-', $tenant->name))]);
            }

            // Update all tenant_id foreign key columns across tables
            foreach ($this->tenantScopedTables() as $table => $column) {
                DB::table($table)->where($column, $oldId)->update([$column => $newId]);
            }
        }
    }

    public function down(): void
    {
        // Irreversible: ULIDs cannot be mapped back to original UUIDs.
    }

    /**
     * All tables (and their tenant_id column) that reference tenants.id.
     */
    private function tenantScopedTables(): array
    {
        return [
            'users' => 'tenant_id',
            'assets' => 'tenant_id',
            'asset_categories' => 'tenant_id',
            'asset_clusters' => 'tenant_id',
            'asset_sub_clusters' => 'tenant_id',
            'asset_groups' => 'tenant_id',
            'asset_disposals' => 'tenant_id',
            'asset_transfers' => 'tenant_id',
            'items' => 'tenant_id',
            'locations' => 'tenant_id',
            'departments' => 'tenant_id',
            'employees' => 'tenant_id',
            'audit_logs' => 'tenant_id',
        ];
    }
};
