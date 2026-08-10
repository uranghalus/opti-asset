<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Database\Factories\AssetFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property string $id
 * @property string $tenant_id
 * @property string|null $item_id
 * @property string|null $condition
 * @property Carbon|null $purchase_date
 * @property string|null $purchase_price
 * @property Carbon|null $in_come_date
 * @property Carbon|null $broken_date
 * @property Carbon|null $warranty_expire
 * @property string|null $location_id
 * @property string|null $department_id
 * @property string|null $assigned_user_id
 * @property string $assigned_status
 * @property string|null $brand
 * @property string|null $model
 * @property string|null $part_number
 * @property string|null $serial_number
 * @property string|null $no_spb
 * @property string|null $document_number
 * @property array<int, string>|null $pic
 * @property string|null $notes
 * @property array<int, string>|null $photo_url
 * @property array<int, string>|null $document_url
 * @property string|null $kode_asset
 * @property Carbon|null $garansi_exp
 * @property string $status
 * @property string|null $vendor_name
 * @property string|null $asset_group_id
 * @property string|null $asset_category_id
 * @property string|null $asset_cluster_id
 * @property string|null $asset_sub_cluster_id
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
class Asset extends Model
{
    /** @use HasFactory<AssetFactory> */
    use BelongsToTenant, HasFactory, HasUuids;

    protected $fillable = [
        'item_id',
        'condition',
        'purchase_date',
        'purchase_price',
        'in_come_date',
        'broken_date',
        'warranty_expire',
        'location_id',
        'department_id',
        'assigned_user_id',
        'assigned_status',
        'brand',
        'model',
        'part_number',
        'serial_number',
        'no_spb',
        'document_number',
        'pic',
        'notes',
        'photo_url',
        'document_url',
        'kode_asset',
        'garansi_exp',
        'status',
        'vendor_name',
        'asset_group_id',
        'asset_category_id',
        'asset_cluster_id',
        'asset_sub_cluster_id',
    ];

    protected function casts(): array
    {
        return [
            'purchase_date' => 'datetime',
            'purchase_price' => 'decimal:2',
            'in_come_date' => 'datetime',
            'broken_date' => 'datetime',
            'warranty_expire' => 'datetime',
            'garansi_exp' => 'datetime',
            'photo_url' => 'array',
            'document_url' => 'array',
            'pic' => 'array',
        ];
    }

    /** @return BelongsTo<Item, $this> */
    public function item(): BelongsTo
    {
        return $this->belongsTo(Item::class, 'item_id');
    }

    /** @return BelongsTo<Location, $this> */
    public function location(): BelongsTo
    {
        return $this->belongsTo(Location::class, 'location_id');
    }

    /** @return BelongsTo<Department, $this> */
    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class, 'department_id', 'id_department');
    }

    /** @return BelongsTo<AssetGroup, $this> */
    public function assetGroup(): BelongsTo
    {
        return $this->belongsTo(AssetGroup::class, 'asset_group_id');
    }

    /** @return BelongsTo<AssetCategory, $this> */
    public function assetCategory(): BelongsTo
    {
        return $this->belongsTo(AssetCategory::class, 'asset_category_id');
    }

    /** @return BelongsTo<AssetCluster, $this> */
    public function assetCluster(): BelongsTo
    {
        return $this->belongsTo(AssetCluster::class, 'asset_cluster_id');
    }

    /** @return BelongsTo<AssetSubCluster, $this> */
    public function assetSubCluster(): BelongsTo
    {
        return $this->belongsTo(AssetSubCluster::class, 'asset_sub_cluster_id');
    }

    /** @return BelongsTo<Tenant, $this> */
    public function organization(): BelongsTo
    {
        return $this->belongsTo(Tenant::class, 'tenant_id');
    }
}
