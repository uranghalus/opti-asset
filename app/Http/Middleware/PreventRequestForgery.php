<?php

namespace App\Http\Middleware;

use Illuminate\Foundation\Http\Middleware\PreventRequestForgery as BasePreventRequestForgery;

class PreventRequestForgery extends BasePreventRequestForgery
{
    /**
     * The URIs that should be excluded from CSRF verification.
     *
     * The SAML ACS endpoint receives POSTs from OptiGate (the IdP), which
     * does not send a Laravel CSRF token. Exempt it from CSRF verification.
     *
     * @var array<int, string>
     */
    protected $except = [
        'auth/saml/opti-saml-acs',
    ];
}
