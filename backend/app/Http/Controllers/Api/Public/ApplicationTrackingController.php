<?php

namespace App\Http\Controllers\Api\Public;

use App\Http\Controllers\Controller;
use App\Http\Requests\TrackServiceApplicationRequest;
use App\Services\ApplicationTrackingService;

class ApplicationTrackingController extends Controller
{
    public function __construct(
        protected ApplicationTrackingService $trackingService
    ) {}

    public function track(
        TrackServiceApplicationRequest $request
    ) {
        $application = $this->trackingService->track(
            $request->tracking_number
        );

        if (!$application) {
            return response()->json([
                'success' => false,
                'message' => 'Application not found',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'message' => 'Application retrieved successfully',
            'data' => $application,
        ]);
    }
}