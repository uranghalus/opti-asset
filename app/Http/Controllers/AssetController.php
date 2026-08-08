<?php

namespace App\Http\Controllers;

use App\Actions\GenerateAssetCodeAction;
use App\Http\Requests\StoreAssetRequest;
use App\Http\Requests\UpdateAssetRequest;
use App\Models\Asset;
use App\Models\AssetCategory;
use App\Models\AssetCluster;
use App\Models\AssetGroup;
use App\Models\AssetSubCluster;
use App\Models\Department;
use App\Models\Item;
use App\Models\Location;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AssetController extends Controller
{
    public function __construct(
        private GenerateAssetCodeAction $generateAssetCode,
    ) {}

    public function index(Request $request): Response
    {
        $perPage = min((int) $request->integer('per_page', 15), 100);

        $search = $request->string('search')->trim()->toString();
        $group = $request->string('group')->trim()->toString();
        $category = $request->string('category')->trim()->toString();
        $status = $request->string('status')->trim()->toString();

        $assets = Asset::query()
            ->with([
                'item:id,name,code',
                'location:id,name',
                'department:id_department,nama_department',
                'assetGroup:id,code,name',
                'assetCategory:id,code,name',
                'assetCluster:id,code,name',
                'assetSubCluster:id,code,name',
            ])
            ->when($search !== '', fn ($query) => $query->where(fn ($query) => $query
                ->where('kode_asset', 'like', "%{$search}%")
                ->orWhere('serial_number', 'like', "%{$search}%")
                ->orWhere('brand', 'like', "%{$search}%")
                ->orWhere('model', 'like', "%{$search}%")))
            ->when($group !== '', fn ($query) => $query->where('asset_group_id', $group))
            ->when($category !== '', fn ($query) => $query->where('asset_category_id', $category))
            ->when($status !== '', fn ($query) => $query->where('status', $status))
            ->orderBy('created_at', 'desc')
            ->paginate($perPage)
            ->withQueryString();

        return Inertia::render('assets/Index', [
            'assets' => $assets,
            'groups' => AssetGroup::query()->orderBy('sort_order')->get(['id', 'code', 'name']),
            'categories' => AssetCategory::query()->orderBy('sort_order')->get(['id', 'asset_group_id', 'code', 'name']),
            'clusters' => AssetCluster::query()->orderBy('sort_order')->get(['id', 'asset_category_id', 'code', 'name']),
            'subClusters' => AssetSubCluster::query()->orderBy('sort_order')->get(['id', 'asset_cluster_id', 'code', 'name']),
            'items' => Item::query()->orderBy('name')->get(['id', 'code', 'name']),
            'locations' => Location::query()->orderBy('name')->get(['id', 'name']),
            'departments' => Department::query()->orderBy('nama_department')->get(['id_department', 'nama_department']),
            'filters' => [
                'search' => $search,
                'group' => $group,
                'category' => $category,
                'status' => $status,
            ],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('assets/Create', $this->formProps());
    }

    public function edit(Asset $asset): Response
    {
        $asset->load([
            'item:id,name,code',
            'location:id,name',
            'department:id_department,nama_department',
            'assetGroup:id,code,name',
            'assetCategory:id,code,name',
            'assetCluster:id,code,name',
            'assetSubCluster:id,code,name',
        ]);

        return Inertia::render('assets/Edit', [
            ...$this->formProps(),
            'asset' => $asset,
        ]);
    }

    public function store(StoreAssetRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        $chain = $this->generateAssetCode->fromIds(
            $validated['asset_group_id'],
            $validated['asset_category_id'],
            $validated['asset_cluster_id'],
            $validated['asset_sub_cluster_id'],
        );

        Asset::create([...$validated, 'kode_asset' => $chain['code']]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Aset berhasil ditambahkan.']);

        return redirect()->route('assets.index');
    }

    public function update(UpdateAssetRequest $request, Asset $asset): RedirectResponse
    {
        $validated = $request->validated();

        $chain = $this->generateAssetCode->fromIds(
            $validated['asset_group_id'] ?? $asset->asset_group_id,
            $validated['asset_category_id'] ?? $asset->asset_category_id,
            $validated['asset_cluster_id'] ?? $asset->asset_cluster_id,
            $validated['asset_sub_cluster_id'] ?? $asset->asset_sub_cluster_id,
            $asset->id,
        );

        $asset->update([...$validated, 'kode_asset' => $chain['code'] ?? $asset->kode_asset]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Aset berhasil diperbarui.']);

        return redirect()->route('assets.index');
    }

    public function destroy(Asset $asset): RedirectResponse
    {
        $asset->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Aset berhasil dihapus.']);

        return redirect()->route('assets.index');
    }

    /**
     * @return array<string, mixed>
     */
    private function formProps(): array
    {
        return [
            'groups' => AssetGroup::query()->orderBy('sort_order')->get(['id', 'code', 'name']),
            'categories' => AssetCategory::query()->orderBy('sort_order')->get(['id', 'asset_group_id', 'code', 'name']),
            'clusters' => AssetCluster::query()->orderBy('sort_order')->get(['id', 'asset_category_id', 'code', 'name']),
            'subClusters' => AssetSubCluster::query()->orderBy('sort_order')->get(['id', 'asset_cluster_id', 'code', 'name']),
            'items' => Item::query()->orderBy('name')->get(['id', 'code', 'name']),
            'locations' => Location::query()->orderBy('name')->get(['id', 'name']),
            'departments' => Department::query()->orderBy('nama_department')->get(['id_department', 'nama_department']),
        ];
    }
}
