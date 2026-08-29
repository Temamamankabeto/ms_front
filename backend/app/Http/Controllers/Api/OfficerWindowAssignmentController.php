<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\OfficerWindowAssignmentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OfficerWindowAssignmentController extends Controller
{
    public function __construct(
        protected OfficerWindowAssignmentService $service
    ) {}

    public function board(Request $request): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => 'Officer window assignment board retrieved successfully',
            'data' => $this->service->board(
                $request->user(),
                $request->input('level', 'city'),
                $request->integer('subcity_id') ?: null,
                $request->integer('woreda_id') ?: null
            ),
        ]);
    }

    public function assign(Request $request): JsonResponse
    {
        $data = $request->validate([
            'officer_id' => ['required', 'integer', 'exists:users,id'],
            'window_id' => ['required', 'integer', 'exists:windows,id'],
            'level' => ['required', 'string', 'in:city,subcity,woreda'],
            'subcity_id' => ['nullable', 'integer', 'exists:subcities,id'],
            'woreda_id' => ['nullable', 'integer', 'exists:woredas,id'],
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Officer assigned to window successfully',
            'data' => $this->service->assign(
                $request->user(),
                (int) $data['officer_id'],
                (int) $data['window_id'],
                $data['level'],
                isset($data['subcity_id']) ? (int) $data['subcity_id'] : null,
                isset($data['woreda_id']) ? (int) $data['woreda_id'] : null
            ),
        ]);
    }

    public function unassign(Request $request): JsonResponse
    {
        $data = $request->validate([
            'officer_id' => ['required', 'integer', 'exists:users,id'],
            'window_id' => ['required', 'integer', 'exists:windows,id'],
            'level' => ['required', 'string', 'in:city,subcity,woreda'],
        ]);

        $this->service->unassign(
            $request->user(),
            (int) $data['officer_id'],
            (int) $data['window_id'],
            $data['level']
        );

        return response()->json([
            'success' => true,
            'message' => 'Officer removed from window successfully',
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
                $request->input('level')
            ),
        ]);
    }
}
