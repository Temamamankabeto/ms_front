<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreApplicationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'application_number' => ['nullable', 'string', 'max:255', 'unique:applications,application_number'],
            'customer_id' => ['nullable', 'integer', 'exists:users,id'],
            'service_id' => ['required', 'integer', 'exists:services,id'],
            'status' => ['nullable', Rule::in(['draft', 'submitted', 'under_review', 'returned_for_correction', 'resubmitted', 'approved', 'rejected', 'completed', 'cancelled'])],
            'assigned_to' => ['nullable', 'integer', 'exists:users,id'],
            'submitted_at' => ['nullable', 'date'],
            'completed_at' => ['nullable', 'date'],
            'remarks' => ['nullable', 'string'],
        ];
    }
}
