<?php

use App\Http\Controllers\Settings\CapitalizationThresholdController;
use App\Http\Controllers\Settings\ProfileController;
use App\Http\Controllers\Settings\SecurityController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth'])->group(function () {
    Route::redirect('settings', '/settings/profile');

    Route::get('settings/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('settings/profile', [ProfileController::class, 'update'])->name('profile.update');
});

Route::middleware(['auth', 'verified'])->group(function () {
    Route::delete('settings/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    Route::get('settings/security', [SecurityController::class, 'edit'])->name('security.edit');

    Route::put('settings/password', [SecurityController::class, 'update'])
        ->middleware('throttle:6,1')
        ->name('user-password.update');

    Route::inertia('settings/appearance', 'settings/appearance')->name('appearance.edit');

    // FR-13.3 — Ambang batas kapitalisasi (Super User / setting.edit)
    Route::get('settings/capitalization-threshold', [CapitalizationThresholdController::class, 'index'])
        ->name('settings.capitalization-threshold.index');

    Route::post('settings/capitalization-threshold', [CapitalizationThresholdController::class, 'store'])
        ->name('settings.capitalization-threshold.store');

    Route::post('settings/capitalization-threshold/reassign-types', [CapitalizationThresholdController::class, 'reassignTypes'])
        ->name('settings.capitalization-threshold.reassign-types');

    Route::delete('settings/capitalization-threshold/{threshold}', [CapitalizationThresholdController::class, 'destroy'])
        ->name('settings.capitalization-threshold.destroy');
});

Route::get('.well-known/passkey-endpoints', function () {
    return response()->json([
        'enroll' => route('security.edit'),
        'manage' => route('security.edit'),
    ]);
})->name('well-known.passkeys');
