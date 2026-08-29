<?php

namespace App\Services;

use App\Models\ServiceFormSection;
use Illuminate\Http\Request;

class ServiceFormSectionService
{
    public function list(?Request $request = null)
    {
        $query = ServiceFormSection::with(['form.service', 'step', 'fields.conditions']);

        if ($request?->filled('service_form_id')) {
            $query->where('service_form_id', $request->integer('service_form_id'));
        }

        if ($request?->filled('service_form_step_id')) {
            $query->where('service_form_step_id', $request->integer('service_form_step_id'));
        }

        if ($request?->filled('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        return $query
            ->orderBy('service_form_id')
            ->orderBy('sort_order')
            ->paginate(min((int) ($request?->input('per_page', 20) ?? 20), 100));
    }

    public function create(array $data): ServiceFormSection
    {
        return ServiceFormSection::create($data)->load(['form.service', 'step']);
    }

    public function show(ServiceFormSection $section): ServiceFormSection
    {
        return $section->load(['form.service', 'step', 'fields.conditions']);
    }

    public function update(ServiceFormSection $section, array $data): ServiceFormSection
    {
        $section->update($data);

        return $this->show($section->fresh());
    }

    public function delete(ServiceFormSection $section): bool
    {
        return (bool) $section->delete();
    }
}
