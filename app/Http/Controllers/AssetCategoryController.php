<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreCategoryRequest;
use App\Http\Requests\UpdateCategoryRequest;
use App\Models\AssetCategory;
use App\Models\AssetGroup;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AssetCategoryController extends Controller
{
    public function index(Request $request): Response
    {
        $perPage = min((int) $request->integer('per_page', 15), 100);

        $search = $request->string('search')->trim()->toString();
        $sort = $request->string('sort')->toString();
        $group = $request->string('group')->trim()->toString();

        [$sortColumn, $sortDirection] = match ($sort) {
            'name' => ['name', 'asc'],
            '-name' => ['name', 'desc'],
            'code' => ['code', 'asc'],
            '-code' => ['code', 'desc'],
            default => ['created_at', 'desc'],
        };

        $categories = AssetCategory::query()
            ->with('assetGroup:id,name')
            ->when($search !== '', fn ($query) => $query->where(fn ($query) => $query
                ->where('name', 'like', "%{$search}%")
                ->orWhere('code', 'like', "%{$search}%")))
            ->when($group !== '', fn ($query) => $query->where('asset_group_id', $group))
            ->orderBy($sortColumn, $sortDirection)
            ->paginate($perPage)
            ->withQueryString();

        return Inertia::render('categories/Index', [
            'categories' => $categories,
            'groups' => AssetGroup::query()->orderBy('name')->get(['id', 'name']),
            'filters' => [
                'search' => $search,
                'sort' => $sort,
                'group' => $group,
            ],
        ]);
    }

    public function store(StoreCategoryRequest $request): RedirectResponse
    {
        $group = AssetGroup::whereKey($request->validated('asset_group_id'))->firstOrFail();

        $group->categories()->create($request->validated());

        return back();
    }

    public function update(UpdateCategoryRequest $request, AssetCategory $category): RedirectResponse
    {
        AssetGroup::whereKey($request->validated('asset_group_id'))->firstOrFail();

        $category->update($request->validated());

        return back();
    }

    public function destroy(AssetCategory $category): RedirectResponse
    {
        $category->delete();

        return back();
    }
}
