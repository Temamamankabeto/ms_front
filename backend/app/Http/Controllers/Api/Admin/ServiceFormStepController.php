<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreServiceFormStepRequest;
use App\Http\Requests\UpdateServiceFormStepRequest;
use App\Models\ServiceFormStep;
use App\Services\ServiceFormStepService;
use Illuminate\Http\Request;

class ServiceFormStepController extends Controller
{
    public function __construct(protected ServiceFormStepService $stepService) {}

    public function index(Request $request)
    {
        return $this->success('Service form steps retrieved successfully', $this->stepService->list($request));
    }

    public function store(StoreServiceFormStepRequest $request)
    {
        return $this->success(
            'Service form step created successfully',
            $this->stepService->create($request->validated()),
            201
        );
    }

    public function show(ServiceFormStep $serviceFormStep)
    {
        return $this->success('Service form step retrieved successfully', $this->stepService->show($serviceFormStep));
    }

    public function update(UpdateServiceFormStepRequest $request, ServiceFormStep $serviceFormStep)
    {
        return $this->success(
            'Service form step updated successfully',
            $this->stepService->update($serviceFormStep, $request->validated())
        );
    }

    public function destroy(ServiceFormStep $serviceFormStep)
    {
        $this->stepService->delete($serviceFormStep);

        return $this->success('Service form step deleted successfully', []);
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
