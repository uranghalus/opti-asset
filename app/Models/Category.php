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

    /**
     * Resolve the classification chain from the deepest node up to the
     * root. Each entry carries the level, id, code and name of the node.
     *
     * @return array<int, array{level: string, id: string, code: string|null, name: string}>
     */
    public static function chainFor(?ClassificationLevel $level, ?string $id): array
    {
        if ($level === null || $id === null) {
            return [];
        }

        return match ($level) {
            ClassificationLevel::GROUP => self::groupChain(AssetGroup::find($id)),
            ClassificationLevel::CATEGORY => self::categoryChain(AssetCategory::with('assetGroup')->find($id)),
            ClassificationLevel::CLUSTER => self::clusterChain(AssetCluster::with('assetCategory.assetGroup')->find($id)),
            ClassificationLevel::SUBCLUSTER => self::subClusterChain(AssetSubCluster::with('assetCluster.assetCategory.assetGroup')->find($id)),
        };
    }

    /**
     * @return array<int, array{level: string, id: string, code: string|null, name: string}>
     */
    private static function groupChain(?AssetGroup $group): array
    {
        if (! $group) {
            return [];
        }

        return [[
            'level' => ClassificationLevel::GROUP->value,
            'id' => $group->id,
            'code' => $group->code,
            'name' => $group->name,
        ]];
    }

    /**
     * @return array<int, array{level: string, id: string, code: string|null, name: string}>
     */
    private static function categoryChain(?AssetCategory $category): array
    {
        if (! $category) {
            return [];
        }

        return [
            ...self::groupChain($category->assetGroup),
            [
                'level' => ClassificationLevel::CATEGORY->value,
                'id' => $category->id,
                'code' => $category->code,
                'name' => $category->name,
            ],
        ];
    }

    /**
     * @return array<int, array{level: string, id: string, code: string|null, name: string}>
     */
    private static function clusterChain(?AssetCluster $cluster): array
    {
        if (! $cluster) {
            return [];
        }

        return [
            ...self::categoryChain($cluster->assetCategory),
            [
                'level' => ClassificationLevel::CLUSTER->value,
                'id' => $cluster->id,
                'code' => $cluster->code,
                'name' => $cluster->name,
            ],
        ];
    }

    /**
     * @return array<int, array{level: string, id: string, code: string|null, name: string}>
     */
    private static function subClusterChain(?AssetSubCluster $subCluster): array
    {
        if (! $subCluster) {
            return [];
        }

        return [
            ...self::clusterChain($subCluster->assetCluster),
            [
                'level' => ClassificationLevel::SUBCLUSTER->value,
                'id' => $subCluster->id,
                'code' => $subCluster->code,
                'name' => $subCluster->name,
            ],
        ];
    }
}
