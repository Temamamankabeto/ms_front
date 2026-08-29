<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class AssignApplicationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'officer_id' => [
                'required',
                'exists:users,id'
            ],
        ];
    }
}
