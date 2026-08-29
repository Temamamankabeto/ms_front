<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\ServiceFormField;
use App\Services\ServiceFormFieldService;
use App\Http\Requests\StoreServiceFormFieldRequest;
use App\Http\Requests\UpdateServiceFormFieldRequest;

class ServiceFormFieldController extends Controller
{
    public function __construct(
        protected ServiceFormFieldService $fieldService
    ) {}

    public function index(\Illuminate\Http\Request $request)
    {
        $fields = $this->fieldService->getAll($request);

        return response()->json([
            'success' => true,
            'message' => 'Form fields retrieved successfully',
            'data' => $fields,
        ]);
    }

    public function store(StoreServiceFormFieldRequest $request)
    {
        $field = $this->fieldService->create(
            $request->validated()
        );

        return response()->json([
            'success' => true,
            'message' => 'Form field created successfully',
            'data' => $field,
        ], 201);
    }

    public function show(ServiceFormField $serviceFormField)
    {
        return response()->json([
            'success' => true,
            'message' => 'Form field retrieved successfully',
            'data' => $serviceFormField,
        ]);
    }

    public function update(
        UpdateServiceFormFieldRequest $request,
        ServiceFormField $serviceFormField
    ) {
        $field = $this->fieldService->update(
            $serviceFormField,
            $request->validated()
        );

        return response()->json([
            'success' => true,
            'message' => 'Form field updated successfully',
            'data' => $field,
        ]);
    }

    public function destroy(ServiceFormField $serviceFormField)
    {
        $this->fieldService->delete($serviceFormField);

        return response()->json([
            'success' => true,
            'message' => 'Form field deleted successfully',
        ]);
    }
}