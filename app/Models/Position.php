<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Database\Factories\PositionFactory;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Position extends Model
{
    /** @use HasFactory<PositionFactory> */
    use BelongsToTenant, HasFactory, HasUuids;

    protected $table = 'tb_position';

    protected $primaryKey = 'id_position';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'id_position',
        'tenant_id',
        'optigate_position_id',
        'department_id',
        'division_id',
        'kode_position',
        'nama_position',
        'is_active',
        'deactivated_at',
    ];

    protected $guarded = [];

    /** @return HasMany<Employee, $this> */
    public function employees(): HasMany
    {
        return $this->hasMany(Employee::class, 'id_position', 'id_position');
    }

    /** @return BelongsTo<Department, $this> */
    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class, 'department_id', 'id_department');
    }

    /** @return BelongsTo<Division, $this> */
    public function division(): BelongsTo
    {
        return $this->belongsTo(Division::class, 'division_id', 'id_division');
    }

    /** @return BelongsTo<Tenant, $this> */
    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }
}
