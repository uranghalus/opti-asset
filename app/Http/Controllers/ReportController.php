<?php

namespace App\Http\Controllers;

use App\Models\AssetDisposal;
use App\Models\AssetTransfer;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ReportController extends Controller
{
    public function index(Request $request)
    {
        $perPage = min((int) $request->integer('per_page', 15), 100);

        $transfers = AssetTransfer::query()
            ->with(['asset:id,kode_asset,serial_number,brand,model', 'fromLocation:id,name', 'toLocation:id,name', 'requester:id,name'])
            ->when($request->filled('transfer_status'), fn ($q) => $q->where('status', $request->transfer_status))
            ->when($request->filled('transfer_search'), fn ($q) => $q->whereHas('asset', fn ($q) => $q
                ->where('kode_asset', 'like', "%{$request->transfer_search}%")
                ->orWhere('serial_number', 'like', "%{$request->transfer_search}%")))
            ->orderBy('created_at', 'desc')
            ->paginate($perPage)
            ->withQueryString();

        $disposals = AssetDisposal::query()
            ->with(['asset:id,kode_asset,serial_number,item_id', 'asset.item:id,name', 'disposedBy:id,name'])
            ->when($request->filled('disposal_status'), fn ($q) => $q->where('status', $request->disposal_status))
            ->when($request->filled('disposal_search'), fn ($q) => $q->whereHas('asset', fn ($q) => $q
                ->where('kode_asset', 'like', "%{$request->disposal_search}%")
                ->orWhereHas('item', fn ($i) => $i->where('name', 'like', "%{$request->disposal_search}%"))))
            ->orderBy('created_at', 'desc')
            ->paginate($perPage)
            ->withQueryString();

        return Inertia::render('reports/Index', [
            'transfers' => $transfers,
            'disposals' => $disposals,
            'filters' => [
                'transfer_search' => $request->transfer_search ?? '',
                'transfer_status' => $request->transfer_status ?? '',
                'disposal_search' => $request->disposal_search ?? '',
                'disposal_status' => $request->disposal_status ?? '',
            ],
        ]);
    }
}