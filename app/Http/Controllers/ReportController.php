<?php

namespace App\Http\Controllers;

use App\Models\AssetDisposal;
use App\Models\AssetTransfer;
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

        // ponytail: BelongsToTenant global scope filters by tenant — manual whereHas removed
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
            'Tanggal',
            'Kode Aset',
            'Serial Number',
            'Brand',
            'Model',
            'Dari',
            'Ke',
            'Pemohon',
            'Status',
            'Tgl Disetujui',
            'Penyetuju',
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

        // ponytail: BelongsToTenant global scope filters by tenant — manual whereHas removed
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
            'Tanggal',
            'Kode Aset',
            'Serial Number',
            'Item',
            'Alasan',
            'Tgl Disposal',
            'Status',
            'Disposal Oleh',
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
}
