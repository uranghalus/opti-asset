<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Database\Factories\LocationFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property string $id
 * @property string $tenant_id
 * @property string $name
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
class Location extends Model
{
    /** @use HasFactory<LocationFactory> */
    use BelongsToTenant, HasFactory, HasUuids;

    protected $fillable = [
        'name',
    ];

    /** @return BelongsTo<Tenant, $this> */
    public function organization(): BelongsTo
    {
        return $this->belongsTo(Tenant::class, 'tenant_id');
    }
}
