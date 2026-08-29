<?php

namespace App\Services;

use App\Models\ServiceApplication;

class ApplicationPaymentService
{
    public function initialize(ServiceApplication $application): array
    {
        return [
            'status' => 'pending',
            'provider' => 'manual',
            'amount' => $application->service->service_fee ?? 0,
        ];
    }
}
