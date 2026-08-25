<?php

namespace App\Models;

use App\Enums\AssetDisposalStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AssetDisposal extends Model
{
    use HasFactory;

    protected $fillable = [
        'asset_id',
        'reason',
        'disposal_date',
        'disposed_by',
        'status',
    ];

    protected $casts = [
        'disposal_date' => 'date',
        'status' => AssetDisposalStatus::class,
    ];

    public function asset(): BelongsTo
    {
        return $this->belongsTo(Asset::class);
    }

    public function disposedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'disposed_by');
    }
}
