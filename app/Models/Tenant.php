<?php

namespace App\Models;

use Spatie\Multitenancy\Models\Tenant as SpatieTenant;

class Tenant extends SpatieTenant
{
    protected $fillable = [
        'id',
        'name',
    ];

    protected $casts = [
        'id' => 'string',
    ];

    public function users()
    {
        return $this->belongsToMany(User::class, 'user_tenants', 'tenant_id', 'user_id');
    }
}
