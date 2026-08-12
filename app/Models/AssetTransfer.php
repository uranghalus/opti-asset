<?php

namespace App\Models;

use App\Enums\AssetTransferStatus;
use App\Models\Concerns\BelongsToTenant;
use Database\Factories\AssetTransferFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property string $id
 * @property string $tenant_id
 * @property string $asset_id
 * @property string|null $from_location_id
 * @property string|null $to_location_id
 * @property string|null $from_department_id
 * @property string|null $to_department_id
 * @property string|null $from_user_id
 * @property string|null $to_user_id
 * @property int $quantity
 * @property AssetTransferStatus $status
 * @property string|null $notes
 * @property string|null $requested_by
 * @property string|null $approved_by
 * @property Carbon|null $approved_at
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
class AssetTransfer extends Model
{
    /** @use HasFactory<AssetTransferFactory> */
    use BelongsToTenant, HasFactory, HasUuids;

    protected $fillable = [
        'asset_id',
        'from_location_id',
        'to_location_id',
        'from_department_id',
        'to_department_id',
        'from_user_id',
        'to_user_id',
        'quantity',
        'status',
        'notes',
        'requested_by',
        'approved_by',
        'approved_at',
    ];

    protected function casts(): array
    {
        return [
            'status' => AssetTransferStatus::class,
            'approved_at' => 'datetime',
            'quantity' => 'integer',
        ];
    }

    /** @return BelongsTo<Asset, $this> */
    public function asset(): BelongsTo
    {
        return $this->belongsTo(Asset::class, 'asset_id');
    }

    /** @return BelongsTo<Location, $this> */
    public function fromLocation(): BelongsTo
    {
        return $this->belongsTo(Location::class, 'from_location_id');
    }

    /** @return BelongsTo<Location, $this> */
    public function toLocation(): BelongsTo
    {
        return $this->belongsTo(Location::class, 'to_location_id');
    }

    /** @return BelongsTo<User, $this> */
    public function requester(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requested_by');
    }

    /** @return BelongsTo<User, $this> */
    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }
}
