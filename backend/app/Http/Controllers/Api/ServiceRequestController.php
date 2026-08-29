<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ServiceRequest;
use Illuminate\Http\Request;

class ServiceRequestController extends Controller
{
    public function index(Request $request)
    {
        $query = ServiceRequest::query()->with(['customer:id,name,email', 'officer:id,name,email']);

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        if ($request->filled('search')) {
            $search = $request->string('search');
            $query->where('service_name', 'like', "%{$search}%");
        }

        $user = $request->user();
        if ($request->boolean('mine') && $user) {
            $query->where('customer_id', $user->id);
        }

        if ($request->boolean('assigned') && $user) {
            $query->where('assigned_officer_id', $user->id);
        }

        $requests = $query->latest()->paginate((int) $request->get('per_page', 10));

        return response()->json([
            'success' => true,
            'message' => 'Service requests fetched successfully.',
            'data' => $requests->items(),
            'meta' => [
                'current_page' => $requests->currentPage(),
                'per_page' => $requests->perPage(),
                'total' => $requests->total(),
                'last_page' => $requests->lastPage(),
            ],
        ]);
    }

    public function show(int $id)
    {
        $request = ServiceRequest::with(['customer:id,name,email', 'officer:id,name,email'])->findOrFail($id);

        return response()->json([
            'success' => true,
            'message' => 'Service request fetched successfully.',
            'data' => $request,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'service_name' => ['required', 'string', 'max:255'],
            'status' => ['nullable', 'string', 'max:50'],
            'assigned_officer_id' => ['nullable', 'integer', 'exists:users,id'],
            'data' => ['nullable', 'array'],
            'city_id' => ['nullable', 'integer'],
            'subcity_id' => ['nullable', 'integer'],
            'woreda_id' => ['nullable', 'integer'],
        ]);

        $validated['customer_id'] = $request->user()?->id;
        $validated['status'] = $validated['status'] ?? 'draft';

        $serviceRequest = ServiceRequest::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Service request created successfully.',
            'data' => $serviceRequest,
        ], 201);
    }

    public function update(Request $request, int $id)
    {
        $serviceRequest = ServiceRequest::findOrFail($id);

        $validated = $request->validate([
            'service_name' => ['sometimes', 'string', 'max:255'],
            'status' => ['sometimes', 'string', 'max:50'],
            'assigned_officer_id' => ['nullable', 'integer', 'exists:users,id'],
            'data' => ['nullable', 'array'],
        ]);

        $serviceRequest->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Service request updated successfully.',
            'data' => $serviceRequest,
        ]);
    }
}
