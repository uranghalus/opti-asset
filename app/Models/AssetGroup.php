<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
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
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
class AssetGroup extends Model
{
    /** @use HasFactory<AssetGroupFactory> */
    use BelongsToTenant, HasFactory, HasUuids;

    protected $fillable = [
        'code',
        'name',
        'sort_order',
        'description',
    ];

    /** @return HasMany<AssetCategory, $this> */
    public function categories(): HasMany
    {
        return $this->hasMany(AssetCategory::class);
    }
}
