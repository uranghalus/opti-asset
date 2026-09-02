<?php

namespace App\Http\Controllers;

use App\Models\Asset;
use App\Models\AssetDisposal;
use App\Models\AssetGroup;
use App\Models\AssetTransfer;
use App\Models\Location;
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

        $pendingDisposals = AssetDisposal::query()
            ->where('status', 'pending')
            ->count();

        $assetByClassification = AssetGroup::query()
            ->withCount('assets')
            ->orderByDesc('assets_count')
            ->take(8)
            ->get(['id', 'code', 'name', 'assets_count'])
            ->map(fn (AssetGroup $group): array => [
                'name' => $group->name,
                'count' => $group->assets_count,
            ])
            ->toArray();

        $assetByLocation = Asset::query()
            ->selectRaw('location_id, count(*) as total')
            ->whereNotNull('location_id')
            ->groupBy('location_id')
            ->orderByDesc('total')
            ->take(6)
            ->get()
            ->map(function ($row) {
                $location = Location::find($row->location_id);

                return [
                    'name' => $location?->name ?? 'Tidak diketahui',
                    'count' => (int) $row->total,
                ];
            })
            ->toArray();

        $recentTransfers = AssetTransfer::query()
            ->with(['asset:id,kode_asset', 'fromLocation:id,name', 'toLocation:id,name'])
            ->latest()
            ->take(5)
            ->get()
            ->map(fn (AssetTransfer $t): array => [
                'id' => $t->id,
                'asset_kode' => $t->asset->kode_asset ?? '—',
                'from' => $t->fromLocation->name ?? '—',
                'to' => $t->toLocation->name ?? '—',
                'status' => $t->status->value,
                'date' => $t->created_at->toIso8601String(),
            ])
            ->toArray();

        $recentDisposals = AssetDisposal::query()
            ->with(['asset:id,kode_asset'])
            ->latest()
            ->take(5)
            ->get()
            ->map(fn (AssetDisposal $d): array => [
                'id' => $d->id,
                'asset_kode' => $d->asset->kode_asset ?? '—',
                'reason' => $d->reason ?? '—',
                'status' => $d->status->value,
                'date' => ($d->disposal_date ?? $d->created_at)->toIso8601String(),
            ])
            ->toArray();

        $classifiedCount = Asset::query()
            ->whereNotNull('asset_group_id')
            ->count();
        $totalForScore = max($totalAssets, 1);
        $integrityScore = round(($classifiedCount / $totalForScore) * 100);

        $warrantyAlerts = $this->getWarrantyAlerts();

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
                'pending_disposals' => $pendingDisposals,
            ],
            'asset_by_classification' => $assetByClassification,
            'asset_by_location' => $assetByLocation,
            'recent_transfers' => $recentTransfers,
            'recent_disposals' => $recentDisposals,
            'integrity_score' => $integrityScore,
            'warranty_alerts' => $warrantyAlerts,
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
