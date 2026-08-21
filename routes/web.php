<?php

use App\Http\Controllers\AssetClassificationController;
use App\Http\Controllers\AssetController;
use App\Http\Controllers\AssetDisposalController;
use App\Http\Controllers\AssetTransferController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ItemController;
use App\Http\Controllers\LocationController;
use App\Http\Controllers\OIDCController;
use App\Http\Controllers\Org\DepartmentController;
use App\Http\Controllers\Org\EmployeeController;
use App\Http\Controllers\OrganizationController;
use App\Http\Controllers\PermissionController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\TenantSwitchController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    if (Auth::check()) {
        return redirect()->route('dashboard');
    }

    return redirect()->route('authsso');
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
    Route::post('organizations/sync', [OrganizationController::class, 'sync'])->name('organizations.sync');

    Route::get('locations', [LocationController::class, 'index'])->name('locations.index');
    Route::post('locations', [LocationController::class, 'store'])->name('locations.store');
    Route::patch('locations/{location}', [LocationController::class, 'update'])->name('locations.update');
    Route::delete('locations/{location}', [LocationController::class, 'destroy'])->name('locations.destroy');

    Route::get('categories', [CategoryController::class, 'index'])->name('categories.index');
    Route::post('categories', [CategoryController::class, 'store'])->name('categories.store');
    Route::delete('categories/bulk', [CategoryController::class, 'destroyBulk'])->name('categories.destroy-bulk');
    Route::patch('categories/{category}', [CategoryController::class, 'update'])->name('categories.update');
    Route::delete('categories/{category}', [CategoryController::class, 'destroy'])->name('categories.destroy');

    Route::get('items', [ItemController::class, 'index'])->name('items.index');
    Route::post('items', [ItemController::class, 'store'])->name('items.store');
    Route::post('items/batch-category', [ItemController::class, 'assignCategoryBatch'])->name('items.batch-category');
    Route::patch('items/{item}', [ItemController::class, 'update'])->name('items.update');
    Route::delete('items/{item}', [ItemController::class, 'destroy'])->name('items.destroy');

    Route::get('assets', [AssetController::class, 'index'])->name('assets.index');
    Route::get('assets/scan', [AssetController::class, 'scan'])->name('assets.scan');
    Route::get('assets/scan/lookup', [AssetController::class, 'scanLookup'])->name('assets.scan-lookup');
    Route::get('assets/labels', [AssetController::class, 'labels'])->name('assets.labels');
    Route::get('assets/labels-batch', [AssetController::class, 'labelsBatch'])->name('assets.labels-batch');
    Route::get('assets/import/template', [AssetController::class, 'importTemplate'])->name('assets.import-template');
    Route::post('assets/import', [AssetController::class, 'import'])->name('assets.import');
    Route::post('assets/upload', [AssetController::class, 'upload'])->name('assets.upload');
    Route::get('assets/create', [AssetController::class, 'create'])->name('assets.create');
    Route::get('assets/{asset}', [AssetController::class, 'show'])->name('assets.show');
    Route::get('assets/{asset}/edit', [AssetController::class, 'edit'])->name('assets.edit');
    Route::post('assets', [AssetController::class, 'store'])->name('assets.store');
    Route::patch('assets/{asset}', [AssetController::class, 'update'])->name('assets.update');
    Route::delete('assets/{asset}', [AssetController::class, 'destroy'])->name('assets.destroy');

    Route::get('asset-transfers', [AssetTransferController::class, 'index'])->name('asset-transfers.index');
    Route::get('asset-transfers/create', [AssetTransferController::class, 'create'])->name('asset-transfers.create');
    Route::post('asset-transfers', [AssetTransferController::class, 'store'])->name('asset-transfers.store');
    Route::get('asset-transfers/{assetTransfer}', [AssetTransferController::class, 'show'])->name('asset-transfers.show');
    Route::post('asset-transfers/{assetTransfer}/approve', [AssetTransferController::class, 'approve'])->name('asset-transfers.approve');
    Route::post('asset-transfers/{assetTransfer}/reject', [AssetTransferController::class, 'reject'])->name('asset-transfers.reject');

    Route::get('departments', [DepartmentController::class, 'index'])->name('departments.index');
    Route::get('departments/{department}', [DepartmentController::class, 'show'])->name('departments.show');
    Route::post('departments/sync', [DepartmentController::class, 'sync'])->name('departments.sync');

    Route::get('employees', [EmployeeController::class, 'index'])->name('employees.index');
    Route::get('employees/{employee}', [EmployeeController::class, 'show'])->name('employees.show');
    Route::post('employees/{employee}/roles', [EmployeeController::class, 'assignRoles'])->name('employees.roles.update');
    Route::post('employees/sync', [EmployeeController::class, 'sync'])->name('employees.sync');

    Route::get('roles', [RoleController::class, 'index'])->name('roles.index');
    Route::post('roles', [RoleController::class, 'store'])->name('roles.store');
    Route::patch('roles/{role}', [RoleController::class, 'update'])->name('roles.update');
    Route::delete('roles/{role}', [RoleController::class, 'destroy'])->name('roles.destroy');
    Route::put('roles/{role}/permissions', [RoleController::class, 'syncPermissions'])->name('roles.permissions.sync');

    Route::get('permissions', [PermissionController::class, 'index'])->name('permissions.index');
    Route::post('permissions', [PermissionController::class, 'store'])->name('permissions.store');
    Route::patch('permissions/{permission}', [PermissionController::class, 'update'])->name('permissions.update');
    Route::delete('permissions/{permission}', [PermissionController::class, 'destroy'])->name('permissions.destroy');

    // Debug route
    Route::get('debug-roles', function (Request $request) {
        $user = $request->user();
        if (! $user) {
            return response('Not authenticated', 401);
        }

        return response()->json([
            'user' => $user->toArray(),
            'roles' => $user->getRoleNames()->toArray(),
            'has_super_admin' => $user->hasRole('super-admin'),
        ]);
    })->name('debug.roles');
});

Route::get('auth/redirect', [OIDCController::class, 'redirect'])->name('authsso');
Route::get('auth/oidc/callback', [OIDCController::class, 'callback'])->name('ssocallback');
Route::get('auth/logout', [OIDCController::class, 'logout'])->name('auth.logout');

Route::get('disposals', [AssetDisposalController::class, 'index'])->name('disposals.index');
Route::get('disposals/create', [AssetDisposalController::class, 'create'])->name('disposals.create');
Route::post('disposals', [AssetDisposalController::class, 'store'])->name('disposals.store');
Route::get('disposals/{disposal}', [AssetDisposalController::class, 'show'])->name('disposals.show');
Route::get('disposals/{disposal}/edit', [AssetDisposalController::class, 'edit'])->name('disposals.edit');
Route::patch('disposals/{disposal}', [AssetDisposalController::class, 'update'])->name('disposals.update');
Route::delete('disposals/{disposal}', [AssetDisposalController::class, 'destroy'])->name('disposals.destroy');
Route::post('disposals/bulk', [AssetDisposalController::class, 'bulk'])->name('disposals.bulk');

require __DIR__.'/settings.php';
