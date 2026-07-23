<?php

namespace App;

use Illuminate\Http\Request;
use App\Models\Tenant;
use Spatie\Multitenancy\Contracts\IsTenant;
use Spatie\Multitenancy\TenantFinder\TenantFinder as BaseFinder;

class TenantFinder extends BaseFinder
{
    public function findForRequest(Request $request): ?IsTenant
    {
        $host = $request->getHost();

        return Tenant::where('domain', $host)->first();
    }
}
