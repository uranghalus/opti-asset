<?php

namespace App\Models;

use Spatie\Multitenancy\Models\Tenant as SpatieTenant;

class Tenant extends SpatieTenant
{
    protected $connection = 'mongodb';

    protected $fillable = [
        'id',
        'name',
        'domain',
        'database',
    ];

    protected $casts = [
        'id' => 'string',
    ];
}
