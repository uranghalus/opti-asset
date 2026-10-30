<?php

namespace Tests\Feature\Services;

use App\Models\Tenant;
use App\Services\SamlTenantResolver;
use App\Services\SamlTenantResolution;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SamlTenantResolutionTest extends TestCase
{
    use RefreshDatabase;

    public function test_found_creates_resolution_with_tenant(): void
    {
        $tenant = Tenant::create([
            'id' => 'tenant-top',
            'name' => 'PT Tata Optima Property',
            'code' => 'top',
        ]);

        $resolution = SamlTenantResolution::found($tenant);

        $this->assertTrue($resolution->isFound());
        $this->assertFalse($resolution->isDenied());
        $this->assertSame($tenant->id, $resolution->tenant?->id);
        $this->assertNull($resolution->denialReason);
    }

    public function test_denied_creates_resolution_with_reason(): void
    {
        $resolution = SamlTenantResolution::denied(SamlTenantResolver::REASON_NO_MATCH);

        $this->assertTrue($resolution->isDenied());
        $this->assertFalse($resolution->isFound());
        $this->assertNull($resolution->tenant);
        $this->assertSame(SamlTenantResolver::REASON_NO_MATCH, $resolution->denialReason);
    }
}
