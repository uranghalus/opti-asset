<?php

namespace App\Providers;

use GuzzleHttp\RequestOptions;
use Laravel\Socialite\Two\InvalidStateException;
use SocialiteProviders\OIDC\Provider as BaseProvider;

class OIDCProvider extends BaseProvider
{
    /**
     * Disable nonce verification.
     * Beberapa server SSO tidak mengirimkan 'nonce' di dalam ID Token mereka.
     * Mengubah nilai ini menjadi false akan melewati pengecekan nonce.
     */
    protected function usesNonce(): bool
    {
        return false;
    }

    /**
     * Override user() untuk mengambil detail profil lengkap dari UserInfo / API User endpoint.
     */
    public function user()
    {
        if ($this->user) {
            return $this->user;
        }

        if ($this->hasInvalidState()) {
            throw new InvalidStateException;
        }

        $tokenResponse = $this->getAccessTokenResponse($this->request->input('code'));

        // Decrypt JWT token (dari ID Token)
        $payload = (array) $this->decodeJWT(
            $tokenResponse['id_token'],
            $this->request->input('code')
        );

        // Selalu ambil informasi profil lengkap dari UserInfo / API User endpoint menggunakan Access Token
        try {
            $userInfo = $this->getUserByToken($tokenResponse['access_token']);
            if (is_array($userInfo)) {
                $payload = array_merge($payload, $userInfo);
            }
        } catch (\Exception $e) {
            // Abaikan/log jika UserInfo gagal diakses
        }

        $this->user = $this->mapUserToObject($payload);

        return $this->user->setToken($tokenResponse['access_token'])
            ->setRefreshToken($tokenResponse['refresh_token'] ?? null)
            ->setExpiresIn($tokenResponse['expires_in']);
    }

    /**
     * Override getUserByToken untuk mendukung pemanggilan OIDC_USER_INFO_URL (api/user) dari Gate
     * dengan menyertakan Authorization Bearer header.
     */
    protected function getUserByToken($token)
    {
        $url = config('services.oidc.user_info_url') ?: $this->getUserInfoUrl();

        $response = $this->getHttpClient()->get($url, [
            RequestOptions::HEADERS => [
                'Authorization' => 'Bearer '.$token,
                'Accept' => 'application/json',
            ],
        ]);

        return json_decode((string) $response->getBody(), true);
    }

    /**
     * Map data user ke objek Laravel Socialite User.
     */
    protected function mapUserToObject(array $user)
    {
        // Pastikan key sub, nickname, dll ada sebelum memanggil parent agar mapping bawaan Socialite tidak kosong/error
        if (! isset($user['sub']) && isset($user['id'])) {
            $user['sub'] = $user['id'];
        }
        if (! isset($user['nickname']) && isset($user['username'])) {
            $user['nickname'] = $user['username'];
        }

        $mappedUser = parent::mapUserToObject($user);

        // Map foto profil (photo_url, photo, picture atau avatar) agar tidak bernilai null
        $avatar = $user['photo_url'] ?? $user['photo'] ?? $user['picture'] ?? $user['avatar'] ?? null;
        $mappedUser->avatar = $avatar;

        $mappedUser->map(array_merge($mappedUser->attributes, [
            'avatar' => $avatar,
            'picture' => $avatar,
        ]));

        return $mappedUser;
    }
}
