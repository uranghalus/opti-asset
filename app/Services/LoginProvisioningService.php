<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Spatie\Permission\Models\Role;

/**
 * Role bootstrap at SSO login.
 *
 * Two rules, in this order, both inside one transaction and both idempotent:
 *
 * 1. The platform account (config `auth.super_admin_email`, env-fed — never
 *    an email literal in code) is self-healed: the `super_admin` role, the
 *    `is_super_admin` flag (which backs the platform surfaces TenantAccess,
 *    while the role backs Gate::before) and the link to the karyawan carrying
 *    the same email when the account is unlinked. `tenant_id` is never touched.
 * 2. Any other account with no role at all gets the zero-permission `guest`
 *    role exactly once. Until the super admin grants real roles through Hak
 *    Akses → Peran Akun, such an account can do nothing. The guard is
 *    state-based ("no role, no link"), not creation-based: it is fail-closed
 *    — an account whose roles were all wiped re-lands as guest rather than
 *    being denied at login.
 *
 * The platform check runs first: a brand-new platform account has neither
 * flag nor role yet, so a role-based check alone would leak `guest` onto it.
 */
class LoginProvisioningService
{
    private const SUPER_ADMIN_ROLE = 'super_admin';

    private const GUEST_ROLE = 'guest';

    public function provision(User $user): void
    {
        DB::transaction(function () use ($user): void {
            $this->ensurePlatformSuperAdmin($user);
            $this->ensureGuestRole($user);
        });

        $user->refresh();
    }

    private function ensurePlatformSuperAdmin(User $user): void
    {
        $superAdminEmail = config('auth.super_admin_email');

        if ($user->email !== $superAdminEmail) {
            return;
        }

        if (! $user->is_super_admin) {
            $user->update(['is_super_admin' => true]);
        }

        $role = Role::firstOrCreate(['name' => self::SUPER_ADMIN_ROLE, 'guard_name' => 'web']);

        if (! $user->hasRole(self::SUPER_ADMIN_ROLE)) {
            $user->assignRole($role);
        }

        Log::info('LoginProvisioningService: platform super-admin self-healed', [
            'email' => $user->email,
        ]);
    }

    private function ensureGuestRole(User $user): void
    {
        // Super-admin already has super_admin role; no guest role needed.
        if ($user->hasRole(self::SUPER_ADMIN_ROLE)) {
            return;
        }

        // User already has at least one role; don't add guest.
        if ($user->roles()->exists()) {
            return;
        }

        $role = Role::firstOrCreate(['name' => self::GUEST_ROLE, 'guard_name' => 'web']);
        $user->assignRole($role);

        Log::info('LoginProvisioningService: guest role assigned', [
            'email' => $user->email,
        ]);
    }
}
