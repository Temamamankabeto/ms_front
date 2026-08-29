<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\AssignWindowToServiceRequest;
use App\Models\Service;
use App\Services\ServiceWindowService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ServiceWindowController extends Controller
{
    public function __construct(
        protected ServiceWindowService $serviceWindowService
    ) {}

    public function board(Request $request): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => 'Service window board retrieved successfully',
            'data' => $this->serviceWindowService->board(
                $request->user(),
                $request->input('level', 'city'),
                $request->integer('subcity_id') ?: null,
                $request->integer('woreda_id') ?: null
            ),
        ]);
    }

    public function move(Request $request): JsonResponse
    {
        $data = $request->validate([
            'service_id' => ['required', 'integer', 'exists:services,id'],
            'window_id' => ['required', 'integer', 'exists:windows,id'],
            'level' => ['required', 'string', 'in:city,subcity,woreda'],
            'step_order' => ['nullable', 'integer', 'min:1'],
            'is_required' => ['nullable', 'boolean'],
        ]);

        $service = $this->serviceWindowService->move(
            $request->user(),
            (int) $data['service_id'],
            (int) $data['window_id'],
            $data['level'],
            (int) ($data['step_order'] ?? 1),
            (bool) ($data['is_required'] ?? true)
        );

        return response()->json([
            'success' => true,
            'message' => 'Service moved to window successfully',
            'data' => $service,
        ]);
    }

    public function unassign(Request $request, Service $service): JsonResponse
    {
        $data = $request->validate([
            'level' => ['required', 'string', 'in:city,subcity,woreda'],
        ]);

        $this->serviceWindowService->unassign(
            $request->user(),
            $service,
            $data['level']
        );

        return response()->json([
            'success' => true,
            'message' => 'Service removed from window successfully',
        ]);
    }

    public function assign(AssignWindowToServiceRequest $request, Service $service): JsonResponse
    {
        $updatedService = $this->serviceWindowService->assign(
            $request->user(),
            $service,
            $request->validated()['windows']
        );

        return response()->json([
            'success' => true,
            'message' => 'Windows assigned successfully',
            'data' => $updatedService,
        ]);
    }

    public function show(Request $request, Service $service): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $this->serviceWindowService->show($request->user(), $service),
        ]);
    }
}
