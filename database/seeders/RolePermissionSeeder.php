<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RolePermissionSeeder extends Seeder
{
    /**
     * Katalog izin (permission) aplikasi — satu entri per aksi yang benar-benar
     * diperiksa Gate::authorize di controller. Nama mengikuti pola resource.aksi.
     *
     * Dashboard sengaja tidak digerbangi: halaman ini adalah tujuan login bagi
     * user baru (OIDC/registrasi) yang belum memiliki role apa pun.
     *
     * @var array<int, string>
     */
    public const PERMISSIONS = [
        'audit.view',
        'asset.view', 'asset.create', 'asset.edit', 'asset.delete',
        'asset.classification.view', 'asset.classification.create', 'asset.classification.edit', 'asset.classification.delete',
        'asset.category.view', 'asset.category.create', 'asset.category.edit', 'asset.category.delete',
        'asset.location.view', 'asset.location.create', 'asset.location.edit', 'asset.location.delete',
        'asset.transfer.view', 'asset.transfer.create', 'asset.transfer.edit',
        'asset.disposal.view', 'asset.disposal.create', 'asset.disposal.edit', 'asset.disposal.delete',
        'asset.item.view', 'asset.item.create', 'asset.item.edit', 'asset.item.delete',
        'organization.view', 'organization.create', 'organization.edit', 'organization.delete',
        'department.view', 'department.edit',
        'employee.view', 'employee.edit',
        'role.view', 'role.create', 'role.edit', 'role.delete',
        'permission.view', 'permission.create', 'permission.edit', 'permission.delete',
        'setting.edit',
    ];

    /**
     * Role super-admin: sengaja TANPA permission di database — Gate::before
     * yang memberi akses penuh (pola "super-admin" laravel-permission v8).
     */
    public const SUPER_ADMIN = 'super-admin';

    /**
     * Role lain beserta izinnya. administrator selalu dapat seluruh katalog.
     *
     * @var array<string, array<int, string>>
     */
    public const ROLE_PERMISSIONS = [
        'administrator' => ['*'],
        'manager' => [
            'audit.view',
            'asset.view', 'asset.create', 'asset.edit',
            'asset.classification.view', 'asset.classification.create', 'asset.classification.edit',
            'asset.category.view', 'asset.category.create', 'asset.category.edit',
            'asset.location.view', 'asset.location.create', 'asset.location.edit',
            'asset.transfer.view', 'asset.transfer.create', 'asset.transfer.edit',
            'asset.disposal.view', 'asset.disposal.create', 'asset.disposal.edit',
            'asset.item.view', 'asset.item.create', 'asset.item.edit',
            'department.view',
            'employee.view',
        ],
        'staff-asset' => [
            'audit.view',
            'asset.view',
            'asset.classification.view',
            'asset.category.view',
            'asset.location.view',
            'asset.transfer.view',
            'asset.item.view',
            'employee.view',
        ],
        'akunting' => [
            'audit.view',
            'asset.view',
            'asset.classification.view',
            'asset.category.view',
            'asset.location.view',
            'asset.transfer.view',
            'asset.disposal.view', 'asset.disposal.edit',
            'setting.edit',
        ],
    ];

    public function run(): void
    {
        // Clean slate: rebuild the whole catalogue and every assignment so a
        // re-run always reflects the current configuration, never stale rows.
        foreach (['role_has_permissions', 'model_has_roles', 'model_has_permissions', 'roles', 'permissions'] as $table) {
            DB::table($table)->delete();
        }

        app(PermissionRegistrar::class)->forgetCachedPermissions();

        foreach (self::PERMISSIONS as $name) {
            Permission::create(['name' => $name, 'guard_name' => 'web']);
        }

        // DatabaseSeeder disables model events, so Permission::create does not
        // refresh the registrar cache; flush it now that every row exists.
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        Role::create(['name' => self::SUPER_ADMIN, 'guard_name' => 'web']);

        foreach (self::ROLE_PERMISSIONS as $roleName => $permissions) {
            $role = Role::create(['name' => $roleName, 'guard_name' => 'web']);
            $role->syncPermissions($permissions === ['*']
                ? self::PERMISSIONS
                : $permissions);
        }

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }
}
