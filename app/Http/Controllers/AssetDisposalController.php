<?php

namespace App\Http\Controllers;

use App\Actions\RecordAssetHistoryAction;
use App\Http\Requests\StoreAssetDisposalRequest;
use App\Http\Requests\UpdateAssetDisposalRequest;
use App\Models\Asset;
use App\Models\AssetDisposal;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Redirect;
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
            ->with(['asset:id,kode_asset', 'disposedBy:id,name'])
            ->when($search !== '', fn ($query) => $query->whereHas('asset', fn ($q) => $q
                ->where('kode_asset', 'like', "%{$search}%")
                ->orWhere('nama_asset', 'like', "%{$search}%")))
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
        // Only show assets that are active and not already disposed
        $assets = Asset::query()
            ->where('status', 'ACT') // Aktif
            ->whereDoesntHave('disposal', function ($query) {
                $query->where('status', '!=', 'pending'); // Not already approved/rejected disposal
            })
            ->with('item:id,name,code')
            ->orderBy('nama_asset')
            ->get(['id', 'kode_asset', 'nama_asset', 'item_id']);

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

        // Record history for the asset
        app(RecordAssetHistoryAction::class)->record(
            $disposal->asset,
            [['disposal', null, 'Asset marked for disposal: '.$validated['reason']]],
            Auth::user()
        );

        return Redirect::route('disposals.index')
            ->with('success', 'Asset disposal request submitted successfully.');
    }

    /**
     * Display the specified resource.
     */
    public function show(AssetDisposal $disposal): Response
    {
        $disposal->load(['asset:id,kode_asset,nama_asset,serial_number', 'disposedBy:id,name']);

        return Inertia::render('asset-disposals/Show', [
            'disposal' => $disposal,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(AssetDisposal $disposal): Response|RedirectResponse
    {
        // Only allow editing if still pending
        if ($disposal->status !== 'pending') {
            return Redirect::route('disposals.index')
                ->with('error', 'Only pending disposal requests can be edited.');
        }

        $disposal->load(['asset:id,kode_asset,nama_asset']);

        // Get assets for the dropdown (same as create)
        $assets = Asset::query()
            ->where('status', 'ACT')
            ->whereDoesntHave('disposal', function ($query) use ($disposal) {
                $query->where('asset_id', '!=', $disposal->asset_id)
                    ->where('status', '!=', 'pending');
            })
            ->with('item:id,name,code')
            ->orderBy('nama_asset')
            ->get(['id', 'kode_asset', 'nama_asset', 'item_id']);

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
        // Only allow updating if still pending
        if ($disposal->status !== 'pending') {
            return Redirect::route('disposals.index')
                ->with('error', 'Only pending disposal requests can be updated.');
        }

        $validated = $request->validated();

        // If asset changed, we need to handle history for both old and new
        $oldAssetId = $disposal->asset_id;
        $newAssetId = $validated['asset_id'];

        $disposal->update($validated);

        // Record history for asset change if needed
        if ($oldAssetId !== $newAssetId) {
            app(RecordAssetHistoryAction::class)->record(
                Asset::find($oldAssetId),
                [['disposal', 'Asset removed from disposal request', null]],
                Auth::user()
            );

            app(RecordAssetHistoryAction::class)->record(
                Asset::find($newAssetId),
                [['disposal', null, 'Asset added to disposal request: '.$validated['reason']]],
                Auth::user()
            );
        } else {
            // Just reason changed
            app(RecordAssetHistoryAction::class)->record(
                $disposal->asset,
                [['disposal', 'Disposal reason updated: '.$validated['reason'], 'Disposal reason updated: '.$validated['reason']]],
                Auth::user()
            );
        }

        return Redirect::route('disposals.index')
            ->with('success', 'Disposal request updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(AssetDisposal $disposal): RedirectResponse
    {
        // Only allow deletion if still pending
        if ($disposal->status !== 'pending') {
            return Redirect::route('disposals.index')
                ->with('error', 'Only pending disposal requests can be deleted.');
        }

        $assetId = $disposal->asset_id;
        $disposal->delete();

        // Record history
        app(RecordAssetHistoryAction::class)->record(
            Asset::find($assetId),
            [['disposal', 'Asset disposal request cancelled', null]],
            Auth::user()
        );

        return Redirect::route('disposals.index')
            ->with('success', 'Disposal request deleted successfully.');
    }

    /**
     * Approve a disposal request.
     */
    public function approve(AssetDisposal $disposal): RedirectResponse
    {
        Gate::authorize('approve', AssetDisposal::class);

        if ($disposal->status !== 'pending') {
            return Redirect::back()
                ->with('error', 'Only pending disposal requests can be approved.');
        }

        $disposal->update(['status' => 'approved']);

        // Update asset status to disposed
        $disposal->asset->update(['status' => 'DSP']); // Disposed

        // Record history
        app(RecordAssetHistoryAction::class)->record(
            $disposal->asset,
            [['disposal', null, 'Asset disposed: '.$disposal->reason]],
            Auth::user()
        );

        return Redirect::route('disposals.index')
            ->with('success', 'Asset disposal approved and asset marked as disposed.');
    }

    /**
     * Reject a disposal request.
     */
    public function reject(AssetDisposal $disposal): RedirectResponse
    {
        Gate::authorize('reject', AssetDisposal::class);

        if ($disposal->status !== 'pending') {
            return Redirect::back()
                ->with('error', 'Only pending disposal requests can be rejected.');
        }

        $disposal->update(['status' => 'rejected']);

        // Record history
        app(RecordAssetHistoryAction::class)->record(
            $disposal->asset,
            [['disposal', null, 'Asset disposal request rejected']],
            Auth::user()
        );

        return Redirect::route('disposals.index')
            ->with('success', 'Disposal request rejected.');
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

        $ids = $validated['ids'];

        // Only allow bulk deletion of pending requests
        $pendingIds = AssetDisposal::whereIn('id', $ids)
            ->where('status', 'pending')
            ->pluck('id')
            ->toArray();

        if (count($pendingIds) === 0) {
            return Redirect::back()
                ->with('error', 'No pending disposal requests selected for deletion.');
        }

        // Get asset IDs for history
        $assetIds = AssetDisposal::whereIn('id', $pendingIds)
            ->pluck('asset_id')
            ->toArray();

        AssetDisposal::destroy($pendingIds);

        // Record history for each asset
        foreach ($assetIds as $assetId) {
            app(RecordAssetHistoryAction::class)->record(
                Asset::find($assetId),
                [['disposal', 'Asset disposal request cancelled (bulk)', null]],
                Auth::user()
            );
        }

        return Redirect::route('disposals.index')
            ->with('success', 'Selected disposal requests deleted successfully.');
    }
}
