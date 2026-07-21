<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use MongoDB\Laravel\Eloquent\Model;

class Department extends Model
{
    use HasFactory, HasUuids;

    protected $connection = 'mongodb';

    protected $collection = 'tb_department';

    protected $primaryKey = 'id_department';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'id_department',
        'kode_department',
        'nama_department',
        'hod_user_id',
        'manager_user_id',
    ];
}
