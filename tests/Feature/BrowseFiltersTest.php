<?php

namespace Tests\Feature;

use App\Models\Asset;
use App\Models\Item;
use App\Models\Location;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Permission;
use Tests\TestCase;

class BrowseFiltersTest extends TestCase
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

        $this->tenant = Tenant::create(['id' => 'acme', 'code' => 'acme', 'name' => 'Acme Corp']);
        $this->tenant->makeCurrent();

        Permission::findOrCreate('asset.view', 'web');

        $this->user = User::factory()->create(['tenant_id' => $this->tenant->id]);
        $this->user->givePermissionTo(['asset.view']);
    }

    public function test_browse_filters_by_location_id(): void
    {
        $locationA = Location::factory()->create(['name' => 'Gedung A']);
        $locationB = Location::factory()->create(['name' => 'Gedung B']);

        Asset::factory()->count(3)->create(['location_id' => $locationA->id]);
        Asset::factory()->count(2)->create(['location_id' => $locationB->id]);
        Asset::factory()->create(['location_id' => null]);

        $this->actingAs($this->user)
            ->get(route('tenant.assets.browse', array_merge(['tenant' => $this->tenant->code], ['location' => $locationA->id])))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('assets.total', 3)
                ->where('assets.data', fn ($data) => collect($data)->pluck('id')->sort()->values()->all() ===
                    Asset::where('location_id', $locationA->id)->pluck('id')->sort()->values()->all()
                ));
    }

    public function test_browse_filters_by_item_name(): void
    {
        $itemLaptop = Item::factory()->create(['name' => 'Laptop Dell XPS']);
        $itemMouse = Item::factory()->create(['name' => 'Mouse Logitech']);

        Asset::factory()->count(2)->create(['item_id' => $itemLaptop->id]);
        Asset::factory()->create(['item_id' => $itemMouse->id]);

        $this->actingAs($this->user)
            ->get(route('tenant.assets.browse', array_merge(['tenant' => $this->tenant->code], ['search' => 'Dell XPS'])))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('assets.total', 2));
    }

    public function test_browse_filters_by_location_and_item_name(): void
    {
        $locationA = Location::factory()->create(['name' => 'Gedung A']);
        $locationB = Location::factory()->create(['name' => 'Gedung B']);

        $itemLaptop = Item::factory()->create(['name' => 'Laptop Dell XPS']);
        $itemMouse = Item::factory()->create(['name' => 'Mouse Logitech']);

        // Lokasi A: 2 laptop + 1 mouse
        Asset::factory()->count(2)->create([
            'location_id' => $locationA->id,
            'item_id' => $itemLaptop->id,
        ]);
        Asset::factory()->create([
            'location_id' => $locationA->id,
            'item_id' => $itemMouse->id,
        ]);
        // Lokasi B: 1 laptop (harus dikecualikan oleh filter lokasi)
        Asset::factory()->create([
            'location_id' => $locationB->id,
            'item_id' => $itemLaptop->id,
        ]);

        $this->actingAs($this->user)
            ->get(route('tenant.assets.browse', array_merge(['tenant' => $this->tenant->code], [
                'location' => $locationA->id,
                'search' => 'Dell XPS',
            ])))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('assets.total', 2));
    }
}
