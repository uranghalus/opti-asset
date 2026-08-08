<?php

namespace Tests\Feature;

use App\Models\AssetCategory;
use App\Models\AssetCluster;
use App\Models\AssetGroup;
use App\Models\AssetSubCluster;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AssetClassificationTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenant;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();

        DB::statement('PRAGMA foreign_keys = ON');
        Cache::flush();

        $this->tenant = Tenant::create(['id' => 'acme', 'name' => 'Acme Corp']);
        $this->tenant->makeCurrent();

        $this->user = User::factory()->create(['tenant_id' => $this->tenant->id]);
    }

    public function test_index_renders_classification_tree(): void
    {
        $group = AssetGroup::factory()->create(['code' => '01', 'name' => 'Elektronik']);
        $category = AssetCategory::factory()->create([
            'asset_group_id' => $group->id,
            'code' => '01.01',
            'name' => 'Komputer',
        ]);
        AssetCluster::factory()->create(['asset_category_id' => $category->id]);

        $this->actingAs($this->user)
            ->get(route('asset-classification.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('asset-classification')
                ->has('groups', 1)
                ->where('groups.0.code', '01')
                ->where('groups.0.child_count', 1)
                ->where('groups.0.children.0.code', '01.01')
                ->where('groups.0.children.0.child_count', 1));
    }

    public function test_index_only_lists_current_tenants_groups(): void
    {
        AssetGroup::factory()->create(['name' => 'Milik Saya']);
        Tenant::create(['id' => 'other', 'name' => 'Other Corp']);
        $foreign = AssetGroup::factory()->create(['name' => 'Asing']);
        $foreign->forceFill(['tenant_id' => 'other'])->save();

        $this->actingAs($this->user)
            ->get(route('asset-classification.index'))
            ->assertInertia(fn (Assert $page) => $page->has('groups', 1));
    }

    public function test_group_can_be_created(): void
    {
        $this->actingAs($this->user)->post(route('asset-classification.groups.store'), [
            'code' => '02',
            'name' => 'Mesin',
            'description' => 'Peralatan produksi',
        ])->assertRedirect();

        $group = AssetGroup::first();

        $this->assertNotNull($group);
        $this->assertSame($this->tenant->id, $group->tenant_id);
        $this->assertSame('Mesin', $group->name);
    }

    public function test_group_name_is_required(): void
    {
        $this->actingAs($this->user)
            ->from(route('asset-classification.index'))
            ->post(route('asset-classification.groups.store'), ['code' => '01'])
            ->assertSessionHasErrors('name');
    }

    public function test_group_code_must_be_unique_within_tenant(): void
    {
        AssetGroup::factory()->create(['code' => '01']);

        $this->actingAs($this->user)
            ->from(route('asset-classification.index'))
            ->post(route('asset-classification.groups.store'), [
                'code' => '01',
                'name' => 'Duplikat',
            ])
            ->assertSessionHasErrors('code');
    }

    public function test_same_group_code_allowed_in_another_tenant(): void
    {
        AssetGroup::factory()->create(['code' => '01']);

        $otherTenant = Tenant::create(['id' => 'beta', 'name' => 'Beta Corp']);
        $otherTenant->makeCurrent();
        $this->user->update(['tenant_id' => $otherTenant->id]);

        $this->actingAs($this->user)
            ->post(route('asset-classification.groups.store'), [
                'code' => '01',
                'name' => 'Golongan',
            ])
            ->assertRedirect();

        $this->assertSame(2, AssetGroup::withoutGlobalScopes()->count());
    }

    public function test_group_can_keep_its_own_code_on_update(): void
    {
        $group = AssetGroup::factory()->create(['code' => '01']);

        $this->actingAs($this->user)
            ->patch(route('asset-classification.groups.update', $group->id), [
                'code' => '01',
                'name' => 'Tetap',
            ])
            ->assertRedirect();
    }

    public function test_group_can_be_updated(): void
    {
        $group = AssetGroup::factory()->create(['name' => 'Lama']);

        $this->actingAs($this->user)
            ->patch(route('asset-classification.groups.update', $group->id), [
                'name' => 'Baru',
            ])
            ->assertRedirect();

        $this->assertSame('Baru', $group->fresh()->name);
    }

    public function test_group_from_another_tenant_cannot_be_updated(): void
    {
        Tenant::create(['id' => 'other', 'name' => 'Other Corp']);
        $foreignGroup = AssetGroup::factory()->create();
        $foreignGroup->forceFill(['tenant_id' => 'other'])->save();

        $this->actingAs($this->user)
            ->patch(route('asset-classification.groups.update', $foreignGroup->id), [
                'name' => 'X',
            ])
            ->assertNotFound();
    }

    public function test_category_can_be_created_under_group(): void
    {
        $group = AssetGroup::factory()->create();

        $this->actingAs($this->user)->post(route('asset-classification.categories.store'), [
            'asset_group_id' => $group->id,
            'code' => '01.01',
            'name' => 'Komputer',
        ])->assertRedirect();

        $category = AssetCategory::first();

        $this->assertNotNull($category);
        $this->assertSame($group->id, $category->asset_group_id);
        $this->assertSame($this->tenant->id, $category->tenant_id);
    }

    public function test_category_cannot_be_created_under_another_tenants_group(): void
    {
        Tenant::create(['id' => 'other', 'name' => 'Other Corp']);
        $foreignGroup = AssetGroup::factory()->create();
        $foreignGroup->forceFill(['tenant_id' => 'other'])->save();

        $this->actingAs($this->user)
            ->from(route('asset-classification.index'))
            ->post(route('asset-classification.categories.store'), [
                'asset_group_id' => $foreignGroup->id,
                'name' => 'Kategori Asing',
            ])
            ->assertNotFound();
    }

    public function test_full_hierarchy_is_returned_nested(): void
    {
        $group = AssetGroup::factory()->create();
        $category = AssetCategory::factory()->create(['asset_group_id' => $group->id]);
        $cluster = AssetCluster::factory()->create(['asset_category_id' => $category->id]);
        AssetSubCluster::factory()->create([
            'asset_cluster_id' => $cluster->id,
            'name' => 'Server Rack',
            'notes' => 'Rak server 42U',
        ]);

        $this->actingAs($this->user)
            ->get(route('asset-classification.index'))
            ->assertInertia(fn (Assert $page) => $page
                ->where('groups.0.children.0.children.0.children.0.name', 'Server Rack')
                ->where('groups.0.children.0.children.0.children.0.notes', 'Rak server 42U'));
    }

    public function test_deleting_group_cascades_to_descendants(): void
    {
        $group = AssetGroup::factory()->create();
        $category = AssetCategory::factory()->create(['asset_group_id' => $group->id]);
        $cluster = AssetCluster::factory()->create(['asset_category_id' => $category->id]);
        AssetSubCluster::factory()->create(['asset_cluster_id' => $cluster->id]);

        $this->actingAs($this->user)
            ->delete(route('asset-classification.groups.destroy', $group->id))
            ->assertRedirect();

        $this->assertSame(0, AssetGroup::withoutGlobalScopes()->count());
        $this->assertSame(0, AssetCategory::withoutGlobalScopes()->count());
        $this->assertSame(0, AssetCluster::withoutGlobalScopes()->count());
        $this->assertSame(0, AssetSubCluster::withoutGlobalScopes()->count());
    }

    public function test_index_orders_groups_by_sort_order(): void
    {
        AssetGroup::factory()->create(['code' => '03', 'name' => 'C', 'sort_order' => 3]);
        AssetGroup::factory()->create(['code' => '01', 'name' => 'A', 'sort_order' => 1]);
        AssetGroup::factory()->create(['code' => '02', 'name' => 'B', 'sort_order' => 2]);

        $this->actingAs($this->user)
            ->get(route('asset-classification.index'))
            ->assertInertia(fn (Assert $page) => $page
                ->where('groups.0.name', 'A')
                ->where('groups.1.name', 'B')
                ->where('groups.2.name', 'C'));
    }

    public function test_tree_cache_is_flushed_after_write(): void
    {
        AssetGroup::factory()->create(['code' => '01', 'name' => 'Lama']);

        $this->actingAs($this->user)
            ->get(route('asset-classification.index'))
            ->assertInertia(fn (Assert $page) => $page->where('groups.0.name', 'Lama'));

        $this->assertTrue(Cache::has("classification.tree.{$this->tenant->id}"));

        $group = AssetGroup::firstOrFail();
        $group->update(['name' => 'Baru']);

        $this->assertFalse(Cache::has("classification.tree.{$this->tenant->id}"));

        $this->actingAs($this->user)
            ->get(route('asset-classification.index'))
            ->assertInertia(fn (Assert $page) => $page->where('groups.0.name', 'Baru'));
    }

    public function test_reorder_updates_sibling_order(): void
    {
        $first = AssetGroup::factory()->create(['code' => null, 'name' => 'Pertama']);
        $second = AssetGroup::factory()->create(['code' => null, 'name' => 'Kedua']);
        $third = AssetGroup::factory()->create(['code' => null, 'name' => 'Ketiga']);

        $this->actingAs($this->user)
            ->post(route('asset-classification.reorder'), [
                'level' => 'group',
                'parent_id' => null,
                'ids' => [$third->id, $first->id, $second->id],
            ])
            ->assertRedirect();

        $this->assertSame(0, $third->fresh()->sort_order);
        $this->assertSame(1, $first->fresh()->sort_order);
        $this->assertSame(2, $second->fresh()->sort_order);
    }

    public function test_reorder_moves_category_between_groups(): void
    {
        $sourceGroup = AssetGroup::factory()->create(['code' => null]);
        $targetGroup = AssetGroup::factory()->create(['code' => null]);
        $category = AssetCategory::factory()->create(['asset_group_id' => $sourceGroup->id]);

        $this->actingAs($this->user)
            ->post(route('asset-classification.reorder'), [
                'level' => 'category',
                'parent_id' => $targetGroup->id,
                'ids' => [$category->id],
            ])
            ->assertRedirect();

        $this->assertSame($targetGroup->id, $category->fresh()->asset_group_id);
        $this->assertSame(0, $category->fresh()->sort_order);
    }

    public function test_reorder_ignores_ids_from_another_tenant(): void
    {
        Tenant::create(['id' => 'other', 'name' => 'Other Corp']);
        $foreignGroup = AssetGroup::factory()->create();
        $foreignGroup->forceFill(['tenant_id' => 'other'])->save();
        $own = AssetGroup::factory()->create(['code' => null]);

        $this->actingAs($this->user)
            ->post(route('asset-classification.reorder'), [
                'level' => 'group',
                'parent_id' => null,
                'ids' => [$foreignGroup->id, $own->id],
            ])
            ->assertRedirect();

        $this->assertSame(1, $own->fresh()->sort_order);
        $this->assertSame(0, $foreignGroup->fresh()->sort_order);
    }

    public function test_import_creates_full_hierarchy(): void
    {
        $this->actingAs($this->user)
            ->post(route('asset-classification.import'), [
                'rows' => [
                    ['level' => 'group', 'code' => '01', 'name' => 'Elektronik'],
                    ['level' => 'category', 'code' => '01.01', 'name' => 'Komputer', 'parent_code' => '01'],
                    ['level' => 'cluster', 'code' => '01.01.01', 'name' => 'Desktop', 'parent_code' => '01.01'],
                    ['level' => 'sub-cluster', 'name' => 'Workstation', 'parent_code' => '01.01.01'],
                ],
            ])
            ->assertRedirect();

        $this->assertSame(1, AssetGroup::withoutGlobalScopes()->count());
        $this->assertSame(1, AssetCategory::withoutGlobalScopes()->count());
        $this->assertSame(1, AssetCluster::withoutGlobalScopes()->count());
        $this->assertSame(1, AssetSubCluster::withoutGlobalScopes()->count());

        $this->assertSame(
            AssetGroup::first()?->id,
            AssetCategory::withoutGlobalScopes()->first()?->asset_group_id,
        );
        $this->assertSame(
            AssetCategory::withoutGlobalScopes()->first()?->id,
            AssetCluster::withoutGlobalScopes()->first()?->asset_category_id,
        );
    }

    public function test_import_skips_rows_with_unknown_parent(): void
    {
        $this->actingAs($this->user)
            ->post(route('asset-classification.import'), [
                'rows' => [
                    ['level' => 'category', 'code' => '99', 'name' => 'Yatim', 'parent_code' => 'tidak-ada'],
                ],
            ])
            ->assertRedirect();

        $this->assertSame(0, AssetCategory::withoutGlobalScopes()->count());
    }

    public function test_import_is_idempotent_for_duplicate_codes_within_parent(): void
    {
        $this->actingAs($this->user)
            ->post(route('asset-classification.import'), [
                'rows' => [
                    ['level' => 'group', 'code' => '01', 'name' => 'Tanah'],
                    ['level' => 'category', 'code' => '01.01', 'name' => 'Kavling', 'parent_code' => '01'],
                    ['level' => 'cluster', 'code' => '01.01.01', 'name' => 'Standar', 'parent_code' => '01.01'],
                    ['level' => 'sub-cluster', 'code' => '01', 'name' => 'Fire Cabinet', 'parent_code' => '01.01.01'],
                    ['level' => 'sub-cluster', 'code' => '01', 'name' => 'Fire Cabinet (Baru)', 'parent_code' => '01.01.01'],
                ],
            ])
            ->assertRedirect();

        $this->assertSame(1, AssetSubCluster::withoutGlobalScopes()->count());
        $this->assertSame('Fire Cabinet (Baru)', AssetSubCluster::withoutGlobalScopes()->first()?->name);
    }

    public function test_import_can_be_repeated_without_duplicating(): void
    {
        $rows = [
            ['level' => 'group', 'code' => '01', 'name' => 'Tanah'],
            ['level' => 'category', 'code' => '01.01', 'name' => 'Kavling', 'parent_code' => '01'],
            ['level' => 'cluster', 'code' => '01.01.01', 'name' => 'Standar', 'parent_code' => '01.01'],
            ['level' => 'sub-cluster', 'code' => '01', 'name' => 'Kavling 60m2', 'parent_code' => '01.01.01'],
        ];

        $this->actingAs($this->user)
            ->post(route('asset-classification.import'), ['rows' => $rows])
            ->assertRedirect();

        $this->actingAs($this->user)
            ->post(route('asset-classification.import'), ['rows' => $rows])
            ->assertRedirect();

        $this->assertSame(1, AssetGroup::withoutGlobalScopes()->count());
        $this->assertSame(1, AssetCategory::withoutGlobalScopes()->count());
        $this->assertSame(1, AssetCluster::withoutGlobalScopes()->count());
        $this->assertSame(1, AssetSubCluster::withoutGlobalScopes()->count());
    }
}
