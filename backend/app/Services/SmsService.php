<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SmsService
{
    private string $baseUrl;
    private string $token;
    private string $senderId;

    public function __construct()
    {
        $this->baseUrl = rtrim(env('DAGU_SMS_BASE_URL', ''), '/');
        $this->token = trim(env('DAGU_SMS_TOKEN', ''));
        $this->senderId = env('DAGU_SMS_SENDER_ID', '9141');

        if (empty($this->baseUrl) || empty($this->token)) {
            throw new \Exception('Dagu SMS configuration is missing.');
        }
    }

    /**
     * Send SMS to a phone number.
     */
    public function sendToPhone(string $phone, string $message): array
    {
        return $this->sendSms($phone, $message);
    }

    /**
     * Alias method.
     */
    public function sendByPhone(string $phone, string $message): array
    {
        return $this->sendSms($phone, $message);
    }

    /**
     * Send OTP.
     */
    public function sendOtp(string $phone): array
    {
        $otp = random_int(100000, 999999);

        $message = "Your verification code is {$otp}";

        return [
            'otp' => $otp,
            'response' => $this->sendSms($phone, $message),
        ];
    }

    /**
     * Send Bulk SMS.
     */
    public function sendBulk(array $phones, string $message): array
    {
        $results = [];

        foreach ($phones as $phone) {
            $results[] = $this->sendSms($phone, $message);
        }

        return $results;
    }

    /**
     * Send SMS using Dagu API.
     */
    private function sendSms(string $phone, string $message): array
    {
        try {

            $phone = $this->normalizePhone($phone);

            $url = $this->baseUrl . '/by-phone';

            Log::info('Sending SMS', [
                'url' => $url,
                'phone' => $phone,
                'senderID' => $this->senderId,
            ]);

            $response = Http::timeout(60)
                ->acceptJson()
                ->withHeaders([
                    'Authorization' => 'Bearer ' . $this->token,
                    'Content-Type' => 'application/json',
                ])
                ->post($url, [
                    'senderID' => $this->senderId,
                    'phone' => $phone,
                    'message' => $message,
                    'flash' => false,
                ]);

            Log::info('Dagu SMS Response', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            return [
                'success' => $response->successful(),
                'status' => $response->status(),
                'body' => $response->body(),
                'json' => $response->json(),
            ];

        } catch (\Throwable $e) {

            Log::error('Dagu SMS Exception', [
                'message' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'status' => 500,
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Normalize Ethiopian phone number.
     *
     * 0912345678  -> 251912345678
     * 912345678   -> 251912345678
     * +251912345678 -> 251912345678
     */
    private function normalizePhone(string $phone): string
    {
        $phone = preg_replace('/[^0-9]/', '', $phone);

        if (str_starts_with($phone, '09')) {
            return '251' . substr($phone, 1);
        }

        if (str_starts_with($phone, '9')) {
            return '251' . $phone;
        }

        if (str_starts_with($phone, '251')) {
            return $phone;
        }

        return $phone;
    }
}