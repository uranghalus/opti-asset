<?php

use App\Http\Controllers\AssetClassificationController;
use App\Http\Controllers\AssetController;
use App\Http\Controllers\AssetDisposalController;
use App\Http\Controllers\AssetHistoryController;
use App\Http\Controllers\AssetTransferController;
use App\Http\Controllers\AuditLogController;
use App\Http\Controllers\Auth\SamlController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ItemController;
use App\Http\Controllers\LocationController;
use App\Http\Controllers\Org\DepartmentController;
use App\Http\Controllers\Org\EmployeeController;
use App\Http\Controllers\PermissionController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\SuperAdminGrantController;
use App\Http\Controllers\TenantController;
use App\Http\Controllers\TenantSwitchController;
use App\Models\Tenant;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    if (! Auth::check()) {
        return redirect()->route('saml.login');
    }

    $user = Auth::user();

    if ($user->isSuperAdmin()) {
        return redirect()->route('tenants.index');
    }

    if ($user->tenant_id) {
        $tenant = Tenant::find($user->tenant_id);

        if ($tenant) {
            return redirect()->route('tenant.dashboard', ['tenant' => $tenant->code]);
        }
    }

    return redirect()->route('tenants.index');
})->name('home');

Route::middleware(['auth'])->group(function () {
    Route::prefix('{tenant}')->name('tenant.')->group(function () {
        Route::get('dashboard', DashboardController::class)->name('dashboard');

        Route::get('audit-logs', [AuditLogController::class, 'index'])->name('audit-logs.index');

        Route::get('asset-classification', [AssetClassificationController::class, 'index'])->name('asset-classification.index');

        Route::prefix('asset-classification')->name('asset-classification.')->group(function () {
            Route::post('reorder', [AssetClassificationController::class, 'reorder'])->name('reorder');
            Route::post('bulk-destroy', [AssetClassificationController::class, 'destroyBulk'])->name('bulk-destroy');
            Route::post('import', [AssetClassificationController::class, 'import'])->name('import');

            Route::post('groups', [AssetClassificationController::class, 'storeGroup'])->name('groups.store');
            Route::patch('groups/{group}', [AssetClassificationController::class, 'updateGroup'])->name('groups.update');
            Route::delete('groups/{group}', [AssetClassificationController::class, 'destroyGroup'])->name('groups.destroy');

            Route::post('categories', [AssetClassificationController::class, 'storeCategory'])->name('categories.store');
            Route::patch('categories/{category}', [AssetClassificationController::class, 'updateCategory'])->name('categories.update');
            Route::delete('categories/{category}', [AssetClassificationController::class, 'destroyCategory'])->name('categories.destroy');

            Route::post('clusters', [AssetClassificationController::class, 'storeCluster'])->name('clusters.store');
            Route::patch('clusters/{cluster}', [AssetClassificationController::class, 'updateCluster'])->name('clusters.update');
            Route::delete('clusters/{cluster}', [AssetClassificationController::class, 'destroyCluster'])->name('clusters.destroy');

            Route::post('sub-clusters', [AssetClassificationController::class, 'storeSubCluster'])->name('sub-clusters.store');
            Route::patch('sub-clusters/{subCluster}', [AssetClassificationController::class, 'updateSubCluster'])->name('sub-clusters.update');
            Route::delete('sub-clusters/{subCluster}', [AssetClassificationController::class, 'destroySubCluster'])->name('sub-clusters.destroy');
        });

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
        Route::get('assets/grouped', [AssetController::class, 'grouped'])->name('assets.grouped');
        Route::get('assets/browse', [AssetController::class, 'browse'])->name('assets.browse');
        Route::get('assets/scan', [AssetController::class, 'scan'])->name('assets.scan');
        Route::get('assets/scan/lookup', [AssetController::class, 'scanLookup'])->name('assets.scan-lookup');
        Route::get('assets/labels', [AssetController::class, 'labels'])->name('assets.labels');
        Route::get('assets/labels-batch', [AssetController::class, 'labelsBatch'])->name('assets.labels-batch');
        Route::get('assets/import/template', [AssetController::class, 'importTemplate'])->name('assets.import-template');
        Route::post('assets/import', [AssetController::class, 'import'])->name('assets.import');
        Route::post('assets/upload', [AssetController::class, 'upload'])->name('assets.upload');
        Route::delete('assets/bulk', [AssetController::class, 'destroyBulk'])->name('assets.destroy-bulk');
        Route::get('assets/create', [AssetController::class, 'create'])->name('assets.create');
        Route::get('assets/{asset}', [AssetController::class, 'show'])->name('assets.show');
        Route::get('assets/{asset}/history', [AssetHistoryController::class, 'index'])->name('assets.history');
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

        Route::get('asset-disposals', [AssetDisposalController::class, 'index'])->name('disposals.index');
        Route::get('asset-disposals/create', [AssetDisposalController::class, 'create'])->name('disposals.create');
        Route::post('asset-disposals', [AssetDisposalController::class, 'store'])->name('disposals.store');
        Route::get('asset-disposals/{disposal}', [AssetDisposalController::class, 'show'])->name('disposals.show');
        Route::post('asset-disposals/{disposal}/approve', [AssetDisposalController::class, 'approve'])->name('disposals.approve');
        Route::post('asset-disposals/{disposal}/reject', [AssetDisposalController::class, 'reject'])->name('disposals.reject');
        Route::get('asset-disposals/{disposal}/edit', [AssetDisposalController::class, 'edit'])->name('disposals.edit');
        Route::patch('asset-disposals/{disposal}', [AssetDisposalController::class, 'update'])->name('disposals.update');
        Route::delete('asset-disposals/{disposal}', [AssetDisposalController::class, 'destroy'])->name('disposals.destroy');
        Route::post('asset-disposals/bulk', [AssetDisposalController::class, 'bulk'])->name('disposals.bulk');

        Route::get('reports', [ReportController::class, 'index'])->name('reports.index');
        Route::get('reports/export/transfers', [ReportController::class, 'exportTransfers'])->name('reports.export.transfers');
        Route::get('reports/export/disposals', [ReportController::class, 'exportDisposals'])->name('reports.export.disposals');
    });

    // Global routes — not tenant-scoped (D2: Role, Permission, Profile, organization excluded from {tenant} prefix)
    Route::prefix('roles')->name('roles.')->group(function () {
        Route::get('/', [RoleController::class, 'index'])->name('index');
        Route::post('/', [RoleController::class, 'store'])->name('store');
        Route::patch('/{role}', [RoleController::class, 'update'])->name('update');
        Route::delete('/{role}', [RoleController::class, 'destroy'])->name('destroy');
        Route::put('/{role}/permissions', [RoleController::class, 'syncPermissions'])->name('permissions.sync');
    });

    Route::prefix('permissions')->name('permissions.')->group(function () {
        Route::get('/', [PermissionController::class, 'index'])->name('index');
        Route::post('/', [PermissionController::class, 'store'])->name('store');
        Route::patch('/{permission}', [PermissionController::class, 'update'])->name('update');
        Route::delete('/{permission}', [PermissionController::class, 'destroy'])->name('destroy');
    });

    // Admin tenant management (global, platform level) — D3: API sync source
    Route::prefix('tenants')->name('tenants.')->middleware('can:tenant.manage')->group(function () {
        Route::get('/', [TenantController::class, 'index'])->name('index');
        Route::post('/', [TenantController::class, 'create'])->name('store');
        Route::post('sync', [TenantController::class, 'sync'])->name('sync');
    });

    // Tenant switch — signed URL (D5)
    Route::prefix('tenant')->name('tenant.')->group(function () {
        Route::get('switch/{tenantCode}', [TenantSwitchController::class, 'signed'])->name('switch.signed');
        Route::post('switch', [TenantSwitchController::class, 'switch'])->name('switch');
    });

    Route::prefix('super-admin')->name('super-admin.')->group(function () {
        Route::get('grants', [SuperAdminGrantController::class, 'index'])->name('grants.index');
        Route::post('grants', [SuperAdminGrantController::class, 'store'])->name('grants.store');
        Route::delete('grants', [SuperAdminGrantController::class, 'destroy'])->name('grants.destroy');
    });
});

Route::prefix('auth')->group(function () {
    Route::get('saml/login', [SamlController::class, 'redirect'])->name('saml.login');
    Route::post('saml/opti-saml-acs', [SamlController::class, 'acs'])->name('saml.acs');
    Route::get('saml/opti-saml-metadata', [SamlController::class, 'metadata'])->name('saml.metadata');
    Route::get('saml/opti-saml-logout', [SamlController::class, 'logout'])->name('saml.logout');
    Route::get('saml/denied', function () {
        $reason = session('saml.denial_reason', 'unknown');

        return response("<h1>Login Ditolak</h1><p>Alasan: {$reason}</p><p><a href='/auth/saml/login'>Coba lagi</a></p>", 403)
            ->header('Content-Type', 'text/html');
    })->name('saml.denied');
});

Route::get('admin/dashboard', function () {
    return response('<h1>Admin Dashboard</h1><p>Selamat datang, Super Admin.</p>', 200)
        ->header('Content-Type', 'text/html');
})->name('admin.dashboard');

Route::get('auth/error', function () {
    $message = session('error', 'Terjadi kesalahan saat login SSO.');

    return response("<h1>Login Gagal</h1><p>{$message}</p><p><a href='/auth/saml/login'>Coba lagi</a></p>", 500)
        ->header('Content-Type', 'text/html');
})->name('auth.error');

require __DIR__.'/settings.php';
