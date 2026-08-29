<?php

namespace App\Http\Requests\Role;

use App\Support\AppRoles;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateRoleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $roleId = $this->route('id') ?? $this->route('role');

        return [
            'name' => [
                'required',
                'string',
                'max:100',
                Rule::in(AppRoles::all()),
                Rule::unique('roles', 'name')
                    ->ignore($roleId)
                    ->where(fn ($query) => $query->where('guard_name', 'sanctum')),
            ],
        ];
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('name')) {
            $this->merge([
                'name' => AppRoles::normalize($this->input('name')),
            ]);
        }
    }
}
