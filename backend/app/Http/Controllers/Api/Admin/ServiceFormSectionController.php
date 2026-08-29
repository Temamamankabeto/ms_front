<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreServiceFormSectionRequest;
use App\Http\Requests\UpdateServiceFormSectionRequest;
use App\Models\ServiceFormSection;
use App\Services\ServiceFormSectionService;
use Illuminate\Http\Request;

class ServiceFormSectionController extends Controller
{
    public function __construct(protected ServiceFormSectionService $sectionService) {}

    public function index(Request $request)
    {
        return $this->success('Service form sections retrieved successfully', $this->sectionService->list($request));
    }

    public function store(StoreServiceFormSectionRequest $request)
    {
        return $this->success(
            'Service form section created successfully',
            $this->sectionService->create($request->validated()),
            201
        );
    }

    public function show(ServiceFormSection $serviceFormSection)
    {
        return $this->success('Service form section retrieved successfully', $this->sectionService->show($serviceFormSection));
    }

    public function update(UpdateServiceFormSectionRequest $request, ServiceFormSection $serviceFormSection)
    {
        return $this->success(
            'Service form section updated successfully',
            $this->sectionService->update($serviceFormSection, $request->validated())
        );
    }

    public function destroy(ServiceFormSection $serviceFormSection)
    {
        $this->sectionService->delete($serviceFormSection);

        return $this->success('Service form section deleted successfully', []);
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
