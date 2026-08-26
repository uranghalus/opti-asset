<?php

namespace App\Http\Controllers;

use App\Models\Asset;
use App\Models\AssetHistory;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AssetHistoryController extends Controller
{
    /**
     * Display a listing of the asset's history.
     */
    public function index(Request $request, Asset $asset): Response
    {
        $perPage = min((int) $request->integer('per_page', 20), 100);

        $histories = AssetHistory::query()
            ->where('asset_id', $asset->id)
            ->where('tenant_id', $asset->tenant_id)
            ->with('changedBy:id,name')
            ->latest()
            ->paginate($perPage)
            ->withQueryString();

        $asset->load([
            'item:id,name,code',
            'location:id,name',
            'department:id_department,nama_department',
        ]);

        return Inertia::render('asset-history/Index', [
            'asset' => [
                'id' => $asset->id,
                'kode_asset' => $asset->kode_asset,
                'item' => $asset->item,
                'location' => $asset->location,
                'department' => $asset->department,
            ],
            'histories' => $histories,
        ]);
    }
}
