<?php

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\OIDCController;
use App\Http\Controllers\OrganizationController;
use App\Http\Controllers\TenantSwitchController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    if (auth()->check()) {
        return redirect()->route('dashboard');
    }

    return inertia('welcome');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', DashboardController::class)->name('dashboard');

    Route::post('tenant/switch', [TenantSwitchController::class, 'switch'])->name('tenant.switch');

    Route::get('organizations', [OrganizationController::class, 'index'])->name('organizations.index');
    Route::post('organizations', [OrganizationController::class, 'store'])->name('organizations.store');
    Route::patch('organizations/{tenant}', [OrganizationController::class, 'update'])->name('organizations.update');
    Route::delete('organizations/{tenant}', [OrganizationController::class, 'destroy'])->name('organizations.destroy');
});

Route::get('auth/redirect', [OIDCController::class, 'redirect'])->name('authsso');
Route::get('auth/oidc/callback', [OIDCController::class, 'callback'])->name('ssocallback');

require __DIR__.'/settings.php';
