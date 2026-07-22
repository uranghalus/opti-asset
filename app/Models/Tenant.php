<?php

namespace App\Models;

use Stancl\Tenancy\Database\Concerns\HasDomains;
use Stancl\Tenancy\Database\Models\Tenant as BaseTenant;

class Tenant extends BaseTenant
{
    use HasDomains;

    // Mendefinisikan kolom tambahan di tabel tenants
    public static function getCustomColumns(): array
    {
        return [
            'id',
            'name', // Kolom nama perusahaan/tenant
        ];
    }
}
