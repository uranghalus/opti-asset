<?php

namespace App\Http\Controllers;

use App\Http\Requests\TenantSwitchRequest;
use App\Models\ActivityLog;
use App\Models\Tenant;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;

class TenantSwitchController extends Controller
{
    public function switch(TenantSwitchRequest $request): RedirectResponse
    {
        $user = $request->user();
        $validated = $request->validated();

        // 4. Resolve tenant (404 if missing)
        $tenant = Tenant::findOrFail($validated['tenant_id']);

        // 5. Scope/pivot — unless super-admin
        if (! $user->hasRole('super-admin') && ! $user->tenants()->where('tenants.id', $tenant->id)->exists()) {
            return redirect()->back()->withErrors(['tenant_id' => 'Anda tidak memiliki akses ke tenant ini.']);
        }

        // 6. Session (capture previous before put)
        $previousTenantId = $request->session()->get('current_tenant_id');
        $isActive = $previousTenantId === $tenant->id;

        $request->session()->put('current_tenant_id', $tenant->id);

        // 7. Audit — written in NEW tenant context (after session put)
        ActivityLog::create([
            'user_id' => $user->id,
            'user_name' => $user->name,
            'action' => 'tenant.switch',
            'subject_type' => Tenant::class,
            'subject_id' => $tenant->id,
            'subject_label' => $tenant->name,
            'properties' => [
                'from_tenant_id' => $previousTenantId,
                'to_tenant_id' => $tenant->id,
                'action' => 'tenant.switch',
            ],
        ]);

        // 8. Respond
        $message = $isActive
            ? 'Tenant "'.$tenant->name.'" sudah aktif.'
            : 'Berhasil beralih ke tenant "'.$tenant->name.'".';

        Inertia::flash('toast', ['type' => 'success', 'message' => $message]);

        return redirect()->route('dashboard');
    }
}
