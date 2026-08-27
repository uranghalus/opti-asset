<?php

namespace Tests\Feature;

use App\Models\Asset;
use App\Models\AssetCategory;
use App\Models\AssetGroup;
use App\Models\Department;
use App\Models\Item;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class BrowseTest extends TestCase
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

    public function test_browse_loads_with_tree_and_assets(): void
    {
        AssetGroup::factory()->create();

        $this->actingAs($this->user)
            ->get(route('assets.browse'))
            ->assertOk()
            ->assertInertia(
                fn ($page) => $page
                    ->component('assets/Browse')
                    ->has('tree')
                    ->has('assets')
                    ->has('breadcrumb')
                    ->where('selectedNode', null),
            );
    }

    public function test_browse_filters_assets_by_selected_node(): void
    {
        $group = AssetGroup::factory()->create();
        $category = AssetCategory::factory()->create(['asset_group_id' => $group->id]);
        $item = Item::factory()->create();

        Asset::factory()->create([
            'asset_group_id' => $group->id,
            'asset_category_id' => $category->id,
            'item_id' => $item->id,
        ]);
        Asset::factory()->create(['item_id' => $item->id]);

        $this->actingAs($this->user)
            ->get(route('assets.browse', ['node' => $group->id]))
            ->assertOk()
            ->assertInertia(
                fn ($page) => $page
                    ->where('selectedNode', $group->id)
                    ->where('selectedLevel', 'group')
                    ->has('breadcrumb'),
            );
    }

    public function test_browse_tree_carries_asset_counts(): void
    {
        $group = AssetGroup::factory()->create();
        $item = Item::factory()->create();

        Asset::factory()->create([
            'asset_group_id' => $group->id,
            'item_id' => $item->id,
        ]);

        $this->actingAs($this->user)
            ->get(route('assets.browse'))
            ->assertOk()
            ->assertInertia(
                fn ($page) => $page
                    ->has('tree.0.asset_count')
                    ->where('tree.0.asset_count', 1),
            );
    }

    public function test_browse_requires_authentication(): void
    {
        $this->get(route('assets.browse'))->assertRedirect();
    }
}
