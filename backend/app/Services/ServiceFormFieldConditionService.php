<?php

namespace App\Services;

use App\Models\ServiceFormFieldCondition;
use Illuminate\Http\Request;

class ServiceFormFieldConditionService
{
    public function list(?Request $request = null)
    {
        $query = ServiceFormFieldCondition::with(['field.form', 'dependsOnField']);

        if ($request?->filled('field_id')) {
            $query->where('field_id', $request->integer('field_id'));
        }

        if ($request?->filled('depends_on_field_id')) {
            $query->where('depends_on_field_id', $request->integer('depends_on_field_id'));
        }

        return $query
            ->latest()
            ->paginate(min((int) ($request?->input('per_page', 20) ?? 20), 100));
    }

    public function create(array $data): ServiceFormFieldCondition
    {
        return ServiceFormFieldCondition::create($data)->load(['field.form', 'dependsOnField']);
    }

    public function show(ServiceFormFieldCondition $condition): ServiceFormFieldCondition
    {
        return $condition->load(['field.form', 'dependsOnField']);
    }

    public function update(ServiceFormFieldCondition $condition, array $data): ServiceFormFieldCondition
    {
        $condition->update($data);

        return $this->show($condition->fresh());
    }

    public function delete(ServiceFormFieldCondition $condition): bool
    {
        return (bool) $condition->delete();
    }
}
