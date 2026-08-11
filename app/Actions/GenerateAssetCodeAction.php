<?php

namespace App\Actions;

use App\Models\Asset;
use App\Models\Category;

class GenerateAssetCodeAction
{
    /**
     * Build the asset code from the item's category.
     *
     * The base code is the category's stored code (the joined segment
     * codes of the whole classification chain, e.g. "01.01.01.01"), and a
     * per category sequence is appended so every category numbers its
     * assets independently:
     *
     *   category code "01.01.01.01" -> 01.01.01.01.001
     *
     * The next sequence continues from the highest number already used for
     * the same base code, so deleting an asset never reuses a number.
     *
     * @return array{kode_asset: string|null, asset_group_id: string|null, asset_category_id: string|null, asset_cluster_id: string|null, asset_sub_cluster_id: string|null}
     */
    public function fromCategory(Category $category, ?string $exceptAssetId = null): array
    {
        $chain = Category::chainFor($category->classification_type, $category->classification_id);

        $nodeAt = static fn (int $index): ?string => $chain[$index]['id'] ?? null;

        return [
            'kode_asset' => $category->code === null ? null : $this->withSequence($category->code, $exceptAssetId),
            'asset_group_id' => $nodeAt(0),
            'asset_category_id' => $nodeAt(1),
            'asset_cluster_id' => $nodeAt(2),
            'asset_sub_cluster_id' => $nodeAt(3),
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
