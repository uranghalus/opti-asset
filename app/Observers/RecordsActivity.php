<?php

namespace App\Observers;

use App\Models\ActivityLog;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

/**
 * Records create/update/delete activity for the observed models.
 *
 * The observer is tenant-aware: ActivityLog fills its own tenant_id via
 * BelongsToTenant, so rows always land in the currently active tenant.
 */
class RecordsActivity
{
    /** @var array<int, string> */
    private const NOISE_ATTRIBUTES = ['updated_at', 'created_at'];

    public function created(Model $model): void
    {
        $this->log($model, 'created');
    }

    public function updated(Model $model): void
    {
        $changes = $this->meaningfulChanges($model);

        if ($changes === []) {
            return;
        }

        $this->log($model, 'updated', $changes);
    }

    public function deleted(Model $model): void
    {
        $this->log($model, 'deleted');
    }

    /**
     * @return array<string, array{old: mixed, new: mixed}>
     */
    private function meaningfulChanges(Model $model): array
    {
        $changes = [];

        foreach ($model->getChanges() as $attribute => $new) {
            if (in_array($attribute, self::NOISE_ATTRIBUTES, true)) {
                continue;
            }

            $changes[$attribute] = [
                'old' => $model->getRawOriginal($attribute),
                'new' => $new,
            ];
        }

        return $changes;
    }

    /**
     * @param  array<string, array{old: mixed, new: mixed}>|null  $properties
     */
    private function log(Model $model, string $action, ?array $properties = null): void
    {
        $user = auth()->user();

        ActivityLog::query()->create([
            'user_id' => $user?->getAuthIdentifier(),
            'user_name' => $user?->name,
            'action' => $action,
            'subject_type' => class_basename($model),
            'subject_id' => $model->getKey(),
            'subject_label' => $this->resolveLabel($model),
            'properties' => $properties,
        ]);
    }

    private function resolveLabel(Model $model): ?string
    {
        foreach (['name', 'nama_employee', 'nama_department', 'kode_asset', 'code'] as $attribute) {
            $value = $model->getAttribute($attribute);

            if (is_string($value) && $value !== '') {
                return Str::limit($value, 100);
            }
        }

        return null;
    }
}
