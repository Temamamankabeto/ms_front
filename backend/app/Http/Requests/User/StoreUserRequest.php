<?php

namespace App\Http\Requests\User;

use App\Support\AppRoles;
use App\Support\StrongPassword;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $role = AppRoles::normalize($this->input('role'));
        $level = AppRoles::normalizeLevel($this->input('location_level'));

        return [
            'name' => ['required', 'string', 'max:100'],
            'email' => ['required', 'email', 'max:100', 'unique:users,email'],
            'phone' => ['required', 'string', 'max:20', 'unique:users,phone'],
            'gender' => ['nullable', 'string', Rule::in(['male', 'female', 'other'])],
            'password' => StrongPassword::required(),

            'role' => [
                'required',
                'string',
                Rule::in(AppRoles::all()),
                Rule::exists('roles', 'name')
                    ->where(fn ($query) => $query->where('guard_name', 'sanctum')),
            ],

            'location_level' => [
                Rule::requiredIf(fn () => AppRoles::isScoped($role)),
                'nullable',
                Rule::in(AppRoles::levels()),
            ],

            'date_of_birth' => ['nullable', 'date'],
            'address' => ['nullable', 'string', 'max:255'],

            'city_id' => [
                Rule::requiredIf(fn () => AppRoles::isScoped($role) && in_array($level, ['city', 'subcity', 'woreda'], true)),
                'nullable',
                'integer',
                'exists:cities,id',
            ],
            'subcity_id' => [
                Rule::requiredIf(fn () => AppRoles::isScoped($role) && in_array($level, ['subcity', 'woreda'], true)),
                'nullable',
                'integer',
                'exists:subcities,id',
            ],
            'woreda_id' => [
                Rule::requiredIf(fn () => AppRoles::isScoped($role) && $level === 'woreda'),
                'nullable',
                'integer',
                'exists:woredas,id',
            ],

            'status' => ['nullable', Rule::in(['active', 'disabled'])],
            'is_active' => ['nullable', 'boolean'],
        ];
    }

    protected function prepareForValidation(): void
    {
        $merge = [];

        if ($this->has('role')) {
            $merge['role'] = AppRoles::normalize($this->input('role'));
        }

        if ($this->has('location_level')) {
            $merge['location_level'] = AppRoles::normalizeLevel($this->input('location_level'));
        }

        if ($merge) {
            $this->merge($merge);
        }
    }
}
