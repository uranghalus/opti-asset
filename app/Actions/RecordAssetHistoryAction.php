<?php

namespace App\Actions;

use App\Models\Asset;
use App\Models\Department;
use App\Models\Location;
use App\Models\User;
use Illuminate\Support\Carbon;

class RecordAssetHistoryAction
{
    /**
     * Persist an explicit list of lifecycle change tuples.
     *
     * @param  array<int, array{0: string, 1: string|null, 2: string|null}>  $entries
     */
    public function record(Asset $asset, array $entries, ?User $actor = null, ?Carbon $at = null): void
    {
        if ($entries === []) {
            return;
        }

        $now = $at ?? now();

        $asset->histories()->createMany(array_map(
            fn (array $entry): array => [
                'field' => $entry[0],
                'old_value' => $entry[1],
                'new_value' => $entry[2],
                'changed_by' => $actor?->id,
                'changed_by_name' => $actor?->name,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            $entries,
        ));
    }

    /**
     * Record the lifecycle fields that differ between the validated input
     * and the asset's current state, so the detail page shows an audit trail.
     *
     * @param  array<string, mixed>  $validated
     */
    public function fromUpdate(Asset $asset, array $validated, ?string $kodeAsset, ?User $actor): void
    {
        $entries = [];

        if (array_key_exists('status', $validated) && $validated['status'] !== $asset->status->value) {
            $entries[] = ['status', $asset->status->value, $validated['status']];
        }

        if (array_key_exists('condition', $validated) && $validated['condition'] !== $asset->condition) {
            $entries[] = ['condition', $asset->condition, $validated['condition']];
        }

        if (array_key_exists('location_id', $validated) && $validated['location_id'] !== $asset->location_id) {
            $entries[] = [
                'location_id',
                $this->locationName($asset->location_id),
                $this->locationName($validated['location_id']),
            ];
        }

        if (array_key_exists('department_id', $validated) && $validated['department_id'] !== $asset->department_id) {
            $entries[] = [
                'department_id',
                $this->departmentName($asset->department_id),
                $this->departmentName($validated['department_id']),
            ];
        }

        if (array_key_exists('pic', $validated) && $validated['pic'] !== $asset->pic) {
            $entries[] = [
                'pic',
                is_array($asset->pic) ? implode(', ', $asset->pic) : (string) $asset->pic,
                is_array($validated['pic']) ? implode(', ', $validated['pic']) : (string) $validated['pic'],
            ];
        }

        if ($kodeAsset !== null && $kodeAsset !== $asset->kode_asset) {
            $entries[] = ['kode_asset', $asset->kode_asset, $kodeAsset];
        }

        $this->record($asset, $entries, $actor);
    }

    private function locationName(?string $id): ?string
    {
        if ($id === null || $id === '') {
            return null;
        }

        return Location::query()->whereKey($id)->value('name');
    }

    private function departmentName(?string $id): ?string
    {
        if ($id === null || $id === '') {
            return null;
        }

        return Department::query()->whereKey($id)->value('nama_department');
    }
}
