<?php

namespace Tests\Feature;

use App\Models\SuperAdminGrant;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

class SuperAdminGrantTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenant;

    private User $user;

    private User $bootstrapUser;

    protected function setUp(): void
    {
        parent::setUp();

        if (DB::getDriverName() === 'sqlite') {
            DB::statement('PRAGMA foreign_keys = ON');
        }

        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        $this->tenant = Tenant::create(['id' => 'acme', 'code' => 'acme', 'name' => 'Acme Corp']);
        $this->tenant->makeCurrent();

        $this->user = User::factory()->create(['tenant_id' => $this->tenant->id]);

        // Izin pengelolaan super-admin.
        foreach (['super-admin.view', 'super-admin.grant', 'super-admin.revoke'] as $name) {
            Permission::create(['name' => $name, 'guard_name' => 'web']);
        }

        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        // Role super-admin dan akun bootstrap (mirip SuperAdminSeeder).
        $superAdminRole = Role::findOrCreate('super-admin', 'web');
        $this->bootstrapUser = User::firstOrCreate(
            ['email' => 'superadmin@appdutamall.com'],
            [
                'name' => 'Super Admin',
                'password' => null,
            ],
        );
        $this->bootstrapUser->assignRole($superAdminRole);

        // Beri izin pengelolaan super-admin pada user uji.
        foreach (['super-admin.view', 'super-admin.grant', 'super-admin.revoke'] as $name) {
            $this->user->givePermissionTo($name);
        }
    }

    /** @test */
    public function test_can_list_super_admin_grants(): void
    {
        $this->actingAs($this->user);

        $response = $this->get(route('super-admin.grants.index'));

        $response->assertStatus(200);
    }

    /** @test */
    public function test_can_grant_super_admin_to_user(): void
    {
        $this->actingAs($this->user);

        $target = User::factory()->create(['tenant_id' => $this->tenant->id]);

        $response = $this->post(route('super-admin.grants.store'), [
            'user_id' => $target->id,
            'reason' => 'Kebutuhan audit atas akses penuh.',
        ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');
        $this->assertTrue($target->fresh()->hasRole('super-admin'));

        $grant = SuperAdminGrant::where('granted_to_user_id', $target->id)
            ->whereNull('revoked_at')
            ->first();

        $this->assertNotNull($grant);
        $this->assertSame($this->user->id, $grant->granted_by_user_id);
        $this->assertSame('Kebutuhan audit atas akses penuh.', $grant->reason);
        $this->assertNotNull($grant->granted_at);
    }

    /** @test */
    public function test_can_revoke_super_admin(): void
    {
        $this->actingAs($this->user);

        $target = User::factory()->create(['tenant_id' => $this->tenant->id]);

        // Pemberian terlebih dahulu agar ada catatan aktif yang bisa dicabut.
        $this->post(route('super-admin.grants.store'), [
            'user_id' => $target->id,
            'reason' => 'Pengujian pencabutan.',
        ]);

        $this->assertTrue($target->fresh()->hasRole('super-admin'));

        $response = $this->delete(route('super-admin.grants.destroy'), [
            'user_id' => $target->id,
        ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');
        $this->assertFalse($target->fresh()->hasRole('super-admin'));

        $grant = SuperAdminGrant::where('granted_to_user_id', $target->id)
            ->latest('granted_at')
            ->first();

        $this->assertNotNull($grant);
        $this->assertNotNull($grant->revoked_at);
        $this->assertSame($this->user->id, $grant->revoked_by_user_id);
    }

    /** @test */
    public function test_cannot_grant_to_bootstrap_user(): void
    {
        $this->actingAs($this->user);

        $response = $this->post(route('super-admin.grants.store'), [
            'user_id' => $this->bootstrapUser->id,
            'reason' => 'Mencoba memberikan ulang.',
        ]);

        $response->assertRedirect();
        $response->assertSessionHasErrors('user_id');
        $this->assertTrue($this->bootstrapUser->fresh()->hasRole('super-admin'));
    }

    /** @test */
    public function test_cannot_grant_to_self(): void
    {
        $this->actingAs($this->user);

        $response = $this->post(route('super-admin.grants.store'), [
            'user_id' => $this->user->id,
            'reason' => 'Self-grant.',
        ]);

        $response->assertRedirect();
        $response->assertSessionHasErrors('user_id');
        $this->assertFalse($this->user->fresh()->hasRole('super-admin'));
    }

    /** @test */
    public function test_cannot_grant_duplicate(): void
    {
        $this->actingAs($this->user);

        $target = User::factory()->create(['tenant_id' => $this->tenant->id]);

        $this->post(route('super-admin.grants.store'), [
            'user_id' => $target->id,
            'reason' => 'Pemberian pertama.',
        ]);

        $this->assertTrue($target->fresh()->hasRole('super-admin'));

        $response = $this->post(route('super-admin.grants.store'), [
            'user_id' => $target->id,
            'reason' => 'Pemberian duplikat.',
        ]);

        $response->assertRedirect();
        $response->assertSessionHasErrors('user_id');
        $this->assertTrue($target->fresh()->hasRole('super-admin'));
    }

    /** @test */
    public function test_cannot_grant_nonexistent_user(): void
    {
        $this->actingAs($this->user);

        $response = $this->post(route('super-admin.grants.store'), [
            'user_id' => 999999,
            'reason' => 'User tidak ada.',
        ]);

        $response->assertRedirect();
        $response->assertSessionHasErrors('user_id');
    }

    /** @test */
    public function test_cannot_revoke_bootstrap_user(): void
    {
        $this->actingAs($this->user);

        $response = $this->delete(route('super-admin.grants.destroy'), [
            'user_id' => $this->bootstrapUser->id,
        ]);

        $response->assertRedirect();
        $response->assertSessionHasErrors('user_id');
        $this->assertTrue($this->bootstrapUser->fresh()->hasRole('super-admin'));
    }

    /** @test */
    public function test_cannot_revoke_self(): void
    {
        $this->actingAs($this->user);

        // User uji sementara diberi role super-admin untuk uji pencabutan diri.
        $this->user->assignRole('super-admin');

        $response = $this->delete(route('super-admin.grants.destroy'), [
            'user_id' => $this->user->id,
        ]);

        $response->assertRedirect();
        $response->assertSessionHasErrors('user_id');
        $this->assertTrue($this->user->fresh()->hasRole('super-admin'));
    }

    /** @test */
    public function test_cannot_revoke_user_without_role(): void
    {
        $this->actingAs($this->user);

        $target = User::factory()->create(['tenant_id' => $this->tenant->id]);

        $response = $this->delete(route('super-admin.grants.destroy'), [
            'user_id' => $target->id,
        ]);

        $response->assertRedirect();
        $response->assertSessionHasErrors('user_id');
    }

    /** @test */
    public function test_unauthorized_without_permission(): void
    {
        $unauthorized = User::factory()->create(['tenant_id' => $this->tenant->id]);

        $this->actingAs($unauthorized);

        $response = $this->post(route('super-admin.grants.store'), [
            'user_id' => $this->user->id,
            'reason' => 'Tanpa izin.',
        ]);

        $response->assertStatus(403);
    }
}
