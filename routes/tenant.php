<?php

declare(strict_types=1);

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Tenant Routes
|--------------------------------------------------------------------------
|
| Here you can register the tenant routes for your application.
| These routes are loaded by the TenancyServiceProvider.
|
| Middleware (web + tenant group) is already applied via bootstrap/app.php.
|
*/

Route::get('/home', function () {
    return 'This is your multi-tenant application. The id of the current tenant is '.tenant('id');
})->name('tenant.home');
