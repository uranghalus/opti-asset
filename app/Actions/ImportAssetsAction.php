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
 * @phpstan-type ImportResult array{
 *     imported: int,
 *     skipped: int,
 *     errors: array<int, array{row: int, message: string}>,
 * }
 */
class ImportAssetsAction
{
    public function __construct(
        private readonly GenerateAssetCodeAction $generateCode,
    ) {}

    /**
     * Import spreadsheet rows as assets belonging to the given item. The
     * asset code is derived from the item's category.
     */
    public function __invoke(string $filePath, Item $item): array
    {
        $rows = SimpleExcelReader::create($filePath)
            ->headersToSnakeCase()
            ->getRows();

        $category = $item->category;
        $chain = $category ? $this->generateCode->fromCategory($category) : null;

        $locations = Location::pluck('id', 'name');
        $departments = Department::pluck('id_department', 'nama_department');
        $existingSerials = Asset::query()
            ->whereNotNull('serial_number')
            ->pluck('serial_number')
            ->map(fn ($value) => Str::upper(trim((string) $value)))
            ->all();

        $imported = 0;
        $skipped = 0;
        $errors = [];
        $serials = $existingSerials;
        $lastAssetId = null;

        DB::transaction(function () use (
            $rows,
            $item,
            $category,
            $chain,
            &$imported,
            &$skipped,
            &$errors,
            &$serials,
            &$lastAssetId,
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

                if ($category && $chain) {
                    $chain = $this->generateCode->fromCategory($category, $lastAssetId);
                }

                $data = [
                    'item_id' => $item->id,
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
                    'kode_asset' => $chain['kode_asset'] ?? null,
                    'asset_group_id' => $chain['asset_group_id'] ?? null,
                    'asset_category_id' => $chain['asset_category_id'] ?? null,
                    'asset_cluster_id' => $chain['asset_cluster_id'] ?? null,
                    'asset_sub_cluster_id' => $chain['asset_sub_cluster_id'] ?? null,
                ];

                $asset = Asset::query()->create($data);
                $lastAssetId = $asset->id;

                $imported++;
            }
        });

        return [
            'imported' => $imported,
            'skipped' => $skipped,
            'errors' => $errors,
        ];
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
            return 'ACT';
        }

        return match (mb_strtolower($value)) {
            'aktif', 'active', 'act' => 'ACT',
            'dipinjamkan', 'loan', 'dipinjam' => 'LOAN',
            'dalam perbaikan', 'perbaikan', 'maintenance', 'rpr', 'rusak' => 'RPR',
            'dimutasi', 'mutasi', 'mut' => 'MUT',
            'dihapus', 'disposed', 'pensiun', 'dsp' => 'DSP',
            default => mb_strtoupper($value),
        };
    }
}
