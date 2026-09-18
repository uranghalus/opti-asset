<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use App\Models\Concerns\FlushesClassificationCache;
use Database\Factories\AssetCategoryFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * @property string $id
 * @property string $tenant_id
 * @property string $asset_group_id
 * @property string|null $code
 * @property string $name
 * @property int $sort_order
 * @property string|null $description
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
class AssetCategory extends Model
{
    /** @use HasFactory<AssetCategoryFactory> */
    use BelongsToTenant, FlushesClassificationCache, HasFactory, HasUuids;

    protected $fillable = [
        'asset_group_id',
        'code',
        'name',
        'sort_order',
        'description',
    ];

    /** @return BelongsTo<AssetGroup, $this> */
    public function assetGroup(): BelongsTo
    {
        return $this->belongsTo(AssetGroup::class);
    }

    /** @return HasMany<AssetCluster, $this> */
    public function clusters(): HasMany
    {
        return $this->hasMany(AssetCluster::class);
    }

    /** @return HasMany<Asset, $this> */
    public function assets(): HasMany
    {
        return $this->hasMany(Asset::class, 'asset_category_id');
    }
}
