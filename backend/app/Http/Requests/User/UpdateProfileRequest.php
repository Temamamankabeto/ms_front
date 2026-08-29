<?php

namespace App\Http\Requests\User;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return (bool) $this->user();
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:100'],
            'gender' => ['nullable', 'string', Rule::in(['male', 'female', 'other'])],
            'date_of_birth' => ['nullable', 'date'],
            'address' => ['nullable', 'string', 'max:255'],

            /*
            |--------------------------------------------------------------------------
            | Locked fields
            |--------------------------------------------------------------------------
            | Email, phone, city, subcity and woreda are intentionally not editable
            | from profile page. Admin user-edit page controls those fields.
            */
            'profile' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
            'profile_image' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
        ];
    }
}
