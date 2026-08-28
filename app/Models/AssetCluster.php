<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use App\Models\Concerns\FlushesClassificationCache;
use Database\Factories\AssetClusterFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * @property string $id
 * @property string $tenant_id
 * @property string $asset_category_id
 * @property string|null $code
 * @property string $name
 * @property int $sort_order
 * @property string|null $description
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
class AssetCluster extends Model
{
    /** @use HasFactory<AssetClusterFactory> */
    use BelongsToTenant, FlushesClassificationCache, HasFactory, HasUuids;

    protected $fillable = [
        'asset_category_id',
        'code',
        'name',
        'sort_order',
        'description',
    ];

    /** @return BelongsTo<AssetCategory, $this> */
    public function assetCategory(): BelongsTo
    {
        return $this->belongsTo(AssetCategory::class);
    }

    /** @return HasMany<AssetSubCluster, $this> */
    public function subClusters(): HasMany
    {
        return $this->hasMany(AssetSubCluster::class);
    }

    /** @return HasMany<Asset, $this> */
    public function assets(): HasMany
    {
        return $this->hasMany(Asset::class, 'asset_cluster_id');
    }
}
