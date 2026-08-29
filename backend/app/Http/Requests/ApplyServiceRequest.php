<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ApplyServiceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $level = $this->input('administrative_level');

        return [
            'administrative_level' => [
                'required',
                Rule::in(['city', 'subcity', 'woreda']),
            ],

            'city_id' => [
                'required',
                'integer',
                'exists:cities,id',
            ],

            'subcity_id' => [
                Rule::requiredIf(fn () => in_array($level, ['subcity', 'woreda'], true)),
                'nullable',
                'integer',
                'exists:subcities,id',
            ],

            'woreda_id' => [
                Rule::requiredIf(fn () => $level === 'woreda'),
                'nullable',
                'integer',
                'exists:woredas,id',
            ],

            'data' => [
                'required',
                'array',
            ],

            'files' => [
                'nullable',
                'array',
            ],

            'files.*' => [
                'nullable',
                'file',
                'max:10240',
                'mimes:jpg,jpeg,png,pdf,doc,docx',
            ],
        ];
    }
}
