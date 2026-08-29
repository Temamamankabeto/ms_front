<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateServiceApplicationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'current_window_id' => ['nullable', 'integer', 'exists:windows,id'],
            'current_officer_id' => ['nullable', 'integer', 'exists:users,id'],
            'assigned_to' => ['nullable', 'integer', 'exists:users,id'],
            'assigned_role' => ['nullable', 'string', 'max:100'],
            'status' => ['nullable', Rule::in(['draft', 'submitted', 'under_review', 'returned', 'approved', 'rejected', 'completed'])],
            'current_stage' => ['nullable', 'string', 'max:255'],
            'priority' => ['nullable', Rule::in(['low', 'normal', 'high', 'urgent'])],
            'sla_due_at' => ['nullable', 'date'],
            'rejection_reason' => ['nullable', 'string'],
            'remark' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
