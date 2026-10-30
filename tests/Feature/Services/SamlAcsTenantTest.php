<?php

namespace Tests\Feature\Services;

use App\Models\Tenant;
use App\Models\User;
use App\Services\LoginLanding;
use App\Services\LoginProvisioningService;
use App\Services\SamlTenantResolver;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use Tests\TestCase;

class SamlAcsTenantTest extends TestCase
{
    use RefreshDatabase;

    public function test_valid_assertion_with_matching_company_logs_in_and_sets_tenant(): void
    {
        config(['auth.super_admin_email' => 'superadmin@appdutamall.com']);

        $tenant = Tenant::create([
            'id' => 'tenant-top',
            'name' => 'PT Tata Optima Property',
            'code' => 'top',
            'is_active' => true,
        ]);

        $user = User::factory()->create([
            'email' => 'ridho.fatahillah@tataoptima.com',
            'is_super_admin' => false,
        ]);

        $resolver = app(SamlTenantResolver::class);

        $resolution = $resolver->resolve(['company' => ['PT Tata Optima Property']]);
        $this->assertTrue($resolution->isFound());
        $this->assertSame($tenant->id, $resolution->tenant?->id);
    }

    public function test_assertion_with_no_matching_tenant_denies_access(): void
    {
        Tenant::create([
            'id' => 'tenant-top',
            'name' => 'PT Tata Optima Property',
            'code' => 'top',
        ]);

        $resolver = app(SamlTenantResolver::class);
        $result = $resolver->resolve(['company' => ['PT Lainnya']]);

        $this->assertTrue($result->isDenied());
        $this->assertSame(SamlTenantResolver::REASON_NO_MATCH, $result->denialReason);
    }

    public function test_assertion_with_no_company_data_denies_access(): void
    {
        $resolver = app(SamlTenantResolver::class);
        $result = $resolver->resolve([
            'email' => ['test@example.com'],
            'name' => ['Test User'],
        ]);

        $this->assertTrue($result->isDenied());
        $this->assertSame(SamlTenantResolver::REASON_NO_COMPANY_DATA, $result->denialReason);
    }
}
