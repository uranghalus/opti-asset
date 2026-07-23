<?php

namespace App\Http\Controllers;

use App\Models\Tenant;
use Illuminate\Http\Request;
use Inertia\Inertia;

class OrganizationController extends Controller
{
    public function index()
    {
        try {
            $tenants = Tenant::latest()->get();
        } catch (\Throwable $e) {
            $tenants = collect();
        }

        return Inertia::render('organizations/Index', [
            'tenants' => $tenants,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'id' => 'required|string|unique:tenants,id|alpha_dash',
            'name' => 'required|string|max:255',
        ]);

        Tenant::create($validated);

        return redirect()->back();
    }

    public function update(Request $request, Tenant $tenant)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
        ]);

        $tenant->update($validated);

        return redirect()->back();
    }

    public function destroy(Tenant $tenant)
    {
        $tenant->delete();

        return redirect()->back();
    }
}
