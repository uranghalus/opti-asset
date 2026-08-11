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
     * Build the asset code from the selected classification chain.
     *
     * The base is the joined segment codes of every selected level (e.g.
     * group "01" + category "01" + cluster "01" => "01.01.01"), and a per
     * combination sequence is appended so each classification combination
     * numbers its assets independently:
     *
     *   golongan only  -> 01.001
     *   up to kategori -> 01.01.001
     *   up to cluster  -> 01.01.01.001
     *   full chain     -> 01.01.01.01.001
     *
     * The next sequence continues from the highest number already used for
     * the same base code, so deleting an asset never reuses a number.
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
        $baseCode = $this->chainCode($groupId, $categoryId, $clusterId, $subClusterId);

        return [
            'code' => $baseCode === null ? null : $this->withSequence($baseCode, $exceptAssetId),
            'asset_group_id' => $groupId,
            'asset_category_id' => $categoryId,
            'asset_cluster_id' => $clusterId,
            'asset_sub_cluster_id' => $subClusterId,
        ];
    }

    /**
     * Map of base code => next sequence number for every combination that
     * already has assets. Used by the frontend to preview the full code.
     *
     * @return array<string, int>
     */
    public function nextSequenceMap(?string $exceptAssetId = null): array
    {
        $query = Asset::query()->whereNotNull('kode_asset');

        if ($exceptAssetId !== null) {
            $query->whereKeyNot($exceptAssetId);
        }

        $maxByBase = [];

        foreach ($query->pluck('kode_asset') as $kode) {
            $lastDot = strrpos((string) $kode, '.');

            if ($lastDot === false) {
                continue;
            }

            $base = substr((string) $kode, 0, $lastDot);
            $sequence = (int) substr((string) $kode, $lastDot + 1);

            $maxByBase[$base] = max($maxByBase[$base] ?? 0, $sequence);
        }

        return array_map(static fn (int $max): int => $max + 1, $maxByBase);
    }

    /**
     * Join the segment codes of every selected level down to the deepest one,
     * e.g. group "01" + category "01" + cluster "01" => "01.01.01".
     */
    private function chainCode(
        ?string $groupId,
        ?string $categoryId,
        ?string $clusterId,
        ?string $subClusterId,
    ): ?string {
        $segments = array_values(array_filter([
            $groupId !== null && $groupId !== '' ? AssetGroup::find($groupId)?->code : null,
            $categoryId !== null && $categoryId !== '' ? AssetCategory::find($categoryId)?->code : null,
            $clusterId !== null && $clusterId !== '' ? AssetCluster::find($clusterId)?->code : null,
            $subClusterId !== null && $subClusterId !== '' ? AssetSubCluster::find($subClusterId)?->code : null,
        ], static fn (?string $code): bool => $code !== null && $code !== ''));

        return $segments === [] ? null : implode('.', $segments);
    }

    private function withSequence(string $baseCode, ?string $exceptAssetId, int $padding = 3): string
    {
        return $baseCode.'.'.str_pad((string) $this->nextSequence($baseCode, $exceptAssetId), $padding, '0', STR_PAD_LEFT);
    }

    private function nextSequence(string $baseCode, ?string $exceptAssetId): int
    {
        $query = Asset::query()
            ->where('kode_asset', 'like', $baseCode.'.%');

        if ($exceptAssetId !== null) {
            $query->whereKeyNot($exceptAssetId);
        }

        $max = $query->pluck('kode_asset')
            ->map(fn (?string $kode): ?int => $this->extractSequence($baseCode, $kode))
            ->filter()
            ->max();

        return ($max ?? 0) + 1;
    }

    private function extractSequence(string $baseCode, ?string $kode): ?int
    {
        if ($kode === null) {
            return null;
        }

        $prefix = $baseCode.'.';

        if (! str_starts_with($kode, $prefix)) {
            return null;
        }

        $suffix = substr($kode, strlen($prefix));

        if ($suffix === '' || ! ctype_digit($suffix)) {
            return null;
        }

        return (int) $suffix;
    }
}
