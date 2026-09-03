<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class AssetClassificationPermissionSeeder extends Seeder
{
    /**
     * Izin yang menjaga halaman Klasifikasi Aset.
     *
     * @var array<int, string>
     */
    public const PERMISSIONS = [
        'asset.classification.view',
        'asset.classification.create',
        'asset.classification.edit',
        'asset.classification.delete',
    ];

    /**
     * Idempoten: aman dijalankan ulang. Memberi keempat izin ke peran
     * super-admin tanpa menyentuh izin lain yang sudah dimiliki peran.
     */
    public function run(): void
    {
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        foreach (self::PERMISSIONS as $name) {
            Permission::findOrCreate($name, 'web');
        }

        $superAdmin = Role::findOrCreate('super-admin', 'web');
        $superAdmin->givePermissionTo(self::PERMISSIONS);

        app()[PermissionRegistrar::class]->forgetCachedPermissions();
    }
}
