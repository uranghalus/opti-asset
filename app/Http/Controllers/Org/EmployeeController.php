<?php

namespace App\Http\Controllers\Org;

use App\Http\Controllers\Controller;
use App\Models\Department;
use App\Models\Employee;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Inertia\Inertia;
use Inertia\Response;

class EmployeeController extends Controller
{
    /**
     * Display a listing of the employees.
     */
    public function index(Request $request): Response
    {
        $query = Employee::query()->with('department');

        if ($request->filled('search')) {
            $search = $request->string('search')->trim()->toString();
            $query->where(function ($q) use ($search) {
                $q->where('nik_employee', 'like', "%{$search}%")
                    ->orWhere('nama_employee', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if ($request->filled('department')) {
            $query->where('id_department', $request->string('department'));
        }

        $employees = $query->orderBy('nama_employee', 'asc')
            ->paginate(12)
            ->withQueryString();

        return Inertia::render('Employees/Index', [
            'employees' => $employees,
            'departments' => Department::orderBy('nama_department')
                ->get(['id_department', 'kode_department', 'nama_department']),
            'filters' => $request->only(['search', 'department']),
        ]);
    }

    /**
     * Display the specified employee.
     */
    public function show(Employee $employee): Response
    {
        return Inertia::render('Employees/Show', [
            'employee' => $employee->load('department'),
        ]);
    }

    /**
     * Trigger sync with Optigate Portal.
     */
    public function sync(): RedirectResponse
    {
        try {
            Artisan::call('app:sync-employees');

            Inertia::flash('toast', ['type' => 'success', 'message' => 'Sinkronisasi employee berhasil dilakukan.']);
        } catch (\Throwable $th) {
            Inertia::flash('toast', ['type' => 'error', 'message' => 'Gagal sinkronisasi: '.$th->getMessage()]);
        }

        return redirect()->route('employees.index');
    }
}
