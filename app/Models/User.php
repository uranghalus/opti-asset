<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Fortify\Contracts\PasskeyUser;
use Laravel\Fortify\PasskeyAuthenticatable;
use Laravel\Fortify\TwoFactorAuthenticatable;
use Spatie\Permission\Traits\HasRoles;

/** @use HasFactory<UserFactory> */
#[Fillable(['name', 'email', 'is_super_admin', 'password', 'tenant_id', 'department', 'last_login_at', 'last_login_ip'])]
#[Hidden(['password', 'two_factor_secret', 'two_factor_recovery_codes', 'remember_token'])]
class User extends Authenticatable implements PasskeyUser
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, HasRoles, Notifiable, PasskeyAuthenticatable, TwoFactorAuthenticatable;

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
     * The single source of truth for the super-admin bypass: the platform
     * flag or the Spatie `super-admin` role. Gate::before delegates here;
     * nothing else should re-implement the two-source check.
     *
     * @see https://spatie.be/docs/laravel-permission/v8/basic-usage/super-admin
     */
    public function isSuperAdmin(): bool
    {
        return $this->is_super_admin || $this->hasRole('super-admin');
    }
}
