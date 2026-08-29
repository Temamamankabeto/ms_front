<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateServiceFormFieldConditionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'field_id' => ['sometimes', 'integer', 'exists:service_form_fields,id'],
            'depends_on_field_id' => [
                'sometimes',
                'integer',
                'exists:service_form_fields,id',
                'different:field_id',
            ],
            'operator' => [
                'nullable',
                'string',
                Rule::in(['equals', 'not_equals', 'contains', 'not_contains', 'greater_than', 'less_than', 'is_empty', 'is_not_empty']),
            ],
            'expected_value' => ['nullable', 'string'],
            'action' => ['nullable', 'string'],
        ];
    }
}
