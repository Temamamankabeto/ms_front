<?php

namespace App\Http\Controllers\Api\Public;

use App\Http\Controllers\Controller;
use App\Http\Requests\Public\StoreContactMessageRequest;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class ContactController extends Controller
{
    public function store(StoreContactMessageRequest $request)
    {
        $payload = $request->validated();
        $to = env('CONTACT_MAIL_TO', 'temamaman156@gmail.com');

        try {
            Mail::raw(
                "New contact message from Adama MESOB eService\n\n" .
                "Name: {$payload['name']}\n" .
                "Email: {$payload['email']}\n\n" .
                "Message:\n{$payload['message']}",
                function ($message) use ($payload, $to) {
                    $message->to($to)
                        ->replyTo($payload['email'], $payload['name'])
                        ->subject('Adama MESOB eService Contact Message');
                }
            );
        } catch (\Throwable $e) {
            Log::error('Contact message email failed', [
                'error' => $e->getMessage(),
                'email' => $payload['email'],
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Unable to send your message right now. Please try again later.',
                'data' => null,
                'meta' => null,
            ], 500);
        }

        return response()->json([
            'success' => true,
            'message' => 'Your message has been sent successfully.',
            'data' => null,
            'meta' => null,
        ], 201);
    }
}
