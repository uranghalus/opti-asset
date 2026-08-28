<?php

namespace App\Http\Controllers;

use App\Actions\CreateTenantAction;
use App\Models\Department;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Redis;
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

            $user = User::updateOrCreate(
                ['email' => $ssoUser->getEmail()],
                [
                    'name' => $ssoUser->getName(),
                    'email' => $ssoUser->getEmail(),
                    'password' => null,
                    'department' => $departmentId,
                    'oidc_id' => $ssoUser->getId(),
                    'last_login_at' => now(),
                    'last_login_ip' => request()->ip(),
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
            $idToken = $ssoUser->accessTokenResponseBody['id_token'] ?? null;
            $request->session()->put('oidc_id_token', $idToken);

            return redirect()->route('dashboard');
        } catch (\Exception $e) {
            Log::error('OIDC SSO Callback Error: '.$e->getMessage());

            return redirect('/')->with('error', 'Terjadi kesalahan saat login SSO: '.$e->getMessage());
        }
    }

    public function logout(Request $request)
    {
        // ponytail: grab id_token BEFORE session clear for RP-initiated logout
        Log::info('Received logout request. Session ID: ', $request->all());
        $idToken = $request->input('logout_token');

        if (! $idToken) {
            Log::error('Missing logout_token in SLO request');

            return response()->json(['error' => 'Missing logout_token'], 400);
        }

        try {
            $tokenParts = explode('.', $idToken);
            if (count($tokenParts) !== 3) {
                return response()->json(['error' => 'Invalid token format'], 400);
            }
            $payload = json_decode(base64_decode(strtr($tokenParts[1], '-_', '+/')));

            if (! $payload || ! isset($payload->sub)) {
                return response()->json(['error' => 'Invalid token payload'], 400);
            }
            $oidcId = $payload->sub;
            $user = User::where('oidc_id', $oidcId)->first();
            if ($user) {
                $user->remember_token = null;
                $user->save();
                if (config('session.driver') === 'redis') {
                    $handler = session()->getHandler();
                    $authKey = Auth::getName();
                    $keys = (array) Redis::connection()->command('keys', ['*']);
                    foreach ($keys as $key) {
                        if (preg_match('/([a-zA-Z0-9]{40})$/', $key, $matches)) {
                            $sessionId = $matches[1];
                            $sessionData = $handler->read($sessionId);
                            if ($sessionData) {
                                $data = json_decode($sessionData, true);
                                if (is_array($data) && isset($data[$authKey]) && $data[$authKey] == $user->id) {
                                    $handler->destroy($sessionId);
                                }
                            }
                        }
                    }
                }
                DB::table('sessions')->where('user_id', $user->id)->delete();
            }

            return response()->json(['message' => 'Successfully logged out']);
        } catch (\Throwable $th) {
            Log::error('OIDC Backchannel Logout Error: '.$th->getMessage());

            return response()->json(['error' => 'Internal Server Error'], 500);
        }
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
