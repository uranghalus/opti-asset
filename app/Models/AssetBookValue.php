<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $asset_id
 * @property \Illuminate\Support\Carbon $period_ends_at
 * @property string $book_value
 * @property string $accumulated_depreciation
 * @property string|null $notes
 * @property int $recorded_by
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 */
class AssetBookValue extends Model
{
    protected $fillable = [
        'asset_id',
        'period_ends_at',
        'book_value',
        'accumulated_depreciation',
        'notes',
        'recorded_by',
    ];

    protected function casts(): array
    {
        return [
            'period_ends_at' => 'date',
            'book_value' => 'decimal:2',
            'accumulated_depreciation' => 'decimal:2',
        ];
    }

    /** @return BelongsTo<Asset, $this> */
    public function asset(): BelongsTo
    {
        return $this->belongsTo(Asset::class, 'asset_id');
    }

    /** @return BelongsTo<User, $this> */
    public function recorder(): BelongsTo
    {
        return $this->belongsTo(User::class, 'recorded_by');
    }
}