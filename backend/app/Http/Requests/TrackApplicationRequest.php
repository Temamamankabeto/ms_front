<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class TrackApplicationRequest
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

            'application_number' =>
                'required|string',
        ];
    }
}