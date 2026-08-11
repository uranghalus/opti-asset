<?php

namespace App\Enums;

enum AssetStatus: string
{
    case ACTIVE = 'ACT';
    case LOANED = 'LOAN';
    case REPAIR = 'RPR';
    case MUTATED = 'MUT';
    case DISPOSED = 'DSP';

    public function label(): string
    {
        return match ($this) {
            self::ACTIVE => 'Aktif',
            self::LOANED => 'Dipinjamkan',
            self::REPAIR => 'Dalam Perbaikan',
            self::MUTATED => 'Dimutasi',
            self::DISPOSED => 'Dihapus',
        };
    }
}
