<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\AssignApplicationRequest;
use App\Models\ServiceApplication;
use App\Services\ApplicationAssignmentService;

class ApplicationAssignmentController extends Controller
{
    public function __construct(
        protected ApplicationAssignmentService $service
    ) {}

    public function assign(
        AssignApplicationRequest $request,
        ServiceApplication $application
    ) {
        $assignment = $this->service->assign(
            $application,
            $request->officer_id
        );

        return response()->json([
            'success' => true,
            'message' => 'Application assigned successfully',
            'data' => $assignment,
        ]);
    }
}
