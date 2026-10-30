<?php

namespace Tests\Feature\Services;

use App\Models\Tenant;
use App\Models\User;
use App\Services\LoginLanding;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use Tests\TestCase;

class LoginLandingTest extends TestCase
{
    use RefreshDatabase;

    public function test_super_admin_redirects_to_admin_dashboard(): void
    {
        $landing = new LoginLanding();
        $user = User::factory()->create(['is_super_admin' => true]);

        $response = $landing->redirect($user);

        $this->assertSame(route('admin.dashboard'), $response->getTargetUrl());
    }

    public function test_user_with_home_tenant_redirects_to_tenant_dashboard(): void
    {
        \Spatie\Permission\Models\Role::firstOrCreate([
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

        $landing = new LoginLanding();
        $response = $landing->redirect($user);

        $this->assertSame(route('tenant.dashboard', ['tenant' => $tenant->code]), $response->getTargetUrl());
    }

    public function test_user_with_roles_but_no_tenant_is_denied_with_no_tenant(): void
    {
        Auth::guard('web')->login(User::factory()->create());

        $landing = new LoginLanding();
        $response = $landing->deny('no_tenant');

        $this->assertFalse(Auth::check());
        $this->assertSame(route('saml.denied'), $response->getTargetUrl());
        $this->assertSame('no_tenant', session('saml.denial_reason'));
    }

    public function test_user_with_no_roles_is_denied_with_no_role(): void
    {
        Auth::guard('web')->login(User::factory()->create());

        $landing = new LoginLanding();
        $response = $landing->deny('no_role');

        $this->assertFalse(Auth::check());
        $this->assertSame(route('saml.denied'), $response->getTargetUrl());
        $this->assertSame('no_role', session('saml.denial_reason'));
    }
}
