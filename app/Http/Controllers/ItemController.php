<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreItemRequest;
use App\Http\Requests\UpdateItemRequest;
use App\Models\AssetCategory;
use App\Models\Department;
use App\Models\Item;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ItemController extends Controller
{
    public function index(Request $request): Response
    {
        $perPage = min((int) $request->integer('per_page', 15), 100);

        $search = $request->string('search')->trim()->toString();
        $sort = $request->string('sort')->toString();
        $category = $request->string('category')->trim()->toString();
        $department = $request->string('department')->trim()->toString();

        [$sortColumn, $sortDirection] = match ($sort) {
            'name' => ['name', 'asc'],
            '-name' => ['name', 'desc'],
            'code' => ['code', 'asc'],
            '-code' => ['code', 'desc'],
            default => ['created_at', 'desc'],
        };

        $items = Item::query()
            ->with('category:id,name', 'department:id_department,nama_department')
            ->when($search !== '', fn ($query) => $query->where(fn ($query) => $query
                ->where('name', 'like', "%{$search}%")
                ->orWhere('code', 'like', "%{$search}%")))
            ->when($category !== '', fn ($query) => $query->where('category_id', $category))
            ->when($department !== '', fn ($query) => $query->where('department_id', $department))
            ->orderBy($sortColumn, $sortDirection)
            ->paginate($perPage)
            ->withQueryString();

        return Inertia::render('items/Index', [
            'items' => $items,
            'categories' => AssetCategory::query()->orderBy('name')->get(['id', 'name']),
            'departments' => Department::query()->orderBy('nama_department')->get(['id_department', 'nama_department']),
            'filters' => [
                'search' => $search,
                'sort' => $sort,
                'category' => $category,
                'department' => $department,
            ],
        ]);
    }

    public function store(StoreItemRequest $request): RedirectResponse
    {
        Item::create($request->validated());

        return back();
    }

    public function update(UpdateItemRequest $request, Item $item): RedirectResponse
    {
        $item->update($request->validated());

        return back();
    }

    public function destroy(Item $item): RedirectResponse
    {
        $item->delete();

        return back();
    }
}
