<?php

namespace App\Services;

use App\Models\Asset;
use App\Models\CapitalizationThreshold;

class AssetTypeAssigner
{
    public function assign(Asset $asset, ?float $thresholdAmount = null): Asset
    {
        if ($asset->type_override_reason) {
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

        $amount = (float) ($thresholdAmount ?? $threshold?->amount);

        $asset->asset_type = (float) $asset->acquisition_cost >= $amount
            ? 'fixed_asset'
            : 'equipment';
        $asset->capitalization_threshold_id = $threshold?->id;

        return $asset;
    }

    public function manualOverride(Asset $asset, string $type, string $reason): Asset
    {
        $asset->asset_type = $type;
        $asset->type_override_reason = $reason;

        return $asset;
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
