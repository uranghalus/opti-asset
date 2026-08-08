<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Spatie\Permission\Traits\HasRoles;

class Employee extends Model
{
    use BelongsToTenant, HasFactory, HasRoles, HasUuids;

    protected $table = 'tb_employee';

    protected $primaryKey = 'id_employee';

    protected $guard_name = 'web';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'id_employee',
        'tenant_id',
        'nik_employee',
        'nama_employee',
        'email',
        'number',
        'photo_url',
        'id_department',
        'id_position',
        'last_login_ip',
    ];

    /** @return BelongsTo<Department, $this> */
    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class, 'id_department', 'id_department');
    }
}
