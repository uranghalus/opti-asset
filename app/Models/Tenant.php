<?php

namespace App\Models;

use Database\Factories\TenantFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Support\Carbon;
use Spatie\Multitenancy\Models\Tenant as SpatieTenant;

/**
 * @property int $id
 * @property string $name
 * @property string $domain
 * @property string $database
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
class Tenant extends SpatieTenant
{
    /** @use HasFactory<TenantFactory> */
    use HasFactory;

    protected $fillable = [
        'name',
        'domain',
        'database',
    ];

    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class)
            ->withPivot('role')
            ->withTimestamps();
    }

    public function scopeForUser($query, User $user)
    {
        return $query->whereHas('users', fn ($q) => $q->where('users.id', $user->id));
    }

    public function isSuperAdmin(?User $user = null): bool
    {
        $user = $user ?? auth()->user();

        if (! $user) {
            return false;
        }

        return $this->users()->wherePivot('user_id', $user->id)->wherePivot('role', 'super_admin')->exists();
    }
}
