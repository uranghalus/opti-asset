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

        $request->session()->put('current_tenant_id', $validated['tenant_id']);

        return redirect()->back();
    }
}
