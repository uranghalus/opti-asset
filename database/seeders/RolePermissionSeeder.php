<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RolePermissionSeeder extends Seeder
{
    /**
     * Katalog izin (permission) aplikasi.
     *
     * @var array<int, string>
     */
    public const PERMISSIONS = [
        'dashboard.view',
        'audit.view', 'audit.export',
        'asset.view', 'asset.create', 'asset.edit', 'asset.delete',
        'asset.item.view', 'asset.item.create', 'asset.item.edit', 'asset.item.delete',
        'asset.classification.view', 'asset.classification.create', 'asset.classification.edit', 'asset.classification.delete',
        'asset.category.view', 'asset.category.create', 'asset.category.edit', 'asset.category.delete',
        'asset.location.view', 'asset.location.create', 'asset.location.edit', 'asset.location.delete',
        'asset.transfer.view', 'asset.transfer.create', 'asset.transfer.edit', 'asset.transfer.delete',
        'asset.disposal.view', 'asset.disposal.create', 'asset.disposal.edit', 'asset.disposal.delete',
        'asset.maintenance.view', 'asset.maintenance.create', 'asset.maintenance.edit', 'asset.maintenance.delete',
        'inventory.view', 'inventory.create', 'inventory.edit', 'inventory.delete',
        'inventory.stock.view', 'inventory.stock.adjust',
        'organization.view', 'organization.create', 'organization.edit', 'organization.delete',
        'user.view', 'user.create', 'user.edit', 'user.delete',
        'role.view', 'role.create', 'role.edit', 'role.delete',
        'permission.view', 'permission.create', 'permission.edit', 'permission.delete',
        'setting.view', 'setting.edit',
        'employee.view', 'employee.edit',
        'department.view',
    ];

    /**
     * Role super-admin: sengaja TANPA permission di database — Gate::before
     * yang memberi akses penuh (docs laravel-permission "super-admin").
     *
     * @var array<int, string>
     */
    public const SUPER_ADMIN_ROLES = ['super-admin'];

    public function run(): void
    {
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        foreach (self::PERMISSIONS as $name) {
            Permission::findOrCreate($name, 'web');
        }

        // DatabaseSeeder disables model events, so Permission::create does not
        // refresh the registrar cache; flush it now that every row exists.
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        Role::findOrCreate('super-admin', 'web');

        $administrator = Role::findOrCreate('administrator', 'web');
        $administrator->syncPermissions(self::PERMISSIONS);

        $manager = Role::findOrCreate('manager', 'web');
        $manager->syncPermissions([
            'dashboard.view', 'audit.view',
            'asset.view', 'asset.create', 'asset.edit',
            'asset.item.view', 'asset.item.create', 'asset.item.edit',
            'asset.classification.view', 'asset.classification.create', 'asset.classification.edit',
            'asset.category.view', 'asset.category.create', 'asset.category.edit',
            'asset.location.view', 'asset.location.create', 'asset.location.edit',
            'asset.transfer.view', 'asset.transfer.create', 'asset.transfer.edit',
            'asset.maintenance.view', 'asset.maintenance.create',
            'inventory.view', 'inventory.create', 'inventory.edit',
            'inventory.stock.view', 'inventory.stock.adjust',
        ]);

        $staff = Role::findOrCreate('staff-asset', 'web');
        $staff->syncPermissions([
            'dashboard.view', 'audit.view',
            'asset.view',
            'asset.item.view', 'asset.item.create', 'asset.item.edit', 'asset.item.delete',
            'asset.classification.view',
            'asset.category.view',
            'asset.location.view',
            'asset.transfer.view',
            'inventory.view',
            'inventory.stock.view',
        ]);

        $accounting = Role::findOrCreate('akunting', 'web');
        $accounting->syncPermissions([
            'dashboard.view', 'audit.view',
            'asset.view',
            'asset.item.view',
            'asset.classification.view',
            'asset.category.view',
            'asset.location.view',
            'inventory.view',
            'inventory.stock.view',
        ]);

        app()[PermissionRegistrar::class]->forgetCachedPermissions();
    }
}
