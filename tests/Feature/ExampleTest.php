<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ExampleTest extends TestCase
{
    use RefreshDatabase;

    public function test_home_redirects_guests_to_sso_login()
    {
        $response = $this->get('/');

        $response->assertRedirect();
        $this->assertStringContainsString('/saml/login', $response->headers->get('Location'));
    }
}
