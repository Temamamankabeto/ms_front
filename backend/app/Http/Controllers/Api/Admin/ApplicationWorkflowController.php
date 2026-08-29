<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\ApplicationActionRequest;
use App\Models\ServiceApplication;
use App\Services\ApplicationWorkflowService;

class ApplicationWorkflowController extends Controller
{
    public function __construct(
        protected ApplicationWorkflowService $workflowService
    ) {}

    public function approve(ServiceApplication $application)
    {
        return response()->json([
            'success' => true,
            'message' => 'Application approved successfully',
            'data' => $this->workflowService->approve($application),
        ]);
    }

    public function reject(
        ApplicationActionRequest $request,
        ServiceApplication $application
    ) {
        return response()->json([
            'success' => true,
            'message' => 'Application rejected successfully',
            'data' => $this->workflowService->reject(
                $application,
                $request->reason
            ),
        ]);
    }

    public function returnForCorrection(
        ApplicationActionRequest $request,
        ServiceApplication $application
    ) {
        return response()->json([
            'success' => true,
            'message' => 'Application returned successfully',
            'data' => $this->workflowService->returnForCorrection(
                $application,
                $request->reason
            ),
        ]);
    }

    public function complete(ServiceApplication $application)
    {
        return response()->json([
            'success' => true,
            'message' => 'Application completed successfully',
            'data' => $this->workflowService->complete($application),
        ]);
    }
}
