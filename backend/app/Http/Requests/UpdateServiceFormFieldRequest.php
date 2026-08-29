<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateServiceFormFieldRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'service_form_id' => ['sometimes', 'exists:service_forms,id'],
            'service_form_section_id' => ['nullable', 'integer', 'exists:service_form_sections,id'],
            'service_form_step_id' => ['nullable', 'integer', 'exists:service_form_steps,id'],
            'label' => ['sometimes', 'required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:1000'],
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'type' => ['sometimes', 'required', 'in:text,textarea,number,email,tel,date,select,radio,checkbox,file,image'],
            'options' => ['nullable', 'array'],
            'placeholder' => ['nullable', 'string', 'max:255'],
            'help_text' => ['nullable', 'string', 'max:1000'],
            'default_value' => ['nullable', 'string', 'max:1000'],
            'validation_rules' => ['nullable'],
            'is_required' => ['nullable', 'boolean'],
            'is_active' => ['nullable', 'boolean'],
            'is_searchable' => ['nullable', 'boolean'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'width' => ['nullable', 'in:full,half,third,quarter'],
        ];
    }
}
