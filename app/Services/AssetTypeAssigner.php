<?php

namespace App\Services;

use App\Enums\ClassificationType;
use App\Models\Asset;
use App\Models\AssetGroup;
use App\Models\CapitalizationThreshold;

class AssetTypeAssigner
{
    public function assign(Asset $asset, ?float $thresholdAmount = null): Asset
    {
        if ($asset->type_override_reason) {
            return $asset;
        }

        // Classification-driven: an asset with a classification chain inherits
        // the chain root's type (single mapping point:
        // ClassificationType::toAssetType). Capitalization thresholds only
        // apply to unclassified assets.
        $chainType = $this->classificationChainType($asset);

        if ($chainType !== null) {
            $asset->asset_type = $chainType->toAssetType();

            return $asset;
        }

        if (! $asset->acquisition_cost) {
            $asset->asset_type = 'equipment';
            $asset->capitalization_threshold_id = null;

            return $asset;
        }

        $threshold = $thresholdAmount !== null
            ? null
            : CapitalizationThreshold::query()
                ->where('is_active', true)
                ->first();

        if ($thresholdAmount === null && $threshold === null) {
            $asset->asset_type = 'equipment';
            $asset->capitalization_threshold_id = null;

            return $asset;
        }

        $amount = (float) ($thresholdAmount ?? $threshold->amount);

        $asset->asset_type = ((float) $asset->acquisition_cost >= $amount
            ? ClassificationType::AKTIVA_TETAP
            : ClassificationType::PERALATAN)->toAssetType();
        $asset->capitalization_threshold_id = $threshold?->id;

        return $asset;
    }

    /**
     * The classification type of the asset's chain root, or null when the
     * asset has no classification (or the root group is still untyped).
     */
    private function classificationChainType(Asset $asset): ?ClassificationType
    {
        if ($asset->asset_group_id === null) {
            return null;
        }

        return AssetGroup::query()->find($asset->asset_group_id)?->classification_type;
    }

    /**
     * FR-13.11 — hitung ulang tipe aset untuk semua aset yang tidak
     * di-override manual. Mengembalikan jumlah aset yang berubah.
     */
    public function reassignAll(): int
    {
        $changed = 0;

        Asset::query()
            ->where(function ($query): void {
                $query->whereNull('type_override_reason')
                    ->orWhere('type_override_reason', '');
            })
            ->chunkById(200, function ($assets) use (&$changed): void {
                foreach ($assets as $asset) {
                    $previousType = $asset->asset_type;

                    $this->assign($asset);

                    if ($asset->isDirty()) {
                        $asset->saveQuietly();
                    }

                    if ($asset->asset_type !== $previousType) {
                        $changed++;
                    }
                }
            });

        return $changed;
    }
}
