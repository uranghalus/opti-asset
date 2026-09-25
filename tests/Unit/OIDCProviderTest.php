<?php

namespace Tests\Unit;

use App\Providers\OIDCProvider;
use Illuminate\Http\Request;
use Tests\TestCase;

class TestableOIDCProvider extends OIDCProvider
{
    /**
     * @param  array<string, mixed>  $config
     * @return array<string, mixed>
     */
    public function discoveryConfig(array $config): array
    {
        $this->config = $config;

        return $this->getOpenIdConfig();
    }
}

class OIDCProviderTest extends TestCase
{
    public function test_explicit_oauth_endpoints_bypass_oidc_discovery(): void
    {
        $provider = new TestableOIDCProvider(
            Request::create('/'),
            'client-id',
            'client-secret',
            'https://app.test/callback',
        );

        $configuration = $provider->discoveryConfig([
            'authorization_url' => 'https://gate.example.test/oauth/authorize',
            'token_url' => 'https://gate.example.test/oauth/token',
            'userinfo_url' => 'https://gate.example.test/api/user',
        ]);

        $this->assertSame([
            'authorization_endpoint' => 'https://gate.example.test/oauth/authorize',
            'token_endpoint' => 'https://gate.example.test/oauth/token',
            'userinfo_endpoint' => 'https://gate.example.test/api/user',
        ], $configuration);
    }
}
