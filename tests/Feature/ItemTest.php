<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Item;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ItemTest extends TestCase
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

    public function test_index_renders_items_with_pagination(): void
    {
        Item::factory()->count(20)->create();

        $this->actingAs($this->user)
            ->get(route('items.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('items/Index')
                ->has('items.data', 15)
                ->where('items.total', 20)
                ->where('items.per_page', 15)
                ->where('items.last_page', 2));
    }

    public function test_index_searches_items_by_name_or_code(): void
    {
        Item::factory()->create(['name' => 'Notebook', 'code' => 'ITM-001']);
        Item::factory()->create(['name' => 'Printer', 'code' => 'ITM-002']);

        $this->actingAs($this->user)
            ->get(route('items.index', ['search' => 'ITM-001']))
            ->assertInertia(fn (Assert $page) => $page
                ->where('items.total', 1)
                ->where('items.data.0.name', 'Notebook')
                ->where('filters.search', 'ITM-001'));
    }

    public function test_index_filters_by_category_and_department(): void
    {
        $category = Category::factory()->create();
        $other = Category::factory()->create();

        Item::factory()->create(['name' => 'Kategori Satu', 'category_id' => $category->id]);
        Item::factory()->create(['name' => 'Kategori Dua', 'category_id' => $other->id]);

        $this->actingAs($this->user)
            ->get(route('items.index', ['category' => $category->id]))
            ->assertInertia(fn (Assert $page) => $page
                ->where('items.total', 1)
                ->where('items.data.0.name', 'Kategori Satu'));
    }

    public function test_index_sorts_by_name(): void
    {
        Item::factory()->create(['name' => 'Zulu']);
        Item::factory()->create(['name' => 'Alpha']);

        $this->actingAs($this->user)
            ->get(route('items.index', ['sort' => 'name']))
            ->assertInertia(fn (Assert $page) => $page
                ->where('items.data.0.name', 'Alpha')
                ->where('items.data.1.name', 'Zulu'));
    }

    public function test_index_only_lists_current_tenants_items(): void
    {
        Item::factory()->create();
        Tenant::create(['id' => 'other', 'name' => 'Other Corp']);
        $foreign = Item::factory()->create();
        $foreign->forceFill(['tenant_id' => 'other'])->save();

        $this->actingAs($this->user)
            ->get(route('items.index'))
            ->assertInertia(fn (Assert $page) => $page->where('items.total', 1));
    }

    public function test_item_can_be_created(): void
    {
        $this->actingAs($this->user)->post(route('items.store'), [
            'code' => 'ITM-100',
            'name' => 'Notebook Dell',
        ])->assertRedirect();

        $item = Item::first();

        $this->assertNotNull($item);
        $this->assertSame($this->tenant->id, $item->tenant_id);
        $this->assertSame('Notebook Dell', $item->name);
    }

    public function test_item_code_is_unique_per_tenant(): void
    {
        Item::factory()->create(['code' => 'ITM-001']);

        $this->actingAs($this->user)
            ->from(route('items.index'))
            ->post(route('items.store'), [
                'code' => 'ITM-001',
                'name' => 'Duplikat',
            ])
            ->assertSessionHasErrors('code');
    }

    public function test_item_requires_name(): void
    {
        $this->actingAs($this->user)
            ->from(route('items.index'))
            ->post(route('items.store'), ['code' => 'ITM-101'])
            ->assertSessionHasErrors('name');
    }

    public function test_item_can_be_updated(): void
    {
        $item = Item::factory()->create(['name' => 'Lama']);

        $this->actingAs($this->user)
            ->patch(route('items.update', $item->id), [
                'code' => $item->code,
                'name' => 'Baru',
            ])
            ->assertRedirect();

        $this->assertSame('Baru', $item->fresh()->name);
    }

    public function test_item_from_another_tenant_cannot_be_updated(): void
    {
        Tenant::create(['id' => 'other', 'name' => 'Other Corp']);
        $foreign = Item::factory()->create();
        $foreign->forceFill(['tenant_id' => 'other'])->save();

        $this->actingAs($this->user)
            ->patch(route('items.update', $foreign->id), [
                'code' => 'X',
                'name' => 'X',
            ])
            ->assertNotFound();
    }

    public function test_item_can_be_deleted(): void
    {
        $item = Item::factory()->create();

        $this->actingAs($this->user)
            ->delete(route('items.destroy', $item->id))
            ->assertRedirect();

        $this->assertSame(0, Item::withoutGlobalScopes()->count());
    }

    public function test_batch_assign_category_updates_selected_items(): void
    {
        $category = Category::factory()->create();
        $items = Item::factory()->count(3)->create(['category_id' => null]);

        $this->actingAs($this->user)
            ->from(route('items.index'))
            ->post(route('items.batch-category'), [
                'ids' => $items->pluck('id')->all(),
                'category_id' => $category->id,
            ])
            ->assertRedirect();

        $this->assertSame(3, Item::where('category_id', $category->id)->count());
    }

    public function test_batch_assign_category_does_not_touch_other_items(): void
    {
        $category = Category::factory()->create();
        $other = Category::factory()->create();
        $target = Item::factory()->create(['category_id' => $other->id]);
        $untouched = Item::factory()->create(['category_id' => $other->id]);

        $this->actingAs($this->user)
            ->from(route('items.index'))
            ->post(route('items.batch-category'), [
                'ids' => [$target->id],
                'category_id' => $category->id,
            ])
            ->assertRedirect();

        $this->assertSame($category->id, $target->fresh()->category_id);
        $this->assertSame($other->id, $untouched->fresh()->category_id);
    }

    public function test_batch_assign_category_requires_ids(): void
    {
        $this->actingAs($this->user)
            ->from(route('items.index'))
            ->post(route('items.batch-category'), [])
            ->assertSessionHasErrors(['ids']);
    }

    public function test_batch_assign_category_can_clear_category(): void
    {
        $category = Category::factory()->create();
        $items = Item::factory()->count(2)->create(['category_id' => $category->id]);

        $this->actingAs($this->user)
            ->from(route('items.index'))
            ->post(route('items.batch-category'), [
                'ids' => $items->pluck('id')->all(),
                'category_id' => '',
            ])
            ->assertRedirect();

        $this->assertSame(0, Item::where('category_id', $category->id)->count());
    }

    public function test_batch_assign_category_only_updates_current_tenants_items(): void
    {
        $category = Category::factory()->create();
        Tenant::create(['id' => 'other', 'name' => 'Other Corp']);
        $foreign = Item::factory()->create(['category_id' => null]);
        $foreign->forceFill(['tenant_id' => 'other'])->save();

        $this->actingAs($this->user)
            ->from(route('items.index'))
            ->post(route('items.batch-category'), [
                'ids' => [$foreign->id],
                'category_id' => $category->id,
            ])
            ->assertRedirect();

        $this->assertNull($foreign->fresh()->category_id);
    }
}
