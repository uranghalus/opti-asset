<?php

namespace App\Services;

use App\Models\Asset;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Auth;

/**
 * Sumber kebenaran tunggal untuk query Laporan Daftar Aset.
 *
 * Dipakai oleh index (tabel + ringkasan) dan export (XLSX/PDF) agar
 * filter, scoping department, dan sorting selalu identik.
 *
 * Nama field filter sengaja disamakan dengan form Create
 * (resources/js/components/assets/asset-form.tsx).
 */
class AssetReportQuery
{
    /**
     * Role yang boleh melihat lintas department. Termasuk alias lama yang
     * sudah dipakai kode (Asset Staff, Accounting, staff_asset) agar tidak regresi.
     *
     * @var array<int, string>
     */
    private const DEPT_BYPASS_ROLES = [
        'super-admin',
        'super_admin',
        'staff-asset',
        'staff_asset',
        'Asset Staff',
        'akunting',
        'Accounting',
        'administrator',
    ];

    /**
     * Kolom teks yang difilter dengan LIKE (contains).
     *
     * @var array<int, string>
     */
    private const TEXT_FILTERS = [
        'kode_asset',
        'brand',
        'model',
        'serial_number',
        'part_number',
        'vendor_name',
        'no_spb',
        'document_number',
        'type_override_reason',
        'notes',
    ];

    /**
     * Kolom yang difilter persis (where =).
     *
     * @var array<int, string>
     */
    private const EXACT_FILTERS = [
        'item_id',
        'location_id',
        'department_id',
        'asset_type',
        'depreciation_method',
        'status',
        'condition',
    ];

    /**
     * Basis kolom tanggal yang punya rentang _from / _to.
     *
     * @var array<int, string>
     */
    private const DATE_RANGES = [
        'purchase_date',
        'in_come_date',
        'warranty_expire',
        'garansi_exp',
        'broken_date',
    ];

    /**
     * Basis kolom angka yang punya rentang _min / _max.
     *
     * @var array<int, string>
     */
    private const NUMERIC_RANGES = [
        'purchase_price',
        'acquisition_cost',
        'accumulated_depreciation',
        'useful_life_years',
    ];

    /**
     * Whitelist kolom sorting (kolom langsung, tanpa join relasi).
     *
     * @var array<int, string>
     */
    public const SORTABLE = [
        'kode_asset',
        'brand',
        'model',
        'serial_number',
        'part_number',
        'purchase_date',
        'purchase_price',
        'vendor_name',
        'asset_type',
        'acquisition_cost',
        'useful_life_years',
        'depreciation_method',
        'accumulated_depreciation',
        'in_come_date',
        'warranty_expire',
        'garansi_exp',
        'broken_date',
        'status',
        'condition',
        'no_spb',
        'document_number',
        'created_at',
    ];

    /**
     * @param  array<string, mixed>  $filters
     */
    public function __construct(
        private readonly array $filters,
        private readonly ?User $user = null,
    ) {}

    /**
     * Bangun query Asset lengkap (scoping + filter + sort) siap dipakai
     * untuk paginate, sum, maupun lazy() export.
     *
     * @return Builder<Asset>
     */
    public function build(): Builder
    {
        $query = Asset::query()->with([
            'item:id,code,name',
            'location:id,name',
            'department:id_department,nama_department',
        ]);

        $this->applyDepartmentFilter($query);
        $this->applyFilters($query);
        $this->applySort($query);

        return $query;
    }

    /**
     * Terapkan scoping department, kecuali role bypass.
     * Tanpa employee session → fail-closed (tidak ada baris).
     *
     * @param  Builder<Asset>  $query
     */
    private function applyDepartmentFilter(Builder $query): void
    {
        if ($this->hasDepartmentBypass()) {
            return;
        }

        $deptId = $this->getEmployeeDepartmentId();

        if ($deptId === null) {
            $query->whereRaw('1 = 0');

            return;
        }

        $query->where('department_id', $deptId);
    }

    private function hasDepartmentBypass(): bool
    {
        $user = $this->user ?? Auth::user();

        if (! $user) {
            return false;
        }

        return $user->hasAnyRole(self::DEPT_BYPASS_ROLES);
    }

    private function getEmployeeDepartmentId(): ?string
    {
        $employee = session(EmployeeSessionResolver::SESSION_KEY);

        if (! is_array($employee) || ! isset($employee['department_id'])) {
            return null;
        }

        return (string) $employee['department_id'];
    }

    /**
     * @param  Builder<Asset>  $query
     */
    private function applyFilters(Builder $query): void
    {
        $filters = $this->filters;

        foreach (self::TEXT_FILTERS as $field) {
            if ($this->filled($filters, $field)) {
                $this->applyLike($query, $field, (string) $filters[$field]);
            }
        }

        foreach (self::EXACT_FILTERS as $field) {
            if ($this->filled($filters, $field)) {
                $query->where($field, $filters[$field]);
            }
        }

        $this->applyBooleanPresence($query, 'has_photo', 'photo_url', $filters);
        $this->applyBooleanPresence($query, 'has_document', 'document_url', $filters);
        $this->applyTypeOverride($query, $filters);

        foreach (self::DATE_RANGES as $base) {
            if ($this->filled($filters, "{$base}_from")) {
                $query->whereDate($base, '>=', $filters["{$base}_from"]);
            }

            if ($this->filled($filters, "{$base}_to")) {
                $query->whereDate($base, '<=', $filters["{$base}_to"]);
            }
        }

        foreach (self::NUMERIC_RANGES as $base) {
            if ($this->filled($filters, "{$base}_min")) {
                $query->where($base, '>=', $filters["{$base}_min"]);
            }

            if ($this->filled($filters, "{$base}_max")) {
                $query->where($base, '<=', $filters["{$base}_max"]);
            }
        }

        $this->applyPicFilter($query, $filters);
    }

    /**
     * Filter ada/tidak ada untuk kolom array JSON (photo_url/document_url).
     *
     * @param  Builder<Asset>  $query
     * @param  array<string, mixed>  $filters
     */
    private function applyBooleanPresence(Builder $query, string $filterKey, string $column, array $filters): void
    {
        if (! $this->filled($filters, $filterKey)) {
            return;
        }

        if ($filters[$filterKey] === 'yes') {
            $query->whereNotNull($column)->where($column, '!=', '[]');

            return;
        }

        $query->where(function (Builder $q) use ($column): void {
            $q->whereNull($column)->orWhere($column, '[]');
        });
    }

    /**
     * @param  Builder<Asset>  $query
     * @param  array<string, mixed>  $filters
     */
    private function applyTypeOverride(Builder $query, array $filters): void
    {
        if (! $this->filled($filters, 'has_type_override')) {
            return;
        }

        if ($filters['has_type_override'] === 'yes') {
            $query->whereNotNull('type_override_reason')->where('type_override_reason', '!=', '');

            return;
        }

        $query->where(function (Builder $q): void {
            $q->whereNull('type_override_reason')->orWhere('type_override_reason', '');
        });
    }

    /**
     * Aset cocok jika memuat salah satu PIC.
     *
     * @param  Builder<Asset>  $query
     * @param  array<string, mixed>  $filters
     */
    private function applyPicFilter(Builder $query, array $filters): void
    {
        $pics = $filters['pic'] ?? null;

        if (! is_array($pics)) {
            return;
        }

        $pics = array_values(array_filter($pics, fn ($v) => $v !== null && $v !== ''));

        if ($pics === []) {
            return;
        }

        $query->where(function (Builder $q) use ($pics): void {
            foreach ($pics as $pic) {
                $this->applyLike($q, 'pic', (string) $pic, 'or');
            }
        });
    }

    /**
     * LIKE contains portabel (MySQL & SQLite) memakai escape '!'.
     *
     * @param  Builder<Asset>  $query
     */
    private function applyLike(Builder $query, string $column, string $value, string $boolean = 'and'): void
    {
        $escaped = str_replace(['!', '%', '_'], ['!!', '!%', '!_'], $value);
        $method = $boolean === 'or' ? 'orWhereRaw' : 'whereRaw';

        $query->{$method}("{$column} LIKE ? ESCAPE '!'", ["%{$escaped}%"]);
    }

    /**
     * @param  Builder<Asset>  $query
     */
    private function applySort(Builder $query): void
    {
        $column = $this->filters['sort'] ?? 'created_at';

        if (! in_array($column, self::SORTABLE, true)) {
            $column = 'created_at';
        }

        $direction = strtolower((string) ($this->filters['direction'] ?? 'desc'));
        $direction = $direction === 'asc' ? 'asc' : 'desc';

        $query->orderBy($column, $direction);
    }

    /**
     * @param  array<string, mixed>  $filters
     */
    private function filled(array $filters, string $key): bool
    {
        return isset($filters[$key]) && $filters[$key] !== '' && $filters[$key] !== null;
    }
}
