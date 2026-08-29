<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreApplicationRequest;
use App\Http\Requests\UpdateApplicationRequest;
use App\Models\Application;
use App\Services\ApplicationService;
use Illuminate\Http\Request;

class ApplicationController extends Controller
{
    public function __construct(protected ApplicationService $applicationService) {}

    public function index(Request $request)
    {
        return response()->json([
            'success' => true,
            'message' => 'Applications retrieved successfully',
            'data' => $this->applicationService->list($request, $request->user()),
        ]);
    }

    public function store(StoreApplicationRequest $request)
    {
        return response()->json([
            'success' => true,
            'message' => 'Application created successfully',
            'data' => $this->applicationService->create($request->validated(), $request->user()),
        ], 201);
    }

    public function show(Application $application)
    {
        return response()->json([
            'success' => true,
            'message' => 'Application retrieved successfully',
            'data' => $this->applicationService->show($application),
        ]);
    }

    public function update(UpdateApplicationRequest $request, Application $application)
    {
        return response()->json([
            'success' => true,
            'message' => 'Application updated successfully',
            'data' => $this->applicationService->update($application, $request->validated()),
        ]);
    }

    public function destroy(Application $application)
    {
        $this->applicationService->delete($application);

        return response()->json([
            'success' => true,
            'message' => 'Application deleted successfully',
            'data' => [],
        ]);
    }
}
