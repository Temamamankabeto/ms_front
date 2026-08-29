<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreServiceCriterionRequest;
use App\Http\Requests\UpdateServiceCriterionRequest;
use App\Models\ServiceCriterion;
use Illuminate\Http\Request;

class ServiceCriterionController extends Controller
{
    public function index(Request $request)
    {
        $query = ServiceCriterion::query()
            ->with('service:id,name')
            ->when($request->filled('service_id'), function ($query) use ($request) {
                $query->where('service_id', $request->integer('service_id'));
            })
            ->when($request->filled('status'), function ($query) use ($request) {
                if ($request->input('status') === 'active') {
                    $query->where('is_active', true);
                }

                if ($request->input('status') === 'inactive') {
                    $query->where('is_active', false);
                }
            })
            ->when($request->filled('search'), function ($query) use ($request) {
                $search = $request->input('search');

                $query->where(function ($q) use ($search) {
                    $q->where('title', 'like', "%{$search}%")
                        ->orWhere('criteria', 'like', "%{$search}%")
                        ->orWhereHas('service', fn ($service) => $service->where('name', 'like', "%{$search}%"));
                });
            })
            ->orderBy('service_id')
            ->orderBy('sort_order')
            ->orderByDesc('id');

        $perPage = min((int) $request->integer('per_page', 4), 1000);
        $criteria = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'message' => 'Service criteria retrieved successfully',
            'data' => $criteria->items(),
            'meta' => [
                'current_page' => $criteria->currentPage(),
                'last_page' => $criteria->lastPage(),
                'per_page' => $criteria->perPage(),
                'total' => $criteria->total(),
            ],
        ]);
    }

    public function store(StoreServiceCriterionRequest $request)
    {
        $criterion = ServiceCriterion::create([
            ...$request->validated(),
            'sort_order' => $request->integer('sort_order', 0),
            'is_active' => $request->boolean('is_active', true),
        ])->load('service:id,name');

        return response()->json([
            'success' => true,
            'message' => 'Service criterion created successfully',
            'data' => $criterion,
        ], 201);
    }

    public function show(ServiceCriterion $serviceCriterion)
    {
        return response()->json([
            'success' => true,
            'message' => 'Service criterion retrieved successfully',
            'data' => $serviceCriterion->load('service:id,name'),
        ]);
    }

    public function update(UpdateServiceCriterionRequest $request, ServiceCriterion $serviceCriterion)
    {
        $serviceCriterion->update($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Service criterion updated successfully',
            'data' => $serviceCriterion->fresh('service:id,name'),
        ]);
    }

    public function destroy(ServiceCriterion $serviceCriterion)
    {
        $serviceCriterion->delete();

        return response()->json([
            'success' => true,
            'message' => 'Service criterion deleted successfully',
            'data' => null,
        ]);
    }
}
