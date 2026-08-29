<?php

namespace App\Http\Controllers\Api\Public;

use App\Models\Service;
use App\Http\Controllers\Controller;
use App\Http\Requests\ApplyServiceRequest;
use App\Services\PublicApplicationService;

class PublicApplicationController extends Controller
{
    public function __construct(
        protected PublicApplicationService $applicationService
    ) {}

    public function form(Service $service)
    {
        $form = $this->applicationService->getForm($service);

        if (!$form) {
            return response()->json([
                'success' => false,
                'message' => 'No active form found for this service',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'message' => 'Service form retrieved successfully',
            'data' => $form,
        ]);
    }

    public function apply(
        ApplyServiceRequest $request,
        Service $service
    ) {
        $application = $this->applicationService->apply(
            $service,
            $request->user(),
            $request->validated()
        );

        return response()->json([
            'success' => true,
            'message' => 'Application submitted successfully',
            'data' => $application,
        ], 201);
    }
}