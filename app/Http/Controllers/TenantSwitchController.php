<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class TenantSwitchController extends Controller
{
    public function switch(Request $request)
    {
        $validated = $request->validate([
            'tenant_id' => 'required|string|exists:tenants,id',
        ]);

        $user = $request->user();
        if (! $user->hasRole('super-admin') && ! $user->tenants()->where('tenants.id', $validated['tenant_id'])->exists()) {
            return redirect()->back()->withErrors(['tenant_id' => 'Anda tidak memiliki akses ke tenant ini.']);
        }

        $request->session()->put('current_tenant_id', $validated['tenant_id']);

        return redirect()->back();
    }
}
