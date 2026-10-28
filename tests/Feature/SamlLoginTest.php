<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use OneLogin\Saml2\Auth as SamlAuth;
use Tests\TestCase;

class SamlLoginTest extends TestCase
{
    use RefreshDatabase;

    public function test_saml_login_redirects_to_idp(): void
    {
        $samlAuth = \Mockery::mock(SamlAuth::class);
        $this->app->instance(SamlAuth::class, $samlAuth);

        config(['saml.idp.x509cert' => 'test-cert']);

        $response = $this->get('/auth/saml/login');

        $response->assertRedirect();
        $this->assertStringContainsString('SAMLRequest', $response->headers->get('Location'));
    }

    public function test_saml_acs_provisions_user_and_logs_in(): void
    {
        $samlAuth = \Mockery::mock(SamlAuth::class);
        $samlAuth->shouldReceive('processResponse')->once()->with(null);
        $samlAuth->shouldReceive('getErrors')->andReturn([]);
        $samlAuth->shouldReceive('isAuthenticated')->andReturn(true);
        $samlAuth->shouldReceive('getAttributes')->andReturn([
            'email' => ['test@example.com'],
            'name' => ['Test User'],
            'department' => ['Engineering'],
            'position' => ['Developer'],
        ]);
        $samlAuth->shouldReceive('getNameId')->andReturn('test@example.com');

        $this->app->instance(SamlAuth::class, $samlAuth);

        $response = $this->post('/auth/saml/opti-saml-acs', ['SAMLResponse' => 'fake']);

        $this->assertDatabaseHas('users', ['email' => 'test@example.com']);
        $this->assertTrue(Auth::check());
        $response->assertRedirect('/dashboard');
        $response->assertSessionHas('success', 'Login berhasil melalui SAML.');
    }

    public function test_saml_acs_missing_email_redirects_to_error(): void
    {
        $samlAuth = \Mockery::mock(SamlAuth::class);
        $samlAuth->shouldReceive('processResponse')->once()->with(null);
        $samlAuth->shouldReceive('getErrors')->andReturn([]);
        $samlAuth->shouldReceive('isAuthenticated')->andReturn(true);
        $samlAuth->shouldReceive('getAttributes')->andReturn([]);
        $samlAuth->shouldReceive('getNameId')->andReturn(null);

        $this->app->instance(SamlAuth::class, $samlAuth);

        $response = $this->post('/auth/saml/opti-saml-acs', ['SAMLResponse' => 'fake']);

        $response->assertRedirect('/auth/error');
        $response->assertSessionHas('error');
    }

    public function test_saml_acs_signature_failure_not_500(): void
    {
        $samlAuth = \Mockery::mock(SamlAuth::class);
        $samlAuth->shouldReceive('processResponse')->once()->with(null);
        $samlAuth->shouldReceive('getErrors')->andReturn(['Signature validation failed']);
        $samlAuth->shouldReceive('getNameId')->andReturn(null);
        $samlAuth->shouldReceive('getAttributes')->andReturn([]);

        $this->app->instance(SamlAuth::class, $samlAuth);

        $response = $this->post('/auth/saml/opti-saml-acs', ['SAMLResponse' => 'fake']);

        $response->assertRedirect('/auth/error');
        $response->assertStatus(302);
    }
}
