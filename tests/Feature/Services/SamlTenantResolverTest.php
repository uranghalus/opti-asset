<?php

namespace Tests\Feature\Services;

use App\Models\Tenant;
use App\Models\User;
use App\Services\SamlTenantResolver;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SamlTenantResolverTest extends TestCase
{
    use RefreshDatabase;

    public function test_matches_assertion_company_by_name_and_returns_found(): void
    {
        $tenant = Tenant::create([
            'id' => 'tenant-top',
            'name' => 'PT Tata Optima Property',
            'code' => 'top',
        ]);

        $resolver = new SamlTenantResolver();
        $result = $resolver->resolve([
            'company' => ['PT Tata Optima Property'],
        ]);

        $this->assertTrue($result->isFound());
        $this->assertFalse($result->isDenied());
        $this->assertSame($tenant->id, $result->tenant?->id);
        $this->assertNull($result->denialReason);
    }

    public function test_match_is_case_insensitive(): void
    {
        Tenant::create([
            'id' => 'tenant-top',
            'name' => 'PT Tata Optima Property',
            'code' => 'top',
        ]);

        $resolver = new SamlTenantResolver();
        $result = $resolver->resolve([
            'company' => ['pt tata optima property'],
        ]);

        $this->assertTrue($result->isFound());
    }

    public function test_match_ignores_whitespace(): void
    {
        Tenant::create([
            'id' => 'tenant-top',
            'name' => 'PT Tata Optima Property',
            'code' => 'top',
        ]);

        $resolver = new SamlTenantResolver();
        $result = $resolver->resolve([
            'company' => ['  PT Tata Optima Property  '],
        ]);

        $this->assertTrue($result->isFound());
    }

    public function test_denies_when_no_company_data_in_assertion(): void
    {
        $resolver = new SamlTenantResolver();
        $result = $resolver->resolve([
            'email' => ['test@example.com'],
            'name' => ['Test User'],
        ]);

        $this->assertTrue($result->isDenied());
        $this->assertFalse($result->isFound());
        $this->assertSame(SamlTenantResolver::REASON_NO_COMPANY_DATA, $result->denialReason);
    }

    public function test_denies_when_company_name_does_not_match_any_tenant(): void
    {
        Tenant::create([
            'id' => 'tenant-top',
            'name' => 'PT Tata Optima Property',
            'code' => 'top',
        ]);

        $resolver = new SamlTenantResolver();
        $result = $resolver->resolve([
            'company' => ['PT Lainnya'],
        ]);

        $this->assertTrue($result->isDenied());
        $this->assertSame(SamlTenantResolver::REASON_NO_MATCH, $result->denialReason);
    }

    public function test_denies_when_multiple_tenants_have_same_name(): void
    {
        Tenant::create([
            'id' => 'tenant-top-1',
            'name' => 'PT Tata Optima Property',
            'code' => 'top-1',
        ]);
        Tenant::create([
            'id' => 'tenant-top-2',
            'name' => 'PT Tata Optima Property',
            'code' => 'top-2',
        ]);

        $resolver = new SamlTenantResolver();
        $result = $resolver->resolve([
            'company' => ['PT Tata Optima Property'],
        ]);

        $this->assertTrue($result->isDenied());
        $this->assertSame(SamlTenantResolver::REASON_MULTIPLE_MATCHES, $result->denialReason);
    }

    public function test_denies_when_matched_tenant_is_inactive(): void
    {
        Tenant::create([
            'id' => 'tenant-top',
            'name' => 'PT Tata Optima Property',
            'code' => 'top',
            'is_active' => false,
        ]);

        $resolver = new SamlTenantResolver();
        $result = $resolver->resolve([
            'company' => ['PT Tata Optima Property'],
        ]);

        $this->assertTrue($result->isDenied());
        $this->assertSame(SamlTenantResolver::REASON_INACTIVE, $result->denialReason);
    }

    public function test_can_access_any_tenant_for_super_admin(): void
    {
        $resolver = new SamlTenantResolver();
        $user = User::factory()->create(['is_super_admin' => true]);

        $this->assertTrue($resolver->canAccessAnyTenant($user));
    }

    public function test_cannot_access_any_tenant_for_non_super_admin(): void
    {
        $resolver = new SamlTenantResolver();
        $user = User::factory()->create(['is_super_admin' => false]);

        $this->assertFalse($resolver->canAccessAnyTenant($user));
    }
}
