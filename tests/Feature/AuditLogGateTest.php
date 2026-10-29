<?php

namespace Tests\Feature;

use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Permission;
use Tests\TestCase;

class AuditLogGateTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenant;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();

        if (DB::getDriverName() === 'sqlite') {
            DB::statement('PRAGMA foreign_keys = ON');
        }

        $this->tenant = Tenant::create(['id' => 'acme', 'name' => 'Acme Corp']);
        $this->tenant->makeCurrent();

        Permission::findOrCreate('audit.view', 'web');

        $this->user = User::factory()->create(['tenant_id' => $this->tenant->id]);
        $this->user->givePermissionTo('audit.view');
    }

    public function test_index_forbids_without_audit_view(): void
    {
        $this->user->revokePermissionTo('audit.view');

        $this->actingAs($this->user)
            ->get(route('audit-logs.index'))
            ->assertForbidden();
    }

    public function test_index_ok_with_audit_view(): void
    {
        $this->actingAs($this->user)
            ->get(route('audit-logs.index'))
            ->assertOk();
    }
}
