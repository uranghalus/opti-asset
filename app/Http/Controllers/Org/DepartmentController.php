<?php

namespace App\Http\Controllers\Org;

use App\Http\Controllers\Controller;
use App\Models\Department;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Inertia\Inertia;
use Inertia\Response;

class DepartmentController extends Controller
{
    /**
     * Display a listing of the departments.
     */
    public function index(Request $request): Response
    {
        $query = Department::query();

        // Server-side search across kode_department and nama_department
        if ($request->filled('search')) {
            $search = $request->string('search')->trim()->toString();
            $query->where(function ($q) use ($search) {
                $q->where('kode_department', 'like', "%{$search}%")
                    ->orWhere('nama_department', 'like', "%{$search}%");
            });
        }

        $departments = $query->withCount('employees')
            ->orderBy('kode_department', 'asc')
            ->paginate(12)
            ->withQueryString();

        return Inertia::render('Departments/Index', [
            'departments' => $departments,
            'filters' => $request->only(['search']),
        ]);
    }

    /**
     * Display the specified department.
     */
    public function show(Department $department): Response
    {
        return Inertia::render('Departments/Show', [
            'department' => $department->load(['employees', 'hod', 'manager']),
        ]);
    }

    /**
     * Trigger sync with Optigate Portal.
     */
    public function sync(): RedirectResponse
    {
        try {
            Artisan::call('app:sync-departments');

            Inertia::flash('toast', ['type' => 'success', 'message' => 'Sinkronisasi departemen berhasil dilakukan.']);
        } catch (\Throwable $th) {
            Inertia::flash('toast', ['type' => 'error', 'message' => 'Gagal sinkronisasi: '.$th->getMessage()]);
        }

        return redirect()->route('departments.index');
    }
}
