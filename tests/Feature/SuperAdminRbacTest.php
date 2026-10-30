<?php

namespace Tests\Feature;

use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Database\Seeders\SuperAdminSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

class SuperAdminRbacTest extends TestCase
{
    use RefreshDatabase;

    private const EMAIL = 'superadmin@appdutamall.com';

    protected function setUp(): void
    {
        parent::setUp();

        if (DB::getDriverName() === 'sqlite') {
            DB::statement('PRAGMA foreign_keys = ON');
        }

        app(PermissionRegistrar::class)->forgetCachedPermissions();

        // Seed the catalogue and the super-admin role (no permissions — Gate::before handles bypass).
        $this->seed(RolePermissionSeeder::class);
        $this->seed(SuperAdminSeeder::class);

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }

    /** @test */
    public function test_super_admin_email_config_defaults_to_correct_address(): void
    {
        $this->assertSame('superadmin@appdutamall.com', config('auth.super_admin_email'));
    }

    /** @test */
    public function test_bootstrap_user_has_is_super_admin_flag_and_role(): void
    {
        $user = User::where('email', self::EMAIL)->first();

        $this->assertNotNull($user);
        $this->assertTrue($user->is_super_admin);
        $this->assertTrue($user->hasRole('super-admin'));
        $this->assertTrue($user->isSuperAdmin());
    }

    /** @test */
    public function test_is_super_admin_returns_true_for_flag_only(): void
    {
        $user = User::factory()->create(['email' => 'flag-only@example.com', 'is_super_admin' => true]);

        $this->assertTrue($user->isSuperAdmin());
        $this->assertFalse($user->hasRole('super-admin'));
    }

    /** @test */
    public function test_is_super_admin_returns_true_for_role_only(): void
    {
        $user = User::factory()->create(['email' => 'role-only@example.com']);
        $user->assignRole('super-admin');

        $this->assertTrue($user->isSuperAdmin());
        $this->assertFalse((bool) $user->is_super_admin);
    }

    /** @test */
    public function test_is_super_admin_returns_true_for_both_flag_and_role(): void
    {
        $user = User::factory()->create(['email' => 'both@example.com', 'is_super_admin' => true]);
        $user->assignRole('super-admin');

        $this->assertTrue($user->isSuperAdmin());
    }

    /** @test */
    public function test_is_super_admin_returns_false_for_plain_user(): void
    {
        $user = User::factory()->create(['email' => 'plain@example.com']);

        $this->assertFalse($user->isSuperAdmin());
        $this->assertFalse((bool) $user->is_super_admin);
        $this->assertFalse($user->hasRole('super-admin'));
    }

    /** @test */
    public function test_gate_before_returns_true_for_super_admin_on_any_ability(): void
    {
        $user = User::where('email', self::EMAIL)->first();

        // An ability the user does NOT have any permission for — Gate::before must still allow.
        $this->assertTrue(Gate::forUser($user)->allows('asset.delete'));
        $this->assertTrue(Gate::forUser($user)->allows('super-admin.grant'));
        $this->assertTrue(Gate::forUser($user)->allows('anything.at.all'));
    }

    /** @test */
    public function test_gate_before_returns_null_for_plain_user_on_unknown_ability(): void
    {
        $user = User::factory()->create(['email' => 'plain@example.com']);

        $this->assertFalse(Gate::forUser($user)->allows('anything.at.all'));
    }

    /** @test */
    public function test_grant_super_admin_role_command_dry_run_does_not_change_data(): void
    {
        // Revoke everything first to simulate a broken state.
        $user = User::where('email', self::EMAIL)->first();
        $user->forceFill(['is_super_admin' => false])->save();
        $user->removeRole('super-admin');

        $this->assertFalse($user->isSuperAdmin());

        $exitCode = Artisan::call('app:grant-super-admin-role', ['--dry-run' => true]);

        $this->assertSame(0, $exitCode);

        $user->refresh();

        // Dry run must not persist anything.
        $this->assertFalse($user->is_super_admin);
        $this->assertFalse($user->hasRole('super-admin'));
    }

    /** @test */
    public function test_grant_super_admin_role_command_repairs_broken_account(): void
    {
        // Revoke everything first to simulate a broken state.
        $user = User::where('email', self::EMAIL)->first();
        $user->forceFill(['is_super_admin' => false])->save();
        $user->removeRole('super-admin');

        $this->assertFalse($user->isSuperAdmin());

        $exitCode = Artisan::call('app:grant-super-admin-role');

        $this->assertSame(0, $exitCode);

        $user->refresh();

        $this->assertTrue($user->is_super_admin);
        $this->assertTrue($user->hasRole('super-admin'));
        $this->assertTrue($user->isSuperAdmin());
        $this->assertTrue(Gate::forUser($user)->allows('asset.delete'));
    }

    /** @test */
    public function test_grant_super_admin_role_command_is_idempotent(): void
    {
        $user = User::where('email', self::EMAIL)->first();

        $exitCode1 = Artisan::call('app:grant-super-admin-role');
        $exitCode2 = Artisan::call('app:grant-super-admin-role');

        $this->assertSame(0, $exitCode1);
        $this->assertSame(0, $exitCode2);

        $this->assertTrue($user->fresh()->isSuperAdmin());
    }

    /** @test */
    public function test_super_admin_email_constant_matches_config(): void
    {
        $this->assertSame(self::EMAIL, SuperAdminSeeder::EMAIL);
        $this->assertSame(self::EMAIL, config('auth.super_admin_email'));
    }
}
