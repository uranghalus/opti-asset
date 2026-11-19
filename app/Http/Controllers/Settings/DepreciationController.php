<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class DepreciationController extends Controller
{
    public function index(): Response
    {
        Gate::authorize('setting.edit');

        return Inertia::render('settings/depreciation');
    }

    public function run(): RedirectResponse
    {
        Gate::authorize('setting.edit');

        Artisan::call('app:run-depreciation');

        return back()->with('toast', ['type' => 'success', 'message' => 'Penyusutan selesai dijalankan. '.Artisan::output()]);
    }
}
