<?php

namespace App\Http\Controllers\Central;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TenantController extends Controller
{
    //
    public function index()
    {
        return Inertia::render('Central/Tenants/Index', [
            'tenants' => Tenant::latest()->get()
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'id' => 'required|string|unique:tenants,id|alpha_dash', // Jadi URL Path
            'name' => 'required|string|max:255',
        ]);

        Tenant::create($validated);
        return redirect()->back();
    }

    public function destroy(Tenant $tenant)
    {
        $tenant->delete();
        return redirect()->back();
    }
}
