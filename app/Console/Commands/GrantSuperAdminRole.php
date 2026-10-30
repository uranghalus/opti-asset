<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Gate;
use Spatie\Permission\PermissionRegistrar;

/**
 * Per-release repair step for the platform super-admin account.
 *
 * The account matching config('auth.super_admin_email') —
 * superadmin@appdutamall.com by default — must always carry both the
 * `is_super_admin` flag and the Spatie `super-admin` role. This command is
 * additive only: no deletes, no truncates, never touches tenant_id, never
 * overwrites an existing (or conflicting) employee link.
 *
 * Idempotent: safe to run any time; a second run changes nothing.
 * --dry-run prints the plan without writing.
 */
#[Signature('app:grant-super-admin-role {--dry-run : Tampilkan rencana tanpa mengubah data.}')]
#[Description('Pastikan akun platform memiliki peran super-admin, flag is_super_admin, dan akses penuh via Gate::before (idempoten, hanya menambah).')]
class GrantSuperAdminRole extends Command
{
    public function handle(): int
    {
        $email = config('auth.super_admin_email');

        if (! is_string($email) || $email === '') {
            $this->error('config(auth.super_admin_email) kosong: tidak ada akun untuk diperbaiki.');

            return self::FAILURE;
        }

        $dryRun = (bool) $this->option('dry-run');
        $this->line($dryRun ? "[dry-run] {$email}" : "Memperbaiki {$email}");

        $user = User::where('email', $email)->first();

        if ($user === null) {
            $this->error('Akun platform belum ada: jalankan db:seed lebih dulu.');

            return self::FAILURE;
        }

        $this->line('  akun: '.$user->email.' (id '.$user->getKey().')');

        $changed = false;

        // Ensure the is_super_admin flag.
        if (! $user->is_super_admin) {
            $this->line('  [flag] is_super_admin = true');
            if (! $dryRun) {
                $user->forceFill(['is_super_admin' => true])->save();
                $changed = true;
            }
        } else {
            $this->line('  [flag] is_super_admin = true (sudah ada)');
        }

        // Ensure the Spatie super-admin role.
        if (! $user->hasRole('super-admin')) {
            $this->line('  [role] super-admin assigned');
            if (! $dryRun) {
                $user->assignRole('super-admin');
                app(PermissionRegistrar::class)->forgetCachedPermissions();
                $changed = true;
            }
        } else {
            $this->line('  [role] super-admin (sudah ada)');
        }

        // Ensure Gate::before recognises the account.
        if ($changed || $user->isSuperAdmin()) {
            $this->line('  [gate] Gate::before will return true for all abilities');
        }

        if (! $changed) {
            $this->line('  tidak ada perubahan.');
        }

        return self::SUCCESS;
    }
}
