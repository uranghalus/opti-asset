<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Database\Factories\AssetHistoryFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property string $id
 * @property string $tenant_id
 * @property string $asset_id
 * @property string $field
 * @property string|null $old_value
 * @property string|null $new_value
 * @property string|null $changed_by
 * @property string|null $changed_by_name
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
class AssetHistory extends Model
{
    /** @use HasFactory<AssetHistoryFactory> */
    use BelongsToTenant, HasFactory, HasUuids;

    protected $fillable = [
        'asset_id',
        'field',
        'old_value',
        'new_value',
        'changed_by',
        'changed_by_name',
    ];

    /** @return BelongsTo<Asset, $this> */
    public function asset(): BelongsTo
    {
        return $this->belongsTo(Asset::class, 'asset_id');
    }
}
