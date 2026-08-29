<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class AssignWindowToServiceRequest extends FormRequest
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

            'windows' => 'required|array|min:1',

            'windows.*.window_id' =>
                'required|exists:windows,id',

            'windows.*.step_order' =>
                'required|integer|min:1',

            'windows.*.is_required' =>
                'required|boolean',

        ];
    }
}