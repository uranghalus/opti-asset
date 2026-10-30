<?php

namespace App\Http\Controllers;

use App\Actions\CreateTenantAction;
use App\Models\Tenant;
use App\Services\TenantAccess;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Unit Bisnis (tenant) administration — platform level, no tenant prefix.
 *
 * Tenants are synchronized from Optigate API (Companies). Manual
 * create/update/delete is disabled — use the sync action instead (D3).
 */
class TenantController extends Controller
{
    public function __construct(
        protected TenantAccess $tenantAccess,
        protected CreateTenantAction $createTenantAction,
    ) {}

    public function index(Request $request): Response
    {
        Gate::authorize('tenant.manage');

        $search = $request->string('search')->toString();

        $tenants = Tenant::query()
            ->when($search !== '', fn ($query) => $query->where(
                fn ($query) => $query
                    ->where('name', 'like', '%'.addcslashes($search, '%_\\').'%')
                    ->orWhere('code', 'like', '%'.addcslashes($search, '%_\\').'%')
            ))
            ->orderBy('name', 'asc')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('tenants/Index', [
            'tenants' => $tenants,
        ]);
    }

    public function sync(Request $request): Response
    {
        Gate::authorize('tenant.manage');

        $url = config('services.optigate_portal.url');
        $token = config('services.optigate_portal.token');

        if (blank($url) || blank($token)) {
            $search = $request->string('search')->toString();

            return Inertia::render('tenants/Index', [
                'tenants' => Tenant::query()
                    ->when($search !== '', fn ($query) => $query->where(
                        fn ($query) => $query
                            ->where('name', 'like', '%'.addcslashes($search, '%_\\').'%')
                            ->orWhere('code', 'like', '%'.addcslashes($search, '%_\\').'%')
                    ))
                    ->orderBy('name', 'asc')
                    ->paginate(15)
                    ->withQueryString(),
                'syncError' => 'Konfigurasi portal belum diatur. Tambahkan WEB_PORTAL_URL dan WEB_PORTAL_TOKEN di .env.',
            ]);
        }

        try {
            $exitCode = Artisan::call('app:sync-tenants');
            $output = Artisan::output();

            if ($exitCode === 0) {
                $syncResult = $this->parseSyncOutput($output);

                $search = $request->string('search')->toString();

                return Inertia::render('tenants/Index', [
                    'tenants' => Tenant::query()
                        ->when($search !== '', fn ($query) => $query->where(
                            fn ($query) => $query
                                ->where('name', 'like', '%'.addcslashes($search, '%_\\').'%')
                                ->orWhere('code', 'like', '%'.addcslashes($search, '%_\\').'%')
                        ))
                        ->orderBy('name', 'asc')
                        ->paginate(15)
                        ->withQueryString(),
                    'syncResult' => $syncResult,
                ]);
            }

            $search = $request->string('search')->toString();

            return Inertia::render('tenants/Index', [
                'tenants' => Tenant::query()
                    ->when($search !== '', fn ($query) => $query->where(
                        fn ($query) => $query
                            ->where('name', 'like', '%'.addcslashes($search, '%_\\').'%')
                            ->orWhere('code', 'like', '%'.addcslashes($search, '%_\\').'%')
                    ))
                    ->orderBy('name', 'asc')
                    ->paginate(15)
                    ->withQueryString(),
                'syncError' => 'Gagal mensinkronkan tenant dari API Portal.',
            ]);
        } catch (\Throwable $e) {
            $search = $request->string('search')->toString();

            return Inertia::render('tenants/Index', [
                'tenants' => Tenant::query()
                    ->when($search !== '', fn ($query) => $query->where(
                        fn ($query) => $query
                            ->where('name', 'like', '%'.addcslashes($search, '%_\\').'%')
                            ->orWhere('code', 'like', '%'.addcslashes($search, '%_\\').'%')
                    ))
                    ->orderBy('name', 'asc')
                    ->paginate(15)
                    ->withQueryString(),
                'syncError' => 'Exception API Tenant: '.$e->getMessage(),
            ]);
        }
    }

    /**
     * Parse sync output from the console command into structured counts.
     *
     * @return array{success: bool, created: int, updated: int, deactivated: int, reactivated: int, total: int}
     */
    private function parseSyncOutput(string $output): array
    {
        $parse = function (string $label) use ($output): int {
            preg_match('/'.preg_quote($label, '/').':\s*(\d+)/', $output, $m);

            return (int) ($m[1] ?? 0);
        };

        $created = $parse('Dibuat');
        $updated = $parse('Diperbarui');
        $deactivated = $parse('Dinonaktifkan');
        $reactivated = $parse('Diaktifkan kembali');

        return [
            'success' => true,
            'created' => $created,
            'updated' => $updated,
            'deactivated' => $deactivated,
            'reactivated' => $reactivated,
            'total' => $created + $updated + $deactivated + $reactivated,
        ];
    }

    public function create(Request $request): RedirectResponse
    {
        Gate::authorize('tenant.manage');

        $user = $request->user();
        $tenant = $this->createTenantAction->execute($user);

        return redirect()->route('tenants.index')->with('success', 'Tenant berhasil dibuat.');
    }
}
