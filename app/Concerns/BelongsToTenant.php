<?php

namespace App\Concerns;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Spatie\Multitenancy\Models\Tenant;

trait BelongsToTenant
{
    public static function bootBelongsToTenant(): void
    {
        static::addGlobalScope('tenant', function (Builder $builder) {
            if (Tenant::checkCurrent()) {
                $builder->where('tenant_id', Tenant::current()->getKey());
            }
        });

        static::creating(function (Model $model) {
            if (Tenant::checkCurrent() && is_null($model->tenant_id)) {
                $model->tenant_id = Tenant::current()->getKey();
            }
        });
    }
}
