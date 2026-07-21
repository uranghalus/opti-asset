<?php

use App\Http\Controllers\TenantController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('tenants', [TenantController::class, 'index'])->name('tenants.index');
    Route::post('tenants', [TenantController::class, 'store'])->name('tenants.store');
    Route::get('tenants/{tenant}/edit', [TenantController::class, 'edit'])->name('tenants.edit');
    Route::put('tenants/{tenant}', [TenantController::class, 'update'])->name('tenants.update');
    Route::delete('tenants/{tenant}', [TenantController::class, 'destroy'])->name('tenants.destroy');
    Route::post('tenants/{tenant}/switch', [TenantController::class, 'switch'])->name('tenants.switch');
});
