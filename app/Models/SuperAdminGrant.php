<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int|null $granted_by_user_id
 * @property int|null $granted_to_user_id
 * @property string|null $reason
 * @property Carbon|null $granted_at
 * @property int|null $revoked_by_user_id
 * @property Carbon|null $revoked_at
 * @property string|null $revoked_reason
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property Carbon|null $deleted_at
 */
#[Fillable([
    'granted_by_user_id',
    'granted_to_user_id',
    'reason',
    'granted_at',
    'revoked_by_user_id',
    'revoked_at',
    'revoked_reason',
])]
class SuperAdminGrant extends Model
{
    use SoftDeletes;

    protected function casts(): array
    {
        return [
            'granted_at' => 'datetime',
            'revoked_at' => 'datetime',
        ];
    }

    public function grantedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'granted_by_user_id');
    }

    public function grantedTo(): BelongsTo
    {
        return $this->belongsTo(User::class, 'granted_to_user_id');
    }

    public function revokedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'revoked_by_user_id');
    }

    public function scopeActive($query)
    {
        return $query->whereNull('revoked_at');
    }

    public function scopeRevoked($query)
    {
        return $query->whereNotNull('revoked_at');
    }
}
