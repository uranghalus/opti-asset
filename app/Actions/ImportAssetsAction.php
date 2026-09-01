<?php

namespace App\Actions;

use App\Models\Asset;
use App\Models\AssetCategory;
use App\Models\AssetCluster;
use App\Models\AssetGroup;
use App\Models\AssetSubCluster;
use App\Models\Category;
use App\Models\Department;
use App\Models\Item;
use App\Models\Location;
use DateTimeInterface;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
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
    /**
     * Header aliases mapped to logical fields, compared after stripping every
     * non-alphanumeric character and lowercasing. Covers both the generated
     * template ("Serial Number", "Harga Pembelian", ...) and typical office
     * exports ("Unit", "Model/ Type", "Dept", "Kode Asset",
     * "Tgl/Bln/Thn Pengadaan", "Kondisi Baik/Rusak", ...).
     *
     * @var array<string, string>
     */
    private const ALIASES = [
        'lantai' => 'location',
        'lokasi' => 'location',
        'location' => 'location',
        'dept' => 'department',
        'departemen' => 'department',
        'department' => 'department',
        'unit' => 'item',
        'barang' => 'item',
        'namabarang' => 'item',
        'model' => 'model',
        'modeltype' => 'model',
        'tipe' => 'model',
        'brand' => 'brand',
        'merek' => 'brand',
        'pic' => 'pic',
        'kodeasset' => 'kode',
        'kode' => 'kode',
        'baik' => 'cond_good',
        'rusak' => 'cond_bad',
        'kondisi' => 'condition',
        'noseri' => 'serial',
        'noserial' => 'serial',
        'serialnumber' => 'serial',
        'serial' => 'serial',
        'partnumber' => 'part_number',
        'nospb' => 'no_spb',
        'nomordokumen' => 'document_number',
        'nodokumen' => 'document_number',
        'status' => 'status',
        'vendor' => 'vendor',
        'pengadaan' => 'purchase_date',
        'tanggalpengadaan' => 'purchase_date',
        'tglblnthnpengadaan' => 'purchase_date',
        'tanggalpembelian' => 'purchase_date',
        'hargapembelian' => 'purchase_price',
        'harga' => 'purchase_price',
        'catatan' => 'notes',
        'keterangan' => 'notes',
        'notes' => 'notes',
    ];

    /**
     * A spreadsheet row only counts as an asset row when at least one of these
     * fields is filled; everything else (titles, blank separators) is skipped.
     *
     * @var array<int, string>
     */
    private const IDENTITY_FIELDS = ['item', 'kode', 'serial', 'model', 'brand'];

    public function __construct(
        private readonly GenerateAssetCodeAction $generateCode,
    ) {}

    /**
     * Import spreadsheet rows as assets. Rows may carry their own item name
     * ("Unit") and asset code ("Kode Asset"); both fall back to the selected
     * item and its category-generated code.
     *
     * @return ImportResult
     */
    public function __invoke(string $filePath, Item $fallbackItem): array
    {
        $rows = SimpleExcelReader::create($filePath)
            ->noHeaderRow()
            ->preserveEmptyRows()
            ->getRows();

        $locations = Location::query()->pluck('id', 'name');
        $departments = Department::query()->pluck('id_department', 'nama_department');

        // ponytail: in-memory dedupe sets; stream to a store if imports hit six figures.
        $serials = [];
        $kodes = [];

        foreach (Asset::query()->whereNotNull('serial_number')->pluck('serial_number') as $value) {
            $serials[Str::upper(trim((string) $value))] = true;
        }

        foreach (Asset::query()->whereNotNull('kode_asset')->pluck('kode_asset') as $value) {
            $kodes[Str::upper(trim((string) $value))] = true;
        }

        $imported = 0;
        $skipped = 0;
        $errors = [];
        $items = [];
        $missingDepartments = [];

        DB::transaction(function () use (
            $rows,
            $fallbackItem,
            $locations,
            $departments,
            &$imported,
            &$skipped,
            &$errors,
            &$serials,
            &$kodes,
            &$items,
            &$missingDepartments,
        ): void {
            /** @var array<int, string> $map spreadsheet column index => logical field */
            $map = [];

            foreach ($rows as $index => $cells) {
                $line = is_int($index) ? $index + 1 : 0;

                $headerFields = $this->matchHeaderRow($cells);

                if ($headerFields !== null) {
                    // Last header wins: files stack a generic label ("Keterangan")
                    // above specific ones ("NO. SERI") on the same column.
                    foreach ($headerFields as $column => $field) {
                        $map[$column] = $field;
                    }

                    continue;
                }

                if ($map === []) {
                    continue;
                }

                $row = $this->mapRow($map, $cells);

                if (! $this->isAssetRow($row)) {
                    continue;
                }

                $serial = $this->valueOrNull($row['serial'] ?? null);

                if ($serial !== null) {
                    $normalizedSerial = Str::upper($serial);

                    if (isset($serials[$normalizedSerial])) {
                        $skipped++;
                        $errors[] = ['row' => $line, 'message' => "Nomor seri {$serial} duplikat (sudah terdaftar atau ganda dalam file)."];

                        continue;
                    }

                    $serials[$normalizedSerial] = true;
                }

                $fileKode = $this->valueOrNull($row['kode'] ?? null);

                if ($fileKode !== null) {
                    $normalizedKode = Str::upper($fileKode);

                    if (isset($kodes[$normalizedKode])) {
                        $skipped++;
                        $errors[] = ['row' => $line, 'message' => "Kode aset {$fileKode} duplikat (sudah terdaftar atau ganda dalam file)."];

                        continue;
                    }

                    $kodes[$normalizedKode] = true;
                }

                $itemName = $this->valueOrNull($row['item'] ?? null);
                $item = $itemName !== null
                    ? $this->resolveItem($itemName, $items)
                    : $fallbackItem->loadMissing('category');

                $locationName = $this->valueOrNull($row['location'] ?? null);
                $locationId = $locationName !== null
                    ? $this->findOrCreateLocation($locations, $locationName)
                    : null;

                $departmentName = $this->valueOrNull($row['department'] ?? null);
                $departmentId = $departmentName !== null
                    ? $this->findId($departments, $departmentName)
                    : null;

                if ($departmentName !== null && $departmentId === null) {
                    $missingDepartments[mb_strtolower($departmentName)] = $departmentName;
                }

                $data = [
                    'item_id' => $item->id,
                    'condition' => $this->resolveCondition($row),
                    'purchase_date' => $this->parseDate($row['purchase_date'] ?? null),
                    'purchase_price' => $this->parsePrice($row['purchase_price'] ?? null),
                    'location_id' => $locationId,
                    'department_id' => $departmentId,
                    'brand' => $this->valueOrNull($row['brand'] ?? null),
                    'model' => $this->valueOrNull($row['model'] ?? null),
                    'part_number' => $this->valueOrNull($row['part_number'] ?? null),
                    'serial_number' => $serial,
                    'no_spb' => $this->valueOrNull($row['no_spb'] ?? null),
                    'document_number' => $this->valueOrNull($row['document_number'] ?? null),
                    'pic' => $this->arrayOrNull($row['pic'] ?? null),
                    'notes' => $this->buildNotes($row),
                    'status' => $this->normalizeStatus($row['status'] ?? null),
                    'vendor_name' => $this->valueOrNull($row['vendor'] ?? null),
                ];

                if ($fileKode !== null) {
                    $result = $this->resolveClassificationFromKode($fileKode);

                    if ($result['classification'] !== null) {
                        $data['asset_group_id'] = $result['classification']['group_id'];
                        $data['asset_category_id'] = $result['classification']['category_id'];
                        $data['asset_cluster_id'] = $result['classification']['cluster_id'];
                        $data['asset_sub_cluster_id'] = $result['classification']['subcluster_id'];
                    } else {
                        foreach ($result['errors'] as $error) {
                            $errors[] = ['row' => $line, 'message' => $error];
                        }

                        $data['asset_group_id'] = null;
                        $data['asset_category_id'] = null;
                        $data['asset_cluster_id'] = null;
                        $data['asset_sub_cluster_id'] = null;
                    }
                } else {
                    $chain = null;

                    if (($category = $item->category) !== null) {
                        $chain = $this->generateCode->fromCategory($category);
                    }

                    $data['asset_group_id'] = $chain['asset_group_id'] ?? null;
                    $data['asset_category_id'] = $chain['asset_category_id'] ?? null;
                    $data['asset_cluster_id'] = $chain['asset_cluster_id'] ?? null;
                    $data['asset_sub_cluster_id'] = $chain['asset_sub_cluster_id'] ?? null;
                }

                $data['kode_asset'] = $fileKode ?? $chain['kode_asset'] ?? null;

                Asset::query()->create($data);

                $imported++;
            }

            foreach ($missingDepartments as $name) {
                $errors[] = ['row' => 0, 'message' => "Department '{$name}' tidak ditemukan di master data; kolom department dikosongkan."];
            }
        });

        return [
            'imported' => $imported,
            'skipped' => $skipped,
            'errors' => $errors,
        ];
    }

    /**
     * Detect a header row anywhere in the sheet (files often start with title
     * rows and repeat headers per section). Returns column index => field.
     *
     * @param  array<int|string, mixed>  $cells
     * @return array<int, string>|null
     */
    private function matchHeaderRow(array $cells): ?array
    {
        $fields = [];

        foreach ($cells as $column => $value) {
            $field = self::ALIASES[$this->normalizeHeader($value)] ?? null;

            if ($field !== null && is_int($column)) {
                $fields[$column] = $field;
            }
        }

        return count($fields) >= 2 ? $fields : null;
    }

    private function normalizeHeader(mixed $value): string
    {
        /** @var string $stripped */
        $stripped = preg_replace('/[^a-zA-Z0-9]+/', '', $this->stringify($value)) ?? '';

        return mb_strtolower($stripped);
    }

    private function stringify(mixed $value): string
    {
        return $value instanceof DateTimeInterface ? $value->format('Y-m-d') : (string) $value;
    }

    /**
     * @param  array<int, string>  $map
     * @param  array<int|string, mixed>  $cells
     * @return array<string, mixed>
     */
    private function mapRow(array $map, array $cells): array
    {
        $row = [];

        foreach ($map as $column => $field) {
            if (! array_key_exists($field, $row)) {
                $row[$field] = $cells[$column] ?? '';
            }
        }

        return $row;
    }

    /**
     * @param  array<string, mixed>  $row
     */
    private function isAssetRow(array $row): bool
    {
        foreach (self::IDENTITY_FIELDS as $field) {
            if ($this->valueOrNull($row[$field] ?? null) !== null) {
                return true;
            }
        }

        return false;
    }

    /**
     * Find an existing item by name or create it so office exports that mix
     * several units in one file import without pre-registering every item.
     *
     * @param  array<string, Item>  $cache
     */
    private function resolveItem(string $name, array &$cache): Item
    {
        $key = mb_strtolower(trim($name));

        if (isset($cache[$key])) {
            return $cache[$key];
        }

        // ponytail: md5 code keeps re-imports deterministic; swap for a sequence if codes must be readable.
        $item = Item::query()->whereRaw('lower(name) = ?', [$key])->first()
            ?? Item::query()->create([
                'code' => 'ITM-'.Str::upper(substr(md5($key), 0, 8)),
                'name' => trim($name),
            ]);

        $item->loadMissing('category');

        return $cache[$key] = $item;
    }

    /**
     * @param  array<string, mixed>  $row
     */
    private function resolveCondition(array $row): string
    {
        if ($this->valueOrNull($row['cond_bad'] ?? null) !== null) {
            return 'Rusak';
        }

        if ($this->valueOrNull($row['cond_good'] ?? null) !== null) {
            return 'Baik';
        }

        return $this->valueOrNull($row['condition'] ?? null) ?? 'Baik';
    }

    /**
     * @param  array<string, mixed>  $row
     */
    private function buildNotes(array $row): ?string
    {
        $area = $this->valueOrNull($row['area'] ?? null);
        $arah = $this->valueOrNull($row['arah'] ?? null);

        $parts = array_filter([
            $this->valueOrNull($row['notes'] ?? null),
            $area !== null ? "Area: {$area}" : null,
            $arah !== null ? "Arah: {$arah}" : null,
        ]);

        $merged = implode('; ', $parts);

        return $merged === '' ? null : $merged;
    }

    /**
     * @param  Collection<string, string>  $lookup
     */
    private function findId(Collection $lookup, ?string $key): ?string
    {
        if ($key === null) {
            return null;
        }

        $id = $lookup->get($key)
            ?? $lookup->first(fn ($value, $lookupKey): bool => mb_strtolower((string) $lookupKey) === mb_strtolower($key));

        return is_string($id) && $id !== '' ? $id : null;
    }

    /**
     * Find existing location by name or create new one.
     *
     * @param  Collection<string, string>  $locations
     */
    private function findOrCreateLocation(Collection $locations, ?string $name): ?string
    {
        if ($name === null) {
            return null;
        }

        $id = $this->findId($locations, $name);

        if ($id === null) {
            $location = Location::query()->create(['name' => $name]);
            $id = $location->id;
            // Add to lookup for future rows in this import
            $locations->put($name, $id);
        }

        return $id;
    }

    /**
     * Resolve the classification IDs from a dotted asset code.
     *
     * Supports two code formats:
     *   1) Direct code:  group.code . category.code . cluster.code . subcluster.code  (e.g. 03.08.11.07)
     *   2) Positional:   group.code . category.code . <position+1>  . <position+1>     (e.g. 03.08.01.03)
     *
     * Positional segments are tried when the exact code lookup fails — the
     * system walks the sorted children at each level and picks the Nth entry
     * (1-based). This handles legacy Excel files that used sequential
     * numbering instead of the actual cluster/subcluster codes.
     *
     * @return array{classification: array{group_id: string, category_id: string, cluster_id: string, subcluster_id: string}|null, errors: array<int, string>}
     */
    private function resolveClassificationFromKode(string $kode): array
    {
        $parts = explode('.', $kode);
        $errors = [];

        if (count($parts) < 4) {
            $errors[] = "Kode aset '{$kode}' tidak memiliki minimal 4 segmen (Golongan.Kategori.Cluster.Sub-cluster)";

            return ['classification' => null, 'errors' => $errors];
        }

        // Level 1 — Group (by code)
        $group = AssetGroup::query()->where('code', $parts[0])->first(['id']);

        if ($group === null) {
            $errors[] = "Golongan '{$parts[0]}' tidak ditemukan di master data";

            return ['classification' => null, 'errors' => $errors];
        }

        // Level 2 — Category (by code or by position within group)
        $category = AssetCategory::query()
            ->where('asset_group_id', $group->id)
            ->where('code', $parts[1])
            ->first(['id']);

        if ($category === null && ctype_digit($parts[1])) {
            $category = $this->findByPosition(
                AssetCategory::query()
                    ->where('asset_group_id', $group->id)
                    ->orderBy('sort_order')
                    ->orderBy('code'),
                (int) $parts[1],
            );
        }

        if ($category === null) {
            $errors[] = "Kategori '{$parts[1]}' tidak ditemukan di bawah golongan '{$parts[0]}'";

            return ['classification' => null, 'errors' => $errors];
        }

        // Level 3 — Cluster (by code or by position within category)
        $cluster = AssetCluster::query()
            ->where('asset_category_id', $category->id)
            ->where('code', $parts[2])
            ->first(['id']);

        if ($cluster === null && ctype_digit($parts[2])) {
            $cluster = $this->findByPosition(
                AssetCluster::query()
                    ->where('asset_category_id', $category->id)
                    ->orderBy('sort_order')
                    ->orderBy('code'),
                (int) $parts[2],
            );
        }

        if ($cluster === null) {
            $errors[] = "Cluster '{$parts[2]}' tidak ditemukan di bawah kategori '{$category->code}'";

            return ['classification' => null, 'errors' => $errors];
        }

        // Level 4 — Sub-cluster (by code or by position within cluster)
        $subcluster = AssetSubCluster::query()
            ->where('asset_cluster_id', $cluster->id)
            ->where('code', $parts[3])
            ->first(['id']);

        if ($subcluster === null && ctype_digit($parts[3])) {
            $subcluster = $this->findByPosition(
                AssetSubCluster::query()
                    ->where('asset_cluster_id', $cluster->id)
                    ->orderBy('sort_order')
                    ->orderBy('code'),
                (int) $parts[3],
            );
        }

        if ($subcluster === null) {
            $errors[] = "Sub Cluster '{$parts[3]}' tidak ditemukan di bawah cluster '{$cluster->code}'";

            return ['classification' => null, 'errors' => $errors];
        }

        return [
            'classification' => [
                'group_id' => $group->id,
                'category_id' => $category->id,
                'cluster_id' => $cluster->id,
                'subcluster_id' => $subcluster->id,
            ],
            'errors' => [],
        ];
    }

    /**
     * Find a model by 1-based position (Nth child) within an ordered query.
     * Used as fallback when the segment doesn't match any code directly.
     */
    private function findByPosition(Builder $query, int $position): ?Model
    {
        if ($position < 1) {
            return null;
        }

        return $query->skip($position - 1)->take(1)->first(['id']);
    }

    private function valueOrNull(mixed $value): ?string
    {
        $value = trim($this->stringify($value));

        return $value === '' ? null : $value;
    }

    /** @return array<int, string>|null */
    private function arrayOrNull(mixed $value): ?array
    {
        $value = $this->valueOrNull($value);

        return $value === null ? null : [$value];
    }

    private function parseDate(mixed $value): ?string
    {
        if ($value instanceof DateTimeInterface) {
            return $value->format('Y-m-d');
        }

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
