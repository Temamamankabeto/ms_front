<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ServiceFormSection;
use Illuminate\Http\Request;

class ServiceFormSectionController extends Controller
{
    public function index()
    {
        $sections = ServiceFormSection::with('form')
            ->orderBy('service_form_id')
            ->orderBy('sort_order')
            ->latest()
            ->get();

        return response()->json([
            'success' => true,
            'message' => 'Service form sections retrieved successfully',
            'data' => $sections,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'service_form_id' => ['required', 'integer', 'exists:service_forms,id'],
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $section = ServiceFormSection::create($validated)->load('form');

        return response()->json([
            'success' => true,
            'message' => 'Service form section created successfully',
            'data' => $section,
        ], 201);
    }

    public function show(ServiceFormSection $serviceFormSection)
    {
        return response()->json([
            'success' => true,
            'message' => 'Service form section retrieved successfully',
            'data' => $serviceFormSection->load('form'),
        ]);
    }

    public function update(Request $request, ServiceFormSection $serviceFormSection)
    {
        $validated = $request->validate([
            'service_form_id' => ['sometimes', 'integer', 'exists:service_forms,id'],
            'title' => ['sometimes', 'required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $serviceFormSection->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Service form section updated successfully',
            'data' => $serviceFormSection->fresh('form'),
        ]);
    }

    public function destroy(ServiceFormSection $serviceFormSection)
    {
        $serviceFormSection->delete();

        return response()->json([
            'success' => true,
            'message' => 'Service form section deleted successfully',
            'data' => [],
        ]);
    }
}