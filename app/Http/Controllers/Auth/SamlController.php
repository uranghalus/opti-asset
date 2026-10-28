<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Department;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\URL;
use OneLogin\Saml2\Auth as SamlAuth;
use OneLogin\Saml2\AuthnRequest;
use OneLogin\Saml2\Metadata as SamlMetadata;
use OneLogin\Saml2\Settings as SamlSettings;

class SamlController extends Controller
{
    /**
     * Create a new controller instance.
     *
     * @return void
     */
    public function __construct(
        protected SamlAuth $samlAuth,
    ) {}

    /**
     * SP-initiated SAML login: redirect to OptiGate IdP SSO endpoint.
     */
    public function redirect()
    {
        $settings = new SamlSettings($this->getSamlSettings());

        // Build AuthnRequest manually so we can capture the request ID
        // before login() redirects (and exits).
        $authnRequest = new AuthnRequest($settings);
        $xml = $authnRequest->getXML();
        $requestId = $authnRequest->getId();
        $samlRequest = $authnRequest->getRequest();

        // Store request ID in session for InResponseTo validation on ACS.
        request()->session()->put('saml_request_id', $requestId);

        $ssoUrl = $settings->getIdPSSOUrl();
        $params = [
            'SAMLRequest' => $samlRequest,
            'RelayState' => URL::to('/dashboard'),
        ];

        $security = $settings->getSecurityData();
        if (isset($security['authnRequestsSigned']) && $security['authnRequestsSigned']) {
            $signature = (new SamlAuth($settings))->buildRequestSignature($samlRequest, $params['RelayState'], $security['signatureAlgorithm']);
            $params['SigAlg'] = $security['signatureAlgorithm'];
            $params['Signature'] = $signature;
        }

        $sep = str_contains($ssoUrl, '?') ? '&' : '?';
        $url = $ssoUrl.$sep.http_build_query($params);

        return redirect()->away($url);
    }

    /**
     * ACS: consume SAMLResponse from OptiGate, provision/login user, redirect to dashboard.
     */
    public function acs(Request $request)
    {
        try {
            $samlAuth = $this->samlAuth;

            $requestId = request()->session()->pull('saml_request_id');

            $samlAuth->processResponse($requestId);

            $errors = $samlAuth->getErrors();
            if (! empty($errors)) {
                Log::error('SAML ACS errors: '.implode(', ', $errors));
                Log::error('SAML ACS NameID: '.($samlAuth->getNameId() ?? 'null'));
                Log::error('SAML ACS attributes: '.json_encode($samlAuth->getAttributes()));
                Log::error('SAML ACS raw response: '.substr($request->input('SAMLResponse', ''), 0, 200).'...');

                if (config('saml.debug', false)) {
                    return redirect('/auth/error')
                        ->with('error', 'Gagal memproses respons SAML: '.implode('; ', $errors));
                }

                return redirect('/auth/error')->with('error', 'Gagal memproses respons SAML.');
            }

            if (! $samlAuth->isAuthenticated()) {
                Log::warning('SAML authentication failed: user not authenticated');

                return redirect('/auth/error')->with('error', 'Autentikasi SAML gagal.');
            }

            $attributes = $samlAuth->getAttributes();
            $nameId = $samlAuth->getNameId();

            $first = static fn (mixed $value): mixed => is_array($value) ? ($value[0] ?? null) : $value;

            $email = $first($attributes['email'] ?? $attributes['mail'] ?? $nameId) ?? null;
            $name = $first($attributes['name'] ?? $attributes['displayName'] ?? $attributes['cn']) ?? null;
            $departmentName = $first($attributes['department']) ?? null;
            $position = $first($attributes['position']) ?? null;

            $department = null;
            if ($departmentName) {
                $department = Department::where('nama_department', $departmentName)->value('id_department');
            }

            if (! $email) {
                Log::warning('SAML assertion contains no email attribute');

                return redirect('/auth/error')->with('error', 'Atribut email tidak ditemukan dalam respons SAML.');
            }

            $user = User::updateOrCreate(
                ['email' => $email],
                [
                    'name' => $name ?? explode('@', $email)[0],
                    'email' => $email,
                    'password' => null,
                    'phone' => null,
                    'department' => $department,
                    'position' => $position,
                    'last_login_at' => now(),
                    'last_login_ip' => $request->ip(),
                ]
            );

            Auth::login($user);
            $request->session()->regenerate();

            Log::info('SAML login success: '.$email);

            return redirect()->intended('/dashboard')->with('success', 'Login berhasil melalui SAML.');
        } catch (\Exception $e) {
            Log::error('SAML ACS Exception: '.$e->getMessage());

            return redirect('/auth/error')->with('error', 'Terjadi kesalahan saat login SAML: '.$e->getMessage());
        }
    }

    /**
     * Serve SP metadata XML for OptiGate IdP registration.
     */
    public function metadata()
    {
        $samlSettings = new SamlSettings($this->getSamlSettings(), true);

        $sp = $samlSettings->getSPData();
        $xml = SamlMetadata::builder($sp);

        return response($xml)
            ->header('Content-Type', 'application/samlmetadata+xml');
    }

    /**
     * Handle Single Logout (SLO) and clear local session.
     */
    public function logout(Request $request)
    {
        try {
            $samlAuth = $this->samlAuth;

            $url = $samlAuth->logout();

            Auth::logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            return redirect($url ?: '/');
        } catch (\Exception $e) {
            Log::error('SAML SLO Exception: '.$e->getMessage());

            Auth::logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            return redirect('/');
        }
    }

    /**
     * Build the flat settings array expected by onelogin/php-saml.
     */
    protected function getSamlSettings(): array
    {
        return [
            'strict' => config('saml.strict', false),
            'debug' => config('saml.debug', false),
            'baseurl' => config('app.url'),
            'sp' => config('saml.sp', []),
            'idp' => config('saml.idp', []),
            'security' => config('saml.security', []),
        ];
    }
}
