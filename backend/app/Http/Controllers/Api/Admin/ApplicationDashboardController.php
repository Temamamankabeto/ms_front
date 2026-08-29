<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Services\ApplicationDashboardService;
use Illuminate\Http\Request;

class ApplicationDashboardController extends Controller
{
    public function __construct(protected ApplicationDashboardService $service) {}

    public function stats(Request $request)
    {
        return $this->summary($request);
    }

    public function summary(Request $request)
    {
        return response()->json([
            'success' => true,
            'message' => 'Application summary retrieved successfully',
            'data' => $this->service->stats($request->user()),
        ]);
    }
}
