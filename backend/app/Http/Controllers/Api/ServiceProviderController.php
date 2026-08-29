<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreServiceProviderRequest;
use App\Http\Requests\UpdateServiceProviderRequest;
use App\Models\ServiceProvider;
use Illuminate\Http\Request;

class ServiceProviderController extends Controller
{
    public function index(Request $request)
    {
        $this->authorize('viewAny', ServiceProvider::class);

        $perPage = (int) $request->integer('per_page', 15);
        $perPage = max(1, min($perPage, 100));
        $search = trim((string) $request->query('search', ''));

        $providers = ServiceProvider::query()
            ->when($search !== '', fn ($query) => $query->where('name', 'like', "%{$search}%"))
            ->orderBy('name')
            ->paginate($perPage);

        return response()->json([
            'success' => true,
            'message' => 'Service providers retrieved successfully',
            'data' => $providers->items(),
            'meta' => [
                'current_page' => $providers->currentPage(),
                'last_page' => $providers->lastPage(),
                'per_page' => $providers->perPage(),
                'total' => $providers->total(),
            ],
        ]);
    }

    public function store(StoreServiceProviderRequest $request)
    {
        $this->authorize('create', ServiceProvider::class);

        $provider = ServiceProvider::create($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Service provider created successfully',
            'data' => $provider,
        ], 201);
    }

    public function show(ServiceProvider $serviceProvider)
    {
        $this->authorize('view', $serviceProvider);

        return response()->json([
            'success' => true,
            'message' => 'Service provider retrieved successfully',
            'data' => $serviceProvider,
        ]);
    }

    public function update(UpdateServiceProviderRequest $request, ServiceProvider $serviceProvider)
    {
        $this->authorize('update', $serviceProvider);

        $serviceProvider->update($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Service provider updated successfully',
            'data' => $serviceProvider->refresh(),
        ]);
    }

    public function destroy(ServiceProvider $serviceProvider)
    {
        $this->authorize('delete', $serviceProvider);

        $serviceProvider->delete();

        return response()->json([
            'success' => true,
            'message' => 'Service provider deleted successfully',
            'data' => null,
        ]);
    }
}
