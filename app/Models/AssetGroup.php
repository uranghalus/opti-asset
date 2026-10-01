<?php

namespace App\Models;

use App\Enums\ClassificationType;
use App\Models\Concerns\BelongsToTenant;
use App\Models\Concerns\FlushesClassificationCache;
use Database\Factories\AssetGroupFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * @property string $id
 * @property string $tenant_id
 * @property string|null $code
 * @property string $name
 * @property int $sort_order
 * @property string|null $description
 * @property ClassificationType|null $classification_type
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
class AssetGroup extends Model
{
    /** @use HasFactory<AssetGroupFactory> */
    use BelongsToTenant, FlushesClassificationCache, HasFactory, HasUuids;

    protected $fillable = [
        'code',
        'name',
        'sort_order',
        'description',
        'classification_type',
    ];

    protected function casts(): array
    {
        return [
            'classification_type' => ClassificationType::class,
        ];
    }

    /** @return HasMany<AssetCategory, $this> */
    public function categories(): HasMany
    {
        return $this->hasMany(AssetCategory::class);
    }

    /** @return HasMany<Asset, $this> */
    public function assets(): HasMany
    {
        return $this->hasMany(Asset::class, 'asset_group_id');
    }
}
