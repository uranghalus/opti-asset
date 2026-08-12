<?php

namespace Tests\Feature;

use App\Models\Location;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class LocationTest extends TestCase
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

        $this->user = User::factory()->create(['tenant_id' => $this->tenant->id]);
    }

    public function test_index_renders_locations_with_pagination(): void
    {
        Location::factory()->count(20)->create();

        $this->actingAs($this->user)
            ->get(route('locations.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('locations/Index')
                ->has('locations.data', 15)
                ->where('locations.total', 20)
                ->where('locations.per_page', 15)
                ->where('locations.last_page', 2));
    }

    public function test_index_searches_locations_by_name(): void
    {
        Location::factory()->create(['name' => 'Gudang Pusat']);
        Location::factory()->create(['name' => 'Kantor Cabang']);

        $this->actingAs($this->user)
            ->get(route('locations.index', ['search' => 'Gudang']))
            ->assertInertia(fn (Assert $page) => $page
                ->where('locations.total', 1)
                ->where('locations.data.0.name', 'Gudang Pusat')
                ->where('filters.search', 'Gudang'));
    }

    public function test_index_filters_by_sort_order(): void
    {
        Location::factory()->create(['name' => 'Zulu']);
        Location::factory()->create(['name' => 'Alpha']);

        $this->actingAs($this->user)
            ->get(route('locations.index', ['sort' => 'name']))
            ->assertInertia(fn (Assert $page) => $page
                ->where('locations.data.0.name', 'Alpha')
                ->where('locations.data.1.name', 'Zulu'));

        $this->actingAs($this->user)
            ->get(route('locations.index', ['sort' => '-name']))
            ->assertInertia(fn (Assert $page) => $page
                ->where('locations.data.0.name', 'Zulu')
                ->where('locations.data.1.name', 'Alpha'));
    }

    public function test_index_only_lists_current_tenants_locations(): void
    {
        Location::factory()->create(['name' => 'Milik Saya']);
        Tenant::create(['id' => 'other', 'name' => 'Other Corp']);
        $foreign = Location::factory()->create(['name' => 'Asing']);
        $foreign->forceFill(['tenant_id' => 'other'])->save();

        $this->actingAs($this->user)
            ->get(route('locations.index'))
            ->assertInertia(fn (Assert $page) => $page->where('locations.total', 1));
    }

    public function test_location_can_be_created(): void
    {
        $this->actingAs($this->user)->post(route('locations.store'), [
            'name' => 'Gudang Utara',
        ])->assertRedirect();

        $location = Location::first();

        $this->assertNotNull($location);
        $this->assertSame($this->tenant->id, $location->tenant_id);
        $this->assertSame('Gudang Utara', $location->name);
    }

    public function test_location_name_is_required(): void
    {
        $this->actingAs($this->user)
            ->from(route('locations.index'))
            ->post(route('locations.store'), ['name' => ''])
            ->assertSessionHasErrors('name');
    }

    public function test_location_can_be_updated(): void
    {
        $location = Location::factory()->create(['name' => 'Lama']);

        $this->actingAs($this->user)
            ->patch(route('locations.update', $location->id), [
                'name' => 'Baru',
            ])
            ->assertRedirect();

        $this->assertSame('Baru', $location->fresh()->name);
    }

    public function test_location_from_another_tenant_cannot_be_updated(): void
    {
        Tenant::create(['id' => 'other', 'name' => 'Other Corp']);
        $foreign = Location::factory()->create();
        $foreign->forceFill(['tenant_id' => 'other'])->save();

        $this->actingAs($this->user)
            ->patch(route('locations.update', $foreign->id), ['name' => 'X'])
            ->assertNotFound();
    }

    public function test_location_can_be_deleted(): void
    {
        $location = Location::factory()->create();

        $this->actingAs($this->user)
            ->delete(route('locations.destroy', $location->id))
            ->assertRedirect();

        $this->assertSame(0, Location::withoutGlobalScopes()->count());
    }

    public function test_location_from_another_tenant_cannot_be_deleted(): void
    {
        Tenant::create(['id' => 'other', 'name' => 'Other Corp']);
        $foreign = Location::factory()->create();
        $foreign->forceFill(['tenant_id' => 'other'])->save();

        $this->actingAs($this->user)
            ->delete(route('locations.destroy', $foreign->id))
            ->assertNotFound();

        $this->assertSame(1, Location::withoutGlobalScopes()->count());
    }
}
