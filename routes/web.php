<?php

use App\Http\Controllers\OIDCController;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');
});
Route::get('auth/redirect', [OIDCController::class, 'redirect'])->name('authsso');
Route::get('auth/oidc/callback', [OIDCController::class, 'callback'])->name('ssocallback');

require __DIR__ . '/settings.php';
require __DIR__ . '/tenants.php';
