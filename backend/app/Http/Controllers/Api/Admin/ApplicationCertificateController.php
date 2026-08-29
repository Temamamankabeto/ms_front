<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\ServiceApplication;
use App\Services\ApplicationCertificateService;

class ApplicationCertificateController extends Controller
{
    public function __construct(
        protected ApplicationCertificateService $service
    ) {}

    public function generate(ServiceApplication $application)
    {
        return response()->json([
            'success' => true,
            'message' => 'Certificate generated successfully',
            'data' => $this->service->generate($application),
        ]);
    }
}
