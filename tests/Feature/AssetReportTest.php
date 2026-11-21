<?php

namespace Tests\Feature;

use App\Models\Asset;
use App\Models\Department;
use App\Models\Employee;
use App\Models\Item;
use App\Models\Location;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class AssetReportTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenant;

    private User $user;

    private Department $departmentA;

    protected function setUp(): void
    {
        parent::setUp();

        if (DB::getDriverName() === 'sqlite') {
            DB::statement('PRAGMA foreign_keys = ON');
        }

        $this->tenant = Tenant::create(['id' => 'acme', 'code' => 'acme', 'name' => 'Acme Corp']);
        $this->tenant->makeCurrent();

        \Spatie\Permission\Models\Permission::findOrCreate('asset.view', 'web');

        $this->departmentA = Department::create([
            'id_department' => 'dept-a',
            'tenant_id' => $this->tenant->id,
            'kode_department' => 'A',
            'nama_department' => 'Departemen A',
        ]);

        $this->user = User::factory()->create(['tenant_id' => $this->tenant->id]);
        $this->user->givePermissionTo(['asset.view']);

        $employee = Employee::factory()->create([
            'tenant_id' => $this->tenant->id,
            'nama_employee' => 'Test User',
            'id_department' => $this->departmentA->id_department,
        ]);
        $this->user->update(['employee_id' => $employee->id_employee]);
    }

    public function test_report_page_returns_success(): void
    {
        $item = Item::factory()->create(['tenant_id' => $this->tenant->id]);
        $asset = Asset::factory()->create([
            'tenant_id' => $this->tenant->id,
            'item_id' => $item->id,
            'department_id' => $this->departmentA->id_department,
            'status' => 'ACT',
            'condition' => 'Baik',
        ]);

        $response = $this->actingAs($this->user)
            ->get("{$this->tenant->id}/assets/report");

        $response->assertStatus(200);
    }

    public function test_report_filters_by_status(): void
    {
        $item = Item::factory()->create(['tenant_id' => $this->tenant->id]);
        
        Asset::factory()->create([
            'tenant_id' => $this->tenant->id,
            'item_id' => $item->id,
            'department_id' => $this->departmentA->id_department,
            'status' => 'ACT',
            'condition' => 'Baik',
        ]);

        Asset::factory()->create([
            'tenant_id' => $this->tenant->id,
            'item_id' => $item->id,
            'department_id' => $this->departmentA->id_department,
            'status' => 'LOAN',
            'condition' => 'Baik',
        ]);

        $response = $this->actingAs($this->user)
            ->get("{$this->tenant->id}/assets/report?status=ACT");

        $response->assertStatus(200);
    }

    public function test_report_filters_by_condition(): void
    {
        $item = Item::factory()->create(['tenant_id' => $this->tenant->id]);
        
        Asset::factory()->create([
            'tenant_id' => $this->tenant->id,
            'item_id' => $item->id,
            'department_id' => $this->departmentA->id_department,
            'status' => 'ACT',
            'condition' => 'Baik',
        ]);

        Asset::factory()->create([
            'tenant_id' => $this->tenant->id,
            'item_id' => $item->id,
            'department_id' => $this->departmentA->id_department,
            'status' => 'ACT',
            'condition' => 'Rusak Ringan',
        ]);

        $response = $this->actingAs($this->user)
            ->get("{$this->tenant->id}/assets/report?condition=Baik");

        $response->assertStatus(200);
    }

    public function test_export_xlsx(): void
    {
        $item = Item::factory()->create(['tenant_id' => $this->tenant->id]);
        
        Asset::factory()->create([
            'tenant_id' => $this->tenant->id,
            'item_id' => $item->id,
            'department_id' => $this->departmentA->id_department,
            'status' => 'ACT',
            'condition' => 'Baik',
        ]);

        $response = $this->actingAs($this->user)
            ->get("{$this->tenant->id}/assets/report/export?format=xlsx");

        $response->assertStatus(200);
        $response->assertHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    }

    public function test_export_pdf(): void
    {
        $item = Item::factory()->create(['tenant_id' => $this->tenant->id]);
        
        Asset::factory()->create([
            'tenant_id' => $this->tenant->id,
            'item_id' => $item->id,
            'department_id' => $this->departmentA->id_department,
            'status' => 'ACT',
            'condition' => 'Baik',
        ]);

        $response = $this->actingAs($this->user)
            ->get("{$this->tenant->id}/assets/report/export?format=pdf");

        $response->assertStatus(200);
        $response->assertHeader('Content-Type', 'application/pdf');
    }
}