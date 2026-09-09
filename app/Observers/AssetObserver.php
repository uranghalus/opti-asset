<?php

namespace App\Observers;

use App\Models\Asset;
use App\Models\AssetBookValue;
use App\Services\AssetTypeAssigner;

class AssetObserver
{
    public function __construct(private readonly AssetTypeAssigner $assigner) {}

    public function created(Asset $asset): void
    {
        $this->assigner->assign($asset);

        if ($asset->isDirty()) {
            $asset->saveQuietly();
        }

        $this->snapshotBookValue($asset);
    }

    public function updated(Asset $asset): void
    {
        $this->assigner->assign($asset);

        if ($asset->isDirty()) {
            $asset->saveQuietly();
        }

        $this->snapshotBookValue($asset);
    }

    private function snapshotBookValue(Asset $asset): void
    {
        if ($asset->asset_type !== 'fixed_asset') {
            return;
        }

        $bookValue = $asset->book_value;

        if ($bookValue === null) {
            return;
        }

        $existing = AssetBookValue::query()
            ->where('asset_id', $asset->id)
            ->where('period_ends_at', today())
            ->exists();

        if ($existing) {
            return;
        }

        AssetBookValue::create([
            'asset_id' => $asset->id,
            'period_ends_at' => today(),
            'book_value' => $bookValue,
            'accumulated_depreciation' => $asset->accumulated_depreciation ?? '0',
            'recorded_by' => auth()->id(),
        ]);
    }
}
