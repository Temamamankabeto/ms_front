<?php

namespace App\Support;

use Illuminate\Validation\Rules\Password;

class StrongPassword
{
    public static function rules(): array
    {
        return [
            'string',
            'max:255',
            Password::min(8)
                ->mixedCase()
                ->letters()
                ->numbers()
                ->symbols()
                ->uncompromised(),
        ];
    }

    public static function required(): array
    {
        return array_merge(['required'], self::rules());
    }

    public static function nullable(): array
    {
        return array_merge(['nullable'], self::rules());
    }
}
