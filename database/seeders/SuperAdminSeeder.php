<?php

namespace Database\Seeders;

use App\Models\Employee;
use App\Models\User;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;

class SuperAdminSeeder extends Seeder
{
    /**
     * Email akun super-admin bootstrap. Dibuat bila belum ada dan selalu
     * mendapat role super-admin (akses tanpa batas via Gate::before).
     */
    public const EMAIL = 'superadmin@appdutamall.com';

    public const SUPER_ADMIN_ROLE = 'super-admin';

    public function run(): void
    {
        Role::findOrCreate(self::SUPER_ADMIN_ROLE, 'web');

        $user = User::firstOrCreate(
            ['email' => self::EMAIL],
            [
                'name' => 'Super Admin',
                'password' => null,
                'is_super_admin' => true,
            ],
        );

        // Ensure the flag is set even if the account already existed.
        if (! $user->is_super_admin) {
            $user->forceFill(['is_super_admin' => true])->save();
        }

        $user->assignRole(self::SUPER_ADMIN_ROLE);

        // Bridge Employee→User menyalin role saat login; beri role yang sama
        // di sisi Employee bila ada, agar sinkronisasi tidak menghapusnya.
        $employee = Employee::withoutGlobalScopes()
            ->where('email', self::EMAIL)
            ->first();

        $employee?->assignRole(self::SUPER_ADMIN_ROLE);
    }
}
