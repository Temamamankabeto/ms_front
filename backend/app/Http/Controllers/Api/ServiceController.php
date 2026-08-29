<?php

namespace App\Http\Controllers\Api;

use App\Models\Service;
use App\Models\ServiceForm;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreServiceRequest;
use App\Http\Requests\UpdateServiceRequest;
use App\Services\ServiceService;
use Illuminate\Http\Request;

class ServiceController extends Controller
{
    public function __construct(
        protected ServiceService $serviceService
    ) {}

    public function index(Request $request)
    {
        $this->authorize('viewAny', Service::class);

        $services = $this->serviceService->getAll($request->user());

        return response()->json([
            'success' => true,
            'message' => 'Services retrieved successfully',
            'data' => $services,
        ]);
    }
    public function allServices(Request $request)
{
    $this->authorize('viewAny', Service::class);

    $services = $this->serviceService->getAllServices(
        $request->user()
    );

    return response()->json([
        'success' => true,
        'message' => 'All services retrieved successfully',
        'data' => $services,
    ]);
}

    public function show(Service $service)
    {
        $this->authorize('view', $service);

        $service->load([
            'assignedUsers:id,name,email',
            'windows:id,name,title,city_title,subcity_title,woreda_title,administrative_level,availability',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Service retrieved successfully',
            'data' => $service,
        ]);
    }

    public function store(StoreServiceRequest $request)
    {
        $this->authorize('create', Service::class);

        $service = $this->serviceService->create($request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Service created successfully',
            'data' => $service,
        ], 201);
    }

    public function update(UpdateServiceRequest $request, Service $service)
    {
        $this->authorize('update', $service);

        $updatedService = $this->serviceService->update($service, $request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Service updated successfully',
            'data' => $updatedService,
        ]);
    }

    public function destroy(Service $service)
    {
        $this->authorize('delete', $service);

        $this->serviceService->delete($service);

        return response()->json([
            'success' => true,
            'message' => 'Service deleted successfully',
        ]);
    }

    public function forms(Service $service)
    {
        $forms = $service->forms()->latest()->paginate(10);

        return response()->json([
            'success' => true,
            'message' => 'Forms retrieved successfully',
            'data' => $forms->items(),
            'meta' => [
                'current_page' => $forms->currentPage(),
                'last_page' => $forms->lastPage(),
                'per_page' => $forms->perPage(),
                'total' => $forms->total(),
            ],
        ]);
    }

    public function storeForm(Request $request, Service $service)
    {
        $validated = $request->validate([
            'title' => ['required', 'string'],
            'description' => ['nullable', 'string'],
        ]);

        $form = $service->forms()->create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Form created successfully',
            'data' => $form,
        ], 201);
    }

    public function showForm(ServiceForm $serviceForm)
    {
        return response()->json([
            'success' => true,
            'message' => 'Form retrieved successfully',
            'data' => $serviceForm,
        ]);
    }

    public function updateForm(Request $request, ServiceForm $serviceForm)
    {
        $validated = $request->validate([
            'title' => ['required', 'string'],
            'description' => ['nullable', 'string'],
        ]);

        $serviceForm->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Form updated successfully',
            'data' => $serviceForm,
        ]);
    }

    public function destroyForm(ServiceForm $serviceForm)
    {
        $serviceForm->delete();

        return response()->json([
            'success' => true,
            'message' => 'Form deleted successfully',
        ]);
    }

    public function toggleForm(ServiceForm $serviceForm)
    {
        $serviceForm->update([
            'is_active' => !$serviceForm->is_active,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Form status updated successfully',
            'data' => $serviceForm,
        ]);
    }
}
