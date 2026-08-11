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
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

/**
 * @phpstan-type SerializedSubCluster array{
 *     id: string,
 *     code: string|null,
 *     name: string,
 *     description: string|null,
 *     notes: string|null,
 *     item_count: 0,
 * }
 * @phpstan-type SerializedCluster array{
 *     id: string,
 *     code: string|null,
 *     name: string,
 *     description: string|null,
 *     child_count: int<0, max>,
 *     children: array<int, SerializedSubCluster>,
 * }
 * @phpstan-type SerializedCategory array{
 *     id: string,
 *     code: string|null,
 *     name: string,
 *     description: string|null,
 *     child_count: int<0, max>,
 *     children: array<int, SerializedCluster>,
 * }
 * @phpstan-type SerializedGroup array{
 *     id: string,
 *     code: string|null,
 *     name: string,
 *     description: string|null,
 *     child_count: int<0, max>,
 *     children: array<int, SerializedCategory>,
 * }
 */
class AssetClassificationController extends Controller
{
    public function index(): Response
    {
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
            'children' => $group->categories
                ->map(fn (AssetCategory $category): array => [
                    'id' => $category->id,
                    'code' => $category->code,
                    'name' => $category->name,
                    'description' => $category->description,
                    'child_count' => $category->clusters_count,
                    'children' => $category->clusters
                        ->map(fn (AssetCluster $cluster): array => [
                            'id' => $cluster->id,
                            'code' => $cluster->code,
                            'name' => $cluster->name,
                            'description' => $cluster->description,
                            'child_count' => $cluster->sub_clusters_count,
                            'children' => $cluster->subClusters
                                ->map(fn (AssetSubCluster $subCluster): array => [
                                    'id' => $subCluster->id,
                                    'code' => $subCluster->code,
                                    'name' => $subCluster->name,
                                    'description' => $subCluster->description,
                                    'notes' => $subCluster->notes,
                                    'item_count' => 0,
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
        $group->delete();

        return back()->with('success', 'Golongan berhasil dihapus.');
    }

    public function storeCategory(Request $request): RedirectResponse
    {
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
        $category->delete();

        return back()->with('success', 'Kategori berhasil dihapus.');
    }

    public function storeCluster(Request $request): RedirectResponse
    {
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
        $cluster->delete();

        return back()->with('success', 'Cluster berhasil dihapus.');
    }

    public function storeSubCluster(Request $request): RedirectResponse
    {
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
        $subCluster->delete();

        return back()->with('success', 'Sub Cluster berhasil dihapus.');
    }

    public function reorder(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'level' => ['required', Rule::in(['group', 'category', 'cluster', 'sub-cluster'])],
            'parent_id' => ['nullable', 'string'],
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['required', 'string'],
        ]);

        $this->applyOrder(
            level: $validated['level'],
            ids: $validated['ids'],
            parentId: $validated['parent_id'],
        );

        return back();
    }

    public function import(Request $request, ImportClassificationsAction $action): RedirectResponse
    {
        if ($request->hasFile('file')) {
            /** @var UploadedFile $file */
            $file = $request->file('file');
            $tempPath = $file->store('classification/imports', ['disk' => 'local']);

            if (! is_string($tempPath)) {
                throw new \RuntimeException('Tidak dapat menyimpan file sementara.');
            }

            $action->fromFile(Storage::disk('local')->path($tempPath));

            Storage::disk('local')->delete($tempPath);
        } else {
            $validated = $request->validate([
                'rows' => ['required', 'array', 'min:1'],
                'rows.*.level' => ['required', Rule::in(['group', 'category', 'cluster', 'sub-cluster'])],
                'rows.*.name' => ['required', 'string', 'max:255'],
                'rows.*.code' => ['nullable', 'string', 'max:20'],
                'rows.*.description' => ['nullable', 'string'],
                'rows.*.parent_code' => ['nullable', 'string', 'max:20'],
            ]);

            $action->fromRows($validated['rows']);
        }

        return back();
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

        $models = match ($level) {
            'group' => AssetGroup::whereKey($ids)->get()->keyBy('id'),
            'category' => AssetCategory::whereKey($ids)->get()->keyBy('id'),
            'cluster' => AssetCluster::whereKey($ids)->get()->keyBy('id'),
            'sub-cluster' => AssetSubCluster::whereKey($ids)->get()->keyBy('id'),
            default => throw new \LogicException('Unsupported classification level.'),
        };

        foreach ($ids as $index => $id) {
            $model = $models->get($id);

            if (! $model) {
                continue;
            }

            $model->sort_order = $index;

            if ($parentField !== null && $parentId !== null) {
                $model->setAttribute($parentField, $parentId);
            }

            $model->save();
        }
    }
}
