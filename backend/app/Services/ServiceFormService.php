<?php

namespace App\Services;

use App\Models\ServiceForm;
use Illuminate\Http\Request;

class ServiceFormService
{
    public function list(?Request $request = null)
    {
        $query = ServiceForm::with([
            'service',
            'steps.sections.fields.conditions.dependsOnField',
            'sections.fields.conditions.dependsOnField',
            'fields.conditions.dependsOnField',
        ]);

        if ($request?->filled('service_id')) {
            $query->where('service_id', $request->integer('service_id'));
        }

        if ($request?->filled('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        return $query->latest()->paginate(
            min((int) ($request?->input('per_page', 250) ?? 250), 100)
        );
    }

    public function getAll(?Request $request = null)
    {
        return $this->list($request);
    }

    public function show(ServiceForm $serviceForm): ServiceForm
    {
        return $serviceForm->load([
            'service',
            'steps.sections.fields.conditions.dependsOnField',
            'sections.fields.conditions.dependsOnField',
            'fields.conditions.dependsOnField',
        ]);
    }

    public function getOne(ServiceForm $serviceForm): ServiceForm
    {
        return $this->show($serviceForm);
    }

    public function create(array $data): ServiceForm
    {
        return ServiceForm::create($data)->load('service');
    }

    public function update(ServiceForm $serviceForm, array $data): ServiceForm
    {
        $serviceForm->update($data);

        return $this->show($serviceForm->fresh());
    }

    public function delete(ServiceForm $serviceForm): bool
    {
        return (bool) $serviceForm->delete();
    }
}
