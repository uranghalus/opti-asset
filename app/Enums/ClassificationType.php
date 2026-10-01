<?php

namespace App\Enums;

enum ClassificationType: string
{
    case PERALATAN = 'peralatan';
    case AKTIVA_TETAP = 'aktiva_tetap';

    /**
     * The single mapping point between the classification type dimension and
     * the legacy asset_type column. No other mapping may exist elsewhere.
     */
    public function toAssetType(): string
    {
        return match ($this) {
            self::PERALATAN => 'equipment',
            self::AKTIVA_TETAP => 'fixed_asset',
        };
    }

    public function label(): string
    {
        return match ($this) {
            self::PERALATAN => 'Peralatan',
            self::AKTIVA_TETAP => 'Aktiva Tetap',
        };
    }
}
