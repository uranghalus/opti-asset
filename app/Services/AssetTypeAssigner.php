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

            return $asset;
        }

        $threshold = $thresholdAmount ?? CapitalizationThreshold::query()
            ->where('is_active', true)
            ->value('amount');

        if ($threshold === null) {
            $asset->asset_type = 'equipment';

            return $asset;
        }

        $asset->asset_type = (float) $asset->acquisition_cost >= (float) $threshold
            ? 'fixed_asset'
            : 'equipment';

        return $asset;
    }

    public function manualOverride(Asset $asset, string $type, string $reason): Asset
    {
        $asset->asset_type = $type;
        $asset->type_override_reason = $reason;

        return $asset;
    }
}