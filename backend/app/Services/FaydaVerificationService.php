<?php

namespace App\Services;

class FaydaVerificationService
{
    public function verify(
        string $faydaId,
        string $fullName
    ): array {
        return [
            'verified' => true,
            'fayda_id' => $faydaId,
            'full_name' => $fullName,
            'message' => 'Mock Fayda verification successful',
        ];
    }
}
