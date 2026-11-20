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
use App\Services\EmployeeSessionResolver;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Filesystem\FilesystemAdapter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use LogicException;
use Spatie\SimpleExcel\SimpleExcelWriter;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;

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

    /**
     * Roles yang boleh melewati filter department (bypass).
     * Sesuai ketentuan hanya staff asset, super-admin, dan admin-ho
     * (`administrator` adalah padanan admin-ho di database).
     *
     * @var array<int, string>
     */
    private const DEPT_BYPASS_ROLES = [
        'super-admin',
        'super_admin',
        'staff-asset',
        'staff_asset',
        'Asset Staff',
        'administrator',
    ];

    /**
     * Ambil department_id karyawan dari session 'employee'.
     * Jika session kosong/null, user tidak boleh melihat aset apa pun.
     */
    private function getEmployeeDepartmentId(): ?string
    {
        $employee = session(EmployeeSessionResolver::SESSION_KEY);

        if (! is_array($employee) || ! isset($employee['department_id'])) {
            return null;
        }

        return (string) $employee['department_id'];
    }

    /**
     * Cek apakah user login memiliki role yang boleh melewati filter department.
     */
    private function hasDepartmentBypass(): bool
    {
        $user = Auth::user();

        if (! $user) {
            return false;
        }

        return $user->hasAnyRole(self::DEPT_BYPASS_ROLES);
    }

    /**
     * Terapkan filter department_id pada query Asset kecuali role bypass.
     * Data aset tidak boleh bocor antar department (kecuali role pengecualian).
     *
     * @param  Builder<Asset>  $query
     */
    private function applyDepartmentFilter(Builder $query): void
    {
        if ($this->hasDepartmentBypass()) {
            return;
        }

        $deptId = $this->getEmployeeDepartmentId();

        if ($deptId === null) {
            // Tanpa employee session ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ tidak ada aset yang terlihat (fail-closed).
            $query->whereRaw('1 = 0');

            return;
        }

        $query->where('department_id', $deptId);
    }

    /**
     * Pastikan aset milik department yang sama dengan employee login.
     * Abort 403 jika aset berada di department lain.
     */
    private function enforceDepartmentOwnership(Asset $asset): void
    {
        if ($this->hasDepartmentBypass()) {
            return;
        }

        $deptId = $this->getEmployeeDepartmentId();

        if ($deptId === null || $asset->department_id !== $deptId) {
            abort(SymfonyResponse::HTTP_FORBIDDEN, 'Aset tidak ada di department Anda.');
        }
    }

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
        $allowedLevels = $this->allowedBrowseLevels();
        $validLevel = $level !== '' && in_array($level, $allowedLevels, true) && $nodeId !== '';
        $unclassified = $validLevel && $nodeId === self::UNCLASSIFIED_NODE;

        $search = $request->string('search')->trim()->toString();
        $status = $request->string('status')->trim()->toString();
        $assetType = $request->string('asset_type')->trim()->toString();
        // 'all' dikirim oleh kontrol filter lama ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â treat sebagai tanpa filter,
        // bukan nilai kolom (pernah menolkan seluruh hasil).
        $assetType = in_array($assetType, ['fixed_asset', 'equipment'], true) ? $assetType : '';
        $department = $request->string('department')->trim()->toString();
        $condition = $request->string('condition')->trim()->toString();
        $location = $request->string('location')->trim()->toString();
        $itemId = $request->string('item_id')->trim()->toString();
        $brand = $request->string('brand')->trim()->toString();
        $model = $request->string('model')->trim()->toString();
        $serialNumber = $request->string('serial_number')->trim()->toString();
        $partNumber = $request->string('part_number')->trim()->toString();
        $vendorName = $request->string('vendor_name')->trim()->toString();

        $tree = $this->buildBrowseTree();
        $breadcrumb = [];
        $selected = null;
        $descendantFallback = false;

        // Pencarian & filter bekerja juga tanpa memilih node (FR-04.1):
        // daftar tidak lagi null di root, hanya kandidat query yang beda.
        $assetsQuery = Asset::query()
            ->with([
                'item:id,name,code',
                'location:id,name',
                'department:id_department,nama_department',
                'assetGroup:id,code,name',
                'assetCategory:id,code,name',
                'assetCluster:id,code,name',
                'assetSubCluster:id,code,name',
            ]);

        // R6 / A5 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â enforcÃƒÂÃ‚Âµ department: aset diluar department login disembunyikan.
        // Role pengecualian (staff-asset, super-admin, administrator/admin-ho) lihat semua.
        $this->applyDepartmentFilter($assetsQuery);

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
                default => throw new LogicException("Unsupported browse level: {$level}"),
            };

            if ($unclassified) {
                $assetsQuery->whereNull($field);
            } else {
                $directCount = Asset::query()
                    ->where($field, $nodeId)
                    ->tap(fn (Builder $query) => $this->applyDepartmentFilter($query))
                    ->count();

                if ($directCount === 0) {
                    // Fallback turunan: node tanpa aset langsung tidak boleh
                    // menjadi dead-end ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â tampilkan semua aset di bawahnya.
                    $descendantIds = $this->descendantScopeIds($level, $nodeId);
                    $assetsQuery->where(function ($query) use ($field, $nodeId, $descendantIds): void {
                        $query->where($field, $nodeId);

                        foreach ($descendantIds as $descendantField => $ids) {
                            $query->orWhereIn($descendantField, $ids);
                        }
                    });
                    $descendantFallback = true;
                } else {
                    $assetsQuery->where($field, $nodeId);
                }
            }
        }

        $assets = $assetsQuery
            ->when($search !== '', fn ($query) => $query->where(fn ($query) => $query
                ->where('kode_asset', 'like', "%{$search}%")
                ->orWhere('serial_number', 'like', "%{$search}%")
                ->orWhere('brand', 'like', "%{$search}%")
                ->orWhere('model', 'like', "%{$search}%")
                // FR-04.1 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â pencarian juga mencocokkan nama item.
                ->orWhereHas('item', fn ($item) => $item->where('name', 'like', "%{$search}%"))))
            ->when($status !== '', fn ($query) => $query->where('status', $status))
            ->when($assetType !== '', fn ($query) => $query->where('asset_type', $assetType))
            ->when($department !== '', fn ($query) => $query->where('department_id', $department))
            ->when($condition !== '', fn ($query) => $query->where('condition', $condition))
            // FR-04.2 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â filter lokasi pada halaman daftar aset.
            ->when($location !== '', fn ($query) => $query->where('location_id', $location))
            ->when($itemId !== '', fn ($query) => $query->where('item_id', $itemId))
            ->when($brand !== '', fn ($query) => $query->where('brand', 'like', "%{$brand}%"))
            ->when($model !== '', fn ($query) => $query->where('model', 'like', "%{$model}%"))
            ->when($serialNumber !== '', fn ($query) => $query->where('serial_number', 'like', "%{$serialNumber}%"))
            ->when($partNumber !== '', fn ($query) => $query->where('part_number', 'like', "%{$partNumber}%"))
            ->when($vendorName !== '', fn ($query) => $query->where('vendor_name', 'like', "%{$vendorName}%"))
            ->orderBy('created_at', 'desc')
            ->paginate($perPage)
            ->withQueryString();

        return [
            'tree' => $tree,
            'selected' => $selected,
            'breadcrumb' => $breadcrumb,
            'assets' => $assets,
            'descendantFallback' => $descendantFallback,
            'unclassifiedCount' => Asset::query()
                ->whereNull($this->unclassifiedColumnForRoot($initialLevel))
                ->tap(fn (Builder $query) => $this->applyDepartmentFilter($query))
                ->count(),
            'groups' => AssetGroup::query()->orderBy('sort_order')->get(['id', 'code', 'name']),
            'categories' => AssetCategory::query()->orderBy('sort_order')->get(['id', 'code', 'name', 'asset_group_id']),
            // Daftar item hanya dibutuhkan dialog impor ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â partial reload
            // tidak memintanya, jadi muat optional untuk memangkas payload browse.
            'items' => Inertia::optional(fn () => Item::query()->with('category:id,code')->orderBy('name')->get(['id', 'code', 'name', 'category_id'])),
            'locations' => Location::query()->orderBy('name')->get(['id', 'name']),
            'departments' => Department::query()->orderBy('nama_department')->get(['id_department', 'nama_department']),
            'filters' => [
                'search' => $search,
                'status' => $status,
                'asset_type' => $assetType,
                'department' => $department,
                'condition' => $condition,
                'location' => $location,
                'item_id' => $itemId,
                'brand' => $brand,
                'model' => $model,
                'serial_number' => $serialNumber,
                'part_number' => $partNumber,
                'vendor_name' => $vendorName,
                'level' => $validLevel ? $level : '',
                'node' => $validLevel ? $nodeId : '',
                'initialLevel' => $initialLevel,
                'descendantFallback' => $descendantFallback,
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
                'descendantFallback' => $payload['descendantFallback'],
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
                ->withCount(['assets' => fn (Builder $query) => $this->applyDepartmentFilter($query)])
                ->with([
                    'clusters' => fn ($query) => $query
                        ->withCount(['assets' => fn (Builder $query) => $this->applyDepartmentFilter($query)])
                        ->orderBy('sort_order')
                        ->orderBy('code')
                        ->with([
                            'subClusters' => fn ($query) => $query
                                ->withCount(['assets' => fn (Builder $query) => $this->applyDepartmentFilter($query)])
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
            ->withCount(['assets' => fn (Builder $query) => $this->applyDepartmentFilter($query)])
            ->with([
                'subClusters' => fn ($query) => $query
                    ->withCount(['assets' => fn (Builder $query) => $this->applyDepartmentFilter($query)])
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

    /**
     * Browse levels permitted for the current user: staff see the deeper
     * category root; other roles start at cluster. Mirrors the tree root.
     *
     * @return array<int, string>
     */
    private function allowedBrowseLevels(): array
    {
        $user = request()->user();
        $isStaff = $user !== null && $user->hasAnyRole(['Asset Staff', 'Accounting', 'staff-asset', 'akunting']);

        return $isStaff
            ? ['category', 'cluster', 'sub-cluster']
            : ['cluster', 'sub-cluster'];
    }

    /**
     * Kolom "Tanpa Klasifikasi" mengikuti akar pohon peran: staf melihat
     * pohon kategori, role lain pohon cluster ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â hitungan orphan harus
     * cocok dengan simpul yang benar-benar dirender.
     */
    private function unclassifiedColumnForRoot(string $initialLevel): string
    {
        return $initialLevel === 'category' ? 'asset_category_id' : 'asset_cluster_id';
    }

    /**
     * Descendant classification ids per asset column, used by the
     * no-dead-end fallback: a scope with zero direct assets lists every
     * asset below it instead of an empty page.
     *
     * @return array<string, array<int, string>>
     */
    private function descendantScopeIds(string $level, string $nodeId): array
    {
        if ($level === 'sub-cluster') {
            return [];
        }

        if ($level === 'cluster') {
            return [
                'asset_sub_cluster_id' => AssetSubCluster::query()
                    ->where('asset_cluster_id', $nodeId)
                    ->pluck('id')
                    ->all(),
            ];
        }

        // category level: ids of descendant clusters and sub-clusters.
        $clusterIds = AssetCluster::query()
            ->where('asset_category_id', $nodeId)
            ->pluck('id')
            ->all();

        return [
            'asset_cluster_id' => $clusterIds,
            'asset_sub_cluster_id' => AssetSubCluster::query()
                ->whereIn('asset_cluster_id', $clusterIds)
                ->pluck('id')
                ->all(),
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

        // R4 / A5 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â cek ownership department: hanya aset di department login
        // yang boleh dicetak label (kecuali role bypass).
        $query = Asset::query()->whereKey($validated['ids']);
        $this->applyDepartmentFilter($query);

        $assets = $query->with($this->labelRelations())->orderBy('kode_asset')->get();

        // Jika user tanpa bypass dan none of requested ids visible ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ 403.
        if (! $this->hasDepartmentBypass() && $assets->isEmpty()) {
            abort(SymfonyResponse::HTTP_FORBIDDEN, 'Aset yang diminta tidak ada di department Anda.');
        }

        return Inertia::render('assets/Labels', ['assets' => $assets]);
    }

    public function labelsBatch(Request $request): Response
    {
        Gate::authorize('asset.view');

        // R1 / A6 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â batch print hanya untuk role asset-staff.
        // Non-asset-staff: 403 (tombol disembunyikan di UI, URL langsung juga 403).
        if (! Auth::user()?->hasAnyRole(self::DEPT_BYPASS_ROLES)) {
            abort(SymfonyResponse::HTTP_FORBIDDEN, 'Hanya asset-staff yang boleh mencetak batch barcode.');
        }

        $query = Asset::query()->with($this->labelRelations())->orderBy('kode_asset');

        // R1 / A2 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â filter department + tenant (tenant via global scope BelongsToTenant).
        // Role bypass (staff-asset, super-admin, administrator/admin-ho) lihat semua department.
        $this->applyDepartmentFilter($query);

        $assets = $query->get();

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
        $query = Asset::query()->where('kode_asset', $validated['code'])->with(['item:id,name,code', 'location:id,name', 'department:id_department,nama_department', 'assetGroup:id,code,name', 'assetCategory:id,code,name', 'assetCluster:id,code,name', 'assetSubCluster:id,code,name']);

        // R5 / A5 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â scan lookup cek department: aset di luar department login tidak ditemukan.
        $this->applyDepartmentFilter($query);

        $asset = $query->first();
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

    public function show(string $tenant, string $asset): Response
    {
        Gate::authorize('asset.view');

        $asset = Asset::find($asset);
        if (! $asset) {
            abort(404);
        }

        // R4 / A5 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â cek ownership department untuk tampilan detail aset.
        $this->enforceDepartmentOwnership($asset);

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

    public function edit(string $tenant, string $asset): Response
    {
        Gate::authorize('asset.edit');

        $asset = Asset::find($asset);
        if (! $asset) {
            abort(404);
        }
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

        return redirect()->to($this->safeReturnTo($request) ?? route('tenant.assets.index', [
            'tenant' => Tenant::current()?->code,
        ]));
    }

    public function update(string $tenant, UpdateAssetRequest $request, string $asset): RedirectResponse
    {
        Gate::authorize('asset.edit');

        $asset = Asset::find($asset);
        if (! $asset) {
            abort(404);
        }

        // R7 / A5 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â cek department ownership sebelum memperbarui aset.
        $this->enforceDepartmentOwnership($asset);

        // FR-07.6 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â aset terhapus tidak boleh diubah (kecuali statusnya sendiri).
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

        // FR-13.9 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â riwayat dicatat sebelum mutasi override agar nilai lama terbaca.
        $this->recordHistory->fromUpdate($asset, $validated, $data['kode_asset'] ?? null, $request->user());

        // Handle Manual Override
        if ($request->has('type_override_reason')) {
            $asset->type_override_reason = $request->input('type_override_reason');
            $asset->asset_type = $request->input('asset_type');
        }

        $asset->update($data);
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Aset berhasil diperbarui.']);

        return redirect()->to($this->safeReturnTo($request) ?? route('tenant.assets.index', [
            'tenant' => Tenant::current()?->code,
        ]));
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

    public function destroy(string $tenant, string $asset): RedirectResponse
    {
        Gate::authorize('asset.delete');

        $asset = Asset::find($asset);
        if (! $asset) {
            abort(404);
        }

        // R3 / A5 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â cek department ownership sebelum menghapus aset.
        $this->enforceDepartmentOwnership($asset);

        // FR-07.6 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â aset yang telah dihapus tidak boleh dihapus dari sistem;
        // catatan pertahankan untuk keperluan audit.
        if ($asset->status === AssetStatus::DISPOSED) {
            Inertia::flash('toast', [
                'type' => 'error',
                'message' => 'Aset yang telah dihapus tidak dapat dihapus.',
            ]);

            return back();
        }

        $asset->delete();
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Aset berhasil dihapus.']);

        return back(302, [], route('tenant.assets.index', [
            'tenant' => Tenant::current()?->code,
        ]));
    }

    public function destroyBulk(Request $request): RedirectResponse
    {
        Gate::authorize('asset.delete');

        // R2 / A5 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â validasi department_id: hanya aset di department login
        // yang boleh dihapus bulk (kecuali role bypass).
        $query = Asset::query()->whereKey($request->input('ids', []));
        $this->applyDepartmentFilter($query);

        $validated = $request->validate(['ids' => ['required', 'array', 'min:1'], 'ids.*' => ['required', 'uuid', Rule::exists('assets', 'id')->where('tenant_id', Tenant::current()?->id)]]);

        $assets = $query->get();
        foreach ($assets as $asset) {
            $asset->delete();
        }
        Inertia::flash('toast', ['type' => 'success', 'message' => "{$assets->count()} aset berhasil dihapus."]);

        return back(302, [], route('tenant.assets.index', [
            'tenant' => Tenant::current()?->code,
        ]));
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

        return redirect()->route('tenant.assets.index', [
            'tenant' => Tenant::current()?->code,
        ]);
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

    public function report(Request $request): Response
    {
        Gate::authorize('asset.view');

        $validated = $request->validate([
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:100'],
            'item_id' => ['sometimes', 'string', 'max:36', 'nullable'],
            'brand' => ['sometimes', 'string', 'max:100', 'nullable'],
            'model' => ['sometimes', 'string', 'max:100', 'nullable'],
            'serial_number' => ['sometimes', 'string', 'max:100', 'nullable'],
            'part_number' => ['sometimes', 'string', 'max:100', 'nullable'],
            'has_photo' => ['sometimes', 'boolean'],
            'has_document' => ['sometimes', 'boolean'],
            'location_id' => ['sometimes', 'string', 'max:36', 'nullable'],
            'department_id' => ['sometimes', 'string', 'max:36', 'nullable'],
            'purchase_date_from' => ['sometimes', 'date', 'nullable'],
            'purchase_date_to' => ['sometimes', 'date', 'nullable'],
            'purchase_price_min' => ['sometimes', 'numeric', 'nullable'],
            'purchase_price_max' => ['sometimes', 'numeric', 'nullable'],
            'vendor_name' => ['sometimes', 'string', 'max:100', 'nullable'],
            'asset_type' => ['sometimes', 'string', 'in:fixed_asset,equipment', 'nullable'],
            'depreciation_method' => ['sometimes', 'string', 'in:straight_line,declining_balance,none', 'nullable'],
            'acquisition_cost_min' => ['sometimes', 'numeric', 'nullable'],
            'acquisition_cost_max' => ['sometimes', 'numeric', 'nullable'],
            'useful_life_years' => ['sometimes', 'integer', 'nullable'],
            'has_type_override' => ['sometimes', 'boolean'],
            'status' => ['sometimes', 'string', 'in:ACT,LOAN,RPR,MUT,DSP', 'nullable'],
            'condition' => ['sometimes', 'string', 'in:Baik,Rusak Ringan,Rusak Berat', 'nullable'],
            'no_spb' => ['sometimes', 'string', 'max:100', 'nullable'],
            'document_number' => ['sometimes', 'string', 'max:100', 'nullable'],
            'pic' => ['sometimes', 'string', 'max:100', 'nullable'],
            'notes' => ['sometimes', 'string', 'nullable'],
            'warranty_expire_from' => ['sometimes', 'date', 'nullable'],
            'warranty_expire_to' => ['sometimes', 'date', 'nullable'],
            'garansi_exp_from' => ['sometimes', 'date', 'nullable'],
            'garansi_exp_to' => ['sometimes', 'date', 'nullable'],
            'in_come_date_from' => ['sometimes', 'date', 'nullable'],
            'in_come_date_to' => ['sometimes', 'date', 'nullable'],
            'broken_date_from' => ['sometimes', 'date', 'nullable'],
            'broken_date_to' => ['sometimes', 'date', 'nullable'],
        ]);

        $perPage = $validated['per_page'] ?? 15;

        $assets = Asset::query()
            ->with([
                'item:id,code,name',
                'location:id,name',
                'department:id_department,nama_department',
                'assetGroup:id,code,name',
                'assetCategory:id,code,name',
                'assetCluster:id,code,name',
                'assetSubCluster:id,code,name',
            ])
            ->when(! $request->user()->hasAnyRole(['Asset Staff', 'Accounting', 'staff-asset', 'akunting', 'super-admin']), function ($q) use ($request) {
                $deptId = $request->user()?->department ?? null;
                if ($deptId) {
                    $q->where('department_id', $deptId);
                } else {
                    $q->whereRaw('1 = 0');
                }
            })
            ->when($validated['item_id'] ?? null, fn ($q, $item_id) => $q->where('item_id', $item_id))
            ->when($validated['brand'] ?? null, fn ($q, $brand) => $q->where('brand', 'like', "%{$brand}%"))
            ->when($validated['model'] ?? null, fn ($q, $model) => $q->where('model', 'like', "%{$model}%"))
            ->when($validated['serial_number'] ?? null, fn ($q, $serial) => $q->where('serial_number', 'like', "%{$serial}%"))
            ->when($validated['part_number'] ?? null, fn ($q, $part) => $q->where('part_number', 'like', "%{$part}%"))
            ->when($validated['purchase_date_from'] ?? null, fn ($q, $date) => $q->whereDate('purchase_date', '>=', $date))
            ->when($validated['purchase_date_to'] ?? null, fn ($q, $date) => $q->whereDate('purchase_date', '<=', $date))
            ->when($validated['purchase_price_min'] ?? null, fn ($q, $price) => $q->where('purchase_price', '>=', $price))
            ->when($validated['purchase_price_max'] ?? null, fn ($q, $price) => $q->where('purchase_price', '<=', $price))
            ->when($validated['vendor_name'] ?? null, fn ($q, $vendor) => $q->where('vendor_name', 'like', "%{$vendor}%"))
            ->when($validated['asset_type'] ?? null, fn ($q, $type) => $q->where('asset_type', $type))
            ->when($validated['depreciation_method'] ?? null, fn ($q, $method) => $q->where('depreciation_method', $method))
            ->when($validated['acquisition_cost_min'] ?? null, fn ($q, $cost) => $q->where('acquisition_cost', '>=', $cost))
            ->when($validated['acquisition_cost_max'] ?? null, fn ($q, $cost) => $q->where('acquisition_cost', '<=', $cost))
            ->when($validated['useful_life_years'] ?? null, fn ($q, $years) => $q->where('useful_life_years', $years))
            ->when(! empty($validated['has_type_override']), fn ($q) => $q->whereNotNull('type_override_reason'))
            ->when($validated['status'] ?? null, fn ($q, $status) => $q->where('status', $status))
            ->when($validated['condition'] ?? null, fn ($q, $condition) => $q->where('condition', $condition))
            ->when($validated['no_spb'] ?? null, fn ($q, $no_spb) => $q->where('no_spb', 'like', "%{$no_spb}%"))
            ->when($validated['document_number'] ?? null, fn ($q, $doc) => $q->where('document_number', 'like', "%{$doc}%"))
            ->when($validated['pic'] ?? null, fn ($q, $pic) => $q->where('pic', 'like', "%{$pic}%"))
            ->when($validated['notes'] ?? null, fn ($q, $notes) => $q->where('notes', 'like', "%{$notes}%"))
            ->when($validated['location_id'] ?? null, fn ($q, $loc) => $q->where('location_id', $loc))
            ->when($validated['department_id'] ?? null, fn ($q, $dept) => $q->where('department_id', $dept))
            ->when($validated['warranty_expire_from'] ?? null, fn ($q, $date) => $q->whereDate('warranty_expire', '>=', $date))
            ->when($validated['warranty_expire_to'] ?? null, fn ($q, $date) => $q->whereDate('warranty_expire', '<=', $date))
            ->when($validated['garansi_exp_from'] ?? null, fn ($q, $date) => $q->whereDate('garansi_exp', '>=', $date))
            ->when($validated['garansi_exp_to'] ?? null, fn ($q, $date) => $q->whereDate('garansi_exp', '<=', $date))
            ->when($validated['in_come_date_from'] ?? null, fn ($q, $date) => $q->whereDate('in_come_date', '>=', $date))
            ->when($validated['in_come_date_to'] ?? null, fn ($q, $date) => $q->whereDate('in_come_date', '<=', $date))
            ->when($validated['broken_date_from'] ?? null, fn ($q, $date) => $q->whereDate('broken_date', '>=', $date))
            ->when($validated['broken_date_to'] ?? null, fn ($q, $date) => $q->whereDate('broken_date', '<=', $date))
            ->when(! empty($validated['has_photo']), fn ($q) => $q->whereNotNull('photo_url')->where('photo_url', '!=', '[]'))
            ->when(isset($validated['has_photo']) && empty($validated['has_photo']), fn ($q) => $q->where(function ($query) {
                $query->whereNull('photo_url')
                    ->orWhere('photo_url', '[]');
            }))
            ->when(! empty($validated['has_document']), fn ($q) => $q->whereNotNull('document_url')->where('document_url', '!=', '[]'))
            ->when(isset($validated['has_document']) && empty($validated['has_document']), fn ($q) => $q->where(function ($query) {
                $query->whereNull('document_url')
                    ->orWhere('document_url', '[]');
            }))
            ->orderBy('created_at', 'desc')
            ->paginate($perPage)
            ->withQueryString();

        $summary = $this->buildAssetsSummary($request, $assets->total());

        return Inertia::render('assets/Report', [
            'assets' => $assets,
            'filters' => $validated,
            'summary' => $summary,
            'items' => Item::query()->with('category:id,code')->orderBy('name')->get(['id', 'code', 'name', 'category_id']),
            'locations' => Location::query()->orderBy('name')->get(['id', 'name']),
            'departments' => Department::query()->orderBy('nama_department')->get(['id_department', 'nama_department']),
            'employees' => Employee::query()->orderBy('nama_employee')->get(['id_employee', 'nama_employee']),
        ]);
    }

    public function exportReport(Request $request, string $format = 'xlsx'): StreamedResponse|SymfonyResponse
    {
        Gate::authorize('asset.view');

        $validated = $request->validate([
            'format' => ['sometimes', 'string', 'in:xlsx,pdf'],
            'item_id' => ['sometimes', 'string', 'max:36', 'nullable'],
            'brand' => ['sometimes', 'string', 'max:100', 'nullable'],
            'model' => ['sometimes', 'string', 'max:100', 'nullable'],
            'serial_number' => ['sometimes', 'string', 'max:100', 'nullable'],
            'part_number' => ['sometimes', 'string', 'max:100', 'nullable'],
            'has_photo' => ['sometimes', 'boolean'],
            'has_document' => ['sometimes', 'boolean'],
            'location_id' => ['sometimes', 'string', 'max:36', 'nullable'],
            'department_id' => ['sometimes', 'string', 'max:36', 'nullable'],
            'purchase_date_from' => ['sometimes', 'date', 'nullable'],
            'purchase_date_to' => ['sometimes', 'date', 'nullable'],
            'purchase_price_min' => ['sometimes', 'numeric', 'nullable'],
            'purchase_price_max' => ['sometimes', 'numeric', 'nullable'],
            'vendor_name' => ['sometimes', 'string', 'max:100', 'nullable'],
            'asset_type' => ['sometimes', 'string', 'in:fixed_asset,equipment', 'nullable'],
            'depreciation_method' => ['sometimes', 'string', 'in:straight_line,declining_balance,none', 'nullable'],
            'acquisition_cost_min' => ['sometimes', 'numeric', 'nullable'],
            'acquisition_cost_max' => ['sometimes', 'numeric', 'nullable'],
            'useful_life_years' => ['sometimes', 'integer', 'nullable'],
            'has_type_override' => ['sometimes', 'boolean'],
            'status' => ['sometimes', 'string', 'in:ACT,LOAN,RPR,MUT,DSP', 'nullable'],
            'condition' => ['sometimes', 'string', 'in:Baik,Rusak Ringan,Rusak Berat', 'nullable'],
            'no_spb' => ['sometimes', 'string', 'max:100', 'nullable'],
            'document_number' => ['sometimes', 'string', 'max:100', 'nullable'],
            'pic' => ['sometimes', 'string', 'max:100', 'nullable'],
            'notes' => ['sometimes', 'string', 'nullable'],
            'warranty_expire_from' => ['sometimes', 'date', 'nullable'],
            'warranty_expire_to' => ['sometimes', 'date', 'nullable'],
            'garansi_exp_from' => ['sometimes', 'date', 'nullable'],
            'garansi_exp_to' => ['sometimes', 'date', 'nullable'],
            'in_come_date_from' => ['sometimes', 'date', 'nullable'],
            'in_come_date_to' => ['sometimes', 'date', 'nullable'],
            'broken_date_from' => ['sometimes', 'date', 'nullable'],
            'broken_date_to' => ['sometimes', 'date', 'nullable'],
        ]);

        $format = $validated['format'] ?? 'xlsx';

        $query = Asset::query()
            ->with([
                'item:id,code,name',
                'location:id,name',
                'department:id_department,nama_department',
                'assetGroup:id,code,name',
                'assetCategory:id,code,name',
                'assetCluster:id,code,name',
                'assetSubCluster:id,code,name',
            ])
            ->when(! $request->user()->hasAnyRole(['Asset Staff', 'Accounting', 'staff-asset', 'akunting', 'super-admin']), function ($q) use ($request) {
                $deptId = $request->user()?->department ?? null;
                if ($deptId) {
                    $q->where('department_id', $deptId);
                } else {
                    $q->whereRaw('1 = 0');
                }
            })
            ->when($validated['item_id'] ?? null, fn ($q, $item_id) => $q->where('item_id', $item_id))
            ->when($validated['brand'] ?? null, fn ($q, $brand) => $q->where('brand', 'like', "%{$brand}%"))
            ->when($validated['model'] ?? null, fn ($q, $model) => $q->where('model', 'like', "%{$model}%"))
            ->when($validated['serial_number'] ?? null, fn ($q, $serial) => $q->where('serial_number', 'like', "%{$serial}%"))
            ->when($validated['part_number'] ?? null, fn ($q, $part) => $q->where('part_number', 'like', "%{$part}%"))
            ->when($validated['purchase_date_from'] ?? null, fn ($q, $date) => $q->whereDate('purchase_date', '>=', $date))
            ->when($validated['purchase_date_to'] ?? null, fn ($q, $date) => $q->whereDate('purchase_date', '<=', $date))
            ->when($validated['purchase_price_min'] ?? null, fn ($q, $price) => $q->where('purchase_price', '>=', $price))
            ->when($validated['purchase_price_max'] ?? null, fn ($q, $price) => $q->where('purchase_price', '<=', $price))
            ->when($validated['vendor_name'] ?? null, fn ($q, $vendor) => $q->where('vendor_name', 'like', "%{$vendor}%"))
            ->when($validated['asset_type'] ?? null, fn ($q, $type) => $q->where('asset_type', $type))
            ->when($validated['depreciation_method'] ?? null, fn ($q, $method) => $q->where('depreciation_method', $method))
            ->when($validated['acquisition_cost_min'] ?? null, fn ($q, $cost) => $q->where('acquisition_cost', '>=', $cost))
            ->when($validated['acquisition_cost_max'] ?? null, fn ($q, $cost) => $q->where('acquisition_cost', '<=', $cost))
            ->when($validated['useful_life_years'] ?? null, fn ($q, $years) => $q->where('useful_life_years', $years))
            ->when(! empty($validated['has_type_override']), fn ($q) => $q->whereNotNull('type_override_reason'))
            ->when($validated['status'] ?? null, fn ($q, $status) => $q->where('status', $status))
            ->when($validated['condition'] ?? null, fn ($q, $condition) => $q->where('condition', $condition))
            ->when($validated['no_spb'] ?? null, fn ($q, $no_spb) => $q->where('no_spb', 'like', "%{$no_spb}%"))
            ->when($validated['document_number'] ?? null, fn ($q, $doc) => $q->where('document_number', 'like', "%{$doc}%"))
            ->when($validated['pic'] ?? null, fn ($q, $pic) => $q->where('pic', 'like', "%{$pic}%"))
            ->when($validated['notes'] ?? null, fn ($q, $notes) => $q->where('notes', 'like', "%{$notes}%"))
            ->when($validated['location_id'] ?? null, fn ($q, $loc) => $q->where('location_id', $loc))
            ->when($validated['department_id'] ?? null, fn ($q, $dept) => $q->where('department_id', $dept))
            ->when($validated['warranty_expire_from'] ?? null, fn ($q, $date) => $q->whereDate('warranty_expire', '>=', $date))
            ->when($validated['warranty_expire_to'] ?? null, fn ($q, $date) => $q->whereDate('warranty_expire', '<=', $date))
            ->when($validated['garansi_exp_from'] ?? null, fn ($q, $date) => $q->whereDate('garansi_exp', '>=', $date))
            ->when($validated['garansi_exp_to'] ?? null, fn ($q, $date) => $q->whereDate('garansi_exp', '<=', $date))
            ->when($validated['in_come_date_from'] ?? null, fn ($q, $date) => $q->whereDate('in_come_date', '>=', $date))
            ->when($validated['in_come_date_to'] ?? null, fn ($q, $date) => $q->whereDate('in_come_date', '<=', $date))
            ->when($validated['broken_date_from'] ?? null, fn ($q, $date) => $q->whereDate('broken_date', '>=', $date))
            ->when($validated['broken_date_to'] ?? null, fn ($q, $date) => $q->whereDate('broken_date', '<=', $date))
            ->when(! empty($validated['has_photo']), fn ($q) => $q->whereNotNull('photo_url')->where('photo_url', '!=', '[]'))
            ->when(isset($validated['has_photo']) && empty($validated['has_photo']), fn ($q) => $q->where(function ($query) {
                $query->whereNull('photo_url')
                    ->orWhere('photo_url', '[]');
            }))
            ->when(! empty($validated['has_document']), fn ($q) => $q->whereNotNull('document_url')->where('document_url', '!=', '[]'))
            ->when(isset($validated['has_document']) && empty($validated['has_document']), fn ($q) => $q->where(function ($query) {
                $query->whereNull('document_url')
                    ->orWhere('document_url', '[]');
            }))
            ->orderBy('created_at', 'desc')
            ->get();

        $filename = 'laporan_daftar_aset_'.now()->format('Y-m-d').'.'.$format;

        if ($format === 'pdf') {
            $pdf = Pdf::loadView('reports.assets_pdf', ['assets' => $query]);

            return $pdf->download($filename);
        }

        $tempPath = storage_path('app/'.Str::uuid().'.xlsx');

        $writer = SimpleExcelWriter::create($tempPath)->addHeader([
            'Kode Aset', 'Item', 'Brand', 'Model', 'Serial Number', 'Part Number',
            'Status', 'Kondisi', 'Lokasi', 'Department', 'Vendor',
            'Tgl Pembelian', 'Harga Pembelian', 'Tipe Aset', 'Akumulasi',
            'Nama PIC', 'No SPB', 'No Dokumen', 'Ada Foto', 'Ada Dokumen', 'Catatan',
        ]);

        foreach ($query as $a) {
            $writer->addRow([
                'Kode Aset' => $a->kode_asset ?? '',
                'Item' => $a->item?->code.' - '.$a->item?->name ?? '',
                'Brand' => $a->brand ?? '',
                'Model' => $a->model ?? '',
                'Serial Number' => $a->serial_number ?? '',
                'Part Number' => $a->part_number ?? '',
                'Status' => $this->statusLabel($a->status),
                'Kondisi' => $a->condition ?? '',
                'Lokasi' => $a->location?->name ?? '',
                'Department' => $a->department?->nama_department ?? '',
                'Vendor' => $a->vendor_name ?? '',
                'Tgl Pembelian' => $a->purchase_date?->format('d/m/Y') ?? '',
                'Harga Pembelian' => $a->purchase_price ?? '',
                'Tipe Aset' => $a->asset_type === 'fixed_asset' ? 'Aktiva Tetap' : 'Peralatan',
                'Akumulasi' => $a->accumulated_depreciation ?? '',
                'Nama PIC' => is_array($a->pic) ? implode(', ', $a->pic) : $a->pic ?? '',
                'No SPB' => $a->no_spb ?? '',
                'No Dokumen' => $a->document_number ?? '',
                'Ada Foto' => (! empty($a->photo_url) && $a->photo_url !== '[]') ? 'Ya' : 'Tidak',
                'Ada Dokumen' => (! empty($a->document_url) && $a->document_url !== '[]') ? 'Ya' : 'Tidak',
                'Catatan' => $a->notes ?? '',
            ]);
        }

        $writer->close();

        return response()->download($tempPath, $filename)->deleteFileAfterSend(true);
    }

    private function buildAssetsSummary(Request $request, int $totalCount): array
    {
        $assetsQuery = Asset::query()
            ->with(['item:id,code,name', 'location:id,name', 'department:id_department,nama_department']);

        if (! $request->user()->hasAnyRole(['Asset Staff', 'Accounting', 'staff-asset', 'akunting', 'super-admin'])) {
            $deptId = $request->user()?->department ?? null;
            if ($deptId) {
                $assetsQuery->where('department_id', $deptId);
            }
        }

        $summary = [
            'total_assets' => $totalCount,
            'total_with_photo' => $assetsQuery->whereNotNull('photo_url')->where('photo_url', '!=', '[]')->count(),
            'total_with_document' => $assetsQuery->whereNotNull('document_url')->where('document_url', '!=', '[]')->count(),
            'total_purchase_value' => $assetsQuery->sum('purchase_price'),
            'total_acquisition_cost' => $assetsQuery->sum('acquisition_cost'),
            'status_breakdown' => [
                'Aktif' => $assetsQuery->where('status', 'ACT')->count(),
                'Dipinjamkan' => $assetsQuery->where('status', 'LOAN')->count(),
                'Perbaikan' => $assetsQuery->where('status', 'RPR')->count(),
                'Dimutasi' => $assetsQuery->where('status', 'MUT')->count(),
                'Dihapus' => $assetsQuery->where('status', 'DSP')->count(),
            ],
            'condition_breakdown' => [
                'Baik' => $assetsQuery->where('condition', 'Baik')->count(),
                'Rusak Ringan' => $assetsQuery->where('condition', 'Rusak Ringan')->count(),
                'Rusak Berat' => $assetsQuery->where('condition', 'Rusak Berat')->count(),
            ],
            'asset_type_breakdown' => [
                'Aktiva Tetap' => $assetsQuery->where('asset_type', 'fixed_asset')->count(),
                'Peralatan' => $assetsQuery->where('asset_type', 'equipment')->count(),
            ],
        ];

        return $summary;
    }
}
