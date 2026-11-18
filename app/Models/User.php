<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Fortify\Contracts\PasskeyUser;
use Laravel\Fortify\PasskeyAuthenticatable;
use Laravel\Fortify\TwoFactorAuthenticatable;
use Spatie\Permission\Traits\HasRoles;

/** @use HasFactory<UserFactory> */
#[Fillable(['name', 'email', 'is_super_admin', 'password', 'tenant_id', 'department', 'last_login_at', 'last_login_ip', 'employee_id'])]
#[Hidden(['password', 'two_factor_secret', 'two_factor_recovery_codes', 'remember_token', 'employee_id'])]
class User extends Authenticatable implements PasskeyUser
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, HasRoles, Notifiable, PasskeyAuthenticatable, TwoFactorAuthenticatable;

    public const ROLE_SUPER_ADMIN = 'super-admin';

    public const ROLE_GUEST = 'guest';

    /**
     * Role yang tidak boleh dicabut oleh sinkronisasi dari Employee:
     * `guest` (landing role untuk akun tanpa role employee) dan
     * `super-admin` (akses platform, diberikan langsung pada User).
     *
     * @var list<string>
     */
    public const PROTECTED_ROLE_NAMES = [self::ROLE_GUEST, self::ROLE_SUPER_ADMIN];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_super_admin' => 'boolean',
            'two_factor_confirmed_at' => 'datetime',
            'last_login_at' => 'datetime',
        ];
    }

    /**
     * Employee record linked to this login user. Bypasses the Employee
     * tenant global scope so the relation resolves even when no tenant is
     * current (e.g. during SAML ACS, before any tenant context exists).
     *
     * @return BelongsTo<Employee, $this>
     */
    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'employee_id', 'id_employee')->withoutGlobalScopes();
    }

    /**
     * The single source of truth for the super-admin bypass: the platform
     * flag or the Spatie `super-admin` role (both spellings exist in the
     * `roles` table — hyphenated and underscored). Gate::before delegates
     * here; nothing else should re-implement this check.
     *
     * @see https://spatie.be/docs/laravel-permission/v8/basic-usage/super-admin
     */
    public function isSuperAdmin(): bool
    {
        return $this->is_super_admin || $this->hasRole(self::ROLE_SUPER_ADMIN) || $this->hasRole('super_admin');
    }
}
