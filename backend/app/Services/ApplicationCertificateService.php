<?php

namespace App\Services;

use App\Models\ServiceApplication;

class ApplicationCertificateService
{
    public function generate(ServiceApplication $application): array
    {
        return [
            'certificate_number' => 'CERT-' . $application->id,
            'tracking_number' => $application->tracking_number,
            'verification_url' =>
                url('/verify/' . $application->tracking_number),
        ];
    }
}
