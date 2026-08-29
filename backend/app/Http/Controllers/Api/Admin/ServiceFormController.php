<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\ServiceForm;
use App\Services\ServiceFormService;
use App\Http\Requests\StoreServiceFormRequest;
use App\Http\Requests\UpdateServiceFormRequest;

class ServiceFormController extends Controller
{
    public function __construct(
        protected ServiceFormService $serviceFormService
    ) {}

    public function index()
    {
        $forms = $this->serviceFormService->getAll();

        return response()->json([
            'success' => true,
            'message' => 'Service forms retrieved successfully',
            'data' => $forms,
        ]);
    }

    public function store(StoreServiceFormRequest $request)
    {
        $form = $this->serviceFormService->create(
            $request->validated()
        );

        return response()->json([
            'success' => true,
            'message' => 'Service form created successfully',
            'data' => $form,
        ], 201);
    }

    public function show(ServiceForm $serviceForm)
    {
        $form = $this->serviceFormService->getOne($serviceForm);

        return response()->json([
            'success' => true,
            'message' => 'Service form retrieved successfully',
            'data' => $form,
        ]);
    }

    public function update(
        UpdateServiceFormRequest $request,
        ServiceForm $serviceForm
    ) {
        $form = $this->serviceFormService->update(
            $serviceForm,
            $request->validated()
        );

        return response()->json([
            'success' => true,
            'message' => 'Service form updated successfully',
            'data' => $form,
        ]);
    }

    public function destroy(ServiceForm $serviceForm)
    {
        $this->serviceFormService->delete($serviceForm);

        return response()->json([
            'success' => true,
            'message' => 'Service form deleted successfully',
        ]);
    }
}