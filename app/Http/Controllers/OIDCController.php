<?php

namespace App\Http\Controllers;

use App\Actions\CreateTenantAction;
use App\Models\Department;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;

class OIDCController extends Controller
{
    public function __construct(
        private CreateTenantAction $createTenant,
    ) {}

    public function redirect()
    {
        return Socialite::driver('oidc')->redirect();
    }

    public function callback(Request $request)
    {
        try {
            /** @var SocialiteOAuth2AbstractProvider $driver */
            $driver = Socialite::driver('oidc');
            $ssoUser = $driver->stateless()->user();

            $rawData = $ssoUser->user ?? [];
            $ssoCompanyId = $rawData['company'] ?? null;
            Log::info('OIDC Raw Data:', $rawData);
            $ssoDepartmentName = is_array($rawData['department'] ?? null)
                ? ($rawData['department']['name'] ?? $rawData['department']['id'] ?? null)
                : ($rawData['department'] ?? null);

            $user = User::where('email', $ssoUser->getEmail())->first();

            $departmentId = null;
            if (! empty($ssoDepartmentName)) {
                try {
                    if ($user?->tenant_id) {
                        $departmentId = Tenant::find($user->tenant_id)
                            ?->execute(fn () => $this->findDepartmentId($ssoDepartmentName));
                    }
                } catch (\Exception $e) {
                    Log::warning('SSO Callback: Gagal query Department — '.$e->getMessage());
                }
            }

            $position = is_array($rawData['position'] ?? null)
                ? ($rawData['position']['name'] ?? $rawData['position']['id'] ?? json_encode($rawData['position']))
                : ($rawData['position'] ?? null);

            $user = User::updateOrCreate(
                ['email' => $ssoUser->getEmail()],
                [
                    'name' => $ssoUser->getName(),
                    'email' => $ssoUser->getEmail(),
                    'password' => null,
                    'phone' => null,
                    'department' => $departmentId,
                    'position' => $position,
                    'last_login_at' => $rawData['last_login_at'] ?? now(),
                    'last_login_ip' => $rawData['last_login_ip'] ?? request()->ip(),
                ]
            );

            if (! $user) {
                throw new \RuntimeException('Gagal membuat atau menemukan user.');
            }

            if (! $user->tenant_id && $ssoCompanyId) {
                $tenant = Tenant::find($ssoCompanyId);
                if ($tenant) {
                    $user->update(['tenant_id' => $tenant->id]);
                    $user->tenants()->syncWithoutDetaching([$tenant->id]);
                } else {
                    $this->createTenant->execute($user);
                }
            } elseif (! $user->tenant_id) {
                $this->createTenant->execute($user);
            }

            $request->session()->put('current_tenant_id', $user->tenant_id);

            Auth::login($user);
            $request->session()->regenerate();

            // ponytail: store raw id_token for RP-initiated logout. Add column if IdP rotates tokens frequently.
            $request->session()->put('oidc_id_token', $tokenResponse['id_token'] ?? null);

            return redirect()->route('dashboard');
        } catch (\Exception $e) {
            Log::error('OIDC SSO Callback Error: '.$e->getMessage());

            return redirect('/')->with('error', 'Terjadi kesalahan saat login SSO: '.$e->getMessage());
        }
    }

    public function logout(Request $request)
    {
        // ponytail: grab id_token BEFORE session clear for RP-initiated logout
        $idToken = $request->session()->get('oidc_id_token');

        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        if (!$idToken) {
            return redirect('/');
        }

        $oidcLogoutUrl = config('services.oidc.logout_url', '/');
        $postLogoutRedirectUri = url('/');

        $query = http_build_query([
            'id_token_hint' => $idToken,
            'post_logout_redirect_uri' => $postLogoutRedirectUri,
        ]);

        return redirect($oidcLogoutUrl . '?' . $query);
    }

    private function findDepartmentId(string $ssoDepartmentName): ?string
    {
        $department = Str::isUuid($ssoDepartmentName)
            ? Department::find($ssoDepartmentName)
            : Department::where('nama_department', $ssoDepartmentName)->first();

        if (! $department) {
            Log::warning("SSO Callback: Department '{$ssoDepartmentName}' tidak ditemukan di tabel lokal.");

            return null;
        }

        return $department->id_department;
    }
}
