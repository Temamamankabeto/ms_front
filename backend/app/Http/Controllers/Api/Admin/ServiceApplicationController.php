<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateServiceApplicationRequest;
use App\Models\ServiceApplication;
use App\Services\ServiceApplicationService;
use Illuminate\Http\Request;

class ServiceApplicationController extends Controller
{
    public function __construct(protected ServiceApplicationService $applicationService) {}

    public function index(Request $request)
    {
        return response()->json([
            'success' => true,
            'message' => 'Service applications retrieved successfully',
            'data' => $this->applicationService->list($request),
        ]);
    }

    public function show(ServiceApplication $serviceApplication)
    {
        return response()->json([
            'success' => true,
            'message' => 'Service application retrieved successfully',
            'data' => $this->applicationService->show($serviceApplication),
        ]);
    }

    public function update(UpdateServiceApplicationRequest $request, ServiceApplication $serviceApplication)
    {
        return response()->json([
            'success' => true,
            'message' => 'Service application updated successfully',
            'data' => $this->applicationService->update(
                $serviceApplication,
                $request->validated(),
                $request->user()?->id
            ),
        ]);
    }

    public function destroy(ServiceApplication $serviceApplication)
    {
        $this->applicationService->delete($serviceApplication);

        return response()->json([
            'success' => true,
            'message' => 'Service application deleted successfully',
            'data' => [],
        ]);
    }
}
