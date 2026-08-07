<?php

namespace Tests\Feature;

use App\Models\AssetCategory;
use App\Models\AssetGroup;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class CategoryTest extends TestCase
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

    public function test_index_renders_categories_with_pagination(): void
    {
        $group = AssetGroup::factory()->create();

        AssetCategory::factory()->count(20)->create([
            'asset_group_id' => $group->id,
            'code' => null,
        ]);

        $this->actingAs($this->user)
            ->get(route('categories.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('categories/Index')
                ->has('categories.data', 15)
                ->where('categories.total', 20)
                ->where('categories.per_page', 15)
                ->where('categories.last_page', 2)
                ->has('groups', 1));
    }

    public function test_index_searches_categories_by_name_or_code(): void
    {
        $group = AssetGroup::factory()->create();

        AssetCategory::factory()->create([
            'asset_group_id' => $group->id,
            'code' => '01.01',
            'name' => 'Komputer & Laptop',
        ]);
        AssetCategory::factory()->create([
            'asset_group_id' => $group->id,
            'code' => '01.02',
            'name' => 'Printer',
        ]);

        $this->actingAs($this->user)
            ->get(route('categories.index', ['search' => 'Komputer']))
            ->assertInertia(fn (Assert $page) => $page
                ->where('categories.total', 1)
                ->where('categories.data.0.name', 'Komputer & Laptop')
                ->where('filters.search', 'Komputer'));

        $this->actingAs($this->user)
            ->get(route('categories.index', ['search' => '01.02']))
            ->assertInertia(fn (Assert $page) => $page
                ->where('categories.total', 1)
                ->where('categories.data.0.code', '01.02'));
    }

    public function test_index_filters_by_sort_order(): void
    {
        $group = AssetGroup::factory()->create();

        AssetCategory::factory()->create([
            'asset_group_id' => $group->id,
            'code' => '02',
            'name' => 'Zulu',
        ]);
        AssetCategory::factory()->create([
            'asset_group_id' => $group->id,
            'code' => '01',
            'name' => 'Alpha',
        ]);

        $this->actingAs($this->user)
            ->get(route('categories.index', ['sort' => 'name']))
            ->assertInertia(fn (Assert $page) => $page
                ->where('categories.data.0.name', 'Alpha')
                ->where('categories.data.1.name', 'Zulu'));

        $this->actingAs($this->user)
            ->get(route('categories.index', ['sort' => '-code']))
            ->assertInertia(fn (Assert $page) => $page
                ->where('categories.data.0.code', '02')
                ->where('categories.data.1.code', '01'));
    }

    public function test_index_filters_by_group(): void
    {
        $group = AssetGroup::factory()->create(['name' => 'Elektronik']);
        $otherGroup = AssetGroup::factory()->create(['name' => 'Furnitur']);

        AssetCategory::factory()->create([
            'asset_group_id' => $group->id,
            'name' => 'Komputer',
        ]);
        AssetCategory::factory()->create([
            'asset_group_id' => $otherGroup->id,
            'name' => 'Meja',
        ]);

        $this->actingAs($this->user)
            ->get(route('categories.index', ['group' => $group->id]))
            ->assertInertia(fn (Assert $page) => $page
                ->where('categories.total', 1)
                ->where('categories.data.0.name', 'Komputer')
                ->where('filters.group', $group->id));
    }

    public function test_index_only_lists_current_tenants_categories(): void
    {
        $group = AssetGroup::factory()->create();

        AssetCategory::factory()->create([
            'asset_group_id' => $group->id,
            'name' => 'Milik Saya',
        ]);

        Tenant::create(['id' => 'other', 'name' => 'Other Corp']);
        $foreign = AssetCategory::factory()->create(['name' => 'Asing']);
        $foreign->forceFill(['tenant_id' => 'other'])->save();

        $this->actingAs($this->user)
            ->get(route('categories.index'))
            ->assertInertia(fn (Assert $page) => $page->where('categories.total', 1));
    }

    public function test_category_can_be_created(): void
    {
        $group = AssetGroup::factory()->create(['code' => '01', 'name' => 'Elektronik']);

        $this->actingAs($this->user)->post(route('categories.store'), [
            'asset_group_id' => $group->id,
            'code' => '01.01',
            'name' => 'Komputer',
            'description' => 'Perangkat komputasi',
        ])->assertRedirect();

        $category = AssetCategory::first();

        $this->assertNotNull($category);
        $this->assertSame($group->id, $category->asset_group_id);
        $this->assertSame($this->tenant->id, $category->tenant_id);
        $this->assertSame('Komputer', $category->name);
    }

    public function test_category_name_is_required(): void
    {
        $group = AssetGroup::factory()->create();

        $this->actingAs($this->user)
            ->from(route('categories.index'))
            ->post(route('categories.store'), [
                'asset_group_id' => $group->id,
                'code' => '01',
                'name' => '',
            ])
            ->assertSessionHasErrors('name');
    }

    public function test_category_code_must_be_unique_within_group(): void
    {
        $group = AssetGroup::factory()->create();
        AssetCategory::factory()->create([
            'asset_group_id' => $group->id,
            'code' => '01.01',
        ]);

        $this->actingAs($this->user)
            ->from(route('categories.index'))
            ->post(route('categories.store'), [
                'asset_group_id' => $group->id,
                'code' => '01.01',
                'name' => 'Duplikat',
            ])
            ->assertSessionHasErrors('code');
    }

    public function test_same_category_code_allowed_in_another_group(): void
    {
        $group = AssetGroup::factory()->create();
        $otherGroup = AssetGroup::factory()->create();
        AssetCategory::factory()->create([
            'asset_group_id' => $group->id,
            'code' => '01.01',
        ]);

        $this->actingAs($this->user)
            ->post(route('categories.store'), [
                'asset_group_id' => $otherGroup->id,
                'code' => '01.01',
                'name' => 'Kategori',
            ])
            ->assertRedirect();

        $this->assertSame(2, AssetCategory::count());
    }

    public function test_category_cannot_be_created_under_another_tenants_group(): void
    {
        Tenant::create(['id' => 'other', 'name' => 'Other Corp']);
        $foreignGroup = AssetGroup::factory()->create();
        $foreignGroup->forceFill(['tenant_id' => 'other'])->save();

        $this->actingAs($this->user)
            ->from(route('categories.index'))
            ->post(route('categories.store'), [
                'asset_group_id' => $foreignGroup->id,
                'name' => 'Kategori Asing',
            ])
            ->assertNotFound();
    }

    public function test_category_can_be_updated(): void
    {
        $group = AssetGroup::factory()->create();
        $category = AssetCategory::factory()->create([
            'asset_group_id' => $group->id,
            'name' => 'Lama',
        ]);

        $this->actingAs($this->user)
            ->patch(route('categories.update', $category->id), [
                'asset_group_id' => $group->id,
                'name' => 'Baru',
            ])
            ->assertRedirect();

        $this->assertSame('Baru', $category->fresh()->name);
    }

    public function test_category_can_keep_its_own_code_on_update(): void
    {
        $group = AssetGroup::factory()->create();
        $category = AssetCategory::factory()->create([
            'asset_group_id' => $group->id,
            'code' => '01.01',
        ]);

        $this->actingAs($this->user)
            ->patch(route('categories.update', $category->id), [
                'asset_group_id' => $group->id,
                'code' => '01.01',
                'name' => 'Tetap',
            ])
            ->assertRedirect();
    }

    public function test_category_from_another_tenant_cannot_be_updated(): void
    {
        Tenant::create(['id' => 'other', 'name' => 'Other Corp']);
        $foreign = AssetCategory::factory()->create();
        $foreign->forceFill(['tenant_id' => 'other'])->save();

        $this->actingAs($this->user)
            ->patch(route('categories.update', $foreign->id), [
                'asset_group_id' => $foreign->asset_group_id,
                'name' => 'X',
            ])
            ->assertNotFound();
    }

    public function test_category_can_be_deleted(): void
    {
        $group = AssetGroup::factory()->create();
        $category = AssetCategory::factory()->create(['asset_group_id' => $group->id]);

        $this->actingAs($this->user)
            ->delete(route('categories.destroy', $category->id))
            ->assertRedirect();

        $this->assertSame(0, AssetCategory::withoutGlobalScopes()->count());
    }

    public function test_category_from_another_tenant_cannot_be_deleted(): void
    {
        Tenant::create(['id' => 'other', 'name' => 'Other Corp']);
        $foreign = AssetCategory::factory()->create();
        $foreign->forceFill(['tenant_id' => 'other'])->save();

        $this->actingAs($this->user)
            ->delete(route('categories.destroy', $foreign->id))
            ->assertNotFound();

        $this->assertSame(1, AssetCategory::withoutGlobalScopes()->count());
    }
}
