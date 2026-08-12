<?php

namespace App\Http\Controllers;

use App\Actions\GenerateAssetCodeAction;
use App\Actions\GenerateAssetImportTemplateAction;
use App\Actions\ImportAssetsAction;
use App\Actions\RecordAssetHistoryAction;
use App\Http\Requests\ImportAssetsRequest;
use App\Http\Requests\StoreAssetRequest;
use App\Http\Requests\UpdateAssetRequest;
use App\Http\Requests\UploadAssetMediaRequest;
use App\Models\Asset;
use App\Models\AssetGroup;
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
        private RecordAssetHistoryAction $recordHistory,
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
            'items' => Item::query()
                ->with('category:id,code')
                ->orderBy('name')
                ->get(['id', 'code', 'name', 'category_id']),
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

    public function labels(Request $request): Response
    {
        $validated = $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['required', 'string'],
        ]);

        $assets = Asset::query()
            ->whereKey($validated['ids'])
            ->with($this->labelRelations())
            ->orderBy('kode_asset')
            ->get();

        return Inertia::render('assets/Labels', [
            'assets' => $assets,
        ]);
    }

    public function labelsBatch(Request $request): Response
    {
        $assets = Asset::query()
            ->with($this->labelRelations())
            ->orderBy('kode_asset')
            ->get();

        return Inertia::render('assets/LabelsBatch', [
            'assets' => $assets,
        ]);
    }

    public function scan(): Response
    {
        return Inertia::render('assets/Scan');
    }

    public function scanLookup(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'code' => ['required', 'string', 'max:100'],
        ]);

        $asset = Asset::query()
            ->where('kode_asset', $validated['code'])
            ->with([
                'item:id,name,code',
                'location:id,name',
                'department:id_department,nama_department',
                'assetGroup:id,code,name',
                'assetCategory:id,code,name',
                'assetCluster:id,code,name',
                'assetSubCluster:id,code,name',
            ])
            ->first();

        if ($asset === null) {
            return response()->json(['message' => 'Aset tidak ditemukan.'], 404);
        }

        return response()->json(['asset' => $asset]);
    }

    public function create(): Response
    {
        return Inertia::render('assets/Create', $this->formProps());
    }

    public function show(Asset $asset): Response
    {
        $asset->load([
            'item:id,name,code',
            'location:id,name',
            'department:id_department,nama_department',
            'assetGroup:id,code,name',
            'assetCategory:id,code,name',
            'assetCluster:id,code,name',
            'assetSubCluster:id,code,name',
            'histories' => fn ($query) => $query
                ->latest()
                ->limit(50),
        ]);

        return Inertia::render('assets/Show', [
            'asset' => $asset,
        ]);
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
            ...$this->formProps($asset->id),
            'asset' => $asset,
        ]);
    }

    public function store(StoreAssetRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        $item = Item::with('category')->findOrFail($validated['item_id']);

        $chain = $item->category !== null
            ? $this->generateAssetCode->fromCategory($item->category)
            : $this->emptyChain();

        $asset = Asset::create([...$validated, ...$chain]);

        $this->recordHistory->record(
            $asset,
            [['created', null, $asset->kode_asset ?? $asset->item_id ?? $asset->id]],
            $request->user(),
        );

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Aset berhasil ditambahkan.']);

        return redirect()->route('assets.index');
    }

    public function update(UpdateAssetRequest $request, Asset $asset): RedirectResponse
    {
        $validated = $request->validated();

        $itemId = $validated['item_id'] ?? $asset->item_id;
        $itemChanged = $itemId !== $asset->item_id;

        $data = $validated;

        if ($itemChanged) {
            $item = Item::with('category')->findOrFail($itemId);

            $chain = $item->category !== null
                ? $this->generateAssetCode->fromCategory($item->category, $asset->id)
                : $this->emptyChain();

            $data['kode_asset'] = $chain['kode_asset'] ?? $asset->kode_asset;
            $data['asset_group_id'] = $chain['asset_group_id'];
            $data['asset_category_id'] = $chain['asset_category_id'];
            $data['asset_cluster_id'] = $chain['asset_cluster_id'];
            $data['asset_sub_cluster_id'] = $chain['asset_sub_cluster_id'];
        }

        $this->recordHistory->fromUpdate($asset, $validated, $data['kode_asset'] ?? null, $request->user());

        $asset->update($data);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Aset berhasil diperbarui.']);

        return redirect()->route('assets.index');
    }

    /**
     * @return array{kode_asset: null, asset_group_id: null, asset_category_id: null, asset_cluster_id: null, asset_sub_cluster_id: null}
     */
    private function emptyChain(): array
    {
        return [
            'kode_asset' => null,
            'asset_group_id' => null,
            'asset_category_id' => null,
            'asset_cluster_id' => null,
            'asset_sub_cluster_id' => null,
        ];
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

        $result = $action(Storage::disk('local')->path($tempPath), Item::findOrFail($request->string('item_id')->toString()));

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
     * @return array<int, string>
     */
    private function labelRelations(): array
    {
        return [
            'item:id,name,code',
            'assetGroup:id,code,name',
            'assetCategory:id,code,name',
            'assetCluster:id,code,name',
            'assetSubCluster:id,code,name',
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function formProps(?string $exceptAssetId = null): array
    {
        return [
            'items' => Item::query()
                ->with('category:id,code')
                ->orderBy('name')
                ->get(['id', 'code', 'name', 'category_id'])
                ->map(fn (Item $item): array => [
                    'id' => $item->id,
                    'code' => $item->code,
                    'name' => $item->name,
                    'category_code' => $item->category?->code,
                ])
                ->values(),
            'locations' => Location::query()->orderBy('name')->get(['id', 'name']),
            'departments' => Department::query()->orderBy('nama_department')->get(['id_department', 'nama_department']),
            'employees' => Employee::query()->orderBy('nama_employee')->get(['id_employee', 'nama_employee']),
            'nextSequences' => $this->generateAssetCode->nextSequenceMap($exceptAssetId),
        ];
    }
}
