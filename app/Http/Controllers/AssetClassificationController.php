<?php

namespace App\Http\Controllers;

use App\Actions\ImportClassificationsAction;
use App\Models\AssetCategory;
use App\Models\AssetCluster;
use App\Models\AssetGroup;
use App\Models\AssetSubCluster;
use App\Models\Tenant;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

/**
 * @phpstan-type SerializedSubCluster array{
 *     id: string,
 *     code: string|null,
 *     name: string,
 *     description: string|null,
 *     notes: string|null,
 *     item_count: int<0, max>,
 *     level: string,
 * }
 * @phpstan-type SerializedCluster array{
 *     id: string,
 *     code: string|null,
 *     name: string,
 *     description: string|null,
 *     child_count: int<0, max>,
 *     level: string,
 *     children: array<int, SerializedSubCluster>,
 * }
 * @phpstan-type SerializedCategory array{
 *     id: string,
 *     code: string|null,
 *     name: string,
 *     description: string|null,
 *     child_count: int<0, max>,
 *     level: string,
 *     children: array<int, SerializedCluster>,
 * }
 * @phpstan-type SerializedGroup array{
 *     id: string,
 *     code: string|null,
 *     name: string,
 *     description: string|null,
 *     child_count: int<0, max>,
 *     level: string,
 *     children: array<int, SerializedCategory>,
 * }
 */
class AssetClassificationController extends Controller
{
    public function index(): Response
    {
        Gate::authorize('asset.classification.view');

        $tenantId = Tenant::current()?->id;

        $groups = Cache::remember(
            "classification.tree.{$tenantId}",
            now()->addDay(),
            fn () => $this->buildTree(),
        );

        return Inertia::render('asset-classification', [
            'groups' => $groups,
        ]);
    }

    /** @return array<int, SerializedGroup> */
    private function buildTree(): array
    {
        return AssetGroup::query()
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
                                    ->withCount('assets')
                                    ->orderBy('sort_order')
                                    ->orderBy('code'),
                            ]),
                    ]),
            ])
            ->orderBy('sort_order')
            ->orderBy('code')
            ->get()
            ->map(fn (AssetGroup $group) => $this->serializeGroup($group))
            ->values()
            ->all();
    }

    /** @return SerializedGroup */
    private function serializeGroup(AssetGroup $group): array
    {
        return [
            'id' => $group->id,
            'code' => $group->code,
            'name' => $group->name,
            'description' => $group->description,
            'child_count' => $group->categories_count,
            'level' => 'group',
            'children' => $group->categories
                ->map(fn (AssetCategory $category): array => [
                    'id' => $category->id,
                    'code' => $category->code,
                    'name' => $category->name,
                    'description' => $category->description,
                    'child_count' => $category->clusters_count,
                    'level' => 'category',
                    'children' => $category->clusters
                        ->map(fn (AssetCluster $cluster): array => [
                            'id' => $cluster->id,
                            'code' => $cluster->code,
                            'name' => $cluster->name,
                            'description' => $cluster->description,
                            'child_count' => $cluster->sub_clusters_count,
                            'level' => 'cluster',
                            'children' => $cluster->subClusters
                                ->map(fn (AssetSubCluster $subCluster): array => [
                                    'id' => $subCluster->id,
                                    'code' => $subCluster->code,
                                    'name' => $subCluster->name,
                                    'description' => $subCluster->description,
                                    'notes' => $subCluster->notes,
                                    'item_count' => $subCluster->assets_count,
                                    'level' => 'sub-cluster',
                                ])
                                ->values()
                                ->all(),
                        ])
                        ->values()
                        ->all(),
                ])
                ->values()
                ->all(),
        ];
    }

    public function storeGroup(Request $request): RedirectResponse
    {
        Gate::authorize('asset.classification.create');

        $validated = $request->validate([
            'code' => [
                'nullable',
                'string',
                'max:20',
                Rule::unique('asset_groups')->where(fn ($query) => $query->where('tenant_id', Tenant::current()?->id)),
            ],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
        ]);

        AssetGroup::create($validated);

        return back()->with('success', 'Golongan berhasil ditambahkan.');
    }

    public function updateGroup(Request $request, AssetGroup $group): RedirectResponse
    {
        Gate::authorize('asset.classification.edit');

        $validated = $request->validate([
            'code' => [
                'nullable',
                'string',
                'max:20',
                Rule::unique('asset_groups')->ignore($group->id)->where(fn ($query) => $query->where('tenant_id', $group->tenant_id)),
            ],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
        ]);

        $group->update($validated);

        return back()->with('success', 'Golongan berhasil diperbarui.');
    }

    public function destroyGroup(AssetGroup $group): RedirectResponse
    {
        Gate::authorize('asset.classification.delete');

        $group->delete();

        return back()->with('success', 'Golongan berhasil dihapus.');
    }

    public function storeCategory(Request $request): RedirectResponse
    {
        Gate::authorize('asset.classification.create');

        $validated = $request->validate([
            'asset_group_id' => ['required', 'string'],
            'code' => [
                'nullable',
                'string',
                'max:20',
                Rule::unique('asset_categories')->where(fn ($query) => $query->where('asset_group_id', $request->input('asset_group_id'))),
            ],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
        ]);

        $group = AssetGroup::whereKey($validated['asset_group_id'])->firstOrFail();

        $group->categories()->create($validated);

        return back()->with('success', 'Kategori berhasil ditambahkan.');
    }

    public function updateCategory(Request $request, AssetCategory $category): RedirectResponse
    {
        Gate::authorize('asset.classification.edit');

        $validated = $request->validate([
            'code' => [
                'nullable',
                'string',
                'max:20',
                Rule::unique('asset_categories')->ignore($category->id)->where(fn ($query) => $query->where('asset_group_id', $category->asset_group_id)),
            ],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
        ]);

        $category->update($validated);

        return back()->with('success', 'Kategori berhasil diperbarui.');
    }

    public function destroyCategory(AssetCategory $category): RedirectResponse
    {
        Gate::authorize('asset.classification.delete');

        $category->delete();

        return back()->with('success', 'Kategori berhasil dihapus.');
    }

    public function storeCluster(Request $request): RedirectResponse
    {
        Gate::authorize('asset.classification.create');

        $validated = $request->validate([
            'asset_category_id' => ['required', 'string'],
            'code' => [
                'nullable',
                'string',
                'max:20',
                Rule::unique('asset_clusters')->where(fn ($query) => $query->where('asset_category_id', $request->input('asset_category_id'))),
            ],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
        ]);

        $category = AssetCategory::whereKey($validated['asset_category_id'])->firstOrFail();

        $category->clusters()->create($validated);

        return back()->with('success', 'Cluster berhasil ditambahkan.');
    }

    public function updateCluster(Request $request, AssetCluster $cluster): RedirectResponse
    {
        Gate::authorize('asset.classification.edit');

        $validated = $request->validate([
            'code' => [
                'nullable',
                'string',
                'max:20',
                Rule::unique('asset_clusters')->ignore($cluster->id)->where(fn ($query) => $query->where('asset_category_id', $cluster->asset_category_id)),
            ],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
        ]);

        $cluster->update($validated);

        return back()->with('success', 'Cluster berhasil diperbarui.');
    }

    public function destroyCluster(AssetCluster $cluster): RedirectResponse
    {
        Gate::authorize('asset.classification.delete');

        $cluster->delete();

        return back()->with('success', 'Cluster berhasil dihapus.');
    }

    public function storeSubCluster(Request $request): RedirectResponse
    {
        Gate::authorize('asset.classification.create');

        $validated = $request->validate([
            'asset_cluster_id' => ['required', 'string'],
            'code' => [
                'nullable',
                'string',
                'max:20',
                Rule::unique('asset_sub_clusters')->where(fn ($query) => $query->where('asset_cluster_id', $request->input('asset_cluster_id'))),
            ],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'notes' => ['nullable', 'string'],
        ]);

        $cluster = AssetCluster::whereKey($validated['asset_cluster_id'])->firstOrFail();

        $cluster->subClusters()->create($validated);

        return back()->with('success', 'Sub Cluster berhasil ditambahkan.');
    }

    public function updateSubCluster(Request $request, AssetSubCluster $subCluster): RedirectResponse
    {
        Gate::authorize('asset.classification.edit');

        $validated = $request->validate([
            'code' => [
                'nullable',
                'string',
                'max:20',
                Rule::unique('asset_sub_clusters')->ignore($subCluster->id)->where(fn ($query) => $query->where('asset_cluster_id', $subCluster->asset_cluster_id)),
            ],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'notes' => ['nullable', 'string'],
        ]);

        $subCluster->update($validated);

        return back()->with('success', 'Sub Cluster berhasil diperbarui.');
    }

    public function destroySubCluster(AssetSubCluster $subCluster): RedirectResponse
    {
        Gate::authorize('asset.classification.delete');

        $subCluster->delete();

        return back()->with('success', 'Sub Cluster berhasil dihapus.');
    }

    public function reorder(Request $request): RedirectResponse
    {
        Gate::authorize('asset.classification.edit');

        $validated = $request->validate([
            'level' => ['required', Rule::in(['group', 'category', 'cluster', 'sub-cluster'])],
            'parent_id' => ['nullable', 'string'],
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['required', 'string'],
        ]);

        $level = $validated['level'];
        $model = $this->modelForLevel($level);

        if ($model === null) {
            throw ValidationException::withMessages(['level' => 'Level klasifikasi tidak valid.']);
        }

        if ($level === 'group' && $validated['parent_id'] !== null) {
            throw ValidationException::withMessages(['parent_id' => 'Golongan tidak memiliki induk.']);
        }

        // Tenant-scoped ownership: every id must belong to the current tenant.
        if ($model::whereKey($validated['ids'])->count() !== count($validated['ids'])) {
            throw ValidationException::withMessages(['ids' => 'Item tidak ditemukan.']);
        }

        $parentId = $validated['parent_id'];

        if ($parentId !== null) {
            $this->resolveParent($level, $parentId);
        }

        $this->applyOrder(
            level: $level,
            ids: $validated['ids'],
            parentId: $parentId,
        );

        return back();
    }

    public function destroyBulk(Request $request): RedirectResponse
    {
        Gate::authorize('asset.classification.delete');

        $validated = $request->validate([
            'level' => ['required', Rule::in(['group', 'category', 'cluster', 'sub-cluster'])],
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['required', 'string'],
        ]);

        $model = $this->modelForLevel($validated['level']);

        if ($model === null) {
            throw ValidationException::withMessages(['level' => 'Level klasifikasi tidak valid.']);
        }

        // Tenant-scoped ownership: every id must belong to the current tenant.
        if ($model::whereKey($validated['ids'])->count() !== count($validated['ids'])) {
            throw ValidationException::withMessages(['ids' => 'Item tidak ditemukan.']);
        }

        DB::transaction(function () use ($model, $validated): void {
            $model::whereKey($validated['ids'])->get()->each->delete();
        });

        return back()->with('success', count($validated['ids']).' item berhasil dihapus.');
    }

    /**
     * Resolve the reparent target through the tenant scope (404 on
     * cross-tenant or missing parents instead of silent reassignment).
     */
    private function resolveParent(string $level, string $parentId): void
    {
        $parent = match ($level) {
            'category' => AssetGroup::whereKey($parentId)->first(),
            'cluster' => AssetCategory::whereKey($parentId)->first(),
            'sub-cluster' => AssetCluster::whereKey($parentId)->first(),
            default => null,
        };

        if ($level !== 'group' && $parent === null) {
            throw ValidationException::withMessages(['parent_id' => 'Induk tidak ditemukan.']);
        }
    }

    public function import(Request $request, ImportClassificationsAction $action): RedirectResponse
    {
        Gate::authorize('asset.classification.edit');

        if ($request->hasFile('file')) {
            $validated = $request->validate([
                'file' => ['required', 'file', 'mimes:xlsx,csv,xls,ods', 'max:5120'],
            ]);

            /** @var UploadedFile $file */
            $file = $validated['file'];
            $tempPath = $file->store('classification/imports', ['disk' => 'local']);

            if (! is_string($tempPath)) {
                throw new \RuntimeException('Tidak dapat menyimpan file sementara.');
            }

            try {
                $summary = $action->fromFile(Storage::disk('local')->path($tempPath));
            } finally {
                Storage::disk('local')->delete($tempPath);
            }

            return back()->with('success', $this->importSummaryMessage($summary));
        }

        $validated = $request->validate([
            'rows' => ['required', 'array', 'min:1'],
            'rows.*.level' => ['required', Rule::in(['group', 'category', 'cluster', 'sub-cluster'])],
            'rows.*.name' => ['required', 'string', 'max:255'],
            'rows.*.code' => ['nullable', 'string', 'max:20'],
            'rows.*.description' => ['nullable', 'string'],
            'rows.*.parent_code' => ['nullable', 'string', 'max:20'],
        ]);

        $summary = $action->fromRows($validated['rows']);

        return back()->with('success', $this->importSummaryMessage($summary));
    }

    /**
     * @param  array{created: int, updated: int, skipped: array<int, string>}  $summary
     */
    private function importSummaryMessage(array $summary): string
    {
        $message = "{$summary['created']} dibuat, {$summary['updated']} diperbarui.";

        if ($summary['skipped'] !== []) {
            $message .= ' Dilewati: '.implode('; ', array_slice($summary['skipped'], 0, 3));

            if (count($summary['skipped']) > 3) {
                $message .= sprintf(' (+%d lainnya)', count($summary['skipped']) - 3);
            }
        }

        return $message;
    }

    /** @param non-empty-array<int, string> $ids */
    private function applyOrder(string $level, array $ids, ?string $parentId): void
    {
        $parentField = match ($level) {
            'category' => 'asset_group_id',
            'cluster' => 'asset_category_id',
            'sub-cluster' => 'asset_cluster_id',
            default => null,
        };

        $model = $this->modelForLevel($level);

        if ($model === null) {
            throw new \LogicException('Unsupported classification level.');
        }

        DB::transaction(function () use ($model, $ids, $parentField, $parentId): void {
            $models = $model::whereKey($ids)->get()->keyBy('id');

            foreach ($ids as $index => $id) {
                $record = $models->get($id);

                // Ids and parents are ownership-checked before this point.
                if (! $record) {
                    continue;
                }

                if ($parentField !== null && $parentId !== null) {
                    $record->setAttribute($parentField, $parentId);
                }

                $record->sort_order = $index;
                $record->save();
            }
        });
    }

    /**
     * @return class-string<AssetGroup|AssetCategory|AssetCluster|AssetSubCluster>|null
     */
    private function modelForLevel(string $level): ?string
    {
        return match ($level) {
            'group' => AssetGroup::class,
            'category' => AssetCategory::class,
            'cluster' => AssetCluster::class,
            'sub-cluster' => AssetSubCluster::class,
            default => null,
        };
    }
}
