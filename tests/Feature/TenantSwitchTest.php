<?php

namespace Tests\Feature;

use App\Models\ActivityLog;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

class TenantSwitchTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenantA;

    private Tenant $tenantB;

    private Tenant $tenantC;

    private User $admin;

    private User $manager;

    protected function setUp(): void
    {
        parent::setUp();

        if (DB::getDriverName() === 'sqlite') {
            DB::statement('PRAGMA foreign_keys = ON');
        }

        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        $this->tenantA = Tenant::create(['id' => 'tenant-a', 'name' => 'Tenant A']);
        $this->tenantB = Tenant::create(['id' => 'tenant-b', 'name' => 'Tenant B']);
        $this->tenantC = Tenant::create(['id' => 'tenant-c', 'name' => 'Tenant C']);

        Permission::firstOrCreate(['name' => 'tenant.switch', 'guard_name' => 'web']);

        $roleAdmin = Role::create(['name' => 'administrator', 'guard_name' => 'web']);
        $roleAdmin->givePermissionTo('tenant.switch');

        $roleManager = Role::create(['name' => 'manager', 'guard_name' => 'web']);

        $this->admin = User::factory()->create();
        $this->admin->assignRole($roleAdmin);
        $this->admin->tenants()->sync([$this->tenantA->id, $this->tenantB->id]);

        $this->manager = User::factory()->create();
        $this->manager->assignRole($roleManager);
        $this->manager->tenants()->sync([$this->tenantA->id]);
    }

    public function test_switch_denied_without_permission(): void
    {
        $response = $this->actingAs($this->manager)
            ->withSession(['current_tenant_id' => $this->tenantA->id])
            ->post(route('tenant.switch', ['tenant_id' => $this->tenantB->id]));

        $this->assertSame(403, $response->getStatusCode());
        $this->assertNull(ActivityLog::where('action', 'tenant.switch')->first());
    }

    public function test_switch_denied_for_unassigned_tenant(): void
    {
        $response = $this->actingAs($this->admin)
            ->withSession(['current_tenant_id' => $this->tenantA->id])
            ->post(route('tenant.switch', ['tenant_id' => $this->tenantC->id]));

        $this->assertSame(403, $response->getStatusCode());
        $this->assertSame($this->tenantA->id, session('current_tenant_id'));
    }

    public function test_switch_success_for_administrator(): void
    {
        $this->actingAs($this->admin)
            ->withSession(['current_tenant_id' => $this->tenantA->id])
            ->post(route('tenant.switch', ['tenant_id' => $this->tenantB->id]))
            ->assertRedirect(route('dashboard'))
            ->assertSessionHas('inertia.flash_data.toast');

        $this->assertSame($this->tenantB->id, session('current_tenant_id'));

        $log = ActivityLog::where('action', 'tenant.switch')->first();
        $this->assertNotNull($log);
        $this->assertSame($this->tenantA->id, $log->properties['from_tenant_id']);
        $this->assertSame($this->tenantB->id, $log->properties['to_tenant_id']);
    }

    public function test_switch_idempotent_re_select_active_tenant(): void
    {
        $response = $this->actingAs($this->admin)
            ->withSession(['current_tenant_id' => $this->tenantA->id])
            ->post(route('tenant.switch', ['tenant_id' => $this->tenantA->id]))
            ->assertRedirect(route('dashboard'));

        $this->assertSame($this->tenantA->id, session('current_tenant_id'));
        $this->assertStringContainsString('sudah aktif', $response->session('inertia.flash_data.toast.message'));
    }

    public function test_switch_clears_stale_session_for_deleted_tenant(): void
    {
        $this->tenantC->delete();

        $this->actingAs($this->admin)
            ->withSession(['current_tenant_id' => $this->tenantC->id])
            ->get(route('dashboard'))
            ->assertOk();

        $this->assertSame($this->tenantA->id, session('current_tenant_id'));
    }

    public function test_super_admin_can_switch_any_tenant(): void
    {
        $superAdmin = User::factory()->create();
        $superAdmin->assignRole(Role::findOrCreate('super-admin', 'web'));

        $this->actingAs($superAdmin)
            ->withSession(['current_tenant_id' => $this->tenantA->id])
            ->post(route('tenant.switch', ['tenant_id' => $this->tenantC->id]))
            ->assertRedirect(route('dashboard'));

        $this->assertSame($this->tenantC->id, session('current_tenant_id'));
    }

    public function test_unauthenticated_redirected_to_login(): void
    {
        $this->post(route('tenant.switch', ['tenant_id' => $this->tenantB->id]))
            ->assertRedirect('/auth/saml/login');
    }

    public function test_available_tenants_limited_to_assigned(): void
    {
        $this->actingAs($this->admin)
            ->get(route('dashboard'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('availableTenants.0.id', 'tenant-a')
                ->where('availableTenants.1.id', 'tenant-b'));
    }

    public function test_single_tenant_shows_static_label(): void
    {
        $single = User::factory()->create();
        $single->assignRole(Role::findOrCreate('administrator', 'web'));
        $single->tenants()->sync([$this->tenantA->id]);

        $this->actingAs($single)
            ->get(route('dashboard'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('availableTenants', 1)
                ->where('auth.canSwitchTenant', false));
    }

    public function test_audit_log_written_on_switch(): void
    {
        $this->actingAs($this->admin)
            ->withSession(['current_tenant_id' => $this->tenantA->id])
            ->post(route('tenant.switch', ['tenant_id' => $this->tenantB->id]))
            ->assertRedirect(route('dashboard'));

        $log = ActivityLog::where('action', 'tenant.switch')->first();
        $this->assertNotNull($log);
        $this->assertArrayHasKey('from_tenant_id', $log->properties);
        $this->assertArrayHasKey('to_tenant_id', $log->properties);
    }

    public function test_rate_limiting_on_switch(): void
    {
        $this->actingAs($this->admin)
            ->withSession(['current_tenant_id' => $this->tenantA->id]);

        for ($i = 0; $i < 5; $i++) {
            $this->post(route('tenant.switch', ['tenant_id' => $this->tenantB->id]));
        }

        $this->post(route('tenant.switch', ['tenant_id' => $this->tenantB->id]))
            ->assertStatus(429);
    }
}
