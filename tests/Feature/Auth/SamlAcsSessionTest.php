<?php

namespace Tests\Feature\Auth;

use App\Models\Tenant;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use OneLogin\Saml2\Auth as SamlAuth;
use Tests\TestCase;

class SamlAcsSessionTest extends TestCase
{
    use RefreshDatabase;

    private const REQUEST_ID = 'saml-request-id-01';

    public function test_acs_berhasil_menyimpan_tenant_ke_session(): void
    {
        config(['auth.super_admin_email' => 'superadmin@appdutamall.com']);

        $tenant = Tenant::create([
            'id' => 'tenant-top',
            'name' => 'PT Tata Optima Property',
            'code' => 'top',
            'is_active' => true,
        ]);

        $samlAuth = \Mockery::mock(SamlAuth::class);
        $samlAuth->shouldReceive('processResponse')->once()->with(self::REQUEST_ID);
        $samlAuth->shouldReceive('getErrors')->andReturn([]);
        $samlAuth->shouldReceive('isAuthenticated')->andReturn(true);
        $samlAuth->shouldReceive('getAttributes')->andReturn([
            'email' => ['ridho.fatahillah@tataoptima.com'],
            'name' => ['Ridho Fatahillah'],
            'company' => ['PT Tata Optima Property'],
            'department' => ['Engineering'],
            'position' => ['Developer'],
        ]);
        $samlAuth->shouldReceive('getNameId')->andReturn('ridho.fatahillah@tataoptima.com');

        $this->app->instance(SamlAuth::class, $samlAuth);

        $this->withSession(['saml_request_id' => self::REQUEST_ID])
            ->post(route('saml.acs'), ['SAMLResponse' => 'respons-saml-palsu']);

        $this->assertSame(
            $tenant->id,
            session('saml.tenant'),
            'Tenant yang ter-resolusi harus disimpan ke session setelah ACS berhasil.'
        );
    }

    public function test_acs_tanpa_tenant_yang_cocok_tidak_menyimpan_session_dan_ditolak(): void
    {
        Tenant::create([
            'id' => 'tenant-top',
            'name' => 'PT Tata Optima Property',
            'code' => 'top',
            'is_active' => true,
        ]);

        $samlAuth = \Mockery::mock(SamlAuth::class);
        $samlAuth->shouldReceive('processResponse')->once()->with(self::REQUEST_ID);
        $samlAuth->shouldReceive('getErrors')->andReturn([]);
        $samlAuth->shouldReceive('isAuthenticated')->andReturn(true);
        $samlAuth->shouldReceive('getAttributes')->andReturn([
            'email' => ['karyawan@lainnya.com'],
            'name' => ['Karyawan Lainnya'],
            'company' => ['PT Lainnya'],
            'department' => ['Engineering'],
            'position' => ['Developer'],
        ]);
        $samlAuth->shouldReceive('getNameId')->andReturn('karyawan@lainnya.com');

        $this->app->instance(SamlAuth::class, $samlAuth);

        $response = $this->withSession(['saml_request_id' => self::REQUEST_ID])
            ->post(route('saml.acs'), ['SAMLResponse' => 'respons-saml-palsu']);

        $this->assertNull(
            session('saml.tenant'),
            'Session saml.tenant tidak boleh diisi saat tenant tidak ditemukan.'
        );

        $this->assertFalse(Auth::check(), 'Sesi login harus diakhiri saat ACS ditolak.');
        $response->assertRedirect(route('saml.denied'));
    }
}
