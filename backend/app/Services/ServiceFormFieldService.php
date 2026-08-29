<?php

namespace App\Services;

use App\Models\ServiceFormField;
use Illuminate\Http\Request;

class ServiceFormFieldService
{
    public function getAll(?Request $request = null)
    {
        $query = ServiceFormField::with([
            'form.service',
            'section',
            'step',
            'conditions.dependsOnField',
        ]);

        if ($request?->filled('service_form_id')) {
            $query->where('service_form_id', $request->integer('service_form_id'));
        }

        if ($request?->filled('service_form_section_id')) {
            $query->where('service_form_section_id', $request->integer('service_form_section_id'));
        }

        if ($request?->filled('service_form_step_id')) {
            $query->where('service_form_step_id', $request->integer('service_form_step_id'));
        }

        if ($request?->filled('type')) {
            $query->where('type', $request->input('type'));
        }

        if ($request?->filled('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        return $query
            ->orderBy('service_form_id')
            ->orderBy('sort_order')
            ->paginate(min((int) ($request?->input('per_page', 20) ?? 20), 100));
    }

    public function create(array $data): ServiceFormField
    {
        $data = $this->normalize($data);

        return ServiceFormField::create($data)->load([
            'form.service',
            'section',
            'step',
            'conditions',
        ]);
    }

    public function update(ServiceFormField $field, array $data): ServiceFormField
    {
        $field->update($this->normalize($data));

        return $field->fresh([
            'form.service',
            'section',
            'step',
            'conditions.dependsOnField',
        ]);
    }

    public function delete(ServiceFormField $field): bool
    {
        return (bool) $field->delete();
    }

    protected function normalize(array $data): array
    {
        if (array_key_exists('section_id', $data) && !array_key_exists('service_form_section_id', $data)) {
            $data['service_form_section_id'] = $data['section_id'];
        }

        unset($data['section_id']);

        return $data;
    }
}
