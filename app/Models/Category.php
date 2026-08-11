<?php

namespace App\Models;

use App\Enums\ClassificationLevel;
use App\Models\Concerns\BelongsToTenant;
use Database\Factories\CategoryFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * @property string $id
 * @property string $tenant_id
 * @property string $name
 * @property string|null $code
 * @property string|null $classification_id
 * @property ClassificationLevel|null $classification_type
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
class Category extends Model
{
    /** @use HasFactory<CategoryFactory> */
    use BelongsToTenant, HasFactory, HasUuids;

    protected $fillable = [
        'name',
        'code',
        'classification_id',
        'classification_type',
    ];

    protected function casts(): array
    {
        return [
            'classification_type' => ClassificationLevel::class,
        ];
    }

    /** @return HasMany<Item, $this> */
    public function items(): HasMany
    {
        return $this->hasMany(Item::class, 'category_id');
    }

    /** @return BelongsTo<Tenant, $this> */
    public function organization(): BelongsTo
    {
        return $this->belongsTo(Tenant::class, 'tenant_id');
    }
}
