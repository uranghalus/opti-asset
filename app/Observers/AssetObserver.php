<?php

namespace App\Observers;

use App\Models\Asset;
use App\Models\AssetBookValue;
use App\Services\AssetTypeAssigner;
use App\Services\DepreciationCalculator;

class AssetObserver
{
    public function __construct(
        private readonly AssetTypeAssigner $assigner,
        private readonly DepreciationCalculator $depreciation,
    ) {}

    public function created(Asset $asset): void
    {
        $this->assigner->assign($asset);
        $this->applyDepreciation($asset);

        if ($asset->isDirty()) {
            $asset->saveQuietly();
        }

        $this->snapshotBookValue($asset);
    }

    public function updated(Asset $asset): void
    {
        $this->assigner->assign($asset);
        $this->applyDepreciation($asset);

        if ($asset->isDirty()) {
            $asset->saveQuietly();
        }

        $this->snapshotBookValue($asset);
    }

    /**
     * FR-13.5 — akumulasi penyusutan dihitung otomatis dari metode,
     * masa manfaat, dan lama pelayanan untuk aset bertipe Aktiva Tetap.
     * Metode 'none'/kosong dilewati agar data penyusutan legacy (input
     * manual atau hasil migrasi) tidak terhapus.
     */
    private function applyDepreciation(Asset $asset): void
    {
        if ($asset->asset_type !== 'fixed_asset') {
            return;
        }

        $method = $asset->depreciation_method;

        if ($method !== 'straight_line' && $method !== 'declining_balance') {
            return;
        }

        $computed = $this->depreciation->compute($asset);

        if ((string) $asset->accumulated_depreciation !== $computed) {
            $asset->accumulated_depreciation = $computed;
        }
    }

    /**
     * FR-13.10 — snapshot nilai buku per periode (bulanan).
     * Satu baris per (aset, bulan); simpanan pertama bulan berjalan yang menang.
     */
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
            ->whereYear('period_ends_at', today()->year)
            ->whereMonth('period_ends_at', today()->month)
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
