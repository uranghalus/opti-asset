<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::command('app:run-depreciation')->monthlyOn(1, '02:00')->withoutOverlapping();

// Companies change rarely; a nightly reconciliation keeps tenant data aligned
// with the Optigate portal without hammering the API.
Schedule::command('app:sync-tenants')->dailyAt('01:00')->withoutOverlapping();

// Sinkronisasi data organisasi per tenant (divisions, positions, employees,
// lalu resolusi HOD) setelah daftar tenant disinkronkan.
Schedule::command('app:sync-tenant-data')->dailyAt('02:00')->withoutOverlapping();
