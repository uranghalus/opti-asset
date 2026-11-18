<?php

namespace App\Actions;

use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class MergeDuplicateRolesAction
{
    /**
     * Merge the role $fromName into $toName: move every model assignment and
     * role permission onto the survivor, then delete the duplicate role.
     *
     * Rows are moved with insertOrIgnore because both pivots carry composite
     * primary keys — a model or permission already attached to the survivor
     * must not raise a duplicate-key error. Idempotent: a missing from-role
     * (or from == to) is a no-op. This is deliberately NOT a plain rename:
     * renaming would collide with the unique (name, guard_name) index while
     * the duplicate still exists.
     */
    public function __invoke(string $fromName, string $toName): void
    {
        $tableNames = config('permission.table_names');

        $from = Role::where('name', $fromName)->first();

        if ($from === null) {
            return;
        }

        $to = Role::firstOrCreate([
            'name' => $toName,
            'guard_name' => $from->guard_name,
        ]);

        if ($from->getKey() === $to->getKey()) {
            return;
        }

        DB::table($tableNames['model_has_roles'])
            ->where('role_id', $from->getKey())
            ->get()
            ->each(function (object $row) use ($tableNames, $to): void {
                DB::table($tableNames['model_has_roles'])->insertOrIgnore([
                    'role_id' => $to->getKey(),
                    'model_type' => $row->model_type,
                    'model_id' => $row->model_id,
                ]);
            });

        DB::table($tableNames['role_has_permissions'])
            ->where('role_id', $from->getKey())
            ->pluck('permission_id')
            ->each(function ($permissionId) use ($tableNames, $to): void {
                DB::table($tableNames['role_has_permissions'])->insertOrIgnore([
                    'permission_id' => $permissionId,
                    'role_id' => $to->getKey(),
                ]);
            });

        DB::table($tableNames['model_has_roles'])->where('role_id', $from->getKey())->delete();
        DB::table($tableNames['role_has_permissions'])->where('role_id', $from->getKey())->delete();

        $from->delete();

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }
}
