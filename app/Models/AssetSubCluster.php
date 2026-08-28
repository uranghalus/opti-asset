<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use App\Models\Concerns\FlushesClassificationCache;
use Database\Factories\AssetSubClusterFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property string $id
 * @property string $tenant_id
 * @property string $asset_cluster_id
 * @property string|null $code
 * @property string $name
 * @property int $sort_order
 * @property string|null $description
 * @property string|null $notes
 * @property string $type
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
class AssetSubCluster extends Model
{
    /** @use HasFactory<AssetSubClusterFactory> */
    use BelongsToTenant, FlushesClassificationCache, HasFactory, HasUuids;

    protected $fillable = [
        'asset_cluster_id',
        'code',
        'name',
        'sort_order',
        'description',
        'notes',
        'type',
    ];

    /** @return BelongsTo<AssetCluster, $this> */
    public function assetCluster(): BelongsTo
    {
        return $this->belongsTo(AssetCluster::class);
    }

    /** @return HasMany<Asset, $this> */
    public function assets(): HasMany
    {
        return $this->hasMany(Asset::class, 'asset_sub_cluster_id');
    }
}
