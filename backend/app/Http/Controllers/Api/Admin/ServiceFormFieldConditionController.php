<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreServiceFormFieldConditionRequest;
use App\Http\Requests\UpdateServiceFormFieldConditionRequest;
use App\Models\ServiceFormFieldCondition;
use App\Services\ServiceFormFieldConditionService;
use Illuminate\Http\Request;

class ServiceFormFieldConditionController extends Controller
{
    public function __construct(protected ServiceFormFieldConditionService $conditionService) {}

    public function index(Request $request)
    {
        return $this->success('Service form field conditions retrieved successfully', $this->conditionService->list($request));
    }

    public function store(StoreServiceFormFieldConditionRequest $request)
    {
        return $this->success(
            'Service form field condition created successfully',
            $this->conditionService->create($request->validated()),
            201
        );
    }

    public function show(ServiceFormFieldCondition $serviceFormFieldCondition)
    {
        return $this->success(
            'Service form field condition retrieved successfully',
            $this->conditionService->show($serviceFormFieldCondition)
        );
    }

    public function update(UpdateServiceFormFieldConditionRequest $request, ServiceFormFieldCondition $serviceFormFieldCondition)
    {
        return $this->success(
            'Service form field condition updated successfully',
            $this->conditionService->update($serviceFormFieldCondition, $request->validated())
        );
    }

    public function destroy(ServiceFormFieldCondition $serviceFormFieldCondition)
    {
        $this->conditionService->delete($serviceFormFieldCondition);

        return $this->success('Service form field condition deleted successfully', []);
    }

    protected function success(string $message, mixed $data, int $status = 200)
    {
        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => $data,
        ], $status);
    }
}
