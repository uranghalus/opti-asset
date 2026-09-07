<?php

namespace App\Observers;

use App\Models\Asset;
use App\Models\AssetBookValue;
use App\Services\AssetTypeAssigner;

class AssetObserver
{
    public function __construct(private readonly AssetTypeAssigner $assigner)
    {
    }

    public function created(Asset $asset): void
    {
        $this->assigner->assign($asset);
        $asset->save();

        if ($asset->asset_type === 'fixed_asset') {
            $this->snapshotBookValue($asset);
        }
    }

    public function updated(Asset $asset): void
    {
        $this->assigner->assign($asset);
        $asset->save();

        if ($asset->asset_type === 'fixed_asset') {
            $this->snapshotBookValue($asset);
        }
    }

    private function snapshotBookValue(Asset $asset): void
    {
        $bookValue = $asset->book_value;

        if ($bookValue === null) {
            return;
        }

        $existing = AssetBookValue::query()
            ->where('asset_id', $asset->id)
            ->where('period_ends_at', today())
            ->exists();

        if (! $existing) {
            AssetBookValue::create([
                'asset_id' => $asset->id,
                'period_ends_at' => today(),
                'book_value' => $bookValue,
                'accumulated_depreciation' => $asset->accumulated_depreciation,
                'recorded_by' => $asset->created_by ?? null,
            ]);
        }
    }
}