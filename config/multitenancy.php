<?php

use App\Models\Tenant;
use App\TenantFinder;
use Spatie\Multitenancy\Actions\ForgetCurrentTenantAction;
use Spatie\Multitenancy\Actions\MakeQueueTenantAwareAction;
use Spatie\Multitenancy\Actions\MakeTenantCurrentAction;
use Spatie\Multitenancy\Actions\MigrateTenantAction;
use Spatie\Multitenancy\Jobs\NotTenantAware;
use Spatie\Multitenancy\Jobs\TenantAware;
use Spatie\Multitenancy\Tasks\PrefixCacheTask;
use Spatie\Multitenancy\Tasks\SwitchRouteCacheTask;

// Force SQLite in-memory for testing environment
// Check $_SERVER directly because .env is loaded before phpunit.xml env vars
$isTesting = (isset($_SERVER['APP_ENV']) && $_SERVER['APP_ENV'] === 'testing')
    || (isset($_ENV['APP_ENV']) && $_ENV['APP_ENV'] === 'testing')
    || env('APP_ENV') === 'testing'
    || env('PHPUNIT_TEST') === 'true';

return [
    'tenant_finder' => TenantFinder::class,

    'tenant_artisan_search_fields' => [
        'id',
    ],

    'switch_tenant_tasks' => [
        PrefixCacheTask::class,
        SwitchRouteCacheTask::class,
    ],

    'tenant_model' => Tenant::class,

    'queues_are_tenant_aware_by_default' => true,

    'tenant_database_connection_name' => $isTesting ? 'sqlite' : env('TENANT_DB_CONNECTION', 'mysql'),

    'landlord_database_connection_name' => $isTesting ? 'sqlite' : env('LANDLORD_DB_CONNECTION', 'mysql'),

    'tenant_aware_actions' => [
        ForgetCurrentTenantAction::class,
        MakeQueueTenantAwareAction::class,
        MakeTenantCurrentAction::class,
        MigrateTenantAction::class,
    ],

    'tenant_aware_jobs' => [
        NotTenantAware::class,
        TenantAware::class,
    ],

    'tenant_aware_tasks' => [
        PrefixCacheTask::class,
        SwitchRouteCacheTask::class,
    ],

];
