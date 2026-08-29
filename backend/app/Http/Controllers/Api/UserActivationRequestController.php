<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\UserActivationRequest;
use App\Services\UserActivationRequestService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserActivationRequestController extends Controller
{
    public function __construct(
        protected UserActivationRequestService $activationRequestService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $requests = $this->activationRequestService->paginate(
            $request->only(['status', 'search', 'per_page']),
            $request->user()
        );

        return response()->json(
            $this->activationRequestService->transform($requests)
        );
    }

    public function verify(Request $request, UserActivationRequest $activationRequest): JsonResponse
    {
        $data = $request->validate([
            'note' => ['nullable', 'string', 'max:1000'],
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Activation request verified and forwarded to city admin.',
            'data' => $this->activationRequestService->verify(
                $activationRequest,
                $request->user(),
                $data['note'] ?? null
            ),
        ]);
    }

    public function approve(Request $request, UserActivationRequest $activationRequest): JsonResponse
    {
        $data = $request->validate([
            'note' => ['nullable', 'string', 'max:1000'],
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Officer activated successfully.',
            'data' => $this->activationRequestService->approve(
                $activationRequest,
                $request->user(),
                $data['note'] ?? null
            ),
        ]);
    }

    public function bulkVerify(Request $request): JsonResponse
    {
        $data = $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['required', 'integer', 'exists:user_activation_requests,id'],
            'note' => ['nullable', 'string', 'max:1000'],
        ]);

        $verified = $this->activationRequestService->bulkVerify(
            $data['ids'],
            $request->user(),
            $data['note'] ?? null
        );

        return response()->json([
            'success' => true,
            'message' => "{$verified} activation request(s) verified successfully.",
            'data' => [
                'verified_count' => $verified,
            ],
        ]);
    }

    public function bulkApprove(Request $request): JsonResponse
    {
        $data = $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['required', 'integer', 'exists:user_activation_requests,id'],
            'note' => ['nullable', 'string', 'max:1000'],
        ]);

        $approved = $this->activationRequestService->bulkApprove(
            $data['ids'],
            $request->user(),
            $data['note'] ?? null
        );

        return response()->json([
            'success' => true,
            'message' => "{$approved} activation request(s) approved successfully.",
            'data' => [
                'approved_count' => $approved,
            ],
        ]);
    }

    public function reject(Request $request, UserActivationRequest $activationRequest): JsonResponse
    {
        $data = $request->validate([
            'reason' => ['required', 'string', 'max:1000'],
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Activation request rejected successfully.',
            'data' => $this->activationRequestService->reject(
                $activationRequest,
                $request->user(),
                $data['reason']
            ),
        ]);
    }
}
