<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DisabledLoginRoutesTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Autentikasi aplikasi ini SAML-only: semua endpoint login password &
     * passkey di-override dengan 404 di routes/web.php. Management routes
     * (logout, 2FA, passkey settings) tetap hidup.
     */
    public function test_password_login_endpoint_is_disabled(): void
    {
        $user = User::factory()->create();

        $this->post('/login', [
            'email' => $user->email,
            'password' => 'password',
        ])->assertNotFound();

        $this->assertGuest();
    }

    public function test_passkey_login_endpoints_are_disabled(): void
    {
        $this->post('/passkeys/login')->assertNotFound();
        $this->post('/passkeys/login/options')->assertNotFound();
        $this->assertGuest();
    }

    public function test_two_factor_challenge_endpoint_is_disabled(): void
    {
        $this->post('/two-factor-challenge', [
            'code' => '123456',
        ])->assertNotFound();

        $this->assertGuest();
    }

    public function test_logout_endpoint_still_works(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->post('/logout');

        $response->assertRedirect();
        $this->assertGuest();
    }
}
