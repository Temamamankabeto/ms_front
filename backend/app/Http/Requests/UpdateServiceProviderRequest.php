<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateServiceProviderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $serviceProvider = $this->route('serviceProvider');

        return [
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('service_providers', 'name')->ignore($serviceProvider?->id),
            ],
        ];
    }
}
