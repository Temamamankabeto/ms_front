<?php

namespace App\Http\Controllers\Api\Officer;

use App\Http\Controllers\Controller;
use App\Models\ServiceApplication;

class CertificateController extends Controller
{
    public function download(ServiceApplication $application)
    {
        $application->load(['service', 'customer']);

        $content = implode("\n", [
            'MESOB ADAMA SERVICE CERTIFICATE',
            'Tracking Number: ' . $application->tracking_number,
            'Service: ' . ($application->service?->name ?? 'N/A'),
            'Customer: ' . ($application->customer?->name ?? 'N/A'),
            'Status: ' . $application->status,
            'Generated At: ' . now()->toDateTimeString(),
        ]);

        return response($content, 200, [
            'Content-Type' => 'text/plain',
            'Content-Disposition' => 'attachment; filename="certificate-' . $application->tracking_number . '.txt"',
        ]);
    }
}
