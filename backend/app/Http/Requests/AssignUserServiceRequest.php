<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class AssignUserServiceRequest
    extends FormRequest
{
    /**
     * Determine authorization.
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

            'service_ids' =>
                'required|array|min:1',

            'service_ids.*' =>
                'exists:services,id',
        ];
    }
}