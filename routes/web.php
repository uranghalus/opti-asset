<?php

use App\Http\Controllers\AssetClassificationController;
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

    Route::get('asset-classification', [AssetClassificationController::class, 'index'])->name('asset-classification.index');

    Route::prefix('asset-classification')->group(function () {
        Route::post('reorder', [AssetClassificationController::class, 'reorder'])->name('asset-classification.reorder');
        Route::post('import', [AssetClassificationController::class, 'import'])->name('asset-classification.import');

        Route::post('groups', [AssetClassificationController::class, 'storeGroup'])->name('asset-classification.groups.store');
        Route::patch('groups/{group}', [AssetClassificationController::class, 'updateGroup'])->name('asset-classification.groups.update');
        Route::delete('groups/{group}', [AssetClassificationController::class, 'destroyGroup'])->name('asset-classification.groups.destroy');

        Route::post('categories', [AssetClassificationController::class, 'storeCategory'])->name('asset-classification.categories.store');
        Route::patch('categories/{category}', [AssetClassificationController::class, 'updateCategory'])->name('asset-classification.categories.update');
        Route::delete('categories/{category}', [AssetClassificationController::class, 'destroyCategory'])->name('asset-classification.categories.destroy');

        Route::post('clusters', [AssetClassificationController::class, 'storeCluster'])->name('asset-classification.clusters.store');
        Route::patch('clusters/{cluster}', [AssetClassificationController::class, 'updateCluster'])->name('asset-classification.clusters.update');
        Route::delete('clusters/{cluster}', [AssetClassificationController::class, 'destroyCluster'])->name('asset-classification.clusters.destroy');

        Route::post('sub-clusters', [AssetClassificationController::class, 'storeSubCluster'])->name('asset-classification.sub-clusters.store');
        Route::patch('sub-clusters/{subCluster}', [AssetClassificationController::class, 'updateSubCluster'])->name('asset-classification.sub-clusters.update');
        Route::delete('sub-clusters/{subCluster}', [AssetClassificationController::class, 'destroySubCluster'])->name('asset-classification.sub-clusters.destroy');
    });

    Route::get('organizations', [OrganizationController::class, 'index'])->name('organizations.index');
    Route::post('organizations', [OrganizationController::class, 'store'])->name('organizations.store');
    Route::patch('organizations/{tenant}', [OrganizationController::class, 'update'])->name('organizations.update');
    Route::delete('organizations/{tenant}', [OrganizationController::class, 'destroy'])->name('organizations.destroy');
});

Route::get('auth/redirect', [OIDCController::class, 'redirect'])->name('authsso');
Route::get('auth/oidc/callback', [OIDCController::class, 'callback'])->name('ssocallback');

require __DIR__.'/settings.php';
