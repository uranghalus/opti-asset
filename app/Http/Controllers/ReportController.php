<?php

namespace App\Http\Controllers;

use App\Enums\AssetStatus;
use App\Models\Asset;
use App\Models\AssetDisposal;
use App\Models\AssetTransfer;
use App\Models\Department;
use App\Models\Employee;
use App\Models\Item;
use App\Models\Location;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\SimpleExcel\SimpleExcelWriter;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportController extends Controller
{
    public function index(Request $request): Response
    {
        Gate::authorize('asset.view');

        $validated = $request->validate([
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:100'],
            'transfer_status' => ['sometimes', 'string', 'in:pending,approved,rejected'],
            'transfer_search' => ['sometimes', 'string', 'max:255'],
            'disposal_status' => ['sometimes', 'string', 'in:pending,approved,rejected'],
            'disposal_search' => ['sometimes', 'string', 'max:255'],
        ]);

        $perPage = $validated['per_page'] ?? 15;
        $transferSearch = str_replace(['%', '_'], ['\\%', '\\_'], $validated['transfer_search'] ?? '');
        $disposalSearch = str_replace(['%', '_'], ['\\%', '\\_'], $validated['disposal_search'] ?? '');

        $transfers = AssetTransfer::query()
            ->with(['asset:id,kode_asset,serial_number,brand,model', 'fromLocation:id,name', 'toLocation:id,name', 'requester:id,name', 'approver:id,name'])
            ->when(($validated['transfer_status'] ?? '') !== '', fn ($q) => $q->where('status', $validated['transfer_status']))
            ->when($transferSearch !== '', fn ($q) => $q->whereHas('asset', fn ($q) => $q
                ->where('kode_asset', 'like', "%{$transferSearch}%")
                ->orWhere('serial_number', 'like', "%{$transferSearch}%")))
            ->orderBy('created_at', 'desc')
            ->paginate($perPage)
            ->withQueryString();

        $disposals = AssetDisposal::query()
            ->with(['asset:id,kode_asset,serial_number,item_id', 'asset.item:id,name', 'disposedBy:id,name'])
            ->when(($validated['disposal_status'] ?? '') !== '', fn ($q) => $q->where('status', $validated['disposal_status']))
            ->when($disposalSearch !== '', fn ($q) => $q->whereHas('asset', fn ($q) => $q
                ->where('kode_asset', 'like', "%{$disposalSearch}%")
                ->orWhereHas('item', fn ($i) => $i->where('name', 'like', "%{$disposalSearch}%"))))
            ->orderBy('created_at', 'desc')
            ->paginate($perPage)
            ->withQueryString();

        return Inertia::render('reports/Index', [
            'transfers' => $transfers,
            'disposals' => $disposals,
            'filters' => [
                'transfer_search' => $validated['transfer_search'] ?? '',
                'transfer_status' => $validated['transfer_status'] ?? '',
                'disposal_search' => $validated['disposal_search'] ?? '',
                'disposal_status' => $validated['disposal_status'] ?? '',
            ],
        ]);
    }

    public function assets(Request $request): Response
    {
        Gate::authorize('asset.view');

        $validated = $request->validate([
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:100'],
            'item_id' => ['sometimes', 'string', 'max:36', 'nullable'],
            'brand' => ['sometimes', 'string', 'max:100', 'nullable'],
            'model' => ['sometimes', 'string', 'max:100', 'nullable'],
            'serial_number' => ['sometimes', 'string', 'max:100', 'nullable'],
            'part_number' => ['sometimes', 'string', 'max:100', 'nullable'],
            'has_photo' => ['sometimes', 'boolean'],
            'has_document' => ['sometimes', 'boolean'],
            'location_id' => ['sometimes', 'string', 'max:36', 'nullable'],
            'department_id' => ['sometimes', 'string', 'max:36', 'nullable'],
            'purchase_date_from' => ['sometimes', 'date', 'nullable'],
            'purchase_date_to' => ['sometimes', 'date', 'nullable'],
            'purchase_price_min' => ['sometimes', 'numeric', 'nullable'],
            'purchase_price_max' => ['sometimes', 'numeric', 'nullable'],
            'vendor_name' => ['sometimes', 'string', 'max:100', 'nullable'],
            'asset_type' => ['sometimes', 'string', 'in:fixed_asset,equipment', 'nullable'],
            'depreciation_method' => ['sometimes', 'string', 'in:straight_line,declining_balance,none', 'nullable'],
            'acquisition_cost_min' => ['sometimes', 'numeric', 'nullable'],
            'acquisition_cost_max' => ['sometimes', 'numeric', 'nullable'],
            'useful_life_years' => ['sometimes', 'integer', 'nullable'],
            'has_type_override' => ['sometimes', 'boolean'],
            'status' => ['sometimes', 'string', 'in:ACT,LOAN,RPR,MUT,DSP', 'nullable'],
            'condition' => ['sometimes', 'string', 'in:Baik,Rusak Ringan,Rusak Berat', 'nullable'],
            'no_spb' => ['sometimes', 'string', 'max:100', 'nullable'],
            'document_number' => ['sometimes', 'string', 'max:100', 'nullable'],
            'pic' => ['sometimes', 'string', 'max:100', 'nullable'],
            'notes' => ['sometimes', 'string', 'nullable'],
            'warranty_expire_from' => ['sometimes', 'date', 'nullable'],
            'warranty_expire_to' => ['sometimes', 'date', 'nullable'],
            'garansi_exp_from' => ['sometimes', 'date', 'nullable'],
            'garansi_exp_to' => ['sometimes', 'date', 'nullable'],
            'in_come_date_from' => ['sometimes', 'date', 'nullable'],
            'in_come_date_to' => ['sometimes', 'date', 'nullable'],
            'broken_date_from' => ['sometimes', 'date', 'nullable'],
            'broken_date_to' => ['sometimes', 'date', 'nullable'],
        ]);

        $perPage = $validated['per_page'] ?? 15;

        $assets = Asset::query()
            ->with([
                'item:id,code,name',
                'location:id,name',
                'department:id_department,nama_department',
                'assetGroup:id,code,name',
                'assetCategory:id,code,name',
                'assetCluster:id,code,name',
                'assetSubCluster:id,code,name',
            ])
            ->when(! $request->user()->hasAnyRole(['Asset Staff', 'Accounting', 'staff-asset', 'akunting', 'super-admin']), function ($q) use ($request) {
                $deptId = $request->user()?->department ?? null;
                if ($deptId) {
                    $q->where('department_id', $deptId);
                } else {
                    $q->whereRaw('1 = 0');
                }
            })
            ->when($validated['item_id'] ?? null, fn ($q, $item_id) => $q->where('item_id', $item_id))
            ->when($validated['brand'] ?? null, fn ($q, $brand) => $q->where('brand', 'like', "%{$brand}%"))
            ->when($validated['model'] ?? null, fn ($q, $model) => $q->where('model', 'like', "%{$model}%"))
            ->when($validated['serial_number'] ?? null, fn ($q, $serial) => $q->where('serial_number', 'like', "%{$serial}%"))
            ->when($validated['part_number'] ?? null, fn ($q, $part) => $q->where('part_number', 'like', "%{$part}%"))
            ->when($validated['purchase_date_from'] ?? null, fn ($q, $date) => $q->whereDate('purchase_date', '>=', $date))
            ->when($validated['purchase_date_to'] ?? null, fn ($q, $date) => $q->whereDate('purchase_date', '<=', $date))
            ->when($validated['purchase_price_min'] ?? null, fn ($q, $price) => $q->where('purchase_price', '>=', $price))
            ->when($validated['purchase_price_max'] ?? null, fn ($q, $price) => $q->where('purchase_price', '<=', $price))
            ->when($validated['vendor_name'] ?? null, fn ($q, $vendor) => $q->where('vendor_name', 'like', "%{$vendor}%"))
            ->when($validated['asset_type'] ?? null, fn ($q, $type) => $q->where('asset_type', $type))
            ->when($validated['depreciation_method'] ?? null, fn ($q, $method) => $q->where('depreciation_method', $method))
            ->when($validated['acquisition_cost_min'] ?? null, fn ($q, $cost) => $q->where('acquisition_cost', '>=', $cost))
            ->when($validated['acquisition_cost_max'] ?? null, fn ($q, $cost) => $q->where('acquisition_cost', '<=', $cost))
            ->when($validated['useful_life_years'] ?? null, fn ($q, $years) => $q->where('useful_life_years', $years))
            ->when(! empty($validated['has_type_override']), fn ($q) => $q->whereNotNull('type_override_reason'))
            ->when($validated['status'] ?? null, fn ($q, $status) => $q->where('status', $status))
            ->when($validated['condition'] ?? null, fn ($q, $condition) => $q->where('condition', $condition))
            ->when($validated['no_spb'] ?? null, fn ($q, $no_spb) => $q->where('no_spb', 'like', "%{$no_spb}%"))
            ->when($validated['document_number'] ?? null, fn ($q, $doc) => $q->where('document_number', 'like', "%{$doc}%"))
            ->when($validated['pic'] ?? null, fn ($q, $pic) => $q->where('pic', 'like', "%{$pic}%"))
            ->when($validated['notes'] ?? null, fn ($q, $notes) => $q->where('notes', 'like', "%{$notes}%"))
            ->when($validated['location_id'] ?? null, fn ($q, $loc) => $q->where('location_id', $loc))
            ->when($validated['department_id'] ?? null, fn ($q, $dept) => $q->where('department_id', $dept))
            ->when($validated['warranty_expire_from'] ?? null, fn ($q, $date) => $q->whereDate('warranty_expire', '>=', $date))
            ->when($validated['warranty_expire_to'] ?? null, fn ($q, $date) => $q->whereDate('warranty_expire', '<=', $date))
            ->when($validated['garansi_exp_from'] ?? null, fn ($q, $date) => $q->whereDate('garansi_exp', '>=', $date))
            ->when($validated['garansi_exp_to'] ?? null, fn ($q, $date) => $q->whereDate('garansi_exp', '<=', $date))
            ->when($validated['in_come_date_from'] ?? null, fn ($q, $date) => $q->whereDate('in_come_date', '>=', $date))
            ->when($validated['in_come_date_to'] ?? null, fn ($q, $date) => $q->whereDate('in_come_date', '<=', $date))
            ->when($validated['broken_date_from'] ?? null, fn ($q, $date) => $q->whereDate('broken_date', '>=', $date))
            ->when($validated['broken_date_to'] ?? null, fn ($q, $date) => $q->whereDate('broken_date', '<=', $date))
            ->when(! empty($validated['has_photo']), fn ($q) => $q->whereNotNull('photo_url')->where('photo_url', '!=', '[]'))
            ->when(isset($validated['has_photo']) && empty($validated['has_photo']), fn ($q) => $q->where(function ($query) {
                $query->whereNull('photo_url')
                    ->orWhere('photo_url', '[]');
            }))
            ->when(! empty($validated['has_document']), fn ($q) => $q->whereNotNull('document_url')->where('document_url', '!=', '[]'))
            ->when(isset($validated['has_document']) && empty($validated['has_document']), fn ($q) => $q->where(function ($query) {
                $query->whereNull('document_url')
                    ->orWhere('document_url', '[]');
            }))
            ->orderBy('created_at', 'desc')
            ->paginate($perPage)
            ->withQueryString();

        $summary = $this->buildAssetsSummary($request, $assets->total());

        return Inertia::render('reports/Assets', [
            'assets' => $assets,
            'filters' => $validated,
            'summary' => $summary,
            'items' => Item::query()->with('category:id,code')->orderBy('name')->get(['id', 'code', 'name', 'category_id']),
            'locations' => Location::query()->orderBy('name')->get(['id', 'name']),
            'departments' => Department::query()->orderBy('nama_department')->get(['id_department', 'nama_department']),
            'employees' => Employee::query()->orderBy('nama_employee')->get(['id_employee', 'nama_employee']),
        ]);
    }

    public function exportAssets(Request $request): StreamedResponse|\Symfony\Component\HttpFoundation\Response
    {
        Gate::authorize('asset.view');

        $validated = $request->validate([
            'format' => ['sometimes', 'string', 'in:xlsx,pdf'],
            'item_id' => ['sometimes', 'string', 'max:36', 'nullable'],
            'brand' => ['sometimes', 'string', 'max:100', 'nullable'],
            'model' => ['sometimes', 'string', 'max:100', 'nullable'],
            'serial_number' => ['sometimes', 'string', 'max:100', 'nullable'],
            'part_number' => ['sometimes', 'string', 'max:100', 'nullable'],
            'has_photo' => ['sometimes', 'boolean'],
            'has_document' => ['sometimes', 'boolean'],
            'location_id' => ['sometimes', 'string', 'max:36', 'nullable'],
            'department_id' => ['sometimes', 'string', 'max:36', 'nullable'],
            'purchase_date_from' => ['sometimes', 'date', 'nullable'],
            'purchase_date_to' => ['sometimes', 'date', 'nullable'],
            'purchase_price_min' => ['sometimes', 'numeric', 'nullable'],
            'purchase_price_max' => ['sometimes', 'numeric', 'nullable'],
            'vendor_name' => ['sometimes', 'string', 'max:100', 'nullable'],
            'asset_type' => ['sometimes', 'string', 'in:fixed_asset,equipment', 'nullable'],
            'depreciation_method' => ['sometimes', 'string', 'in:straight_line,declining_balance,none', 'nullable'],
            'acquisition_cost_min' => ['sometimes', 'numeric', 'nullable'],
            'acquisition_cost_max' => ['sometimes', 'numeric', 'nullable'],
            'useful_life_years' => ['sometimes', 'integer', 'nullable'],
            'has_type_override' => ['sometimes', 'boolean'],
            'status' => ['sometimes', 'string', 'in:ACT,LOAN,RPR,MUT,DSP', 'nullable'],
            'condition' => ['sometimes', 'string', 'in:Baik,Rusak Ringan,Rusak Berat', 'nullable'],
            'no_spb' => ['sometimes', 'string', 'max:100', 'nullable'],
            'document_number' => ['sometimes', 'string', 'max:100', 'nullable'],
            'pic' => ['sometimes', 'string', 'max:100', 'nullable'],
            'notes' => ['sometimes', 'string', 'nullable'],
            'warranty_expire_from' => ['sometimes', 'date', 'nullable'],
            'warranty_expire_to' => ['sometimes', 'date', 'nullable'],
            'garansi_exp_from' => ['sometimes', 'date', 'nullable'],
            'garansi_exp_to' => ['sometimes', 'date', 'nullable'],
            'in_come_date_from' => ['sometimes', 'date', 'nullable'],
            'in_come_date_to' => ['sometimes', 'date', 'nullable'],
            'broken_date_from' => ['sometimes', 'date', 'nullable'],
            'broken_date_to' => ['sometimes', 'date', 'nullable'],
        ]);

        $format = $validated['format'] ?? 'xlsx';

        $query = Asset::query()
            ->with([
                'item:id,code,name',
                'location:id,name',
                'department:id_department,nama_department',
                'assetGroup:id,code,name',
                'assetCategory:id,code,name',
                'assetCluster:id,code,name',
                'assetSubCluster:id,code,name',
            ])
            ->when(! $request->user()->hasAnyRole(['Asset Staff', 'Accounting', 'staff-asset', 'akunting', 'super-admin']), function ($q) use ($request) {
                $deptId = $request->user()?->department ?? null;
                if ($deptId) {
                    $q->where('department_id', $deptId);
                } else {
                    $q->whereRaw('1 = 0');
                }
            })
            ->when($validated['item_id'] ?? null, fn ($q, $item_id) => $q->where('item_id', $item_id))
            ->when($validated['brand'] ?? null, fn ($q, $brand) => $q->where('brand', 'like', "%{$brand}%"))
            ->when($validated['model'] ?? null, fn ($q, $model) => $q->where('model', 'like', "%{$model}%"))
            ->when($validated['serial_number'] ?? null, fn ($q, $serial) => $q->where('serial_number', 'like', "%{$serial}%"))
            ->when($validated['part_number'] ?? null, fn ($q, $part) => $q->where('part_number', 'like', "%{$part}%"))
            ->when($validated['purchase_date_from'] ?? null, fn ($q, $date) => $q->whereDate('purchase_date', '>=', $date))
            ->when($validated['purchase_date_to'] ?? null, fn ($q, $date) => $q->whereDate('purchase_date', '<=', $date))
            ->when($validated['purchase_price_min'] ?? null, fn ($q, $price) => $q->where('purchase_price', '>=', $price))
            ->when($validated['purchase_price_max'] ?? null, fn ($q, $price) => $q->where('purchase_price', '<=', $price))
            ->when($validated['vendor_name'] ?? null, fn ($q, $vendor) => $q->where('vendor_name', 'like', "%{$vendor}%"))
            ->when($validated['asset_type'] ?? null, fn ($q, $type) => $q->where('asset_type', $type))
            ->when($validated['depreciation_method'] ?? null, fn ($q, $method) => $q->where('depreciation_method', $method))
            ->when($validated['acquisition_cost_min'] ?? null, fn ($q, $cost) => $q->where('acquisition_cost', '>=', $cost))
            ->when($validated['acquisition_cost_max'] ?? null, fn ($q, $cost) => $q->where('acquisition_cost', '<=', $cost))
            ->when($validated['useful_life_years'] ?? null, fn ($q, $years) => $q->where('useful_life_years', $years))
            ->when(! empty($validated['has_type_override']), fn ($q) => $q->whereNotNull('type_override_reason'))
            ->when($validated['status'] ?? null, fn ($q, $status) => $q->where('status', $status))
            ->when($validated['condition'] ?? null, fn ($q, $condition) => $q->where('condition', $condition))
            ->when($validated['no_spb'] ?? null, fn ($q, $no_spb) => $q->where('no_spb', 'like', "%{$no_spb}%"))
            ->when($validated['document_number'] ?? null, fn ($q, $doc) => $q->where('document_number', 'like', "%{$doc}%"))
            ->when($validated['pic'] ?? null, fn ($q, $pic) => $q->where('pic', 'like', "%{$pic}%"))
            ->when($validated['notes'] ?? null, fn ($q, $notes) => $q->where('notes', 'like', "%{$notes}%"))
            ->when($validated['location_id'] ?? null, fn ($q, $loc) => $q->where('location_id', $loc))
            ->when($validated['department_id'] ?? null, fn ($q, $dept) => $q->where('department_id', $dept))
            ->when($validated['warranty_expire_from'] ?? null, fn ($q, $date) => $q->whereDate('warranty_expire', '>=', $date))
            ->when($validated['warranty_expire_to'] ?? null, fn ($q, $date) => $q->whereDate('warranty_expire', '<=', $date))
            ->when($validated['garansi_exp_from'] ?? null, fn ($q, $date) => $q->whereDate('garansi_exp', '>=', $date))
            ->when($validated['garansi_exp_to'] ?? null, fn ($q, $date) => $q->whereDate('garansi_exp', '<=', $date))
            ->when($validated['in_come_date_from'] ?? null, fn ($q, $date) => $q->whereDate('in_come_date', '>=', $date))
            ->when($validated['in_come_date_to'] ?? null, fn ($q, $date) => $q->whereDate('in_come_date', '<=', $date))
            ->when($validated['broken_date_from'] ?? null, fn ($q, $date) => $q->whereDate('broken_date', '>=', $date))
            ->when($validated['broken_date_to'] ?? null, fn ($q, $date) => $q->whereDate('broken_date', '<=', $date))
            ->when(! empty($validated['has_photo']), fn ($q) => $q->whereNotNull('photo_url')->where('photo_url', '!=', '[]'))
            ->when(isset($validated['has_photo']) && empty($validated['has_photo']), fn ($q) => $q->where(function ($query) {
                $query->whereNull('photo_url')
                    ->orWhere('photo_url', '[]');
            }))
            ->when(! empty($validated['has_document']), fn ($q) => $q->whereNotNull('document_url')->where('document_url', '!=', '[]'))
            ->when(isset($validated['has_document']) && empty($validated['has_document']), fn ($q) => $q->where(function ($query) {
                $query->whereNull('document_url')
                    ->orWhere('document_url', '[]');
            }))
            ->orderBy('created_at', 'desc')
            ->get();

        $filename = 'laporan_daftar_aset_'.now()->format('Y-m-d').'.'.$format;

        if ($format === 'pdf') {
            $pdf = Pdf::loadView('reports.assets_pdf', ['assets' => $query]);

            return $pdf->download($filename);
        }

        $tempPath = storage_path('app/'.Str::uuid().'.xlsx');

        $writer = SimpleExcelWriter::create($tempPath)->addHeader([
            'Kode Aset', 'Item', 'Brand', 'Model', 'Serial Number', 'Part Number',
            'Status', 'Kondisi', 'Lokasi', 'Department', 'Vendor',
            'Tgl Pembelian', 'Harga Pembelian', 'Tipe Aset', 'Akumulasi',
            'Nama PIC', 'No SPB', 'No Dokumen', 'Ada Foto', 'Ada Dokumen', 'Catatan',
        ]);

        foreach ($query as $a) {
            $writer->addRow([
                'Kode Aset' => $a->kode_asset ?? '',
                'Item' => $a->item?->code.' - '.$a->item?->name ?? '',
                'Brand' => $a->brand ?? '',
                'Model' => $a->model ?? '',
                'Serial Number' => $a->serial_number ?? '',
                'Part Number' => $a->part_number ?? '',
                'Status' => $this->statusLabel($a->status),
                'Kondisi' => $a->condition ?? '',
                'Lokasi' => $a->location?->name ?? '',
                'Department' => $a->department?->nama_department ?? '',
                'Vendor' => $a->vendor_name ?? '',
                'Tgl Pembelian' => $a->purchase_date?->format('d/m/Y') ?? '',
                'Harga Pembelian' => $a->purchase_price ?? '',
                'Tipe Aset' => $a->asset_type === 'fixed_asset' ? 'Aktiva Tetap' : 'Peralatan',
                'Akumulasi' => $a->accumulated_depreciation ?? '',
                'Nama PIC' => is_array($a->pic) ? implode(', ', $a->pic) : $a->pic ?? '',
                'No SPB' => $a->no_spb ?? '',
                'No Dokumen' => $a->document_number ?? '',
                'Ada Foto' => (! empty($a->photo_url) && $a->photo_url !== '[]') ? 'Ya' : 'Tidak',
                'Ada Dokumen' => (! empty($a->document_url) && $a->document_url !== '[]') ? 'Ya' : 'Tidak',
                'Catatan' => $a->notes ?? '',
            ]);
        }

        $writer->close();

        return response()->download($tempPath, $filename)->deleteFileAfterSend(true);
    }

    public function exportDisposals(Request $request): StreamedResponse|\Symfony\Component\HttpFoundation\Response
    {
        Gate::authorize('asset.view');

        $validated = $request->validate([
            'format' => ['sometimes', 'string', 'in:xlsx,pdf'],
            'disposal_status' => ['sometimes', 'string', 'in:pending,approved,rejected'],
            'disposal_search' => ['sometimes', 'string', 'max:255'],
        ]);

        $format = $validated['format'] ?? 'xlsx';
        $disposalSearch = str_replace(['%', '_'], ['\\%', '\\_'], $validated['disposal_search'] ?? '');

        $disposals = AssetDisposal::query()
            ->with(['asset:id,kode_asset,serial_number,item_id', 'asset.item:id,name', 'disposedBy:id,name'])
            ->when(($validated['disposal_status'] ?? '') !== '', fn ($q) => $q->where('status', $validated['disposal_status']))
            ->when($disposalSearch !== '', fn ($q) => $q->whereHas('asset', fn ($q) => $q
                ->where('kode_asset', 'like', "%{$disposalSearch}%")
                ->orWhereHas('item', fn ($i) => $i->where('name', 'like', "%{$disposalSearch}%"))))
            ->orderBy('created_at', 'desc')
            ->get();

        $filename = 'laporan_penghapusan_aset_'.now()->format('Y-m-d').'.'.$format;

        if ($format === 'pdf') {
            $pdf = Pdf::loadView('reports.disposals_pdf', ['disposals' => $disposals]);

            return $pdf->download($filename);
        }

        $tempPath = storage_path('app/'.Str::uuid().'.xlsx');

        $writer = SimpleExcelWriter::create($tempPath)->addHeader([
            'Tanggal', 'Kode Aset', 'Serial Number', 'Item', 'Alasan', 'Tgl Disposal', 'Status', 'Disposal Oleh',
        ]);

        foreach ($disposals as $d) {
            $writer->addRow([
                'Tanggal' => $d->created_at->format('d/m/Y'),
                'Kode Aset' => $d->asset->kode_asset ?? '',
                'Serial Number' => $d->asset->serial_number ?? '',
                'Item' => $d->asset->item->name ?? '',
                'Alasan' => $d->reason ?? '',
                'Tgl Disposal' => $d->disposal_date?->format('d/m/Y') ?? '',
                'Status' => $d->status->value,
                'Disposal Oleh' => $d->disposedBy->name ?? '',
            ]);
        }

        $writer->close();

        return response()->download($tempPath, $filename)->deleteFileAfterSend(true);
    }

    public function exportTransfers(Request $request): StreamedResponse|\Symfony\Component\HttpFoundation\Response
    {
        Gate::authorize('asset.view');

        $validated = $request->validate([
            'format' => ['sometimes', 'string', 'in:xlsx,pdf'],
            'transfer_status' => ['sometimes', 'string', 'in:pending,approved,rejected'],
            'transfer_search' => ['sometimes', 'string', 'max:255'],
        ]);

        $format = $validated['format'] ?? 'xlsx';
        $transferSearch = str_replace(['%', '_'], ['\\%', '\\_'], $validated['transfer_search'] ?? '');

        $transfers = AssetTransfer::query()
            ->with(['asset:id,kode_asset,serial_number,brand,model', 'fromLocation:id,name', 'toLocation:id,name', 'requester:id,name', 'approver:id,name'])
            ->when(($validated['transfer_status'] ?? '') !== '', fn ($q) => $q->where('status', $validated['transfer_status']))
            ->when($transferSearch !== '', fn ($q) => $q->whereHas('asset', fn ($q) => $q
                ->where('kode_asset', 'like', "%{$transferSearch}%")
                ->orWhere('serial_number', 'like', "%{$transferSearch}%")))
            ->orderBy('created_at', 'desc')
            ->get();

        $filename = 'laporan_mutasi_aset_'.now()->format('Y-m-d').'.'.$format;

        if ($format === 'pdf') {
            $pdf = Pdf::loadView('reports.transfers_pdf', ['transfers' => $transfers]);

            return $pdf->download($filename);
        }

        $tempPath = storage_path('app/'.Str::uuid().'.xlsx');

        $writer = SimpleExcelWriter::create($tempPath)->addHeader([
            'Tanggal', 'Kode Aset', 'Serial Number', 'Brand', 'Model', 'Dari', 'Ke', 'Pemohon', 'Status', 'Tgl Disetujui', 'Penyetuju',
        ]);

        foreach ($transfers as $t) {
            $writer->addRow([
                'Tanggal' => $t->created_at->format('d/m/Y'),
                'Kode Aset' => $t->asset->kode_asset ?? '',
                'Serial Number' => $t->asset->serial_number ?? '',
                'Brand' => $t->asset->brand ?? '',
                'Model' => $t->asset->model ?? '',
                'Dari' => $t->fromLocation->name ?? '',
                'Ke' => $t->toLocation->name ?? '',
                'Pemohon' => $t->requester->name ?? '',
                'Status' => $t->status->value,
                'Tgl Disetujui' => $t->approved_at?->format('d/m/Y H:i') ?? '',
                'Penyetuju' => $t->approver->name ?? '',
            ]);
        }

        $writer->close();

        return response()->download($tempPath, $filename)->deleteFileAfterSend(true);
    }

    private function statusLabel($status): string
    {
        $statusValue = $status instanceof AssetStatus ? (string) $status->value : $status;

        return match ($statusValue) {
            'ACT' => 'Aktif',
            'LOAN' => 'Dipinjamkan',
            'RPR' => 'Perbaikan',
            'MUT' => 'Dimutasi',
            'DSP' => 'Dihapus',
            default => $statusValue,
        };
    }

    private function buildAssetsSummary(Request $request, int $totalCount): array
    {
        $assetsQuery = Asset::query()
            ->with(['item:id,code,name', 'location:id,name', 'department:id_department,nama_department']);

        if (! $request->user()->hasAnyRole(['Asset Staff', 'Accounting', 'staff-asset', 'akunting', 'super-admin'])) {
            $deptId = $request->user()?->department ?? null;
            if ($deptId) {
                $assetsQuery->where('department_id', $deptId);
            }
        }

        $summary = [
            'total_assets' => $totalCount,
            'total_with_photo' => $assetsQuery->whereNotNull('photo_url')->where('photo_url', '!=', '[]')->count(),
            'total_with_document' => $assetsQuery->whereNotNull('document_url')->where('document_url', '!=', '[]')->count(),
            'total_purchase_value' => $assetsQuery->sum('purchase_price'),
            'total_acquisition_cost' => $assetsQuery->sum('acquisition_cost'),
            'status_breakdown' => [
                'Aktif' => $assetsQuery->where('status', 'ACT')->count(),
                'Dipinjamkan' => $assetsQuery->where('status', 'LOAN')->count(),
                'Perbaikan' => $assetsQuery->where('status', 'RPR')->count(),
                'Dimutasi' => $assetsQuery->where('status', 'MUT')->count(),
                'Dihapus' => $assetsQuery->where('status', 'DSP')->count(),
            ],
            'condition_breakdown' => [
                'Baik' => $assetsQuery->where('condition', 'Baik')->count(),
                'Rusak Ringan' => $assetsQuery->where('condition', 'Rusak Ringan')->count(),
                'Rusak Berat' => $assetsQuery->where('condition', 'Rusak Berat')->count(),
            ],
            'asset_type_breakdown' => [
                'Aktiva Tetap' => $assetsQuery->where('asset_type', 'fixed_asset')->count(),
                'Peralatan' => $assetsQuery->where('asset_type', 'equipment')->count(),
            ],
        ];

        return $summary;
    }
}
