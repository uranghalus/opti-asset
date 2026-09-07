<?php

namespace App\Http\Controllers;

use App\Models\CapitalizationThreshold;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Inertia\Inertia;
use Inertia\Response;

class CapitalizationThresholdController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Settings/CapitalizationThreshold', [
            'thresholds' => CapitalizationThreshold::orderBy('created_at', 'desc')->get(),
            'activeThreshold' => CapitalizationThreshold::where('is_active', true)->first(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'amount' => 'required|numeric|min:0',
            'currency' => 'required|string|max:3',
        ]);

        // Deactivate others
        CapitalizationThreshold::query()->update(['is_active' => false]);

        $threshold = CapitalizationThreshold::create([
            'amount' => $validated['amount'],
            'currency' => $validated['currency'],
            'created_by' => auth()->id(),
            'is_active' => true,
            'activated_at' => now(),
        ]);

        return response()->json([
            'message' => 'Threshold updated successfully',
            'data' => $threshold,
        ]);
    }

    public function destroy($id): JsonResponse
    {
        $threshold = CapitalizationThreshold::findOrFail($id);
        $threshold->delete();

        return response()->json(['message' => 'Threshold deleted successfully']);
    }
}