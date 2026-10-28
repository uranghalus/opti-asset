<?php

return [

    /*
    |--------------------------------------------------------------------------
    | SAML 2.0 Service Provider settings (onelogin/php-saml)
    |--------------------------------------------------------------------------
    |
    | OptiAsset acts as the Service Provider (SP); OptiGate
    | (gate.appdutamall.com) acts as the Identity Provider (IdP).
    */

    'strict' => env('SAML_STRICT', true),
    'debug' => env('SAML_DEBUG', false),

    'idp' => [
        'entityId' => env('SAML_IDP_ENTITY_ID', 'https://gate.appdutamall.com/saml/metadata'),
        'singleSignOnService' => [
            'url' => env('SAML_IDP_SSO_URL', 'https://gate.appdutamall.com/saml/sso'),
            'binding' => 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect',
        ],
        'singleLogoutService' => [
            'url' => env('SAML_IDP_SLO_URL', 'https://gate.appdutamall.com/saml/slo'),
            'binding' => 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect',
        ],
        'x509cert' => env('SAML_IDP_CERT'),
    ],

    'sp' => [
        'entityId' => env('SAML_SP_ENTITY_ID', 'http://localhost:8000/auth/saml/opti-saml-metadata'),
        'assertionConsumerService' => [
            'url' => env('SAML_SP_ACS_URL', 'http://localhost:8000/auth/saml/opti-saml-acs'),
            'binding' => 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST',
        ],
        'singleLogoutService' => [
            'url' => env('SAML_SP_SLO_URL', 'http://localhost:8000/auth/saml/opti-saml-logout'),
            'binding' => 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect',
        ],
        'NameIDFormat' => 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress',
        'x509cert' => env('SAML_SP_CERT'),
        'privateKey' => env('SAML_SP_PRIVATE_KEY'),
    ],

    'security' => [
        'NameIDEncrypted' => false,
        'attributesEncrypted' => false,
        'wantMessagesSigned' => env('SAML_WANT_MESSAGES_SIGNED', false),
        'wantAssertionsSigned' => env('SAML_WANT_ASSERTIONS_SIGNED', true),
        'wantNameId' => true,
        'requestedAuthnContext' => false,
    ],

];
