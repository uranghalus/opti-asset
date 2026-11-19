<?php

namespace Tests\Feature;

use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

/**
 * Feedback loop for the login redirect bug.
 *
 * Symptom: after login, user is directed to /tenants instead of /{tenant_code}/dashboard.
 *
 * This loop reproduces the symptom by simulating a logged-in user hitting the home route (/)
 * and asserting the redirect destination.
 */
class LoginRedirectTest extends TestCase
{
    use RefreshDatabase;

    public function test_home_redirects_non_super_admin_to_tenant_dashboard_not_tenants(): void
    {
        // Arrange: a tenant and a non-super-admin user with tenant_id + role
        $tenant = Tenant::create([
            'id' => 'tenant-top',
            'code' => 'TOP',
            'name' => 'PT Tata Optima Property',
            'is_active' => true,
        ]);

        Role::firstOrCreate(['name' => 'karyawan', 'guard_name' => 'web']);

        $user = User::factory()->create([
            'email' => 'karyawan@example.com',
            'tenant_id' => $tenant->id,
            'is_super_admin' => false,
        ]);
        $user->assignRole('karyawan');

        // Act: simulate being logged in, hit the home route
        $this->actingAs($user);
        $response = $this->get('/');

        // Assert: should go to tenant dashboard, NOT /tenants
        $response->assertRedirect(route('tenant.dashboard', ['tenant' => $tenant->code]));
        $this->assertStringNotContainsString('/tenants', $response->headers->get('Location'));
    }

    public function test_home_redirects_user_without_tenant_to_tenants(): void
    {
        // Arrange: authenticated user with no tenant_id
        Role::firstOrCreate(['name' => 'karyawan', 'guard_name' => 'web']);

        $user = User::factory()->create([
            'email' => 'note@example.com',
            'tenant_id' => null,
            'is_super_admin' => false,
        ]);
        $user->assignRole('karyawan');

        // Act
        $this->actingAs($user);
        $response = $this->get('/');

        // Assert: goes to tenants.index (/tenants)
        $response->assertRedirect(route('tenants.index'));
    }
}
