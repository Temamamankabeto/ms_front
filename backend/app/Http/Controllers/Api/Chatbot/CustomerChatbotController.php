<?php

namespace App\Http\Controllers\Api\Chatbot;

use App\Http\Controllers\Controller;
use App\Services\RuleBasedChatbotService;
use Illuminate\Http\Request;

class CustomerChatbotController extends Controller
{
    public function __construct(protected RuleBasedChatbotService $chatbot) {}

    public function message(Request $request)
    {
        $validated = $request->validate([
            'message' => ['required', 'string', 'max:1000'],
            'session_id' => ['nullable', 'string', 'max:100'],
            'source' => ['nullable', 'string', 'max:50'],
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Chatbot response generated successfully',
            'data' => $this->chatbot->reply($request->user(), $validated['message'], $validated['session_id'] ?? null, $validated['source'] ?? 'authenticated'),
        ]);
    }
}
