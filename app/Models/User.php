<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Builder as EloquentBuilder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Query\Builder as QueryBuilder;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Carbon;
use Laravel\Fortify\Contracts\PasskeyUser;
use Laravel\Fortify\PasskeyAuthenticatable;
use Laravel\Fortify\TwoFactorAuthenticatable;
use MongoDB\Laravel\Auth\User as Authenticatable;

/**
 * @property int $id
 * @property string $name
 * @property string $email
 * @property Carbon|null $email_verified_at
 * @property string $password
 * @property string|null $two_factor_secret
 * @property string|null $two_factor_recovery_codes
 * @property Carbon|null $two_factor_confirmed_at
 * @property string|null $remember_token
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property string|null $tenant_id
 */
#[Fillable(['name', 'email', 'password', 'tenant_id'])]
#[Hidden(['password', 'two_factor_secret', 'two_factor_recovery_codes', 'remember_token'])]
class User extends Authenticatable implements PasskeyUser
{
    use HasFactory, Notifiable, PasskeyAuthenticatable, TwoFactorAuthenticatable;

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'two_factor_confirmed_at' => 'datetime',
        ];
    }

    protected function newBaseQueryBuilder()
    {
        $connection = $this->getConnection();

        if ($connection->getDriverName() === 'mongodb') {
            return parent::newBaseQueryBuilder();
        }

        return new QueryBuilder($connection, $connection->getQueryGrammar(), $connection->getPostProcessor());
    }

    public function newEloquentBuilder($query)
    {
        if ($this->getConnection()->getDriverName() === 'mongodb') {
            return parent::newEloquentBuilder($query);
        }

        return new EloquentBuilder($query);
    }

    public function originalIsEquivalent($key): bool
    {
        if ($this->getConnection()->getDriverName() === 'mongodb') {
            return parent::originalIsEquivalent($key);
        }

        return Model::originalIsEquivalent($key);
    }

    public function tenants()
    {
        return $this->belongsToMany(Tenant::class, 'user_tenants', 'user_id', 'tenant_id');
    }
}
