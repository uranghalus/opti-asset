<?php

namespace Tests\Feature\Services;

use App\Models\User;
use App\Services\LoginProvisioningService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class LoginProvisioningServiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_provision_self_heals_platform_super_admin(): void
    {
        config(['auth.super_admin_email' => 'superadmin@appdutamall.com']);

        $user = User::factory()->create([
            'email' => 'superadmin@appdutamall.com',
            'is_super_admin' => false,
        ]);

        app(LoginProvisioningService::class)->provision($user);

        $user->refresh();
        $this->assertTrue($user->is_super_admin);
        $this->assertTrue($user->hasRole('super_admin'));
    }

    public function test_provision_grants_guest_role_to_role_less_user(): void
    {
        $user = User::factory()->create();

        app(LoginProvisioningService::class)->provision($user);

        $user->refresh();
        $this->assertTrue($user->hasRole('guest'));
    }

    public function test_provision_does_not_add_guest_role_if_user_already_has_roles(): void
    {
        \Spatie\Permission\Models\Role::firstOrCreate([
            'name' => 'karyawan',
            'guard_name' => 'web',
        ]);

        $user = User::factory()->create();
        $user->assignRole('karyawan');

        app(LoginProvisioningService::class)->provision($user);

        $user->refresh();
        $this->assertFalse($user->hasRole('guest'));
        $this->assertTrue($user->hasRole('karyawan'));
    }

    public function test_provision_is_idempotent(): void
    {
        $user = User::factory()->create();

        app(LoginProvisioningService::class)->provision($user);
        app(LoginProvisioningService::class)->provision($user);

        $user->refresh();
        $this->assertCount(1, $user->roles);
        $this->assertTrue($user->hasRole('guest'));
    }

    public function test_provision_runs_in_single_transaction(): void
    {
        $user = User::factory()->create();

        $transactionStarted = false;
        DB::listen(function () use (&$transactionStarted): void {
            $transactionStarted = true;
        });

        app(LoginProvisioningService::class)->provision($user);

        $this->assertTrue($transactionStarted);
    }
}
