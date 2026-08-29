<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateWindowRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $levels = (array) $this->input('availability', []);

        return [
            'name' => ['sometimes', 'required', 'string', 'max:255'],

            /*
            |--------------------------------------------------------------------------
            | Administrative levels as checkboxes
            |--------------------------------------------------------------------------
            */
            'availability' => ['sometimes', 'required', 'array', 'min:1'],
            'availability.*' => ['required', Rule::in(['city', 'subcity', 'woreda'])],

            /*
            |--------------------------------------------------------------------------
            | Dynamic titles per selected level
            |--------------------------------------------------------------------------
            */
            'city_title' => [
                Rule::requiredIf(fn () => in_array('city', $levels, true)),
                'nullable',
                'string',
                'max:255',
            ],
            'subcity_title' => [
                Rule::requiredIf(fn () => in_array('subcity', $levels, true)),
                'nullable',
                'string',
                'max:255',
            ],
            'woreda_title' => [
                Rule::requiredIf(fn () => in_array('woreda', $levels, true)),
                'nullable',
                'string',
                'max:255',
            ],

            /*
            |--------------------------------------------------------------------------
            | Optional scope fields for future filtering/routing
            |--------------------------------------------------------------------------
            */
            'city_id' => ['nullable', 'integer', 'exists:cities,id'],
            'subcity_id' => ['nullable', 'integer', 'exists:subcities,id'],
            'woreda_id' => ['nullable', 'integer', 'exists:woredas,id'],
        ];
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('availability')) {
            $levels = collect((array) $this->input('availability'))
                ->map(fn ($level) => strtolower(trim((string) $level)))
                ->filter(fn ($level) => in_array($level, ['city', 'subcity', 'woreda'], true))
                ->unique()
                ->values()
                ->all();

            $this->merge([
                'availability' => $levels,
            ]);
        }
    }
}
