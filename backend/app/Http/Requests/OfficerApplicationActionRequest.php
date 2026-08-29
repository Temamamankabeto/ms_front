<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class OfficerApplicationActionRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'remark' => ['nullable','string','max:2000'],
            'reason' => ['nullable','string','max:2000'],
            'note' => ['nullable','string','max:2000'],
            'message' => ['nullable','string','max:2000'],
            'appointment_message' => ['nullable','string','max:2000'],
            'priority' => ['nullable','string','in:emergency,high,normal,low'],
            'officer_id' => ['nullable','integer','exists:users,id'],
            'to_officer_id' => ['nullable','integer','exists:users,id'],
            'front_officer_id' => ['nullable','integer','exists:users,id'],
            'back_officer_id' => ['nullable','integer','exists:users,id'],
            'manager_id' => ['nullable','integer','exists:users,id'],
            'window_id' => ['nullable','integer','exists:windows,id'],
            'to_window_id' => ['nullable','integer','exists:windows,id'],
            'appointment_at' => ['nullable','date'],
            'appointment_date' => ['nullable','date'],
            'appointment_time' => ['nullable','string','max:20'],
            'appointment_location' => ['nullable','string','max:255'],
            'location' => ['nullable','string','max:255'],
            'documents' => ['nullable','array'],
            'documents.*' => ['file','max:10240'],
        ];
    }
}
