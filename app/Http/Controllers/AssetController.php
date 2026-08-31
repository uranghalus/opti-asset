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
use Illuminate\Validation\Rule;
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
            'categories' => AssetCategory::query()->orderBy('sort_order')->get(['id', 'code', 'name', 'asset_group_id']),
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

    public function browse(Request $request): Response
    {
        $level = $request->string('level')->trim()->toString();
        $nodeId = $request->string('node')->trim()->toString();

        $allowedLevels = ['group', 'category', 'cluster', 'sub-cluster'];
        $validLevel = in_array($level, $allowedLevels, true);

        $search = $request->string('search')->trim()->toString();
        $status = $request->string('status')->trim()->toString();
        $department = $request->string('department')->trim()->toString();

        $tree = $this->buildBrowseTree();

        $selected = null;
        $breadcrumb = [];
        $assets = null;

        if ($validLevel && $nodeId !== '') {
            $field = match ($level) {
                'group' => 'asset_group_id',
                'category' => 'asset_category_id',
                'cluster' => 'asset_cluster_id',
                'sub-cluster' => 'asset_sub_cluster_id',
            };

            $perPage = min((int) $request->integer('per_page', 15), 100);

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
                ->where($field, $nodeId)
                ->when($search !== '', fn ($query) => $query->where(fn ($query) => $query
                    ->where('kode_asset', 'like', "%{$search}%")
                    ->orWhere('serial_number', 'like', "%{$search}%")
                    ->orWhere('brand', 'like', "%{$search}%")
                    ->orWhere('model', 'like', "%{$search}%")))
                ->when($status !== '', fn ($query) => $query->where('status', $status))
                ->when($department !== '', fn ($query) => $query->where('department_id', $department))
                ->orderBy('created_at', 'desc')
                ->paginate($perPage)
                ->withQueryString();

            $selected = ['level' => $level, 'id' => $nodeId];
            $breadcrumb = $this->buildBreadcrumb($level, $nodeId);
        }

        return Inertia::render('assets/Browse', [
            'tree' => $tree,
            'selected' => $selected,
            'breadcrumb' => $breadcrumb,
            'assets' => $assets,
            'groups' => AssetGroup::query()->orderBy('sort_order')->get(['id', 'code', 'name']),
            'categories' => AssetCategory::query()->get(['id', 'code', 'name', 'asset_group_id']),
            'departments' => Department::query()->orderBy('nama_department')->get(['id_department', 'nama_department']),
            'filters' => [
                'search' => $search,
                'status' => $status,
                'department' => $department,
            ],
        ]);
    }

    /**
     * Build the classification tree (Group → Category → Cluster → Sub-cluster)
     * with a rolled-up asset count per node. Each asset is counted exactly
     * once, at the deepest classification level it occupies. Each node embeds
     * its `level` for type-safe frontend consumption.
     *
     * @return array<int, array{
     *     id: string, code: string|null, name: string, description: string|null,
     *     child_count: int, asset_count: int, level: string, children: array<int, mixed>
     * }>
     */
    private function buildBrowseTree(): array
    {
        return AssetGroup::query()
            ->withCount('assets')
            ->with([
                'categories' => fn ($query) => $query
                    ->withCount('assets')
                    ->orderBy('sort_order')
                    ->orderBy('code')
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
                    ]),
            ])
            ->orderBy('sort_order')
            ->orderBy('code')
            ->get()
            ->map(fn (AssetGroup $group) => $this->serializeBrowseGroup($group))
            ->values()
            ->all();
    }

    /**
     * @param  AssetGroup  $group
     * @return array{
     *     id: string, code: string|null, name: string, description: string|null,
     *     child_count: int, asset_count: int, level: string, children: array<int, mixed>
     * }
     */
    private function serializeBrowseGroup($group): array
    {
        return [
            'id' => $group->id,
            'code' => $group->code,
            'name' => $group->name,
            'description' => $group->description,
            'child_count' => $group->categories_count,
            'asset_count' => $group->assets_count,
            'level' => 'group',
            'children' => $group->categories->map(
                fn (AssetCategory $category) => $this->serializeBrowseCategory($category),
            )->all(),
        ];
    }

    /**
     * @param  AssetCategory  $category
     * @return array{
     *     id: string, code: string|null, name: string, description: string|null,
     *     child_count: int, asset_count: int, level: string, children: array<int, mixed>
     * }
     */
    private function serializeBrowseCategory($category): array
    {
        return [
            'id' => $category->id,
            'code' => $category->code,
            'name' => $category->name,
            'description' => $category->description,
            'child_count' => $category->clusters_count,
            'asset_count' => $category->assets_count,
            'level' => 'category',
            'children' => $category->clusters->map(
                fn (AssetCluster $cluster) => $this->serializeBrowseCluster($cluster),
            )->all(),
        ];
    }

    /**
     * @param  AssetCluster  $cluster
     * @return array{
     *     id: string, code: string|null, name: string, description: string|null,
     *     child_count: int, asset_count: int, level: string, children: array<int, mixed>
     * }
     */
    private function serializeBrowseCluster($cluster): array
    {
        return [
            'id' => $cluster->id,
            'code' => $cluster->code,
            'name' => $cluster->name,
            'description' => $cluster->description,
            'child_count' => $cluster->subClusters_count,
            'asset_count' => $cluster->assets_count,
            'level' => 'cluster',
            'children' => $cluster->subClusters->map(
                fn (AssetSubCluster $subCluster) => $this->serializeBrowseSubCluster($subCluster),
            )->all(),
        ];
    }

    /**
     * @param  AssetSubCluster  $subCluster
     * @return array{
     *     id: string, code: string|null, name: string, description: string|null,
     *     notes: string|null, child_count: int, asset_count: int, level: string, children: array<int, mixed>
     * }
     */
    private function serializeBrowseSubCluster($subCluster): array
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

    /**
     * Build breadcrumb crumbs for the given level + node by walking
     * from the selected node up to its root ancestor via DB lookups.
     *
     * @return array<int, array{id: string, level: string, code: string|null, name: string}>
     */
    private function buildBreadcrumb(string $level, string $nodeId): array
    {
        $levelModels = [
            'group' => AssetGroup::class,
            'category' => AssetCategory::class,
            'cluster' => AssetCluster::class,
            'sub-cluster' => AssetSubCluster::class,
        ];

        $parentFields = [
            'category' => 'asset_group_id',
            'cluster' => 'asset_category_id',
            'sub-cluster' => 'asset_cluster_id',
        ];

        $parentLevels = [
            'category' => 'group',
            'cluster' => 'category',
            'sub-cluster' => 'cluster',
        ];

        $crumbs = [];
        $currentLevel = $level;
        $currentId = $nodeId;

        // Build path from leaf to root
        while ($currentLevel !== null) {
            $model = $levelModels[$currentLevel];
            $node = $model::where('id', $currentId)->first();

            if ($node === null) {
                break;
            }

            $crumbs[] = [
                'id' => $node->id,
                'level' => $currentLevel,
                'code' => $node->code,
                'name' => $node->name,
            ];

            $parentField = $parentFields[$currentLevel] ?? null;
            $nextLevel = $parentLevels[$currentLevel] ?? null;

            if ($parentField === null || $nextLevel === null) {
                break;
            }

            $parentId = $node->{$parentField};
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

        $item = Item::query()->with('category')->whereKey($validated['item_id'])->firstOrFail();

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

        return redirect()->to($this->safeReturnTo($request) ?? route('assets.index'));
    }

    public function update(UpdateAssetRequest $request, Asset $asset): RedirectResponse
    {
        $validated = $request->validated();

        $itemId = $validated['item_id'] ?? $asset->item_id;
        $itemChanged = $itemId !== $asset->item_id;

        $data = $validated;

        if ($itemChanged) {
            $item = Item::query()->with('category')->whereKey($itemId)->firstOrFail();

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

        return redirect()->to($this->safeReturnTo($request) ?? route('assets.index'));
    }

    /**
     * Local-path redirect target from ?return_to=..., or null when absent
     * or unsafe (external / protocol-relative URLs are rejected).
     */
    private function safeReturnTo(Request $request): ?string
    {
        $returnTo = $request->query('return_to');

        if (
            ! is_string($returnTo) ||
            ! str_starts_with($returnTo, '/') ||
            str_starts_with($returnTo, '//') ||
            str_starts_with($returnTo, '/\\')
        ) {
            return null;
        }

        return $returnTo;
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

        return back(302, [], route('assets.index'));
    }

    public function destroyBulk(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => [
                'required',
                'uuid',
                Rule::exists('assets', 'id')->where(
                    'tenant_id',
                    Tenant::current()?->id,
                ),
            ],
        ]);

        $assets = Asset::query()->whereKey($validated['ids'])->get();

        foreach ($assets as $asset) {
            $asset->delete();
        }

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => "{$assets->count()} aset berhasil dihapus.",
        ]);

        return back(302, [], route('assets.index'));
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

        $message = $result['skipped'] > 0
            ? "{$result['imported']} aset diimpor, {$result['skipped']} baris dilewati."
            : "{$result['imported']} aset berhasil diimpor.";

        $details = collect($result['errors'])
            ->take(3)
            ->pluck('message')
            ->implode(' | ');

        Inertia::flash('toast', [
            'type' => $details === '' && $result['skipped'] === 0 ? 'success' : 'warning',
            'message' => $details === '' ? $message : "{$message} {$details}",
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
