<?php

namespace App\Actions;

use App\Models\Asset;
use App\Models\Department;
use App\Models\Item;
use App\Models\Location;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Spatie\SimpleExcel\SimpleExcelReader;

/**
 * @phpstan-type ClassificationIds array{
 *     asset_group_id: string,
 *     asset_category_id: string,
 *     asset_cluster_id: string,
 *     asset_sub_cluster_id: string,
 * }
 */
class ImportAssetsAction
{
    public function __construct(
        private readonly GenerateAssetCodeAction $generateCode,
    ) {}

    /**
     * @param  ClassificationIds  $classification
     * @return array{imported: int, created_items: int, skipped: int, errors: array<int, array{row: int, message: string}>}
     */
    public function __invoke(string $filePath, array $classification): array
    {
        $rows = SimpleExcelReader::create($filePath)
            ->headersToSnakeCase()
            ->getRows();

        $itemsByName = Item::query()->pluck('id', 'name');
        $locations = Location::pluck('id', 'name');
        $departments = Department::pluck('id_department', 'nama_department');
        $existingSerials = Asset::query()
            ->whereNotNull('serial_number')
            ->pluck('serial_number')
            ->map(fn ($value) => Str::upper(trim((string) $value)))
            ->all();

        $imported = 0;
        $createdItems = 0;
        $skipped = 0;
        $errors = [];
        $serials = $existingSerials;

        DB::transaction(function () use (
            $rows,
            &$imported,
            &$createdItems,
            &$skipped,
            &$errors,
            &$serials,
            $classification,
            &$itemsByName,
            $locations,
            $departments,
        ): void {
            foreach ($rows as $index => $row) {
                if ($this->isEmptyRow($row)) {
                    continue;
                }

                $line = $index + 2;
                $serial = $row['serial_number'] ?? null;

                if ($serial !== null && $serial !== '') {
                    $normalized = Str::upper(trim((string) $serial));

                    if (isset($serials[$normalized])) {
                        $skipped++;
                        $errors[] = ['row' => $line, 'message' => "Nomor seri {$serial} duplikat dalam satu file."];

                        continue;
                    }

                    $serials[$normalized] = true;
                }

                [$itemId, $itemWasCreated] = $this->resolveItem($row['item'] ?? null, $itemsByName);

                if ($itemWasCreated) {
                    $createdItems++;
                }

                $assetCode = $this->generateCode->fromIds(
                    groupId: $classification['asset_group_id'],
                    categoryId: $classification['asset_category_id'],
                    clusterId: $classification['asset_cluster_id'],
                    subClusterId: $classification['asset_sub_cluster_id'],
                )['code'];

                $data = [
                    'kode_asset' => $assetCode ?? null,
                    'item_id' => $itemId,
                    'condition' => $this->valueOrNull($row['kondisi'] ?? null),
                    'purchase_date' => $this->parseDate($row['tanggal_pembelian'] ?? null),
                    'purchase_price' => $this->parsePrice($row['harga_pembelian'] ?? null),
                    'location_id' => $this->findId($locations, $row['lokasi'] ?? null),
                    'department_id' => $this->findId($departments, $row['department'] ?? null),
                    'brand' => $this->valueOrNull($row['brand'] ?? null),
                    'model' => $this->valueOrNull($row['model'] ?? null),
                    'part_number' => $this->valueOrNull($row['part_number'] ?? null),
                    'serial_number' => $this->valueOrNull($serial),
                    'no_spb' => $this->valueOrNull($row['no_spb'] ?? null),
                    'document_number' => $this->valueOrNull($row['nomor_dokumen'] ?? null),
                    'pic' => $this->arrayOrNull($row['pic'] ?? null),
                    'notes' => $this->valueOrNull($row['catatan'] ?? null),
                    'status' => $this->normalizeStatus($row['status'] ?? null),
                    'vendor_name' => $this->valueOrNull($row['vendor'] ?? null),
                    ...$classification,
                ];

                Asset::query()->create($data);

                $imported++;
            }
        });

        return [
            'imported' => $imported,
            'created_items' => $createdItems,
            'skipped' => $skipped,
            'errors' => $errors,
        ];
    }

    /**
     * Resolve an item by its exact name, falling back to a case-insensitive
     * match, then creating a new item when none exists. Created items are
     * reused across rows in the same import.
     *
     * @param  Collection<string, string>  $itemsByName
     * @return array{string|null, bool}
     */
    private function resolveItem(mixed $value, Collection $itemsByName): array
    {
        $name = $this->valueOrNull($value);

        if ($name === null) {
            return [null, false];
        }

        $id = $itemsByName[$name]
            ?? $itemsByName->first(fn ($id, $key) => mb_strtolower((string) $key) === mb_strtolower($name))
            ?? Item::query()->whereRaw('LOWER(name) = ?', [mb_strtolower($name)])->value('id');

        if (is_string($id) && $id !== '') {
            return [$id, false];
        }

        $item = Item::query()->create([
            'code' => $this->makeItemCode($name),
            'name' => $name,
        ]);

        $itemsByName->put($item->name, $item->id);

        return [$item->id, true];
    }

    private function makeItemCode(string $name): string
    {
        $base = 'ITM-'.Str::upper(Str::substr(Str::slug($name, ''), 0, 6));

        do {
            $code = $base.'-'.Str::upper(Str::random(4));
        } while (Item::query()->where('code', $code)->exists());

        return $code;
    }

    /**
     * @param  array<string, mixed>  $row
     */
    private function isEmptyRow(array $row): bool
    {
        return count(array_filter($row, fn ($value) => $value !== null && $value !== '')) === 0;
    }

    private function valueOrNull(mixed $value): ?string
    {
        $value = trim((string) $value);

        return $value === '' ? null : $value;
    }

    /** @return array<int, string>|null */
    private function arrayOrNull(mixed $value): ?array
    {
        $value = $this->valueOrNull($value);

        return $value === null ? null : [$value];
    }

    /**
     * @param  Collection<string, string>  $lookup
     */
    private function findId(Collection $lookup, mixed $key): ?string
    {
        $key = $this->valueOrNull($key);

        if ($key === null) {
            return null;
        }

        $id = $lookup->get($key) ?? $lookup->first(fn ($value, $lookupKey) => mb_strtolower((string) $lookupKey) === mb_strtolower($key));

        return is_string($id) && $id !== '' ? $id : null;
    }

    private function parseDate(mixed $value): ?string
    {
        $value = $this->valueOrNull($value);

        if ($value === null) {
            return null;
        }

        $date = strtotime($value);

        if ($date === false) {
            return $value;
        }

        return date('Y-m-d', $date);
    }

    private function parsePrice(mixed $value): ?string
    {
        $value = $this->valueOrNull($value);

        if ($value === null) {
            return null;
        }

        $value = str_replace('.', '', $value);
        $value = str_replace(',', '.', $value);

        return is_numeric($value) ? number_format((float) $value, 2, '.', '') : null;
    }

    private function normalizeStatus(mixed $value): string
    {
        $value = $this->valueOrNull($value);

        if ($value === null) {
            return 'ACTIVE';
        }

        return match (mb_strtolower($value)) {
            'aktif', 'active' => 'ACTIVE',
            'nonaktif', 'inactive' => 'INACTIVE',
            'dihapus', 'disposed' => 'DISPOSED',
            default => mb_strtoupper($value),
        };
    }
}
