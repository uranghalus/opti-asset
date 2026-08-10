<?php

namespace App\Actions;

use App\Models\Asset;
use App\Models\AssetCategory;
use App\Models\AssetCluster;
use App\Models\AssetGroup;
use App\Models\AssetSubCluster;

class GenerateAssetCodeAction
{
    /**
     * Build the asset code from the deepest selected classification level.
     *
     * The base is the selected level's own code (which already carries the
     * parent path, e.g. "01.01.01"), and a per-level sequence is appended so
     * every asset under the same selection stays unique:
     *
     *   golongan only  -> 01.001
     *   up to kategori -> 01.01.001
     *   full chain     -> 01.01.01.01.001
     *
     * @return string|null null when no classification level is selected
     */
    public function execute(
        ?string $code,
        ?string $levelField,
        ?string $levelId,
        ?string $exceptAssetId = null,
        int $padding = 3,
    ): ?string {
        if ($code === null || $code === '' || $levelField === null || $levelId === null) {
            return null;
        }

        $sequence = $this->nextSequence($levelField, $levelId, $exceptAssetId);

        return $code.'.'.str_pad((string) $sequence, $padding, '0', STR_PAD_LEFT);
    }

    /**
     * Resolve the deepest selected classification level and build the code.
     *
     * @return array{code: string|null, asset_group_id: string|null, asset_category_id: string|null, asset_cluster_id: string|null, asset_sub_cluster_id: string|null}
     */
    public function fromIds(
        ?string $groupId,
        ?string $categoryId,
        ?string $clusterId,
        ?string $subClusterId,
        ?string $exceptAssetId = null,
    ): array {
        [$model, $field, $id] = $this->resolveDeepest($groupId, $categoryId, $clusterId, $subClusterId);

        return [
            'code' => $this->execute($model?->code, $field, $id, $exceptAssetId),
            'asset_group_id' => $groupId,
            'asset_category_id' => $categoryId,
            'asset_cluster_id' => $clusterId,
            'asset_sub_cluster_id' => $subClusterId,
        ];
    }

    /**
     * @return array{AssetGroup|AssetCategory|AssetCluster|AssetSubCluster|null, string|null, string|null}
     */
    private function resolveDeepest(
        ?string $groupId,
        ?string $categoryId,
        ?string $clusterId,
        ?string $subClusterId,
    ): array {
        if ($subClusterId !== null && $subClusterId !== '') {
            return [AssetSubCluster::find($subClusterId), 'asset_sub_cluster_id', $subClusterId];
        }

        if ($clusterId !== null && $clusterId !== '') {
            return [AssetCluster::find($clusterId), 'asset_cluster_id', $clusterId];
        }

        if ($categoryId !== null && $categoryId !== '') {
            return [AssetCategory::find($categoryId), 'asset_category_id', $categoryId];
        }

        if ($groupId !== null && $groupId !== '') {
            return [AssetGroup::find($groupId), 'asset_group_id', $groupId];
        }

        return [null, null, null];
    }

    private function nextSequence(string $levelField, string $levelId, ?string $exceptAssetId): int
    {
        $query = Asset::query()->where($levelField, $levelId);

        foreach ($this->deeperFields($levelField) as $field) {
            $query->whereNull($field);
        }

        if ($exceptAssetId !== null) {
            $query->whereKeyNot($exceptAssetId);
        }

        return $query->count() + 1;
    }

    /** @return array<int, string> */
    private function deeperFields(string $levelField): array
    {
        return match ($levelField) {
            'asset_group_id' => ['asset_category_id', 'asset_cluster_id', 'asset_sub_cluster_id'],
            'asset_category_id' => ['asset_cluster_id', 'asset_sub_cluster_id'],
            'asset_cluster_id' => ['asset_sub_cluster_id'],
            default => [],
        };
    }
}
