<?php

namespace App\Actions;

use App\Models\Asset;
use App\Models\AssetCategory;
use App\Models\AssetCluster;
use App\Models\AssetGroup;
use App\Models\AssetSubCluster;
use Illuminate\Support\Str;

class GenerateAssetCodeAction
{
    /**
     * Build the asset code from the classification chain: golongan.kategori.cluster.subcluster.urutan.
     *
     * Each classification code may already carry its parent path (e.g. "01.01.01"),
     * so only the last segment of each level is used. The trailing sequence is the
     * next number of assets already registered in the sub cluster.
     *
     * @return string|null null when any required level is missing a code
     */
    public function execute(
        ?string $groupCode,
        ?string $categoryCode,
        ?string $clusterCode,
        ?string $subClusterCode,
        ?string $subClusterId = null,
        ?string $exceptAssetId = null,
        int $padding = 3,
    ): ?string {
        $segments = array_map(
            static fn (?string $code): ?string => $code !== null && $code !== ''
                ? Str::afterLast($code, '.')
                : null,
            [$groupCode, $categoryCode, $clusterCode, $subClusterCode],
        );

        $segments = array_filter($segments, static fn (?string $code): bool => $code !== null && $code !== '');

        if (count($segments) !== 4) {
            return null;
        }

        $sequence = $this->nextSequence($subClusterId, $exceptAssetId);

        return implode('.', [...$segments, str_pad((string) $sequence, $padding, '0', STR_PAD_LEFT)]);
    }

    /**
     * Resolve the chain from the classification ids and build the asset code.
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
        if (! $groupId || ! $categoryId || ! $clusterId || ! $subClusterId) {
            return [
                'code' => null,
                'asset_group_id' => $groupId,
                'asset_category_id' => $categoryId,
                'asset_cluster_id' => $clusterId,
                'asset_sub_cluster_id' => $subClusterId,
            ];
        }

        $group = AssetGroup::find($groupId);
        $category = AssetCategory::find($categoryId);
        $cluster = AssetCluster::find($clusterId);
        $subCluster = AssetSubCluster::find($subClusterId);

        return [
            'code' => $this->execute(
                $group?->code,
                $category?->code,
                $cluster?->code,
                $subCluster?->code,
                $subClusterId,
                $exceptAssetId,
            ),
            'asset_group_id' => $groupId,
            'asset_category_id' => $categoryId,
            'asset_cluster_id' => $clusterId,
            'asset_sub_cluster_id' => $subClusterId,
        ];
    }

    private function nextSequence(?string $subClusterId, ?string $exceptAssetId): int
    {
        if (! $subClusterId) {
            return 1;
        }

        $count = Asset::query()
            ->where('asset_sub_cluster_id', $subClusterId)
            ->when($exceptAssetId, fn ($query, string $id) => $query->whereKeyNot($id))
            ->count();

        return $count + 1;
    }
}
