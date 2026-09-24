<?php

namespace App\Http\Controllers;

use App\Actions\GenerateAssetCodeAction;
use App\Actions\GenerateAssetImportTemplateAction;
use App\Actions\ImportAssetsAction;
use App\Actions\RecordAssetHistoryAction;
use App\Enums\AssetStatus;
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
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

/**
 * @phpstan-type BrowseNode array{id: string, code: string|null, name: string, description: string|null, notes?: string|null, child_count: int, asset_count: int, level: string, children: array<int, mixed>}
 */
class AssetController extends Controller
{
    public function __construct(
        private GenerateAssetCodeAction $generateAssetCode,
        private RecordAssetHistoryAction $recordHistory,
    ) {}

    /**
     * Pseudo-node id that lists assets without a classification
     * at the requested level, so grouped browsing never hides rows.
     */
    public const UNCLASSIFIED_NODE = 'unclassified';

    public function index(Request $request): Response|JsonResponse
    {
        Gate::authorize('asset.view');

        return $this->browseResponse($request, 'assets/Index');
    }

    public function grouped(Request $request): Response|JsonResponse
    {
        Gate::authorize('asset.view');

        return $this->browseResponse($request, 'assets/Index');
    }

    public function browse(Request $request): Response|JsonResponse
    {
        Gate::authorize('asset.view');

        return $this->browseResponse($request, 'assets/Index');
    }

    /**
     * Shared grouped-browsing payload: classification tree, drill-down
     * breadcrumb/selection, and the paginated asset ledger for the
     * selected node (or null when no node is selected yet).
     *
     * @return array<string, mixed>
     */
    private function browsePayload(Request $request): array
    {
        $perPage = min((int) $request->integer('per_page', 15), 100);
        $initialLevel = $this->initialFilterLevel($request);
        $level = $request->string('level')->trim()->toString();
        $nodeId = $request->string('node')->trim()->toString();
        $allowedLevels = ['category', 'cluster', 'sub-cluster'];
        $validLevel = $level !== '' && in_array($level, $allowedLevels, true) && $nodeId !== '';
        $unclassified = $validLevel && $nodeId === self::UNCLASSIFIED_NODE;

        $search = $request->string('search')->trim()->toString();
        $status = $request->string('status')->trim()->toString();
        $assetType = $request->string('asset_type')->trim()->toString();
        $department = $request->string('department')->trim()->toString();
        $condition = $request->string('condition')->trim()->toString();
        $location = $request->string('location')->trim()->toString();

        $tree = $this->buildBrowseTree();
        $breadcrumb = [];
        $selected = null;
        $assets = null;

        if ($validLevel) {
            $breadcrumb = $unclassified
                ? [['id' => self::UNCLASSIFIED_NODE, 'level' => $level, 'code' => null, 'name' => 'Tanpa Klasifikasi']]
                : $this->buildBreadcrumb($level, $nodeId);
            $selected = ['level' => $level, 'id' => $nodeId];
            $field = match ($level) {
                'group' => 'asset_group_id',
                'category' => 'asset_category_id',
                'cluster' => 'asset_cluster_id',
                'sub-cluster' => 'asset_sub_cluster_id',
            };
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
                ->when($unclassified, fn ($query) => $query->whereNull($field), fn ($query) => $query->where($field, $nodeId))
                ->when($search !== '', fn ($query) => $query->where(fn ($query) => $query
                    ->where('kode_asset', 'like', "%{$search}%")
                    ->orWhere('serial_number', 'like', "%{$search}%")
                    ->orWhere('brand', 'like', "%{$search}%")
                    ->orWhere('model', 'like', "%{$search}%")
                    // FR-04.1 — pencarian juga mencocokkan nama item.
                    ->orWhereHas('item', fn ($item) => $item->where('name', 'like', "%{$search}%"))))
                ->when($status !== '', fn ($query) => $query->where('status', $status))
                ->when($assetType !== '', fn ($query) => $query->where('asset_type', $assetType))
                ->when($department !== '', fn ($query) => $query->where('department_id', $department))
                ->when($condition !== '', fn ($query) => $query->where('condition', $condition))
                // FR-04.2 — filter lokasi pada halaman daftar aset.
                ->when($location !== '', fn ($query) => $query->where('location_id', $location))
                ->orderBy('created_at', 'desc')
                ->paginate($perPage)
                ->withQueryString();
        }

        return [
            'tree' => $tree,
            'selected' => $selected,
            'breadcrumb' => $breadcrumb,
            'assets' => $assets,
            'unclassifiedCount' => Asset::query()->whereNull('asset_group_id')->count(),
            'groups' => AssetGroup::query()->orderBy('sort_order')->get(['id', 'code', 'name']),
            'categories' => AssetCategory::query()->orderBy('sort_order')->get(['id', 'code', 'name', 'asset_group_id']),
            'items' => Item::query()->with('category:id,code')->orderBy('name')->get(['id', 'code', 'name', 'category_id']),
            'locations' => Location::query()->orderBy('name')->get(['id', 'name']),
            'departments' => Department::query()->orderBy('nama_department')->get(['id_department', 'nama_department']),
            'filters' => [
                'search' => $search,
                'status' => $status,
                'asset_type' => $assetType,
                'department' => $department,
                'condition' => $condition,
                'location' => $location,
                'level' => $validLevel ? $level : '',
                'node' => $validLevel ? $nodeId : '',
                'initialLevel' => $initialLevel,
            ],
        ];
    }

    private function browseResponse(Request $request, string $component): Response|JsonResponse
    {
        $payload = $this->browsePayload($request);

        if ($request->boolean('json')) {
            return response()->json([
                'tree' => $payload['tree'],
                'selected' => $payload['selected'],
                'breadcrumb' => $payload['breadcrumb'],
                'assets' => $payload['assets'],
                'unclassifiedCount' => $payload['unclassifiedCount'],
                'filters' => $payload['filters'],
            ]);
        }

        return Inertia::render($component, $payload);
    }

    /**
     * @return array<int, BrowseNode>
     */
    private function buildBrowseTree(): array
    {
        $user = request()->user();
        if ($user !== null && $user->hasAnyRole(['Asset Staff', 'Accounting', 'staff-asset', 'akunting'])) {
            return AssetCategory::query()
                ->withCount('assets')
                ->with([
                    'clusters' => fn ($query) => $query
                        ->withCount('assets')
                        ->orderBy('sort_order')
                        ->orderBy('code')
                        ->with([
                            'subClusters' => fn ($query) => $query
                                ->withCount('assets')
                                ->orderBy('sort_order')
                                ->orderBy('code'),
                        ]),
                ])
                ->orderBy('sort_order')
                ->orderBy('code')
                ->get()
                ->map(fn (AssetCategory $category) => $this->serializeBrowseCategory($category))
                ->values()
                ->all();
        }

        return AssetCluster::query()
            ->withCount('assets')
            ->with([
                'subClusters' => fn ($query) => $query
                    ->withCount('assets')
                    ->orderBy('sort_order')
                    ->orderBy('code'),
            ])
            ->orderBy('sort_order')
            ->orderBy('code')
            ->get()
            ->map(fn (AssetCluster $cluster) => $this->serializeBrowseCluster($cluster))
            ->values()
            ->all();
    }

    /** @return BrowseNode */
    private function serializeBrowseGroup(AssetGroup $group): array
    {
        return [
            'id' => $group->id,
            'code' => $group->code,
            'name' => $group->name,
            'description' => $group->description,
            'child_count' => $group->categories_count,
            'asset_count' => $group->assets_count,
            'level' => 'group',
            'children' => $group->categories->map(fn (AssetCategory $category) => $this->serializeBrowseCategory($category))->all(),
        ];
    }

    /** @return BrowseNode */
    private function serializeBrowseCategory(AssetCategory $category): array
    {
        return [
            'id' => $category->id,
            'code' => $category->code,
            'name' => $category->name,
            'description' => $category->description,
            'child_count' => $category->clusters_count,
            'asset_count' => $category->assets_count,
            'level' => 'category',
            'children' => $category->clusters->map(fn (AssetCluster $cluster) => $this->serializeBrowseCluster($cluster))->all(),
        ];
    }

    /** @return BrowseNode */
    private function serializeBrowseCluster(AssetCluster $cluster): array
    {
        return [
            'id' => $cluster->id,
            'code' => $cluster->code,
            'name' => $cluster->name,
            'description' => $cluster->description,
            'child_count' => $cluster->subClusters_count,
            'asset_count' => $cluster->assets_count,
            'level' => 'cluster',
            'children' => $cluster->subClusters->map(fn (AssetSubCluster $subCluster) => $this->serializeBrowseSubCluster($subCluster))->all(),
        ];
    }

    /** @return BrowseNode */
    private function serializeBrowseSubCluster(AssetSubCluster $subCluster): array
    {
        return [
            'id' => $subCluster->id,
            'code' => $subCluster->code,
            'name' => $subCluster->name,
            'description' => $subCluster->description,
            'notes' => $subCluster->notes,
            'child_count' => 0,
            'asset_count' => $subCluster->assets_count,
            'level' => 'sub-cluster',
            'children' => [],
        ];
    }

    /** @return array<int, array{id: string, level: string, code: string|null, name: string}> */
    private function buildBreadcrumb(string $level, string $nodeId): array
    {
        $user = request()->user();
        $isStaff = $user !== null && $user->hasAnyRole(['Asset Staff', 'Accounting', 'staff-asset', 'akunting']);
        $rootLevel = $isStaff ? 'category' : 'cluster';

        $levelModels = [
            'category' => AssetCategory::class,
            'cluster' => AssetCluster::class,
            'sub-cluster' => AssetSubCluster::class,
        ];
        $parentLevels = [
            'cluster' => 'category',
            'sub-cluster' => 'cluster',
        ];
        $crumbs = [];
        $currentLevel = $level;
        $currentId = $nodeId;
        while (true) {
            if (! isset($levelModels[$currentLevel])) {
                break;
            }
            $model = $levelModels[$currentLevel];
            $node = $model::query()->where('id', $currentId)->first();
            if ($node === null) {
                break;
            }
            $crumbs[] = ['id' => $node->id, 'level' => $currentLevel, 'code' => $node->code, 'name' => $node->name];

            if ($currentLevel === $rootLevel) {
                break;
            }

            $nextLevel = $parentLevels[$currentLevel] ?? null;
            if ($nextLevel === null) {
                break;
            }
            $parentId = match ($currentLevel) {
                'cluster' => $node instanceof AssetCluster ? $node->asset_category_id : null,
                'sub-cluster' => $node instanceof AssetSubCluster ? $node->asset_cluster_id : null,
                default => null,
            };
            if ($parentId === null) {
                break;
            }
            $currentLevel = $nextLevel;
            $currentId = $parentId;
        }

        return array_reverse($crumbs);
    }

    public function labels(Request $request): Response
    {
        Gate::authorize('asset.view');

        $validated = $request->validate(['ids' => ['required', 'array', 'min:1'], 'ids.*' => ['required', 'string']]);
        $assets = Asset::query()->whereKey($validated['ids'])->with($this->labelRelations())->orderBy('kode_asset')->get();

        return Inertia::render('assets/Labels', ['assets' => $assets]);
    }

    public function labelsBatch(Request $request): Response
    {
        Gate::authorize('asset.view');

        $assets = Asset::query()->with($this->labelRelations())->orderBy('kode_asset')->get();

        return Inertia::render('assets/LabelsBatch', ['assets' => $assets]);
    }

    public function scan(): Response
    {
        Gate::authorize('asset.view');

        return Inertia::render('assets/Scan');
    }

    public function scanLookup(Request $request): JsonResponse
    {
        Gate::authorize('asset.view');

        $validated = $request->validate(['code' => ['required', 'string', 'max:100']]);
        $asset = Asset::query()->where('kode_asset', $validated['code'])->with(['item:id,name,code', 'location:id,name', 'department:id_department,nama_department', 'assetGroup:id,code,name', 'assetCategory:id,code,name', 'assetCluster:id,code,name', 'assetSubCluster:id,code,name'])->first();
        if ($asset === null) {
            return response()->json(['message' => 'Aset tidak ditemukan.'], 404);
        }

        return response()->json(['asset' => $asset]);
    }

    public function create(): Response
    {
        Gate::authorize('asset.create');

        return Inertia::render('assets/Create', $this->formProps());
    }

    public function show(Asset $asset): Response
    {
        Gate::authorize('asset.view');

        $asset->load([
            'item:id,name,code',
            'location:id,name',
            'department:id_department,nama_department',
            'assetGroup:id,code,name',
            'assetCategory:id,code,name',
            'assetCluster:id,code,name',
            'assetSubCluster:id,code,name',
            'bookValues' => fn ($query) => $query->latest('period_ends_at')->limit(50),
            'histories' => fn ($query) => $query->latest()->limit(50),
        ]);

        return Inertia::render('assets/Show', ['asset' => $asset]);
    }

    public function edit(Asset $asset): Response
    {
        Gate::authorize('asset.edit');

        $asset->load(['item:id,name,code', 'location:id,name', 'department:id_department,nama_department', 'assetGroup:id,code,name', 'assetCategory:id,code,name', 'assetCluster:id,code,name', 'assetSubCluster:id,code,name']);

        return Inertia::render('assets/Edit', [...$this->formProps($asset->id), 'asset' => $asset]);
    }

    public function store(StoreAssetRequest $request): RedirectResponse
    {
        Gate::authorize('asset.create');

        $validated = $request->validated();
        $item = Item::query()->with('category')->whereKey($validated['item_id'])->firstOrFail();
        $chain = $item->category !== null ? $this->generateAssetCode->fromCategory($item->category) : $this->emptyChain();
        $asset = Asset::create([...$validated, ...$chain]);
        $this->recordHistory->record($asset, [['created', null, $asset->kode_asset ?? $asset->item_id ?? $asset->id]], $request->user());
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Aset berhasil ditambahkan.']);

        return redirect()->to($this->safeReturnTo($request) ?? route('assets.index'));
    }

    public function update(UpdateAssetRequest $request, Asset $asset): RedirectResponse
    {
        Gate::authorize('asset.edit');

        // FR-07.6 — aset terhapus tidak boleh diubah (kecuali statusnya sendiri).
        if ($asset->status === AssetStatus::DISPOSED) {
            Inertia::flash('toast', [
                'type' => 'error',
                'message' => 'Aset yang telah dihapus tidak dapat diperbarui.',
            ]);

            return back();
        }

        $validated = $request->validated();

        $itemId = $validated['item_id'] ?? $asset->item_id;
        $itemChanged = $itemId !== $asset->item_id;
        $data = $validated;
        if ($itemChanged) {
            $item = Item::query()->with('category')->whereKey($itemId)->firstOrFail();
            $chain = $item->category !== null ? $this->generateAssetCode->fromCategory($item->category, $asset->id) : $this->emptyChain();
            $data['kode_asset'] = $chain['kode_asset'] ?? $asset->kode_asset;
            $data['asset_group_id'] = $chain['asset_group_id'];
            $data['asset_category_id'] = $chain['asset_category_id'];
            $data['asset_cluster_id'] = $chain['asset_cluster_id'];
            $data['asset_sub_cluster_id'] = $chain['asset_sub_cluster_id'];
        }

        // FR-13.9 — riwayat dicatat sebelum mutasi override agar nilai lama terbaca.
        $this->recordHistory->fromUpdate($asset, $validated, $data['kode_asset'] ?? null, $request->user());

        // Handle Manual Override
        if ($request->has('type_override_reason')) {
            $asset->type_override_reason = $request->input('type_override_reason');
            $asset->asset_type = $request->input('asset_type');
        }

        $asset->update($data);
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Aset berhasil diperbarui.']);

        return redirect()->to($this->safeReturnTo($request) ?? route('assets.index'));
    }

    protected function initialFilterLevel(Request $request): string
    {
        $user = $request->user();
        if ($user !== null && $user->hasAnyRole(['Asset Staff', 'Accounting', 'staff-asset', 'akunting'])) {
            return 'category';
        }

        return 'cluster';
    }

    private function safeReturnTo(Request $request): ?string
    {
        $returnTo = $request->query('return_to');
        if (! is_string($returnTo) || ! str_starts_with($returnTo, '/') || str_starts_with($returnTo, '//') || str_starts_with($returnTo, '/\\')) {
            return null;
        }

        return $returnTo;
    }

    /** @return array{kode_asset: null, asset_group_id: null, asset_category_id: null, asset_cluster_id: null, asset_sub_cluster_id: null} */
    private function emptyChain(): array
    {
        return ['kode_asset' => null, 'asset_group_id' => null, 'asset_category_id' => null, 'asset_cluster_id' => null, 'asset_sub_cluster_id' => null];
    }

    public function destroy(Asset $asset): RedirectResponse
    {
        Gate::authorize('asset.delete');

        $asset->delete();
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Aset berhasil dihapus.']);

        return back(302, [], route('assets.index'));
    }

    public function destroyBulk(Request $request): RedirectResponse
    {
        Gate::authorize('asset.delete');

        $validated = $request->validate(['ids' => ['required', 'array', 'min:1'], 'ids.*' => ['required', 'uuid', Rule::exists('assets', 'id')->where('tenant_id', Tenant::current()?->id)]]);
        $assets = Asset::query()->whereKey($validated['ids'])->get();
        foreach ($assets as $asset) {
            $asset->delete();
        }
        Inertia::flash('toast', ['type' => 'success', 'message' => "{$assets->count()} aset berhasil dihapus."]);

        return back(302, [], route('assets.index'));
    }

    public function upload(UploadAssetMediaRequest $request): JsonResponse
    {
        Gate::authorize('asset.create');

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
        Gate::authorize('asset.create');

        $path = storage_path('app/'.'temp-import-aset-'.uniqid().'.xlsx');
        $action($path);

        return response()->download($path, 'template-import-aset.xlsx')->deleteFileAfterSend(true);
    }

    public function import(ImportAssetsRequest $request, ImportAssetsAction $action): RedirectResponse
    {
        Gate::authorize('asset.create');

        $file = $request->file('file');
        if (! $file instanceof UploadedFile) {
            throw new \RuntimeException('File upload tidak valid.');
        }
        $tempPath = $file->store('assets/imports', ['disk' => 'local']);
        if (! is_string($tempPath)) {
            throw new \RuntimeException('Tidak dapat menyimpan file sementara.');
        }
        $result = $action(Storage::disk('local')->path($tempPath), $request->string('item_id')->toString() !== '' ? Item::find($request->string('item_id')->toString()) : null);
        Storage::disk('local')->delete($tempPath);

        $message = $result['skipped'] > 0 ? "{$result['imported']} aset diimpor, {$result['skipped']} baris dilewati." : "{$result['imported']} aset berhasil diimpor.";
        $details = collect($result['errors'])->take(3)->pluck('message')->implode(' | ');
        Inertia::flash('toast', ['type' => $details === '' && $result['skipped'] === 0 ? 'success' : 'warning', 'message' => $details === '' ? $message : "{$message} {$details}"]);

        // Full per-row detail for the import result panel; capped to keep the
        // session payload sane on huge spreadsheets (toast carries the summary).
        Inertia::flash('import_report', [
            'imported' => $result['imported'],
            'skipped' => $result['skipped'],
            'total_errors' => count($result['errors']),
            'errors' => collect($result['errors'])->take(250)->all(),
        ]);

        return redirect()->route('assets.index');
    }

    /** @return array<int, string> */
    private function labelRelations(): array
    {
        return ['item:id,name,code', 'assetGroup:id,code,name', 'assetCategory:id,code,name', 'assetCluster:id,code,name', 'assetSubCluster:id,code,name'];
    }

    /** @return array<string, mixed> */
    private function formProps(?string $exceptAssetId = null): array
    {
        return [
            'items' => Item::query()->with('category:id,code')->orderBy('name')->get(['id', 'code', 'name', 'category_id'])->map(fn (Item $item): array => ['id' => $item->id, 'code' => $item->code, 'name' => $item->name, 'category_code' => $item->category?->code])->values(),
            'locations' => Location::query()->orderBy('name')->get(['id', 'name']),
            'departments' => Department::query()->orderBy('nama_department')->get(['id_department', 'nama_department']),
            'employees' => Employee::query()->orderBy('nama_employee')->get(['id_employee', 'nama_employee']),
            'nextSequences' => $this->generateAssetCode->nextSequenceMap($exceptAssetId),
        ];
    }
}
