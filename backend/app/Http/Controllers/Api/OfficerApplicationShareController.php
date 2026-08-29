<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ServiceApplication;
use App\Services\OfficerWindowAssignmentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OfficerApplicationShareController extends Controller
{
    public function __construct(
        protected OfficerWindowAssignmentService $service
    ) {}

    public function windows(Request $request): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => 'Officer sharing windows retrieved successfully',
            'data' => $this->service->sharingWindowsForOfficer(
                $request->user(),
                $request->integer('service_id') ?: null
            ),
        ]);
    }

    public function officers(Request $request, int $windowId): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => 'Window officers retrieved successfully',
            'data' => $this->service->officersForWindow(
                $request->user(),
                $windowId,
                $request->input('level'),
                $request->integer('service_id') ?: null
            ),
        ]);
    }

    public function share(Request $request, ServiceApplication $application): JsonResponse
    {
        $data = $request->validate([
            'to_window_id' => ['required', 'integer', 'exists:windows,id'],
            'to_officer_id' => ['required', 'integer', 'exists:users,id'],
            'note' => ['nullable', 'string', 'max:1000'],
            'remark' => ['nullable', 'string', 'max:2000'],
            'documents' => ['nullable', 'array'],
            'documents.*' => ['file', 'max:10240'],
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Application shared successfully',
            'data' => $this->service->shareApplication(
                $request->user(),
                $application,
                (int) $data['to_window_id'],
                (int) $data['to_officer_id'],
                $data['note'] ?? $data['remark'] ?? null
            ),
        ]);
    }
}
