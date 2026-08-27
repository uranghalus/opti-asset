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
        $node = $request->string('node')->trim()->toString();
        $search = $request->string('search')->trim()->toString();
        $status = $request->string('status')->trim()->toString();
        $department = $request->string('department')->trim()->toString();
        $perPage = min((int) $request->integer('per_page', 15), 100);

        $tree = $this->browseTree();

        $level = null;
        $column = null;

        if ($node !== '') {
            if (AssetGroup::whereKey($node)->exists()) {
                $level = 'group';
                $column = 'asset_group_id';
            } elseif (AssetCategory::whereKey($node)->exists()) {
                $level = 'category';
                $column = 'asset_category_id';
            } elseif (AssetCluster::whereKey($node)->exists()) {
                $level = 'cluster';
                $column = 'asset_cluster_id';
            } elseif (AssetSubCluster::whereKey($node)->exists()) {
                $level = 'sub_cluster';
                $column = 'asset_sub_cluster_id';
            }
        }

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
            ->when($column !== null, fn ($query) => $query->where($column, $node))
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

        $breadcrumb = $node !== '' ? $this->findBreadcrumb($tree, $node) : [];

        return Inertia::render('assets/Browse', [
            'tree' => $tree,
            'assets' => $assets,
            'selectedNode' => $node !== '' ? $node : null,
            'selectedLevel' => $level,
            'breadcrumb' => $breadcrumb,
            'filters' => [
                'search' => $search,
                'status' => $status,
                'department' => $department,
            ],
            'departments' => Department::query()->orderBy('nama_department')->get(['id_department', 'nama_department']),
        ]);
    }

    /**
     * Build the classification tree (Group → Category → Cluster → Sub-cluster)
     * with a rolled-up asset count per node. Each asset is counted exactly
     * once, at the deepest classification level it occupies.
     *
     * @return array<int, array<string, mixed>>
     */
    private function browseTree(): array
    {
        $deep = Asset::query()
            ->whereNotNull('asset_group_id')
            ->selectRaw(
                "CASE
                    WHEN asset_sub_cluster_id IS NOT NULL THEN 'sub_cluster'
                    WHEN asset_cluster_id IS NOT NULL THEN 'cluster'
                    WHEN asset_category_id IS NOT NULL THEN 'category'
                    ELSE 'group'
                END as node_level,
                CASE
                    WHEN asset_sub_cluster_id IS NOT NULL THEN asset_sub_cluster_id
                    WHEN asset_cluster_id IS NOT NULL THEN asset_cluster_id
                    WHEN asset_category_id IS NOT NULL THEN asset_category_id
                    ELSE asset_group_id
                END as node_id,
                count(*) as total",
            )
            ->groupByRaw('node_level, node_id')
            ->get();

        $deepCounts = ['group' => [], 'category' => [], 'cluster' => [], 'sub_cluster' => []];

        foreach ($deep as $row) {
            $deepCounts[$row->node_level][$row->node_id] = (int) $row->total;
        }

        $direct = fn (string $level, ?string $id): int => $id === null ? 0 : ($deepCounts[$level][$id] ?? 0);

        $groups = AssetGroup::query()
            ->withCount('categories')
            ->with([
                'categories' => fn ($query) => $query
                    ->withCount('clusters')
                    ->orderBy('sort_order')
                    ->orderBy('code')
                    ->with([
                        'clusters' => fn ($query) => $query
                            ->withCount('subClusters')
                            ->orderBy('sort_order')
                            ->orderBy('code')
                            ->with([
                                'subClusters' => fn ($query) => $query
                                    ->orderBy('sort_order')
                                    ->orderBy('code'),
                            ]),
                    ]),
            ])
            ->orderBy('sort_order')
            ->orderBy('code')
            ->get();

        $mapCluster = function (AssetCluster $cluster) use (&$direct): array {
            $subChildren = $cluster->subClusters
                ->map(function (AssetSubCluster $sub) use (&$direct): array {
                    return [
                        'id' => $sub->id,
                        'code' => $sub->code,
                        'name' => $sub->name,
                        'description' => $sub->description,
                        'child_count' => 0,
                        'asset_count' => $direct('sub_cluster', $sub->id),
                        'children' => [],
                    ];
                })
                ->all();

            $subTotal = array_sum(array_column($subChildren, 'asset_count'));

            return [
                'id' => $cluster->id,
                'code' => $cluster->code,
                'name' => $cluster->name,
                'description' => $cluster->description,
                'child_count' => $cluster->sub_clusters_count,
                'asset_count' => $direct('cluster', $cluster->id) + $subTotal,
                'children' => $subChildren,
            ];
        };

        $mapCategory = function (AssetCategory $category) use (&$direct, &$mapCluster): array {
            $clusterChildren = $category->clusters->map($mapCluster)->all();
            $clusterTotal = array_sum(array_column($clusterChildren, 'asset_count'));

            return [
                'id' => $category->id,
                'code' => $category->code,
                'name' => $category->name,
                'description' => $category->description,
                'child_count' => $category->clusters_count,
                'asset_count' => $direct('category', $category->id) + $clusterTotal,
                'children' => $clusterChildren,
            ];
        };

        return $groups
            ->map(function (AssetGroup $group) use (&$direct, &$mapCategory): array {
                $categoryChildren = $group->categories->map($mapCategory)->all();
                $categoryTotal = array_sum(array_column($categoryChildren, 'asset_count'));

                return [
                    'id' => $group->id,
                    'code' => $group->code,
                    'name' => $group->name,
                    'description' => $group->description,
                    'child_count' => $group->categories_count,
                    'asset_count' => $direct('group', $group->id) + $categoryTotal,
                    'children' => $categoryChildren,
                ];
            })
            ->values()
            ->all();
    }

    /**
     * @param  array<int, array<string, mixed>>  $nodes
     * @return array<int, array{id: string, name: string, level: string}>
     */
    private function findBreadcrumb(array $nodes, string $target): array
    {
        $levels = ['group', 'category', 'cluster', 'sub-cluster'];

        $walk = function (array $list, int $depth) use (&$walk, $target, $levels): ?array {
            foreach ($list as $node) {
                if ($node['id'] === $target) {
                    return [['id' => $node['id'], 'name' => $node['name'], 'level' => $levels[$depth]]];
                }

                if (! empty($node['children'])) {
                    $sub = $walk($node['children'], $depth + 1);

                    if ($sub !== null) {
                        return array_merge(
                            [['id' => $node['id'], 'name' => $node['name'], 'level' => $levels[$depth]]],
                            $sub,
                        );
                    }
                }
            }

            return null;
        };

        return $walk($nodes, 0) ?? [];
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
