<?php

namespace App\Services;

class ApplicationQrService
{
    public function verificationUrl(string $trackingNumber): string
    {
        return url('/verify/' . $trackingNumber);
    }
}
