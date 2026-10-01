<?php

namespace App\Actions;

use App\Enums\ClassificationType;
use App\Models\AssetCategory;
use App\Models\AssetCluster;
use App\Models\AssetGroup;
use App\Models\AssetSubCluster;
use App\Models\Tenant;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Spatie\SimpleExcel\SimpleExcelReader;

/**
 * @phpstan-type ClassificationRow array{level: string, name: string, code?: string|null, description?: string|null, parent_code?: string|null, tipe: string|null}
 */
class ImportClassificationsAction
{
    /**
     * @return array{created: int, updated: int, skipped: array<int, string>}
     */
    public function fromFile(string $filePath): array
    {
        $rows = SimpleExcelReader::create($filePath)
            ->getRows()
            ->map(fn (array $row): array => $this->normalizeRow($row))
            ->filter(fn (array $row): bool => $row['name'] !== '')
            ->values()
            ->all();

        return $this->fromRows($rows);
    }

    /**
     * Process parsed rows array (backward compat for tests). Tipe klasifikasi
     * is mandatory: rows without a valid peralatan/aktiva_tetap value are
     * rejected per row (documented decision — no blind default; a typo'd
     * tipe falls back to null and is rejected here too).
     *
     * @param  array<int, array{level: string, name: string, code?: string|null, description?: string|null, parent_code?: string|null, tipe: string|null}>  $rows
     * @return array{created: int, updated: int, skipped: array<int, string>}
     */
    public function fromRows(array $rows): array
    {
        $summary = ['created' => 0, 'updated' => 0, 'skipped' => []];

        /** @var Collection<int, ClassificationRow> $collection */
        $collection = collect($rows)
            ->filter(fn (array $row): bool => $row['name'] !== '')
            ->values();

        if ($collection->isEmpty()) {
            return $summary;
        }

        $validRows = [];
        foreach ($collection as $row) {
            if ($row['tipe'] === null) {
                $summary['skipped'][] = "'{$row['name']}' (kolom tipe wajib diisi: peralatan atau aktiva_tetap).";

                continue;
            }

            $validRows[] = $row;
        }

        /** @var Collection<int, ClassificationRow> $collection */
        $collection = collect($validRows);

        if ($collection->isEmpty()) {
            return $summary;
        }

        // Pre-load all existing records into memory (1 query per model).
        // Groups are keyed by "code|tipe" — the same code may exist per type.
        $allGroups = AssetGroup::query()->get()
            ->keyBy(fn (AssetGroup $g): string => $g->code.'|'.($g->classification_type instanceof ClassificationType ? $g->classification_type->value : ''));
        $allCategories = AssetCategory::query()->get()
            ->keyBy(fn (AssetCategory $c): string => "{$c->asset_group_id}.{$c->code}");
        $allClusters = AssetCluster::query()->get()
            ->keyBy(fn (AssetCluster $c): string => "{$c->asset_category_id}.{$c->code}");
        $allSubClusters = AssetSubCluster::query()->get()
            ->keyBy(fn (AssetSubCluster $sc): string => "{$sc->asset_cluster_id}.{$sc->code}");

        // Group by level and process in hierarchy order.
        $grouped = $collection->groupBy('level');

        DB::transaction(function () use ($grouped, &$allGroups, &$allCategories, &$allClusters, &$allSubClusters, &$summary): void {
            /** @var array<int, ClassificationRow> $groupRows */
            $groupRows = $grouped->get('group', collect())->all();
            /** @var array<int, ClassificationRow> $categoryRows */
            $categoryRows = $grouped->get('category', collect())->all();
            /** @var array<int, ClassificationRow> $clusterRows */
            $clusterRows = $grouped->get('cluster', collect())->all();
            /** @var array<int, ClassificationRow> $subClusterRows */
            $subClusterRows = $grouped->get('sub-cluster', collect())->all();

            $this->processGroups($groupRows, $allGroups, $summary);
            $this->processCategories($categoryRows, $allGroups, $allCategories, $summary);
            $this->processClusters($clusterRows, $allGroups, $allCategories, $allClusters, $summary);
            $this->processSubClusters($subClusterRows, $allGroups, $allCategories, $allClusters, $allSubClusters, $summary);
        });

        Cache::forget('classification.tree.'.Tenant::current()?->id);

        return $summary;
    }

    /**
     * @param  array<int, ClassificationRow>  $rows
     * @param  Collection<string, AssetGroup>  $allGroups  keyed by code
     * @param  array{created: int, updated: int, skipped: array<int, string>}  $summary
     */
    private function processGroups(array $rows, Collection &$allGroups, array &$summary): void
    {
        foreach ($rows as $row) {
            $segments = $this->codeSegments($row);
            $code = $segments[0] ?? $row['code'] ?? null;

            /** @var AssetGroup|null $existing */
            $existing = $code !== null ? $allGroups->get($code.'|'.$row['tipe']) : null;

            if ($existing) {
                $existing->update([
                    'name' => $row['name'],
                    'description' => $row['description'] ?? null,
                ]);
                $summary['updated']++;
            } else {
                $group = AssetGroup::create([
                    'code' => $code,
                    'name' => $row['name'],
                    'description' => $row['description'] ?? null,
                    'classification_type' => $row['tipe'],
                ]);
                $summary['created']++;

                if ($code !== null) {
                    $allGroups->put($code.'|'.$row['tipe'], $group);
                }
            }
        }
    }

    /**
     * @param  array<int, ClassificationRow>  $rows
     * @param  Collection<string, AssetGroup>  $allGroups  keyed by code
     * @param  Collection<string, AssetCategory>  $allCategories  keyed by "group_id.code"
     * @param  array{created: int, updated: int, skipped: array<int, string>}  $summary
     */
    private function processCategories(array $rows, Collection $allGroups, Collection &$allCategories, array &$summary): void
    {
        foreach ($rows as $row) {
            $segments = $this->codeSegments($row);
            $groupCode = $segments[0] ?? null;
            $categoryCode = $segments[1] ?? null;

            if ($groupCode === null) {
                $summary['skipped'][] = "Kategori '{$row['name']}' (tanpa kode golongan).";

                continue;
            }

            $group = $allGroups->get($groupCode.'|'.$row['tipe']);

            if ($group === null) {
                $summary['skipped'][] = "Kategori '{$row['name']}' (golongan '{$groupCode}' tidak ditemukan).";

                continue;
            }

            // Composite FK would reject a type mismatch or a typed child under
            // an untyped parent — reject per row with a clear message instead.
            $mismatch = $this->parentTypeMismatch($group->classification_type, $row['tipe'], 'golongan');
            if ($mismatch !== null) {
                $summary['skipped'][] = "Kategori '{$row['name']}' ({$mismatch}).";

                continue;
            }

            $lookupKey = "{$group->id}.{$categoryCode}";
            $existing = $allCategories->get($lookupKey);

            if ($existing) {
                $existing->update([
                    'name' => $row['name'],
                    'description' => $row['description'] ?? null,
                ]);
                $summary['updated']++;
            } else {
                $category = AssetCategory::create([
                    'asset_group_id' => $group->id,
                    'code' => $categoryCode,
                    'name' => $row['name'],
                    'description' => $row['description'] ?? null,
                    'classification_type' => $row['tipe'],
                ]);
                $summary['created']++;

                $allCategories->put($lookupKey, $category);
            }
        }
    }

    /**
     * @param  array<int, ClassificationRow>  $rows
     * @param  Collection<string, AssetGroup>  $allGroups  keyed by code
     * @param  Collection<string, AssetCategory>  $allCategories  keyed by "group_id.code"
     * @param  Collection<string, AssetCluster>  $allClusters  keyed by "category_id.code"
     * @param  array{created: int, updated: int, skipped: array<int, string>}  $summary
     */
    private function processClusters(array $rows, Collection $allGroups, Collection $allCategories, Collection &$allClusters, array &$summary): void
    {
        foreach ($rows as $row) {
            $segments = $this->codeSegments($row);
            $parent = $this->resolveParentFromCache(AssetCategory::class, $segments, $row['tipe'], $allGroups, $allCategories);

            if (! $parent instanceof AssetCategory) {
                $summary['skipped'][] = "Cluster '{$row['name']}' (induk tidak ditemukan).";

                continue;
            }

            $mismatch = $this->parentTypeMismatch($parent->classification_type, $row['tipe'], 'kategori');
            if ($mismatch !== null) {
                $summary['skipped'][] = "Cluster '{$row['name']}' ({$mismatch}).";

                continue;
            }

            $clusterCode = $segments[2] ?? null;
            $lookupKey = "{$parent->id}.{$clusterCode}";
            $existing = $allClusters->get($lookupKey);

            if ($existing) {
                $existing->update([
                    'name' => $row['name'],
                    'description' => $row['description'] ?? null,
                ]);
                $summary['updated']++;
            } else {
                $cluster = AssetCluster::create([
                    'asset_category_id' => $parent->id,
                    'code' => $clusterCode,
                    'name' => $row['name'],
                    'description' => $row['description'] ?? null,
                    'classification_type' => $row['tipe'],
                ]);
                $summary['created']++;

                $allClusters->put($lookupKey, $cluster);
            }
        }
    }

    /**
     * @param  array<int, ClassificationRow>  $rows
     * @param  Collection<string, AssetGroup>  $allGroups  keyed by code
     * @param  Collection<string, AssetCategory>  $allCategories  keyed by "group_id.code"
     * @param  Collection<string, AssetCluster>  $allClusters  keyed by "category_id.code"
     * @param  Collection<string, AssetSubCluster>  $allSubClusters  keyed by "cluster_id.code"
     * @param  array{created: int, updated: int, skipped: array<int, string>}  $summary
     */
    private function processSubClusters(array $rows, Collection $allGroups, Collection $allCategories, Collection $allClusters, Collection &$allSubClusters, array &$summary): void
    {
        foreach ($rows as $row) {
            $segments = $this->codeSegments($row);
            $parent = $this->resolveParentFromCache(AssetCluster::class, $segments, $row['tipe'], $allGroups, $allCategories, $allClusters);

            if (! $parent instanceof AssetCluster) {
                $summary['skipped'][] = "Sub Cluster '{$row['name']}' (induk tidak ditemukan).";

                continue;
            }

            $mismatch = $this->parentTypeMismatch($parent->classification_type, $row['tipe'], 'cluster');
            if ($mismatch !== null) {
                $summary['skipped'][] = "Sub Cluster '{$row['name']}' ({$mismatch}).";

                continue;
            }

            $subClusterCode = $segments[3] ?? null;
            $lookupKey = "{$parent->id}.{$subClusterCode}";
            $existing = $allSubClusters->get($lookupKey);

            if ($existing) {
                $existing->update([
                    'name' => $row['name'],
                    'description' => $row['description'] ?? null,
                ]);
                $summary['updated']++;
            } else {
                $subCluster = AssetSubCluster::create([
                    'asset_cluster_id' => $parent->id,
                    'code' => $subClusterCode,
                    'name' => $row['name'],
                    'description' => $row['description'] ?? null,
                    'classification_type' => $row['tipe'],
                ]);
                $summary['created']++;

                $allSubClusters->put($lookupKey, $subCluster);
            }
        }
    }

    /**
     * Resolve parent from in-memory cache instead of DB queries.
     *
     * @param  array<int, string|null>  $segments
     * @param  Collection<string, AssetGroup>  $allGroups  keyed by "code|tipe"
     * @param  Collection<string, AssetCategory>  $allCategories
     * @param  Collection<string, AssetCluster>  $allClusters
     */
    private function resolveParentFromCache(
        string $model,
        array $segments,
        string $tipe,
        Collection $allGroups,
        Collection $allCategories,
        Collection $allClusters = new Collection,
    ): AssetCategory|AssetCluster|null {
        $codeIndex = $model === AssetCategory::class ? 1 : 2;
        $groupCode = $segments[0] ?? null;
        $categoryCode = $segments[1] ?? null;
        $ownCode = $segments[$codeIndex] ?? null;

        if ($groupCode === null || $ownCode === null) {
            return null;
        }

        $group = $allGroups->get($groupCode.'|'.$tipe);

        if ($group === null) {
            return null;
        }

        if ($model === AssetCluster::class) {
            if ($categoryCode === null) {
                return null;
            }

            $categoryKey = "{$group->id}.{$categoryCode}";
            $category = $allCategories->get($categoryKey);

            if ($category === null) {
                return null;
            }

            $lookupKey = "{$category->id}.{$ownCode}";

            return $allClusters->get($lookupKey);
        }

        $lookupKey = "{$group->id}.{$ownCode}";

        return $allCategories->get($lookupKey);
    }

    /**
     * Parse row from SimpleExcel (snake_case headers) into our normalized format.
     *
     * @param  array<string, mixed>  $row
     * @return ClassificationRow
     */
    private function normalizeRow(array $row): array
    {
        $normalized = [];
        foreach ($row as $key => $value) {
            $normalizedKey = strtolower(trim((string) $key));
            $normalizedKey = preg_replace('/[^a-z0-9]+/', '_', $normalizedKey);
            $normalizedKey = trim($normalizedKey, '_');
            $normalized[$normalizedKey] = $value;
        }

        // Legacy flat format: level / name / code / description / parent_code / tipe
        if (isset($normalized['level'], $normalized['name'])) {
            return [
                'level' => $this->castLevel((string) $normalized['level']),
                'name' => (string) $normalized['name'],
                'code' => $normalized['code'] ?? null,
                'description' => $normalized['description'] ?? null,
                'parent_code' => $normalized['parent_code'] ?? null,
                'tipe' => $this->castTipe((string) ($normalized['tipe'] ?? $normalized['tipe_klasifikasi'] ?? $normalized['classification_type'] ?? '')),
            ];
        }

        // Hierarchy format: golongan_aset / bidang_kategori_aset / kelompok_aset / sub_kelompok_aset / uraian / keterangan
        $columns = [
            ['key' => 'golongan_aset', 'level' => 'group'],
            ['key' => 'bidang_kategori_aset', 'level' => 'category'],
            ['key' => 'kelompok_aset', 'level' => 'cluster'],
            ['key' => 'sub_kelompok_aset', 'level' => 'sub-cluster'],
        ];

        $filled = [];
        foreach ($columns as $col) {
            $value = $this->valueOrNull($normalized[$col['key']] ?? null);
            if ($value !== null) {
                $filled[] = ['level' => $col['level'], 'value' => $value];
            }
        }

        if ($filled === []) {
            return ['level' => '', 'name' => '', 'code' => null, 'description' => null, 'parent_code' => null, 'tipe' => null];
        }

        $node = last($filled);
        $parentPath = count($filled) > 1
            ? collect($filled)->slice(0, -1)->pluck('value')->implode('.')
            : '';

        return [
            'level' => $node['level'],
            'name' => $this->valueOrNull($normalized['uraian'] ?? null) ?? '',
            'code' => $node['value'],
            'description' => $this->valueOrNull($normalized['keterangan'] ?? null),
            'parent_code' => $parentPath ?: null,
            'tipe' => $this->castTipe((string) ($normalized['tipe'] ?? $normalized['tipe_klasifikasi'] ?? $normalized['classification_type'] ?? '')),
        ];
    }

    /**
     * The per-row failure message when the row's tipe differs from its parent's
     * (the composite FK would reject the insert otherwise), or null when the
     * tipe matches.
     */
    private function parentTypeMismatch(?ClassificationType $parentType, string $rowTipe, string $parentLabel): ?string
    {
        if ($parentType === null) {
            return "tipe harus sama dengan {$parentLabel} induk: belum bertipe";
        }

        return $parentType->value !== $rowTipe
            ? "tipe harus sama dengan {$parentLabel} induk: {$parentType->label()}"
            : null;
    }

    /**
     * Normalize a tipe value to the enum value; anything else (missing,
     * typo'd, unknown) becomes null and the row is rejected by fromRows.
     */
    private function castTipe(string $value): ?string
    {
        $normalized = str_replace(' ', '_', trim(mb_strtolower($value)));

        return match ($normalized) {
            'peralatan', 'equipment' => 'peralatan',
            'aktiva_tetap', 'fixed_asset' => 'aktiva_tetap',
            default => null,
        };
    }

    private function castLevel(string $value): string
    {
        return match (trim(mb_strtolower($value))) {
            'group' => 'group',
            'category' => 'category',
            'cluster' => 'cluster',
            'sub-cluster', 'sub_cluster', 'subcluster' => 'sub-cluster',
            default => $value,
        };
    }

    private function valueOrNull(mixed $value): ?string
    {
        $value = trim((string) $value);

        return $value === '' ? null : $value;
    }

    /**
     * Build the full hierarchical code segments from a row.
     *
     * @param  array{code?: string|null, parent_code?: string|null}  $row
     * @return array<int, string|null>
     */
    private function codeSegments(array $row): array
    {
        $code = $row['code'] ?? null;
        $parentCode = $row['parent_code'] ?? null;

        $split = fn (?string $value): array => $value === null || $value === ''
            ? []
            : array_values(array_filter(explode('.', $value), static fn (string $segment): bool => $segment !== ''));

        $segments = $split($code);
        $parentSegments = $split($parentCode);

        if (count($segments) > 1) {
            return array_pad($segments, 4, null);
        }

        $ownCode = $segments[0] ?? null;

        return array_pad([...$parentSegments, $ownCode], 4, null);
    }
}
