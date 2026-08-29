<?php

namespace App\Http\Requests\Role;

use Illuminate\Foundation\Http\FormRequest;

class IndexPermissionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'search' => ['nullable', 'string', 'max:100'],
        ];
    }
}