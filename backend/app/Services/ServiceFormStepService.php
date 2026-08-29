<?php

namespace App\Services;

use App\Models\ServiceFormStep;
use Illuminate\Http\Request;

class ServiceFormStepService
{
    public function list(?Request $request = null)
    {
        $query = ServiceFormStep::with(['form.service', 'sections.fields.conditions']);

        if ($request?->filled('service_form_id')) {
            $query->where('service_form_id', $request->integer('service_form_id'));
        }

        return $query
            ->orderBy('service_form_id')
            ->orderBy('step_order')
            ->paginate(min((int) ($request?->input('per_page', 20) ?? 20), 100));
    }

    public function create(array $data): ServiceFormStep
    {
        return ServiceFormStep::create($data)->load(['form.service']);
    }

    public function show(ServiceFormStep $step): ServiceFormStep
    {
        return $step->load(['form.service', 'sections.fields.conditions', 'fields.conditions']);
    }

    public function update(ServiceFormStep $step, array $data): ServiceFormStep
    {
        $step->update($data);

        return $this->show($step->fresh());
    }

    public function delete(ServiceFormStep $step): bool
    {
        return (bool) $step->delete();
    }
}
