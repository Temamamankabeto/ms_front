<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Services\ReportingDashboardService;
use Illuminate\Http\Request;

class ReportingDashboardController extends Controller
{
    public function __construct(protected ReportingDashboardService $service) {}

    public function index(Request $request)
    {
        return response()->json([
            'success' => true,
            'message' => 'Dashboard retrieved successfully.',
            'data' => $this->service->dashboard($request, $request->user()),
            'meta' => null,
        ]);
    }

    public function report(Request $request)
    {
        return response()->json([
            'success' => true,
            'message' => 'Dashboard report retrieved successfully.',
            'data' => $this->service->report($request, $request->user()),
            'meta' => ['current_page' => 1, 'per_page' => 0, 'total' => 0, 'last_page' => 1],
        ]);
    }
}
