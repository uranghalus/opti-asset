<?php

namespace Tests\Feature\Services;

use App\Models\Tenant;
use App\Models\User;
use App\Services\LoginLanding;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class LoginLandingTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_with_home_tenant_redirects_to_tenant_dashboard(): void
    {
        Role::firstOrCreate([
            'name' => 'karyawan',
            'guard_name' => 'web',
        ]);

        $tenant = Tenant::create([
            'id' => 'tenant-top',
            'code' => 'top',
            'name' => 'PT Tata Optima Property',
        ]);
        $user = User::factory()->create([
            'tenant_id' => $tenant->id,
        ]);
        $user->assignRole('karyawan');

        $landing = new LoginLanding;
        $response = $landing->redirect($user);

        $this->assertSame(route('tenant.dashboard', ['tenant' => $tenant->code]), $response->getTargetUrl());
    }

    public function test_user_with_roles_but_no_tenant_is_denied_with_no_tenant(): void
    {
        Auth::guard('web')->login(User::factory()->create());

        $landing = new LoginLanding;
        $response = $landing->deny('no_tenant');

        $this->assertFalse(Auth::check());
        $this->assertSame(route('saml.denied'), $response->getTargetUrl());
        $this->assertSame('no_tenant', session('saml.denial_reason'));
    }

    public function test_user_with_no_roles_is_denied_with_no_role(): void
    {
        Auth::guard('web')->login(User::factory()->create());

        $landing = new LoginLanding;
        $response = $landing->deny('no_role');

        $this->assertFalse(Auth::check());
        $this->assertSame(route('saml.denied'), $response->getTargetUrl());
        $this->assertSame('no_role', session('saml.denial_reason'));
    }

    public function test_session_tenant_is_preferred_over_user_tenant_id(): void
    {
        Role::firstOrCreate([
            'name' => 'karyawan',
            'guard_name' => 'web',
        ]);

        $sessionTenant = Tenant::create([
            'id' => 'tenant-session',
            'code' => 'session',
            'name' => 'Session Tenant',
        ]);
        $fallbackTenant = Tenant::create([
            'id' => 'tenant-fallback',
            'code' => 'fallback',
            'name' => 'Fallback Tenant',
        ]);

        $user = User::factory()->create([
            'tenant_id' => $fallbackTenant->id,
        ]);
        $user->assignRole('karyawan');

        // SAML-resolved tenant stored in session must win over $user->tenant_id.
        session()->put('saml.tenant', $sessionTenant);

        $landing = new LoginLanding;
        $response = $landing->redirect($user);

        $this->assertSame(route('tenant.dashboard', ['tenant' => $sessionTenant->code]), $response->getTargetUrl());
    }

    public function test_user_with_role_but_no_tenant_is_denied(): void
    {
        Role::firstOrCreate([
            'name' => 'karyawan',
            'guard_name' => 'web',
        ]);

        session()->forget('saml.tenant');

        $user = User::factory()->create(); // no tenant_id
        $user->assignRole('karyawan');
        Auth::guard('web')->login($user);

        $landing = new LoginLanding;
        $response = $landing->redirect($user);

        $this->assertFalse(Auth::check());
        $this->assertSame(route('saml.denied'), $response->getTargetUrl());
        $this->assertSame('no_tenant', session('saml.denial_reason'));
    }
}
