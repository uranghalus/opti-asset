<?php

namespace App\Console\Commands;

use App\Models\Employee;
use App\Models\User;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection as EloquentCollection;
use Illuminate\Support\Facades\Log;

#[Signature('users:link-employees {--dry-run}')]
#[Description('Hubungkan user login ke employee berdasarkan email: tenant sama diprioritaskan, cross-tenant unik diberi peringatan, ambigu dilewati.')]
class LinkUsersToEmployees extends Command
{
    /**
     * Number of users processed per query chunk.
     */
    protected const CHUNK_SIZE = 100;

    public function handle(): int
    {
        $dryRun = (bool) $this->option('dry-run');

        $linked = 0;
        $crossTenant = 0;
        $ambiguous = 0;
        $skipped = 0;

        User::query()->chunkById(static::CHUNK_SIZE, function (EloquentCollection $users) use ($dryRun, &$linked, &$crossTenant, &$ambiguous, &$skipped): void {
            foreach ($users as $user) {
                // Idempotency: users already linked are left untouched.
                if ($user->employee_id !== null) {
                    $skipped++;

                    continue;
                }

                $sameTenantEmployee = $this->findSameTenantEmployee($user);

                if ($sameTenantEmployee !== null) {
                    if ($this->linkEmployee($user, $sameTenantEmployee, $dryRun)) {
                        $linked++;
                    } else {
                        $skipped++;
                    }

                    continue;
                }

                $candidates = $this->findCrossTenantEmployees($user);
                $employee = $candidates->first();

                // No employee with this email anywhere: plain skip.
                if ($employee === null) {
                    $skipped++;

                    continue;
                }

                $tenantIds = $candidates->pluck('tenant_id')->unique();

                // Same email in 2+ other tenants: ambiguous, skip and warn.
                if ($tenantIds->count() > 1) {
                    $ambiguous++;
                    Log::warning('users.link-employees ambiguous', [
                        'user_id' => $user->id,
                        'email' => $user->email,
                        'tenant_ids' => $tenantIds->values()->all(),
                    ]);

                    continue;
                }

                // Same email in exactly one other tenant: link but warn.
                if ($this->linkEmployee($user, $employee, $dryRun)) {
                    $crossTenant++;
                    Log::warning('users.link-employees cross-tenant', [
                        'user_id' => $user->id,
                        'email' => $user->email,
                        'employee_id' => $employee->id_employee,
                        'tenant_id' => $employee->tenant_id,
                    ]);
                } else {
                    $skipped++;
                }
            }
        });

        $this->info('Pengaitan user ke employee selesai!');
        $this->line("  linked: {$linked}");
        $this->line("  cross_tenant: {$crossTenant}");
        $this->line("  ambiguous: {$ambiguous}");
        $this->line("  skipped: {$skipped}");
        $this->line('  dry_run: '.($dryRun ? 'yes' : 'no'));

        Log::info('users.link-employees: selesai.', [
            'linked' => $linked,
            'cross_tenant' => $crossTenant,
            'ambiguous' => $ambiguous,
            'skipped' => $skipped,
            'dry_run' => $dryRun,
        ]);

        return Command::SUCCESS;
    }

    /**
     * Find the employee with the same email inside the user's tenant.
     *
     * Duplicate emails within one tenant are not ambiguous: pick exactly
     * one, ordered by the lowest id_employee.
     */
    private function findSameTenantEmployee(User $user): ?Employee
    {
        return Employee::withoutGlobalScopes()
            ->where('email', $user->email)
            ->where('tenant_id', $user->tenant_id)
            ->orderBy('id_employee')
            ->first();
    }

    /**
     * Find employees with the same email in tenants other than the user's.
     *
     * @return EloquentCollection<int, Employee>
     */
    private function findCrossTenantEmployees(User $user): EloquentCollection
    {
        return Employee::withoutGlobalScopes()
            ->where('email', $user->email)
            ->when(
                $user->tenant_id !== null,
                fn (Builder $query): Builder => $query->where('tenant_id', '!=', $user->tenant_id),
                fn (Builder $query): Builder => $query->whereNotNull('tenant_id'),
            )
            ->orderBy('id_employee')
            ->get();
    }

    /**
     * Persist the user-employee link unless this is a dry run.
     *
     * Returns false — without touching the database — when the employee is
     * already linked to a different user, which would violate the unique
     * users.employee_id index; the caller counts that user as skipped.
     */
    private function linkEmployee(User $user, Employee $employee, bool $dryRun): bool
    {
        if ($this->isEmployeeLinkedToOtherUser($user, $employee)) {
            Log::warning('users.link-employees employee-already-linked', [
                'user_id' => $user->id,
                'email' => $user->email,
                'employee_id' => $employee->id_employee,
                'tenant_id' => $employee->tenant_id,
            ]);

            return false;
        }

        if ($dryRun) {
            return true;
        }

        $user->update(['employee_id' => $employee->id_employee]);

        return true;
    }

    /**
     * Whether the employee is already linked to a user other than the given one.
     */
    private function isEmployeeLinkedToOtherUser(User $user, Employee $employee): bool
    {
        return User::query()
            ->where('employee_id', $employee->id_employee)
            ->where('id', '!=', $user->id)
            ->exists();
    }
}
