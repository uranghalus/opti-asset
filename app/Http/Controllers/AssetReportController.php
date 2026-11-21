<?php

namespace App\Http\Controllers;

use App\Enums\AssetStatus;
use App\Http\Requests\AssetReportFilterRequest;
use App\Models\Department;
use App\Models\Employee;
use App\Models\Item;
use App\Models\Location;
use App\Services\AssetReportExporter;
use App\Services\AssetReportQuery;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;

/**
 * Laporan Daftar Aset (tanpa mutasi/penghapusan).
 *
 * Filter mengikuti field form Create; query & export berbagi satu service
 * (AssetReportQuery) sehingga hasil tabel, ringkasan, dan export selalu sama.
 */
class AssetReportController extends Controller
{
    public function index(AssetReportFilterRequest $request): Response
    {
        Gate::authorize('asset.view');

        $query = (new AssetReportQuery($request->filters(), $request->user()))->build();

        $assets = $query->paginate($request->perPage())->withQueryString();

        return Inertia::render('reports/Assets', [
            'assets' => $assets,
            'filters' => $request->filters(),
            'summary' => [
                'total_assets' => $assets->total(),
                'total_purchase_price' => (string) ((clone $query)->sum('purchase_price') ?? 0),
                'total_acquisition_cost' => (string) ((clone $query)->sum('acquisition_cost') ?? 0),
            ],
            'sort' => [
                'column' => $request->sortColumn(),
                'direction' => $request->sortDirection(),
            ],
            'items' => Item::query()->orderBy('name')->get(['id', 'code', 'name']),
            'locations' => Location::query()->orderBy('name')->get(['id', 'name']),
            'departments' => Department::query()->orderBy('nama_department')->get(['id_department', 'nama_department']),
            'employees' => Employee::query()->orderBy('nama_employee')->get(['id_employee', 'nama_employee']),
        ]);
    }

    public function export(AssetReportFilterRequest $request, AssetReportExporter $exporter): SymfonyResponse
    {
        Gate::authorize('asset.view');

        $columns = $request->columns();

        if ($columns === []) {
            abort(SymfonyResponse::HTTP_UNPROCESSABLE_ENTITY, 'Pilih minimal satu kolom untuk diekspor.');
        }

        $query = (new AssetReportQuery($request->filters(), $request->user()))->build();

        if ($request->exportFormat() === 'pdf') {
            return $exporter->pdf($query, $columns, $this->filterSummary($request->filters()));
        }

        return $exporter->xlsx($query, $columns);
    }

    /**
     * Ringkasan filter aktif untuk header PDF (label → nilai terbaca).
     *
     * @param  array<string, mixed>  $filters
     * @return array<string, string>
     */
    private function filterSummary(array $filters): array
    {
        $labels = [
            'kode_asset' => 'Kode Aset',
            'item_id' => 'Item',
            'brand' => 'Brand',
            'model' => 'Model',
            'serial_number' => 'Serial Number',
            'part_number' => 'Part Number',
            'has_photo' => 'Foto',
            'has_document' => 'Dokumen',
            'purchase_date_from' => 'Pembelian dari',
            'purchase_date_to' => 'Pembelian sampai',
            'purchase_price_min' => 'Harga min',
            'purchase_price_max' => 'Harga maks',
            'vendor_name' => 'Vendor',
            'location_id' => 'Lokasi',
            'department_id' => 'Department',
            'asset_type' => 'Tipe Aset',
            'acquisition_cost_min' => 'Nilai perolehan min',
            'acquisition_cost_max' => 'Nilai perolehan maks',
            'useful_life_years_min' => 'Masa manfaat min',
            'useful_life_years_max' => 'Masa manfaat maks',
            'depreciation_method' => 'Metode Penyusutan',
            'accumulated_depreciation_min' => 'Akumulasi min',
            'accumulated_depreciation_max' => 'Akumulasi maks',
            'has_type_override' => 'Override Tipe',
            'type_override_reason' => 'Alasan override',
            'in_come_date_from' => 'Masuk dari',
            'in_come_date_to' => 'Masuk sampai',
            'warranty_expire_from' => 'Garansi dari',
            'warranty_expire_to' => 'Garansi sampai',
            'garansi_exp_from' => 'Garansi vendor dari',
            'garansi_exp_to' => 'Garansi vendor sampai',
            'broken_date_from' => 'Rusak dari',
            'broken_date_to' => 'Rusak sampai',
            'status' => 'Status',
            'condition' => 'Kondisi',
            'no_spb' => 'No. SPB',
            'document_number' => 'Nomor Dokumen',
            'pic' => 'PIC',
            'notes' => 'Catatan',
        ];

        $summary = [];

        foreach ($filters as $key => $value) {
            if (! isset($labels[$key]) || $value === null || $value === '') {
                continue;
            }

            $summary[$labels[$key]] = $this->readableValue($key, $value);
        }

        return $summary;
    }

    private function readableValue(string $key, mixed $value): string
    {
        return match ($key) {
            'item_id' => (string) (Item::query()->whereKey($value)->value('name') ?? $value),
            'location_id' => (string) (Location::query()->whereKey($value)->value('name') ?? $value),
            'department_id' => (string) (Department::query()->whereKey($value)->value('nama_department') ?? $value),
            'asset_type' => match ($value) {
                'fixed_asset' => 'Aktiva Tetap',
                'equipment' => 'Peralatan',
                default => (string) $value,
            },
            'depreciation_method' => match ($value) {
                'straight_line' => 'Garis Lurus',
                'declining_balance' => 'Saldo Menurun',
                'none' => 'Tidak Disusutkan',
                default => (string) $value,
            },
            'status' => AssetStatus::tryFrom((string) $value)?->label() ?? (string) $value,
            'has_photo', 'has_document', 'has_type_override' => $value === 'yes' ? 'Ada' : 'Tidak ada',
            'pic' => is_array($value) ? implode(', ', $value) : (string) $value,
            default => (string) $value,
        };
    }
}
