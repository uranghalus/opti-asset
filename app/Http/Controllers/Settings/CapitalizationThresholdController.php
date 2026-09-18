<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCapitalizationThresholdRequest;
use App\Models\CapitalizationThreshold;
use App\Services\AssetTypeAssigner;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class CapitalizationThresholdController extends Controller
{
    public function index(): Response
    {
        Gate::authorize('setting.edit');

        $thresholds = CapitalizationThreshold::query()
            ->with('creator:id,name')
            ->orderByDesc('created_at')
            ->get();

        return Inertia::render('settings/capitalization-threshold', [
            'thresholds' => $thresholds,
            'activeThreshold' => CapitalizationThreshold::query()->where('is_active', true)->first(),
        ]);
    }

    public function store(StoreCapitalizationThresholdRequest $request): RedirectResponse
    {
        Gate::authorize('setting.edit');

        $validated = $request->validated();

        CapitalizationThreshold::query()->update(['is_active' => false]);

        CapitalizationThreshold::create([
            'amount' => $validated['amount'],
            'currency' => $validated['currency'] ?? 'IDR',
            'created_by' => $request->user()->id,
            'is_active' => true,
            'activated_at' => now(),
        ]);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Ambang batas kapitalisasi berhasil disimpan.',
        ]);

        return back();
    }

    public function destroy(CapitalizationThreshold $threshold): RedirectResponse
    {
        Gate::authorize('setting.edit');

        $threshold->delete();

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Riwayat ambang batas dihapus.',
        ]);

        return back();
    }

    public function reassignTypes(): RedirectResponse
    {
        Gate::authorize('setting.edit');

        $reassigned = app(AssetTypeAssigner::class)->reassignAll();

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => "Tipe aset dihitung ulang untuk {$reassigned} aset.",
        ]);

        return back();
    }
}
