<?php

namespace App\Http\Controllers;

use App\Actions\RecordAssetHistoryAction;
use App\Enums\AssetStatus;
use App\Enums\AssetTransferStatus;
use App\Http\Requests\StoreAssetTransferRequest;
use App\Models\Asset;
use App\Models\AssetTransfer;
use App\Models\Department;
use App\Models\Employee;
use App\Models\Location;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AssetTransferController extends Controller
{
    public function __construct(
        private RecordAssetHistoryAction $recordHistory,
    ) {}

    public function index(Request $request): Response
    {
        $perPage = min((int) $request->integer('per_page', 15), 100);

        $search = $request->string('search')->trim()->toString();
        $status = $request->string('status')->trim()->toString();

        $transfers = AssetTransfer::query()
            ->with([
                'asset:id,kode_asset,serial_number',
                'fromLocation:id,name',
                'toLocation:id,name',
                'requester:id,name',
                'approver:id,name',
            ])
            ->when($search !== '', fn ($query) => $query
                ->where(fn ($q) => $q
                    ->whereHas('asset', fn ($q) => $q
                        ->where('kode_asset', 'like', "%{$search}%")
                        ->orWhere('serial_number', 'like', "%{$search}%")))
                ->orWhere('notes', 'like', "%{$search}%"))
            ->when($status !== '', fn ($query) => $query->where('status', $status))
            ->orderBy('created_at', 'desc')
            ->paginate($perPage)
            ->withQueryString();

        return Inertia::render('asset-transfers/Index', [
            'transfers' => $transfers,
            'departments' => Department::query()->orderBy('nama_department')->get(['id_department', 'nama_department']),
            'filters' => [
                'search' => $search,
                'status' => $status,
            ],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('asset-transfers/Create', [
            'assets' => Asset::query()
                ->where('status', '!=', 'DSP')
                ->orderBy('kode_asset')
                ->get(['id', 'kode_asset', 'serial_number', 'brand', 'model']),
            'locations' => Location::query()->orderBy('name')->get(['id', 'name']),
            'departments' => Department::query()->orderBy('nama_department')->get(['id_department', 'nama_department']),
            'employees' => Employee::query()->orderBy('nama_employee')->get(['id_employee', 'nama_employee']),
        ]);
    }

    public function store(StoreAssetTransferRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        $asset = Asset::findOrFail($validated['asset_id']);

        $transfer = AssetTransfer::create([
            ...$validated,
            'from_location_id' => $asset->location_id,
            'from_department_id' => $asset->department_id,
            'from_user_id' => $asset->assigned_user_id,
            'status' => AssetTransferStatus::Pending,
            'requested_by' => $request->user()->id,
        ]);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Permohonan mutasi aset berhasil diajukan.',
        ]);

        return redirect()->route('asset-transfers.index');
    }

    public function show(AssetTransfer $assetTransfer): Response
    {
        $assetTransfer->load([
            'asset:id,kode_asset,serial_number,brand,model,status,purchase_date,notes',
            'fromLocation:id,name',
            'toLocation:id,name',
            'requester:id,name,email',
            'approver:id,name,email',
        ]);

        return Inertia::render('asset-transfers/Show', [
            'transfer' => $assetTransfer,
        ]);
    }

    public function approve(Request $request, AssetTransfer $assetTransfer): RedirectResponse
    {
        $request->validate([
            'notes' => ['nullable', 'string'],
        ]);

        $assetTransfer->update([
            'status' => AssetTransferStatus::Approved,
            'approved_by' => $request->user()->id,
            'approved_at' => now(),
            'notes' => $request->input('notes', $assetTransfer->notes),
        ]);

        $asset = $assetTransfer->asset;

        $this->recordHistory->fromUpdate(
            $asset,
            [
                'status' => AssetStatus::MUTATED->value,
                'location_id' => $assetTransfer->to_location_id,
                'department_id' => $assetTransfer->to_department_id,
            ],
            null,
            $request->user(),
        );

        $asset->update([
            'location_id' => $assetTransfer->to_location_id,
            'department_id' => $assetTransfer->to_department_id,
            'assigned_user_id' => $assetTransfer->to_user_id,
            'status' => AssetStatus::MUTATED,
        ]);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Mutasi aset berhasil disetujui.',
        ]);

        return redirect()->route('asset-transfers.index');
    }

    public function reject(Request $request, AssetTransfer $assetTransfer): RedirectResponse
    {
        $request->validate([
            'notes' => ['nullable', 'string'],
        ]);

        $assetTransfer->update([
            'status' => AssetTransferStatus::Rejected,
            'approved_by' => $request->user()->id,
            'approved_at' => now(),
            'notes' => $request->input('notes', $assetTransfer->notes),
        ]);

        Inertia::flash('toast', [
            'type' => 'info',
            'message' => 'Permohonan mutasi aset ditolak.',
        ]);

        return redirect()->route('asset-transfers.index');
    }
}
