<?php

namespace App\Services;

use App\Models\Tenant;
use App\Models\User;
use Illuminate\Support\Facades\Log;

/**
 * Resolves the unit bisnis (tenant) for a SAML-authenticated user.
 *
 * The Optigate assertion carries only the company NAME (verified against a
 * real assertion dump — no code or ID attribute), so the lookup is an exact,
 * trimmed, case-insensitive match on tenants.name. Tenants are never created
 * here; they come only from the Optigate API sync.
 */
class SamlTenantResolver
{
    /** The SAML attribute carrying the Optigate company name. */
    protected const COMPANY_ATTRIBUTE = 'company';

    public const REASON_NO_COMPANY_DATA = 'no_company_data';

    public const REASON_NO_MATCH = 'no_match';

    public const REASON_MULTIPLE_MATCHES = 'multiple_matches';

    public const REASON_INACTIVE = 'inactive';

    /**
     * Platform-level bypass: this account may reach any unit bisnis without
     * being tied to the company in the assertion. Single source of truth is
     * User::isSuperAdmin().
     */
    public function canAccessAnyTenant(User $user): bool
    {
        return $user->isSuperAdmin();
    }

    /**
     * Resolve the tenant for a SAML assertion, or deny with a reason.
     *
     * @param  array<string, mixed>  $attributes  SAML attributes from onelogin/php-saml
     */
    public function resolve(array $attributes): SamlTenantResolution
    {
        $companyName = $this->companyNameFrom($attributes);

        if ($companyName === null) {
            Log::warning('SAML tenant resolution: no company data in assertion');

            return SamlTenantResolution::denied(static::REASON_NO_COMPANY_DATA);
        }

        $matches = Tenant::whereRaw('LOWER(TRIM(name)) = LOWER(TRIM(?))', [$companyName])->get();

        if ($matches->isEmpty()) {
            Log::warning('SAML tenant resolution: no tenant matches company name', [
                'company' => $companyName,
            ]);

            return SamlTenantResolution::denied(static::REASON_NO_MATCH);
        }

        if ($matches->count() > 1) {
            Log::warning('SAML tenant resolution: multiple tenants match company name', [
                'company' => $companyName,
                'count' => $matches->count(),
            ]);

            return SamlTenantResolution::denied(static::REASON_MULTIPLE_MATCHES);
        }

        $tenant = $matches->first();

        if (! $tenant->is_active) {
            Log::warning('SAML tenant resolution: matched tenant is inactive', [
                'company' => $companyName,
                'tenant_id' => $tenant->id,
            ]);

            return SamlTenantResolution::denied(static::REASON_INACTIVE);
        }

        Log::info('SAML tenant resolution: tenant found', [
            'company' => $companyName,
            'tenant_id' => $tenant->id,
            'tenant_code' => $tenant->code,
        ]);

        return SamlTenantResolution::found($tenant);
    }

    /**
     * Extract the company name from SAML attributes.
     *
     * onelogin/php-saml returns attributes as arrays of values; take the first.
     *
     * @param  array<string, mixed>  $attributes
     */
    private function companyNameFrom(array $attributes): ?string
    {
        $value = $attributes[static::COMPANY_ATTRIBUTE] ?? null;

        if ($value === null) {
            return null;
        }

        if (is_array($value)) {
            $value = $value[0] ?? null;
        }

        if ($value === null || $value === '') {
            return null;
        }

        return (string) $value;
    }
}
