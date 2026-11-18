<?php

namespace Tests\Feature\Auth;

use App\Models\Employee;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use OneLogin\Saml2\Auth as SamlAuth;
use Tests\TestCase;

class SamlAcsSessionTest extends TestCase
{
    use RefreshDatabase;

    private const REQUEST_ID = 'saml-request-id-01';

    public function test_acs_berhasil_menyimpan_employee_dan_membersihkan_tenant_session(): void
    {
        config(['auth.super_admin_email' => 'superadmin@appdutamall.com']);

        $tenant = Tenant::create([
            'id' => 'tenant-top',
            'name' => 'PT Tata Optima Property',
            'code' => 'top',
            'is_active' => true,
        ]);

        // Employee ter-link via FK: snapshot session `employee` harus ada
        // setelah ACS sukses (resolusi FK, bukan email).
        $employee = Employee::factory()->create([
            'email' => 'ridho.fatahillah@tataoptima.com',
            'tenant_id' => $tenant->id,
        ]);
        User::factory()->create([
            'email' => 'ridho.fatahillah@tataoptima.com',
            'tenant_id' => $tenant->id,
            'employee_id' => $employee->id_employee,
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

        $response = $this->withSession(['saml_request_id' => self::REQUEST_ID])
            ->post(route('saml.acs'), ['SAMLResponse' => 'respons-saml-palsu']);

        $response->assertRedirect(route('tenant.dashboard', ['tenant' => $tenant->code]));

        // Tenant resolusi hanya diperlukan sampai landing memutuskan tujuan:
        // setelah sukses ia harus dibersihkan dari session.
        $this->assertNull(
            session('saml.tenant'),
            'saml.tenant harus dibersihkan setelah ACS berhasil.'
        );

        $this->assertIsArray(session('employee'));
        $this->assertSame($employee->id_employee, session('employee')['id_employee']);
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
