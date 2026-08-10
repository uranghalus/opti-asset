<?php

namespace App\Http\Controllers;

use App\Actions\GenerateAssetCodeAction;
use App\Actions\GenerateAssetImportTemplateAction;
use App\Actions\ImportAssetsAction;
use App\Http\Requests\ImportAssetsRequest;
use App\Http\Requests\StoreAssetRequest;
use App\Http\Requests\UpdateAssetRequest;
use App\Http\Requests\UploadAssetMediaRequest;
use App\Models\Asset;
use App\Models\AssetCategory;
use App\Models\AssetCluster;
use App\Models\AssetGroup;
use App\Models\AssetSubCluster;
use App\Models\Department;
use App\Models\Employee;
use App\Models\Item;
use App\Models\Location;
use App\Models\Tenant;
use Illuminate\Filesystem\FilesystemAdapter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

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
        $department = $request->string('department')->trim()->toString();
        $condition = $request->string('condition')->trim()->toString();

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
            ->when($department !== '', fn ($query) => $query->where('department_id', $department))
            ->when($condition !== '', fn ($query) => $query->where('condition', $condition))
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
                'department' => $department,
                'condition' => $condition,
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
            $validated['asset_group_id'] ?? null,
            $validated['asset_category_id'] ?? null,
            $validated['asset_cluster_id'] ?? null,
            $validated['asset_sub_cluster_id'] ?? null,
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

    public function upload(UploadAssetMediaRequest $request): JsonResponse
    {
        $tenantId = Tenant::current()->id;

        /** @var FilesystemAdapter $disk */
        $disk = Storage::disk('public');
        $path = $disk->putFile("assets/{$tenantId}/media", $request->file('file'));

        if (! is_string($path)) {
            return response()->json(['message' => 'Tidak dapat menyimpan file.'], 500);
        }

        return response()->json(['url' => $disk->url($path)]);
    }

    public function importTemplate(GenerateAssetImportTemplateAction $action): BinaryFileResponse
    {
        $path = storage_path('app/'.'temp-import-aset-'.uniqid().'.xlsx');

        $action($path);

        return response()
            ->download($path, 'template-import-aset.xlsx')
            ->deleteFileAfterSend(true);
    }

    public function import(
        ImportAssetsRequest $request,
        ImportAssetsAction $action,
    ): RedirectResponse {
        $file = $request->file('file');

        if (! $file instanceof UploadedFile) {
            throw new \RuntimeException('File upload tidak valid.');
        }

        $tempPath = $file->store('assets/imports', ['disk' => 'local']);

        if (! is_string($tempPath)) {
            throw new \RuntimeException('Tidak dapat menyimpan file sementara.');
        }

        $result = $action(Storage::disk('local')->path($tempPath), [
            'asset_group_id' => $request->string('asset_group_id')->toString(),
            'asset_category_id' => $request->string('asset_category_id')->toString(),
            'asset_cluster_id' => $request->string('asset_cluster_id')->toString(),
            'asset_sub_cluster_id' => $request->string('asset_sub_cluster_id')->toString(),
        ]);

        Storage::disk('local')->delete($tempPath);

        Inertia::flash('toast', [
            'type' => $result['skipped'] > 0 ? 'warning' : 'success',
            'message' => $result['skipped'] > 0
                ? "{$result['imported']} aset diimpor, {$result['skipped']} baris dilewati."
                : "{$result['imported']} aset berhasil diimpor.",
        ]);

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
            'employees' => Employee::query()->orderBy('nama_employee')->get(['id_employee', 'nama_employee']),
        ];
    }
}
