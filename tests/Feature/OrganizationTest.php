<?php

namespace Tests\Feature;

use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class OrganizationTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenant;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();

        DB::statement('PRAGMA foreign_keys = ON');

        $this->tenant = Tenant::create(['id' => 'acme', 'name' => 'Acme Corp']);
        $this->tenant->makeCurrent();

        $this->user = User::factory()->create(['tenant_id' => $this->tenant->id]);
    }

    public function test_index_renders_organizations(): void
    {
        Tenant::create(['id' => 'other', 'name' => 'Other Corp']);

        $this->actingAs($this->user)
            ->get(route('organizations.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('organizations/Index')
                ->has('tenants.data', 2));
    }

    public function test_sync_imports_companies_from_portal(): void
    {
        config([
            'services.optigate_portal.url' => 'https://portal.example',
            'services.optigate_portal.token' => 'secret',
        ]);

        Http::fake([
            'https://portal.example/api/companies' => Http::response([
                'data' => [
                    ['id' => 'comp-1', 'name' => 'PT Maju Jaya'],
                    ['id' => 'comp-2', 'name' => 'PT Karya Sentosa'],
                ],
            ]),
        ]);

        $this->actingAs($this->user)
            ->post(route('organizations.sync'))
            ->assertRedirect(route('organizations.index'));

        $this->assertDatabaseHas('tenants', [
            'id' => 'comp-1',
            'name' => 'PT Maju Jaya',
        ]);

        $this->assertDatabaseHas('tenants', [
            'id' => 'comp-2',
            'name' => 'PT Karya Sentosa',
        ]);

        $this->assertTrue($this->user->tenants()->where('tenants.id', 'comp-1')->exists());
        $this->assertTrue($this->user->tenants()->where('tenants.id', 'comp-2')->exists());
    }

    public function test_sync_updates_existing_company_instead_of_duplicating(): void
    {
        Tenant::create(['id' => 'comp-1', 'name' => 'Nama Lama']);

        config([
            'services.optigate_portal.url' => 'https://portal.example',
            'services.optigate_portal.token' => 'secret',
        ]);

        Http::fake([
            'https://portal.example/api/companies' => Http::response([
                'data' => [
                    ['id' => 'comp-1', 'name' => 'PT Maju Jaya'],
                ],
            ]),
        ]);

        $this->actingAs($this->user)
            ->post(route('organizations.sync'))
            ->assertRedirect(route('organizations.index'));

        $this->assertDatabaseCount('tenants', 2);
        $this->assertDatabaseHas('tenants', [
            'id' => 'comp-1',
            'name' => 'PT Maju Jaya',
        ]);
    }

    public function test_sync_handles_api_failure(): void
    {
        config([
            'services.optigate_portal.url' => 'https://portal.example',
            'services.optigate_portal.token' => 'secret',
        ]);

        Http::fake([
            'https://portal.example/api/companies' => Http::response([], 500),
        ]);

        $this->actingAs($this->user)
            ->post(route('organizations.sync'))
            ->assertRedirect(route('organizations.index'));

        $this->assertDatabaseCount('tenants', 1);
    }
}
