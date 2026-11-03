<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Database\Factories\DivisionFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Division extends Model
{
    /** @use HasFactory<DivisionFactory> */
    use BelongsToTenant, HasFactory, HasUuids;

    protected $table = 'tb_division';

    protected $primaryKey = 'id_division';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'id_division',
        'tenant_id',
        'optigate_division_id',
        'kode_division',
        'nama_division',
        'is_active',
        'deactivated_at',
    ];

    protected $guarded = [];

    /** @return HasMany<Employee, $this> */
    public function employees(): HasMany
    {
        return $this->hasMany(Employee::class, 'division_id', 'id_division');
    }

    /** @return BelongsTo<Tenant, $this> */
    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }
}
