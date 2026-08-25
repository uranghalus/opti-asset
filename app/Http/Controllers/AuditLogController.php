<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AuditLogController extends Controller
{
    public function index(Request $request): Response
    {
        $perPage = min((int) $request->integer('per_page', 20), 100);

        $search = $request->string('search')->trim()->toString();
        $action = $request->string('action')->trim()->toString();
        $type = $request->string('type')->trim()->toString();

        $logs = ActivityLog::query()
            ->when($search !== '', fn ($query) => $query->where(fn ($query) => $query
                ->where('user_name', 'like', "%{$search}%")
                ->orWhere('subject_label', 'like', "%{$search}%")
                ->orWhere('subject_type', 'like', "%{$search}%")))
            ->when($action !== '', fn ($query) => $query->where('action', $action))
            ->when($type !== '', fn ($query) => $query->where('subject_type', $type))
            ->latest()
            ->paginate($perPage)
            ->withQueryString();

        return Inertia::render('audit-logs/Index', [
            'logs' => $logs,
            'filters' => [
                'search' => $search,
                'action' => $action,
                'type' => $type,
            ],
            'types' => ActivityLog::query()
                ->select('subject_type')
                ->distinct()
                ->orderBy('subject_type')
                ->pluck('subject_type'),
        ]);
    }
}
