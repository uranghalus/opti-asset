<?php

namespace App\Http\Controllers;

use App\Models\Asset;
use App\Models\AssetTransfer;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function __invoke(Request $request)
    {
        $assetCounts = Asset::query()
            ->selectRaw('status, count(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status')
            ->toArray();

        $totalAssets = array_sum($assetCounts);

        $pendingTransfers = AssetTransfer::query()
            ->where('status', 'pending')
            ->count();

        $warrantyAlerts = $this->getWarrantyAlerts();

        $recentAssets = Asset::query()
            ->with('item:id,name')
            ->latest()
            ->take(5)
            ->get(['id', 'item_id', 'kode_asset', 'brand', 'model', 'status', 'created_at']);

        return Inertia::render('dashboard', [
            'stats' => [
                'total_assets' => $totalAssets,
                'asset_by_status' => [
                    'ACT' => $assetCounts['ACT'] ?? 0,
                    'LOAN' => $assetCounts['LOAN'] ?? 0,
                    'RPR' => $assetCounts['RPR'] ?? 0,
                    'MUT' => $assetCounts['MUT'] ?? 0,
                    'DSP' => $assetCounts['DSP'] ?? 0,
                ],
                'pending_transfers' => $pendingTransfers,
            ],
            'warranty_alerts' => $warrantyAlerts,
            'recent_assets' => $recentAssets,
        ]);
    }

    /**
     * @return array{expired: int, expiring_soon: int, expiring_30: int, assets: array<int, array{id: string, kode_asset: string|null, brand: string|null, model: string|null, warranty_expire: string, days_until: int}>}
     */
    private function getWarrantyAlerts(): array
    {
        $now = Carbon::now();
        $thirtyDays = Carbon::now()->addDays(30);

        $expired = Asset::query()
            ->whereNotNull('warranty_expire')
            ->where('warranty_expire', '<', $now)
            ->count();

        $expiringSoon = Asset::query()
            ->whereNotNull('warranty_expire')
            ->whereBetween('warranty_expire', [$now, $thirtyDays])
            ->count();

        $assets = Asset::query()
            ->whereNotNull('warranty_expire')
            ->where('warranty_expire', '<=', $thirtyDays)
            ->orderBy('warranty_expire')
            ->take(10)
            ->get(['id', 'kode_asset', 'brand', 'model', 'warranty_expire'])
            ->map(fn (Asset $asset): array => [
                'id' => $asset->id,
                'kode_asset' => $asset->kode_asset,
                'brand' => $asset->brand,
                'model' => $asset->model,
                'warranty_expire' => $asset->warranty_expire->toIso8601String(),
                'days_until' => (int) round($now->diffInDays($asset->warranty_expire)),
            ])
            ->toArray();

        return [
            'expired' => $expired,
            'expiring_soon' => $expiringSoon,
            'expiring_30' => $expired + $expiringSoon,
            'assets' => $assets,
        ];
    }
}
