<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreOrganizationRequest;
use App\Http\Requests\UpdateOrganizationRequest;
use App\Models\Tenant;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Inertia\Inertia;
use Inertia\Response;

class OrganizationController extends Controller
{
    public function index(Request $request): Response
    {
        $perPage = min((int) $request->input('per_page', 15), 100);

        $tenants = Tenant::latest()
            ->when($request->input('search'), fn ($q, $s) => $q->where('name', 'like', "%{$s}%"))
            ->paginate($perPage)
            ->withQueryString();

        return Inertia::render('organizations/Index', [
            'tenants' => $tenants,
        ]);
    }

    public function store(StoreOrganizationRequest $request): RedirectResponse
    {
        $tenant = Tenant::create($request->validated());

        $request->user()->tenants()->attach($tenant->id);

        return redirect()->back();
    }

    public function update(UpdateOrganizationRequest $request, Tenant $tenant): RedirectResponse
    {
        $tenant->update($request->validated());

        return redirect()->back();
    }

    public function destroy(Tenant $tenant): RedirectResponse
    {
        $tenant->delete();

        return redirect()->back();
    }

    public function sync(Request $request): RedirectResponse
    {
        try {
            Artisan::call('app:sync-tenants');

            $request->user()->tenants()->syncWithoutDetaching(Tenant::pluck('id'));

            Inertia::flash('toast', ['type' => 'success', 'message' => 'Sinkronisasi organisasi berhasil dilakukan.']);
        } catch (\Throwable $th) {
            Inertia::flash('toast', ['type' => 'error', 'message' => 'Gagal sinkronisasi: '.$th->getMessage()]);
        }

        return redirect()->route('organizations.index');
    }
}
