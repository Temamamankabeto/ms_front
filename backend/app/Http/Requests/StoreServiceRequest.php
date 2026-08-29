<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreServiceRequest extends FormRequest
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
    'name' => 'required|string|max:255',
    'description' => 'nullable|string',
    'has_back_officer' => 'boolean',
    'service_fee' => 'required|numeric|min:0',

    'availability' => 'required|array|min:1',
    'availability.*' => 'in:city,subcity,woreda',

    'status' => 'required|in:active,inactive',
];
    }
}