<?php

namespace App\Http\Controllers;

use App\Enums\ClassificationLevel;
use App\Models\AssetCategory;
use App\Models\AssetCluster;
use App\Models\AssetGroup;
use App\Models\AssetSubCluster;
use App\Models\Category;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class CategoryController extends Controller
{
    public function index(Request $request): Response
    {
        $perPage = min((int) $request->integer('per_page', 15), 100);

        $search = $request->string('search')->trim()->toString();
        $sort = $request->string('sort')->toString();

        [$sortColumn, $sortDirection] = match ($sort) {
            'name' => ['name', 'asc'],
            '-name' => ['name', 'desc'],
            'code' => ['code', 'asc'],
            '-code' => ['code', 'desc'],
            default => ['created_at', 'desc'],
        };

        $categories = Category::query()
            ->when($search !== '', fn ($query) => $query->where(fn ($query) => $query
                ->where('name', 'like', "%{$search}%")
                ->orWhere('code', 'like', "%{$search}%")))
            ->orderBy($sortColumn, $sortDirection)
            ->paginate($perPage)
            ->withQueryString();

        $categories->through(fn (Category $category): array => $this->serialize($category));

        return Inertia::render('categories/Index', [
            'categories' => $categories,
            'groups' => AssetGroup::query()->orderBy('sort_order')->get(['id', 'code', 'name']),
            'optionCategories' => AssetCategory::query()->orderBy('sort_order')->get(['id', 'asset_group_id', 'code', 'name']),
            'optionClusters' => AssetCluster::query()->orderBy('sort_order')->get(['id', 'asset_category_id', 'code', 'name']),
            'optionSubClusters' => AssetSubCluster::query()->orderBy('sort_order')->get(['id', 'asset_cluster_id', 'code', 'name']),
            'filters' => [
                'search' => $search,
                'sort' => $sort,
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'classification_type' => ['required', Rule::enum(ClassificationLevel::class)],
            'classification_id' => ['required', 'uuid'],
        ]);

        $level = ClassificationLevel::from($validated['classification_type']);

        if (Category::chainFor($level, $validated['classification_id']) === []) {
            abort(404);
        }

        Category::create([
            'name' => $validated['name'],
            'code' => $this->buildCode($level, $validated['classification_id']),
            'classification_id' => $validated['classification_id'],
            'classification_type' => $level,
        ]);

        return back();
    }

    public function update(Request $request, Category $category): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'classification_type' => ['required', Rule::enum(ClassificationLevel::class)],
            'classification_id' => ['required', 'uuid'],
        ]);

        $level = ClassificationLevel::from($validated['classification_type']);

        if (Category::chainFor($level, $validated['classification_id']) === []) {
            abort(404);
        }

        $category->update([
            'name' => $validated['name'],
            'code' => $this->buildCode($level, $validated['classification_id']),
            'classification_id' => $validated['classification_id'],
            'classification_type' => $level,
        ]);

        return back();
    }

    public function destroy(Category $category): RedirectResponse
    {
        $category->delete();

        return back();
    }

    public function destroyBulk(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['required', 'string'],
        ]);

        Category::query()->whereKey($validated['ids'])->delete();

        return back();
    }

    /**
     * @return array{id: string, name: string, code: string|null, classification_type: string|null, classification_id: string|null, chain: array<int, array{level: string, id: string, code: string|null, name: string}>, created_at: string}
     */
    private function serialize(Category $category): array
    {
        $chain = Category::chainFor($category->classification_type, $category->classification_id);

        return [
            'id' => $category->id,
            'name' => $category->name,
            'code' => $category->code,
            'classification_type' => $category->classification_type?->value,
            'classification_id' => $category->classification_id,
            'chain' => $chain,
            'created_at' => $category->created_at?->toISOString() ?? '',
        ];
    }

    private function buildCode(ClassificationLevel $level, string $id): ?string
    {
        $codes = array_values(array_filter(
            array_map(fn (array $node): ?string => $node['code'], Category::chainFor($level, $id)),
            static fn (?string $code): bool => $code !== null && $code !== '',
        ));

        return $codes === [] ? null : implode('.', $codes);
    }
}
