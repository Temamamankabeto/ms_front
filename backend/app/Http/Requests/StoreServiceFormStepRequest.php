<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreServiceFormStepRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'service_form_id' => ['required', 'integer', 'exists:service_forms,id'],
            'title' => ['required', 'string', 'max:255'],
            'step_order' => ['nullable', 'integer', 'min:1'],
        ];
    }
}
