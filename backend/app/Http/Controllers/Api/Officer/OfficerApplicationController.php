<?php

namespace App\Http\Controllers\Api\Officer;

use App\Http\Controllers\Controller;
use App\Http\Requests\OfficerApplicationActionRequest;
use App\Models\ApplicationQueue;
use App\Models\CustomerFeedback;
use App\Models\ServiceApplication;
use App\Services\OfficerApplicationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class OfficerApplicationController extends Controller
{
    public function __construct(
        protected OfficerApplicationService $applicationService
    ) {}

    // =========================
    // NOTIFICATIONS
    // =========================
    public function notifications(Request $request)
    {
        return response()->json([
            'success' => true,
            'message' => 'Officer notifications retrieved successfully',
            'data' => $this->applicationService->notificationSummary($request->user()),
        ]);
    }

    // =========================
    // QUEUE LIST
    // =========================
    public function queue(Request $request)
    {
        return response()->json([
            'success' => true,
            'message' => 'Officer queue retrieved successfully',
            'data' => $this->applicationService->queue(
                $request->user(),
                $request->query('bucket'),
                $request->query('search')
            ),
        ]);
    }

    // =========================
    // SHOW APPLICATION
    // =========================
    public function show(ServiceApplication $application)
    {
        return response()->json([
            'success' => true,
            'message' => 'Application retrieved successfully',
            'data' => $this->applicationService->show($application),
        ]);
    }

    // ==========================================================
    // ACCEPT → MOVE TO SERVING
    // ==========================================================
    public function accept(OfficerApplicationActionRequest $request, ServiceApplication $application)
    {
        DB::transaction(function () use ($request, $application) {

            // APPLICATION UPDATE
            $application->update([
                'status' => 'in_progress',
                'current_officer_id' => $request->user()->id,
                'current_stage' => 'serving',
            ]);

            // QUEUE UPDATE
            if ($application->queue) {
                $application->queue->update([
                    'status' => 'serving',
                    'called_at' => now(),
                ]);
            }
        });

        return response()->json([
            'success' => true,
            'message' => 'Application accepted and moved to serving',
            'data' => $this->applicationService->show($application->fresh()),
        ]);
    }

    // ==========================================================
    // APPROVE → COMPLETED
    // ==========================================================
    public function approve(OfficerApplicationActionRequest $request, ServiceApplication $application)
    {
        DB::transaction(function () use ($request, $application) {

            $application->update([
                'status' => 'approved',
                'completed_at' => now(),
            ]);

            if ($application->queue) {
                $application->queue->update([
                    'status' => 'completed',
                    'completed_at' => now(),
                ]);
            }
        });

        return response()->json([
            'success' => true,
            'message' => 'Application approved and completed',
            'data' => $this->applicationService->show($application->fresh()),
        ]);
    }

    // ==========================================================
    // COMPLETE → COMPLETED
    // ==========================================================
public function complete(
    OfficerApplicationActionRequest $request,
    ServiceApplication $application
) {
    $feedback = null;

    DB::transaction(function () use ($application, &$feedback) {

        // Complete application
        $application->update([
            'status' => 'completed',
            'completed_at' => now(),
        ]);

        // Complete queue
        if ($application->queue) {
            $application->queue->update([
                'status' => 'completed',
                'completed_at' => now(),
            ]);
        }

        // Create feedback record if it doesn't exist
        $feedback = CustomerFeedback::firstOrCreate(
            [
                'service_application_id' => $application->id,
            ],
            [
                'customer_id' => $application->customer_id,
                'token' => (string) Str::uuid(),
            ]
        );
    });

    $feedbackLink = config('app.frontend_url')
        . '/feedback/' . $feedback->token;

    return response()->json([
        'success' => true,
        'message' => 'Application completed successfully',
        'data' => [
            'application' => $this->applicationService->show(
                $application->fresh(['queue'])
            ),

            'feedback' => [
                'token' => $feedback->token,
                'link' => $feedbackLink,
            ],
        ],
    ]);
}

    // ==========================================================
    // REJECT → COMPLETED (REMOVED FROM ACTIVE QUEUE)
    // ==========================================================
    public function reject(OfficerApplicationActionRequest $request, ServiceApplication $application)
    {
        DB::transaction(function () use ($request, $application) {

            $application->update([
                'status' => 'rejected',
                'rejected_at' => now(),
                'rejection_reason' => $request->remark ?? $request->reason,
            ]);

            if ($application->queue) {
                $application->queue->update([
                    'status' => 'completed',
                    'completed_at' => now(),
                ]);
            }
        });

        return response()->json([
            'success' => true,
            'message' => 'Application rejected and removed from queue',
            'data' => $this->applicationService->show($application->fresh()),
        ]);
    }

    // ==========================================================
    // OPTIONAL ACTIONS (NO QUEUE CHANGE)
    // ==========================================================
    public function share(OfficerApplicationActionRequest $request, ServiceApplication $application)
    {
        return response()->json([
            'success' => true,
            'message' => 'Application shared successfully',
            'data' => $this->applicationService->share(
                $application,
                $request->user(),
                $request->validated()
            ),
        ]);
    }

    public function forwardToBackOfficer(OfficerApplicationActionRequest $request, ServiceApplication $application)
    {
        return response()->json([
            'success' => true,
            'message' => 'Application forwarded to back officer successfully',
            'data' => $this->applicationService->forwardToBackOfficer(
                $application,
                $request->user(),
                $request->validated()
            ),
        ]);
    }

    public function appointment(OfficerApplicationActionRequest $request, ServiceApplication $application)
    {
        return response()->json([
            'success' => true,
            'message' => 'Appointment scheduled successfully',
            'data' => $this->applicationService->appointment(
                $application,
                $request->user(),
                $request->validated()
            ),
        ]);
    }

    public function escalateToManager(OfficerApplicationActionRequest $request, ServiceApplication $application)
    {
        return response()->json([
            'success' => true,
            'message' => 'Application escalated to manager successfully',
            'data' => $this->applicationService->escalateToManager(
                $application,
                $request->user(),
                $request->validated()
            ),
        ]);
    }

    public function returnApplication(OfficerApplicationActionRequest $request, ServiceApplication $application)
    {
        return response()->json([
            'success' => true,
            'message' => 'Application returned successfully',
            'data' => $this->applicationService->returnApplication(
                $application,
                $request->user(),
                $request->remark
            ),
        ]);
    }
}