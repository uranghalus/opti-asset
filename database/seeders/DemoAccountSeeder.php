<?php

namespace Database\Seeders;

use App\Models\Department;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

class DemoAccountSeeder extends Seeder
{
    /**
     * Password default untuk semua akun demo.
     */
    public const PASSWORD = 'password';

    /**
     * Domain email untuk akun demo.
     */
    public const EMAIL_DOMAIN = 'opti-asset.local';

    /**
     * Role yang akan dibuat untuk setiap department di setiap tenant.
     */
    public const DEMO_ROLES = [
        'administrator',
        'manager',
        'staff-asset',
        'akunting',
    ];

    /**
     * Dapatkan atau buat role bila belum ada.
     */
    private function ensureRole(string $name): void
    {
        Role::findOrCreate($name, 'web');
    }

    /**
     * Buat satu user demo.
     */
    private function createDemoUser(
        string $email,
        string $name,
        string $tenantId,
        string $departmentId,
        string $departmentName,
        string $role
    ): void {
        $user = User::updateOrCreate(
            ['email' => $email],
            [
                'name' => $name,
                'password' => Hash::make(self::PASSWORD),
                'tenant_id' => $tenantId,
                'department' => $departmentId,
                'is_super_admin' => $role === 'super-admin',
                'email_verified_at' => now(),
            ]
        );

        $user->assignRole($role);
    }

    public function run(): void
    {
        // Pastikan role sudah ada (RolePermissionSeeder biasanya sudah dijalankan).
        foreach (self::DEMO_ROLES as $role) {
            $this->ensureRole($role);
        }
        $this->ensureRole('super-admin');

        // --- Super admin (platform-wide, tidak tenant-specific) ---
        User::updateOrCreate(
            ['email' => 'superadmin@opti-asset.local'],
            [
                'name' => 'Super Admin Demo',
                'password' => Hash::make(self::PASSWORD),
                'tenant_id' => null,
                'department' => null,
                'is_super_admin' => true,
                'email_verified_at' => now(),
            ]
        )->assignRole('super-admin');

        // --- Tenant A ---
        $tenantA = Tenant::updateOrCreate(
            ['code' => 'tenant-a'],
            [
                'name' => 'Tenant A Demo',
                'optigate_company_id' => 1001,
                'is_active' => true,
            ]
        );

        $deptAIt = Department::withoutGlobalScopes()->updateOrCreate(
            ['tenant_id' => $tenantA->id, 'kode_department' => 'IT'],
            [
                'nama_department' => 'Teknologi Informasi',
            ]
        );

        $deptAHr = Department::withoutGlobalScopes()->updateOrCreate(
            ['tenant_id' => $tenantA->id, 'kode_department' => 'HR'],
            [
                'nama_department' => 'Sumber Daya Manusia',
            ]
        );

        foreach ([$deptAIt, $deptAHr] as $dept) {
            $this->createDemoUser(
                "admin.{$dept->kode_department}.{$tenantA->code}@".self::EMAIL_DOMAIN,
                "Admin {$dept->nama_department} {$tenantA->name}",
                $tenantA->id,
                $dept->id_department,
                $dept->nama_department,
                'administrator'
            );
            $this->createDemoUser(
                "mgr.{$dept->kode_department}.{$tenantA->code}@".self::EMAIL_DOMAIN,
                "Manager {$dept->nama_department} {$tenantA->name}",
                $tenantA->id,
                $dept->id_department,
                $dept->nama_department,
                'manager'
            );
            $this->createDemoUser(
                "staff.{$dept->kode_department}.{$tenantA->code}@".self::EMAIL_DOMAIN,
                "Staff Asset {$dept->nama_department} {$tenantA->name}",
                $tenantA->id,
                $dept->id_department,
                $dept->nama_department,
                'staff-asset'
            );
            $this->createDemoUser(
                "akun.{$dept->kode_department}.{$tenantA->code}@".self::EMAIL_DOMAIN,
                "Akunting {$dept->nama_department} {$tenantA->name}",
                $tenantA->id,
                $dept->id_department,
                $dept->nama_department,
                'akunting'
            );
        }

        // --- Tenant B ---
        $tenantB = Tenant::updateOrCreate(
            ['code' => 'tenant-b'],
            [
                'name' => 'Tenant B Demo',
                'optigate_company_id' => 1002,
                'is_active' => true,
            ]
        );

        $deptBGudang = Department::withoutGlobalScopes()->updateOrCreate(
            ['tenant_id' => $tenantB->id, 'kode_department' => 'GUDANG'],
            [
                'nama_department' => 'Gudang',
            ]
        );

        $deptBKeuangan = Department::withoutGlobalScopes()->updateOrCreate(
            ['tenant_id' => $tenantB->id, 'kode_department' => 'KEUANGAN'],
            [
                'nama_department' => 'Keuangan',
            ]
        );

        foreach ([$deptBGudang, $deptBKeuangan] as $dept) {
            $this->createDemoUser(
                "admin.{$dept->kode_department}.{$tenantB->code}@".self::EMAIL_DOMAIN,
                "Admin {$dept->nama_department} {$tenantB->name}",
                $tenantB->id,
                $dept->id_department,
                $dept->nama_department,
                'administrator'
            );
            $this->createDemoUser(
                "mgr.{$dept->kode_department}.{$tenantB->code}@".self::EMAIL_DOMAIN,
                "Manager {$dept->nama_department} {$tenantB->name}",
                $tenantB->id,
                $dept->id_department,
                $dept->nama_department,
                'manager'
            );
            $this->createDemoUser(
                "staff.{$dept->kode_department}.{$tenantB->code}@".self::EMAIL_DOMAIN,
                "Staff Asset {$dept->nama_department} {$tenantB->name}",
                $tenantB->id,
                $dept->id_department,
                $dept->nama_department,
                'staff-asset'
            );
            $this->createDemoUser(
                "akun.{$dept->kode_department}.{$tenantB->code}@".self::EMAIL_DOMAIN,
                "Akunting {$dept->nama_department} {$tenantB->name}",
                $tenantB->id,
                $dept->id_department,
                $dept->nama_department,
                'akunting'
            );
        }
    }
}
