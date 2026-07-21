<?php

namespace App\Http\Controllers;

use App\Models\Department;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;

class OIDCController extends Controller
{
    //
    public function redirect()
    {
        return Socialite::driver('oidc')->redirect();
    }

    public function callback(Request $request)
    {
        try {
            // 1. Ambil profil user dari OIDC Perusahaan
            /** @var SocialiteOAuth2AbstractProvider $driver */
            $driver = Socialite::driver('oidc');
            $ssoUser = $driver->stateless()->user();
            // dd($ssoUser);

            // Data mentah (raw) dari SSO disimpan di $ssoUser->user (array)
            $rawData = $ssoUser->user ?? [];
            Log::info('OIDC Raw Data:', $rawData);

            // 2. Ekstrak HANYA String Nama Department dari SSO
            $ssoDepartmentName = is_array($rawData['department'] ?? null)
                ? ($rawData['department']['name'] ?? $rawData['department']['id'] ?? null)
                : ($rawData['department'] ?? null);

            // 3. Cari ID Department di database lokal berdasarkan nama
            $departmentId = null;
            if (! empty($ssoDepartmentName)) {
                try {
                    if (Str::isUuid($ssoDepartmentName)) {
                        $localDepartment = Department::find($ssoDepartmentName);
                    } else {
                        $localDepartment = Department::where('nama_department', $ssoDepartmentName)->first();
                    }

                    if ($localDepartment) {
                        $departmentId = $localDepartment->id_department;
                    } else {
                        Log::warning("SSO Callback: Department '{$ssoDepartmentName}' tidak ditemukan di tabel lokal.");
                    }
                } catch (\Exception $e) {
                    Log::warning('SSO Callback: Gagal query Department — '.$e->getMessage());
                }
            }

            // 4. Ekstrak Position
            $position = is_array($rawData['position'] ?? null)
                ? ($rawData['position']['name'] ?? $rawData['position']['id'] ?? json_encode($rawData['position']))
                : ($rawData['position'] ?? null);

            // 5. Cari user berdasarkan email, atau buat baru jika belum ada (Upsert)
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

            // 6. Login user ke dalam session Laravel
            Auth::login($user);

            // 7. Regenerasi session untuk keamanan (mencegah session fixation)
            $request->session()->regenerate();

            // 8. Redirect ke dashboard
            return redirect()->intended('/dashboard');
        } catch (\Exception $e) {
            Log::error('OIDC SSO Callback Error: '.$e->getMessage());

            return redirect('/')->with('error', 'Terjadi kesalahan saat login SSO: '.$e->getMessage());
        }
    }

    /**
     * (Opsional) Fungsi untuk Logout
     */
    public function logout(Request $request)
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/');
    }
}
