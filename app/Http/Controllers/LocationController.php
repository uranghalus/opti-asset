<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreLocationRequest;
use App\Http\Requests\UpdateLocationRequest;
use App\Models\Location;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class LocationController extends Controller
{
    public function index(Request $request): Response
    {
        Gate::authorize('asset.location.view');

        $perPage = min((int) $request->integer('per_page', 15), 100);

        $search = $request->string('search')->trim()->toString();
        $sort = $request->string('sort')->toString();

        [$sortColumn, $sortDirection] = match ($sort) {
            'name' => ['name', 'asc'],
            '-name' => ['name', 'desc'],
            default => ['created_at', 'desc'],
        };

        $locations = Location::query()
            ->when($search !== '', fn ($query) => $query->where('name', 'like', "%{$search}%"))
            ->orderBy($sortColumn, $sortDirection)
            ->paginate($perPage)
            ->withQueryString();

        return Inertia::render('locations/Index', [
            'locations' => $locations,
            'filters' => [
                'search' => $search,
                'sort' => $sort,
            ],
        ]);
    }

    public function store(StoreLocationRequest $request): RedirectResponse
    {
        Gate::authorize('asset.location.create');

        Location::create($request->validated());

        return back();
    }

    public function update(UpdateLocationRequest $request, Location $location): RedirectResponse
    {
        Gate::authorize('asset.location.edit');

        $location->update($request->validated());

        return back();
    }

    public function destroy(Location $location): RedirectResponse
    {
        Gate::authorize('asset.location.delete');

        $location->delete();

        return back();
    }
}
