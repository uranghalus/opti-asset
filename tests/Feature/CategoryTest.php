<?php

namespace Tests\Feature;

use App\Enums\ClassificationLevel;
use App\Models\AssetCategory;
use App\Models\AssetCluster;
use App\Models\AssetGroup;
use App\Models\AssetSubCluster;
use App\Models\Category;
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

        Category::factory()->count(20)->create([
            'classification_id' => $group->id,
            'classification_type' => ClassificationLevel::GROUP,
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
        Category::factory()->create([
            'code' => '01.01',
            'name' => 'Komputer & Laptop',
        ]);
        Category::factory()->create([
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

    public function test_index_sorts_categories_by_name_and_code(): void
    {
        Category::factory()->create(['name' => 'Zulu', 'code' => '02']);
        Category::factory()->create(['name' => 'Alpha', 'code' => '01']);

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

    public function test_index_only_lists_current_tenants_categories(): void
    {
        Category::factory()->create(['name' => 'Milik Saya']);

        Tenant::create(['id' => 'other', 'name' => 'Other Corp']);
        $foreign = Category::factory()->create(['name' => 'Asing']);
        $foreign->forceFill(['tenant_id' => 'other'])->save();

        $this->actingAs($this->user)
            ->get(route('categories.index'))
            ->assertInertia(fn (Assert $page) => $page->where('categories.total', 1));
    }

    public function test_index_loads_classification_options_for_the_form(): void
    {
        $group = AssetGroup::factory()->create(['name' => 'Bangunan']);
        $category = AssetCategory::factory()->create([
            'asset_group_id' => $group->id,
            'name' => 'Kategori A',
        ]);

        $this->actingAs($this->user)
            ->get(route('categories.index'))
            ->assertInertia(
                fn (Assert $page) => $page
                    ->has('optionCategories', 1)
                    ->where('optionCategories.0.asset_group_id', $group->id)
                    ->where('optionCategories.0.id', $category->id)
            );
    }

    public function test_index_serializes_the_classification_chain(): void
    {
        $group = AssetGroup::factory()->create(['code' => '01', 'name' => 'Elektronik']);
        $category = AssetCategory::factory()->create([
            'asset_group_id' => $group->id,
            'code' => '01',
            'name' => 'Komputer',
        ]);
        $cluster = AssetCluster::factory()->create([
            'asset_category_id' => $category->id,
            'code' => '01',
            'name' => 'Laptop',
        ]);
        $subCluster = AssetSubCluster::factory()->create([
            'asset_cluster_id' => $cluster->id,
            'code' => '01',
            'name' => 'Notebook',
        ]);

        Category::factory()->create([
            'code' => '01.01.01.01',
            'classification_id' => $subCluster->id,
            'classification_type' => ClassificationLevel::SUBCLUSTER,
        ]);

        $this->actingAs($this->user)
            ->get(route('categories.index'))
            ->assertInertia(fn (Assert $page) => $page
                ->where('categories.data.0.classification_type', 'SUBCLUSTER')
                ->where('categories.data.0.chain.0.name', 'Elektronik')
                ->where('categories.data.0.chain.1.name', 'Komputer')
                ->where('categories.data.0.chain.2.name', 'Laptop')
                ->where('categories.data.0.chain.3.name', 'Notebook'));
    }

    public function test_category_can_be_created_at_group_level(): void
    {
        $group = AssetGroup::factory()->create(['code' => '01', 'name' => 'Elektronik']);

        $this->actingAs($this->user)->post(route('categories.store'), [
            'name' => 'Elektronik',
            'classification_type' => ClassificationLevel::GROUP->value,
            'classification_id' => $group->id,
        ])->assertRedirect();

        $category = Category::first();

        $this->assertNotNull($category);
        $this->assertSame($this->tenant->id, $category->tenant_id);
        $this->assertSame('Elektronik', $category->name);
        $this->assertSame('01', $category->code);
        $this->assertSame(ClassificationLevel::GROUP, $category->classification_type);
        $this->assertSame($group->id, $category->classification_id);
    }

    public function test_category_code_built_from_selected_level(): void
    {
        $group = AssetGroup::factory()->create(['code' => '01']);
        $category = AssetCategory::factory()->create([
            'asset_group_id' => $group->id,
            'code' => '01',
        ]);

        $this->actingAs($this->user)->post(route('categories.store'), [
            'name' => 'Komputer',
            'classification_type' => ClassificationLevel::CATEGORY->value,
            'classification_id' => $category->id,
        ])->assertRedirect();

        $this->assertSame('01.01', Category::first()->code);
    }

    public function test_category_name_is_required(): void
    {
        $group = AssetGroup::factory()->create();

        $this->actingAs($this->user)
            ->from(route('categories.index'))
            ->post(route('categories.store'), [
                'name' => '',
                'classification_type' => ClassificationLevel::GROUP->value,
                'classification_id' => $group->id,
            ])
            ->assertSessionHasErrors('name');
    }

    public function test_category_classification_type_must_be_valid(): void
    {
        $group = AssetGroup::factory()->create();

        $this->actingAs($this->user)
            ->from(route('categories.index'))
            ->post(route('categories.store'), [
                'name' => 'X',
                'classification_type' => 'BOGUS',
                'classification_id' => $group->id,
            ])
            ->assertSessionHasErrors('classification_type');
    }

    public function test_category_classification_id_is_required(): void
    {
        $this->actingAs($this->user)
            ->from(route('categories.index'))
            ->post(route('categories.store'), [
                'name' => 'X',
                'classification_type' => ClassificationLevel::GROUP->value,
                'classification_id' => '',
            ])
            ->assertSessionHasErrors('classification_id');
    }

    public function test_category_cannot_point_to_a_missing_classification_node(): void
    {
        $this->actingAs($this->user)
            ->from(route('categories.index'))
            ->post(route('categories.store'), [
                'name' => 'X',
                'classification_type' => ClassificationLevel::GROUP->value,
                'classification_id' => (string) fake()->uuid(),
            ])
            ->assertNotFound();
    }

    public function test_category_cannot_point_to_another_tenants_classification_node(): void
    {
        Tenant::create(['id' => 'other', 'name' => 'Other Corp']);
        $foreignGroup = AssetGroup::factory()->create();
        $foreignGroup->forceFill(['tenant_id' => 'other'])->save();

        $this->actingAs($this->user)
            ->from(route('categories.index'))
            ->post(route('categories.store'), [
                'name' => 'X',
                'classification_type' => ClassificationLevel::GROUP->value,
                'classification_id' => $foreignGroup->id,
            ])
            ->assertNotFound();
    }

    public function test_category_can_be_updated(): void
    {
        $initialGroup = AssetGroup::factory()->create(['code' => '01']);
        $category = Category::factory()->create([
            'name' => 'Lama',
            'classification_id' => $initialGroup->id,
            'classification_type' => ClassificationLevel::GROUP,
        ]);

        $group = AssetGroup::factory()->create(['code' => '02']);
        $categoryNode = AssetCategory::factory()->create([
            'asset_group_id' => $group->id,
            'code' => '01',
        ]);

        $this->actingAs($this->user)
            ->patch(route('categories.update', $category->id), [
                'name' => 'Baru',
                'classification_type' => ClassificationLevel::CATEGORY->value,
                'classification_id' => $categoryNode->id,
            ])
            ->assertRedirect();

        $category->refresh();

        $this->assertSame('Baru', $category->name);
        $this->assertSame('02.01', $category->code);
        $this->assertSame($categoryNode->id, $category->classification_id);
    }

    public function test_category_from_another_tenant_cannot_be_updated(): void
    {
        Tenant::create(['id' => 'other', 'name' => 'Other Corp']);
        $foreign = Category::factory()->create();
        $foreign->forceFill(['tenant_id' => 'other'])->save();

        $this->actingAs($this->user)
            ->patch(route('categories.update', $foreign->id), [
                'name' => 'X',
                'classification_type' => ClassificationLevel::GROUP->value,
                'classification_id' => $foreign->classification_id,
            ])
            ->assertNotFound();
    }

    public function test_category_can_be_deleted(): void
    {
        $category = Category::factory()->create();

        $this->actingAs($this->user)
            ->delete(route('categories.destroy', $category->id))
            ->assertRedirect();

        $this->assertSame(0, Category::withoutGlobalScopes()->count());
    }

    public function test_category_from_another_tenant_cannot_be_deleted(): void
    {
        Tenant::create(['id' => 'other', 'name' => 'Other Corp']);
        $foreign = Category::factory()->create();
        $foreign->forceFill(['tenant_id' => 'other'])->save();

        $this->actingAs($this->user)
            ->delete(route('categories.destroy', $foreign->id))
            ->assertNotFound();

        $this->assertSame(1, Category::withoutGlobalScopes()->count());
    }

    public function test_categories_can_be_bulk_deleted(): void
    {
        Category::factory()->count(3)->create();
        $ids = Category::query()->pluck('id')->all();

        $this->actingAs($this->user)
            ->from(route('categories.index'))
            ->delete(route('categories.destroy-bulk'), ['ids' => $ids])
            ->assertRedirect();

        $this->assertSame(0, Category::withoutGlobalScopes()->count());
    }

    public function test_bulk_delete_requires_ids(): void
    {
        $this->actingAs($this->user)
            ->from(route('categories.index'))
            ->delete(route('categories.destroy-bulk'), ['ids' => []])
            ->assertSessionHasErrors(['ids']);

        $this->assertSame(0, Category::withoutGlobalScopes()->count());
    }
}
