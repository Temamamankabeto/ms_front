<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Services\ApplicationReportService;

class ApplicationReportController extends Controller
{
    public function __construct(
        protected ApplicationReportService $service
    ) {}

    public function summary()
    {
        return response()->json([
            'success' => true,
            'message' => 'Application report generated successfully',
            'data' => $this->service->summary(),
        ]);
    }
}
