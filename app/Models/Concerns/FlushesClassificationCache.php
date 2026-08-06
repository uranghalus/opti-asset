<?php

namespace App\Models\Concerns;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

trait FlushesClassificationCache
{
    public static function bootFlushesClassificationCache(): void
    {
        static::saved(static function (Model $model): void {
            $tenantId = $model->getAttribute('tenant_id');

            if ($tenantId) {
                Cache::forget('classification.tree.'.$tenantId);
            }
        });
        static::deleted(static function (Model $model): void {
            $tenantId = $model->getAttribute('tenant_id');

            if ($tenantId) {
                Cache::forget('classification.tree.'.$tenantId);
            }
        });
    }
}
