<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Department extends Model
{
    use BelongsToTenant, HasFactory, HasUuids;

    protected $table = 'tb_department';

    protected $primaryKey = 'id_department';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'tenant_id',
        'kode_department',
        'nama_department',
        'hod_user_id',
        'manager_user_id',
    ];

    protected $guarded = [
        'id_department',
    ];

    /** @return HasMany<Employee, $this> */
    public function employees(): HasMany
    {
        return $this->hasMany(Employee::class, 'id_department', 'id_department');
    }

    /** @return BelongsTo<Employee, $this> */
    public function hod(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'hod_user_id', 'id_employee');
    }

    /** @return BelongsTo<Employee, $this> */
    public function manager(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'manager_user_id', 'id_employee');
    }
}
