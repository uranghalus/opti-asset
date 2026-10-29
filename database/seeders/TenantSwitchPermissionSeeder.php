<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class TenantSwitchPermissionSeeder extends Seeder
{
    /**
     * Izin tenant.switch untuk role administrator. Non-destructive dan idempotent:
     * hanya membuat izin bila belum ada dan hanya memberikan izin ke role
     * administrator bila belum memilikinya. Tidak menyentuh role/izin lain.
     * Aman untuk di-ulang berulang kali.
     */
    public function run(): void
    {
        Permission::firstOrCreate(['name' => 'tenant.switch', 'guard_name' => 'web']);

        $role = Role::where('name', 'administrator')->first();
        if ($role && !$role->hasPermissionTo('tenant.switch')) {
            $role->givePermissionTo('tenant.switch');
        }
    }
}
