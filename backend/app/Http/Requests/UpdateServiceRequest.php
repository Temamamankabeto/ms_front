<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateServiceRequest extends FormRequest
{
    /**
     * Determine if the user is authorized.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Validation rules.
     */
    public function rules(): array
    {
        return [
            'name' => 'sometimes|required|string|max:255',

            'description' => 'nullable|string',

            'has_back_officer' => 'sometimes|boolean',

            'service_fee' => 'sometimes|required|numeric|min:0',

            'availability' => 'sometimes|required|array|min:1',

            'availability.*' => 'in:city,subcity,woreda',

            'status' => 'sometimes|required|in:active,inactive',
        ];
    }
}