<?php

namespace App\Http\Controllers\Api\Public;

use App\Models\Service;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use App\Services\PublicServiceService;

class PublicServiceController extends Controller
{
    public function __construct(
        protected PublicServiceService $publicServiceService
    ) {}

    public function index(Request $request)
    {
        return response()->json([
            'success' => true,
            'message' => 'Services retrieved successfully',
            'data' => $this->publicServiceService->getAll($request),
        ]);
    }

    public function featured()
    {
        return response()->json([
            'success' => true,
            'message' => 'Featured services retrieved successfully',
            'data' => $this->publicServiceService->featured(),
        ]);
    }

    public function show(Service $service)
    {
        return response()->json([
            'success' => true,
            'message' => 'Service retrieved successfully',
            'data' => $service->load('windows'),
        ]);
    }

    public function windowServices(Request $request)
    {
        return response()->json([
            'success' => true,
            'message' => 'Window services retrieved successfully',
            'data' => $this->publicServiceService->groupByWindow($request),
        ]);
    }
}
