<?php

namespace App\Http\Controllers;

use App\Actions\RecordAssetHistoryAction;
use App\Enums\AssetDisposalStatus;
use App\Enums\AssetStatus;
use App\Http\Requests\StoreAssetDisposalRequest;
use App\Http\Requests\UpdateAssetDisposalRequest;
use App\Models\Asset;
use App\Models\AssetDisposal;
use App\Models\Tenant;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class AssetDisposalController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): Response
    {
        $perPage = min((int) $request->integer('per_page', 15), 100);

        $search = $request->string('search')->trim()->toString();
        $status = $request->string('status')->trim()->toString();

        $disposals = AssetDisposal::query()
            ->whereHas('asset', fn ($query) => $query->where('tenant_id', Tenant::current()?->id))
            ->with(['asset:id,kode_asset', 'disposedBy:id,name'])
            ->when($search !== '', fn ($query) => $query->whereHas('asset', fn ($q) => $q
                ->where('kode_asset', 'like', "%{$search}%")
                ->orWhereHas('item', fn ($item) => $item->where('name', 'like', "%{$search}%")))
                ->orWhere('reason', 'like', "%{$search}%"))
            ->when($status !== '', fn ($query) => $query->where('status', $status))
            ->orderBy('created_at', 'desc')
            ->paginate($perPage)
            ->withQueryString();

        return Inertia::render('asset-disposals/Index', [
            'disposals' => $disposals,
            'filters' => [
                'search' => $search,
                'status' => $status,
            ],
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(): Response
    {
        // Hanya aset aktif tanpa pengajuan pending/approved.
        $assets = Asset::query()
            ->where('status', AssetStatus::ACTIVE->value)
            ->whereNotIn('id', AssetDisposal::query()
                ->whereIn('status', [AssetDisposalStatus::Pending->value, AssetDisposalStatus::Approved->value])
                ->select('asset_id'))
            ->with('item:id,name,code')
            ->orderBy('kode_asset')
            ->get(['id', 'kode_asset', 'item_id']);

        return Inertia::render('asset-disposals/Create', [
            'assets' => $assets,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreAssetDisposalRequest $request): RedirectResponse
    {
        $validated = $request->validated();
        $validated['disposed_by'] = Auth::id();

        $disposal = AssetDisposal::create($validated);

        app(RecordAssetHistoryAction::class)->record(
            $disposal->asset,
            [['disposal', null, 'Aset ditandai untuk penghapusan: '.$validated['reason']]],
            Auth::user()
        );

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Pengajuan penghapusan berhasil dibuat.']);

        return redirect()->route('disposals.index');
    }

    /**
     * Display the specified resource.
     */
    public function show(AssetDisposal $disposal): Response
    {
        $disposal->load(['asset:id,kode_asset,serial_number,item_id', 'asset.item:id,name,code', 'disposedBy:id,name']);

        return Inertia::render('asset-disposals/Show', [
            'disposal' => $disposal,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(AssetDisposal $disposal): Response|RedirectResponse
    {
        if ($disposal->status !== AssetDisposalStatus::Pending) {
            Inertia::flash('toast', ['type' => 'error', 'message' => 'Hanya pengajuan berstatus menunggu yang dapat diedit.']);

            return redirect()->route('disposals.index');
        }

        $disposal->load(['asset:id,kode_asset,item_id', 'asset.item:id,name,code']);

        $assets = Asset::query()
            ->where('status', AssetStatus::ACTIVE->value)
            ->whereNotIn('id', AssetDisposal::query()
                ->where('asset_id', '!=', $disposal->asset_id)
                ->whereIn('status', [AssetDisposalStatus::Pending->value, AssetDisposalStatus::Approved->value])
                ->select('asset_id'))
            ->with('item:id,name,code')
            ->orderBy('kode_asset')
            ->get(['id', 'kode_asset', 'item_id']);

        return Inertia::render('asset-disposals/Edit', [
            'disposal' => $disposal,
            'assets' => $assets,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateAssetDisposalRequest $request, AssetDisposal $disposal): RedirectResponse
    {
        if ($disposal->status !== AssetDisposalStatus::Pending) {
            Inertia::flash('toast', ['type' => 'error', 'message' => 'Hanya pengajuan berstatus menunggu yang dapat diperbarui.']);

            return redirect()->route('disposals.index');
        }

        $validated = $request->validated();

        $oldAssetId = $disposal->asset_id;
        $newAssetId = $validated['asset_id'];

        $disposal->update($validated);

        if ($oldAssetId !== $newAssetId) {
            app(RecordAssetHistoryAction::class)->record(
                Asset::find($oldAssetId),
                [['disposal', 'Dihapus dari pengajuan penghapusan', null]],
                Auth::user()
            );

            app(RecordAssetHistoryAction::class)->record(
                Asset::find($newAssetId),
                [['disposal', null, 'Ditambahkan ke pengajuan penghapusan: '.$validated['reason']]],
                Auth::user()
            );
        } else {
            app(RecordAssetHistoryAction::class)->record(
                $disposal->asset,
                [['disposal', null, 'Alasan penghapusan diperbarui: '.$validated['reason']]],
                Auth::user()
            );
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Pengajuan penghapusan berhasil diperbarui.']);

        return redirect()->route('disposals.index');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(AssetDisposal $disposal): RedirectResponse
    {
        if ($disposal->status !== AssetDisposalStatus::Pending) {
            Inertia::flash('toast', ['type' => 'error', 'message' => 'Hanya pengajuan berstatus menunggu yang dapat dihapus.']);

            return redirect()->route('disposals.index');
        }

        $assetId = $disposal->asset_id;
        $disposal->delete();

        app(RecordAssetHistoryAction::class)->record(
            Asset::find($assetId),
            [['disposal', 'Pengajuan penghapusan dibatalkan', null]],
            Auth::user()
        );

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Pengajuan penghapusan berhasil dihapus.']);

        return redirect()->route('disposals.index');
    }

    /**
     * Approve a disposal request.
     */
    public function approve(AssetDisposal $disposal): RedirectResponse
    {
        if ($disposal->status !== AssetDisposalStatus::Pending) {
            Inertia::flash('toast', ['type' => 'error', 'message' => 'Hanya pengajuan berstatus menunggu yang dapat disetujui.']);

            return back();
        }

        if ($disposal->asset->status !== AssetStatus::ACTIVE) {
            Inertia::flash('toast', ['type' => 'error', 'message' => 'Hanya aset berstatus aktif yang dapat dihapus.']);

            return back();
        }

        $disposal->update(['status' => AssetDisposalStatus::Approved]);

        $disposal->asset->update(['status' => AssetStatus::DISPOSED]);

        app(RecordAssetHistoryAction::class)->record(
            $disposal->asset,
            [['disposal', null, 'Aset dihapus (disposal): '.$disposal->reason]],
            Auth::user()
        );

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Pengajuan disetujui; aset ditandai dihapus.']);

        return redirect()->route('disposals.index');
    }

    /**
     * Reject a disposal request.
     */
    public function reject(AssetDisposal $disposal): RedirectResponse
    {
        if ($disposal->status !== AssetDisposalStatus::Pending) {
            Inertia::flash('toast', ['type' => 'error', 'message' => 'Hanya pengajuan berstatus menunggu yang dapat ditolak.']);

            return back();
        }

        $disposal->update(['status' => AssetDisposalStatus::Rejected]);

        app(RecordAssetHistoryAction::class)->record(
            $disposal->asset,
            [['disposal', null, 'Pengajuan penghapusan ditolak']],
            Auth::user()
        );

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Pengajuan penghapusan ditolak.']);

        return redirect()->route('disposals.index');
    }

    /**
     * Bulk delete disposal requests.
     */
    public function bulk(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'ids' => ['required', 'array'],
            'ids.*' => ['exists:asset_disposals,id'],
        ]);

        $pendingIds = AssetDisposal::whereIn('id', $validated['ids'])
            ->where('status', AssetDisposalStatus::Pending)
            ->pluck('id');

        if ($pendingIds->isEmpty()) {
            Inertia::flash('toast', ['type' => 'error', 'message' => 'Tidak ada pengajuan berstatus menunggu yang dipilih.']);

            return back();
        }

        $assetIds = AssetDisposal::whereIn('id', $pendingIds)
            ->pluck('asset_id')
            ->all();

        AssetDisposal::destroy($pendingIds->all());

        foreach ($assetIds as $assetId) {
            app(RecordAssetHistoryAction::class)->record(
                Asset::find($assetId),
                [['disposal', 'Pengajuan penghapusan dibatalkan (massal)', null]],
                Auth::user()
            );
        }

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => $pendingIds->count().' pengajuan penghapusan berhasil dihapus.',
        ]);

        return redirect()->route('disposals.index');
    }
}
