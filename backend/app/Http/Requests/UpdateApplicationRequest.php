<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateApplicationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'customer_id' => ['nullable', 'integer', 'exists:users,id'],
            'service_id' => ['nullable', 'integer', 'exists:services,id'],
            'status' => ['nullable', Rule::in(['draft', 'submitted', 'under_review', 'returned_for_correction', 'resubmitted', 'approved', 'rejected', 'completed', 'cancelled'])],
            'assigned_to' => ['nullable', 'integer', 'exists:users,id'],
            'submitted_at' => ['nullable', 'date'],
            'completed_at' => ['nullable', 'date'],
            'remarks' => ['nullable', 'string'],
        ];
    }
}
