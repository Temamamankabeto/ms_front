<?php

namespace App\Http\Requests\User;

use App\Support\AppRoles;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class AssignUserRoleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'role' => [
                'required',
                'string',
                Rule::in(AppRoles::all()),
                Rule::exists('roles', 'name')
                    ->where(fn ($query) => $query->where('guard_name', 'sanctum')),
            ],
        ];
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('role')) {
            $this->merge([
                'role' => AppRoles::normalize($this->input('role')),
            ]);
        }
    }
}
