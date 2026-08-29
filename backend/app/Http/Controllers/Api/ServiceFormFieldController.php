<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ServiceFormField;
use Illuminate\Http\Request;

class ServiceFormFieldController extends Controller
{
    public function index(Request $request)
    {
        $query = ServiceFormField::with([
            'form',
            'section',
        ]);

        if ($request->filled('service_form_id')) {
            $query->where(
                'service_form_id',
                $request->integer('service_form_id')
            );
        }

        if ($request->filled('service_form_section_id')) {
            $query->where(
                'service_form_section_id',
                $request->integer('service_form_section_id')
            );
        }

        $fields = $query
            ->orderBy('sort_order')
            ->latest()
            ->get();

        return response()->json([
            'success' => true,
            'message' => 'Service form fields retrieved successfully',
            'data' => $fields,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'service_form_id' => [
                'required',
                'integer',
                'exists:service_forms,id',
            ],

            'service_form_section_id' => [
                'nullable',
                'integer',
                'exists:service_form_sections,id',
            ],

            'label' => [
                'required',
                'string',
                'max:255',
            ],

            'name' => [
                'required',
                'string',
                'max:255',
            ],

            'type' => [
                'required',
                'string',
                'max:100',
            ],

            'placeholder' => [
                'nullable',
                'string',
            ],

            'help_text' => [
                'nullable',
                'string',
            ],

            'default_value' => [
                'nullable',
                'string',
            ],

            'options' => [
                'nullable',
                'array',
            ],

            'validation_rules' => [
                'nullable',
                'array',
            ],

            'is_required' => [
                'nullable',
                'boolean',
            ],

            'is_active' => [
                'nullable',
                'boolean',
            ],

            'sort_order' => [
                'nullable',
                'integer',
                'min:0',
            ],

            'width' => [
                'nullable',
                'string',
                'max:50',
            ],
        ]);

        $field = ServiceFormField::create(
            $validated
        )->load([
            'form',
            'section',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Service form field created successfully',
            'data' => $field,
        ], 201);
    }

    public function show(
        ServiceFormField $serviceFormField
    ) {
        return response()->json([
            'success' => true,
            'message' => 'Service form field retrieved successfully',
            'data' => $serviceFormField->load([
                'form',
                'section',
            ]),
        ]);
    }

    public function update(
        Request $request,
        ServiceFormField $serviceFormField
    ) {
        $validated = $request->validate([
            'service_form_id' => [
                'sometimes',
                'integer',
                'exists:service_forms,id',
            ],

            'service_form_section_id' => [
                'nullable',
                'integer',
                'exists:service_form_sections,id',
            ],

            'label' => [
                'sometimes',
                'required',
                'string',
                'max:255',
            ],

            'name' => [
                'sometimes',
                'required',
                'string',
                'max:255',
            ],

            'type' => [
                'sometimes',
                'required',
                'string',
                'max:100',
            ],

            'placeholder' => [
                'nullable',
                'string',
            ],

            'help_text' => [
                'nullable',
                'string',
            ],

            'default_value' => [
                'nullable',
                'string',
            ],

            'options' => [
                'nullable',
                'array',
            ],

            'validation_rules' => [
                'nullable',
                'array',
            ],

            'is_required' => [
                'nullable',
                'boolean',
            ],

            'is_active' => [
                'nullable',
                'boolean',
            ],

            'sort_order' => [
                'nullable',
                'integer',
                'min:0',
            ],

            'width' => [
                'nullable',
                'string',
                'max:50',
            ],
        ]);

        $serviceFormField->update(
            $validated
        );

        return response()->json([
            'success' => true,
            'message' => 'Service form field updated successfully',
            'data' => $serviceFormField->fresh([
                'form',
                'section',
            ]),
        ]);
    }

    public function destroy(
        ServiceFormField $serviceFormField
    ) {
        $serviceFormField->delete();

        return response()->json([
            'success' => true,
            'message' => 'Service form field deleted successfully',
            'data' => [],
        ]);
    }
}